"use client";

import React from "react";
import { useDS } from "@/components/ds";
import { type as t } from "@/styles/design-system";

/* ── Types shared by the three tabs ─────────────────────────── */

export type AccountDetails = {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  personalEmail: string;
  schoolEmail: string;
  contactNumber: string;
  facebookLink: string;
  discordName: string;
  yearLevel: number;
  degreeProgram: string;
  studentId: string;
  role: string;
  createdAt: string;
};

export type SessionItem = { id: string; expiresAt: string; current: boolean };

export type ProfileData = {
  account: AccountDetails;
  sessions: SessionItem[];
  recentRegistrations: {
    id: string;
    eventName: string;
    venue: string;
    role: string;
    createdAt: string;
  }[];
  upcomingEvents: {
    id: string;
    name: string;
    venue: string;
    startDate: string;
  }[];
  recentTransactions: {
    id: string;
    type: string;
    description: string;
    status: string;
    points: number | null;
    createdAt: string;
  }[];
  stats: { points: number; eventsAttended: number; totalRegistrations: number };
};

/* ── Formatting ─────────────────────────────────────────────── */

export function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ordinalYear(level: number) {
  const suffixes: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };
  return `${suffixes[level] ?? `${level}th`} Year`;
}

/* ── Small building blocks ──────────────────────────────────── */

/** Tracked-caps heading over a hairline — opens every block on the page. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { c } = useDS();
  return (
    <div style={{ marginBottom: "0.25rem" }}>
      <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>{children}</span>
      <div style={{ height: 1, backgroundColor: c.rule, marginTop: "0.55rem" }} />
    </div>
  );
}

/** Number, accent tick, label. The stat rail's single unit. */
export function StatBlock({
  value,
  label,
  loading = false,
}: {
  value: React.ReactNode;
  label: string;
  loading?: boolean;
}) {
  const { c } = useDS();
  return (
    <div className="flex flex-col" style={{ gap: "0.6rem" }}>
      {loading ? (
        <div
          style={{
            height: "clamp(1.75rem, 3.5vw, 2.75rem)",
            width: "3.5rem",
            backgroundColor: c.rule,
            opacity: 0.5,
          }}
        />
      ) : (
        <span
          style={{
            ...t.title,
            fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
            color: c.text,
            lineHeight: 1,
          }}
        >
          {value}
        </span>
      )}
      <div style={{ height: 2, width: 26, backgroundColor: c.accent }} />
      <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

/** Hairline-separated row used by the activity lists and tables. */
export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const { c } = useDS();
  return (
    <div
      className="flex items-center gap-5"
      style={{ padding: "1rem 0", borderBottom: `1px solid ${c.rule}`, ...style }}
    >
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  const { c } = useDS();
  return (
    <div style={{ padding: "2.5rem 0", textAlign: "center" }}>
      <span style={{ ...t.bodySmall, color: c.faint }}>{children}</span>
    </div>
  );
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  const { c } = useDS();
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{ padding: "1.1rem 0", borderBottom: `1px solid ${c.rule}` }}
          aria-hidden="true"
        >
          <div style={{ height: 10, width: "45%", backgroundColor: c.rule, opacity: 0.6 }} />
        </div>
      ))}
    </>
  );
}

/** Panel with a tracked-caps header bar — the side rail's container. */
export function RailPanel({
  title,
  aside,
  children,
  filled = true,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  filled?: boolean;
}) {
  const { c } = useDS();
  return (
    <section
      style={{
        border: `1px solid ${c.rule}`,
        backgroundColor: filled ? c.panel : "transparent",
      }}
    >
      <header
        className="flex items-center justify-between gap-3"
        style={{ padding: "0.85rem 1.15rem", borderBottom: `1px solid ${c.rule}` }}
      >
        <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>{title}</span>
        {aside}
      </header>
      {children}
    </section>
  );
}
