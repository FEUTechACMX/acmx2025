import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FitCard from "@/components/apply/FitCard";

export const dynamic = "force-dynamic";

export default async function FitPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const application = await prisma.jOApplication.findUnique({
    where: { shareToken: token },
    include: {
      user: { select: { firstName: true } },
      targetCommittee: { select: { name: true, emblem: true, mandate: true } },
      answers: { include: { question: { select: { committeeId: true } } } },
    },
  });
  if (!application) notFound();

  const score = application.answers
    .filter((a) => a.question.committeeId === application.targetCommitteeId)
    .reduce((n, a) => n + a.value, 0);

  return (
    <FitCard
      firstName={application.user.firstName}
      committeeName={application.targetCommittee.name}
      mandateExcerpt={(application.targetCommittee.mandate ?? "").slice(0, 220)}
      score={score}
    />
  );
}
