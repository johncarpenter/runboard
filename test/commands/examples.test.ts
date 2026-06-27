import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runBoard } from "../../src/commands/board.js";
import { runStatus } from "../../src/commands/status.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const examplesRoot = path.resolve(here, "../../examples");

describe("shipped examples", () => {
  it("renders a populated board from sample data", () => {
    const { text } = runBoard({ root: examplesRoot });
    expect(text).toContain("Average:");
    expect(text).toContain("Biggest constraint:");
    // plan.tools sits at level 1 across the samples — the obvious binding constraint.
    expect(text).toContain("plan.tools");
  });

  it("flags the stuck dimension via status", () => {
    const s = runStatus(examplesRoot);
    expect(s.empty).toBe(false);
    expect(s.activeTriggers).toContain("plan.tools");
  });
});
