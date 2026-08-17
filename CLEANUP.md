# ACMX — Cleanup Register

An audit of the repository as it stands on branch `merchandise-update`
(2026-08-17). Every entry below is something that is *wrong*, *duplicated*,
*dead*, or *inconsistent* — not a feature request.

This complements `DOCUMENTATION.md`. That file explains how the system is meant
to work and lists a short "Known rough edges" section; this file is the full
defect and debt register, with file/line references and a suggested fix for
each.

**Verification state at audit time:** `npx tsc --noEmit` passed clean.
`npx eslint src` reported **6 errors, 14 warnings**. No test suite exists, so
nothing else was machine-verified — the findings below come from reading the
code.

---

## 0. Progress

Cleanup began 2026-08-17 on branch `clean-up`.

| Metric | At audit | Now |
|---|---|---|
| `eslint src` | 6 errors, 14 warnings | **0 errors, 0 warnings**, enforced by `--max-warnings 0` |
| `@font-face` families / files | 9 / 10 | **4 / 5**, all `font-display: swap` |
| tests | none | **132**, via `npm test`, in CI |
| `!important` in `globals.css` | 68 | **0** |
| dependencies | 18 + 12 | **9 + 10** |
| lines in `src/` | 24,905 | **22,957** (net of ~200 lines of new walk-in code) |
| `next build` | not run | **passes on Turbopack** (`--webpack` opt-out removed) |
| prerendered page routes | 0 | **7** |

### Closed

| § | Item | Note |
|---|---|---|
| 2.1 | Public attendance-lookup PII leak | Feature deleted entirely — route, component and call site |
| 2.2 | Registration endpoints trusted body `userId` | Rewritten: identity is derived from the session, never the payload; full validation via `lib/validation.ts`; event existence checked |
| 3.1 | `getPhilippineTime()` stored a wrong instant | Helper replaced with UTC storage + Manila formatting. **No backfill needed — `Attendance` had 0 rows** |
| 3.2 | Duplicate time-in threw a raw P2002 | Now a 409 "Already checked in." |
| 3.3 | `recordTimeOut` overwrote an existing time-out | Guarded on `timeOut: null`; repeat scans 409 |
| 4.1 | `Session.userId` referenced `studentId` | Repointed at `User.id`; four compensating call sites simplified |
| 4.2 | `Session` had no cascade, no index | Both added |
| 4.3 | Baseline migration was a comment | Replaced with 227 lines of real DDL, statically verified against the later migrations. `migration_lock.toml` was also missing and is now present |
| 4.5 | Models with no product behind them | `Lesson` and `Schedule` dropped (both verified 0 rows). `Transaction` + `User.points` retained — points economy is planned |
| 4.6 | `Attendance.userId` never populated | Now written from the registration |
| 5.2 | Two parallel event-admin systems | Old route, `AdminDaySelector` and `AdminEventPanel` deleted; walk-in registration ported into `EventEditor` |
| 6.1 | Two registration endpoints | `/complete` is now a re-export of the fixed handler, kept only in case an external caller exists |
| 6.2 | Six seed scripts | Stale `seed-members.js` (compiled output) and `prisma/seed-members.ts` deleted; remaining seeds wired to `npm run seed:*` |
| 6.3 | Duplicate NavBar | Empty root `components/` removed |
| 7.1 | Orphaned components | All six deleted |
| 7.2 | Dead route files | `proxy.ts`, `server.js` deleted |
| 7.3 | Unused dependencies | Nine removed, including `xlsx` (unused once the old panel went, and carrying known advisories) |
| 12.3 | Two lockfiles | `pnpm-lock.yaml` deleted |

