# CLI Command Contract: Runboard CLI

**Feature**: 001-runboard-cli | **Date**: 2026-06-27

The CLI is the primary interface contract. Each command below lists its arguments, the
preconditions it checks, the side effects (files written), stdout/stderr behaviour, and
exit codes. Convention: success → exit 0; user/precondition error → exit 1 with a message
on stderr; nothing is half-written on error.

Global: `runboard --version`, `runboard --help`. All commands operate on `.runboard/` in
the current working directory.

---

## `runboard init`

Scaffold `.runboard/` in the current repo.

- **Args**: none.
- **Preconditions**: none (idempotent).
- **Effects**: creates `.runboard/config.yaml`, `.runboard/rubric.yaml` (copied from the
  shipped rubric), and an empty `.runboard/assessments/`. Existing files are NOT
  overwritten or destroyed.
- **Output**: confirmation + next-step hint (`runboard assess`).
- **Exit**: 0 always (unless filesystem error).
- **Maps to**: FR-001, US1 scenario 1.

---

## `runboard assess [--type <t>] [--set <dim>=<level>:<traj>:"<evidence>"]... [--force]`

Record a 9-dimension assessment.

- **Args**:
  - `--type baseline|pulse|quarterly|event` (default: `baseline` if none exist, else
    `pulse`).
  - `--set <dim>=<level>:<traj>:"<evidence>"` — repeatable; non-interactive path. `<dim>`
    is a DimensionKey (e.g., `build.team`), `<level>` 1–5, `<traj>` up|flat|down|volatile.
  - `--force` — allow overwriting today's existing assessment.
- **Behaviour**:
  - Interactive (no `--set`): for each of the 9 dimensions, show anchors, prompt level,
    trajectory, and a one-line evidence note.
  - Non-interactive (`--set` provided): all 9 dimensions MUST be supplied; missing or
    invalid values are rejected naming the offending dimension.
- **Preconditions**: `.runboard/` exists (else instruct to run `init`). If today's file
  exists and not `--force` → refuse with guidance.
- **Effects**: writes `.runboard/assessments/<YYYY-MM-DD>.md`.
- **Output**: confirmation + path; suggests `runboard board`.
- **Exit**: 0 on success; 1 on validation failure or refused overwrite.
- **Maps to**: FR-004..FR-008, US1 scenarios 2/4/5.

---

## `runboard board [--html]`

Render the dashboard.

- **Args**: `--html` — also write a self-contained `board.html`.
- **Preconditions**: at least one assessment exists (else explain nothing to render).
- **Effects**: terminal heatmap printed; with `--html`, writes `.runboard/board.html`
  (no external assets).
- **Output**: 3×3 heatmap (colour by level, trajectory glyph per cell), overall average,
  trajectory counts.
- **Exit**: 0 on success; 1 if no data.
- **Maps to**: FR-013, FR-014, US1 scenario 3, US6.

---

## `runboard pulse`

Compare the two most recent assessments.

- **Args**: none.
- **Preconditions**: at least two assessments (else explain the prerequisite; exit 1
  non-destructively).
- **Effects**: writes `.runboard/reports/pulse-<date>.md`.
- **Output**: previous-vs-current per-dimension deltas, flagged auto-triggers (3× flat or
  regressing), a short "what moved and why it matters" summary printed + saved.
- **Exit**: 0 on success; 1 if fewer than two assessments.
- **Maps to**: FR-010, FR-011, FR-015, US2.

---

## `runboard roadmap`

Generate a Now/Next/Later plan from the latest assessment.

- **Args**: none.
- **Preconditions**: at least one assessment.
- **Effects**: writes `.runboard/roadmap.md`.
- **Output**: identified binding constraint (lowest level, ties → worse trajectory) and a
  Now/Next/Later plan; Now ≤ 3 and Next ≤ 5 enforced; items phrased as business outcomes.
- **Exit**: 0 on success; 1 if no data.
- **Maps to**: FR-012, FR-016, US3.

---

## `runboard report --type board-update|baseline|monthly`

Render a report from a template using the latest data.

- **Args**: `--type` (required) selects the template.
- **Preconditions**: at least one assessment.
- **Effects**: writes a report under `.runboard/reports/`.
- **Output**: `board-update` = a ≤ 2-page board-pack technology section in business
  language; other types render their respective templates.
- **Exit**: 0 on success; 1 if no data or unknown type.
- **Maps to**: FR-017, US4.

---

## `runboard status`

One-screen current state.

- **Args**: none.
- **Preconditions**: none; if no assessment, explain and suggest `assess`.
- **Effects**: none (read-only).
- **Output**: latest assessment date, overall average, count by trajectory, active
  auto-triggers — on one screen.
- **Exit**: 0 always.
- **Maps to**: FR-018, US5.

---

## Cross-cutting contract guarantees

- **No network**: no command performs any network I/O (Principle II / FR-003 / SC-003).
- **Determinism**: identical `.runboard/` inputs always produce identical computed output
  (SC-002, SC-005). The CLI is the reference implementation all adapters must match.
- **Atomic writes**: a command that fails validation writes nothing.
