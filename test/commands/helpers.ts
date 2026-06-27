import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { runInit } from "../../src/commands/init.js";
import { DIMENSION_KEYS } from "../../src/core/types.js";
import type { Assessment, DimensionKey, Trajectory } from "../../src/core/types.js";
import { saveAssessment, validateScores } from "../../src/data/assessments.js";

export function makeRepo(): string {
  return mkdtempSync(path.join(tmpdir(), "runboard-it-"));
}

export function cleanup(root: string): void {
  rmSync(root, { recursive: true, force: true });
}

export function initRepo(): string {
  const root = makeRepo();
  runInit(root);
  return root;
}

export interface SeedSpec {
  base?: number;
  trajectory?: Trajectory;
  overrides?: Partial<Record<DimensionKey, { level: number; trajectory?: Trajectory }>>;
}

export function seed(root: string, date: string, spec: SeedSpec = {}): Assessment {
  const base = spec.base ?? 3;
  const scores = validateScores(
    Object.fromEntries(
      DIMENSION_KEYS.map((k) => [
        k,
        {
          level: spec.overrides?.[k]?.level ?? base,
          trajectory: spec.overrides?.[k]?.trajectory ?? spec.trajectory ?? "flat",
          evidence: "",
        },
      ]),
    ),
  );
  const assessment: Assessment = { date, type: "baseline", scores };
  saveAssessment(assessment, root, { force: true });
  return assessment;
}

// Build repeatable --set flag strings for the non-interactive assess path.
export function setFlags(base = 3, trajectory: Trajectory = "flat"): string[] {
  return DIMENSION_KEYS.map((k) => `${k}=${base}:${trajectory}:note for ${k}`);
}
