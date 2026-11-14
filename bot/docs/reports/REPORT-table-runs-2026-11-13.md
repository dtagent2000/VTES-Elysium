# REPORT — the table runs on the real clock (round A, 13–14 November 2026)

Johan, 13 Nov: table runs with Toreador seated, and v0.6.222's unsure list counted at the real clock — superseded combats, held
turns, rush complies, fizzles, actions against an ousted seat (CHANGELOG v0.6.222, PR #67, the BOARD lines). Bot v0.6.222 (main
`1e9f3fd`, `elysium-bot.js` `e595f4a5`) as released, before any change of round A. Two bot-only tables on the real clock, one at a time
(two cores here, and the counts are timing-sensitive); the counts come from `ana-rare.py` v1.0.0 (new: read-only), the audits from
`ana-gates.py`, the windows from `ana-windows.py`.

- **The online table** — the server arena on srv-2.6.50, the client pace (`--pace 3100 --ask-secs 20`), five Expert bots: the four
  starters and Toreador, random seating, start pool 30.
- **The offline table** — the hotseat table on the real clock (`elysium-bot-sim.js --real`, the client profile), the same five decks.

## Predictions (registered before any table run)
1. Every audit passes on both tables: `ana-gates.py` PASS; on the online table the windows gate is 0.
2. Superseded combats: 0–2 per table; no Change of Target record ends one.
3. Held turns: on the online table one per match whose survivor is handed a turn after the last oust (the server does that,
   v0.6.221), none released (nothing unousts at a bots-only table); on the offline table none (the sim table ends at the last oust).
