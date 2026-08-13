"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatedCounter } from "@/components/landing/animated-counter";

const STATS = [
  { value: 12400, suffix: "+", label: "Students" },
  { value: 86, suffix: "K+", label: "Videos watched" },
  { value: 9200, suffix: "+", label: "Teacher hours saved" },
  { value: 3100, suffix: "+", label: "Tamper attempts blocked" },
] as const;

/**
 * Stats — count-up on viewport entry. Uses IntersectionObserver (one-shot,
 * threshold 0.3) instead of ScrollTrigger: for a simple reveal, IO is
 * native, lighter, and needs no library. Unobserves after firing.
 */
export function Stats() {
  const rootRef = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="relative border-y border-border/60 bg-muted/30 py-20">
      <div className="container">
        <dl className="grid grid-cols-2 gap-10 text-center lg:grid-cols-4">
          {STATS.map(({ value, suffix, label }) => (
            <div key={label}>
              <dd className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                <AnimatedCounter value={value} suffix={suffix} start={started} />
              </dd>
              <dt className="mt-2 text-sm font-medium text-muted-foreground">
                {label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
