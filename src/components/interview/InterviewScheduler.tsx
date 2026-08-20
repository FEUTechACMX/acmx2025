"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Surface, Column, PageHeader, Panel, Button, Badge, Body, useDS } from "@/components/ds";
import { layout, type as t } from "@/styles/design-system";
import { formatManila } from "@/lib/timezone";

type Slot = {
  id: string;
  startsAt: string;
  durationMinutes: number;
  location: string;
  remaining: number;
  interviewer: string | null;
};

export default function InterviewScheduler() {
  const { c } = useDS();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookedSlotId, setBooked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/interview/slots");
    if (res.status === 404) {
      setError("Not found.");
      return;
    }
    const json = await res.json();
    if (json.ok) {
      setSlots(json.slots);
      setBooked(json.bookedSlotId);
    }
  }, []);

  useEffect(() => {
    // Loader setState runs after await; same pattern as DashboardHome.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function book(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/interview/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not book.");
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    setBusy("cancel");
    setError(null);
    try {
      const res = await fetch("/api/interview/cancel", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not cancel.");
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Surface corners="top-left">
      <Column>
        <PageHeader
          eyebrow={["INTERVIEW"]}
          title="PICK A SLOT"
          intro={
            <Body>
              One slot per applicant. You can cancel until 24 hours before the start.
            </Body>
          }
        />
        <div className="flex flex-col" style={{ gap: layout.gapTight, marginTop: layout.gap }}>
          {slots.map((slot) => {
            const mine = bookedSlotId === slot.id;
            const full = slot.remaining <= 0 && !mine;
            return (
              <Panel key={slot.id} interactive={!full}>
                <div className="flex flex-wrap items-center justify-between" style={{ gap: "1rem" }}>
                  <div className="flex flex-col" style={{ gap: 4 }}>
                    <span style={{ ...t.body, color: c.text }}>{formatManila(slot.startsAt)}</span>
                    <span style={{ ...t.bodySmall, color: c.muted }}>
                      {slot.location}
                      {slot.interviewer ? ` · ${slot.interviewer}` : ""} · {slot.remaining} open
                    </span>
                  </div>
                  {mine ? (
                    <div className="flex items-center" style={{ gap: 8 }}>
                      <Badge tone="accent">Booked</Badge>
                      <Button variant="ghost" disabled={busy !== null} onClick={() => void cancel()}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      disabled={full || busy !== null || !!bookedSlotId}
                      onClick={() => void book(slot.id)}
                    >
                      {full ? "Full" : "Book"}
                    </Button>
                  )}
                </div>
              </Panel>
            );
          })}
          {slots.length === 0 && <Body small>No open slots yet.</Body>}
          {error && (
            <p role="alert" style={{ ...t.bodySmall, color: c.danger }}>
              {error}
            </p>
          )}
        </div>
      </Column>
    </Surface>
  );
}
