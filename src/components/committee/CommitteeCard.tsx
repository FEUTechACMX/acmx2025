"use client";

import React, { useState } from "react";
import Link from "next/link";
import { type as t, motion } from "@/styles/design-system";
import { useDS } from "@/components/ds";
import { committeeNumber, seatNote, type CommitteeSummaryDTO } from "@/types/committee";
import { EmblemMark } from "./Diamond";

/**
 * Index card. Uniform on purpose — every committee gets the same emblem slot,
 * the same number, the same three lines. The only thing that differentiates
 * them at a glance is the mark and the seat count, so no committee can style
 * itself louder than another.
 */
export default function CommitteeCard({
  committee,
  index,
}: {
  committee: CommitteeSummaryDTO;
  index: number;
}) {
  const { c } = useDS();
  const [hover, setHover] = useState(false);

  const seats = seatNote(committee);
  const seatColor =
    seats.tone === "accent" ? c.accent : seats.tone === "faint" ? c.faint : c.muted;

  return (
    <Link
      href={`/committee/${committee.slug}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex flex-col"
      style={{
        gap: 18,
        padding: "clamp(1.25rem, 2vw, 1.625rem)",
        textDecoration: "none",
        border: `1px solid ${hover ? c.accent : c.rule}`,
        transition: `border-color ${motion.fast}`,
      }}
    >
      <div className="flex items-center justify-between" style={{ gap: 16 }}>
        <EmblemMark emblem={committee.emblem} size={54} active={hover} />
        <span style={{ ...t.label, color: c.faint }}>{committeeNumber(index)}</span>
      </div>

      <div className="flex flex-col" style={{ gap: 10 }}>
        <span
          style={{
            ...t.subheading,
            fontSize: "clamp(1.0625rem, 1.6vw, 1.375rem)",
            color: c.text,
          }}
        >
          {committee.name}
        </span>
        {committee.blurb && (
          <p style={{ ...t.bodySmall, color: c.muted, margin: 0 }}>{committee.blurb}</p>
        )}
      </div>

      <div
        className="flex items-center justify-between"
        style={{ gap: 12, marginTop: "auto", paddingTop: 14, borderTop: `1px solid ${c.rule}` }}
      >
        <span style={{ ...t.label, color: seatColor }}>{seats.text}</span>
        <span
          style={{
            ...t.label,
            color: hover ? c.accent : c.muted,
            transition: `color ${motion.fast}`,
          }}
        >
          View →
        </span>
      </div>
    </Link>
  );
}
