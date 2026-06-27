import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runStatus } from "../../src/commands/status.js";
import { cleanup, initRepo, seed } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = initRepo();
});
afterEach(() => cleanup(root));

describe("status", () => {
  it("reports the empty state before any assessment", () => {
    const s = runStatus(root);
    expect(s.empty).toBe(true);
  });

  it("summarises latest date, average, and triggers", () => {
    seed(root, "2026-01-01", { base: 5, overrides: { "build.team": { level: 2 } } });
    seed(root, "2026-02-01", { base: 5, overrides: { "build.team": { level: 2 } } });
    seed(root, "2026-03-01", { base: 5, overrides: { "build.team": { level: 2 } } });
    const s = runStatus(root);
    expect(s.empty).toBe(false);
    expect(s.latestDate).toBe("2026-03-01");
    expect(s.average).toBeDefined();
    expect(s.activeTriggers).toContain("build.team");
  });
});
