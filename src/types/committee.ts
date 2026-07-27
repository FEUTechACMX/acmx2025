/**
 * Committees — shared vocabulary for the index, the plate and the console.
 *
 * The plate is ONE page for every committee, present and future. Admins supply
 * content; the design owns section order, the four stat slots and the type
 * scale. Recruiting is a single three-way choice, never a pile of switches, so
 * the page can't advertise seats that don't exist.
 */

export const COMMITTEE_STATUSES = ["PUBLISHED", "HIDDEN"] as const;
export type CommitteeStatus = (typeof COMMITTEE_STATUSES)[number];

export const RECRUITING_STATES = ["RECRUITING", "FULL", "NOT_YET"] as const;
export type CommitteeRecruiting = (typeof RECRUITING_STATES)[number];

export const PROJECT_STATUSES = ["IN_PROGRESS", "REVIEW", "SHIPPED"] as const;
export type CommitteeProjectStatus = (typeof PROJECT_STATUSES)[number];

export const MEMBER_ROLES = [
  "HEAD",
  "CO_HEAD",
  "MEMBER",
  "PROJECT_LEAD",
  "LEAD_DEV",
  "JUNIOR_DEV",
] as const;
export type CommitteeMemberRole = (typeof MEMBER_ROLES)[number];

/**
 * Which positions a committee offers. Every committee is head / co-head /
 * members except ACMx, which builds software and so splits its roster three
 * ways. The track lives on the record, so the console offers exactly the
 * positions that committee has and nothing else.
 */
export const COMMITTEE_TRACKS = ["STANDARD", "DEV"] as const;
export type CommitteeTrack = (typeof COMMITTEE_TRACKS)[number];

export const TRACK_LABELS: Record<CommitteeTrack, string> = {
  STANDARD: "Standard",
  DEV: "Development",
};

export const TRACK_NOTES: Record<CommitteeTrack, string> = {
  STANDARD: "Head, co-head and members. Every committee except ACMx.",
  DEV: "Project lead, lead dev and junior devs — the ACMx split.",
};

/** The positions a track offers, in the order they rank on the roster. */
export const TRACK_POSITIONS: Record<CommitteeTrack, readonly CommitteeMemberRole[]> = {
  STANDARD: ["HEAD", "CO_HEAD", "MEMBER"],
  DEV: ["PROJECT_LEAD", "LEAD_DEV", "JUNIOR_DEV"],
};

/**
 * Positions that carry edit access to their own committee, and that only one
 * person can hold at a time. Everything else is a rank-and-file seat: unlimited
 * headcount, view access only.
 */
export const LEAD_POSITIONS: readonly CommitteeMemberRole[] = [
  "HEAD",
  "CO_HEAD",
  "PROJECT_LEAD",
  "LEAD_DEV",
];

export function isLeadPosition(p: CommitteeMemberRole): boolean {
  return LEAD_POSITIONS.includes(p);
}

/** Roster sort order, leads first, across both tracks. */
export const POSITION_RANK: Record<CommitteeMemberRole, number> = {
  HEAD: 0,
  PROJECT_LEAD: 0,
  CO_HEAD: 1,
  LEAD_DEV: 1,
  MEMBER: 2,
  JUNIOR_DEV: 2,
};

/** What a viewer may do with a committee in the console. */
export const COMMITTEE_ACCESS = ["EDIT", "VIEW", "NONE"] as const;
export type CommitteeAccess = (typeof COMMITTEE_ACCESS)[number];

export const STATUS_LABELS: Record<CommitteeStatus, string> = {
  PUBLISHED: "Published",
  HIDDEN: "Hidden",
};

export const STATUS_NOTES: Record<CommitteeStatus, string> = {
  PUBLISHED: "Listed on /committee and reachable at its own URL.",
  HIDDEN: "Off the public site. The record, roster and open call are kept.",
};

export const RECRUITING_LABELS: Record<CommitteeRecruiting, string> = {
  RECRUITING: "Recruiting",
  FULL: "Roster full",
  NOT_YET: "Not yet recruiting",
};

export const RECRUITING_NOTES: Record<CommitteeRecruiting, string> = {
  RECRUITING: "Accent panel with the seat count and an apply button. Needs at least one open seat.",
  FULL: "Neutral panel. Members can join the waitlist; nothing is advertised.",
  NOT_YET: "Neutral panel for a committee that has just been added and isn't staffed yet.",
};

/** The eyebrow above the recruiting panel — the only accent one is RECRUITING. */
export const RECRUITING_HEADLINES: Record<CommitteeRecruiting, string> = {
  RECRUITING: "◇  RECRUITING",
  FULL: "◇  ROSTER FULL",
  NOT_YET: "◇  NOT YET RECRUITING",
};

export const PROJECT_STATUS_LABELS: Record<CommitteeProjectStatus, string> = {
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  SHIPPED: "Shipped",
};

export const MEMBER_ROLE_LABELS: Record<CommitteeMemberRole, string> = {
  HEAD: "Committee head",
  CO_HEAD: "Co-head",
  MEMBER: "Member",
  PROJECT_LEAD: "Project lead",
  LEAD_DEV: "Lead dev",
  JUNIOR_DEV: "Junior dev",
};

