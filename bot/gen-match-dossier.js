#!/usr/bin/env node
/* gen-match-dossier.js — A3: the battle dossier renderer            v1.0.5
   Turns ONE arena trace into an LLM-first review document (Johan's #5:
   data optimally parseable, output = a "battle report" draft for review).
   Design: deterministic T<n> refs for citation, one event per line,
   manifests FIRST (intent before play), a per-turn FACIT line (every bot's
   current hand from its latest dealt/decide — the union across sanitized
   views), and a FROZEN battle-report template appended so reviews are
   comparable match-over-match and mechanically convertible to backlog rows.
   Tiers: --full (default; react snapshots + every decide) | --compact
   (own-turn snapshots + action/master decides + outcomes).
   Usage: node gen-match-dossier.js <trace.jsonl> [--compact] [--out f.md]  */
'use strict';
const fs = require('fs'), path = require('path');

const args = process.argv.slice(2);
if(!args.length){ console.error('usage: node gen-match-dossier.js <trace.jsonl> [--compact] [--out file.md]'); process.exit(1); }
const file = args[0];
const compact = args.includes('--compact');
const oIx = args.indexOf('--out');
const outFile = oIx > -1 ? args[oIx + 1] : ('dossier-' + path.basename(file).replace(/\.jsonl$/, '') + (compact ? '-compact' : '') + '.md');

const rows = [];
for(const line of fs.readFileSync(file, 'utf8').split('\n')){
  if(!line.trim()) continue;
  try{ rows.push(JSON.parse(line)); }catch(e){}
}
rows.sort((a, b) => a.t - b.t);
const t0 = rows.length ? rows[0].t : 0;
const ts = r => '+' + ((r.t - t0) / 1000).toFixed(1) + 's';
const res = rows.find(r => r.type === 'result');
const rd = (res && res.data) || {};
const bots = (rd.bots || []).map(b => b.name);

const L = [];
const log = s => L.push(s);
const kv = o => Object.entries(o || {}).map(([k, v]) => k + '=' + (Array.isArray(v) ? JSON.stringify(v) : (v && typeof v === 'object') ? JSON.stringify(v) : v)).join(' ');   // v1.0.3: arrays of objects stringify (influence-pick's considered)

/* ---------- header ---------- */
log('# Battle Dossier — ' + path.basename(file));
log('');
log('winner: ' + (rd.winner || '(none: ' + (rd.reason || '?') + ')') + ' · rounds ' + (rd.rounds || '?') + ' · oust order: ' + ((rd.oustOrder || []).join(' → ') || '(none)'));
log('seats: ' + (rd.bots || []).map((b, i) => (i + 1) + ':' + b.name + '=' + b.deck + '/' + b.persona).join(' · '));
log('');

/* ---------- manifests (intent BEFORE play) ---------- */
log('## Manifests — the yardsticks');
for(const r of rows.filter(x => x.type === 'manifest')){
  const d = r.data || {};
  log('- **' + r.bot + '** (' + d.deck + '/' + d.persona + '): ' + (d.strategy || '(no curated strategy)'));
  log('  axes: [' + (d.axes || []).join(', ') + '] · knobs: ' + kv(d.knobs));
}
log('');

/* ---------- per-turn timeline with facit ---------- */
log('## Timeline');
log('Legend: SNAP=actor state at own unlock · FACIT=every bot\'s current hand (union of sanitized views) · D=decision (pick|why|scores) · P=card play · EV=outcome event. Cite as T<n>.');
log('');
const lastHand = {};   // bot -> latest known hand names
for(const r of rows){ if(r.type === 'dealt' && r.bot) lastHand[r.bot] = (r.data.hand || []).slice(); }

