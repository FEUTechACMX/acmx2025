"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import type { EventWithCount } from "@/types/events";
import {
  Surface,
  Column,
  Rule,
  Label,
  Subheading,
  Panel,
  DataRow,
  Button,
} from "@/components/ds";
import { useDS } from "@/components/ds/useDS";
import { type as t, layout, motion } from "@/styles/design-system";
import AttendanceLookup from "./AttendanceLookup";

/* ──────────────────────────────────────────────────────────────
 * PastEventExperience — "The Memory Doors"
 *
 * A finished event opens like a set of doors onto the night it was.
 * Scroll (or click the seal) parts the diamond portal, then a vertical
 * "memory walk" replays the event: opening memory, a threaded run of
 * chapters, a memory wall (gallery), the purpose, the record, an afterglow.
 *
 * Everything is data-driven off the Event so it works for any event —
 * chapters come from sub-events (multi-day) or description paragraphs;
 * the wall uses `gallery` and falls back to labelled placeholders until
 * photos are added.
 * ────────────────────────────────────────────────────────────── */

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const fmtShort = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtLong = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);

/* ── Reveal on scroll ─────────────────────────────────────────── */
function useReveal(threshold = 0.15): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, shown];
}

function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [ref, shown] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px)`,
        transition: `opacity 0.7s ${motion.ease} ${delay}s, transform 0.7s ${motion.ease} ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Count-up number ──────────────────────────────────────────── */
