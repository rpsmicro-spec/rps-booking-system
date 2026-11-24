import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

/**
 * next/image pattern for the Supabase instance this build talks to, read
 * from NEXT_PUBLIC_SUPABASE_URL at config time (local stacks run on
 * different ports, e.g. 54321 or 54421). Hosted *.supabase.co projects are
 * covered by the static https patterns below.
 */
function supabaseStoragePattern(): RemotePattern[] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    if (url.hostname.endsWith(".supabase.co")) return [];
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: "/storage/v1/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  images: {
    remotePatterns: [
      ...supabaseStoragePattern(),
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
