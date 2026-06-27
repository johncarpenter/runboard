# Feature Specification: Runboard CLI

**Feature Branch**: `001-runboard-cli`

**Created**: 2026-06-27

**Status**: Draft

**Input**: User description: "Build the Runboard CLI per PRODUCT-BUILD-SPEC.md — a local-first tool that runs the Runboard 9-dimension maturity framework with a deterministic scoring core and portable AI adapters, distributed via npx."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See my own scorecard in five minutes (Priority: P1)

A technical leader who has just heard about the Runboard framework wants to go from
"bought into the concept" to "looking at my own maturity scorecard" in one sitting, with
no signup and nothing leaving their machine. They set up the tool in their own project,
answer a guided self-assessment across the nine dimensions (using the built-in rubric
anchors to calibrate each score), and immediately see a colour-coded board plus a named
"biggest constraint."

**Why this priority**: This is the entire promise of the product — the first run that
converts interest into a personal, credible artifact. If only this story ships, the tool
already delivers standalone value: a leader can self-assess and see where they stand.

**Independent Test**: From an empty project, run setup, complete an assessment of all
nine dimensions, and render the board — verify a scorecard appears with a per-dimension
level, a trajectory indicator, an overall average, and one identified binding constraint,
with no network activity.

**Acceptance Scenarios**:

1. **Given** a project with no prior Runboard data, **When** the user runs setup, **Then**
   a local Runboard workspace is scaffolded (config, the shipped rubric, an empty
   assessments area) and a next-step hint is shown; running setup again does not destroy
   existing data.
2. **Given** a scaffolded workspace, **When** the user runs a guided assessment, **Then**
   for each of the nine dimensions they are shown the behavioural anchors, asked for a
   level (1–5), a trajectory (up/flat/down/volatile), and a one-line evidence note, and a
   dated assessment record is saved.
3. **Given** a saved assessment exists, **When** the user renders the board, **Then** a
   3×3 heatmap is shown with a level colour and trajectory glyph per cell, plus the
   overall average and a count by trajectory.
4. **Given** an assessment already exists for today, **When** the user assesses again the
   same day without confirming an overwrite, **Then** the tool refuses to silently
   overwrite and explains how to force it.
5. **Given** an AI agent (not a human) is driving the tool, **When** it records an
   assessment non-interactively by supplying each dimension's level, trajectory, and
   evidence, **Then** the same dated record is produced as in the interactive flow.

---

### User Story 2 - Track whether things are getting better (Priority: P2)

A leader who has assessed more than once wants to know what moved since last time and
whether anything is stuck. They generate a "pulse" that compares the two most recent
assessments, shows per-dimension change, and automatically flags any dimension that has
been flat or regressing across three consecutive assessments.

**Why this priority**: The framework's core teaching is "measure trajectory, not state."
Repeat use and the tool's stickiness depend on this. It builds directly on P1 data.

**Independent Test**: With at least two assessments present, run the pulse and verify a
one-page delta memo is produced showing previous-vs-current per dimension, the deltas,
and any auto-triggered (3× flat/regressing) flags.

**Acceptance Scenarios**:

1. **Given** two or more assessments exist, **When** the user runs a pulse, **Then** a
   dated one-page memo is written summarising per-dimension deltas and a short
   "what moved and why it matters" narrative, and a summary prints to screen.
2. **Given** a dimension has been flat or regressing for three consecutive assessments,
   **When** a pulse runs, **Then** that dimension is flagged as an auto-trigger.
3. **Given** fewer than two assessments exist, **When** the user runs a pulse, **Then**
   the tool explains that at least two assessments are required and does not error out
   destructively.

---

### User Story 3 - Know what to work on next (Priority: P3)

A leader looking at their scorecard wants a short, prioritized improvement plan phrased in
business outcomes rather than technical tasks. They generate a roadmap that identifies the
binding constraint(s) and lays out a Now / Next / Later plan with enforced limits.

**Why this priority**: Turns diagnosis into action. Valuable but depends on having an
assessment (P1); without it there is nothing to prioritize.

