"use client";

import React from "react";
import Section from "./Section";
import { Body, Rule, useDS } from "@/components/ds";
import { layout, type as t } from "@/styles/design-system";

const AIMS = [
  "An increased knowledge of and greater interest in science, design, development, construction, languages, management, and applications of modern computing.",
  "Greater interest in computing and its applications.",
  "A means of communication between persons having an interest in computing.",
];

export default function Mission() {
  const { c } = useDS();

  return (
    <Section index="02" label="Mission" heading="MISSION">
      <Body>
        The chapter is organized and will be operated exclusively for educational and scientific
        purposes, to promote:
      </Body>

      <div style={{ marginTop: layout.gapTight, maxWidth: layout.measure }}>
        {AIMS.map((aim, i) => (
          <div key={aim}>
            <Rule />
            <div
              className="grid grid-cols-[2.5rem_1fr]"
              style={{ padding: "0.9rem 0", alignItems: "start" }}
            >
              <span style={{ ...t.label, color: c.accent }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <Body measure={false}>{aim}</Body>
            </div>
          </div>
        ))}
        <Rule />
      </div>
    </Section>
  );
}
