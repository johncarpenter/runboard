# Quickstart: Runboard CLI

**Feature**: 001-runboard-cli | **Date**: 2026-06-27

This is the validation walkthrough for the five-minute first run (SC-001) and the
developer setup. It doubles as the basis for the README quickstart (FR-023).

## For end users (the five-minute first run)

```bash
# In your own project/repo:
npx runboard@latest init        # scaffolds .runboard/ (config, rubric, assessments/)
npx runboard@latest assess      # guided 9-dimension self-assessment
npx runboard@latest board       # see your 3×3 heatmap + average + biggest constraint
```

Optional next steps once you have data:

```bash
npx runboard@latest roadmap          # Now/Next/Later plan from your binding constraint
npx runboard@latest board --html     # shareable self-contained board.html
npx runboard@latest pulse            # (after a 2nd assessment) what moved since last time
npx runboard@latest status           # one-screen current state
```

**Local-first guarantee**: every command runs entirely on your machine. No account, no
network calls, no telemetry. Your data lives in `.runboard/` in your repo — commit it, and
its git history becomes your trajectory record.

**Instant demo**: `runboard board` against the shipped `examples/.runboard/` sample data
renders a populated board before you've recorded anything (SC-008).

## For contributors (developer setup)

```bash
git clone <repo> && cd runboard-cli
npm install
npm run build        # tsup → dist/cli.js, dist/mcp.js (with shebangs)
npm test             # vitest: core unit tests + per-command integration tests
npm run lint         # biome lint + format check
npm run typecheck    # tsc --noEmit
npx .                # run the local build end to end
```

### Test-first expectation (Constitution Principle IV)

- Write/extend unit tests in `test/core/` for any scoring, delta, trigger, or constraint
  change **before** implementing — they are the verification spine and must be green.
- Every command must have an integration test in `test/commands/` that runs it against a
  temporary `.runboard/` directory.

## Acceptance validation map

Run these to validate the spec's user stories:

| Story | Validation |
|-------|-----------|
| US1 (P1) five-minute scorecard | `init` → `assess` → `board` produces a heatmap + named binding constraint, no network. |
| US2 (P2) trajectory | With ≥ 2 assessments, `pulse` writes a delta memo and flags 3× flat/regressing dimensions. |
| US3 (P3) roadmap | `roadmap` writes Now/Next/Later (Now ≤ 3, Next ≤ 5) from the binding constraint. |
| US4 (P3) report | `report --type board-update` writes a ≤ 2-page business-language doc. |
| US5 (P4) status | `status` prints latest date, average, trajectory counts, active triggers. |
| US6 (P4) share | `board --html` writes a self-contained file that opens with no external assets. |
| US7 (P4) AI adapters | A SKILL.md run and an MCP tool call produce records identical to the CLI path. |
