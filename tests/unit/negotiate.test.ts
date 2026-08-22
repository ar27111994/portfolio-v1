import { describe, it, expect } from "vitest";
import {
  parseAccept,
  preferredType,
  prefersMarkdown,
  appendVary,
  normalizePath,
  markdown404Body,
} from "../../src/lib/negotiate";

const PRODUCES = ["text/html", "text/markdown"] as const;

describe("preferredType (RFC 9110 §12.5.1)", () => {
  it("defaults to the first produce candidate when no Accept header", () => {
    expect(preferredType(null, PRODUCES)).toBe("text/html");
  });

  it("returns HTML for a browser Accept header", () => {
    expect(
      preferredType(
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        PRODUCES,
      ),
    ).toBe("text/html");
  });

  it("returns markdown when explicitly requested", () => {
    expect(preferredType("text/markdown", PRODUCES)).toBe("text/markdown");
  });

  it("tie-breaks by client order: markdown listed first wins", () => {
    expect(preferredType("text/markdown, text/html, */*", PRODUCES)).toBe(
      "text/markdown",
    );
  });

  it("tie-breaks by client order: html listed first wins", () => {
    expect(preferredType("text/html, text/markdown, */*", PRODUCES)).toBe(
      "text/html",
    );
  });

  it("wildcard with q=1 can outrank an explicit q=0.5 for another type", () => {
    // RFC 9110 §12.5.1: each representation's weight comes from its MOST
    // SPECIFIC matching range. text/markdown -> explicit (0.5), text/html ->
    // wildcard (1.0) => html wins across candidates.
    expect(preferredType("text/markdown;q=0.5, */*;q=1", PRODUCES)).toBe(
      "text/html",
    );
  });

  it("explicit q=0.5 beats a wildcard q=0.1 for the same type", () => {
    expect(preferredType("text/*;q=0.1, text/markdown;q=0.5", PRODUCES)).toBe(
      "text/markdown",
    );
  });

  it("respects q=0 as an explicit rejection", () => {
    const accepted = preferredType("text/html;q=0, */*;q=1", PRODUCES);
    expect(accepted).toBe("text/markdown");
  });

  it("rejects everything with q=0", () => {
    expect(preferredType("text/html;q=0, text/markdown;q=0", PRODUCES)).toBe(
      null,
    );
  });

  it("handles */* wildcard", () => {
    expect(preferredType("*/*", PRODUCES)).toBe("text/html");
  });

  it("handles uppercase media types case-insensitively", () => {
    expect(preferredType("TEXT/MARKDOWN", PRODUCES)).toBe("text/markdown");
  });

  it("handles partial wildcards (text/*)", () => {
    expect(preferredType("text/*", PRODUCES)).toBe("text/html");
    expect(preferredType("text/*;q=0", PRODUCES)).toBe(null);
  });
});

describe("prefersMarkdown", () => {
  it("true for text/markdown requests", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
    expect(prefersMarkdown("text/markdown, text/html, */*")).toBe(true);
  });
  it("false for browser headers and unknown types", () => {
    expect(prefersMarkdown("text/html,application/xhtml+xml,*/*;q=0.8")).toBe(
      false,
    );
    expect(prefersMarkdown(null)).toBe(false);
    expect(prefersMarkdown("application/json")).toBe(false);
  });
});

describe("parseAccept", () => {
  it("parses q-values and clamps to [0,1]", () => {
    const entries = parseAccept(
      "text/html;q=1.5, text/markdown;q=-1, */*;q=0.5",
    );
    expect(entries[0].q).toBe(1);
    expect(entries[1].q).toBe(0);
    expect(entries[2].q).toBe(0.5);
  });
  it("returns [] for null/empty", () => {
    expect(parseAccept(null)).toEqual([]);
    expect(parseAccept("")).toEqual([]);
  });
});

describe("appendVary", () => {
  it("adds Vary: Accept when none exists", () => {
    const headers = new Headers();
    appendVary(headers);
    expect(headers.get("Vary")).toBe("Accept");
  });
  it("appends to an existing Vary without duplicating Accept", () => {
    const headers = new Headers({ Vary: "Accept-Encoding" });
    appendVary(headers);
    expect(headers.get("Vary")).toBe("Accept-Encoding, Accept");
    appendVary(headers);
    expect(headers.get("Vary")).toBe("Accept-Encoding, Accept");
  });
  it("is case-insensitive about existing tokens", () => {
    const headers = new Headers({ Vary: "accept" });
    appendVary(headers);
    expect(headers.get("Vary")).toBe("accept");
  });
});

describe("normalizePath", () => {
  it("maps / to empty and strips trailing slashes", () => {
    expect(normalizePath("/")).toBe("");
    expect(normalizePath("/about")).toBe("about");
    expect(normalizePath("/about/")).toBe("about");
    expect(normalizePath("/a/b/")).toBe("a/b");
  });
});

describe("markdown404Body", () => {
  it("is markdown with recovery links and a real-404 framing", () => {
    const body = markdown404Body("/nope");
    expect(body).toContain("# 404");
    expect(body).toContain("/nope");
    expect(body).toContain("/llms.txt");
    expect(body).toContain("/sitemap-index.xml");
    expect(body).toContain("/mcp");
  });
});
