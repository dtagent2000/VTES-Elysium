#!/usr/bin/env node
'use strict';
/* ============================================================
   krcg-audit.js v1.0.0 (1 Nov 2026, client v2.6.168) -- compare two KRCG card files through the client's REAL parser
   ------------------------------------------------------------
   Before the client trusts a new KRCG file (a new set, a format change, a switch of source), run both files through
   buildCardIndex / buildPrecons and compare card by card by KRCG id:
     - every name the OLD file resolves must resolve in the NEW one, to the SAME card (a saved deck stays legal);
     - the fields a name shows (text, types, capacity, disciplines, clans, costs, path, sect) on the same card;
     - the image keys added and removed (a removed key re-downloads for players with the image cache);
     - the full starters (12 crypt, 60+ library): names, era (V5 / Legacy) and the cards they hold, by id.
   Third-party data: keep KRCG's files OUTSIDE the repository.
     node krcg-audit.js <old vtes.json> <new vtes.json> [new expansions.json] [client.html]
   Example (1 Nov 2026: the v3 file the client read until v2.6.167 against the v5 dump it reads since). Since 8 Nov 2026
   KRCG's default data/vtes.json IS the v5 dump; the frozen v3 file is data/v4/vtes.json (v2.6.174 -- the old recipe
   compared v5 with v5 and passed):
     curl -o /tmp/k/v3.json https://static.krcg.org/data/v4/vtes.json
     curl -o /tmp/k/v5.json https://static.krcg.org/data/v5/vtes.json
     curl -o /tmp/k/exp.json https://static.krcg.org/data/v5/expansions.json
     node krcg-audit.js /tmp/k/v3.json /tmp/k/v5.json /tmp/k/exp.json
   Exit 0 = no old name lost and none moved to another card; 1 = something to read before shipping; 2 = could not run.
   Dev tool only -- never part of a release. Ends with process.exit: the client's timers keep Node alive.
   ============================================================ */
