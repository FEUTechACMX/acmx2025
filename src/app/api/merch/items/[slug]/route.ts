import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeItem, variantOrder } from "@/lib/merch";

export const dynamic = "force-dynamic";

// GET /api/merch/items/[slug] — one item plus a few others from the same drop.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const item = await prisma.merchItem.findFirst({
      where: { slug, status: { not: "HIDDEN" } },
      include: { variants: { orderBy: variantOrder } },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const more = await prisma.merchItem.findMany({
      where: { status: { not: "HIDDEN" }, id: { not: item.id } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 4,
      include: { variants: { orderBy: variantOrder } },
    });

    return NextResponse.json({
      ok: true,
      item: serializeItem(item),
      more: more.map(serializeItem),
    });
  } catch (err) {
    console.error("merch/items/[slug] error:", err);
    return NextResponse.json({ error: "Failed to load item." }, { status: 500 });
  }
}
