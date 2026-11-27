#!/usr/bin/env node
'use strict';
/* gen-reader-gate.js v1.1.0 (27 Nov 2026, C1b: the readers bot v0.6.244 adds -- a bleed card's header and its discipline lines, a stealth
   mode's own bleed, the 'or' option's bleed alone, a price (payBlood: read only by a reader that pays it), the plusIf conditions on the
   action and its actor, a retainer's conditional intercept; v1.0.0 27 Nov 2026) -- THE READER GATE: the card chain's static link from the card data to the code (RULINGS D-147).

   Why: the sweep checks the card data well, but a corrected value no code reads is half-done -- right data, not right play (C1's
   lesson: SWEEP-REGISTER 7.6). This gate makes it show at once, not in the register.

   The rows: cardfx-exact.json's (the families' exactness record, D-144) -- card -> family -> a state, or level -> state. A row is GATED when
     (a) a round corrected it (state `corrected`), or
     (b) its state keeps our value (agree, graded, corrected, explained) and the bot plays the card through the family's own paths: a
         mode READERS takes (playedBy, below).
   A kept row on a card the bot never plays, or plays only through another finder, is counted here, not gated: the ledger's (CARDS.md:
   inert, partial) until a family's READERS covers that finder.

   A gated row is READ when every value of its family that our entry carries at that level has a reader of that shape: the family's keys
   are cross-check-pairing.json's `ours` (the family's own list, so a new family brings its keys), and READERS below names, for each key,
   the bot's functions that read it and the card types and mode shapes each takes -- mirrored from the code, line for line, the way the
   coverage tool's CLASS map is. READERS cannot drift silently: each function it names must exist in elysium-bot.js and its body must
   read the key (the source check, --self-test and every run); a family key with no READERS entry stops the gate (the coverage tool's
   unknown-key alarm, applied here). A value under fx.plusIf is read only where _plusIf is asked for that key and its condition is one
   _plusIf knows (selfClan, selfTitled): an `unread` condition is no reader (D-144: the condition kept in words, failing closed).

   The known gaps: cardfx-exact.json's `gaps.reader` names each unread gated row's register entry (docs/SWEEP-REGISTER.md, D-135); the
   bench's own gaps are `gaps.bench` (test-card-scenarios.js). The gate FAILS on
     - an unread gated row with no entry: half-done (build the reader, or register the gap and list it);
     - a listed row that is read now, or no longer gated: stale (delete its line);
     - a listed entry that is no register entry (test-cardfx.js checks the ids too).

   Usage:  node gen-reader-gate.js [--json OUT] [--list]     the gate (exit 1 on a failure); --list prints every unread row
           node gen-reader-gate.js --self-test               the source check and planted cases (a new gap, a stale line, a plusIf
                                                             condition, a type with no reader) each caught
   Needs elysium-bot.js, elysium-cardfx.json, cardfx-exact.json, cross-check-pairing.json and gen-deck-coverage.js beside it.     */
const fs = require('fs'), path = require('path');
const GATE_VERSION = '1.1.0';
const here = f => path.join(__dirname, f);
const COV = require(here('gen-deck-coverage.js'));
const SRC = fs.readFileSync(here('elysium-bot.js'), 'utf8');

/* The bot's methods by name -> their source (a method starts at two spaces of indent and runs to the next one). */
function methodBodies(src){
  const out = new Map(), re = /^ {2}(?:async\s+)?(_?[A-Za-z][A-Za-z0-9_]*)\s*\([^)\n]*\)\s*\{/gm, hits = [];
  let m; while((m = re.exec(src))) hits.push({ name: m[1], at: m.index });
  hits.forEach((h, i) => { const body = src.slice(h.at, i + 1 < hits.length ? hits[i + 1].at : src.length); out.set(h.name, (out.get(h.name) || '') + body); });
  return out;
}
const BODIES = methodBodies(SRC);

