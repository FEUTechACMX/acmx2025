"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import type { safeUser } from "@/types/auth";
import { Button, Field, Label, Eyebrow, Heading, Body, useDS } from "@/components/ds";
import { layout, texture, motion, type as t } from "@/styles/design-system";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [membershipOpen, setMembershipOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { c, isDark } = useDS();
  const tex = isDark ? texture.dark : texture.light;

  // Glitch-in on open — same cadence as the site preloader.
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const modal = modalRef.current;
    const glitchElements = modal.querySelectorAll(".glitch-target");

    gsap.set(modal, { opacity: 0, y: -16 });
    gsap.set(glitchElements, { opacity: 0 });

    gsap
      .timeline()
      .to(modal, { opacity: 1, duration: 0.05 })
      .to(modal, { opacity: 0, duration: 0.03 })
      .to(modal, { opacity: 1, duration: 0.05 })
      .to(modal, { opacity: 0, duration: 0.02 })
      .to(modal, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" })
      .to(glitchElements, { opacity: 1, duration: 0.15, stagger: 0.03 }, "-=0.1");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    void (async () => {
      const res = await fetch("/api/campaign/windows");
      const json = await res.json().catch(() => ({}));
      if (json?.membership?.open === true) setMembershipOpen(true);
      else setMembershipOpen(false);
    })();
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, password }),
      });

      const data: { success: boolean; user?: safeUser; message?: string } = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      onLoginSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
    >
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.65)" }} />

      <div
        ref={modalRef}
        className="relative w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: c.surface, border: `1px solid ${c.ruleStrong}` }}
      >
        {/* Concrete grain, matching the page substrate */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${texture.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: tex.mixBlendMode,
            opacity: tex.opacity,
          }}
        />

        {/* Accent rule */}
        <div style={{ height: 2, backgroundColor: c.accent }} />

        <div className="relative" style={{ padding: "clamp(1.5rem, 4vw, 2.25rem)" }}>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute cursor-pointer"
            style={{
              top: "clamp(1.5rem, 4vw, 2.25rem)",
              right: "clamp(1.5rem, 4vw, 2.25rem)",
              background: "none",
              border: "none",
              color: c.faint,
              fontSize: "1.1rem",
              lineHeight: 1,
              transition: `color ${motion.fast}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = c.accent)}
            onMouseLeave={(e) => (e.currentTarget.style.color = c.faint)}
          >
            ✕
          </button>

          <div className="glitch-target">
            <Eyebrow words={["MEMBERS", "ONLY"]} />
            <div style={{ paddingTop: "0.75rem" }}>
              <Heading>SIGN IN</Heading>
            </div>
            <div style={{ marginTop: "0.6rem" }}>
              <Body small measure={false}>
                Use your student number and ACM password.
              </Body>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="glitch-target flex flex-col"
            style={{ gap: layout.gap, marginTop: layout.gap }}
          >
            <Field
              id="modal-studentId"
              label="Student Number"
              placeholder="e.g. 202512345"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              autoComplete="username"
            />

            <Field
              id="modal-password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 0 0 0.5rem",
                  }}
                >
                  <Label style={{ color: c.faint }}>{showPassword ? "Hide" : "Show"}</Label>
                </button>
              }
            />

            <div className="flex flex-col" style={{ gap: "0.45rem" }}>
              <Link
                href="/account/claim-account"
                onClick={onClose}
                style={{ ...t.bodySmall, color: c.accent, textDecoration: "none" }}
              >
                First time signing in? Claim your account
              </Link>
              <Link
                href="/account/reset-password"
                onClick={onClose}
                style={{ ...t.bodySmall, color: c.accent, textDecoration: "none" }}
              >
                Forgot password?
              </Link>
              {membershipOpen && (
                <Link
                  href="/apply/membership"
                  onClick={onClose}
                  style={{ ...t.bodySmall, color: c.muted, textDecoration: "none" }}
                >
                  Not a member yet? Become a member
                </Link>
              )}
            </div>

            {error && (
              <div style={{ borderLeft: `2px solid ${c.accent}`, paddingLeft: "0.75rem" }}>
                <Label style={{ color: c.accent }}>{error}</Label>
              </div>
            )}

            <Button type="submit" disabled={loading} block>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
