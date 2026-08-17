import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { serializeOrder } from "@/lib/merch";

export const dynamic = "force-dynamic";

// PATCH /api/merch/orders/[id] — the member cancels their own reservation.
//
// Cancelling returns the held units to stock. Only a PENDING reservation can be
// withdrawn this way: once an officer marks it READY the stock has been pulled
// from the shelf, and once COLLECTED the transaction is done.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  try {
    const { id } = await params;

    const order = await prisma.merchOrder.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    }
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "This reservation can no longer be cancelled. Talk to an officer." },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const line of order.lines) {
        if (!line.variantId) continue;
        await tx.merchVariant.update({
          where: { id: line.variantId },
          data: { stock: { increment: line.quantity } },
        });
      }
      return tx.merchOrder.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { lines: true },
      });
    });

    return NextResponse.json({ ok: true, order: serializeOrder(updated) });
  } catch (err) {
    console.error("merch/orders/[id] PATCH error:", err);
    return NextResponse.json({ error: "Failed to cancel the reservation." }, { status: 500 });
  }
}
