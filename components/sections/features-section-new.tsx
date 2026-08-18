"use client";

import { motion } from "framer-motion";
import { Shield, Brain, BarChart3, Server, GraduationCap, Code2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fadeInUp, staggerContainer, scrollFadeInUp, viewportOnce } from "@/lib/animations";

const features = [
  {
    icon: Shield,
    title: "Cryptographic Anti-Cheat Engine",
    description:
      "Server-side heartbeat verification computes Δreal_server vs Δvideo. Skips, fast-forwarding, and DevTools hacks are rejected in PostgreSQL.",
    visual: (
      <div className="mt-4 p-3 rounded-lg bg-muted/70 border border-border font-mono text-xs space-y-1">
        <div className="text-muted-foreground">// PostgreSQL submit_heartbeat()</div>
        <div className="text-primary font-semibold">interval_union = numrange(t0, t1)</div>
        <div className="text-muted-foreground">verified_percent = 100 * union / duration</div>
        <div className="text-accent font-semibold">status: "VERIFIED"</div>
      </div>
    ),
  },
  {
    icon: Brain,
    title: "Interactive Video Checkpoints",
    description:
      "Embed multiple-choice and open questions at exact timestamps. Playback automatically pauses until students answer.",
    visual: (
      <div className="mt-4 space-y-2">
        <div className="h-2 rounded-full bg-muted relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-[65%] bg-primary rounded-full" />
          <div className="absolute top-0 left-[35%] w-1.5 h-full bg-accent" />
          <div className="absolute top-0 left-[70%] w-1.5 h-full bg-accent" />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            Checkpoint markers
          </span>
          <span className="font-mono text-primary font-medium">Pause on cue</span>
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    title: "Student Engagement Heatmaps",
    description:
      "Visualize aggregate class viewing patterns. Pinpoint confusing seconds where students rewatch or drop off.",
    visual: (
      <div className="mt-4 space-y-1.5">
        <div className="flex items-end gap-1 h-10 pt-2">
          {[20, 45, 80, 95, 60, 40, 30, 85, 100, 70, 50, 40, 30, 20].map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all"
              style={{
                height: `${height}%`,
                backgroundColor: height > 75 ? "hsl(var(--accent))" : "hsl(var(--primary))",
                opacity: 0.2 + (height / 100) * 0.8,
              }}
              title={`${height}% rewatched`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
          <span>00:00</span>
          <span>Rewatch Spikes</span>
          <span>End</span>
        </div>
      </div>
    ),
  },
  {
    icon: Server,
    title: "100% Self-Hostable & Privacy First",
    description:
      "Deploy on your own infrastructure with Supabase and Vercel. Zero third-party tracker cookies, full student data ownership.",
    visual: (
      <div className="mt-4 p-2.5 rounded-lg bg-muted/70 border border-border text-xs flex items-center justify-between">
        <span className="font-mono text-muted-foreground">docker compose up / vercel deploy</span>
        <span className="text-[11px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded">
          MIT License
        </span>
      </div>
    ),
  },
  {
    icon: GraduationCap,
    title: "Classrooms & Easy Join Codes",
    description:
      "Teachers create classes and generate instant shareable join codes. Students enroll without complex CSV imports.",
    visual: (
      <div className="mt-4 p-2.5 rounded-lg bg-card border border-border flex items-center justify-between">
        <div className="text-xs">
          <div className="font-medium text-foreground">Class Join Code</div>
          <div className="text-[11px] text-muted-foreground font-mono">CHEM-101-FALL</div>
        </div>
        <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2 py-1 rounded">
          #W8K92L
        </span>
      </div>
    ),
  },
  {
    icon: Code2,
    title: "Modern TypeScript Stack",
    description:
      "Built with Next.js 15 (App Router), React 19, TypeScript 5.9, Tailwind CSS, Lucide icons, and Supabase RLS policies.",
    visual: (
      <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] font-mono">
        <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border">Next.js 15</span>
        <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border">Supabase</span>
        <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border">React 19</span>
        <span className="px-2 py-0.5 rounded bg-muted text-foreground border border-border">Zustand</span>
      </div>
    ),
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          variants={fadeInUp}
          className="text-center mb-16 space-y-3"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            Engineered for Education
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Complete Toolkit for Verifiable Video Learning
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything educators need to ensure engagement, prevent academic dishonesty, and understand student comprehension.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={scrollFadeInUp}>
              <Card className="h-full border border-border/80 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md flex flex-col justify-between">
                <CardHeader>
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed mt-2 text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>{feature.visual}</CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
