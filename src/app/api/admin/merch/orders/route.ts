import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isAdmin } from "@/types/auth";
import { serializeOrder } from "@/lib/merch";
import { MERCH_ORDER_STATUSES } from "@/types/merch";
import type { MerchOrderStatus } from "@/types/merch";

export const dynamic = "force-dynamic";

// GET /api/admin/merch/orders?status=PENDING — the reservations queue.
// Open reservations sort first: they're the ones an officer has to act on.
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  try {
    const status = req.nextUrl.searchParams.get("status");
    const filter = MERCH_ORDER_STATUSES.includes(status as MerchOrderStatus)
      ? { status: status as MerchOrderStatus }
      : {};

    const orders = await prisma.merchOrder.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      include: {
        lines: true,
        user: {
          select: { firstName: true, lastName: true, studentId: true, schoolEmail: true },
        },
      },
    });

    const open = orders.filter((o) => o.status === "PENDING" || o.status === "READY");

    return NextResponse.json({
      ok: true,
      orders: orders.map(serializeOrder),
      counts: {
        total: orders.length,
        open: open.length,
        pending: orders.filter((o) => o.status === "PENDING").length,
      },
    });
  } catch (err) {
    console.error("admin/merch/orders GET error:", err);
    return NextResponse.json({ error: "Failed to load reservations." }, { status: 500 });
  }
}
