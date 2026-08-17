import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/auth";
import { isAdmin } from "@/types/auth";
import { committeeAccess, restrictToLeadFields } from "@/lib/committee-access";
import {
  capLeads,
  validateCommitteeInput,
  committeeInclude,
  readFacts,
  readMembers,
  readProjects,
  readResponsibilities,
  readScalars,
  readTrack,
  resolveMemberNames,
  serializeCommittee,
  uniqueSlug,
} from "@/lib/committee";

export const dynamic = "force-dynamic";

// GET /api/admin/committees/[id] — one committee, HIDDEN included, for anyone
// with a seat on it.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  try {
    const { id } = await params;
    const access = await committeeAccess(user, id);
    if (access === "NONE")
      return NextResponse.json(
        { error: "You don't have access to this committee." },
        { status: 403 }
      );

    const committee = await prisma.committee.findUnique({ where: { id }, include: committeeInclude });

    if (!committee) {
      return NextResponse.json({ error: "Committee not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, committee: serializeCommittee(committee, access) });
  } catch (err) {
    console.error("admin/committees/[id] GET error:", err);
    return NextResponse.json({ error: "Failed to load the committee." }, { status: 500 });
  }
}

// PATCH /api/admin/committees/[id] — save the editor.
//
// Open to the top table and to this committee's own leads. A lead's payload is
// narrowed to content and roster first (see LEAD_EDITABLE_FIELDS): publishing,
// ordering, the track and the name stay with the top table, because those are
// decisions about the site rather than about one committee.
//
// Each child collection is replaced wholesale, but only when the key is present
// in the body: a PATCH that just flips `status` leaves the roster alone. Nothing
// foreign-keys into these rows, so replacing them costs no references — unlike
// merch variants, which have to be reconciled by label to survive in carts.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const user = auth.user;

  try {
    const { id } = await params;
    const access = await committeeAccess(user, id);
    if (access !== "EDIT") {
      return NextResponse.json(
        {
          error:
            access === "VIEW"
              ? "You have view access to this committee. Only its head, co-head or an officer can edit it."
              : "You don't have access to this committee.",
        },
        { status: 403 }
      );
    }

    const admin = isAdmin(user.role);
    const raw = (await req.json().catch(() => null)) ?? {};
    if (typeof raw !== "object") {
      return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }
    const body: Record<string, unknown> = admin ? raw : restrictToLeadFields(raw);

    // Validated after the narrowing, so a lead is judged on the fields that
    // actually survive it rather than on everything they sent.
    const invalid = validateCommitteeInput(body);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }

    const existing = await prisma.committee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Committee not found." }, { status: 404 });
    }

    // Fields absent from the payload keep their stored value.
    const merged = readScalars({
      name: body.name ?? existing.name,
      kicker: body.kicker !== undefined ? body.kicker : existing.kicker,
      emblem: body.emblem ?? existing.emblem,
      track: body.track ?? existing.track,
      mandate: body.mandate !== undefined ? body.mandate : existing.mandate,
      blurb: body.blurb !== undefined ? body.blurb : existing.blurb,
      order: body.order ?? existing.order,
      status: body.status ?? existing.status,
      recruiting: body.recruiting ?? existing.recruiting,
      openSeats: body.openSeats ?? existing.openSeats,
      callBody: body.callBody !== undefined ? body.callBody : existing.callBody,
      callDeadline: body.callDeadline !== undefined ? body.callDeadline : existing.callDeadline,
      applyUrl: body.applyUrl !== undefined ? body.applyUrl : existing.applyUrl,
      contactEmail: body.contactEmail !== undefined ? body.contactEmail : existing.contactEmail,
      formedYear: body.formedYear !== undefined ? body.formedYear : existing.formedYear,
    });

    if (!merged.name) {
      return NextResponse.json({ error: "A committee needs a name." }, { status: 400 });
    }

    const data: Record<string, unknown> = { ...merged };

    // Renaming re-slugs the committee. Deep links to the old URL stop resolving,
    // which is the right trade while the section is this young.
    if (body.slug !== undefined || merged.name !== existing.name) {
      data.slug = await uniqueSlug(String(body.slug || merged.name), id);
    }

    // Switching tracks re-files the roster: positions from the outgoing track
    // become the incoming track's rank-and-file seat, so nothing is orphaned.
    const track = readTrack(merged.track);
    const members =
      body.members !== undefined
        ? capLeads(await resolveMemberNames(readMembers(body.members)), track)
        : track !== existing.track
          ? capLeads(
              (
                await prisma.committeeMember.findMany({
                  where: { committeeId: id },
                  orderBy: { order: "asc" },
                })
              ).map((m, i) => ({
                userId: m.userId,
                name: m.name,
                roleLabel: m.roleLabel,
                position: m.position,
                bio: m.bio,
                photo: m.photo,
                order: i,
              })),
              track
            )
          : null;

    await prisma.$transaction(async (tx) => {
      await tx.committee.update({ where: { id }, data });

      if (body.responsibilities !== undefined) {
        await tx.committeeResponsibility.deleteMany({ where: { committeeId: id } });
        const rows = readResponsibilities(body.responsibilities);
        if (rows.length) {
          await tx.committeeResponsibility.createMany({
            data: rows.map((r) => ({ ...r, committeeId: id })),
          });
        }
      }

      if (body.projects !== undefined) {
        await tx.committeeProject.deleteMany({ where: { committeeId: id } });
        const rows = readProjects(body.projects);
        if (rows.length) {
          await tx.committeeProject.createMany({
            data: rows.map((p) => ({ ...p, committeeId: id })),
          });
        }
      }

      if (body.facts !== undefined) {
        await tx.committeeFact.deleteMany({ where: { committeeId: id } });
        const rows = readFacts(body.facts);
        if (rows.length) {
          await tx.committeeFact.createMany({ data: rows.map((f) => ({ ...f, committeeId: id })) });
        }
      }

      if (members) {
        await tx.committeeMember.deleteMany({ where: { committeeId: id } });
        if (members.length) {
          await tx.committeeMember.createMany({
            data: members.map((m) => ({ ...m, committeeId: id })),
          });
        }
      }
    });

    const saved = await prisma.committee.findUnique({ where: { id }, include: committeeInclude });

    return NextResponse.json({
      ok: true,
      committee: saved ? serializeCommittee(saved, "EDIT") : null,
    });
  } catch (err) {
    console.error("admin/committees/[id] PATCH error:", err);
    return NextResponse.json({ error: "Failed to save the committee." }, { status: 500 });
  }
}

// DELETE /api/admin/committees/[id] — the only destructive path, and top-table
// only: a head can empty their committee but cannot remove it from the chapter.
//
// HIDDEN is the reversible way to take a committee off the site; this drops the
// record and its roster for good, so the console asks before calling it.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await prisma.committee.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin/committees/[id] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete the committee." }, { status: 500 });
  }
}
