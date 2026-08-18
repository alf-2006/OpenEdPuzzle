"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// transitions.dev — Icon swap (09-icon-swap)
// Pattern: blur + scale cross-fade between two icons in the same slot
// --icon-swap-dur: 250ms | --icon-swap-blur: 2px | --icon-swap-start-scale: 0.25
// transitions.dev — Icon swap (09-icon-swap)
// Pattern: blur + scale cross-fade between two icons in the same slot
// --icon-swap-dur: 250ms | --icon-swap-blur: 2px | --icon-swap-start-scale: 0.25
const ICON_SWAP = {
  initial: { opacity: 0, scale: 0.25, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.25, filter: "blur(4px)" },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
} as const;

export function ThemeMorphButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      aria-label="Toggle theme"
      className="relative flex items-center justify-center text-foreground h-[36px] px-4 rounded-full bg-muted/60 hover:bg-muted border border-border/60 cursor-pointer transition-colors duration-150 backdrop-blur-sm"
    >
      {/* Icon slot — transitions.dev icon-swap pattern */}
      <div className="relative w-[16px] h-[16px] flex items-center justify-center shrink-0">
        <AnimatePresence mode="popLayout" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              {...ICON_SWAP}
              className="absolute inset-0 flex items-center justify-center text-indigo-400"
            >
              <Moon className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              {...ICON_SWAP}
              className="absolute inset-0 flex items-center justify-center text-amber-500"
            >
              <Sun className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Text swap — transitions.dev text-states-swap pattern (blur + Y slide) */}
      <div className="relative overflow-hidden h-[20px] inline-grid grid-cols-1 grid-rows-1 items-center ml-2.5">
        <span className="col-start-1 row-start-1 font-medium tracking-tight text-[13px] whitespace-nowrap opacity-0 pointer-events-none select-none" aria-hidden="true">
          Theme
        </span>
        <span className="col-start-1 row-start-1 font-medium tracking-tight text-[13px] whitespace-nowrap opacity-0 pointer-events-none select-none" aria-hidden="true">
          Light
        </span>

        <div className="col-start-1 row-start-1 relative w-full h-full flex items-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={isHovered ? "action" : "label"}
              initial={{ y: 8, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -8, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="font-medium tracking-tight text-[13px] whitespace-nowrap absolute left-0"
            >
              {isHovered ? (isDark ? "Light" : "Dark") : "Theme"}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );
}
