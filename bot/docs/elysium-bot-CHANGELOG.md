# elysium-bot-CHANGELOG.md — what each round changed, newest first (from 27 Nov 2026; RULINGS D-145)

One entry a round, a release or not, on this template and at most 1,500 bytes (`tools/round.py check`, which
`tools/doc-budget.sh` runs). The details, the predictions and the reading of the last round's live in the round's report.

    - **vX.Y.Z, or the round's name (date[, bot vX.Y.Z, no bot change]; PR #n)** — what changed and why, in a few sentences,
      with the RULINGS lines and the BOARD line it answers.
      *Gates:* (pending)
      *Egress:* (pending)
      *Report:* `reports/REPORT-<round>-<date>.md`.

The two pending lines are `tools/round.py save`'s to render, from `docs/round-record.json`; each field starts its own line.

The entries of 9 Sep – 27 Nov 2026 (bot v0.1 to v0.6.243 and the rounds without a release to C1) are frozen in
`history/elysium-bot-CHANGELOG-to-v0.6.243.md`.

- **The documentation diet (27 Nov 2026, bot v0.6.243, no bot change; PR #119)** — D-145: the owner's go-ahead on Claude's six
  steps after C1, and the recommended options on the round's card. A round's figures are written once, in the round record
  (`tools/gates.sh` writes it; `tools/round.py` saves it, renders STATUS's gates block, this entry's two lines and the PR's
  gate section, and fails on drift); this template, at most 1,500 bytes; STATUS generated but for Next; RULINGS holds the rule
  (every id kept); the budget a ceiling, one in, one out (CI fails a rise of the total with no new D-line); the standing pages
  207 → about 183 KB, nothing binding cut; the zero-vtes readings a section of the round's report; the old CHANGELOG, the
  register as it stood and nine delivered round specs frozen in `docs/history/`.
  *Gates:* `tools/gates.sh` on `docs-diet` `fb92225` (27 Nov; bytes `14d48ac8` / `bae2970e` / cardfx `c4b9545e`): PASS 16 · FAIL 0 · SKIPPED 0. CI's suite ×3: not read.
  *Egress:* (the review's pass 3 is running)
  *Report:* `reports/REPORT-docs-diet-2026-11-27.md`.
