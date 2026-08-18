import Link from "next/link";
import { Github, Heart, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-card/50 text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-border/50">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="inline-flex items-center text-xl font-bold tracking-tight text-foreground hover:opacity-90 transition-opacity">
              <span className="text-primary font-black tracking-tighter">Open</span>
              <span className="text-foreground font-bold">EdPuzzle</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Open-source interactive video learning platform with cryptographic heartbeat verification and anti-cheat analytics.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground font-mono">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Released under MIT License</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Product & Docs
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#architecture" className="hover:text-foreground transition-colors">
                  Anti-Cheat Architecture
                </Link>
              </li>
              <li>
                <Link href="/app" className="hover:text-foreground transition-colors font-medium text-primary">
                  Launch Web App →
                </Link>
              </li>
            </ul>
          </div>

          {/* Open Source / Community Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Open Source
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://github.com/alf-2006/OpenEdPuzzle"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Github className="w-3.5 h-3.5" />
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/alf-2006/OpenEdPuzzle/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Issues & Bug Reports
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/alf-2006/OpenEdPuzzle/blob/main/SECURITY_ANALYSIS.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Security Analysis
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/alf-2006/OpenEdPuzzle/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  MIT License
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} OpenEdPuzzle (WaslaLearn). Free & Open Source Software.</p>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span>صُنع بواسطة</span>
            <a
              href="https://github.com/alf-2006"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              alf
            </a>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline ml-0.5" />
          </div>
        </div>
      </div>
    </footer>
  );
}
