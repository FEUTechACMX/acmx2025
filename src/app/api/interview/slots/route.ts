import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedMember } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApprovedMember(req);
  if (!auth.ok) return auth.response;

  const application = await prisma.jOApplication.findUnique({
    where: { userId: auth.user.id },
    include: { booking: { select: { slotId: true } } },
  });
  if (!application || application.status !== "SHORTLISTED") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const slots = await prisma.interviewSlot.findMany({
    where: { startsAt: { gt: new Date() } },
    orderBy: { startsAt: "asc" },
    include: {
      _count: { select: { bookings: true } },
      interviewer: { select: { firstName: true, lastName: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    bookedSlotId: application.booking?.slotId ?? null,
    slots: slots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      durationMinutes: s.durationMinutes,
      location: s.location,
      capacity: s.capacity,
      remaining: Math.max(0, s.capacity - s._count.bookings),
      interviewer: s.interviewer
        ? [s.interviewer.firstName, s.interviewer.lastName].filter(Boolean).join(" ")
        : null,
    })),
  });
}
