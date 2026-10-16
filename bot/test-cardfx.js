#!/usr/bin/env node
'use strict';
/* test-cardfx.js — the card-effect library gate (v1, 12 July 2026)
   Compiles the REAL vtes.json (+ the curated overlay) in-process and asserts
   the extraction semantics on known cards: level splitting, the "As above"
   idiom (inheritance AND override), type brackets on multi-type cards,
   directed-vs-self-cost pool damage, the alias ladder, curated precedence,
   and compile determinism. Zero deps. Exit 0 all green (run-gate family). */

const fs = require('fs');
const path = require('path');
const { compile, serialize, FXC_VERSION } = require('./cardfx-compile.js');

let passN = 0, failN = 0;
const ok = (cond, msg) => { console.log((cond ? '  \u2713 ' : '  \u2717 ') + msg); cond ? passN++ : failN++; };

const here = f => path.join(__dirname, f);
const cards = JSON.parse(fs.readFileSync(here('vtes.json'), 'utf8'));
let curated = null;
try{ curated = JSON.parse(fs.readFileSync(here('cardfx-curated.json'), 'utf8')); }catch(e){}

console.log('cardfx gate (compiler v' + FXC_VERSION + ', ' + cards.length + ' cards' + (curated ? ', curated overlay' : ', NO overlay') + ')');

const res = compile(cards, curated);
const fx = res.out;
const mode = (name, at, use) => {
  const e = fx.lib[name];
  if(!e || !e.modes) return null;
  return e.modes.find(m => m.at === at && (use === undefined || m.use === use)) || null;
};

/* 1) shape + volume sanity */
ok(fx.fxv === 1, 'output carries fxv 1');
ok(fx.counts.lib >= 2300 && fx.counts.crypt >= 1700, 'volume sane (lib ' + fx.counts.lib + ', crypt ' + fx.counts.crypt + ')');
ok(fx.counts.libWithFx >= 1400, 'auto tier tags >= 1400 library cards (' + fx.counts.libWithFx + ')');
ok(fx.counts.alias >= 1500, 'alias map populated (' + fx.counts.alias + ')');

/* 2) level splitting — inferior vs superior modes */
{
  const inf = mode('Conditioning', 'dom'), sup = mode('Conditioning', 'DOM');
  ok(inf && inf.fx.bleed === 2 && sup && sup.fx.bleed === 3, 'Conditioning: [dom] bleed +2 / [DOM] bleed +3');
  ok(fx.lib['Conditioning'].cost && fx.lib['Conditioning'].cost.blood === 1, 'Conditioning: blood cost 1 (structured field)');
}

/* 3) bleed-action convention: bleedAct + bonus over base 1 */
{
  const m = mode('Computer Hacking', null);
  ok(m && m.fx.bleedAct === true && m.fx.bleed === 1, 'Computer Hacking: bleedAct + bleed:1 (= bleeds for 2)');
  ok(fx.lib['Computer Hacking'].modes[0].dir === true, 'Computer Hacking: Ⓓ marks a directed action (v1.3.0: per-MODE)');
  ok(fx.lib['Govern the Unaligned'].modes.find(m => m.at === 'dom').dir === true &&
     !fx.lib['Govern the Unaligned'].modes.find(m => m.at === 'DOM').dir,
     'split-mode directedness (Johan, 13 July): Govern\'s inferior bleed is directed, its superior blood-add is NOT — one entry-level flag used to lie about half the card');
}

/* 4) the "As above" idiom — inheritance (Deflection) and override (Lost in Crowds) */
{
  const d1 = mode('Deflection', 'dom'), d2 = mode('Deflection', 'DOM');
  ok(d1 && d1.fx.bounce === true && d2 && d2.fx.bounce === true,
     'Deflection: [DOM] "As above" INHERITS bounce from [dom]');
  const l1 = mode('Lost in Crowds', 'obf'), l2 = mode('Lost in Crowds', 'OBF');
  ok(l1 && l1.fx.stealth === 1 && l2 && l2.fx.stealth === 2,
     'Lost in Crowds: "As above, but for +2 stealth" — own extraction OVERRIDES the inherited value');
}

/* 5) Johan's motivating example: pool damage that is not a bleed */
{
  const s1 = mode('Shroud of Decay', 'obl'), s2 = mode('Shroud of Decay', 'OBL');
  ok(s1 && s1.fx.bleedAct === true && s1.fx.bleed === 1, 'Shroud of Decay: [obl] is a bleed action at +1');
  ok(s2 && s2.fx.poolDmg === 3, 'Shroud of Decay: [OBL] burns 3 pool — a blockable non-bleed pool threat');
}

/* 6) type brackets on a multi-type card */
{
  const a = mode('Swallowed by the Night', 'obf', 'mod');
  const b = mode('Swallowed by the Night', 'OBF', 'combat');
  ok(a && a.fx.stealth === 1 && b && b.fx.maneuver === true,
     'Swallowed by the Night: [ACTION MODIFIER]/[COMBAT] faces split into use-scoped modes');
}

/* 7) the wake package */
ok(mode("Wake with Evening's Freshness", null) && mode("Wake with Evening's Freshness", null).fx.wake === true, 'WWEF: wake');
ok(mode('Forced Awakening', null) && mode('Forced Awakening', null).fx.wake === true, 'Forced Awakening: wake');

/* 8) directed pool damage vs self-cost — the noise guard */
{
  const ep = fx.lib['Emergency Preparations'];
  const noPd = e => !(e && e.modes || []).some(m => m.fx.poolDmg !== undefined);
  ok(noPd(ep), 'Emergency Preparations: "burn 1 pool to …" self-cost is NOT tagged as poolDmg');
  ok(noPd(fx.lib['Aversion']), 'Aversion: "Burn X pool to reduce …" self-cost is NOT tagged as poolDmg');
  const hrm = (fx.lib['Harmony'].modes || []).find(m => m.fx && typeof m.fx.poolDmg === 'number');
  ok(hrm && hrm.dir, 'Harmony: "Ⓓ Your prey burns 3 pool" — a GENUINE immediate directed burn IS tagged (v1.5.2 exemplar; v1.5.0 had picked Creeping Sabotage off the aggregate list without reading it — an ongoing drain, the very class the guard strips: test exemplars inherit their source list\'s blindness)');
  ok(noPd(fx.lib['Contagion']) && noPd(fx.lib['Creeping Sabotage']) && noPd(fx.lib['Fame']), 'v1.5.2 ongoing-drain guard: "During … unlock phase … burns N pool" (Contagion, Creeping Sabotage, Fame — 10 cards + inert-curated Enticement) is NOT immediate poolDmg — the bot\'s play path would mis-resolve it as an instant burn, and coverage v1.1 classes the key playable');
  let nPd = 0; for(const n in fx.lib) for(const mo of fx.lib[n].modes || []) if(mo.fx && mo.fx.poolDmg !== undefined) nPd++;
  ok(nPd === 14, 'poolDmg volume post-guard (' + nPd + ' modes; 41 -> 29 by the unlock-phase drain guard, 29 -> 14 in v1.7.0: the 15 modes on 14 POLITICAL cards moved to ref.fx -- a referendum outcome is not a play effect)');
}

/* 9) crypt entries — structured fields, titles, votes, discipline levels */
{
  const lu = fx.crypt['Lucinde, Alastor (G3)'];
  ok(lu && lu.cap === 10 && lu.title === 'Justicar' && lu.votes === 3, 'Lucinde (G3): cap 10, Justicar, 3 votes');
  ok(lu && lu.disc.sup.includes('dom') && lu.disc.all.includes('obf') && !lu.disc.sup.includes('obf'),
     'Lucinde disc: DOM superior, obf inferior-only, all-set complete');
  const zip = fx.crypt['Zip (G3)'];
  ok(zip && zip.cap === 2 && zip.sect === 'Sabbat', 'Zip (G3): cap 2, sect Sabbat');
}

/* 10) the alias ladder — plain names, ADV, multi-group */
ok(fx.alias['zip'] === 'Zip (G3)', 'alias: "zip" resolves to Zip (G3)');
ok(fx.alias['anarch convert'] === 'Anarch Convert (ANY)', 'alias: "anarch convert" resolves');
ok(fx.alias['beckett'] === 'Beckett (G3)', 'alias ladder: base "Beckett (G3)" beats the ADV version');
ok(fx.alias['annabelle triabell'] === 'Annabelle Triabell (G6)', 'alias ladder: newest group wins a multi-group name');

