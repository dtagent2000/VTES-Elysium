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
if(Array.isArray(cards) && cards.length && typeof cards[0].kind === 'string'){ console.error('test-cardfx: KRCG\u2019s v5 dump is saved as vtes.json: the tools read the v3 shape built from it -- save the dump as vtes-v5.json beside expansions.json and run node krcg-v5.js (root CLAUDE.md, \u201cData that is not in git\u201d)'); process.exit(2); }   // v0.6.216
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
     'split-mode directedness (the owner, 13 July): Govern\'s inferior bleed is directed, its superior blood-add is NOT — one entry-level flag used to lie about half the card');
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

/* 5) the owner's motivating example: pool damage that is not a bleed */
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
  ok(nPd === 13, 'poolDmg volume post-guard (' + nPd + ' modes; 41 -> 29 by the unlock-phase drain guard, 29 -> 14 in v1.7.0: the 15 modes on 14 POLITICAL cards moved to ref.fx -- a referendum outcome is not a play effect; 14 -> 13 in bot v0.6.230: Privileged Position\u2019s lock after a passed referendum is curated, fx.refPassPreyBurn)');
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
       verified map (synthetic shape, real content). The real v5 file is read
       through krcg-v5.js since v0.6.216; KRCG's default became v5 on 8 Nov.  */
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

  /* v1.5.8 (the owner's combat go-ahead, steal-blood family): four new req flags for combat
     timing preconditions the bot's v1 architecture cannot verify — measured against
     the full 410-card Combat pool before tagging. */
  ok(fx.lib['Drain Essence'].req.notFirstRound === true, 'req.notFirstRound: Drain Essence ("Not usable on the first round of combat") tagged');
  ok(fx.lib['Donnybrook'].req.rangeClose === true, 'req.rangeClose: Donnybrook ("Only usable at close range") tagged');
  ok(fx.lib['Hunger of Marduk'].req.beforeRangeDetermined === true, 'req.beforeRangeDetermined: Hunger of Marduk ("Only usable before range is determined") tagged — the largest class, 83 cards');
  let rC = 0; for(const n in fx.lib) if(fx.lib[n].req && fx.lib[n].req.rangeClose) rC++;
  let rL = 0; for(const n in fx.lib) if(fx.lib[n].req && fx.lib[n].req.rangeLong) rL++;
  let bR = 0; for(const n in fx.lib) if(fx.lib[n].req && fx.lib[n].req.beforeRangeDetermined) bR++;
  let nF = 0; for(const n in fx.lib) if(fx.lib[n].req && fx.lib[n].req.notFirstRound) nF++;
  ok(fx.lib['Walk of Flame'].req.notFirstRound === true && !(fx.lib['Shotgun Ritual'].req && fx.lib['Shotgun Ritual'].req.notFirstRound), 'req.notFirstRound (compiler v1.9.4): Walk of Flame ("Not usable during the first round.") tagged; Shotgun Ritual, which lifts the restriction, not');
  ok(rC === 20 && rL === 21 && bR === 84 && nF === 12, 'req flag volumes (' + rC + '/' + rL + '/' + bR + '/' + nF + '): the raw 410-Combat-type scan found 19/17/83/4 (v1.9.4: + 5 "during the first round": 9; v1.9.5: + 3 "Not usable (the) first round": 12), but the compiler correctly also tags EQUIPMENT carrying the same range-restricted text (Sniper Rifle, RPG Launcher, Smoke Grenade, Spike-Thrower, Starshell Grenade Launcher, Garrote) and one Reaction (Foresee) -- req doesn\'t filter by type, and shouldn\'t: a sniper rifle IS long-range-restricted regardless of its own card type');
  const ctl = fx.lib['Call the Lamprey'].modes || [];
  ok(ctl.find(m => m.at === 'obt').fx.stealBlood === undefined && ctl.find(m => m.at === 'OBT').fx.stealBlood === 1,
     'Call the Lamprey curated: [obt] (ally-only, unverifiable) emptied, [OBT] (unrestricted "opposing minion") kept clean');

  /* v1.5.9 (the owner's combat go-ahead, strike-bonus family): 33-card measurement, two new
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

  /* v1.6.0 (the owner's standing question, round 4): a THIRD strike phrasing found while
     checking the v1.5.9 work for uncertainty -- "Strike: N aggravated damage" (6
     cards; Compress was the one that revealed it). */
  ok(mode('Compress', 'thn').fx.strike === 2 && mode('Compress', 'THN').fx.strike === 3,
     'Compress: "Strike: N aggravated damage" (aggravated between number and damage, breaking both the original pattern and v1.5.9\'s two additions) now tagged -- [thn] 2, [THN] 3');
  ok(mode('Body Flare', 'PRO').fx.strike === 2, 'Body Flare [PRO]: the "2R aggravated damage" ranged form also matches (R handled)');
  ok(!(fx.lib['Body of Sun'].modes || []).some(m => m.fx && typeof m.fx.strike === 'number'),
     'Body of Sun correctly EXCLUDED: "3 aggravated damage if at close range or 1R ...if at long range" is RANGE-CONDITIONAL -- a single number would be a guess, not a fact, with no range state tracked; the negative lookahead protects it');

  /* v1.6.1 (the owner's combat go-ahead, Carrion Crows -- the persistent-this-combat modifier
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

  /* v1.6.2 (the owner's combat go-ahead, Immortal Grapple -- the strike-type restriction
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

  /* v1.6.3 (the owner's go-ahead to push Inside Dirt to 100%, Life in the City): a THIRD
     bloodAddTo class, 'own-ready' -- measured 5 cards sharing "add N blood to a ready
     vampire" wording, only Life in the City is the clean one-shot shape. */
  ok(mode('Life in the City', null).fx.bloodAdd === 1 && mode('Life in the City', null).fx.bloodAddTo === 'own-ready',
     'Life in the City: correctly tagged bloodAdd:1 + bloodAddTo:own-ready');
  ok(fx.lib['Life in the City'].handler === 'life-in-the-city', 'Life in the City curated with the handler key');
  ok(!fx.lib['The Coven'].modes[0].fx.bloodAddTo,
     'The Coven correctly NOT given bloodAddTo:own-ready -- shares the same "add N blood to a ready vampire" phrase but as a LOCK-based recurring choice ("you can lock this card to add..."), a different mechanic the negative lookahead correctly excludes');

  /* v1.6.4 (the owner's go-ahead to push Inside Dirt to 100%, continuing Life in the City):
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

  /* v1.6.6 (the owner's go-ahead to sweep it while it's fresh, hand-size family): measured 85
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
  const pbmC = fx.lib['Powerbase: Montreal'], pbmM = pbmC && (pbmC.modes || [])[0];
  ok(!ma && pbm && pbmC.src === 'hand' && pbmM && pbmM.once === true && pbmM.phase === 'influence' && pbmM.fx.bloodAddTo === 'unc' && !pbmM.lock,
     'blood-placement guards: Magnetic Authority (Sabbat-only) still gets NO bloodAddTo; Powerbase: Montreal is curated since V5 wave 3 (v0.6.215): once in the influence phase, no lock, bloodAddTo unc (_considerLockIncome reads `once`)');

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
  ok(nAct >= 385 && nAct <= 400, 'actStealth volume sane (' + nAct + ', 393 expected -- v1.5.5\'s known-but-empty STOP rule pruned 24 redundant-true header inheritances (Putrescent/Children of Stone-class): a discipline mode of a "+N stealth action" card no longer re-carries the header\'s actStealth; v1.12.0 (C1): 429 -> 393, a granted action\'s stealth is not the card\'s own, and the conditional ones sit on plusIf)');

  /* keyword-sentence scan: trifle (colon + combination forms) and archetype */
  ok(fx.lib['Dabbler'].trifle === true && fx.lib['Dabbler'].archetype === true, 'Dabbler: "Archetype. Trifle." combination — both keywords tagged (line-start anchors defeated by combos)');
  ok(fx.lib['Bravo'].archetype === true, 'Bravo: "Master: archetype." colon form tagged');
  const nArch = Object.keys(fx.lib).filter(n => fx.lib[n].archetype);
  ok(nArch.length === 17, 'archetype: exactly 17 masters (' + nArch.length + ') — the colon form tripled the audit\'s known set of 5; v1.9.8: + the three "Unique archetype." Saulot masters');
  ok(fx.lib["Saulot's Healing Touch"].archetype === true && fx.lib["Saulot's Healing Touch"].unique === true, 'v1.9.8: Saulot\u2019s Healing Touch ("Unique archetype.") is an archetype and unique');
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
  ok(fx.counts.curated === 301, 'curated count = 250 lib + 51 crypt = 301 (got ' + fx.counts.curated + ') -- 27 Nov (C1, bot v0.6.243): + 80 merges, the readers\u2019 corrections of the stealth / intercept / bleed family; 25 Nov (the exactness round, bot v0.6.241): + Aire of Elation, The Warrens (merges: the sweep register 7.1 and 7.2, fx.plusIf), Mirror Walk (a merge: [THA]\u2019s fx.blockedLockEnd); 20 Nov (the Banu Haqim pilot, compiler v1.11.0): + Biothaumaturgic Experiment, Shadow of the Beast, New Moon Sigil, Priority Contract, Night Terrors (the first merge opt-ins: each layer carries its remainder only); 18 Nov (V5 wave 6b, bot v0.6.234): + Shadow Cloak, Sleep Unseen, Absolute Tyranny; 18 Nov (V5 wave 6a, bot v0.6.233): + True Love\'s Face, Hunting the Quarry; 18 Nov (V5 wave 5b, bot v0.6.232): + Sudden Reversal, Yawp Court, Week of Nightmares; 17 Nov (V5 wave 5a, bot v0.6.230): + Tension in the Ranks, Anarch Revolt, Frontal Assault, Forward Momentum, Privileged Position, Mob Connections, Garibaldi-Meucci Museum, Powerbase: Los Angeles, Carver\u2019s Meat Packing and Storage, The Rack, The Hungry Coyote, The Coven, Piper, D\u00eda de los Muertos, Cursed Abattoir; 14 Nov (round F, bot v0.6.228): + Perfect Paragon, Elysium: The Palace of Versailles, Eyes of the Wild; 12 Nov (crypt wave A, bot v0.6.219): + 31 vampires (the bleed, strength, intercept, stealth, vote and dodge forms, D-108); 3 Nov (V5 wave 4): + Oblivion, Charisma, Depravity, Terrifying Visage, Monster, Saulot\u2019s Avenging Fist, Saulot\u2019s Guiding Wisdom, Regent, Toreador Grand Ball, Change of Target, Scalpel Tongue, Toreador Justicar; 2 Nov (V5 wave 3): + 20 masters (Anarch Railroad, Backways, Elysian Fields, Fortune Teller Shop, Opium Den, Creepshow Casino, Market Square, Channel 10, KRCG News Radio, Wall Street Night, Unholy Sacrament, Family Gathering, Carfax Abbey, Burial Site Hunting Ground, Art Museum, Ecoterrorists, Powerbase: Montreal, Haqim\u2019s Law: Retribution, Club Illusion, Archon Investigation); 20 Sep: + Second Tradition: Domain; 25 Sep: + Bowl of Convergence (the [AUS] paid intercept, sweep pilot), + Legion, + Madman\u2019s Quill (full sweep); 16 Oct (R4): + the six V5 masters (Elder Library, Ventrue Headquarters, The Labyrinth, Guardian Angel, Wasserschloss Anif, Haven Uncovered); 29 Oct (V5 wave 1): + Villein, Quickness, Pursuit, Arms of Ahriman, Claws of the Dead, Sculpt the Flesh, Wall of Filth, Rutor\u2019s Hand, Sword of the Archangel, Invigorate; 29 Oct (V5 wave 2): + Flash, Resist Earth\u2019s Grasp, Slam, Hunger of Marduk, Rage of Apedemak, Torn Signpost, Form of the Wolf, Monstrous Form, Soul Burn');
  { const C = fx.crypt, F = n => (C[n] && C[n].fx) || {};   // v0.6.219 (crypt wave A, RULINGS D-108): 31 vampires -- the whole-entry overlay keeps the base facts (cap, disc, the title and votes, the V5 Path), each form as its reader reads it
    const WA = ['Catalina Vega (G6)', 'Kamile Paukstys (G6)', 'Kasim Bayar (G6)', 'Marchesa Liliana (G6)', 'Mora, the Death Seer (G6)', 'Nonu Dis (G6)',
      'Agnieszka, Tempter of Legions (G6)', 'Ashur-uballit, Son of the Abyss (G6)', 'Huldu, The Desecrator (G6)', 'Aaradhya, The Callous Tyrant (G6)', 'Sreelekha (G7)',
      'Martina Srnankova (G6)', 'Rinaldo Albizzi (G6)', 'Verrix, Naughty Boy (G6)', 'Massimiliano (G6)', 'Valeriya Zinovieva (G6)', 'Anousha, The Maniac (G6)',
      'Theo Bell (G6)', 'Faruq Abd al-Qadir (G6)', "Abderrahim, Death's Hand (G6)", 'Castellan (G7)', 'Bret Stryker (G6)', 'Branimira (G6)', 'Azucena (G6)',
      'Kalyani, Agent of Doom (G6)', 'Frau Schädel (G6)', 'Ariane (G5)', 'Devorah (G6)', 'Yewon Ong (G6)', 'Flávio Gonçalves (G6)', 'Phaibun (G7)'];
    ok(WA.length === 31 && WA.every(n => C[n] && C[n].src === 'hand' && C[n].fx && typeof C[n].cap === 'number' && C[n].disc && Array.isArray(C[n].disc.all) && /^Crypt wave A/.test(C[n].note || '')),
       'crypt wave A: 31 entries curated (src hand, fx and a note), cap and disc survive the overlay');
    ok(C['Catalina Vega (G6)'].title === 'Prince' && C['Catalina Vega (G6)'].votes === 2 && C['Agnieszka, Tempter of Legions (G6)'].path === 'Cathari' && C["Abderrahim, Death's Hand (G6)"].path === 'Death and the Soul' && C['Massimiliano (G6)'].title === 'Baron',
       'crypt wave A: the titles, votes and Paths survive (Catalina a Prince with 2 votes, Agnieszka of Cathari, Abderrahim of Death and the Soul, Massimiliano a Baron)');
    ok(WA.slice(0, 11).every(n => F(n).bleedBonus === 1 && Object.keys(F(n)).length === 1) && ['Massimiliano (G6)', 'Valeriya Zinovieva (G6)', 'Anousha, The Maniac (G6)', 'Theo Bell (G6)', 'Faruq Abd al-Qadir (G6)', "Abderrahim, Death's Hand (G6)"].every(n => JSON.stringify(F(n)) === '{"strengthMod":{"n":1}}'),
       'crypt wave A: eleven +1 bleeds (Catalina, Kamile and the bleed halves) and six +1 strengths, one key each');
    ok(JSON.stringify(F('Martina Srnankova (G6)').interceptMod) === '{"n":1,"when":"bleed"}' && JSON.stringify(F('Rinaldo Albizzi (G6)').interceptMod) === '{"n":1}' && JSON.stringify(F('Castellan (G7)').interceptMod) === '{"n":1,"when":"directed","undirected":-1}'
       && JSON.stringify(F('Bret Stryker (G6)').interceptMod) === '{"n":-1,"vsTitled":true}' && JSON.stringify(F('Branimira (G6)').interceptMod) === '{"n":1,"poolMax":9}' && JSON.stringify(F('Azucena (G6)').interceptMod) === '{"vsClan":"Lasombra","younger":1,"older":-1}',
       'crypt wave A: the intercept forms -- Martina on bleeds, Rinaldo always, Castellan directed / undirected, Bret against titled vampires, Branimira at 9 pool or fewer, Azucena by the Lasombra actor’s age');
    ok(JSON.stringify(F('Verrix, Naughty Boy (G6)').stealthMod) === '{"n":1,"when":"bleed"}' && JSON.stringify(F('Kalyani, Agent of Doom (G6)')) === '{"stealthMod":{"n":-1,"when":"hunt"},"strengthMod":{"n":1}}' && JSON.stringify(F('Frau Schädel (G6)').stealthMod) === '{"n":1,"when":["recruit","employ"]}'
       && JSON.stringify(F('Ariane (G5)').stealthMod) === '{"n":-1,"when":"undirected"}' && JSON.stringify(F('Devorah (G6)').stealthMod) === '{"n":1,"poolMax":5}',
       'crypt wave A: the stealth forms -- Verrix on bleeds, Kalyani when hunting (and +1 strength), Frau Schädel on recruit and employ, Ariane on undirected actions, Devorah at 5 pool or fewer');
    ok(JSON.stringify(F('Yewon Ong (G6)')) === '{"voteBoostDiscard":{"disc":"obl","n":1}}' && JSON.stringify(F('Flávio Gonçalves (G6)')) === '{"strikeDodge":{"once":"combat"}}' && JSON.stringify(F('Phaibun (G7)')) === '{"strikeDodge":{"once":"combat","discardRandom":1}}',
       'crypt wave A: Yewon Ong’s Oblivion vote discard (Alexa Draper’s shape), Flávio’s and Phaibun’s once-each-combat strike: dodge (Phaibun’s at a random card)'); }
  { const L4 = n => fx.lib[n] || {}, F4 = (n, i) => ((L4(n).modes || [])[i || 0] || {}).fx || {};   // v0.6.217 (V5 wave 4): the curated readings and what the overlay inherits
    ok(JSON.stringify(L4('Toreador Grand Ball').cost) === '{"pool":1}' && JSON.stringify(L4('Toreador Grand Ball').req.clan) === '["Toreador"]' && F4('Toreador Grand Ball').grandBall === true && F4('Toreador Grand Ball', 1).burnCardAction === true && F4('Toreador Grand Ball', 1).burnStealthClan.Nosferatu === -1,
       'V5 wave 4: Toreador Grand Ball inherits 1 pool and the Toreador icon; mode 1 the Ball, mode 2 the (D) action that burns it (Nosferatu -1 stealth)');
    ok(JSON.stringify(L4("Saulot's Avenging Fist").cost) === '{"pool":2}' && JSON.stringify(L4("Saulot's Guiding Wisdom").req.clan) === '["Salubri"]' && L4("Saulot's Guiding Wisdom").votes === 2 && L4('Regent').votes === 4 && L4('Toreador Justicar').votes === 3 && L4('Regent').uniqueTitle === true,
       'V5 wave 4: the title cards carry their votes (Saulot\u2019s Guiding Wisdom 2, Regent 4, Toreador Justicar 3; the regent a unique title); the Salubri masters inherit their costs and icon');
    ok(JSON.stringify(L4('Scalpel Tongue').cost) === '{"blood":1}' && JSON.stringify(L4('Scalpel Tongue').req.disc) === '["cel","pre"]' && JSON.stringify((L4('Scalpel Tongue').modes || []).map(m => m.at)) === '["cel+pre","CEL+PRE"]' && (L4('Scalpel Tongue').modes || []).every(m => m.when === 'polling' && m.fx.abstainVoter === true) && F4('Scalpel Tongue', 1).voterBloodBurn === 1 && !F4('Scalpel Tongue', 0).voterBloodBurn,
       'V5 wave 4: Scalpel Tongue -- 1 blood; round F (v0.6.228): [cel][pre] is ONE requirement (cel+pre, CEL+PRE -- KRCG writes an either-or with "or"), two polling-step modes, the superior burns 1 blood');
    ok(JSON.stringify((L4('Perfect Paragon').modes || []).map(m => m.at)) === '["pre","PRE"]' && F4('Perfect Paragon', 0).votes === 3 && JSON.stringify(F4('Perfect Paragon', 1).icpVs) === '{"n":-1,"who":["ally","younger"]}' && JSON.stringify(L4('Perfect Paragon').cost) === '{"blood":1}',
       'round F (v0.6.228): Perfect Paragon -- [pre] +3 votes, [PRE] allies and younger vampires get -1 intercept (fx.icpVs); 1 blood');
    ok(F4('Elysium: The Palace of Versailles').votes === 1 && JSON.stringify(F4('Elysium: The Palace of Versailles').votesEach) === '{"title":true,"sect":"Camarilla"}' && (L4('Elysium: The Palace of Versailles').modes || [])[0].lock === true && JSON.stringify(L4('Elysium: The Palace of Versailles').cost) === '{"pool":2}',
       'round F (v0.6.228): Versailles -- lock: +1 vote to EACH titled Camarilla vampire I control (fx.votesEach); 2 pool');
    { const ew = L4('Eyes of the Wild'), m0 = (ew && ew.modes || [])[0] || {};
      ok(JSON.stringify(ew.req.clan) === '["Gangrel"]' && (ew.modes || []).length === 1 && m0.when === 'lockedBlock' && m0.fx.unlock === true && m0.fx.interceptPaid === 1 && m0.fx.interceptPaidBlood === 1 && m0.fx.relockIfNoBlock === true && m0.fx.intercept === undefined,
         'round F (v0.6.228): Eyes of the Wild -- a locked Gangrel unlocks and attempts to block (when lockedBlock), 1 blood for +1 intercept, locked again if it did not block; no plain intercept'); }
    ok(F4('Oblivion').discUp === 'obl' && F4('Oblivion').capBonus === 1 && F4('Depravity').strengthBonus === 1 && F4('Depravity').noRecruitEmploy === true && F4('Charisma').recruitDiscount === 1 && F4('Monster').unlockAfterCombat === 1 && L4('Monster').archetype === true && F4('Terrifying Visage').blockedPoolBurn === 1 && (L4('Change of Target').modes || [])[0].when === 'ifBlocked' && F4('Change of Target').endAction === true,
       'V5 wave 4: Oblivion (+1 level, +1 capacity), Depravity, Charisma, Monster, Terrifying Visage, Change of Target (if blocked) carry their keys'); }
  { const bw = fx.lib['Bowl of Convergence']; const am = bw && (bw.modes || []).find(m => m.at === 'AUS');
    ok(!!am && am.fx.intercept === 1 && am.fx.interceptPaid === 1 && am.fx.interceptPaidBlood === 1, 'Bowl of Convergence [AUS]: +1 intercept, and +1 more for 1 blood (sweep pilot, text verified in vtes.json)'); }
  { const R = (n, at) => { const e = fx.lib[n]; const m = e && (e.modes || []).find(mo => (mo.at || null) === at); return !!(m && m.fx && m.fx.ranged); };
    ok(R('Theft of Vitae', 'tha') && R('Theft of Vitae', 'THA') && R('.44 Magnum', null) && R('Stunt Cycle', 'pot'), 'ranged (v1.9.0): Theft of Vitae both levels, .44 Magnum, Stunt Cycle (curated) carry fx.ranged');
    ok(!R("Talbot's Chainsaw", null) && !R('Song in the Dark', 'ani') && !R('Body Flare', 'pro') && R('Body Flare', 'PRO'), "ranged: melee strikes do not (Talbot's Chainsaw, Song in the Dark); Body Flare [pro] melee, [PRO] 2R ranged");
    const lone = Object.entries(fx.lib).filter(([n, e]) => (e.modes || []).some(m => m.fx && m.fx.ranged && m.fx.strike === undefined && m.fx.stealBlood === undefined && m.fx.stealGrant === undefined && !m.fx.strikeCE && m.fx.envDmgPerRound === undefined));   // v0.6.214: + stealGrant (Hunger of Marduk: a ranged steal this round)
    ok(lone.length === 0, 'ranged never stands alone on a mode (it qualifies a strike / steal / env damage) -- ' + lone.map(x => x[0]).slice(0, 5).join(', ')); }
  { const rq = n => (fx.lib[n] && fx.lib[n].req) || {};
    ok(JSON.stringify(rq('Creeping Sabotage').clan) === '["Nosferatu"]' && JSON.stringify(rq('Deep Song').disc) === '["ani"]' && JSON.stringify(rq('Guard Dogs').disc) === '["ani"]',
       'v1.9.1: curated entries inherit the data\u2019s requirements (Creeping Sabotage: Nosferatu; Deep Song, Guard Dogs: ani)');
    ok(JSON.stringify(rq('Slum Hunting Ground').clan) === '["Nosferatu"]' && JSON.stringify(rq('Warsaw Station').clan) === '["Nosferatu"]' && JSON.stringify(rq('Ventrue Headquarters').clan) === '["Ventrue"]',
       'v1.9.6 (R-42, reversing v1.9.1): a clan icon on a MASTER is a requirement -- curated masters inherit it too (Slum Hunting Ground, Warsaw Station, Ventrue Headquarters); the target of a hunting ground is the mode\u2019s own fact (fx.bloodAddClan)'); }
  /* v1.9.7 / krcg-v5.js (bot v0.6.216): KRCG's v5 dump as the source -- vtes.json is built from it (krcg-v5.js); the compiler reads
     the v5 cost shape directly too. Synthetic records: no dependence on which file sits beside the gate. */
  { const { toV3 } = require('./krcg-v5.js');
    const sets = new Map([[300099, { name: 'Fifth Edition', release_date: '2020-01-01', bundles: { PH: { name: 'Hecata', release_date: '2023-01-01' }, '': { name: '' } } }]]);
    const cr = toV3({ id: 1, kind: 'Crypt', printed_name: 'The Ankou', suffix: 'G5', group: 'G5', clan: 'Nagaraja', disciplines: ['aus', 'NEC', 'fli'], capacity: 7, title: '1 Vote', types: ['Vampire'], text: 'x',
                      name_variants: [{ type: 'Lexicographical', name: 'Ankou, The' }], cost: {}, prints: [{ set: { id: 300099 }, occurrences: [{ type: 'Precon', bundle: 'PH', copies: 2 }] }] }, sets);
    const any = toV3({ id: 2, kind: 'Crypt', printed_name: 'Anarch Convert', suffix: '', group: 'Any', types: ['Vampire'], text: '', name_variants: [], cost: {} }, sets);
    const lib = toV3({ id: 3, kind: 'Library', printed_name: 'Burn', suffix: '', types: ['Master'], text: 'y', cost: { type: 'Pool', value: 2 }, clan_requirement: [], path_requirement: ['Caine'], discipline_requirement: { type: 'Mono', disciplines: [] } }, sets);
    const x = toV3({ id: 4, kind: 'Library', printed_name: 'Awe', types: ['Action Modifier'], text: 'z', cost: { type: 'Blood', value: 'X' } }, sets);
    ok(cr.name === 'The Ankou (G5)' && cr._name === 'Ankou, The' && cr.group === '5' && cr.title === '1 vote' && JSON.stringify(cr.disciplines) === '["aus","NEC","flight"]' && cr.clans[0] === 'Nagaraja'
       && cr.sets['Fifth Edition'][0].precon === 'Hecata' && cr.sets['Fifth Edition'][0].copies === 2 && cr.pool_cost === undefined,
       'krcg-v5: a crypt card in the v3 shape -- name with its group, the article-last _name v3 used, group without G, the vote title in v3\u2019s case, fli as flight, the precon from the bundle\u2019s name, a free card no cost');
    ok(any.name === 'Anarch Convert (ANY)' && any.group === 'ANY' && lib.pool_cost === '2' && lib.path === 'Caine' && lib.clans === undefined && lib.disciplines === undefined && x.blood_cost === 'X',
       'krcg-v5: group Any is (ANY); a library card\u2019s Pool cost, Path requirement, no empty lists; an X blood cost');
    const v5c = compile([{ id: 5, kind: 'Library', printed_name: 'Vessel Test', suffix: '', types: ['Master'], text: 'Trifle.\nPut this card on a vampire.', cost: { type: 'Pool', value: 1 }, name_variants: [] }], null).out;
    ok(v5c.lib['Vessel Test'] && JSON.stringify(v5c.lib['Vessel Test'].cost) === '{"pool":1}' && v5c.lib['Vessel Test'].trifle && v5c.lib['Vessel Test'].persistent,
       'v1.9.7: the compiler reads the v5 cost shape directly ({type: \u2018Pool\u2019, value}; v1.9.6 read 996 costs as unknown)');
    ok(fx.lib['Dogs of War'] && fx.lib['Dogs of War'].persistent === true && fx.lib['Crusade: Rome'] && fx.lib['Crusade: Rome'].persistent === true && fx.lib['Crusade: Rome'].req && fx.lib['Crusade: Rome'].req.unmodelled === true,
       'v1.9.7: the v5 wording \u2018this card is put in play / on\u2019 is persistent (Dogs of War, Crusade: Rome), and \u2018Title. Requires a Sabbat vampire.\u2019 is a requirement found mid-line (fails closed)');
    ok(fx.alias['amelia'] === 'Amelia (G2)' && fx.alias['lucian'] === 'Lucian (G1)' && fx.alias['tegyrius'] === 'Tegyrius, Vizier (G2)' && fx.alias['lucinde'] === 'Lucinde, Alastor (G3)' && fx.alias['theo bell (adv)'] === 'Theo Bell (G2 ADV)',
       'v1.9.7: a card\u2019s own printed name is its own (the v5 dump\u2019s vernacular variants \u2018Amelia\u2019, \u2018Lucian\u2019 no longer go to another card); the five v3 spellings the dump left out stay (Tegyrius, Lucinde, Theo Bell (ADV) ...)');
    ok(!!fx.crypt['Julia Sowinski (G6)'] && fx.crypt['Julia Sowinski (G6)'].clan === 'Lasombra' && fx.alias['julia sowinski'] === 'Julia Sowinski (G6)' && !!fx.lib['Information Exchange'] && cards.length >= 4212,
       'the v5 dump\u2019s new cards are compiled (Julia Sowinski (G6), the client\u2019s bare name an alias; Information Exchange: Secrets of New York) -- ' + cards.length + ' cards beside the gate'); }
  { const oot = Object.entries(fx.lib).filter(([n, e]) => e.oot).map(([n]) => n);
    ok(oot.length === 36 && oot.includes('Archon Investigation') && oot.includes('Sudden Reversal') && oot.includes('Contingency Planning') && !oot.includes('Bleeding the Vine') && !oot.includes('Vox Senis'),
       'v1.9.6: `oot` on the 36 out-of-turn masters (a keyword segment: \u2018Out-of-turn.\u2019 / \u2018Master: out-of-turn.\u2019) -- not on a master that only mentions out-of-turn cards (Bleeding the Vine, Vox Senis); curated masters keep it (got ' + oot.length + ')');
    { const R = n => fx.lib[n] ? n : fx.alias[n.toLowerCase()];
      ok(R('An Anarch Manifesto') === 'Anarch Manifesto, An' && !!fx.lib['Anarch Manifesto, An'] && !!fx.lib['The Barrens'] && fx.alias['coven, the'] === 'The Coven',
         'v1.9.6 / v1.9.7 (main\u2019s KRCG v5 reply, 5.2): both spellings of the Manifesto resolve to one entry, keyed as in v3 (krcg-v5.js keeps the v3 key of the one card the dump renamed: the TWD profile keys by it); The Barrens and The Coven were article-first already (got ' + JSON.stringify([R('An Anarch Manifesto'), R('Anarch Manifesto, An')]) + ')'); }
    ok(fx.alias['distraction'] === 'Distraction' && !!fx.lib['Distraction'] && !!fx.lib['Misdirection'],
       'v1.9.7 (the egress review): a card\u2019s own name stays its own even when only ANOTHER card lists it as a variant (\u2018Distraction\u2019 is a card; Misdirection\u2019s v5 variant is \u2018Distraction\u2019) -- got ' + fx.alias['distraction']);
    /* the client's v5 naming (main's reply 5.2): the printed name, the unicity suffix when another printing shares the name. Every card
       in the data must resolve, through the bot's own three-step lookup (exact, lower-case alias, FX_NORM), to ITS entry. */
    { const { FX_NORM } = require(here('elysium-bot.js'));
      const norm = new Map(); for(const k of [...Object.keys(fx.lib), ...Object.keys(fx.crypt)]) if(!norm.has(FX_NORM(k))) norm.set(FX_NORM(k), k);
      const has = k => !!(k && (fx.lib[k] || fx.crypt[k]));
      const look = n => has(n) ? n : has(fx.alias[n.trim().toLowerCase()]) ? fx.alias[n.trim().toLowerCase()] : has(norm.get(FX_NORM(n))) ? norm.get(FX_NORM(n)) : null;
      const cnt = {}; cards.forEach(c => { cnt[c.printed_name] = (cnt[c.printed_name] || 0) + 1; });
      let good = 0; const bad = [];
      for(const c of cards){
        const pn = c.printed_name || c.name, suf = (c.name.slice(pn.length).match(/^ \((.+)\)$/) || [])[1];
        const client = cnt[pn] > 1 && suf ? pn + ' (' + suf + ')' : pn, k = look(client);
        if(k && (k === c.name || FX_NORM(k) === FX_NORM(c.name))) good++; else if(bad.length < 5) bad.push(client + ' -> ' + k + ' (want ' + c.name + ')');
      }
      ok(good === cards.length, 'the client\u2019s v5 names: ' + good + ' of ' + cards.length + ' cards resolve to their own entry ' + (bad.length ? JSON.stringify(bad) : ''));
      const LOGWORDS = ['edge', 'the edge', 'pool', 'blood', 'bleed', 'vote', 'votes', 'ballot', 'hunt', 'block', 'intercept', 'stealth', 'strike', 'dodge', 'press', 'maneuver', 'combat', 'damage', 'torpor', 'rescue', 'diablerie', 'equip', 'recruit', 'employ', 'action', 'referendum', 'prey', 'predator', 'transfer', 'influence', 'discard', 'draw', 'a', 'an', 'the', 'it', 'him', 'her', 'them', 'pass', 'done', 'yes', 'no', 'ready', 'unlock', 'lock', '1 blood', '1 pool', '!'];
      const hit = LOGWORDS.filter(w => fx.alias[w]);
      ok(!hit.length, 'no word of the table\u2019s own vocabulary is a card alias (the v5 dump\u2019s nicknames: the log parser resolves \u2018X plays|burns Y\u2019 through the aliases) -- ' + (hit.length ? JSON.stringify(hit.map(w => w + '\u2192' + fx.alias[w])) : 'none')); }
    const cr = fx.crypt["Abderrahim, Death's Hand (G6)"] || fx.crypt["Abderrahim, Death's Hand"];
    ok(!!cr && cr.path === 'Death and the Soul' && Object.values(fx.crypt).filter(e => e.path).length === 54,
       'v1.9.6: the crypt carries the Path (54 vampires: Sabbat V5\u2019s 48 + 6 of Noites Brasileiras, the v5 dump; Burial Site Hunting Ground feeds a follower of Death and the Soul)'); }
  { const st = fx.lib['Second Tradition: Domain']; const m2 = st && (st.modes || []).find(m => m.when === 'lockedBlock');
    ok(st && st.src === 'hand' && st.req && st.req.title && (st.modes || []).length === 2 && st.modes[0].fx.intercept === 2 && !st.modes[0].when, 'Second Tradition: mode 1 = a free +2 intercept, title required (prince / justicar)');
    ok(m2 && m2.fx.unlock === true && m2.fx.intercept === 2 && m2.fx.payBlood === 1, 'Second Tradition: mode 2 (printed: a LOCKED prince or justicar burns 1 blood to unlock and block with +2 intercept) = when:lockedBlock, unlock + intercept 2 + payBlood 1 -- the auto tier had mode 1 only'); }
  ok(fx.lib['Anarch Troublemaker'].modes[0].phase === 'unlock' && fx.lib['Anarch Troublemaker'].modes[0].fx.preyLock === 2 && fx.lib['Anarch Troublemaker'].modes[0].fx.giveToPrey === true && fx.lib['Anarch Troublemaker'].unique === true, 'Anarch Troublemaker: unlock-phase giveToPrey + preyLock 2, unique');
  ok(fx.lib['Voter Captivation'].modes.every(mo => mo.when === 'refPassed' && mo.fx.bloodPerMargin === 1) && fx.lib['Voter Captivation'].modes[1].fx.marginToPool === 2, 'Voter Captivation: refPassed rider, bloodPerMargin on both modes, marginToPool 2 on [PRE]');
  ok(fx.lib['Visit from the Capuchin'].enterCounters === 4 && fx.lib['Visit from the Capuchin'].modes[0].fx.handSizePerCounter === 1 && fx.lib['Visit from the Capuchin'].modes[0].fx.replaceBurnsCounter === true, 'Visit from the Capuchin: enterCounters 4, handSizePerCounter, replaceBurnsCounter');
}

