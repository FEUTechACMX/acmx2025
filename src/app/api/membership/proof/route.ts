import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  clientAddress,
  membershipProofByAddress,
} from "@/lib/rate-limit";
import { BUCKET_KINDS, isBucket, sniff, storageName } from "@/lib/uploads";

export const dynamic = "force-dynamic";

const PROOF_BUCKET = "membership-proof";
const PROOF_MAX = 8 * 1024 * 1024;
const PROOF_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const addressKey = `proof:${clientAddress(req)}`;
  const limited = membershipProofByAddress.check(addressKey);
  if (!limited.allowed) {
    membershipProofByAddress.fail(addressKey);
    return NextResponse.json(
      { error: "Too many uploads. Wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  if (!isBucket(PROOF_BUCKET) || BUCKET_KINDS[PROOF_BUCKET] !== "image") {
    return NextResponse.json({ error: "Proof uploads are not configured." }, { status: 500 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    membershipProofByAddress.fail(addressKey);
    return NextResponse.json({ error: "Attach a proof-of-payment image." }, { status: 400 });
  }
  if (file.size > PROOF_MAX) {
    membershipProofByAddress.fail(addressKey);
    return NextResponse.json(
      { error: "That image is too large. Use a file under 8 MB." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = sniff(buffer);
  if (!kind || kind.kind !== "image" || !PROOF_MIMES.has(kind.mime)) {
    membershipProofByAddress.fail(addressKey);
    return NextResponse.json(
      { error: "Proof of payment must be a JPEG, PNG, or WebP image." },
      { status: 400 }
    );
  }

  const storageKey = storageName(kind.ext);
  const { error } = await supabaseAdmin.storage.from(PROOF_BUCKET).upload(storageKey, buffer, {
    contentType: kind.mime,
    upsert: false,
  });

  if (error) {
    membershipProofByAddress.fail(addressKey);
    console.error("membership proof upload:", error);
    return NextResponse.json({ error: "Could not store the proof image. Try again." }, { status: 500 });
  }

  membershipProofByAddress.reset(addressKey);
  return NextResponse.json({ ok: true, storageKey });
}
