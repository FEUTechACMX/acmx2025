import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
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
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

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

    // One grouped count for the whole list. This used to be a per-event
    // `attendance.count()` inside a Promise.all — 40 events meant 41 queries.
    const attendanceByEvent = await prisma.attendance.groupBy({
      by: ["eventId"],
      where: { eventId: { in: events.map((e) => e.eventId) } },
      _count: { _all: true },
    });

    const attended = new Map(
      attendanceByEvent.map((row) => [row.eventId, row._count._all])
    );

    const withAttendance = events.map((e) => ({
      eventId: e.eventId,
      name: e.name,
      type: e.type,
      startDate: e.startDate,
      image: e.image ?? e.cardImage ?? null,
      registered: e._count.registrations,
      attended: attended.get(e.eventId) ?? 0,
      status: deriveStatus(e.statusOverride, e.startDate, e.endDate),
    }));

    return NextResponse.json({ events: withAttendance });
  } catch (err) {
    console.error("admin/events error:", err);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }
}
