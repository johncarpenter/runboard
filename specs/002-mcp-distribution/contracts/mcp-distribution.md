# Distribution Contract: Runboard MCP Server

**Feature**: 002-mcp-distribution | **Date**: 2026-06-27

This contract covers how the MCP server is **launched, versioned, packaged, and
configured**. The per-tool input/output contract is unchanged and lives in
[`001-runboard-cli/contracts/mcp-tools.md`](../../001-runboard-cli/contracts/mcp-tools.md);
this feature does not alter it.

---

## Invocation contract

- **Canonical zero-install command**: `npx -y runboard mcp`
  - Resolves the public `runboard` package by name, runs the default `runboard` bin, and
    dispatches the `mcp` subcommand, which starts the stdio server.
  - MUST require no clone, no build, and no global install (FR-002).
- **Direct bin (fallback)**: `npx -y -p runboard runboard-mcp`, or `runboard-mcp` when the
  package is installed globally.
- **Subcommand behaviour**: `runboard mcp` starts the stdio MCP server and blocks until the
  client disconnects. It prints nothing to stdout except the MCP protocol stream (stdout is
  reserved for the transport; diagnostics go to stderr).
- **Transport**: stdio only. The server MUST NOT open HTTP/SSE listeners or make any
  outbound network connection (FR-005, Principle II).

## Version-parity contract

- The MCP server's reported `version` MUST equal the `runboard` package `version`, which
  MUST equal the CLI's `--version` output (FR-004, SC-003).
- The version MUST be single-sourced (one module reads `package.json`); no component
  hardcodes a separate copy.
- **Verification**: a test asserts `mcpServer.version === packageJson.version === cli --version`.

## Packaging contract

- The published package MUST include `dist/mcp.js` and MUST declare both `bin.runboard` and
  `bin.runboard-mcp` (FR-003).
- A single publish action MUST emit both surfaces in one artifact — no second package
  (FR-001, SC-005).
- **Verification**: a pack-contents test asserts `dist/mcp.js` is in the tarball and both
  bins are declared.

## Parity contract (carried over, re-asserted)

- For any `.runboard/` state, each MCP tool's computed fields MUST equal the corresponding
  CLI command's output (FR-006, SC-002).
- The adapter MUST NOT compute scores, deltas, triggers, or constraints; all computation
  comes from `src/core/` (FR-007).
- **Verification**: `test/commands/mcp-parity.test.ts`, extended to all six tools.

## Configuration contract

- Documentation MUST provide a copy-paste config for at least Claude Desktop, Cursor, and
  VS Code, each using `command: "npx"`, `args: ["-y", "runboard", "mcp"]` (FR-008, SC-006).
- Example client entry:

  ```json
  {
    "mcpServers": {
      "runboard": {
        "command": "npx",
        "args": ["-y", "runboard", "mcp"]
      }
    }
  }
  ```

- The server operates on the client-provided working directory (default: process CWD); when
  that directory has no initialised `.runboard/`, tools return descriptive guidance rather
  than crashing (FR-009).

## CI / release-gate contract

- CI MUST build and smoke-test the MCP entry (boot over stdio, list tools) in addition to
  the existing CLI checks (FR-010).
- The pre-publish gate MUST run lint, typecheck, the full test suite (including parity,
  no-network, packaging, and MCP smoke), and the build before any publish, and MUST block
  the publish on any failure (FR-010).
