# SWEEP-REGISTER — the problems the sweep finds, by class (20 Nov 2026, on bot v0.6.236; RULINGS D-135)

The owner, 19:47 (the idea) and 19:48 (kör on Claude's shape; D-135): the sweep goes on, and what it finds is collected here and worked
off one class at a time. A round takes one class: its design to the owner and the go-ahead, the build, review until clean (D-133), a
release. **A problem that changes a finished deck's play** (seen in the 240 or the V5 smokes, as Aunt Linda's employs were) **is
fixed in a release of its own**, ahead of its class's round (Claude orders those releases, D-137); the rest waits here. Not a
standing page (outside `tools/doc-budget.sh`): BOARD keeps one line per class and points here.

**An entry** is one bullet: the card or area — what is wrong; the evidence (the card's text, a ruling by its id: links stay with
the rulings database and the archive); where it was found, in brackets; its state; a fix sketch where the fault does not make it
evident. **States:** **active** — the bots' own play in the 240 or a V5 smoke breaks the rules: a play the text forbids, or a
printed value or window it gets wrong (counted; D-135 sends it to a release of its own, D-137 orders them); **missed** — the bots'
play there never uses a printed option (legal, weaker; counted; it waits for its class's round, D-137);
**reachable** — a deck the sims play holds the card, but no count shows the faulty path firing (the class's round measures it
first); **latent** — no deck the sims play reaches it; **human** — a human's play, which the sims never make (live at a table
whenever a human holds the card); **debt** — a trace, row or test debt with no play change. Decks are the `deck-*.json` lists of 20
Nov: the 240 plays the four starters; each of the 14 V5 smokes one other precon with them (HOWTO). The counts are from v0.6.236's
runs of 20 Nov (the 240 and the smokes at seed 1, HOWTO's commands); a scratch audit of their 21,760 plays against each vampire's
clan, sect, title and capacity found one fault, 8.3 (the play rows name no discipline level).

**Adding and closing.** A round that finds a problem it does not fix adds an entry to its class (a new class when none fits). A
fixed entry is deleted in the round that fixes it (the CHANGELOG and the PR keep it); a ruled-out one is deleted with its reason in
the PR. An active entry is fixed in a release of its own, not in its class's round (D-135; the order, D-137); it stays listed
until then.

**Migrated on 20 Nov** (each entry names its source): the pilot's riders (`history/specs/spec-sweep-pilot-2026-11-20.md` §6: *pilot*);
BOARD's card lines under "Known, not built" (*B*); BOARD's "The V5 waves' riders", that is the waves' own sections (*w1*–*w4*: each
spec's §4; *w5*: `history/specs/spec-v5-wave5-2026-11-17.md` §10 and §12.10; *w6*: `history/specs/spec-v5-wave6-2026-11-18.md` §8, its curation
queue included, and §9.1–§9.5); the V5 sweep line's problem riders (wave 2's second review, in *w2*; the latent reds, the ambers
and the cards found on the way of `specs/spec-card-sweep-2026-11-18.md` §4.3: *sweep §4.3*; its row C's misreads and known misses,
§4: *sweep §4*); RULINGS' card gaps O-3, O-4, O-21, O-23 and O-24 (stubs stay there). The criterion: a line about how a card is
read or played (its data, a finder's gate on it, a reader of its play, its record) moved; decision, ledger and estimate lines
stayed (O-12's steal pair, BOARD's locked routes but their Eyes of the Wild rider, 10.12). The specs keep their text as history.
What those sources hold that is done, or is not a problem, is listed at the end.

**The classes** (1–6: Claude's list of the evening, under the owner's go-ahead, 4 and 5 broadened to another seat's play and a maneuver's
source; 7–13: the migration's sorting, Claude's; 14: v0.6.238's and v0.6.239's egress reviews; Claude orders the rounds, D-137).
Active entries: 8.3, 11.1. Missed: 4.6, 5.2, 7.6, 8.6, 9.8, 10.1, 10.2, 10.16, 10.24, 12.2, 13.10.

## 1. Retainers: version and holder
A retainer with a discipline icon is employed only by a minion with that discipline, and the level used fixes its version
[RTR 19941109] (R-46). R-47 (the owner's 19:45 answer to O-49, as Claude read it, with the rules directors' posts): the icon shows what
it takes to employ the card; once in play the effect does not depend on the holder's disciplines (a temporary discipline lost
later, a stolen retainer), unless the card restricts its own effect (Razor Bat: "The Gargoyle with this retainer") [ANK 20180612];
a retainer brought in ignoring requirements comes in at its basic version [LSJ 20100302]. The round: the version stored at entry
and read by every reader of an attached retainer. Its open design question (for the owner first): where the version of another seat's
retainer comes from.
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
The compiler reads "aggravated" where the card says the opposite, misses an aggravated strike (which the weapon nullifier, Blood
Rage-class since v0.6.236, then reads as the weapon's), or drops the condition on a weapon's. [pilot]
- **2.1 Negated or prevented aggravation read as `aggr`** — "non-aggravated", "treats aggravated damage as normal", "prevent all
  aggravated damage" (Soak, Resilience, Skin of Night …; C1b's second pass: Ignore the Searing Flames, all three lines); test-cardfx pins Bloodform [VIC]'s. · latent · the compiler's negation
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
Mostly a human's: the client's line names no card, no level or no target, or the bots have no parser for it. A need on main's side
is a handoff first. Bot-to-bot gaps are marked.
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
- **4.6 The bounce's other halves** — a human's bounce of a bot's bleed is read since v0.6.237 (D-136): the client's bot ring
  (v2.6.187) writes the re-announce the acting bot follows and a bot at the new seat arms from (so a HUMAN's bleed bounced by a
  human to a bot arms too), and a typed `bounce <name>` (the bot writes the re-announce); the card's play line is not read, the owner:
  many cards bounce. Left: a bot that is a bounce's new target cannot bounce onward (that half is the bot's own play); a bounce
  card played from the hand with no ring and no typed line still moves nothing. [B; O-3; the playtest round] · **missed** (the
  onward bounce; v0.6.238's 240, a scratch count: of 597 bounces the new target held a usable bounce of its own in 146, and 62 of
  those landed on it, 21 of them bleeds of 2 or more, which a first target bounces every time: 345 of 345) / human.
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
- **4.15 A human blocker's Visage pool** — the bot tells the human; nothing checks it. **A human's directed action of unknown
  kind** at my pool may be a bleed, so a bot may block it even under that human's Ball. [w4] · human.
