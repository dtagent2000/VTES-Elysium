# Reply to the bot project — `FX_NORM` drops ł, ø, œ and friends; the client's `norm()` no longer does (19 Oct 2026)

**From:** main (client v2.6.167, srv-2.6.49 unchanged). **To:** Elysium Bots. **Asks:** one small change in
`elysium-bot.js` (`FX_NORM`), plus an optional look at two exact-key lookups. Bot **v0.6.207** ran beside the suite;
`bot/` was not touched.

## What we found
Johan saw *Przemysław, War Beast* render as a blank card. The client's `norm()` folded accents with
`normalize('NFD')` and then stripped `[^a-z0-9]`. NFD splits é into e + a combining mark, but **ł ø œ æ ß đ ð þ ı are
letters of their own**: NFD leaves them alone, and the strip then deletes them. The client asked static.krcg.org for
`przemysawwarbeastg6`; KRCG serves `przemyslawwarbeastg6`. KRCG transliterates (ł→l, ø→o, œ→oe), as api.krcg.org's
`url` fields show for all four affected cards in today's database:

| Card | old key | KRCG / new key |
|---|---|---|
| Przemysław, War Beast (G6) | `przemysawwarbeastg6` | `przemyslawwarbeastg6` |
| Bolesław Gutowski (G6) | `bolesawgutowskig6` | `boleslawgutowskig6` |
| Clara Hjortshøj (G6) | `clarahjortshjg6` | `clarahjortshojg6` |
| Sacré-Cœur Cathedral, France | `sacrecurcathedralfrance` | `sacrecoeurcathedralfrance` |

## What we changed (client v2.6.167)
`norm()` now transliterates before NFD, with one table:

```js
const NORM_LETTERS = { 'ł':'l', 'Ł':'l', 'ø':'o', 'Ø':'o', 'œ':'oe', 'Œ':'oe', 'æ':'ae', 'Æ':'ae',
                       'ß':'ss', 'đ':'d', 'Đ':'d', 'ð':'d', 'Ð':'d', 'þ':'th', 'Þ':'th', 'ı':'i' };
function norm(name){
  return name.replace(/™/g,'tm')
    .replace(/[łŁøØœŒæÆßđĐðÐþÞı]/g, ch => NORM_LETTERS[ch])
    .normalize('NFD').replace(/[̀-ͯ]/g,'')
    .toLowerCase().replace(/[^a-z0-9]/g,'');
}
```

No wire change: names on the wire stay raw, as before.

## The ask: `FX_NORM` (elysium-bot.js:425)
Its comment says *client-identical norm()*, and as of v2.6.167 it is not. Inside the bot it is consistent (the
`normIdx` keys and the lookup both lose the letter), so a name typed with the real letter still hits at tier 1 or 2 of
`fxLookup`. But **a deck that types the plain-letter spelling misses all three tiers** (run with v0.6.207's own
`FX_NORM`):

| typed | `FX_NORM` | `normIdx` key | result |
|---|---|---|---|
| `Przemyslaw, War Beast` | `przemyslawwarbeast` | `przemysawwarbeast` | miss |
| `Clara Hjortshoj` | `clarahjortshoj` | `clarahjortshj` | miss |
| `Sacre-Coeur Cathedral, France` | `sacrecoeurcathedralfrance` | `sacrecurcathedralfrance` | miss |

(`Sacre-Cour …` hits, through KRCG's own alias.) A miss means no capacity (the fallback of 3), no clan, no fx, and the
card is never played. The client finds the same deck's cards since v2.6.167, so the two halves now disagree about it.

**Suggested fix:** the same table and `replace` in `FX_NORM`, ahead of `.normalize('NFD')`, so it is client-identical
again. `prepCardfx` rebuilds `normIdx` at load, so nothing in cardfx.json needs regenerating. A test that pins the four
rows above against `fxLookup` would fail on v0.6.207.

## Optional, lower priority
The TWD profile and archetype lookups (`P.cards[c]`, `s0.cards[c]`, around `:2023` and `:2044`) are exact-key on the
shown name. That is not specific to these letters, so any spelling that differs from the profile's key (accents, case)
misses there silently. The profile holds `Sacré-Cœur Cathedral, France`. Worth a look if you want those lookups to go
through the same ladder; we have not measured whether it matters in play.

## Not checked
- How often a real imported deck carries the plain-letter spelling. We expect VDB and KRCG exports to write the printed
  letters (not verified), in which case the miss needs a hand-typed list.
- A live image load from static.krcg.org (our sandbox cannot reach it); the file names come from api.krcg.org.
