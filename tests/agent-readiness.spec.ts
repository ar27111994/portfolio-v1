/**
 * Agent-readiness suite — mirrors the "Is Agentic" audit checks:
 * 1. real 404s with a markdown recovery body
 * 2. markdown content negotiation (acceptmarkdown.com) with Vary: Accept
 * 3. developer-resource discoverability (llms.txt, MCP, pages)
 * 5. when-to-use guidance (llms.txt)
 * 7. JSON-LD identity fields
 * 8. trust anchor pages with substantive content
 * 9. MCP discovery + live Streamable HTTP handshake
 *
 * Runs against the dev server (middleware executes per request there).
 */
import { test, expect } from "@playwright/test";

const BASE = process.env.TEST_URL || "http://localhost:4321";

test.describe("Agent readiness — 404 handling", () => {
  test("nonexistent paths return a real 404 with a markdown recovery body", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/some-path-that-does-not-exist`, {
      headers: { Accept: "text/markdown" },
    });
    expect(res.status()).toBe(404);
    const ct = res.headers()["content-type"] ?? "";
    expect(ct.toLowerCase()).toContain("text/markdown");
    const body = await res.text();
    expect(body).toContain("# 404");
    expect(body).toContain("/llms.txt");
    expect(body).toContain("/sitemap-index.xml");
    expect(body).toContain("/mcp");
  });

  test("nonexistent paths keep 404 for plain browser requests too", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/some-other-path-that-is-missing`);
    expect(res.status()).toBe(404);
  });
});

test.describe("Agent readiness — markdown content negotiation", () => {
  test("homepage serves markdown when Accept: text/markdown", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/`, {
      headers: { Accept: "text/markdown" },
    });
    expect(res.status()).toBe(200);
    const ct = res.headers()["content-type"] ?? "";
    expect(ct.toLowerCase()).toContain("text/markdown");
    const vary = (res.headers()["vary"] ?? "").toLowerCase();
    expect(vary).toContain("accept");
    const body = await res.text();
    expect(body).toMatch(/^# /);
    expect(body).toContain("When to use this site");
  });

  test("sub-pages negotiate markdown too (about, contact, privacy, work)", async ({
    request,
  }) => {
    for (const path of ["/about", "/contact", "/privacy", "/work"]) {
      const res = await request.get(`${BASE}${path}`, {
        headers: { Accept: "text/markdown" },
      });
      expect(res.status(), path).toBe(200);
      const ct = res.headers()["content-type"] ?? "";
      expect(ct.toLowerCase(), path).toContain("text/markdown");
      const vary = (res.headers()["vary"] ?? "").toLowerCase();
      expect(vary, path).toContain("accept");
      const body = await res.text();
      expect(body, path).toMatch(/^# /);
    }
  });

  test("browser requests still get HTML with Vary: Accept", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/`, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    expect(res.status()).toBe(200);
    const ct = res.headers()["content-type"] ?? "";
    expect(ct.toLowerCase()).toContain("text/html");
    const vary = (res.headers()["vary"] ?? "").toLowerCase();
    expect(vary).toContain("accept");
  });
});

