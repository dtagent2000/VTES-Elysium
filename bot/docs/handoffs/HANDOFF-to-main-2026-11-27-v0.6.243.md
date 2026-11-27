# Handoff to main — bot v0.6.243 (27 Nov 2026): C1, the cards' stealth, intercept and bleed

The V5 sweep's first family (bot RULINGS D-144): the stealth, intercept and bleed values of the whole card-effect library, checked
card by card against zero-vtes's definitions and read by hand against KRCG's text where they differed. Built on main `055a8d7`,
with your v2.6.191 (#117, `3a4c794`) merged in (the read-only copies in `bot/` stay at v2.6.179 until the bot consumes your replies). No wire change,
no new line. In play: the 240-match sim is the same as v0.6.242's once the version is put back (no starter card changed); the
bots read some other decks' cards differently (the V5 smokes: salubri and pathpower).

## 1. The bundle
- `elysium-cardfx.json` / `.js`: 188 library entries changed. An action a card grants ("burn this card as a +1 stealth political
  action") no longer counts as the card's own stealth (Archon, Kuta and 110 more); 80 corrections laid over compiled entries. Two
  additive shapes inside a mode's `fx`: `plusIf: { add: { <key>: N }, if: { unread: "<a condition in words>" } }` (a value that
  holds only under a condition; the bot gives it nothing until it can check the condition) and `bearerStat: { stealth: 1 }` (the
  stat a card gives the minion it is put on). Counts: 301 curated, 1,654 modelled library effects (was 221 / 1,696).
- `elysium-bot.js`: `BOT_VERSION` only.
- `START-HERE-BOTS.html`: the version chip and the footer (301 curated, 1,654 modelled library effects).
- The TWD files are unchanged. Deploy: purge `/elysium-bot.js` and `/elysium-cardfx.json` (what the box serves).

## 2. Asks
1. Re-embed the guide (your embed test compares the whole of it).
2. If your client or its tests read a mode's `fx` of `elysium-cardfx.json`, check that the two new shapes in section 1 pass where an
   unknown key should be ignored; the bot's canary passes against your v2.6.179 copies and your v2.6.191 release (235/0 ×2).
