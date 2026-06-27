import pc from "picocolors";
import { bindingConstraint } from "../core/constraints.js";
import { type BoardSummary, formatAverage } from "../core/score.js";
import {
  AREAS,
  type Assessment,
  type DimensionKey,
  LENSES,
  type Level,
  TRAJECTORY_GLYPHS,
  type Trajectory,
} from "../core/types.js";

type Colorize = (s: string) => string;

// 1-2 below target (red/yellow), 3 at target (green), 4-5 above target (cyan/blue).
export function colorForLevel(level: Level): Colorize {
  switch (level) {
    case 1:
      return pc.red;
    case 2:
      return pc.yellow;
    case 3:
      return pc.green;
    case 4:
      return pc.cyan;
    case 5:
      return pc.blue;
  }
}

function cell(level: Level, trajectory: Trajectory): string {
  const text = ` ${level}${TRAJECTORY_GLYPHS[trajectory]} `;
  return colorForLevel(level)(text);
}

const LENS_HEADERS: Record<(typeof LENSES)[number], string> = {
  team: "Team",
  tools: "Tools",
  techniques: "Techniques",
};

const AREA_HEADERS: Record<(typeof AREAS)[number], string> = {
  build: "Build",
  run: "Run",
  plan: "Plan",
};

export function renderHeatmap(assessment: Assessment, summary: BoardSummary): string {
  const byKey = new Map<DimensionKey, { level: Level; trajectory: Trajectory }>(
    summary.cells.map((c) => [c.key, { level: c.level, trajectory: c.trajectory }]),
  );

  const lines: string[] = [];
  const header = `        ${LENSES.map((l) => LENS_HEADERS[l].padEnd(12)).join("")}`;
  lines.push(pc.bold(header));

  for (const area of AREAS) {
    const cells = LENSES.map((lens) => {
      const c = byKey.get(`${area}.${lens}` as DimensionKey);
      if (!c) return "".padEnd(12);
      return cell(c.level, c.trajectory).padEnd(20); // padEnd accounts for ANSI width loosely
    });
    lines.push(`${pc.bold(AREA_HEADERS[area].padEnd(8))}${cells.join("")}`);
  }

  const counts = summary.trajectoryCounts;
  const countLine = `⬆ ${counts.up}  ➡ ${counts.flat}  ⬇ ${counts.down}  ⚠ ${counts.volatile}`;
  const constraint = bindingConstraint(assessment);

  lines.push("");
  lines.push(`Average: ${pc.bold(formatAverage(summary.average))} / 5     ${countLine}`);
  lines.push(
    `Biggest constraint: ${pc.bold(constraint.key)} (level ${constraint.level}, ${constraint.trajectory})`,
  );

  return lines.join("\n");
}
