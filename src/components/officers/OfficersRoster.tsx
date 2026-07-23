"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Surface } from "@/components/ds";
import { useDS } from "@/components/ds/useDS";
import { runBlinkIn } from "@/lib/blink";
import { type as t, layout, motion } from "@/styles/design-system";
import { officers as ROSTER, type Officer } from "./officers-data";

/* ──────────────────────────────────────────────────────────────
 * OfficersRoster — "The Roster" (character select)
 *
 * A video-game champion-select for the chapter's officers. One cinematic,
 * hero-worthy splash per officer: oversized portrait with an accent glow and
 * corner-diamond frame, big display name, role badge, signature line and stats.
 *
 * Three ways to move through the roster (recognition over recall):
 *   • PREV / NEXT chevrons flanking the portrait (NEXT is the accent action)
 *   • ← / → arrow keys
 *   • the "JUMP TO" selector — a searchable list of every officer
 *   • clicking any diamond token in the roster rail
 *
 * Photos are placeholders (one per officer) until real portraits land.
 * ────────────────────────────────────────────────────────────── */

const pad2 = (n: number) => String(n).padStart(2, "0");

/* ── Icons (inline, to match the system's no-dependency SVG convention) ── */
function IconUser({ size = 28, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.4}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}
function IconChevron({ dir = "right", size = 22 }: { dir?: "left" | "right" | "down"; size?: number }) {
  const d = dir === "left" ? "M15 6l-6 6 6 6" : dir === "down" ? "M6 9l6 6 6-6" : "M9 6l6 6-6 6";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d={d} />
    </svg>
  );
}
function IconSearch({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
function IconInstagram({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
function IconLinkedin({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4M11 17v-7" />
    </svg>
  );
}
function IconMail({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
      <rect x="3" y="5" width="18" height="14" />
      <path d="M3 6l9 7 9-7" />
    </svg>
  );
}

/* ── Corner-diamond motif (concentric, like the Surface corners) ── */
function CornerDiamonds({ size = 150, color, className, style }: { size?: number; color: string; className?: string; style?: React.CSSProperties }) {
  const rings = [50, 40, 30, 20, 10];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden
      className={className}
      style={{ display: "block", overflow: "visible", ...style }}
    >
      {rings.map((r, i) => (
        <path
          key={r}
          d={`M50 ${50 - r} L${50 + r} 50 L50 ${50 + r} L${50 - r} 50 Z`}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.1 + i * 0.08}
        />
      ))}
    </svg>
  );
}

/* ── Diamond portrait token (roster rail + selector share the shape) ── */
function DiamondPortrait({ officer, active, size = 92 }: { officer: Officer; active: boolean; size?: number }) {
  const { c } = useDS();
  const clip = `dia-${officer.id}`;
  const stroke = active ? c.accent : c.rule;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <clipPath id={clip}>
          <path d="M50 3 L97 50 L50 97 L3 50 Z" />
        </clipPath>
      </defs>
      <path
        d="M50 3 L97 50 L50 97 L3 50 Z"
        fill={active ? c.accentWash : c.panel}
        stroke={stroke}
        strokeWidth={active ? 1.6 : 1}
        style={{ filter: active ? `drop-shadow(0 0 7px ${c.accent})` : "none", transition: `all ${motion.base}` }}
      />
      {officer.photo ? (
        <image href={officer.photo} x="3" y="3" width="94" height="94" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clip})`} />
      ) : (
        <g stroke={active ? c.accent : c.faint} strokeWidth={1.3} fill="none" style={{ transition: `stroke ${motion.base}` }}>
          <circle cx="50" cy="43" r="8" />
          <path d="M35 66c0-8 6.7-13 15-13s15 5 15 13" />
        </g>
      )}
    </svg>
  );
}

/* ── The main portrait stage (right side) ── */
function PortraitStage({ officer, index, total }: { officer: Officer; index: number; total: number }) {
  const { c, isDark } = useDS();
  return (
    <div className="ofc-portrait relative flex items-center justify-center">
      {/* accent glow */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          width: "115%",
          height: "80%",
          background: `radial-gradient(closest-side, ${c.accent} 0%, transparent 72%)`,
          opacity: isDark ? 0.24 : 0.16,
          filter: "blur(6px)",
        }}
      />
      {/* ghost diamond frame */}
      <svg aria-hidden viewBox="0 0 100 100" className="absolute pointer-events-none" style={{ width: "min(46vh, 30rem)", height: "min(46vh, 30rem)", overflow: "visible", opacity: 0.12 }}>
        <path d="M50 1 L99 50 L50 99 L1 50 Z" fill="none" stroke={c.accent} strokeWidth={0.6} />
      </svg>

      {/* portrait frame */}
      <div
        className="ofc-portrait-frame relative flex flex-col items-center justify-center"
        style={{
          backgroundColor: isDark ? "#1e1d22" : "rgba(26,26,26,0.05)",
          border: `1px solid ${c.ruleStrong}`,
          gap: "0.9rem",
        }}
      >
        {officer.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={officer.photo} alt={officer.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <span style={{ color: c.faint }}>
              <IconUser size={62} />
            </span>
            <span style={{ ...t.label, textTransform: "uppercase", color: c.faint, letterSpacing: "0.25em" }}>Portrait</span>
            <span style={{ ...t.bodySmall, color: c.faint }}>official photo added later</span>
          </>
        )}

        {/* corner registration marks */}
        <span style={{ position: "absolute", top: "0.9rem", left: "1rem", ...t.label, color: c.muted, letterSpacing: "0.16em" }}>
          N° {pad2(index + 1)}
        </span>
        <span style={{ position: "absolute", bottom: "0.9rem", right: "1rem", ...t.label, color: c.muted, letterSpacing: "0.16em" }}>
          {pad2(index + 1)} / {pad2(total)}
        </span>
      </div>

      {/* corner diamonds */}
      <CornerDiamonds size={140} color={c.accent} className="absolute" style={{ top: "-1.6rem", right: "-1.6rem", opacity: 0.55 }} />
      <CornerDiamonds size={110} color={c.accent} className="absolute" style={{ bottom: "-1.2rem", left: "-1.2rem", opacity: 0.4 }} />
    </div>
  );
}

/* ── "Jump to" searchable selector ── */
function JumpTo({
  officers,
  active,
  onSelect,
}: {
  officers: Officer[];
  active: number;
  onSelect: (i: number) => void;
}) {
  const { c } = useDS();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return officers
      .map((o, i) => ({ o, i }))
      .filter(({ o }) => !q || o.role.toLowerCase().includes(q) || o.name.toLowerCase().includes(q));
  }, [officers, query]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = officers[active];

  return (
    <div ref={wrapRef} className="relative" style={{ width: "min(20rem, 78vw)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="ofc-jump flex items-center justify-between w-full"
        style={{
          gap: "1rem",
          padding: "0.7rem 0.9rem",
          backgroundColor: c.panel,
          border: `1px solid ${open ? c.accent : c.ruleStrong}`,
          color: c.text,
          cursor: "pointer",
          transition: `border-color ${motion.fast}`,
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex flex-col items-start" style={{ gap: "0.15rem", minWidth: 0 }}>
          <span style={{ ...t.label, color: c.faint, letterSpacing: "0.16em" }}>Jump To</span>
          <span style={{ ...t.mono, color: c.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "13rem" }}>
            {pad2(active + 1)} · {current.role}
          </span>
        </span>
        <span style={{ color: c.accent, transform: open ? "rotate(180deg)" : "none", transition: `transform ${motion.fast}` }}>
          <IconChevron dir="down" size={18} />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-40 flex flex-col"
          style={{
            top: "calc(100% + 0.5rem)",
            width: "min(22rem, 84vw)",
            maxHeight: "min(60vh, 30rem)",
            backgroundColor: c.surface,
            border: `1px solid ${c.accent}`,
            boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
          }}
        >
          <div className="flex items-center" style={{ gap: "0.6rem", padding: "0.75rem 0.9rem", borderBottom: `1px solid ${c.rule}`, color: c.faint }}>
            <IconSearch size={16} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search officers or roles…"
              style={{ ...t.body, background: "transparent", border: "none", outline: "none", color: c.text, width: "100%" }}
            />
          </div>
          <div className="flex flex-col" style={{ overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div style={{ ...t.bodySmall, color: c.faint, padding: "1rem 0.9rem" }}>No officers match “{query}”.</div>
            )}
            {filtered.map(({ o, i }) => {
              const on = i === active;
              return (
                <button
                  key={o.id}
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    onSelect(i);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="ofc-option flex items-center justify-between w-full text-left"
                  style={{
                    gap: "0.75rem",
                    padding: "0.65rem 0.9rem",
                    background: on ? c.accentWash : "transparent",
                    borderBottom: `1px solid ${c.rule}`,
                    cursor: "pointer",
                  }}
                >
                  <span className="flex items-center" style={{ gap: "0.75rem", minWidth: 0 }}>
                    <span style={{ ...t.mono, color: on ? c.accent : c.faint, width: "1.5rem" }}>{pad2(i + 1)}</span>
                    <span style={{ ...t.body, color: on ? c.text : c.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.role}</span>
                  </span>
                  {on ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                      <path d="M5 0 L10 5 L5 10 L0 5 Z" fill={c.accent} />
                    </svg>
                  ) : (
                    <span style={{ ...t.bodySmall, color: c.faint, whiteSpace: "nowrap" }}>{o.name}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main ── */
export default function OfficersRoster({ officers = ROSTER }: { officers?: Officer[] }) {
  const { c } = useDS();
  const total = officers.length;
  const [active, setActive] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const tokenRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const infoRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);

  const go = useCallback((delta: number) => setActive((i) => (i + delta + total) % total), [total]);

  // Deep-link: read hash on mount, keep it in sync as officers change.
  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    const found = officers.findIndex((o) => o.id === id);
    if (found >= 0) setActive(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const id = officers[active]?.id;
    if (id && window.location.hash.replace(/^#/, "") !== id) {
      history.replaceState(null, "", `#${id}`);
    }
  }, [active, officers]);

  // Arrow-key navigation (ignore while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Blink the swapped officer content in — pure opacity, no movement, matching
  // the site-wide reveal language (and it never touches page scroll position).
  useEffect(() => {
    const targets = [infoRef.current, portraitRef.current].filter(Boolean) as Element[];
    runBlinkIn(targets, { stagger: 0.06 });
  }, [active]);

  // Centre the active token WITHIN the rail only — scroll the rail element
  // directly instead of scrollIntoView(), which would also scroll the page.
  useEffect(() => {
    const rail = railRef.current;
    const token = tokenRefs.current[active];
    if (!rail || !token) return;
    const railRect = rail.getBoundingClientRect();
    const tokRect = token.getBoundingClientRect();
    const delta = tokRect.left - railRect.left - (rail.clientWidth - tokRect.width) / 2;
    rail.scrollTo({ left: rail.scrollLeft + delta, behavior: "smooth" });
  }, [active]);

  const officer = officers[active];

  return (
    <Surface corners="bottom-right">
      <style>{`
        .ofc-root { max-width: 100%; overflow-x: clip; padding-left: ${layout.gutter}; padding-right: ${layout.gutter}; padding-top: calc(${layout.navHeight} + clamp(1.25rem, 3vh, 2.25rem)); padding-bottom: clamp(1.25rem, 3vh, 2rem); }
        @media (min-width: 1024px) { .ofc-root { height: 100dvh; overflow: hidden; } }
        .ofc-root * { min-width: 0; }
        .ofc-portrait-frame { width: min(26rem, 68vw); aspect-ratio: 4 / 5; max-height: 56vh; }
        @media (min-width: 1024px) { .ofc-portrait-frame { height: 100%; max-height: none; width: auto; aspect-ratio: 4 / 5; } }
        .ofc-nav { transition: background-color ${motion.fast}, border-color ${motion.fast}, color ${motion.fast}; }
        .ofc-nav:hover { border-color: ${c.accent} !important; color: ${c.accent} !important; }
        .ofc-token { transition: transform ${motion.base} ${motion.ease}, opacity ${motion.fast}; }
        .ofc-token:hover { transform: translateY(-4px); }
        .ofc-option:hover { background: ${c.panel} !important; }
        .ofc-social { transition: color ${motion.fast}; }
        .ofc-social:hover { color: ${c.accent} !important; }
        .ofc-rail::-webkit-scrollbar { height: 0; }
        @media (prefers-reduced-motion: reduce) { .ofc-token { transition: none !important; } }
      `}</style>

      <div className="ofc-root relative flex flex-col w-full" style={{ minHeight: "100dvh" }}>
        {/* Header: title + jump-to */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between" style={{ gap: "1rem", flexShrink: 0 }}>
          <div className="flex flex-col" style={{ gap: "0.4rem" }}>
            <span style={{ ...t.eyebrow, color: c.accent }}>Chapter Officers · A.Y. 2025–2026</span>
            <h1 style={{ ...t.title, fontSize: "clamp(1.6rem, 3.2vw, 2.75rem)", color: c.text, margin: 0 }}>The Roster</h1>
          </div>
          <JumpTo officers={officers} active={active} onSelect={setActive} />
        </header>

        {/* Stage */}
        <div className="ofc-stage relative flex-1 grid grid-cols-1 lg:grid-cols-[1.05fr_minmax(0,30rem)]" style={{ gap: "clamp(1.5rem, 4vw, 3.5rem)", alignItems: "center", minHeight: 0, marginTop: "clamp(1rem, 3vh, 2rem)" }}>
          {/* Left: officer info */}
          <div ref={infoRef} className="order-2 lg:order-1 flex flex-col" style={{ gap: "clamp(1rem, 2.2vh, 1.6rem)" }}>
            <div className="flex items-center" style={{ gap: "0.9rem" }}>
              <svg width="11" height="11" viewBox="0 0 10 10" aria-hidden>
                <path d="M5 0 L10 5 L5 10 L0 5 Z" fill={c.accent} />
              </svg>
              <span style={{ ...t.mono, color: c.text, letterSpacing: "0.12em" }}>{pad2(active + 1)} / {pad2(total)}</span>
              <span style={{ width: "2.5rem", height: 1, background: c.ruleStrong }} />
              <span style={{ ...t.label, color: c.faint }}>Now Viewing</span>
            </div>

            <span style={{ ...t.label, textTransform: "uppercase", color: c.accent, border: `1px solid ${c.accent}`, padding: "0.4rem 0.85rem", alignSelf: "flex-start" }}>
              {officer.role}
            </span>

            <div className="flex flex-col" style={{ gap: "0.5rem" }}>
              <h2 style={{ ...t.display, fontSize: "clamp(2.5rem, 6vw, 5.25rem)", lineHeight: 0.95, color: c.text, margin: 0, overflowWrap: "break-word", maxWidth: "100%" }}>{officer.name}</h2>
              <span style={{ ...t.body, color: c.muted }}>{officer.role} · {officer.course}</span>
            </div>

            <p style={{ ...t.body, color: c.muted, maxWidth: "34rem", margin: 0 }}>{officer.tagline}</p>

            <div style={{ height: 1, background: c.rule, maxWidth: "34rem" }} />

            {/* signature stats */}
            <div className="flex flex-wrap" style={{ gap: "clamp(1.5rem, 4vw, 3.5rem)" }}>
              {[
                { k: "Role Since", v: officer.since },
                { k: "Department", v: officer.department },
                { k: "Course", v: officer.course.replace(/^BS /, "").replace(" Computer Science", "SCS") },
              ].map((s) => (
                <div key={s.k} className="flex flex-col" style={{ gap: "0.5rem" }}>
                  <span style={{ width: "1.4rem", height: 2, background: c.accent }} />
                  <span style={{ ...t.label, color: c.faint }}>{s.k}</span>
                  <span style={{ ...t.mono, color: c.text }}>{s.v}</span>
                </div>
              ))}
            </div>

            {/* socials */}
            <div className="flex items-center" style={{ gap: "1rem" }}>
              <span style={{ ...t.label, color: c.faint }}>Connect</span>
              {officer.socials?.instagram && (
                <a href={officer.socials.instagram} aria-label="Instagram" style={{ color: c.muted }} className="ofc-social"><IconInstagram /></a>
              )}
              {officer.socials?.linkedin && (
                <a href={officer.socials.linkedin} aria-label="LinkedIn" style={{ color: c.muted }} className="ofc-social"><IconLinkedin /></a>
              )}
              {officer.socials?.email && (
                <a href={`mailto:${officer.socials.email}`} aria-label="Email" style={{ color: c.muted }} className="ofc-social"><IconMail /></a>
              )}
            </div>
          </div>

          {/* Right: portrait + flanking nav */}
          <div className="order-1 lg:order-2 relative flex items-center justify-center h-full" style={{ minHeight: "min(56vh, 30rem)" }}>
            <button
              onClick={() => go(-1)}
              aria-label="Previous officer"
              className="ofc-nav absolute z-20 flex items-center justify-center"
              style={{ left: "-0.5rem", top: "50%", transform: "translateY(-50%)", width: "3rem", height: "3rem", background: c.surface, border: `1px solid ${c.ruleStrong}`, color: c.muted, cursor: "pointer" }}
            >
              <IconChevron dir="left" />
            </button>

            <div ref={portraitRef} className="w-full h-full flex items-center justify-center">
              <PortraitStage officer={officer} index={active} total={total} />
            </div>

            <button
              onClick={() => go(1)}
              aria-label="Next officer"
              className="ofc-nav absolute z-20 flex items-center justify-center"
              style={{ right: "-0.5rem", top: "50%", transform: "translateY(-50%)", width: "3rem", height: "3rem", background: c.accentWash, border: `1px solid ${c.accent}`, color: c.accent, cursor: "pointer" }}
            >
              <IconChevron dir="right" />
            </button>
          </div>
        </div>

        {/* Roster rail */}
        <div style={{ flexShrink: 0, marginTop: "clamp(1rem, 2.5vh, 1.75rem)", borderTop: `1px solid ${c.rule}`, paddingTop: "clamp(0.9rem, 2vh, 1.4rem)" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: "0.85rem" }}>
            <span style={{ ...t.label, color: c.muted }}>The Roster · {total} Officers</span>
            <span style={{ ...t.label, color: c.faint }}>← → browse · or use Jump To</span>
          </div>
          <div
            ref={railRef}
            className="ofc-rail flex"
            style={{
              gap: "clamp(0.75rem, 1.6vw, 1.4rem)",
              overflowX: "auto",
              paddingBottom: "0.35rem",
              scrollbarWidth: "none",
              WebkitMaskImage: "linear-gradient(90deg, transparent 0, #000 3%, #000 97%, transparent 100%)",
              maskImage: "linear-gradient(90deg, transparent 0, #000 3%, #000 97%, transparent 100%)",
            }}
          >
            {officers.map((o, i) => {
              const on = i === active;
              return (
                <button
                  key={o.id}
                  ref={(el) => { tokenRefs.current[i] = el; }}
                  onClick={() => setActive(i)}
                  aria-label={`${o.role} — ${o.name}`}
                  aria-pressed={on}
                  className="ofc-token flex flex-col items-center flex-shrink-0"
                  style={{ gap: "0.5rem", width: "clamp(6rem, 8vw, 7.5rem)", background: "transparent", border: "none", cursor: "pointer", opacity: on ? 1 : 0.72, padding: "0.25rem 0" }}
                >
                  <DiamondPortrait officer={o} active={on} size={72} />
                  <span style={{ ...t.label, fontSize: "clamp(0.5rem, 0.7vw, 0.625rem)", color: on ? c.text : c.muted, textAlign: "center", lineHeight: 1.2 }}>{o.role}</span>
                  <span style={{ ...t.bodySmall, fontSize: "0.625rem", color: c.faint, textAlign: "center" }}>{o.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Surface>
  );
}
