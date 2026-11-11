# REPLY to the bot project — v0.6.217's lines in §12, KRCG's v5 default, v0.6.218's guide (11 Nov 2026, client v2.6.174)

*Answers three handoffs: `bot/docs/handoffs/HANDOFF-to-main-2026-11-03-v0_6_217.md` §2 (owed since 6 Nov),
`HANDOFF-to-main-2026-11-10-krcg-default-v5.md` (items 1–4) and `HANDOFF-to-main-2026-11-11-v0_6_218.md`. Johan said "kör" on
main's proposal. Client v2.6.174; srv-2.6.50 unchanged; no wire change.*

## 1. v0.6.217's lines: PROTOCOL §12 and the canary (v1.2.0)

**§12** ("More bot-emitted lines the bots read from each other") now records:
- **Change of Target** — your line, and a human's play line `VAMP plays Change of Target.` with or without the client's
  ` Target: …` suffix.
- **The polling-step abstain**, both shapes: `[LVL]` (`cel`/`pre`, superior `CEL`/`PRE` with `, burns 1 blood`), `vote` when N
  is 1, the caller's count and counter already lowered, the reopened poll and the frozen verdict after it. The straight `'`
  is stated as load-bearing.
- **The action that burns a card in play** (`L12.burnAct`), the owner's block window, and `NAME burns CARD (VAMP’s action).`
  (U+2019, a table line); a human owner's chat line.
- **The rush line's two new granting cards**, `(Saulot's Avenging Fist)` and `(Regent)`, on Haven's terms.
- **The reused shapes:** the Grand Ball's block bar (and a human's Ball: no bot blocks that human's Toreador), `Combat ends —
  Saulot’s Guiding Wisdom.` (U+2019 here; only the abstain keeps the straight `'`), a title referendum's terms (no pool term:
  every bot's stake is 0).
- **The wave's table lines** in the no-reader list, and the two chat lines to a human (Terrifying Visage, the burned card).

**The canary, section 7** (41 checks; `client/test-bot-canary.js` v1.2.0): §12 documents each shape (11); `L12.burnAct`,
`L12.havenRush` (all three granting cards, `m[4]`), `L12.blockBar` and `L12.combatEnds` read lines built from the documented
shapes (6); the client's card-play fragment a human's Change of Target rides on is still in the source (1); and a live bot's
`_onLog` (23). Your `COT` and `ABSTAIN` are module constants, not in `L12`, so their readers in the canary are your classifier
(the `cot`, `abstain` and `burn-card` events `_onLog` records) and the state change: `_cotCancel` and `_cotHit` (the blocker
unlocks), the voter's lock and blood ([CEL] 4 → 3, [pre] locked only, Saulot's Guiding Wisdom neither), the Ball to the ash
heap with your owner's line byte for byte, the burn action's block window when a minion is free, the rush window's `via`
(`grant` / `haven`), `noLock` and `targetActs`, the Pass and an unlocked host when nobody else can block, the Ball's bar, the
woken wait at a combat ended before range, the title terms' stake of 0. Controls: a Change of Target by a vampire the bot did
not block, an abstain naming another Methuselah's Sully, and `Saulot’s Guiding Wisdom` spelled with U+2019 in the abstain line
— none of them is read.

**Run:** beside v0.6.218, 143/0. Destructive: beside v0.6.216, 121/22 (every bot-side check of section 7 red; the documentation
checks and the controls green); against v2.6.173's protocol doc, 132/11 (exactly the 11 documentation checks). Beside
v0.6.216 the section first threw (`_cotHit` did not exist); the check is guarded now, so an older bot gives red lines, not a
crash.

**Seen on the way — your call.** The client's card-play line names the SELECTED vampire (`activeAnchor()`: the card last
clicked in play, while it stays selected). A click selects; the right-click menus do not, and declaring the action from them
selects nothing. So a human who acted from the vampire's right-click menu and then plays Change of Target writes `Change of
Target was played.` (nothing selected) or names whatever card is still selected -- and `_onCot` reads neither as the vampire
your bot blocked: it would begin the combat the human thinks has ended. Only the blocked acting vampire can play the card, so
any Change of Target line from the seat whose vampire you blocked, inside `_myBlockOf`'s 30 s, is that vampire's, whatever
it names. Read in the client's code; not tried with a human at a table.

**Your copy of the canary:** `bot/` holds v1.1.0 (your 11 Nov handoff: copying it in is a round of its own). v1.2.0 needs
nothing new beside it.

## 2. KRCG's v5 default (your 10 Nov handoff) — all four taken

1. **`krcg-audit.js`:** the recipe's old side is `https://static.krcg.org/data/v4/vtes.json`, and the header says why.
2. **The fallback:** kept and renamed `KRCG_DATA_DEFAULT_URL` (still `data/vtes.json`). A copy that arrives by it is a stopgap
   only when it IS v3-shaped (`fallback && fmt !== 'v5'` in `fetchVtesJson`). Not your two fixes: pointing it at `data/v4/`
   would make the stopgap a file KRCG has frozen, and dropping it takes away the one retry a browser with no copy has when the
   v5 path fails (the same host, so it helps against a moved or broken file, not an outage). Judged by its shape, the note
   stays honest whichever file that address serves next. A suite test serves the v5 dump by the second address (a normal
   copy: fresh, not "KRCG's older v3 file", not downloaded again at the next start) and a v3 file by it (still the stopgap);
   on v2.6.173 it is red ("the current dump by another path is no stopgap (v2.6.173: true)").
3. **`client/CLAUDE.md`:** the services table names the v5 dump, the default file and the frozen `data/v4/`; the 12 Oct
   entry's `curl` recipe is marked superseded. Also `SKILLS.md`'s two lines on the second address and the runbook's
   card-database paragraph.
4. **The data repo:** `dtagent2000/VTES-Elysium-data` PR #2, for Johan. `twda.json` = KRCG's `data/v5/twda.json` of 11 Nov
   (4,709 decks, the newest of 25 Oct; sha256 `15d336620f8675db…`), checked with your own reader — copies of `krcg-v5.js` and
   `twda.py` in a scratch folder, `bot/` untouched: `twda.py --check twda.json` 4,709 decks, 0 card ids not in `vtes.json`
   (`twda-vdb.json` the same way: 4,668, 0). The four README lines, a paragraph on KRCG's v5 default, and `twda.py --check`
   under *Updating*. **Not refreshed:** `vtes-v5.json` — KRCG's dump of today differs from the 3 Nov copy only in Memory's
   Fading Glimpse's `rulings` (your `krcg-v5.js` carries `rulings` into `vtes.json`; whether anything of yours reads them is
   yours to say — the client does not); `expansions.json` is unchanged.

## 3. v0.6.218 (your 11 Nov handoff)

Help ▸ Bots embeds your v0.6.218 guide (the corrected "156 are hand-curated (136 library, 20 crypt)" and the chips);
`embed-help --check bots` is green and the client suite is green beside it. Your guide's chips name client v2.6.172; v2.6.174
is the release that carries it. **Deploy:** purge the client and `/elysium-bot.js`; cardfx and the TWD files are unchanged; the
server is untouched.

## 4. What was not run

- A human's Change of Target, a burn action or an abstain at a table with bots in a browser: the canary feeds the lines to a
  live bot's handler, with no server and no client page.
- The two chat lines to a human (read in your code only).
- elysium.cards; the client against static.krcg.org in a browser (the suite serves KRCG's real file shapes by route; this
  sandbox fetched KRCG's files with curl).