**Independent Test**: With a latest assessment present, generate the roadmap and verify a
Now/Next/Later document is produced where the lowest-level dimension(s) (ties broken by
regressing trajectory) drive the "Now" items, with Now capped at 3 and Next capped at 5.

**Acceptance Scenarios**:

1. **Given** a latest assessment exists, **When** the user generates a roadmap, **Then** a
   roadmap document is written identifying the binding constraint (lowest level, ties
   broken by worse trajectory) and a Now/Next/Later plan.
2. **Given** the roadmap is generated, **When** it is rendered, **Then** "Now" contains at
   most 3 items and "Next" at most 5, and each item is phrased as a business outcome.

---

### User Story 4 - Produce a board-ready report (Priority: P3)

A leader preparing for a board or leadership meeting wants a short, business-language
report generated from their latest data — a two-page technology section in board-pack
form, translating the framework's jargon into outcomes.

**Why this priority**: A high-value sharing moment and a discovery driver, but it depends
on assessment data and on rendering being in place.

**Independent Test**: With latest data present, generate a board-update report and verify a
business-language document (max two pages) is produced from a template using the latest
assessment.

**Acceptance Scenarios**:

1. **Given** latest data exists, **When** the user generates a board-update report, **Then**
   a business-language document (≤ 2 pages) is produced from a template.
2. **Given** the user requests a different report type (e.g., baseline or monthly), **When**
   they generate it, **Then** the corresponding template is rendered with the latest data.

---

### User Story 5 - Check current state at a glance (Priority: P4)

A returning user wants a one-screen summary of where they stand right now: the latest
assessment date, the overall average, a count by trajectory, and any active auto-triggers.

**Why this priority**: A convenience surface over existing data; pleasant but not essential
to the core promise.

**Independent Test**: With at least one assessment present, request status and verify a
single-screen summary shows the latest date, average, trajectory counts, and active
triggers.

**Acceptance Scenarios**:

1. **Given** at least one assessment exists, **When** the user requests status, **Then** a
   one-screen summary shows latest date, average, trajectory counts, and active triggers.
2. **Given** no assessment exists, **When** the user requests status, **Then** the tool
   explains there is nothing to summarise yet and suggests running an assessment.

---

### User Story 6 - Share the board as a file (Priority: P4)

A leader wants to share their board with people who won't run the tool. They generate a
self-contained dashboard file they can open in a browser or send to a colleague.

**Why this priority**: The shareable artifact is a natural growth loop, but the in-terminal
board (P1) already delivers the core value.

**Independent Test**: Render the board as a file and verify a single self-contained file is
produced that displays the heatmap without requiring any external assets or network access.

**Acceptance Scenarios**:

1. **Given** a saved assessment exists, **When** the user renders the board as a file,
   **Then** one self-contained dashboard file is written that opens and displays the
   heatmap with no external dependencies.

---

### User Story 7 - Drive the tool from any AI agent (Priority: P4)

A user working inside an AI coding assistant (Claude, Cursor, Codex, Copilot, Gemini, a
tool-calling chat client, etc.) wants the assistant to run the elicitation conversation —
asking the framework's questions and suggesting scores — and then persist results through
the tool, so they get the identical product regardless of platform.

**Why this priority**: Broadens reach across platforms and is a differentiator, but the
human CLI path stands alone first.

**Independent Test**: Using a portable agent instruction (skill) and/or a tool-calling
interface, run an assessment elicitation and confirm the resulting record is identical to
one produced by the human flow, with all scores computed by the tool, not the agent.

**Acceptance Scenarios**:

1. **Given** a supported AI agent with the portable adapter available, **When** the agent
   conducts an assessment, **Then** it elicits input and suggests levels but the recorded
   scores, deltas, and triggers are computed by the tool, not the agent.
2. **Given** a tool-calling chat client, **When** it invokes the assess / pulse / roadmap /
   board / status capabilities, **Then** each produces the same result as the equivalent
   direct command.

