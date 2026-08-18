"use client";

import React, { useRef, useEffect } from "react";

interface CursorSpotlightProps {
  children: React.ReactNode;
  className?: string;
  size?: number;
  opacity?: number;
}

export function CursorSpotlight({
  children,
  className = "",
  size = 650,
  opacity = 0.07,
}: CursorSpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;
    const onMouseMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        container.style.setProperty("--mouse-x", `${x}px`);
        container.style.setProperty("--mouse-y", `${y}px`);
      });
    };

    container.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        // @ts-ignore
        "--mouse-x": "50%",
        "--mouse-y": "50%",
      }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(${size}px circle at var(--mouse-x) var(--mouse-y), rgba(37, 99, 235, ${opacity}), transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
