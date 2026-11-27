# spec-sweep-pilot — step B, the Banu Haqim pilot (20 Nov 2026, on bot v0.6.235)

**Status:** the owner's go-ahead on the pilot: D-125 and D-127 (B before C, the merge built first), D-132 (20 Nov 09:47: the pilot stays
first, as a test of the sweep's flow before the harvest), and the round's instruction (20 Nov 09:55): run B's second part, the
Banu Haqim pilot (STATUS Next 1), with agents as D-131 allows. This page is the round's record: the review sheet's split, who
else prints each effect, Claude's design under that kör (marked (C)), the predictions registered before the build, and the
flow's friction. Parent: `specs/spec-card-sweep-2026-11-18.md` §3, §4 (row B), §4.4, §11. Measured on `bot-docs-room` (`79b71b6`,
bot v0.6.235), KRCG's v5 dump of 20 Nov and a zero-vtes checkout at `0ed0d19` (20 Nov; 1,996 definitions).

## 1. The cards
The starter is at 68 of 77 playable copies (`docs/CARDS.md`: 66 playable, 2 unseen, 6 partial, 3 inert). The nine copies:

| card | × | today | KRCG (in short) |
|---|---:|---|---|
| Hunter's Mark | 4 | PARTIAL | [cel][tha] Ⓓ enter combat with a minion; the acting vampire gets 1 optional press in that combat. [CEL][THA] as above, and the opposing minion cannot strike: combat ends in the first round |
| Fleetness | 2 | PARTIAL | +1 stealth action, 1 blood. [cel] Ⓓ bleed. [CEL] Ⓓ enter combat with a locked minion; 1 optional maneuver in that combat |
| Blood Rage | 2 | INERT | close range only. [tha] strike: hand strike, not preventable by cards requiring Fortitude, the opposing vampire's weapon strikes inflict no damage this round. [THA] as above, at +1 damage |
| Biothaumaturgic Experiment | 1 | INERT | +1 stealth action, 1 pool. [tha] employ an animal retainer from hand ignoring requirements. [THA] put this card on a minion you control: 1 optional maneuver each combat and +1 strength |
| Priority Contract | 4 | FULL by key name (a misread, §4's six) | unique contract, trifle: on a minion of your prey, for a chosen ready Banu Haqim of yours, who can enter combat with it as a +1 stealth Ⓓ action; burn it for 3 pool when that minion is about to leave the ready region |

Riding with them (D-123): **Night Terrors**' strike (ravnos ×4: [OBF][PRE] if this vampire blocks, it can strike: combat ends in
the first round of the resulting combat) and **Hunting the Quarry** (pathcaine ×6; §3.8).

## 2. The split and who else prints each effect
Read by a fresh read-only agent from KRCG's text, with zero-vtes as the map (scratch pilot-sharing.md, not kept; grades as
spec-card-sweep §4.3: C carried, G generalize, R rider, O another path, N building block).

