import React from "react";
import { prisma } from "@/lib/prisma";
import { committeeInclude, serializeSummary } from "@/lib/committee";
import CommitteeIndex from "@/components/committee/CommitteeIndex";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Committees · FEU Tech ACM",
  description:
    "The committees that carry the chapter's work between events — their rosters, their current work, and their open calls.",
};

export default async function CommitteePage() {
  const committees = await prisma.committee.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: committeeInclude,
  });

  return <CommitteeIndex committees={committees.map((c) => serializeSummary(c))} />;
}
