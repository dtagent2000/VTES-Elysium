# Elysium bot combat v2 — handoff plan (18 July 2026)

**Purpose:** a single, precise reference point for a FUTURE dedicated chat that tackles
the combat module specifically — kept separate from deck-onboarding work (Johan's call,
18 July) so that session can start reading here instead of re-deriving the state from
scratch. Session ritual still applies there: read journal + context + learnings FIRST,
then this document for the combat-specific detail.

## 1. Where this came from

While finishing the V5-starter Tremere/Malkavian decks (coverage v1.1.1/1.1.2), three
remaining library cards turned out to need real combat-engine work, not just cardfx
tagging: Theft of Vitae (Tremere ×10), Apportation (Tremere ×4), Swallowed by the Night
(Malkavian ×4). Checking Nosferatu's own coverage gap (not yet onboarded, but already
measured 34% auto) surfaced four more: Roundhouse (×8), Carrion Crows (×2), Immortal
Grapple (×4), Taste of Vitae (×6). All seven are catalogued below with their EXACT
requirement, not a guess.

## 2. Current shipped state — read this before touching `_resolveCombatRound`

The function's own header comment (elysium-bot.js, `async _resolveCombatRound(myVamp)`):
> *"v1 CUT LINE (spec §7.5-C): announce-only, one round, applies MY side; the opponent's
> strike isn't modelled — assumes the rulebook default (hands, 1) unless I prevent it.
> Never steps the shared ph/rd counters."*

Concretely, today the function: picks a strike card (`_bestStrikeFor`, keyed on numeric
`fx.strike`) or defaults to hands (1 damage); picks a prevent card (`_bestPreventFor`);
applies `taken` to `myVamp.blood`, torpors on unmended overflow (blood-exceeded rule,
source-verified 16 July); chats a "one round — tell me if your side's damage differs"
line; returns. **No loop. No second round, ever, regardless of what either side plays.**
Only `myVamp`'s own blood/torpor is touched — the opponent's vampire is never mutated
(their own bot instance does that from their own side, or the human table does it).

**UPDATE 19 July — still true of `_resolveCombatRound` itself (unchanged), no longer
the whole story.** `_resolveCombat` (a new, separate, THIN outer wrapper) now sits
between real gameplay and this function: every actual call site in the codebase calls
`_resolveCombat`, which repeats `_resolveCombatRound` while there's an uncancelled
press. `_resolveCombatRound` is still exactly what the quote above describes — a
single round, still directly callable (and still what every 37a–37g test calls) — it
just isn't the top-level entry point for real games anymore. See §6 step 4 and §7.5.

