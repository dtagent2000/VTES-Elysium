#!/usr/bin/env node
/* gen-trace-harvest.js — the R2 trace harvester                        v1.2.1
   Reads arena jsonl traces ({t, match, bot, type, data}) from a file or a
   directory and produces the analysis the arena's live summary cannot:
   per-bot event histograms, decide-why top lists, the DOCTRINE event detail
   (rush dirs/famed/tBlood, counterfactual dominance triples, torpors,
   warsaw/stray), opening hands + the card-exposure set (F-Q1's honest basis:
   dealt hands + played cards — mid-game DRAWS are not traced today, reported
   as a gap), bleed taken totals, and per-match stall signatures.
   v1.0.1: field-truth fixes -- decide carries {q, ctx, hand, out, pool} (no
   `why` in the emit; q-histograms replace it, and every decide's HAND snapshot
   upgrades exposure to near-complete, deciding F-Q1 without a draw-emit),
   took-bleed carries {n, pool}, and the botless `result` row leaves the
   per-bot sections for the match signature (winner named).
   v1.2.1 (19 Sep 2026): THE PRICE REFEREE rebuilt from the v1.2.0 record (that file never reached the project): every card the
   bots PLAYED (play / through / blocked emits + master-play decides) is priced from vtes.json (printed) and elysium-cardfx.json
   (paid); the two must agree. Missing files = a loud SKIP, never a pass. It checks price DATA, not that a branch deducts it.
   Usage: node gen-trace-harvest.js <file-or-dir> [--out report.md]           */
'use strict';
const fs = require('fs'), path = require('path');

const args = process.argv.slice(2);
if(!args.length){ console.error('usage: node gen-trace-harvest.js <file-or-dir> [--out report.md]'); process.exit(1); }
const target = args[0];
const outIx = args.indexOf('--out');
const outFile = outIx > -1 ? args[outIx + 1] : null;

const files = fs.statSync(target).isDirectory()
  ? fs.readdirSync(target).filter(f => f.endsWith('.jsonl')).map(f => path.join(target, f))
  : [target];

const rows = [];
for(const f of files){
  const base = path.basename(f);
  for(const line of fs.readFileSync(f, 'utf8').split('\n')){
    if(!line.trim()) continue;
    try{ const d = JSON.parse(line); d._file = base; rows.push(d); }
    catch(e){ /* tolerant: a torn tail line is not a failure */ }
  }
}
if(!rows.length){ console.error('no rows'); process.exit(1); }

const key = r => r._file + '#' + (r.match || 1);
const matches = [...new Set(rows.map(key))];
const L = [];
const log = s => L.push(s);

log('# Trace harvest (gen-trace-harvest v1.2.1)');
log('');
log('Files: ' + files.map(f => path.basename(f)).join(', ') + ' · rows ' + rows.length + ' · matches ' + matches.length);
log('');

