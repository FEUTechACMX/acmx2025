import type {
  Committee,
  CommitteeResponsibility,
  CommitteeProject,
  CommitteeFact,
  CommitteeMember,
} from "@prisma/client";
import type {
  CommitteeAccess,
  CommitteeDTO,
  CommitteeEmblem,
  CommitteeMemberDTO,
  CommitteeMemberRole,
  CommitteeProjectStatus,
  CommitteeRecruiting,
  CommitteeStatus,
  CommitteeSummaryDTO,
  CommitteeTrack,
} from "@/types/committee";
import {
  COMMITTEE_EMBLEMS,
  COMMITTEE_STATUSES,
  COMMITTEE_TRACKS,
  MEMBER_ROLES,
  POSITION_RANK,
  PROJECT_STATUSES,
  RECRUITING_STATES,
  TRACK_POSITIONS,
  isLeadPosition,
  slugify,
} from "@/types/committee";
import { email } from "./validation";
import { prisma } from "./prisma";

/** Child rows always come back in editor order. */
export const childOrder = [{ order: "asc" as const }];

/** Everything the plate needs, in one include. */
export const committeeInclude = {
  responsibilities: { orderBy: childOrder },
  projects: { orderBy: childOrder },
  facts: { orderBy: childOrder },
  members: {
    orderBy: childOrder,
    include: { user: { select: { studentId: true, role: true } } },
  },
} as const;

type MemberRow = CommitteeMember & { user?: { studentId: string; role: string } | null };

export type CommitteeWithChildren = Committee & {
  responsibilities: CommitteeResponsibility[];
  projects: CommitteeProject[];
  facts: CommitteeFact[];
  members: MemberRow[];
};

/**
 * The one rule that keeps the page honest: RECRUITING with no open seats is
 * a contradiction, so it reads as FULL. The seat count in the panel and the
 * OPEN SEATS stat come from this single reconciled pair — they cannot disagree.
 */
export function reconcileRecruiting(
  recruiting: CommitteeRecruiting,
  openSeats: number
): { recruiting: CommitteeRecruiting; openSeats: number } {
  const seats = Math.max(0, Math.trunc(openSeats) || 0);
  if (recruiting === "RECRUITING" && seats === 0) return { recruiting: "FULL", openSeats: 0 };
  if (recruiting !== "RECRUITING") return { recruiting, openSeats: seats };
  return { recruiting, openSeats: seats };
}

function serializeMember(m: MemberRow): CommitteeMemberDTO {
  return {
    id: m.id,
    name: m.name,
    roleLabel: m.roleLabel,
    position: m.position as CommitteeMemberRole,
    bio: m.bio,
    photo: m.photo,
    userId: m.userId,
    studentId: m.user?.studentId ?? null,
    userRole: m.user?.role ?? null,
  };
}

export function serializeSummary(
  c: CommitteeWithChildren,
  access: CommitteeAccess = "NONE"
): CommitteeSummaryDTO {
  const { recruiting, openSeats } = reconcileRecruiting(
    c.recruiting as CommitteeRecruiting,
    c.openSeats
  );

  return {
    track: readTrack(c.track),
    access,
    id: c.id,
    slug: c.slug,
    name: c.name,
    kicker: c.kicker,
    emblem: readEmblem(c.emblem),
    blurb: c.blurb ?? c.mandate,
    status: c.status as CommitteeStatus,
    order: c.order,
    recruiting,
    openSeats,
    memberCount: c.members.length,
  };
}

export function serializeCommittee(
  c: CommitteeWithChildren,
  access: CommitteeAccess = "NONE"
): CommitteeDTO {
  const members = c.members.map(serializeMember);

  return {
    ...serializeSummary(c, access),
    mandate: c.mandate,
    callBody: c.callBody,
    callDeadline: c.callDeadline ? c.callDeadline.toISOString() : null,
    applyUrl: c.applyUrl,
    contactEmail: c.contactEmail,
    formedYear: c.formedYear,
    responsibilities: c.responsibilities.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
    })),
    projects: c.projects.map((p) => ({
      id: p.id,
      title: p.title,
      meta: p.meta,
      status: p.status as CommitteeProjectStatus,
    })),
    facts: c.facts.map((f) => ({ id: f.id, label: f.label, value: f.value })),
    members,
    leads: members
      .filter((m) => isLeadPosition(m.position))
      .sort((a, b) => POSITION_RANK[a.position] - POSITION_RANK[b.position]),
    roster: members.filter((m) => !isLeadPosition(m.position)),
  };
}

/* ── Admin input normalisation ──────────────────────────────── */

export function readStatus(raw: unknown): CommitteeStatus {
  return COMMITTEE_STATUSES.includes(raw as CommitteeStatus)
    ? (raw as CommitteeStatus)
    : "PUBLISHED";
}

