# SQL — how to run these

All schema changes live here as **reviewable `.sql` files**. You run them yourself in the
**Supabase SQL Editor** (open the file → copy all → paste → Run). Nothing here is applied
automatically, and Cursor never runs them.

## Folder layout
- **`migrations/`** — additive schema changes to apply to the database, in order.
- (future) **`seeds/`** — data seeds (e.g. committee questions) once finalized.

## Order to apply — always test first, then live
Run each file **on `acmx-test` first**, confirm the app works, then on **live after a fresh
backup**. Each file is wrapped in `BEGIN … COMMIT`, so it's all-or-nothing (a failure rolls
back cleanly).

| # | File | What it adds |
|---|------|--------------|
| 1 | `migrations/REVIEW_ONLY_membership_drive.sql` | Membership drive: enums, `User.membershipStatus`, application/committee-question/JO/interview tables |
| 2 | `migrations/REVIEW_ONLY_account_security.sql` | Account security: `User.mustChangePassword`, `AccountToken` table |

## Golden rules (from the project charter)
- **Never** run `prisma migrate` / `db push` / `db pull` / `db seed` against live.
- Back up live (`pg_dump`) **before** applying anything to it.
- Apply to **acmx-test** → test the app → **then** live.
- After applying, the schema in `prisma/schema.prisma` must match; `prisma generate` (safe,
  reads local files only) regenerates the client.

Always `pg_dump` the target database before applying anything to it.
