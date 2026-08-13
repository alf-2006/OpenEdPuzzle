import Link from "next/link";
import { GraduationCap } from "lucide-react";

/**
 * Footer — pure server component. Zero JS, zero animations; dark mode comes
 * free from the token system.
 */
export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="container flex flex-col items-center gap-8 py-12 sm:flex-row sm:justify-between">
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <GraduationCap className="h-5 w-5 text-primary" />
            WaslaLearn
          </Link>
          <p className="text-sm text-muted-foreground">
            Learning you can prove.
          </p>
        </div>

        {/* Links */}
        <nav aria-label="Footer" className="flex items-center gap-6 text-sm">
          <Link
            href="/#features"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <span
            aria-disabled
            className="cursor-not-allowed text-muted-foreground/50"
            title="Coming soon"
          >
            Pricing
          </span>
          <span
            aria-disabled
            className="cursor-not-allowed text-muted-foreground/50"
            title="Coming soon"
          >
            Docs
          </span>
        </nav>

        {/* Social placeholders */}
        <div className="flex items-center gap-4">
          <span
            aria-label="GitHub (coming soon)"
            title="Coming soon"
            className="cursor-not-allowed text-muted-foreground/50"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
          </span>
          <span
            aria-label="Twitter (coming soon)"
            title="Coming soon"
            className="cursor-not-allowed text-muted-foreground/50"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
            </svg>
          </span>
        </div>
      </div>

      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Wasla Tech. All rights reserved.
      </div>
    </footer>
  );
}
