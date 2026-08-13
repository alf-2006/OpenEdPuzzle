import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },      // YouTube thumbnails
      { protocol: "https", hostname: "img.youtube.com" },  // YouTube thumbnails (alt)
    ],
  },
  // GSAP + Lenis are imported ONLY by landing-page components via next/dynamic
  // (ssr: false), so they never enter the /app bundle.
};

export default nextConfig;
