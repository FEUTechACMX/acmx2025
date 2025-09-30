"use client";

import React, { useEffect, useState } from "react";
import EventCards from "./EventCards";
import type { EventWithCount } from "../../types/events";

export default function EventsList({ semester }: { semester: string }) {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch(`/api/events/${semester}`);
        if (!res.ok) throw new Error("Failed to fetch events");
        const data: EventWithCount[] = await res.json();
        setEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [semester]);

  if (loading) return <p className="text-white">Loading events...</p>;

  return (
    <div className="flex flex-wrap gap-6 justify-center">
      {events.map((event) => (
        <EventCards key={event.eventId} event={event} />
      ))}
    </div>
  );
}
