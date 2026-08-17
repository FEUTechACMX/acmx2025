import { afterEach, describe, expect, it, vi } from "vitest";
import { getEventStatus, getEventStatusEnum } from "./events";

/**
 * Pinning the status rule down, because it is currently implemented four times
 * (CLEANUP.md §3.6): here, in `api/admin/events`, in `EventEditor`, and again as
 * a Prisma `where` in `api/events/ongoing`. These tests describe what *this*
 * copy does, so that folding the other three into it is a safe change rather
 * than a hopeful one.
 */

const NOW = new Date("2026-08-17T12:00:00Z");

const at = (offsetDays: number) =>
  new Date(NOW.getTime() + offsetDays * 24 * 60 * 60 * 1000).toISOString();

const event = (over: Record<string, unknown> = {}) => ({
  startDate: at(-1),
  endDate: at(1),
  statusOverride: null,
  ...over,
});

vi.useFakeTimers();
vi.setSystemTime(NOW);
afterEach(() => vi.setSystemTime(NOW));

describe("derived from dates", () => {
  it("is upcoming before the start", () => {
    expect(getEventStatus(event({ startDate: at(3), endDate: at(4) }))).toBe("upcoming");
  });

  it("is ongoing between start and end", () => {
    expect(getEventStatus(event())).toBe("ongoing");
  });

  it("is finished after the end", () => {
    expect(getEventStatus(event({ startDate: at(-5), endDate: at(-4) }))).toBe("finished");
  });

  it("counts the exact start instant as ongoing, not upcoming", () => {
    expect(getEventStatus(event({ startDate: NOW.toISOString(), endDate: at(1) }))).toBe(
      "ongoing"
    );
  });

  it("counts the exact end instant as ongoing, not finished", () => {
    expect(getEventStatus(event({ startDate: at(-1), endDate: NOW.toISOString() }))).toBe(
      "ongoing"
    );
  });

  it("treats a single-instant event as ongoing at that instant", () => {
    const t = NOW.toISOString();
    expect(getEventStatus(event({ startDate: t, endDate: t }))).toBe("ongoing");
  });
});

describe("getEventStatusEnum — the database spelling", () => {
  it("agrees with getEventStatus in every case, just uppercased", () => {
    const cases = [
      event({ startDate: at(3), endDate: at(4) }),
      event(),
      event({ startDate: at(-5), endDate: at(-4) }),
      event({ statusOverride: "FINISHED" }),
      event({ subEvents: [event({ startDate: at(3), endDate: at(4) })] }),
    ];
    for (const c of cases) {
      expect(getEventStatusEnum(c)).toBe(getEventStatus(c).toUpperCase());
    }
  });

  it("returns the three enum spellings and nothing else", () => {
    expect(["UPCOMING", "ONGOING", "FINISHED"]).toContain(getEventStatusEnum(event()));
  });

  it("accepts Date objects as well as ISO strings", () => {
    const asDates = { startDate: new Date(at(-1)), endDate: new Date(at(1)) };
    expect(getEventStatusEnum(asDates)).toBe("ONGOING");
  });
});

describe("statusOverride wins over the dates", () => {
  it.each(["UPCOMING", "ONGOING", "FINISHED"])("honours %s", (override) => {
    expect(getEventStatus(event({ statusOverride: override }))).toBe(
      override.toLowerCase()
    );
  });

  it("can call a long-past event upcoming, which is the point of an override", () => {
    expect(
      getEventStatus(event({ startDate: at(-40), endDate: at(-39), statusOverride: "UPCOMING" }))
    ).toBe("upcoming");
  });

  it("falls back to the dates when the override is null", () => {
    expect(getEventStatus(event({ statusOverride: null }))).toBe("ongoing");
  });
});

describe("multi-day parents derive from their children", () => {
  it("is ongoing if any day is ongoing", () => {
    const parent = event({
      startDate: at(-9),
      endDate: at(-8), // parent's own dates say finished
      subEvents: [
        event({ startDate: at(-9), endDate: at(-8) }),
        event({ startDate: at(-1), endDate: at(1) }),
      ],
    });
    expect(getEventStatus(parent)).toBe("ongoing");
  });

  it("is upcoming if a day is still to come and none is running", () => {
    const parent = event({
      subEvents: [
        event({ startDate: at(-9), endDate: at(-8) }),
        event({ startDate: at(3), endDate: at(4) }),
      ],
    });
    expect(getEventStatus(parent)).toBe("upcoming");
  });

  it("is finished only when every day is finished", () => {
    const parent = event({
      startDate: at(-1),
      endDate: at(1), // parent's own dates say ongoing
      subEvents: [
        event({ startDate: at(-9), endDate: at(-8) }),
        event({ startDate: at(-5), endDate: at(-4) }),
      ],
    });
    expect(getEventStatus(parent)).toBe("finished");
  });

  it("prefers the parent's own override over its children", () => {
    const parent = event({
      statusOverride: "FINISHED",
      subEvents: [event({ startDate: at(-1), endDate: at(1) })],
    });
    expect(getEventStatus(parent)).toBe("finished");
  });

  it("ignores an empty subEvents array and uses the dates", () => {
    expect(getEventStatus(event({ subEvents: [] }))).toBe("ongoing");
  });

  /**
   * The exact case the four implementations disagreed on before §3.6 was
   * collapsed: the parent's own dates have passed, but its last day is still
   * running. Only the shared rule ever got this right.
   */
  it("is ongoing when the parent's own dates have passed but a day is still running", () => {
    const parent = event({
      startDate: at(-9),
      endDate: at(-8),
      subEvents: [
        event({ startDate: at(-9), endDate: at(-8) }),
        event({ startDate: at(-1), endDate: at(1) }),
      ],
    });
    expect(getEventStatus(parent)).toBe("ongoing");
    expect(getEventStatusEnum(parent)).toBe("ONGOING");
  });

  it("honours a child's own override when rolling up", () => {
    const parent = event({
      startDate: at(-9),
      endDate: at(-8),
      subEvents: [event({ startDate: at(-9), endDate: at(-8), statusOverride: "ONGOING" })],
    });
    expect(getEventStatus(parent)).toBe("ongoing");
  });
});
