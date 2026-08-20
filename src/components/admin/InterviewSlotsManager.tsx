"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { safeUser } from "@/types/auth";
import { type as t } from "@/styles/design-system";
import { Field, Body, useDS } from "@/components/ds";
import AdminShell, { AdminContent, AdminPageHeader, AdminButton, SectionLabel } from "./AdminShell";
import { formatManila } from "@/lib/timezone";

type Slot = {
  id: string;
  startsAt: string;
  durationMinutes: number;
  location: string;
  capacity: number;
  booked: number;
  interviewer: string | null;
};

type OfficerOption = { userId: string; name: string; roleTitle: string };

export default function InterviewSlotsManager({ user }: { user: safeUser }) {
  const { c } = useDS();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [officers, setOfficers] = useState<OfficerOption[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [durationMinutes, setDuration] = useState("30");
  const [location, setLocation] = useState("");
  const [interviewerUserId, setInterviewer] = useState("");
  const [capacity, setCapacity] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [slotsRes, officersRes] = await Promise.all([
      fetch("/api/admin/interview-slots"),
      fetch("/api/admin/officers"),
    ]);
    const slotsJson = await slotsRes.json().catch(() => ({}));
    const officersJson = await officersRes.json().catch(() => ({}));
    if (slotsJson.ok) setSlots(slotsJson.slots);
    if (officersJson.ok) {
      setOfficers(
        (officersJson.officers as OfficerOption[]).map((o) => ({
          userId: o.userId,
          name: o.name,
          roleTitle: o.roleTitle,
        }))
      );
    }
  }, []);

  useEffect(() => {
    // Loader setState runs after await; same pattern as DashboardHome.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/interview-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt,
          location,
          capacity: Number(capacity),
          durationMinutes: Number(durationMinutes),
          interviewerUserId: interviewerUserId || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not create the slot.");
        return;
      }
      setStartsAt("");
      setLocation("");
      setCapacity("1");
      setDuration("30");
      setInterviewer("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/admin/interview-slots/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <AdminShell user={user} breadcrumb="JO Interview Slots">
      <AdminContent>
        <AdminPageHeader
          eyebrow={`${slots.length} SLOTS`}
          title="JO Interview Slots"
          subtitle="Shortlisted Junior Officer applicants book one of these windows. Each slot shows booked vs. available seats."
        />

        <div
          className="flex flex-col"
          style={{
            gap: 10,
            padding: "14px 16px",
            marginBottom: 24,
            backgroundColor: c.accentWash,
            border: `1px solid ${c.rule}`,
            borderLeft: `3px solid ${c.accent}`,
            maxWidth: 560,
          }}
        >
          <span style={{ ...t.label, color: c.faint }}>HOW THIS WORKS</span>
          <Body small>
            After an officer shortlists a JO application, that applicant can open the scheduler
            and book an open seat. Capacity is enforced server-side so two people cannot take the
            last seat at once.
          </Body>
        </div>

        <div
          className="flex flex-col"
          style={{
            gap: 16,
            maxWidth: 560,
            marginBottom: 32,
            padding: 20,
            backgroundColor: c.panel,
            border: `1px solid ${c.rule}`,
          }}
        >
          <SectionLabel>Add a slot</SectionLabel>
          <Field
            id="slot-start"
            label="Date & time"
            variant="boxed"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            hint="Browser local time — shown to applicants in Manila format."
          />
          <Field
            id="slot-duration"
            label="Duration (minutes)"
            variant="boxed"
            type="number"
            min={10}
            max={180}
            value={durationMinutes}
            onChange={(e) => setDuration(e.target.value)}
          />
          <Field
            id="slot-loc"
            label="Location"
            variant="boxed"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. NGE 301 / Zoom link"
          />
          <div className="flex flex-col" style={{ gap: "0.5rem" }}>
            <label htmlFor="slot-interviewer" style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>
              Interviewer
            </label>
            <select
              id="slot-interviewer"
              value={interviewerUserId}
              onChange={(e) => setInterviewer(e.target.value)}
              style={{
                ...t.body,
                width: "100%",
                padding: "0.75rem 0.85rem",
                background: "transparent",
                color: c.text,
                border: `1px solid ${c.rule}`,
                borderRadius: 0,
                outline: "none",
              }}
            >
              <option value="">None assigned</option>
              {officers.map((o) => (
                <option key={o.userId} value={o.userId}>
                  {o.name} · {o.roleTitle}
                </option>
              ))}
            </select>
            <span style={{ ...t.bodySmall, color: c.faint }}>
              One interviewer per slot (board officers). Multi-interviewer support is post-demo.
            </span>
          </div>
          <Field
            id="slot-cap"
            label="Seats (capacity)"
            variant="boxed"
            type="number"
            min={1}
            max={20}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            hint="How many shortlisted applicants can book this window."
          />
          {error && (
            <p role="alert" style={{ ...t.bodySmall, color: c.danger, margin: 0 }}>
              {error}
            </p>
          )}
          <AdminButton disabled={busy || !startsAt || !location.trim()} onClick={() => void create()}>
            {busy ? "Saving…" : "Add interview slot"}
          </AdminButton>
        </div>

        <SectionLabel>Scheduled slots</SectionLabel>
        {slots.length === 0 ? (
          <span style={{ ...t.bodySmall, color: c.muted }}>No interview slots yet.</span>
        ) : (
          <div className="flex flex-col" style={{ gap: 0 }}>
            {slots.map((s, i) => {
              const available = Math.max(0, s.capacity - s.booked);
              return (
                <div
                  key={s.id}
                  className="flex flex-wrap items-center justify-between"
                  style={{
                    gap: 12,
                    padding: "14px 0",
                    borderBottom: i === slots.length - 1 ? "none" : `1px solid ${c.rule}`,
                  }}
                >
                  <div className="flex flex-col min-w-0" style={{ gap: 4 }}>
                    <span style={{ ...t.bodySmall, color: c.text }}>
                      {formatManila(s.startsAt)} · {s.durationMinutes} min
                    </span>
                    <span style={{ ...t.label, fontSize: 9, color: c.faint }}>
                      {s.location}
                      {s.interviewer ? ` · Interviewer: ${s.interviewer}` : " · No interviewer set"}
                    </span>
                    <span style={{ ...t.bodySmall, color: available === 0 ? c.muted : c.text }}>
                      Booked {s.booked} / {s.capacity} · {available} available
                    </span>
                  </div>
                  <AdminButton variant="ghost" onClick={() => void remove(s.id)}>
                    Delete
                  </AdminButton>
                </div>
              );
            })}
          </div>
        )}
      </AdminContent>
    </AdminShell>
  );
}
