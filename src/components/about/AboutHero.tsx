"use client";
import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Animation from "@/components/UI/Animation";

interface AboutHeroProps {
  onComplete: () => void;
}

export default function AboutHero({ onComplete }: AboutHeroProps) {
  const mainContent = useRef<HTMLDivElement>(null);

  // Typing refs
  const asteriaRef = useRef<HTMLSpanElement>(null);
  const headingLine1Ref = useRef<HTMLSpanElement>(null);
  const headingLine2Ref = useRef<HTMLSpanElement>(null);
  const codeRiseRef = useRef<HTMLSpanElement>(null);
  const borderRef = useRef<HTMLDivElement>(null);

  // Typing + blink completion
  const [typingCompleted, setTypingCompleted] = useState(false);

  // Typing function (~3s per text)
  const typeText = (el: HTMLElement | null, text: string) => {
    if (!el) return gsap.timeline();
    el.innerText = "";
    const tl = gsap.timeline();
    const charDuration = 3 / text.length;
    let currentText = "";
    for (let i = 0; i < text.length; i++) {
      setTimeout(() => {
        if (el) {
          currentText += text[i];
          el.innerText = currentText;
        }
      }, i * charDuration * 1000);
    }
    tl.to({}, { duration: 3 });
    return tl;
  };

  // Blink/glitch — text, border, AND animation components all blink together
  const blinkContent = (): gsap.core.Timeline => {
    const tl = gsap.timeline();
    if (!mainContent.current || !borderRef.current) return tl;

    // Grab text + border + animation wrappers — everything on screen
    const container = mainContent.current.closest(".fixed");
    const animEls = container
      ? [...container.querySelectorAll(".anim-element")]
      : [];
    const allEls = [
      ...mainContent.current.querySelectorAll("span"),
      borderRef.current,
      ...animEls,
    ];

    // Single unified blink — 3×0.05s
    const glitchDuration = 0.05;
    for (let i = 0; i < 3; i++) {
      tl.to(allEls, { opacity: 0, duration: glitchDuration }, ">0");
      tl.to(allEls, { opacity: 1, duration: glitchDuration }, ">0");
    }
    return tl;
  };

  // Main timeline — everything completes in 3s to match Animation component
  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("aboutHeroPreloaderShown");
    if (alreadyShown) {
      onComplete();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem("aboutHeroPreloaderShown", "true");
        onComplete();
      },
    });

    // All text types simultaneously (~3s) — matches Animation's 3s spin
    tl.add(typeText(asteriaRef.current, "ASTERIA"), 0);
    tl.add(typeText(codeRiseRef.current, "CODE RISE"), 0);
    tl.add(typeText(headingLine1Ref.current, "WHERE CODES"), 0);
    tl.add(typeText(headingLine2Ref.current, "MEET THE COSMOS"), 0);

    // Pause 2s — let everything sit, matching Animation's 2s pause
    tl.to({}, { duration: 2 });

    // Synced blink — same timing as Animation's blink (3×0.05s)
    tl.call(() => setTypingCompleted(true));
    tl.add(blinkContent());
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-[999]">
      {/* Desktop */}
      <div className="anim-element absolute z-10 right-[-250px] h-[892px] w-[892px] overflow-visible hidden lg:block xl:block">
        <Animation size={892} />
      </div>
      <div className="anim-element absolute z-10 top-[-270px] left-[-270px] h-[542px] w-[542px] overflow-visible hidden lg:block xl:block">
        <Animation size={542} />
      </div>

      {/* Tablet */}
      <div className="anim-element absolute z-10 bottom-[-272px] right-[-272px] h-[542px] w-[542px] overflow-visible hidden md:block lg:hidden xl:hidden">
        <Animation size={542} />
      </div>
      <div className="anim-element absolute z-10 top-[-272px] left-[-272px] h-[542px] w-[542px] overflow-visible hidden md:block lg:hidden xl:hidden">
        <Animation size={542} />
      </div>

      {/* Mobile */}
      <div className="anim-element absolute z-10 right-[-272px] bottom-[-272px] h-[542px] w-[542px] overflow-visible sm:block md:hidden lg:hidden xl:hidden">
        <Animation size={542} />
      </div>
      <div className="anim-element absolute z-10 top-[-272px] left-[-272px] h-[542px] w-[542px] overflow-visible sm:block md:hidden lg:hidden xl:hidden">
        <Animation size={542} />
      </div>

      {/* Typing content */}
      <div
        ref={mainContent}
        className="relative xl:h-[400px] lg:h-[400px] md:h-[250px] sm:h-[150px] w-full max-w-[890px] z-10 flex flex-col justify-between px-4"
      >
        <h2 className="font-['arian-bold'] text-[16px] sm:text-[16px] md:text-[32px] lg:text-[40px] xl:text-[40px] text-[#DEB7F3] w-full text-left overflow-hidden">
          <span ref={asteriaRef}></span>
        </h2>

        <div className="relative w-full h-full flex justify-center overflow-visible">
          <div className="text-center">
            <span
              ref={headingLine1Ref}
              className="block text-[36px] sm:text-[36px] md:text-[64px] lg:text-[96px] xl:text-[96px] font-['Supermolot'] text-[#8B7FBB] overflow-visible"
            ></span>
            <span
              ref={headingLine2Ref}
              className="block text-[36px] sm:text-[36px] md:text-[64px] lg:text-[96px] xl:text-[96px] font-['Supermolot'] text-[#8B7FBB] overflow-visible"
            ></span>
          </div>

          <div
            ref={borderRef}
            className="absolute h-full w-full border-2 border-[#E7AEFF] max-w-[825px] lg:max-w-[825px] md:max-w-[540px] sm:max-w-[280px]"
          ></div>
        </div>

        <h2 className="font-['arian-bold'] text-[16px] sm:text-[16px] md:text-[32px] lg:text-[40px] xl:text-[40px] text-[#DEB7F3] w-full text-right overflow-hidden">
          <span ref={codeRiseRef}></span>
        </h2>
      </div>
    </div>
  );
}
