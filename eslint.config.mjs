import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated types:
    "src/types/database.types.ts",
    // Service worker output from next-pwa (next build --webpack):
    "public/sw.js",
    "public/workbox-*.js",
    "public/fallback-*.js",
  ]),
]);

export default eslintConfig;
