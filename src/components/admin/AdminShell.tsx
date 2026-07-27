"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { safeUser } from "@/types/auth";
import { isAdmin, roleLabel } from "@/types/auth";
import { useTheme } from "@/components/ThemeProvider";
import { useDS } from "@/components/ds";
import { type as t, font, motion, texture } from "@/styles/design-system";
import { runBlinkIn } from "@/lib/blink";
import Icon, { type IconName } from "./icons";

type NavKey =
  | "overview"
  | "events"
  | "committees"
  | "merchandise"
  | "media"
  | "people"
  | "videos";

const NAV: { key: NavKey; label: string; href: string; icon: IconName }[] = [
  { key: "overview", label: "Overview", href: "/admin", icon: "overview" },
  { key: "events", label: "Events", href: "/admin/events", icon: "events" },
  { key: "committees", label: "Committees", href: "/admin/committees", icon: "committees" },
  { key: "merchandise", label: "Merchandise", href: "/admin/merchandise", icon: "bag" },
  { key: "media", label: "Media Library", href: "/admin/media", icon: "media" },
  { key: "people", label: "People & Roles", href: "/admin/people", icon: "people" },
  { key: "videos", label: "Videos", href: "/admin/videos", icon: "videos" },
];

/**
 * The admin console frame: persistent left sidebar + slim top bar over a
 * concrete surface. Replaces the public NavBar (suppressed on /admin).
 */
