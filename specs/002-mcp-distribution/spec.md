# Feature Specification: MCP Server Distribution

**Feature Branch**: `002-mcp-distribution`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "Let's start on the runboard mcp, I'd like to deploy that in the same way as npm"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Runboard to a tool-calling client with zero install (Priority: P1)

A technical leader already uses an MCP-capable chat client (e.g. Claude Desktop, Cursor,
VS Code). They want Runboard's tools available inside that client without cloning a repo,
running a build, or installing anything by hand. They copy a small configuration snippet
from the Runboard docs, paste it into their client's MCP settings, restart the client,
and the Runboard tools appear and work against their current project's `.runboard/` data.

**Why this priority**: This is the entire point of the feature. The CLI already ships via
`npx`; the MCP server's value is only realised when a non-CLI user can reach the same
product through their assistant with the same zero-install ease. Without this, the MCP
adapter is code that nobody outside the repo can run.

**Independent Test**: On a clean machine with only Node ≥ 20 installed, paste the
documented configuration into a supported client, restart it, and confirm the
`runboard_*` tools are listed and that invoking one (e.g. status) returns a result — with
no manual clone, build, or global install step.

**Acceptance Scenarios**:

1. **Given** a machine with Node ≥ 20 and a supported MCP client, **When** the user adds
   the documented zero-install configuration and restarts the client, **Then** the
   Runboard tools are listed and callable.
2. **Given** the configured client pointed at a project that has been initialised with
   Runboard, **When** the user asks the assistant for the current scorecard, **Then** the
   board tool returns the same heatmap data the CLI would produce for that project.
3. **Given** a configured client pointed at a project that has **not** been initialised,
   **When** a tool is invoked, **Then** the tool returns descriptive guidance (what to run
   first) rather than crashing or returning an opaque error.

---

### User Story 2 - MCP results match the CLI exactly (Priority: P2)

A user who reaches Runboard through the MCP server must get numbers they can trust to be
identical to the CLI's. The assistant's "board", "pulse", "roadmap", "status", and
"report" outputs must equal what `runboard <command>` prints for the same `.runboard/`
state, because the same person may move between the chat client and the terminal.

**Why this priority**: Trust in the instrument depends on one source of truth. If the MCP
path could diverge from the CLI path, the tool's core credibility ("verifiable numbers,
the LLM does not do the math") collapses. This is a correctness guarantee on top of the
P1 distribution mechanism.

**Independent Test**: Run a fixed `.runboard/` fixture through both the MCP tool and the
equivalent CLI command and assert the computed fields are equal.

**Acceptance Scenarios**:

1. **Given** an identical `.runboard/` state, **When** the same logical operation is run
   via an MCP tool and via the CLI, **Then** the computed result fields are equal.
2. **Given** any tool invocation, **When** it executes, **Then** no scores, deltas,
   triggers, or constraints are computed inside the adapter — they originate only from the
   shared deterministic core.

---

### User Story 3 - One release ships both the CLI and the MCP server (Priority: P3)

The maintainer publishes Runboard with a single release action and gets both surfaces —
CLI and MCP server — at the same version, with no second package to build, version, or
publish separately. Users who pin or request "latest" get a CLI and MCP server that are
always in lockstep.

**Why this priority**: "Deploy in the same way as npm" means the MCP server rides the
existing public package release rather than introducing a parallel distribution channel.
This keeps maintenance cost and version-drift risk at zero, but it is a maintainer-facing
concern that depends on P1/P2 being right first.

**Independent Test**: Build a publishable package artifact and confirm it contains the MCP
executable entry and its declared bin, and that the running server reports the same
version string as the package.

**Acceptance Scenarios**:

1. **Given** the package is built for release, **When** its contents are inspected, **Then**
   the MCP server entry and its executable bin are present alongside the CLI.
2. **Given** a published release at version X, **When** the MCP server starts, **Then** it
   reports version X, matching the CLI and the package.
3. **Given** the release pipeline, **When** it runs prior to publish, **Then** it builds
   the MCP entry and verifies CLI/MCP parity, failing the publish if either is broken.

