"use client";

import React, { useState } from "react";
import { type as t, motion } from "@/styles/design-system";
import { useDS } from "./useDS";

type Variant = "solid" | "outline" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  /** Stretch to the container width. */
  block?: boolean;
};

/**
 * Square-cornered, wide-tracked. No radius, no shadow — the accent block
 * from the hero's LEARN MORE, plus a hairline outline and a bare text variant.
 */
export default function Button({
  variant = "solid",
  block = false,
  style,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const { c } = useDS();
  const [hover, setHover] = useState(false);
  const active = hover && !disabled;

  const variants: Record<Variant, React.CSSProperties> = {
    solid: {
      backgroundColor: active ? c.accentHover : c.accent,
      color: "#ffffff",
      border: "none",
    },
    outline: {
      backgroundColor: active ? c.accent : "transparent",
      color: active ? "#ffffff" : c.accent,
      border: `1px solid ${c.accent}`,
    },
    ghost: {
      backgroundColor: "transparent",
      color: active ? c.text : c.muted,
      border: `1px solid ${active ? c.ruleStrong : c.rule}`,
    },
  };

  return (
    <button
      {...rest}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...t.label,
        textTransform: "uppercase",
        padding: "0.8rem 2.25rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        whiteSpace: "nowrap",
        width: block ? "100%" : undefined,
        transition: `background-color ${motion.fast}, color ${motion.fast}, border-color ${motion.fast}`,
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
