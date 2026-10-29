# STATUS — Elysium Bots (rewritten at every release; 29 October 2026)

**Bot v0.6.212** (29 Oct 2026, PR #40 open) · arena v1.4.8 · sim table v1.0.2 · cardfx compiler v1.9.3, curated 105 ·
hotseat tool v1.4.0 · coverage tool v1.1.39 · built against client **v2.6.167** / srv-2.6.49 (the root's release); the read-only
copies in `bot/` are client v2.6.162 / protocol v2.6.162 / srv-2.6.46 (refreshed 16 Oct; how: HARNESS, "the handshake with the
client's versions").

**Deploy state:** the PR's root carries the v0.6.212 bundle (byte copies of `bot/`); `main` carries v0.6.211 until it merges.

**Open PRs:** #40, V5 round 0 + v0.6.212.

## Last gates (v0.6.212 release bytes, 29 Oct 2026)
Suite **2247/0 ×3** (alone, frozen snapshots, `--max-old-space-size=4096`: this sandbox's 2 GB default heap ends the suite after 136e,
v0.6.211's bytes too, which give 2244/0 with the flag) · canary **69/0** (bot/’s copies) and 69/0 (root v2.6.167 + `client/ELYSIUM-PROTOCOL.md`) · hotseat **11/0** · HB1 **11/11** · test-cardfx **275/0** ·
`gen-precon.js --check` no problems · main's `check-versions.js` (run as its CI does, in scratch) agrees · sim 240-match client design: SAME-PLAY 240 against v0.6.211, the four audits byte-identical,
played at 0 pool 0; VP/match malkavian 1.94 · ventrue 1.05 · tremere 0.73 · nosferatu 0.28 · the V5 smoke (14 × 12): 164 SAME-PLAY,
4 DIVERGED (the Chantry fix), played at 0 pool 0.

## What v0.6.212 did (the latest release; older ones in the CHANGELOG)
V5 round 0: `gen-precon.js` builds the 18 V5 precons (the 14 new ones are `deck-<key>.json`, test inputs the sim plays, not in the
client's menu); the coverage tool's class map caught up; the card ledger `docs/CARDS.md` with its class map (308 cards: 154
playable, 12 unseen, 66 partial, 76 inert); Chantry's rescue never takes the last pool (section 158).

## Next (proposed; Johan orders the board)
1. The V5 waves by effect class, in `docs/CARDS.md`'s class map order (RULINGS D-98); wave 1 is in progress (branch `bot-v5-wave1`).
2. The clean-up rounds C2–C6 (`spec-cleanup-2026-10-20.md` §7), interleaved with product rounds.
3. The knowledge layer's second half: Kevlar after the aggravated-strike wave; the prey's wakes as blockers (65f).
4. The abstract model spec, on the class map's classes.

## Not yet consumed from main
Main's replies of 17–18 Oct in `client/docs/handoffs/` (`REPLY-to-bot-2026-10-17-robustness.md`,
`REPLY-to-bot-2026-10-17-v0.6.206.md`, `REPLY-to-bot-2026-10-17-v0.6.207.md`, `REPLY-to-bot-2026-10-18-open-hand.md`) are read but
not acted on in a bot round; the docs-diet handoff (20 Oct) has no reply yet. Parked by main's own word: the TWD profile's exact-key
lookups. Bot-emitted frozen lines not yet in main's §12 / the canary: `CARD — vampires cannot block this action.`,
`Referendum terms: …`, `VAMP attempts to leave torpor.`, the Haven Uncovered and Spying Mission lines (BOARD "Ask main once").

## Known, not built
A human's bounce of a bot's bleed is not read by the acting bot · a human's Haven Uncovered is not read by the bots · between bots
a contested block's verdict waits for the actor's clock · on the hotseat / sim table most bot-vs-bot reaction windows run out their
clock (BOARD, measurement debts) · `askHumansTotal` stays off until the suite's human harness learns the second question · the 14 Oct
playtest scenario not re-run on v0.6.207+.
