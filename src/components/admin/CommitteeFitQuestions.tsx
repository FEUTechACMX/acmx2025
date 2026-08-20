"use client";

import React, { useEffect, useState } from "react";
import { Field, useDS } from "@/components/ds";
import { type as t } from "@/styles/design-system";
import { SectionLabel, AdminButton } from "./AdminShell";

export default function CommitteeFitQuestions({
  committeeId,
  readOnly,
}: {
  committeeId: string;
  readOnly: boolean;
}) {
  const { c } = useDS();
  const [texts, setTexts] = useState(["", "", ""]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/admin/committees/${committeeId}/questions`);
      const json = await res.json();
      if (json.ok && Array.isArray(json.questions)) {
        const next = ["", "", ""];
        for (const q of json.questions) {
          if (q.order >= 0 && q.order < 3) next[q.order] = q.text;
        }
        setTexts(next);
      }
    })();
  }, [committeeId]);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/committees/${committeeId}/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts }),
      });
      const json = await res.json().catch(() => ({}));
      setMessage(res.ok ? "Saved." : json.error ?? "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col" style={{ gap: 14, padding: 20, border: `1px solid ${c.rule}`, backgroundColor: c.panel }}>
      <SectionLabel>Committee-fit questions</SectionLabel>
      <span style={{ ...t.bodySmall, color: c.muted }}>
        Three statements, answered 1–7. ACMX copy can land later — save placeholders if needed.
      </span>
      {texts.map((text, i) => (
        <Field
          key={i}
          id={`fit-q-${i}`}
          label={`Statement ${i + 1}`}
          variant="boxed"
          value={text}
          disabled={readOnly}
          onChange={(e) =>
            setTexts((prev) => {
              const next = [...prev];
              next[i] = e.target.value;
              return next;
            })
          }
        />
      ))}
      {!readOnly && (
        <AdminButton disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Save questions"}
        </AdminButton>
      )}
      {message && <span style={{ ...t.bodySmall, color: c.muted }}>{message}</span>}
    </div>
  );
}
