# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`runboard` is a local-first CLI that runs the Runboard framework: a technical-leadership maturity instrument scored on a 9-dimension rubric (Build/Run/Plan × Team/Tools/Techniques, 1–5 scale, with trajectory indicators). It takes a leader from "bought into the concept" to "looking at my own scorecard" in five minutes — no signup, no data leaving the machine.

It ships as a public npm package run via `npx runboard@latest`, plus portable AI adapters (SKILL.md skills, an MCP server, AGENTS.md) that all drive the same core.

**`PRODUCT-BUILD-SPEC.md` is the authoritative blueprint.** Read it before any non-trivial work — it defines the CLI surface (§4), data model (§5), rendering (§6), repo layout (§8), design rules (§9), and build order (§10). This CLAUDE.md summarizes; the spec governs.

## Status

Greenfield. As of this writing the repo contains the spec and the Spec Kit tooling only — no `package.json` or `src/` yet. Follow the build order in spec §10. Do not assume a command or file exists; verify first.

## Non-negotiable design rules (spec §9)

These are the architecture. Violating them breaks the product's premise:

1. **Deterministic core, probabilistic edge.** All math, thresholds, and state transitions live in `src/core/` as pure, side-effect-free, unit-tested functions. AI *suggests* scores; it never *computes* them. The target audience will not trust "the LLM did the average."
2. **Local-first, no phone-home.** All data stays in the user's repo under `.runboard/`. No telemetry, accounts, or network calls in v1.
3. **Git is the trajectory.** Assessments are committed markdown; trajectory reads use file/git history. The tool practises the framework's "measure trajectory, not state."
4. **One source of truth.** The CLI, MCP server, and SKILL.md skills all call `src/core/`. No scoring/delta/trigger logic is ever duplicated in an adapter — adapters only elicit input and shell out.
5. **Five-minute first run.** `npx runboard init && runboard assess` must yield a scorecard and a named binding constraint on the first sitting.

## Architecture

The layering enforces rule #1 — keep I/O, computation, and presentation separate:

- **`src/core/`** — the deterministic engine. Pure functions only, no I/O. `score.ts` (averages, level/trajectory helpers), `delta.ts` (pulse comparison), `triggers.ts` (flat/regressing-3×-consecutive auto-trigger detection), `constraints.ts` (binding-constraint identification: lowest level, ties broken by regressing trajectory). This is the verification spine — it must be green before adapters exist.
- **`src/data/`** — all load/save of assessments, config, and rubric. The only place filesystem I/O lives.
- **`src/render/`** — terminal heatmap (3×3 grid, rows Build/Run/Plan × cols Team/Tools/Techniques, colour by level 1 red→5 green, trajectory glyph per cell), self-contained `board.html`, and report templates.
- **`src/commands/`** — one file per command (`init`, `assess`, `board`, `pulse`, `roadmap`, `report`, `status`); thin orchestration over core + data + render.
- **`src/cli.ts`** — arg parsing → dispatch.
- **`skills/<name>/SKILL.md`**, **`mcp/server.ts`**, **`AGENTS.md`** — portable AI adapters. They own the *conversation* (elicitation, referencing rubric anchors, suggesting a level); the CLI owns the *computation*. `CLAUDE.md`'s product-facing counterpart `AGENTS.md` is the generic agent guide (per spec, CLAUDE.md is a symlink to AGENTS.md — note this currently differs).

Data lives under `.runboard/` in the *user's* repo (config.yaml, rubric.yaml, assessments/`<date>`.md, reports/, roadmap.md, board.html). The shipped rubric IP lives at `rubric/rubric.yaml` in this repo and is copied on `init`.

### Trajectory & scale vocabulary

- Trajectory: `up` ⬆ · `flat` ➡ · `down` ⬇ · `volatile` ⚠
- Scale: 1 Ad-hoc · 2 Repeatable · 3 Defined (target) · 4 Measured · 5 Optimising

## Stack

TypeScript → JS, Node ≥ 20. Keep dependencies lean (an arg parser, a prompt lib, a YAML lib, light templating — avoid heavy frameworks). `package.json` exposes `"bin": { "runboard": "dist/cli.js" }`. Intended scripts: `build`, `test`, `lint` (wire these when scaffolding per spec §10 step 1). Build core with unit tests *first* (spec §10 step 3) — the deterministic core is designed to be testable, so TDD it.

## How this repo is built: Spec Kit

This project is driven by **Spec Kit** (`.specify/`, v0.9.0, Claude + sh scripts, sequential branch numbering). The workflow runs through skills (invoke with the slash-command form):

- `/speckit-constitution` — fill in project principles (`.specify/memory/constitution.md` is still the unedited template).
- `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement` — the spec-to-code pipeline.
- `/speckit-analyze`, `/speckit-checklist` — quality gates.
- Git extension skills: `/speckit-git-feature` (branch), `/speckit-git-commit`, `/speckit-git-validate`, `/speckit-git-remote`, `/speckit-git-initialize`.

The Spec Kit marker block at the bottom of this file is managed by
`/speckit-agent-context-update` — leave it for that tooling to maintain.

<!-- SPECKIT START -->
Active feature: `001-runboard-cli`. For technologies, project structure, shell
commands, and design decisions, read the current plan and its design artifacts:

- Plan: `specs/001-runboard-cli/plan.md`
- Spec: `specs/001-runboard-cli/spec.md`
- Research (library choices): `specs/001-runboard-cli/research.md`
- Data model: `specs/001-runboard-cli/data-model.md`
- Contracts: `specs/001-runboard-cli/contracts/` (CLI commands, MCP tools)
- Quickstart: `specs/001-runboard-cli/quickstart.md`
<!-- SPECKIT END -->
