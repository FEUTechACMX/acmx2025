"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { EventWithCount } from "@/types/events";
import { getEventStatus } from "@/types/events";
import { Badge, Subheading, Label, useDS } from "@/components/ds";
import { type as t, motion } from "@/styles/design-system";

interface EventCardProps {
  event: EventWithCount;
  priceTier: "officer" | "member" | "nonmember";
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

function getPrice(event: EventWithCount, tier: EventCardProps["priceTier"]): string {
  const amount =
    tier === "officer" ? event.price : tier === "member" ? event.priceMember : event.priceNonMember;
  return amount === 0 ? "Free" : `₱${amount}`;
}

/**
 * Event poster in the system's language: hairline frame, image plate,
 * Monument title, metadata split across a rule.
 */
export default function EventCards({ event, priceTier }: EventCardProps) {
  const { c } = useDS();
  const [hover, setHover] = useState(false);
  const status = getEventStatus(event);

  const date = new Date(event.startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const registered = event._aggregatedCount
    ? event._aggregatedCount.registrations
    : event._count.registrations;

  return (
    <Link href={`/events/${event.eventId}`} style={{ textDecoration: "none", display: "block" }}>
      <article
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="flex flex-col h-full"
        style={{
          backgroundColor: c.panel,
          border: `1px solid ${hover ? c.accent : c.rule}`,
          transition: `border-color ${motion.fast}`,
        }}
      >
        {/* Image plate */}
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4 / 3" }}>
          <Image
            src={event.cardImage || "/eventCard/cardBG.png"}
            alt={event.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
            style={{
              filter: status === "finished" ? "grayscale(1)" : undefined,
              opacity: status === "finished" ? 0.55 : 1,
              transform: hover ? "scale(1.03)" : "scale(1)",
              transition: `transform ${motion.base} ${motion.ease}`,
            }}
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
            {event.isMultiDay && <Badge tone="neutral">Multi-Day</Badge>}
          </div>
        </div>

        {/* Body */}
        <div
          className="flex flex-col flex-1"
          style={{ padding: "clamp(0.875rem, 1.6vw, 1.25rem)", gap: "0.75rem" }}
        >
          <Label style={{ color: c.faint }}>
            {event.eventSemester} Semester · ACM Event Series
          </Label>

          <Subheading style={{ color: c.text }}>{event.name}</Subheading>

          <div className="flex flex-col" style={{ gap: "0.15rem", marginTop: "auto" }}>
            <span style={{ ...t.mono, color: c.muted }}>{event.venue}</span>
            <span style={{ ...t.mono, color: c.muted }}>
              {event.dayOfWeek}, {date}
            </span>
          </div>

          <div
            className="flex items-baseline justify-between"
            style={{ borderTop: `1px solid ${c.rule}`, paddingTop: "0.75rem" }}
          >
            <Label style={{ color: c.faint }}>{registered} Registered</Label>
            <Label color={c.accent}>{getPrice(event, priceTier)}</Label>
          </div>
        </div>
      </article>
    </Link>
  );
}
