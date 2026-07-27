import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * The chapter's nine committees, so a fresh database opens on a populated index
 * instead of the empty state. Re-running is safe: committees are upserted by
 * slug and their child rows are rebuilt from this file.
 *
 * Rosters are deliberately absent. Committee seats are now assembled from real
 * accounts in Admin → Committees, and a seat is what grants its holder access
 * to the console — so seeding placeholder names would either mean rows nobody
 * can sign in as, or access handed to accounts that don't exist. Every plate
 * renders its roster empty state until a head is assigned for real.
 *
 * ACMx is the one committee on the DEV track: its roster splits into project
 * lead, lead dev and junior devs rather than head, co-head and members.
 */
const KICKER = "STANDING COMMITTEE · AY 2026–27";

const committees = [
  {
    slug: "secretariat",
    name: "SECRETARIAT",
    emblem: "clipboard",
    order: 0,
    blurb: "Minutes, membership records and the paper trail the next officers inherit.",
    mandate:
      "Minutes, membership records and correspondence. We keep the record of what the chapter decided and when — the paper trail every other committee eventually needs to point at.",
    contactEmail: "secretariat.acmx@feu.edu.ph",
    responsibilities: [
      { title: "Minutes", description: "Meeting records for the executive board and every committee that asks." },
      { title: "Membership records", description: "The roll, the sign-ups and the accounts behind them." },
      { title: "Correspondence", description: "Letters, clearances and the university paperwork that needs a signature." },
    ],
    facts: [
      { label: "MEETS", value: "Fridays · 4:00 PM" },
      { label: "ROOM", value: "ACM Room, 17F" },
      { label: "REPORTS TO", value: "VP for Internals" },
    ],
  },
  {
    slug: "finance",
    name: "FINANCE",
    emblem: "wallet",
    order: 1,
    blurb: "Budgets, collections and the receipts behind every peso the chapter moves.",
    mandate:
      "Budgets, collections and reconciliation. Every peso the chapter moves has a receipt behind it, and this committee is the reason that is true.",
    contactEmail: "finance.acmx@feu.edu.ph",
    responsibilities: [
      { title: "Budgeting", description: "Per-event budgets, approvals and the running chapter balance." },
      { title: "Collections", description: "Event fees, merch payments and the counter on collection days." },
      { title: "Reconciliation", description: "Matching cash on hand against the console's exports, every week." },
    ],
    facts: [
      { label: "MEETS", value: "Mondays · 5:00 PM" },
      { label: "ROOM", value: "ACM Room, 17F" },
      { label: "REPORTS TO", value: "Treasurer" },
    ],
  },
  {
    slug: "publicity",
    name: "PUBLICITY",
    emblem: "megaphone",
    order: 2,
    blurb: "Announcements, campaigns and the chapter's voice on every channel it runs.",
    mandate:
      "Announcements, campaigns and community. If a member heard about an event before it happened, Publicity is why — and if they didn't, that's ours to fix too.",
    contactEmail: "publicity.acmx@feu.edu.ph",
    responsibilities: [
      { title: "Campaigns", description: "Teaser through recap, planned back from the event date." },
      { title: "Channels", description: "The chapter's pages, group chats and the posting calendar behind them." },
      { title: "Copy", description: "Captions, announcements and the tone the chapter speaks in." },
    ],
    facts: [
      { label: "MEETS", value: "Tuesdays · 4:30 PM" },
      { label: "ROOM", value: "ACM Room, 17F" },
      { label: "REPORTS TO", value: "VP for Externals" },
    ],
  },
  {
    slug: "publications",
    name: "PUBLICATIONS",
    emblem: "book",
    order: 3,
    blurb: "Articles, the newsletter and the writing that outlives the event it covered.",
    mandate:
      "Long-form writing, the newsletter and the chapter's editorial standards. Publicity gets people into the room; Publications is what's left to read afterwards.",
    contactEmail: "publications.acmx@feu.edu.ph",
    responsibilities: [
      { title: "Editorial", description: "Commissioning, editing and the publishing schedule." },
      { title: "The newsletter", description: "Every issue, from the pitch list to the send." },
      { title: "Feature writing", description: "Post-event coverage, member profiles and industry pieces." },
    ],
    facts: [
      { label: "MEETS", value: "Wednesdays · 4:30 PM" },
      { label: "ROOM", value: "ACM Room, 17F" },
      { label: "REPORTS TO", value: "VP for Externals" },
    ],
  },
  {
    slug: "events",
    name: "EVENTS",
    emblem: "calendar",
    order: 4,
    blurb: "Programmes, run-throughs and the calendar the whole chapter works back from.",
    mandate:
      "The chapter calendar and everything on it. Concepts, programmes, run-throughs and the hosts — Events owns the shape of the day, and every other committee builds against it.",
    contactEmail: "events.acmx@feu.edu.ph",
    responsibilities: [
      { title: "The calendar", description: "What runs when, and what it takes to get there." },
      { title: "Programme design", description: "Segments, timings and the run-through the day is rehearsed against." },
      { title: "Hosting", description: "Emcees, scripts and the briefing before doors open." },
    ],
    facts: [
      { label: "MEETS", value: "Thursdays · 4:30 PM" },
      { label: "ROOM", value: "ACM Room, 17F" },
      { label: "REPORTS TO", value: "VP for Internals" },
    ],
  },
  {
    slug: "media",
    name: "MEDIA",
    emblem: "camera",
    order: 5,
    blurb: "Design, photo, video and the archive the chapter is remembered through.",
    mandate:
      "The chapter's visual language and its record. Posters, motion, coverage on the day and the archive it all lands in — from the first teaser to the last recap.",
    contactEmail: "media.acmx@feu.edu.ph",
    responsibilities: [
      { title: "Visual identity", description: "Poster systems, typography and the templates other committees pull from." },
      { title: "Coverage", description: "Photo and video on the day, edited and delivered after." },
      { title: "The archive", description: "Naming, sorting and storing everything so it can be found next year." },
    ],
    facts: [
      { label: "MEETS", value: "Thursdays · 5:00 PM" },
      { label: "ROOM", value: "ACM Room, 17F" },
      { label: "REPORTS TO", value: "VP for Internals" },
    ],
  },
  {
    slug: "logistics",
    name: "LOGISTICS",
    emblem: "package",
    order: 6,
    blurb: "Venues, permits, materials and the floor plan that keeps an event standing up.",
    mandate:
      "Venues, permits, materials and the floor plan. The work nobody notices when it is done properly, and the only work anyone notices when it is not.",
    contactEmail: "logistics.acmx@feu.edu.ph",
    responsibilities: [
      { title: "Venue & permits", description: "Booking, clearances and the paperwork the university needs signed." },
      { title: "Materials", description: "Procurement, inventory and getting everything to the floor on time." },
      { title: "Floor management", description: "Layout, queueing and crowd flow on the day itself." },
    ],
    facts: [
      { label: "MEETS", value: "Wednesdays · 4:00 PM" },
      { label: "ROOM", value: "ACM Room, 17F" },
      { label: "REPORTS TO", value: "VP for Internals" },
    ],
  },
  {
    slug: "acmx",
    name: "ACMX",
    emblem: "terminal",
    order: 7,
    track: "DEV",
    blurb: "The chapter's software — this site, the console behind it and what comes next.",
    mandate:
      "The chapter builds its own software, and this is the team that ships it. The site you're reading, the admin console behind it, and whatever the chapter needs next that doesn't exist yet.",
    contactEmail: "acmx@feu.edu.ph",
    responsibilities: [
      { title: "The chapter site", description: "Features, fixes and the admin console behind them." },
      { title: "Internal tools", description: "Registration, attendance capture and the exports officers need after." },
      { title: "Engineering practice", description: "Review, releases and bringing junior devs up to speed on the codebase." },
    ],
    projects: [
      { title: "COMMITTEE PAGES", meta: "One reusable plate for every committee", status: "IN_PROGRESS" },
      { title: "MERCH RESERVATIONS", meta: "Cart, holds and the pickup console", status: "SHIPPED" },
    ],
    facts: [
      { label: "MEETS", value: "Tuesdays · 5:00 PM" },
      { label: "ROOM", value: "ACM Room, 17F" },
      { label: "ROSTER", value: "Project lead · Lead dev · Junior devs" },
      { label: "REPORTS TO", value: "VP for Internals" },
    ],
  },
  {
    slug: "externals",
    name: "EXTERNALS",
    emblem: "handshake",
    order: 8,
    blurb: "Sponsors, partner orgs and industry guests — everyone we bring to the table.",
    mandate:
      "Sponsors, partner organisations and the industry guests who speak at our events. If someone from outside the chapter is in the room, Externals is why.",
    contactEmail: "externals.acmx@feu.edu.ph",
    responsibilities: [
      { title: "Sponsorships", description: "Proposals, negotiations and delivering what was promised in return." },
      { title: "Partnerships", description: "Joint events with other chapters and student organisations." },
      { title: "Speakers", description: "Sourcing, briefing and looking after industry guests on the day." },
    ],
    facts: [
      { label: "MEETS", value: "Mondays · 4:30 PM" },
      { label: "ROOM", value: "ACM Room, 17F" },
      { label: "REPORTS TO", value: "VP for Externals" },
    ],
  },
];

