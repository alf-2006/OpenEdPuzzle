import { Hero } from "./sections/hero";
import { Features } from "./sections/features";
import { HowItWorks } from "./sections/how-it-works";
import { Stats } from "./sections/stats";
import { Testimonials } from "./sections/testimonials";
import { CTA } from "./sections/cta";
import { Footer } from "./sections/footer";

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  );
}
