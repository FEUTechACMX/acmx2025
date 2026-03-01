import { EventSemester } from "@prisma/client";
import { prisma } from "./prisma";
import type { EventWithCount } from "@/types/events";

// Helper to clean up semester input
function normalizeSemesterInput(
  input: string | EventSemester | null | undefined
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

// Get all events (top-level only)
export async function getEvents(): Promise<EventWithCount[]> {
  return prisma.event.findMany({
    where: { parentId: null },
    include: eventInclude,
    orderBy: { startDate: "asc" },
  }) as unknown as EventWithCount[];
}

// Get events by semester (top-level only — children shown inside parent)
export async function getEventsBySemester(
  semester: string | EventSemester
): Promise<EventWithCount[]> {
  const normalized = normalizeSemesterInput(semester);
  if (!normalized) throw new Error(`Invalid semester: ${semester}`);

  return prisma.event.findMany({
    where: { eventSemester: normalized, parentId: null },
    include: eventInclude,
    orderBy: { startDate: "asc" },
  }) as unknown as EventWithCount[];
}

// Get single event by ID (includes sub-events)
export async function getEventById(
  eventId: string
): Promise<EventWithCount | null> {
  return prisma.event.findUnique({
    where: { eventId },
    include: eventInclude,
  }) as unknown as EventWithCount | null;
}
