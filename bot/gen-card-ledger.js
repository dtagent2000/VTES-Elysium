#!/usr/bin/env node
'use strict';
/* gen-card-ledger.js v1.0.0 (29 Oct 2026, bot v0.6.212) -- THE CARD LEDGER, v0: one generated row per library card of a deck set (default:
   the V5 precons), so a V5 wave has a definition of done ("these rows turn playable") instead of a feeling.

   A row joins four sources, each read by the code that owns it:
   - the VERDICT: gen-deck-coverage.js's own coverDeck() (the three-tier name ladder, the bot's consumed fx keys, the discipline reach) --
     the same function the per-deck reports use, so the ledger cannot drift from them;
   - the TIER: curated (cardfx `src: 'hand'`), auto, or handler; the RULINGS count from vtes.json (when it is beside the script);
   - the SUITE: the test-bot-logic.js sections that name the card (a section starts at its `/* NNN)` marker);
   - USES in the sim (any number of --sim DIRs): the decisions that play the card from hand (`decide` action / master-play picks) plus
     every card play the bot emits in a window (`play` rows: stealth, intercept, combat, modifiers, votes ...), per deck from the
     manifests (CLAUDE.md, traces: never from a name), against the number of matches that deck sat in.
   Status: playable = FULL / HANDLER and played at least once in the sim · unseen = FULL / HANDLER, its decks sat, never played (a
   pricing question before a bug, LESSONS L-9) · partial = PARTIAL / TABLED-ONLY / UNREACHABLE · inert = INERT / NAME-ONLY / REF-TERMS /
   HANDLER-UNREG · unresolved = the ladder found nothing. Without a sim, FULL / HANDLER is "playable (static)".
   The class map: every non-playable row's unconsumed fx keys, weighted by copies -- what a wave would build, one effect class at a time.

   Usage (from inside bot/): node gen-card-ledger.js [--decks k1,k2,...] [--sim DIR]... [--out docs/CARDS.md]
     default decks: every deck-*.json whose name starts with "V5 " (gen-precon.js writes them).                                         */

const fs = require('fs'), path = require('path');
const LEDGER_VERSION = '1.0.0';
const COV = require('./gen-deck-coverage.js');
const B = require('./elysium-bot.js');

function parseArgs(argv){
  const o = { decks: null, sims: [], out: path.join(__dirname, 'docs', 'CARDS.md') };
  for (let i = 2; i < argv.length; i++){
    const a = argv[i];
    if (a === '--decks') o.decks = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '--sim') o.sims.push(path.resolve(argv[++i]));
    else if (a === '--out') o.out = path.resolve(argv[++i]);
    else if (a === '--help' || a === '-h'){ console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); process.exit(0); }
    else { console.error('gen-card-ledger: unknown argument ' + a); process.exit(2); }
  }
  return o;
}

const STATUS_ORDER = ['unresolved', 'inert', 'partial', 'unseen', 'playable'];
function statusOf(verdict, uses, seated, haveSim){
  if (verdict === 'UNRESOLVED' || verdict === 'IN-CRYPT?') return 'unresolved';
  if (['INERT', 'NAME-ONLY', 'REF-TERMS', 'HANDLER-UNREG'].includes(verdict)) return 'inert';
  if (['PARTIAL', 'TABLED-ONLY', 'UNREACHABLE'].includes(verdict)) return 'partial';
  if (!haveSim || !seated) return 'playable';   // FULL / HANDLER, nothing to read it against
  return uses > 0 ? 'playable' : 'unseen';
}

function main(){
  const o = parseArgs(process.argv);
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
    if (x.status === 'playable' || x.status === 'unseen') continue;
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

  // the page
  const all = [...rows.values()].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || b.copies - a.copies || a.card.localeCompare(b.card));
  const L = [], P = s => L.push(s);
  const stIn = (x, k) => statusOf(x.verdict, x.usesBy[k] || 0, seatedBy[k] || 0, haveSim);   // a card's status IN one deck
  const copiesAt = st => all.reduce((s, x) => s + Object.entries(x.decks).reduce((t, [k, n]) => t + (stIn(x, k) === st ? n : 0), 0), 0);
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
  P('**Status:** playable = the bot plays every mode it can reach and some deck played the card in the sim (per deck below: that deck did) · unseen = it could, its decks sat, it never did (a pricing question first, LESSONS L-9) · partial = some modes, or a master played blind · inert = nothing the bot reads · unresolved = the name finds no card. **Uses** = decisions to play the card from hand (action and master picks; a master the loop then holds for want of a target still counts) plus every card play the bot emits in a window, counted in the deck that played it, over the matches that deck sat in. A verdict is static (what the code CAN do); uses are what the table DID (L-47).');
  P('');
  P('## Summary (' + all.length + ' cards, ' + all.reduce((s, x) => s + x.copies, 0) + ' library copies)');
  P('');
  P('| status | cards (any deck) | copies (in their deck) |'); P('|---|---:|---:|');
  STATUS_ORDER.slice().reverse().forEach(st => P('| ' + st + ' | ' + all.filter(x => x.status === st).length + ' | ' + copiesAt(st) + ' |'));
  P('');
  P('## Per deck (library copies by status; seated = matches in the sim)');
  P('');
  P('| deck | playable | unseen | partial | inert | unresolved | seated |'); P('|---|---:|---:|---:|---:|---:|---:|');
  for (const d of decks){   // per deck, a card's status is its status IN THAT DECK: a card another deck played is still unseen here
    const c = st => all.filter(x => x.decks[d.key] && stIn(x, d.key) === st).reduce((s, x) => s + x.decks[d.key], 0);
    P('| ' + d.key + ' | ' + c('playable') + ' | ' + c('unseen') + ' | ' + c('partial') + ' | ' + c('inert') + ' | ' + c('unresolved') + ' | ' + (seatedBy[d.key] || 0) + ' |');
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
      ' | ' + (x.rulings == null ? '—' : x.rulings) + ' | ' + (x.suite.length ? x.suite.slice(0, 8).join(', ') + (x.suite.length > 8 ? ' +' + (x.suite.length - 8) : '') : '—') + ' | ' + (x.status === 'playable' ? '' : x.missing.join('; ')) + ' |');
  }
  P('');
  fs.mkdirSync(path.dirname(o.out), { recursive: true });
  fs.writeFileSync(o.out, L.join('\n'));
  console.log('gen-card-ledger v' + LEDGER_VERSION + ': ' + all.length + ' cards over ' + decks.length + ' decks -- ' + STATUS_ORDER.slice().reverse().map(st => st + ' ' + all.filter(x => x.status === st).length).join(', ') + ' -> ' + path.relative(process.cwd(), o.out));
  return 0;
}

if (require.main === module) process.exit(main());
module.exports = { statusOf, LEDGER_VERSION };
