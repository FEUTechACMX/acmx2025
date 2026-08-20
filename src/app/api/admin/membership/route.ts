import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isAdmin } from "@/types/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const applications = await prisma.membershipApplication.findMany({
    where: status === "PENDING" || status === "APPROVED" || status === "REJECTED"
      ? { status }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      payer: {
        select: {
          studentId: true,
          firstName: true,
          lastName: true,
          schoolEmail: true,
          membershipStatus: true,
        },
      },
      members: {
        orderBy: { orderIndex: "asc" },
        include: {
          user: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
              schoolEmail: true,
              membershipStatus: true,
            },
          },
        },
      },
    },
    take: 200,
  });

  return NextResponse.json({
    ok: true,
    applications: applications.map((a) => ({
      id: a.id,
      createdAt: a.createdAt.toISOString(),
      bundle: a.bundle,
      kind: a.kind,
      status: a.status,
      rejectionReason: a.rejectionReason,
      decidedAt: a.decidedAt?.toISOString() ?? null,
      payer: {
        studentId: a.payer.studentId,
        name: [a.payer.firstName, a.payer.lastName].filter(Boolean).join(" "),
        schoolEmail: a.payer.schoolEmail,
      },
      members: a.members.map((m) => ({
        studentId: m.user.studentId,
        name: [m.user.firstName, m.user.lastName].filter(Boolean).join(" "),
        schoolEmail: m.user.schoolEmail,
        membershipStatus: m.user.membershipStatus,
        createdAsPending: m.createdAsPending,
        isPayer: m.orderIndex === 0,
      })),
    })),
  });
}
