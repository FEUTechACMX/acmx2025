"use client";

import { useEffect, useState, useRef } from "react";
import Animation from "./Animation";
import DiamondScaleBackground from "./DiamondScaleBackground";
import { gsap } from "gsap";

export default function WithPreloader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showPreloader, setShowPreloader] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // prevent flicker
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro"); // <- sessionStorage

    if (!hasSeenIntro) {
      // First visit of this browser session → show preloader
      setShowPreloader(true);
    }

    setIsChecking(false);
  }, []);

  const handleComplete = () => {
    // Glitch blink the entire overlay before dismissing (synced with Animation's 3×0.05s)
    if (overlayRef.current) {
      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem("hasSeenIntro", "true"); // <- sessionStorage
          setShowPreloader(false);
        },
      });
      const glitchDuration = 0.05;
      for (let i = 0; i < 3; i++) {
        tl.to(overlayRef.current, { opacity: 0, duration: glitchDuration }, ">0");
        tl.to(overlayRef.current, { opacity: 1, duration: glitchDuration }, ">0");
      }
    } else {
      sessionStorage.setItem("hasSeenIntro", "true");
      setShowPreloader(false);
    }
  };

  if (isChecking) return null; // avoid layout flash on first render

  return (
    <div className="relative">
      {showPreloader && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "color-mix(in srgb, var(--background) 92%, transparent)" }}
        >
          <Animation onComplete={handleComplete} />
        </div>
      )}

      <div
        className={`${
          showPreloader ? "opacity-0" : "opacity-100"
        } transition-opacity duration-700`}
      >
        {children}
      </div>
    </div>
  );
}
