# Command reference

All commands operate on `.runboard/` in the current working directory. Exit code is `0` on
success and `1` on a user/precondition error (with a message on stderr).

## `runboard init`

Scaffold `.runboard/` (config, a copy of the rubric, an empty `assessments/`). Idempotent —
never overwrites existing data.

## `runboard assess`

Record a 9-dimension assessment.

- **Interactive** (default): shows each dimension's anchors and prompts for level (1–5),
  trajectory (`up`/`flat`/`down`/`volatile`), and one line of evidence.
- **Non-interactive** (for agents): repeat `--set <dim>=<level>:<traj>:"<evidence>"` for
  all nine dimensions.
- `--type baseline|pulse|quarterly|event` — defaults to `baseline` for the first
  assessment, `pulse` thereafter.
- `--force` — overwrite an existing assessment for today.

Dimension keys: `build.team`, `build.tools`, `build.techniques`, `run.team`, `run.tools`,
`run.techniques`, `plan.team`, `plan.tools`, `plan.techniques`.

## `runboard board [--html]`

Render the 3×3 heatmap (colour by level, trajectory glyph per cell) with the overall
average and the binding constraint. `--html` also writes a self-contained
`.runboard/board.html` you can share.

## `runboard pulse`

Compare the two most recent assessments. Writes `.runboard/reports/pulse-<date>.md` with
per-dimension deltas and flags any dimension flat or regressing across three consecutive
assessments. Needs at least two assessments.

## `runboard roadmap`

Identify the binding constraint (lowest level; ties broken by worse trajectory) and write
`.runboard/roadmap.md` with a Now (≤ 3) / Next (≤ 5) / Later plan in business-outcome
language. Needs at least one assessment.

## `runboard report --type <type>`

Render a report from a template using the latest data:

- `board-update` — a ≤ 2-page board-pack technology section in business language.
- `baseline` — a full table of the latest assessment.
- `monthly` — a short monthly summary.

## `runboard status`

One-screen current state: latest assessment date, overall average, trajectory counts, and
any active auto-triggers.