export default function AdminShell({
  user,
  breadcrumb,
  searchPlaceholder = "Search…",
  searchValue,
  onSearchChange,
  children,
}: {
  user: safeUser;
  breadcrumb: string;
  searchPlaceholder?: string;
  /**
   * Wire these to make the top-bar search real. A page that doesn't pass
   * `onSearchChange` gets no search box at all — this used to render a styled
   * div that looked exactly like an input and did nothing, which is worse than
   * having no search: it tells the user the feature exists.
   */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  const { c, isDark } = useDS();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const tex = isDark ? texture.dark : texture.light;

  // A committee head reaches the console through their seat, not through a
  // chapter role, so the sidebar shows them the one section they can open. The
  // layout enforces the same boundary server-side.
  const admin = isAdmin(user?.role);
  const nav = admin ? NAV : NAV.filter((n) => n.key === "committees");

  const activeKey: NavKey =
    NAV.slice(1).find((n) => pathname.startsWith(n.href))?.key ?? "overview";

  const initials =
    (user?.name || "Admin")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "A";

  return (
    <div
      className="fixed inset-0 flex overflow-hidden"
      style={{ backgroundColor: c.surface, color: c.text }}
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

      {/* Sidebar */}
      <aside
        className="relative z-10 hidden md:flex flex-col justify-between shrink-0"
        style={{
          width: 248,
          borderRight: `1px solid ${c.rule}`,
          backgroundColor: c.panel,
          padding: "26px 18px",
        }}
      >
        <div className="flex flex-col" style={{ gap: 24 }}>
          {/* Brand */}
          <div className="flex items-center" style={{ gap: 10, padding: "0 6px" }}>
            <span style={{ fontFamily: font.display, fontSize: 18, fontWeight: 700, letterSpacing: "0.22em", color: c.text }}>
              ACMX
            </span>
            <span
              style={{
                ...t.label,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "#ffffff",
                backgroundColor: c.accent,
                padding: "3px 8px",
              }}
            >
              {admin ? "ADMIN" : "COMMITTEE"}
            </span>
          </div>

          {/* Nav */}
          <div className="flex flex-col" style={{ gap: 3 }}>
            <span style={{ ...t.label, fontSize: 10, color: c.faint, padding: "4px 10px 10px" }}>
              MANAGE
            </span>
            {nav.map((n) => {
              const active = n.key === activeKey;
              return (
                <Link
                  key={n.key}
                  href={n.href}
                  className="flex items-center"
                  style={{
                    gap: 12,
                    padding: "11px 14px",
                    textDecoration: "none",
                    color: active ? c.text : c.muted,
                    backgroundColor: active ? c.accentWash : "transparent",
                    borderLeft: `2px solid ${active ? c.accent : "transparent"}`,
                    transition: `background-color ${motion.fast}, color ${motion.fast}`,
                  }}
                >
                  <span style={{ color: active ? c.accent : c.muted, display: "flex" }}>
                    <Icon name={n.icon} size={17} />
                  </span>
                  <span style={{ ...t.label, letterSpacing: "0.08em", color: "inherit" }}>{n.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col" style={{ gap: 14 }}>
          <div style={{ height: 1, backgroundColor: c.rule }} />
          <div className="flex items-center" style={{ gap: 10, padding: "0 6px" }}>
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: 34, height: 34, backgroundColor: c.accentWash, border: `1px solid ${c.rule}` }}
            >
              <span style={{ fontFamily: font.display, fontSize: 12, fontWeight: 700, color: c.accent }}>{initials}</span>
            </div>
            <div className="flex flex-col min-w-0" style={{ gap: 2 }}>
              <span style={{ ...t.bodySmall, fontWeight: 600, color: c.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.name || "Admin"}
              </span>
              <span style={{ ...t.label, fontSize: 9, color: c.faint }}>{roleLabel(user?.role)}</span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center"
            style={{ gap: 8, padding: "10px 12px", border: `1px solid ${c.rule}`, textDecoration: "none", color: c.muted }}
          >
            <Icon name="logout" size={15} />
            <span style={{ ...t.label, letterSpacing: "0.1em" }}>EXIT TO SITE</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="relative z-10 flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{ height: 58, padding: "0 clamp(16px, 3vw, 40px)", borderBottom: `1px solid ${c.rule}` }}
        >
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ ...t.label, color: c.faint }}>CONSOLE</span>
            <span style={{ ...t.label, color: c.faint }}>/</span>
            <span style={{ ...t.label, color: c.text }}>{breadcrumb}</span>
          </div>
          <div className="flex items-center" style={{ gap: 14 }}>
            {onSearchChange && (
              <div
                className="hidden sm:flex items-center"
                style={{ gap: 8, padding: "0 12px", width: 260, border: `1px solid ${c.rule}` }}
              >
                <span style={{ color: c.faint, display: "flex" }}>
                  <Icon name="search" size={14} />
                </span>
                <input
                  value={searchValue ?? ""}
                  placeholder={searchPlaceholder}
                  onChange={(e) => onSearchChange(e.target.value)}
                  aria-label={searchPlaceholder}
                  style={{
                    ...t.bodySmall,
                    flex: 1,
                    minWidth: 0,
                    padding: "9px 0",
                    color: c.text,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                  }}
                />
                {searchValue && (
                  <button
                    aria-label="Clear search"
                    onClick={() => onSearchChange("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: c.faint,
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                    }}
                  >
                    <Icon name="x" size={13} />
                  </button>
                )}
              </div>
            )}
            <span style={{ color: c.muted, display: "flex" }}><Icon name="bell" size={17} /></span>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex items-center justify-center cursor-pointer"
              style={{ background: "none", border: "none", color: c.muted, padding: 0 }}
            >
              <Icon name={theme === "dark" ? "moon" : "sun"} size={17} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

/** Page-content wrapper: padding + blink-in reveal for direct children. */
export function AdminContent({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) runBlinkIn(ref.current.children);
  }, []);
  return (
    <div
      ref={ref}
      className="flex flex-col"
      style={{ padding: "28px clamp(16px, 3vw, 40px) 40px", gap: 26, ...style }}
    >
      {children}
    </div>
  );
}

/** Shared page header: eyebrow + title (+ optional subtitle) and right actions. */
export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const { c } = useDS();
  return (
    <div className="flex items-end justify-between flex-wrap" style={{ gap: 16 }}>
      <div className="flex flex-col" style={{ gap: 10, maxWidth: 640 }}>
        <span style={{ ...t.label, color: c.accent }}>{eyebrow}</span>
        <h1 style={{ ...t.title, fontSize: "clamp(1.75rem, 3vw, 2.25rem)", color: c.text }}>{title}</h1>
        {subtitle && <p style={{ ...t.bodySmall, color: c.muted }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center" style={{ gap: 12 }}>{actions}</div>}
    </div>
  );
}

/** Wide-tracked section label with an underrule. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { c } = useDS();
  return (
    <div className="flex flex-col" style={{ gap: 9 }}>
      <span style={{ ...t.label, color: c.faint }}>{children}</span>
      <div style={{ height: 1, backgroundColor: c.rule }} />
    </div>
  );
}

/** Small square-cornered action button used across admin pages. */
export function AdminButton({
  variant = "solid",
  icon,
  children,
  onClick,
  disabled,
  block,
  type = "button",
}: {
  variant?: "solid" | "ghost";
  icon?: IconName;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  block?: boolean;
  type?: "button" | "submit";
}) {
  const { c } = useDS();
  const solid = variant === "solid";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center cursor-pointer"
      style={{
        ...t.label,
        gap: 8,
        padding: "11px 18px",
        width: block ? "100%" : undefined,
        color: solid ? "#ffffff" : c.text,
        backgroundColor: solid ? c.accent : "transparent",
        border: solid ? "none" : `1px solid ${c.ruleStrong}`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: `opacity ${motion.fast}`,
      }}
    >
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  );
}
