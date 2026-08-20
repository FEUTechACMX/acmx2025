/**
 * School-email helpers — @fit.edu.ph is mandatory and locked.
 * Callers store the full address; the UI edits only the local part.
 */
import { email, required, str, type Rule } from "@/lib/validation";

export const SCHOOL_EMAIL_DOMAIN = "@fit.edu.ph";

/** Strip any domain the user typed; keep only the local part. */
export function schoolEmailLocalPart(raw: unknown): string {
  const s = str(raw).toLowerCase();
  if (!s) return "";
  const at = s.indexOf("@");
  return at === -1 ? s : s.slice(0, at);
}

/** Compose a full school email from a local part (or a full address). */
export function composeSchoolEmail(raw: unknown): string {
  const local = schoolEmailLocalPart(raw);
  return local ? `${local}${SCHOOL_EMAIL_DOMAIN}` : "";
}

/**
 * Normalise whatever the client sent into `local@fit.edu.ph`.
 * Rejects empty local parts; never accepts another domain.
 */
export function normalizeSchoolEmail(raw: unknown): string {
  return composeSchoolEmail(raw);
}

/** Rule: required + looks like email + ends with @fit.edu.ph. */
export function schoolEmail(): Rule {
  const base = email("School email");
  return (v) => {
    const requiredMsg = required("School email")(v);
    if (requiredMsg) return requiredMsg;
    const full = normalizeSchoolEmail(v);
    const emailMsg = base(full);
    if (emailMsg) return emailMsg;
    if (!full.endsWith(SCHOOL_EMAIL_DOMAIN)) {
      return `School email must end with ${SCHOOL_EMAIL_DOMAIN}.`;
    }
    const local = schoolEmailLocalPart(full);
    if (!local) return "School email is required.";
    return null;
  };
}
