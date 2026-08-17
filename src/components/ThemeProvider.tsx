"use client";

import React, { createContext, useContext, useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * The `dark` class on <html> is the single source of truth for the theme.
 *
 * The inline script in the root layout sets that class before first paint, so
 * by the time any of this runs the answer already exists in the DOM — this
 * provider reads it rather than keeping a second copy in state.
 *
 * That matters because the app is styled two ways. CSS-driven components follow
 * the class immediately; components styled through `useDS()` follow this
 * context. The previous version started at `useState("light")` and only read
 * localStorage in an effect, so every DS-styled surface rendered light and then
 * repainted dark. It also returned `children` *without* the provider until that
 * effect had run, which left `useTheme()` reading the default context during
 * the very window the theme was being resolved.
 *
 * Reading through `useSyncExternalStore` is what makes this correct across the
 * server/client boundary: the server snapshot is "light" (it has no DOM), the
 * client snapshot is whatever the class says, and React reconciles the two
 * without a cascading render.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function readTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);

  const toggleTheme = useCallback(() => {
    // Write to the DOM and to storage; the observer above turns that into a
    // re-render, so there is no separate state to keep in step.
    const next: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private mode / storage disabled. The theme still applies for this page.
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}
