"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { safeUser } from "@/types/auth";
import { type as t } from "@/styles/design-system";
import { useDS, Modal, Field } from "@/components/ds";
import AdminShell, { AdminContent, AdminPageHeader, AdminButton, SectionLabel } from "./AdminShell";

type MemberRow = {
  studentId: string;
  name: string;
  schoolEmail: string;
  membershipStatus: string;
  createdAsPending: boolean;
  isPayer: boolean;
};

type ApplicationRow = {
  id: string;
  createdAt: string;
  bundle: string;
  kind: string;
  status: string;
  rejectionReason: string | null;
  payer: { studentId: string; name: string; schoolEmail: string };
  members: MemberRow[];
};

export default function MembershipManager({ user }: { user: safeUser }) {
  const { c } = useDS();
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [open, setOpen] = useState<ApplicationRow | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const q = filter === "PENDING" ? "?status=PENDING" : "";
    const res = await fetch(`/api/admin/membership${q}`);
    const json = await res.json();
    if (json.ok) setRows(json.applications);
  }, [filter]);

  useEffect(() => {
    // Loader setState runs after await; same pattern as DashboardHome.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function openDetail(row: ApplicationRow) {
    setOpen(row);
    setReason("");
    setProofUrl(null);
    setError(null);
    const res = await fetch(`/api/admin/membership/${row.id}/proof`);
    const json = await res.json().catch(() => ({}));
    if (json.ok) setProofUrl(json.url);
  }

  async function decide(action: "approve" | "reject") {
    if (!open) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/membership/${open.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not update.");
        return;
      }
      setOpen(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  const head = { ...t.label, fontSize: 10, color: c.faint } as React.CSSProperties;

  return (
    <AdminShell user={user} breadcrumb="Membership">
      <AdminContent>
        <AdminPageHeader
          eyebrow={`${rows.length} APPLICATIONS`}
          title="Membership"
          subtitle="Proof-of-payment inbox. Approving a bundle only activates people this application created as pending — existing members are never locked out."
        />

        <div className="flex items-center" style={{ gap: 12, marginBottom: 16 }}>
          <SectionLabel>{filter === "PENDING" ? "AWAITING DECISION" : "ALL"}</SectionLabel>
          <AdminButton variant="ghost" onClick={() => setFilter((f) => (f === "PENDING" ? "ALL" : "PENDING"))}>
            {filter === "PENDING" ? "Show all" : "Show pending"}
          </AdminButton>
        </div>

        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 640 }}>
            <div className="flex items-center" style={{ paddingBottom: 8, borderBottom: `1px solid ${c.rule}` }}>
              <span style={{ ...head, flex: 1 }}>Payer</span>
              <span style={{ ...head, width: 110 }}>Bundle</span>
              <span style={{ ...head, width: 90 }}>Kind</span>
              <span style={{ ...head, width: 90 }}>Status</span>
              <span style={{ ...head, width: 80 }} />
            </div>
            {rows.length === 0 ? (
              <span style={{ ...t.bodySmall, color: c.muted, display: "block", padding: "12px 0" }}>
                Nothing in this list.
              </span>
            ) : (
              rows.map((row, i) => (
                <div
                  key={row.id}
                  className="flex items-center"
                  style={{
                    padding: "11px 0",
                    borderBottom: i === rows.length - 1 ? "none" : `1px solid ${c.rule}`,
                  }}
                >
                  <span className="flex flex-col flex-1 min-w-0" style={{ gap: 2 }}>
                    <span style={{ ...t.bodySmall, color: c.text }}>{row.payer.name}</span>
                    <span style={{ ...t.label, fontSize: 9, color: c.faint }}>{row.payer.studentId}</span>
                  </span>
                  <span style={{ ...t.bodySmall, color: c.muted, width: 110 }}>{row.bundle}</span>
                  <span style={{ ...t.bodySmall, color: c.muted, width: 90 }}>{row.kind}</span>
                  <span style={{ ...t.bodySmall, color: c.text, width: 90 }}>{row.status}</span>
                  <span style={{ width: 80 }}>
                    <AdminButton variant="ghost" onClick={() => void openDetail(row)}>
                      Open
                    </AdminButton>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </AdminContent>

      {open && (
        <Modal
          open
          onClose={() => setOpen(null)}
          title={`${open.payer.name} · ${open.bundle}`}
        >
          <div className="flex flex-col" style={{ gap: 14 }}>
            <span style={{ ...t.bodySmall, color: c.muted }}>
              {open.kind} · {open.members.length} {open.members.length === 1 ? "person" : "people"}
            </span>
            {open.members.map((m) => (
              <div key={m.studentId} className="flex flex-col" style={{ gap: 2 }}>
                <span style={{ ...t.bodySmall, color: c.text }}>
                  {m.name} {m.isPayer ? "(payer)" : ""}
                </span>
                <span style={{ ...t.label, fontSize: 9, color: c.faint }}>
                  {m.studentId} · {m.membershipStatus}
                  {m.createdAsPending ? "" : " · existing account"}
                </span>
              </div>
            ))}
            {proofUrl ? (
              // Signed URL from the private bucket, short-lived.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={proofUrl} alt="Proof of payment" style={{ maxWidth: "100%", border: `1px solid ${c.rule}` }} />
            ) : (
              <span style={{ ...t.bodySmall, color: c.muted }}>Loading proof…</span>
            )}
            {open.status === "PENDING" && (
              <>
                <Field
                  id="rejection-reason"
                  label="Rejection reason"
                  variant="boxed"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  hint="Required only when rejecting."
                />
                {error && (
                  <span role="alert" style={{ ...t.bodySmall, color: c.danger }}>
                    {error}
                  </span>
                )}
                <div className="flex" style={{ gap: 8 }}>
                  <AdminButton disabled={busy} onClick={() => void decide("approve")}>
                    Approve
                  </AdminButton>
                  <AdminButton disabled={busy} variant="ghost" onClick={() => void decide("reject")}>
                    Reject
                  </AdminButton>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
