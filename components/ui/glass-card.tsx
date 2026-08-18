import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "subtle";
  blur?: "light" | "medium" | "heavy";
  glow?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", blur = "medium", glow = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border transition-all duration-300",
          // Base glassmorphism styles
          "bg-white/5 dark:bg-slate-950/60",
          "border-white/10 dark:border-white/8",
          "shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
          // Backdrop blur variants
          blur === "light" && "backdrop-blur-sm",
          blur === "medium" && "backdrop-blur-md",
          blur === "heavy" && "backdrop-blur-xl",
          // Card variants
          variant === "elevated" && "bg-white/7 dark:bg-slate-950/70",
          variant === "subtle" && "bg-white/3 dark:bg-slate-950/40",
          // Glow effect
          glow && "hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]",
          className
        )}
        {...props}
      />
    );
  }
);

GlassCard.displayName = "GlassCard";

const GlassCardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
GlassCardHeader.displayName = "GlassCardHeader";

const GlassCardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
);
GlassCardTitle.displayName = "GlassCardTitle";

const GlassCardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
GlassCardDescription.displayName = "GlassCardDescription";

const GlassCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
GlassCardContent.displayName = "GlassCardContent";

const GlassCardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
GlassCardFooter.displayName = "GlassCardFooter";

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
};
