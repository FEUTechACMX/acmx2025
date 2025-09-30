import { Event as PrismaEvent, EventSemester } from "@prisma/client"; //import Prisma client from local prisma.ts
import { prisma } from "./prisma";
import type { EventWithCount } from "../types/events";

// Helper to clean up semester input
function normalizeSemesterInput(
  input: string | EventSemester | null | undefined
): EventSemester | null {
  if (!input) return null;

  const key = String(input).trim().toUpperCase();

  if (key === "1ST" || key === "FIRST") return EventSemester.FIRST;
  if (key === "2ND" || key === "SECOND") return EventSemester.SECOND;
  if (key === "3RD" || key === "THIRD") return EventSemester.THIRD;

  return null; // return null if invalid
}

// Get all events
export async function getEvents(): Promise<EventWithCount[]> {
  return prisma.event.findMany({
    include: { _count: { select: { registrations: true } } },
    orderBy: { startDate: "asc" },
  });
}

// Get events by semester
export async function getEventsBySemester(
  semester: string | EventSemester
): Promise<EventWithCount[]> {
  const normalized = normalizeSemesterInput(semester);
  if (!normalized) throw new Error(`Invalid semester: ${semester}`);

  return prisma.event.findMany({
    where: { eventSemester: normalized },
    include: { _count: { select: { registrations: true } } },
    orderBy: { startDate: "asc" },
  });
}

// Get single event by ID
export async function getEventById(
  eventId: string
): Promise<EventWithCount | null> {
  return prisma.event.findUnique({
    where: { eventId },
    include: { _count: { select: { registrations: true } } },
  });
}
