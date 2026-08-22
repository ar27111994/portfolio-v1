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
  // every page with real request headers. With output "server" the Astro
  // middleware runs INSIDE the Vercel server function (no edge split), so
  // Astro's own router dispatches pages correctly and the middleware still
  // sees the true Accept header. The edge-middleware split
  // (middlewareMode: "edge") was abandoned because Vercel's router served a
  // single fixed page for every path after middleware next() (verified on
  // live preview deployments).
  output: "server",
  adapter: vercel(),
  vite: {
    build: {
      cssMinify: "esbuild",
    },
  },
});
