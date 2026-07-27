import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { serializeItem, variantOrder } from "@/lib/merch";
import ItemDetail from "@/components/merch/ItemDetail";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const item = await prisma.merchItem.findFirst({
    where: { slug, status: { not: "HIDDEN" } },
    include: { variants: { orderBy: variantOrder } },
  });
  if (!item) return null;

  const more = await prisma.merchItem.findMany({
    where: { status: { not: "HIDDEN" }, id: { not: item.id } },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    take: 4,
    include: { variants: { orderBy: variantOrder } },
  });

  return { item: serializeItem(item), more: more.map(serializeItem) };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await prisma.merchItem.findFirst({
    where: { slug, status: { not: "HIDDEN" } },
    select: { name: true, blurb: true },
  });
  return {
    title: item ? `${item.name} · ACMX Merchandise` : "Merchandise · ACMX",
    description: item?.blurb ?? undefined,
  };
}

export default async function MerchandiseItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [data, user] = await Promise.all([load(slug), getCurrentUser()]);

  if (!data) notFound();

  return <ItemDetail item={data.item} more={data.more} signedIn={!!user} />;
}
