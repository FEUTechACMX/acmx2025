import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/types/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function deriveStatus(
  override: string | null,
  start: Date,
  end: Date
): "UPCOMING" | "ONGOING" | "FINISHED" {
  if (override) return override as "UPCOMING" | "ONGOING" | "FINISHED";
  const now = new Date();
  if (now < start) return "UPCOMING";
  if (now > end) return "FINISHED";
  return "ONGOING";
}

// Full event list with registration + attendance counts for the events manager.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !isAdmin(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const events = await prisma.event.findMany({
      where: { parentId: null },
      orderBy: { startDate: "desc" },
      select: {
        eventId: true,
        name: true,
        type: true,
        startDate: true,
        endDate: true,
        statusOverride: true,
        image: true,
        cardImage: true,
        _count: { select: { registrations: true } },
      },
    });

    const withAttendance = await Promise.all(
      events.map(async (e) => {
        const attendance = await prisma.attendance.count({
          where: { eventId: e.eventId },
        });
        return {
          eventId: e.eventId,
          name: e.name,
          type: e.type,
          startDate: e.startDate,
          image: e.image ?? e.cardImage ?? null,
          registered: e._count.registrations,
          attended: attendance,
          status: deriveStatus(e.statusOverride, e.startDate, e.endDate),
        };
      })
    );

    return NextResponse.json({ events: withAttendance });
  } catch (err) {
    console.error("admin/events error:", err);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}
