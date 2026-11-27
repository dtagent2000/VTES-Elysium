# REPORT — the documentation diet (27 Nov 2026, bot v0.6.243, no bot change; RULINGS D-145; PR #119)

## Why
After C1 the owner asked why the documentation had grown so heavy and whether it could be streamlined without losing focus.
Claude's diagnosis, measured on `3a8ab1e`: what a chat READS is not the weight (the bootstrap was 39,878 of 50,000 bytes); what
each round must WRITE and keep consistent is. (a) The same facts in many places: C1's figures sat in its CHANGELOG entry, its
report, STATUS, the project's handoff, the spec, the PR body and the commit messages, one figure often in three or four of them,
and 6 of C1's 10 egress findings were stale-doc (L-87's class). (b) The budget was a ratchet: raised 17 times, 160 → 207 KB,
since a raise with its reason always passed. (c) Rules were added and seldom removed. (d) A dense style: dates, D-numbers and
caveats in every sentence. The owner said yes to Claude's six steps, as a round of their own before C1b, and on the round's card
to the recommended option of each question (the words: the private data repo's RULINGS-WORDS.md, D-145).

## What was built
1. **One round record.** `tools/gates.sh` writes `record.json` beside its summary; `tools/round.py` v1.0.0 (`record`, `save`,
   `status`, `render`, `check`, a self-test in `tools/gates.sh` and CI) writes it as `docs/round-record.json` with CI's suite
   runs and the egress line, and renders its copies: STATUS's gates block, the CHANGELOG entry's *Gates:* and *Egress:*
   lines, the PR's gate section. `round.py check`, run by `tools/doc-budget.sh`, fails when a copy differs (STATUS's versions
   block against the code too).
2. **Short CHANGELOG entries.** A fresh working CHANGELOG on a template, at most 1,500 bytes an entry (checked); the 198 entries
   of 9 Sep – 27 Nov (512 KB) are frozen verbatim in `docs/history/elysium-bot-CHANGELOG-to-v0.6.243.md`.
3. **STATUS generated for the most part:** the versions (from the code), the deploy state (from git and GitHub) and the gates
   (from the record) are `round.py` blocks; Next and Not yet consumed are written by hand.
4. **RULINGS holds the rule:** each line keeps the decision, who made it and its rule sources; the build stories, versions and
   old debt numbers went out. 83,195 → 67,851 bytes; all 222 ids kept, D-145 added; D-101 and D-144 (3) say what D-145 amends.
   The register as it stood is frozen in `docs/history/RULINGS-2026-11-27.md`.
5. **The budget a ceiling, one in, one out.** `tools/doc-budgets.txt`; `doc-budget.sh --base` (in `tools/gates.sh` and CI) fails a
   rise of the total or the bootstrap that names no new D-line, and a rise of the pages' budgets beyond the total's; a page that
   runs out borrows from another or archives a line to `docs/history/archive-<page>.md`. `tools/test-doc-budget.sh` proves each
   case (red: a rise with no ruling, with an old ruling, of the bootstrap, a page's alone; a generated block gone; an entry over
   its cap. Green: a borrow; a rise with a new D-line).
6. **Fewer documents a round.** A spec changes only when its plan does; the zero-vtes readings are a section of the round's report
   (D-144 (3)); a tool's output a later round reads (the readers' verdicts: where they live was the card-chain proposal's
   question to this round) is a data file beside the report, from the start. The nine delivered round specs (V5 waves 2–6, the bench round, the Jack burn, a human's Grand Ball,
   the Banu Haqim pilot) are frozen in `docs/history/specs/`.

Beside them: HARNESS's "One place for each fact" and the round's steps; the egress reviewer's charter (its effort on the code
and the card data, what the tools check is theirs); `bot/CLAUDE.md`, HOWTO, README, START-HERE-BOTS-CHAT and the instruction's copy.

## The clean-up (the standing pages, bytes; nothing binding cut)
| page | on `main` (`77c5ded`) | after (`2320b70`) | budget |
|---|---|---|---|
| `bot/CLAUDE.md` | 13,188 | 12,941 | 13,500 |
| STATUS | 3,945 | 3,417 (before its generated gates block) | 4,800 |
| BOARD | 17,724 | 17,238 | 18,000 |
| RULINGS | 83,195 | 67,851 | 69,000 |
| LESSONS | 21,171 | 18,331 | 19,000 |
| ARCHITECTURE | 29,037 | 24,917 | 25,500 |
| HARNESS | 13,798 | 13,834 | 14,500 |
| HOWTO | 24,913 | 24,022 | 24,500 |
| the total | 206,971 (ceiling 207,000) | 182,551 | 184,000 |

What went: build stories and version tags (RULINGS, the rule names in ARCHITECTURE and `bot/CLAUDE.md`), LESSONS' long stories
(each keeps its lesson and a short example), ARCHITECTURE's file table (`bot/README.md` maps the files) and its run commands
(HOWTO's), restatements of HARNESS in RULINGS' process lines. HARNESS grew by the round record's steps. The ceiling is 184 KB, not
the 180 KB the card named: the last 4 KB would have to come out of binding rules or reference detail (ARCHITECTURE's decision
table, HOWTO's how-tos). The owner may still ask for it.

## Predictions (registered now, read at the next round with an egress review; D-93)
1. At most 2 stale-doc findings in that round's review, none on a figure the round record carries (C1: 6 of 10).
2. That round's documentation overhead (its CHANGELOG entry, STATUS's hand-written change, spec edits that record results, a
   separate zero-vtes report) at most 5 KB of added bytes; C1's was 14.2 KB (6.3 + 3.6 + 1.7 + 2.6). Its whole `bot/docs`
   writing, CARDS.md and the register left out, about half of C1's 25.1 KB at a like scope.
3. At least half of that review's findings on the code or the card data (C1: 4 of 10).
4. No budget rise without the owner's new D-line (CI holds it).
How: `git diff --unified=0 <merge base> <head> -- bot/docs`, added bytes per file (the method behind C1's numbers above), and
the egress line's classes.

## The last round's predictions; zero-vtes
C1's predictions (spec-card-sweep §11.7) were read in its own entry: both held. This round changed no play and read no cards.
