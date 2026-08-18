"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, ArrowRight } from "lucide-react";
import Link from "next/link";

// transitions.dev — Icon swap (09-icon-swap)
const ICON_SWAP = {
  initial: { opacity: 0, scale: 0.25, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1,    filter: "blur(0px)" },
  exit:    { opacity: 0, scale: 0.25, filter: "blur(4px)" },
  transition: { duration: 0.25, ease: "easeInOut" as const },
} as const;

interface LaunchAppButtonProps {
  defaultLabel?: string;
  hoverLabel?: string;
  className?: string;
}

export function LaunchAppButton({
  defaultLabel = "Start The Journey",
  hoverLabel = "Launch App",
  className = "",
}: LaunchAppButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href="/app">
      <motion.button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className={`relative flex items-center justify-center text-foreground h-[36px] px-5 rounded-full bg-muted/60 hover:bg-muted border border-border/60 cursor-pointer transition-colors duration-150 backdrop-blur-sm shadow-sm ${className}`}
      >
        {/* Icon slot — transitions.dev icon-swap */}
        <div className="relative w-[16px] h-[16px] flex items-center justify-center shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            {!isHovered ? (
              <motion.div
                key="rocket"
                {...ICON_SWAP}
                className="absolute inset-0 flex items-center justify-center text-primary"
              >
                <Rocket className="w-4 h-4 text-primary" />
              </motion.div>
            ) : (
              <motion.div
                key="arrow"
                {...ICON_SWAP}
                className="absolute inset-0 flex items-center justify-center text-primary"
              >
                <ArrowRight className="w-4 h-4 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Text swap — transitions.dev text-states-swap (blur + Y slide) */}
        <div className="relative overflow-hidden h-[20px] inline-grid grid-cols-1 grid-rows-1 items-center ml-2.5">
          {/* Invisible sizing spans to keep button width perfectly fixed */}
          <span
            className="col-start-1 row-start-1 font-medium tracking-tight text-[13px] whitespace-nowrap opacity-0 pointer-events-none select-none"
            aria-hidden="true"
          >
            {defaultLabel}
          </span>
          <span
            className="col-start-1 row-start-1 font-medium tracking-tight text-[13px] whitespace-nowrap opacity-0 pointer-events-none select-none"
            aria-hidden="true"
          >
            {hoverLabel}
          </span>

          <div className="col-start-1 row-start-1 relative w-full h-full flex items-center">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={isHovered ? "hovered" : "default"}
                initial={{ y: 8, opacity: 0, filter: "blur(4px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -8, opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="font-medium tracking-tight text-[13px] whitespace-nowrap absolute left-0"
              >
                {isHovered ? hoverLabel : defaultLabel}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </motion.button>
    </Link>
  );
}
