#!/usr/bin/env node
'use strict';
/* gen-card-ledger.js v1.2.2 (20 Nov 2026, cardfx compiler v1.10.0: a merged entry's tier reads `curated, merged`, spec-card-sweep §4.4;
   v1.2.1 19 Nov 2026: the Sim line names the client the table ran on -- the queued bridge of client v2.6.177 moved
   the uses with no bot change; v1.2.0 19 Nov 2026, bot v0.6.234, RULINGS D-125: the whole library's verdicts and the effect vocabulary;
   v1.1.3 14 Nov 2026, bot v0.6.228: the verdict asks a mode for every discipline line of KRCG's text -- coverage v1.1.47;
   v1.1.2 13 Nov 2026, bot v0.6.221: a master pick counts only when it was played; v1.1.1 12 Nov, bot v0.6.219;
   v1.1.0 6 Nov, bot v0.6.217, RULINGS D-108) -- THE CARD LEDGER: one generated row per library card of a deck set
   (default: the V5 precons) and every vampire of their crypts, so a V5 round has a definition of done ("these rows turn playable")
   instead of a feeling.

   THE LIBRARY (v1.0.0, 29 Oct 2026, bot v0.6.212). A row joins four sources, each read by the code that owns it:
   - the VERDICT: gen-deck-coverage.js's own coverDeck() (the three-tier name ladder, the bot's consumed fx keys, the discipline reach) --
     the same function the per-deck reports use, so the ledger cannot drift from them;
   - the TIER: curated (cardfx `src: 'hand'`; `curated, merged` when the hand entry is a layer merged over the compiled one, v1.2.2), auto,
     or handler; the RULINGS count from vtes.json (when it is beside the script);
   - the SUITE: the test-bot-logic.js sections that name the card (a section starts at its `/* NNN)` marker);
   - USES in the sim (any number of --sim DIRs): the decisions that play the card from hand (`decide` action / master-play picks) plus
     every card play the bot emits in a window (`play` rows: stealth, intercept, combat, modifiers, votes ...), per deck from the
     manifests (CLAUDE.md, traces: never from a name), against the number of matches that deck sat in.
   Status: playable = FULL / HANDLER and played at least once in the sim · unseen = FULL / HANDLER, its decks sat, never played (a
   pricing question before a bug, LESSONS L-9) · not seated = FULL / HANDLER, but no deck that carries it sat in the sims given ·
   partial = PARTIAL / TABLED-ONLY / UNREACHABLE · inert = INERT / NAME-ONLY / REF-TERMS / HANDLER-UNREG · unresolved = the ladder
   found nothing (or a verdict this file does not know: never playable). Without a sim, FULL / HANDLER is "playable (static)". A bot's deck comes from the result row's `bots[].deck` (the
   sim's spec, whatever the profile), else its manifest: under --profile arena a bot gets no deckName, so a deck the bot does not embed
   has no key in its manifest.
   The class map: every non-playable row's unconsumed fx keys, weighted by copies -- what is left in the starters, by effect.

   THE WHOLE LIBRARY (v1.2.0; RULINGS D-125, docs/specs/spec-card-sweep-2026-11-18.md 4.1). The sweep goes by SHARING: an effect a starter's
   card prints is asked who else in the library prints it, so the page also counts what lies outside the starters. Every library entry of
   the cardfx gets the same verdict (COV.judgeLib), with every vampire of the cardfx offered as the crypt and the card text's checks on when
   vtes.json is here -- counted by tier and by card type, a summary and not a row per card. The vocabulary counts the effect keys (the
   keys of a mode's `fx` and of `ref.fx`): on library entries, in the coverage tool's scan of the bot (the keys spelled `fx.<key>`; a
   key the bot reads as `f.<key>` or `mo.fx[k]` is not in it), given by the compiler (a compile without the curated file: needs
   vtes.json), carried by hand entries only -- and for those the sharing register's states (cardfx-sharing.js; test-cardfx.js is its
   gate). Static: no sim reads an entry here, and a verdict says what the code CAN do.

   THE CRYPT (v1.1.0). Every vampire of the same decks, read from KRCG's text (vtes.json beside the script; without it the crypt is not
   read and the page says so): a row for each vampire with an ability, the sect-and-title-only ones listed per deck. The ability is the
   text after the sect and title ("Camarilla Prince of Buenos Aires: +1 bleed." -> "+1 bleed."); a title alone is data the bot already
   reads (cardfx `title` / `votes`, R-31). Each sentence gets an effect class (bleed, strength, intercept, stealth, votes, hand size,
   action, combat, block, unlock, blood/pool, cards, other) and a kind (passive = a bare "+1 bleed." · activated = "... can ..." ·
   conditional = the rest: a condition, a toll, a grant). The CRYPT READERS are scanned from elysium-bot.js: every `this._cryptFxOf(`
   call and the `fx.<key>` its statement reads, with the method it sits in -- the mechanism that reads the key.
   Status: no ability · modelled = a curated crypt `fx` whose every key a crypt reader reads and whose keys' classes (FX_CLASS) cover
   every sentence's class · partial = a key no crypt reader reads, or a sentence no key covers (the row says which) · unmodelled = an
   ability and no `fx` · unresolved = no KRCG text for the name. The crypt class map weighs the sentences no key covers by copies -- what
   a crypt wave would build. FX_CLASS gives every curated crypt key the class a curator reads in its sentence; the page checks the
   classifier against every curated crypt entry, and a miss or a curated key with no class fails the run (exit 1, the page still
   written) -- so a wave declares the class of each new key. The self-test (fixed texts: the extraction, the classifier, the readers'
   scan, the status) runs before every page; a failure writes no page.

   Usage (from inside bot/): node gen-card-ledger.js [--decks k1,k2,...] [--sim DIR]... [--out docs/CARDS.md] | --self-test
     default decks: every deck-*.json whose name starts with "V5 " (gen-precon.js writes them).                                         */

const fs = require('fs'), path = require('path');
const LEDGER_VERSION = '1.2.2';   // v1.2.2 (20 Nov 2026, cardfx v1.10.0): a merged entry's tier is `curated, merged` (the census counts it curated)   // v1.2.1 (19 Nov 2026): the Sim line names the client   // v1.2.0 (19 Nov 2026, bot v0.6.234, RULINGS D-125): the whole library and the vocabulary   // v1.1.3 (14 Nov 2026, bot v0.6.228, round F): the discipline-line check (COV.coverDeck's textOf: KRCG's text when vtes.json is here)   // v1.1.2 (13 Nov 2026, bot v0.6.221): a master pick counts only when played; v1.1.1 (12 Nov 2026, bot v0.6.219, crypt wave A): FX_CLASS gains strikeDodge

