"use client";
import React, { useState, useEffect, useRef } from "react";
import AboutHero from "@/components/about/AboutHero";
import StudentChapter from "@/components/about/StudentChapter";
import Mission from "@/components/about/Mission";
import Vision from "@/components/about/Vision";
import ContactFooter from "@/components/about/ContactFooter";

export default function AboutPage() {
  const [preloaderDone, setPreloaderDone] = useState(false);

  // Refs for scroll snap
  const sectionsRef = useRef<HTMLDivElement[]>([]);

  const scrollToSection = (index: number) => {
    if (!sectionsRef.current[index]) return;
    sectionsRef.current[index].scrollIntoView({ behavior: "smooth" });
  };

  // Handle desktop wheel + mobile swipe
  useEffect(() => {
    if (!preloaderDone) return;

    let isScrolling = false;
    let touchStartY: number | null = null;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isScrolling) return;

      const currentIndex = sectionsRef.current.findIndex((section) => {
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        return rect.top >= -10 && rect.top <= 10; // Increased tolerance for smoother scrolling
      });

      let nextIndex = currentIndex;
      if (e.deltaY > 0 && currentIndex < sectionsRef.current.length - 1)
        nextIndex = currentIndex + 1;
      else if (e.deltaY < 0 && currentIndex > 0) nextIndex = currentIndex - 1;

      if (nextIndex !== currentIndex) {
        isScrolling = true;
        scrollToSection(nextIndex);
        setTimeout(() => (isScrolling = false), 600);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY === null || isScrolling) return;
      const deltaY = touchStartY - e.touches[0].clientY;
      if (Math.abs(deltaY) < 15) return; // Further reduced threshold for easier scrolling

      // Get the container and calculate scroll progress
      const container = document.querySelector(
        ".w-full.h-screen.overflow-y-auto"
      );
      if (!container) return;

      // Use scroll position more effectively
      const scrollPercentage =
        container.scrollTop / (container.scrollHeight - container.clientHeight);
      const sectionHeight = container.scrollHeight / sectionsRef.current.length;
      const currentIndex = Math.floor(container.scrollTop / sectionHeight);

      // Only move to next section if clearly moving in that direction
      if (deltaY > 30 && currentIndex < sectionsRef.current.length - 1) {
        // Reduced from 40 to 30
        isScrolling = true;
        scrollToSection(currentIndex + 1);
        setTimeout(() => (isScrolling = false), 600);
      } else if (deltaY < -30 && currentIndex > 0) {
        // Reduced from -40 to -30
        isScrolling = true;
        scrollToSection(currentIndex - 1);
        setTimeout(() => (isScrolling = false), 600);
      }

      touchStartY = null;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [preloaderDone]);

  return (
    <>
      {!preloaderDone && (
        <AboutHero onComplete={() => setPreloaderDone(true)} />
      )}

      {preloaderDone && (
        <div className="w-full h-screen overflow-y-auto snap-both snap-mandatory">
          {[StudentChapter, Mission, Vision].map((Component, i) => (
            <div
              key={i}
              ref={(el) => {
                if (el) {
                  sectionsRef.current[i] = el;
                }
              }}
              className="h-screen flex items-center justify-center snap-start snap-always"
            >
              <Component />
            </div>
          ))}
          <ContactFooter />
        </div>
      )}
    </>
  );
}
