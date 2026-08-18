export type safeUser =
  | {
      studentId: string;
      name: string;
      email: string;
      role:
        | "ADMIN"
        | "PRESIDENT"
        | "VP_INTERNAL"
        | "VP_EXTERNAL"
        | "EXECUTIVES_MEDIA"
        | "EXECUTIVES"
        | "SECRETARIAT"
        | "SECRETARIAT_JUNIOR_OFFICER"
        | "FINANCE_JUNIOR_OFFICER"
        | "MEDIA_OFFICER"
        | "JUNIOR_OFFICER"
        | "MEMBER";
      points: number;
    }
  | undefined;

// The chapter's top table. These four are interchangeable everywhere access is
// concerned — the President and the two VPs run the console exactly as an
// administrator does, so every gate below tests membership of this list rather
// than an equality against "ADMIN".
export const ADMIN_ROLES: string[] = ["ADMIN", "PRESIDENT", "VP_INTERNAL", "VP_EXTERNAL"];

// Roles that qualify for the officer/admin pricing tier
export const OFFICER_ROLES: string[] = [
  ...ADMIN_ROLES,
  "EXECUTIVES_MEDIA",
  "EXECUTIVES",
  "SECRETARIAT",
  "SECRETARIAT_JUNIOR_OFFICER",
  "FINANCE_JUNIOR_OFFICER",
  "MEDIA_OFFICER",
  "JUNIOR_OFFICER",
];

// Roles that can manage events (create, edit status, view admin panels)
export const EVENT_ADMIN_ROLES: string[] = [
  ...ADMIN_ROLES,
  "EXECUTIVES_MEDIA",
  "EXECUTIVES",
  "SECRETARIAT",
  "SECRETARIAT_JUNIOR_OFFICER",
  "MEDIA_OFFICER",
];

export function isOfficer(role?: string): boolean {
  return !!role && OFFICER_ROLES.includes(role);
}

export function isEventAdmin(role?: string): boolean {
  return !!role && EVENT_ADMIN_ROLES.includes(role);
}

// Roles that can perform on-site registration (Secretariat and above)
export const SECRETARIAT_AND_ABOVE_ROLES: string[] = [
  ...ADMIN_ROLES,
  "EXECUTIVES_MEDIA",
  "EXECUTIVES",
  "SECRETARIAT",
  "SECRETARIAT_JUNIOR_OFFICER",
];

export function isSecretariatOrAbove(role?: string): boolean {
  return !!role && SECRETARIAT_AND_ABOVE_ROLES.includes(role);
}

// Full run of the admin console (/admin). Committee heads get in too, but only
// as far as their own committee — that gate lives in src/lib/committee-access.ts.
export function isAdmin(role?: string): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

// All assignable user roles, ordered from highest to lowest. The single source
// of truth for the People & Roles picker — add new roles to the Prisma
// `UserRole` enum and they appear here.
export const USER_ROLES = [
  "ADMIN",
  "PRESIDENT",
  "VP_INTERNAL",
  "VP_EXTERNAL",
  "EXECUTIVES",
  "EXECUTIVES_MEDIA",
  "SECRETARIAT",
  "SECRETARIAT_JUNIOR_OFFICER",
  "FINANCE_JUNIOR_OFFICER",
  "MEDIA_OFFICER",
  "JUNIOR_OFFICER",
  "MEMBER",
] as const;

export type UserRoleName = (typeof USER_ROLES)[number];

// Human-readable labels for the enum values.
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  PRESIDENT: "President",
  VP_INTERNAL: "VP · Internal",
  VP_EXTERNAL: "VP · External",
  EXECUTIVES: "Executive",
  EXECUTIVES_MEDIA: "Executive · Media",
  SECRETARIAT: "Secretariat",
  SECRETARIAT_JUNIOR_OFFICER: "Secretariat Junior Officer",
  FINANCE_JUNIOR_OFFICER: "Finance Junior Officer",
  MEDIA_OFFICER: "Media Officer",
  JUNIOR_OFFICER: "Junior Officer",
  MEMBER: "Member",
};

export function roleLabel(role?: string): string {
  return (role && ROLE_LABELS[role]) || role || "—";
}

/**
 * The roles that appear on the public Officers page, in the order they rank.
 *
 * Derived from USER_ROLES rather than listed again, so a role added to the enum
 * cannot be silently missing from the page. Two exclusions:
 *
 * - ADMIN is an access level, not a post on the board. The chapter's president
 *   holds PRESIDENT; whoever also needs console access holds ADMIN, and that is
 *   an implementation detail nobody should read about on the public site.
 * - MEMBER is not an officer.
 */
export const BOARD_ROLES = USER_ROLES.filter(
  (r) => r !== "ADMIN" && r !== "MEMBER"
);

export function isBoardRole(role?: string): boolean {
  return !!role && (BOARD_ROLES as readonly string[]).includes(role);
}

/** Rank of a role on the board — lower sorts first. */
export function boardRank(role: string): number {
  const i = (BOARD_ROLES as readonly string[]).indexOf(role);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}
