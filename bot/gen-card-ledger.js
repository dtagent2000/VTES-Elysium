#!/usr/bin/env node
'use strict';
/* gen-card-ledger.js v1.1.0 (6 Nov 2026, bot v0.6.217, RULINGS D-108) -- THE CARD LEDGER: one generated row per library card of a deck set
   (default: the V5 precons) and every vampire of their crypts, so a V5 wave has a definition of done ("these rows turn playable")
   instead of a feeling.

   THE LIBRARY (v1.0.0, 29 Oct 2026, bot v0.6.212). A row joins four sources, each read by the code that owns it:
   - the VERDICT: gen-deck-coverage.js's own coverDeck() (the three-tier name ladder, the bot's consumed fx keys, the discipline reach) --
     the same function the per-deck reports use, so the ledger cannot drift from them;
   - the TIER: curated (cardfx `src: 'hand'`), auto, or handler; the RULINGS count from vtes.json (when it is beside the script);
   - the SUITE: the test-bot-logic.js sections that name the card (a section starts at its `/* NNN)` marker);
   - USES in the sim (any number of --sim DIRs): the decisions that play the card from hand (`decide` action / master-play picks) plus
     every card play the bot emits in a window (`play` rows: stealth, intercept, combat, modifiers, votes ...), per deck from the
     manifests (CLAUDE.md, traces: never from a name), against the number of matches that deck sat in.
   Status: playable = FULL / HANDLER and played at least once in the sim · unseen = FULL / HANDLER, its decks sat, never played (a
   pricing question before a bug, LESSONS L-9) · not seated = FULL / HANDLER, but no deck that carries it sat in the sims given ·
   partial = PARTIAL / TABLED-ONLY / UNREACHABLE · inert = INERT / NAME-ONLY / REF-TERMS / HANDLER-UNREG · unresolved = the ladder
   found nothing. Without a sim, FULL / HANDLER is "playable (static)". A bot's deck comes from the result row's `bots[].deck` (the
   sim's spec, whatever the profile), else its manifest: under --profile arena a bot gets no deckName, so a deck the bot does not embed
   has no key in its manifest.
   The class map: every non-playable row's unconsumed fx keys, weighted by copies -- what a wave would build, one effect class at a time.

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
const LEDGER_VERSION = '1.1.0';

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
  burnAtDamage: 'combat', burnOnTorpor: 'other', costPlusDisc: 'blood/pool', selfRemoveOption: 'blood/pool', fetchNamed: 'cards', enterPlay: 'cards', noReplaceActing: 'cards' };
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
/* a crypt row's status: modelled = every curated key read by a crypt reader AND every sentence's classes covered by the read keys' classes */
function cryptStatusOf(x, readers){
  if (!x.kc) return { status: 'unresolved', unread: [], uncovered: [] };
  if (!x.ability) return { status: 'no ability', unread: [], uncovered: [] };
  if (!x.fxk.length) return { status: 'unmodelled', unread: [], uncovered: x.parts };
  const unread = x.fxk.filter(k => !readers.has(k));
  const covered = new Set(x.fxk.filter(k => readers.has(k)).flatMap(classesOf));
  const uncovered = x.parts.filter(p => !p.classes.every(c => covered.has(c)));
  return { status: unread.length || uncovered.length ? 'partial' : 'modelled', unread, uncovered };
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
  eq(cryptStatusOf(row('+1 bleed.', []), R).status, 'unmodelled', 'no fx');
  eq(cryptStatusOf({ kc: {}, ability: '', parts: [], fxk: [] }, R).status, 'no ability', 'sect and title only');
  eq(cryptStatusOf({ kc: null, ability: null, parts: [], fxk: [] }, R).status, 'unresolved', 'no KRCG text');
  if (!quiet || bad) console.log('gen-card-ledger --self-test: ' + (of - bad) + ' of ' + of + ' checks' + (bad ? ' -- FAILED' : ' passed'));
  return bad;
}
const COV = require('./gen-deck-coverage.js');
const B = require('./elysium-bot.js');

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
function statusOf(verdict, uses, seated, haveSim){
  if (verdict === 'UNRESOLVED' || verdict === 'IN-CRYPT?') return 'unresolved';
  if (['INERT', 'NAME-ONLY', 'REF-TERMS', 'HANDLER-UNREG'].includes(verdict)) return 'inert';
  if (['PARTIAL', 'TABLED-ONLY', 'UNREACHABLE'].includes(verdict)) return 'partial';
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
    const { libRows } = COV.coverDeck(d.deck);
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
        else if (r.type === 'decide' && r.data && (r.data.q === 'action' || r.data.q === 'master-play')){ const p = r.data.out && r.data.out.pick; if (p && typeof p === 'object' && p.name) name = p.name; }
        if (!name) continue;
        const x = rows.get(rowKey(name));
        if (x && x.decks[dk]){ x.uses++; x.usesBy[dk] = (x.usesBy[dk] || 0) + 1; }   // a use counts for the card in the deck that played it
      }
    }
  }
  const haveSim = o.sims.length > 0;
  for (const x of rows.values()){
    x.seated = Object.keys(x.decks).reduce((s, k) => s + (seatedBy[k] || 0), 0);
    x.status = statusOf(x.verdict, x.uses, x.seated, haveSim);
    x.tier = x.e ? (x.e.handler ? 'handler' : x.e.src === 'hand' ? 'curated' : 'auto') : '—';
    const kc = x.kc;
    x.rulings = kc ? (kc.rulings || []).length : null;
    x.type = kc ? (kc.types || []).join('/') : ((x.e && x.e.t) || []).join('/');
    x.suite = suiteSections([x.card, ...x.names]);
    x.missing = x.per.filter(p => !p.consumed).map(p => '[' + p.at + (p.dir ? ' D' : '') + '] ' + p.fxKeys);
  }

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
      const keys = p.fxKeys === '\u2014' ? [] : p.fxKeys.split(',').filter(Boolean), main = keys.filter(meaningful);
      if (!keys.length) ks.add(master + '(a mode with no effect data)');
      else if (!main.length) ks.add(master + '(riders only: ' + keys.join('+') + ')');
      else main.forEach(k => ks.add(master + k));
    });
    ks.forEach(k => addClass(k, x));
  }

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
    const shape = m => !m.design ? 'unknown' : JSON.stringify([m.design.bot, m.design.seatings, m.design.seed, m.design.seeds, m.design.profile, (m.design.decks || []).slice(1)]);
    const groups = new Map(); simMeta.forEach(m => { const k = shape(m); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(m); });
    const seat = d => d.seatings === 'all' ? 'every seating × ' + d.seeds + ' deal(s) from seed ' + d.seed : d.seatings === 'random' ? 'random seatings from seed ' + d.seed : 'a fixed seating';
    P('Sim: ' + [...groups.values()].map(g => { const d = g[0].design;
      if (!d) return g.map(m => '`' + m.dir + '` (' + m.matches + ' matches, no design.json)').join(', ');
      if (g.length === 1) return '`' + g[0].dir + '` — ' + g[0].matches + ' matches, bot v' + d.bot + ', ' + (d.decks || []).join(',') + ', ' + seat(d);
      return g.length + ' dirs (' + g.map(m => '`' + m.dir + '`').join(', ') + ') — ' + g.map(m => m.matches).reduce((x, y) => x + y, 0) + ' matches, bot v' + d.bot + ', each its own deck + ' + (d.decks || []).slice(1).join(',') + ', ' + seat(d);
    }).join(' · ') + '.');
  }
  else P('No sim given: FULL / HANDLER rows read "playable (static)".');
  P('');
  P('**Status:** playable = the bot plays every mode it can reach and some deck played the card in the sim (per deck below: that deck did) · unseen = it could, its decks sat, it never did (a pricing question first, LESSONS L-9) · not seated = it could, but none of its decks sat in the sims given · playable (static) = it could, and no sim was given · partial = some modes, or a master played blind · inert = nothing the bot reads · unresolved = the name finds no card. **Uses** = decisions to play the card from hand (action and master picks; a master the loop then holds for want of a target still counts) plus every card play the bot emits in a window, counted in the deck that played it, over the matches that deck sat in. A verdict is static (what the code CAN do); uses are what the table DID (L-47).');
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
  P('## The class map (what the waves would build: unconsumed effect keys of every partial / inert row, by copies)');
  P('');
  P('| effect key | copies | cards |'); P('|---|---:|---|');
  [...classes.entries()].sort((a, b) => b[1].copies - a[1].copies || a[0].localeCompare(b[0])).forEach(([k, c]) => P('| ' + k + ' | ' + c.copies + ' | ' + c.cards.join(', ') + ' |'));
  P('');
  P('## The ledger');
  P('');
  P('| card | type | tier | verdict | status | decks: copies' + (haveSim ? ' (uses / matches seated)' : '') + ' | rulings | suite § | missing modes |'); P('|---|---|---|---|---|---|---:|---|---|');
  for (const x of all){
    P('| ' + x.card + ' | ' + (x.type || '—') + ' | ' + x.tier + ' | ' + x.verdict + ' | ' + x.status + ' | ' + Object.entries(x.decks).sort().map(([k, n]) => k + ' ' + n + (haveSim ? ' (' + (x.usesBy[k] || 0) + '/' + (seatedBy[k] || 0) + ')' : '')).join(', ') +
      ' | ' + (x.rulings == null ? '—' : x.rulings) + ' | ' + (x.suite.length ? x.suite.slice(0, 8).join(', ') + (x.suite.length > 8 ? ' +' + (x.suite.length - 8) : '') : '—') + ' | ' + (PLAYS(x.status) || x.status === 'unseen' || x.status === 'not seated' ? '' : x.missing.join('; ')) + ' |');
  }
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
  check.miss.forEach(m => console.error('  classifier miss: ' + m));
  check.noClass.forEach(m => console.error('  a curated crypt key with no class (add it to FX_CLASS): ' + m));
  return check.miss.length || check.noClass.length ? 1 : 0;
}

if (require.main === module) process.exit(main());
module.exports = { statusOf, cryptAbility, cryptSentences, cryptClassOf, cryptReaders, cryptStatusOf, FX_CLASS, LEDGER_VERSION };
