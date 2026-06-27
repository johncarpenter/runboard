# Contributing to Runboard CLI

Thanks for helping build Runboard. This is a public project; contributions go through
GitHub issues and pull requests.

## Workflow

1. **Start from an issue.** Every change should trace to a GitHub issue. If one doesn't
   exist, open it first so scope is visible.
2. **Branch + PR.** Reference the issue your PR resolves (e.g., `Closes #123`).
3. **Keep the build green.** Before pushing:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

## Project principles (see `.specify/memory/constitution.md`)

- **Deterministic core, probabilistic edge.** All scoring/delta/trigger/constraint math
  lives in `src/core/` as pure functions. AI adapters never compute results.
- **Local-first, no phone-home.** No network calls, telemetry, or accounts.
- **Single source of truth.** The CLI, MCP server, and SKILL.md skills all call the same
  core — never duplicate logic in an adapter.
- **Tests across every command (non-negotiable).** Core is unit-tested first; every
  command has an integration test. No PR merges with failing/skipped tests.
- **Docs with every merge.** Any user-observable change updates the Markdown docs in the
  same PR.

## Tests

- Unit tests for `src/core/` go in `test/core/`.
- Per-command integration tests go in `test/commands/` and run against a temp directory.
- Write the test first, watch it fail, then implement.