/* ---- v1.7.0: referendum terms -- the politics leg's first brick (the owner, 18 Sep 2026) ---- */
{
  console.log('\nreferendum terms (ref) -- v1.7.0');
  const L = res.out.lib;
  const pol = Object.keys(L).filter(k => L[k].t.includes('political'));
  ok(pol.length === 178, 'political cards in the db (' + pol.length + '; 177 + Information Exchange, Secrets of New York, since the v5 dump, compiler v1.9.7)');
  ok(pol.every(k => (L[k].modes || []).every(mo => Object.keys(mo.fx).every(x => x === 'actStealth'))), 'STRUCTURAL GATE: no political card carries an outcome key in modes[].fx (actStealth only) -- no play finder can see a referendum outcome as a play effect (bot debt 14)');
  const krc = L['Kine Resources Contested'], ae = L['Ancilla Empowerment'], ps = L['Parity Shift'], cb = L['Consanguineous Boon'];
  ok(!krc.modes && JSON.stringify(krc.ref.pool) === JSON.stringify([{ sign: -1, scope: 'alloc', n: 4, min: 2 }]), 'Kine Resources Contested: alloc 4 among >= 2, no modes');
  ok(krc.ref.fx && krc.ref.fx.poolDmg === 1 && krc.ref.tags.join() === 'poolDmg', 'KRC: the old auto key survives as ref.fx.poolDmg, tag poolDmg');
  ok(JSON.stringify(ae.ref.pool) === JSON.stringify([{ sign: -1, scope: 'each', n: 1, per: 'minion' }]), 'Ancilla Empowerment: each Methuselah -1 per minion');
  ok(JSON.stringify(L['Anarchist Uprising'].ref.pool) === JSON.stringify(ae.ref.pool), 'Anarchist Uprising = Ancilla Empowerment (same text, same terms -- the sweep, not the card)');
  ok(JSON.stringify(ps.ref.pool) === JSON.stringify([{ sign: 0, scope: 'move', n: 3, from: 'richer', min: 1 }]), 'Parity Shift: move 3 from a richer Methuselah');
  ok(ps.ref.tags.join() === 'poolDmg,poolGain', 'Parity Shift carries BOTH tags (the owner: a pool-damage card with an economy side)');
  ok(ps.req.title === true && ps.req.titles.join() === 'prince,justicar' && !ps.req.unmodelled, 'Parity Shift: req.titles = prince, justicar -- verifiable, so not unmodelled');
  ok(cb.ref.tags.join() === 'poolGain' && cb.ref.pool[0].per === 'clanVamp' && cb.ref.pool[0].sign === 1, 'Consanguineous Boon lands in the poolGain tag unasked (each +1 per clanVamp)');
  ok(L['Conservative Agitation'].ref.pool[0].n === 'players', "Conservative Agitation: n = 'players'");
  ok(L["Camarilla's Iron Fist"].ref.pool.length === 2 && L["Camarilla's Iron Fist"].req.unmodelled === true, "Camarilla's Iron Fist: two terms; 'Requires a titled Camarilla vampire' = req.unmodelled (fail closed)");
  ok(L['Reckless Agitation'].req.unmodelled === true && L['Reckless Agitation'].ref.pool[0].others === true, 'Reckless Agitation: others-only alloc, unmodelled requirement');
  const NEG = ['Finding the Path', 'Lily Prelude', 'Screw the Masquerade!', 'Sabbat Threat', 'Neonate Breach', 'Reins of Power', 'Ancient Influence', 'Mark of the Damned', 'War of Ages'];
  ok(NEG.every(k => !(L[k].ref && L[k].ref.pool)), 'NEGATIVES get no ref.pool: split text, discipline modes, conditional extras, ongoing drains, X (a wrong term misleads)');
  ok(L['Screw the Masquerade!'].ref.tags.join() === 'poolDmg' && L['Sabbat Threat'].ref.tags.join() === 'poolDmg', 'tag-only cards keep the poolDmg THREAT tag for readers');
  ok(pol.filter(k => L[k].ref && L[k].ref.pool).length === 15, 'exactly 15 cards carry ref.pool (14 + Information Exchange, the v5 dump; got ' + pol.filter(k => L[k].ref && L[k].ref.pool).length + ')');
  ok(Object.keys(L).filter(k => !L[k].t.includes('political') && L[k].ref).length === 0, 'ref exists on political cards only');
  ok(L['Fourth Tradition: The Accounting'].req.titles.join() === 'prince,justicar', 'req.titles is additive on non-political cards (Fourth Tradition)');
  const { refTerms } = require('./cardfx-compile.js');
  ok(refTerms('Successful referendum means each Methuselah burns 1 pool for each ghoul they control.') === null, 'unknown per-counter -> null (no guess)');
}

/* ---- v1.8.0: the act-again rider + strikeCE (the owner's sweep rule, 18 Sep 2026) ---- */
{
  console.log('\nact-again riders (when) + strikeCE -- v1.8.0');
  const L = res.out.lib;
  const fd = L['Freak Drive'];
  ok(fd.modes.length === 2 && fd.modes[0].when === 'actSuccess' && fd.modes[1].when === 'actBlocked' && fd.cost.blood === 1, 'Freak Drive: [for] actSuccess, [FOR] actBlocked, 1 blood');
  const tagged = Object.keys(L).filter(k => (L[k].modes || []).some(mo => /^act(Success|Blocked|Failed)$/.test(mo.when || '') && !mo.fx.cloak)).sort();   // v0.6.234 (V5 wave 6b): the after-success cloak (Shadow Cloak, Sleep Unseen) is the window's second class -- not an act-again rider
  ok(tagged.join('|') === 'Domain of Evernight|Forced March|Freak Drive|Instantaneous Transformation|Truth of a Thousand Lies|Zephyr', 'exactly six cards carry an act-again rider (' + tagged.length + ')');
  ok(tagged.every(k => L[k].t.includes('mod') && L[k].modes.filter(mo => mo.when).every(mo => mo.fx.unlock === true)), 'all are action modifiers and the rider only sits on an unlocking mode');
  { const ck = Object.keys(L).filter(k => (L[k].modes || []).some(mo => /^act(Success|Blocked|Failed)$/.test(mo.when || '') && mo.fx.cloak)).sort();
    ok(ck.join('|') === 'Shadow Cloak|Sleep Unseen' && ck.every(k => L[k].t.includes('mod') && L[k].modes.filter(mo => mo.when).every(mo => mo.when === 'actSuccess' && !mo.fx.unlock)),
       'the after-success cloak: Shadow Cloak and Sleep Unseen only, actSuccess, no unlock (got ' + ck.join('|') + ')'); }
  ok(L['Zephyr'].modes.find(mo => mo.at === 'CEL').when === 'actFailed' && !L['Zephyr'].modes.find(mo => mo.at === 'cel').when, 'Zephyr: [CEL] actFailed; [cel] unlocks at the END of the turn -- no rider');
  const NEG = ['Gift of Bellona', "Hag's Wrinkles", 'Shroud Mastery', 'CrimethInc.', 'Dusk Work', "Tangle Atropos' Hand", 'Shell Game', 'As the Crow'];
  ok(NEG.every(k => !(L[k].modes || []).some(mo => /^act/.test(mo.when || ''))), 'NEGATIVES get no rider: tied to the KIND of action, to another minion, to a payment, or not discipline-segmented');
  ok(L['Forced March'].oncePerTurn === true && L['Instantaneous Transformation'].oncePerTurn === true && !fd.oncePerTurn, 'oncePerTurn from "can play only one ... each turn" (Forced March yes, Freak Drive no)');
  const mj = L['Majesty'];
  ok(mj.modes.every(mo => mo.fx.strikeCE === true && mo.fx.combatEnds === true) && mj.modes.find(mo => mo.at === 'PRE').fx.unlock === true && !mj.modes.find(mo => mo.at === 'pre').fx.unlock, 'Majesty: strikeCE on both modes, unlock on [PRE] only');
  const nCE = Object.keys(L).filter(k => (L[k].modes || []).some(mo => mo.fx.strikeCE)).length, nAll = Object.keys(L).filter(k => (L[k].modes || []).some(mo => mo.fx.combatEnds)).length;
  ok(nCE === 40 && nAll === 59, 'strikeCE is the PLAYABLE subset of combatEnds: ' + nCE + ' of ' + nAll + ' (45 of 64 until compiler v1.11.0: the four cards that print \u2018cannot strike: combat ends\u2019 -- Hunter\u2019s Mark, Sanguine Entrapment, Mind of the Wilds, Dog Pack -- are a ban on the opponent, ceBan, never the player\u2019s own strike; and Night Terrors\u2019 [OBF][PRE] is a strike its block grants, its curated ceGrant)');
}

/* ---- v1.9.0: the block bar + self damage sweep (the owner's sweep rule, 18 Sep 2026 late) ---- */
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

{
  /* v1.9.3 (19 Oct 2026, bot v0.6.211, the stable's cards): the curated Pentex was keyed by its old spelling Pentex(TM) Subversion;
     the printed name kept the EMPTY auto entry, so a list typed Pentex\u2122 Subversion (KRCG's precons, the V5 generator) paid 2 pool for
     nothing. A curated key that is a known variant of a printed name is now written under the printed name too. */
  console.log('\na curated entry keyed by a printed variant reaches the printed name (v1.9.3, Pentex\u2122 Subversion)');
  const L = res.out.lib, pt = L['Pentex\u2122 Subversion'], pv = L['Pentex(TM) Subversion'];
  ok(pt && pt.src === 'hand' && pt.modes.length === 1 && pt.modes[0].fx.noBlockMinion === true && pt.cost && pt.cost.pool === 2 && pt.unique === true,
     'Pentex\u2122 Subversion (the printed name) carries the curated entry: noBlockMinion, 2 pool, unique (was the auto tier\u2019s empty fx)');
  ok(pv && JSON.stringify(pv) === JSON.stringify(pt), 'Pentex(TM) Subversion (the variant key) is still there and identical -- a list typed the old way resolves exactly to itself');
  ok(!(res.curNew || []).includes('Pentex(TM) Subversion') && (res.curVariant || []).some(x => /^Pentex\(TM\) Subversion -> Pentex\u2122 Subversion$/.test(x)),
     'the report: no longer "NOT in vtes.json", listed as a variant written under the printed name (' + JSON.stringify(res.curVariant) + ')');
  ok((res.curVariant || []).length === 1, 'one curated key is a variant today (' + (res.curVariant || []).length + ')');
}

