"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MagneticWrapper } from "@/components/ui/magnetic-wrapper";
import { SlideTabs } from "@/components/ui/slide-tabs";
import { SparkleGithubButton } from "@/components/ui/sparkle-github-button";
import { ThemeMorphButton } from "@/components/ui/theme-morph-button";
import { LaunchAppButton } from "@/components/ui/launch-app-button";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-background/90 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center text-xl font-bold tracking-tight hover:opacity-90 transition-opacity select-none group"
          >
            <span className="text-primary font-black tracking-tighter group-hover:scale-105 transition-transform">Open</span>
            <span className="text-foreground font-bold">EdPuzzle</span>
          </Link>

          {/* Slide Tabs Nav */}
          <SlideTabs />

          {/* Right Actions */}
          <div className="flex items-center gap-2">

            {/* Theme Toggle */}
            {mounted && <ThemeMorphButton />}
            <div className="hidden sm:block">
              <SparkleGithubButton />
            </div>

            {/* Start The Journey / Launch App */}
            <div className="hidden sm:block">
              <LaunchAppButton />
            </div>

            {/* Hamburger — transitions.dev icon-swap (09-icon-swap) */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-muted/80 transition-colors"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              <div className="relative w-5 h-5">
                <AnimatePresence mode="popLayout" initial={false}>
                  {isOpen ? (
                    <motion.span
                      key="close"
                      initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Menu className="w-5 h-5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Menu — transitions.dev menu-dropdown (05-menu-dropdown)
          open: scale from 0.97 + fade + blur, ease(0.22,1,0.36,1) 250ms
          close: scale to 0.99 + fade, 150ms                              */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.99, y: -4, filter: "blur(2px)" }}
            transition={{
              duration: 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl origin-top"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              {[
                { name: "Features", href: "#features" },
                { name: "How It Works", href: "#how-it-works" },
                { name: "Architecture", href: "#architecture" },
                { name: "Docs", href: "https://github.com/alf-2006/OpenEdPuzzle#readme" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-3 flex flex-col gap-2">
                <SparkleGithubButton />
                <LaunchAppButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