---

### Edge Cases

- A dimension is missing or has an out-of-range level (e.g., 0 or 6) or an invalid
  trajectory value when recorded non-interactively → the record is rejected with a clear
  message naming the offending dimension.
- Only one assessment exists when a pulse or trajectory read is requested → the tool
  explains the prerequisite rather than failing opaquely.
- Two assessments share the same date → the tool refuses silent overwrite and offers a
  force path.
- The rubric or a data file is malformed or hand-edited into an invalid state → the tool
  reports what is wrong rather than producing a wrong score.
- The board is rendered with no assessment present → the tool explains nothing can be
  rendered yet.
- A tie exists for the lowest-level dimension when computing the binding constraint → it
  is broken by the worse (regressing) trajectory deterministically.

## Requirements *(mandatory)*

### Functional Requirements

**Setup & data**

- **FR-001**: The tool MUST scaffold a local workspace in the user's current project
  containing configuration, a shipped copy of the nine-dimension rubric, and an empty
  assessments area. Setup MUST be idempotent and MUST NOT destroy existing data.
- **FR-002**: All user data MUST be stored locally in the user's own project as
  human-readable, version-controllable files intended to be committed.
- **FR-003**: The tool MUST make no network calls, send no telemetry, and require no
  account, login, or hosted service.

**Assessment**

- **FR-004**: The tool MUST let a user record an assessment across all nine dimensions
  (the three areas Build/Run/Plan × the three lenses Team/Tools/Techniques), each with a
  level (1–5), a trajectory (up/flat/down/volatile), and a one-line evidence note.
- **FR-005**: Interactive assessment MUST present the behavioural anchors for each
  dimension and let the user choose a level, trajectory, and evidence note.
- **FR-006**: The tool MUST support a non-interactive assessment path (for AI agents)
  that records the same data without prompts.
- **FR-007**: Each assessment MUST be saved as a single dated record, and the tool MUST
  refuse to silently overwrite an existing same-day record unless explicitly forced.
- **FR-008**: The tool MUST validate recorded values and reject any assessment with a
  missing dimension, an out-of-range level, or an invalid trajectory, naming the problem.

**Computation (deterministic)**

- **FR-009**: All scoring, averaging, delta comparison, auto-trigger detection, and
  binding-constraint identification MUST be computed by the tool deterministically; AI
  adapters MUST NOT compute these values.
- **FR-010**: The tool MUST compute per-dimension deltas between the two most recent
  assessments.
- **FR-011**: The tool MUST flag a dimension as auto-triggered when it has been flat or
  regressing across three consecutive assessments.
- **FR-012**: The tool MUST identify the binding constraint as the lowest-level
  dimension, breaking ties by the worse (regressing) trajectory, deterministically.

**Reporting & rendering**

- **FR-013**: The tool MUST render a board as a 3×3 heatmap (areas as rows, lenses as
  columns) coloured by level with a trajectory glyph per cell, plus the overall average
  and a count by trajectory.
- **FR-014**: The tool MUST be able to render the board as a single self-contained file
  that displays without external assets or network access.
- **FR-015**: The tool MUST produce a one-page pulse memo comparing the two most recent
  assessments, listing deltas, flagged auto-triggers, and a short narrative.
- **FR-016**: The tool MUST produce a roadmap as a Now/Next/Later plan driven by the
  binding constraint, with Now ≤ 3 and Next ≤ 5 enforced, each item phrased as a business
  outcome.
- **FR-017**: The tool MUST produce reports from templates using the latest data,
  including a board-update report of at most two pages in business language.
- **FR-018**: The tool MUST produce a one-screen status summary showing latest assessment
  date, overall average, count by trajectory, and any active auto-triggers.

**Distribution & adapters**

- **FR-019**: The tool MUST be runnable without prior installation via a zero-install
  command path and also installable for repeated use.
- **FR-020**: The tool MUST ship portable AI-agent adapters (portable skill instructions
  and a tool-calling interface) that conduct the elicitation conversation and persist
  results by driving the tool, never by computing results themselves.
