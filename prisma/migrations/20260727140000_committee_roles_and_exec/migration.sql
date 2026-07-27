-- The three executive roles. They sit above EXECUTIVES_MEDIA in the enum and
-- are treated as full console administrators in src/types/auth.ts.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'VP_EXTERNAL';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'VP_INTERNAL';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PRESIDENT';

-- The ACMx dev track's three positions. Added, never used in this file: a new
-- enum value can't be referenced in the transaction that creates it.
ALTER TYPE "CommitteeMemberRole" ADD VALUE IF NOT EXISTS 'PROJECT_LEAD';
ALTER TYPE "CommitteeMemberRole" ADD VALUE IF NOT EXISTS 'LEAD_DEV';
ALTER TYPE "CommitteeMemberRole" ADD VALUE IF NOT EXISTS 'JUNIOR_DEV';

-- CreateEnum
CREATE TYPE "CommitteeTrack" AS ENUM ('STANDARD', 'DEV');

-- AlterTable
ALTER TABLE "Committee" ADD COLUMN "track" "CommitteeTrack" NOT NULL DEFAULT 'STANDARD';

-- Drop any duplicate seats before the constraint can reject them. NULL userIds
-- are left alone: Postgres treats them as distinct in a unique index.
DELETE FROM "CommitteeMember" a
USING "CommitteeMember" b
WHERE a."userId" IS NOT NULL
  AND a."userId" = b."userId"
  AND a."committeeId" = b."committeeId"
  AND a."id" > b."id";

-- CreateIndex
CREATE UNIQUE INDEX "CommitteeMember_committeeId_userId_key"
  ON "CommitteeMember"("committeeId", "userId");
