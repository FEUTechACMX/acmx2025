// components/events/components/EventsList.tsx
import React from "react";
import { getEventsBySemester } from "../../lib/events";
import EventCards from "./EventCards";

interface EventsListProps {
  semester: string;
}

export default async function EventsList({ semester }: EventsListProps) {
  const events = await getEventsBySemester(semester);

  return (
    <div className="flex flex-wrap gap-6 justify-center">
      {events.map((event) => (
        <EventCards key={event.eventId} event={event} />
      ))}
    </div>
  );
}
