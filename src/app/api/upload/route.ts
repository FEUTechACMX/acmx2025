import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth";
import { isEventAdmin } from "@/types/auth";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Built once at module scope rather than per request. It was previously
 * constructed inside the handler *above* the auth check, so the service-role
 * client — which bypasses row-level security — was instantiated even for
 * callers who were about to be rejected (CLEANUP.md §2.8).
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * What each bucket is allowed to hold. The upload UIs already constrain this
 * (`accept="image/*"` everywhere except the video managers), but an `accept`
 * attribute is a file-picker hint, not a check.
 */
const BUCKET_KINDS = {
  events: "image",
  eventCard: "image",
  merch: "image",
  videos: "video",
} as const;

type Bucket = keyof typeof BUCKET_KINDS;
type Kind = (typeof BUCKET_KINDS)[Bucket];

/**
 * Content type read from the bytes, not from the request.
 *
 * The old version took the extension from `file.name` and passed `file.type`
 * through to Supabase — both caller-controlled — then wrote with `upsert: true`
 * into a public bucket. That let an officer store arbitrary content, HTML and
 * SVG included, on the project's public Supabase origin and have it served
 * with a content type of their choosing (CLEANUP.md §2.6).
 *
 * Note SVG is deliberately absent: it is a script-bearing format, and "an image"
 * that can carry JavaScript is exactly the payload this is here to refuse.
 */
const SIGNATURES: { mime: string; ext: string; kind: Kind; test: (b: Buffer) => boolean }[] = [
  {
    mime: "image/jpeg",
    ext: "jpg",
    kind: "image",
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    ext: "png",
    kind: "image",
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    mime: "image/gif",
    ext: "gif",
    kind: "image",
    test: (b) => b.subarray(0, 4).toString("ascii") === "GIF8",
  },
  {
    mime: "image/webp",
    ext: "webp",
    kind: "image",
    test: (b) =>
      b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    // ISO base media: the brand box starts at offset 4. Covers .mp4 and .mov.
    mime: "video/mp4",
    ext: "mp4",
    kind: "video",
    test: (b) => b.subarray(4, 8).toString("ascii") === "ftyp",
  },
  {
    // Matroska / WebM share the EBML magic.
    mime: "video/webm",
    ext: "webm",
    kind: "video",
    test: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  },
];

function sniff(buffer: Buffer) {
  if (buffer.length < 12) return null;
  return SIGNATURES.find((s) => s.test(buffer)) ?? null;
}

// POST /api/upload — server-side upload to Supabase Storage (bypasses RLS)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, isEventAdmin);
    if (!auth.ok) return auth.response;

    const formData = await req.formData();
    const bucket = formData.get("bucket") as string;
    const files = formData.getAll("files") as File[];

    if (!bucket || !(bucket in BUCKET_KINDS)) {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }
    const expectedKind = BUCKET_KINDS[bucket as Bucket];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 50MB limit` },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      const kind = sniff(buffer);
      if (!kind) {
        return NextResponse.json(
          { error: `"${file.name}" is not a file type we accept.` },
          { status: 400 }
        );
      }
      if (kind.kind !== expectedKind) {
        return NextResponse.json(
          {
            error: `"${file.name}" looks like ${kind.mime}, but this upload takes ${expectedKind} files.`,
          },
          { status: 400 }
        );
      }

      // Name and content type both come from the sniffed result, so neither is
      // the caller's to choose. `upsert` stays off: the name is random, so an
      // upsert could only ever clobber something already there.
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${kind.ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: kind.mime,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json(
          { error: `Failed to upload "${file.name}": ${uploadError.message}` },
          { status: 500 }
        );
      }

      const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
      urls.push(data.publicUrl);
    }

    return NextResponse.json({ urls });
  } catch (err) {
    console.error("Upload API error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