/* ---------- global + per-bot event histograms ---------- */
const hist = {}, byBot = {};
for(const r of rows){
  hist[r.type] = (hist[r.type] | 0) + 1;
  if(!r.bot) continue;   // v1.0.1: the botless `result` row belongs to the match signature, not the per-bot tables
  const b = r.bot;
  (byBot[b] = byBot[b] || {})[r.type] = ((byBot[b] || {})[r.type] | 0) + 1;
}
log('## Event histogram (global)');
log(Object.entries(hist).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
log('');
log('## Per bot');
for(const [b, h] of Object.entries(byBot)){
  log('- **' + b + '**: ' + Object.entries(h).sort((a, c) => c[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
}
log('');

/* ---------- decide question types + WHY (v1.0.5: the why LIVES in data.out.why --
   v1.0.1 read data.why and wrongly declared it absent; the observability
   discussion's first correction) ---------- */
const qs = {}, whys = {};
for(const r of rows){ if(r.type !== 'decide' || !r.bot) continue;
  const q = (r.data || {}).q || '(no q)';
  ((qs[r.bot] = qs[r.bot] || {})[q] = ((qs[r.bot] || {})[q] | 0) + 1);
  const w = (((r.data || {}).out || {}).why || '').replace(/[\d.]+/g, '#');
  if(w) ((whys[r.bot] = whys[r.bot] || {})[w] = ((whys[r.bot] || {})[w] | 0) + 1);
}
log('## decide() question types per bot');
for(const [b, m] of Object.entries(qs)){
  log('- **' + b + '**: ' + Object.entries(m).sort((a, c) => c[1] - a[1]).map(([q, n]) => q + ' ' + n).join(' · '));
}
log('');
log('## decide() WHY -- top 6 per bot (numbers folded to #)');
for(const [b, m] of Object.entries(whys)){
  const top = Object.entries(m).sort((a, c) => c[1] - a[1]).slice(0, 6);
  log('- **' + b + '**:'); top.forEach(([w, n]) => log('    ' + String(n).padStart(3) + '× ' + w));
}
log('');

/* ---------- the doctrine detail ---------- */
log('## Doctrine events');
let any = false;
for(const r of rows){
  const d = r.data || {};
  if(r.type === 'through' && d.kind === 'rush'){ any = true;
    log('- RUSH through: ' + r.bot + ' → ' + d.target + ' (' + (d.dir || 'fwd') + ', tBlood ' + d.tBlood + (d.famed ? ', FAMED' : '') + ')'); }
  if(r.type === 'blocked' && d.kind === 'rush'){ any = true; log('- RUSH blocked: ' + r.bot + ' (' + (d.dir || '?') + ')'); }
  if(r.type === 'rush-counterfactual'){ any = true;
    log('- CF: ' + r.bot + ' suppressed ' + d.target + ' raw ' + d.raw + ' — threats pred ' + d.tPred + ' / prey ' + d.tPrey + ' / cross ' + d.tCross); }
  if(r.type === 'torpor'){ any = true; log('- TORPOR: ' + r.bot + "'s " + d.vamp + (d.famed ? ' (FAMED — 3 pool)' : '')); }
  if(r.type === 'rushed'){ any = true; log('- RUSHED (defender): ' + r.bot + "'s " + d.vamp + ' by ' + d.by); }
  if(r.type === 'warsaw-refresh' || r.type === 'warsaw-rescue' || r.type === 'stray-unlock'){ any = true;
    log('- ' + r.type.toUpperCase() + ': ' + r.bot + ' — ' + (d.vamp || '')); }
}
if(!any) log('*(none — a calm table doctrine-wise)*');
log('');

/* ---------- F-Q1: Fame + card exposure ---------- */
log('## F-Q1 — Fame & card exposure');
const fameHits = rows.filter(r => JSON.stringify(r).includes('Fame'));
log('Fame string occurrences: **' + fameHits.length + '**' + (fameHits.length ? ' — ' + fameHits.slice(0, 5).map(r => r.bot + '/' + r.type).join(', ') : ''));
const seen = {};
for(const r of rows){
  if(!r.bot) continue;   // v1.0.1: result stays out of exposure too
  const b = r.bot; const S = (seen[b] = seen[b] || new Set());
  const d = r.data || {};
  if(r.type === 'dealt'){ (d.hand || []).forEach(n => S.add(n)); (d.unc || []).forEach(n => S.add(n)); }
  if(r.type === 'decide' && Array.isArray(d.hand)){ d.hand.forEach(n => S.add(n)); }   // v1.0.1-fix: decide.hand is the hand SIZE (int) in this trace era -- array-guarded for a future name-carrying emit
  if(d.card && d.card !== 'hunt') S.add(d.card);   // v1.0.2: the hunt through carries the LITERAL 'hunt', not a card name
  if(d.target && r.type === 'through') S.add(d.target);
}
for(const [b, S] of Object.entries(seen)){
  log('- **' + b + '** exposed cards (' + S.size + '): ' + [...S].sort().join(' · '));
}
log('');
log('> exposure: from bot v0.6.70 every decide carries hand NAMES — the union is COMPLETE');
log('> (F-Q1 decidable per trace). Size-era traces stay readable via the array guard.');

log('');

/* ---------- A5: the codex-crossed metrics (v1.1.0) ---------- */
log('## Metrics (A5)');
const own = {};   // bot -> own-turn count (unlock snapshots)
for(const r of rows){ if(r.type === 'snapshot' && r.data && r.data.tag === 'unlock' && r.bot) own[r.bot] = (own[r.bot] | 0) + 1; }
const raises = {};
for(const r of rows){ if(r.type === 'raise' && r.bot) (raises[r.bot] = raises[r.bot] || []).push(r.data.turn !== undefined ? r.data.turn : '?'); }
log('**Influence tempo** (turn of 1st/2nd/3rd raise -- exact via the raise emit, v0.6.77):');
for(const b of Object.keys(own)){
  log('- ' + b + ': ' + ((raises[b] || []).slice(0, 3).join(', ') || '(no raises traced -- pre-v0.6.76 trace?)'));
}
const plays = {}, cardThroughs = {}, bleedByTurn = {};
for(const r of rows){
  if(!r.bot) continue;
  const d = r.data || {};
  if(r.type === 'play') plays[r.bot] = (plays[r.bot] | 0) + 1;
  if(r.type === 'through'){
    if(d.card && d.card !== 'hunt') cardThroughs[r.bot] = (cardThroughs[r.bot] | 0) + 1;
    const DOCT = ['rush', 'strength', 'recruit', 'creep', 'equip', 'fetch', 'peek', 'stock', 'enemyRescue'];
    if((d.n | 0) > 0 && !DOCT.includes(d.kind) && d.card !== 'hunt'){
      (bleedByTurn[r.bot] = bleedByTurn[r.bot] || []).push(d.n | 0);
    }
  }
}
log('**Cycling (approx)** -- (react/wake plays + card-actions) per own turn; combat-window plays are A2b, so this UNDERCOUNTS:');
for(const b of Object.keys(own)){
  const c = ((plays[b] | 0) + (cardThroughs[b] | 0)) / Math.max(1, own[b]);
  log('- ' + b + ': ' + c.toFixed(2) + ' (' + ((plays[b] | 0) + (cardThroughs[b] | 0)) + ' over ' + own[b] + ' turns)');
}
log('**Bleed pressure** (bleed-class throughs, per-hit list = the curve):');
for(const b of Object.keys(own)){
  const arr = bleedByTurn[b] || [];
  log('- ' + b + ': total ' + arr.reduce((x, y) => x + y, 0) + ' · hits [' + arr.join(',') + ']');
}
const torp = {}, reacts = {};
for(const r of rows){ if(!r.bot) continue;
  if(r.type === 'torpor') torp[r.bot] = (torp[r.bot] | 0) + 1;
  if(r.type === 'play' && /^react-|^wake$/.test((r.data || {}).window || '')) reacts[r.bot] = (reacts[r.bot] | 0) + 1;
}
log('**Torpor count**: ' + (Object.entries(torp).map(([b, n]) => b + ' ' + n).join(' · ') || '(none)') + ' -- duration needs a recovery emit (gap noted)');
log('**Reaction plays**: ' + (Object.entries(reacts).map(([b, n]) => b + ' ' + n).join(' · ') || '(none)'));
log('> Gaps (honest): stealth/intercept margins are not traced; blocks MADE have no emit (only blocks suffered) -- both A2b-class additions.');
log('');

/* ---------- v1.2.1: the price referee (the ECONOMY GATE -- read before any strategy verdict; a MISMATCH voids the series) ---------- */
log('## Price referee');
(function(){
  const here = f => [path.join(process.cwd(), f), path.join(__dirname, f)].find(q => fs.existsSync(q));
  const vp = here('vtes.json'), cp = here('elysium-cardfx.json');
  if(!vp || !cp){ log('**SKIPPED — NOT A PASS:** ' + (!vp ? 'vtes.json ' : '') + (!cp ? 'elysium-cardfx.json ' : '') + 'missing beside the tool.'); log(''); return; }
  const norm = n => String(n || '').replace(/™/g, 'tm').replace(/\s*\(G\d+\)\s*$/i, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const vt = JSON.parse(fs.readFileSync(vp, 'utf8')), printed = {};
  (Array.isArray(vt) ? vt : Object.values(vt)).forEach(c => { if(!c || (c.types || []).indexOf('Vampire') >= 0 || (c.types || []).indexOf('Imbued') >= 0) return; [c.name, c._name, c.printed_name].forEach(n => { if(n) printed[norm(n)] = c; }); });
  const fx = JSON.parse(fs.readFileSync(cp, 'utf8')), paid = {}; Object.keys(fx.lib || {}).forEach(k => { paid[norm(k)] = fx.lib[k]; });
  const played = {};
  for(const r of rows){ const d = r.data || {}; let nm = null;
    if((r.type === 'play' || r.type === 'through' || r.type === 'blocked') && d.card && d.card !== 'hunt') nm = d.card;
    if(r.type === 'decide' && d.q === 'master-play' && d.out && d.out.pick && d.out.pick.name) nm = d.out.pick.name;
    if(r.type === 'referendum-called' && d.card) nm = d.card;
    if(nm) played[nm] = (played[nm] | 0) + 1; }
  const num = x => (x === undefined || x === null || x === '') ? 0 : (/^\d+$/.test(String(x)) ? parseInt(x, 10) : 'X');
  let right = 0; const mism = [], xs = [], unp = [];
  Object.keys(played).sort().forEach(nm => { const pc = printed[norm(nm)], fe = paid[norm(nm)];
    if(!pc || !fe){ unp.push(nm + (!pc ? ' (not in vtes.json)' : ' (not in cardfx)')); return; }
    const pb = num(pc.blood_cost), pp = num(pc.pool_cost), pv = num(pc.conviction_cost);
    if(pb === 'X' || pp === 'X'){ xs.push(nm); return; }
    const fb = (fe.cost && fe.cost.blood) | 0, fp = (fe.cost && fe.cost.pool) | 0;
    if(pb === fb && pp === fp && !pv) right++; else mism.push(nm + ' ×' + played[nm] + ': printed ' + (pb ? pb + ' blood' : pp ? pp + ' pool' : 'free') + ', paid ' + (fb ? fb + ' blood' : fp ? fp + ' pool' : 'free')); });
  log('Distinct cards played: **' + Object.keys(played).length + '** · priced right ' + right + ' · **MISMATCH ' + mism.length + '** · X-cost ' + xs.length + ' · unpriceable ' + unp.length);
  mism.forEach(m => log('- MISMATCH ' + m)); if(xs.length) log('- X-cost (not checked): ' + xs.join(' · ')); if(unp.length) log('- unpriceable: ' + unp.join(' · '));
  log(mism.length ? '> **A MISMATCH VOIDS THE SERIES for strategy verdicts.**' : '> Economy gate: clean on price data.'); log('');
})();

/* ---------- bleed taken + stall signature ---------- */
log('## Bleed taken (took-bleed sums)');
const taken = {};
for(const r of rows){ if(r.type === 'took-bleed'){ taken[r.bot] = (taken[r.bot] | 0) + ((r.data || {}).n | 0); } }   // v1.0.1: the field is n
log(Object.entries(taken).map(([b, n]) => b + ' ' + n).join(' · ') || '*(none)*');
log('');
log('## Match signatures');
for(const mk of matches){
  const mr = rows.filter(r => key(r) === mk);
  const t0 = Math.min(...mr.map(r => r.t)), t1 = Math.max(...mr.map(r => r.t));
  const ousts = mr.filter(r => r.type === 'ousted').map(r => r.bot);
  const res = mr.find(r => r.type === 'result');
  const rd2 = (res && res.data) || {};
  const seatMap = (rd2.bots || []).map(b => b.name + '=' + b.deck + '/' + b.persona).join(' · ');   // v1.0.2: the T3 antidote -- result already carries the deck+persona mapping
  log('- ' + mk + ': ' + mr.length + ' rows · ' + ((t1 - t0) / 1000).toFixed(1) + ' s · ousted: ' + (ousts.join(' → ') || '(none — stall?)')
      + (rd2.winner !== undefined ? ' · winner: ' + (rd2.winner || '(none: ' + rd2.reason + ')') : ''));
  if(seatMap) log('    seats: ' + seatMap);
  const kn = (rd2.bots || []).filter(b => b.knobs && Object.keys(b.knobs).length)
                             .map(b => b.name + ':{' + Object.entries(b.knobs).map(([k, v]) => k + '=' + v).join(' ') + '}').join(' · ');
  if(kn) log('    knobs: ' + kn);   // v1.0.4 (#6): sweep parameters straight from the trace
}

const report = L.join('\n') + '\n';
console.log(report);
if(outFile){ fs.writeFileSync(outFile, report); console.error('→ ' + outFile); }