| 3.4 | Theme flash on DS-styled screens | `ThemeProvider` reads the `dark` class through `useSyncExternalStore` instead of copying it into state in an effect |
| 9.x | `.env.example` accuracy | `NEXT_PUBLIC_SUPABASE_ANON_KEY` became dead when `lib/supabase.ts` went; documented, with the grep that regenerates the list |
| 10.1 | Lint errors | **0 errors.** The `no-explicit-any` pair disappeared with the eslint 16 upgrade (that rule is not in the new preset) — `types/events.ts` still has two `any`, now unflagged |
| 11.1 | Prisma logged every query in production | Guarded by `NODE_ENV` |
| 11.2 | N+1 in the admin events list | Single `groupBy` |
| 11.3 | Session query repeated per request | `getCurrentUser` memoised with React `cache()`, keyed on session id |
| 12.4 | `eslint-config-next` a major behind | Bumped to 16; `eslint.config.mjs` rewritten to native flat config, which had been throwing before it linted a single file |
| 13.2 | No CI | `.github/workflows/ci.yml` — typecheck, lint, build, plus a job asserting the migration history still reproduces `schema.prisma` |
| 13.3 | `npm run lint` linted nothing | Now `eslint src` |
| 5.1 | Every page dynamic because the root layout hit the DB | Session read moved out of the layout into `components/sessionClient`. Six page routes plus `/_not-found` now prerender: `/about`, `/events`, `/hero`, `/login`, `/officers`, `/settings` |
| 13.5 | Build opted out of Turbopack | The `--webpack` flag was masking a real error: `registrations/complete` re-exported `dynamic`, which route segment config forbids. Fixed at the cause; builds on Turbopack |
| 5.4 | Role gating expressed four different ways | One `requireRole(req, guard)` in `lib/auth.ts`, plus `requireUser` for session-only routes. 27 route files adopted it. A fifth vocabulary turned up during the work — a local `gate()` helper duplicated across the two merch-item routes — and went with the rest |
| 9.1 | 403 returned where 401 is meant | Falls out of §5.4: 401 when there is no session, 403 only when a real role check fails. Verified against a running server — every gated route answers an unauthenticated caller with 401 and a message, and the only remaining 403s are genuine committee-scope denials |
| 2.5 | Login returned more of the user than `/api/me` | Projected through `toSafeUser`, whose parameter widened to `Omit<User, "password">` to accept the row `login()` returns |
| 2.6 | Upload did not validate file type | Content type is now read from the bytes (magic-byte sniff), not from the filename or the caller's `contentType`. Buckets are typed — `videos` takes video, the rest images — and a file whose sniffed kind doesn't match its bucket is refused. SVG is deliberately excluded as script-bearing. `upsert` off: the name is random, so it could only clobber |
| 2.8 | Service-role client built per request, before the auth check | Moved to module scope; the gate is now the handler's first statement |
| 3.7 | `EventsManager` shipped a placeholder as a primary action | The `alert()` is gone; NEW EVENT links to `/events`, where creation actually lives. It moves into the console once `EventCreationModal` is ported off Tailwind (§8.1) |
| 6.5 | Two Button and two Modal implementations | Not parallel systems — `UI/Button.tsx` and `Modal/Modal.tsx` had **zero importers**. Both deleted |
| 6.6 | Destructive actions used native `confirm()` | `useConfirm` in `ds/`, built on `ds/Modal`, adopted by all four sites (`CommitteeEditor`, `MediaLibrary`, `MerchandiseManager`, `VideosManager`). It keeps the one good property of `confirm()` — a single `await` at the call site, so the guard stays where the decision is — while gaining the theme, the focus trap, the scroll lock and a `danger` skin. Each prompt also gained the consequence in a sentence, and the non-destructive alternative where one exists ("hiding it instead keeps the record"). The fifth item in the table, `RegistrationModal`'s `alert("Successfully registered!")`, is now an in-modal confirmation panel — the alert fired *after* `onClose`, so a registrant's only acknowledgement was an OS dialog over a page that had already moved on. Both branches verified live: cancelling a real committee delete left all 9 intact, and confirming a throwaway merch item actually removed it |
| 9.2 (partly) | Response envelopes differ per route family | The defective part is fixed; the cosmetic part is deliberately left. See the note below |
| 2.7 | Rate limiting on exactly one route | Extracted into `lib/rate-limit.ts` and applied to `/api/login`, which had none — the endpoint an attacker would actually target. Two buckets, because either alone is wrong: **per account** (8 per 15 min) does the real work, **per address** (60 per 15 min) is deliberately loose because the chapter shares campus NAT and a tight IP limit would lock out everyone behind one address. A success resets the account bucket. 429 carries `Retry-After`. `change-password` now shares the implementation instead of holding its own copy. The honest limits — module memory, so per-instance and reset on redeploy — are documented at the top of the file, with a durable store named as the upgrade path. 14 tests |
| — | **Login leaked which accounts exist** | Not in the audit. `login()` throws "Invalid Credentials" for an unknown student number and "Invalid Password" for a real one, and the route returned `err.message` verbatim — so the two were distinguishable from outside. Since student numbers here are sequential, that let anyone walk the range and learn which are real before guessing a password. One fixed message for every failure now; verified identical for a real account with a wrong password and a number that cannot exist |
| 2.3 / 2.4 | Middleware authenticated on cookie *presence*; `authApiRoutes` was dead | Both closed by being honest rather than by adding a database read. Every page behind the matcher already calls `getCurrentUser()` and every API route goes through `requireRole`, so validating the session here would have cost a query per request for no security gain. What was actually wrong is that it *read* like authentication: `isAuthed` is now `hasSessionCookie`, and the file opens with "**Not a security boundary**" and the warning that a route added to the matcher gets no protection from it. The unreachable API branch — `authApiRoutes` was `[]` and `/api` was never matched — is deleted |
| — | `middleware.ts` deprecated in Next 16 | Renamed to `proxy.ts` with the export renamed to match, clearing a warning that fired on every build. Verified live, because a silent failure here is invisible: `/hero` still bounces a signed-in member to `/dashboard`, and `x-pathname` is still stamped — that one matters because `admin/layout.tsx` uses it to keep a committee head inside `/admin/committees`, and a missing header would make `path` empty and skip the redirect entirely |
| 6.4 (merch + committees) | Ad-hoc validation on the remaining write paths | **§6.4 closed.** `validateItemInput` in `lib/merch.ts` and `validateCommitteeInput` in `lib/committee.ts`, each serving both the create and the PATCH route. The distinction that mattered: the existing `read*` helpers are *coercers* — right for an absent field, wrong for a present-but-malformed one, because a mistyped category silently became `APPAREL` and a mistyped status `AVAILABLE`, with nothing said. Length caps added to every text field (none were bounded), plus caps on image, variant and child-collection counts. `contactEmail` and `applyUrl` are now validated through the library's own `email` rule and a URL parse — both were stored verbatim and rendered as a `mailto:` and a link on the public committee page, so a broken value was a dead control for every visitor; `javascript:` was accepted. 40 tests, and the full create → PATCH → delete lifecycle re-verified against the live API |
| 6.4 (events) | `validation.ts` used by four files | Adopted on both event-write routes, which had none. `events/create` and `events/[eventId]/edit` now run every field through `check()`: a junk date, a junk price, an unknown semester or status, an over-long string or a malformed list is a **400 with the field named**, where each previously reached Prisma and came back as a 500. Three reusable rules were added to the library rather than inlined — `oneOf`, `dateTime`, `money` — plus a `notBefore` for the start/end relationship, all with tests. Two further fixes fell out: sub-event creation is now one transaction (a bad date on day three used to abort *after* the parent and first two days were written), and both catch blocks stopped returning `err.message` to the caller |
| 8.4 | `<img>` instead of `next/image` | 12 of 13 converted, and `next.config.ts` now allows the Supabase storage origin so the optimiser will actually serve them. `fill` where the container is positioned with an aspect ratio, explicit dimensions for the fixed admin thumbnails, `priority` on the two above-the-fold heroes, and a `sizes` on every one so the optimiser has a width to work from. The survivor is the gallery lightbox, kept as `<img>` with the reason recorded: arbitrary upload dimensions plus `object-contain`, where `fill` would stretch the element across the whole box and swallow the clicks that dismiss it |
| 8.3 | Nine `@font-face` families, most unused | Five dead families deleted from the CSS **and** from `public/fonts` (Roller-Coaster, Arapey, Fjalla-One, Trochut, Supermolot). The four survivors gained `font-display: swap`. `body` now uses the design system's body face instead of Arial, with the identical fallback chain. Verified in the browser: the font registry lists only the four, and no dead file is fetched — previously all ten shipped on every page |
| 10.2 / 10.3 | Warnings, and knowingly-wrong dep arrays | **0 warnings**, and `npm run lint` is now `--max-warnings 0` so the count cannot climb back. The `OfficersRoster` suppression was on the wrong line — `exhaustive-deps` reports on the dependency array, not the `useEffect` — which is why one directive was unused *and* the warning still fired. The three `window.location.href` warnings are suppressed with their reason: session state is cached per document in `sessionClient`, so an auth transition has to discard the document rather than `router.push` |
| 5.3 | `src/services/` a half-abandoned layer | Folded into `src/lib/` and the directory deleted: `identityService.ts` → `lib/identity.ts`, `attendanceService.ts` → `lib/attendance.ts`, two import sites updated. Credentials stay in their own file rather than merging into `lib/auth.ts` — that module is imported by ~30 route handlers, and folding `bcrypt` in would pull the hashing library into every one of their bundles. Covered by 9 new tests, and re-verified through the live routes |
| 3.3 (partial) | Header comment promised a points rule that did not exist | The two unbuilt rules — hourly points and offline mode — are out of the comment. Noted where the award would belong if the points economy ships |
| 3.6 | `deriveStatus` implemented four times, differently | Collapsed onto `getEventStatus` in `types/events.ts`, plus a `getEventStatusEnum` for the two callers that want the database spelling. The copy in `api/admin/events` is gone; `EventEditor` keeps a three-line wrapper only for its "no dates loaded yet" case; `api/events/ongoing` now filters in JS rather than restating the rule as a Prisma `where`. Both `any` types in that file went with it. Verified live: the editor badge and the admin list agree, and 49 tests pin the rule down — including the multi-day parent case all four copies used to disagree on |
| 13.1 | No tests, at all | A Vitest slice: **45 tests over 3 files**, node environment, no database. Covers the upload sniffer (`lib/uploads.ts`, extracted from the route so it is testable), `requireRole`'s 401-vs-403 decision, and `getEventStatus`. Wired to `npm test` and added to CI. It paid for itself on the first run by catching a real bug in `isBucket`: `value in BUCKET_KINDS` walks the prototype chain, so `"constructor"` and `"toString"` were accepted as bucket names |
| 8.1 / 8.2 | Two theming systems; ~68 `!important` overrides | **Closed.** `RegistrationModal` ported faithfully (public flow, geometry untouched); `EventCreationModal` rebuilt on `ds/Modal` (officer-only, so redesigned rather than repainted — it also gains a focus trap, scroll lock and dirty-guard it never had). With no subjects left, the whole override block came out: **105 lines deleted, 0 `!important` and 0 `.dark-exempt` rules remain**. Three of the deleted rules were element selectors on `input`/`select`/`textarea` whose `!important` beat the DS `Field`'s inline styles, so every form field in the app rendered the legacy background and text colour; verified fixed |
| 10.2 | ESLint had no unused-vars rule at all | The Next 16 preset drops `no-unused-vars`, which is why a dead import survived a refactor. Configured as a warning; it immediately found 25 more, including 17 dead `const user = auth.user` bindings left by the §5.4 codemod. All cleared |

