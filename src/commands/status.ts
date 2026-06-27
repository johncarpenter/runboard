import type { Command } from "commander";
import { formatAverage, summarise } from "../core/score.js";
import { detectTriggers } from "../core/triggers.js";
import { loadAllAssessments } from "../data/assessments.js";
import { requireInit } from "./shared.js";

export interface StatusResult {
  latestDate?: string;
  average?: string;
  trajectoryCounts?: Record<string, number>;
  activeTriggers: string[];
  empty: boolean;
}

export function runStatus(root: string = process.cwd()): StatusResult {
  requireInit(root);
  const all = loadAllAssessments(root);
  if (all.length === 0) {
    return { activeTriggers: [], empty: true };
  }
  const latest = all[all.length - 1];
  if (!latest) throw new Error("unreachable");
  const summary = summarise(latest);
  return {
    latestDate: latest.date,
    average: formatAverage(summary.average),
    trajectoryCounts: summary.trajectoryCounts,
    activeTriggers: detectTriggers(all),
    empty: false,
  };
}

export function registerStatus(program: Command): void {
  program
    .command("status")
    .description("One-screen current state.")
    .action(() => {
      const s = runStatus();
      if (s.empty) {
        process.stdout.write("No assessments yet. Run `runboard assess` to record one.\n");
        return;
      }
      const counts = s.trajectoryCounts ?? {};
      process.stdout.write(
        [
          `Latest assessment: ${s.latestDate}`,
          `Average:           ${s.average} / 5`,
          `Trajectory:        ⬆ ${counts.up ?? 0}  ➡ ${counts.flat ?? 0}  ⬇ ${counts.down ?? 0}  ⚠ ${counts.volatile ?? 0}`,
          `Active triggers:   ${s.activeTriggers.length ? s.activeTriggers.join(", ") : "none"}`,
          "",
        ].join("\n"),
      );
    });
}
