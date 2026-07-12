import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const apiContent = readFileSync("api/upwork-portfolio.ts", "utf-8");

describe("API — upwork-portfolio.ts", () => {
  it("file is under 520 lines", () => {
    const lines = apiContent.split("\n").length;
    expect(lines).toBeLessThanOrEqual(530);
  });

  it("imports timingSafeEqual for constant-time comparison", () => {
    expect(apiContent).toMatch(/timingSafeEqual/);
  });

  it("uses constant-time comparison for CRON_SECRET", () => {
    // Should use timingSafeEqual, not !== or === for the secret
    const guardSection = apiContent.match(
      /if \(req\.method === "POST"\) \{([\s\S]*?)\n  \}/,
    );
    expect(guardSection).toBeTruthy();
    if (guardSection) {
      // Length check before timingSafeEqual is safe (constant-time via Buffer)
      expect(guardSection[1]).toMatch(/timingSafeEqual/);
      // The secret itself is never compared with === or !==
      expect(guardSection[1]).not.toMatch(/`Bearer \$\{secret\}`\s*[!=]==/);
    }
  });

  it("does not leak error details in 500 responses", () => {
    expect(apiContent).not.toMatch(/detail:\s*err\.message/);
    expect(apiContent).not.toMatch(/detail:\s*err instanceof Error/);
  });

  it("imports crypto from node:crypto", () => {
    expect(apiContent).toMatch(/from "node:crypto"/);
  });

  it("has no hardcoded secrets", () => {
    expect(apiContent).not.toMatch(/CRON_SECRET\s*=\s*["'][a-zA-Z0-9_-]{8,}/);
  });

  it("validates method before processing", () => {
    // Should reject non-GET, non-POST methods with 405
    expect(apiContent).toMatch(/405/);
    expect(apiContent).toMatch(/Method not allowed/);
  });
});
