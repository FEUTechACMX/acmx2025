import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isAdmin } from "@/types/auth";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const application = await prisma.membershipApplication.findUnique({
    where: { id },
    select: { proofStorageKey: true },
  });
  if (!application) {
    return NextResponse.json({ error: "That application was not found." }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from("membership-proof")
    .createSignedUrl(application.proofStorageKey, 120);

  if (error || !data?.signedUrl) {
    console.error("membership proof signed url:", error);
    return NextResponse.json({ error: "Could not open the proof image." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: data.signedUrl });
}
