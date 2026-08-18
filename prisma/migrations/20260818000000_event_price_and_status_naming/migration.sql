-- Naming, not data. Every statement here is a rename: no column is dropped,
-- no value is rewritten, and the migration is reversible by inverting it.
--
-- CLEANUP.md 4.4: `Event.price` was the *officer* tier while `priceMember` and
-- `priceNonMember` said what they were, so the one field whose name carried no
-- tier was the one that needed it most. `registrationFees` was prose describing
-- the same fact the numbers already held, with nothing reconciling the two; it
-- becomes `feeNote`, which is supplementary by name.
--
-- CLEANUP.md 4.7: the enum is an officer's explicit override, not the status.
-- The real status is derived (see getEventStatus), and `statusOverride` is
-- nullable precisely because null means "derive it".

ALTER TABLE "Event" RENAME COLUMN "price" TO "priceOfficer";
ALTER TABLE "Event" RENAME COLUMN "registrationFees" TO "feeNote";

ALTER TYPE "EventStatus" RENAME TO "EventStatusOverride";
