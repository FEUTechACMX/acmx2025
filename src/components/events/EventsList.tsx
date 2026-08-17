"use client";

import React, { useEffect, useState } from "react";
import EventCards from "./EventCards";
import type { EventWithCount } from "@/types/events";
import { isOfficer } from "@/types/auth";
import { useSession } from "@/components/sessionClient";
import { Panel, Body, Label, useDS } from "@/components/ds";

type PriceTier = "officer" | "member" | "nonmember";

/** Square accent spinner — the system has no circles. */
function Loader() {
  const { c } = useDS();
  return (
    <div className="flex justify-center items-center w-full" style={{ height: "16rem" }}>
      <div
        className="animate-spin"
        style={{
          width: "1.25rem",
          height: "1.25rem",
          border: `2px solid ${c.rule}`,
          borderTopColor: c.accent,
        }}
      />
    </div>
  );
}

export default function EventsList({ semester }: { semester: string }) {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const { c } = useDS();
  const { user } = useSession();

  // Derived from the shared session read rather than this component's own
  // /api/me request. Signed-out visitors see the non-member rate.
  const priceTier: PriceTier = !user
    ? "nonmember"
    : isOfficer(user.role)
      ? "officer"
      : "member";

  // Switching semester puts the list back into its loading state. Adjusted
  // during render so the previous semester's events aren't shown for a frame
  // under the new semester's heading.
  const [prevSemester, setPrevSemester] = useState(semester);
  if (semester !== prevSemester) {
    setPrevSemester(semester);
    setLoading(true);
  }

  useEffect(() => {
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

  if (loading) return <Loader />;

  if (events.length === 0) {
    return (
      <Panel style={{ textAlign: "center", padding: "clamp(2.5rem, 8vh, 5rem) 1.5rem" }}>
        <Label style={{ color: c.accent }}>No Events</Label>
        <div style={{ marginTop: "0.75rem" }}>
          <Body measure={false}>Nothing scheduled for the {semester} semester yet.</Body>
        </div>
      </Panel>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      style={{ gap: "clamp(1rem, 2vw, 1.75rem)" }}
    >
      {events.map((event) => (
        <EventCards key={event.eventId} event={event} priceTier={priceTier} />
      ))}
    </div>
  );
}
