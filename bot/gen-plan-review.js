#!/usr/bin/env node
'use strict';
/* gen-plan-review.js v1.0.0 (18 Sep 2026) -- the strategy layer's measurement, per DECK (manifest-keyed,
   never bot names). Usage: node gen-plan-review.js <serie-dir> [<null-dir>]
   Prints: VP / wins / first-out, bleed-through, minion use, the plan histogram, shopping-near-the-kill
   (equip/fetch/stock/peek/recruit/strength actions taken while the live plan read preyTto <= 2), floor bites. */
const fs = require('fs'), path = require('path');
function read(dir){
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')).sort(); const A = {};
  const g = d => A[d] || (A[d] = { m: 0, vp: 0, wins: 0, firstOut: 0, through: 0, bleedsThr: 0, blocked: 0, turns: 0, ready: 0, acted: 0, kept: 0, shop: 0, shopNear: 0, offN: 0, plans: {}, phases: {}, homeSum: 0, planN: 0, floorMax: 0, raises: 0, tBlocks: 0, tWin: 0, oustTurn: [] });
  for(const f of files){
    const rows = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean).map(l => { try{ return JSON.parse(l); }catch(e){ return null; } }).filter(Boolean);
    const deck = {}; for(const r of rows) if(r.type === 'manifest') deck[r.bot] = r.data.deck;
    for(const b in deck) g(deck[b]).m++;
    const cur = {}, plan = {}, turn = {};
    for(const r of rows){ const x = r.data || {};
      if(r.type === 'result'){ for(const b in (x.vp || {})) if(deck[b]){ g(deck[b]).vp += x.vp[b]; } if(deck[x.winner]) g(deck[x.winner]).wins++; if(x.oustOrder && deck[x.oustOrder[0]]) g(deck[x.oustOrder[0]]).firstOut++; continue; }
      const d = deck[r.bot]; if(!d) continue; const a = g(d);
      if(r.type === 'snapshot' && x.tag === 'unlock'){ turn[r.bot] = x.turn; if(x.ready.length){ a.turns++; a.ready += x.ready.length; } }
      if(r.type === 'plan'){ plan[r.bot] = x; a.plans[x.posture] = (a.plans[x.posture] || 0) + 1; a.phases[x.phase] = (a.phases[x.phase] || 0) + 1; a.homeSum += x.home; a.planN++; a.floorMax = Math.max(a.floorMax, x.floor); }
      if(r.type === 'keep-blocker') a.kept++;
      if(r.type === 'raise') a.raises++;
      if(r.type === 'decide' && x.q === 'hunt-or-bleed' && x.out.hunt) a.acted++;
      if(r.type === 'decide' && x.q === 'action'){ a.acted++; const p = x.out.pick || {}; const shop = ['equip', 'fetch', 'stock', 'peek', 'recruit', 'strength'].includes(p.kind);
        if(shop){ a.shop++; const pl = plan[r.bot]; if(pl && pl.reads.preyTto <= 2) a.shopNear++; } else a.offN++; }
      if(r.type === 'through' && !x.kind && x.card !== 'hunt' && (x.n | 0) > 0){ a.through += x.n; a.bleedsThr++; }
      if(r.type === 'blocked' && !x.kind && (x.n | 0) > 0) a.blocked++;
      if(r.type === 'block-eval' && x.T === 'T1'){ a.tWin++; if(x.block) a.tBlocks++; }
      if(r.type === 'ousted') a.oustTurn.push(turn[r.bot]);
    }
  }
  return A;
}
const fmt = (A, title) => { console.log('\n## ' + title); console.log('| deck | wins | VP | first out | through | bleeds thr/blk | ready/t | acted/t | use % | kept | shop (near) | T1 block % | raises | ousted at |'); console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for(const d of ['hacking', 'sewer', 'malkavian', 'tremere', 'nosferatu']){ const a = A[d]; if(!a) continue;
    console.log('| ' + [d, a.wins, a.vp, a.firstOut, a.through, a.bleedsThr + '/' + a.blocked, (a.ready / Math.max(1, a.turns)).toFixed(2), (a.acted / Math.max(1, a.turns)).toFixed(2), Math.round(100 * a.acted / Math.max(1, a.ready)), a.kept, a.shop + ' (' + a.shopNear + ')', a.tWin ? Math.round(100 * a.tBlocks / a.tWin) : '-', a.raises, a.oustTurn.join(',') || '-'].join(' | ') + ' |'); }
  const slow = ['tremere', 'malkavian', 'nosferatu'].reduce((s, d) => s + ((A[d] && A[d].through) || 0), 0); console.log('\nslow decks through (tremere + malkavian + nosferatu): **' + slow + '**');
  let any = false; for(const d in A) if(A[d].planN) any = true;
  if(any){ console.log('\n### plan histogram (emits)'); for(const d of ['hacking', 'sewer', 'malkavian', 'tremere', 'nosferatu']){ const a = A[d]; if(!a || !a.planN) continue; console.log('- **' + d + '**: posture ' + JSON.stringify(a.plans) + ' · phase ' + JSON.stringify(a.phases) + ' · avg home ' + (a.homeSum / a.planN).toFixed(2) + ' · max floor ' + a.floorMax); } } };
const dir = process.argv[2]; if(!dir){ console.error('usage: node gen-plan-review.js <serie-dir> [<null-dir>]'); process.exit(1); }
console.log('# Plan review (gen-plan-review v1.0.0) -- ' + dir);
if(process.argv[3]) fmt(read(process.argv[3]), 'null: ' + process.argv[3]);
fmt(read(dir), 'series: ' + dir);
