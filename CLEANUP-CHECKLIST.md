# Cleanup Checklist

A single-glance view of the register in `CLEANUP.md`. Crossed out = done.
Everything still open is left unchecked, with what it actually needs.

**67 of 70 items closed.** Every P0 and every P1 is done, and so is every
security item (§2.1–§2.8).

## Handover

This is the state the codebase is being handed over in. What a new contributor
most needs to know:

- **Read `README.md` first**, then `DOCUMENTATION.md` for how the system works
  and `CLEANUP.md` for why things are the way they are. The register usually
  already has an opinion about the change you are about to make.
- **CI is the contract.** Typecheck, lint (`--max-warnings 0`, so a warning fails
  the build), 132 tests and a build run on every push, plus a job asserting the
  migration history still reproduces `schema.prisma`. If CI is green the branch
  is safe to build on.
- **Three conventions carry most of the weight**: colour comes from the design
  system via `useDS()`, protected routes go through `requireRole`/`requireUser`,
  and input is validated through `lib/validation.ts`. Each replaced a mess; the
  README section explains what.
- **One item is deliberately left open (§10.4)** and one is deliberately deferred
  to whoever owns deployment (§13.6). Both are described below rather than
  quietly dropped.
- **The database is clean.** Every piece of data created while verifying this
  work has been removed — see the last section.

| | Count |
|---|---|
| Closed | 65 |
| Closed in part, remainder a recorded decision | 2 (§9.2, §11.4) |
| Open | 1 (§10.4) |
| Blocked | 1 (§13.6) |

---

## 2. Security & access control — 8/8

- [x] ~~2.1 **P0** Public endpoint leaks student PII by student-number lookup~~
- [x] ~~2.2 **P0** Registration endpoints accept a caller-supplied `userId`~~
- [x] ~~2.3 **P1** Middleware authenticates on cookie *presence*, not validity~~
- [x] ~~2.4 **P1** `authApiRoutes` is an empty array~~
- [x] ~~2.5 **P1** Login response returns more of the user record than `/api/me`~~
- [x] ~~2.6 **P1** Upload endpoint does not validate file type~~
- [x] ~~2.7 **P2** Rate limiting exists on exactly one route~~
- [x] ~~2.8 **P2** Service-role client constructed per request~~

## 3. Correctness — 7/7

- [x] ~~3.1 **P0** `getPhilippineTime()` returns a wrong instant~~
- [x] ~~3.2 **P1** Duplicate time-in throws a raw Prisma error~~
- [x] ~~3.3 **P1** `recordTimeOut` overwrites an existing time-out~~
- [x] ~~3.4 **P1** Theme flashes on every DS-styled screen~~
- [x] ~~3.5 **P2** Duplicate-registration check is a non-atomic read-then-write~~
- [x] ~~3.6 **P2** `deriveStatus` implemented twice — four times, in fact~~
- [x] ~~3.7 **P2** `EventsManager` ships a placeholder as a primary action~~

## 4. Data model — 7/7

- [x] ~~4.1 **P1** `Session.userId` points at `studentId`, not `User.id`~~
- [x] ~~4.2 **P1** `Session` has no cascade and no index~~
- [x] ~~4.3 **P1** The baseline migration is a comment~~
- [x] ~~4.4 **P2** Three price columns plus a free-text fee field~~ — `price` ->
      `priceOfficer`; `registrationFees` -> `feeNote`, redefined as prose that
      supplements the amounts rather than restating them. The two duplicate tier
      lookups collapsed into one `eventPrice()` helper. **Migration written, not
      applied.**
- [x] ~~4.5 **P2** Models with no product behind them~~
- [x] ~~4.6 **P2** `Attendance.userId` is never populated~~
- [x] ~~4.7 **P3** `EventStatus` enum vs. `statusOverride` semantics~~ — enum
      renamed to `EventStatusOverride`, in the same migration as 4.4. Also ends a
      name collision: `src/types/events.ts` exported its own `EventStatus`.
      **Migration written, not applied.**

## 5. Architecture — 5/5

- [x] ~~5.1 **P1** Every page dynamic because the root layout hits the database~~
- [x] ~~5.2 **P1** Two parallel event-admin systems, both live~~
- [x] ~~5.3 **P1** `src/services/` is a half-abandoned layer~~
- [x] ~~5.4 **P2** Role gating expressed four different ways~~
- [x] ~~5.5 **P2** `/api/admin/*` and `/api/*` split not principled~~

