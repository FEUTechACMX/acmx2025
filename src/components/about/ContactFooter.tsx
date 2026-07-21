"use client";

import React, { useState } from "react";
import { Rule, Heading, Label, useDS } from "@/components/ds";
import { layout, type as t, motion } from "@/styles/design-system";

const LINKS = [
  { label: "Email", href: "mailto:acm.feu.it@gmail.com", external: false },
  { label: "Facebook", href: "https://facebook.com/feutechACM", external: true },
  { label: "Instagram", href: "https://instagram.com/feutechACM", external: true },
];

function ContactLink({ label, href, external }: (typeof LINKS)[number]) {
  const { c } = useDS();
  const [hover, setHover] = useState(false);

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...t.label,
        textTransform: "uppercase",
        color: hover ? c.accent : c.muted,
        textDecoration: "none",
        transition: `color ${motion.fast}`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </a>
  );
}

/** Site footer — the eyebrow pattern inverted: rule above, links spread below. */
export default function ContactFooter() {
  const { c } = useDS();

  return (
    <footer style={{ paddingTop: `calc(${layout.gap} * 2)` }}>
      <Rule />
      <div
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between"
        style={{ paddingTop: layout.gap, gap: layout.gap }}
      >
        <div className="flex flex-col" style={{ gap: "0.6rem" }}>
          <Heading>ACMX</Heading>
          <Label style={{ color: c.faint }}>FEU Institute of Technology</Label>
        </div>

        <div className="flex items-center" style={{ gap: "clamp(1.25rem, 4vw, 3rem)" }}>
          {LINKS.map((link) => (
            <ContactLink key={link.label} {...link} />
          ))}
        </div>
      </div>
    </footer>
  );
}
