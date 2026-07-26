import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/merch/notify — "notify me when restocked" on a sold-out item.
// The list is read by officers in the console; the design promises the restock
// itself is announced on the dashboard, so nothing is emailed from here.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { error: "Sign in with your ACM account to join the restock list." },
      { status: 401 }
    );
  }

  try {
    const { itemId } = (await req.json()) ?? {};
    if (!itemId || typeof itemId !== "string") {
      return NextResponse.json({ error: "Missing item." }, { status: 400 });
    }

    const item = await prisma.merchItem.findUnique({ where: { id: itemId } });
    if (!item || item.status === "HIDDEN") {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }

    // Asking twice is not an error — it just keeps you on the list.
    await prisma.merchRestockRequest.upsert({
      where: { itemId_userId: { itemId, userId: user.id } },
      create: { itemId, userId: user.id },
      update: {},
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("merch/notify error:", err);
    return NextResponse.json({ error: "Failed to join the restock list." }, { status: 500 });
  }
}
