-- The presentation half of an officer (CLEANUP.md 7.4).
--
-- Additive only: one new table, one unique index, one foreign key. Nothing
-- existing is altered, so this is safe to apply ahead of the code that reads it.
--
-- Who holds a post stays on `User.role`. This table holds only what an account
-- cannot say — a tagline, a portrait, when the term began, two social links.

CREATE TABLE "OfficerProfile" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "tagline"   TEXT,
    "photo"     TEXT,
    "since"     TEXT,
    "instagram" TEXT,
    "linkedin"  TEXT,
    "order"     INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficerProfile_pkey" PRIMARY KEY ("id")
);

-- One profile per person.
CREATE UNIQUE INDEX "OfficerProfile_userId_key" ON "OfficerProfile"("userId");

-- Deleting an account takes its profile with it; a profile is meaningless alone.
ALTER TABLE "OfficerProfile"
  ADD CONSTRAINT "OfficerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
