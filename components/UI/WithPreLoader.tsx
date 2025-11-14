"use client";

import { useEffect, useState } from "react";
import Animation from "./Animation";

export default function WithPreloader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showPreloader, setShowPreloader] = useState(false);
  const [isChecking, setIsChecking] = useState(true); // prevent flicker

  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro"); // <- sessionStorage

    if (!hasSeenIntro) {
      // First visit of this browser session → show preloader
      setShowPreloader(true);
    }

    setIsChecking(false);
  }, []);

  const handleComplete = () => {
    sessionStorage.setItem("hasSeenIntro", "true"); // <- sessionStorage
    setShowPreloader(false);
  };

  if (isChecking) return null; // avoid layout flash on first render

  return (
    <div className="relative">
      {showPreloader && (
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
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
