import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runReport } from "../../src/commands/report.js";
import { UserError } from "../../src/commands/shared.js";
import { cleanup, initRepo, seed } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = initRepo();
});
afterEach(() => cleanup(root));

describe("report", () => {
  it("renders a board-update in business language", () => {
    seed(root, "2026-06-27", { base: 2, overrides: { "plan.tools": { level: 1 } } });
    const { path } = runReport({ root, type: "board-update" });
    const doc = readFileSync(path, "utf8");
    expect(doc).toContain("Technology Board Update");
    expect(doc).toContain("Biggest constraint");
  });

  it("renders baseline and monthly types", () => {
    seed(root, "2026-06-27", { base: 3 });
    expect(readFileSync(runReport({ root, type: "baseline" }).path, "utf8")).toContain(
      "Baseline Assessment",
    );
    expect(readFileSync(runReport({ root, type: "monthly" }).path, "utf8")).toContain(
      "Monthly Update",
    );
  });

  it("rejects an unknown type", () => {
    seed(root, "2026-06-27");
    expect(() => runReport({ root, type: "nonsense" })).toThrow(UserError);
  });
});
