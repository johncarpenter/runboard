import { bindingConstraint } from "../core/constraints.js";
import { type BoardSummary, formatAverage } from "../core/score.js";
import {
  AREAS,
  type Assessment,
  type DimensionKey,
  LENSES,
  type Level,
  type Rubric,
  TRAJECTORY_GLYPHS,
} from "../core/types.js";

const LEVEL_BG: Record<Level, string> = {
  1: "#d7263d",
  2: "#f46036",
  3: "#2e933c",
  4: "#1b998b",
  5: "#2660a4",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function titleFor(rubric: Rubric, key: DimensionKey): string {
  return rubric.dimensions.find((d) => d.key === key)?.title ?? key;
}

// Returns a single self-contained HTML document — inline CSS, no external assets.
export function renderBoardHtml(
  assessment: Assessment,
  summary: BoardSummary,
  rubric: Rubric,
): string {
  const byKey = new Map(summary.cells.map((c) => [c.key, c]));
  const constraint = bindingConstraint(assessment);

  const rows = AREAS.map((area) => {
    const cells = LENSES.map((lens) => {
      const key = `${area}.${lens}` as DimensionKey;
      const c = byKey.get(key);
      if (!c) return "<td></td>";
      const score = assessment.scores[key];
      return `<td class="cell" style="background:${LEVEL_BG[c.level]}" title="${escapeHtml(
        titleFor(rubric, key),
      )}: ${escapeHtml(score.evidence)}">
        <span class="lvl">${c.level}</span>
        <span class="traj">${TRAJECTORY_GLYPHS[c.trajectory]}</span>
      </td>`;
    }).join("");
    const label = area[0]?.toUpperCase() + area.slice(1);
    return `<tr><th class="area">${label}</th>${cells}</tr>`;
  }).join("");

  const counts = summary.trajectoryCounts;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Runboard — ${assessment.date}</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 2rem; color: #1a1a1a; }
  h1 { font-size: 1.4rem; margin: 0 0 .25rem; }
  .sub { color: #555; margin: 0 0 1.5rem; }
  table { border-collapse: separate; border-spacing: 6px; }
  th.area { text-align: right; padding-right: .75rem; font-weight: 600; }
  th.lens { padding-bottom: .25rem; font-weight: 600; color: #444; }
  td.cell { width: 90px; height: 70px; border-radius: 8px; color: #fff; text-align: center; vertical-align: middle; }
  td.cell .lvl { display: block; font-size: 1.8rem; font-weight: 700; line-height: 1; }
  td.cell .traj { font-size: 1.1rem; }
  .meta { margin-top: 1.5rem; font-size: 1rem; }
  .meta strong { font-size: 1.2rem; }
  .constraint { margin-top: .5rem; padding: .75rem 1rem; background: #f4f4f5; border-radius: 8px; display: inline-block; }
</style>
</head>
<body>
  <h1>Runboard</h1>
  <p class="sub">Assessment ${assessment.date}</p>
  <table>
    <tr><th></th>${LENSES.map((l) => `<th class="lens">${l[0]?.toUpperCase()}${l.slice(1)}</th>`).join("")}</tr>
    ${rows}
  </table>
  <div class="meta">
    Average <strong>${formatAverage(summary.average)}</strong> / 5
    &nbsp;·&nbsp; ⬆ ${counts.up} &nbsp; ➡ ${counts.flat} &nbsp; ⬇ ${counts.down} &nbsp; ⚠ ${counts.volatile}
  </div>
  <div class="constraint">
    Biggest constraint: <strong>${escapeHtml(titleFor(rubric, constraint.key))}</strong>
    (level ${constraint.level}, ${constraint.trajectory})
  </div>
</body>
</html>
`;
}
