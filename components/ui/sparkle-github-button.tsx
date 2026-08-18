"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Star } from "lucide-react";

// transitions.dev — Icon swap (09-icon-swap)
// blur + scale cross-fade: dur 250ms, blur 2px, start-scale 0.25, ease-in-out
const ICON_SWAP = {
  initial: { opacity: 0, scale: 0.25, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit:    { opacity: 0, scale: 0.25, filter: "blur(4px)" },
  transition: { duration: 0.25, ease: "easeInOut" as const },
} as const;

interface SparkleGithubButtonProps {
  href?: string;
  label?: string;
}

export function SparkleGithubButton({
  href = "https://github.com/alf-2006/OpenEdPuzzle",
  label = "Star on GitHub",
}: SparkleGithubButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <motion.button
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className="relative flex items-center justify-center text-foreground h-[36px] px-5 rounded-full bg-muted/60 hover:bg-muted border border-border/60 cursor-pointer transition-colors duration-150 backdrop-blur-sm"
      >
        {/* Icon slot — transitions.dev icon-swap */}
        <div className="relative w-[16px] h-[16px] flex items-center justify-center shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            {!isHovered ? (
              <motion.div
                key="icon-github"
                {...ICON_SWAP}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Github className="w-4 h-4" />
              </motion.div>
            ) : (
              <motion.div
                key="icon-star"
                {...ICON_SWAP}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {/* Sparkle accent — delayed scale-in after icon settles */}
                <motion.div
                  initial={{ opacity: 0, scale: 0, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                  className="absolute -top-3 -right-2"
                >
                  <svg className="w-2.5 h-2.5 text-yellow-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.4 7.6H22l-6.2 4.5 2.4 7.6-6.2-4.5-6.2 4.5 2.4-7.6L2 9.6h7.6z" />
                  </svg>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <span className="font-medium tracking-tight text-[13px] ml-2.5">{label}</span>
      </motion.button>
    </a>
  );
}
