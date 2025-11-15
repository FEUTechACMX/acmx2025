"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function StudentChapter() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = "studentChapterAnimated";
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
      className="w-full flex flex-col items-center justify-center text-center px-4"
    >
      {/* Subhead */}
      <h2 className="font-[arian-bold] text-[24px] md:text-[40px] text-[#DEB7F3]">
        WHAT IS
      </h2>

      {/* Heading */}
      <h1 className="font-[supermolot] text-[24px] md:text-[64px] text-[#8B7FBB] mt-2 border-2">
        ACM STUDENT CHAPTER
      </h1>

      {/* Details */}
      <p className="font-[arian-light] text-[15px] md:text-[24px] mt-4 max-w-[900px]">
        Driven by innovation and united by passion, the FEU Tech ACM Student
        Chapter is a recognized student organization that stands as the{" "}
        <span className="font-[arian-bold] text-[#8B7FBB]">
          mother organization of the Computer Science department of the
          institution
        </span>{" "}
        and the Philippines' second internationally accredited ACM student
        chapter, empowering students to explore their passion for technology,
        spark innovation, and shape the future—one line of code at a time. Our
        core values are:{" "}
        <span className="font-[arian-bold] text-[#8B7FBB]">
          Aptitude, Competence, and Magnanimity
        </span>
        .
      </p>
    </div>
  );
}
