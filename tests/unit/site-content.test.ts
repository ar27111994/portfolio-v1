import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

function readFile(path: string): string {
  return readFileSync(path, "utf-8");
}

describe("site-content data module", () => {
  it("site-content.ts is under 1100 lines", () => {
    const lines = readFile("src/data/site-content.ts").split("\n").length;
    expect(lines).toBeLessThanOrEqual(1100);
  });

  it("site-types.ts is under 200 lines", () => {
    const lines = readFile("src/data/site-types.ts").split("\n").length;
    expect(lines).toBeLessThanOrEqual(200);
  });

  it("exports all required arrays", () => {
    const content = readFile("src/data/site-content.ts");
    const requiredExports = [
      "contactEmail",
      "badges",
      "proofStackMetrics",
      "proofCategories",
      "servicesOfferings",
      "testimonials",
      "caseStudies",
      "featuredProjects",
      "additionalProjects",
      "writingLinks",
      "feedSources",
      "labNotes",
      "contactWidgets",
      "resumeWidgets",
      "profileWidgets",
      "sponsorLinks",
      "capabilities",
      "credibilityFacts",
      "ventureProof",
      "certificationLinks",
      "openSourceFreemium",
      "upworkFitTags",
    ];
    for (const name of requiredExports) {
      expect(content).toMatch(new RegExp(`export const ${name}`));
    }
  });

  it("site-types.ts defines all shared interfaces", () => {
    const content = readFile("src/data/site-types.ts");
    const requiredInterfaces = [
      "Badge",
      "ProofMetric",
      "ProofCategory",
      "ServiceOffering",
      "Testimonial",
      "CaseStudy",
      "FeaturedProject",
      "AdditionalProject",
      "WritingLink",
      "FeedSource",
      "LabNote",
      "ContactWidget",
      "ResumeWidget",
      "ProfileWidget",
      "SponsorLink",
      "CredibilityFact",
      "VentureProof",
      "CertificationLink",
      "OpenSourceItem",
      "Capability",
      "ProfileLink",
    ];
    for (const name of requiredInterfaces) {
      expect(content).toMatch(new RegExp(`export interface ${name}`));
    }
  });

  it("site-types.ts has no 'any' type", () => {
    const content = readFile("src/data/site-types.ts");
    const interfaceBlocks = content.match(
      /export interface \w+ \{[\s\S]*?\n\}/g,
    );
    if (interfaceBlocks) {
      for (const block of interfaceBlocks) {
        const typesOnly = block.replace(/\/\/.*/g, "");
        expect(typesOnly).not.toMatch(/:\s*any\b/);
      }
    }
  });

  it("case studies have required fields", () => {
    const content = readFile("src/data/site-content.ts");
    const csBlock = content.match(/export const caseStudies = \[([\s\S]*?)\];/);
    expect(csBlock).toBeTruthy();
    const fields = [
      "title:",
      "context:",
      "problem:",
      "approach:",
      "outcome:",
      "tech:",
      "metrics:",
    ];
    for (const field of fields) {
      expect(csBlock![1]).toContain(field);
    }
    const titleMatches = csBlock![1].match(/title:/g);
    expect(titleMatches?.length).toBe(4);
  });

  it("testimonials have at least 5 entries with required fields", () => {
    const content = readFile("src/data/site-content.ts");
    const tBlock = content.match(/export const testimonials = \[([\s\S]*?)\];/);
    expect(tBlock).toBeTruthy();
    const fields = ["quote:", "author:", "role:", "relation:", "platform:"];
    for (const field of fields) {
      expect(tBlock![1]).toContain(field);
    }
    const quoteMatches = tBlock![1].match(/quote:/g);
    expect(quoteMatches?.length ?? 0).toBeGreaterThanOrEqual(5);
  });

  it("has no hardcoded secrets or tokens in either file", () => {
    for (const path of ["src/data/site-content.ts", "src/data/site-types.ts"]) {
      const content = readFile(path);
      expect(content).not.toMatch(
        /api[_-]?key\s*[:=]\s*["'][a-zA-Z0-9_-]{20,}/i,
      );
      expect(content).not.toMatch(/token\s*[:=]\s*["'][a-zA-Z0-9._-]{20,}/i);
      expect(content).not.toMatch(/password\s*[:=]\s*["'][^\s]{8,}/i);
      expect(content).not.toMatch(/secret\s*[:=]\s*["'][^\s]{8,}/i);
    }
  });
});
