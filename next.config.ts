import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        // A stale service worker would keep serving old pages; always fetch the current one.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
      {
        // Module workers are refused without a JavaScript MIME type, and .mjs gets none by default.
        source: "/vendor/:file*.mjs",
        headers: [{ key: "Content-Type", value: "text/javascript; charset=utf-8" }],
      },
    ];
  },
};

export default nextConfig;
