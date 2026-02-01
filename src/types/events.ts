import type { Event } from "@prisma/client";

// ✅ Shared type for events with registration counts
export type EventWithCount = Event & {
  _count: { registrations: number };
};
