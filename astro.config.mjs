// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://www.ar27111994.dev",
  integrations: [sitemap()],
  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.upwork.com",
      },
    ],
  },
});
