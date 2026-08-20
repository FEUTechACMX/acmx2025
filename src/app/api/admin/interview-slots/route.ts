import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isAdmin } from "@/types/auth";
import { dateTime, integerBetween, required, str, check, hasErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  const slots = await prisma.interviewSlot.findMany({
    orderBy: { startsAt: "asc" },
    include: {
      _count: { select: { bookings: true } },
      interviewer: { select: { firstName: true, lastName: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    slots: slots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      durationMinutes: s.durationMinutes,
      location: s.location,
      capacity: s.capacity,
      booked: s._count.bookings,
      interviewer: s.interviewer
        ? [s.interviewer.firstName, s.interviewer.lastName].filter(Boolean).join(" ")
        : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  const record = body as Record<string, unknown>;
  const errors = check(record, {
    startsAt: [dateTime("Start time")],
    location: [required("Location")],
    capacity: [integerBetween("Capacity", 1, 20)],
  });
  if (hasErrors(errors)) {
    const first = Object.values(errors).find(Boolean) ?? "Check the slot details.";
    return NextResponse.json({ error: first }, { status: 400 });
  }

  const durationRaw = record.durationMinutes;
  const durationMinutes =
    durationRaw === undefined || durationRaw === null || durationRaw === ""
      ? 30
      : Number(durationRaw);
  if (!Number.isInteger(durationMinutes) || durationMinutes < 10 || durationMinutes > 180) {
    return NextResponse.json(
      { error: "Duration must be a whole number of minutes between 10 and 180." },
      { status: 400 }
    );
  }

  const interviewerUserId =
    typeof record.interviewerUserId === "string" && record.interviewerUserId.trim()
      ? record.interviewerUserId.trim()
      : null;

  if (interviewerUserId) {
    const interviewer = await prisma.user.findUnique({
      where: { id: interviewerUserId },
      select: { id: true },
    });
    if (!interviewer) {
      return NextResponse.json({ error: "That interviewer was not found." }, { status: 400 });
    }
  }

  const slot = await prisma.interviewSlot.create({
    data: {
      startsAt: new Date(str(record.startsAt)),
      location: str(record.location),
      capacity: Number(record.capacity ?? 1),
      durationMinutes,
      interviewerUserId,
      createdByUserId: auth.user.id,
    },
  });

  return NextResponse.json({ ok: true, id: slot.id });
}
