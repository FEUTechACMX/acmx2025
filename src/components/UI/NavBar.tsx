"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LoginModal from "@/components/login/modal/LogInModal";
import { useSession } from "@/components/sessionClient";
import ProfileMenu from "./ProfileMenu";
import { useTheme } from "@/components/ThemeProvider";
import { useDS } from "@/components/ds";
import Icon from "@/components/admin/icons";
import { useCart } from "@/components/merch/cartClient";
import { type as t, motion, layout } from "@/styles/design-system";
import { isAdmin } from "@/types/auth";

type NavItem = { label: string; href: string };

// Home is prepended per-user (dashboard when signed in, hero otherwise) so the
// link skips the "/" redirect hop.
const BASE_LINKS: NavItem[] = [
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

export default function NavBar() {
  const { user, loading } = useSession();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAcmDropdownOpen, setIsAcmDropdownOpen] = useState(false);
  const [isMobileAcmOpen, setIsMobileAcmOpen] = useState(false);
  const [loginHover, setLoginHover] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();
  const { c, isDark } = useDS();

  // Home points straight at the user's landing page — no "/" redirect round-trip.
  // Until the session resolves we don't know which that is, so fall back to "/"
  // and let it redirect; guessing "/hero" would send members to the wrong page.
  const homeHref = loading ? "/" : user ? "/dashboard" : "/hero";
  const navLinks: NavItem[] = [{ label: "Home", href: homeHref }, ...BASE_LINKS];

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/hero") {
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

  // The admin console has its own sidebar chrome — suppress the public nav there.
  // Placed after all hooks so hook order stays stable across route changes.
  if (pathname.startsWith("/admin")) return null;

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
        <Link href={homeHref} style={{ textDecoration: "none" }}>
          <span
            className="font-monument select-none"
            style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "0.28em", color: c.text }}
          >
            ACMX
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center" style={{ gap: "2.25rem" }}>
          {navLinks.map((item) => (
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
          {isAdmin(user?.role) && (
            <NavLink item={{ label: "Admin", href: "/admin" }} active={isActive("/admin")} />
          )}
        </div>

        {/* Right cluster */}
        <div className="hidden lg:flex items-center" style={{ gap: "1.25rem" }}>
          {user && <CartLink />}
          <ThemeToggle theme={theme} onToggle={toggleTheme} color={c.text} />
          {loading ? (
            /* Session not resolved yet. Rendering either branch would be a
               guess, and the wrong guess flashes a LOG IN button at a signed-in
               member on every page load — so hold the space instead. */
            <div style={{ width: "6.5rem" }} aria-hidden />
          ) : user ? (
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
            {navLinks.map((item) => (
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
              <>
                <div style={{ borderBottom: `1px solid ${c.rule}` }}>
                  <NavLink
                    item={{ label: "Cart", href: "/merchandise/cart" }}
                    active={isActive("/merchandise/cart")}
                    block
                    onClick={() => setIsMenuOpen(false)}
                  />
                </div>
                <div style={{ borderBottom: `1px solid ${c.rule}` }}>
                  <NavLink item={{ label: "Profile", href: "/profile" }} active={isActive("/profile")} block onClick={() => setIsMenuOpen(false)} />
                </div>
              </>
            )}
            {isAdmin(user?.role) && (
              <div style={{ borderBottom: `1px solid ${c.rule}` }}>
                <NavLink item={{ label: "Admin", href: "/admin" }} active={isActive("/admin")} block onClick={() => setIsMenuOpen(false)} />
              </div>
            )}
          </div>

          <div className="flex items-center" style={{ gap: "1rem", marginTop: "1.5rem" }}>
            <ThemeToggle theme={theme} onToggle={toggleTheme} color={c.text} />
            <div className="flex-1">
              {loading ? (
                <div style={{ height: "2.6rem" }} aria-hidden />
              ) : user ? (
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
          // Send members straight to the dashboard after signing in.
          //
          // Deliberately a full document load rather than router.push: the
          // session is cached per document in `sessionClient`, so a client-side
          // navigation would leave this nav rendering the signed-out state until
          // something else forced a reload.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/dashboard";
        }}
      />
    </>
  );
}

/** Single borderless theme switch — shows a sun in light mode, a moon in dark. */
/**
 * Cart entry point for signed-in members. The count comes from the server-side
 * basket and updates live — every cart mutation broadcasts the fresh totals.
 */
function CartLink() {
  const { c } = useDS();
  const pathname = usePathname();
  const { cart } = useCart(true);
  const active = pathname.startsWith("/merchandise/cart");
  const filled = cart.count > 0;

  return (
    <Link
      href="/merchandise/cart"
      aria-label={`Cart, ${cart.count} ${cart.count === 1 ? "item" : "items"}`}
      className="relative flex items-center"
      style={{ color: active || filled ? c.accent : c.muted, transition: `color ${motion.fast}` }}
    >
      <Icon name="cart" size={18} />
      {filled && (
        <span
          style={{
            ...t.label,
            position: "absolute",
            top: -7,
            right: -9,
            minWidth: 16,
            padding: "1px 4px",
            fontSize: "0.5rem",
            lineHeight: "14px",
            textAlign: "center",
            color: "#ffffff",
            backgroundColor: c.accent,
          }}
        >
          {cart.count}
        </span>
      )}
    </Link>
  );
}

function ThemeToggle({
  theme,
  onToggle,
  color,
}: {
  theme: string;
  onToggle: () => void;
  color: string;
}) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      aria-label="Toggle theme"
      title={isDark ? "Switch to light" : "Switch to dark"}
      className="flex items-center justify-center cursor-pointer"
      style={{ width: "2.25rem", height: "2.25rem", background: "none", border: "none", color, padding: 0 }}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
          <circle cx="12" cy="12" r="4" />
          <path
            strokeLinecap="round"
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
          />
        </svg>
      )}
    </button>
  );
}
