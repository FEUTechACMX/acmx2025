import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApprovedMember } from "@/lib/auth";
import { str } from "@/lib/validation";

export const dynamic = "force-dynamic";

type LockedSlot = { id: string; capacity: number };

export async function POST(req: NextRequest) {
  const auth = await requireApprovedMember(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const slotId = str((body as Record<string, unknown> | null)?.slotId);
  if (!slotId) {
    return NextResponse.json({ error: "Pick a slot." }, { status: 400 });
  }

  const application = await prisma.jOApplication.findUnique({
    where: { userId: auth.user.id },
  });
  if (!application || application.status !== "SHORTLISTED") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<LockedSlot[]>(
        Prisma.sql`SELECT id, capacity FROM "InterviewSlot" WHERE id = ${slotId} FOR UPDATE`
      );
      const slot = locked[0];
      if (!slot) throw Object.assign(new Error("missing"), { status: 404 });

      const taken = await tx.interviewBooking.count({ where: { slotId } });
      if (taken >= slot.capacity) {
        throw Object.assign(new Error("full"), { status: 409 });
      }

      await tx.interviewBooking.deleteMany({ where: { applicationId: application.id } });
      await tx.interviewBooking.create({
        data: { slotId, applicationId: application.id },
      });
    });
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 409) {
      return NextResponse.json({ error: "That slot just filled. Pick another." }, { status: 409 });
    }
    if (status === 404) {
      return NextResponse.json({ error: "That slot is not available." }, { status: 404 });
    }
    console.error("interview book:", err);
    return NextResponse.json({ error: "Could not book that slot." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
