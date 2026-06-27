# Implementation Plan: Skills Install Command

**Branch**: `003-skills-install` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-skills-install/spec.md`

## Summary

Add a `runboard skills install [--target <dir>]` subcommand that copies the SKILL.md skill folders already bundled in the npm package into a target directory — auto-detecting a recognised agent skills location (Claude Code's `.claude/skills/` in v1) when no target is given, and accepting an explicit `--target` for any other agent. The command never fetches over the network, never silently overwrites edited files (requires `--force`), and offers a `--dry-run` preview. The decision logic (target selection, per-skill action) is a pure, unit-tested function in `src/core/`; all filesystem I/O lives in `src/data/`; the command file is thin orchestration — mirroring the existing `init`/rubric pattern.

## Technical Context

**Language/Version**: TypeScript → ESM JS, Node ≥ 20 (matches existing package).

**Primary Dependencies**: `commander` (CLI, already used), Node `node:fs`/`node:path` stdlib. No new dependencies.

**Storage**: Filesystem only. Source = package-bundled `skills/` dir; destination = an agent skills directory in the user's project. No `.runboard/` state involved.

**Testing**: `vitest` (existing). Unit tests for the pure core planner; command tests under `test/commands/` using temp dirs (same helper pattern as `init.test.ts`); a packaging assertion that `skills/` ships in the tarball.

**Target Platform**: Local developer machine / CI, invoked via `npx runboard@latest skills install` or global install.

**Project Type**: Single-project CLI (existing `src/` layout).

**Performance Goals**: Interactive; copying a handful of small markdown folders completes well under 1s. No specific throughput target.

**Constraints**: No network calls or telemetry (Constitution II). No scoring/delta/trigger/constraint logic touched (Constitution I/III). Must leave destination in a predictable state on failure.

**Scale/Scope**: 4 bundled skills today (`assess`, `pulse`, `roadmap`, `board-update`); design must not hard-code the count — enumerate whatever ships.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Deterministic Core, Probabilistic Edge | PASS | Target-selection and per-skill action decisions are pure functions in `src/core/skills.ts`; the command only performs I/O around them. No scoring logic involved. |
| II. Local-First, No Phone-Home | PASS | Pure filesystem copy from the installed package; zero network. Consistent with the existing `no-network` test posture. |
| III. Single Source of Truth | PASS | Skills are copied verbatim from the one bundled `skills/` source; no skill content is generated or duplicated. No business logic reimplemented in an adapter. |
| IV. Test Coverage Across Every Command | PASS | New command ships with unit tests (core planner) + command-level tests (auto-detect, `--target`, `--force`, `--dry-run`, failure paths) before merge. |
| V. Documentation Updated With Every Merge | PASS | README + AGENTS.md gain an "Installing the skills" section in the same change. |
| VI. Open Contribution via GitHub Issues | PASS (process) | PR references its originating issue at submission time. |

No violations — Complexity Tracking left empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-skills-install/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── cli-skills-install.md   # CLI command contract
└── tasks.md             # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
src/
├── cli.ts                     # add registerSkills(program)
├── commands/
│   └── skills.ts              # NEW: `skills install` orchestration (flags, output)
├── core/
│   └── skills.ts              # NEW: pure planner — selectTarget(), planInstall()
└── data/
    └── skills.ts              # NEW: shippedSkillsDir(), listBundledSkills(),
                               #      detectAgentDirs(), copySkill()  (all I/O here)

test/
├── core/
│   └── skills.test.ts         # NEW: unit tests for selectTarget()/planInstall()
├── commands/
│   └── skills.test.ts         # NEW: temp-dir tests for the command surface
└── packaging/
    └── pack-contents.test.ts  # extend: assert `skills/` is in the packed tarball
```

**Structure Decision**: Reuse the established three-layer split already present in the repo (`core` pure logic, `data` filesystem I/O, `commands` thin orchestration registered onto the shared commander `program`). The bundled-file locator mirrors `shippedRubricPath()` in `src/data/rubric.ts`. No new top-level directories.

## Complexity Tracking

> No constitution violations. Section intentionally empty.
