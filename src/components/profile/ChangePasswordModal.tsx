"use client";

import React, { useMemo, useState } from "react";
import { Modal, Field, Button, useDS, type ModalMessage } from "@/components/ds";
import { type as t } from "@/styles/design-system";
import {
  validatePasswordChange,
  passwordStrength,
  hasErrors,
  PASSWORD_MIN,
  type FieldErrors,
} from "@/lib/validation";

type Status = "idle" | "submitting" | "success";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

/**
 * Change password, as a dialog.
 *
 * Validation runs twice on purpose. Here it is instant and advisory — a field
 * goes red on blur, the submit button never fires a request that is certain to
 * fail. The identical rules run again in `/api/change-password`, which is the
 * copy that actually decides. This layer can be bypassed; that one can't.
 *
 * Only the server can judge whether the current password is right, so that one
 * error arrives from the response and is pinned onto the field it belongs to.
 */
export default function ChangePasswordModal({
  open,
  onClose,
  email,
}: {
  open: boolean;
  onClose: () => void;
  email?: string;
}) {
  const { c } = useDS();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [reveal, setReveal] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string>("");

  const strength = useMemo(() => passwordStrength(values.newPassword), [values.newPassword]);
  const dirty = status === "idle" && Object.values(values).some(Boolean);

  const close = () => {
    setValues(EMPTY);
    setErrors({});
    setTouched({});
    setStatus("idle");
    setServerError(null);
    setReveal(false);
    onClose();
  };

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    // Clear a field's error as soon as it's edited — keeping it visible while
    // the user is actively fixing it just nags.
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setServerError(null);
  };

  /** Validate on blur, but only surface errors for fields already visited. */
  const blur = (key: keyof typeof EMPTY) => () => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const found = validatePasswordChange(values);
    setErrors((prev) => ({ ...prev, [key]: found[key] }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const found = validatePasswordChange(values);
    if (hasErrors(found)) {
      setErrors(found);
      setTouched({ currentPassword: true, newPassword: true, confirmPassword: true });
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatus("idle");
        if (data.errors) setErrors(data.errors);
        setServerError(data.message ?? "That didn't work. Try again.");
        return;
      }

      setCompletedAt(
        new Date().toLocaleString("en-PH", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      setStatus("success");
    } catch {
      setStatus("idle");
      setServerError("Couldn't reach the server. Check your connection and try again.");
    }
  };

  const message: ModalMessage | null =
    status === "success"
      ? { tone: "positive", text: "Password updated." }
      : status === "submitting"
        ? { tone: "accent", text: "Verifying and updating your credentials…" }
        : serverError
          ? { tone: "danger", text: serverError }
          : null;

  const show = (key: keyof typeof EMPTY) => (touched[key] ? errors[key] : undefined);

  return (
    <Modal
      open={open}
      onClose={close}
      dirty={dirty}
      labelledBy="change-password-title"
      title={status === "success" ? "All set" : "Change password"}
      subtitle={status === "success" ? completedAt : email}
      message={message}
      footer={
        status === "success" ? (
          <>
            <span style={{ ...t.bodySmall, color: c.faint }}>
              Your other devices have been signed out.
            </span>
            <Button onClick={close} style={{ padding: "0.7rem 1.5rem" }}>
              Done
            </Button>
          </>
        ) : (
          <>
            <span style={{ ...t.bodySmall, color: c.faint }}>
              Signs out your other devices.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                onClick={close}
                disabled={status === "submitting"}
                style={{ padding: "0.7rem 1.25rem" }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="change-password-form"
                disabled={status === "submitting"}
                style={{ padding: "0.7rem 1.25rem" }}
              >
                {status === "submitting" ? "Updating…" : "Update password"}
              </Button>
            </div>
          </>
        )
      }
    >
      {status === "success" ? (
        <div className="flex flex-col items-center text-center" style={{ gap: "1rem", padding: "1rem 0" }}>
          <span aria-hidden="true" style={{ fontSize: "2.5rem", lineHeight: 1, color: c.positive }}>
            ✓
          </span>
          <h3 style={{ ...t.subheading, fontSize: "1.15rem", color: c.text, margin: 0 }}>
            Your password was changed
          </h3>
          <p style={{ ...t.bodySmall, color: c.muted, margin: 0, maxWidth: "26rem" }}>
            Use your new password the next time you sign in. If this wasn&apos;t you, contact an
            officer immediately.
          </p>
        </div>
      ) : (
        <form
          id="change-password-form"
          onSubmit={submit}
          className="flex flex-col"
          style={{ gap: "1.4rem", opacity: status === "submitting" ? 0.55 : 1 }}
        >
          <Field
            variant="boxed"
            id="current-password"
            label="Current password"
            type={reveal ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter current password"
            value={values.currentPassword}
            onChange={set("currentPassword")}
            onBlur={blur("currentPassword")}
            error={show("currentPassword")}
            disabled={status === "submitting"}
          />

          <div className="flex flex-col" style={{ gap: "0.65rem" }}>
            <Field
              variant="boxed"
              id="new-password"
              label="New password"
              type={reveal ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter new password"
              value={values.newPassword}
              onChange={set("newPassword")}
              onBlur={blur("newPassword")}
              error={show("newPassword")}
              disabled={status === "submitting"}
              hint={`At least ${PASSWORD_MIN} characters, including one number.`}
              trailing={
                <button
                  type="button"
                  onClick={() => setReveal((r) => !r)}
                  aria-label={reveal ? "Hide passwords" : "Show passwords"}
                  style={{
                    ...t.label,
                    background: "transparent",
                    border: "none",
                    color: c.faint,
                    cursor: "pointer",
                    textTransform: "uppercase",
                  }}
                >
                  {reveal ? "Hide" : "Show"}
                </button>
              }
            />

            {/* Advisory only — the hard gate is the rule in the hint above. */}
            {values.newPassword && (
              <div className="flex items-center" style={{ gap: "0.9rem" }}>
                <div className="flex flex-1" style={{ gap: "0.3rem" }} aria-hidden="true">
                  {[1, 2, 3, 4].map((step) => (
                    <span
                      key={step}
                      style={{
                        height: 3,
                        flex: 1,
                        backgroundColor: step <= strength.score ? c.accent : c.rule,
                      }}
                    />
                  ))}
                </div>
                <span style={{ ...t.label, color: c.accent, textTransform: "uppercase" }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <Field
            variant="boxed"
            id="confirm-password"
            label="Confirm new password"
            type={reveal ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter new password"
            value={values.confirmPassword}
            onChange={set("confirmPassword")}
            onBlur={blur("confirmPassword")}
            error={show("confirmPassword")}
            disabled={status === "submitting"}
          />
        </form>
      )}
    </Modal>
  );
}