### A note on the 19 react-hooks errors

The eslint 16 upgrade enabled React Compiler rules and surfaced 20 new errors.
They were not one problem:

- **Ten were genuine** — synchronous `setState` in an effect body. Fixed
  properly, mostly via React's documented "adjust state during render" pattern
  (`ds/Modal`, `PeopleRoles`, `RegistrationModal`, `VideoCarousel`,
  `AccountPage`, `EventsList`, `CommitteeEditor`'s search) or by reading an
  external store directly (`WithPreLoader`, `ThemeProvider`). The
  `immutability` error in `SelectedEvent` was a barcode built by mutating a
  seed during render; it is now computed once at module load.
- **Nine were false positives** — `void load()` in a mount effect, where every
  `setState` runs after an `await`. The rule's analysis is interprocedural and
  cannot see through the async boundary. These carry an explicit
  `eslint-disable-next-line` with the reason, because rewriting nine components
  (several with three or four manual-refresh call sites) to satisfy a check
  that is wrong about them would be churn with real regression risk and no
  tests. The genuine fix is server-side data fetching — §5.1.
- **One was a judgement call** — `OfficersRoster` seeds its index from
  `window.location.hash` on mount, then owns it. Not derivable, not readable
  during the server render; suppressed with that reasoning recorded.

Suppressions are greppable:
`grep -rn "set-state-in-effect" src`.

### Still open

Everything else, notably: **§8.1/§8.2** (the 50/50 theming split and its ~60
`!important` overrides), **§8.4** (six `<img>`, the bulk of the remaining
warnings), **§13.1** (still no tests).

Nine API routes still read the session directly rather than through
`requireRole`, and all nine are deliberate: `/api/me`, `check-registration` and
`registrations` answer anonymous callers by design rather than refusing them,
and the rest (`change-password`, `merch/cart`, `merch/checkout`, `merch/notify`,
`registration-prefill`, `profile`'s third read) already returned 401 with copy
better than the generic helper's.

### §9.2 — the convention, and why the sweep was declined

Re-measured before touching anything, because the entry below overstates the
mess. Errors are **already uniform**: `{ error: string }`, at 97 call sites, with
the status code carrying the rest. Success is `{ ok: true, … }` at 23 sites
against `{ success: true, … }` at 4.

**The convention, for anything new:**

```
success  →  { ok: true, <payload keyed by name> }
failure  →  { error: "A sentence the user could read." }   + a real status code
absence  →  an explicit null field, never an empty object
```

**What was actually broken, and is fixed:** `/api/me` answered a bare `{}` both
for a signed-out caller (200) and for an internal failure (500). One
indistinguishable body for two unrelated situations — nothing in the payload said
which, so a client had to infer it from the status. It now returns
`{ ok: true, user: Member | null }`, or `{ ok: false, error }` on failure. It had
exactly one consumer (`components/sessionClient`), which made this safe.

**What was left, on purpose:** the four routes still using `success` are
`login`, `logout`, `change-password` and `attendance/manual`. Renaming the field
is mechanical, but three of those four cannot be verified from here — a
successful login can't be exercised without credentials, changing a password
means changing a real one, and testing logout destroys the session under test. A
missed call site on the login path means nobody can sign in. Cosmetic gain,
expensive failure, no way to check: not a trade worth taking. They are a
documented exception rather than an oversight, and the right moment to convert
them is when there are tests around the auth flows.

### §8.1/§8.2 — how much smaller this turned out to be (now closed)

The audit measured the theming split as 53 files legacy vs 54 DS — an even
migration with a long way to run. Re-measured 2026-08-17: **51 files use the DS,
4 use legacy Tailwind palette classes, and no file uses both.** Two of those four
were the dead primitives closed under §6.5 above.

So what actually remains is porting **two live components** —
`events/EventCreationModal.tsx` and `registration/RegistrationModal.tsx`. Once
they are on the DS, all 68 `!important` rules and 13 `.dark-exempt` rules in
`globals.css` have nothing left to override and can be deleted outright. That is
roughly a day's work, not the project the entry below describes. It is now the
single largest debt reduction available in the repo.

### A note on §5.1 and where the session is read

The layout no longer reads the session, so the public pages prerender again. The
cost is that the nav's signed-in state now arrives after hydration rather than
in the first HTML. The nav holds an empty slot while the answer is unknown
instead of assuming "signed out" — assuming would flash a LOG IN button at every
member on every page load, which is worse than a brief gap.

`useSession` also replaced three ad-hoc `/api/me` fetches in the events tree
(`Events`, `EventsList`, `SelectedEvent`), each of which had its own effect and
its own copy of the role-to-price-tier rule. Measured on `/events`: three
session requests per load became one, and all three flags are now derived
during render rather than stored in state.

The better long-term answer is PPR — a static shell with the nav streaming into
a Suspense hole, which would keep the user in the first response *and* keep the
pages cacheable. That means enabling `cacheComponents` app-wide, which is too
broad a change to make without tests.

### Carried forward

- ~~`20260817000000_drop_lesson_and_schedule` and
  `20260817010000_session_references_user_id` are written but unapplied.~~
  **Applied 2026-08-17.** `prisma migrate status` reports the schema up to date,
  and the result was verified directly against the database: `Lesson` and
  `Schedule` are gone, `Session.userId` now references `User.id` with
  `ON DELETE CASCADE`, `Session_userId_idx` exists, and there are no orphaned
  session rows. `Session` was empty, so the student-number translation step was
  a no-op and no one was signed out.

  Worth recording, because it was the risk going in: rewriting the baseline
  migration after it had already been applied did **not** trigger a checksum
  mismatch, so `migrate deploy` ran without complaint.
- **`DOCUMENTATION.md` is now stale** in the places that describe deleted code —
  its §10 "Known rough edges" lists several items closed above.
- **Walk-in registration is untested at runtime.** It compiles and builds; the
  flow has not been exercised against a live event.
- **`seed-members-2526.mjs` hardcodes an absolute path** into a local Downloads
  folder, so it only runs on one machine.
- **The CI migrations job has never been read.** It runs `prisma migrate diff
  --from-migrations --to-schema-datamodel --exit-code` against a throwaway
  Postgres, which asserts that the migration folder and `schema.prisma` describe
  the same database — i.e. it catches a schema edit with no migration behind it.

  An earlier draft of this note claimed the job also validates the reconstructed
  baseline against the live database's enum ordering. It does not: it never
  connects to the live database, and `migrate diff` compares declarations rather
  than value order. So the `UserRole` ordering question — the live enum has
  `ADMIN` before the VPs, `schema.prisma` declares it last — remains genuinely
  unverified, and CI is not the thing that will answer it. Prisma has tolerated
  the drift in practice; it is still the one part of the baseline reconstruction
  that is reasoned rather than executed.

---

## Table of contents

1. [Severity key](#1-severity-key)
2. [Security](#2-security)
3. [Correctness bugs](#3-correctness-bugs)
4. [Data model and schema](#4-data-model-and-schema)
5. [Architectural mismatches](#5-architectural-mismatches)
6. [Duplicated code and parallel systems](#6-duplicated-code-and-parallel-systems)
7. [Dead code and unused dependencies](#7-dead-code-and-unused-dependencies)
8. [Styling and design-system debt](#8-styling-and-design-system-debt)
9. [API design inconsistencies](#9-api-design-inconsistencies)
10. [Code quality and lint](#10-code-quality-and-lint)
11. [Performance](#11-performance)
12. [Repository hygiene](#12-repository-hygiene)
13. [Tooling and ops gaps](#13-tooling-and-ops-gaps)
14. [Suggested order of work](#14-suggested-order-of-work)

---

## 1. Severity key

| Mark | Meaning |
|---|---|
| **P0** | Exploitable or data-corrupting. Fix before this branch merges. |
| **P1** | A real bug users will hit, or debt that actively slows every change. |
| **P2** | Inconsistency, duplication, or dead weight. Fix opportunistically. |
| **P3** | Cosmetic / housekeeping. |

---

## 2. Security

### 2.1 — **P0** Public endpoint leaks student PII by student-number lookup

`src/app/api/events/[eventId]/attendance-lookup/route.ts` is explicitly
unauthenticated (`// Public endpoint — no auth required`) and returns
`fullName`, `schoolEmail`, `yearLevel`, `degreeProgram`, `section`, `timeIn`
and `timeOut` for any `?studentNumber=` passed to it.

Student numbers at FEU Tech are sequential and guessable, so this is an
enumerable directory of every attendee of every event — name, school email and
program included. There is no rate limit and no event-scoped token.

**Fix:** require a session and gate on `isEventAdmin`, or — if attendees really
must self-check — return only `{ found, timeIn, timeOut }` with no identity
fields, and rate-limit by IP.

### 2.2 — **P0** Registration endpoints accept a caller-supplied `userId`

`src/app/api/registrations/route.ts:5` has no authentication at all and reads
`userId` straight out of the request body (line 11), then writes it onto the
`Registration` row (line 66). Anyone can POST a registration attributed to any
member's `User.id`, marked `RegistrationRole.MEMBER`.

Same file also trusts `fullName`, `schoolEmail`, `studentNumber`,
`contactNumber`, `yearLevel` etc. with **zero validation** — no shape check, no
length cap, no `parseInt` guard (`parseInt(yearLevel, 10)` yields `NaN` on junk,
which Prisma then rejects with a 500 rather than a 400).

**Fix:** derive `userId` from `getCurrentUser(req)` and never from the body.
Run the payload through `src/lib/validation.ts` (which already exists — see
[§6.4](#64-a-validation-library-that-four-files-use)). Verify the `eventId`
exists and is still open for registration.

### 2.3 — **P1** Middleware authenticates on cookie *presence*, not validity

`src/middleware.ts:30` sets `isAuthed = !!sessionCookie?.value`. Any value in a
`session` cookie passes the middleware gate. The pages behind it re-check with
`getCurrentUser()` and redirect, so this is not currently exploitable — but the
gate advertises protection it does not provide, and the next route added under
`authRoutes` without its own check will be open.

**Fix:** either validate the session in middleware (needs a DB-capable runtime,
which Fluid Compute supports), or rename the concept to make it clear this is
only a cheap pre-filter and the real gate is per-page.

### 2.4 — **P1** `authApiRoutes` is an empty array

`src/middleware.ts:11` — `const authApiRoutes: string[] = [];`. The whole
API-401 branch below it (lines 50–55) is unreachable, and `config.matcher`
(lines 60–67) does not include `/api` at all. Every API route is on its own for
auth. Most do check; the ones in §2.1/§2.2 do not.

**Fix:** delete the dead constant and the dead branch, or populate both it and
the matcher.

### 2.5 — **P1** Login response returns more of the user record than `/api/me` does

`src/app/api/login/route.ts:19` returns the whole `login()` result, which is the
full `User` row minus `password` — including `personalEmail`, `contactNumber`,
`facebookLink`, `discordName`, `supabaseUserId`. `/api/me` returns only the
five-field `safeUser` projection via `toSafeUser`. Two different shapes for the
same concept, and the more permissive one is on the unauthenticated endpoint.

**Fix:** return `toSafeUser(user)` from the login route.

### 2.6 — **P1** Upload endpoint does not validate file type

`src/app/api/upload/route.ts` accepts any file up to 50 MB, takes the extension
from the user-supplied filename (`file.name.split(".").pop()`, line 44), passes
`contentType: file.type` (also user-controlled) to Supabase, and writes with
`upsert: true` into a **public** bucket. A caller can store arbitrary content —
including HTML/SVG — on the project's public Supabase origin.

Mitigating: the route is gated on `EVENT_ADMIN_ROLES`. Still, officers are not
a trusted-code boundary.

**Fix:** allowlist MIME types per bucket, derive the extension from the
sniffed type rather than the filename, and drop `upsert: true` (the filename is
already randomised, so upsert can only ever clobber).

### 2.7 — **P2** Rate limiting exists on exactly one route, in module memory

`src/app/api/change-password/route.ts:25–49` implements an in-memory attempt
counter and honestly documents its own limits. Nothing equivalent guards
`/api/login`, which is the endpoint an attacker would actually target.

**Fix:** move the brake into shared middleware or a durable store, and apply it
to login first.

### 2.8 — **P2** `NEXT_SUPABASE_SERVICE_ROLE_KEY` client is constructed per request

`src/app/api/upload/route.ts:11–14` builds the service-role client **inside**
the handler and **before** the auth check. Harmless today, but it means the
privileged client is instantiated on unauthenticated requests. Move the client
construction to module scope and the auth check to the first statement.

---

## 3. Correctness bugs

### 3.1 — **P0** `getPhilippineTime()` returns a wrong instant

```ts
// src/lib/timezone.ts
export function getPhilippineTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
}
```

`toLocaleString` renders the Manila wall-clock time as a **string**; `new Date()`
then re-parses that string **in the server's local zone**. On a UTC host (which
Vercel is) the result is an instant 8 hours ahead of now. Every `timeIn` and
`timeOut` written by `attendanceService.ts` is offset by the server's distance
from Manila.

The comment above it — "Uses the Intl API for reliable timezone conversion" —
describes the opposite of what the code does.

**Fix:** store `new Date()` (a real UTC instant) and format to Asia/Manila at
render time. A `Date` has no timezone; there is nothing to convert on write.

### 3.2 — **P1** Duplicate time-in throws a raw Prisma error

`recordTimeIn` (`src/services/attendance/attendanceService.ts:20`) calls
`attendance.create` with no check for an existing record. `Attendance.registrationId`
is `@unique`, so a second scan of the same person raises P2002. The caller
(`/api/events/[eventId]/attendance/route.ts`) surfaces that as a generic 500,
so a double-tap at the door reads as a server failure rather than "already
signed in".

**Fix:** `upsert` on `registrationId`, or check-then-create with the P2002 caught
and mapped to a 409.

### 3.3 — **P1** `recordTimeOut` overwrites an existing time-out and uses `updateMany`

Same file, line 57. It matches on `{ studentNumber, eventId }` with `updateMany`
and unconditionally sets `timeOut`. Scanning out twice silently moves the
recorded departure later. The rule comments at the top of the file also promise
a points calculation for ≥1 hour of attendance — that logic does not exist
anywhere in the codebase.

**Fix:** filter on `timeOut: null` so a second scan updates nothing, and either
implement or delete the points rule in the header comment.

### 3.4 — **P1** Theme flashes on every DS-styled screen

`src/app/layout.tsx:33–46` runs an inline script that adds the `dark` class to
`<html>` before paint. But `ThemeProvider` (`src/components/ThemeProvider.tsx:23`)
starts at `useState<Theme>("light")` and only reads `localStorage` in an effect.

Components styled through CSS (`.dark .bg-white { … }`) get the right colours
immediately. Components styled through `useDS()` — roughly half the app, see
[§8.1](#81-two-complete-theming-systems) — render **light** on the first client
pass and then repaint dark. The provider also returns `{children}` *without* the
context wrapper while `!mounted` (line 43), so during that window every
`useTheme()` consumer reads the default context rather than the real theme.

**Fix:** initialise the provider from the same `document.documentElement.classList`
the inline script already set, and always render the provider.

### 3.5 — **P2** Duplicate-registration check is a non-atomic read-then-write

`src/app/api/registrations/route.ts:24` does `findFirst` then `create`. Two
concurrent submissions both pass the check. The unique constraints catch it and
the P2002 handler (line 84) maps it to a clean 409 — so this file is fine in
practice. Its near-twin `registrations/complete/route.ts` has the same
read-then-write but **no P2002 handler**, so the race there produces a 500.

**Fix:** drop the pre-check, rely on the constraint, and handle P2002 in both.
(Better: delete one of the two files entirely — [§6.1](#61-two-registration-endpoints).)

### 3.6 — **P2** `deriveStatus` is implemented twice, differently

- `src/app/api/admin/events/route.ts:8` — server, returns a union type.
- `src/components/admin/EventEditor.tsx:46` — client, returns `string`.

Two copies of the rule that decides whether an event is upcoming/ongoing/finished.
`/api/events/ongoing/route.ts` implements a *third* variant of the same idea as a
Prisma `where` clause. They will drift.

**Fix:** one exported helper in `src/lib/events.ts`, used by all three.

### 3.7 — **P2** `EventsManager` ships a placeholder as a primary action

`src/components/admin/EventsManager.tsx:91` — the "NEW EVENT" button in the new
admin console calls `alert("Event creation lives in the existing create flow.")`.
This is a dead-end control in a shipped surface.

**Fix:** wire it to the creation flow, or remove the button until it works.

---

## 4. Data model and schema

### 4.1 — **P1** `Session.userId` points at `studentId`, not `User.id`

```prisma
model Session {
  id        String @id @default(cuid())
  userId    String
  user      User   @relation(fields: [userId], references: [studentId])
  expiresAt DateTime
}
```

Every other relation in the schema joins on `User.id`. This one joins on
`studentId`, and the column is still *named* `userId`. The consequence leaks
across the codebase: `change-password/route.ts:127` and `sessions/route.ts:44`
both have to write `where: { userId: user.studentId }` — code that reads like a
bug and is not.

**Fix:** migrate `Session.userId` to reference `User.id`, or rename the field to
`studentId` so it stops lying. The former is correct; the latter is cheap.

### 4.2 — **P1** `Session` has no cascade and no index

No `onDelete: Cascade` on the user relation, and no `@@index([userId])`. Deleting
a user will fail on the FK, and every session lookup by user does a sequential
scan. Session cleanup only ever runs opportunistically inside `createSession`
(`identityService.ts:31`) — an account that never logs in again keeps its expired
rows forever.

**Fix:** add `onDelete: Cascade` and `@@index([userId])`; add a scheduled cleanup
(a Vercel cron hitting a small route) instead of piggybacking on login.

### 4.3 — **P1** The baseline migration is a comment

`prisma/migrations/00000000000000_baseline/migration.sql` is two lines:

```sql
-- Baseline Migration
-- Database schema already exists
```

The migration history therefore **cannot rebuild the database from scratch**.
`prisma migrate reset`, a fresh developer clone, and any CI database all produce
a schema containing only the merchandise and committee tables — `User`, `Event`,
`Registration`, `Attendance`, `Session` and the rest simply won't exist.
`DOCUMENTATION.md:53` tells new contributors to run `npx prisma migrate dev`,
which will not give them a working database.

**Fix:** generate the real baseline with `prisma migrate diff --from-empty
--to-schema-datamodel prisma/schema.prisma` and replace the placeholder.

### 4.4 — **P2** Three price columns plus a free-text fee field

`Event` carries `price`, `priceMember`, `priceNonMember` **and**
`registrationFees String?`. `EventCards.tsx:29` reveals the naming trap: the
column called `price` is the *officer* tier. Meanwhile `registrationFees` is a
prose field rendered separately in `SelectedEvent.tsx:241`, so the same fact is
stored twice in two formats that nothing reconciles.

**Fix:** rename `price` → `priceOfficer`, and either derive the `registrationFees`
copy from the numbers or drop the numbers and keep the prose. Not both.

### 4.5 — **P2** Models with no product behind them

| Model | `prisma.<model>` references in `src/` |
|---|---|
| `Transaction` | 1 |
| `Lesson` | 2 |
| `Schedule` | 2 |

`Transaction` (with its `TransactionType` and `TransactionStatus` enums) supports
a points economy that has no UI. `Schedule` supports a class-schedule feature
that does not exist. `Lesson` is served by `/api/lessons` and consumed nowhere.
`User.points` is written by nothing and displayed by `toSafeUser`.

**Fix:** decide per model — build it, or drop the table and the enum. Carrying
them costs a column on every `User` query and confuses every schema read.

### 4.6 — **P2** `Attendance.userId` is never populated

`recordTimeIn` writes every field from the registration except `userId`
(`attendanceService.ts:36–50`). The column exists, is nullable, and is always
null. Any future "my attendance history" feature will have to join through
`Registration` anyway.

**Fix:** populate it from `registrant.userId`, or drop the column.

### 4.7 — **P3** `EventStatus` enum vs. `statusOverride` semantics

`statusOverride` is nullable and means "auto" when null, which is correct — but
the enum is named `EventStatus`, implying it's the status itself. Three separate
call sites re-derive the real status ([§3.6](#36-derivestatus-is-implemented-twice-differently)).
Renaming to `EventStatusOverride` would make the intent readable.

---

## 5. Architectural mismatches

### 5.1 — **P1** Every page is dynamic because the root layout hits the database

`src/app/layout.tsx:28` calls `await getCurrentUser()` to feed the NavBar. That
is a `session.findUnique` with `include: { user: true }` on **every request to
every route**, including `/about`, `/officers` and `/events`, none of which need
a user. Nothing in the app can be statically rendered or CDN-cached.

Worse, it compounds: `/profile` calls `getCurrentUser()` in the layout *and*
again in the page, and again in each API call the page makes. A single profile
load runs the same session query three or more times.

**Fix:** cache the lookup per request with React's `cache()`, and move the
NavBar's user into a small client fetch or a separate cached segment so public
routes stay static.

### 5.2 — **P1** Two parallel event-admin systems, both live

| Old | New |
|---|---|
| `/events/[eventId]/admin` (`src/app/events/[eventId]/admin/page.tsx`) | `/admin/events/[eventId]` (`src/app/admin/events/[eventId]/page.tsx`) |
| `AdminDaySelector` → `AdminEventPanel` (**1,449 lines**) | `EventEditor` (659 lines) |
| Tailwind + hardcoded `text-[#CF78EC]`, `font-['Fjalla-One']` | DS tokens via `useDS()` |
| Gated by `EVENT_ADMIN_ROLES` | Gated by `isAdmin` (4 roles) |

Both routes are reachable. They apply **different permission models** to the
same data: a `MEDIA_OFFICER` can edit an event through the old route and is
locked out of the new one.

**Fix:** pick one. If `EventEditor` is the future, delete the old route,
`AdminDaySelector`, and `AdminEventPanel`, and move any surviving features
(attendance sheet, graphs) across first. This alone removes ~1,800 lines.

### 5.3 — **P1** `src/services/` is a half-abandoned layer

Two files (`identityService.ts`, `attendanceService.ts`) predate `src/lib/` and
never moved. `DOCUMENTATION.md` acknowledges this. The split means auth logic
lives in *three* places: `lib/auth.ts` (session read), `services/identity`
(password check, session write) and `types/auth.ts` (role predicates).

**Fix:** fold both service files into `src/lib/` and delete the directory.

### 5.4 — **P2** Role gating is expressed four different ways

- `isAdmin(user.role)` — 4 roles (admin/stats, admin/events, admin/merch/*)
- `EVENT_ADMIN_ROLES.includes(user.role)` — 8 roles (events/*, upload, videos)
- `committeeScope(user)` — per-committee (admin/committees/*)
- `user.role !== "ADMIN"` — 1 role (`proxy.ts:19`, dead code)

Four vocabularies for one question. There is no single `requireRole()` helper, so
each new route re-picks a convention, and the 403-vs-401 choice comes out
differently each time ([§9.1](#91-403-is-returned-where-401-is-meant)).

**Fix:** one `requireRole(req, predicate)` helper in `src/lib/auth.ts` returning
either the user or a `NextResponse`, used by every protected route.

### 5.5 — **P2** `/api/admin/*` and `/api/*` split is not principled

Merch, committees and events each have both an admin and a public route family,
but the boundary differs: `admin/merch/items` vs `merch/items` are genuinely
different projections, while `admin/events` vs `events/[eventId]/edit` overlap.
Event mutation lives under `/api/events/`, committee mutation under
`/api/admin/committees/`.

**Fix:** state the rule (all writes under `/api/admin`, or all resource routes
under `/api/<resource>` with an internal role gate) and move the outliers.

---

## 6. Duplicated code and parallel systems

### 6.1 — Two registration endpoints — **P1**

`src/app/api/registrations/route.ts` and
`src/app/api/registrations/complete/route.ts` are ~90% identical: same body
fields, same duplicate check, same member-lookup, same create. Differences:
the first accepts a body `userId` (see [§2.2](#22-registration-endpoints-accept-a-caller-supplied-userid)),
the second handles P2002 worse.

**Fix:** delete one.

### 6.2 — Six seed scripts in three formats — **P2**

```
seed-members.js               (root, 9.5 KB, CommonJS)
prisma/seed-members.ts        (2.7 KB, TypeScript)
prisma/seed-members-2526.mjs  (3.3 KB, ESM)
prisma/seed-committees.mjs
prisma/seed-events.mjs
prisma/seed-merch.mjs
scripts/make-admin.js
```

Three overlapping member seeders in three module formats, one of them stranded
at the repo root. `package.json` has no `seed` script and no `prisma.seed` key,
so none of them are discoverable — you have to know the filename.

**Fix:** one `prisma/seed.mjs` that dispatches on an argument, wired to
`prisma.seed` in `package.json`; delete the rest.

### 6.3 — Duplicate NavBar files — **P2**

`components/ui/NavBar.tsx` (repo root, outside `src/`) is **0 bytes**. The real
one is `src/components/UI/NavBar.tsx` (463 lines). The root `components/`
directory exists solely to hold this empty file and is outside the `@/*` path
alias, so it is not even lintable by the current `eslint src` invocation.

**Fix:** `rm -r components/`.

### 6.4 — A validation library that four files use — **P2**

`src/lib/validation.ts` is 334 lines of well-built validators (`email`, `phone`,
`urlOn`, `personName`, `password`, `passwordStrength`, `validateAccount`,
`ACCOUNT_FIELDS`). It is imported by exactly four files — the profile and
password surfaces.

Every other input path validates ad hoc or not at all: event creation, event
edit, both registration endpoints, merch item creation (`"An item needs a name."`),
committee creation (`"A committee needs a name."`).

**Fix:** route all API input through it. The library is the good part here; the
problem is that it was written once and never adopted.

### 6.5 — Two Button and two Modal implementations — **P2**

- `src/components/ds/Button.tsx` (DS) vs `src/components/UI/Button.tsx` (legacy)
- `src/components/ds/Modal.tsx` (286 lines, DS) vs `src/components/Modal/Modal.tsx` (legacy)

Both pairs are live. Which one a screen uses depends on when it was written.

**Fix:** port legacy consumers, delete `UI/Button.tsx` and `Modal/Modal.tsx`.

### 6.6 — Confirmations are native `confirm()`, in a codebase with a Modal system — **P2**

Five destructive actions use the browser dialog despite `ds/Modal` existing:

| File | Line |
|---|---|
| `admin/CommitteeEditor.tsx` | 147 |
| `admin/MediaLibrary.tsx` | 67 |
| `admin/MerchandiseManager.tsx` | 177 |
| `admin/VideosManager.tsx` | 72 |
| `registration/RegistrationModal.tsx` | 153 (`alert("Successfully registered!")`) |

An unstyled OS dialog in the middle of a deliberately art-directed console is a
visible seam, and `confirm()` can't be styled, themed, or made accessible.

**Fix:** a `useConfirm()` built on `ds/Modal`.

### 6.7 — Five overlapping event list components — **P3**

`Events.tsx`, `EventsList.tsx`, `EventCards.tsx`, `EventSelector.tsx`,
`EventGallery.tsx` (the last is orphaned — [§7.1](#71-orphaned-components)).
Worth a pass to establish which is the canonical list.

---

## 7. Dead code and unused dependencies

### 7.1 — Orphaned components — **P2**

Never imported anywhere in `src/`:

| File | Note |
|---|---|
| `src/components/about/AboutHero.tsx` | also carries an unused state var (lint) |
| `src/components/events/EventGallery.tsx` | |
| `src/components/login/button/LogInButton.tsx` | |
| `src/components/placeholder/ComingSoon.tsx` | the placeholder pages it served now have real content |
| `src/lib/crypto.ts` | QR remnant, see §7.3 |
| `src/lib/supabase.ts` | anon client; every real upload path builds its own service-role client |
| `src/components/ds/index.ts` | *not* dead — barrel imported as `@/components/ds`; listed only because the filename-based scan can't see it |

### 7.2 — Dead route files — **P2**

- **`proxy.ts`** (repo root) — a complete second middleware, exporting its own
  `config.matcher`. It gates `/scanner` (a route that no longer exists) and
  `/admin` on `user.role !== "ADMIN"`, contradicting the four-role admin model in
  `types/auth.ts`. Next.js does not load it. It is a trap for anyone who greps
  for admin gating.
- **`server.js`** (repo root) — a custom HTTP server for a `next start` path that
  `output: "standalone"` on Vercel does not use.

**Fix:** delete both.

### 7.3 — Unused dependencies — **P2**

Zero references anywhere in `src/`, `scripts/` or `prisma/`:

| Package | Why it's there |
|---|---|
| `@zxing/browser` | removed QR scanner |
| `html5-qrcode` | removed QR scanner |
| `jsonwebtoken` + `@types/jsonwebtoken` | never used; sessions are opaque DB rows |
| `@supabase/auth-helpers-nextjs` | superseded by `@supabase/ssr`… |
| `@supabase/ssr` | …which is *also* unused; only `@supabase/supabase-js` is |
| `crypto-js` + `@types/crypto-js` | one reference, in the orphaned `lib/crypto.ts` |

Also `QR_SECRET_KEY` and `SUPABASE_JWKS_URL` remain in `.env` with no reader in
the codebase.

**Fix:** `npm uninstall` all seven, delete `src/lib/crypto.ts`, drop the two env
vars. `@supabase/auth-helpers-nextjs` is additionally **deprecated upstream**.

### 7.4 — Hardcoded officer roster — **P2**

`src/components/officers/officers-data.ts` hardcodes the officer list while
committees, events, merch and videos are all database-backed with admin
editors. Every officer turnover is a code deploy.

**Fix:** the `CommitteeMember` model already models people-in-positions. Either
extend it or add an `Officer` model with a console screen.

---

## 8. Styling and design-system debt

### 8.1 — **P1** Two complete theming systems

| | Legacy | Current |
|---|---|---|
| Source | `src/app/globals.css` CSS variables | `src/styles/design-system.ts` |
| Consumed via | Tailwind classes (`bg-surface`, `text-dm-text-primary`) | `useDS()` + inline `style={}` |
| Files using it | 53 | 54 |

An almost exact 50/50 split. They define **overlapping colours that disagree**:

| Token | `globals.css` | `design-system.ts` |
|---|---|---|
| accent (light) | `#9B2FBE` | `#9B2FBE` ✅ |
| accent hover (dark) | `#d994f0` | `#b85cd6` ❌ |
| surface (dark) | `#0a0a0a` / `#141414` | `#26252a` ❌ |
| text (dark) | `#f5f5f5` | `#ffffff` ❌ |

So the dark surface is a different colour depending on which half of the app
you're looking at, and the accent changes shade on hover between screens.

**Fix:** finish the migration. Until then, at minimum, generate the CSS
variables *from* `design-system.ts` so the two cannot disagree.

### 8.2 — **P1** ~60 `!important` overrides fighting Tailwind

`src/app/globals.css:70–180` is a wall of rules like:

```css
.dark .bg-white       { background-color: var(--surface) !important; }
.dark .text-gray-900  { color: var(--text-primary) !important; }
.dark .hover\:bg-gray-50:hover { background-color: var(--surface-hover) !important; }
```

The comment above them states the intent plainly: *"These override Tailwind's
hardcoded utility classes site-wide so components don't need individual changes."*
That is dark mode implemented by patching the output of the light-mode
components — every new `bg-gray-*` a developer writes needs a matching override
added here, and there is no way to know one is missing except by looking.

`.dark-exempt` (lines 84–103) then adds a **second** layer of `!important` to
opt specific subtrees back out, with a comment reading *"Event cards should NOT
be affected by dark mode."*

**Fix:** this is the single largest source of visual inconsistency in the repo.
The DS migration is the real answer; nothing incremental fixes it.

### 8.3 — **P2** Nine custom `@font-face` families, most unused

`globals.css:184–235` loads Roller-Coaster, Arapey, Fjalla-One, Trochut,
Monument Extended (2 weights), Helvetica Now MT Text, Arian-light, Arian-bold
and Supermolot from `/public/fonts` — plus Geist Sans and Geist Mono via
`next/font/google` in `layout.tsx`. The DS specifies Monument Extended and
Helvetica Now. `body` then sets `font-family: Arial, Helvetica, sans-serif`
(line 58), overriding all of it for unstyled text.

None of the local fonts use `font-display: swap` or are preloaded, and they load
on every page whether used or not.

**Fix:** audit which families are actually referenced, delete the rest from CSS
and `public/fonts`, and set the DS body font on `body` instead of Arial.

### 8.4 — **P2** 11 `<img>` elements instead of `next/image`

Flagged by ESLint in `AdminEventPanel` (×2), `EventCards`, `EventCreationModal`,
`EventGallery`, `PastEventExperience` (×4) — and knowingly suppressed with
`eslint-disable-next-line` in `MerchandiseManager` (×2), `CartPage`, `ItemDetail`
(×2), `ProductCard`, `OfficersRoster`.

These are Supabase-hosted product and event photos — exactly the case
`next/image` exists for. Every storefront card ships a full-resolution upload.

**Fix:** add the Supabase hostname to `next.config.ts` `images.remotePatterns`
and convert. The `next.config.ts` currently contains nothing but
`output: "standalone"`.

---

## 9. API design inconsistencies

### 9.1 — **P2** `403` is returned where `401` is meant

Roughly 20 routes return **403 Forbidden** for an *unauthenticated* caller:

```ts
const user = await getCurrentUser(req);
if (!user || !isAdmin(user.role)) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
```

401 means "you are not authenticated"; 403 means "you are, and still may not."
Collapsing both into 403 means a client cannot tell "log in" from "you lack the
role" — and the message says "Unauthorized" while the code says Forbidden.

Meanwhile the merch and profile routes get it right (401 for no session):
`merch/cart`, `merch/orders`, `merch/checkout`, `merch/notify`, `profile`,
`sessions`, `change-password`. So the codebase does both.

**Fix:** 401 when `!user`, 403 when the role check fails. The `requireRole()`
helper from [§5.4](#54-role-gating-is-expressed-four-different-ways) can enforce it in one place.

### 9.2 — **P2** Response envelopes differ per route family

| Shape | Where |
|---|---|
| `{ ok: true, cart }` | merch |
| `{ success: true, user }` | login, change-password |
| `{ events: [...] }` | admin |
| bare object | `/api/events/[eventId]` |
| `{}` | `/api/me` when signed out |

`/api/me` returning `{}` with **status 200** for an unauthenticated caller
(`me/route.ts:14`) is the notable one — the client must inspect the body to
learn it isn't signed in. It also returns `{}` with status 500 on error, so
success and failure are indistinguishable by shape.

**Fix:** one envelope. `{ ok, data?, error? }` is already the majority pattern.

### 9.3 — **P2** Error detail leaks in one route

`registrations/route.ts:93` returns `details: error.message` — raw internal error
text to an unauthenticated caller. Every other route returns a fixed string.

---

## 10. Code quality and lint

### 10.1 — **P1** ESLint reports 6 errors on `src/`

```
src/app/api/events/[eventId]/attendance/manual/route.ts:32   no-explicit-any
src/app/api/lessons/route.ts:24                              no-explicit-any
src/components/events/AdminEventPanel.tsx:598                no-explicit-any
src/components/events/AdminEventPanel.tsx:1340               no-explicit-any
src/types/events.ts:14                                       no-explicit-any
src/types/events.ts:23                                       no-explicit-any
```

`src/types/events.ts` is the worst of these — `any` in the shared event type
means every consumer of `EventWithCount` is unchecked. `lessons/route.ts:24`
casts the request itself: `getCurrentUser(req as any)`.

Note `npm run lint` is bare `eslint` with no target and no `--max-warnings`, so
CI cannot fail on this today.

### 10.2 — **P2** 14 ESLint warnings

Unused vars in `attendance/manual/route.ts:26`, `AboutHero.tsx:22`,
`AdminEventPanel.tsx:320,1252`, `identityService.ts:23`; the 11 `<img>` warnings
from [§8.4](#84-11-img-elements-instead-of-nextimage).

### 10.3 — **P2** Three suppressed `react-hooks/exhaustive-deps`

`AttendanceLookup.tsx:66`, `OfficersRoster.tsx:352`, `AccountPage.tsx:78`. Each
is a place where the dependency array is knowingly wrong — the usual source of
stale-closure bugs.

### 10.4 — **P2** Files that are too large to review

| File | Lines |
|---|---|
| `components/events/AdminEventPanel.tsx` | **1,449** |
| `components/admin/CommitteeEditor.tsx` | 1,133 |
| `components/admin/MerchandiseManager.tsx` | 1,125 |
| `components/events/PastEventExperience.tsx` | 739 |
| `components/admin/EventEditor.tsx` | 659 |

Five files hold 21% of the 24,905 lines in `src/`. `AdminEventPanel` is also
slated for deletion under [§5.2](#52-two-parallel-event-admin-systems-both-live).

### 10.5 — **P3** Emoji section markers in production code

`registrations/route.ts` uses `// 🔹 1.`, `// 🔹 2.`, `// 🔹 3.` as structure.
Nothing else in the codebase does.

---

## 11. Performance

### 11.1 — **P1** Prisma logs every query, in production

`src/lib/prisma.ts:7` — `log: ["query"]` with no environment guard. Every SQL
statement, on every request, in production logs.

**Fix:** `log: process.env.NODE_ENV === "development" ? ["query"] : ["error"]`.

### 11.2 — **P1** N+1 in the admin events list

`src/app/api/admin/events/route.ts:45–48` runs `prisma.attendance.count()` once
**per event** inside a `Promise.all`. 40 events → 41 queries.

**Fix:** one `attendance.groupBy({ by: ["eventId"], _count: true })`.

### 11.3 — **P1** Session query repeated per request

See [§5.1](#51-every-page-is-dynamic-because-the-root-layout-hits-the-database). `getCurrentUser()` is uncached and called from the root layout,
the page, and each API handler the page invokes.

**Fix:** wrap in React `cache()`.

### 11.4 — **P2** No pagination anywhere

`/api/admin/users`, `/api/admin/events`, `/api/admin/merch/orders`,
`/api/committees` and the registration lists all `findMany()` with no `take`.
Fine at chapter scale today; the members table will be the first to hurt.

---

## 12. Repository hygiene

### 12.1 — **P1** `.env` and `.env.local` contain live secrets and sit in the working tree

Both are correctly `.gitignore`d (`.env*` with `!.env.example`) and `git ls-files`
confirms neither is tracked — **no secret is in git history**. But `.env` holds a
live `DATABASE_URL` and `NEXT_SUPABASE_SERVICE_ROLE_KEY`, and `DOCUMENTATION.pdf`
(867 KB, untracked) may embed configuration detail.

**Fix:** no code change needed; just confirm nobody `git add -f`s these, and
consider moving to `vercel env pull` so the local file is generated rather than
hand-maintained.

### 12.2 — **P1** `.env.example` is missing three of the seven variables

| Variable | In `.env` | In `.env.example` |
|---|---|---|
| `DATABASE_URL` | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ |
| `NEXT_SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ |
| `NEXT_PUBLIC_BASE_URL` | ✅ | ❌ |
| `QR_SECRET_KEY` | ✅ | ❌ (dead — delete) |
| `SUPABASE_JWKS_URL` | ✅ | ❌ (dead — delete) |

A fresh clone following `DOCUMENTATION.md` will be missing `NEXT_PUBLIC_BASE_URL`.

### 12.3 — **P1** Two lockfiles

`package-lock.json` (296 KB) and `pnpm-lock.yaml` (172 KB) are both tracked. The
pnpm lockfile is 4 months staler. Package managers will disagree about the
installed tree, and Vercel picks by detection order.

**Fix:** delete `pnpm-lock.yaml`.

### 12.4 — **P1** `eslint-config-next` is a major version behind `next`

`package.json`: `next: 16.1.6` but `eslint-config-next: 15.5.4`. The lint rules
do not know about Next 16.

**Fix:** bump to `^16`.

### 12.5 — **P2** `tsconfig.tsbuildinfo` (211 KB) is in the working tree

`.gitignore` covers `*.tsbuildinfo` and it isn't tracked, so this is only local
clutter — but it sits at repo root next to source files.

### 12.6 — **P2** README is still the create-next-app default

`README.md` is the scaffold text. `DOCUMENTATION.md` is the real thing but is
**untracked** (`git status` shows `?? DOCUMENTATION.md`), as is its 867 KB PDF.

**Fix:** commit `DOCUMENTATION.md`, replace `README.md` with a short pointer to
it, and don't commit the PDF (regenerate on demand).

### 12.7 — **P2** `Event Details.md` (20 KB) is a source document in the repo root

Referenced by a schema comment (`// Extended details sourced from Event Details.md`).
It is content, not code.

**Fix:** move to `docs/`, or into the seed script that consumes it.

### 12.8 — **P2** Nine untracked files, including three new features

```
?? DOCUMENTATION.md
?? DOCUMENTATION.pdf
?? src/app/admin/committees/[id]/
?? src/app/admin/events/[eventId]/
?? src/components/admin/CommitteeEditor.tsx   (1,133 lines)
?? src/components/admin/EventEditor.tsx       (659 lines)
?? src/components/admin/committee-ui.tsx      (591 lines)
```

Nearly 2,400 lines of new admin code exists only on one machine, alongside three
modified files. A disk failure loses the committee and event editors.

**Fix:** commit.

### 12.9 — **P3** `.github/` holds only a CODEOWNERS file

No PR template, no CI workflow. Nothing runs `tsc`, `eslint`, or a build on push
— which is why [§10.1](#101-eslint-reports-6-errors-on-src)'s six errors have survived.

---

## 13. Tooling and ops gaps

### 13.1 — **P1** No tests, at all

No test runner, no test files, no `test` script. For a codebase handling
attendance records, stock decrements and role assignment, the merch checkout
transaction (`merch/checkout/route.ts:48`) alone — a guarded-decrement race
against live stock — deserves coverage.

### 13.2 — **P2** No CI

Adding a workflow that runs `tsc --noEmit`, `eslint --max-warnings 0` and
`next build` would have caught most of §10 before it landed.

### 13.3 — **P2** `npm run lint` lints nothing in particular

`"lint": "eslint"` — no path, no `--max-warnings`. Should be
`eslint src --max-warnings 0`.

### 13.4 — **P2** No `seed` script

Six seed files, none reachable from `package.json`. See [§6.2](#62-six-seed-scripts-in-three-formats--p2).

### 13.5 — **P2** Build opts out of Turbopack

`"build": "next build --webpack"` on Next 16. If this is a deliberate workaround
it needs a comment naming the incompatibility; otherwise it's leaving build
speed on the floor.

### 13.6 — **P2** `output: "standalone"` with no consumer

`next.config.ts` sets standalone output. Per the project memory, both Vercel
projects were deleted on 2026-07-26 and the repo currently has no deployment
target. Standalone is for self-hosted/Docker; on Vercel it does nothing useful.

**Fix:** decide the deployment story, then either remove the flag (Vercel) or
add the Dockerfile that consumes it (self-hosted).

### 13.7 — **P3** Vercel CLI not installed

`vercel env pull`, `vercel deploy` and `vercel logs` are unavailable locally.
`npm i -g vercel` if the project returns to Vercel.

---

## 14. Suggested order of work

**Before this branch merges (P0):**

1. §2.1 — close the public attendance-lookup PII leak
2. §2.2 — authenticate the registration endpoints; stop trusting body `userId`
3. §3.1 — fix `getPhilippineTime()`; audit existing attendance rows for the offset
4. §4.3 — generate a real baseline migration

**Next sprint (P1 — one week):**

5. §12.3, §12.4, §12.2 — lockfile, eslint version, env example *(one hour)*
6. §11.1, §11.2, §11.3 — prisma logging, N+1, cached session *(half a day)*
7. §12.8 — commit the untracked editors before anything else is lost
8. §5.2 — delete the old event-admin route and `AdminEventPanel` *(−1,800 lines)*
9. §10.1 — fix the six `any` errors, starting with `types/events.ts`
10. §3.2, §3.3 — attendance double-scan handling
11. §4.1, §4.2 — the `Session` model
12. §3.4 — the theme flash

**Then, as sustained work (P1/P2):**

13. §5.4 — one `requireRole()` helper; §9.1 falls out of it
14. §6.4 — adopt `validation.ts` across every API input
15. §7.2, §7.3, §7.1 — delete `proxy.ts`, `server.js`, seven packages, the orphans
16. §8.1, §8.2 — the DS migration. The largest item here and the one that makes
    every subsequent UI change cheaper
17. §13.1, §13.2 — tests and CI, so this register stops regrowing

---

*Generated 2026-08-17 against branch `merchandise-update` @ `4fc4913`.*