const unlocks = rows.filter(r => r.type === 'snapshot' && r.data && r.data.tag === 'unlock');
let tn = 0;
let cursor = 0;
for(let ui = 0; ui < unlocks.length; ui++){
  const u = unlocks[ui];
  const next = unlocks[ui + 1];
  const endT = next ? next.t : Infinity;
  tn++;
  const d = u.data;
  const preInit = (d.handN === 0 && d.unc === 0 && d.ready.length === 0);   // v1.0.1: the A2b note in action -- seat 1's first unlock can precede its deal
  log('### T' + tn + ' — ' + u.bot + ' (turn ' + d.turn + ', ' + ts(u) + (preInit ? ', PRE-INIT: read dealt/T2+ for true start state' : '') + ')');
  log('SNAP pool=' + d.pool + ' edge=' + d.edge + ' handN=' + d.handN + ' unc=' + d.unc
      + ' ready=' + JSON.stringify(d.ready) + (d.torpor.length ? ' torpor=' + JSON.stringify(d.torpor) : '')
      + ' pubs=' + JSON.stringify(d.pubs) + ' threat=' + JSON.stringify(d.threat));
  /* events inside this turn window */
  while(cursor < rows.length && rows[cursor].t <= (next ? endT : Infinity)){
    const r = rows[cursor];
    if(next && r.t >= endT) break;
    cursor++;
    if(r.t < u.t) continue;
    const rdd = r.data || {};
    if(r.type === 'decide'){
      if(Array.isArray(rdd.hand)) lastHand[r.bot] = rdd.hand.slice();
      const q = rdd.q;
      if(compact && q !== 'action' && q !== 'master-play') continue;
      const out = rdd.out || {};
      const pick = out.pick == null ? 'null' : (out.pick.kind || out.pick.name || (out.pick.seat !== undefined ? 'seat ' + out.pick.seat : JSON.stringify(out.pick).slice(0, 40)));
      log('D ' + ts(r) + ' ' + r.bot + ' q=' + q + ' pick=' + pick + ' why="' + (out.why || '') + '"' + (out.scores ? ' scores=' + JSON.stringify(out.scores) : ''));
    }
    else if(r.type === 'snapshot' && rdd.tag === 'react'){
      if(!compact) log('SNAP-react ' + ts(r) + ' ' + r.bot + ' pool=' + rdd.pool + ' handN=' + rdd.handN + ' ready=' + rdd.ready.length + ' threat=' + JSON.stringify(rdd.threat));
    }
    else if(r.type === 'play'){
      log('P ' + ts(r) + ' ' + r.bot + ' plays ' + rdd.card + ' [' + rdd.window + ']' + (rdd.vamp ? ' by ' + rdd.vamp : ''));
    }
    else if(['through', 'blocked', 'torpor', 'rushed', 'took-bleed', 'ousted', 'rush-counterfactual', 'warsaw-refresh', 'warsaw-rescue', 'stray-unlock', 'influence-pick', 'raise', 'block-made', 'recover'].includes(r.type)){
      log('EV ' + ts(r) + ' ' + r.bot + ' ' + r.type + ' ' + kv(rdd));
    }
  }
  log('FACIT hands: ' + bots.map(b => b + ':[' + (lastHand[b] || []).join(', ') + ']').join(' · '));
  log('');
}

/* ---------- endgame ---------- */
log('## Endgame');
for(const b of (rd.bots || [])){
  log('- **' + b.name + '**: dealt ' + b.damageDealt + ' · taken ' + b.damageTaken + ' · decisions ' + b.decisions
      + ' · doctrine ' + kv(b.doctrine));
}
const traj = {};
for(const u of unlocks){ (traj[u.bot] = traj[u.bot] || []).push(u.data.turn + ':' + u.data.pool); }
log('pool trajectory (turn:pool): ' + Object.entries(traj).map(([b, a]) => b + ' ' + a.join(' ')).join(' · '));
log('');

/* ---------- the frozen battle-report template ---------- */
log('## Review scaffold — produce the battle report in EXACTLY this structure');
log('');
log('You are reviewing this match with full facit. The manifests above are each bot\'s intended strategy. Cite turn refs (T<n>) for every claim. Output the following sections verbatim as headings:');
log('');
log('### Battle Report — Summary');
log('(3–5 sentences: how the match unfolded, who executed their manifest, the decisive swing.)');
log('### Strategy adherence per bot');
log('(Per bot: did play match the manifest? 2–3 cited T-refs each; note persona-consistent deviations vs logic gaps.)');
log('### Top-3 misplays (with facit)');
log('(Each: T-ref · what happened · what the facit shows was better · which code surface likely decides it.)');
log('### Missed windows');
log('(Blocks/bounces/rescues/rushes available-but-unscored; cite the FACIT hand line proving availability.)');
log('### Knob hypotheses');
log('(Concrete `--knob` lines with expected effect, treatment-vs-control seat prefixes where useful.)');
log('### Logic hypotheses');
log('(Finder/scoring changes, phrased against named functions; smallest testable change first.)');
log('### Confidence notes');
log('(What the trace could NOT show; what A2b/telemetry additions would settle it.)');

const report = L.join('\n') + '\n';
fs.writeFileSync(outFile, report);
console.log('→ ' + outFile + ' · ~' + Math.round(report.length / 4 / 1000) + 'k tokens (' + (compact ? 'compact' : 'full') + ')');
