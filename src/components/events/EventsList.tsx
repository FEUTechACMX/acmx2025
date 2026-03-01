"use client";

import React, { useEffect, useState } from "react";
import EventCards from "./EventCards";
import type { EventWithCount } from "@/types/events";
import { getEventStatus } from "@/types/events";
import { isOfficer } from "@/types/auth";

type PriceTier = "officer" | "member" | "nonmember";

export default function EventsList({ semester }: { semester: string }) {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceTier, setPriceTier] = useState<PriceTier>("nonmember");

  useEffect(() => {
    // Fetch user role to determine price tier
    async function fetchUserRole() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setPriceTier(isOfficer(data.user.role) ? "officer" : "member");
          }
        }
      } catch {
        // Not logged in — stays as nonmember
      }
    }
    fetchUserRole();
  }, []);

  useEffect(() => {
    setLoading(true);
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

  const upcoming = events.filter(e => getEventStatus(e) === "upcoming");
  const ongoing = events.filter(e => getEventStatus(e) === "ongoing");
  const finished = events.filter(e => getEventStatus(e) === "finished");

  return (
    <div className="w-full space-y-14">
      <EventSection label="Ongoing" events={ongoing} accent="#CF78EC" priceTier={priceTier} />
      <EventSection label="Upcoming" events={upcoming} accent="#CF78EC" priceTier={priceTier} />
      <EventSection label="Finished" events={finished} accent="#9ca3af" muted priceTier={priceTier} />
    </div>
  );
}

function EventSection({
  label,
  events,
  accent,
  muted = false,
  priceTier,
}: {
  label: string;
  events: EventWithCount[];
  accent: string;
  muted?: boolean;
  priceTier: PriceTier;
}) {
  if (events.length === 0) return null;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-2 h-2 shrink-0" style={{ backgroundColor: accent }} />
        <h2
          className="text-xs font-['Arian-bold'] uppercase tracking-widest"
          style={{ color: muted ? "#9ca3af" : "#CF78EC" }}
        >
          {label}
        </h2>
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs font-['Arian-light'] text-gray-400">{events.length}</span>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 ${muted ? "opacity-60" : ""}`}>
        {events.map((event) => (
          <EventCards key={event.eventId} event={event} priceTier={priceTier} />
        ))}
      </div>
    </div>
  );
}
