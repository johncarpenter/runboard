import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runPulse } from "../../src/commands/pulse.js";
import { cleanup, initRepo, seed } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = initRepo();
});
afterEach(() => cleanup(root));

describe("pulse", () => {
  it("requires at least two assessments", () => {
    seed(root, "2026-01-01");
    expect(() => runPulse({ root })).toThrow(/at least two/);
  });

  it("writes a delta memo comparing the two latest", () => {
    seed(root, "2026-01-01", { base: 2 });
    seed(root, "2026-02-01", { base: 3 });
    const { path, text } = runPulse({ root });
    expect(path).toMatch(/pulse-2026-02-01\.md$/);
    const memo = readFileSync(path, "utf8");
    expect(memo).toContain("Pulse");
    expect(memo).toContain("2026-01-01");
    expect(text).toContain("What moved");
  });

  it("flags a dimension stuck across three assessments", () => {
    seed(root, "2026-01-01", { base: 5, overrides: { "build.team": { level: 2 } } });
    seed(root, "2026-02-01", { base: 5, overrides: { "build.team": { level: 2 } } });
    seed(root, "2026-03-01", { base: 5, overrides: { "build.team": { level: 2 } } });
    const { triggers } = runPulse({ root });
    expect(triggers).toContain("build.team");
  });
});
