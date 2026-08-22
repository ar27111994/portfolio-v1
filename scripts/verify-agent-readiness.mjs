#!/usr/bin/env node
/**
 * Agent-readiness verification matrix.
 *
 * Usage: node scripts/verify-agent-readiness.mjs [BASE_URL]
 * (default: http://localhost:4321 — run against `npm run dev` or a deployed URL)
 *
 * Mirrors the "Is Agentic" audit checks and prints a pass/fail report.
 */
const BASE = process.argv[2] ?? "http://localhost:4321";

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`,
  );
}

async function main() {
  const get = async (path, headers = {}) => {
    const res = await fetch(`${BASE}${path}`, { headers });
    return {
      status: res.status,
      contentType: res.headers.get("content-type") ?? "",
      vary: (res.headers.get("vary") ?? "").toLowerCase(),
      cacheControl: res.headers.get("cache-control") ?? "",
      text: await res.text(),
    };
  };
  const post = async (path, body, headers = {}) => {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    return { status: res.status, json: await res.json().catch(() => null) };
  };

  // 1. Real 404 + markdown body
  const notFound = await get("/path-that-does-not-exist-xyz", {
    Accept: "text/markdown",
  });
  check(
    "1.1 nonexistent path returns HTTP 404",
    notFound.status === 404,
    `status=${notFound.status}`,
  );
  check(
    "1.2 404 body is markdown with recovery links",
    notFound.status === 404 &&
      notFound.contentType.includes("text/markdown") &&
      notFound.text.includes("# 404") &&
      notFound.text.includes("/llms.txt"),
    `content-type=${notFound.contentType}`,
  );

  // 2. Markdown content negotiation on the homepage
  const mdHome = await get("/", { Accept: "text/markdown" });
  check(
    "2.1 / with Accept: text/markdown returns text/markdown",
    mdHome.status === 200 && mdHome.contentType.includes("text/markdown"),
    `content-type=${mdHome.contentType}`,
  );
  check(
    "2.2 markdown response has Vary with Accept",
    mdHome.vary.includes("accept"),
    `vary=${mdHome.vary}`,
  );
  check(
    "2.3 markdown response is CDN-cacheable",
    // Vercel's edge middleware serves responses with `public` (shared-cache
    // eligible) and strips a more specific s-maxage; the Vary guard above is
    // what keeps variants from mixing in any shared cache. Static /md/*
    // files get s-maxage directly from vercel.json headers.
    mdHome.cacheControl.includes("s-maxage") ||
      mdHome.cacheControl.includes("public"),
    `cache-control=${mdHome.cacheControl}`,
  );

  const htmlHome = await get("/");
  check(
    "2.4 browser request still gets text/html",
    htmlHome.status === 200 && htmlHome.contentType.includes("text/html"),
    `content-type=${htmlHome.contentType}`,
  );
  check(
    "2.5 HTML response also has Vary: Accept",
    htmlHome.vary.includes("accept"),
    `vary=${htmlHome.vary}`,
  );

  // 3. Markdown variants for every negotiated path
  for (const path of ["/about", "/contact", "/privacy", "/work"]) {
    const md = await get(path, { Accept: "text/markdown" });
    check(
      `3.x ${path} negotiates markdown`,
      md.status === 200 && md.contentType.includes("text/markdown"),
      `content-type=${md.contentType}`,
    );
  }
  for (const path of ["/md/home.md", "/md/about.md", "/md/work.md"]) {
    const md = await get(path);
    check(
      `3.x ${path} serves directly`,
      md.status === 200 && md.contentType.includes("text/markdown"),
      `content-type=${md.contentType}`,
    );
  }

  // 5. llms.txt with when-to-use guidance
  const llms = await get("/llms.txt");
  check(
    "5.1 llms.txt exists",
    llms.status === 200,
    `content-type=${llms.contentType}`,
  );
  check(
    "5.2 llms.txt has when-to-use and developer resources",
    llms.text.includes("## When to use this site") &&
      llms.text.includes("## Developer resources"),
  );
  const full = await get("/llms-full.txt");
  check("5.3 llms-full.txt exists", full.status === 200);

  // 6. Token budget (extracted text of the homepage HTML)
  {
    const html = await (await fetch(`${BASE}/`)).text();
    const extracted = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<dialog[\s\S]*?<\/dialog>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
    const tokens = Math.ceil(extracted.length / 4);
    check(
      "6.1 homepage extracted text under 25K tokens",
      tokens < 25_000,
      `~${tokens} tokens (${extracted.length} chars)`,
    );
    const workHtml = await (await fetch(`${BASE}/work`)).text();
    const workExtracted = workHtml
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      // <template> content is inert until cloned (lazy modal dossiers) — it
      // never enters parseable text, matching DOM textContent extraction.
      .replace(/<template[\s\S]*?<\/template>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
    check(
      "6.2 /work stays focused (under 25K tokens)",
      Math.ceil(workExtracted.length / 4) < 25_000,
      `~${Math.ceil(workExtracted.length / 4)} tokens`,
    );
  }

  // 7. JSON-LD identity
  {
    const html = await (await fetch(`${BASE}/`)).text();
    const ld = [
      ...html.matchAll(
        /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
      ),
    ]
      .map((m) => m[1])
      .map((raw) => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    let person = false;
    let website = false;
    for (const block of ld) {
      for (const item of block["@graph"] ?? []) {
        if (item["@type"] === "Person") {
          person = Boolean(item.name && item.description);
        }
        if (item["@type"] === "WebSite") {
          website = Boolean(item.name && item.description);
        }
      }
    }
    check("7.1 JSON-LD Person has name+description", person);
    check("7.2 JSON-LD WebSite has name+description", website);
  }

  // 8. Trust anchor pages
  for (const path of ["/about", "/contact", "/privacy", "/work"]) {
    const res = await fetch(`${BASE}${path}`);
    const text = await res.text();
    const main = text
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    check(
      `8.x ${path} has substantive content`,
      res.status === 200 && main.length >= 500,
      `${main.length} chars`,
    );
  }

  // 9. MCP discovery + handshake
  {
    const manifest = await get("/.well-known/mcp");
    check(
      "9.1 /.well-known/mcp manifest",
      manifest.status === 200 &&
        manifest.contentType.includes("application/json") &&
        JSON.parse(manifest.text).endpoints?.streamable_http,
    );
    const card = await get("/.well-known/mcp/server-card.json");
    check(
      "9.2 server-card.json",
      card.status === 200 &&
        JSON.parse(card.text).serverInfo?.name === "ar27111994.dev",
    );

    const init = await post(
      "/mcp",
      {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "verify", version: "1" },
        },
      },
      {
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-06-18",
      },
    );
    check(
      "9.3 MCP initialize handshake",
      init.status === 200 &&
        init.json?.result?.protocolVersion === "2025-06-18",
      init.status === 200
        ? `version=${init.json?.result?.protocolVersion}`
        : `status=${init.status}`,
    );
    const tools = await post("/mcp", {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    });
    check(
      "9.4 MCP tools/list",
      tools.status === 200 && (tools.json?.result?.tools?.length ?? 0) >= 5,
      `${tools.json?.result?.tools?.length ?? 0} tools`,
    );
    const call = await post("/mcp", {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "get_contact_info", arguments: {} },
    });
    check(
      "9.5 MCP tools/call returns contact data",
      call.status === 200 &&
        call.json?.result?.content?.[0]?.text?.includes("admin@ar27111994.dev"),
    );
    const getRes = await fetch(`${BASE}/mcp`, { method: "GET" });
    check(
      "9.6 GET /mcp is 405 (no SSE offered)",
      getRes.status === 405,
      `status=${getRes.status}`,
    );
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("Verification crashed:", err.message);
  process.exit(1);
});
