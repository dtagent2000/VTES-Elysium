# STATUS — Elysium Bots (rewritten at every release; 29 October 2026)

**Bot v0.6.213** (29 Oct 2026, PR #41 open) · arena v1.4.8 · sim table v1.0.2 · cardfx compiler v1.9.4, curated 115 ·
hotseat tool v1.4.0 · coverage tool v1.1.40 · built against client **v2.6.167** / srv-2.6.49 (the root's release); the read-only
copies in `bot/` are client v2.6.162 / protocol v2.6.162 / srv-2.6.46 (refreshed 16 Oct; how: HARNESS, "the handshake with the
client's versions").

**Deploy state:** the PR's root carries the v0.6.213 bundle (byte copies of `bot/`); `main` carries v0.6.212 until it merges.

**Open PRs:** #41, V5 wave 1 + v0.6.213.

## Last gates (v0.6.213 release bytes, 29 Oct 2026)
Suite **2291/0 ×3** (alone, frozen snapshots, `--max-old-space-size=4096`) · canary **69/0** (bot/’s copies) and 69/0 (root
v2.6.167 + `client/ELYSIUM-PROTOCOL.md`) · hotseat **11/0** · HB1 **11/11** · test-cardfx **287/0** · `gen-precon.js --check` no
problems · main's `check-versions.js` (as its CI runs it, in scratch) agrees · main's client suite beside the bundle **336/1**
(the embedded-guide drift, red on v0.6.212's guide too: main re-embeds, the handoff asks) · sim 240-match client design: SAME-PLAY
240 against v0.6.212 (only the version string and the run's CPU / wall times differ), the five audits byte-identical, played at 0
pool 0 · the V5 smoke (14 × 12): 105 SAME-PLAY, 63 DIVERGED, each at a wave decision, handshake integrity 100 %, played at 0 pool
0; one brujah match replayed on the real clock SAME-PLAY.

## What v0.6.213 did (the latest release; older ones in the CHANGELOG)
V5 wave 1 (D-98): additional strikes (Quickness, Pursuit, Arms of Ahriman) between bots and against humans, aggravated strikes
(Claws of the Dead, Sculpt the Flesh, the Ivory Bow, the Sword of the Archangel, Invigorate [pro]), Wall of Filth, Villein,
Rutor's Hand, clan and sect requirements in the combat and equipment finders; 10 curated readings, graded; section 159 (44 checks);
the canon `specs/spec-v5-wave1-2026-10-29.md` (RULINGS R-39, R-40, D-99); `docs/CARDS.md`: 162 of 308 cards playable (154 before).

## Next (proposed; Johan orders the board)
1. V5 wave 2, in `docs/CARDS.md`'s class map order: the cards with no effect data, the stealth riders, the maneuver / press combat
   cards, the free block bars, the masters still tabled blind.
2. The clean-up rounds C2–C6 (`spec-cleanup-2026-10-20.md` §7), interleaved with product rounds.
3. The knowledge layer's Kevlar (the bots now deal aggravated damage) and the prey's wakes as blockers (65f).
4. The abstract model spec, on the class map's classes.

## Not yet consumed from main
Main's replies of 17–18 Oct in `client/docs/handoffs/` (`REPLY-to-bot-2026-10-17-robustness.md`,
`REPLY-to-bot-2026-10-17-v0.6.206.md`, `REPLY-to-bot-2026-10-17-v0.6.207.md`, `REPLY-to-bot-2026-10-18-open-hand.md`) are read but
not acted on in a bot round; the docs-diet handoff (20 Oct) and the v0.6.213 one (29 Oct: a new line for §12, the guide to
re-embed) have no reply yet. Parked by main's own word: the TWD profile's exact-key lookups. Bot-emitted frozen lines not yet in
main's §12 / the canary: `CARD — vampires cannot block this action.`, `Referendum terms: …`, `VAMP attempts to leave torpor.`, the
Haven Uncovered and Spying Mission lines, `… does not take an additional strike.` (BOARD "Ask main once").

## Known, not built
A human's bounce of a bot's bleed is not read by the acting bot · a human's Haven Uncovered is not read by the bots · between bots
a contested block's verdict waits for the actor's clock · on the hotseat / sim table most bot-vs-bot reaction windows run out their
clock (BOARD, measurement debts) · `askHumansTotal` stays off until the suite's human harness learns the second question · the 14 Oct
playtest scenario not re-run on v0.6.207+ · the additional strikes' v1 limits and the wave's riders (BOARD).
