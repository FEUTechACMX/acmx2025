"use client";

import React from "react";
import { useDS, Badge } from "@/components/ds";
import { type as t, motion } from "@/styles/design-system";
import {
  SectionLabel,
  Row,
  EmptyState,
  LoadingRows,
  RailPanel,
  formatDate,
  type ProfileData,
} from "./shared";

const ACTION_ROWS = [
  { key: "account", label: "Edit account", hot: false },
  { key: "password", label: "Change password", hot: true },
  { key: "logout", label: "Log out", hot: false },
] as const;

export default function OverviewTab({
  data,
  loading,
  onChangePassword,
  onEditAccount,
  onLogOut,
}: {
  data: ProfileData | null;
  loading: boolean;
  onChangePassword: () => void;
  onEditAccount: () => void;
  onLogOut: () => void;
}) {
  const { c } = useDS();

  const run = (key: (typeof ACTION_ROWS)[number]["key"]) => {
    if (key === "password") onChangePassword();
    if (key === "account") onEditAccount();
    if (key === "logout") onLogOut();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]" style={{ gap: "2.25rem" }}>
      <div className="flex flex-col" style={{ gap: "2.75rem" }}>
        <section>
          <SectionLabel>Upcoming events</SectionLabel>
          {loading ? (
            <LoadingRows />
          ) : data?.upcomingEvents.length ? (
            data.upcomingEvents.map((e) => {
              const date = new Date(e.startDate);
              return (
                <Row key={e.id}>
                  <div className="flex flex-col shrink-0" style={{ width: "2.75rem", gap: "0.15rem" }}>
                    <span style={{ ...t.subheading, fontSize: "1.35rem", color: c.text }}>
                      {String(date.getDate()).padStart(2, "0")}
                    </span>
                    <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>
                      {date.toLocaleDateString("en-PH", { month: "short" })}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1" style={{ gap: "0.3rem" }}>
                    <span style={{ ...t.body, color: c.text }}>{e.name}</span>
                    <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>
                      {e.venue}
                    </span>
                  </div>
                </Row>
              );
            })
          ) : (
            <EmptyState>No upcoming events.</EmptyState>
          )}
        </section>

        <section>
          <SectionLabel>Recent registrations</SectionLabel>
          {loading ? (
            <LoadingRows />
          ) : data?.recentRegistrations.length ? (
            data.recentRegistrations.map((r) => (
              <Row key={r.id}>
                <span className="flex-1 min-w-0" style={{ ...t.body, color: c.text }}>
                  {r.eventName}
                </span>
                <span className="shrink-0" style={{ ...t.mono, color: c.muted }}>
                  {r.role === "MEMBER" ? "Member" : "Non-member"} · {formatDate(r.createdAt)}
                </span>
              </Row>
            ))
          ) : (
            <EmptyState>No registrations yet.</EmptyState>
          )}
        </section>

        <section>
          <SectionLabel>Point ledger</SectionLabel>
          {loading ? (
            <LoadingRows rows={4} />
          ) : data?.recentTransactions.length ? (
            data.recentTransactions.map((tx) => (
              <Row key={tx.id}>
                <span
                  className="shrink-0 hidden sm:block"
                  style={{ ...t.label, color: c.muted, textTransform: "uppercase", width: "7.5rem" }}
                >
                  {tx.type}
                </span>
                <span className="flex-1 min-w-0" style={{ ...t.body, color: c.text }}>
                  {tx.description}
                </span>
                <span className="shrink-0 hidden md:block" style={{ ...t.mono, color: c.muted }}>
                  {formatDate(tx.createdAt)}
                </span>
                <span
                  className="shrink-0 text-right"
                  style={{
                    ...t.subheading,
                    fontSize: "0.95rem",
                    width: "4.5rem",
                    color: tx.points === null ? c.faint : c.accent,
                  }}
                >
                  {tx.points === null ? "—" : `${tx.points > 0 ? "+" : ""}${tx.points}`}
                </span>
                <span className="shrink-0 hidden sm:block">
                  <Badge tone={tx.status === "ACCEPTED" ? "accent" : "quiet"}>{tx.status}</Badge>
                </span>
              </Row>
            ))
          ) : (
            <EmptyState>No transactions yet.</EmptyState>
          )}
        </section>
      </div>

      <aside className="flex flex-col" style={{ gap: "1.75rem" }}>
        <RailPanel title="Quick actions">
          {ACTION_ROWS.map((action, i) => (
            <button
              key={action.key}
              onClick={() => run(action.key)}
              className="flex items-center justify-between w-full text-left"
              style={{
                ...t.label,
                textTransform: "uppercase",
                padding: "0.95rem 1.15rem",
                background: action.hot ? c.accentWash : "transparent",
                color: action.hot ? c.accent : c.muted,
                border: "none",
                borderBottom: i === ACTION_ROWS.length - 1 ? "none" : `1px solid ${c.rule}`,
                cursor: "pointer",
                transition: `color ${motion.fast}, background-color ${motion.fast}`,
              }}
            >
              {action.label}
              <span aria-hidden="true">→</span>
            </button>
          ))}
        </RailPanel>

        <section style={{ border: `1px solid ${c.ruleStrong}` }}>
          <div style={{ height: 2, backgroundColor: c.accent }} />
          <div className="flex flex-col" style={{ padding: "1.4rem", gap: "1.1rem" }}>
            <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>
              ACM Membership
            </span>
            <span style={{ ...t.subheading, fontSize: "1.5rem", color: c.text }}>
              {loading ? "—" : data?.account.studentId}
            </span>
            <p style={{ ...t.bodySmall, color: c.muted, margin: 0 }}>
              Present your student number at the door for attendance and point credits.
            </p>
          </div>
        </section>
      </aside>
    </div>
  );
}
