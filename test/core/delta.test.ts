import { describe, expect, it } from "vitest";
import { computeDeltas } from "../../src/core/delta.js";
import { DIMENSION_KEYS } from "../../src/core/types.js";
import type { Assessment } from "../../src/core/types.js";
import { validateScores } from "../../src/data/assessments.js";

function build(date: string, levels: number[]): Assessment {
  const scores = Object.fromEntries(
    DIMENSION_KEYS.map((k, i) => [k, { level: levels[i] ?? 3, trajectory: "flat", evidence: "" }]),
  );
  return { date, type: "baseline", scores: validateScores(scores) };
}

describe("computeDeltas", () => {
  it("computes per-dimension change", () => {
    const prev = build("2026-01-01", [2, 2, 2, 2, 2, 2, 2, 2, 2]);
    const curr = build("2026-02-01", [3, 1, 2, 4, 2, 2, 2, 2, 2]);
    const deltas = computeDeltas(prev, curr);
    expect(deltas).toHaveLength(9);
    expect(deltas[0]).toMatchObject({ key: "build.team", from: 2, to: 3, change: 1 });
    expect(deltas[1]).toMatchObject({ change: -1 });
    expect(deltas[2]).toMatchObject({ change: 0 });
  });
});