## 6. Duplication — 7/7

- [x] ~~6.1 Two registration endpoints~~
- [x] ~~6.2 Six seed scripts in three formats~~
- [x] ~~6.3 Duplicate NavBar files~~
- [x] ~~6.4 A validation library that four files use~~
- [x] ~~6.5 Two Button and two Modal implementations~~
- [x] ~~6.6 Confirmations are native `confirm()`~~
- [x] ~~6.7 Five overlapping event list components~~ — not a real finding. They
      compose rather than overlap; closed by measurement.

## 7. Dead code — 4/4

- [x] ~~7.1 Orphaned components~~
- [x] ~~7.2 Dead route files~~
- [x] ~~7.3 Unused dependencies~~
- [x] ~~7.4 **P2** Hardcoded officer roster~~ — the roster is derived from
      `User.role`, so a promotion in People & Roles publishes someone with no
      deploy. `OfficerProfile` holds only what an account cannot say (tagline,
      portrait, term start, two socials). `officers-data.ts` deleted. Verified
      end to end: promoting a MEMBER to MEDIA_OFFICER put them on the public page
      immediately, with no profile row, and reverting removed them.

## 8. Styling — 4/4

- [x] ~~8.1 **P1** Two complete theming systems~~
- [x] ~~8.2 **P1** ~60 `!important` overrides fighting Tailwind~~
- [x] ~~8.3 **P2** Nine custom `@font-face` families, most unused~~
- [x] ~~8.4 **P2** 11 `<img>` elements instead of `next/image`~~

## 9. API conventions — 2 closed, 1 in part

- [x] ~~9.1 **P2** `403` returned where `401` is meant~~
- [x] ~~9.2 **P2** Response envelopes differ per route family~~ — the defect is
      fixed; the cosmetic remainder is a recorded decision.
  - [ ] Optional: convert the four routes still answering `success` rather than
        `ok` (`login`, `logout`, `change-password`, `attendance/manual`).
        Deliberately left — three of the four cannot be verified without
        credentials, and a missed call site means nobody can sign in. Do it when
        there are tests around the auth flows.
- [x] ~~9.3 **P2** Error detail leaks in one route~~

## 10. Code quality — 4/5

- [x] ~~10.1 **P1** ESLint reports 6 errors on `src/`~~
- [x] ~~10.2 **P2** 14 ESLint warnings~~ — now 0, enforced by `--max-warnings 0`
- [x] ~~10.3 **P2** Three suppressed `react-hooks/exhaustive-deps`~~
- [ ] **10.4 — P2 · Files that are too large to review**
      `CommitteeEditor` and `MerchandiseManager`, ~1,100 lines each. The riskiest
      item left: real surgery on the two most complex components with no
      component tests behind them. The honest prerequisite is jsdom plus tests
      for those screens first — which is most of the work.
- [x] ~~10.5 **P3** Emoji section markers in production code~~

## 11. Performance — 3 closed, 1 in part

- [x] ~~11.1 **P1** Prisma logs every query, in production~~
- [x] ~~11.2 **P1** N+1 in the admin events list~~
- [x] ~~11.3 **P1** Session query repeated per request~~
- [x] ~~11.4 **P2** No pagination anywhere~~ — done where growth is real.
      `/api/admin/users` is bounded, with `total` and `truncated` surfaced so the
      page cannot silently lie. Per-event and naturally-bounded lists left alone
      on purpose.
  - [ ] Follow-up: `admin/merch/orders` wants the same treatment once the store
        has real traffic. Nothing to page today — the table is empty.

## 12. Repo hygiene — 9/9

- [x] ~~12.1 **P1** `.env` files contain live secrets~~ — acknowledged; nothing
      tracked, no code change required
- [x] ~~12.2 **P1** `.env.example` missing three of seven variables~~
- [x] ~~12.3 **P1** Two lockfiles~~
- [x] ~~12.4 **P1** `eslint-config-next` a major version behind `next`~~
- [x] ~~12.5 **P2** `tsconfig.tsbuildinfo` in the working tree~~
- [x] ~~12.6 **P2** README is still the create-next-app default~~
- [x] ~~12.7 **P2** `Event Details.md` in the repo root~~
- [x] ~~12.8 **P2** Nine untracked files, including three new features~~
- [x] ~~12.9 **P3** `.github/` holds only a CODEOWNERS file~~

