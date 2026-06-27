# Implementation Plan: Runboard CLI

**Branch**: `001-runboard-cli` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-runboard-cli/spec.md`

## Summary

Build a local-first Node/TypeScript CLI (`runboard`) that runs the Runboard 9-dimension
maturity framework. A deterministic, pure-function core does all computation (scoring,
deltas, auto-triggers, binding constraints); thin command, render, and data layers wrap
it; and portable AI adapters (SKILL.md skills, an MCP server, AGENTS.md) drive the same
core without ever computing results themselves. Distributed via `npx runboard@latest`.
The technical approach is fixed by PRODUCT-BUILD-SPEC.md; this plan selects concrete
libraries and lays out the build order.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js ≥ 20, ESM modules.

**Primary Dependencies**:
- `commander` — CLI arg parsing / subcommand dispatch.
- `@clack/prompts` — interactive elicitation prompts.
- `yaml` (eemeli/yaml) — rubric/config/frontmatter parse + serialize with precise errors.
- `eta` — lightweight templating for reports and the HTML board.
- `picocolors` — tiny ANSI colouring for the terminal heatmap.
- `@modelcontextprotocol/sdk` — MCP server (stdio transport) for `runboard-mcp`.

**Storage**: Local files only, under `.runboard/` in the user's own repo. Assessments are
Markdown with YAML frontmatter; rubric and config are YAML. No database. Git history is
the trajectory record.

**Testing**: `vitest` with V8 coverage. Unit tests on `src/core/` (pure functions) written
first; command/integration tests exercise each CLI command end to end against a temp dir.

**Target Platform**: Cross-platform CLI (macOS/Linux/Windows) on Node ≥ 20; zero-install
via `npx`, plus `npm i -g`.

**Project Type**: Single project (CLI tool + library core + adapters). `src/` and `test/`
at repository root.

**Performance Goals**: First run (`init` → `assess` → `board`) completable in under five
minutes of human time; every command returns in well under one second on typical data
(tens of assessments). No network latency by design.

**Constraints**: No network calls, no telemetry, no accounts (Principle II). All
computation deterministic and pure (Principle I). One computation core shared by all
entry points (Principle III). Lean dependency footprint — no heavy frameworks.

**Scale/Scope**: Single user per repo; expect 1–50 assessments over a project's life.
7 commands, 9 rubric dimensions, 4 SKILL.md adapters, 1 MCP server.

**Toolchain**: `tsup` to bundle the `dist/cli.js` bin (shebang) and `dist/mcp.js`; `tsc`
for type-checking; `biome` for lint + format (single lean tool covering both).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan complies | Status |
|-----------|------------------------|--------|
| I. Deterministic Core, Probabilistic Edge | All math/state in `src/core/` as pure functions, no I/O; adapters only elicit + persist. | PASS |
| II. Local-First, No Phone-Home | No network deps; all data under `.runboard/`; a test asserts zero network use. | PASS |
| III. Single Source of Truth | CLI, MCP, and skills all call `src/core/` (skills shell out to the CLI). No logic duplicated in adapters. | PASS |
| IV. Test Coverage Across Every Command (NON-NEGOTIABLE) | `vitest`; core unit-tested first (red-green); every command has an integration test. | PASS |
| V. Documentation Updated With Every Merge | README quickstart + `docs/` in Markdown; docs updates required per behaviour change. | PASS |
| VI. Open Contribution via GitHub Issues | CONTRIBUTING.md + issue/PR templates; CI runs lint+test on PRs. | PASS |
| Stack/Distribution/UX constraints | TS/Node ≥20, lean deps, `npx` bin, five-minute first run, shipped rubric. | PASS |

**Result**: No violations. Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-runboard-cli/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (CLI command + MCP tool contracts)
│   ├── cli-commands.md
│   └── mcp-tools.md
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── cli.ts                  # arg parsing → command dispatch (commander)
├── commands/               # one file per command — thin orchestration
│   ├── init.ts
│   ├── assess.ts
│   ├── pulse.ts
│   ├── roadmap.ts
│   ├── board.ts
│   ├── report.ts
│   └── status.ts
├── core/                   # DETERMINISTIC engine — pure functions, no I/O
│   ├── types.ts            # shared domain types (Dimension, Assessment, ...)
│   ├── score.ts            # averages, level/trajectory helpers
│   ├── delta.ts            # pulse comparison
│   ├── triggers.ts         # flat/regressing-3× detection
│   └── constraints.ts      # binding-constraint identification
├── data/                   # all I/O: load/save assessments, config, rubric
│   ├── paths.ts            # .runboard/ layout resolution
│   ├── assessments.ts      # read/write dated assessment files (md+frontmatter)
│   ├── config.ts
│   └── rubric.ts
└── render/                 # presentation
    ├── heatmap.ts          # terminal 3×3 heatmap
    ├── board-html.ts       # self-contained board.html
    └── reports.ts          # pulse / roadmap / board-update via eta templates

test/
├── core/                   # unit tests (written first)
├── commands/               # per-command integration tests against temp dirs
└── fixtures/               # sample assessments for tests

rubric/
└── rubric.yaml             # shipped 9-dim rubric (the IP)

templates/                  # eta report skeletons (pulse, roadmap, board-update, ...)
skills/                     # SKILL.md adapters: assess, pulse, roadmap, board-update
mcp/
└── server.ts               # MCP server over core (npx runboard-mcp)
examples/
└── .runboard/              # sample data so `board` demos instantly
docs/                       # Markdown user docs
AGENTS.md                   # generic agent guide (CLAUDE.md references/symlinks it)
```

**Structure Decision**: Single project. The layering (`core` pure → `data` I/O → `render`
presentation → `commands` orchestration → adapters) is the physical enforcement of
Constitution Principles I and III: computation cannot leak into I/O or adapters because it
lives in a dependency-free module that everything else imports.

## Complexity Tracking

> No constitution violations. No entries required.
