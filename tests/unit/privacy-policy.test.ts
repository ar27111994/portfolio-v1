import { describe, it, expect } from "vitest";
import {
  PRIVACY_SECTIONS,
  PRIVACY_INTRO,
  PRIVACY_LAST_UPDATED,
  PRIVACY_SITE_URL,
  PRIVACY_CONTACT_EMAIL,
  renderPrivacyInlineMarkdown,
  privacyMailtoParagraph,
  privacyPolicyMarkdown,
} from "../../src/lib/privacy-policy";

describe("renderPrivacyInlineMarkdown (HTML rendering)", () => {
  it("renders bold as <strong> and links as <a href>", () => {
    expect(
      renderPrivacyInlineMarkdown("**Download mode products** run locally"),
    ).toBe("<strong>Download mode products</strong> run locally");
    expect(
      renderPrivacyInlineMarkdown(
        `available at [${PRIVACY_SITE_URL}](${PRIVACY_SITE_URL})`,
      ),
    ).toBe(
      `available at <a href="${PRIVACY_SITE_URL}">${PRIVACY_SITE_URL}</a>`,
    );
  });

  it("escapes hostile input before wrapping constructs (no tag injection)", () => {
    const out = renderPrivacyInlineMarkdown("<script>alert(1)</script> **x**");
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
    expect(out).toContain("<strong>x</strong>");
  });

  it("leaves no raw ** markers in section renderings", () => {
    for (const section of PRIVACY_SECTIONS) {
      for (const block of section.blocks) {
        if (block.kind === "p" && block.text) {
          const html = renderPrivacyInlineMarkdown(block.text);
          expect(html).not.toMatch(/\*\*/);
        }
      }
    }
  });
});

describe("privacyMailtoParagraph", () => {
  it("detects pure mailto paragraphs and extracts the email", () => {
    expect(
      privacyMailtoParagraph(
        `[${PRIVACY_CONTACT_EMAIL}](mailto:${PRIVACY_CONTACT_EMAIL})`,
      ),
    ).toEqual({ label: PRIVACY_CONTACT_EMAIL, email: PRIVACY_CONTACT_EMAIL });
  });

  it("returns null for ordinary paragraphs", () => {
    expect(privacyMailtoParagraph("Questions about this Privacy Policy?")).toBe(
      null,
    );
    expect(privacyMailtoParagraph("plain text with [a](https://x) link")).toBe(
      null,
    );
  });
});

describe("privacy policy — canonical single source", () => {
  const md = privacyPolicyMarkdown();

  it("markdown contains every section title exactly once", () => {
    for (const section of PRIVACY_SECTIONS) {
      expect(md.split(`## ${section.title}`).length - 1).toBe(1);
    }
  });

  it("key policy terms survive in the markdown rendering", () => {
    const terms = [
      "Microsoft Azure",
      "Google Gemini",
      "Groq",
      "OpenRouter",
      "Capafy",
      "Vercel Analytics",
      "under the age of 13",
      "I do not sell, rent, or share",
      "not responsible for the privacy practices",
      "No tracking cookies are set",
      "deletion of any personal information",
      PRIVACY_CONTACT_EMAIL,
      PRIVACY_SITE_URL,
      PRIVACY_LAST_UPDATED,
    ];
    for (const term of terms) {
      expect(md).toContain(term);
    }
  });

  it("markdown has the recovery header and is plainly machine-readable", () => {
    expect(md).toContain("# Privacy Policy — Ahmed Rehan");
    expect(md).toContain("machine-readable rendering");
    expect(md).not.toContain("<p>");
  });

  it("HTML renderings of every paragraph carry the same words as markdown", () => {
    // The HTML page renders each paragraph via renderPrivacyInlineMarkdown;
    // stripping tags must reproduce exactly the paragraph text used by the
    // markdown renderer. Link paragraphs are excluded from the byte equality
    // because the markdown form keeps the [label](url) syntax verbatim while
    // the HTML form unwraps it into an anchor (covered separately below).
    for (const section of PRIVACY_SECTIONS) {
      for (const block of section.blocks) {
        if (block.kind === "p" && block.text && !block.text.includes("](")) {
          const html = renderPrivacyInlineMarkdown(block.text);
          const stripped = html
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"');
          expect(stripped).toBe(block.text.replace(/\*\*/g, ""));
        }
        if (block.kind === "list") {
          expect(md).toContain(`- ${block.items?.[0]}`);
        }
      }
    }
  });

  it("intro is rendered the same way in both surfaces", () => {
    const html = renderPrivacyInlineMarkdown(PRIVACY_INTRO);
    expect(html).toContain(`<a href="${PRIVACY_SITE_URL}">`);
    expect(html).toContain("<strong>me</strong>");
    expect(md).toContain("This Privacy Policy describes how Ahmed Rehan");
  });
});
