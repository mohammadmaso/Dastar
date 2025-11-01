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
    unoptimized: true,
  },
  // Note: Removed 'output: export' because this is a fully client-side app
  // that uses IndexedDB and dynamic routes. For deployment, use a platform
  // that supports client-side routing (Vercel, Netlify, etc.)
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
