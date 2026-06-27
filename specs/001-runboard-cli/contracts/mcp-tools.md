# MCP Tool Contract: Runboard CLI

**Feature**: 001-runboard-cli | **Date**: 2026-06-27

The MCP server (`npx runboard-mcp`, stdio transport) exposes the CLI's capabilities as
tools for tool-calling clients. Each tool is a **thin wrapper** that calls the same
`src/core/` + `src/data/` modules the CLI uses — it computes nothing itself (Principle
III, FR-020, FR-021). Results MUST equal the corresponding CLI command's results for the
same `.runboard/` state (SC-005).

All tools operate on a working directory provided by the client (default: process CWD).

---

## Tool: `runboard_assess`

Record a 9-dimension assessment (non-interactive — the client/agent supplies values).

- **Input**:
  - `type`: `"baseline" | "pulse" | "quarterly" | "event"` (optional).
  - `scores`: object keyed by DimensionKey → `{ level: 1-5, trajectory: up|flat|down|volatile, evidence: string }`. All 9 keys required.
  - `force`: boolean (optional) — overwrite today's record.
- **Output**: `{ date, path, written: true }` or a validation error naming the bad
  dimension.
- **Mirror of**: `runboard assess --set ...`.

## Tool: `runboard_pulse`

- **Input**: none (operates on existing assessments).
- **Output**: `{ deltas: DimensionDelta[], triggers: DimensionKey[], summary, path }`.
- **Precondition**: ≥ 2 assessments, else a descriptive error.
- **Mirror of**: `runboard pulse`.

## Tool: `runboard_roadmap`

- **Input**: none.
- **Output**: `{ bindingConstraint, now: string[], next: string[], later: string[], path }`
  with Now ≤ 3, Next ≤ 5.
- **Precondition**: ≥ 1 assessment.
- **Mirror of**: `runboard roadmap`.

## Tool: `runboard_board`

- **Input**: `{ html?: boolean }`.
- **Output**: `{ cells, average, trajectoryCounts, htmlPath? }`.
- **Precondition**: ≥ 1 assessment.
- **Mirror of**: `runboard board [--html]`.

## Tool: `runboard_status`

- **Input**: none.
- **Output**: `{ latestDate, average, trajectoryCounts, activeTriggers }`.
- **Precondition**: none; empty state returns a descriptive "nothing yet" payload.
- **Mirror of**: `runboard status`.

---

## Contract guarantees

- **Parity**: for any `.runboard/` state, each tool's computed fields equal the CLI
  command output. A conformance test runs the same fixture through both paths and asserts
  equality (SC-005).
- **No computation in the adapter**: the server marshals input → core/data calls →
  output. Scores, deltas, triggers, and constraints come only from `src/core/`.
- **No network**: stdio transport only; the server makes no outbound network calls
  (Principle II).
- **MCP is fast-follow-eligible**: per spec §2, if the MCP server threatens the v1
  timeline it may ship in v1.1; the SKILL.md skills + CLI remain the must-have surfaces.
