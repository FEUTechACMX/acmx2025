"use client";

import React, { useEffect, useState } from "react";
import EventCards from "./EventCards";
import type { EventWithCount } from "@/types/events";

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

  if (loading) return (
    <div className="flex justify-center items-center h-64 w-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No events available for {semester} semester</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
      {events.map((event) => (
        <EventCards key={event.eventId} event={event} />
      ))}
    </div>
  );
}
