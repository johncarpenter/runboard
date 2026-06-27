---
name: runboard-assess
description: Run a Runboard 9-dimension maturity self-assessment with a technical leader, then persist it via the runboard CLI. Use when someone wants to assess or score their engineering maturity.
---

# Runboard: Assess

You conduct the assessment conversation. **The CLI computes and stores everything — you
never calculate scores, averages, or constraints yourself.**

## Steps

1. Ensure the workspace exists. If `.runboard/` is absent, run:

   ```bash
   runboard init
   ```

2. Read the anchors from `.runboard/rubric.yaml`. For each of the nine dimensions
   (`build.team`, `build.tools`, `build.techniques`, `run.team`, `run.tools`,
   `run.techniques`, `plan.team`, `plan.tools`, `plan.techniques`):
   - Show the 1–5 behavioural anchors.
   - Ask what best matches today. Suggest a level, but let the leader decide.
   - Capture a trajectory: `up`, `flat`, `down`, or `volatile`.
   - Capture one line of evidence.

3. Persist the assessment in a single non-interactive call. Pass every dimension:

   ```bash
   runboard assess \
     --set build.team=2:flat:"All devs contracted; no retained capability" \
     --set build.tools=3:up:"CI introduced last quarter" \
     --set build.techniques=2:flat:"Cadence inconsistent" \
     --set run.team=2:flat:"Informal on-call; knowledge concentrated" \
     --set run.tools=2:up:"Monitoring being extended" \
     --set run.techniques=3:flat:"Defined incident process" \
     --set plan.team=2:up:"CEO comms strengthening" \
     --set plan.tools=1:flat:"No roadmap tool or analytics" \
     --set plan.techniques=2:up:"Strategy being established"
   ```

4. Show the result:

   ```bash
   runboard board
   ```

   Read back the average and the named binding constraint from the CLI output. Do not
   restate numbers you computed yourself.

## Rules

- All nine dimensions are required in one `assess` call.
- Levels are 1–5; trajectory is one of up/flat/down/volatile.
- If the CLI reports a validation error, fix the offending dimension and re-run.
- Never overwrite an existing same-day assessment without confirming `--force` with the user.
