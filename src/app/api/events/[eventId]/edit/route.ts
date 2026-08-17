import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { EVENT_ADMIN_ROLES, isEventAdmin } from "@/types/auth";

// PATCH — update event fields (images, gallery, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = await requireRole(req, isEventAdmin);
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const { eventId } = await params;
    const body = await req.json();

    // Only allow updating specific fields
    const allowedFields = [
      "name", "description", "venue", "dayOfWeek",
      "startDate", "endDate", "price", "priceMember", "priceNonMember",
      "image", "cardImage", "gallery", "statusOverride",
      // Extended event-detail fields (edited from the admin console).
      "eventSemester", "type", "overview", "mainObjective",
      "specificObjectives", "targetParticipants", "registrationFees",
    ];

    const data: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        if (key === "startDate" || key === "endDate") {
          data[key] = new Date(body[key]);
        } else if (key === "price" || key === "priceMember" || key === "priceNonMember") {
          data[key] = Number(body[key]);
        } else {
          data[key] = body[key];
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await prisma.event.update({
      where: { eventId },
      data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating event:", err);
    const message = err instanceof Error ? err.message : "Failed to update event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
