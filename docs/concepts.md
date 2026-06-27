# Concepts

## The nine dimensions

Runboard scores three **areas** across three **lenses**:

|        | Team | Tools | Techniques |
|--------|------|-------|------------|
| **Build** | retained capability | reproducible builds/CI | delivery cadence & standards |
| **Run**   | production ownership | monitoring/observability | incident process |
| **Plan**  | leadership alignment | roadmap & analytics | strategy & prioritisation |

## The scale

| Level | Meaning |
|-------|---------|
| 1 | Ad-hoc |
| 2 | Repeatable |
| 3 | Defined (the target operating level) |
| 4 | Measured |
| 5 | Optimising |

The full behavioural anchors for each level live in `rubric.yaml`.

## Trajectory

Each dimension also carries a trajectory: `up` ⬆, `flat` ➡, `down` ⬇, `volatile` ⚠.
The framework's teaching is to **measure trajectory, not just state** — a level-2 area
trending up is healthier than a level-3 area sliding down.

## Auto-triggers

A dimension is auto-triggered when its level has not increased across the three most
recent assessments (flat or regressing). Triggers are the signal that something is stuck
and needs deliberate attention.

## Binding constraint

The single most limiting dimension: the lowest level, with ties broken by the worse
trajectory. The roadmap's "Now" items always target it — fix the constraint before
polishing areas that are already at target.

## Deterministic by design

Every number — averages, deltas, triggers, the constraint — is computed by the CLI, never
by an AI assistant. AI adapters help you *elicit* scores and *interpret* results; they do
not calculate them. That separation is what makes the scorecard trustworthy.
