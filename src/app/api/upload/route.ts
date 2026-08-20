import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/auth";
import { isEventAdmin } from "@/types/auth";
import {
  BUCKET_KINDS,
  MAX_FILE_SIZE,
  isBucket,
  isPrivateBucket,
  sniff,
  storageName,
} from "@/lib/uploads";

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

// POST /api/upload — server-side upload to Supabase Storage (bypasses RLS).
// The validation rules live in lib/uploads.ts, where they are unit-tested.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, isEventAdmin);
    if (!auth.ok) return auth.response;

    const formData = await req.formData();
    const bucket = formData.get("bucket");
    const files = formData.getAll("files") as File[];

    if (!isBucket(bucket)) {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
    }
    if (isPrivateBucket(bucket)) {
      return NextResponse.json(
        { error: "That bucket is private. Use the dedicated upload endpoint." },
        { status: 400 }
      );
    }
    const expectedKind = BUCKET_KINDS[bucket];

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
      const fileName = storageName(kind.ext);

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
