"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { safeUser } from "@/types/auth";
import { isEventAdmin } from "@/types/auth";
import { runBlinkIn } from "@/lib/blink";
import { type as t, layout } from "@/styles/design-system";
import { Surface, Panel, DataRow, Button, Label, useDS } from "@/components/ds";
import VideoCarousel, { type FeaturedVideo } from "./VideoCarousel";
import CalendarCard from "./CalendarCard";
import SchoolCalendarModal from "./SchoolCalendarModal";
import ManageVideosModal from "./ManageVideosModal";

type EventPreview = {
  id: string;
  name: string;
  venue: string;
  startDate: string;
  endDate: string;
  registrations: number;
};

type DashboardData = {
  upcomingEvents: EventPreview[];
  stats: { eventsAttended: number; totalRegistrations: number };
};

export default function DashboardHome({ user }: { user: safeUser }) {
  const { c } = useDS();
  const containerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<DashboardData | null>(null);
  const [videos, setVideos] = useState<FeaturedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const admin = isEventAdmin(user?.role);
  const isDesktop = useIsDesktop();

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch("/api/videos");
      const json = await res.json();
      if (json.ok) setVideos(json.videos);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes] = await Promise.all([fetch("/api/profile"), fetchVideos()]);
      const json = await profileRes.json();
      if (json.ok) {
        setData({ upcomingEvents: json.upcomingEvents, stats: json.stats });
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [fetchVideos]);

  useEffect(() => {
    // The loader's setState calls all run after an await, so this is not the
    // synchronous cascade the rule looks for — it can't see through the async
    // boundary. The real fix is fetching on the server (CLEANUP.md §5.1).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Blink each element in on load — shared site-wide reveal.
  useEffect(() => {
    if (!containerRef.current || loading) return;
    runBlinkIn(containerRef.current.querySelectorAll(".glitch-el"));
  }, [loading]);

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const nextEvent = data?.upcomingEvents?.[0];
  const eventDates = (data?.upcomingEvents ?? []).map((e) => new Date(e.startDate));

  return (
    <Surface>
      <div
        className="dash-root"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "clamp(0.75rem, 1.8vh, 1.35rem)",
          paddingTop: `calc(${layout.navHeight} + clamp(0.85rem, 2vh, 1.5rem))`,
          paddingBottom: "clamp(0.85rem, 2vh, 1.5rem)",
          paddingLeft: layout.gutter,
          paddingRight: layout.gutter,
        }}
      >
        <div ref={containerRef} style={{ display: "contents" }}>
          {/* ── Header ── */}
          <div
            className="glitch-el"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", flex: "0 0 auto" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span style={{ ...t.eyebrow, color: c.accent }}>MEMBER DASHBOARD</span>
              <h1 style={{ ...t.title, fontSize: "clamp(1.4rem, 3.2vh, 2.25rem)", lineHeight: 1.05, color: c.text, margin: 0 }}>
                Welcome back, {firstName}.
              </h1>
              <span style={{ width: 44, height: 2, background: c.accent }} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(1.25rem, 2.5vw, 2.5rem)", rowGap: "1rem" }}>
              <Stat value={user?.points ?? 0} label="Points" />
              <Stat value={data?.stats.eventsAttended ?? 0} label="Events Attended" />
              <Stat value={data?.stats.totalRegistrations ?? 0} label="Registrations" />
            </div>
          </div>

          {/* ── Main grid: featured video + rail ── */}
          <div
            className="dash-grid"
            style={{ display: "grid", gap: "clamp(1rem, 1.8vw, 1.6rem)" }}
          >
            <div className="glitch-el" style={{ minWidth: 0, minHeight: 0, display: "flex" }}>
              <VideoCarousel fillHeight={isDesktop} videos={videos} isAdmin={admin} onManage={() => setManageOpen(true)} />
            </div>

            <div className="dash-rail" style={{ display: "flex", flexDirection: "column", gap: "clamp(0.75rem, 1.6vh, 1.25rem)" }}>
              <div className="glitch-el" style={{ display: "flex", flexDirection: "column" }}>
                {nextEvent ? <UpNextCard event={nextEvent} /> : <SeasonWrappedCard loading={loading} />}
              </div>
              <div className="glitch-el" style={{ display: "flex", flexDirection: "column" }}>
                <CalendarCard keyDates={eventDates} onOpen={() => setCalendarOpen(true)} />
              </div>
            </div>
          </div>

          {/* ── Explore ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", flex: "0 0 auto" }}>
            <div className="glitch-el">
              <Label>Explore More</Label>
            </div>
            <div className="dash-tiles" style={{ display: "grid", gap: "clamp(0.6rem, 1.1vw, 1rem)" }}>
              {TILES.map((tile, i) => (
                <ExploreTile key={tile.href} tile={tile} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <SchoolCalendarModal isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} />
      {admin && (
        <ManageVideosModal isOpen={manageOpen} onClose={() => setManageOpen(false)} onChanged={fetchVideos} />
      )}

      {/* Mobile: natural vertical scroll, comfortable spacing.
          Desktop (>=1000px): single viewport, fills height. */}
      <style>{`
        .dash-grid { grid-template-columns: 1fr; }
        .dash-tiles { grid-template-columns: 1fr; }
        @media (min-width: 560px) {
          .dash-tiles { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1000px) {
          .dash-root { height: 100dvh; overflow: hidden; }
          .dash-grid { grid-template-columns: 2fr 1fr; flex: 1 1 0; min-height: 0; }
          .dash-rail { min-height: 0; overflow: hidden; }
          .dash-tiles { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </Surface>
  );
}

/* ── Viewport hook ── */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1000px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

/* ── Stat ── */
function Stat({ value, label }: { value: number | string; label: string }) {
  const { c } = useDS();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <span style={{ ...t.title, fontSize: "clamp(1.35rem, 3vh, 2rem)", color: c.text }}>{value}</span>
      <span style={{ width: 24, height: 2, background: c.accent }} />
      <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

/* ── Up Next event spotlight (primary action) ── */
function UpNextCard({ event }: { event: EventPreview }) {
  const { c } = useDS();
  const router = useRouter();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  const badge = `${start.toLocaleDateString("en-US", { month: "short" }).toUpperCase()} ${start.getDate()}`;
  const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const timeRange =
    end && end.getTime() > start.getTime() ? `${fmtTime(start)} – ${fmtTime(end)}` : fmtTime(start);

  return (
    <Panel padded={false} style={{ padding: "clamp(0.9rem, 1.6vh, 1.35rem)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(0.55rem, 1.2vh, 0.9rem)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...t.eyebrow, color: c.accent }}>UP NEXT</span>
          <span style={{ ...t.label, color: c.text, border: `1px solid ${c.rule}`, padding: "0.3rem 0.6rem" }}>
            {badge}
          </span>
        </div>
        <h3 style={{ ...t.subheading, fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", color: c.text, margin: 0 }}>
          {event.name}
        </h3>
        <div>
          <DataRow label="Venue" value={event.venue || "TBA"} />
          <DataRow label="Time" value={timeRange} />
        </div>
        <Button block onClick={() => router.push(`/events/${event.id}`)}>
          Register &nbsp;&rarr;
        </Button>
      </div>
    </Panel>
  );
}

/* ── Empty state: all events finished ── */
function SeasonWrappedCard({ loading }: { loading: boolean }) {
  const { c } = useDS();
  const router = useRouter();
  return (
    <Panel padded={false} style={{ padding: "clamp(0.9rem, 1.6vh, 1.35rem)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(0.55rem, 1.2vh, 0.9rem)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...t.eyebrow, color: c.accent }}>{loading ? "LOADING" : "SEASON WRAPPED"}</span>
          <CalendarCheckIcon color={c.accent} />
        </div>
        <h3 style={{ ...t.subheading, fontSize: "clamp(1.05rem, 1.8vw, 1.4rem)", color: c.text, margin: 0 }}>
          {loading ? "Checking the schedule…" : "That's a wrap for now."}
        </h3>
        <p style={{ ...t.bodySmall, color: c.muted, margin: 0 }}>
          {loading
            ? "Fetching your upcoming events."
            : "Every event this term has finished. Relive the highlights while the officers plan what's next."}
        </p>
        {!loading && (
          <Button variant="outline" block onClick={() => router.push("/events")}>
            Revisit Past Events &nbsp;&rarr;
          </Button>
        )}
      </div>
    </Panel>
  );
}

/* ── Explore tile (compact horizontal) ── */
type Tile = { icon: React.ReactNode; label: string; sublabel: string; href: string };

const TILES: Tile[] = [
  { icon: <ShoppingBagIcon />, label: "MERCHANDISE", sublabel: "Shop the latest drop", href: "/merchandise" },
  { icon: <UsersIcon />, label: "OFFICERS", sublabel: "Meet the people", href: "/officers" },
  { icon: <BookOpenIcon />, label: "ABOUT ACM", sublabel: "Our story & mission", href: "/about" },
  { icon: <ImageIcon />, label: "GALLERY", sublabel: "Relive past events", href: "/events" },
];

function ExploreTile({ tile }: { tile: Tile; index: number }) {
  const { c } = useDS();
  return (
    <Link href={tile.href} className="glitch-el" style={{ textDecoration: "none" }}>
      <Panel interactive padded={false} style={{ padding: "clamp(0.7rem, 1.4vh, 1rem)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <span style={{ color: c.accent, display: "inline-flex", flexShrink: 0 }}>{tile.icon}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", minWidth: 0 }}>
            <span style={{ ...t.subheading, fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)", color: c.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {tile.label}
            </span>
            <span style={{ ...t.bodySmall, color: c.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {tile.sublabel}
            </span>
          </div>
          <span style={{ marginLeft: "auto", flexShrink: 0 }}>
            <ArrowRightIcon color={c.muted} />
          </span>
        </div>
      </Panel>
    </Link>
  );
}

/* ── Inline icons ── */
function CalendarCheckIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6}>
      <rect x="3" y="4" width="18" height="18" rx="1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18M8 2v4M16 2v4M9 15l2 2 4-4" />
    </svg>
  );
}
function ShoppingBagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 2l-2 5v13a1 1 0 001 1h14a1 1 0 001-1V7l-2-5H6zM4 7h16M9 11a3 3 0 006 0" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13A4 4 0 0116 11" />
    </svg>
  );
}
function BookOpenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 4h6a4 4 0 014 4v12a3 3 0 00-3-3H2V4zM22 4h-6a4 4 0 00-4 4v12a3 3 0 013-3h7V4z" />
    </svg>
  );
}
function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21" />
    </svg>
  );
}
function ArrowRightIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
