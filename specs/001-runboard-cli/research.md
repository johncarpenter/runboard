# Phase 0 Research: Runboard CLI

**Feature**: 001-runboard-cli | **Date**: 2026-06-27

The product spec (PRODUCT-BUILD-SPEC.md §3) fixes the stack at a high level (TypeScript,
Node ≥ 20, npx, lean deps). No spec requirements were left as NEEDS CLARIFICATION. The
research below resolves the remaining *library-level* choices, each weighed against
Constitution Principle "lean dependencies, no heavy frameworks."

## Decision: Module system & language — ESM TypeScript 5.x, Node ≥ 20

- **Rationale**: Node ≥ 20 has stable ESM; the MCP SDK and modern tooling are ESM-first.
  TS gives the typed domain model the deterministic core benefits from.
- **Alternatives considered**: CommonJS (rejected — friction with ESM-only deps);
  plain JS (rejected — loses compile-time guarantees on the scoring model).

## Decision: CLI framework — `commander`

- **Rationale**: De-facto standard, tiny, declarative subcommands and flags, supports the
  `--set <dim>=<level>:<traj>:"<evidence>"` repeatable-flag pattern the spec needs for the
  non-interactive agent path.
- **Alternatives considered**: `yargs` (heavier API surface); `oclif` (a full framework —
  violates "no heavy frameworks"); hand-rolled parsing (rejected — reinvents validation).

## Decision: Interactive prompts — `@clack/prompts`

- **Rationale**: Small, modern, attractive prompts with built-in cancel handling; good fit
  for the per-dimension elicitation (select level, select trajectory, text evidence).
- **Alternatives considered**: `prompts` (fine, less polished UX); `inquirer` (large
  dependency tree); raw readline (too much boilerplate, weak validation).

## Decision: YAML — `yaml` (eemeli/yaml)

- **Rationale**: Round-trips comments/formatting, precise error positions (supports
  FR-008 "name the problem" and the malformed-file edge case), and parses the assessment
  frontmatter + rubric + config.
- **Alternatives considered**: `js-yaml` (older, weaker error detail); hand-parsing
  (rejected).

## Decision: Templating — `eta`

- **Rationale**: Tiny, fast, no runtime compilation surprises; renders the pulse memo,
  roadmap, board-update report, and the self-contained `board.html`. Spec explicitly
  permits `eta` or string templates.
- **Alternatives considered**: Plain template literals (viable for small templates, but
  reports benefit from partials/loops); Handlebars/EJS (larger).

## Decision: Terminal colour — `picocolors`

- **Rationale**: Smallest mainstream ANSI lib (no dependencies); used to colour the
  heatmap cells by level (1 red → 5 green).
- **Alternatives considered**: `chalk` (larger, ESM migration churn); raw ANSI codes
  (works but harder to read/maintain).

## Decision: HTML board — single self-contained file, inline CSS

- **Rationale**: FR-014/SC-007 require the file to open with no external assets or network.
  Generate one `.html` with inline `<style>` and the heatmap as a styled table/grid; no
  CDN links, no JS frameworks, no fonts fetched.
- **Alternatives considered**: A bundled web app (rejected — out of scope, violates
  "self-contained, no external assets"); SVG export (heavier, less shareable as a page).

## Decision: Testing — `vitest` + V8 coverage

- **Rationale**: TS-native, fast, first-class ESM, snapshot support for render output,
  easy temp-dir integration tests. Directly serves Principle IV (core unit-tested first,
  every command covered) and SC-006.
- **Alternatives considered**: `jest` (heavier ESM/TS config); `node:test` (lean but
  thinner assertion/coverage ergonomics for this size of suite).

## Decision: Build/typecheck/lint — `tsup` + `tsc` + `biome`

- **Rationale**: `tsup` produces the `dist/cli.js` and `dist/mcp.js` bins with shebangs in
  one step; `tsc --noEmit` enforces types; `biome` does lint **and** format as a single
  dependency (leaner than ESLint + Prettier + plugins). Serves Constitution lean-deps and
  the per-PR lint gate.
- **Alternatives considered**: ESLint + Prettier (more configs/deps); bare `tsc` to dist
  (works but manual shebang/bin permission handling).

## Decision: MCP server — `@modelcontextprotocol/sdk`, stdio transport, separate bin

- **Rationale**: Official SDK; stdio is the standard transport for local tool-calling
  clients; exposed as `npx runboard-mcp`. The server is a thin wrapper that imports the
  same `src/core/` + `src/data/`, satisfying Principle III. Spec marks MCP as
  "include if cheap, may fast-follow" — keeping it a thin wrapper makes it cheap.
- **Alternatives considered**: HTTP/SSE transport (unnecessary for local-first, adds a
  network surface that conflicts with Principle II); deferring MCP entirely (acceptable
  fallback if it threatens timeline, per spec §2).

## Decision: Data layout & storage format — `.runboard/` in the user's repo

- **Rationale**: Matches spec §5 exactly. Assessments as `assessments/<YYYY-MM-DD>.md`
  with YAML frontmatter make them human-readable, diffable, and committable — so git
  history is the trajectory record (Principle III). Config and rubric as YAML.
- **Alternatives considered**: JSON store (less human-friendly to hand-edit/review);
  SQLite (rejected — opaque to git, contradicts "git is the trajectory").

## Decision: Rubric sourcing — ship a self-contained `rubric/rubric.yaml`

- **Rationale**: Spec §1/§10 say the CLI draws the rubric from `CTO-runbooks/rubric/`
  but **ships its own copy** (9 dims × 5 anchored levels). The source repo is external and
  not present here, so the rubric content will be authored into `rubric/rubric.yaml` as
  part of implementation and kept reconciled with the practice IP (a standing check).
- **Alternatives considered**: Fetching the rubric at runtime (rejected — violates
  Principle II no-network); symlinking to an external repo (rejected — not self-contained
  for an npm package).

## Open follow-ups (non-blocking)

- **npm package name availability** (`runboard` vs `@runboard/cli` fallback) is verified at
  publish time per spec §3/§12; it does not affect design and is out of plan scope.
- **Exact rubric anchor text** must be transcribed/reconciled from the practice IP during
  implementation; the schema (9 dims, 5 levels each) is fixed and modelled now.
