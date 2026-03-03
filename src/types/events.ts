import type { Event } from "@prisma/client";

// ✅ Shared type for events with registration counts and optional sub-events
export type EventWithCount = Event & {
  _count: { registrations: number };
  subEvents?: EventWithCount[];
  _aggregatedCount?: { registrations: number }; // For parent events: sum of all children
};

// Derived status based on dates, with statusOverride taking priority
export type EventStatus = "upcoming" | "ongoing" | "finished";

export function getEventStatus(
  event: any,
): EventStatus {
  // If there's an explicit override, use it
  if (event.statusOverride) {
    return event.statusOverride.toLowerCase() as EventStatus;
  }

  // If it's a parent event with sub-events, derive status from children
  if (event.subEvents && Array.isArray(event.subEvents) && event.subEvents.length > 0) {
    const subStatuses = event.subEvents.map((sub: any) => getEventStatus(sub));
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
