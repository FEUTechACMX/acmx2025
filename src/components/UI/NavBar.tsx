"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { safeUser } from "@/types/auth";
import LoginModal from "@/components/login/modal/LogInModal";
import ProfileMenu from "./ProfileMenu";
import { useTheme } from "@/components/ThemeProvider";
import { useDS } from "@/components/ds";
import { type as t, motion, layout } from "@/styles/design-system";

type NavBarProps = {
  user: safeUser | null;
};

type NavItem = { label: string; href: string };

const BASE_LINKS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Merchandise", href: "/merchandise" },
  { label: "Events", href: "/events" },
];

/** Tracked-caps nav link with an accent hairline under the active route. */
function NavLink({
  item,
  active,
  onClick,
  block = false,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
  block?: boolean;
}) {
  const { c } = useDS();
  const [hover, setHover] = useState(false);
  const color = active || hover ? c.accent : c.muted;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`relative ${block ? "block" : "inline-block"}`}
      style={{
        ...t.label,
        textTransform: "uppercase",
        color,
        textDecoration: "none",
        padding: block ? "0.75rem 0" : undefined,
        transition: `color ${motion.fast}`,
      }}
    >
      {item.label}
      {active && !block && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            bottom: "-0.7rem",
            width: "100%",
            height: 1,
            backgroundColor: c.accent,
          }}
        />
      )}
    </Link>
  );
}

