"use client";

import React, { useId, useState } from "react";
import { type as t, motion } from "@/styles/design-system";
import { useDS } from "./useDS";

/**
 * Text input. Two shapes, same anatomy:
 *
 * - `underline` (default) — the hairline rule doubles as the field boundary.
 *   Right for forms sitting directly on the page substrate.
 * - `boxed` — a full hairline border. Right inside modals and panels, where an
 *   underline alone loses its edge against a filled surface.
 *
 * `error` takes over the border and prints the message below. It is announced
 * with `role="alert"` and wired to the input through `aria-describedby`, so the
 * failure reaches a screen reader instead of only the sighted user.
 */
export function Field({
  label,
  id,
  trailing,
  variant = "underline",
  error,
  hint,
  style,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  /** Slot at the right edge — e.g. a show/hide password toggle. */
  trailing?: React.ReactNode;
  variant?: "underline" | "boxed";
  /** Validation message. Presence alone switches the field to its error skin. */
  error?: string | null;
  /** Persistent helper text. Hidden while an error is showing. */
  hint?: string;
}) {
  const { c } = useDS();
  const [focus, setFocus] = useState(false);
  const messageId = useId();

  const boxed = variant === "boxed";
  const edge = error ? c.danger : focus ? c.accent : c.rule;

  return (
    <div className="flex flex-col" style={{ gap: "0.5rem" }}>
      <label
        htmlFor={id}
        style={{
          ...t.label,
          color: error ? c.danger : focus ? c.text : c.faint,
          textTransform: "uppercase",
          transition: `color ${motion.fast}`,
        }}
      >
        {label}
      </label>

      <div className="relative flex items-center">
        <input
          {...rest}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          onFocus={(e) => {
            setFocus(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            rest.onBlur?.(e);
          }}
          style={{
            ...t.body,
            width: "100%",
            background: "transparent",
            color: c.text,
            border: boxed ? `1px solid ${edge}` : "none",
            borderBottom: `1px solid ${edge}`,
            borderRadius: 0,
            outline: "none",
            padding: boxed
              ? `0.75rem ${trailing ? "2.5rem" : "0.85rem"} 0.75rem 0.85rem`
              : `0.6rem ${trailing ? "2.25rem" : "0"} 0.6rem 0`,
            transition: `border-color ${motion.fast}`,
            ...style,
          }}
        />
        {trailing && (
          <div
            className="absolute flex items-center"
            style={{ right: boxed ? "0.85rem" : 0 }}
          >
            {trailing}
          </div>
        )}
      </div>

      {(error || hint) && (
        <span
          id={messageId}
          role={error ? "alert" : undefined}
          style={{
            ...t.bodySmall,
            color: error ? c.danger : c.faint,
          }}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
}

/**
 * Segmented selector — flush hairline-joined cells, active cell fills accent.
 * Replaces pill/tab groups across the system.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { c } = useDS();

  return (
    <div className="inline-flex" style={{ border: `1px solid ${c.rule}` }}>
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              ...t.label,
              textTransform: "uppercase",
              padding: "0.7rem 1.5rem",
              cursor: "pointer",
              border: "none",
              borderLeft: i === 0 ? "none" : `1px solid ${c.rule}`,
              backgroundColor: selected ? c.accent : "transparent",
              color: selected ? "#ffffff" : c.muted,
              transition: `background-color ${motion.fast}, color ${motion.fast}`,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
