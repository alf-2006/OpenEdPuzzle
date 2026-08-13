"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * AnimatedCounter — rAF-driven count-up with power2.out easing. No GSAP:
 * for a one-shot number tween, a 12-line rAF loop is strictly lighter.
 * The suffix fades in only after the number lands. Reduced motion renders
 * the final value immediately.
 */
export function AnimatedCounter({
  value,
  suffix,
  start,
  duration = 2000,
}: {
  value: number;
  suffix?: string;
  start: boolean;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      setDone(true);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 2); // power2.out
      setDisplay(Math.round(eased * value));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, value, duration]);

  return (
    <span className="tabular-nums">
      {display.toLocaleString("en-US")}
      {suffix ? (
        <span
          aria-hidden
          className={cn(
            "text-primary transition-opacity duration-500",
            done ? "opacity-100" : "opacity-0",
          )}
        >
          {suffix}
        </span>
      ) : null}
    </span>
  );
}