**UPDATE 19 July, later same day — a real bug found checking this for uncertainty.**
`_resolveCombat` had no way to know if MY OWN round-1 strike burned/torpored the
opponent (the architecture never observes the opponent's board, by design). If I
pressed for round 2 anyway, a timed-out opponent-strike handshake fell through to the
OLD assume-1-damage fallback — dealing my own vampire PHANTOM damage from a fight
that may have already ended. Fixed (bot v0.6.23): `_resolveCombatRound` gained a
backward-compatible `continued` 2nd arg; a continued-round timeout now assumes 0
damage (fail safe) and signals `opponentSilent` so the wrapper stops offering more
presses. Round 1 is unaffected (guaranteed live combatant, always was). 2 new tests
(37i).

## 3. The wire protocol ALREADY supports multi-round — no protocol change needed

This is the single most important fact for scoping the next session's work. From
ELYSIUM-PROTOCOL.md's `tally` verb (unchanged since srv-2.6.12/2.6.13, 15+ July):
- `ph` — a shared **combat phase index, 0–6** (the rulebook's seven steps per round)
- `rd` — a shared **combat round counter, 1–99**, bumped client-side on phase wrap
- Both fields are relayed exactly like `a`/`b` (block/vote stealth-intercept counters):
  absolute value, last-write-wins, ANY seat may adjust, stored on the room.

The bot reads these today only far enough to know a duel is live; it never STEPS them
(the comment says so explicitly) and never branches its own decisions on `ph`'s value.
**The infrastructure for "which phase/round are we in" already exists and is already
relayed correctly — the gap is entirely in `elysium-bot.js`'s decision logic, not in the
protocol.** No PROTOCOL.md change, no server change, no seven-file verb chain: this is a
bot-only extension, same shape as the superior-Govern/rig work already shipped this
session.

## 4. The original design already sketched this — it's a completion, not an invention

§7.5-C ("Combat module v1 — the original work order", elysium-bot-spec.md) reads:
> *"...plays combat from data: strike choice..., **maneuver if it prefers range**,
> dodge/prevent defensively..., respect **press (one per round — the limited tag
> helps)** and **combatEnds**. v1 CUT LINE: ...does NOT step the shared ph/rd counters
> (humans/the table drive the stepper) and **plays at most the rounds a press
> grants**."*

So the ORIGINAL plan already intended multi-round play driven by press, and maneuver
support — the SHIPPED cut went narrower (single round, no maneuver at all) as a
deliberate smallest-correct-slice choice, consistent with how this project always ships.
The next session is **finishing an existing design**, not drafting one from zero.

Two pieces of already-existing infrastructure the design note points at:
- **`limited`** (cardfx `e.limited`, already wired for the once-per-action bleed-modifier
  cap — Bonding/Conditioning) is the SAME flag `(limited)` rulebook text puts on some
  press-granting cards; it is NOT currently connected to any per-round press count. A
  future press consumer would need its own "presses used this combat" counter (mirroring
  the existing per-ACTION `played` ledger's shape, not `limited` itself, since `limited`
  today gates per-ACTION, not per-COMBAT).
- **`combatEnds`** (87 cards tagged, `cardfx-compile.js` line 252) has ZERO consumers
  today — same unconsumed state as `maneuver`/`press`. Extraction is done; nothing reads
  it.
- **NEW as of 19 July**: `req.beforeRangeDetermined` (84 cards), `req.rangeClose` (20),
  `req.rangeLong` (21), `req.notFirstRound` (4) — extracted while shipping the steal-
  blood family (§6) as fail-closed gates for the bot's own v1 architecture, but they are
  GENERAL combat-timing facts, not steal-specific. A future range/round tracker in this
  plan should read these directly rather than re-deriving the same regexes.
- **KNOWN LIMITATION (documented 19 July, standing-question round 4): these four req
  flags are ENTRY-scoped, not MODE-scoped.** The extraction runs once against the
  whole `c.card_text`, so a restriction stated inside only ONE mode's segment still
  sets the flag for the entire compiled entry — every mode gets excluded by the
  finders, even modes whose own text carries no such restriction. Concrete case:
  **Flames of the Netherworld** — `[tha] Only usable at long range. Burn 1 blood to
  strike: 1R aggravated damage. [dai] Strike: 1 aggravated damage. [DAI] Strike: 1R
  aggravated damage.` Only `[tha]` is range-restricted; `[dai]`/`[DAI]` are clean,
  unconditional strikes. But `req.rangeLong` sits on the ENTRY, so
  `_bestStrikeFor`/`_bestStealStrikeFor` skip the whole card — `[dai]`/`[DAI]`'s value
  is silently unreachable even though nothing in their own text restricts them. This
  is the SAFE direction of error (a missed tag, not a wrong one — no misplay risk), so
  it was left as-is rather than rushed into a fix; it's flagged here so a future pass
  doesn't have to rediscover it. **Fix shape, sketched but not built:** the req flags
  would need to move from the entry object to each individual mode object (matching
  how `fx` itself is already per-mode) — the extraction regex stays the same, but it
  needs to run per-SEGMENT (the same segment loop `fx`'s own patterns already use)
  instead of once against the whole card. Estimate the blast radius before building
  this (grep how many OTHER entries in the four flag classes have the SAME single-
  mode-restricted shape as Flames of the Netherworld, versus the more common whole-
  card-restricted shape like Blood Fury/Donnybrook/Cauldron of Blood) — if it's mostly
  one card, a curated fix is more proportionate than a structural rework. **Measured
  19 July, following this note's own advice:** it is NOT mostly one card. Rough split
  (first-line-restriction heuristic, approximate): `rangeLong` 10 whole-card /
  **11 mode-specific** (nearly half!), `beforeRangeDetermined` 62 whole-card /
  **21 mode-specific** (a quarter), `rangeClose` 17/3, `notFirstRound` 3/1. Flames of
  the Netherworld is NOT an outlier — `rangeLong` and `beforeRangeDetermined` both have
  a real, double-digit mode-specific tail. This reverses the note's own speculation:
  the structural (mode-scoped) fix is likely the RIGHT call once this plan reaches its
  own implementation phase, not a curated one-off. Left un-built for now (Johan, 19
  July: "document it" specifically, not "build it") — but the future session should
  start from THIS number, not re-derive it.

## 5. Card-by-card: exact requirement, precisely categorized

Verified against `vtes.json` card text directly (not paraphrased) and against the
CURRENT `_resolveCombatRound` body (section 2 above), so this table is a claim about
the code, not a guess.

| Card | Deck | Qty | Text (verbatim, trimmed) | What it actually needs |
|---|---|---:|---|---|
| **Theft of Vitae** | Tremere | 10 | `[tha] Strike, ranged: steal 1 blood or life. [THA] …steal 2…` | **SHIPPED 19 July (bot v0.6.19, cardfx v1.5.8).** Correction to this plan's own earlier text: steal does NOT deal damage "ranged default (1)" AND ALSO steal — per vekn.net's rulebook (source-verified before writing code), steal REPLACES the strike's damage entirely (dealt=0 on the frozen wire line), occurs BEFORE the mend-damage step (so it can save the striker from torpor the same round — proven by test 37f, not just asserted), and overflow above capacity drains off immediately. Tremere coverage 55→65 auto (Theft of Vitae's 10 copies now FULL). |
| **Roundhouse** | Nosferatu | 8 | `[pot] Strike: hand strike at +2 damage. [POT] …+3…` | **SHIPPED 19 July.** Correction to this plan's own earlier text: `.44 Magnum` was NOT actually "already-FULL" — it's EQUIPMENT-typed, so `_bestStrikeFor`'s type filter already excluded it from hand-play consumption; a pre-existing coverage-tool bug was reporting it as consumed anyway (fixed as a side effect, see §6). The regex broadening turned out to reveal a 33-card family (not just Roundhouse), and `_bestStrikeFor` needed the same req-flag + co-located guards `_bestStealStrikeFor` already had — a bot change WAS needed, this plan's "no bot change at all" was wrong. |
| **Taste of Vitae** | Nosferatu | 6 | *"Only usable at end of a round of combat… This vampire gains blood equal to the blood LOST BY THE OPPOSING VAMPIRE to damage this round."* | Fits within a SINGLE round (no multi-round needed — "this round" = the one already being resolved) but needs a NEW piece: the bot only tracks its OWN vampire's `taken`/blood loss today; to know the OPPONENT's blood loss this round, it must parse the opponent's own damage-announcement line (mirroring the existing `_awaitOppStrike` parser that already reads the opponent's STRIKE line). **Medium: one new announcement-parser, no ph/rd involvement.** |
| **Apportation** | Tremere | 4 | `[tha] Press, only usable to continue combat. [THA] Maneuver.` | **FULLY SHIPPED 19 July** — both modes now consumed. `[tha]` via `_resolveCombat`/`_bestPressFor` (§6 step 4); `[THA]` via the range concept (`_bestManeuverFor`, this section, bot v0.6.24). Tremere coverage: 64→68 auto — Apportation moved from PARTIAL all the way to FULL. |
| **Swallowed by the Night** | Malkavian | 4 | `[obf] +1 stealth (action modifier). [OBF] Maneuver (combat).` | **FULLY SHIPPED 19 July.** `[obf]` (stealth, action-modifier window) was already handled; `[OBF]` (combat maneuver) shipped with the range concept. Malkavian coverage: 62→66 auto. |
| **Carrion Crows** | Nosferatu | 2 | *"Only usable before range is determined… This combat, the opposing minion takes 1R/2R environmental damage each round during normal strike resolution."* | **SHIPPED 19 July.** Source-verified vekn.net first: environmental damage cannot be dodged (2024 rulebook clarification), combines with regular damage into one mend/torpor check (no First Strike modelled — the one documented skip-case). New "before range" play window (step 1 of 7) + persistent per-combat state (`_carrionCrows`/`_oppCarrionCrows`, reset in `_resolveCombat` not per-round) + a non-one-shot opponent parser (announces once, applies every round). Measured the whole 9-card "environmental damage" family first — only this one has the clean shape; the other 8 documented below, not built. Two compiler bugs found and fixed while building the envDmgPerRound pattern: the "As above" continuation needed its own independent match (same class of gap stealBlood already taught), and the first fix for that was too broad, accidentally matching Dark Steel/Groaning Corpse's own shorthand until "R" was made mandatory. Nosferatu coverage: 34→40 auto. |
| **Immortal Grapple** | Nosferatu | 4 | *"Grapple. Only usable at close range before strikes are chosen… [pot] Strikes that are not hand strikes cannot be used this round (by either combatant). [POT] …with 1 optional press… at close range."* | **SHIPPED 19 July** — the strike-type-restriction core + superior's range-forcing bonus. The bundled optional press itself is NOT separately consumed (documented, not built — same shape as Grasp of the Python's own bundle); the restriction and range-lock are the "heaviest" parts and are what's now working. |