{
  /* V5 wave 1 (29 Oct 2026, RULINGS D-98): Villein, the extra strikes and the aggravated strikes, each reading checked against the
     printed text in vtes.json (the curated notes quote it). What the auto tier had wrong is pinned here so a recompile cannot bring it back. */
  console.log('\nV5 wave 1 -- Villein, the extra strikes, the aggravated strikes (curated, 29 Oct 2026)');
  const L = res.out.lib, M = (n, at) => ((L[n] && L[n].modes) || []).find(mo => (mo.at || null) === at) || null;
  const vi = L['Villein'], vm = vi && vi.modes && vi.modes[0];
  ok(vi && vi.src === 'hand' && vi.trifle === true && vi.persistent === true && vm && vm.fx.poolFromHost === 5 && vm.fx.poolFromHostMin === 2 && vm.fx.hostCopyCost === 1 && !vi.cost,
     'Villein: a trifle on a vampire of mine, 2 to 5 blood to my pool, +1 pool for each Villein already on that vampire, free otherwise (the auto tier had no mode)');
  ok(L['Quickness'].oncePerRound === true && M('Quickness', 'cel').fx.addStrike === 1 && M('Quickness', 'cel').fx.addStrikeLimited === true && M('Quickness', 'CEL').fx.addStrike === 1 && !M('Quickness', 'CEL').fx.addStrikeLimited && !L['Quickness'].limited,
     'Quickness: [cel] limited, [CEL] not counted against the limit, one Quickness each round (the auto tier wrote `limited` over both)');
  ok(M('Pursuit', 'cel').fx.maneuver === true && !M('Pursuit', 'cel').fx.addStrike && M('Pursuit', 'CEL').fx.addStrike === 1 && M('Pursuit', 'CEL').fx.addStrikeLimited === true,
     'Pursuit: [cel] maneuver, [CEL] a limited additional strike');
  ok(M('Arms of Ahriman', 'obl').fx.addStrike === 1 && !M('Arms of Ahriman', 'obl').fx.dodge && M('Arms of Ahriman', 'OBL').fx.dodge === true && M('Arms of Ahriman', 'OBL').fx.addStrike === 1 && M('Arms of Ahriman', 'OBL').fx.addStrikeLimited === true,
     'Arms of Ahriman: [obl] a limited additional strike, [OBL] a dodge with one');
  ok(M('Claws of the Dead', 'pro').fx.aggrHands === 'round' && M('Claws of the Dead', 'pro').fx.handStrike === undefined && M('Claws of the Dead', 'PRO').fx.maneuver === true && L['Claws of the Dead'].cost.blood === 1,
     'Claws of the Dead: [pro] makes the hand strikes aggravated this round (not a hand strike card), [PRO] maneuver, 1 blood');
  ok(M('Sculpt the Flesh', 'pro').fx.aggr === true && M('Sculpt the Flesh', 'pro').fx.handBonus === 0 && M('Sculpt the Flesh', 'PRO').fx.handBonus === 1 && M('Sculpt the Flesh', 'PRO').fx.stealth === undefined && JSON.stringify(L['Sculpt the Flesh'].req.clan) === '["Tzimisce"]',
     'Sculpt the Flesh: [pro] an aggravated hand strike, [PRO] a hand strike at +1 -- its "+1 stealth action" is the burn action, not stealth; requires Tzimisce');
  ok(L['Wall of Filth'].req.beforeRangeDetermined === true && L['Wall of Filth'].oncePerVampire === true && ['pro', 'tha'].every(a => M('Wall of Filth', a).fx.burnPrevent === 2 && M('Wall of Filth', a).fx.burnPreventNonAggr === true && !M('Wall of Filth', a).fx.aggr)
     && ['PRO', 'THA'].every(a => M('Wall of Filth', a).fx.burnPrevent === 2 && !M('Wall of Filth', a).fx.burnPreventNonAggr && !M('Wall of Filth', a).fx.aggr && M('Wall of Filth', a).fx.prevent === undefined),
     'Wall of Filth: a stored prevention (2 non-aggravated; superior 2 of any kind), before range, one per vampire -- no `aggr` (the "non-aggravated" ghost tag) and no hand `prevent`');
  ok(M("Rutor's Hand", 'tha').dominated && M("Rutor's Hand", 'tha').fx.lockToUnlock === true && M("Rutor's Hand", 'THA').fx.selfAggrImmuneBlood === 3 && M("Rutor's Hand", 'THA').fx.selfDmg === 1 && !M("Rutor's Hand", 'THA').fx.aggr && M("Rutor's Hand", 'tha').fx.actStealth === 1 && M("Rutor's Hand", 'THA').fx.actStealth === 1 && !M("Rutor's Hand", null),
     "Rutor's Hand: [tha] dominated (a self-torpor), [THA] 3 blood buys immunity, both lock the card to unlock and carry the printed +1 stealth (no mode without a discipline); its aggravated damage is its own price");
  ok(M('Sword of the Archangel', null).fx.strBonus === 1 && M('Sword of the Archangel', null).fx.aggr === true && L['Sword of the Archangel'].cost.pool === 2 && JSON.stringify(L['Sword of the Archangel'].req.clan) === '["Salubri"]',
     'Sword of the Archangel: a strike at strength+1, aggravated, 2 pool, requires Salubri (the auto tier had no damage)');
  ok(M('Invigorate', 'ani').fx.strengthAction === 1 && M('Invigorate', 'dom').fx.blockBar === 'allies' && M('Invigorate', 'pro').fx.aggrHands === 'action' && L['Invigorate'].req.sect === 'Anarch',
     'Invigorate: [ani] +1 strength this action (the auto tier missed it), [dom] no ally blocks, [pro] aggravated hand strikes this action; requires an Anarch');
  const ib = M('Ivory Bow', null);
  ok(L['Ivory Bow'].src === 'auto' && ib.fx.strike === 1 && ib.fx.ranged === true && ib.fx.aggr === true, 'Ivory Bow: the auto tier is right (1R aggravated), not curated');
}
{
  /* V5 wave 2 (29 Oct 2026, RULINGS D-102): the combat's first steps -- before range, range and press. Each reading checked against the printed
     text in vtes.json (the curated notes quote it); what the auto tier had wrong is pinned so a recompile cannot bring it back. */
  console.log('\nV5 wave 2 -- the combat\u2019s first steps: before range, range and press (curated, 29 Oct 2026)');
  const L = res.out.lib, Ms = (n, at) => ((L[n] && L[n].modes) || []).filter(mo => (mo.at || null) === at), M = (n, at) => Ms(n, at)[0] || null;
  const fl = Ms('Flash', 'cel');
  ok(fl.length === 2 && fl.some(m => m.fx.maneuver === true && !m.fx.press) && fl.some(m => m.fx.press === true && !m.fx.maneuver) && M('Flash', 'CEL').fx.maneuver === true && M('Flash', 'CEL').fx.pressOpt === 'round' && !M('Flash', 'CEL').fx.press && !L['Flash'].cost,
     'Flash: [cel] a maneuver OR a press (two modes; the auto tier bundled both into each), [CEL] a maneuver with an optional press this round, free');
  const rg = Ms("Resist Earth's Grasp", 'cel');
  ok(rg.length === 2 && rg.some(m => m.fx.press === true && !m.fx.maneuver) && rg.some(m => m.fx.maneuver === true && m.fx.pressOpt === 'round' && !m.fx.press) && M("Resist Earth's Grasp", 'CEL').fx.stealth === 1 && L["Resist Earth's Grasp"].cost.blood === 1 && L["Resist Earth's Grasp"].t.join() === 'mod,combat',
     "Resist Earth's Grasp: [cel] a press, or a maneuver with an optional press this round; [CEL] +1 stealth (the action modifier); 1 blood");
  ok(M('Slam', 'pot').fx.handBonus === 2 && M('Slam', 'pot').fx.handStrike === true && !M('Slam', 'pot').fx.maneuver && M('Slam', 'POT').fx.maneuver === true && M('Slam', 'POT').fx.maneuverTo === 'close' && M('Slam', 'POT').fx.handBonus === 2 && L['Slam'].cost.blood === 1,
     'Slam: [pot] a hand strike at +2; [POT] the same with an optional maneuver, only to close range (the card commits its strike [LSJ 20021028]); 1 blood');
  ok(L['Hunger of Marduk'].req.beforeRangeDetermined === true && JSON.stringify(L['Hunger of Marduk'].req.clan) === '["Banu Haqim"]' && M('Hunger of Marduk', 'tha').fx.stealGrant === 1 && M('Hunger of Marduk', 'THA').fx.stealGrant === 2 && M('Hunger of Marduk', 'THA').fx.ranged === true && M('Hunger of Marduk', 'tha').fx.stealBlood === undefined,
     'Hunger of Marduk: before range, a RANGED steal this round -- 1, superior 2 (the auto tier read 1 at both and a strike card played in the strike step); requires a Banu Haqim');
  ok(L['Rage of Apedemak'].oncePerCombat === true && L['Rage of Apedemak'].req.beforeRangeDetermined === true && ['ani', 'pot'].every(a => M('Rage of Apedemak', a).fx.handBonusCombat === 1 && !M('Rage of Apedemak', a).fx.handStrike) && ['ANI', 'POT'].every(a => M('Rage of Apedemak', a).fx.handBonusCombat === 2),
     'Rage of Apedemak: before range, the hand strikes deal +1 ([ANI]/[POT] +2) this combat, one each combat -- not a hand-strike card (the auto tier read handStrike)');
  ok(L['Torn Signpost'].req.beforeRangeDetermined === true && M('Torn Signpost', 'pot').fx.strengthSet === 2 && M('Torn Signpost', 'POT').fx.strengthSet === 3,
     'Torn Signpost: before range, the base strength is 2 ([POT] 3) this combat (the auto tier had no mode; +X strength adds to it [LSJ 20100813])');
  ok(L['Form of the Wolf'].oncePerCombat === true && M('Form of the Wolf', 'pro').fx.strengthCombat === 1 && !M('Form of the Wolf', 'pro').fx.pressOpt && M('Form of the Wolf', 'PRO').fx.strengthCombat === 1 && M('Form of the Wolf', 'PRO').fx.pressOpt === 'round',
     'Form of the Wolf: before range, +1 strength this combat (the auto tier had only the press); [PRO] an optional press this round [TOM 19960521]; one each combat');
  ok(L['Monstrous Form'].oncePerRound === true && M('Monstrous Form', 'dom+pro').fx.strengthCombat === 1 && M('Monstrous Form', 'DOM+PRO').fx.actStealth === 1 && !M('Monstrous Form', 'DOM+PRO').fx.maneuver,
     'Monstrous Form: [dom][pro] before range, +1 strength this combat, one each round; [DOM][PRO] its +1 stealth action (the card on the vampire: not modelled, amber)');
  ok(M('Soul Burn', 'tha').fx.strike === 1 && M('Soul Burn', 'THA').fx.strike === 2 && M('Soul Burn', 'THA').fx.ranged === true && L['Soul Burn'].cost.blood === 1,
     'Soul Burn: [tha] 1R, [THA] 2R (the auto tier read 1R at both); 1 blood');
  ok(M('Soul Burn', 'tha').fx.noPreventDisc === 'for' && M('Soul Burn', 'THA').fx.noPreventDisc === 'for',
     'Soul Burn: its damage cannot be prevented by cards requiring Fortitude [LSJ 20050628] -- noPreventDisc \'for\' on both modes (the graded readings, 29 Oct: a struck bot played Hidden Strength against it)');
  ok(['Walk of Flame', 'Eruption of Vitae', 'Growing Fury', 'Well-Aimed Car'].every(n => L[n] && L[n].req && L[n].req.notFirstRound === true),
     'v1.9.5: "Not usable the first round" / "Not usable first round" are the first-round restriction too (Eruption of Vitae, Growing Fury, Well-Aimed Car; Walk of Flame since v1.9.4)');
}

