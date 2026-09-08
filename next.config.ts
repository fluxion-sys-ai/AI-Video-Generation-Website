import type { NextConfig } from "next";

// Static export for GitHub Pages. Served under /AI-Video-Generation-Website/ in prod.
const isProd = process.env.NODE_ENV === "production";
const repo = "AI-Video-Generation-Website";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
};

export default nextConfig;
