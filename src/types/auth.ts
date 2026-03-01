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
