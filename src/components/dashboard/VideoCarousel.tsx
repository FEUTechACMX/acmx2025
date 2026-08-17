"use client";

import React, { useEffect, useRef, useState } from "react";
import { type as t, motion } from "@/styles/design-system";
import { useDS } from "@/components/ds";

export type FeaturedVideo = {
  id: string;
  title: string;
  subtitle?: string | null;
  videoUrl: string;
  redirectUrl?: string | null;
};

/** Dark stage colour — the slideshow reads as cinematic in both themes. */
const STAGE = "#1c1b20";

type Props = {
  videos: FeaturedVideo[];
  isAdmin?: boolean;
  onManage?: () => void;
  /** Fill the parent's height instead of using a fixed 16:9 aspect ratio. */
  fillHeight?: boolean;
};

/**
 * Featured video slideshow. Autoplays MUTED through the queue — the only
 * user control is mute/unmute (no play/pause). Dots (inside the stage) and
 * chevrons cycle slides; it advances automatically when a clip ends. Clicking
 * the stage / "Watch" opens that slide's redirect link.
 */
export default function VideoCarousel({ videos, isAdmin, onManage, fillHeight = false }: Props) {
  const { c } = useDS();
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const count = videos.length;
  const current = videos[index];

  const stageSize: React.CSSProperties = fillHeight
    ? { flex: "1 1 0", minHeight: 220 }
    : { aspectRatio: "16 / 9" };
  const emptySize: React.CSSProperties = fillHeight
    ? { height: "100%", minHeight: 220 }
    : { aspectRatio: "16 / 9" };

  // Keep the clamped index valid if the list length changes. Adjusted during
  // render: as an effect this rendered one frame against an out-of-range index,
  // which is the frame where `videos[index]` is undefined.
  const [prevCount, setPrevCount] = useState(count);
  if (count !== prevCount) {
    setPrevCount(count);
    if (index > count - 1) setIndex(0);
  }

  // Re-apply muted state and (re)start playback whenever the slide changes.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted;
    el.play().catch(() => {
      /* autoplay may be blocked until interaction — that's fine */
    });
  }, [index, muted]);

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count);
  const openLink = () => {
    if (current?.redirectUrl) window.open(current.redirectUrl, "_blank", "noopener");
  };

  /* ── Empty state — no videos uploaded ── */
  if (count === 0) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          ...emptySize,
          backgroundColor: STAGE,
          border: `1px solid ${c.ruleStrong}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.9rem",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <VideoOffIcon color="rgba(255,255,255,0.45)" size={34} />
        <span style={{ ...t.subheading, color: "#ffffff" }}>No videos yet</span>
        <span
          style={{ ...t.bodySmall, color: "rgba(255,255,255,0.6)", maxWidth: 340 }}
        >
          Highlight reels and event recaps will play here once an admin uploads them.
        </span>
        {isAdmin && (
          <button
            onClick={onManage}
            style={{
              ...t.label,
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.35rem",
              padding: "0.7rem 1.4rem",
              color: "#ffffff",
              backgroundColor: c.accent,
              border: "none",
              cursor: "pointer",
            }}
          >
            <UploadIcon color="#ffffff" size={14} /> Upload a video
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={
        fillHeight
          ? { height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }
          : { width: "100%" }
      }
    >
      {/* ── Stage ── */}
      <div
        onClick={openLink}
        style={{
          position: "relative",
          width: "100%",
          ...stageSize,
          backgroundColor: STAGE,
          border: `1px solid ${c.ruleStrong}`,
          overflow: "hidden",
          cursor: current?.redirectUrl ? "pointer" : "default",
        }}
      >
        <video
          key={current?.id}
          ref={videoRef}
          src={current?.videoUrl}
          muted={muted}
          autoPlay
          playsInline
          onEnded={() => count > 1 && go(1)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Legibility scrim */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Top row: FEATURED tag + counter + admin manage */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "clamp(0.9rem, 1.6vw, 1.5rem)",
          }}
        >
          <span
            style={{
              ...t.label,
              textTransform: "uppercase",
              color: "#ffffff",
              backgroundColor: c.accent,
              padding: "0.35rem 0.7rem",
            }}
          >
            Featured
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <span style={{ ...t.mono, color: "rgba(255,255,255,0.75)" }}>
              {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onManage?.();
                }}
                style={{
                  ...t.label,
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.35rem 0.7rem",
                  color: "rgba(255,255,255,0.85)",
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  cursor: "pointer",
                }}
              >
                <UploadIcon color="rgba(255,255,255,0.85)" size={11} /> Manage
              </button>
            )}
          </div>
        </div>

        {/* Chevrons */}
        {count > 1 && (
          <>
            <StageButton side="left" onClick={() => go(-1)}>
              <ChevronIcon dir="left" />
            </StageButton>
            <StageButton side="right" onClick={() => go(1)}>
              <ChevronIcon dir="right" />
            </StageButton>
          </>
        )}

        {/* Mute toggle (the only playback control) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMuted((m) => !m);
          }}
          aria-label={muted ? "Unmute" : "Mute"}
          style={{
            position: "absolute",
            right: "clamp(0.9rem, 1.6vw, 1.5rem)",
            bottom: "clamp(0.9rem, 1.6vw, 1.5rem)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.5rem 0.75rem",
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "rgba(255,255,255,0.85)",
            cursor: "pointer",
            ...t.label,
            textTransform: "uppercase",
          }}
        >
          {muted ? (
            <>
              <VolumeXIcon /> Muted
            </>
          ) : (
            <>
              <Volume2Icon /> Sound
            </>
          )}
        </button>

        {/* Caption */}
        <div
          style={{
            position: "absolute",
            left: "clamp(0.9rem, 1.6vw, 1.5rem)",
            bottom: "clamp(2.4rem, 4vw, 3.2rem)",
            right: "clamp(6rem, 12vw, 9rem)",
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
          }}
        >
          {current?.subtitle && (
            <span
              style={{ ...t.eyebrow, color: "rgba(255,255,255,0.75)" }}
            >
              {current.subtitle}
            </span>
          )}
          <span style={{ ...t.subheading, fontSize: "clamp(1.1rem, 1.8vw, 1.6rem)", color: "#ffffff" }}>
            {current?.title}
          </span>
          {current?.redirectUrl && (
            <span style={{ ...t.bodySmall, color: c.accent }}>Watch &nbsp;&rarr;</span>
          )}
        </div>

        {/* Dot indicators — inside the stage */}
        {count > 1 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: "clamp(0.7rem, 1.4vw, 1.2rem)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {videos.map((v, i) => (
              <button
                key={v.id}
                aria-label={`Go to slide ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                style={{
                  height: 7,
                  width: i === index ? 22 : 7,
                  background: i === index ? c.accent : "rgba(255,255,255,0.4)",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: `width ${motion.base}, background-color ${motion.base}`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Queue strip ── */}
      {count > 1 && (
        <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.7rem" }}>
          {videos.map((v, i) => {
            const active = i === index;
            return (
              <button
                key={v.id}
                onClick={() => setIndex(i)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 60,
                  background: STAGE,
                  border: `1px solid ${active ? c.accent : c.rule}`,
                  padding: "0.55rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  cursor: "pointer",
                  transition: `border-color ${motion.fast}`,
                }}
              >
                {active ? (
                  <Volume2Icon color={c.accent} />
                ) : (
                  <FilmIcon color="rgba(255,255,255,0.45)" />
                )}
                <span
                  style={{
                    ...t.mono,
                    fontSize: "0.625rem",
                    color: "rgba(255,255,255,0.7)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}&nbsp;&nbsp;{v.title}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Stage chevron button ── */
function StageButton({
  side,
  onClick,
  children,
}: {
  side: "left" | "right";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        [side]: "clamp(0.6rem, 1.2vw, 1rem)",
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.08)",
        border: "none",
        color: "#ffffff",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

/* ── Inline icons ── */
function ChevronIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d={dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}
function VolumeXIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
      <path strokeLinecap="round" d="M22 9l-6 6M16 9l6 6" />
    </svg>
  );
}
function Volume2Icon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z" />
      <path strokeLinecap="round" d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />
    </svg>
  );
}
function UploadIcon({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4M6 10l6-6 6 6M4 20h16" />
    </svg>
  );
}
function VideoOffIcon({ color = "currentColor", size = 24 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 16H4a2 2 0 01-2-2V8a2 2 0 012-2h2m4 0h2a2 2 0 012 2v2m4-2l4-2v10M2 2l20 20" />
    </svg>
  );
}
function FilmIcon({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6}>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
    </svg>
  );
}
