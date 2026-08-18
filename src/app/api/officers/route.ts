import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BOARD_ROLES, boardRank, roleLabel } from "@/types/auth";
import type { OfficerDTO } from "@/types/officers";

export const dynamic = "force-dynamic";

/**
 * GET /api/officers — the board, for the public Officers page.
 *
 * Public and unauthenticated, but note what it does *not* return: no student
 * number, no personal email, no contact number. The officers page is a public
 * poster, and the only address on it is the school one an officer is reachable
 * at in the role (CLEANUP.md 2.1 is what that caution is owed to).
 *
 * Who is on the board comes from `User.role`, so promoting someone in People &
 * Roles publishes them here — no deploy, which was the point of 7.4.
 */
export async function GET() {
  try {
    const rows = await prisma.user.findMany({
      where: { role: { in: [...BOARD_ROLES] } },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        schoolEmail: true,
        degreeProgram: true,
        yearLevel: true,
        role: true,
        officerProfile: true,
      },
    });

    const officers: OfficerDTO[] = rows
      // An unpublished profile hides someone from the page without touching
      // their role, which would take their console access with it.
      .filter((u) => u.officerProfile?.published !== false)
      .map((u) => ({
        id: u.id,
        role: u.role,
        roleTitle: roleLabel(u.role),
        name: [u.firstName, u.middleName, u.lastName, u.suffix]
          .filter(Boolean)
          .join(" "),
        tagline: u.officerProfile?.tagline ?? null,
        photo: u.officerProfile?.photo ?? null,
        // From the account, not stored twice.
        course: u.degreeProgram,
        yearLevel: u.yearLevel,
        since: u.officerProfile?.since ?? null,
        email: u.schoolEmail,
        instagram: u.officerProfile?.instagram ?? null,
        linkedin: u.officerProfile?.linkedin ?? null,
        order: u.officerProfile?.order ?? 0,
      }))
      // Rank by post first, then by the manual order within a post, then by
      // name so the list is stable when nothing else distinguishes two people.
      .sort(
        (a, b) =>
          boardRank(a.role) - boardRank(b.role) ||
          a.order - b.order ||
          a.name.localeCompare(b.name)
      );

    return NextResponse.json({ ok: true, officers });
  } catch (err) {
    console.error("officers GET error:", err);
    return NextResponse.json({ error: "Failed to load the officers." }, { status: 500 });
  }
}
