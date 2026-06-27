# CLI Contract: `runboard skills install`

The user-facing contract for the command. This is the interface tests assert against.

## Synopsis

```text
runboard skills install [--target <dir>] [--force] [--dry-run]
```

Also reachable zero-install: `npx runboard@latest skills install ...`

## Description

Copies every SKILL.md skill folder bundled with the installed `runboard` package into an agent's skills directory. With no `--target`, auto-detects a recognised agent location under the current directory (v1: Claude Code `.claude/skills/`). Never fetches over the network.

## Options

| Flag | Arg | Default | Meaning |
|------|-----|---------|---------|
| `--target` | `<dir>` | (auto-detect) | Destination directory. Overrides auto-detection. Created if missing. |
| `--force` | — | `false` | Overwrite skills already present at the destination. Without it, existing skills are skipped. |
| `--dry-run` | — | `false` | Print the resolved destination and per-skill plan, but write nothing. |

## Behaviour matrix

| Situation | Outcome | Exit |
|-----------|---------|------|
| `--target` given, dir absent | dir created, all skills copied | 0 |
| No target, exactly one agent dir detected | install into it, report destination | 0 |
| No target, no agent dir detected | no writes; message explains how to pass `--target` | 1 |
| No target, multiple agent dirs detected | no writes; message lists them and asks for `--target` | 1 |
| Skill already at destination, no `--force` | that skill `skipped`, others proceed | 0 |
| Skill already at destination, `--force` | that skill `overwritten` | 0 |
| `--dry-run` | plan printed, nothing written | 0 |
| Resolved target path is a file | error, no writes | 1 |
| Bundled `skills/` missing/empty | error (corrupt package) | 1 |
| Filesystem write/permission error mid-run | report skills done + the failure | 1 |

## Output (stdout) — success example

```text
Installing skills into .claude/skills/ (detected: claude-code)
  ✓ assess        (created)
  ✓ pulse         (created)
  ✓ roadmap       (created)
  - board-update  (skipped: already present, use --force to overwrite)

Installed 3 skill(s), skipped 1. Restart your agent to pick them up.
```

## Output — dry run example

```text
Dry run — no files will be written.
Destination: .claude/skills/  (detected: claude-code)
  assess        create
  pulse         create
  roadmap       create
  board-update  skip (already present)
```

## Errors (stderr) — examples

- No target/detection:
  `No agent skills directory detected. Re-run with --target <dir> (e.g. --target .cursor/skills).`
- Target is a file:
  `Target .claude/skills is a file, not a directory.`
- Empty bundle:
  `No bundled skills found in this runboard install. The package may be corrupt; try reinstalling.`

All errors are raised as `UserError`, printed to stderr, and set exit code `1` (existing `main()` behaviour).

## Invariants

- **No network** access under any path.
- **No silent overwrite**: a pre-existing skill is only replaced when `--force` is passed.
- **Idempotent**: re-running without `--force` after a successful install reports all-skipped and writes nothing new.
- **Faithful copy**: an installed skill folder is byte-identical to the bundled source.
- **Self-contained surface**: command touches only the destination dir; never reads or writes `.runboard/`.
