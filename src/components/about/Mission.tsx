"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function Mission() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = "missionAnimated";
    if (sessionStorage.getItem(key)) return; // Already animated

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements =
              containerRef.current?.querySelectorAll("h2, h1, p, li");
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
      {/* Subheading */}
      <h2 className="font-['arian-bold'] text-[32px] sm:text-[40px] text-[#DEB7F3]">
        ACM
      </h2>

      {/* Heading */}
      <h1 className="font-['supermolot'] text-[48px] sm:text-[96px] text-[#8B7FBB] border-2 mt-2">
        MISSION
      </h1>

      {/* Description */}
      <p className="text-[16px] sm:text-[24px] font-['arian-light'] text-center mt-4">
        The chapter is organized and will be operated exclusively for
        educational and scientific purposes to promote:
      </p>

      {/* Bullet points */}
      <ul className="list-disc pl-6 sm:pl-10 text-[16px] sm:text-[24px] font-['arian-light'] mt-4 space-y-2">
        <li>
          An increased knowledge of and greater interest in science, design,
          development, construction, languages, management, and applications of
          modern computing;
        </li>
        <li>Greater interest in computing and its applications;</li>
        <li>
          A means of communication between persons having an interest in
          computing.
        </li>
      </ul>
    </div>
  );
}