export function readRecruiting(raw: unknown): CommitteeRecruiting {
  return RECRUITING_STATES.includes(raw as CommitteeRecruiting)
    ? (raw as CommitteeRecruiting)
    : "NOT_YET";
}

export function readEmblem(raw: unknown): CommitteeEmblem {
  return COMMITTEE_EMBLEMS.includes(raw as CommitteeEmblem) ? (raw as CommitteeEmblem) : "pen";
}

export function readTrack(raw: unknown): CommitteeTrack {
  return COMMITTEE_TRACKS.includes(raw as CommitteeTrack) ? (raw as CommitteeTrack) : "STANDARD";
}

function readProjectStatus(raw: unknown): CommitteeProjectStatus {
  return PROJECT_STATUSES.includes(raw as CommitteeProjectStatus)
    ? (raw as CommitteeProjectStatus)
    : "IN_PROGRESS";
}

function readMemberRole(raw: unknown): CommitteeMemberRole {
  return MEMBER_ROLES.includes(raw as CommitteeMemberRole)
    ? (raw as CommitteeMemberRole)
    : "MEMBER";
}

const text = (v: unknown): string => String(v ?? "").trim();
const optional = (v: unknown): string | null => text(v) || null;

export type ResponsibilityInput = { title: string; description: string | null; order: number };
export type ProjectInput = {
  title: string;
  meta: string | null;
  status: CommitteeProjectStatus;
  order: number;
};
export type FactInput = { label: string; value: string; order: number };
export type MemberInput = {
  userId: string | null;
  name: string;
  roleLabel: string | null;
  position: CommitteeMemberRole;
  bio: string | null;
  photo: string | null;
  order: number;
};

/**
 * Child rows are normalised the same way everywhere: rows without the one
 * field that makes them meaningful are dropped rather than saved blank, and
 * `order` is re-derived from array position so the editor's drag order wins.
 */
export function readResponsibilities(raw: unknown): ResponsibilityInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => text(r?.title))
    .map((r, i) => ({ title: text(r.title), description: optional(r?.description), order: i }));
}

export function readProjects(raw: unknown): ProjectInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p) => text(p?.title))
    .map((p, i) => ({
      title: text(p.title),
      meta: optional(p?.meta),
      status: readProjectStatus(p?.status),
      order: i,
    }));
}

export function readFacts(raw: unknown): FactInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f) => text(f?.label) && text(f?.value))
    .map((f, i) => ({ label: text(f.label).toUpperCase(), value: text(f.value), order: i }));
}

/**
 * Roster rows now come from the member picker, so each carries the account it
 * was chosen from. A row still needs a name — a linked account whose name the
 * server resolves, or a bare name for the legacy rows that predate linking —
 * and the same person can only hold one seat, so a repeated account is dropped
 * rather than saved twice against the unique index.
 */
export function readMembers(raw: unknown): MemberInput[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const rows: MemberInput[] = [];

  for (const m of raw) {
    const userId = optional(m?.userId);
    if (userId) {
      if (seen.has(userId)) continue;
      seen.add(userId);
    } else if (!text(m?.name)) {
      continue;
    }

    rows.push({
      userId,
      name: text(m?.name),
      roleLabel: m?.roleLabel ? text(m.roleLabel).toUpperCase() : null,
      position: readMemberRole(m?.position),
      bio: optional(m?.bio),
      photo: optional(m?.photo),
      order: rows.length,
    });
  }

  return rows;
}

/**
 * Reconciles the roster against the committee's track.
 *
 * Two rules, both applied by demotion rather than rejection — a roster is more
 * useful saved than blocked on an error the admin has to go hunting for:
 * a position from the other track becomes that track's rank-and-file seat, and
 * a second holder of a single-seat position (head, co-head, project lead, lead
 * dev) becomes rank-and-file too.
 */
export function capLeads(members: MemberInput[], track: CommitteeTrack = "STANDARD"): MemberInput[] {
  const allowed = TRACK_POSITIONS[track];
  const base = allowed[allowed.length - 1];
  const used = new Set<CommitteeMemberRole>();

  return members.map((m) => {
    const position = allowed.includes(m.position) ? m.position : base;
    if (!isLeadPosition(position)) return { ...m, position: base };
    if (used.has(position)) return { ...m, position: base };
    used.add(position);
    return { ...m, position };
  });
}

/**
 * Roster names follow the account. The picker sends the name it displayed, but
 * the database is the authority — otherwise a stale client could write a name
 * that no longer matches the person it links to.
 */
export async function resolveMemberNames(members: MemberInput[]): Promise<MemberInput[]> {
  const ids = members.map((m) => m.userId).filter((id): id is string => !!id);
  if (ids.length === 0) return members;

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, firstName: true, middleName: true, lastName: true, suffix: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  return members.map((m) => {
    const u = m.userId ? byId.get(m.userId) : undefined;
    // An id with no account behind it is a stale pick: keep the row, drop the link.
    if (m.userId && !u) return { ...m, userId: null };
    if (!u) return m;
    return {
      ...m,
      name: [u.firstName, u.middleName, u.lastName, u.suffix].filter(Boolean).join(" "),
    };
  });
}

