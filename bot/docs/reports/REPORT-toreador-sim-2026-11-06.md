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

## Results

### The design as specified: 240 matches (observed 6 Nov)

240 matches in 139 s of wall clock (2 workers), all last-standing (5 VP a table: 1.00 a seat, a fifth of the wins expected), no
stuck or crashed match, played at 0 pool 0. **Its deals repeat** (found by the egress review, checked on the `dealt` rows): a deck's
deal is fixed by its seat and the deal seed, so in every seating of a seat it draws the same cards — each deck meets 10 deals here
(5 seats × 2 seeds), each 24 times. The per-match SE treats the 240 as independent; clustered by deal (CR1 on the deck's (seat, seed)
cell; two-way, by both decks' cells, for a pair) it is about twice as wide.

| deck | wins | win share ± SE (by deal) | VP/match ± SE (by deal) | first out | survived |
|---|---:|---:|---:|---:|---:|
| malkavian | 94 | 39.2 % ± 3.2 (5.1) | 1.80 ± 0.12 (0.22) | 33 | 93 |
| ventrue | 56 | 23.3 % ± 2.7 (4.6) | 1.26 ± 0.10 (0.23) | 42 | 55 |
| tremere | 41 | 17.1 % ± 2.4 (4.2) | 0.89 ± 0.09 (0.18) | 55 | 40 |
| **toreador** | **27** | **11.2 % ± 2.0 (3.9)** | **0.60 ± 0.08 (0.16)** | 55 | 29 |
| nosferatu | 22 | 9.2 % ± 1.9 (3.3) | 0.45 ± 0.07 (0.14) | 55 | 23 |

| Toreador minus | VP | 95 %, per match | 95 %, by deal | win share, points | 95 %, by deal |
|---|---:|---|---|---:|---|
| malkavian | −1.19 | [−1.50, −0.88] | [−1.71, −0.68] | −27.9 | [−41.2, −14.7] |
| ventrue | −0.66 | [−0.94, −0.38] | [−1.35, +0.03] | −12.1 | [−28.8, +4.6] |
| tremere | −0.29 | [−0.54, −0.03] | [−0.74, +0.17] | −5.8 | [−17.6, +5.9] |
| nosferatu | +0.16 | [−0.05, +0.36] | [−0.30, +0.61] | +2.1 | [−8.1, +12.3] |

By the read fixed before measuring Toreador is *inside* the span under either SE. But with 10 deals a deck this design cannot order
toreador, tremere and nosferatu, and ventrue only just — L-45 (reused seeds: good for versions, bad for ranking decks), in the sim.

### Fresh deals: 600 matches (added after the review)

`--bench none` over the same five decks: every seating once per seat position (120 × 5), and in bench mode every match deals a
seed of its own (`--seed` + match − 1), so each deck meets 600 different deals (checked: 600 distinct opening deals a deck); `none`
only labels a seat, the play is normal mode's. 600 matches in 339 s, all last-standing, played at 0 pool 0. Here the matches are
independent, so the per-match SE is the right one.

| deck | wins | win share ± SE | VP/match ± SE | first out | survived |
|---|---:|---:|---:|---:|---:|
| malkavian | 291 | 48.5 % ± 2.0 | 2.26 ± 0.07 | 54 | 289 |
| ventrue | 120 | 20.0 % ± 1.6 | 1.05 ± 0.06 | 127 | 119 |
| tremere | 57 | 9.5 % ± 1.2 | 0.66 ± 0.05 | 143 | 58 |
| **toreador** | **78** | **13.0 % ± 1.4** | **0.65 ± 0.05** | 145 | 77 |
| nosferatu | 54 | 9.0 % ± 1.2 | 0.39 ± 0.04 | 131 | 57 |

| Toreador minus | VP (paired SE) | 95 % | win share, points (paired SE) | 95 % |
|---|---:|---|---:|---|
| malkavian | −1.61 (0.10) | [−1.81, −1.41] | −35.5 (2.9) | [−41.1, −29.9] |
| ventrue | −0.40 (0.08) | [−0.57, −0.24] | −7.0 (2.3) | [−11.6, −2.4] |
| tremere | −0.01 (0.07) | [−0.15, +0.13] | +3.5 (1.9) | [−0.3, +7.3] |
| nosferatu | +0.26 (0.06) | [+0.14, +0.39] | +4.0 (1.9) | [+0.3, +7.7] |

### The answer

**Inside the starters' span, in its lower middle: level with tremere, above nosferatu.** On fresh deals Toreador scores what tremere
scores (−0.01 ± 0.07 VP; 3.5 points more wins, not separable) and clearly beats nosferatu (+0.26 ± 0.06 VP, +4.0 ± 1.9 points of wins);
malkavian and ventrue are stronger. The 240-match design agrees within its (deal-clustered) noise. The starters keep their order in
both five-seat series and on the four-seat client design run beside them (malkavian 2.01, ventrue 1.04, tremere 0.65, nosferatu 0.30).

## Reading (the fresh-deal series)

- **Seating.** Toreador by seat (120 matches each, seat 1 first): 0.63 · 0.41 · 0.87 · 0.65 · 0.68 VP (SE 0.08–0.12); the other decks
  move 0.2–0.35 across the seats, Toreador 0.46 (seat 2 against seat 3, about 3 SE: one pair of cells among many, a lead at most). The
  240 design's seat-5 cell (0.15) was its two deals. By prey Toreador scores 0.77 on ventrue, 0.74 on tremere, 0.62 on malkavian, 0.46
  on nosferatu; by predator 0.41 under ventrue, 1.09 under nosferatu.
- **It plays its deck.** `ana-cards.py`'s never-played list is empty. Every location master left the hand at its pick (the hand each
  decide row carries): Art Museum 184 times, Creepshow Casino 150 (unseen in the 12-match smoke; its announce stealth 302 times in 117
  matches), Society Hunting Ground 127, Elysium: The Palace of Versailles 125; Villein 858 plays, the Ball 325. Toreador Justicar's title
  taken in 147 matches; Change of Target 181 times in 162 matches, each in the if-blocked window; Scalpel Tongue's abstain 7 times;
  Majesty ended 700 combats; Resist Earth's Grasp 810 plays.
