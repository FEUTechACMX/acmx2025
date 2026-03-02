import { EventSemester } from "@prisma/client";
import { prisma } from "./prisma";
import type { EventWithCount } from "@/types/events";

// Helper to clean up semester input
function normalizeSemesterInput(
  input: string | EventSemester | null | undefined,
): EventSemester | null {
  if (!input) return null;

  const key = String(input).trim().toUpperCase();

  if (key === "1ST" || key === "FIRST") return EventSemester.FIRST;
  if (key === "2ND" || key === "SECOND") return EventSemester.SECOND;
  if (key === "3RD" || key === "THIRD") return EventSemester.THIRD;

  return null;
}

const eventInclude = {
  _count: { select: { registrations: true } },
  subEvents: {
    include: {
      _count: { select: { registrations: true } },
    },
    orderBy: { startDate: "asc" as const },
  },
} as const;

// Helper to calculate aggregated registration count for parent events
function addAggregatedCounts(events: EventWithCount[]): EventWithCount[] {
  return events.map((event) => {
    if (event.subEvents && event.subEvents.length > 0) {
      // Sum registrations from all sub-events
      const totalRegistrations = event.subEvents.reduce(
        (sum, subEvent) => sum + subEvent._count.registrations,
        0,
      );
      return {
        ...event,
        _aggregatedCount: { registrations: totalRegistrations },
      };
    }
    return event;
  });
}

// Get all events (top-level only)
export async function getEvents(): Promise<EventWithCount[]> {
  const events = (await prisma.event.findMany({
    where: { parentId: null },
    include: eventInclude,
    orderBy: { startDate: "asc" },
  })) as unknown as EventWithCount[];

  return addAggregatedCounts(events);
}

// Get events by semester (top-level only — children shown inside parent)
export async function getEventsBySemester(
  semester: string | EventSemester,
): Promise<EventWithCount[]> {
  const normalized = normalizeSemesterInput(semester);
  if (!normalized) throw new Error(`Invalid semester: ${semester}`);

  const events = (await prisma.event.findMany({
    where: { eventSemester: normalized, parentId: null },
    include: eventInclude,
    orderBy: { startDate: "asc" },
  })) as unknown as EventWithCount[];

  return addAggregatedCounts(events);
}

// Get single event by ID (includes sub-events)
export async function getEventById(
  eventId: string,
): Promise<EventWithCount | null> {
  const event = (await prisma.event.findUnique({
    where: { eventId },
    include: eventInclude,
  })) as unknown as EventWithCount | null;

  if (!event) return null;

  // Add aggregated counts if it's a parent event
  if (event.subEvents && event.subEvents.length > 0) {
    const totalRegistrations = event.subEvents.reduce(
      (sum, subEvent) => sum + subEvent._count.registrations,
      0,
    );
    return {
      ...event,
      _aggregatedCount: { registrations: totalRegistrations },
    };
  }

  return event;
}
