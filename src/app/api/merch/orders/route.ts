import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { serializeOrder } from "@/lib/merch";

export const dynamic = "force-dynamic";

// GET /api/merch/orders — the signed-in member's own reservations.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const orders = await prisma.merchOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { lines: true },
    });

    return NextResponse.json({ ok: true, orders: orders.map((o) => serializeOrder(o)) });
  } catch (err) {
    console.error("merch/orders error:", err);
    return NextResponse.json({ error: "Failed to load your reservations." }, { status: 500 });
  }
}
