---
name: runboard-pulse
description: Generate a Runboard pulse comparing the two latest maturity assessments and surface stuck dimensions. Use when someone asks what changed, what moved, or whether progress is real.
---

# Runboard: Pulse

The CLI computes the deltas and the auto-triggers. You interpret them in plain language.

## Steps

1. Generate the pulse:

   ```bash
   runboard pulse
   ```

   This needs at least two assessments. If the CLI says so, run `runboard assess` to add
   one (or explain that a second sitting is needed later).

2. Read the generated memo at `.runboard/reports/pulse-<date>.md`.

3. Summarise for the leader, using only the CLI's numbers:
   - What improved, what regressed.
   - Any **auto-triggers** — dimensions flat or regressing across three consecutive
     assessments. Treat these as the things to act on.

## Rules

- Never compute deltas or decide what is "stuck" yourself — read it from the CLI output.
- Keep the read-back short and business-focused.