| effect | tier | who else prints it (the library) |
|---|---|---|
| The action rush, Ⓓ enter combat with a target | T2 | 26 action cards: Deep Song C (the reference), 13 G (Hunter's Mark, Fleetness, Line Brawl brujah ×6, Ambush, Bum's Rush, Umbrous Clutch, Taunt the Caged Beast, Nose of the Hound, Sense Death, Harass, Hunting the Beast, Charge of the Buffalo [for] …), 12 R (an after-combat or other rider no key reads). 23 allies, 4 equipment and retainers, the contracts: O |
| A maneuver or press for the acting minion in that combat | T2 | on the rush path 12: C 8 (Ambush, Bum's Rush, Fleetness, Taunt [ani], Umbrous Clutch [OBL], Make the Misere [cel], Hunter's Mark, Sense Death), G 2 (Nose of the Hound: 2; Harass: to continue), R 2. 22 more print it on a block or a blocked action (O) |
| Strike: hand strike, Fortitude-proof | T1 (Blood Rage); the Fortitude rider T2 | `handBonus` carries a hand strike (R-24; 0 is a number); "cannot be prevented by cards requiring Fortitude" on 7 (Soul Burn, curated; Blood Fury, Bollix; Soulgrinder and Dead Hand only at superior) |
| The opposing vampire's weapon strikes inflict no damage this round | T2 | Blood Rage, Soul Burn (amber since wave 2), Blood Fury, Bollix |
| A card on a minion: 1 optional maneuver each combat, +N strength | T2 by a reviewed list | action cards: Biothaumaturgic Experiment, Shadow of the Beast [pro], New Moon Sigil [spi] (G); +1 strength only: Preternatural Strength (curated), Enforcer, Ritual Challenge; 18 equipment with a maneuver each combat (the weapon's maneuver: C's rider, not this round) |
| A rush granted by a card in play on its host | T2 (masters) | Haven Uncovered and Regent (C, built); Priority Contract (R: the chosen rusher, the prey's minion, the pool); Contract, Hand Contract, Dirty Contract, Haqim's Law: Judgment, Shakar: the Hunt, Unacceptable Appearance (G, none in a starter) |
| The opponent cannot strike: combat ends (first round / this round / this action) | T2 (a misread fixed) | Hunter's Mark, Sanguine Entrapment, Mind of the Wilds, Dog Pack — all four compiled today as a combat-ends strike for their player ("cannot strike: combat ends" matches the compiler's pattern) |
| The blocker may strike: combat ends in the first round | T3 | Night Terrors; Internal Recursion (R, the whole combat) |
| Pool when the host is about to leave the ready region | T3 | Priority Contract only |
| Employ an animal retainer ignoring requirements | T3 | Biothaumaturgic Experiment only (the deck holds no animal retainer) |

## 3. The design (C)
**The whole-mode rule** (A2): a key a compiler pattern writes lands only on a mode whose every sentence is read; a mode with a
sentence no key reads gets nothing from the pattern, and the card is listed with its rider. A rules correction is never behind a
knob; the new plays are live, as the V5 waves' were (D-122 – D-124).

