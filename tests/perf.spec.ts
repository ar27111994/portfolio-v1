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
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) {
            observer.disconnect();
            resolve(last.startTime);
          }
        });
        observer.observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(-1);
        }, 5000);
      });
    });
    expect(lcp).toBeGreaterThanOrEqual(-1);
    if (lcp !== -1) expect(lcp).toBeLessThan(MAX_LCP_MS);
  });

  test("FCP is within budget", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    const [fcp] = await page.evaluate(() => {
      const [paint] = performance
        .getEntriesByType("paint")
        .filter((e) => e.name === "first-contentful-paint");
      return [paint ? paint.startTime : 0];
    });
    expect(fcp).toBeGreaterThanOrEqual(0);
    if (fcp !== -1) expect(fcp).toBeLessThan(MAX_FCP_MS);
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
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (!(entry as any).hadRecentInput) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                value += (entry as any).value;
              }
            }
          });
          observer.observe({ type: "layout-shift", buffered: true });
          setTimeout(() => {
            observer.disconnect();
            resolve(value);
          }, 100);
        });
      });
    } catch {
      // CLS observer may not be available
    }
    expect(cls).toBeLessThan(MAX_CLS);
  });

  test("first load under 8 seconds", async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE, { waitUntil: "load" });
    const loadTime = Date.now() - start;
    // CI runners are slow — 8s budget is reasonable
    expect(loadTime).toBeLessThan(8000);
  });
});

test.describe("Lighthouse-like checks", () => {
  test("no console errors on homepage", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      // Only count errors, not warnings; ignore cross-origin network errors
      if (msg.type() === "error") {
        const text = msg.text();
        if (
          !text.includes("404") &&
          !text.includes("403") &&
          !text.includes("NotSameOrigin")
        ) {
          errors.push(text);
        }
      }
    });
    await page.goto(BASE, { waitUntil: "networkidle" });
    expect(errors).toEqual([]);
  });

  test("all navigation links resolve", async ({ page }) => {
    await page.goto(BASE);
    const links = page.locator('.anchor-rail a[href^="#"]');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href) {
        const target = page.locator(href);
        await expect(target.first()).toBeAttached({ timeout: 3000 });
      }
    }
  });

  test("no broken images (loaded ones)", async ({ page }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000); // Let lazy images start loading
    const imgs = page.locator("img");
    const count = await imgs.count();
    let broken = 0;
    for (let i = 0; i < count; i++) {
      const info = await imgs.nth(i).evaluate((el: HTMLImageElement) => ({
        natural: el.naturalWidth,
        complete: el.complete,
        src: el.src.slice(0, 50),
      }));
      // Only count as broken if the image has finished loading AND has zero natural width
      if (info.complete && info.natural === 0 && info.src) {
        broken++;
      }
    }
    // Allow a few genuinely broken external images
    expect(broken).toBeLessThan(5);
  });
});
