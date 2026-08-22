/**
 * RFC 9110 media-type negotiation utilities for serving markdown to AI agents.
 *
 * Edge-safe (no Node APIs): usable from Astro edge middleware and unit tests.
 *
 * Algorithm follows RFC 9110 §12.5.1 ("Content Negotiation"):
 * - most specific media range wins for a given candidate (specificity overrides q)
 * - q=0 is an explicit rejection, even against a wildcard
 * - across candidates: highest q wins; ties break by client order
 */

export const MARKDOWN_MEDIA_TYPE = "text/markdown";
export const HTML_MEDIA_TYPE = "text/html";

export type AcceptEntry = {
  type: string;
  q: number;
  specificity: 0 | 1 | 2;
};

export function parseAccept(header: string | null): AcceptEntry[] {
  if (!header) return [];
  return header
    .split(",")
    .map((raw) => {
      const parts = raw
        .trim()
        .split(";")
        .map((s) => s.trim());
      const type = parts[0].toLowerCase();
      if (!type) return null;
      let q = 1;
      for (const param of parts.slice(1)) {
        const [name, value] = param.split("=").map((s) => s.trim());
        if (name === "q") {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) q = Math.max(0, Math.min(1, parsed));
        }
      }
      const specificity: 0 | 1 | 2 =
        type === "*/*" ? 0 : type.endsWith("/*") ? 1 : 2;
      return { type, q, specificity };
    })
    .filter((entry): entry is AcceptEntry => entry !== null);
}

function matches(entry: AcceptEntry, candidate: string): boolean {
  if (entry.type === "*/*") return true;
  if (entry.type.endsWith("/*"))
    return candidate.startsWith(entry.type.slice(0, -1));
  return entry.type === candidate;
}

/**
 * Pick the best candidate from `produces` for the given Accept header.
 * Returns `null` when nothing is acceptable. When `header` is absent, the
 * first produce candidate is returned (browsers and plain curl get HTML).
 */
export function preferredType(
  header: string | null,
  produces: readonly string[],
): string | null {
  if (!header) return produces[0] ?? null;
  const entries = parseAccept(header);
  if (entries.length === 0) return produces[0] ?? null;

  let best: string | null = null;
  let bestQ = -1;
  let bestPosition = Infinity;

  for (const candidate of produces) {
    let matched: AcceptEntry | null = null;
    let matchedPosition = Infinity;
    for (let idx = 0; idx < entries.length; idx++) {
      const entry = entries[idx];
      if (!matches(entry, candidate)) continue;
      if (
        matched === null ||
        entry.specificity > matched.specificity ||
        (entry.specificity === matched.specificity && idx < matchedPosition)
      ) {
        matched = entry;
        matchedPosition = idx;
      }
    }
    if (matched === null) continue;
    if (matched.q <= 0) continue; // explicit rejection

    if (
      matched.q > bestQ ||
      (matched.q === bestQ && matchedPosition < bestPosition)
    ) {
      bestQ = matched.q;
      bestPosition = matchedPosition;
      best = candidate;
    }
  }

  return best;
}

/** True when an agent explicitly prefers the markdown representation. */
export function prefersMarkdown(acceptHeader: string | null): boolean {
  return (
    preferredType(acceptHeader, [HTML_MEDIA_TYPE, MARKDOWN_MEDIA_TYPE]) ===
    MARKDOWN_MEDIA_TYPE
  );
}

/**
 * Append `Accept` to a response's Vary header so CDNs cache HTML and markdown
 * variants separately (acceptmarkdown.com requirement for negotiation).
 */
export function appendVary(headers: Headers, value: string = "Accept"): void {
  const existing = headers.get("Vary");
  if (!existing) {
    headers.set("Vary", value);
    return;
  }
  const tokens = existing.split(",").map((s) => s.trim().toLowerCase());
  if (!tokens.includes(value.toLowerCase())) {
    headers.set("Vary", `${existing}, ${value}`);
  }
}

/** Normalize a request path: strip leading/trailing slashes, "/" -> "". */
export function normalizePath(pathname: string): string {
  return pathname.replace(/^\/+|\/+$/g, "");
}

/** Cache-Control for negotiated markdown variants (CDN-cached per Accept). */
export const MARKDOWN_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400";

/**
 * Short markdown body for 404 responses so agents can recover (site map links,
 * where to look next). RFC-style: real 404 status, machine-readable body.
 */
export function markdown404Body(requestPath: string): string {
  return [
    `# 404 — Not found`,
    "",
    `The path \`${requestPath || "/"}\` does not exist on ar27111994.dev.`,
    "",
    "## Where to look next",
    "",
    "- Home: https://www.ar27111994.dev/",
    "- About: https://www.ar27111994.dev/about",
    "- Work / Upwork portfolio: https://www.ar27111994.dev/work",
    "- Contact: https://www.ar27111994.dev/contact",
    "- Privacy: https://www.ar27111994.dev/privacy",
    "- Machine-readable index: https://www.ar27111994.dev/llms.txt",
    "- Sitemap: https://www.ar27111994.dev/sitemap-index.xml",
    "- MCP endpoint: https://www.ar27111994.dev/mcp",
    "",
  ].join("\n");
}
