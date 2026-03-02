"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/components/ThemeProvider";

/*
 * Diamond-scale background canvas.
 *
 * Desktop  → diamonds breathe & lines glow near mouse
 * Tablet   → horizontal breathing wave (769–1024 px)
 * Mobile   → vertical  breathing wave (≤ 768 px)
 */

const HALF = 18;
const SP_X = 46;
const SP_Y = 27;

const HOVER_R = 220;
const WAVE_R = 200;
const BREATHE = 0.30;
const WAVE_SPEED = 0.12;

// Rest opacities high enough to clearly see the grid at all times
const D_REST = 0.09;
const D_GLOW = 0.5;
const L_REST = 0.06;
const L_GLOW = 0.55;
// Subtle fill inside diamonds
const F_REST = 0.02;
const F_GLOW = 0.12;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export default function DiamondScaleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef<{ x: number; y: number } | null>(null);
  const raf = useRef(0);
  const { theme } = useTheme();
  const dark = theme === "dark";

  const pal = useCallback(
    () =>
      dark
        ? { base: "170,130,200", glow: "207,120,236", fill: "207,120,236" }
        : { base: "150,110,180", glow: "180,80,210", fill: "170,100,200" },
    [dark]
  );

  useEffect(() => {
    const el = canvasRef.current!;
    const ctx = el.getContext("2d")!;
    let W = 0, H = 0;
    const t0 = performance.now();

    function resize() {
      const d = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      el.width = W * d;
      el.height = H * d;
      el.style.width = `${W}px`;
      el.style.height = `${H}px`;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const mv = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    const lv = () => { mouse.current = null; };
    window.addEventListener("mousemove", mv);
    document.addEventListener("mouseleave", lv);

    function frame(now: number) {
      const dt = now - t0;
      ctx.clearRect(0, 0, W, H);
      const c = pal();

      const mob = W <= 768;
      const tab = W > 768 && W <= 1024;
      const auto = mob || tab;

      let wv = 0;
      if (mob)      { const p = H + 250; let v = (dt * WAVE_SPEED) % (p * 2); if (v > p) v = p * 2 - v; wv = v - 125; }
      else if (tab) { const p = W + 250; let v = (dt * WAVE_SPEED) % (p * 2); if (v > p) v = p * 2 - v; wv = v - 125; }

      const sinT = now * 0.003;
      const cols = Math.ceil(W / SP_X) + 4;
      const rows = Math.ceil(H / SP_Y) + 4;
      const N = cols * rows;

      const xs = new Float32Array(N);
      const ys = new Float32Array(N);
      const pr = new Float32Array(N);

      for (let r = 0; r < rows; r++) {
        const ox = r % 2 === 0 ? 0 : SP_X * 0.5;
        for (let ci = 0; ci < cols; ci++) {
          const i = r * cols + ci;
          xs[i] = (ci - 1) * SP_X + ox;
          ys[i] = (r - 1) * SP_Y;

          let p = 0;
          if (!auto && mouse.current) {
            const dx = xs[i] - mouse.current.x, dy = ys[i] - mouse.current.y;
            p = clamp01(1 - Math.sqrt(dx * dx + dy * dy) / HOVER_R);
          } else if (mob) {
            p = clamp01(1 - Math.abs(ys[i] - wv) / WAVE_R);
          } else if (tab) {
            p = clamp01(1 - Math.abs(xs[i] - wv) / WAVE_R);
          }
          pr[i] = p;
        }
      }

      // ── Lines ─────────────────────────────────────────────
      ctx.lineWidth = 0.7;
      for (let r = 0; r < rows; r++) {
        for (let ci = 0; ci < cols; ci++) {
          const i = r * cols + ci;
          // Right
          if (ci + 1 < cols) {
            const j = i + 1;
            const p = Math.max(pr[i], pr[j]);
            ctx.globalAlpha = mix(L_REST, L_GLOW, p * p);
            ctx.strokeStyle = `rgb(${p > 0.05 ? c.glow : c.base})`;
            ctx.beginPath(); ctx.moveTo(xs[i], ys[i]); ctx.lineTo(xs[j], ys[j]); ctx.stroke();
          }
          // Down
          if (r + 1 < rows) {
            const j = (r + 1) * cols + ci;
            const p = Math.max(pr[i], pr[j]);
            ctx.globalAlpha = mix(L_REST, L_GLOW, p * p);
            ctx.strokeStyle = `rgb(${p > 0.05 ? c.glow : c.base})`;
            ctx.beginPath(); ctx.moveTo(xs[i], ys[i]); ctx.lineTo(xs[j], ys[j]); ctx.stroke();
          }
        }
      }

      // ── Diamonds (filled + stroked) ───────────────────────
      for (let i = 0; i < N; i++) {
        const p = pr[i];
        const b = p * BREATHE * (0.5 + 0.5 * Math.sin(sinT + xs[i] * 0.02 + ys[i] * 0.02));
        const sz = HALF * (1 + b);
        const x = xs[i], y = ys[i];
        const rgb = p > 0.05 ? c.glow : c.base;

        // Diamond path
        ctx.beginPath();
        ctx.moveTo(x, y - sz);
        ctx.lineTo(x + sz, y);
        ctx.lineTo(x, y + sz);
        ctx.lineTo(x - sz, y);
        ctx.closePath();

        // Fill (subtle wash)
        ctx.globalAlpha = mix(F_REST, F_GLOW, p);
        ctx.fillStyle = `rgb(${c.fill})`;
        ctx.fill();

        // Stroke
        ctx.globalAlpha = mix(D_REST, D_GLOW, p);
        ctx.strokeStyle = `rgb(${rgb})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      raf.current = requestAnimationFrame(frame);
    }

    raf.current = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", mv);
      document.removeEventListener("mouseleave", lv);
    };
  }, [pal]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}
