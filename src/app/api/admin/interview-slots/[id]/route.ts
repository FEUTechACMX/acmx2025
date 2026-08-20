import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isAdmin } from "@/types/auth";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  await prisma.interviewSlot.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
