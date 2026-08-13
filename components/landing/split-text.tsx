"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * SplitText — word-level reveal. Splits `text` into overflow-hidden word
 * wrappers at render time, then (desktop, motion-allowed) slides each word
 * up with GSAP. GSAP is dynamically imported so it never enters the shared
 * bundle. On mobile or with prefers-reduced-motion the text simply fades in
 * (or renders static, respectively).
 *
 * Initial hidden state is applied via `motion-safe:opacity-0` so reduced-
 * motion users always see the text; if the GSAP import fails we force the
 * words visible again in the catch path.
 */
export function SplitText({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { gsap } = await import("gsap");
        if (cancelled || !ref.current) return;
        const words = ref.current.querySelectorAll("[data-word-inner]");
        const isDesktop = window.matchMedia("(min-width: 768px)").matches;
        ctx = gsap.context(() => {
          gsap.fromTo(
            words,
            isDesktop ? { y: 100, opacity: 0 } : { y: 0, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.05,
              duration: isDesktop ? 0.8 : 0.5,
              ease: "power3.out",
              delay,
            },
          );
        }, ref.current);
      } catch {
        // GSAP unavailable — never leave the headline invisible.
        el.querySelectorAll("[data-word-inner]").forEach((w) =>
          w.classList.remove("motion-safe:opacity-0"),
        );
      }
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [delay]);

  const words = text.split(" ");

  return (
    <h1 ref={ref} aria-label={text} className={cn("text-balance", className)}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          aria-hidden
          className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom"
        >
          <span
            data-word-inner
            className="inline-block will-change-transform motion-safe:opacity-0"
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </h1>
  );
}
