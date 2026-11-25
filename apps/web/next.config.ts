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
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
