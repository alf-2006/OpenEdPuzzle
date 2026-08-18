"use client";

import { motion } from "framer-motion";
import { PlusCircle, Video, Play, FileCheck2, Check } from "lucide-react";
import { scrollFadeInUp, viewportOnce } from "@/lib/animations";

const steps = [
  {
    step: "Step 01",
    title: "Create class & share code",
    description: "Spin up a class in five seconds. Students join with a 6-character code — no roster imports or CSV spreadsheets.",
    icon: PlusCircle,
    preview: (
      <div className="p-4 rounded-xl bg-card border border-border/80 shadow-md hover:shadow-lg transition-all space-y-2 hover:-translate-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground">Advanced Physics 101</span>
          <span className="font-mono bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full">
            CODE: #PH94K2
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Students enroll directly with one click.
        </div>
      </div>
    ),
  },
  {
    step: "Step 02",
    title: "Attach video & drop checkpoints",
    description: "Paste a YouTube link or MP4 URL. Add multiple-choice or open questions right at the timestamps that matter.",
    icon: Video,
    preview: (
      <div className="p-4 rounded-xl bg-card border border-border/80 shadow-md hover:shadow-lg transition-all space-y-2.5 hover:-translate-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-muted-foreground truncate">youtube.com/watch?v=k9X...</span>
          <span className="text-accent font-bold">3 Checkpoints</span>
        </div>
        <div className="h-2 bg-muted rounded-full relative overflow-hidden">
          <div className="absolute left-[30%] w-1.5 h-full bg-accent" />
          <div className="absolute left-[65%] w-1.5 h-full bg-accent" />
          <div className="absolute left-[90%] w-1.5 h-full bg-accent" />
        </div>
      </div>
    ),
  },
  {
    step: "Step 03",
    title: "Students watch with anti-skip proof",
    description: "The browser player sends heartbeat intervals every 5 seconds. PostgreSQL validates continuous watch time.",
    icon: Play,
    preview: (
      <div className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 shadow-md hover:shadow-lg transition-all space-y-1 hover:-translate-y-1">
        <div className="text-slate-400">// Client → PostgreSQL RPC</div>
        <div>submit_heartbeat(session_id, [02:10, 02:20])</div>
        <div className="text-blue-300 font-semibold">✓ Verified Interval Recorded (200 OK)</div>
      </div>
    ),
  },
  {
    step: "Step 04",
    title: "Review heatmap & export grades",
    description: "See aggregate confusion heatmaps, student question accuracy, and cryptographic proof of completion.",
    icon: FileCheck2,
    preview: (
      <div className="p-4 rounded-xl bg-card border border-border/80 shadow-md hover:shadow-lg transition-all space-y-2 hover:-translate-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-foreground">Completion Rate</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">94% Verified</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Check className="w-3.5 h-3.5 text-primary" />
          <span>Audit trail ready for grade disputes</span>
        </div>
      </div>
    ),
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 bg-muted/20 border-y border-border/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          variants={scrollFadeInUp}
          className="text-left max-w-2xl mb-20 space-y-3"
        >
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
            // Step-by-Step Workflow
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
            How OpenEdPuzzle works in four steps.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            From assignment setup to tamper-evident grading without complex configurations.
          </p>
        </motion.div>

        {/* Vertical Alternating Timeline */}
        <div className="relative">
          {/* Central Connecting Line — explicitly sized */}
          <div className="absolute top-6 bottom-6 left-4 md:left-1/2 w-px bg-gradient-to-b from-primary via-primary/40 to-transparent -translate-x-1/2 z-0" />

          <div className="space-y-16 sm:space-y-20">
            {steps.map((step, idx) => {
              const isEven = idx % 2 === 0;
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial="initial"
                  whileInView="animate"
                  viewport={viewportOnce}
                  variants={scrollFadeInUp}
                  className={`relative flex flex-col md:flex-row items-start md:items-center ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  } gap-8 md:gap-12 pl-14 md:pl-0`}
                >
                  {/* Timeline Node */}
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 z-10 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shadow-lg ring-4 ring-primary/20">
                      {idx + 1}
                    </div>
                  </div>

                  {/* Text Side */}
                  <div className={`w-full md:w-1/2 ${isEven ? "md:text-right md:pr-8" : "md:text-left md:pl-8"} space-y-2`}>
                    <div className="flex items-center gap-2 mb-1 ${isEven ? 'md:justify-end' : ''}">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Preview Side */}
                  <div className="w-full md:w-1/2">
                    {step.preview}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
