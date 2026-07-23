"use client";

import React from "react";
import { type as t } from "@/styles/design-system";
import { Panel, useDS } from "@/components/ds";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = {
  /** Dates (any year/month) used to flag "key date" chips for the current month. */
  keyDates?: Date[];
  onOpen?: () => void;
};

/**
 * Mini current-month calendar. Today gets an accent ring; key dates (derived
 * from upcoming events) get a filled accent chip. The whole tile opens the
 * full school calendar.
 */
export default function CalendarCard({ keyDates = [], onOpen }: Props) {
  const { c } = useDS();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const keySet = new Set(
    keyDates
      .filter((d) => d.getFullYear() === year && d.getMonth() === month)
      .map((d) => d.getDate())
  );

  // Build a flat list of cells (null for leading blanks).
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Panel interactive onClick={onOpen} padded={false} style={{ padding: "clamp(0.85rem, 1.5vh, 1.15rem)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(0.5rem, 1.2vh, 0.85rem)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>
              School Calendar
            </span>
            <span style={{ ...t.subheading, color: c.text }}>
              {MONTHS[month]} {year}
            </span>
          </div>
          <CalendarIcon color={c.accent} />
        </div>

        {/* Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {WEEKDAYS.map((d, i) => (
              <span
                key={i}
                style={{
                  ...t.label,
                  fontSize: "0.625rem",
                  color: c.faint,
                  textAlign: "center",
                  padding: "0.25rem 0",
                }}
              >
                {d}
              </span>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
            {cells.map((day, i) => {
              if (day === null) return <span key={i} />;
              const isToday = day === today;
              const isKey = keySet.has(day);
              return (
                <span
                  key={i}
                  style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 24 }}
                >
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      backgroundColor: isKey ? c.accent : "transparent",
                      border: isToday ? `1.5px solid ${c.accent}` : "1.5px solid transparent",
                      ...t.mono,
                      fontSize: "0.75rem",
                      fontWeight: isToday || isKey ? 600 : 400,
                      color: isKey ? "#ffffff" : isToday ? c.accent : c.muted,
                    }}
                  >
                    {day}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Footer / legend */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "clamp(0.5rem, 1vh, 0.75rem)",
            borderTop: `1px solid ${c.rule}`,
          }}
        >
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Legend swatch={<span style={{ width: 9, height: 9, borderRadius: "50%", background: c.accent }} />} label="Key date" />
            <Legend
              swatch={<span style={{ width: 9, height: 9, borderRadius: "50%", border: `1.5px solid ${c.accent}` }} />}
              label="Today"
            />
          </div>
          <span style={{ ...t.bodySmall, color: c.accent }}>Open calendar &rarr;</span>
        </div>
      </div>
    </Panel>
  );
}

function Legend({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  const { c } = useDS();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
      {swatch}
      <span style={{ ...t.bodySmall, color: c.muted }}>{label}</span>
    </span>
  );
}

function CalendarIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6}>
      <rect x="3" y="4" width="18" height="18" rx="1" />
      <path strokeLinecap="round" d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  );
}
