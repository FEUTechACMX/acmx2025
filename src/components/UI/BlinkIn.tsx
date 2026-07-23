"use client";

import React, { useEffect, useRef } from "react";
import { runBlinkIn } from "@/lib/blink";

/**
 * Wrapper that blinks its content in on mount. Uses `display: contents` so it
 * never affects layout. Targets `[data-blink]` descendants if any are present,
 * otherwise blinks its own direct children (staggered).
 *
 * Pass `ready` to gate the reveal until async content has rendered.
 */
export default function BlinkIn({
  children,
  ready = true,
  stagger,
  selector,
}: {
  children: React.ReactNode;
  ready?: boolean;
  stagger?: number;
  selector?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || !ref.current) return;
    const sel = selector ?? "[data-blink]";
    const tagged = ref.current.querySelectorAll(sel);
    const targets = tagged.length ? tagged : ref.current.children;
    runBlinkIn(targets, stagger !== undefined ? { stagger } : undefined);
  }, [ready, stagger, selector]);

  return (
    <div ref={ref} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