4. Rush complies on the actor's word (the rushed bot meant to block): 0–2 per table (the sim: 1 in 240, 2 in 600).
5. Fizzles: 0–2 per table.
6. Resolutions at an ousted seat (a rush, a card burn, a referendum's deltas, a peek): 0.
7. The offline table runs out most bot-vs-bot reaction windows, as the sim does (BOARD: 403 of 467 bleed totals at pace 0; the
   sim matches the real-clock hotseat table): `RAN OUT, THROUGH` above half of the windows there, 0 on the online table.
8. No play line of Toreador's carries "(uncurated" (its library is curated: `docs/CARDS.md`).

## Results
### The online table (13 Nov, 22:13–23:25; `--pace 3100 --ask-secs 20`, ten arenas side by side)
Nine matches played to the end (6–11 rounds, 23–50 minutes each). The tenth was lost to the arena: ten arenas drew a random port each
from 300 and two met — its server lost the port and exited, its bots joined the second arena's server and played in a room of their
own there until that match ended and its server was stopped. Fixed in arena v1.4.10 (the OS picks the port; the server must be alive
after its boot). Wins: Malkavian 4, Ventrue 3, Tremere 2; VP Malkavian 21, Tremere 13, Ventrue 10, Nosferatu 1, Toreador 0 (out
second on average, 2.33; Nosferatu first, 1.56). Of Toreador's 27 political actions 12 were blocked and the 15 put to the vote
passed; its library was played (the
Grand Ball 6 times, burned twice by Tremere; Villein 13; Kine Resources Contested 16, Consanguineous Boon 6, Parity Shift 4, the
Justicar title once), but it never ousted its prey. Nine matches are an anecdote, not a deck read (v0.6.222's sim 600: 0.78 ± 0.05 VP a match);
the lead is the measurement debt below — the sim table loses most modifier-window answers, the online table none.

| # | Prediction | Observed (online) | Verdict |
|---|---|---|---|
| 1 | every audit PASS, windows 0 | v1.0 of `ana-windows.py`: windows FAIL on 6 of 9 (20 windows "ran out"); every one resolved on the bots' **paced** answers — the target's Pass at its react delay (3.1 s = paceMs), or a bounce chain (Deflection at 3.1 s, then the new target's answer: 6.7–10.5 s); 0 stale answers. v1.1 (the limit is 2.5 s plus the pace; RAN OUT only when the table went quiet longer inside the window): 0, and `ana-gates.py` PASS 7 of 7 on all nine | falsified as registered — the gate's limit was a pace-0 limit; no answer was lost |
| 2 | superseded combats 0–2, no CoT record ends one | 0 | held |
| 3 | one held turn a match, none released | 0 held: the arena ends a match at the last oust; twice the survivor's turn ended at the game's end in its minion phase (v0.6.221). The hold and its release ran on the real clock in a two-bot probe instead (pace 0: the turn passed at game over, then held, then released by the ousted bot's unoust — `back: true`, the pass; pace 3100: held at the turn's first line, released — `back: false`: the survivor went on deciding (the probe read 3 decisions and stopped)) | falsified (no held turn at an arena table); the path itself works at both paces |
| 4 | rush complies on the actor's word 0–2 | 0 (on my Pass 7; no rush decision 2 — no unlocked blocker, the line-read comply) | held |
| 5 | fizzles 0–2 | 0 | held |
| 6 | resolutions at an ousted seat 0 | 0 | held |
| 7 | online: RAN OUT 0 | 0 with v1.1 (see 1) | held, on the corrected gate |
| 8 | no '(uncurated' line of Toreador's | 1: Elysium: The Palace of Versailles (match 5) — an AUTO reading (`docs/CARDS.md`: FULL), not curated, and it under-reads the card (+1 vote on the lock; the card: +1 vote for EACH titled Camarilla vampire you control) | falsified — my premise ("its library is curated") was wrong for one card; a BOARD line |

### The offline table (13–14 Nov, 23:24–00:16; the sim's hotseat table on the real clock, ten matches side by side)
Ten matches to the end (11.9 rounds a match; 25,180 s of table time in 3,121 s). Wins: Malkavian 3, Nosferatu 3, Toreador 2,
Ventrue 1, Tremere 1; VP a match Malkavian 1.60, Nosferatu 1.30, Ventrue 1.10, Toreador 0.70, Tremere 0.30. Toreador was out
first five times (its mean oust position 1.75); its 0.70 VP is near v0.6.222's sim 600 (0.78 ± 0.05). It played the Grand Ball 24 times (burned
once, by Nosferatu), Kine Resources Contested 18 and Majesty 18; across the two tables it played 19 of its 20 library cards (never
Scalpel Tongue). Elysium: The Palace of Versailles came four times, each with the "(uncurated" note.

| # | Prediction | Observed (offline) | Verdict |
|---|---|---|---|
| 1 | every audit PASS | `ana-gates.py` PASS 6 of 6 (the windows are information on the sim table) | held |
| 2 | superseded combats 0–2 | 0 | held |
| 3 | no held turn (the sim ends at the last oust) | 0; seven turns ended at the game's end in the minion phase | held |
| 4 | rush complies on the actor's word 0–2 | 0 (on my Pass 10; no rush decision 2) | held |
| 5 | fizzles 0–2 | 0 | held |
| 6 | resolutions at an ousted seat 0 | 0 | held |
| 7 | most bot windows run out (above half) | the MODIFIER windows: 50 of 53 ran out (each ~15 s) with 60 stale `Pass` answers — the actor's stale guard discards the target's Pass on the hotseat bridge, as on the sim at pace 0; the bleed TOTALS: 6 of 227 (v1.1; 28 with v1.0's pace-0 limit) | half held: the real clock reproduces the sim's lost answers in the modifier window, not on the totals |
| 8 | no '(uncurated' line of Toreador's | 4 (Versailles) | falsified, as online |

### What the two tables say
- **Bot answers are lost on the hotseat table, not online** (the BOARD's measurement debt): at the real clock the offline table
  ran out 50 of 53 bleed-modifier windows, ~15 s each, every one with the target's Pass dropped as stale; the online table at the
  same pace lost none (0 stale answers). A human at an offline table with bots waits ~15 s at each bot's bleed modifier. A BOARD
  line, for a round of its own (the stale guard on the hotseat bridge, L-25 / L-26).
- **The riders' paths** (superseded combats, held turns, the actor's-word rush, fizzles, resolutions at an ousted seat) did not
  occur in 19 real-clock matches; their sections stay the proof. The held turn ran in the probe (both paces).
- **Toreador at the real clock** plays 19 of its 20 library cards (not Scalpel Tongue), one of them auto-read (Versailles). Out early on both tables (online 0 VP in 9; offline 0.70 a match, first out 5 of 10): a lead, not a deck read.
- **The tools**: arena v1.4.9 / v1.4.10 (the paced seat picks; the shared port) and `ana-windows.py` v1.1 (the pace) came out of
  these runs.
