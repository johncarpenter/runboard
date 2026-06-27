---
description: "Task list for Skills Install Command"
---

# Tasks: Skills Install Command

**Input**: Design documents from `/specs/003-skills-install/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-skills-install.md, quickstart.md

**Tests**: Per Constitution Principle IV (Test Coverage Across Every Command, NON-NEGOTIABLE), `src/core/` functions are unit-tested first (red→green) and the new command carries command-level tests. Test tasks are therefore mandatory, not optional.

**Organization**: Tasks are grouped by user story. US1 and US2 are both Priority P1 (the auto-detect path and the explicit-target escape hatch are jointly the MVP); US3 (P2) adds re-install safety and preview.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 / US2 / US3 (Setup, Foundational, Polish carry no story label)
- Paths are repository-root-relative (single-project layout per plan.md)

## Path Conventions

- Logic: `src/core/skills.ts` (pure) · `src/data/skills.ts` (I/O) · `src/commands/skills.ts` (orchestration) · `src/cli.ts` (wiring)
- Tests: `test/core/skills.test.ts` · `test/commands/skills.test.ts` · `test/packaging/pack-contents.test.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create module skeletons; confirm no new dependencies are required.

- [X] T001 Confirm no new dependencies needed (uses `commander` + Node `node:fs`/`node:path` only); no `package.json` change expected
- [X] T002 [P] Create empty module `src/core/skills.ts` exporting type stubs (`TargetResolution`, `SkillAction`, `InstallPlan`) per data-model.md
- [X] T003 [P] Create empty module `src/data/skills.ts` (will hold the bundled-skill locator + I/O helpers)
- [X] T004 [P] Create empty module `src/commands/skills.ts` exporting `registerSkills(program)`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure planner, the filesystem I/O helpers, and the registered command skeleton that every user story builds on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Write unit tests for the core planner in `test/core/skills.test.ts`: `selectTarget()` precedence (explicit → single-detected → none → ambiguous) and `planInstall()` action rules (create / skip-without-force / overwrite-with-force, idempotent all-skip no-op) — tests must FAIL first
- [X] T006 Implement `selectTarget(options, detected)` and `planInstall(bundled, existingNames, { force })` in `src/core/skills.ts` to make T005 pass (pure, no I/O)
- [X] T007 [P] Implement `shippedSkillsDir()` in `src/data/skills.ts` mirroring `shippedRubricPath()` in `src/data/rubric.ts` (walk up from `import.meta.url`: `../skills` then `../../skills`)
- [X] T008 [P] Implement `listBundledSkills()` in `src/data/skills.ts` (immediate subdirs of `shippedSkillsDir()` that contain `SKILL.md`; return `BundledSkill[]`; empty result is a detectable error state per FR-002/FR-011)
- [X] T009 [P] Implement `copySkill(srcDir, destDir)` in `src/data/skills.ts` (`fs.cpSync` recursive, create parent dirs)
- [X] T010 Register a `skills` parent command with an `install` subcommand skeleton (no behaviour yet) in `src/commands/skills.ts`, and wire `registerSkills(program)` into `src/cli.ts`

**Checkpoint**: Core planner green; data helpers available; `runboard skills install` is recognised by the CLI.

---

## Phase 3: User Story 1 - Install skills into a detected agent (Priority: P1) 🎯 MVP

**Goal**: With no target, auto-detect Claude Code's `.claude/skills/` under the cwd and copy every bundled skill there, reporting what was installed.

**Independent Test**: In a temp project containing `.claude/`, run `skills install` with no flags and confirm every bundled skill is copied into `.claude/skills/` byte-faithfully.

### Tests for User Story 1

- [X] T011 [US1] Write command tests in `test/commands/skills.test.ts` (temp-dir helper from `test/commands/init.test.ts`): (a) auto-detect installs all skills into `.claude/skills/` and they are byte-faithful to the bundled source; (b) success report lists installed skills + destination; (c) no-detect-and-no-target exits 1 with guidance to pass `--target` — tests must FAIL first

### Implementation for User Story 1

- [X] T012 [US1] Implement `detectAgentDirs(cwd)` in `src/data/skills.ts` with the v1 table `[{ agent: "claude-code", relativeDir: ".claude/skills" }]`, returning only existing dirs as `DetectedAgentDir[]`
- [X] T013 [US1] Implement `runSkillsInstall()` orchestration in `src/commands/skills.ts`: gather bundled skills + detected dirs → `selectTarget` → on `none`/`ambiguous` throw `UserError` with guidance → `planInstall` → copy `create`/`overwrite` actions → print `InstallReport`
- [X] T014 [US1] Surface empty-bundle guard: if `listBundledSkills()` is empty, throw `UserError` ("package may be corrupt") in `src/commands/skills.ts` (+ assertion in the US1 test)

**Checkpoint**: `runboard skills install` works end-to-end for a Claude Code project — the MVP.

---

## Phase 4: User Story 2 - Install to an explicit target directory (Priority: P1)

