import { test, expect } from "@playwright/test";

const BASE = process.env.TEST_URL || "http://localhost:4321";

test.describe("SEO fundamentals", () => {
  test("has title and meta description", async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/Ahmed Rehan/);
    const desc = page.locator('meta[name="description"]');
    await expect(desc).toHaveAttribute("content", /.+/);
  });

  test("has Open Graph tags", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      /.+/,
    );
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute("content", /.+/);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      /ar27111994\.dev/,
    );
  });

  test("has Twitter Card tags", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      /.+/,
    );
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      "content",
      /.+/,
    );
  });

  test("has JSON-LD structured data", async ({ page }) => {
    await page.goto(BASE);
    const ld = page.locator('script[type="application/ld+json"]');
    const count = await ld.count();
    expect(count).toBeGreaterThanOrEqual(1);
    // Check at least one JSON-LD block has @type Person (may be in @graph array)
    let foundPerson = false;
    for (let i = 0; i < count; i++) {
      const text = await ld.nth(i).textContent();
      if (!text) continue;
      const parsed = JSON.parse(text);
      if (parsed["@type"] === "Person") {
        foundPerson = true;
        break;
      }
      if (Array.isArray(parsed["@graph"])) {
        for (const item of parsed["@graph"]) {
          if (item["@type"] === "Person") {
            foundPerson = true;
            break;
          }
        }
      }
    }
    expect(foundPerson).toBe(true);
  });

  test("has canonical URL", async ({ page }) => {
    await page.goto(BASE);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /ar27111994\.dev/);
  });

  test("robots.txt is not noindex", async ({ request }) => {
    const resp = await request.get(`${BASE}/robots.txt`);
    expect(resp.status()).toBe(200);
    const body = await resp.text();
    expect(body).not.toMatch(/Disallow: \//);
  });

  test("sitemap.xml is valid XML", async ({ request }) => {
    const resp = await request.get(`${BASE}/sitemap-index.xml`);
    expect(resp.status()).toBe(200);
    expect(resp.headers()["content-type"]).toMatch(/xml/);
  });

  test("privacy page has canonical to main site", async ({ page }) => {
    await page.goto(`${BASE}/privacy`);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /privacy/);
  });
});
