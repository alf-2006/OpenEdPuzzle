"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    number: "01",
    title: "Create a class",
    description:
      "Spin up a class in seconds and share the join code. Students enroll themselves — no roster imports, no CSV wrangling.",
  },
  {
    number: "02",
    title: "Assign a video",
    description:
      "Paste a YouTube link or a Drive file, set a due date, and drop checkpoints at the moments that matter.",
  },
  {
    number: "03",
    title: "Students watch — verifiably",
    description:
      "Heartbeat-verified playback proves attention. Skips, background tabs, and speed-running are caught by the server, not the honor system.",
  },
  {
    number: "04",
    title: "Review the evidence",
    description:
      "Per-student progress, engagement heatmaps, and a tamper-evident audit trail — everything you need to grade with confidence.",
  },
] as const;

/**
 * HowItWorks — pinned horizontal scroll on desktop (300vh of scroll drives
 * four full-width steps), vertical stack with a simple fade on mobile, and
 * fully static for reduced motion. gsap.matchMedia scopes the pin to
 * desktop + motion-allowed and reverts it cleanly on resize/unmount, so the
 * pin can never leak or strand scroll position.
 *
 * Active-step styling is toggled via data attributes (not React state) in
 * onUpdate — no re-renders during scroll.
 */
export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { gsap } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        if (cancelled || !sectionRef.current || !trackRef.current) return;
        gsap.registerPlugin(ScrollTrigger);

        const section = sectionRef.current;
        const track = trackRef.current;
        const cards = Array.from(
          track.querySelectorAll<HTMLElement>("[data-step-card]"),
        );

        const mm = gsap.matchMedia();

        // Desktop: pinned horizontal scroll
        mm.add(
          "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
          () => {
            let active = -1;
            const setActive = (idx: number) => {
              if (idx === active) return;
              active = idx;
              cards.forEach((c, i) => {
                c.dataset.active = String(i === idx);
              });
            };
            setActive(0);

            const scrollTween = gsap.to(track, {
              x: () => -(track.scrollWidth - window.innerWidth),
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "+=300%",
                pin: true,
                scrub: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) =>
                  setActive(Math.min(3, Math.floor(self.progress * 4))),
              },
            });

            const progressTween = gsap.fromTo(
              progressRef.current,
              { scaleX: 0 },
              {
                scaleX: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top top",
                  end: "+=300%",
                  scrub: 1,
                },
              },
            );

            return () => {
              scrollTween.scrollTrigger?.kill();
              progressTween.scrollTrigger?.kill();
              cards.forEach((c) => delete c.dataset.active);
            };
          },
        );

        // Mobile: vertical stack, single gentle fade-up
        mm.add(
          "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
          () => {
            const tween = gsap.from(cards, {
              y: 40,
              opacity: 0,
              stagger: 0.1,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: section, start: "top 75%", once: true },
            });
            return () => {
              tween.scrollTrigger?.kill();
              tween.kill();
            };
          },
        );

        cleanup = () => mm.revert();
      } catch {
        // GSAP unavailable — static stack, fully readable.
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden">
      <div className="flex min-h-svh flex-col justify-center py-24 md:h-svh md:py-0">
        {/* Progress bar — desktop scroll progress */}
        <div className="absolute inset-x-0 top-0 h-1 bg-muted">
          <div
            ref={progressRef}
            className="h-full w-full origin-left scale-x-0 bg-primary md:scale-x-0"
          />
        </div>

        <div className="container mb-10 text-center md:mb-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Four steps to verified learning
          </h2>
        </div>

        <div
          ref={trackRef}
          className="flex flex-col will-change-transform md:flex-row"
        >
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="flex items-center justify-center px-6 py-8 md:w-screen md:shrink-0 md:py-0"
            >
              <div
                data-step-card
                className={cn(
                  "max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg md:p-10",
                  "transition-all duration-300",
                  "md:data-[active=true]:scale-105 md:data-[active=true]:border-primary/50 md:data-[active=true]:shadow-primary/10",
                  "md:data-[active=false]:scale-95 md:data-[active=false]:opacity-50",
                )}
              >
                <span className="mb-4 block text-6xl font-extrabold tracking-tight text-primary/25">
                  {step.number}
                </span>
                <h3 className="mb-3 text-2xl font-bold">{step.title}</h3>
                <p className="text-pretty text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
