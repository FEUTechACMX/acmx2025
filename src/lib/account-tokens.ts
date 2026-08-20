/**
 * Account claim / reset tokens — mint hashed, single-use, 2-hour expiry.
 * SPEC-D5 §8.1 / §12.
 */
import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { AccountTokenKind } from "@prisma/client";

export const ACCOUNT_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
export const ACCOUNT_EMAIL_DAILY_CAP = 300;

export const ACCOUNT_REQUEST_OK =
  "If that student number is on file, check your FEU Tech email for the link.";

export const ACCOUNT_REQUEST_FULL =
  "Claiming is full for today — please request again tomorrow.";

export function hashAccountToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/** 32 random bytes, base64url (no padding). */
export function mintRawAccountToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Start of "today" and start of tomorrow in Asia/Manila, as UTC Date bounds. */
export function manilaDayBounds(now: Date = new Date()): { start: Date; end: Date } {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  // Interpret Manila midnight as an absolute instant via offset +08:00.
  const start = new Date(`${today}T00:00:00+08:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function countTokensCreatedToday(now: Date = new Date()): Promise<number> {
  const { start, end } = manilaDayBounds(now);
  return prisma.accountToken.count({
    where: { createdAt: { gte: start, lt: end } },
  });
}

export async function dailyCapReached(now: Date = new Date()): Promise<boolean> {
  return (await countTokensCreatedToday(now)) >= ACCOUNT_EMAIL_DAILY_CAP;
}

/**
 * Invalidate prior unused tokens for this user, then mint a fresh one.
 * Returns the raw token (for the email only) and the row.
 */
export async function issueAccountToken(
  userId: string,
  kind: AccountTokenKind,
  now: Date = new Date()
): Promise<{ raw: string; id: string; expiresAt: Date }> {
  const raw = mintRawAccountToken();
  const tokenHash = hashAccountToken(raw);
  const expiresAt = new Date(now.getTime() + ACCOUNT_TOKEN_TTL_MS);

  const row = await prisma.$transaction(async (tx) => {
    await tx.accountToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: now },
    });
    return tx.accountToken.create({
      data: { userId, tokenHash, kind, expiresAt },
    });
  });

  return { raw, id: row.id, expiresAt };
}

export type ResolvedAccountToken = {
  id: string;
  userId: string;
  kind: AccountTokenKind;
  expiresAt: Date;
  usedAt: Date | null;
  user: {
    id: string;
    studentId: string;
    contactNumber: string;
    schoolEmail: string;
    personalEmail: string;
    mustChangePassword: boolean;
  };
};

/** Hash-match lookup. Caller decides expired / used messaging. */
export async function findAccountTokenByRaw(
  raw: string
): Promise<ResolvedAccountToken | null> {
  if (!raw) return null;
  const tokenHash = hashAccountToken(raw);
  return prisma.accountToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      kind: true,
      expiresAt: true,
      usedAt: true,
      user: {
        select: {
          id: true,
          studentId: true,
          contactNumber: true,
          schoolEmail: true,
          personalEmail: true,
          mustChangePassword: true,
        },
      },
    },
  });
}

export function isTokenRedeemable(
  token: { expiresAt: Date; usedAt: Date | null },
  now: Date = new Date()
): boolean {
  return token.usedAt == null && token.expiresAt.getTime() > now.getTime();
}
