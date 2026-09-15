// frontend/next.config.ts
import type { NextConfig } from "next";

function getBackendUrl(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (url && url.trim().length > 0) {
    return url.trim().replace(/\/$/, "");
  }
  return "http://localhost:8000";
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: [
    "192.168.1.2",
    "192.168.1.56",
    "localhost",
    "127.0.0.1",
  ],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${getBackendUrl()}/api/v1/:path*`,
      },
    ];
  },
};
export default nextConfig;