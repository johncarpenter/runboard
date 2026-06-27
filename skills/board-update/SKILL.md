---
name: runboard-board-update
description: Generate a board-ready, business-language technology update from the latest Runboard assessment. Use when someone needs a board pack, leadership update, or exec summary of engineering maturity.
---

# Runboard: Board Update

The CLI renders the report from the latest data and a template. You make sure it reads
well for a non-technical board.

## Steps

1. Generate the board-update report:

   ```bash
   runboard report --type board-update
   ```

2. Read the generated file under `.runboard/reports/board-update-<date>.md`.

3. Present it (max two pages). It already translates the framework's jargon into business
   outcomes. Optionally also produce the shareable board:

   ```bash
   runboard board --html
   ```

   and point the leader at `.runboard/board.html`.

## Rules

- Keep it to business language and outcomes. Do not paste raw dimension keys into a board
  pack — use the titles and the constraint framing the CLI provides.
- All figures come from the CLI. Do not compute or estimate maturity yourself.
