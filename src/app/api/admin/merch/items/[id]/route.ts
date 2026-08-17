import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isAdmin } from "@/types/auth";
import {
  readCategory,
  readStatus,
  readVariants,
  validateItemInput,
  serializeItem,
  uniqueSlug,
  variantOrder,
} from "@/lib/merch";

export const dynamic = "force-dynamic";

// PATCH /api/admin/merch/items/[id] — save the editor.
//
// Variants are reconciled by label rather than replaced wholesale: an existing
// size keeps its id (and so its place in carts and reservations) while its
// stock is updated, and only labels the officer actually removed are deleted.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = (await req.json()) ?? {};

    const existing = await prisma.merchItem.findUnique({
      where: { id },
      include: { variants: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }

    const invalid = validateItemInput(body as Record<string, unknown>);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }

    const name = body.name !== undefined ? String(body.name).trim() : existing.name;
    if (!name) {
      return NextResponse.json({ error: "An item needs a name." }, { status: 400 });
    }

    let price = existing.price;
    if (body.price !== undefined) {
      price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json({ error: "Price must be zero or more." }, { status: 400 });
      }
    }

    const data: Record<string, unknown> = {
      name,
      price,
      category: body.category !== undefined ? readCategory(body.category) : existing.category,
      status: body.status !== undefined ? readStatus(body.status) : existing.status,
      isNewDrop: body.isNewDrop !== undefined ? Boolean(body.isNewDrop) : existing.isNewDrop,
      blurb: body.blurb !== undefined ? String(body.blurb).trim() || null : existing.blurb,
      description:
        body.description !== undefined
          ? String(body.description).trim() || null
          : existing.description,
      images: Array.isArray(body.images)
        ? body.images.filter(Boolean).map(String)
        : existing.images,
      order: body.order !== undefined ? Math.trunc(Number(body.order) || 0) : existing.order,
      pickupNote:
        body.pickupNote !== undefined ? String(body.pickupNote).trim() || null : existing.pickupNote,
      paymentNote:
        body.paymentNote !== undefined
          ? String(body.paymentNote).trim() || null
          : existing.paymentNote,
      restockNote:
        body.restockNote !== undefined
          ? String(body.restockNote).trim() || null
          : existing.restockNote,
    };

    // Renaming re-slugs the item; the old URL stops resolving, which is the
    // right trade for a store nobody has deep-linked into yet.
    if (body.slug !== undefined || name !== existing.name) {
      data.slug = await uniqueSlug(String(body.slug || name), id);
    }

    const incoming = readVariants(body.variants);

    await prisma.$transaction(async (tx) => {
      await tx.merchItem.update({ where: { id }, data });

      if (body.variants === undefined) return;

      const byLabel = new Map(existing.variants.map((v) => [v.label, v]));
      const keep = new Set<string>();

      for (const [i, v] of incoming.entries()) {
        const match = byLabel.get(v.label);
        if (match) {
          keep.add(match.id);
          await tx.merchVariant.update({
            where: { id: match.id },
            data: { stock: v.stock, soldOut: v.soldOut, order: i },
          });
        } else {
          const created = await tx.merchVariant.create({
            data: { itemId: id, label: v.label, stock: v.stock, soldOut: v.soldOut, order: i },
          });
          keep.add(created.id);
        }
      }

      const dropped = existing.variants.filter((v) => !keep.has(v.id)).map((v) => v.id);
      if (dropped.length) {
        await tx.merchVariant.deleteMany({ where: { id: { in: dropped } } });
      }
    });

    const saved = await prisma.merchItem.findUnique({
      where: { id },
      include: { variants: { orderBy: variantOrder } },
    });

    return NextResponse.json({ ok: true, item: saved ? serializeItem(saved) : null });
  } catch (err) {
    console.error("admin/merch/items/[id] PATCH error:", err);
    return NextResponse.json({ error: "Failed to save the item." }, { status: 500 });
  }
}

// DELETE /api/admin/merch/items/[id] — the only destructive path.
//
// Refused while reservations are still open: use SOLD_OUT to retire something
// that has been claimed, or settle the outstanding orders first.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const openLines = await prisma.merchOrderLine.count({
      where: {
        variant: { itemId: id },
        order: { status: { in: ["PENDING", "READY"] } },
      },
    });

    if (openLines > 0) {
      return NextResponse.json(
        {
          error:
            "This item has open reservations. Settle or cancel them first, or mark it sold out instead.",
        },
        { status: 409 }
      );
    }

    await prisma.merchItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin/merch/items/[id] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete the item." }, { status: 500 });
  }
}
