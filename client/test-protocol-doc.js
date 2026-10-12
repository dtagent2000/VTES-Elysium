/* Elysium - protocol-doc lint (v2: verb NAMES + per-verb FIELD LISTS)
   Guards ELYSIUM-PROTOCOL.md against handler drift, in BOTH directions:
   (1-3) every live GAME_HANDLERS verb / MP_HANDLERS message must appear in the
   doc's machine-readable index blocks and vice versa, plus the session block;
   (5-6, new in v2) every verb's "fields" table cell in sections 7 and 8 must
   equal the fields the LIVE handler body actually reads. Extraction is the
   exact regex family the doc generator used - Function.toString() on each live
   handler, /\bm\.(\w+)/g minus 't' - so the comparison is drift-proof by
   construction: whatever quirks the generator saw, the lint sees identically.
   Born from the v2.5.35 stale-guard lesson: a spec that is not machine-checked
   against the artifact it describes will silently rot.

   NOT machine-checked: the section-3 create/join field lists (those verbs live
   in the server's pre-dispatch handle(), not in a keyed handler table).

   Usage: node test-protocol-doc.js [client.html] [server.js] [protocol.md]
   Defaults: ./elysium-vtes-bord.html ./elysium-server.js ./ELYSIUM-PROTOCOL.md
   Requires ./elysium-test-harness.js (loadClient/loadServer). */
'use strict';
const fs = require('fs');
const path = require('path');
const { loadClient, loadServer } = require('./elysium-test-harness');

const cliPath = process.argv[2] || 'elysium-vtes-bord.html';
const srvPath = process.argv[3] || 'elysium-server.js';
const docPath = process.argv[4] || 'ELYSIUM-PROTOCOL.md';

let pass = 0, fail = 0;
function check(name, fn){
  try { fn(); console.log('  \u2713 ' + name); pass++; }
  catch (e) { console.log('  \u2717 ' + name + '\n       ' + e.message); fail++; }
}
function block(md, tag){
  const m = md.match(new RegExp('<!-- protocol-lint:' + tag + ' -->([\\s\\S]*?)<!-- /protocol-lint:' + tag + ' -->'));
  if (!m) throw new Error('marker block missing in doc: protocol-lint:' + tag);
  return new Set([...m[1].matchAll(/`(\w+)`/g)].map(x => x[1]));
}
function diff(a, b){                       // what is in a but not b
  return [...a].filter(x => !b.has(x)).sort();
}
function fieldsOf(fn){                     // fields a live handler reads: m.<field>, minus the routing key 't'
  const src = Function.prototype.toString.call(fn);
  const set = new Set([...src.matchAll(/\bm\.(\w+)\b/g)].map(x => x[1]));
  set.delete('t');
  return set;
}
function docFieldTables(md, startRe, endRe, label){   // per-verb field sets parsed from a section's tables
  const a = md.search(startRe);
  if (a < 0) throw new Error(label + ': section heading not found');
  const relB = md.slice(a + 1).search(endRe);
  const sect = md.slice(a, relB < 0 ? md.length : a + 1 + relB);
  const map = new Map();
  for (const line of sect.split('\n')){
    const m = line.match(/^\| `(\w+)` \| ([^|]*) \|/);   // first cell = verb, second = its fields (em-dash = none)
    if (m) map.set(m[1], new Set([...m[2].matchAll(/`(\w+)`/g)].map(x => x[1])));
  }
  return map;
}
function checkFields(codeMap, docMap, dir){
  const errs = [];
  for (const [verb, codeSet] of codeMap){
    const docSet = docMap.get(verb);
    if (!docSet){ errs.push(verb + ': no field-table row in the doc'); continue; }
    const a = diff(codeSet, docSet), b = diff(docSet, codeSet);
    if (a.length) errs.push(verb + ': code reads ' + a.join(',') + ' - missing from doc');
    if (b.length) errs.push(verb + ': doc lists ' + b.join(',') + ' - not read by code');
  }
  for (const verb of docMap.keys())
    if (!codeMap.has(verb)) errs.push(verb + ': table row in doc, no live handler');
  if (errs.length) throw new Error(dir + ' field drift -\n       ' + errs.join('\n       '));
}

console.log('\nElysium - protocol-doc lint\n');
const md  = fs.readFileSync(path.resolve(docPath), 'utf8');
const S   = loadServer(path.resolve(srvPath));
const API = loadClient(path.resolve(cliPath));

