#!/usr/bin/env node
'use strict';
/* cardfx-sharing.js v1.0.0 (19 Nov 2026, bot v0.6.234; RULINGS D-125, docs/specs/spec-card-sweep-2026-11-18.md §2 and §4.1) --
   THE SHARING REGISTER. The V5 sweep's rule: no hand key before "who else in the library prints this?" has an answer on file.

   A HAND-ONLY key is an fx key (a key of a mode's `fx`, or of `ref.fx`) that sits on LIBRARY entries with `src: 'hand'` and on no
   other library entry of elysium-cardfx.json: an effect only hand curation has given to cards, so the rest of the library gets
   nothing from it. cardfx-sharing.json holds a row for each:
     unique   { key: [entries] }   one card alone prints the effect (the hand entry's remainder, the spec's T3): the entries that carry
                                   it -- one card, or one card under its two printed spellings (cardNorm)
     shared   { key: [cards] }     other library cards print it too (T2): the cards that print it by KRCG's text, at least two different
                                   cards, every hand entry that carries the key among them; the key is owed a general source (a compiler
                                   pattern, or the reviewed list) and the row stays when it has one
     backlog  [keys]               not asked yet: keys that were hand-only when the register was seeded, each still on entries the
                                   seed found it on and on no other
     seed     { key: [entries] }   the hand-only keys of bot v0.6.234 and where they sat, frozen (SEED_COUNT, SEED_SHA256)
   check(lib, register) returns the problems the gate prints (test-cardfx.js fails on any of them):
     - a malformed part or row; a seed that is not the frozen one;
     - a hand-only key with no row, or with rows in two states;
     - a backlog key that is not in the seed (a NEW hand key comes with its answer), that an entry outside its seed row carries (a
       backlog key reaches no other card before it is answered), or that is no longer hand-only (move the row to shared, or delete it);
     - a unique row for a key that is no longer hand-only, that does not name exactly the entries that carry the key, or whose
       entries are two different cards (then it is shared);
     - a shared row with fewer than two different cards, naming a card the library does not have, missing a hand entry that carries
       the key, or for a key no library entry carries.
   What it does NOT guard (spec-card-sweep's Status has the list): a row moved back into the backlog (an edit a review sees); whether
   a shared row's list is complete; a shared row's debt -- the row is OWED while a card it names does not carry the key
   (counts().owed: the ledger prints it, a round reports it); and everything outside a library entry's fx keys (an entry-level or
   mode-level field, `req`, a crypt key).
   Usage (from inside bot/): node cardfx-sharing.js          the counts and every problem (exit 1 on a problem). It reads the COMPILED
                                                              library: after a change to cardfx-curated.json, compile first
                                                              (test-cardfx.js checks its own compile)
                             node cardfx-sharing.js --seed   print a fresh register for the compiled library: every hand-only key in the
                                                              seed and the backlog (how the file was made; never over a register with answers) */

const fs = require('fs'), path = require('path'), crypto = require('crypto');
const VERSION = '1.0.0';
const SEED_COUNT = 145, SEED_SHA256 = '8028cd6e1a27e8ddbba1d7f4a1b591fe7f0e0d2875309d012dad8be2ed598490';   // the hand-only keys of bot v0.6.234 with their entries: sha256 of seedText()

const fxKeysOf = e => { const s = new Set(); if (!e) return s;
  for (const mo of (e.modes || [])) for (const k of Object.keys((mo && mo.fx) || {})) s.add(k);
  if (e.ref && e.ref.fx) for (const k of Object.keys(e.ref.fx)) s.add(k);
  return s; };
/* one card under two printed spellings is one card: Pentex(TM) Subversion / Pentex™ Subversion (NFKD writes the sign as TM) */
const cardNorm = n => String(n).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const cardCount = names => new Set((names || []).map(cardNorm)).size;

function keyMap(lib){   // { hand: Map key -> [hand entries, sorted], other: Set of keys on entries that are not hand, all: Set of keys }
  const hand = new Map(), other = new Set(), all = new Set();
  for (const name of Object.keys(lib || {}).sort()){ const e = lib[name];
    for (const k of fxKeysOf(e)){ all.add(k); if (e.src === 'hand'){ if (!hand.has(k)) hand.set(k, []); hand.get(k).push(name); } else other.add(k); } }
  return { hand, other, all };
}
function handOnlyKeys(lib){   // Map key -> [entry names, sorted]: on hand entries and on no other library entry
  const m = keyMap(lib), out = new Map();
  for (const [k, v] of m.hand) if (!m.other.has(k)) out.set(k, v);
  return out;
}

