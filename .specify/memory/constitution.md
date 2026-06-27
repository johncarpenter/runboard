<!--
SYNC IMPACT REPORT
==================
Version change: (template) → 1.0.0
Bump rationale: First ratification of a concrete constitution from the template
  placeholders. MAJOR baseline establishment.

Principles defined:
  I.   Deterministic Core, Probabilistic Edge (NON-NEGOTIABLE)
  II.  Local-First, No Phone-Home
  III. Single Source of Truth
  IV.  Test Coverage Across Every Command (NON-NEGOTIABLE)
  V.   Documentation Updated With Every Merge
  VI.  Open Contribution via GitHub Issues

Sections added:
  - Additional Constraints (Stack, Distribution & UX)
  - Development Workflow & Quality Gates
  - Governance

Templates / artifacts reviewed:
  ✅ .specify/templates/plan-template.md — Constitution Check gate is generic;
       no edits required (gates derive from this file at plan time).
  ✅ .specify/templates/tasks-template.md — UPDATED: the top-level "Tests are
       OPTIONAL" note now defers to Principle IV (tests mandatory per command).
  ✅ CLAUDE.md — already encodes the spec §9 design rules; consistent.
  ✅ PRODUCT-BUILD-SPEC.md — source of Principles I–III; consistent.

Follow-up TODOs:
  - None.
-->

# Runboard CLI Constitution

## Core Principles

### I. Deterministic Core, Probabilistic Edge (NON-NEGOTIABLE)

All computation — scoring, averages, trajectory deltas, auto-trigger thresholds,
constraint detection, and every state transition — MUST live in `src/core/` as pure,
side-effect-free functions with no I/O. AI adapters MAY elicit input and SUGGEST a
score; they MUST NOT compute, average, or derive any result. A technical audience will
not trust "the LLM did the math," and they are correct to refuse it.

**Rationale**: The product's credibility rests on verifiable, reproducible numbers.
Separating deterministic math from probabilistic elicitation is what makes the tool
trustworthy and unit-testable.

### II. Local-First, No Phone-Home

All user data MUST remain in the user's own repository under `.runboard/`. v1 MUST make
no network calls, ship no telemetry, and require no accounts, auth, or hosted services.
This is a stated feature, not an omission, and MUST be documented loudly in the README.

**Rationale**: The target audience (technical leaders) treats data residency as a trust
precondition. Any phone-home behaviour breaks the core promise.

### III. Single Source of Truth

The CLI core (`src/core/`) MUST be the only implementation of business logic. The MCP
server, SKILL.md skills, and AGENTS.md adapters MUST call the core (or shell out to the
CLI) and MUST NOT duplicate scoring, delta, trigger, or constraint logic. Assessments
MUST be committed markdown so that git history is the authoritative trajectory record.

**Rationale**: Logic written once and exposed everywhere keeps adapters honest and
prevents divergence across the ~40 agent platforms the skills target. Git-as-trajectory
makes the tool practise the framework it measures.

### IV. Test Coverage Across Every Command (NON-NEGOTIABLE)

Every CLI command (`init`, `assess`, `pulse`, `roadmap`, `board`, `report`, `status`)
MUST have automated test coverage. The deterministic `src/core/` functions MUST be
unit-tested first (red-green) before any adapter consumes them — they are the
verification spine and MUST be green before adapters exist. No command ships without a
test exercising its primary path; no PR merges with failing or skipped tests.

**Rationale**: Because the core is pure by design (Principle I), it is cheap to test
exhaustively, and a deterministic instrument that is not tested is not trustworthy.

### V. Documentation Updated With Every Merge

This is a public-facing project; documentation is a deliverable, not an afterthought.
Every merge to `main` that changes behaviour, commands, flags, data schema, or adapters
MUST update the relevant Markdown documentation in the same change. Documentation MUST
be authored as `.md` files. A PR that changes user-observable behaviour without a
corresponding docs update is incomplete.

**Rationale**: Public adopters rely on docs as the contract. Stale docs on a public repo
erode trust faster than missing features.

### VI. Open Contribution via GitHub Issues

Work MUST be traceable to a GitHub issue. New work starts from an issue; pull requests
MUST reference the issue they resolve. Issues SHOULD carry enough context for an outside
contributor to pick them up without private knowledge.

**Rationale**: A public project lives or dies by whether outsiders can contribute. Issue
traceability keeps scope visible and the backlog the single coordination point.

## Additional Constraints (Stack, Distribution & UX)

- **Stack**: TypeScript compiled to JS, Node ≥ 20. Dependencies MUST stay lean (an arg
  parser, a prompt lib, a YAML lib, light templating); heavy frameworks are disallowed
  without justification recorded in Complexity Tracking.
- **Distribution**: Shipped as a public npm package runnable via `npx runboard@latest`
  with `"bin": { "runboard": "dist/cli.js" }`. The zero-install path MUST work end to end.
- **Five-minute first run**: `npx runboard init && runboard assess` MUST produce a
  scorecard and a named binding constraint on the first sitting, with the rubric anchors
  doing the teaching. Regressions to this flow are release-blocking.
- **Rubric IP**: The shipped `rubric/rubric.yaml` (9 dimensions × 5 anchored levels) is
  the source of truth for anchors and MUST stay reconciled with the practice IP it draws
  from.

## Development Workflow & Quality Gates

- **Build order** follows PRODUCT-BUILD-SPEC.md §10; the deterministic core with tests
  precedes any adapter.
- **Per PR, the following gates MUST pass before merge to `main`**:
  1. Lint passes with no warnings.
  2. Full test suite passes; new/changed commands carry tests (Principle IV).
  3. Documentation updated for any user-observable change (Principle V).
  4. PR references its originating GitHub issue (Principle VI).
  5. No network calls or telemetry introduced (Principle II).
- **CI** MUST run lint + test on every PR and verify the `npx .` path works end to end.
- Commits MUST be incremental and leave the build green; `--no-verify` and disabling
  tests instead of fixing them are prohibited.

## Governance

This constitution supersedes other practices where they conflict. All PRs and reviews
MUST verify compliance with the principles above; reviewers MUST cite the specific
principle when requesting changes for a violation. Any deviation MUST be recorded in the
plan's Complexity Tracking with a justification and the simpler alternative that was
rejected.

**Amendment procedure**: Amendments are proposed via a GitHub issue and PR that edits
this file, state the rationale, and bump the version per the policy below. Merging the
amendment requires the same gates as any other change plus an updated Sync Impact Report.

**Versioning policy** (semantic):
- MAJOR — backward-incompatible governance or principle removal/redefinition.
- MINOR — a new principle/section added or materially expanded guidance.
- PATCH — clarifications, wording, or non-semantic refinements.

**Compliance review**: The constitution is checked at every plan (`/speckit-plan`
Constitution Check gate) and at every PR review. Runtime development guidance for agents
lives in `CLAUDE.md` / `AGENTS.md`, which MUST stay consistent with these principles.

**Version**: 1.0.0 | **Ratified**: 2026-06-27 | **Last Amended**: 2026-06-27
