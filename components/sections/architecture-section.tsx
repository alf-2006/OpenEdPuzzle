"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Terminal, Lock, Cpu, ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { scrollFadeInUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { PillMorphButton } from "@/components/ui/pill-morph-button";

const ARCHITECTURE_PILLARS = [
  {
    title: "1. Server-Side Time Verification",
    description:
      "The client sends heartbeat intervals [t_start, t_end]. The server compares Δreal_server with Δvideo_played to ensure playback speed does not exceed 2.0x.",
    code: `SELECT CASE WHEN (delta_video / NULLIF(delta_server, 0)) > 2.05\n  THEN RAISE EXCEPTION 'Speed violation';`,
  },
  {
    title: "2. Interval Union Algebra",
    description:
      "All viewed fragments are aggregated into a PostgreSQL numrange[] multirange. Rewatching an existing clip does not double-count completion percentage.",
    code: `verified_range = verified_range + numrange(current_start, current_end);\ncompletion_pct = (range_duration(verified_range) / video_duration) * 100;`,
  },
  {
    title: "3. Comprehension-Gated Checkpoints",
    description:
      "Question checkpoints lock subsequent video segments in PostgreSQL. A student cannot receive credit for future segments until prior checkpoints are answered.",
    code: `IF NOT check_prior_checkpoints_passed(session_id, current_time)\n  THEN RETURN jsonb_build_object('status', 'BLOCKED');`,
  },
];

export function ArchitectureSection() {
  return (
    <section id="architecture" className="relative py-20 sm:py-28 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          variants={scrollFadeInUp}
          className="text-center mb-16 space-y-3"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider font-mono">
            <Terminal className="w-3.5 h-3.5" />
            Under The Hood
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground">
            Built-In Anti-Cheat Architecture
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            How OpenEdPuzzle guarantees verifiable progress through mathematical constraints in PostgreSQL.
          </p>
        </motion.div>

        {/* Pillars Grid */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6 sm:gap-8"
        >
          {ARCHITECTURE_PILLARS.map((pillar) => (
            <motion.div key={pillar.title} variants={scrollFadeInUp}>
              <Card className="h-full border border-border/80 bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold text-base">
                    <ShieldAlert className="w-4 h-4 text-accent" />
                    <span>{pillar.title}</span>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>

                  <div className="mt-4 rounded-lg bg-slate-950 p-3.5 text-[11px] font-mono text-emerald-400 border border-slate-800 overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{pillar.code}</pre>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Security Summary Box */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          variants={scrollFadeInUp}
          className="mt-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-1.5 text-center sm:text-left">
            <h4 className="text-lg font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Full Security & Threat Model Documentation
            </h4>
            <p className="text-sm text-muted-foreground max-w-xl">
              Inspect our comprehensive threat analysis covering client memory injection, tab throttling, offline heartbeat sync, and race condition mitigations.
            </p>
          </div>
          <PillMorphButton
            label="View Security Analysis"
            hoverLabel="Open Documentation"
            icon={ShieldCheck}
            hoverIcon={ArrowRight}
            href="https://github.com/alf-2006/OpenEdPuzzle/blob/main/SECURITY_ANALYSIS.md"
            external
          />
        </motion.div>
      </div>
    </section>
  );
}
