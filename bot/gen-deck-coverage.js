#!/usr/bin/env node
'use strict';
/* gen-deck-coverage.js v1.1.39 — per-deck coverage report (16 July 2026; header version
   string resynced 27 July: it had been frozen at v1.1.14 while the inline history below
   ran on to v1.1.30 — a stale header made the project copy look current and cost a
   diagnostic detour (the tool measured with the OLD CLASS map and reported the decks at
   their pre-work baselines). Bump this line with every version note added below.
   v1.1.0 17 July:
   fas B/C sweep keys classified — cancelBlock/actStealth/stealthLater(gated)/
   bloodAfterCleanAction(attached), poolDmg re-classed play+threat; v1.1.1 grinder
   onboarding: bleed@mod-window contextual fix; v1.1.2 superior Govern: bloodAdd@unc-
   stock contextual fix; v1.1.3 18-19 July, Johan's combat GO: stealBlood@strike
   contextual fix (mirrors _bestStealStrikeFor's combat-type + no-co-located-maneuver/
   press + no-unverifiable-req-flag gates exactly), maneuver/press labelled 'm2' —
   honestly unconsumed, not silently unknown)
   ---------------------------------------------------------------------------
   Answers ONE question mechanically: "can the bot actually play THIS deck?"
   For every card in a playbook it reports which knowledge tier resolves it
   (auto / curated / handler), whether the bot's CURRENT decision code consumes
   any of its modes, and whether any vampire in the deck's own crypt can meet
   the discipline gates. Output: a markdown report in the sweep-audit's spirit
   (scrollable full truth, not a sample) + a console summary.

   Design decisions (mirror the house rules):
   - The lookup ladder is NOT reimplemented from prose: we require the bot's
     own exports (FX_NORM, loadCardfx, CARD_HANDLERS, DEFAULT_DECK) so name
     resolution is byte-identical with production (three tiers: exact ->
     lowercase alias -> norm index).
   - The CONSUMED set is DERIVED, not hand-maintained: we scan elysium-bot.js's
     source for `fx.<key>` reads (loader internals excluded). A small CLASS map
     then splits play-capability vs threat-read vs phase-income; the report
     WARNS if the scan finds a key the map doesn't know (forward-compat alarm —
     the actGrant doc-drift lesson, applied to tooling).
   - This is a REPORT, not a gate: exit 0 unless the inputs themselves are
     broken. UNRESOLVED names and dead reaches are findings, not failures.

   Known approximations (stated, not silent):
   - Play-CONTEXT is not simulated: a numeric fx.stealth counts as consumed
     wherever it appears, because _bestStealthFor itself does not type-gate
     today (a real quirk of the consumer, faithfully reflected).
   - The 2-live-player bounce deadness (_modeUsableBy's table-structural check)
     is table STATE, not deck property — deliberately out of scope here.
   - `poolGain`/`bloodToPool` count as consumed only when the mode carries
     `phase` (mirrors _applyPhaseIncome's v1 contract exactly).

   Usage:
     node gen-deck-coverage.js                     # the bot's DEFAULT_DECK
     node gen-deck-coverage.js my-deck.json        # playbook {name,crypt:[{name,qty,cap?}],library:[{name,qty}]}
     node gen-deck-coverage.js my-deck.txt         # "N Cardname" / "Nx Cardname" lines; crypt/lib auto-split
     node gen-deck-coverage.js ... --out report.md # default: deck-coverage-<slug>.md
   Requires elysium-cardfx.json + elysium-bot.js beside this script.          */

const fs = require('fs');
const path = require('path');

const BOT = require('./elysium-bot.js');           // FX_NORM, loadCardfx, CARD_HANDLERS, DEFAULT_DECK
const fx = BOT.loadCardfx(path.join(__dirname, 'elysium-cardfx.json'));
if (!fx) { console.error('gen-deck-coverage: elysium-cardfx.json missing or invalid beside the script'); process.exit(1); }

/* ---------- the bot's own three-tier name ladder, over the same loaded data ---------- */
function lookup(name){
  const hit = c => fx.lib[c] ? { kind: 'lib', name: c, e: fx.lib[c] }
            : fx.crypt[c] ? { kind: 'crypt', name: c, e: fx.crypt[c] } : null;
  let h = hit(name); if (h) return h;                                   // 1) exact
  const a = fx.alias[String(name).trim().toLowerCase()];                // 2) lowercase alias
  if (a && (h = hit(a))) return h;
  const n = fx.normIdx.get(BOT.FX_NORM(name));                          // 3) client-identical norm
  if (n && (h = hit(n))) return h;
  return null;
}

