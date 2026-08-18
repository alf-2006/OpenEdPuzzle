/**
 * Animation System — Framer Motion Only
 *
 * Cohesive motion language for WaslaLearn.
 * All animations follow the custom ease: cubic-bezier(0.22, 1, 0.36, 1)
 *
 * NO GSAP. NO scroll hijacking. Clean, purposeful motion.
 */

import { Transition, Variants } from "framer-motion";

// ==========================================
// TRANSITION PRESETS
// ==========================================

export const transitions = {
  /** Fast micro-interactions (150ms) */
  fast: {
    duration: 0.15,
    ease: "easeOut",
  } as Transition,

  /** Default transitions (250ms) */
  default: {
    duration: 0.25,
    ease: [0.22, 1, 0.36, 1],
  } as Transition,

  /** Slow, dramatic transitions (400ms) */
  slow: {
    duration: 0.4,
    ease: [0.22, 1, 0.36, 1],
  } as Transition,

  /** Spring physics for playful interactions */
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 25,
  } as Transition,
} as const;

// ==========================================
// ENTRANCE ANIMATIONS
// ==========================================

/** Fade in from below (default page/card entrance) */
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.default,
  },
};

/** Fade in only (no movement) */
export const fadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: transitions.default,
  },
};

/** Scale in with fade (for modals/overlays) */
export const scaleIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: transitions.default,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitions.fast,
  },
};

// ==========================================
// STAGGER CONTAINERS
// ==========================================

/** Stagger children with 100ms delay */
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/** Faster stagger for small lists */
export const staggerFast: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

// ==========================================
// HOVER & TAP ANIMATIONS
// ==========================================

/** Subtle lift on hover (cards, buttons) */
export const hoverLift = {
  whileHover: {
    y: -4,
    transition: transitions.fast,
  },
};

/** Scale up slightly on hover */
export const hoverScale = {
  whileHover: {
    scale: 1.02,
    transition: transitions.fast,
  },
};

/** Scale down on tap (active state) */
export const tapScale = {
  whileTap: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
};

/** Combined hover + tap for buttons */
export const buttonMotion = {
  whileHover: {
    scale: 1.02,
    transition: transitions.fast,
  },
  whileTap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

// ==========================================
// SCROLL ANIMATIONS (Intersection Observer)
// ==========================================

/**
 * Viewport config for scroll-triggered animations
 * Triggers 100px before element enters viewport
 * Only animates once (not on scroll up)
 */
export const viewportOnce = {
  once: true,
  margin: "-100px",
};

/**
 * Fade in up when scrolling into view
 * Usage:
 * <motion.div
 *   initial="initial"
 *   whileInView="animate"
 *   viewport={viewportOnce}
 *   variants={scrollFadeInUp}
 * >
 */
export const scrollFadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 40,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// ==========================================
// PAGE TRANSITIONS
// ==========================================

/** Page enter/exit animations (for AnimatePresence) */
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.15,
      ease: "easeIn",
    },
  },
};

// ==========================================
// SPECIALIZED ANIMATIONS
// ==========================================

/** Progress bar fill animation */
export const progressFill = (percentage: number): Variants => ({
  initial: {
    width: 0,
  },
  animate: {
    width: `${percentage}%`,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
});

/** Rotate arrow icon on sort */
export const sortArrowRotate: Variants = {
  asc: {
    rotate: 180,
    transition: transitions.default,
  },
  desc: {
    rotate: 0,
    transition: transitions.default,
  },
};

/** Slide in from bottom (for overlays/sheets) */
export const slideInFromBottom: Variants = {
  initial: {
    y: "100%",
  },
  animate: {
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    y: "100%",
    transition: {
      duration: 0.25,
      ease: "easeIn",
    },
  },
};

/** Slide in from right (for panels/cards) */
export const slideInRight: Variants = {
  initial: {
    x: 40,
    opacity: 0,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    x: 40,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

/** Drawer slide from left */
export const drawerSlide: Variants = {
  initial: {
    x: "-100%",
  },
  animate: {
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    x: "-100%",
    transition: {
      duration: 0.25,
      ease: "easeIn",
    },
  },
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Create a stagger delay for manual index-based animations
 * @param index - Item index in list
 * @param baseDelay - Base delay in seconds (default: 0)
 * @param stagger - Stagger increment in seconds (default: 0.1)
 */
export function getStaggerDelay(
  index: number,
  baseDelay: number = 0,
  stagger: number = 0.1
): number {
  return baseDelay + index * stagger;
}

/**
 * Create viewport config with custom margin
 * @param margin - Margin string (e.g., "-50px", "-20%")
 */
export function createViewport(margin: string = "-100px") {
  return {
    once: true,
    margin,
  };
}
