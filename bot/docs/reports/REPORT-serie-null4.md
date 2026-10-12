# serie-null4 — the 4-starter null: report against the registered predictions (19 Sep 2026)

Bot v0.6.131 · arena v1.3.4 · 12 matches, seeds 4001–4012, one process each · malkavian / tremere / nosferatu / ventrue · all shark ·
random seating · start pool 30. Numbers: `null-review.md` (gen-null-review v1.0.0). Deck and seat from the manifests only.
**This is a null point. Nothing is tuned against it.**

## Result
| deck | wins | VP | VP/match | first out | survived |
|---|---|---|---|---|---|
| ventrue | 8 | 26 | 2.17 | 1 | 8 |
| malkavian | 2 | 12 | 1.00 | 5 | 2 |
| tremere | 2 | 10 | 0.83 | 3 | 2 |
| nosferatu | 0 | 0 | 0.00 | 3 | 0 |

Ventrue sits on the Goudie bar (2.17 vs 2.0). Nosferatu took no VP at all in 12 matches and never survived.

## Change evaluation (change · prediction · observed · verdict)
| # | Prediction | Observed | Verdict |
|---|---|---|---|
| P1 | No deck wins 7+; ventrue 2–5 | ventrue 8 of 12 | **FAILED** — the table is not fair; ventrue is the new top deck |
| P2 | First referendum at or before action #3 in >= 8 of 12 | 11 of 12 (the 12th at #4) | HELD |
| P3 | Referendums per match, median 3–8 | median 5 (1–7) | HELD |
| P4 | 25–50 % blocked | 16 of 56 = 29 % | HELD — KRC 11/37, Ancilla Empowerment 4/5, Parity Shift 1/14 |
| P5 | >= 80 % of voted referendums pass | 40 of 40 | HELD — but 100 % says the pass estimate never takes a risk (see reading 2) |
| P6 | >= 50 % torpor → recovered | 8 of 15 overall; malkavian 3 of 8, ventrue 2 of 4 | HELD on the whole, weak for malkavian; the owner-alive filter was not applied |
| P7 | 25–40 % of paid act-again → keep-blocker | 3 of 23 paid = 13 % | **FAILED** — the ledger moved it: the waste is now NO LEGAL ACTION LEFT, 8 of 39 |
| P8 | polOverBuild fires in >= 6 matches | 0 of 12 | **FAILED** — see reading 1 |
| P9 | >= 3 of 5 never-seen behaviours seen; Dawn <= 2 | 4 of 5 seen (Sybren 8, Alexa 1, Dawn 3, block-barred 5); the vote tax never | HELD, Dawn one over (tags: rescuer, lethal, rescuer) |
| P10 | 0 err / timeouts / aborts; no price MISMATCH | 0 / 0 / 0; **price referee NOT run** — the project's gen-trace-harvest.js is v1.1.0, the v1.2.0 referee is not in the project | PARTLY |

## Readings (decision level)
1. **Debt 23b's rule is correct and inert at this table.** Build-first beat a referendum 7 times; all 7 were a KRC on a healthy prey
   (19–23 pool) — exactly the case the rule leaves to the bench. A Parity Shift never met a stock offer: the two need the same thing
   (a prince + a [DOM]/[PRE] stocker in hand on a short bench) and it did not happen once in 102 offers. Ventrue did NOT die before it
   voted: first referendum by action #3 in 11 of 12. Smoke5's picture (ventrue ousted after three actions) was two matches, not a pattern.
2. **Every referendum that reached the vote passed (40 / 40).** The bot only calls what it has the votes for — and 31 offers were turned
   down at pass 0.2 / 0.08. With three non-political decks at the table there are almost no title votes against it: malkavian, tremere
   and nosferatu cast 45 against and 10 for, and never stopped one. The only brake is the block (29 %).
3. **Referendums lose to a plain bleed 17 times, Intimidation 11, Enchant Kindred 8** — 12 of the lost KRCs had pass 0.85. Whether a
   KRC at 0.85 should lose to a bleed of 1 is a `_refValue` question (debt 18's weights) — measured here, not changed.
4. **Freak Drive without a legal action: 8 of 39 act-agains.** `decide('act-again')` never asks the turn ledger (v0.6.129). A paid
   card and 1 blood for an unlocked body that may not act. A bug, not a tuning — next release.
5. **Nosferatu 0 VP / 12, most bleed taken (130), most blocks made (65).** It blocks and still bleeds out; debt 8's reading (the slow
   decks lose on offence) holds. Tremere's debt-17 test can now be paired on these seeds.
6. **Malkavian is first out 5 of 12** and recovers only 3 of 8 torpors.
7. **Seat geometry:** ventrue won from every neighbourhood it sat in; its one first-out (seed 4001) was the cheapest-first opening
   (Oshri 4 + Madison, no prince, its only KRC blocked) — debt 13c.

## Not claimed
12 matches rank ventrue first with some confidence (8 wins); the order of the other three is NOT established (2 / 2 / 0 wins).
No paired control was run (`--knob polOverBuild=0` would be byte-identical in behaviour here: the tag fired 0 times).
