import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { committeeScope } from "@/lib/committee-access";
import type { MemberSearchResultDTO } from "@/types/committee";

export const dynamic = "force-dynamic";

const LIMIT = 25;

/**
 * GET /api/admin/members/search?q=&exclude=id,id
 *
 * The member directory behind the roster picker. Committees are staffed by
 * choosing real accounts, never by typing a name, so this is the only way a
 * roster row gets created — which is also what makes a seat able to grant
 * console access.
 *
 * Open to anyone who can reach the committee console at all, including a head
 * with a single committee: they need to search the whole directory to staff it.
 * It returns nothing an officer can't already see on People & Roles.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const scope = await committeeScope(user);
  if (!scope.hasAny) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const exclude = (url.searchParams.get("exclude") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Each term has to match somewhere, so "luigi 2022" narrows rather than
    // widens — the way a person searching a directory expects it to behave.
    const terms = q.split(/\s+/).filter(Boolean).slice(0, 4);
    const like = (term: string) => ({
      OR: [
        { firstName: { contains: term, mode: "insensitive" as const } },
        { middleName: { contains: term, mode: "insensitive" as const } },
        { lastName: { contains: term, mode: "insensitive" as const } },
        { studentId: { contains: term, mode: "insensitive" as const } },
        { schoolEmail: { contains: term, mode: "insensitive" as const } },
        { degreeProgram: { contains: term, mode: "insensitive" as const } },
      ],
    });

    const users = await prisma.user.findMany({
      where: {
        AND: terms.map(like),
        ...(exclude.length ? { id: { notIn: exclude } } : {}),
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: LIMIT,
      select: {
        id: true,
        studentId: true,
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        schoolEmail: true,
        role: true,
        yearLevel: true,
        degreeProgram: true,
      },
    });

    const results: MemberSearchResultDTO[] = users.map((u) => ({
      id: u.id,
      studentId: u.studentId,
      name: [u.firstName, u.middleName, u.lastName, u.suffix].filter(Boolean).join(" "),
      email: u.schoolEmail,
      role: u.role,
      yearLevel: u.yearLevel,
      degreeProgram: u.degreeProgram,
    }));

    return NextResponse.json({ ok: true, results, limited: results.length === LIMIT });
  } catch (err) {
    console.error("admin/members/search error:", err);
    return NextResponse.json({ error: "Failed to search members." }, { status: 500 });
  }
}