/** What holding this position gets you in the console. Shown beside the chips. */
export const MEMBER_ROLE_NOTES: Record<CommitteeMemberRole, string> = {
  HEAD: "One per committee. Can edit this committee in the console.",
  CO_HEAD: "One per committee. Can edit this committee in the console.",
  MEMBER: "View access to this committee. Any number.",
  PROJECT_LEAD: "One per committee. Can edit this committee in the console.",
  LEAD_DEV: "One per committee. Can edit this committee in the console.",
  JUNIOR_DEV: "View access to this committee. Any number.",
};

/**
 * Emblems are a fixed set, not an upload. The diamond mark renders at 230px in
 * the hero and 54px on the card — a stroked glyph is the only thing that holds
 * up at both sizes, and a closed set keeps six committees looking related.
 */
export const COMMITTEE_EMBLEMS = [
  "pen",
  "terminal",
  "package",
  "handshake",
  "camera",
  "wallet",
  "megaphone",
  "people",
  "clipboard",
  "book",
  "calendar",
] as const;
export type CommitteeEmblem = (typeof COMMITTEE_EMBLEMS)[number];

export const EMBLEM_LABELS: Record<CommitteeEmblem, string> = {
  pen: "Pen — creatives",
  terminal: "Terminal — technicals",
  package: "Package — logistics",
  handshake: "Handshake — externals",
  camera: "Camera — documentation",
  wallet: "Wallet — finance",
  megaphone: "Megaphone — publicity",
  people: "People — general",
  clipboard: "Clipboard — secretariat",
  book: "Book — publications",
  calendar: "Calendar — events",
};

/* ── Wire shapes ────────────────────────────────────────────── */

export type CommitteeResponsibilityDTO = {
  id: string;
  title: string;
  description: string | null;
};

export type CommitteeProjectDTO = {
  id: string;
  title: string;
  meta: string | null;
  status: CommitteeProjectStatus;
};

export type CommitteeFactDTO = {
  id: string;
  label: string;
  value: string;
};

export type CommitteeMemberDTO = {
  id: string;
  name: string;
  roleLabel: string | null;
  position: CommitteeMemberRole;
  bio: string | null;
  photo: string | null;
  /** The linked account. Null only for rows that predate account-linked rosters. */
  userId: string | null;
  studentId: string | null;
  /** The person's chapter-wide role, for the console's roster rows. */
  userRole: string | null;
};

/** One hit in the roster picker's search. */
export type MemberSearchResultDTO = {
  id: string;
  studentId: string;
  name: string;
  email: string;
  role: string;
  yearLevel: number;
  degreeProgram: string;
};

export type CommitteeSummaryDTO = {
  id: string;
  slug: string;
  name: string;
  kicker: string | null;
  emblem: CommitteeEmblem;
  blurb: string | null;
  status: CommitteeStatus;
  order: number;
  recruiting: CommitteeRecruiting;
  openSeats: number;
  memberCount: number;
  track: CommitteeTrack;
  /** What the requesting user may do here. Public routes always send "NONE". */
  access: CommitteeAccess;
};

export type CommitteeDTO = CommitteeSummaryDTO & {
  mandate: string | null;
  callBody: string | null;
  callDeadline: string | null;
  applyUrl: string | null;
  contactEmail: string | null;
  formedYear: number | null;
  responsibilities: CommitteeResponsibilityDTO[];
  projects: CommitteeProjectDTO[];
  facts: CommitteeFactDTO[];
  members: CommitteeMemberDTO[];
  /** Head and co-head, split out for the lead cards. */
  leads: CommitteeMemberDTO[];
  /** Everyone who isn't a lead — the token grid. */
  roster: CommitteeMemberDTO[];
};

/* ── Derived copy ───────────────────────────────────────────── */

/** The seat line on an index card. FULL reads faint, never accent. */
export function seatNote(c: Pick<CommitteeSummaryDTO, "memberCount" | "openSeats" | "recruiting">): {
  text: string;
  tone: "muted" | "accent" | "faint";
} {
  const people = `${c.memberCount} ${c.memberCount === 1 ? "MEMBER" : "MEMBERS"}`;

  if (c.recruiting === "RECRUITING" && c.openSeats > 0) {
    return { text: `${people} · ${c.openSeats} OPEN`, tone: "accent" };
  }
  if (c.recruiting === "FULL") return { text: `${people} · FULL`, tone: "faint" };
  if (c.memberCount === 0) return { text: "ROSTER NOT PUBLISHED", tone: "faint" };
  return { text: people, tone: "muted" };
}

/** "N° 03" — the index position, padded. Follows `order`, not the id. */
export function committeeNumber(index: number): string {
  return `N° ${String(index + 1).padStart(2, "0")}`;
}

/** Deadline copy for the recruiting panel. Shown even when a call is closed. */
export function deadlineNote(
  recruiting: CommitteeRecruiting,
  deadline: string | null
): string | null {
  if (!deadline) return recruiting === "NOT_YET" ? "STATUS SET BY ADMIN" : null;

  const when = new Date(deadline).toLocaleDateString("en-PH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return recruiting === "RECRUITING" ? `CLOSES ${when.toUpperCase()}` : `NEXT CALL · ${when.toUpperCase()}`;
}

/** Slug from a committee name: "Creatives & Design" → "creatives-design". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, " ")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
