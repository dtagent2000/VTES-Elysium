#!/usr/bin/env node
'use strict';
/* gen-precon.js v1.0.0 (29 Oct 2026, bot v0.6.212) -- the V5 preconstructed decks, built from KRCG's card data.

   Why: the V5 plan (BOARD) makes the V5 precons playable in waves. Their lists are in vtes.json's `sets` data (each card says
   which precon carries it and how many copies), so they are generated, not typed. The four starters the bot already plays
   (malkavian, tremere, nosferatu, ventrue) are the generator's control: it must reproduce them card for card.

   What it does:
   - Builds every precon of the V5 sets (Fifth Edition, its Anarch and Companion sets, Sabbat V5) as a playbook
     {name, crypt:[{name, qty}], library:[{name, qty}]}, the shape of the deck-*.json files and of ARCHETYPES.
   - A card is written under its PRINTED name when the bot's own lookup ladder (exact -> lowercase alias -> FX_NORM index,
     the same three tiers as Bot.fxLookup) resolves that name to the same KRCG card; otherwise under KRCG's full name
     (a vampire whose plain name belongs to another group).
   - Writes deck-<key>.json beside this script for every precon that has no file yet. An existing file is never
     overwritten: it is compared with the generated list instead.
   - Compares by KRCG card id and quantity (so "Pentex(TM) Subversion" and "Pentex™ Subversion" are one card), and also
     compares the decks embedded in elysium-bot.js (ARCHETYPES) with their files.

   Usage (from inside bot/, with vtes.json beside it -- root CLAUDE.md, "Data that is not in git"):
     node gen-precon.js            write the missing deck files, compare the existing ones; exit 1 on any DIFF / unresolved card
     node gen-precon.js --check    write nothing; the same comparisons (a gate-style check after a vtes.json refresh)
     node gen-precon.js --list     print the precon keys with their set, release date and card counts
   Options: --vtes FILE (default ./vtes.json) · --dir DIR (where deck files live, default this folder)                      */

const fs = require('fs'), path = require('path');

const GEN_PRECON_VERSION = '1.0.0';
const V5_SETS = ['Fifth Edition', 'Fifth Edition (Anarch)', 'Fifth Edition (Companion)', 'Sabbat V5'];
const SET_LABEL = { 'Fifth Edition': 'Starter', 'Fifth Edition (Anarch)': 'Anarch', 'Fifth Edition (Companion)': 'Companion', 'Sabbat V5': 'Sabbat' };
const isCrypt = c => (c.types || []).some(t => t === 'Vampire' || t === 'Imbued');

/* The deck key: lowercase letters only ('Banu Haqim' -> banuhaqim, 'Path of Power and the Inner Voice' -> pathpower). No
   hyphen, because the sim's DECK:k=v knob form reads the deck as a word. */
function preconKey(precon){
  const m = /^Path of (\w+)/i.exec(precon);
  return (m ? 'path' + m[1] : precon).toLowerCase().replace(/[^a-z]/g, '');
}

function parseArgs(argv){
  const o = { vtes: path.join(__dirname, 'vtes.json'), dir: __dirname, check: false, list: false };
  for (let i = 2; i < argv.length; i++){
    const a = argv[i];
    if (a === '--check') o.check = true;
    else if (a === '--list') o.list = true;
    else if (a === '--vtes') o.vtes = argv[++i];
    else if (a === '--dir') o.dir = argv[++i];
    else if (a === '--help' || a === '-h') o.help = true;
    else { console.error('gen-precon: unknown argument ' + a); process.exit(2); }
  }
  return o;
}

/* KRCG's names for one card: the full name, the printed name, the ASCII form and the listed variants. */
function namesOf(c){ return [c.name, c.printed_name, c._name].concat(c.name_variants || []).filter(Boolean); }

