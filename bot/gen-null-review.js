#!/usr/bin/env node
/* gen-null-review.js — the decision-level read of a starter-table series                     v1.0.0 (18 Sep 2026)
   Reads every match-*.jsonl in a series directory and prints what the arena's winner table cannot: per deck results, and per
   POLITICAL deck the referendum funnel (available -> picked -> called -> blocked -> voted -> passed), when the first referendum came
   (in action decisions), what beat a referendum that was on offer, the debt-23b tag (scores.polOverBuild), act-again outcomes
   (acted / kept home / no legal action left), torpor -> recover, and the live sightings list. Deck and seat come from the MANIFEST only.
   Usage: node gen-null-review.js <dir> [--out report.md] [--deck ventrue]                                                         */
'use strict';
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2); if(!args.length){ console.error('usage: node gen-null-review.js <dir> [--out f.md] [--deck ventrue]'); process.exit(1); }
const dir = args[0], outIx = args.indexOf('--out'), dkIx = args.indexOf('--deck'), POL = dkIx > -1 ? args[dkIx + 1] : 'ventrue';
const files = fs.readdirSync(dir).filter(f => /^match-.*\.jsonl$/.test(f)).sort();
const L = [], log = s => L.push(s), pct = (a, b) => b ? Math.round(100 * a / b) + ' %' : '–', med = a => { if(!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const decks = {}, D = k => decks[k] = decks[k] || { n: 0, wins: 0, vp: 0, firstOut: 0, survived: 0, oustTurn: [], torpor: 0, recover: 0, recVia: {}, refVotes: { for: 0, against: 0, none: 0 }, aa: { paid: 0, free: 0, acted: 0, kept: 0, noLegal: 0, other: 0 }, blocksMade: 0, tookBleed: 0 };
const pol = { matches: 0, firstAt: [], calledPer: [], called: 0, blocked: 0, voted: 0, passed: 0, unresolved: 0, byCard: {}, offered: 0, picked: 0, beatenBy: {}, ob: { economy: 0, reach: 0 }, obMatches: 0, actionsPer: [], turnsPer: [], barPlays: 0, barDecides: 0, barWhy: {} };
const seen = {}; const see = (k, f) => { (seen[k] = seen[k] || { n: 0, files: new Set() }).n++; seen[k].files.add(f); };
const perMatch = []; let errs = 0, timeouts = 0;
for(const f of files){
  const rows = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch(e){ return null; } }).filter(Boolean);
  const deckOf = {}, seatOf = {}; rows.forEach(r => { if(r.type === 'manifest'){ deckOf[r.bot] = r.data.deck; seatOf[r.bot] = r.data.seat; } });
  const res = (rows.find(r => r.type === 'result') || {}).data; if(!res){ log('!! ' + f + ': no result row (aborted?)'); continue; }
  if(res.reason === 'timeout') timeouts++;
  const turnOf = {}; rows.forEach(r => { if(r.type === 'plan' && r.data.tag === 'unlock') turnOf[r.bot] = Math.max(turnOf[r.bot] | 0, r.data.turn | 0); });
  Object.keys(deckOf).forEach(b => { const d = D(deckOf[b]); d.n++; d.vp += (res.vp || {})[b] || 0; if(res.winner === b) d.wins++; const oi = (res.oustOrder || []).indexOf(b); if(oi === 0) d.firstOut++; if(oi < 0) d.survived++; else d.oustTurn.push(turnOf[b] | 0); });
  const lastAA = {};   // bot -> pending act-again awaiting its outcome
  let firstRefAt = null, actionN = 0, calledHere = 0, obHere = false, openRef = null;
  for(const r of rows){ const b = r.bot, dk = deckOf[b], d = dk && D(dk), x = r.data || {};
    if(r.type === 'server-err'){ errs++; continue; } if(!d) continue;
    if(r.type === 'torpor') d.torpor++;
    if(r.type === 'recover'){ d.recover++; d.recVia[x.via] = (d.recVia[x.via] | 0) + 1; if(x.via === 'leaveTorpor') see('leave torpor', f); if(x.via === 'ownRescue') see('own rescue', f); }
    if(r.type === 'ref-vote') d.refVotes[x.dir || 'none'] += 1;
    if(r.type === 'block-made') d.blocksMade++; if(r.type === 'took-bleed') d.tookBleed += x.n | 0;
    if(r.type === 'act-again'){ if(x.card) d.aa.paid++; else { d.aa.free++; if(x.via === 'crypt text') see('Sybren-class unlock (crypt text)', f); } lastAA[b] = x.vamp; }
    else if(lastAA[b] && (r.type === 'keep-blocker' || r.type === 'stays-home') && x.vamp === lastAA[b]){ if(r.type === 'keep-blocker') d.aa.kept++; else if(/no legal action/.test(x.why || '')) d.aa.noLegal++; else d.aa.other++; lastAA[b] = null; }
    else if(lastAA[b] && (r.type === 'through' || r.type === 'blocked' || r.type === 'referendum-called') && x.vamp === lastAA[b]){ d.aa.acted++; lastAA[b] = null; }
    if(r.type === 'vote-tax') see('vote tax paid (Silverson-class)', f);
    if(r.type === 'block-barred') see('block-barred on a receiving bot', f);
    if(r.type === 'give-lock') see('Anarch Troublemaker give-lock', f); if(r.type === 'given') see('given received', f);
    if(r.type === 'cost-returned') see('cost returned on a block', f); if(r.type === 'income-direction') see('income direction', f);
    if(r.type === 'play'){ if(/Daring the Dawn/.test(x.card || '')) see('Daring the Dawn played', f); if(/Voter Captivation/.test(x.card || '')) see('Voter Captivation played', f); if(x.window === 'vote-discard' || /discard/.test(x.window || '')) see('Alexa-class discard for votes', f); }
    if(dk !== POL) continue;
    if(r.type === 'decide' && x.q === 'block-bar'){ pol.barDecides++; const o = x.out || {}; if(o.play) pol.barPlays++; else { const k = String(o.why || '').replace(/^[^:]*held: /, '').replace(/\(.*?\)/g, '').replace(/[0-9.]+/g, 'N').slice(0, 70); pol.barWhy[k] = (pol.barWhy[k] | 0) + 1; } }
    if(r.type === 'decide' && x.q === 'action'){ actionN++; const c = x.ctx || {}, o = x.out || {}, pk = o.pick || {};
      if(c.pol){ pol.offered++; if(pk.kind === 'political') pol.picked++; else { const k = pk.name ? (pk.kind === 'stock' || /stocks/.test(o.why || '') ? 'stock: ' : '') + pk.name : (pk.illegal ? 'illegal bleed marker' : /rescue/.test(o.why || '') ? 'own rescue' : 'plain bleed'); pol.beatenBy[k] = (pol.beatenBy[k] | 0) + 1; } }
      const tag = o.scores && o.scores.polOverBuild; if(tag){ pol.ob[tag]++; obHere = true; } }
    if(r.type === 'referendum-called'){ pol.called++; calledHere++; pol.byCard[x.card] = pol.byCard[x.card] || { called: 0, blocked: 0, passed: 0, failed: 0 }; pol.byCard[x.card].called++; if(firstRefAt === null) firstRefAt = actionN; if(openRef) pol.unresolved++; openRef = x.card; }
    if(r.type === 'blocked' && openRef && x.kind === 'political'){ pol.blocked++; pol.byCard[openRef].blocked++; openRef = null; }
    if(r.type === 'referendum'){ pol.voted++; if(x.passed){ pol.passed++; pol.byCard[x.card].passed++; } else pol.byCard[x.card].failed++; openRef = null; }
  }
  if(openRef) pol.unresolved++;
  const pb = Object.keys(deckOf).find(b => deckOf[b] === POL);
  if(pb){ pol.matches++; pol.firstAt.push(firstRefAt === null ? Infinity : firstRefAt); pol.calledPer.push(calledHere); pol.actionsPer.push(actionN); pol.turnsPer.push(turnOf[pb] | 0); if(obHere) pol.obMatches++; }
  const order = Object.keys(deckOf).sort((a, b) => (seatOf[a] | 0) - (seatOf[b] | 0)).map(b => deckOf[b]).join(' → ');
  perMatch.push('| ' + f.replace(/^match-\d+-|\.jsonl$/g, '') + ' | ' + order + ' | ' + (deckOf[res.winner] || res.winner) + ' | ' + (res.oustOrder || []).map(b => deckOf[b]).join(' → ') + ' | ' + Object.keys(res.vp || {}).map(b => deckOf[b] + ' ' + res.vp[b]).join(', ') + ' | ' + res.rounds + ' | ' + res.reason + ' | ' + (pb ? calledHere + ' (first at action #' + (firstRefAt === null ? '—' : firstRefAt) + ' of ' + actionN + ')' : '') + ' |');
}
log('# Null review (gen-null-review v1.0.0) — ' + dir); log(''); log('Matches: ' + perMatch.length + ' · server-err ' + errs + ' · timeouts ' + timeouts); log('');
log('## Matches'); log('| run | seats 1..N | winner | oust order | VP | rounds | reason | ' + POL + ' referendums |'); log('|---|---|---|---|---|---|---|---|'); perMatch.forEach(l => log(l)); log('');
log('## Per deck'); log('| deck | n | wins | VP | VP/match | first out | survived | median oust turn | blocks made | bleed taken | torpor → recovered | via |'); log('|---|---|---|---|---|---|---|---|---|---|---|---|');
Object.keys(decks).sort().forEach(k => { const d = decks[k]; log('| ' + k + ' | ' + d.n + ' | ' + d.wins + ' | ' + d.vp + ' | ' + (d.vp / Math.max(1, d.n)).toFixed(2) + ' | ' + d.firstOut + ' | ' + d.survived + ' | ' + (med(d.oustTurn) ?? '–') + ' | ' + d.blocksMade + ' | ' + d.tookBleed + ' | ' + d.torpor + ' → ' + d.recover + ' (' + pct(d.recover, d.torpor) + ') | ' + Object.keys(d.recVia).map(v => v + ' ' + d.recVia[v]).join(', ') + ' |'); }); log('');
log('## The referendum funnel — ' + POL);
log('- action decisions with a referendum ON OFFER: ' + pol.offered + ' → picked ' + pol.picked + ' (' + pct(pol.picked, pol.offered) + ')');
log('- beaten by: ' + (Object.keys(pol.beatenBy).sort((a, b) => pol.beatenBy[b] - pol.beatenBy[a]).map(k => k + ' ×' + pol.beatenBy[k]).join(' · ') || '—'));
log('- called ' + pol.called + ' → blocked ' + pol.blocked + ' (' + pct(pol.blocked, pol.called) + ') → voted ' + pol.voted + ' → passed ' + pol.passed + ' (' + pct(pol.passed, pol.voted) + ' of voted)' + (pol.unresolved ? ' · unresolved ' + pol.unresolved : ''));
log('- per card: ' + Object.keys(pol.byCard).map(c => c + ' ' + JSON.stringify(pol.byCard[c])).join(' · '));
log('- per match: called ' + JSON.stringify(pol.calledPer) + ' (median ' + med(pol.calledPer) + ') · action decisions ' + JSON.stringify(pol.actionsPer) + ' · own turns ' + JSON.stringify(pol.turnsPer));
log('- first referendum at action decision #: ' + JSON.stringify(pol.firstAt.map(v => v === Infinity ? null : v)) + ' → at or before #3 in ' + pol.firstAt.filter(v => v <= 3).length + ' of ' + pol.matches);
log('- debt 23b (scores.polOverBuild): economy ' + pol.ob.economy + ' · reach ' + pol.ob.reach + ' · in ' + pol.obMatches + ' of ' + pol.matches + ' matches');
log('- block-bar decides ' + pol.barDecides + ' → played ' + pol.barPlays + (Object.keys(pol.barWhy).length ? ' · held because: ' + Object.keys(pol.barWhy).map(k => k + ' ×' + pol.barWhy[k]).join(' · ') : '')); log('');
log('## Votes cast by receiving bots (ref-vote)'); Object.keys(decks).sort().forEach(k => { const v = decks[k].refVotes; log('- ' + k + ': for ' + v.for + ' · against ' + v.against + ' · none ' + v.none); }); log('');
log('## act-again'); Object.keys(decks).sort().forEach(k => { const a = decks[k].aa; if(a.paid + a.free) log('- ' + k + ': paid ' + a.paid + ' · free ' + a.free + ' → acted ' + a.acted + ' · kept home by keep-blocker ' + a.kept + ' · NO LEGAL ACTION LEFT ' + a.noLegal + ' · other stay ' + a.other); }); log('');
log('## Live sightings'); Object.keys(seen).sort().forEach(k => log('- ' + k + ': ' + seen[k].n + ' (in ' + seen[k].files.size + ' match' + (seen[k].files.size === 1 ? '' : 'es') + ')'));
const out = L.join('\n') + '\n'; if(outIx > -1) fs.writeFileSync(args[outIx + 1], out); else process.stdout.write(out);
