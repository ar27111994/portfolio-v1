import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("portfolio smoke", () => {
  test("homepage renders critical sections, theme metadata, and key navigation targets", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Ahmed Rehan/i);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute(
      "content",
      "light dark",
    );
    await expect(
      page.locator(
        'meta[name="theme-color"][media="(prefers-color-scheme: dark)"]',
      ),
    ).toHaveAttribute("content", "#0c1118");
    await expect(
      page.getByRole("heading", {
        name: /Selected work with visible proof behind it/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Upwork portfolio/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /What people say when the work is done well/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Contact/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /ATS resume/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Privacy/i }).first(),
    ).toBeVisible();
  });

  test("dark mode applies when the user prefers a dark color scheme", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");

    const theme = await page.evaluate(() => {
      const bodyStyles = getComputedStyle(document.body);
      const rootStyles = getComputedStyle(document.documentElement);
      return {
        bodyColor: bodyStyles.color,
        bodyBackground: bodyStyles.backgroundImage,
        paper: rootStyles.getPropertyValue("--paper").trim(),
        ink: rootStyles.getPropertyValue("--ink").trim(),
      };
    });

    expect(theme.paper).toBe("#0b1016");
    expect(theme.ink).toBe("#edf2f7");
    expect(theme.bodyBackground).toContain("gradient");
  });

  test("privacy page renders policy copy", async ({ page }) => {
    await page.goto("/privacy");

    await expect(
      page.getByRole("heading", { name: /Privacy Policy/i }),
    ).toBeVisible();
    await expect(page.getByText("local-only / download mode")).toBeVisible();
    await expect(page.getByText("cloud-assisted / API-routed")).toBeVisible();
    await expect(
      page.getByText(/third-party APIs and model providers/i),
    ).toBeVisible();
  });

  test("upwork modal opens, closes, and exposes the captioned narrated video path", async ({
    page,
  }) => {
    await page.goto("/");

    const targetCard = page
      .locator("article.upwork-portfolio-card")
      .filter({ hasText: /agent-harness/i })
      .first();
    const openButton = targetCard.locator("[data-upwork-open]").first();
    await expect(openButton).toBeVisible();

    const modalId = await openButton.getAttribute("data-upwork-open");
    expect(modalId).toBeTruthy();

    await openButton.click();

    const dialog = page.locator(`#${modalId}`);
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("open", "");
    await expect(dialog.getByRole("button", { name: /Close/i })).toBeVisible();
    await expect(
      dialog.getByText(
        /spoken narration is present in this demo\. captions are available through the embedded youtube player controls/i,
      ),
    ).toBeVisible();
    await expect(dialog.locator("iframe[data-upwork-video-embed]")).toHaveCount(
      1,
    );

    await dialog.getByRole("button", { name: /Close/i }).click();
    await expect(dialog).not.toHaveAttribute("open", "");
  });

  test("homepage has no automatically detectable WCAG A/AA violations", async ({
    page,
  }, testInfo) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    await testInfo.attach("homepage-accessibility-scan-results", {
      body: JSON.stringify(accessibilityScanResults, null, 2),
      contentType: "application/json",
    });

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("privacy page has no automatically detectable WCAG A/AA violations", async ({
    page,
  }, testInfo) => {
    await page.goto("/privacy");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    await testInfo.attach("privacy-accessibility-scan-results", {
      body: JSON.stringify(accessibilityScanResults, null, 2),
      contentType: "application/json",
    });

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
