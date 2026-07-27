import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { committeeInclude, serializeSummary } from "@/lib/committee";

export const dynamic = "force-dynamic";

// GET /api/committees — the public index.
// HIDDEN committees are excluded here and only here.
export async function GET() {
  try {
    const committees = await prisma.committee.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: committeeInclude,
    });

    return NextResponse.json({ ok: true, committees: committees.map((c) => serializeSummary(c)) });
  } catch (err) {
    console.error("committees GET error:", err);
    return NextResponse.json({ error: "Failed to load committees." }, { status: 500 });
  }
}
