#!/usr/bin/env node
'use strict';
/* cardfx-sharing.js v1.0.0 (19 Nov 2026, bot v0.6.234; RULINGS D-125, docs/specs/spec-card-sweep-2026-11-18.md §2 and §4.1) --
   THE SHARING REGISTER. The V5 sweep's rule: no hand key before "who else in the library prints this?" has an answer on file.

   A HAND-ONLY key is an fx key (a key of a mode's `fx`, or of `ref.fx`) that sits on library entries with `src: 'hand'` and on no
   other entry of elysium-cardfx.json: an effect the bot reads that only hand curation has given to cards, so the rest of the library
   gets nothing from it. cardfx-sharing.json answers each one:
     unique   { key: [entries] }   this card alone prints the effect (the hand entry's remainder, the spec's T3): the entries that carry it
     shared   { key: [cards] }     other library cards print it too (T2): the cards that print it by KRCG's text, two or more; the key is
                                   owed a general source (a compiler pattern, or a reviewed card list), and the row stays when it has one
     backlog  [keys]               not asked yet: the keys that were hand-only when the register was seeded (`seed`), minus the answered
   check(lib, register) returns the problems the gate prints (test-cardfx.js fails on any of them):
     - a hand-only key with no row, or with a row in two states;
     - a backlog key that is not in the seed (a NEW hand key comes with its answer: the backlog only shrinks), or a seed that is not
       the one this file pins (SEED_COUNT, SEED_SHA256: the seed is frozen);
     - a backlog or unique row whose key is no longer hand-only (the compiler or a list gives it now: move the row to shared, or delete it);
     - a unique row that does not name exactly the entries that carry the key (one card, or one card under its two printed names);
       a shared row with fewer than two cards, naming a card the library does not have, or for a key no library entry carries.
   A shared row is OWED while a card it names does not carry the key (counts().owed, in the ledger): the debt a round pays.
   Usage (from inside bot/): node cardfx-sharing.js          the counts, and every problem (exit 1 on a problem)
                             node cardfx-sharing.js --seed   print a fresh register for the committed library: every hand-only key as
                                                              backlog (how the file was seeded; never run over a register with answers) */

const fs = require('fs'), path = require('path'), crypto = require('crypto');
const VERSION = '1.0.0';
const SEED_COUNT = 145, SEED_SHA256 = '77dc535cbb7aebad1bde2abc1aecdad3b7a04899208e9585cb737613597cb0e4';   // the hand-only keys of bot v0.6.234, sorted and joined by '\n'

const fxKeysOf = e => { const s = new Set(); if (!e) return s;
  for (const mo of (e.modes || [])) for (const k of Object.keys((mo && mo.fx) || {})) s.add(k);
  if (e.ref && e.ref.fx) for (const k of Object.keys(e.ref.fx)) s.add(k);
  return s; };

function handOnlyKeys(lib){   // Map key -> [entry names], the entries sorted: on hand entries and on no other
  const hand = new Map(), other = new Set();
  for (const name of Object.keys(lib || {}).sort()){ const e = lib[name];
    for (const k of fxKeysOf(e)){ if (e.src === 'hand'){ if (!hand.has(k)) hand.set(k, []); hand.get(k).push(name); } else other.add(k); } }
  for (const k of other) hand.delete(k);
  return hand;
}

const seedHash = keys => crypto.createHash('sha256').update(keys.slice().sort().join('\n')).digest('hex');

