import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { isAdmin } from "@/types/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Overview metrics + a lightweight activity feed for the admin dashboard.
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  try {
    const [events, registrations, attendance, members] = await Promise.all([
      prisma.event.count({ where: { parentId: null } }),
      prisma.registration.count(),
      prisma.attendance.count(),
      prisma.user.count(),
    ]);

    // Events that have finished but recorded no attendance need attention.
    const now = new Date();
    const finishedEvents = await prisma.event.findMany({
      where: { parentId: null, endDate: { lt: now } },
      select: { eventId: true, name: true, _count: { select: { registrations: true } } },
    });
    const missingAttendance: string[] = [];
    for (const e of finishedEvents) {
      const att = await prisma.attendance.count({ where: { eventId: e.eventId } });
      if (e._count.registrations > 0 && att === 0) missingAttendance.push(e.name);
    }

    const recentEvents = await prisma.event.findMany({
      where: { parentId: null },
      orderBy: { startDate: "desc" },
      take: 5,
      select: { name: true, startDate: true },
    });

    const turnout =
      registrations > 0 ? Math.round((attendance / registrations) * 100) : 0;

    return NextResponse.json({
      stats: { events, registrations, attendance, members, turnout },
      needsAttention: {
        missingAttendance: missingAttendance.slice(0, 5),
      },
      recent: recentEvents.map((e) => ({
        name: e.name,
        date: e.startDate,
      })),
    });
  } catch (err) {
    console.error("admin/stats error:", err);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
