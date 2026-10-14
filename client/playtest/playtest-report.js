#!/usr/bin/env node
'use strict';
/* ============================================================
   playtest-report.js v1.0.0 (14 Oct 2026, client v2.6.158) -- the numbers from a play-test run
   ------------------------------------------------------------
     node playtest-report.js <run dir | timeline.jsonl>
   Reads the timeline playtest-rig.js wrote and prints: the turns (how long each bot turn took, how
   long before its first phase line), the phase pacing, every wait a bot made on the human (how late
   its question appeared in chat, how long the wait stayed open, what the reflex said), the moments
   two bots spoke within a second of each other, the same line from two bots, the silence after
   each bot-vs-bot combat round, and the bots' own `wait` rows grouped. These are the measurements
   behind docs/handoffs/REPLY-to-bot-2026-10-14-playtest.md.
   ============================================================ */
const fs = require('fs'), path = require('path');
const p = process.argv[2]; if (!p) { console.log('usage: node playtest-report.js <run dir | timeline.jsonl>'); process.exit(1); }
const file = fs.statSync(p).isDirectory() ? path.join(p, 'timeline.jsonl') : p;
const ev = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean)
  .filter(e => !(e.src === 'con' && /^Failed to load resource/.test(e.text || '')));
const med = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const f1 = x => x == null ? '-' : (+x).toFixed(1);
const out = []; const H = t => out.push('\n== ' + t + ' ==');
const ready = ev.find(e => e.src === 'ready') || {};
const me = (ev.find(e => e.src === 'wsname' && e.ws === 1) || {}).name || null;
const bots = [...new Set(ev.filter(e => e.src === 'wsname' && e.ws !== 1).map(e => e.name))];
const last = ev.length ? ev[ev.length - 1].t : 0;
H('Run');
out.push('client v' + (ready.client || '?') + ', ' + f1(last / 60) + ' min, human ' + me + ', bots ' + bots.join(', '));
out.push('tempo changes: ' + (ev.filter(e => e.src === 'botcfg').map(e => '@' + f1(e.t) + ' ' + e.m.tempo + (e.m.tempo === 'turn' ? '' : ' ' + e.m.waitSecs + 's')).join(', ') || 'none'));
out.push('page errors: ' + ev.filter(e => e.src === 'pageerror').length + ', sockets closed: ' + ev.filter(e => e.src === 'wsclose').length + ', failed resource loads: ' + ev.filter(e => e.src === 'loads').reduce((a, e) => a + (e.failed | 0), 0) + ', notes: ' + ev.filter(e => e.src === 'note').length);

// ---- turns ----
H('Turns (lead = turn to the first phase line; total = turn to "Turn passed.")');
let tempo = 'standard'; const turns = []; let cur = null;
const ACT = /bleeds for|calls a political action|hunts|recruits|employs|plays .* — |rescues|rushes|takes a card action|takes an undirected action|attempts to leave torpor/;
for (const e of ev) {
  if (e.src === 'botcfg') tempo = e.m.tempo;
  if (e.src === 'turn') { if (cur) turns.push(cur); cur = { seat: e.seat, who: e.who, t0: e.t, tempo, first: null, end: null, acts: 0 }; }
  if (!cur) continue;
  if ((e.src === 'log' && e.who === cur.who) || (e.src === 'me' && e.kind === 'log' && cur.who === me)) {
    const txt = e.txt || ''; if (cur.first == null && /^Phase:/.test(txt)) cur.first = e.t; if (/^Turn passed/.test(txt)) cur.end = e.t; if (ACT.test(txt)) cur.acts++; }
  if (e.src === 'me' && e.kind === 'pass' && cur.who === me) cur.end = e.t;
}
if (cur) turns.push(cur);
for (const t of turns) out.push('  ' + f1(t.t0).padStart(7) + 's  seat ' + t.seat + ' ' + String(t.who).padEnd(10) + ' ' + t.tempo.padEnd(9) + ' lead ' + f1(t.first != null ? t.first - t.t0 : null).padStart(5) + 's  total ' + f1(t.end != null ? t.end - t.t0 : null).padStart(6) + 's  actions ' + t.acts);
for (const b of bots) { const bt = turns.filter(t => t.who === b && t.end != null), empty = bt.filter(t => !t.acts).map(t => t.end - t.t0), busy = bt.filter(t => t.acts).map(t => t.end - t.t0);
  out.push('  ' + b + ': ' + bt.length + ' turns; empty ' + empty.length + ' (median ' + f1(med(empty)) + ' s), with actions ' + busy.length + ' (median ' + f1(med(busy)) + ' s, max ' + f1(busy.length ? Math.max(...busy) : null) + ' s)'); }

// ---- phase pacing ----
H('Phase pacing (gaps between a bot\'s consecutive phase lines, under 10 s)');
for (const b of bots) { const ls = ev.filter(e => e.src === 'log' && e.who === b && /^Phase:/.test(e.txt || '')); const g = [];
  for (let i = 1; i < ls.length; i++) { const d = ls[i].t - ls[i - 1].t; if (d < 10) g.push(d); }
  out.push('  ' + b + ': ' + g.length + ' gaps, median ' + f1(med(g)) + ' s, min ' + f1(g.length ? Math.min(...g) : null) + ', max ' + f1(g.length ? Math.max(...g) : null)); }

