import { writeFileSync } from "node:fs";
import type { Command } from "commander";
import { type BoardSummary, summarise } from "../core/score.js";
import type { Assessment } from "../core/types.js";
import { latestAssessment, listAssessmentDates } from "../data/assessments.js";
import { runboardPaths } from "../data/paths.js";
import { loadRubric } from "../data/rubric.js";
import { renderBoardHtml } from "../render/board-html.js";
import { renderHeatmap } from "../render/heatmap.js";
import { requireAssessments, requireInit } from "./shared.js";

export interface BoardOptions {
  root?: string;
  html?: boolean;
}

export interface BoardResult {
  text: string;
  assessment: Assessment;
  summary: BoardSummary;
  htmlPath?: string;
}

export function runBoard(opts: BoardOptions = {}): BoardResult {
  const root = opts.root ?? process.cwd();
  requireInit(root);
  requireAssessments(listAssessmentDates(root));
  const assessment = latestAssessment(root);
  if (!assessment) {
    // requireAssessments already guards this; satisfies the type checker.
    throw new Error("unreachable");
  }
  const summary = summarise(assessment);
  const text = renderHeatmap(assessment, summary);

  if (opts.html) {
    const rubric = loadRubric(runboardPaths(root).rubric);
    const htmlPath = runboardPaths(root).boardHtml;
    writeFileSync(htmlPath, renderBoardHtml(assessment, summary, rubric), "utf8");
    return { text, assessment, summary, htmlPath };
  }
  return { text, assessment, summary };
}

export function registerBoard(program: Command): void {
  program
    .command("board")
    .description("Render the 3×3 heatmap; --html writes a shareable board.html.")
    .option("--html", "also write a self-contained board.html")
    .action((options: { html?: boolean }) => {
      const { text, htmlPath } = runBoard({ html: options.html });
      process.stdout.write(`${text}\n`);
      if (htmlPath) {
        process.stdout.write(`\nWrote ${htmlPath}\n`);
      }
    });
}
