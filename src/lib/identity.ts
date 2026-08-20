/**
 * Credentials and session issuance.
 *
 * Deliberately separate from `lib/auth.ts`, which *reads* and gates sessions:
 * `auth.ts` is imported by around thirty route handlers, and folding `bcrypt`
 * into it would drag the hashing library into every one of their bundles. So the
 * split here is by dependency weight, not by taste — reading a session is cheap
 * and ubiquitous, minting one is neither.
 *
 * Moved from `src/services/identity/` (CLEANUP.md §5.3).
 */
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

//Log-In logic
export async function login(studentId: string, password: string) {
  async function verifyPassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }

  const user = await prisma.user.findUnique({
    where: {
      studentId: studentId,
    },
  });

  if (!user) throw new Error("Invalid Credentials");

  const valid = await verifyPassword(password, user.password);
  if (!valid) throw new Error("Invalid Password");

  // Generic on purpose: PENDING vs REJECTED vs missing must be indistinguishable
  // from outside (ACMX-BUILD-DIRECTIVE.md §4.5). The login route already maps
  // every throw onto one REFUSED sentence.
  if (user.membershipStatus !== "APPROVED") throw new Error("Invalid Credentials");

  // Unclaimed legacy accounts: phone-number password grants nothing (SPEC-D5 §8.3).
  // Same generic throw — do not reveal "must claim".
  if (user.mustChangePassword) throw new Error("Invalid Credentials");

  // Strip password before returning
  const { password: _, ...safeUser } = user;
  return safeUser;
}

/**
 * Opens a session for an account.
 *
 * `userId` is a real `User.id`. It used to be the student number, because
 * `Session.userId` referenced `User.studentId` — see the migration
 * 20260817010000_session_references_user_id.
 */
export async function createSession(userId: string) {
  // Clean up expired sessions to prevent table bloat
  await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  const sessionId = crypto.randomUUID();
  await prisma.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });
  return sessionId;
}

export type PendingUserInput = {
  studentId: string;
  password: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  yearLevel: number;
  degreeProgram: string;
  personalEmail: string;
  schoolEmail: string;
  contactNumber: string;
  facebookLink: string;
  discordName: string;
};

/** Inserts a User as PENDING. Never call this for an existing studentId. */
export async function createPendingUser(
  input: PendingUserInput,
  db: { user: { create: typeof prisma.user.create } } = prisma
) {
  const hashed = await bcrypt.hash(input.password, 12);
  return db.user.create({
    data: {
      studentId: input.studentId,
      password: hashed,
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      suffix: input.suffix || null,
      yearLevel: input.yearLevel,
      degreeProgram: input.degreeProgram,
      personalEmail: input.personalEmail,
      schoolEmail: input.schoolEmail,
      contactNumber: input.contactNumber,
      facebookLink: input.facebookLink,
      discordName: input.discordName || null,
      role: "MEMBER",
      membershipStatus: "PENDING",
      mustChangePassword: false,
    },
  });
}

