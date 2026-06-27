---
description: "Task list for Runboard CLI implementation"
---

# Tasks: Runboard CLI

**Input**: Design documents from `/specs/001-runboard-cli/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: REQUIRED. Per Constitution Principle IV (Test Coverage Across Every Command,
NON-NEGOTIABLE), `src/core/` functions are unit-tested first (red-green) and every command
has an integration test. Test tasks below are not optional.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md) for independent
implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story the task belongs to (Setup/Foundational/Polish carry no label)

## Path Conventions

Single project: `src/`, `test/` at repository root (per plan.md Structure Decision).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, toolchain, and the shipped rubric.

- [x] T001 Initialize npm project: create `package.json` (type=module, Node ≥20 engines, `bin` mapping `runboard`→`dist/cli.js` and `runboard-mcp`→`dist/mcp.js`, scripts `build`/`test`/`lint`/`typecheck`, `files` allowlist) and `tsconfig.json` (ESM, strict)
- [x] T002 [P] Configure build/lint/test tooling: `tsup.config.ts` (bundle `src/cli.ts` and `mcp/server.ts` with shebangs), `biome.json` (lint + format), `vitest.config.ts` (V8 coverage)
- [x] T003 [P] Add CI workflow `.github/workflows/ci.yml` running `lint` + `typecheck` + `test` on PRs, and verifying `npx .` runs
- [x] T004 [P] Add `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md`, `LICENSE`, and a `README.md` skeleton (per Constitution Principles V & VI)
- [x] T005 Author `rubric/rubric.yaml` — 9 dimensions (build/run/plan × team/tools/techniques) each with 5 anchored level descriptions and a `version` field

**Checkpoint**: `npm install && npm run build` succeeds on an empty CLI skeleton.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared domain types, data I/O, base scoring, and CLI dispatch that every user
story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Define core domain types in `src/core/types.ts` (Area, Lens, DimensionKey, Level, Trajectory, AssessmentType, DimensionScore, Assessment, Rubric, Config) and the canonical `DIMENSION_KEYS` ordering
- [x] T007 [P] Unit tests for type invariants in `test/core/types.test.ts` (all 9 DimensionKeys present, area×lens product is exhaustive)
- [x] T008 Implement `src/data/paths.ts` — resolve the `.runboard/` layout (config, rubric, assessments/, reports/, roadmap.md, board.html)
- [x] T009 [P] Implement `src/data/rubric.ts` — load + validate the shipped rubric (exactly 9 dims, 5 anchors each), naming any defect
- [x] T010 [P] Unit tests for rubric load/validate in `test/core/rubric.test.ts` (rejects missing dimension / missing anchor)
- [x] T011 [P] Implement `src/data/config.ts` — read/write `.runboard/config.yaml`
- [x] T012 [P] Implement `src/data/assessments.ts` — read/write dated `assessments/<YYYY-MM-DD>.md` (YAML frontmatter + narrative), validate all 9 scores (FR-008), refuse same-day overwrite without force (FR-007), and order by date
- [x] T013 [P] Unit tests for assessment load/save/validate/ordering in `test/core/assessments.test.ts`
- [x] T014 Implement `src/core/score.ts` — per-cell board summary, overall average, trajectory counts (pure)
- [x] T015 [P] Unit tests for `src/core/score.ts` in `test/core/score.test.ts`
- [x] T016 Implement `src/cli.ts` skeleton — commander dispatch, `--version`, `--help`, and a `.runboard/`-missing guard helper

**Checkpoint**: Core types + data I/O + scoring are green; CLI runs `--help`/`--version`.

---

## Phase 3: User Story 1 - See my own scorecard in five minutes (Priority: P1) 🎯 MVP

**Goal**: From an empty project, `init` → `assess` → `board` yields a heatmap, overall
average, and a named binding constraint, with no network activity.

**Independent Test**: Run the three commands against a temp dir; assert a 9-cell heatmap,
an average, a trajectory glyph per cell, and one binding constraint appear; assert no
network calls.

### Tests for User Story 1 (write first, ensure they FAIL) ⚠️

- [x] T017 [P] [US1] Integration test for `init` (scaffold + idempotent, no data loss) in `test/commands/init.test.ts`
- [x] T018 [P] [US1] Integration test for `assess` (interactive happy path, `--set` non-interactive path, invalid value rejected by name, same-day overwrite refused without `--force`) in `test/commands/assess.test.ts`
- [x] T019 [P] [US1] Integration test for `board` terminal render (heatmap cells, average, trajectory counts; errors with no data) in `test/commands/board.test.ts`
- [x] T020 [P] [US1] Unit test for `src/render/heatmap.ts` (level→colour mapping, trajectory glyphs) in `test/core/heatmap.test.ts`

### Implementation for User Story 1

- [x] T021 [US1] Implement `src/commands/init.ts` — scaffold `.runboard/` (config, copied rubric, empty assessments/), idempotent, print next-step hint (FR-001)
- [x] T022 [US1] Implement `src/render/heatmap.ts` — 3×3 terminal heatmap (picocolors), level colour + trajectory glyph, average + trajectory counts (FR-013)
- [x] T023 [US1] Implement `src/commands/assess.ts` — interactive elicitation (@clack/prompts, show anchors per dimension) + `--set` parsing + `--type`/`--force`; persist via `src/data/assessments.ts` (FR-004..FR-008)
- [x] T024 [US1] Implement `src/commands/board.ts` (terminal path) using `src/core/score.ts` + `src/core/constraints` binding-constraint label hook (FR-013)
- [x] T025 [US1] Register `init`, `assess`, `board` in `src/cli.ts`

**Checkpoint**: US1 fully functional and independently testable — this is the MVP.

---

## Phase 4: User Story 2 - Track whether things are getting better (Priority: P2)

**Goal**: With ≥2 assessments, `pulse` writes a one-page delta memo and flags any
dimension flat/regressing across 3 consecutive assessments.

**Independent Test**: Seed 2–3 fixture assessments; run `pulse`; assert per-dimension
deltas and correct auto-trigger flags in the memo.

### Tests for User Story 2 (write first) ⚠️

- [x] T026 [P] [US2] Unit test for `src/core/delta.ts` (per-dimension change between latest two) in `test/core/delta.test.ts`
- [x] T027 [P] [US2] Unit test for `src/core/triggers.ts` (3× flat/regressing detection; <3 assessments ⇒ none) in `test/core/triggers.test.ts`
- [x] T028 [P] [US2] Integration test for `pulse` (memo written, summary printed, <2 assessments handled non-destructively) in `test/commands/pulse.test.ts`

### Implementation for User Story 2

- [x] T029 [P] [US2] Implement `src/core/delta.ts` — per-dimension delta of the two most recent assessments (FR-010)
- [x] T030 [P] [US2] Implement `src/core/triggers.ts` — flag dimensions flat/regressing across 3 consecutive assessments (FR-011)
- [x] T031 [US2] Add `templates/pulse.eta` and implement pulse rendering in `src/render/reports.ts` (FR-015)
- [x] T032 [US2] Implement `src/commands/pulse.ts` (write `reports/pulse-<date>.md`, print summary) and register in `src/cli.ts`

**Checkpoint**: US1 + US2 both work independently.

---

## Phase 5: User Story 3 - Know what to work on next (Priority: P3)

**Goal**: `roadmap` identifies the binding constraint and writes a Now/Next/Later plan
(Now ≤ 3, Next ≤ 5) phrased as business outcomes.

**Independent Test**: With a latest assessment, run `roadmap`; assert the lowest-level
dimension (ties → worse trajectory) drives "Now", and the caps are enforced.

### Tests for User Story 3 (write first) ⚠️

- [x] T033 [P] [US3] Unit test for `src/core/constraints.ts` (lowest level; tie broken by worse trajectory; deterministic final tiebreak) in `test/core/constraints.test.ts`
- [x] T034 [P] [US3] Integration test for `roadmap` (Now ≤ 3, Next ≤ 5, business-outcome phrasing) in `test/commands/roadmap.test.ts`

### Implementation for User Story 3

- [x] T035 [US3] Implement `src/core/constraints.ts` — binding-constraint identification (FR-012)
- [x] T036 [US3] Add `templates/roadmap.eta` and roadmap rendering in `src/render/reports.ts` with Now ≤ 3 / Next ≤ 5 enforcement (FR-016)
- [x] T037 [US3] Implement `src/commands/roadmap.ts` (write `roadmap.md`) and register in `src/cli.ts`

**Checkpoint**: US1–US3 independently functional.

---

## Phase 6: User Story 4 - Produce a board-ready report (Priority: P3)

**Goal**: `report --type board-update` renders a ≤2-page business-language doc from a
template using latest data; other types render their templates.

**Independent Test**: With latest data, run `report --type board-update`; assert a
business-language document is produced from the template; unknown type errors.

### Tests for User Story 4 (write first) ⚠️

- [x] T038 [P] [US4] Integration test for `report` (board-update produced; baseline/monthly types; unknown type rejected) in `test/commands/report.test.ts`

### Implementation for User Story 4

- [x] T039 [P] [US4] Add `templates/board-update.eta`, `templates/baseline.eta`, `templates/monthly.eta` (business-language, jargon translation)
- [x] T040 [US4] Extend `src/render/reports.ts` to render a report by `--type` from latest data (FR-017)
- [x] T041 [US4] Implement `src/commands/report.ts` and register in `src/cli.ts`

**Checkpoint**: US1–US4 independently functional.

---

## Phase 7: User Story 5 - Check current state at a glance (Priority: P4)

**Goal**: `status` prints latest date, overall average, trajectory counts, and active
auto-triggers on one screen; empty state explained.

**Independent Test**: With ≥1 assessment, run `status`; assert one-screen summary;
empty-state path explains and suggests `assess`.

### Tests for User Story 5 (write first) ⚠️

- [x] T042 [P] [US5] Integration test for `status` (populated summary + empty-state guidance) in `test/commands/status.test.ts`

### Implementation for User Story 5

- [x] T043 [US5] Implement `src/commands/status.ts` reusing `src/core/score.ts` + `src/core/triggers.ts` (FR-018) and register in `src/cli.ts`

**Checkpoint**: US1–US5 independently functional.

---

## Phase 8: User Story 6 - Share the board as a file (Priority: P4)

**Goal**: `board --html` writes a single self-contained file that opens with no external
assets or network.

**Independent Test**: Run `board --html`; assert one `.html` is written and contains the
heatmap with inline styles and no external/CDN references.

### Tests for User Story 6 (write first) ⚠️

- [x] T044 [P] [US6] Integration test for `board --html` (self-contained: no external `src`/`href`/CDN, renders heatmap) in `test/commands/board-html.test.ts`

### Implementation for User Story 6

- [x] T045 [US6] Implement `src/render/board-html.ts` — self-contained `board.html` (inline CSS, no external assets) (FR-014)
- [x] T046 [US6] Wire the `--html` flag in `src/commands/board.ts` to write `.runboard/board.html`

**Checkpoint**: US1–US6 independently functional.

---

## Phase 9: User Story 7 - Drive the tool from any AI agent (Priority: P4)

**Goal**: Portable SKILL.md adapters and an MCP server elicit input and persist via the
core, producing records identical to the CLI path (no computation in adapters).

**Independent Test**: Run an MCP tool call and a SKILL.md-driven flow against a fixture;
assert outputs equal the equivalent CLI command outputs.

### Tests for User Story 7 (write first) ⚠️

- [x] T047 [P] [US7] Parity test: MCP tools vs CLI commands produce identical results for the same `.runboard/` fixture in `test/commands/mcp-parity.test.ts`

### Implementation for User Story 7

- [x] T048 [P] [US7] Write `skills/assess/SKILL.md` (elicit + shell out to `runboard assess --set ...`)
- [x] T049 [P] [US7] Write `skills/pulse/SKILL.md`
- [x] T050 [P] [US7] Write `skills/roadmap/SKILL.md`
- [x] T051 [P] [US7] Write `skills/board-update/SKILL.md`
- [x] T052 [US7] Implement `mcp/server.ts` — stdio MCP server exposing `runboard_assess`/`pulse`/`roadmap`/`board`/`status` as thin wrappers over `src/core/` + `src/data/` (FR-020, FR-021)
- [x] T053 [US7] Write `AGENTS.md` (generic agent guide) and reconcile the `CLAUDE.md`↔`AGENTS.md` relationship per spec §7

**Checkpoint**: All user stories independently functional across every entry point.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Demo data, guarantees, docs, and release readiness.

- [x] T054 Add `examples/.runboard/` sample assessments and verify `runboard board` renders them instantly (FR-022, SC-008)
- [x] T055 [P] Add a no-network guarantee test asserting zero network calls across commands in `test/core/no-network.test.ts` (Principle II, SC-003)
- [x] T056 [P] Write user docs in `docs/` and finalize `README.md` quickstart with the local-first guarantee stated prominently (FR-023)
- [x] T057 [P] Verify coverage: every command has an integration test and core has unit tests; enforce in `vitest.config.ts` thresholds (SC-006)
- [x] T058 Validate `quickstart.md` end to end via `npx .` and confirm the `files` allowlist ships rubric/templates/skills/examples

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3–9)**: all depend on Foundational. US1 is the MVP. US2–US7 each
  depend only on Foundational (plus US1's `board` for US6's `--html`, and US1's `assess`
  data for US2–US5 to have something to read). They are otherwise independent and testable
  in isolation with fixtures.
- **Polish (Phase 10)**: depends on the targeted stories being complete.

### Story Dependencies

- US1 (P1): after Foundational — no dependency on other stories.
- US2 (P2): after Foundational; reads assessment data (use fixtures to test independently).
- US3 (P3): after Foundational; reads latest assessment (fixtures ok).
- US4 (P3): after Foundational; reads latest assessment (fixtures ok).
- US5 (P4): after Foundational; reuses score + triggers.
- US6 (P4): extends US1's `board` command with `--html`.
- US7 (P4): wraps all commands; best after the commands it exposes exist, but skills/MCP
  can be stubbed and parity-tested per command as each lands.

### Within Each Story

- Tests written first and FAIL before implementation.
- Core (pure) before render before command before cli registration.

## Parallel Opportunities

- Setup: T002, T003, T004 in parallel (different files).
- Foundational: T007, T009/T010, T011, T012/T013, T015 are parallel-friendly (distinct
  files) once T006 (types) lands.
- Within a story, all test tasks marked [P] run in parallel, then the [P] core modules.
- Different user stories can be staffed in parallel once Foundational is done.

### Parallel Example: User Story 1

```bash
# Tests first, together:
Task: "Integration test for init in test/commands/init.test.ts"        # T017
Task: "Integration test for assess in test/commands/assess.test.ts"    # T018
Task: "Integration test for board in test/commands/board.test.ts"      # T019
Task: "Unit test for render/heatmap in test/core/heatmap.test.ts"      # T020
```

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → **STOP & VALIDATE**: run
   `init` → `assess` → `board`, confirm the five-minute first run (SC-001). Ship as MVP.

### Incremental Delivery

Add US2 (pulse) → US3 (roadmap) → US4 (report) → US5 (status) → US6 (board html) →
US7 (adapters), validating each independently before moving on. Each story adds value
without breaking prior ones.

## Notes

- [P] = different files, no incomplete-task dependencies.
- Verify tests fail before implementing (Constitution Principle IV).
- Commit after each task or logical group; keep the build green.
- Update Markdown docs in the same change as any user-observable behaviour (Principle V).
