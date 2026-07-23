/**
 * Placeholder roster for the Officers "character select" page.
 *
 * Names, taglines and photos are intentionally generic — swap each entry for a
 * real officer (and drop a portrait into `photo`) once the roster is collected.
 * The page assumes ONE photo per officer.
 */

export interface Officer {
  /** Stable slug — also used for the URL hash / deep-link. */
  id: string;
  /** Full role title, e.g. "VP — Internal". */
  role: string;
  /** Person's name. */
  name: string;
  /** One signature line: mission, focus, or who they are. */
  tagline: string;
  /** Official portrait. `null` renders the labelled placeholder. */
  photo: string | null;
  /** Signature stats shown beside the portrait. */
  course: string;
  department: string;
  since: string;
  socials?: {
    instagram?: string;
    linkedin?: string;
    email?: string;
  };
}

const PLACEHOLDER_TAGLINE =
  "A short signature line goes here — the officer's focus for the term, or a line that captures who they are. Placeholder copy until real bios are collected.";

const ROLES: { role: string; department: string }[] = [
  { role: "President", department: "Executive" },
  { role: "VP — Internal", department: "Executive" },
  { role: "VP — External", department: "Executive" },
  { role: "Secretary", department: "Records" },
  { role: "Assistant Secretary", department: "Records" },
  { role: "Treasurer", department: "Finance" },
  { role: "Auditor", department: "Finance" },
  { role: "Public Relations Officer", department: "Marketing" },
  { role: "Technical Lead", department: "Technology" },
  { role: "Events Head", department: "Operations" },
  { role: "Creatives Head", department: "Marketing" },
  { role: "Membership Head", department: "Operations" },
];

export const officers: Officer[] = ROLES.map(({ role, department }) => ({
  id: role
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, ""),
  role,
  name: "Officer Name",
  tagline: PLACEHOLDER_TAGLINE,
  photo: null,
  course: "BS Computer Science '26",
  department,
  since: "Aug 2025",
  socials: { instagram: "#", linkedin: "#", email: "acm.feu.it@gmail.com" },
}));
