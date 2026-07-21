"use client";

import React from "react";
import Link from "next/link";
import { Surface, Column, PageHeader, Button, Panel, DataRow, Label, useDS } from "@/components/ds";
import { layout } from "@/styles/design-system";

/**
 * Shared shell for sections that aren't built yet. Reads as a deliberate
 * placeholder in the system's own language rather than an empty page.
 */
export default function ComingSoon({
  eyebrow,
  title,
  intro,
  detail,
}: {
  eyebrow: string[];
  title: string;
  intro: string;
  /** Key/value rows describing what will land here. */
  detail: { label: string; value: string }[];
}) {
  const { c } = useDS();

  return (
    <Surface corners="bottom-right">
      <Column>
        <PageHeader eyebrow={eyebrow} title={title} intro={intro} />

        <div
          className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-end"
          style={{ marginTop: `calc(${layout.gap} * 2)`, gap: layout.gap }}
        >
          <Panel style={{ maxWidth: "40rem", width: "100%" }}>
            <Label color={c.accent}>In Production</Label>
            <div style={{ marginTop: layout.gapTight }}>
              {detail.map((d) => (
                <DataRow key={d.label} label={d.label} value={d.value} />
              ))}
            </div>
          </Panel>

          <Link href="/events">
            <Button variant="outline" className="w-full lg:w-auto">
              Browse Events
            </Button>
          </Link>
        </div>
      </Column>
    </Surface>
  );
}