export default function NavBar({ user }: NavBarProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAcmDropdownOpen, setIsAcmDropdownOpen] = useState(false);
  const [isMobileAcmOpen, setIsMobileAcmOpen] = useState(false);
  const [loginHover, setLoginHover] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { c, isDark } = useDS();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/hero" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const isAcmActive = pathname.startsWith("/committee") || pathname.startsWith("/officers");

  // Close the ACM dropdown on outside click.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAcmDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Translucent bar tint — surface at ~72% so the concrete reads through the blur.
  const barBg = isDark ? "rgba(38, 37, 42, 0.72)" : "rgba(232, 227, 219, 0.72)";

  const acmLinks: NavItem[] = [
    { label: "Committee", href: "/committee" },
    { label: "Officers", href: "/officers" },
  ];

  return (
    <>
      <nav
        className="fixed top-0 left-0 w-full z-50 flex items-center justify-between"
        style={{
          height: layout.navHeight,
          paddingLeft: layout.gutter,
          paddingRight: layout.gutter,
          backgroundColor: barBg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${c.rule}`,
        }}
      >
        {/* Wordmark */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            className="font-monument select-none"
            style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "0.28em", color: c.text }}
          >
            ACMX
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center" style={{ gap: "2.25rem" }}>
          {BASE_LINKS.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}

          {/* ACM dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsAcmDropdownOpen((o) => !o)}
              className="flex items-center cursor-pointer"
              style={{
                ...t.label,
                textTransform: "uppercase",
                gap: "0.35rem",
                color: isAcmActive ? c.accent : c.muted,
                background: "none",
                border: "none",
                transition: `color ${motion.fast}`,
              }}
            >
              ACM
              <svg
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{
                  transform: isAcmDropdownOpen ? "rotate(180deg)" : "none",
                  transition: `transform ${motion.fast}`,
                }}
              >
                <path strokeLinecap="square" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {isAcmActive && (
                <span
                  aria-hidden="true"
                  style={{ position: "absolute", left: 0, bottom: "-0.7rem", width: "100%", height: 1, backgroundColor: c.accent }}
                />
              )}
            </button>

            {isAcmDropdownOpen && (
              <div
                className="absolute top-full left-0"
                style={{
                  marginTop: "1rem",
                  minWidth: "11rem",
                  backgroundColor: c.surface,
                  border: `1px solid ${c.rule}`,
                }}
              >
                {acmLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsAcmDropdownOpen(false)}
                    className="block"
                    style={{
                      ...t.label,
                      textTransform: "uppercase",
                      padding: "0.85rem 1.1rem",
                      color: isActive(item.href) ? c.accent : c.muted,
                      textDecoration: "none",
                      borderBottom: item.href === acmLinks[0].href ? `1px solid ${c.rule}` : "none",
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {user && <NavLink item={{ label: "Profile", href: "/profile" }} active={isActive("/profile")} />}
          {user?.role === "ADMIN" && (
            <NavLink item={{ label: "Scanner", href: "/scanner" }} active={isActive("/scanner")} />
          )}
        </div>

        {/* Right cluster */}
        <div className="hidden lg:flex items-center" style={{ gap: "1.25rem" }}>
          <ThemeToggle theme={theme} onToggle={toggleTheme} accent={c.accent} rule={c.ruleStrong} />
          {user ? (
            <ProfileMenu user={user} />
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              onMouseEnter={() => setLoginHover(true)}
              onMouseLeave={() => setLoginHover(false)}
              className="cursor-pointer"
              style={{
                ...t.label,
                textTransform: "uppercase",
                padding: "0.55rem 1.4rem",
                color: loginHover ? "#ffffff" : c.accent,
                backgroundColor: loginHover ? c.accent : "transparent",
                border: `1px solid ${c.accent}`,
                transition: `background-color ${motion.fast}, color ${motion.fast}`,
              }}
            >
              Log In
            </button>
          )}
        </div>

        {/* Hamburger (mobile) */}
        <button
          className="lg:hidden flex flex-col cursor-pointer"
          style={{ gap: "0.3rem" }}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span style={{ display: "block", width: "1.5rem", height: 1.5, backgroundColor: c.text }} />
          <span style={{ display: "block", width: "1.5rem", height: 1.5, backgroundColor: c.text }} />
          <span style={{ display: "block", width: "1.5rem", height: 1.5, backgroundColor: c.text }} />
        </button>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div
          className="fixed left-0 w-full z-40 lg:hidden"
          style={{
            top: layout.navHeight,
            backgroundColor: c.surface,
            borderBottom: `1px solid ${c.rule}`,
            padding: `1.5rem ${layout.gutter}`,
          }}
        >
          <div className="flex flex-col">
            {BASE_LINKS.map((item) => (
              <div key={item.href} style={{ borderBottom: `1px solid ${c.rule}` }}>
                <NavLink item={item} active={isActive(item.href)} block onClick={() => setIsMenuOpen(false)} />
              </div>
            ))}

            {/* Mobile ACM */}
            <div style={{ borderBottom: `1px solid ${c.rule}` }}>
              <button
                onClick={() => setIsMobileAcmOpen((o) => !o)}
                className="flex items-center justify-between w-full cursor-pointer"
                style={{
                  ...t.label,
                  textTransform: "uppercase",
                  padding: "0.75rem 0",
                  color: isAcmActive ? c.accent : c.muted,
                  background: "none",
                  border: "none",
                }}
              >
                ACM
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ transform: isMobileAcmOpen ? "rotate(180deg)" : "none", transition: `transform ${motion.fast}` }}
                >
                  <path strokeLinecap="square" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isMobileAcmOpen && (
                <div style={{ paddingLeft: "1rem", paddingBottom: "0.5rem" }}>
                  {acmLinks.map((item) => (
                    <NavLink key={item.href} item={item} active={isActive(item.href)} block onClick={() => setIsMenuOpen(false)} />
                  ))}
                </div>
              )}
            </div>

            {user && (
              <div style={{ borderBottom: `1px solid ${c.rule}` }}>
                <NavLink item={{ label: "Profile", href: "/profile" }} active={isActive("/profile")} block onClick={() => setIsMenuOpen(false)} />
              </div>
            )}
            {user?.role === "ADMIN" && (
              <div style={{ borderBottom: `1px solid ${c.rule}` }}>
                <NavLink item={{ label: "Scanner", href: "/scanner" }} active={isActive("/scanner")} block onClick={() => setIsMenuOpen(false)} />
              </div>
            )}
          </div>

          <div className="flex items-center" style={{ gap: "1rem", marginTop: "1.5rem" }}>
            <ThemeToggle theme={theme} onToggle={toggleTheme} accent={c.accent} rule={c.ruleStrong} />
            <div className="flex-1">
              {user ? (
                <ProfileMenu user={user} />
              ) : (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsLoginOpen(true);
                  }}
                  className="w-full cursor-pointer"
                  style={{
                    ...t.label,
                    textTransform: "uppercase",
                    padding: "0.7rem 0",
                    color: c.accent,
                    backgroundColor: "transparent",
                    border: `1px solid ${c.accent}`,
                  }}
                >
                  Log In
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={() => {
          setIsLoginOpen(false);
          window.location.reload();
        }}
      />
    </>
  );
}

/** Accent-dot theme switch — filled in dark, ringed in light. */
function ThemeToggle({
  theme,
  onToggle,
  accent,
  rule,
}: {
  theme: string;
  onToggle: () => void;
  accent: string;
  rule: string;
}) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light" : "Switch to dark"}
      className="flex items-center justify-center cursor-pointer"
      style={{ width: "2.25rem", height: "2.25rem", background: "none", border: "none" }}
    >
      <span
        style={{
          width: "0.85rem",
          height: "0.85rem",
          borderRadius: "50%",
          backgroundColor: isDark ? accent : "transparent",
          border: `1.5px solid ${isDark ? accent : rule}`,
          boxShadow: isDark ? `0 0 0 3px ${accent}22` : "none",
          transition: "background-color 0.2s ease, border-color 0.2s ease",
        }}
      />
    </button>
  );
}
