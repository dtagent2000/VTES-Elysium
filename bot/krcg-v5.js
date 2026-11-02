#!/usr/bin/env node
'use strict';
/* krcg-v5.js v1.0.0 (2 Nov 2026, bot v0.6.216) -- KRCG's v5 card dump, written as the v3-shaped vtes.json every tool here reads.

   Why: KRCG stopped adding cards to static.krcg.org/data/vtes.json (the v3 shape) at Sabbat V5; the 63 cards of Secrets of New York
   and Noites Brasileiras (31 Oct 2026) exist only in the v5 dump (main's reply of 1 Nov 2026, item 5.1). The compiler, the precon
   generator, the ledger, test-cardfx and the TWD profile tools all read the v3 fields (`name`, `card_text`, `sets`, `pool_cost`,
   `clans`, `disciplines` ...). Rather than teach each of them a second shape, this one file maps v5 to v3, once, and writes the
   result to `vtes.json` -- the file the tools already open. Third-party data: neither file is committed (root CLAUDE.md).

   The map (v5 -> v3), checked against KRCG's last v3 file on 2 Nov 2026 (4,149 shared cards; `--compare` reprints the check):
     name        printed_name + ' (' + suffix + ')' when the dump gives a suffix (crypt groups, ADV), ' (ANY)' for a crypt card of
                 group Any -- the v3 key for every shared card but one (v3 kept 'Anarch Manifesto, An'; the v5 name 'An Anarch
                 Manifesto' carries the old one as a variant, and the compiler aliases it)
     _name       the article-last variant ('Ankou, The') when there is one, else printed_name, as v3 did
     card_text   text ('<Name>' card references, v3 wrote '/Name/'; 174 shared texts carry errata)
     types       types                                clans       [clan] (crypt) | clan_requirement (library)
     disciplines disciplines (crypt) | discipline_requirement.disciplines (library); 'fli' written 'flight' as v3 did
     capacity (crypt; v3's library 'requires capacity N' is not mapped -- nothing reads it), path (a library card's: path_requirement), banned, rulings, id; empty clans / disciplines left out, as v3 did
     group       'G6' -> '6', 'Any' -> 'ANY'
     title       title ('1 Vote' / '2 Votes' written lower case, as v3 did: the compiler's vote table reads them)
     pool_cost / blood_cost / conviction_cost   from cost {type: 'Pool' | 'Blood' | 'Conviction', value}
     name_variants  the variants' names (strings)
     sets        { set name: [{ release_date, precon: bundle name, copies }] } from prints[].occurrences of type 'Precon' (the
                 bundle's name from expansions.json); other occurrences as { release_date, rarity } -- gen-precon reads the precons

   Usage (from inside bot/):
     curl -o vtes-v5.json https://static.krcg.org/data/v5/vtes.json
     curl -o expansions.json https://static.krcg.org/data/v5/expansions.json
     node krcg-v5.js                       # vtes-v5.json + expansions.json -> vtes.json
     node krcg-v5.js --compare OLD.json    # also: field-by-field against a v3 file (KRCG's last one), by card id
   Options: --in FILE (default vtes-v5.json) · --exp FILE (default expansions.json) · --out FILE (default vtes.json)          */

const fs = require('fs');
const path = require('path');
const VERSION = '1.0.0';

function parseArgs(argv){
  const o = { in: path.join(__dirname, 'vtes-v5.json'), exp: path.join(__dirname, 'expansions.json'), out: path.join(__dirname, 'vtes.json'), compare: null };
  for (let i = 2; i < argv.length; i++){
    const a = argv[i];
    if (a === '--in') o.in = argv[++i]; else if (a === '--exp') o.exp = argv[++i]; else if (a === '--out') o.out = argv[++i];
    else if (a === '--compare') o.compare = argv[++i];
    else { console.error('krcg-v5: unknown argument ' + a); process.exit(2); }
  }
  return o;
}

