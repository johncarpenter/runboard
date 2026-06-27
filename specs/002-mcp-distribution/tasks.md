---
description: "Task list for MCP Server Distribution"
---

# Tasks: MCP Server Distribution

**Input**: Design documents from `/specs/002-mcp-distribution/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/mcp-distribution.md, quickstart.md

**Tests**: Mandatory per Constitution Principle IV. The MCP server, handlers, parity test,
and no-network test already exist from feature 001; this feature adds distribution wiring,
so test tasks here mostly **extend** existing suites and add smoke/packaging tests.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1/US2/US3 maps to the spec's user stories
- Exact file paths are included in each task

## Path Conventions

Single project — `src/`, `mcp/`, `test/`, `docs/` at repository root (per plan.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the distribution metadata and build are wired for two bins.

- [X] T001 [P] Finalize distribution metadata in `package.json`: confirm `bin.runboard` → `dist/cli.js` and `bin.runboard-mcp` → `dist/mcp.js`, `files` includes `dist`, and the `prepublishOnly` gate (lint → typecheck → test → build) is present and committed.
- [X] T002 [P] Verify `tsup.config.ts` builds both `cli` (`src/cli.ts`) and `mcp` (`mcp/server.ts`) entries with the Node shebang banner; run `npm run build` and confirm `dist/cli.js` and `dist/mcp.js` are emitted.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Single-source the version so the CLI, the MCP server, and the package can never drift. Blocks the version assertions in US1 and US3.

**⚠️ CRITICAL**: No user story work should rely on the version until this phase is complete.

- [X] T003 Write a failing unit test in `test/core/version.test.ts` asserting the version module's exported value equals `package.json`'s `version`.
- [X] T004 Implement `src/version.ts` that resolves the version from `package.json` (single source of truth); make T003 pass.

**Checkpoint**: One version constant exists; CLI and MCP can both import it.

---

## Phase 3: User Story 1 - Zero-install client setup (Priority: P1) 🎯 MVP

**Goal**: A user can run `npx -y runboard mcp`, see the `runboard_*` tools in their MCP client, and call them — no clone, no build.

**Independent Test**: On a machine with only Node ≥ 20, configure a client with `command: "npx"`, `args: ["-y","runboard","mcp"]`, restart it, and confirm the six tools are listed and callable; in an uninitialised directory a tool returns guidance, not a crash.

### Tests for User Story 1

- [X] T005 [P] [US1] Write `test/commands/mcp-smoke.test.ts`: boot the server over stdio, list tools and assert all six are present, assert the server's reported version equals `package.json` version, and assert that invoking a tool in an uninitialised directory returns descriptive guidance rather than throwing (FR-002, FR-004, FR-009). Ensure it FAILS first.

### Implementation for User Story 1

- [X] T006 [US1] Refactor `mcp/server.ts`: extract `startMcpServer()` (build server + connect `StdioServerTransport`), import the version from `src/version.ts` (remove the hardcoded `"0.1.0"`), and guard the auto-run so importing the module does NOT start the server (only the `runboard-mcp` bin entry starts it).
- [X] T007 [US1] Add an `mcp` subcommand in `src/cli.ts` that calls `startMcpServer()`, and switch the CLI `--version` to import from `src/version.ts` (remove the hardcoded `"0.1.0"`). Depends on T006.
- [X] T008 [P] [US1] Write `docs/mcp.md` with copy-paste client configuration for Claude Desktop, Cursor, and VS Code using `npx -y runboard mcp`, plus the `npx -y -p runboard runboard-mcp` fallback (FR-008).
- [X] T009 [P] [US1] Update the "Use it from your AI assistant" section of `README.md` with the canonical `npx -y runboard mcp` command and a link to `docs/mcp.md` (FR-011).

**Checkpoint**: `npx -y runboard mcp` boots the server; T005 passes; docs let a user self-serve. MVP deliverable.

---

## Phase 4: User Story 2 - MCP results match the CLI exactly (Priority: P2)

**Goal**: Every MCP tool returns results equal to the matching CLI command for the same `.runboard/` state, with no computation in the adapter.

**Independent Test**: Run a fixed `.runboard/` fixture through each MCP tool and its CLI equivalent and assert equality.

### Tests for User Story 2

- [X] T010 [P] [US2] Extend `test/commands/mcp-parity.test.ts` to cover all six tools (assess, board, pulse, roadmap, report, status), asserting each tool's computed fields equal the corresponding CLI command output for the same fixture (FR-006, SC-002).

### Implementation for User Story 2

- [X] T011 [US2] Make any fixes the extended parity test surfaces in `mcp/handlers.ts` so all six tools match the CLI exactly. Depends on T010.
- [X] T012 [US2] Confirm no scoring/delta/trigger/constraint logic is duplicated in `mcp/handlers.ts` or `mcp/server.ts` — all computation must come via `src/core/` (FR-007, Principle III).

**Checkpoint**: MCP and CLI are provably in lockstep on results.

---

## Phase 5: User Story 3 - One release ships both surfaces (Priority: P3)

**Goal**: A single publish emits one package containing both bins at one shared version, guarded by CI and the prepublish gate.

**Independent Test**: Build a publishable artifact and confirm it contains `dist/mcp.js` and declares both bins; confirm the running server, the CLI, and the package all report the same version.

### Tests for User Story 3

- [X] T013 [P] [US3] Write `test/packaging/pack-contents.test.ts` asserting `npm pack --dry-run --json` output includes `dist/mcp.js` and declares both `runboard` and `runboard-mcp` bins (FR-003, SC-005). Ensure it FAILS if either is missing.
- [X] T015 [P] [US3] Extend `test/core/no-network.test.ts` to assert the server boot path (`startMcpServer`) opens no sockets / makes no outbound connections (FR-005, SC-004).
- [X] T016 [P] [US3] Write `test/commands/version-lockstep.test.ts` asserting CLI `--version` == MCP server reported version == `package.json` version (FR-004, SC-003).

### Implementation for User Story 3

- [X] T014 [US3] Adjust `package.json` `files`/`bin` if needed so T013 passes. Depends on T013.
- [X] T017 [US3] Add an MCP entry smoke step to `.github/workflows/ci.yml` (after build: boot `dist/mcp.js` over stdio and list tools) alongside the existing `node dist/cli.js --version` (FR-010).
- [X] T018 [US3] Confirm the `prepublishOnly` gate in `package.json` runs lint → typecheck → test → build and document the one-action release flow (cross-check against `quickstart.md`).

**Checkpoint**: A broken or incomplete MCP artifact fails CI before it can ship; one publish delivers both surfaces in lockstep.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T019 [P] Note the `runboard mcp` subcommand in `docs/commands.md` so the command reference is complete (Principle V).
- [X] T020 Run the `quickstart.md` validation: configure at least one real client with `npx -y runboard mcp` and confirm the tools load and a call returns (SC-001, SC-006).
- [X] T021 [P] Final `biome` lint/format pass and confirm the full `vitest` suite is green.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately.
- **Foundational (Phase 2)**: after Setup. The version module blocks the version assertions used by US1 (T005) and US3 (T016).
- **User Stories (Phase 3+)**: after Foundational.
  - US1 is the MVP and should land first (it makes the server reachable).
  - US2 and US3 depend only on Foundational and the existing server; they can proceed in parallel with each other once US1's `startMcpServer`/subcommand refactor (T006/T007) is merged, since US3's smoke/CI tasks reference the boot path.
- **Polish (Phase 6)**: after the desired stories are complete.

### Within Each User Story

- Tests are written first and must FAIL before implementation (T005 before T006/T007; T010 before T011; T013 before T014).
- US1: server refactor (T006) before the CLI subcommand (T007); docs (T008/T009) are independent.

### Parallel Opportunities

- T001, T002 (Setup) in parallel.
- US1: T005, T008, T009 in parallel (different files); T006 → T007 sequential.
- US3: T013, T015, T016 in parallel (separate new test files).
- Polish: T019, T021 in parallel.

---

## Parallel Example: User Story 1

```bash
# Different files, no shared edits — run together:
Task: "Write test/commands/mcp-smoke.test.ts (boot, list tools, version, uninit guidance)"
Task: "Write docs/mcp.md with Claude Desktop / Cursor / VS Code config"
Task: "Update README.md 'Use it from your AI assistant' section"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → Phase 2 Foundational (version single-source).
2. Phase 3 US1: subcommand + server refactor + docs.
3. **STOP and VALIDATE**: `npx -y runboard mcp` boots and lists tools in a real client.
4. This is a shippable increment — the server is now reachable the same way as the CLI.

### Incremental Delivery

1. US1 → reachable server + docs (MVP).
2. US2 → parity proven across all six tools.
3. US3 → release/CI guarantees (single publish, version lockstep, pack gate).

---

## Notes

- [P] = different files, no dependencies.
- The server logic, parity test, and no-network test already exist (001) — prefer extending
  them over rewriting.
- Watch the `mcp/server.ts` auto-run guard (T006): without it, importing the module from the
  CLI subcommand would start a second server instance.
- Commit after each task or logical group.
