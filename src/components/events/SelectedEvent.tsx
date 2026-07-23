"use client";

import { EventWithCount, getEventStatus } from "@/types/events";
import AttendButton from "./AttendButton";
import PastEventExperience from "./PastEventExperience";
import Link from "next/link";
import { useState, useEffect } from "react";
import { isOfficer, isEventAdmin } from "@/types/auth";
import ReactMarkdown from "react-markdown";
import {
  Surface,
  Column,
  Panel,
  Badge,
  DataRow,
  Button,
  Rule,
  Eyebrow,
  Title,
  Label,
  Segmented,
  useDS,
} from "@/components/ds";
import { layout, type as t, motion } from "@/styles/design-system";

interface SelectedEventProps {
  event: EventWithCount;
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  finished: "Finished",
};

const STATUS_TONE = {
  upcoming: "accent",
  ongoing: "accent",
  finished: "quiet",
} as const;

/** Section heading in the left-rail idiom: tracked caps over a hairline. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  const { c } = useDS();
  return (
    <div style={{ marginBottom: layout.gapTight }}>
      <Label style={{ color: c.faint }}>{children}</Label>
      <div style={{ marginTop: "0.55rem" }}>
        <Rule />
      </div>
    </div>
  );
}

function BackLink() {
  const { c } = useDS();
  const [hover, setHover] = useState(false);
  return (
    <Link
      href="/events"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...t.label,
        textTransform: "uppercase",
        color: hover ? c.accent : c.faint,
        textDecoration: "none",
        transition: `color ${motion.fast}`,
        display: "inline-block",
      }}
    >
      ← Back to Events
    </Link>
  );
}

function getUserPrice(event: EventWithCount, tier: "officer" | "member" | "nonmember"): string {
  const amount =
    tier === "officer" ? event.price : tier === "member" ? event.priceMember : event.priceNonMember;
  return amount === 0 ? "Free" : `₱${amount}`;
}

/** Deterministic decorative barcode — pure ornament on the ticket stub. */
function Barcode({ color }: { color: string }) {
  let seed = 7;
  const bars = Array.from({ length: 46 }, () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return 1 + (seed % 4);
  });
  return (
    <div className="flex items-center" style={{ gap: 2, height: 38 }}>
      {bars.map((w, i) => (
        <div key={i} style={{ width: w, height: 38, backgroundColor: color }} />
      ))}
    </div>
  );
}

