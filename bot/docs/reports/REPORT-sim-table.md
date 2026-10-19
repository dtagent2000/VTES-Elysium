# REPORT — the sim table (19 October 2026, bot v0.6.209, `elysium-bot-sim.js` v1.0.0)

Johan's "kör" on the sim table (19 Oct 19:17) and his seating question ("we should test all possible seatings, not just one,
since it affects tactical choices"). This report is the evidence behind the tool: why it is fast, that it plays the same game as
the real clock, what its first baseline shows, and what it found.

## 1. Why: the arena waits, it does not compute
| Table | Wall clock per match | CPU per match |
|---|---:|---:|
| Server arena, 4 bots, pace 0, askSecs 3 (seeds 9101, 9102) | 162 s, 212 s | ~3 s (user 2.6 + sys 0.4, arena + server) |
| Hotseat table, real clock, 4 bots, same settings (seeds 9101–9104) | 235–338 s | 1.6–2.3 s |
| Hotseat table, real clock, 5 bots (random seatings, seed 77) | 302–385 s | 1.9–2.4 s |
| **Sim table** (the same hotseat table, virtual clock) | **1.0–1.4 s** | 1.0–1.3 s |

About 99 % of a match is clocks running out (askSecs, grace windows, pacing). The hotseat table (`elysium-bot-hotseat.js`: the
client's real `hotBridge` lifted verbatim, real `Bot` instances, one process, a seeded deal) has no network, so every wait is a
timer. The sim runs each match in its own process with `setTimeout` / `clearTimeout` / `setInterval` / `clearInterval` / `Date`
replaced before the bot is required; when nothing is left to run, the clock jumps to the next timer.

## 2. The same game as the real clock
Eight matches were played twice — on the real clock (`--real`) and on the virtual clock — with the v0.6.208 bytes, and compared
with `ana-sim-diff.py` (decisions = every `decide` row's deciding fields and every card `play`, per bot):

| Set | Matches | Verdict | Outcome (winner, VP, rounds) | Table seconds |
|---|---:|---|---|---|
| 4 seats, fixed order, seeds 9101–9104, arena profile | 4 | SAME-PLAY 3, SAME-PLAY* 1 | identical in all 4 | identical to the second |
| 5 seats (+ sewer), random seatings from seed 77, arena profile | 4 | SAME-PLAY 4 | identical in all 4 | identical to the second |

SAME-PLAY = every bot made every decision and every card play the same; only some payload differs (where I read it: a
time-windowed tally count one higher, a statistic in the second decimal). SAME-PLAY* = the same per bot, but two bots' rows interleaved in another order (a reaction and the
next action at the same instant). No decision differed in any of the eight.

Determinism: two virtual runs of the same spec give byte-identical traces (the result row's wall / cpu fields aside) — fixed epoch,
seeded deal, one process per match.

## 3. The first all-seatings baseline (v0.6.209, the four V5 starters)
Design: every seating of malkavian / tremere / nosferatu / ventrue (24 = every cyclic order × every starting seat) × 10 deals
(seeds 1–10) = 240 matches, all expert, start pool 30.

| Profile | Wall clock (2 workers) | Table time | Ended |
|---|---:|---:|---|
| client (paceMs 3100, askSecs 20, deckName — the client's hotseat spawn) | 142 s | 486,568 s (135 h) | 240 last-standing |
| arena (paceMs 0, askSecs 3) | 155 s | 65,156 s (18 h) | 240 last-standing |

| Deck (client profile) | Wins | Win rate | VP/match ± SE | First out | Arena profile: wins / VP/match |
|---|---:|---:|---:|---:|---|
| malkavian | 124 | 52 % | 1.91 ± 0.11 | 32 | 124 / 1.93 |
| ventrue | 55 | 23 % | 1.05 ± 0.09 | 58 | 56 / 0.98 |
| tremere | 40 | 17 % | 0.77 ± 0.08 | 69 | 44 / 0.84 |
| nosferatu | 21 | 9 % | 0.27 ± 0.05 | 81 | 16 / 0.25 |

The two profiles agree on the deck order; the per-deck numbers are within their standard errors.

**Seating matters (Johan's point), client profile.** VP/match by seat position (seat 1 takes the first turn; 60 matches per cell,
SE ≈ 0.1–0.2 per cell):

| deck | seat 1 | seat 2 | seat 3 | seat 4 |
|---|---:|---:|---:|---:|
| malkavian | 1.75 | 1.92 | 1.67 | 2.32 |
| ventrue | 1.25 | 1.30 | 0.65 | 1.00 |
| tremere | 0.77 | 0.77 | 0.80 | 0.73 |
| nosferatu | 0.28 | 0.12 | 0.50 | 0.18 |

VP/match by predator (row = the deck, column = the deck that preys on it; 80 matches per cell, SE ≈ 0.1–0.2):

| deck | malkavian | ventrue | tremere | nosferatu |
|---|---:|---:|---:|---:|
| malkavian | — | 1.63 | 1.75 | 2.36 |
| ventrue | 1.16 | — | 0.88 | 1.11 |
| tremere | 0.69 | 0.47 | — | 1.14 |
| nosferatu | 0.35 | 0.15 | 0.31 | — |

Who sits behind a deck moves it by up to ~0.7 VP/match: Tremere scores 0.47 with Ventrue as its predator and 1.14 with Nosferatu;
Malkavian 1.63 behind Ventrue and 2.36 behind Nosferatu. The arena profile shows the same pattern, a little stronger (Tremere 0.47 vs 1.43,
Malkavian 2.45 behind Nosferatu): a weak predator is worth VP to its prey. A fixed or random-few seating measures the table as much as the deck —
the reason every deck-level claim now uses all seatings.

## 4. What it found (two fixes, v0.6.209)
- **The KRC overflow** (the first rotated batch, 24 matches: two ended with nobody standing — in the first the winner ousted
  itself after its last opponent was out, through this split and then Daring the Dawn and Fame; the second is the next point). `_refDeltas` put the points beyond the prey's pool on a side seat, and with two Methuselahs left the only side seat is the
  caller: prey −1, me −3 at prey pool 1. Fixed: the overflow never lands on me.
- **The self-ousting referendum** (that second rotated match, and match 175 of the first 240-match baseline): a 2-player Ancilla Empowerment at pool 4 with four
  minions (me −4, prey −4) scored +3.8 and ousted both. Fixed: `_bestPoliticalFor` never calls a referendum whose passing ousts me.
- **The footprint, version against version** (`ana-sim-diff.py` on the same 240-match design, v0.6.208 vs v0.6.209): 224 SAME-PLAY,
  16 DIVERGED — every one at a Ventrue referendum (12 KRC splits, 4 Ancilla Empowerment calls) — and 3 with another outcome (#50
  Nosferatu → Ventrue, #175 the post-game "winner" Malkavian → Ventrue, #194 the same winner after 14 rounds instead of 10). The
  post-game ousts: 1 → 0.

## 5. The stable's cards the sim shows (for the next round)
From the 240 v0.6.209 matches (hand snapshots in `decide` rows; plays in `play` / `through` / `master-play` rows):
- **Kevlar Vest** (Tremere ×1): in hand in 84 matches, never equipped. Why is for the next round: the equip finder ranks armour
  after intercept items and weapons, and the action scorer prices every non-intercept item at 1.15 × the economy weight.
- **.44 Magnum** (Tremere ×1): in hand in 102 matches, 7 equip actions, 7 strikes with it.
- **Spying Mission** (Malkavian ×4): 273 plays, every one the [obf] +1 stealth; the [OBF] bank (cancel a successful bleed, +2 bleed
  next time against the same Methuselah) never — no consumer, a doctrine question.
- **Pentex™ Subversion:** the curated entry is keyed under the old name *Pentex(TM) Subversion*; the printed name (KRCG's `name`)
  resolves exactly to an empty auto entry. The bots' own Tremere list uses (TM) and plays it (0.4 per match), and every reader of
  a played or given Pentex already tries both spellings — so today it bites only where a list is typed with ™: KRCG's precon
  lists (the coverage tool calls it TABLED-ONLY) and, in the V5 plan, every deck the precon generator writes from `vtes.json`.
- Bowl of Convergence works ([AUS] paid intercept via `_equipPaidIntercept`); `gen-deck-coverage.js` calls it PARTIAL because its
  class map predates the key.

## 6. What it is not
- Not a timing gate: zero latency and ideal ordering can hide a race a real table shows. The canary, the hotseat gate and the
  server arena stay; `--real` is the equivalence check.
- The offline route (the hotseat bridge). The online server's semantics are approximated by the bridge's `--arm full`; the server
  arena remains the online check.
- Volume is for measurement and regression, not for tuning knobs automatically against the bots' own meta.
