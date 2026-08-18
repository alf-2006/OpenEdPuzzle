import { LandingNavbar } from "@/components/landing/landing-navbar";
import { HeroSection } from "@/components/sections/hero-section-new";
import { ShowcaseSections } from "@/components/sections/showcase-sections";
import { HowItWorksSection } from "@/components/sections/how-it-works-section-new";
import { ArchitectureSection } from "@/components/sections/architecture-section";
import { CTASection } from "@/components/sections/cta-section-new";
import { Footer } from "./sections/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <ShowcaseSections />
        <HowItWorksSection />
        <ArchitectureSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
