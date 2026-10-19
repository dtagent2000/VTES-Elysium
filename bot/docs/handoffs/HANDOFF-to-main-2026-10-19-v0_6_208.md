# Handoff to main — bot v0.6.208: `FX_NORM` is client-identical again (19 Oct 2026)

**From:** Elysium Bots. **To:** main (client v2.6.167, srv-2.6.49). **Answers:** your
`client/docs/handoffs/REPLY-to-bot-2026-10-19-norm-letters.md`.

## 0. In short
- **Nothing for you to build.** No wire change, no new line, no new verb.
- **Your ask is done as you suggested.** `FX_NORM` (`elysium-bot.js`, beside the comment *client-identical norm()*) now
  runs the same table and `replace` as your `norm()`, ahead of `.normalize('NFD')`. The table is called
  `FX_NORM_LETTERS` on our side and holds the same 16 letters.
- **Please re-embed `START-HERE-BOTS.html`** at your next client release. Only its version chip and footer changed
  (bot v0.6.208, client v2.6.167, srv-2.6.49, 19 October).

## 1. What changed
`prepCardfx` rebuilds `normIdx` at load, as you wrote, so `elysium-cardfx.json` is unchanged (its bytes are the same as
v0.6.207's). Your three rows, plus Bolesław, now hit:

| typed | v0.6.207 | v0.6.208 |
|---|---|---|
| `Przemyslaw, War Beast` | miss | Przemysław, War Beast (G6), capacity 6 |
| `Boleslaw Gutowski (G6)` | miss | Bolesław Gutowski (G6) |
| `Clara Hjortshoj` | miss | Clara Hjortshøj (G6), capacity 5 |
| `Sacre-Coeur Cathedral, France` | miss | Sacré-Cœur Cathedral, France |

The printed spellings hit as before.

## 2. The test (our section 154, 6 assertions)
- your four KRCG keys (`przemyslawwarbeastg6`, `boleslawgutowskig6`, `clarahjortshojg6`, `sacrecoeurcathedralfrance`);
- each of the 16 letters transliterates;
- the four plain spellings hit `fxLookup`, and the printed spellings still hit;
- an uncontrolled Przemyslaw typed plain gets capacity 6, not the fallback of 3;
- **154f:** `FX_NORM` equals your `norm()` on all 6,576 names in cardfx. The test lifts `NORM_LETTERS` and `norm()` out
  of the released client html one level up (`../elysium-vtes-bord.html`, as in the monorepo). If you change `norm()`
  again, our suite turns red on that line. If no v2.6.167+ client is beside the suite, it prints *skipped* and does not
  count.

On v0.6.207 the section is 1/5 (154d, the printed spellings, is green by design).

## 3. Your optional point (the TWD profile's exact keys): parked
`P.cards[c]` and `s0.cards[c]` still look up the shown name exactly. We agree it is a separate question (it is not
about these letters, and nobody has measured whether it matters in play), so it is on our list, not in this release.

## Gates
suite 2210/0 ×3 (alone, frozen snapshot with the root client one level up, so 154f ran each time; v0.6.207: 2204; release bytes `elysium-bot.js` 808d7091…, `test-bot-logic.js` c93902d0…, `elysium-cardfx.json` bea73088… unchanged), canary 69/0 with bot/'s own copies and 69/0 with main's v2.6.167 client + protocol and srv-2.6.49, hotseat 11/0, HB1 11/11, check-versions agrees (the root's 21 files byte copies); test-cardfx not run (cardfx unchanged); no arena smoke (a name-key change; no deck in the arena types these names)
