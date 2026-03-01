import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { EVENT_ADMIN_ROLES } from "@/types/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !EVENT_ADMIN_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      description,
      eventSemester,
      venue,
      dayOfWeek,
      startDate,
      endDate,
      price = 0,
      priceMember = 0,
      priceNonMember = 0,
      isMultiDay = false,
      image = null,
      subEvents = [],
    } = body;

    if (!name || !venue || !dayOfWeek || !startDate || !endDate || !eventSemester) {
      return NextResponse.json(
        { error: "Missing required fields: name, venue, dayOfWeek, startDate, endDate, eventSemester" },
        { status: 400 }
      );
    }

    // Create the parent event
    const event = await prisma.event.create({
      data: {
        name,
        description: description || null,
        eventSemester,
        venue,
        dayOfWeek,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        price: Number(price),
        priceMember: Number(priceMember),
        priceNonMember: Number(priceNonMember),
        isMultiDay,
        image,
      },
    });

    // Create sub-events for multi-day events
    if (isMultiDay && subEvents.length > 0) {
      for (const sub of subEvents) {
        await prisma.event.create({
          data: {
            name: sub.name || `${name} — Day ${subEvents.indexOf(sub) + 1}`,
            description: sub.description || null,
            eventSemester,
            venue: sub.venue || venue,
            dayOfWeek: sub.dayOfWeek || dayOfWeek,
            startDate: new Date(sub.startDate),
            endDate: new Date(sub.endDate || sub.startDate),
            price: Number(sub.price ?? price),
            priceMember: Number(sub.priceMember ?? priceMember),
            priceNonMember: Number(sub.priceNonMember ?? priceNonMember),
            parentId: event.eventId,
          },
        });
      }
    }

    // Return the created event with sub-events
    const result = await prisma.event.findUnique({
      where: { eventId: event.eventId },
      include: {
        subEvents: true,
        _count: { select: { registrations: true } },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Error creating event:", err);
    const message = err instanceof Error ? err.message : "Failed to create event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
