import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientAddress, fitCardByAddress } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const limited = fitCardByAddress.check(clientAddress(req));
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const { token } = await params;
  const application = await prisma.jOApplication.findUnique({
    where: { shareToken: token },
    include: {
      user: { select: { firstName: true } },
      targetCommittee: { select: { name: true, emblem: true, mandate: true } },
      answers: {
        include: { question: { select: { committeeId: true } } },
      },
    },
  });
  if (!application) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const score = application.answers
    .filter((a) => a.question.committeeId === application.targetCommitteeId)
    .reduce((n, a) => n + a.value, 0);

  return NextResponse.json({
    ok: true,
    card: {
      firstName: application.user.firstName,
      committeeName: application.targetCommittee.name,
      emblem: application.targetCommittee.emblem,
      mandateExcerpt: (application.targetCommittee.mandate ?? "").slice(0, 220),
      score,
      max: 21,
    },
  });
}
