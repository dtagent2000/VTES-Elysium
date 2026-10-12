# Elysium Bot — Blocking & Block-Priority Doctrine (design canon)

> **Created 11 September 2026** (bot v0.6.102, arena v1.2.7) from the deep review of the same day.
> Status: **DESIGN CANON — nothing here is code yet.** Companion docs: `elysium-bot-spec.md` (what the
> bot does today), `elysium-bot-strategy.md` (the training ladder), `elysium-bot-politics-theory.md`
> (the strategic horizon this doctrine feeds), `elysium-bot-training-backlog.md` (where the work items
> land). Conversation in Swedish, docs in English, as always.
>
> **Why this document exists.** The review found that the bot only ever arms a defender-side reaction
> window for *directed* lines (bleed, pool damage, peek). Every undirected action another bot takes —
> hunt, equip, employ, recruit, blood-stock (superior Govern), Creeping Sabotage, Revelations [AUS] —
> and every Deep Song rush is announced, waited out for the full `askSecs`, and resolved unopposed.
> The walls cannot "punish attempted actions" (their own manifest), and 5p30 matches with rush/hunt-
> heavy decks spend a large share of wall-clock in dead ask windows. Johan's framing (11 Sep):
> directed actions are the easy call — they unambiguously hurt *me* — while undirected actions are a
> **prioritisation** problem: what does the action give the opponent, and what does the block cost me?
> This doctrine answers that question from published sources, then maps it onto our six registered
> decks and onto a decide() model the arena can measure.

---

## 0. One-paragraph summary

Block **what hurts you** (pool damage: bleeds you cannot bounce, political actions that burn your pool),
block **what makes the opponent permanently better at stopping or hurting you** (permanent intercept
like Raven Spy / Bowl of Convergence / Sport Bike; permanent combat enhancers like .44 Magnum,
Preternatural Strength, Murder of Crows), block **what grows your predator's horde** (blood placed on
their uncontrolled vampires) — and otherwise **let it through**, because every block locks a minion you
may need for a scarier action later this turn and drags you into a combat you may lose. Predator blocks
are for necessity; prey blocks are for stopping what would stop *your* bleeds. The deck's combat
posture (resisting / grinding / disabling) sets the appetite; the persona sets how much of the
calculation the bot actually does.

---

## 1. Rules facts the doctrine stands on (source-verified, do not re-derive)

Sources: VEKN comprehensive rules (lionel-panhaleux/vtes mirror), Black Chantry V5 reference guide
(back page of every V5 help sheet), CotD Fundamentals.

| Fact | Consequence for the bot |
|---|---|
| **Who may block.** Directed action: only the target Methuselah's minions. Undirected action: the acting Methuselah's **prey first, then predator**. | The undirected window needs an ORDER: the prey bot decides before the predator bot. A bot that is neither prey nor predator of the actor never blocks. |
| **Default stealth.** Bleed = 0. Hunt, equip, employ retainer, recruit ally, political action, leave torpor = **+1**. Rescue/diablerie are undirected (+1) only if you control both vampires, directed otherwise. Card actions carry their printed stealth (`actStealth`). | `_announceTallyA` already books the +1 (VC). One point of intercept is enough to block every undirected base action — which is exactly why walls run permanent intercept. |
| **Block succeeds if intercept ≥ stealth.** A minion with 0 intercept legally blocks a 0-stealth action (a bare bleed). | The **bare block** is a real tool, not a misplay: a chump body can stop a 0-stealth bleed from a minion with no combat. Today the bot declines all bare blocks (`icp <= 0 → no block`). |
| **Failed attempt ⇒ another minion may try; the same minion never retries.** Stealth/intercept modifiers persist for the action. | Already modelled (`pending.attempted`). |
| **Declines are final for blocks; not for reactions.** After every eligible Methuselah declines, the actor may play modifiers; bounces/reductions are "only usable after blocks are declined". | Already modelled (steg 5). Bounce/reduce after the amount is confirmed is correct play, not caution. |
| **Successful block:** action card burned, blocker locks, combat occurs. | A block is a lock + a combat: both are costs. |
| **Cross-table blocking** exists only via Eagle's Sight / Falcon's Eye class cards. | Out of scope until a deck carries them. |

---

## 2. General doctrine — what the community and the publisher agree on

### 2.1 The "always block" classes (publisher doctrine)

Black Chantry's V5 help sheets carry a *What to block* paragraph per starter deck. Read together they
name the same four classes, in the same order, for three very different archetypes:

- **Pool damage to me** — bleeds I cannot redirect, political actions that make me burn pool (all sheets).
- **Permanent intercept for the actor** — Raven Spy, Bowl of Convergence, Sport Bike: named explicitly as
  the exception that justifies blocking even a minion you would otherwise never fight (Tremere,
  Malkavian sheets).
- **Permanent combat advantage for the actor** — .44 Magnum, Preternatural Strength, Murder of Crows:
  "any action that gives any advantage in combat to your predator or prey" (Nosferatu sheet; Tremere
  names Preternatural Strength / Murder of Crows as the Nosferatu exception).
- **Blood onto the predator's uncontrolled vampires** — superior Govern / Enchant Kindred class; "you do
  not want your predator to control a horde of minions" (Nosferatu sheet).

