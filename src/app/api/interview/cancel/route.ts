import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedMember } from "@/lib/auth";

export const dynamic = "force-dynamic";

const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const auth = await requireApprovedMember(req);
  if (!auth.ok) return auth.response;

  const application = await prisma.jOApplication.findUnique({
    where: { userId: auth.user.id },
    include: { booking: { include: { slot: { select: { startsAt: true } } } } },
  });
  if (!application?.booking) {
    return NextResponse.json({ error: "You have no booking to cancel." }, { status: 404 });
  }

  const starts = application.booking.slot.startsAt.getTime();
  if (starts - Date.now() < CANCEL_WINDOW_MS) {
    return NextResponse.json(
      { error: "Cancellations close 24 hours before the slot." },
      { status: 409 }
    );
  }

  await prisma.interviewBooking.delete({ where: { id: application.booking.id } });
  return NextResponse.json({ ok: true });
}
