import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { holdExpiry, loadCart, orderReference, serializeOrder } from "@/lib/merch";

export const dynamic = "force-dynamic";

/** A checkout that lost a race on stock — reported back per line, not as a blanket 500. */
class OutOfStock extends Error {
  constructor(public readonly item: string) {
    super(`${item} sold out while you were checking out.`);
  }
}

// POST /api/merch/checkout — turn the basket into a reservation.
//
// Nothing is paid online. Checking out decrements stock, holds the units for
// the configured window, and hands back a reference the member quotes at the
// ACM room. Payment and collection happen there, in person.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { error: "Sign in with your ACM account to reserve." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const note = typeof body?.note === "string" ? body.note.trim().slice(0, 280) : null;

    const cart = await loadCart(user.id);

    if (cart.lines.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }
    if (cart.blocked > 0) {
      return NextResponse.json(
        {
          error:
            "Some items in your cart are no longer available. Remove them and try again.",
          cart,
        },
        { status: 409 }
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      for (const line of cart.lines) {
        // Guarded decrement: the WHERE re-checks stock inside the transaction,
        // so two members racing for the last unit can't both win.
        const claimed = await tx.merchVariant.updateMany({
          where: { id: line.variantId, soldOut: false, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (claimed.count === 0) throw new OutOfStock(line.itemName);
      }

      const created = await tx.merchOrder.create({
        data: {
          reference: orderReference(),
          userId: user.id,
          total: cart.subtotal,
          note,
          expiresAt: holdExpiry(),
          lines: {
            create: cart.lines.map((l) => ({
              variantId: l.variantId,
              itemName: l.itemName,
              variantLabel: l.variantLabel,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
            })),
          },
        },
        include: { lines: true },
      });

      await tx.merchCartLine.deleteMany({ where: { userId: user.id } });

      return created;
    });

    return NextResponse.json({ ok: true, order: serializeOrder(order) }, { status: 201 });
  } catch (err) {
    if (err instanceof OutOfStock) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("merch/checkout error:", err);
    return NextResponse.json({ error: "Checkout failed. Nothing was reserved." }, { status: 500 });
  }
}