const seedText = seed => Object.keys(seed || {}).sort().map(k => k + '\t' + (seed[k] || []).slice().sort().join('|')).join('\n');
const seedHash = seed => crypto.createHash('sha256').update(seedText(seed)).digest('hex');

function shape(reg){   // the register's four parts in their shapes; a malformed part or row is dropped from the view and reported
  const P = [], ok = !!reg && typeof reg === 'object' && !Array.isArray(reg), r = ok ? reg : {};
  if (!ok) P.push('the register is not an object');
  const names = v => Array.isArray(v) && v.length > 0 && v.every(x => typeof x === 'string' && x);
  const rows = part => { const o = r[part], out = {};
    if (!o || typeof o !== 'object' || Array.isArray(o)){ P.push('`' + part + '` is not an object of rows'); return out; }
    for (const k of Object.keys(o)){ if (names(o[k])) out[k] = o[k]; else P.push('`' + k + '` (' + part + '): a row is a list of names'); }
    return out; };
  const seed = rows('seed'), shared = rows('shared'), unique = rows('unique');
  let backlog = r.backlog;
  if (!Array.isArray(backlog) || !backlog.every(x => typeof x === 'string' && x)){ P.push('`backlog` is not a list of keys'); backlog = Array.isArray(backlog) ? backlog.filter(x => typeof x === 'string' && x) : []; }
  return { seed, backlog, shared, unique, P };
}

function check(lib, reg, pin){   // pin = { count, sha256 } (the gate's planted cases pass their own); returns an array of problem strings
  const m = keyMap(lib), ho = handOnlyKeys(lib), s = shape(reg), P = s.P.slice();
  const want = pin || { count: SEED_COUNT, sha256: SEED_SHA256 }, q = k => '`' + k + '`';
  const nSeed = Object.keys(s.seed).length;
  if (nSeed !== want.count || seedHash(s.seed) !== want.sha256) P.push('the seed is not the frozen one (' + nSeed + ' keys, ' + seedHash(s.seed).slice(0, 12) + '…; pinned ' + want.count + ', ' + String(want.sha256).slice(0, 12) + '…)');
  const stateOf = new Map();
  const put = (k, st) => { if (stateOf.has(k)) P.push(q(k) + ' has two rows (' + stateOf.get(k) + ' and ' + st + ')'); else stateOf.set(k, st); };
  s.backlog.forEach(k => put(k, 'backlog')); Object.keys(s.shared).forEach(k => put(k, 'shared')); Object.keys(s.unique).forEach(k => put(k, 'unique'));
  for (const k of [...ho.keys()].sort()) if (!stateOf.has(k)) P.push(q(k) + ' is a hand-only key with no row (on ' + ho.get(k).join(', ') + '): who else in the library prints it? Answer it as unique or shared (spec-card-sweep §2)');
  for (const k of s.backlog){
    const has = ho.get(k), was = s.seed[k];
    if (!was) P.push(q(k) + ' is in the backlog and not in the seed: a new hand key comes with its answer');
    if (!has) P.push(q(k) + ' is in the backlog and is no longer hand-only: move its row to shared, or delete it');
    else if (was){ const spread = has.filter(n => !was.includes(n));
      if (spread.length) P.push(q(k) + ' is in the backlog and now also on ' + spread.join(', ') + ': answer it (unique or shared) before another card carries it'); }
  }
  for (const k of Object.keys(s.unique)){
    const named = s.unique[k].slice().sort(), has = ho.get(k);
    if (!has) P.push(q(k) + ' is unique in the register and is no longer hand-only: move its row to shared, or delete it');
    else if (JSON.stringify(named) !== JSON.stringify(has)) P.push(q(k) + ' is unique to ' + named.join(', ') + ' in the register; the library has it on ' + has.join(', '));
    else if (cardCount(has) > 1) P.push(q(k) + ' is unique in the register and ' + cardCount(has) + ' different cards carry it (' + has.join(', ') + '): two cards print it, so it is shared');
  }
  for (const k of Object.keys(s.shared)){
    const cards = s.shared[k], n = cardCount(cards);
    if (!m.all.has(k)) P.push(q(k) + ' is shared in the register and no library entry carries it');
    if (n < 2) P.push(q(k) + ' is shared and names ' + n + ' card' + (n === 1 ? '' : 's') + ': a shared effect is printed by at least two different cards');
    cards.filter(c => !(lib && Object.prototype.hasOwnProperty.call(lib, c))).forEach(c => P.push(q(k) + ' is shared with ' + c + ', which the library does not have'));
    (m.hand.get(k) || []).filter(e => !cards.includes(e)).forEach(e => P.push(q(k) + ' is shared and its row does not name ' + e + ', a hand entry that carries it'));
  }
  return P;
}

