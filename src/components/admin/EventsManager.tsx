"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { safeUser } from "@/types/auth";
import { useDS } from "@/components/ds";
import { type as t, font, motion } from "@/styles/design-system";
import AdminShell, { AdminContent, AdminPageHeader, AdminButton } from "./AdminShell";
import Icon from "./icons";

type EventRow = {
  eventId: string;
  name: string;
  type: string[];
  startDate: string;
  image: string | null;
  registered: number;
  attended: number;
  status: "UPCOMING" | "ONGOING" | "FINISHED";
};

type Filter = "ALL" | EventRow["status"];

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "ONGOING", label: "Ongoing" },
  { key: "FINISHED", label: "Finished" },
];

function statusColor(status: string, c: ReturnType<typeof useDS>["c"]) {
  if (status === "UPCOMING" || status === "ONGOING") return c.accent;
  if (status === "FINISHED") return c.muted;
  return c.faint;
}

const titleCase = (s: string) => (s ? s[0] + s.slice(1).toLowerCase() : "");

/**
 * Admin → Events: the list, and only the list.
 *
 * Picking an event opens /admin/events/[eventId] — its own page. Details, the
 * cover and an attendance sheet that runs to hundreds of rows never sat well in
 * a column beside the table.
 */
export default function EventsManager({ user }: { user: safeUser }) {
  const { c } = useDS();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/events")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setEvents(d.events ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((e) => filter === "ALL" || e.status === filter)
      .filter(
        (e) =>
          !q ||
          e.name.toLowerCase().includes(q) ||
          e.type.some((x) => x.toLowerCase().includes(q))
      );
  }, [events, filter, query]);

  return (
    <AdminShell
      user={user}
      breadcrumb="Events"
      searchPlaceholder="Search events…"
      searchValue={query}
      onSearchChange={setQuery}
    >
      <AdminContent>
        <AdminPageHeader
          eyebrow={`MANAGE · ${events.length} EVENTS`}
          title="Events"
          subtitle="Pick an event to open it — details, cover image, registrations and attendance all live on its own page."
          actions={
            <AdminButton
              icon="plus"
              onClick={() => alert("Event creation lives in the existing create flow.")}
            >
              NEW EVENT
            </AdminButton>
          }
        />

        <div className="flex flex-wrap items-center justify-between" style={{ gap: 12 }}>
          <div className="flex flex-wrap items-center" style={{ gap: 9 }}>
            {FILTERS.map((f) => {
              const on = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    ...t.label,
                    fontSize: 10,
                    padding: "8px 13px",
                    cursor: "pointer",
                    color: on ? "#ffffff" : c.muted,
                    backgroundColor: on ? c.accent : "transparent",
                    border: `1px solid ${on ? c.accent : c.rule}`,
                    transition: `background-color ${motion.fast}`,
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          {(query.trim() || filter !== "ALL") && (
            <span style={{ ...t.bodySmall, fontSize: 11, color: c.faint }}>
              {shown.length} of {events.length} events
            </span>
          )}
        </div>

        <div style={{ backgroundColor: c.panel, border: `1px solid ${c.rule}` }}>
          <div
            className="hidden sm:flex items-center"
            style={{ padding: "14px 20px", borderBottom: `1px solid ${c.rule}` }}
          >
            <span className="flex-1" style={{ ...t.label, fontSize: 10, color: c.faint }}>EVENT</span>
            <span style={{ width: 80, ...t.label, fontSize: 10, color: c.faint }}>REG.</span>
            <span style={{ width: 80, ...t.label, fontSize: 10, color: c.faint }}>ATT.</span>
            <span style={{ width: 110, ...t.label, fontSize: 10, color: c.faint }}>STATUS</span>
            <span style={{ width: 84 }} />
          </div>

          {loading && (
            <div style={{ padding: "24px 20px" }}>
              <span style={{ ...t.bodySmall, color: c.muted }}>Loading events…</span>
            </div>
          )}

          {!loading && shown.length === 0 && (
            <div style={{ padding: "24px 20px" }}>
              <span style={{ ...t.bodySmall, color: c.muted }}>
                {events.length === 0 ? "No events yet." : "No event matches this filter."}
              </span>
            </div>
          )}

          {shown.map((e, i) => {
            const sc = statusColor(e.status, c);
            return (
              <Link
                key={e.eventId}
                href={`/admin/events/${e.eventId}`}
                className="flex flex-col sm:flex-row sm:items-center w-full text-left"
                style={{
                  gap: 10,
                  padding: "14px 20px",
                  textDecoration: "none",
                  borderBottom: i < shown.length - 1 ? `1px solid ${c.rule}` : "none",
                }}
              >
                <div className="flex flex-col flex-1 min-w-0" style={{ gap: 3 }}>
                  <span
                    style={{
                      ...t.bodySmall,
                      fontWeight: 600,
                      color: c.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.name}
                  </span>
                  <span style={{ ...t.label, fontSize: 10, color: c.faint }}>
                    {new Date(e.startDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {e.type[0] ? ` · ${e.type[0]}` : ""}
                  </span>
                </div>
                <span style={{ width: 80, fontFamily: font.display, fontSize: 15, color: c.text }}>
                  {e.registered}
                </span>
                <span
                  style={{
                    width: 80,
                    fontFamily: font.display,
                    fontSize: 15,
                    color: e.attended ? c.text : c.faint,
                  }}
                >
                  {e.attended || "—"}
                </span>
                <span style={{ width: 110 }}>
                  <span
                    style={{
                      ...t.label,
                      fontSize: 10,
                      color: sc,
                      padding: "5px 10px",
                      border: `1px solid ${sc}`,
                    }}
                  >
                    {titleCase(e.status)}
                  </span>
                </span>
                <span
                  className="flex items-center"
                  style={{
                    ...t.label,
                    fontSize: 10,
                    gap: 6,
                    width: 84,
                    padding: "7px 11px",
                    color: c.text,
                    border: `1px solid ${c.rule}`,
                  }}
                >
                  <Icon name="pencil" size={12} />
                  Edit
                </span>
              </Link>
            );
          })}
        </div>
      </AdminContent>
    </AdminShell>
  );
}
