# Runboard CLI — Product Build Spec

*A blueprint a coding agent can execute to build the "test it out" product: a local-first CLI that runs the Runboard framework, with portable AI adapters. Node/TypeScript, distributed via npx, shipped as a public GitHub repo.*

---

## 0. How to use this spec

Build the repo in §8, in the order in §10. The guiding principle (§9) is non-negotiable: **a deterministic core does all computation; AI only does elicitation and judgment.** Everything else serves that split.

This is a **separate repository** from the brand content (`runboard/`) and the practice IP (`CTO-runbooks/`). It draws the rubric from `CTO-runbooks/rubric/rubric.yaml` but ships its own copy.

---

## 1. What we're building

A CLI that takes a technical leader from "bought into the concept" to "looking at my own scorecard" in five minutes, with no signup and no data leaving their machine. It is the framework's instrumentation layer made runnable — and the literal realisation of the brand name: `runboard board` renders the Runboard.

**Three layers:**

1. **Core CLI (`runboard`)** — deterministic engine: scoring, trajectory deltas, auto-trigger logic, constraint detection, report and dashboard rendering, local data persistence.
2. **Portable AI adapters** — thin wrappers that drive the CLI: SKILL.md skills (portable across ~40 agent platforms), an MCP server (for tool-calling chat clients), and an AGENTS.md (generic agent instructions). All call the same core.
3. **Distribution** — a public GitHub repo, installable with `npx runboard@latest`.

**The principle that makes it generic:** the CLI is the single source of truth; MCP, SKILL.md, and AGENTS.md are front doors to it. Write the logic once, expose it everywhere. The author uses Claude, but shipping the portable adapters means Cursor / Codex / ChatGPT users get the identical product with no extra work.

---

## 2. v1 scope

**In:**

- `init`, `assess`, `pulse`, `roadmap`, `board`, `report`, `status` commands.
- The 9-dimension rubric (Build/Run/Plan × Team/Tools/Techniques), 1–5 scale, trajectory indicators.
- Local-first markdown/YAML storage; git history as the trajectory record.
- SKILL.md adapters for assess / pulse / roadmap / board-update.
- AGENTS.md + CLAUDE.md symlink.
- A self-contained `board.html` dashboard (the heatmap).
- An `examples/` sample so `board` demos instantly.

**In, but may fast-follow to v1.1 if it threatens the timeline:**

