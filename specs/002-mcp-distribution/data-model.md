# Data Model: MCP Server Distribution

**Feature**: 002-mcp-distribution | **Date**: 2026-06-27

This feature has no runtime/business data model — it adds no scores, assessments, or
persisted state. The "entities" here are distribution and configuration artifacts. They
are documented for completeness and to anchor the contract and tests.

---

## Entity: Published Package Release

The single public npm artifact that carries both surfaces.

| Field | Description | Validation / Rule |
|-------|-------------|-------------------|
| `name` | npm package name | `runboard` (one package; no separate MCP package) — FR-001 |
| `version` | semver string | Single source of truth; equals the version reported by both the CLI and the MCP server — FR-004, SC-003 |
| `bin.runboard` | CLI executable entry | `dist/cli.js` |
| `bin.runboard-mcp` | direct MCP executable entry | `dist/mcp.js` |
| `files` | publish allowlist | MUST include `dist` (so `dist/mcp.js` ships) — FR-003 |

**Rule**: a single publish action emits this one artifact containing both bins (SC-005).
The pack-contents test asserts `dist/mcp.js` is present and both bins are declared.

---

## Entity: MCP Server Distribution Entry

The thing the zero-install command actually runs.

| Field | Description | Validation / Rule |
|-------|-------------|-------------------|
| canonical invocation | the documented zero-install command | `npx -y runboard mcp` — FR-002 |
| fallback invocation | direct-bin form | `npx -y -p runboard runboard-mcp` |
| subcommand | CLI route that boots the server | `runboard mcp` → starts stdio server |
| transport | wire transport | stdio only; no HTTP/SSE — FR-005, Principle II |
| reported version | version string the server advertises | equals package version — FR-004 |
| tools | exposed tool set | the existing six: assess, board, pulse, roadmap, report, status (no new tools) |

**State**: stateless process. One instance per client/working-directory; reads/writes only
the `.runboard/` of the directory it is launched in.

---

## Entity: Client Configuration Snippet

The copy-paste settings a user adds to register the server.

| Field | Description | Validation / Rule |
|-------|-------------|-------------------|
| `command` | executable the client spawns | `npx` |
| `args` | argument vector | `["-y", "runboard", "mcp"]` |
| `cwd` | working directory (optional) | defaults to client/process CWD; selects which project's `.runboard/` is read |
| target clients | documented examples | Claude Desktop, Cursor, VS Code (≥ 3) — FR-008, SC-006 |

**Rule**: the same `command`/`args` pair works across all documented clients; only the
surrounding settings location differs. Each documented client is independently verified to
load the tools (SC-006).

---

## Non-entities (explicitly out of scope)

- No account, credential, token, or session entity — local-first, no auth (Principle II).
- No remote endpoint / server URL entity — stdio only, no hosted deployment.
- No new assessment/score/rubric fields — this feature changes distribution, not the
  instrument.
