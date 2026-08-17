import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isAdmin } from "@/types/auth";
import { serializeOrder } from "@/lib/merch";
import { MERCH_ORDER_STATUSES } from "@/types/merch";
import type { MerchOrderStatus } from "@/types/merch";

export const dynamic = "force-dynamic";

// PATCH /api/admin/merch/orders/[id] — move a reservation through the queue.
//
// Cancelling puts the held units back on the shelf; every other transition just
// moves the marker. Un-cancelling is not offered — the member reserves again.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const { status } = (await req.json()) ?? {};

    if (!MERCH_ORDER_STATUSES.includes(status as MerchOrderStatus)) {
      return NextResponse.json({ error: "Unknown reservation status." }, { status: 400 });
    }
    const next = status as MerchOrderStatus;

    const order = await prisma.merchOrder.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
    }
    if (order.status === next) {
      return NextResponse.json({ ok: true, order: serializeOrder(order) });
    }
    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "A cancelled reservation can't be reopened. Ask the member to reserve again." },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (next === "CANCELLED") {
        for (const line of order.lines) {
          if (!line.variantId) continue;
          await tx.merchVariant.update({
            where: { id: line.variantId },
            data: { stock: { increment: line.quantity } },
          });
        }
      }
      return tx.merchOrder.update({
        where: { id },
        data: { status: next },
        include: {
          lines: true,
          user: {
            select: { firstName: true, lastName: true, studentId: true, schoolEmail: true },
          },
        },
      });
    });

    return NextResponse.json({ ok: true, order: serializeOrder(updated) });
  } catch (err) {
    console.error("admin/merch/orders/[id] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update the reservation." }, { status: 500 });
  }
}
