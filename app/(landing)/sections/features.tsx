"use client";

import { useEffect, useRef } from "react";
import { BarChart3, ListChecks, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Tamper-evident proof",
    description:
      "Every heartbeat is hash-chained into a cryptographic audit trail. Progress reports survive scrutiny — even grade disputes.",
  },
  {
    icon: ListChecks,
    title: "Comprehension-gated",
    description:
      "Checkpoints lock progress until the quiz is passed — enforced in the database, not the UI. Skipping is mathematically impossible.",
  },
  {
    icon: BarChart3,
    title: "Engagement heatmaps",
    description:
      "See the exact second students rewatch, pause, or drop off. Turn confusing moments into better teaching.",
  },
] as const;

/**
 * Features — three cards, staggered entrance on scroll. One ScrollTrigger
 * drives a single timeline (cards + icons), which beats ScrollTrigger.batch
 * for a fixed 3-item grid: one trigger to observe, one tween tree, and
 * `once: true` kills the trigger entirely after firing.
 */
export function Features() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { gsap } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        if (cancelled || !rootRef.current) return;
        gsap.registerPlugin(ScrollTrigger);
        const root = rootRef.current;

        ctx = gsap.context(() => {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: root, start: "top 80%", once: true },
          });
          tl.from(root.querySelectorAll("[data-feature-card]"), {
            y: 60,
            opacity: 0,
            stagger: 0.15,
            duration: 0.7,
            ease: "power2.out",
          }).from(
            root.querySelectorAll("[data-feature-icon]"),
            { scale: 0, duration: 0.5, ease: "back.out(1.7)", stagger: 0.15 },
            "-=0.55",
          );
        }, root);
      } catch {
        // GSAP unavailable — content is visible by default, nothing to do.
      }
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section id="features" ref={rootRef} className="relative py-24 sm:py-32">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Why WaslaLearn
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Trust, built into every second
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              data-feature-card
              className="card-hover group rounded-2xl border border-border bg-card p-8 hover:-translate-y-2 hover:border-primary/60 hover:shadow-[0_20px_50px_-15px_hsl(var(--primary)/0.35)]"
            >
              <div
                data-feature-icon
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/20"
              >
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{title}</h3>
              <p className="text-pretty text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