- **4.16 The acting bot accepts a human's block of a barred action** (every bar). [w4] · human.
- **4.17 An opponent's Oblivion or Depravity** — the table model reads the printed disciplines (`_scanOpp`). [w4] · reachable
  (hecata and lasombra hold Oblivion, pathcaine Depravity; bot-to-bot too).
- **4.18 A bot's frenzy combat card at my Salubri between bots** — only the rush is read. [w5 §12.10] · latent (in the decks only
  Deep Song's rush carries the frenzy tag).
- **4.19 The opponent's pumps** are not read before its strike (its strike line carries the result): the wave decision and the
  dodge do not see them. [w2] · reachable (bot-to-bot).
- **4.20 A human's Mirror Walk [THA]** — a bot blocker reads a bot actor's lines (RIDER_STEALTH, BLOCKED_LOCK; v0.6.241), not a
  human's: the client writes the level into a human's play line by default (`playLineHtml`; the table helper `modeChoice`, off in
  tournament mode or when the host locks it): `VAMP plays Mirror Walk [THA].`, or `Mirror Walk [THA] was played.` with no acting
  vampire named. RIDER_STEALTH reads only the bot's `: +N stealth.` shape and nothing is said at the block, so the bot's blocker
  begins its combat. [the exactness round; its egress review, pass 3] · human · a reader for the client's play line (the level;
  the actor from the line or the action); with the helper off, the human says it (a chat word the blocker reads, as `bounce`).
- **4.21 A human's Carrion Crows** — the environmental damage of a human's Crows (1R [ani], 2R [ANI], each round during normal strike
  resolution) is not applied to the bot's minion: the bot narrates the strike alone and does not read a later change on the counter.
  Not 12.3 (the bot's own prevention against Crows). [Claude's playtest game 2, 25 Nov, 1474.3 and 2817; the 26 Nov handoff's
  check] · human · a reader of a human's Crows play line (its level) that adds the damage in each round's strike resolution.