/* 11) curated overlay precedence + forward-compatible keys */
if(curated){
  const id = fx.lib['Inside Dirt'];
  ok(id && id.src === 'hand' && id.modes[0].fx.poolDmg === 3 && id.costEdge === true,
     'curated: Inside Dirt is hand-tier (poolDmg 3, costEdge carried through)');
  const bd = fx.lib['Blood Doll'];
  ok(bd && bd.src === 'hand' && bd.modes[0].fx.bloodToPool === 1,
     'curated: Blood Doll carries the richer bloodToPool vocabulary');
  /* track C (11 Sep 2026, verified in vtes.json): the four data corrections from the deep review */
  ok(bd && bd.modes.some(m => m.fx && m.fx.poolToBlood === 1 && m.phase === 'master'), 'curated: Blood Doll is TWO-WAY (poolToBlood mode at master) -- printed "or from their pool to this vampire"');
  const ve = fx.lib['Vessel'];
  ok(ve && ve.src === 'hand' && ve.trifle === true && ve.modes.some(m => m.fx && m.fx.bloodToPool === 1 && m.phase === 'unlock') && ve.modes.some(m => m.fx && m.fx.poolToBlood === 1 && m.phase === 'unlock'), 'curated: Vessel is two-way at unlock, still a trifle');
  const sm = fx.lib['Spying Mission'];
  ok(sm && sm.src === 'hand' && sm.modes.some(m => m.at === 'obf' && m.fx.stealth === 1) && sm.modes.every(m => typeof (m.fx || {}).bleed !== 'number'), 'curated: Spying Mission [OBF] no longer reads as +2 bleed (the auto misread that made the bot announce a phantom modifier)');
  ok(sm && sm.modes.some(m => m.at === 'OBF' && m.fx.bleedNullify === true && m.fx.bleedBank === 2), 'curated: Spying Mission [OBF] carries bleedNullify + bleedBank 2 (the printed superior)');
  const fd = fx.lib['Foreshadowing Destruction'];
  ok(fd && fd.src === 'hand' && fd.limited === true && fd.modes.some(m => m.at === 'dom' && m.fx.bleed === 1 && !m.req) && fd.modes.some(m => m.at === 'DOM' && m.fx.bleed === 3 && m.req && m.req.targetPoolMax === 9), 'curated: Foreshadowing Destruction keeps (limited) and gates the [DOM] +3 on req.targetPoolMax 9');
  const pa = fx.lib['The Parthenon'];
  ok(pa && pa.src === 'hand' && pa.persistent === true && pa.modes[0].lock === true,
     'curated: The Parthenon is hand-tier, persistent, lock-gated');
  ok(pa && pa.actGrant && pa.actGrant.phase === 'master' && pa.actGrant.amount === 1 && pa.actGrant.persist === 'turn',
     "curated: The Parthenon's actGrant is ENTRY-LEVEL (h.e.actGrant, matching _recomputePhaseActs's actual read -- NOT nested in modes[])");
  const ih = fx.lib['Information Highway'];
  ok(ih && ih.src === 'hand' && ih.persistent === true && !ih.modes,
     'curated: Information Highway is hand-tier, persistent, no modes (pure Passive -- no lock, no fx key exists for "+2 transfers")');
  ok(ih && ih.actGrant && ih.actGrant.phase === 'influence' && ih.actGrant.amount === 2 && ih.actGrant.persist === 'inplay',
     'curated: Information Highway maps to actGrant{phase:influence,amount:2,persist:inplay} -- the first REAL card to exercise the existing _recomputePhaseActs reader');
  const asht = fx.lib['Ashur Tablets'];
  ok(asht && asht.src === 'hand' && asht.persistent === true && !asht.modes,
     'curated: Ashur Tablets is hand-tier, persistent, and the auto-tier\u2019s wrong poolGain:3 mistag is GONE (no modes at all -- a threshold trigger, not recurring income, deliberately unmodelled rather than left misleading)');
  ok(asht && asht.handler === 'ashur-tablets',
     'curated: Ashur Tablets names its own bespoke handler (v1.4.2) -- the OWN-copy threshold/removal/retrieval mechanism, same tier as Effective Management\u2019s');
  const em = fx.lib['Effective Management'];
  ok(em && em.src === 'hand' && em.persistent === undefined,
     'curated: Effective Management is hand-tier but explicitly carries NO persistent (one-shot, matches auto exactly -- curated here only for the note, not to change behaviour)');
  ok(em && em.handler === 'effective-management',
     "curated: Effective Management names a bespoke bot-side handler (v1.4.1) -- entry-level, same tier as persistent/actGrant, not a generic fx key (this class of one-off effect doesn't share enough shape with anything else to earn one, same call already made for Ashur Tablets' own threshold)");
  const dos = fx.lib['Dreams of the Sphinx'];
  ok(dos && dos.persistent === true && dos.modes[0].lock === true,
     'curated: Dreams of the Sphinx now carries persistent+lock too (the 14 July follow-up -- was previously curated WITHOUT them, silently inconsistent with what auto-tier would give a fresh card)');
} else {
  ok(false, 'curated overlay file missing');
  ok(false, 'curated overlay file missing');
}

/* 12) every lib entry has a type; alias values all resolve */
{
  const badT = Object.entries(fx.lib).filter(([n, e]) => !Array.isArray(e.t) || !e.t.length);
  ok(badT.length === 0, 'every lib entry carries a normalized type (' + badT.length + ' without)');
  const badA = Object.entries(fx.alias).filter(([k, v]) => !fx.lib[v] && !fx.crypt[v]);
  ok(badA.length === 0, 'every alias points at an existing entry (' + badA.length + ' dangling)');
}

/* 13) v3/v5 dual format — the normalizer mirrors the client's parseV5Card
       field map (SKILLS.md). Fixtures are REAL v3 cards transformed per that
       verified map (synthetic shape, real content) — a run against a real v5
       FILE remains on Johan when static.krcg.org flips.                      */
{
  const isC = c => (c.types || []).some(t => t === 'Vampire' || t === 'Imbued');
  const toV5 = c => {
    const crypt = isC(c);
    const m = String(c.name).match(/^(.*) \(([^)]+)\)$/);
    const printed = crypt && m ? m[1] : c.name;
    const v5 = { kind: crypt ? 'Crypt' : 'Library', types: c.types,
                 printed_name: printed, text: c.card_text,
                 name_variants: (c.name_variants || []).map(n => ({ name: n, type: 'Lexicographical' })) };
    if(crypt && m) v5.suffix = m[2];
    if(c.capacity !== undefined) v5.capacity = c.capacity;
    if(crypt){
      v5.disciplines = c.disciplines;
      v5.clan = (c.clans || [])[0];
      if(c.group !== undefined) v5.group = 'G' + c.group;
      if(c.title) v5.title = c.title;
    } else {
      if(c.disciplines) v5.discipline_requirement = { type: 'or', disciplines: c.disciplines };
      if(c.clans) v5.clan_requirement = c.clans;
    }
    if(c.blood_cost !== undefined) v5.cost = { type: 'blood', amount: c.blood_cost };
    else if(c.pool_cost !== undefined) v5.cost = { type: 'pool', amount: c.pool_cost };
    else v5.cost = null;
    if(c.banned) v5.banned = c.banned;
    return v5;
  };
  const names = ['Conditioning', 'Deflection', 'Computer Hacking', 'Swallowed by the Night',
                 'Lucinde, Alastor (G3)', 'Zip (G3)'];
  const v3sub = names.map(n => cards.find(c => c.name === n));
  ok(v3sub.every(Boolean), 'v5 fixture: all six source cards found in vtes.json');
  const a = compile(v3sub, null).out, b = compile(v3sub.map(toV5), null).out;
  const same = names.every(n => JSON.stringify(a.lib[n] || a.crypt[n]) === JSON.stringify(b.lib[n] || b.crypt[n]));
  ok(same, 'v5-normalized fixtures compile to entries IDENTICAL to their v3 originals (all six)');
  ok(b.alias['zip'] === 'Zip (G3)' && b.alias['lucinde, alastor'] === 'Lucinde, Alastor (G3)',
     'v5: printed_name+suffix rebuilds the canonical name; plain-name aliases still resolve');
  ok(b.counts.formats.v5 === 6 && b.counts.formats.v3 === 0, 'v5: format counter reports the shape');
  const mixed = compile([...v3sub.slice(0, 3), ...v3sub.slice(3).map(toV5)], null).out;
  ok(mixed.counts.formats.v3 === 3 && mixed.counts.formats.v5 === 3 &&
     mixed.lib['Conditioning'] && mixed.crypt['Zip (G3)'],
     'mixed v3+v5 list compiles (per-record detection, the cache-vs-fresh edge case)');
  /* cost is the one v5 unknown — defensive read, counted, never mislabelled */
  const weird = Object.assign(toV5(v3sub[0]), { cost: 'strange' });
  const wres = compile([weird], null);
  ok(!wres.out.lib['Conditioning'].cost && wres.costUnknown === 1,
     'v5 unknown cost shape degrades to NO cost and is counted (never mislabelled)');
  /* the v3 discipline full-name quirk folds back to trigrams */
  const oblCard = { name: 'Quirk Test', _name: 'Quirk Test', types: ['Action Modifier'],
                    disciplines: ['oblivion'], card_text: '[obl] +1 stealth.' };
  const q = compile([oblCard], null).out.lib['Quirk Test'];
  ok(q && q.req.disc[0] === 'obl', "v3 quirk: full-name 'oblivion' folds to trigram 'obl' in req.disc");
  const crow = fx.lib['As the Crow'];
  ok(crow && crow.req && crow.req.disc.includes('flight'),
     "v3 quirk: 'FLIGHT' (no trigram exists) survives lowercased as 'flight'");
}

/* 14) determinism — two compiles serialize identically (minus the timestamp) */
{
  const a = serialize(compile(cards, curated).out).replace(/"generated": "[^"]+"/, 'G');
  const b = serialize(compile(cards, curated).out).replace(/"generated": "[^"]+"/, 'G');
  ok(a === b, 'compile is deterministic (byte-identical modulo timestamp)');
}