const SelectedEvent = ({ event }: SelectedEventProps) => {
  const hasSubEvents = !!event.subEvents && event.subEvents.length > 0;
  const { c } = useDS();

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [priceTier, setPriceTier] = useState<"officer" | "member" | "nonmember">("nonmember");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setPriceTier(isOfficer(data.user.role) ? "officer" : "member");
            setShowAdminPanel(isEventAdmin(data.user.role));
          }
        }
      } catch {
        /* not logged in */
      }
    }
    fetchUserRole();
  }, []);

  const status = getEventStatus(event);
  const isFinished = status === "finished";
  const isOngoing = status === "ongoing";
  const isPast = isFinished || isOngoing;

  /* ─────────── PAST / ONGOING: the memory-doors experience ─────── */
  if (isPast) {
    return <PastEventExperience event={event} isAdmin={showAdminPanel} />;
  }

  /* ─────────────────────────── UPCOMING: THE PASS ─────────────── */
  const activeEvent: EventWithCount =
    hasSubEvents && selectedDayIndex > 0 ? event.subEvents![selectedDayIndex - 1] : event;

  const activeStatus =
    hasSubEvents && selectedDayIndex > 0 ? getEventStatus(activeEvent) : status;
  const canRegister = activeStatus !== "finished" && activeStatus !== "ongoing";

  const displayDate = activeEvent.startDate;
  const displayVenue = activeEvent.venue;

  const dayOptions = [
    { value: "0", label: "Overview" },
    ...(event.subEvents ?? []).map((sub, idx) => ({
      value: String(idx + 1),
      label: `Day ${idx + 1} · ${new Date(sub.startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`,
    })),
  ];

  const registeredCount =
    hasSubEvents && selectedDayIndex === 0
      ? (event._aggregatedCount?.registrations ?? 0)
      : activeEvent._count.registrations;

  const capacity = (activeEvent as unknown as { capacity?: number | null }).capacity ?? null;
  const seatsLeft = capacity != null ? Math.max(0, capacity - registeredCount) : null;
  const fillPct = capacity ? Math.min(100, Math.round((registeredCount / capacity) * 100)) : 0;

  const tierLabel =
    priceTier === "officer" ? "Officer Rate" : priceTier === "member" ? "Member Rate" : "Non-Member Rate";

  const fmtShort = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const fmtTime = (d: Date | string) =>
    new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const markdownComponents = {
    p: (props: React.ComponentProps<"p">) => (
      <p style={{ ...t.body, color: c.muted, margin: "0 0 1rem" }} {...props} />
    ),
    strong: (props: React.ComponentProps<"strong">) => (
      <strong style={{ color: c.text, fontWeight: 500 }} {...props} />
    ),
    em: (props: React.ComponentProps<"em">) => (
      <em style={{ color: c.muted, fontStyle: "italic" }} {...props} />
    ),
    a: (props: React.ComponentProps<"a">) => (
      <a style={{ color: c.accent, textDecoration: "underline" }} target="_blank" rel="noopener noreferrer" {...props} />
    ),
    ul: (props: React.ComponentProps<"ul">) => (
      <ul style={{ ...t.body, color: c.muted, margin: "0 0 1rem", paddingLeft: "1.15rem" }} {...props} />
    ),
    ol: (props: React.ComponentProps<"ol">) => (
      <ol style={{ ...t.body, color: c.muted, margin: "0 0 1rem", paddingLeft: "1.15rem" }} {...props} />
    ),
    li: (props: React.ComponentProps<"li">) => <li style={{ marginBottom: "0.35rem" }} {...props} />,
    h1: (props: React.ComponentProps<"h1">) => (
      <h1 style={{ ...t.subheading, color: c.text, margin: "1.5rem 0 0.75rem" }} {...props} />
    ),
    h2: (props: React.ComponentProps<"h2">) => (
      <h2 style={{ ...t.subheading, color: c.text, margin: "1.25rem 0 0.6rem" }} {...props} />
    ),
    h3: (props: React.ComponentProps<"h3">) => (
      <h3 style={{ ...t.subheading, color: c.text, margin: "1rem 0 0.5rem" }} {...props} />
    ),
  };

  const activeDescription =
    (hasSubEvents && selectedDayIndex > 0
      ? event.subEvents![selectedDayIndex - 1].description
      : event.description) || "";

  const objectives = event.specificObjectives ?? [];

  /* Progressive-disclosure tabs — only those with content are shown. */
  const tabs: { key: string; label: string; node: React.ReactNode }[] = [];
  if (activeDescription) {
    tabs.push({
      key: "programme",
      label: "Programme",
      node: <ReactMarkdown components={markdownComponents}>{activeDescription}</ReactMarkdown>,
    });
  }
  if (event.mainObjective || objectives.length > 0) {
    tabs.push({
      key: "objectives",
      label: "Objectives",
      node: (
        <div className="flex flex-col" style={{ gap: "0.9rem" }}>
          {event.mainObjective && (
            <p style={{ ...t.body, color: c.text, margin: "0 0 0.4rem" }}>{event.mainObjective}</p>
          )}
          {objectives.map((o, i) => (
            <div key={i} className="flex" style={{ gap: "0.9rem" }}>
              <span style={{ ...t.mono, color: c.accent }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ ...t.body, color: c.muted }}>{o}</span>
            </div>
          ))}
        </div>
      ),
    });
  }
  if (event.registrationFees) {
    tabs.push({
      key: "fees",
      label: "Fees",
      node: (
        <p style={{ ...t.body, color: c.muted, whiteSpace: "pre-line", margin: 0 }}>
          {event.registrationFees}
        </p>
      ),
    });
  }
  const currentTab = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

  const metaCols: { k: string; v: string }[] = [
    { k: "Date", v: fmtShort(displayDate) },
    { k: "Doors", v: fmtTime(displayDate) },
    { k: "Venue", v: displayVenue },
    { k: "Campus", v: "FEU Tech" },
  ];

  return (
    <Surface corners="none">
      <Column reveal={false} style={{ gap: layout.gap }}>
        <BackLink />

        <div>
          <Eyebrow words={["ACM", "ADMISSION", "PASS", event.eventSemester.toUpperCase()]} />
        </div>

        {/* Day switcher for multi-day series */}
        {hasSubEvents && (
          <div className="overflow-x-auto">
            <Segmented
              options={dayOptions}
              value={String(selectedDayIndex)}
              onChange={(v) => setSelectedDayIndex(Number(v))}
            />
          </div>
        )}

        {/* The Pass */}
        <div
          className="relative flex flex-col lg:flex-row"
          style={{ border: `1px solid ${c.ruleStrong}`, backgroundColor: c.panel }}
        >
          {/* Main */}
          <div
            className="flex flex-col justify-between"
            style={{ flex: 1, padding: "clamp(1.5rem, 3vw, 2.75rem)", gap: "clamp(1.5rem, 3vh, 2.5rem)" }}
          >
            <div className="flex items-center justify-between" style={{ gap: "1rem" }}>
              <Label style={{ color: c.faint }}>Competitive · One Pass</Label>
              <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
            </div>

            <div className="flex flex-col" style={{ gap: "0.9rem" }}>
              <Title>{event.name}</Title>
              {event.isMultiDay && (
                <Label style={{ color: c.muted }}>
                  Multi-day series · {event.subEvents?.length ?? 0} sessions
                </Label>
              )}
              {event.type && event.type.length > 0 && (
                <div className="flex flex-wrap" style={{ gap: "0.5rem", marginTop: "0.25rem" }}>
                  {event.type.map((ty) => (
                    <Badge key={ty} tone="neutral">
                      {ty}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap" style={{ gap: "clamp(1.75rem, 4vw, 3.5rem)" }}>
              {metaCols.map(({ k, v }) => (
                <div key={k} className="flex flex-col" style={{ gap: "0.4rem" }}>
                  <Label style={{ color: c.faint }}>{k}</Label>
                  <span style={{ ...t.body, color: c.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Perforation */}
          <div
            className="relative hidden lg:block"
            style={{ borderLeft: `1.5px dashed ${c.ruleStrong}` }}
            aria-hidden="true"
          >
            <span style={notchStyle(c.surface, c.ruleStrong, "top")} />
            <span style={notchStyle(c.surface, c.ruleStrong, "bottom")} />
          </div>
          <div className="relative block lg:hidden" style={{ borderTop: `1.5px dashed ${c.ruleStrong}` }} aria-hidden="true" />

          {/* Stub */}
          <div
            className="flex flex-col justify-between"
            style={{
              width: "100%",
              maxWidth: 360,
              padding: "clamp(1.5rem, 2.5vw, 2.25rem)",
              gap: "clamp(1.25rem, 2.5vh, 2rem)",
              backgroundColor: c.accentWash,
            }}
          >
            <div className="flex flex-col" style={{ gap: "0.4rem" }}>
              <span style={{ ...t.subheading, color: c.accent, letterSpacing: "0.14em" }}>ADMIT ONE</span>
              <Label style={{ color: c.faint }}>
                {event.isMultiDay ? "Season Pass · All Sessions" : "Single Admission"}
              </Label>
            </div>

            <div className="flex flex-col" style={{ gap: "0.9rem" }}>
              <div className="flex items-end" style={{ gap: "0.6rem" }}>
                <span style={{ ...t.heading, color: c.text }}>{getUserPrice(activeEvent, priceTier)}</span>
                <span style={{ ...t.label, color: c.faint, textTransform: "uppercase", paddingBottom: "0.4rem" }}>
                  {tierLabel}
                </span>
              </div>

              {capacity != null ? (
                <div className="flex flex-col" style={{ gap: "0.5rem" }}>
                  <div className="flex items-center justify-between">
                    <Label style={{ color: c.muted }}>{registeredCount} / {capacity} seats</Label>
                    <Label style={{ color: c.accent }}>{seatsLeft} left</Label>
                  </div>
                  <div style={{ width: "100%", height: 5, backgroundColor: c.rule }}>
                    <div style={{ width: `${fillPct}%`, height: 5, backgroundColor: c.accent, transition: `width ${motion.base}` }} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <Label style={{ color: c.muted }}>Registered</Label>
                  <span style={{ ...t.mono, color: c.text }}>{registeredCount}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col" style={{ gap: "1rem" }}>
              {canRegister ? (
                hasSubEvents && selectedDayIndex === 0 ? (
                  <div style={{ border: `1px solid ${c.rule}`, padding: "0.8rem 1rem", textAlign: "center" }}>
                    <Label style={{ color: c.faint }}>Select a day to register</Label>
                  </div>
                ) : (
                  <AttendButton eventId={activeEvent.eventId} />
                )
              ) : (
                <div style={{ border: `1px solid ${c.rule}`, padding: "0.8rem 1rem", textAlign: "center" }}>
                  <Label style={{ color: c.faint }}>Registration Closed</Label>
                </div>
              )}
              <Barcode color={c.text} />
              <span style={{ ...t.mono, color: c.faint, letterSpacing: "0.18em" }}>
                NO. {event.eventId.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* About + progressive-disclosure tabs + rail */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[2fr_1fr]"
          style={{ gap: `calc(${layout.gap} * 1.5)`, marginTop: layout.gapTight }}
        >
          <section>
            <SectionLabel>About this event</SectionLabel>

            {event.overview && (
              <p style={{ ...t.body, color: c.muted, maxWidth: "60ch", margin: "0 0 1.5rem" }}>
                {event.overview}
              </p>
            )}

            {tabs.length > 0 ? (
              <>
                {tabs.length > 1 && (
                  <div className="overflow-x-auto" style={{ marginBottom: "1.5rem" }}>
                    <Segmented
                      options={tabs.map((tab) => ({ value: tab.key, label: tab.label }))}
                      value={currentTab.key}
                      onChange={setActiveTab}
                    />
                  </div>
                )}
                <div style={{ maxWidth: "62ch" }}>{currentTab.node}</div>
              </>
            ) : (
              <p style={{ ...t.body, color: c.muted, maxWidth: "60ch" }}>
                Details for this event will be announced soon. Stay tuned for more information.
              </p>
            )}
          </section>

          <aside className="flex flex-col" style={{ gap: layout.gap }}>
            <Panel>
              <Label style={{ color: c.faint }}>Rates</Label>
              <div style={{ marginTop: layout.gapTight }}>
                <DataRow label="Officer" value={getUserPrice(event, "officer")} />
                <DataRow label="Member" value={getUserPrice(event, "member")} />
                <DataRow label="Non-Member" value={getUserPrice(event, "nonmember")} />
              </div>
            </Panel>

            <Panel>
              <Label style={{ color: c.faint }}>Details</Label>
              <div style={{ marginTop: layout.gapTight }}>
                {event.targetParticipants && <DataRow label="Who Should Come" value={event.targetParticipants} />}
                <DataRow label="Term" value={`${event.eventSemester} Term`} />
                <DataRow label="Format" value={event.isMultiDay ? "Multi-day series" : "Single day"} />
              </div>
            </Panel>

            <Panel>
              <Label style={{ color: c.faint }}>Your pass includes</Label>
              <ul style={{ ...t.body, color: c.muted, margin: "0.75rem 0 0", paddingLeft: "1.1rem" }}>
                <li style={{ marginBottom: "0.35rem" }}>Event entry &amp; materials</li>
                <li style={{ marginBottom: "0.35rem" }}>QR check-in at the door</li>
                <li>Attendance points on your account</li>
              </ul>
            </Panel>
          </aside>
        </div>

        {showAdminPanel && (
          <section>
            <SectionLabel>Admin</SectionLabel>
            <Link href={`/events/${event.eventId}/admin`}>
              <Button variant="outline">Manage Event →</Button>
            </Link>
          </section>
        )}
      </Column>
    </Surface>
  );
};

/** Punched notch straddling the perforation edge, filled to match the page surface. */
function notchStyle(surface: string, rule: string, edge: "top" | "bottom"): React.CSSProperties {
  return {
    position: "absolute",
    left: -11,
    [edge]: -11,
    width: 22,
    height: 22,
    borderRadius: "50%",
    backgroundColor: surface,
    border: `1px solid ${rule}`,
  };
}

export default SelectedEvent;
