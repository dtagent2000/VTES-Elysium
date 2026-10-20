# STATUS — Elysium Bots (rewritten at every release; 20 October 2026)

**Bot v0.6.211** (19 Oct 2026, PR #37 merged 20 Oct) · arena v1.4.8 · sim table v1.0.1 · cardfx compiler v1.9.3, curated 105 ·
hotseat tool v1.3.0 · coverage tool v1.1.38 · built against client **v2.6.167** / srv-2.6.49 (the root's release); the read-only
copies in `bot/` are client v2.6.162 / protocol v2.6.162 / srv-2.6.46 (refreshed 16 Oct; refresh by copying the root's files in).

**Deploy state:** the root carries the v0.6.211 bundle (byte copies; main's `check-versions.js` agrees).

**Open PRs:** none from `bot/` at writing. Round C1 of the clean-up (`docs/specs/spec-cleanup-2026-10-20.md`) is this branch.

## Last gates (v0.6.211 release bytes, 19 Oct 2026)
Suite **2244/0 ×3** (alone, frozen snapshots; root client one level up) · canary **69/0** (bot/'s copies) and 69/0 (root
v2.6.167 + srv-2.6.49) · hotseat **11/0** · HB1 **11/11** · test-cardfx **275/0** · check-versions agrees · sim 240-match
client design: 240 last-standing, played at 0 pool 0; baseline VP/match malkavian 1.94 · ventrue 1.05 · tremere 0.73 ·
nosferatu 0.28.

## What v0.6.211 did (the latest release; older ones in the CHANGELOG)
The stable's remaining cards: Pentex™ Subversion curated under its printed name too (compile v1.9.3); a weapon or an armour over a
bare 1-bleed (knob `equipOverPlain`); Spying Mission [OBF] cancels a bounced bleed of 2+ about to land on a non-prey and banks +2
(knob `spyCancelMin`), spent last as stealth. Section 157. Spec: `docs/history/specs/spec-cards-2026-10-19.md`.

## Next, in Johan's order
1. The clean-up rounds C2–C6 (`spec-cleanup-2026-10-20.md` §8) interleaved with product rounds.
2. The knowledge layer's second half: Kevlar priced by what the table's decks deal; the prey's wakes as blockers (65f).
3. The abstract model spec (its own spec follows; `spec-cleanup-2026-10-20.md` §7.1).
4. The V5 plan: precon generator (the 18 V5 precons are in `vtes.json`), coverage class map, Toreador, then waves on the card ledger.

## Not yet consumed from main
Main's replies of 17–18 Oct in `client/docs/handoffs/` (`REPLY-to-bot-2026-10-17-robustness.md`,
`REPLY-to-bot-2026-10-17-v0.6.206.md`, `REPLY-to-bot-2026-10-17-v0.6.207.md`, `REPLY-to-bot-2026-10-18-open-hand.md`) are read but
not acted on in a bot round. Parked by main's own word: the TWD profile's exact-key lookups. Bot-emitted frozen lines not yet in
main's §12 / the canary: `CARD — vampires cannot block this action.`, `Referendum terms: …`, `VAMP attempts to leave torpor.`,
the Haven Uncovered and Spying Mission lines (BOARD "Ask main once").

## Known, not built
A human's bounce of a bot's bleed is not read by the acting bot · a human's Haven Uncovered is not read by the bots · between bots
a contested block's verdict waits for the actor's clock (~3 s at the arena's askSecs) · `askHumansTotal` stays off until the
suite's human harness learns the second question · the 14 Oct playtest scenario (`client/playtest/`) not re-run on v0.6.207+ ·
the larger re-measure against a v0.6.207 baseline (every arena number before v0.6.206 carries ~3 s of dead clock per bleed total).
