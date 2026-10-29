# RULINGS — the register (started 20 Oct 2026; numbers are never reused or renumbered)

One line each, dated, by mechanism. **R-n** = what the game says (rulebook, card text, a Johan ruling, a main reply). **D-n** = what
OUR bot does and why Johan chose it. **O-n** = waiting for Johan, with the sources consulted. An answered O line moves up as an R or D
line with its date; the O number is retired. "mem" = Johan's dated decision notes; "CL n" = the old CLAUDE.md debt n
(`history/CLAUDE-v2-2026-10-20.md`); "review" = `reviews/REVIEW-playtest-2026-10-14.md`; the round specs (spec-cards, spec-next, spec-r4) are in `history/specs/`. Older docs say shark = expert,
grinder = experienced. Where a line was superseded, the current one stands and says so.

## R — rules readings

### Bleed & bounce
- **R-1** (2026-09-16, mem) — Block step: once blocks are declined only reactions remain (reduce, bounce); a Methuselah may try other minions until "No block", then the block step is over.
- **R-2** (2026-09-18, rulebook §4 + Johan, CL 26b) — One bleed and one political action per minion per turn; never the same named action card or card-in-play action twice; Freak Drive unlocks are otherwise unlimited (Johan).
- **R-3** (2026-09-20, Johan, CL 57a) — A NEW reaction window opens whenever a bleed modifier is played, so the bounce may always come after the modifiers; experienced players pump after blocks are declined and bounce on the total.
- **R-4** (2026-09-20, rulebook, CL 56b) — A failed block attempt does not lock the vampire; it may bounce in the reopened window.
- **R-5** (2026-10-16, Deflection / Redirection / Misdirection text, v0.6.203) — A bounce's new target may attempt to block; the actor opens its block step in whatever window the bounce lands.
- **R-6** (2026-10-16, review F15) — A reduced bleed stays reduced on both sides; a bleed at 0 is unsuccessful: no Edge, no pool.
- **R-7** (2026-10-16, KRCG text, review F1) — The right to block follows the played MODE: a directed action only by its target (the client's `Target:` suffix, else the actor's prey); undirected by prey and predator; a non-target seat is silent.
- **R-8** (2026-10-19, card text, spec-cards §3) — Spying Mission [OBF]: only on a bleed that would succeed; the bleed burns no pool and is unsuccessful; the card goes on the vampire, +2 the next time it would successfully bleed the SAME Methuselah.

### Stealth, intercept & block
- **R-9** (2026-09-18, rulebook + Johan, CL 26b) — Rescuing my OWN vampire: +1 stealth, undirected; another's: 0 stealth, directed; the 2 blood may be split freely between rescuer and rescued (Johan). (The bot's own rescue keeps ≥ 1 on the rescuer: Claude's policy, CL 24f.)
- **R-10** (2026-09-18, rulebook + Johan, CL 25c/26b) — Leave torpor blocked: the action fails, no combat, no cost; a VAMPIRE blocker may diablerise, an ally cannot.
- **R-11** (2026-09-20, vtes.json, CL 44a/45b) — Second Tradition: Domain has a second mode (a LOCKED prince or justicar burns 1 blood to unlock and block at +2 intercept) and REQUIRES a title; an untitled play is illegal.
- **R-12** (2026-09-24, Johan "base rules", block gate) — Stealth and intercept are spent only when needed, bot-vs-bot too: stealth only after a block attempt and only while intercept ≥ stealth; intercept only while stealth > intercept.
- **R-13** (2026-09-24, Johan, mem) — Superior Govern the Unaligned announced at stealth 1 is right.
- **R-14** (2026-09-25, rulebook "Action cards" + sweep pilot) — Directed actions carry 0 stealth; the undirected +1 applies to BASIC actions only (hunt, equip, employ, recruit, political, rescue own, leave torpor); an action card is at 0 unless it prints stealth, and "+N stealth action" is the total (`actStealth`).
- **R-15** (2026-09-25, vtes-rulings, mem) — Bowl of Convergence [AUS] is a PAID +1 intercept; a minion committed to a gun's strike by its maneuver gets no strike under Immortal Grapple.
- **R-16** (2026-09-22, CL 71) — Intercept is per minion: a human's intercept typed while another minion's attempt is live books onto the CURRENT attempt.
- **R-38** (2026-10-17, rulebook + Johan via main) — Stealth and intercept can go below 0 (a bare Christine Boscacci blocks at −1); the table keeps the sign from srv-2.6.48 / client v2.6.164 (block mode only; votes and damage stop at 0). `L12.block` already reads `-?\d+`; when main's reply is consumed, check every reader of `tally.a` / `tally.b` that assumed ≥ 0 [`client/docs/handoffs/REPLY-to-bot-2026-10-17-v0.6.207.md`].

