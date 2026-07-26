import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { loadCart } from "@/lib/merch";
import { MAX_PER_VARIANT } from "@/types/merch";

export const dynamic = "force-dynamic";

// The cart is members-only: it lives on the account, not in a browser, so it
// survives a phone-to-laptop switch and can be validated against live stock.
async function requireMember(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return null;
  return user;
}

const UNAUTHED = NextResponse.json(
  { error: "Sign in with your ACM account to use the cart." },
  { status: 401 }
);

// GET /api/merch/cart — the signed-in member's basket, re-validated.
export async function GET(req: NextRequest) {
  const user = await requireMember(req);
  if (!user) return UNAUTHED;

  try {
    return NextResponse.json({ ok: true, cart: await loadCart(user.id) });
  } catch (err) {
    console.error("merch/cart GET error:", err);
    return NextResponse.json({ error: "Failed to load your cart." }, { status: 500 });
  }
}

// POST /api/merch/cart — add a variant, or top up the quantity already there.
export async function POST(req: NextRequest) {
  const user = await requireMember(req);
  if (!user) return UNAUTHED;

  try {
    const { variantId, quantity } = (await req.json()) ?? {};
    const qty = Math.trunc(Number(quantity ?? 1));

    if (!variantId || typeof variantId !== "string") {
      return NextResponse.json({ error: "Missing variant." }, { status: 400 });
    }
    if (!Number.isFinite(qty) || qty < 1) {
      return NextResponse.json({ error: "Quantity must be at least 1." }, { status: 400 });
    }

    const variant = await prisma.merchVariant.findUnique({
      where: { id: variantId },
      include: { item: true },
    });

    if (!variant || variant.item.status === "HIDDEN") {
      return NextResponse.json({ error: "That item is no longer available." }, { status: 404 });
    }
    if (variant.item.status === "SOLD_OUT" || variant.soldOut || variant.stock < 1) {
      return NextResponse.json({ error: "That size is sold out." }, { status: 409 });
    }

    const existing = await prisma.merchCartLine.findUnique({
      where: { userId_variantId: { userId: user.id, variantId } },
    });

    // Never silently exceed what's on the shelf, or the per-member ceiling.
    const ceiling = Math.min(variant.stock, MAX_PER_VARIANT);
    const wanted = (existing?.quantity ?? 0) + qty;
    const capped = Math.min(wanted, ceiling);

    await prisma.merchCartLine.upsert({
      where: { userId_variantId: { userId: user.id, variantId } },
      create: { userId: user.id, variantId, quantity: capped },
      update: { quantity: capped },
    });

    return NextResponse.json({
      ok: true,
      cart: await loadCart(user.id),
      capped: capped < wanted,
      limit: ceiling,
    });
  } catch (err) {
    console.error("merch/cart POST error:", err);
    return NextResponse.json({ error: "Failed to update your cart." }, { status: 500 });
  }
}

// PATCH /api/merch/cart — set an exact quantity on one line (0 removes it).
export async function PATCH(req: NextRequest) {
  const user = await requireMember(req);
  if (!user) return UNAUTHED;

  try {
    const { lineId, quantity } = (await req.json()) ?? {};
    const qty = Math.trunc(Number(quantity));

    if (!lineId || typeof lineId !== "string") {
      return NextResponse.json({ error: "Missing cart line." }, { status: 400 });
    }
    if (!Number.isFinite(qty) || qty < 0) {
      return NextResponse.json({ error: "Invalid quantity." }, { status: 400 });
    }

    const line = await prisma.merchCartLine.findUnique({
      where: { id: lineId },
      include: { variant: true },
    });

    // Scoped to the owner — a line id alone must not be enough to edit a basket.
    if (!line || line.userId !== user.id) {
      return NextResponse.json({ error: "Cart line not found." }, { status: 404 });
    }

    if (qty === 0) {
      await prisma.merchCartLine.delete({ where: { id: lineId } });
    } else {
      const ceiling = Math.min(line.variant.stock, MAX_PER_VARIANT);
      await prisma.merchCartLine.update({
        where: { id: lineId },
        data: { quantity: Math.max(1, Math.min(qty, ceiling)) },
      });
    }

    return NextResponse.json({ ok: true, cart: await loadCart(user.id) });
  } catch (err) {
    console.error("merch/cart PATCH error:", err);
    return NextResponse.json({ error: "Failed to update your cart." }, { status: 500 });
  }
}

// DELETE /api/merch/cart?lineId=… — remove one line, or the whole basket.
export async function DELETE(req: NextRequest) {
  const user = await requireMember(req);
  if (!user) return UNAUTHED;

  try {
    const lineId = req.nextUrl.searchParams.get("lineId");

    if (lineId) {
      await prisma.merchCartLine.deleteMany({ where: { id: lineId, userId: user.id } });
    } else {
      await prisma.merchCartLine.deleteMany({ where: { userId: user.id } });
    }

    return NextResponse.json({ ok: true, cart: await loadCart(user.id) });
  } catch (err) {
    console.error("merch/cart DELETE error:", err);
    return NextResponse.json({ error: "Failed to update your cart." }, { status: 500 });
  }
}
