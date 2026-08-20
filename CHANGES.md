# Changes — Membership Drive & Account Security

Feature work on `feat/membership-drive-account-security`, summarized for reviewers.

## What's new
- **Membership drive** — public "Become a Member" registration (Solo / Partner / Bundle-5 /
  Bundle-8, new applicants only), proof-of-payment upload, officer approval. Member data lives
  in Postgres via Prisma.
- **Committee-fit questionnaire + JO application** — per-committee description + 3 statements
  (7-point Likert); a JO application tied to a target committee; shareable fit result.
- **Interview scheduling v1** — predefined slots, pick-and-lock with server-side capacity.
- **Booth every-20th celebration + live welcome wall** — realtime count for a booth event.
- **Account security (first login)** — legacy accounts (old passwords) claim their account via
  a one-time link emailed to their `@fit.edu.ph`, then set a strong password. The same flow
  serves forgot-password. A `mustChangePassword` gate means an unclaimed account cannot sign in
  with the old password.
- **Campaign windows** — membership + JO windows gated by server env vars.
- **Officer console rebrand → "Nexus" (ACM–FIT Officer Portal)** + membership-drive reporting
  for the exec board.

## Notes for reviewers
- **Auth is unchanged** — still custom cookie-session + bcrypt. No Supabase Auth.
- **Schema changes are additive and applied by hand.** See `sql/migrations/` (reviewable `.sql`,
  wrapped in `BEGIN…COMMIT`): enums, `User.membershipStatus`, `User.mustChangePassword`,
  `AccountToken`, plus membership / committee-question / JO / interview tables. **No**
  `prisma migrate` / `db push` / `db pull` was run against live — `prisma/schema.prisma` was
  hand-matched to the SQL, then `prisma generate`. Apply order + rules: `sql/README.md`.
- **Reused existing helpers** (no parallel versions): `requireRole` / `requireUser` (`lib/auth`),
  `check()` (`lib/validation`), `createThrottle` / `clientAddress` (`lib/rate-limit`),
  `sniff` / `BUCKET_KINDS` (`lib/uploads`), role guards (`types/auth`).
- **Proof-of-payment security** — uploads go to a **private** `membership-proof` bucket via the
  service role; admin views use short-lived signed URLs; `/api/upload` rejects that bucket so a
  public URL is never generated; uploads are magic-byte validated.
- **Anti-enumeration** — login and account-request return a single generic message;
  account-request validates the student-number format (8–11 digits) with no DB lookup.
- **Email** — Nodemailer over Gmail SMTP (app password). New dependency: `nodemailer`.
- **New env vars** (see `.env.example`): `GMAIL_USER`, `GMAIL_APP_PASSWORD`,
  `NEXT_PUBLIC_BASE_URL` (email links build from it), `MEMBERSHIP_WINDOW_START/END`,
  `JO_WINDOW_START/END`, `BOOTH_EVENT_ID`.

## Applying the schema
Run the files in `sql/migrations/` (in order) in the Supabase SQL Editor **after a backup** —
test database first, then live. Details in `sql/README.md`.

## Deferred (follow-ups)
- Interview slots: committee association + a second interviewer (both need schema).
- Committee-fit dropdown styling consistency.
- A `WEBMASTER` board role so the webmaster appears on the public officer roster.
