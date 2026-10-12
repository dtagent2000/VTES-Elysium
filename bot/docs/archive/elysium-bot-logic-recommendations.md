# Bot Logic Recommendations — from the 5p/30 match (27 July 2026)
*Each item: what · why (evidence) · where (named surface) · size. Ordered by leverage.*

## NOW (small, high-value) — ✅ BOTH SHIPPED in v0.6.79 (+ the starve-out counter from Johan's cycling reflection: _unblockedStreak sensor on all 25 through/blocked sites + _surplusStealthIndex at the discard phase). Item 1 landed as v1 chip-saver, PERSONA-gated (aggression<1 saves; the cautious economize) — the ratio version (danger<0.25) broke the live bounce test and is the v2 note below.
1. **Bounce pool-danger weighting** *(general)* — scale the bounce score by
   `amount / myPool` so Deflections are SAVED for lethal hits. Evidence:
   Novice spent his second Deflection on a survivable hit (+86.7s) and died
   bounceless to the killer (+122.2s, Misplay 2). Surface: the bounce scorer
   in `_reactWindow`'s chain. ~4 lines + 2 asserts.
2. **Repeat-pick decay** *(general, carried from the A4 report — still open)* —
   −0.15 per consecutive turn the same action pick wins, resets on change.
   Antidote to hand-freeze dominance (the Deep Song case; note the Warrens×3
   freeze was a DRAW problem, distinct). Surface: `_decide`'s action branch.

## NEXT (medium — the §4 goal-function track, two slices)
3. **Desperation posture** *(general, persona-scaled)* — when
   `pool < 25% of start` AND `tPred > threshold`: bias hunt/stealth-forward/
   survival over standard scoring. Evidence: T16 — Shark held Lost in Crowds
   at pool 6 with tPred 13.2 and stood still to die. The threat read EXISTS;
   it just doesn't steer yet. Persona: shark tilts stealth-forward (race for
   a VP), grinder tilts hunt (outlast).
4. **VP-endgame awareness** *(general)* — "can I still reach 2 VP?" shifts
   target priority toward preys NEAR ousting (Grinder's surgical 2-kill model
   vs Grinder-2's 15-bleed-0-VP spread). Reads: prey pool from pubs (already
   in every snapshot). This is vekn §4's "playing to win" as code.
5. **Clock awareness** *(general, persona-flavored)* — arena passes
   `timeLeft`; decide biases: low time + no VP path → survive for the ½
   (grinder), or race the sweep (shark). Evidence: the June-2026 winner's own
   words; our timeouts are the same fact.

## SWEEP-FIRST (data before code)
6. **Second-minion stall** — `--knob 1:poolFloor=3..5` series at pool 10
   (the A5 metric: influence-tempo turn-2 value decides). If confirmed:
   consider `floorEff = f(startPool)` rather than a constant.
7. **Seat rotation series** — same five decks, rotated seats ×5: is the
   seat-5 swarm edge structural? (Goudie-era lore + this trace agree loudly;
   prove it before compensating.)

## CURATION / DOCTRINE (not logic)
8. **Warrens ×3 flag** — unique-card triplication in the nosferatu list makes
   dead draws; precon-derivation note.
9. **Wall-needs-bounce doctrine** — killed BY a redirect: the wall manifests
   gain "vulnerable to bounce; pair with redirect answers or accept the
   race." Novice's low aggression stays AS IS (it IS the wall synergy —
   recipe B said so; resist "fixing" it).

## INFRA (enables the sweeps above)
10. **Whitelist persona knobs** — add `aggression`/`blockShy` to the --knob
    whitelist (per-seat!) so persona hypotheses sweep without code edits.
    Two lines in the arena WL + the bot reading them as overrides.

*Not recommended:* forcing rushes at 30 pool (the expectation weighting's
restraint was CORRECT all match), or touching the poolFloor survival
exception (it performed exactly as designed).
