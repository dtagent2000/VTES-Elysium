# STATUS — Elysium Bots (rewritten at every release; 2 November 2026)

**Bot v0.6.216** (2 Nov 2026, PR #46) · arena v1.4.8 · sim table v1.0.2 · cardfx compiler v1.9.7, curated 144 · hotseat tool v1.4.0 ·
coverage tool v1.1.42 · precon generator v1.1.1 · KRCG converter `krcg-v5.js` v1.0.0 ·
built against client **v2.6.170 / srv-2.6.49** (the root's release);
the read-only copies in `bot/` are client v2.6.162 / protocol v2.6.162 / srv-2.6.46 (refreshed 16 Oct; how: HARNESS).

**Deploy state:** `main` carries v0.6.215; branch `bot-krcg-v5` carries v0.6.216 and copies its bundle to the root (PR #46, for
Johan to merge). **Open PRs:** #46.

## Last gates (v0.6.216 release bytes, 2 Nov 2026)
Suite **SUITE_NUMBERS** (alone, frozen snapshots, `--max-old-space-size=4096`) · canary **69/0** (bot/'s copies) and 69/0 (root
v2.6.170 + `client/ELYSIUM-PROTOCOL.md`) · hotseat **11/0** · HB1 **11/11** · test-cardfx **310/0** · `gen-precon.js --check` 18
precons, no problems · MAIN_GATES · sim 240-match client design vs v0.6.215: SAME-PLAY 240 (no decision moved; 64 games' event
summaries count `Second Tradition` as a card play now) · the V5 smoke (14 × 12): SAME-PLAY 168.

## What v0.6.216 did (the latest release; older ones in the CHANGELOG)
KRCG's v5 dump is the card data (main's reply 5.1; RULINGS D-105): `krcg-v5.js` writes it as the v3-shaped `vtes.json` every tool
reads. cardfx knows all 4,212 cards (63 new: Secrets of New York, Noites Brasileiras) and takes the dump's errata (118 texts beyond markup);
the client's names resolve for 4,212 of 4,212. A card's own printed name beats another card's nickname in the aliases.

## Next (proposed; Johan orders the board)
1. V5 wave 4: the masters on a vampire and the rest still played blind; Sudden Reversal's window (Johan's call: a wait per master).
2. The clean-up rounds C2–C6, interleaved with product rounds.
3. The knowledge layer's Kevlar and the prey's wakes as blockers (65f); the abstract model spec.

## Not yet consumed from main
Main's replies of 17–18 Oct (robustness, v0.6.206, v0.6.207, open hand): read, not acted on (BOARD). The 1 Nov KRCG v5 reply: done
(5.2 in v0.6.215, 5.1 here). Owed by main (its §4): the bot-emitted lines for §12 and the canary — the docs-diet handoff's,
v0.6.213's, v0.6.214's `gets no strike this round`, v0.6.215's ARCHON_BURN — and the questions Q4, the pure `step`, `sp` / `xa` /
`xb`, the second `rng`; the data repo's copy of the v5 dump (v0.6.216's handoff).

## Known, not built
A human's bounce of a bot's bleed is not read by the acting bot · a human's Haven Uncovered is not read · between bots a contested
block's verdict waits for the actor's clock · on the sim table most bot-vs-bot reaction windows run out their clock (BOARD) ·
`askHumansTotal` off until the human harness learns the second question · the waves' riders (BOARD) · a Deep Song rush's maneuver
wait ran into its safety net once in 240 (BOARD).
