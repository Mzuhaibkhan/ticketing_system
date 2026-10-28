import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
  async rewrites() {
    const rawBackend =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";
    let target = rawBackend.trim().replace(/\/+$/, "");
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = `http://${target}`;
    }
    const backendRoot = target.endsWith("/api") ? target.slice(0, -4) : target;
    return [
      {
        source: "/api/:path*",
        destination: `${backendRoot}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
