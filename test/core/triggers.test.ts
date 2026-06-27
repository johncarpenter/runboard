import { describe, expect, it } from "vitest";
import { detectTriggers } from "../../src/core/triggers.js";
import { DIMENSION_KEYS } from "../../src/core/types.js";
import type { Assessment, DimensionKey } from "../../src/core/types.js";
import { validateScores } from "../../src/data/assessments.js";

// Build an assessment where one key has a specific level, the rest are a moving baseline.
function build(
  date: string,
  overrides: Partial<Record<DimensionKey, number>>,
  base: number,
): Assessment {
  const scores = Object.fromEntries(
    DIMENSION_KEYS.map((k) => [
      k,
      { level: overrides[k] ?? base, trajectory: "flat", evidence: "" },
    ]),
  );
  return { date, type: "baseline", scores: validateScores(scores) };
}

describe("detectTriggers", () => {
  it("returns nothing with fewer than three assessments", () => {
    const a = build("2026-01-01", {}, 3);
    const b = build("2026-02-01", {}, 3);
    expect(detectTriggers([a, b])).toEqual([]);
  });

  it("flags a dimension flat across three assessments", () => {
    const history = [
      build("2026-01-01", { "build.team": 2 }, 5),
      build("2026-02-01", { "build.team": 2 }, 5),
      build("2026-03-01", { "build.team": 2 }, 5),
    ];
    expect(detectTriggers(history)).toContain("build.team");
  });

  it("flags a regressing dimension", () => {
    const history = [
      build("2026-01-01", { "run.tools": 4 }, 5),
      build("2026-02-01", { "run.tools": 3 }, 5),
      build("2026-03-01", { "run.tools": 2 }, 5),
    ];
    expect(detectTriggers(history)).toContain("run.tools");
  });

  it("does not flag a dimension that improved within the window", () => {
    const history = [
      build("2026-01-01", { "plan.tools": 1 }, 1),
      build("2026-02-01", { "plan.tools": 2 }, 1),
      build("2026-03-01", { "plan.tools": 3 }, 1),
    ];
    expect(detectTriggers(history)).not.toContain("plan.tools");
  });

  it("does not flag a dimension already at the maximum level", () => {
    const history = [
      build("2026-01-01", { "build.tools": 5 }, 2),
      build("2026-02-01", { "build.tools": 5 }, 2),
      build("2026-03-01", { "build.tools": 5 }, 2),
    ];
    const triggers = detectTriggers(history);
    expect(triggers).not.toContain("build.tools"); // optimised, not stuck
    expect(triggers).toContain("build.team"); // genuinely flat at level 2
  });
});
