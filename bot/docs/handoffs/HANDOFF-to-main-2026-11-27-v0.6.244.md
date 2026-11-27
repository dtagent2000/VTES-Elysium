# Handoff to main — bot v0.6.244 (27 Nov 2026): C1b, the card chain's gaps

The V5 sweep's C1b (bot RULINGS D-148): the card chain's gaps closed or listed, and the 13 other V5 decks' flagged cards read
against KRCG's text. Built on main `8271308`. No wire change, no new line: a stealth card's own +bleed (Bonding [DOM]) is now said
in the frozen §12 add line (`<vamp> adds +N bleed (= T).`) once the blocks are declined, as a bleed modifier's is. In play: the
240-match sim diverges where a Bonding is played for stealth (the round's report, `bot/docs/reports/REPORT-c1b-2026-11-27.md`).

## 1. The bundle
- `elysium-cardfx.json` / `.js`: 73 library entries changed (compiler v1.13.0). Additive keys inside a mode's `fx`: `stealthOpt`
  (the mode's stealth is optional: "+1 bleed, or +1 stealth and +1 bleed") and `notActorDisc` (not usable if the acting minion has
  the discipline), and four conditions in `plusIf.if`: `actDirected`, `actUndirected`, `actorSect`, `actorTitled`. Counts
  unchanged: 301 curated, 1,654 modelled library effects.
- `elysium-bot.js`: the bot (the CHANGELOG's C1b entry).
- `START-HERE-BOTS.html`: the version chip and the footer.
- The TWD files are unchanged. Deploy: purge `/elysium-bot.js` and `/elysium-cardfx.json` (what the box serves).

## 2. Asks
1. Re-embed the guide (your embed test compares the whole of it).
2. If your client or its tests read a mode's `fx` of `elysium-cardfx.json`, check that the new keys in section 1 pass where an
   unknown key should be ignored.

## 3. From the C1b playtest (`bot/docs/reports/playtest-claude-c1b-2026-11-27.md`; your rig, client v2.6.192)
Seen at the human seat, for your judgement; nothing in `client/` was touched:
- The crypt draw with `influence()` did not count a transfer (760.4).
- The rig's `play --on` cannot put a master on an opponent's vampire: Fame landed in the human's ready region (2739.9); the
  client's drop on an opponent's board gives the card instead.
- The Combat menu offers a hand strike at long range (the counter said long, 5728.0); the bot booked it too (bot register 4.24).
- The counter takes none of the human's intercept or stealth, from a card or a permanent (Guardian Angel, Raven Spy, Cats'
  Guidance, Lost in Crowds): the human sets it by hand (game 2's panel proposal, its point 4; bot register 4.22).
