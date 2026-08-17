# ACMX

The website of the **FEU Tech ACM Student Chapter** — events and registration,
the attendance desk, the merchandise store, committee pages and the officer
console.

Next.js (App Router) · TypeScript · Prisma + PostgreSQL · Supabase Storage.

## Getting started

```bash
npm install                 # postinstall runs `prisma generate`
cp .env.example .env        # then fill it in — every variable is documented there
npx prisma migrate deploy   # apply the migration history
npm run dev
```

`.env.example` is the reference for configuration: each variable says what reads
it and whether it is a secret. Anything prefixed `NEXT_PUBLIC_` is inlined into
the browser bundle and is not a place for secrets.

## Everyday commands

| Command | Does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (Turbopack) |
| `npm test` | Unit tests (Vitest, no database needed) |
| `npm run test:watch` | Tests in watch mode |
| `npm run lint` | ESLint — **warnings fail**, so the count stays at zero |
| `npm run seed:members` | Seed the member roster |
| `npm run seed:events` | Seed events from `docs/event-details.md` |
| `npm run seed:committees` | Seed the committees |
| `npm run seed:merch` | Seed the store |

CI runs typecheck, lint, tests and build on every push, plus a job asserting the
migration history still matches `schema.prisma`.

## The documentation

- **[DOCUMENTATION.md](DOCUMENTATION.md)** — how the system is meant to work:
  the data model, the routes, the roles, the flows. Start here.
- **[CLEANUP.md](CLEANUP.md)** — the defect and debt register. Every entry is
  something wrong, duplicated, dead or inconsistent, with what was done about it
  or why it is still open. Read it before a refactor; it will usually already
  have an opinion.
- **[docs/event-details.md](docs/event-details.md)** — the source content the
  event seed script is built from.

`DOCUMENTATION.pdf` is generated from the Markdown and deliberately untracked.

## A few conventions worth knowing before you write code

- **Colour comes from the design system**, `src/styles/design-system.ts`, read
  through `useDS()`. Not from Tailwind palette classes — `globals.css` used to
  carry ~68 `!important` rules patching those back into dark mode, and it no
  longer does. Don't reintroduce the need.
- **Protected routes go through `requireRole` / `requireUser`** in
  `src/lib/auth.ts`. 401 when there is no session, 403 when a real role check
  fails.
- **Input is validated through `src/lib/validation.ts`**, or a `validate*Input`
  helper next to the model. The `read*` coercers are for absent fields, not for
  malformed ones.
- **`src/proxy.ts` is not a security boundary.** It only sees whether a session
  cookie exists. Adding a route to its matcher protects nothing; gate it in the
  page or handler.

- **Where a new API route belongs.** `/api/admin/*` is for the officer console's
  own projections — data shaped for the console, including fields and aggregates
  the public never sees (`admin/events` returns per-event attendance counts;
  `admin/merch/items` includes `HIDDEN` items and restock demand).
  `/api/<resource>/*` is the resource itself, public where the resource is
  public, with officer-only *operations* gated inline via `requireRole`. So
  `events/create` and `events/[eventId]/edit` sit under `events` because they act
  on an event, while `admin/events` is a console view of the same data. Reads for
  the console go under `admin`; writes to a resource stay with the resource.

- **Responses.** Success is `{ ok: true, … }`, failure is
  `{ error: "A sentence a member could read." }` with a real status code, and an
  absence is an explicit `null` field rather than an empty object. Four auth
  routes still answer `success` instead of `ok` — see CLEANUP.md §9.2 for why
  they were left alone.