async function main() {
  for (const c of committees) {
    const { responsibilities = [], projects = [], facts = [], ...scalars } = c;

    const data = {
      ...scalars,
      kicker: KICKER,
      status: "PUBLISHED",
      track: c.track ?? "STANDARD",
      recruiting: "NOT_YET",
      openSeats: 0,
      responsibilities: { create: responsibilities.map((r, i) => ({ ...r, order: i })) },
      projects: { create: projects.map((p, i) => ({ ...p, order: i })) },
      facts: { create: facts.map((f, i) => ({ ...f, order: i })) },
    };

    // Content rows are rebuilt rather than merged, so re-running this file always
    // lands on exactly what's written above. Rosters are left alone: they're
    // assigned from real accounts in the console and this file must not undo that.
    const existing = await prisma.committee.findUnique({ where: { slug: c.slug } });
    if (existing) {
      await prisma.$transaction([
        prisma.committeeResponsibility.deleteMany({ where: { committeeId: existing.id } }),
        prisma.committeeProject.deleteMany({ where: { committeeId: existing.id } }),
        prisma.committeeFact.deleteMany({ where: { committeeId: existing.id } }),
      ]);
      await prisma.committee.update({ where: { id: existing.id }, data });
      console.log(`updated  ${c.slug}`);
    } else {
      await prisma.committee.create({ data });
      console.log(`created  ${c.slug}`);
    }
  }

  const total = await prisma.committee.count();
  const extra = await prisma.committee.findMany({
    where: { slug: { notIn: committees.map((c) => c.slug) } },
    select: { slug: true },
  });

  console.log(`\n${total} committees in the database.`);
  if (extra.length) {
    console.log(
      `Not in this file, left untouched: ${extra.map((c) => c.slug).join(", ")}.\n` +
        `Delete them from Admin → Committees if they're no longer chapter committees.`
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
