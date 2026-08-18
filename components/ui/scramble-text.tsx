"use client";

import { useEffect, useState, useRef } from "react";

const GLYPHS = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

interface ScrambleTextProps {
  text: string;
  className?: string;
  duration?: number;
  delay?: number;
}

export function ScrambleText({
  text,
  className = "",
  duration = 800,
  delay = 100,
}: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const isMounted = useRef(false);

  useEffect(() => {
    // Respect reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayText(text);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let animationFrameId: number;
    const startTime = performance.now() + delay;
    const totalDuration = duration;

    timeoutId = setTimeout(() => {
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, Math.max(0, elapsed / totalDuration));

        // How many characters should be revealed so far
        const revealedCount = Math.floor(progress * text.length);

        let result = "";
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === " " || char === "\n") {
            result += char;
          } else if (i < revealedCount) {
            result += char;
          } else {
            result += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }

        setDisplayText(result);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setDisplayText(text);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(animationFrameId);
    };
  }, [text, duration, delay]);

  return <span className={className}>{displayText}</span>;
}
