"use client";

import React, { useState } from "react";
import { type as t, motion } from "@/styles/design-system";
import { useDS } from "./useDS";

/**
 * Underlined input. No box, no radius — the hairline rule doubles as the
 * field boundary and turns accent on focus.
 */
export function Field({
  label,
  id,
  trailing,
  style,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  /** Slot at the right edge — e.g. a show/hide password toggle. */
  trailing?: React.ReactNode;
}) {
  const { c } = useDS();
  const [focus, setFocus] = useState(false);

  return (
    <div className="flex flex-col" style={{ gap: "0.5rem" }}>
      <label htmlFor={id} style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          {...rest}
          id={id}
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
            border: "none",
            borderBottom: `1px solid ${focus ? c.accent : c.rule}`,
            borderRadius: 0,
            outline: "none",
            padding: `0.6rem ${trailing ? "2.25rem" : "0"} 0.6rem 0`,
            transition: `border-color ${motion.fast}`,
            ...style,
          }}
        />
        {trailing && <div className="absolute right-0 flex items-center">{trailing}</div>}
      </div>
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
