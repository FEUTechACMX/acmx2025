/**
 * Membership Drive helpers — validation, bundle size, unique-collision copy,
 * and the B1 approve/reject rule. Imported by both the public form and the
 * route handlers so the two cannot drift.
 */
import {
  check,
  email,
  hasErrors,
  integerBetween,
  maxLength,
  minLength,
  oneOf,
  personName,
  phone,
  required,
  str,
  urlOn,
  validatePasswordStrength,
  type FieldErrors,
  type Rule,
  type Validated,
} from "@/lib/validation";
import { normalizeSchoolEmail, schoolEmail } from "@/lib/school-email";
import type { BundleKind, MembershipStatus } from "@prisma/client";

export const BUNDLE_KINDS = ["SOLO", "PARTNER", "BUNDLE_5", "BUNDLE_8"] as const;
export type BundleKindValue = (typeof BUNDLE_KINDS)[number];

export const BUNDLE_SIZE: Record<BundleKindValue, number> = {
  SOLO: 1,
  PARTNER: 2,
  BUNDLE_5: 5,
  BUNDLE_8: 8,
};

/** Same sentence for studentId / email collisions — do not reveal which field. */
export const EXISTING_ACCOUNT_ERROR =
  "This student ID already has an account — please log in to renew.";

export const UNIQUE_IN_BUNDLE_ERROR =
  "Each person in a bundle must have a unique student number, school email, and personal email.";

export const UNIQUE_TAKEN_ERROR =
  "That student number or email is already in use. Please check the details and try again.";

export type MembershipPersonInput = {
  studentId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  yearLevel: number;
  degreeProgram: string;
  schoolEmail: string;
  personalEmail: string;
  contactNumber: string;
  facebookLink: string;
  discordName: string;
  password: string;
};

const PERSON_RULES = {
  studentId: [required("Student number"), maxLength("Student number", 20)],
  firstName: [required("First name"), personName("First name")],
  middleName: [personName("Middle name")],
  lastName: [required("Last name"), personName("Last name")],
  suffix: [maxLength("Suffix", 10)],
  yearLevel: [required("Year level"), integerBetween("Year level", 1, 8)],
  degreeProgram: [
    required("Degree program"),
    minLength("Degree program", 2),
    maxLength("Degree program", 100),
  ],
  schoolEmail: [required("School email"), schoolEmail()],
  personalEmail: [required("Personal email"), email("Personal email")],
  contactNumber: [required("Contact number"), phone()],
  facebookLink: [required("Facebook link"), urlOn("Facebook link", ["facebook.com", "fb.com", "fb.me"])],
  discordName: [maxLength("Discord username", 32)],
  password: [required("Password")],
} satisfies Record<keyof MembershipPersonInput, Rule[]>;

export function normalizePerson(
  raw: Record<string, unknown>
): Record<keyof MembershipPersonInput, unknown> {
  return {
    studentId: str(raw.studentId),
    firstName: str(raw.firstName),
    middleName: str(raw.middleName),
    lastName: str(raw.lastName),
    suffix: str(raw.suffix),
    yearLevel:
      raw.yearLevel === undefined || raw.yearLevel === null || raw.yearLevel === ""
        ? ""
        : String(raw.yearLevel),
    degreeProgram: str(raw.degreeProgram),
    schoolEmail: normalizeSchoolEmail(raw.schoolEmail),
    personalEmail: str(raw.personalEmail).toLowerCase(),
    contactNumber: str(raw.contactNumber),
    facebookLink: str(raw.facebookLink),
    discordName: str(raw.discordName),
    password: typeof raw.password === "string" ? raw.password : "",
  };
}

export function validatePerson(
  raw: Record<string, unknown>
): Validated<MembershipPersonInput> {
  const subject = normalizePerson(raw);
  const errors = check(subject, PERSON_RULES);
  const pwd = typeof subject.password === "string" ? subject.password : "";
  const strength = validatePasswordStrength(pwd, {
    studentId: str(subject.studentId),
    contactNumber: str(subject.contactNumber),
    schoolEmail: str(subject.schoolEmail),
    personalEmail: str(subject.personalEmail),
  });
  if (strength) errors.password = strength;
  if (hasErrors(errors)) return { ok: false, errors };
  return {
    ok: true,
    value: {
      studentId: str(subject.studentId),
      firstName: str(subject.firstName),
      middleName: str(subject.middleName),
      lastName: str(subject.lastName),
      suffix: str(subject.suffix),
      yearLevel: Number(subject.yearLevel),
      degreeProgram: str(subject.degreeProgram),
      schoolEmail: str(subject.schoolEmail).toLowerCase(),
      personalEmail: str(subject.personalEmail).toLowerCase(),
      contactNumber: str(subject.contactNumber),
      facebookLink: str(subject.facebookLink),
      discordName: str(subject.discordName),
      password: pwd,
    },
  };
}

