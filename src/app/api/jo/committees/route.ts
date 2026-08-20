import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprovedMember } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireApprovedMember(req);
  if (!auth.ok) return auth.response;

  const committees = await prisma.committee.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      emblem: true,
      mandate: true,
      blurb: true,
      questions: {
        where: { active: true },
        orderBy: { order: "asc" },
        select: { id: true, order: true, text: true },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    committees: committees.filter((c) => c.questions.length === 3),
  });
}
