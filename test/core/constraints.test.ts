import { describe, expect, it } from "vitest";
import { bindingConstraint, rankConstraints } from "../../src/core/constraints.js";
import { DIMENSION_KEYS } from "../../src/core/types.js";
import type { Assessment, DimensionKey, Trajectory } from "../../src/core/types.js";
import { validateScores } from "../../src/data/assessments.js";

function build(
  spec: Partial<Record<DimensionKey, { level: number; trajectory?: Trajectory }>>,
): Assessment {
  const scores = Object.fromEntries(
    DIMENSION_KEYS.map((k) => [
      k,
      { level: spec[k]?.level ?? 4, trajectory: spec[k]?.trajectory ?? "flat", evidence: "" },
    ]),
  );
  return { date: "2026-06-27", type: "baseline", scores: validateScores(scores) };
}

describe("bindingConstraint", () => {
  it("picks the lowest level", () => {
    const a = build({ "plan.tools": { level: 1 } });
    expect(bindingConstraint(a).key).toBe("plan.tools");
  });

  it("breaks ties by worse trajectory", () => {
    const a = build({
      "build.team": { level: 2, trajectory: "up" },
      "run.tools": { level: 2, trajectory: "down" },
    });
    expect(bindingConstraint(a).key).toBe("run.tools");
  });

  it("breaks remaining ties by canonical dimension order", () => {
    const a = build({
      "build.team": { level: 2, trajectory: "flat" },
      "run.team": { level: 2, trajectory: "flat" },
    });
    // build.team precedes run.team in DIMENSION_KEYS
    expect(bindingConstraint(a).key).toBe("build.team");
  });

  it("ranks all nine dimensions", () => {
    expect(rankConstraints(build({}))).toHaveLength(9);
  });
});
