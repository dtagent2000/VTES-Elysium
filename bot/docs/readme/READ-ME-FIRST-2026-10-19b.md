# Elysium Bots — delivery 19 October 2026 (evening): bot v0.6.208 → **v0.6.209** + THE SIM TABLE — DEPLOY CANDIDATE

**What it is.** Johan's "kör" (19 Oct 19:17) on the sim table proposed the same afternoon, with his seating question
("do we have to start from the hotseat table's fixed seating? we should test all possible seatings, since it affects
tactical choices"), and two referendum fixes the sim found on its first runs (they ride in this round by his 16 Oct
combining rule). The evidence is `docs/reports/REPORT-sim-table.md`. v0.6.208's READ-ME-FIRST
(`READ-ME-FIRST-2026-10-19.md`) stands for everything else.

## 1. The sim table — `elysium-bot-sim.js` v1.0.0 (new)
- **Why:** the arena waits, it does not compute. A 4-bot arena match took 162–212 s of wall clock and ~3 s of CPU; the
  hotseat table on the real clock 235–385 s and ~2 s. The hotseat table has no network, so every wait in it is a timer.
- **How:** each match runs in its own process with `setTimeout` / `clearTimeout` / `setInterval` / `clearInterval` /
  `Date` replaced by a virtual clock, installed before the bot is required. When nothing is left to run, the clock jumps
  to the next timer. A match takes 1.0–1.4 s; same spec = the same trace byte for byte (fixed epoch, seeded deal).
- **Seating:** `--seatings all` (default) plays every permutation of the deck list — 24 for four decks, 120 for five
  (every cyclic order × every starting seat); `random --matches N`; `fixed`. `--seeds K` deals per seating.
- **Profiles:** `client` (default) = the client's hotseat spawn (paceMs 3100, askSecs 20, deckName); `arena` = 0 / 3.
- **Knobs and personas:** `--knob k=v` · `--knob DECK:k=v` (that deck wherever it sits) · `--knob N:k=v` (seat N);
  `--personas` one per deck. A knob neither in the bot's defaults nor read as `this.o.k` is warned about.
