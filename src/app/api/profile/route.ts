import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUser = await getCurrentUser();

    if (!dbUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch user's registrations with event details (last 5)
    const recentRegistrations = await prisma.registration.findMany({
      where: { userId: dbUser.id },
      include: { event: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Fetch upcoming events (next 5 by startDate)
    const upcomingEvents = await prisma.event.findMany({
      where: { startDate: { gte: new Date() } },
      include: { _count: { select: { registrations: true } } },
      orderBy: { startDate: "asc" },
      take: 5,
    });

    // Fetch user's recent transactions (last 5)
    const recentTransactions = await prisma.transaction.findMany({
      where: { user_id: dbUser.id },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    // Count total events attended (via attendance records)
    const eventsAttended = await prisma.attendance.count({
      where: { userId: dbUser.id },
    });

    // Count total registrations
    const totalRegistrations = await prisma.registration.count({
      where: { userId: dbUser.id },
    });

    return NextResponse.json({
      ok: true,
      recentRegistrations: recentRegistrations.map((r) => ({
        id: r.id,
        eventName: r.event.name,
        eventDate: r.event.startDate,
        role: r.role,
        createdAt: r.createdAt,
      })),
      upcomingEvents: upcomingEvents.map((e) => ({
        id: e.eventId,
        name: e.name,
        description: e.description,
        venue: e.venue,
        startDate: e.startDate,
        endDate: e.endDate,
        registrations: e._count.registrations,
      })),
      recentTransactions: recentTransactions.map((t) => ({
        id: t.transaction_id,
        type: t.type,
        description: t.description,
        status: t.status,
        points: t.points,
        createdAt: t.created_at,
      })),
      stats: {
        eventsAttended,
        totalRegistrations,
      },
    });
  } catch (err) {
    console.error("Error in /api/profile:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