### 3.1 Data
1. **The rush** (`cardfx-compile.js`): an action mode that is "Ⓓ Enter combat with <target>." and only the sentences below
   becomes `rush: true` with **`rushTo`** where the target is conditioned (`'locked'`, `'vampire'`, `'younger'`, `'older'`; a
   minion of another Methuselah is the bot's own target set). An or-condition, an ally, a sect or a clan target: no key (listed).
   Deep Song keeps its hand entry. `lockTarget` stays Deep Song's ("enter combat with and lock").
2. **The grant**: "This acting vampire gets N optional maneuver(s) | press during that combat" (and "with an optional maneuver
   in that combat") on a mode the rush took: **`maneuverGrant: N`**, **`pressGrant: N`** (`pressDir: 'continue'` where printed).
3. **The ban** (a misread fixed library-wide): "cannot strike: combat ends" is never `strikeCE` / `combatEnds`; it is
   **`ceBan`** (`'r1'` the first round, `'round'`, `'action'`, `'combat'` by the text). "cannot strike: dodge" is never `dodge`
   (Sanguine Entrapment). Hunter's Mark [CEL][THA] then compiles whole: rush, pressGrant 1, ceBan 'r1'.
4. **The hand strike**: "Strike: hand strike." in a whole mode → `handStrike`, `handBonus: 0`; "this hand strike is at +N
   damage" (and "As above, and …") adds N (Blood Rage [THA] 1; Blood Fury [THA] 2, today read 1). **`noPreventDisc: 'for'`**
   from "cannot be prevented by cards requiring Fortitude" only where every strike mode of the entry prints it (the struck bot
   reads the key by the card's name, not its level: Soulgrinder and Dead Hand are listed). **`nullOppWeapons`** from "the
   opposing vampire's strikes with weapons inflict no damage this round"; Soul Burn's hand entry gains it.
5. **The card on a minion** (a reviewed list, by merge): **`maneuverEach: 1`** with the existing `strengthBonus`, and where it
   goes (`attach: 'own'` a minion you control, `'self'` the acting vampire, `'ownVampire'` a vampire you control: New Moon Sigil [spi]). Biothaumaturgic Experiment [THA] (its compiled
   `maneuver: true` dropped), Shadow of the Beast [pro], New Moon Sigil [spi]; a mode with a further rider is not given it.
6. **The granted rush** (by merge): Haven Uncovered read by key, not name (`rushGrant` 1; **`rushBy`** `'any'`, **`hostOf`**
   `'any'` its defaults); Priority Contract: its misread mode dropped, `rushGrant: 1`, `rushBy: 'chosen'`, `hostOf: 'prey'`,
   **`poolOnHostLeave: 3`** (T3). The six other contracts: the register's debt (C's), not entries now.
7. **The blocker's strike**: Night Terrors [OBF][PRE] `ceGrant: 'r1'` in place of its compiled `combatEnds` / `strikeCE`.
8. **The employ** (T3, by merge): Biothaumaturgic Experiment [tha] **`employAnimal: true`**; the compiler marks a retainer whose
   text says it is an animal (**`animal: true`**).
9. **The register** (`cardfx-sharing.json`): every new hand key comes with its answer; `rush`, `lockTarget`, `rushGrant`,
   `noPreventDisc` leave the backlog as `shared`, with the cards that print them (a card that prints one and lacks it is the
   row's debt, reported); `poolOnHostLeave`, `employAnimal`, `ceGrant` `unique`. As built (§6): `ceGrant` is `shared` (Memory
   Rift [pre] and Shroud of Absence [DOM][OBT] print the same strike), and six more rows are `shared`: `attach`, `hostOf`,
   `maneuverEach`, `maneuverTo`, `rushBy`, `strengthBonus`.

### 3.2 The bot
1. **The card rush** (`_bestCardRushFor`): the best usable rush card, not the first; its cost carried and paid (Fleetness's
   blood); `st` from the card's `actStealth`; `_entryReqOk` and `_titleOk`; `rushTo` filters the targets. Deep Song's path,
   line and lock stay byte for byte. Every other rush card announces on the granted rush's line, `VAMP enters combat with
   NAME's VAMP (CARD [LVL]).` (no lock, the rusher acts; the level when it was played at one) and goes to the ash heap.
2. **The rushed bot** reads that line for any card (`L12.havenRush` opened), looks the mode up by name and level, and keeps a
   `ceBan` against itself for the combat: its `_bestCombatEndFor` offers nothing in the banned round.
3. **The grant** (rusher side, on `_actingVamp`: `_clearCombatStashes` would wipe a stash): one free optional maneuver / press
   per grant, used before any card, named by its card in the frozen lines (`maneuvers to DIR (CARD)`, `presses to continue
   (CARD)`); it dies with the combat. Guard Dogs' route stays as it is.
4. **The card on a minion**: an attach finder grown from `_bestStrengthFor` (host: itself or another ready minion of mine; a pool
   or a blood cost); `maneuverEach` is one free maneuver each combat per card, before any hand card, with its own used set (not
   the equipment's `_equipManeuverUsed`); strength through `_strengthBonus`. Preternatural Strength's play stays byte for byte.
5. **The hand strike**: Blood Rage at close range only, ranked by its damage; `nullOppWeapons` is read by the struck side — my
   strike this round was a nullifier and was not dodged ([LSJ 20040928]): the opposing weapon strike deals me 0, on my taken line.
6. **Priority Contract**: played by the look-ahead rule (D-58, Haven's `_havenHostPick` by key): when a ready Banu Haqim of mine
   would rush that minion of my prey through it this turn; unique, trifle; the placement line names the chosen vampire; only the
   chosen may rush through it; when its host leaves the ready region I burn it for 3 pool (in my own combat at the host's taken
   line; elsewhere when my next board read shows it gone, `_w5PubDiff`; the ruling's oust case [ANK 20180129-2] included).
7. **Night Terrors**: the superior mode when usable; after my block, a free strike: combat ends in the first round of that combat
   (an `_owl`-shaped record set after the block's clear, read by `_bestCombatEndFor`); the existing lines tell the actor.
8. **Biothaumaturgic Experiment [tha]**: with an animal retainer in hand whose requirement the vampire lacks, employ it through the
   card (both costs paid).
9. **New and opened lines** go to main as a handoff (§12 and a canary case each; the bot first: backward compatible).

### 3.3 Not in this round
- **Hunting the Quarry** (pathcaine ×6): it needs a new step in the combat handshake, "combat would end", and its [CEL]/[THA]
  new round is shared (Relentless Reaper and Telepathic Tracking print it too). It goes to C's combat
  round, where the family builds that step (D-132), not to a round whose subject is a starter it is not in. Its curated entry
  stays as it is: no modes, held.
- The rush and grant R cards (their after-combat riders), the six G contracts, Soulgrinder's and Dead Hand's superior-only
  Fortitude rider, the weapon's maneuver (C's riders; since 20 Nov 2026 `SWEEP-REGISTER.md` 5.2), the reaction and modifier grants (O): listed, C's.

## 4. Predictions (registered before the build; D-93, L-44)
1. **The starter: 68 → 77 of 77 playable copies** (`docs/CARDS.md`, the discipline-line check on). 74 to 76: a card short, named
   in the PR; fewer than 74: the design missed a mechanism.
2. **The library: playable (static) 609 → at least 618**, net (the five cards' four that were not playable, at least five more by
   the rush, the grant and the hand strike, less what the fixed misreads un-certify: Sanguine Entrapment's dodge and combat-ends
   strike). 613 to 617: the whole-mode rule refuses more than the analysis expects; fewer than 613: the shared effects did not
   land library-wide, and the flow's friction says why.
3. **The 240 (Malkavian, Tremere, Nosferatu, Ventrue) against v0.6.235: IDENTICAL**, the version string normalized. None of their
   cards changes its reading, and the shared code this round touches (the rush branch, Haven by key, the grant, the attach
   finder) must keep their play byte for byte. A diverged match is a fault until it is explained.
4. **The V5 smokes** (12 matches each, seed 1, as the ledger's): IDENTICAL for the eleven decks whose cards no new reading
   reaches (gangrel, hecata, lasombra, ministry, pathcaine, pathcathari, pathdeath, pathpower, salubri, toreador, tzimisce);
   DIVERGED for banuhaqim, brujah (Line Brawl) and ravnos (Night Terrors' strike).
5. **The pilot at the table** (48 matches: `--decks banuhaqim,malkavian,tremere,nosferatu,ventrue --seatings random --matches 48
   --seed 1`): every rush through Hunter's Mark, Fleetness and Priority Contract reaches its combat with the rushed bot's answer
   (`ana-combat2.py`'s handshake 100 %); Priority Contract gains pool only after its host left the ready region (0 at play, the
   misread's +3 gone); `ana-gates.py` PASS on every audit; each of Hunter's Mark, Fleetness, Blood Rage and Priority Contract is
   played at least once (Biothaumaturgic Experiment's one copy is reported, not predicted).

## 5. The flow's friction (written as the round met it)
- **Who else prints it.** The review sheet gives each card's effects and "printed by N", not the other cards in KRCG's wording: a
  second reader went through the text (an agent, about 15 minutes, scratch pilot-sharing.md, not kept). C's cross-check tool should
  print that list.
- **The effect view finds what the card view does not.** One of the pilot's effects was a misread of four cards library-wide
  ("cannot strike: combat ends" compiled as the player's own strike); the review then found the same class on about thirty more
  ("the opposing minion cannot dodge / maneuver / press"). LESSONS L-98.
- **The whole-mode rule needs a synthetic case per guard.** It is what keeps a pattern from half-reading a card, but no real card
  exercised half its guards: fifteen mutants of them survived until test-cardfx got small synthetic libraries.
- **Data before readers is a window.** Between the data commits and the readers, the old bot read the new keys wrongly (Priority
  Contract played as a Haven Uncovered; the experiment through the strength finder for 1 blood). The data and its readers must
  ship in one release; the review caught it before one was cut.
- **The register undercounts.** A `shared` list is easy to leave short (a maneuver each combat: 5 of 37 cards at first; a card on a
  minion: 12 of about 140): a key's definition in the register must be narrow, and its list complete for that definition.
- **The agents.** Execution split by file and by family worked (A the data; B1 the rush and combat readers; B2 the masters and the
  action side; a fixer for each review pass), each from a written brief and each pushing its commits; reviewers ran in parallel on
  halves (data, bot) from exported copies, so they never met a half-edited file. A session restart stopped the first fixer
  mid-work; it resumed from its transcript. The second fixer had a worktree and a branch of its own, fast-forwarded in, so the
  session's uncommitted docs and its commits never met. Review until clean: pass 1 found 28 faults (and the graders 6 reds), pass 2
  15 (the data side's 9: the negation strip had exposed three cards a misread key hid, and its class was larger; the bot side's 6:
  a bug in pass 1's own fix), pass 3 6 (that fix's exemption both too wide and too narrow, seen from both sides; fixed by the
  session without a fourth review, the loop's limit). Two are listed (BOARD). Each pass took 30–35 minutes a reviewer.
- **The suite outgrew its heap.** At 4 GB it died in section 180 (each `new Bot` parses its own cardfx, about 2.9 MB of heap: a likely
  share, not profiled): 6 GB now, C6.
- **The sweep finds rules errors in the finished decks too.** Aunt Linda (Nosferatu, no Animalism) employed Raven Spy and Murder of
  Crows: the plain employ asked no requirement (R-46), found while the experiment's employ was built. A scratch audit of the traces
  (each play's card against its vampire's disciplines) finds her 14 employs in the 240 and Zafira's Feral Hound in the ravnos smoke
  before the fix, and none after in the 240, the 14 smokes and the 48: a gate that would have caught them rounds ago.
- **A footprint is hard to account for by hand.** Three fixes found in the round (D3, E1, K2) moved decks the prediction had
  called IDENTICAL; telling them from the pilot's own changes took runs at three commits (§7). The trace rows' context objects are
  written at the match's end (BOARD), so a payload difference points at the wrong row.

## 6. As built (bot v0.6.236) and the riders
**Built** as §3 says, with these differences:
- Hunting the Quarry is not built (§3.3).
- The compiler strips every "cannot" clause and every grant to the opposing minion from the player's own keys (the review's D3),
  not only "cannot strike: combat ends": 26 entries; Target Vitals (pathdeath ×4) is the only starter card among them. The second
  pass took the rest of the class: an opposing minion's cost, restriction or cancel, its act as a trigger, "the press step" (a
  time), "aggravated" in a negated clause (16 entries, none in a deck). A dropped misread key had kept Pounce, Taming the Beast and
  Backstep out of the choosers (L-98): a level-less mode now needs its card's discipline (a vampire's Flight is read from its text:
  the crypt's `flight`); "this minion cannot" leaves a hand strike no bonus; "maneuver, only usable to go to long range" is
  `maneuverTo` (13 cards; Dance with the Devil in pathcaine); "As above, but" with its own strike replaces the inherited one.
- Blood Rage-class nulls the opposing vampire's weapon strike, never an aggravated strike card that seat showed this round, nor an
  aggravated hand strike since its combat or action began (Uncontrollable Rage, Raking Talons, Invigorate); a card with `aggr` and
  no strike (a weapon's pump, a defensive misread) does not count (passes 2 and 3). A human's card giving a maneuver each combat
  keeps Adaptive's maneuver step. Eldritch Glimmer [THA] reads its printed floor, 4R (compiler v1.11.4). `maneuverTo` narrows a
  compiled maneuver; it is no whole-mode reading (D-134 names the rush and the hand strike).
- "Requires an Anarch" is asked by every finder (`_modeUsableBy`, `_entryReqOk`, `_masterReqOk`), not only the rush's.
- The experiment's [tha] employs only a retainer whose text the vampire can use (O-49 for the owner); the plain employ asks a
  retainer's requirement (R-46, a rules correction in its own commit); contracts are never placed on Iliana (G2).
- Priority Contract is held when its chosen vampire would stay home or hunt this turn (`_aheadNoAct`), and burned for its pool
  only when the host itself goes down, not when it changes controller.
- A human rushed by Hunter's Mark [CEL][THA] is told the ban in chat; a rush at a locked target that is unlocked at resolution
  fizzles [ANK 20210124].

**The riders** (BOARD, "The V5 waves' riders"; since 20 Nov 2026 `SWEEP-REGISTER.md`, D-135): each built and section-tested, or ruled out.
- Haven Uncovered's look-ahead ignores the keep-home and hunt calls (the contract's no longer does).
- A second Priority Contract is held, not cycled, while one is in play; Blood Rage [tha] (+0) is spent like a fist.
- A card on a minion makes `_bestStrengthFor` refuse Preternatural Strength; allies are never offered as hosts; Creepshow Casino
  is not offered at the new announces; Preternatural Strength's branch calls no Perfectionist.
- Equipment with a discipline requirement is equipped without it (Baleful Doll, Canopic Jar, Inscription, Tinglestripe; in no
  starter): R-46's twin. `_bestBounceFor` asks no title (a baron).
- The compiler: Stutter-Step's "not usable as an additional strike"; `aggr` read from "non-aggravated", "treats aggravated damage
  as normal" or "prevent all aggravated damage" (Soak, Resilience, Skin of Night …; test-cardfx pins Bloodform [VIC]'s), and the
  aggravated strikes it gives no strike key (Body of Sun, Mayaparisatya [CHI], Smite, Bone Spur, Devil-Channel: Hands: the
  nullifier reads their line as the weapon's, as K1 did); a weapon's conditional `aggr` (Dagger, Poker against a Kiasyd; Blade of
  Enoch against Brujah) counts as an aggravated weapon; Expiate's `combatEnds` (a time), Battle Frenzy's `addStrike` (the chosen
  Osebo's), Necrosis [THN]'s rider, Ron Zertnert's press-step lock; Crawling Chamber's [VIS] requirement lifted onto the whole card
  (its [tha] `maneuverTo` unused); Mind of a Killer is Ⓓ (a `strengthBonus` on it would let `_bestStrengthFor` play it on my own
  vampire); two synthetic-only shapes (an 'As above' maneuver the other way; 'but for N environmental damage' over a strike).
- Flight from a card (Concordance [DAI], Taking the Skin: Vulture) is not read; an equipment's `maneuverTo` is not read
  (`_equipCombatOption`); Haven Uncovered's record is by name, and Adaptive skips a maneuver a human has from no card on the
  minion (Abaddon's own, Guard Dogs', a rush grant: BOARD).
- The ban's readers on the opponent's side: Mind of the Wilds [ANI][AUS] (the action), Dog Pack (every combat with the employer),
  Sanguine Entrapment (the round); a human's Priority Contract names no chosen vampire, so no bot records it: the readers' rounds
  (D-132).
- The weapon nullifier does not model first strike [LSJ 20040928], and a human's aggravated card logged before my round starts
  reads as the weapon's; Night Terrors' strike after a second block of the same action [LSJ 20010814-2]; the employed retainer's
  version is not stored [RTR 19941109].
- Fleetness [cel]'s +1 stealth on a bleed (the bleed finder reads no `actStealth`): C1's.
- Shadow of the Beast [PRO]'s press each combat; New Moon Sigil [SPI]'s paid stealth; a Haven's host burning it (O-23).
- The register's debts: the six other contracts, the rush cards with after-combat riders, Soulgrinder's and Dead Hand's
  superior-only Fortitude rider: C's.
- `_aheadNoAct` follows the minion loop's actor order but not `_minionKeyOrder`; a rush grant of 0 cannot be written (`_grantOf`).

## 7. The predictions, observed
Measured on the release bytes (`elysium-bot.js` `4c193599`; their runs equal those of `45340a7`, the second pass's head, match for
match, the version normalized) against v0.6.235's runs (`65eab87`), the pilot's own changes alone at `7fd0e66` (after pass 1's
fixes, before E1). E1 and K2 are rules corrections the round found (R-46); predictions 3 and 4 were registered before them.
1. **The starter, 68 → 77 of 77: held.** `docs/CARDS.md`: banuhaqim 77 playable, none unseen, partial or inert.
2. **The library, 609 → at least 618: failed, 609 → 610** (612 after the first pass). Up 12: the four starter cards that were not
   playable (Biothaumaturgic Experiment, Blood Rage, Fleetness, Hunter's Mark), five rush cards (Ambush, Bum's Rush, Nose of the
   Hound, Sense Death, Umbrous Clutch: the registered "at least five" held) and three the second pass made exact (Backstep, Pounce,
   Necrosis). Down 11: the registered one (Sanguine Entrapment) and nine more of the misread class, "cannot X" or another minion's
   sentence read as the player's own (Mind of the Wilds, Rigor Mortis, Shoulder Drop, Skin Trap, Sword of Troile, Sympathetic
   Agony, Target Head, Target Vitals, Dagon's Call), and Blade of Bellona, whose direction is now read and no reader takes it. The
   band's stated cause is wrong: the shared effects landed; the misread class was larger than the analysis knew (§5, L-98).
3. **The 240, IDENTICAL: held for the pilot** (IDENTICAL 240 at `7fd0e66`). The release against v0.6.235: DIVERGED 14, SAME-PLAY 5,
   IDENTICAL 221. The 14 and four SAME-PLAY are E1: Aunt Linda (no Animalism) no longer employs Murder of Crows (12) or Raven Spy
   (2) — no card action instead 10 times, Creeping Sabotage 3, Haven Uncovered 1; the four lose the retainer from a decision's
   context. The fifth (match 168) is the second pass's discipline gate: Ashley reserves no blood for Revelations, which she cannot
   play. VP paired: malkavian +0.04 (SE 0.02), nosferatu +0.00, tremere −0.00, ventrue −0.04 (0.02) — a map, not a verdict (L-94).
4. **The V5 smokes: half held.** banuhaqim DIVERGED 12 and brujah DIVERGED 7, SAME-PLAY 5 as registered (Line Brawl [pot] is
   played as a rush; the base played it as its [pre] bleed); hecata, lasombra, ministry, pathcathari, pathpower, salubri and
   toreador IDENTICAL. Failed: ravnos is IDENTICAL for the pilot — Night Terrors was played twice, both times by Luciano Carvalho
   (inferior Presence), so the [OBF][PRE] strike was never there (section 181f is its proof), and E1 moves it: DIVERGED 1,
   SAME-PLAY 4 (Zafira, no Animalism, employed Feral Hound); four of the eleven moved by the corrections: pathdeath DIVERGED 1
   (D3: Target Vitals' misread press), tzimisce SAME-PLAY 4 (K2: The Anarch Free Press waits for a ready Anarch), E1's gangrel
   SAME-PLAY 3 (Indira, Joaquín, Ruslan) and pathcaine SAME-PLAY 3 (Dread Mastiff). The second pass changed no smoke. `ana-gates.py` PASS 6/6
   on each.
5. **The pilot at the table: held.** Handshake 3416 of 3416; Priority Contract placed 35 times and rushed through 43 times, its 3
   pool taken 21 times, each after the host left the ready region (19 to torpor, 1 burned, 1 with its ousted Methuselah), never at
   play; `ana-gates.py` PASS 6/6; Hunter's Mark 70 rushes (25 blocked), Fleetness 45 (6 blocked), Blood Rage 54 plays;
   Biothaumaturgic Experiment attached 7 times, a maneuver from it 16 times. Latent at this table: the weapon nullifier, the
   blocker's combat ends, the fizzle (0 each).
A scratch audit (§5) finds no card played by a vampire without its discipline in the 240, the 14 smokes and the 48.
