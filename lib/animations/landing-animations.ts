// GSAP + ScrollTrigger + Lenis setup for the landing page ONLY.
// Imported via next/dynamic (ssr: false) from landing sections so these
// libraries never enter the /app bundle. Implemented in Phase 2.

export const LANDING_EASES = {
  heroWords: "power3.out",
  featureCards: "power2.out",
  iconBounce: "back.out(1.7)",
  counter: "power2.out",
} as const;
