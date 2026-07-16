# Elysium Card-Effect Library ("cardfx") — Design & Reference

> **v1 (fxv 1), 12 July 2026 — Johan's decision:** the bot track gets a SHARED,
> machine-readable card-effect library compiled from KRCG's `vtes.json`, instead of
> per-playbook effect tags only. One library of card FACTS feeds any number of bots;
> per-bot decks and personalities stay in playbooks. This supersedes the
> "own-deck-only" card-knowledge scope in `elysium-bot-spec.md` §5 (that section now
> points here). Companion docs: `elysium-bot-spec.md` (the bot roadmap),
> `ELYSIUM-PROTOCOL.md` §12 (the frozen wire lines the library complements),
> `cardfx-persistent-lock-design-decisions.md` (14 July — the full back-and-forth
> behind the persistent/lock tags below: Johan's original proposal, the revisions,
> and where the first pass under-translated his own opening instruction — read that
> before re-litigating any of §4's design calls from scratch).

> **Compiler v1.4.0, 14 July 2026 — `persistent` (entry-level) + `lock` (per-mode)
> shipped, rulebook-verified, same auto-tier family as v1.2.0's unique/limited.** Full
> detail in §4 below and the tags' own code comments in `cardfx-compile.js`. Headline:
> Persistent stays entry-level (unlike `dir`/`lock`, a card either stays in play or it
> doesn't, regardless of which mode played it); Active/Passive got NO field of its own —
> it's derived from whether a persistent entry has a `lock`-tagged mode (Active) or not
> (Passive), since a single card can be both at once (Enkil Cog: flat bleed bonus is
> Passive, its separate lockable action is Active) — see §4. §5's mode-emission
> invariant changed from "fx only" to "fx OR dir OR lock" (a lock-only segment like The
> Parthenon's has no fx pattern in the v1 vocabulary at all). Equipment/Ally/Retainer/
> Event are auto-tagged persistent from TYPE alone, not text — these stay in play by
> rule and rarely restate it in prose (Johan's own opening framing, confirmed: only
> 18/164, 0/119, 0/54, 1/40 respectively would have matched on text patterns). Power/
> Conviction were considered and rejected (burn-for-effect, not stay-in-play). The 4
> already-curated entries (Blood Doll/Vessel/Dreams of the Sphinx/Inside Dirt) did NOT
> yet carry the new tags by hand as of this note — closed the same day, see the next note.

> **Curation + bot reader, 14 July 2026 (same day) — all four Masters curated, both
> `actGrant` persist modes now WIRED, Parthenon's lock decision SHIPPED.** The 4
> pre-existing curated entries backfilled with `persistent`/`lock` (closing the gap the
> note above flagged). The Parthenon: `actGrant:{phase:'master',amount:1,persist:'turn'}`
> — the FIRST card to exercise `persist:'turn'`, via the new `_considerTurnActGrants()`
> reader + an unconditional `decide('lock-actgrant')` (genuinely correct for this card,
> not a placeholder — see §4). Information Highway: `actGrant:{phase:'influence',
> amount:2,persist:'inplay'}` — the first REAL card on the existing `_recomputePhaseActs`
> path. Ashur Tablets: persistent, deliberately given NO `modes`/`actGrant` (removed the
> auto-tier's misleading `poolGain:3` rather than leave it — see §4 and
> `cardfx-persistent-lock-design-decisions.md` §8 for why its threshold mechanic doesn't
> get a schema tag). Effective Management: curated for its `note` only, deliberately
> carries no `persistent` (matches auto). Bot-side: the MASTER play loop now branches on
> `persistent` — a non-persistent card resolves straight to the PUBLIC ash heap
> (`_toAsh`) instead of sitting on the board forever (Effective Management was the
> motivating bug); `known`/`curated` un-conflated (a curated Location has no recognized
> income fx but shouldn't say "uncurated" either). **Also corrected in this pass:**
> `actGrant` was documented as per-mode but the shipped `_recomputePhaseActs` had ALWAYS
> read it entry-level — §4 below now matches the code, not the other way around. Gate:
> cardfx 65/0 → 72/0, bot 135/0 → 154/0 (3× stable, including 2 new live-integration
> turns proving the full lock → +1 action → second master play chain end-to-end).

> **`handler` field + CARD_HANDLERS registry, 14 July 2026 (same day) — Effective
> Management's EFFECT is automated too, not just its placement.** Johan's framing:
> bespoke, one-off effects that manipulate a player's OWN zones (crypt/hand/ash/library)
> should read as instructions TO the bot, not as an attempt at generic `fx` vocabulary —
> the same call already made for Ashur Tablets' threshold (§8 of the design-decisions
> doc). New entry-level `handler` string dispatches into `CARD_HANDLERS` from the MASTER
> play loop. Effective Management's handler sends the EXISTING `drawCrypt` verb — proven
> (by reading the client's own zone model) that "top of crypt" is a shuffled stack
> position, not a player choice, so no decide() was needed, just the same `cryptN>0`
> guard the bot's own paid Influence-phase fetch already uses. A live-integration test
> initially asserted on `bot.unc` and failed — not a code bug, a test-design one: this
> deck's OWN pre-existing Influence-phase logic sweeps an uncontrolled vampire into
> `ready` the SAME turn, draining `unc` before the poll could observe it. Fixed by
> asserting on `cryptN` (a stable, monotonic signal) instead of the transient `unc`
> array — see the learnings doc for the generalized lesson. Also naturally decoupled
> from any future human-facing "auto-helper" button (Johan asked): the handler just
> sends the same wire verb a client-side helper would, so nothing here blocks or
> complicates that later. Gate: cardfx 72/0 → 73/0, bot 154/0 → 159/0 (3× stable).

> **Ashur Tablets' OWN-side threshold mechanism, 14 July 2026 (same day) — the last
> of the four Masters is now functional (short of the cross-player removal, which
> stays unbuilt — see §8/§11).** `handler:'ashur-tablets'` dispatches after every
> play, checking the bot's own copies in `ready`; at 3, removes them to the client's
> `'burned'` zone (a local mutation exactly like `_toAsh`'s pattern, just a different
> destination), grants the +3 pool, and processes the ash heap. The 1-to-hand pick is
> SCORED (new `_ashScoreFor`): Master bonus + decklist-scarcity + hand-type-mix — a
> GENERAL v1 foundation Johan explicitly asked to land before any persona tuning
> (theorize/playtest toward that later — see §11). Researched before building, not
> guessed: VTES strategy literature calls Ashur Tablets "recursion", values it for
> adapting to the table situation rather than a fixed priority, and names master-card
> retrieval as a real recognized pattern — informed the scoring factors directly.
> Protocol research paid off differently than for Effective Management: `pileBulk`
> (the shuffle-back verb) exists and fits perfectly, but had NO prior in-bot usage to
> lean on (unlike `drawCrypt`), so it needed real end-to-end testing, not just reuse.
> **A genuine test-authoring bug caught by a live run, not a code bug:** the first
> integration test assumed Ashur Tablets costs 2 pool to play (confusing it with The
> Parthenon) — a debug run with `pool`/`edge` traced at every phase boundary showed
> the real number (start + 3, no cost deduction at all) before the assertion was
> fixed; Ashur Tablets is entirely FREE to play, confirmed against the compiled
> cardfx entry. New learning logged about verifying assumed numbers (costs, amounts)
> against the actual data even mid-test-authoring, not just when writing the handler
> itself. Gate: cardfx 73/0 → 74/0, bot 159/0 → 175/0 (4× stable, incl. the bot's
> first-ever live `pileBulk` round trip).

> **Ashur Tablets' TABLE-WIDE collateral watch, 14 July 2026 (same day) — a human
> (or another bot) crossing their OWN threshold now correctly sweeps this bot's
> copies too, with no benefit.** Johan: "can we trigger the bot's cleanup when a
> HUMAN plays their 3rd Ashur Tablets, too?" Scoped to bot-vs-bot detection today
> (a full human-facing notification needs client work, parked separately). First
> design (check whether ANY seat currently shows ≥3 copies in `ready`) was WRONG —
> found by re-reasoning through the timing, not by testing: the triggering seat's
> OWN handler burns its 3 copies in the same tick it crosses the threshold, so by
> the time a DIFFERENT seat gets a turn to look, that signal is already gone.
> Redesigned around `'burned'`-count tracking instead (`_ashurSeenBurned`, per
> seat) — burned is a one-way, permanent zone, so a RISE in that count is a
> reliable signal still observable turns later, purely from data the server
> already relays (`this.table[seat].pub.cards`, the same feed `_inPlayNorms`
> already reads) — no new wire verb needed at all. New shared `_ashurResolve
> (iTriggered)` (own copies removed either way; only the actual trigger gets the
> +3 pool + ash-heap dig, a collateral loss gets nothing, per the card text) and
> `_checkAshurTableWide()`, run once per own turn. **A genuine environment outage
> interrupted this work mid-round** — the code was lost (not just paused) and had
> to be rebuilt from the already-worked-out design, confirmed by diffing against
> what actually landed on disk rather than assuming the last messages sent had
> been saved. The new 2-bot LIVE test (a 3-seat game: a light host + two real,
> separately-connected Bot instances) is this session's first test needing TWO
> bots at once; an early version of it asserted on raw pool and failed for an
> unrelated reason (the triggering bot's own ordinary bleed against its prey,
> who happened to be the bystander bot in this seating — a real, expected
> mechanic, not an Ashur Tablets bug) — fixed by asserting on the specific
> absence of the trigger-only log line and `pileBulk` call instead of the
> confounded raw pool number. Gate: cardfx 74/0 (unchanged), bot 175/0 → 186/0
> (majority-stable; the live-integration suite's baseline flakiness rate,
> already noted earlier this session, applies here too — failures observed so
> far are in unrelated parts of the suite, never this feature specifically).

## 1. Why a shared library

The wire already carries bleed AMOUNTS (the §12 frozen lines) and live counters
(`tally`), so a bot never needs card knowledge to follow a bleed. What the wire does
NOT carry is the meaning of a non-bleed card hitting the table: when a human plays
**Inside Dirt** or superior **Shroud of Decay** at the bot, the only structured signal
is a card NAME (visible in pubs, the fx `verb` clone, and the log's card link). A
name→facts lookup is the sandbox-native way to turn that into a threat assessment —
"3 pool if this resolves" — and therefore into a correctly weighed block decision.
The same lookup powers the bot's OWN hand (what does this card contribute?) and its
influence math (crypt caps/disciplines/titles come structured — playbook `cap`
annotations become optional).

**The facts/policy split is the core principle:** the library says what a card DOES;
the playbook + personality knobs say when a bot PLAYS it. Four bots with different
decks and temperaments share one library and never share policy.

## 2. The three quality tiers

| Tier | Artifact | Quality contract |
|---|---|---|
| **auto** | generated by `cardfx-compile.js` from `card_text` | Best-effort heuristics. Conservative by design: a missed tag is a curation task; a wrong tag misleads a bot. Conditions ("if the bleed is successful…") are ignored — tags describe the card's POTENTIAL, which is the right read for block decisions. |
| **hand** | `cardfx-curated.json` (whole-entry overlay, `src:'hand'`) | Verified against printed card text, never memory. Curation queue: (1) every card in a shipped bot playbook, (2) TWDA-frequent staples, (3) proven auto-tier mistags. |
| **playbook** | per-bot deck JSON + knobs (OUTSIDE this library) | Strategy: priorities, thresholds, aggression, block willingness. |

Compile order: auto first, then `hand` entries REPLACE whole auto entries (no deep
merge — predictable precedence). The compiled artifact is `elysium-cardfx.json`.

## 3. Consumers and their contracts

- **Defense (threat lookup):** opponent plays a face-up card → resolve the name via
  `alias` (lowercase) → `lib[name]` → scan `modes[].fx` for threat keys
  (`poolDmg`, `bloodBurn`, `stealBlood`, `torpor`, `bleed`/`bleedAct`, `aggr`) →
  weigh a block/reaction. Type alone is information: an fx-less `action` entry is
  still a blockable action.
- **Offense (own hand):** `lib[name]` for contribution keys (`stealth`, `bleed`,
  `intercept`, `wake`, `bounce`, …) + `cost` + `req`, matched against the acting
  vampire's `crypt[...].disc` (inferior vs superior picks the mode via `at`).
- **Influence & votes:** `crypt[name]` for `cap`, `disc`, `title`/`votes`, `sect` —
  replaces hand-annotated playbook caps (playbook `cap` stays as an override).
- **Forward compatibility (MUST):** consumers ignore fx keys and entry keys they do
  not know. Curated entries may carry richer vocabulary early (`bloodToPool`,
  `handSize`, `trifle`, `unique`, `costEdge`, `note`, …).

## 4. Schema (fxv 1)

```
{ fxv: 1, generated, source, counts,
  crypt: { "<canonical name>": { cap, clan, sect?, group, disc:{all,sup},
                                 title?, votes?, banned? } },
  lib:   { "<canonical name>": { t:[...], cost?:{pool?,blood?},
                                 req?:{disc?:[...], clan?:[...]}, dir?,
                                 modes?:[{at, use?, fx}], src } },
  alias: { "<lowercased variant>": "<canonical name>" } }
```

- **`t`** — normalized types: `master action mod react combat political equip ally
  retainer event power conviction` (multi-type cards keep arrays).
- **`cost`** — from the structured `pool_cost`/`blood_cost` fields; values are
  numbers or `'X'`. Costs written only in rules text (e.g. Inside Dirt's Edge burn)
  are NOT auto-modelled — curated entries carry them (`costEdge:true`).
- **`req.disc`** — lowercased discipline/virtue trigram set (the card's requirement
  universe; `modes[].at` says which LEVEL a mode needs).
- **`dir`** — PER-MODE (v1.3.0, 13 July 2026; was entry-level, proven wrong by split-effect
  cards): the mode's own text segment carries Ⓓ (a directed action — only its target(s)
  may block it, per the rulebook). Absent = undirected (blockable by the actor's prey AND
  predator) — Johan's minimal-tagging call, and empirically correct: 180 directed vs 461
  undirected modes among action-typed entries (~28% directed — a real minority, not the
  ~53% an entry-level scan wrongly suggested by conflating split cards). Textbook case:
  Govern the Unaligned's inferior mode (bleed) is `dir:true`; its superior mode (add blood
  to a vampire, no target) correctly carries no `dir` at all — one entry-level flag used to
  claim the whole card was directed, which was true for exactly half of it. **Not yet read
   by the bot** (M2's block-as-target logic only covers the default-bleed case, which is
  always directed with the bot as the sole legal blocker by construction — no lookup
  needed); wiring `dir` into broader block-eligibility (non-bleed action cards, political
  actions, the bot correctly participating as a PREY-or-PREDATOR blocker on an undirected
  action) is future work, parked with v0.5's wider action-type support.
- **`trifle`** (curated-only, 13 July 2026; v0.5 prep) — entry-level: playing this master
  successfully grants ONE bonus master-phase action this turn (capped at one bonus MPA per
  phase from trifles specifically — a second trifle that turn acts like a regular master).
  Currently 1 entry (`Vessel`) — a hand-curated fact, not auto-extractable from `card_text`
  without a dedicated "Trifle." scan the auto tier doesn't run yet. **Read by the bot since
  14 July 2026** via `_grantTrifleBonus()` (adds to `this.phaseBonus.master`, capped at +1/
  turn regardless of how many trifles are played — see `actGrant` above for how a DIFFERENT,
  bespoke bonus-action source like a future Parthenon rule would coexist independently).
- **`costEdge`** (curated-only) — entry-level: this card's cost is "burn the Edge" rather
  than a `pool`/`blood` number — a cost shape only written in prose (e.g. Inside Dirt),
  never auto-modelled. Not yet read by the bot.
- **`bloodToPool`** (fx key, curated-only so far, 2 entries) — a controlled MOVE of 1 blood
  between a vampire and its controller's pool, direction chosen by the controller, at a
  card-specific phase (Blood Doll: the controller's OWN master phase; Vessel: the
  controller's OWN unlock/untap phase — a full phase later. See bot-spec §7.6 for why this
  phase difference matters and how v0.5's first cut plans to approximate it).
- **`phase`** (curated-only, per-mode, 13 July 2026; v0.5 §7.6-C) — WHEN an already-in-play
  permanent's recurring ability fires (`'master'` or `'unlock'` so far), read generically by
  the bot's `_applyPhaseIncome(phaseKey)`. This is NOT the same question as `t.includes
  ('master')` (which just says the card is PLAYED during the Master phase) — Blood Doll and
  Vessel are BOTH `master`-type, yet trigger their OWN recurring effect a full phase apart,
  which the type alone cannot distinguish since it's identical for both. Requires a
  recognized income fx key (`poolGain`/`bloodToPool`) alongside it, or `_bestMasterFor`
  won't treat the card as a modelled income asset at all (an untagged income-shaped card
  still gets PLAYED under the "always play A master" rule below, just without an automatic
  effect — see `actGrant`/§7.6 for the closely related but distinct bonus-action question).
- **`actGrant`** (curated-only, **ENTRY-LEVEL** — corrected 14 July 2026, was originally
  documented as per-mode but never actually implemented that way; `_recomputePhaseActs()`
  has always read `h.e.actGrant` straight off the entry, not `h.e.modes[i].actGrant` — the
  prose was aspirational, the shipped reader is the source of truth, fixed here to match
  it rather than the other way around) — `{ phase: 'master'|'influence'|'discard',
  amount: <int>, persist: 'inplay'|'turn' }`: this card grants bonus PHASE ACTIONS (the
  same economy the client's own Structured helpers track as `phaseActs`/`masterBonus` —
  base + bonus − used = available). `persist:'inplay'` = a PASSIVE, ongoing baseline
  increase for as long as the card stays in play — **shipped 14 July on Information
  Highway**: `{phase:'influence',amount:2,persist:'inplay'}`, +2 transfers every turn —
  read by `_recomputePhaseActs()`, which rebuilds `this.phaseActs` from the board fresh
  each of the bot's own turns. `persist:'turn'` = a TEMPORARY, per-turn-choice bonus that
  resets before the bot's next turn — **shipped 14 July on The Parthenon**:
  `{phase:'master',amount:1,persist:'turn'}` — added to `this.phaseBonus` when the card is
  locked that turn, via the new `_considerTurnActGrants(phaseKey)` (the `persist:'turn'`
  counterpart to `_recomputePhaseActs`, called after `_unlockPhase()` and before the
  phase's own play loop). The DECIDE-side question ("should the bot lock this card") is
  its own `decide('lock-actgrant')` case — for Parthenon specifically the answer is
  unconditionally yes (no host to compete for, no stated action-slot cost to lock it, a
  fixed +1 with no choice between effects — genuinely no downside), kept as its own case
  rather than hardcoded so a FUTURE bespoke `persist:'turn'` card with a real tradeoff (a
  multi-choice card in the Dreams-of-the-Sphinx mould) has a natural place to add
  persona-weighted logic without touching the reader. **`actGrant` is deliberately
  independent of the `trifle` keyword**: Trifle is a UNIVERSAL rule (any trifle grants +1
  Master action, capped at one bonus total per turn no matter how many trifles are played
  — a fixed bot rule triggered by the `trifle` boolean, not per-card data) — `actGrant` is
  for BESPOKE card text instead (Parthenon's own unique ability, not a keyword), and does
  NOT share Trifle's cap: both can contribute the SAME turn, since they're independent
  sources adding to the same `phaseBonus` pool. Ashur Tablets/Effective Management do NOT
  use this field: Ashur Tablets is a threshold/one-shot mechanic outside the phase-action
  economy entirely (its own unbuilt mechanism, not this one); Effective Management's
  effect isn't a phase-action grant at all — see `handler` below.
- **`handler`** (curated-only, ENTRY-LEVEL, v1.4.1, 14 July 2026) — a string key into
  `CARD_HANDLERS` (`elysium-bot.js`), dispatched once from the MASTER play loop right
  after the card has resolved (placed on the board or ashed) and been logged/pushed.
  For bespoke, ONE-OFF card effects that manipulate a player's own zones (crypt, hand,
  ash heap, library) in a way too specific to share mechanical shape with anything
  else — the same "vocabulary follows the consumer" call already made for Ashur
  Tablets' own copy-count threshold (§8 of `cardfx-persistent-lock-design-decisions.md`),
  just promoted from "a `note` a human executes via ctrl" into actual code where the
  underlying operation is cheap to automate. Two handlers so far: `'effective-management'`
  sends the EXISTING `drawCrypt` wire verb — the identical operation the bot's own
  normal, PAID Influence-phase vampire fetch already performs, just free instead of
  costing 4 transfers + 1 pool; no new crypt-tracking was needed, since "the top card
  of your crypt" isn't a player CHOICE at all (a shuffled stack position, not a
  decision) — just the same `cryptN > 0` guard the paid path already uses.
  `'ashur-tablets'` (v1.4.2, 14 July) checks the bot's own copies in play, and at 3
  removes them to the `'burned'` zone, grants +3 pool, and retrieves one ash-heap
  card to hand (scored via `_ashScoreFor` — see §11 of the design-decisions doc) while
  bulk-returning the rest to the library via `pileBulk{lib,shuffle}` — the bot's FIRST
  use of that verb, unlike `drawCrypt` which had prior precedent. Deliberately NOT a
  generic `fx` key: the play loop only ever asks "does this entry name a handler",
  never a card name — the bespoke-ness lives entirely in the registry, keeping the
  generic loop free of per-card special cases (mirrors how `persistent`/`lock`/
  `actGrant` keep the loop reading DATA, never card names).
- **`note`** (curated-only, free text) — a human-readable clarification for anything the
  structured keys can't capture on their own (phase timing, multi-choice modes, errata).
  Never machine-read; exists so a person (or a future structured-field pass) doesn't have
  to re-derive the nuance from `card_text` again.
- **`modes[]`** — one entry per requirement context:
  - `at`: `null` = base text · `'dom'` = inferior · `'DOM'` = superior ·
    `'aus+dom'` = a multi-requirement line (adjacent brackets).
  - `use`: which face of a multi-type card (`'mod'`/`'combat'`/…), from KRCG's
    `[ACTION MODIFIER]`-style type brackets.
  - `fx`: the effect tags. Values: number, `'X'` (variable), `'all'`, or `true`.
- **`src`** — `'auto'` or `'hand'` (provenance; the trust dial).
- **`alias`** — every `_name` and `name_variants` entry, lowercased, → canonical
  name. Vampire names in this vtes.json generation carry group suffixes
  (`"Zip (G3)"`); plain names resolve through the alias map. **Collision ladder**
  (77 real cases): non-ADV beats ADV, then the highest group (newest printing) —
  a plausible stat line beats a lookup miss for a seat-filler bot; decks that care
  use canonical names. **Norm tier (12 July audit):** pub card names are RAW deck-list
  text — `parseDeck` never canonicalizes ("Pentex(TM) Subversion", stray punctuation,
  diacritics) — so lowercase-exact aliases are not enough. Consumers MUST resolve via a
  three-tier ladder: exact → lowercase alias → a norm index built at load over all
  canonical+alias keys using the CLIENT-IDENTICAL `norm()` (™→'tm', NFD-strip
  diacritics, lowercase, strip non-alphanumerics) — one contract, implementations in
  lockstep, same discipline as `normalizeCard` mirroring `parseV5Card`. Norm collisions
  inherit the alias ladder's resolution.

**Rules tags (compiler v1.2.0, 12 July 2026 — rulebook-verified):** two entry-level fields.
`unique: true` on LIBRARY entries whose card_text leads with the "Unique" templating (352
cards) — rulebook: unique library cards follow vampire uniqueness (one in play; a second
contests). On CRYPT entries the polarity flips: vampires default unique, so `unique: false`
marks the five true non-uniques (Aabbt Kindred, Fida'i, Grotesque, The Horde, Valkyrie).
`limited: true` where card_text carries the "(limited)" reminder (75 lib + 9 crypt) —
rulebook: during a bleed, an action modifier cannot increase the bleed if another modifier
already does (unless exempt); the same reminder rides combat additional-strike sources and
even crypt inherent abilities (Juggler & co). Absent fields mean the default; consumers keep
ignoring unknown keys (fxv stays 1).

**Rules tags (compiler v1.4.0, 14 July 2026 — rulebook-verified):** one entry-level field,
one per-mode. `persistent: true` on LIBRARY entries — this card stays in play after
resolving instead of going to the ash heap. THREE signals, checked in order: (1) TYPE-
implicit — `t` includes `equip`/`ally`/`retainer`/`event` (these stay in play by RULE, and
typically never restate it in card_text at all — auto-tagged unconditionally, no text check
needed); (2) the "Location" keyword, templated into the card_text's LEADING line (before the
first newline) alongside Unique/Master: — anchored there rather than "anywhere in the text"
to avoid 3 false positives where "location" describes a DIFFERENT card in the rules prose
(Aye, Unnatural Disaster, Zoning Board); (3) failing both, "put this card in(to) play" / "put
this card on" / "stays or remains in play" prose on a non-Location Master/Action/etc. Entry-
level, not per-mode — a card either stays in play or it doesn't, regardless of which
discipline level played it. Power/Conviction were read and explicitly excluded (burn-for-
effect resources, one-shot like an Action despite the Imbued type family — Johan's original
type list was exactly right, not extrapolated). Rulebook default for an untagged card is the
OPPOSITE (resolve once, ash heap) — kept as an explicit tag rather than inverted to tag the
minority, even though this sweep found persistent Masters to be the numeric majority (~80%
of 525): the RULES default is non-persistent, only this card pool's composition skews the
raw count. Current yield: 1194/2364 lib entries (836 via the text signals, 358 purely
type-implicit).
`lock: true` on a MODE (sits beside `dir`, not inside `fx`) — this mode's effect costs
LOCKING the card ("lock this/that card/vampire/location/... to <effect>", 149 lib entries).
A persistent entry with no lock-tagged mode is Passive (its fx, if any, applies continuously
while in play — Information Highway's flat +2 transfers); one WITH a lock-tagged mode is
Active for that effect specifically — Active/Passive deliberately has NO field of its own,
since a single entry can be both (Enkil Cog: a flat +1 bleed, Passive, AND a separate
lockable action, Active, in the very same mode). Detected per-segment exactly like `dir`
(same "As above" inheritance mechanics), with a real three-state (true/false/undefined) to
handle explicit negation — "As above, but do NOT lock this vampire" (Deflection's superior
mode) sets `false`, which blocks inheriting the inferior mode's `true` rather than silently
copying it; Devil-Channel: Throat is the mirror case (superior ADDS a lock inferior lacks).
Honest limit: an if/else-if means a negation anywhere in a segment suppresses a genuine
positive elsewhere in that SAME segment — affects exactly one known card (Gift of Sleep's
real "Lock that ally" sits beside an unrelated "do not lock this vampire" reminder), a miss
rather than a wrong tag, left for curation rather than a more complex per-occurrence scan.
Full itemized results (every Master row, every lock hit with its matched text, all 11
negation cases) are in the standalone `cardfx-sweep-audit.md`, regenerable via
`gen-sweep-audit.js` — not part of the compiled pipeline, a one-time review artifact.

### fx vocabulary v1

| Key | Meaning | Values |
|---|---|---|
| `bleedAct` | a Ⓓ bleed action | `true` |
| `bleed` | bleed bonus. **Convention: on an ACTION this is the bonus over the base bleed of 1** (Computer Hacking = `bleedAct + bleed:1` → bleeds for 2) | n, `'X'` |
| `stealth` / `intercept` | ±stealth / ±intercept | n, `'X'` |
| `wake` | acts/blocks while locked | `true` |
| `bounce` | changes the bleed's target (Deflection family) | `true` |
| `reduce` | bleed reduction | n, `'X'`, `'all'` |
| `unlock` | unlocks a minion (outside the unlock phase) | `true` |
| `poolDmg` | DIRECTED pool burn (never self-costs — see §5) | n, `'X'` |
| `bloodBurn` / `stealBlood` | burns / steals blood from a minion | n, `'X'` |
| `torpor` | sends a vampire to torpor | `true` |
| `poolGain` / `bloodAdd` | economy: gain pool / add blood | n, `'X'` |
| `votes` | vote bonus (crypt titles carry votes separately) | n, `'X'` |
| `maneuver` `press` `dodge` `addStrike` `aggr` `combatEnds` | combat, coarse in v1 (the M2 combat module grows this block) | `true` |
| `prevent` | damage prevention | n, `'X'`, `'all'` |
| `strike` | strike damage where the text names a number | n, `'X'` |

## 5. The extraction pipeline (what `auto` actually does)

1. **Split crypt vs library** on types (`Vampire`/`Imbued` = crypt). Crypt entries
   are built from STRUCTURED fields only (cap, clans, group, disciplines with
   lowercase=inferior / UPPERCASE=superior, title→votes table, leading sect word,
   `banned`). No crypt text parsing in v1.
2. **Segment `card_text`** at newlines AND at bracket tokens (mid-line brackets
   exist in ~126 lines). Leading tokens are consumed per segment: 3-letter tokens
   are discipline/virtue requirements (adjacent tokens join with `+`); longer
   ALL-CAPS tokens are type brackets → `use`. A token-only chunk carries its tokens
   into the next chunk of the same line (`[obf] [ACTION MODIFIER] …`).
3. **Extract fx per segment** with conservative patterns. Directed pool damage
   requires the directed shapes ("burn N pool **from your prey**", "burn N **of
   their** pool", "**they burn** N pool") so that self-costs ("burn 1 pool to …")
   never read as threats — verified by the gate on Emergency Preparations/Aversion
   vs Enticement.
4. **Resolve "As above"** (372 cards): a segment saying "as above" inherits the
   nearest earlier fx-OR-dir-OR-lock-bearing segment (preferring the same trigram), then
   its own extraction overrides — Deflection's `[DOM]` inherits `bounce`; Lost in Crowds'
   "but for +2 stealth" overrides to 2. `lock` (v1.4.0) needs a real three-state here,
   not a plain boolean: an explicit negation ("As above, but do NOT lock this vampire")
   must set `false` and actively BLOCK inheritance, not just fail to set `true` — `undefined`
   would have let the superior mode silently re-inherit the inferior's lock cost, exactly
   backwards from what the card says (Deflection's own [DOM] text).
5. **Group modes** by `(at, use)`; numeric conflicts keep the max. Entries emit for
   ALL library cards (type/cost/req always useful); `modes` where fx was found OR the
   segment carries `dir` OR `lock` (v1.4.0 widened this from fx-only — a lock-only
   segment like The Parthenon's "lock this card to get +1 master phase action" has no
   fx pattern in the v1 vocabulary at all, and the old fx-only gate silently dropped it,
   discarding the lock fact entirely; strictly more permissive, so no existing fx-bearing
   mode's output changed).
6. **Overlay curated**, stamp `src`, build the alias map with the collision ladder,
   sort every key set (deterministic output), serialize one entry per line
   (regeneration diffs read as changed cards, not a reflowed blob).

Current yield (12 July 2026): **2364 lib entries, 1461 with fx (62 %) · 1785 crypt ·
2422 aliases · 31/0 gate**. Actions — the type that matters most for threat reads —
sit near the top of pattern coverage; Masters and Politicals are the long tail where
prose dominates (economy engines, referendum bodies) and curation earns its keep.

## 6. Honest limits (read before trusting a tag)

- **Conditions are ignored.** "If the bleed is successful, …" tags the effect
  unconditionally. Right for threat weighing, wrong for exact simulation — the bot
  is a sparring dummy, not a rules engine (M3 non-goal, unchanged).
- **Text-written costs are not modelled** in auto (field costs are). Curated
  entries carry them where they matter.
- **Combat is coarse** (`maneuver:true`, not ranges/timing). The M2 combat module
  defines the richer vocabulary when it actually consumes it — vocabulary follows
  the consumer, never speculatively.
- **`'X'` means "variable", nothing more.** Formulae like "2X+1" are not encoded.
- **Auto-tier noise is expected and bounded** by conservative patterns + the gate's
  known-card asserts. The report's "fx-less Actions" list is the standing curation
  queue; `src` is the trust dial when a decision is close.
- **Alias ambiguity is ladder-resolved, not eliminated** (§4). Playbooks SHOULD use
  canonical names; the alias map exists for human-typed and imported plain names.
- **A negation anywhere in a segment suppresses a genuine `lock` positive elsewhere in
  that SAME segment** (v1.4.0's if/else-if, not a per-occurrence scan). One known case:
  Gift of Sleep's real "Lock that ally" sits beside an unrelated "do not lock this
  vampire" reminder in the same segment, so the real lock is missed entirely (no mode
  emitted for it) — a miss, not a wrong tag, consistent with the general policy above.

## 7. Regeneration & gates

```
node cardfx-compile.js [--vtes vtes.json] [--curated cardfx-curated.json]
                       [--out elysium-cardfx.json] [--report]
node test-cardfx.js          # 39 asserts, run-gate family
```

The gate compiles the REAL vtes.json in-process and includes a drift guard: the
shipped `elysium-cardfx.json` must byte-match a fresh compile (modulo timestamp).
**Any pattern change ships with a recompile + a green gate**, exactly like the
protocol-doc lint discipline. When KRCG ships a new vtes.json: recompile, read the
report deltas, re-run the gate (known-card asserts catch templating changes).

## 8. Roadmap

1. **Bot v0.2 consumes it** (`elysium-bot-spec.md` §6): threat lookup arming the
   pending-bleed machine's cousin for non-bleed actions; own-hand fx replacing the
   spec'd per-playbook tags; crypt caps from the library.
2. **TWDA-frequency curation pass:** rank names by tournament-deck frequency
   (`static.krcg.org/data/twda.json`, ~12 MB, same host as vtes.json), hand-verify
   the top slice — a few hundred names cover the vast majority of real tables.
3. **Per-bot spearhead:** each new playbook's cards get curated entries as part of
   shipping the bot (the 4-bot / 5-player-table goal).
4. **M2 combat vocabulary** when the combat module lands.
5. **Personalities** stay playbook-side: knobs (aggression, block willingness, bleed
   sizing — Paul Johnson's dials) read library facts, never live in them.

## 9. Dark Pack note

The compiled library carries card NAMES and derived gameplay tags only — no rules
text, no images. Source data is KRCG's `vtes.json` under Paradox Interactive's Dark
Pack terms (free, non-commercial, attribution intact — see `ELYSIUM-PROTOCOL.md`
§13). A third-party deployment must carry its own Dark Pack compliance.

## 10. Format compatibility (v3 / v5) — added 12 July 2026

`vtes.json` exists in two generations. The file this library was first compiled from is
the **v3** shape (static.krcg.org's own docs still call the live file "the new KRCG API
V3 format"). KRCG's krcg-api v4 introduced the **"v5"** card JSON — live at
`v4.api.krcg.org` — and by the exact precedent of KRCG's earlier v2→v3 switch, the
unversioned static file is expected to flip on KRCG's own schedule.

The compiler (v1.1.0) handles both **per record** via `normalizeCard()`, detecting the
v5-only `kind` field and mapping v5 into the v3-shaped record the pipeline reads —
**mirroring the client's `parseV3Card`/`parseV5Card`** (the verified field map lives in
`SKILLS.md` → "Work with KRCG card data"), so client and compiler stay in lockstep on
ONE contract. Key mappings: `printed_name`+`suffix` rebuilds the canonical name
("Gratiano"+"G2" → "Gratiano (G2)"); `card_text`→`text`; crypt `clan` is singular,
library clans live in `clan_requirement`; library disciplines live in
`discipline_requirement.disciplines`; `group` "G3"→"3".

**The two v5 unknowns** (per the field map, both real samples had `cost:null`; `title`
was unobserved): cost is read defensively as `{type, amount}` and anything else degrades
to NO cost — counted in the report ("v5 defensive reads"), never mislabelled; titles are
taken when present and counted, so a real v5 file run surfaces gaps in one glance. The
CLI additionally refuses to write an artifact where ZERO library cards got fx (the
format-flip tell), pointing here instead. Sibling fix in the same pass: the v3
discipline full-name quirk (`'oblivion'`, `'FLIGHT'`) now folds to trigrams via the
client-identical `DISC_ABBR` map, so `req.disc`/`disc.all` speak one vocabulary.

The gate's v5 section compiles REAL v3 cards transformed per the verified field map and
asserts entry-identical output, alias reconstruction, the mixed-list edge case, and the
defensive cost path. Honest label: the fixtures are synthetic in SHAPE (real in
content) — **a run against a real v5 FILE remains on Johan** the day KRCG flips; the
format counter + defensive-read report line are built to make that run self-auditing.
