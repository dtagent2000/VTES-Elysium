#!/usr/bin/env node
/* gen-batch-review.js — A6: the comparative series reviewer          v1.0.0
   N traces (a series dir) -> ONE comparative document: per-match summaries,
   cross-match metric tables (the A5 set), and a frozen SERIES review
   scaffold (patterns, deck/persona effects, sweep proposals, and which
   single match earns the full-dossier deep dive).
   Usage: node gen-batch-review.js <dir> [--out file.md]                     */
'use strict';
const fs = require('fs'), path = require('path');

const args = process.argv.slice(2);
if(!args.length){ console.error('usage: node gen-batch-review.js <dir> [--out file.md]'); process.exit(1); }
const dir = args[0];
const oIx = args.indexOf('--out');
const outFile = oIx > -1 ? args[oIx + 1] : ('batch-review-' + path.basename(dir) + '.md');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')).sort();
const matches = files.map(f => {
  const rows = [];
  for(const line of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')){
    if(!line.trim()) continue;
    try{ rows.push(JSON.parse(line)); }catch(e){}
  }
  const res = (rows.find(r => r.type === 'result') || {}).data || {};
  const per = {};
  const own = {};
  for(const r of rows){
    if(!r.bot) continue;
    const p = per[r.bot] = per[r.bot] || { raises: [], plays: 0, cardThroughs: 0, bleed: 0, taken: 0 };
    const d = r.data || {};
    if(r.type === 'snapshot' && d.tag === 'unlock') own[r.bot] = (own[r.bot] | 0) + 1;
    if(r.type === 'raise') p.raises.push(d.turn !== undefined ? d.turn : '?');
    if(r.type === 'play') p.plays++;
    if(r.type === 'through'){
      if(d.card && d.card !== 'hunt') p.cardThroughs++;
      const DOCT = ['rush', 'strength', 'recruit', 'creep', 'equip', 'fetch', 'peek', 'stock', 'enemyRescue'];
      if((d.n | 0) > 0 && !DOCT.includes(d.kind) && d.card !== 'hunt') p.bleed += d.n | 0;
    }
    if(r.type === 'took-bleed') p.taken += d.n | 0;
  }
  const botV = ((rows.find(r => r.type === 'manifest') || {}).data || {}).knobs ? null : null;
  return { file: f, res, per, own };
});

const L = []; const log = s => L.push(s);
log('# Series Batch Review — ' + path.basename(dir) + ' (' + matches.length + ' matches)');
log('');

/* ---------- per-match one-liners ---------- */
log('## Matches');
matches.forEach((m, i) => {
  const seats = (m.res.bots || []).map(b => b.name + '=' + b.deck + '/' + b.persona).join(' · ');
  log('- **M' + (i + 1) + '** (' + m.file + '): winner ' + (m.res.winner || '(none: ' + (m.res.reason || '?') + ')')
      + ' · ousts ' + ((m.res.oustOrder || []).join('→') || '-') + ' · rounds ' + (m.res.rounds || '?'));
  log('    ' + seats);
});
log('');

/* ---------- cross-match tables ---------- */
const botNames = [...new Set(matches.flatMap(m => Object.keys(m.per)))];
const cell = (m, b, fn) => (m.per[b] ? fn(m.per[b], m.own[b] | 0) : '-');
const table = (title, fn) => {
  log('**' + title + '**');
  log('| bot | ' + matches.map((_, i) => 'M' + (i + 1)).join(' | ') + ' |');
  log('|---|' + matches.map(() => '---').join('|') + '|');
  for(const b of botNames){
    log('| ' + b + ' | ' + matches.map(m => cell(m, b, fn)).join(' | ') + ' |');
  }
  log('');
};
log('## Cross-match metrics');
table('Influence tempo (raise turns)', p => p.raises.join(',') || '(pre-.76)');
table('Cycling approx (plays+card-actions / own turns)', (p, o) => o ? ((p.plays + p.cardThroughs) / o).toFixed(2) : '-');
table('Bleed dealt (bleed-class)', p => p.bleed);
table('Bleed taken', p => p.taken);

/* ---------- the frozen SERIES scaffold ---------- */
log('## Series review scaffold — produce the comparative report in EXACTLY this structure');
log('');
log('You are reviewing a SERIES. Per-match dossiers exist for deep dives (gen-match-dossier.js on any file above). Cite matches as M<n>.');
log('');
log('### Series Report — Pattern summary');
log('(3–5 sentences: what repeats across matches, what varies, the strongest cross-match signal.)');
log('### Deck & persona effects');
log('(Which results follow the DECK across matches, which follow the PERSONA/seat? Cite the tables.)');
log('### Version deltas (if the series spans engine versions)');
log('(What changed between M-rows -- tie to the version notes if known.)');
log('### Sweep proposals');
log('(Concrete `--knob` series with treatment seats, N matches, and the metric that will decide.)');
log('### The deep-dive pick');
log('(Which ONE match earns a full dossier review, and why.)');
log('### Confidence notes');
log('(Sample-size honesty; what the batch cannot separate.)');

const report = L.join('\n') + '\n';
fs.writeFileSync(outFile, report);
console.log('→ ' + outFile + ' · ~' + Math.round(report.length / 4 / 1000) + 'k tokens · ' + matches.length + ' matches');
