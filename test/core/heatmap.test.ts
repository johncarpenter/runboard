import { describe, expect, it } from "vitest";
import { summarise } from "../../src/core/score.js";
import { DIMENSION_KEYS, TRAJECTORY_GLYPHS } from "../../src/core/types.js";
import type { Assessment, Level } from "../../src/core/types.js";
import { validateScores } from "../../src/data/assessments.js";
import { colorForLevel, renderHeatmap } from "../../src/render/heatmap.js";

function build(): Assessment {
  const scores = Object.fromEntries(
    DIMENSION_KEYS.map((k, i) => [
      k,
      { level: ((i % 5) + 1) as Level, trajectory: "flat", evidence: "" },
    ]),
  );
  return { date: "2026-06-27", type: "baseline", scores: validateScores(scores) };
}

describe("colorForLevel", () => {
  it("returns a function that wraps text for every level", () => {
    for (const level of [1, 2, 3, 4, 5] as Level[]) {
      expect(colorForLevel(level)("x")).toContain("x");
    }
  });
});

describe("renderHeatmap", () => {
  it("includes headers, average, glyphs, and the binding constraint", () => {
    const a = build();
    const out = renderHeatmap(a, summarise(a));
    expect(out).toContain("Build");
    expect(out).toContain("Team");
    expect(out).toContain("Average:");
    expect(out).toContain("Biggest constraint:");
    expect(out).toContain(TRAJECTORY_GLYPHS.flat);
  });
});
