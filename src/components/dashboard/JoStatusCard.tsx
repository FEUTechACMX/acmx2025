"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Panel, Button, Label, useDS } from "@/components/ds";
import { type as t } from "@/styles/design-system";

type JoState = {
  status: string;
  shareToken: string;
  targetCommitteeName: string;
  booking: { startsAt: string; location: string } | null;
} | null;

type JoWindowDto =
  | { open: true; start: string; end: string }
  | { open: false; phase: "before" | "after" | "unconfigured"; start: string | null; end: string | null };

const STATUS_COPY: Record<string, string> = {
  PENDING: "Awaiting officer shortlist.",
  SHORTLISTED: "You are shortlisted — pick an interview slot.",
  ACCEPTED: "Welcome. You have been seated on your committee.",
  WAITLISTED: "On the waitlist for that committee. A seat may open later.",
  REJECTED: "Not selected this call. You remain a member.",
};

export default function JoStatusCard() {
  const { c } = useDS();
  const [state, setState] = useState<JoState | "loading">("loading");
  const [window, setWindow] = useState<JoWindowDto | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/jo/apply");
      const json = await res.json().catch(() => ({}));
      if (json.ok) {
        setState(json.application);
        setWindow(json.joWindow ?? null);
      } else setState(null);
    })();
  }, []);

  if (state === "loading") return null;

  const joOpen = window?.open === true;

  return (
    <Panel padded={false} style={{ padding: "clamp(0.9rem, 1.6vh, 1.35rem)" }}>
      <div className="flex flex-col" style={{ gap: "0.75rem" }}>
        <Label color={c.accent}>JUNIOR OFFICER</Label>
        {state ? (
          <>
            <span style={{ ...t.bodySmall, color: c.text }}>
              {state.targetCommitteeName} · {state.status}
            </span>
            <span style={{ ...t.bodySmall, color: c.muted }}>
              {STATUS_COPY[state.status] ?? state.status}
            </span>
            {state.status === "SHORTLISTED" && (
              <Link href="/interview/schedule">
                <Button block>Pick interview slot</Button>
              </Link>
            )}
          </>
        ) : joOpen ? (
          <>
            <span style={{ ...t.bodySmall, color: c.muted }}>
              Members can apply as a Junior Officer. The public site never shows this.
            </span>
            <Link href="/apply/jo">
              <Button block variant="outline">
                Open JO application
              </Button>
            </Link>
          </>
        ) : (
          <span style={{ ...t.bodySmall, color: c.muted }}>
            {window?.phase === "before" && window.start
              ? `JO applications open ${window.start}.`
              : window?.phase === "after" && window.end
                ? `JO applications closed on ${window.end}.`
                : "JO applications are not open right now."}
          </span>
        )}
      </div>
    </Panel>
  );
}
