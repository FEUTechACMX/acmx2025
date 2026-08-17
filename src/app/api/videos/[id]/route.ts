import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { EVENT_ADMIN_ROLES, isEventAdmin } from "@/types/auth";

export const dynamic = "force-dynamic";

// DELETE /api/videos/[id] — admin: remove a featured video.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(req, isEventAdmin);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { id } = await params;
    await prisma.featuredVideo.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error deleting video:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