---

### Edge Cases

- **Uninitialised project**: a tool is invoked in a directory with no `.runboard/`. The
  tool returns descriptive guidance, not a stack trace.
- **Offline machine**: the user is offline but the package is already cached. The server
  starts from cache and completes tool calls making no network connections.
- **Stale cached version**: a previously cached package version is older than the current
  release. The documented invocation resolves the intended version rather than silently
  serving a stale one.
- **Two clients, two directories**: the same user runs two clients pointed at different
  projects. Each server instance operates only on the working directory it was given.
- **Non-MCP-capable client**: a client that does not support MCP cannot use this path;
  documentation directs such users to the CLI or SKILL.md adapters instead.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The MCP server MUST be distributed as part of the same public npm package
  release as the CLI — a single artifact, published once, at a single shared version.
- **FR-002**: Users MUST be able to start the MCP server with a zero-install command (the
  `npx`-style path) that requires no manual clone, build, or source checkout.
- **FR-003**: The published package MUST include the built MCP server entry and declare it
  as an executable bin, so the documented zero-install command resolves correctly after
  publish to the public registry.
- **FR-004**: The running MCP server MUST report a version identical to the package and the
  CLI.
- **FR-005**: The MCP server MUST communicate over local stdio only and MUST make no
  outbound network calls during startup or any tool call.
- **FR-006**: Each MCP tool MUST return results equal to the corresponding CLI command for
  the same `.runboard/` state.
- **FR-007**: The MCP adapter MUST NOT compute scores, deltas, triggers, or constraints
  itself; all computation MUST originate from the shared deterministic core consumed by the
  CLI.
- **FR-008**: Documentation MUST provide copy-paste client configuration for the primary
  MCP clients (at minimum Claude Desktop, Cursor, and VS Code) using the zero-install
  command.
- **FR-009**: When a tool is invoked in a directory without an initialised `.runboard/`,
  the server MUST return descriptive guidance rather than fail opaquely.
- **FR-010**: The release pipeline MUST build the MCP entry and verify CLI/MCP parity
  before publishing, and MUST block the publish if either fails.
- **FR-011**: The README MUST present the MCP server as a first-class adapter with setup
  steps, alongside the CLI and SKILL.md adapters.

### Key Entities *(include if feature involves data)*

- **Published package release**: the single public npm artifact that carries both the CLI
  and the MCP server at one shared version.
- **MCP server distribution entry**: the built, executable server entry and its declared
  bin within that package — the thing the zero-install command runs.
- **Client configuration snippet**: the copy-paste settings a user adds to an MCP client to
  register the server via the zero-install command.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From a machine with only Node ≥ 20, a user can go from nothing to working
  Runboard tools in their MCP client in under 5 minutes using only copy-paste configuration.
- **SC-002**: 100% of MCP tool outputs match the equivalent CLI command output for identical
  `.runboard/` state, verified by an automated parity test.
- **SC-003**: The MCP server and CLI report the same version on every release (zero
  version-drift).
- **SC-004**: The MCP server makes zero outbound network connections during startup and tool
  calls, verifiable by observation.
- **SC-005**: A single publish action ships both the CLI and the MCP server — no second
  package and no separate manual step.
- **SC-006**: Setup documentation exists and is independently verified for at least 3 major
  MCP clients.

## Assumptions

- "Deploy in the same way as npm" means the MCP server ships inside the existing public
  `runboard` package (one source of truth, single publish), not as a separate package.
- Transport is local stdio only. Remote/hosted MCP deployment, HTTP/SSE transports, and any
  authentication or hosted service are out of scope for this feature, consistent with the
  local-first, no-phone-home principle.
- The tool surface is the already-defined set (assess, pulse, roadmap, board, report,
  status). This feature covers distribution, client configuration, version parity, the
  publish gate, and documentation — not new tool capability.
- The exact zero-install invocation form (e.g. a bare `runboard-mcp` command versus a
  package-scoped invocation) is settled during planning so that the command documented for
  users actually resolves from the public registry after publish.
- Users have Node ≥ 20 available, the same baseline as the CLI.
