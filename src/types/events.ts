import type { Event } from "@prisma/client";

// ✅ Shared type for events with registration counts and optional sub-events
export type EventWithCount = Event & {
  _count: { registrations: number };
  subEvents?: EventWithCount[];
};

// Derived status based on dates
export type EventStatus = "upcoming" | "ongoing" | "finished";

export function getEventStatus(event: Pick<Event, "startDate" | "endDate">): EventStatus {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "finished";
}
