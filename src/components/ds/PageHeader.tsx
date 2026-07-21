"use client";

import React from "react";
import { layout } from "@/styles/design-system";
import { Eyebrow, Title, Rule, Body } from "./Text";

/**
 * The masthead every interior page opens with — the hero's
 * eyebrow → rule → headline → rule stack, one scale step down.
 */
export default function PageHeader({
  eyebrow,
  title,
  intro,
  aside,
}: {
  /** Array spreads edge-to-edge like the hero's CODE · IN · THE · COSMOS. */
  eyebrow: string | string[];
  title: React.ReactNode;
  intro?: React.ReactNode;
  /** Right-aligned slot on the title's baseline — actions, counts. */
  aside?: React.ReactNode;
}) {
  return (
    <header>
      <Eyebrow words={eyebrow} />

      <div
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between"
        style={{ paddingTop: "0.5rem", gap: "1rem" }}
      >
        <Title>{title}</Title>
        {aside && <div className="shrink-0 pb-1">{aside}</div>}
      </div>

      <Rule margin="0.5rem 0 0" />

      {intro && (
        <div style={{ marginTop: layout.gap }}>
          {typeof intro === "string" ? <Body>{intro}</Body> : intro}
        </div>
      )}
    </header>
  );
}
