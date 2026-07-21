"use client";

import React from "react";
import { type as t, layout } from "@/styles/design-system";
import { useDS } from "./useDS";

/* ── Rule ───────────────────────────────────────────────────── */

export function Rule({ margin = "0", strong = false }: { margin?: string; strong?: boolean }) {
  const { c } = useDS();
  return <hr style={{ borderColor: strong ? c.ruleStrong : c.rule, margin, borderTopWidth: 1 }} />;
}

/* ── Eyebrow ────────────────────────────────────────────────── */

/**
 * The hero's signature: words justified edge-to-edge above a hairline.
 * Pass a single string for a plain left-aligned label instead.
 */
export function Eyebrow({
  words,
  rule = true,
}: {
  words: string | string[];
  rule?: boolean;
}) {
  const { c } = useDS();
  const list = Array.isArray(words) ? words : [words];

  return (
    <div>
      <div
        className={list.length > 1 ? "flex justify-between items-center" : "flex"}
        style={{ paddingBottom: "0.55rem" }}
      >
        {list.map((w) => (
          <span key={w} style={{ ...t.eyebrow, color: c.muted }}>
            {w}
          </span>
        ))}
      </div>
      {rule && <Rule />}
    </div>
  );
}

/* ── Headings ───────────────────────────────────────────────── */

type HeadingProps = {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  color?: string;
  style?: React.CSSProperties;
};

function makeHeading(scale: React.CSSProperties, defaultTag: "h1" | "h2" | "h3") {
  return function Heading({ children, as, color, style }: HeadingProps) {
    const { c } = useDS();
    const Tag = as ?? defaultTag;
    return (
      <Tag style={{ ...scale, color: color ?? c.text, margin: 0, ...style }}>{children}</Tag>
    );
  };
}

/** Hero-scale headline. One per page, at most. */
export const Display = makeHeading(t.display, "h1");
/** Interior page headline. */
export const Title = makeHeading(t.title, "h1");
/** Section heading. */
export const Heading = makeHeading(t.heading, "h2");
/** Card / sub-section heading. */
export const Subheading = makeHeading(t.subheading, "h3");

/* ── Body ───────────────────────────────────────────────────── */

export function Body({
  children,
  small = false,
  muted = true,
  measure = true,
  style,
}: {
  children: React.ReactNode;
  small?: boolean;
  muted?: boolean;
  /** Constrain to a readable line length. Off for text inside narrow cards. */
  measure?: boolean;
  style?: React.CSSProperties;
}) {
  const { c } = useDS();
  return (
    <p
      style={{
        ...(small ? t.bodySmall : t.body),
        color: muted ? c.muted : c.text,
        maxWidth: measure ? layout.measure : undefined,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

/** Wide-tracked uppercase label — buttons, tabs, badges, table headers. */
export function Label({
  children,
  color,
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) {
  const { c } = useDS();
  return (
    <span style={{ ...t.label, color: color ?? c.muted, textTransform: "uppercase", ...style }}>
      {children}
    </span>
  );
}
