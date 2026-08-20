"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { PASSWORD_MIN, validatePasswordStrength } from "@/lib/validation";

export default function AccountClaimForm({
  tokenValid,
}: {
  /** Server already checked hash / expiry / used; false → expired UI. */
  tokenValid: boolean;
}) {
  const { c } = useDS();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [busy, setBusy] = useState(false);

  const clientHint = useMemo(
    () => validatePasswordStrength(newPassword, {}, "Password"),
    [newPassword]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors({});

    if (confirmPassword !== newPassword) {
      setFieldErrors({ confirmPassword: "The two passwords don't match." });
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/account/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const nextErrors =
          json.errors && typeof json.errors === "object"
            ? (json.errors as Record<string, string | undefined>)
            : {};
        setFieldErrors(nextErrors);
        const top = typeof json.error === "string" ? json.error : null;
        const onField = top != null && Object.values(nextErrors).some((m) => m === top);
        if (top && !onField) setError(top);
        else if (!top && Object.keys(nextErrors).length === 0) {
          setError("Could not save password.");
        }
        return;
      }
      router.push("/login");
    } catch {
      setError("Could not save password. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!tokenValid) {
    return (
      <Surface corners="top-left">
        <Column>
          <PageHeader
            eyebrow={["ACCOUNT", "SECURITY"]}
            title={
              <>
                LINK
                <br />
                EXPIRED
              </>
            }
            intro={
              <Body>
                This link has expired or was already used. Request a new one from the sign-in
                page.
              </Body>
            }
          />
          <Link href="/account/claim-account" style={{ marginTop: layout.gap }}>
            <Button>Request a new link</Button>
          </Link>
        </Column>
      </Surface>
    );
  }

  return (
    <Surface corners="top-left">
      <Column>
        <PageHeader
          eyebrow={["ACCOUNT", "SECURITY"]}
          title={
            <>
              SET YOUR
              <br />
              PASSWORD
            </>
          }
          intro={
            <Body>
              Choose a strong password (at least {PASSWORD_MIN} characters, with a mix of letter
              cases, numbers, or symbols). You will sign in with it next — this page does not log
              you in automatically.
            </Body>
          }
        />

        <Panel style={{ marginTop: layout.gap, maxWidth: "28rem", width: "100%" }}>
          <form onSubmit={submit} className="flex flex-col" style={{ gap: layout.gap }}>
            <Field
              id="newPassword"
              label="New password"
              type="password"
              variant="boxed"
              value={newPassword}
              error={fieldErrors.newPassword}
              hint={clientHint && newPassword ? clientHint : undefined}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <Field
              id="confirmPassword"
              label="Confirm password"
              type="password"
              variant="boxed"
              value={confirmPassword}
              error={fieldErrors.confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            {error && (
              <p role="alert" style={{ ...t.bodySmall, color: c.danger, margin: 0 }}>
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy || !newPassword} block>
              {busy ? "Saving…" : "Save password"}
            </Button>
          </form>
        </Panel>
      </Column>
    </Surface>
  );
}
