/**
 * Shared validation rules — one source of truth for both sides of the wire.
 *
 * Client-side validation is a courtesy: it saves a round-trip and lets a field
 * go red the moment it loses focus. Server-side validation is the actual
 * security boundary, because a request can reach the API without ever passing
 * through our UI — curl, a stale tab, a replayed fetch. Every rule in here runs
 * again inside the route handler. Importing the same module on both sides is
 * what stops the two from drifting apart as the rules change.
 *
 * Rules return `null` when the value is acceptable, or a human-readable message
 * written for the person who has to fix it — never "invalid input".
 */

/* ── Primitives ─────────────────────────────────────────────── */

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

export type Validated<T> =
  | { ok: true; value: T }
  | { ok: false; errors: FieldErrors };

/** A single field check. `null` means the value passed. */
export type Rule = (value: unknown) => string | null;

/**
 * Coerces to a trimmed string. Anything non-string (null, numbers, objects
 * from a hand-rolled JSON body) becomes "" so the required-check catches it
 * rather than a downstream `.length` throwing.
 */
export function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Runs `rules` over `input`, collecting the first failure per field. */
export function check<K extends string>(
  input: Record<K, unknown>,
  rules: Record<K, Rule[]>
): FieldErrors<K> {
  const errors: FieldErrors<K> = {};
  for (const key of Object.keys(rules) as K[]) {
    for (const rule of rules[key]) {
      const message = rule(input[key]);
      if (message) {
        errors[key] = message;
        break;
      }
    }
  }
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/* ── Reusable rules ─────────────────────────────────────────── */

export const required =
  (label: string): Rule =>
  (v) =>
    str(v) ? null : `${label} is required.`;

export const maxLength =
  (label: string, max: number): Rule =>
  (v) =>
    str(v).length <= max ? null : `${label} must be ${max} characters or fewer.`;

export const minLength =
  (label: string, min: number): Rule =>
  (v) =>
    str(v).length >= min ? null : `${label} must be at least ${min} characters.`;

/**
 * Deliberately permissive. The only address we can truly verify is one that
 * receives mail, so this rejects the shapes that are certainly wrong and
 * leaves the rest to a confirmation email.
 */
export const email =
  (label = "Email address"): Rule =>
  (v) => {
    const s = str(v);
    if (!s) return null;
    if (s.length > 254) return `${label} is too long.`;
    if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(s)) {
      return `${label} doesn't look like a valid address.`;
    }
    return null;
  };

/** PH mobile or landline, tolerant of +63, spaces, dashes and parentheses. */
export const phone =
  (label = "Contact number"): Rule =>
  (v) => {
    const s = str(v);
    if (!s) return null;
    const digits = s.replace(/[\s\-().+]/g, "");
    if (!/^\d+$/.test(digits)) return `${label} may only contain digits, spaces, + and dashes.`;
    if (digits.length < 7 || digits.length > 15) {
      return `${label} must be between 7 and 15 digits.`;
    }
    return null;
  };

/** Requires an http(s) URL on one of `hosts` (suffix match, so subdomains pass). */
export const urlOn =
  (label: string, hosts: string[]): Rule =>
  (v) => {
    const s = str(v);
    if (!s) return null;
    let parsed: URL;
    try {
      parsed = new URL(s);
    } catch {
      return `${label} must be a full link, starting with https://`;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return `${label} must be an http or https link.`;
    }
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
      return `${label} must point to ${hosts[0]}.`;
    }
    return null;
  };

/** Letters, spaces, hyphens, apostrophes and periods — names, not slugs. */
export const personName =
  (label: string): Rule =>
  (v) => {
    const s = str(v);
    if (!s) return null;
    if (s.length > 60) return `${label} must be 60 characters or fewer.`;
    if (!/^[\p{L}][\p{L}\s'.-]*$/u.test(s)) {
      return `${label} may only contain letters, spaces, hyphens and apostrophes.`;
    }
    return null;
  };

export const integerBetween =
  (label: string, min: number, max: number): Rule =>
  (v) => {
    const n = typeof v === "number" ? v : Number(str(v));
    if (!Number.isInteger(n)) return `${label} must be a whole number.`;
    if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
    return null;
  };

/* ── Passwords ──────────────────────────────────────────────── */

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/**
 * The hard gate, and the only password rule the server enforces.
 *
 * Length plus a digit, and nothing else. Forced symbol/case rules push people
 * toward `Password1!` and a sticky note; length is what actually costs an
 * attacker. The strength meter below is advisory and deliberately separate —
 * it nudges without blocking.
 *
 * The upper bound is not a security limit, it's a denial-of-service one:
 * bcrypt on a megabyte of input would happily burn the request thread.
 */
export const password =
  (label = "Password"): Rule =>
  (v) => {
    const s = typeof v === "string" ? v : "";
    if (!s) return `${label} is required.`;
    if (s.length < PASSWORD_MIN) return `${label} must be at least ${PASSWORD_MIN} characters.`;
    if (s.length > PASSWORD_MAX) return `${label} must be ${PASSWORD_MAX} characters or fewer.`;
    if (!/\d/.test(s)) return `${label} must contain at least one number.`;
    return null;
  };

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string };

