import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isAdmin } from "@/types/auth";
import { mayFlipMembershipStatus } from "@/lib/membership";
import { str } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const action = str((body as Record<string, unknown>).action);
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Action must be approve or reject." }, { status: 400 });
  }

  const rejectionReason = str((body as Record<string, unknown>).rejectionReason);
  if (action === "reject" && !rejectionReason) {
    return NextResponse.json({ error: "A rejection reason is required." }, { status: 400 });
  }

  const application = await prisma.membershipApplication.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, membershipStatus: true } } } },
    },
  });
  if (!application) {
    return NextResponse.json({ error: "That application was not found." }, { status: 404 });
  }
  if (application.status !== "PENDING") {
    return NextResponse.json({ error: "This application has already been decided." }, { status: 409 });
  }

  const nextStatus = action === "approve" ? "APPROVED" : "REJECTED";
  const nextMemberStatus = action === "approve" ? "APPROVED" : "REJECTED";

  await prisma.$transaction(async (tx) => {
    await tx.membershipApplication.update({
      where: { id },
      data: {
        status: nextStatus,
        decidedByUserId: auth.user.id,
        decidedAt: new Date(),
        rejectionReason: action === "reject" ? rejectionReason : null,
      },
    });

    for (const member of application.members) {
      if (
        !mayFlipMembershipStatus({
          createdAsPending: member.createdAsPending,
          membershipStatus: member.user.membershipStatus,
        })
      ) {
        continue;
      }
      await tx.user.update({
        where: { id: member.user.id },
        data: { membershipStatus: nextMemberStatus },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
