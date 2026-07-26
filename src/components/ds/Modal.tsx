"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type as t, motion } from "@/styles/design-system";
import { runBlinkIn } from "@/lib/blink";
import { useDS } from "./useDS";

export type MessageTone = "danger" | "accent" | "positive";

export type ModalMessage = {
  tone: MessageTone;
  text: string;
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * The system's dialog: hairline card on a dimmed substrate, accent cap on top,
 * square corners. One message slot with three skins so two states can never
 * contradict each other on screen.
 *
 * Behaviour that isn't optional, and is why this is a primitive rather than a
 * div in each feature:
 *
 * - Focus moves in on open, is trapped while open, and returns to the trigger
 *   on close. A dialog you can Tab out of is a dialog a keyboard user loses.
 * - Esc and scrim-click both dismiss — unless `dirty`, in which case they ask
 *   first. Losing typed input to a stray click is never acceptable.
 * - Background scroll is locked, so the page doesn't slide behind the card.
 * - Rendered in a portal, so no ancestor's transform or overflow can clip it.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  message,
  footer,
  dirty = false,
  labelledBy,
  width = 540,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  message?: ModalMessage | null;
  /** Right-aligned action row. The left side carries `footerNote`'s text. */
  footer?: React.ReactNode;
  /** Blocks casual dismissal once the user has typed something. */
  dirty?: boolean;
  labelledBy?: string;
  width?: number;
  children: React.ReactNode;
}) {
  const { c } = useDS();
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => setMounted(true), []);

  /** Dismissal request from Esc or the scrim — routed through the dirty guard. */
  const requestClose = useCallback(() => {
    if (dirty) {
      setConfirming(true);
      return;
    }
    onClose();
  }, [dirty, onClose]);

  // Remember the trigger, move focus in, and hand it back on the way out.
  useEffect(() => {
    if (!open) return;

    returnFocusTo.current = document.activeElement as HTMLElement | null;
    setConfirming(false);

    const first = cardRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    return () => {
      returnFocusTo.current?.focus?.();
    };
  }, [open]);

  // Lock background scroll for as long as the dialog owns the screen.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Esc to dismiss, Tab to cycle — never to escape.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
        return;
      }

      if (e.key !== "Tab" || !cardRef.current) return;

      const focusable = Array.from(
        cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, requestClose]);

  // Reveal the body with the same blink the rest of the system uses.
  useEffect(() => {
    if (!open || !bodyRef.current) return;
    runBlinkIn(bodyRef.current.children, { stagger: 0.05 });
  }, [open]);

  if (!mounted || !open) return null;

  const tones: Record<MessageTone, { fg: string; bg: string }> = {
    danger: { fg: c.danger, bg: c.dangerWash },
    accent: { fg: c.accent, bg: c.accentWash },
    positive: { fg: c.positive, bg: c.positiveWash },
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ padding: "1.5rem" }}
    >
      <div
        aria-hidden="true"
        onClick={requestClose}
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(26, 26, 26, 0.64)" }}
      />

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="relative flex flex-col"
        style={{
          width: "100%",
          maxWidth: width,
          maxHeight: "calc(100dvh - 3rem)",
          backgroundColor: c.surface,
          border: `1px solid ${c.ruleStrong}`,
          boxShadow: "0 20px 56px rgba(26, 26, 26, 0.24)",
        }}
      >
        <div style={{ height: 2, backgroundColor: c.accent, flexShrink: 0 }} />

        <header
          className="flex items-start justify-between gap-5 shrink-0"
          style={{ padding: "1.3rem 1.6rem", borderBottom: `1px solid ${c.rule}` }}
        >
          <div className="min-w-0">
            <h2 id={labelledBy} style={{ ...t.subheading, fontSize: "1.3rem", color: c.text, margin: 0 }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ ...t.bodySmall, color: c.faint, margin: 0, marginTop: "0.4rem" }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close dialog"
            style={{
              background: "transparent",
              border: "none",
              color: c.muted,
              cursor: "pointer",
              lineHeight: 1,
              padding: "0.2rem",
              fontSize: "1.15rem",
            }}
          >
            ✕
          </button>
        </header>

        {message && (
          <div
            role={message.tone === "danger" ? "alert" : "status"}
            className="flex items-center gap-3 shrink-0"
            style={{
              padding: "0.8rem 1.6rem",
              backgroundColor: tones[message.tone].bg,
              borderBottom: `1px solid ${c.rule}`,
              ...t.bodySmall,
              color: tones[message.tone].fg,
            }}
          >
            {message.text}
          </div>
        )}

        <div
          ref={bodyRef}
          className="flex flex-col overflow-y-auto"
          style={{ padding: "1.6rem", gap: "1.4rem" }}
        >
          {children}
        </div>

        <footer
          className="flex items-center justify-between gap-5 shrink-0"
          style={{ padding: "1.1rem 1.6rem", borderTop: `1px solid ${c.rule}` }}
        >
          {confirming ? (
            <>
              <span style={{ ...t.bodySmall, color: c.danger }}>
                Discard your changes?
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  style={{
                    ...t.label,
                    textTransform: "uppercase",
                    padding: "0.7rem 1.25rem",
                    cursor: "pointer",
                    backgroundColor: "transparent",
                    color: c.muted,
                    border: `1px solid ${c.ruleStrong}`,
                    transition: `color ${motion.fast}`,
                  }}
                >
                  Keep editing
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    ...t.label,
                    textTransform: "uppercase",
                    padding: "0.7rem 1.25rem",
                    cursor: "pointer",
                    backgroundColor: "transparent",
                    color: c.danger,
                    border: `1px solid ${c.danger}`,
                  }}
                >
                  Discard
                </button>
              </div>
            </>
          ) : (
            footer
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}
