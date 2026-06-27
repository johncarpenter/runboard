# Phase 1 Data Model: Runboard CLI

**Feature**: 001-runboard-cli | **Date**: 2026-06-27

Entities are derived from the spec's Key Entities and the data schema in
PRODUCT-BUILD-SPEC.md §5. Types live in `src/core/types.ts` (pure, no I/O). Persistence
shapes (file formats) are owned by `src/data/`.

## Enumerations

### Area
`build` | `run` | `plan` — the three rows of the board.

### Lens
`team` | `tools` | `techniques` — the three columns of the board.

### DimensionKey
The 9 cells, formed as `<area>.<lens>`:
`build.team`, `build.tools`, `build.techniques`,
`run.team`, `run.tools`, `run.techniques`,
`plan.team`, `plan.tools`, `plan.techniques`.

### Level (1–5)
1 Ad-hoc · 2 Repeatable · 3 Defined (target) · 4 Measured · 5 Optimising.
**Validation**: integer, 1 ≤ level ≤ 5.

### Trajectory
`up` (⬆) | `flat` (➡) | `down` (⬇) | `volatile` (⚠).
**Validation**: must be one of the four literals.

### AssessmentType
`baseline` | `pulse` | `quarterly` | `event`.

## Entity: Rubric

The shipped 9-dimension model. Read-only in v1.

| Field | Type | Notes |
|-------|------|-------|
| `version` | string | rubric version, for the config version pin |
| `dimensions` | `RubricDimension[]` | exactly 9, one per DimensionKey |

### RubricDimension

| Field | Type | Notes |
|-------|------|-------|
| `key` | DimensionKey | unique; all 9 keys MUST be present |
| `area` | Area | redundant with key, for convenience |
| `lens` | Lens | redundant with key, for convenience |
| `title` | string | human label |
| `anchors` | `Record<Level, string>` | behavioural description for each of levels 1–5 |

**Validation rules**:
- Exactly 9 dimensions, keys matching the DimensionKey set with no duplicates/omissions.
- Each dimension has anchor text for all five levels.

## Entity: DimensionScore

A single scored cell within an assessment.

| Field | Type | Notes |
|-------|------|-------|
| `level` | Level | 1–5 |
| `trajectory` | Trajectory | one of the four |
| `evidence` | string | one-line note; may be empty but key must exist |

**Validation rules** (FR-008):
- `level` in range; `trajectory` valid; reject and name the offending DimensionKey if not.

## Entity: Assessment

A dated snapshot. Persisted as `.runboard/assessments/<YYYY-MM-DD>.md` with YAML
frontmatter + optional Markdown narrative.

| Field | Type | Notes |
|-------|------|-------|
| `date` | string (`YYYY-MM-DD`) | also the filename; unique per day |
| `type` | AssessmentType | default `baseline` for first, else `pulse` |
| `scores` | `Record<DimensionKey, DimensionScore>` | all 9 keys MUST be present |
| `notes` | string | optional |
| `narrative` | string | optional Markdown body after frontmatter |

**Validation rules**:
- All 9 DimensionKeys present (FR-004); each score valid (FR-008).
- `date` parseable; one assessment per date — refuse silent overwrite unless `--force`
  (FR-007).

**Ordering**: assessments sort chronologically by `date`; "latest" = max date; "two most
recent" = the two highest dates.

## Entity: Config

Local-only settings. Persisted as `.runboard/config.yaml`.

| Field | Type | Notes |
|-------|------|-------|
| `org` | string | display label only; never transmitted (Principle II) |
| `cadence` | string | optional cadence preference (e.g., `quarterly`) |
| `rubricVersion` | string | version pin matching the shipped rubric |

## Derived/computed values (outputs of `src/core/`, not persisted as entities)

These are pure functions of the inputs above. **No AI computes these** (Principle I).

### BoardSummary (`score.ts`)
- `cells`: per-DimensionKey `{ level, trajectory }` for rendering.
- `average`: mean of the 9 levels (rounded for display, exact value retained).
- `trajectoryCounts`: count of dimensions per Trajectory value.

### DimensionDelta (`delta.ts`)
For the two most recent assessments, per DimensionKey:
- `from`, `to`: Level; `change`: `to - from`; `trajectoryFrom`, `trajectoryTo`.

### Trigger (`triggers.ts`)
A DimensionKey flagged when its level has been **flat or regressing across three
consecutive assessments** (no increase across the last 3). Requires ≥ 3 assessments;
fewer ⇒ no triggers (and pulse/trajectory reads explain the prerequisite — edge case).

### BindingConstraint (`constraints.ts`)
The dimension with the lowest level; ties broken by worse trajectory
(`down`/`volatile` before `flat` before `up`); remaining ties broken by a deterministic
DimensionKey order. Drives the roadmap's "Now" items (FR-012, FR-016).

## Relationships

```
Rubric (1) ──provides anchors for──> DimensionScore (9 per Assessment)
Assessment (N) ──ordered by date──> trajectory history
   ├─ latest ───────────────> BoardSummary, BindingConstraint, Status
   ├─ latest two ───────────> DimensionDelta (pulse)
   └─ latest three+ ────────> Trigger detection
Config (1) ──pins──> Rubric.version
```

## State & lifecycle

- An Assessment is immutable once written for a date (overwrite requires explicit
  `--force`). There is no in-place edit flow in v1.
- The trajectory "history" is the ordered set of assessment files; git commits of those
  files are the authoritative record (Principle III). The tool reads files, not git, for
  computation, so results are reproducible from the working tree alone.
