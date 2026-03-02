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
    const tl = gsap.timeline();

    const layers = [
      base.current,
      layer1.current,
      layer2.current,
      layer3.current,
      layer4.current,
      layer5.current,
    ];

    gsap.set(layers, { opacity: 0 });

    tl.to(layers, {
      opacity: 1,
      duration: 0.2,
      stagger: 0.1,
    });

    // Calculate rotations for layer 5 to do exactly 1 rotation in 3 seconds
    // Then scale all other rotations proportionally to complete in 3 seconds
    const layer5Rotations = 1; // Layer 5 does exactly 1 rotation
    const targetDuration = 3; // All layers complete in 3 seconds

    const baseRotations = [3, -2, -1.5, -1.2, 1]; // Original rotation multipliers
    const rotations = baseRotations.map((v) => v * layer5Rotations * 360);
    const spinLayers = [
      layer1.current,
      layer2.current,
      layer3.current,
      layer4.current,
      layer5.current,
    ];

    tl.to(
      spinLayers,
      {
        rotation: (i) => rotations[i],
        duration: targetDuration, // Set all rotations to complete in 3 seconds
        ease: "linear",
      },
      ">0"
    );
    // Pause for 2s after spin completes
    tl.to({}, { duration: 2 });

    // Glitch blink — 3×0.05s synced across all Animation instances
    const glitchDuration = 0.05;
    for (let i = 0; i < 3; i++) {
      tl.to(layers, { opacity: 0, duration: glitchDuration }, ">0");
      tl.to(layers, { opacity: 1, duration: glitchDuration }, ">0");
    }

    if (onComplete) {
      tl.eventCallback("onComplete", onComplete);
    }
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