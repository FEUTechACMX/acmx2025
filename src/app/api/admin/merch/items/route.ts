import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/types/auth";
import {
  readCategory,
  readStatus,
  readVariants,
  serializeItem,
  uniqueSlug,
  variantOrder,
} from "@/lib/merch";

export const dynamic = "force-dynamic";

async function gate(req: NextRequest) {
  const user = await getCurrentUser(req);
  return user && isAdmin(user.role) ? user : null;
}

// GET /api/admin/merch/items — every item including HIDDEN ones, with the
// restock-list count so officers can see demand on sold-out lines.
export async function GET(req: NextRequest) {
  if (!(await gate(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const items = await prisma.merchItem.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        variants: { orderBy: variantOrder },
        _count: { select: { restockRequests: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      items: items.map((i) => ({
        ...serializeItem(i),
        restockRequests: i._count.restockRequests,
      })),
    });
  } catch (err) {
    console.error("admin/merch/items GET error:", err);
    return NextResponse.json({ error: "Failed to load merchandise." }, { status: 500 });
  }
}

// POST /api/admin/merch/items — create an item and its variant rows.
export async function POST(req: NextRequest) {
  if (!(await gate(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = (await req.json()) ?? {};
    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "An item needs a name." }, { status: 400 });
    }

    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Price must be zero or more." }, { status: 400 });
    }

    // Everything sells in at least one variant — things without sizes get the
    // implicit "ONE SIZE" row so the cart always has something to point at.
    const variants = readVariants(body.variants);
    const rows = variants.length ? variants : [{ label: "ONE SIZE", stock: 0, soldOut: false }];

    const item = await prisma.merchItem.create({
      data: {
        slug: await uniqueSlug(body.slug || name),
        name,
        category: readCategory(body.category),
        blurb: body.blurb ? String(body.blurb).trim() : null,
        description: body.description ? String(body.description).trim() : null,
        price,
        images: Array.isArray(body.images) ? body.images.filter(Boolean).map(String) : [],
        status: readStatus(body.status),
        isNewDrop: Boolean(body.isNewDrop),
        order: Math.trunc(Number(body.order) || 0),
        pickupNote: body.pickupNote ? String(body.pickupNote).trim() : null,
        paymentNote: body.paymentNote ? String(body.paymentNote).trim() : null,
        restockNote: body.restockNote ? String(body.restockNote).trim() : null,
        variants: { create: rows.map((v, i) => ({ ...v, order: i })) },
      },
      include: { variants: { orderBy: variantOrder } },
    });

    return NextResponse.json({ ok: true, item: serializeItem(item) }, { status: 201 });
  } catch (err) {
    console.error("admin/merch/items POST error:", err);
    return NextResponse.json({ error: "Failed to create the item." }, { status: 500 });
  }
}
