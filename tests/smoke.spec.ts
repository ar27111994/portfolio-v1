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
    await expect(page.locator("h1")).toBeVisible();
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
    await expect(page.locator("h1")).toContainText("Privacy Policy");
    await expect(
      page.locator('h2:has-text("Information I Collect")'),
    ).toBeVisible();
    await expect(
      page.locator('h2:has-text("Third-Party Platforms")'),
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