### Combat
- **R-17** (2026-09-18, rulebook "Detailed Turn Sequence" + Johan's re-ruling, CL 26c/27b) — An action's cost (pool and blood) is paid only when the action SUCCEEDS (the Dowager example); humans park the blood; the bot parks at announce and returns it on a block, and must keep enough blood to pay at the end, which limits the modifiers it may play. Supersedes "paid at announce" (CL 1).
- **R-18** (2026-09-18, Johan, CL 28f) — An Edge burned as a cost (Inside Dirt) is NOT returned when the action is blocked.
- **R-19** (2026-09-18, rulebook, CL 24a/26b) — Aggravated damage on a ready vampire: the first point sends it to torpor, every further point burns 1 blood or the vampire when it has none (Daring the Dawn [for] at 0 blood burns it).
- **R-20** (2026-09-18, Johan, CL 22a) — Strike: combat ends vs Carrion Crows: combat ends first, no environmental damage.
- **R-21** (2026-09-22, Johan, mem) — Stolen blood is NOT damage; the statistics class it separately (`stole` / `stolenFromMe`).
- **R-22** (2026-09-22, v0.6.157) — A hand strike at long range deals 0; a silent opponent at long is assumed to deal 0 unless its board shows a ranged option.
- **R-23** (2026-10-10, rulebook, v0.6.196) — A steal takes at most what the victim's vampire holds and resolves at its RULES moment (after my strike), so my dodge or combat ends stops it.
- **R-24** (2026-10-14, KRCG "hand strike at +N damage", review F18) — Roundhouse is strength + 2 ([POT] +3), a bonus (`handBonus`), not an absolute 2; 35 library cards share the phrasing.
- **R-25** (2026-10-14, vekn rulings, review F19) — Stolen blood arrives before damage is mended; blood over capacity drains at once; the line says what drained.
- **R-26** (2026-10-16, [ANK 20200123] [LSJ 20041027]) — Two Theft of Vitae in one round resolve simultaneously: the net of gain and loss.
- **R-27** (2026-10-16, KRCG, review F16) — Immortal Grapple [pot]: non-hand strikes are barred for EITHER combatant this round; the restriction dies with the round.
- **R-28** (2026-10-16, rulebook 6.4.3 + Johan, v0.6.203) — The acting minion declares its strike first; between bots the answering bot peeks at it before choosing.
- **R-29** (2026-10-16, Deep Song text) — The rushed vampire is the acting minion in that combat: it speaks first in the handshake and the human phase walk.
- **R-30** (2026-10-16, card rulings, v0.6.203) — A borne Murder of Crows and a played Carrion Crows both land every round.
- **R-39** (2026-10-29, rulebook, card texts, rulings, v0.6.213) — V5 wave 1's combat readings, sources in `specs/spec-v5-wave1-2026-10-29.md` §1: additional strikes follow the completed first pair, the acting minion deciding first and the impulse returning; one limited source per minion a round (Quickness [CEL] outside it, one Quickness a round); a combatant no longer ready ends the combat. Kevlar Vest and Guardian Angel prevent aggravated damage too; Claws of the Dead covers the round's additional hand strikes; Invigorate's combat effects last the blocked action; Wall of Filth is prevention, not a strike.

### Politics & referendums
- **R-31** (2026-09-15, rulebook + the client's menu, journal R3) — Locked titled minions still vote; minions in torpor do not; title votes come from the crypt data (`title` / `votes`), never a title table.

### Influence, pool & economy
- **R-32** (2026-09-18, Johan) — Underbridge Stray costs 1 BLOOD.
- **R-33** (2026-09-19, card text, CL 33d) — Blood Doll's drain is a MAY.
- **R-34** (2026-10-19, rulebook, v0.6.210) — A Methuselah at 0 pool is ousted at once; 0 pool on my own turn ousts me immediately and stops my turn. (That a pool cost never takes the last pool is the bot's policy: D-97, Claude's.)

### Masters & cards
- **R-35** (2026-10-14, KRCG, review F23) — Haven Uncovered: put on a ready vampire, minions may rush it as a +1 stealth directed action; The Labyrinth locks for +1 stealth to a Nosferatu; Guardian Angel: +1 intercept vs bleeds directed at you, prevents 1 each combat; Wasserschloss Anif is a blood bank.
- **R-36** (2026-10-19, vtes.json, spec-cards §1) — The printed name is *Pentex™ Subversion*; "(TM)" is a variant; a curated entry resolves under both.
- **R-37** (2026-10-16, Revelations text, review F21) — Revelations arms whenever the actor's prey is the bot, whatever the Target suffix; a bare `plays Revelations.` is [aus].
- **R-40** (2026-10-29, KRCG text + rulings, v0.6.213) — Villein: 2–5 blood to my pool, +1 pool for each Villein already on the vampire, payable from the pool when played [ANK 20210714] and paid as the pool comes [LSJ 20020620]; less blood at resolution = what is there. Rutor's Hand's aggravated damage is its own price ([THA]: 3 blood buys immunity); its unlock is locking the card. The Sword of the Archangel is Salubri only, Sculpt the Flesh needs a Tzimisce, Invigorate an Anarch [spec-v5-wave1 §1].

## D — design decisions

What the bot does and why Johan chose it. Where a line also records a threshold or a design Claude built under a round Johan
approved, the line says which part is whose ("Johan: … · built (Claude): …"); a line marked "Claude's fix" is not a ruling of his.

### Bleed & bounce
- **D-1** (2026-09-15, Johan, journal R2) — "Will this action cause me to lose pool?" is answered per current action (cleared at It resolves or the next action); unanswered = the wait's clock (tempo kind `pq`; askSecs only with no botcfg), default NOT blocking.
- **D-2** (2026-09-20, Johan's defence doctrine, CL 56a) — Against a stealth bleeder the defender CLOGS: no attempt on its 1-bleeds (the stealth stays stuck in its hand) while the pool can afford the pump seen; a front-heavy bleed (a Govern) gets an attempt so it must spend stealth, better still with a bounce after; clogging is a gamble one eventually cannot afford. (The pool test — pool > the critical level + the biggest pump seen — is Claude's, CL 56d.)
- **D-3** (2026-09-20, Johan, CL 57a, v0.6.144) — Wake + block / bounce only on bleeds that END at 2+ after the modifiers; the bounce is played on the TOTAL, never at the announce (bouncing a 1 at once is a beginner's mistake); a bounced bleed is very rarely pumped. In the bot a TOTAL of 1 is still bounced at the pool's edge (v0.6.144) and when a spare bounce stays in hand (Claude's synthesis, v0.6.145; made dynamic on Johan's 21 Sep decision, D-5; its parameters unruled, O-1).
- **D-4** (2026-09-20, Johan, CL 57a–c, v0.6.144) — The bleed total is asked before the bleed resolves. As TARGET of a human actor the bot says "Any bleed modifiers?" and bounces on the total after a 4 s grace (`modGraceMs`; live under `lateBounce`). As ACTOR it should open the total window to a HUMAN target too (Johan: "it decides a lot; it is how humans play each other") — built behind `askHumansTotal`, OFF until the suite's human harness learns the second question (O-2). Quick phrases in a reactions-only ask: No = no reaction, Yes = wait (live).
- **D-5** (2026-09-21, Johan, CL 62) — The bounce track first, with a DYNAMIC spare-bounce reserve (`_bounceReserve`, v0.6.146); Nosferatu waits.
- **D-6** (2026-09-21, Johan, CL 64b) — Splitting the pump over two actions is good above all when a bounce is expected (less lost to the bounce, at the cost of stealth on two actions and of the full Govern + Conditioning stack): a comparison of ODDS about my deck and the opponent's. Not built. (Making it the knowledge layer's / abstract model's first consumer is Claude's plan — CL 64e, spec-cleanup §6.1 — not a Johan ruling.)
- **D-7** (2026-10-16, Johan, review decisions 10–11) — A human's reduction is read from the client's `NAME reduces the bleed by N.` Reduce row (Johan's interim, client v2.6.159+; curated reduce cards later). Setting the target is player education, not forced by the flow: with no Target suffix a directed action counts as aimed at the actor's prey (R-7); the guide says to set it first.

### Stealth, intercept & block
- **D-8** (2026-09-11, Johan, mem) — Bots block undirected actions; the hard part is prioritising which (block doctrine B1–B3, `specs/elysium-bot-block-doctrine.md`).
- **D-9** (2026-09-17, Johan, table-model rule) — Bare-block defaults novice off / experienced chump / expert any; desperation overrides; thresholds come from a per-minion pool-damage forecast and a combat EV, never constants.
- **D-10** (2026-09-18, Johan, CL 13b) — Hold at most 3 stealth cards, preferably different ones (`_stealthGlutIndex`, cap 3, 4 when the prey blocks ≥ 40 %); a wake in hand counts as a body at home. (The 4th card when my prey blocks ≥ 40 % of my bleeds is Claude's extension.)
- **D-11** (2026-09-20, Johan's stealth-bleed doctrine, CL 51a, v0.6.143) — Every deck, aggressive ones above all, must gamble: 2 stealth = decent, 3 + a pump = really good, 1 = a gamble, a replacement draw is always a chance; contest a block by the stealth STACK in hand against the intercept the blocker can plausibly add; drain the defender's wakes and intercept until two bleeds TOTALLING ~12 land; all nuanced by the opponent's statistics.
- **D-12** (2026-09-20, Johan's probe rule, CL 54c) — A bleed of 1 is RESERVED for making the best conditions for a stronger action when I hold NO stealth (perhaps 1 when worried); a Govern without stealth while the prey has a body up is held, played at superior, or preceded by a chump bleed from ANOTHER vampire (a chump bleeder preferably with a combat ends / dodge / maneuver in hand).
- **D-13** (2026-09-20, Johan, CL 54b) — Playing ONE intercept or stealth card when more are held and needed is a bug: the SECOND LOOK stacks on both sides.
- **D-14** (2026-09-22, Johan, CL 71, v0.6.152) — With stealth > intercept on the counter the actor plays no stealth and says `currently has N stealth`; while contested a bare `N` in chat = the blocker's total intercept, `+N` = added.
- **D-15** (2026-09-25, Johan's question, Claude's design, v0.6.173) — Stealth by chat while a bot blocks a human: the actor's typed `N` / `+N` books their stealth; the client's free counter is not read.
- **D-16** (2026-09-28, Johan, v0.6.197) — The block doctrine ("do not block Nosferatu / Tremere unless you must") and Malkavian's wave read `oppCombat` and became CALIBRATION (`blockCost`, `waveNarrow`, default 1 after their benches).
- **D-17** (2026-10-16, Johan, spec-next §2, v0.6.207) — Probe then punch: `probeHold` 2 — the probers keep off the heavy card only when my actors OUT-NUMBER my prey's unlocked bodies (+0.80 pool per probe turn in the lab); `probeHold=0` is the rollback (the probe order without the reservation, as v0.6.143–206 played).
- **D-95** (2026-09-18, Johan) — Opponents' actions are classed offensive / economy / utility in the per-minion statistics (`_actionClass`); the hit rate divides blocked by offensive only.

### Combat
- **D-18** (2026-09-18, Johan, CL 22c) — "Freak Drive always" and "Majesty always" (provisional, by persona): SUPERSEDED by D-48 (19 Sep) and D-29 (10 Oct).
- **D-19** (2026-09-19, Johan, CL 31) — Three layers: statistics (every bot) → general handling (every deck of the kind) → deck persona; a change goes in the lowest layer it belongs to.
- **D-20** (2026-09-19, Johan, CL 30c) — An enemy rescue needs a Fame on the vampire (not necessarily mine) and is done only on my PREY's vampires; anything else is table-talk meta.
- **D-21** (2026-09-19, Johan, CL 29d) — A "rush deck" is a combat deck that starts fights (Bum's Rush); sewer is NOT one.
- **D-22** (2026-09-20, Johan, CL 45c) — Hidden Strength pays X to prevent ALL incoming damage (keep 1 blood): aggravated first, but denying Pulled Fangs-class effects too; X covers the whole hit, aggravated included (v0.6.213).
- **D-23** (2026-09-21, Johan, CL 61) — Taste of Vitae is blood economy: pair it with a big damage round (Crows and / or Roundhouse), never after a bare-hands round.
- **D-24** (2026-09-22, Johan's per-deck combat rulings, v0.6.156) — NOSFERATU: Immortal Grapple only behind Roundhouse, Crows or a permanent strength bonus, too valuable to discard or de-clog with (hold it until optimal); press when Crows are out, Roundhouse in hand, or a hand strike torpors without torporing me; rush only with real damage in hand, else Deep Song bleeds. TREMERE: Apportation mostly as a maneuver to long for Theft's ranged strike, as a press with more Thefts in hand or the .44 Magnum equipped; a 0-blood opponent is always worth a press + strike. MALKAVIAN: other +1 stealth before Swallowed by the Night so it stays for the defensive maneuver. VENTRUE: presses mostly to END, on only for a torpor against a low-blood opponent that is neither a combat clan nor showing combat cards. General: long with ranged strikes, close for melee, press when dealing 2+ per round or for a torpor.
- **D-25** (2026-09-22, Johan, v0.6.158) — A torpor-certain rush trumps permanents-first when it is likely to go through ("combat is about seizing the moment").
- **D-26** (2026-09-22, Johan's design, v0.6.165) — Against a human the bot DRIVES the seven combat steps on lines, waiting on the clock; the maneuver chain starts at close and follows the deck posture (chase / snipe / wave).
- **D-27** (2026-09-23, Johan via main, v0.6.167) — The human Combat menu logs EFFECTS only; the bot parses effect lines (combat ends, dodge, aggravated, wounded).
- **D-28** (2026-09-23, Johan) — The block doctrine and a dynamic Tremere Apportation choice waited for the knowledge layer: both built (D-16; `twdKnow`, v0.6.187+), as is the Stray press against a wave to long (v0.6.161).
- **D-29** (2026-10-10, Johan, v0.6.196) — Combat ends is decided on the KNOWN strike when the opponent declared first, else the TWDA-informed expected strike (`combatEndStats` 1).
- **D-30** (2026-10-16, Johan 21:20 / 21:27, spec-r4 §1, v0.6.205) — The dodge: with one dodge, a known strike of 2+ that does more than mine; with two, also one of 1+ that does at least as much (Johan: "Roundhouse first"); aggravated and survival dodges as before; EXCEPT when my strike finishes their vampire without finishing mine: with two dodges at 0 blood or torpor (Johan), with one at torpor only (Claude's recommendation, taken by Johan "for now", a meta-layer note). A dodge their crows make useless is kept (Claude, `known-wasted`). When I strike first, dodge an expected 2+; a deck that never hits for 2+ may be dodged at 1 later (knowledge layer).
- **D-31** (2026-10-16, Johan decisions 2 and 7, review) — Bot-vs-bot combat is paced step by step when a human is seated; a Hold on stops the bots' own combat moves too, not only the clocks.
- **D-32** (2026-10-16, Johan, journal R3) — Smiling Jack is paid from pool and blood across vampires, never the last pool while blood can pay.
- **D-99** (2026-10-29, Claude's design and thresholds under D-98, v0.6.213 — not Johan's) — V5 wave 1 (`specs/spec-v5-wave1-2026-10-29.md` §2–§4): additional strikes on main's `gets an additional strike.` + one new bot line, a round with no source byte for byte the old one; an aggravated strike outranks a plain one against a vampire, never an ally.

### Politics & referendums
- **D-33** (2026-09-15, Johan, journal R3) — Against-only voting: SUPERSEDED 18 Sep by D-34 / D-36. Still standing: the pool-question ask ladder is the political-threat source until a real politics system exists.
- **D-34** (2026-09-18, Johan, CL 18) — Politics is built SIMPLE first: curation + gate → a caller with a machine-readable terms line (`Referendum terms: A −3, B −1`) → a simple voter → act-again → a 4-starter null at decision level.
- **D-35** (2026-09-18, Johan) — Bot-called referendums: humans signal votes on the tally or the Votes menu and may push Resolve; the bot then announces the outcome.
- **D-36** (2026-09-18, Johan "fix 1–3, document the rest", CL 20) — Votes build on the live tally in ring order; terms live as long as the action; the voter is SYMMETRIC: against a referendum that benefits my prey more than me (supersedes abstain).
- **D-37** (2026-09-18, Johan, CL 25a/26f) — Daring the Dawn only when MITIGABLE or clearly worth it (a way out of torpor, a rescuer, dominant votes, or the action ousts); a mitigable play also needs bleed potential ≥ 3 and a prey body up (Claude's addition, approved by Johan 18 Sep: "is fine"). For Ventrue also on a referendum dealing 3 to the prey (KRC, better Parity Shift) when the prey's average intercept is ~1 with a body up, or when the play very likely ousts that turn. No dead cards in the bots.
- **D-38** (2026-09-18, Johan, CL 24h/26g) — Alexa discards a [dom] card only as a last resort to get a referendum THROUGH; a bot may diablerise only with a majority of the FIXED votes, Edge included (not built). (Troublemaker locks the biggest capacities first — Claude's stand-in for "best blocker", approved by Johan 18 Sep: "is fine".)
- **D-39** (2026-09-18, Johan's view; Claude's rule, CL 28a, v0.6.131) — Johan: Parity Shift (burns 3, gives 3) and a KRC that brings the prey into oust range can be worth more than building, given the upper hand in votes. Built: build-first yields at pass ≥ 0.8 (Claude's proxy for that upper hand) when the referendum is economy or reach (`polOverBuild`); the own rescue (99.5) still outranks it (Claude's judgment).
- **D-40** (2026-10-11, Johan, v0.6.197) — The bot SPEAKS its own referendum's pool swing in the voters' words; the line is the ledger record.
- **D-41** (2026-10-16, Johan decision 4, review) — EVERY bot keeps asking its own pool question at a political action (its answer is its stake and decides its vote); at a DIRECTED action only the target asks.
- **D-42** (2026-10-19, Claude's fix found by the sim, v0.6.209 — not a Johan ruling) — Never call a referendum whose passing ousts me; a KRC-class overflow is never put on the caller.

### Influence, pool & economy
- **D-43** (2026-09-18, Johan, CL 13c) — Follow the help sheets' opening (biggest superior-discipline vampire first) in the playbook but MEASURE it: tempo vs transfers is the planner's job, not a rule.
- **D-44** (2026-09-19, Johan, CL 33c) — KEEP `permFirst` (Nosferatu plays a permanent before a bleed).
- **D-45** (2026-09-19, Johan, CL 34) — The Blood Doll drain is a judgment (`income-drain`). Johan: worth it near an oust, or when the host may as well hunt. Built (Claude): otherwise only blood beyond the hand's reserve, never the last blood outside survival.
- **D-46** (2026-09-19, Johan, CL 36a/37a) — The critical pool is DYNAMIC: the predator's statistics (offensive rate, average and MAX pool damage, its stealth vs what I can muster) against my defensive options; the floor may differ per deck; measure both (`critRisk`, 0 = the fixed floor).
- **D-47** (2026-09-19, Johan, CL 30c/36e) — The home quota follows the hand plus statistics; a wake in hand frees a body to build; for Nosferatu a 1-bleed is barely worth a lost block, yet the prey's pool must come down — a weight, never a ban.
- **D-48** (2026-09-19, Johan, CL 28c) — Freak Drive with no legal action left is NOT a bug; weigh (1) saving it for a lunge turn > (2) the unlocked body (bounce / Second Tradition in hand × the predator's offence; wake + Freak Drive = two blocks) > (3) de-clogging; at the critical pool with an uncovered hit it is a survival play (v0.6.141).
- **D-49** (2026-09-20, Johan, CL 39a/40c) — Home pricing must be no regression against the ORIGINAL (knob, balanced design); the racing exemption is re-evaluated only if racing decks go out through too aggressive influencing (J1 held: the influence floor stays).
- **D-50** (2026-09-20, Johan's racing rule, CL 41a) — A racing deck seldom leaves a body up other than with a BOUNCE in hand, no wake, against a predator averaging 2+ pool damage, when the vampire itself managed only a bleed of 1–2; after a 1-bleed the weight to block can be larger, by the predator's statistics (built as `_raceHome`, one body at most).
- **D-51** (2026-09-27, Johan's "don't oust yourself" item; Claude's design, v0.6.189–193) — Recurring losses over the last turn cycle (Creeping Sabotage, Smiling Jack, Fame) are added to the critical pool (`dynFloor` 1).
- **D-52** (2026-10-19, Johan 22:36 + Claude's build, spec-cards §5, v0.6.211) — Johan: equipment weighs more than a 1-bleed without modifiers; Govern is usually better than Kevlar; the Magnum is fine except late when the pool is low; Kevlar belongs to the knowledge layer. Built (Claude's thresholds): a weapon or armour beats a BARE plain 1-bleed (no crypt bonus, no pump in hand), never a bleed card, not with the prey within reach (the lunge rule), and a pool-cost item at ≤ 6 pool keeps the flat price (`equipOverPlain` 1).
- **D-97** (2026-10-19, Claude's fix found by the sim, v0.6.210 — not a Johan ruling) — The master, equip and fetch finders never spend the last pool (R-34); nor Chantry's rescue (v0.6.212). The 29 Oct inventory (CHANGELOG v0.6.212): every other own pool payment already left 1; Jack's tick, Fame and pool damage are losses, not choices.

### Masters & cards (cardfx)
- **D-53** (2026-09-16, Johan) — Claude compiles cardfx; `vtes.json` comes from KRCG or `dtagent2000/VTES-Elysium-data` (D-91).
- **D-54** (2026-09-18, Johan's cardfx rule, CL 18) — Tag the least common denominator and build in SWEEPS, not card by card (pool-damage, pool-gain / economy as tags with amounts as fields); the first curation goal is the V5 releases.
- **D-55** (2026-09-22, Johan) — Rush recognition is a cardfx rush TAG the bot reads when an opponent plays it; interim: Target on a bot's vampire + `rush` in chat (v0.6.155).
- **D-56** (2026-09-25, Johan) — vtes-skill and vtes-rulings (MIT) are sources for the sweep and the knowledge layer; card text from KRCG; VTES-Player is ideas only, no code reuse.
- **D-57** (2026-09-25, Johan's build order) — vtes-skill read → the cardfx sweep with inferior / superior → the event log → the mirror bench with controls → the knowledge layer in small measured questions → the meta layer. (Executed; then D-83 / D-84.)
- **D-58** (2026-10-16, Johan decision 5, review F23) — Haven Uncovered only when a rusher of mine would rush through it THIS turn, on an OPPONENT's vampire (the look-ahead rule).
- **D-59** (2026-10-16, Johan's Theft of Vitae case; Claude's R1 fix, review F22) — A card is dead only when no vampire of mine — ready, torpor, uncontrolled, else the deck's crypt — can use it; a turn-1 discard of a key card is a bug.
- **D-60** (2026-10-19, Johan, spec-cards §5) — Spying Mission option B: cancel a bounced bleed of 2+ about to land on a non-prey and bank the +2 ("that is why you have the card"; `spyCancelMin` 2); as stealth it goes last at equal stealth (a combat dual card is kept over it — O-8).

### Timing, holds, tempo & chat
- **D-61** (2026-08-08, Johan, journal index v0.6.95) — "Hold on…" pauses the bots: the table hold, human-exclusive, gated in `_pace`; the next act waits out the latest chat bubble (v0.6.100).
- **D-62** (2026-09-12, Johan) — Alpha requires a Structured table with helpers on for bot games; the lobby locks boardMode and helperPolicy while a bot sits.
- **D-63** (2026-09-16, Johan, helper-gate decision, v0.6.113) — Game logic NEVER reads helper state; the structured narration is unconditional; the wire-policy alternative is documented.
- **D-64** (2026-09-16, Johan's communication rules, v0.6.114/117) — Three tiers (note / chat / say); no note for what the play line, the fx clone or the ledger already shows; influence lines are log; an influenced vampire stays secret until it enters play; a few human-like bubbles per phase (the influence sentence) are meant for later text-to-speech.
- **D-65** (2026-09-22, Johan, v0.6.152) — Artistic pauses between ALL table events (1.5 s accepted), measured from the last visible event, mine or anybody's.
- **D-66** (2026-09-27, Johan's tempo design, spec-bot-tempo) — One tempo per table (Standard / Adaptive / Turn-based), changeable mid-game; bot-vs-bot untouched.
- **D-67** (2026-10-12, Johan with main, v0.6.198) — A Hold on stops EVERY clock that waits on a human and each restarts from the beginning (Johan with main); a vote, Yes or No is an answer, never a release (Claude's v0.6.198 behaviour, pinned in 96e).
- **D-68** (2026-10-16, Johan decisions 3, 8, 9, review) — Adaptive's skip stays in Adaptive; debug is for humans only: the open hand goes to the whole table and the other bots LOOK AWAY (except through their own Revelations); refused at a Tournament table.
- **D-69** (2026-10-16, review R3 — Claude's fixes F2/F3/F4/F10/F11, approved by Johan's "Kör på!", v0.6.204) — A wait's clock starts when its question is on the WIRE; hold and resume lines go first; a bot blocking a human waits for the verdict on the tempo; one spokesbot for table remarks. The pool question stays per bot (Johan, D-41).
- **D-70** (2026-10-17, Johan, spec-next §3, v0.6.207) — The chat beat separates two CHAT bubbles only; everything else rides the 200 ms cascade.
- **D-71** (2026-10-19, Johan, v0.6.209) — Series and benches run on the sim table first, over EVERY seating: seating shapes the tactical choices.
- **D-94** (2026-09-23, Johan) — Structured + all helpers first, but a Classic table with no helpers must stay possible: lines are the contract, fields the accelerator (127m guards it); the helper-off test waits until Structured works; main releases the bot helper lock once a bot proves a whole combat on lines alone (BOARD "Ask main once" (d)).
- **D-96** (2026-10-16, Johan, review decision 7) — No tempo lever for a watched bot-vs-bot combat until players ask for one; the step-by-step pacing of D-31 stands.

### Personas & table
- **D-72** (2026-09-17, Johan) — Arena series seat RANDOMLY by default (`--seed` repeats, `--fixed-seats` for the rotation); series run with EXPERT in every seat.
- **D-73** (2026-09-18, Johan, persona spec) — Personas are a FINAL FILTER after the decision basis: novice makes characteristic wrong decisions, expert is the reference; no search — keep the bot explainable.
- **D-74** (2026-09-18, Johan's model, mem 18 Sep; the persona spec) — Four knowledge layers (own deck / cards and archetypes / meta / experience), authority 3 > 1 > 2; the planning horizon is part of the persona; bluffing is a persona development point.
- **D-75** (2026-09-19, Johan, CL 33f) — Nosferatu's goal is "plays it right", not a win rate; hacking and sewer outclassing the starters is expected; Ventrue winning the null is a receipt that the deck works.
- **D-76** (2026-09-20, THE GOAL, CL 43a) — A COMPETENT THREAT that fills a seat: play the cards correctly with good priorities, judged by a well-founded feel; no mass runs needed when the observations are trusted; deck pictures: Malkavian stealth bleed, Ventrue toolbox grinder, Tremere bleed / combat hybrid, Nosferatu dangerous once in a fight.
- **D-77** (2026-09-21, Johan, CL 64a) — Malkavian is the strongest starter: do NOT hold it back.
- **D-78** (2026-09-21, Johan's knowledge concept, CL 64–65) — TWD + the starters are the base for assumptions; keys: clan + crypt GROUP window + the crypt's discipline signature; the layer needs a card's CLASS, not a playable fx; public evidence only (`specs/spec-knowledge-layer.md`).
- **D-79** (2026-09-21, Johan, v0.6.149) — Personas renamed novice / experienced / expert (simulated experience); EXPERT is the default for client-spawned bots.
- **D-80** (2026-09-21, Johan) — Bots behave the same online and offline / hotseat; a mistakenly ousted bot (no un-oust) is an edge case taken only if feedback asks.
- **D-81** (2026-09-27, Johan, bench gate) — A strength claim needs the 48-match mirror bench vs the negative control (Johan). Claude's rules beside it: a knowledge knob ships at 0; prove a knob fires before reading its arm. The bench moves to the sim (D-71, BOARD C3).
- **D-82** (2026-09-28, Johan "don't jump to conclusions", v0.6.192) — Archetype labels only after an offline accuracy test; a CONFIDENT label (margin ≥ 2, coverage ≥ 0.85) may be said once and inform a decision only where the shares cannot; a CLOSEST read never drives a decision.
- **D-83** (2026-10-19/20, Johan) — The four checks: an ABSTRACT TABLE MODEL first, the sim / arena as the control, a bots-only browser table, then humans; zero-vtes only as a development-time check on card readings; keep our niche (bots that also work OFFLINE in the client) and refactor dead weight out.
- **D-84** (2026-10-19, Johan) — The immediate goal: make the V5 preconstructed decks playable, evaluated against the rules, as was done for the starters.
- **D-98** (2026-10-29, Johan; answers O-22) — The V5 waves go by EFFECT CLASS, as `CARDS.md`'s class map ranks them, not one deck at a time (Claude's recommendation, taken by Johan). Wave 1 = Villein, the extra strikes (Quickness, Pursuit, Arms of Ahriman) and the aggravated strikes (Claws of the Dead, Sculpt the Flesh, Wall of Filth and the rest of the class map's `aggr` row). A deck joins the client's menu when its rows are playable and it holds up in the sim.

### Process & ways of working
- **D-85** (2026-09-09, Johan) — Sister projects: the bot owns the bot, arena, cardfx and its docs; main consumes bot RELEASES; the bot never edits client / server files.
- **D-86** (2026-09-17, Johan) — The table model uses public information only; no per-player files between matches.
- **D-87** (2026-09-18, Johan) — "How should we do X" → analyse, propose, wait for "kör"; end every round with "anything I'm unsure about".
- **D-88** (2026-09-18, Johan) — Opt-in feedback from human-vs-bot games (a match log, a survey) — `specs/elysium-bot-feedback-loop-spec.md`.
- **D-89** (2026-09-19, Johan, CL 33a) — The BALANCED design for deck-level claims: SUPERSEDED 19 Oct by D-71; `design-balanced-serie-bal1.txt` stays for the bench port (BOARD C3).
- **D-90** (2026-09-22, Johan, v0.6.154) — A text-only change needs no full sweep: `node --check` + the grammar test (today the canary — Claude's reading).
- **D-91** (2026-10-12, Johan) — Git monorepo; branch + PR per change; Johan merges and deletes branches; third-party data in the private repo `dtagent2000/VTES-Elysium-data`; KRCG v5 deferred until v3 is dropped.
- **D-92** (2026-10-16, Johan) — Combining rule: a fix found during a round may ride in it when it fits, said so in the PR; review rounds R1 → R4; we run the play-test rig ourselves.
- **D-93** (2026-08-04, Johan) — The evaluation doctrine: every shipped tactical change gets its OUTCOME evaluated in the next report against its registered prediction (change · prediction · observed · verdict: keep / tune / revert), so the sum of changes is judged, not just shipped [CL lines 96–100].
- **D-101** (2026-10-29, Johan) — A page budget serves the docs: when a standing page needs room, the ceiling is raised ("we should not lock ourselves to something that does not work optimally"). Built (Claude): RULINGS 42 → 60 KB, BOARD 15 → 18 KB, the standing pages 140 → 160 KB (`tools/doc-budget.sh`; the bootstrap's 50 KB stays); cutting history first (HARNESS) stands.

## Open — waiting for Johan, or a known gap tagged as such (sources consulted in brackets)

A retired line keeps its number as a one-line stub so references stay valid.

### Bleed & bounce
- **O-1** (2026-09-21) — The dynamic bounce reserve's parameters are Claude's unmeasured judgment (40 % / 25 % pump lines, "within 4 of critical", the 10 % library line, cap 3), and its pump rule never fired in bal8: keep, tune or drop? [CL 62b, 63a; D-5].
- **O-2** (2026-09-20) — `askHumansTotal` is OFF though Johan wants it on: the suite's human harness must learn the second question [CL 57c; D-4]. (gap, not a question — BOARD C5)
- **O-3** (2026-10-16) — A HUMAN's bounce of a bot's bleed is not read by the acting bot; a bot that is a bounce's new target cannot bounce onward [journal 16 Oct, HANDOFF v0.6.203]. (gap, not a question — BOARD)
- **O-4** (2026-10-19) — Spying Mission's +2 bank sits before a reactions window: a later bounce carries the +2 to someone else ("the same Methuselah") [spec-cards §5].

### Stealth, intercept & block
- **O-5** (2026-09-18) — Referendums are blocked whenever the prey / predator HOLDS intercept (~50 % on a stake-3 undirected action): right? Should the caller weigh the defenders' intercept history into `pass`? [CL 18, 44c].
- **O-6** — retired 20 Oct (answered by D-22; `strikeAgg` on the strike lines).
- **O-7** (2026-10-17) — The probe's "out-number" counting the prey's expected WAKES as blockers (deck read + hypergeometric) is Johan's description and on his product line (BOARD); the design is to be proposed and needs his "kör" [CL 65f, spec-next §2].
- **O-8** (2026-10-19) — Two keep-rules on one tie: Spying Mission (last) vs Swallowed by the Night (kept for combat); Claude lets the combat card be kept [spec-cards §5].

### Combat
- **O-9** — retired 20 Oct: answered 10 Oct (D-29; D-18's Majesty half is superseded by it).
- **O-10** (2026-09-21) — Nosferatu's Fame → rush → torpor → rescue chain has never run; the rush is not priced in pool [CL 60d, 61, 31c]. (gap, not a question — BOARD)
- **O-11** — retired 20 Oct (D-30; Kevlar: D-52, BOARD).
- **O-12** (2026-10-17) — A steal pair between bots disagrees when the victim's Majesty ends the combat (the stealer books 2, the victim nothing) — older, unfixed [journal 17 Oct]. (gap, not a question — BOARD)

### Politics & referendums
- **O-14** (2026-09-18) — `_refCount`'s ALLY vote counting is untested; Alexa discards once per referendum though the card has no such limit; `_refValue` weights and the pass estimate are judgment; a KRC at pass 0.85 loses to a plain bleed [CL 20h, 24h, 18, 28d].
- **O-15** (2026-09-18) — Bot diablerie under the fixed-vote-majority rule is not built (the directed action, the block-a-leave-torpor branch, a compliance grammar, the blood hunt) [CL 26g, 27d]. (gap, not a question — BOARD)
- **O-16** (2026-10-16) — One pool question with per-seat answers at a political action is "for later" [review decision 4].
- **O-17** (2026-10-19) — The self-oust gate on referendums is strict; the rulebook on SIMULTANEOUS ousts was not checked [journal 19 Oct].

### Influence, pool & economy
- **O-18** (2026-09-18) — The recruit's POOL cost is still paid at resolve rather than parked (minor under R-17) [CL 1, 27b]. (gap, not a question: under R-17 only the reserve at announce is missing)
- **O-19** (2026-09-19) — Income direction v0 is narrow (a 0-blood host, pool ≥ max(10, floor + 4)); a working-reserve rule is the next step [CL 20i]. (gap, not a question — BOARD)
- **O-20** (2026-10-19) — "Low pool" for the equipment rule is the fixed 6, not the dynamic level [spec-cards §5].

### Masters & cards
- **O-21** (2026-09-18) — A FREE block bar (Beast Meld-class) and `chosen` (Seduction-class) have tags but no consumer; crypt text is hand-curated (20 entries), no passive-shape auto-extractor [CL 24c, 24l]. (gap, not a question — BOARD)
- **O-22** — retired 29 Oct (answered by D-98).
- **O-23** (2026-10-16) — Wasserschloss Anif's burn-it action and Haven Uncovered's host burning the card are not built; Ventrue HQ is locked only in own referendums [spec-r4 §3]. (gap, not a question — BOARD)
- **O-24** (2026-10-19) — Both Pentex spellings in one game are two cards to `_uniqueInPlay` (one row in `CARDS.md`, by KRCG id) [spec-cards §5].

### Timing, holds, tempo & chat
- **O-25** (2026-09-25) — Whether the bot ASKS in chat or only LOGS number mismatches with a human (the event-log / shadow-model design) [mem 25 Sep].
- **O-26** — retired 20 Oct (obsolete: the Reduce row, client v2.6.159, D-7).
- **O-27** (2026-10-17) — The probe default and the chat beat have not been seen by a human at a table; main's second idea (delay the panel) is the reserve [journal 17 Oct].
- **O-36** (2026-10-17) — Between bots a contested block's verdict waits for the actor's clock (~3 s at the arena's askSecs; by design in R4, nobody declares it sooner): keep, or shorten? [context 17 Oct, `ana-windows.py`'s "contest at the clock" rows].
- **O-28** (2026-10-20) — The clean-up's open decisions (spec-cleanup §8): Q2 the journal and Q3 the READ-ME-FIRSTs (C1 froze both in `history/` and the ritual writes neither, as §5.5 lays out; Q2 (b) would add a short Swedish decision log), Q5 CI for `bot/`, Q6 history comments (recommended (b)), Q7 paste the project instruction after the merge. Q4 is asked of main (the docs-diet handoff) [spec-cleanup §8].

### Plan & strategy
- **O-13** (2026-09-18) — `H = 3` and the grinding quota holding only while `myTto ≤ 2H` in `_strategize` were changed before measurement; never confirmed [CL 10, 17, 68].
- **O-33** (2026-09-17) — Per-deck playbooks as plan tables and the opening book (B2 steps 2–3, 13c) were Johan's next lever after the strategy layer; never built — superseded by the abstract model and the V5 plan, or still wanted? [CL 8, 13c, 68, line 153]. Johan, 29 Oct: later, with Black Chantry's official deck guides as each deck's baseline, refined by the archetypes (BOARD).
- **O-34** (2026-09-18) — Keep-a-blocker's passivity at a human table (the posture goes to `o.log` only; a chat line "I'll hold X back" was proposed) — Johan to evaluate in play [CL 7].
- **O-35** (2026-09-20) — Judgment calls in the stealth stack never ruled: ×0.6 expected intercept per attempt drawn, "a bleed of 1 is not worth two intercept cards", the gamble thresholds (3+, or 2+ with a 25 % top-deck) [CL 54d].

### Personas & table
- **O-29** (2026-09-18) — Persona thresholds inside the tactics (more added since, `P.aggression >= 1.2`); `aggression` is temperament, not experience — the persona pass [CL 2, 68, 69i].
- **O-30** (2026-09-21) — Should the experience levels GATE the knowledge (novice disciplines only, experienced starters, expert TWD odds)? [mem 21 Sep].
- **O-31** (2026-09-18) — The meta levers Johan noted: the BOUNCE TARGET toward the table threat and cross-table rushes (`crossRushWeight` 0 is his "cross soft-zero") — layer 3, after the playbooks: when? [CL 16] (`planFloor` is BOARD C5.)
- **O-32** (2026-10-20) — The abstract-model spec to read and "kör" on [mem 19–20 Oct, spec-cleanup §6.1; the spec is still to be written].
