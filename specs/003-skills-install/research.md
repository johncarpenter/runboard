# Phase 0 Research: Skills Install Command

The spec carried one deferred product decision (auto-detection scope) and several implementation choices that the existing codebase already answers. No open `NEEDS CLARIFICATION` items remain after the resolutions below.

## R1 — Locating the bundled skills inside the installed package

- **Decision**: Add `shippedSkillsDir()` in `src/data/skills.ts` that resolves the package's `skills/` directory by walking up from `import.meta.url`, trying `../skills` (from `dist/`) then `../../skills` (from `src/data/` under test), exactly mirroring `shippedRubricPath()` in `src/data/rubric.ts`.
- **Rationale**: This pattern already works in production (rubric) and under vitest (running from `src/`), so it handles both the bundled `dist/` layout and the test layout with no new machinery. `skills/` is already in `package.json` `files`, so it ships.
- **Alternatives considered**: `require.resolve('runboard/package.json')` — rejected: the CLI runs as the package itself, not as a dependency, so self-resolution is awkward. Hard-coding a relative path — rejected: breaks between `dist/` and `src/` layouts.

## R2 — Enumerating skills (don't hard-code the set)

- **Decision**: `listBundledSkills()` reads the immediate subdirectories of `shippedSkillsDir()` and treats each directory containing a `SKILL.md` as a skill. Returns skill names (folder names).
- **Rationale**: New skills can be added to `skills/` without touching the install command (FR-003 + Scale note). A directory without `SKILL.md` is ignored rather than mis-installed.
- **Alternatives considered**: A static manifest list — rejected: a second source of truth that drifts from the folders (violates the spirit of Constitution III).

## R3 — Auto-detection scope for v1

- **Decision**: v1 auto-detects **Claude Code only** (`.claude/skills/`), probing under the current working directory. Other agents are served by explicit `--target`. The detector is a table of `{ agent, relativeDir }` so adding agents later is a one-line change.
- **Rationale**: Matches the spec assumption and the project author's own toolchain. Keeps v1 narrow and correct rather than guessing at conventions for agents whose layout may change. The `--target` escape hatch makes the command fully agent-agnostic today (FR-005).
- **Alternatives considered**: Detect Cursor/Codex/Gemini too in v1 — deferred: their skills-directory conventions are less stable and unverified; shipping a wrong guess erodes trust more than requiring `--target`. `log()` what is/isn't detected so the behaviour is transparent.

## R4 — Detection rule must stay pure/testable

- **Decision**: Split detection into (a) an I/O probe in `data` that returns which known agent dirs exist, and (b) a pure `selectTarget(opts, detected)` in `core` that applies the precedence rule: explicit `--target` wins; else the single detected agent dir; else `null` (→ command errors with guidance).
- **Rationale**: Honours Constitution I — the *decision* is pure and unit-testable; only the probe touches the filesystem. Ambiguity (multiple detected dirs) and emptiness (none) become explicit return states the command can message (FR-007, edge cases).
- **Alternatives considered**: Decide inside the command with inline `existsSync` — rejected: untestable without heavy fs mocking and mixes layers.

## R5 — Overwrite safety and dry-run

- **Decision**: A pure `planInstall(bundled, existingAtDest, { force })` returns a per-skill action list (`create` | `overwrite` | `skip`). Without `--force`, skills already present at the destination are `skip`; with `--force` they are `overwrite`. `--dry-run` computes and prints the plan but performs no writes.
- **Rationale**: Directly satisfies FR-008/FR-009; "no silent overwrite" becomes a tested property of a pure function rather than scattered conditionals. Dry-run is just "render the plan, skip the copy step."
- **Alternatives considered**: Prompt interactively on conflict — rejected for v1: the command must work non-interactively under `npx`/CI; a `--force` flag plus clear skip reporting is simpler and scriptable. (Interactive prompt could be added later without changing the planner.)

## R6 — Copy granularity and failure atomicity

- **Decision**: Copy each skill as a whole folder (`SKILL.md` + any siblings) using `fs.cpSync(src, dest, { recursive: true })`. Validate the target before any write: if it exists and is not a directory, error out; ensure parent dirs are created (`mkdirSync recursive`). Per-skill copy; on a mid-run failure, report which skills completed and exit non-zero.
- **Rationale**: Satisfies FR-003 (self-contained folder), FR-006 (create dirs), FR-011 (predictable state + non-zero exit). Per-skill reconciliation handles partial pre-existing installs (edge case).
- **Alternatives considered**: Copy only `SKILL.md` — rejected: a skill may ship supporting files; folder copy is faithful (SC-002 byte-faithful). Full transactional rollback — rejected as over-engineering for idempotent file copies; clear reporting is sufficient.

## R7 — Command surface / framework

- **Decision**: Register a `skills` parent command with an `install` subcommand via `commander` (`program.command('skills').command('install')`), flags `--target <dir>`, `--force`, `--dry-run`. Errors raised as `UserError` (from `src/commands/shared.ts`) so `main()` maps them to exit code 1 and a clean stderr message.
- **Rationale**: Consistent with every existing command (`registerX(program)`), reuses the established error-to-exit-code path, and leaves room for future `skills` subcommands (e.g. `list`).
- **Alternatives considered**: A flat `skills-install` command — rejected: a `skills` namespace reads better and anticipates `skills list`.

## Resolved unknowns summary

| Item | Resolution |
|------|------------|
| Where bundled skills live | `shippedSkillsDir()` mirrors `shippedRubricPath()` |
| Which skills install | Enumerate folders with `SKILL.md` (no hard-coded set) |
| Auto-detect scope (v1) | Claude Code `.claude/skills/` only; `--target` for the rest |
| Overwrite policy | `--force` required; default skips existing, reports skips |
| Preview | `--dry-run` prints plan, writes nothing |
| Failure behaviour | Validate target first; non-zero exit + report on error |