/**
 * Advisory scoring for the meter. Rewards length first, character variety
 * second, and refuses to call anything strong if it's an obvious pattern.
 */
export function passwordStrength(value: string): Strength {
  if (!value) return { score: 0, label: "" };

  const OBVIOUS = /^(?:password|qwerty|letmein|welcome|admin|acm|acmx|iloveyou)\d*!?$/i;
  if (OBVIOUS.test(value) || /^(.)\1+$/.test(value)) {
    return { score: 1, label: "Too guessable" };
  }

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length;

  let score = 0;
  if (value.length >= PASSWORD_MIN) score += 1;
  if (value.length >= 12) score += 1;
  if (classes >= 3) score += 1;
  if (value.length >= 16 && classes >= 3) score += 1;

  const clamped = Math.min(4, Math.max(1, score)) as 1 | 2 | 3 | 4;
  return { score: clamped, label: ["", "Weak", "Fair", "Strong", "Excellent"][clamped] };
}

export type PasswordChangeInput = {
  currentPassword: unknown;
  newPassword: unknown;
  confirmPassword?: unknown;
};

/**
 * Validates a password change in isolation — everything that can be judged
 * without touching the database. Whether `currentPassword` is *correct* is a
 * separate question the route answers with bcrypt, since only it can.
 *
 * `confirmPassword` is optional: the form always sends it, but a direct API
 * caller has no second field to mistype, so its absence isn't an error.
 */
export function validatePasswordChange(input: PasswordChangeInput): FieldErrors {
  const errors: FieldErrors = check(
    {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    },
    {
      currentPassword: [required("Current password")],
      newPassword: [password("New password")],
    }
  );

  const next = typeof input.newPassword === "string" ? input.newPassword : "";
  const current = typeof input.currentPassword === "string" ? input.currentPassword : "";

  if (!errors.newPassword && next === current && next) {
    errors.newPassword = "Your new password must be different from your current one.";
  }

  if (input.confirmPassword !== undefined) {
    const confirm = typeof input.confirmPassword === "string" ? input.confirmPassword : "";
    if (!confirm) {
      errors.confirmPassword = "Please re-enter your new password.";
    } else if (confirm !== next) {
      errors.confirmPassword = "The two passwords don't match.";
    }
  }

  return errors;
}

/* ── Account details ────────────────────────────────────────── */

export type AccountInput = {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  personalEmail: string;
  contactNumber: string;
  facebookLink: string;
  discordName: string;
  yearLevel: number;
  degreeProgram: string;
};

/** The fields a member may change about themselves. */
export const ACCOUNT_FIELDS = [
  "firstName",
  "middleName",
  "lastName",
  "suffix",
  "personalEmail",
  "contactNumber",
  "facebookLink",
  "discordName",
  "yearLevel",
  "degreeProgram",
] as const;

export type AccountField = (typeof ACCOUNT_FIELDS)[number];

const ACCOUNT_RULES: Record<AccountField, Rule[]> = {
  firstName: [required("First name"), personName("First name")],
  middleName: [personName("Middle name")],
  lastName: [required("Last name"), personName("Last name")],
  suffix: [maxLength("Suffix", 10)],
  personalEmail: [required("Personal email"), email("Personal email")],
  contactNumber: [required("Contact number"), phone()],
  facebookLink: [required("Facebook link"), urlOn("Facebook link", ["facebook.com", "fb.com", "fb.me"])],
  discordName: [maxLength("Discord username", 32)],
  yearLevel: [required("Year level"), integerBetween("Year level", 1, 8)],
  degreeProgram: [
    required("Degree program"),
    minLength("Degree program", 2),
    maxLength("Degree program", 100),
  ],
};

/**
 * Validates an account edit and returns the normalised values.
 *
 * Only the keys actually present are checked, so the form can PATCH a single
 * row without having to send — and re-validate — the whole profile. Unknown
 * keys are dropped rather than rejected: `role`, `points` and `studentId` are
 * not member-editable, and silently ignoring them means a crafted body can't
 * privilege-escalate through this endpoint.
 */
export function validateAccount(
  input: Record<string, unknown>
): Validated<Partial<AccountInput>> {
  const present = ACCOUNT_FIELDS.filter((f) => input[f] !== undefined);

  if (present.length === 0) {
    return { ok: false, errors: { _form: "No editable fields were supplied." } };
  }

  const subject = Object.fromEntries(present.map((f) => [f, input[f]])) as Record<
    AccountField,
    unknown
  >;
  const rules = Object.fromEntries(present.map((f) => [f, ACCOUNT_RULES[f]])) as Record<
    AccountField,
    Rule[]
  >;

  const errors = check(subject, rules);
  if (hasErrors(errors)) return { ok: false, errors };

  const value: Partial<AccountInput> = {};
  for (const field of present) {
    value[field] =
      field === "yearLevel"
        ? (Number(str(input[field])) as never)
        : (str(input[field]) as never);
  }

  return { ok: true, value };
}
