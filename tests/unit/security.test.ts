import { describe, it, expect } from "vitest";
import {
  isAllowedMcpHost,
  isAllowedMcpOrigin,
} from "../../src/lib/mcp/security";

describe("isAllowedMcpHost", () => {
  it("rejects a missing Host header", () => {
    expect(isAllowedMcpHost(null)).toBe(false);
    expect(isAllowedMcpHost("")).toBe(false);
  });

  it("allows the production apex and www hosts", () => {
    expect(isAllowedMcpHost("ar27111994.dev")).toBe(true);
    expect(isAllowedMcpHost("www.ar27111994.dev")).toBe(true);
  });

  it("allows local dev hosts on any port", () => {
    expect(isAllowedMcpHost("localhost")).toBe(true);
    expect(isAllowedMcpHost("localhost:4321")).toBe(true);
    expect(isAllowedMcpHost("127.0.0.1:4321")).toBe(true);
  });

  it("allows Vercel preview deployments (branch aliases and per-commit)", () => {
    expect(
      isAllowedMcpHost(
        "portfolio-v1-git-feat-agent-readiness-ar27111994s-projects.vercel.app",
      ),
    ).toBe(true);
    expect(
      isAllowedMcpHost(
        "portfolio-v1-27412hc43-ar27111994s-projects.vercel.app:443",
      ),
    ).toBe(true);
  });

  it("rejects foreign or lookalike hosts", () => {
    expect(isAllowedMcpHost("evil.example.com")).toBe(false);
    expect(isAllowedMcpHost("ar27111994.dev.attacker.io")).toBe(false);
    expect(isAllowedMcpHost("notvercel.app")).toBe(false);
    expect(isAllowedMcpHost("vercel.app")).toBe(false); // bare TLD-like root, not a deployment
  });
});

describe("isAllowedMcpOrigin", () => {
  it("allows non-browser clients with no Origin header", () => {
    expect(isAllowedMcpOrigin(null)).toBe(true);
  });

  it("allows sandboxed contexts sending the literal null origin", () => {
    expect(isAllowedMcpOrigin("null")).toBe(true);
  });

  it("allows production HTTPS origins", () => {
    expect(isAllowedMcpOrigin("https://ar27111994.dev")).toBe(true);
    expect(isAllowedMcpOrigin("https://www.ar27111994.dev")).toBe(true);
  });

  it("allows local dev origins", () => {
    expect(isAllowedMcpOrigin("http://localhost:4321")).toBe(true);
    expect(isAllowedMcpOrigin("http://127.0.0.1:4321")).toBe(true);
  });

  it("allows https Vercel preview origins", () => {
    expect(
      isAllowedMcpOrigin(
        "https://portfolio-v1-git-feat-agent-readiness-ar27111994s-projects.vercel.app",
      ),
    ).toBe(true);
  });

  it("rejects foreign origins, downgraded schemes, and lookalikes", () => {
    expect(isAllowedMcpOrigin("https://evil.example.com")).toBe(false);
    expect(isAllowedMcpOrigin("http://portfolio-v1.vercel.app")).toBe(false);
    expect(isAllowedMcpOrigin("https://vercel.app")).toBe(false);
    expect(isAllowedMcpOrigin("https://ar27111994.dev.attacker.io")).toBe(
      false,
    );
  });
});
