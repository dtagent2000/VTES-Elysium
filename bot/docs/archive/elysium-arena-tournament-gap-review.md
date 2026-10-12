# Arena vs the Tournament World — the gap review (27 July 2026)
*Sources: vekn.net Tournament Rules §3.7 (VP/GW/TP, verbatim), Goudie 1997
("Mastering Tournament Play"), VEKN Newsletter June 2026 (live report
vocabulary), vekn §4 (sportsmanship/deals). Johan's question: what does the
new Arena miss against the sources — adjust now, or plan for later?*

## Shipped NOW (this round)
**Tournament VP scoring — arena v1.2.4.** The rules are exact: 1 VP each time
your prey is ousted; **½ VP for surviving the time limit**; Game Win = ≥2 VP
AND strictly most. Our "no winner (timeout)" matches carried full rankings we
were throwing away. The arena now derives VP from the oust ring (ouster = the
victim's LIVE predator at that moment, wrap-aware), adds the timeout
half-point to survivors only (a swept table has no time limit), prints VP per
match line, aggregates per persona, and benchmarks against **Goudie's bar:
"slightly over two VP per round to advance"** — the summary shows VP/match vs
2.0. Live proof first run: `VP Shark 0 Grinder 1.5 Shark-2 0 Novice 1.5` on a
timeout — meaning where there was none.

## Planned LATER (ranked)
1. **GW flag + Tournament Points table** (60/48/36/24/12 by table rank) in
   `result` — trivial arithmetic on the VP map; lands with the next arena touch.
2. **The goal function itself (sportsmanship §4 as doctrine):** "playing to
   win means a Game Win if reasonably possible, else as many VP as possible."
   The bot's endgame awareness should ask "can I still reach 2 VP?" and shift
   aggression accordingly — a decide-layer feature, paired with:
3. **Clock awareness.** The 2026 report's winner: "I was very aware of the
   clock and made a direct deal…". Tournament rounds are timed; our
   match-timeout is the same fact. A `timeLeft` input to decide() turns stalls
   into strategy (push for the half-points, or race the sweep).
4. **Deal capture.** Deals are explicitly unregulated by the rules and
   central in every report. Our bots already honor public deals — but the
   Arena emits nothing. A `deal` emit (proposed/accepted/honored/broken) the
   day arena bots negotiate; the dossier's FACIT makes deal-keeping auditable.
5. **Cross-table reach.** The report's key turn was a cross-table Banishment.
   Our bots barely see cross (crossRushWeight 0 default); the politics track
   (Q1–Q6, vote archetype) is where cross-table play truly lives — this review
   reinforces its priority after the V-track.
6. **Withdrawal (½ VP)** is unmodeled — niche, noted.
7. **Harvest/batch VP columns** — small follow-up so series tables rank by VP.

## The one-line verdict
The Arena's *observability* now matches tournament reality's **scoring**;
the bots' *behavior* still lacks tournament reality's three social organs —
the clock, the deal, and the cross-table reach. All three have homes in the
existing plan (politics track, decide-layer), now with source-verified urgency.
