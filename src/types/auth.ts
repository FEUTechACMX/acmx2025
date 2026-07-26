export type safeUser =
  | {
      studentId: string;
      name: string;
      email: string;
      role:
        | "ADMIN"
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

// Roles that qualify for the officer/admin pricing tier
export const OFFICER_ROLES: string[] = [
  "ADMIN",
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
  "ADMIN",
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
  "ADMIN",
  "EXECUTIVES_MEDIA",
  "EXECUTIVES",
  "SECRETARIAT",
  "SECRETARIAT_JUNIOR_OFFICER",
];

export function isSecretariatOrAbove(role?: string): boolean {
  return !!role && SECRETARIAT_AND_ABOVE_ROLES.includes(role);
}

// The admin console (/admin) is ADMIN-only.
export function isAdmin(role?: string): boolean {
  return role === "ADMIN";
}

// All assignable user roles, ordered from highest to lowest. The single source
// of truth for the People & Roles picker — add new roles to the Prisma
// `UserRole` enum and they appear here.
export const USER_ROLES = [
  "ADMIN",
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
