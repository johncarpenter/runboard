---
name: runboard-roadmap
description: Produce a Now/Next/Later improvement roadmap from a Runboard assessment, anchored on the binding constraint. Use when someone asks what to work on, how to prioritise, or what to fix first.
---

# Runboard: Roadmap

The CLI identifies the binding constraint and enforces the Now/Next/Later limits. You help
the leader understand and commit to it.

## Steps

1. Generate the roadmap:

   ```bash
   runboard roadmap
   ```

   This needs at least one assessment.

2. Read `.runboard/roadmap.md`. It contains:
   - The **binding constraint** (lowest level; ties broken by worse trajectory).
   - **Now** (≤ 3 items), **Next** (≤ 5 items), **Later**, each phrased as a business
     outcome.

3. Walk the leader through it. Reinforce that the "Now" items target the single most
   limiting area.

## Rules

- Do not reorder or invent priorities — the CLI's ordering is deterministic and is the
  point. If the leader disagrees, capture that as input to the next assessment, not as an
  edit to the computed plan.