{
  /* V5 wave 5a (17 Nov 2026, bot v0.6.230, RULINGS D-119 / D-120): the masters that stay in play. Each reading checked against the printed
     text in vtes.json (the curated notes quote it); each entry names its card-worth handler (`worth`) or its look-ahead handler, and what
     the auto tier read wrong is pinned so a recompile cannot bring it back. */
  console.log('\nV5 wave 5a -- the masters that stay in play and the card-worth handlers (curated, 17 Nov 2026)');
  const L = res.out.lib, F = n => Object.assign({}, ...((L[n] && L[n].modes) || []).map(mo => mo.fx || {})), cur = n => L[n] && L[n].src === 'hand';
  const W = { 'Tension in the Ranks': 'tension', 'Anarch Revolt': 'anarch-revolt', 'Forward Momentum': 'forward-momentum', 'Privileged Position': 'privileged-position',
              'Mob Connections': 'mob', 'Garibaldi-Meucci Museum': 'garibaldi', 'Powerbase: Los Angeles': 'powerbase-la', "Carver's Meat Packing and Storage": 'carvers',
              'The Rack': 'rack', 'The Hungry Coyote': 'coyote', 'The Coven': 'coven', 'Cursed Abattoir': 'abattoir', 'Smiling Jack, The Anarch': 'jack' };
  const bad = Object.keys(W).filter(n => !cur(n) || L[n].worth !== W[n] || !L[n].persistent);
  ok(!bad.length, 'the thirteen cards that price themselves name their worth handler (twelve of the wave and Smiling Jack), curated and persistent' + (bad.length ? ' -- wrong: ' + bad.join(', ') : ''));
  ok(cur('Frontal Assault') && !L['Frontal Assault'].worth && F('Frontal Assault').frontalRush === true && F('Frontal Assault').poolGain === undefined && !(L['Frontal Assault'].modes || []).some(m => m.dir),
     'Frontal Assault: the granted rush (fx.frontalRush, priced by its look ahead, D-58) -- not the auto tier’s directed +1 pool');
  ok(L['Piper'].handler === 'piper' && L['Piper'].req.sect === 'Anarch' && F('Piper').piperRecruit === true && L['Piper'].anarchReq === true,
     'Piper: the look-ahead handler, requires a ready Anarch (req.sect; the auto tier had no requirement) and is itself a card requiring an Anarch (anarchReq)');
  ok(L['Día de los Muertos'].handler === 'dia' && L['Día de los Muertos'].oncePerGame === true && F('Día de los Muertos').autoPassRef === true && L['Día de los Muertos'].cost.pool === 1,
     'Día de los Muertos: one per game, the referendum passes automatically (fx.autoPassRef), 1 pool inherited from the data');
  ok(F('Tension in the Ranks').lostMinionTax === 1 && L['Tension in the Ranks'].unique === true && F('Anarch Revolt').noAnarchTax === 1 && F('Anarch Revolt').burnByRef === true && F('Anarch Revolt').stealth === undefined && !L['Anarch Revolt'].unique,
     'Tension in the Ranks (unique): 1 pool a lost ready minion; Anarch Revolt (not unique): 1 pool without a ready Anarch, the burn referendum -- not the auto tier’s +1 stealth');
  ok(F('Forward Momentum').bleedCounter === 1 && F('Forward Momentum').counterUnlock === 2 && F('Forward Momentum').unlock === undefined,
     'Forward Momentum: a counter a landed bleed, 2 counters unlock a Cathari (the auto tier read a bare unlock)');
  ok(L['Privileged Position'].req.path === 'Power and the Inner Voice' && L['Privileged Position'].req.pathN === 2 && F('Privileged Position').refPassPreyBurn === 1 && F('Privileged Position').poolDmg === undefined && (L['Privileged Position'].modes || []).some(m => m.lock),
     'Privileged Position: requires 2 ready vampires on the Path of Power and the Inner Voice; lock after a passed referendum, the prey burns 1 -- not an immediate poolDmg');
  const mob = (L['Mob Connections'].modes || []);
  ok(mob.some(m => m.lock && m.fx.pressContinue === 1 && !m.dir) && mob.some(m => m.dir && m.fx.burnCardAction === true) && F('Mob Connections').press === undefined,
     'Mob Connections: lock for a press only to continue (not the auto tier’s directed press); minions burn it as a (D) action');
  ok(F('Garibaldi-Meucci Museum').ashSwapAnarch === 1 && F('Garibaldi-Meucci Museum').endCombatAnarch === true && (L['Garibaldi-Meucci Museum'].modes || []).every(m => m.lock),
     'Garibaldi-Meucci Museum: both effects lock it -- the ash swap for an Anarch card and the end of a combat between Anarchs (the auto tier had an empty lock mode)');
  ok(F('Powerbase: Los Angeles').discardBonus === 1 && (L['Powerbase: Los Angeles'].modes || []).some(m => m.dir && m.fx.stealCardAction === true && m.fx.stealBy === 'Anarch') && F('Powerbase: Los Angeles').unlock === undefined,
     'Powerbase: Los Angeles: +1 discard phase action; Anarchs of other Methuselahs steal it as a (D) action');
  ok(F("Carver's Meat Packing and Storage").hostageCap === 3 && F("Carver's Meat Packing and Storage").hostageBlood === true && F("Carver's Meat Packing and Storage").bloodAdd === undefined && L["Carver's Meat Packing and Storage"].cost.pool === 1,
     'Carver’s Meat Packing and Storage: the hostages (capacity 3 or less) and the X-blood lock -- not the auto tier’s torpor and bloodAdd X; 1 pool inherited');
  const rk = L['The Rack'];
  ok(F('The Rack').rackBlood === 2 && (rk.modes || []).some(m => m.dir && m.fx.stealCardAction === true && m.fx.stealBy === 'vampire') && rk.memo && rk.memo.human === false && rk.memo.roles[0].field === 'rackVamp',
     'The Rack: 2 blood a turn to the chosen vampire, the choice as memo tokens (mine only: human:false), stolen as a (D) action by another Methuselah’s vampire');
  ok(F('The Hungry Coyote').huntBonusSabbat === 1 && L['The Hungry Coyote'].cost.pool === 2, 'The Hungry Coyote: +1 hunt for my Sabbat (the auto tier had no mode); 2 pool inherited');
  ok(F('The Coven').covenPass === true && F('The Coven').covenBlood === 2 && F('The Coven').bloodAdd === undefined && L['The Coven'].trifle === true,
     'The Coven: its 2 blood is fx.covenBlood (not bloodAdd: the older lock-income finder stays off it), it passes to my predator, a trifle');
  ok(F('Cursed Abattoir').zombieCounter === 1 && F('Cursed Abattoir').zombieBleed === 1 && F('Cursed Abattoir').bleed === undefined,
     'Cursed Abattoir: a counter a burned zombie, +1 bleed for a zombie ally (unread: the bot’s allies do not act) -- not the auto tier’s +1 bleed');
  ok(L['Firebrand'].anarchReq === true && L['Patsy'].anarchReq === true && L['Fee Stake: Seattle'].anarchReq === true && !L['Anarch Railroad'].anarchReq && !L['Anarch Troublemaker'].anarchReq,
     'the anarchReq marker (v1.9.9): ‘Requires an Anarch’, ‘a ready Anarch’ and ‘a baron’ (Firebrand, Patsy, Fee Stake: Seattle) -- not a card that only names Anarchs (Anarch Railroad, Anarch Troublemaker)');
  const anN = Object.keys(L).filter(n => L[n].anarchReq).length, zN = Object.keys(L).filter(n => L[n].zombie).length;
  ok(anN === 86 && zN === 8 && L['Zombie'].zombie === true && L['Rotting Behemoth'].zombie === true && !L['Underbridge Stray'].zombie,
     'the markers’ volume: 86 cards requiring an Anarch or a baron, 8 zombie allies or retainers (got ' + anN + ' and ' + zN + ')');

  /* V5 wave 5b (18 Nov 2026, bot v0.6.232, RULINGS D-122, spec-v5-wave5 §12): the 'as played' window's cards and the frenzy tag. Each
     reading checked against the printed text in vtes.json; what the auto tier read wrong or not at all is pinned. */
  console.log('\nV5 wave 5b -- Sudden Reversal, Meditative Grove, Yawp Court, Week of Nightmares and the frenzy tag (18 Nov 2026)');
  const sr = L['Sudden Reversal'], yc = L['Yawp Court'], wn = L['Week of Nightmares'], mg = L['Meditative Grove'], ds = L['Deep Song'];
  ok(cur('Sudden Reversal') && sr.oot === true && F('Sudden Reversal').cancelMaster === true && !sr.persistent && !sr.worth,
     'Sudden Reversal: an out-of-turn master that cancels a master as it is played (fx.cancelMaster), not persistent, no worth handler (its decision is _srFor)');
  ok(cur('Yawp Court') && yc.persistent && yc.unique && yc.req && yc.req.sect === 'Sabbat' && (yc.modes || []).some(m => m.lock && m.fx.yawpCombat === true),
     'Yawp Court: a unique location, a ready Sabbat to play it (req.sect), its lock puts a Sabbat into combat with the acting vampire (fx.yawpCombat)');
  ok(cur('Week of Nightmares') && wn.worth === 'won' && wn.persistent && wn.oncePerGame && wn.req && (wn.req.clan || []).includes('Ravnos')
     && F('Week of Nightmares').wonCounters === 10 && F('Week of Nightmares').wonBleed === 1 && F('Week of Nightmares').wonStrength === 1 && F('Week of Nightmares').wonStealHunt === 1
     && F('Week of Nightmares').bleed === undefined && F('Week of Nightmares').stealth === undefined && F('Week of Nightmares').stealBlood === undefined,
     'Week of Nightmares: 10 counters, +1 bleed and +1 strength for every Ravnos, the steal-hunt; its worth handler won -- no auto +1 bleed, stealth or stolen blood');
  ok(cur('Meditative Grove') && (mg.modes || []).some(m => m.lock && m.fx.cancelFrenzy === 'Salubri') && (mg.modes || []).some(m => !m.lock && m.fx.bloodAdd === 1 && (m.fx.bloodAddClan || []).includes('Salubri')),
     'Meditative Grove: its lock cancels a frenzy card on my Salubri (fx.cancelFrenzy), its hunting-ground blood intact');
  ok(cur('Deep Song') && (ds.modes || []).some(m => m.at === 'ANI' && m.frenzy === 'opp' && m.fx.rush === true) && !(ds.modes || []).some(m => m.at === 'ani' && m.frenzy),
     'Deep Song: its [ANI] rush is a frenzy card played on its target (mode frenzy opp, [LSJ 20051113]); its [ani] bleed is no frenzy card');
  const FO = ["Dam the Heart's River", 'Terror Frenzy', 'Drawing Out the Beast', 'Scourge of Alecto', 'Frenzy', 'Rötschreck', 'Bloodlust', 'Enrage', 'Brujah Frenzy', 'Battle Frenzy'];
  const frBad = FO.filter(n => !L[n] || L[n].frenzy !== 'opp').concat(['Rage of Apedemak'].filter(n => !L[n] || L[n].frenzy !== 'self'));
  ok(!frBad.length, 'the entry-level frenzy tag (v1.9.10): opp on the ten that can be played on another minion (Battle Frenzy: \u2018Choose an Osebo in combat\u2019, any Osebo -- the graded readings), self on Rage of Apedemak (curated: the tag survives)' + (frBad.length ? ' -- wrong: ' + frBad.join(', ') : ''));
  const wu = L['Whistling Up the Beast'], dh = L['Devil-Channel: Hands'], dbk = L['Devil-Channel: Back'];
  ok(!wu.frenzy && (wu.modes || []).length === 2 && wu.modes.every(m => m.frenzy === 'opp') && dh.modes.every(m => m.frenzy === 'self') && dbk.modes.every(m => m.frenzy === 'self')
     && wu.modes[0].at === 'abo' && JSON.stringify(wu.modes[0].fx) === '{}' && JSON.stringify(wu.modes[1].fx) === '{"maneuver":true}',
     'the mode-level frenzy tag (v1.9.10): Whistling Up the Beast’s [abo] and its [ABO] ‘As above’ are opp (the opposing vampire), the two Devil-Channels self -- no entry-level tag (compiler v1.11.1: [abo] is a mode with no fx that carries its tag -- \u2018the opposing vampire cannot use maneuvers ... and cannot use presses\u2019 was read as the player\u2019s own maneuver and press; [ABO] keeps its own \u2018optional maneuver this round\u2019)');
  const frN = Object.keys(L).filter(n => L[n].frenzy).length, frM = Object.keys(L).filter(n => !L[n].frenzy && (L[n].modes || []).some(m => m.frenzy)).length;
  ok(frN === 11 && frM === 4, 'the frenzy tags’ volume: 11 entries, 4 more by a mode (got ' + frN + ' and ' + frM + ')');
}
{
  /* V5 wave 6a (18 Nov 2026, bot v0.6.233, RULINGS D-123, spec-v5-wave6): the cards with a discipline line and no mode, the block side.
     Each reading checked against the printed text in vtes.json; what the auto tier read wrong or not at all is pinned. */
  console.log('\nV5 wave 6a -- the directed condition, the locked route, Night Terrors, True Love\u2019s Face, Forced Confessional (18 Nov 2026)');
  const L = res.out.lib, M = (n, at) => ((L[n] && L[n].modes) || []).find(mo => (mo.at || null) === at) || { fx: {}, missing: true }, cur = n => L[n] && L[n].src === 'hand';   // a missing mode reads as an empty one: the old bytes fail clean
  // the directed condition: on the mode its line prefixes, on the entry for a header; never on an action (Marked Territory's is a later ability)
  ok(M('Eyes of Argus', 'aus').onlyDirected === true && !M('Eyes of Argus', 'AUS').onlyDirected && !L['Eyes of Argus'].onlyDirected
     && L['The Warrens'].onlyDirected === true && L['One With the Land'].onlyDirected === true && L['Scry the Hearthstone'].onlyDirected === true
     && M('Deep Ecology', 'ani').onlyDirected === true && !M('Deep Ecology', 'for').onlyDirected && !M('Deep Ecology', 'pro').onlyDirected
     && M('Steadfastness', 'for').onlyDirected === true && !M('Steadfastness', 'FOR').onlyDirected && M('Forced Vigilance', 'FOR').onlyDirected === true && !M('Forced Vigilance', 'for').onlyDirected
     && L['Destilaria Estrela da Paraíba'].onlyDirected === true && L['Member of the Entourage'].onlyDirected === true && !L['Marked Territory'].onlyDirected,
     'onlyDirected (v1.9.11): Eyes of Argus [aus], Deep Ecology [ani], Steadfastness [for], Forced Vigilance [FOR] by their lines; The Warrens, One With the Land, Scry the Hearthstone, Destilaria, Member of the Entourage by the header; not Marked Territory (an action)');
  const odN = Object.keys(L).filter(n => L[n].onlyDirected || (L[n].modes || []).some(m => m.onlyDirected)).length;
  ok(odN === 10 && cur('Underbridge Stray') && M('Underbridge Stray', 'ani').fx.allyBurnUnlock === 'directed' && M('Underbridge Stray', 'ANI').fx.allyBurnUnlock === 'directed' && !M('Underbridge Stray', 'ani').onlyDirected,
     'onlyDirected\u2019s volume: 10 auto entries -- the 12 cards with the sentence less Marked Territory (an action) and the curated Stray (got ' + odN + '); the Stray carries its own -- on the burn (allyBurnUnlock directed), not on its recruit');
  // the capacity requirement as its own sentence; a discipline line's stays that mode's (not read)
  ok(L['Sense the Savage Way'].req.capMin === 7 && L['Approximation of Loyalty'].req.capMin === 7 && L['Momentary Delay'].req.capMin === 7 && L['Dark Mirror of the Mind'].req.capMin === 8 && L['Enkil Cog'].req.capMin === 10
     && !(L["Hall of Hades' Court"].req || {}).capMin && !(L['The Missing Voice'].req || {}).capMin,
     'req.capMin (v1.9.11): the five cards whose own sentence is \u2018Requires a vampire with capacity N or more\u2019; Hall of Hades\u2019 Court [dom] and The Missing Voice [cel] keep theirs on the line (not read)');
  // the locked route as a sweep: the clean line and its one rider; any other sentence, or another condition in the header, no route mode
  const LB = (n, at) => { const m = M(n, at); return m && m.when === 'lockedBlock' && m.fx.unlock === true ? Object.keys(m.fx).filter(k => k !== 'unlock').sort().map(k => k + '=' + m.fx[k]).join(',') || 'route' : null; };
  const lb = { sense: LB('Sense the Savage Way', 'ANI'), sentA: LB('Sentry Signal', 'ani'), sentT: LB('Sentry Signal', 'tha'), owl: LB('One With the Land', 'PRO'), deep: LB('Deep Ecology', 'pro'),
               blackQ: LB('Black Sunrise', 'qui'), blackQQ: LB('Black Sunrise', 'QUI'), elude: LB('Eluding the Arms of Morpheus', null),
               dogged: LB('Dogged Pursuit', 'ani'), spirits: LB('Speak with Spirits', 'SPI'), winds: LB('Read the Winds', 'ANI+AUS'), mole: LB('The Mole', 'ani') };
  ok(lb.sense === 'route' && lb.sentA === 'route' && lb.sentT === 'route' && lb.owl === 'noStrikeFirstRound=true' && lb.deep === 'payBlood=1' && lb.blackQ === 'route' && lb.blackQQ === 'route' && lb.elude === 'route'
     && lb.dogged === null && lb.spirits === null && lb.winds === null && lb.mole === null && M('Black Sunrise', 'qui').onlyDirected === true && L['Sentry Signal'].cost.blood === 1
     && M('Sense the Savage Way', 'ani').fx.intercept === 1 && M('One With the Land', 'pro').fx.intercept === 2 && M('Sentry Signal', 'ANI').fx.reduce === 3,
     'the locked route (v1.9.11): Sense the Savage Way [ANI], Sentry Signal [ani]/[tha], One With the Land [PRO] (+ no strikes in the first round), Deep Ecology [pro] (burn 1 blood), Black Sunrise, Eluding the Arms of Morpheus; none for Dogged Pursuit, Speak with Spirits, Read the Winds, The Mole (got ' + JSON.stringify(lb) + ')');
  // Night Terrors and its class
  ok(M('Night Terrors', 'obf+pre').fx.stealthToZero === true && M('Night Terrors', 'OBF+PRE').fx.stealthToZero === true && M('Veiled Sight', 'chi').fx.stealthToZero === true && M('Draba', 'CHI').fx.stealthToZero === true && !M('Draba', 'chi').fx.stealthToZero
     && L['Night Terrors'].cost.blood === 1 && (L['Night Terrors'].req.clan || []).includes('Ravnos'),
     'stealthToZero (v1.9.11): Night Terrors (both modes: the superior\u2019s \u2018As above\u2019), Veiled Sight [chi], Draba [CHI] -- not Draba\u2019s [chi] (the attached minion, a burn); Night Terrors costs 1 blood and requires Ravnos');
  // the curated three
  ok(cur("True Love's Face") && M("True Love's Face", 'obf+pre').fx.bleed === 1 && L["True Love's Face"].limited === true && M("True Love's Face", 'OBF+PRE').fx.cancelBlock === true && M("True Love's Face", 'OBF+PRE').fx.cancelBlockPay === 1
     && JSON.stringify(L["True Love's Face"].req.disc) === '["obf","pre"]',
     'True Love\u2019s Face: [obf][pre] +1 bleed (limited), [OBF][PRE] the block-cancel its blocker\u2019s controller may cancel for 1 pool (fx.cancelBlockPay); the disciplines inherited');
  ok(cur('Forced Confessional') && JSON.stringify(M('Forced Confessional', 'dom').fx.icpVs) === '{"n":-1,"who":["this"]}' && M('Forced Confessional', 'DOM').fx.cancelBlock === true,
     'Forced Confessional: [dom] -1 intercept for the blocking minion (icpVs who this), [DOM] the block-cancel');
  ok(cur('Hunting the Quarry') && !(L['Hunting the Quarry'].modes || []).length && JSON.stringify(L['Hunting the Quarry'].req.disc) === '["cel","tha"]',
     'Hunting the Quarry: no modes until the grants round -- the auto tier\u2019s +1 stealth on [cel]/[tha] was a misread');
  /* V5 wave 6b (18 Nov 2026, bot v0.6.234, RULINGS D-124, spec-v5-wave6 \u00a79): the after-success cloak and the vote cut, curated (two cards with the
     cloak sentence, worded apart; one with the cut). Each reading against the printed text; what the auto tier read is kept or pinned. */
  console.log('\nV5 wave 6b -- Shadow Cloak, Sleep Unseen, Absolute Tyranny (18 Nov 2026)');
  ok(cur('Shadow Cloak') && M('Shadow Cloak', 'obl').fx.stealth === 1 && M('Shadow Cloak', 'OBL').when === 'actSuccess' && JSON.stringify(M('Shadow Cloak', 'OBL').fx.cloak) === '{"pierce":"aus"}'
     && !M('Shadow Cloak', 'OBL').fx.unlock && JSON.stringify(L['Shadow Cloak'].req.disc) === '["obl"]' && !(L['Shadow Cloak'].cost && L['Shadow Cloak'].cost.blood),
     'Shadow Cloak: [obl] +1 stealth kept; [OBL] after a successful action the cloak against minions without Auspex (fx.cloak, when actSuccess -- no unlock: never an act-again card); free');
  ok(cur('Sleep Unseen') && M('Sleep Unseen', 'obf').when === 'actSuccess' && JSON.stringify(M('Sleep Unseen', 'obf').fx.cloak) === '{"pierce":"aus"}' && JSON.stringify(M('Sleep Unseen', 'OBF').fx.cloak) === '{"pierce":"aus","sup":true}'
     && L['Sleep Unseen'].cost.blood === 1,
     'Sleep Unseen: [obf] the cloak against minions without Auspex, [OBF] against those without superior Auspex; 1 blood inherited');
  ok(cur('Absolute Tyranny') && M('Absolute Tyranny', 'pot+pre').fx.votes === 3 && JSON.stringify(M('Absolute Tyranny', 'POT+PRE').fx.voteCut) === '{"notPath":"Power and the Inner Voice"}'
     && JSON.stringify(L['Absolute Tyranny'].t) === '["mod","react"]' && L['Absolute Tyranny'].cost.blood === 1,
     'Absolute Tyranny: [pot][pre] +3 votes kept; [POT][PRE] -1 vote for each vampire off the Path of Power and the Inner Voice (fx.voteCut); a modifier and a reaction, 1 blood');
}
/* The finished decks' round (19 Nov 2026, bot v0.6.235, RULINGS D-127, spec-card-sweep-2026-11-18 §4.3): the condition sentences, tagged as
   onlyDirected is (v1.9.11) -- on the entry for a line with no discipline, on the modes of a discipline line ('As above' inherits). Each
   reading checked against the printed text in vtes.json; the conditional forms the sentence's own wording excludes are pinned untagged,
   and the volumes pin the sentence's reach. */
{
  console.log('\nThe finished decks’ round -- the condition sentences (19 Nov 2026)');
  const L = res.out.lib, M = (n, at) => ((L[n] && L[n].modes) || []).find(mo => (mo.at || null) === at) || { fx: {}, missing: true }, E = n => L[n] || {};
  const anyM = (e, k) => (e.modes || []).some(m => m[k] !== undefined), has = (e, k) => e[k] !== undefined || anyM(e, k), cnt = f => Object.keys(L).filter(n => f(L[n])).length;
  ok(E('Bonding').onlyBleed === true && E('Confusion').onlyBleed === true && E('Revelation of the Serpent').onlyBleed === true
     && M('Changeling', 'vic').onlyBleed === true && !M('Changeling', 'VIC').onlyBleed && !E('Changeling').onlyBleed
     && M('Speak with Spirits', 'ani').onlyBleed === true && !M('Speak with Spirits', 'spi').onlyBleed && !M('Speak with Spirits', 'SPI').onlyBleed
     && M('Virtuosa', 'mel').onlyBleed === true && !M('Virtuosa', 'pre').onlyBleed && M('Fata Morgana', 'CHI').onlyBleed === true && !M('Fata Morgana', 'chi').onlyBleed
     && M('Iron Glare', 'POT+PRE').onlyBleed === true && !M('Iron Glare', 'pot+pre').onlyBleed
     && M("True Love's Face", 'obf+pre').onlyBleed === true && !M("True Love's Face", 'OBF+PRE').onlyBleed && E("True Love's Face").src === 'hand',
     'onlyBleed (v1.9.12): Bonding, Confusion, Revelation of the Serpent by the header; Changeling [vic], Speak with Spirits [ani], Virtuosa [mel], Fata Morgana [CHI], Iron Glare [POT][PRE] by their lines, never their other lines; True Love’s Face [obf][pre] in the curated file');
  ok(!has(E('Protected District'), 'onlyBleed') && E('Elder Intervention').onlyBleed === true && E('Pack Tactics').onlyBleed === true && E('Empowering the Puppet King').onlyBleed === true
     && (E('Donate').modes || []).some(m => m.use === 'mod' && m.onlyBleed === true) && !(E('Donate').modes || []).some(m => m.use === 'react' && m.onlyBleed) && !E('Donate').onlyBleed
     && M("Predator's Mastery", 'ABO').onlyBleed === true && M('Lead Fist', 'VIS').pressDir === 'continue',
     'onlyBleed\u2019s narrower forms (the egress review): \u2018directed at you\u2019 (Elder Intervention), \u2018against you\u2019 (Pack Tactics), \u2018by a ready vampire other than the acting minion\u2019 (Empowering the Puppet King; Donate\u2019s on its [ACTION MODIFIER] segment, not its [REACTION]) -- a bleed is still necessary; not Protected District (\u2018\u2026 or during the polling step\u2019); \u2018As [x] above\u2019 inherits its line (Predator\u2019s Mastery [ABO], Lead Fist [VIS])');
  ok(E('Forgotten Labyrinth').notBleed === true && E('Go-getter').notBleed === true && M('Shroud of Night', 'obt').notBleed === true && !M('Shroud of Night', 'OBT').notBleed && !E('Shroud of Night').notBleed,
     'notBleed (v1.9.12): Forgotten Labyrinth and Go-getter by the header, Shroud of Night [obt] by its line (‘+1 stealth, not usable during a bleed action’), not [OBT]');
  ok(E('Instinctive Reaction').onlyPredatorActs === true && !anyM(E('Instinctive Reaction'), 'onlyPredatorActs') && E('On the Qui Vive').oncePerUnlock === true && E('Shadow Sentinel').oncePerUnlock === true,
     'onlyPredatorActs and oncePerUnlock (v1.9.12): Instinctive Reaction’s header; On the Qui Vive and Shadow Sentinel (‘can play only one X between their unlock phases’)');
  ok(M('Apportation', 'tha').pressDir === 'continue' && !M('Apportation', 'THA').pressDir && E('Disengage').pressDir === 'end' && E('Dead-End Alley').pressDir === 'continue'
     && M('Grasp of the Python', 'ser').pressDir === 'continue' && M('Grasp of the Python', 'SER').pressDir === 'continue' && M('Tranquility', 'DOM').pressDir === 'end',
     'pressDir (v1.9.12): Apportation [tha] continues (its [THA] is a maneuver), Disengage ends, Dead-End Alley continues, Grasp of the Python both lines (‘As above’), Tranquility [DOM] ends');
  ok(E('Mirror Walk').noReplace === 'discard' && E("Wake with Evening's Freshness").noReplace === 'unlock' && E('Glancing Blow').noReplace === 'unlock' && E('Evil Eye').noReplace === 'unlock'
     && E('Dodge').noReplace === 'combat' && E('Disengage').noReplace === 'combat' && E('Baseball Bat').noReplace === 'action' && E('Elder Intervention').noReplace === 'action'
     && E('Lupine Assault').noReplace === 'influence' && E('Old Friends').noReplace === 'unlock' && M('Old Friends', 'obf').onlyBleed === true,
     'noReplace (v1.9.12): Mirror Walk until the discard phase; Wake with Evening’s Freshness, Glancing Blow, Evil Eye (‘your unlock phase’) until the unlock phase; Dodge and Disengage after combat; Baseball Bat and Elder Intervention after the action; Lupine Assault the influence phase; Old Friends both tags');
  const vol = { ob: cnt(e => has(e, 'onlyBleed')), obE: cnt(e => e.onlyBleed !== undefined), nb: cnt(e => has(e, 'notBleed')), pa: cnt(e => has(e, 'onlyPredatorActs')), opu: cnt(e => has(e, 'oncePerUnlock')),
    pd: cnt(e => has(e, 'pressDir')), pdE: cnt(e => e.pressDir === 'end' || (e.modes || []).some(m => m.pressDir === 'end')), nr: cnt(e => e.noReplace !== undefined) };
  const nrBy = {}; Object.keys(L).forEach(n => { const u = L[n].noReplace; if(u) nrBy[u] = (nrBy[u] | 0) + 1; });
  ok(vol.ob === 43 && vol.obE === 20 && vol.nb === 3 && vol.pa === 1 && vol.opu === 2 && vol.pd === 31 && vol.pdE === 15 && vol.nr === 42
     && nrBy.combat === 12 && nrBy.action === 11 && nrBy.discard === 8 && nrBy.unlock === 10 && nrBy.influence === 1,
     'the condition tags’ volume: onlyBleed 43 cards (20 by the header), notBleed 3, onlyPredatorActs 1, oncePerUnlock 2, pressDir 31 (15 to end), noReplace 42 (12 combat, 11 action, 8 discard, 10 unlock, 1 influence) -- got ' + JSON.stringify(vol) + ' ' + JSON.stringify(nrBy));
}
/* The merge of hand entries (20 Nov 2026, compiler v1.10.0; spec-card-sweep-2026-11-18 §4.4, RULINGS D-127): a curated library entry with
   "merge": true is laid over the compiled entry instead of replacing it, so a hand entry can carry the remainder only. Synthetic layers
   over eleven real cards compiled here from KRCG's text: every expectation is built from the compiled entry (a copy with the layer
   applied by hand), never written from memory. Every case runs through compile() (one, the mode's `req`, through mergeHand: no compiled
   mode carries a `req`; one through the command line). The four cards of §4.4 with two compiled modes at one level are Donate, The
   Eldest Are Kholo, Touch of Valeren [for] and Vigilance; Freak Drive's [for] names its `when`. Then the real curated file: nothing opts
   in, and an entry that opts in changes no other entry. The egress review of 20 Nov added the cases from "the near miss" on. */
{
  console.log('\nThe merge of hand entries (spec-card-sweep §4.4)');
  const CC = require('./cardfx-compile.js');
  const NAMES = ['Conditioning', 'Donate', 'The Eldest Are Kholo', 'Touch of Valeren', 'Vigilance', 'Computer Hacking', 'Kine Resources Contested', 'Awe', 'Pentex™ Subversion', 'Black Sunrise', 'Freak Drive'];
  const sub = cards.filter(c => NAMES.includes(c.name));
  const sortKeys = (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, kk) => { o[kk] = x[kk]; return o; }, {}) : x);
  const same = (a, b) => JSON.stringify(a, sortKeys) === JSON.stringify(b, sortKeys), cl = v => JSON.parse(JSON.stringify(v));
  const B = compile(sub, null).out.lib;   // the compiled entries, no curated file
  const run = lib => { try { return { r: compile(sub, { lib }) }; } catch (e) { return { err: e }; } };
  const M = (name, layer) => { const x = run({ [name]: layer }); return x.r ? x.r.out.lib[name] : null; };
  const fails = (lib, re) => { const x = run(lib); return !!(x.err && Array.isArray(x.err.mergeErrors) && x.err.mergeErrors.length && x.err.mergeErrors.every(s => re.test(s))); };
  const hand = (e, keys) => Object.assign(e, { src: 'hand', merged: true, handKeys: keys });
  ok(NAMES.every(n => B[n]) && B['Conditioning'].modes.length === 2 && B['Donate'].modes.filter(m => m.at === null).length === 2 && B['Touch of Valeren'].modes.filter(m => m.at === 'for').length === 2,
     'the merge’s fixtures compile: Conditioning [dom] / [DOM]; Donate, The Eldest Are Kholo and Vigilance two modes at the base level; Touch of Valeren two at [for]');
  { const got = M('Conditioning', { merge: true, modes: [{ at: 'dom', fx: { bleed: 5, kNew: 1 } }] }), exp = cl(B['Conditioning']);
    Object.assign(exp.modes[0].fx, { bleed: 5, kNew: 1 }); hand(exp, ['bleed', 'kNew']);
    ok(same(got, exp), 'a merged entry is the compiled one with the layer applied: Conditioning [dom] bleed 2 -> 5 and a new key; [DOM], the cost, the requirement, (limited) and onlyBleed stay; src hand, merged, handKeys [bleed, kNew] -- got ' + JSON.stringify(got)); }
  { const got = M('Computer Hacking', { merge: true, modes: [{ at: null, dir: null, lock: true, fx: { bleed: null, kX: 2 } }] }), exp = cl(B['Computer Hacking']);
    delete exp.modes[0].dir; exp.modes[0].lock = true; delete exp.modes[0].fx.bleed; exp.modes[0].fx.kX = 2; hand(exp, ['kX']);
    ok(same(got, exp), 'values: fx is the union, null deletes a key the compiler set (Computer Hacking’s bleed); a mode’s own fields the same (dir deleted, lock set); a deleted key is no hand key -- got ' + JSON.stringify(got)); }
  { const got = M('Conditioning', { merge: true, limited: null, unique: true, t: ['mod', 'combat'], note: 'the layer’s note' }), exp = cl(B['Conditioning']);
    delete exp.limited; exp.unique = true; exp.t = ['mod', 'combat']; exp.note = 'the layer’s note'; hand(exp, []);
    ok(same(got, exp), 'entry fields: the curated value wins (t, unique), null deletes ((limited)), the note is the curated one; a layer with no fx key has handKeys [] -- got ' + JSON.stringify(got)); }
  { const got = M('Conditioning', { merge: true, modes: [{ at: 'DOM', drop: true }, { at: 'pre', fx: { bleed: 3 } }] }), exp = cl(B['Conditioning']);
    exp.modes = [exp.modes[0], { at: 'pre', fx: { bleed: 3 } }]; hand(exp, ['bleed']);
    ok(same(got, exp), 'drop: the compiled [DOM] is deleted, and a mode at a level the compiled entry lacks is added after the compiled modes (a mode at a wrong level dropped and re-added) -- got ' + JSON.stringify(got)); }
  { const got = M('Conditioning', { merge: true, modes: [{ at: 'dom', add: true, fx: { k1: 1, gone: null } }, { at: 'dom', add: true, fx: { k2: 1 } }] }), exp = cl(B['Conditioning']);
    exp.modes.push({ at: 'dom', fx: { k1: 1 } }, { at: 'dom', fx: { k2: 1 } }); hand(exp, ['k1', 'k2']);
    ok(same(got, exp), 'add: two curated modes at a compiled level are added after the compiled modes in the curated order (a finder’s tie keeps the first); a null on an added mode deletes nothing and is not written -- got ' + JSON.stringify(got)); }
  { const g2 = M('Donate', { merge: true, modes: [{ at: null, nth: 2, fx: { intercept: 2 } }] }), e2 = cl(B['Donate']); e2.modes[1].fx.intercept = 2; hand(e2, ['intercept']);
    const g1 = M('Donate', { merge: true, modes: [{ at: null, nth: 1, fx: { bleed: 2 } }, { at: null, nth: 2, drop: true }] }), e1 = cl(B['Donate']); e1.modes[0].fx.bleed = 2; e1.modes.pop(); hand(e1, ['bleed']);
    ok(same(g2, e2) && same(g1, e1), 'nth: Donate’s [REACTION] mode (nth 2) takes the layer and its [ACTION MODIFIER] mode does not; nth 1 merges the first while nth 2 drops the second'); }
  ok(fails({ Donate: { merge: true, modes: [{ at: null, fx: { x: 1 } }] } }, /^Donate: curated mode 1 \[—\]: 2 compiled modes at that level/)
     && fails({ 'The Eldest Are Kholo': { merge: true, modes: [{ at: null, fx: { x: 1 } }] } }, /^The Eldest Are Kholo: .*2 compiled modes at that level/)
     && fails({ 'Touch of Valeren': { merge: true, modes: [{ at: 'for', fx: { x: 1 } }] } }, /^Touch of Valeren: curated mode 1 \[for\]: 2 compiled modes/)
     && fails({ Vigilance: { merge: true, modes: [{ at: null, drop: true }] } }, /^Vigilance: .*2 compiled modes at that level/),
     'an unplain target fails the compile: a level with two compiled modes and no nth (Donate, The Eldest Are Kholo, Touch of Valeren [for], Vigilance -- a drop too)');
  ok(fails({ Conditioning: { merge: true, modes: [{ at: 'dom', fx: { a: 1 } }, { at: 'dom', fx: { b: 1 } }] } }, /^Conditioning: curated mode 2 \[dom\] and curated mode 1 are aimed at one compiled mode/)
     && fails({ Donate: { merge: true, modes: [{ at: null, nth: 2, fx: { a: 1 } }, { at: null, nth: 2, drop: true }] } }, /aimed at one compiled mode/),
     'an unplain target fails the compile: two curated modes aimed at one compiled mode (two at [dom]; a merge and a drop at Donate’s nth 2)');
  ok(fails({ Donate: { merge: true, modes: [{ at: null, nth: 3, fx: {} }] } }, /"nth": 3 names no compiled mode \(2 at that level\)/)
     && fails({ Conditioning: { merge: true, modes: [{ at: 'pre', drop: true }] } }, /"drop" names no compiled mode/)
     && fails({ Conditioning: { merge: true, modes: [{ at: 'dom', add: true, nth: 1, fx: {} }] } }, /"add" names no compiled mode, so it takes no "nth" or "drop"/)
     && fails({ Conditioning: { merge: true, modes: [{ at: 'DOM', drop: true, fx: { bleed: 3 } }] } }, /a dropped mode carries its level only/)
     && fails({ Conditioning: { merge: true, modes: { at: 'dom' } } }, /"modes" is a list of modes/),
     'and so does every other target the layer cannot name without doubt: an nth past the level’s modes, a drop at a level with none, add with nth, a dropped mode with fx, modes that are no list');
  { const g = M('Touch of Valeren', { merge: true, req: { sect: 'Camarilla' } }), g0 = M('Touch of Valeren', { merge: true, req: { clan: null, disc: ['for', 'aus'] } });
    const b = B['Touch of Valeren'].req;
    ok(!!g && same(g.req, Object.assign(cl(b), { sect: 'Camarilla' })) && !!g0 && same(g0.req, { disc: ['for', 'aus'] }) && b.clan && b.disc,
       'req merges key by key: the compiled disc and clan stay when the layer names sect; null deletes clan, a named disc takes the curated value (Touch of Valeren) -- got ' + JSON.stringify(g && g.req) + ' / ' + JSON.stringify(g0 && g0.req)); }
  { const mh = CC.mergeHand, base = { t: ['mod'], modes: [{ at: 'x', fx: { a: 1 }, req: { disc: ['dom'], capMin: 4 } }], src: 'auto' };
    const r = typeof mh === 'function' ? mh(base, { merge: true, modes: [{ at: 'x', req: { capMin: null, sect: 'Sabbat' } }] }, 'Synthetic') : null;
    ok(!!r && !r.errors.length && same(r.e.modes[0].req, { disc: ['dom'], sect: 'Sabbat' }), 'a mode’s req merges key by key as well (mergeHand on a synthetic compiled mode: no compiled mode carries a req)'); }
  { const got = M('Kine Resources Contested', { merge: true, ref: { fx: { kRef: 1, poolDmg: null } } }), exp = cl(B['Kine Resources Contested']);
    exp.ref.fx = { kRef: 1 }; hand(exp, ['kRef']);
    ok(same(got, exp) && exp.ref.pool && exp.ref.tags, 'ref.fx merges as a mode’s fx does (a key added, the compiler’s poolDmg deleted) and the referendum’s terms and tags stay; a ref.fx key is a hand key -- got ' + JSON.stringify(got)); }
  { const k = run({ Conditioning: { merge: true, modes: [{ at: 'dom', fx: { k: 1 } }] } }), f0 = run({ Conditioning: { merge: true, cost: {} } }), p1 = run({ Conditioning: { merge: true, cost: { pool: 1 } } }), aw = run({ Awe: { merge: true } });
    const L = x => (x.r ? x.r.out.lib : {}), R = x => x.r || {};
    ok(!!k.r && same(L(k).Conditioning.cost, B['Conditioning'].cost) && (R(k).costInherited || []).includes('Conditioning {"blood":1}')
       && !!f0.r && same(L(f0).Conditioning.cost, {}) && (R(f0).costMismatch || []).includes('Conditioning curated {} vs data {"blood":1}')
       && !!p1.r && same(L(p1).Conditioning.cost, { pool: 1 }) && (R(p1).costMismatch || []).some(s => /^Conditioning curated \{"pool":1\}/.test(s))
       && !!aw.r && L(aw).Awe.cost === undefined && B['Awe'].cost.blood === 'X' && (R(aw).costX || []).includes('Awe {"blood":"X"}') && L(aw).Awe.merged === true,
       'the cost rule holds: a layer without cost keeps the compiled numeric cost (in the inherited list); cost {} insists on free and an explicit cost wins (each in the mismatch list); an X leaves the merge and is reported (Awe)'); }
  { const x = run({ 'Pentex(TM) Subversion': { merge: true, modes: [{ at: null, fx: { kP: 1 } }] } }), L = x.r ? x.r.out.lib : {}, exp = cl(B['Pentex™ Subversion']);
    exp.modes[0].fx.kP = 1; hand(exp, ['kP']);
    ok(same(L['Pentex(TM) Subversion'], exp) && same(L['Pentex™ Subversion'], exp) && x.r && (x.r.curVariant || []).includes('Pentex(TM) Subversion -> Pentex™ Subversion'),
       'a key that is a printed variant is laid over the printed name’s compiled entry and written under both names (v1.9.3’s rule)'); }
  ok(fails({ 'No Such Card': { merge: true } }, /^No Such Card: "merge" needs a compiled entry/) && (() => { try { compile(sub, { lib: {}, crypt: { 'Some Vampire (G1)': { merge: true, fx: {} } } }); return false; } catch (e) { return !!(e.mergeErrors && /the crypt keeps whole-entry replacement/.test(e.mergeErrors[0])); } })()
     && fails({ Conditioning: { merge: true, src: 'auto' } }, /"src" is the compiler's to write/),
     'a merge with no compiled entry under its name fails the compile; so does merge on a crypt entry (the crypt keeps whole-entry replacement) and a layer that writes src');
  { const x = run({ Conditioning: { merge: true, limited: null, modes: [{ at: 'dom', fx: { bleed: 5 } }, { at: 'DOM', drop: true }] }, Awe: { merge: true } }), txt = x.r ? CC.report(x.r, false) : '';
    ok(/merged entries \(v1\.10\.0[^\n]*: 2\n/.test(txt) && /\n {4}· Conditioning: -limited · \[dom\] fx bleed 2→5 · \[DOM\] dropped\n/.test(txt) && /\n {4}· Awe: cost \{"blood":"X"\}: the X left the merge/.test(txt),
       'the compile report lists each merged entry with what its layer changed -- got ' + JSON.stringify(txt.split('\n').filter(l => /merged|· (Conditioning|Awe)/.test(l)))); }
  { const lay = { modes: [{ at: 'dom', fx: { bleed: 5 } }], note: 'whole' }, got = M('Conditioning', lay), b = B['Conditioning'];
    const exp = { modes: [{ at: 'dom', fx: { bleed: 5 } }], note: 'whole', src: 'hand', cost: b.cost, req: b.req, onlyBleed: true };
    ok(same(got, exp) && JSON.stringify(Object.keys(got)) === '["modes","note","src","cost","req","onlyBleed"]',
       'an entry that does not opt in is today’s whole-entry overlay, byte for byte (the curated keys, src, then the inherited cost, requirement and markers)'); }
  // ---- the egress review of 20 Nov (8 findings; the decisions are in spec-card-sweep §4.4's note) ----
  { const fd = B['Freak Drive'], w = M('Freak Drive', { merge: true, modes: [{ at: 'for', when: 'actSuccess', fx: { kW: 1 } }] }), ew = cl(fd); ew.modes[0].fx.kW = 1; hand(ew, ['kW']);
    const ad = M('Freak Drive', { merge: true, modes: [{ at: 'for', add: true, fx: { kW: 1 } }] }), ea = cl(fd); ea.modes.push({ at: 'for', fx: { kW: 1 } }); hand(ea, ['kW']);
    const dw = M('Freak Drive', { merge: true, modes: [{ at: 'for', when: 'actSuccess', drop: true }, { at: 'for', when: 'actFailed', add: true, fx: { unlock: true } }] }), ed = cl(fd); ed.modes = [ed.modes[1], { at: 'for', when: 'actFailed', fx: { unlock: true } }]; hand(ed, ['unlock']);
    const near = /^Freak Drive: curated mode 1 \[for( when actBlocked)?\]: no compiled mode at \[for\] has (no "when"|when actBlocked) \(the compiled when: actSuccess\) -- name the "when", or say "add"/;
    ok(fd.modes[0].at === 'for' && fd.modes[0].when === 'actSuccess' && same(w, ew) && same(ad, ea) && same(dw, ed)
       && fails({ 'Freak Drive': { merge: true, modes: [{ at: 'for', fx: { kW: 1 } }] } }, near) && fails({ 'Freak Drive': { merge: true, modes: [{ at: 'for', when: null, fx: { kW: 1 } }] } }, near)
       && fails({ 'Freak Drive': { merge: true, modes: [{ at: 'for', when: 'actBlocked', fx: { kW: 1 } }] } }, near) && fails({ 'Freak Drive': { merge: true, modes: [{ at: 'for', drop: true }] } }, near),
       'the near miss: at Freak Drive’s [for] (when actSuccess) a layer naming the when merges; a forgotten when, when null, another when (and a drop with none) each fail and name the compiled when; with "add": true the mode is added; drop and add change a when'); }
  { const nf = fails({ Conditioning: { merge: true, modes: [{ at: 'DOM2', lock: true }] } }, /^Conditioning: curated mode 1 \[DOM2\]: a mode the layer adds carries an "fx" object/)
       && fails({ Conditioning: { merge: true, modes: [{ at: 'dom', add: true, lock: true }] } }, /a mode the layer adds carries an "fx" object/);
    const g = M('Conditioning', { merge: true, modes: [{ at: 'DOM2', lock: true, fx: {} }] });
    ok(nf && !!g && same(g.modes[2], { at: 'DOM2', lock: true, fx: {} }), 'a mode the layer adds without an fx object fails the compile (at an `at` the entry lacks, or with "add"); an explicit "fx": {} is written'); }
  { const noFx = lib => { const out = []; for (const n of Object.keys(lib || {})) ((lib[n] && lib[n].modes) || []).forEach((m, i) => { if (!m || !m.fx || typeof m.fx !== 'object' || Array.isArray(m.fx)) out.push(n + ' mode ' + (i + 1)); }); return out; };
    const real = noFx(fx.lib), planted = noFx({ A: { modes: [{ at: null, fx: {} }, { at: 'x', lock: true }] }, B: { modes: [{ at: null, fx: [] }] } });
    let rep = null; try { rep = CC.report({ out: { counts: fx.counts, source: 's', lib: { A: { t: ['master'], modes: [{ at: null }] } } }, collisions: [], curNew: [] }, true); } catch (e) { rep = null; }
    ok(real.length === 0 && JSON.stringify(planted) === '["A mode 2","B mode 1"]' && !!rep,
       'every library mode of the compiled output carries an fx object (' + real.length + ' without one' + (real.length ? ': ' + real.slice(0, 5).join(', ') : '') + '; the two planted are found), and the verbose report reads a mode without fx without throwing'); }
  { const os = require('os'), cp = require('child_process'), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cardfx-merge-'));
    fs.writeFileSync(path.join(tmp, 'vtes.json'), JSON.stringify(sub)); fs.writeFileSync(path.join(tmp, 'bad.json'), JSON.stringify({ lib: { Donate: { merge: true, modes: [{ at: null, fx: { x: 1 } }] } } }));
    fs.writeFileSync(path.join(tmp, 'good.json'), JSON.stringify({ lib: { Donate: { merge: true, modes: [{ at: null, nth: 2, fx: { x: 1 } }] } } }));
    fs.writeFileSync(path.join(tmp, 'nofx.json'), JSON.stringify({ lib: { Conditioning: { merge: true, modes: [{ at: 'DOM2', lock: true }] } } }));   // the review's probe: v1.10.0 as first built wrote both files, then its report threw
    const cli = (cur, out, more) => cp.spawnSync(process.execPath, [here('cardfx-compile.js'), '--vtes', path.join(tmp, 'vtes.json'), '--curated', path.join(tmp, cur), '--out', path.join(tmp, out)].concat(more || []), { encoding: 'utf8' });
    const r1 = cli('bad.json', 'a.json', ['--report']), r2 = cli('bad.json', 'b.json'), r3 = cli('good.json', 'c.json', ['--report']), r4 = cli('nofx.json', 'd.json', ['--report']);
    const none = f => !fs.existsSync(path.join(tmp, f + '.json')) && !fs.existsSync(path.join(tmp, f + '.js'));
    const okRun = r3.status === 0 && fs.existsSync(path.join(tmp, 'c.json')) && fs.existsSync(path.join(tmp, 'c.js')) && /merged entries/.test(r3.stdout);
    const wrote = { a: !none('a'), b: !none('b'), d: !none('d') };   // read before the scratch folder goes
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* scratch */ }
    ok(r1.status === 1 && !wrote.a && /the merge of hand entries failed/.test(r1.stderr) && r2.status === 1 && !wrote.b && okRun && r4.status === 1 && !wrote.d,
       'the command line: a failed merge exits 1 and writes neither library file, with --report or without (an added mode without fx too); the same entry with its nth writes both and reports the merge (exits ' + [r1.status, r2.status, r3.status, r4.status].join(', ') + '; files written by the failed runs: ' + JSON.stringify(wrote) + ')'); }
  ok(fails({ Conditioning: { merge: false, modes: [{ at: 'dom', fx: { bleed: 5 } }] } }, /^Conditioning: "merge" is true or absent \(it is false\)/)
     && fails({ Conditioning: { merge: 'true' } }, /^Conditioning: "merge" is true or absent \(it is "true"\)/)
     && fails({ Conditioning: { modes: [{ at: 'dom', add: true, fx: {} }] } }, /^Conditioning: a mode carries "nth", "add" or "drop", which only a merge reads/)
     && fails({ Donate: { modes: [{ at: null, nth: 2, fx: {} }] } }, /only a merge reads/) && fails({ Donate: { modes: [{ at: null, drop: true }] } }, /only a merge reads/)
     && (() => { try { compile(sub, { lib: {}, crypt: { 'Some Vampire (G1)': { merge: false, fx: {} } } }); return false; } catch (e) { return !!(e.mergeErrors && /"merge" is true or absent/.test(e.mergeErrors[0])); } })(),
     'no half opt-in: a "merge" that is present and not true (false, "true"; in the crypt too) fails the compile, and so does a mode’s nth, add or drop on an entry that does not opt in');
  { const got = M('Conditioning', { merge: true, modes: [{ at: 'dom', fx: { kZ: 1, bleed: 2 } }] });
    ok(!!got && B['Conditioning'].modes[0].fx.bleed === 2 && JSON.stringify(got.handKeys) === '["bleed","kZ"]', 'handKeys are sorted, and a key the layer restates with the compiler’s own value (bleed 2) is the layer’s -- got ' + JSON.stringify(got && got.handKeys)); }
  { const x = run({ 'Pentex(TM) Subversion': { t: ['master'], modes: [{ at: null, fx: { kW: 1 } }] }, 'Pentex™ Subversion': { merge: true, modes: [{ at: null, fx: { kM: 1 } }] } });
    const L = x.r ? x.r.out.lib : {}, exp = cl(B['Pentex™ Subversion']); exp.modes[0].fx.kM = 1; hand(exp, ['kM']);
    ok(same(L['Pentex™ Subversion'], exp) && !!L['Pentex(TM) Subversion'] && L['Pentex(TM) Subversion'].src === 'hand' && !L['Pentex(TM) Subversion'].merged,
       'a merge lays over the COMPILED entry, never over a hand entry the overlay wrote before it (a whole entry under the printed variant, mirrored onto the printed name first) -- got ' + JSON.stringify(L['Pentex™ Subversion'])); }
  ok(fails({ Conditioning: { merge: true, merged: true } }, /"merged" is the compiler's to write/) && fails({ Conditioning: { merge: true, handKeys: ['bleed'] } }, /"handKeys" is the compiler's to write/),
     'a layer that writes merged or handKeys fails the compile, as one that writes src');
  { const x = run({ Conditioning: { merge: true, cost: null } }), e = x.r && x.r.out.lib.Conditioning;
    ok(!!e && !Object.prototype.hasOwnProperty.call(e, 'cost') && (x.r.costMismatch || []).includes('Conditioning curated {} vs data {"blood":1}'), 'cost: null deletes the cost (the card is free) and stands in the mismatch list'); }
  { const rq = M('Conditioning', { merge: true, req: { disc: null } }), rf = M('Kine Resources Contested', { merge: true, ref: { pool: null, tags: null, fx: null } }), rx = M('Kine Resources Contested', { merge: true, ref: { fx: { poolDmg: null } } });
    const has = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
    ok(!!rq && same(B['Conditioning'].req, { disc: ['dom'] }) && !has(rq, 'req') && !!rf && !has(rf, 'ref') && !!rx && has(rx, 'ref') && !has(rx.ref, 'fx') && !!rx.ref.pool,
       'an emptied req, ref or ref.fx is removed, never written as {} (Conditioning’s req, Kine Resources Contested’s ref and its fx)'); }
  { const got = M('Conditioning', { merge: true, modes: [{ at: 'pre', fx: { a: 1 } }, { at: 'pre', fx: { b: 1 } }] }), exp = cl(B['Conditioning']);
    exp.modes.push({ at: 'pre', fx: { a: 1 } }, { at: 'pre', fx: { b: 1 } }); hand(exp, ['a', 'b']);
    ok(same(got, exp), 'two curated modes at an `at` the compiled entry lacks are both added, in the curated order -- got ' + JSON.stringify(got && got.modes)); }
  { const x = run({ Conditioning: { merge: true, modes: [{ at: 'pre', phase: null, dir: null, fx: { k: 1, z: null }, req: { a: null } }, { at: null, fx: { k2: 1 } }] } });
    const e = x.r && x.r.out.lib.Conditioning, txt = x.r ? CC.report(x.r, false) : '';
    ok(!!e && JSON.stringify(e.modes.slice(2)) === '[{"at":"pre","fx":{"k":1}},{"at":null,"fx":{"k2":1}}]' && /\[pre\] phase null \(nothing to delete: an added mode\)/.test(txt) && /\[pre\] fx z null \(nothing to delete/.test(txt),
       'a null on an added mode is not written and is reported (phase, dir, an fx key, an emptied req); an added mode keeps its at, null too (the base level) -- got ' + JSON.stringify(e && e.modes.slice(2))); }
  { const realOpt = Object.keys((curated && curated.lib) || {}).filter(n => curated.lib[n] && curated.lib[n].merge === true);
    const layered = curated ? cl(curated) : { lib: {}, crypt: {} };
    layered.lib['Conditioning'] = { merge: true, modes: [{ at: 'dom', fx: { bleed: 5 } }] };
    let a = null, b = null, ra = null; try { ra = compile(cards, curated); a = ra.out; b = compile(cards, layered).out; } catch (e) { a = b = null; }
    const other = !!(a && b) && ['lib', 'crypt', 'alias'].every(part => { const ka = Object.keys(a[part]), kb = Object.keys(b[part]);
      return JSON.stringify(ka) === JSON.stringify(kb) && ka.every(n => (part === 'lib' && n === 'Conditioning') || JSON.stringify(a[part][n]) === JSON.stringify(b[part][n])); });
    ok(other && !!b && b.lib['Conditioning'].merged === true && a.lib['Conditioning'].src === 'auto',
       'an entry that opts in changes no other entry: the real curated file with a merged Conditioning added compiles every other library entry, every crypt entry and every alias byte for byte as without it');
    const shippedTxt = (() => { try { return fs.readFileSync(here('elysium-cardfx.json'), 'utf8'); } catch (e) { return null; } })();
    /* compiler v1.11.0 (20 Nov 2026, the Banu Haqim pilot): the guard that went red on purpose when the first entry opted in now pins the
       first opt-ins -- exactly the pilot's five opt in, and exactly their compiled and committed entries carry merged and handKeys */
    const C1M = [   // v0.6.243 (C1): the readers' corrections of the stealth / intercept / bleed family, 80 merges (their notes begin 'C1 (27 Nov 2026')
      'Abbot', 'Achilles\' Heel', 'Anarch Manifesto, An', 'Asanbonsam Ghoul', 'Baltimore Purge', 'Bear-Baiting', 'Blessings of the Loa',
      'Blithe Acceptance', 'Bloodstone', 'Bloodwork', 'Canopic Jar', 'Carlton Van Wyk', 'Charigger, The Axe', 'Charnas the Imp',
      'Codex of the Edenic Groundskeepers', 'Communal Haven: Temple', 'Corpse Balloon', 'Cãoera', 'Defender of the Haven', 'Divine Sign',
      'Dogged Pursuit', 'Dream World', 'Ears of the Hare', 'Form of Mist', 'Giuseppe, Gravedigger', 'Gravebound Drone', 'Guard Duty',
      'Guinea-Bissau Carnival', 'Hexaped', 'Hidden Pathways', 'High Aye', 'Illuminate', 'Ilomba', 'Inevitability of the Void', 'Lock',
      'Marijava Ghoul', 'Marked Territory', 'Ministry', 'Mirror\'s Visage', 'Mithraic Cultist', 'Mole\'s Tunneling', 'No Secrets From the Magaji',
      'Nosferatu Performance Art', 'Pallid', 'Pentex™ Loves You!', 'Phased Motion Detector', 'Pocket Out of Time', 'Priestess of Sekhmet',
      'Protection Racket', 'Psalm of the Damned', 'Psychic Veil', 'Pulled Fangs', 'Rampage', 'Samuel Haight', 'Scarlet Lore', 'Sense the Sin',
      'Shell Break', 'Sins of the Cauchemar', 'Siren\'s Lure', 'Songs of the Distant Vitae', 'Soul Painting', 'Speak with Spirits', 'Special Report',
      'Stone Travel', 'Strained Vitae Supply', 'Sunset Strip, Hollywood', 'Swarm', 'Taking the Skin: Minion', 'The Ancestor\'s Talisman',
      'The Portrait', 'The Rumor Mill, Tabloid Newspaper', 'The Unmasking', 'Tremere Convocation', 'Under Siege', 'Unholy Penance',
      'Unleash the Hounds', 'Unlicensed Taxicab', 'Voices of the Castle', 'Warning Sirens', 'Watchtower: The Wolves Feed'];
    const PILOT = ['Biothaumaturgic Experiment', 'New Moon Sigil', 'Night Terrors', 'Priority Contract', 'Shadow of the Beast', 'Aire of Elation', 'The Warrens', 'Mirror Walk'].concat(C1M), srt = x => JSON.stringify((x || []).slice().sort());   // v0.6.241: + the exactness round's three (7.1, 7.2, Mirror Walk [THA]); v0.6.243: + C1's 80
    const shipped = (() => { try { return JSON.parse(shippedTxt); } catch (e) { return null; } })();
    const mergedIn = lib => Object.keys((lib && lib.lib) || {}).filter(n => lib.lib[n].merged !== undefined || lib.lib[n].handKeys !== undefined);
    const delOnly = n => { const L = curated.lib[n] || {}, ms = L.modes || []; return ms.some(m => m.drop === true) || ms.some(m => Object.values(m.fx || {}).some(v => v === null)); };   // v0.6.243 (C1): a correction that only deletes compiled keys sets no hand key
    ok(srt(realOpt) === srt(PILOT) && !!a && srt((ra.merged || []).map(m => m.name)) === srt(PILOT) && srt(mergedIn(a)) === srt(PILOT)
       && PILOT.every(n => a.lib[n].merged === true && a.lib[n].src === 'hand' && Array.isArray(a.lib[n].handKeys) && (a.lib[n].handKeys.length > 0 || delOnly(n)))
       && !!shipped && srt(mergedIn(shipped)) === srt(PILOT) && (shippedTxt.match(/"merged":true/g) || []).length === PILOT.length,
       'the real opt-ins are the pilot\u2019s five, the exactness round\u2019s three and C1\u2019s 80 (' + realOpt.length + ': ' + realOpt.join(', ') + '): exactly their compiled and committed entries carry merged and handKeys (until v1.11.0 this guard held that none opted in)'); }
}
/* end: the merge of hand entries */
/* The Banu Haqim pilot (20 Nov 2026, compiler v1.11.0; spec-sweep-pilot-2026-11-20.md §3.1, RULINGS D-125 / D-127 / D-132): the whole-mode
   readings (the action rush and its grant, the hand strike), the ban, the animal marker, and the first merged entries. Each case on real
   cards, each reading checked against KRCG's text in vtes.json; the negatives pin the whole-mode rule (a mode with a sentence no key
   reads gets nothing from a pattern). */
{
  console.log('\nThe Banu Haqim pilot -- the whole-mode readings, the ban, the animal marker, the first merges (compiler v1.11.0)');
  const L = res.out.lib, E = n => L[n] || {}, M = (n, at) => ((L[n] && L[n].modes) || []).find(mo => (mo.at === undefined ? null : mo.at) === at) || null;
  const FX = (n, at) => JSON.stringify((M(n, at) || { fx: 'none' }).fx), anyKey = (n, k) => ((L[n] && L[n].modes) || []).some(mo => mo.fx && mo.fx[k] !== undefined);
  /* the rush and its grant */
  ok(FX("Hunter's Mark", 'cel+tha') === '{"rush":true,"pressGrant":1}' && M("Hunter's Mark", 'cel+tha').dir === true
     && FX("Hunter's Mark", 'CEL+THA') === '{"ceBan":"r1","rush":true,"pressGrant":1}' && M("Hunter's Mark", 'CEL+THA').dir === true,
     'Hunter\u2019s Mark (banuhaqim \u00d74): [cel][tha] \u2018Enter combat with a minion. This acting vampire gets 1 optional press during that combat.\u2019 is rush + pressGrant 1 (no press: a grant, not a card play); [CEL][THA] adds ceBan r1 (\u2018the opposing minion cannot strike: combat ends during the first round\u2019) and no strikeCE / combatEnds -- got ' + FX("Hunter's Mark", 'cel+tha') + ' / ' + FX("Hunter's Mark", 'CEL+THA'));
  ok(FX('Fleetness', 'CEL') === '{"rush":true,"rushTo":"locked","maneuverGrant":1}' && FX('Fleetness', null) === '{"actStealth":1}' && FX('Fleetness', 'cel') === '{"bleedAct":true}' && E('Fleetness').cost.blood === 1,
     'Fleetness (banuhaqim \u00d72): [CEL] \u2018Enter combat with a locked minion\u2019 + 1 optional maneuver -> rushTo locked, maneuverGrant 1 ([ANK 20210124]: an unlocked target fizzles); the +1 stealth action and the 1 blood stay; [cel] stays a bleed');
  ok(FX('Ambush', null) === '{"rush":true,"rushTo":"locked","maneuverGrant":1}' && FX("Bum's Rush", null) === '{"rush":true,"maneuverGrant":1}' && E("Bum's Rush").noReplace === 'action',
     'Ambush (a locked minion, 1 maneuver) and Bum\u2019s Rush (a minion, 1 maneuver; \u2018Do not replace until after this action\u2019 is its noReplace) -- whole, the header sentence read');
  ok(FX('Line Brawl', 'pot') === '{"rush":true}' && FX('Line Brawl', 'cel') === '{}' && FX('Line Brawl', 'pre') === '{"bleedAct":true,"bleed":1}' && E('Line Brawl').anarchReq === true,
     'Line Brawl [pot] (brujah \u00d76): \u2018Enter combat with a minion.\u2019 is a bare rush (no rushTo); \u2018Requires an Anarch\u2019 is the compiler\u2019s anarchReq; [cel] and [pre] unchanged');
  ok(FX('Sense Death', 'ani') === '{"rush":true,"rushTo":"younger"}' && FX('Sense Death', 'val') === '{"rush":true,"pressGrant":1}' && FX('Sense Death', 'VAL') === '{"rush":true,"maneuverGrant":1,"pressGrant":1}'
     && FX('Taunt the Caged Beast', 'ani') === '{"rush":true,"rushTo":"vampire","maneuverGrant":1}' && FX('Umbrous Clutch', 'obl') === '{"rush":true}' && FX('Umbrous Clutch', 'OBL') === '{"rush":true,"maneuverGrant":1}'
     && FX('Hunting the Beast', 'aus') === '{"rush":true,"rushTo":"vampire"}' && FX('Charge of the Buffalo', 'for') === '{"rush":true,"rushTo":"locked"}' && FX('Nose of the Hound', 'aus') === '{"rush":true,"rushTo":"locked","maneuverGrant":1}',
     'the rest of the library: Sense Death (younger; [val] \u2018during this combat\u2019 press; [VAL] \u2018As [val] above, and\u2019 a maneuver too), Taunt [ani] (\u2018with an optional maneuver in that combat\u2019), Umbrous Clutch (\u2018As above, and\u2019), Hunting the Beast [aus], Charge of the Buffalo [for], Nose of the Hound [aus] (a ready locked minion of another Methuselah)');
  { const rushers = Object.keys(L).filter(n => (L[n].modes || []).some(mo => mo.fx && mo.fx.rush)).sort();
    const want = ['Ambush', "Bum's Rush", 'Charge of the Buffalo', 'Deep Song', 'Fleetness', "Hunter's Mark", 'Hunting the Beast', 'Line Brawl', 'Nose of the Hound', 'Sense Death', 'Taunt the Caged Beast', 'Umbrous Clutch'];
    const modes = rushers.flatMap(n => L[n].modes.filter(mo => mo.fx && mo.fx.rush).map(mo => ({ n, mo })));
    ok(JSON.stringify(rushers) === JSON.stringify(want) && modes.length === 18 && modes.every(({ n, mo }) => mo.dir === true && L[n].t.includes('action') && mo.fx.maneuver === undefined && mo.fx.press === undefined)
       && modes.every(({ n, mo }) => mo.fx.lockTarget === undefined || n === 'Deep Song'),
       'the rush\u2019s volume: 18 modes on 12 cards (Deep Song\u2019s hand entry and 17 compiled modes on 11 cards; v1.11.1: + Nose of the Hound [spi] and [SPI]), each a directed action mode with no maneuver / press beside it; lockTarget on Deep Song only -- got ' + rushers.join(', ') + ' (' + modes.length + ' modes)'); }
  /* the rush refused: a mode with a sentence no key reads (the R cards: specs/spec-sweep-pilot-2026-11-20.md \u00a72, the rush\u2019s row) */
  { const R = ['Abuse of Power', 'Pillars Fall', 'Big Game', 'Dive Bomb', 'Clandestine Contract', 'Harass', 'Make the Misere', 'Purity of the Beast', 'Games of Instinct', 'Rumble', 'Monomancy', 'Coagulated Entity', 'Steely Tenacity', 'Consume the Dead'];
    const refused = new Set((res.wholeRefused || []).map(r => r.name));
    ok(R.every(n => !!L[n] && !anyKey(n, 'rush') && !anyKey(n, 'rushTo') && !anyKey(n, 'maneuverGrant') && !anyKey(n, 'pressGrant') && refused.has(n))
       && FX('Big Game', null) === '{"maneuver":true,"press":true}' && FX('Harass', null) === '{"press":true}' && FX('Abuse of Power', null) === '{"actStealth":1}',
       'the whole-mode rule refuses the rush on the rider cards and lists each in the report: Abuse of Power and Pillars Fall (after combat), Big Game (Red List), Dive Bomb ([FLIGHT], first round), Clandestine Contract (the card on the target), Harass (an or-condition), Make the Misere (the header), Purity of the Beast (an ally), Games of Instinct, Rumble and Monomancy (Sabbat), Coagulated Entity, Steely Tenacity, Consume the Dead -- their compiled keys untouched'); }
  ok(FX('Charge of the Buffalo', 'spi') === '{"handBonus":1,"handStrike":true}' && FX('Charge of the Buffalo', 'SPI') === '{"handBonus":2,"handStrike":true}'
     && FX('Hunting the Beast', 'AUS') === '{"bloodAdd":2}',
     'a refused mode beside a whole one keeps its compiled keys: Charge of the Buffalo [spi] / [SPI] (the range and the initial strike), Hunting the Beast [AUS] (after combat); compiler v1.11.1: Charge [SPI] \u2018As [spi] above, but the strike is at +2 damage\u2019 carries +2 (it inherited [spi]\u2019s +1: a wrong value -- the number is the text\u2019s, the mode stays refused and listed)');
  /* compiler v1.11.1 (the pilot's review: the grader's wrong refusals and R-1, R-data 5) */
  { const refR = res.wholeRefused || [], rf = (n, at) => refR.filter(r => r.name === n && r.at === at);
    ok(FX('Nose of the Hound', 'spi') === '{"rush":true,"rushTo":"locked","maneuverGrant":2}' && FX('Nose of the Hound', 'SPI') === '{"rush":true,"maneuverGrant":2}' && M('Nose of the Hound', 'SPI').dir === true && FX('Nose of the Hound', null) === '{"actStealth":1}' && !rf('Nose of the Hound', 'spi').length && !rf('Nose of the Hound', 'SPI').length,
       'Nose of the Hound (v1.11.1, a wrong refusal fixed): [spi] \u2018As [aus] above, with an additional optional maneuver during that combat\u2019 is the locked rush with maneuverGrant 2; [SPI] \u2018As [spi] above, but enter combat with any ready minion controlled by another Methuselah\u2019 the same, its target unconditioned (the bot\u2019s own target set) -- got ' + FX('Nose of the Hound', 'spi') + ' / ' + FX('Nose of the Hound', 'SPI'));
    ok(FX('Donnybrook', 'pro') === '{"aggr":true,"handStrike":true,"handBonus":0}' && E('Donnybrook').anarchReq === true && E('Donnybrook').req.rangeClose === true && FX('Donnybrook', 'ser') === '{"stealBlood":2}' && !rf('Donnybrook', 'pro').length,
       'Donnybrook [pro] (v1.11.1, a wrong refusal fixed): \u2018Strike: hand strike, aggravated.\u2019 is handStrike + aggr + handBonus 0 (it had no number: the chooser never played it); the header (Anarch, close range) read -- got ' + FX('Donnybrook', 'pro'));
    const st = rf('Steely Tenacity', 'qui');
    ok(st.length === 1 && /^the header: If you would replace this card, instead you can take this card from your ash heap\.$/.test(st[0].why) && !anyKey('Steely Tenacity', 'rush') && FX('Steely Tenacity', 'qui') === '{"actStealth":1}',
       'Steely Tenacity [qui] (v1.11.1): still refused, and the reason names the unread HEADER sentence (the line\u2019s own \u2018[ACTION] +1 stealth action. \u24b9 Enter combat with a minion.\u2019 is read: its type bracket and its actStealth) -- got ' + JSON.stringify(st));
    const charge = rf('Charge of the Buffalo', 'SPI'), nose = rf('Nose of the Hound', 'SPI'), dag = rf("Dagon's Call", 'QUI'), lead = rf('Lead Fist', 'VIS');
    ok([charge, dag, lead].every(x => x.length === 1 && /^its reference is not read whole: As /.test(x[0].why)) && nose.length === 0 && rf('Withering', 'THN').length === 1 && rf('Cobra Fangs', 'SER').length === 1,
       'the refusal report lists an \u2018As [x] above\u2019 line of a refused mode the same way for every card (v1.11.1): Charge of the Buffalo [SPI] beside Dagon\u2019s Call [QUI] and Lead Fist [VIS] (and Withering [THN], Cobra Fangs [SER] ...); Nose of the Hound [SPI] is whole now'); }
  /* compiler v1.11.1 (R-data 5, the same misread class as the ban): a negated clause or an opponent's grant is never the player's own
     maneuver / press / dodge / additional strike. Target Vitals (pathdeath x4) was a press card for the bot. */
  ok(!M('Skin Trap', 'vic') && !M('Skin Trap', 'VIC') && !anyKey('Skin Trap', 'dodge') && !anyKey('Veil of Silence', 'dodge')
     && !anyKey('Shoulder Drop', 'press') && FX('Shoulder Drop', null) === '{"handStrike":true}' && !anyKey('Sympathetic Agony', 'press') && !anyKey('Target Vitals', 'press') && !anyKey('Target Head', 'press') && !anyKey('Target Head', 'addStrike')
     && !anyKey('Lapse', 'maneuver') && !anyKey('Terror Frenzy', 'maneuver') && !anyKey('Terror Frenzy', 'press') && !anyKey('Ni Dieu ni Ma\u00eetre', 'maneuver') && !anyKey('Imprison', 'maneuver') && !anyKey('Imprison', 'press')
     && !anyKey('Olid Loa', 'maneuver') && !anyKey('Olid Loa', 'press') && FX('Condemnation: Languid', 'DAI') === '{}' && M('Condemnation: Languid', 'DAI').dir === true && !anyKey('Rigor Mortis', 'addStrike') && !anyKey('Decompose', 'addStrike'),
     'NEGATIVES (v1.11.1): \u2018the opposing minion cannot dodge / maneuver / press\u2019, \u2018cannot use (any) additional strikes\u2019 and \u2018the attached minion cannot press\u2019 give the player nothing -- Skin Trap, Veil of Silence [QUI], Shoulder Drop, Sympathetic Agony, Target Vitals, Target Head, Lapse [tem], Terror Frenzy, Ni Dieu ni Ma\u00eetre, Imprison, Olid Loa, Condemnation: Languid [DAI], Rigor Mortis [pre], Decompose');
  ok(FX('Backstep', null) === '{"maneuver":true,"maneuverTo":"long"}' && FX('Pounce', null) === '{"handBonus":2,"handStrike":true}' && FX('Dive Bomb', null) === '{"maneuver":true,"actStealth":1}'
     && FX('Bloodform', 'VIC') === '{"press":true,"aggr":true}' && M('Bloodform', 'VIC').pressDir === 'end' && FX('Form of the Bat', 'pro') === '{"maneuver":true}' && FX('Foldable Machine Gun', null).indexOf('"maneuver":true') >= 0
     && FX('Rigor Mortis', 'thn') === '{"press":true}' && FX('Whistling Up the Beast', 'ABO') === '{"maneuver":true}',
     'the same reads keep what is the player\u2019s (v1.11.1): an opponent\u2019s \u2018gets an optional press\u2019 is cut (Backstep\u2019s own maneuver -- to long range since v1.11.3 --, Pounce\u2019s strike, Dive Bomb\u2019s maneuver stay); \u2018cannot strike and gets 1 optional press\u2019 keeps Bloodform [VIC]\u2019s press, \u2018gets 1 optional maneuver and cannot use equipment\u2019 Form of the Bat\u2019s, \u2018This maneuver cannot be used during the first round\u2019 the gun\u2019s; Rigor Mortis [thn] \u2018with an optional press\u2019 and Whistling Up the Beast [ABO]\u2019s own maneuver stay');
  { const ds = E('Deep Song'), cds = curated && curated.lib['Deep Song'];
    ok(ds.src === 'hand' && !ds.merged && !!cds && JSON.stringify(ds.modes) === JSON.stringify(cds.modes) && FX('Deep Song', 'ANI') === '{"rush":true,"lockTarget":true}',
       'Deep Song is its hand entry, unchanged: [ANI] rush + lockTarget (\u2018Enter combat with and lock a vampire\u2019), no rushTo or grant'); }
  /* the ban */
  ok(FX('Sanguine Entrapment', 'CEL+QUI') === '{"ceBan":"round"}' && !M('Sanguine Entrapment', 'cel+qui') && !anyKey('Sanguine Entrapment', 'dodge') && !anyKey('Sanguine Entrapment', 'strikeCE') && !anyKey('Sanguine Entrapment', 'combatEnds'),
     'Sanguine Entrapment: \u2018The opposing minion cannot strike: combat ends this round\u2019 is ceBan round, never a combat-ends strike; \u2018cannot strike: dodge\u2019 is never a dodge (that mode is gone: no key carries the dodge ban)');
  ok(FX('Mind of the Wilds', 'ani+aus') === '{"ceBan":"action","maneuver":true}' && FX('Mind of the Wilds', 'ANI+AUS') === '{"ceBan":"action","maneuver":true,"stealth":1}' && FX('Dog Pack', null) === '{"ceBan":"combat"}',
     'Mind of the Wilds: \u2018If this action is blocked, ... the blocking minion cannot strike: combat ends\u2019 is ceBan action ([LSJ 20100308]: for the duration of the action), its maneuver kept; Dog Pack: \u2018Minions in combat with the employer cannot strike: combat ends\u2019 is ceBan combat');
  { const banned = Object.keys(L).filter(n => anyKey(n, 'ceBan')).sort();
    ok(JSON.stringify(banned) === JSON.stringify(['Dog Pack', "Hunter's Mark", 'Mind of the Wilds', 'Sanguine Entrapment']) && banned.every(n => !anyKey(n, 'strikeCE') && !anyKey(n, 'combatEnds')),
       'the ban\u2019s volume: exactly the four cards that print \u2018cannot strike: combat ends\u2019 carry ceBan, none a strikeCE or combatEnds -- got ' + banned.join(', ')); }
  /* the hand strike */
  ok(FX('Blood Rage', 'tha') === '{"handStrike":true,"handBonus":0,"noPreventDisc":"for","nullOppWeapons":true}' && FX('Blood Rage', 'THA') === '{"handStrike":true,"handBonus":1,"noPreventDisc":"for","nullOppWeapons":true}' && E('Blood Rage').req.rangeClose === true,
     'Blood Rage (banuhaqim \u00d72): [tha] \u2018Strike: hand strike.\u2019 is handBonus 0 (a number: the chooser plays it), Fortitude-proof and weapons-null; [THA] \u2018As above, and this hand strike is at +1 damage\u2019 is handBonus 1 ([TOM 19960225]: it inherits the properties); close range only');
  ok(FX('Blood Fury', 'tha') === '{"handBonus":1,"handStrike":true,"noPreventDisc":"for","nullOppWeapons":true}' && FX('Blood Fury', 'THA') === '{"handBonus":2,"handStrike":true,"noPreventDisc":"for","nullOppWeapons":true}'
     && FX('Bollix', 'tha') === '{"handBonus":1,"handStrike":true,"noPreventDisc":"for","nullOppWeapons":true}' && FX('Bollix', 'cel') === '{"maneuver":true,"press":true}',
     'Blood Fury [THA] \u2018As above, but at +2 damage\u2019 is handBonus 2 (it read +1); Bollix [tha] gets both riders (its only strike mode prints them); Bollix [cel] unchanged');
  ok(FX('Soul Burn', 'tha') === '{"strike":1,"ranged":true,"noPreventDisc":"for","nullOppWeapons":true}' && FX('Soul Burn', 'THA') === '{"strike":2,"ranged":true,"noPreventDisc":"for","nullOppWeapons":true}' && E('Soul Burn').src === 'hand' && !E('Soul Burn').merged,
     'Soul Burn (banuhaqim, a whole hand entry): nullOppWeapons on both modes beside its noPreventDisc');
  ok(!anyKey('Soulgrinder', 'noPreventDisc') && !anyKey('Dead Hand', 'noPreventDisc') && FX('Soulgrinder', 'THA') === '{"handBonus":2,"handStrike":true}' && FX('Dead Hand', 'NEC') === '{"handBonus":1,"handStrike":true}'
     && !anyKey('Personal Scourge', 'nullOppWeapons') && !anyKey('Personal Scourge', 'noPreventDisc'),
     'NEGATIVES: Soulgrinder and Dead Hand print the Fortitude rider at superior only -- the struck bot reads the key by the card\u2019s name, so neither gets it; Personal Scourge\u2019s \u2018equipment or cards requiring Fortitude\u2019 is another sentence (no riders)');
  ok(['Cobra Fangs|ser', 'Dagon\'s Call|qui', 'Dagon\'s Call|QUI', 'Withering|thn', 'Creeping Infection|thn', 'Anesthetic Touch|obe', 'Grasp of the Python|ser'].every(x => { const [n, at] = x.split('|'); const mo = M(n, at); return !!mo && mo.fx.handStrike === true && mo.fx.handBonus === undefined; })
     && FX('Lead Fist', 'VIS') === '{"handBonus":2,"handStrike":true,"press":true}' && FX('Lead Fist', 'vis') === '{"handBonus":1,"handStrike":true,"press":true}',
     'NEGATIVES: a hand strike with a rider no key reads gets no handBonus 0 (Cobra Fangs, Dagon\u2019s Call both levels, Withering, Creeping Infection, Anesthetic Touch, Grasp of the Python); Lead Fist [VIS] \u2018As [vis] above, but at +2 damage\u2019 keeps its compiled keys (its reference [vis] is not whole) at the text\u2019s +2 (v1.11.1: the inherited +1 was a wrong value)');
  { const zero = Object.keys(L).filter(n => (L[n].modes || []).some(mo => mo.fx && mo.fx.handBonus === 0)).sort(), nw = Object.keys(L).filter(n => anyKey(n, 'nullOppWeapons')).sort(), np = Object.keys(L).filter(n => anyKey(n, 'noPreventDisc')).sort();
    ok(JSON.stringify(zero) === '["Blood Rage","Donnybrook","Sculpt the Flesh"]' && L['Sculpt the Flesh'].src === 'hand' && JSON.stringify(nw) === '["Blood Fury","Blood Rage","Bollix","Soul Burn"]' && JSON.stringify(np) === '["Blood Fury","Blood Rage","Bollix","Soul Burn"]',
       'the hand strike\u2019s volume: handBonus 0 on Blood Rage and Donnybrook (compiled; v1.11.1: + Donnybrook) and Sculpt the Flesh (its hand entry, V5 wave 1); nullOppWeapons and noPreventDisc on Blood Fury, Blood Rage, Bollix and Soul Burn -- got ' + [zero, nw, np].map(x => x.join(', ')).join(' / ')); }
  /* the animal marker */
  { const an = Object.keys(L).filter(n => L[n].animal === true).sort();
    ok(an.length === 13 && an.every(n => L[n].t.includes('retainer')) && L['Raven Spy'].animal === true && L['Dog Pack'].animal === true && L['Murder of Crows'].animal === true && L['Murder of Crows'].src === 'hand'
       && !L['Mr. Winthrop'].animal && !L['Corpse Balloon'].animal && !L['Underbridge Stray'].animal,
       'animal: the 13 retainers printed \u2018Animal with N life\u2019 (Raven Spy, Dog Pack ...; Murder of Crows\u2019 hand entry keeps it, as the zombie marker); not Mr. Winthrop (a mortal), Corpse Balloon (a ghoul) or the animal ALLY Underbridge Stray -- got ' + an.length); }
  /* the first merged entries (spec-card-sweep \u00a74.4): each is the compiled entry with its layer applied */
  { const NM = ['Biothaumaturgic Experiment', 'Shadow of the Beast', 'New Moon Sigil', 'Priority Contract', 'Night Terrors', 'Haven Uncovered'];
    const B0 = compile(cards.filter(c => NM.includes(c.name)), null).out.lib, cl = v => JSON.parse(JSON.stringify(v));
    const strip = e => { const o = cl(e); delete o.note; return o; };
    const be = cl(B0['Biothaumaturgic Experiment']); delete be.modes[1].fx.maneuver; Object.assign(be.modes[1].fx, { maneuverEach: 1, strengthBonus: 1, attach: 'own' }); be.modes.push({ at: 'tha', fx: { employAnimal: true } });
    Object.assign(be, { src: 'hand', merged: true, handKeys: ['attach', 'employAnimal', 'maneuverEach', 'strengthBonus'] });
    ok(JSON.stringify(strip(E('Biothaumaturgic Experiment'))) === JSON.stringify(be) && E('Biothaumaturgic Experiment').cost.pool === 1 && M('Biothaumaturgic Experiment', null).fx.actStealth === 1,
       'Biothaumaturgic Experiment (merged): [THA] maneuverEach 1, strengthBonus 1, attach own (its compiled maneuver deleted), [tha] employAnimal added; the +1 stealth action, the 1 pool, [tha] and persistent are the compiler\u2019s -- got ' + JSON.stringify(strip(E('Biothaumaturgic Experiment'))));
    const sb = cl(B0['Shadow of the Beast']); delete sb.modes[0].fx.maneuver; Object.assign(sb.modes[0].fx, { maneuverEach: 1, attach: 'self' }); delete sb.modes[1].fx.maneuver; delete sb.modes[1].fx.press; delete sb.src; Object.assign(sb, { oncePerVampire: true, src: 'hand', merged: true, handKeys: ['attach', 'maneuverEach'] });   // oncePerVampire: 'A vampire may have only one Shadow of the Beast' (bot v0.6.236, B2: the attach finder's guard)   // v1.11.3 (pass 2, F5): [PRO]'s two misread keys nulled
    const nm = cl(B0['New Moon Sigil']); { const mo = nm.modes.find(x => x.at === 'spi'); delete mo.fx.maneuver; Object.assign(mo.fx, { maneuverEach: 1, attach: 'ownVampire' }); const mS = nm.modes.find(x => x.at === 'SPI'); delete mS.fx.maneuver; delete mS.fx.actStealth; } delete nm.src; Object.assign(nm, { oncePerVampire: true, src: 'hand', merged: true, handKeys: ['attach', 'maneuverEach'] });   // 'A vampire can have only one New Moon Sigil'   // v1.11.3 (pass 2, F5): [SPI]'s two misread keys nulled
    ok(JSON.stringify(strip(E('Shadow of the Beast'))) === JSON.stringify(sb) && JSON.stringify(strip(E('New Moon Sigil'))) === JSON.stringify(nm) && FX('Shadow of the Beast', 'PRO') === '{}' && FX('New Moon Sigil', 'SPI') === '{}' && FX('New Moon Sigil', null) === '{"actStealth":1}',
       'Shadow of the Beast [pro] (attach self: \u2018on the acting vampire\u2019) and New Moon Sigil [spi] (attach ownVampire: \u2018a vampire you control\u2019): maneuverEach 1, the compiled maneuver deleted, oncePerVampire (\u2018a vampire can have only one\u2019); [PRO] and [SPI] carry a rider no key reads: their compiled keys (the grant and the rider misread as card plays: maneuver + press, maneuver + actStealth) are nulled, an empty mode each (v1.11.3, pass 2, F5; the header\u2019s +1 stealth action stays New Moon Sigil\u2019s base mode)');
    const pc = cl(B0['Priority Contract']); pc.modes = [{ at: null, fx: { rushGrant: 1, rushBy: 'chosen', hostOf: 'prey', poolOnHostLeave: 3 } }]; Object.assign(pc, { src: 'hand', merged: true, handKeys: ['hostOf', 'poolOnHostLeave', 'rushBy', 'rushGrant'] });
    ok(JSON.stringify(strip(E('Priority Contract'))) === JSON.stringify(pc) && E('Priority Contract').unique === true && E('Priority Contract').trifle === true && E('Priority Contract').persistent === true && JSON.stringify(E('Priority Contract').req) === '{"clan":["Banu Haqim"]}'
       && !anyKey('Priority Contract', 'poolGain') && !anyKey('Priority Contract', 'stealth') && !M('Priority Contract', null).dir,
       'Priority Contract (merged): the misread mode (a directed +1 stealth gaining 3 pool) dropped; rushGrant 1, rushBy chosen, hostOf prey, poolOnHostLeave 3 added; the clan, unique, trifle and persistent are the compiler\u2019s');
    const nt = cl(B0['Night Terrors']); { const mo = nt.modes.find(x => x.at === 'OBF+PRE'); delete mo.fx.combatEnds; delete mo.fx.strikeCE; mo.fx.ceGrant = 'r1'; } Object.assign(nt, { src: 'hand', merged: true, handKeys: ['ceGrant'] });
    ok(JSON.stringify(strip(E('Night Terrors'))) === JSON.stringify(nt) && FX('Night Terrors', 'OBF+PRE') === '{"stealthToZero":true,"ceGrant":"r1"}' && FX('Night Terrors', 'obf+pre') === '{"stealthToZero":true}',
       'Night Terrors (merged): [OBF][PRE] ceGrant r1 (\u2018if this vampire blocks, they can strike: combat ends during the first round\u2019), its compiled strikeCE and combatEnds deleted; [obf][pre] and the cost are the compiler\u2019s');
    ok(JSON.stringify(E('Haven Uncovered').modes) === '[{"at":null,"fx":{"rushGrant":1}}]' && !E('Haven Uncovered').merged,
       'Haven Uncovered is unchanged (rushGrant 1; no rushBy or hostOf: the bot reads their absence as any)'); }
}
/* end: the Banu Haqim pilot */
/* compiler v1.11.2 (the pilot's review of executor B2, P7): the contract keyword and the vampire that bars contracts */
{
  const L = res.out.lib, Cr = res.out.crypt;
  const con = Object.keys(L).filter(n => L[n].contract === true).sort(), noC = Object.keys(Cr).filter(n => Cr[n].noContracts === true).sort();
  ok(JSON.stringify(con) === JSON.stringify(['Clandestine Contract', 'Contract', 'Dirty Contract', 'Hand Contract', "Haqim's Law: Judgment", 'Priority Contract', 'Shakar: the Hunt'])
     && JSON.stringify(noC) === '["Iliana (G2)"]' && Cr['Iliana (G2)'].sect === 'Camarilla' && !Cr['Husamettin (G2)'].noContracts && !Cr['Zahir, Hand of the Silsila (G2)'].noContracts,
     'the contract keyword (\u2018Contract.\u2019 / \u2018Unique contract.\u2019) marks exactly the seven contracts; \u2018Contracts cannot be placed on Iliana.\u2019 marks Iliana (G2) alone (Husamettin and Zahir only name contracts) -- got ' + con.join(', ') + ' / ' + noC.join(', '));
}
/* compiler v1.11.3 (the pilot's review, pass 2: F1-F3, F7, F9). The real entries pinned first (each reading checked against KRCG's text in
   vtes.json), then each shape on a SYNTHETIC library (fixtures, not cards) so the rule is held where no real card reaches it today. */
{
  console.log('\nThe pilot’s review, pass 2 (compiler v1.11.3): other people’s sentences, the press step, maneuverTo, ‘As above, but’ with its own strike, flight, the markers’ survival');
  const { extractFx, cryptEntry, libModes } = require('./cardfx-compile.js');
  const L = res.out.lib, Cr = res.out.crypt, M = (n, at) => ((L[n] && L[n].modes) || []).find(mo => (mo.at === undefined ? null : mo.at) === at) || null;
  const FX = (n, at) => JSON.stringify((M(n, at) || { fx: 'none' }).fx), anyKey = (n, k) => ((L[n] && L[n].modes) || []).some(mo => mo.fx && mo.fx[k] !== undefined);
  const noModes = n => !!L[n] && !(L[n].modes || []).length;
  /* F2: a sentence that is not the player's never writes the player's key */
  ok(FX("Dagon's Call", 'qui') === '{"handStrike":true}' && FX("Dagon's Call", 'QUI') === '{"handStrike":true}' && FX('Crawling Chamber', 'vis') === '{"maneuver":true,"press":true}' && !M('Crawling Chamber', 'VIS')
     && !M('Drawing Out the Beast', 'ANI') && L['Drawing Out the Beast'].frenzy === 'opp' && FX('Necrosis', 'THN') === '{"handBonus":2,"handStrike":true}' && !M('Improvised Tactics', 'aus') && FX('Improvised Tactics', 'pro') === '{"maneuver":true}'
     && FX('Expiate', null) === '{"combatEnds":true}' && noModes('Momentary Delay') && FX('Ron Zertnert, S.A.D. Agent', null) === '{"prevent":1,"strike":1,"ranged":true}' && FX('Battle Frenzy', null) === '{"addStrike":true}',
     'F2, ‘the press step’ is a time word, never a press: Dagon’s Call (both levels), Crawling Chamber [VIS] (no mode left; [vis] ‘Maneuver or press’ stays), Drawing Out the Beast [ANI] (the entry’s frenzy stays), Necrosis [THN], Improvised Tactics [aus], Expiate, Momentary Delay, Ron Zertnert, Battle Frenzy -- got ' + FX("Dagon's Call", 'qui') + ' / ' + FX('Necrosis', 'THN'));
  ok(FX('Decompose', 'THN') === '{}' && M('Decompose', 'THN').dir === true && noModes('Wave of Lethargy') && L['Wave of Lethargy'].cost.blood === 1,
     'F2, an opponent’s cost is not the player’s maneuver or press: Decompose [THN] (‘presses cost the attached minion 1 additional blood’), Wave of Lethargy both levels (‘Cards providing maneuvers and/or presses cost the opposing vampire ...’) -- got ' + FX('Decompose', 'THN'));
  ok(noModes('Target Leg') && noModes('Creep Show') && L['Creep Show'].archetype === true && FX('Rigor Mortis', 'THN') === '{"press":true}' && FX('Rigor Mortis', 'thn') === '{"press":true}',
     'F2, a restriction, a trigger and a cancel are no grant: Target Leg (‘he or she may use maneuvers or presses only if ...’), Creep Show (‘when a minion opposing this vampire ... dodges’), Rigor Mortis [THN] (‘you may cancel a maneuver used by the opposing minion’; its inherited press stays) -- got ' + FX('Rigor Mortis', 'THN'));
  ok(noModes('Concealed Weapon') && FX('Psychic Assault', 'aus') === '{"strike":1,"ranged":true}' && !anyKey('Psychic Assault', 'aggr') && FX('Walk of Flame', 'tha') === '{"aggr":true,"strike":1,"ranged":true}' && FX('Body Flare', 'pro') === '{"aggr":true,"strike":2}',
     'F2, ‘aggravated’ in a negated clause (Concealed Weapon: ‘The weapon cannot ... inflict ... aggravated damage’) or a neutralised one (Psychic Assault: ‘Any effect which would make damage from this strike aggravated leaves the damage normal’) is no aggr; Walk of Flame and Body Flare keep theirs');
  /* F1 (the compile side): maneuverTo, Taming the Beast */
  { const want = { Amria: ['chi', 'long'], "Angel's Gift": [null, 'close'], Backstep: [null, 'long'], 'Blade of Bellona': [null, 'close'], 'Crawling Chamber': ['tha', 'long'], 'Dance with the Devil': ['OBF', 'close'],
      'Dark Steel': ['obt+pot', 'close'], 'High Ground': [null, 'long'], Leapfrog: ['obf', 'long'], Repulsion: ['pre', 'long'], 'Shadow Boxing': ['obf+pot', 'close'], Slam: ['POT', 'close'], Swoop: [null, 'close'] };
    const carriers = Object.keys(L).filter(n => anyKey(n, 'maneuverTo')).sort();
    ok(JSON.stringify(carriers) === JSON.stringify(Object.keys(want).sort()) && Object.keys(want).every(n => (M(n, want[n][0]) || { fx: {} }).fx.maneuverTo === want[n][1] && M(n, want[n][0]).fx.maneuver === true)
       && ['obf', 'tha', 'OBF', 'THA'].every(at => FX('Dance with the Devil', at) === '{"maneuver":true,"maneuverTo":"close"}') && FX('Leapfrog', 'spi') === '{"maneuver":true}' && L.Slam.src === 'hand',
       'F1, maneuverTo: ‘Maneuver, only usable to go / get to long / close range’ (and ‘1 optional maneuver (this round / each combat), only usable to ...’) on exactly the 13 cards that print it (Slam’s hand entry among them, unchanged); Leapfrog [spi]’s plain maneuver none -- got ' + carriers.join(', ')); }
  ok(FX('Taming the Beast', 'abo') === '{"handStrike":true}' && !M('Taming the Beast', 'ABO') && FX('Pounce', null) === '{"handBonus":2,"handStrike":true}' && FX('Stutter-Step', 'CEL') === '{"dodge":true,"addStrike":true,"handStrike":true}',
     'F1, a hand strike beside ‘this minion cannot’ is not certified: Taming the Beast [abo] (‘This combat, this minion cannot cancel frenzy cards nor press to end’) keeps handStrike, no handBonus (the chooser never plays it); its [ABO] ‘As above, but strike: burn equipment’ has no strike left (F3); Pounce keeps +2 (its [FLIGHT] is the bot’s gate); Stutter-Step [CEL] (no bonus) unchanged -- got ' + FX('Taming the Beast', 'abo'));
  /* F3: 'As above, but' with its own strike */
  ok(FX('Coagulate Blood', 'QUI') === '{"strike":2,"ranged":true}' && FX('Coagulate Blood', 'qui') === '{"strike":1,"ranged":true}' && FX('Psychic Assault', 'AUS') === '{"strike":2,"ranged":true}'
     && FX('Starvation of Marena', 'VIC') === '{"press":true,"strike":3,"ranged":true}' && FX('Eldritch Glimmer', 'THA') === '{"strike":4,"ranged":true}' && FX('Eldritch Glimmer', 'tha') === '{"strike":2,"ranged":true}'
     && FX('Soul Burn', 'THA') === '{"strike":2,"ranged":true,"noPreventDisc":"for","nullOppWeapons":true}' && FX('Charge of the Buffalo', 'SPI') === '{"handBonus":2,"handStrike":true}' && FX('Blood Fury', 'THA') === '{"handBonus":2,"handStrike":true,"noPreventDisc":"for","nullOppWeapons":true}',
     'F3, ‘As above, but for NR damage’ is its own strike: Coagulate Blood [QUI] 2R, Psychic Assault [AUS] 2R, Starvation of Marena [VIC] 3R (its press stays), Eldritch Glimmer [THA] ‘4R + X ranged’ is 4R, its floor (pass 3); Soul Burn’s hand entry unchanged; D1’s ‘but at +N damage’ unchanged (Charge of the Buffalo, Blood Fury) -- got ' + FX('Coagulate Blood', 'QUI') + ' / ' + FX('Eldritch Glimmer', 'THA'));
  /* flight on the crypt (F1) */
  { const fl = Object.keys(Cr).filter(n => Cr[n].flight === true), printed = cards.filter(c => (c.types || []).includes('Vampire') && /Flight \[FLIGHT\]/.test(c.card_text || '')).map(c => c.name);
    ok(fl.length === 26 && JSON.stringify(fl.slice().sort()) === JSON.stringify(printed.slice().sort()) && Cr['Chalcedony (G6)'].flight === true && !Cr['Chalcedony (G6)'].disc.all.includes('flight') && !Object.keys(Cr).some(n => ((Cr[n].disc || {}).all || []).includes('flight'))
       && JSON.stringify(L.Pounce.req.disc) === '["flight"]',
       'flight: the 26 vampires that print ‘Flight [FLIGHT].’ (KRCG codes it in the text, not the disciplines) carry crypt flight, the bot’s gate for a card requiring [FLIGHT] (req.disc ‘flight’) -- got ' + fl.length); }
  /* the shapes on synthetic text (extractFx, libModes, cryptEntry, compile) */
  const X = s => JSON.stringify(extractFx(s)), LM = s => JSON.stringify(libModes(s).map(mo => [mo.at, mo.fx]));
  ok(X('Strike: 2 damage. The opposing minion takes 1 damage during the press step.') === '{"strike":2}' && X('Press, only usable to continue combat. During the press step, draw a card.') === '{"press":true}'
     && X('Maneuvers and presses cost the opposing minion 1 additional blood this round.') === '{}' && X('Cards providing presses cost the blocking vampire 1 additional blood.') === '{}'
     && X('The opposing minion may use maneuvers only if they require Celerity.') === '{}' && X('Strike: 1 damage. You may cancel a press used by the opposing minion.') === '{"strike":1}'
     && X('When a minion opposing this vampire dodges, gain 1 pool.') === '{"poolGain":1}' && X('Maneuver. When a minion opposing this vampire dodges, gain 1 pool.') === '{"poolGain":1,"maneuver":true}',
     'SYNTHETIC (F2): the press step is no press (a real press beside it stays); an opponent’s cost, a restriction (‘may use maneuvers only if’), a cancel and the opponent’s act as a trigger write nothing of the player’s (a maneuver of its own beside them stays)');
  ok(X('This minion cannot inflict aggravated damage this round.') === '{}' && X('Strike: 1R damage. Any effect which would make this damage aggravated leaves it normal.') === '{"strike":1,"ranged":true}' && X('Strike: 2 aggravated damage.') === '{"aggr":true,"strike":2}',
     'SYNTHETIC (F2): ‘aggravated’ in a negated or a neutralised (‘would make ... aggravated’) sentence is no aggr; a plain aggravated strike is');
  ok(X('Maneuver, only usable to get to close range.') === '{"maneuver":true,"maneuverTo":"close"}' && X('This minion gets 1 optional maneuver this round, only usable to go to long range.') === '{"maneuver":true,"maneuverTo":"long"}'
     && X('Maneuver. This minion gets 1 additional maneuver, only usable to get to long range.') === '{"maneuver":true}' && X('Maneuver, only usable to get to close range, and 1 additional maneuver, only usable to go to long range.') === '{"maneuver":true}'
     && LM('[pot] Maneuver, only usable to go to long range.\n[POT] As above, and this minion gets an optional maneuver.') === '[["pot",{"maneuver":true,"maneuverTo":"long"}],["POT",{"maneuver":true}]]'
     && LM('[pot] Maneuver, only usable to go to long range.\n[POT] As above, and press.') === '[["pot",{"maneuver":true,"maneuverTo":"long"}],["POT",{"maneuver":true,"maneuverTo":"long","press":true}]]'
     && LM('[pot] Maneuver, only usable to go to long range.\n[pot] Maneuver.') === '[["pot",{"maneuver":true}]]',
     'SYNTHETIC (F1): maneuverTo only when every maneuver of the text is that one direction -- an unrestricted maneuver beside it (the same sentence, an ‘As above’ line’s own, a second line at the same level) or two directions write none; an ‘As above’ line inherits it');
  ok(X('Strike: hand strike at +2 damage. This minion cannot press this round.') === '{"handStrike":true}' && X('Strike: hand strike at +2 damage. The opposing minion cannot press this round.') === '{"handBonus":2,"handStrike":true}'
     && X('Strike: hand strike at +1 damage. This vampire cannot use additional strikes this round.') === '{"handStrike":true}',
     'SYNTHETIC (F1): a hand strike with ‘this minion / vampire cannot’ gets no handBonus (handStrike stays); an opponent’s ‘cannot’ leaves the bonus');
  ok(LM('[pot] Strike: 1R damage.\n[POT] As above, but for 3R damage.') === '[["pot",{"strike":1,"ranged":true}],["POT",{"strike":3,"ranged":true}]]'
     && LM('[pot] Strike: hand strike at +1 damage.\n[POT] As above, but for 2 damage.') === '[["pot",{"handBonus":1,"handStrike":true}],["POT",{"strike":2}]]'
     && LM('[pot] Strike: 2R aggravated damage.\n[POT] As above, but for 3R damage.') === '[["pot",{"aggr":true,"strike":2,"ranged":true}],["POT",{"strike":3,"ranged":true}]]'
     && LM('[pot] Strike: 2R damage.\n[POT] As above, but for 3R + X ranged damage.') === '[["pot",{"strike":2,"ranged":true}],["POT",{"strike":3,"ranged":true}]]'
     && LM('[pot] Strike: hand strike at +1 damage.\n[POT] As above, but strike: steal 1 blood.') === '[["pot",{"handBonus":1,"handStrike":true}],["POT",{"stealBlood":1}]]'
     && LM('[pot] Strike: hand strike at +1 damage.\n[POT] As above, but strike: burn equipment.') === '[["pot",{"handBonus":1,"handStrike":true}]]'
     && LM('[pot] Strike: 2 damage.\n[POT] As above, but for 3 unpreventable damage.') === '[["pot",{"strike":2}]]'
     && LM('[pot] Strike: hand strike at +1 damage.\n[POT] As above, and at +3 damage.') === '[["pot",{"handBonus":1,"handStrike":true}],["POT",{"handBonus":1,"handStrike":true}]]'
     && LM('[pot] Strike: hand strike at +1 damage.\n[POT] As above, but at +3 damage.') === '[["pot",{"handBonus":1,"handStrike":true}],["POT",{"handBonus":3,"handStrike":true}]]'
     && LM('[pot] Prevent 1 damage.\n[POT] As above, but for 2 damage.') === '[["pot",{"prevent":1}],["POT",{"prevent":1}]]',
     'SYNTHETIC (F3): ‘As above, but for N(R) damage’ replaces the inherited strike (a hand strike or an aggravated one too), ‘for NR + X ranged damage’ is its floor N (pass 3), any other ‘but’ strike keeps only the line’s own reading (steal 1 blood; burn equipment: nothing); ‘As above, and at +N’ is no replacement (D1e), ‘but at +N’ is (D1); over a reference with no strike nothing changes');
  ok(X('This minion cannot strike this round and may press to continue combat.') === '{"press":true}' && X('This minion cannot strike this round and gets 1 optional press.') === '{"press":true}'
     && X('Strike: 1 damage. The opposing minion gets an optional maneuver.') === '{"strike":1}' && X('Strike: 1 damage. The blocking minion gets 1 optional press.') === '{"strike":1}',
     'SYNTHETIC (F9, mutants N04 and N07): the negation’s strip stops at ‘and may’ as at ‘and gets’ (the subject’s own press stays); an opponent’s ‘gets an optional maneuver’ is cut as its ‘press’ is');
  /* The pilot's review, pass 3 (data finding 4): synthetic cases for the branches and alternatives no real card reaches (each was a
     surviving mutant: F3k, F3g, F1h, F1n, F1o, F2d, F2j, F2m, F2n, F2r, F1e, F3i) */
  { const ce3 = t => cryptEntry({ name: 'Syn Vampire', capacity: 6, card_text: t, disciplines: ['pot'], clans: ['Gargoyle'] });
    ok(LM('[pot] Strike: 1R damage.\n[POT] As above, but strike: 3R damage.') === '[["pot",{"strike":1,"ranged":true}],["POT",{"strike":3,"ranged":true}]]'
       && LM('[pot] Strike: 1R damage.\n[POT] As above, but for 3 damage.') === '[["pot",{"strike":1,"ranged":true}],["POT",{"strike":3}]]'
       && LM('[pot] This strike is at +1 damage.\n[POT] As above, but for 3 damage.') === '[["pot",{"handBonus":1}],["POT",{"strike":3}]]',
       'SYNTHETIC (pass 3, F3k F3g F3i): ‘As above, but strike: 3R damage’ keeps the line’s own strike; an inherited ‘ranged’ goes with the inherited strike (‘but for 3 damage’ is melee); a reference with only a hand bonus is a strike to replace');
    ok(X('Maneuver, only usable to go to long range. The opposing minion cannot maneuver this round.') === '{"maneuver":true,"maneuverTo":"long"}' && X('Maneuver only usable to go to long range.') === '{"maneuver":true}'
       && ce3('Camarilla: Syn Vampire may burn 1 blood to gain Flight [FLIGHT] this turn.').flight === undefined && ce3('Camarilla: Flight [FLIGHT] costs this vampire 1 blood each turn.').flight === undefined,
       'SYNTHETIC (pass 3, F1h F1e F1n F1o): maneuverTo counts the maneuvers left after the opponent’s clauses are stripped, and needs the comma; crypt flight is the keyword sentence only (not a gained Flight, not one that runs on)');
    ok(X('Strike: 1 damage. Maneuvers and presses cost the opposing monster 1 blood each.') === '{"strike":1}' && X('Cancel a dodge as it is played.') === '{}' && X('Cancel an additional strike as it is played.') === '{}'
       && X('If a minion opposing the attached vampire presses, it burns 1 blood.') === '{}' && X('If a minion opposing that vampire maneuvers, it burns 1 blood.') === '{}' && X('If a minion opposing this imbued presses, it burns 1 blood.') === '{}'
       && X('Strike: 2 damage. Any card that would make this damage aggravated has no effect, and it is not aggravated.') === '{"strike":2}'
       && X('Strike: 2 damage. Aggravated damage from cards that would make this strike aggravated is normal damage.') === '{"strike":2}',
       'SYNTHETIC (pass 3, F2d F2j F2m F2n F2r): the strips’ other objects -- a monster’s cost, a cancelled dodge or additional strike, a minion opposing the attached / that vampire or an imbued, a whole ‘would make ... aggravated’ sentence -- write no key of the player’s'); }
  { const ce = t => cryptEntry({ name: 'Syn Vampire', capacity: 6, card_text: t, disciplines: ['pot'], clans: ['Gargoyle'] });
    ok(ce('Camarilla: Contracts cannot be placed on Syn Vampire. Tremere slave.').noContracts === true && ce('Camarilla: Once each turn, Syn Vampire may burn a contract on a minion she controls; contracts cannot be placed on her allies.').noContracts === undefined
       && ce('Camarilla: Flight [FLIGHT]. Tremere slave.').flight === true && ce('Camarilla: Flight [FLIGHT]').flight === true && ce('Camarilla: Syn Vampire cannot be blocked by minions with flight [FLIGHT].').flight === undefined,
       'SYNTHETIC (F9, mutant P7c; F1): noContracts only for a sentence ‘Contracts cannot be placed on <name>.’ (a lowercase clause about her allies is none); flight only for the keyword sentence ‘Flight [FLIGHT]’ (a minion’s flight in a condition is none)'); }
  /* F9 (D2j, D2k): the whole-mode guards on an 'As above' line and a one-sentence line */
  { let sid = 991000; const C = (name, types, text, disc) => ({ id: sid++, name, _name: name, printed_name: name, types, card_text: text, disciplines: disc || [], clans: [], rulings: [] });
    const sr = compile([C('Syn But Additional', ['Action'], '[cel] Ⓓ Enter combat with a minion.\n[CEL] As above, but with an additional optional maneuver during that combat.', ['cel'])], null);
    const sl = sr.out.lib['Syn But Additional'], sm = at => JSON.stringify(((sl.modes || []).find(mo => mo.at === at) || { fx: 'none' }).fx), refd = (sr.wholeRefused || []).filter(r => r.name === 'Syn But Additional').map(r => r.at);
    ok(sm('cel') === '{"rush":true}' && sm('CEL') === '{"maneuver":true}' && JSON.stringify(refd) === '["CEL"]',
       'SYNTHETIC (F9, mutant D2k): ‘As above, BUT with an additional optional maneuver’ is not the ‘with an additional optional maneuver’ clause the rush reads: the line is refused and listed (only the clause with neither ‘and’ nor ‘but’ is read, Nose of the Hound [spi]) -- got ' + sm('CEL') + ' refused ' + JSON.stringify(refd)); }
  /* F7: P7's markers survive a curated (whole-entry) overlay */
  { let sid = 992000; const C = (name, types, text, extra) => Object.assign({ id: sid++, name, _name: name, printed_name: name, types, card_text: text, disciplines: [], clans: [], rulings: [] }, extra || {});
    const syn = [C('Syn Contract', ['Master'], 'Contract. Trifle.\nPut this card on a ready minion.'), C('Syn Iliana', ['Vampire'], 'Camarilla: Contracts cannot be placed on Syn Iliana.', { capacity: 5, disciplines: ['aus'] }),
      C('Syn Gargoyle', ['Vampire'], 'Camarilla: Flight [FLIGHT]. Tremere slave.', { capacity: 6, disciplines: ['pot'] })];
    const cur = { lib: { 'Syn Contract': { t: ['master'], modes: [{ at: null, fx: { rushGrant: 1 } }], note: 'fixture' } }, crypt: { 'Syn Iliana': { cap: 5, clan: 'Fixture', disc: { all: ['aus'], sup: [] }, note: 'fixture' }, 'Syn Gargoyle': { cap: 6, disc: { all: ['pot'], sup: [] }, note: 'fixture' } } };
    const a = compile(syn, null).out, b = compile(syn, cur).out;
    ok(a.lib['Syn Contract'].contract === true && b.lib['Syn Contract'].src === 'hand' && b.lib['Syn Contract'].contract === true && a.crypt['Syn Iliana'].noContracts === true && b.crypt['Syn Iliana'].src === 'hand' && b.crypt['Syn Iliana'].noContracts === true
       && b.crypt['Syn Gargoyle'].flight === true && b.crypt['Syn Gargoyle'].src === 'hand',
       'PLANTED (F7): a whole-entry curated contract keeps the compiler’s contract marker, a curated Iliana its noContracts, a curated Gargoyle its flight (as anarchReq, zombie, animal ... survive) -- got ' + JSON.stringify([b.lib['Syn Contract'].contract, b.crypt['Syn Iliana'].noContracts, b.crypt['Syn Gargoyle'].flight])); }
}
/* The whole-mode guards on SYNTHETIC libraries (compiler v1.11.1, the pilot's review R-data 6): no real card exercises these guards (15
   mutants of the v1.11.0 rule survived the real library), so each gets a small library of its own, compiled in-process, or a planted
   compiled entry read by wholeModes directly (a guard no text the readers accept can reach today). Each card is a fixture, not a card. */
{
  console.log('\nThe whole-mode guards on synthetic libraries (compiler v1.11.1)');
  const { wholeModes } = require('./cardfx-compile.js');
  let sid = 990000;
  const C = (name, types, text, disc) => ({ id: sid++, name, _name: name, printed_name: name, types, card_text: text, disciplines: disc || [], clans: [], rulings: [] });
  const SYN = [
    C('Syn Grant First Round', ['Action'], '[cel] Ⓓ Enter combat with a minion. This acting vampire gets 1 optional maneuver during the first round of that combat.', ['cel']),
    C('Syn Grant Continue Maneuver', ['Action'], '[cel] Ⓓ Enter combat with a minion. This acting vampire gets 1 optional maneuver, only usable to continue combat, during that combat.', ['cel']),
    C('Syn Press Continue', ['Action'], '[cel] Ⓓ Enter combat with a minion. This acting vampire gets 1 optional press, only usable to continue combat, during that combat.', ['cel']),
    C('Syn Header Unread', ['Action'], 'Only usable during a full moon.\n[cel] Ⓓ Enter combat with a minion.', ['cel']),
    C('Syn Header Requires', ['Action'], 'Requires a Sabbat vampire.\n[cel] Ⓓ Enter combat with a minion.', ['cel']),
    C('Syn Header Anarch', ['Action'], 'Requires an Anarch.\n[cel] Ⓓ Enter combat with a minion.', ['cel']),
    C('Syn Odd Bracket', ['Action'], '[cel] Ⓓ Enter combat with a minion.\n[FLIGHT] +1 stealth action.', ['cel']),
    C('Syn As Ref Level', ['Action'], '[cel] Ⓓ Enter combat with a minion. This acting vampire gets 1 optional press during that combat.\n[pot] Ⓓ Enter combat with a locked minion.\n[CEL] As [cel] above, and this acting vampire gets 1 optional maneuver during that combat.', ['cel', 'pot']),
    C('Syn Ban Scope', ['Action'], '[cel] Ⓓ Enter combat with a minion. The opposing minion cannot strike: combat ends during the second round of that combat.', ['cel']),
    C('Syn Ban NoScope', ['Combat'], '[cel] Strike: 2 damage. The opposing minion cannot strike: combat ends during the second round.', ['cel']),
    C('Syn As Above Adds', ['Combat'], '[pot] Strike: hand strike at +1 damage.\n[POT] As above, and this hand strike is at +1 damage.', ['pot']),
    C('Syn Shared Level', ['Combat'], '[pot] Strike: hand strike.\n[pot] Strike: hand strike.', ['pot']),
    C('Syn Strike Extra', ['Combat'], '+1 stealth action. Strike: hand strike.', []),
    C('Syn Null', ['Combat'], "[tha] Strike: hand strike. The opposing vampire's strikes with weapons inflict no damage this round.", ['tha']),
    C('Syn Null Wide', ['Combat'], "[tha] Strike: hand strike. The opposing minion's strikes with weapons inflict no damage this round.", ['tha']),
    C('Syn NoPrev', ['Combat'], '[tha] Strike: hand strike. Damage from this strike cannot be prevented by cards requiring Fortitude [for].', ['tha']),
    C('Syn NoPrev Wide', ['Combat'], '[tha] Strike: hand strike. Damage from this strike cannot be prevented by equipment or cards requiring Fortitude [for].', ['tha']),
    C('Syn Own Stealth', ['Action'], '[cel] +2 stealth action. Ⓓ Enter combat with a minion.', ['cel']),
    C('Syn But Ranged', ['Combat'], '[pot] Strike: 2R damage.\n[POT] As above, but at +3 damage.', ['pot'])];
  const sr = compile(SYN, null), SL = sr.out.lib, SM = (n, at) => ((SL[n] && SL[n].modes) || []).find(mo => (mo.at === undefined ? null : mo.at) === at) || null;
  const SF = (n, at) => JSON.stringify((SM(n, at) || { fx: 'none' }).fx), Sref = (n, at) => (sr.wholeRefused || []).filter(r => r.name === n && (at === undefined || r.at === at)).map(r => r.why);
  const noRush = n => !((SL[n] && SL[n].modes) || []).some(mo => mo.fx && (mo.fx.rush || mo.fx.maneuverGrant || mo.fx.pressGrant));
  ok(noRush('Syn Grant First Round') && noRush('Syn Grant Continue Maneuver') && Sref('Syn Grant First Round', 'cel').length === 1 && Sref('Syn Grant Continue Maneuver', 'cel').length === 1
     && SF('Syn Press Continue', 'cel') === '{"rush":true,"pressGrant":1,"pressDir":"continue"}',
     'the grant’s exclusions: a maneuver ‘during the first round of that combat’ and a maneuver ‘only usable to continue combat’ are unread (the rush refused, listed); a press ‘only usable to continue combat’ is pressDir continue -- got ' + SF('Syn Press Continue', 'cel'));
  ok(noRush('Syn Header Unread') && JSON.stringify(Sref('Syn Header Unread', 'cel')) === '["the header: Only usable during a full moon."]' && noRush('Syn Header Requires') && JSON.stringify(Sref('Syn Header Requires', 'cel')) === '["the header: Requires a Sabbat vampire."]'
     && SF('Syn Header Anarch', 'cel') === '{"rush":true}' && SL['Syn Header Anarch'].anarchReq === true,
     'the header: an unread header sentence refuses every mode of the card, and ‘Requires’ is read only in the shapes the compiler reads (an Anarch: the rush is whole; a Sabbat vampire: refused)');
  ok(noRush('Syn Odd Bracket') && JSON.stringify(Sref('Syn Odd Bracket')) === '["a line opens with a bracket that is no discipline: [FLIGHT] +1 stealth action."]' && Sref('Syn Odd Bracket', '*').length === 1,
     'a line that opens with a bracket that is no discipline ([FLIGHT]) refuses the whole card, listed at ‘*’ with that line -- got ' + JSON.stringify((sr.wholeRefused || []).filter(r => r.name === 'Syn Odd Bracket')));
  ok(SF('Syn As Ref Level', 'CEL') === '{"rush":true,"maneuverGrant":1,"pressGrant":1}' && SF('Syn As Ref Level', 'pot') === '{"rush":true,"rushTo":"locked"}',
     '‘As [cel] above’ resolves to the [cel] line by its level, not to the line just before ([pot]’s locked target): [CEL] is [cel]’s rush and press plus its own maneuver -- got ' + SF('Syn As Ref Level', 'CEL'));
  ok(SF('Syn Ban Scope', 'cel') === '{}' && JSON.stringify(Sref('Syn Ban Scope', 'cel')) === '["The opposing minion cannot strike: combat ends during the second round of that combat."]' && SF('Syn Ban NoScope', 'cel') === '{"strike":2}',
     'the ban’s scope words: ‘during the second round’ is no scope the compiler reads -- no ceBan (not ‘combat’), and the rush’s clause is read only at ‘the first round of that combat’ (the sentence is what the refusal names) -- got ' + SF('Syn Ban NoScope', 'cel'));
  ok(SF('Syn As Above Adds', 'POT') === '{"handBonus":2,"handStrike":true}' && SF('Syn As Above Adds', 'pot') === '{"handBonus":1,"handStrike":true}',
     '‘As above, and this hand strike is at +1 damage’ ADDS to its reference’s +1 (2), it does not set it -- got ' + SF('Syn As Above Adds', 'POT'));
  ok(SF('Syn Shared Level', 'pot') === '{"handStrike":true}' && Sref('Syn Shared Level', 'pot').every(w => w === 'no single compiled mode at its level') && Sref('Syn Shared Level', 'pot').length >= 1,
     'a level two lines share is not one plain mode: ‘Strike: hand strike.’ twice at [pot] writes no handBonus 0 (refused: no single compiled mode at its level)');
  ok(SF('Syn Strike Extra', null) === '{"stealth":1,"handStrike":true}' && JSON.stringify(Sref('Syn Strike Extra', null)) === '["compiled keys the reading does not explain: stealth"]',
     'a strike reading on a mode whose compiled keys it does not explain (stealth) writes nothing and is listed -- got ' + SF('Syn Strike Extra', null));
  ok(SF('Syn Null', 'tha') === '{"handStrike":true,"handBonus":0,"nullOppWeapons":true}' && SF('Syn Null Wide', 'tha') === '{"handStrike":true}' && Sref('Syn Null Wide', 'tha').length === 1
     && SF('Syn NoPrev', 'tha') === '{"handStrike":true,"handBonus":0,"noPreventDisc":"for"}' && SF('Syn NoPrev Wide', 'tha') === '{"handStrike":true}' && Sref('Syn NoPrev Wide', 'tha').length === 1,
     'the nullifier and the Fortitude rider are read in their one shape each: ‘the opposing VAMPIRE’s strikes with weapons’ and ‘cards requiring Fortitude’ -- the opposing minion’s (an ally’s weapons too) and ‘equipment or cards requiring Fortitude’ are unread (refused, no keys)');
  ok(SF('Syn But Ranged', 'POT') === '{"strike":2,"ranged":true}' && SF('Syn But Ranged', 'pot') === '{"strike":2,"ranged":true}',
     '\u2018As above, but at +N damage\u2019 replaces an inherited handBonus only: over a strike with no hand bonus (2R damage) it writes nothing -- got ' + SF('Syn But Ranged', 'POT'));
  ok(SF('Syn Own Stealth', 'cel') === '{"actStealth":2,"rush":true}',
     'a discipline line’s opening ‘+2 stealth action.’ is that mode’s actStealth: the rush is whole -- got ' + SF('Syn Own Stealth', 'cel'));
  /* planted compiled entries, read by wholeModes directly: a guard the accepted texts cannot reach through extractFx today */
  const plant = (t, modes, text) => { const e = { t, modes: JSON.parse(JSON.stringify(modes)) }, sink = []; wholeModes(e, text, 'Planted', sink); return { e, sink }; };
  const pR = plant(['action'], [{ at: 'cel', dir: true, fx: { maneuver: true, bleed: 1 } }], '[cel] Ⓓ Enter combat with a minion. This acting vampire gets 1 optional maneuver during that combat.');
  const pS = plant(['combat'], [{ at: 'pot', fx: { handStrike: true, aggr: true } }], '[pot] Strike: hand strike.');
  const pA = plant(['combat'], [{ at: 'pot', fx: { handStrike: true } }], '[pot] Strike: hand strike, aggravated.');
  const pT = plant(['action'], [{ at: 'cel', dir: true, fx: { actStealth: 1 } }], '[cel] +2 stealth action. Ⓓ Enter combat with a minion.');
  const pB = plant(['action'], [{ at: 'cel', dir: true, fx: { ceBan: 'round' } }], '[cel] Ⓓ Enter combat with a minion. The opposing minion cannot strike: combat ends during the first round of that combat.');
  ok(JSON.stringify(pR.e.modes[0].fx) === '{"maneuver":true,"bleed":1}' && /compiled keys the reading does not explain: bleed/.test((pR.sink[0] || {}).why)
     && JSON.stringify(pS.e.modes[0].fx) === '{"handStrike":true,"aggr":true}' && /compiled keys the reading does not explain: aggr/.test((pS.sink[0] || {}).why)
     && JSON.stringify(pA.e.modes[0].fx) === '{"handStrike":true}' && /no aggr/.test((pA.sink[0] || {}).why)
     && JSON.stringify(pT.e.modes[0].fx) === '{"actStealth":1}' && /not the compiled mode/.test((pT.sink[0] || {}).why)
     && JSON.stringify(pB.e.modes[0].fx) === '{"ceBan":"round"}' && /does not explain: ceBan/.test((pB.sink[0] || {}).why),
     'PLANTED: a rush whose compiled mode carries a key the reading does not explain (bleed), a plain hand strike over a compiled aggr, ‘hand strike, aggravated’ over a mode without aggr, a line’s +2 stealth over a compiled +1, and the first-round ban’s clause over a compiled ceBan ‘round’ -- each mode is left as it is and listed -- got ' + JSON.stringify([pR, pS, pA, pT, pB].map(x => (x.sink[0] || {}).why || null)));
}
/* The sharing register (19 Nov 2026, bot v0.6.234; RULINGS D-125, spec-card-sweep-2026-11-18 §2 and §4.1): no hand key before "who else
   in the library prints this?" has an answer on file. cardfx-sharing.js defines a hand-only key and the register's rules; this is its gate.
   First the rules against a seven-entry library with a fault planted per rule (the lint must bite), then the real library and the real
   file, and the frozen seed attacked through the path the real file takes (the default pin). */
{
  console.log('\nThe sharing register -- every hand-only key has its answer (cardfx-sharing)');
  const SH = require('./cardfx-sharing.js');
  const mk = (src, fxo, refFx) => Object.assign({ t: ['act'], src, modes: [{ at: 'x', fx: fxo }] }, refFx ? { ref: { fx: refFx } } : {});
  const PT = 'P™ X', PP = 'P(TM) X';   // one card under two printed spellings
  const L0 = { A: mk('hand', { kA: 1, common: 1 }), B: mk('hand', { kB: 1 }, { kRef: 1 }), C: mk('auto', { common: 1, kC: 1 }), D: mk('hand', { kD: 1 }), D2: mk('hand', { kD: 1 }),
               [PT]: mk('hand', { kP: 1 }), [PP]: mk('hand', { kP: 1 }) };
  const withE = fxo => Object.assign({}, L0, { E: mk('hand', fxo) });
  const seed0 = () => ({ kA: ['A'], kB: ['B'], kD: ['D', 'D2'], kP: [PP, PT], kRef: ['B'] }), pin0 = { count: 5, sha256: SH.seedHash(seed0()) };
  const R0 = () => ({ seed: seed0(), backlog: ['kA'], shared: { kD: ['D', 'D2'] }, unique: { kB: ['B'], kRef: ['B'], kP: [PP, PT] } });
  const probs = (mut, lib, pin) => { const r = R0(); if (mut) mut(r); return SH.check(lib || L0, r, pin || pin0); };
  const one = (P, re) => P.length === 1 && re.test(P[0]), both = (P, a, b) => P.length === 2 && P.some(x => a.test(x)) && P.some(x => b.test(x));
  const ho0 = SH.handOnlyKeys(L0);
  ok(JSON.stringify([...ho0.keys()].sort()) === '["kA","kB","kD","kP","kRef"]' && JSON.stringify(ho0.get('kD')) === '["D","D2"]' && !ho0.has('common') && !ho0.has('kC'),
     'a hand-only key: on hand entries and on no other library entry (a mode’s fx and ref.fx both count; a key the auto tier also gives is not hand-only)');
  { // compiler v1.10.0 (spec-card-sweep §4.4): a merged entry's hand keys are the ones its layer set (`handKeys`); the rest is the compiler's
    const Mg = Object.assign(mk('hand', { kM: 1, kComp: 1, common: 1 }, { kMR: 1 }), { merged: true, handKeys: ['kM', 'kMR'] }), Lm = Object.assign({}, L0, { Mg });
    const hom = SH.handOnlyKeys(Lm), cm = SH.counts(Lm, R0());
    ok(hom.has('kM') && hom.has('kMR') && !hom.has('kComp') && JSON.stringify(SH.keyMap(Lm).hand.get('common')) === '["A"]' && SH.keyMap(Lm).other.has('kComp') && cm.handOnly === 7 && cm.noRow === 2,
       'a merged entry (synthetic): only its handKeys are hand keys -- kM and ref.fx kMR hand-only, its compiler key kComp (on no other entry) not, and the count reads it (7 hand-only, the two new without a row); every key of an entry that is not merged stays the hand’s');
    const rm = R0(); rm.unique.kM = ['Mg']; rm.unique.kMR = ['Mg']; const Pm = SH.check(Lm, rm, pin0);
    ok(Pm.length === 0, 'the register’s check reads the same: the merged entry’s two hand keys answered as unique, and nothing asks about its compiler key' + (Pm.length ? ' -- got ' + Pm.join('; ') : '')); }
  ok(probs().length === 0, 'a clean register has no problem (a backlog key where the seed found it, shared with two cards, unique on one card -- also under its two spellings)');
  ok(one(probs(r => { r.backlog = []; }), /`kA` is a hand-only key with no row \(on A\)/), 'planted: a hand-only key with no row fails, and names the entry that carries it');
  { const L1 = Object.assign({}, L0, { A: mk('hand', { kA: 1, common: 1, kNew: 1 }) });
    ok(one(probs(null, L1), /`kNew` is a hand-only key with no row/), 'planted: a NEW hand key with no answer fails');
    ok(one(probs(r => { r.backlog.push('kNew'); }, L1), /`kNew` is in the backlog and not in the seed/), 'planted: a new hand key parked in the backlog fails');
    ok(one(probs(r => { r.backlog.push('kNew'); r.seed.kNew = ['A']; }, L1), /the seed is not the frozen one \(6 keys/), 'planted: a new key added to the seed as well fails on the pinned seed');
    ok(probs(r => { r.unique.kNew = ['A']; }, L1).length === 0 && probs(r => { r.shared.kNew = ['A', 'C']; }, L1).length === 0, 'a new hand key answered as unique, or as shared, passes'); }
  ok(one(probs(null, withE({ kA: 1 })), /`kA` is in the backlog and now also on E: answer it/), 'planted: a backlog key on one more card fails (a backlog key reaches no other card before it is answered)');
  ok(probs(r => { r.backlog = []; r.shared.kA = ['A', 'E']; }, withE({ kA: 1 })).length === 0, 'the same key answered as shared with that card passes');
  ok(one(probs(r => { delete r.shared.kD; r.backlog.push('kD'); }, withE({ kD: 1 })), /`kD` is in the backlog and now also on E: answer it/), 'planted: a backlog key that sat on two cards fails on a third (every entry is held against the seed row)');
  ok(probs(r => { delete r.shared.kD; r.backlog.push('kD'); }, Object.assign({}, L0, { D2: mk('hand', { other: 1 }), C: mk('auto', { common: 1, kC: 1, other: 1 }) })).length === 0, 'a backlog key that left one of its seed entries passes');
  ok(one(probs(r => { r.unique.kA = ['A']; }), /`kA` has two rows \(backlog and unique\)/), 'planted: a key in two states fails');
  ok(one(probs(r => { r.unique.kB = ['A']; }), /`kB` is unique to A in the register; the library has it on B/), 'planted: a unique row naming another entry fails');
  ok(one(probs(r => { delete r.shared.kD; r.unique.kD = ['D']; }), /`kD` is unique to D in the register; the library has it on D, D2/), 'planted: a unique row naming one of the two entries that carry the key fails');
  ok(one(probs(r => { delete r.shared.kD; r.unique.kD = ['D', 'D2']; }), /`kD` is unique in the register and 2 different cards carry it/), 'planted: a key on two different cards filed as unique fails (two cards print it: shared)');
  ok(both(probs(r => { r.shared.kD = ['D']; }), /`kD` is shared and names 1 card:/, /`kD` is shared and its row does not name D2, a hand entry that carries it/), 'planted: a shared row with one card fails, and misses the other hand entry');
  ok(one(probs(r => { delete r.unique.kP; r.shared.kP = [PP, PT]; }), /`kP` is shared and names 1 card:/), 'planted: a shared row naming one card under its two spellings fails');
  ok(one(probs(r => { r.shared.kD = ['D', 'D2', 'Nobody']; }), /`kD` is shared with Nobody, which the library does not have/), 'planted: a shared row naming a card the library does not have fails');
  ok(one(probs(null, withE({ kD: 1 })), /`kD` is shared and its row does not name E, a hand entry that carries it/), 'planted: a shared key given by hand to a card its row does not name fails');
  ok(one(probs(r => { r.shared.kGhost = ['A', 'B']; }), /`kGhost` is shared in the register and no library entry carries it/), 'planted: a shared row for a key no entry carries fails');
  ok(one(probs(r => { r.unique.kC = ['C']; }), /`kC` is unique in the register and is no longer hand-only/), 'planted: a unique row for a key the auto tier gives fails');
  { const seed1 = Object.assign(seed0(), { common: ['A'] }), pin1 = { count: 6, sha256: SH.seedHash(seed1) };
    ok(one(probs(r => { r.seed.common = ['A']; r.backlog.push('common'); }, null, pin1), /`common` is in the backlog and is no longer hand-only/), 'planted: a backlog key the auto tier now gives fails (move the row to shared, or delete it)');
    ok(probs(r => { r.seed.common = ['A']; r.shared.common = ['A', 'C']; }, null, pin1).length === 0, 'a shared row stays when the key has its general source'); }
  // the frozen seed: a swap that keeps the count, an entry added to a row, and the default pin (the path the real file takes)
  ok(one(probs(r => { delete r.seed.kRef; r.seed.kX = ['B']; }), /the seed is not the frozen one \(5 keys/), 'planted: a seed key swapped for another (the count kept) fails on the hash');
  ok(one(probs(r => { r.seed.kA = ['A', 'E']; }), /the seed is not the frozen one \(5 keys/), 'planted: an entry added to a seed row fails on the hash (the seed pins where a key sat)');
  ok(SH.check(L0, R0()).some(x => /the seed is not the frozen one \(5 keys, .*pinned 145, /.test(x)), 'with no pin given the check uses the frozen one (SEED_COUNT, SEED_SHA256)');
  ok(SH.SEED_COUNT === 145 && SH.SEED_SHA256 === '8028cd6e1a27e8ddbba1d7f4a1b591fe7f0e0d2875309d012dad8be2ed598490', 'the pin is pinned here as well: another frozen seed takes an edit in the register, in cardfx-sharing.js and in this line');
  { const shapeCase = (mut, re, n) => { const P = probs(mut); return P.length === n && P.some(x => re.test(x)); };
    ok(shapeCase(r => { r.unique = 'to do'; }, /^`unique` is not an object of rows$/, 4) && shapeCase(r => { r.shared = ['kD']; }, /^`shared` is not an object of rows$/, 2)
       && shapeCase(r => { r.backlog = { kA: 1 }; }, /^`backlog` is not a list of keys$/, 2) && shapeCase(r => { r.seed = []; }, /^`seed` is not an object of rows$/, 3),
       'planted: each part of the wrong shape is reported by its name, and nothing else is but what follows from it'); }
  { const viaProto = JSON.parse(JSON.stringify(R0()).replace('"seed":{', '"seed":{"__proto__":["A"],')); viaProto.backlog.push('0');
    const P0 = SH.check(Object.assign({}, L0, { A: mk('hand', { kA: 1, common: 1, 0: 1 }) }), viaProto, pin0), r4 = R0(); r4.backlog.push('constructor'); let P4 = null; try { P4 = SH.check(L0, r4, pin0); } catch (e){ P4 = null; }
    ok(P0.some(x => /`0` is in the backlog and not in the seed/.test(x)) && P0.some(x => /the seed is not the frozen one \(6 keys/.test(x)) && !!P4 && one(P4.filter(x => /not in the seed/.test(x)), /`constructor` is in the backlog and not in the seed/),
       'planted: a seed row keyed __proto__ hides no parked key, and a key named like a member of Object.prototype is a key (no throw)'); }
  // a malformed register is reported, never thrown
  { const bad = R0(); bad.shared.kD = 'D, D2'; let c = null, threw = false; try { c = SH.counts(L0, bad); SH.counts(L0, null); SH.counts(L0, { shared: 'x', unique: 7, backlog: {}, seed: [] }); } catch (e){ threw = true; }
    ok(both(SH.check(L0, bad, pin0), /`kD` \(shared\): a row is a list of names/, /`kD` is a hand-only key with no row/) && !threw && c.shared === 0
       && SH.check(L0, null, pin0).some(x => /the register is not an object/.test(x)) && SH.check(L0, { shared: 'x', unique: 7, backlog: {}, seed: [] }, pin0).length >= 4,
       'planted: a row that is not a list of names, a part of the wrong shape and no register at all are reported; the counts do not throw'); }
  { const c = SH.counts(L0, R0()), r3 = R0(); r3.backlog = []; const c3 = SH.counts(L0, r3);
    const paid = R0(); paid.shared = { common: ['A', 'C'] }; paid.backlog.push('kD'); const lack = R0(); lack.shared = { common: ['A', 'C', 'B'] }; const gone = R0(); gone.shared = { common: ['A', 'C', 'Nobody'] };
    ok(c.handOnly === 5 && c.single === 3 && c.backlog === 1 && c.shared === 1 && c.owed === 1 && c.unique === 3 && c.noRow === 0 && c3.noRow === 1 && c3.backlog === 0
       && SH.counts(L0, paid).owed === 0 && SH.counts(L0, lack).owed === 1 && SH.counts(L0, gone).owed === 1,
       'the counts the ledger prints: hand-only 5 (3 on a single entry), backlog 1, shared 1, unique 3; a key with no row is counted; a shared row is owed while its key is still hand-only (kD: on two hand entries, no general source) or a card it names lacks the key, and paid when neither holds'); }
  // the real library (this compile) against the real file
  { const by = {}; Object.keys(fx.lib).forEach(n => { const k = SH.cardNorm(n); (by[k] = by[k] || []).push(n); });
    const twice = Object.values(by).filter(v => v.length > 1).map(v => v.slice().sort());
    ok(JSON.stringify(twice) === JSON.stringify([['Pentex(TM) Subversion', 'Pentex™ Subversion']]), 'one card under two names: the library has exactly the Pentex pair, so cardNorm merges no two different cards (' + twice.length + ' pair(s))'); }
  let reg = null, regErr = '';
  try { reg = JSON.parse(fs.readFileSync(here('cardfx-sharing.json'), 'utf8')); } catch (e) { regErr = e.message; }
  ok(!!reg, 'cardfx-sharing.json reads' + (regErr ? ' (' + regErr + ')' : ''));
  if (reg){
    const P = SH.check(fx.lib, reg), c = SH.counts(fx.lib, reg);
    ok(P.length === 0, 'every hand-only key has its row, the backlog is inside the frozen seed of ' + SH.SEED_COUNT + ' keys and their entries, no row is stale: ' + c.handOnly + ' hand-only keys (' + c.single
       + ' on a single entry) -- backlog ' + c.backlog + ', shared ' + c.shared + ' (' + c.owed + ' owed), unique ' + c.unique + (P.length ? '\n      ' + P.join('\n      ') : ''));
    const clone = () => JSON.parse(JSON.stringify(reg)), k0 = Object.keys(reg.seed || {})[0], frozen = n => new RegExp('the seed is not the frozen one \\(' + n + ' keys');
    const swap = clone(); swap.seed.zzSwap = swap.seed[k0]; delete swap.seed[k0];
    const grown = clone(); grown.seed.zzNew = ['Shadow Cloak']; grown.backlog.push('zzNew');
    const moved = clone(); moved.seed[k0] = moved.seed[k0].concat('Shadow Cloak');
    ok(!!k0 && SH.check(fx.lib, swap).some(x => frozen(SH.SEED_COUNT).test(x)) && SH.check(fx.lib, grown).some(x => frozen(SH.SEED_COUNT + 1).test(x)) && SH.check(fx.lib, moved).some(x => frozen(SH.SEED_COUNT).test(x)),
       'the real seed is frozen: a key swapped (the count kept), a key added to seed and backlog, an entry added to a seed row -- each fails on the pin in cardfx-sharing.js');
  }
}

/* v0.6.241 (the exactness round, RULINGS D-138): the fidelity file -- every card it names has a library entry, every gap it maps is an open
   entry of docs/SWEEP-REGISTER.md (with the state an 'id@state' names), so a round that fixes and deletes an entry drops it here too.
   The readers are gen-card-ledger.js's own (registerEntries, fidelityProblems): the ledger's page and this gate cannot disagree. */
{
  let fidF = null, fidErr = '', regT = null;
  try { fidF = JSON.parse(fs.readFileSync(here('cardfx-fidelity.json'), 'utf8')); } catch (e) { fidErr = e.message; }
  try { regT = fs.readFileSync(path.join(__dirname, 'docs', 'SWEEP-REGISTER.md'), 'utf8'); } catch (e) { fidErr = fidErr || e.message; }
  ok(!!fidF && !!regT, 'cardfx-fidelity.json and docs/SWEEP-REGISTER.md read' + (fidErr ? ' (' + fidErr + ')' : ''));
  if (fidF && regT){
    const LG = require('./gen-card-ledger.js'), regE = LG.registerEntries(regT);
    const P = LG.fidelityProblems(fidF, regE, n => Object.prototype.hasOwnProperty.call(fx.lib, n));
    const cards = Object.keys(fidF.checked || {}), gaps = cards.reduce((a, n) => a + ((fidF.checked[n].gaps || []).length), 0);
    ok(P.length === 0 && cards.length >= 92, 'the fidelity file: ' + cards.length + ' checked cards (the five starters\u2019 92 at least), ' + gaps + ' gaps, each an open register entry of ' + regE.size + (P.length ? '\n      ' + P.join('\n      ') : ''));
    const stale = JSON.parse(JSON.stringify(fidF)); stale.checked[cards[0]] = { gaps: ['99.99', '7.3@active'] };
    ok(LG.fidelityProblems(stale, regE, () => true).length === 2, 'planted: a gap no register entry has and a state the entry does not name are both reported');
  }
}
/* v1.12.0 (27 Nov 2026, C1: the V5 sweep's first family -- stealth, intercept, bleed -- against zero-vtes's definitions; spec-card-sweep
   §11.8, gen-cross-check.js): a GRANTED action's stealth is not the card's own (the compiler's GRANTED_STEALTH), and the readers'
   corrections ride as merge entries (cardfx-curated.json, notes 'C1 (27 Nov 2026 ...'). A value whose condition no reader of ours checks
   yet sits on fx.plusIf with an `unread` condition, which the bot's _plusIf fails closed. */
{
  const own = (n, k) => (fx.lib[n] && fx.lib[n].modes || []).filter(m => m.fx && m.fx[k] !== undefined);
  ok(['Archon', 'Alastor', 'Kuta', 'War of Ages', 'Camarilla Threat'].every(n => !own(n, 'actStealth').length),
    'C1: a political card\'s granted burn or combat action ("... as a +1 stealth political action") is not its own stealth (Archon, Alastor, Kuta, War of Ages, Camarilla Threat)');
  ok(!own('Aversion', 'stealth').length && own('Bonecraft', 'strike').length === 2 && !own('Bonecraft', 'stealth').length,
    'C1: a reaction\'s and a combat card\'s granted burn action carry no stealth (Aversion [VAL]; Bonecraft keeps its strike)');
  ok(['Powerbase: Barranquilla', 'The Shard, London', 'Ventrue Directorate Assembly', 'Arms Dealer', 'Filchware\'s Pawn Shop'].every(n => !own(n, 'stealth').length),
    'C1: the other granted phrasings -- "+1 stealth during that action", "may take a +1 stealth action", "as an undirected +1 stealth equip action"');
  ok(own('Charming Lobby', 'actStealth').some(m => m.fx.actStealth === 1) && own('Children of Stone', 'actStealth').some(m => m.fx.actStealth === 2),
    'C1: a card\'s own "+N stealth action." stays (Charming Lobby 1, Children of Stone 2)');
  const bp = own('Baltimore Purge', 'plusIf')[0];
  ok(!own('Baltimore Purge', 'actStealth').length && bp && bp.fx.plusIf.add.actStealth === 1 && bp.fx.plusIf.if.selfClan === 'Ravnos',
    'C1: Baltimore Purge is a +1 stealth action only for a Ravnos (plusIf selfClan)');
  const sl = mode('Scarlet Lore', 'MYT'), mv = mode('Mirror\'s Visage', 'CHI');
  ok(sl && sl.fx.actStealth === 2 && mv && mv.fx.stealth === 1 && mv.fx.plusIf && mv.fx.plusIf.add.stealth === 1 && /undirected/.test(mv.fx.plusIf.if.unread),
    'C1: Scarlet Lore [MYT] 2 (the opening +1 and its additional +1); Mirror\'s Visage [CHI] +1, +2 when undirected');
  const ws = fx.lib['Warning Sirens'].modes || [], ss = mode('Speak with Spirits', 'SPI'), ba = mode('Blithe Acceptance', 'obf');
  ok(ws.length === 2 && ws.filter(m => m.fx.intercept === 1).length === 1 && ws.filter(m => m.fx.dodge === true).length === 1 && !ws.some(m => m.fx.intercept && m.fx.dodge),
    'C1: Warning Sirens\' two uses are two modes (+1 intercept, or a dodge)');
  ok(ss && ss.fx.intercept === undefined && ss.fx.interceptPaid === 1 && ss.fx.interceptPaidBlood === 1 && ba && ba.fx.actStealth === undefined && ba.fx.bearerStat && ba.fx.bearerStat.stealth === 1,
    'C1: Speak with Spirits [SPI]\'s +1 intercept costs 1 blood; Blithe Acceptance\'s +1 stealth is its bearer\'s, not the action\'s');
  const pr = (fx.lib['Protection Racket'].modes || [])[0];
  ok(pr && pr.fx.intercept === 1 && pr.fx.plusIf && pr.fx.plusIf.add.intercept === 1 && /titled/.test(pr.fx.plusIf.if.unread),
    'C1: Protection Racket +1 intercept, +2 against a titled acting minion (the condition unread: SWEEP-REGISTER 7.5)');
  /* the family's exactness record (cardfx-exact.json, a development file; RULINGS D-144): its states, its cards, its open gaps */
  let ex = null, exErr = '', regT2 = null;
  try { ex = JSON.parse(fs.readFileSync(here('cardfx-exact.json'), 'utf8')); } catch (e) { exErr = e.message; }
  try { regT2 = fs.readFileSync(path.join(__dirname, 'docs', 'SWEEP-REGISTER.md'), 'utf8'); } catch (e) { exErr = exErr || e.message; }
  const exProblems = (X, regE, has) => { const P = [], ST = new Set(Object.keys((X && X.states) || {})), FAM = new Set([].concat(...Object.values((X && X.families) || {}).map(f => f.keys || [])));
    if (!['agree', 'graded', 'corrected', 'explained', 'open', 'single'].every(k => ST.has(k))) P.push('the states are not the six');
    for (const [card, ks] of Object.entries((X && X.cards) || {})){ if (!has(card)) P.push(card + ': no library entry');
      for (const [key, v] of Object.entries(ks)){ if (!FAM.has(key)) P.push(card + ': ' + key + ' is no family key');
        for (const sv of (typeof v === 'string' ? [v] : Object.values(v))){ const [w, id] = String(sv).split(' ');
          if (!ST.has(w)) P.push(card + ' ' + key + ': state ' + sv);
          else if (w === 'open' && !(id && regE.has(id))) P.push(card + ' ' + key + ': open names no register entry (' + sv + ')'); } } }
    return P; };
  ok(!!ex && !!regT2, 'cardfx-exact.json and docs/SWEEP-REGISTER.md read' + (exErr ? ' (' + exErr + ')' : ''));
  if (ex && regT2){
    const regE2 = require('./gen-card-ledger.js').registerEntries(regT2), has = n => Object.prototype.hasOwnProperty.call(fx.lib, n);
    const P = exProblems(ex, regE2, has), tally = {};
    for (const ks of Object.values(ex.cards)) for (const v of Object.values(ks)) for (const sv of (typeof v === 'string' ? [v] : Object.values(v))) { const w = String(sv).split(' ')[0]; tally[w] = (tally[w] || 0) + 1; }
    ok(P.length === 0 && Object.keys(ex.cards).length >= 700, 'the exactness record: ' + Object.keys(ex.cards).length + ' cards, ' + Object.entries(tally).map(([k, n]) => k + ' ' + n).join(' · ') + '; every card a library entry, every open gap a register entry' + (P.length ? '\n      ' + P.slice(0, 8).join('\n      ') : ''));
    const bad = JSON.parse(JSON.stringify(ex)), c0 = Object.keys(bad.cards)[0]; bad.cards[c0] = { stealth: 'open 99.99', bleed: 'maybe' }; bad.cards['No Such Card'] = { intercept: 'agree' };
    ok(exProblems(bad, regE2, has).length === 3, 'planted: an open gap naming no register entry, an unknown state and an unknown card are each reported');
  }
  const IFK = new Set(['selfClan', 'selfTitled', 'unread']), badIf = [];
  for (const n in fx.lib) for (const m of fx.lib[n].modes || []) if (m.fx && m.fx.plusIf){ const pi = m.fx.plusIf;
    if (!pi.add || typeof pi.add !== 'object' || !Object.keys(pi.add).length || !pi.if || !Object.keys(pi.if).length || Object.keys(pi.if).some(k => !IFK.has(k)) || (pi.if.unread !== undefined && !(typeof pi.if.unread === 'string' && pi.if.unread.length > 8))) badIf.push(n); }
  ok(!badIf.length, 'C1: every plusIf names what it adds and a condition the vocabulary knows (selfClan, selfTitled, or an unread condition in words)' + (badIf.length ? ': ' + badIf.join(', ') : ''));
}

console.log('\n' + passN + '/' + failN + (failN ? ' — FAIL' : ' — all green'));
process.exit(failN ? 1 : 0);
