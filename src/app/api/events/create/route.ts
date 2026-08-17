import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isEventAdmin } from "@/types/auth";
import {
  check,
  dateTime,
  hasErrors,
  maxLength,
  money,
  notBefore,
  oneOf,
  required,
  str,
} from "@/lib/validation";

/**
 * The semesters the Prisma enum accepts. Checked here so an unrecognised value
 * is a 400 rather than a constraint violation surfacing as a 500.
 */
const SEMESTERS = ["FIRST", "SECOND", "THIRD"] as const;

type SubEventInput = {
  name: string;
  description: string;
  venue: string;
  dayOfWeek: string;
  startDate: string;
  endDate: string;
};

/**
 * POST /api/events/create
 *
 * Previously this took the body apart and handed it straight to Prisma: a junk
 * `startDate` became an Invalid Date, a junk price became `NaN`, an unknown
 * semester failed the enum — and each of those threw mid-write and came back as
 * a 500 carrying the raw error message. Everything now goes through
 * `lib/validation.ts`, which is the point of §6.4: the library was already
 * written and simply wasn't adopted.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, isEventAdmin);
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Malformed request." }, { status: 400 });
    }
    const raw = body as Record<string, unknown>;

    const fields = {
      name: str(raw.name),
      description: str(raw.description),
      eventSemester: str(raw.eventSemester),
      venue: str(raw.venue),
      dayOfWeek: str(raw.dayOfWeek),
      startDate: str(raw.startDate),
      endDate: str(raw.endDate) || str(raw.startDate),
      price: raw.price ?? 0,
      priceMember: raw.priceMember ?? 0,
      priceNonMember: raw.priceNonMember ?? 0,
    };

    const errors = check(fields, {
      name: [required("Event name"), maxLength("Event name", 160)],
      description: [maxLength("Description", 8000)],
      eventSemester: [required("Semester"), oneOf("Semester", SEMESTERS)],
      venue: [required("Venue"), maxLength("Venue", 200)],
      dayOfWeek: [required("Day of week"), maxLength("Day of week", 20)],
      startDate: [dateTime("Start date")],
      endDate: [dateTime("End date")],
      price: [money("Officer rate")],
      priceMember: [money("Member rate")],
      priceNonMember: [money("Non-member rate")],
    });

    const ordering = notBefore(
      fields,
      "startDate",
      "endDate",
      "The end date cannot fall before the start date."
    );
    if (ordering) errors.endDate = ordering;

    if (hasErrors(errors)) {
      return NextResponse.json(
        { error: Object.values(errors)[0], errors },
        { status: 400 }
      );
    }

    const isMultiDay = raw.isMultiDay === true;
    const image = typeof raw.image === "string" ? raw.image : null;

    // Only an array is iterable here; a string would have iterated per character.
    // Refused rather than ignored: silently dropping a malformed `subEvents`
    // wrote an event flagged multi-day with no days attached, which nothing
    // downstream expects.
    if (isMultiDay && !Array.isArray(raw.subEvents)) {
      return NextResponse.json(
        { error: "A multi-day event needs a list of days." },
        { status: 400 }
      );
    }
    if (isMultiDay && (raw.subEvents as unknown[]).length === 0) {
      return NextResponse.json(
        { error: "A multi-day event needs at least one day." },
        { status: 400 }
      );
    }

    const subInput = Array.isArray(raw.subEvents) ? raw.subEvents : [];
    const subEvents: SubEventInput[] = subInput.map((s, i) => {
      const sub = (s ?? {}) as Record<string, unknown>;
      return {
        name: str(sub.name) || `${fields.name} — Day ${i + 1}`,
        description: str(sub.description),
        venue: str(sub.venue) || fields.venue,
        dayOfWeek: str(sub.dayOfWeek) || fields.dayOfWeek,
        startDate: str(sub.startDate) || fields.startDate,
        endDate: str(sub.endDate) || str(sub.startDate) || fields.endDate,
      };
    });

    // Each day is validated too — a bad date on day three used to abort the
    // request *after* the parent and the first two days had been written.
    if (isMultiDay) {
      for (const [i, sub] of subEvents.entries()) {
        const subErrors = check(sub, {
          name: [maxLength("Day name", 160)],
          description: [maxLength("Day description", 8000)],
          venue: [maxLength("Day venue", 200)],
          dayOfWeek: [maxLength("Day of week", 20)],
          startDate: [dateTime(`Day ${i + 1} start date`)],
          endDate: [dateTime(`Day ${i + 1} end date`)],
        });
        if (hasErrors(subErrors)) {
          return NextResponse.json(
            { error: Object.values(subErrors)[0], errors: subErrors, day: i + 1 },
            { status: 400 }
          );
        }
      }
    }

    // One transaction: a half-created multi-day event — parent saved, some days
    // missing — is worse than no event, and was previously possible.
    const created = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          name: fields.name,
          description: fields.description || null,
          eventSemester: fields.eventSemester as (typeof SEMESTERS)[number],
          venue: fields.venue,
          dayOfWeek: fields.dayOfWeek,
          startDate: new Date(fields.startDate),
          endDate: new Date(fields.endDate),
          price: Number(fields.price),
          priceMember: Number(fields.priceMember),
          priceNonMember: Number(fields.priceNonMember),
          isMultiDay,
          image,
        },
      });

      if (isMultiDay && subEvents.length > 0) {
        await tx.event.createMany({
          data: subEvents.map((sub) => ({
            name: sub.name,
            description: sub.description || null,
            eventSemester: fields.eventSemester as (typeof SEMESTERS)[number],
            venue: sub.venue,
            dayOfWeek: sub.dayOfWeek,
            startDate: new Date(sub.startDate),
            endDate: new Date(sub.endDate),
            price: Number(fields.price),
            priceMember: Number(fields.priceMember),
            priceNonMember: Number(fields.priceNonMember),
            parentId: event.eventId,
          })),
        });
      }

      return event.eventId;
    });

    const result = await prisma.event.findUnique({
      where: { eventId: created },
      include: {
        subEvents: true,
        _count: { select: { registrations: true } },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    // Fixed string: this used to return `err.message`, handing internal error
    // text to the caller (the same leak §9.3 flagged on the registrations route).
    console.error("Error creating event:", err);
    return NextResponse.json({ error: "Failed to create event." }, { status: 500 });
  }
}
