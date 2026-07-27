import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { committeeInclude, serializeCommittee } from "@/lib/committee";

export const dynamic = "force-dynamic";

// GET /api/committees/[slug] — everything the plate renders.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const committee = await prisma.committee.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: committeeInclude,
    });

    if (!committee) {
      return NextResponse.json({ error: "Committee not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, committee: serializeCommittee(committee) });
  } catch (err) {
    console.error("committees/[slug] GET error:", err);
    return NextResponse.json({ error: "Failed to load the committee." }, { status: 500 });
  }
}
