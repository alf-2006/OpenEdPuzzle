"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

// transitions.dev — 09-icon-swap
const ICON_SWAP = {
  initial: { opacity: 0, scale: 0.25, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1,    filter: "blur(0px)" },
  exit:    { opacity: 0, scale: 0.25, filter: "blur(4px)" },
  transition: { duration: 0.25, ease: "easeInOut" as const },
} as const;

export interface PillMorphButtonProps {
  label: string;
  hoverLabel?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  hoverIcon?: LucideIcon | React.ComponentType<{ className?: string }>;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  className?: string;
  iconColor?: string;
  hoverIconColor?: string;
}

export function PillMorphButton({
  label,
  hoverLabel,
  icon: Icon,
  hoverIcon: HoverIcon,
  href,
  external = false,
  onClick,
  className = "",
  iconColor = "text-primary",
  hoverIconColor = "text-primary",
}: PillMorphButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const EffectiveHoverIcon = HoverIcon || Icon;

  const content = (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className={`relative flex items-center justify-center text-foreground h-[36px] px-5 rounded-full bg-muted/60 hover:bg-muted border border-border/60 cursor-pointer transition-colors duration-150 backdrop-blur-sm shadow-sm select-none ${className}`}
    >
      {/* Icon slot — transitions.dev icon-swap */}
      {(Icon || HoverIcon) && (
        <div className="relative w-[16px] h-[16px] flex items-center justify-center shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            {!isHovered && Icon ? (
              <motion.div
                key="default-icon"
                {...ICON_SWAP}
                className={`absolute inset-0 flex items-center justify-center ${iconColor}`}
              >
                <Icon className="w-4 h-4" />
              </motion.div>
            ) : EffectiveHoverIcon ? (
              <motion.div
                key="hover-icon"
                {...ICON_SWAP}
                className={`absolute inset-0 flex items-center justify-center ${hoverIconColor}`}
              >
                <EffectiveHoverIcon className="w-4 h-4" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}

      {/* Text slot — transitions.dev text-states-swap (blur + Y slide) */}
      <div className="relative overflow-hidden h-[20px] inline-grid grid-cols-1 grid-rows-1 items-center ml-2.5">
        <span
          className="col-start-1 row-start-1 font-medium tracking-tight text-[13px] whitespace-nowrap opacity-0 pointer-events-none select-none"
          aria-hidden="true"
        >
          {label}
        </span>
        {hoverLabel && (
          <span
            className="col-start-1 row-start-1 font-medium tracking-tight text-[13px] whitespace-nowrap opacity-0 pointer-events-none select-none"
            aria-hidden="true"
          >
            {hoverLabel}
          </span>
        )}

        <div className="col-start-1 row-start-1 relative w-full h-full flex items-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={isHovered && hoverLabel ? "hovered" : "default"}
              initial={{ y: 8, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -8, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="font-medium tracking-tight text-[13px] whitespace-nowrap absolute left-0"
            >
              {isHovered && hoverLabel ? hoverLabel : label}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block">
          {content}
        </a>
      );
    }
    return (
      <Link href={href} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
}