function check(lib, reg, pin){   // pin = { count, sha256 } (the tests pass their own); returns an array of problem strings
  const P = [], ho = handOnlyKeys(lib), r = reg || {}, carried = new Set();
  for (const name of Object.keys(lib || {})) for (const k of fxKeysOf(lib[name])) carried.add(k);
  const seed = Array.isArray(r.seed) ? r.seed : [], backlog = Array.isArray(r.backlog) ? r.backlog : [];
  const shared = (r.shared && typeof r.shared === 'object') ? r.shared : {}, unique = (r.unique && typeof r.unique === 'object') ? r.unique : {};
  const want = pin || { count: SEED_COUNT, sha256: SEED_SHA256 };
  if (seed.length !== want.count || seedHash(seed) !== want.sha256) P.push('the seed is not the frozen one (' + seed.length + ' keys, ' + seedHash(seed).slice(0, 12) + '…; pinned ' + want.count + ', ' + want.sha256.slice(0, 12) + '…)');
  const seedSet = new Set(seed), stateOf = new Map();
  const put = (k, st) => { if (stateOf.has(k)) P.push('`' + k + '` has two rows (' + stateOf.get(k) + ' and ' + st + ')'); else stateOf.set(k, st); };
  backlog.forEach(k => put(k, 'backlog')); Object.keys(shared).forEach(k => put(k, 'shared')); Object.keys(unique).forEach(k => put(k, 'unique'));
  for (const k of [...ho.keys()].sort()) if (!stateOf.has(k)) P.push('`' + k + '` is a hand-only key with no row (on ' + ho.get(k).join(', ') + '): who else in the library prints it? Answer it as unique or shared (spec-card-sweep §2)');
  for (const k of backlog){
    if (!seedSet.has(k)) P.push('`' + k + '` is in the backlog and not in the seed: a new hand key comes with its answer');
    if (!ho.has(k)) P.push('`' + k + '` is in the backlog and is no longer hand-only: move its row to shared, or delete it');
  }
  for (const k of Object.keys(unique)){
    const named = (Array.isArray(unique[k]) ? unique[k] : [unique[k]]).slice().sort(), has = ho.get(k);
    if (!has) P.push('`' + k + '` is unique in the register and is no longer hand-only: move its row to shared, or delete it');
    else if (JSON.stringify(named) !== JSON.stringify(has)) P.push('`' + k + '` is unique to ' + named.join(', ') + ' in the register; the library has it on ' + has.join(', '));
  }
  for (const k of Object.keys(shared)){
    const cards = Array.isArray(shared[k]) ? shared[k] : [];
    if (!carried.has(k)) P.push('`' + k + '` is shared in the register and no library entry carries it');
    if (cards.length < 2) P.push('`' + k + '` is shared and names ' + cards.length + ' card(s): a shared effect is printed by at least two');
    cards.filter(c => !(lib && Object.prototype.hasOwnProperty.call(lib, c))).forEach(c => P.push('`' + k + '` is shared with ' + c + ', which the library does not have'));
  }
  return P;
}

function counts(lib, reg){   // what the ledger prints
  const ho = handOnlyKeys(lib), r = reg || {}, rows = new Set([].concat(r.backlog || [], Object.keys(r.shared || {}), Object.keys(r.unique || {})));
  const owed = Object.keys(r.shared || {}).filter(k => (r.shared[k] || []).some(c => !fxKeysOf((lib || {})[c]).has(k))).length;
  return { handOnly: ho.size, single: [...ho.values()].filter(v => v.length === 1).length, backlog: (r.backlog || []).length,
    shared: Object.keys(r.shared || {}).length, owed, unique: Object.keys(r.unique || {}).length, noRow: [...ho.keys()].filter(k => !rows.has(k)).length };
}

function seedRegister(lib){
  const keys = [...handOnlyKeys(lib).keys()].sort();
  return { about: 'The sharing register (RULINGS D-125; docs/specs/spec-card-sweep-2026-11-18.md §2, §4.1): every fx key that only hand entries of elysium-cardfx.json carry, and who else in the library prints it. cardfx-sharing.js says what each part means and checks it; test-cardfx.js is the gate.',
    seed: keys, backlog: keys.slice(), shared: {}, unique: {} };
}

if (require.main === module){
  const here = f => path.join(__dirname, f), lib = JSON.parse(fs.readFileSync(here('elysium-cardfx.json'), 'utf8')).lib;
  if (process.argv[2] === '--seed'){ const s = seedRegister(lib); console.log(JSON.stringify(s, null, 1)); console.error('seed: ' + s.seed.length + ' keys, sha256 ' + seedHash(s.seed)); process.exit(0); }
  if (process.argv[2]){ console.error('cardfx-sharing: unknown argument ' + process.argv[2]); process.exit(2); }
  let reg = null; try { reg = JSON.parse(fs.readFileSync(here('cardfx-sharing.json'), 'utf8')); } catch (e){ console.error('cardfx-sharing: no readable cardfx-sharing.json (' + e.message + ')'); process.exit(1); }
  const c = counts(lib, reg), P = check(lib, reg);
  console.log('cardfx-sharing v' + VERSION + ': ' + c.handOnly + ' hand-only keys (' + c.single + ' on a single entry) -- backlog ' + c.backlog + ', shared ' + c.shared + ' (' + c.owed + ' owed), unique ' + c.unique + ', no row ' + c.noRow + (P.length ? ' -- ' + P.length + ' problem(s)' : ' -- no problem'));
  P.forEach(p => console.error('  ' + p));
  process.exit(P.length ? 1 : 0);
}
module.exports = { VERSION, SEED_COUNT, SEED_SHA256, fxKeysOf, handOnlyKeys, seedHash, check, counts, seedRegister };
