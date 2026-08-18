"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Database, Cpu, Lock } from "lucide-react";
import { scrollFadeInUp, staggerContainer, viewportOnce } from "@/lib/animations";

const stats = [
  {
    icon: ShieldCheck,
    title: "100% Open Source",
    description: "MIT Licensed codebase. Inspect, customize, and extend freely.",
    badge: "Free Forever",
  },
  {
    icon: Database,
    title: "PostgreSQL Verification",
    description: "Server-side interval unions ensure 0% cheating tolerance.",
    badge: "numrange[] math",
  },
  {
    icon: Cpu,
    title: "Zero Client Trust",
    description: "Heartbeat verification stops script tampering and DevTools speed hacks.",
    badge: "Anti-Cheat",
  },
  {
    icon: Lock,
    title: "Privacy First Architecture",
    description: "Zero third-party trackers. Own 100% of your student learning data.",
    badge: "GDPR Compliant",
  },
];

export function StatsSection() {
  return (
    <section className="relative py-16 sm:py-20 border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.title}
              variants={scrollFadeInUp}
              className="bg-card border border-border/70 rounded-xl p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    {stat.badge}
                  </span>
                </div>
                <div className="text-base font-bold text-foreground mb-1">
                  {stat.title}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {stat.description}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
