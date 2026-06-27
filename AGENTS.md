# Runboard for AI agents

This file tells any AI agent (Claude, Cursor, Codex, Copilot, Gemini, ChatGPT, …) how to
drive the `runboard` CLI on a user's behalf.

## The one rule

**The CLI computes; you converse.** Runboard's credibility depends on a deterministic
core: all scores, averages, deltas, auto-triggers, and constraints are computed by the
CLI. Your job is elicitation and interpretation — never calculate or invent a number.

## What Runboard is

A local-first maturity instrument scored on nine dimensions — Build / Run / Plan × Team /
Tools / Techniques — each 1–5 with a trajectory (`up`/`flat`/`down`/`volatile`). Data
lives in `.runboard/` in the user's repo. Nothing leaves the machine.

## Commands you can run

```bash
runboard init                 # scaffold .runboard/ (idempotent)
runboard assess --set <dim>=<level>:<traj>:"<evidence>" ...   # record (all 9 dims)
runboard board [--html]       # heatmap + average + binding constraint
runboard pulse                # compare the two latest assessments
runboard roadmap              # Now/Next/Later from the binding constraint
runboard report --type board-update|baseline|monthly
runboard status               # one-screen current state
```

Dimension keys: `build.team`, `build.tools`, `build.techniques`, `run.team`, `run.tools`,
`run.techniques`, `plan.team`, `plan.tools`, `plan.techniques`.

## Typical flows

- **Assess**: read anchors from `.runboard/rubric.yaml`, ask the leader per dimension,
  then persist with a single `runboard assess --set ... ` call. See `skills/assess/`.
- **Pulse / Roadmap / Board update**: run the matching command, read the generated file
  under `.runboard/`, and read it back in business language. See the other `skills/`.

## MCP

For tool-calling clients, run `npx runboard-mcp` to expose the same capabilities as tools
(`runboard_assess`, `runboard_board`, `runboard_pulse`, `runboard_roadmap`,
`runboard_report`, `runboard_status`). These are thin wrappers over the same core, so
their results match the CLI exactly.

## Portable skills

`skills/*/SKILL.md` are written to the open SKILL.md standard and run unmodified across
agent platforms. They own the conversation; the CLI owns the computation.

> Note: in published installs, `CLAUDE.md` is provided as a copy/symlink of this file so
> Claude Code reads the same guidance. In this source repo, `CLAUDE.md` is the
> contributor/Spec-Kit guide instead — this AGENTS.md is the end-user agent guide.