/* ---- the crypt (v1.1.0): the ability text, its effect classes, the readers that model it ---- */
const SECT = '(?:Anarch|Camarilla|Independent|Sabbat|Laibon)';
function cryptAbility(text){   // the printed ability after the sect / title prefix; '' when the card is sect (and title) only
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (new RegExp('^' + SECT + '\\b[^:.]*\\.$').test(t)) return '';                 // "Camarilla." / "Camarilla Prince of Cape Town."
  const m = new RegExp('^' + SECT + '\\b[^:]*?:\\s*(.+)$').exec(t);                // "Camarilla Prince of Buenos Aires: +1 bleed." (the FIRST colon)
  return (m ? m[1] : t).trim();
}
const NUM = /([+-]\d+) (bleed|strength|intercept|stealth|votes?|hand size)\b/gi;
function cryptSentences(ability){ return String(ability || '').split(/(?<=\.)\s+(?=[A-Z0-9+\-"Ü])/).map(s => s.trim()).filter(Boolean); }
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function cryptClassOf(s, name){   // one sentence -> { classes: [...], kind } (the first rule that matches; numeric effects may name two classes)
  const t = s.toLowerCase();
  const kind = /^[+-]\d+ (bleed|strength|intercept|stealth|votes?|hand size)\.?$/.test(t) ? 'passive' : /\bcan\b/.test(t) ? 'activated' : 'conditional';
  const norm = n => n.toLowerCase().replace(/^votes?$/, 'votes');
  if (/\bcan\b.*\bas an? (\+\d+ stealth )?(Ⓓ |\(d\) )?action\b/i.test(s)) return { classes: ['action'], kind };   // "X can ... as a +1 stealth action"; "must bleed ... as a Ⓓ action" is a bleed
  const nums = [...s.matchAll(NUM)].map(m => norm(m[2]));
  if (nums.length) return { classes: [...new Set(nums)], kind };
  /* what the sentence DOES: without a card's name (<Giant's Blood>) and the vampire's own name (New Blood); a phase is its timing ("your
     unlock phase", "your discard phase,"), which the rules below never read as the effect */
  const own = String(name || '').split(/[^\p{L}'’]+/u).filter(w => w.length >= 3 && /^\p{Lu}/u.test(w));
  let e = s.replace(/<[^>]*>/g, ' ');
  if (own.length) e = e.replace(new RegExp('(^|[^\\p{L}])(?:' + own.map(reEsc).join('|') + ')(?=[^\\p{L}]|$)', 'gu'), '$1');
  e = e.toLowerCase();
  if (/\bunlock\b(?! phase)/.test(e)) return { classes: ['unlock'], kind };                                       // "unlocked" (a state) is not an unlock
  if (/\bcosts?\b[^.]*?(\badditional blood\b|[+-]?\d+ blood\b)/.test(e)) return { classes: ['blood/pool'], kind };   // a price ("cost Antoinette an additional blood")
  if (/strike|combat|\bpress\b|maneuver|\brange\b/.test(e)) return { classes: ['combat'], kind };
  if (/\bblock/.test(e)) return { classes: ['block'], kind };
  if (/\bvotes?\b|ballot|referendum/.test(e)) return { classes: ['votes'], kind };
  if (/\bblood\b|\bpool\b|\bhunt/.test(e)) return { classes: ['blood/pool'], kind };
  if (/discard phase action|\blibrary\b|ash heap|\bhand\b|\bdraws?\b|\breplace\b/.test(e)) return { classes: ['cards'], kind };
  return { classes: ['other'], kind };
}
/* FX_CLASS: the class a curator reads in the sentence a curated crypt key models (an array when one key models two). Every curated crypt
   key needs one: the page checks the classifier against it, and a key with none fails the run -- a wave adds its new keys here. */
const FX_CLASS = { bleedBonus: 'bleed', bleedBoostDiscard: 'bleed', interceptMod: 'intercept', stealthMod: 'stealth', noHuntStealth: 'stealth', strengthMod: 'strength',
  strengthOnDiablerie: 'strength', voteBoostDiscard: 'votes', voteTaxAgainst: 'votes', selfUnlock: 'unlock', noUnlockAfterTitledBleed: 'unlock', blockNotOlder: 'block',
  burnAtDamage: 'combat', burnOnTorpor: 'other', costPlusDisc: 'blood/pool', selfRemoveOption: 'blood/pool', fetchNamed: 'cards', enterPlay: 'cards', noReplaceActing: 'cards',
  strikeDodge: 'combat' };   // v1.1.1 (bot v0.6.219, crypt wave A): Flávio Gonçalves's and Phaibun's once-each-combat strike: dodge
const classesOf = k => [].concat(FX_CLASS[k] || []);
/* the crypt readers: fx key -> the bot's methods that read it from a crypt entry -- every `fx.<key>` in the statement of a
   `this._cryptFxOf(` call (its line and the next three, up to the next method; the local is named `fx` by the bot's own rule) */
function cryptReaders(src){
  const lines = String(src || '').split('\n'), out = new Map();
  const DEF = /^ {2}(?!(?:if|for|while|switch|catch|function|return)\b)(?:async )?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/;
  let method = '?';
  lines.forEach((line, i) => {
    const d = DEF.exec(line); if (d) method = d[1];
    if (line.indexOf('this._cryptFxOf(') < 0) return;
    for (let j = i; j < Math.min(lines.length, i + 4); j++){
      if (j > i && DEF.test(lines[j])) break;
      for (const m of lines[j].matchAll(/(?<![\w$.])fx\.([A-Za-z_$][\w$]*)/g)){ if (!out.has(m[1])) out.set(m[1], new Set()); out.get(m[1]).add(method); }
    }
  });
  return out;
}
/* a crypt row's status: modelled = every curated key read by a crypt reader AND every sentence covered -- each read key covers ONE sentence
   (Marchesa Liliana's two bleed sentences need two keys), the best fit first (the key whose classes match the sentence's most closely), the
   passive sentences first (a simple key models the simple form: with one bleed key Marchesa's missing sentence is her activated one) */
function cryptStatusOf(x, readers){
  if (!x.kc) return { status: 'unresolved', unread: [], uncovered: [] };
  if (!x.ability) return { status: 'no ability', unread: [], uncovered: [] };
  if (!x.fxk.length) return { status: 'unmodelled', unread: [], uncovered: x.parts };
  const unread = x.fxk.filter(k => !readers.has(k)), free = x.fxk.filter(k => readers.has(k)), uncovered = [];
  const KIND = ['passive', 'conditional', 'activated'];
  for (const p of x.parts.slice().sort((a, b) => KIND.indexOf(a.kind) - KIND.indexOf(b.kind))){
    const need = new Set(p.classes);
    while (need.size){
      const fit = k => { const cs = classesOf(k); return [cs.filter(c => need.has(c)).length, -cs.filter(c => !need.has(c)).length]; };
      const best = free.filter(k => fit(k)[0] > 0).sort((a, b) => fit(b)[0] - fit(a)[0] || fit(b)[1] - fit(a)[1])[0];
      if (!best) break;
      classesOf(best).forEach(c => need.delete(c)); free.splice(free.indexOf(best), 1);
    }
    if (need.size) uncovered.push(p);
  }
  uncovered.sort((a, b) => x.parts.indexOf(a) - x.parts.indexOf(b));
  return { status: unread.length || uncovered.length ? 'partial' : 'modelled', unread, uncovered };
}
/* v1.1.2 (13 Nov 2026, the BOARD's measurement debt of 6 Nov: Grand Ball read 407 picks, 68 plays): the master loop's decide row comes
   BEFORE its hold checks (no host, no target, unique in play ...), so a pick is a play only when the card left the hand -- the next
   decide row of that bot holds fewer copies (Villein's own decide comes first: skipped), or a row of that bot names the card before it
   (a `play` row, Grand Ball's own row). Limit: a replacement drawn before that row and of the same name hides a play (about 1 in 17 of
   Grand Ball's on 600 matches). No bot change. */
function masterPlayed(lines, i, name){
  const r = lines[i], h0 = ((r && r.data && r.data.hand) || []).filter(x => x === name).length;
  for (let k = i + 1; k < lines.length; k++){ const x = lines[k]; if (!x || x.bot !== r.bot) continue;
    if (x.type !== 'decide'){ if ((x.type === 'play' && x.data && x.data.card === name) || (x.type === 'grand-ball' && name === 'Toreador Grand Ball')) return true; continue; }
    if (x.data && x.data.q === 'villein') continue;
    return ((x.data && x.data.hand) || []).filter(y => y === name).length < h0; }
  return false;   // no later decide row of that bot: the match ended before it -- not counted
}
/* ---- the whole library (v1.2.0): every library entry's verdict by tier and by type, and the effect vocabulary ---- */
const VERDICTS = ['FULL', 'HANDLER', 'PARTIAL', 'TABLED-ONLY', 'UNREACHABLE', 'INERT', 'NAME-ONLY', 'REF-TERMS', 'HANDLER-UNREG', 'UNRESOLVED', 'IN-CRYPT?'];   // the tables' order: by status, as statusOf groups them
const VERDICT_NOTE = { 'TABLED-ONLY': 'a master played blind', UNREACHABLE: 'its consumed modes are at a level no vampire prints', INERT: 'modes, none with a key a play path reads', 'NAME-ONLY': 'no modes',
  'REF-TERMS': 'referendum terms, no caller', 'HANDLER-UNREG': 'a handler the bot does not have' };   // gen-deck-coverage.js's own definitions, in short
const TIERS = ['auto', 'curated', 'handler'];
const tierOf = e => e ? (e.handler ? 'handler' : e.src === 'hand' ? 'curated' : 'auto') : '\u2014';
const tierLabel = e => tierOf(e) + (e && e.src === 'hand' && e.merged === true ? ', merged' : '');   // v1.2.2 (spec-card-sweep §4.4): a row's tier; the census keeps the three tiers
function libCensus(lib, verdictOf){   // lib: { name: entry }; verdictOf(name, entry) -> a verdict. Counts by verdict x tier and by type x verdict
  const byVerdict = {}, byType = {}; let n = 0;
  for (const name of Object.keys(lib || {})){
    const e = lib[name], v = verdictOf(name, e), tier = tierOf(e), ty = ((e && e.t) || []).join('/') || '\u2014';
    const a = byVerdict[v] || (byVerdict[v] = { n: 0, auto: 0, curated: 0, handler: 0 }), b = byType[ty] || (byType[ty] = { n: 0 });
    n++; a.n++; a[tier]++; b.n++; b[v] = (b[v] || 0) + 1;
  }
  const verdicts = VERDICTS.filter(v => byVerdict[v]).concat(Object.keys(byVerdict).filter(v => !VERDICTS.includes(v)).sort());   // a verdict this file does not know is still counted
  return { n, byVerdict, byType, verdicts };
}
function libVocabulary(lib, crypt, scanned, keysOf){   // the effect keys on library entries against the bot's scanned `fx.<key>` reads
  const keys = new Set(), cryptKeys = new Set();
  for (const name of Object.keys(lib || {})) for (const k of keysOf(lib[name])) keys.add(k);
  for (const name of Object.keys(crypt || {})) for (const k of Object.keys((crypt[name] && crypt[name].fx) || {})) cryptKeys.add(k);
  const sc = [...scanned];
  return { keys: keys.size, read: sc.filter(k => keys.has(k)).length, unread: [...keys].filter(k => !scanned.has(k)).sort(),
    scanned: sc.length, scannedCrypt: sc.filter(k => !keys.has(k) && cryptKeys.has(k)).length, scannedNowhere: sc.filter(k => !keys.has(k) && !cryptKeys.has(k)).sort() };
}
function cryptSelfTest(quiet){   // returns the number of failed checks; quiet = print the failures only
  let of = 0, bad = 0;
  const eq = (a, b, what) => { of++; if (JSON.stringify(a) === JSON.stringify(b)) return; bad++; console.error('gen-card-ledger self-test FAIL ' + what + ': ' + JSON.stringify(a) + ' != ' + JSON.stringify(b)); };
  const C = (s, name) => cryptClassOf(s, name);
  // the extraction: the sect and title go, the FIRST colon ends them, every sect
  eq(cryptAbility('Camarilla.'), '', 'sect only');
  eq(cryptAbility('Camarilla Prince of Cape Town.'), '', 'sect and title only');
  eq(cryptAbility('Camarilla Prince of Buenos Aires: +1 bleed.'), '+1 bleed.', 'a title and an ability');
  eq(cryptAbility('Camarilla Banu Haqim Justicar: Once each combat, Kasim can discard a card.'), 'Once each combat, Kasim can discard a card.', 'a justicar');
  eq(cryptAbility('Anarch Baron of Manaus: Adrino gets 1 press (mandatory) each combat, only usable to continue combat.'), 'Adrino gets 1 press (mandatory) each combat, only usable to continue combat.', 'a baron');
  eq(cryptAbility('Camarilla Prince of São Paulo: Once each combat, Flávio can strike: dodge.'), 'Once each combat, Flávio can strike: dodge.', 'a colon inside the ability');
  eq(cryptAbility('Sabbat bishop: Kalyani gets -1 stealth when hunting. +1 strength.'), 'Kalyani gets -1 stealth when hunting. +1 strength.', 'a Sabbat title');
  eq(cryptAbility('Sabbat Archbishop of Gdansk: Agnieszka can burn 1 blood to strike: combat ends. +1 bleed.'), 'Agnieszka can burn 1 blood to strike: combat ends. +1 bleed.', 'a Sabbat archbishop, a colon inside');
  eq(cryptAbility('Independent: Abaddon gets 1 optional maneuver and 1 optional press each combat.'), 'Abaddon gets 1 optional maneuver and 1 optional press each combat.', 'Independent');
  eq(cryptAbility('Sabbat.'), '', 'Sabbat only');
  eq(cryptAbility('Laibon magaji: +1 strength.'), '+1 strength.', 'Laibon');
  eq(cryptSentences('If Nonu Dis is ready during your master phase, you can add 1 blood. +1 bleed.'), ['If Nonu Dis is ready during your master phase, you can add 1 blood.', '+1 bleed.'], 'two sentences');
  // the classifier: every rule, the kinds, the dedup
  eq(C('+1 bleed.'), { classes: ['bleed'], kind: 'passive' }, 'a passive bleed');
  eq(C('+1 strength.'), { classes: ['strength'], kind: 'passive' }, 'a passive strength');
  eq(C('+1 intercept.'), { classes: ['intercept'], kind: 'passive' }, 'a passive intercept');
  eq(C('+1 hand size.'), { classes: ['hand size'], kind: 'passive' }, 'a passive hand size');
  eq(C('Kalyani gets -1 stealth when hunting.'), { classes: ['stealth'], kind: 'conditional' }, 'a minus stealth');
  eq(C('While your predator controls more ready minions than you, you get +1 hand size.'), { classes: ['hand size'], kind: 'conditional' }, 'a conditional hand size');
  eq(C('Bret gets -1 intercept against titled vampires.'), { classes: ['intercept'], kind: 'conditional' }, 'a conditional intercept');
  eq(C('Azucena gets +1 intercept against younger Lasombra and -1 intercept against older Lasombra.'), { classes: ['intercept'], kind: 'conditional' }, 'one class twice is one class');
  eq(C('While your prey has 10 or fewer pool, Üresség gets +1 vote and +1 bleed.'), { classes: ['votes', 'bleed'], kind: 'conditional' }, 'two numeric effects');
  eq(C('Once each combat, Flávio can strike: dodge.'), { classes: ['combat'], kind: 'activated' }, 'a dodge strike');
  eq(C('Sakhar can search your library for an equipment card, reveal it and move it to your hand as a +1 stealth action.'), { classes: ['action'], kind: 'activated' }, 'an action, not a stealth');
  eq(C('Theo can enter combat with a minion as a Ⓓ action.'), { classes: ['action'], kind: 'activated' }, 'a combat action');
  eq(C('If you control a locked minion, Elen must bleed with +1 bleed as a Ⓓ action unless she must hunt.'), { classes: ['bleed'], kind: 'conditional' }, 'a forced bleed is not an action');
  eq(C('Minions must burn 1 blood or life to attempt to block Jürgen.'), { classes: ['block'], kind: 'conditional' }, 'a block toll');
  eq(C('You can unlock Sybren after a referendum called by him passes.'), { classes: ['unlock'], kind: 'activated' }, 'an unlock before votes');
  eq(C('Vampires must burn 1 blood to cast votes and ballots against referendums called by Alexander.'), { classes: ['votes'], kind: 'conditional' }, 'votes before blood');
  eq(C('Rescuing a vampire from torpor costs Doc Martina -1 blood.'), { classes: ['blood/pool'], kind: 'conditional' }, 'a price');
  eq(C('Action cards and strike cards that require Celerity [cel] cost Antoinette an additional blood.'), { classes: ['blood/pool'], kind: 'conditional' }, 'a price before a strike');
  eq(C('After Gostoso successfully bleeds your prey (for 1 or more), he can gain 1 blood.'), { classes: ['blood/pool'], kind: 'activated' }, 'a blood gain');
  eq(C('Strike cards cost opposing younger vampires +1 blood.'), { classes: ['blood/pool'], kind: 'conditional' }, 'a price on strike cards (Algirdas)');
  eq(C('Once each turn, after resolution of an action performed by Věnceslava during which your prey burned 1 or more pool, you can gain 1 pool.'), { classes: ['blood/pool'], kind: 'activated' }, 'a pool gain');
  eq(C('During an action Gathii performs, you can reveal the top card of your library.'), { classes: ['cards'], kind: 'activated' }, 'a library');
  eq(C("Once each turn, if Ilonka is ready after a successful bleed against you, she can look at the acting minion's controller's hand, then she can discard 1 card at random from it."), { classes: ['cards'], kind: 'activated' }, 'a hand');
  eq(C('When Skidmark is acting, you do not replace any cards you play until the end of the action.'), { classes: ['cards'], kind: 'conditional' }, 'a card replacement');
  eq(C('If Aemilius is ready during your unlock phase, your prey chooses a ready minion they control; the chosen minion takes 1 unpreventable damage.'), { classes: ['other'], kind: 'conditional' }, 'an unlock-phase timing is not an unlock');
  eq(C('If Roy is unlocked during your discard phase, lock him.'), { classes: ['other'], kind: 'conditional' }, 'a self-lock is not an unlock or a card');
  eq(C('If Sreelekha is ready at the start of your discard phase, you get +1 discard phase action.'), { classes: ['cards'], kind: 'conditional' }, 'a discard phase action is a card');
  eq(C("Dan may take an action to allow you to go though your library, find <Giant's Blood>, and take it into your hand."), { classes: ['cards'], kind: 'conditional' }, "a card's name says nothing");
  eq(C('As New Blood enters play during your influence phase, choose any circle and draw 1 card from your crypt.', 'New Blood'), { classes: ['cards'], kind: 'conditional' }, "the vampire's own name says nothing");
  eq(C('As New Blood enters play during your influence phase, choose any circle and draw 1 card from your crypt.'), { classes: ['blood/pool'], kind: 'conditional' }, 'the name strip is what reads it (negative control)');
  // the readers' scan: a `fx.<key>` in a _cryptFxOf statement, its method; a library mode's `mo.fx.<key>` and the next method are not
  const src = ['class X {', '  _cryptA(v){ const fx = v && this._cryptFxOf(v.name); return (fx && fx.bleedBonus) | 0; }', '  _other(){ const fx = {}; return fx.strengthMod; }',
    '  _torpor(v){', '    const fx = this._cryptFxOf(v.name);', '    if(fx && fx.burnOnTorpor) v.zone = 0;', '    if(mo.fx.press) return 1;', '  }', '  _lib(mo){ return mo.fx.dodge; }', '}'].join('\n');
  const rd = cryptReaders(src);
  eq([...rd.keys()].sort(), ['bleedBonus', 'burnOnTorpor'], 'the readers: two crypt keys, no library key, not the next method\'s fx');
  eq([...(rd.get('burnOnTorpor') || [])], ['_torpor'], 'the reader of a multi-line statement');
  // the status: every key read AND every sentence covered (a two-sentence vampire with one key is partial; a library key is no crypt reader)
  const R = new Map([['bleedBonus', new Set(['_cryptBleedBonus'])]]), P = s => Object.assign({ s }, cryptClassOf(s));
  const row = (ability, fxk) => ({ kc: {}, ability, parts: cryptSentences(ability).map(P), fxk });
  eq(cryptStatusOf(row('+1 bleed.', ['bleedBonus']), R).status, 'modelled', 'one sentence, its key read');
  const sree = cryptStatusOf(row('If Sreelekha is ready at the start of your discard phase, you get +1 discard phase action. +1 bleed.', ['bleedBonus']), R);
  eq([sree.status, sree.uncovered.map(p => p.classes[0])], ['partial', ['cards']], 'two sentences, one key: partial, the card sentence missing');
  eq(cryptStatusOf(row('Once each combat, Flávio can strike: dodge.', ['dodge']), R).unread, ['dodge'], 'a key no crypt reader reads');
  eq(cryptStatusOf(row('+1 bleed.', ['bleedBonus', 'dodge']), R).status, 'partial', 'one key unread is partial, the sentence covered or not');
  eq(cryptStatusOf(row('Once each combat, Flávio can strike: dodge.', ['strikeDodge']), new Map([['strikeDodge', new Set(['_cryptDodgeFx'])]])).status, 'modelled', 'v1.1.1: the crypt dodge key (FX_CLASS combat) models a strike: dodge');
  eq(cryptStatusOf(row('While your prey has 10 or fewer pool, Üresség gets +1 vote and +1 bleed.', ['bleedBonus']), R).status, 'partial', 'a sentence of two classes needs both');
  eq(cryptStatusOf(row('During a bleed action, Liliana can remove seven cards in your ash heap from the game to get an additional +1 bleed. +1 bleed.', ['bleedBonus']), R).uncovered.map(p => p.kind), ['activated'], 'one key covers one sentence, the passive one first: the activated bleed is missing');
  const R2 = new Map([['bleedBonus', new Set(['r'])], ['bleedBoostDiscard', new Set(['r'])]]);
  eq(cryptStatusOf(row('During a bleed action, Liliana can remove seven cards in your ash heap from the game to get an additional +1 bleed. +1 bleed.', ['bleedBonus', 'bleedBoostDiscard']), R2).status, 'modelled', 'two bleed sentences, two bleed keys');
  eq(cryptStatusOf(row('+1 bleed.', []), R).status, 'unmodelled', 'no fx');
  eq(cryptStatusOf({ kc: {}, ability: '', parts: [], fxk: [] }, R).status, 'no ability', 'sect and title only');
  eq(cryptStatusOf({ kc: null, ability: null, parts: [], fxk: [] }, R).status, 'unresolved', 'no KRCG text');
  // v1.1.2: a master pick is a play only when the card left the hand (or its own row says so); Villein's decide is skipped
  const M = (q, hand, extra) => Object.assign({ bot: 'B1', type: 'decide', data: { q, hand, out: {} } }, extra || {});
  eq(masterPlayed([M('master-play', ['Blood Doll', 'X']), M('bleed-target', ['X'])], 0, 'Blood Doll'), true, 'a master that left the hand');
  eq(masterPlayed([M('master-play', ['Blood Doll', 'X']), M('bleed-target', ['Blood Doll', 'X'])], 0, 'Blood Doll'), false, 'a held master');
  eq(masterPlayed([M('master-play', ['Villein']), M('villein', ['Villein']), M('action', [])], 0, 'Villein'), true, 'Villein: its own decide is skipped');
  eq(masterPlayed([M('master-play', ['Toreador Grand Ball', 'Toreador Grand Ball']), { bot: 'B1', type: 'grand-ball', data: {} }, M('action', ['Toreador Grand Ball', 'Toreador Grand Ball'])], 0, 'Toreador Grand Ball'), true, 'its own row, the replacement of the same name drawn');
  eq(masterPlayed([M('master-play', ['Blood Doll']), M('action', [], { bot: 'B2' })], 0, 'Blood Doll'), false, 'another bot\'s row says nothing; no row of mine after it');
  // v1.1.3 (round F, coverage v1.1.47): the discipline lines -- a superior line with no mode (Perfect Paragon's auto entry), a combination
  // read as two single disciplines (Scalpel Tongue before the round), an either-or with one alternative missing, an at-less basic mode
  const G = COV.discLineGaps, PP = '[pre] Only usable during the polling step of a political action. This vampire gets +3 votes.\n[PRE] Allies and younger vampires get -1 intercept.';
  eq(G({ modes: [{ at: 'pre' }] }, PP), ['PRE'], 'a superior line with no mode');
  eq(G({ modes: [{ at: 'pre' }, { at: 'PRE' }] }, PP), [], 'every line modelled');
  eq(G({ modes: [{ at: 'cel' }, { at: 'pre' }, { at: 'CEL' }, { at: 'PRE' }] }, 'Only usable during the polling step.\n[cel][pre] Choose a vampire.\n[CEL][PRE] As above.'), ['cel+pre', 'CEL+PRE'], 'a combination is one requirement');
  eq(G({ modes: [{ at: 'obf' }, { at: 'OBF' }, { at: 'THA' }] }, '[obf] or [tha] Do X.\n[OBF] or [THA] Do Y.'), ['tha'], 'an either-or: each alternative');
  eq(G({ modes: [{ at: null }] }, '[pro] +1 intercept.'), [], 'an at-less mode covers a basic line');
  eq(G({ modes: [{ at: null }] }, '[PRO] +1 intercept.'), ['PRO'], 'but not a superior one');
  eq(G({ modes: [] }, 'Requires a ready Toreador. [ACTION MODIFIER] +1 stealth.'), [], 'no discipline line, no gap');
  // v1.2.0 (RULINGS D-125): the whole library -- the census counts each entry once, by its verdict, its tier and its type; the vocabulary
  const ST = ['playable (static)', 'partial', 'inert', 'unresolved'], vst = VERDICTS.map(v => ST.indexOf(statusOf(v, 0, 0, false)));
  eq(vst.every((x, i) => x >= 0 && (i === 0 || x >= vst[i - 1])), true, 'the tables\' verdict order is grouped by status, in the page\'s order');
  eq([statusOf('FULL', 0, 0, false), statusOf('TABLED-ONLY', 0, 0, false), statusOf('NAME-ONLY', 0, 0, false), statusOf('UNRESOLVED', 0, 0, false)], ST, 'a verdict\'s static status');
  eq([statusOf('NEW-VERDICT', 0, 0, false), statusOf('NEW-VERDICT', 3, 5, true), statusOf('FULL', 3, 5, true), statusOf('HANDLER', 0, 5, true)], ['unresolved', 'unresolved', 'playable', 'unseen'], 'a verdict this file does not know is never playable, with a sim or without');
  const E = (t, src, fxo, extra) => Object.assign({ t, src, modes: fxo ? [{ at: 'x', fx: fxo }] : [] }, extra || {});
  const lib0 = { A: E(['action'], 'auto', { bleed: 1 }), B: E(['mod', 'react'], 'hand', { kB: 1 }), C: E(['master'], 'auto', null), D: E(['action'], 'hand', { kD: 1 }, { handler: 'h' }), F: E(['action'], 'auto', { odd: 1 }, { ref: { fx: { titleCard: 1 } } }), G: E(['action'], 'auto', { bleed: 2 }) };
  const cen = libCensus(lib0, (name, e) => name === 'C' ? 'TABLED-ONLY' : name === 'D' ? 'HANDLER' : name === 'F' ? 'NEW-VERDICT' : e.src === 'hand' ? 'PARTIAL' : 'FULL');
  eq([cen.n, cen.verdicts], [6, ['FULL', 'HANDLER', 'PARTIAL', 'TABLED-ONLY', 'NEW-VERDICT']], 'the census: every entry once; the verdicts in the tables\' order, an unknown one last');
  eq([cen.byVerdict.FULL, cen.byVerdict.HANDLER, cen.byVerdict.PARTIAL], [{ n: 2, auto: 2, curated: 0, handler: 0 }, { n: 1, auto: 0, curated: 0, handler: 1 }, { n: 1, auto: 0, curated: 1, handler: 0 }], 'by tier: a handler entry is the handler tier whatever its src');
  eq([cen.byType.action, cen.byType['mod/react'], cen.byType.master], [{ n: 4, FULL: 2, HANDLER: 1, 'NEW-VERDICT': 1 }, { n: 1, PARTIAL: 1 }, { n: 1, 'TABLED-ONLY': 1 }], 'by type: two cards of a type and a verdict are two; a multi-type card is its own row');
  eq(Object.values(cen.byVerdict).reduce((s, x) => s + x.n, 0) === cen.n && Object.values(cen.byType).reduce((s, x) => s + x.n, 0) === cen.n, true, 'both tables sum to the entries');
  const keys0 = e => Object.keys(((e.modes || [])[0] || {}).fx || {}).concat(Object.keys((e.ref && e.ref.fx) || {}));
  eq(libVocabulary(lib0, { V: { fx: { bleedBonus: 1 } }, W: {} }, new Set(['bleed', 'kB', 'titleCard', 'bleedBonus', 'equip']), keys0),
     { keys: 5, read: 3, unread: ['kD', 'odd'], scanned: 5, scannedCrypt: 1, scannedNowhere: ['equip'] }, 'the vocabulary: the keys on library entries, those the bot reads, a crypt key and a read no entry carries');
  // v1.2.2 (cardfx v1.10.0, spec-card-sweep §4.4): a merged entry is curated -- its row reads `curated, merged`, the census counts it curated
  const mrg = E(['mod'], 'hand', { kM: 1 }, { merged: true, handKeys: ['kM'] }), cenM = libCensus({ M: mrg, B: lib0.B, A: lib0.A }, () => 'FULL');
  eq([tierLabel(mrg), tierLabel(lib0.B), tierLabel(lib0.A), tierLabel(lib0.D), tierLabel(null)], ['curated, merged', 'curated', 'auto', 'handler', '\u2014'], 'the tier a row shows: a merged hand entry is curated, merged; another hand entry curated');
  eq(cenM.byVerdict.FULL, { n: 3, auto: 1, curated: 2, handler: 0 }, 'the census counts a merged entry in the curated tier');
  // the egress review (L-13): a ROW rendered through the page's own two functions, a merged entry and a whole hand entry
  const rowOf = e => rowLine(finishRow({ card: 'Synthetic Card', e, decks: { malkavian: 2 }, verdict: 'FULL', uses: 0, usesBy: {}, kc: null, names: [], per: [] }, {}, false, () => []), false, {});
  eq([rowOf(mrg), rowOf(lib0.B)], ['| Synthetic Card | mod | curated, merged | FULL | playable (static) | malkavian 2 | — | — |  |', '| Synthetic Card | mod/react | curated | FULL | playable (static) | malkavian 2 | — | — |  |'],
     'a row as the page writes it: a merged entry\'s tier reads curated, merged; a whole hand entry\'s curated');
  if (!quiet || bad) console.log('gen-card-ledger --self-test: ' + (of - bad) + ' of ' + of + ' checks' + (bad ? ' -- FAILED' : ' passed'));
  return bad;
}
const COV = require('./gen-deck-coverage.js');
const B = require('./elysium-bot.js');
const SH = require('./cardfx-sharing.js');   // v1.2.0: what a hand-only key is, and the sharing register's counts

function parseArgs(argv){
  const o = { decks: null, sims: [], out: path.join(__dirname, 'docs', 'CARDS.md') };
  for (let i = 2; i < argv.length; i++){
    const a = argv[i];
    if (a === '--decks') o.decks = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '--sim') o.sims.push(path.resolve(argv[++i]));
    else if (a === '--out') o.out = path.resolve(argv[++i]);
    else if (a === '--self-test') o.selfTest = true;
    else if (a === '--help' || a === '-h'){ console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); process.exit(0); }
    else { console.error('gen-card-ledger: unknown argument ' + a); process.exit(2); }
  }
  return o;
}

const STATUS_ORDER = ['unresolved', 'inert', 'partial', 'not seated', 'unseen', 'playable (static)', 'playable'];
const PLAYS = st => st === 'playable' || st === 'playable (static)';   // a row with nothing missing
/* v1.2.2 (the egress review, LESSONS L-13): a library row's derived fields and its line, each in one function the page and the self-test
   both call -- so the self-test renders a row through the code that writes the page */
function finishRow(x, seatedBy, haveSim, suiteSections){
  x.seated = Object.keys(x.decks).reduce((s, k) => s + (seatedBy[k] || 0), 0);
  x.status = statusOf(x.verdict, x.uses, x.seated, haveSim);
  x.tier = tierLabel(x.e);
  const kc = x.kc;
  x.rulings = kc ? (kc.rulings || []).length : null;
  x.type = kc ? (kc.types || []).join('/') : ((x.e && x.e.t) || []).join('/');
  x.suite = suiteSections([x.card, ...x.names]);
  x.missing = x.per.filter(p => !p.consumed).map(p => '[' + p.at + (p.dir ? ' D' : '') + '] ' + p.fxKeys);
  return x;
}
function rowLine(x, haveSim, seatedBy){
  return '| ' + x.card + ' | ' + (x.type || '—') + ' | ' + x.tier + ' | ' + x.verdict + ' | ' + x.status + ' | ' + Object.entries(x.decks).sort().map(([k, n]) => k + ' ' + n + (haveSim ? ' (' + (x.usesBy[k] || 0) + '/' + (seatedBy[k] || 0) + ')' : '')).join(', ') +
    ' | ' + (x.rulings == null ? '—' : x.rulings) + ' | ' + (x.suite.length ? x.suite.slice(0, 8).join(', ') + (x.suite.length > 8 ? ' +' + (x.suite.length - 8) : '') : '—') + ' | ' + (PLAYS(x.status) || x.status === 'unseen' || x.status === 'not seated' ? '' : x.missing.join('; ')) + ' |';
}
function statusOf(verdict, uses, seated, haveSim){
  if (verdict === 'UNRESOLVED' || verdict === 'IN-CRYPT?') return 'unresolved';
  if (['INERT', 'NAME-ONLY', 'REF-TERMS', 'HANDLER-UNREG'].includes(verdict)) return 'inert';
  if (['PARTIAL', 'TABLED-ONLY', 'UNREACHABLE'].includes(verdict)) return 'partial';
  if (verdict !== 'FULL' && verdict !== 'HANDLER') return 'unresolved';   // v1.2.0: a verdict this file does not know is never playable (the run says so and exits 1)
  if (!haveSim) return 'playable (static)';   // FULL / HANDLER with no sim to read it against
  if (!seated) return 'not seated';           // a sim was given, but no deck that carries the card sat in it
  return uses > 0 ? 'playable' : 'unseen';
}

function main(){
  const o = parseArgs(process.argv);
  if (o.selfTest) return cryptSelfTest(false) ? 1 : 0;
  if (cryptSelfTest(true)){ console.error('gen-card-ledger: the self-test failed -- no page written'); return 1; }
  const deckFiles = fs.readdirSync(__dirname).filter(f => /^deck-[a-z0-9]+\.json$/.test(f)).sort();
  const decks = [];
  for (const f of deckFiles){
    const key = f.slice(5, -5), d = JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
    if (o.decks ? o.decks.includes(key) : /^V5 /.test(d.name || '')) decks.push({ key, file: f, deck: d });
  }
  if (o.decks){ const miss = o.decks.filter(k => !decks.some(d => d.key === k)); if (miss.length){ console.error('gen-card-ledger: no deck file for ' + miss.join(', ')); process.exit(2); } }
  if (!decks.length){ console.error('gen-card-ledger: no decks (run gen-precon.js first, or pass --decks)'); process.exit(2); }

  // vtes.json is optional: the rulings count and KRCG's types
  let krcg = null; const vp = path.join(__dirname, 'vtes.json');
  if (fs.existsSync(vp)){ krcg = new Map(); for (const c of JSON.parse(fs.readFileSync(vp, 'utf8'))) for (const n of [c.name, c.printed_name, c._name].concat(c.name_variants || [])) if (n && !krcg.has(n)) krcg.set(n, c); }

  // the suite's sections that name a card: section marker `/* NNN)` at the start of a line's comment
  const suite = fs.readFileSync(path.join(__dirname, 'test-bot-logic.js'), 'utf8').split('\n');
  const secAt = []; let cur = null;
  for (const line of suite){ const m = /^\s*\/\*\s*(\d+[a-z]?)\)/.exec(line); if (m) cur = m[1]; secAt.push(cur); }
  const suiteSections = names => { const out = new Set();
    suite.forEach((line, i) => { if (secAt[i] && names.some(n => n.length > 3 && line.includes(n))) out.add(secAt[i]); });
    return [...out].sort((a, b) => parseInt(a, 10) - parseInt(b, 10) || a.localeCompare(b)); };

  /* the rows: one per CARD, joined across the decks that carry it. A card is its KRCG id when vtes.json is here (so the two spellings of
     Pentex(TM) / Pentex™ Subversion, two cardfx keys, are one row -- RULINGS O-24), else its cardfx key. */
  const krcgOf = (canon, name) => krcg && (krcg.get(canon) || krcg.get(name)) || null;
  const rowKey = name => { const h = COV.lookup(name), canon = h ? h.name : name, k = krcgOf(canon, name); return k ? 'id' + k.id : canon; };
  const rows = new Map();
  for (const d of decks){
    const { libRows } = COV.coverDeck(d.deck, krcg ? (canon, name) => { const k = krcgOf(canon, name); return k ? (k.card_text || '') : null; } : null);   // v1.1.3: a discipline line with no mode is PARTIAL
    for (const r of libRows){
      const key = rowKey(r.name), kc = krcgOf(r.canon, r.name);
      if (!rows.has(key)) rows.set(key, { card: kc ? (kc.printed_name || kc.name) : (r.canon || r.name), names: new Set(), verdict: r.verdict, per: r.per, e: r.e, decks: {}, copies: 0, uses: 0, usesBy: {}, seated: 0, verdicts: new Set(), kc });
      const x = rows.get(key);
      x.names.add(r.name); x.verdicts.add(r.verdict); x.decks[d.key] = (x.decks[d.key] || 0) + r.qty; x.copies += r.qty;
      // the discipline reach is per deck: keep the best verdict a carrying deck reaches (FULL over PARTIAL over UNREACHABLE)
      const rank = v => ['HANDLER', 'FULL', 'PARTIAL', 'TABLED-ONLY', 'UNREACHABLE', 'REF-TERMS', 'INERT', 'NAME-ONLY', 'HANDLER-UNREG', 'IN-CRYPT?', 'UNRESOLVED'].indexOf(v);
      if (rank(r.verdict) < rank(x.verdict)){ x.verdict = r.verdict; x.per = r.per; }
    }
  }

  // uses in the sim dirs
  const simMeta = [];
  const seatedBy = {};   // deck key -> matches sat
  for (const dir of o.sims){
    const files = fs.readdirSync(dir).filter(f => /^match-\d+\.jsonl$/.test(f)).sort();
    let design = null; try { design = JSON.parse(fs.readFileSync(path.join(dir, 'design.json'), 'utf8')).meta; } catch (e){}
    simMeta.push({ dir: path.basename(dir), matches: files.length, design });
    for (const f of files){
      const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
      const deckOf = {};
      lines.forEach(r => { if (r.type === 'manifest' && r.data && r.data.deck) deckOf[r.bot] = r.data.deck; });
      lines.forEach(r => { if (r.type === 'result' && r.data && Array.isArray(r.data.bots)) r.data.bots.forEach(b => { if (b && b.name && b.deck) deckOf[b.name] = b.deck; }); });
      Object.values(deckOf).forEach(k => { seatedBy[k] = (seatedBy[k] || 0) + 1; });
      for (const r of lines){
        const dk = deckOf[r.bot]; if (!dk) continue;
        let name = null;
        if (r.type === 'play' && r.data) name = r.data.card;
        else if (r.type === 'decide' && r.data && (r.data.q === 'action' || r.data.q === 'master-play')){ const p = r.data.out && r.data.out.pick; if (p && typeof p === 'object' && p.name && (r.data.q !== 'master-play' || masterPlayed(lines, lines.indexOf(r), p.name))) name = p.name; }   // v1.1.2: a HELD master is no use (BOARD, 6 Nov)
        if (!name) continue;
        const x = rows.get(rowKey(name));
        if (x && x.decks[dk]){ x.uses++; x.usesBy[dk] = (x.usesBy[dk] || 0) + 1; }   // a use counts for the card in the deck that played it
      }
    }
  }
  const haveSim = o.sims.length > 0;
  for (const x of rows.values()) finishRow(x, seatedBy, haveSim, suiteSections);

  // the class map: unconsumed fx keys of every non-playable row, weighted by copies
  const meaningful = k => k && k !== '—' && !['paired', 'meta', 'crypt'].includes(String(COV.CLASS[k] || ''));
  const classes = new Map();
  const addClass = (k, x) => { if (!classes.has(k)) classes.set(k, { copies: 0, cards: [] }); const c = classes.get(k); c.copies += x.copies; c.cards.push(x.card + ' ' + x.copies); };
  for (const x of rows.values()){
    if (PLAYS(x.status) || x.status === 'unseen' || x.status === 'not seated') continue;
    if (x.verdict === 'NAME-ONLY') { addClass('(no effect data: curate the card)', x); continue; }
    if (x.verdict === 'UNRESOLVED') { addClass('(the name does not resolve)', x); continue; }
    const master = ((x.e && x.e.t) || []).includes('master') ? 'master: ' : '';
    if (!x.per.length) { addClass(master + '(no mode modelled)', x); continue; }
    /* each unconsumed mode names its class: its meaningful keys one by one; a mode with no fx at all, or with riders only (actStealth, bleed,
       bloodAdd ... whose main effect is what is missing), is named as such -- the rider is listed, never counted as the effect */
    const ks = new Set();
    x.per.filter(p => !p.consumed).forEach(p => {
      if (p.textLine){ ks.add(master + '(a discipline line with no mode)'); return; }   // v1.1.3: the card text's line, not an fx key
      const keys = p.fxKeys === '\u2014' ? [] : p.fxKeys.split(',').filter(Boolean), main = keys.filter(meaningful);
      if (!keys.length) ks.add(master + '(a mode with no effect data)');
      else if (!main.length) ks.add(master + '(riders only: ' + keys.join('+') + ')');
      else main.forEach(k => ks.add(master + k));
    });
    ks.forEach(k => addClass(k, x));
  }

  /* the whole library (v1.2.0, RULINGS D-125): every library ENTRY of the cardfx by the rows' own verdict, every vampire of the cardfx offered
     as the crypt (a mode is out of reach only at a discipline level no vampire has), KRCG's text for the text checks when it is here */
  const allCrypt = Object.values(COV.fx.crypt || {});
  let noText = 0;   // entries KRCG has no text for: their text checks are not made, and the page says how many
  const census = libCensus(COV.fx.lib, (name, e) => { const kc = krcgOf(name, name); if (krcg && !kc) noText++; return COV.judgeLib({ kind: 'lib', name, e }, allCrypt, kc ? (kc.card_text || '') : null).verdict; });
  const vocab = libVocabulary(COV.fx.lib, COV.fx.crypt, COV.scanned, SH.fxKeysOf), handOnly = SH.handOnlyKeys(COV.fx.lib);
  let compilerKeys = null;   // the keys the compiler gives with no curated file: a compile of its own, over its own copy of KRCG's cards
  if (krcg){ const out = require('./cardfx-compile.js').compile(JSON.parse(fs.readFileSync(vp, 'utf8')), null).out; compilerKeys = new Set(); for (const n of Object.keys(out.lib || {})) for (const k of SH.fxKeysOf(out.lib[n])) compilerKeys.add(k); }
  let register = null; try { register = JSON.parse(fs.readFileSync(path.join(__dirname, 'cardfx-sharing.json'), 'utf8')); } catch (e){ register = null; }
  const reg = register ? SH.counts(COV.fx.lib, register) : null, regProblems = register ? SH.check(COV.fx.lib, register) : [];

  /* the crypt (v1.1.0, RULINGS D-108): every vampire, read from KRCG's text -- a card is its KRCG id, like a library row; its curated keys
     against the bot's crypt readers (the mechanism that reads each key) and its sentences against the keys' classes */
  const readers = cryptReaders(fs.readFileSync(path.join(__dirname, 'elysium-bot.js'), 'utf8'));
  const crypt = new Map();
  if (krcg){
    for (const d of decks){
      for (const c of (d.deck.crypt || [])){
        const h = COV.lookup(c.name), isC = !!(h && h.kind === 'crypt'), canon = isC ? h.name : c.name, kc = krcgOf(canon, c.name);
        const key = kc ? 'id' + kc.id : 'n:' + canon;
        if (!crypt.has(key)){
          const e = isC ? h.e : null, fxk = e && e.fx ? Object.keys(e.fx) : [];
          const card = kc ? (kc.printed_name || kc._name || canon) : canon, ability = kc ? cryptAbility(kc.card_text) : null;
          const parts = ability ? cryptSentences(ability).map(s => Object.assign({ s }, cryptClassOf(s, card))) : [];
          const x = { card, kc, fxk, ability, parts, decks: {}, copies: 0 };
          crypt.set(key, Object.assign(x, cryptStatusOf(x, readers)));
        }
        const x = crypt.get(key); x.decks[d.key] = (x.decks[d.key] || 0) + (c.qty | 0); x.copies += (c.qty | 0);
      }
    }
  }
  /* the classifier's known cases (L-53): every curated crypt entry with an fx must get its keys' classes (FX_CLASS) from its own text --
     a miss, or a key with no class, fails the run (the converse -- a sentence no key covers -- is the row's 'partial') */
  const check = { agree: 0, of: 0, miss: [], noClass: [] };
  if (krcg) for (const [name, e] of Object.entries(COV.fx.crypt || {})){
    const keys = e && e.fx ? Object.keys(e.fx) : []; if (!keys.length) continue;
    const bare = keys.filter(k => !classesOf(k).length); if (bare.length){ check.noClass.push(name + ' (' + bare.join(', ') + ')'); continue; }
    check.of++;
    const kc = krcgOf(name, name); if (!kc){ check.miss.push(name + ': no KRCG text'); continue; }
    const want = [...new Set(keys.flatMap(classesOf))], pn = kc.printed_name || kc._name || name;
    const got = new Set(cryptSentences(cryptAbility(kc.card_text)).flatMap(s => cryptClassOf(s, pn).classes));
    if (want.every(w => got.has(w))) check.agree++; else check.miss.push(name + ': ' + want.join('+') + ' read as ' + ([...got].join('+') || 'nothing'));
  }

  // the page
  const all = [...rows.values()].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || b.copies - a.copies || a.card.localeCompare(b.card));
  const L = [], P = s => L.push(s);
  const stIn = (x, k) => statusOf(x.verdict, x.usesBy[k] || 0, seatedBy[k] || 0, haveSim);   // a card's status IN one deck
  const copiesAt = st => all.reduce((s, x) => s + Object.entries(x.decks).reduce((t, [k, n]) => t + (stIn(x, k) === st ? n : 0), 0), 0);
  /* the statuses a table shows: the five that always apply (zeros included: "0 unresolved" is a result), and "not seated" only when it occurs */
  const shown = (haveSim ? ['playable', 'unseen'] : ['playable (static)']).concat(copiesAt('not seated') ? ['not seated'] : [], ['partial', 'inert', 'unresolved']);
  P('# CARDS — the card ledger (generated by `gen-card-ledger.js`; do not edit by hand)');
  P('');
  P('Bot v' + B.BOT_VERSION + ' · `gen-card-ledger.js` v' + LEDGER_VERSION + ' · `gen-deck-coverage.js` v' + COV.VERSION + ' · cardfx ' + (COV.fx.counts.curated || '?') + ' curated / ' + (COV.fx.counts.libWithFx || '?') +
    ' library entries with effects · ' + decks.length + ' decks (' + decks.map(d => d.key).join(', ') + ') · ' + (krcg ? 'rulings from vtes.json' : 'no vtes.json: rulings not counted') + '.');
  P('');
  if (haveSim){   // one line per design shape: the V5 smoke's 14 dirs (a new deck + the same four) read as one
    const shape = m => !m.design ? 'unknown' : JSON.stringify([m.design.bot, m.design.client, m.design.seatings, m.design.seed, m.design.seeds, m.design.profile, (m.design.decks || []).slice(1)]);
    const groups = new Map(); simMeta.forEach(m => { const k = shape(m); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(m); });
    const seat = d => d.seatings === 'all' ? 'every seating × ' + d.seeds + ' deal(s) from seed ' + d.seed : d.seatings === 'random' ? 'random seatings from seed ' + d.seed : 'a fixed seating';
    const table = d => 'bot v' + d.bot + (d.client ? ' on client v' + d.client : '');   // v1.2.1: the client is part of the table (its bridge delivers the lines)
    P('Sim: ' + [...groups.values()].map(g => { const d = g[0].design;
      if (!d) return g.map(m => '`' + m.dir + '` (' + m.matches + ' matches, no design.json)').join(', ');
      if (g.length === 1) return '`' + g[0].dir + '` — ' + g[0].matches + ' matches, ' + table(d) + ', ' + (d.decks || []).join(',') + ', ' + seat(d);
      return g.length + ' dirs (' + g.map(m => '`' + m.dir + '`').join(', ') + ') — ' + g.map(m => m.matches).reduce((x, y) => x + y, 0) + ' matches, ' + table(d) + ', each its own deck + ' + (d.decks || []).slice(1).join(',') + ', ' + seat(d);
    }).join(' · ') + '.');
  }
  else P('No sim given: FULL / HANDLER rows read "playable (static)".');
  P('');
  P('**Status:** playable = the bot plays every mode it can reach and some deck played the card in the sim (per deck below: that deck did) · unseen = it could, its decks sat, it never did (a pricing question first, LESSONS L-9) · not seated = it could, but none of its decks sat in the sims given · playable (static) = it could, and no sim was given · partial = some modes, or a master played blind · inert = nothing the bot reads · unresolved = the name finds no card. **Uses** = decisions to play the card from hand (action picks, and a master pick once it was played: its own row, or gone from the hand by the next decide row of that bot) plus every card play the bot emits in a window, counted in the deck that played it, over the matches that deck sat in. A verdict is static (what the code CAN do); uses are what the table DID (L-47).');
  P('');
  P('## Summary (' + all.length + ' cards, ' + all.reduce((s, x) => s + x.copies, 0) + ' library copies)');
  P('');
  P('| status | cards (any deck) | copies (in their deck) |'); P('|---|---:|---:|');
  shown.forEach(st => P('| ' + st + ' | ' + all.filter(x => x.status === st).length + ' | ' + copiesAt(st) + ' |'));
  P('');
  P('## Per deck (library copies by status; seated = matches in the sim)');
  P('');
  const cols = shown;
  P('| deck | ' + cols.join(' | ') + ' | seated |'); P('|---|' + cols.map(() => '---:').join('|') + '|---:|');
  for (const d of decks){   // per deck, a card's status is its status IN THAT DECK: a card another deck played is still unseen here
    const c = st => all.filter(x => x.decks[d.key] && stIn(x, d.key) === st).reduce((s, x) => s + x.decks[d.key], 0);
    P('| ' + d.key + ' | ' + cols.map(c).join(' | ') + ' | ' + (seatedBy[d.key] || 0) + ' |');
  }
  P('');
  /* the whole library (v1.2.0): two tables and the vocabulary -- a summary, never a row per card */
  const stOf = v => statusOf(v, 0, 0, false), stCount = st => census.verdicts.filter(v => stOf(v) === st).reduce((t, v) => t + census.byVerdict[v].n, 0);
  P('## The whole library (' + census.n + ' library entries of the cardfx; RULINGS D-125)');
  P('');
  P('Every library entry of `elysium-cardfx.json` by the verdict the rows of the ledger get (`gen-deck-coverage.js`, `judgeLib`), with every vampire of the cardfx offered as the crypt' +
    (krcg ? ' and the card text\'s checks on (KRCG\'s text' + (noText ? '; ' + noText + ' entries have none and are not checked' : '') + ')' : '; no `vtes.json`: the card text\'s checks are NOT made') + '. Static, no sim: FULL / HANDLER is "playable (static)", what the code can do. An entry is a cardfx key (a card under two printed names is two entries). The V5 sweep goes by sharing (`specs/spec-card-sweep-2026-11-18.md`): what an effect lands on outside the starters shows here. **By status:** ' +
    ['playable (static)', 'partial', 'inert', 'unresolved'].map(st => st + ' ' + stCount(st)).join(' · ') + '.');
  P('');
  P('| status | verdict | entries | ' + TIERS.join(' | ') + ' |'); P('|---|---|---:|' + TIERS.map(() => '---:').join('|') + '|');
  census.verdicts.forEach(v => { const c = census.byVerdict[v]; P('| ' + stOf(v) + ' | ' + v + (VERDICT_NOTE[v] ? ' (' + VERDICT_NOTE[v] + ')' : '') + ' | ' + c.n + ' | ' + TIERS.map(t => c[t]).join(' | ') + ' |'); });
  P('| | **all** | ' + census.n + ' | ' + TIERS.map(t => census.verdicts.reduce((a, v) => a + census.byVerdict[v][t], 0)).join(' | ') + ' |');
  P('');
  P('**By card type** (the cardfx types; a card of two types is its own row)');
  P('');
  P('| type | entries | ' + census.verdicts.join(' | ') + ' |'); P('|---|---:|' + census.verdicts.map(() => '---:').join('|') + '|');
  Object.entries(census.byType).sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0])).forEach(([ty, c]) => P('| ' + ty + ' | ' + c.n + ' | ' + census.verdicts.map(v => c[v] || 0).join(' | ') + ' |'));
  P('');
  P('**The vocabulary** (effect keys: the keys of a mode\'s `fx` and of `ref.fx`). The scan is the coverage tool\'s: the ' + vocab.scanned + ' keys the bot spells `fx.<key>` (a key it reads under another spelling, as `f.<key>` or `mo.fx[k]`, is not in it). Of them ' +
    vocab.read + ' are on library entries, ' + vocab.scannedCrypt + ' on crypt entries only, ' + vocab.scannedNowhere.length + ' on no entry' + (vocab.scannedNowhere.length ? ' (' + vocab.scannedNowhere.map(k => '`' + k + '`').join(', ') + ')' : '') + '.');
  P('');
  P('| effect keys on library entries | keys |'); P('|---|---:|');
  P('| all | ' + vocab.keys + ' |');
  P('| in the scan | ' + vocab.read + ' |');
  P('| not in the scan' + (vocab.unread.length ? ': ' + vocab.unread.map(k => '`' + k + '`').join(', ') : '') + ' | ' + vocab.unread.length + ' |');
  P('| given by the compiler (a compile without the curated file) | ' + (compilerKeys ? compilerKeys.size : 'not counted (no `vtes.json`)') + ' |');
  P('| on hand entries only (hand-only) | ' + handOnly.size + ' |');
  P('| hand-only, on a single entry | ' + [...handOnly.values()].filter(v => v.length === 1).length + ' |');
  P('');
  P('**The sharing register** (`cardfx-sharing.json`: who else in the library prints a hand-only key; `test-cardfx.js` is its gate): ' + (reg ?
    'backlog ' + reg.backlog + ' (not asked yet) · shared ' + reg.shared + ' (' + reg.owed + ' owed: the key is still hand-only, or a card the row names lacks it) · unique ' + reg.unique + (reg.noRow ? ' · **no row ' + reg.noRow + '**' : '') +
    (regProblems.length ? ' · **' + regProblems.length + ' problem(s): `node cardfx-sharing.js`**' : '') + '.' : 'no readable file.'));
  P('');
  P('## The class map (what is left in the starters: unconsumed effect keys of every partial / inert row, by copies)');
  P('');
  P('| effect key | copies | cards |'); P('|---|---:|---|');
  [...classes.entries()].sort((a, b) => b[1].copies - a[1].copies || a[0].localeCompare(b[0])).forEach(([k, c]) => P('| ' + k + ' | ' + c.copies + ' | ' + c.cards.join(', ') + ' |'));
  P('');
  P('## The ledger');
  P('');
  P('| card | type | tier | verdict | status | decks: copies' + (haveSim ? ' (uses / matches seated)' : '') + ' | rulings | suite § | missing modes |'); P('|---|---|---|---|---|---|---:|---|---|');
  for (const x of all) P(rowLine(x, haveSim, seatedBy));
  P('');
  /* the crypt (v1.1.0): after the library, so the library half of the page reads as before */
  const CST = ['unmodelled', 'partial', 'modelled', 'no ability', 'unresolved'];
  const cr = [...crypt.values()];
  const readerOf = k => readers.has(k) ? [...readers.get(k)].map(m => '`' + m + '`').join(' / ') : 'no crypt reader';
  P('## The crypt (every vampire; RULINGS D-108)');
  P('');
  if (!krcg) P('No `vtes.json` beside the script: the crypt is not read.');
  else {
    P('Read from KRCG\'s text (`vtes.json`): ' + cr.length + ' vampires, ' + cr.reduce((s, x) => s + x.copies, 0) + ' crypt copies -- a row in the crypt ledger below for each vampire with an ability, the sect-and-title-only ones listed per deck after it. **Status:** no ability = sect and title only (a title is data the bot reads, R-31) · modelled = a curated crypt `fx` whose every key a crypt reader of the bot reads and whose keys\' classes cover every sentence · partial = a key no crypt reader reads, or a sentence no key covers (the row says which) · unmodelled = an ability and no `fx` · unresolved = no KRCG text for the name. A deck joins the menu when its library rows play, its crypt rows are no ability or modelled, and it holds up in the sim (D-98, D-108). **Class (kind)** per sentence of the ability: passive = a bare "+1 bleed." · activated = "... can ..." · conditional = the rest (a condition, a toll, a grant). The classifier gives ' + check.agree + ' of ' + check.of + ' curated crypt entries (every one with an `fx`) the classes of their keys' + (check.miss.length ? ' (not: ' + check.miss.join('; ') + ')' : '') + (check.noClass.length ? '; keys with no class: ' + check.noClass.join('; ') : '') + '.');
    P('');
    P('**The crypt readers** (scanned from `elysium-bot.js`: each `this._cryptFxOf(` call, the `fx.<key>` it reads and the method it sits in -- the mechanism that models a key; that it applies an entry\'s form, a `when` or a condition, is the wave\'s section test): ' +
      [...readers.keys()].sort().map(k => '`' + k + '` → ' + readerOf(k)).join(' · ') + '.');
    P('');
    P('| status | vampires | copies (in their deck) |'); P('|---|---:|---:|');
    CST.forEach(st => P('| ' + st + ' | ' + cr.filter(x => x.status === st).length + ' | ' + cr.filter(x => x.status === st).reduce((s, x) => s + x.copies, 0) + ' |'));
    P('');
    P('**Per deck** (crypt copies by status)');
    P('');
    P('| deck | ' + CST.join(' | ') + ' |'); P('|---|' + CST.map(() => '---:').join('|') + '|');
    for (const d of decks) P('| ' + d.key + ' | ' + CST.map(st => cr.filter(x => x.status === st && x.decks[d.key]).reduce((s, x) => s + x.decks[d.key], 0)).join(' | ') + ' |');
    P('');
    const cmap = new Map();   // the crypt class map: each class (kind) of a sentence no key covers, once per vampire, weighted by its copies
    for (const x of cr){
      const once = new Set();
      x.uncovered.forEach(p => p.classes.forEach(c => { const k = c + ' (' + p.kind + ')'; if (once.has(k)) return; once.add(k);
        if (!cmap.has(k)) cmap.set(k, { copies: 0, cards: [] }); const m = cmap.get(k); m.copies += x.copies; m.cards.push(x.card + ' ' + x.copies); }));
    }
    P('**The crypt class map** (what a crypt wave would build: the class and kind of each sentence no curated key covers, by copies; a vampire with two such sentences is in two rows)');
    P('');
    P('| class (kind) | copies | vampires |'); P('|---|---:|---|');
    [...cmap.entries()].sort((a, b) => b[1].copies - a[1].copies || a[0].localeCompare(b[0])).forEach(([k, m]) => P('| ' + k + ' | ' + m.copies + ' | ' + m.cards.join(', ') + ' |'));
    P('');
    P('**The crypt ledger** (every vampire with an ability, or with no KRCG text; fx = each curated key and the crypt reader that reads it; missing = what keeps a partial row from modelled)');
    P('');
    P('| vampire | status | ability | class (kind) | fx → reader | missing | decks: copies |'); P('|---|---|---|---|---|---|---|');
    const kindOf = p => p.classes.join('+') + ' (' + p.kind + ')';
    cr.filter(x => x.status !== 'no ability').sort((a, b) => CST.indexOf(a.status) - CST.indexOf(b.status) || b.copies - a.copies || a.card.localeCompare(b.card))
      .forEach(x => P('| ' + x.card + ' | ' + x.status + ' | ' + String(x.ability || '—').replace(/\|/g, '/') + ' | ' + (x.parts.map(kindOf).join('; ') || '—') + ' | ' +
        (x.fxk.map(k => '`' + k + '` → ' + readerOf(k)).join(', ') || '—') + ' | ' +
        (x.status === 'partial' ? x.unread.map(k => '`' + k + '` unread').concat(x.uncovered.map(p => kindOf(p) + ' uncovered')).join('; ') : '') + ' | ' +
        Object.entries(x.decks).sort().map(([k, n]) => k + ' ' + n).join(', ') + ' |'));
    P('');
    P('**Sect and title only** (no ability; a title is data the bot reads, R-31)');
    P('');
    P('| deck | vampires (copies) |'); P('|---|---|');
    for (const d of decks){ const vs = cr.filter(x => x.status === 'no ability' && x.decks[d.key]).sort((a, b) => a.card.localeCompare(b.card));
      P('| ' + d.key + ' | ' + (vs.map(x => x.card + ' ' + x.decks[d.key]).join(', ') || '—') + ' |'); }
  }
  P('');
  fs.mkdirSync(path.dirname(o.out), { recursive: true });
  fs.writeFileSync(o.out, L.join('\n'));
  console.log('gen-card-ledger v' + LEDGER_VERSION + ': ' + all.length + ' cards over ' + decks.length + ' decks -- ' + STATUS_ORDER.slice().reverse().map(st => st + ' ' + all.filter(x => x.status === st).length).join(', ') +
    (krcg ? ' | crypt ' + cr.length + ' -- ' + CST.map(st => st + ' ' + cr.filter(x => x.status === st).length).join(', ') + ' | readers ' + readers.size + ' keys | classifier ' + check.agree + '/' + check.of : ' | crypt not read (no vtes.json)') + ' -> ' + path.relative(process.cwd(), o.out));
  console.log('  the whole library: ' + census.n + ' entries -- ' + ['playable (static)', 'partial', 'inert', 'unresolved'].map(st => st + ' ' + stCount(st)).join(', ') + ' | library keys ' + vocab.keys + ' (in the scan ' + vocab.read +
    ', compiler ' + (compilerKeys ? compilerKeys.size : '?') + ', hand-only ' + handOnly.size + ')' + (reg ? ' | register: backlog ' + reg.backlog + ', shared ' + reg.shared + ' (' + reg.owed + ' owed), unique ' + reg.unique + (regProblems.length ? ', ' + regProblems.length + ' PROBLEM(S)' : '') : ' | no register'));
  check.miss.forEach(m => console.error('  classifier miss: ' + m));
  check.noClass.forEach(m => console.error('  a curated crypt key with no class (add it to FX_CLASS): ' + m));
  const strange = census.verdicts.filter(v => !VERDICTS.includes(v));
  strange.forEach(v => console.error('  a verdict this file does not know (add it to statusOf and VERDICTS): ' + v + ' on ' + census.byVerdict[v].n + ' library entries, counted as unresolved'));
  return check.miss.length || check.noClass.length || strange.length ? 1 : 0;
}

if (require.main === module) process.exit(main());
module.exports = { statusOf, cryptAbility, cryptSentences, cryptClassOf, cryptReaders, cryptStatusOf, FX_CLASS, LEDGER_VERSION };
