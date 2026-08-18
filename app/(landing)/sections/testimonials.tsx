"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    quote:
      "I used to spend Sunday nights guessing who actually watched the lecture. Now I open the heatmap and plan Monday around the exact minute everyone rewound.",
    name: "Mariam Haddad",
    role: "Physics Teacher, Amman Academy",
  },
  {
    quote:
      "A parent disputed a zero on a video assignment. I pulled the audit trail — every heartbeat, timestamped and hash-chained. The conversation lasted ninety seconds.",
    name: "David Okafor",
    role: "Head of STEM, Cedar International",
  },
  {
    quote:
      "The checkpoints changed everything. Students can't skim past the hard part anymore — the video literally waits until they've understood it.",
    name: "Sara Nasser",
    role: "Biology Teacher, Wasla STEM School",
  },
] as const;

const ROTATE_MS = 5000;

/**
 * Testimonials — auto-rotating carousel driven purely by CSS transitions
 * (no GSAP). All three cards stay mounted and absolutely positioned; the
 * active card is centered, the just-exited one slides left, and the rest
 * wait off to the right — so enter/exit are both real transitions. Pauses
 * on hover. Reduced motion: no auto-rotate, no transitions, dots still work.
 * Fixed min-height keeps CLS at zero.
 */
export function Testimonials() {
  // Single state object so the outgoing card is always known — including on
  // auto-rotate, where a separate setPrevIndex would read a stale index.
  const [{ index, prevIndex }, setState] = useState<{
    index: number;
    prevIndex: number | null;
  }>({ index: 0, prevIndex: null });
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () =>
        setState((s) => ({
          index: (s.index + 1) % TESTIMONIALS.length,
          prevIndex: s.index,
        })),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, [paused]);

  const goTo = (i: number) =>
    setState((s) => ({ index: i, prevIndex: s.index }));

  return (
    <section className="relative py-24 sm:py-32">
      <div className="container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Testimonials
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Teachers grade with confidence
          </h2>
        </div>

        <div
          className="relative mx-auto max-w-3xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Fixed height = zero CLS regardless of which quote is active */}
          <div className="relative min-h-[19rem] sm:min-h-[15rem]">
            {TESTIMONIALS.map((t, i) => {
              const isActive = i === index;
              const isExiting = i === prevIndex && !isActive;
              return (
                <figure
                  key={t.name}
                  aria-hidden={!isActive}
                  className={cn(
                    "absolute inset-0 rounded-2xl border border-border bg-card p-8 shadow-lg transition-all duration-500 ease-out motion-reduce:transition-none sm:p-10",
                    isActive && "z-10 translate-x-0 opacity-100",
                    isExiting && "z-0 -translate-x-8 opacity-0",
                    !isActive && !isExiting && "z-0 translate-x-8 opacity-0",
                  )}
                >
                  <Quote
                    aria-hidden
                    className="mb-4 h-7 w-7 text-primary/40"
                  />
                  <blockquote className="text-pretty text-lg leading-relaxed">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-6">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </figcaption>
                </figure>
              );
            })}
          </div>

          {/* Dots */}
          <div className="mt-8 flex justify-center gap-2">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.name}
                type="button"
                aria-label={`Show testimonial ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === index
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
