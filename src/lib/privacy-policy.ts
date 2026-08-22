/**
 * Canonical privacy policy — single source of truth for both renderings:
 * - src/pages/privacy.astro renders it as HTML (human visitors)
 * - privacyMarkdown() (src/lib/markdown/pages.ts) renders it as Markdown
 *   (AI agents via /md/privacy.md and Accept: text/markdown)
 *
 * Paragraph text uses light inline markup so the two renderers stay in sync:
 * - `**bold**`  -> <strong> in HTML, **bold** in Markdown
 * - `[label](url)` -> <a href> in HTML, [label](url) in Markdown
 *
 * Adding or changing policy terms happens HERE, never in the page or the
 * Markdown generator.
 */

export interface PrivacyBlock {
  kind: "p" | "list";
  /** For kind "p": inline-markup paragraph text (see header comment). */
  text?: string;
  /** For kind "list": bullet items (rendered <ul> in HTML, "- " in Markdown). */
  items?: string[];
}

export interface PrivacySection {
  id: string;
  number: string;
  title: string;
  /** Ordered blocks; order is preserved by every renderer. */
  blocks: PrivacyBlock[];
}

export const PRIVACY_LAST_UPDATED = "June 17, 2026";

export const PRIVACY_SITE_URL = "https://www.ar27111994.dev";
export const PRIVACY_CONTACT_EMAIL = "admin@ar27111994.dev";

export const PRIVACY_INTRO =
  "This Privacy Policy describes how Ahmed Rehan (**me**) collects, uses, and handles information in connection with AI agents, skills, tools, and software products published on third-party marketplaces (including but not limited to Capafy) and available at [" +
  PRIVACY_SITE_URL +
  "](" +
  PRIVACY_SITE_URL +
  ").";

export const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "collect",
    number: "01",
    title: "Information I Collect",
    blocks: [
      {
        kind: "p",
        text: "My downloadable AI agents and skill packages (**Download mode products**) run entirely on your local machine or within your own AI agent environment. They do not transmit data to my servers. No personal information, usage data, or conversation history is collected by me when you use these products.",
      },
      {
        kind: "p",
        text: "**For certain AI agents or skills that require hosted API routing to function** (Cloud-Assisted products), your prompt and query data will transit through my self-hosted API gateway (hosted on Microsoft Azure) to be processed. I do not inspect, monetize, or permanently store the text of your conversations or prompts on my servers.",
      },
      {
        kind: "p",
        text: "When you contact me directly (e.g. via support email), I receive only the information you choose to send.",
      },
    ],
  },
  {
    id: "use",
    number: "02",
    title: "How I Use Information",
    blocks: [
      {
        kind: "p",
        text: "Any information you voluntarily provide through direct contact (email, GitHub issues, marketplace messaging) is used solely to:",
      },
      {
        kind: "list",
        items: [
          "Respond to your support requests or questions",
          "Improve product quality and documentation",
        ],
      },
      {
        kind: "p",
        text: "I do not sell, rent, or share your personal information with third parties.",
      },
    ],
  },
  {
    id: "third-party",
    number: "03",
    title: "Third-Party Platforms",
    blocks: [
      {
        kind: "p",
        text: "My products are distributed through third-party marketplaces (e.g. Capafy). When you purchase or download a product through these platforms, their own privacy policies apply to any data they collect during the transaction. I am not responsible for the privacy practices of third-party platforms.",
      },
      {
        kind: "p",
        text: "**To generate responses, my hosted API gateway securely forwards your requests to third-party LLM inference providers** (including but not limited to Google Gemini, Groq, and OpenRouter). These third parties process your input data in accordance with their own respective developer privacy policies.",
      },
    ],
  },
  {
    id: "cookies",
    number: "04",
    title: "Cookies and Analytics",
    blocks: [
      {
        kind: "p",
        text: `This portfolio website (${PRIVACY_SITE_URL}) uses Vercel Analytics for anonymous, aggregated traffic reporting. No personally identifiable data is collected. No tracking cookies are set on your device when you visit this site.`,
      },
    ],
  },
  {
    id: "retention",
    number: "05",
    title: "Data Retention",
    blocks: [
      {
        kind: "p",
        text: "I retain support correspondence only as long as necessary to resolve your request. You may request deletion of any personal information you have provided by emailing me.",
      },
      {
        kind: "p",
        text: "**My self-hosted routing gateway logs anonymous, aggregate usage metadata** (such as the model queried, token usage, and transaction timestamps) solely for performance monitoring, debugging, and quota management. No personal conversation history or prompt text is retained in these logs.",
      },
    ],
  },
  {
    id: "children",
    number: "06",
    title: "Children's Privacy",
    blocks: [
      {
        kind: "p",
        text: "My products and services are not directed at children under the age of 13. I do not knowingly collect personal information from children.",
      },
    ],
  },
  {
    id: "changes",
    number: "07",
    title: "Changes to This Policy",
    blocks: [
      {
        kind: "p",
        text: 'I may update this Privacy Policy from time to time. The "Last updated" date at the top of this page reflects the most recent revision. Continued use of my products after changes are posted constitutes your acceptance of the updated policy.',
      },
    ],
  },
  {
    id: "contact",
    number: "08",
    title: "Contact",
    blocks: [
      {
        kind: "p",
        text: "Questions about this Privacy Policy? Reach me at:",
      },
      {
        kind: "p",
        text: `[${PRIVACY_CONTACT_EMAIL}](mailto:${PRIVACY_CONTACT_EMAIL})`,
      },
    ],
  },
];

/**
 * Render one inline-markup paragraph into HTML for the privacy page.
 * Escape-first, then wrap the two supported constructs, so the only tags in
 * the output are the ones we generate.
 */
export function renderPrivacyInlineMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const withLinks = escaped.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_match, label: string, url: string) => `<a href="${url}">${label}</a>`,
  );
  return withLinks.replace(/\*\*([^*]+)\*\*/g, (_match, inner: string) => {
    // Inner content may already contain a generated link (no ** nesting is
    // produced by this policy's text, but keep the renderer total).
    return `<strong>${inner}</strong>`;
  });
}

/**
 * When a paragraph is exactly a `[label](mailto:email)` link (the contact
 * section), return the email so the HTML page can render its styled
 * contact-link anchor. Markdown keeps the plain link.
 */
export function privacyMailtoParagraph(
  text: string,
): { label: string; email: string } | null {
  const match = /^\[([^\]]+)\]\(mailto:([^)\s]+)\)$/.exec(text);
  if (!match) return null;
  return { label: match[1], email: match[2] };
}

/** Full Markdown rendering of the policy (used for /md/privacy.md). */
export function privacyPolicyMarkdown(): string {
  const body = PRIVACY_SECTIONS.map((section) => {
    const blocks = section.blocks
      .map((block) => {
        if (block.kind === "list") {
          return block.items?.map((item) => `- ${item}`).join("\n") ?? "";
        }
        const mailto = privacyMailtoParagraph(block.text ?? "");
        return mailto ? `${block.text}.` : (block.text ?? "");
      })
      .join("\n\n");
    return `## ${section.title}\n\n${blocks}`;
  }).join("\n\n");

  return [
    `# Privacy Policy — Ahmed Rehan`,
    ``,
    `Last updated: ${PRIVACY_LAST_UPDATED}. The authoritative policy is published at [${PRIVACY_SITE_URL}/privacy](${PRIVACY_SITE_URL}/privacy); this markdown file is the machine-readable rendering of the same policy.`,
    ``,
    PRIVACY_INTRO,
    ``,
    body,
    ``,
  ].join("\n");
}
