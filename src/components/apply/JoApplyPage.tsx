"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Surface,
  Column,
  PageHeader,
  Panel,
  Button,
  Segmented,
  Body,
  useDS,
} from "@/components/ds";
import { layout, type as t } from "@/styles/design-system";
import { computeBestFit } from "@/lib/jo-fit";

const LIKERT: { value: string; label: string }[] = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
];

type Committee = {
  id: string;
  name: string;
  mandate: string | null;
  blurb: string | null;
  questions: { id: string; order: number; text: string }[];
};

export default function JoApplyPage() {
  const { c } = useDS();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/jo/committees");
      const json = await res.json();
      if (json.ok) {
        setCommittees(json.committees);
        const seed: Record<string, number> = {};
        for (const co of json.committees as Committee[]) {
          for (const q of co.questions) seed[q.id] = 4;
        }
        setAnswers(seed);
      }
    })();
  }, []);

  const questions = useMemo(
    () => committees.flatMap((co) => co.questions.map((q) => ({ id: q.id, committeeId: co.id }))),
    [committees]
  );
  const ranked = computeBestFit(answers, questions);
  const suggested = ranked[0]?.committeeId ?? "";
  const chosen = target || suggested;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/jo/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCommitteeId: chosen,
          answers,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not submit.");
        return;
      }
      setShareToken(json.shareToken);
    } finally {
      setBusy(false);
    }
  }

  if (shareToken) {
    const url = `/fit/${shareToken}`;
    return (
      <Surface corners="top-left">
        <Column>
          <PageHeader eyebrow={["JO", "APPLICATION"]} title="SUBMITTED" />
          <Panel>
            <div className="flex flex-col" style={{ gap: "1rem" }}>
              <Body>Officers will shortlist from here. The interview scheduler stays hidden until you are shortlisted.</Body>
              <Body small>Share your committee-fit card:</Body>
              <Link href={url} style={{ color: c.accent }}>
                {url}
              </Link>
              <Button type="button" variant="outline" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}${url}`)}>
                Copy link
              </Button>
            </div>
          </Panel>
        </Column>
      </Surface>
    );
  }

  return (
    <Surface corners="top-left">
      <Column>
        <PageHeader
          eyebrow={["JUNIOR", "OFFICER"]}
          title={
            <>
              COMMITTEE
              <br />
              FIT
            </>
          }
          intro={
            <Body>
              Three statements per committee, 1 (disagree) to 7 (agree). The running totals suggest a
              best fit — you can still pick another committee before submitting.
            </Body>
          }
        />

        <form onSubmit={submit} className="flex flex-col" style={{ gap: layout.gap, marginTop: layout.gap }}>
          {committees.map((co) => (
            <Panel key={co.id}>
              <div className="flex flex-col" style={{ gap: "1rem" }}>
                <span style={{ ...t.label, color: c.faint }}>{co.name}</span>
                <Body small>{co.blurb || co.mandate || ""}</Body>
                {co.questions.map((q) => (
                  <div key={q.id} className="flex flex-col" style={{ gap: "0.5rem" }}>
                    <span style={{ ...t.bodySmall, color: c.text }}>{q.text}</span>
                    <Segmented
                      options={LIKERT}
                      value={String(answers[q.id] ?? "4")}
                      onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: Number(v) }))}
                    />
                  </div>
                ))}
              </div>
            </Panel>
          ))}

          {ranked.length > 0 && (
            <Panel>
              <div className="flex flex-col" style={{ gap: "0.75rem" }}>
                <span style={{ ...t.label, color: c.faint }}>BEST FIT (OUT OF 21)</span>
                {ranked.map((r) => {
                  const name = committees.find((c) => c.id === r.committeeId)?.name ?? r.committeeId;
                  return (
                    <span key={r.committeeId} style={{ ...t.bodySmall, color: c.text }}>
                      {name} · {r.total}
                    </span>
                  );
                })}
                <span style={{ ...t.label, color: c.faint }}>SUBMIT TO</span>
                <Segmented
                  options={committees.map((co) => ({ value: co.id, label: co.name }))}
                  value={chosen}
                  onChange={setTarget}
                />
              </div>
            </Panel>
          )}

          {error && (
            <p role="alert" style={{ ...t.bodySmall, color: c.danger, margin: 0 }}>
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy || committees.length === 0}>
            {busy ? "Submitting…" : "Submit JO application"}
          </Button>
        </form>
      </Column>
    </Surface>
  );
}
