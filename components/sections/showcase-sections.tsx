"use client";

import { motion } from "framer-motion";
import { ShieldCheck, BrainCircuit, BarChart3, CheckCircle2, Lock, Flame, AlertCircle, Sparkles } from "lucide-react";
import { fadeInUp, viewportOnce } from "@/lib/animations";
import { TiltCard } from "@/components/ui/tilt-card";

export function ShowcaseSections() {
  return (
    <div id="features" className="space-y-28 sm:space-y-36 py-20 sm:py-28 overflow-hidden">
      {/* SHOWCASE 1: THE PLAYER & ANTI-SKIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center"
        >
          {/* Left Text */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Anti-Skip Heartbeats
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.05]">
              We can prove they watched it.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Students can't speed-run, skip ahead, or mute in a background tab. Heartbeat intervals are validated directly inside PostgreSQL.
            </p>
            <div className="pt-2">
              <div className="p-3.5 rounded-xl bg-muted/60 border border-border font-mono text-xs text-muted-foreground space-y-1">
                <span className="text-primary font-bold">SQL Assertion:</span>
                <p className="text-foreground font-medium">Δvideo_time &lt;= 2.0 * Δserver_time</p>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ Skips & DevTools hacks rejected with 403</span>
              </div>
            </div>
          </div>

          {/* Right Visual (Tiltable Player Preview) */}
          <div className="lg:col-span-7">
            <TiltCard maxTilt={4} perspective={1200}>
              <div className="rounded-2xl border border-border bg-card real-shadow-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-foreground">Live Anti-Cheat Guard</span>
                  </div>
                  <span className="text-xs font-mono text-primary font-semibold bg-primary/10 px-2.5 py-0.5 rounded-full">
                    Continuous Interval [00:00 → 04:30]
                  </span>
                </div>

                {/* Progress Timeline Representation */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>Watched Segments (Union Range)</span>
                    <span className="text-foreground font-bold">78% Verified</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full relative overflow-hidden flex">
                    <div className="w-[35%] bg-primary h-full" title="Watched 0:00-3:30" />
                    <div className="w-[8%] bg-muted-foreground/20 h-full" title="Unwatched gap" />
                    <div className="w-[43%] bg-primary h-full" title="Watched 4:10-8:20" />
                    <div className="w-[14%] bg-muted h-full" />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground font-mono pt-1">
                    <span>00:00</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">🔒 Checkpoint lock at 08:30</span>
                    <span>10:00</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/70">
                    <span className="text-muted-foreground block text-[11px]">Tab Visibility</span>
                    <span className="font-bold text-foreground">Active Window Only</span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/70">
                    <span className="text-muted-foreground block text-[11px]">Playback Rate</span>
                    <span className="font-bold text-foreground">Capped at 2.0x</span>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </motion.div>
      </section>

      {/* SHOWCASE 2: THE CHECKPOINTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center"
        >
          {/* Left Visual (Checkpoint Dialog Preview) */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <TiltCard maxTilt={4} perspective={1200}>
              <div className="rounded-2xl border border-border bg-card real-shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <span className="text-xs font-bold text-accent flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 text-accent" />
                    Timestamp Checkpoint · 05:42
                  </span>
                  <span className="text-[11px] font-mono bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded">
                    Gated Progress
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm sm:text-base font-bold text-foreground">
                    Which equation represents the conservation of mechanical energy?
                  </h4>
                  <div className="space-y-2 text-xs font-medium">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/40 text-foreground flex items-center justify-between">
                      <span>A. E_total = K + U = constant</span>
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 border border-border text-muted-foreground">
                      <span>B. E_total = K - U</span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 border border-border text-muted-foreground">
                      <span>C. W_net = ΔU only</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
                  <span>Instant auto-grading enabled</span>
                  <span className="text-primary font-bold">Unlocks next 4 minutes →</span>
                </div>
              </div>
            </TiltCard>
          </div>

          {/* Right Text */}
          <div className="lg:col-span-5 space-y-4 text-left order-1 lg:order-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-accent">
              <BrainCircuit className="w-4 h-4 text-accent" />
              Comprehension Gated
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.05]">
              They can't skim past the hard part.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Drop multiple-choice questions and reflections directly onto the video timeline.
              Playback locks automatically until students understand and pass.
            </p>
          </div>
        </motion.div>
      </section>

      {/* SHOWCASE 3: HEATMAPS & ENGAGEMENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center"
        >
          {/* Left Text */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-primary">
              <BarChart3 className="w-4 h-4 text-primary" />
              Engagement Heatmaps
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.05]">
              See where they got stuck.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Per-second class heatmaps reveal confusing moments instantly. Stop guessing what to review in class tomorrow.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-accent" />
                Rewatch Spikes (Confusion)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
                Normal Playback
              </span>
            </div>
          </div>

          {/* Right Visual (Interactive Heatmap Bar Chart) */}
          <div className="lg:col-span-7">
            <TiltCard maxTilt={4} perspective={1200}>
              <div className="rounded-2xl border border-border bg-card real-shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-foreground">Class Confusion Heatmap · Lecture #4</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">28 Students</span>
                </div>

                {/* Heatmap Bar Graph */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-end gap-1.5 h-28 pt-4">
                    {[20, 35, 45, 95, 100, 75, 40, 30, 25, 85, 90, 60, 40, 30, 20].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                        <div
                          className="w-full rounded-t-sm transition-all hover:opacity-90"
                          style={{
                            height: `${val}%`,
                            backgroundColor: val > 70 ? "hsl(var(--accent))" : "hsl(var(--primary))",
                            opacity: 0.35 + (val / 100) * 0.65,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-muted-foreground border-t border-border/50 pt-2">
                    <span>00:00 (Intro)</span>
                    <span className="text-accent font-bold">⚠️ Rewound 4.2x at 04:30</span>
                    <span>12:00 (End)</span>
                  </div>
                </div>

                {/* Audit Trail Note */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-medium">Audit logs ready for grade disputes</span>
                  </div>
                  <span className="font-mono text-primary font-bold">100% Tamper Proof</span>
                </div>
              </div>
            </TiltCard>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
