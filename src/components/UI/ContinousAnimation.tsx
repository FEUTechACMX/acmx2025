"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";

type AnimationProps = {
  size?: number; // width = height = size in px, default 840
  onComplete?: () => void;
};

export default function Animation({ size = 840, onComplete }: AnimationProps) {
  const base = useRef<HTMLDivElement>(null);
  const layer1 = useRef<HTMLDivElement>(null);
  const layer2 = useRef<HTMLDivElement>(null);
  const layer3 = useRef<HTMLDivElement>(null);
  const layer4 = useRef<HTMLDivElement>(null);
  const layer5 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const baseLayer = base.current;
    const spinLayers = [
      layer1.current,
      layer2.current,
      layer3.current,
      layer4.current,
      layer5.current,
    ];

    const allLayers = [baseLayer, ...spinLayers];

    // Set initial visibility
    gsap.set(allLayers, { opacity: 0 });

    // ✨ Intro animation only changes opacity — NO ROTATION ANYWHERE HERE
    const intro = gsap.timeline({
      defaults: { ease: "none" },
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    intro.to(allLayers, {
      opacity: 1,
      duration: 0.2,
      stagger: 0.1,
    });

    const glitchDuration = 0.05;
    for (let i = 0; i < 3; i++) {
      intro.to(allLayers, { opacity: 0, duration: glitchDuration }, ">0");
      intro.to(allLayers, { opacity: 1, duration: glitchDuration }, ">0");
    }

    // 🌀 TRUE CONTINUOUS ROTATION USING GSAP TICKER
    const speeds = [3, -2, -1.5, -1.2, 1];
    const speedMultiplier = 0.5; // <--- Half speed
    const baseSpeed = (360 / 3) * 0.016 * speedMultiplier;

    const tickerUpdate = () => {
      spinLayers.forEach((layer, i) => {
        if (!layer) return;
        const current = gsap.getProperty(layer, "rotation") as number;
        gsap.set(layer, {
          rotation: current + baseSpeed * speeds[i],
        });
      });
    };

    gsap.ticker.add(tickerUpdate);

    // cleanup on unmount
    return () => gsap.ticker.remove(tickerUpdate);
  }, [onComplete]);

  return (
    <div
      className="relative overflow-visible rotate-270 select-none"
      style={{ width: size, height: size }}
    >
      <div
        ref={layer1}
        className="h-[40%] w-[40%] bottom-[33%] right-[29%] absolute"
      >
        <Image src="/assets/animation/Layer1.svg" alt="Layer1" fill />
      </div>
      <div
        ref={layer2}
        className="h-[48%] w-[48%] bottom-[29%] right-[25%] absolute"
      >
        <Image src="/assets/animation/Layer2.svg" alt="Layer2" fill />
      </div>
      <div
        ref={layer3}
        className="h-[68%] w-[68%] bottom-[19%] right-[15%] absolute"
      >
        <Image src="/assets/animation/Layer3.svg" alt="Layer3" fill />
      </div>
      <div
        ref={layer4}
        className="h-[75%] w-[75%] bottom-[15%] right-[12.5%] absolute"
      >
        <Image src="/assets/animation/Layer4.svg" alt="Layer4" fill />
      </div>
      <div
        ref={layer5}
        className="h-[102%] w-[95%] absolute bottom-[2%] right-[2%]"
      >
        <Image src="/assets/animation/Layer5.svg" alt="Layer5" fill />
      </div>
      <div ref={base} className="h-full w-full absolute">
        <Image src="/assets/animation/base.svg" alt="Base" fill />
      </div>
    </div>
  );
}
