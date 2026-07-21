"use client";

import React, { useState, useEffect } from "react";
import EventsList from "./EventsList";
import EventSelector from "./EventSelector";
import EventCreationModal from "./EventCreationModal";
import { isEventAdmin } from "@/types/auth";
import { Column, PageHeader, Button } from "@/components/ds";
import { layout } from "@/styles/design-system";

export default function Events() {
  const [semester, setSemester] = useState("2nd");
  const [showCreate, setShowCreate] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function checkRole() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user && isEventAdmin(data.user.role)) {
            setCanCreate(true);
          }
        }
      } catch {
        /* not logged in */
      }
    }
    checkRole();
  }, []);

  return (
    <Column>
      <PageHeader
        eyebrow={["GATHER", "BUILD", "SHIP"]}
        title="ACM EVENTS"
        intro="Workshops, competitions, and seminars run by the chapter throughout the academic year. Register early — seats are limited."
        aside={
          canCreate ? (
            <Button variant="outline" onClick={() => setShowCreate(true)}>
              + Create Event
            </Button>
          ) : undefined
        }
      />

      <div style={{ marginTop: `calc(${layout.gap} * 1.5)` }}>
        <EventSelector onChange={setSemester} />
      </div>

      <div style={{ marginTop: layout.gap }}>
        <EventsList key={refreshKey} semester={semester} />
      </div>

      <EventCreationModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </Column>
  );
}
