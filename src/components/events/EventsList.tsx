"use client";

import React, { useEffect, useState } from "react";
import EventCards from "./EventCards";
import type { EventWithCount } from "@/types/events";
import { isOfficer } from "@/types/auth";

type PriceTier = "officer" | "member" | "nonmember";

export default function EventsList({ semester }: { semester: string }) {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceTier, setPriceTier] = useState<PriceTier>("nonmember");

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setPriceTier(isOfficer(data.user.role) ? "officer" : "member");
          }
        }
      } catch { /* not logged in */ }
    }
    fetchUserRole();
  }, []);

  useEffect(() => {
    setLoading(true);
    async function loadEvents() {
      try {
        const res = await fetch(`/api/events/semester/${semester}`);
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
      <div className="w-5 h-5 border-2 border-gray-200 border-t-[#CF78EC] animate-spin" />
    </div>
  );

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg font-['Arian-light']">No events available for {semester} semester</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-6 sm:gap-8 min-w-min">
        {events.map((event) => (
          <div key={event.eventId} className="w-[280px] sm:w-[320px] lg:w-[360px] shrink-0">
            <EventCards event={event} priceTier={priceTier} />
          </div>
        ))}
      </div>
    </div>
  );
}
