"use client";

import { useEffect } from "react";

/**
 * SmoothScroll — Lenis smooth scrolling for the landing page, driven by the
 * GSAP ticker so Lenis and ScrollTrigger share one clock (no double-rAF
 * drift). Both libraries are dynamically imported here and nowhere else is
 * Lenis referenced, so it never touches the /app bundle.
 *
 * Skipped entirely for reduced motion: native scroll stays native.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lenis: { destroy: () => void; raf: (t: number) => void } | null = null;
    let tickerFn: ((time: number) => void) | null = null;
    let gsapRef: typeof import("gsap").gsap | null = null;
    let cancelled = false;

    (async () => {
      try {
        const [{ default: Lenis }, { gsap }, { ScrollTrigger }] =
          await Promise.all([
            import("lenis"),
            import("gsap"),
            import("gsap/ScrollTrigger"),
          ]);
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        gsapRef = gsap;

        const instance = new Lenis({ lerp: 0.1 });
        lenis = instance;

        instance.on("scroll", ScrollTrigger.update);
        tickerFn = (time: number) => instance.raf(time * 1000);
        gsap.ticker.add(tickerFn);
        gsap.ticker.lagSmoothing(0);

        // Section triggers may have registered before Lenis attached.
        ScrollTrigger.refresh();
      } catch {
        // Lenis/GSAP unavailable — native scroll, everything still works.
      }
    })();

    return () => {
      cancelled = true;
      if (tickerFn && gsapRef) gsapRef.ticker.remove(tickerFn);
      lenis?.destroy();
    };
  }, []);

  return null;
}