function toV3(c, sets){
  const crypt = c.kind === 'Crypt';
  const r = { id: c.id };
  const anyGroup = crypt && /^any$/i.test(String(c.group || ''));   // Anarch Convert, New Blood: v3 named them '(ANY)'
  r.name = (c.printed_name || '') + (c.suffix ? ' (' + c.suffix + ')' : anyGroup ? ' (ANY)' : '');
  { const am = /^(The|An|A) (.+)$/.exec(c.printed_name || ''), lex = am && am[2] + ', ' + am[1];   // v3's _name put a LEADING article last ('Ankou, The') when KRCG lists that variant
    r._name = (lex && (c.name_variants || []).some(v => (typeof v === 'string' ? v : (v && v.name)) === lex)) ? lex : (c.printed_name || ''); }
  r.printed_name = c.printed_name || '';
  r.name_variants = (c.name_variants || []).map(v => typeof v === 'string' ? v : (v && v.name)).filter(Boolean);
  r.types = c.types || [];
  r.card_text = typeof c.text === 'string' ? c.text : '';
  { const cl = crypt ? (c.clan ? [c.clan] : []) : (Array.isArray(c.clan_requirement) ? c.clan_requirement.slice() : []); if (cl.length) r.clans = cl; }   // v3 left an empty list out
  const disc = crypt ? (Array.isArray(c.disciplines) ? c.disciplines : [])
                     : ((c.discipline_requirement && Array.isArray(c.discipline_requirement.disciplines)) ? c.discipline_requirement.disciplines : []);
  if (disc.length) r.disciplines = disc.map(d => /^fli$/i.test(d) ? (d === d.toUpperCase() ? 'FLIGHT' : 'flight') : d);
  if (c.capacity !== undefined && c.capacity !== null) r.capacity = c.capacity;
  if (c.group !== undefined && c.group !== null && c.group !== '') r.group = anyGroup ? 'ANY' : String(c.group).replace(/^G/, '');
  if (typeof c.title === 'string' && c.title) r.title = /^\d+ votes?$/i.test(c.title) ? c.title.toLowerCase() : c.title;
  if (typeof c.path === 'string' && c.path) r.path = c.path;
  if (!crypt && Array.isArray(c.path_requirement) && c.path_requirement.length) r.path = c.path_requirement.join('/');   // v3 wrote a library card's Path requirement in `path`
  if (c.banned) r.banned = c.banned;
  if (c.cost && typeof c.cost === 'object' && c.cost.type){
    const t = String(c.cost.type).toLowerCase(), v = String(c.cost.value !== undefined ? c.cost.value : c.cost.amount);
    if (t === 'pool') r.pool_cost = v; else if (t === 'blood') r.blood_cost = v; else if (t === 'conviction') r.conviction_cost = v;
  }
  if (c.burn_option) r.burn_option = true;
  r.rulings = c.rulings || [];
  r.sets = {};
  for (const p of (c.prints || [])){
    const s = p.set && sets.get(p.set.id); if (!s) continue;
    const list = r.sets[s.name] = r.sets[s.name] || [];
    for (const oc of (p.occurrences || [])){
      const b = s.bundles[oc.bundle || ''];
      const date = oc.date || (b && b.release_date) || s.release_date || null;
      if (oc.type === 'Single') list.push({ release_date: date, precon: (b && b.name) || 'DriveThruCards', copies: oc.copies || 1 });   // v3's print-on-demand entries
      else if (oc.type === 'Precon') list.push({ release_date: date, precon: (b && b.name) || oc.bundle, copies: oc.copies || 1 });
      else list.push({ release_date: date, rarity: oc.frequency || oc.type || null });
    }
  }
  if (c.url) r.url = c.url;
  return r;
}

function compare(out, oldFile){
  const old = JSON.parse(fs.readFileSync(oldFile, 'utf8'));
  const byId = new Map(out.map(c => [c.id, c]));
  const FIELDS = ['name', '_name', 'types', 'clans', 'disciplines', 'capacity', 'group', 'title', 'path', 'pool_cost', 'blood_cost', 'card_text'];
  const diff = {}, ex = {}; let shared = 0, missing = 0;
  for (const o of old){
    const n = byId.get(o.id); if (!n){ missing++; continue; } shared++;
    for (const f of FIELDS){
      const a = JSON.stringify(o[f] === undefined ? null : o[f]), b = JSON.stringify(n[f] === undefined ? null : n[f]);
      if (a !== b){ diff[f] = (diff[f] || 0) + 1; (ex[f] = ex[f] || []).length < 4 && ex[f].push(o.name + ': ' + a.slice(0, 60) + ' -> ' + b.slice(0, 60)); }
    }
    for (const [s, es] of Object.entries(o.sets || {})){
      if (!/^(?:Fifth Edition|Sabbat V5)/.test(s)) continue;   // the precons gen-precon builds; older sets' bundles are named differently in the two files and nothing reads them
      const pv = es.filter(e => e.precon).map(e => e.precon + 'x' + e.copies).sort().join(','), pn = ((n.sets || {})[s] || []).filter(e => e.precon).map(e => e.precon + 'x' + e.copies).sort().join(',');
      if (pv !== pn){ diff['sets(precons)'] = (diff['sets(precons)'] || 0) + 1; (ex['sets(precons)'] = ex['sets(precons)'] || []).length < 4 && ex['sets(precons)'].push(o.name + ' ' + s + ': ' + pv + ' -> ' + pn); }
    }
  }
  console.log('compare with ' + path.basename(oldFile) + ': ' + shared + ' shared cards, ' + missing + ' missing from the dump, ' + (out.length - shared) + ' new');
  for (const f of Object.keys(diff)) console.log('  ' + f.padEnd(16) + String(diff[f]).padStart(5) + '  e.g. ' + ex[f].join(' | '));
}

function main(){
  const o = parseArgs(process.argv);
  for (const f of [o.in, o.exp]) if (!fs.existsSync(f)){ console.error('krcg-v5: ' + f + ' is missing -- fetch it from static.krcg.org/data/v5/ (see the header)'); return 2; }
  const dump = JSON.parse(fs.readFileSync(o.in, 'utf8')), exp = JSON.parse(fs.readFileSync(o.exp, 'utf8'));
  if (!Array.isArray(dump) || !dump.length || typeof dump[0].kind !== 'string'){ console.error('krcg-v5: ' + o.in + ' is not the v5 dump (a list of records with `kind`)'); return 2; }
  const sets = new Map((Array.isArray(exp) ? exp : Object.values(exp)).map(s => [s.id, { name: s.name, release_date: s.release_date || null, bundles: s.bundles || {} }]));
  const out = dump.map(c => toV3(c, sets));
  fs.writeFileSync(o.out, JSON.stringify(out));
  console.log('krcg-v5 v' + VERSION + ': ' + out.length + ' cards (crypt ' + out.filter(c => (c.types || []).some(t => t === 'Vampire' || t === 'Imbued')).length + ') -> ' + o.out);
  if (o.compare) compare(out, o.compare);
  return 0;
}

if (require.main === module) process.exit(main());
module.exports = { toV3, VERSION };
