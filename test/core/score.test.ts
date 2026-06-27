import { describe, expect, it } from "vitest";
import { formatAverage, summarise } from "../../src/core/score.js";
import { DIMENSION_KEYS } from "../../src/core/types.js";
import type { Assessment } from "../../src/core/types.js";
import { validateScores } from "../../src/data/assessments.js";

function build(levels: number[]): Assessment {
  const scores = Object.fromEntries(
    DIMENSION_KEYS.map((k, i) => [
      k,
      { level: levels[i] ?? 3, trajectory: i % 2 === 0 ? "up" : "flat", evidence: "" },
    ]),
  );
  return { date: "2026-06-27", type: "baseline", scores: validateScores(scores) };
}

describe("summarise", () => {
  it("produces 9 cells", () => {
    expect(summarise(build([3, 3, 3, 3, 3, 3, 3, 3, 3])).cells).toHaveLength(9);
  });

  it("computes the exact average", () => {
    const summary = summarise(build([1, 2, 3, 4, 5, 1, 2, 3, 4]));
    expect(summary.average).toBeCloseTo(25 / 9, 10);
  });

  it("counts trajectories", () => {
    const summary = summarise(build([3, 3, 3, 3, 3, 3, 3, 3, 3]));
    expect(summary.trajectoryCounts.up).toBe(5);
    expect(summary.trajectoryCounts.flat).toBe(4);
    expect(summary.trajectoryCounts.down).toBe(0);
  });

  it("formats the average to one decimal", () => {
    expect(formatAverage(25 / 9)).toBe("2.8");
  });
});