Everything else is *let it through* unless the deck is a wall. The stealth-bleed and vote sheets
(Malkavian, Ventrue, First Blood Toreador) add the explicit restraint: with limited intercept, block
**key actions only**, and keep at least one minion unlocked at the end of your turn so a block is
possible at all.

### 2.2 The economy of a block

- **A&B.** CotD's Fundamentals measure a deck by its Actions & Blocks per turn. A block spends one
  "B": it locks the blocker until my next unlock (unless a Cats' Guidance-class refresh) and it enters
  a combat. The cost of a block is therefore *the better block I can no longer make this turn* plus
  *the beads I lose in the fight*.
- **Bead accounting (Paul Jones, "Blood, Pool and Grinding Beads").** Block the predator **only when
  you need to**; never turn a 1-pool bleed into a 2-bead loss by blocking a minion with a .44 Magnum;
  avoid fights you expect to lose; make sure the prey always loses more beads than you do. For a
  grinding deck the block is *also* the payload (Theft of Vitae, .44 at long range: +2 beads per fight
  whatever the action was); for a stealth-bleed deck combat is at best a wash and usually a loss.
- **Combat posture (CotD Combat).** Three postures decide the appetite: **disabling** (rush/torpor
  control — blocks are welcome, the fight is the point), **grinding** (the fight must net beads —
  block when the exchange is favourable), **resisting** (S:CE, dodge, speed — block only the §2.1
  classes and preferably bounce instead).

### 2.3 Direction

- **Predator:** blocks are defensive necessity. Felt pressure (`_predPressureLast` — bleeds and creep
  losses taken) raises the appetite; a quiet predator earns no blocks (Jones).
- **Prey:** the prey's actions matter when they build what stops *my* offence — permanent intercept,
  wakes in play, bloat that outruns my clock — or when the prey is the table threat (CotD table
  balance: the grand-predator is my natural ally against my predator; the grand-prey against my prey).
- **Reverse posture** (CotD Table Talk): a threatening predator justifies going partially reverse —
  blocking and even rushing backwards — before returning to the prey. This is the rush-theory
  backrush weight seen from the block side.

### 2.4 Timing tactics (both sides of the same coin)

- **As actor:** bait/gambit (CotD) — take the least important actions first so the blocker spends the
  wake or the unlocked minion early, then lunge; or lead with the heaviest action to freeze a blocker
  for a threat that never comes. All four V5 sheets say the same: *least important actions first,
  most important last.*
- **As blocker, the mirror image:** do not spend the best interceptor or the only wake on the first
  mundane action while the acting Methuselah still has unlocked minions that can do worse. Hold the
  block for the class-1/class-2 action; use a second body or a bare block for the cheap one.
- **Pre-committed thresholds** (CotD Table Talk "decide in advance", e.g. *wake only if a bleed above
  one pool is announced*). For a bot this is persona-level policy: it removes theatre from the ask
  window and makes the behaviour legible in dossiers.
- **Probe block, then bounce** (Tremere / Ventrue sheets: "you may need to attempt to block so that
  your predator can play stealth"): with a bounce in hand against a predator likely holding stealth,
  *attempt* a block first — the stealth they burn rides along on the redirected bleed and makes it
  harder for the grand-prey to block. Only worth it when the probing body is expendable and the actor
  is not a combat deck (the attempt may succeed).
- **Hand-cycling blocks** (Nosferatu sheet): when the hand is clogged with reaction cards and the deck
  needs combat cards, attempt low-stakes blocks to cycle.

### 2.5 Fear and deterrence

Every sheet says *do not block a Nosferatu / Tremere unless you absolutely have to* — the combat module
is a deterrent, and the Nosferatu sheet lists "Fear" as its own way of getting actions through. Cards
like Aching Beauty (pool tax on blocking) and Toreador Grand Ball (no blocks on non-bleed actions) are
the explicit versions. A blocker's model of the actor's combat potential is therefore a first-class
input, not a refinement.

### 2.6 Deals (the politics link)

"Not intercepting an action" is one of CotD's listed *common deals*, and a wall can deal to let pass
an action it could not have blocked anyway. Political actions are undirected +1-stealth actions, so
**the undirected block window is the same window the politics track needs to block a Kine Resources
Contested** — build the window before the vote archetype, and give it a `noBlockDeal` seat-set hook so
the deal machinery of the politics track can suppress blocks without touching the scorer.

### 2.7 The meta-game (Mark Loughman, "The Game of the Game")

Loughman frames V:tES as an elaborate rock-paper-scissors whose answers live in the **meta-game**: a
playgroup's decks evolve against each other by Darwinian pressure, so the same deck "sucks" in one
region and wins in another. His evolution ladder is the useful part for a bot project, because the
arena is a closed playgroup and will walk exactly this ladder if left alone:

1. stealth-bleed succeeds → opponents add intercept and bounce;
2. the meta gets blocky → block denial (Kiss of Ra, Daring the Dawn, Elder Impersonation) and combat
   to punish blockers, or big voters stacking modifiers;
3. the action space shrinks → weenie swarms flood the board;
4. politics punishes swarms (Ancilla Empowerment, Anarchist Uprising); heavy combat punishes big voters;
5. hybrids appear: the **toolbox**, which benefits most from a good read of the meta because it can
   cycle from offence to defence as the cards come.

His worked example — how to prepare for an Emerald Legionnaire swarm — is a four-item counter list
that maps one-to-one onto this doctrine's classes: **blocking** (if they never reach the ready region
they are no threat), **combat** (a concealed .44 solves a 2-life ally), **borrowing** (Entrancement),
**politics** (pool damage scaled by minion count). He adds the tournament-prep habits: read the field,
swap a few cards rather than the deck, and when unsure increase card cycling (Dreams of the Sphinx,
Aura Reading). "The correct answer is often a moving target."

**Consequences for the bot (three) and the arena (one):**

- **The in-game meta read is the table block climate sensor** (`_tableBlockAttempts`, v0.6.93 — read
  built, consumption documented-not-built). Loughman's Newton loop is that sensor's spec: offence
  reads the table's block supply (spend stealth and block denial when blocks are frequent, save them
  when the table never blocks — `_surplusStealthIndex`/`_unblockedStreak` already do half of this);
  defence reads the table's *stealth* supply (attempt fewer blocks against an actor whose recent
  actions carried stealth — the bait/gambit mirror in §2.4). Both halves are one adjustment on the
  §3.2 score and on `spend-stealth`, not two mechanisms.
