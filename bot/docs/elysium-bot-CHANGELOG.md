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

- **C1b (27 Nov 2026, bot v0.6.244; PR #121)** — D-148 (the owner's card). The card chain's gaps fixed:
  a bleed card's header stealth (9.13); a stealth mode's bleed and its limited slot (10.17), said once the blocks are
  declined, a reduction before it read off the actor's total; at the same stealth a stealth card's bleed wins unless a limited
  modifier adds more, the owner's keep rules first; the "or" option (10.25); the actor's title and sect (7.5); a mode's price and the
  action's form (7.6). Compiler v1.13.0. Readers, 164 verdicts: the 13 other V5 decks' flagged cards (10.26), the extra-cost
  flags (7.9), the agreeing rows' sample (6 of 60 ours wrong: C1c). Unread rows 92 → 65.
  *Gates:* `tools/gates.sh --sim --smokes` on `c1b` `6ebc0e8` + the working tree (27 Nov; bytes `41d04006` / `f67335d4` / cardfx `21ef103f`): PASS 20 · FAIL 1 · SKIPPED 0 (sim-240 240 matches: DIVERGED 115, SAME-PLAY 125 · 0.6.243 -> 0.6.244, with the version put back: 240 matches: DIVERGED 115, SAME-PLAY 125 · ana-gates PASS (6 of 6) · bytes 41d04006 f67335d4 21ef103f; v5-smokes FAIL 13 of 14 smokes PASS · banuhaqim:FAIL (5 of 6)). CI's suite 2854/0 ×3, `bot-gates` success on `71d4cf1`. v5-smokes: banuhaqim's steal pair is on v0.6.243's bytes too, the same seed (re-run)
  *Egress:* 12 findings (stale-doc 4, half-done 3, unproven 3, rule-missed 2) in 4 passes (Opus 6, Fable 4, Fable 2, Fable clean), 12 fixed, 0 listed
  *Report:* `reports/REPORT-c1b-2026-11-27.md`.

- **The card chain (27 Nov 2026, bot v0.6.243, no bot change; PR #120)** — D-147, each the recommended option on the owner's
  card, after his yes to the proposal: the abstract table's first layer (`elysium-bot-abstract.js`: a state built directly, real
  bots on the client's bridge, the virtual clock; its own rules rulebook-cited), the reader gate (`gen-reader-gate.js`: 360 gated
  rows, 92 unread, listed by register entry) and the scenario bench (`test-card-scenarios.js`: 297 scenarios in four windows, one
  row listed), all three in `tools/gates.sh` and CI; the readers' data file (readers v1) with C1's side notes read (15 hold: 9.12,
  10.24) and the agreeing rows' sample drawn for C1b; new register entries 7.7, 7.8, 9.13, 9.14, 10.23, 10.25. D-146: Claude
  merges on the owner's yes. The ceiling 187 KB. STATUS Next 1.
  *Gates:* `tools/gates.sh` on `card-chain` `27c5f5d` (27 Nov; bytes `14d48ac8` / `bae2970e` / cardfx `c4b9545e`): PASS 18 · FAIL 0 · SKIPPED 0. CI's suite 2841/0 ×3, `bot-gates` success on `2e8abaa`.
  *Egress:* 10 findings (stale-doc 6, test-weakened 2, half-done 1, unproven 1) in 3 passes (Fable 7, Fable 3, Fable clean), 10 fixed, 0 listed
  *Report:* `reports/REPORT-card-chain-2026-11-27.md`.

- **The documentation diet (27 Nov 2026, bot v0.6.243, no bot change; PR #119)** — D-145: the owner's go-ahead on Claude's six
  steps after C1, and the recommended options on the round's card. A round's figures are written once, in the round record
  (`tools/gates.sh` writes it; `tools/round.py` saves it, renders STATUS's gates block, this entry's two lines and the PR's
  gate section, and fails on drift); this template, at most 1,500 bytes; STATUS generated but for Next; RULINGS holds the rule
  (every id kept); the budget a ceiling, one in, one out (CI fails a rise of the total with no new D-line); the standing pages
  207 → about 183 KB, nothing binding cut; the zero-vtes readings a section of the round's report; the old CHANGELOG, the
  register as it stood and nine delivered round specs frozen in `docs/history/`.
  *Gates:* `tools/gates.sh` on `docs-diet` `eb0f3c8` (27 Nov; bytes `14d48ac8` / `bae2970e` / cardfx `c4b9545e`): PASS 16 · FAIL 0 · SKIPPED 0. CI's suite 2841/0 ×3, `bot-gates` success on `cca8d0c`.
  *Egress:* 12 findings (rule-missed 4, half-done 4, stale-doc 4) in 3 passes (Fable 11, Fable 1, Fable clean), 12 fixed, 0 listed
  *Report:* `reports/REPORT-docs-diet-2026-11-27.md`.
