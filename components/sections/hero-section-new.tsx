"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Check, Shield, ArrowRight, Lock, CheckCircle2, Terminal, Flame, Sparkles } from "lucide-react";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { ScrambleText } from "@/components/ui/scramble-text";
import { MagneticWrapper } from "@/components/ui/magnetic-wrapper";
import { CursorSpotlight } from "@/components/ui/cursor-spotlight";
import { TiltCard } from "@/components/ui/tilt-card";
import { SparkleGithubButton } from "@/components/ui/sparkle-github-button";
import { LaunchAppButton } from "@/components/ui/launch-app-button";

export function HeroSection() {
  return (
    <CursorSpotlight className="relative min-h-[92vh] flex items-center overflow-hidden py-16 lg:py-24 bg-background">
      {/* Bold intentional accent shape behind the mockup */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-5%] top-[12%] w-[580px] h-[580px] rounded-[38%_62%_63%_37%/41%_44%_56%_59%] bg-amber-500/10 dark:bg-amber-500/5 blur-3xl -z-0 transform rotate-12"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[5%] bottom-[5%] w-[420px] h-[420px] rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl -z-0"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center"
        >
          {/* LEFT: Editorial Left-Aligned Content (5 cols) */}
          <motion.div variants={fadeInUp} className="lg:col-span-5 space-y-6 text-left">
            {/* Open source label */}
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span>// OpenEdPuzzle · MIT Licensed</span>
            </div>

            {/* Massive Display Headline with Scramble Effect */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-[4.25rem] font-black tracking-[-0.035em] leading-[0.95] text-foreground">
              <ScrambleText text="Students click play" duration={700} delay={100} />
              <span className="block mt-1">
                <ScrambleText text="and walk away." duration={750} delay={250} />
              </span>
              <span className="text-primary font-black block mt-2">
                <ScrambleText text="Not anymore." duration={800} delay={450} />
              </span>
            </h1>

            {/* Human Subheadline */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed">
              OpenEdPuzzle verifies every second of watch time with database math, not trust.
              Comprehension-gated checkpoints ensure students actually understand before moving forward.
            </p>

            {/* Direct Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <LaunchAppButton />
              <SparkleGithubButton />
            </div>

            {/* Stats bar */}
            <div className="pt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-mono">Live Sessions</span>
              </div>
              <span className="text-border">·</span>
              <span className="font-mono">MIT Licensed</span>
              <span className="text-border">·</span>
              <span className="font-mono">Zero Lock-in</span>
              <span className="text-border">·</span>
              <span className="font-mono">Self-Hostable</span>
            </div>
          </motion.div>

          {/* RIGHT: Larger Asymmetric Product Mockup (7 cols) with 3D Tilt & Floating Badges */}
          <motion.div
            variants={fadeInUp}
            className="lg:col-span-7 relative lg:-mr-8 xl:-mr-12"
          >
            <TiltCard maxTilt={5} perspective={1100}>
              <HeroPlayerMockup />
            </TiltCard>
          </motion.div>
        </motion.div>
      </div>
    </CursorSpotlight>
  );
}

function HeroPlayerMockup() {
  return (
    <div className="relative">
      {/* Orbiting Badge 1: Top Right */}
      <motion.div
        className="hidden sm:flex absolute -top-5 right-6 bg-card border border-border text-foreground text-xs font-mono font-bold px-3 py-1.5 rounded-full z-20 shadow-lg items-center gap-1.5 hover:scale-110 transition-transform cursor-default"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>Δreal_server == Δvideo</span>
      </motion.div>

      {/* Orbiting Badge 2: Right Center */}
      <motion.div
        className="hidden sm:flex absolute top-1/2 -right-6 bg-card border border-border text-xs font-semibold px-3 py-1.5 rounded-xl z-20 shadow-lg items-center gap-2 hover:scale-110 transition-transform cursor-default"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <Flame className="w-4 h-4 text-amber-500" />
        <span>Heatmap Ready</span>
      </motion.div>

      {/* Main Player Window with Realistic Layered Shadow */}
      <div className="relative rounded-2xl overflow-hidden border border-border/90 bg-card real-shadow-xl">
        {/* Browser Chrome Header */}
        <div className="h-10 bg-muted/60 border-b border-border px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="text-[11px] font-mono text-muted-foreground bg-background/80 px-3 py-0.5 rounded border border-border/60 max-w-xs truncate">
            openedpuzzle.app/watch/chem-101
          </div>
          <div className="text-[11px] font-mono text-primary font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Active Session
          </div>
        </div>

        {/* Video Canvas Scene */}
        <div className="aspect-[16/9.5] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden text-white flex flex-col justify-between p-5">
          {/* Top Video Overlay Bar */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-medium border border-white/10 flex items-center gap-1.5 text-blue-300">
                <Shield className="w-3.5 h-3.5" />
                Anti-Skip Active
              </span>
              <span className="px-2 py-1 rounded-md bg-black/40 text-[11px] font-mono text-white/80">
                Speed: 1.0x (Locked)
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
              Checkpoint at 04:12
            </span>
          </div>

          {/* Center Interactive Question Card */}
          <div className="relative z-10 max-w-md mx-auto w-full bg-slate-900/95 border border-primary/40 rounded-xl p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                Checkpoint Question #2
              </span>
              <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded">
                Required to continue
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-100 font-medium mb-3">
              How does the server confirm continuous student attendance during video playback?
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium border border-primary/40">
                <span>A. Server-side heartbeat intervals [t0, t1] with PostgreSQL union</span>
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="px-3 py-2 rounded-lg bg-slate-800/80 text-slate-300 text-xs font-normal border border-slate-700/50">
                <span>B. Client localStorage timestamps</span>
              </div>
            </div>
          </div>

          {/* Bottom Timeline Controls */}
          <div className="z-10 space-y-2 pt-2">
            <div className="relative h-3 rounded-full bg-slate-800 overflow-hidden cursor-pointer">
              {/* Verified viewed segments */}
              <div className="absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-primary to-blue-400 rounded-full" />
              {/* Checkpoint markers */}
              <div className="absolute top-0 left-[25%] w-1.5 h-full bg-blue-300 shadow" title="Checkpoint 1 (Passed)" />
              <div className="absolute top-0 left-[58%] w-2 h-full bg-amber-400 animate-pulse" title="Checkpoint 2 (Current)" />
              <div className="absolute top-0 left-[82%] w-1.5 h-full bg-slate-600" title="Checkpoint 3" />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>04:12 / 09:30 (58% Verified)</span>
              <span className="text-blue-400 font-semibold">100% Interval Integrity</span>
            </div>
          </div>
        </div>

        {/* Live SQL proof bar underneath */}
        <div className="p-3.5 bg-card border-t border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono text-muted-foreground truncate">
            <Terminal className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">rpc_submit_heartbeat(session_id, interval) → 200 OK</span>
          </div>
          <span className="font-semibold text-primary shrink-0 ml-2">Tamper Proof</span>
        </div>
      </div>

      {/* Orbiting Badge 3: Bottom Left */}
      <motion.div
        className="absolute -bottom-4 -left-4 sm:-left-6 bg-card border border-border shadow-lg rounded-xl p-3 flex items-center gap-2.5 z-20 hover:scale-105 transition-transform"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Lock className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="font-bold text-foreground">Anti-Skip Protection</div>
          <div className="text-muted-foreground text-[11px]">Forward scrub locked</div>
        </div>
      </motion.div>
    </div>
  );
}
