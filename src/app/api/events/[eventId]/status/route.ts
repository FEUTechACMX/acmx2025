import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { EVENT_ADMIN_ROLES } from "@/types/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !EVENT_ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

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
