/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Hosted builds: when API_PROXY_TARGET is set, the browser calls /api on this site (same origin)
  // and Next forwards it to the backend (same container, or the API on Render).
  env: process.env.API_PROXY_TARGET ? { NEXT_PUBLIC_API_URL: "" } : {},
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
