import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedMember } from "@/lib/auth";
import { computeBestFit } from "@/lib/jo-fit";
import { newShareToken, validateJOApplication } from "@/lib/jo-application";
import { joWindow, joWindowOpen } from "@/lib/campaign-windows";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApprovedMember(req);
  if (!auth.ok) return auth.response;

  const application = await prisma.jOApplication.findUnique({
    where: { userId: auth.user.id },
    include: {
      targetCommittee: { select: { name: true, emblem: true } },
      booking: { include: { slot: { select: { startsAt: true, location: true } } } },
    },
  });

  return NextResponse.json({
    ok: true,
    joWindow: joWindow(),
    application: application
      ? {
          id: application.id,
          status: application.status,
          shareToken: application.shareToken,
          targetCommitteeName: application.targetCommittee.name,
          booking: application.booking
            ? {
                startsAt: application.booking.slot.startsAt.toISOString(),
                location: application.booking.slot.location,
              }
            : null,
        }
      : null,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireApprovedMember(req);
  if (!auth.ok) return auth.response;

  if (!joWindowOpen()) {
    return NextResponse.json(
      { error: "Junior Officer applications are not open right now." },
      { status: 403 }
    );
  }

  const existing = await prisma.jOApplication.findUnique({ where: { userId: auth.user.id } });
  if (existing) {
    return NextResponse.json(
      { error: "You already have a Junior Officer application on file." },
      { status: 409 }
    );
  }

  const committees = await prisma.committee.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      questions: {
        where: { active: true },
        select: { id: true, committeeId: true },
      },
    },
  });
  const eligible = committees.filter((c) => c.questions.length === 3);
  const questionIds = eligible.flatMap((c) => c.questions.map((q) => q.id));
  const committeeIds = eligible.map((c) => c.id);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = validateJOApplication(body as Record<string, unknown>, questionIds, committeeIds);
  if (!parsed.ok) {
    const first = Object.values(parsed.errors).find(Boolean) ?? "Please check the form.";
    return NextResponse.json({ error: first, errors: parsed.errors }, { status: 400 });
  }

  const ranked = computeBestFit(
    Object.fromEntries(parsed.value.answers.map((a) => [a.questionId, a.value])),
    eligible.flatMap((c) => c.questions)
  );

  const application = await prisma.jOApplication.create({
    data: {
      userId: auth.user.id,
      targetCommitteeId: parsed.value.targetCommitteeId,
      shareToken: newShareToken(),
      status: "PENDING",
      answers: { create: parsed.value.answers },
    },
  });

  return NextResponse.json({
    ok: true,
    shareToken: application.shareToken,
    suggestedCommitteeId: ranked[0]?.committeeId ?? parsed.value.targetCommitteeId,
  });
}
