"use client";

import { useMagnetic } from "@/hooks/use-magnetic";
import { ShimmerButton } from "@/components/landing/shimmer-button";

/**
 * MagneticButton — the hero's ShimmerButton wrapped in cursor-attraction.
 * The wrapper carries the transform so the button's own hover/shimmer
 * styles are untouched.
 */
export function MagneticButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const ref = useMagnetic<HTMLDivElement>(0.3);
  return (
    <div ref={ref} className="inline-block will-change-transform">
      <ShimmerButton href={href}>{children}</ShimmerButton>
    </div>
  );
}
