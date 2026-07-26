import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeItem, variantOrder } from "@/lib/merch";

export const dynamic = "force-dynamic";

// GET /api/merch/items — the public storefront catalogue.
// HIDDEN items are excluded here and only here; SOLD_OUT ones stay in the list
// because the design keeps them listed, greyed and un-reservable.
export async function GET() {
  try {
    const items = await prisma.merchItem.findMany({
      where: { status: { not: "HIDDEN" } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: { variants: { orderBy: variantOrder } },
    });

    return NextResponse.json({ ok: true, items: items.map(serializeItem) });
  } catch (err) {
    console.error("merch/items error:", err);
    return NextResponse.json({ error: "Failed to load merchandise." }, { status: 500 });
  }
}
