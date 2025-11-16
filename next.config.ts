import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
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

export default nextConfig;
