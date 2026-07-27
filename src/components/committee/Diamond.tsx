"use client";

import React, { useId } from "react";
import { type as t, motion } from "@/styles/design-system";
import { useDS } from "@/components/ds";
import Icon from "@/components/admin/icons";
import type { CommitteeEmblem, CommitteeMemberDTO } from "@/types/committee";

/**
 * The committee diamond motif, shared by the index card, the hero mark and the
 * roster tokens. Drawn as SVG rather than a clip-path so the hairline follows
 * the shape — the same trick the Officers page uses for its portraits.
 */

const DIAMOND = "M50 2 L98 50 L50 98 L2 50 Z";

/** Concentric rings — the corner motif from `Surface`, rendered inline. */
export function CornerDiamonds({
  size = 150,
  color,
  className,
  style,
}: {
  size?: number;
  color: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={className}
      style={{ display: "block", overflow: "visible", ...style }}
    >
      {[50, 40, 30, 20, 10].map((r, i) => (
        <path
          key={r}
          d={`M50 ${50 - r} L${50 + r} 50 L50 ${50 + r} L${50 - r} 50 Z`}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.1 + i * 0.08}
        />
      ))}
    </svg>
  );
}

/**
 * A committee's emblem: the diamond mark with its glyph centred. `hollow` adds
 * the inner ring the hero uses; the card renders the plain mark.
 */
export function EmblemMark({
  emblem,
  size = 54,
  hollow = false,
  active = false,
}: {
  emblem: CommitteeEmblem;
  size?: number;
  /** Inner outline ring — hero scale only. */
  hollow?: boolean;
  /** Border warms to the accent, e.g. on card hover. */
  active?: boolean;
}) {
  const { c } = useDS();

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size, transition: `opacity ${motion.fast}` }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        <path
          d={DIAMOND}
          fill={c.accentWash}
          stroke={active ? c.accent : c.accent}
          strokeWidth={active ? 1.6 : 1}
          style={{ transition: `stroke-width ${motion.fast}` }}
        />
        {hollow && (
          <path
            d="M50 20 L80 50 L50 80 L20 50 Z"
            fill="none"
            stroke={c.accent}
            strokeWidth={1}
            opacity={0.4}
          />
        )}
      </svg>

      <span
        className="absolute inset-0 flex items-center justify-center"
        style={{ color: c.accent }}
      >
        <Icon name={emblem} size={Math.round(size * (hollow ? 0.26 : 0.4))} strokeWidth={1.5} />
      </span>
    </div>
  );
}

/**
 * A roster token — the same diamond portrait the Officers page uses, so one
 * portrait treatment covers the whole site. Falls back to a user glyph rather
 * than collapsing when a member has no photo.
 */
export function MemberToken({
  member,
  size = 92,
  caption = true,
}: {
  member: CommitteeMemberDTO;
  size?: number;
  /** Off on the lead cards, where the name and role sit beside the portrait. */
  caption?: boolean;
}) {
  const { c } = useDS();
  const clip = useId().replace(/:/g, "");

  return (
    <div
      className="flex flex-col items-center"
      style={{ gap: 10, width: caption ? 130 : size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        <defs>
          <clipPath id={clip}>
            <path d={DIAMOND} />
          </clipPath>
        </defs>
        <path d={DIAMOND} fill={c.panel} stroke={c.rule} strokeWidth={1} />
        {member.photo ? (
          <image
            href={member.photo}
            x="2"
            y="2"
            width="96"
            height="96"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#${clip})`}
          />
        ) : (
          <g stroke={c.faint} strokeWidth={1.3} fill="none">
            <circle cx="50" cy="43" r="8" />
            <path d="M35 66c0-8 6.7-13 15-13s15 5 15 13" />
          </g>
        )}
      </svg>

      {caption && (
        <div className="flex flex-col items-center" style={{ gap: 3 }}>
          <span style={{ ...t.label, color: c.muted, textAlign: "center" }}>
            {member.roleLabel || "MEMBER"}
          </span>
          <span
            style={{ ...t.bodySmall, fontSize: "0.6875rem", color: c.faint, textAlign: "center" }}
          >
            {member.name}
          </span>
        </div>
      )}
    </div>
  );
}