/* ---------- the CONSUMED set: scan the consumer's source, classify, warn on drift ---------- */
const botSrc = fs.readFileSync(require.resolve('./elysium-bot.js'), 'utf8');
const REF_CALLER = /\b_refDeltas\s*\(/.test(botSrc) && /\b_callReferendum\s*\(/.test(botSrc);   // v1.1.31: the two names the politics leg's caller is specified to carry
const NON_FX = new Set(['json', 'counts', 'normIdx', 'lib', 'crypt', 'alias']);   // loader internals, not fx keys
const scanned = new Set();
for (const m of botSrc.matchAll(/\bfx\.([a-zA-Z]+)\b/g)) if (!NON_FX.has(m[1])) scanned.add(m[1]);

/* Classification of what a scanned read MEANS (source-derived, bot v0.6.11):
   'play'    — makes an OWN card actively playable (action/modifier/reaction/combat pick)
   'income'  — executed by _applyPhaseIncome, but ONLY when the mode carries `phase`
   'threat'  — read about OPPONENT cards (fxThreatOf); never makes an own card playable
   'paired'  — a rider read only next to another key (bleed rides bleedAct; actStealth
               is the announce-side tally booking on a bleedAct action — v1.5.0 split it
               from `stealth` exactly so it would NOT read as independently playable)
   'gated'   — playable ONLY through an entry-level companion flag: stealthLater is
               consumed by the attach flow (needs e.attachAfterSuccess to ever leave
               hand) and by board-attached burns; without the flag the tag is inert by
               DESIGN (Zip Line/PTS/UMS — the fas B/C sweep's misplay guard)
   'attached'— an effect hook on an already-attached card: bloodAfterCleanAction fires
               post-action from the board; the card REACHES the board via the archetype
               master path (needs e.archetype)
   A '+' joins dual roles: poolDmg is BOTH the bot's own play path
   (_bestPoolDmgActionFor, fas C) and a threat read — v1.0.0 had it threat-only, which
   INERT-stamped Inside Dirt in the sewer report (the finding that motivated v1.1.0). */
const CLASS = {
  bleedAct: 'play', stealth: 'play', intercept: 'play', bounce: 'play',
  wake: 'play', prevent: 'play', cancelBlock: 'play', dodge: 'play',   // dodge: _bestDodgeFor (steg 6) -- the v1.0.0 report itself flagged it unclassified; a Strike:-choice pick, same family as strike/prevent
  handBonus: 'contextual',   // v1.1.37 (bot v0.6.202, cardfx v1.9.2, play-test point 18): 'hand strike at +N damage' / 'this strike is at +N damage' -- a bonus on the hand strike, consumed through the same strike@ special-case as strike (_modeStrikeDmg)
  strike: 'contextual',   // v1.1.3: consumed via the strike@ special-case above (combat-typed + no co-located maneuver/press + no unverifiable req flags) -- 'contextual' here only silences the unknown-key warning for the EQUIPMENT-typed instances (.44 Magnum-class: attached-weapon consumption is still a future board-scan, correctly NOT matching the special case's combat-type requirement)
  gainOppLoss: 'contextual',   // v1.1.4 (Johan's combat GO, Taste of Vitae): consumed via the gainOppLoss@ special-case below (combat-typed only -- no req-flag/co-located guard needed, since Taste of Vitae's own restrictions -- end-of-round timing, not-if-torporing -- are STATE the combat-loop hook checks directly, not unverifiable preconditions like range/round-count)
  envDmgPerRound: 'contextual',   // v1.1.7 (Johan's combat GO, Carrion Crows): consumed via the envDmgPerRound@ special-case below (combat-typed only -- "only usable before range is determined" is verifiable now that _resolveCombatRound has that exact play window, so no req-flag exclusion needed here either)
  restrictHandStrike: 'contextual',   // v1.1.8 (Johan's combat GO, Immortal Grapple): consumed via the restrictHandStrike@ special-case below (combat-typed + rangeClose, both verifiable now that _resolveCombatRound has the Pre-Strike window and this._range tracked)
  handStrike: 'meta',   // v1.1.8: not an independent ability -- metadata ATTACHED to strike/stealBlood modes (does this mode count as a hand strike for Immortal Grapple's restriction). Silences the unknown-key warning without claiming its own consumption path.
  poolGain: 'income', bloodToPool: 'income',
  poolToBlood: 'income',   // v1.1.34 (bot v0.6.125): the reverse direction of Blood Doll / Vessel -- decide('income-direction') in _applyPhaseIncome, same phase rule as bloodToPool
  handSizePerCounter: 'income', replaceBurnsCounter: 'paired',   // v1.1.34: Visit from the Capuchin
  bloodPerMargin: 'play', marginToPool: 'paired',   // v1.1.34: Voter Captivation -- _maybeMarginBlood after a passed referendum
  handSize: 'income',   // v1.1.10 (Johan's ask, continuing Dreams of the Sphinx): consumed via the SAME generic income rule as poolGain (split on mo.lock) -- _considerLockIncome now handles handSize identically (draw-up-to via the ACTIVE hand-size-target rule, source-verified vekn.net), no separate special-case needed
  handSizePermanent: 'paired',   // v1.1.11: companion flag (does this handSize mode mean "passive, no lock" or "temporary, lock-based") -- consumed via the handSize@permanent special-case above, not independently
  transferSwap: 'income', transferBurnPool: 'income', transferCost: 'paired',   // v1.1.12 (Johan's ask, Wider View -- the last Inside Dirt card): consumed via the transfer@influence-loop special-case below -- wired directly into _influenceLoop (elysium-bot.js), not a decide()/finder window, since transfers (this.inf) are already tracked there and neither ability is lock-gated
  rescueTorpor: 'income',   // v1.1.13 (Johan's ask, Chantry -- the last card on phase-income-v2-plan.md): reuses the SAME generic mo.lock-aware income rule as poolGain/handSize -- _considerLockRescue (elysium-bot.js) is a master-typed, lock-gated consumer, so the existing lock-income@ special-case already covers it, no new rule needed
  handCycle: 'income',
  peekPreyDiscard: 'play', openHandPrey: 'play',
  lockMinion: 'play',
  noBlockMinion: 'play',
  fetchEquip: 'play', handStrike: 'paired',
  unlock: 'play',
  rush: 'play', lockTarget: 'paired',
  fameOnTarget: 'play', preyBurnPerCopy: 'play', jackEngine: 'play',
  warsawRefresh: 'play', warsawRescue: 'play', rebelBlood: 'play',
  strengthBonus: 'play',   // v1.1.26 (N4b): strength = base hand-strike damage
  recruitAlly: 'play', allyLife: 'paired', allyPressLife: 'play', allyBurnUnlock: 'play',   // v1.1.28 (N4d): the mini-ally class
  preyLock: 'play', giveToPrey: 'paired',   // v1.1.36 (bot v0.6.128): Anarch Troublemaker -- _maybeGiveLock at unlock
  blockBar: 'contextual', selfDmg: 'paired', selfAggr: 'paired', selfTorpor: 'paired',   // v1.1.36: consumed via the blockBar@announce special-case (Daring the Dawn-class)
  strikeCE: 'play',   // v1.1.33 (18 Sep 2026, bot v0.6.123): Strike: combat ends, consumed by _bestCombatEndFor; an act-again `when` rider (actSuccess / actBlocked / actFailed) makes a modifier's fx.unlock consumed by _bestActAgainFor -- the v1.1.31 bare-unlock rule already lets a mode WITH a rider through
  votes: 'play',   // v1.1.32 (18 Sep 2026, bot v0.6.122): consumed by _voteBoosts -- a votes MODIFIER the acting vampire can play (Bewitching Oration) or a lockable in-play votes card (Ventrue Headquarters), spent during the caller's polling when the count needs it
  votesBonus: 'play',   // v1.1.30 (P0): District's against-votes land in the client's EXISTING vote-tally -- the politics engine's first brick
  reduce: 'play',   // v1.1.27 (N4c): the react-window bleed reducer (District's live half; votesBonus stays honestly unread until politics)   // v1.1.25 (N4a): the 100% push -- Station's two consumers + Rebel's title-block trigger   // v1.1.24 (N3): the menace-master engines (both-sides)   // v1.1.23 (N2): the rush action class; lockTarget rides the through-branch   // v1.1.22 (N1): consumed via _bestUnlockReactFor -- the sleeper slot (bleedAtMe) and the post-block refresh (postBlock); the when mode-rider mirrors dir   // v1.1.20 (E1): MotS consumed via the fetch branch; handStrike is a rider on strike   // v1.1.18 (M2, Pentex): consumed via the master loop's noBlockMinion branch -- _bestNeutralizeTarget without needUnlocked; serves the 14-card put-on cannot-block family   // v1.1.17 (M1, Misdirection): consumed via the master loop's lockMinion branch -- _bestNeutralizeTarget picks the prey vampire (elysium-bot.js)   // v1.1.16 (R3, Revelations): consumed via decide('action')'s peek candidate -- _bestPeekFor + the act.kind==='peek' branch (elysium-bot.js, pool/stock templates); target-side compliance (revealHand/openHand/logTo) is wire-driven, not deck-consumption. dir stays a 'paired' rider.   // v1.1.15 (Johan's ask, The Barrens): same reuse -- _considerHandCycle (elysium-bot.js) is a master-typed, lock-gated consumer just like rescueTorpor, so the existing generic mo.lock-aware rule (line ~200) covers it once classified here, no new special-case needed
  poolDmg: 'play+threat', bloodBurn: 'threat', stealBlood: 'threat',
  bleed: 'paired', actStealth: 'paired',
  bloodAdd: 'paired', bloodAddTo: 'paired', bloodAddYounger: 'paired',   // v1.1.2: consumed via the unc-stock window special-case above; 'paired' here only silences the unknown-key warning
  stealthLater: 'gated', bloodAfterCleanAction: 'attached',
  maneuver: 'contextual',   // v1.1.6 (Johan's combat GO, the range concept): consumed via the maneuver@ special-case below (combat-typed, clean standalone shape only -- Apportation [THA], Swallowed by the Night [OBF]) -- 'contextual' here only silences the unknown-key warning for the excluded bundled instances (Grasp of the Python, Slam's superior, etc.)
  lockStealth: 'play', lockStealthClan: 'paired',   // v1.1.38 (bot v0.6.205, R4 / the play-test's F23): The Labyrinth -- _lockStealthFor, offered by _bestStealthFor from the board, locked by _spendStealthCard
  hostIntercept: 'play', hostInterceptOn: 'paired', hostPrevent: 'play',   // v1.1.38: Guardian Angel on its host -- _hostedIntercept (the block sites and forecasts), _hostedPrevent (the combat damage step)
  bankIn: 'income', bankOut: 'income', bankClan: 'paired',   // v1.1.38: Wasserschloss Anif -- _considerBankIn (master phase, no lock) and _considerLockIncome('influence') (the lock-gated payout)
  rushGrant: 'play',   // v1.1.38: Haven Uncovered -- the master loop's rushGrant branch (placed on the rush target) and _bestHavenRushFor (the rush through it)
  /* v1.1.39 (29 Oct 2026, bot v0.6.212, V5 round 0): the 23 keys the scan had flagged as unclassified since v0.6.205 (every report since printed
     the warning). Library riders first, then the crypt text. */
  bleedNullify: 'play', bleedBank: 'paired',   // Spying Mission [OBF] -- _spyMissionFor (v0.6.211): cancels a bounced bleed, banks +2 bleed
  interceptPaid: 'contextual',   // Bowl of Convergence [AUS] -- _equipPaidIntercept, through the equip grant rule (EQUIP_GRANT below)
  payBlood: 'paired', preventX: 'paired', burnCap: 'paired',   // a mode's own price (Second Tradition's locked route), X prevention on prevent (Hidden Strength), the cap on preyBurnPerCopy
  ranged: 'meta', equip: 'meta', referendum: 'meta',   // ranged: a strike's range flag (70 entries: the guns, Aid from Bats ...), read beside strike / stealBlood; equip / referendum: read in a category test, no entry carries them
  // crypt card text (Bot._cryptFxOf): a VAMPIRE's own printed ability -- never a library play path, so it cannot make a library card playable
  bleedBonus: 'crypt', bleedBoostDiscard: 'crypt', blockNotOlder: 'crypt', burnAtDamage: 'crypt', burnOnTorpor: 'crypt', enterPlay: 'crypt', interceptMod: 'crypt',
  noHuntStealth: 'crypt', noUnlockAfterTitledBleed: 'crypt', selfUnlock: 'crypt', stealthMod: 'crypt', strengthMod: 'crypt', voteBoostDiscard: 'crypt', voteTaxAgainst: 'crypt',
  press: 'contextual',   // v1.1.5: consumed via the press@ special-case below (Apportation's clean standalone shape only) -- 'contextual' here only silences the unknown-key warning for the excluded instances (co-located maneuver/strike/stealBlood, or an unverifiable req flag)
};
const cls = k => String(CLASS[k] || '');
const unknownScanned = [...scanned].filter(k => !(k in CLASS)).sort();
const consumedPlayKeys = [...scanned].filter(k => cls(k).includes('play')).sort();
const consumedIncomeKeys = [...scanned].filter(k => cls(k) === 'income').sort();
const threatKeys = [...scanned].filter(k => cls(k).includes('threat')).sort();

/* v1.1.38 (bot v0.6.205, R4 / the play-test's F23): the keys a MASTER is consumed through -- the readers that act on a master
   ON THE BOARD (or the master loop's own branches). The generic 'play' keys (stealth, intercept, prevent, dodge, strike ...)
   belong to the hand finders, which are type-filtered to modifiers, reactions and combat cards; on a master they certified
   Guardian Angel, Haven Uncovered, The Labyrinth and Wasserschloss Anif FULL while the bot did nothing with them. */
const MASTER_KEYS = new Set(['poolGain', 'bloodToPool', 'poolToBlood', 'handSize', 'handSizePermanent', 'handSizePerCounter', 'replaceBurnsCounter',
  'transferSwap', 'transferBurnPool', 'transferCost', 'rescueTorpor', 'handCycle', 'lockMinion', 'noBlockMinion', 'fameOnTarget', 'jackEngine',
  'warsawRefresh', 'warsawRescue', 'rebelBlood', 'votes', 'bloodAdd', 'bloodAddTo', 'bloodAddYounger', 'preyLock', 'giveToPrey', 'bloodAfterCleanAction',
  'lockStealth', 'lockStealthClan', 'hostIntercept', 'hostInterceptOn', 'hostPrevent', 'bankIn', 'bankOut', 'bankClan', 'rushGrant']);
function modeConsumed(mo, e){
  if(((e && e.t) || []).includes('master') && !Object.keys(mo.fx || {}).some(k => MASTER_KEYS.has(k)))
    return { ok: false, via: 'master: no board consumer for ' + (Object.keys(mo.fx || {}).join(',') || '\u2014') };
  /* v1.1.31 (18 Sep 2026, found while loading Ventrue): the UNLOCK false positive. fx.unlock has exactly ONE
     consumer, _bestUnlockReactFor, which demands a REACTION mode with a curated `when` rider. Freak Drive (a
     modifier, "after action resolution") and Majesty [PRE] (combat) carry a bare fx.unlock and were certified
     FULL / PARTIAL -- 12 copies of the Ventrue starter the bot never plays. A mode whose only consumed key
     would be that bare unlock is honestly unconsumed until an act-again consumer exists. */
  if(mo.fx && mo.fx.unlock && !mo.when){
    const others = Object.keys(mo.fx).filter(k => k !== 'unlock' && scanned.has(k) && cls(k).includes('play'));
    if(!others.length) return { ok: false, via: 'unlock: no `when` rider -- awaits an act-again consumer' };
  }
  /* v1.1.19 (25 July, Johan's equipment question): EQUIP-typed entries grant their
     keys PASSIVELY on a bearer -- the hand-finders that consume intercept/prevent/
     strike are type-filtered to react/mod/combat (bot v0.6.12+0.6.13, Bowl-class was
     the named exposure), so those consumers can NEVER touch an equipment card. Until
     the E1 equip path exists, every equip mode is honestly unconsumed. */
  if(((e && e.t) || []).includes('ally') && !((e.modes || []).some(mo => mo.fx && mo.fx.recruitAlly && scanned.has('recruitAlly')))){
    /* v1.1.29 (N4d): the recruit path EXISTS now -- the old blanket 'awaits the
       recruit path' short-circuit retires. Only an ally WITHOUT a scanned
       recruitAlly mode still earns the label; recruited allies fall through to
       the generic key-driven verdict engine like every other type. */
    return { ok: false, via: 'ally: awaits the recruit path' };
  }
  if(((e && e.t) || []).includes('retainer')){
    /* v1.1.21 (N0): the RETAINER false-positive fix -- the equipment lesson one type
       over (Raven Spy was the named case). Retainers ATTACH like equipment; grant
       keys count only via the generalized bearer readers (_attachedEquips now reads
       equip|retainer; envDmgPerRound via the borne-crows hook). */
    const _rk = Object.keys(mo.fx || {});
    if(_rk.length && _rk.every(k => ['intercept','prevent','maneuver','strike','handStrike','envDmgPerRound','ranged'].includes(k)))   // v1.1.39: + ranged (a flag on the strike)
      return { ok: true, via: 'attach-grant (bearer readers)' };
    return { ok: false, via: 'retainer: key outside the grant set' };
  }
  if(((e && e.t) || []).includes('equip')){
    /* v1.1.20 (E1 SHIPPED): the bearer readers now exist -- fx.intercept via
       _equipIntercept into the block pick/tally, fx.strike+fx.maneuver via the
       combat equip-branches, and Kevlar's prevent via _kevlarPrevent. Grant keys
       on equip entries are consumed through the bearer, everything else waits. */
    const _ek = Object.keys(mo.fx || {});
    if(_ek.length && _ek.every(k => EQUIP_GRANT.includes(k)))
      return { ok: true, via: 'equip-grant (bearer readers)' };
    return { ok: false, via: 'equip: key outside the grant set' };
  }
  /* v1.1.16 (R3): an actStealth-ONLY header mode is consumed by the PEEK branch's own
     tally booking (act.st) whenever the SAME entry carries a consumed peek key --
     entry-level pairing that mirrors how the branch actually reads it. */
  const _ks = Object.keys(mo.fx || {});
  if(_ks.length && _ks.every(k => k === 'actStealth') && (e.modes || []).some(m2 => (m2.fx || {}).peekPreyDiscard || (m2.fx || {}).openHandPrey))
    return { ok: true, via: 'actStealth@peek-tally' };
  const f = mo.fx || {};
  /* v1.1.2 (Johan's grinder onboarding): bleed is CONTEXTUAL, not blanket-'paired'.
     _bestBleedModifierFor (steg 2) consumes standalone fx.bleed on mod-typed cards --
     UNLESS the mode also grants stealth (the window skips those outright, Bonding's own
     ruling) or carries bleedAct (that flag marks the base-action domain). v1.1.0's
     blanket 'paired' wrongly INERT-stamped Conditioning and halved Bonding.            */
  if (typeof f.bleed === 'number' && !f.bleedAct && f.stealth === undefined
      && (e && (e.t || []).includes('mod'))) return { ok: true, via: 'bleed@mod-window' };
  /* v1.1.2 (superior Govern): bloodAdd is contextual too -- _bestBloodStockFor consumes
     it on ACTION-typed cards when the mode carries bloodAddTo:'unc' (clean-target
     family) and the entry is not pool-costed (blood costs are gated at runtime by the
     actor's blood, deck-statically fine). bloodAddTo/bloodAddYounger are companion
     keys, never play paths of their own.                                            */
  if (f.bloodAdd > 0 && f.bloodAddTo === 'unc'
      && (e && (e.t || []).includes('action')) && !(e && e.cost && e.cost.pool)) return { ok: true, via: 'bloodAdd@unc-stock' };
  /* v1.1.9 (Johan's "push Inside Dirt to 100%" GO, Dreams of the Sphinx): a SECOND
     bloodAdd+bloodAddTo:'unc' consumer, distinct from the action-typed one above --
     _considerLockIncome (elysium-bot.js) consumes it on a lock-gated MASTER-typed
     mode (Dreams of the Sphinx, and Arcane Library/Chantry once those are wired the
     same way). The two consumers read different card shapes (a played action vs. a
     locked in-play permanent), so they stay two rules, not one loosened one. */
  if (f.bloodAdd > 0 && f.bloodAddTo === 'unc' && mo.lock
      && (e && (e.t || []).includes('master'))) return { ok: true, via: 'bloodAdd@lock-income' };
  if (f.bloodAdd > 0 && f.bloodAddTo === 'own-ready' && !mo.lock && mo.phase === 'unlock'
      && (e && (e.t || []).includes('master'))) return { ok: true, via: 'bloodAdd@hunting-ground' };   // v1.1.14 (Johan's "process the hunting ground family" GO): the THIRD bloodAdd shape -- freestanding, NOT lock-gated, unlock-phase -- consumed via _considerHuntingGround (elysium-bot.js), distinct from Life in the City's one-shot handler and Dreams of the Sphinx/Arcane Library's lock-gated _considerLockIncome
  /* v1.1.3 (Johan's combat GO, steal-blood family): stealBlood is contextual, not
     blanket-'threat' -- _bestStealStrikeFor (elysium-bot.js) consumes it on a COMBAT-
     typed mode when: (a) the entry carries none of the four unverifiable timing req
     flags (beforeRangeDetermined/rangeClose/rangeLong/notFirstRound -- the v1 single-
     round, no-range architecture can't check them, so the bot never offers the card at
     all), and (b) the SAME mode doesn't also carry maneuver or press (a co-located
     bundle, not a clean isolated steal -- Diversion's "with 1 optional maneuver",
     Kraken's Kiss's granted per-round strike layered on a press). Mirrors the finder
     line for line, not re-derived independently -- a coverage CLASS map that drifts
     from its own consumer is worse than no map (the v1.1.0 bleed:'paired' lesson).   */
  if (typeof f.stealBlood === 'number' && !f.maneuver && !f.press
      && (e && (e.t || []).includes('combat'))
      && !(e && e.req && (e.req.beforeRangeDetermined || e.req.notFirstRound)))
    return { ok: true, via: 'stealBlood@strike' };
  /* v1.1.3 (Johan's combat GO, strike-bonus family): strike is contextual too, same
     shape as stealBlood exactly -- _bestStrikeFor gained the identical req-flag +
     co-located-maneuver/press guards. A blanket 'play' classification would have
     misreported Blood Fury/Cauldron of Blood/Loving Agony/Slam's superior as consumed
     the instant any of them entered a deck's coverage run.                          */
  if ((typeof f.strike === 'number' || typeof f.handBonus === 'number') && !f.maneuver && !f.press   // v1.1.37: + handBonus (Roundhouse class)
      && (e && (e.t || []).includes('combat'))
      && !(e && e.req && (e.req.beforeRangeDetermined || e.req.notFirstRound)))
    return { ok: true, via: 'strike' };
  if (f.gainOppLoss && (e && (e.t || []).includes('combat'))) return { ok: true, via: 'gainOppLoss@endOfRound' };
  if (typeof f.envDmgPerRound === 'number' && (e && (e.t || []).includes('combat'))) return { ok: true, via: 'envDmgPerRound@beforeRange' };
  if (f.restrictHandStrike && (e && (e.t || []).includes('combat'))) return { ok: true, via: 'restrictHandStrike@preStrike' };
  /* v1.1.5 (Johan's combat GO, the multi-round loop -- Press): press is contextual
     too, mirroring _bestPressFor exactly. Only the CLEAN, standalone shape
     (Apportation) is consumed -- a mode co-located with maneuver/strike/stealBlood
     is a bundled ability (Grasp of the Python, Slam's superior), documented in the
     combat plan §5.6 as a future extension, not built. */
  if (f.press && !f.maneuver && typeof f.strike !== 'number' && typeof f.handBonus !== 'number' && !f.stealBlood
      && (e && (e.t || []).includes('combat'))
      && !(e && e.req && (e.req.beforeRangeDetermined || e.req.notFirstRound)))
    return { ok: true, via: 'press@resolveCombat' };
  /* v1.1.6 (Johan's combat GO, the range concept): maneuver is contextual too, clean-
     shape-only (Apportation/Swallowed by the Night), mirroring _bestManeuverFor. NOTE
     the CASH-IN, above: rangeClose/rangeLong no longer blanket-exclude stealBlood/
     strike/press -- the bot can now maneuver to the needed range when it holds one of
     those 17 previously-excluded cards, so they are genuinely consumed, not a guess. */
  if (f.maneuver && !f.press && typeof f.strike !== 'number' && typeof f.handBonus !== 'number' && !f.stealBlood
      && (e && (e.t || []).includes('combat'))
      && !(e && e.req && (e.req.beforeRangeDetermined || e.req.notFirstRound)))
    return { ok: true, via: 'maneuver@resolveCombat' };
  /* v1.1.36 (bot v0.6.127, cardfx v1.9.0): the block bar is contextual, mirroring _bestBlockBarFor exactly -- an action MODIFIER
     whose mode bars vampires (or everyone) AND bills its own vampire (selfDmg / selfTorpor). A free bar (Beast Meld's
     'non-bleed only' superior) or a chosen / titled / allies / cond bar is tagged but NOT played. */
  if ((f.blockBar === 'vampires' || f.blockBar === 'all') && (f.selfDmg || f.selfTorpor) && scanned.has('blockBar') && (e && (e.t || []).includes('mod')))
    return { ok: true, via: 'blockBar@announce' };
  for (const k of Object.keys(f)){
    if (!scanned.has(k)) continue;                       // the bot never reads it — cannot be consumed
    if (cls(k).includes('play')) return { ok: true, via: k };
    if (cls(k) === 'income' && mo.phase){
      /* v1.1.9 (Johan's "push Inside Dirt to 100%" GO, Dreams of the Sphinx): this
         generic rule used to fire for ANY phase-tagged income key regardless of
         mechanism -- correct for _applyPhaseIncome's host-attached automatic
         triggers (Vessel/Blood Doll, no `lock`), but it was ALSO blindly claiming
         freestanding LOCK-based income (Dreams of the Sphinx, Arcane Library,
         Chantry) as consumed via the SAME path, when those actually need
         _considerLockIncome (master-typed only) instead. `mo.lock` is the real
         signal the compiler already carries -- split on it so the "via" label
         names the mechanism that ACTUALLY reads this mode, not just "some income
         reader, unspecified".                                                    */
      if (mo.lock) { if (e && (e.t || []).includes('master')) return { ok: true, via: k + '@lock-income' }; }
      else return { ok: true, via: k + '@' + mo.phase };
    }
    /* v1.1.11 (Johan's "sweep it while it's fresh" GO, hand-size family): the
       passive-permanent shape needs its OWN rule -- unlike every other income key,
       handSizePermanent modes carry no `phase` at all (no lock needed either; the
       bonus is simply active for as long as the card is in play). Consumed via
       _recomputeHandSizeBaseline + _handSizePermanentTotal (elysium-bot.js),
       scanned once per turn from whatever's freestanding on the board.          */
    if (k === 'handSize' && f.handSizePermanent) return { ok: true, via: 'handSize@permanent' };
    if (k === 'handSizePerCounter' && f.handSizePermanent) return { ok: true, via: 'handSizePerCounter@permanent' };   // v1.1.34 (bot v0.6.125): Visit from the Capuchin -- the per-counter term in _handSizePermanentTotal + _flushDraws' counter-for-replacement branch
    if ((k === 'transferSwap' || k === 'transferBurnPool') && f.transferCost > 0) return { ok: true, via: k + '@influence-loop' };
    if (cls(k) === 'gated' && e && e.attachAfterSuccess) return { ok: true, via: k + '@attach' };
    if (cls(k) === 'attached' && e && e.archetype) return { ok: true, via: k + '@archetype-master' };
  }
  return { ok: false };
}

/* v1.1.39: the keys an equipment card grants its bearer through the bearer readers -- + ranged (the gun's strike flag: the .44 Magnum and every gun
   were 'key outside the grant set' though the bot equips them and strikes with them, v0.6.211) and interceptPaid + its price interceptPaidBlood (Bowl of
   Convergence's [AUS] mode; _equipPaidIntercept reads the price as f.interceptPaidBlood, which the fx.-scan cannot see). */
const EQUIP_GRANT = ['intercept', 'prevent', 'maneuver', 'strike', 'handStrike', 'ranged', 'interceptPaid', 'interceptPaidBlood'];

/* ---------- discipline reach — mirrors Bot._modeUsableBy's gate (deck-static part) ---------- */
function modeReachableBy(mo, cryptE){
  if (!mo.at) return true;
  const d = cryptE && cryptE.disc; if (!d) return false;
  return mo.at.split('+').every(tok => tok === tok.toUpperCase()
    ? (d.sup || []).includes(tok.toLowerCase()) : (d.all || []).includes(tok.toLowerCase()));
}

/* ---------- deck input ---------- */
function parseArgs(argv){
  const o = { deck: null, out: null };
  for (let i = 2; i < argv.length; i++){
    if (argv[i] === '--out') o.out = argv[++i];
    else o.deck = argv[i];
  }
  return o;
}
function loadDeck(p){
  if (!p) return { deck: BOT.DEFAULT_DECK, source: "elysium-bot.js DEFAULT_DECK (no file given)" };
  const raw = fs.readFileSync(p, 'utf8');
  if (/\.json$/i.test(p)){
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.crypt) || !Array.isArray(d.library))
      throw new Error('playbook JSON needs {crypt:[...],library:[...]}');
    return { deck: d, source: p };
  }
  // text list: "6x Ashur Tablets" / "6 Ashur Tablets"; blanks and #/;-comments skipped;
  // crypt vs library split by where the name RESOLVES (unresolved lines land in library as findings)
  const crypt = [], library = [], unparsed = [];
  raw.split(/\r?\n/).forEach(line => {
    const t = line.trim();
    if (!t || /^[#;]/.test(t) || /^\/\//.test(t)) return;
    const m = /^(\d+)\s*[x×]?\s+(.+?)\s*$/.exec(t);
    if (!m) { unparsed.push(t); return; }
    const qty = parseInt(m[1], 10), name = m[2];
    const h = lookup(name);
    if (h && h.kind === 'crypt') crypt.push({ name, qty });
    else library.push({ name, qty });
  });
  return { deck: { name: path.basename(p).replace(/\.[^.]*$/, ''), crypt, library }, source: p, unparsed };
}

/* ---------- verdicts ---------- */
/* HANDLER      — entry names a handler AND it is registered in CARD_HANDLERS (best tier)
   FULL         — every mode is consumed and at least one is reachable by this crypt
   PARTIAL      — some (not all) modes consumed, at least one consumed mode reachable
   UNREACHABLE  — consumed effect exists, but NO deck vampire meets any consumed mode's gate
   TABLED-ONLY  — a master with no automated effect: the bot still PLAYS it blind
                  (_bestMasterFor plays any master; a human/ctrl completes the effect)
   INERT        — modes exist but none carries an fx key the bot's play paths read
   REF-TERMS    — political card whose referendum terms are compiled (e.ref.pool) but the bot has no caller yet (v1.1.31)
   NAME-ONLY    — entry exists but has zero modes and no handler/actGrant
   UNRESOLVED   — the three-tier ladder found nothing (typo / alias gap)
   HANDLER-UNREG— entry names a handler CARD_HANDLERS doesn't have (drift alarm)       */
function judgeLib(h, cryptEs){
  const e = h.e, modes = e.modes || [];
  const per = modes.map(mo => {
    const c = modeConsumed(mo, e);
    return { at: mo.at || '—', dir: mo.dir ? 'D' : '', consumed: c.ok, via: c.via || '',
             reach: cryptEs.some(ce => modeReachableBy(mo, ce)),
             fxKeys: Object.keys(mo.fx || {}).join(',') || '—' };
  });
  const consumed = per.filter(p => p.consumed);
  const reachConsumed = per.filter(p => p.consumed && p.reach);
  const isMaster = (e.t || []).includes('master');
  let verdict;
  if (e.handler) verdict = (e.handler in BOT.CARD_HANDLERS) ? 'HANDLER' : 'HANDLER-UNREG';
  else if (e.actGrant) verdict = 'FULL';                                   // entry-level, read by _recomputePhaseActs
  else if (consumed.length){
    verdict = reachConsumed.length ? (consumed.length === per.length ? 'FULL' : 'PARTIAL') : 'UNREACHABLE';
  }
  else if (e.ref && e.ref.pool) verdict = REF_CALLER ? 'FULL' : 'REF-TERMS';   // v1.1.31 (18 Sep 2026, cardfx v1.7.0): a political card with referendum terms (e.ref.pool) is playable the day the bot has a referendum caller that reads them -- detected by source scan, like everything else here
  else if (isMaster) verdict = 'TABLED-ONLY';
  else if (modes.length) verdict = 'INERT';
  else verdict = 'NAME-ONLY';
  return { verdict, per, isMaster };
}

const BUCKET = v =>
  (v === 'HANDLER' || v === 'FULL') ? 'auto' :
  (v === 'PARTIAL' || v === 'TABLED-ONLY') ? 'semi' : 'dead';

/* ---------- run ---------- */
/* v1.1.39 (bot v0.6.212): the per-card verdicts of one playbook -- the report below and gen-card-ledger.js read the SAME function, so the ledger
   cannot drift from this report. */
function coverDeck(deck){
  const cryptRows = (deck.crypt || []).map(c => {
  const h = lookup(c.name);
  const e = h && h.kind === 'crypt' ? h.e : null;
  return { name: c.name, qty: c.qty || 1, annCap: (typeof c.cap === 'number' ? c.cap : null),
           found: !!e, canon: h ? h.name : null, e };
});
const cryptEs = cryptRows.filter(r => r.e).map(r => r.e);

const libRows = (deck.library || []).map(c => {
  const h = lookup(c.name);
  if (!h) return { name: c.name, qty: c.qty || 1, verdict: 'UNRESOLVED', per: [], e: null, canon: null };
  if (h.kind === 'crypt') return { name: c.name, qty: c.qty || 1, verdict: 'IN-CRYPT?', per: [], e: h.e, canon: h.name };
  const j = judgeLib(h, cryptEs);
  return { name: c.name, qty: c.qty || 1, verdict: j.verdict, per: j.per, e: h.e, canon: h.name };
});
  return { cryptRows, cryptEs, libRows };
}

function main(){
const args = parseArgs(process.argv);
let loaded;
try { loaded = loadDeck(args.deck); }
catch (e){ console.error('gen-deck-coverage: ' + e.message); process.exit(1); }
const deck = loaded.deck;
const { cryptRows, libRows } = coverDeck(deck);

const totCopies = libRows.reduce((s, r) => s + r.qty, 0);
const byBucket = { auto: 0, semi: 0, dead: 0 };
libRows.forEach(r => { byBucket[BUCKET(r.verdict)] += r.qty; });
const vCount = {};
libRows.forEach(r => { vCount[r.verdict] = (vCount[r.verdict] || 0) + r.qty; });

/* crypt informational checks */
const capMismatch = cryptRows.filter(r => r.found && r.annCap != null &&
  typeof r.e.cap === 'number' && r.e.cap !== r.annCap);
const groups = [...new Set(cryptRows.filter(r => r.e && /^\d+$/.test(String(r.e.group || '')))
  .map(r => parseInt(r.e.group, 10)))].sort((a, b) => a - b);
const groupSpanBad = groups.length > 1 && (groups[groups.length - 1] - groups[0]) > 1;
const cryptCopies = cryptRows.reduce((s, r) => s + r.qty, 0);

/* ---------- report ---------- */
const L = []; const P = s => L.push(s);
const today = new Date().toISOString().slice(0, 10);
const badge = e => [e.src === 'hand' ? 'curated' : 'auto',
                    e.persistent ? 'persist' : '', e.trifle ? 'trifle' : '',
                    e.actGrant ? 'actGrant' : '', e.handler ? ('handler:' + e.handler) : '']
                   .filter(Boolean).join(' · ');

P('# deck-coverage — ' + (deck.name || '(namnlös lek)') + ' (' + today + ')');
P('');
P('Genererad av `gen-deck-coverage.js` v1.1.39 mot `elysium-cardfx.json` (fxv ' + 1 +   // 27 July: this string is the SECOND version site (the header comment is the first) -- bump BOTH when a version note is added, or every generated report inherits a stale self-identification
  ', ' + (fx.counts.lib || '?') + ' lib / ' + (fx.counts.crypt || '?') + ' crypt / ' +
  (fx.counts.alias || '?') + ' alias) och den KONSUMTION `elysium-bot.js` faktiskt läser i källkoden ' +
  '(skannad vid körning, inte handunderhållen). Leken: ' + loaded.source + '.');
P('');
P('Syfte: göra "kan botten spela den här leken?" till en mekanisk kontroll — curated-djup och');
P('handlers budgeteras per lek, aldrig som databas-completionism. Detta är en RAPPORT, inte en gate.');
P('');
P('## Sammanfattning (qty-viktad, ' + totCopies + ' bibliotekskopior)');
P('');
P('| Hink | Kopior | Andel |');
P('|---|---:|---:|');
P('| Automatiserade (HANDLER/FULL) | ' + byBucket.auto + ' | ' + Math.round(100 * byBucket.auto / (totCopies || 1)) + '% |');
P('| Delvis (PARTIAL/TABLED-ONLY) | ' + byBucket.semi + ' | ' + Math.round(100 * byBucket.semi / (totCopies || 1)) + '% |');
P('| Ej spelbara av botten idag | ' + byBucket.dead + ' | ' + Math.round(100 * byBucket.dead / (totCopies || 1)) + '% |');
P('');
P('Per verdict: ' + Object.entries(vCount).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
P('');
P('## Konsumtionsläget (skannat ur bottens källa vid körning)');
P('');
P('- Spel-nycklar botten läser: `' + consumedPlayKeys.join('`, `') + '`');
P('- Fas-inkomst (kräver `phase` på moden): `' + consumedIncomeKeys.join('`, `') + '`');
P('- Hotläsning (motståndarkort, gör ALDRIG egna kort spelbara): `' + threatKeys.join('`, `') + '`');
if (unknownScanned.length)
  P('- ⚠ OKLASSADE nycklar hittade i botkällan (uppdatera CLASS-kartan i verktyget): `' + unknownScanned.join('`, `') + '`');
P('');

P('## Bibliotek (' + libRows.length + ' unika, ' + totCopies + ' kopior)');
P('');
P('| Kort | Qty | Verdict | Modes (at → fx → konsumerad/nåbar) | Taggar |');
P('|---|---:|---|---|---|');
libRows.forEach(r => {
  const modes = r.per.length
    ? r.per.map(p => '[' + p.at + (p.dir ? ' D' : '') + '] ' + p.fxKeys + ' → ' +
        (p.consumed ? '✓' + (p.via ? '(' + p.via + ')' : '') : '—') + '/' + (p.reach ? '✓' : '✗')).join('<br>')
    : '—';
  P('| ' + (r.canon || r.name) + ' | ' + r.qty + ' | ' + r.verdict + ' | ' + modes + ' | ' +
    (r.e ? badge(r.e) : '—') + ' |');
});
P('');

P('## Crypt (' + cryptRows.length + ' unika, ' + cryptCopies + ' kopior)');
P('');
P('| Vampyr | Qty | Cap (annoterad/cardfx) | Unik | Grupp | Discipliner (sup i VERSALER) |');
P('|---|---:|---|---|---|---|');
cryptRows.forEach(r => {
  if (!r.found){ P('| ' + r.name + ' | ' + r.qty + ' | ?/? | ? | ? | UNRESOLVED |'); return; }
  const d = r.e.disc || { all: [], sup: [] };
  const disc = (d.all || []).map(x => (d.sup || []).includes(x) ? x.toUpperCase() : x).join(' ') || '—';
  P('| ' + r.canon + ' | ' + r.qty + ' | ' + (r.annCap != null ? r.annCap : '—') + '/' +
    (typeof r.e.cap === 'number' ? r.e.cap : '?') +
    (r.annCap != null && typeof r.e.cap === 'number' && r.annCap !== r.e.cap ? ' ⚠' : '') +
    ' | ' + (r.e.unique === false ? 'nej' : 'ja') + ' | ' + (r.e.group || '—') + ' | ' + disc + ' |');
});
P('');
if (capMismatch.length)
  P('⚠ Cap-drift playbook vs cardfx: ' + capMismatch.map(r => r.canon + ' (' + r.annCap + '≠' + r.e.cap + ')').join(', ') + '.');
if (groupSpanBad)
  P('⚠ Grupp-spann ' + groups[0] + '–' + groups[groups.length - 1] + ' (>2 konsekutiva grupper) — informativt, sandboxen dömer inte.');
if (cryptCopies < 12)
  P('ℹ Crypt har ' + cryptCopies + ' kopior (turneringsminimum är 12) — informativt.');
P('');

const queue = libRows.filter(r => !(r.verdict === 'FULL' || r.verdict === 'HANDLER'))
                     .sort((a, b) => b.qty - a.qty);
P('## Kurationskö (allt som inte är FULL/HANDLER, qty-fallande)');
P('');
if (!queue.length) P('Tom — hela biblioteket är automatiserat. 🎉');
else {
  P('| Kort | Qty | Verdict | Föreslaget nästa steg |');
  P('|---|---:|---|---|');
  queue.forEach(r => {
    const step =
      r.verdict === 'UNRESOLVED'   ? 'namnet löser inte i tre-stegs-stegen — stavning/alias' :
      r.verdict === 'IN-CRYPT?'    ? 'bibliotekesraden löser till ett CRYPT-kort — lekfilsfel?' :
      r.verdict === 'NAME-ONLY'    ? 'curate:a modes (auto-tiern extraherade inget)' :
      r.verdict === 'REF-TERMS'    ? 'referendum-villkoren finns i cardfx (ref.pool) — väntar på bottens referendum-anropare (_callReferendum + _refDeltas)' :
      r.verdict === 'INERT'        ? (() => {   // v1.1.0: split unread keys from gated/paired ones -- 'utöka konsumenten' is WRONG advice for actStealth/stealthLater-without-attach (deliberately non-playable by the fas B/C misplay guard)
        const ks = [...new Set(r.per.flatMap(p => p.fxKeys.split(',')))].filter(k => k && k !== '—');
        const unread = ks.filter(k => !scanned.has(k));
        const guarded = ks.filter(k => scanned.has(k) && !cls(k).includes('play') && cls(k) !== 'income');
        const bits = [];
        if (unread.length) bits.push('fx-nycklar botten inte läser (' + unread.join(', ') + ') — utöka konsumenten eller acceptera som död vikt');
        if (guarded.length) bits.push('nycklar som är AVSIKTLIGT icke-spelbara i denna form (' + guarded.join(', ') + ': gated/paired — felspelsvakten, inte ett konsumentgap)');
        return bits.join('; ') || 'inga konsumerade moder';
      })() :
      r.verdict === 'UNREACHABLE'  ? 'konsumerad effekt finns men INGEN vampyr i leken når disciplin-gaten — lekfråga, inte kodfråga' :
      r.verdict === 'TABLED-ONLY'  ? 'spelas blint som master; phase-inkomst/handler om effekten ska automatiseras' :
      r.verdict === 'HANDLER-UNREG'? 'entryt pekar på en handler som INTE finns i CARD_HANDLERS — drift!' :
      /* PARTIAL */                  'okonsumerade modes: ' + r.per.filter(p => !p.consumed).map(p => '[' + p.at + '] ' + p.fxKeys).join('; ');
    P('| ' + (r.canon || r.name) + ' | ' + r.qty + ' | ' + r.verdict + ' | ' + step + ' |');
  });
}
P('');
P('## Antaganden (uttalade, inte tysta)');
P('');
P('- Spelkontext simuleras inte: numerisk `fx.stealth` räknas som konsumerad varhelst den står,');
P('  eftersom `_bestStealthFor` själv inte typ-gatar idag (verktyget speglar konsumenten troget).');
P('- 2-spelar-bounce-dödheten (`_modeUsableBy`s bordsstrukturella koll) är bordstillstånd, inte lekegenskap — utanför scope.');
P('- `poolGain`/`bloodToPool` räknas bara med `phase` på moden (speglar `_applyPhaseIncome`s v1-kontrakt).');
P('- `actGrant` läses på ENTRY-nivå (så läser `_recomputePhaseActs` — actGrant-doc-drift-läxan).');
if (loaded.unparsed && loaded.unparsed.length){
  P('');
  P('⚠ Oparsade rader i textleken (varken antal+namn eller kommentar): ' + loaded.unparsed.map(s => '`' + s + '`').join(', '));
}
P('');

const outPath = args.out || ('deck-coverage-' +
  String(deck.name || 'deck').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) + '.md');
fs.writeFileSync(outPath, L.join('\n') + '\n');
console.log('deck-coverage: ' + (deck.name || '(namnlös)') + ' — ' + totCopies + ' bibliotekskopior: ' +
  byBucket.auto + ' auto / ' + byBucket.semi + ' delvis / ' + byBucket.dead + ' ej spelbara' +
  (unknownScanned.length ? '  ⚠ oklassade fx-nycklar: ' + unknownScanned.join(',') : ''));
console.log('rapport: ' + outPath);
}

if (require.main === module) main();
module.exports = { lookup, judgeLib, modeConsumed, modeReachableBy, coverDeck, loadDeck, BUCKET, CLASS, EQUIP_GRANT, scanned, unknownScanned, fx, VERSION: '1.1.39' };
