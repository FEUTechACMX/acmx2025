import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { isAdmin, USER_ROLES } from "@/types/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// List all members with their role, for the People & Roles page.
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  try {
    /**
     * A ceiling rather than paging, deliberately (CLEANUP.md §11.4).
     *
     * People & Roles searches and filters client-side, which at chapter scale —
     * a few hundred members — is better than a round trip per keystroke. Paging
     * the query would mean moving search and the role tabs to the server and
     * rewriting that interaction for a problem the chapter does not have yet.
     *
     * What was worth fixing now is the unbounded worst case. The cap is far above
     * any plausible roster, and `total`/`truncated` travel with the response so
     * the console can *say* it is showing a subset. A `take` on its own would have
     * turned a slow page into a lying one, which is worse.
     */
    const LIST_CAP = 2000;

    const [users, total, grouped] = await Promise.all([
      prisma.user.findMany({
        orderBy: [{ createdAt: "asc" }],
        take: LIST_CAP,
        select: {
          studentId: true,
          firstName: true,
          middleName: true,
          lastName: true,
          suffix: true,
          schoolEmail: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count(),
      // Counted in the database over *every* member, not by walking the page —
      // the tally is a summary of the chapter, so it must not follow the cap.
      prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    ]);

    const counts: Record<string, number> = {};
    for (const r of USER_ROLES) counts[r] = 0;
    for (const row of grouped) counts[row.role] = row._count._all;

    return NextResponse.json({
      users: users.map((u) => ({
        studentId: u.studentId,
        name: [u.firstName, u.middleName, u.lastName, u.suffix].filter(Boolean).join(" "),
        email: u.schoolEmail,
        role: u.role,
        joined: u.createdAt,
      })),
      counts,
      total,
      truncated: total > users.length,
    });
  } catch (err) {
    console.error("admin/users error:", err);
    return NextResponse.json({ error: "Failed to load members" }, { status: 500 });
  }
}
