import { SmoothScroll } from "@/components/landing/smooth-scroll";

export default function LandingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // No sidebar/navbar — pure marketing surface, plus Lenis smooth scroll
  // (landing only; the /app group never loads it).
  return (
    <>
      <SmoothScroll />
      {children}
    </>
  );
}