export type MembershipApplicationInput = {
  bundle: BundleKindValue;
  proofStorageKey: string;
  members: MembershipPersonInput[];
};

function uniqueKeys(people: MembershipPersonInput[]): string | null {
  const studentIds = new Set<string>();
  const personal = new Set<string>();
  const school = new Set<string>();
  for (const p of people) {
    const sid = p.studentId.toLowerCase();
    if (studentIds.has(sid) || personal.has(p.personalEmail) || school.has(p.schoolEmail)) {
      return UNIQUE_IN_BUNDLE_ERROR;
    }
    studentIds.add(sid);
    personal.add(p.personalEmail);
    school.add(p.schoolEmail);
    if (p.personalEmail === p.schoolEmail) {
      return "School email and personal email must be different.";
    }
  }
  return null;
}

export function validateMembershipApplication(
  input: Record<string, unknown>
): Validated<MembershipApplicationInput> {
  const bundleErrors = check(
    { bundle: input.bundle, proofStorageKey: input.proofStorageKey },
    {
      bundle: [required("Bundle"), oneOf("Bundle", BUNDLE_KINDS)],
      proofStorageKey: [required("Proof of payment"), maxLength("Proof of payment", 500)],
    }
  );
  if (hasErrors(bundleErrors)) return { ok: false, errors: bundleErrors };

  const bundle = str(input.bundle) as BundleKindValue;
  const expected = BUNDLE_SIZE[bundle];
  const rawMembers = Array.isArray(input.members) ? input.members : [];
  if (rawMembers.length !== expected) {
    return {
      ok: false,
      errors: {
        members: `This bundle needs exactly ${expected} ${expected === 1 ? "person" : "people"}.`,
      },
    };
  }

  const members: MembershipPersonInput[] = [];
  const memberErrors: FieldErrors = {};
  rawMembers.forEach((raw, i) => {
    const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const result = validatePerson(row);
    if (!result.ok) {
      for (const [k, v] of Object.entries(result.errors)) {
        if (v) memberErrors[`members.${i}.${k}`] = v;
      }
      return;
    }
    members.push(result.value);
  });
  if (hasErrors(memberErrors)) return { ok: false, errors: memberErrors };

  const clash = uniqueKeys(members);
  if (clash) return { ok: false, errors: { members: clash } };

  return {
    ok: true,
    value: {
      bundle,
      proofStorageKey: str(input.proofStorageKey),
      members,
    },
  };
}

/** Renewal: payer is the session user; teammates are extra NEW people only. */
export function validateRenewalPayload(
  input: Record<string, unknown>
): Validated<{ bundle: BundleKindValue; proofStorageKey: string; teammates: MembershipPersonInput[] }> {
  const bundleErrors = check(
    { bundle: input.bundle, proofStorageKey: input.proofStorageKey },
    {
      bundle: [required("Bundle"), oneOf("Bundle", BUNDLE_KINDS)],
      proofStorageKey: [required("Proof of payment"), maxLength("Proof of payment", 500)],
    }
  );
  if (hasErrors(bundleErrors)) return { ok: false, errors: bundleErrors };

  const bundle = str(input.bundle) as BundleKindValue;
  const expected = BUNDLE_SIZE[bundle] - 1;

  const raw = Array.isArray(input.teammates) ? input.teammates : [];
  if (raw.length !== expected) {
    return {
      ok: false,
      errors: {
        teammates: expected
          ? `Add exactly ${expected} teammate${expected === 1 ? "" : "s"} for this bundle.`
          : "Solo renewal has no teammates.",
      },
    };
  }

  const teammates: MembershipPersonInput[] = [];
  const errors: FieldErrors = {};
  raw.forEach((row, i) => {
    const result = validatePerson(
      row && typeof row === "object" ? (row as Record<string, unknown>) : {}
    );
    if (!result.ok) {
      for (const [k, v] of Object.entries(result.errors)) {
        if (v) errors[`teammates.${i}.${k}`] = v;
      }
      return;
    }
    teammates.push(result.value);
  });
  if (hasErrors(errors)) return { ok: false, errors };

  const clash = uniqueKeys(teammates);
  if (clash) return { ok: false, errors: { teammates: clash } };

  return {
    ok: true,
    value: { bundle, proofStorageKey: str(input.proofStorageKey), teammates },
  };
}

export function isPrismaUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}

/** B1: only Users this application created as PENDING may have status flipped. */
export function mayFlipMembershipStatus(member: {
  createdAsPending: boolean;
  membershipStatus: MembershipStatus;
}): boolean {
  return member.createdAsPending && member.membershipStatus === "PENDING";
}

export function isApprovedMember(status: MembershipStatus | undefined): boolean {
  return status === "APPROVED";
}

export type { BundleKind };