const T = e => (e && e.t) || [];
const has = (e, ...ts) => T(e).some(t => ts.includes(t));
const bleedCard = e => (e.modes || []).some(m2 => m2 && m2.fx && m2.fx.bleedAct);              // v1.1.0: a card with a bleed mode
const lfBleed = e => (e.modes || []).some(m2 => m2 && !m2.at && m2.fx && m2.fx.bleedAct);      // v1.1.0: a level-free bleed whose discipline lines add to it (9.13)
/* READERS: key -> [{ fn, reads, take(e, mo) }]. `fn` is the method that reads the key on that shape; `reads` the property names its body
   must contain (the source check); take(e, mo) is the shape, mirrored from the method (its type filter, its mode filter). */
const READERS = {
  stealth: [
    { fn: '_bestStealthFor', reads: ['mod', '_modeStealth', 'payBlood'], take: (e, mo) => has(e, 'mod') && typeof mo.fx.stealth === 'number',
      why: 'a hand action modifier (type-filtered to mod), its price paid with the card' },
    { fn: '_modeStealth', reads: ['stealth'], take: (e, mo) => has(e, 'mod') && typeof mo.fx.stealth === 'number', why: 'its stealth value' }],
  actStealth: [
    { fn: '_bestBleedCardFor', reads: ['actStealth', 'bleedAct', '_cardActStealth'], take: (e, mo) => has(e, 'action') && (!!mo.fx.bleedAct || (!mo.at && bleedCard(e)) || (!!mo.at && lfBleed(e))),
      why: 'a bleed action card: the announce books its mode\'s stealth, its header\'s (v1.1.0, 9.13) and its discipline lines\' on a level-free bleed' },
    { fn: '_cardActStealth', reads: ['actStealth'], take: (e, mo) => has(e, 'action') && !mo.fx.bleedAct
        && (e.modes || []).some(m2 => { const v = COV.modeConsumed(m2, e); return v && v.ok && /^actStealth@|^rush$|^attach|^employ|^maneuverEach$/.test(v.via || ''); }),
      why: 'a card action whose finder books the header (the rush, the attach, the employ: the coverage tool\'s pairing)' },
    { fn: '_bestBloodStockFor', reads: ['actStealth', 'bloodAdd'], take: (e, mo) => has(e, 'action') && mo.fx.bloodAdd > 0 && mo.fx.bloodAddTo === 'unc',
      why: 'the blood stock action' },
    { fn: '_bestStrengthFor', reads: ['actStealth'], take: (e, mo) => has(e, 'action') && mo.fx.strengthBonus !== undefined,
      why: 'the strength action' },
    { fn: '_bestFetchFor', reads: ['actStealth', 'fetchEquip'], take: (e, mo) => !!mo.fx.fetchEquip, why: 'the fetch action' },
    { fn: '_bestCreepFor', reads: ['actStealth'], take: (e, mo) => mo.fx.preyBurnPerCopy !== undefined, why: 'Creeping Sabotage\'s action' },
    { fn: '_bestPoolDmgActionFor', reads: ['poolDmg', '_cardActStealth'], take: (e, mo) => has(e, 'action') && !mo.at && (e.modes || []).some(m2 => m2 && m2.fx && m2.fx.poolDmg > 0),
      why: 'a pool-damage action card: the announce books its header (v1.1.0, 9.13)' }],
  intercept: [
    { fn: '_bestInterceptFor', reads: ['intercept', 'payBlood'], take: (e, mo) => has(e, 'react', 'mod') && typeof mo.fx.intercept === 'number' && mo.when !== 'lockedBlock',
      why: 'a hand reaction or modifier (type-filtered to react / mod), its price paid with the card' },
    { fn: '_equipIntercept', reads: ['intercept'], take: (e, mo) => has(e, 'equip', 'retainer') && typeof mo.fx.intercept === 'number', why: 'borne equipment or a retainer' },
    { fn: '_bestUnlockReactFor', reads: ['intercept', 'unlock', 'payBlood'], take: (e, mo) => has(e, 'react') && !!mo.fx.unlock && !!mo.when, why: 'an unlock reaction with its window (`when`), its price paid (Second Tradition: Domain)' }],
  interceptPaid: [
    { fn: '_equipPaidIntercept', reads: ['interceptPaid'], take: (e, mo) => has(e, 'equip'), why: 'borne equipment' },
    { fn: '_bestUnlockReactFor', reads: ['interceptPaid'], take: (e, mo) => has(e, 'react') && !!mo.fx.unlock && !!mo.when, why: 'an unlock reaction with its window (`when`)' }],
  bleed: [
    { fn: '_bestBleedModifierFor', reads: ['bleed', 'bleedAct', 'stealthOpt', 'payBlood'], take: (e, mo) => has(e, 'mod') && typeof mo.fx.bleed === 'number' && !mo.fx.bleedAct && (mo.fx.stealth === undefined || !!mo.fx.stealthOpt),
      why: 'a hand bleed modifier (no bleedAct; a mode with stealth only when the stealth is optional, stealthOpt: the window after the block plays the bleed alone)' },
    { fn: '_bestStealthFor', reads: ['bleed', 'limited'], take: (e, mo) => has(e, 'mod') && typeof mo.fx.bleed === 'number' && typeof mo.fx.stealth === 'number' && !mo.fx.bleedAct,
      why: 'a stealth modifier\'s own bleed, booked with its stealth and its limited slot (v1.1.0, 10.17: Bonding [DOM])' },
    { fn: '_bestBleedCardFor', reads: ['bleed', 'bleedAct'], take: (e, mo) => has(e, 'action') && (!!mo.fx.bleedAct || (!!mo.at && lfBleed(e))), why: 'a bleed action card: its amount, and a discipline line\'s on a level-free bleed (v1.1.0, 9.13)' }],
  lockStealth: [ { fn: '_lockStealthFor', reads: ['lockStealth'], take: (e, mo) => has(e, 'master'), why: 'a location locked for stealth' }],
  lockStealthClan: [ { fn: '_lockStealthFor', reads: ['lockStealthClan'], take: (e, mo) => has(e, 'master'), why: 'its clan gate' }],
  lockStealthSect: [ { fn: '_lockStealthFor', reads: ['lockStealthSect'], take: (e, mo) => has(e, 'master'), why: 'its sect gate' }],
  lockStealthAt: [ { fn: '_lockStealthAtAnnounce', reads: ['lockStealthAt'], take: (e, mo) => has(e, 'master'), why: 'its announce window' }],
  lockIntercept: [ { fn: '_lockInterceptFor', reads: ['lockIntercept'], take: (e, mo) => has(e, 'master'), why: 'a location locked for intercept' }],
  lockInterceptClan: [ { fn: '_lockInterceptFor', reads: ['lockInterceptClan'], take: (e, mo) => has(e, 'master'), why: 'its clan gate' }],
  lockInterceptOn: [ { fn: '_lockInterceptFor', reads: ['lockInterceptOn'], take: (e, mo) => has(e, 'master'), why: 'its action kind' }],
  lockInterceptNotFirst: [ { fn: '_lockInterceptFor', reads: ['lockInterceptNotFirst'], take: (e, mo) => has(e, 'master'), why: 'its not-first rule' }],
  hostIntercept: [ { fn: '_hostedIntercept', reads: ['hostIntercept'], take: (e, mo) => has(e, 'master'), why: 'a master on its host' }]
};
/* plusIf: _plusIf(mo, key, vamp) is asked for these keys by these methods only (its callers, mirrored); the conditions it reads. */
const PLUSIF_CALLERS = { bleed: { fns: ['_bestBleedModifierFor'], take: (e, mo) => has(e, 'mod') && !mo.fx.bleedAct && (mo.fx.stealth === undefined || !!mo.fx.stealthOpt) },
                         intercept: { fns: ['_bestInterceptFor', '_interceptStack', '_equipIntercept'], take: (e, mo) => (has(e, 'react', 'mod') && mo.when !== 'lockedBlock') || has(e, 'equip', 'retainer') },   // v1.1.0: + borne equipment and retainers (Corpse Balloon [VIC])
                         stealth: { fns: ['_modeStealth'], take: (e, mo) => has(e, 'mod') } };   // v1.1.0: a hand stealth modifier's (High Aye, Mirror's Visage [CHI])
