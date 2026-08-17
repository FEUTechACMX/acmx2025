-- Drop two models that had no product behind them.
--
-- `Lesson` was served by /api/lessons and read by nothing.
-- `Schedule` was read by two prefill routes for `section` / `professor`, but
-- nothing in the codebase ever wrote a row — both readers already coalesced to
-- "" on every call, so removing the table changes no response.

-- DropForeignKey
ALTER TABLE "Schedule" DROP CONSTRAINT IF EXISTS "Schedule_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "Schedule";

-- DropTable
DROP TABLE IF EXISTS "Lesson";
