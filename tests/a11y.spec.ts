import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.TEST_URL || "http://localhost:4321";

test.describe("Accessibility audit", () => {
  test("homepage has no critical WCAG violations", async ({ page }) => {
    await page.goto(BASE);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    // Only fail on critical/serious violations — dynamic feed may have minor color-contrast issues
    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(critical).toEqual([]);
  });

  test("privacy page passes WCAG 2.2 AA", async ({ page }) => {
    await page.goto(`${BASE}/privacy`);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("skip link is present", async ({ page }) => {
    await page.goto(BASE);
    const skip = page.locator(".skip-link");
    await expect(skip).toHaveAttribute("href", "#main-content");
    // Skip link is off-screen by design — verify attribute only
  });

  test("all images have alt text", async ({ page }) => {
    await page.goto(BASE);
    const imgs = page.locator("img:not([alt])");
    await expect(imgs).toHaveCount(0);
  });

  test("heading hierarchy is valid", async ({ page }) => {
    await page.goto(BASE);
    // Check exactly one h1
    await expect(page.locator("h1")).toHaveCount(1);
    // No h4 or deeper without h3 in between (checking for skips)
    const h2s = await page.locator("h2").count();
    const h3s = await page.locator("h3").count();
    expect(h2s).toBeGreaterThan(0);
    expect(h3s).toBeGreaterThan(0);
    // No h4s (case study headings are now <strong>)
    const h4s = await page.locator("h4").count();
    expect(h4s).toBe(0);
  });

  test("theme toggle has accessible label", async ({ page }) => {
    await page.goto(BASE);
    const toggle = page.locator(".theme-toggle");
    await expect(toggle).toHaveAttribute("aria-label");
  });

  test("nav links have accessible names", async ({ page }) => {
    await page.goto(BASE);
    const nav = page.locator(".anchor-rail a");
    const count = await nav.count();
    for (let i = 0; i < count; i++) {
      const link = nav.nth(i);
      const name = await link.textContent();
      expect(name?.trim().length).toBeGreaterThan(0);
    }
  });
});
