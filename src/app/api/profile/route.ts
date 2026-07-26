import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateAccount } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dbUser = await getCurrentUser();

    if (!dbUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const currentSessionId = cookieStore.get("session")?.value;

    const [
      recentRegistrations,
      upcomingEvents,
      recentTransactions,
      eventsAttended,
      totalRegistrations,
      sessions,
    ] = await Promise.all([
      prisma.registration.findMany({
        where: { userId: dbUser.id },
        include: { event: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.event.findMany({
        where: { startDate: { gte: new Date() } },
        include: { _count: { select: { registrations: true } } },
        orderBy: { startDate: "asc" },
        take: 5,
      }),
      prisma.transaction.findMany({
        where: { user_id: dbUser.id },
        orderBy: { created_at: "desc" },
        take: 8,
      }),
      prisma.attendance.count({ where: { userId: dbUser.id } }),
      prisma.registration.count({ where: { userId: dbUser.id } }),
      prisma.session.findMany({
        where: { userId: dbUser.studentId, expiresAt: { gte: new Date() } },
        orderBy: { expiresAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      // The editable half of the profile, mirroring `ACCOUNT_FIELDS`.
      account: {
        firstName: dbUser.firstName,
        middleName: dbUser.middleName,
        lastName: dbUser.lastName,
        suffix: dbUser.suffix ?? "",
        personalEmail: dbUser.personalEmail,
        schoolEmail: dbUser.schoolEmail,
        contactNumber: dbUser.contactNumber,
        facebookLink: dbUser.facebookLink,
        discordName: dbUser.discordName ?? "",
        yearLevel: dbUser.yearLevel,
        degreeProgram: dbUser.degreeProgram,
        studentId: dbUser.studentId,
        role: dbUser.role,
        createdAt: dbUser.createdAt,
      },
      // No device or location: the Session model stores only id, user and
      // expiry. Listing what we actually know beats inventing a "Chrome on
      // Windows" we never recorded.
      sessions: sessions.map((s) => ({
        id: s.id,
        expiresAt: s.expiresAt,
        current: s.id === currentSessionId,
      })),
      recentRegistrations: recentRegistrations.map((r) => ({
        id: r.id,
        eventName: r.event.name,
        eventDate: r.event.startDate,
        venue: r.event.venue,
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
        points: dbUser.points,
        eventsAttended,
        totalRegistrations,
      },
    });
  } catch (err) {
    console.error("Error in /api/profile:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Updates the caller's own account details.
 *
 * Scoped to `getCurrentUser()` rather than an id in the body — there is no
 * request shape that lets one member edit another. `validateAccount` drops
 * unknown keys, so `role` and `points` cannot ride along in the payload.
 */
export async function PATCH(req: Request) {
  try {
    const dbUser = await getCurrentUser();

    if (!dbUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }

    const result = validateAccount((body ?? {}) as Record<string, unknown>);
    if (!result.ok) {
      return NextResponse.json({ ok: false, errors: result.errors }, { status: 400 });
    }

    try {
      const updated = await prisma.user.update({
        where: { id: dbUser.id },
        data: result.value,
      });

      return NextResponse.json({
        ok: true,
        message: "Changes saved.",
        account: {
          firstName: updated.firstName,
          middleName: updated.middleName,
          lastName: updated.lastName,
          suffix: updated.suffix ?? "",
          personalEmail: updated.personalEmail,
          contactNumber: updated.contactNumber,
          facebookLink: updated.facebookLink,
          discordName: updated.discordName ?? "",
          yearLevel: updated.yearLevel,
          degreeProgram: updated.degreeProgram,
        },
      });
    } catch (err) {
      // personalEmail carries a unique constraint; surface it on the field
      // that caused it rather than as a generic 500.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = (err.meta?.target as string[] | undefined)?.[0] ?? "personalEmail";
        return NextResponse.json(
          { ok: false, errors: { [target]: "That value is already used by another account." } },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (err) {
    console.error("Error updating profile:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
