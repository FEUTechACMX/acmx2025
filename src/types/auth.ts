export type safeUser =
  | {
      studentId: string;
      name: string;
      email: string;
      role:
        | "ADMIN"
        | "EXECUTIVES"
        | "SECRETARIAT"
        | "SECRETARIAT_JUNIOR_OFFICER"
        | "FINANCE_JUNIOR_OFFICER"
        | "JUNIOR_OFFICER"
        | "MEMBER";
      points: number;
    }
  | undefined;

// Roles that qualify for the officer/admin pricing tier
export const OFFICER_ROLES: string[] = [
  "ADMIN",
  "EXECUTIVES",
  "SECRETARIAT",
  "SECRETARIAT_JUNIOR_OFFICER",
  "FINANCE_JUNIOR_OFFICER",
  "JUNIOR_OFFICER",
];

export function isOfficer(role?: string): boolean {
  return !!role && OFFICER_ROLES.includes(role);
}
