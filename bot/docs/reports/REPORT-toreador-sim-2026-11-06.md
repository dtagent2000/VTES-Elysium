# Toreador at the sim table — does it hold up? (6 Nov 2026, bot v0.6.217, sim v1.1.0)

**Question** (STATUS Next 1, Johan's go of 6 Nov): does the Toreador precon hold up beside the four starters, i.e. does it sit
inside the starters' span on VP and win share, so that it can join the client's menu (D-98: "a deck joins the menu when its rows are
playable and it holds up in the sim")? Every Toreador row is playable since v0.6.217 (`CARDS.md`; Creepshow Casino `unseen` in the
12-match smoke). The menu decision is Johan's; this report only reads the table. No bot change.

**Design.** `elysium-bot-sim.js --decks malkavian,tremere,nosferatu,ventrue,toreador --seatings all --seeds 2`: every seating of the
five decks (120 = every cyclic order × every starting seat) × deals 1–2 = **240 matches** at a five-seat table, the client profile
(paceMs 3100, askSecs 20, deckName) under the virtual clock, all seats expert, start pool 30. The starters are embedded in the bot;
toreador plays `deck-toreador.json` (`gen-precon.js`).

**Read (fixed before measuring).** Per deck VP/match ± SE and win share ± SE (binomial) over its 240 seats; the starters' span is
[lowest starter, highest starter] in this same run. The claim is read PAIRED: in every match all five decks sit at one table with one
deal, so per match Toreador's VP minus each starter's VP, the mean with its paired SE (and the same for wins). Toreador is *inside* the
span when its difference to the lowest starter is not significantly below 0 and its difference to the highest is not significantly
above 0 (95 %); *below* or *above* when the interval lies wholly on one side.

**Prediction, registered before measuring (6 Nov, commit `e2bc196` at 10:11, pushed before the series ran; D-93):**
- *The run:* 240 matches, all last-standing; no stuck or crashed match; played at 0 pool 0.
- *The starters keep their four-seat order* (`REPORT-sim-table.md` §3: malkavian > ventrue > tremere > nosferatu by VP/match).
- *Toreador inside the span:* VP/match 0.5–0.9 (wave 4's 48-match smoke: 0.67, 6 wins), above nosferatu and below ventrue; win share
  8–17 % (a fifth of the table is 20 %).
- *Its cards:* the Ball played with its pair in many Toreador matches and its bar never before a bleed; Change of Target played;
  Toreador Justicar's title taken; Creepshow Casino (unseen in the smoke) played at least once.
- *Audits:* ana-block 0 violations; ana-ledger no `VANISHED` and no `UNEXPLAINED`; ana-inv no new flag kind; handshake integrity
  100 % (ana-combat2). ana-windows' ran-out count is the sim's known measurement debt (BOARD), recorded, not a gate here.
- *Falsified if:* Toreador's interval against the lowest starter lies wholly below 0, or against the highest wholly above 0 (the
  prediction fails, not the deck); a stuck or crashed match; a play at 0 pool; a block violation; a Ball bar before a bleed.

## Results (observed 6 Nov)

240 matches in 139 s of wall clock (2 workers), all last-standing (5 VP a table: 1.00 a seat, a fifth of the wins expected), no
stuck or crashed match, played at 0 pool 0. Trace: scratch only (~120 MB), the spec above regenerates it byte for byte.

| deck | wins | win share ± SE | VP/match ± SE | first out | survived |
|---|---:|---:|---:|---:|---:|
| malkavian | 94 | 39.2 % ± 3.2 | 1.80 ± 0.12 | 33 | 93 |
| ventrue | 56 | 23.3 % ± 2.7 | 1.26 ± 0.10 | 42 | 55 |
| tremere | 41 | 17.1 % ± 2.4 | 0.89 ± 0.09 | 55 | 40 |
| **toreador** | **27** | **11.2 % ± 2.0** | **0.60 ± 0.08** | 55 | 29 |
| nosferatu | 22 | 9.2 % ± 1.9 | 0.45 ± 0.07 | 55 | 23 |

**Paired** (per match, the same table and deal; n = 240):

| Toreador minus | VP (paired SE) | 95 % | win share, points (paired SE) | 95 % |
|---|---:|---|---:|---|
| malkavian | −1.19 (0.16) | [−1.50, −0.88] | −27.9 (4.2) | [−36.2, −19.6] |
| ventrue | −0.66 (0.14) | [−0.94, −0.38] | −12.1 (3.7) | [−19.4, −4.8] |
| tremere | −0.29 (0.13) | [−0.54, −0.03] | −5.8 (3.4) | [−12.5, +0.9] |
| nosferatu | +0.16 (0.10) | [−0.05, +0.36] | +2.1 (2.9) | [−3.6, +7.8] |

**The answer: inside the span, at its low end.** Toreador is fourth of five: not separable from nosferatu, the weakest starter (which
is in the menu), on VP or wins, and below tremere by 0.29 VP (the VP interval clears 0, the win-share interval does not). By the read
fixed before measuring it is *inside*.

## Reading

- **The starters keep their order** here and on the four-seat client design run on the same bytes beside it (240 matches, every
  seating × deals 1–10): malkavian 2.01, ventrue 1.04, tremere 0.65, nosferatu 0.30 VP/match (53 / 24 / 14 / 9 % wins).
- **Seating moves Toreador as much as any deck.** VP/match by seat (48 matches each, seat 1 takes the first turn): 0.69 · 0.44 · 0.96 ·
  0.79 · **0.15** (SE 0.08; first out 15 times of 48, survived twice). Every deck swings 0.5–1.2 VP across the seats on this table
  (malkavian 1.38–2.40, ventrue 0.81–2.04); why seat 5 is Toreador's worst is not read here (one cell of 25, a lead). By prey it does
  worst on malkavian (0.33 VP) and best on ventrue (0.85) and tremere (0.80); by predator worst under ventrue (0.45).
- **It plays its deck.** `ana-cards.py`'s never-played list is empty: every library card was played. Creepshow Casino (unseen in the
  12-match smoke) gave its announce stealth 155 times in 46 matches. Toreador Justicar's title was taken in 94 matches (five Second
  Traditions later came from a vampire that had taken it); Change of Target 89 times in 88 matches, each in the if-blocked window;
  Scalpel Tongue's abstain 5 times; Majesty ended 366 combats; Resist Earth's Grasp 288 plays.
