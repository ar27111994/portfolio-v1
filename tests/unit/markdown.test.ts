import { describe, it, expect } from "vitest";
import {
  homeMarkdown,
  aboutMarkdown,
  contactMarkdown,
  privacyMarkdown,
  workMarkdown,
  llmsFullText,
  MARKDOWN_VARIANTS,
} from "../../src/lib/markdown/pages";

/** Approximate agent-extraction budget: 100K chars (~25K tokens) per page. */
const MAX_VARIANT_CHARS = 100_000;

describe("markdown variants (agent-readable page text)", () => {
  it("covers every negotiated page path", () => {
    expect(MARKDOWN_VARIANTS).toEqual({
      "": "home",
      about: "about",
      contact: "contact",
      privacy: "privacy",
      work: "work",
    });
  });

  it.each([
    ["home", homeMarkdown()],
    ["about", aboutMarkdown()],
    ["contact", contactMarkdown()],
    ["privacy", privacyMarkdown()],
    ["work", workMarkdown()],
  ])("%s variant is substantial and within the token budget", (_name, body) => {
    expect(body.length).toBeGreaterThan(500);
    expect(body.length).toBeLessThanOrEqual(MAX_VARIANT_CHARS);
    // No HTML leakage into the markdown.
    expect(body).not.toMatch(/<[a-z][^>]*>/i);
  });

  it("home variant carries when-to-use guidance and recovery entry points", () => {
    const body = homeMarkdown();
    expect(body).toContain("# Ahmed Rehan — ARLabs");
    expect(body).toContain("## When to use this site");
    expect(body).toContain("/llms.txt");
    expect(body).toContain("/mcp");
    expect(body).toContain("admin@ar27111994.dev");
    expect(body).toMatch(/services/i);
  });

  it("home variant lists services, projects, case studies, and resumes", () => {
    const body = homeMarkdown();
    expect(body).toContain("## Services");
    expect(body).toContain("## Featured projects");
    expect(body).toContain("## Case studies");
    expect(body).toContain("## Resumes");
    expect(body).toContain("resume_full.pdf");
  });

  it("about variant contains career facts and certifications", () => {
    const body = aboutMarkdown();
    expect(body).toContain("# About — Ahmed Rehan");
    expect(body).toContain("## Credibility facts");
    expect(body).toContain("## Certifications");
    expect(body).toContain("verify.skilljar.com");
  });

  it("contact variant exposes reach channels", () => {
    const body = contactMarkdown();
    expect(body).toContain("admin@ar27111994.dev");
    expect(body).toContain("wa.me/923315887235");
    expect(body).toContain("## Contact channels");
  });

  it("privacy variant mirrors the policy's substantive sections", () => {
    const body = privacyMarkdown();
    expect(body).toContain("# Privacy Policy");
    expect(body).toContain("## Information I collect");
    expect(body).toContain("## Cookies and analytics");
    expect(body).toContain("Vercel Analytics");
  });

  it("work variant lists every recorded portfolio item", () => {
    const body = workMarkdown();
    expect(body).toContain("# Work — Upwork project trail");
    expect(body).toContain("## Featured portfolio records");
    const itemHeadings = body.match(/^### /gm)?.length ?? 0;
    expect(itemHeadings).toBeGreaterThanOrEqual(30); // 40-item portfolio, no truncation
  });

  it("llms-full.txt aggregates all variants without duplication loss", () => {
    const full = llmsFullText();
    expect(full).toContain("# Ahmed Rehan — ARLabs");
    expect(full).toContain("# About — Ahmed Rehan");
    expect(full).toContain("# Contact — Ahmed Rehan");
    expect(full).toContain("# Privacy Policy");
    expect(full).toContain("# Work — Upwork project trail");
    expect(full.length).toBeLessThanOrEqual(4 * MAX_VARIANT_CHARS);
  });
});