/** Appends -2, -3, … until the slug is free. */
export async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  const root = slugify(base) || "committee";
  let candidate = root;
  for (let n = 2; ; n++) {
    const clash = await prisma.committee.findUnique({ where: { slug: candidate } });
    if (!clash || clash.id === exceptId) return candidate;
    candidate = `${root}-${n}`;
  }
}

/** Parses the editor's date input. Invalid or empty means "no deadline". */
export function readDate(raw: unknown): Date | null {
  const value = text(raw);
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function readYear(raw: unknown): number | null {
  const n = Math.trunc(Number(raw));
  return Number.isFinite(n) && n >= 1900 && n <= 2999 ? n : null;
}

/** The scalar half of a create/update payload, shared by POST and PATCH. */
/* ── Payload validation ─────────────────────────────────────────
 *
 * Same division as merch: the `read*` helpers above coerce anything into
 * something safe, which is right for an absent field and wrong for a present
 * one that is malformed. This checks what was actually sent (CLEANUP.md §6.4).
 *
 * `contactEmail` and `applyUrl` are the ones that mattered: both were stored
 * verbatim and then rendered as a `mailto:` and a link on the public committee
 * page, so an unparseable value became a dead control for every visitor.
 */

export const COMMITTEE_LIMITS = {
  name: 120,
  kicker: 120,
  mandate: 4000,
  blurb: 2000,
  callBody: 4000,
  contactEmail: 200,
  applyUrl: 600,
  children: 60,
  members: 200,
} as const;

export function validateCommitteeInput(body: Record<string, unknown>): string | null {
  const text = (key: string, label: string, max: number) => {
    if (body[key] === undefined || body[key] === null) return null;
    if (typeof body[key] !== "string") return `${label} must be text.`;
    return (body[key] as string).trim().length > max
      ? `${label} must be ${max} characters or fewer.`
      : null;
  };

  const capped = [
    text("name", "Name", COMMITTEE_LIMITS.name),
    text("kicker", "Kicker", COMMITTEE_LIMITS.kicker),
    text("mandate", "Mandate", COMMITTEE_LIMITS.mandate),
    text("blurb", "Blurb", COMMITTEE_LIMITS.blurb),
    text("callBody", "Call for applications", COMMITTEE_LIMITS.callBody),
    text("contactEmail", "Contact email", COMMITTEE_LIMITS.contactEmail),
    text("applyUrl", "Application link", COMMITTEE_LIMITS.applyUrl),
  ].find(Boolean);
  if (capped) return capped;

  if (body.contactEmail !== undefined && body.contactEmail !== null) {
    const problem = email("Contact email")(body.contactEmail);
    if (problem) return problem;
  }

  if (body.applyUrl !== undefined && body.applyUrl !== null) {
    const s = String(body.applyUrl).trim();
    if (s) {
      try {
        const parsed = new URL(s);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          return "Application link must be an http or https link.";
        }
      } catch {
        return "Application link must be a full link, starting with https://";
      }
    }
  }

  if (body.openSeats !== undefined && body.openSeats !== null) {
    const n = Number(body.openSeats);
    if (!Number.isFinite(n) || n < 0) return "Open seats cannot be negative.";
    if (n > 500) return "That number of open seats looks like a typo.";
  }

  for (const key of ["responsibilities", "projects", "facts"] as const) {
    if (body[key] === undefined) continue;
    if (!Array.isArray(body[key])) return `${key} must be a list.`;
    if ((body[key] as unknown[]).length > COMMITTEE_LIMITS.children) {
      return `A committee can hold at most ${COMMITTEE_LIMITS.children} ${key}.`;
    }
  }

  if (body.members !== undefined) {
    if (!Array.isArray(body.members)) return "Members must be a list.";
    if (body.members.length > COMMITTEE_LIMITS.members) {
      return `A committee can hold at most ${COMMITTEE_LIMITS.members} members.`;
    }
  }

  return null;
}

export function readScalars(body: Record<string, unknown>) {
  const { recruiting, openSeats } = reconcileRecruiting(
    readRecruiting(body.recruiting),
    Number(body.openSeats)
  );

  return {
    name: text(body.name),
    kicker: optional(body.kicker),
    emblem: readEmblem(body.emblem),
    track: readTrack(body.track),
    mandate: optional(body.mandate),
    blurb: optional(body.blurb),
    order: Math.trunc(Number(body.order) || 0),
    status: readStatus(body.status),
    recruiting,
    openSeats,
    callBody: optional(body.callBody),
    callDeadline: readDate(body.callDeadline),
    applyUrl: optional(body.applyUrl),
    contactEmail: optional(body.contactEmail),
    formedYear: readYear(body.formedYear),
  };
}
