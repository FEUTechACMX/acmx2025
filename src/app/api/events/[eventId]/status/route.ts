import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { EVENT_ADMIN_ROLES, isEventAdmin } from "@/types/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = await requireRole(req, isEventAdmin);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { eventId } = await params;
    const { status } = await req.json();

    // Validate status value
    const validStatuses = ["UPCOMING", "ONGOING", "FINISHED", null];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Use UPCOMING, ONGOING, FINISHED, or null (auto)" },
        { status: 400 }
      );
    }

    const updated = await prisma.event.update({
      where: { eventId },
      data: { statusOverride: status },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating event status:", err);
    const message = err instanceof Error ? err.message : "Failed to update status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