check('server exposes GAME_HANDLERS + client exposes MP_HANDLERS', () => {
  if (!S.GAME_HANDLERS) throw new Error('GAME_HANDLERS not exposed (unpatched server?)');
  if (!API.MP_HANDLERS) throw new Error('MP_HANDLERS not exposed (unpatched client?)');
});

const code_c2s = new Set(Object.keys(S.GAME_HANDLERS || {}));
const code_s2c = new Set(Object.keys(API.MP_HANDLERS || {}));
const doc_c2s = block(md, 'c2s');
const doc_s2c = block(md, 's2c');
const doc_ses = block(md, 'session');

check('doc c2s index === live GAME_HANDLERS (' + code_c2s.size + ' verbs)', () => {
  const a = diff(code_c2s, doc_c2s), b = diff(doc_c2s, code_c2s);
  if (a.length) throw new Error('in code, MISSING from doc: ' + a.join(', '));
  if (b.length) throw new Error('in doc, gone from code: ' + b.join(', '));
});
check('doc s2c index === live MP_HANDLERS (' + code_s2c.size + ' messages)', () => {
  const a = diff(code_s2c, doc_s2c), b = diff(doc_s2c, code_s2c);
  if (a.length) throw new Error('in code, MISSING from doc: ' + a.join(', '));
  if (b.length) throw new Error('in doc, gone from code: ' + b.join(', '));
});
check('session block lists the pre-seat verbs create + join', () => {
  for (const v of ['create', 'join'])
    if (!doc_ses.has(v)) throw new Error('session block missing: ' + v);
});

const codeF_c2s = new Map([...code_c2s].map(v => [v, fieldsOf(S.GAME_HANDLERS[v])]));
const codeF_s2c = new Map([...code_s2c].map(v => [v, fieldsOf(API.MP_HANDLERS[v])]));
/* v2.6.129 / srv-2.6.39: INDIRECT reads. The combat tally's fields are read by a helper called as
   helper(m, ...) -- tallyCombat on the server, tallyCombatMerge in the client -- over a key list,
   so /m.field/ cannot see them. The lint follows exactly that call: if the handler body calls the
   helper with `m`, the helper's key list (parsed from the SOURCE, not hand-copied here) counts as
   read. Drop the call and the doc drifts red again; change the key list and the doc must follow. */
function indirect(fn, call, keys){ const src = Function.prototype.toString.call(fn); return (fn && new RegExp('\\b' + call + '\\(m[,)]').test(src)) ? keys : []; }
{
  const srvSrc = fs.readFileSync(path.resolve(srvPath), 'utf8'), cliSrc = fs.readFileSync(path.resolve(cliPath), 'utf8');
  const km = srvSrc.match(/const TALLY_CMB_KEYS = \[([^\]]*)\]/), kc = cliSrc.match(/const AVR_CMB0=Object\.freeze\(\{([^}]*)\}\)/);
  const srvKeys = km ? [...km[1].matchAll(/'(\w+)'/g)].map(x => x[1]) : [];
  const cliKeys = kc ? [...kc[1].matchAll(/(\w+):/g)].map(x => x[1]) : [];
  if (S.GAME_HANDLERS && S.GAME_HANDLERS.tally) indirect(S.GAME_HANDLERS.tally, 'tallyCombat', srvKeys).forEach(k => codeF_c2s.get('tally').add(k));
  if (API.MP_HANDLERS && API.MP_HANDLERS.tally) indirect(API.MP_HANDLERS.tally, 'tallyCombatMerge', cliKeys).forEach(k => codeF_s2c.get('tally').add(k));
}
const docF_c2s  = docFieldTables(md, /^## 7\./m, /^## 8\./m, 'c2s');
const docF_s2c  = docFieldTables(md, /^## 8\./m, /^## 9\./m, 's2c');

check('section-7 field lists === what each live GAME_HANDLER reads', () => checkFields(codeF_c2s, docF_c2s, 'c2s'));
check('section-8 field lists === what each live MP_HANDLER reads',   () => checkFields(codeF_s2c, docF_s2c, 's2c'));

console.log('\n' + pass + ' passed, ' + fail + ' failed' + (fail ? '' : ' - the spec matches the code'));
process.exit(fail ? 1 : 0);
