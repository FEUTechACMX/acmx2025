"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { safeUser } from "@/types/auth";
import { type as t } from "@/styles/design-system";
import { useDS } from "@/components/ds";
import AdminShell, { AdminContent, AdminPageHeader, AdminButton, SectionLabel } from "./AdminShell";

type Row = {
  id: string;
  status: string;
  studentId: string;
  name: string;
  committee: string;
  committeeId: string;
};

const ALL = "__all__";

export default function JoApplicationsManager({ user }: { user: safeUser }) {
  const { c } = useDS();
  const [rows, setRows] = useState<Row[]>([]);
  const [committeeFilter, setCommitteeFilter] = useState(ALL);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/jo-applications");
    const json = await res.json();
    if (json.ok) setRows(json.applications);
  }, []);

  useEffect(() => {
    // Loader setState runs after await; same pattern as DashboardHome.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const committees = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.committeeId, r.committee);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const filtered = useMemo(
    () => (committeeFilter === ALL ? rows : rows.filter((r) => r.committeeId === committeeFilter)),
    [rows, committeeFilter]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; apps: Row[] }>();
    for (const r of filtered) {
      const cur = map.get(r.committeeId) ?? { name: r.committee, apps: [] };
      cur.apps.push(r);
      map.set(r.committeeId, cur);
    }
    return [...map.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [filtered]);

  async function act(id: string, action: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/jo-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminShell user={user} breadcrumb="JO applications">
      <AdminContent>
        <AdminPageHeader
          eyebrow={`${filtered.length} OF ${rows.length} APPLICATIONS`}
          title="Junior Officers"
          subtitle="Filter by target committee. Stage 1 shortlist unlocks the scheduler. Stage 2 accept promotes to Junior Officer and seats them on that committee."
        />

        <div className="flex flex-col" style={{ gap: 8, marginBottom: 24, maxWidth: 420 }}>
          <span style={{ ...t.label, color: c.faint }}>COMMITTEE</span>
          <select
            value={committeeFilter}
            onChange={(e) => setCommitteeFilter(e.target.value)}
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
            <option value={ALL}>All committees</option>
            {committees.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {rows.length === 0 ? (
          <span style={{ ...t.bodySmall, color: c.muted }}>No JO applications yet.</span>
        ) : filtered.length === 0 ? (
          <span style={{ ...t.bodySmall, color: c.muted }}>No applications for that committee.</span>
        ) : (
          <div className="flex flex-col" style={{ gap: 28 }}>
            {grouped.map(([committeeId, group]) => (
              <section key={committeeId} className="flex flex-col" style={{ gap: 0 }}>
                <SectionLabel>
                  {group.name} · {group.apps.length}
                </SectionLabel>
                {group.apps.map((row, i) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center"
                    style={{
                      gap: 12,
                      padding: "12px 0",
                      borderBottom: i === group.apps.length - 1 ? "none" : `1px solid ${c.rule}`,
                    }}
                  >
                    <span className="flex flex-col flex-1 min-w-0">
                      <span style={{ ...t.bodySmall, color: c.text }}>{row.name}</span>
                      <span style={{ ...t.label, fontSize: 9, color: c.faint }}>
                        {row.studentId} · {row.status}
                      </span>
                    </span>
                    <div className="flex flex-wrap" style={{ gap: 6 }}>
                      {row.status === "PENDING" && (
                        <AdminButton
                          variant="ghost"
                          disabled={busy === row.id}
                          onClick={() => void act(row.id, "shortlist")}
                        >
                          Shortlist
                        </AdminButton>
                      )}
                      {row.status === "SHORTLISTED" && (
                        <>
                          <AdminButton disabled={busy === row.id} onClick={() => void act(row.id, "accept")}>
                            Accept
                          </AdminButton>
                          <AdminButton
                            variant="ghost"
                            disabled={busy === row.id}
                            onClick={() => void act(row.id, "waitlist")}
                          >
                            Waitlist
                          </AdminButton>
                          <AdminButton
                            variant="ghost"
                            disabled={busy === row.id}
                            onClick={() => void act(row.id, "reject")}
                          >
                            Reject
                          </AdminButton>
                          <AdminButton
                            variant="ghost"
                            disabled={busy === row.id}
                            onClick={() => void act(row.id, "unshortlist")}
                          >
                            Unshortlist
                          </AdminButton>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </AdminContent>
    </AdminShell>
  );
}
