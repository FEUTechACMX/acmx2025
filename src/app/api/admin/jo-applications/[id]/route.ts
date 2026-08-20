import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isAdmin } from "@/types/auth";
import { str } from "@/lib/validation";
import type { JOApplicationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const TRANSITIONS: Record<string, JOApplicationStatus> = {
  shortlist: "SHORTLISTED",
  unshortlist: "PENDING",
  accept: "ACCEPTED",
  waitlist: "WAITLISTED",
  reject: "REJECTED",
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const action = str((body as Record<string, unknown> | null)?.action);
  const next = TRANSITIONS[action];
  if (!next) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const application = await prisma.jOApplication.findUnique({
    where: { id },
    include: {
      targetCommittee: { select: { id: true, track: true } },
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  if (!application) {
    return NextResponse.json({ error: "That application was not found." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.jOApplication.update({
      where: { id },
      data: { status: next, decidedByUserId: auth.user.id, decidedAt: new Date() },
    });

    if (action === "unshortlist") {
      await tx.interviewBooking.deleteMany({ where: { applicationId: id } });
    }

    if (action === "accept") {
      await tx.user.update({
        where: { id: application.userId },
        data: { role: "JUNIOR_OFFICER" },
      });
      const position = application.targetCommittee.track === "DEV" ? "JUNIOR_DEV" : "MEMBER";
      await tx.committeeMember.upsert({
        where: {
          committeeId_userId: {
            committeeId: application.targetCommittee.id,
            userId: application.userId,
          },
        },
        update: { position },
        create: {
          committeeId: application.targetCommittee.id,
          userId: application.userId,
          name: [application.user.firstName, application.user.lastName].filter(Boolean).join(" "),
          position,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