const fs = require('fs'), path = require('path'), os = require('os');
const [OLD, NEW, EXP, CLIENT_ARG] = process.argv.slice(2);
if (!OLD || !NEW) { console.log('usage: node krcg-audit.js <old vtes.json> <new vtes.json> [new expansions.json] [client.html]'); process.exit(2); }
const CLIENT = path.resolve(CLIENT_ARG || path.join(__dirname, 'elysium-vtes-bord.html'));
const { loadClient } = require(path.join(__dirname, 'elysium-test-harness.js'));
// a scratch copy of the client that tags each parsed card's meta with its KRCG id -- so a name's OWNER can be compared
const A = "    const parsed = (typeof card.kind==='string') ? parseV5Card(card) : parseV3Card(card);\n    if(!parsed) continue;\n";
let src = fs.readFileSync(CLIENT, 'utf8');
if (src.split(A).length !== 2) { console.log('krcg-audit: the anchor in buildCardIndex moved -- update krcg-audit.js'); process.exit(2); }
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'krcg-audit-')), 'client.html');
fs.writeFileSync(tmp, src.replace(A, A + '    parsed.meta.__id = card.id;\n'));
let C0, C1;
try { C0 = loadClient(tmp); C1 = loadClient(tmp); } finally { fs.rmSync(path.dirname(tmp), { recursive: true, force: true }); }
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const held0 = C0.processCardData(read(OLD), 'old'), held1 = C1.processCardData(read(NEW), 'new', EXP ? fs.readFileSync(EXP, 'utf8') : undefined);
if (!held0 || !held1) { console.log('krcg-audit: a file held no cards (old ' + held0 + ', new ' + held1 + ')'); process.exit(2); }
console.log('old: ' + C0.cardDBSrc + ', ' + C0.cardInfo.size + ' names, ' + C0.cardImageNames.size + ' cards');
console.log('new: ' + C1.cardDBSrc + ', ' + C1.cardInfo.size + ' names, ' + C1.cardImageNames.size + ' cards' + (EXP ? ' (with expansions.json)' : ' (no expansions.json: the built-in set names)'));
let bad = 0;
// 1. names
const lost = [], moved = [], diff = {}, sample = {};
const F = ['text', 'types', 'cap', 'disc', 'clans', 'pool', 'blood', 'path', 'sect'];
for (const [k, m0] of C0.cardInfo) {
  const m1 = C1.cardInfo.get(k);
  if (!m1) { lost.push(k); continue; }
  if (m0.__id !== m1.__id) { moved.push(k + ' (' + m0.__id + ' -> ' + m1.__id + ')'); continue; }
  for (const f of F) {
    const a = JSON.stringify(m0[f] ?? null), b = JSON.stringify(m1[f] ?? null);
    if (a !== b) { diff[f] = (diff[f] || 0) + 1; (sample[f] = sample[f] || []).length < 3 && sample[f].push(k + ': ' + a.slice(0, 50) + ' -> ' + b.slice(0, 50)); }
  }
}
console.log('\nnames: ' + lost.length + ' lost, ' + moved.length + ' now resolve to another card');
for (const x of lost.slice(0, 20)) console.log('  LOST  ' + x);
for (const x of moved.slice(0, 20)) console.log('  MOVED ' + x);
bad += lost.length + moved.length;
console.log('fields that differ on the same card: ' + (Object.keys(diff).length ? JSON.stringify(diff) : 'none'));
for (const f in sample) for (const x of sample[f]) console.log('  ' + f + '  ' + x);
// 2. image keys
const i0 = C0.cardImageNames, i1 = C1.cardImageNames;
const added = [...i1].filter(k => !i0.has(k)), gone = [...i0].filter(k => !i1.has(k));
console.log('\nimage keys: ' + added.length + ' new, ' + gone.length + ' gone' + (gone.length ? ' (' + gone.slice(0, 10).join(', ') + ')' : ''));
// 3. starters
const starters = C => { const m = new Map(); for (const e of C.precons.values()) { let lc = 0, cc = 0; e.library.forEach(q => lc += q); e.crypt.forEach(q => cc += q); if (cc === 12 && lc >= 60) m.set(e.key, e); } return m; };
const S0 = starters(C0), S1 = starters(C1);
const era = (C, S) => [...S.values()].reduce((o, e) => (o[C.preconEra(e)] = (o[C.preconEra(e)] || 0) + 1, o), {});
console.log('\nstarters: old ' + S0.size + ' ' + JSON.stringify(era(C0, S0)) + ', new ' + S1.size + ' ' + JSON.stringify(era(C1, S1)));
const only0 = [...S0.keys()].filter(k => !S1.has(k)), only1 = [...S1.keys()].filter(k => !S0.has(k));
if (only0.length) console.log('  only in old: ' + only0.join(' ; '));
if (only1.length) console.log('  only in new: ' + only1.join(' ; '));
const ids = (C, e) => { const m = new Map(); for (const part of [e.crypt, e.library]) part.forEach((q, n) => { const inf = C.cardInfo.get(C.norm(n)); const id = inf ? inf.__id : 'UNRESOLVED ' + n; m.set(id, (m.get(id) || 0) + q); }); return m; };
let same = 0;
for (const [k, e0] of S0) {
  const e1 = S1.get(k); if (!e1) continue;
  const a = ids(C0, e0), b = ids(C1, e1), d = [];
  for (const id of new Set([...a.keys(), ...b.keys()])) if ((a.get(id) || 0) !== (b.get(id) || 0)) d.push(id + ' ' + (a.get(id) || 0) + '->' + (b.get(id) || 0));
  if (C0.preconEra(e0) !== C1.preconEra(e1)) { d.push('era ' + C0.preconEra(e0) + '->' + C1.preconEra(e1)); bad++; }
  if (d.length) console.log('  ' + k + ': ' + d.join(', ')); else same++;
}
console.log('  ' + same + ' starters hold the same cards');
const unresolved = [...S1.values()].flatMap(e => [...e.crypt.keys(), ...e.library.keys()]).filter(n => !C1.cardInfo.get(C1.norm(n)));
if (unresolved.length) { console.log('  starter names the new index does not resolve: ' + unresolved.slice(0, 10).join(', ')); bad += unresolved.length; }
console.log('\n' + (bad ? 'READ THE LINES ABOVE before shipping (' + bad + ')' : 'no old name lost or moved, every starter name resolves'));
process.exit(bad ? 1 : 0);
