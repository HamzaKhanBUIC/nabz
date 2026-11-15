/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Hosted single-container build only: forward /api to the backend on the same machine.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    return target
      ? [{ source: "/api/:path*", destination: `${target}/api/:path*` }]
      : [];
  },
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
