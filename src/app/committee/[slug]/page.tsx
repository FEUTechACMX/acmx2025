import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { committeeInclude, serializeCommittee } from "@/lib/committee";
import CommitteePlate from "@/components/committee/CommitteePlate";

export const dynamic = "force-dynamic";

/**
 * The N° in the hero follows the committee's position on the published index,
 * so the numbering a member sees on /committee is the numbering they see here.
 */
async function load(slug: string) {
  const published = await prisma.committee.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: committeeInclude,
  });

  const index = published.findIndex((x) => x.slug === slug);
  if (index === -1) return null;

  return { committee: serializeCommittee(published[index]), index };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const committee = await prisma.committee.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { name: true, blurb: true, mandate: true },
  });

  return {
    title: committee ? `${committee.name} · FEU Tech ACM Committees` : "Committees · FEU Tech ACM",
    description: committee?.blurb ?? committee?.mandate ?? undefined,
  };
}

export default async function CommitteeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await load(slug);

  if (!data) notFound();

  return <CommitteePlate committee={data.committee} index={data.index} />;
}
