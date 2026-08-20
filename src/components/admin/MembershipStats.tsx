"use client";

import React, { useEffect, useState } from "react";
import type { safeUser } from "@/types/auth";
import { useDS } from "@/components/ds";
import { type as t } from "@/styles/design-system";
import AdminShell, { AdminContent, AdminPageHeader } from "./AdminShell";

type DayRow = {
  date: string;
  applications: number;
  members: number;
  pending: number;
  approved: number;
  rejected: number;
};

type StatsPayload = {
  ok: boolean;
  window: { open: boolean; start?: string | null; end?: string | null; phase?: string };
  days: DayRow[];
  totals: DayRow;
  error?: string;
};

export default function MembershipStats({ user }: { user: safeUser }) {
  const { c } = useDS();
  const [data, setData] = useState<StatsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/membership/stats");
      const json = (await res.json().catch(() => ({}))) as StatsPayload;
      if (!res.ok) {
        setError(json.error ?? "Could not load stats.");
        return;
      }
      setData(json);
    })();
  }, []);

  return (
    <AdminShell user={user} breadcrumb="Membership · Stats">
      <AdminContent>
        <AdminPageHeader
          eyebrow="MEMBERSHIP"
          title="Drive stats"
          subtitle="Daily new-membership applications during the drive."
        />

        {error && (
          <p style={{ ...t.bodySmall, color: c.danger, margin: "0 0 1rem" }}>{error}</p>
        )}

        {data && (
          <div className="flex flex-col" style={{ gap: 20 }}>
            <div
              className="flex flex-wrap"
              style={{ gap: 12, padding: 16, backgroundColor: c.panel, border: `1px solid ${c.rule}` }}
            >
              <Stat label="Applications" value={data.totals.applications} />
              <Stat label="Members in apps" value={data.totals.members} />
              <Stat label="Pending" value={data.totals.pending} />
              <Stat label="Approved" value={data.totals.approved} />
              <Stat label="Rejected" value={data.totals.rejected} />
            </div>

            <div style={{ backgroundColor: c.panel, border: `1px solid ${c.rule}` }}>
              <div
                className="grid"
                style={{
                  gridTemplateColumns: "1.2fr repeat(5, 1fr)",
                  gap: 0,
                  padding: "12px 16px",
                  borderBottom: `1px solid ${c.rule}`,
                }}
              >
                {["Date", "Apps", "Members", "Pending", "Approved", "Rejected"].map((h) => (
                  <span key={h} style={{ ...t.label, color: c.faint }}>
                    {h}
                  </span>
                ))}
              </div>
              {data.days.length === 0 ? (
                <div style={{ padding: 20 }}>
                  <span style={{ ...t.bodySmall, color: c.muted }}>No applications yet.</span>
                </div>
              ) : (
                data.days.map((row) => (
                  <div
                    key={row.date}
                    className="grid"
                    style={{
                      gridTemplateColumns: "1.2fr repeat(5, 1fr)",
                      padding: "12px 16px",
                      borderBottom: `1px solid ${c.rule}`,
                    }}
                  >
                    <span style={{ ...t.bodySmall, color: c.text }}>{row.date}</span>
                    <span style={{ ...t.mono, color: c.text }}>{row.applications}</span>
                    <span style={{ ...t.mono, color: c.text }}>{row.members}</span>
                    <span style={{ ...t.mono, color: c.muted }}>{row.pending}</span>
                    <span style={{ ...t.mono, color: c.text }}>{row.approved}</span>
                    <span style={{ ...t.mono, color: c.muted }}>{row.rejected}</span>
                  </div>
                ))
              )}
            </div>

            {data.window && (
              <p style={{ ...t.bodySmall, color: c.muted, margin: 0 }}>
                Window:{" "}
                {data.window.open
                  ? `open (${data.window.start} → ${data.window.end})`
                  : data.window.phase === "unconfigured"
                    ? "env not configured"
                    : `closed (${data.window.phase}; ${data.window.start} → ${data.window.end})`}
              </p>
            )}
          </div>
        )}
      </AdminContent>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const { c } = useDS();
  return (
    <div className="flex flex-col" style={{ gap: 4, minWidth: 110 }}>
      <span style={{ ...t.label, color: c.faint }}>{label}</span>
      <span style={{ ...t.heading, color: c.text, fontSize: "1.5rem" }}>{value}</span>
    </div>
  );
}