const PLUSIF_READ = ['selfClan', 'selfTitled', 'actorTitled', 'actorSect', 'actDirected', 'actUndirected'];   // v1.1.0: the bot's PLUSIF_CONDS (its source check below)

function sourceProblems(readers, callers, bodies){
  const P = [];
  for(const [key, rs] of Object.entries(readers)) for(const r of rs){
    const b = bodies.get(r.fn);
    if(!b) { P.push(key + ': ' + r.fn + ' is no method of elysium-bot.js'); continue; }
    for(const w of r.reads) if(!new RegExp('[.\'"]' + w + '\\b').test(b)) P.push(key + ': ' + r.fn + ' does not read ' + w);
  }
  for(const [key, c] of Object.entries(callers)) for(const fn of c.fns){
    const b = bodies.get(fn);
    if(!b) P.push('plusIf ' + key + ': ' + fn + ' is no method of elysium-bot.js');
    else if(!new RegExp('_plusIf\\([^)]*[\'"]' + key + '[\'"]').test(b)) P.push('plusIf ' + key + ': ' + fn + ' does not ask _plusIf for ' + key);
  }
  { const b = bodies.get('_plusIf'); if(!b) P.push('_plusIf is no method of elysium-bot.js');
    else for(const w of PLUSIF_READ) if(!new RegExp('\\.' + w + '\\b').test(b)) P.push('_plusIf does not read ' + w); }
  return P;
}

