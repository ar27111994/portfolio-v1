// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  site: "https://www.ar27111994.dev",
  integrations: [
    sitemap({
      filter: (page) =>
        // Machine-generated pages: markdown variants, MCP endpoint, and the
        // concatenated llms-full.txt are not indexable content pages.
        !page.includes("/md/") &&
        !page.includes("/llms-full.txt") &&
        !page.includes("/mcp"),
    }),
  ],
  prefetch: {
    defaultStrategy: "hover",
    prefetchAll: true,
  },
  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.upwork.com",
      },
    ],
  },
  // Markdown content negotiation + Vary: Accept must run at request time for
  // prerendered pages too. The Vercel adapter's edge middleware runs for all
  // requests (static assets, prerendered pages, and on-demand routes), which
  // is what makes /lib/negotiate work on the static homepage.
  adapter: vercel({
    middlewareMode: "edge",
  }),
  vite: {
    build: {
      cssMinify: "esbuild",
    },
  },
});
