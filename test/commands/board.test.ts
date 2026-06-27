import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runBoard } from "../../src/commands/board.js";
import { cleanup, initRepo, seed } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = initRepo();
});
afterEach(() => cleanup(root));

describe("board", () => {
  it("renders a heatmap with average and constraint", () => {
    seed(root, "2026-06-27", { base: 3, overrides: { "plan.tools": { level: 1 } } });
    const { text } = runBoard({ root });
    expect(text).toContain("Average:");
    expect(text).toContain("Biggest constraint:");
    expect(text).toContain("plan.tools");
  });

  it("errors with no assessments", () => {
    expect(() => runBoard({ root })).toThrow(/No assessments/);
  });
});