- **FR-021**: All entry points (direct commands, tool-calling interface, agent skills)
  MUST produce identical results for the same inputs because they share one computation
  core.
- **FR-022**: The tool MUST ship sample data so that the board renders a meaningful
  demonstration immediately, before the user has recorded anything.

**Documentation & contribution (project governance)**

- **FR-023**: The project MUST ship user-facing documentation as Markdown, including a
  quickstart that states the local-first / no-phone-home guarantee prominently.
- **FR-024**: Every change that alters user-observable behaviour MUST update the relevant
  Markdown documentation in the same change.

### Key Entities *(include if feature involves data)*

- **Rubric**: The nine-dimension maturity model. Each dimension (one per area×lens pair)
  has five anchored levels (1 Ad-hoc, 2 Repeatable, 3 Defined/target, 4 Measured,
  5 Optimising) with behavioural descriptions. Shipped with the tool; the IP a user
  consumes, not edits, in v1.
- **Assessment**: A dated snapshot of the user's maturity. Holds a type
  (baseline/pulse/quarterly/event), the nine scored dimensions (level, trajectory,
  evidence each), and optional notes. Committed to the user's repo; the trajectory record
  is the history of these.
- **Dimension Score**: A single cell — area, lens, level (1–5), trajectory
  (up/flat/down/volatile), and a one-line evidence note.
- **Pulse / Delta Memo**: A generated comparison of the two most recent assessments with
  per-dimension change and flagged auto-triggers.
- **Roadmap**: A generated Now/Next/Later improvement plan derived from the binding
  constraint.
- **Report**: A generated business-language document (e.g., board-update) rendered from a
  template using the latest data.
- **Board**: The rendered dashboard (terminal heatmap and/or self-contained file).
- **Configuration**: Local-only settings — an org label, cadence preferences, and a
  version pin.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can go from nothing to a rendered scorecard with a named
  binding constraint in under five minutes in a single sitting.
- **SC-002**: 100% of scores, deltas, triggers, and constraints shown to the user are
  computed by the tool; none are computed by an AI agent.
- **SC-003**: Zero network calls occur during any operation; all data remains in the
  user's project.
- **SC-004**: A user who has recorded at least two assessments can produce a pulse memo
  that correctly identifies every dimension that has been flat or regressing for three
  consecutive assessments.
- **SC-005**: The same inputs produce identical results across every entry point (direct
  command, tool-calling interface, agent skill) — verified for all assessment, pulse,
  roadmap, board, and status capabilities.
- **SC-006**: Every user-facing capability has automated test coverage, and the
  deterministic computation has unit tests that must pass before release.
- **SC-007**: A shared board file opens and displays the heatmap correctly with no
  network access and no external files.
- **SC-008**: A user can run a meaningful board demonstration from shipped sample data
  before recording any of their own assessments.

## Assumptions

- **Audience**: Users are technical leaders (CTOs, engineering leads, fractional execs)
  comfortable running a command-line tool in a project they control.
- **Scale unit**: 1 Ad-hoc · 2 Repeatable · 3 Defined (target) · 4 Measured ·
  5 Optimising. Trajectory values are up, flat, down, volatile. (From the rubric IP.)
- **Storage as trajectory**: Assessments are committed to the user's version control;
  history of those files is the authoritative trajectory record.
- **Rubric is fixed in v1**: Users consume the shipped rubric; user customisation of the
  rubric is out of scope for this version.
- **Tool-calling interface scope**: A tool-calling server adapter is in scope but may
  follow shortly after the first release if it would otherwise threaten the timeline; the
  portable skill adapters and direct commands are the must-have adapter surfaces.
- **Out of scope for v1**: hosted SaaS, accounts/auth, multi-org, telemetry, any web app
  beyond the single self-contained board file, and user editing of the rubric.
- **Distribution name**: The published package name will be confirmed for availability at
  release; a fallback naming scheme is acceptable as long as the primary command name is
  preserved.
