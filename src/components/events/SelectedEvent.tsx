"use client";

import { EventWithCount, getEventStatus } from "@/types/events";
import AttendButton from "./AttendButton";
import Link from "next/link";
import { useState, useEffect } from "react";
import { isOfficer, isEventAdmin } from "@/types/auth";
import AttendanceLookup from "./AttendanceLookup";
import EventGallery from "./EventGallery";
import ReactMarkdown from "react-markdown";
import {
  Surface,
  Column,
  PageHeader,
  Panel,
  Badge,
  DataRow,
  Button,
  Rule,
  Label,
  Subheading,
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
  upcoming: "neutral",
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
        marginBottom: layout.gap,
      }}
    >
      ← Back to Events
    </Link>
  );
}

const SelectedEvent = ({ event }: SelectedEventProps) => {
  const hasSubEvents = !!event.subEvents && event.subEvents.length > 0;
  const { c } = useDS();

  // For multi-day events, selectedDay tracks which sub-event's context to show.
  // Day 0 = the parent overview (no registration), Day 1+ = sub-events.
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [priceTier, setPriceTier] = useState<"officer" | "member" | "nonmember">("nonmember");
  const [showAdminPanel, setShowAdminPanel] = useState(false);

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

  // Determine which event context to use for registration
  const activeEvent: EventWithCount =
    hasSubEvents && selectedDayIndex > 0 ? event.subEvents![selectedDayIndex - 1] : event;

  const status = getEventStatus(event);
  const isFinished = status === "finished";
  const isOngoing = status === "ongoing";

  // For registration eligibility, use the selected sub-event's own status
  const activeStatus =
    hasSubEvents && selectedDayIndex > 0 ? getEventStatus(activeEvent) : status;
  const canRegister = activeStatus !== "finished" && activeStatus !== "ongoing";
  const hasGallery = !!event.gallery && event.gallery.length > 0;

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
      <a
        style={{ color: c.accent, textDecoration: "underline" }}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    ul: (props: React.ComponentProps<"ul">) => (
      <ul style={{ ...t.body, color: c.muted, margin: "0 0 1rem", paddingLeft: "1.15rem" }} {...props} />
    ),
    ol: (props: React.ComponentProps<"ol">) => (
      <ol style={{ ...t.body, color: c.muted, margin: "0 0 1rem", paddingLeft: "1.15rem" }} {...props} />
    ),
    li: (props: React.ComponentProps<"li">) => (
      <li style={{ marginBottom: "0.35rem" }} {...props} />
    ),
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

  return (
    <Surface corners="bottom-right">
      <Column>
        <BackLink />

        <PageHeader
          eyebrow={["ACM", "EVENT", "SERIES"]}
          title={event.name}
          aside={
            canRegister ? (
              hasSubEvents && selectedDayIndex === 0 ? (
                <Label style={{ color: c.faint }}>Select a day to register</Label>
              ) : (
                <AttendButton eventId={activeEvent.eventId} />
              )
            ) : undefined
          }
        />

        {/* Status row */}
        <div className="flex items-center flex-wrap" style={{ gap: "0.5rem", marginTop: layout.gap }}>
          <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
          {event.isMultiDay && <Badge tone="neutral">Multi-Day</Badge>}
          <Badge tone="quiet">{event.eventSemester} Semester</Badge>
          <Badge tone="quiet">Hosted by ACM · FEU Tech</Badge>
        </div>

        {hasSubEvents && (
          <div style={{ marginTop: layout.gap }} className="overflow-x-auto">
            <Segmented
              options={dayOptions}
              value={String(selectedDayIndex)}
              onChange={(v) => setSelectedDayIndex(Number(v))}
            />
          </div>
        )}

        {/* Body grid */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[2fr_1fr]"
          style={{ marginTop: `calc(${layout.gap} * 1.5)`, gap: `calc(${layout.gap} * 1.5)` }}
        >
          {/* Main column */}
          <div className="flex flex-col" style={{ gap: `calc(${layout.gap} * 1.5)` }}>
            {(isFinished || isOngoing) && hasGallery && (
              <section>
                <SectionLabel>Photos</SectionLabel>
                <EventGallery images={event.gallery!} eventName={event.name} />
              </section>
            )}

            {!isFinished && !isOngoing && (
              <div style={{ border: `1px solid ${c.rule}`, overflow: "hidden" }}>
                <img
                  src={event.image || `/events/event-${event.eventId}.png`}
                  alt={event.name}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      event.cardImage || "/eventCard/cardBG.png";
                  }}
                />
              </div>
            )}

            <section>
              <SectionLabel>
                {hasSubEvents && selectedDayIndex > 0
                  ? `Day ${selectedDayIndex} — About`
                  : "About this event"}
              </SectionLabel>
              <div style={{ maxWidth: "60ch" }}>
                <ReactMarkdown components={markdownComponents}>
                  {(hasSubEvents && selectedDayIndex > 0
                    ? event.subEvents![selectedDayIndex - 1].description
                    : event.description) ||
                    "Details for this event will be announced soon. Stay tuned for more information."}
                </ReactMarkdown>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col" style={{ gap: layout.gap }}>
            <Panel>
              <Label style={{ color: c.faint }}>Schedule</Label>
              <div style={{ marginTop: layout.gapTight }}>
                <DataRow
                  label="Date"
                  value={`${activeEvent.dayOfWeek}, ${new Date(displayDate).toLocaleDateString(
                    "en-US",
                    { month: "long", day: "numeric", year: "numeric" },
                  )}`}
                />
                <DataRow
                  label="Time"
                  value={new Date(displayDate).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                />
                <DataRow label="Venue" value={displayVenue} />
                <DataRow label="Campus" value="FEU Institute of Technology" />
              </div>
            </Panel>

            <div className="grid grid-cols-2" style={{ gap: layout.gapTight }}>
              <Panel>
                <Subheading style={{ color: c.text }}>{registeredCount}</Subheading>
                <div
                  style={{ width: "1.5rem", height: 2, backgroundColor: c.accent, margin: "0.6rem 0 0.4rem" }}
                />
                <Label style={{ color: c.faint }}>
                  {hasSubEvents && selectedDayIndex === 0 ? "Total Registered" : "Registered"}
                </Label>
              </Panel>

              <Panel>
                <Subheading style={{ color: c.text }}>{getUserPrice(event, priceTier)}</Subheading>
                <div
                  style={{ width: "1.5rem", height: 2, backgroundColor: c.accent, margin: "0.6rem 0 0.4rem" }}
                />
                <Label style={{ color: c.faint }}>
                  {priceTier === "officer"
                    ? "Officer Rate"
                    : priceTier === "member"
                      ? "Member Rate"
                      : "Non-Member Rate"}
                </Label>
              </Panel>
            </div>
          </aside>
        </div>

        {showAdminPanel && (
          <section style={{ marginTop: `calc(${layout.gap} * 2)` }}>
            <SectionLabel>Admin</SectionLabel>
            <Link href={`/events/${event.eventId}/admin`}>
              <Button variant="outline">Manage Event →</Button>
            </Link>
          </section>
        )}

        {(isOngoing || isFinished) && (
          <div style={{ marginTop: `calc(${layout.gap} * 2)` }}>
            <AttendanceLookup
              eventId={event.eventId}
              subEvents={event.subEvents?.map((sub) => ({
                eventId: sub.eventId,
                name: sub.name,
              }))}
            />
          </div>
        )}
      </Column>
    </Surface>
  );
};

function getUserPrice(
  event: EventWithCount,
  tier: "officer" | "member" | "nonmember",
): string {
  const amount =
    tier === "officer" ? event.price : tier === "member" ? event.priceMember : event.priceNonMember;
  return amount === 0 ? "Free" : `₱${amount}`;
}

export default SelectedEvent;
