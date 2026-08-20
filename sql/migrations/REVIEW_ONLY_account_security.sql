-- =============================================================================
-- REVIEW ONLY — do not apply from a laptop. Do not run `prisma migrate`,
-- `db push`, `db pull`, or any seed against live or acmx-test from Cursor.
--
-- File: sql/REVIEW_ONLY_account_security.sql
-- Purpose: additive D5 account-security schema (mustChangePassword + AccountToken).
-- Source: SPEC-D5-account-security.md §8.1 / §12 (2026-08-20).
--
-- ORDER MATTERS
--   1. Backup the target DB.
--   2. Apply THIS file atomically (BEGIN/COMMIT or psql --single-transaction).
--   3. Confirm legacy rows must change:
--        SELECT "mustChangePassword", COUNT(*) FROM "User" GROUP BY 1;
--      Expect nearly all existing rows → true (DEFAULT).
--   4. Set env on Vercel + local: GMAIL_USER, GMAIL_APP_PASSWORD,
--      NEXT_PUBLIC_BASE_URL, MEMBERSHIP_WINDOW_*, JO_WINDOW_*.
--   5. Deploy claim/login-gate code only after this column exists.
--
-- This file does NOT:
--   - drop or rename existing columns
--   - change passwords / emails
--   - write a Prisma migration under prisma/migrations/
-- =============================================================================

BEGIN;

-- On User: the claim flag (DEFAULT true backfills all legacy rows)
ALTER TABLE "User"
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;

-- New table: one-time tokens for CLAIM and RESET (same mechanism, different email copy)
CREATE TYPE "AccountTokenKind" AS ENUM ('CLAIM', 'RESET');

CREATE TABLE "AccountToken" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "kind"      "AccountTokenKind" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AccountToken_tokenHash_key" ON "AccountToken"("tokenHash");
CREATE INDEX "AccountToken_userId_idx" ON "AccountToken"("userId");

ALTER TABLE "AccountToken"
  ADD CONSTRAINT "AccountToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
