# STATUS — Elysium Bots (rewritten at every release; 2 November 2026)

**Bot v0.6.215** (2 Nov 2026, PR #45) · arena v1.4.8 · sim table v1.0.2 · cardfx compiler v1.9.6, curated 144 · hotseat tool v1.4.0 ·
coverage tool v1.1.42 · precon generator v1.1.0 · built against client **v2.6.170 / srv-2.6.49** (the root's release); the read-only
copies in `bot/` are client v2.6.162 / protocol v2.6.162 / srv-2.6.46 (refreshed 16 Oct; how: HARNESS).

**Deploy state:** `main` carries v0.6.214; branch `bot-v5-wave3` carries v0.6.215 and copies its bundle to the root (PR #45, for
Johan to merge). **Open PRs:** #45.

## Last gates (v0.6.215 release bytes, 2 Nov 2026)
Suite **2363/0 ×3** (alone, frozen snapshots, `--max-old-space-size=4096`) · canary **69/0** (bot/'s copies) and 69/0 (root v2.6.170
+ `client/ELYSIUM-PROTOCOL.md`) · hotseat **11/0** · HB1 **11/11** · test-cardfx **301/0** · `gen-precon.js --check` no problems ·
main's `check-versions.js` agrees · main's client suite beside the bundle **353/1** (the embedded guide: main re-embeds) · sim
240-match client design vs v0.6.214: DIVERGED 143 (each at a clan-iconed master held without a ready vampire, R-42), SAME-PLAY 97,
played at 0 pool 0 · the V5 smoke (14 × 12): DIVERGED 134, SAME-PLAY 34, no safety net, handshake integrity 100 %.

## What v0.6.215 did (the latest release; older ones in the CHANGELOG)
V5 wave 3 (D-104): the masters. Out-of-turn masters never in my master phase; a master's requirements met by a ready vampire (R-42:
the clan icon counts); locations that lock for stealth / intercept; blood (Carfax Abbey, Burial Site, Art Museum, Ecoterrorists,
Powerbase: Montreal, Unholy Sacrament, Family Gathering); Haqim's Law and Club Illusion; Archon Investigation with the line the
acting bot burns its minion on. One lock, one effect. The client's v5 card names resolve (main's reply 5.2). 20 curated, graded;
section 161 (22 checks); the canon `specs/spec-v5-wave3-2026-11-02.md`; `docs/CARDS.md`: 183 of 308 cards playable (168 before).

## Next (proposed; Johan orders the board)
1. KRCG's v5 dump for the compiler and the precon tools (main's reply 5.1; Johan: after wave 3).
2. V5 wave 4: the masters on a vampire and the rest still played blind; Sudden Reversal's window (Johan's call: a wait per master).
3. The clean-up rounds C2–C6, interleaved with product rounds.
4. The knowledge layer's Kevlar and the prey's wakes as blockers (65f); the abstract model spec.

## Not yet consumed from main
Main's replies of 17–18 Oct (robustness, v0.6.206, v0.6.207, open hand): read, not acted on (BOARD). The 1 Nov KRCG v5 reply: 5.2
done, 5.1 on the BOARD. Owed by main (its §4): the bot-emitted lines for §12 and the canary — the docs-diet handoff's, v0.6.213's,
v0.6.214's `gets no strike this round`, v0.6.215's ARCHON_BURN — and the questions Q4, the pure `step`, `sp` / `xa` / `xb`, the
second `rng`.

## Known, not built
A human's bounce of a bot's bleed is not read by the acting bot · a human's Haven Uncovered is not read · between bots a contested
block's verdict waits for the actor's clock · on the sim table most bot-vs-bot reaction windows run out their clock (BOARD) ·
`askHumansTotal` off until the human harness learns the second question · the waves' riders (BOARD) · a Deep Song rush's maneuver
wait ran into its safety net once in 240 (BOARD).
