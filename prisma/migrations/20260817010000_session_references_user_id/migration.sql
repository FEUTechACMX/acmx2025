-- Repoint Session.userId at User.id.
--
-- The column was named `userId` but referenced `User.studentId`, alone among
-- every relation in the schema. That forced `where: { userId: user.studentId }`
-- into four call sites, each of which read like a defect and was not one.
--
-- Also adds the cascade (deleting a user previously failed on this foreign key)
-- and the index (every revoke and every password change looks sessions up by
-- user, and was doing a sequential scan).

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";

-- Translate any existing rows from a student number to the account's real id.
UPDATE "Session" s
SET "userId" = u."id"
FROM "User" u
WHERE s."userId" = u."studentId";

-- Anything that failed to translate referenced no live account. Those sessions
-- are already unusable — getCurrentUser joins through this column — so they go
-- rather than block the foreign key below.
DELETE FROM "Session" s
WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u."id" = s."userId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