- **Politics land.** 2,171 political actions, 22 % blocked (ventrue 1,825, 37 %); 1,710 referendums, 99 % passed (ventrue 97 %).
- **The Grand Ball is burned before it pays.** 325 Balls in 288 matches, each with its pair; 304 burned by a starter's (D) action
  (malkavian 97, ventrue 81, tremere 68, nosferatu 58; none blocked) — 164 in the round it was played, 115 in the next, 25 later.
  Its 245 bars went before a political action 193 times (Kine Resources Contested 94, Parity Shift 40, Consanguineous Boon 37, Toreador
  Justicar 22), a hunt 21, a stock action 21 and a rescue 10 — never before a bleed. Bars per Ball: none for 112, one for 185, two for
  24, three for 4 (0.75 on average), for 1 pool, the card and a locked Toreador. A pricing question for a later wave (L-9), not a
  fault: the table spends an action on each burn.

## Audits (on the v0.6.217 bytes)

| audit | 240, as specified | 600, fresh deals | four-seat design (240) |
|---|---|---|---|
| ended; played at 0 pool | 240 last-standing; 0 | 600 last-standing; 0 | 240 last-standing; 0 |
| `ana-block.py` | 0 violations | 0 | 0 |
| `ana-ledger.py`: VANISHED, UNEXPLAINED | 0, 0 | 0, 0 | 0, 0 |
| — through, no seat took it; STOLE > VICTIM LOST | 231; 4 | 607; 9 | 225; 9 |
| `ana-inv.py` | 9: 8 Wider View kinds, 1 `strike-taken` | 4: 2 Wider View, 2 `strike-taken` | 5, Wider View |
| `ana-combat2.py`: handshake; safety net | 11,130 / 4 (100 %); 0 | 26,848 / 6 (100 %); 4 combats | 8,532 / 4 (100 %); 1 |
| `ana-windows.py`: modifier, total ran out | 1,362 of 1,477; 970 of 5,985 | 3,546 of 3,888; 2,487 of 15,691 | 1,219 of 1,350; 786 of 4,043 |

- *Through, no seat took it:* every one (231, 607 and 225, checked) comes after the match's last oust, with one Methuselah left finishing
  its turn at an empty table — the class earlier rounds counted as 223–228.
- *The `strike-taken` flags* (240: match 6; 600: matches 221 and 585) are the known third bot's stray combat row (STATUS), and the
  three show its cause: each stray bot had tried to block the same action and failed, another bot's later attempt took the block, and
  the failed blocker fought that combat too — with its hands (6), Roundhouse (221) and Theft of Vitae (585), so it can spend a strike
  card; 585's stray row also books a steal (`ana-ledger.py`'s one 'steal pairs: no victim row'). Two of the three actions were a
  Toreador's.