- The MCP server. Include if cheap (it's a thin wrapper over the same core); defer only if it slows v1.

**Out (explicitly):**

- No hosted SaaS, no auth, no accounts, no multi-org, no telemetry.
- No web app beyond the static `board.html`.
- No editing of the rubric IP by users in v1 (they consume it; customisation later).

---

## 3. Stack & distribution

- **Language:** TypeScript, compiled to JS. Node ≥ 20.
- **Run/install:** `npx runboard@latest <command>` (zero-install path) and global `npm i -g runboard`.
- **Package name:** prefer `runboard` on npm; if taken, fall back to `@runboard/cli` with a `runboard` bin. (Verify availability at build time; do not assume.)
- **Bin:** `package.json` → `"bin": { "runboard": "dist/cli.js" }`.
- **Deps (keep lean):** an arg parser (e.g. `commander`), a prompt lib (e.g. `@clack/prompts` or `prompts`), a YAML lib, and a small templating approach (string templates or `eta`). Avoid heavy frameworks.
- **MCP:** the official TypeScript MCP SDK, stdio transport, runnable as `npx runboard-mcp`.

---

## 4. CLI surface

```
runboard init
    Scaffold .runboard/ in the current repo: config.yaml, rubric.yaml (copied),
    assessments/ (empty). Idempotent. Prints next-step hint.

runboard assess [--type baseline|pulse|quarterly|event] [--set <dim>=<level>:<traj>:"<evidence>"]...
    Record a 9-dimension assessment. Interactive by default: for each dimension,
    show the behavioural anchors, ask level (1-5), trajectory (up/flat/down/volatile),
    and a one-line evidence note. Non-interactive via repeated --set flags (for AI agents).
    Writes assessments/<YYYY-MM-DD>.md. Refuses to silently overwrite same-day files
    (use --force).

runboard pulse
    Compare the two most recent assessments. Compute per-dimension deltas. Flag any
    dimension flat or regressing for 3 consecutive assessments (the auto-trigger).
    Write a 1-page delta memo to reports/pulse-<date>.md and print a summary.

runboard roadmap
    Read the latest assessment. Identify binding constraints (lowest level, breaking
    ties by regressing trajectory). Generate a Now/Next/Later skeleton — Now ≤ 3,
    Next ≤ 5, enforced. Business-outcome phrasing, not technical tasks. Write roadmap.md.

runboard board [--html]
    Render the dashboard. Default: a coloured 3×3 heatmap in the terminal (score +
    trajectory glyph per cell, plus average and trajectory counts). --html writes a
    self-contained board.html (no external assets) — the shareable Runboard.

runboard report --type board-update|baseline|monthly
    Render a report from templates/ using the latest data. board-update = the 2-page
    board-pack technology section in business language.

runboard status
    One-screen current state: latest assessment date, average, count by trajectory,
    any active auto-triggers.

runboard --version | --help
```

---

## 5. Data model

Everything lives under `.runboard/` in the user's own repo and is meant to be committed (git history = the trajectory record).

```
.runboard/
├── config.yaml             # org label (local only), cadence prefs, version pin
├── rubric.yaml             # the 9-dimension rubric (shipped; the IP)
├── assessments/
│   └── 2026-06-27.md       # one file per assessment (frontmatter below)
├── reports/                # generated pulse/board-update memos
├── roadmap.md              # generated Now/Next/Later
└── board.html              # generated dashboard (when --html)
```

**Assessment file schema** (`assessments/<date>.md`):

```yaml
---
date: 2026-06-27
type: baseline            # baseline | pulse | quarterly | event
scores:
  build.team:       { level: 2, trajectory: flat,     evidence: "All devs contracted; no retained capability" }
  build.tools:      { level: 3, trajectory: up,       evidence: "CI introduced last quarter" }
  build.techniques: { level: 2, trajectory: flat,     evidence: "Cadence inconsistent" }
  run.team:         { level: 2, trajectory: flat,     evidence: "Informal on-call; knowledge concentrated" }
  run.tools:        { level: 2, trajectory: up,       evidence: "Monitoring being extended" }
  run.techniques:   { level: 3, trajectory: flat,     evidence: "Defined incident process" }
  plan.team:        { level: 2, trajectory: up,       evidence: "CEO comms strengthening" }
  plan.tools:       { level: 1, trajectory: flat,     evidence: "No roadmap tool or analytics" }
  plan.techniques:  { level: 2, trajectory: up,       evidence: "Strategy being established" }
notes: "First baseline."
---

Optional markdown narrative.
```

**Trajectory values:** `up` (⬆), `flat` (➡), `down` (⬇), `volatile` (⚠).

**Scale:** 1 Ad-hoc · 2 Repeatable · 3 Defined (target) · 4 Measured · 5 Optimising. Anchors live in `rubric.yaml`.

---

## 6. Rendering

- **Heatmap** (board): 3×3 grid, rows Build/Run/Plan, columns Team/Tools/Techniques. Colour by level (1 red → 5 green), trajectory glyph in each cell. Prefer heatmap over radar (framework default). HTML version is one self-contained file.
- **Pulse memo:** previous vs current table, deltas, flagged auto-triggers, a short "what moved and why it matters" section. One page.
- **Roadmap:** Now/Next/Later with the constraints enforced; each item phrased as a business outcome.
- **Board-update:** 2 pages max, business language (translate the jargon — reuse the translation table from the framework). Templates ported from `CTO-runbooks/templates/report-skeletons/`.

---

## 7. AI adapter layer

All adapters call the **same core module** (or shell out to the CLI). None of them compute scores or deltas themselves.

- **`skills/<name>/SKILL.md`** — `assess`, `pulse`, `roadmap`, `board-update`. Each has frontmatter (`name`, `description`) and a body that instructs the agent to: run the elicitation (ask the framework's questions, reference the anchors, suggest a level), then persist via the CLI (e.g. `runboard assess --set build.team=2:flat:"..."`). The skill owns the *conversation*; the CLI owns the *computation*. Written to the SKILL.md open standard so they run unmodified in Claude, Codex, Copilot, Cursor, Gemini CLI, etc.
- **`mcp/server.ts`** — an MCP server exposing tools: `runboard_assess`, `runboard_pulse`, `runboard_roadmap`, `runboard_board`, `runboard_status`. Thin wrappers over the core lib. stdio transport; runnable via `npx runboard-mcp`. For chat clients (ChatGPT, Claude desktop, Cursor) that prefer tool-calling over a shell.
- **`AGENTS.md`** (repo root) — tells any agent what the CLI is and how to drive it. Create `CLAUDE.md` as a symlink to it (Claude Code reads CLAUDE.md; the symlink keeps one source of truth).

---

## 8. Repo layout

```
runboard-cli/
├── README.md                 # quickstart: npx runboard init && runboard assess
├── LICENSE
├── package.json              # bin: runboard ; scripts: build, test, lint
├── tsconfig.json
├── src/
│   ├── cli.ts                # arg parsing → dispatch
│   ├── commands/             # init, assess, pulse, roadmap, board, report, status
│   ├── core/                 # DETERMINISTIC engine — pure functions, no I/O
│   │   ├── score.ts          # averages, level/trajectory helpers
│   │   ├── delta.ts          # pulse comparison
│   │   ├── triggers.ts       # flat/regressing 3× detection
│   │   └── constraints.ts    # binding-constraint identification for roadmap
│   ├── data/                 # load/save assessments, config, rubric (I/O lives here)
│   └── render/               # heatmap (terminal + html), report templates
├── skills/                   # SKILL.md adapters (portable)
│   ├── assess/SKILL.md
│   ├── pulse/SKILL.md
│   ├── roadmap/SKILL.md
│   └── board-update/SKILL.md
├── mcp/
│   └── server.ts             # MCP server over core (npx runboard-mcp)
├── templates/                # report skeletons (ported from CTO-runbooks)
├── rubric/
│   └── rubric.yaml           # the 9-dimension rubric, shipped
├── examples/
│   └── .runboard/            # sample assessments so `board` demos instantly
├── test/                     # unit tests on core/ (deterministic = testable)
├── AGENTS.md                 # generic agent guide
└── CLAUDE.md                 # symlink → AGENTS.md
```

---

## 9. Design rules (non-negotiable)

1. **Deterministic core, probabilistic edge.** All math, thresholds, and state transitions live in `src/core/` as pure, unit-tested functions. The AI suggests scores; it never computes them. A technical audience will not trust "the LLM did the average," and they're right.
2. **Local-first, no phone-home.** All data stays in the user's repo. No telemetry, no accounts, no network calls in v1. Say so loudly in the README — it's a feature for this audience.
3. **Git is the trajectory.** Assessments are committed; `pulse` and trajectory reads can use file history. The tool practises the framework's "measure trajectory, not state."
4. **One source of truth.** CLI, MCP, and skills all call `src/core/`. No logic is duplicated in an adapter.
5. **Five-minute first run.** `npx runboard init && runboard assess` must produce a scorecard and a named binding constraint on the first sitting, with the rubric anchors doing the teaching.

---

## 10. Build order

1. Scaffold the TS project: `package.json` (bin, scripts), `tsconfig`, lint, `README` quickstart.
2. Port `rubric.yaml` from `CTO-runbooks/rubric/rubric.yaml`; confirm 9 dims × 5 anchored levels.
3. Build `src/core/` (pure functions) **with unit tests first** — scoring, delta, triggers, constraints. This is the verification spine; it must be green before adapters exist.
4. Build `src/data/` (load/save assessments, config, rubric).
5. Build commands in this order: `init` → `assess` → `board` → `pulse` → `roadmap` → `report` → `status`.
6. Build `src/render/` (terminal heatmap, `board.html`, report templates).
7. Add `examples/.runboard/` sample data; verify `runboard board` renders it.
8. Write `skills/*/SKILL.md` adapters; verify they only elicit + shell out.
9. Build `mcp/server.ts`; verify tools call the same core.
10. Write `AGENTS.md`; create `CLAUDE.md` symlink.
11. Wire CI: lint + test on PR. Verify `npx .` works end to end.
12. Check npm name availability; publish (`runboard` or `@runboard/cli` fallback).

---

## 11. How it connects to the rest

- **Brand (`runboard/`):** the CLI is the product the positioning promised — methodology now, instrument here. The README should link to runboard.ai and frame the tool as step 2 of the learning path (after "read more").
- **Practice IP (`CTO-runbooks/`):** source of the rubric and report skeletons. The CLI is the self-serve, open-source expression of the same instrument the fractional practice runs by hand. Keep the rubric reconciled across the two (a standing check, as already noted for the brand canon).
- **Learning path:** "read more" → Substack/site; "test it out" → this repo. The board.html a user generates is the natural thing they share back, which feeds discovery.
