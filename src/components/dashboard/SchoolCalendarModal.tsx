"use client";

import React, { useEffect } from "react";
import { type as t } from "@/styles/design-system";
import { useDS, Eyebrow } from "@/components/ds";

export type CalendarEntry = {
  label: string;
  date: Date;
  kind?: "event" | "holiday" | "deadline";
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Optional real entries to seed the list — full details wired in later. */
  entries?: CalendarEntry[];
};

/**
 * Themed school-calendar dialog. Intentionally a light shell for now — the
 * real important dates get uploaded later; this surfaces whatever entries are
 * passed and otherwise shows an empty state.
 */
export default function SchoolCalendarModal({ isOpen, onClose, entries = [] }: Props) {
  const { c } = useDS();

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        padding: "1.5rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "85vh",
          overflowY: "auto",
          backgroundColor: c.surface,
          border: `1px solid ${c.ruleStrong}`,
          padding: "clamp(1.5rem, 3vw, 2.5rem)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <span style={{ ...t.eyebrow, color: c.accent, display: "block", marginBottom: "0.4rem" }}>
              ACM
            </span>
            <h2 style={{ ...t.title, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: c.text, margin: 0 }}>
              School Calendar
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: `1px solid ${c.rule}`,
              color: c.muted,
              width: 36,
              height: 36,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="square" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <Eyebrow words="Important Dates" />
        </div>

        {sorted.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {sorted.map((entry, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.85rem 0",
                  borderBottom: `1px solid ${c.rule}`,
                }}
              >
                <span style={{ ...t.body, color: c.text }}>{entry.label}</span>
                <span style={{ ...t.mono, color: c.muted, whiteSpace: "nowrap" }}>{fmt(entry.date)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "2.5rem 0", textAlign: "center" }}>
            <p style={{ ...t.body, color: c.muted, margin: 0 }}>
              Important dates for the term will be posted here soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