- *The safety net* (600): three Deep Song rushes (the known class) and one Haven Uncovered rush (match 542) — the same shape, a rush
  the rushed bot does not answer; all four a Nosferatu rushing a starter, none a Toreador.
- *ana-windows* is the sim table's run-out measurement debt (BOARD), the same shape at four and five seats.

## The prediction against the observation (D-93)

On the registered design (240): held — the run (240 last-standing, no stuck or crash, 0 at 0 pool); the starters' order; Toreador
inside the span (0.60 VP, 11.2 % wins, above nosferatu and below ventrue on the point estimates); its cards (Balls with their pairs, no
bar before a bleed, Change of Target, the title, Creepshow Casino); ana-block, ana-ledger and the handshake. Missed: "ana-inv no new
flag kind" — one `strike-taken` flag, the known stray combat row. No falsifier fired. The fresh-deal series (not registered) agrees
on every point and adds two: Toreador is level with tremere, and above nosferatu beyond the noise. Verdict on the question: **holds
up** by the measure set for this round (inside the starters' span); the menu is Johan's call.

## Found on the way

- **The sim's deals repeat across seatings** (the egress review): `--seatings all --seeds K` gives each deck K × seats deals; a
  deck-strength read takes a fresh deal per match (`--bench none`). HOWTO says so now.
- **`ana-cards.py` listed 135 untitled plays of Second Tradition by Toreador** (240) — all false: the precon file names its crypt bare
  (`Mkhokheli`), cardfx keys it `Mkhokheli (G6)`, the tool looked the name up exactly and missed the printed Princes (130); the other
  five came after the vampire took Toreador Justicar (R-43). The bot resolves both (its `fxLookup` reads the alias). Fixed in this PR:
  the tool resolves through the alias and honours an earlier `title` row (its comment states what it still cannot see). Checked: the
  list is empty on all three series, and a copy of match 240 with two planted untitled plays lists exactly those two.
- **A held master counts as played.** `gen-card-ledger.js` and `ana-cards.py` count every `master-play` pick, and the master phase
  holds many (no pair, no host): Toreador Grand Ball 1,224 picks against 325 plays, Villein 1,389 against 858 (600 series). A master
  that is always held would read `playable` in `CARDS.md`. The fix fits inside the two tools (count a pick only when the card leaves
  the hand); the ledger is the V5 waves' done-condition: a BOARD line.

## If Johan says yes

A bot release: `deck-toreador.json` embedded in `ARCHETYPES`, a `DECK_STRATEGY` line (the manifest, `combat: 'wave'` from the file),
`gen-precon.js --check` over the embedded decks. The client lists a new `ARCHETYPES` key by itself ("a new bot deck needs a bot release
and nothing here", the client's `hotBotDeckMenu`); a friendly label is main's option.

## How to reproduce

```
node elysium-bot-sim.js --decks malkavian,tremere,nosferatu,ventrue,toreador --seatings all --seeds 2 --trace /tmp/tor240
node elysium-bot-sim.js --decks malkavian,tremere,nosferatu,ventrue,toreador --bench none --trace /tmp/tor600   # fresh deals
node elysium-bot-sim.js --seeds 10 --trace /tmp/d240                  # the four-seat client design, the audits' baseline
python3 ana-ledger.py DIR; python3 ana-block.py DIR; python3 ana-inv.py DIR; python3 ana-windows.py DIR
python3 ana-combat2.py DIR; python3 ana-cards.py DIR
```
The paired read, from the result rows (the last line of every `match-NNNN.jsonl`); on /tmp/tor240 cluster it by deal (above):
```
import glob, json, math
R = [json.loads(open(f).read().strip().split('\n')[-1])['data'] for f in sorted(glob.glob('/tmp/tor600/match-*.jsonl'))]
at = lambda r, k: next(b['name'] for b in r['bots'] if b['deck'] == k)
for x in ['malkavian', 'ventrue', 'tremere', 'nosferatu']:
    d = [r['vp'].get(at(r, 'toreador'), 0) - r['vp'].get(at(r, x), 0) for r in R]
    m = sum(d) / len(d); se = math.sqrt(sum((v - m) ** 2 for v in d) / (len(d) - 1) / len(d))
    print(x, round(m, 2), round(se, 2))   # wins: the same with (r['winner'] == name) in place of the VP
```