## 5.5. Press rules, source-verified (19 July) before touching the round-loop

Read before writing any code — this is the actual rulebook mechanic, not inference
from card text.

**The 7-step round** (matches wire `ph` 0–6 exactly, confirmed against VEKN's own
rule-summary diagrams): 1 Before Range → 2 Determine Range → 3 Before Strikes →
4 Strike → 5 Damage Resolution → **6 Press** → 7 End of Round (where Taste of Vitae
fires — already correctly placed).

**Press mechanic, precisely** (VEKN rulebook §6.4.4 + General Rulings):
- At step 6, if BOTH combatants are still ready (neither burned/torpored), they
  either separate (default, if nobody presses) or continue.
- A press-to-continue can be CANCELLED by the opponent playing their OWN press (a
  "press to end") — the same shape as maneuvers cancelling maneuvers.
- A minion cannot play two presses in a row (can't self-cancel).
- **If there is an UNCANCELLED press to continue, a new round begins — only ONE
  side needs to press; the other does not need to agree, only to actively cancel.**
- A press granted by a COMBAT-typed card is usable ONLY in the round it's played —
  no banking for later (EC2010 ruling, explicit: "Can I press in round N with a card
  played in round N-1? Answer: No"). A press granted by a NON-combat card (action,
  equipment) CAN be used in any round of that combat — Apportation is combat-typed,
  so this distinction doesn't apply to it, but matters for future cards in this family.
- **Presses are OPTIONAL by convention/default.** Multiple official errata entries
  add "(optional)" parenthetically even to terse card text (Hawg: "Grants one
  (optional) Press"; Undead Persistence: "gets an optional press") — the ONLY
  documented exception is Talbot's Chainsaw, called out BY NAME in an official FAQ
  specifically because its press is unusually mandatory (the card text omits
  "optional" on purpose, a deliberate deviation flagged as noteworthy). Apportation's
  "[tha] Press, only usable to continue combat." — also missing the literal word
  "optional" — was checked against this pattern directly: it is NOT a documented
  mandatory exception, so it follows the default (optional), matching Grasp of the
  Python's explicit "1 optional press" phrasing for the same underlying ability shape.

## 5.6. Documented but NOT built — the exotic press variants (Johan, 19 July)

Measured while scoping the v1 slice: **104 of 410 combat cards mention "press"** (a
quarter of the whole pool) — a much bigger, more varied family than steal-blood (10)
or strike-bonus (39+6). Only the SIMPLEST shape (Apportation: standalone, optional,
no bundled effect, no third party) is in v1 scope. The rest, catalogued here so a
future session doesn't have to re-derive them:

| Card | Shape | Why it's harder than Apportation |
|---|---|---|
| **Grasp of the Python** | `[ser] Strike: hand strike, with 1 optional press... [SER] As above, and if another round occurs, that round is at close range and non-hand strikes are banned that round.` | Press is a BONUS clause bolted onto a strike choice, not a standalone card — needs the strike-selection code and the press code to cooperate on ONE card, plus the superior mode sets range AND restricts the opponent's strike options for the next round (both v2-scope concepts, range-forcing and strike-type-restriction, same family Immortal Grapple already needed). |
| **Save Face** | `Only usable by an unlocked vampire NOT involved in the current combat... Choose a younger vampire of the same clan involved in the combat. The chosen vampire gets a MANDATORY press... Only one Save Face may be played each combat.` | A THIRD-PARTY vampire (not a combatant) forces a press onto someone ELSE's ongoing fight — the bot has never modeled "my hand can affect a combat I'm not personally in." Also: mandatory (not optional), and a real once-per-combat counter (unlike Apportation, which needs none). |
| **Three's a Crowd** | `Requires a ready unlocked Blood Brother of the same circle as another one you control in combat... The Blood Brother in combat gets an optional press.` | Requires the "Blood Brother / circle" sub-mechanic (a Sabbat ritae-tied faction concept) entirely unmodeled elsewhere in cardfx today — out of scope until that mechanic exists for ANY card, not just this one. |
| **Shadow Boxing** | `[obf][pot] [COMBAT] Maneuver, only usable to get to close range, OR press... [OBF][POT] [ACTION MODIFIER] ...burns 1 blood to continue the action as if unblocked.` | Dual-type like Swallowed by the Night (a combat mode AND an unrelated action-modifier mode on the same card) — the combat mode itself offers maneuver OR press as alternatives, doubling the choice-modeling needed versus Apportation's single fixed effect. |
| **Trap** (referenced in the VTES General FAQ) | Grants a press to EVERY round until 3 rounds pass with no cards played, then auto-torpors the bearer. | A persistent, multi-round, self-terminating effect — the clearest example of why "once per round" bookkeeping needs real design (§7's open question), not assumption. |

## 5.7. Documented but NOT built — the other 8 "environmental damage" cards (19 July)

Measured before building Carrion Crows: 9 combat cards mention "environmental damage"
total. Only Carrion Crows has the clean shape now shipped. The rest, catalogued so a
future session doesn't re-derive them:

| Card | Shape | Why it's harder than Carrion Crows |
|---|---|---|
| **Blood of Acid** | `[vic] During each strike resolution this round, the opposing minion takes environmental damage equal to the amount of damage they successfully inflict on this vampire.` | REACTIVE and damage-MIRRORING (not a fixed number) — needs "how much did the opponent successfully deal me this round" tracked and reflected back. One round only (not persistent), close-range-gated. |
| **Dagon's Call** | `Strike: hand strike, and the opposing minion takes 1 unpreventable environmental damage during the press step each round this combat (only effective if this strike was made at close range).` | Persistent-this-combat, but BUNDLED as a rider on a specific strike choice (not a standalone before-range card) — needs the strike-selection code and the persistent-effect code to cooperate on one card play. Triggers at the Press step specifically, not "normal strike resolution". |
| **Dark Steel** | `[obt][pot] The opposing minion takes 1 environmental damage each round of combat during normal strike resolution at close range. This vampire gets 1 optional maneuver this round, only usable to get to close range.` | Dual-discipline requirement (obt+pot together, unusual). Range-gated EVERY round (re-checked, not just at play time) — Carrion Crows has no such gate. ALSO bundles a maneuver grant on top. |
| **Groaning Corpse** | `X is the number of Groaning Corpses already played this combat. ...each round this combat... at close range.` | Variable damage tied to a COUNTER of how many copies have been played this combat — genuinely new tracking (a running count, not a boolean flag). Also range-gated every round. |
| **Mercy for Seth** | `Strike: put this card on the opposing minion. ...During the attached minion's unlock phase, they take 1 unpreventable environmental damage.` | A different architecture entirely — an ATTACHED card on the opponent (the `bloodAddTo`/attached-card family from earlier sessions), triggering at UNLOCK PHASE, not during combat rounds at all. Barely a "combat" card in the relevant sense. |
| **Necrosis** | `[THN] ...and the opposing vampire takes 1 unpreventable environmental damage during the press step this round (only effective if this strike was made at close range).` | A ONE-ROUND bonus riding on an already-partially-consumed strike-bonus mode (Necrosis's `[THN]` already has `strike:2` from the strike-bonus family) — needs the two effects to coexist on one mode without either being lost. |
| **Weather Control** | `Both combatants and each retainer on them take 1 unpreventable environmental damage before range is determined each round this combat. [THA] ...increased by 1 in each subsequent round.` | Hits BOTH sides (including the player who cast it) plus every RETAINER (unmodelled entirely) — and the damage amount escalates round over round. The most complex of the nine by a wide margin. |
| **Grasp of the Python** (strike-type restriction sibling) | `[SER] ...if another round of combat occurs, that round is at close range (skip the determine range step) and strikes that are not hand strikes cannot be used that round (by either combatant).` | Same "restrict both combatants' strike types" concept Immortal Grapple needs (§5-successor's next card), PLUS forces the next round's range outright. |

## 6. Recommended order for the future session

**MILESTONE, 19 July: every card and concept this plan originally identified is now
SHIPPED.** All seven combat cards (Theft of Vitae, Roundhouse, Taste of Vitae,
Apportation, Swallowed by the Night, Carrion Crows, Immortal Grapple) and every
architectural concept they required (steal-blood, strike-bonus, the multi-round
loop, the range concept, the persistent-this-combat modifier concept, the
strike-type restriction concept) are built, tested, and delivered. What remains is
everything DOCUMENTED-but-not-built along the way: the exotic press variants (§5.6),
the other 8 environmental-damage cards (§5.7), the exotic maneuver variants (§5-
successor), the req-per-mode limitation (§4), and range-conditional strike bonuses
like Body of Sun. None of these were ever promised by this plan's original scope —
they were found and catalogued as this plan's own work surfaced them, for whichever
future session wants to go further.

1. ~~**Roundhouse**~~ **SHIPPED 19 July.** Turned out to be a 33-card family, not a
   one-line regex tweak: two new phrasings ("hand strike at +N damage" 22 cards,
   "This strike is at +N damage" 11 cards) beyond the original "Strike: N damage"
   shape, deliberately excluding the sibling "strength+N damage" family (21 melee
   weapons -- the bot tracks no vampire strength stat). `_bestStrikeFor` gained the
   SAME req-flag + co-located-maneuver/press guards steal already had (shared
   infrastructure). Side effect: `.44 Magnum` (equipment) was being MIS-reported as
   consumed by a blanket coverage-tool rule that predated this session -- now
   correctly INERT (attached-weapon consumption is still a future board-scan), so
   Tremere's true auto count is 64/77, not the 65 first reported before this fix.
   The Khabar: Honor curated out (unverifiable per-vampire "contract" precondition).
   Bot v0.6.20, cardfx v1.5.9, gates 316/0×3 + 116/0.
2. ~~**Theft of Vitae**~~ **SHIPPED 19 July.** Turned out to be the whole "steal blood
   via strike" family, not just this one card — measured all 10 combat-typed
   stealBlood carriers in the db before writing the finder: Theft of Vitae, Tongue of
   the Serpent, Form of the Cobra, Absorb the Mind, and Call the Lamprey's superior mode
   are ALL now consumable (`_bestStealStrikeFor`); Drain Essence/Donnybrook/Hunger of
   Marduk correctly excluded via four NEW req flags (notFirstRound/rangeClose/
   rangeLong/beforeRangeDetermined — 4/20/21/84 cards respectively, general vocabulary
   worth having for the rest of this plan too); Diversion/Kraken's Kiss excluded via a
   co-located-maneuver/press mode guard (a bundled ability, not a clean steal). Tremere
   coverage 55%→84%(65/77 auto). Bot v0.6.19, cardfx v1.5.8, gates 311/0×3 + 108/0.
3. **Taste of Vitae** — the opponent-damage-announcement parser. Bounded scope, teaches
   the pattern (parsing a reciprocal announcement) that a full multi-round rewrite would
   also need, so it's a good stepping stone before touching round-looping itself.
4. ~~**Decide the multi-round shape**~~ **SHIPPED 19 July.** `_resolveCombat` (outer
   wrapper) + `_bestPressFor` (Apportation's clean shape) + `_awaitOppPress`/parser.
   Source-verified vekn.net first (§5.5) — resolved a genuine ambiguity along the way
   (press is optional by default; Talbot's Chainsaw is the documented exception, not
   the rule Apportation follows). Bot v0.6.22, cardfx unchanged, coverage v1.1.5.
   Apportation: Tremere's coverage moved it from fully INERT to PARTIAL. Maneuver
   (Apportation's `[THA]`, Swallowed by the Night whole) and the exotic press variants
   (Grasp of the Python, Save Face, Three's a Crowd, Shadow Boxing, Trap — see §5.6)
   remain, by design — this shipped the simplest correct slice, not the whole family.
5. ~~The range concept~~ **SHIPPED 19 July.** `_bestManeuverFor` + `_awaitOppManeuver`/
   parser + a Determine-Range block (parity-resolved, single-maneuver-each v1
   simplification) + `_bestStrikeFor`/`_bestStealStrikeFor`/`_bestPressFor` made
   range-aware. Measured first: 41 clean maneuver cards (bigger than press's 12), and
   a genuine "cash-in" of the 17 strike/steal cards steal-blood/strike-bonus sessions
   had blanket-excluded via req.rangeClose/rangeLong -- now consumed for real. Bot
   v0.6.24, coverage v1.1.6. Apportation and Swallowed by the Night are now BOTH
   fully shipped (both modes). A real performance bug found and fixed along the way:
   the range step being unconditional per round meant every real combat -- not just
   tests -- would stall waiting for a maneuver that structurally can't arrive when
   neither side holds one of the rare 41 cards; fixed with a short dedicated 200ms
   timeout. 4 new tests (37j). Tremere 64→68 auto, Malkavian 62→66 auto.
6. ~~Carrion Crows~~ **SHIPPED 19 July.** See §5's updated row and §5.7 for the 8
   other environmental-damage cards measured and deliberately left for later.
7. ~~Immortal Grapple~~ **SHIPPED 19 July — the LAST new concept in this entire plan.**
   Source-verified vekn.net + official FAQ 3.16 ("restricts both minions... to only
   using 'hand strikes'"). Required retroactively classifying all 87 already-shipped
   strike/stealBlood cards with a new `handStrike` tag -- measured that the "R"
   suffix already tolerated (but never recorded) in the strike/stealBlood regexes is
   VTES's own ranged-strike marker (36 of 48 previously-unclear cards had it);
   `handStrike` fails closed on the 12 genuinely ambiguous remainder rather than
   guessing them into an illegal-play risk. New `_bestImmortalGrappleFor` + a new
   Pre-Strike play window (step 3 of 7, after range is determined) + a shared,
   symmetric `_handStrikeOnly` flag (per-ROUND, unlike Carrion Crows' per-combat) +
   an opponent parser + `_bestStrikeFor`/`_bestStealStrikeFor`/`_bestDodgeFor`/
   `_bestPressFor` all gated on it. Superior's "force next round to skip Determine
   Range" bonus also shipped. This work was found HALF-FINISHED on disk (same
   pattern as Taste of Vitae) with its own prior standing-question pass already
   fixing 2 bugs (dodge not excluded; `_bestPressFor` mistaking the bundled press);
   independent re-verification found a THIRD (superior detection always reported
   false, first-mode-found-wins), fixed and locked in with a real-card-play test.
   Bot v0.6.28, cardfx v1.6.2, coverage v1.1.8. Nosferatu: 40 auto (Immortal Grapple
   + Carrion Crows together account for the 34→40 jump, 4+2=6 copies).

## 7. Open design questions for that session (deliberately not decided here)

- ~~Does `_resolveCombatRound` grow an internal `while` loop... or a NEW outer
  loop?~~ **RESOLVED 19 July, built:** outer wrapper (`_resolveCombat`). Every
  existing 37a–37g test still calls `_resolveCombatRound` directly, untouched — the
  wrapper is genuinely thin (repeats the round, checks press, loops or returns), not
  a rewrite. All 6 real call sites rerouted to the wrapper; the fire-and-forget block
  handshake site too.
- ~~Does the bot ever WANT to press...~~ **RESOLVED 19 July, v1-dumb on purpose:** a
  simple threshold (`blood > 1`, not fragile) — same spirit as the pre-existing
  `case 'combat-strike'` dodge decision, explicitly not persona-weighted yet. Revisit
  together with that same dodge decision's own blindness (§7's other open item on
  dodge-vs-strike, added 19 July in an earlier standing-question round) — both are
  "should I spend this resource now" choices with the same missing ingredient.
- ~~Range: is a full `range: 'close'|'long'` field...~~ **RESOLVED 19 July, built:**
  a full `this._range` field (close/long), reset each round. Measurement confirmed
  the bigger opportunity wasn't just Carrion Crows/Immortal Grapple -- it was
  CASHING IN 17 already-tagged req.rangeLong/rangeClose strike/steal cards
  (steal-blood/strike-bonus sessions) that had been blanket-excluded pending exactly
  this. `_bestStrikeFor`/`_bestStealStrikeFor`/`_bestPressFor` now check the actual
  round range instead. Carrion Crows/Immortal Grapple still need the OTHER concept
  (persistent-this-combat modifiers, strike-type restriction) on top of this.
- `limited`-vs-new-counter for press: **partially answered 19 July** — Apportation's
  shape needed NO counter at all (it's a single-use hand card, consumed like any
  other; "only usable in the round it's played" per RTR ruling means there's nothing
  to bank or track across rounds). The counter question still applies to the harder
  variants (Save Face's "only one each combat", Trap's "3 rounds with no cards
  played" self-termination) — still open, still needs the `limited`-vs-new-ledger
  decision when THOSE get built.
- **req flags should become MODE-scoped, not entry-scoped (found 19 July, checking the
  strike-bonus family for uncertainty).** Today `beforeRangeDetermined`/`rangeClose`/
  `rangeLong`/`notFirstRound`/`title` are extracted once from the whole `card_text` and
  stored on the ENTRY, so a restriction stated on only ONE mode silently excludes every
  OTHER mode of the same card too — confirmed concretely on Flames of the Netherworld:
  its `[tha]` mode alone says "Only usable at long range", but `req.rangeLong` sitting
  at entry level means the finder also skips the perfectly clean `[dai]`/`[DAI]` modes,
  which carry no such restriction in their own text. Safe direction of error today (a
  missed tag, never a wrong play), so nothing was changed to fix it — but it is a real,
  named cost, not a hypothetical one. Sketch for the future fix: extend `req` from an
  entry-level object to ALSO (or instead) live per-mode, matching where `phase`/`lock`
  already live on the mode object rather than the entry — the segmenter already knows
  which text belongs to which mode when these regexes run, so the fix is likely "attach
  to the current mode instead of the shared entry req" rather than a new data shape.
  Worth a quick measurement first: how many of the ~130 cards carrying these four flags
  actually have the restriction scoped to fewer than all their modes (Flames of the
  Netherworld might be a rare shape, or a common one — check before assuming either).
- **The dodge-vs-strike decision is blind to which strike alternative it's giving up**
  (found 19-20 July, checking the shipped steal-blood work for uncertainty). `case
  'combat-strike'` dodges exactly when `blood <= 1`, regardless of what the alternative
  strike would have been — a pre-existing, deliberately-dumb v1 simplification ("no
  persona weighting yet"), not something the steal family introduced. But steal makes
  the gap more concrete: because a steal lands BEFORE the mend-damage step, a fragile
  vampire holding a steal card could sometimes survive a round by STRIKING with it
  (gaining blood before taking the incoming damage) at least as well as dodging would —
  dodging isn't strictly dominant the way it likely is against a plain higher-damage
  strike. Not fixed as part of the steal pin (narrowly special-casing steal inside an
  otherwise-still-blind dodge heuristic would be inconsistent); revisit when this plan
  gives `decide('combat-strike')` real persona weighting, and consider ALL strike
  alternatives (steal, damage-bonus, dodge) as one weighed choice rather than three
  separate blind checks.

## 8. What NOT to re-litigate

The single-round v1 cut (§7.5-C) was correct and deliberate for its scope at the time —
this document is not a criticism of it, it's the continuation. Don't re-derive "should
combat have been multi-round from the start" — it wasn't needed until real decks with
press/maneuver cards were being onboarded, which is exactly what surfaced now.

## 9. Full inventory, cross-checked against the 7-step round (19 July)

Johan asked for a systematic audit: everything built this session, checked against the
actual VEKN rulebook structure, with genuine remaining gaps sized precisely (not
guessed). Every number below was re-measured for this section, not recalled from
earlier sessions — several didn't match memory (see the strength note below).

**Step 1 — Before Range.**
✅ SHIPPED: Carrion Crows (persistent environmental damage, §5.7's table).
❌ GAP, the largest by volume: **82 other cards** require this exact window
("only usable before range is determined") and are structurally unreachable —
`_bestCarrionCrowsFor` is narrow to `envDmgPerRound` on purpose (§5.7), not a
general "before range" play window. No other card in this class can be played at
all today. This is the single biggest remaining gap in the whole combat system.

**Step 2 — Determine Range.**
✅ SHIPPED: maneuver (41 clean cards, `_bestManeuverFor`) + the 17-card req.rangeClose/
rangeLong cash-in for strike/steal.
⚠️ SIMPLIFIED: one maneuver attempt per side, not the rulebook's full back-and-forth
("can continue... for as long as they wish") — parity resolves it (§7's resolved item).
❌ GAP: 44 bundled maneuver variants (Grasp of the Python, Dark Steel, etc.) — documented
in §5.6-successor, not built.

**Step 3 — Pre-Strike.**
✅ SHIPPED: Immortal Grapple (strike-type restriction, symmetric, per-round) — 4 bugs
found and fixed across two standing-question passes (§ session journal).
❌ GAP: Grasp of the Python's identical restriction — 1 card, bundled with a strike,
not built.

**Step 4 — Strike.**
✅ SHIPPED: hand strike default; strike-bonus family (39 cards + the 6-card "N
aggravated damage" addendum); steal-blood (5 clean cards); dodge (1 general pattern
covering all 10 Dodge-carrying cards).
❌ GAP, re-measured for this section — bigger than remembered: **29 cards** grant a
"strength+N damage" bonus (not 21 as an earlier session estimated), of which **25 are
Equipment-typed** (melee weapons), only 4 are pure Combat cards. None are reachable —
this bot tracks no vampire "strength" stat at all.
❌ GAP: attached-equipment consumption (the `.44 Magnum`-class problem, noted since the
very first strike-bonus session) — a board-scan concept, never built. Equipment sits
in play, its bonus is never offered.
❌ GAP: range-CONDITIONAL dual-value strikes (Body of Sun's shape: different fixed
numbers at close vs long range) — deliberately excluded rather than guessed (§ cardfx
v1.6.0's negative lookahead), even though range is now tracked and could resolve this
correctly with dedicated handling.

**Step 5 — Damage Resolution.**
✅ SHIPPED: prevent (`_bestPreventFor`), mend, torpor determination.
❌ GAP: **First Strike is not modelled at all** — 13 combat cards use the keyword. This
is not a minor omission: it's the ONE case the rulebook itself says can skip
environmental damage entirely ("if a combatant goes to torpor by damage effects of the
First Strike, the [later] environmental damage is not resolved") — Carrion Crows'
shipped implementation is correct only because this bot never encounters that
interaction, not because it handles it.
❌ GAP: **retainers are not modelled** — 15 combat cards reference them (Weather Control
hits them too, Zombie inflicts damage as one, several First-Strike interactions depend
on whether a retainer is present). No retainer participates in this bot's combat at all.
⚠️ SIMPLIFIED: prevention doesn't distinguish strike-specific wording (most prevent
cards) from genuinely generic prevention — Carrion Crows' damage is unconditionally
placed after the prevent step (§ bot v0.6.26), which is safe (never wrongly prevented)
but could theoretically under-use a genuinely generic prevent card in hand.

**Step 6 — Press.**
✅ SHIPPED: press (`_bestPressFor`, Apportation's clean shape) + the multi-round loop
(`_resolveCombat`).
❌ GAP: this bot never attempts to CANCEL an incoming press (§7's still-open item) —
it only detects and accepts one.
❌ GAP: bundled press variants (§5.6: Grasp of the Python, Save Face, Three's a Crowd,
Shadow Boxing, Trap) — a per-combat/self-terminating counter concept, not built.

**Step 7 — End of Round.**
✅ SHIPPED: Taste of Vitae — measured as a genuine 1-card family (re-verified, still
true); no gap in this step.

**Cross-cutting gaps (span multiple steps, not tied to one):**
- **Allies as combatants**: not modelled at all. Call the Lamprey's ally-only inferior
  mode is curated empty (cardfx-curated.json) rather than built — this bot's `myVamp`
  is always assumed to be a vampire, never an ally being attacked or attacking.
- **Retainers**: see Step 5 — also affects Steps 1 (Weather Control) and 4 (retainer-
  specific strikes exist in the wider card pool, unmeasured here since none surfaced
  in the decks worked on this session).
- **First Strike**: see Step 5 — a genuine keyword mechanic, entirely separate from
  the normal strike-resolution order this bot models.
- **Vampire strength**: see Step 4 — blocks the entire strength-based weapon family
  (25 of 29 cards) and the equipment-board-scan problem together account for most of
  what's left reachable in the Combat card type.

**What this means practically**: every mechanism this session's combat plan explicitly
set out to build (§6's original seven cards) is shipped and gated (cardfx 137/0,
bot-logic 351/0×3). The gaps above were never in scope — they were catalogued as this
work surfaced them. The two with the most volume (before-range's 82 cards, strength's
29) would each be their own multi-session undertaking on the scale of what press or
the range concept required, not a quick addition.
