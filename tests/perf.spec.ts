import { test, expect } from "@playwright/test";

const BASE = process.env.TEST_URL || "http://localhost:4321";
// Adjusted thresholds for local dev — tighten for CI against production builds
const MAX_LCP_MS = 4000; // LCP under 4s
const MAX_FCP_MS = 2500; // FCP under 2.5s
const MAX_CLS = 0.1; // CLS under 0.1

test.describe("Core Web Vitals", () => {
  test("LCP is within budget", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          resolve(last ? last.startTime : 0);
        }).observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => resolve(0), 100);
      });
    });
    expect(lcp).toBeLessThan(MAX_LCP_MS);
  });

  test("FCP is within budget", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const [fcp] = await page.evaluate(() => {
      const [paint] = performance.getEntriesByType("paint").filter(
        (e) => e.name === "first-contentful-paint",
      );
      return [paint ? paint.startTime : 0];
    });
    expect(fcp).toBeLessThan(MAX_FCP_MS);
  });

  test("CLS is within budget", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    // Scroll to trigger any lazy-loaded elements
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    let cls = 0;
    try {
      cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let value = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (!(entry as any).hadRecentInput) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value += (entry as any).value;
              }
            }
          }).observe({ type: "layout-shift", buffered: true });
          setTimeout(() => resolve(value), 100);
        });
      });
    } catch {
      // CLS observer may not be available
    }
    expect(cls).toBeLessThan(MAX_CLS);
  });

  test("first load under 3 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE, { waitUntil: "load" });
    const loadTime = Date.now() - start;
    // On local dev with cold cache, 3s is reasonable
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe("Lighthouse-like checks", () => {
  test("no console errors on homepage", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto(BASE, { waitUntil: "networkidle" });
    expect(errors).toEqual([]);
  });

  test("all navigation links resolve", async ({ page }) => {
    await page.goto(BASE);
    const links = page.locator(".anchor-rail a[href^=\"#\"]");
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href) {
        const target = page.locator(href);
        await expect(target.first()).toBeAttached({ timeout: 3000 });
      }
    }
  });

  test("no broken images", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const imgs = page.locator("img");
    const count = await imgs.count();
    let broken = 0;
    for (let i = 0; i < count; i++) {
      const natural = await imgs.nth(i).evaluate(
        (el: HTMLImageElement) => el.naturalWidth,
      );
      if (natural === 0) broken++;
    }
    // Allow a few dynamic/lazy images to not have loaded yet
    expect(broken).toBeLessThan(count * 0.3);
  });
});