- **Politics land.** 894 political actions, 21 % blocked (ventrue 759, 38 %); 722 referendums, 98 % passed (ventrue 485, 97 %).
- **The Grand Ball is burned before it pays.** 68 Balls in 56 matches, each with its pair; 65 burned by a starter's (D) action
  (malkavian 17, nosferatu 16, tremere 19, ventrue 13; no burn was blocked), 34 in the round it was played and 22 in the next. Its
  56 bars went before a political action 35 times, a card action 19, stock 2 — never before a bleed. Bars per Ball: none for 29,
  one for 24, two for 13, three for 2 (0.82 on average) for 1 pool, the card and a locked Toreador. A pricing question for a later
  wave (L-9), not a fault: the table spends an action on each burn.

## Audits (both series on the v0.6.217 bytes)

| audit | the Toreador table | the four-seat design |
|---|---|---|
| ended | 240 last-standing | 240 last-standing |
| played at 0 pool (SUMMARY) | 0 | 0 |
| `ana-block.py` | 0 violations | 0 |
| `ana-ledger.py` | VANISHED 0, UNEXPLAINED 0; through, no seat took it 231; STOLE > VICTIM LOST 4; no reciprocal name row 4 | 0, 0; 225; 9; 4 |
| `ana-inv.py` | 9: eight the Ventrue's Wider View kinds (pool-print, pool-drift), one `strike-taken` | 5, the Wider View kinds |
| `ana-combat2.py` | handshake 11,130 / 4 (100 %), agreement 100 %, safety net 0 | 8,532 / 4 (100 %), 100 %, 1 (the known Deep Song wait) |
| `ana-windows.py` | modifier ran out 1,362 of 1,477, total 970 of 5,985; stale-answer 1,766 | 1,219 of 1,350, 786 of 4,043; 1,397 |

