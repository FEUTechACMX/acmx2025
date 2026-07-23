"use client";

import React, { useEffect, useRef } from "react";
import ContinuosAnimation from "@/components/UI/ContinousAnimation";
import { texture, layout } from "@/styles/design-system";
import { runBlinkIn } from "@/lib/blink";
import { useDS } from "./useDS";

type Corners = "both" | "top-left" | "bottom-right" | "none";

type SurfaceProps = {
  children: React.ReactNode;
  /**
   * Edge-bleed diamond animations. Each renders six layered SVGs, so
   * scroll-heavy pages should use a single corner or none.
   */
  corners?: Corners;
  /** Fill the viewport even when content is short. */
  fullHeight?: boolean;
  className?: string;
};

const CORNER_SIZE = "clamp(200px, 28vw, 380px)";

/**
 * The page substrate: concrete-textured surface, optional corner motion.
 * Every page in the system sits inside one of these.
 */
export default function Surface({
  children,
  corners = "none",
  fullHeight = true,
  className = "",
}: SurfaceProps) {
  const { c, isDark } = useDS();
  const tex = isDark ? texture.dark : texture.light;

  const showTopLeft = corners === "both" || corners === "top-left";
  const showBottomRight = corners === "both" || corners === "bottom-right";

  return (
    <div
      className={`relative w-full overflow-hidden ${fullHeight ? "min-h-[100dvh]" : ""} ${className}`}
      style={{ backgroundColor: c.surface }}
    >
      {/* Concrete grain */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          backgroundImage: `url(${texture.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          mixBlendMode: tex.mixBlendMode,
          opacity: tex.opacity,
        }}
      />

      {showTopLeft && (
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 z-10 pointer-events-none"
          style={{
            width: CORNER_SIZE,
            aspectRatio: "1",
            transform: "translate(-35%, -35%) rotate(-90deg)",
          }}
        >
          <ContinuosAnimation size={380} />
        </div>
      )}

      {showBottomRight && (
        <div
          aria-hidden="true"
          className="absolute right-0 bottom-0 z-10 pointer-events-none"
          style={{
            width: CORNER_SIZE,
            aspectRatio: "1",
            transform: "translate(35%, 35%) rotate(90deg)",
          }}
        >
          <ContinuosAnimation size={380} />
        </div>
      )}

      <div className="relative z-10" style={{ minHeight: fullHeight ? "100dvh" : undefined }}>
        {children}
      </div>
    </div>
  );
}

/** Standard interior-page content column: gutters + nav clearance. */
export function Column({
  children,
  className = "",
  style,
  reveal = true,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Blink the column's direct children in on mount. Opt out on pages that
   *  drive their own section animations. */
  reveal?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reveal || !ref.current) return;
    runBlinkIn(ref.current.children);
  }, [reveal]);

  return (
    <div
      ref={ref}
      className={`flex flex-col w-full ${className}`}
      style={{
        padding: `${layout.topPad} ${layout.gutter} ${layout.bottomPad}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