function CountUp({ target, active, duration = 1300 }: { target: number; active: boolean; duration?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setV(Math.round(easeOut(p) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return <>{v.toLocaleString()}</>;
}

/* ── Diamond glyph ────────────────────────────────────────────── */
function Diamond({ size, color, lit = false }: { size: number; color: string; lit?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" style={{ display: "block", overflow: "visible" }}>
      <path
        d="M5 0 L10 5 L5 10 L0 5 Z"
        fill={lit ? color : "transparent"}
        stroke={color}
        strokeWidth={1}
        style={{
          filter: lit ? `drop-shadow(0 0 6px ${color})` : "none",
          transition: `fill ${motion.base}, filter ${motion.base}`,
        }}
      />
    </svg>
  );
}

/* ── Section label (tracked caps over a hairline) ─────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  const { c } = useDS();
  return (
    <div style={{ marginBottom: layout.gapTight }}>
      <Label style={{ color: c.faint }}>{children}</Label>
      <div style={{ marginTop: "0.55rem" }}>
        <Rule />
      </div>
    </div>
  );
}

function PhotoPlaceholder({ label = "MEMORY · ADDED LATER" }: { label?: string }) {
  const { c } = useDS();
  return (
    <div
      className="flex flex-col items-center justify-center gap-2"
      style={{ width: "100%", height: "100%", color: c.faint }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
        <rect x="3" y="3" width="18" height="18" />
        <circle cx="8.5" cy="8.5" r="1.6" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      <span style={{ ...t.label, textTransform: "uppercase", color: c.faint }}>{label}</span>
    </div>
  );
}

/* ── Doors intro — an auto-opening preloader that dissolves into the page ── */
function DoorsIntro({ event, onDone }: { event: EventWithCount; onDone: () => void }) {
  const { c } = useDS();
  const [opened, setOpened] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const edition = event.name.match(/(\d+)(?:st|nd|rd|th)/i)?.[1];

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reduce) {
      timers.push(setTimeout(onDone, 150));
    } else {
      timers.push(setTimeout(() => setOpened(true), 600)); // doors part
      timers.push(setTimeout(() => setLeaving(true), 1700)); // overlay dissolves
      timers.push(setTimeout(onDone, 2300)); // fully gone → unlock page
    }
    return () => {
      timers.forEach(clearTimeout);
      document.body.style.overflow = prevOverflow;
    };
  }, [onDone]);

  const doorFill = c.panel;
  const doorTrans = `transform 1.1s ${motion.ease}, opacity 1.1s ${motion.ease}`;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center text-center"
      style={{
        zIndex: 60,
        backgroundColor: c.surface,
        opacity: leaving ? 0 : 1,
        transition: `opacity 0.58s ${motion.ease}`,
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      {/* Portal */}
      <div className="relative flex items-center justify-center" style={{ width: "min(78vw, 540px)", aspectRatio: "1" }}>
        {/* light bloom */}
        <div
          aria-hidden
          className="absolute"
          style={{
            width: "80%",
            height: "80%",
            borderRadius: "50%",
            background: `radial-gradient(circle, #ffffff 0%, ${c.accent} 34%, transparent 70%)`,
            opacity: opened ? 0.55 : 0,
            transform: opened ? "scale(1.7)" : "scale(0.35)",
            filter: "blur(22px)",
            transition: `opacity 1.1s ${motion.ease}, transform 1.2s ${motion.ease}`,
          }}
        />
        <svg viewBox="0 0 520 520" className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
          {/* concentric ornament */}
          <g
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              opacity: opened ? 0 : 1,
              transform: opened ? "scale(0.82)" : "none",
              transition: doorTrans,
            }}
          >
            {[210, 160, 110].map((h, i) => (
              <path
                key={h}
                d={`M260 ${260 - h} L${260 + h} 260 L260 ${260 + h} L${260 - h} 260 Z`}
                fill="none"
                stroke={c.accent}
                strokeWidth={1}
                opacity={0.16 + i * 0.07}
              />
            ))}
          </g>
          {/* left door */}
          <g
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              transform: opened ? "translateX(-120px) rotate(-5deg)" : "none",
              opacity: opened ? 0 : 1,
              transition: doorTrans,
            }}
          >
            <path d="M260 50 L50 260 L260 470 Z" fill={doorFill} stroke={c.accent} strokeWidth={1.4} />
          </g>
          {/* right door */}
          <g
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              transform: opened ? "translateX(120px) rotate(5deg)" : "none",
              opacity: opened ? 0 : 1,
              transition: doorTrans,
            }}
          >
            <path d="M260 50 L470 260 L260 470 Z" fill={doorFill} stroke={c.accent} strokeWidth={1.4} />
          </g>
          {/* seam / beam */}
          <line
            x1="260"
            y1="52"
            x2="260"
            y2="468"
            stroke={c.accent}
            strokeWidth={opened ? 3 : 1.6}
            style={{ opacity: opened ? 0.9 : 0.85, transition: doorTrans, filter: opened ? `drop-shadow(0 0 10px ${c.accent})` : "none" }}
          />
        </svg>

        {/* seal */}
        {edition && (
          <div
            aria-hidden
            className="absolute"
            style={{
              width: 76,
              height: 76,
              opacity: opened ? 0 : 1,
              transition: `opacity 0.5s ${motion.ease}`,
            }}
          >
            <svg viewBox="0 0 76 76" className="w-full h-full">
              <path d="M38 2 L74 38 L38 74 L2 38 Z" fill={c.surface} stroke={c.accent} strokeWidth={1.5} />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center"
              style={{ ...t.label, color: c.accent, letterSpacing: "0.1em" }}
            >
              {edition}
            </span>
          </div>
        )}
      </div>

      {/* Title overlay */}
      <div
        className="pointer-events-none absolute left-0 right-0 flex flex-col items-center"
        style={{
          padding: `0 ${layout.gutter}`,
          gap: "1rem",
          opacity: opened ? 0 : 1,
          transform: opened ? "translateY(-12px)" : "none",
          transition: `opacity 0.7s ${motion.ease}, transform 0.9s ${motion.ease}`,
        }}
      >
        <span style={{ ...t.eyebrow, color: c.muted }}>
          ACM · {event.eventSemester} SEMESTER · {new Date(event.startDate).getFullYear()}
        </span>
        <h1 style={{ ...t.title, color: c.text, maxWidth: "16ch", margin: 0 }}>{event.name}</h1>
      </div>
    </div>
  );
}

/* ── Chapter scene ────────────────────────────────────────────── */
type Chapter = { label: string; date?: string; title?: string; body: string };

