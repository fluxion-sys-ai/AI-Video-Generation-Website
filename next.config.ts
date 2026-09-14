import type { NextConfig } from "next";

// Build modes:
//   npm run build                  static export in ./out, served from the domain
//                                  root behind the same origin as the model hub
//                                  (see fluxion-backend/Caddyfile).
//   GITHUB_PAGES=1 npm run build   static export under /AI-Video-Generation-Website/
//                                  for the frontend-only demo on GitHub Pages.
//   NEXT_PUBLIC_BACKEND=1 npm run dev
//                                  no static export; /api, /v1, /media, /billing and
//                                  /events are proxied to the backend front door
//                                  (FLUXION_HUB_URL, default http://localhost:8088) so the
//                                  browser sees one origin, as in production.
// Next does not allow rewrites together with `output: "export"`, hence the split.
const repo = "AI-Video-Generation-Website";
const isDev = process.env.NODE_ENV !== "production";
const basePath = !isDev && process.env.GITHUB_PAGES === "1" ? `/${repo}` : "";
const proxyToHub = isDev && process.env.NEXT_PUBLIC_BACKEND === "1";
const hub = (process.env.FLUXION_HUB_URL || "http://localhost:8088").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
  ...(proxyToHub
    ? {
        // Hub routes have no trailing slash; Next's slash redirect would break POSTs.
        trailingSlash: false,
        async rewrites() {
          return ["api", "v1", "media", "billing", "events"].map((prefix) => ({
            source: `/${prefix}/:path*`,
            destination: `${hub}/${prefix}/:path*`,
          }));
        },
      }
    : { output: "export" as const, trailingSlash: true }),
};

export default nextConfig;
