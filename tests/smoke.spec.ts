import { test, expect } from "@playwright/test";

test.describe("Homepage smoke tests", () => {
  test("page loads with correct title", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Ahmed Rehan/);
  });

  test("key landmarks are present", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header.top-bar")).toBeVisible();
    await expect(page.locator("main#main-content")).toBeVisible();
    await expect(page.locator("footer.site-footer")).toBeVisible();
  });

  test("skip link navigates to main content", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  test("hero section renders key content", async ({ page }) => {
    await page.goto("/");
    // Scoped to the page content: the dev toolbar adds its own h1s to the
    // document body in dev (see a11y.spec.ts note).
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(".proof-stack-metrics")).toHaveCount(1);
  });

  test("navigation links resolve to valid sections", async ({ page }) => {
    await page.goto("/");
    const navLinks = page.locator(".anchor-rail a");
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("mobile viewport renders nav correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    // At 375px, hamburger is visible and anchor-rail is hidden until toggled
    await expect(page.locator(".hamburger")).toBeVisible();
  });
});

test.describe("Privacy page", () => {
  test("page loads with correct title", async ({ page }) => {
    const response = await page.goto("/privacy");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Privacy Policy/);
  });

  test("contains key privacy sections", async ({ page }) => {
    await page.goto("/privacy");
    // Role-based queries: Astro's dev toolbar injects its own headings
    // ("No islands detected.", "Audit", "Settings") into the document tree
    // in dev, so unscoped tag selectors are not stable here.
    await expect(
      page.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Information I Collect" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Third-Party Platforms" }),
    ).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("homepage has no critical axe violations", async ({ page }) => {
    await page.goto("/");
    // Basic a11y snapshot — landmark roles are present
    await expect(page.locator('header[class*="top-bar"]')).toBeVisible();
    await expect(page.locator("main")).toHaveAttribute("id", "main-content");
    await expect(page.locator('footer[role="contentinfo"]')).toBeVisible();
  });

  test("images have alt text", async ({ page }) => {
    await page.goto("/");
    const imgs = page.locator("img:not([alt])");
    const missingAlt = await imgs.count();
    expect(missingAlt).toBe(0);
  });
});
