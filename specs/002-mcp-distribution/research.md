# Phase 0 Research: MCP Server Distribution

**Feature**: 002-mcp-distribution | **Date**: 2026-06-27

The spec left exactly one technical question open (the zero-install invocation form);
everything else here records the design choices needed to satisfy the functional
requirements. No external research blockers — the stack and tools are fixed by feature 001.

---

## 1. Zero-install invocation form (the spec's open question)

**Decision**: Ship the MCP server inside the single `runboard` package and make the
canonical client entry a new CLI subcommand: `npx -y runboard mcp`. Retain the existing
`runboard-mcp` bin for direct/global invocation.

**Rationale**:
- `npx <name>` resolves `<name>` as a **package** on the registry. Bare `npx runboard-mcp`
  would look for a package literally named `runboard-mcp` — which does not exist, because
  the `runboard-mcp` bin lives *inside* the `runboard` package. So the command in the 001
  contract (`npx runboard-mcp`) does not actually resolve post-publish without a second
  package.
- `npx -y runboard mcp` resolves the package by its real name (`runboard`), runs the
  default `runboard` bin, and dispatches the `mcp` subcommand, which boots the stdio
  server. This is the path MCP clients already express naturally as `command: "npx"`,
  `args: ["-y", "runboard", "mcp"]`.
- Keeps a **single package and a single publish action** (FR-001, SC-005). No second
  artifact to version or publish.

**Alternatives considered**:
- `npx -y -p runboard runboard-mcp` — works with the existing bin and needs zero code, but
  the `-p` form is less familiar, harder to paste correctly into client UIs, and some
  clients mangle multi-flag `args`. Kept as a documented fallback, not the primary.
- A separate thin `runboard-mcp` npm package that re-exports the server — gives the pretty
  bare `npx runboard-mcp`, but introduces a second publishable artifact and a version-sync
  burden, directly violating FR-001/SC-005. Rejected.
- Hosted/remote MCP endpoint — out of scope by Principle II (no phone-home). Rejected.

---

## 2. Version single-sourcing (FR-004, SC-003)

**Decision**: Derive the version from `package.json` in one place (`src/version.ts`) and
have both `src/cli.ts` and `mcp/server.ts` import it. Stop hardcoding `"0.1.0"`.

**Rationale**: Today the string `0.1.0` is duplicated in `package.json`, `src/cli.ts`, and
`mcp/server.ts`. Three copies is three chances to drift; SC-003 requires zero drift and
FR-004 requires the server to report the package version. A single module that reads the
package version makes lockstep structural rather than a discipline the maintainer must
remember at release time.

**Approach**: `src/version.ts` resolves the version from `package.json` (import attribute /
JSON import, or a `tsup` build-time inject). A unit/smoke test asserts
`server.version === packageJson.version` so a regression fails CI.

**Alternatives considered**: leave three hardcoded copies and add a release checklist — too
fragile, rejected. A `genversion`-style codegen step — more tooling than warranted for one
constant.

---

## 3. Client configuration coverage (FR-008, SC-006)

**Decision**: Document copy-paste configuration for **Claude Desktop, Cursor, and VS Code**
(≥ 3 clients), all using `command: "npx"`, `args: ["-y", "runboard", "mcp"]`. Each entry
goes under the client's MCP-servers settings object (e.g. `mcpServers`).

**Rationale**: These three cover the dominant MCP-capable surfaces and exercise the two
config shapes (a JSON settings file vs. an in-app settings panel). One canonical command
across all three keeps the docs maintainable and reduces user error. The `cwd`/working
directory is left to the client default (process CWD) so the server reads the project the
user is in — matching the edge case in the spec.

**Alternatives considered**: documenting every MCP client — unbounded maintenance; three
verified examples plus the generic command pattern is enough for users to adapt others.

---

## 4. Publish gate and CI (FR-010, SC-002, SC-004, SC-005)

**Decision**: Keep the existing `prepublishOnly` gate (lint → typecheck → test → build) and
extend CI to also (a) boot the built MCP entry over stdio and list tools, and (b) run the
parity and no-network tests (already in the suite). Add a packaging test that inspects
`npm pack` output.

**Rationale**: `prepublishOnly` already blocks a broken publish for lint/type/test/build.
The gap is that nothing currently exercises the *MCP* artifact specifically — CI only runs
`node dist/cli.js --version`. Adding an MCP boot smoke + packaging assertion closes the gap
so a publish that omits `dist/mcp.js` or breaks the server fails before it ships.

**Alternatives considered**: a full end-to-end `npm pack` → install-in-temp → spawn-via-npx
test — higher fidelity but slow and flaky in CI; the boot smoke + pack-contents assertion
gives most of the confidence at a fraction of the cost. Can be added later if needed.

---

## 5. Parity and no-network verification (FR-005, FR-006, FR-007, SC-002, SC-004)

**Decision**: Reuse and extend the existing tests. `test/commands/mcp-parity.test.ts`
already asserts MCP-handler output equals CLI output; extend it to cover all six tools.
`test/core/no-network.test.ts` already asserts no network use; extend it to the server boot
path.

**Rationale**: Parity and no-network are already proven for the handlers — this feature must
not regress them and should widen coverage to the full tool set and the new boot path. No
new mechanism needed; these are the verification spine for SC-002 and SC-004.

---

## 6. Packaged-artifact contents (FR-003, SC-005)

**Decision**: A test runs `npm pack --dry-run --json` (or inspects the tarball file list)
and asserts `dist/mcp.js` is present and both `runboard` and `runboard-mcp` bins are
declared. The `files` allowlist in `package.json` already includes `dist`.

**Rationale**: FR-003 requires the published package to actually contain the executable MCP
entry; the cheapest durable guarantee is a test on the pack manifest, so a future change to
`files`, `bin`, or the build that would drop the MCP entry fails CI rather than shipping a
package whose documented command 404s.

---

## Summary of decisions

| # | Decision | Satisfies |
|---|----------|-----------|
| 1 | `npx -y runboard mcp` via a new `mcp` subcommand; single package; keep `runboard-mcp` bin | FR-001, FR-002, SC-005 |
| 2 | Single-source version from `package.json` (`src/version.ts`) | FR-004, SC-003 |
| 3 | Copy-paste config for Claude Desktop, Cursor, VS Code | FR-008, SC-006 |
| 4 | Extend CI + keep prepublish gate; MCP boot smoke | FR-010, SC-002/004/005 |
| 5 | Extend parity + no-network tests | FR-005/006/007, SC-002/004 |
| 6 | Pack-contents test | FR-003, SC-005 |
