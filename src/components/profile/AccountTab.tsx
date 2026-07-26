"use client";

import React, { useState } from "react";
import { useDS, Field, Button, Segmented } from "@/components/ds";
import { useTheme } from "@/components/ThemeProvider";
import { type as t, motion } from "@/styles/design-system";
import { roleLabel } from "@/types/auth";
import { validateAccount, type AccountField } from "@/lib/validation";
import { SectionLabel, RailPanel, formatDate, ordinalYear, type AccountDetails } from "./shared";

type EditableRow = { field: AccountField; label: string; type?: string };

const EDITABLE: EditableRow[] = [
  { field: "firstName", label: "First name" },
  { field: "middleName", label: "Middle name" },
  { field: "lastName", label: "Last name" },
  { field: "suffix", label: "Suffix" },
  { field: "personalEmail", label: "Personal email", type: "email" },
  { field: "contactNumber", label: "Contact number", type: "tel" },
  { field: "facebookLink", label: "Facebook link", type: "url" },
  { field: "discordName", label: "Discord username" },
  { field: "degreeProgram", label: "Degree program" },
  { field: "yearLevel", label: "Year level", type: "number" },
];

/**
 * Account details, edited one row at a time.
 *
 * A row swaps into an input in place rather than opening a dialog — a modal per
 * field would be four clicks to fix a typo. Each save PATCHes only the field
 * that changed, so a validation failure on one row can never roll back another.
 */
export default function AccountTab({
  account,
  loading,
  onSaved,
}: {
  account: AccountDetails | null;
  loading: boolean;
  onSaved: (patch: Partial<AccountDetails>) => void;
}) {
  const { c } = useDS();
  const { theme, toggleTheme } = useTheme();

  const [editing, setEditing] = useState<AccountField | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const begin = (row: EditableRow) => {
    if (!account) return;
    setEditing(row.field);
    setDraft(String(account[row.field] ?? ""));
    setError(null);
    setFlash(null);
  };

  const cancel = () => {
    setEditing(null);
    setDraft("");
    setError(null);
  };

  const save = async (row: EditableRow) => {
    // Client pass: identical rules to the route, just faster to reach.
    const local = validateAccount({ [row.field]: draft });
    if (!local.ok) {
      setError(local.errors[row.field] ?? "That value isn't valid.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(local.value),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.errors?.[row.field] ?? "Couldn't save that. Try again.");
        return;
      }

      onSaved(data.account);
      setEditing(null);
      setFlash(`${row.label} updated.`);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !account) {
    return (
      <div style={{ padding: "3rem 0" }}>
        <span style={{ ...t.bodySmall, color: c.faint }}>Loading your details…</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]" style={{ gap: "2.25rem" }}>
      <div className="flex flex-col" style={{ gap: "2.75rem" }}>
        <section>
          <SectionLabel>Identity</SectionLabel>

          {flash && (
            <p role="status" style={{ ...t.bodySmall, color: c.positive, padding: "0.75rem 0" }}>
              {flash}
            </p>
          )}

          {EDITABLE.map((row) => {
            const isEditing = editing === row.field;
            const value = account[row.field];

            return (
              <div
                key={row.field}
                className="flex flex-col sm:flex-row sm:items-center gap-3"
                style={{ padding: "1rem 0", borderBottom: `1px solid ${c.rule}` }}
              >
                <span
                  className="shrink-0"
                  style={{
                    ...t.label,
                    color: c.faint,
                    textTransform: "uppercase",
                    width: "11rem",
                  }}
                >
                  {row.label}
                </span>

                {isEditing ? (
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="flex-1">
                      <Field
                        id={`edit-${row.field}`}
                        label={row.label}
                        type={row.type ?? "text"}
                        value={draft}
                        error={error}
                        autoFocus
                        disabled={saving}
                        onChange={(e) => {
                          setDraft(e.target.value);
                          setError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") save(row);
                          if (e.key === "Escape") cancel();
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        onClick={() => save(row)}
                        disabled={saving}
                        style={{ padding: "0.6rem 1.1rem" }}
                      >
                        {saving ? "Saving…" : "Save"}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={cancel}
                        disabled={saving}
                        style={{ padding: "0.6rem 1.1rem" }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 min-w-0" style={{ ...t.body, color: c.text }}>
                      {row.field === "yearLevel"
                        ? ordinalYear(Number(value))
                        : String(value || "—")}
                    </span>
                    <button
                      onClick={() => begin(row)}
                      className="shrink-0 text-left"
                      style={{
                        ...t.label,
                        textTransform: "uppercase",
                        background: "transparent",
                        border: "none",
                        color: c.accent,
                        cursor: "pointer",
                        transition: `color ${motion.fast}`,
                      }}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            );
          })}

          {/* Admin-controlled. Shown, never editable — a member who thinks these
              are wrong needs an officer, not a text input. */}
          {[
            { label: "Student number", value: account.studentId },
            { label: "School email", value: account.schoolEmail },
            { label: "Role", value: roleLabel(account.role) },
          ].map((locked) => (
            <div
              key={locked.label}
              className="flex flex-col sm:flex-row sm:items-center gap-3"
              style={{ padding: "1rem 0", borderBottom: `1px solid ${c.rule}` }}
            >
              <span
                className="shrink-0"
                style={{ ...t.label, color: c.faint, textTransform: "uppercase", width: "11rem" }}
              >
                {locked.label}
              </span>
              <span className="flex-1 min-w-0" style={{ ...t.body, color: c.muted }}>
                {locked.value}
              </span>
              <span
                className="shrink-0"
                style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}
              >
                Locked
              </span>
            </div>
          ))}
        </section>

        <section>
          <SectionLabel>Preferences</SectionLabel>
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ padding: "1.1rem 0", borderBottom: `1px solid ${c.rule}` }}
          >
            <div className="flex flex-col" style={{ gap: "0.3rem" }}>
              <span style={{ ...t.label, color: c.text, textTransform: "uppercase" }}>
                Appearance
              </span>
              <span style={{ ...t.bodySmall, color: c.faint }}>
                Saved to this browser. Matches the switch in the nav bar.
              </span>
            </div>
            <Segmented
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
              value={theme}
              onChange={(next) => {
                if (next !== theme) toggleTheme();
              }}
            />
          </div>
        </section>
      </div>

      <aside className="flex flex-col" style={{ gap: "1.75rem" }}>
        <RailPanel title="Account status">
          <div style={{ padding: "0.4rem 1.15rem 1rem" }}>
            {[
              ["Member since", formatDate(account.createdAt)],
              ["Standing", roleLabel(account.role)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-4"
                style={{ padding: "0.7rem 0", borderBottom: `1px solid ${c.rule}` }}
              >
                <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>
                  {label}
                </span>
                <span style={{ ...t.mono, color: c.text }}>{value}</span>
              </div>
            ))}
          </div>
        </RailPanel>
      </aside>
    </div>
  );
}
