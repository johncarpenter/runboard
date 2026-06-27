import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DIMENSION_KEYS } from "../../src/core/types.js";
import type { Assessment } from "../../src/core/types.js";
import {
  AssessmentError,
  listAssessmentDates,
  loadAllAssessments,
  parseAssessment,
  saveAssessment,
  serializeAssessment,
  validateScores,
} from "../../src/data/assessments.js";

function fullScores(level = 3) {
  return Object.fromEntries(
    DIMENSION_KEYS.map((k) => [k, { level, trajectory: "flat", evidence: "x" }]),
  );
}

function assessment(date: string, level = 3): Assessment {
  return { date, type: "baseline", scores: validateScores(fullScores(level)) };
}

let root: string;
beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "runboard-"));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("validateScores", () => {
  it("accepts a complete record", () => {
    expect(Object.keys(validateScores(fullScores()))).toHaveLength(9);
  });

  it("rejects a missing dimension by name", () => {
    const partial = fullScores();
    (partial as Record<string, unknown>)["plan.tools"] = undefined;
    expect(() => validateScores(partial)).toThrow(/plan.tools/);
  });

  it("rejects an out-of-range level by name", () => {
    const bad = fullScores();
    bad["build.team"] = { level: 6, trajectory: "flat", evidence: "x" };
    expect(() => validateScores(bad)).toThrow(/build.team/);
  });

  it("rejects an invalid trajectory by name", () => {
    const bad = fullScores();
    bad["run.tools"] = { level: 3, trajectory: "sideways", evidence: "x" };
    expect(() => validateScores(bad)).toThrow(/run.tools/);
  });
});

describe("serialize/parse round trip", () => {
  it("preserves the assessment", () => {
    const a = assessment("2026-06-27");
    const parsed = parseAssessment(serializeAssessment(a));
    expect(parsed.date).toBe("2026-06-27");
    expect(parsed.scores["build.team"].level).toBe(3);
  });
});

describe("save/load", () => {
  it("writes then lists and loads in date order", () => {
    saveAssessment(assessment("2026-01-01", 2), root);
    saveAssessment(assessment("2026-03-01", 4), root);
    expect(listAssessmentDates(root)).toEqual(["2026-01-01", "2026-03-01"]);
    const all = loadAllAssessments(root);
    expect(all[0]?.date).toBe("2026-01-01");
    expect(all[1]?.scores["build.team"].level).toBe(4);
  });

  it("refuses to overwrite the same day without force", () => {
    saveAssessment(assessment("2026-06-27"), root);
    expect(() => saveAssessment(assessment("2026-06-27"), root)).toThrow(AssessmentError);
    expect(() => saveAssessment(assessment("2026-06-27"), root, { force: true })).not.toThrow();
  });
});
