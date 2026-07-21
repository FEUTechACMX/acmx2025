"use client";

import { useTheme } from "@/components/ThemeProvider";
import { resolvePalette, type Palette } from "@/styles/design-system";

/**
 * Resolves the design-system palette for the active theme.
 * Re-exports `isDark` for the handful of places that need to branch on it
 * directly (texture blend mode, image treatments).
 */
export function useDS(): { c: Palette; isDark: boolean } {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return { c: resolvePalette(isDark ? "dark" : "light"), isDark };
}
