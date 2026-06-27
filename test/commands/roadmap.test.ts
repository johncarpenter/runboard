import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runRoadmap } from "../../src/commands/roadmap.js";
import { runboardPaths } from "../../src/data/paths.js";
import { loadRubric } from "../../src/data/rubric.js";
import { NEXT_LIMIT, NOW_LIMIT, buildRoadmap } from "../../src/render/reports.js";
import { cleanup, initRepo, seed } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = initRepo();
});
afterEach(() => cleanup(root));

describe("roadmap", () => {
  it("writes a Now/Next/Later plan from the binding constraint", () => {
    seed(root, "2026-06-27", { base: 2, overrides: { "plan.tools": { level: 1 } } });
    const { path } = runRoadmap({ root });
    const doc = readFileSync(path, "utf8");
    expect(doc).toContain("Now");
    expect(doc).toContain("Next");
    expect(doc).toContain("Binding constraint");
  });

  it("enforces the Now and Next caps", () => {
    const assessment = seed(root, "2026-06-27", { base: 1 }); // all below target
    const rubric = loadRubric(runboardPaths(root).rubric);
    const result = buildRoadmap(assessment, rubric);
    expect(result.now.length).toBeLessThanOrEqual(NOW_LIMIT);
    expect(result.next.length).toBeLessThanOrEqual(NEXT_LIMIT);
  });

  it("requires an assessment", () => {
    expect(() => runRoadmap({ root })).toThrow(/No assessments/);
  });
});
