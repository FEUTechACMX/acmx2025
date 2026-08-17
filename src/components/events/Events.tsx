"use client";

import React, { useState } from "react";
import EventsList from "./EventsList";
import EventSelector from "./EventSelector";
import EventCreationModal from "./EventCreationModal";
import { isEventAdmin } from "@/types/auth";
import { useSession } from "@/components/sessionClient";
import { Column, PageHeader, Button } from "@/components/ds";
import { layout } from "@/styles/design-system";

export default function Events() {
  const [semester, setSemester] = useState("3rd");
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useSession();

  // Derived, not stored: this used to be state filled in by its own /api/me
  // request, one of three on this page for the same session.
  const canCreate = !!user && isEventAdmin(user.role);

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