function main(){
  const o = parseArgs(process.argv);
  if (o.help){ console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); return 0; }
  if (!fs.existsSync(o.vtes)){
    console.error('gen-precon: ' + o.vtes + ' is missing -- fetch KRCG\'s vtes.json first (root CLAUDE.md, "Data that is not in git")');
    return 2;
  }
  const B = require(path.join(__dirname, 'elysium-bot.js'));
  const fx = B.loadCardfx(path.join(__dirname, 'elysium-cardfx.json'));
  if (!fx){ console.error('gen-precon: elysium-cardfx.json missing or invalid beside the script'); return 2; }
  const cards = JSON.parse(fs.readFileSync(o.vtes, 'utf8'));

  // the bot's own ladder (Bot.fxLookup): exact -> lowercase alias -> client-identical FX_NORM index
  const lookup = n => {
    const hit = k => fx.lib[k] ? { kind: 'lib', key: k } : fx.crypt[k] ? { kind: 'crypt', key: k } : null;
    let h = hit(n); if (h) return h;
    const a = fx.alias[String(n).trim().toLowerCase()]; if (a && (h = hit(a))) return h;
    const v = fx.normIdx.get(B.FX_NORM(n)); if (v && (h = hit(v))) return h;
    return null;
  };
  // KRCG id by any exact name form; a form two cards share is left out (the ladder decides those)
  const idBy = new Map(), shared = new Set();
  for (const c of cards) for (const n of new Set(namesOf(c))){
    if (idBy.has(n) && idBy.get(n) !== c.id) shared.add(n); else idBy.set(n, c.id);
  }
  shared.forEach(n => idBy.delete(n));
  // a deck line -> the KRCG id: through the bot's ladder first (the key it plays), then the name itself
  const idOf = n => { const h = lookup(n); return (h && idBy.get(h.key)) || idBy.get(n) || null; };

  // build every V5 precon from the cards' sets data
  const decks = new Map();
  for (const c of cards) for (const s of V5_SETS) for (const e of ((c.sets || {})[s] || [])){
    if (!e || !e.precon) continue;
    const key = preconKey(e.precon);
    if (!decks.has(key)) decks.set(key, { key, set: s, precon: e.precon, release: e.release_date || '', crypt: [], library: [] });
    const d = decks.get(key);
    if (d.set !== s) throw new Error('precon key ' + key + ' appears in two sets (' + d.set + ', ' + s + ')');
    const printed = c.printed_name || c._name || c.name;
    const name = idOf(printed) === c.id ? printed : c.name;
    (isCrypt(c) ? d.crypt : d.library).push({ name, qty: +e.copies || 1, id: c.id });
  }
  const order = [...decks.values()].sort((a, b) => V5_SETS.indexOf(a.set) - V5_SETS.indexOf(b.set) || a.precon.localeCompare(b.precon));
  const count = list => list.reduce((s, x) => s + x.qty, 0);
  const deckName = d => 'V5 ' + SET_LABEL[d.set] + ' — ' + d.precon + ' (Black Chantry ' + String(d.release).slice(0, 4) + ')';

  if (o.list){
    order.forEach(d => console.log(d.key.padEnd(12) + ' ' + (d.set + ' / ' + d.precon).padEnd(55) + ' ' + d.release + '  crypt ' + count(d.crypt) + ' / library ' + count(d.library)));
    return 0;
  }

  // compare a playbook with a generated deck by KRCG id and quantity
  const byId = (list, what) => { const m = new Map(), bad = [];
    for (const x of list){ const id = idOf(x.name); if (!id){ bad.push(what + ' "' + x.name + '" resolves to no KRCG card'); continue; } m.set(id, (m.get(id) || 0) + (+x.qty || 1)); }
    return { m, bad }; };
  const nameOfId = new Map(cards.map(c => [c.id, c.name]));
  function diff(book, gen, la, lb){
    const out = [];
    for (const part of ['crypt', 'library']){
      const a = byId(book[part] || [], part), b = byId(gen[part], part);
      out.push(...a.bad, ...b.bad);
      for (const id of new Set([...a.m.keys(), ...b.m.keys()])){
        if ((a.m.get(id) || 0) !== (b.m.get(id) || 0)) out.push(part + ' ' + nameOfId.get(id) + ': ' + la + ' ' + (a.m.get(id) || 0) + ', ' + lb + ' ' + (b.m.get(id) || 0));
      }
    }
    return out;
  }

  let bad = 0, wrote = 0;
  for (const d of order){
    const file = path.join(o.dir, 'deck-' + d.key + '.json');
    const unresolved = d.crypt.concat(d.library).filter(x => !lookup(x.name)).map(x => x.name);
    const gen = { name: deckName(d), crypt: d.crypt.map(({ name, qty }) => ({ name, qty })), library: d.library.map(({ name, qty }) => ({ name, qty })) };
    let state;
    if (fs.existsSync(file)){
      const dd = diff(JSON.parse(fs.readFileSync(file, 'utf8')), d, 'file', 'generated');
      state = dd.length ? 'DIFF  ' + dd.join('; ') : 'IDENTICAL (by KRCG id and quantity)';
      if (dd.length) bad++;
    } else if (o.check){
      state = 'NO FILE (run without --check to write it)'; bad++;   // a precon KRCG added since the last run is a finding, not a pass
    } else {
      fs.writeFileSync(file, JSON.stringify(gen) + '\n');
      state = 'written'; wrote++;
    }
    if (unresolved.length){ bad++; state += '  UNRESOLVED by the bot: ' + unresolved.join(', '); }
    console.log(('deck-' + d.key + '.json').padEnd(24) + ' ' + String(count(d.crypt)).padStart(2) + ' crypt / ' + String(count(d.library)).padStart(2) + ' library  ' + state);
  }
  // the decks embedded in elysium-bot.js against their files (BOARD: embedded and duplicated until decks become data)
  for (const k of Object.keys(B.ARCHETYPES)){
    const file = path.join(o.dir, 'deck-' + k + '.json');
    if (!fs.existsSync(file)){ console.log(('ARCHETYPES.' + k).padEnd(24) + ' no deck file (embedded only)'); continue; }
    const dd = diff(B.ARCHETYPES[k], JSON.parse(fs.readFileSync(file, 'utf8')), 'embedded', 'file');
    if (dd.length) bad++;
    console.log(('ARCHETYPES.' + k).padEnd(24) + ' ' + (dd.length ? 'DIFF  ' + dd.join('; ') : 'equals deck-' + k + '.json'));
  }
  console.log('gen-precon v' + GEN_PRECON_VERSION + ': ' + order.length + ' precons' + (o.check ? '' : ', ' + wrote + ' written') + ', ' + (bad ? bad + ' problem(s)' : 'no problems'));
  return bad ? 1 : 0;
}

if (require.main === module) process.exit(main());
module.exports = { preconKey, V5_SETS, GEN_PRECON_VERSION };
