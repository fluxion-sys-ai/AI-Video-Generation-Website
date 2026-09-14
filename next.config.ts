import type { NextConfig } from "next";

// Build modes:
//   npm run build                  static export in ./out, served from the domain root
//                                  behind the backend's front door (api-gateway/Caddyfile).
//   GITHUB_PAGES=1 npm run build   static export under /AI-Video-Generation-Website/ for the
//                                  frontend-only demo on GitHub Pages.
//   NEXT_PUBLIC_BACKEND=1 npm run dev
//                                  no static export; /api, /v1, /catalog, /media, /billing and
//                                  /events are proxied to FLUXION_BACKEND_URL (default
//                                  http://localhost:8088) so the browser sees one origin, as in
//                                  production. Next does not allow rewrites with `output: export`.
const repo = "AI-Video-Generation-Website";
const isDev = process.env.NODE_ENV !== "production";
const basePath = !isDev && process.env.GITHUB_PAGES === "1" ? `/${repo}` : "";
const proxyToBackend = isDev && process.env.NEXT_PUBLIC_BACKEND === "1";
const backend = (process.env.FLUXION_BACKEND_URL || "http://localhost:8088").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // Hide the floating Next.js dev indicator (it covered the theme switcher).
  devIndicators: false,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
  ...(proxyToBackend
    ? {
        // Backend routes have no trailing slash; Next's slash redirect would break POSTs.
        trailingSlash: false,
        async rewrites() {
          return ["api", "v1", "catalog", "media", "billing", "events"].map((prefix) => ({
            source: `/${prefix}/:path*`,
            destination: `${backend}/${prefix}/:path*`,
          }));
        },
      }
    : { output: "export" as const, trailingSlash: true }),
};

export default nextConfig;
