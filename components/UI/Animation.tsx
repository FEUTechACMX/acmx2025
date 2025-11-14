"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";

export default function Animation() {
  const base = useRef<HTMLDivElement>(null);
  const layer1 = useRef<HTMLDivElement>(null);
  const layer2 = useRef<HTMLDivElement>(null);
  const layer3 = useRef<HTMLDivElement>(null);
  const layer4 = useRef<HTMLDivElement>(null);
  const layer5 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // -----------------------------
    // Entrance: blink-in one by one
    // -----------------------------
    const entranceTimeline = gsap.timeline();

    const layers = [
      base.current,
      layer1.current,
      layer2.current,
      layer3.current,
      layer4.current,
      layer5.current,
    ];

    // Start all invisible
    gsap.set(layers, { opacity: 0 });

    // Blink-in sequentially
    entranceTimeline.to(layers, {
      opacity: 1,
      duration: 0.2,
      stagger: 0.1,
    });

    // -----------------------------
    // Spinning (exactly as before)
    // -----------------------------
    const spins = 2;
    const layer5Duration = 8;

    const rotations = [
      spins * 3, // layer1 - clockwise
      -spins * 2, // layer2 - counter-clockwise
      -spins * 1.5, // layer3 - counter-clockwise
      -spins * 1.2, // layer4 - counter-clockwise
      spins, // layer5 - clockwise
    ];

    const spinningLayers = [
      layer1.current,
      layer2.current,
      layer3.current,
      layer4.current,
      layer5.current,
    ];

    entranceTimeline.to(
      spinningLayers.map((l) => l!),
      {
        rotation: (i, target) => rotations[i] * 360,
        duration: layer5Duration,
        ease: "linear",
      },
      ">0"
    ); // Start after entrance finishes

    // -----------------------------
    // End glitch blink (all together)
    // -----------------------------
    const glitchDuration = 0.05;
    const totalBlinks = 3;
    for (let i = 0; i < totalBlinks; i++) {
      entranceTimeline.to(
        layers,
        { opacity: 0, duration: glitchDuration },
        ">0"
      );
      entranceTimeline.to(
        layers,
        { opacity: 1, duration: glitchDuration },
        ">0"
      );
    }
  }, []);

  return (
    <div className="h-[840px] w-[840px] relative overflow-hidden rotate-270 select-none">
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
