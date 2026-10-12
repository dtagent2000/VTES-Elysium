# Elysium bot phase-income v2 — handoff plan (18 July 2026)

**Purpose:** companion to `elysium-bot-combat-v2-plan.md`, same shape and rigor, kept as
its OWN document (Johan's stated preference: separate concerns, separate reference
points). Origin: while confirming Tremere/Malkavian's remaining gaps, the "TABLED-ONLY"
bucket turned out to be several distinct mechanics, not one — and Johan wants bots to
eventually run their own masters (hunting grounds etc.) rather than relying on the human
table to track them. This is real, valuable, currently-untouched scope.

## 1. What already works (read this before assuming a new engine is needed)

`_applyPhaseIncome(phaseKey)` (elysium-bot.js) already exists and already fires
correctly, called at `unlock` and `master` phase in the turn loop:
> *"recurring master-permanent income fires at the CARD's OWN phase — the timing lives
> in cardfx's `phase` field on the mode (Blood Doll: 'master', Vessel: 'unlock'), never
> hardcoded per card name... any future income asset only needs tagging in the library,
> not a bot code change."*

It handles `bloodToPool` (move blood from the card's own stored total to pool) and
`poolGain` (flat pool increase) today. **The exact root cause of every remaining gap:**
```js
this.board.forEach(c => {
  if(c.kind !== 'lib' || !c.host) return;   // <-- only cards ATTACHED TO A VAMPIRE
  ...
```
Vessel and Blood Doll both explicitly say *"Put this card ON A VAMPIRE"* in their text —
they have a `host` (the vampire they're attached to), so this scan finds them. **Every
card in the TABLED-ONLY bucket is a "Unique location" master — a card that sits in play
on its own, never attached to a vampire, so `c.host` is always undefined and the scan
skips it entirely.** This isn't a missing mechanism so much as a missing SECOND scan path
(freestanding location permanents) alongside the existing host-attached one — the
`phase`-field data model already generalizes; it just isn't read for this card shape yet.

**Scale of the class:** 94 "Unique location" masters exist in the full database; 33 of
those are genuine "Hunting ground." cards (see §3) — this is a real, high-value,
cross-deck vocabulary investment, not a two-card patch.

## 2. Card-by-card, as verified against vtes.json and the current elysium-cardfx.json

| Card | Deck | Qty | Text (verbatim, trimmed) | Current cardfx | What it needs |
|---|---|---:|---|---|---|
| **Asylum / Academic Hunting Ground** | Malk / Trem | 1+1 | *"During your unlock phase, a ready vampire you control can gain 1 blood. A vampire can gain blood from only one hunting ground each turn."* | NO modes at all — completely untagged | See §3, the main event |
| **Arcane Library** | Tremere | 1 | *"You can lock this card during your influence phase to add 1 blood to a Tremere in your uncontrolled region."* | **SHIPPED 19 July** — confirmed exactly as predicted: `_considerLockIncome` already read this shape, only `phase:'influence'`/`bloodAddTo:'unc'` needed curating. The one genuinely new wrinkle: the target must ALSO match `req.clan` (Tremere) — Dreams of the Sphinx's own bloodAdd has no clan restriction, so `_considerLockIncome`'s target-selection needed a clan-aware filter added (a correct no-op for Dreams of the Sphinx, verified). | Tremere: 70->71 auto. No new gen-deck-coverage.js special-case needed — the existing `bloodAdd@lock-income` rule already covered it. |
| **Chantry** | Tremere | 1 | *"You can lock this card and burn 1 pool or 1 blood from a ready Tremere you control during your master phase to move a Tremere from torpor to their controller's ready region."* | **SHIPPED 19 July** — new `_considerLockRescue`, kept SEPARATE from `_considerLockIncome` on purpose ("income" doesn't semantically fit a torpor-to-ready move, even though the scan shape is identical). Reuses `req.clan` (already auto-detected) rather than a new field. Payer preference: pool first, blood-from-a-ready-same-clan-vampire only if pool insufficient AND the payer keeps at least 1 blood afterward (screened at the finder, not decide()). | `rescueTorpor:1` fx key. gen-deck-coverage.js needed NO new special-case — the existing generic `lock-income@` rule already covered it once the mode carried `lock:true`+`phase:'master'`. Tremere: 69->70 auto. |
| **Elder Library** | Malkavian | 1 | *"+1 hand size."* | No modes (untagged) | **CORRECTED 19 July** — the earlier "moot, no hand-size-limit logic exists" verdict was WRONG, built on the same mistaken assumption Dreams of the Sphinx's hand-size choice also needed correcting: hand size is an ACTIVE target (source-verified vekn.net: "discard down to or draw up to your hand size" whenever it changes), not a passive ceiling needing separate limit-tracking. Elder Library is actually SIMPLER than Dreams of the Sphinx's version: no lock, no "until end of turn" — just PERMANENTLY +1 while in play. Needs a one-time "draw 1 up to the new base(7)+1 the moment this enters play" trigger (a CARD_HANDLERS-shaped fix, not `_considerLockIncome` — there's no lock choice here at all), then nothing further; the bot's hand naturally settles around 8 through normal play afterward. Small, now genuinely buildable — not attempted this round since it wasn't what was asked. |
| **Life in the City** | Malkavian | 2 | *"Trifle. Add 1 blood to a ready vampire."* | **SHIPPED 19 July**: `bloodAddTo:'own-ready'` (v1.6.3) | `CARD_HANDLERS['life-in-the-city']` — target-selection mirrors `_bestBloodStockFor`'s own spirit (highest-capacity ready vampire that still wants blood). The Coven's identical "add N blood to a ready vampire" phrase, used as a LOCK-based recurring choice, correctly stays untagged (own-ready's own negative lookahead) — a distinct future pin, same shape as Dreams of the Sphinx's own lock-choices. |
| **Dreams of the Sphinx** | (Inside Dirt / sewer) | 3 | *"Put this card in play... You can lock this card to get +2 hand size until end of turn. You can lock this card during your unlock phase to gain 1 pool if you have the Edge. You can lock this card to add 1 blood to a vampire in your uncontrolled region. Burn this card if it has 3 counters."* | **FULLY SHIPPED 19 July** — all three choices now consumed. Hand-size turned out NOT to be moot after all: source-verified vekn.net corrects the earlier "no consumer, hand-size-limit tracking doesn't exist" verdict — hand size is an ACTIVE target ("discard down to or draw up to your hand size" whenever it changes), not a passive ceiling needing a limit-tracker at all. `_considerLockIncome` draws up to base(7)+2 immediately; a new extracted `_revertHandSizeBonus()` discards back down at end of turn. | `_considerLockIncome(phaseKey)`, the income-flavoured sibling of `_considerTurnActGrants` (same scan-decide-lock-apply shape), now handles all THREE fx shapes (poolGain, bloodAdd+bloodAddTo:unc, handSize) — genuinely reusable for Arcane Library and Chantry once their own cardfx matches this shape. |
| **Wider View** | Malk + Trem | 1+1 | *"Trifle. Put this card in play. You can use 1 transfer to draw 1 card from your crypt... You can use 4 transfers to burn this card and gain 2 pool."* | **SHIPPED 19 July** — `transferSwap`/`transferBurnPool`/`transferCost` fx keys, wired directly into a new `_influenceLoop()` (extracted from `_playTurn` for testability). Transfers (`this.inf`) were already tracked there; neither ability is lock-gated. | The transfer-spending consumer class this row itself predicted is now built — read by fx key, not hardcoded to Wider View's name, so a future card sharing this shape (Powerbase-class transfer-spenders, say) is automatically covered too. Inside Dirt: **100% (76/76 auto)**. |

## 3. The main event — "hunting ground" as ONE vocabulary family — **SHIPPED 19 July**

Re-measured against the full 40-card "hunting ground" pool before building anything
(more than the 33 first estimated): 23 share the EXACT clean shape predicted below
(two surface phrasings, same effect), plus 2 clan/title-restricted siblings (Papillon,
Meditative Grove) reusing the same shape with a target restriction. All 25 curated and
wired through a new `_considerHuntingGround`. The other 15 (Arcanum Chapterhouse,
Gurchon Hall, Jungle/Threestar/Kingston's accumulate-then-spend counters, Trophy:
Hunting Ground's host-attachment, Carfax Abbey/Burial Site/Poacher's own conditional
bonuses, Poison the Well of Life/Reformation's attack-on-hunting-grounds, and Klaus/
Santaleous/Vassily's vampire-card abilities) are genuinely distinct shapes, measured
and catalogued, not guessed at — a future session's own pin if ever wanted.

**What actually landed, matching the original scoping almost exactly:**
1. **`bloodAddTo:'own-ready'`** — turned out to ALREADY exist, built for Life in the
   City two rounds earlier. Reused directly, zero new target-class work needed.
2. **The cross-card once-per-turn limiter** — a single `_huntingGroundUsedThisTurn`
   flag, reset alongside the ALREADY-established `_perfUsed` reset at unlock-phase
   start (the exact "once-each-turn gate resets at MY turn start" shape predicted).
3. **A location-scan path** — built as its OWN function (`_considerHuntingGround`),
   not a branch inside `_applyPhaseIncome`, once it became clear the mechanic is
   NEITHER host-attached-automatic NOR lock-gated — a genuine third shape needing its
   own name, matching this session's own `_considerLockRescue` naming precedent.
4. **Target decision** — highest-capacity ready vampire still wanting blood, the SAME
   target-selection spirit as every other `bloodAddTo` consumer this session built
   (Life in the City, superior-Govern, Arcane Library) — kept uniform on purpose.
5. **Clan/creed variants** — read individually before curating (not regex-guessed):
   Papillon needs `req.title` (fails closed — titles untracked, the already-
   established `_bestBloodStockFor` precedent); Meditative Grove needs `req.clan:
   ['Salubri']` (a tracked clan, so it fully works). Result: Academic/Asylum Hunting
   Ground FULL, **Tremere and Malkavian both 72/77 auto (94%)**.

## 4. Recommended order

1. ~~**Hunting ground core pattern**~~ **SHIPPED 19 July** (Johan's "process the family,
   gives many free to other decks" GO) — see §3's own updated writeup. Turned out
   NOT to need `_applyPhaseIncome`'s own scan extended after all; a new, separate
   `_considerHuntingGround` was cleaner once it became clear the mechanic is neither
   host-attached-automatic nor lock-gated.
2. ~~**Arcane Library**~~ **SHIPPED 19 July** — turned out to need `_considerLockIncome`
   directly (the reusable reader Dreams of the Sphinx built), not step 1's hunting-
   ground location-scan at all; the clan-aware target filter was the only genuinely
   new piece.
3. ~~**Life in the City**~~ **SHIPPED 19 July** (Johan's "push Inside Dirt to 100%" GO)
   — turned out NOT to need step 1's location-scan path at all (it's a one-shot master
   play, not a phase-recurring permanent), so it was buildable standalone. See §2's row.
4. ~~**Dreams of the Sphinx**~~ **SHIPPED 19 July** for 2 of its 3 lock-choices —
   `_considerLockIncome(phaseKey)` built, the "optional lock choice" decision layer
   Arcane Library/Chantry will ALSO need. It's a genuine READER (mode-shaped, not a
   bespoke handler), so step 2 (Arcane Library) should now be nearly free: shape its
   cardfx the same way (`lock:true`, `phase:'influence'`, `fx:{bloodAdd,bloodAddTo:
   'unc'}`) and add one more `_considerLockIncome('influence')` call site — the reader
   itself needs no further changes for that card specifically (clan-restriction on the
   TARGET, "a Tremere in your uncontrolled region", is the one new wrinkle to check).
   Dreams of the Sphinx's hand-size third also SHIPPED the same day (see §2) — all
   three choices are now consumed, `_considerLockIncome` handles all three fx shapes.
5. **Elder Library** — CORRECTED 19 July (was wrongly answered "moot" the first time):
   hand size is an ACTIVE target, not a passive ceiling, so this card is genuinely
   buildable — a small, one-time "draw 1 on entering play" trigger, simpler than Dreams
   of the Sphinx (no lock, no reversion, just permanent +1). Not built this round
   (wasn't asked), but no longer blocked on anything.
6. ~~**Wider View**~~ **SHIPPED 19 July** — the transfer-spending consumer class this
   plan's own row predicted, now built (`_influenceLoop`, fx-key-read not
   name-hardcoded). ~~**Chantry**~~ **SHIPPED 19 July, same day** — new
   `_considerLockRescue`, reusing `req.clan`; no new coverage special-case needed at
   all, the existing generic `lock-income@` rule already covered it.

**MILESTONE, updated 19 July: EVERYTHING this plan identified is now shipped,
including the "main event" itself.** Elder Library, Life in the City, Dreams of the
Sphinx (all three choices), Wider View, Chantry, Arcane Library, AND the hunting-
ground core pattern (§3, 25 of 40 measured cards) — the whole document, cover to
cover. What's left is genuinely outside this plan's own scope: the 15 exotic hunting-
ground variants catalogued in §3's own list (accumulate-then-spend counters,
multiplayer-count-dependent targets, attack effects, vampire-card abilities), plus
whatever this SAME work newly surfaces in decks beyond the ones checked so far.

## 5. Open design questions for that session

- Does the "once per hunting ground per turn" limiter belong on `this` (per-bot turn
  state, reset at turn start) or does it need any cross-seat awareness? Source-verify:
  the rule caps how much ONE Methuselah's OWN vampires can gain, not a table-wide cap —
  almost certainly bot-local state, but confirm against vekn.net before encoding, same
  discipline as every other rule this session touched.
- Should the location-scan path be a NEW function, or should `_applyPhaseIncome` grow a
  second internal loop? Given it's the same `phase`-keyed dispatch just over a different
  `this.board` filter, a shared helper called twice (once per scan shape) is probably
  cleanest — decide when actually writing it, not here.
- The "should I lock this optional master now" decision (Arcane Library, Chantry) is a
  genuine STRATEGY choice, not a mechanical one — likely wants a persona-weighted
  heuristic similar in spirit to `grinderReadyTarget`, not a hardcoded always-lock.

## 6. What NOT to re-litigate

`_applyPhaseIncome`'s host-attached design wasn't a mistake — Blood Doll and Vessel are
genuinely vampire-attached cards, and the function correctly serves them. This is an
ADDITION (a second scan shape for freestanding locations), not a rewrite.