test.describe("Agent readiness — llms.txt", () => {
  test("llms.txt exists with when-to-use and developer resources", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/llms.txt`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("## When to use this site");
    expect(body).toContain("## Developer resources");
    expect(body).toContain("/mcp");
    expect(body).toContain("/llms-full.txt");
    expect(body).toContain("agent-harness");
  });

  test("llms-full.txt aggregates page text", async ({ request }) => {
    const res = await request.get(`${BASE}/llms-full.txt`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("# Ahmed Rehan — ARLabs");
    expect(body).toContain("# Contact — Ahmed Rehan");
  });
});

test.describe("Agent readiness — MCP discovery and handshake", () => {
  test("live Streamable HTTP handshake: initialize + tools/list + tools/call", async ({
    request,
  }) => {
    const init = await request.post(`${BASE}/mcp`, {
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-06-18",
      },
      data: {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "agent-readiness-test", version: "1.0.0" },
        },
      },
    });
    expect(init.status()).toBe(200);
    const ct = init.headers()["content-type"] ?? "";
    expect(ct.toLowerCase()).toContain("application/json");
    const initBody = (await init.json()) as {
      result?: {
        protocolVersion?: string;
        capabilities?: { tools?: object };
        serverInfo?: { name?: string };
      };
    };
    expect(initBody.result?.protocolVersion).toBe("2025-06-18");
    expect(initBody.result?.capabilities?.tools).toBeDefined();
    expect(initBody.result?.serverInfo?.name).toBe("ar27111994.dev");

    const list = await request.post(`${BASE}/mcp`, {
      headers: { "Content-Type": "application/json" },
      data: { jsonrpc: "2.0", id: 2, method: "tools/list" },
    });
    expect(list.status()).toBe(200);
    const listBody = (await list.json()) as {
      result?: { tools?: Array<{ name: string }> };
    };
    const names = listBody.result?.tools?.map((t) => t.name) ?? [];
    expect(names).toContain("get_portfolio_overview");
    expect(names).toContain("list_upwork_portfolio");
    expect(names).toContain("get_contact_info");

    const call = await request.post(`${BASE}/mcp`, {
      headers: { "Content-Type": "application/json" },
      data: {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "get_contact_info", arguments: {} },
      },
    });
    expect(call.status()).toBe(200);
    const callBody = (await call.json()) as {
      result?: { content?: Array<{ text: string }>; isError?: boolean };
    };
    expect(callBody.result?.isError).toBeFalsy();
    const text = callBody.result?.content?.[0]?.text ?? "";
    expect(text).toContain("admin@ar27111994.dev");
  });

  test("GET /mcp returns 405 with Allow: POST (no SSE offered)", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/mcp`);
    expect(res.status()).toBe(405);
    expect(res.headers()["allow"] ?? "").toContain("POST");
  });

  test("well-known manifests are valid JSON with a streamable_http endpoint", async ({
    request,
  }) => {
    const manifest = await request.get(`${BASE}/.well-known/mcp`);
    expect(manifest.status()).toBe(200);
    const mcpBody = (await manifest.json()) as {
      endpoints?: { streamable_http?: string };
    };
    expect(mcpBody.endpoints?.streamable_http).toBeTruthy();

    const card = await request.get(`${BASE}/.well-known/mcp/server-card.json`);
    expect(card.status()).toBe(200);
    const cardBody = (await card.json()) as {
      serverInfo?: { name?: string };
      transport?: { type?: string; endpoint?: string };
      tools?: unknown[];
    };
    expect(cardBody.serverInfo?.name).toBe("ar27111994.dev");
    expect(cardBody.transport?.type).toBe("streamable-http");
    expect((cardBody.tools ?? []).length).toBeGreaterThanOrEqual(5);
  });
});

test.describe("Agent readiness — trust anchor pages", () => {
  const pages = [
    { path: "/about", title: /About/ },
    { path: "/contact", title: /Contact/ },
    { path: "/work", title: /Work/ },
    { path: "/privacy", title: /Privacy/ },
  ];
  for (const { path, title } of pages) {
    test(`${path} loads with ${title.source} title and substantive content`, async ({
      page,
    }) => {
      const res = await page.goto(`${BASE}${path}`);
      expect(res?.status()).toBe(200);
      await expect(page).toHaveTitle(title);
      const text = await page.evaluate(
        () => document.querySelector("main")?.textContent?.trim() ?? "",
      );
      expect(text.length).toBeGreaterThanOrEqual(500);
    });
  }

  test("/work modal dossier hydrates on open (lazy templates)", async ({
    page,
  }) => {
    await page.goto(`${BASE}/work`);
    const openButton = page.locator("[data-upwork-open]").first();
    await expect(openButton).toBeVisible();
    await openButton.click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog.locator(".upwork-modal-shell")).toBeVisible();
    const body = (await dialog.textContent()) ?? "";
    expect(body.length).toBeGreaterThan(100);
  });
});

test.describe("Agent readiness — structured identity", () => {
  test("JSON-LD Person/WebSite carry name and description", async ({
    page,
  }) => {
    await page.goto(`${BASE}/`);
    const blocks = page.locator('script[type="application/ld+json"]');
    const count = await blocks.count();
    let foundPerson = false;
    let foundWebSite = false;
    for (let i = 0; i < count; i++) {
      const raw = await blocks.nth(i).textContent();
      if (!raw) continue;
      const data = JSON.parse(raw) as {
        "@graph"?: Array<{
          "@type": string;
          name?: string;
          description?: string;
        }>;
      };
      for (const item of data["@graph"] ?? []) {
        if (item["@type"] === "Person") {
          expect(item.name).toBeTruthy();
          expect(item.description).toBeTruthy();
          foundPerson = true;
        }
        if (item["@type"] === "WebSite") {
          expect(item.name).toBeTruthy();
          expect(item.description).toBeTruthy();
          foundWebSite = true;
        }
      }
    }
    expect(foundPerson).toBe(true);
    expect(foundWebSite).toBe(true);
  });

  test("homepage stays inside the agent token budget (extracted text)", async ({
    page,
  }) => {
    await page.goto(`${BASE}/`);
    const text = await page.evaluate(() => {
      const clone = document.body.cloneNode(true) as HTMLElement;
      clone
        .querySelectorAll("script, style, dialog")
        .forEach((el) => el.remove());
      return (clone.textContent ?? "").replace(/\s+/g, " ").trim();
    });
    // ~25K tokens = ~100K chars of extracted text (dividing by 4)
    expect(Math.ceil(text.length / 4)).toBeLessThan(25_000);
  });
});
