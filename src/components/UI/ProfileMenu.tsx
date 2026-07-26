"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { safeUser } from "@/types/auth";
import { useDS } from "@/components/ds";
import { runBlinkIn } from "@/lib/blink";
import { type as t, motion } from "@/styles/design-system";

type ProfileMenuProps = {
  user: safeUser;
};

/** Enum role → display label: JUNIOR_OFFICER → "Junior Officer". */
function formatRole(role?: string) {
  if (!role) return "";
  return role
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function ProfileMenu({ user }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { c } = useDS();

  const initial = user?.name?.[0]?.toUpperCase() ?? "?";

  // Close on outside click.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reveal with the site-wide blink-in — same language as the nav / preloader.
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      runBlinkIn(dropdownRef.current.querySelectorAll(".blink-el"), { stagger: 0.05 });
    }
  }, [isOpen]);

  const handleLogOut = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[#CF78EC] to-[#a855f7] p-[2px] focus:outline-none focus:ring-2 focus:ring-[#CF78EC]/50 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg hover:shadow-[#CF78EC]/30 cursor-pointer group"
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-[#CF78EC] to-[#a855f7] flex items-center justify-center text-white text-lg font-bold group-hover:from-[#b85cd6] group-hover:to-[#9333ea] transition-all duration-200">
          {initial}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 z-50"
          style={{
            marginTop: "1rem",
            width: "17rem",
            backgroundColor: c.surface,
            border: `1px solid ${c.rule}`,
          }}
        >
          {/* Accent hairline cap — the recurring underline motif. */}
          <div className="blink-el" style={{ height: 2, backgroundColor: c.accent }} />

          {/* Identity */}
          <div
            className="blink-el"
            style={{ padding: "1.1rem 1.1rem", borderBottom: `1px solid ${c.rule}` }}
          >
            <div className="flex items-center" style={{ gap: "0.85rem" }}>
              <span
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: "2.75rem",
                  height: "2.75rem",
                  ...t.heading,
                  fontSize: "1.25rem",
                  color: c.accent,
                  backgroundColor: c.accentWash,
                  border: `1px solid ${c.accent}`,
                }}
              >
                {initial}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="truncate"
                  style={{ ...t.subheading, color: c.text, margin: 0 }}
                >
                  {user?.name}
                </p>
                <p
                  className="truncate"
                  style={{ ...t.mono, color: c.faint, margin: 0, marginTop: "0.15rem" }}
                >
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Role + points */}
            <div className="flex items-center justify-between" style={{ marginTop: "0.9rem" }}>
              <span
                style={{
                  ...t.label,
                  fontSize: "clamp(0.5rem, 0.65vw, 0.625rem)",
                  textTransform: "uppercase",
                  padding: "0.25rem 0.6rem",
                  color: c.text,
                  border: `1px solid ${c.ruleStrong}`,
                  whiteSpace: "nowrap",
                }}
              >
                {formatRole(user?.role)}
              </span>
              <span className="flex items-baseline" style={{ gap: "0.35rem" }}>
                <span style={{ ...t.mono, color: c.text }}>{user?.points ?? 0}</span>
                <span style={{ ...t.label, color: c.faint, textTransform: "uppercase" }}>Pts</span>
              </span>
            </div>
          </div>

          {/* Actions — tracked-caps rows, hairline separated, accent on hover. */}
          <div>
            <MenuRow href="/profile" onNavigate={() => setIsOpen(false)}>
              Profile
            </MenuRow>
            <MenuRow href="/profile?tab=account" onNavigate={() => setIsOpen(false)}>
              Settings
            </MenuRow>
            <MenuRow onClick={handleLogOut} last>
              Log Out
            </MenuRow>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A single dropdown action. Renders as a Link when `href` is given, otherwise a
 * button. Matches the NavBar dropdown: tracked caps, muted → accent on hover,
 * hairline divider below (suppressed on the last row).
 */
function MenuRow({
  children,
  href,
  onClick,
  onNavigate,
  last = false,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  onNavigate?: () => void;
  last?: boolean;
}) {
  const { c } = useDS();
  const [hover, setHover] = useState(false);

  const style: React.CSSProperties = {
    ...t.label,
    textTransform: "uppercase",
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "0.85rem 1.1rem",
    color: hover ? c.accent : c.muted,
    backgroundColor: hover ? c.accentWash : "transparent",
    border: "none",
    borderBottom: last ? "none" : `1px solid ${c.rule}`,
    textDecoration: "none",
    cursor: "pointer",
    transition: `color ${motion.fast}, background-color ${motion.fast}`,
  };

  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  };

  if (href) {
    return (
      <Link href={href} onClick={onNavigate} className="blink-el" style={style} {...handlers}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className="blink-el" style={style} {...handlers}>
      {children}
    </button>
  );
}
