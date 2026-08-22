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
import { upworkPortfolioItems } from "../../src/data/site-content";

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
    expect(body).toContain("## Information I Collect");
    expect(body).toContain("## Cookies and Analytics");
    expect(body).toContain("Vercel Analytics");
    // Canonical terms survive both renderings (single source of truth).
    expect(body).toContain("I do not sell, rent, or share");
    expect(body).toContain("not responsible for the privacy practices");
    expect(body).toContain("under the age of 13");
  });

  it("work variant lists every recorded portfolio item exactly once", () => {
    const body = workMarkdown();
    expect(body).toContain("# Work — Upwork project trail");
    expect(body).toContain("## Featured portfolio records");
    const itemHeadings = body.match(/^### /gm)?.length ?? 0;
    // The generator emits exactly one heading per recorded item — no more,
    // no fewer (a count drop would mean silent truncation for agents).
    expect(itemHeadings).toBe(upworkPortfolioItems.length);
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
