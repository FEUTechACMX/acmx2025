/**
 * Kourai's Design System
 * ──────────────────────────────────────────────────────────────
 * Tokens derived from the /hero landing page. Editorial-brutalist:
 * concrete surfaces, Monument Extended display type, hairline rules,
 * hard 90° corners, a single accent.
 *
 * Consume via the `useDS()` hook (client) or import tokens directly.
 */

export type Theme = "light" | "dark";

/* ── Colour ─────────────────────────────────────────────────── */

export const accent = {
  base: "#CF78EC",
  hover: "#b85cd6",
  /** Tinted wash for selected / active states. */
  wash: "rgba(207, 120, 236, 0.12)",
} as const;

export const palette = {
  light: {
    /** Warm concrete page surface. */
    surface: "#e8e3db",
    /** Slightly recessed panel sitting on `surface`. */
    panel: "rgba(26, 26, 26, 0.03)",
    text: "#1a1a1a",
    muted: "rgba(26, 26, 26, 0.65)",
    faint: "rgba(26, 26, 26, 0.4)",
    rule: "rgba(26, 26, 26, 0.2)",
    ruleStrong: "rgba(26, 26, 26, 0.45)",
  },
  dark: {
    surface: "#26252a",
    panel: "rgba(255, 255, 255, 0.04)",
    text: "#ffffff",
    muted: "rgba(255, 255, 255, 0.7)",
    faint: "rgba(255, 255, 255, 0.45)",
    rule: "rgba(255, 255, 255, 0.2)",
    ruleStrong: "rgba(255, 255, 255, 0.45)",
  },
} as const;

export type Palette = (typeof palette)[Theme] & { accent: string; accentHover: string; accentWash: string };

export function resolvePalette(theme: Theme): Palette {
  return {
    ...palette[theme],
    accent: accent.base,
    accentHover: accent.hover,
    accentWash: accent.wash,
  };
}

/* ── Texture ────────────────────────────────────────────────── */

export const texture = {
  src: "/assets/concrete-wall-texture.jpg",
  /** Blend + opacity differ per theme so the grain reads at both ends. */
  light: { mixBlendMode: "overlay" as const, opacity: 0.32 },
  dark: { mixBlendMode: "multiply" as const, opacity: 0.55 },
};

/* ── Type ───────────────────────────────────────────────────── */

export const font = {
  display: "'Monument Extended', sans-serif",
  body: "'Helvetica Now MT Text', 'Helvetica Neue', Helvetica, Arial, sans-serif",
} as const;

/**
 * Every size is a clamp() so the whole system scales off the viewport —
 * the hero has no breakpoint-driven type and neither should anything else.
 */
export const type = {
  /** Wide-tracked micro-label. Uppercase only. */
  eyebrow: {
    fontFamily: font.display,
    fontWeight: 400,
    fontSize: "clamp(0.5rem, 0.85vw, 0.75rem)",
    letterSpacing: "0.2em",
  },
  /** Page-owning headline (hero scale). */
  display: {
    fontFamily: font.display,
    fontWeight: 500,
    fontSize: "clamp(2.25rem, 6vw, 7.25rem)",
    lineHeight: 1.0,
  },
  /** Interior page headline — one step down from `display`. */
  title: {
    fontFamily: font.display,
    fontWeight: 500,
    fontSize: "clamp(1.75rem, 4.5vw, 4.5rem)",
    lineHeight: 1.05,
  },
  /** Section heading, e.g. the standalone "ACMX" mark. */
  heading: {
    fontFamily: font.display,
    fontWeight: 400,
    fontSize: "clamp(1.625rem, 3vw, 2.5rem)",
    lineHeight: 1,
  },
  /** Card / sub-section heading. */
  subheading: {
    fontFamily: font.display,
    fontWeight: 400,
    fontSize: "clamp(0.875rem, 1.4vw, 1.125rem)",
    letterSpacing: "0.06em",
    lineHeight: 1.25,
  },
  body: {
    fontFamily: font.body,
    fontWeight: 400,
    fontSize: "clamp(0.8125rem, 1.1vw, 1.0625rem)",
    lineHeight: 1.65,
  },
  bodySmall: {
    fontFamily: font.body,
    fontWeight: 400,
    fontSize: "clamp(0.75rem, 0.9vw, 0.875rem)",
    lineHeight: 1.6,
  },
  /** Button / tab label. */
  label: {
    fontFamily: font.display,
    fontWeight: 400,
    fontSize: "clamp(0.5625rem, 0.75vw, 0.6875rem)",
    letterSpacing: "0.18em",
  },
  /** Data readout — pairs with `label` in key/value rows. */
  mono: {
    fontFamily: font.body,
    fontWeight: 400,
    fontSize: "clamp(0.6875rem, 0.8vw, 0.8125rem)",
    letterSpacing: "0.04em",
  },
} as const;

/* ── Layout ─────────────────────────────────────────────────── */

export const layout = {
  /** Horizontal page gutter. Matches the fixed NavBar's px-[7vw]. */
  gutter: "7vw",
  /** Height of the fixed NavBar — interior pages clear it. */
  navHeight: "4rem",
  /** Top padding for an interior page (nav height + breathing room). */
  topPad: "clamp(6rem, 14vh, 10rem)",
  bottomPad: "clamp(4rem, 10vh, 8rem)",
  /** Vertical rhythm between stacked blocks. */
  gap: "clamp(1.5rem, 3.5vh, 2.5rem)",
  gapTight: "clamp(0.75rem, 1.5vh, 1.25rem)",
  /** Comfortable measure for running text. */
  measure: "clamp(18rem, 65vw, 75rem)",
} as const;

export const motion = {
  fast: "0.2s",
  base: "0.3s",
  ease: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;
