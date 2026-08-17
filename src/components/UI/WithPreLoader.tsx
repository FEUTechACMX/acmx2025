"use client";

import { useState, useRef, useSyncExternalStore } from "react";
import Animation from "./Animation";
import { gsap } from "gsap";

/**
 * Whether the intro has already played this browser session.
 *
 * This is a read of sessionStorage — an external store — so it reads as one.
 * As an effect it required two extra states (`isChecking` to suppress the
 * flicker, `showPreloader` to hold the answer) and two renders to settle; the
 * server snapshot is simply "already seen", which is the no-overlay branch.
 */
const NEVER_CHANGES = () => () => {};
function useHasSeenIntro() {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => {
      try {
        return sessionStorage.getItem("hasSeenIntro") !== null;
      } catch {
        // Storage disabled — treat as seen rather than replaying every render.
        return true;
      }
    },
    () => true
  );
}

export default function WithPreloader({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasSeenIntro = useHasSeenIntro();
  // Only ever set once the intro has finished playing — the initial answer
  // comes from sessionStorage, not from state.
  const [dismissed, setDismissed] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const showPreloader = !hasSeenIntro && !dismissed;
  const setShowPreloader = (next: boolean) => setDismissed(!next);

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

  return (
    <div className="relative">
      {showPreloader && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
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
