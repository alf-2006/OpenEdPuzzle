import Link from "next/link";
import { MagneticButton } from "@/components/landing/magnetic-button";

/**
 * CTA — full-width closer. Radial gradient pulse is pure CSS (the
 * `cta-pulse` gradient + `animate-pulse-radial` keyframe); the only JS is
 * the magnetic wrapper on the primary button. Reduced motion: static
 * gradient, no pulse, no magnetism (handled inside useMagnetic).
 */
export function CTA() {
  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      {/* Radial pulse backdrop */}
      <div
        aria-hidden
        className="cta-pulse animate-pulse-radial absolute inset-0 motion-reduce:animate-none"
      />

      <div className="container relative z-10 flex flex-col items-center text-center">
        <h2 className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
          Ready to prove learning?
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-lg text-muted-foreground">
          Set up your first class in under two minutes. Your next assignment
          could be the one you never have to take on faith.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <MagneticButton href="/app/register">Get Started</MagneticButton>
          <Link
            href="/app/login"
            className="btn-hover inline-flex items-center justify-center rounded-full border border-border bg-background/60 px-8 py-4 text-base font-semibold backdrop-blur-sm"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
