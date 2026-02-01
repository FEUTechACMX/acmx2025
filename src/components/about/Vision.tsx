"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function Vision() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = "visionAnimated";
    if (sessionStorage.getItem(key)) return; // Already animated

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements =
              containerRef.current?.querySelectorAll("h2, h1, p");
            if (elements) {
              gsap.from(elements, {
                opacity: 0,
                y: 20,
                stagger: 0.2,
                duration: 0.8,
                ease: "power2.out",
              });
              sessionStorage.setItem(key, "true"); // mark as animated
            }
            observer.disconnect(); // stop observing after first animation
          }
        });
      },
      { threshold: 0.5 } // trigger when ~50% of section is visible
    );

    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center px-4 sm:px-0 w-full max-w-[870px]"
    >
      <h2 className="font-['arian-bold'] text-[32px] sm:text-[40px] text-[#DEB7F3]">
        ACM
      </h2>

      <h1 className="font-['supermolot'] text-[48px] sm:text-[96px] text-[#8B7FBB] border-2 mt-2">
        VISION
      </h1>

      <p className="text-[16px] sm:text-[24px] font-['arian-light'] text-center mt-4">
        Our vision is to help students become future-ready and grow both
        academically and personally by creating platforms that develop technical
        skills, foster innovation, and enhance confidence in real-world
        applications. We aim to be the voice of the students, opening more
        opportunities both inside and outside the school, and providing an
        environment where they can learn and have fun—building ACM as a strong
        and supportive community of learners and future professionals.
      </p>
    </div>
  );
}
