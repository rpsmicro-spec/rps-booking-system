import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/**",
      },
      {
        protocol: "https",
        hostname: "vkboymfxqspiffwaivxj.supabase.co",
        pathname: "/storage/v1/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/**",
      },
    ],
  },
  // Webpack config (for --webpack flag)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false, // Disable Node.js canvas module (not needed in browser)
    };
    return config;
  },
  // Turbopack config - empty object to silence the warning
  // Canvas module is handled differently in Turbopack and may not need explicit exclusion
  turbopack: {},
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development", // Disable in dev to avoid caching issues
  // Exclude API routes from caching
  publicExcludes: ["!noprecache/**/*"],
});

export default pwaConfig(nextConfig);