- *Through, no seat took it:* every one of the 231 (and the 225) comes after the match's last oust, with one Methuselah left: the
  last Methuselah finishing its turn at an empty table (the class earlier rounds counted as 223–228).
- *The one `strike-taken` flag* (match 6, round 8) is the known third bot's stray combat row (STATUS, "Known, not built"): the
  Malkavian wrote a combat row against Mkhokheli inside the Toreador–Nosferatu fight and flagged that fight's damage as its own.
- *ana-windows* is the sim table's run-out measurement debt (BOARD), the same shape at four and five seats.

## The prediction against the observation (D-93)

Held: the run (240 last-standing, no stuck or crash, 0 at 0 pool); the starters' order; Toreador inside the span (0.60 VP, 11.2 %
wins, above nosferatu and below ventrue on the point estimates); its cards (Balls with their pairs, no bar before a bleed, Change of
Target, the title, Creepshow Casino); ana-block, ana-ledger and the handshake. Missed: "ana-inv no new flag kind" — one `strike-taken`
flag the four-seat design lacks, the known stray combat row above. No falsifier fired. Verdict on the question: **holds up** by D-98's
measure; the menu is Johan's call.

## Found on the way

- **`ana-cards.py` listed 135 untitled plays of Second Tradition by Toreador** — all false: the precon file names its crypt bare
  (`Mkhokheli`), cardfx keys it `Mkhokheli (G6)`, the tool looked the name up exactly and missed the printed Princes (130); the other
  five came after the vampire took Toreador Justicar (R-43). The bot resolves both (its `fxLookup` reads the alias). Fixed in this PR:
  the tool resolves through the alias and honours an earlier `title` row. Checked: the list is empty on both series, and a copy of
  match 240 with two planted untitled plays (an untitled vampire; the title-taker before its `title` row) lists exactly those two.
- **A held master counts as played.** `gen-card-ledger.js` and `ana-cards.py` count every `master-play` pick, and the master phase
  holds many (no pair, no host): Toreador Grand Ball 407 picks against 68 plays, Villein 601 against 353 (their own rows). A master
  that is always held would read `playable` in `CARDS.md`. Toreador's Ball, Villein and Creepshow Casino show real plays; its Art Museum,
  Society Hunting Ground and Elysium: The Palace of Versailles have no row of their own, so the trace cannot tell their plays from
  their holds. The ledger is the V5 waves' done-condition — a BOARD line.

## If Johan says yes

A bot release: `deck-toreador.json` embedded in `ARCHETYPES`, a `DECK_STRATEGY` line (the manifest, `combat: 'wave'` from the file),
`gen-precon.js --check` over the embedded decks. The client lists a new `ARCHETYPES` key by itself ("a new bot deck needs a bot release
and nothing here", the client's `hotBotDeckMenu`); a friendly label is main's option.

## How to reproduce

```
node elysium-bot-sim.js --decks malkavian,tremere,nosferatu,ventrue,toreador --seatings all --seeds 2 --trace /tmp/tor240
node elysium-bot-sim.js --seeds 10 --trace /tmp/d240                  # the four-seat client design, the audits' baseline
python3 ana-ledger.py /tmp/tor240; python3 ana-block.py /tmp/tor240; python3 ana-inv.py /tmp/tor240
python3 ana-windows.py /tmp/tor240; python3 ana-combat2.py /tmp/tor240; python3 ana-cards.py /tmp/tor240
```
The paired read, from the result rows (the last line of every `match-NNNN.jsonl`):
```
import glob, json, math
R = [json.loads(open(f).read().strip().split('\n')[-1])['data'] for f in sorted(glob.glob('/tmp/tor240/match-*.jsonl'))]
at = lambda r, k: next(b['name'] for b in r['bots'] if b['deck'] == k)
for x in ['malkavian', 'ventrue', 'tremere', 'nosferatu']:
    d = [r['vp'].get(at(r, 'toreador'), 0) - r['vp'].get(at(r, x), 0) for r in R]
    m = sum(d) / len(d); se = math.sqrt(sum((v - m) ** 2 for v in d) / (len(d) - 1) / len(d))
    print(x, round(m, 2), round(se, 2))   # wins: the same with (r['winner'] == name) in place of the VP
```
