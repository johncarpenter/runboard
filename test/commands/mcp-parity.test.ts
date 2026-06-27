import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleBoard, handleStatus } from "../../mcp/handlers.js";
import { runBoard } from "../../src/commands/board.js";
import { runStatus } from "../../src/commands/status.js";
import { formatAverage, summarise } from "../../src/core/score.js";
import { latestAssessment } from "../../src/data/assessments.js";
import { cleanup, initRepo, seed } from "./helpers.js";

let root: string;
beforeEach(() => {
  root = initRepo();
});
afterEach(() => cleanup(root));

describe("MCP / CLI parity", () => {
  it("board handler average matches the CLI and the core", () => {
    seed(root, "2026-06-27", { base: 3, overrides: { "plan.tools": { level: 1 } } });

    const handler = handleBoard({ root });
    const latest = latestAssessment(root);
    if (!latest) throw new Error("seeded");
    const coreAverage = formatAverage(summarise(latest).average);

    expect(handler.average).toBe(coreAverage);
    // The CLI renders the same average in its text output.
    expect(runBoard({ root }).text).toContain(coreAverage);
  });

  it("status handler matches the CLI command result", () => {
    seed(root, "2026-01-01", { base: 5, overrides: { "build.team": { level: 2 } } });
    seed(root, "2026-02-01", { base: 5, overrides: { "build.team": { level: 2 } } });
    seed(root, "2026-03-01", { base: 5, overrides: { "build.team": { level: 2 } } });

    const handler = handleStatus({ root });
    const cli = runStatus(root);

    expect(handler.latestDate).toBe(cli.latestDate);
    expect(handler.average).toBe(cli.average);
    expect(handler.activeTriggers).toEqual(cli.activeTriggers);
  });
});
