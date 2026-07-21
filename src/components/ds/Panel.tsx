"use client";

import React, { useState } from "react";
import { type as t, motion } from "@/styles/design-system";
import { useDS } from "./useDS";

/**
 * Hairline-bordered block. Square corners, no shadow — depth comes from
 * the border and a barely-there fill, never from elevation.
 */
export function Panel({
  children,
  interactive = false,
  padded = true,
  className = "",
  style,
  onClick,
}: {
  children: React.ReactNode;
  /** Border warms to the accent on hover. Use for links/cards. */
  interactive?: boolean;
  padded?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const { c } = useDS();
  const [hover, setHover] = useState(false);

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        backgroundColor: c.panel,
        border: `1px solid ${interactive && hover ? c.accent : c.rule}`,
        padding: padded ? "clamp(1rem, 2vw, 1.75rem)" : undefined,
        transition: `border-color ${motion.fast}`,
        cursor: interactive && onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Small status/meta chip. `tone` picks the treatment: accent for live
 * states, neutral for everything else.
 */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "accent" | "neutral" | "quiet";
}) {
  const { c } = useDS();

  const tones = {
    accent: { backgroundColor: c.accent, color: "#ffffff", border: `1px solid ${c.accent}` },
    neutral: { backgroundColor: "transparent", color: c.text, border: `1px solid ${c.ruleStrong}` },
    quiet: { backgroundColor: "transparent", color: c.faint, border: `1px solid ${c.rule}` },
  };

  return (
    <span
      style={{
        ...t.label,
        fontSize: "clamp(0.5rem, 0.65vw, 0.625rem)",
        textTransform: "uppercase",
        padding: "0.25rem 0.6rem",
        display: "inline-block",
        whiteSpace: "nowrap",
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}

/**
 * Key/value row separated by a hairline — the system's table substitute.
 * Label sits left in tracked caps, value right.
 */
export function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  const { c } = useDS();
  return (
    <div
      className="flex items-baseline justify-between gap-4"
      style={{ padding: "0.7rem 0", borderBottom: `1px solid ${c.rule}` }}
    >
      <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>{label}</span>
      <span style={{ ...t.mono, color: c.text, textAlign: "right" }}>{value}</span>
    </div>
  );
}
