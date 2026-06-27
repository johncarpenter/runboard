# Implementation Plan: MCP Server Distribution

**Branch**: `002-mcp-distribution` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-mcp-distribution/spec.md`

## Summary

The MCP server, its tool handlers, and the CLI/MCP parity test already exist from feature
001. What is missing is the *distribution* story: a zero-install command users can put in
their MCP client, a guarantee the server reports the same version as the CLI, a single
publish action that ships both surfaces, and the docs that make it usable. This plan adds
a `runboard mcp` subcommand as the canonical zero-install entry (so `npx -y runboard mcp`
resolves cleanly from the public package), single-sources the version from `package.json`
so the CLI and MCP can never drift, extends CI and the publish gate to build and smoke-test
the MCP entry, and writes copy-paste client configuration for the major MCP clients. No new
tool capability and no new business logic — this is packaging, version-sourcing, a thin
entry-point, and documentation.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js ≥ 20, ESM modules (unchanged from 001).

**Primary Dependencies**: No new runtime dependencies. Uses the existing
`@modelcontextprotocol/sdk` (stdio transport), `commander` (to host the new `mcp`
subcommand), `tsup` (bundles `dist/cli.js` and `dist/mcp.js`), `vitest` (tests), `biome`
(lint/format).

**Storage**: Unchanged — local files under `.runboard/` in the user's repo. This feature
adds no storage; it changes how the existing server is launched, versioned, and documented.

**Testing**: `vitest`. Extends the existing `test/commands/mcp-parity.test.ts` and
`test/core/no-network.test.ts`; adds a packaging smoke test (`npm pack` contents) and an
MCP server boot/list-tools smoke test. CI gains an MCP entry smoke step alongside the
existing `node dist/cli.js --version`.

**Target Platform**: Cross-platform (macOS/Linux/Windows) on Node ≥ 20. Distribution is the
public npm registry; invocation is zero-install `npx`, plus `npm i -g runboard`.

**Project Type**: Single project (CLI + library core + adapters). No structural change.

**Performance Goals**: Server cold-start (via `npx`, package cached) to "tools listed" in a
client within a few seconds; SC-001 budget is 5 minutes of human setup time end to end.

**Constraints**: Local stdio transport only — no HTTP/SSE, no hosted service, no auth, no
network calls (Principle II). The adapter computes nothing (Principle III). Single public
package, single publish action, one shared version (FR-001, FR-004, SC-003, SC-005).

**Scale/Scope**: One server process per client/working-directory. Six tools (already
built). This feature's surface: 1 new CLI subcommand, 1 version-sourcing change touching 2
files, CI + publish-gate updates, 1 new docs page, README updates, ~3 new/extended tests.

**Key decision (resolves the spec's open question)**: bare `npx runboard-mcp` cannot
resolve a bin that lives inside a package named `runboard`. The canonical zero-install
entry is therefore `npx -y runboard mcp` — a new `mcp` subcommand on the default `runboard`
bin, which npx resolves by package name. The existing `runboard-mcp` bin is retained for
direct/global use. See [research.md](./research.md) §1.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan complies | Status |
|-----------|------------------------|--------|
| I. Deterministic Core, Probabilistic Edge | No computation added. The `mcp` subcommand only boots the stdio server; all math stays in `src/core/`. | PASS |
| II. Local-First, No Phone-Home | stdio transport only; no HTTP/SSE/hosted option introduced. The no-network test is extended to cover the server boot path. | PASS |
| III. Single Source of Truth | The server keeps calling the same handlers → core/data the CLI uses. Parity test extended to all six tools. Version single-sourced from `package.json`. | PASS |
| IV. Test Coverage Across Every Command (NON-NEGOTIABLE) | New `mcp` subcommand gets a boot/list-tools smoke test; packaging smoke test added; parity + no-network tests extended. No skipped tests. | PASS |
| V. Documentation Updated With Every Merge | Adds `docs/mcp.md` (client setup) and updates README's "Use it from your AI assistant" section in the same change. | PASS |
| VI. Open Contribution via GitHub Issues | Work tracked from a GitHub issue; PR references it; CI runs lint+test+build+MCP smoke on PRs. | PASS |
| Stack/Distribution/UX constraints | No new heavy deps; single public npm package; zero-install `npx` path; version lockstep. | PASS |

**Result**: No violations. Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-mcp-distribution/
├── plan.md                  # This file
├── research.md              # Phase 0 output — distribution decisions
├── data-model.md            # Phase 1 output — distribution/config entities
├── quickstart.md            # Phase 1 output — user + maintainer setup walkthrough
├── contracts/
│   └── mcp-distribution.md  # Phase 1 output — invocation + version-parity contract
└── tasks.md                 # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

Files this feature touches (everything else in the tree is unchanged from 001):

```text
src/
├── cli.ts                   # CHANGE: register `mcp` subcommand; read version from package.json
└── version.ts               # NEW: single-source version (re-exports package.json version)

mcp/
└── server.ts                # CHANGE: read version from src/version.ts (stop hardcoding "0.1.0")

package.json                 # bins already declared (runboard, runboard-mcp); prepublishOnly gate
tsup.config.ts               # verify both entries build; inject version if needed

.github/workflows/ci.yml     # CHANGE: add MCP entry smoke step (boot + list tools)

docs/
└── mcp.md                   # NEW: client configuration (Claude Desktop, Cursor, VS Code) + maintainer notes

README.md                    # CHANGE: expand the "Use it from your AI assistant" section with the zero-install command

test/
├── commands/
│   ├── mcp-parity.test.ts   # EXTEND: cover all six tools
│   └── mcp-smoke.test.ts    # NEW: boot server over stdio, list tools, assert version == package.json
├── core/
│   └── no-network.test.ts   # EXTEND: assert server boot path opens no sockets
└── packaging/
    └── pack-contents.test.ts # NEW: `npm pack` includes dist/mcp.js and declares both bins
```

**Structure Decision**: Single project, no new layers. The feature deliberately adds the
thinnest possible surface — a subcommand that boots the existing server and a version
module — because the server logic and parity guarantees already exist. Distribution
concerns (invocation, versioning, publish gate, docs) are wired around the existing code
rather than reimplemented.

## Complexity Tracking

> No constitution violations. No entries required.
