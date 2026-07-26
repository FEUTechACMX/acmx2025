"use client";

import React, { useState } from "react";
import { useDS, Button, Badge } from "@/components/ds";
import { type as t } from "@/styles/design-system";
import { SectionLabel, Row, EmptyState, RailPanel, formatDate, type SessionItem } from "./shared";

export default function SecurityTab({
  sessions,
  loading,
  onChangePassword,
  onSessionsChanged,
}: {
  sessions: SessionItem[];
  loading: boolean;
  onChangePassword: () => void;
  onSessionsChanged: () => void;
}) {
  const { c } = useDS();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "positive" | "danger"; text: string } | null>(null);

  const revoke = async (body: { id?: string; all?: boolean }, key: string) => {
    setBusy(key);
    setNotice(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setNotice({ tone: "danger", text: data.error ?? "Couldn't end that session." });
        return;
      }

      setNotice({ tone: "positive", text: data.message });
      onSessionsChanged();
    } catch {
      setNotice({ tone: "danger", text: "Couldn't reach the server." });
    } finally {
      setBusy(null);
    }
  };

  const others = sessions.filter((s) => !s.current);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]" style={{ gap: "2.25rem" }}>
      <div className="flex flex-col" style={{ gap: "2.75rem" }}>
        <section>
          <SectionLabel>Credentials</SectionLabel>
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ padding: "1.35rem 0", borderBottom: `1px solid ${c.rule}` }}
          >
            <div className="flex flex-col" style={{ gap: "0.35rem" }}>
              <span style={{ ...t.body, color: c.text }}>Password</span>
              <span style={{ ...t.bodySmall, color: c.faint }}>
                Changing it signs out every other device.
              </span>
            </div>
            <Button onClick={onChangePassword} style={{ padding: "0.75rem 1.5rem" }}>
              Change password
            </Button>
          </div>
        </section>

        <section>
          <SectionLabel>Active sessions</SectionLabel>

          {notice && (
            <p
              role="status"
              style={{
                ...t.bodySmall,
                color: notice.tone === "positive" ? c.positive : c.danger,
                padding: "0.75rem 0",
              }}
            >
              {notice.text}
            </p>
          )}

          {loading ? (
            <EmptyState>Loading sessions…</EmptyState>
          ) : sessions.length === 0 ? (
            <EmptyState>No active sessions.</EmptyState>
          ) : (
            sessions.map((s) => (
              <Row key={s.id}>
                <div className="flex flex-col min-w-0 flex-1" style={{ gap: "0.3rem" }}>
                  {/* The Session model records only id and expiry — no user
                      agent, no IP. Showing the id beats inventing a device
                      name we never captured. */}
                  <span style={{ ...t.body, color: c.text }}>
                    Session {s.id.slice(0, 8)}…
                  </span>
                  <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>
                    Expires {formatDate(s.expiresAt)}
                  </span>
                </div>
                {s.current ? (
                  <Badge tone="accent">This device</Badge>
                ) : (
                  <button
                    onClick={() => revoke({ id: s.id }, s.id)}
                    disabled={busy === s.id}
                    style={{
                      ...t.label,
                      textTransform: "uppercase",
                      background: "transparent",
                      border: "none",
                      color: c.danger,
                      cursor: busy === s.id ? "wait" : "pointer",
                    }}
                  >
                    {busy === s.id ? "Ending…" : "Revoke"}
                  </button>
                )}
              </Row>
            ))
          )}
        </section>
      </div>

      <aside className="flex flex-col" style={{ gap: "1.75rem" }}>
        <RailPanel title="Sign out everywhere" filled={false}>
          <div className="flex flex-col" style={{ padding: "1.15rem", gap: "1rem" }}>
            <p style={{ ...t.bodySmall, color: c.muted, margin: 0 }}>
              Ends every session except this one. Use it if you signed in on a shared machine.
            </p>
            <Button
              variant="ghost"
              onClick={() => revoke({ all: true }, "all")}
              disabled={busy === "all" || others.length === 0}
              style={{ padding: "0.7rem 1.25rem" }}
            >
              {busy === "all"
                ? "Signing out…"
                : others.length === 0
                  ? "No other sessions"
                  : `Sign out ${others.length} other${others.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </RailPanel>
      </aside>
    </div>
  );
}