function ChapterScene({
  chapter,
  index,
  image,
  isLast,
}: {
  chapter: Chapter;
  index: number;
  image?: string;
  isLast: boolean;
}) {
  const { c } = useDS();
  const [ref, shown] = useReveal(0.25);
  const photoLeft = index % 2 === 0;

  const photo = (
    <div
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: "16 / 10",
        backgroundColor: c.panel,
        border: `1px solid ${c.rule}`,
      }}
    >
      {image ? (
        <img src={image} alt={chapter.title || chapter.label} className="w-full h-full object-cover" />
      ) : (
        <PhotoPlaceholder />
      )}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 8,
          left: 14,
          ...t.display,
          fontSize: "clamp(3rem, 7vw, 6rem)",
          lineHeight: 1,
          color: c.text,
          opacity: 0.06,
        }}
      >
        {chapter.label}
      </span>
    </div>
  );

  const text = (
    <div className="flex flex-col" style={{ gap: "1rem" }}>
      <div className="flex items-center" style={{ gap: "0.9rem" }}>
        <span style={{ ...t.display, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", lineHeight: 1, color: c.accent, opacity: 0.55 }}>
          {chapter.label}
        </span>
        {(chapter.title || chapter.date) && (
          <Subheading style={{ color: c.text }}>{chapter.title || chapter.date}</Subheading>
        )}
      </div>
      {chapter.date && chapter.title && <Label style={{ color: c.faint }}>{chapter.date}</Label>}
      <p style={{ ...t.body, color: c.muted, margin: 0, maxWidth: "46ch" }}>{chapter.body}</p>
    </div>
  );

  return (
    <div ref={ref} className="relative flex" style={{ gap: "clamp(1rem, 3vw, 2.5rem)" }}>
      {/* thread gutter */}
      <div className="relative hidden md:flex flex-col items-center" style={{ width: 40, flexShrink: 0 }}>
        <div style={{ marginTop: "0.35rem" }}>
          <Diamond size={16} color={c.accent} lit={shown} />
        </div>
        {!isLast && (
          <div
            style={{
              width: 1,
              flex: 1,
              marginTop: "0.5rem",
              background: c.rule,
            }}
          />
        )}
      </div>

      {/* content */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 flex-1"
        style={{
          gap: "clamp(1.25rem, 3vw, 2.75rem)",
          alignItems: "center",
          paddingBottom: "clamp(2.5rem, 6vh, 4.5rem)",
          opacity: shown ? 1 : 0,
          transform: shown ? "none" : "translateY(30px)",
          transition: `opacity 0.7s ${motion.ease}, transform 0.7s ${motion.ease}`,
        }}
      >
        {photoLeft ? (
          <>
            {photo}
            {text}
          </>
        ) : (
          <>
            <div className="order-2 md:order-1">{text}</div>
            <div className="order-1 md:order-2">{photo}</div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Stats band ───────────────────────────────────────────────── */
function StatsBand({ stats }: { stats: { n: number | string; l: string }[] }) {
  const { c } = useDS();
  const [ref, shown] = useReveal(0.4);
  return (
    <div ref={ref} className="flex flex-wrap" style={{ gap: "clamp(2rem, 5vw, 4.5rem)" }}>
      {stats.map(({ n, l }) => (
        <div key={l} className="flex flex-col">
          <span style={{ ...t.display, fontSize: "clamp(1.75rem, 3vw, 2.5rem)", lineHeight: 1, color: c.text }}>
            {typeof n === "number" ? <CountUp target={n} active={shown} /> : n}
          </span>
          <div style={{ width: "1.6rem", height: 2, backgroundColor: c.accent, margin: "0.55rem 0 0.5rem" }} />
          <Label style={{ color: c.faint }}>{l}</Label>
        </div>
      ))}
    </div>
  );
}

/* ── Memory wall (gallery / placeholders + lightbox) ──────────── */
function MemoryWall({ images, eventName }: { images: string[]; eventName: string }) {
  const { c } = useDS();
  const [open, setOpen] = useState<number | null>(null);
  const has = images.length > 0;
  const tiles = has ? images : Array.from({ length: 8 });

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  return (
    <section>
      <SectionLabel>The Memory Wall</SectionLabel>
      <div
        className="grid"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(clamp(160px, 22vw, 240px), 1fr))", gap: "0.75rem" }}
      >
        {tiles.map((img, i) => (
          <button
            key={i}
            onClick={() => has && setOpen(i)}
            className="acmx-tile relative overflow-hidden"
            style={{
              aspectRatio: "1",
              backgroundColor: c.panel,
              border: `1px solid ${c.rule}`,
              cursor: has ? "pointer" : "default",
              padding: 0,
            }}
          >
            {has ? (
              <img src={img as string} alt={`${eventName} ${i + 1}`} className="w-full h-full object-cover" />
            ) : (
              <PhotoPlaceholder label="" />
            )}
          </button>
        ))}
      </div>
      <p style={{ ...t.bodySmall, color: c.faint, marginTop: "1rem" }}>
        {has ? "Tap a tile to open it." : "Photos from the night will appear here soon."}
      </p>

      {open !== null && has && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.94)" }}
          onClick={() => setOpen(null)}
        >
          <img
            src={images[open]}
            alt={`${eventName} ${open + 1}`}
            className="max-w-[92vw] max-h-[88vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setOpen(null)}
            className="absolute top-5 right-5 cursor-pointer"
            style={{ ...t.label, color: "rgba(255,255,255,0.8)", background: "transparent", border: "none" }}
            aria-label="Close"
          >
            CLOSE ✕
          </button>
        </div>
      )}
    </section>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function PastEventExperience({ event, isAdmin }: { event: EventWithCount; isAdmin: boolean }) {
  const { c } = useDS();
  const [introDone, setIntroDone] = useState(false);

  const registered = event._aggregatedCount?.registrations ?? event._count.registrations;
  const gallery = event.gallery ?? [];
  const hasSub = !!event.subEvents && event.subEvents.length > 0;

  // Chapters: sub-events (multi-day) or description paragraphs.
  const chapters: Chapter[] = hasSub
    ? event.subEvents!.map((s, i) => ({
        label: `Day ${i + 1}`,
        date: fmtShort(s.startDate),
        title: s.name,
        body: s.description || "A moment from the day.",
      }))
    : (event.description || "")
        .split(/\n{2,}/)
        .map((p) => p.replace(/\*\*/g, "").trim())
        .filter((p) => p.length > 0)
        .slice(0, 6)
        .map((body, i) => {
          // Pull a leading "Day N: ..." or "Heading:" as the chapter title.
          const m = body.match(/^([^.:\n]{3,48})[:—-]\s+([\s\S]*)/);
          if (m && m[1].split(" ").length <= 6) {
            return { label: ROMAN[i] ?? String(i + 1), title: m[1].trim(), body: m[2].trim() };
          }
          return { label: ROMAN[i] ?? String(i + 1), body };
        });

  const lead =
    event.overview?.trim() ||
    (event.description || "").split(/\n{2,}/)[0]?.replace(/\*\*/g, "").trim() ||
    "A night worth remembering.";

  const stats: { n: number | string; l: string }[] = [
    { n: registered, l: "Registered" },
    ...(gallery.length ? [{ n: gallery.length, l: "Photos" }] : []),
    { n: hasSub ? event.subEvents!.length : 1, l: hasSub ? "Sessions" : "Night" },
    { n: fmtShort(event.startDate), l: "Held On" },
  ];

  const heroImage = event.image || gallery[0] || event.cardImage || null;
  const record: { k: string; v: string }[] = [
    { k: "Date", v: fmtLong(event.startDate) },
    { k: "Venue", v: event.venue },
    ...(event.type?.length ? [{ k: "Format", v: event.type.join(" · ") }] : []),
    { k: "Term", v: `${event.eventSemester} Term` },
    ...(event.targetParticipants ? [{ k: "Who Came", v: event.targetParticipants }] : []),
    { k: "Attendance", v: `${registered.toLocaleString()} registered` },
  ];

  return (
    <Surface corners="bottom-right">
      <style>{`
        @keyframes acmxPulse { 0%,100% { opacity: 1 } 50% { opacity: 0.45 } }
        .acmx-pulse { animation: acmxPulse 2.4s ease-in-out infinite; }
        .acmx-tile { transition: transform ${motion.base} ${motion.ease}, border-color ${motion.fast}; }
        .acmx-tile:hover { transform: translateY(-4px); border-color: ${c.accent} !important; }
      `}</style>

      {/* Preloader: the doors open into the page on load */}
      {!introDone && <DoorsIntro event={event} onDone={() => setIntroDone(true)} />}

      {/* THE MEMORY WALK */}
      <Column reveal={false} style={{ paddingTop: "clamp(1rem, 3vh, 2rem)", gap: `calc(${layout.gap} * 1.5)` }}>
        {/* Back link */}
        <Link
          href="/events"
          style={{ ...t.label, textTransform: "uppercase", color: c.faint, textDecoration: "none", display: "inline-block" }}
        >
          ← Back to Events
        </Link>

        {/* Opening memory */}
        <Reveal>
          <div
            className="relative w-full overflow-hidden"
            style={{ aspectRatio: "21 / 9", maxHeight: "26rem", backgroundColor: "#1e1d22", border: `1px solid ${c.rule}` }}
          >
            {heroImage ? (
              <img src={heroImage} alt={event.name} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0">
                <PhotoPlaceholder label="OPENING MEMORY · PHOTO ADDED LATER" />
              </div>
            )}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.75) 100%)" }}
            />
            <div className="absolute left-0 bottom-0 flex flex-col" style={{ padding: "clamp(1.5rem, 3vw, 2.5rem)", gap: "0.6rem" }}>
              <span style={{ ...t.label, textTransform: "uppercase", color: c.accent }}>
                Chapter 00 · You step inside
              </span>
              <h2 style={{ ...t.heading, color: "#ffffff", margin: 0 }}>The night we remember</h2>
            </div>
          </div>
        </Reveal>

        {/* Intro lead */}
        <Reveal>
          <div className="flex flex-col items-center text-center" style={{ gap: "0.9rem" }}>
            <p style={{ ...t.body, fontSize: "clamp(1.05rem, 1.8vw, 1.5rem)", lineHeight: 1.55, color: c.text, maxWidth: "42ch", margin: 0 }}>
              {lead}
            </p>
            <Label style={{ color: c.faint }}>
              {chapters.length > 1 ? `${chapters.length} moments from the night` : "How the night unfolded"}
            </Label>
          </div>
        </Reveal>

        {/* Stats */}
        <StatsBand stats={stats} />

        {/* Chapters */}
        <div className="flex flex-col" style={{ marginTop: layout.gapTight }}>
          {chapters.map((ch, i) => (
            <ChapterScene
              key={i}
              chapter={ch}
              index={i}
              image={gallery[i % Math.max(gallery.length, 1)] || undefined}
              isLast={i === chapters.length - 1}
            />
          ))}
        </div>

        {/* Memory wall */}
        <MemoryWall images={gallery} eventName={event.name} />

        {/* Purpose */}
        {(event.mainObjective || (event.specificObjectives?.length ?? 0) > 0) && (
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr]" style={{ gap: `calc(${layout.gap} * 1.5)` }}>
              <section>
                <SectionLabel>Why the night mattered</SectionLabel>
                {event.mainObjective && (
                  <p style={{ ...t.body, fontSize: "1.0625rem", color: c.text, maxWidth: "52ch", margin: "0 0 1.25rem" }}>
                    {event.mainObjective}
                  </p>
                )}
                {(event.specificObjectives?.length ?? 0) > 0 && (
                  <div className="flex flex-col" style={{ gap: "0.75rem", maxWidth: "52ch" }}>
                    {event.specificObjectives!.map((o, i) => (
                      <div key={i} className="flex" style={{ gap: "0.9rem" }}>
                        <span style={{ ...t.mono, color: c.accent }}>{String(i + 1).padStart(2, "0")}</span>
                        <span style={{ ...t.body, color: c.muted }}>{o}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <aside>
                <Panel>
                  <Label style={{ color: c.faint }}>From the record</Label>
                  <div style={{ marginTop: layout.gapTight }}>
                    {record.map(({ k, v }) => (
                      <DataRow key={k} label={k} value={v} />
                    ))}
                  </div>
                </Panel>
              </aside>
            </div>
          </Reveal>
        )}

        {/* Afterglow */}
        <Reveal>
          <div className="flex flex-col items-center text-center" style={{ gap: "1.1rem", paddingTop: "clamp(2rem, 5vh, 4rem)" }}>
            <div style={{ filter: `drop-shadow(0 0 16px ${c.accent})` }}>
              <Diamond size={40} color={c.accent} lit />
            </div>
            <Label style={{ color: c.accent }}>The doors close</Label>
            <h2 style={{ ...t.title, fontSize: "clamp(1.75rem, 3.5vw, 3rem)", color: c.text, margin: 0 }}>Until next year</h2>
            <p style={{ ...t.body, color: c.muted, maxWidth: "40ch", margin: 0 }}>
              The masks came off. The memories stayed.
            </p>
            <div style={{ width: 120, marginTop: "0.5rem" }}>
              <Rule />
            </div>
            <Link href="/events" style={{ ...t.label, textTransform: "uppercase", color: c.faint, textDecoration: "none" }}>
              ← Back to Events
            </Link>
            {gallery.length === 0 && (
              <span style={{ ...t.bodySmall, color: c.faint, fontStyle: "italic" }}>
                Photos from the night will appear here soon.
              </span>
            )}
          </div>
        </Reveal>

        {/* Admin */}
        {isAdmin && (
          <section>
            <SectionLabel>Admin</SectionLabel>
            <Link href={`/events/${event.eventId}/admin`}>
              <Button variant="outline">Manage Event →</Button>
            </Link>
          </section>
        )}

        {/* Attendance lookup (retained utility) */}
        <AttendanceLookup
          eventId={event.eventId}
          subEvents={event.subEvents?.map((sub) => ({ eventId: sub.eventId, name: sub.name }))}
        />
      </Column>
    </Surface>
  );
}
