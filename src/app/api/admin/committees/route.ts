import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth";
import { isAdmin } from "@/types/auth";
import { committeeScope } from "@/lib/committee-access";
import {
  capLeads,
  validateCommitteeInput,
  committeeInclude,
  readFacts,
  readMembers,
  readProjects,
  readResponsibilities,
  readScalars,
  resolveMemberNames,
  serializeCommittee,
  uniqueSlug,
} from "@/lib/committee";

export const dynamic = "force-dynamic";

// GET /api/admin/committees — every committee the caller can reach, fully
// expanded so the console can open the editor without a second round trip.
//
// The top table sees all of them, HIDDEN included. Everyone else sees only the
// committees they hold a seat on, each stamped with EDIT or VIEW so the console
// knows whether to render the editor or a read-only record.
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const scope = await committeeScope(user);
  if (!scope.hasAny)
    return NextResponse.json({ error: "You don't have access to this." }, { status: 403 });

  try {
    const committees = await prisma.committee.findMany({
      where: scope.admin ? {} : { id: { in: [...scope.seats.keys()] } },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: committeeInclude,
    });

    return NextResponse.json({
      ok: true,
      admin: scope.admin,
      committees: committees.map((c) => serializeCommittee(c, scope.access(c.id))),
    });
  } catch (err) {
    console.error("admin/committees GET error:", err);
    return NextResponse.json({ error: "Failed to load committees." }, { status: 500 });
  }
}

// POST /api/admin/committees — create a committee and all of its child rows.
//
// Adding a committee to the chapter is a top-table decision, so this stays
// closed to committee heads even though they can edit the one they run.
//
// Only the name is required. A committee added with nothing else still renders
// a complete page: every block on the plate has its own empty state.
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json().catch(() => null)) ?? {};
    if (typeof body !== "object") {
      return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }

    const invalid = validateCommitteeInput(body as Record<string, unknown>);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }

    const scalars = readScalars(body);

    if (!scalars.name) {
      return NextResponse.json({ error: "A committee needs a name." }, { status: 400 });
    }

    const members = await resolveMemberNames(readMembers(body.members));

    const committee = await prisma.committee.create({
      data: {
        ...scalars,
        slug: await uniqueSlug(body.slug || scalars.name),
        responsibilities: { create: readResponsibilities(body.responsibilities) },
        projects: { create: readProjects(body.projects) },
        facts: { create: readFacts(body.facts) },
        members: { create: capLeads(members, scalars.track) },
      },
      include: committeeInclude,
    });

    return NextResponse.json(
      { ok: true, committee: serializeCommittee(committee, "EDIT") },
      { status: 201 }
    );
  } catch (err) {
    console.error("admin/committees POST error:", err);
    return NextResponse.json({ error: "Failed to create the committee." }, { status: 500 });
  }
}
