/**
 * Middleware — runs at request time on Vercel (middlewareMode: "edge") and in
 * `astro dev`, for every request including on-demand pages, static assets,
 * and unmatched paths.
 *
 * Responsibilities:
 * 1. Content negotiation: `Accept: text/markdown` on known pages returns the
 *    generated markdown variant (/md/*.md) with `Vary: Accept` so CDNs cache
 *    HTML and markdown variants separately (acceptmarkdown.com compliance).
 * 2. `Vary: Accept` on every response (agents must never get a cached HTML
 *    variant when asking for markdown, or vice versa).
 * 3. Agent-friendly 404s: a nonexistent path that prefers markdown receives a
 *    short markdown body with recovery links (sitemap, llms.txt, key pages).
 *
 * Edge-safe by design: no Node APIs, no project data imports (variants are
 * fetched as static files), so the edge bundle stays tiny.
 */
import { defineMiddleware } from "astro:middleware";
import {
  appendVary,
  MARKDOWN_CACHE_CONTROL,
  markdown404Body,
  normalizePath,
  prefersMarkdown,
} from "./lib/negotiate";
import { mdVariantForPath } from "./lib/markdown/pages";

/** Only these page paths have markdown variants; everything else passes through. */
const NEGOTIATED_PATHS = ["", "about", "contact", "privacy", "work"] as const;

/** CDN caching for on-demand HTML pages (Vercel edge cache, keyed by Vary). */
const HTML_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400";

function isNegotiatedPath(normalized: string): boolean {
  return (NEGOTIATED_PATHS as readonly string[]).includes(normalized);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request } = context;
  const url = new URL(request.url);
  const normalized = normalizePath(url.pathname);
  const acceptsMarkdown = prefersMarkdown(request.headers.get("accept"));
  const isHead = request.method === "HEAD";
  const isGet = request.method === "GET";

  // MCP endpoint: Streamable HTTP is POST-only. Enforce 405 here, in the
  // edge middleware, so Vercel's router can never fall through to a
  // different page for GET/HEAD (observed on the preview deployment: a
  // plain `Accept: */*` GET /mcp was served the homepage HTML).
  if ((isGet || isHead) && normalized === "mcp") {
    return new Response("Method Not Allowed: use POST", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  // Serve the markdown variant directly for negotiated pages.
  if ((isGet || isHead) && acceptsMarkdown && isNegotiatedPath(normalized)) {
    const variant = mdVariantForPath(normalized);
    if (variant) {
      let mdResponse: Response | null = null;
      try {
        mdResponse = await fetch(new URL(`/md/${variant}.md`, url));
      } catch {
        // Fall through to the normal pipeline on fetch failure.
      }
      if (mdResponse && mdResponse.ok) {
        const headers = new Headers({
          "Content-Type": "text/markdown; charset=utf-8",
          Vary: "Accept, Accept-Encoding",
          "Cache-Control": MARKDOWN_CACHE_CONTROL,
        });
        return new Response(isHead ? null : await mdResponse.text(), {
          status: 200,
          headers,
        });
      }
    }
  }

  const response = await next();
  appendVary(response.headers);

  // On-demand HTML pages are edge-cached per negotiated variant.
  if (isGet && response.status === 200 && isNegotiatedPath(normalized)) {
    response.headers.set("Cache-Control", HTML_CACHE_CONTROL);
  }

  // Agent-friendly 404: keep the real 404 status, swap the body for markdown
  // with recovery links when the client asked for markdown.
  if (isGet && acceptsMarkdown && response.status === 404) {
    return new Response(markdown404Body(url.pathname), {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept, Accept-Encoding",
      },
    });
  }

  return response;
});
