import { cn } from "@/lib/utils";

/**
 * FloatingCard — decorative card with a CSS float animation plus mouse
 * parallax. Parallax uses the individual `translate` property driven by
 * --par-x/--par-y custom properties (set by the parent hero on a throttled
 * pointermove), so it composes with the keyframe `transform` float instead
 * of fighting it. `depth` is a signed px value: negative = moves opposite
 * to the cursor.
 */
export function FloatingCard({
  className,
  depth = "-20px",
  floatDelay = "0s",
  floatDuration = "4s",
  children,
}: {
  className?: string;
  depth?: string;
  floatDelay?: string;
  floatDuration?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      style={
        {
          "--depth": depth,
          animationDelay: floatDelay,
          animationDuration: floatDuration,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute animate-float select-none rounded-2xl border border-border/60 bg-card/70 p-4 shadow-xl shadow-primary/5 backdrop-blur-md",
        "[translate:calc(var(--par-x,0)*var(--depth))_calc(var(--par-y,0)*var(--depth))]",
        "motion-reduce:animate-none motion-reduce:[translate:none]",
        className,
      )}
    >
      {children}
    </div>
  );
}
