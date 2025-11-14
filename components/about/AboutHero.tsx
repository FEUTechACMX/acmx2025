"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Animation from "../UI/Animation";

export default function AboutHero() {
  const mainContent = useRef<HTMLDivElement>(null);

  // Typing refs
  const asteriaRef = useRef<HTMLSpanElement>(null);
  const headingLine1Ref = useRef<HTMLSpanElement>(null);
  const headingLine2Ref = useRef<HTMLSpanElement>(null);
  const codeRiseRef = useRef<HTMLSpanElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);

  // Track typing completion
  const [typingCompleted, setTypingCompleted] = useState(false);

  // Typing function for individual spans - making each text take ~3 seconds using setTimeout for accurate timing
  const typeText = (el: HTMLElement | null, text: string) => {
    if (!el) return gsap.timeline();

    el.innerText = "";

    // Create a GSAP timeline that will finish after 3 seconds
    const tl = gsap.timeline();

    // Calculate duration per character to have the whole text take ~3 seconds
    const charDuration = 3 / text.length;

    // Use a sequential approach with setTimeout to ensure proper timing
    let currentText = "";
    for (let i = 0; i < text.length; i++) {
      setTimeout(() => {
        if (el) {
          currentText += text[i];
          el.innerText = currentText;
        }
      }, i * charDuration * 1000);
    }

    // Return a timeline that completes after 3 seconds so the main timeline can sequence properly
    tl.to({}, { duration: 3 }); // Dummy animation that takes 3 seconds

    return tl;
  };

  // Blink function synced with Animation.tsx glitch timing
  const blinkContent = () => {
    if (!mainContent.current || !borderRef.current) return;

    const elements = [
      ...mainContent.current.querySelectorAll("span"),
      borderRef.current,
    ];

    const tl = gsap.timeline();
    const glitchDuration = 0.05; // same as Animation.tsx
    for (let i = 0; i < 3; i++) {
      tl.to(elements, { opacity: 0, duration: glitchDuration }, ">0");
      tl.to(elements, { opacity: 1, duration: glitchDuration }, ">0");
    }
  };

  // Main typing timeline
  useEffect(() => {
    if (typingCompleted) return; // Prevent re-typing

    const tl = gsap.timeline();

    // Type elements in sequence: ASTERIA and CODE RISE start first, then WHERE CODES, then MEET THE COSMOS after WHERE CODES finishes
    tl.add(typeText(asteriaRef.current, "ASTERIA"), 0);
    tl.add(typeText(codeRiseRef.current, "CODE RISE"), 0);
    tl.add(typeText(headingLine1Ref.current, "WHERE CODES"), 0);
    tl.add(typeText(headingLine2Ref.current, "MEET THE COSMOS"), ">0"); // Start after WHERE CODES finishes

    // After typing finishes, trigger blink
    tl.call(() => {
      setTypingCompleted(true); // Mark that typing is done
      blinkContent(); // Trigger the blink immediately after typing
    }); // This call happens after the timeline completes
  }, [typingCompleted]);

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Animation Components - Responsive */}
      {/* Desktop: Element2 - 892x892, Element1 - 542x542 */}
      <div className="absolute z-10 right-[-250px] h-[892px] w-[892px] overflow-visible hidden lg:block xl:block">
        <Animation size={892} />
      </div>
      <div className="absolute z-10 top-[-270px] left-[-270px] h-[542px] w-[542px] overflow-visible hidden lg:block xl:block">
        <Animation size={542} />
      </div>

      {/* Tablet: Element1 and Element2 both 543x542 */}
      <div className="absolute z-10 bottom-[-272px] right-[-272px] h-[542px] w-[542px] overflow-visible hidden md:block lg:hidden xl:hidden">
        <Animation size={542} />
      </div>
      <div className="absolute z-10 top-[-272px] left-[-272px] h-[542px] w-[542px] overflow-visible hidden md:block lg:hidden xl:hidden">
        <Animation size={542} />
      </div>

      {/* Mobile: Both animations 542x542 */}
      <div className="absolute z-10 right-[-272px] bottom-[-272px] h-[542px] w-[542px] overflow-visible sm:block md:hidden lg:hidden xl:hidden">
        <Animation size={542} />
      </div>
      <div className="absolute z-10 top-[-272px] left-[-272px] h-[542px] w-[542px] overflow-visible sm:block md:hidden lg:hidden xl:hidden">
        <Animation size={542} />
      </div>

      {/* Main content - Fully Responsive */}
      <div
        ref={mainContent}
        className="mainContent relative xl:h-[334px] lg:h-[334px] md:h-[250px] sm:h-[150px] w-full max-w-[890px] z-10 flex flex-col justify-between px-4"
      >
        {/* ASTERIA - Fully Responsive */}
        <h2 className="font-['arian-bold'] text-[16px] sm:text-[16px] md:text-[32px] lg:text-[40px] xl:text-[40px] text-[#DEB7F3] w-full text-left relative z-10 overflow-hidden">
          <span ref={asteriaRef}></span>
        </h2>

        {/* Main Heading - Fully Responsive */}
        <div className="relative w-full flex justify-center overflow-hidden">
          <div className="text-center">
            <span
              ref={headingLine1Ref}
              className="block text-[36px] sm:text-[36px] md:text-[64px] lg:text-[96px] xl:text-[96px] font-['Supermolot'] leading-[1] text-[#8B7FBB] overflow-hidden"
            ></span>
            <span
              ref={headingLine2Ref}
              className="block text-[36px] sm:text-[36px] md:text-[64px] lg:text-[96px] xl:text-[96px] font-['Supermolot'] leading-[1] text-[#8B7FBB] overflow-hidden"
            ></span>
          </div>

          {/* Border - Responsive */}
          <div
            ref={borderRef}
            className="absolute h-full w-full border-2 border-[#E7AEFF] overflow-visible z-10 max-w-[825px] lg:max-w-[825px] md:max-w-[540px] sm:max-w-[280px]"
          ></div>
        </div>

        {/* CODE RISE - Fully Responsive */}
        <h2 className="font-['arian-bold'] text-[16px] sm:text-[16px] md:text-[32px] lg:text-[40px] xl:text-[40px] text-[#DEB7F3] w-full text-right relative z-10 overflow-hidden">
          <span ref={codeRiseRef}></span>
        </h2>
      </div>
    </div>
  );
}