**Goal**: `--target <dir>` overrides detection and installs into any directory, creating it if absent — making the command agent-agnostic today.

**Independent Test**: Run `skills install --target <empty-or-missing-dir>` and confirm all bundled skills land there regardless of any agent presence.

### Tests for User Story 2

- [X] T015 [US2] Add command tests in `test/commands/skills.test.ts`: (a) `--target` into an arbitrary empty dir copies all skills; (b) a non-existent `--target` dir is created then populated; (c) `--target` pointing at a file exits 1 with a clear error — tests must FAIL first

### Implementation for User Story 2

- [X] T016 [US2] Add the `--target <dir>` option to the `install` subcommand and pass it into `selectTarget` (explicit branch wins over detection) in `src/commands/skills.ts`
- [X] T017 [US2] Validate the resolved destination before any write (error if it exists as a file; `mkdirSync` recursive otherwise) in `src/commands/skills.ts`

**Checkpoint**: Any agent is serviceable via `--target`; US1 still passes.

---

## Phase 5: User Story 3 - Safe re-install and preview (Priority: P2)

**Goal**: `--force` is required to overwrite existing skills (no silent clobber); `--dry-run` previews the plan without writing.

**Independent Test**: Install once, edit a file, re-run without `--force` (skipped + warned), re-run with `--force` (overwritten); separately run `--dry-run` and confirm nothing is written.

### Tests for User Story 3

- [X] T018 [US3] Add command tests in `test/commands/skills.test.ts`: (a) second run without `--force` skips existing skills and writes nothing new (idempotent); (b) `--force` overwrites existing skills; (c) `--dry-run` prints the plan and writes nothing — tests must FAIL first

### Implementation for User Story 3

- [X] T019 [US3] Add `--force` and `--dry-run` options; thread `force` into `planInstall` and gate the copy step on `dryRun` (print plan, skip writes) in `src/commands/skills.ts`
- [X] T020 [US3] Ensure the report distinguishes installed / skipped / overwritten and that skip reasons mention `--force` in `src/commands/skills.ts`

**Checkpoint**: Re-runs are safe and previewable; US1 + US2 still pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Packaging guarantee, docs (Constitution V), and final validation.

- [X] T021 [P] Extend `test/packaging/pack-contents.test.ts` to assert `skills/` (and each skill's `SKILL.md`) is included in the `npm pack --dry-run` file list
- [X] T022 [P] Add an "Installing the skills" section to `README.md` documenting `runboard skills install`, `--target`, `--force`, `--dry-run`
- [X] T023 [P] Add the same install guidance to `AGENTS.md` so non-Claude agents learn the `--target` path
- [X] T024 Run `npm run lint && npm run typecheck && npm test`, then the `quickstart.md` manual smoke (dry-run from a scratch dir); fix any gaps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — start immediately
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories
- **User Stories (Phases 3–5)**: depend on Foundational; US1 and US2 are independent of each other; US3 depends on the planner's `force` path (built in Foundational) and is most meaningful after US1/US2 exist
- **Polish (Phase 6)**: depends on the user stories being complete

### Within Each User Story

- Test task is written first and must fail before its implementation tasks.
- Data helpers before command orchestration; pure planner (Foundational) before all.

### Parallel Opportunities

- T002, T003, T004 (Setup, distinct files) run in parallel.
- T007, T008, T009 (Foundational data helpers) — T007/T009 touch disjoint concerns; all in `src/data/skills.ts`, so coordinate edits or do sequentially if one developer.
- T021, T022, T023 (Polish: packaging test + two docs files) run in parallel.
- US1 and US2 can be developed in parallel by two people once Foundational is done (US2 only adds the `--target` branch + validation).

---

## Parallel Example: Setup

```bash
Task: "Create empty module src/core/skills.ts (T002)"
Task: "Create empty module src/data/skills.ts (T003)"
Task: "Create empty module src/commands/skills.ts (T004)"
```

## Parallel Example: Polish

```bash
Task: "Extend test/packaging/pack-contents.test.ts (T021)"
Task: "Add Installing the skills section to README.md (T022)"
Task: "Add install guidance to AGENTS.md (T023)"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → Phase 2 Foundational (core green, data + command registered).
2. Phase 3 US1 → **STOP and VALIDATE**: a Claude Code user can install all skills in one command.
3. This is a shippable MVP.

### Incremental Delivery

1. Foundational ready.
2. US1 → agent-detected install (MVP demo).
3. US2 → `--target` makes it agent-agnostic (demo).
4. US3 → `--force` / `--dry-run` safety (demo).
5. Polish → packaging test + docs + full validation.

---

## Notes

- [P] = different files, no incomplete-task dependency.
- Core planner stays pure (Constitution I); all `fs` lives in `src/data/skills.ts`; the command is thin (Constitution III).
- No network anywhere (Constitution II) — nothing here makes a request.
- Commit after each task or logical group; keep the build green.
