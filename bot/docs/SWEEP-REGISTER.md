# SWEEP-REGISTER — the problems the sweep finds, by class (20 Nov 2026, on bot v0.6.236; RULINGS D-135)

Johan, 19:47–19:48 (D-135): the sweep goes on, and what it finds is collected here and worked off one class at a time. A round
takes one class: its design to Johan and his "kör", the build, review until clean (D-133), a release. **A problem that changes a
finished deck's play** (seen in the 240 or the V5 smokes, as Aunt Linda's employs were) **is fixed in the next release**; the
rest waits here. Not a standing page (outside `tools/doc-budget.sh`): BOARD keeps one line per class and points here.

**An entry** is one bullet: the card or area — what is wrong; the evidence (the card's text, a ruling by its id); where it was
found, in brackets; its state; a fix sketch. **States:** **active** — the fault is in plays the 240 or a V5 smoke makes (a count
where one was taken); **reachable** — a deck the sims play holds the card, but nothing shows the faulty path firing (the class's
round measures it first); **latent** — no deck the sims play reaches it; **human** — a human's play, which the sims never make
(live at a table whenever a human holds the card); **debt** — a trace, row or test debt with no play change. Decks are the
`deck-*.json` lists of 20 Nov: the 240 plays the four starters; each of the 14 V5 smokes one other precon with them (HOWTO).

**Adding and closing.** A round that finds a problem it does not fix adds an entry to its class (a new class when none fits). A
fixed entry is deleted in the round that fixes it (the CHANGELOG and the PR keep it); a ruled-out one is deleted with its reason in
the PR. An entry found active does not wait here (D-135).

**Migrated on 20 Nov** (each entry names its source): the pilot's riders (`specs/spec-sweep-pilot-2026-11-20.md` §6: *pilot*);
BOARD's card lines under "Known, not built" (*B*); BOARD's "The V5 waves' riders", that is the waves' own sections (*w1*–*w4*: each
spec's §4; *w5*: `specs/spec-v5-wave5-2026-11-17.md` §10 and §12.10; *w6*: `specs/spec-v5-wave6-2026-11-18.md` §8, its curation
queue included, and §9.1–§9.5); the V5 sweep line's problem riders (wave 2's second review, in *w2*; the latent reds and the ambers
of `specs/spec-card-sweep-2026-11-18.md` §4.3: *sweep §4.3*); RULINGS' card gaps O-3, O-4, O-21, O-23 and O-24 (stubs stay there).
The specs keep their text as history. What those sources hold that is done, or is not a problem, is listed at the end.

**The classes** (1–6: the evening's list; 7–13: the migration's sorting, Claude's; Johan orders them). Active entries: 5.2, 7.1,
7.2, 11.1.

## 1. Retainers: version and holder
A retainer with a discipline icon is employed only by a minion with that discipline, and the level used fixes its version
[RTR 19941109] (R-46). R-47 (Johan, 20 Nov, O-49): the icon shows what it takes to employ the card; once in play the effect does
not depend on the holder's disciplines (a temporary discipline lost later, a stolen retainer), unless the card restricts its own
effect (Razor Bat's "this Gargoyle") [ANK 20180612]; a retainer brought in ignoring requirements comes in at its basic version
[LSJ 20100302]. The round: the version stored at entry and read by every reader of an attached retainer. Its open design question
(for Johan first): where the version of another seat's retainer comes from.
- **1.1 Biothaumaturgic Experiment [tha]: the employ refused** — `_bestAnimalEmployFor` offers no retainer whose every mode needs a
  discipline the employer lacks (Raven Spy or Murder of Crows for a vampire without Animalism). R-47: it comes in at its basic
  version. [pilot: the review's P4; O-49] · latent (banuhaqim holds the experiment ×1 and no animal retainer) · drop the refusal;
  store the basic version at the employ.
- **1.2 The version is not stored** — the readers under `_attachedEquips` (`_borneEnvFor`, `_equipIntercept`,
  `_equipPaidIntercept`, `_equipPrevent`, `_equipCombatOption`) gate a retainer's mode by the holder's current disciplines
  (`_modeUsableBy(mo, vamp)`). R-47: the version the retainer entered at, whatever the holder. [pilot; R-46] · latent (the
  readers take the holder's best level, which is the version a bot employs at; nothing known in the sims changes a holder's
  disciplines or moves a retainer) · store the version on the card at entry: my own the level I used; another seat's the level
  its play line names; read that in each reader.
- **1.3 The retainer's life by version** — Raven Spy and Murder of Crows at [ANI] have 2 life; the entries carry none (the table
  handles a retainer's life: Murder of Crows' note). [sweep §4.3: amber, Raven Spy] · reachable (gangrel, nosferatu ×2 each; it
  matters only when a retainer takes damage) · the life from the stored version, where a reader needs it.
- **1.4 Equipment with a discipline requirement is equipped without it** (Baleful Doll, Canopic Jar, Inscription, Tinglestripe):
  R-46's twin — `_equipLadderTier` asks `_entryReqOk` (clan, sect, capacity), never `req.disc`. [pilot] · latent (no deck holds
  them) · the equip finder asks the discipline as `_retainerReqMet` does; whether an equipment's discipline mode follows its bearer
  or a version is the round's reading (KRCG's text and the rulings).

