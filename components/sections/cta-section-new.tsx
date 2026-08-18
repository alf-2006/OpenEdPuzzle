"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Sparkles } from "lucide-react";
import { scrollFadeInUp, viewportOnce } from "@/lib/animations";
import { LaunchAppButton } from "@/components/ui/launch-app-button";
import { SparkleGithubButton } from "@/components/ui/sparkle-github-button";

export function CTASection() {
  return (
    <section className="relative py-28 sm:py-36 overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-violet-700 text-primary-foreground">
      {/* Mesh overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.08)_0%,_transparent_70%)]"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          variants={scrollFadeInUp}
          className="space-y-8"
        >
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-mono font-medium backdrop-blur-sm border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Free Forever · MIT Licensed · Open Source</span>
          </div>

          {/* Bold Headline with Nunito Display Font */}
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Ready to prove learning?
          </h2>

          {/* Direct Subheadline */}
          <p className="text-lg sm:text-xl text-blue-100 max-w-xl mx-auto leading-relaxed">
            Stop wondering if students actually watched the lesson.
            Self-host OpenEdPuzzle or launch the live app right now.
          </p>

          {/* Focused Action CTAs */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-4">
            <LaunchAppButton />
            <SparkleGithubButton />
          </div>

          <p className="text-xs text-blue-200/80 pt-2 font-mono">
            Zero Telemetry · Supabase + Next.js 15 · Self-Hostable in 1 click
          </p>
        </motion.div>
      </div>
    </section>
  );
}
