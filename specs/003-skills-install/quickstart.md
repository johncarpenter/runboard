# Quickstart: Skills Install Command

## For users

Install the bundled Runboard skills into your AI agent so it can run assessments.

```bash
# Auto-detect a supported agent (v1: Claude Code → .claude/skills/)
npx runboard@latest skills install

# Any other agent: point at its skills directory
npx runboard@latest skills install --target .cursor/skills

# Preview first — writes nothing
npx runboard@latest skills install --dry-run

# Re-install after upgrading runboard (replace existing copies)
npx runboard@latest skills install --force
```

After installing, restart/reopen your agent so it discovers the new skills. Then ask it to run an assessment (it will shell out to `runboard assess`).

## For developers (building the feature)

Implementation order (TDD, core-first per the constitution):

1. **Core (pure, red→green)** — `src/core/skills.ts`
   - `selectTarget(options, detected)` → `TargetResolution`
   - `planInstall(bundled, existingNames, { force })` → `InstallPlan`
   - Unit tests in `test/core/skills.test.ts` covering the precedence rule and all three action kinds, including idempotent no-op.

2. **Data (I/O)** — `src/data/skills.ts`
   - `shippedSkillsDir()` (mirror `shippedRubricPath()` in `src/data/rubric.ts`)
   - `listBundledSkills()` (folders containing `SKILL.md`)
   - `detectAgentDirs(cwd)` (v1 table: `.claude/skills`)
   - `copySkill(srcDir, destDir)` (`fs.cpSync` recursive; create parents)

3. **Command (orchestration)** — `src/commands/skills.ts`
   - `registerSkills(program)` adds `skills install` with `--target`, `--force`, `--dry-run`
   - Resolve target → validate → plan → (dry-run? print : copy) → report
   - Map failures to `UserError`
   - Wire `registerSkills(program)` into `src/cli.ts`

4. **Command tests** — `test/commands/skills.test.ts`
   - Use the temp-dir helper pattern from `test/commands/init.test.ts`.
   - Cases: auto-detect into `.claude/skills`; explicit `--target` creates dir; `--force` overwrite vs default skip; `--dry-run` writes nothing; no-target/no-detect errors with exit 1; target-is-a-file errors.

5. **Packaging + docs**
   - Extend `test/packaging/pack-contents.test.ts` to assert `skills/` is in the packed tarball.
   - Add an "Installing the skills" section to `README.md` and `AGENTS.md` (Constitution V).

## Verifying locally

```bash
npm run lint && npm run typecheck && npm test
# manual smoke from a scratch dir:
mkdir -p /tmp/rb-demo/.claude/skills && cd /tmp/rb-demo
node /path/to/runboard/dist/cli.js skills install --dry-run
```

## Acceptance checks (map to spec Success Criteria)

- SC-001/002: `skills install` with a detected agent copies all bundled skills byte-faithfully in one command.
- SC-003: `--target` installs every skill for a non-detected agent.
- SC-004: second run without `--force` overwrites nothing (all skipped).
- SC-005: failure paths print an actionable message and exit non-zero.
- SC-006: `--dry-run` lists plan and writes nothing.
