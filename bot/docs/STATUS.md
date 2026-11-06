# STATUS — Elysium Bots (rewritten at every release; 6 November 2026)

**Bot v0.6.217** (3 Nov 2026, PR #47) · arena v1.4.8 · sim table v1.1.0 (round C3) · cardfx compiler v1.9.8, curated 156 · hotseat tool v1.4.0 ·
coverage tool v1.1.43 · precon generator v1.1.1 · KRCG converter `krcg-v5.js` v1.0.0 ·
built against client v2.6.170; the root's release is now client **v2.6.171 / srv-2.6.49** (main's #48: both canaries green beside
v0.6.217, ours 69/0 and main's v1.1.0 102/0);
the read-only copies in `bot/` are client v2.6.162 / protocol v2.6.162 / srv-2.6.46 (refreshed 16 Oct; how: HARNESS).

**Deploy state:** `main` carries v0.6.217 (#47), client v2.6.171 (main's #48) and round C3 (#50, merged 4 Nov; #49 had landed in
`bot-v5-wave4`, L-84). Main's client gates are red until main re-embeds the v0.6.217 guide (main's fix). **Open PRs:** #51.

## Last gates (v0.6.217 release bytes, 3 Nov 2026)
Suite **2393/0 ×3** (alone, frozen snapshots, `--max-old-space-size=4096`) · canary **69/0** (bot/'s copies) and 69/0 (root
v2.6.170 + `client/ELYSIUM-PROTOCOL.md`) · hotseat **11/0** · HB1 **11/11** · test-cardfx **315/0** · `gen-precon.js --check` 18
precons, no problems · main's `check-versions.js` agrees (the root: 21 byte copies) · main's client suite beside the bundle 353/1 (the
embedded guide) · sim vs v0.6.216: the 240-match client design SAME-PLAY 238, DIVERGED 2 (a rules fix: rulebook 6.1.6); the V5 smoke
(14 × 12) DIVERGED in six decks at the wave's cards (spec §5).

## What v0.6.217 did (the latest release; older ones in the CHANGELOG)
V5 wave 4 (D-106): the eight masters that go on a vampire, Toreador Grand Ball and its (D) burn, Change of Target, Scalpel Tongue,
Toreador Justicar; a title card replaces the printed title in every count; an action through a card in play once each turn (R-43).

## Since the release (no bot change)
- Round C3 (#50): the mirror bench runs on the sim (`--bench`, `ana-sim-diff.py --vp`, `ana-bench.py`; HOWTO); its controls are in
  `docs/reports/REPORT-bench-controls-sim-2026-11-03.md`.
- Toreador at the sim table (#51, `docs/reports/REPORT-toreador-sim-2026-11-06.md`): the starters + toreador, every seating × 2
  deals (240). Toreador 0.60 ± 0.08 VP/match, 11 % wins: inside the starters' span at its low end (malkavian 1.80 … nosferatu 0.45;
  paired against nosferatu +0.16 ± 0.10). Audits as on the four-seat design. `ana-cards.py`'s untitled list fixed. Menu: Johan's call.

## Next (proposed; Johan orders the board)
1. V5 wave 5 — Johan picks its shape: the eighteen masters in play, Meditative Grove's cancel, Sudden Reversal's window (D-107).
2. Toreador in the menu if Johan says yes: `ARCHETYPES` + a `DECK_STRATEGY` line, a bot release (the client lists a new key itself).
3. The clean-up rounds C2–C6, interleaved with product rounds.
4. The knowledge layer's Kevlar and the prey's wakes as blockers (65f); the abstract model spec.

## Not yet consumed from main
Main's reply of 3 Nov (`REPLY-to-bot-2026-11-03-v0.6.216.md`: §12 now records every bot line through v0.6.216, canary v1.1.0 pins
them — copy it into `bot/`; Q4: gate on the root's release and record the `main` commit instead of the copies; the data repo's v5
dump in its PR #1) — a bot round. Main's replies of 17–18 Oct: read, not acted on (BOARD). Still owed by main: v0.6.217's COT,
ABSTAIN and burn-card lines in §12 and the canary; the re-embedded guide; the pure `step`, `sp` / `xa` / `xb`, the second `rng`.

## Known, not built
A human's bounce of a bot's bleed is not read by the acting bot · a human's Haven Uncovered is not read · between bots a contested
block's verdict waits for the actor's clock · on the sim table most bot-vs-bot reaction windows run out their clock (BOARD) ·
`askHumansTotal` off until the human harness learns the second question · the waves' riders (BOARD) · a Deep Song rush's maneuver
wait runs into its safety net about once in 240 · a third bot's stray combat row in another pair's fight (once in 48; once in 240).