- **4.22 A human's The Dowager (+1 intercept during directed actions)** — at Claude's playtest table the printed +1 was not counted
  on the block counter (game 2, the panel's point 4: Claude's own Dowager, in the human's Nosferatu starter, blocking). The
  bot blocker writes its own crypt intercept (`_cryptIntercept`); which side missed it at that table is not traced. [Claude's
  playtests, 25 Nov; D-111 (6), BOARD's measurement debt] · human · trace it at the next human table: a bot's Dowager blocking a
  human's directed action, and a human's Dowager blocking a bot's (the bot could seed a human blocker's printed intercept into an
  untouched counter, as it seeds a human actor's stealth).
- **4.23 A human's Pass at the strike step** — the bot counts it as no strike (0 damage), but the rulebook makes the hand strike the
  default: "Each minion chooses their strike … by default from a hand strike" and "The default strike is a hand strike"
  (https://archon.vekn.net/help/rules#choose-strike, #hand-strike). Seen with a second gap: after a human's combat card the bot
  moves to the next step, so the human's next Pass answers one step later (Claude's strike step became a Pass, 2797.6 → 2816.8).
  [Claude's playtest game 2, 25 Nov] · human · a human's Pass, or no strike line by the step's end, reads as a hand strike (the
  minion's strength at close range, nothing at long range); the step waits for the human's answer to its own question.

## 5. Maneuvers: direction and source
Which way a maneuver goes, and where a maneuver comes from (a card, equipment, a grant).
- **5.1 `maneuverTo` on equipment and on before-range cards** — an equipment's is not read (`_equipCombatOption`: Blade of
  Bellona); the evening's list adds the before-range cards that carry one (Angel's Gift, Crawling Chamber, Dark Steel), whose
  reader the round locates (`_bestManeuverFor` reads the key). [pilot; the evening's list, D-135] · latent (no deck holds them) ·
  the direction read wherever a maneuver is offered.
- **5.2 A weapon's maneuver is never offered** — the compiler writes `maneuver: true`, `_equipCombatOption` takes only a number,
  so the Tremere's .44 Magnum has never maneuvered and wave 2's gun halves (`_strikeBound`'s gun arm, the ash guard) never run.
  [w2: the second review; sweep §4.3: amber] · **missed** (tremere in the 240: the gun struck 53 times, and no row names a gun
  maneuver) · read `true` as one maneuver each combat; test the gun halves through a combat.
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

## 7. Conditional and capped values
A value the text conditions or caps, compiled as a plain number.
- **7.3 Kevlar Vest** — 2 only against guns; `_equipPrevent` prevents 1 against everything (sweep §4.3 calls it a red). [w1; sweep
  §4.3] · latent (tremere holds the vest and the only gun).
- **7.4 Night Moves** — the bleed is capped at 1 pool; so is Cat Burglary's ("If more than 1 pool is bled with this action, ignore the
  excess", KRCG; its [CEL] bleeds any Methuselah). [sweep §4.3: red; C1b's egress review] · latent (nothing in the sewer deck bleeds
  for more; no deck holds Cat Burglary).
- **7.5 The `plusIf` row's other cards** — since C1b (v0.6.244) `_plusIf` reads the acting minion's title (Protection Racket: "with an
  additional +1 intercept if the acting minion is titled", KRCG) and its sect (Ministry's +1 against a Sabbat acting vampire); left: Sense
  the Sin [dai]'s additional +1 intercept "if the acting minion has any corruption counters" (the bots count no corruption counters) and
  The Mausoleum, Venice's additional +1 vote while Ventrue Headquarters is not in play (`cardfx-sharing.json`'s plusIf row: owed). [the
  exactness round's egress review, pass 3; C1b] · latent (no deck) · a corruption counter read on the actor; the Mausoleum's a check of
  the table.

- **7.6 C1's unread conditions** — the stealth / intercept / bleed family's corrections (v0.6.243) keep a value the text conditions on
  `fx.plusIf` with an `unread` condition in words, which `_plusIf` fails closed. C1b (v0.6.244) reads the actor's title and sect, the
  action's form (High Aye, Mirror's Visage [CHI], Corpse Balloon [VIC]) and a value sold for blood (`fx.payBlood`: Stone Travel, Pocket
  Out of Time, Siren's Lure [cel], Mole's Tunneling [SPI], Ears of the Hare, Voices of the Castle [tha]; Speak with Spirits [SPI] on the
  locked route). Left unread: an ally's or a monster's (Asanbonsam Ghoul, Carlton Van Wyk, Illuminate, The Unmasking); against the chosen
  minion (Divine Sign, Canopic Jar); a bearer's on a card in play, a retainer or equipment (Abbot, No Secrets From the Magaji against
  vampires, Anarch Manifesto, Giuseppe, Marijava Ghoul, The Ancestor's Talisman, Tremere Convocation, Watchtower: The Wolves Feed, on
  actions that require a discipline, an anarch or a clan); an undirected action's on an action card (Lock); the target or its controller
  (Bloodwork, Priestess of Sekhmet, Songs of the Distant Vitae [QUI], Rampage [pot], and the employ or equip action's own +1 on another's
  minion: Charnas the Imp, Ilomba, Swarm, Bloodstone); a price in pool, in a counter or by a card in play (Special Report, Psalm of the
  Damned [pre], Pentex™ Loves You!, Samuel Haight, The Rumor Mill's lock; the agreeing rows' sample, C1b: Polaris Coach's counter,
  Changeling Skin Mask burned, WMRH Talk Radio's pool when its minion does not block, Revelation of Desire [SER]'s corruption counter);
  and one each (Achilles' Heel, Bear-Baiting, Communal Haven: Temple, Form of Mist [PRO]: 9.8, Gravebound Drone [OBL], Guinea-Bissau
  Carnival, Hexaped, Mithraic Cultist, Pallid, Phased Motion Detector, Sunset Strip, Unlicensed Taxicab, Charigger's hunt stealth;
  Baltimore Purge's `selfClan` Ravnos, which the actStealth path does not read). Unlicensed Taxicab's own `actStealth` 2: the equip
  announce books the basic +1 only. [C1's readers and the lead; C1b] · missed (Abbot: pathcaine ×1, Gravebound Drone: pathdeath) /
  latent (the rest: no deck) · a reader per condition kind where the number is summed, the price paid where the bot plays the card.

- **7.7 A family value of X** — Unleash the Hounds [VIS] ("+1 bleed for each ready vampire of the enslaving clan you control",
  KRCG) and Inevitability of the Void [AUS][NEC] (+1 bleed for every 10 cards in the target's ash heap) carry `bleed: 'X'`; the finders take a number only, so the mode is never played.
  Shell Game's stealth X is the same shape (not gated: the bot plays no mode of it). [the card chain's reader gate] · latent (no
  deck) · a count the reader computes from the table where the text names it, the mode skipped where it cannot.

- **7.8 Conditional pool damage read as a plain number** — Choir [MEL] ("Your prey burns 2 pool for each copy of this card you
  control (not counting this one)", KRCG) and Precision [CEL] (1 pool only if the prey discards the named card, the vampire paying 1
  blood) carry a flat `poolDmg`. [the card chain's egress review, pass 1] · latent (no deck) · a count and a condition the
  pool-damage finder reads, or the mode skipped.

- **7.9 Prices outside the family** (C1b's second pass on the cross-check's extra-cost flags) — Folderol [aus] ("This vampire burns 1
  blood to reduce a bleed against you by 1", KRCG: the reduce read free), Panacea [aus] (1 blood to unlock a younger vampire), Rayzeel's
  Song [ani] (1 blood to unlock an ally), Chiropteran Marauder [VIC] (1 blood to make this round's hand strikes aggravated: read as an
  aggravated hand strike with no price; class 2's reading too). The reduce, unlock and strike finders read no `payBlood`. [C1b's readers]
  · latent (no deck) · `payBlood` on those lines, read where the bot plays them.

## 8. Requirements, conditions and gates
A requirement or a condition the text prints and a finder does not ask (the five playability layers' second and third, HARNESS), or
a legal play the bot refuses.
- **8.1 `_entryReqOk` (clan, sect, capacity) in every finder** — 18 Nov: the reaction finders read it, the stealth,
  bleed-modifier and action finders ask none; 29 Oct named more that read the discipline only (allies, politics, the prevent,
  press, maneuver and combat-ends finders: Touch of Valeren). [w6 §8; w1] · reachable (the multi-clan Path precons; salubri holds
  Touch of Valeren ×3; the scratch audit found no clan, sect or capacity fault in the runs) · each finder asks it; a footprint
  read.
- **8.2 A card's Path icon** (`path` in vtes.json: Wall of Filth carries Path of Caine) is not read as a requirement. [w1] · latent
  (the pathcaine crypt all follows Caine).
- **8.3 `_bestBounceFor` asks no title** (a baron): it reads the mode, `anarchReq` and the blood, not `_titleOk`. [pilot] ·
  **active** (Bait and Switch, "Requires a baron" (KRCG): the tzimisce smoke's 4 plays were all by vampires that are not barons —
  Prentis Derby twice, Marialena, Whisper; brujah's 1 by Valeriya Zinovieva, a baron) · the finder asks the title.
- **8.4 A discipline line's own capacity** (Hall of Hades' Court [dom]: `_voteBoosts` plays it past its line's capacity; The
  Missing Voice [cel]); **Enkil Cog** (`_bestBleedModifierFor` reads no requirement: its capacity 10 and "after resolution of a
  successful bleed"). [w6 §8] · latent.
- **8.5 Conditions not tagged** — Faerie Wards [aus] (the directed condition with an ally-or-younger clause); Hag's Wrinkles' "Only
  usable during an equip action" (KRCG; C1b's sample: its stealth agrees, the gate is not read); the leftover +1
  intercept mode of The Mole plays at any action (Dogged Pursuit [ANI] and Speak with Spirits [SPI] were corrected in C1, v0.6.243); the condition sentences' untagged
  variants (their list: `specs/spec-card-sweep-2026-11-18.md`'s status block, "The finished decks' round"). [w6 §8; B] · latent
  (the named cards: no deck) / reachable (the list's Protected District, "… or during the polling step": nosferatu ×4).
- **8.6 The act-again point after a failed referendum** — an unblocked political action succeeded whatever its referendum did
  (R-44), but a failed one writes no `_lastAct`, so neither Freak Drive nor Shadow Cloak follows it (v0.6.234). [B; w6 §9.5] ·
  **missed** (the 240: 10 of ventrue's 47 failed referendums had Freak Drive in the caller's hand, and no act-again decision
  followed; pass 3's count) · a section through `_maybeActAgain`.
- **8.7 Who may play a mode** — Cloak the Gathering's [OBF] is played by a vampire other than the acting one (the finder's tie
  keeps [obf]); Lost in Crowds is not usable with Into Thin Air; Sport Bike is one vehicle per minion (the equip guard is one per
  name). The fidelity pass of C1b: Veil the Legions [obf] and [OBF] (played by another ready unlocked vampire of mine, one per action;
  [OBF]'s X blood for the next X actions' +1 stealth), Hedonism (the same player; the attempt fails, the blocker cannot try again, its
  [for]/[pre] combat), Touch of Valeren [FOR] (a ready vampire not in the combat), Gifts From Hereafter (another vampire; 10.24 holds
  its acting ally). [sweep §4.3: latent reds; C1b's readers] · latent (no deck reaches the contradiction) / reachable (Veil the Legions:
  ravnos; Hedonism: pathcathari; Touch of Valeren: salubri; Gifts From Hereafter: pathdeath, whose bleed the bot no longer plays).
- **8.8 Flight from a card** (Concordance [DAI], Taking the Skin: Vulture) is not read (a vampire's Flight is read from its text,
  the crypt's `flight`; Pounce needs Flight). [pilot] · latent.
- **8.9 Over-strict: `_bestStrengthFor`** refuses a Preternatural Strength-class action on any vampire with a strength bonus
  (Depravity, Saulot's Avenging Fist: "one per vampire" generalised to the key), and on one carrying a card put on a minion.
  [w4; pilot] · reachable (nosferatu holds Preternatural Strength ×2).
- **8.10 Over-strict: hosts and hunting grounds** — allies are never offered as hosts for a card on a minion; "only one hunting
  ground each turn" is per vampire in the text, one flag per Methuselah in the code. [pilot; w3] · reachable.

## 9. Key and compiler shapes
A key the compiler writes and a reader reads in another shape, or a sentence shape the compiler misreads or skips.
- **9.1 The act-again context reads `mo.fx.referendum`**, which no entry carries (political cards carry `e.ref`), so a political
  action in hand never counts as another use for the vampire (`_actAgainCtx`'s "clogged" test; the coverage scan). [B] ·
  reachable (every deck with political actions) · read the political type; a section.
- **9.2 Destilaria Estrela da Paraíba** — its intercept never plays (`intercept`, not `lockIntercept`); its hand size only for the
  resulting combat. [w6 §8] · latent.
- **9.3 The auto tier's "before range" flag on superior-only sentences** (Alpha Glint, Bloodform, Gemini's Mirror, Eyes of
  Blades, Outside the Hourglass). [w2] · latent.
- **9.4 Mode tags** — Whistling Up the Beast's [REFLEX] line shares its frenzy mode; Enrage's tag is the card's, not the mode's
  (harmless: the Grove reads a target that is mine). [w5 §12.10] · latent.
- **9.5 Shapes the compiler cannot write or read** — a rush grant of 0 (`_grantOf`); an "As above" maneuver the other way; "but for
  N environmental damage" over a strike (both synthetic-only). [pilot] · latent.
- **9.6 Saulot's Healing Touch** is FULL by the auto tier, but its rescue discount and its blood-adding action are not built (v1.9.8
  makes it an archetype only). [w4] · reachable (salubri ×1).
- **9.7 FULL by key name only** — Wrong and Crosswise and Monastery of Shadows: no play path that would play them reads their keys
  (a reaction's votes, a location's stealth with no lock), as Priority Contract's was before the pilot. [sweep §4.3: found on the
  way] · latent (no deck holds them).
- **9.8 Form of Mist [PRO]** — "Strike: combat ends. After combat ends, if this vampire was blocked, they can burn 1 blood to
  continue the action with +1 stealth as if unblocked" (KRCG): the entry reads a combat end, never the continued action (since C1,
  v0.6.243, its +1 stealth sits on `plusIf`, unread: 7.6). [sweep §4: the six misreads, row C] · **missed** (the ministry smoke: Vivian VI, blocked as the acting vampire,
  ended the combat with it in match 6 and the action stopped, pass 3's read; its four other combat-end plays in the ministry and
  tzimisce smokes not sorted by role) · the continue offered after the combat end, its blood paid.
- **9.9 Black Forest Base and Powerbase: Madrid** — the base's "Requires a ready Sabbat vampire" and its referendum to gain 2 pool
  are missing; Madrid's counters (one in my unlock phase while it has 3 or fewer, +1 vote each for a titled Sabbat vampire) are
  missing. [sweep §4: the six misreads] · reachable (pathpower ×1 each).
- **9.10 Power Structure** — "lock this card to give each Lasombra you control +1 vote" read as a flat +1. [sweep §4.3: the dry run's
  C column] · reachable (lasombra ×1; not played in the lasombra smoke).
- **9.11 The compiler's known misses** — `bloodAdd` and `bloodAddTo` on 59 card-keys. [sweep §4: row C] · reachable (C's harvest
  item).
- **9.12 A granted action's Ⓓ marks the card's mode `dir`** — the compiler reads Ⓓ per segment, so a card in play whose only Ⓓ is in
  an action it grants ("Any vampire may burn this location as a Ⓓ action": Black Forest Base, Remover, Heartrender, many masters and
  allies) carries `dir: true` on a mode that is no directed play; the political cards lost theirs with their granted stealth in C1
  (v0.6.243). Atonement and Dive into Madness [DEM] are the same reading on a card put on the acting vampire: their only Ⓓ is the
  burn action the card grants (C1's readers' side notes, read in the card chain round: `docs/reports/readers-card-chain-2026-11-27.json`).
  The fidelity pass of C1b adds Pit of Contemplation and The Gate of Acheron (their own action is an undirected +1 stealth action),
  Heartrender's empty `dir` mode, and the granted action's EFFECT read as the card's own: Black Forest Base's `poolGain` 2 (the Sabbat
  referendum it grants), Saulot's Healing Touch's `bloodAdd` 1 (the bearer's +1 stealth action). [C1's readers; C1b's] · latent (no
  reader of a card in play's `dir` found; no finder plays those two values) · read Ⓓ and the effect with the granted clause stripped,
  as GRANTED_STEALTH strips its stealth.

- **9.13 A bleed card's stealth or bleed outside the mode it plays** — since C1b (v0.6.244) the bleed finder books the header's "+1
  stealth action." (`_cardActStealth`: Cat Burglary, The Eternal Mask, Fleetness …), takes the discipline lines of a level-free bleed
  (Break the Bonds, Illegalism, Keystone Kine, The Platinum Protocol) and the pool-damage finder books its header (Choir, Clio's Kiss,
  Edge Vitiation, Precision, Harmony). Left: a level's stealth in an action of its own beside the bleed, which the bot does not take
  (unbuilt): Brutal Influence [POT], Dream World [PRE], Entrancement [PRE], Gremlins [myt], Rayzeel's Song [VAL], Smash and Grab [ani]
  and [pot], Spirit Marionette [OBE], The Ailing Spirit [OBE], Steely Tenacity [qui]. [the card chain's reader gate; C1b] · reachable
  (Entrancement: ravnos, pathcathari, ministry) / latent (the rest) · the action of its own, read in its family's round.

- **9.14 Two shapes the card chain's review saw** — Rise of the Fallen's `poolDmg: 1` reads as a pool-damage action, where the text puts
  the card in play with a trigger ("Your prey burns 1 pool after resolution of each action during which you have burned corruption
  counters", KRCG); Power of One carries `limited` on the entry, though its [pot] "+1 bleed ... does not count against the limit".
  [the card chain's egress review, pass 1] · latent (no deck) · the trigger a key of its own; `limited` on the modes that print it.

## 10. Unbuilt modes, targets and riders
A printed mode, target or rider the bots do not play on their own cards, or do not read when they meet it.
- **10.1 Faceless Night [OBF]** — "minions who attempt to block this action and fail become locked before action resolution"; the
  entry carries the stealth only. [sweep §4.3: amber] · **missed** (the 240: 90 of its 306 plays by malkavian's three vampires
  with superior Obfuscate — Colette 41, Alexander Silverson 39, Dr. Stephen Norton 10 — always at [obf]: both modes carry +1
  stealth and `_bestStealthFor` replaces a pick only for more, so the first mode wins the tie) · the mode with the rider wins a
  tie, and the lock is read (not Cloak the Gathering's [OBF], which another vampire plays: 8.7). v0.6.241 built the tie for a
  rider the bot reads (Mirror Walk [THA]'s `blockedLockEnd`); this one's lock lands at resolution, after a failed blocker's
  Deflection or Guard Dogs [ANK 20171017], on every minion that attempted and failed, across a bounce: a design of its own.
- **10.2 Burning another's card in play, and Ventrue HQ** — Wasserschloss Anif, Austria's burn-it action ("Any minion can burn this
  card as a Ⓓ action"), Haven Uncovered's host burning the card, Pentex™ Subversion's ("Other minions can burn this card as a Ⓓ
  action": its entry carries `noBlockMinion` only), Creeping Sabotage's ("Minions can burn this card as a Ⓓ action") and Revelations
  [AUS]'s ("Any minion can burn this card as a Ⓓ action"); Ventrue Headquarters locked only in my own referendums. [O-23; B; pilot; pass 3
  found Pentex's; the exactness round's egress review the last two] · **missed** (the 240: tremere's Wasserschloss banked blood in 67 matches and was never burned; nosferatu put
  Haven Uncovered on another seat's vampire 68 times, never burned by its host; tremere's Pentex was on an opponent's minion in
  63 matches, never burned; the 240's 33 card burns were all Smiling Jack) / reachable (Ventrue HQ in another seat's referendum) ·
  a burn-it key the burn finder reads (`_bestBurnCardFor` reads only `burnCardAction`).
- **10.3 Free block bars and `chosen`** — Beast Meld-class and Seduction-class have tags, no consumer. [O-21; sweep §11.10] ·
  reachable (salubri holds Seduction ×2) · built when the sweep needs them, the ledger lists them playable.
- **10.4 Wave 1's ambers** — Sculpt the Flesh [PRO] (the card on the opposing minion, its unlock-phase burn, the +1 stealth action
  to burn it); the Sword of the Archangel's cancel (a grapple or aim card for 1 blood) and its unlock; Invigorate [dom] (allies
  cannot block) and before a block on actions other than a rush; the strength+N weapon family beyond the Sword (`strBonus`). [w1]
  · reachable (tzimisce holds Sculpt the Flesh ×4 and Invigorate ×3, salubri the Sword) / latent (the strength+N family beyond the
  Sword: no deck).
- **10.5 Wave 2's ambers** — Rage of Apedemak's +1 hand size, its "Frenzy." and its Path of Caine icon; Monstrous Form's superior
  action. [w2] · reachable (pathcaine ×8, tzimisce ×4).
- **10.6 Grants from cards played outside combat** — Dread Mastiff, Form of the Bat and Monstrous Form [DOM][PRO] on the vampire,
  as wave 2 left them (the pilot built Hunter's Mark's, Fleetness's and the experiment's). [w2] · reachable (pathcaine holds Dread
  Mastiff ×2, tzimisce Monstrous Form ×4).
- **10.7 Wave 3's ambers** — Anarch Railroad and Fortune Teller Shop for another Methuselah's vampire; KRCG News Radio's paid half;
  Wall Street Night's investment action; Channel 10 after a cancelled-as-played first action; Burial Site's ally life; Powerbase:
  Montreal stolen; Creepshow Casino on a rescue, a leave-torpor or an undirected action card, and at the pilot's new announces;
  Family Gathering with a mixed crypt; Archon Investigation against Secure Haven's extra cost. [w3; pilot] · reachable (most are
  in one V5 deck each) / latent (Wall Street Night, Burial Site, Secure Haven: no deck).
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
  superior-only Fortitude rider (C's). [pilot] · reachable (banuhaqim holds Fleetness ×2, pathcaine Soulgrinder ×8) / latent
  (Shadow of the Beast, New Moon Sigil: no deck).
- **10.12 The route for a vampire already attempting to block** (a woken one, [ANK 20181122-2]), Eyes of the Wild's included.
  [w6 §8; B: the locked routes' last rungs] · reachable (gangrel holds Eyes of the Wild ×6).
- **10.13 Waits for bot diablerie** (O-15) — Depravity's stealth, Regent's move to the diablerist: bots never diablerise. [w4] ·
  latent.
- **10.14 Haven Uncovered, Priority Contract and Pentex™ Subversion lie on the placer's mat**, not on the vampire they were put on
  (since M2 / N3; Fame moved onto its vampire in v0.6.237, D-136): the effect rides the frozen line, but the table shows the card in
  the wrong place, and the placer-side readers (`_havenHosts`, `_contractLive`, `_pentexWatch`) look for it on the placer's board. A
  give with `attachTo` needs those readers moved to the host's board, and Priority Contract's own burn a `recall` (the bots handle
  none). [the playtest round, 24 Nov] · reachable (nosferatu, tremere, banuhaqim; presentation: the effect is right).
- **10.15 A vampire of mine burned in my own combat keeps the cards on it** (aggravated damage it cannot mend, a burn-at-damage
  curse: `_takenLine` sets the zone and no more): its income masters, equipment and a Fame another player gave stay on my board,
  their host burned. A burn by the table (`ctrl`), Archon Investigation and the Ravnos burn sweep them (v0.6.237's egress review:
  the table's burn by host and id too). What reads a card whose host is burned is not audited. [the playtest round's egress review]
  · reachable (any deck).
- **10.16 Options the starters' curated entries leave out** — Anarch Troublemaker's "or burn an equipment on one of their minions"
  (the entry carries the two locks only); Vessel's "you can burn a card named <Blood Doll> (if any)": any Blood Doll in play,
  another Methuselah's too [LSJ 20071012, LSJ 20090811]. [the exactness round's fidelity pass; its egress review: Vessel's state]
  · missed (Vessel; v0.6.241's 240: 366 of the 570 Vessels placed came after another seat had placed a Blood Doll in the same
  match, 156 matches; no bot burns one) / reachable (ventrue ×1: Anarch Troublemaker, against tremere's equipment) · the burn of
  an opponent's Blood Doll when Vessel is played; the equipment burn as the giver's choice when it is worth more than two locks.
- **10.18 Life in the City on another Methuselah's vampire** — "Add 1 blood to a ready vampire" names no controller (the advanced
  rules 6.1.4); the entry's `own-ready` and the handler pick only mine, and v0.6.241 holds the card while I have no ready vampire:
  no legal object in the first round, a choice where another seat has one. [the exactness round's egress review, pass 2] · latent
  (no bot gives another seat blood: no ally is modelled).
- **10.19 Granted actions** — an action a card lets a minion take later ("burn this card as a +1 stealth political action", "the
  attached vampire can enter combat … as a +1 stealth Ⓓ action", "may take a +1 stealth action") has no key of ours: since C1
  (compiler v1.12.0) its number is no longer the card's own, and the cross-check flags 152 granted actions that carry a stealth,
  intercept or bleed; Khazar's Diary (Endless Night)'s wraith from an ash heap at 7 counters is still compiled as an [NEC] mode of the
  card's own (C1b's sample). [C1; C1b] · human (the readers' rounds: a human's granted action at the table) / latent (the bots take none).
- **10.20 The blocking minion's malus** — "the blocking minion gets -1 intercept" (Forced Confessional's `icpVs` with `who:
  ['this']` is the precedent; Perfect Paragon's for allies and younger vampires) on Call of the Hungry Dead [nec], Dominant
  Personality [pot]/[pre], Form of the Bat [pro], Mole's Tunneling [ani], Random Patterns [AUS][DEM], Smoke and Mirrors [obt],
  Stygian Shroud [obl] and Suppressing Fire; with a condition or a count on Council of Seraphim (a non-Sabbat blocker), Will-o'-the-
  Wisp [chi] (X+1 points), Iara and Lambreta (a lock). [C1's readers] · missed (Dominant Personality: pathpower; Form of the Bat:
  gangrel, tzimisce; Stygian Shroud: hecata, lasombra) / latent (the rest) · `icpVs` on each mode, the window "when a minion
  attempts to block".
- **10.21 Maluses and lasting bonuses the family does not model** — a stealth malus on a bearer or a group (Banshee Ironwail, New in
  Town, Pallid on a Laibon, Vivienne Géroux, Festivo dello Estinto, Codex of the Edenic Groundskeepers' -2 on bleeds); Peacemaker's
  bleed malus on every minion this action; Bloodstone's +2 intercept against its bearer; and the lasting or later values C1 took
  off the play they were booked on (Taking the Skin: Minion, Psychic Veil, Dream World [PRE], Defender of the Haven, Sins of the
  Cauchemar [AUS], Dogged Pursuit [ANI], Marked Territory, Guard Duty, Under Siege, Shell Break, The Portrait's follow-up bleed,
  Unholy Penance [PRE], Codex's granted bleed, Strained Vitae Supply's -1 on hunts). Blithe Acceptance's bearer stealth is the first
  `bearerStat`. [C1's readers] · missed (Codex: ministry; Under Siege: pathcaine, pathcathari, pathpower) / latent (the rest).
- **10.22 Punish [COMBAT]** — the entry models the [ACTION] half (a +1 stealth action); "As [ACTION] above, but put this card on the
  opposing vampire as a hand strike" is a combat use the entry's mode does not split out. [C1's readers] · latent (no deck).

- **10.23 Family values no reader takes on a card in play, an ally or a reaction** — Blessings of the Loa's bleed (a master),
  Cãoera's (an ally: allies do not act in the bot), Charigger, The Axe's and Shaman's (a retainer's bleed and stealth for its bearer;
  `_equipIntercept` reads a retainer's intercept only), Melange [AUS]'s bleed (a reaction). [the card chain's reader gate] · latent
  (no deck) · the bearer readers take bleed and stealth beside intercept (Blithe Acceptance's `bearerStat` is the first).
- **10.24 C1's readers' side notes, read in the card chain round** (27 Nov; the verdicts, sources and fixes:
  `docs/reports/readers-card-chain-2026-11-27.json`; Atonement and Dive into Madness are 9.12's) — Enthrall's superior rider (draw
  a crypt card after a bleed of 1 or more that went through, paying 1 blood) is missing; Gifts From Hereafter is "Only usable by a
  ready unlocked vampire other than the acting wraith or zombie ally" (KRCG) and the entry carries no such gate, so the bot may play it
  on its own vampire's bleed; Khabar: Glory lacks Unique, "Not usable if any non-mandatory actions have been performed this turn", the
  4 pool when the prey is ousted and its burn in the unlock phase; Pulse of the Canaille [AUS]'s one per vampire; Brutal Influence
  [pot]'s optional +X bleed from locking Orun; Soul Painting's level-free mode is its header, not a play; Abandoning the Flesh's
  removal from the game; Draught of the Soul's "only after burning a vampire" and its blood; Shell Game unlocks a Blood Brother at
  [san] too, two at [SAN]; The Guruhi Are the Land's hunt and equip uses; Walk of Caine's blood per pick and its circle cap; Madman's
  Quill [AUS][DEM]'s +1 bleed for Dementation vampires against the Methuselah whose minion bears it; Drink the Blood of Ahriman [obt]'s `aggr` mode is a misread (the
  text names aggravated damage only in its burn trigger). [C1's readers, read by bot-card-reader] · reachable (Gifts From Hereafter:
  pathdeath) / missed (Enthrall: pathcathari) / latent (the rest) · eleven need a reader the bot has none of (the data file names
  them); Soul Painting, Drink the Blood of Ahriman and Shell Game's [san] unlock are data fixes.

- **10.26 The fidelity pass of the 13 other V5 decks' flagged cards** (C1b, D-138; the verdicts: `docs/reports/readers-c1b-2026-11-27.json`)
  — modes, riders and limits our entries leave out (KRCG's text): Black Forest Base's "Requires a ready Sabbat vampire" (pathpower);
  Break the Bonds [obf]'s lock of the target's minion and [pre]'s blood on a successful bleed (ravnos; its lines' bleed and stealth are
  read since v0.6.244); Gifts From Hereafter [DOM]/[OBL]'s unlock of the acting ally for 1 blood (pathdeath); Eagle's Sight [AUS]'s block ignoring the
  prey-predator restriction (salubri; D-123); Heart of the City's one per vampire (ministry); Heroic Might [pot]'s attach (+1 strength,
  strike: burn equipment, burned on torpor, one per vampire) and [POT]'s +2 (brujah); Hunting the Quarry's [cel]/[tha] card on the
  opposing minion and [CEL]/[THA] new round for 1 blood (pathcaine; the pilot's §3.3); Obedience's end of an acting younger vampire's
  action (pathdeath); Pack Alpha [ani]'s employ before range and [ANI]'s burn for +1 strength (ravnos); Pillars Fall's enter-combat
  action, its bleed the bearer's only after a win (pathcaine); Pit of Contemplation's and The Gate of Acheron's counters and their
  unlock-phase effects (hecata); Putrescent Sustenance's ash-heap ally for blood or life (pathdeath); Rolling with the Punches [FOR]'s
  1 blood for every strike's damage this round (hecata, salubri); Saulot's Healing Touch's rescue discount and +1 blood (salubri); Seeds
  of Terror's 1-blood toll on every block attempt and its [obf]/[pre] modes (pathcathari); Stygian Shroud [OBL]'s failed attempt for 1
  blood (hecata, lasombra; [obl]: 10.20); The Platinum Protocol [pro]'s corruption counter (ministry); The Sleeping Mind [dom]'s locked
  vampire and [DOM]'s no unlocks (lasombra); Touch of Oblivion [obl]'s strike that puts the card on with 2 counters, [OBL]'s ally burn
  read as torpor (lasombra); War of Ages' titled Sabbat requirement, referendum, the prey's unlock burn and the ouster's 3 pool
  (pathpower). [C1b's readers] · reachable (each card's deck above) · each in its class's round (combat's in C2).

## 11. Windows: who is asked, and when
Who may answer an action or a card, and in which window; a line read after its window closed.
- **11.1 Revelations [AUS] is undirected** — "[AUS] Put this card in play. Your prey plays with an open hand" carries no Ⓓ (KRCG; the
  entry's `dir: 'prey'`), but my window asks only my prey and the other bots open only the prey's: no predator is asked. [B] ·
  **active** (malkavian in the 240: 180 superior plays went through, no predator asked; 182 on v0.6.235, B) · both sides ask
  both; a section red on v0.6.236.
- **11.2 A human's directed action without a "Target:" suffix** opens the window at every seat (`_obsTarget` 0), so a bot that is
  not its target may block it. [w6 §8] · human.
- **11.3 Out-of-turn windows** — an out-of-turn master's window (Archon Investigation, Sudden Reversal on Sudden Reversal); the rest
  of the 36 `oot` cards wait for their own triggers; two bots' Sudden Reversals at one human master (no arbiter). [w5 §12.10; w3] ·
  reachable (lasombra holds Sudden Reversal ×2, ravnos Archon Investigation ×1) / human (the two Reversals at a human's master).
- **11.4 The before-range step** — Saulot's Guiding Wisdom's combat end in a combat my vampire did not start as the acting minion
  (no before-range handshake between bots). [w4] · reachable (salubri).
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
  3 Nov §4). [w1; w2] · reachable (banuhaqim holds Hunger of Marduk ×10; Quickness in banuhaqim, brujah) / human (a human's
  declaration after Damage).
- **12.2 Grants into the resulting combat** — Precognition [AUS]'s prevention and Spirit's Touch [AUS]'s maneuver, if the vampire
  blocks [LSJ 20010813]. [sweep §4.3: ambers] · **missed** (the 240: 124 of their 205 plays — Precognition 67 of 102, Spirit's
  Touch 57 of 103 — by tremere's four vampires with superior Auspex, always at [aus]: `_bestInterceptFor` replaces a pick only for
  more intercept) · the mode with the rider wins a tie; the prevention and the maneuver ride into the resulting combat.
- **12.3 Wave 1's latent combat** — Arms of Ahriman [OBL] would be offered as a plain dodge after the limit was used (the dodge is
  offered at the first strike only); Claws of the Dead checks its own blood, not a strike card's picked the same round, and is
  played at the first strike only; no prevention (the Wall included) is offered against Carrion Crows' damage. [w1] · latent
  (Arms of Ahriman, Claws of the Dead: wave 1 graded them unreachable with the decks) / reachable (Carrion Crows: nosferatu's
  against ventrue's Hidden Strength in the 240).
- **12.4 Wave 2's second review** — a weapon's strike sends a clone and a play row every time; the press step waits up to 1.5 s for
  a taken line after a clean dodge; Taste of Vitae's wait returns an earlier round's pending taken line at once (the clean-dodge
  path reads this round's only); `_xLossSum` sums nothing (a later taken line marks the pending one replaced: after an additional
  pair Taste counts the last pair). [w2] · reachable (tremere's gun; Taste of Vitae in brujah, nosferatu, pathcaine) · each fixed
  with a positive test and its footprint read.
- **12.5 A gun's maneuver binds its strike only under Immortal Grapple** (no chase deck carries a gun). [w2] · latent.
- **12.6 The weapon nullifier does not model first strike** [LSJ 20040928]. [pilot] · latent.
- **12.7 Tested or traced less** — the mirror-image race (the acting bot declares, the answering bot meets it during its press
  step's first await) is tested on the 30 ms relay only; 159p tests the human-acting question through `_xBeforeLine`, not through a
  round; the `prevent-x` row's `incoming` is the plain damage (X covers aggravated damage too); Wall of Filth is counted twice in a
  receiving bot's `cardsShown` (its fx clone and its typed line, capped at 2). [w1] · debt.

## 13. Choices around a card (Claude's priors; not rules)
Decisions on Claude's priors; each needs a design to the owner before it changes (D-87).
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
- **13.10 A host's income with no host ends the master phase** — a Blood Doll or Vessel picked with no vampire to carry it `break`s
  the master phase's loop, so a later candidate (Dreams of the Sphinx, a Location) waits a turn; Guardian Angel's own case tries
  the next. [v0.6.238's egress; v0.6.241's egress review, pass 3: the count] · missed (v0.6.241's 240: 312 picks of the two in
  round 1, before the picker has a vampire, none placed and the phase over; 120 of them with another master waiting, as The
  Barrens; v0.6.240's the same).

## 14. Hand size and replacement
The rulebook, drawing cards: "Whenever you play a card from your hand, you draw another from your library to replace it (unless
card text says otherwise). ... Whenever an effect changes your hand size ... immediately discard down to or draw up to match your
hand size." [ANK 20180318]: "Cards that are not replaced count against the hand size." 14.1–14.3 were fixed in v0.6.239 (a card
played in another seat's turn, Elder Library's +1 in the turn it enters, the discard phase's replacement); its egress review
found these.
- **14.4 A draw in flight is not in the hand count** — `_handCount` adds the replacements owed, not the draws sent whose card has
  not arrived. Two paths: (a) my discard phase draws a 'discard' hold's replacement at its start (Mirror Walk), and Dreams of the
  Sphinx's +2 expiring after it (`_revertHandSizeBonus`) before that card arrives counts the excess one short, the hand ending a
  card over; (b) a replacement 14.1 draws at the end of another seat's turn (at its "Turn passed.") can still be in flight when my
  turn starts, and at pace 0 `_playTurn` reaches Dreams' +2 lock with no wait: it draws one too many (the egress review's pass 3
  probe: 3 for 2, the hand at 10 of 9; at the turn's end the +2 expires and the hand is shed down again). [v0.6.239's egress] ·
  (a) latent (tremere and pathdeath hold Mirror Walk, neither Dreams); (b) reachable in the arena only (pace 0 on a real server;
  malkavian holds Dreams and reacts out of turn) — at the client's pace the turn start waits a beat after "Turn passed." and the
  card lands first (the 240, the hotseat, a paced table) · count the draws in flight in `_handCount`: + each draw sent, − at a
  hand `drew` and at the server's "The library is empty." `err`, reset at `dealt` (the hotseat bridge answers an empty library
  with nothing: read `libN` too).
- **14.5 A hand size lowered in play is not discarded down** — `_recomputeHandSizeBaseline` draws up when the permanent bonus rises;
  when it falls (an Elder Library burned or stolen) nothing discards down, against the rule's "immediately". [v0.6.239's egress] ·
  latent (no card the sims play burns or steals a hand size master) · discard down at the recompute, the least useful cards first.
- **14.6 A reaction's 'Do not replace until after this action'** played in another seat's turn (Read the Winds, Pack Tactics, Elder
  Intervention, Ministry) is held until that turn ends (the turn handler) and drawn then, or, when the next turn is mine, at my
  master phase's flush (owed and counted until then): the bot reads no end of another seat's action. Late, never early (v0.6.239's
  first bytes released it at the next table message, inside the action). [v0.6.239's egress] · latent (no deck the sims play holds one) · release it at the acting
  seat's next action line or its "It resolves" (the short-term action memory, `_obs`).
- **14.7 A Sudden Reversal's window is read as closed at the owner's next master or phase line** (or the turn change): no line
  says a cancel stood. A cancel that reaches the owner after its window is answered 'too late' at once, after any lines the owner
  sent before it read the cancel; if its next master or phase line was among them, the replacement is drawn first, and the
  take-back then discards a card down to the hand size (the card back in hand is one over it) where nothing should have been
  drawn — one card too many when the library was empty and the server refused that draw ("If your library is empty, then you do
  not draw to replenish your hand"), and its pick is the dead card or the front of the hand (not the revert's surplus-stealth and
  endgame steps); a 'too late' after the turn change is not read (the record ends with the turn: the card stays in the ash heap, the
  out-of-turn debt stands). [v0.6.239's egress] · latent (a round trip longer than the window: the sims and the hotseat bridge
  deliver an answer inside the send, the arena's window is 500 ms, a paced table's a beat) · an answer line from the owner to the
  cancel that stands (a bot grammar change: L12, the canary).

## Not migrated: done since, or not a problem
- *w1*: the round restrictions (the first-round strikes failing closed, three cards untagged, Riposte in round 1) — read since
  v0.6.214 (`_roundReqOk`, Riposte's check in the combat-ends finder); compiler v1.9.5 tags the three cards.
- *w2*: Soul Burn's opposing weapons — read since v0.6.236 (R-41). Sanguine Entrapment and Skin Trap compiled as their own — the
  pilot's negation strip (v0.6.236) ends the misread; Sanguine Entrapment's ban on the other side is 4.5. The grants from Hunter's
  Mark, Fleetness and the experiment — built by the pilot (D-134).
- *w2*: the Brujah crypt's +1 strength under Torn Signpost — read since v0.6.219 (`_cryptStrengthMod` in the strike pick beside
  `_pumpStr`; the brujah smoke: Valeriya Zinovieva's fist 4 under [POT], Octane's and Elen Kamjian's 3; pass 3's read).
- *w3*: Sudden Reversal held — built in wave 5b (D-122); the masters "still played blind" — built in waves 4 and 5 (D-106, D-120).
- *w5 §10*: the notes on what was built otherwise than §3 (Anarch Revolt's bill in `_w5Unlock`, Frontal Assault's bill and its
  worst case, Carver's freeing of my own hostage, The Rack's choice) — records of the build, not problems; its Tension and Piper
  notes are 13.5. *w5 §12.10*: its note on which built human paths are live with the menu's decks (a human's Sudden Reversal at a
  bot's master, a human's `cancel` of a Deep Song rush, a human's Week of Nightmares) — a status, not a rider; the missing line
  after a human's Sudden Reversal is 4.8.
- *w4*: a human's Grand Ball pair — read since v0.6.225 (D-113 (3), `_humanBallFree`). A printed regent or justicar on another
  seat's table — read since v0.6.217's egress review (`_titleInPlay`, section 162w).
- *w6 §8*: Deep Ecology's "Requires an Anarch" — every finder asks it since v0.6.236 (K2). Night Terrors' strike — built by the pilot
  (D-134), and with it the ledger's `strikeCE` reading went (its curated entry carries `ceGrant`); Hunting the Quarry — C's combat
  round (D-134; BOARD's V5 sweep line keeps it). Elder Intervention's "during a bleed action directed at you" and Speak with Spirits
  [ani]'s bleed — `onlyBleed` since v0.6.235. Momentary Delay's `press` misread — the pilot's compiler left it no mode (unread now:
  C's).
- *B*: `_wakeCard()` vampire-blind — every site the line named reads the vampire since v0.6.233 and v0.6.235 (`_wakeCardFor`); the
  blind calls left open a window (`_rushWindowOpens`, `_burnWindowOpens`) or shade the undirected block decision's `lockCost`, not a
  play.
- *sweep §4.3*: the seven reds the bot could break — fixed in v0.6.235 (D-127). *sweep §4*: of the six misreads, Priority Contract
  was read again by the pilot (D-134), and Target Vitals has had no mode since the pilot's strip (unread now: C's); the other four
  are 9.6, 9.8 and 9.9.
- BOARD's V5 sweep line keeps C's own scope: the title family, the ledger's grade column (spec §11.10), Hunting the Quarry.
