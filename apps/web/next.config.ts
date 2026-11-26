import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Workspace packages ship TypeScript source; Next compiles them with the app.
  transpilePackages: ["@pmaa/core"],
  // Keep the server-only logger out of the bundle.
  serverExternalPackages: ["pino"],
  turbopack: {
    rules: {
      // Preserve Next.js CSS Module exports for component styles.
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
