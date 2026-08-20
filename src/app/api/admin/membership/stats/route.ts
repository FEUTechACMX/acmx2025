import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isSecretariatOrAbove } from "@/types/auth";
import { membershipWindow } from "@/lib/campaign-windows";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/membership/stats — daily registration counts for the drive.
 * Gated to isSecretariatOrAbove (SPEC-D5 §10 / §12.3).
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, isSecretariatOrAbove);
  if (!auth.ok) return auth.response;

  const window = membershipWindow();
  const apps = await prisma.membershipApplication.findMany({
    where: { kind: "NEW" },
    select: {
      createdAt: true,
      status: true,
      bundle: true,
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<
    string,
    { applications: number; members: number; pending: number; approved: number; rejected: number }
  >();

  for (const row of apps) {
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(row.createdAt);

    const cur = byDay.get(day) ?? {
      applications: 0,
      members: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    cur.applications += 1;
    cur.members += row._count.members;
    if (row.status === "PENDING") cur.pending += 1;
    else if (row.status === "APPROVED") cur.approved += 1;
    else if (row.status === "REJECTED") cur.rejected += 1;
    byDay.set(day, cur);
  }

  const days = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  const totals = days.reduce(
    (acc, d) => ({
      applications: acc.applications + d.applications,
      members: acc.members + d.members,
      pending: acc.pending + d.pending,
      approved: acc.approved + d.approved,
      rejected: acc.rejected + d.rejected,
    }),
    { applications: 0, members: 0, pending: 0, approved: 0, rejected: 0 }
  );

  return NextResponse.json({
    ok: true,
    window,
    days,
    totals,
  });
}
