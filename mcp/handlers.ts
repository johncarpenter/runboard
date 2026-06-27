import { runAssess } from "../src/commands/assess.js";
import { runBoard } from "../src/commands/board.js";
import { runPulse } from "../src/commands/pulse.js";
import { runReport } from "../src/commands/report.js";
import { runRoadmap } from "../src/commands/roadmap.js";
import { runStatus } from "../src/commands/status.js";
// Thin handlers shared by the MCP server. They call the SAME core + data modules the CLI
// uses — no scoring/delta/trigger logic lives here (Constitution Principle III).
import { bindingConstraint } from "../src/core/constraints.js";
import { formatAverage, summarise } from "../src/core/score.js";
import { detectTriggers } from "../src/core/triggers.js";
import { latestAssessment } from "../src/data/assessments.js";

export interface HandlerContext {
  root?: string;
}

export function handleAssess(args: {
  scores: Record<string, { level: number; trajectory: string; evidence?: string }>;
  type?: string;
  force?: boolean;
  date?: string;
  root?: string;
}): { date: string; path: string; written: true } {
  // Reuse the CLI path by encoding scores as --set entries so behaviour is identical.
  const sets = Object.entries(args.scores).map(
    ([key, s]) => `${key}=${s.level}:${s.trajectory}:${s.evidence ?? ""}`,
  );
  const { date, path } = runAssess({
    root: args.root,
    sets,
    type: args.type,
    force: args.force,
    date: args.date,
  });
  return { date, path, written: true };
}

export function handleBoard(ctx: HandlerContext & { html?: boolean }) {
  const { htmlPath } = runBoard({ root: ctx.root, html: ctx.html });
  const latest = latestAssessment(ctx.root);
  if (!latest) throw new Error("unreachable");
  const summary = summarise(latest);
  return {
    cells: summary.cells,
    average: formatAverage(summary.average),
    trajectoryCounts: summary.trajectoryCounts,
    ...(htmlPath ? { htmlPath } : {}),
  };
}

export function handlePulse(ctx: HandlerContext) {
  const { path, triggers } = runPulse({ root: ctx.root });
  return { path, triggers };
}

export function handleRoadmap(ctx: HandlerContext) {
  const { path } = runRoadmap({ root: ctx.root });
  const latest = latestAssessment(ctx.root);
  if (!latest) throw new Error("unreachable");
  return { path, bindingConstraint: bindingConstraint(latest) };
}

export function handleReport(ctx: HandlerContext & { type: string }) {
  const { path } = runReport({ root: ctx.root, type: ctx.type });
  return { path };
}

export function handleStatus(ctx: HandlerContext) {
  const s = runStatus(ctx.root);
  return {
    latestDate: s.latestDate ?? null,
    average: s.average ?? null,
    trajectoryCounts: s.trajectoryCounts ?? {},
    activeTriggers: s.activeTriggers,
  };
}

// Used by the status/board handlers and the parity test.
export { detectTriggers };