/* ---- rules tags (v1.2.0): unique + limited, rulebook-verified ---- */
ok(fx.lib['The Rack'].unique === true, 'unique tag: The Rack (leading "Unique" templating)');
ok(fx.lib['Blood Doll'].unique === undefined, 'unique tag absent on non-unique masters (Blood Doll)');
ok(fx.lib['Conditioning'].limited === true, 'limited tag: Conditioning ("(limited)" reminder text)');
ok(fx.lib['Blur'].limited === true, 'limited tag covers combat additional-strike cards (Blur)');
ok(Object.keys(fx.crypt).some(k => /^Valkyrie \(/.test(k) && fx.crypt[k].unique === false), 'crypt non-unique: Valkyrie opts out');
ok(fx.crypt['Anarch Convert (ANY)'].unique === undefined, 'Anarch Convert is UNIQUE (its copies are removed-from-game fodder, not in-play duplicates)');

/* ---- rules tags (v1.4.0): persistent + lock, rulebook-verified, 14 July 2026 ----
   Parthenon/Information Highway/Ashur Tablets/Effective Management were this
   sweep's named motivating cases (elysium-backlog.md's "Masters tagging
   round"); Enkil Cog/As the Crow stress-test the edge cases found along the way. */
ok(fx.lib['The Parthenon'].persistent === true, 'persistent tag: The Parthenon ("Unique location.")');
ok(fx.lib['Effective Management'].persistent === undefined,
   'persistent tag ABSENT: Effective Management (one-shot move-and-ash, no location/put-in-play text)');
ok(fx.lib['Ashur Tablets'].persistent === true,
   'persistent tag: Ashur Tablets via "Put this card in play" (no "location" word anywhere in its own text)');
ok(fx.lib['Enkil Cog'].persistent === true,
   'persistent tag: Enkil Cog via "Put this card on this vampire" (an Action Modifier, not a Master \u2014 persistent is not type-bound)');
ok(fx.lib['.44 Magnum'].persistent === true,
   'persistent tag: .44 Magnum \u2014 TYPE-implicit (Equipment), zero "put this card"/"location" text of its own');
ok(fx.lib["47th Street Royals"].persistent === true, 'persistent tag: 47th Street Royals \u2014 TYPE-implicit (Ally)');
{
  const equipAll = Object.values(fx.lib).filter(e => e.t.includes('equip'));
  const allyAll = Object.values(fx.lib).filter(e => e.t.includes('ally'));
  const retAll = Object.values(fx.lib).filter(e => e.t.includes('retainer'));
  const evAll = Object.values(fx.lib).filter(e => e.t.includes('event'));
  ok(equipAll.length > 100 && equipAll.every(e => e.persistent), 'EVERY Equipment entry is persistent (' + equipAll.length + ' checked)');
  ok(allyAll.length > 50 && allyAll.every(e => e.persistent), 'EVERY Ally entry is persistent (' + allyAll.length + ' checked)');
  ok(retAll.length > 20 && retAll.every(e => e.persistent), 'EVERY Retainer entry is persistent (' + retAll.length + ' checked)');
  ok(evAll.length > 10 && evAll.every(e => e.persistent), 'EVERY Event entry is persistent (' + evAll.length + ' checked)');
}
{
  const pm = mode('The Parthenon', null);
  ok(pm && pm.lock === true, 'lock tag: The Parthenon ("you can lock this card to get +1 master phase action")');
  ok(pm && Object.keys(pm.fx).length === 0,
     'The Parthenon: mode has EMPTY fx \u2014 the +1-master-phase-action grant is outside the v1 fx vocabulary; ' +
     'this mode exists ONLY because of the widened dir/lock gate (the old fx-only gate silently dropped it: 0 modes, the lock fact lost entirely)');
}
{
  const ec = mode('Enkil Cog', null);
  ok(ec && ec.lock === true && ec.fx.bleed === 1,
     'Enkil Cog: ONE mode carries BOTH a continuous fx (bleed:1, Passive) AND lock:true (a separate Active ability) \u2014 ' +
     'proves Active/Passive is a per-mode fact, not an entry-level either/or');
}
ok(mode('Conditioning', 'dom') && mode('Conditioning', 'dom').lock === undefined,
   'lock tag absent on an ordinary directed action (Conditioning)');
ok(mode('As the Crow', null) && mode('As the Crow', null).fx.unlock === true && mode('As the Crow', null).lock === undefined,
   'lock tag NOT fooled by "Unlock this minion" (leading \\b before "lock" is load-bearing: "un-LOCK THIS-minion" and ' +
   '"b-LOCK THIS-action" both contain the bare substring "lock this" \u2014 125 false positives measured without the boundary)');
{
  const dInf = mode('Deflection', 'dom'), dSup = mode('Deflection', 'DOM');
  ok(dInf && dInf.lock === true, 'Deflection [dom]: lock tag present ("Lock this reacting vampire")');
  ok(dSup && dSup.lock === undefined,
     'Deflection [DOM]: lock tag ABSENT \u2014 "As above, but do not lock this vampire" explicitly trades the lock cost away; ' +
     'found via the sweep-audit review (a naive "as above" inherit would have wrongly copied [dom]\'s lock:true here)');
}
ok(fx.counts.libPersistent >= 1100, 'persistent volume sane (' + fx.counts.libPersistent + ', ~1197 expected \u2014 text patterns + TYPE-implicit + the 3 pre-existing curated cards backfilled 14 July)');
ok(fx.counts.libLock >= 140,
   'lock volume sane (' + fx.counts.libLock + ', ~150 expected \u2014 "lock this/that X" minus negations (Deflection-style); ' +
   'Dreams of the Sphinx now counts too since its curated entry carries lock:true (14 July follow-up), no longer masked');

/* 15) v1.5.0 — the fas B/C mechanism sweep (17 July) */
{
  /* OR-mode split (22 cards): one emitted mode per alternative */
  const fpModes = (fx.lib['Fever Pitch'].modes || []).map(m => m.at).sort().join(',');
  ok(fpModes === 'FOR,PRE,for,pre', 'Fever Pitch: "[for] or [pre]" fans out to one mode per alternative incl. as-above inheritance across the OR-composite (' + fpModes + ')');
  ok((fx.lib['Hedonism'].modes || []).length === 4 && (fx.lib['Hedonism'].modes || []).every(m => m.lock), 'Hedonism: 4 OR-alternative modes, all carrying the lock tag');

  /* As-[ref]-above resolution (89 cards): Under My Skin was the collapse instance */
  const u1 = mode('Under My Skin', 'obf'), u2 = mode('Under My Skin', 'thn'), u3 = mode('Under My Skin', 'THN');
  ok(u1 && u1.fx.stealth === 1 && !u1.fx.stealthLater, 'Under My Skin [obf]: plain instant stealth 1');
  ok(u2 && u2.fx.stealth === 1 && u2.fx.stealthLater === 1, 'Under My Skin [thn]: hybrid — instant 1 + attach-burn stealthLater 1');
  ok(u3 && u3.fx.stealth === 2 && u3.fx.stealthLater === 1, 'Under My Skin [THN]: "As [thn] above, but for +2" — pinned inheritance + override (v1.4.2 merged this into [thn] and lost the mode)');
  const ctf = mode('Cheat the Fates', 'TEM');
  ok(ctf && ctf.fx.bleedAct === true && ctf.fx.unlock === true && ctf.dir === true, 'Cheat the Fates [TEM]: pinned inheritance SKIPS content-free segments — "[tem] is not a Discipline"-style mid-text brackets emit an empty same-at segment the v1.5.0 pin wrongly latched onto (v1.5.3; Fractura/Hexe/Greater Curse/Masca shared the root cause)');
  const dqi = mode('Draught of the Soul', 'aus+qui'), dqs = mode('Draught of the Soul', 'AUS+QUI');
  ok(dqi && dqi.fx.intercept === 1 && dqi.fx.bleed === undefined && dqs && dqs.fx.bleed === 1, 'Draught of the Soul: COMBO reference "As [aus][qui] above" protected + resolved (v1.5.4, 9-card class) — the superior combo\'s bleed no longer leaks into the inferior combo mode');
  const stc = mode('Stunt Cycle', 'POT');
  ok(stc && stc.fx.strike === 4 && stc.fx.prevent === 2 && !mode('Stunt Cycle', 'cel'), 'Stunt Cycle curated (restlist aftermath): the phantom [cel] mode (born from the mid-text bracket in an OPPONENT clause, prevent:all on a scanned combat key) is gone, and [POT] carries the printed 4R strike the auto pattern missed');
  const sk = mode('Soak', 'FOR'), hs = mode('Hidden Strength', 'for');
  ok(sk && sk.fx.prevent === 4 && hs && hs.fx.prevent === 1 && !(fx.lib['Soak'].modes || []).some(m => m.fx && m.fx.aggr), 'Grinder onboarding curations: Soak carries the printed prevents (the "NON-aggravated" middle word broke the regex and ghost-tagged aggr -- Wall of Filth pattern), Hidden Strength carries the conservative X=0 floor of "Prevent X+1"');

  /* v1.5.8 (Johan's combat GO, steal-blood family): four new req flags for combat
     timing preconditions the bot's v1 architecture cannot verify — measured against
     the full 410-card Combat pool before tagging. */
  ok(fx.lib['Drain Essence'].req.notFirstRound === true, 'req.notFirstRound: Drain Essence ("Not usable on the first round of combat") tagged');
  ok(fx.lib['Donnybrook'].req.rangeClose === true, 'req.rangeClose: Donnybrook ("Only usable at close range") tagged');
  ok(fx.lib['Hunger of Marduk'].req.beforeRangeDetermined === true, 'req.beforeRangeDetermined: Hunger of Marduk ("Only usable before range is determined") tagged — the largest class, 83 cards');
  let rC = 0; for(const n in fx.lib) if(fx.lib[n].req && fx.lib[n].req.rangeClose) rC++;
  let rL = 0; for(const n in fx.lib) if(fx.lib[n].req && fx.lib[n].req.rangeLong) rL++;
  let bR = 0; for(const n in fx.lib) if(fx.lib[n].req && fx.lib[n].req.beforeRangeDetermined) bR++;
  let nF = 0; for(const n in fx.lib) if(fx.lib[n].req && fx.lib[n].req.notFirstRound) nF++;
  ok(rC === 20 && rL === 21 && bR === 84 && nF === 4, 'req flag volumes (' + rC + '/' + rL + '/' + bR + '/' + nF + '): the raw 410-Combat-type scan found 19/17/83/4, but the compiler correctly also tags EQUIPMENT carrying the same range-restricted text (Sniper Rifle, RPG Launcher, Smoke Grenade, Spike-Thrower, Starshell Grenade Launcher, Garrote) and one Reaction (Foresee) -- req doesn\'t filter by type, and shouldn\'t: a sniper rifle IS long-range-restricted regardless of its own card type');
  const ctl = fx.lib['Call the Lamprey'].modes || [];
  ok(ctl.find(m => m.at === 'obt').fx.stealBlood === undefined && ctl.find(m => m.at === 'OBT').fx.stealBlood === 1,
     'Call the Lamprey curated: [obt] (ally-only, unverifiable) emptied, [OBT] (unrestricted "opposing minion") kept clean');

  /* v1.5.9 (Johan's combat GO, strike-bonus family): 33-card measurement, two new
     phrasings beyond the original "Strike: N damage" shape. */
  const rh = mode('Roundhouse', 'POT');
  /* v1.9.2 (bot v0.6.202, the 14 Oct play-test, point 18): the two bonus phrasings write handBonus, not strike -- "hand strike at
     +2 damage" is the minion's strength + 2 (Roundhouse with a plain vampire: 3), and strike is ABSOLUTE damage. */
  ok(rh && rh.fx.handBonus === 3 && mode('Roundhouse', 'pot').fx.handBonus === 2 && rh.fx.strike === undefined && mode('Roundhouse', 'pot').fx.strike === undefined,
     'Roundhouse: [pot] handBonus 2, [POT] handBonus 3, and NO absolute strike -- "hand strike at +N damage" is a bonus on the hand strike (v1.9.2, play-test point 18: it landed one short as strike 2)');
  ok(rh.fx.handStrike === true, 'Roundhouse: handStrike is still tagged beside the bonus');
  ok(mode('Anticipation', 'aus').fx.handBonus === 2 && mode('Anticipation', 'aus').fx.strike === undefined, 'Pattern B "This strike is at +N damage": Anticipation handBonus 2, no absolute strike');
  ok(mode('Brute Force', 'pot').fx.handBonus === 1 && mode('Brute Force', 'POT').fx.handBonus === 2,
     'Brute Force: dual-choice sentence ("hand strike at +1 OR use a melee weapon strike at +2") — the conservative FIRST number (hand strike) is tagged, not the alternative melee option; a missed choice, not a wrong one');
  const ipgSup = mode('Invoke Poison Glands', 'ABO');
  ok(typeof ipgSup.fx.handBonus !== 'number' && typeof ipgSup.fx.strike !== 'number' && mode('Invoke Poison Glands', 'abo').fx.handBonus === 1,
     'Invoke Poison Glands: superior "+X damage, where X is the number of Orun" captures the STRING \'X\' (num()\'s own contract) — typeof !== number fails the finder\'s check automatically, no extra guard needed; base mode\'s fixed +1 stays clean');
  ok(mode('Compress', 'pot').fx.handBonus === 2 && mode('Compress', 'thn').fx.strike === 2, 'Compress: the [pot] hand-strike bonus and the [thn] absolute aggravated strike stay apart');
  { let both = 0; for(const n in fx.lib) for(const mo of fx.lib[n].modes || []) if(typeof mo.fx.handBonus === 'number' && typeof mo.fx.strike === 'number') both++;
    ok(both === 0, 'no mode carries both a hand-strike bonus and an absolute strike (' + both + ')'); }
  ok(!fx.lib['Blood Fury'].req.title && fx.lib['Blood Fury'].req.rangeClose === true && fx.lib['Loving Agony'].req.rangeClose === true && fx.lib['Cauldron of Blood'].req.notFirstRound === true,
     'strike-bonus cards inherit the SAME req flags as steal (rangeClose/notFirstRound) — Blood Fury, Loving Agony, Cauldron of Blood all correctly gated');
  ok(mode('Slam', 'POT').fx.maneuver === true && mode('Slam', 'pot').fx.maneuver === undefined,
     'Slam: superior mode co-locates maneuver with strike (bundled, excluded by the finder guard); base [pot] mode stays clean');
  ok(!fx.lib['The Khabar: Honor'].modes[0].fx.strike, 'The Khabar: Honor curated: an unverifiable per-vampire "contract" precondition (2-card class) emptied rather than left to misplay');
  let sVol = 0, hbVol = 0; for(const n in fx.lib) for(const mo of fx.lib[n].modes || []){ if(typeof mo.fx.strike === 'number' || typeof mo.fx.handBonus === 'number') sVol++; if(typeof mo.fx.handBonus === 'number') hbVol++; }
  ok(sVol >= 55, 'strike volume grew substantially with the two new patterns (' + sVol + ' numeric strike or hand-bonus modes, was ~30 pre-v1.5.9)');
  ok(hbVol >= 50 && hbVol < sVol, 'hand-bonus volume (v1.9.2): the two bonus patterns are a real subset of the strike modes (' + hbVol + ' of ' + sVol + ')');

  /* v1.6.0 (Johan's standing question, round 4): a THIRD strike phrasing found while
     checking the v1.5.9 work for uncertainty -- "Strike: N aggravated damage" (6
     cards; Compress was the one that revealed it). */
  ok(mode('Compress', 'thn').fx.strike === 2 && mode('Compress', 'THN').fx.strike === 3,
     'Compress: "Strike: N aggravated damage" (aggravated between number and damage, breaking both the original pattern and v1.5.9\'s two additions) now tagged -- [thn] 2, [THN] 3');
  ok(mode('Body Flare', 'PRO').fx.strike === 2, 'Body Flare [PRO]: the "2R aggravated damage" ranged form also matches (R handled)');
  ok(!(fx.lib['Body of Sun'].modes || []).some(m => m.fx && typeof m.fx.strike === 'number'),
     'Body of Sun correctly EXCLUDED: "3 aggravated damage if at close range or 1R ...if at long range" is RANGE-CONDITIONAL -- a single number would be a guess, not a fact, with no range state tracked; the negative lookahead protects it');

  /* v1.6.1 (Johan's combat GO, Carrion Crows -- the persistent-this-combat modifier
     concept): a narrow pattern for Carrion Crows' specific "This combat, the opposing
     minion takes NR environmental damage each round..." shape, plus its "As above,
     but for NR..." continuation form (the same per-segment re-extraction Theft of
     Vitae's stealBlood already needed -- Object.assign's override has nothing to
     overwrite the inherited value with unless this segment's OWN extraction also
     finds a number). Deliberately narrow: measured 9 "environmental damage" combat
     cards total, only Carrion Crows matches this exact shape -- the other 8 (Blood of
     Acid, Dagon's Call, Dark Steel, Groaning Corpse, Mercy for Seth, Necrosis, Weather
     Control) each have their own distinct shape, documented not guessed at. */
  ok(mode('Carrion Crows', 'ani').fx.envDmgPerRound === 1 && mode('Carrion Crows', 'ANI').fx.envDmgPerRound === 2,
     'Carrion Crows: [ani] envDmgPerRound=1, [ANI]=2 -- the "As above, but for 2R" continuation correctly overrides the inherited 1, not silently copying it (the bug this test locks in: without the second pattern, [ANI] would have shown 1, same as inferior)');
  for(const n of ['Blood of Acid', "Dagon's Call", 'Dark Steel', 'Groaning Corpse', 'Mercy for Seth', 'Weather Control'])
    ok(!(fx.lib[n].modes || []).some(m => m.fx && m.fx.envDmgPerRound !== undefined),
       n + ': correctly NOT matched by the narrow Carrion Crows pattern (own distinct environmental-damage shape, undocumented on purpose)');

  /* v1.6.2 (Johan's combat GO, Immortal Grapple -- the strike-type restriction
     concept): source-verified vekn.net + official FAQ 3.16 first ("Immortal Grapple
     restricts both minions... to only using 'hand strikes'"). handStrike is a
     POSITIVE-evidence-only tag (explicit "hand strike" wording) -- measured that the
     "R" suffix already tolerated in the strike/stealBlood regexes is VTES's own
     ranged-strike marker (36 of 48 "unclear" cards had it); the remaining 12 stayed
     genuinely ambiguous and are deliberately NOT tagged (a wrong "allowed" would be
     a misplay, not just a missed tag). */
  ok(mode('Roundhouse', 'pot').fx.handStrike === true && mode('Roundhouse', 'POT').fx.handStrike === true,
     'Roundhouse: explicit "hand strike at +N damage" -> handStrike:true on both modes');
  ok(mode('Theft of Vitae', 'tha').fx.handStrike === undefined && mode('Tongue of the Serpent', 'ser').fx.handStrike === undefined,
     'Theft of Vitae / Tongue of the Serpent: "Strike, ranged" -- correctly NOT tagged handStrike');
  ok(mode('Death of the Drum', 'mel').fx.handStrike === undefined,
     'Death of the Drum: "Strike: 2R damage" -- the "R" suffix marks it ranged, correctly NOT tagged handStrike even without the literal word "ranged"');
  for(const n of ['Bonecraft', 'Putrefaction', 'Fleshcraft', 'Personal Scourge'])
    ok(!(fx.lib[n].modes || []).some(m => m.fx && m.fx.handStrike),
       n + ': genuinely ambiguous (no "hand strike" text, no "R", no "ranged") -- correctly left UNTAGGED rather than guessed as allowed (fails closed, a missed tag not a wrong one)');
  ok(mode('Immortal Grapple', 'pot').fx.restrictHandStrike === true && mode('Immortal Grapple', 'POT').fx.restrictHandStrike === true,
     'Immortal Grapple: both modes correctly tagged restrictHandStrike');
  ok(!mode('Immortal Grapple', 'pot').fx.handStrike && !mode('Immortal Grapple', 'POT').fx.handStrike,
     'Immortal Grapple: NOT tagged handStrike itself -- the restriction sentence ("strikes that are NOT hand strikes cannot be used") literally contains the phrase "hand strikes", which the naive regex matched before the negative lookahead fix; this locks that fix in');
  let totalStrikeModes = 0, hsVol = 0;
  for(const n in fx.lib) for(const mo of fx.lib[n].modes || []) if(typeof mo.fx.strike === 'number' || typeof mo.fx.handBonus === 'number' || typeof mo.fx.stealBlood === 'number'){ totalStrikeModes++; if(mo.fx.handStrike) hsVol++; }   // v1.9.2: + handBonus
  ok(hsVol >= 30 && hsVol < totalStrikeModes, 'handStrike volume is a real subset of the ' + totalStrikeModes + ' strike/stealBlood-carrying modes, not all of them and not none (' + hsVol + ')');

  /* v1.6.3 (Johan's "push Inside Dirt to 100%" GO, Life in the City): a THIRD
     bloodAddTo class, 'own-ready' -- measured 5 cards sharing "add N blood to a ready
     vampire" wording, only Life in the City is the clean one-shot shape. */
  ok(mode('Life in the City', null).fx.bloodAdd === 1 && mode('Life in the City', null).fx.bloodAddTo === 'own-ready',
     'Life in the City: correctly tagged bloodAdd:1 + bloodAddTo:own-ready');
  ok(fx.lib['Life in the City'].handler === 'life-in-the-city', 'Life in the City curated with the handler key');
  ok(!fx.lib['The Coven'].modes[0].fx.bloodAddTo,
     'The Coven correctly NOT given bloodAddTo:own-ready -- shares the same "add N blood to a ready vampire" phrase but as a LOCK-based recurring choice ("you can lock this card to add..."), a different mechanic the negative lookahead correctly excludes');

  /* v1.6.4 (Johan's "push Inside Dirt to 100%" GO, continuing Life in the City):
     Dreams of the Sphinx split into three modes so each lock-choice's own
     precondition (phase, costEdge) can live per-mode, not bundled into one. */
  {
    const dots = fx.lib['Dreams of the Sphinx'];
    ok(dots.modes.length === 3, 'Dreams of the Sphinx: three separate modes, not one bundled mode');
    const handSizeMode = dots.modes.find(m => m.fx.handSize === 2);
    const poolMode = dots.modes.find(m => m.fx.poolGain === 1);
    const bloodMode = dots.modes.find(m => m.fx.bloodAdd === 1);
    ok(!!handSizeMode && handSizeMode.phase === 'master', 'v0.6.32 update: hand-size mode NOW carries phase:master too (the card states no rules-restriction either, same as blood-add) -- superseding the earlier "no phase tag, deliberately unconsumed" assertion now that _considerLockIncome actually implements the draw-up-to/discard-down-to rule (source-verified: hand size is an ACTIVE target, not a passive ceiling)');
    ok(!!poolMode && poolMode.phase === 'unlock' && poolMode.costEdge === true, 'pool-gain mode: phase:unlock + costEdge:true (mode-level, distinct from Leverage\'s entry-level costEdge)');
    ok(!!bloodMode && bloodMode.phase === 'master' && bloodMode.fx.bloodAddTo === 'unc', 'blood-add mode: phase:master (this bot\'s own sensible-timing choice, not a rules restriction) + bloodAddTo:unc (reuses the superior-Govern target class)');
    ok([handSizeMode, poolMode, bloodMode].every(m => m.lock === true), 'all three modes correctly carry lock:true');
    ok(fx.lib['Dreams of the Sphinx'].burnAtCounters === 3, 'Dreams of the Sphinx: entry-level burnAtCounters:3, shared across all three lock choices ("add 1 counter each time you lock it... burn if it has 3 counters")');
  }
  {
    const wv = fx.lib['Wider View'];
    ok(wv.modes.length === 2, 'Wider View: two modes, one per ability');
    const swapMode = wv.modes.find(m => m.fx.transferSwap);
    const burnMode = wv.modes.find(m => m.fx.transferBurnPool !== undefined);
    ok(!!swapMode && swapMode.fx.transferCost === 1, 'Wider View: transferSwap mode costs 1 transfer ("use 1 transfer to draw 1 card... and then remove a crypt card...")');
    ok(!!burnMode && burnMode.fx.transferBurnPool === 2 && burnMode.fx.transferCost === 4, 'Wider View: transferBurnPool mode gains 2 pool for 4 transfers ("use 4 transfers to burn this card and gain 2 pool")');
  }
  {
    const ch = fx.lib['Chantry'];
    ok(ch.modes[0].fx.rescueTorpor === 1, 'Chantry: rescueTorpor:1 ("burn 1 pool or 1 blood... to move a Tremere from torpor")');
    ok(ch.modes[0].lock === true && ch.modes[0].phase === 'master', 'Chantry: lock:true + phase:master ("during your master phase")');
    ok(JSON.stringify(ch.req.clan) === JSON.stringify(['Tremere']), 'Chantry: req.clan reused (not duplicated) to supply which clan the rescue targets/payers must match');
  }
  {
    const al = fx.lib['Arcane Library'];
    ok(al.modes[0].lock === true && al.modes[0].phase === 'influence', 'Arcane Library: lock:true + phase:influence ("during your influence phase")');
    ok(al.modes[0].fx.bloodAdd === 1 && al.modes[0].fx.bloodAddTo === 'unc', 'Arcane Library: bloodAdd:1 + bloodAddTo:unc, the same shape Dreams of the Sphinx already established');
    ok(JSON.stringify(al.req.clan) === JSON.stringify(['Tremere']), 'Arcane Library: req.clan (auto-detected, not re-curated) supplies the target-clan restriction _considerLockIncome now checks');
  }
  {
    for(const n of ['Academic Hunting Ground', 'Asylum Hunting Ground', 'Amusement Park Hunting Ground', 'Shanty Town Hunting Ground'])
      ok(fx.lib[n].modes[0].fx.bloodAdd === 1 && fx.lib[n].modes[0].fx.bloodAddTo === 'own-ready' && fx.lib[n].modes[0].phase === 'unlock' && !fx.lib[n].modes[0].lock,
         n + ': the clean core shape -- bloodAdd:1, bloodAddTo:own-ready, phase:unlock, NOT lock-gated (a third shape distinct from both Life in the City\'s one-shot handler and Dreams of the Sphinx/Arcane Library\'s lock-gated choices)');
    ok(fx.lib['Papillon'].modes[0].fx.bloodAdd === 2 && JSON.stringify(fx.lib['Papillon'].req) === JSON.stringify({ title: true }),
       'Papillon: bloodAdd:2 (not 1) + req.title -- fails closed at the consumer (titles untracked), same established precedent as _bestBloodStockFor');
    ok(fx.lib['Meditative Grove'].modes[0].fx.bloodAddTo === 'own-ready' && JSON.stringify(fx.lib['Meditative Grove'].req.clan) === JSON.stringify(['Salubri']) && fx.lib['Meditative Grove'].modes.length === 2,
       'Meditative Grove: blood-gain mode gated on req.clan Salubri; its SEPARATE frenzy-cancel lock mode stays untagged (frenzy isn\'t modelled)');
  }
  {
    const tb = fx.lib['The Barrens'];
    ok(tb.modes[0].lock === true && tb.modes[0].phase === 'master' && tb.modes[0].fx.handCycle === true,
       'The Barrens: lock:true + phase:master (this bot\'s own timing pick) + handCycle:true ("lock this card to discard a card, draw up afterward")');
  }

  /* v1.6.6 (Johan's "sweep it while it's fresh" GO, hand-size family): measured 85
     cards mentioning "hand size" before tagging anything -- most are OUT of scope
     entirely (a discard-cycle mechanic, combat/vote/counter-scoped variants, a
     hostile reduction), not just unbuilt. Two shapes match this session's own
     established family and get tagged. */
  for(const [n, amt] of [['Elder Library', 1], ['The British Museum, London', 1], ['Monastery of Shadows', 1], ['Tabriz Assembly', 1], ['Weeping Stone', 1], ['Shaal Fragment', 2], ['Trophy: Library', 2], ['Reliquary: Trinket', 1], ['Chronicle of the Lost Tribe', 1]])
    ok(mode(n, null).fx.handSize === amt && mode(n, null).fx.handSizePermanent === true,
       n + ': correctly tagged handSize:' + amt + ' + handSizePermanent:true (passive, no lock)');
  {
    const et = fx.lib["Ennoia's Theater"];
    ok(et.modes[0].lock === true && et.modes[0].phase === 'master' && et.modes[0].fx.handSize === 1,
       "Ennoia's Theater: curated mode mirrors Dreams of the Sphinx's own handSize mode exactly (lock:true, phase:master) -- proving _considerLockIncome is genuinely reusable, not built for one card");
    ok(!et.modes[0].fx.handSizePermanent, "Ennoia's Theater: correctly NOT tagged handSizePermanent -- this is the temporary (\"this turn\") shape, a different mechanic from Elder Library's own");
  }
  for(const n of ['Hourglass of the Mind', 'Nar-Sheptha', 'Relentless Pursuit', 'Visit from the Capuchin', 'Aura Reading', 'Rage of Apedemak', 'Reliquary: Shango Remains', 'Year of Fortune'])
    ok(!(fx.lib[n].modes || []).some(m => m.fx && m.fx.handSize !== undefined),
       n + ': correctly NOT tagged handSize -- a different shape (combat-scoped, counter-scaling, burn-blood-triggered, or vote-scoped) this sweep measured and deliberately left untagged, not a category error');
  for(const n of ['Fortschritt Library', 'The Secret Library of Alexandria', 'Watchtower: Chosen are Called', 'Distraction', 'Lupine Assault'])
    ok(!(fx.lib[n].modes || []).some(m => m.fx && m.fx.handSize !== undefined),
       n + ': correctly NOT tagged handSize -- "discard down/up to your hand size" is a draw-then-cycle mechanic that merely REFERENCES hand size, not an increase at all (a category error to tag, not just an unbuilt consumer)');

  ok(mode('Flames of the Netherworld', 'dai').fx.strike === 1 && mode('Flames of the Netherworld', 'DAI').fx.strike === 1,
     'Flames of the Netherworld: [dai]/[DAI] tagged correctly, though req.rangeLong (from the SEPARATE [tha] mode\'s "Only usable at long range") sits at ENTRY level and conservatively excludes these clean modes too at the finder -- a known missed-value limitation (mode-scoped req flags are a future refinement), not a misplay risk');
  const gv = mode('Govern the Unaligned', 'DOM');
  ok(gv && gv.fx.bloodAdd === 3 && gv.fx.bloodAddTo === 'unc' && gv.fx.bloodAddYounger === true && gv.fx.actStealth === 1, 'Govern [DOM] (v1.5.6 blood-placement family): the clean target phrase yields bloodAddTo:unc + bloodAddYounger + the actStealth booking -- the superior-Govern pin');
  const ma = (fx.lib['Magnetic Authority'].modes || []).some(m => m.fx && m.fx.bloodAddTo);
  const pbm = (fx.lib['Powerbase: Montreal'].modes || []).some(m => m.fx && m.fx.bloodAddTo);
  ok(!ma && !pbm, 'blood-placement guards: filtered targets (Magnetic Authority, Sabbat-only) and phase-income (Powerbase: Montreal, INFLUENCE phase) get NO bloodAddTo -- honestly unconsumable, not wrongly automated');

  /* attach-burn template → stealthLater, exact 5-card set */
  const sL = Object.keys(fx.lib).filter(n => (fx.lib[n].modes || []).some(m => m.fx && m.fx.stealthLater)).sort();
  ok(sL.join('|') === 'Marked Path|Pass Through Shadow|Shadow Cast|Under My Skin|Zip Line', 'stealthLater: exactly the 5 template cards (' + sL.join(', ') + ')');
  const zl = (fx.lib['Zip Line'].modes || [])[0];
  ok(zl && zl.fx.stealthLater === 1 && zl.fx.actStealth === 2 && zl.fx.stealth === undefined, 'Zip Line: burn = stealthLater 1, built-in header = actStealth 2, NO playable-modifier stealth');
  ok(!fx.lib['Zip Line'].attachAfterSuccess && !fx.lib['Pass Through Shadow'].attachAfterSuccess && !fx.lib['Under My Skin'].attachAfterSuccess, 'Zip Line/PTS/UMS: NO attachAfterSuccess (they attach via their own play, not the post-success window) — inert-safe at the auto tier');
  ok(fx.lib['Shadow Cast'].attachAfterSuccess === true && fx.lib['Shadow Cast'].persistent === true && mode('Shadow Cast', 'obl').fx.stealth === 1, 'Shadow Cast: curated MP twin — attachAfterSuccess + persistent, [obl] stays ordinary instant stealth');
  ok(fx.lib['Marked Path'].persistent === true, 'Marked Path: persistent restored (the curated-drift find — curated REPLACES auto and had dropped the flag)');

  /* actStealth: built-in action stealth, structurally invisible to _bestStealthFor */
  const op419 = (fx.lib['419 Operation'].modes || [])[0];
  ok(op419 && op419.fx.actStealth === 1 && op419.fx.stealth === undefined, '419 Operation: "+1 stealth action." header is actStealth');
  const nm = mode('Night Moves', 'obf');
  ok(nm && nm.fx.actStealth === 3 && nm.fx.bleedAct === true, 'Night Moves [obf]: bleed action with built-in actStealth 3 (announce-side tally booking, bot v0.6.11, reads actStealth||stealth)');
  let nAct = 0; for(const n in fx.lib) for(const m of fx.lib[n].modes || []) if(m.fx && m.fx.actStealth) nAct++;
  ok(nAct >= 420 && nAct <= 440, 'actStealth volume sane (' + nAct + ', 429 expected -- v1.5.5\'s known-but-empty STOP rule pruned 24 redundant-true header inheritances (Putrescent/Children of Stone-class): a discipline mode of a "+N stealth action" card no longer re-carries the header\'s actStealth)');

  /* keyword-sentence scan: trifle (colon + combination forms) and archetype */
  ok(fx.lib['Dabbler'].trifle === true && fx.lib['Dabbler'].archetype === true, 'Dabbler: "Archetype. Trifle." combination — both keywords tagged (line-start anchors defeated by combos)');
  ok(fx.lib['Bravo'].archetype === true, 'Bravo: "Master: archetype." colon form tagged');
  const nArch = Object.keys(fx.lib).filter(n => fx.lib[n].archetype);
  ok(nArch.length === 14, 'archetype: exactly 14 masters (' + nArch.length + ') — the colon form tripled the audit\'s known set of 5');
  let nTri = 0; for(const n in fx.lib) if(fx.lib[n].trifle) nTri++;
  ok(nTri >= 30, 'trifle volume post keyword-scan (' + nTri + ', was 8 under the line-start regex — "Master: trifle." was the v1.4.2 blind spot, the very reason Vessel had needed hand-curation)');

  /* costEdge: imperative form, exact 4-card set */
  const ce = Object.keys(fx.lib).filter(n => fx.lib[n].costEdge).sort();
  ok(ce.join('|') === 'Enticement|Inside Dirt|Leverage|Patsy', 'costEdge: exactly {Enticement, Inside Dirt, Leverage, Patsy} — "can/may burn the Edge" option phrasings (419 Op, Powerbase: Zürich & co) excluded by the capital-B boundary form');

  /* the Enticement live-misplay guard */
  const eSer = mode('Enticement', 'ser'), eSER = mode('Enticement', 'SER');
  ok(fx.lib['Enticement'].src === 'hand' && fx.lib['Enticement'].costEdge === true && eSer && !Object.keys(eSer.fx).length && eSER && !Object.keys(eSER.fx).length, 'Enticement: inert curated guard — costEdge:true + EMPTY mode fx (auto had poolDmg 2/3 with NO costEdge: playable Edge-free, and the bleed-lockout rider is unmodelled)');

  /* cancelBlock curations: the two EI-exact template hits (13 template-mates dispositioned OUT) */
  const fc = mode('Forced Confessional', 'DOM');
  ok(fc && fc.fx.cancelBlock === true, 'Forced Confessional [DOM]: cancelBlock — EI\'s exact template in DOMINATE, first for the weenie archetype');
  const rl = fx.lib['Relentlessness'];
  ok(rl.src === 'hand' && (rl.modes || []).length === 4 && mode('Relentlessness', 'CEL').fx.cancelBlock === true && mode('Relentlessness', 'FOR').fx.cancelBlock === true && mode('Relentlessness', 'cel').fx.stealth === 1 && rl.cost && rl.cost.blood === 1, 'Relentlessness: 4 curated modes (instant stealth ×2 basic, cancelBlock ×2 superior) + printed 1-blood cost');
}

/* 16) the shipped artifact matches a fresh compile (drift guard) */
{
  let shipped = null;
  try{ shipped = fs.readFileSync(here('elysium-cardfx.json'), 'utf8'); }catch(e){}
  if(shipped){
    const fresh = serialize(compile(cards, curated).out).replace(/"generated": "[^"]+"/, 'G');
    ok(shipped.replace(/"generated": "[^"]+"/, 'G') === fresh,
       'elysium-cardfx.json on disk matches a fresh compile (no drift)');
  } else ok(true, 'no shipped elysium-cardfx.json beside the suite (skip drift check)');
}

/* 17) V-track V2 (2 Aug 2026): the crypt curation — 18 entries, entry-level fx.
   The overlay is WHOLE-ENTRY replacement, so beyond the fx shapes these asserts
   guard the replacement risk itself: base facts (cap/disc/title/votes) must
   survive on every curated vampire, and the 40 no-op vampires stay fx-free. */
{
  const c = fx.crypt;
  const CURATED18 = ['Lenny Burkhead (G6)', 'Larissa Moreira (G6)', 'Royce (G2)', 'The Dowager (G6)',
    'Christine Boscacci (G2)', 'Navar McClaren (G1)', 'Franciscus (G2)', 'Julius (G2)',
    'Blythe Candeleria (G2)', 'Smudge the Ignored (G1)', 'Alexander Silverson (G6)', 'New Blood (ANY)',
    'Anarch Convert (ANY)', 'Antoinette DuChamp (G2)', 'Zöe (G2)', 'Dan Murdock (G1)',
    'Lubomira Hradok (G5)', 'Skidmark (G4)'];
  ok(CURATED18.every(n => c[n] && c[n].src === 'hand' && c[n].fx), 'V2: all 18 crypt entries curated (src hand, fx present)');
  ok(CURATED18.every(n => typeof c[n].cap === 'number' &&
     (c[n].disc ? Array.isArray(c[n].disc.all)
                : ['Smudge the Ignored (G1)', 'Anarch Convert (ANY)'].includes(n))),
     'V2: whole-entry overlay keeps cap on all 18 + disc where the vampire has any (Smudge/Anarch Convert are PRINTED disciplineless — the compiler omits the field, the overlay faithfully preserved it)');
  ok(c['Lenny Burkhead (G6)'].fx.bleedBonus === 1 && c['Lenny Burkhead (G6)'].title === 'Primogen',
     'Lenny Burkhead: bleedBonus 1 and the Primogen title both survive the overlay');
  const lar = c['Larissa Moreira (G6)'].fx.bleedBoostDiscard;
  ok(lar && lar.disc === 'ani' && lar.n === 1, 'Larissa Moreira: bleedBoostDiscard {disc ani, n 1}');
  ok(c['Royce (G2)'].fx.stealthMod.n === -1 && c['Royce (G2)'].fx.stealthMod.when === 'bleed', 'Royce: stealthMod -1 when=bleed');
  ok(c['The Dowager (G6)'].fx.interceptMod.n === 1 && c['The Dowager (G6)'].fx.interceptMod.when === 'directed', 'The Dowager: interceptMod +1 when=directed');
  ok(c['Christine Boscacci (G2)'].fx.interceptMod.n === -1 && c['Christine Boscacci (G2)'].fx.interceptMod.when === 'bleed', 'Christine Boscacci: interceptMod -1 when=bleed');
  ok(c['Navar McClaren (G1)'].fx.blockNotOlder === true, 'Navar McClaren: blockNotOlder (capacity is the age rule)');
  ok(c['Franciscus (G2)'].fx.burnAtDamage === 3, 'Franciscus: burnAtDamage 3');
  ok(c['Julius (G2)'].fx.burnOnTorpor === true, 'Julius: burnOnTorpor');
  const bly = c['Blythe Candeleria (G2)'].fx.strengthMod;
  ok(bly && bly.n === -1 && bly.vsClan === 'Malkavian', 'Blythe Candeleria: strengthMod -1 vsClan=Malkavian');
  ok(c['New Blood (ANY)'].fx.enterPlay && c['New Blood (ANY)'].fx.enterPlay.drawCrypt === 1, 'New Blood (ANY): enterPlay.drawCrypt 1 (circle half documented inert)');
  ok(c['Zöe (G2)'].fx.noHuntStealth === true, 'Zöe: noHuntStealth (the VC general-rule exception rider)');
  ok(c['Lubomira Hradok (G5)'].fx.noUnlockAfterTitledBleed === true, 'Lubomira Hradok: noUnlockAfterTitledBleed');
  ok(c['Antoinette DuChamp (G2)'].fx.costPlusDisc && c['Antoinette DuChamp (G2)'].fx.costPlusDisc.cel === 1, 'Antoinette DuChamp: costPlusDisc.cel 1 (inert-in-deck, documented)');
  ok(c['Dan Murdock (G1)'].fx.fetchNamed && c['Dan Murdock (G1)'].fx.fetchNamed.card === "Giant's Blood", "Dan Murdock: fetchNamed Giant's Blood (inert-in-deck, documented)");
  ok(c['Alexander Silverson (G6)'].fx.voteTaxAgainst === 1 && c['Alexander Silverson (G6)'].votes === 2, 'Alexander Silverson: voteTaxAgainst 1 beside the surviving Prince votes 2');
  const DOC5 = ['Smudge the Ignored (G1)', 'Anarch Convert (ANY)', 'Antoinette DuChamp (G2)', 'Dan Murdock (G1)'];
  ok(DOC5.every(n => c[n].docOnly === true && typeof c[n].note === 'string'), 'the four out-of-scope entries carry docOnly + a note (v1.9.0: Alexander Silverson left the list -- the politics engine he waited for exists)');
  ok(!c['Alexander Silverson (G6)'].docOnly, 'Alexander Silverson is LIVE');
  ok(c['Skidmark (G4)'].archFull === true && c['Skidmark (G4)'].fx.noReplaceActing === true, 'Skidmark: archFull — FULL-BY-ARCHITECTURE, the _flushDraws proof lives in the note');
  ok(['Wauneka (G6)', 'Rosalina Cortez (G6)', 'Mustafa Rahman (G2)', 'Ayelech (G6)'].every(n => c[n] && !c[n].fx),
     'vanilla/title-only vampires stay fx-free (Wauneka, Rosalina, Mustafa, Ayelech)');
  ok(fx.counts.curated === 105, 'curated count = 85 lib + 20 crypt = 105 (got ' + fx.counts.curated + ') -- 20 Sep: + Second Tradition: Domain; 25 Sep: + Bowl of Convergence (the [AUS] paid intercept, sweep pilot), + Legion, + Madman\u2019s Quill (full sweep); 16 Oct (R4): + the six V5 masters (Elder Library, Ventrue Headquarters, The Labyrinth, Guardian Angel, Wasserschloss Anif, Haven Uncovered)');
  { const bw = fx.lib['Bowl of Convergence']; const am = bw && (bw.modes || []).find(m => m.at === 'AUS');
    ok(!!am && am.fx.intercept === 1 && am.fx.interceptPaid === 1 && am.fx.interceptPaidBlood === 1, 'Bowl of Convergence [AUS]: +1 intercept, and +1 more for 1 blood (sweep pilot, text verified in vtes.json)'); }
  { const R = (n, at) => { const e = fx.lib[n]; const m = e && (e.modes || []).find(mo => (mo.at || null) === at); return !!(m && m.fx && m.fx.ranged); };
    ok(R('Theft of Vitae', 'tha') && R('Theft of Vitae', 'THA') && R('.44 Magnum', null) && R('Stunt Cycle', 'pot'), 'ranged (v1.9.0): Theft of Vitae both levels, .44 Magnum, Stunt Cycle (curated) carry fx.ranged');
    ok(!R("Talbot's Chainsaw", null) && !R('Song in the Dark', 'ani') && !R('Body Flare', 'pro') && R('Body Flare', 'PRO'), "ranged: melee strikes do not (Talbot's Chainsaw, Song in the Dark); Body Flare [pro] melee, [PRO] 2R ranged");
    const lone = Object.entries(fx.lib).filter(([n, e]) => (e.modes || []).some(m => m.fx && m.fx.ranged && m.fx.strike === undefined && m.fx.stealBlood === undefined && !m.fx.strikeCE && m.fx.envDmgPerRound === undefined));
    ok(lone.length === 0, 'ranged never stands alone on a mode (it qualifies a strike / steal / env damage) -- ' + lone.map(x => x[0]).slice(0, 5).join(', ')); }
  { const rq = n => (fx.lib[n] && fx.lib[n].req) || {};
    ok(JSON.stringify(rq('Creeping Sabotage').clan) === '["Nosferatu"]' && JSON.stringify(rq('Deep Song').disc) === '["ani"]' && JSON.stringify(rq('Guard Dogs').disc) === '["ani"]',
       'v1.9.1: curated entries inherit the data\u2019s requirements (Creeping Sabotage: Nosferatu; Deep Song, Guard Dogs: ani)');
    ok(!rq('Slum Hunting Ground').clan && !rq('Warsaw Station').clan, 'v1.9.1: a clan icon on a MASTER is not a requirement (Hunting Grounds, Warsaw Station stay clan-free)'); }
  { const st = fx.lib['Second Tradition: Domain']; const m2 = st && (st.modes || []).find(m => m.when === 'lockedBlock');
    ok(st && st.src === 'hand' && st.req && st.req.title && (st.modes || []).length === 2 && st.modes[0].fx.intercept === 2 && !st.modes[0].when, 'Second Tradition: mode 1 = a free +2 intercept, title required (prince / justicar)');
    ok(m2 && m2.fx.unlock === true && m2.fx.intercept === 2 && m2.fx.payBlood === 1, 'Second Tradition: mode 2 (printed: a LOCKED prince or justicar burns 1 blood to unlock and block with +2 intercept) = when:lockedBlock, unlock + intercept 2 + payBlood 1 -- the auto tier had mode 1 only'); }
  ok(fx.lib['Anarch Troublemaker'].modes[0].phase === 'unlock' && fx.lib['Anarch Troublemaker'].modes[0].fx.preyLock === 2 && fx.lib['Anarch Troublemaker'].modes[0].fx.giveToPrey === true && fx.lib['Anarch Troublemaker'].unique === true, 'Anarch Troublemaker: unlock-phase giveToPrey + preyLock 2, unique');
  ok(fx.lib['Voter Captivation'].modes.every(mo => mo.when === 'refPassed' && mo.fx.bloodPerMargin === 1) && fx.lib['Voter Captivation'].modes[1].fx.marginToPool === 2, 'Voter Captivation: refPassed rider, bloodPerMargin on both modes, marginToPool 2 on [PRE]');
  ok(fx.lib['Visit from the Capuchin'].enterCounters === 4 && fx.lib['Visit from the Capuchin'].modes[0].fx.handSizePerCounter === 1 && fx.lib['Visit from the Capuchin'].modes[0].fx.replaceBurnsCounter === true, 'Visit from the Capuchin: enterCounters 4, handSizePerCounter, replaceBurnsCounter');
}

/* ---- v1.7.0: referendum terms -- the politics leg's first brick (Johan, 18 Sep 2026) ---- */
{
  console.log('\nreferendum terms (ref) -- v1.7.0');
  const L = res.out.lib;
  const pol = Object.keys(L).filter(k => L[k].t.includes('political'));
  ok(pol.length === 177, 'political cards in the db (' + pol.length + ')');
  ok(pol.every(k => (L[k].modes || []).every(mo => Object.keys(mo.fx).every(x => x === 'actStealth'))), 'STRUCTURAL GATE: no political card carries an outcome key in modes[].fx (actStealth only) -- no play finder can see a referendum outcome as a play effect (bot debt 14)');
  const krc = L['Kine Resources Contested'], ae = L['Ancilla Empowerment'], ps = L['Parity Shift'], cb = L['Consanguineous Boon'];
  ok(!krc.modes && JSON.stringify(krc.ref.pool) === JSON.stringify([{ sign: -1, scope: 'alloc', n: 4, min: 2 }]), 'Kine Resources Contested: alloc 4 among >= 2, no modes');
  ok(krc.ref.fx && krc.ref.fx.poolDmg === 1 && krc.ref.tags.join() === 'poolDmg', 'KRC: the old auto key survives as ref.fx.poolDmg, tag poolDmg');
  ok(JSON.stringify(ae.ref.pool) === JSON.stringify([{ sign: -1, scope: 'each', n: 1, per: 'minion' }]), 'Ancilla Empowerment: each Methuselah -1 per minion');
  ok(JSON.stringify(L['Anarchist Uprising'].ref.pool) === JSON.stringify(ae.ref.pool), 'Anarchist Uprising = Ancilla Empowerment (same text, same terms -- the sweep, not the card)');
  ok(JSON.stringify(ps.ref.pool) === JSON.stringify([{ sign: 0, scope: 'move', n: 3, from: 'richer', min: 1 }]), 'Parity Shift: move 3 from a richer Methuselah');
  ok(ps.ref.tags.join() === 'poolDmg,poolGain', 'Parity Shift carries BOTH tags (Johan: a pool-damage card with an economy side)');
  ok(ps.req.title === true && ps.req.titles.join() === 'prince,justicar' && !ps.req.unmodelled, 'Parity Shift: req.titles = prince, justicar -- verifiable, so not unmodelled');
  ok(cb.ref.tags.join() === 'poolGain' && cb.ref.pool[0].per === 'clanVamp' && cb.ref.pool[0].sign === 1, 'Consanguineous Boon lands in the poolGain tag unasked (each +1 per clanVamp)');
  ok(L['Conservative Agitation'].ref.pool[0].n === 'players', "Conservative Agitation: n = 'players'");
  ok(L["Camarilla's Iron Fist"].ref.pool.length === 2 && L["Camarilla's Iron Fist"].req.unmodelled === true, "Camarilla's Iron Fist: two terms; 'Requires a titled Camarilla vampire' = req.unmodelled (fail closed)");
  ok(L['Reckless Agitation'].req.unmodelled === true && L['Reckless Agitation'].ref.pool[0].others === true, 'Reckless Agitation: others-only alloc, unmodelled requirement');
  const NEG = ['Finding the Path', 'Lily Prelude', 'Screw the Masquerade!', 'Sabbat Threat', 'Neonate Breach', 'Reins of Power', 'Ancient Influence', 'Mark of the Damned', 'War of Ages'];
  ok(NEG.every(k => !(L[k].ref && L[k].ref.pool)), 'NEGATIVES get no ref.pool: split text, discipline modes, conditional extras, ongoing drains, X (a wrong term misleads)');
  ok(L['Screw the Masquerade!'].ref.tags.join() === 'poolDmg' && L['Sabbat Threat'].ref.tags.join() === 'poolDmg', 'tag-only cards keep the poolDmg THREAT tag for readers');
  ok(pol.filter(k => L[k].ref && L[k].ref.pool).length === 14, 'exactly 14 cards carry ref.pool (got ' + pol.filter(k => L[k].ref && L[k].ref.pool).length + ')');
  ok(Object.keys(L).filter(k => !L[k].t.includes('political') && L[k].ref).length === 0, 'ref exists on political cards only');
  ok(L['Fourth Tradition: The Accounting'].req.titles.join() === 'prince,justicar', 'req.titles is additive on non-political cards (Fourth Tradition)');
  const { refTerms } = require('./cardfx-compile.js');
  ok(refTerms('Successful referendum means each Methuselah burns 1 pool for each ghoul they control.') === null, 'unknown per-counter -> null (no guess)');
}

/* ---- v1.8.0: the act-again rider + strikeCE (Johan's sweep rule, 18 Sep 2026) ---- */
{
  console.log('\nact-again riders (when) + strikeCE -- v1.8.0');
  const L = res.out.lib;
  const fd = L['Freak Drive'];
  ok(fd.modes.length === 2 && fd.modes[0].when === 'actSuccess' && fd.modes[1].when === 'actBlocked' && fd.cost.blood === 1, 'Freak Drive: [for] actSuccess, [FOR] actBlocked, 1 blood');
  const tagged = Object.keys(L).filter(k => (L[k].modes || []).some(mo => /^act(Success|Blocked|Failed)$/.test(mo.when || ''))).sort();
  ok(tagged.join('|') === 'Domain of Evernight|Forced March|Freak Drive|Instantaneous Transformation|Truth of a Thousand Lies|Zephyr', 'exactly six cards carry an act-again rider (' + tagged.length + ')');
  ok(tagged.every(k => L[k].t.includes('mod') && L[k].modes.filter(mo => mo.when).every(mo => mo.fx.unlock === true)), 'all are action modifiers and the rider only sits on an unlocking mode');
  ok(L['Zephyr'].modes.find(mo => mo.at === 'CEL').when === 'actFailed' && !L['Zephyr'].modes.find(mo => mo.at === 'cel').when, 'Zephyr: [CEL] actFailed; [cel] unlocks at the END of the turn -- no rider');
  const NEG = ['Gift of Bellona', "Hag's Wrinkles", 'Shroud Mastery', 'CrimethInc.', 'Dusk Work', "Tangle Atropos' Hand", 'Shell Game', 'As the Crow'];
  ok(NEG.every(k => !(L[k].modes || []).some(mo => /^act/.test(mo.when || ''))), 'NEGATIVES get no rider: tied to the KIND of action, to another minion, to a payment, or not discipline-segmented');
  ok(L['Forced March'].oncePerTurn === true && L['Instantaneous Transformation'].oncePerTurn === true && !fd.oncePerTurn, 'oncePerTurn from "can play only one ... each turn" (Forced March yes, Freak Drive no)');
  const mj = L['Majesty'];
  ok(mj.modes.every(mo => mo.fx.strikeCE === true && mo.fx.combatEnds === true) && mj.modes.find(mo => mo.at === 'PRE').fx.unlock === true && !mj.modes.find(mo => mo.at === 'pre').fx.unlock, 'Majesty: strikeCE on both modes, unlock on [PRE] only');
  const nCE = Object.keys(L).filter(k => (L[k].modes || []).some(mo => mo.fx.strikeCE)).length, nAll = Object.keys(L).filter(k => (L[k].modes || []).some(mo => mo.fx.combatEnds)).length;
  ok(nCE === 45 && nAll === 64, 'strikeCE is the PLAYABLE subset of combatEnds: ' + nCE + ' of ' + nAll);
}

/* ---- v1.9.0: the block bar + self damage sweep (Johan's sweep rule, 18 Sep 2026 late) ---- */
{
  console.log('\nblockBar + selfDmg / selfTorpor -- v1.9.0');
  const L = res.out.lib, C = res.out.crypt;
  const bar = who => Object.keys(L).filter(k => (L[k].modes || []).some(mo => mo.fx && mo.fx.blockBar === who)).sort();
  ok(bar('vampires').join('|') === 'Beast Meld|Daring the Dawn|Day Operation|Flaming Candle|Strange Day', 'blockBar vampires: exactly five (' + bar('vampires').join(', ') + ')');
  ok(bar('all').length === 6 && bar('allies').length === 4 && bar('chosen').length === 10 && bar('titled').join() === 'Propaganda' && bar('cond').length === 8, 'all 6 / allies 4 / chosen 10 / titled 1 / cond 8 -- 34 cards, one tag');
  ok(!(L['Pentex\u2122 Subversion'].modes || []).some(mo => mo.fx && mo.fx.blockBar) && !(L['Libertas'].modes || []).some(mo => mo.fx && mo.fx.blockBar), 'NEGATIVES: a standing bar on a minion is not a THIS-ACTION bar');
  const dd = L['Daring the Dawn'];
  ok(dd.modes[0].fx.selfDmg === 2 && dd.modes[1].fx.selfDmg === 1 && dd.modes.every(mo => mo.fx.selfAggr && !mo.fx.aggr), 'Daring the Dawn: selfDmg 2 / 1, selfAggr -- aggr no longer leaks');
  ok(L['Day Operation'].modes.every(mo => mo.fx.selfTorpor && !mo.fx.torpor), 'Day Operation: selfTorpor -- torpor no longer leaks');
  ok(L['Force of Will'].modes[0].fx.selfDmg === 2 && L['Force of Will'].modes[1].fx.selfDmg === 1 && L['Force of Will'].modes[1].fx.bleed === 2, 'Force of Will: the superior "takes only 1" echo is read');
  const self = Object.keys(L).filter(k => (L[k].modes || []).some(mo => mo.fx && (mo.fx.selfDmg || mo.fx.selfTorpor))).sort();
  ok(self.join('|') === "Daring the Dawn|Day Operation|Force of Will|Putrefaction|Rutor's Hand", 'exactly five self-price cards (' + self.length + ')');
  ok(!(L['Sound of a Breaking Oath'].modes || []).some(mo => mo.fx.selfDmg) && !(L['Rant!'].modes || []).some(mo => mo.fx && mo.fx.selfDmg) && !(L['Car Bomb'].modes || []).some(mo => mo.fx && mo.fx.selfDmg), "NEGATIVES: the opponent's acting minion, a conditional hit");
  ok(C['Sybren van Oosten (G6)'].fx.selfUnlock.when === 'refPassed' && C['Alexa Draper (G6)'].fx.voteBoostDiscard.disc === 'dom' && C['Alexander Silverson (G6)'].fx.voteTaxAgainst === 1 && !C['Alexander Silverson (G6)'].docOnly, 'crypt: Sybren, Alexa, Silverson (live)');
  ok(C['Sybren van Oosten (G6)'].votes === 2 && C['Alexa Draper (G6)'].cap === 8 && C['Alexa Draper (G6)'].disc.sup.join() === 'dom,pre', 'a curated crypt entry keeps the structured fields');
}

/* ---- R4 (bot v0.6.205, 16 Oct 2026, the play-test review's F23): every master of the four V5 decks is hand-checked ---- */
{
  console.log('\nthe V5 decks\u2019 masters are curated -- R4 (the play-test review, F23)');
  const L = res.out.lib, A = res.out.alias || {};
  const bad = [], seen = [];
  ['malkavian', 'tremere', 'nosferatu', 'ventrue'].forEach(d => {
    const deck = JSON.parse(fs.readFileSync(here('deck-' + d + '.json'), 'utf8'));
    (deck.library || []).forEach(e => { const k = L[e.name] ? e.name : A[String(e.name).toLowerCase()]; const ent = k && L[k];
      if(ent && (ent.t || []).includes('master')){ seen.push(k); if(ent.src !== 'hand') bad.push(d + ': ' + k); } }); });
  ok(seen.length >= 30 && !bad.length, 'every master in the four V5 decks is src:hand (' + seen.length + ' copies of masters; not curated: ' + (bad.join(', ') || 'none') + ')');
  const lab = L['The Labyrinth'].modes[0];
  ok(lab.lock === true && lab.fx.lockStealth === 1 && lab.fx.lockStealthClan === 'Nosferatu' && lab.fx.stealth === undefined, 'The Labyrinth: a lock for +1 stealth to a Nosferatu (lockStealth), no hand-finder stealth');
  const ga = L['Guardian Angel'];
  ok(ga.host === 'ready' && ga.burnOnHostTorpor === true && ga.modes[0].fx.hostIntercept === 1 && ga.modes[0].fx.hostInterceptOn === 'bleed' && ga.modes[0].fx.hostPrevent === 1 && ga.cost && ga.cost.pool === 2,
     'Guardian Angel: on a ready vampire of mine, +1 intercept on a bleed at me, prevent 1 each combat, burned at torpor, 2 pool');
  const ws = L['Wasserschloss Anif, Austria'];
  ok(ws.modes.length === 2 && ws.modes[0].phase === 'master' && !ws.modes[0].lock && ws.modes[0].fx.bankIn === 1 && ws.modes[1].lock === true && ws.modes[1].phase === 'influence' && ws.modes[1].fx.bankOut === 'unc' && ws.modes.every(mo => mo.fx.bankClan === 'Tremere' && mo.fx.stealth === undefined),
     'Wasserschloss Anif: the bank -- in at my master phase, out (a lock) at my influence phase, Tremere; no stealth');
  const hv = L['Haven Uncovered'];
  ok(hv.modes.length === 1 && hv.modes[0].fx.rushGrant === 1 && hv.modes[0].fx.stealth === undefined, 'Haven Uncovered: rushGrant 1 (the granted rush\u2019s +1 stealth), no stealth');
  ok(L['Elder Library'].modes[0].fx.handSize === 1 && L['Elder Library'].modes[0].fx.handSizePermanent === true && L['Ventrue Headquarters'].modes[0].lock === true && L['Ventrue Headquarters'].modes[0].fx.votes === 3,
     'Elder Library and Ventrue Headquarters keep the auto tier\u2019s right shapes (+1 hand size; a lock for +3 votes)');
}

console.log('\n' + passN + '/' + failN + (failN ? ' — FAIL' : ' — all green'));
process.exit(failN ? 1 : 0);