- **Output:** arena-shaped traces (`match-NNNN.jsonl` + a `result` row with the arena's `computeVp` / `deriveWinner`),
  `design.json`, `summary.json` + `SUMMARY.md`: per deck, per seat position, per prey, per predator. An oust after one
  Methuselah is left is a post-game oust: not counted, listed. `ana-cards.py`, `ana-inv.py`, `gen-match-dossier.js`,
  `gen-trace-harvest.js` (the price referee: 0 mismatches) and `gen-batch-review.js` read the traces unchanged.
- **`ana-sim-diff.py` (new):** two runs of the same design, match by match — IDENTICAL / SAME-PLAY / SAME-PLAY* (the same
  decisions per bot, rows interleaved differently) / DIVERGED with the first decision that differs (referendum terms count).
- **`elysium-bot-hotseat.js` v1.3.0:** optional `personas`, `seatKnobs`, `onEvent`; `res.names` / `res.personas`.
  Absent, it is v1.2.0 (the gate passes none).
- **Not a timing gate.** Zero latency can hide a race; the canary, the hotseat gate and the server arena stay. `--real`
  runs the same table on the real clock.

## 2. The same game as the real clock
Eight matches (four 4-seat matches in one fixed seating, seeds 9101–9104; four 5-seat random seatings with sewer, seed 77), real clock
against virtual, v0.6.208 bytes: SAME-PLAY 7, SAME-PLAY* 1 — every bot made every decision and card play the same, the
outcomes and the table seconds were identical. No decision differed.

## 3. Two fixes the sim found (v0.6.209)
- **The KRC overflow.** The first rotated batch (24 matches) had two that ended with nobody standing. In the first, the
  winner ousted itself after its last opponent was out (the KRC split below, then Daring the Dawn and Fame); the second
  was the self-ousting referendum (next point). `_refDeltas` (alloc scope) put the points beyond the prey's pool on a side seat, and with two
  Methuselahs left the only side seat is the caller (prey −1, me −3 at prey pool 1; 2 + 2 at prey pool 2). Now the
  overflow goes to a side seat that is not me and stays on the prey otherwise (prey −3, me −1). Three or more
  Methuselahs: v0.6.126 unchanged.
- **The self-ousting referendum.** That second match, and match 175 of the first 240-match baseline: a 2-player Ancilla Empowerment at pool 4 with
  four minions (me −4, prey −4) scored +3.8 and ousted both. Now `_bestPoliticalFor` never calls a referendum whose
  passing ousts me (its pool cost plus my share of the terms ≥ my pool).
- **Footprint** (`ana-sim-diff.py`, the same 240-match design on v0.6.208 and v0.6.209): 224 SAME-PLAY, 16 DIVERGED —
  every one at a Ventrue referendum (10 KRC splits moved off the caller; 6 calls the guard dropped: 2 KRC, 4 Ancilla) — 3 of them with another outcome; post-game ousts 1 → 0.
- **Section 155** (7): the 2-player splits at prey pool 1 and 2, the three-player split unchanged, Ancilla not called at
  pool 4 and callable at pool 6, KRC not called when both sit at pool 1. On v0.6.208: 3/4 (155a, b, d, f red; the value
  check, 155c and 155e green by design).

## 4. The first all-seatings baseline (the four V5 starters, 240 matches, client profile)
| Deck | Wins | VP/match ± SE | First out |
|---|---:|---:|---:|
| malkavian | 124 (52 %) | 1.91 ± 0.11 | 32 |
| ventrue | 55 (23 %) | 1.05 ± 0.09 | 58 |
| tremere | 40 (17 %) | 0.77 ± 0.08 | 69 |
| nosferatu | 21 (9 %) | 0.27 ± 0.05 | 81 |

142 s of wall clock for 486,568 s (135 hours) of table time. The arena profile agrees (124 / 56 / 44 / 16 wins). Who sits
behind a deck moves it by up to ~0.7 VP/match (Tremere 0.47 with Ventrue as its predator, 1.14 with Nosferatu) — the
per-seat and per-predator tables are in the report. Invariant flags: 10 in 240 matches (observe-only kinds already known:
5 strike-taken, 3 pool-print, 2 pool-drift); not read further this round.

## 5. The stable's cards the sim shows (Johan: "the remaining 3–4 cards" — the next round)
- **Kevlar Vest** (Tremere): in hand in 84 matches, never equipped.
- **.44 Magnum** (Tremere): in hand in 102 matches, 7 equip actions, 7 strikes with it.
- **Spying Mission** (Malkavian ×4): 273 plays, all the [obf] +1 stealth; the [OBF] bank never (no consumer; a doctrine
  question: when to cancel a successful bleed and keep +2 for the next one against the same Methuselah).
- **Pentex™ Subversion:** the curated entry is keyed *Pentex(TM) Subversion*; the printed name hits an empty auto entry.
  The bots' own Tremere list uses (TM) and plays it, and the readers of a played or given Pentex try both spellings — so it
  bites only for a list typed with ™: KRCG's precon lists, and every deck the V5 plan's precon generator would write.
- Bowl of Convergence works; `gen-deck-coverage.js` calls it PARTIAL because its class map predates `interceptPaid`.

## 6. Gates (on the release bytes)
- `node --check` on every changed JS file, `py_compile` on `ana-sim-diff.py`.
- **Suite 2217/0 ×3** (alone, frozen snapshot with the root client v2.6.167 one level up, so 154f ran each time; v0.6.208: 2210, +7 = section 155;
  release bytes `elysium-bot.js` 35d23437…, `test-bot-logic.js` 24329b6b…, `elysium-cardfx.json` bea73088… unchanged).
- **Canary 69/0** with `bot/`'s read-only copies and **69/0** with main's v2.6.167 client + protocol and srv-2.6.49.
- **Hotseat gate 11/0** (hotseat table v1.3.0), **HB1 11/11**.
- **Section 155 destructively:** 3/4 on v0.6.208's `elysium-bot.js` (155a, b, d, f red; three green by design).
- **check-versions:** agrees (the root's 21 files are byte copies of client/ or bot/).
- `test-cardfx.js` not run (cardfx unchanged).
- **The sim's own checks:** real vs virtual clock 8/8 the same decisions; the same 24-match design twice: IDENTICAL 24;
  the 240-match client baseline re-run on the final bytes (two comments changed since): IDENTICAL 240; three 240-match baselines
  (v0.6.208, v0.6.209, arena profile) with 0 crashes and 0 stuck tables.

## 7. Release
`BOT_VERSION` 0.6.209; the CHANGELOG carries the v0.6.209 entry on top (Bot) and the sim table (Tools). The handshake in
`bot/CLAUDE.md`, the context, the learnings, `SKILLS.md`, `README.md`, the journal and `docs/START-HERE-BOTS-CHAT.md` are
updated. `START-HERE-BOTS.html`: version chip and footer only. The bundle is copied to the root. Handoff:
`docs/handoffs/HANDOFF-to-main-2026-10-19-v0_6_209.md` (nothing for main to build; re-embed the guide).

## 8. Next
- **The stable's cards (§5)** — Johan's next step, with the sim as the test bench: per card, a rig or a series that shows it
  played right.
- Then the V5 plan agreed earlier the same day: the precon generator (the 18 V5 precons are in `vtes.json`), the coverage
  tool's class map, Toreador, then the waves — each new deck tested against the reference table in every seating.
- Unchanged from v0.6.208: main's replies not yet consumed (v0.6.206, v0.6.207, robustness, open hand); the 14 Oct
  scenario in `client/playtest/`; the parked profile exact-key lookups.

## 9. Anything I'm unsure about
- **The equivalence rests on eight matches, all on the arena profile** (pace 0, askSecs 3) and the v0.6.208 bytes. The client
  profile (pace 3100, askSecs 20) was not run on the real clock — one such match takes about half an hour. The virtual clock
  replays the same timers, so I expect the same result, but it is not measured.
- **The offline route only.** The sim lifts `hotBridge` from `bot/`'s read-only client copy (v2.6.162); the root's v2.6.167
  bridge was not compared, and the online server path is not simulated (`--arm full` approximates it).
- **Zero latency decides a race the same way every time.** One of the eight matches interleaved two bots' rows differently
  from the real clock; no decision changed, but that is exactly where a real-clock difference would show first.
- **One seeded `Math.random` drives both the deal and the bots' own choices**, and a seat's cards depend on the seat order:
  "the same deal seeds in every seating" does not mean the same cards for a deck. Seatings compare as a design, not as
  paired deals.
- **`ana-sim-diff.py` compares a set of deciding fields** (pick, block, play, target, terms …); a change only in a score or a
  why shows as SAME-PLAY. IDENTICAL is the strict verdict.
- **The self-oust guard is strict:** the bot never calls such a referendum, even when it would oust the prey at the same
  moment. I know of no case where that is right, but I did not check the rulebook on simultaneous ousts.
- **The coverage numbers in this afternoon's answer used the tool's July class map;** the remaining-cards list above comes
  from the traces instead, and Bowl of Convergence is the proof that the map is stale.
