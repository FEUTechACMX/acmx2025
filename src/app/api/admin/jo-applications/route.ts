import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isAdmin } from "@/types/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  const applications = await prisma.jOApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { studentId: true, firstName: true, lastName: true } },
      targetCommittee: { select: { name: true, id: true, track: true } },
    },
    take: 300,
  });

  return NextResponse.json({
    ok: true,
    applications: applications.map((a) => ({
      id: a.id,
      status: a.status,
      createdAt: a.createdAt.toISOString(),
      studentId: a.user.studentId,
      name: [a.user.firstName, a.user.lastName].filter(Boolean).join(" "),
      committee: a.targetCommittee.name,
      committeeId: a.targetCommittee.id,
      track: a.targetCommittee.track,
    })),
  });
}
