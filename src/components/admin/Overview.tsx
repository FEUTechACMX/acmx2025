"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import type { safeUser } from "@/types/auth";
import { useDS } from "@/components/ds";
import { type as t, font } from "@/styles/design-system";
import AdminShell, {
  AdminContent,
  AdminPageHeader,
  SectionLabel,
  AdminButton,
} from "./AdminShell";
import Icon, { type IconName } from "./icons";

type Stats = { events: number; registrations: number; attendance: number; members: number; turnout: number };
type Data = {
  stats: Stats;
  needsAttention: { missingAttendance: string[] };
  recent: { name: string; date: string }[];
};

const fmt = (n: number) => n.toLocaleString();

export default function Overview({ user }: { user: safeUser }) {
  const { c } = useDS();
  const [data, setData] = useState<Data | null>(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => !d.error && setData(d))
      .catch(() => {});
  }, []);

  const s = data?.stats;
  const statCards: { label: string; value: string; icon: IconName; delta: string }[] = [
    { label: "EVENTS", value: s ? fmt(s.events) : "—", icon: "events", delta: "all time" },
    { label: "REGISTRATIONS", value: s ? fmt(s.registrations) : "—", icon: "user-plus", delta: "across events" },
    { label: "ATTENDANCE LOGGED", value: s ? fmt(s.attendance) : "—", icon: "clipboard", delta: s ? `${s.turnout}% turnout` : "—" },
    { label: "MEMBERS", value: s ? fmt(s.members) : "—", icon: "people", delta: "registered" },
  ];

  const quickActions: { title: string; desc: string; icon: IconName; href: string }[] = [
    { title: "New Event", desc: "Create & publish a new event", icon: "calendar-plus", href: "/admin/events" },
    { title: "Upload Media", desc: "Add images to the library", icon: "image-plus", href: "/admin/media" },
    { title: "Assign Roles", desc: "Give members officer roles", icon: "user-cog", href: "/admin/people" },
    { title: "Manage Videos", desc: "Feature videos on the dashboard", icon: "videos", href: "/admin/videos" },
  ];

  const missing = data?.needsAttention.missingAttendance ?? [];

  return (
    <AdminShell user={user} breadcrumb="Overview" searchPlaceholder="Search anything…">
      <AdminContent>
        <AdminPageHeader
          eyebrow={`ADMIN CONSOLE · ${year}`}
          title="Overview"
          subtitle="Manage events, media, people, and everything the chapter ships — from one place."
          actions={
            <>
              <Link href="/admin/media" style={{ textDecoration: "none" }}>
                <AdminButton variant="ghost" icon="upload">UPLOAD MEDIA</AdminButton>
              </Link>
              <Link href="/admin/events" style={{ textDecoration: "none" }}>
                <AdminButton icon="plus">NEW EVENT</AdminButton>
              </Link>
            </>
          }
        />

        {/* Stats */}
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          {statCards.map((st) => (
            <div key={st.label} className="flex flex-col" style={{ gap: 14, padding: 22, backgroundColor: c.panel, border: `1px solid ${c.rule}` }}>
              <div className="flex items-center justify-between">
                <span style={{ ...t.label, color: c.faint }}>{st.label}</span>
                <span style={{ color: c.muted, display: "flex" }}><Icon name={st.icon} size={16} /></span>
              </div>
              <span style={{ fontFamily: font.display, fontSize: 40, fontWeight: 500, color: c.text, lineHeight: 1 }}>{st.value}</span>
              <div className="flex items-center" style={{ gap: 6 }}>
                <span style={{ color: c.accent, display: "flex" }}><Icon name="arrow-up-right" size={13} /></span>
                <span style={{ ...t.bodySmall, color: c.muted }}>{st.delta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex flex-col" style={{ gap: 16 }}>
          <SectionLabel>QUICK ACTIONS</SectionLabel>
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {quickActions.map((qa) => (
              <Link key={qa.title} href={qa.href} style={{ textDecoration: "none" }}>
                <div className="flex flex-col h-full" style={{ gap: 14, padding: 20, backgroundColor: c.panel, border: `1px solid ${c.rule}` }}>
                  <div className="flex items-center justify-center" style={{ width: 40, height: 40, backgroundColor: c.accentWash, color: c.accent }}>
                    <Icon name={qa.icon} size={19} />
                  </div>
                  <div className="flex flex-col" style={{ gap: 5 }}>
                    <span style={{ ...t.subheading, fontSize: 15, color: c.text }}>{qa.title}</span>
                    <span style={{ ...t.bodySmall, color: c.muted }}>{qa.desc}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Lower grid */}
        <div className="grid gap-6" style={{ gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)" }}>
          {/* Needs attention */}
          <div style={{ backgroundColor: c.panel, border: `1px solid ${c.rule}` }}>
            <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: `1px solid ${c.rule}` }}>
              <span style={{ ...t.label, color: c.faint }}>NEEDS ATTENTION</span>
              {missing.length > 0 && (
                <span style={{ ...t.label, fontSize: 10, color: "#fff", backgroundColor: c.accent, padding: "3px 8px" }}>{missing.length}</span>
              )}
            </div>
            {missing.length === 0 ? (
              <div style={{ padding: "22px 20px" }}>
                <span style={{ ...t.bodySmall, color: c.muted }}>Nothing needs attention right now. 🎉</span>
              </div>
            ) : (
              missing.map((name, i) => (
                <div key={i} className="flex items-center justify-between" style={{ gap: 16, padding: "16px 20px", borderBottom: i < missing.length - 1 ? `1px solid ${c.rule}` : "none" }}>
                  <div className="flex items-center min-w-0" style={{ gap: 12 }}>
                    <span style={{ color: c.accent, display: "flex" }}><Icon name="clipboard" size={17} /></span>
                    <span style={{ ...t.bodySmall, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      “{name}” has registrations but no attendance logged
                    </span>
                  </div>
                  <Link href="/admin/events" style={{ textDecoration: "none", flexShrink: 0 }}>
                    <span style={{ ...t.label, fontSize: 10, color: c.text, padding: "7px 12px", border: `1px solid ${c.ruleStrong}` }}>LOG NOW</span>
                  </Link>
                </div>
              ))
            )}
          </div>

          {/* Recent activity */}
          <div style={{ backgroundColor: c.panel, border: `1px solid ${c.rule}` }}>
            <div className="flex items-center" style={{ padding: "16px 20px", borderBottom: `1px solid ${c.rule}` }}>
              <span style={{ ...t.label, color: c.faint }}>RECENT EVENTS</span>
            </div>
            {(data?.recent ?? []).map((r, i) => (
              <div key={i} className="flex items-start" style={{ gap: 12, padding: "13px 20px" }}>
                <span style={{ width: 6, height: 6, backgroundColor: c.accent, transform: "rotate(45deg)", marginTop: 6, flexShrink: 0 }} />
                <div className="flex flex-col" style={{ gap: 3 }}>
                  <span style={{ ...t.bodySmall, color: c.text, fontWeight: 600 }}>{r.name}</span>
                  <span style={{ ...t.label, fontSize: 10, color: c.faint }}>
                    {new Date(r.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
            {(!data || data.recent.length === 0) && (
              <div style={{ padding: "22px 20px" }}>
                <span style={{ ...t.bodySmall, color: c.muted }}>No events yet.</span>
              </div>
            )}
          </div>
        </div>
      </AdminContent>
    </AdminShell>
  );
}
