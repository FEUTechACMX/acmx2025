import type { Event } from "@prisma/client";

// ✅ Shared type for events with registration counts and optional sub-events
export type EventWithCount = Event & {
  _count: { registrations: number };
  subEvents?: EventWithCount[];
  _aggregatedCount?: { registrations: number }; // For parent events: sum of all children
};

// Derived status based on dates, with statusOverride taking priority
export type EventStatus = "upcoming" | "ongoing" | "finished";

/** The `UserRole`-style spelling the database and the admin APIs use. */
export type EventStatusEnum = "UPCOMING" | "ONGOING" | "FINISHED";

/**
 * The least an event has to look like for its status to be derivable. Structural
 * rather than `EventWithCount`, so an API projection that selected four columns
 * qualifies just as well as a full row — and so this file no longer needs `any`.
 */
export type StatusInput = {
  statusOverride?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  subEvents?: StatusInput[] | null;
};

/**
 * The status rule. **This is the only copy.**
 *
 * There used to be four: this one, an uppercase `deriveStatus` in
 * `api/admin/events`, a third in `EventEditor` that returned `string` and ""
 * for missing dates, and a Prisma `where` in `api/events/ongoing` that
 * expressed the same idea in SQL. They drifted, as CLEANUP.md §3.6 predicted:
 * only this copy understood multi-day parents, so a parent whose own dates had
 * passed but whose final day was still running read as ongoing here and
 * finished everywhere else.
 *
 * Precedence, in order:
 *   1. `statusOverride` — an officer's explicit call beats the clock.
 *   2. Sub-events, if any — a multi-day event is ongoing while any day is.
 *   3. The dates, with both boundary instants counting as ongoing.
 */
export function getEventStatus(event: StatusInput): EventStatus {
  if (event.statusOverride) {
    return event.statusOverride.toLowerCase() as EventStatus;
  }

  if (Array.isArray(event.subEvents) && event.subEvents.length > 0) {
    const subStatuses = event.subEvents.map(getEventStatus);
    if (subStatuses.includes("ongoing")) return "ongoing";
    if (subStatuses.includes("upcoming")) return "upcoming";
    return "finished"; // all finished
  }

  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "finished";
}

/** Same rule, spelled the way the database enum and the admin APIs expect. */
export function getEventStatusEnum(event: StatusInput): EventStatusEnum {
  return getEventStatus(event).toUpperCase() as EventStatusEnum;
}
