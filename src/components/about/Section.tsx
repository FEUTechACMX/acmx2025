"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Rule, Label, Heading, useDS } from "@/components/ds";
import { layout } from "@/styles/design-system";

/**
 * Numbered editorial section: index + label in the left rail, prose on the
 * right, hairline above. Reveals once on scroll-in.
 */
export default function Section({
  index,
  label,
  heading,
  children,
}: {
  /** Two-digit ordinal, e.g. "01". */
  index: string;
  label: string;
  heading: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const { c } = useDS();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = el.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    gsap.set(targets, { opacity: 0, y: 24 });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          gsap.to(targets, {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            duration: 0.7,
            ease: "power2.out",
          });
          observer.disconnect();
        });
      },
      { threshold: 0.25 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} style={{ paddingTop: `calc(${layout.gap} * 2)` }}>
      <Rule />
      <div
        className="grid grid-cols-1 md:grid-cols-[minmax(8rem,18%)_1fr]"
        style={{ paddingTop: layout.gap, gap: layout.gap }}
      >
        <div data-reveal className="flex md:flex-col items-baseline md:items-start gap-3">
          <Label color={c.accent}>{index}</Label>
          <Label>{label}</Label>
        </div>

        <div className="flex flex-col" style={{ gap: layout.gapTight }}>
          <div data-reveal>
            <Heading>{heading}</Heading>
          </div>
          {React.Children.map(children, (child) => (
            <div data-reveal>{child}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
