# STATUS — Elysium Bots (rewritten at every release; 30 October 2026)

**Bot v0.6.214** (30 Oct 2026, PR #43) · arena v1.4.8 · sim table v1.0.2 · cardfx compiler v1.9.5, curated 124 ·
hotseat tool v1.4.0 · coverage tool v1.1.41 · precon generator v1.1.0 · built against client **v2.6.167** / srv-2.6.49 (the root's
release); the read-only copies in `bot/` are client v2.6.162 / protocol v2.6.162 / srv-2.6.46 (refreshed 16 Oct; how: HARNESS, "the
handshake with the client's versions").

**Deploy state:** `main` carries v0.6.213 and its root the v0.6.213 bundle; branch `bot-v5-wave2` carries v0.6.214 and copies its
bundle to the root (PR #43, for Johan to merge).

**Open PRs:** #43 (v0.6.214, V5 wave 2).

## Last gates (v0.6.214 release bytes, 30 Oct 2026)
Suite **2341/0 ×3** (alone, frozen snapshots, `--max-old-space-size=4096`) · canary **69/0** (bot/’s copies) and 69/0 (root
v2.6.167 + `client/ELYSIUM-PROTOCOL.md`) · hotseat **11/0** · HB1 **11/11** · test-cardfx **298/0** · `gen-precon.js --check` no
problems · main's `check-versions.js` (in scratch, as its CI runs it) agrees · main's client suite beside the bundle **336/1** (the
embedded guide: main re-embeds) · sim 240-match client design vs v0.6.213: DIVERGED 4 (Guard Dogs' counters), SAME-PLAY 236, the
audits as v0.6.213's, played at 0 pool 0 · the V5 smoke (14 × 12): 118 SAME-PLAY, 50 DIVERGED, each at a wave decision,
handshake integrity 100 % · the counter war replayed on the real clock: SAME-PLAY.

## What v0.6.214 did (the latest release; older ones in the CHANGELOG)
V5 wave 2 (D-102): the combat's first steps — the before-range step (Torn Signpost, Rage of Apedemak, Form of the Wolf, Monstrous
Form, Hunger of Marduk) by the look-ahead rule; maneuvers that go back and forth between bots (a chase deck answers a maneuver to
long); Slam [POT]'s maneuver committing the round's strike; the round number (Walk of Flame from round 2, Riposte); Soul Burn past
Fortitude; each V5 precon's posture in its deck file; riding the round: Guard Dogs [ANI]'s maneuver reaches its fight, Taste of
Vitae after a dodge. 9 curated readings, graded; section 160 (50 checks); the canon `specs/spec-v5-wave2-2026-10-29.md` (RULINGS
R-41, D-103); `docs/CARDS.md`: 168 of 308 cards playable (162 before).

## Next (proposed; Johan orders the board)
1. V5 wave 3: the masters still played blind, where Johan's rule of 14 July (always play a master, even uncurated) is revisited
   (D-102).
2. The clean-up rounds C2–C6 (`spec-cleanup-2026-10-20.md` §7), interleaved with product rounds.
3. The knowledge layer's Kevlar (the bots now deal aggravated damage) and the prey's wakes as blockers (65f).
4. The abstract model spec, on the class map's classes.
5. Wave 2's riders (BOARD): counters against a human first. Johan's idea for later (29 Oct): Black Chantry's official deck guides
   as each deck's strategy baseline, refined by the archetypes (BOARD, O-33).

## Not yet consumed from main
Main's replies of 17–18 Oct in `client/docs/handoffs/` (`REPLY-to-bot-2026-10-17-robustness.md`,
`REPLY-to-bot-2026-10-17-v0.6.206.md`, `REPLY-to-bot-2026-10-17-v0.6.207.md`, `REPLY-to-bot-2026-10-18-open-hand.md`) are read but
not acted on in a bot round; the docs-diet handoff (20 Oct), the v0.6.213 one (29 Oct: a new line for §12, the guide to re-embed)
and the v0.6.214 one (30 Oct: `gets no strike this round` for §12, the guide to re-embed, a question on the watched-duel panel's
`rng`) have no reply yet. Parked by main's own word: the TWD profile's exact-key lookups. Bot-emitted frozen lines not yet in
main's §12 / the canary: `CARD — vampires cannot block this action.`, `Referendum terms: …`, `VAMP attempts to leave torpor.`, the
Haven Uncovered and Spying Mission lines, `… does not take an additional strike.`, `… gets no strike this round (…).` (BOARD "Ask
main once").

## Known, not built
A human's bounce of a bot's bleed is not read by the acting bot · a human's Haven Uncovered is not read by the bots · between bots
a contested block's verdict waits for the actor's clock · on the hotseat / sim table most bot-vs-bot reaction windows run out their
clock (BOARD, measurement debts) · `askHumansTotal` stays off until the suite's human harness learns the second question · the 14 Oct
playtest scenario not re-run on v0.6.207+ · the additional strikes' v1 limits and both waves' riders (BOARD: against a human the bot
still maneuvers to long only and does not answer a human's maneuver).