const KEPT = new Set(['agree', 'graded', 'corrected', 'explained']);
function modesAt(e, lvl){
  const ms = (e.modes || []).filter(mo => mo && mo.fx);
  if(lvl === 'all' || lvl == null) return ms;
  if(lvl === '-' || /^#\d+$/.test(lvl)) return ms.filter(mo => !mo.at);
  return ms.filter(mo => mo.at === lvl);
}
/* Does the bot play the card through this family's own paths: a mode some READERS entry takes (a hand stealth or bleed modifier, a
   reaction's intercept, a bleed card, a location's lock, borne equipment's intercept). A card the bot plays only through another
   finder (a rush, a pool-damage action, an attach) is not gated here: whether that finder books the card's printed stealth is the next
   family's READERS (the coverage tool's CLASS map has no card type, so its "consumed" cannot stand in: an ACTION card's fx.intercept is
   'play' to its scan, but _bestInterceptFor is type-filtered to reactions and modifiers). */
function playedBy(e, R){
  for(const mo of (e.modes || [])){
    if(!mo || !mo.fx) continue;
    if(has(e, 'action') && mo.fx.bleedAct) return { ok: true, via: 'bleedAct', fn: '_bestBleedCardFor' };   // a bleed card: its finder reads the mode's bleedAct
    for(const [k, rs] of Object.entries(R)){
      if(mo.fx[k] === undefined || k === 'actStealth') continue;   // a stealth header alone is no play of its own
      const r = rs.find(x => x.fn !== '_cardActStealth' && x.take(e, mo, { ok: false }));
      if(r) return { ok: true, via: k, fn: r.fn };
    }
  }
  return { ok: false };
}
/* One row: what our entry carries of the family at that level, and who reads each value. */
function judgeRow(e, famKeys, lvl, ctx){
  const R = ctx.readers || READERS, C = ctx.callers || PLUSIF_CALLERS;
  const played = playedBy(e, R);
  const vals = [];
  for(const mo of modesAt(e, lvl)){
    for(const k of famKeys){
      if(mo.fx[k] === undefined) continue;
      const rs = R[k];
      if(!rs){ vals.push({ at: mo.at || null, key: k, read: null, why: 'no READERS entry for ' + k, unknown: true }); continue; }
      const priced = (mo.fx.payBlood | 0) > 0;   // v1.1.0 (C1b): a value sold for blood is read only by a reader that pays the price
      const r = rs.find(x => x.take(e, mo, played) && (!priced || x.reads.includes('payBlood')));
      vals.push({ at: mo.at || null, key: k, read: r ? r.fn : null, why: r ? r.why : (priced && rs.some(x => x.take(e, mo, played)) ? 'a price (payBlood) no reader of this shape pays' : 'no reader for a ' + (T(e).join('+') || '?') + ' card of this shape') });
    }
    const pi = mo.fx.plusIf;
    if(pi && pi.add) for(const k of Object.keys(pi.add)){
      if(!famKeys.includes(k)) continue;
      const cond = Object.keys(pi.if || {}), unread = cond.some(c => !PLUSIF_READ.includes(c)), c = C[k];
      const ok = !unread && !!c && c.take(e, mo);
      vals.push({ at: mo.at || null, key: 'plusIf.' + k, read: ok ? '_plusIf' : null,
        why: unread ? 'an unread condition (' + String((pi.if || {}).unread || cond.join(',')).slice(0, 80) + ')' : (c ? 'no _plusIf caller for a ' + T(e).join('+') + ' card of this shape' : 'no _plusIf caller for ' + k) });
    }
  }
  const verdict = !vals.length ? 'no-value' : vals.every(v => v.read) ? 'read' : 'unread';
  return { played, vals, verdict };
}

function rowsOf(ex){
  const out = [];
  for(const [card, ks] of Object.entries((ex && ex.cards) || {}))
    for(const [fam, v] of Object.entries(ks))
      for(const [lvl, st] of Object.entries(typeof v === 'string' ? { all: v } : v)) out.push({ card, fam, lvl, st: String(st) });
  return out;
}
const gapAt = (g, r) => { const c = g && g[r.card]; const v = c && c[r.fam]; if(v == null) return null; return typeof v === 'string' ? (r.lvl === 'all' ? v : null) : (v[r.lvl] || null); };
function listedRows(g){ const out = [];
  for(const [card, ks] of Object.entries(g || {})) for(const [fam, v] of Object.entries(ks)) for(const [lvl, id] of Object.entries(typeof v === 'string' ? { all: v } : v)) out.push({ card, fam, lvl, id: String(id) });
  return out; }

/* The gate over a record: { rows, gated, read, unread, newGaps, stale, notGated, problems }. */
function runGate(ex, lib, pairing, opts){
  const o = opts || {}, famOf = {}; for(const [f, d] of Object.entries((pairing && pairing.family) || {})) famOf[f] = d.ours || [];
  const gaps = (ex && ex.gaps && ex.gaps.reader) || {};
  const res = { rows: 0, gated: 0, read: 0, unread: [], newGaps: [], stale: [], notGated: { kept: 0, unread: 0 }, noValue: 0, problems: [] };
  const seen = new Set();
  for(const r of rowsOf(ex)){
    res.rows++;
    const w = r.st.split(' ')[0], e = lib[r.card];
    if(!KEPT.has(w)) continue;
    if(!e){ res.problems.push(r.card + ': no library entry'); continue; }
    const keys = famOf[r.fam]; if(!keys){ res.problems.push(r.card + ': the family ' + r.fam + ' has no keys in cross-check-pairing.json'); continue; }
    const j = judgeRow(e, keys, r.lvl, o);
    j.vals.filter(v => v.unknown).forEach(v => res.problems.push(r.card + ' ' + r.fam + ': ' + v.why));
    const gated = w === 'corrected' || j.played.ok;
    const id = gapAt(gaps, r); if(id) seen.add(r.card + '|' + r.fam + '|' + r.lvl);
    if(!gated){ res.notGated.kept++; if(j.verdict === 'unread') res.notGated.unread++; if(id) res.stale.push(Object.assign({ id, why: 'not gated (a ' + w + ' row on a card the bot does not play)' }, r)); continue; }
    res.gated++;
    if(j.verdict === 'no-value'){ res.noValue++; if(id) res.stale.push(Object.assign({ id, why: 'no value of the family at this level' }, r)); continue; }
    if(j.verdict === 'read'){ res.read++; if(id) res.stale.push(Object.assign({ id, why: 'read now (' + j.vals.map(v => v.read).join(', ') + ')' }, r)); continue; }
    const row = Object.assign({ type: T(e).join('+'), played: j.played.ok ? (j.played.via || 'played') : null, unreadVals: j.vals.filter(v => !v.read).map(v => (v.at ? '[' + v.at + '] ' : '') + v.key + ': ' + v.why), id }, r);
    res.unread.push(row);
    if(!id) res.newGaps.push(row);
  }
  for(const L of listedRows(gaps)) if(!seen.has(L.card + '|' + L.fam + '|' + L.lvl)) res.stale.push(Object.assign({ why: 'no such row in the record' }, L));
  if(o.registerIds) for(const L of listedRows(gaps)) if(!o.registerIds.has(L.id)) res.problems.push(L.card + ' ' + L.fam + ' ' + L.lvl + ': ' + L.id + ' is no register entry');
  return res;
}

function load(){
  const ex = JSON.parse(fs.readFileSync(here('cardfx-exact.json'), 'utf8'));
  const pairing = JSON.parse(fs.readFileSync(here('cross-check-pairing.json'), 'utf8'));
  let regIds = null, regErr = null; try { regIds = require(here('gen-card-ledger.js')).registerEntries(fs.readFileSync(here('docs/SWEEP-REGISTER.md'), 'utf8')); } catch(e){ regErr = 'the register could not be read (' + e.message + '): no listed id is checked'; }
  return { ex, pairing, lib: COV.fx.lib, regIds, regErr };
}

function selfTest(){
  let pass = 0, fail = 0; const ok = (c, m) => { if(c) pass++; else fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
  const sp = sourceProblems(READERS, PLUSIF_CALLERS, BODIES);
  ok(!sp.length, 'the source check: every READERS function exists and reads its keys, every plusIf caller asks _plusIf for its key' + (sp.length ? ': ' + sp.join('; ') : ''));
  const bogus = { stealth: [{ fn: '_noSuchMethod', reads: ['stealth'], take: () => true }], bleed: [{ fn: '_bestStealthFor', reads: ['poolDmg'], take: () => true }] };
  ok(sourceProblems(bogus, {}, BODIES).length === 2, 'planted: a method that does not exist, and a method that does not read the key it is listed for, are each reported');
  const pairing = { family: { stealth: { ours: ['stealth', 'actStealth'] }, intercept: { ours: ['intercept', 'interceptPaid'] }, bleed: { ours: ['bleed'] } } };
  const lib = {
    'Mod One': { t: ['mod'], modes: [{ at: 'obf', fx: { stealth: 1 } }] },
    'React Paid': { t: ['react'], modes: [{ at: 'aus', fx: { intercept: 1 } }, { at: 'AUS', fx: { interceptPaid: 1, interceptPaidBlood: 1 } }] },
    'Mod Cond': { t: ['mod'], modes: [{ at: 'dom', fx: { bleed: 1, plusIf: { add: { bleed: 1 }, if: { unread: 'the target is a vampire' } } } }] },
    'Mod Clan': { t: ['mod'], modes: [{ at: 'pre', fx: { bleed: 1, plusIf: { add: { bleed: 1 }, if: { selfClan: 'Toreador' } } } }] },
    'Ally Never': { t: ['ally'], modes: [{ at: null, fx: { stealth: 1 } }] } };
  const ex = { cards: { 'Mod One': { stealth: 'agree' }, 'React Paid': { intercept: { aus: 'agree', AUS: 'corrected' } }, 'Mod Cond': { bleed: 'corrected' }, 'Mod Clan': { bleed: 'agree' }, 'Ally Never': { stealth: 'corrected' } },
               gaps: { reader: { 'Mod One': { stealth: '7.6' } } } };
  const r = runGate(ex, lib, pairing, {});
  const keys = r.newGaps.map(x => x.card + ' ' + x.lvl).sort().join(', ');
  ok(keys === 'Ally Never all, Mod Cond all, React Paid AUS', 'planted: interceptPaid on a hand reaction, an unread plusIf condition and a corrected value on an ally with no reader are each a new gap (got ' + keys + ')');
  ok(r.stale.length === 1 && r.stale[0].card === 'Mod One', 'planted: a listed gap that is read now is stale (got ' + r.stale.map(x => x.card).join(', ') + ')');
  ok(r.read === 3 && r.unread.length === 3, 'planted: a hand stealth modifier, an inferior intercept and a selfClan plusIf are read (got ' + r.read + ' read, ' + r.unread.length + ' unread)');
  const ex2 = { cards: { 'Ally Never': { stealth: 'agree' } } };
  const r2 = runGate(ex2, lib, pairing, {});
  ok(r2.gated === 0 && r2.notGated.kept === 1 && r2.notGated.unread === 1, 'planted: an agreeing row on a card the bot never plays is counted, not gated');
  const r3 = runGate({ cards: { 'Mod One': { stealth: 'agree' } } }, lib, { family: { stealth: { ours: ['stealth', 'newKey'] } } }, {});
  const lib3 = Object.assign({}, lib, { 'Mod New': { t: ['mod'], modes: [{ at: 'obf', fx: { stealth: 1, newKey: 2 } }] } });
  const r4 = runGate({ cards: { 'Mod New': { stealth: 'corrected' } } }, lib3, { family: { stealth: { ours: ['stealth', 'newKey'] } } }, {});
  ok(r3.problems.length === 0 && r4.problems.some(p => /no READERS entry for newKey/.test(p)), 'planted: a family key READERS does not know stops the gate');
  /* v1.1.0 (C1b): the readers of bot v0.6.244, each with its counter-case */
  const lib5 = {
    'Mod Priced': { t: ['mod'], modes: [{ at: 'obt', fx: { stealth: 1, payBlood: 1 } }] },                                   // Stone Travel's shape: read (the stealth finder pays)
    'Equip Priced': { t: ['equip'], modes: [{ at: null, fx: { intercept: 1, payBlood: 1 } }] },                               // no equipment reader pays a price: unread
    'Mod Both': { t: ['mod'], limited: true, modes: [{ at: 'DOM', fx: { stealth: 1, bleed: 1 } }] },                           // Bonding [DOM]: the bleed read with the stealth
    'Mod Opt': { t: ['mod'], limited: true, modes: [{ at: 'CEL', fx: { stealth: 1, bleed: 1, stealthOpt: true } }] },          // Subversion [CEL]: read
    'React Titled': { t: ['react'], modes: [{ at: null, fx: { intercept: 1, plusIf: { add: { intercept: 1 }, if: { actorTitled: true } } } }] },   // Protection Racket: read
    'Mod Undir': { t: ['mod'], modes: [{ at: null, fx: { stealth: 1, plusIf: { add: { stealth: 1 }, if: { actUndirected: true } } } }] },        // High Aye: read
    'Bleed Header': { t: ['action'], modes: [{ at: null, fx: { actStealth: 1 } }, { at: 'cel', fx: { bleedAct: true } }] },  // Cat Burglary: the header read
    'Bleed Lines': { t: ['action'], modes: [{ at: null, fx: { bleedAct: true } }, { at: 'ani', fx: { bleed: 1 } }] } };    // Break the Bonds: the line's bleed read
  const pair5 = { family: { stealth: { ours: ['stealth', 'actStealth'] }, intercept: { ours: ['intercept'] }, bleed: { ours: ['bleed'] } } };
  const ex5 = { cards: { 'Mod Priced': { stealth: 'corrected' }, 'Equip Priced': { intercept: 'corrected' }, 'Mod Both': { bleed: 'corrected' }, 'Mod Opt': { bleed: 'corrected' },
    'React Titled': { intercept: 'corrected' }, 'Mod Undir': { stealth: 'corrected' }, 'Bleed Header': { stealth: 'corrected' }, 'Bleed Lines': { bleed: 'corrected' } } };
  const r5 = runGate(ex5, lib5, pair5, {}), un5 = r5.unread.map(x => x.card).sort().join(', ');
  ok(r5.read === 7 && un5 === 'Equip Priced' && /payBlood/.test(r5.unread[0].unreadVals.join(' ')),
    'planted (v1.1.0): a priced stealth, a stealth mode\'s bleed, the or-option\'s bleed, actorTitled and actUndirected, a bleed card\'s header and a discipline line\'s bleed are read; a price no reader pays is not (got ' + r5.read + ' read, unread: ' + un5 + ')');
  console.log('reader gate ' + GATE_VERSION + ' self-test: ' + pass + '/' + fail);
  return fail;
}

function main(){
  const a = process.argv.slice(2), arg = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  if(a.includes('--self-test')) process.exit(selfTest() ? 1 : 0);
  const sp = sourceProblems(READERS, PLUSIF_CALLERS, BODIES);
  const { ex, pairing, lib, regIds, regErr } = load();
  const r = runGate(ex, lib, pairing, { registerIds: regIds });
  r.problems.unshift(...sp); if(regErr) r.problems.push(regErr);
  if(arg('--json')) fs.writeFileSync(arg('--json'), JSON.stringify(Object.assign({ tool: 'gen-reader-gate ' + GATE_VERSION, bot: require(here('elysium-bot.js')).BOT_VERSION }, r), null, 1) + '\n');
  if(a.includes('--list')) r.unread.forEach(x => console.log((x.id ? 'listed ' + x.id : 'NEW    ') + ' | ' + x.card + ' | ' + x.fam + ' ' + x.lvl + ' (' + x.st + ', ' + x.type + (x.played ? ', played' : '') + ') | ' + x.unreadVals.join('; ')));
  r.newGaps.forEach(x => console.log('FAIL half-done: ' + x.card + ' ' + x.fam + ' ' + x.lvl + ' (' + x.st + ') -- ' + x.unreadVals.join('; ') + ' -- build its reader, or register the gap and list it in cardfx-exact.json gaps.reader'));
  r.stale.forEach(x => console.log('FAIL stale: ' + x.card + ' ' + x.fam + ' ' + x.lvl + ' is listed as ' + (x.id || '?') + ' but ' + x.why + ' -- delete its line'));
  r.problems.forEach(p => console.log('FAIL ' + p));
  const fails = r.newGaps.length + r.stale.length + r.problems.length;
  console.log('reader gate ' + GATE_VERSION + ': ' + r.rows + ' rows, ' + r.gated + ' gated, ' + r.read + ' read, ' + r.unread.length + ' unread (' + (r.unread.length - r.newGaps.length) + ' listed, ' + r.newGaps.length + ' new), '
    + r.stale.length + ' stale, ' + r.noValue + ' no value; not gated: ' + r.notGated.kept + ' kept rows on cards the bot does not play (' + r.notGated.unread + ' unread) -- ' + (fails ? 'FAIL' : 'PASS'));
  process.exit(fails ? 1 : 0);
}
module.exports = { runGate, judgeRow, sourceProblems, READERS, PLUSIF_CALLERS, GATE_VERSION };
if(require.main === module) main();
