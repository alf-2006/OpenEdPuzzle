"use client";

import { motion } from "framer-motion";
import { GlassCard, GlassCardProps } from "./glass-card";
import { forwardRef } from "react";

export interface AnimatedCardProps extends GlassCardProps {
  delay?: number;
  stagger?: boolean;
  hover?: boolean;
  press?: boolean;
}

const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ delay = 0, stagger = true, hover = true, press = true, children, ...props }, ref) => {
    const entranceVariant = {
      hidden: {
        opacity: 0,
        y: 40
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          delay: stagger ? delay * 0.1 : delay,
          ease: [0.22, 1, 0.36, 1],
        }
      }
    };

    const hoverVariant: any = hover ? {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    } : {};

    const pressVariant: any = press ? {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    } : {};

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        whileHover={hoverVariant}
        whileTap={pressVariant}
        variants={entranceVariant}
        style={{ willChange: "transform, opacity" }}
      >
        <GlassCard glow={hover} {...props}>
          {children}
        </GlassCard>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = "AnimatedCard";

export { AnimatedCard };
