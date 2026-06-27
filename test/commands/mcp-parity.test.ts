import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  handleAssess,
  handleBoard,
  handlePulse,
  handleReport,
  handleRoadmap,
  handleStatus,
} from "../../mcp/handlers.js";
import { runAssess } from "../../src/commands/assess.js";
import { runBoard } from "../../src/commands/board.js";
import { runPulse } from "../../src/commands/pulse.js";
import { runReport } from "../../src/commands/report.js";
import { runRoadmap } from "../../src/commands/roadmap.js";
import { runStatus } from "../../src/commands/status.js";
import { bindingConstraint } from "../../src/core/constraints.js";
import { formatAverage, summarise } from "../../src/core/score.js";
import { latestAssessment } from "../../src/data/assessments.js";
import { cleanup, initRepo, seed } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = initRepo();
});
afterEach(() => cleanup(root));

describe("MCP / CLI parity", () => {
  it("assess persists the same record as the CLI", () => {
    const otherRoot = initRepo();
    try {
      const scores = Object.fromEntries(
        // Match the seed shape: every dimension at a known level.
        ["build.team", "build.tools", "build.techniques"].map((k) => [
          k,
          { level: 4, trajectory: "up" as const, evidence: "e" },
        ]),
      );
      // Fill the remaining six so both paths get a complete assessment.
      const full = (base: number) =>
        Object.fromEntries(
          [
            "build.team",
            "build.tools",
            "build.techniques",
            "run.team",
            "run.tools",
            "run.techniques",
            "plan.team",
            "plan.tools",
            "plan.techniques",
          ].map((k) => [k, { level: base, trajectory: "flat" as const, evidence: "" }]),
        );
      const scoreMap = { ...full(3), ...scores };

      const viaHandler = handleAssess({ root, scores: scoreMap, date: "2026-05-05", force: true });
      const sets = Object.entries(scoreMap).map(
        ([k, s]) => `${k}=${s.level}:${s.trajectory}:${s.evidence ?? ""}`,
      );
      const viaCli = runAssess({ root: otherRoot, sets, date: "2026-05-05", force: true });

      expect(viaHandler.date).toBe(viaCli.date);
      expect(latestAssessment(root)?.scores).toEqual(latestAssessment(otherRoot)?.scores);
    } finally {
      cleanup(otherRoot);
    }
  });

  it("board handler average and cells match the core", () => {
    seed(root, "2026-06-27", { base: 3, overrides: { "plan.tools": { level: 1 } } });

    const handler = handleBoard({ root });
    const latest = latestAssessment(root);
    if (!latest) throw new Error("seeded");
    const summary = summarise(latest);

    expect(handler.average).toBe(formatAverage(summary.average));
    expect(handler.cells).toEqual(summary.cells);
    expect(handler.trajectoryCounts).toEqual(summary.trajectoryCounts);
    expect(runBoard({ root }).text).toContain(handler.average);
  });

  it("status handler matches the CLI command result", () => {
    seed(root, "2026-01-01", { base: 5, overrides: { "build.team": { level: 2 } } });
    seed(root, "2026-02-01", { base: 5, overrides: { "build.team": { level: 2 } } });
    seed(root, "2026-03-01", { base: 5, overrides: { "build.team": { level: 2 } } });

    const handler = handleStatus({ root });
    const cli = runStatus(root);

    expect(handler.latestDate).toBe(cli.latestDate);
    expect(handler.average).toBe(cli.average);
    expect(handler.trajectoryCounts).toEqual(cli.trajectoryCounts);
    expect(handler.activeTriggers).toEqual(cli.activeTriggers);
  });

  it("pulse handler triggers match the CLI", () => {
    seed(root, "2026-01-01", { base: 4, overrides: { "build.team": { level: 2 } } });
    seed(root, "2026-02-01", { base: 4, overrides: { "build.team": { level: 2 } } });
    seed(root, "2026-03-01", { base: 4, overrides: { "build.team": { level: 2 } } });

    const handler = handlePulse({ root });
    const cli = runPulse({ root });

    expect(handler.triggers).toEqual(cli.triggers);
    expect(handler.path).toBe(cli.path);
  });

  it("roadmap handler binding constraint matches the core", () => {
    seed(root, "2026-06-27", { base: 4, overrides: { "run.techniques": { level: 1 } } });

    const handler = handleRoadmap({ root });
    const latest = latestAssessment(root);
    if (!latest) throw new Error("seeded");

    expect(handler.bindingConstraint).toEqual(bindingConstraint(latest));
    expect(handler.path).toBe(runRoadmap({ root }).path);
  });

  it("report handler writes the same file as the CLI", () => {
    seed(root, "2026-06-27", { base: 3 });

    const handler = handleReport({ root, type: "board-update" });
    const cli = runReport({ root, type: "board-update" });

    expect(handler.path).toBe(cli.path);
  });
});
