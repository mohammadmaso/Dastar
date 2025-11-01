import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  turbopack: {},
  // GitHub Pages deployment requires basePath if not using custom domain
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  // Asset prefix for GitHub Pages
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || "",
  // Enable image optimization (required for production)
  images: {
    unoptimized: true, // Required for static export if using `output: 'export'`
  },
  // Enable static export for GitHub Pages
  output: 'export',
  // Disable server-side features for static export
  trailingSlash: true,
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig);
