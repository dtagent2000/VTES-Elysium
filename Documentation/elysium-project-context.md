# Elysium - Project Context & Working Reference

> **14 July 2026 (bot v0.5.6 → v0.5.7, cardfx/client/server untouched) — Bounce-fix steg 1: `_commitBounce` sends a spec-correct L12.bleed re-announce, the NEW target's pending now arms correctly (gate 186/0 unchanged, proven via diagnostic):** The prerequisite for the generalized action-resolution loop (Leverage/Deflection/modifier-window) turned out to be a fundamental bug in the existing defense-side bounce mechanism: `_commitBounce` sent a freeform prose line no parser could match, so the NEW target's pending never armed at all (confirmed via a 3-seat diagnostic script: botC.pending stayed null). Three patches: (1) `_armPending` gained an `owner` parameter — the real Methuselah who controls the acting minion, separate from `who` (the message sender, which is the BOUNCER at a redirect, not the original bleeder); `pending.who` is now always the real owner. (2) `_onLog`'s L12.bleed parser derives the real owner at a Target-based arming by looking up the acting vampire's name in all seats' published boards (the same data `_inPlayNorms` already reads) — the server's `log` handler constructs a fresh `{t:'log', who: p.name, html}` and discards all extra fields, so metadata CAN'T ride the message, but the vampire name IS in the HTML and the board lookup resolves the owner locally. (3) `_commitBounce` now sends TWO log lines: the existing informational prose ("plays Deflection: the bleed is redirected to X") PLUS a real L12.bleed-matching re-announce ("VampX bleeds for N. Target: Y's pool.") — the new target's parser arms pending via the already-existing L12.bleed code path, no new parsing needed. Also fixed: `_bestBounceFor` now returns `mode.lock` so `_commitBounce` knows whether to lock the reacting vampire (Deflection [dom]: yes, [DOM]: no); and the re-targeting clearance + L12.add matching in `_onLog` now compare against the acting vampire name (stable across bounces) instead of `who` (unstable at redirects). **Proven via diagnostic, not just tested:** `botC.pending.who = 'Johan'` (the real owner, not 'BotB' the bouncer), `actingVampName = 'Lucinde, Alastor'` preserved through the entire chain. **Next: step 2 — the attacker-side modifier window + full action-resolution loop (architecture sketch and rule verification already done, saved in the design-decisions doc).**
> **14 July 2026 (bot v0.5.5 → v0.5.6, cardfx/client/server untouched) — Ashur Tablets' table-wide collateral watch shipped: a human OR another bot crossing their own threshold now correctly sweeps this bot's copies too, no benefit (gate: cardfx 74/0 unchanged, bot 175/0→186/0):** Johan asked whether the bot-vs-bot mechanism could also react to a HUMAN reaching their own 3rd copy. The answer simplified the whole feature: since the rule hits anyone at the table symmetrically, no new wire message is needed at all — every player (bot or human) can just observe the table (data the server already relays, `this.table[seat].pub.cards`) and clean up their own copies whenever the threshold fires anywhere. A first design ("does any seat currently show ≥3 copies in ready") was wrong, caught by re-deriving the turn sequence on paper rather than by testing: the triggering seat's own handler burns its 3 copies the same instant it crosses the threshold, so that signal is gone before any other seat's turn to look. Redesigned around tracking each seat's `'burned'`-count over time instead (a permanent, one-way zone, so a rise in it stays observable later) — new shared `_ashurResolve(iTriggered)` (own copies always removed; only the actual trigger gets the +3 pool/retrieval, a collateral loss gets nothing) and `_checkAshurTableWide()`, run once per own turn. **A genuine environment outage interrupted this work mid-round** — the already-written, already-tested code was actually LOST (not just paused), confirmed by grepping for the specific method names rather than assuming file timestamps meant everything survived; rebuilt from the already-worked-out design. The new live-integration test is this session's first with TWO real, simultaneously-connected Bot instances (a 3-seat game: light host + Bot A + Bot B) — an early version asserted on raw pool and failed for an unrelated reason (the triggering bot's ordinary prey-bleed happened to land on the bystander bot in this seating, an expected mechanic, not an Ashur Tablets bug), fixed by asserting on the absence of trigger-specific signals instead of the confounded pool number. Two new learnings logged: verify actual file state after any interruption rather than assuming, and prefer a durable EFFECT signal over a transient PRECONDITION signal when detecting another agent's event. **Remaining, deliberately parked:** a human-facing notification UI (needs client-side work in the 15,000-line `elysium-vtes-bord.html`, its own build pipeline) and removing OTHER Methuselahs' copies via a new protocol verb (`ctrl` is owner-gated) — both separate, larger conversations.
> **14 July 2026 (cardfx v1.4.2, bot v0.5.4 → v0.5.5, client/server untouched) — Ashur Tablets' OWN-side threshold mechanism shipped, the last of the four Masters now fully functional (gate: cardfx 73/0→74/0, bot 159/0→175/0, 4× stable):** Johan asked whether Ashur Tablets' own side (everything except removing OTHER Methuselahs' copies, already established as needing protocol work) could be built too, and proposed retrieval heuristics himself (type mix, decklist scarcity). Corrected a misremembering first (the rule is "shuffle into your library", not "on top"). Researched VTES strategy literature before scoring anything: Ashur Tablets is community-termed "recursion", valued for adapting to the table situation over a fixed priority; master-card retrieval is a named real pattern (confirms the Master-bonus factor). Protocol research: `browse`/`pileTake` turned out to be crypt/library-pile-only (the server's undrawn decks) — NOT the ash heap, which is already the bot's own tracked board state, so "move 1 card to hand" is a pure local mutation; "shuffle the rest into the library" does need `pileBulk{lib,shuffle}` — a verb that exists and fits perfectly but had zero prior in-bot usage (unlike `drawCrypt`, which had a working precedent). Built: `handler:'ashur-tablets'` — at 3 own copies in `ready`, removes them to the client's `'burned'` zone (removed-from-the-game, a local mutation mirroring `_toAsh`'s pattern) and grants +3 pool; new `_ashScoreFor(name)` scores ash-heap candidates on three additive, community-informed factors (Master bonus, decklist-scarcity computed from qty minus everywhere the bot can currently see a copy, hand-type-mix) — a GENERAL v1 foundation, explicitly not persona-weighted yet per Johan's own call to theorize/playtest toward tuning later; highest score retrieved to hand via `decide('ashur-retrieve')`, the rest bulk-returned via `pileBulk`. **A genuine test-authoring bug, not a code bug:** the first live-integration test assumed Ashur Tablets costs 2 pool (confusing it with The Parthenon) — a debug script instrumented to trace `pool`/`edge` at every phase boundary showed the real number (start + 3, zero cost deduction — Ashur Tablets is entirely FREE, confirmed against the compiled cardfx entry) before the assertion was corrected; new learning logged about verifying assumed numbers against actual data even while writing tests, not just handlers. Tests: 2 new cardfx asserts, 13 new bot asserts (9 offline covering each scoring factor and threshold scenario independently, plus a new live-integration test proving the full chain including the bot's first-ever `pileBulk` round trip against a real server). **All four original Masters (Parthenon/Information Highway/Ashur Tablets/Effective Management) are now fully functional on the bot's own side. The one remaining gap — removing OTHER Methuselahs' Ashur Tablets copies — needs new protocol work (`ctrl` is owner-gated) and stays a separate, larger conversation, not a quick follow-on.**
> **14 July 2026 (cardfx v1.4.1, bot v0.5.3 → v0.5.4, client/server untouched) — Effective Management's EFFECT automated (not just its placement), new `handler` field + `CARD_HANDLERS` registry (gate: cardfx 72/0→73/0, bot 154/0→159/0, 3× stable):** Closed the last real gap among the four curated Masters — Parthenon/Information Highway were independently re-verified as fully working this session (re-lock across a THIRD turn confirmed by direct code execution, not just inspection; `_recomputePhaseActs` confirmed reading REAL Information Highway curated data, not just the older synthetic test fixture), leaving only Effective Management's own effect ("move the top crypt card to uncontrolled") unmodelled. Johan's architecture question: should bespoke, one-off effects that manipulate a player's OWN zones (crypt/hand/ash/library) read as instructions TO the bot rather than an attempt at generic `fx` vocabulary — and can that stay open for a future human-facing helper too? Researched before answering: the client models crypt as a real stack (`zones.crypt.at(-1)` = top — NOT a player choice), and the protocol already has a `drawCrypt` verb the bot's own paid Influence-phase vampire fetch already uses — Effective Management's effect is literally the same operation, free instead of costing 4 transfers + 1 pool. Answer: yes to instruction-not-vocabulary (same call already made for Ashur Tablets' threshold), and yes to future-helper-compatible for free, since the handler just sends the same wire verb a client button would. Built: entry-level curated `handler` string + a `CARD_HANDLERS` registry in `elysium-bot.js`, dispatched from the MASTER play loop after the card resolves — the generic loop only ever asks "does this entry name a handler," never a card name. Effective Management's handler: guard on `cryptN > 0`, send `drawCrypt`. A live-integration test initially asserted on `bot.unc.length` and failed — not a code bug: a debug script with full logging showed `cryptN` correctly decrementing (8→7, proving the real wire round-trip), but the SAME turn's own pre-existing Influence-phase logic (cheap uncontrolled vampires already available) swept the freshly-drawn vampire into `ready` before the poll observed `unc` — fixed by asserting on the stable `cryptN` counter instead of the transient array; new testing principle logged. Tests: 2 new cardfx asserts, 6 new bot asserts (4 offline + 1 live test extended to verify the full round-trip). **All four original Masters now fully functional except Ashur Tablets' own threshold mechanism, which stays deliberately unbuilt — it needs protocol work (`ctrl` is owner-gated, no way to remove ANOTHER player's permanents) that's a separate, larger conversation, not a quick follow-on.**
> **14 July 2026 (cardfx v1.4.0 curated data, bot v0.5.2 → v0.5.3, client/server untouched) — all four Masters curated, `actGrant` fully wired (both persist modes), Parthenon's lock decision shipped (gate: cardfx 65/0→72/0, bot 135/0→154/0, 3× stable):** Curated The Parthenon (`actGrant:{phase:'master',amount:1,persist:'turn'}`, `lock:true`), Information Highway (`actGrant:{phase:'influence',amount:2,persist:'inplay'}`), Ashur Tablets (persistent, deliberately NO modes/actGrant — its threshold mechanic stays unmodelled, see `cardfx-persistent-lock-design-decisions.md` §8), Effective Management (note-only, deliberately no persistent tag). Backfilled the 4 pre-existing curated entries (Blood Doll/Vessel/Dreams of the Sphinx/Inside Dirt) with `persistent`/`lock` too, closing the gap flagged the same morning. **Real finding while implementing:** `_recomputePhaseActs()` has always read `actGrant` ENTRY-LEVEL (`h.e.actGrant`), confirmed against the existing passing test fixture — `elysium-cardfx-design.md` had documented it as per-mode since it was written, aspirational and never actually true; fixed the doc to match the shipped, tested reader rather than the reverse (curating Parthenon at the documented-but-wrong nesting level would have silently done nothing). Bot changes: `_bestMasterFor` gained `persistent`/`curated` fields (separate questions from `known`, which only ever meant "has a recognized recurring-income fx" — true for exactly Blood Doll/Vessel, never for a Location); the MASTER play loop now branches on `persistent` — a non-persistent card (Effective Management) resolves straight to the public ash heap (`_toAsh`) instead of sitting on the board forever, the concrete bug this whole tagging effort was motivated by; the "(uncurated — adjust if needed)" messaging moved from gating on `known` to `curated`, so a hand-verified Location no longer wrongly implies it needs a human's help. New `_considerTurnActGrants(phaseKey)` — the `persist:'turn'` counterpart to `_recomputePhaseActs`, run after `_unlockPhase()` and before the phase's play loop, asking a new `decide('lock-actgrant')` whether to spend an eligible card's lock. Parthenon's own answer is unconditionally yes (no host, no action-slot cost to lock it, fixed amount — genuinely no downside, not a stand-in), kept as its own decide() case so a future multi-choice `persist:'turn'` card has a natural place for real persona-weighted logic. Tests: 7 new cardfx asserts (all 8 curated entries' compiled shape); 19 new bot asserts (8 offline units for the two new mechanisms, 2 new LIVE integration tests — Effective Management ashing, and a full 2-turn chain proving Parthenon's lock genuinely lets BOTH Effective Management and Information Highway get played in the same master phase); updated the pre-existing Ashur Tablets live test's stale "uncurated" framing to "curated, no recognized income fx" and added a persistent/zone assertion. **Next: Ashur Tablets' own threshold mechanism (track own copies in play, trigger at 3) remains unbuilt and deliberately ungeneralized — a bespoke bot addition whenever Johan wants it, not a schema tag.**
> **14 July 2026 (cardfx v1.3.0 → v1.4.0, client/server/bot untouched) — Persistent + Lock rulebook tags, full sweep + audit (gate 46/0 → 65/0, real vtes.json, drift guard clean):** Two new auto-tier tags mirroring the v1.2.0 unique/limited precedent: `persistent` (entry-level on `lib`) and `lock` (per-mode, alongside `dir` — not inside `fx`). Design pass first (Persistent/Active/Passive/Lock/Timing/Cost taxonomy Johan proposed, evaluated against real vtes.json before any code): Persistent stays entry-level (not per-mode like `dir`), Active/Passive gets no field of its own (derived from `lock`/`phase` presence instead), Lock is per-mode (Dreams of the Sphinx and Enkil Cog both need a card to be Passive in one mode and Active in another). Four real bugs caught by actually running the compiler rather than trusting the code by inspection: (1) the mode-emission gate was fx-only, so The Parthenon's lock-only text ("lock this card to get +1 master phase action" — no fx pattern exists for phase-action grants) compiled to zero modes, discarding the very fact the sweep was built to capture; widened to fx-OR-dir-OR-lock. (2) "unlock"/"block" contain the bare substring "lock this" — an unanchored regex produced 125 false positives (As the Crow's "Unlock this minion" tagged as a lock cost, the opposite concept); fixed with a leading `\b`. (3) Deflection's `[DOM]` ("As above, but do NOT lock this vampire") would have wrongly inherited `[dom]`'s lock:true through a naive "as above" carry-through; fixed with an explicit false state that blocks inheritance (Devil-Channel: Throat is the mirror-image case — superior ADDS a lock inferior lacks — verified correct in the same pass). Known accepted miss: Gift of Sleep has a genuine "Lock that ally" beside an unrelated negation in the same segment; the if/else-if lets the negation win, so the real lock is missed (not mistagged) — left as a curation-queue item per the auto tier's stated tolerance. (4) Equipment/Ally/Retainer/Event were nearly invisible to text-pattern matching (only 18/164, 0/119, 0/54, 1/40 respectively) because these types stay in play BY RULE without ever restating it in prose — exactly Johan's own opening instruction, missed until the sweep-audit's type-breakdown table surfaced the gap; fixed with a type-first check ahead of the text patterns (Power/Conviction considered and explicitly rejected after reading samples — both are burn-for-effect, not stay-in-play). Final counts: persistent 1194/2364 lib entries (836 text-pattern + 358 type-implicit), lock 149. Masters specifically: 418/525 (80%) persistent, 90 lock-gated, 330 persistent-but-no-lock (the phase/actGrant:inplay curation queue). Delivered a standalone `cardfx-sweep-audit.md` (full Masters table, all 149 lock hits with matched text, the 11 negation cases, non-Master type breakdown, known follow-ups) generated by a small reusable `gen-sweep-audit.js`. Known follow-up, not yet done: the 4 already-curated entries (Blood Doll/Vessel/Dreams of the Sphinx/Inside Dirt) don't inherit the new tags since curated overlay replaces whole entries — need `persistent`/`lock` added by hand for full cross-tier consistency. **Next: curate Parthenon/Information Highway/Ashur Tablets/Effective Management's `actGrant` in `cardfx-curated.json`, then build the `persist:'turn'` reader + the (likely near-trivial, since Parthenon has no host vampire and no real trade-off) decide-to-lock-Parthenon logic — see `elysium-cardfx-design.md` §4.**
> **14 July 2026 (bot v0.5.1 → v0.5.2, client/server untouched) — stealth universalized, real deck now default (gate 132/0 → 135/0, 4× stable):** (1) "every action treated fundamentally the same" (Johan) — hunt never set `this._actingVamp`, so its OWN Block? response could never reach the existing reactive-stealth mechanism (`_onBlockAttempt` → `decide('spend-stealth')`); fixed with the same wiring bleed already has, plus a new `stakes` weight (a typical bleed=baseline, hunt's fixed 1-blood prize is discounted) so the mechanism is universal but willingness is stakes-weighted per persona. (2) `DEFAULT_DECK` replaced with Johan's real "Leveraging my Hacking Skills" (12 crypt/62 library, all names verified against cardfx). This surfaced a real test fragility: the foundational connection/turn/bleed/combat flow (sections 1-9) had silently relied on `DEFAULT_DECK` instead of its own explicit deck, so swapping the default made an existing discard-phase assertion flaky (the new deck has no Obfuscate-gated cards to go dead). Fixed by pinning that whole test flow to an explicit deck identical to the OLD default — decoupling test determinism from whatever ships as default, the same discipline every other test already followed. No wire change. **Next session (Johan's plan): Masters tagging round (Ashur Tablets/Effective Management/Information Highway/The Parthenon) — full "start here" note in `elysium-backlog.md`. Check first whether `vtes.json` is attached to that conversation: uploads don't carry between chats, and the compiled `elysium-cardfx.json` does NOT retain raw `card_text` for auto-tier entries.**
> **14 July 2026 (bot v0.5.0 → v0.5.1, client/server untouched) — §7.6 follow-up: a real deck, an Edge correction, generalized phase economy (gate 119/0 → 132/0, 3× stable):** Johan supplied a real "Weenie Computer Hacking" playbook; verifying every card's REAL text against `vtes.json` (not the auto-fx summary alone) found Leverage burns the Edge for +1 bleed (no discipline), Ashur Tablets is a threshold/one-shot (not recurring income), Effective Management/Information Highway/The Parthenon are all unmodelled, and the bot's combat module reads `fx.prevent` only — `fx.dodge` (this deck's entire combat suite) is unhandled. Johan corrected a real misunderstanding mid-review: the Edge's unlock-phase pool bonus is PASSIVE (holding it a full round also grants +1 pool, it does not consume the Edge) — the shipped code already had this right, only the prose ("cash in") was imprecise; the earlier-flagged "tension with Leverage" was withdrawn as a result. Three design decisions then built same-session: (1) the bot now ALWAYS plays a master card if it holds one, even an uncurated one (placed as a standalone permanent, a human corrects it via ctrl); (2) a generalized phase-action economy (`phaseActs`/`phaseBonus`/`phaseUsed` → `_phaseAvail`), verified against and mirroring the client's own `state.phaseActs`/`masterBonus` system, now shared by Master/Influence/Discard instead of each having bespoke logic; (3) a new curated `actGrant` field for future bespoke bonus-action cards (Parthenon-class), deliberately independent of and non-competing with the Trifle keyword's own capped rule — documented in `elysium-cardfx-design.md`, no shipped card uses it yet. 13 new offline units + 1 new live integration test. No wire change.
> **13 July 2026 (bot v0.5.0, cardfx recompiled, client/server untouched) — vtes.json follow-up:** Johan attached the real card database (KRCG v3 format) after the §7.6 delivery below. Real compile + `test-cardfx.js` run for real: **46/0, drift check clean** — `elysium-cardfx.json` is now a genuine fresh compile (replaces the earlier hand-mirrored file used while `vtes.json` was unavailable; identical content, confirmed correct). Also answered Johan's L4-vs-L2/L3 question with actual code research rather than assumption: L2/L3/L4 are board-style + zoom-level view modes, not a responsive ladder, and attached-card (`host`/`attached`) rendering is already mirrored across all of them (`buildMat()` shared by L2/L3/visit, `renderL4OppCards()` L4's own parallel implementation, deliberately kept in sync per its own comment) — full detail in `elysium-learnings.md`.
> **13 July 2026 (bot v0.4.6 → v0.5.0, client/server untouched):** §7.6 SHIPPED — masters, hunt, pool economy (gate 80/0 → **119/0**, 3× stable). Three real decisions from Johan reshaped scope: (1) passive income timing is PHASE-EXACT via a new cardfx `phase` field (data, not bot code) rather than the v1 single-fixed-point simplification — `cardfx-compile.js`'s curated overlay is a whole-entry passthrough (verified, no compiler change needed), though `elysium-cardfx.json` had to be hand-mirrored since this environment has no `vtes.json` to recompile with (`test-cardfx.js` could not run here — recommend Johan run it once locally); (2) voluntary hunting is persona-weighted (reuses `aggression` inversely, no new knob) rather than strictly rulebook-mandatory-only; (3) the bot proactively blocking a prey's/predator's hunt was explicitly PARKED (documented future shape: capability + persona gate, same split as `blockShy`), not built. Shipped: Master-phase play (Blood Doll/Vessel, trifle bonus action), mandatory + voluntary hunt (reuses Bleed's exact announce→ask→resolve shape), phase-exact recurring income, full phase-bar parity (`_announcePhase` sends the identical `log('Phase: <b>X</b>.')` line a human's Structured helper button does, gated on the same `caps.tally` signal, at all 5 phases + an unconditional Pass parity line), a smarter discard (masters no longer auto-dead; a bounce-only card now correctly dead fodder in a 2-live-player table via a widened `_modeUsableBy`), and — Johan's own follow-up question turning up a real gap, not a cosmetic one — the Edge is now ALWAYS cashed in for +1 pool at unlock (source-verified vekn.net: optional and forgettable for a human, no reason for a bot to ever skip it). `buildPub()` gained `host`/`attached` fields (a played permanent would otherwise render unattached on other boards — nothing had ever attached to anything before). A genuine bug (`_drawOwed` silently un-flushed when a vampire hunts instead of bleeds) was caught by the new live integration test and fixed via an extracted `_flushDraws()`. 29 new offline units + 1 live integration test. No wire change.
> **13 July 2026 (bot v0.4.6, client/server untouched):** Johan's direct follow-up — the bot never unlocked vampires in torpor. Source-verified against the vekn.net rulebook: "A vampire in torpor is still considered controlled but is not ready. They still unlock at the start of the unlock phase." Torpor and lock/unlock are two SEPARATE flags — a torpid vampire stays not-ready, but its lock flag clears every unlock phase same as a ready one; the old code only ever touched `zone==='ready'`, leaving a torpid vampire locked forever (wrong both cosmetically — a stale lock glyph — and mechanically, for any card that reads a torpid minion's lock state). The UNLOCK block is now its own `_unlockPhase()` method (directly unit-testable), clearing lock on both ready AND torpor. Also removed an orphaned `torporN` variable found along the way. Gates: bot **78/0 → 80/0** (3× stable), canary 37/0, client-logic 29/0, dispatch 18/0, protocol-lint 6/0, check-versions agrees. No wire change.
> **13 July 2026 (bot v0.4.5, client/server untouched):** three fixes from Johan's live test of the M2 defense pass. **(1) Collision-free zone placement:** `slot(zone,idx)` is a pure idx→{x,y} formula with no memory of who's already there; deriving `idx` from "current zone count" only holds while a zone stays contiguous, so a vampire leaving Ready out of turn (combat torpor, or the v0.4.4 ctrl torpor/untorpor exception) freed a MIDDLE slot the next influence raise recomputed straight onto a still-occupied neighbour — Johan's "vampires stacking on top of each other." New `_openSlot(zone, exclude)` scans for the first `slot(zone,idx)` nobody else in that zone already occupies; wired into the influence raise, `_resolveCombatRound`'s torpor placement (was a hardcoded `slot('torpor',0)` — every KO'd vampire landed on the SAME spot), the ctrl torpor/untorpor toggle (previously left x/y untouched across a zone change), and `_addUnc` (was `this.unc.length`, same hole risk). **(2) The 2s pacing floor now actually holds everywhere:** `paceMs` (2000 by default in a real game, 0 in tests/the arena — unchanged) was a blind `sleep()` called inconsistently — the minion→influence and influence→discard turn-phase transitions had NO gap at all, and a wake+intercept or strike+prevent double-card reaction could fire both plays in the same instant. New `_pace()` gate enforces a FLOOR since the last resolved action (not a fixed re-sleep, so an already-slow `_askBlock` wait never gets a needless extra pause); threaded through every turn-phase transition, `_commitBlock`'s wake→intercept step, and `_resolveCombatRound`'s strike→prevent step (both now `async`). `react-delay` (the "Hold on…" thinking pause) now floors at `paceMs` instead of capping under it (was 1.6s at the default persona, under the 2s ask). **(3) Influence now animates:** raising a vampire never called `fxClone`; it now sends `kind:'rise'` (the protocol/server already supported it for a human's own bring-into-play — the bot just never sent it). Gates: bot **70/0 → 78/0** (3× stable), canary 37/0, client-logic 29/0, dispatch 18/0, protocol-lint 6/0, check-versions agrees. No wire change.
> **13 July 2026 (client v2.6.39 / server v2.6.16, client-only change):** fixed the `free` fallback counter hiding a viewer's own Block/Vote/Combat buttons after they turned a helper back on — `free` is shared state (v2.6.37), so once set it kept `avr.mode` truthy and the old button-hiding logic hid ALL named buttons whenever `avr.mode` was truthy, with no exception for a viewer who no longer needs `free`. `avrRender()` now computes `freeNeeded = avr.mode==='free' && avrFreeAvailable()`; the named buttons and the live strip are masked by `free` only for a viewer who STILL has zero named helpers — `avr.mode` itself is left alone (a genuinely helper-less table-mate mid-count isn't disturbed), and pressing any real named button still overwrites `avr.mode` for everyone via the existing `avrOpen()`. Gates: client-logic 29/0, dispatch 18/0, protocol-lint 6/0, canary 37/0, bot-logic 70/0, B1 roundtrip byte-identical. No wire change.
> **13 July 2026 (client v2.6.38 / server v2.6.16, client-only change):** the quick-phrase say-bubbles now stay centred as a GROUP instead of sitting in fixed columns — `sayBubble()` keeps an ordered oldest→newest array and derives each bubble's `left%` from its index and the current count (`50+(i-(n-1)/2)*20`), so the newest lands at its own slot directly while every already-mounted bubble glides to its new (shifted) position via a new `left`-only CSS transition; the same relayout runs on fade-out and on cap-eviction so survivors always re-centre. Net effect: the oldest bubble drifts left as newer ones arrive, until it fades or gets evicted. Gates: client-logic 29/0, dispatch 18/0, protocol-lint 6/0, canary 37/0, bot-logic 70/0, B1 roundtrip byte-identical. No wire change.
> **13 July 2026 (client v2.6.37 / server v2.6.16, client-only change):** the Played-tab resolver strip (`#avrLive`) was missing its `[hidden]` CSS rule — the same id-selector-beats-`[hidden]` footgun already fixed elsewhere (`#avrDuel`/`#edge`/`#helpOverlay`) — so with every named resolver helper off it stayed visibly stuck at "0 vs 0" with dead controls. Fixed, AND turned into a feature (Johan's ask): a new `free` mode is the automatic fallback counter (bare A vs B, no card semantics) shown whenever `resBlock`/`resVote`/`resCombat` are all off for a player. First cut kept it local-only; Johan flagged that as inconsistent with the other three resolvers, so it now rides the same shared `tally` channel — any seat may adjust it, exactly like Block/Vote/Combat. With any named helper on, the CSS fix restores the clean intended look (only enabled buttons show; the live strip stays hidden until clicked). Also: quick-phrase say-bubbles now claim one of 3 fixed columns instead of all rendering at the same `left:50%`, so overlapping phrases sit side by side instead of stacking illegibly. Gates: client-logic 29/0, dispatch 18/0, protocol-lint 6/0, canary 37/0, bot-logic 70/0, B1 roundtrip byte-identical. No wire change.
> **13 July 2026 (client v2.6.35 / server v2.6.16 / bot v0.4.4) — the bot-elements exception:** a bot seat self-declares `bot:true` at create/join; the server relays it in `roster`/`lobby` (`players[].bot`, additive field, no new verb). The opponent-card menu now splits Take-back/Burn (owner-only — they move the card off the board entirely) from Blood/Blue/Green/Lock/Flip/**new Torpor toggle** (`_mine || _botSeat`) — ANY player may now adjust a bot's own cards, since a headless bot can't model every triggered ability. The bot's `elysium-bot.js` gained its first-ever `ctrl` handler (it had NONE before — the owner-gated menu never showed controller actions against a bot, so the wire path was untested against a headless receiver) with deliberately NO owner check (trusts any sender — only a self-declared bot seat ever reaches it). New `torpor`/`untorpor` ctrl verbs (vampires only) also generalize to the pre-existing human-controller case via `move()`. Johan's related ask — pausing the bot's own turn engine on 'Hold on…' so a human can safely edit mid-turn without racing it — is parked as a discussion point in the backlog, not solved here; this session's test is built entirely BEFORE the turn ever passes to the bot, so nothing races `_playTurn()`. Gates: bot 65/0→**70/0**, dispatch 18/0, client-logic 29/0, canary 37/0, protocol-lint 6/0, B1 roundtrip byte-identical. **Server restart required.**
> **13 July 2026 (client-only, v2.6.33):** four small client fixes — brightness cap 130%→200%; the online opening deal now sorts the hand immediately (was: only after the first drawn card re-sorted it via `move()`); the L2 column-dock ("bottenpeek") no longer closes unconditionally on drag-out, it defers to the same `conv.dockDrag`/`dockPinned`-aware pattern L3/L4 already used (v2.5.76); `showSay()` cancels any running Reaction-timer countdown the instant a quick phrase renders (menu, ❗ button, or network relay — all three funnel through it). Gates: client-logic 29/0, dispatch 18/0, protocol-lint 6/0, B1 roundtrip byte-identical. Server/protocol untouched.
> **13 July 2026 (client-only, v2.6.34):** a second, independent "Menu/panel brightness" slider (Settings), since the table brightness filter deliberately never touched menus/panels (readability) and the new 200% cap made that gap more visible. Implemented as a `--ui-bright` CSS var applied directly to the chrome elements (header/aside/#menu/.modal/#playedOverlay/#readyPeek/#cardTip) rather than a shared ancestor of `#board` — the two brightness values can't compound. Own localStorage key, own settings-export field, own factory-reset entry.
> **This doc reflects Elysium v2.6.27 (client v2.6.34 / server v2.6.15, last updated 13 July 2026 — RELEASE CANDIDATE; NEW 12 July 2026, bot track: the cardfx library v1 — a SHARED card-effect database compiled from vtes.json (`cardfx-compile.js` → `elysium-cardfx.json`, fxv 1: 2364 lib / 1785 crypt / 2422 aliases, 62% auto-fx; v1.2.0 rules tags: unique 352 lib + 5 crypt non-unique, limited 75 lib + 9 crypt; hand tier `cardfx-curated.json`; gate `test-cardfx.js` 45/0 | **`test-bot-canary.js`** (13 July, 37/0) — cross-checks PROTOCOL §12 prose, the client's live line-builders (executed), and the bot's `L12` regex object; destructive-tested for real detection, not a rubber stamp; schema/tiers/limits in `elysium-cardfx-design.md`) — facts in the library, policy in playbooks; supersedes the bot spec's own-deck-only scope; client/server untouched; NEW: the duel view D1 (combatants side by side in the Played peek, own manageable / opponent read-only, server-merged `duel` map) — see elysium-duel-design.md; round 3: resolver round 3 — rule-correct Block resolve (no batch close, local question), combat round counter (`tally.rd`), `+X bleed…` running-total announces, peek held open by live resolvers, frozen line formats in PROTOCOL §12; round 2: resolver round 2 — Resolve closes the batch + Settings clear/discard choice, combat phase stepper (`tally.ph`), `res` fan-out, ⇄ Pass button, per-mode colours; round 1: Bleed 1/2/3/X… submenu + the shared Played-tab resolvers (Block/Vote/Combat) synced via the new `tally` verb — see the journal's resolver entry; the local images/ folder serves vtes.json (server whitelist + first-tier fetch), and a 📁 From file… picker covers the first-time-offline file:// start (FileReader loads + caches once, later starts automatic); SERVER RESTART pending).** **New 11 July 2026: the Trainbot lands (M1 slice 1) — `elysium-bot.js` + `test-bot-logic.js`, a headless zero-dep seat bot; design + milestone ladder in `elysium-bot-feasibility.md`. NEW 12 July 2026: bot v0.2.0 (gate 33/0) — the pending-bleed machine (announce ≠ resolve), §12 line parsing, the symmetric reaction window with a multi-channel Block? ask (chat + say + live §12 resolve lines), frozen-line announces, a table model with cardfx threat reads, READ-ONLY tally mirror + capability detection, the three-tier name ladder (exact → alias → client-identical norm()), crypt caps from cardfx, the seat-anchored L4 camp (pool-token export), the decide() persona seam, and a paced outbound queue (the server hard-closes >80 msgs/10 s). SAME DAY, bot v0.3.0 (gate 39/0 ×3): named personas (novice/grinder/shark), the §7 insight hand-READ (inference from fx-play clones + pub diffs, never hand knowledge), decide() v2 with real scoring — bleed-action cards from hand (frozen §12 line at the chosen amount, draw-back) and stealth vs say-'Block!' (insight-weighted; ask stays open for the table's §12 verdict), and QUEUE-COALESCED push (order-preserving placeholder, latest pub at drain — a timer debounce reorders the wire and was reverted). Spec status in `elysium-bot-spec.md` §1/§2/§7. PLUS: `elysium-bot-table.js` v1.0.0 (multi-bot launcher; bot-vs-bot loop smoke-proven), `START-HERE-BOTS.html` (player guide + live-test checklist), and the AUTHORING-PIPELINE end goal recorded in spec §7 (next rung: `elysium-bot-arena.js`, a headless match runner). Client/server untouched.** Per-version history for the 7 July mega-session (lobby L1+L2, the three-tier image system, Deck Lab fixes, tutorial split, guided launchers, README) lives in `elysium-session-journal.md`; this header previously accumulated it all and was consolidated on Johan's docs-review ask.
>
> **Protocol for these two docs:** at the start of work on a game project, read the latest project-context and learnings docs *first* - before digging into the code or the rest of the files. After each implementation, update them where needed - a version bump, a new learning or pitfall, a changed convention.

A fast-start orientation for picking up Elysium development, especially from a fresh AI session. Pair this with **elysium-learnings.md** (learnings + collaboration). The user-facing manuals live in the three generated Word files; the forward backlog is in the Technical Documentation Word doc and in the session journal.

## What Elysium is

A free, browser-based digital table for *Vampire: The Eternal Struggle* (VTES), Dark Pack compliant. It is a **sandbox**: it enforces no game rules - the players do - but it logs everything, keeps hidden cards genuinely hidden, and shows every action to the whole table. Two ways to play:

- **Hotseat** - several players take turns on one screen, no server.
- **Online** - a bundled Node server holds the hidden piles and relays the table to networked players.

Tech: a single self-contained HTML file (vanilla JS + HTML5 Canvas/DOM, **zero dependencies**) for the client, and a single Node file (**zero npm packages**, hand-rolled WebSocket) for the server. Current version: **client 2.6.15 / server 2.6.10** (the two patch numbers are free to drift apart on client-only changes, per the v2.5.30 major.minor lockstep policy; v2.5.63 was the last server-logic change — the `sanitizePub` field-relay sweep — so a **server restart is required** if not yet done).

## The files

| File | What it is |
|------|-----------|
| `elysium-vtes-bord.html` | The client - the entire game, UI, network layer, and the embedded hand-escrow crypto. ~10,000+ lines. Almost all work happens here. Current version: **2.6.15**. |
| `elysium-server.js` | The server - rooms, hidden piles, relay, sanitisation, named saves. ~56 KB. Also serves the client file to browsers. |
| `esc-crypto.js` | Standalone reference copy of the hand-escrow crypto (SHA-256/HMAC/PBKDF2/AEAD); the same code is embedded in the client, so this file is **repo-local reference only** — correctly absent from the project snapshot (see the inventory). |
| `build-docs-en.js`, `build-docs.js` | Generators for the English / Swedish Word docs (uses the `docx` npm lib). Edit content here, then re-run; do not hand-edit the .docx. **Local-only — not always in snapshot.** |
| `Elysium - Player Manual.docx`, `... Host Guide.docx` (**v1.7**, 2 July 2026), `... Technical Documentation & Roadmap.docx` | The generated English docs. The Technical doc also carries the forward backlog. Host Guide v1.7 added "Hosting on macOS & Linux" and "Bring your own server", a Link-invites bullet, and three Troubleshooting rows - rebuilt directly with `docx`-js this round since the generator wasn't in snapshot; see `elysium-learnings.md` for the mechanism. |
| `elysium-relocation-plan.md` | The consolidated relocation plan (replaces `elysium-relocation-brief.md`). Documents the discipline rule, TDZ constraints, frozen items, all decisions, and verification commands. Kept for reference — the relocation is complete. |
| `relocate.py` | The Python script that executed the relocation (brace-counting parser, 42 functions). Kept for reference. |
| `kodarkivering.md` | Parked / retired code, archived verbatim with what/why/where notes (the Alt views, the L3 circle table, `renderOval`, the Simplified default-view setting). Nothing here is wired into the client. |
| `START-HERE.html` / `STARTA-HAR.html` | Browser onboarding for people you share Elysium with (guest / host / Tailscale + troubleshooting), EN / SV. **v1.4 (2 July 2026):** three-OS host + tunnel paths (Windows/macOS/Linux) and Mac/Linux troubleshooting rows; the SV file is a clean retranslation of v1.4 — diff against any locally tweaked copy before replacing. |
| `start-elysium.bat` | Windows launcher with a Node check. Never double-click the .js directly - the Windows Script Host kills it with "Invalid character, line 1". |
| `start-elysium.sh` / `start-elysium.command` | macOS/Linux launchers (Batch 4, v2.5.37) - the .command is the Mac double-click wrapper. `chmod +x` once, or `bash start-elysium.sh`. |
| `start-cloudflare-tunnel.sh` / `start-cloudflare-tunnel.command` | macOS/Linux tunnel launcher (+ Mac double-click wrapper) - mirrors the .bat (waits for the real `https://…trycloudflare.com` line, prints it loudly, pbcopy/xclip when available). |
| `ELYSIUM-PROTOCOL.md` | **The client↔server contract** (Batch 4): transport, session, security invariants, MUST/MAY server capability split, all 48 c→s verbs + 42 s→c messages with fields (generated FROM the code), deep-link prefill, conformance suites, Dark Pack note. Machine-guarded - see the next row. |
| `test-protocol-doc.js` | The protocol-doc lint, **v2 (six checks)**: the doc's three verb-index marker blocks AND every §7/§8 per-verb field list, diffed against the LIVE `GAME_HANDLERS`/`MP_HANDLERS` tables both directions (fields via `Function.toString()` — the generator's own extraction, drift-proof by construction). **Any protocol change ships with a doc update + a green run.** |
| `check-versions.js` | One-command snapshot drift check: code VERSIONs, the four living-doc headers, the PROTOCOL header, the START-HERE/STARTA-HAR twins, suite expectations, and presence of the split/build/harness trio. Exit 1 on drift — run at session start. |
| `elysium-bot.js` | **Trainbot v0.4.3** (13 July 2026, gate 65/0) — a headless, zero-dependency Node WebSocket client that takes a real seat. v0.1 base: RFC 6455 client mirroring `wsAttach`, `sanitizePub`-shaped pub authoring, correct phase order incl. the opening-transfer stagger, influence from playbooks, Block?-asks, the chat grammar (`bleed N`/`vote N`), oust→`bounty`. v0.2: the pending-bleed machine (apply ONLY on 'It resolves'; +X reopens; block-success aborts; supersede; stale-on-turn-change), §12 parsing + frozen-line announces, the symmetric reaction window ('Hold on…'/'Pass'; multi-channel ask: chat + say + §12 lines), table model + cardfx threat reads, tally mirror (READ-ONLY) + capability detection (classic ⇒ one tip), the three-tier name ladder (norm() client-identical), cardfx crypt caps, the seat-anchored L4 camp (pool token + camp slots), the decide() persona seam, a paced outbound queue (server closes >80 msg/10 s). v0.3: personas + the insight hand-read (`readP`), bleed-card plays with draw-back, stealth vs Block! (ask stays open), queue-coalesced push. v0.3.1: exception-guarded dispatch (one bad message never kills the multi-bot process). v0.3.2: crypt uniqueness. v0.3.3 RULES LAYER: tag-aware uniqueness (five true non-uniques may dup), unique-library `_mayPlay` guard, per-action modifier ledger, the Edge on through-bleeds (v0.3.4: rising-claim yield + gone on oust); v0.3.5: `create`/`startPool` opts + 'bot:' telemetry (the data layer); v0.3.6: the ghost-prey rule (asks never wait on ousted preys) + hardened _drain; suite spawns a server COPY in tmp. v0.3.7 (the live-test round): verdict-wait on 'Block!' when resolvers are live, fxClone emissions (plays ANIMATE), the discard phase (1/turn), crypt fetch at 4 transfers + 1 pool, pacing defaults 2000/1600, forceSetPool deduped+enhanced (clamp, oust-on-zero), and the pacer rebuilt as a TOKEN BUCKET (burst 8, 1/140 ms — the rolling-window cap stalled critical says); a missing cardfx now WARNS loudly (plain-bleed mode). v0.3.8-10: repeated-Block! wait fix, PUBLIC ash heap, TOKEN-BUCKET pacer, the Reaction-timer ring, withdrawn-block reopen. **v0.4.0 (M2, 13 July): informed block-as-target** (blockShy finally used), **reactions** (intercept/wake/Deflection-bounce, once-per-action ledger ENFORCED), **combat module v1** (data-driven strike/prevent, one round, announce-only), vote-abstain courtesy. **v0.4.1 (Johan's catch, source-verified):** bounce now checks a LEGAL destination exists (`preySeat() !== actorSeat`) — a 2-live-player table collapses predator/prey onto one seat, which the rulebook forbids bleeding/bouncing onto ("you can never bleed yourself"); `interceptPotential()` made ledger-aware to match `_commitBlock`'s enforcement. **v0.4.2:** combat tally a/b zeroed, wake sleeper-guard, bounce idx re-anchor by name + unlocked-minion req, ousted abstain-quiet. **v0.4.3 (audit):** blocker LOCKS entering combat (rulebook), capability-aware `_pickBlocker()` (decision/execution agreement). WIRE_V 2.6.0; BOT_VERSION its own. |
| `elysium-bot-arena.js` | **v1.0.0** (12 July 2026) — the authoring pipeline's EVALUATE rung: headless match runner (`runArena()` module + CLI), bot-hosted rooms, persona rotation per match, last-standing play with backstops, per-persona wins/damage/decisions, JSONL traces (decide-why, dealt hands, results) + summary.json. Gated in the bot suite §12; diagnosed its first bot bug (ghost-prey drag) on day one via its own traces. |
| `elysium-bot-table.js` | **v1.0.0** (12 July 2026) — seats a whole TABLE of Trainbots in one command: persona rotation (`--personas shark,grinder,novice`), optional names, staggered joins, one process, SIGINT cleanup, max 4. Smoke-proven: the bot-vs-bot pending loop closes end-to-end (arena prerequisite). |
| `START-HERE-BOTS.html` | Player-facing bot guide (mirrors the START-HERE aesthetic): quick start, the launcher, the persona table, the supported table config, chat grammar + say phrases, humans+bots networking (tunnel wss for humans, ws-only for bots), not-yet list, and the stage's live-test checklist 1–12. |
| `test-bot-logic.js` | Trainbot end-to-end gate (**17 asserts**): spawns the REAL `elysium-server.js` on a random port with a tmp cwd, drives a scripted host client + a Bot instance over loopback WebSocket through lobby→seats→decks→start→two bot turns (block contract, torpor, pass-guard)→damage grammar→oust/bounty routing. Run-gate family. |
| `cardfx-compile.js` | **The card-effect library compiler v1.1.0** (v3/v5 dual-format via `normalizeCard()`, mirroring the client's parser) (12 July 2026, bot track) — zero-dep; compiles KRCG’s vtes.json (+ the curated overlay) into `elysium-cardfx.json`: per-card effect tags (fx), discipline-level modes with “As above” resolution, type-bracket faces, crypt caps/titles/votes, and a plain-name alias map with a deterministic collision ladder (non-ADV → newest group). Facts only — policy stays in playbooks. |
| `cardfx-curated.json` | The HAND tier: whole-entry overlays verified against printed card_text (src:’hand’). Curation queue: shipped-playbook cards → TWDA staples → proven auto mistags. |
| `elysium-cardfx.json` | The compiled artifact (fxv 1) — 2364 lib / 1785 crypt / 2422 aliases, 62% auto-fx, one entry per line for diffable regenerations. Consumed by bots for threat reads, own-hand fx and influence math. |
| `test-cardfx.js` | The cardfx gate (**39 asserts**, run-gate family; incl. the v5-format fixture section: known-card extraction semantics (level split, As-above inherit+override, type brackets, directed-vs-self-cost pool damage), alias ladder, curated precedence, determinism, and a shipped-artifact drift guard. |
| `elysium-cardfx-design.md` | Schema (fxv 1) + the three quality tiers + consumer contracts + extraction pipeline + honest limits + the TWDA curation roadmap. Read FIRST for any cardfx work. |
| `HOST-GUIDE-ADDENDUM.md` | Two Host Guide sections (Mac/Linux hosting; Bring your own server). **Merged 2 July 2026** into `Elysium - Host Guide.docx` (now v1.7) - see the file table above and the journal entry of the same date for how, since `build-docs-en.js` wasn't available this session. |
| `test-2a/2b/2c/2d/2e/2f/2g.js`, `test-autosave.js`, `test-crypto.js`, `test-helper-policy.js` | The server + crypto test suites. |
| `test-client-logic.js` | The **client** logic suite (Phases 0–1). Loads the real client functions in Node under a DOM stub and asserts serialize<->restore, the `pubXform`/`pubInv` inverse, `buildPub` hand-secrecy, `restoreGame` defensiveness, `baseView`, the debug ring buffer, the `mpOnMsg` handler-map routing, and the hotseat-log `keepLog` guard, plus the state-contract depth (single-zone `move` invariant, attachment round-trip, id/position survival, `buildPub` purity). Run: `node test-client-logic.js` (16 assertions) + `node test-server-dispatch.js` (5: the server `handle()`/`GAME_HANDLERS` routing plus per-room/per-IP password-fail throttling, via `loadServer`). Both suites were re-synced at v2.5.35 to the post-cross-board handler counts (MP_HANDLERS 42, GAME_HANDLERS 48) — the project copies had gone stale at 39/45 and masked/invented deviations (the journal's old “15/16”). |
| `elysium-test-harness.js` | Shared zero-dep stub-loader the client suite requires — the one place the Proxy DOM stub lives. Also serves as the load smoke-check (catches runtime ReferenceErrors the syntax check misses). |

## Working environment & hard constraints

The development sandbox is **not** a browser and **not** a live network:

- **It cannot render HTML or run the server / multiplayer.** So everything visual or runtime - animations, layout, the views, turn flow, the hidden hand, hotseat switching, every online path - is **unverified by the assistant**. Johan tests these live. Always say so.
- **bash networking is usually disabled** (egress off; loopback uncertain). Don't assume you can install npm packages, and don't run the WebSocket test suites blind expecting them to connect.
- **Node is available**, and the **`docx` npm lib is installed** (so the doc generators run).
- Files the assistant creates are only visible to Johan after `cp` to `/mnt/user-data/outputs/` **and** a `present_files` call.

## How to verify a change (without rendering)

These are the reliable gates in the sandbox:

- **Client JS syntax:** `sed -n '/<script>/,/<\/script>/p' elysium-vtes-bord.html | sed '1d;$d' | node --check -` (expect no output = clean).
- **Client logic suite:** `node test-client-logic.js` -> expect `16 passed, 0 failed`. Drives the *real* serialize/restore/buildPub/pubXform/baseView/dbg functions through a DOM stub (`elysium-test-harness.js`), so it guards the module extraction — it catches logic regressions the syntax check can't, and also serves as the load smoke-check (catches runtime ReferenceErrors).
- **Server JS syntax:** `node --check elysium-server.js`.
- **Protocol-doc lint (v2):** `node test-protocol-doc.js` -> expect `6 passed` (verb/message indexes AND per-verb field lists vs the live handler tables, both directions - run it after ANY handler-table change).
- **Snapshot drift check:** `node check-versions.js [dir]` -> expect `everything agrees` (versions across code/docs/suites + the tool-trio presence; point it at the project snapshot at session start).
- **Server dispatch suite:** `node test-server-dispatch.js` -> expect `5 passed` (the `handle()`/`GAME_HANDLERS` routing plus the v2.5.0 per-room/per-IP password-fail throttle tests).
- **Fragment build round-trip (B1):** `cp elysium-vtes-bord.html /tmp/original.html && python3 split_client.py && node elysium-build.js /tmp/rebuilt.html && cmp /tmp/original.html /tmp/rebuilt.html` -> byte-identical proves the splitter anchors still match the monolith. Re-anchored at v2.5.0: `net.js` now ends at the hotseat block (12 fragments, was 13).
- **Server test suites (network permitting):** run `node elysium-server.js 89XX` in the background, then `node test-2a.js 89XX` (2b/2e/2f/2g likewise); `node test-crypto.js` is standalone. Delete `elysium-rooms.json` *and* `elysium-saves.json` between runs (2a's lockout test poisons the localhost IP). ~195 assertions total. Often not runnable here - don't claim a green run you didn't do.

## Skills & tools needed

- **docx skill** (`/mnt/skills/public/docx/SKILL.md`) - read it before regenerating or editing the Word docs. The generators already follow its patterns (explicit page size, `LevelFormat.BULLET` rather than unicode bullets, dual table widths, no `\n` inside runs).
- No special skill is needed for the client/server - they're vanilla JS. The `frontend-design` skill only matters for genuinely new standalone UI, which Elysium is not.

## Safe editing workflow (one huge file)

The client is a single ~6,600-line file, so edits must be precise:

- **Atomic multi-edit batches:** write a Python heredoc that first does `assert s.count(find)==n` for **all** edits, then applies **all** the replaces, then writes. If any anchor is wrong, nothing is written and you see exactly which one.
- **Unique, plain-ASCII anchors:** line numbers shift after every edit, so re-grep; make find-strings unique; and choose anchors **without** smart quotes, em-dashes or arrows, since matching those exactly is error-prone. Put the fancy characters only in the *replacement*.
- **The unicode/emoji escape trap (this has bitten twice):** inside a `<< 'PYEOF'` heredoc, write `\uXXXX` / `\U0001XXXX` with a **single** backslash to *produce* the character; a double backslash produces the literal text `\uXXXX` in the file.
- **Always** `cp` the regenerated/edited deliverable to `/mnt/user-data/outputs/` and call `present_files` - and double-check you copied the freshly built version, not a stale one.

## Architecture in brief

- **One file per side**, both dependency-free. The client is authoritative for your own board; the server is authoritative for hidden piles (library/crypt) and, online, for victory points. **Johan's stated line (7 July 2026): the server file stays about SERVER concerns; only the *necessary* anti-cheat lives there.** In practice every server-side anti-cheat piece is *observation* or *gating* — sanitisation, who-may-when guards, the pub-diff ledger, a prefix mark — never rules knowledge: the server still cannot spell "bleed", and the whole v2.5.64–67 suite cost 116 net lines. The rules engine stays ruled out (anticheat draft §6); when a future idea needs the server to KNOW the game, that is the signal it belongs client-side or nowhere.
- **`serializeGame()` / `restoreGame()`** capture and restore a whole board as a JSON blob; **`buildPub()`** produces the public (opponent-visible) view. **Save format = wire format** - the same public representation is the autosave and the network payload. This dual purpose is deliberate; preserve its forward-compatibility.
- **Hotseat = the same model, locally.** `net.hot.boards[seat]` holds each seat's `serializeGame()` blob (a **JSON string**, not an object); the active player `net.you` is switchable (PRIORITY bar / Table dock); non-active seats render from a locally-built `buildPub()` stored at `net.boards[seat].pub`. The roster, the shared Round/Turn counter and the *cross-board* aim (`net.rtarget`) live on `net` (never swapped); the *local* aim (`state.target` — the play-FX target arrow + the log's ` Target:` suffix) is per-seat and travels inside each seat's `serializeGame` blob (added v2.5.3; it was previously omitted, so it was wiped on every hand-off). The seam: view/turn behaviour gates on **`tableView()`** (true in both modes); networking keys off **`inRoom()`** only where a real socket is involved.
- **L3 "helicopter" view has two coordinate worlds.** Opponent furniture (mats, centre timer, table) lives inside `#l3stage`, which carries `translate(pan) scale(Z)` and so pans/zooms as one rigid unit. Your own live board (`#z-ready`, `#poolWrap`, `#edge`, your cards, the Edge token) stays on `#board` and is hand-positioned by `setCenterFrameA`, folding the same transform in manually (`Px+Z*coord` for position **and** `scale(Z)` for size). `l2pub` already contains `Z` (`l2pub.s = baseS*Z`), so anything routed through `pubXform`/`pubInv` is automatically correct under zoom — don't re-multiply. See learnings for the full set of L3 rules.
- **Tokens are a family beside the card system.** Non-card objects must never enter `state.cards`/`state.zones` (it breaks the card pipeline). The Edge lives in a separate `tokens` Map with `TOKEN_DEFS` (registry: `label/size/svg/menu` per type) and a generic engine (`makeToken`/`placeToken`/`bindTokenDrag`/`removeToken`) that *reuses* `pubXform`/`cardTransform` for placement but skips zone/`move()` logic. `buildPub()` exports `tokens:[{type,x,y}]` and `buildMat()` draws them so a token shows on its controller's mat in every view. A new token type = one `TOKEN_DEFS` entry.
- **Online flow:** a board change builds `buildPub()` (debounced) -> the server sanitises -> broadcast as `board`; hidden ops (draw / browse / reveal / take) are owner-exclusive verbs; the hand never leaves the client except as an **encrypted escrow blob** (key derived via PBKDF2 from the room password + a public salt; the server stores and routes it but cannot read it).
- **Helpers** (toggleable conveniences): a phase-structure assistant, the **oust helper** (`conv.poolToPredator`, on by default) that awards the ousted player's predator +6 pool and +1 VP, and the **path blood helper** (`hx('pathBlood')`, default off) that burns 1 blood when a Sabbat vampire follows a Path (Influence phase only).
- **Board Mode** (`net.boardMode`): an exclusive choice made at game start — **Classic** (`'classic'`, default: L4 free-form open table, Lackey-style) or **Structured** (`'structured'`: L2 columns + L3 helicopter, guided zones). The mode is set in the lobby (online) or hotseat-setup, stored on the server room, and relayed to all clients. `freeBoard()` gates Classic-specific behaviour; `baseView()` returns `'l4'` in Classic, `'l2'` in Structured; `levelOrder()` returns `['l4']` (single view, no stepping) or `['l2','ov']`. Classic + Tournament Mode = a clean Lackey-like experience (both are default on first run). Online: pool globe positions are exported in `buildPub()` as `{type:'pool', x, y}` in the tokens array; opponent globes are updated via `updateL4Opponents()` in the `board` handler; opponent cards are rendered via `renderL4OppCards()` using `addRCard` into `#l4oppWrap`.
- **L0 idle board.** A clean felt surface with no game UI. `#board.l0mode` fills `#tableArea` via `position:absolute; inset:0; width:auto; height:auto; transform:none !important` (like L3/L4). All direct children except `#empty` and `#toast` hidden via `display:none !important`; `#empty`'s background set to `none` so the board's felt pattern (repeating-linear-gradients) shows through; `#l1zoomWrap` hidden via `:has()`. `enterL0()` strips L2/L3/L4/l2cols classes, adds `l0mode`, clears inline transform. Entered at startup, after Reset table, after leaving an online room with a game, after leaving hotseat. Exited in `enterL2/L3/L4`, `buildDeck` (solo), `startHotseat`, Resume click. Not part of the Tab step-cycle — lives outside the game loop.
- **L4 element scaling**: `const L4_CARD_S=0.5, L4_TOKEN_S=0.7` — cards at 50%, tokens/globes at 70% of native size. Applied in `place()`, `placeToken()`, `placeL4Globe()`, `regrabAtScale`, drag-move `sc`, group drag `ms`, ghost elements, and drop-offset calculations. One line to change both values.
- **L4 interaction model**: single-click+drag = marquee/lasso selection (works everywhere on the board); double-click+hold = pan. Dock stays open during card drag (hover-logic manages open/close based on position). Pool globe: +/- buttons on hover, scroll-wheel for pool, Ctrl/Shift+click on the globe itself (v2.5.90), grab-drag to reposition. Opponent globes are read-only (no buttons, default cursor, no click). **Touch (v2.5.39 T0+T1):** long-press 450 ms = the same context menu everywhere (a document-level engine dispatches a real `contextmenu`, so all 18 existing listeners run unchanged); drag thresholds are 10 px for `pointerType==='touch'` (5 px mouse); one gesture at a time (`isPrimary` + a `drag||tdrag||pileDrag||mq||giveDrag` guard at every gesture start); pool +/- always visible on coarse pointers. **T2 (v2.5.40):** counters/pool on touch - `bindHold` (press=1, hold 400ms=repeat@90ms, overlay-guarded because `bumpCounter` can await the influence confirm) replaces the pool +/- click handlers; `buildCtStepper(c)`/`openCtStepper` is the badge-tap popover AND an embedded top row in `cardMenu` (new `it.el` item type in `renderItems`, no auto-close) - same `bumpCounter`/`bumpPool` calls, so undo/log coalescing is wheel-identical. Badge taps route through `tap()` via `drag.badgeKind` (returns before `lastTap`). **T3 (v2.5.41):** pinch-to-zoom + two-finger pan (document-capture tracker, touch, L3+L4 - zooms about the fingers via `l3zoomTo(z0*dist/d0, mid)`, owns its two pointers with capture `stopPropagation`, tears down singles on activation: direct-null for `drag`/`tdrag`/`mq` + a REAL per-pid `pointercancel` for the felt-pan mirror and pile-drag cleanups); one-finger felt pan on touch in L4 (mouse keeps dbl-click+hold); D1a: a one-shot "\u2b1a Select area (drag)" say-menu row (`_mqArm`, `noUndo` leaf type) since touch drag now pans; D2: the `#l2dockClose` chip (a static child of `#l2dockbg` at top:-15px, riding its dynamic hugging height) + ANY felt touch closes the open dock; T3d: `ctrlKey` wheel (precision-touchpad pinch) zooms proportionally (`Math.exp(-dY*0.0022)`). **T4+T5 (v2.5.42) - roadmap complete:** touch tap/double-tap draws on the piles per `conv.drawClick` (the deferred v1.35 caveat fixed; a `_tapDrawAt` 500 ms yield guards the four native click/dblclick listeners against synthesized double-draws); `bindDbl(el,fn)` gives all 7 browse dblclick sites an iPad-reliable pointerup double-tap (long holds never arm; an Android-synthesized native dblclick duplicate is eaten once via `_dtAte` + a capture suppressor); D3: tapping a stack BASE toggles the fan on touch (children stay pickable, the 380 ms guard keeps double-tap-lock from flapping it); `pinHover(c)` = the 🔍 Inspect cardMenu row (touchui, hidden for face-down per the v1.6 no-data-card-name rule) pinning #hoverCard until the next pointerdown; cardTip is quiet after touch input (`window._lastPT`); dvh + safe-area body padding + the D4 Add-to-Home-Screen metas; and the parked #edge coarse sizing folded INTO the JS placement (`-16*_ek` keeps the centre anchored under the 0,0-origin scale). See `elysium-touch-plan.md` Rev 5.

## Conventions

- **Communication is in Swedish; the app UI and all docs are in English.**
- Dark Pack compliant (unofficial, non-commercial fan project; attribution in About and the docs).
- Client `VERSION` (currently `2.2`) is stamped into saves and the online handshake (`v:VERSION` on join). Server `VERSION` is **`1.9`** and **decoupled** from the client number - the server compares the client's `v` against its own and only emits a *warning* sys-message on mismatch (no hard check on file load). Online is rarely tested (hotseat is primary), so a client↔server gap is tolerated. Client-only changes (CSS/JS) do **not** require a server bump; bump the server when the wire protocol changes (the Edge token added `edgePass`/`edgeTake` verbs) or when server behaviour changes — 1.9 fixed `HELPER_KEYS` so locked tables relay `hand`/`handReminder`; no new verb, but a behaviour change worth the bump.

## VTES glossary (the domain in one screen)

The terms that show up in Elysium's UI and mechanics:

- **Methuselah** - a player (the elder vampire you play as).
- **Pool** - your life total; reaching 0 means you are ousted.
- **Crypt** - your stack of vampires (you draw minions from it). **Library** - your deck of everything else.
- **Minion** - a vampire or ally in play under your control (the crypt cards in the ready region).
- **Uncontrolled** - crypt cards drawn but not yet in play (face down); you spend pool to **influence** them in.
- **Bleed** - the core attack: reduce your prey's pool.
- **Prey** - the player you bleed (next in turn order). **Predator** - the player who bleeds you (previous in turn order). Seating *is* the turn order.
- **Ousted** - eliminated (pool hits 0); your predator collects the bounty (+6 pool, +1 VP).
- **The Edge** - a single contestable token at the table; holding it adds to bleeds and fuels some effects.
- **Torpor** - incapacitated vampires (not destroyed - they can come back).
- **Victory Point (VP)** - the win condition; earned by ousting a Methuselah (+1) or at game end.
- **Phases** - a turn runs Unlock -> Master -> Minion -> Influence -> Discard (the F1-F5 phase bar mirrors this).
- **Card types** - Master, Action, Reaction, Combat, Equipment, Ally, Political (vote/referendum), plus action modifiers.

For anything deeper - exact timing, edge-case rulings, how a specific mechanic resolves - check the **official rulebook at vekn.net/rulebook** (the same link Elysium ships in-app, under About/help). When a game function is unclear, look it up there rather than guessing. Card data and rules text come from KRCG (static.krcg.org).

## Key functions & globals (navigating the client)

The architecturally important entry points in the one ~10,000-line `elysium-vtes-bord.html`:

**State & serialization**
- `serializeGame()` / `restoreGame(blob, opts)` - capture / restore a whole board as a JSON blob (this is the save = wire format).
- `buildPub()` - the public, opponent-visible view of your board (the network + overview payload).
- `makeCard()`, `move(card, zone, opts)`, `place(...)`, `layout()` - create a card, move it between zones, position it, re-lay the board. Cards sit on a composite `transform`, so animations use the separate `rotate` property.
- `animCard(card, type)` - the rise / flip entrance animations.

**Mode & turn**
- `tableView()` - true in hotseat *and* online (gates view/turn behaviour). `inRoom()` - true only in a real online room. `netGame()` - an online game is in progress.
- `pass()` - end the turn (bell + advance the turn; in hotseat it also hands control to the next seat).
- `advanceTurnCounter(seat, opts)` / `turnLabel()` - the shared Round/Turn counter.
- `ousted()` - the oust sweep; plus `awardBountyHot()` (hotseat predator bounty), `unoustHot()`, `adjustHotVp(seat, d)` (hotseat manual VP).

**Hotseat**
- `startHotseat(players, boardMode)` - start local pass-and-play; `setActivePlayer(seat, opts)` - switch the controlling player; `updateHotHud()` - the PRIORITY bar; `mySeat()` - the active seat. Per-seat state lives in `net.hot.boards[seat]`; the roster + counter live on `net`.

**Board mode & views**
- `freeBoard()` - true when `net.boardMode==='classic'` (the L4 free board). `l4on()` - true when `board.classList.contains('l4mode')`.
- `convertCardKind(c, toCrypt)` - converts a library card to crypt kind (vampire) or reverts. Sets `c.kind`, `c.converted`, updates CSS classes + back image + clan detection. Persisted in snapshot, serializeGame, and buildPub.
- `groupAlign(base)` - aligns selected cards side by side, anchored from `base`. Hotkey `A`. Spacing: `CW*L4_CARD_S` in L4, `CW` in other views (zero gap).
- `renderL4OppCards()` - renders opponent cards on the L4 board surface via `addRCard` into `#l4oppWrap`. Called from `updateL4Opponents()` and `layout()`.
- **Path of Enlightenment (planned):** V5 Sabbat vampires can choose one of 4 paths (Caine, Cathari, Death, Power). KRCG PR #830 adds `Card.path` to vtes.json (OPEN, not merged). Elysium design: `c.path` property, right-click "Choose Path →" submenu on Sabbat crypt cards, auto-detection (`detectPath()`/`activePath()`), path-icon on pool globe (priority: path > clan when path has more vampires; tie → clan wins), path badge on card face. Full spec in session journal "Planerad feature: Path of Enlightenment".
- `baseView()` - `'l4'` in Classic, `'l2'` in Structured. `levelOrder()` - `['l4']` or `['l2','ov']`. `cycleView()` is a no-op in Classic (single view).
- `enterL4()` / `exitL4()` - lifecycle for L4. `renderL4()` - sets up the board surface (stage + table + centre timer), `l3myslot` to full felt area, `l2pub` via `setCenterFrameA`. L4 piggybacks on L3 infrastructure (`l3mode` + `l4mode` on board): zoom/pan, dock panel, hand-hover, scroll-to-zoom, drag-to-pan all reuse `l3on()===true` paths. Zone boxes hidden via CSS (`#board.l4mode` rules: transparent borders, hidden labels/poolWrap).
- **L4 pool globes** (`l4Globes` Map): per-player draggable pool displays on the free board. `createL4Globe(seat, name, pool, mine)` builds a `.l4globe` element (Cinzel label + 64px red globe with pool numeral). YOUR globe: drag + scroll-wheel (`bumpPool`) + right-click (`selfPoolMenuItems`). Opponent globes: right-click (`oppPoolMenuItems`), read-only display. `renderL4Globes()` creates them in a circle around centre; `layoutL4Globes()` re-places on zoom/pan (called by `layout()`); `updateL4GlobePool(seat, pool)` refreshes the numeral.

**Views**
- `renderStats()` + `statRow()` + `renderOtherBoards()` - the Table dock (per-player stats + the "on other boards" overview). `renderOval()`, `renderFull()`, `addRCard()` - the oval and visit views.

**L3 "helicopter" overview** (the coordinate model is in Architecture + learnings)
- `renderL3()` - rebuilds the bird's-eye: `#l3stage` (transformed wrapper holding opponent `.mat`s + `#l3timer` + `#l3table`), then `setCenterFrameA(myslot)` for your own live board. `l3slots(N, me, seats)` returns the per-player-count geometry (2p/3p two-band, even 4+ grid, odd 5+ pentagon) — **every branch returns `clockCy`** (centre-clock Y, used to anchor the Edge button).
- **L3 gap constants** (shared across all branches): `mX=0.5%` (table-edge horizontal), `mY=0.5%` (table-edge vertical), `gx=0.8%` (column gap), `cb=max(36, 6%)` (clock band / inter-row gap), `clockW=max(90, 7%)` (3-band clock width). `PAD=2` inside each slot (zone borders sit ~1px from the slot edge; L2/L4 keep PAD=12).
- **5-player pentagon layout** (the `threeBand` branch, also used for 7p): Allies centred across the top band, prey at left edge, predator at right edge, you centred at bottom. Key tuning parameters:
  - `Bw = min(wlimMid, wlimTop, Bw3 + 50)` — Bw3 is the base 3-band vertical limit; +50px expansion fills the vertical gaps between bands. Capped by horizontal limits.
  - `yM = yT + Bh + bandGap + 15` — prey/pred shifted 15px below their even-distribution position (pentagonal bias downward toward your board for closer predator/prey readability).
  - `dockShift = Bh*0.02 + 16` — your bottom board lifted to avoid dock overlap.
  - `clockCy = cy` — timer and Edge button anchored at the table's vertical centre, **decoupled** from prey/pred vertical position. This means moving prey/pred does not drag the Edge button.
  - `wlimMid = (A.aw - 2*mX) / 2` — no reserved `clockW`; prey/pred just must not overlap. The clock sits in whatever space remains (`gapMid`).
- `setCenterFrameA(fx,fy,fw,fh)` - folds your board into its slot: zones + pool + Edge button via `Px+Z*coord` (+`scale(Z)` for the button). `applyL3Transform()` - the light pan/zoom update (no mat rebuild): re-applies the stage transform, re-runs `setCenterFrameA`, re-places the Edge token. `clearL3()` / `enterL3()` / `exitL3()` - lifecycle (clearL3 resets inline styles incl. the pool globe's L3 sizing and the `l2pool` class).
- `pubXform(x,y)` / `pubInv(x,y)` - canonical↔display (exact inverses; `l2pub.s` includes Z). `pubCanon(zone)` - canonical rect per zone (supports `ready/uncontrolled/torpor/pool`). `pubBox()` = `l2geo('box',1004,616)` (the shared canonical box all boards map into).
- `opponentSurfaceAt(cx,cy)` / `readyZoneAt(cx,cy)` - geometric hit-test for which opponent board / Ready zone is under the cursor (rect comparison, robust across stacking contexts; used by card-give and the Edge token).

**Tokens (the Edge, and future tokens)**
- `TOKEN_DEFS` - registry (`edge` only so far): `label/size/svg(sz)/menu(tok)`. `makeToken/placeToken/bindTokenDrag/removeToken/layoutTokens` - the generic engine (token lives on `#board`, placed via `pubXform`+`cardTransform`, drag reuses `bindCard`'s `f`/`ox/oy` math but skips zone logic).
- `ensureEdgeToken()` - creates/repositions the Edge token (default: lower-right of Ready). `toggleEdge()` - the button: take→`edgeTakeover()` (authoritative, clears the Edge everywhere + re-seats), release→clear local. `edgeHandoffHotseat(toSeat, dropPos)` - hotseat handoff (writes edge+pos into the target's stored JSON + pub). Online uses the `edgePass` (drag handoff) and `edgeTake` (button takeover) verbs.

**Online**
- `mpSend({t:'...'})` - send a verb to the server. The full protocol (verbs in / messages out) is catalogued in the Technical Documentation.

**Decks**
- `parseDeck()` / `buildDeck()` - parse a Lackey/TWD list and lay out the deck.

**Settings**
- `conv` - the conveniences object (`conv.poolToPredator` = oust helper, on by default; `conv.anim`, `conv.pco`, ...). Persisted via `saveConv()` / `loadConv()`.

**Played cards & left panel (v1.6 / v1.7)**
- `collectPlayed()` / `snapshotPlayed()` / `renderPlayed()` - the Played-cards tab: collect the loose-in-play library cards **not** in the baseline (mine from `state.zones.ready`, each opponent from `net.boards[seat].pub`); re-baseline the display; render the tab badge + overlay. `avBaseline` is a persistent set of **card ids** (ID-only keys survive hotseat take-control); re-baselined on phase change / game start / manual Clear, *not* on view open/close. **`tagPlayed(c)`** is the universal play-to-ready hook that also refreshes the tab (this is what keeps the count consistent across every play path).
- `avRenderCard(host, c, scale, colHex, interactive, hoverName)` - **returns the `.avc` wrapper element** (used in v1.7 to attach per-card listeners). Renders a tray/overlay card with an owner-colour outline + hover preview; stamps `data-card-name` for the Ctrl-hover lupp (face-down omitted, so nothing leaks). `showHoverFor(el, x, y)` is **name-based** (reads `data-card-name`), so it inspects board `.card`s and `.avc` tray cards alike.
- `cycleView()` - the `§` key: toggles Helicopter (`'ov'`) and the home view (`baseView()`). `sanRemote(html)` - sanitises relayed log HTML while preserving the `clog` card-links.
- Left panel: `cardFallbackHTML(name)` (in-frame fallback on image error), `#helpToggle` / `#helpOverlay` (the `?` overlay), and the log-peek helpers `fillLogPeek()` / `syncLogPeek()`.
- **Per-card interactions in `#playedRow` (v1.7):** left-click calls `selectOnly(c)` + `layout()` + `renderPlayed()` (own cards only; opponent cards ignored silently). Right-click opens `showMenu()` with **Clear this card** (`avBaseline.add(c.id)` — removes from display, card stays on board; works for all cards) and **Discard this card** (own cards only: `pushUndo()` + `move(live,'ash',{})` with live zone re-check). "Clear" button renamed **"Clear all"** to distinguish from per-card clear.
- **Tab centering (v1.7):** `--aside-w` CSS variable (268px open, 0px when `body.aside-collapsed`) drives `--tab-mid: calc(var(--aside-w)/2 + 50%)`. All four elements (`#playedTab`, `#playedOverlay`, `#readyTab`, `#readyPeek`) use `left: var(--tab-mid)` so they stay centred over the visible board area regardless of panel state.
- **Overflow behaviour (confirmed, no fix needed):** `#playedRow` and `#readyRow` both use `flex-wrap:wrap`; their parent overlays have `max-height` + `overflow:auto`. Many cards wrap to additional rows and the overlay scrolls.


## conv — local settings reference (v2.5.2)

`conv` is the local conveniences object, persisted via `saveConv()` / `loadConv()` (key `elysium.convenience` in localStorage). All fields are local-only unless noted.

| Field | Type | Default | What it does |
|-------|------|---------|--------------|
| `cardDB` | bool | false | Load KRCG vtes.json (minion detection, deck lab catalog, card text) |
| `poolToPredator` | bool | true | Auto-award 6 pool oust bounty to predator |
| `autoLock` | bool | true | Auto-lock acting card on action |
| `anim` | string | `'on'` | Clone animations: `'on'`/`'mine'`/`'all'` |
| `animSpeed` | number | 1.0 | Animation duration scale (0.5–2.0, ±10% steps). Applied as inline `style.animationDuration` on `.cfx` wrap + `.cfximg` children. `_swapAt` (flip midpoint) also scaled. No-op at 1.0. |
| `drawClick` | string | `'double'` | `'single'` = click draws; `'double'` = dblclick draws. Ctrl+click undo always on click. |
| `pco` | string | `'on'` | Player-colour outlines: `'on'`/`'home'`/`'mine'`/`'all'` |
| `pcoNeutral` | bool | false | Hide neutral selection/target rings |
| `qrView` | bool | true | Use Quick React strip (vs. classic Alt tray) |
| `l3shape` | string | `'square'` | L3 table shape: `'circle'`/`'square'` |
| `l3collapseOusted` | bool | false | Collapse ousted player columns in L3 |
| `cardTip` | bool | true | Instant card-name tooltip on hover |
| `defaultView` | string | `'normal'` | Home view: `'normal'`/`'simplified'` |
| `sfxVol` | number | 0 | Master SFX volume (0 = muted, 1–100) |
| `sfxIndiv` | object | `{unlock:150,...}` | Per-sound volume overrides (percentage) |
| `tournament` | bool | true | Tournament mode (forces helpers off, restricts convenience features) |
| `edgeToken` | bool | true | Show the Edge token on the board |
| `poolPlayerColor` | bool | false | Tint pool globes with each player's seat colour (all views) |
| `hoverPreview` | string | `'key'` | Card preview on hover: `'key'` (hold key), `'always'`, `'off'` |
| `imgFmt` | string | `'webp'` | Card image format: `'webp'`/`'jpg'` |
| `imgCache` | bool | false | Cache card images in IndexedDB for offline use |
| `jsonSync` | bool | true | Auto-sync vtes.json from KRCG on load |
| `imgSync` | bool | false | Auto-download missing card images on load |
| `showWelcome` | bool | true | Show the welcome dialog on startup |
| `debug` | bool | false | Enable live `console.warn` output on every `dbg()` call |
| `tutDone` | array | `[]` | Tutorial section ids completed (e.g. `['introduction','decklab']`); drives the picker checkmarks, the Reset-progress link, and the first-run pulse on the welcome Tutorial button |
| `playedSort` | string | `'new'` | Played-tab ordering: `'new'` newest-first / `'action'` live action-status grouping (v2.5.19) |
| `shiftPeek` | bool | `false` | Opt-in: hold Shift to peek the log while the panel is collapsed (v2.5.30; off so it never clashes with Shift+click token adjust) |
| `touchUI` | string | `'auto'` | Touch presentation mode (v2.5.39 T0): `'auto'` follows `pointer:coarse`/`maxTouchPoints`, `'on'`/`'off'` force. Drives `body.touchui` via `touchUI()`/`applyTouchUI()` - PRESENTATION only; gesture BEHAVIOUR always gates per event on `e.pointerType==='touch'` (hybrid laptops correct without a mode switch) |

`openSettings()` syncs all values to the UI on open. Each setting has a corresponding `addEventListener` that calls `saveConv()` on change.

## Card object fields — owner and controller

Each card object (`state.cards.get(id)`) carries:
- **`c.owner`** — whose deck it came from. Drives oust logic: cards you own but someone else controls stay on their board; cards others own in your zones go to their ash heap. Set at import/deal; correctable via *Set owner* in the right-click menu.
- **`c.controller`** — who controls the card right now. Changed by in-game effects via *Give control*. Separate from owner.
- **`c.path`** — path of enlightenment (V5 Sabbat), e.g. `'Path of Caine'`. Null for vampires without a chosen path. Set via the right-click "Follow Path" menu or from KRCG data (when PR #830 merges). Serialized everywhere (snapshot, save, pub, hand escrow).
- **`c.noPath`** — boolean. True when the player chose "No path" to hide the Follow Path menu item for this card. Only relevant without KRCG data (where the menu shows on all vampires). Serialized alongside `path`.
- Both are runtime fields on the card object. Saved in autosave snapshots as part of the board state. **Do not affect the deck library.**

## KRCG discipline format — two formats in the wild

`card.disciplines` in vtes.json is an array that may contain **either** trigrams (`["dom", "aus"]`) for older disciplines **or** full names (`["oblivion"]`) for newer ones (Oblivion confirmed; others may follow the same pattern). `DISC_NAMES` maps trigram→fullname; `DISC_ABBR` (added v1.9) is the reverse, fullname→trigram. `cardTags(c)` adds both forms for every discipline word so that `obl:`, `oblivion:`, `dom:`, `dominate:` etc. all work as filters.

## startHotseat — board-building sequence

```
players.forEach((p,i)=>{
  if(p.boardJson) restoreGame(...)           // resumed save — no redeal
  else if(p.deckText) { buildDeck(parseDeck(p.deckText)); dealOpeningSync(); }  // fresh deck → auto deal
  else clearTable(...)                       // no deck
  net.hot.boards[seat] = serializeGame();    // snapshot includes the dealt hand
  net.boards[seat] = { who, pub: buildPub(), ts }
})
restoreGame(net.hot.boards[1], ...)          // activate seat 1
```

`dealOpeningSync()` is the synchronous counterpart to `dealOpening()` (which uses setTimeout for animation effect in solo play). Draws 7 library cards to hand + 4 crypt cards to uncontrolled.

Online start: server calls `dealNow(q)` per player on `start`, client receives `dealt` message.

## v1.5 - the table views, made interactive (18 June 2026)

The biggest shift since v1.4. The old oval overview (`renderOval`/`renderFull`) is superseded; the three views are now:

- **Simplified** (`net.view === null`) - your own board, full size, fully interactive (the former "level 1").
- **Normal** (`'l2'`) - your live board in the centre with prey / predator as upright columns either side. Built by `enterL2()` / `renderL2()`.
- **Helicopter** (`'ov'`) - the whole table as a round table, or a Lackey-style square (`conv.l3shape`), everyone upright, you at the bottom. Built by `enterL3()` / `renderL3()`; opponent mats via `buildMat` / `addRCard`. (A single-board *visit* is still `net.view === <seat number>`.)

Key additions:

- **`switchView(target)`** is the one entry point (null / seat / `'l2'` / `'ov'`); **`baseView()`** returns the home view (`'l2'` — always Normal since v1.99.27), and **`goHome()` = `switchView(baseView())`** is wired to every "go home" path (Home/0, Esc, your own seat, Tab-home, hotseat active-player switch, rvBack). Games now *open* in `baseView()` (hotseat at start; online on 'started'/'took').
- **`conv.defaultView`** (`'normal'` | `'simplified'`, default normal) - the local home-view setting (Settings -> Default table view).
- **Cross-table play in any view** - `opponentSurfaceAt(cx,cy)` geometrically hit-tests the opponent board (`.l2pane2[data-seat]` / `.mat[data-seat]`) under the cursor; `giveTo(seat, surfaceEl, targetEl, x, y, c)` is the one give. Online it goes via the server (`mpSend({t:'give'})` -> `given`/`gave` echoes); **hotseat has no server, so `giveHot(...)` injects the card into the target seat's stored board + its public snapshot and removes it from your hand**. The Reaction strip drags through `qrDragGive` (drop on an opponent -> give, on your board -> play, back on the strip -> cancel).
- **Host-locked table view** - the create dialog has a Table view picker; the host's Normal/Simplified choice locks the view for everyone. Mirrors the reaction-timer pattern exactly: the **server** stores `room.tableView` and forwards it in the join/state, `lobby`-join and `started` messages; the **client** sends it in `create` and reads it into `net.tableViewLock` (which `baseView()` already honours).

> v1.5 is **confirmed live**. See v1.6 below.

## v1.6 - Played cards, the left-panel pass, and cross-table polish (20 June 2026)

Confirmed live by Johan. Five threads on top of v1.5:

- **Played-cards tab + overlay (new).** A window-fixed tab pinned under the top menu (centre), available in every view, online and offline. It shows everything played *this phase* - yours and every opponent's - as thumbnails outlined in each owner's colour, with a live count badge. **Hover-peek + click-pin** (the log-peek pattern), and it recedes (dimmed) when nothing is played. Overlay actions: **Clear** (re-baselines the display - cards stay on the board) and **Discard mine** (sweeps your own played cards to ash on demand). The Reaction strip (Quick-React + classic Alt) each gained a **Clear** button too.
  - *Data model:* `collectPlayed()` diffs the loose-in-play library cards against `avBaseline` (a persistent set of **card ids**); `snapshotPlayed()` re-captures it on phase change / game start / manual Clear - never on view open/close. The old auto-discard + auto-baseline-reset on closing the strip is **gone** (closing no longer touches your cards). `renderPlayed()` is driven from `renderAltIfOpen()` and from `tagPlayed()` (the universal play-to-ready point), which is what makes the count consistent.
  - *Inspect:* played thumbnails support the Ctrl-hover lupp while the left panel is collapsed - `avRenderCard` stamps `data-card-name` on the `.avc` wrapper (face-down omitted) and the pointer tracker matches `.avc[data-card-name]`; `showHoverFor` is name-based, so opponents' cards inspect too.
- **Left-panel (card viewer) overhaul - six points.** Ctrl-hover lupp fires while the pointer is stationary (track `lastCardEl` on pointermove, use it on Ctrl-keydown); the name tooltip is suppressed during a Ctrl-hover. The "Card text" rules section is **CSS-hidden** rather than removed (keeps its DOM handler alive); a card-image load failure falls back to name + KRCG text in-frame (`cardFallbackHTML`). The "Controls" list moved into a **`?` help overlay**. Log card-links drive the aside viewer on hover and a pinned detail view on click; hovering the collapsed **Panel** tab (or holding Shift) peeks the log, card links inside floating the card at the pointer.
- **Cross-table give from the Quick-React strip - fixed (three causes).** The felt marquee now excludes `.qrc / #qrbar / #altview`; `qrHandDown` calls `preventDefault()` (a missing one let a selection-drag fire `pointercancel` and kill the drag); and `giveHot`'s re-render gained the `typeof net.view==='number' -> renderRemote` case + `renderAltIfOpen()`, so a given card actually lands on a single-board visit.
- **Opponent-card log links - fixed.** `sanRemote` was stripping the `clog` tags from relayed plays. It now placeholder-protects the `<b class="clog" data-cid=...>` opener (sanitising the id), strips everything else, and restores - so opponents' log entries are clickable. Unit-tested in the harness.
- **`§` is now an L3 <-> home toggle.** `cycleView()` toggles `switchView(net.view==='ov' ? baseView() : 'ov')` - Helicopter from anywhere, home (Normal/Simplified, host-lock respected) back. The own single-board (Simplified) is intentionally no longer on the `§` loop when Normal is home.

> **In flight (designed, not built):** folding the Reaction strip's last unique job - locking/selecting your own ready cards while viewing *another* player's board - into a discreet **Ready peek-tab** fixed to the centre of the hand panel, shown only off your own board (opponent visit / Helicopter). Full shape + an optional Played-cards "phase log" are parked in the roadmap. Next build focus otherwise: Helicopter (L3) layout optimisation.

## v1.7 - Played-tab polish and tab-centering (21 June 2026)

Three improvements on top of v1.6:

- **Rename.** The tab label and overlay title changed from "Played cards" to "Played". The header "Clear" button became **"Clear all"** to distinguish it from the new per-card clear in the right-click menu.
- **Tab centering follows the left panel.** `--aside-w` (268px / 0px on collapse) + `--tab-mid: calc(var(--aside-w)/2 + 50%)` in CSS; `body.aside-collapsed` overrides to 0px. `#playedTab`, `#playedOverlay`, `#readyTab`, `#readyPeek` all use `left: var(--tab-mid)` — they now track the visible board centre as the panel opens/closes.
- **Per-card interactions in the Played overlay.** Left-click selects the card (own cards only: `selectOnly` + `layout` + `renderPlayed`). Right-click opens the standard `showMenu` with two items: **Clear this card** (removes from Played display without touching the board, works for any card) and **Discard this card** (own cards only, with `pushUndo` + live zone check).

> v1.7 syntax verified. Runtime test pending (Johan).


## v1.8–v1.10 — auto-deal, discipline search fix, animation speed, draw-click (21 June 2026)

Four improvements on top of v1.7:

- **Auto shuffle+deal on hotseat start (v1.8).** `startHotseat()` now calls `dealOpeningSync()` for every player whose `deckText` is set, immediately after `buildDeck()` and before `serializeGame()` snapshots the board. `boardJson` (resumed saves) and empty boards are unaffected. Online unchanged — the server deals via `dealNow()`.

- **Oblivion (obl) searchable in deck lab (v1.9).** KRCG sends newer disciplines as full names (`"oblivion"`) rather than trigrams (`"obl"`). Added `DISC_ABBR` (inverted `DISC_NAMES`) and a reverse-lookup in `cardTags()` so both forms are always indexed. Fixes `obl:` and `oblivion:` filters, and future-proofs any other discipline KRCG delivers as a full name.

- **Animation length setting (v1.10).** `conv.animSpeed` (0.5–2.0, default 1.0, ±10% steps). Scales `.cfx` clone animation durations via inline `style.animationDuration` on the wrap element and all `.cfximg` children. The `_swapAt` flip-midpoint timeout is also scaled. No-op at 1.0. UI: +/− buttons in Settings → Convenience.

- **Draw-click setting (v1.10).** `conv.drawClick` (`'double'`|`'single'`, default `'double'`). All six draw-capable elements got both `click` and `dblclick` listeners; the click handler skips draw in double-click mode (except Ctrl+click undo, always on click). Crypt draw goes through `influence()`, not `drawCard()`.

> v1.8–v1.10 syntax verified. Runtime test pending (Johan).

## v1.11 – Click-cancel, actor card in play-FX, shuffle riffle animation (21 June 2026)

Three polish additions on top of v1.10:

- **Click to cancel clone animations.** A `click` listener with `{ once: true }` on the `.cfx` wrap element removes it immediately. `#cardFx` has `pointer-events:none` on the host div, but that does not affect children appended inside — the click reaches the wrap correctly.

- **Actor card in the play-FX animation.** `cardFx()` now accepts `opts.actor` (a card object). When present, the actor's card image (`.cfximg.tgt.actor`, 122×170 px — same size as the existing target thumbnail) is prepended to the row via `insertBefore`, giving a left-card → main-card layout. The caption replaces the seat·who label with `opts.actor.name`. Three call sites updated:
  - `tagPlayed` — `actor: activeAnchor()`; `target: curTargetCard(c)`
  - drag-attach (drop on card from hand) — `actor: activeAnchor()`; `target` = the card dropped onto
  - `playOnActive` (double-click hand card when anchor exists) — **was** wrongly sending `{ target: a }` (anchor shown as target-arrow); fixed to `{ actor: a, target: curTargetCard(c)||undefined }`
  - Cross-table gives (`qrGiveToTarget`, `giveTo`, `giveHot`) — no actor, intentionally

- **Shuffle riffle FX.** `shuffleFx(zone)` appends a `.sfx-wrap` inside the pile element(s) for the given zone. Three `.sfx-card` children (with the correct card back image) fan out and fall back over ~0.82 s using `sfxRiffle` keyframes with staggered delays (0/60/120 ms) and per-card custom properties (`--sfx-tx`, `--sfx-r`). A `.sfx-sheen` gold-glimmer overlay fades in/out on top. Both the board pile (`#z-crypt`/`#z-library`) and dock pile (`#dockCrypt`/`#dockLib`) animate simultaneously. Triggered from: `shuffleZone` (local and online paths), `groupShuffleIn`, and both deal/import shuffle calls.

> v1.11 syntax verified. Runtime test pending (Johan).

## v1.12 – SFX library wired to game events (21 June 2026)

Eight sound effects from the SFX demo (`vtes-sfx-demo.html`) hooked to in-game events:

| Event | Sound | Function |
|-------|-------|----------|
| Play card | Blood Slap | `sfxPlayCard()` in `tagPlayed` |
| Unlock (single) | Discipline | `sfxDiscipline()` in `setLocked(c, false)` |
| Lock (single) | Conclave | `sfxConclave()` in `setLocked(c, true)` |
| Pass | Bell Moll (E) | `bell()` replaced with gothic FM bell |
| Oust | Final Death | `sfxFinalDeath()` in `ousted()` |
| Any log event | Warded | `sfxWarded()` in `log()` with 320ms cooldown |
| "Hold on…" phrase | Bell pitch-drop (C) | `sfxHoldOn()` in `showSay` when `i===4` |
| Your turn! | Vessel heartbeat | `heartbeat()` replaced with richer 3-layer version |

Shared audio primitives (`sfxMakeReverb`, `sfxThud`, `sfxNoise`, `sfxOsc`) added — all use the shared `actx` and the existing reverb pattern. No external files, all Web Audio API synthesis inline.

> v1.12 syntax verified. Runtime test pending (Johan).

## v1.13 – SFX volume settings (21 June 2026)

Sound settings added to the Settings panel on top of v1.12:

- **Master SFX volume slider** (0–200%, default 100%) in the Convenience section, above Quick React. Controls all 8 SFX channels simultaneously. Persisted in `conv.sfxVol`.
- **Per-channel volume grid** (Sound effects — per-channel section, after Convenience). 8 sliders in a 2-column grid — one per SFX event (Play card / Blood Slap, Unlock / Discipline, Lock / Conclave, Pass bell / Bell Moll, Oust / Final Death, Log event / Warded, "Hold on…" / Bell pitch-drop, Your turn! / Vessel). Each 0–200%, default 100%, persisted in `conv.sfxIndiv[channelId]`. Grid built dynamically by `buildSfxAdvGrid()` in `openSettings`.
- **`sfxGain(ch, base)`** — shared multiplier function. Returns `base × (conv.sfxVol/100) × (conv.sfxIndiv[ch]/100)`. Called in every named SFX function at the point where gain values are set.

> v1.13 syntax verified. Runtime test pending (Johan).


## v1.14 – Main menu restructure + Tools to right-click (22 June 2026)

Menu reorganised into a cleaner hierarchy:

- **Host…** (sub, shown only when `localTable || (inRoom() && net.isHost)`) → New deal, Reset table, Randomize seating, Save game to file, Load game from file
- **Play…** (sub, always visible) → Online…, Offline — hotseat…, Solo — practice board…
- **Decks…** (sub, always visible) → Load deck…, Deck lab…
- Rulebook / Settings / About (flat, at bottom)

Removed from main menu:
- **Take priority** — already in the PRIORITY bar / Table dock, no longer duplicated here
- **Tools** (coin, dice) — removed from main menu

Tools moved to **right-click / felt context menu** (`openSayMenu`): separator + **🎲 Dice & coin** submenu (🪙 Flip a coin + D4/D6/D8/D10/D12/D20) appended after the phrase list.

**Solo** mode: `openOffline(mode)` now accepts `mode='solo'` — resets `offlineCfg` to one seat (you) before opening the offline modal, so no dummy opponents need to be removed manually.

> v1.14 syntax verified. Runtime test pending (Johan).

## v1.14 – Huvudmenyrenovering (22 juni)

Menyn omstrukturerad till en hierarki med undermenyer. Fullständig struktur i session-journalen. Nyckelkonventioner:

- `…` på föräldrar (Host…/Play…/Decks…), aldrig på löv-val
- Game log + Leave seat visas när `localTable || inRoom()`, med `confirm()` på Leave seat
- Host-undermenyn visas när `localTable || (inRoom() && net.isHost)`
- Solo = `openImport()` (inte `openOffline`) — samma som startskärmens "Play solo"-knapp
- Tools (coin/dice) flyttad till `openSayMenu` (högerklicksmeny), längst ner som `🎲 Dice & coin`
- Hold on… överst i `SAY`-arrayen (index 0), `sfxHoldOn` kontrollerar `i===0`
- SFX master volume default 0% (inte 100%) — nya spelare skräms inte av ljud

## v1.18 – Lokal tournament mode (22 juni)

`conv.tournament` (bool, default `true`) tillagd som lokal inställning. Visas som **Tournament mode**-checkbox överst i Phase helper-sektionen i Settings.

**Prioritetsordning:**
1. `net.helperPolicy` (online) — trumfar alltid
2. `conv.tournament` — gäller bara när `!inRoom()` (ingen online-policy)

`hx(key)` utökad: `if(!p && conv.tournament) return false;` — samma effekt som online tournament men lokalt.

`syncHelperUI` uppdaterad: `#convTournament` gråas ut när man är online (policy tar över); banner visas lokalt med "Tournament mode is on — all helpers are off." Individuella helper-toggles disabled när lokal tournament är på.

`#convTournament`-lyssnare: `conv.tournament=e.target.checked; saveConv(); applyHelper(); syncHelperUI();`

**conv-tabellen tillägg:**
| `tournament` | bool | `true` | Lokal tournament mode — alla helpers av, råa Lackey-känslan |

## v1.17 – Hand zone högerklicksmeny: djupare fix + polish (22 juni)

Fortsättning på v1.16 — tre iterationer för att få menyn att fungera i alla vyer och med rätt visuell feedback:

**DOM-strukturproblemet:** Kort appendas till `#board`, inte `#z-hand`. `closest('#z-hand')` fungerar för tom zon-bakgrund men aldrig för kort. Fix: capture-lyssnaren kollar `state.cards.get(el.dataset.cid).zone==='hand'` för kortdetektering, och `closest('#z-hand')` för tom bakgrund.

**`_menuPinnedHover`** — global som sätts när zone-menyn öppnas på ett handkort, rensas i `hideMenu()`. Används som mutex av:
- `pointerout`-lyssnaren → kortet förblir lyftat (`handhover`) medan menyn är öppen
- `pointermove` på `board` + `rview` → docken stängs inte när musen rör sig till menyn ovanför

**Kortets `contextmenu`-lyssnare** ändrad: för handkort anropas `e.preventDefault(); e.stopPropagation(); return;` — hindrar `cardMenu` från att öppnas, låter capture ta hand om allt.

**Kortnamn i Selected-labels:** `_sel.name` injiceras dynamiskt när menyn byggs, t.ex. `Selected (Govern the Unaligned)`.

## v1.16 – Hand zone högerklicksmeny ombyggd (22 juni)

`#z-hand` contextmenu ersatt med en hierarkisk undermenystruktur. Tre nya lägen: zone-wide bulk-operationer, Selected (kräver hover), och Random X (prompt för antal).

**Ny menystruktur:**
- **Play card…** → Face-up / Face-down (Selected)
- **Discard card…** → Random X… / Selected
- **Return card to library…** → Random X… (→ Top/Bottom/Shuffle in) / Selected… (→ Top/Bottom/Shuffle in)
- **Burn card…** → Random X… / Selected
- ─── separator ───
- **Shuffle library**
- ─── separator (om `hx('hand')`) ───
- Max hand size +1 / -1 / Reset (oförändrade)

**Nya hjälpfunktioner** (efter `discardRandomHand`):
`_promptN`, `_randomSubset`, `discardRandomHandN`, `burnRandomHandN`, `returnRandomHandN(pos)`, `_requireSelected(fn)`

**`_lastHandHover`** — ny modul-global (rad ~1983) satt i pointerover-lyssnaren. Kvarstår efter hover — sista hovrade handkortet = "selected".

**Ej implementerade (återkommer):** Reveal…, Browse → Search/Show & shuffle, Play with open hand.

## v1.15 – Skift-logg interaktivitet (22 juni)

- Kortvisning vid hover: `.show.peeking { pointer-events:auto }` + `logInspectRender` med `s=2.619` (~220px bred, matchar hoverCard)
- Scroll: `wheel`-lyssnare på `#logPeekList` med `e.preventDefault()` kringgår Shift+scroll=horisontell-beteendet
- Tab-hover parkerad (kommenterad) — Shift räcker

> v1.14–v1.15 syntax verifierat. Runtime-test kvar hos Johan.


## v1.19 – Bugfix: conv TDZ-krasch (22 juni)

**Rotorsak:** `hx()` innehöll `if(!p && conv.tournament) return false;` (tillagt i v1.18). `hx()` anropas av `applyHelper()` som ett top-level statement (rad ~4884 i HTML). `conv` deklarerades med `let` på rad ~8283 — långt efter. `let`/`const` hoistas inte ur sin temporal dead zone, vilket ger **"Cannot access 'conv' before initialization"** och kraschar hela scriptet vid laddning. Event-lyssnare sattes aldrig upp → inga knappar fungerade.

**Fix:** Hela conv-blocket (`const CONV_KEY` + `let conv={}` + localStorage-parsningen) flyttades till direkt efter `net`-deklarationen tidigt i scriptet. `animMode=conv.anim; applyPco();` lämnades kvar på ursprungsplatsen (de beror på `animMode` som deklareras sent).

**Lärdom → se learnings.md**

## v1.19–v1.20 – Hand reveal + 3-level menus (22 June 2026)

### Hand reveal to opponents
A hand-zone right-click action: **Reveal… → Hand… / Random X… / Selected… → All players / [per player]**. Implemented in `revealHandTo(cards, toSeat)` with `toSeat` a seat number or `'all'`. Card-mechanic support (some VTES cards reveal hand cards).

Log orientation:
- **Sender** sees "You revealed to <recipient/everyone>: <cards>" with `data-cid` card links (owns the cards).
- **Recipient** sees "<sender> revealed to you: <cards>" with `data-name` links.
- **Public line** ("X revealed their hand to Y", no card names) shows only to non-recipients. Online: the server distributes it to third parties (not the sender, not the recipient). Reveal-to-all has no public line (everyone is a recipient).

`cardFx` gained `kind='handreveal'` — a multi-card clone animation tagged separately from `play` (CSS `.cfx.handreveal`). It does NOT broadcast via `t:'fx'`; reveal routing goes through the dedicated `t:'revealHand'` verb.

Protocol `t:'revealHand'`: `{cards:[{name,kind}], to: seat|'all', pub}` → server sends the private card list only to recipient(s), and the public line to third parties.

### `log()` privateLine parameter
`log(msg, localOnly, privateLine)` — a third arg. Private lines (all reveal lines) display live but are never pushed to `curLines`, so they never reach the per-turn archive, the `.txt` download, or the autosave. Only public lines are archived/persisted.

### 3-level context menus
The menu system originally had one `#submenu` panel (2 levels). Reveal and Return-to-library are 3 levels deep, so a third panel `#submenu2` was added. `_childOf(el)` maps menu→submenu→submenu2; hovering a sub-item opens the child panel, hovering a leaf closes it. **Z-index: all three panels at 8000/8010/8020** — above `.card.handhover` (4800 !important) and `#poolWrap` in L2 dock (4700), below `#logInspect` (8600) / `#hoverCard` (9000) / `#cardTip` (9999). Earlier attempts using close-delay timers and pointer-events juggling caused new bugs; the clean fix is just the extra panel + correct z-index.

### Log card preview supports `data-name`
`findInspect(cid, name)` now falls back to a synthetic card (`synthetic:true`) when there's no live card for the cid but a name is present — so revealed cards (which the recipient doesn't own) still show their image on hover. `logInspectRender` renders synthetic cards as a plain image; `previewName(name)` feeds the left-panel viewer. All three hover paths (`#log` ctrl/panel, outside-click guard, `#logPeek` Shift-log) match `.clog[data-cid],.clog[data-name]`.

### Hotseat ↔ online divergence (reveal)
Hotseat uses ONE shared table log across all seats (`setActivePlayer` → `restoreGame(..., {keepLog:true})`, which doesn't touch the visible log). There is no per-seat log to write into. So a hotseat reveal shows only the sender's single line + one animation; an online recipient's private "X revealed to you" line cannot be reproduced in hotseat without a per-seat-log rearchitecture. Deliberate trade-off — build online carefully and verify the recipient view live when it matters.

## v1.21 – Pool glob reachable with the dock collapsed (22 June 2026)

Bugfix. In L2 Home (and L3 Helicopter) the pool glob's right-click menu (Set pool / Ousted / Burned cards), the +/- buttons and scroll-to-adjust only worked while the bottom dock (Crypt/Library/Ash heap/Hand) was unfolded. Folded down, a right-click on the glob produced the generic quick-phrase menu instead.

**Root cause:** `#poolWrap` carries no z-index of its own. The z-index lift to 4700 was scoped to `.l2dockopen` only (CSS ~line 476), so when the dock was collapsed `#poolWrap` fell back to auto z-index — *below* the collapsed dock handle `#l2dock` (z-4410), which sits over the bottom strip and overlaps the pool zone. `#l2dock` is **not** in the `board` contextmenu bail-list (`.card,...,#poolWrap,...`), so the right-click landed on the handle, bubbled to `board` → `openSayMenu`. The `document` fallback also fires only when `!e.defaultPrevented`, and since the poolWrap listener never ran, nothing prevented it.

**Fix (CSS only):**
- L2 solo/columns (~line 476): dropped the `.l2dockopen` qualifier so `#poolWrap{ z-index:4700 }` applies in **both** dock states. Purely additive for the collapsed state (dock cards are `display:none` then) and identical to before when open → zero regression risk.
- L3 (~line 803): bumped `#board.l3mode #poolWrap` from `z-index:40` to **4500** — above the dock handle (4410) and dockbg (4400) so the pool stays interactive with the dock collapsed, but **below** the dock cards (4600) so it can never cover them when the dock is open.

**Not a duplicate element:** there is only one `#poolWrap`; there is no second "drawn" pool glob inside the dock. The faint visual difference when the dock is open is just `#l2dockbg` (the dark gradient, z-4400, bottom 32%) showing through the transparent parts of the framed pool box behind the glob. Collapsed → no dockbg → glob sits on plain felt. The fix does not change the collapsed-state appearance.

> v1.21 is CSS-only; client JS syntax verified. Runtime/visual test pending (Johan): confirm the pool right-click menu, +/- and scroll work in L2 Home **and** L3 Helicopter with the dock folded down, and that nothing odd stacks over the L3 pool when the dock is open.

## v1.22 – Own pool glob conditional during a Visit (22 June 2026)

Refinement on top of v1.21. While visiting an opponent (`body.invisit`, an L2 seat visit), your *own* pool glob is now tied to the dock:

- **Dock collapsed** -> your `#poolWrap` is hidden (`display:none`), so the opponent's pool globe (drawn on the `#rview` mat) shows through. You're focused on their board.
- **Dock unfolded** -> your `#poolWrap` reappears (and the v1.21 z-4700 lift keeps it above the `#rview` overlay at 3500, so it's reachable). This lets you spend/reduce your own pool *on the spot* during an action that costs you pool while you're reviewing their board — no trip back home.

**Fix (CSS only, one rule)** added beside the other Visit template exceptions (~line 491):
`body.invisit #board:not(.l2dockopen) #poolWrap{ display:none; }`

This only affects opponent visits — L2 Home and L3 are untouched (`body.invisit` is set only when `typeof net.view==='number'`, toggled in `switchView`). A visit keeps L2 mode (so the real L2 dock is present), which is exactly why the dockopen test works here.

> v1.22 is CSS-only; client JS syntax verified. Runtime/visual test pending (Johan): in an L2 Visit, confirm your own pool glob hides with the dock folded down (opponent's globe visible) and reappears + is right-clickable / +-/scroll-adjustable with the dock unfolded.

## v1.23 – Opponent pool globe matches your own exactly (22 June 2026)

Cosmetic precision fix. In an L2 Visit the opponent's pool globe rendered ~4% larger than your own live globe.

**Cause:** your live `#pool` is a fixed **96px** globe (in the 1004x616 design stage), shown at `96 * l2pub.s` in L2. The opponent globe (`buildMat`, ~line 6938) was sized from the pool *zone* rect: `gd = min(s*cz.pl.w*0.86, s*cz.pl.h*0.60)`, which for the canonical pool zone (135.54 x 166.32) resolves to `99.79 * s` — a hair bigger than `96 * s`. When the two view scales align (your home frame and the visit mat fill the same area), the result is the visible ~4% (99.79/96 = 1.039) size difference.

**Fix:** express the opponent globe as the *same fraction of the pool zone* the live 96px globe occupies, derived from the same `L2GEO` constants:
`const GW=96/(L2GEO.pool.w*1004), GH=96/(L2GEO.pool.h*616); gd=max(16, min(s*cz.pl.w*GW, s*cz.pl.h*GH));`
For a real opponent (`buildPub` always sends `bw:1004, bh:616`) both products equal `96 * s`, so the globe is now the live 96px globe scaled by the mat scale — pixel-for-pixel identical to your own when the scales align. The `k=gd/96` shadow factor now resolves to `s` (cleaner; shadows scale with the mat like everything else). Font ratio (`gd*0.333`) unchanged (matches the live `32px/96px`).

> v1.23 client JS syntax verified. Runtime/visual test pending (Johan): in an L2 Visit with the dock unfolded, eyeball your own globe against the opponent's — they should now read identical. (Locally-fabricated practice opponents send `bw:W,bh:H`, so their globe tracks the live proportion rather than a literal 96px — expected.)

## v1.24 – Opponent pool right-click: public piles (ash heap + burned) (22 June 2026)

The opponent pool right-click menu (visit + L3) gained a second public pile and is now reachable on the whole globe/zone, not just the tiny "Pool N" text.

- **`viewOppBurned(seat)`** added next to `viewOppAsh(seat)` — same read-only browse-modal pattern, filters `pub.cards` for `zone==='burned'` (burned is in `PUBZ`, so it ships in every public board). `browseZone='burned'; browseDirty=false` → the close handler only reshuffles library/crypt, so nothing destructive happens.
- The opponent-pool capture-phase contextmenu listener now shows **both** options with live counts: `🜂 View their ash heap (n)` + `🔥 View their burned cards (n)`. Counts come from `(net.boards[seat].pub.cards)` filtered by zone.
- **Hit area widened:** in `buildMat`, the pool **zone box**, the **globe** (L2/visit), and the **L3 pool value** now carry `data-seat` + class `matpool` (gated `!me && seat!=null`), so right-clicking anywhere on the opponent's pool opens the menu. `zbox` now returns its element so the pool box can be tagged. `.matpool` has no CSS of its own — pure behavioural hook — so tagging adds no visual change (only a `context-menu` cursor + title).
- Works in **both transports**: `net.boards[seat].pub` is populated identically (online relay `m.pub`, hotseat `setActivePlayer`→`buildPub()`), both carrying the canonical board.

> v1.24 client JS syntax verified. Runtime test pending (Johan): in a visit AND in L3, right-click an opponent's globe / pool zone → both pile views open and show the right cards; confirm in hotseat and online.

## v1.25 – Host control on the opponent pool menu (22 June 2026)

Full host control built (Johan chose the unrestricted option). The opponent pool right-click menu (visit + L3) now shows, for the host (`localTable || (inRoom() && net.isHost)`), below the public-pile items:
- **⚙ Set their pool…** — `hostSetPoolPrompt(seat, name, current)`.
- **💀 Oust this player…** / **↩ Return them to the game** — `hostOustSeat(seat, name, undo)`, toggling on the target's `out` flag.

**Authority split (because pool is client-authored, `out`/VP are server-authoritative):**
- **Oust (online):** server verb `{t:'hostOust', seat}` (host-token checked) mirrors the `bounty` handler — sets `q.out=true`, awards the immediate predator +1 VP server-side + relays `{t:'bounty'}` (the +6) to the predator's client, `sys()`-logs, `rosterUpd`. Works even if the target is **disconnected**. It also relays `{t:'forceOust'}` to the target (if connected) → their client runs `ousted({forced:true})` to return cards (cosmetic).
- **Set pool (online):** `{t:'hostSetPool', seat, val}` → server relays `{t:'forceSetPool', val}` to the target's socket → their client sets `state.pool` + `schedulePush()` (rebroadcast). **Only lands if the target is connected** (present-but-idle AFK is fine); a disconnected target can't apply it — host can oust instead.
- **Un-oust (online):** `{t:'hostUnoust', seat}` → clears `q.out`, `sys`, `rosterUpd`.
- **Hotseat:** all local. `hostSetPoolHot` edits the stored `net.hot.boards[seat]` blob (+ live `net.boards[seat].pub`). `hostOustHot` marks the roster seat out, calls `awardBountyHot(seat)` (now takes an optional oust seat), zeroes the stored pool/edge. `hostUnoustHot` clears out. Each refreshes the on-screen mat (`switchView`/`renderL3`).

**`ousted(opts)` gained an `opts.forced` path:** skips the `confirm()`, skips the self-bounty `mpSend({t:'bounty'})` (the server already awarded it on host-oust), and makes the three oust narrative `log()` lines `localOnly` (the server `sys()`-logs the authoritative line, so no duplicate). All existing `ousted()` callers pass nothing → unchanged.

**New protocol verbs:** client→server `hostSetPool` / `hostOust` / `hostUnoust`; server→client `forceSetPool` / `forceOust`. All wire-compatible additions (the server's verb chain ends in a benign `else`, so a new client against an old server just no-ops the host action — no crash). `VERSION` left as-is (these don't change the save/handshake format; consistent with prior practice where VERSION tracks save format, not feature count).

> v1.25 client + server JS syntax verified. NOT runtime-tested (sandbox can't run the server or multiplayer). Johan to verify live: (1) host sets a connected opponent's pool in an online game; (2) host ousts a connected opponent (cards return, predator gets +6/+1 VP) AND an AFK/disconnected opponent (server marks out + awards predator even with no client response); (3) un-oust; (4) the same Set pool / Oust on a stored seat in hotseat. Worth a run of the server test suite too.

## v1.26 – Table-panel rows open the pool menu (22 June 2026)

The fold-out **Table** panel (`#statsDock`, rows built by `statRow`) now answers right-clicks: each player row opens the very same pool right-click menu you'd get on that seat's pool globe — and it follows *what you may see* of that seat.

- **Opponent row** -> `oppPoolMenuItems(seat)`: 🜂 ash heap (n) + 🔥 burned cards (n) (both public). For the **host** (`localTable || (inRoom() && net.isHost)`) it also gets ⚙ Set their pool… and 💀 Oust / ↩ Return — identical to the globe menu.
- **Your own row** -> `selfPoolMenuItems()`: 🜂 your ash heap + 🔥 burned cards (interactive `browse`, you can retrieve), then ⚙ Set pool… and 💀 Ousted… / ↩ Return to the game (always yours, host or not).
- Works in **both transports** unchanged — opponent data reads from `net.boards[seat].pub` (online relay or hotseat `buildPub`), your own from `state`.

**Single-sourced opponent menu:** the opponent menu body was extracted from the global `.matpool` capture-phase listener into **`oppPoolMenuItems(seat)`**, now called by both the listener and the Table row — so the globe menu and the panel menu can never drift apart. `selfPoolMenuItems()` is the parallel for your own seat (it does *not* alter the existing `#poolWrap` glob menu, which still omits ash heap — the panel row is the richer entry point).

**Row handler guards (in `statRow`):** skips vacant seats, skips when the right-click lands on a host mod button (`.smbtn`, so mute/demote/kick keep their own behaviour), and requires a seat for opponent rows. `o.me` is checked first (your own online row also carries `seat`).

> v1.26 client JS syntax verified (the load harness isn't in this project snapshot, so only the syntax gate ran). Runtime test pending (Johan): right-click rows in the Table panel — opponent row shows ash/burned (+ host controls as host), your own row shows ash/burned + set pool + ousted; confirm in solo, hotseat and online.

## v1.27 – Table panel grid layout (22 June 2026)

The Table panel (`#statsPanel`) was restyled from a ragged flex row to a proper CSS grid so player names never push the stats columns onto a second line.

**Layout:** `#statsPanel` widened from 284px → 310px. Each `.srow` is now `display:grid` with **7 fixed columns**: `14px | 1fr | 30px | 34px | 34px | 30px | auto` = `[lead] [name] [pool] [lib] [minions] [vp] [mod-buttons]`. The name column is the only `1fr` and gets `overflow:hidden; white-space:nowrap; text-overflow:ellipsis`, so long names truncate gracefully instead of wrapping.

**Cells per row:**
- **col 1 – `.slead`**: inline-flex with turn indicator (▶) + colour dot (`.scol`). When no colour dot is available (solo/spectator view), falls back to a seat-number badge (`.sseat`, muted brass text).
- **col 2 – `.sncell`**: name (`.sn`), host ★, oust 💀, status (reconnecting/open), muted 🔇.
- **col 3 – `.spool` / `.sedge`**: pool number; turns into "EDGE" badge (red) when the player holds the edge.
- **col 4 – `.slib`**: 📚 + library count.
- **col 5 – `.smin`**: 🧛 + minion count.
- **col 6 – `.svp`**: 🏆 + VP (clickable for you / host in hotseat).
- **col 7 – `.smod`**: host mod buttons (mute/demote/kick) — `auto` width, collapses when absent.

**Header row:** `renderStats` prepends a `.srow-hdr` with matching `grid-template-columns` and Cinzel labels (Pool / 📚 / 🧛 / 🏆).

**`.smbtn` / `smod` CSS unchanged** (they live in col 7 which is `auto`, so they still look the same). `hover` background still works because `.srow` itself keeps `border-radius` and the bg rule applies to the grid container, not `display:contents`.

> v1.27 CSS+JS syntax verified. Runtime test pending (Johan): open Table panel in solo, hotseat, and online; check that all columns align across players; long names truncate with ellipsis; turn indicator, colour dot, pool, lib, minion and VP columns stay in their columns regardless of name length; host mod buttons appear correctly for the host.

## v1.28 – Table panel bug fixes: dot+triangle overlap, right-click menu (22 June 2026)

Two bugs introduced in v1.27 fixed:

**Bug 1 – turn-indicator + colour dot both shown simultaneously.** `leadHtml` previously always included `dot` alongside `turnSpan`, so when it was a player's turn the colour dot appeared jammed beside/behind the triangle in col 1. Fix: `leadHtml` now branches on `o.turn` — when it's that player's turn, the col-1 cell shows **only the triangle** (coloured with their seat hex via `style="color:..."` on `.sturn`); when it's not their turn, it shows **the dot OR the seat-number fallback** as before.

**Bug 2 – Table panel rows showed the quick-phrase menu instead of the pool menu on right-click.** The v1.26 contextmenu listener was applied to the row element `d`, but the global board contextmenu handler (`openSayMenu`, listening on `document` at bubble phase) was firing instead. The row listener called `e.preventDefault() + e.stopPropagation()`, which should have been enough — but the v1.26 edits were accidentally lost when v1.27 rebuilt from the project source instead of chaining from the v1.26 output. This delivery re-applies both patches in a single pass from the clean v1.25 base. Both listeners are now present and the stopPropagation prevents the board handler from seeing the event.

> v1.28 CSS+JS syntax verified. Runtime tests pending (Johan): (1) turn indicator — triangle only, no dot alongside it, triangle coloured with the seat's colour; (2) right-click any Table-panel row — own row → ash/burned + set pool + ousted; opponent row → ash/burned (+ host controls as host); (3) all v1.27 column alignment still holds.

## v1.29 – Play with open hand (standing hand-reveal grant) (22 June 2026)

A persistent "open hand" grant: a player can let one chosen opponent — or all players — inspect their hand at will, the standing-subscription counterpart to the one-shot `revealHand`. A deliberate, scoped exception to the hidden-hand secrecy rule.

**Granter side — hand right-click menu.** Below `Reveal…` a new branch **`Play with open hand…`** (label flips to **`Open hand (on)…`** while any grant is active) with `_openHandMenu()`:
- Grant targets: **All players**, then each living opponent not already granted.
- Revoke section (only when a grant is active): **■ Stop: <name>** per grantee, **■ Stop: all players** (when 'all' is active), and **■ Stop: everyone** (when >1 individual grant).

**State & persistence.** `state.openHand` — an array of seat numbers and/or the `'all'` sentinel (`'all'` supersedes individual grants). Serialized in `serializeGame`/`restoreGame` (survives save/load + hotseat swaps, per Johan's choice), reset in `clearTable`. **Deliberately NOT in the undo `snapshot()`** — a grant is a social action, so undoing a card move must not silently toggle it.

**Live re-push.** `refreshOpenHands()` is hooked into `schedulePush()` (the universal board-change point, beside `pushEscrow()`), so every hand change online re-pushes the live hand to every active grantee. Hotseat/solo grantees read the stored/live board directly — no push.

**Grantee side.** `net.openHandFrom = { seat -> [cardInfos] }` holds live-pushed hands (online). `openHandCardsFor(seat)` resolves the hand: online from `net.openHandFrom`; **hotseat by parsing the granter's stored `net.hot.boards[seat]` blob** (checks its `openHand` includes my seat or `'all'`, then maps `zones.hand`→`cards`). `canSeeOpenHand(seat)` gates the menu item. `viewOppHand(seat)` is the read-only inspector overlay (reuses `#browseModal`, `browseZone='openhand'`, no take/reshuffle — same pattern as `viewOppAsh`/`viewOppBurned`).

**Where the inspect item appears.** `oppPoolMenuItems(seat)` gets **👁 Inspect their hand (n)** `unshift`ed to the top when `canSeeOpenHand(seat)`. Because the Table-panel row and the pool globe/zone both call `oppPoolMenuItems`, the item shows in **both** the pool zone right-click menu (L2 Visit / L3) and the Table tab row — automatically, no extra wiring.

**Visibility.** Grant and revoke each emit a **public, archived** `log(..., true)` line ("X is now playing with an open hand toward Y" / "X stopped…"), per Johan's choice.

**Protocol (wire-compatible additions).** client→server `openHand {to: seat|'all', cards:[...]}` and `openHand {to, revoke:true}`; server→client `openHandGrant {from, seat, who, cards}` / `openHandRevoke {from, seat}`. Server handler mirrors `revealHand`'s trust model (card names leave the client in clear, server routes them; `cleanCard`-sanitised, capped at 30). The grantee client stores/clears `net.openHandFrom[seat]` and closes the inspector if open on a revoked seat. `VERSION` left at 1.6 — `openHand` is an additive save field (old clients ignore it; the server verb chain's benign `else` no-ops an unknown verb), consistent with the v1.25 precedent.

> v1.29 client + server JS syntax verified (no load harness in this snapshot). NOT runtime-tested (sandbox can't render or run the server/multiplayer). Johan to verify live: (1) online — grant to one opponent, confirm only they get 👁 Inspect their hand on your pool/Table row and the contents match; draw/play a card and confirm their inspector reflects it live; revoke and confirm the item disappears; (2) grant to all; (3) hotseat — grant from seat A, switch to seat B, confirm B sees A's open hand via the stored blob; (4) save & load mid-grant, confirm the grant persists; (5) the public log lines appear for third parties.

## v1.30 – Ctrl+hover lupp in browse modal (22 June 2026)

Ctrl+hover card preview now works inside `#browseModal` (ash heap, burned cards, open hand, online library/crypt browse) — without requiring the left panel to be collapsed.

**Two changes:**
- **`data-card-name` stamped on every `.bcard`** at creation time in all five builders: `browse()`, `viewOppAsh()`, `viewOppBurned()`, `viewOppHand()`, `netBrowseOpen()`. Face-down cards are skipped (no name leaks).
- **Gate relaxed in the lupp handlers** (`pointermove` + `keydown('Control')`): the condition was `asideCollapsed`; now it also fires when `lastCardEl` is a `.bcard` (i.e. a browse-modal card is under the pointer), regardless of panel state. The existing `lastCardEl` selector is extended with `.bcard[data-card-name]`.

`showHoverFor` is unchanged — it already reads `el.dataset.cardName` and positions the overlay at the pointer. No server change.

> v1.30 client JS syntax verified. Runtime test pending (Johan): open ash heap / burned / open hand overlay, hold Ctrl and hover a card — full-size preview should appear at the pointer whether the left panel is open or closed.

## v1.31 – Hand menu cleanup (22 June 2026)

Two small UX fixes in the hand zone right-click menu:
- **"Play with open hand…" moved into the `Reveal…` submenu** (as the last item, after a separator). It's semantically a reveal-family action and belongs there rather than as a top-level sibling.
- **"Shuffle library" removed from the hand menu** — it was contextually misplaced; the library right-click menu is the natural home for it.

## v1.32 – Scroll to adjust max hand size + token permanence clarification (22 June 2026)

**Token permanence (confirmed, no code change):** blood/blue/green counters survive pass-skiften. `pass()` kallar varken `clearTable` eller nollställer tokens; de serialiseras i `serializeGame()` och `snapshot()`. Designat beteende — vampyrer bär sina counters mellan rundor.

**Scroll on `#z-hand` to adjust max hand size:** `#z-hand` fick en `wheel`-lyssnare (passive:false, 200ms cooldown, samma mönster som kort-wheeln) som kallar `adjustMaxHand(±1)` + `renderHand()`. Gatas på `hx('hand')` — samma flagga som hand-size-menyn och draw-varningen. `cnt-hand` uppdateras nu till `n/maxHand` (t.ex. `3/7`), och `#z-hand.title` sätts till en helpful tooltip som bekräftar scroll-beteendet.

## v1.47 – Target from opponent ash heap browse (22 June 2026)

Double-clicking a card in `viewOppAsh` now sets/clears it as the active remote target via `setRTarget`, using the same log line and target-button highlight as targeting a card in play.

**`viewOppAsh(seat)`:** Each `.bcard` gets a `dblclick` listener. On double-click: clears the `.btarget` CSS class from all cards in the grid, then checks `net.rtarget` — if the card is already the current target, calls `setRTarget(null)` (clears); otherwise adds `.btarget` to the element and calls `setRTarget({seat, cid, who, name, faceDown})`. When the modal opens, any card that is already `net.rtarget` gets `.btarget` immediately so the mark is visible from the start. Note text updated to `'Public pile — double-click a card to set/clear target.'`

**CSS `.bcard.btarget`:** crimson `box-shadow` ring on `.bimg` + red `.bname` text + `⌖` reticle symbol via `::before` on `.bcard.btarget` (positioned `top:-2px; left:50%`). `.bcard.btarget` gets `position:relative` so the pseudo-element is anchored correctly. The `⌖` is placed on `.bcard` (not `.bimg`) to avoid being clipped by `.bimg`'s `overflow:hidden`.

**Why `setRTarget` and not a local-only flag:** `setRTarget` logs the target openly ("⌖ Target: Name."), updates the target button, and syncs via `schedulePush` — exactly what targeting in play does. The ash heap card not being in `COUNTER_ZONES` is intentional: the target is a communication tool ("I want you to burn this"), not an action target, so it persisting until manually cleared or the board updates is correct.


## v1.46 – Burn X random from ash heap (22 June 2026)

New `burnRandomAshN()` function alongside the existing single-card `burnRandomAsh()`. Prompts for a count via `_promptN`, then picks that many distinct random cards from `state.zones.ash` via `_randomSubset`, burns each (`move(c,'burned')`), logs each with `cardRef(c)`, and adds a summary line when n>1.

**Menu label** `'Burn random card'` → `'Burn X random…'` pointing to the new N-variant. **Shortcut `burnRndAsh`** also updated to call `burnRandomAshN` (the single-card function is preserved in code but no longer wired to anything by default). No server changes — ash heap is always a local pile.


## v1.45 – Ash heap browse consolidated into submenu (22 June 2026)

The two separate ash heap browse actions ("Browse…" and "Burn a card… (choose)") are replaced by a single **Browse…** entry with three submenu items available everywhere the ash heap can be opened:

- **View only** — opens the modal with no action listener; cards can be Ctrl+hovered for preview but cannot be interacted with.
- **Pick card(s)** — double-click any card to move it to hand (previous v1.44 behaviour). Modal stays open; pick as many as you want.
- **Burn card(s)** — double-click any card to burn it. Modal stays open; burn as many as you want.

**`browse()` changes:**
- New `mode==='view'` arm: title prefix `'View: '`, note `'Public pile — view only. Ctrl+hover for card preview.'`, no event listener attached to `.bcard` elements (but `data-card-name` is still set, so Ctrl+hover works).
- `mode==='burn'` listener changed from `click` to `dblclick` — consistent with pick, avoids accidental burns.
- `_titlePfx` local: `'Burn — '` / `'View: '` / `'Browse: '`.

**Entry points updated** (all now show the three-item submenu):
- `#z-ash` click listener
- `#z-ash` contextmenu → `Browse…` sub (replaces flat `Browse…` + `Burn a card… (choose)`)
- `#dockAsh` click listener
- `selfPoolMenuItems()` pool right-click → `Browse ash heap (N)…` sub

**Shortcut `browseAsh`** still calls `browse('ash')` directly (pick mode) — keyboard shortcuts skip the menu, which is the right default.


## v1.44 – Ash heap browse: double-click to fetch + hover-able log (22 June 2026)

Ash heap `Browse…` now requires a **double-click** to take a card (was single-click). The ash heap is a public zone with no hidden-information implications, but the dblclick convention matches library and crypt, prevents accidental picks, and is consistent across all browse-to-hand paths.

**`browse()` `else`-block split:** the shared `else { d.addEventListener('click', ...) }` is now split into `else if(z==='ash')` (dblclick) and `else` (click, burned pile only). This matches the library/crypt branching style added in v1.33/v1.41.

**Log text improved:** was `'<b>'+escapeHtml(c.name)+'</b> was fetched from the ash heap.'` — now `cardRefCap(c)+' was fetched from the ash heap.'`. `cardRefCap` produces `<b class="clog" data-cid="...">Name</b>`, which makes the card name clickable/hoverable in the log (hover to preview in the aside, Ctrl+hover when collapsed). Same fix applied to burned pile log (was identical pattern).

**`browseNote` text added for ash:** `'Double-click a card to return it to your hand. The ash heap is public — the card name is logged openly.'` (was empty string for non-library, non-crypt zones).

**No reveal-menu for ash:** unlike the library (where the fetched card is secret), ash heap cards are public knowledge. The log line openly names the card (`cardRefCap`), which is correct VTES behaviour — no "Keep secret / Reveal to…" prompt needed.

**No network change:** `browse('ash')` is always offline (the early-return for `netGame()` only applies to library and crypt). No server-side patch needed.


## v1.43 – Attached cards stay with host in uncontrolled/torpor (22 June 2026)

Two-line change that makes attached library cards follow a vampire when it moves to the uncontrolled or torpor zone (via card effects), while remaining visually stacked under it.

**`move()` (line 2155):** `zone!=='ready'` → `!COUNTER_ZONES.includes(zone)`. Since `COUNTER_ZONES = ['ready','uncontrolled','torpor']`, this prevents `releaseChildren` from firing when the host moves between any of these three zones. Children retain their `c.host` reference and stay in `state.zones.ready`.

**`layoutZone()` torpor/uncontrolled branch:** Added `if(c.host) return` guard (safety, prevents rendering a child twice), then after placing each host card renders its attached children with the same `CX`/`CY` stack offsets used in the ready region: `place(kc, hx+CX*(k+1), hy-CY*(k+1), ...)` + `classList.add('stkk')`. Children in `state.zones.ready` are already skipped by ready's `if(c.host) return` — so they're rendered only once, by the uncontrolled/torpor pass.

**Why it's safe:** serialization (snapshot/restoreSnap) saves and restores `host` + `attached` arrays as-is, so undo/autosave/online-sync all work. When the vampire later returns to ready (enters play), `move(host, 'ready')` doesn't call `releaseChildren` (since we're going *to* 'ready'), so children come along — ready layout then renders them stacked, exactly as before.

**Not changed:** torpor stack rendering is also improved as a side-effect (torpor is in COUNTER_ZONES), though the primary use case is uncontrolled.

## v1.42 – Prevent cross-deck contamination in dropCard (22 June 2026)

Three guard fixes in `dropCard()`. `groupDrop()` was already correct (it uses `m.c.kind` to route each card to its own pile); `move()` only guarded crypt→ash. The drag path `dropCard` had no kind checks.

- **Pile drop (z==='library'||z==='crypt'):** `move(c, z)` → `move(c, dest)` where `dest = c.kind==='crypt'?'crypt':'library'`. Dropping a crypt card on the library pile (or vice versa) now silently routes it to its own pile. Mirrors what `groupDrop` already did.
- **Hand drop (z==='hand'):** Added `if(c.kind==='crypt'){ layout(); return; }` — crypt vampires dragged to the hand zone are silently rejected (no log, no move).
- **Uncontrolled drop (z==='uncontrolled'):** Added `if(c.kind!=='crypt'){ layout(); return; }` — library cards dragged to the uncontrolled zone are silently rejected. Crypt cards continue to work (this is the standard drag-to-influence path).

Note: attached children (library cards on a vampire) don't follow the host to uncontrolled anyway — `move()` calls `releaseChildren()` for non-ready destinations, so they stay in ready. The guard is still correct and safe.

## v1.41 – Crypt browse: dblclick to fetch + always reshuffle (22 June 2026)

Mirrors the library browse changes from v1.33, applied to the crypt in both browse paths:

**Offline `browse()` function:**
- Crypt branch split out of the shared `else` into its own `else if(z==='crypt')` block, changing the listener from `click` to `dblclick`. Ash heap and burned pile retain single-click (unchanged).
- Note text updated: `'Double-click a card to fetch it. The crypt is always reshuffled when you close.'`

**`#browseClose` handler:** `browseDirty &&` guard removed for crypt — `shuffleZone('crypt')` now fires unconditionally when `browseZone==='crypt'`, matching library behaviour.

**Online `netBrowseOpen()` function:**
- `click` listener changed to `dblclick` (fixes library too — single-click fetch was a v1.33 omission in the online path).
- Note text made pile-specific: crypt gets the new text; library gets `'Double-click a card to fetch it. The library is always reshuffled when you close.'`

## v1.40 – Crypt pile drag-to-influence / drag-to-park (22 June 2026)

Mirror of the library's drag-to-draw / drag-to-park feature (v1.35), adapted for crypt:

- **Drop on `#z-uncontrolled`** → calls `influence()` (draw 1 crypt card to the uncontrolled region)
- **Drop on ready region** → parks the top card face-down at the exact drop position (offline: direct move; online: `pendingRevealDrop + mpSend({t:'reveal', kind:'crypt', n:1})`)
- **Drop elsewhere** → cancelled, nothing happens

**Ghost:** `#cryptDragGhost` fixed-position div, crypt card-back image (`cardbackcrypt.jpg`), same 84×118 px / 78% opacity / `translate(-50%,-60%)` as the library ghost. Ring colours: **purple (`#8e44ad`)** = uncontrolled, **green (`#5ba85b`)** = ready (same green as library).

**Dock close on drag start:** when `cd.started` becomes true, the IIFE explicitly closes the dock panel so the drop targets (ready and uncontrolled, both above the dock) are unobstructed: `setL2Dock(false)` for L2/L3 home dock, `closeHand()` for the visit `#handPeek` panel.

**Wired to** `['#z-crypt','#dockCrypt']` via `forEach` — same two elements as the context menu. Uses `setPointerCapture` + global `pointermove`/`pointerup` listeners; 5 px movement threshold. Known caveat (same as library): sub-threshold tap on crypt while pointer is captured is silenced by `preventDefault` on `pointerdown`.

## v1.39 – Reveal top X from crypt (park face down) (22 June 2026)

New `revealTopCrypt()` function mirroring `revealTop()`. Prompts for a count, pops that many cards from `state.zones.crypt`, moves each to 'ready' face-down with the same staggered X offset as the library variant. Online: sends `{t:'reveal', kind:'crypt', n}`.

**Server `reveal` handler** extended: `isCrypt = m.kind==='crypt'` selects `p.game.crypt` vs `p.game.lib`. Response now always includes `kind: isCrypt ? 'crypt' : 'lib'` so the client knows which pile the cards came from. Wire-compatible: old client receives `kind:'lib'` and falls through to library behaviour.

**Client `revealed` handler** fixes: `makeCard(nm,'lib')` → `makeCard(nm, m.kind==='crypt'?'crypt':'lib')` so revealed crypt cards get the right type. Log line updated: `'of the library'` → `'of the '+(m.kind==='crypt'?'crypt':'library')`.

**Crypt contextmenu** updated: "Reveal top X… (park face down)" added to the forEach block, between "Burn top X…" and the separator before Shuffle/Browse.

## v1.38 – Burn top X from crypt (22 June 2026)

New `burnTopCryptN()` function mirroring `burnTopLibraryN()` for the library. Prompts for a count, then burns that many cards from the top of the crypt to the burned zone. Online: sends `{t:'pileTop', action:'burn', kind:'crypt', n}` — single round-trip, server loops.

**Crypt contextmenu** refactored from a single `#z-crypt` listener to a `forEach(['#z-crypt','#dockCrypt'])` that wires the same menu to both the board pile and the dock tile. New menu layout: Draw 1 / Influence / Undo — separator — **Burn top X…** — separator — Shuffle / Browse.

**Server `pileTop` handler** extended with `isCrypt = m.kind==='crypt'` branch: selects `p.game.crypt` vs `p.game.lib`, sends the correct `kind` field in each `sendDrew` call, and returns the right empty-pile error message. Wire-compatible: old clients without `kind` field fall through to `isCrypt=false` → library behaviour unchanged.

**Client `drew` handler** log message fixed: `'Burned the top card of the library'` is now `'Burned the top card of the '+(m.kind==='crypt'?'crypt':'library')` so online crypt burns log correctly.

## v1.37 – Fly-to-pile targets the collapsed dock handle (22 June 2026)

Follow-up to v1.36: when the dock (crypt/library/ash/hand) is **collapsed**, all four pile representations are `display:none`, so `pileAnchorEl` returned null and the fly animation was skipped. Now it falls back to the visible dock handle, so the card flies into the panel and disappears into it.

**`pileAnchorEl(pile)` fallback chain:** after the normal pile list (`z-library`/`dockLib`/`avLib`/`qrLib`, or `z-crypt`/`dockCrypt`) finds nothing visible, it returns the first visible of **`#l2dock`** (the folded-dock handle in L2/L3) or **`#handTab`** (the hand handle shown when visiting another board). Factored the visibility test into a `_visibleEl(id)` helper (offsetParent + non-zero rect) reused for both the pile list and the handle fallback.

**Visual result:** the handle is a wide, ~26 px-tall bar, so the clone's uniform `scale = min(1, tw/from.width, th/from.height)` collapses it toward the handle's small height — it visibly shrinks into the panel rather than landing as a full card. No change needed to `flyToPile`'s geometry; the new anchor just feeds it the handle's rect.

## v1.36 – Fly-to-pile animation on non-drag returns (22 June 2026)

When a card is returned to the library or crypt by any means **other than a mouse drag**, a quick clone now flies from the card's screen position to the visible pile, shrinking and fading as it lands. Drag-returns are deliberately excluded — the card already visibly moves under the cursor.

**`flyToPile(c)`:** Captures the card's `getBoundingClientRect()`, finds the first *visible* pile representation via `pileAnchorEl(pile)`, spawns a fixed-position `.flycard` div (the card's image — face if known, else the back), and CSS-transitions it (transform translate+scale + opacity) over ~300 ms (scaled by `conv.animSpeed`). Double-`requestAnimationFrame` ensures the start frame paints before the transition begins. Cleanup on `transitionend` with a `setTimeout` safety net. Honours `animMode==='all'` (animations off → no clone). Purely local — no network involvement.

**`pileAnchorEl(pile)`:** Returns the first on-screen pile element from a priority list — library: `z-library` → `dockLib` → `avLib` → `qrLib`; crypt: `z-crypt` → `dockCrypt`. Uses `offsetParent!==null` + non-zero rect to detect visibility, so it targets whichever representation the current view actually shows. Returns null (animation skipped silently) if none is visible.

**Call sites (all the non-drag return paths):**
- `returnToPile(c, pos, opts)` — gained an `opts.noFly` flag; calls `flyToPile(c)` before `move()` unless `noFly` is set. This covers the card right-click menu (Top/Bottom/Shuffle in), the hand menu's Selected-card return, and `returnRandomHandN` (which loops `returnToPile`, so each random card flies individually).
- `undoDraw`, `undoDrawStep`, `undoCryptDraw` — `flyToPile(c)` added before their `move(c,'library'|'crypt')` call. Conceptually an undo, but visually identical (a card leaves hand/uncontrolled for the pile), so the same feedback applies.

**NOT touched (drag paths):** `dropCard` and `groupDrop` — dropping a card or group on the library/crypt zone keeps moving under the cursor with no clone, as requested.

## v1.35 – Library pile drag-to-draw / drag-to-park (22 June 2026)

Dragging from the library pile (`#z-library`) or dock tile (`#dockLib`) lets the player route the top card to two destinations:

- **Drop on `#z-hand`** → draws 1 card (calls `drawCard()`, identical to a normal draw click)
- **Drop on the ready region** → parks the top card face-down at the exact drop position (equivalent to "Reveal top X=1", but placed where the pointer lands)
- **Drop anywhere else** → cancelled, nothing happens

**Ghost card:** A fixed-position `#libDragGhost` div (library card-back image, 84×118 px, 78% opacity, `transform:translate(-50%,-60%)` so it hovers slightly above the pointer) appears after a 5 px movement threshold and tracks the pointer. A gold ring (`ghost-hand` class, `box-shadow:0 0 0 3px #c8a84b`) appears when over `#z-hand`; a green ring (`ghost-ready`, `0 0 0 3px #5ba85b`) when over the ready region; no ring otherwise.

**Implementation:** Self-contained IIFE right after the existing `#z-library` click/dblclick listeners. Uses `setPointerCapture` so the ghost tracks the pointer even if it leaves the element. The existing click and dblclick listeners are fully preserved — if the pointer moves <5 px before release, the ghost never appears and the release fires as a normal click/dblclick event (because `pointerdown` calls `e.preventDefault()+stopPropagation` only after the element reference is saved, and `drawCard()` is called explicitly in `onUp` for the hand target — wait, actually: `preventDefault` is called on pointerdown. The click events on `#z-library` listen to `click`/`dblclick`, which are suppressed by `preventDefault`. The drag handler instead calls `drawCard()` directly in `onUp` for a hand-drop, so draw-on-click still works — **but** a non-drag (sub-5px move) falls through `onUp` with `tgt='cancel'` since `ld.started` is false. This means a sub-threshold touch on `#z-library` is silenced by `preventDefault`. **Only relevant for pointer devices** — mouse users always move a bit; touch users may notice a tap that produces no draw.

> **Known caveat:** `pointerdown` on the library calls `preventDefault()`, which suppresses the resulting `click`/`dblclick` events. The drag handler compensates by calling `drawCard()` directly on hand-drops, but a sub-threshold release (tap without movement) is treated as `cancel` and does nothing. This is acceptable for mouse play (users always move slightly); for touch-only play it may feel slightly dead. A future fix: call `drawCard()` in `onUp` when `!ld.started && tgt==='hand'` — but `tgt` is derived from `e.clientX/Y` which for a tap lands on the library itself, not the hand. To fix properly: treat `!ld.started` as "user tapped, don't intercept" and call `libDragCleanup` + let the click bubble. Deferred.

**Online ready-park:** Sets `pendingRevealDrop = {x, y}` (board canvas coords) before sending `{t:'reveal', n:1}`. The `revealed` network handler checks `pendingRevealDrop` and uses its coords for the first card's placement (subsequent cards from a multi-card reveal fall back to the default staggered formula). `pendingRevealDrop` is consumed (set to null) on first read, so it never bleeds into a subsequent unrelated reveal.

## v1.34 – Discard/Burn top X from library (22 June 2026)

Library right-click menu: "Discard top card" and "Burn top card" replaced by **"Discard top X…"** and **"Burn top X…"** — both prompt for a count and operate on that many cards from the top.

**Client:** Two new functions `discardTopLibraryN()` / `burnTopLibraryN()` — `_promptN()` for count, then offline: `pushUndo()` + loop popping `state.zones.library.at(-1)`, one log line per card + a summary line for n>1. Online: single `{t:'pileTop', action, n}` send (the server loops internally). The old `discardTopLibrary` / `burnTopLibrary` (single-card) are kept intact as the target for keyboard shortcuts, and also now include `pushUndo()` for consistency.

**Server:** `pileTop` handler extended with `count = Math.min(Math.max(parseInt(m.n,10)||1, 1), lib.length)` and a loop calling `sendDrew` for each card. Wire-compatible: old client sends no `n` → `parseInt(undefined)=NaN` → `||1` → single card, identical to before.

## v1.33 – Library browse: double-click to fetch + always-reshuffle (22 June 2026)

Two UX changes to the library `Browse…` modal:

**Double-click to fetch.** Each `.bcard` in the library browse now requires a `dblclick` to take the card to the hand (was single `click`). Single-click on a card still previews it via Ctrl+hover (unchanged). Burn mode (ash heap) and all other zones (crypt, ash, burned) keep their existing single-click behaviour — only `z==='library'` in `browse()` is affected.

**Reveal prompt after fetch.** Immediately after the card is moved to the hand (`move(c,'hand')`), a centred menu appears: "Keep secret" (no-op) at the top, then a separator, then the full `_revealToMenu([c])` list (All players / named opponents). This is the identical reveal flow used by the hand menu's `Reveal… → Selected card` path, so it works in solo (log only), hotseat, and online.

**Library always reshuffled on close.** `$('#browseClose')` logic changed: library shuffles unconditionally (`if(browseZone==='library') shuffleZone('library')`); crypt still only reshuffles when `browseDirty` (a card was taken). Note text in the modal updated to match: "Double-click a card to fetch it. The library is always reshuffled when you close."

## v1.48 – Send card… submenu + Set owner removed (22 June 2026)

**`cardMenu(c,x,y)` restructured** for cards in play (the `else` branch, covering ready/torpor/uncontrolled):

The flat sequence of zone-move items (`To torpor`, `Leave torpor`, `To hand`, `To ash heap`, `Burn`) is replaced by a single **`Send card… ▸`** submenu built dynamically from `sendSub`:

- **Crypt cards:** `To torpor` (if not already in torpor) *or* `Leave torpor` (if in torpor) + `To burned`.
- **Library cards:** `To hand` + `To ash heap` + `To burned` + `Return to library ▸ Top / Bottom / Shuffle in` (via `pileSub(c)`).

The `pileSub(c)` call that previously appeared as a top-level item is now nested inside the library arm of `sendSub`, keeping all destination actions together under one parent.

**`Set owner…` removed from the menu.** The `owner` field is preserved in the card model and the oust logic (`ousted()` still uses it to route foreign cards to the right ash heap), but manual editing of `owner` is not needed in normal play — `Give control…` covers the practical use-case (keeping a card in play through a controller's oust). A comment in the code marks the removed handler for future reference.

**`Give control…`** is unchanged in behaviour; it remains a direct top-level item below `Send card…`.

## v1.50 – cardFx actor mode: vampyr-spelar-kort animation (23 June 2026)

When a card is dragged from the hand to the ready region with an active (selected) vampire anchor, `cardFx` now plays with an **actor mode** layout: vampire (small, left) ➤ arrow ➤ played card (large, right). Previously, this drag path triggered no animation at all.

**`cardFx` opts.actor:** New option `{ actor: vampCard }` that reverses the visual order from the existing target mode. The main `cfximg` (the played card, already built first) stays large; the actor image is inserted as a `.cfximg.tgt` to the left of an arrow. The caption shows `"<vampire name> plays <card name>"` with the player label `"(seat · name)"` on a smaller second line via a new `.cfxsub` element.

**Call site in `dropCard`:** After the existing log line at the drag-to-ready branch, `if(a){ qrPhasePlayed.add(c.id); cardFx(c, 'play', { actor: a }); }` — only fires when there's an active anchor, mirrors the `qrPhasePlayed` pattern already used by `playOnActive`.

**Broadcast:** `actor` field added to the `t:'fx'` mpSend and to the `t:'fx'` remote handler, so online spectators/opponents see the same actor-mode animation.

**CSS `.cfx .cfxsub`:** Small secondary line below `.cfxcap`, 15px Cinzel, 70% opacity, for the player label in actor mode.

## v1.49 – Flip face up selected + face-down log inspect (23 June 2026)

**Three fixes:**

**1. `groupMenu` — "Flip face up selected":** New menu item added between `Unlock selected` and `Stack selected`. Calls new `groupFlipUp()` function (inserted just before `flipSelected()`). Only flips cards that are currently face-down; logs each card individually with `cardRefCap(c)+' flipped face up.'` (so the new clickable log link works immediately). Existing `flipSelected()` (keyboard shortcut F, toggles in both directions, single summary log) is unchanged.

**2. `cardRef` / `cardRefCap` — always include `data-cid`:** Face-down cards previously returned plain text `'a face-down card'` with no `data-cid`, making log hover/click and ctrl+hover non-functional. Fixed: face-down cards now return `<b class="clog" data-cid="...">a face-down card</b>` — same clickable element as revealed cards, but with generic text. The card viewer shows the back-face image (via `addRCard` which already handles `faceDown`).

**3. `findInspect` — allow face-down cards:** Guard `!lc.faceDown` on line 2791 prevented face-down cards from being found at all. Changed to `(!name || lc.faceDown || lc.name===name)` — a face-down card always matches by `cid` regardless of name (since we can't verify the name anyway). Same fix applied to the `net.boards` loop for remote cards.

## v1.51 – cardFx dubbelklick + hand-meny konsistens (23 June 2026)

**Dubbelklick** på handkort ändrat från `playOnActive` till `playFromHand` — spelar alltid till brädet, aldrig fäst på vampyr. Konsekvent med drag och med högerklicksmenyn "Play" / "Face-up".

**Hand zone högerklicksmeny** "Play card…"-submenyn fick ett tredje val: `Play on <vampyrnamn> (<kortnamn>)` — visas bara när en vampyr är markerad (via `activeAnchor()`). Byggs dynamiskt via IIFE. Anropar `playOnActive` → actor-mode-animationen triggas.

**`playFromHand` skickar aktör till `tagPlayed`:** `tagPlayed(c, a || undefined)` — samma mönster som `dropCard`. Alla play-vägar (dubbelklick, hand-meny Face-up, hand-meny Play on X) ger nu actor-mode-animationen när vampyr är markerad.

## v1.52 – cardFx caption-system fullständigt omskrivet (23 June 2026)

Alla `cardFx`-animationers caption reviderade till att spegla loggtexten, med kortnamn i `cfxwho`-färg och spelarnamn som kontext.

**Nya caption-format per situation:**

| Situation | Caption |
|-----------|---------|
| Vampyr spelar kort (actor mode) | `Dominique plays Govern the Unaligned` + `(Johan)` sub |
| Kort spelas på vampyr (target, ingen onto) | `Blood Doll was played on Dominique` + `(Johan)` sub |
| Spelare spelar utan vampyr | `Johan plays Dreams of the Sphinx` |
| Cross-table give (onto) | `Johan plays Blood Doll` + onto-chip i motspelararfärg (oförändrad) |
| Bring into play (rise) | `Johan brings Dominique into play` |
| Flip face up | `Johan reveals Dominique` |
| Flip face down | `Johan conceals Dominique` |
| Hand reveal | `Johan revealed 3 cards to Anna` |
| Lock/unlock | `Johan locked Dominique` / `Johan unlocked Dominique` |

**`toName` skickas nu** i `mpSend` för `t:'revealHand'` och i `t:'fx'`-broadcastet så online-motspelare ser rätt namn i sin handreveal-animation.

**Caption-blocket** omstruktурerat till en gren per `kind`+opts-kombination med `_dot`, `_who`, `_playerLabel`, `_cname()`, `_sub()` hjälpvariabler. Face-down-fallbacks: "a face-down card" / "a card" / "a vampire" beroende på kontext.

## v1.56 – Settings KRCG-beskrivning utökad (23 June 2026)

Card Database-beskrivningen i Settings → Convenience ersatt med en fyra-punktslista: (1) minion detection, (2) korttext + statistik i preview, (3) typordnad handsortering, (4) Deck Lab + katalog. Avslutas med graceful-degradation-notering och cache-info.

## v1.57 – Edge-knapp: anpassad tooltip via data-tip (23 June 2026)

`#edge` fick `data-tip="The Edge — grants +1 pool at Unlock"`. `title`-attributet togs bort helt för att undvika dubbla tooltips (native browser + anpassad).

**`cardTip`-systemet utökat:** `mouseover`-lyssnaren kollar nu `t.closest('[data-tip]')` som ett alternativt spår. Om ett `data-tip`-element träffas (och inget `.card`) visas `tipEl.dataset.tip` i `#cardTip`. Mekanismen är generell — vilket UI-element som helst kan nu få snabb tooltip med `data-tip`.

## v1.58 – nudgeFree: kort staplas aldrig helt (23 June 2026)

Ny hjälpfunktion `nudgeFree(wx, wy)` placerad precis före `playFromHand`. Provar 9 positioner i spiral; returnerar första position där minst 20px ("peek margin") av varje befintligt ready-kort syns. Fallback: slumpmässig vinkel med 30px offset. Patchad i `playFromHand`, `revealTop`, `revealTopCrypt`. `state.zones.hand`-arrayen muteras aldrig.

## v1.59 – Deck Lab: Load saved deck-lista (23 June 2026)

Ny `deckrow` ovanför precon-raden i Deck Lab med `#savedDeckSel` + `#labDelSaved`. `refreshLabDeckSel()` fyller listan från `loadDecks()`. Change-listener kör `loadParsedIntoEditor` + sätter `editDeck.name` och `editOrig`. Delete bekräftar och synkar båda select-listor. Kallas vid `openDeckLab`, `openDeckLabBeside`, `labSaveLib` och `newEmptyDeck`.

## v1.60 – Torpor-buggar fixade (23 June 2026)

**Bugg 1:** `dropCard` saknade `c.kind==='crypt'`-guard för torpor (uncontrolled hade det redan). Bibliotekskort kunde dras dit och hamnade i odefinerat tillstånd. Fix: identisk guard tillagd i `dropCard` och `groupDrop`.

**Bugg 2:** `restack(c)` använde `c.x/c.y` (kanoniska ready-koordinater) för att placera kort i torpor/uncontrolled. `c.x/c.y` uppdateras bara vid ready-placering; torpor-layout sätter korrekt position i `c.tx/c.ty`. Fix: `restack` väljer nu `c.tx/c.ty` för icke-ready-zoner.

## v1.67 – Baskortet överst vid stack-drag (23 June 2026)

`.card.dragging { z-index: 5000 !important }` — `!important` slog igenom oavsett inline z-index. Barnen fick `.dragging` och hamnade ovanpå hosten. Fix: ny `drag.hostGroup`-flagga som suppressar `.dragging` på barn i host-drags. Hosten behåller `.dragging` exklusivt → alltid överst.

## v1.66 – Stack drag-and-drop: barn följer baskortet (23 June 2026)

Single-card drag lossade alltid stacken (avsiktlig design). Ändrat: om `c.attached.length > 0` byggs `drag.group` med barnen (offset relativt host) + `drag.hostGroup=true`, och `releaseChildren` hoppas över. `move()` fick `keepChildren`-flagga. `dropCard` uppdaterad för ready (barnens kanoniska x/y uppdateras), torpor och uncontrolled. Nytt "Detach all attached cards"-val i `cardMenu` för baskortet.

## v1.65 – Hand-panelsortering fixad (23 June 2026)

`renderHand()` sorterade bara en lokal kopia → `#handRow` korrekt men `layoutZone('hand')` använde `state.zones.hand` i insättningsordning. Fix: `state.zones.hand.sort(handSortCmp)` in-place i `move()` direkt efter `push(c.id)` → alla renderingsvägar täckta.

## v1.64 – KRCG-typnamn korrigerade (23 June 2026)

`HAND_TYPE_ORDER` uppdaterad med exakta KRCG-strängar: `'political action':2`, `'action modifier':6`. `handTypeWords` förenklat till direktuppslag utan ord-splittning. `TYPE_LABELS` korrigerade. KRCG:s officiella typformat: enkla strängar som `"Action Modifier"`, `"Political Action"` — aldrig slash-sammansatta i enstaka element.

## v1.63 – Deck Lab: bibliotekskort per typ (23 June 2026)

Ny `.esubhead`-CSS och `elistLibrarySections(m, bucket)` ersätter platt alphabetisk `elistSection('Library',...)`. Grupperar med `handTypeTuple`, rubrik per sektion med antal, fallback till platt lista utan DB.

## v1.62 – Torpor hover-bounce fix: lx/ly (23 June 2026)

`restack` använde `c.tx/c.ty` (post-transform) → dubbel-`pubXform` i L2 → bounce. Fix: `layoutZone('torpor/uncontrolled')` sparar pre-transform `hx/hy` i `c.lx/c.ly`. `restack` använder `c.lx/c.ly` för icke-ready-zoner, `c.x/c.y` för ready.

## v1.61 – Edge-knapp klickbar i L2 (23 June 2026)


`#poolWrap` i L2 täckte `#edge` geometriskt (edge vid `pubXform(0.94*bw2, 0.668*bh2)` — mitt i pool-boxen). Z-index hjälper inte för syskon-element som absorberar pointer events.

Fix: `pointer-events:none` på `#poolWrap` i L2; `pointer-events:auto` på `#pool` och `#pname`. `wheel`- och `contextmenu`-lyssnare flyttade från `#poolWrap` till `#pool`. Edge-positionen oförändrad.

## v1.55 – Hand panel sorted by type then alpha (23 June 2026)


Cards in the Hand panel (visible in L2 Home, L2 Visit, and L3 Overview) are now displayed sorted left-to-right by library type first, then alphabetically within each type.

**Type order:** master → action → political → ally → retainer → equipment → modifier → reaction → combat → other (event, conviction, power, unknown).

**Implementation:**
- `HAND_TYPE_ORDER` constant (map of type string → numeric priority, 0–8; other = 99).
- `handTypePri(c)` — resolves a card's best (lowest) priority from `cardTypes` (the KRCG database map). Crypt cards in hand get priority -1 (float left as an edge case). Falls back to 99 if the DB is not loaded.
- `handSortCmp(a, b)` — comparator: primary key = type priority, secondary key = `localeCompare` on `c.name`.
- `renderHand()` — one new line `cards.sort(handSortCmp)` after the cards array is built, before rendering.

**Fallback:** if the card database is not loaded (`cardTypes === null`), `handTypePri` returns 99 for all library cards — the hand still sorts alphabetically, just without type grouping.

**Scope:** Hand panel only. The physical `state.zones.hand` array order is not mutated (sort is on a derived copy). Crypt/library/ash browse and play order are unaffected.

## v1.53 – Lock/unlock caption inkluderar kortnamn (23 June 2026)

Lock/unlock fallback-grenen i caption-blocket fick kortnamn: `Johan locked Dominique` / `Johan unlocked Dominique`. Kortnamnet renderas i `cfxwho`-färg. Face-down-kort visas utan namn (ingen läcka).

## v1.54 – Klick på klonanimation avbryter den (23 June 2026)

`wrap.addEventListener('click', ()=>wrap.remove(), { once:true })` tillagt på varje animation-wrap. Eftersom `#cardFx` har `pointer-events:none` på containernivå sätts `pointer-events:auto` och `cursor:pointer` direkt på wrappen — klick landar rätt utan att blockera brädet när ingen animation spelas.

## v1.68 – #poolHelp återinförd vid pool-cirkeln (23 June 2026)

`#helpToggle` hade förflyttats till `#l1zoomWrap` (zoom-raden uppe i hörnet) och var inte längre synlig vid pool-zonen. Nytt element `#poolHelp` (26×26px cirkulär ?-knapp) återinförd vid spegelvänd position mot Edge:

- **L1:** `right:124px; bottom:26px` (Edge är `right:124px; bottom:122px` — identisk höger-offset, men längs pool-globens underkant)
- **L2 columns:** `pubXform(0.845*bw2, 0.915*bh2)` — nedre vänstra av pool-boxen (Edge är övre högra)
- **L3:** `pwRight+4+(26+6)px` — 6px gap till höger om Edge i pool-stripen

Delar `#helpOverlay` med `#helpToggle`. Separat click-IIFE synkar `.on`-klassen på båda knapparna. `data-tip` ger tooltip via `cardTip`-systemet. Inkluderad i alla clearL2-reset-arrayer.

## v1.68 – #poolHelp återinförd vid pool-globen (23 June 2026)

`#helpToggle` hade förflyttats till zoom-raden. Nytt `#poolHelp` (26×26px cirkulär ?-knapp) placerad i L2/L3 spegelvänd under Edge:

- **L1:** `display:none` — knappen är bara relevant i L2/L3.
- **L2 columns:** `pubXform(0.94*bw2 + 6/l2pub.s, 0.861*bh2)` — samma x-linje som Edge + 6px kompensation för breddskillnad (Edge 32px, poolHelp 26px), y spegelvänd under pool-globens mittpunkt med samma avstånd som Edge har ovanför. Skalas med `l2pub.s`.
- **L3:** 4px till vänster om pool-name-clustret.

Delar `#helpOverlay` med `#helpToggle`. `data-tip="Help"`. Inkluderad i clearL2-reset-arrayer.

## v1.69 – sfxSilent(): ljudtriggers stängs av vid vol=0 (23 June 2026)

Ny `sfxSilent(ch)` helper (placerad efter `sfxGain`): returnerar `true` om master (`conv.sfxVol===0`) eller kanalens individuella volym är 0. Guards lagda som första rad i alla 10 sfx-triggerfunktioner (`bell`, `heartbeat`, `sfxSweep`, `sfxPlayCard`, `sfxDiscipline`, `sfxConclave`, `sfxFinalDeath`, `sfxWarded`, `sfxHoldOn`). Vid vol=0 avbryts funktionen innan `actx`, `sfxMakeReverb` eller någon Web Audio-nod skapas.

## Phase 0 - refactor groundwork: edge-verb bug-fixes, a second dead-code sweep, a client logic suite, a debug ring buffer (24 June 2026) [client 1.99.28 / server 1.8]

Groundwork before the planned 2.0 refactor. A full code audit + refactor plan lives in **elysium-refactor-analysis.md** (delivered this session); the single-file question was settled there as **fork B1** - keep the *artifact* one double-clickable file, but allow the *source* to be flat script fragments sharing one scope, concatenated into the HTML with a byte-identical-diff gate. No build step, no import/export. Nothing structural was moved yet - Phase 0 is fixes + a safety net first.

**Edge-verb server bug-fixes.** The `edgePass`/`edgeTake` pair shipped *wired but never live-tested* (hotseat is primary, so the online handoff path had quietly rotted). Four latent bugs, all fixed:
- `edgePass` looked up the target by `room.players.find(x => x.seat === toSeat)`, but player objects have **no `.seat` field** - seats are only computed inside `roster()`. Fixed to index `room.players[toSeat-1]`.
- the `edgePass` relay dropped the `pos` field the client sends (`pos:dropPos`) and the receiver reads - so a handed-off Edge ignored its drop coordinates. Now forwarded. (The coordinate model is mat-relative -> shared canonical box, so `pos` is portable across boards.)
- `edgeTake` forwarded the client's `bySeat` raw; the server now **derives** identity (`room.players.indexOf(p)+1`) and never trusts a client-sent seat.
- both verbs lacked an `if(!room.started) return;` guard; added.

Server-only - the client HTML was untouched for these. **Version, two things to reconcile (your call - you know your deployment):** the source server is `const VERSION='1.7'` on its own decoupled 1.x line (1.6 -> 1.7 -> **1.8** this session); the delivered server is **1.8**. (a) The v1.90-v1.99.26 notes call the server "1.99.18" - that's a numbering slip; the edge verbs actually live in the 1.x server, so treat the code's `VERSION` as authoritative. (b) Because the client is `1.99.28` and the server `1.8`, the join-time check fires its **non-blocking** "version mismatch" warning online - a known, accepted state (the journal records online as secondary to hotseat). If you want that warning gone, sync the server `VERSION` to the client's number; otherwise the 1.x line is fine.

**Second dead-code sweep (client).** Distinct from the v1.99.27 sweep (which *parked* revivable features). This removed genuinely-dead developer scaffolding - `demoBoard`, `fillTableDecks`, `startDemoTable`, `promptDemoTable`, `applyL2Experiment`, `thump` (+ the commented-out `thump` calls, a stale `.l2pane` contextmenu allow-list entry, and its CSS). Because these were never-reachable cruft (not parked features that might return), they were **deleted outright rather than archived** to kodarkivering.md - that file holds parked-but-revivable code, not dead scaffolds. **`stopDemoTable` was renamed `leaveHotseat`** (definition + both call sites) to say what it actually does. Kept (verified live): `DEMO_NAMES` (still used by the Offline-setup seeding), `startHotseat`, `fillOfflineTable`, and `.l2pane2` (12 live uses).

**Client logic suite + shared harness.** New `test-client-logic.js` loads the real client `<script>` in Node under a compact Proxy DOM stub (`elysium-test-harness.js`) and asserts the contracts most at risk during the refactor: `pubXform`/`pubInv` round-trip to identity; `serialize -> restore -> serialize` is idempotent (modulo the `t` timestamp); `restore` preserves pool/zones/card fields; `buildPub` omits the hand and reports only its count (the client-side secrecy guarantee - face-down *name* stripping is the server's `sanitizePub` job, not the client's); `restoreGame` rejects garbage without throwing; `baseView()==='l2'`; and the debug ring buffer captures + dumps. 8 assertions, all green against 1.99.28. Because it drives the *live* functions, it's a real regression gate for module extraction - not a copy that can drift. (Writing it surfaced that `baseView` had already been simplified to a one-liner in v1.99.27, so a config-matrix test would have been testing a stale contract - read the code, don't trust the plan.)

**Debug ring buffer (`conv.debug`).** The client had zero `console.*` and no diagnostic channel, so online desyncs were invisible. Added a capped (200-entry) ring buffer fed by `dbg(tag, e)`, wired into the silent catches where desyncs hide - the `mpOnMsg` network dispatch, escrow key-derivation, hand-blob decrypt, and escrow encrypt - plus global `error`/`unhandledrejection` capture. The buffer **always** records (independent of the flag); `conv.debug:true` additionally mirrors each new entry to `console.warn` live. Dump anytime from the browser console with **`elysiumDbg()`**. The benign `c.el.remove()` catch was left silent (expected to miss sometimes - logging it would be noise). MVP: console accessor, no About-panel button yet.

Verified: client JS syntax clean; `node test-client-logic.js` 8/8 (incl. against the patched client - confirming the sweep + ring buffer didn't touch core logic); the server edge fixes are byte-level confirmed in the delivered file. **Not** runtime/online-tested (sandbox can't render or network) - Johan to verify the Edge handoff live with two clients (drag Edge onto an opponent's Ready -> lands at the drop spot; take the Edge via the button -> it vanishes for the prior holder and the log names the right player).

## v1.99.27 - Pre-2.0 cleanup: parked L1-Simplified choice, the Alt views, the round table (24 June 2026)

A deliberate dead-code sweep ahead of the 2.0 refactor (client-only; server stays 1.99.18). Removed source is archived verbatim in the new **kodarkivering.md**, and every removal site carries a `// PARKED -> kodarkivering.md` breadcrumb.

- **L1 / Simplified is no longer a *chosen* view.** The "Default table view" Normal/Simplified setting was removed and the home view is forced to **Normal** (`conv.defaultView` hard 'normal'; the online `mpView` host-lock dropped its Simplified option). **L1 itself is NOT gone** - it is still the base layer the view system builds on (L2/L3 are CSS classes added on top; `exitL2`/`exitL3` return you to it) and `baseView()` still falls back to it for a one-live-player table (`opp ? 'l2' : null`). Fully retiring L1 would mean routing one-player tables through `l2solo` - a behaviour change saved for 2.0. The **Play solo** start-screen button and the **Solo** menu item were removed; a lone player now enters via **Offline** (the modal seeds You + one opponent; shrink to one seat to goldfish). "Offline - hotseat" in the menu was renamed **Offline**.
- **The Alt views are parked.** Both reaction surfaces - `#altview` (the full-screen Reaction window tray) and `#qrbar` (the Quick React strip) - plus the header `#btnReact` button, the Alt/Escape keydown handler, and the "Quick React strip" setting are gone. The **Played** and **Ready** tabs cover the same ground non-modally; `renderAltIfOpen()` survives as a slim tab-refresh shim. **Crucial boundary:** the card renderers/interactions (`avRenderCard`, `qrCard`, `qrTap`, `qrHandDown`, `qrDragGive`) and the `.qr*` CSS classes are **shared** with the Played/Ready tabs + the dock, so they stayed live - only the two tray/strip *containers* and their render/open/close functions were parked.
- **The L3 circle/round table is parked.** Square (Lackey-style) is the only helicopter layout now: `effectiveL3Shape()` hard-returns `'square'`, the `l3slots()` circle branch is archived, and the "Level 3 table shape" setting + the online `mpShape` lock are removed. The already-dead `renderOval()` (a pre-L3 oval overview, never called) and its `.ovalfelt` CSS were archived too.

Verified: client JS syntax clean (`node --check`) + a static pass confirming no dangling calls to any parked function. Not runtime-tested (sandbox can't render); Johan to verify live.

**Navigation block (addendum, same version).** In addition to removing the setting, the navigation paths were locked to never land on L1 within a match: `baseView()` always returns `'l2'` (was `null` for solo / Simplified), `levelOrder()` is `['l2','ov']` (was `[null,'l2','ov']` / `[null,'ov']`), and `stepLevel(-1)` from a Visit goes to `'l2'` (was `null`). The four existing `switchView(null)` calls are all game-teardown (leave room, demoted, disconnect, stop hotseat) — not navigation — and were left as-is. `skipL2` has been fully removed (setting, loader, listener, UI — zero references remain). A one-player table landing in L2 is handled by `renderL2`'s existing solo branch (your board centred full-area with the same dock as column mode).

## v1.90–v1.99.26 - L3 Overview build-out + the Edge token handoff system (24 June 2026)

A long iterative arc. Two big features and a lot of coordinate-space debugging.

**The L3 "helicopter" pool zone (v1.90–v1.99.10).** Your own board's pool zone in L3 now renders exactly like the other zones (Uncontrolled/Torpor/Ready): `pubCanon('pool')` (added to `pubCanon`) → `pubXform` position → `l2pub.s` size, with the globe sized by the same fraction-of-zone formula as the opponent mat globes. The dock panel gained a **separate** pool widget — `#z-pool` zone + `#dockPool` globe (its own `#dpplus/#dpminus`/wheel/right-click → `bumpPool()`), because one `#poolWrap` can't be both the slot zone and the dock widget at once; `updatePool()` syncs both. The zone label scales like `.matzlab` (`l2pub.s*15`). Wheel-zoom is suppressed while the dock is open; dragging a hand card out closes the whole dock.

**The Edge token (v1.82 foundation → v1.99.26).** The Edge is now a draggable physical token that hands off between players. The hard part was coordinates and the hotseat three-layer model — see learnings for the full set. Key mechanics as shipped:
- **Token rides pan/zoom** by living on `#board` and being re-placed by `applyL3Transform` via `pubXform` (the same path as ready cards). `pubInv(pubXform(x))===x` keeps drag→drop from snapping. (An attempt to put the token *inside* `#l3stage`, v1.99.9, cascaded into pointer-events/double-transform bugs and was reverted in v1.99.11.)
- **The Edge BUTTON** (`#edge`) follows the table too: `setCenterFrameA` positions it with `Px+Z*(…)` below the centre clock (`l3clockCy`), and v1.99.25 added `scale(Z)` so its *size* scales (fixing an inverse-zoom). v1.99.19 limited its CSS transition to visual props so it doesn't glide-and-snap during a pan.
- **Handoff = drag onto a Ready zone.** `readyZoneAt(cx,cy)` (geometric) gates drops: opponent's Ready → handoff; own Ready → reposition (keep the Edge); anywhere else → snap back. Drop position is computed **mat-relative** (fraction of the target mat → shared canonical box), never `pubInv`'d in your own slot's space.
- **Token renders on every board** via `buildPub().tokens` + `buildMat` drawing `pub.tokens` (read-only) — so it shows on opponents' mats in the overview and when you pass the turn in hotseat.
- **The BUTTON is authoritative** (`edgeTakeover`): taking the Edge trumps a prior handoff — clears edge+token across all stored boards, all pub views, and online via the `edgeTake` broadcast, then re-seats one token in your Ready.
- **Persistence:** `serializeGame` stores `edgeTok:{x,y}`; `restoreGame` re-seats the token there (a handed-off Edge keeps its drop spot when the receiver becomes active in hotseat).

**Server (v1.99.18):** two new verbs — `edgePass` (relay a drag-handoff to the target) and `edgeTake` (broadcast a button-takeover so the prior holder loses it). Both needed a server bump.

**L3 chrome polish (v1.99.20–v1.99.24):** zoom/help toggle buttons stacked vertically (zoom on top) and nudged; the zoom slider panel moved into `#tableArea` so it shares the buttons' coordinate system and sits bottom-aligned to the zoom button's left; buttons ~5% smaller in L3.

## v1.82 - The Edge as a draggable token; a reusable Token family (23 June 2026)

After two abandoned approaches (v1.80/v1.81 below), the Edge is now a **self-contained Token family** that never touches the card model.

**The Token system (the key artifact, placed right after the Edge functions):**
- **`TOKEN_DEFS` registry** — each token type declares `label`, `size`, `svg(sz)` (its look), and `menu(tok)` (right-click items). The Edge is the first member; new tokens drop in here and get drag/placement/menu automatically.
- **`tokens` Map** (`id → {id, type, x, y, z, tx, ty, el}`) — **separate from `state.cards`/`state.zones`**, so the entire card pipeline (drag/drop/animations/serialize/buildPub) is untouched. `x/y` are canonical board coords, exactly like ready cards.
- **`makeToken(type,id)` / `removeToken(id)`** — create/destroy a token element (`<div class="token tok-TYPE">`).
- **`placeToken(tok)`** — positions it, borrowing `place()`'s scale math: `if(l2pub.on){ pubXform }` then `cardTransform(x,y,0,s)`. Because rot=0 reduces cardTransform to translate+scale from origin, the token's own (non-CW) size scales correctly in L2/L3.
- **`layoutTokens()`** — re-places all tokens; **called in `layout()`** after `renderPhaseCounts`.
- **`bindTokenDrag(el,tok)`** — own drag, replicating `bindCard`'s move math (`f` scale factor, `ox/oy` offsets) but **without** the zone/move/dropCard logic that needed `state.zones` membership. On drop it stores canonical coords via `pubInv` AND re-places the token (see drag-jump learning).
- **`tokenMenu(tok,x,y)`** → `showMenu(def.menu(tok), x, y)` (the existing menu system; items are `{label, fn}`).

**The Edge member:**
- `ensureEdgeToken()` — creates the `edge` token in the Ready region's lower-right (`zoneRect('ready')` → `pubInv`), guarded by `conv.edgeToken`.
- `removeEdgeToken()`, `burnEdge()` — burn sets `state.edge=false`, removes the token, logs "<name> burned the Edge."
- Hooked into `toggleEdge` (create on take / remove on release), `restoreGame` (recreate from `state.edge`), `clearTable` (cleared alongside cards), and the `convEdgeToken` setting.

**Look:** an upward-pointing filled triangle — stone-gradient fill (`#54545c→#3c3c43→#29292f`), dark beveled-shadow outer edge (`#1f1f26`, no gold), a light-grey inner bevel-highlight polygon, two faint concentric pattern triangles, and the bone-white VTES symbol centred over the inner pattern (`translate(30,40) scale(0.04)`). `size:100` (~double the old token). CSS `.token` has `will-change:transform` + a drop-shadow and **no transition** (instant drag).

**Setting:** "Show The Edge as a felt token" (`conv.edgeToken`, default on).

**Known limits (next steps):** token is local-only (opponents don't see it yet — needs opponent rendering via pub); position is not serialized (recreated at the default corner on hotseat-swap/load); burn/release are not yet exclusive across players or relayed online.

## v1.80-v1.81 - The Edge token: two abandoned approaches (23 June 2026)

Both reverted; kept as a record of what NOT to do.

**v1.80 - fixed-position element:** a `#edgeToken` div pinned to the board with `right%/bottom%`. Rejected because a pinned element drifts with the board edge when panels fold in/out — it does not sit on the mat like a card.

**v1.81 - Edge as a real card (`kind:'edge'`):** made the Edge a `state.cards` object to inherit drag/place/scale "for free." This **broke core card handling** — clone animations stopped, dragged cards jumped far below the cursor, and cards could be dropped anywhere (zone snapping gone). Exact mechanism not pinned down live, but the lesson is firm: a non-card object inside `state.cards`/`state.zones` violates assumptions across the card pipeline. **Reverted fully to v1.79.**

## v1.79 - VTES symbol vectorised inline (23 June 2026)

Johan uploaded `vtessymbol.png` (2400×2400, black triskelion on transparent). Vectorised with cv2 `findContours(RETR_CCOMP)` + `approxPolyDP(eps 0.0015)` + even-odd fill (straight lines beat Bézier for the sharp points), 97.4% IoU, ~3KB path.
- **`VTES_SYMBOL_PATH`** constant (viewBox `0 0 1000 1000`).
- **`vtesSymbol(opts)`** helper (after `clanSymBadge`): `opts` = size / fill (default currentColor) / opacity / cls / title; returns an inline `<svg class="vtesmark">` string with `fill-rule="evenodd"`. CSS `.vtesmark{display:inline-block; vertical-align:middle; flex:0 0 auto}`. Covered by the Dark Pack licence. Reused as the heart of the Edge token (v1.82).

## v1.78 - Clan symbol badge: reusable template + Table tab + animations (23 June 2026)

Clan symbols were dark-on-dark and invisible in the Table tab. Fix grew into a reusable badge template.

**Reusable template (the key artifact):**
- **CSS class `.clanbadge`** (near the `.srow` rules): scalable via the `--cb-size` CSS variable (default 20px). Bone-white filled circle (`background:#d9cfb6` = `--bone`), `border-radius:50%`, `box-shadow:0 1px 3px rgba(0,0,0,.5), inset 0 0 0 1px rgba(0,0,0,.15)` (outer drop shadow + subtle inner edge). Icon (`.clanbadge img`) is `calc(var(--cb-size)*0.80)`, with **absolute** offset `margin-left:2px; margin-top:1px`.
- **JS `clanSymBadge(clan, sizePx)`** (after `clanSymEl`): returns a `<span class="clanbadge">` with the clan icon; `clan=null` → invisible placeholder that keeps its width. Use `.outerHTML` to embed in an innerHTML string. Re-style per context via `.ctx .clanbadge { --cb-size: 28px }`.

**Applied to:** the Table tab (`statRow` — replaced the hardcoded `.sclancel` span, now removed) and all six cardFx caption variants (new `_whoB` = player name + 16px badge, no space, swapped for `_who` in every `cap.innerHTML`).

**Offset lesson:** proportional offset (`calc(--cb-size*0.05)`) was too small at 16px (0.8px) and pulled the icon left; absolute `2px/1px` works at every size.

**Paths investigation CLOSED:** verified against the real `vtes.json` (102 vampires) + the card *Aaradhya, The Callous Tyrant* field-by-field. **No `path` field exists on cards.** "Path" appears only in `sets[setName][].precon` (the SV5 precon-deck name, e.g. "Path of Power and the Inner Voice"). Even *sect* is not structured data - it lives in `card_text`. So path affiliation cannot be auto-detected like clan; if path support is built, manual choice in the `⚝ Choose clan…` menu is the clean path (the `/svg/path/` routing already exists).

## v1.77 - Public clan logging with player name (23 June 2026)

`log(msg)` without `localOnly` already relays in online + shows in the shared hotseat log, so the clan log was already public - it only lacked the name. Added `clanLogName()` = `net.you || state.playerName || 'Player'` (net.you = online you / active hotseat seat; state.playerName = solo; note state.playerName does NOT update on hotseat seat-swap, so net.you must come first). All four clan log lines now read "Clan affiliation for <name> changed to <clan>." (move, tagPlayed, manual choice, auto-detect). Added `scheduleSave()` to the two manual-choice handlers (manual choice only called refreshClanDisplay() = no board push, so online opponents' symbol wouldn't update until the next board change; auto-detect via play/move already pushes). Minor known redundancy: online receivers see the server `[name]` prefix plus "for name".

**Paths TODO:** KRCG has no path field on cards (verified against OpenAPI v3.4); paths are separate library master-cards ("The Path of Caine" etc., the four with `/svg/path/` SVGs). Path affiliation can't be auto-detected from vampires' clans like clan is - needs a different source (path master-card in play, or manual choice) when we build path support. `CLAN_PATH_SLUGS` + `/svg/path/` routing already in place to render the symbol once the source is decided.

## v1.76 - Clan watermark on opponent pool globes (23 June 2026)

Extended the v1.75 watermark to opponents via the shared `renderBoard` mat renderer, sourced from `pub.clan` (works online + hotseat). `.clansym-pool` CSS generalised from `#pool`-scoped to global. L2 columns + Visit globe (`g`): clan `<img class="clansym-pool">` added to the globe's innerHTML (same clip-path/z-index as own globe). L3 Overview (`pv`): no opponent globe exists there, so the symbol sits in the pool zone behind the numeral (`opacity:.4`, `pv` got `z-index:1`). `renderFull` (L1-base Visit) unaffected (pool shown as text).

## v1.75 - Pool globe clan symbol as watermark (23 June 2026)

`.clansym-pool` changed from a small icon below the numeral to a large centred watermark filling the globe: `width/height:90%`, centred, `opacity:.5`, `z-index:1`, `clip-path:circle(50%)`. `.poolnum` got `position:relative; z-index:2` (numeral above the watermark); `.pbtn` got `z-index:4`. Layer order: red gradient -> clan symbol -> numeral -> +/- buttons. `clip-path` (not `overflow:hidden`) clips the square SVG corners to the circle, because the +/- buttons sit outside the 96px globe. Applies to `#pool` (own live globe, all views); opponent globes carry the symbol next to the name instead.

## v1.73-v1.74 - Clan symbol KRCG data corrections (23 June 2026)

**Verified against KRCG OpenAPI (`api.krcg.org/openapi.yaml`) + KRCG's own deck export.** Key facts now documented in learnings:
- KRCG `clans` field uses **legacy VEKN names** ("Assamite", "Follower of Set", "Tremere antitribu"), NOT V5 names.
- SVG filenames are NOT synced with the clans field - 7 names need explicit mapping (`CLAN_SVG_MAP`): Assamite->banuhaqim, Follower of Set->ministry, plus 5 plural forms (Abomination->abominations, Ahrimane->ahrimanes, Gargoyle->gargoyles, Daughter of Cacophony->daughtersofcacophony, Harbinger of Skulls->harbingersofskulls). The other ~40 (incl. all antitribu) match `normClan()`.
- Correct SVG base path is `/svg/clan/` and `/svg/path/` (v1.73 fixed the missing `/svg/`).

**v1.73:** Corrected base path to `/svg/clan/`; added `CLAN_PATH_SLUGS` for `/svg/path/` (dormant - paths never appear in clans data).

**v1.74:** Fixed split-on-whitespace bug that destroyed multi-word clans ("Follower of Set"->"Follower"). `loadCardDB` now stores `clansArr` (the preserved array) alongside `clans` (joined string for cardTags). `detectClan` + `clanChoiceItems` use `clansArr[0]`. Added `CLAN_SVG_MAP`. Unit-tested isolated: 46/46 KRCG clans map to a known SVG file.

## v1.72 – Clan symbol system (23 June 2026)

`state.myClan` (auto-detected majority clan among ready vampires) + `state.chosenClan` (manual override). `activeClan()` = `chosenClan || myClan`. `detectClan()` counts clan occurrences in `state.zones.ready` using `cardInfo.clans` split. `updateMyClan()` recomputes and calls `refreshClanDisplay()`. Hooks in `tagPlayed()` and `move()` (when crypt card enters/leaves ready). Clan change logged.

`clanSymUrl(clan)` → `https://static.krcg.org/clan/<normclan>.svg`. All `<img>` elements have `onerror→display:none` fallback.

`buildPub()` carries `clan: activeClan()||undefined`. Pool context menu (`selfPoolMenuItems`) gets `⚝ Choose clan…` with dynamic `clanChoiceItems()` submenu (✓ marks active; Auto-detect at bottom).

Rendered at: pool globe (`.clansym-pool`, absolutley centred below numeral, 28% diameter, opacity .55), `#pname` prefix (14px, via `renderName()`), `rvTitle`, L2 collapsed + expanded headers, L3 mname-div, turn notice, Table-tab (new 18px clan column, header ☽). cardFx `'rise'`: `.cfxsub` with 22px symbol + clan name if `activeClan()` is set.

Serialized in `serializeGame`/`restoreGame`. `clearTable` resets both fields.

## v1.68–v1.71 – Pool-zonen, Visit-overlay, ljud, Table-tabb (23 June 2026)

**v1.68 #poolHelp:** 26px cirkulär ?-knapp syskon till `#edge`. L2: `pubXform(0.94*bw2 + 6/l2pub.s, 0.861*bh2)`. L3: 4px vänster om pool-clustret. Delar `#helpOverlay`. `shuffleFx()` = no-op pending redesign.

**v1.69 sfxSilent(ch):** Guard-helper efter `sfxGain` — returnerar `true` om master eller kanal = 0. Lagd i alla 10 sfx-triggerfunktioner som första rad, stoppar Web Audio-grafen helt.

**v1.70 Unlock-puls:** `.phase.yt-pulse` kör `ytPulse` + `ytPulseOutline` synkat 0.9s. Läggs på i `startYourTurn`, tas bort i `endYourTurn`. Outline = `#dcb872` (kortmarkeringsfärgen).

**v1.70 rvBack:** `position:absolute; right:16px` — aldrig blockerad av Played-tabben.

**v1.70 rvTitle:** `innerHTML` med spelarnamn + 🪑 + sätesnummer i `seatColor.hex`. 🪑 = `\U0001FA91`.

**v1.70 Hand-zon:** `right:auto; width:440px` i L2/L3 — fast bredd oberoende av vänsterpanelen.

**v1.71 #pseat:** Syskon till `#edge`. `setCenterFrameA` L2: `pubXform(0.845*bw2, 0.668*bh2)` + `{+40, +6}px` offset, `transformOrigin:'100% 0'`. `setPname()` sätter `🪑N` utan mellanslag i spelarfärg, 15px Cinzel. Dolt med `body.invisit`. Edge också dolt vid `body.invisit`.

**v1.71 Table-tabb:** 8-kolumners grid (`14px 1fr 28px 30px 34px 34px 30px auto`). Ny `.sseatcol` med `🪑N` i spelarfärg efter namnkolumnen.

## Fas 1 — handler-maps, modaler, B1-konkatenatorn (24–25 juni)

The structural, low-risk phase (analysis Phase 1). Client **1.99.28 → 1.99.34**; server **1.8** (unchanged — no new wire verbs).

- **Handler-map dispatch (client + server).** `mpOnMsg` is now a thin parse + lookup into `MP_HANDLERS = { verb(m){…} }` (39 handlers); the server's in-game chain is `GAME_HANDLERS = { verb(conn,room,p,m){…} }` (45 handlers). The server's **staged** pre-dispatch (`create`/`join` before a room exists → spectator phase → game handlers) is deliberately *not* mapped — only the in-game chain is. Unknown verbs are ignored silently (else-less).
- **Modal system.** `uiDialog(opts)` + `uiAlert`/`uiConfirm`/`uiPrompt` (Promise-based) over the existing `#overlay`; `#dialogModal` markup. Remembers + restores the modal underneath (`shownModal()`), capture-phase Esc/Enter/backdrop. **All 49 native `prompt`/`alert`/`confirm` are gone** — converted to async modals (touch prerequisite ticked). The over-limit discard confirm lives in `discardGateOK(c)` (UI layer), not in `move()` (which stays pure + synchronous).
- **B1 concatenator scaffolding.** `split_client.py` (splits the single file into `elysium-src/` fragments sharing one scope) + `elysium-build.js` (~50-line zero-dep concatenator, reassembles via a `/*@@ELYSIUM_APP_JS@@*/` placeholder). The single file stays source-of-truth; the fragments are derived and re-split after each patch, with a byte-identical `cmp` as the gate. First leaf module: `esc-crypto.js`.
- **Test layer.** `test-client-logic.js` → **16 assertions** (the `mpOnMsg` routing tests, the hotseat-log `keepLog` guard, and the Phase 2 state-contract depth: single-zone `move` invariant, attachment round-trip, id/position survival, `buildPub` purity); new `test-server-dispatch.js` (3) drives the server's `handle()` / `GAME_HANDLERS` via `loadServer` in the shared harness. Run: `node test-client-logic.js` and `node test-server-dispatch.js`.
- **Hotseat turn-log fix (1.99.33).** `keepLog` now gates `state.turnLogs` in both `clearTable` and `restoreGame`, so the shared turn-history survives seat swaps (previously only the creator's turns survived a lap). Live `#log` = current turn (cleared each pass, by design); the turn-dropdown = the full shared history.

> Phase 1 is **not yet runtime/online-verified** — syntax + 12/12 logic suite + byte-identical builds only. Johan to test live. **Server-version sync (to silence the online mismatch notice) is deferred until everything is done** — Johan's call. **Phase 2 (leaf-module extraction) is underway** (`sfx`, `fx` carved byte-identically); its documentation lands when the phase completes.

## Fas 2 — module decomposition: leaf/feature extraction, helpers registry, core seams, relocation (25 June 2026) [client 2.0 / server 2.0]

Phase 2 of the refactor (analysis `elysium-refactor-analysis.md`). Mostly **byte-identical extractions** via the B1 concatenator (the monolith stays source-of-truth; `elysium-src/` is the derived, re-split fragment set) plus one real refactor, one server fix, and a **full concern relocation** (the final step).

**The B1 fragment set (13 fragments), in source order:**
`app-1 · decklab-editor(leaf) · app-2 · tokens-engine(leaf) · app-3 · esc-crypto(leaf) · net(core seam, includes escrow) · app-4 · hotseat(feature) · app-5(state+render+input clusters) · sfx-audio(leaf) · fx-anim(leaf) · app-6`. Build pipeline: `split_client.py` (anchors on plain-ASCII section comments) → `elysium-build.js` (manifest-driven) → verify via `node --check` + test suite + split→build round-trip. Glue between named fragments is numbered `app-1..app-6`. **Note:** `cmp` against the pre-refactor original is NOT the gate for the relocated file (source order intentionally changed); `cmp` against the *current* split→build output IS the gate for the splitter's integrity.

**What got extracted:** five **leaves** (self-contained, contiguous) — `decklab-editor`, `tokens-engine`, `esc-crypto`, `sfx-audio`, `fx-anim`; one **core seam** — `net.js` (`inRoom → pushEscrow`: transport, `MP_HANDLERS`/`mpOnMsg`, lobby, online-sync, hand-escrow functions; bisected from its `MP_KEY` header by the esc-crypto leaf); one **feature** — `hotseat.js` (offline core + setup window; `giveHot` stays in glue).

**Helpers registry (1.99.37, a real refactor):** `HELPER_DEFS = [{key, el}]` (one array, ~line 6150) now generates the `helper` defaults, the localStorage round-trip, the `syncHelperUI` checkbox sync, and the change-handler wiring — the 8 helper keys were previously enumerated in four JS places. `hx()` and the policy gating (tournament / online host policy) are untouched; the rich HTML labels stay in the Settings modal markup. To add a helper: one registry row + one `<label>` row.

**Server fix (1.9):** `HELPER_KEYS` was missing `hand`/`handReminder` (6 of 8), so `cleanHelperPolicy` stripped them and locked online tables never propagated those two helpers. Fixed to all 8 + a comment mirroring the client's `HELPER_DEFS`. This was a **behaviour** bump (no new wire verb) — the first server bump that wasn't a protocol change.

**The relocation (the final step, executed 25 June 2026):** 42 function declarations physically moved to group them by concern. The discipline rule (move ONLY function/async function declarations, never top-level statements) was followed strictly. A Python script (`relocate.py`) with brace-counting parser handled extraction and insertion. Result:

| Concern | Functions | Section comment |
|---------|-----------|----------------|
| **State** (14) | pubXform, pubInv, readyToCanon, makeCard, topHost, isInStackOf, detachFromHost, releaseChildren, dropLocal, attach, move, serializeGame, restoreGame, buildPub | `/* ---------- State: data model, coordinates, serialization, public board ---------- */` |
| **Render** (10) | ensureImg, renderCounters, fitBoard, layout, layoutZone, restack, cardTransform, place, updateBadges, animCard | `/* ---------- Render: layout engine, card visuals, placement ---------- */` |
| **Input** (13) | regrabAtScale, clearSel, deselect, selectOnly, addSel, activeAnchor, bindCard, tap, dropCard, groupDrop, dropZone, attachTargetAt, qrDragGive | `/* ---------- Input: card interaction, selection, drag-drop ---------- */` |
| **Escrow** (5) | ensureEscrowKey, serializeHand, restoreHand, tryRestoreHandBlob, pushEscrow | `/* ---------- Hand escrow ---------- */` (inside net.js) |
| **Navigation** (7, NOT moved — already contiguous) | switchView, jumpSeat, goHome, cycleView, stepLevel, stepSeat, toggleActiveHome | `/* ---------- Navigation: view/seat/level switching ---------- */` |

**Splitter anchor update:** `NET_END` changed from `function buildPub(){` to `let escrowTimer=null, lastHandSig='';` — the frozen `let` right after the escrow functions' new position in the net body.

**Frozen items preserved in glue:** `let boardZoom=1`, `let _lastHandHover=null`, `let drag=null`, `let tdrag=null`, `let giveDrag=null`, `let escrowTimer=null, lastHandSig=''`, `const PUBZ=[...]`, `expandStack`/`collapseStack`, 33 top-level `addEventListener` statements. All stayed at their original positions per the discipline rule.

**Verified:** syntax clean, 16/16 + 3/3 tests, split→build byte-identical round-trip. No version bump (behaviour-neutral). **Live-test pending** — render/interaction has zero test-suite coverage.

**Phase 2 is complete.** All steps done: handler-maps, modals, B1 concatenator, leaf extraction, helpers registry, net + hotseat core seams, dead-code sweep, state-contract tests, and the concern relocation.

## v2.1 — L2 tab persistence + L4 token drag fix (26 June 2026)

**Prey/Predator tabs now stay visible when their columns are folded out.** Previously, `l2syncTabs` added `l2tabhide` when a column was shown (`!pp || shown`), forcing users to switch from "click the tab to open" to "click the header strip to close". Now the tab only hides when no neighbour exists (`!pp`). The tab sits at the screen edge (z:630) above the column (z:60), acting as a close handle with the existing `toggleL2Fold` click handler. The column header strip (`l2hd`) still works as a parallel close path. The `l2tabon` class gives visual feedback (brighter border + text) when the column is open.

**L4 token/globe drag: scale fix + drag shadow.** Tokens (Edge) and the player pool globe jumped to ~43% larger on drag start because the pointermove scale used `l2pub.s` without the `L4_TOKEN_S` (0.7) multiplier that `placeToken`/`placeL4Globe` apply. Fixed by adding `*(l4on()?L4_TOKEN_S:1)` to both drag handlers. Added `filter:drop-shadow(0 12px 20px rgba(0,0,0,.8))` on `.token.dragging` and `.l4globe-mine.dragging` to match the card drag shadow effect (base token shadow is `0 4px 8px`).

**L4 card attachment hit-box: scale fix.** `attachTargetAt` used `l2pub.s` for the hit-box dimensions, but cards render at `l2pub.s * L4_CARD_S` (0.5). The hit-box was 2× the visual card size, causing false attachments to cards that appeared distant and "snap-back" when the dropped card jumped to the false host's position. Fixed by adding `*(l4on()?L4_CARD_S:1)` — same pattern as the token fix and the existing card drag scale.

**L4 edge padding removed.** `PAD` in `dropCard` and `groupDrop` reduced from 2 to 0 for L4, so cards can be placed edge-to-edge with the board boundary to maximise usable space.

**Dock pool globe clan watermark.** `refreshClanDisplay()` now inserts the `.clansym-pool` image into `#dockPool` (the dock pool globe used in L2 columns, L3, and L4), mirroring the existing logic for the main `#pool` globe. CSS was already in place (`#dockPool .clansym-pool`, line 335) — only the JS injection was missing.

**L4 dock: deferred close + scale on hand drag + drag-to-reopen.** Previously, dragging a hand card in L3/L4 immediately closed the dock AND scaled the card to board size. Now in L4 the dock stays open at drag start AND the card stays at dock scale (s=1) — `drag.l4DockDefer=true`, no `regrabAtScale`. The scale transition and dock close are deferred until the cursor exits the dock area (above `H*0.66`): at that point `regrabAtScale(c, drag, boardScale)` fires, the dock closes, and the card shrinks to board size. Crucially, the L4 transition checks run BEFORE the x,y computation so that `regrabAtScale` offsets are applied to the current frame's coordinates. A drag-to-reopen check (`yd >= H-36`) lets any card re-enter the dock: `setL2Dock(true,true)` + `regrabAtScale(c, drag, 1)` scales the card back to dock size. L2 column mode retains its existing drag-to-reopen. L3 behaviour (immediate close + scale) unchanged.

**Live-test pending.**

**Hand card hover float in L4 dock.** The `handhover` guard (`!(l3on() && !l3handOpen)`) blocked the float-up effect in L4 because `l3handOpen` (the parked L3 hand overlay flag) is always false — the dock uses `l2dockopen` instead. Added `&& !board.classList.contains('l2dockopen')` to the guard so the hover works whenever the dock is open.

**Pile-card (crypt/library/ash) dock-drag scale fix across all views.** The first-motion block and drag `sc` only handled hand cards from the dock; pile cards stayed at s=1 during the entire drag and jumped to board scale on drop. Three changes: (1) first-motion extended from `c.zone==='hand'` to `c.zone==='hand' || PILES.includes(c.zone)` — L4 sets `l4DockDefer`, L3 and L2-columns call `regrabAtScale` immediately (dock close conditional on hand-only). (2) drag `sc` now includes `drag.moved && PILES.includes(c.zone)` so pile cards render at board scale during drag. (3) L4 dock-exit doesn't close the dock for pile cards (`c.zone==='hand'` guard around the close), and the dock-enter check handles an already-open dock (`!l2dockopen` → `setL2Dock`; else just `regrabAtScale`).

**Edge button z-index under open dock.** `#edge` sat at z:4700, above the dock background (z:4400) and dock zones (z:4600), so it floated over the open dock in L3/L4. Added `#board.l3mode.l2dockopen #edge{ z-index:4300 }` to push it below the dock background when the dock is open.

**Stacked children invisible to placement systems.** Attached cards (children riding a host) now have zero impact on other cards' placement: (1) `attachTargetAt` filters out `t.host` so children can't be false attachment targets — only hosts and standalone cards participate in hit-testing; (2) `nudgeFree` skips `oc.host` so children don't push newly played cards away from their overlap zone. Children remain hoverable, previewable, and interactable — only their collision footprint is suppressed. Applies to all views (L1–L4).

**Unified dead space in L3/L4: board fills `#tableArea` via `l2cols`.** Previously, L3/L4 used a fixed 1004×616 canvas with CSS scale — when the aside panel collapsed, the freed space was `#tableArea` background (dark green), visually separate from the board's felt-texture dead space. Now `enterL3`/`enterL4` add the `l2cols` class, making `#board` fill the entire `#tableArea` via `position:absolute; inset:0; width:auto; height:auto; transform:none`. All dead space is inside the board (felt texture); zoom/pan integrates with the panel toggle. `fitBoard` updated to return early for all `l2cols` cases (not just non-L3). `exitL3`/`exitL4` now remove `l2cols`. The resize handler calls `renderL4()` for `net.view==='l4'` (previously unhandled). `l3geom()` now returns the actual board dimensions (not 1004×616), and all L3/L4 layout is resolution-independent — mats, slots, zoom/pan clamping adapt automatically.

## v2.2 — Path of Enlightenment + L4 polish (26 June 2026)

### Path of Enlightenment (V5 Sabbat)

**Constants:** `PATHS` (name→{short, slug}), `PATH_NAMES`, `PATH_SVG_SLUGS` (normClan→slug), `pathSymUrl(name)`. Icons from `static.krcg.org/svg/path/`. `clanSymUrl()` handles path names automatically via `PATH_SVG_SLUGS`.

**Card model:** `c.path` (path name or null), `c.noPath` (boolean). Serialized in all 6 points (snapshot, restoreSnap, serializeGame, restoreGame, buildPub, serializeHand/restoreHand). `cardTitle()` shows path in tooltip. `.pathbadge` overlay on cards (23px, bone-white circle background, `border-radius:50%`, `padding:2px`, `box-shadow`). Only visible on face-up cards.

**Detection:** `detectPath()` / `activePath()` — same pattern as clan detection. `displaySymbol()` determines pool-globe icon: path wins only if path-count *strictly* exceeds clan-count; tie → clan. `refreshClanDisplay()` uses `displaySymbol()`. Both `detectClan()` and `detectPath()` skip face-down cards.

**"Special…" submenu:** crypt and library cards in COUNTER_ZONES now have a "Special…" submenu at the bottom of the right-click menu. Crypt: Follow Path / Remove Path (face-up Sabbat only). Library: Convert to vampire. Converted cards: Revert to library card.

**Pool-globe menu:** paths merged into "⚝ Choose clan…" (one unified submenu). `state.chosenClan` holds both clan and path overrides. `state.chosenPath` removed entirely.

**Helper:** `pathBlood` (default off). Burns 1 blood, gates to Influence phase (menu items greyed out via `.mi.disabled` in other phases). Only the blood-burn is a helper — the general Follow Path mechanic is always available, including in Tournament mode. Server `HELPER_KEYS` updated.

**KRCG integration:** `loadCardDB()` reads `card.path` into meta AND derives `ri.sect` from `card_text` at parse time (Sabbat/Camarilla/Anarch/Laibon/Independent via `\bX\b` regex; `card.sect` overrides if KRCG adds it). Sect is derived once at load, not per menu open. Card preview shows path in meta. Menu code: `ri.sect==='Sabbat'` (clean). Cards unknown to KRCG fall through as "show menu" (defensive). KRCG PR #830 path field: read when available, blocks manual choice for vampires with printed path.

### L4 board & interaction polish

**Canonical board AR.** `l3canonAR` stores the board aspect ratio based on collapsed-panel dimensions. `l3geom()` letterboxes within the current board: panel collapsed → fills edge-to-edge, panel open → dead space top/bottom. `_asideResize` flag distinguishes aside toggles (AR preserved) from true window resizes (AR recomputed). Board marking (`#l3table`) maintains proportions regardless of panel state.

**Edge button + timer centered.** `l3clockCy` changed from `H*0.45` (full board) to `g.ay+g.ah*0.45` (letterboxed slot). Edge button horizontal position changed from hardcoded `1004/2` to `fx+fw/2` (slot center).

**Reset view button.** `#l3resetBtn` added above the zoom toggle in L3/L4 — resets zoom+pan in one click without opening the zoom panel. Styled to match existing buttons. Visible only in L3/L4 (hidden toggle in enter/exit).

**Click-outside-to-close zoom panel.** `pointerdown` listener on `document`: if the zoom panel (`#l3zoomCtl`) is open and the click is outside it and the toggle button, the panel closes.

**Pile drag fix.** `libDragTarget()` and `cryptDragTarget()` used `#z-ready.getBoundingClientRect()` for "ready" hit-test, but in L4 the zone box is smaller than the board. Now: in L4, the entire `board.getBoundingClientRect()` counts as "ready". Hand card drag was unaffected (uses the separate `dropZone()` function which already handled L4 correctly).

**Pile drag dock guard.** `pileDrag` flag (global `let`) set by `libDragStart`/`cryptDragStart`, cleared in cleanup. Both dock hover handlers add `!pileDrag` alongside `!drag` to prevent the dock from toggling mid-pile-drag (the pile drag IIFEs use scoped `ld`/`cd`, invisible to the hover handler without this flag).

**Pile drag dock lifecycle (v2.4.2).** Both pile drag IIFEs close the dock on drag start (`setL2Dock(false)` at `started=true`), reopen on hover-bottom (cursor ≥ H-36px), and re-close when the cursor moves above 66%. Ghost scale set AFTER dock-close so `l2pub.s` is current. `cryptDragTarget`/`libDragTarget` return `'cancel'` when the cursor is in the dock overlay area (≥66%), preventing false hits on zones underneath. `cryptDragTarget` checks L4 before `#z-uncontrolled` (uncontrolled has a valid rect in L4 despite being invisible). Drop coordinates use scaled card dimensions (`CW*_s/2`) in all views.

**OPEN ISSUE — dock-to-board card centering.** When dragging a hand card out of the dock, `regrabAtScale` adjusts the grab offset for the new scale, but the cursor drifts off-center from the card. Center-snap approach (`drag.ox = s*CW/2`) was attempted and reverted — didn't visibly fix in L4. Needs investigation of `cardTransform` scale logic, `transformOrigin: 0 0`, and `.card.dragging` box-shadow interaction.

**Pool globe hint.** `l4hintDone` flag prevents the "Drag your pool globe" hint from reappearing after the user has already dragged their globe. The flag resets in `clearTable()` (new game), not in `enterL4()`, so the hint shows at most once per game session regardless of view cycling or resizes.

### Menu system

**Disabled items.** `renderItems()` supports `it.disabled`: adds `.mi.disabled` class (opacity .4, `pointer-events:none`) and skips click-handler wiring.

### Bugfixes

- `convertCardKind()` called non-existent `updateClan()` → `updateMyClan()`.
- `detectClan()` counted face-down cards → added `c.faceDown` filter (matches `detectPath`/`clanCount`/`pathCount`).
- Sect derivation regex used Python `\b` (backspace 0x08) instead of JS `\b` (word boundary) — fixed via binary byte replacement. Learnings updated.
- Path menu hidden for ALL cards when KRCG loaded but card not found (name-miss) — changed `_isSabbat` logic: unknown cards now fall through as "show menu".

**Live-test pending.**

## v2.3 — Files, Caching & UX Polish (26 June 2026)

### Local image cache (IndexedDB)

**Architecture.** Card images and SVG icons from KRCG are downloaded and stored as blobs in IndexedDB (`elysium-images` db, `cards` store). At startup, `warmImgCache()` iterates all entries and creates `URL.createObjectURL(blob)` references in `imgBlobCache` (Map: normName → blobUrl). `imgUrl()` checks this Map first (gated by `conv.imgCache` boolean — zero overhead when off), falling back to the KRCG URL. `clanSymUrl()` and `pathSymUrl()` use the same cache with `svg:clan/slug` / `svg:path/slug` keys.

**Download manager.** `downloadImages(names)` handles both card images and SVG icons (distinguished by `svg:` prefix in the name). 6 parallel fetches, AbortController for cancel, 30ms inter-batch delay. Failed names are collected in a `failed[]` array; after the main loop, a single automatic retry pass runs after a 2-second pause (catches transient network errors). Three collection functions: `collectAllNames` (requires cardInfo), `collectDeckNames` (parses saved decks), `collectGameNames` (current table). All three include SVG clan/path icons via `collectSvgNames()`.

**vtes.json caching.** `loadCardDB()` refactored into `processCardData(data, src)` + `fetchVtesJson()` + `loadCardDB()`. The raw JSON is cached in IndexedDB under key `_vtesJson`. When `conv.jsonSync` is off, loads from cache (fast, works offline). When on, fetches from KRCG and updates cache. Network failure gracefully falls back to cache even when sync is on.

**Image sync.** `imgSyncCheck()` runs after every card DB load. Compares `cardImageNames` + SVG names against `imgBlobCache` — downloads only new/missing entries. Triggered by `conv.imgSync` toggle.

**cardImageNames.** `processCardData` stores three name variants per card in `cardInfo` (for lookup), but only `norm(card.name)` matches KRCG image filenames. `cardImageNames` (Set) tracks only primary names; `collectAllNames()` and `imgSyncCheck()` use it for downloads instead of `cardInfo.keys()`, avoiding ~1500 spurious 404s.

**Settings UI.** Files section moved to top of Settings. Contains: Card database toggle (moved from Convenience), Download/Refresh button for vtes.json, Auto-sync toggle, Use cached images toggle, Auto-download new images toggle, Image format dropdown, Download buttons (All/Decks/Game), Progress bar + Cancel, Cache stats, Persist, Clear all. Storage sub-section: Autosave mode / Saved game / Deck library / Settings clear buttons, Total estimate, Clear everything (nuclear option). Brightness and SFX master volume are inline slider rows at the bottom of Convenience (brightness above SFX).

### UI & UX changes

**Hover preview setting.** `conv.hoverPreview` ('key'/'always') controls whether card images show on hover or require Ctrl when the panel is collapsed.

**Dock log zone.** `#dockLog` in the bottom dock shows a scrollable log mirror when the panel is collapsed. Positioned right of pool zone (L2+L3), shifted 138px right to accommodate the pool zone.

**Dock visual redesign (v2.4.1).** The collapsed dock handle (`#l2dock`) is restyled as a solid bottom panel: `background:var(--panel)` (#100d09), `border-top:1px solid brass`, full-width (`left/right/bottom: -1px`), `border-radius:0`, `z-index:4800` (above `#poolWrap` at 4700). Looks like a menu bar but still functions as a hover-to-open overlay. When the dock is open in L2: `#pseat`, `#edge`, and `#poolHelp` are hidden (`opacity:0; pointer-events:none`) so they don't float above the expanded dock.

**Dock zone consistency (v2.4.1).** L2 and L3 docks are now visually identical: `#z-pool` shown in L2 dock (was L3-only), `#poolWrap` hidden when L2 dock is open, crypt/library/ash zones expanded to `+34px` (was `+18px`, matching hand/pool/log), pile cards centred in their zones, zone borders changed to `solid` with labels at 0.7 opacity when dock is open.

**Zone flip for top-row boards (v2.4.1).** All top-row opponent boards across all player counts (2p–7p) have `flip:true` — Ready zone faces down toward the table centre. Cards remain upright. Applies in L3 only; L2 Visit renders without flip.

**L3 table border removed (v2.4.1).** `.l3table` has `border:none` — the brass outline around the felt is removed for a cleaner look. Inner box-shadow (depth effect) preserved.

**Played/Ready tab centering.** `--tab-mid: calc(50% - 20px)` when panel collapsed, centering tabs under the Pass button.

**Welcome dialog redesign.** `#empty` has felt gradient background (hides zones), starts with `display:none` in CSS (shown by JS after startup to avoid flash). Dialog has quick buttons (Settings, Deck Lab), **Resume button** (visible only when localStorage has a saved game), KRCG recommendations (hidden when already set up), Play buttons, "Do not show again" toggle (`conv.showWelcome` — forced visible when a save exists so Resume is always reachable).

**Manual save resume.** No silent autosave restore at startup. The user clicks Resume on the welcome dialog (or starts fresh). Click handler re-reads from localStorage at click time. Online rejoin is separate (server messages). Clearing the save from Settings → Storage hides the Resume button.

**Discard-hover keybinding.** `_lastBoardHover` tracks the card under the pointer. `ashHover` shortcut (Advanced, no default key) sends hovered card to ash heap. Works in all views.

**pcoHome merged into pco dropdown.** New `pco='home'` value replaces the separate checkbox. Dropdown: On / Hide home / Mine hidden / All hidden.

**Oust helper text.** Removed outdated multiplayer caveat — bounty works in all play modes.

**`.set-row[hidden]` CSS fix.** `.set-row` had `display:flex` which overrode the `hidden` attribute. Added `.set-row[hidden]{display:none}`.


## v2.5.0 — Online/Tunnel Connectivity + Security Hardening (29 June 2026)

The pass that makes internet play actually work for remote friends over a Cloudflare tunnel, plus security hardening, build-system repair, and a pedagogical comment pass across the network layer. **Client 2.5.0 / server 2.5.0** (both bumped; `verMM` compares major.minor, so they must stay on the same major.minor).

### The tunnel connectivity fix (the core)

Remote friends could load the client over the tunnel but never join a game. Root cause was client-side: `cleanAddr()` unconditionally appended `:8123`, but a Cloudflare quick tunnel only exposes 443 — `wss://host:8123` went nowhere. Fix: `cleanAddr()` now picks the port by page scheme — over `http://` it appends `:8123` (direct LAN/localhost), over `https://` it never appends and strips a stray `:8123` (the tunnel/proxy answers on 443). `mpConnect()` already chose `wss://`/`ws://` by `location.protocol` (mixed-content safe). The address field now defaults to the live page host over https (tunnel URLs change every restart), and `copyInvite()` + the join help text became scheme-aware (an https invite is ready to share; an http one warns it is LAN-only).

### Version handshake made tolerant

The join handler compared `m.srv !== VERSION` exactly, so any drift (e.g. client 2.4.x vs server 2.3) threw a spurious "version mismatch" the moment a friend connected. Replaced with `verMM` (major.minor compare): `verMM("2.5.1")===verMM("2.5.0")`, so a client-only patch bump is silent, but a real minor/major gap still warns. Client and server brought into lockstep at 2.5.0.

### Server security hardening — the loopback per-IP holes

Behind a tunnel every player arrives as `127.0.0.1`. The connection cap and room-create cap already exempted loopback; the **password-fail throttle did not** — five wrong passwords from any tunnel player would lock out *all* tunnel joins for 10 minutes (a shared `127.0.0.1` counter). Rather than simply exempt loopback (which would leave password-guessing unthrottled over the tunnel), the throttle now keys by context: `failKey = loopback ? 'room:'+room.name : conn.ip`. A real address keeps per-IP throttling; a tunnelled join is throttled **per room**, so brute-force protection survives and one fat-fingering player cannot lock out a different room. Two new regression tests (dispatch suite tests 4–5) prove both sides; the harness now exposes `ipFails`/`FAIL_MAX`.

### Build system re-anchored (B1)

An earlier refactor had moved `buildPub()` below the hotseat block, which broke `split_client.py`'s source-order assert (it expected `net` to end at `buildPub`). The `split → build → cmp` byte-identity gate was failing **on the pristine monolith too** — pre-existing drift, not caused by the session's edits. Re-anchored: `net.js` ends at the hotseat block start (`HS_START`); the post-hotseat render/serialization chunk (incl. `buildPub`) folds into one app fragment; `buildPub` dropped as a cut anchor; the redundant app slice between net and hotseat removed (13 → 12 fragments). Round-trip is byte-identical again.

### Pedagogical comment pass (network layer)

Teaching comments added at every decision point so the network story reads end-to-end: `cleanAddr` (port-by-scheme + tunnel rationale), `mpConnect` (ws/wss mixed-content), the address prefill, `copyInvite`, `verMM`; server-side the loopback exemptions, the keepalive (30s ping vs Cloudflare's ~100s idle timeout; the 75s reaper is >2 ping intervals so one missed ping is forgiven), and the auto-reconnect (`net.ws!==ws` guard, token replay).

### Reviewed but found correct (no changes)

A deep review of the network stack found no bugs in: auto-reconnect, the `wsAttach` frame parser (ping/pong/close, chunked TCP, masking), `dropPlayer` (GRACE_MS reconnect grace), `passMatch` (timing-safe compare), and the create handler. Two hygiene fixes were applied: the test-harness `location` stub gained `protocol`/`host` (so future network-path tests do not hit `undefined`), and the err-handler now `clearTimeout(net.retry)` to mirror `mpLeave` teardown.

### Deliberately NOT done (with reasons)

- **Exponential reconnect backoff** — kept immediate 2.5s retry. It is the right behaviour here: you want players to reconnect the instant the host's laptop wakes from sleep, not after a backoff has stretched the interval out. No evidence Cloudflare is rate-limiting us. If that ever changes, a cap (slow to ~15–30s after N tries, never stop) is the clean version.
- **Caching `CLIENT_FILE` at startup** (vs `fs.readFile` per request) — kept the per-request read. Combined with `Cache-Control: no-store` it means the server always serves the latest client file (drop in a new HTML, the next load gets it, no restart). `readFileSync`-at-start would cache the old client and then need `fs.watch` just to restore that behaviour. The cost is one ~700 KB read per *page load* (not per message) — negligible for a handful of players.
- **`start-cloudflare-tunnel.bat` clipboard race** (earlier this session) — fixed: `findstr /r "https://.*trycloudflare.com"` waits for the real URL line (the old matcher caught the earlier "Requesting new quick Tunnel on trycloudflare.com..." line that appears before the URL exists), and `<nul set /p "=%_url%"| clip` copies the address without a trailing newline.

**Verifierat:** klient-syntax ✓ · klientlogik 16/16 ✓ · split→build→cmp byte-identisk ✓ · server-syntax ✓ · server-svit 5/5 ✓. Live-test (kompis ansluter via portlös tunnel-länk) väntar.

---

## Dock-drag precision pass (post-v2.5.0, client-only)

Five bugs fixed to make L3/L4 dock-to-board card dragging precise and consistent. All are client-only changes.

### 1. `pointerup` made async — `.dragging` removed AFTER `place()`
The synchronous `el.classList.remove('dragging')` before `dropCard()` restored transitions before `place()` set the card's final position. The box-shadow transition (`0 16px 30px → 0 2px 6px`) then created a ~14-16px perceptual "sinking" effect. Fix: `async pointerup` + `await dropCard(c,d)` → `el.classList.remove('dragging')`. Now `place()` runs with `transition:none` still active; only the shadow fades on release.

### 2. Frozen CSS `translate` cleared at drag start
`.handhover` sets `translate: 0 -26px; transition: translate .14s`. The capture-phase `pointerdown` removes `.handhover` and starts the transition. Adding `.dragging` (`transition:none`) in the first `pointermove` freezes the transition mid-way (e.g. at -13px). The card sits 13px above its transform position, making grab calculations wrong. Fix: `el.style.translate = 'none'` immediately after `el.classList.add('dragging')`.

### 3. `wasLifted` flag for grab correction
When the capture-phase removes `.handhover` before `bindCard`'s bubbling pointerdown fires, the `drag.oy += 26` correction couldn't check for `.handhover` (already gone). Fix: `el.dataset.wasLifted = '1'` in capture phase; `bindCard`'s pointerdown reads and deletes it.

### 4. 50% centre-pin replaces `regrabAtScale` for dock exits
`regrabAtScale` preserves the grab fraction (e.g. 70% of full card → 70% of scaled card → cursor near bottom). Replaced with `drag.ox=s*CW*0.5; drag.oy=s*CH*0.5` for both L3 and L4 dock exit transitions. Cursor is always at card centre through drag and placement.

### 5. `pointerover` guard prevents handhover re-adding during drag
In L4 dock-defer mode, `l2dockopen` is true and the `pointerover` listener re-added `.handhover` to the dragging card. Fix: `!el.classList.contains('dragging')` guard.

### 6. Ghost card translate offset fixed for Crypt/Library pile drags
`translate(-50%,-60%) scale(_s)` — the -60% uses the element's CSS box (CW×CH), not the visual size. Cursor position = `0.1/_s + 0.5` of card height. At _s=0.2 (L4): cursor at 100% = bottom edge. Drop calc used 50%. Fix: `-60%` → `-50%` in both ghost transforms; cursor now at 50% at all scales, matching drop.

---

## v2.5.1 — Panel & peek polish (29 June 2026, client-only)

Two small client-only fixes to panel behaviour during view switches. Server stays at 2.5.0; `verMM` compares major.minor so the patch bump is silent on join.

### 1. `enterL0` now collapses the card-viewer panel
`enterL0()` was the only enter-function that did not call `setAside`. `enterL3` and `enterL4` already called `setAside(true, false)`; `enterL0` did not, leaving the panel open on the welcome screen and after Reset. Fix: one line added — `setAside(true, false)` with `persist=false` so the user's saved L2 preference is not overwritten.

### 2. Shift-to-peek suppressed when dock log is visible
The dock log's init comment already stated it *"replaces the need for Shift-to-peek"*, but the `keydown` listener was missing the gate. Added `!dockLogVisible()` to the condition: when the panel is collapsed with the dock open in L2, Shift does nothing (the dock log already shows everything). When the panel is collapsed without a visible dock log (e.g. L3/L4 without dock open), Shift-to-peek still works as a fallback.

## v2.5.2 — Guided in-app tutorial (29 June 2026, client-only)

A mobile-game-style guided tutorial for the offline (hotseat) game, a self-contained block in `app-5.js`. (The 2.5.0 → 2.5.2 bump also corrects a version-string drift: the 2.5.1 panel-peek changes had shipped but `const VERSION` was left at 2.5.0.) Server stays 2.5.0 — the online mismatch warning on join is the documented-tolerated client↔server gap; the client's `verMM` patch-tolerance keeps the *client* side silent. (Footgun: the server's `vWarn` is still exact-match, so a 2.5.0 server *will* show a cosmetic warning to a 2.5.2 client online until its `vWarn` is also made `verMM`-based.)

**Entry points.** A **Tutorial** button in the welcome dialog (`#btnEmptyTutorial`, right of Deck Lab) and a **Tutorial** item under ☰ → Play…, both → `openTutorial()` (opens the section picker `#tutPick`). First-run nudge: the welcome Tutorial button pulses (`.tutNudge`, additive drop-shadow) while `conv.tutDone` is empty.

**Spotlight technique.** Dim + hard-block = four `position:fixed` "fence" rects (`.tutFence`) around an open hole — no z-index games on the highlighted element, so it dodges every stacking-context trap. The hole is a real gap so the underlying control is reachable when a step wants it (`clickThrough`); otherwise a transparent `#tutHole` swallows clicks. Pulsing ring `#tutRing`, bubble `#tutBubble` (arrow nub + Continue), always-visible **End** `#tutEnd` + Esc (capture-phase). A rAF loop (`tutTick`) repositions everything each frame and polls predicate/gate steps. Layer `#tutLayer` is `display:none` idle; z 100000+.

**Data-driven steps.** `TUT_SECTIONS` + `TUT_ORDER = ['introduction','decklab','lobby','classic-intro','classic-crypt','classic-play','classic-interact']` (Classic gameplay split into four; `classic-play`/`classic-interact` are stubs). A step: `{ id, target:()=>el|null, text, place:'top|bottom|left|right|center', advance:{on:'manual'|'click'|'event'|'predicate'}, onEnter?, onExit?, gate?, gateHint?, clickThrough?, clickArm?, scroll?, allowSkip?, orContinue?, freeInteract?, ringRect? }`. Steps auto-skip when `allowSkip` + `target()` is null — the mode-gating mechanism (precon vs file steps return null for the wrong `tut._dlMode`).

**Step mechanics.** `clickThrough` (hole open so a real `<select>`/button works in place). `gate:()=>bool` (Continue greyed until true, polled in `tutTick`). `clickArm:()=>el` (manual step gated on clicking a real control via a one-shot listener → `tut._click`, paired with `gate:()=>tut._click`). `scroll:()=>el` (`scrollIntoView({behavior:'smooth',block:'center'})` on enter). `tutVisibleInfo` makes "Step X / N" count only shown steps, so a skipped branch leaves no gaps.

**Sections (Classic gameplay = slice 3; 3a/3b built, 3c/3d stubs):**
- **Introduction** — walks the welcome dialog; the Database / Download-images steps are `clickThrough` so they activate in place.
- **Deck Lab** — begins on the **welcome screen** with the `#btnEmptyDeckLab` button highlighted (`tutShowWelcome()` routes there); pressing Continue advances to `dl-intro`, whose `onEnter` opens Deck Lab (auto-enabling the database, exactly like the real button) and whose `gate` waits for precons to load (`gateHint` \"Loading the card database...\"). Always the precon path now. It ends by having the user load + save *two* decks (gated), for the lobby. (`tutEnsureDecks`/`tutWaitFor` from the old prompt-first approach are left defined but unused.)
- **Lobby** — begins on the **welcome screen** with the `#btnEmptyOffline` button highlighted; pressing Continue advances to `lob-intro`, whose `onEnter` resets to a clean 2-seat lobby and opens it. Assign one saved deck to each seat (gated, target via `#offlineSeats > div:nth-child(N) select`), Add/Fill explained but unused (Fill caps at **5**), **Start** → 2-player Classic game.

**Flow + persistence.** `tutFinishSection` records the section in `conv.tutDone` (`tutMarkDone`), then offers (`uiConfirm`) the next *ready* section (`tutNextReady`, skips stubs); when none remain (or declined), `closeOverlay()` drops back to the welcome screen. **End / Esc** route there too — `tutCancel()` = `tutEnd()` + `tutShowWelcome()`, guarded by `!localTable && !inRoom()` so a live table is not torn down; `tutFinishSection` still calls `tutEnd()` directly so section-complete keeps its own flow. Reset link `#tutPickReset` (shown only when something is done) clears `conv.tutDone`. **Step-aside:** `tutTick` hides the layer only while `#dialogModal` is `display:flex` (alerts/confirms), so content modals the tutorial highlights inside stay visible.

**Functions:** `openTutorial`, `tutLaunch`, `tutEnsureDecks`, `tutWaitFor`, `tutStart`, `tutEnd`, `tutGo`, `tutRender`, `tutVisibleInfo`, `tutGateOk`, `tutArmAdvance`, `tutClearAdvance`, `tutNotify`, `tutPosition`, `tutSetRect`, `tutPlaceBubble`, `tutTick`, `tutFinishSection`, `tutMarkDone`, `tutNextReady`, `tutResetProgress`, `tutRefreshNudge`, `tutShake`, `tutVis`. State: `tut.{active,secId,steps,idx,_dlMode,_click,_loadSeq,_pickBase}`. `loadPrecon` emits `tutNotify('deck-loaded')` (drives the `_loadSeq` counter for "load another" gates).

### Classic gameplay tutorial — slices 3a + 3b + tutorial-game persistence (30 June 2026, still 2.5.2)

The Classic gameplay parts run on a **live L4 (free-board) Classic table**, so the hard spotlight can't be aimed the way it is inside a modal. Two engine additions + the L4 targeting facts + a persistence layer.

**`freeInteract` (coach-mark) + `ringRect`.** `freeInteract:true` makes `tutPosition` hide all four `.tutFence` *and* the hole — no dim, no block — so the player works the felt freely; only `#tutRing` (non-blocking) marks the target and the bubble parks at `ringRect()` (else top-center). Essential because L4 cards sit anywhere. `ringRect:()=>{left,top,right,bottom,width,height}|null` frames *several* elements at once (ring + bubble follow the rect, overriding a single `target`) — used to highlight all face-down vampires (`tutFaceDownVampRect`). `orContinue:true` adds a Continue escape hatch to event/predicate steps.

**`tutQuickClassic`.** Launching a `classic-*` section while **not** in a Classic game (`!(localTable && net.boardMode==='classic')`) auto-seats a quick **2-player Classic Tournament** game from saved decks and starts the section (instead of routing to the lobby tutorial). ≥2 decks → 2 random distinct; 1 → both seats same; 0 → `uiConfirm` → `tutLaunch('decklab')`; already in a game → confirm first; in an online room → asked to leave. Uses `loadDecks()`, `startHotseat([{name,deckText}],'classic')`, `conv.tournament=true` (session-only), `endYourTurn()`. The lobby chain reaches the same `tutStart('classic-intro')` when already in a Classic game.

**L4 targeting facts (these fixed wrong highlight targets).** `enterL4()` adds `l2mode + l3mode + l4mode + l2cols` to `#board`, so `l3on()` is **true** in L4 and **`#handTab` is hidden** — the real dock handle in L4 is **`#l2dock`** (the bottom "Crypt · Library · Ash heap · Hand" bar, z 4800). The table step targets `#statsTab` + `ringRect:tutTableRect`; `#statsTab` carries `translateY(-80px)`, so targeting `#statsDock` (the layout box) misaligned by 80px — `tutTableRect` uses the tab's *visual* rect and grows to include `#statsPanel` (310px, opens leftward) when `#statsDock.open`.

**3a `classic-intro`** — center intro steps keep the dim; board steps (pool/dock/help/zoom/table) are `freeInteract` so the dock & zoom stay reachable and visible.

**3b `classic-crypt` (Crypt & influence)** — **L4 gate fact:** a **dragged** crypt card lands in `state.zones.ready` **face-down** (`cryptDragTarget` → `'ready'` under `l4on()`); a **double-click** (`influence()`) sends it to `uncontrolled`. So the original `uncontrolled>=4` / `ready>=1` gates were wrong. Helpers (before `TUT_ORDER`): `tutVampsOnFelt(faceDownOnly)`, `tutCryptOnBoard()`, `tutFaceUpVamp()`, `tutFaceDownVampRect()` (bounding rect via `c.el.getBoundingClientRect`; cards have `.el`, `state.cards` is a Map), `tutTableRect()`. `cc-draw` gates on `tutCryptOnBoard()>=4` with a dynamic target (dock handle → `#dockCrypt` once open). The final step `cc-influence` records each on-felt vampire's `{x,y}` in `onEnter` and gates on a face-up vampire whose `{x,y}` moved >6px (completes when **moved**, not merely flipped — `dropCard` → `move(c,'ready',{x,y})` updates `c.x/c.y`).

**Bug fixes.** *classic-intro never appeared* (root cause): `closeOverlay()` removes `#overlay`'s `.show` but never resets `#dialogModal.style.display` (left `'flex'` by `openOverlay`); the `tutTick` step-aside checked only that inline display → kept the layer hidden after a `uiConfirm` closed. Deck Lab / Lobby escaped it (their next step opens a content modal, which resets the display); classic-* goes straight to the felt. **Fix:** the step-aside now also requires `#overlay` `.show` (matches `shownModal()`). *Turn-cue overlap:* `#turnFx` (z 6050, below the tutorial) lingered behind the next-section prompt → `tutFinishSection` now calls `endYourTurn()` first. *Context-guard:* `tutTick` (after `if(!tut.active)`) ends a Classic-gameplay tutorial whose table is gone (leave/reset/oust never called `tutEnd`): `if(tut.secId.indexOf('classic')===0 && !(localTable && net.boardMode==='classic')) tutEnd()`.

**Tutorial-game persistence (own key, resume on return, Reset clears).** The Classic tutorial table persists so returning resumes the **same board state**; fully separate from the regular autosave. Key **`TUT_GAME_KEY='elysium.tut.game'`** + flag `tutGameLive` (true while the live hotseat *is* the tutorial game; set in `tutStart` for `classic-*` on a Classic table, covering both the lobby chain and `tutQuickClassic`; `startHotseat` clears it so a fresh table isn't the tutorial game until a section claims it). `tutGameSnapshot()` folds the live active seat (`net.hot.boards[mySeat()]=serializeGame()`) and returns `{v:1,boardMode,seats:[{name,board}]}` — *every* seat's board. `tutGameResume(json)` rebuilds via `startHotseat` with each seat's `boardJson`. `tutGamePersist()` debounces (500ms) a write of the snapshot when `tutGameLive`, **independent of the autosave mode** (works even on "off"); hooked into `scheduleSave`, plus an immediate write in `leaveHotseat` before teardown. `tutQuickClassic` checks the key **first** (resume) before seating fresh; `tutResetProgress` removes the key + clears the flag. **Trade-off (commented in code):** boards restore exactly, but `startHotseat` resets the **turn counter to turn 1 / VP to 0** on rebuild — fine for the early tutorial; a future version could persist `net.turnSeat`/VP and re-activate the saved seat.

**New functions:** `tutGameSnapshot`, `tutGameResume`, `tutGamePersist`, `tutVampsOnFelt`, `tutCryptOnBoard`, `tutFaceUpVamp`, `tutFaceDownVampRect`, `tutTableRect`. **New localStorage key:** `TUT_GAME_KEY` (`elysium.tut.game`). **New session flag:** `tutGameLive`.

### Classic tutorial — slice 3c + onboarding/Table/Crypt rework + engine v2 (30 June 2026, still 2.5.2)

Continuation of the guided tutorial. **Slice 3c (`classic-play`, "Playing cards & minion actions")** added: cp-intro → cp-play (with a play-with-vampire **branch** A/B keyed on `tut._playWithVamp` + `skip`) → cp-draw → cp-discard → **cp-actions** (minion-action concept + examples + auto-lock + unlock-first) → **cp-bleed** (do Actions→Bleed, read the log) → cp-pass. The minion-action step now sits after the full card sequence and is split concept/do.

**Onboarding/Crypt rework (feedback-driven):** picker `.tpiName`/`.tpiDesc` → `display:block`; renames 'lobby'→"Start a game", 'classic-intro'→"Table overview"; intro-welcome split into paragraphs with a **drag-to-continue** gate (gate on `tut._bubblePin` for the step) + both nav buttons highlighted (`hiNav`); new `intro-menu`/`intro-purpose` steps; the Crypt section grew 8→11 steps (new `cc-place`, `cc-panel2`, `cc-clear`) with **greyed Continue on steps 3–8** (state-gate or latch each); `ci-dock` notes pool+log and latches Continue; `cc-panel` uses `avoidRect:tutFaceDownVampRect`.

**Tutorial engine v2 (all in `app-5.js`, `tut*`):** `skip:()=>bool` (branch primitive, replaces `allowSkip`+null-target); function `gateHint` (live count); draggable bubble (`tut._bubblePin`/`_bubblePinIdx`, auto-released on step change); `tutPlaceBubble` collision-avoidance + `avoidRect` + dodge list (`#menu/#submenu/#submenu2/#helpOverlay/#l1zoomCtl`); top-level clone host `#cardFxTop` (z 100060); `tutMenuHi` (`menuHi:[…]` → `.tuthi`); `tutDockRect`/`tutFaceUpVampObj`/`tutVampSelected`; `hiNav` (highlight `#tutEnd`/`#tutNext`, `.tutBtnHi`); `tutArrow` (arrow aims at the target from the bubble's FINAL position via `place-*` + `--tutArrowX/Y`, fixing the detached "diamond" when dragged; freeInteract no-ring forces `place-center`).

**Discard default → hover+key:** `X` now discards the card under the pointer (zone-agnostic `discardHover` via `.handhover`/`_lastBoardHover`, `!PILES`); selection-discard (`ashSel`/`groupMove`) kept but unbound, rebindable in Shortcuts. Saved profiles that ever rebound any shortcut keep the old binding until Reset.

**z-index raises:** menus 8000s→100036/100040/100044, `#helpOverlay`→100050, `#hoverCard`→100055, `#cardFxTop`→100060. **Full layer map now lives in `elysium-learnings.md` → "Z-index / stacking layer map"** (a total inventory of every band + the stacking-context traps).

**Version note (resolved):** all of the above is client-only and additive. Bumped to **`2.5.3`** (silent patch — `verMM` major.minor compare keeps online play quiet and compatible with the 2.5.0 server) when the Classic walkthrough completed at slice 3d. The milestone minor (2.6.0) was declined to avoid the cosmetic online mismatch warning to 2.5.x peers, since nothing in the wire protocol changed.

### Classic tutorial — simulated opponent reaction in `classic-interact` (30 June 2026, now 2.5.4)

Reworked "Interacting with opponents" so the **Reaction timer** and **Hold on…** signal are followed by an actual hands-on simulation of an opponent reacting, using the hotseat seat-swap (`setActivePlayer`) instead of just describing it.

**Reordered steps:** `cx-target`/`cx-target-play` moved earlier (right after `cx-play`); `cx-played`/`cx-played-card`/`cx-played-clean` moved later, now landing **after** the simulated reaction so the Played tab visibly shows cards from **both** seats at once (the pedagogical point Johan wanted — "look, both colours are in there"). Full order is now: cx-intro → cx-pool → cx-crypt → cx-flip → cx-play → cx-target → cx-target-play → cx-reaction → **cx-handoff** (new) → cx-signal (now Player-1-specific) → **cx-p1-play** (new) → cx-played → cx-played-card → cx-played-clean → cx-outro → cx-leave.

**`cx-reaction`** (Reaction timer) gained a real gate: `tut._reactClicked` is set from a one-line breadcrumb in the `#btnDecide` click handler (`tut._reactClicked=true;`), so Continue stays grey until the clock is actually clicked — previously it was a plain unguarded manual step.

**`cx-handoff`** (new): targets `#statsTab` with the existing `tutTableRect` ringRect (reused from `ci-table`). Captures `tut._handoffSeat=mySeat()` on enter; gates on `mySeat() !== tut._handoffSeat`, i.e. the player actually clicked Player 1's row in the Table panel (`#statsBody .srow.click` → `setActivePlayer`, pre-existing hotseat machinery, untouched). Text is explicit that this step is **hotseat-only** — online opponents react in real time on their own screens.

**`cx-signal`** (was generic "right-click for any quick phrase") now specifically asks for **"Hold on…"** (`SAY[0]`) as Player 1. Gated via a new breadcrumb: `saySend(i)` now sets `tut._lastSaidIdx=i` right before its existing `tutNotify('said')` call; the step gates on `tut._lastSaidIdx===0`. (Note: the in-app phrase is "Hold on…", not "Hold up..." — used the actual SAY-array string.)

**`cx-p1-play`** (new): still playing as Player 1 — select one of their vampires (`tutVampSelected()`) and play a card (`qrPhasePlayed.size` baseline-diff, same pattern as `cx-play`/`cx-target-play`). `qrPhasePlayed` is a single non-seat-scoped Set (only cleared on phase change), so the baseline-diff gate works correctly across the seat swap without any extra plumbing.

**Hand-back:** `cx-outro`'s `onEnter` now silently calls `setActivePlayer(tut._handoffSeat, {quiet:true})` if the active seat is still Player 1, so the player is back in their own seat before the final wrap-up and the `cx-leave` → Leave-seat step (which would otherwise act on the wrong seat).

All three new gate flags (`_reactClicked`, `_handoffSeat`, `_lastSaidIdx`, `_p1PlayBase`) follow the established polling/breadcrumb pattern (`tut._dockSeen`, `tut._inspected`, etc.) — no new tutorial-engine plumbing required, only small additive one-liners in `saySend()` and the `#btnDecide` handler.

**Version:** bumped client `VERSION` to **`2.5.4`** (silent patch, client-only, no wire-protocol change — same `verMM` tolerance as the 2.5.3 bump).

### Hotfix: `l4hintDone` ("Drag your pool globe") leaking back on hotseat seat-swap (30 June 2026, still 2.5.4)

Johan caught this live-testing the new `cx-handoff`/`cx-outro` round-trip seat swap: the "Drag your pool globe to your seat position" first-time hint was reappearing on *every* Table-tab seat switch in hotseat, not just once per game as the earlier fix intended. Root cause: `restoreGame()` (used by `setActivePlayer` for hand-off) calls `clearTable()` internally, which unconditionally zeroes `l4hintDone` — the earlier fix assumed `clearTable()` only ran for a genuinely new game. Fixed the same way as the `state.target` hand-off bug: `l4hintDone` is now persisted in `serializeGame()` and restored in `restoreGame()`, so `clearTable()`'s reset (correct for a brand-new, never-before-seen seat) gets overwritten with the seat's own already-dismissed/not-dismissed state right after, for any seat with a stored board. Full chain re-verified clean.

### `cx-outro`/`cx-leave` text pass: surface the silent seat hand-back, de-duplicate the sign-off (30 June 2026, still 2.5.4)

Johan's read on the "duplicate Finish box" was right: both steps closed with the same upbeat sign-off ("good hunting" / "Have fun!") back-to-back, so they read as the same message twice even though their actual content differs (recap vs. where-to-go-next). Also addressed his point about the silent `setActivePlayer(...,{quiet:true})` hand-back in `cx-outro`'s `onEnter` — it's correct to keep it silent (no log spam from a tutorial-only action), but the player had no way to know it happened. Fix: `cx-outro` now ends with an explicit note ("you're back in your own seat now... no longer playing as Player 1") instead of the closing blessing; `cx-leave` now opens with "You're ready for a real game — good hunting" (moved from `cx-outro`) and keeps its practice-table/Leave-seat instructions, dropping the redundant "Have fun!". Net effect: `cx-outro` = recap + seat-handback transparency, `cx-leave` = what to do next + the one farewell line. No logic changes, copy-only.

### Hotfix: Target ring never refreshed in L4 (Classic) hotseat (30 June 2026, still 2.5.4)

Johan tested `cx-target` live and found targeting "didn't really work" in L4 hotseat — no ring on the targeted opponent card, and the log/clone-FX target text looked wrong. Root cause: `refreshRTargetView()` (called by `setRTarget`/`pickRTarget`/`clearAnyTarget` every time a remote target changes) only handles `net.view` being a seat number, `'ov'`, or `'l2'` — it has no branch for `'l4'`. L4's opponent cards live in their own `#l4oppWrap` overlay (built by `renderL4OppCards()`/`updateL4Opponents()`), completely separate from the `#rvCards` host that `refreshRTargetMarks()` updates, so the just-set ring on the clicked opponent card was simply never painted. Fixed by adding an `else if(net.view==='l4') updateL4Opponents();` branch, reusing the existing L4 refresh path (a full `#l4oppWrap` rebuild, which recomputes the ring from current `net.rtarget` on every card). `net.rtarget`/the log text (`targetSuffix()`)/the play-FX arrow (`curTargetCard()`) all read `net.rtarget` directly and were never actually broken at the data level — they likely *looked* wrong only because the missing ring made it seem like targeting silently failed. Flagged to Johan to confirm the log/clone-FX read correctly now that the ring updates; will dig further if they're still off after this fix.

### Classic tutorial — `cp-edge` step added to `classic-play` (30 June 2026, still 2.5.4)

Small addition between `cp-bleed` and `cp-pass`: a new `cp-edge` step targets `#edge` and asks the player to **click the Edge button** to take the Edge marker, gated on `state.edge` being true (Continue grey until clicked — same `gate`+`advance:{on:'manual'}` pattern as everywhere else). Text also explains that the Edge **token** is draggable once placed (`ensureEdgeToken()`/`placeToken`, the existing felt-token family — not a card, never touches `state.cards`), so the player can park it wherever's convenient near their own play area. No core game code touched; purely a new tutorial step reusing existing `#edge`/`toggleEdge`/`state.edge` machinery.

### Peek-dock content didn't scale with window size (30 June 2026, 2.5.4 → 2.5.5)

Johan noticed that the bottom peek-dock (Crypt/Library/Ash heap/Hand, `#handPeek`/`#dockBody`) stayed pinned at fixed design size when the window grew (e.g. laptop → fullscreen), even though the rest of the L2/L3/L4 board content scales up via `l2pub.s`. Root cause: the dock's crypt/library/ash placeholders (`.qrlib`, CSS `width:var(--cw); height:var(--ch)`) and its hand cards (`qrCard(row, c, 1, 'hand')`) were both hardcoded to the fixed 84×118 design size — `#handPeek` itself grows (`height:32%` of `#tableArea`), but its contents never followed, so a bigger window just left more empty padding around static-size cards instead of filling out.

**Fix:** added a dedicated dock scale, independent of `l2pub.s` (the dock isn't part of the canonical-board geometry `l2pub` drives). New global `dockS` (declared near `CW`/`CH`, TDZ-safe) and `updateDockScale()`: reads `#handPeek`'s own `clientHeight`, subtracts its known vertical padding (18px), divides by `CH` to get a scale factor, clamps to `[0.6, 1.8]`, and writes it to a new CSS custom property `--dock-s` on `:root` (not a class rule — per the existing CSS-stacking-context learning, `:root`-level `setProperty` is what reliably reaches `position:absolute` dock children). `#dockBody .qrlib` now sizes via `calc(var(--cw) * var(--dock-s))`/`calc(var(--ch) * var(--dock-s))`; the hand-card render call now passes `dockS` instead of a hardcoded `1` into `qrCard`. `placeHand()` (previously a no-op stub) now calls `updateDockScale()`; the window `resize` listener calls `placeHand()` then, if the dock is currently open, `renderHand()` to redraw the hand cards at the new scale (their scale is baked into a `transform` at creation time by `qrCard`, so a CSS-var change alone doesn't move them — only the static `.qrlib` placeholders auto-resize from the CSS var).

Purely additive/client-only — no wire-protocol change. Version bumped to **`2.5.5`** (silent patch, same `verMM` tolerance). Full verification chain (syntax → 16/16 client tests → byte-identical split/build roundtrip) re-run clean both before and after the version bump.

### Correction: peek-dock scaling fix targeted the wrong (retired) dock (30 June 2026, 2.5.5 → 2.5.6)

Johan's follow-up question ("does this work online/offline, L2/L3/L4, all player counts?") prompted a re-check that found the 2.5.5 fix touched `#handPeek`/`#dockBody` — a fully **retired** dock (`handGate()` hardcoded to `return false`, so it never renders). The real, live dock is the `.l2dockopen`-driven block that reuses the board's own `#z-crypt`/`#z-library`/`#z-ash`/`#z-hand` zone elements, with the identical fixed-design-size bug living in `place()`'s scale branch (which explicitly skips `l2pub.s` for piles/hand whenever the dock is open) and in the dock's CSS `calc()` geometry.

**Real fix (2.5.6):** dock zone CSS (box sizes, pool-glob/log-panel position+size) now multiplies by a `--dock-s` custom property; `place()` gained an optional `forceS` override param used by `layoutZone()`'s pile/hand blocks (centering math updated to use `CW*dockS`/`CH*dockS`); `updateDockScale()` rewritten to compute `dockS` from the board's real `clientHeight*0.32` (matching `#l2dockbg`'s CSS) and is now called at the top of every `layout()` pass. Also fixed `regrabAtScale()` and the L4 drag-transition logic (`drag.l4DockDefer`), which both hardcoded the assumption that the dock's resting scale was `1` — added an optional `fromS` param and updated all three call sites so a card doesn't jump to the wrong size mid-drag when crossing the dock boundary.

Confirmed with Johan in the process: L3's separate hand-hover-peek overlay (`l3HandHover()`) is **also retired/parked** ("the L3 hand lives in the shared dock now"), so no separate handling was needed for it.

This is the single mechanism shared by L2/L3/L4, online and offline (hotseat or networked — the dock toggle/rendering doesn't branch on `netGame()`), and any player count, so the fix covers all of those by construction. Pixel/gesture math isn't covered by the automated test suite, so **this one needs live browser verification** before being considered done — especially drag-out/drag-in at the dock boundary in L4.

Version bumped to **`2.5.6`** (client-only, silent patch, same `verMM` tolerance).

### Regression fix: dock scale overshot on laptop (30 June 2026, 2.5.6 → 2.5.7)

The 2.5.6 dock-scaling computed `dockS = (boardHeight*0.32 - 36)/CH`, dividing the dock strip's height by the bare card height (118px) while actually scaling the larger zone box (CH+34 = 152px). On a laptop (~650px board) this gave dockS≈1.46, so the boxes hung out past the 32%-of-board strip and the log got squeezed (its left, anchored after the widened piles with a fixed right edge, pushed ~127px right). Fixed by scaling proportionally to board height, calibrated so dockS=1 at the canonical 616px board height: `dockS = clamp(boardHeight/616, 0.6, 1.8)` — keeps the box's original fraction of the strip at any height, grows on bigger windows, provably never overflows. Confirmed all of L2/L3/L4 use `l2cols` (board fills the area, no transform), so dockS is the sole scaler (no double-scaling). Version **`2.5.7`**.

Still pending (Johan-approved, deferred to keep this fix's diff clean): move the dead `#handPeek`/`#dockBody`/`handGate()` legacy-dock code out to `kodarkivering.md` and remove it from the monolith, matching the rest of the codebase's PARKED-to-archive convention.

### Tighter dock height — backing hugs the zones (30 June 2026, 2.5.7 → 2.5.8)

With the dock content scaling linearly (dockS = H/616) but the backing fixed at `height:32%`, the air above the zones was a constant ~5.8% of board height and grew with the window. Fixed by tying the backing height to the zone geometry: `#l2dockbg height:calc(1.5% + (var(--ch) + 34px) * var(--dock-s) + 14px)` (zone bottom offset + scaled box height + 14px for the count-badge overhang + margin), so it hugs the boxes at every size/dockS. Both `#l2dockbg` rules changed (covers L2/L3/L4, online/offline, all player counts). Air at 616px board drops from ~27px to ~5px. Left the hover-close hysteresis (`yd < H*0.66`, ~6 sites) untouched — still works, just ~5% more forgiving band above the now-shorter dock; flagged to Johan as a separate deliberate change if exact original feel is wanted (drag/hysteresis is a delicate system). Version **`2.5.8`**.

### Four l4-dispatch fixes (30 June 2026, 2.5.8 → 2.5.9)

Johan spotted the same "view-dispatch chain forgets l4" pattern (previously fixed on Target/`refreshRTargetView`) at two unrelated spots; an audit found a fourth. All fixed: (1) `roster(m)` — added `renderL4()` (full rebuild, since roster changes alter the globe set); (2) `applyPco()` (player-colour setting) — added `updateL4Opponents()`; (3) `refreshRTargetMarks()` — was `#rvCards`-only but L3 cards live in `#l3stage` and L2 in `.l2pane2` panes, so broadened to `document.querySelectorAll('.card.rc[data-cid]')` (the Target ring silently failed to toggle in L2/L3 — invisible online, persistent offline/hotseat); (4) `giveHot()` post-give re-render — added `updateL4Opponents()` (reachable in L4 hotseat via `qrGiveToTarget`). Cleared as non-bugs: `turn(m)` (only `ov`, correct — L4 has no per-board turn indicator), the rtarget-clear sites at 6778/6820/7120. Version **`2.5.9`**.

Pending (analysis presented, awaiting go-ahead before editing serialize/restore): offline/hotseat Target asymmetry — `net.rtarget` is a global NOT saved/restored per seat in `serializeGame`/`restoreGame` (unlike `state.target`, which IS at line 8217/8256), so a hotseat priority hand-off leaves the previous player's cross-board target live on the new active player (button lit with no ring, and worse, their next hand-play misroutes through `qrGiveToTarget` into a self-give that corrupts the stored board). Also `targetersOf()` is `if(!inRoom())`-gated, so cross-target "⌖ name" tags don't render in hotseat (lower impact — the active player sees their own target as a ring, not a tag).

### Offline Target parity: per-seat rtarget + hotseat targeter tags (30 June 2026, 2.5.9 → 2.5.10)

Both offline-asymmetry fixes (Johan-approved). **Fix A:** `net.rtarget` (cross-board target, used by the tutorial's Target lesson) is now saved/restored per seat in `serializeGame`/`restoreGame` (parallel to `state.target` at 8217/8256), so a hotseat priority hand-off no longer leaks the previous active player's target onto the next — which had also caused state corruption (a stale rtarget pointing at the own seat routed the next hand-play through `qrGiveToTarget`→`giveHot(ownSeat)` instead of `playFromHand`). Additive JSON field, backward-compatible. **Fix B:** `targetersOf()` guard relaxed `if(!inRoom())` → `if(!inRoom() && !localTable)` so the "⌖ who's targeting" tags render in hotseat too (the data already exists: `net.roster`, `net.you`, and `buildPub`'s ungated `target`). Version **`2.5.10`**. Needs live hotseat verification (not unit-covered): A targets B → take priority to B → confirm B doesn't inherit A's target and a normal hand-play still works.

### Code archival: dead legacy hand dock removed (30 June 2026, 2.5.10 → 2.5.11)

The retired #handTab/#handPeek/#dockBody "visit another board" dock (handGate() hardcoded false) was lifted out of the monolith into kodarkivering.md. Not a clean delete — interleaved with live code: the hand-card type-sort helpers (HAND_TYPE_ORDER/handTypeWords/handTypeTuple/handTupleCmp/handSortCmp) and updateDockScale() sit in the same region but are LIVE and stayed; `renderHand()` is now a documented **no-op stub** (still called by renderAltIfOpen/switchView/the move handler — 6 sites). Archived: the CSS, the HTML markup, handGate/handIsOpen + control fns (placeHand/showHand/hideHandSoon/pinHand/closeHand/toggleHand) + the event-wiring IIFE + renderHand's original body. Trimmed the `'dockCrypt'`/`'dockLib'` entries from the pile-flash/drag arrays; remaining references are all typeof-/if(el)-guarded (harmless). Applied as an atomic Python patch (assert count==1 per edit); file shrank ~7000 chars; full chain clean (syntax → 16/16 → byte-identical roundtrip). Version **`2.5.11`**. No backlog cleanup items remain.

### Played-tab ordering fixed: newest-first, stable (30 June 2026, 2.5.11 → 2.5.12)

The Played-tab overlay was sorting cards by an `avRank` function (action-type card = 2, `actSt==='played'` = 1, otherwise = 0) inherited from the retired Reaction Window tray. The `actSt` field on rank-1 cards is mutated by `resolvePlayedActions()` ('played' → 'resolved', dropping rank to 0) whenever a new action is started or the phase advances — causing cards to visibly jump position mid-turn with no user input.

Root cause: `avRank` was the right sort for a "react to this action" tray (old design) but is wrong for a chronological "what was played" display. Additionally, `collectPlayed()` iterated `state.zones.ready` and `pub.cards` in forward zone order (oldest → newest), so even without the sort, the list would have been oldest-first.

**Fix:** `collectPlayed()` now iterates own cards and each opponent's pub cards in **reverse zone-insertion order** (both arrays are insertion-ordered old→new, so reversing gives chronological newest-first within each seat's group). `renderPlayed()` removes the `avRank` sort entirely — order comes from `collectPlayed()` and is stable; cards only move in the display when they actually leave the ready zone. Full chain clean (syntax → 16/16 → byte-identical roundtrip). Version **`2.5.12`**. Live test: open Played tab in tutorial/hotseat, play several cards across multiple minions and phases — newest card should stay at top and nothing should reorder spontaneously.

### +/− keys adjusted for blood on selected card (30 June 2026, 2.5.12 → 2.5.13)

`+` and `−` keyboard shortcuts were pool-only. Ctrl+click / Shift+click / scroll already adjusted blood on cards (all three targeting by pointer position), but there was no keyboard-only shortcut for blood. The tutorial step "Give a vampire blood" already mentioned "+/− buttons" — this makes that accurate.

**Fix:** New helper `singleSelectedCounter()` returns the selected card if exactly one `COUNTER_ZONES` card is selected, otherwise null. `poolPlus`/`poolMinus` ACTIONS entries now call `singleSelectedCounter()` first: if a card comes back, `bumpCounter(c, ±1, 'blood')` runs on it; otherwise `bumpPool(±1)` as before. No new shortcut — same `+/-` keys, context-aware. The help overlay text on the scroll/ctrl+click line updated to document it. Version **`2.5.13`**. Live test: select a vampire, press `+`/`−` (blood should change), deselect and press `+`/`−` (pool should change).

### Played-tab sort order as a local preference (30 June 2026, 2.5.13 → 2.5.14)

User noted the `avRank` grouping from 2.5.11 (action-type cards first, modifiers second, resolved last) is actually meaningful — it naturally clusters the live action at the top. Added `conv.playedSort` (`'new'` default | `'action'`) so the user can choose per device.

`'new'` (default): newest-first from `collectPlayed()`, stable.
`'action'`: `avRank` sort restored conditionally in `renderPlayed()` — cards move as `actSt` mutates, which is the intentional live-action-grouping effect.

Settings → Convenience → "Played-cards tab order" `<select id="convPlayedSort">` added before the Action animations row. `openSettings()` initialises it; change handler calls `renderAltIfOpen()` so the overlay updates immediately without reopening. `CONV_KEY` persistence unchanged. Version **`2.5.14`**. Live test: switch between the two modes while the Played overlay is pinned open — verify order changes immediately; confirm 'Newest first' is stable and 'Action flow' regroups when a new action starts.

### Live-action batch highlight in Action flow mode (30 June 2026, 2.5.14 → 2.5.15)

In `conv.playedSort==='action'` mode, cards with `actSt==='played'` (the current unresolved action and any modifiers/reactions played on it) now receive CSS class `avc-batch`. The rule renders an amber `box-shadow` ring (2px spread, no blur) plus a soft outer glow (`rgba(210,178,82)`), giving the live-action batch a visual "live" indicator that grows as more cards join the action and disappears immediately when `resolvePlayedActions()` fires (which calls `renderAltIfOpen()`→`renderPlayed()` already). `box-shadow` was chosen over `outline` so it composes cleanly with `avsel`'s existing `outline`; `border-radius:9px` matches. `actSt` is already in `buildPub()` (`actSt:c.actSt||undefined`), so opponent cards carry it too — the highlight works for all seats. Version **`2.5.15`**. Live test: Action flow mode on, play an action + modifier — both should glow; play a second action — glow moves to the new pair.

### Basic minion actions trigger resolvePlayedActions (30 June 2026, 2.5.15 → 2.5.16)

Bleed, Hunt, Rescue from torpor, Diablerie, and Card action (the crypt-minion submenu) now call `resolvePlayedActions()` so the Played-tab batch highlight clears when a vampire actually acts, not only when a new card-type action is played or the phase advances. Block passes `resolve=false` explicitly (it's a reaction, not an action).

Implementation: the `act(verb,fxv)` lambda gained an optional third parameter `resolve=true`; `if(resolve) resolvePlayedActions()` runs before auto-lock + log so the overlay re-renders with the resolved state as the log entry fires. Only Block overrides to `false`; the other five entries are unchanged (default). Version **`2.5.16`**. Live test: play a card to ready (batch glows) → right-click vampire → Bleed (batch clears); repeat with Hunt, Card action; verify Block leaves the glow intact.

### "It resolves" quick phrase triggers resolvePlayedActions (30 June 2026, 2.5.16 → 2.5.17)

One line in `saySend(i)`: `if(SAY[i|0]==='It resolves') resolvePlayedActions()`. String-checked (not index-checked) for robustness. Called at send time — the Played tab batch highlight is local-only, so it does not need to wait for a network echo. Version **`2.5.17`**.

### Cross-seat Played-tab ordering + Action flow help text (30 June 2026, 2.5.17 → 2.5.18)

**Cross-seat ordering (_avSeq):** A global `_avSeq` counter (never reset on hotseat seat switch) is incremented in `tagPlayed()` and stamped onto each loose-ready card as `c._avSeq`. Included in `snapshot()`/`restoreSnap()` (undo), `serializeGame()`/`restoreGame()` (autosave + hotseat hand-off), and `buildPub()` (opponent pub). Restore paths advance the global counter past any restored value so new plays always get higher sequence numbers. `collectPlayed()` now removes per-seat reversal and sorts ascending by `_avSeq`, interleaving all seats chronologically. `renderPlayed()`: 'new' mode calls `list.reverse()` (oldest→newest → flip to newest at top); 'action' mode sorts by avRank desc + `_avSeq` desc as tiebreaker (newest within each rank group).

**Help overlay:** `#helpActionFlow` div added inside `#helpOverlay` (hidden by default). `updateActionFlowHelp()` is called inside `setHelp()` when the overlay opens and shows/hides the div based on `conv.playedSort==='action'`. Lists all resolve triggers and explicitly notes Block as a non-trigger. Version **`2.5.18`**. Live test: Action flow mode on, open `?` help → resolve info should appear; switch to Newest first → same help opens without the section.

### Bugfix from the cross-seat analysis: _avSeq became a timestamp (30 June 2026, 2.5.18 → 2.5.19)

A review of the 2.5.18 cross-seat ordering against online play found a real bug: `_avSeq` was a per-client incrementing counter starting at 0. In hotseat it is shared across seats via serialize/restore (so it is globally monotonic there), but ONLINE each client has its own counter — client A's card #3 and client B's card #1 carry incomparable per-client sequence numbers, so `collectPlayed()`'s merge interleaved the seats wrongly online.

**Fix:** `c._avSeq` is now stamped as `Date.now()` (wall-clock) at play time instead of an incrementing counter. A timestamp is globally comparable across independent clients with no coordination, so the cross-seat order is correct online AND in hotseat. Because a timestamp is only ever compared (never "advanced past" a restored value), the counter-advance logic in `restoreSnap`/`restoreGame` was removed — simpler. Card id (`'c'+mint-order`) is a deterministic tiebreaker for same-millisecond plays, added to both the `collectPlayed()` ascending sort and the `renderPlayed()` action-mode descending sort. Also fixed `restoreFromPub()` (host restoring an online player's board from a saved snapshot) which wasn't stamping `_avSeq` at all — those cards would have sorted as 0. Version **`2.5.19`**.

### Consolidated verification: 2.5.12–2.5.19 across transports & views (30 June 2026)

A full cross-check of the seven Played-tab changes against online/hotseat and L2/L3/L4 confirmed they hold by construction. The structural reason: the Played tab is `position:fixed` (window-anchored, not board-anchored) and `renderPlayed()` has **zero view branches** — one code path for L2/L3/L4. View-sensitive concerns (card coords, scale) are handled by the already-proven `avRenderCard`/`addRCard`, so the new behaviour renders identically in every view.

- **Newest-first / cross-seat order (2.5.12, 2.5.18→2.5.19):** `collectPlayed()` reads own `state.zones.ready` + every opponent's `pub.cards`; `_avSeq` (now a timestamp) is in `buildPub` (8278), so it survives both the online wire (`board(m)` stores `m.pub` verbatim at 7094) and the hotseat serialize/restore + buildPub path. Correct in all transports/views.
- **Action-flow sort + batch highlight (2.5.14, 2.5.15):** `actSt` is in `buildPub` too, so the amber `avc-batch` ring shows for opponent cards online and in hotseat. `conv.playedSort` is local; a change calls `renderAltIfOpen()` for an immediate refresh.
- **Resolve triggers (2.5.16 basic actions, 2.5.17 "It resolves"):** live in the card context-menu and `saySend()` — neither branches on view. `resolvePlayedActions()` ends with `renderAltIfOpen()`, so the batch clears visibly in every view.
- **`+/−` blood (2.5.13):** `singleSelectedCounter()` reads `state.selected` (view-independent); `bumpCounter`/`bumpPool` only ever mutate your OWN state, so even in a remote table-view `+/−` safely adjusts your own pool, never an opponent's card.
- **Help overlay (2.5.18):** `#helpActionFlow` shows only when `conv.playedSort==='action'`, via `updateActionFlowHelp()` in `setHelp()`. The `?` button is hidden only in L0 (lobby), present in L1/L2/L3/L4.

---

## Cross-board card lifecycle (v2.5.20–2.5.26)

Giving a card onto another player's board, pulling it back, and acting on it there — grounded in a **three-axis ownership model**:

- **owner** (permanent, rules) — where the card goes when it leaves play (its owner's ash heap). Never mutated by any of this code.
- **controller** (rules) — who *acts* with the card. Default = owner, special = an opponent (`Give control…`).
- **placement** (spatial, engine) — which board's data the card lives in / what it's attached to. Drives rendering.

The guiding correction: **interaction follows controller, not placement.** A card you control but that sits on an opponent's vampire is still yours to act on.

**The give paths all funnel through `giveTo`.** Two drag systems feed it: bindCard's pointerup + `opponentSurfaceAt` (L2/L3/L4 — the L4 branch hit-tests `#l4oppWrap .card.rc[data-cid][data-seat]`), and `startGiveDrag` (single-board visit, its own `elementFromPoint` hit-test). `giveTo` routes hotseat → `giveHot` (local inject) and online → a `give` wire message. Giving is a **drag**; double-clicking a hand card **plays** it (a set target shows in the log/animation but does not attach it).

**Undo of a cross-board move is semantic, not snapshot-based.** `snapshot()` only captures your own `state.cards` and `restoreSnap` does `state.cards.get(id)`, so a card `destroyLocal` removed at give-time can't be recreated, and another seat's board is out of reach. So give / take-back push a semantic entry (like the `UNDO_DRAW` sentinel) that reverses itself, dispatched by `applyUndoEntry` in `undo()`. Shared hotseat helpers: `hotInjectCard` / `hotPullCard` / `spawnHandCard` / `spawnAshCard` / `hotReRender`.

**Controller actions** live on the opponent-card right-click menu (shown when `owner === net.you`, plus — v0.4.4, 13 July 2026 — when the seat itself is a self-declared bot): **Take back** (to hand, owner-only) and **Burn to my ash** (owner-only, since these move the card off the board), **Blood ±1**, **Blue/Green ±1**, **Lock/Unlock**, **Flip**, and **Send to torpor / Leave torpor** (new, vampires only) — all available to owner OR bot-seat. Hotseat mutates the board JSON directly; online routes through the server.

**The bot-elements exception (Johan, 13 July 2026) adds a fourth, SEAT-level override on top of the three-axis model:** a seat that self-declares `bot:true` at create/join makes its own cards controllable by anyone, regardless of `owner`/`controller`. This exists because a headless bot can't model every triggered ability (an untap-phase ping, a torpor rescue) — the table needs to be able to step in. `elysium-bot.js` gained its FIRST-EVER `ctrl` handler for this (it had none before: the owner-gated menu never showed controller actions against a bot seat, so this wire path had never actually been exercised against a headless receiver) — deliberately with NO `owner===from` check, unlike the human client's own holder-side receiver. This is safe only because reaching the bot's handler at all already requires the seat to have opted in; a normal human-to-human `ctrl` is untouched (still owner-gated client-side). Hotseat can never have a bot opponent (the bot needs a real WebSocket server), so `hotCtrl`/`net.hot` were not touched for this.

**The online protocol** (server verbs `recall` / `recalled` / `ctrl`, all pure routing):
- The **giver assigns the card id (`gid`)** and sends it; the recipient reuses it via `makeCard(name,kind,gid)`, so both sides share one id — the prerequisite for recall and undo-of-give.
- **Recall / Burn** = a two-hop round-trip: owner → holder (validates `owner`, removes the card, re-broadcasts, confirms) → owner (recreates it in hand or ash). The destination is owner-side; the holder only removes.
- **Blood** = one `ctrl` message; the holder applies it to their live card and re-broadcasts.
- Backward-compatible: unknown verbs are ignored, an old client omits `gid`. `owner` is never mutated. Requires the holder online (like any give).

Server bumped 2.5.0 → 2.5.2 (patch; major.minor stays 2.5, so no `verMM` mismatch warning). Client 2.5.19 → 2.5.26. **The server must be restarted** for online recall / burn / blood.

### Deferred / roadmap (from the post-work code review)
1. **The controller menu gates on `owner`, not `controller`.** Model-correct would gate on control and split "take back to hand" (owner only) from "act on" (controller) — the one place the implementation deviates from the three-axis model.
2. **`err` clears `net.recalling` wholesale.** Two concurrent recalls where one holder is offline could drop the other's pending guard (a lost card). Unreachable in normal one-at-a-time use; fix = echo the cid in the error.
3. **Online blood/burn feedback lags** (the 600 ms `schedulePush` debounce, no optimistic local update) — invites over-clicking. Hotseat is immediate.
4. **`gid` collision** (same-ms + same random) is negligible but a monotonic counter would remove it.
5. **Immediate board-push on recall/burn** for snappier sync (shorter window where the card shows in two places).
6. **`giveTarget` highlight on the L2/L3 board area**, not only on cards.
7. **More `ctrl` actions** (lock/unlock, flip, counters ±) via the same switch — one branch each on both sides.
8. **The L4 give hit-test takes the topmost card** — could prefer the host vampire over an attached child.


### L3 chrome relocation (v2.5.47)
Only the 5-player pentagon has a calibrated felt hole for the Timer/Round/Edge centerpiece (v2.5.44-45 calibration). For N≠5, `renderL3()` sets module-global `l3centerOnFelt=false`, which: hides `#l3timer` (felt Timer+Round) in favour of a new `#statsL3Info` row at the top of the Table panel (`updateL3PanelInfo()`, shares string-building with the felt version via `l3TimerStrings()`); and hides the felt `#edge` marker in favour of a new `#edgeChrome` button living in `#l1zoomWrap` just above Reset view (same click handler, `.lit` state mirrored by `updateEdge()`). **N=5 is pixel-identical to pre-v2.5.47** (the gated code paths are unchanged). L4 (the single-board "helicopter" view) is defensively immune — `l3on()` is ALSO true during L4 rendering (board carries both `l3mode`+`l4mode`), so `renderL4()` resets the flag to `true` every render, and `l4on()` is belt-and-suspenders-checked in the panel-row and chrome-button conditions.


### Bottom dock row order (v2.5.50)
The dock row is **Log · Crypt · Library · Ash · Hand · Pool** (was Crypt·Library·Ash·Hand·Pool·Log) — the log now leads so it sits on the same screen side as the aside panel it substitutes for when collapsed. `updateDockScale()`'s Hand/Log shared-budget math (440:520 ratio, clamped together on overflow) is UNCHANGED — the total width consumed by the four fixed elements (Crypt/Library/Ash/Pool) is order-independent, so only five `left` CSS formulas needed a common `var(--dock-log-w) + 8px` prefix. **On the horizon:** Johan is considering making Log a fixed size too (matching Crypt/Library/Ash's card-based fixed slots) and leaving only Hand flexible — deliberately deferred until the reordering has been lived with for a while.

### Bottom dock row - aside-aware Hand width (v2.5.52)
`#dockLog` only ever renders when `body.aside-collapsed` (log lives in the aside panel otherwise). The row's base CSS rules (Crypt/Library/Ash/Hand/Pool) are now the ASIDE-EXPANDED default (no Log-prefix, matching pre-v2.5.50); a `body.aside-collapsed #board.l2dockopen #z-X{...}` override block re-adds the v2.5.50 Log-leading shift scoped to when Log actually renders. `updateDockScale()` branches on `asideCollapsed`: collapsed → Hand+Log split the shared budget **596:364** (v2.5.55: was 440:520 — 30% of the log's width moved to hand per Johan, same 960 total); expanded → **Hand takes the entire shared budget** (nothing competes with it since Log isn't shown in the dock).

### Backlog sweep (v2.5.56–v2.5.60)
Six backlog items shipped in one arc: **2.4.e** (give kid-hit → `pubTopHostEl`, all THREE paths), **2.4.b** (recall-err echoes `cid`, targeted guard clear, §8 row — server change, RESTART REQUIRED), **2.6** (lint v3 brace-walks create/join; 7 checks; first run caught 3 stale §3 doc fields), **2.4.d** (ctrl verbs: lock/unlock/flip/blue±/green± across holder-online + hotseat + owner menu; server routing untouched), **2.1** (peek-pane reuse conversion — the LAST rebuild surface; neighbour cards now glide/flip via the v2.5.38 reconcile; `dataset.mode` key `('col'|'open')+'|'+seat` wipes on mode/seat change), **2.2** (optimistic ctrl apply on the local pub copy + `.recallPend` dim for recall/burn with confirmation-gated spawn + `pushNow()` immediate holder push), **2.3** (`elysiumPubPreview()` console dev tool — own pub through the exact opponent render path, try/finally-restored impersonation). Remaining in the backlog: 2.4.a (controller-vs-owner menu gating, design first), 2.4.c (giveTarget mat highlight), 2.4.f (gid monotonic), 2.5 (perf sentinel, symptomatic only), §1 L0-reset decision, §3 cleanup items.

### v2.5.61–62 + review sweep
Server v2.5.61: review Findings 1 (spectator name dedup + case-insensitive host lookups) and 2 (`MAX_PLAYERS` in `sanitizePub`) — one restart covers v2.5.56+61. Client v2.5.62: **Give back** (backlog 2.4.a per Johan's design — both parties can end a control arrangement; the holder's menu gets "↪ Give back to <owner>", riding the whole existing give machinery online and hotseat). Finding 5 closed: `test-server-dispatch.js` gained a give→recall LOOPBACK test (6 tests now) via a WS-frame-decoding recorder socket, locking the cross-board family's behaviour incl. the v2.5.56 err-cid echo. **Docs diet:** journal split — pre-v2.5.39 entries live in `elysium-session-journal-archive.md`; the live journal dropped 470KB→~74KB. Remaining 2.4.a refinement (controller-field-based gating of blood/lock rights) recorded in the backlog.

### The branch merge (v2.5.72, 3 July 2026)
Two parallel branches forked at v2.5.55 (Johan continued in the wrong chat) were reunified: **A-branch** v2.5.56–71 (the backlog sweep: pubTopHostEl, recall-cid + lint v3, ctrl verbs, peek-pane reuse, optimism+pushNow, pubPreview, server Findings 1+2, giveBack + loopback test, path-badge chosen-only, the flip calibration saga, unlock guard) + **B-branch** v2.5.56B–63B (MB info, opening transfer ramp + reduction prompt + hard block, superior-discipline badges, the FX_TIMING table, Deck-lab sticky/jumps, 4p L3 geometry with its own harness, sup SVG downloads, remote badges). Base = A-v2.5.71; B transplanted by journal-guided slice extraction in three gated patches. Three true conflicts reconciled: unlock duplicate → A's `_anyLocked` kept (and Johan's "regression" memory was CORRECT — the fix lived in B56); flip = B's FX_TIMING infrastructure × A's proven values (Node-verified to 1 ms per phase boundary); remote path badges = chosen-only + crypt-only per Johan's A64 decision (**veto-flagged** — printed-parity is a one-line revert in `_syncRB`). New standalone: `harness-l3-4p.js` (ALL CHECKS PASSED vs merged). Server untouched by B (still 2.5.61 — the one pending restart covers everything).

### The online sweep (v2.5.73 client / v2.5.62 server, 3 July 2026)
Johan's five-point online review. **(1) `sanitizePub` was the silent hole:** the server whitelist predated the token family and ATE `pub.tokens` (Edge + pool-globe positions), `pub.clan`, and the card fields `actSt`/`_avSeq`/`path`/`sup` — the entire client chain (drag→schedulePush, buildPub export, board-handler→updateL4Opponents→renderL4OppCards, mats, visit) was already complete, but hotseat pubs bypass the server, so everything "worked offline" while online opponents only ever saw the client-local default globe circle. v2.5.62 relays all six, each sanitized (tokens: ≤8, type-regex, coords rounded+clamped; clan/path via cleanCard; sup trigram; actSt enum; _avSeq finite positive int). One fix un-broke four things at once online: token sync, the L4 globe clan icon (A2), remote path/sup badges (B63), and the Played tab's cross-seat interleave + action batching. Runtime-proven: the patched function brace-walked out of the live server and run in Node, 13/13. **Rule now in learnings: any new `buildPub` field must be added to `sanitizePub` in the same patch, or it works in hotseat and silently dies online.** **(2) fx↔board coupling:** `cardFx`'s broadcast branch now calls `pushNow()` right after the `fx` mpSend — the clone verb used to arrive ~600 ms (schedulePush debounce) before the card itself; debounce untouched per doctrine (it coalesces counter bursts; discrete play/flip/rise is exactly what pushNow is for). **(3) Lobby-return:** ☰ Menu → Deck lab/Load deck over a lobby, and the lobby's own "Import deck…", all went through `openOverlay()` (hides ALL other modals + nulls labDuo) — Close/Esc stranded guests on the welcome screen. New `lobbyReturn` ticket: `openImport` stamps the displaced lobby; `openDeckLab` opens BESIDE (duo) when a lobby is visible OR a ticket exists (covering the import→deck-lab chain); `impCancel`/`impOk` route via `closeToLobby()` (re-render + `net.lobby` guard → graceful plain close if the room died); global Esc is duo-aware; `openOverlay` gained a stale-guard (any OTHER modal forfeits the ticket). Welcome path byte-unchanged. Runtime-proven verbatim under DOM stubs, 7 sequences 11/11. **(4)+(5) architecture answers, no code:** guest persistence over quick tunnels is per-ORIGIN by web design (IndexedDB image archive + `_vtesJson`, localStorage `elysium.decks`) — file export/import is the stopgap, a NAMED tunnel/VPS (backlog §4) is the real fix; images are fetched per-client from static.krcg.org with the local IndexedDB archive winning cache-first — the host never proxies images. Bonus: `buildPub().anchor` (zero receive-side consumers, eaten by the whitelist anyway) removed.

### The prepared-guest mode + the fx relay catch-up (v2.5.74 client / v2.5.63 server, 3 July 2026)
**(1) fx relay (server):** the `fx` handler's kind enum only passed `lock|unlock|play` — `flip` and `rise` were silently dropped, and the relay forwarded only `kind/card/target/verb`, eating `reveal`/`actor`/`onto`/`toName`. Second member of the whitelist-drift class (sanitizePub was the first); the protocol doc's §8 row already listed every field — the reference server caught up with its own contract again. One fix restores online: flip clones (Johan's report), rise clones, the acting-vampire in play clones, the cross-table onto-chip, and the conceal/reveal direction. Privacy nuance: a conceal-flip carries the name it flips AWAY from (public one frame earlier; without it the remote clone is back→back) — a scoped exception at exactly two sites (client mpSend term, server post-fxCard override), each commented; every other face-down payload still has its name blanked server-side (fx is cosmetic; no state trusts it). Runtime-proven 15/15 (handler+fxCard+cleanName brace-walked out of the live server file). **(2) Prepared guest (client):** browser storage lives at the ORIGIN — a guest keeping a local copy of the client (file:// or own localhost) has a stable origin where the image archive, card DB and saved decks persist forever, but couldn't REACH a tunnel: wss-vs-ws + the port were derived from the PAGE's protocol and `cleanAddr` stripped the pasted scheme before the decision. Now `mpConnect` sniffs the RAW input — an `https://`/`wss://` prefix means a secure target (wss, 443, `:8123` stripped) regardless of page protocol; a bare host keeps today's behaviour exactly (LAN IPs, https pages: unchanged by construction); an https PAGE still always forces wss (mixed content only binds upward). `net.sec` remembers the choice (mid-game reconnects), persists via `mpStore`, and `mpJoin` passes `st.sec` as a hint (named-tunnel future). Runtime-proven 12/12 over the page-protocol × input matrix. Guest workflow: open the local client → download DB/archive once, save decks → paste the host's fresh tunnel link into the address field each session. Safari caveat: file:// storage is flaky there — running one's own `start-elysium.bat` (localhost) is the robust fallback.

### Dock-drag parity, dock pinning and the ❗ button (v2.5.75 client, 3 July 2026)
**(A) Parity:** pile drags (lib/crypt ghosts) closed the dock unconditionally at drag start while already carrying the same per-move leave-close (yd < H·0.66) the L4 hand path uses — the start-close is now gated on the new setting's 'close' mode, so the default matches the hand behaviour everywhere. **(B) `conv.dockDrag`** 'leave' (default) / 'close', local, Settings row after Draw-click; 'close' covers pile drags in every view plus L4 hand drags via a one-shot `drag.dockCloseNow` (fires the defer-exit on the first move; consumed so a deliberate deep re-entry still reopens without flicker). L2/L3 hand fans deliberately ride out the whole drag (the fan IS the hand UI there) — named in the hint. **(C) Dock pinning — final mechanic after two live iterations:** `#l2dockbg` (the dock's own exposed background, already sitting behind every pile/card in z-order) listens for clicks directly on itself (`e.target===_dbg`, so bubbled child clicks don't count); click 1 pins (glowing top edge via `box-shadow` — chosen specifically because `#l2dockbg`'s base display rules carry two ID selectors each, out-specificitying any `.pinned{border-top-color:...}` override; box-shadow is a fresh property so the conflict never arises), click 2 calls `setL2Dock(false)`. All FIVE auto-closers still gate on `!dockPinned` (pile start, pile leave ×2, hover hysteresis board+rview, touch felt tap, L4 defer-exit's close/hide branch) — the mechanic is unchanged from the original design, only the trigger element moved. enterL0 resets; the marquee-exclusion list moved from `#l2dockPin` to `#l2dockbg` (an unexcluded click there would both pin AND spawn a selection-clearing zero-size marquee). A pinned dock keeps siblings visible while an L4 card rides out (scale transition still runs). **Iteration path (undocumented per the person's explicit request at each step): chip (📌, Played-tab pattern) → slimmer chip (⌃) → background click.** The person's own read each time: the pin symbol "doesn't feel like it belongs," then "sticks out a bit too much" — landing on the least visually intrusive option, a click with no visible affordance until pinned. **(D) `#btnHoldOn`** (❗, left of ⏱) = `saySend(0)` — spectator guard, online relay (the server bcasts say without except, sender included), hotseat render, SFX and the tutorial breadcrumbs all ride the existing path; the designated future reaction hub. Tutorial: new `cx-holdbtn` step after the menu-path step; `ci-dock` text mentions the pin. Consolidation leftovers closed: `sup:null` back in the card factory literal; the even-grid comment corrected to 6+ (N===4 has its own branch). Proofs: pin machine S1–S4 verbatim-under-stubs, pile truth tables, L4 vectors 5/5 with realistic grab points (the reopen sliver is only the bottom 36 px — the edge case "grab inside the sliver in close mode" resolves to net-open, self-consistently). Gates: 16/0 ✓, fragment syntax 12/12 ✓, roundtrip **918534 bytes** ✓. Server untouched on 2.5.63.

### Name size bump + a systemic clan-icon bug: in-place flips never re-triggered clan detection (v2.5.82 client, 3 July 2026)
Two items. **Name:** `.saywho` 14px→18px, two steps up per Johan, nothing else changed. **Clan icon bug:** `activeClan()` reads a CACHED value, `state.myClan`, only refreshed when `updateMyClan()` is explicitly called — it is not recomputed on every render. Auditing every `updateMyClan()` call site against every `c.faceDown=` assignment in the file found exactly one trigger class covered: a crypt vampire entering/leaving the `ready` zone (a zone change, handled in `move()`). Flipping a card that STAYS in the ready zone (`c.faceDown=!c.faceDown` with no zone change) never triggered it, at **five** separate sites: the own-card menu's Flip action, the double-click flip-up shortcut, `groupFlipUp()`, `flipSelected()`, and the online holder-mirror (`ctrl`'s `flip` verb, an explicit duplicate of the menu flip's sequence). This exactly explains Johan's L4 report: drawing 2 crypt cards triggered a zone-change recompute while they were still face-down (found nothing), flipping them face-up afterward triggered nothing, and drawing a 3rd (still face-down) card's zone-change recompute incidentally picked up the two already-flipped cards as a side effect. Fixed at all five sites (`if(c.kind==='crypt') updateMyClan();` right after the faceDown toggle; the two group-flip functions batch it once per group instead of per card). Two adjacent findings from the broader audit, same bug class: **`restoreSnap()`** (undo) restores each card's faceDown/zone but never recomputed the derived clan/path cache — fixed by adding `updateMyClan()` next to the existing `renderPhaseCounts()` call (same "restored but never redrawn" reasoning as v2.5.46's five undo gaps). **`resetForDeal()`** (starting a fresh deal) put every crypt card face-down back in its home pile but never reset `state.myClan`/`myPath` — fixed by clearing them (deliberately leaving `state.chosenClan`, the player's manual override, untouched — that's meant to survive a reshuffle of the same deck; `clearTable()`'s full-wipe reset already clears it separately where that's the right call). Runtime-verified in isolation: simulated Johan's exact scenario (two face-up crypt cards in `ready`, `state.myClan` still stale-null) — confirmed nothing would ever correct it pre-fix, and `updateMyClan()` now correctly resolves it. Gates: `node --check` ✓, **16/0** ✓, byte-identical roundtrip **926002 bytes** ✓.

### Quick-phrase medallion, round four: name un-coloured -- the ring already carries the signal (v2.5.81 client, 3 July 2026 — superseded in part by v2.5.82's font-size bump above)
Johan's design call: with the ring already player-coloured, colouring the name text too made it recede into a same-hued backdrop rather than stand out. `showSay()` no longer applies `col.hex` to `.saywho` — the name is back to plain static `--brass`, exactly the pre-feature original, no dynamic colour at all. `col`/`clan` still drive the circle's gradient and which clan icon shows; the colour signal now lives only in the ring, not duplicated in the text above it. Gates: `node --check` ✓, **16/0** ✓, byte-identical roundtrip **924546 bytes** ✓.

### Quick-phrase medallion, round three: the real icon-fill bug, and the name reverted verbatim (v2.5.80 client, 3 July 2026 — superseded by v2.5.81 above)
Two fixes. **Name:** `.saywho`'s font-size (14px) was never actually changed from before the feature — but v2.5.78's `-webkit-text-stroke` made it read as visually different. Reverted the rule to the exact pre-feature CSS (only colour is now dynamic, via inline style); the name was already structurally independent of the circle/icon (a sibling element positioned above the phrase, same as always), so no structural change was needed there. **Icon:** found the actual root cause of "only fills about half the ring" — `.sayclan` was sized as a PERCENTAGE (`92%`), but of `.sayb`, which auto-shrinks to the phrase's text width (`white-space:nowrap`) — NOT of `.saycircle`'s fixed 190px. A short phrase gives a narrow `.sayb`, so the percentage-based icon size came out well under the circle; the two elements were never guaranteed proportional since they used different units against different reference frames. Fixed to a matching fixed px size (**175px**, the same 92% ratio but computed against the circle's own 190px instead of the variable phrase width) — now stays proportional to the circle regardless of phrase length. Opacity reverted to **.5**, exactly matching `.clansym-pool` on the pool globes (Johan's explicit reference) — .85 was overcorrecting for what was actually a sizing bug. Gates: `node --check` ✓, **16/0** ✓, byte-identical roundtrip **924376 bytes** ✓.

### Quick-phrase medallion, round two: the big circle was right, the icon just needed to fill it (v2.5.79 client, 3 July 2026 — superseded by v2.5.80 above)
Johan's v2.5.78 feedback was misread the first time: the big background medallion was liked and should stay — only the clan icon INSIDE it was too small and needed to fill the ring. Reverted the v2.5.78 side-badge (`clanSymBadge()` beside the name) back to the v2.5.76 big-circle-behind-the-banner structure, but enlarged `.sayclan` substantially: **60%→92% size, opacity .5→.85** — the icon now fills the ring instead of reading as a faint watermark. The v2.5.78 dark text-stroke on `.saywho` was kept (not commented on, presumably still wanted now that the name is player-coloured). Gates: `node --check` ✓, **16/0** ✓, byte-identical roundtrip **923833 bytes** ✓.

### Quick-phrase medallion redesign (v2.5.78 client, 3 July 2026 — superseded by v2.5.79 above)
Johan's live-test feedback on v2.5.76 point (6): the icon and name didn't "fill the ring" — both looked too small against the big background circle. Root cause: v2.5.76 put a large (190px), faintly translucent circle BEHIND the whole two-line banner (name+phrase together), with the clan icon as an even fainter watermark on top — the same treatment `.clansym-pool` uses on the pool globe, but that pattern only works where the circle IS the element (the globe, sized to the number sitting inside it); here the circle was backdrop behind a much taller 58px phrase, so both circle and icon read as lost/small. Fix: switched to the already-established `clanSymBadge()`/`.clanbadge` pattern (the same one whose centring was just fixed in v2.5.76 point 7) — a compact, solid 30px badge with the icon filling ~80% of it, placed BESIDE the name in a new `.saywhorow` flex wrapper, instead of behind the whole banner. The name itself is unchanged in size (still 14px) and gained a dark outline (`-webkit-text-stroke:0.6px rgba(0,0,0,.75)`) alongside the existing shadow, since its colour now varies per player and a pale seat colour needs the extra contrast a fixed `--brass` tone never did. Gates: `node --check` ✓, **16/0** ✓, byte-identical roundtrip **923471 bytes** ✓.

### Hotfix: quick-phrase colour/clan missing in hotseat (v2.5.77 client, 3 July 2026)
Johan live-tested v2.5.76 point (6) and found colour/clan worked online but not in hotseat. Root cause was one step upstream of `sayIdentity()` itself: `saySend()`'s non-online branch (covers BOTH true solo play and hotseat, since `inRoom()` is false in both) unconditionally passed `state.playerName` as the sayer's name — but per the code's own comment (line ~2244), `state.playerName` is explicitly the SOLO-mode name, a different concept from hotseat's active-seat identity (`net.you`, which tracks the currently-active seat and IS present in `net.roster` — populated in `startHotseat()`). So in hotseat, `sayIdentity`'s `net.roster` name lookup was silently failing (`state.playerName` never matches a roster entry), always returning `{col:null, clan:null}`. Fixed to `net.you||state.playerName||'You'` (the same fallback pattern already used at three other call sites, e.g. `clanLogName()`), plus passing the real active seat (`mySeat()`) instead of a hardcoded `0` for defense in depth. Runtime-verified in isolation: the old call reproduces the exact bug (`null`/`null`), the new call resolves correctly and continues to track seat switches. Gates: `node --check` ✓, **16/0** ✓, byte-identical roundtrip **923770 bytes** ✓.

### Seven mixed fixes (v2.5.76 client, 3 July 2026)
**(1)** `#btnHoldOn` looked larger than its sibling header buttons — not a CSS issue, a Unicode presentation one: U+2757 defaults to a colour emoji glyph in most font stacks, unlike its siblings' default-text glyphs; a trailing U+FE0E (text variation selector) forces the plain glyph. **(2)+(3)** The real root cause behind two reported bugs at once: v2.5.75's dock-drag parity fix gave L4 hand drags an `l4DockDefer`-based wait-until-the-card-leaves step, but **real L3 (non-L4) never got the equivalent** — its Hand-zone drag-start branch closed the dock and jumped to felt scale unconditionally, ignoring `conv.dockDrag`/`dockPinned` entirely. Fix: L3 now sets the same defer flags L4 already used; the per-move block (generalized from `l4on()` to `l3on()`, with `L4_CARD_S` still gated on `l4on()`) does the actual close/rescale once the card crosses the 66% leave threshold. Separately, the Library/Crypt "ghost" drag system (its own IIFEs, not the generic card-drag path) set its scale ONCE at drag start to felt/board scale regardless of dock state; a new shared `ghostScale()` helper (in both IIFEs) returns dock scale while the dock is open, felt scale once closed, re-applied every move tick so it tracks live `setL2Dock` toggles. **(4)** `#dockPool`'s numeral font-size was a fixed 30px while its circle already scaled with `var(--dock-s)` — now `calc(30px * var(--dock-s))`. **(5)** The L2→L3 dead-space-on-the-right bug (previously investigated in v2.5.48, which fixed the pre-toggle `l3canonAR` measurement) had a SECOND race in the post-toggle correction: a guessed 200ms `setTimeout` stood in for "the aside's 140ms CSS width transition is done," with `_asideResize` reset even earlier (inside the immediate rAF callback) — on a slow frame/tab this can leave L3/L4 geometry (reads live `board.clientWidth`) stuck mid-transition until an unrelated resize/click corrects it. Fix: a `transitionend` listener on `aside` (gated on `propertyName==='width'`) is now the authoritative trigger, with a 250ms timeout kept only as a backstop. Flagged to Johan as analysis-based, pending live confirmation (the sandbox cannot render). **(6)** Quick phrases: new `sayIdentity(who, seat)` helper resolves colour+clan via a `net.roster` NAME lookup (not the passed `seat`, which `saySend`'s hotseat branch always sends as `0` — not a valid `PLAYER_COLORS` index) — own seat uses `activeClan()`, other seats read `net.boards[seat].pub.clan` (mirrors `updateL4GlobeHTML`'s identical pattern). `showSay()` now renders a `.saycircle` (the same `poolGradient()` treatment as the pool globe) plus a `.sayclan` watermark (`clip-path:circle(50%)`, matching `.clansym-pool`) behind the name/phrase, with the name coloured inline. **(7)** The clone-animation clan icon's off-centre appearance traced to a genuine CSS bug, not a one-off nudge: the badge `<img>` carries both `.clansym` (`margin-right:0.18em`, an EM value scaling with ambient font-size) and `.clanbadge img` (`margin-left:2px`) — since `.clanbadge` is a centering flex box, the asymmetric margins push the icon off its centre by half the difference, invisible at the settings row's ~14px ambient font but very visible at the clone caption's 27px (`0.18em`≈4.9px vs 2px). Fixed at the ROOT (`.clanbadge img{margin:1px 0 0 2px}`, explicit shorthand zeroing the other sides) so `.clansym`'s inherited margin can never leak into any current or future badge usage regardless of ambient font size. Gates: `node --check` ✓, **16/0** ✓, byte-identical roundtrip **923368 bytes** ✓. Server untouched on 2.5.63.

### Advanced tutorial: Structured table walkthrough (v2.5.83 client, 4 July 2026)
First "Advanced" tutorial section, `structured-intro`, added to `TUT_ORDER` as section 8. A 30-step walkthrough of the Structured board that builds on Classic without repeating basics. Covers: lobby setup (Structured + Tournament OFF + Fill table, 5 players), zone orientation (Ready/Uncontrolled/Torpor/Pool as fixed zones), the phase helper bar (Unlock/Master/Minion/Influence/Discard with action counts and warnings), and all navigation modes (Prey/Predator fold-out tabs, L3 Overview via §/arrows, seat-visit via ←/→, Tab toggle to active player). Launches from the welcome screen; lobby steps use `onEnter` to pre-set Board style and Tournament toggle. Tutorial-game persistence follows the same snapshot mechanism as the Classic chapters (TUT_GAME_KEY + per-chapter entry snapshots). The `tutTick` guard uses `idx>6` because the first 7 steps walk through the lobby before the table exists. Gates: `node --check` ✓, **16/0** ✓, byte-identical roundtrip **941425 bytes** ✓. Server untouched on 2.5.63.

### Advanced tutorial: Play online walkthrough (v2.5.84 client, 4 July 2026)
Second "Advanced" tutorial, `online-hosting`, added to `TUT_ORDER` as section 9. A 25-step informational walkthrough of the entire online hosting flow — no live server required. Five blocks: (1) outside-client prep (Node.js, start-elysium.bat, Cloudflare tunnel, guest perspective), (2) Connect dialog field-by-field with host/guest distinction highlighted per field, (3) Create vs Join buttons, (4) online lobby (player list, seat picker, dice rolls, deck import, Start gate), (5) host helper policy and auto-reconnect. The `oh-dialog` step uses `onEnter` to open `#mpModal` so the fields are visible; `oh-lobby-intro` closes it. No tutTick guard needed (no game is ever started). No snapshot persistence (no board state). Gates: `node --check` ✓, **16/0** ✓, byte-identical roundtrip **949908 bytes** ✓. Server untouched on 2.5.63.

**Version-number archaeology note (the A/B fork, v2.5.56–63):** those version designations are AMBIGUOUS — the two branches that forked at v2.5.55 (merged in v2.5.72) each minted their own v2.5.56–63, naming DIFFERENT deliveries (A-branch: the backlog sweep; B-branch: transfers/FX/4p — the merge entry calls them A56… and B56…). The journal's v2.5.72 merge entry is the disambiguation key: B-branch versions are suffixed "B" THERE, but code comments written inside each branch before the merge are NOT suffixed. When dating a code comment from that span, check WHICH feature it sits in before trusting the number.

### KRCG API v3→v5 dual-format card-data parser (v2.5.87 client, 4 July 2026)

KRCG's own announcement (krcg-api v4, "krcg v5" card/deck JSON, live at v4.api.krcg.org) plus a hard precedent on `static.krcg.org` (the v2→v3 switch flipped the SAME unversioned `data/vtes.json` path and archived the old shape to a versioned one) means the actual file Elysium fetches is expected to switch shape on its own schedule — even though nothing was broken yet at the time of this session (`static.krcg.org/data/vtes.json` was checked live and was still v3-shaped on 4 July). Rather than wait for a live break, or guess at the new shape from the announcement's prose, two real samples were pulled from the live v4 API (`GET /card/Bonding`, a library card; `GET /card/Gratiano`, a crypt card) to build a confirmed field map — see `SKILLS.md` → "Work with KRCG card data" for the full table.

`processCardData()`/`buildPrecons()` now detect the format PER CARD via the v5-only `kind` field (`'Crypt'`/`'Library'`) and branch to `parseV3Card()`/`parseV5Card()` (new) and the v5 half of `buildPrecons()` (new), producing the exact same `meta`/`precons`/`catalog` shape either way — every other consumer in the file (`cardTags()`, `krcgPath()`/`effPath()`, `clanSymUrl()`, the Deck Lab UI, `imgSyncCheck()`) needed zero changes and behaves identically regardless of which format KRCG is currently serving. Key v5 shape facts: no more `card.name`/`._name` (only `printed_name` + a multi-lingual `name_variants[]`, with a `suffix` for disambiguating same-name reprints, e.g. `Gratiano`+`G2`); `card_text`→`text`; the v3 `sets{name:[...]}`+`scans{}` pair is replaced by a flat `prints[]` keyed on a short SET CODE (`V5`, `SV5`, `FoL`, `SoB`, …) rather than a full name, with precon starters identified only by `set.code+':'+occurrence.bundle` (e.g. `SW:PL`) — KRCG's v5 API exposes no human-readable starter name at all, so the Deck Lab dropdown will show the raw code until a code→name table gets built (flagged as a follow-up in `elysium-backlog.md`, not solved here). A genuinely nice surprise: `clanSymUrl()`'s existing `assamite→banuhaqim`/`followerofset→ministry` map already falls back to the normalized clan string itself on a miss — and that fallback is EXACTLY v5's new canonical spelling (`normClan('Banu Haqim')==='banuhaqim'`), so the clan-icon code needed no change at all for the V5-era clan renames. `cost` (replacing `pool_cost`/`blood_cost`) is read defensively — both real samples had `cost:null`, so its populated shape is still unconfirmed (also flagged in the backlog).

Verified against the two real API responses (not synthetic guesses) plus a hand-built v3 card proving the legacy branch is untouched, first via an isolated prototype module, then for real via 5 new permanent tests added to `test-client-logic.js` (self-contained fixtures trimmed from the real samples, so the dual-format behaviour stays regression-tested without depending on the uploaded originals persisting). Gates: `node --check` ✓, **21/0** ✓ (16 original + 5 new), byte-identical roundtrip **963008 bytes** ✓. Server untouched on 2.5.63.

### L4 pool globe ± buttons fixed (v2.5.88 client, 4 July 2026)

Reported from a fix already made in a different chat session the day before, with root cause and fix approach given up front — re-derived and re-verified against the actual code rather than transcribed (see `elysium-learnings.md`'s v2.5.88 entry for why: the reported blast radius turned out to be wider than the real one). Confirmed: `updateMyClan()`→`refreshClanDisplay()`→`updateL4GlobeHTML()` at the exact reported call site, and that function rebuilt `glob.el.innerHTML` on every call, including the pool ± buttons — freshly recreated each time with no `bindHold` listener, since that listener was only ever attached once, in `createL4Globe()`, right after the function's first (creation-time) call. Not confirmed: wheel/contextmenu were never actually affected, since both are attached to the persistent `glob.el` container itself, not to anything the innerHTML replace touches.

Fix: `updateL4GlobeHTML()` now branches on `if(!glob.el.firstChild)` — full innerHTML build only on the genuine first call, verified safe by grepping every `l4Globes.` use (the only code path that ever empties a tracked glob is `clearL4Globes()`, which drops it from the map in the same breath, so a live-but-empty glob can't occur) — and does a selective update on every later call (label text, pool number, border/background style, and the clan icon swapped via the same remove-then-append pattern `refreshClanDisplay()` already uses for `#pool`/`#dockPool`), never re-touching the buttons. Same underlying disease as the A3b reconcile-renderer class (`SKILLS.md`), just on one element instead of a list, so no keying/mark-and-sweep needed — see that skill's new addendum. Gates: `node --check` ✓, **21/0** ✓ (suite unchanged — this is a DOM/listener-survival bug, outside what the no-DOM Node harness can exercise), byte-identical roundtrip **964908 bytes** ✓. Needs Johan's live confirmation (enter L4, trigger a clan/path recompute, try the globe's own pool ± buttons). Server untouched on 2.5.63.

### Deck-list import: two more real-world text formats (v2.5.89 client, 4 July 2026)

Johan supplied four real files describing the same tournament deck in different export formats (VDB's Text/TWD, Lackey CCG, a bare flat list with no headers at all, plus an unrelated Text/TWD example) and asked whether `parseDeck()` could import all of them. Two real gaps found by testing the actual files: `3xAmavi` (no space after the multiplier `x`) mis-parsed as name `"xAmavi"` (the old regex required whitespace after `x` to recognise it as the separator); and a flat list with no `Crypt`/`Library` headers at all put every card into `library` (confirmed on the real file: 0 crypt entries).

Fix: the multiplier regex now allows zero-or-more whitespace after `x`. For the headerless case, lines parsed before any header is seen are stashed and resolved after the full pass — card-database lookup first (Vampire/Imbued → crypt, else → library, the same check `isMinion()` already does — authoritative regardless of layout), falling back to "before the first blank-line gap = crypt, after = library" when the name isn't in the loaded database, falling back to library (the prior default) with neither signal — which also covers Lackey's library-first-no-header layout for free. Section-header detection (`Crypt`/`Library`) needed no changes: the existing `\b`-based regex already matches equally with or without a following space/parenthesis/colon.

Cross-validated: all three of Johan's real exports of the same deck parse to the identical 12 crypt / 90 library cards, with and without a mock card database, plus an adversarial test (a library card before the gap, a crypt card after it, database loaded) proving the database layer genuinely overrides position. New skill in `SKILLS.md` → "Parse a pasted deck-list text format". Gates: `node --check` ✓, **26/0** ✓ (21 + 5 new; `parseDeck` newly exposed via the test harness), byte-identical roundtrip **966583 bytes** ✓. Server untouched on 2.5.63.

### Ctrl/Shift+click on the pool globe itself, finally wired up (v2.5.90 client, 4 July 2026)

Johan reported Ctrl/Shift+click not adjusting the pool globe, having noticed it in the tutorial specifically but unsure if that was the whole story. No diagnosis was supplied this time (unlike v2.5.88) — investigation started from scratch: the on-screen help text and two Classic-tutorial steps both explicitly claim the pool supports "scroll, Ctrl/Shift+click, or the +/− buttons", but every listener ever attached to `#pool`/`#dockPool` turned out to be only `wheel` and `contextmenu` (plus the dedicated child +/- buttons) — no `click` listener anywhere, on either element. The equivalent CARD-side gesture (`tap(c,d)`, checking `d.ctrl`/`d.shift`, wired via `bindCard()`) is real and does work — it just was never extended to the pool globes themselves. Not tutorial-specific: the Classic tutorial plays on the real board with the real `#pool` element, so the gap is identical in and out of tutorial (confirmed no tutorial-specific click-blocking exists either).

Fix: new shared `bindPoolModClick(el, btnSel)` — Ctrl/Cmd+click bumps pool +1, Shift+click bumps it −1, guarded against double-firing when a click bubbles up from one of the dedicated +/- buttons — wired to `#pool`, `#dockPool`, and (inside `createL4Globe()`'s existing `mine`-only branch) the player's own L4 globe; opponent L4 globes correctly stay read-only. Gates: `node --check` ✓, **26/0** ✓ (suite unchanged — new DOM click wiring, outside what the no-DOM harness exercises), byte-identical roundtrip **967332 bytes** ✓. Needs Johan's live confirmation (Ctrl+click / Shift+click directly on the globe, not the buttons — board, dock, and L4). Server untouched on 2.5.63.

### Tutorial: leave the previous game properly, and the Advanced tier is always open (v2.5.91 client, 4 July 2026)

Johan reported that accepting "Continue to Structured table?" right after finishing Classic left the previous game not properly closed and the new one not starting — and separately asked that the two Advanced tutorials (Structured table, Play online) be always freely selectable rather than gated behind finishing Classic, with no auto-prompt pushing the player toward them.

**The bug's exact chain:** `tutFinishSection()` → `tutNextReady('classic-interact')` returned `structured-intro` → accepting the prompt → `tutLaunch` → `tutShowWelcome()` → `enterL0()`. `enterL0()` only ever toggles CSS view-mode classes and closes floating panels; it never touches `localTable`/`state.cards`/`net.hot`, so the just-finished Classic game stayed fully live underneath the welcome overlay. Structured's own first real step then calls `openOffline()` to open its lobby setup dialog — which opens with `if(localTable){ toast('Leave the current hotseat first'); return; }` and silently does nothing, since `localTable` was still `true`. The tutorial then narrated a lobby dialog that had never actually opened.

**Fix 1 (the bug):** `tutShowWelcome()` now calls `leaveHotseat()` — the real teardown (`localTable=false`, `clearTable()`, resets `net.hot`/roster, persists the tutorial's final snapshot if `tutGameLive`, then `enterL0()` itself) — whenever `localTable` is true, instead of a bare `enterL0()`. Every `tutLaunch` path that shows the welcome screen (`decklab`, `lobby`, `structured-intro`, `online-hosting`) routes through this one function, so all of them are covered, not just the one Johan hit.

**Fix 2 (the design ask):** new `TUT_ADVANCED = new Set(['structured-intro','online-hosting'])`. The picker's linear-unlock check now always unlocks anything in this set regardless of Classic's completion state, and `tutNextReady()` explicitly skips any key in it, so `tutFinishSection` never offers either as an automatic "continue?" after a different section finishes — verified this also means neither auto-chains into the other. Finishing Classic now shows a plain completion toast; both Advanced tutorials are reached only by deliberate choice from the picker (where they're now always unlocked), and the `leaveHotseat()` fix makes launching them safe regardless of what was running before.

New skill points in `SKILLS.md` → "Add a tutorial step or section" (6–7). Gates: `node --check` ✓, **29/0** ✓ (26 + 3 new — `tutNextReady` exposed via the harness; the `tutShowWelcome`/`leaveHotseat` half is DOM/state-teardown behaviour the no-DOM harness can't exercise directly, same category as v2.5.88/90), byte-identical roundtrip **968280 bytes** ✓. Needs Johan's live confirmation (finish Classic → no auto-prompt; picker shows both Advanced tutorials unlocked regardless; launching Structured right after finishing Classic now actually opens its lobby). Server untouched on 2.5.63.

### The referee kit ships — L0+L3a from the lobby/server design (v2.5.92 client / v2.5.64 server, 6 July 2026)

First code out of `elysium-lobby-server-design.md`. Server: `sanHtml()` now wraps the `log` relay AND `revealHand`'s public line (the two defence-in-depth gaps; anticheat-draft §7.1 closed); `pass` is guarded on `room.turnSeat` (any seat could previously yank the turn to their own prey — the new `hostPass {seat}` is the paired referee override, only valid against the CURRENT turn seat, advancing via `nextLiveSeat` without evicting anyone); `tool:seating` errs after start unconditionally (it zeroed everyone's vp/out); new create-flag `tournLock` (persisted through rooms.json snapshots AND named saves, relayed in `joined`/`started`) errs `deck`/`redeal`/`vp`/self-`unoust` after start while every host verb keeps working; `hostSetClock {plusMins}` adjusts or calls the match clock, broadcasting the new s→c `clock` message. Client: the create dialog's Tournament-lock checkbox, `net.tournLock`, `MP_HANDLERS.clock` → `startMatchClock()` re-sync, "⏭ Pass their turn…" in the opponent-pool host menu (turn-seat-gated, online-only), and a host-only right-click menu on `#matchClock` (+5/+10/−5). Protocol doc: §7 is 50 verbs, §8 is 43 messages, six semantics rows updated — lint green. Dispatch suite 6→9; client suite 29/0; roundtrip 970069 bytes. **Server restart required.**

### The resource ledger v1 — the game's hard resources, server-logged (v2.5.93 client / v2.5.65 server, 6 July 2026)

Johan's ask: could the LOGGING of pool/blood/tokens/played-cards/lock move server-side "in the interim"? Yes — because every public resource change already flows through the server as a `board` push, `ledgerDiff()` compares each started-game push against the seat's previous sanitized pub and records the deltas (pool, Edge, card enters/leaves/zone, lock, face, blood/blue/green, named counters) in `room.ledger` — server-AUTHORED, so a modified client can neither forge nor omit them, unlike the free-text log. Capped 800 (40/push), persisted in rooms.json snapshots and named saves. `vp` self-adjusts now leave an attributed row (the third-sweep silent-adjust finding, closed). Any seated player pulls it via `ledgerGet` → `ledger {rows≤300, total}`; the client's '📜 Resource ledger' row in the felt menu renders them as private local log lines. Known-and-documented edges: pushes are 600 ms-debounced so one push = one delta batch; `ctrl`-caused changes attribute to the card's owner; no-pub-footprint actions are invisible by design; spectator/judge reading is L3b. Dispatch suite 9→10, client 29/0, roundtrip 971084 bytes. **Server restart required.**

### ledgerLive — the opponents' resource narration is now server-authored (v2.5.94 client / v2.5.66 server, 7 July 2026)

Johan's follow-up on the ledger: could the server PUSH the log lines for resource events to the other players, instead of relaying the client's own (forgeable) text? Yes — `ledgerDiff()` now returns its rows and the `board` handler broadcasts the batch as `ledgerLive {seat, name, rows}` to everyone except the pusher; `vp` self-adjusts stream the same way. The pusher keeps their own richer local narration. Dedup v1 keeps the surgery to ONE line: the client's own pool line goes `localOnly` online (the bounty-line convention — the server's row replaces it for the others; hotseat relays exactly as before), while the plays/blood overlap (client's linked narrative + server's dry delta) is kept deliberately and can be muted later with the same one-argument pattern. Receiving clients render the rows as real ARCHIVED log lines — this is the opponents' true game record now, not a private view. Dispatch 10→11 (exclusion semantics), client 29/0, roundtrip 971736. **Server restart required.**

### Undo is marked — and it turned out undo never synced (v2.5.95 client / v2.5.67 server, 7 July 2026)

Johan green-lit the '↩ undo:' mark from the uncertainty Q&A. Reading the path to place the flag exposed a latent bug older than the ledger: `undo()`→`restoreSnap()` NEVER pushed — online opponents kept the un-undone board until the next unrelated action, which then mixed both deltas into one batch. Triple fix: undo()'s snapshot path sets `net._undoPush` (netGame-gated) and calls `schedulePush()` (self-gating — hotseat untouched); both senders carry `undo:true` and consume the flag only on an actual send; `ledgerDiff(…, mark)` prefixes the batch '↩ undo: ' in BOTH the ring and the `ledgerLive` stream. The `applyUndoEntry` paths (draw/give take-backs) keep their own verbs and need no mark (no pub diff). Accepted blur: a follow-up action within the 600 ms debounce shares the undo batch. Dispatch 11→12, roundtrip 972556. **Server restart required.**

### The lobby lands — L1 credentials + L2 room list (v2.5.96 client / v2.5.68 server, 7 July 2026)

Johan's "kör lika gärna" on the phase-2 stairs, with his own caveat confirmed: CONTINUOUS hosting wants a named Cloudflare tunnel (free account) instead of ephemeral quick tunnels — and `--trust-proxy` is the L1 piece built for exactly that (deriveIp believes CF-Connecting-IP/X-Forwarded-For only from a loopback transport peer, spoof-safe by construction, restoring per-IP throttles behind the tunnel). Server: named CLI flags in a mutable CFG (test-simulatable; harness exports CFG/deriveIp/buildRoomList); the door (`--server-pass`) gates hello/create/join with srvPass riding create/join for deep links and a loopback⇒global 4× throttle bucket; `--admin-pass` grants per-connection admin via hello that inherits all 15 host err-gates (seated-only; spectator-admin is L3b); `--create-policy admin` reserves creation. Lobby: `hello` → `roomList` (ok/door/admin/srv/rooms with locked/tournLock/counts/names honouring the new persisted per-player `anon`), LOBBY_CONNS with debounced self-pruning pushes. Client: Server-password field, anon checkbox, 🔍 List rooms → fresh-element rows with Join/Watch (locked rooms focus the password; older servers fall back after 1.5 s). Flagless = wire-identical to v2.5.67. Dispatch 12→16, client 29/0, roundtrip 976318. **Server restart required.**

### A local images/ folder as a third image tier (v2.6.2 client / v2.5.69 server, 7 July 2026)

Johan's follow-up on the image-cache Q&A: could the client ALSO check the same folder/subfolder as the client on disk (not just IndexedDB), for players who'd rather manage files themselves? Yes, with a two-sided design: the server gains a narrow, regex-guarded `/images/<file>` static route (filename must be `norm(name)`-shaped — pure `[a-z0-9]+.ext`, which by construction rules out path traversal, plus a defence-in-depth path check) sitting next to `CLIENT_FILE`, so it works identically whether the client was opened raw (`file://`, images resolve next to the HTML on disk, no server needed at all) or served via `elysium-server.js`/a tunnel (images resolve via the new route). The harder problem was the CLIENT side: ~18 existing image-rendering call sites each carry their own bespoke error-fallback (webp→jpg retry, `BACKS.*`, hide-and-show-text) — solved by making `imgUrl()` return the local path FIRST when a new opt-in Settings toggle is on (old body renamed `networkImgUrl()`), plus ONE document-level capture-phase `error` listener that intercepts a failed local attempt via `stopPropagation()` (capture always precedes the target's own listeners) and rewrites `.src` to `networkImgUrl()` — if that ALSO fails, the src no longer matches the local shape and the pre-existing per-element chain resumes untouched. Zero of the 18 call sites modified. Off by default. **Server restart required.**

### The local images/ folder now covers card backs and icons too (v2.6.4 client / v2.5.70 server, 7 July 2026)

Johan's follow-up: the two card-back images and the clan/discipline/path icon SVGs are ALSO downloadable from static.krcg.org — could the local folder cover those too? Yes, found and fixed three distinct hardcoded-asset shapes: `BACKS.crypt`/`.lib` (plain-property reads at ~19 call sites — solved with GETTERS, zero call sites touched), two CSS `background:url(...)` rules on the library/crypt drag-ghost elements (CSS resolves url() at parse time — unreachable by any runtime toggle, so the url() was removed from the stylesheet and `ghost.style.backgroundImage` is now set in JS at the moment each drag starts), and three independent svg-icon URL builders (`pathSymUrl`/`supSymUrl`/`clanSymUrl`, each repeating the same check — factored into one shared `svgUrl(sub)`, with the KRCG sub-path flattened to a filename by replacing `/` with `-`, e.g. `svg-path-caine.svg`). The v2.6.2 capture-phase error listener now dispatches on the failed filename's shape (fixed back-names / `.svg` extension / else a regular card) instead of assuming every miss is a card. Server's `/images/` regex widened to allow `-` and `.svg` (still no traversal surface). Verified the three-way dispatch against six example URLs independently before trusting it. Gates unaffected (16/0, 29/0, 6/0), roundtrip 991800. **Server restart required.**

### Code-quality pass on the image-resolution work (v2.6.5, 7 July 2026)

Johan asked whether v2.6.2-4 was done to best practice or ended up spaghetti. Reading the whole section as one continuous block (rather than patch-by-patch) surfaced two real, fixable things: `BACKS`'s getters forward-referenced `LOCAL_IMG_DIR`/`localImgMissing` (harmless — getter bodies only run when called — but an awkward reading order), and `svgUrl()`'s cache-or-network logic had been copy-pasted rather than called into the error listener's svg branch. Fixed both: `BACKS` now sits right after the error listener under a new banner comment naming the whole `imgUrl → BACKS → svgUrl` + error-listener block as one system; a new `networkSvgUrl(sub)` mirrors `networkImgUrl(name)` so the svg cache-or-network resolution exists in exactly one place. Pure reorganisation — dispatch re-verified against the same example URLs, same results, gates unaffected, roundtrip 993352.
