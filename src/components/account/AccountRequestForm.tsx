"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Surface,
  Column,
  PageHeader,
  Panel,
  Button,
  Field,
  Body,
  useDS,
} from "@/components/ds";
import { layout, type as t } from "@/styles/design-system";
import { check, hasErrors, studentNumber, STUDENT_NUMBER_INVALID } from "@/lib/validation";

const COPY = {
  claim: {
    title: "Claim your account",
    intro: "Enter your student number. We'll email a sign-in link to your FEU Tech email.",
  },
  reset: {
    title: "Reset your password",
    intro: "Enter your student number. We'll email a reset link to your FEU Tech email.",
  },
} as const;

/**
 * Shared claim / reset request form. Both post to the same API; the server
 * still chooses CLAIM vs RESET from mustChangePassword. Distinct pages only.
 */
export default function AccountRequestForm({ kind }: { kind: "claim" | "reset" }) {
  const { c } = useDS();
  const copy = COPY[kind];
  const [studentId, setStudentId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFieldError(null);
    setFormError(null);
    setMessage(null);

    const local = check({ studentId }, { studentId: [studentNumber()] });
    if (hasErrors(local)) {
      setFieldError(local.studentId ?? STUDENT_NUMBER_INVALID);
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/account/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = typeof json.error === "string" ? json.error : "Could not send the request.";
        if (err === STUDENT_NUMBER_INVALID) setFieldError(err);
        else setFormError(err);
        return;
      }
      setMessage(
        json.message ??
          "If that student number is on file, check your FEU Tech email for the link."
      );
    } catch {
      setFormError("Could not send the request. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Surface corners="top-left">
      <Column>
        <PageHeader
          eyebrow={["ACCOUNT", "SECURITY"]}
          title={copy.title}
          intro={<Body>{copy.intro}</Body>}
        />

        <Panel style={{ marginTop: layout.gap, maxWidth: "28rem", width: "100%" }}>
          {message ? (
            <div className="flex flex-col" style={{ gap: "1rem" }}>
              <p style={{ ...t.body, color: c.text, margin: 0 }}>{message}</p>
              <Link href="/login">
                <Button variant="outline" block>
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col" style={{ gap: layout.gap }}>
              <Field
                id={`${kind}-studentId`}
                label="Student number"
                variant="boxed"
                value={studentId}
                error={fieldError}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  if (fieldError) setFieldError(null);
                }}
                autoComplete="username"
                inputMode="numeric"
              />
              {formError && (
                <p role="alert" style={{ ...t.bodySmall, color: c.danger, margin: 0 }}>
                  {formError}
                </p>
              )}
              <Button type="submit" disabled={busy || !studentId.trim()} block>
                {busy ? "Sending…" : "Email me the link"}
              </Button>
            </form>
          )}
        </Panel>
      </Column>
    </Surface>
  );
}