// ---- waits on the human ----
H('Waits on the human (lag = wait opened to its question in chat; open = how long the wait stayed open)');
const asks = []; const openA = {};
for (const e of ev) {
  if (e.src === 'ask') { openA[e.bot] = { t: e.t, bot: e.bot, kind: e.kind, w: e.w, lag: null, open: null, reflex: null, tempo }; asks.push(openA[e.bot]); }
  else if (e.src === 'botcfg') tempo = e.m.tempo;
  else if (e.src === 'askChat' && openA[e.bot]) openA[e.bot].lag = e.lag / 1000;
  else if (e.src === 'askEnd' && openA[e.bot]) { openA[e.bot].open = e.ms / 1000; delete openA[e.bot]; }
  else if (e.src === 'reflex' && openA[e.bot]) openA[e.bot].reflex = e.act || e.skip;
}
tempo = 'standard';
for (const a of asks) out.push('  ' + f1(a.t).padStart(7) + 's ' + a.tempo.padEnd(9) + a.kind.padEnd(8) + ' ' + String(a.bot).padEnd(8) + ' lag ' + (a.lag == null ? '   -' : f1(a.lag).padStart(4)) + 's  open ' + (a.open == null ? '    -' : f1(a.open).padStart(5)) + 's' + (a.lag != null && a.open != null && a.lag > a.open ? '  QUESTION AFTER THE WAIT CLOSED' : '') + (a.reflex ? '  reflex ' + a.reflex : '') + '  ' + a.w);
const kinds = [...new Set(asks.map(a => a.kind))];
for (const k of kinds) { const as = asks.filter(a => a.kind === k), lags = as.map(a => a.lag).filter(x => x != null), late = as.filter(a => a.lag != null && a.open != null && a.lag > a.open).length;
  out.push('  ' + k + ': ' + as.length + ' waits, question lag median ' + f1(med(lags)) + ' s, max ' + f1(lags.length ? Math.max(...lags) : null) + ' s, question after the wait closed: ' + late); }

// ---- speech ----
H('Two bots within 1.0 s of each other');
const sp = ev.filter(e => ['chat', 'say', 'log'].includes(e.src) && bots.includes(e.who));
const said = e => e.src === 'chat' ? e.msg : (e.src === 'say' ? 'says #' + e.i : e.txt);
let pairs = 0;
for (let i = 0; i < sp.length; i++) for (let j = i + 1; j < sp.length && sp[j].t - sp[i].t <= 1.0; j++) if (sp[j].who !== sp[i].who) { pairs++; if (pairs <= 20) out.push('  ' + f1(sp[i].t) + ' ' + sp[i].who + ': ' + String(said(sp[i])).slice(0, 80) + '  |  ' + f1(sp[j].t) + ' ' + sp[j].who + ': ' + String(said(sp[j])).slice(0, 80)); }
out.push('  ' + pairs + ' pairs' + (pairs > 20 ? ' (first 20 shown)' : ''));
H('The same chat line from two bots within 15 s (one remark, said twice)');
const byText = {};
for (const e of sp.filter(e => e.src === 'chat')) { const k = e.msg.replace(/\d+/g, 'N'); (byText[k] = byText[k] || []).push(e); }
for (const [k, v] of Object.entries(byText)) for (let i = 1; i < v.length; i++) if (v[i].who !== v[i - 1].who && v[i].t - v[i - 1].t <= 15) out.push('  ' + k.slice(0, 100) + '  <- ' + v[i - 1].who + '@' + f1(v[i - 1].t) + ', ' + v[i].who + '@' + f1(v[i].t));

// ---- combat idle ----
H('After a combat round narration: seconds until the combat closed');
let narr = null;
for (const e of ev) { if (e.src === 'chat' && /One round/.test(e.msg || '')) narr = e; if (e.src === 'tally' && narr && !(e.m && e.m.mode)) { out.push('  ' + f1(narr.t) + ' ' + narr.who + ' -> closed ' + f1(e.t) + ': ' + f1(e.t - narr.t) + ' s'); narr = null; } }

// ---- the bots' own wait rows ----
H('The bots\' own wait rows (kind / tempo / how it ended)');
const groups = {};
for (const e of ev) { if (e.src !== 'con' || !e.bot) continue; const m = /\bwait (\{.*\})/.exec(e.text || ''); if (!m) continue; let w; try { w = JSON.parse(m[1]); } catch (x) { continue; }
  const k = (w.kind || '?') + ' / ' + (w.mode || '?') + ' / ' + (w.end || '?') + (w.held ? ' (held)' : ''); (groups[k] = groups[k] || []).push(+w.ms || 0); }
for (const [k, v] of Object.entries(groups).sort()) out.push('  ' + k.padEnd(36) + ' n ' + String(v.length).padStart(3) + '  median ' + f1(med(v) / 1000) + ' s  max ' + f1(Math.max(...v) / 1000) + ' s');

// ---- the rig's dialogs ----
H('Client dialogs the rig answered');
const dl = {}; for (const e of ev.filter(e => e.src === 'dialog')) { const k = String(e.msg || '').replace(/\d+/g, 'N').slice(0, 90); dl[k] = (dl[k] || 0) + 1; }
Object.entries(dl).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([k, n]) => out.push('  ' + String(n).padStart(3) + '  ' + k));
console.log(out.join('\n').replace(/^\n/, ''));
