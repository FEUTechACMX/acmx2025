-- =============================================================================
-- REVIEW ONLY — do not apply from a laptop. Do not run `prisma migrate`,
-- `db push`, `db pull`, or any seed against live.
--
-- File: sql/REVIEW_ONLY_membership_drive.sql
-- Purpose: additive Membership Drive schema for human review + backup + apply.
-- Source: ACMX-BUILD-DIRECTIVE.md §4 (2026-08-19).
--
-- ORDER MATTERS
--   1. Backup the live DB (~480 real User rows).
--   2. Apply THIS file (enums + User.membershipStatus FIRST, then new tables).
--   3. Confirm existing rows are APPROVED:
--        SELECT "membershipStatus", COUNT(*) FROM "User" GROUP BY 1;
--   4. Create the PRIVATE Supabase Storage bucket `membership-proof`
--      (no anon read). Not SQL — dashboard / storage API.
--   5. Set booth event id env on Vercel + local `.env`.
--   6. ONLY THEN deploy login-gate code. The gate must not ship before
--      "User"."membershipStatus" exists, or login breaks for everyone.
--
-- Apply atomically (directive §4 B):
--   psql --single-transaction -f sql/REVIEW_ONLY_membership_drive.sql
--   or rely on the BEGIN/COMMIT wrap below.
--
-- This file does NOT:
--   - drop or rename existing columns
--   - change User.role / passwords / emails
--   - write a Prisma migration under prisma/migrations/
--   - touch Committee.applyUrl (D4 is a UI repoint in CommitteePlate)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "BundleKind" AS ENUM ('SOLO', 'PARTNER', 'BUNDLE_5', 'BUNDLE_8');
CREATE TYPE "ApplicationKind" AS ENUM ('NEW', 'RENEWAL');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "JOApplicationStatus" AS ENUM (
  'PENDING',
  'SHORTLISTED',
  'ACCEPTED',
  'WAITLISTED',
  'REJECTED'
);

-- ---------------------------------------------------------------------------
-- 2. User.membershipStatus
--    DEFAULT 'APPROVED' backfills every existing row the moment the column
--    is added. New applicants are inserted as PENDING by the app, explicitly.
-- ---------------------------------------------------------------------------

ALTER TABLE "User"
  ADD COLUMN "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'APPROVED';

-- ---------------------------------------------------------------------------
-- 3. MembershipApplication (one payer + one proof; bundle covers N people)
-- ---------------------------------------------------------------------------

