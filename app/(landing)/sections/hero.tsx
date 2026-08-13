"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, Flame, ShieldCheck } from "lucide-react";
import { GradientMesh } from "@/components/landing/gradient-mesh";
import { SplitText } from "@/components/landing/split-text";
import { ShimmerButton } from "@/components/landing/shimmer-button";
import { FloatingCard } from "@/components/landing/floating-card";

/**
 * Hero — full viewport. Gradient mesh backdrop, split-word headline,
 * shimmer CTA, and three floating product cards with mouse parallax.
 *
 * Parallax: pointermove is rAF-throttled and only writes two CSS custom
 * properties on the section element; the cards read them via calc() in
 * their `translate` property. No per-frame JS layout work, and the whole
 * thing is disabled on touch devices and for reduced motion.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Mouse parallax (desktop, motion-allowed only)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = section.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        section.style.setProperty("--par-x", x.toFixed(3));
        section.style.setProperty("--par-y", y.toFixed(3));
      });
    };
    section.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      section.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Subheadline + CTA entrance (GSAP, dynamically imported)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { gsap } = await import("gsap");
        if (cancelled || !sectionRef.current) return;
        const scope = sectionRef.current;
        ctx = gsap.context(() => {
          gsap.fromTo(
            subRef.current,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: "power2.out", delay: 0.4 },
          );
          gsap.fromTo(
            ctaRef.current,
            { scale: 0.8, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.6,
              ease: "back.out(1.7)",
              delay: 0.6,
            },
          );
        }, scope);
      } catch {
        subRef.current?.classList.remove("motion-safe:opacity-0");
        ctaRef.current?.classList.remove("motion-safe:opacity-0");
      }
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-svh items-center justify-center overflow-hidden"
    >
      <GradientMesh />

      {/* Floating product cards — desktop only */}
      <FloatingCard
        className="left-[7%] top-[22%] hidden lg:block"
        depth="-26px"
        floatDelay="0s"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Verified watch time</p>
            <p className="text-xs text-muted-foreground">
              Cryptographically auditable
            </p>
          </div>
        </div>
      </FloatingCard>

      <FloatingCard
        className="right-[8%] top-[20%] hidden lg:block"
        depth="-18px"
        floatDelay="-1.3s"
        floatDuration="4.6s"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle2 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold">Checkpoint passed</p>
            <p className="text-xs text-muted-foreground">
              Comprehension-gated progress
            </p>
          </div>
        </div>
      </FloatingCard>

      <FloatingCard
        className="bottom-[20%] right-[14%] hidden lg:block"
        depth="-32px"
        floatDelay="-2.6s"
        floatDuration="5.2s"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/10">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">12-day streak</p>
            <p className="text-xs text-muted-foreground">
              Engagement that compounds
            </p>
          </div>
        </div>
      </FloatingCard>

      {/* Copy */}
      <div className="container relative z-10 flex flex-col items-center text-center">
        <p className="mb-6 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur-sm">
          Wasla Tech · Secure Video Learning
        </p>

        <SplitText
          text="Learning you can prove."
          className="max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
        />

        <p
          ref={subRef}
          className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground motion-safe:opacity-0 sm:text-xl"
        >
          Heartbeat-verified watch time, comprehension-gated checkpoints, and a
          tamper-evident audit trail — so a completed assignment actually means
          something.
        </p>

        <div
          ref={ctaRef}
          className="mt-10 flex flex-col items-center gap-4 motion-safe:opacity-0 sm:flex-row"
        >
          <ShimmerButton href="/app/register">Get Started</ShimmerButton>
          <Link
            href="/app/login"
            className="btn-hover inline-flex items-center justify-center rounded-full border border-border bg-background/60 px-8 py-4 text-base font-semibold backdrop-blur-sm"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent"
      />
    </section>
  );
}
