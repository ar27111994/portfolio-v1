import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.describe("portfolio smoke", () => {
  test("homepage renders critical sections and key navigation targets", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Ahmed Rehan/i);
    await expect(page.getByRole("main")).toBeVisible();
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
    await expect(
      page.getByRole("link", { name: /Privacy/i }).first(),
    ).toBeVisible();
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

  test("upwork modal opens and closes from the homepage", async ({ page }) => {
    await page.goto("/");

    const openButton = page.locator("[data-upwork-open]").first();
    await expect(openButton).toBeVisible();
    await openButton.click();

    const dialog = page.locator("dialog[data-upwork-modal]").first();
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("open", "");
    await expect(dialog.getByRole("button", { name: /Close/i })).toBeVisible();

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