CREATE TABLE "MembershipApplication" (
    "id"              TEXT NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    "payerUserId"     TEXT NOT NULL,
    "bundle"          "BundleKind" NOT NULL,
    "kind"            "ApplicationKind" NOT NULL,
    "proofStorageKey" TEXT NOT NULL,
    "proofUploadedAt" TIMESTAMP(3) NOT NULL,
    "status"          "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "decidedByUserId" TEXT,
    "decidedAt"       TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "MembershipApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MembershipApplication_status_idx"
  ON "MembershipApplication"("status");

CREATE INDEX "MembershipApplication_payerUserId_idx"
  ON "MembershipApplication"("payerUserId");

ALTER TABLE "MembershipApplication"
  ADD CONSTRAINT "MembershipApplication_payerUserId_fkey"
  FOREIGN KEY ("payerUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MembershipApplication"
  ADD CONSTRAINT "MembershipApplication_decidedByUserId_fkey"
  FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 4. MembershipApplicationMember
--    createdAsPending = true  → this application INSERTed the User as PENDING.
--    createdAsPending = false → the User already existed (renewal payer).
--    B1: reject/approve may only flip membershipStatus when createdAsPending
--        is true AND the User is still PENDING. Never downgrade APPROVED.
-- ---------------------------------------------------------------------------

CREATE TABLE "MembershipApplicationMember" (
    "id"               TEXT NOT NULL,
    "applicationId"    TEXT NOT NULL,
    "userId"           TEXT NOT NULL,
    "orderIndex"       INTEGER NOT NULL DEFAULT 0,
    "createdAsPending" BOOLEAN NOT NULL,

    CONSTRAINT "MembershipApplicationMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MembershipApplicationMember_applicationId_userId_key"
  ON "MembershipApplicationMember"("applicationId", "userId");

CREATE INDEX "MembershipApplicationMember_userId_idx"
  ON "MembershipApplicationMember"("userId");

ALTER TABLE "MembershipApplicationMember"
  ADD CONSTRAINT "MembershipApplicationMember_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "MembershipApplication"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MembershipApplicationMember"
  ADD CONSTRAINT "MembershipApplicationMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 5. CommitteeQuestion — exactly 3 Likert statements per committee, editable
-- ---------------------------------------------------------------------------

CREATE TABLE "CommitteeQuestion" (
    "id"          TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "order"       INTEGER NOT NULL,
    "text"        TEXT NOT NULL,
    "active"      BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CommitteeQuestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommitteeQuestion_committeeId_order_key"
  ON "CommitteeQuestion"("committeeId", "order");

ALTER TABLE "CommitteeQuestion"
  ADD CONSTRAINT "CommitteeQuestion_committeeId_fkey"
  FOREIGN KEY ("committeeId") REFERENCES "Committee"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 6. JOApplication + JOAnswer
--    One application per User. shareToken is an opaque public card key.
-- ---------------------------------------------------------------------------

CREATE TABLE "JOApplication" (
    "id"                 TEXT NOT NULL,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3) NOT NULL,
    "userId"             TEXT NOT NULL,
    "targetCommitteeId"  TEXT NOT NULL,
    "shareToken"         TEXT NOT NULL,
    "status"             "JOApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "decidedByUserId"    TEXT,
    "decidedAt"          TIMESTAMP(3),

    CONSTRAINT "JOApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JOApplication_userId_key" ON "JOApplication"("userId");
CREATE UNIQUE INDEX "JOApplication_shareToken_key" ON "JOApplication"("shareToken");
CREATE INDEX "JOApplication_status_idx" ON "JOApplication"("status");

ALTER TABLE "JOApplication"
  ADD CONSTRAINT "JOApplication_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "JOApplication"
  ADD CONSTRAINT "JOApplication_targetCommitteeId_fkey"
  FOREIGN KEY ("targetCommitteeId") REFERENCES "Committee"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "JOApplication"
  ADD CONSTRAINT "JOApplication_decidedByUserId_fkey"
  FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "JOAnswer" (
    "id"            TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "questionId"    TEXT NOT NULL,
    "value"         INTEGER NOT NULL,

    CONSTRAINT "JOAnswer_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "JOAnswer_value_range" CHECK ("value" >= 1 AND "value" <= 7)
);

CREATE UNIQUE INDEX "JOAnswer_applicationId_questionId_key"
  ON "JOAnswer"("applicationId", "questionId");

ALTER TABLE "JOAnswer"
  ADD CONSTRAINT "JOAnswer_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "JOApplication"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JOAnswer"
  ADD CONSTRAINT "JOAnswer_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "CommitteeQuestion"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 7. InterviewSlot + InterviewBooking
--    Capacity is enforced in the book transaction, not by a DB exclusion.
--    One booking per JO application.
-- ---------------------------------------------------------------------------

CREATE TABLE "InterviewSlot" (
    "id"                TEXT NOT NULL,
    "startsAt"          TIMESTAMP(3) NOT NULL,
    "durationMinutes"   INTEGER NOT NULL DEFAULT 30,
    "interviewerUserId" TEXT,
    "location"          TEXT NOT NULL,
    "capacity"          INTEGER NOT NULL DEFAULT 1,
    "createdByUserId"   TEXT NOT NULL,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSlot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InterviewSlot_startsAt_idx" ON "InterviewSlot"("startsAt");

ALTER TABLE "InterviewSlot"
  ADD CONSTRAINT "InterviewSlot_interviewerUserId_fkey"
  FOREIGN KEY ("interviewerUserId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InterviewSlot"
  ADD CONSTRAINT "InterviewSlot_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "InterviewBooking" (
    "id"            TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slotId"        TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,

    CONSTRAINT "InterviewBooking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InterviewBooking_applicationId_key"
  ON "InterviewBooking"("applicationId");

CREATE UNIQUE INDEX "InterviewBooking_slotId_applicationId_key"
  ON "InterviewBooking"("slotId", "applicationId");

CREATE INDEX "InterviewBooking_slotId_idx" ON "InterviewBooking"("slotId");

ALTER TABLE "InterviewBooking"
  ADD CONSTRAINT "InterviewBooking_slotId_fkey"
  FOREIGN KEY ("slotId") REFERENCES "InterviewSlot"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InterviewBooking"
  ADD CONSTRAINT "InterviewBooking_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "JOApplication"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