## 13. Tooling — 6/7

- [x] ~~13.1 **P1** No tests, at all~~ — 132 tests, running in CI
- [x] ~~13.2 **P2** No CI~~
- [x] ~~13.3 **P2** `npm run lint` lints nothing in particular~~
- [x] ~~13.4 **P2** No `seed` script~~
- [x] ~~13.5 **P2** Build opts out of Turbopack~~
- [ ] **13.6 — P2 · `output: "standalone"` with no consumer — HANDED OVER**
      Deliberately not decided here. `standalone` is the right build mode for a
      container and wrong for a platform that builds its own; the team taking
      this on owns deployment, so the choice is theirs to make once they know
      where it runs. Nothing else depends on it.
- [x] ~~13.7 **P3** Vercel CLI not installed~~ — installed, 59.1.4

---

## Found during the cleanup, not in the original audit

All fixed. Listed because the register would otherwise take credit only for what
it predicted.

- [x] ~~**Login leaked which accounts exist.** "Invalid Credentials" and "Invalid
      Password" were distinguishable from outside, and student numbers here are
      sequential — so the range could be walked to find real accounts before
      guessing a single password.~~
- [x] ~~**The Turbopack build was broken and `--webpack` was hiding it.**
      `registrations/complete` re-exported `dynamic`, which route segment config
      forbids.~~
- [x] ~~**ESLint had no unused-vars rule at all** — the Next 16 preset drops it.
      Enabling it found 25 problems, including 17 dead bindings left by the §5.4
      codemod earlier the same day.~~
- [x] ~~**`isBucket` walked the prototype chain**, so "constructor" and
      "toString" passed as bucket names. Caught by its own test on the first
      run.~~
- [x] ~~**`middleware.ts` is deprecated in Next 16** — renamed to `proxy.ts`,
      clearing a warning that fired on every build.~~
- [x] ~~**Both event write routes returned `err.message`** to the caller — the
      same leak §9.3 recorded against one route, present on two more.~~
- [x] ~~**Multi-day event creation was not transactional.** A bad date on day
      three aborted the request after the parent and first two days had already
      been written.~~
- [x] ~~**`contactEmail` and `applyUrl` were unvalidated** and rendered as a
      `mailto:` and a link on the public committee page. `javascript:` was
      accepted.~~
- [x] ~~**`DOCUMENTATION.pdf` was tracked** — 867 KB of binary regenerated from
      the Markdown.~~
- [x] ~~**The registration success `alert()` fired after `onClose`**, so a
      registrant's only acknowledgement was an OS dialog over a page that had
      already moved on.~~
- [x] ~~**`OfficersRoster`'s eslint-disable sat on the wrong line** —
      `exhaustive-deps` reports on the dependency array, so one directive was
      unused and the warning still fired.~~
- [x] ~~**`/api/events/ongoing` has zero callers.** Rewritten onto the shared
      status rule rather than deleted, on the same terms as
      `/registrations/complete`. A delete candidate once access logs are clear.~~

---

## Deployment

Out of scope for this cleanup, by decision. Both Vercel projects were deleted in
July 2026 and nothing here assumes a host: the build is clean, the migrations are
applied, and `output: "standalone"` is the only setting that touches it (13.6).
The Vercel CLI is installed if that is the route taken.

## Test data — cleared

Everything created while verifying has been removed from the live database and
storage, and both throwaway scripts are deleted.

- [x] ~~Three `[TEST]` events, with their registrations and attendance rows~~
- [x] ~~The merch item used to exercise the delete-confirmation path~~
- [x] ~~`1786967706363-nywacutuxr.png` in the `events` bucket~~
- [x] ~~The tagline and socials written onto a real officer profile, and the
      empty row left behind~~
- [x] ~~`make-test-event.mjs` and `cleanup-storage.mjs`~~

Verified after: 0 test events, 0 test merch items, 0 officer profiles, empty
`events` bucket, 3 board members untouched, no untracked files.
