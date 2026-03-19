"use client";
import React from "react";
import WithPreloader from "@/components/UI/WithPreLoader";
import { useRouter } from "next/navigation";
import ContinuosAnimation from "@/components/UI/ContinousAnimation";
import { useTheme } from "@/components/ThemeProvider";

export default function Page() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bgColor = isDark ? "#26252a" : "#e8e3db";
  const textColor = isDark ? "#ffffff" : "#1a1a1a";
  const mutedColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(26,26,26,0.65)";
  const ruleColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(26,26,26,0.2)";

  return (
    <WithPreloader>
      <div
        className="relative min-h-[100dvh] w-full overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Concrete texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none select-none"
          style={{
            backgroundImage: "url(/assets/concrete-wall-texture.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: isDark ? "multiply" : "overlay",
            opacity: isDark ? 0.55 : 0.32,
          }}
        />

        {/* Corner animations */}
        <div
          className="absolute right-0 bottom-0 z-10 pointer-events-none"
          style={{ width: "clamp(200px,28vw,380px)", aspectRatio: "1", transform: "translate(35%, 35%) rotate(90deg)" }}
        >
          <ContinuosAnimation size={380} />
        </div>
        <div
          className="absolute left-0 top-0 z-10 pointer-events-none"
          style={{ width: "clamp(200px,28vw,380px)", aspectRatio: "1", transform: "translate(-35%, -35%) rotate(-90deg)" }}
        >
          <ContinuosAnimation size={380} />
        </div>

        {/* ── Main content column ───────────────────────────────── */}
        <div
          className="relative z-10 flex flex-col min-h-[100dvh] w-full"
          style={{ padding: "38vh 7vw 10vh" }}
        >

          {/* CODE · IN · THE · COSMOS tagline */}
          <div>
            <div
              className="flex justify-between items-center"
              style={{ paddingBottom: "0.55rem" }}
            >
              {["CODE", "IN", "THE", "COSMOS"].map((w) => (
                <span
                  key={w}
                  style={{
                    fontFamily: "'Monument Extended'",
                    fontWeight: 400,
                    fontSize: "clamp(0.5rem, 0.85vw, 0.75rem)",
                    letterSpacing: "0.2em",
                    color: mutedColor,
                  }}
                >
                  {w}
                </span>
              ))}
            </div>
            <hr style={{ borderColor: ruleColor, margin: 0 }} />
          </div>

          {/* FEU / INSTITUTE OF TECHNOLOGY heading */}
          <div style={{ paddingTop: "0.5rem" }}>
            <h1
              style={{
                fontFamily: "'Monument Extended'",
                fontWeight: 500,
                fontSize: "clamp(2.25rem, 6vw, 7.25rem)",
                lineHeight: 1.0,
                color: textColor,
                margin: 0,
                width: "100%",
              }}
            >
              FEU
              <br />
              INSTITUTE OF TECHNOLOGY
            </h1>
          </div>
          <hr style={{ borderColor: ruleColor, margin: "0.5rem 0 0" }} />

          {/* Description */}
          <p
            style={{
              fontFamily: "'Helvetica Now MT Text', 'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontWeight: 400,
              fontSize: "clamp(0.8125rem, 1.1vw, 1.0625rem)",
              lineHeight: 1.65,
              color: mutedColor,
              maxWidth: "clamp(18rem, 65vw, 75rem)",
              margin: "clamp(1.25rem, 3.5vh, 2.5rem) 0 0",
            }}
          >
            Project ACMX is an innovative website built by students under FEU
            Tech ACM, serving as the main platform for ACM updates, information,
            and collaboration.
          </p>

          {/* ACMX label + LEARN MORE */}
          <div
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between"
            style={{
              marginTop: "clamp(1.5rem, 3.5vh, 2.5rem)",
              gap: "1rem",
            }}
          >
            <h2
              style={{
                fontFamily: "'Monument Extended'",
                fontWeight: 400,
                fontSize: "clamp(1.625rem, 3vw, 2.5rem)",
                color: textColor,
                margin: 0,
                lineHeight: 1,
              }}
            >
              ACMX
            </h2>

            <button
              onClick={() => router.push("/about")}
              className="w-full sm:w-auto"
              style={{
                fontFamily: "'Monument Extended'",
                fontWeight: 400,
                fontSize: "clamp(0.5625rem, 0.75vw, 0.6875rem)",
                letterSpacing: "0.18em",
                backgroundColor: "#CF78EC",
                color: "#ffffff",
                border: "none",
                padding: "0.8rem 2.25rem",
                cursor: "pointer",
                transition: "background-color 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#b85cd6")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#CF78EC")
              }
            >
              LEARN MORE
            </button>
          </div>
        </div>
      </div>
    </WithPreloader>
  );
}