## 2. `aggr` misreads
The compiler reads "aggravated" where the card says the opposite, misses an aggravated strike (which the weapon nullifier,
Blood Rage-class since v0.6.236, then reads as the weapon's), or drops the condition on a weapon's. [pilot]
- **2.1 Negated or prevented aggravation read as `aggr`** — "non-aggravated", "treats aggravated damage as normal", "prevent all
  aggravated damage" (Soak, Resilience, Skin of Night …); test-cardfx pins Bloodform [VIC]'s. · latent · the compiler's negation
  strip for `aggr`; the pin flips.
- **2.2 Aggravated strikes with no strike key** — Body of Sun, Mayaparisatya [CHI], Smite, Bone Spur, Devil-Channel: Hands: the
  nullifier reads their line as the weapon's (as K1 did). · latent · a strike key carrying `aggr`.
- **2.3 A weapon's conditional `aggr` counts as an aggravated weapon** — Dagger and Poker against a Kiasyd; Blade of Enoch against
  Brujah. · latent · the condition kept on the key (class 7's shape).

## 3. Another minion's sentence read as the player's (the rest of L-98's class)
"Cannot X", a time, or another minion's grant read as the acting player's own key. The pilot's compiler (v1.11.0–v1.11.4) strips
most of the class; these are left. [pilot]
- **3.1 Expiate's `combatEnds`** — a time, not a combat end. · latent.
- **3.2 Battle Frenzy's `addStrike`** — the chosen Osebo's. · latent.
- **3.3 Necrosis [THN]'s rider** (its environmental damage: PR #94). · latent.
- **3.4 Ron Zertnert's press-step lock.** · latent.
- **3.5 Stutter-Step: "not usable as an additional strike"** is not read. · latent.
- **3.6 Mind of a Killer is Ⓓ** — a `strengthBonus` on it would let `_bestStrengthFor` play it on my own vampire. · latent (no
  key today; a guard for when one is written).

## 4. Another seat's play the bots do not read (the readers' rounds, D-132)
Mostly a human's: the client's line names no card, no level or no target, or the bots have no parser for it. A need on main's
side is a handoff first. Bot-to-bot gaps are marked.
- **4.1 A human's rush card** — a human's rush is read from chat (`rush`, D-55's interim), naming no card: its ban and grant are not
  read (the bots read a bot's rush line with its card and level, `L12.havenRush`). [the evening's list, D-135] · human.
- **4.2 A human's Haven Uncovered** — the frozen line does not arm `_havenHost*` for a human's card. [B] · human.
- **4.3 A human's Priority Contract** names no chosen vampire, so no bot records it. [pilot] · human.
- **4.4 Adaptive skips a maneuver a human holds without a card** — with an empty hand `_phaseSkip(1)` skips a vampire's own
  maneuver each combat (Abaddon, salubri; no crypt key) and one granted this combat (Guard Dogs [ANI], a rush card's
  `maneuverGrant`); only a card on the minion is read (since v0.6.194). [B; pilot] · human (nosferatu, ravnos hold Guard Dogs) ·
  read them, or never skip step 1.
- **4.5 The ban on the opponent's side** — Mind of the Wilds [ANI][AUS] (the action), Dog Pack (every combat with the employer),
  Sanguine Entrapment (the round): the banned side does not read it. [pilot] · latent (no deck holds them).
- **4.6 A human's bounce of a bot's bleed** is not read by the acting bot; a bot that is a bounce's new target cannot bounce onward
  (that half is the bot's own play). [B; O-3] · human (Deflection in eight decks) · parse the client's bounce play line (a pool
  target), section-tested.
- **4.7 A human's Change of Target after a right-click action** names no vampire or another: `_onCot` misses it. Main (11 Nov §1):
  such a line from the blocked seat within `_myBlockOf`'s 30 s is that vampire's. [B] · human (toreador ×2).
- **4.8 A human's Sudden Reversal at a bot's master**: no line says it cancelled the master (main, 19 Nov). [B: the waves' riders
  line] · human · main's line first (a handoff).
- **4.9 A human's steal or burn of a bot's card in play** has no frozen line (the client's action line names no card in play); a
  human's Tension in the Ranks, Anarch Revolt and Privileged Position payments are chat reminders; a human's Rack is not read
  (`memo.human: false`). [w5 §10] · human.
- **4.10 A human's block-cancel is not read** (a bot's True Love's Face waits at a human blocker); a human's Night Terrors at a bot
  actor (the bot reads no human's stealth-zero: its counter keeps the stealth) and a bot's at a human actor; a human's One With
  the Land [PRO] (its mode is not on the play line). [w6 §8] · human.
- **4.11 A human's rush at a bot's cloaked vampire** — the bot does not object. [w6 §9.1] · human.
- **4.12 Another seat's vote cards** — a human's Absolute Tyranny (the bots read no human's vote cards) [w6 §9.2]; ballots (votes
  from cards) can hide a seat's voters from Scalpel Tongue or mislead it: a Primogen's 1 vote and a card's 1 read as a Prince's 2,
  and the Prince is named [w4]. · human / reachable (toreador holds Scalpel Tongue ×4).
- **4.13 Yawp Court across seats** — at a human's referendum, and a human's Yawp Court at a bot's (the window opens; the human has
  no answer but chat). [w5 §12.10] · human.
- **4.14 A human's Week of Nightmares and Ravnos** — a human's counter move; a human's Ravnos read from its board only; a
  human-controlled Week of Nightmares' end for the bots' Ravnos (no menu deck holds a Ravnos). [w5 §12.10] · human.
- **4.15 A human blocker's Visage pool** — the bot tells the human; nothing checks it. **A human's Grand Ball pair** is not known
  (the bots spare all that human's Toreador on non-bleed actions); **a human's directed action of unknown kind** at my pool may
  be a bleed, so a bot may block it even under that human's Ball. [w4] · human.
- **4.16 The acting bot accepts a human's block of a barred action** (every bar). [w4] · human.
- **4.17 An opponent's Oblivion or Depravity** — the table model reads the printed disciplines (`_scanOpp`). [w4] · reachable
  (hecata and lasombra hold Oblivion, pathcaine Depravity; bot-to-bot too).
- **4.18 A bot's frenzy combat card at my Salubri between bots** — only the rush is read. [w5 §12.10] · latent (in the decks only
  Deep Song's rush carries the frenzy tag).
- **4.19 The opponent's pumps** are not read before its strike (its strike line carries the result): the wave decision and the
  dodge do not see them. [w2] · reachable (bot-to-bot).

## 5. Maneuvers: direction and source
Which way a maneuver goes, and where a maneuver comes from (a card, equipment, a grant).
- **5.1 `maneuverTo` on equipment and on before-range cards** — an equipment's is not read (`_equipCombatOption`: Blade of
  Bellona); the evening's list adds the before-range cards that carry one (Angel's Gift, Crawling Chamber, Dark Steel), whose
  reader the round locates (`_bestManeuverFor` reads the key). [pilot; the evening's list, D-135] · latent (no deck holds them) ·
  the direction read wherever a maneuver is offered.
- **5.2 A weapon's maneuver is never offered** — the compiler writes `maneuver: true`, `_equipCombatOption` takes only a number,
  so the Tremere's .44 Magnum has never maneuvered and wave 2's gun halves (`_strikeBound`'s gun arm, the ash guard) never run.
  [w2: the second review; sweep §4.3: amber] · **active** (tremere ×1 in the 240: no gun maneuver in any match) · read `true` as
  one maneuver each combat; test the gun halves through a combat.
- **5.3 Crawling Chamber's [VIS] requirement** is lifted onto the whole card (its [tha] `maneuverTo` unused). [pilot] · latent.
- **5.4 Counters by posture and against a human** — only chase decks counter to close; a snipe without a ranged card keeps the
  close range it was given; against a human the bot maneuvers to long and reads the human's maneuver after it decided (the phase
  walk's range step, v0.6.165). Wave 1 had said the finders only maneuver to long; wave 2's back-and-forth (R-41) built the chase
  half. [w1; w2] · reachable (banuhaqim is a snipe deck) / human.

## 6. Records by name
A card in play is known by its name where its record should follow the card (its id).
- **6.1 Haven Uncovered** — `_havenHosts` finds another placer's Haven by its name on that board, so one that left play while its
  host stays ready reads live if the placer holds another (a rush through a gone Haven, a cloak spent for it); L-60: P2 fixed the
  contract's. [B; pilot] · latent / human (it needs a second Haven of that placer's; each deck holds one) · the record follows
  the card, as the contract's does.
- **6.2 Two Pentex spellings are two cards to `_uniqueInPlay`** — tremere holds `Pentex(TM) Subversion`, pathcathari `Pentex™
  Subversion` (R-36). [B; O-24] · reachable (only at a table with both) · compare the normalised name (one row in `CARDS.md`, by
  KRCG id).
- **6.3 `_inPlayNorms` counts my ash heap**, so a burned unique master is never played again. [w4: over-strict] · reachable.
- **6.4 `_uniqueInPlay` reads card names**: a printed regent or justicar on a human's table is not "the title in play". [w4:
  over-strict] · human · check first: `_titleInPlay` (v0.6.217's egress review) reads printed titles in two finders.

## 7. Conditional and capped values
A value the text conditions or caps, compiled as a plain number.
- **7.1 Aire of Elation** — "[pre] +1 bleed, with an additional +1 bleed if this vampire is Toreador … [PRE] +2 bleed, with an
  additional +1 bleed if this vampire is Toreador" (KRCG); the entry carries 1 and 2. [sweep §4.3: amber] · **active** (toreador
  ×2: every play in the Toreador starter bleeds 1 short) · the condition on the key, read by the bleed modifier finder and its
  readers.
- **7.2 The Warrens** — "+2 intercept, with an additional +1 intercept if this Nosferatu is titled" (KRCG); the entry carries 2.
  [w6 §8; sweep §4.3: amber] · **active** (nosferatu ×4 in the 240; four of its nine vampires are titled: Belinde a prince,
  Larissa Moreira, Lenny Burkhead and The Dowager primogen; wave 6 §1's 240 played it 182 times, the titled share not counted).
- **7.3 Kevlar Vest** — 2 only against guns; `_equipPrevent` prevents 1 against everything (sweep §4.3 calls it a red). [w1; sweep
  §4.3] · latent (tremere holds the vest and the only gun).
- **7.4 Night Moves** — the bleed is capped at 1 pool. [sweep §4.3: red] · latent (nothing in the sewer deck bleeds for more).

## 8. Requirements, conditions and gates
A requirement or a condition the text prints and a finder does not ask (the five playability layers' second and third, HARNESS),
or a legal play the bot refuses.
- **8.1 `_entryReqOk` (clan, sect, capacity) in every finder** — 18 Nov: the reaction finders read it, the stealth,
  bleed-modifier and action finders ask none; 29 Oct named more that read the discipline only (allies, politics, the prevent,
  press, maneuver and combat-ends finders: Touch of Valeren). [w6 §8; w1] · reachable (the multi-clan Path precons; salubri holds
  Touch of Valeren ×3) · each finder asks it; a footprint read.
- **8.2 A card's Path icon** (`path` in vtes.json: Wall of Filth carries Path of Caine) is not read as a requirement. [w1] · latent
  (the pathcaine crypt all follows Caine).
- **8.3 `_bestBounceFor` asks no title** (a baron): it reads the mode, `anarchReq` and the blood, not `_titleOk`. [pilot] ·
  reachable (Bait and Switch, "a baron": brujah ×2, tzimisce ×3, where 3 of 10 and 3 of 9 vampires are barons; a bounce by any
  other would be illegal, not counted) · the finder asks the title; count the smokes' plays first.
- **8.4 `_wakeCard()` is vampire-blind** at the bounce, vote and reduce routes and in `interceptPotential` (`_wakeCardFor(v)`
  exists). [B] · reachable · every site reads the vampire.
- **8.5 A discipline line's own capacity** (Hall of Hades' Court [dom]: `_voteBoosts` plays it past its line's capacity; The
  Missing Voice [cel]); **Enkil Cog** (`_bestBleedModifierFor` reads no requirement: its capacity 10 and "after resolution of a
  successful bleed"). [w6 §8] · latent.
- **8.6 Conditions not tagged** — "during a BLEED action directed at you" (Elder Intervention); Faerie Wards [aus] (the directed
  condition with an ally-or-younger clause); the leftover +1 intercept modes of Dogged Pursuit, Speak with Spirits and The Mole
  play at any action; the condition sentences' untagged variants (BOARD's C rider). [w6 §8; B] · latent (no deck holds the named
  cards).
- **8.7 Round restrictions** — the 9 cards tagged "not usable during / on the first round" fail closed in the strike, steal,
  press and maneuver finders (never played; from round 2 once the finders read the combat round); Eruption of Vitae, Growing
  Fury and Well-Aimed Car print it without "on / during" and are not tagged; the combat-ends finder reads no `req`, so Riposte
  would be played in round 1. [w1] · reachable (banuhaqim holds Walk of Flame ×2) · check what the pilot's combat work changed.
- **8.8 The act-again point after a failed referendum** — an unblocked political action succeeded whatever its referendum did
  (R-44), but a failed one writes no `_lastAct`, so neither Freak Drive nor Shadow Cloak follows it (v0.6.234). [B; w6 §9.5] ·
  reachable (ventrue holds Freak Drive ×6 and calls referendums) · a section through `_maybeActAgain`.
- **8.9 Who may play a mode** — Cloak the Gathering's [OBF] is played by a vampire other than the acting one (the finder's tie
  keeps [obf]); Lost in Crowds is not usable with Into Thin Air; Sport Bike is one vehicle per minion (the equip guard is one per
  name). [sweep §4.3: latent reds] · latent (no deck reaches the contradiction).
- **8.10 Flight from a card** (Concordance [DAI], Taking the Skin: Vulture) is not read (a vampire's Flight is read from its text,
  the crypt's `flight`; Pounce needs Flight). [pilot] · latent.
- **8.11 Over-strict: `_bestStrengthFor`** refuses a Preternatural Strength-class action on any vampire with a strength bonus
  (Depravity, Saulot's Avenging Fist: "one per vampire" generalised to the key), and on one carrying a card put on a minion.
  [w4; pilot] · reachable (nosferatu holds Preternatural Strength ×2).
- **8.12 Over-strict: hosts and hunting grounds** — allies are never offered as hosts for a card on a minion; "only one hunting
  ground each turn" is per vampire in the text, one flag per Methuselah in the code. [pilot; w3] · reachable.

## 9. Key and compiler shapes
A key the compiler writes and a reader reads in another shape, or a sentence shape the compiler misreads or skips.
- **9.1 The act-again context reads `mo.fx.referendum`**, which no entry carries (political cards carry `e.ref`), so a political
  action in hand never counts as another use for the vampire (`_actAgainCtx`'s "clogged" test; the coverage scan). [B] ·
  reachable (every deck with political actions) · read the political type; a section.
- **9.2 Destilaria Estrela da Paraíba** — its intercept never plays (`intercept`, not `lockIntercept`); its hand size only for the
  resulting combat. [w6 §8] · latent.
- **9.3 Momentary Delay** — `press` misreads "continues as if unblocked". [w6 §8] · latent.
- **9.4 The auto tier's "before range" flag on superior-only sentences** (Alpha Glint, Bloodform, Gemini's Mirror, Eyes of
  Blades, Outside the Hourglass). [w2] · latent.
- **9.5 Night Terrors [OBF][PRE]'s `strikeCE`** reads as consumed in the ledger (a combat-card consumer). [w6 §8] · debt.
- **9.6 Mode tags** — Whistling Up the Beast's [REFLEX] line shares its frenzy mode; Enrage's tag is the card's, not the mode's
  (harmless: the Grove reads a target that is mine). [w5 §12.10] · latent.
- **9.7 Shapes the compiler cannot write or read** — a rush grant of 0 (`_grantOf`); an "As above" maneuver the other way; "but for
  N environmental damage" over a strike (both synthetic-only). [pilot] · latent.
- **9.8 Saulot's Healing Touch** is FULL by the auto tier, but its rescue discount and its blood-adding action are not built (v1.9.8
  makes it an archetype only). [w4] · reachable (salubri ×1).

## 10. Unbuilt modes, targets and riders
A printed mode, target or rider the bots do not play on their own cards, or do not read when they meet it.
- **10.1 Faceless Night [OBF]** — "minions who attempt to block this action and fail become locked before action resolution"; the
  entry carries the stealth only. [sweep §4.3: amber] · reachable (malkavian, ministry ×4; both modes carry +1 stealth, so a
  finder's tie may never pick [OBF]).
- **10.2 Wasserschloss Anif's burn-it action, Haven Uncovered's host burning the card, Ventrue Headquarters locked only in my own
  referendums.** [O-23; B; pilot] · reachable (ventrue holds Ventrue HQ ×1) · each played in a sim series.
- **10.3 Free block bars and `chosen`** — Beast Meld-class and Seduction-class have tags, no consumer. [O-21; sweep §11.10] ·
  reachable (salubri holds Seduction ×2) · built when the sweep needs them, the ledger lists them playable.
- **10.4 Wave 1's ambers** — Sculpt the Flesh [PRO] (the card on the opposing minion, its unlock-phase burn, the +1 stealth action
  to burn it); the Sword of the Archangel's cancel (a grapple or aim card for 1 blood) and its unlock; Invigorate [dom] (allies
  cannot block) and before a block on actions other than a rush; the strength+N weapon family beyond the Sword (`strBonus`). [w1]
  · reachable (tzimisce holds Sculpt the Flesh ×4 and Invigorate ×3, salubri the Sword).
- **10.5 Wave 2's ambers** — Rage of Apedemak's +1 hand size, its "Frenzy." and its Path of Caine icon; Monstrous Form's superior
  action. [w2] · reachable (pathcaine ×8, tzimisce ×4).
- **10.6 Grants from cards played outside combat** — Dread Mastiff, Form of the Bat and Monstrous Form [DOM][PRO] on the vampire,
  as wave 2 left them (the pilot built Hunter's Mark's, Fleetness's and the experiment's). [w2] · reachable (pathcaine holds Dread
  Mastiff ×2, tzimisce Monstrous Form ×4).
- **10.7 Wave 3's ambers** — Anarch Railroad and Fortune Teller Shop for another Methuselah's vampire; KRCG News Radio's paid half;
  Wall Street Night's investment action; Channel 10 after a cancelled-as-played first action; Burial Site's ally life; Powerbase:
  Montreal stolen; Creepshow Casino on a rescue, a leave-torpor or an undirected action card, and at the pilot's new announces;
  Family Gathering with a mixed crypt; Archon Investigation against Secure Haven's extra cost. [w3; pilot] · reachable (most are
  in one V5 deck each).
- **10.8 Wave 4's other targets** — Oblivion, Charisma and Terrifying Visage on another Methuselah's vampire; Scalpel Tongue as a
  reaction and Saulot's Guiding Wisdom's abstain on another Methuselah's referendum; a second Grand Ball with another free
  Toreador; the other seats' ready Toreadors in Toreador Justicar's estimate (bots only). [w4] · reachable (toreador holds Scalpel
  Tongue ×4 and the Ball ×4).
- **10.9 Wave 5's cards** — Piper's employ (retainers play through the equip path); Cursed Abattoir's +1 bleed (the bot's allies
  never act); Powerbase: Los Angeles' "making a vampire Anarch" (no marker); Garibaldi-Meucci's combat end when my Anarch is the
  blocker (built for my blocked acting Anarch only); Carver's hostage counters on another seat's vampire (tracked, not shown); the
  special hunt at another seat's Ravnos (a directed action). [w5 §10, §12.10] · reachable (one V5 deck each).
- **10.10 Wave 6's cut** — a second Absolute Tyranny's cut in one referendum (one `rc.tyr`); a District-class card's votes on an
  untitled vampire are not seen (the cut errs low); New Carthage and Eat the Rich (the same cut by clan or title, in no deck) could
  reuse it. [w6 §9.2, §9.5] · reachable (pathpower holds Absolute Tyranny ×3, nosferatu Protected District ×4) / latent.
- **10.11 The pilot's** — Preternatural Strength's branch calls no Perfectionist; Shadow of the Beast [PRO]'s press each combat; New
  Moon Sigil [SPI]'s paid stealth; Fleetness [cel]'s +1 stealth on a bleed (the bleed finder reads no `actStealth`: C1's); the
  sharing register's debts: the six other contracts, the rush cards with after-combat riders, Soulgrinder's and Dead Hand's
  superior-only Fortitude rider (C's). [pilot] · reachable (banuhaqim holds Fleetness ×2, pathcaine Soulgrinder ×8).
- **10.12 The route for a vampire already attempting to block** (a woken one, [ANK 20181122-2]). [w6 §8] · reachable · with BOARD's
  "locked routes" line, which holds Eyes of the Wild's half.
- **10.13 Waits for bot diablerie** (O-15) — Depravity's stealth, Regent's move to the diablerist: bots never diablerise. [w4] ·
  latent.

## 11. Windows: who is asked, and when
Who may answer an action or a card, and in which window; a line read after its window closed.
- **11.1 Revelations [AUS] is undirected** — "[AUS] Put this card in play. Your prey plays with an open hand" carries no Ⓓ (KRCG; the
  entry's `dir: 'prey'`), but my window asks only my prey and the other bots open only the prey's: no predator is asked. [B] ·
  **active** (malkavian ×4: 182 superior plays in the 240) · both sides ask both; a section red on v0.6.235.
- **11.2 A human's directed action without a "Target:" suffix** opens the window at every seat (`_obsTarget` 0), so a bot that is
  not its target may block it. [w6 §8] · human.
- **11.3 Out-of-turn windows** — an out-of-turn master's window (Archon Investigation, Sudden Reversal on Sudden Reversal); the rest
  of the 36 `oot` cards wait for their own triggers; two bots' Sudden Reversals at one human master (no arbiter). [w5 §12.10; w3] ·
  reachable (lasombra holds Sudden Reversal ×2, ravnos Archon Investigation ×1).
- **11.4 The before-range step** — Saulot's Guiding Wisdom's combat end in a combat my vampire did not start as the acting minion
  (no before-range handshake between bots); after its first wait a bot blocker does not look for the actor's Change of Target
  again before its own before-range plays (Carrion Crows, Wall of Filth, a strength pump). [w4] · reachable (salubri, toreador).
- **11.5 A second block of the same action** [LSJ 20010814-2] — One With the Land's restriction again; Night Terrors' strike again.
  [w6 §8; pilot] · reachable (tzimisce, ravnos).
- **11.6 Night Terrors before an attempt** [LSJ 20020612], or by another of my vampires. [w6 §8] · reachable (ravnos ×4).
- **11.7 Spying Mission's +2 bank** sits before a reactions window: a later bounce carries the +2 to someone else (R-8: "the same
  Methuselah"). [O-4] · reachable (malkavian ×4 with bounces at the table).
- **11.8 Real-clock races** — a counter read after its window closed (the pool is spent, a `pay-cancel-late` row); a Yawp answer
  read after the caller's window closed (the owner has locked and fights alone); a human's aggravated card logged before my round
  starts reads as the weapon's (the nullifier's `_rndAt`). [w6 §8; w5 §12.10; pilot] · human / latent (the sim has no real clock).
- **11.9 A reopened poll** closes at once when every other seat has voted or passed (the boost's poll too): between bots nothing
  changes, a human who has not passed gets the vote clock again. [w4] · human.
- **11.10 Frontal Assault's +1 pool and the loss rates** read the prey's pub pushes; Tension in the Ranks can oust a bot outside
  its turn (`_oust`). [w5 §10] · reachable (brujah, banuhaqim, pathcaine).

## 12. Combat's steps
- **12.1 Additional strikes, v2** — one source a round per side (Quickness [CEL]'s outside-the-limit rider never stacks); no impulse
  back to the acting bot after it passed; no dodge, steal or combat ends in an additional pair (Hunger of Marduk's steal there); no
  strike card that brings one (Backstab-class: a strike and `addStrike` in one mode); a human's declaration after the bot stepped
  past Damage; Taste of Vitae is decided before the presses; the combat panel's `xa` / `xb` and labels cleared at a new pair (main,
  3 Nov §4). [w1; w2] · reachable (banuhaqim holds Hunger of Marduk ×10; Quickness in banuhaqim, brujah).
- **12.2 Grants into the resulting combat** — Precognition [AUS]'s prevention and Spirit's Touch [AUS]'s maneuver, if the vampire
  blocks [LSJ 20010813]. [sweep §4.3: ambers] · reachable (tremere ×2 each, hecata Precognition ×3).
- **12.3 Wave 1's latent combat** — Arms of Ahriman [OBL] would be offered as a plain dodge after the limit was used (the dodge is
  offered at the first strike only); Claws of the Dead checks its own blood, not a strike card's picked the same round, and is
  played at the first strike only; no prevention (the Wall included) is offered against Carrion Crows' damage. [w1] · reachable
  (lasombra, gangrel).
- **12.4 Wave 2's second review** — a weapon's strike sends a clone and a play row every time; the press step waits up to 1.5 s for
  a taken line after a clean dodge; Taste of Vitae's wait returns an earlier round's pending taken line at once (the clean-dodge
  path reads this round's only); `_xLossSum` sums nothing (a later taken line marks the pending one replaced: after an additional
  pair Taste counts the last pair). [w2] · reachable (tremere's gun; Taste of Vitae in brujah, nosferatu, pathcaine) · each fixed
  with a positive test and its footprint read.
- **12.5 A gun's maneuver binds its strike only under Immortal Grapple** (no chase deck carries a gun). [w2] · latent.
- **12.6 The Brujah crypt's printed +1 strength** (Theo Bell, Valeriya Zinovieva) under Torn Signpost [POT]: their fist deals 3, not
  4. [w2] · reachable (brujah) · check first: crypt wave A (v0.6.219) reads a crypt's strength.
- **12.7 The weapon nullifier does not model first strike** [LSJ 20040928]. [pilot] · latent.
- **12.8 Tested or traced less** — the mirror-image race (the acting bot declares, the answering bot meets it during its press
  step's first await) is tested on the 30 ms relay only; 159p tests the human-acting question through `_xBeforeLine`, not through a
  round; the `prevent-x` row's `incoming` is the plain damage (X covers aggravated damage too); Wall of Filth is counted twice in a
  receiving bot's `cardsShown` (its fx clone and its typed line, capped at 2). [w1] · debt.

## 13. Choices around a card (Claude's priors; not rules)
Decisions on Claude's priors; each needs a design to Johan before it changes (D-87).
- **13.1 Haven Uncovered's look-ahead** ignores the keep-home and hunt calls (Priority Contract's no longer does). [pilot] ·
  reachable (nosferatu ×1 in the 240).
- **13.2 `_aheadNoAct`** follows the minion loop's actor order but not `_minionKeyOrder`, so the contract can misjudge which vampire
  acts first. [pilot] · reachable (banuhaqim).
- **13.3 A second Priority Contract** is held, not cycled, while one is in play; **Blood Rage [tha] (+0)** is spent like a fist.
  [pilot] · reachable (banuhaqim).
- **13.4 `_strikePick`** takes a strike card over the hands whenever it holds one (v0.6.205): a pumped fist stronger than an
  absolute strike card (Soul Burn [tha] at 1R) loses to the card, and the look-ahead then keeps the pump; a strength pump is weighed
  at close, and a maneuver to long after it wastes it; a counter war can spend every maneuver in round 1. [w2] · reachable.
- **13.5 The card-worth engine's priors** — the removal hazard (a burnable card's life ignores the burns); the rates (a ready minion
  lost 0.3 a round, a hunt 0.5, a passed referendum 0.4, each worth three rounds) until the smoke sets them; the Ball through the
  engine; Tension's burn at a fixed 1.5 pool, not the two masters' worth; Piper played whenever the look-ahead takes the recruit
  (no check that a seat could block). [w5 §10] · reachable.
- **13.6 Sudden Reversal never cancels a master with no reading** (gain 0). [w5 §12.10] · reachable (lasombra).
- **13.7 The bot's own defence ignores its cloak** — a cloaked vampire still counts as rushable when the bot keeps blockers home.
  [w6 §9.1] · reachable (hecata, lasombra, pathdeath).
- **13.8 The voter's preview** skips a Silverson-class tax and an Alexa-class discard. [w6 §9.5] · reachable (ventrue holds Alexa
  Draper).
- **13.9 Forced Confessional [dom]** unseen in 12 matches: a pricing question first (L-9). [w6 §8] · reachable (salubri ×4).

## Not migrated: done since, or not a problem
- *w2*: Soul Burn's opposing weapons — read since v0.6.236 (R-41). Sanguine Entrapment and Skin Trap compiled as their own — the
  pilot's negation strip (v0.6.236) ends the misread; Sanguine Entrapment's ban on the other side is 4.5. The grants from Hunter's
  Mark, Fleetness and the experiment — built by the pilot (D-134).
- *w3*: Sudden Reversal held — built in wave 5b (D-122); the masters "still played blind" — built in waves 4 and 5 (D-106, D-120).
- *w5 §10*: the notes on what was built otherwise than §3 (Anarch Revolt's bill in `_w5Unlock`, Frontal Assault's bill and its
  worst case, Carver's freeing of my own hostage, The Rack's choice) — records of the build, not problems; its Tension and Piper
  notes are 13.5. *w5 §12.10*: its note on which built human paths are live with the menu's decks (a human's Sudden Reversal at a
  bot's master, a human's `cancel` of a Deep Song rush, a human's Week of Nightmares) — a status, not a rider; the missing line
  after a human's Sudden Reversal is 4.8.
- *w6 §8*: Deep Ecology's "Requires an Anarch" — every finder asks it since v0.6.236 (K2). Night Terrors' strike — built by the pilot
  (D-134); Hunting the Quarry — C's combat round (D-134; BOARD's V5 sweep line keeps it).
- *sweep §4.3*: the seven reds the bot could break — fixed in v0.6.235 (D-127); Wrong and Crosswise and Monastery of Shadows (FULL
  by key name only) — no deck holds them; C's census.
- BOARD's V5 sweep line keeps C's own scope: the title family, the ledger's grade column (spec §11.10), Hunting the Quarry.
