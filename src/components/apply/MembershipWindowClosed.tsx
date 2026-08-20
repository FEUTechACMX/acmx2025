"use client";

import React from "react";
import Link from "next/link";
import { Surface, Column, PageHeader, Panel, Body, Button, useDS } from "@/components/ds";
import { layout, type as t } from "@/styles/design-system";
import type { WindowState } from "@/lib/campaign-windows";

export default function MembershipWindowClosed({ window }: { window: WindowState }) {
  const { c } = useDS();

  const title =
    window.open === false && window.phase === "before"
      ? (
          <>
            OPENS
            <br />
            SOON
          </>
        )
      : (
          <>
            REGISTRATION
            <br />
            CLOSED
          </>
        );

  const copy =
    window.open === false && window.phase === "before" && window.start
      ? `Membership registration opens ${window.start} and runs through ${window.end}.`
      : window.open === false && window.phase === "after" && window.end
        ? `The membership drive closed on ${window.end}.`
        : "Membership registration is not open right now.";

  return (
    <Surface corners="top-left">
      <Column>
        <PageHeader
          eyebrow={["MEMBERSHIP", "DRIVE"]}
          title={title}
          intro={<Body>{copy}</Body>}
        />
        <Panel style={{ marginTop: layout.gap, maxWidth: "32rem" }}>
          <p style={{ ...t.bodySmall, color: c.muted, margin: 0 }}>
            Existing members can still sign in. New applicants: check back during the drive
            window.
          </p>
          <div style={{ marginTop: "1.25rem" }}>
            <Link href="/login">
              <Button variant="outline">Sign in</Button>
            </Link>
          </div>
        </Panel>
      </Column>
    </Surface>
  );
}
