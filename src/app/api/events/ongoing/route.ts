import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEventStatus } from "@/types/events";

export const dynamic = "force-dynamic";

/**
 * GET /api/events/ongoing — every event currently running.
 *
 * Nothing in this repository calls this path (`grep -rn "events/ongoing" src`
 * finds only comments), so it survives on the same terms as
 * `/api/registrations/complete`: an outside script might still poll it, and a
 * 404 would fail that silently. Safe to delete once the access logs are clear.
 *
 * The selection used to be a Prisma `where` — `statusOverride: "ONGOING"` OR
 * (dates straddle now AND override is null) — which was a fourth, SQL-shaped
 * copy of the status rule (CLEANUP.md §3.6). It disagreed with the others on
 * multi-day events: a parent whose own dates had passed but whose last day was
 * still running is ongoing by `getEventStatus` and was invisible here.
 *
 * Filtering in JS costs one full scan of a table holding a handful of rows per
 * semester, and buys one definition of "ongoing" instead of two.
 */
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { parentId: null },
      select: {
        eventId: true,
        name: true,
        startDate: true,
        endDate: true,
        statusOverride: true,
        subEvents: {
          select: { startDate: true, endDate: true, statusOverride: true },
        },
      },
      orderBy: { startDate: "asc" },
    });

    const ongoing = events
      .filter((e) => getEventStatus(e) === "ongoing")
      // The response shape is unchanged for whatever might be reading it.
      .map(({ eventId, name }) => ({ eventId, name }));

    return NextResponse.json(ongoing);
  } catch (err) {
    console.error("Error fetching ongoing events:", err);
    return NextResponse.json([], { status: 500 });
  }
}
