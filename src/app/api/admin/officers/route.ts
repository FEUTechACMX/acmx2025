import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { BOARD_ROLES, boardRank, isAdmin, isBoardRole, roleLabel } from "@/types/auth";
import { check, hasErrors, maxLength, str, urlOn } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * The console's view of the board: every account holding a board role, with its
 * profile if it has one.
 *
 * There is no "create an officer" here on purpose. Someone becomes an officer by
 * being given the role in People & Roles; this screen only dresses the result.
 * A second way to add a person would be a second truth about who holds a post.
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  try {
    const rows = await prisma.user.findMany({
      where: { role: { in: [...BOARD_ROLES] } },
      select: {
        id: true,
        studentId: true,
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

    const officers = rows
      .map((u) => ({
        userId: u.id,
        studentId: u.studentId,
        name: [u.firstName, u.middleName, u.lastName, u.suffix].filter(Boolean).join(" "),
        role: u.role,
        roleTitle: roleLabel(u.role),
        course: u.degreeProgram,
        email: u.schoolEmail,
        tagline: u.officerProfile?.tagline ?? "",
        photo: u.officerProfile?.photo ?? null,
        since: u.officerProfile?.since ?? "",
        instagram: u.officerProfile?.instagram ?? "",
        linkedin: u.officerProfile?.linkedin ?? "",
        order: u.officerProfile?.order ?? 0,
        published: u.officerProfile?.published ?? true,
        hasProfile: !!u.officerProfile,
      }))
      .sort(
        (a, b) =>
          boardRank(a.role) - boardRank(b.role) ||
          a.order - b.order ||
          a.name.localeCompare(b.name)
      );

    return NextResponse.json({ ok: true, officers });
  } catch (err) {
    console.error("admin/officers GET error:", err);
    return NextResponse.json({ error: "Failed to load the board." }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/officers — save one officer's profile.
 *
 * Upsert rather than create/update: a board member with no row yet is the normal
 * case, not an error, so the first save should not need a different call.
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireRole(req, isAdmin);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }
    const raw = body as Record<string, unknown>;

    const userId = str(raw.userId);
    if (!userId) {
      return NextResponse.json({ error: "Which officer?" }, { status: 400 });
    }

    // The role lives on the account, so this endpoint refuses anyone who is not
    // already on the board — it dresses officers, it does not appoint them.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ error: "No such member." }, { status: 404 });
    }
    if (!isBoardRole(user.role)) {
      return NextResponse.json(
        { error: "That member does not hold a board role. Assign one in People & Roles first." },
        { status: 400 }
      );
    }

    const fields = {
      tagline: str(raw.tagline),
      photo: str(raw.photo),
      since: str(raw.since),
      instagram: str(raw.instagram),
      linkedin: str(raw.linkedin),
    };

    const errors = check(fields, {
      tagline: [maxLength("Tagline", 400)],
      photo: [maxLength("Portrait URL", 600)],
      since: [maxLength("Since", 40)],
      instagram: [urlOn("Instagram link", ["instagram.com"])],
      linkedin: [urlOn("LinkedIn link", ["linkedin.com"])],
    });
    if (hasErrors(errors)) {
      return NextResponse.json({ error: Object.values(errors)[0], errors }, { status: 400 });
    }

    const order = Number.isFinite(Number(raw.order)) ? Math.trunc(Number(raw.order)) : 0;
    const published = raw.published === undefined ? true : raw.published !== false;

    // Empty string means "not set" — stored as null so the page can test one
    // thing rather than two.
    const data = {
      tagline: fields.tagline || null,
      photo: fields.photo || null,
      since: fields.since || null,
      instagram: fields.instagram || null,
      linkedin: fields.linkedin || null,
      order,
      published,
    };

    const saved = await prisma.officerProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    return NextResponse.json({ ok: true, profile: saved });
  } catch (err) {
    console.error("admin/officers PATCH error:", err);
    return NextResponse.json({ error: "Failed to save the profile." }, { status: 500 });
  }
}