function counts(lib, reg){   // what the ledger prints; never throws on a malformed register (check() reports that)
  const ho = handOnlyKeys(lib), s = shape(reg), rows = new Set([].concat(s.backlog, Object.keys(s.shared), Object.keys(s.unique)));
  const owed = Object.keys(s.shared).filter(k => s.shared[k].some(c => !fxKeysOf((lib || {})[c]).has(k))).length;
  return { handOnly: ho.size, single: [...ho.values()].filter(v => v.length === 1).length, backlog: s.backlog.length,
    shared: Object.keys(s.shared).length, owed, unique: Object.keys(s.unique).length, noRow: [...ho.keys()].filter(k => !rows.has(k)).length };
}

function seedRegister(lib){
  const ho = handOnlyKeys(lib), seed = {};
  for (const k of [...ho.keys()].sort()) seed[k] = ho.get(k).slice();
  return { about: 'The sharing register (RULINGS D-125; docs/specs/spec-card-sweep-2026-11-18.md §2, §4.1): every fx key that only hand entries of the library carry, and who else in the library prints it. cardfx-sharing.js says what each part means and checks it; test-cardfx.js is the gate.',
    seed, backlog: Object.keys(seed), shared: {}, unique: {} };
}
function serialize(reg){   // one row a line, so that answering a key is a two-line diff
  const J = JSON.stringify, rows = o => { const ks = Object.keys(o); return ks.length ? '{\n' + ks.map(k => '  ' + J(k) + ': ' + J(o[k])).join(',\n') + '\n }' : '{}'; };
  return '{\n "about": ' + J(reg.about) + ',\n "seed": ' + rows(reg.seed) + ',\n "backlog": ' + (reg.backlog.length ? '[\n' + reg.backlog.map(k => '  ' + J(k)).join(',\n') + '\n ]' : '[]') +
    ',\n "shared": ' + rows(reg.shared) + ',\n "unique": ' + rows(reg.unique) + '\n}\n';
}

if (require.main === module){
  const here = f => path.join(__dirname, f), lib = JSON.parse(fs.readFileSync(here('elysium-cardfx.json'), 'utf8')).lib;
  if (process.argv[2] === '--seed'){ const s = seedRegister(lib); process.stdout.write(serialize(s)); console.error('seed: ' + Object.keys(s.seed).length + ' keys, sha256 ' + seedHash(s.seed)); process.exit(0); }
  if (process.argv[2]){ console.error('cardfx-sharing: unknown argument ' + process.argv[2]); process.exit(2); }
  let reg = null; try { reg = JSON.parse(fs.readFileSync(here('cardfx-sharing.json'), 'utf8')); } catch (e){ console.error('cardfx-sharing: no readable cardfx-sharing.json (' + e.message + ')'); process.exit(1); }
  const c = counts(lib, reg), P = check(lib, reg);
  console.log('cardfx-sharing v' + VERSION + ' (the compiled library): ' + c.handOnly + ' hand-only keys (' + c.single + ' on a single entry) -- backlog ' + c.backlog + ', shared ' + c.shared + ' (' + c.owed + ' owed), unique ' + c.unique + ', no row ' + c.noRow + (P.length ? ' -- ' + P.length + ' problem(s)' : ' -- no problem'));
  P.forEach(p => console.error('  ' + p));
  process.exit(P.length ? 1 : 0);
}
module.exports = { VERSION, SEED_COUNT, SEED_SHA256, fxKeysOf, cardNorm, keyMap, handOnlyKeys, seedText, seedHash, shape, check, counts, seedRegister, serialize };
