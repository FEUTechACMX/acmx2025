"use client";

import { Surface, Column, PageHeader, Panel, Body, useDS } from "@/components/ds";
import { type as t } from "@/styles/design-system";

export default function FitCard({
  firstName,
  committeeName,
  mandateExcerpt,
  score,
}: {
  firstName: string;
  committeeName: string;
  mandateExcerpt: string;
  score: number;
}) {
  const { c } = useDS();
  return (
    <Surface corners="both">
      <Column>
        <PageHeader eyebrow={["COMMITTEE", "FIT"]} title={firstName.toUpperCase()} />
        <Panel>
          <div className="flex flex-col" style={{ gap: "1rem" }}>
            <span style={{ ...t.heading, color: c.accent }}>{committeeName}</span>
            {mandateExcerpt ? <Body>{mandateExcerpt}</Body> : null}
            <span style={{ ...t.label, color: c.faint }}>SCORE</span>
            <span style={{ ...t.display, color: c.text, fontSize: "2.5rem" }}>
              {score} / 21
            </span>
          </div>
        </Panel>
      </Column>
    </Surface>
  );
}