- **Minion-adding actions are a threat class of their own** when the actor is a swarm deck: recruit
  ally, The Embrace / breed, Legionnaire-class allies. §3.1 gets a `T4b minions` row weighted by the
  actor's ready-minion count — "if they never reach the ready region, they are no threat."
- **A stance switch for the toolbox decks.** Both registered V5 toolboxes (tremere, nosferatu — the
  author's own favourite clans) should carry one `stance ∈ {offence, defence}` variable driven by felt
  predator pressure and prey pool, scaling block appetite *and* stealth spend together, instead of
  separate knobs drifting apart. This is the desperation-posture item (logic-recommendations #3)
  and the reverse posture (§2.3) as one dial.
- **The arena will breed its own meta.** A T4 persona/deck search over the five registered decks
  converges on counters to *those five*, exactly as the ladder predicts, so tuned profiles must be
  evaluated on permuted fields (`--permute-decks`) and a **meta-drift metric** (block-rate and
  stealth-rate per generation) belongs in the T3 scorecard — the human-anchor rule in the strategy
  doc (§3.4, the Cicero lesson) is Loughman's regional-meta point in ML clothing.

---

## 3. The bot model — threat classes and the block score

### 3.1 Threat classes (read from cardfx fx keys + the announce grammar, never from card names)

| Class | What resolves if unblocked | Detection | Base weight `w(T)` |
|---|---|---|---|
| **T1 pool** | my pool burns: bleed at me, pool-damage action, political action whose terms burn my pool | L12.bleed / L12.poolDmg / (politics) referendum terms | `0.6 + min(1.4, amount / max(1, pool))` (today's urgency) |
| **T2 intercept** | the actor gains permanent intercept (equip/employ with `fx.intercept`, e.g. Raven Spy, Bowl, Sport Bike) | equip/employ announce + fxLookup of the named card | `1.2` (wall/menace `1.4`) |
| **T3 combat** | the actor gains permanent damage or strength (`fx.strike` / `strengthBonus` / env-damage retainers: .44, Preternatural Strength, Murder of Crows) | equip/employ/strength announce + fxLookup | `1.0` (disabling `1.3`, resisting `0.6`) |
| **T4 horde** | blood lands on the **predator's** uncontrolled vampires (`bloodAddTo:'unc'` stock action) | stock announce, actor = my predator | `0.9` (`0.4` when the actor is my prey) |
| **T4b minions** | a minion enters the actor's ready region: recruit ally, The Embrace / breed, Legionnaire-class allies (Loughman's swarm counter #1: "if they never reach the ready region, they are no threat") | recruit/breed announce + the actor's ready-minion count from pub | `0.4 + 0.15 × max(0, actorReadyMinions − 2)`, capped `1.1` |
| **T5 starve** | a hunt by a **key** vampire at 0 blood (forced) or by the vampire I want to keep empty (the Fame/rush target) | hunt announce + actor's blood from pub | `0.7` for disabling/grinding, `0.2` for resisting |
| **T6 tempo/bloat** | any other undirected action: ordinary hunt, creep tabling, Revelations [AUS], a card action with no threat key | announce grammar | `0.3` (wall `0.6`) |

Directed actions keep today's model (bounce beats block; T1 weight); the classes only extend it to the
undirected family. Unknown cards (no cardfx entry) default to T6 — a missed block is the conservative
error, exactly as the finders already fail closed.

### 3.2 The score (one formula, five inputs; persona and deck are multipliers, not code paths)

```
odds      = min(1.3, icp / stealth)   (1.3 when icp ≥ stealth incl. the +1 default; 0 when icp < stealth and no bare-block case)
threat    = w(T) × dirW
dirW      = predator: 1.0 + 0.1 × min(3, predPressureLast)      prey: T2 ⇒ 1.0, else 0.8
combatFit = disabling: 1.0
            grinding:  expectedBeadDelta ≥ 0 ? 1.0 : 0.6
            resisting: actorHasVisibleCombat ? 0.55 : 0.85
lockCost  = wakeInHand ? 0 : min(0.3, 0.15 × (# unlocked actor-side minions that could still take a higher-class action this turn))
score     = (odds × threat × combatFit − lockCost) × deckAxis / persona.blockShy
block     = score ≥ 1
```

- `deckAxis` from `DECK_STRATEGY.axes`: wall 1.3 · menace 1.15 · bounce-wall 1.0 · toolbox 1.0 ·
  stealth-bleed 0.7 · swarm-bleed 0.8. This is the first consumer of the axes field — the review found
  it is emitted in the manifest and read nowhere.
- `persona.blockShy` divides exactly as today (novice 1.3, grinder 1.0, shark 0.8).
- **Persona depth** decides which inputs are computed at all: novice = T1/T2 only, `combatFit` and
  `lockCost` fixed at 1.0/0; grinder = everything except the probe block; shark = everything.
- `expectedBeadDelta` = my best strike/steal/env damage (`_bestStrikeFor`, `_borneEnvFor`,
  `_strengthBonus`) minus the actor's **visible** damage (borne weapons/retainers from their pub, clan
  combat disciplines from cardfx, hand strike 1) — a symmetric `_rushExpectation` read of the actor.
  This is the one input that does not exist yet (§3.6 gives the read).
- **v2, when the climate sensor's consumption lands (§2.7):** `climateAdj = 1 − 0.3 × stealthRate(actor)`
  multiplies `odds`, where `stealthRate` is the share of that actor's recent actions that carried
  stealth (announce grammar + `_actStealthRaw`); the mirror term `1 + 0.3 × tableBlockRate` scales
  `spend-stealth` and `cancel-block` on the offence side. One sensor, both halves of Loughman's loop.

### 3.3 The three special moves

- **Bare block (chump).** Allowed when the effective stealth is 0, `T ≥ T1`, the actor has no visible
  combat, and a body with `cap ≤ 2` and `blood ≥ 1` is available. Knob `bareBlock: off | chump | any`
  (novice off — it looks like a misplay when it goes wrong; shark chump).
- **Probe block then bounce.** When holding a bounce, `readP(actor, 'stealth') ≥ 0.4` (or the actor's
  deck axis is stealth-bleed), the actor is not disabling-posture, and an expendable body exists:
  attempt the block; if stealth is played, bounce; if the block lands, fight. Shark only in v1.
- **Pre-committed thresholds.** `wakeOnlyAbove: N` (novice 2, grinder 1, shark 0) and
  `interceptOnlyAbove: N` — the CotD "decide in advance" policy, also the cheapest way to stop novices
  from waking for a bleed of 1.

### 3.4 Blocker choice (unchanged principle, extended)

`_pickBlocker` keeps "best usable intercept, then board order, frail bodies last"; add: prefer the body
whose combat expectation is best when two candidates tie on intercept, and never spend the last
unlocked minion with a wake-less hand on a T5/T6 action while the actor has a higher-class action
available (the `lockCost` guard applied at pick time, not only at decision time).

### 3.5 Explicitly not modelled in v1

Cross-table blocks (Eagle's Sight), Aching Beauty-class block taxes, Toreador Grand Ball-class denials
(the sheets say "burn it" — a master-phase target for the politics/toolbox track), deals (hook only),
and referendum terms (the politics track's own model). All fail closed.

### 3.6 Reading the actor's combat potential from the board (the missing input)

`expectedBeadDelta` and `actorHasVisibleCombat` need a read of what the acting minion can do to
my blocker. Hands never travel the wire, but three legal signals do: the actor's **clan disciplines**
(cardfx crypt entry), their **borne equipment/retainers** (their pub), and their **deck axis** (the
manifest / observed plays). CotD's *Combat Modules* article maps disciplines to the combat modules that
actually win tournaments; condensed for the bot:

| Signal on the actor | What it implies for a blocker | Menace |
|---|---|---|
| **Potence (pot)** — Immortal Grapple negates dodge and S:CE; Roundhouse / Torn Signpost / Preternatural Strength; Disarm | the strongest close-range module; a blocker with 1–2 blood goes to torpor | high (superior), medium (inferior) |
| **Animalism (ani)** — Carrion Crows 2 env damage/round, undodgeable, not strike-preventable; Aid from Bats; Deep Song rush; Raven Spy | steady damage every round, presses extend it | high (superior), medium (inferior) |
| **Blood Sorcery (tha)** — Theft of Vitae: unpreventable 4-bead differential; Rego Motum prevention; Magic of the Smith fetches weapons | *grinding*: every fight nets them beads even if my block "succeeds" | high vs. low-blood blockers, medium otherwise |
| **Vicissitude (vic)** / **Protean (pro)** — aggravated strikes (Breath of the Dragon, Claws of the Dead), Rötschreck, Earth Meld S:CE | aggravated damage burns wounded blockers outright | high (superior) |
| **Fortitude (for)** — Rolling with the Punches, Hidden Strength, Soak | they lose few beads; my damage is discounted, not theirs | medium (defensive) |
| **Presence (pre)** — Majesty, Staredown (S:CE) | no damage: the fight ends before my blocker is hurt | low (safe to block) |
| **Auspex / Obfuscate / Dominate / Dementation / Celerity without guns** — no damage module | hand strike for 1 at most | low (safe to block) |
| **Borne weapons** — .44 Magnum (+1, maneuver to long), Ivory Bow (aggravated ranged), Sniper Rifle (sets range when blocking), Weighted Walking Stick (needs no action to equip — invisible until combat) | +1 to +2 per strike, or a range they control | medium–high |
| **Allies/retainers** — Carlton Van Wyk (permanent dodge), Nephandus, Raven Spy on the actor | dodge negates my strike; the Spy adds intercept, not damage | per card |

Rule of thumb for v1: `menace(actor) = max(discipline menace) + weapon bonus`; `actorHasVisibleCombat
= menace ≥ medium`; `expectedBeadDelta = myDamage − theirEstimate`, where `theirEstimate` = 1 (hands) +
weapon bonus + 2 for superior Animalism + 2 for superior Potence + 3 for Blood Sorcery (Theft). The
article's control geometry is worth keeping too: *rush* decks reach cross-table, *block* decks pressure
their neighbours — so a block deck's whole table influence is on prey and predator, and cross-table
control must come from Deep Song-class rushes (the rush-theory track, weight 0 today).

---

## 4. Per-deck doctrine for the registered decks

Posture vocabulary from CotD Combat; class appetite: **always / often / rare / never** at grinder
knobs. The V5 rows quote the publisher's own *What to block* paragraph; hacking / sewer / wall are
Johan's own lists with doctrine derived from the same principles.

| Deck (axes) | Posture | T1 pool | T2 intercept | T3 combat | T4 horde | T5 starve | T6 tempo | Notes |
|---|---|---|---|---|---|---|---|---|
| **hacking** (swarm-bleed, cycling, tempo) — Computer Hacking ×20, Leverage ×9, Deflection ×4, Wake ×3, Dodge ×10, **no intercept** | resisting | bounce first; bare chump block on a 0-stealth bleed only when pool is critical and the actor has no combat | rare (a 1-cap can only bare-block, and equip/employ carry the +1 stealth) | never | never | never | never | The deck's defence is Deflection + tempo. Doctrine: keep one 1-cap unlocked as a chump body for a lethal 0-stealth bleed; otherwise every body attacks. |
| **sewer** (stealth-bleed, swarm, race) — Inside Dirt ×15, Night Moves ×15, Perfectionist, Vessel; minimal reactions | resisting | bounce/reduce if held, else let it through unless lethal | rare | never | never | never | never | Race the clock; a block is a lost bleed next turn. Same "one unlocked chump" rule as hacking only when the predator is a no-combat bleed deck. |
| **malkavian** (V5: stealth-bleed, intel, pressure) — Deflection ×5, Telepathic Misdirection ×5, Eyes of Argus ×5, On the Qui Vive ×5 | resisting | always when it cannot be bounced; otherwise bounce | always vs Raven Spy / Bowl / Sport Bike ("even a Nosferatu or Tremere") | rare | rare | never | never | Sheet: block political actions that burn pool or bleeds you cannot redirect; do not block a Nosferatu or Tremere unless they go for permanent intercept. Probe-block-then-bounce is this deck's signature move. |
| **tremere** (V5: wall, bounce, blood-tempo) — Eyes of Argus ×6, Deflection ×4, TM ×4, OtQV ×4, Bowl, Sport Bike, .44, Theft of Vitae ×10 | grinding | always (bounce when the amount would force a lock; otherwise block and steal blood) | always | often — the sheet's Nosferatu exception: Preternatural Strength / Murder of Crows | often vs predator | often (a hunt is a free Theft of Vitae opportunity) | rare | Sheet: block political actions that burn pool or bleeds you cannot redirect; avoid Nosferatu combat except for permanent intercept/damage. Every favourable-bead block is payload. |
| **nosferatu** (V5: menace, rush-control, stealth-bleed) — OtQV ×5, Guard Dogs ×4, Cats' Guidance ×4, Instinctive Reaction ×4, Protected District ×4, Raven Spy ×2, Guardian Angel | disabling | always (reduce with Protected District only for what gets past) | always | always (.44 Magnum is the sheet's own example) | always vs predator ("no horde") | often (torpor control: keep the famed/rushed target empty) | rare — hand-cycling blocks when the hand is reaction-clogged | Sheet: block any combat advantage for predator or prey, any pool burn, any blood onto the predator's uncontrolled. Combat is welcome; Cats' Guidance refunds the lock. |
| **wall** (retired list, open archetype spec: wall, intercept, attrition) — aus weenie, Eyes of Argus ×8 | disabling → grinding | always | always | always | often | often | often | The archetype whose manifest the code could not honour. When re-authored, pair with redirect answers or accept the bounce race (logic-recommendations item 9). |

Per-deck knob defaults fall out of the table: `deckAxis`, `bareBlock`, `wakeOnlyAbove`, and the T5/T6
weights are the archetype's; persona scales them.

### 4.1 Beyond blocking — the sheets' full playbooks vs. the bot today (11 Sep 2026)

The V5 sheets are structured as *early / mid / late game*, *get key actions through*, *combat*,
*defence*, *pool gain*, *hand management*. Read against the bot's actual code paths, they give one
structural change, a handful of per-deck knobs, and two data corrections.

**The structural change — a game-phase variable.** All three sheets key their plan on the same two
thresholds: **"once you have three vampires in play"** (mid game starts: bleed) and **"when there are
three Methuselahs left"** (late game: lunge, tabled pool burn, order of ousts). The bot already has
both facts (`readyCrypt`, `_liveCount()`), and `grinderReadyTarget: 3` is literally the first
threshold — but nothing else reads them. A `phase ∈ {early, mid, late}` on the manifest lets the per-
deck tables below switch weights without new mechanisms.

**Shared lessons (all three sheets):**

| Lesson | Bot today | Update | Size |
|---|---|---|---|
| *Action order: least important first, most important last* | actors act in board order (0-blood first) | sort the minion phase so the biggest bleed (card + modifier potential) acts **last**, cheap/undirected actions first — the bait from §2.4 | S |
| *Opening: the highest-capacity vampire with the superior key discipline first, then superior Govern / Enchant Kindred to stock the younger ones* | `_pickRaise` scores hand-fit + tempo − 0.05·cap → prefers cheap bodies | manifest `openingBook: 'bigFirst'` for the Govern/Enchant decks (tremere, malkavian, the future ventrue); `'tempo'` stays for hacking/sewer | S |
| *Once you control a vampire, take actions to get permanent intercept and permanent damage enhancers* — BEFORE mid-game bleeding | equip 1.5 / 1.15 loses to any bleed card ≥ 2 | in `early`, multiply equip/retainer/strength scores ×1.5 for wall/menace axes | S |
| *"Three Methuselahs left" late game* | no concept | `late` phase: tabled pool-burn (Jack) allowed, lunge planning, oust order | M (with the VP-endgame item) |
| *Bounce for three reasons; block key actions only; keep one minion unlocked at end of turn* | bounce beats block always; no end-of-turn reserve | §3 + a `reserveBlocker` rule: a wall/bounce deck ends its turn with its best interceptor unlocked when the predator has bleed threats | S |

**Tremere (grinding toolbox):**

| Lesson | Bot today | Update | Size |
|---|---|---|---|
| Misdirection / Pentex *"when you are about to bleed heavily"*; Pentex on a minion with permanent intercept or the unlocked blocker | played in the master phase whenever held and a target exists; `_bestNeutralizeTarget` scores bounce disciplines + cap | hold both until `late` or a lunge turn (prey pool ≤ this turn's bleed potential); add **borne intercept** (Raven Spy, Bowl, Sport Bike) to the target score | M |
| Theft of Vitae, then press with basic Apportation, steal again or shoot with the .44 | steal when below cap; press with a press card at blood > 1 | keep; make the press decision read §3.6 menace (press only when `expectedBeadDelta ≥ 0`) | S |
| Maneuver to long (superior Apportation, .44, superior Spirit's Touch) *especially against a Nosferatu*; Precognition after blocking; Kevlar | maneuvers only to enable a rangeLong strike | **defensive maneuver**: go long when the opponent's menace is high and I hold no close strike | S–M |
| Superior Bonding when a block is attempted on a bleed (+1 stealth, +1 bleed) | `_bestStealthFor` takes the highest stealth, ties by order | tie-break stealth picks on the bleed bonus | S |

**Nosferatu (disabling toolbox):**

| Lesson | Bot today | Update | Size |
|---|---|---|---|
| *Your deck is slow, do not put too much pressure on your first prey; if needed let your prey oust theirs* | aggression is the persona's, deck-blind | manifest `tempo: 'slow'` → aggression ×0.8 in `early`/`mid`, backrush weight up ("keep your predator under control") | S |
| Control two vampires with superior ANI, preferably one **primogen** (Protected District needs the title) | `_pickRaise` has no title term | `+1` for a candidate whose title satisfies a `req.title` card in hand | S |
| Smiling Jack and the pool-burn cards *when three Methuselahs are left*, and protect them | "always play A master" → Jack early, burning cross-table allies too | hold Jack until `late` (`_liveCount() ≤ 3`); Creeping Sabotage stays mid-game per the sheet | S |
| Immortal Grapple *when at close range with a Toreador, Tremere or Ventrue* to stop Majesty / Theft | plays IG unless it costs its own options | clan-aware: raise IG priority when the opponent's disciplines include pre (S:CE) or tha (Theft) — `_duelOppName` + cardfx clan lookup already exist | S |
| Haven Uncovered on a threatening predator vampire, then use it (pre-emptive attack) — printed: *put on a ready vampire; minions can enter combat with it as a +1 stealth Ⓓ action* | cardfx auto-tags it `master, persistent, stealth:1` → "always play A master" tables it **unattached on the bot's own board**: a wasted master action, the rush grant never used | curate `fx.rushGrant` with Fame's tabled-on-my-board + frozen-line target law; consume in `_bestRushFor` as a directed +1-stealth rush against the marked vampire | M |
| Hand management: *block some actions to cycle when you need combat cards; enter combat when you need reactions* | `_surplusStealthIndex` only | a hand-shape sensor (reaction share vs combat share) feeding §3.2's hand-cycling term and the rush/Deep Song weight | M |

**Malkavian (resisting stealth-bleed):**

| Lesson | Bot today | Update | Size |
|---|---|---|---|
| *Play basic Revelations with your youngest Auspex vampire to discard a Deflection / Telepathic Misdirection before you bleed* | `_bestPeekFor` prefers superior; first usable vampire in hand order | prefer the **basic** (discard) mode when `readP(prey,'bounce') ≥ 0.4`; act with the **youngest** usable vampire and keep the big one for the bleed; `_pickForcedDiscard` already ranks bounce first ✓ | S |
| *After a redirection, play superior Spying Mission to reduce your bleed to 0* | cardfx auto-tier tags [OBF] as `bleed:2` → the bot offers it as a **+2 bleed modifier** on its own successful bleed and announces `adds +2 bleed` — the card actually makes the bleed unsuccessful and banks +2 for a later bleed on the same Methuselah (card text verified 11 Sep) | **data correction**: curate `[OBF] {bleedNullify:true, bleedBank:2}`; consumers: (a) after my bleed was redirected onto someone I do not want to hurt, (b) bank on a 1-bleed against a high-pool prey when a lunge is planned | S (curation) + M (consumer) |
| *Make sure each vampire has a Blood Doll, to move blood from your pool to them* — Deflection, TM, Conditioning and Govern all cost 1 blood | Blood Doll / Vessel are curated one-way (`bloodToPool` only) and the bot always drains while blood > 0 | **data correction (verified in vtes.json 11 Sep)**: both cards read *move 1 blood from this vampire to their pool **or from their pool to this vampire*** (Blood Doll at master, Vessel at unlock; Vessel is a Trifle and may burn a Blood Doll) — curate a `poolToBlood:1` mode; decide `income-direction`: feed when the vampire is below the deck's reaction cost floor and pool is comfortable, drain when pool is threatened, never drain the last blood (review #13) | S (curation) + S (decide) |
| Foreshadowing Destruction after the decline (with Bonding / Conditioning) | cardfx tags `[DOM] bleed:3` unconditionally; printed: *+3 bleed **if the target Methuselah has 9 or fewer pool*** (limited) → the bot may announce +3 against a fat prey and deal phantom pool damage | **data correction (verified in vtes.json)**: curate `[DOM] {bleed:3, req:{targetPoolMax:9}}`; the modifier finder reads the target's pub pool | S |
| Swallowed by the Night as a maneuver *when at 0 blood or against a Nosferatu who cannot press* | maneuver only for rangeLong strikes | the defensive-maneuver rule above, keyed on menace + own blood | S (shared with tremere) |
| The Barrens / discard-phase to clear clogged stealth or reactions; Dreams of the Sphinx for hand size | dead-card discard only; DotS hand-size mode consumed | extend the discard heuristic with the hand-shape sensor (surplus reactions when the predator is quiet, surplus stealth when the table never blocks — the latter exists) | S |
| *Pool gain mainly comes from ousting your prey* | no clock or race awareness | the resisting posture's `stance` (§2.7) defaults to offence; desperation posture when pool < 25 % | M (existing backlog item) |

**Per-deck default persona (proposal).** Persona and deck are independent today; the sheets argue
for a deck-level default that the named personas then scale: nosferatu `{aggression 0.8, blockShy 0.7,
tempo slow}`, tremere `{1.0, 0.8, grinderReadyTarget 3}`, malkavian `{1.2, 1.3, openingBook bigFirst}`.
Sweepable through the existing `--knob SEAT:k=v` whitelist once `aggression`/`blockShy` are whitelisted
(logic-recommendations #10).

**Not for our decks yet:** the Ventrue sheet (politics: count votes before calling; Freak Drive
multi-act after a blocked action; Daring the Dawn for the ousting action; Anarch Troublemaker to lock
two blockers before the lunge) is the vote archetype's seed for the politics track.

---

## 5. Implementation notes (B1 SHIPPED 11 Sep 2026 as bot v0.6.107 / arena v1.2.8 — items 1–5 below are built; the T1 deck-axis integration and the special moves of §3.3 are B2)

1. **Grammar family `L12.undirected`** — the bot already emits `<vamp> hunts.`, `<vamp> equips <X>.`,
   `<vamp> employs <X>.`, `<vamp> recruits <X> [ani].`, `<vamp> plays <X> — N blood onto an
   uncontrolled vampire.`, `<vamp> plays <X> — puts it in play.`, `<vamp> plays <X> [ani] — rushes …`
   (L12.rush exists, comply-only today). Freeze them as parsed lines. **Cross-project note:** new bot-
   emitted frozen lines are backward-compatible (only bots parse them) — ship the bot first, then the §12
   note in the main project; but the **human client's** own hunt/equip/recruit log wording must be
   checked (main project, `test-bot-canary.js` grows a section) or human undirected actions stay
   invisible to bots.
2. **Window order.** Arm the pending with `kind:'undirected'` and a `role` (prey | predator of the
   actor). The prey bot answers first; the predator bot waits for the prey's Pass / No block (the
   existing `say` grammar) before opening its own window. The actor's `_askBlock` already accepts
   Block!/Pass from anyone; it must now resolve on the **predator's** Pass when the prey has passed
   (today only the target's Pass resolves).
3. **Rush as defender.** `L12.rush` currently locks and fights immediately; give the rushed owner a
   block window first (any unlocked minion may block a directed rush), then comply.
4. **Score in `_decide('block-as-target')`**: add `T`, `role`, `combatFit`, `lockCost`, `deckAxis` to the
   ctx; keep the existing formula as the T1 special case so every current test stays green.
5. **Emit** `block-eval` `{T, role, score, parts}` for every window (decide already rides the trace) so
   the dossier can grade blocks against §4.
6. **Order of work vs. the review's NOW round:** this window shares the react path with review findings
   #3/#4 (ghost-prey hook, decision/execution drift on `attempted`) — land those first, then this.
   *(Done 11 Sep: A1–A3 shipped as v0.6.103–106.)*
7. **The blocker-name carrier (since v0.6.106, A3 #14):** the acting bot learns its blocker's vampire from the
   frozen log lines `NAME attempts to block.` (bot-emitted, new) and `NAME plays CARD: +N intercept.` — never
   from chat. The undirected window must keep that invariant: the name line precedes the verdict, so the
   actor's handshake filter (`_expectedOppVamp`) knows its opponent before the early strike can arrive.

---

## 6. Evaluation (the doctrine, applied to itself)

Arena metrics to add to `gen-trace-harvest`: block-rate per class and role, bead delta per block
(my blood lost vs theirs), torpors caused by blocks, "wasted blocks" (T5/T6 blocks by a resisting deck),
"missed lethal" (a T1 lethal through while an unlocked interceptor sat idle), ms/player-turn, and —
for any T4 search — **meta drift**: block-rate and stealth-rate per generation, so the Loughman ladder
(§2.7) is watched rather than discovered after the fact.

Registered predictions for the first post-build 5p30 series (verdict keep/tune/revert per the doctrine):

| Change | Prediction |
|---|---|
| undirected window + T2/T3 classes | tremere and nosferatu block-rate on permanent-intercept/damage actions rises from 0 to ≥ 50 % when an interceptor is unlocked |
| resolves-on-Pass instead of timeout | 5p30 ms/player-turn drops ≥ 20 % with nosferatu at the table |
| deckAxis in the scorer | wall-axis decks block predator hunts of empty vampires ≥ 30 % of the time; malkavian block count stays within ±1 per match |
| lockCost | ≤ 1 "missed lethal" per match for tremere/nosferatu |
| bare block (shark, chump) | hacking survives ≥ 1 additional turn vs a no-combat bleed predator at pool ≤ 6 |

---

## 7. Open questions for Johan

1. Should the predator's block window at bot-only tables wait for the prey bot's explicit Pass (rules-
   exact, one extra beat) or open simultaneously with a prey-priority tiebreak (faster)?
2. Bare blocks: allow them for all personas, or shark-only until a live session says they look sane?
3. Do we want the T4 "horde" class to also count the **prey's** stock actions when the prey is the table
   threat (CotD table balance), or keep it predator-only as the sheet says?
4. When the politics track arrives, is `noBlockDeal` per seat enough, or should deals carry a class
   ("I won't block your hunts" vs "I won't block anything")?

---

## 8. Sources (read 11 September 2026)

- Black Chantry, *V5 Strategy Guides* — Tremere, Nosferatu, Malkavian, Ventrue help sheets
  (`blackchantry.com/help_sheet_<clan>_en.pdf`; each carries "How to defend yourself → What to block"
  and the V5 reference guide with the course of an action and the default stealth values).
- Black Chantry, *How to play the First Blood: Toreador deck* (`blackchantry.com/?p=1248`): block key
  actions only, keep a minion unlocked at end of turn.
- Card texts for the §4.1 data corrections verified against KRCG `vtes.json` (uploaded by Johan,
  11 Sep 2026): Blood Doll, Vessel, Spying Mission, Foreshadowing Destruction, Haven Uncovered,
  Immortal Grapple, Smiling Jack, Protected District — the standing rule, real card text never memory.
  `test-cardfx.js` ran green (207/0) against it the same day: the curation baseline is measurable.
- Codex of the Damned — *Fundamentals* (A&B, bait/gambit, the lunge, stealth & intercept, permanent
  intercept list), *Combat* (the three postures, S:CE, range), *Table Talk* (deals, decision timing,
  table balance, reverse posture, Predator-Prey Continuum), *Archetype Categories* (wall / toolbox /
  bleed / vote posture), Paul Jones' *Blood, Pool and Grinding Beads*, Krzysztof Karski's *Combat
  Primer* (combat as a tool of control; first rush usually backwards), the advanced *Combat Modules*
  article (rush vs block control geometry; the discipline → module map behind §3.6) —
  `codex-of-the-damned.org/en/strategy/`.
- VEKN comprehensive rules (mirror: `github.com/lionel-panhaleux/vtes`, `vtes_comprehensive_rules.md`).
- Mark Loughman, *The Game of the Game* (CotD advanced strategy, Nov 2020; text supplied by Johan
  11 Sep 2026 after automated fetches failed): the meta-game evolution ladder, the Legionnaire
  counter list, tournament-prep habits — behind §2.7, the T4b class, the v2 climate term and the
  meta-drift metric.
