#!/usr/bin/env node
/* gen-forecast-calibration.js — the forecast calibration (18 Sep 2026)          v1.0.0
   The one-off measurement behind CLAUDE.md's debt 5, now a project file so it
   measures the same way every time. Two numbers per series:
     (a) HIT RATE per deck = through / (through + blocked) on the bots' own
         offensive actions (the `through` and `blocked` emits);
     (b) FORECAST vs ACTUAL per table round: for each bot, the window between
         two of its own `unlock` snapshots is one round; forecast = the first
         target-role block-eval's model.forecast in that window (what the bot
         expected its predator to do), actual = the sum of its `took-bleed` n.
         Ratio actual/forecast: 1.0 is a calibrated forecast; the 18 Sep null
         (serie-b2null-all) read 0.66 (over-read once bots bare-block), and the
         target after B2 step 1 is 1.0 ± 0.2.
   Usage: node gen-forecast-calibration.js <dir-or-file> [more...]              */
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2); if(!args.length){ console.error('usage: gen-forecast-calibration.js <dir-or-file>...'); process.exit(2); }
const files = [];
for(const a of args){ const st = fs.statSync(a); if(st.isDirectory()) fs.readdirSync(a).filter(f => f.endsWith('.jsonl')).forEach(f => files.push(path.join(a, f))); else files.push(a); }
const hit = {}, pairs = [];
for(const f of files){
  const rows = fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
  const deckOf = {}; rows.forEach(r => { if(r.type === 'manifest') deckOf[r.bot] = (r.data || {}).deck || '?'; });
  const bots = [...new Set(rows.map(r => r.bot))];
  for(const bot of bots){
    const d = deckOf[bot] || '?'; const h = hit[d] = hit[d] || { through: 0, blocked: 0, sum: 0 };
    let cur = null;
    for(const r of rows){
      if(r.bot !== bot) continue; const x = r.data || {};
      if(r.type === 'through' && (!x.kind || x.kind === 'bleed' || x.kind === 'plain' || x.kind === 'card')){ h.through++; h.sum += x.n | 0; }
      if(r.type === 'blocked') h.blocked++;
      if(r.type === 'snapshot' && x.tag === 'unlock'){ if(cur && cur.fc != null) pairs.push({ deck: d, fc: cur.fc, dmg: cur.dmg }); cur = { fc: null, dmg: 0 }; }
      if(!cur) continue;
      if(r.type === 'block-eval' && x.role === 'target' && x.model && cur.fc == null) cur.fc = x.model.forecast;
      if(r.type === 'took-bleed') cur.dmg += x.n | 0;
    }
  }
}
console.log('# Forecast calibration (gen-forecast-calibration v1.0.0) — ' + files.length + ' trace(s)');
console.log('\n## Hit rate per deck (own offensive actions: through / (through + blocked))');
Object.entries(hit).sort().forEach(([d, h]) => console.log('- ' + d.padEnd(10) + ' through ' + h.through + ' (sum ' + h.sum + ', avg ' + (h.sum / Math.max(1, h.through)).toFixed(2) + ')  blocked ' + h.blocked + '  → hit ' + (h.through / Math.max(1, h.through + h.blocked)).toFixed(2)));
const fc = pairs.reduce((a, p) => a + p.fc, 0), dm = pairs.reduce((a, p) => a + p.dmg, 0);
console.log('\n## Forecast vs actual pool damage per table round (' + pairs.length + ' rounds)');
console.log('- sum forecast ' + fc.toFixed(1) + ' · sum actual ' + dm + ' · **ratio actual/forecast ' + (fc ? (dm / fc).toFixed(2) : 'n/a') + '** (target 1.0 ± 0.2)');
const big = pairs.filter(p => p.fc >= 3); if(big.length) console.log('- when forecast ≥ 3: ' + big.length + ' rounds, ratio ' + (big.reduce((a, p) => a + p.dmg, 0) / big.reduce((a, p) => a + p.fc, 0)).toFixed(2));
console.log('- actual > forecast in ' + pairs.filter(p => p.dmg > p.fc).length + ' of ' + pairs.length + ' rounds (under-reads)');
const byDeck = {}; pairs.forEach(p => { const b = byDeck[p.deck] = byDeck[p.deck] || { fc: 0, dmg: 0, n: 0 }; b.fc += p.fc; b.dmg += p.dmg; b.n++; });
console.log('- per deck (the bot whose forecast it was): ' + Object.entries(byDeck).sort().map(([d, b]) => d + ' ' + (b.fc ? (b.dmg / b.fc).toFixed(2) : 'n/a') + ' (' + b.n + ')').join(' · '));
