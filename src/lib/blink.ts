import { gsap } from "gsap";

type BlinkTargets =
  | Element
  | Element[]
  | NodeListOf<Element>
  | HTMLCollection
  | null
  | undefined;

/**
 * The site's shared "blink in" reveal: a quick opacity flicker (no movement),
 * staggered across the given elements. Used on load across every page so the
 * whole app reveals in the same language as the preloader / login glitch.
 * Respects prefers-reduced-motion.
 */
export function runBlinkIn(
  targets: BlinkTargets,
  { stagger = 0.09, delay = 0 }: { stagger?: number; delay?: number } = {}
) {
  if (!targets) return;
  const list = targets instanceof Element ? [targets] : Array.from(targets);
  if (list.length === 0) return;

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  gsap.killTweensOf(list);

  if (reduce) {
    gsap.set(list, { opacity: 1 });
    return;
  }

  gsap.set(list, { opacity: 0 });
  gsap.to(list, {
    keyframes: [
      { opacity: 1, duration: 0.05 },
      { opacity: 0.1, duration: 0.05 },
      { opacity: 1, duration: 0.05 },
      { opacity: 0.3, duration: 0.04 },
      { opacity: 1, duration: 0.08 },
    ],
    stagger,
    delay,
  });
}
