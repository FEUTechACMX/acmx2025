import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/events/ongoing — returns all events with ongoing status
// Includes both explicitly overridden ONGOING events and date-based ongoing events
export async function GET() {
  try {
    const now = new Date();

    const events = await prisma.event.findMany({
      where: {
        OR: [
          // Explicitly set to ONGOING via statusOverride
          { statusOverride: "ONGOING" },
          // Date-based: started but not ended, and no override set
          {
            startDate: { lte: now },
            endDate: { gte: now },
            statusOverride: null,
          },
        ],
      },
      select: {
        eventId: true,
        name: true,
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(events);
  } catch (err) {
    console.error("Error fetching ongoing events:", err);
    return NextResponse.json([], { status: 500 });
  }
}
