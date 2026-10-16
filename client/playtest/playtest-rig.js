#!/usr/bin/env node
'use strict';
/* ============================================================
   playtest-rig.js v1.1.0 (16 Oct 2026, client v2.6.162; v1.0.0 14 Oct, v2.6.158) -- play a REAL game against the bots
   ------------------------------------------------------------
   Starts the Elysium server, ONE headless Chromium tab (the human -- and, as the host, the tab
   the lobby's bots run in, exactly as on elysium.cards), records everything, and opens a small
   HTTP control port that playtest.js talks to. Born from the first full play-test (one human
   against two Expert bots, 8 rounds): see PLAYTEST.md for the process and what to look for.

   Recorded in <out>/timeline.jsonl (one JSON object per line, t = seconds since start):
     ws        every websocket frame on every socket (the human's and each bot's), big ones summarised
     con       the page console -- the bots' own lines ('[netbot NAME] ...', their `wait` rows included)
     panel     the Bot Activity panel's status() per bot, sampled every 0.3 s, on change
     ask/askEnd  a bot started / stopped waiting on the human (from the panel), with the kind
     askArmed  v1.1.0: the moment that wait's clock first runs (the panel's countdown leaves the dash;
               bot v0.6.204+ starts it when the question is sent, older bots when it was queued)
     reflex    what the reflex said for the human (see below)
     dialog    the client's own dialogs the rig answered
   and a readable <out>/feed.txt (what the human saw: chat, phrases, log lines, turns, counters,
   boards' pool/phase changes, asks). playtest-report.js turns the timeline into numbers.

   THE REFLEX. A model answering through this rig takes 5-15 s per reply; a bot's Standard tempo
   gives a human 3 s. The reflex answers for the human after `delayMs`, counted from the moment
   the QUESTION appears in chat (what a human reacts to) -- or from the bot's status when no
   question line arrives within 6 s (v1.1.0: a combat step's question must be that step's own -- a late question for
   the step before does not anchor the next; and when the bot has not started the wait's clock after 6 s -- bot
   v0.6.204+ starts it when the question is sent -- the fallback waits for the clock instead of answering a question
   the human has not seen). Per kind (block, verdict, react, pq, combat, strike, vote)
   it says Hold on (`hold`), the plain negative (`no`), or nothing (`none`). Turn the reflex off
   for Turn-based tempo, where the bots wait anyway. Only the human's own phrases and chat lines
   count as an answer -- a log line (a blood correction) does not.

   Usage
     node playtest-rig.js [--dir <folder>] [--out <run dir>] [--port 8890] [--control 8899]
                          [--vtes <local vtes.json>] [--offline] [--viewport 1600x900]
     --dir      the folder with elysium-server.js, elysium-vtes-bord.html and the bot bundle beside
                them (default: the repository root, the release; use ../ for client/ with the
                bundle copied beside the suite to test an unreleased client)
     --vtes     serve KRCG's vtes.json from this local file (a sandbox without internet). The file is
                third-party data: never commit it.
     --offline  abort every request that is not to the local server (no card images; the client
                shows text cards). A generated placeholder answers the two card-back URLs.
     --no-backs with --offline: let the card backs fail too (how v2.6.158's image fix was checked)
   Needs Playwright with Chromium (npm i -D playwright && npx playwright install chromium), or set
   PLAYWRIGHT_MODULE to an installed copy. Dev tool only -- never part of a release.
   ============================================================ */
const http = require('http'), { spawn } = require('child_process'), fs = require('fs'), path = require('path'), zlib = require('zlib');

const arg = (k, d) => { const i = process.argv.indexOf(k); return (i > 0 && i + 1 < process.argv.length) ? process.argv[i + 1] : d; };
const has = k => process.argv.includes(k);
const REPO = path.resolve(__dirname, '..', '..');
const DIR = path.resolve(arg('--dir', REPO));
const OUT = path.resolve(arg('--out', path.join(__dirname, 'runs', new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19))));
const PORT = +arg('--port', 8890), CPORT = +arg('--control', 8899);
const VTES = arg('--vtes', null), OFFLINE = has('--offline'), NOBACKS = has('--no-backs');
const VP = (arg('--viewport', '1600x900').split('x').map(Number));
const SAY = ['Hold on…', 'No block', 'Block!', 'No reaction', 'It resolves', 'Yes', 'No', 'Pass', 'Any blocks?', 'Any reaction?'];   // the client's quick phrases, by index (the wire carries the index)

function loadPlaywright(){
  for (const m of [process.env.PLAYWRIGHT_MODULE, 'playwright', '/opt/npm-tools/node_modules/playwright'].filter(Boolean)) { try { return require(m); } catch (e) {} }
  console.error('playtest-rig: Playwright not found. npm i -D playwright && npx playwright install chromium, or set PLAYWRIGHT_MODULE.'); process.exit(2);
}
function backPng(){   // a 63x88 dark card back, generated (no third-party image in the repo)
  const w = 63, h = 88, raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3, edge = x < 3 || y < 3 || x > w - 4 || y > h - 4; raw[o] = edge ? 120 : 70; raw[o + 1] = edge ? 90 : 12; raw[o + 2] = edge ? 50 : 18; } }
  const crc = b => { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

fs.mkdirSync(OUT, { recursive: true });
const T0 = Date.now(); const secs = () => +((Date.now() - T0) / 1000).toFixed(1);
const TL = fs.createWriteStream(path.join(OUT, 'timeline.jsonl'), { flags: 'a' });
const FEEDF = fs.createWriteStream(path.join(OUT, 'feed.txt'), { flags: 'a' });
let seq = 0; const feed = []; let waiters = [];
function wake(){ const w = waiters; waiters = []; w.forEach(f => f()); }
function rec(src, o, show, urgent){   // the record's own n / t / src always win over a payload's fields (the first rig lost every panel line to a payload's `n`)
  const e = Object.assign({}, o, { n: ++seq, t: secs(), src }); TL.write(JSON.stringify(e) + '\n');
  if (show) { feed.push({ n: e.n, t: e.t, txt: show, u: !!urgent }); if (feed.length > 8000) feed.shift(); FEEDF.write('[' + e.t.toFixed(1) + (urgent ? '!' : '') + '] ' + show + '\n'); if (urgent) wake(); }
  return e;
}
const strip = h => String(h || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

// ---------- the reflex ----------
const policy = { on: true, delayMs: 1600, anchor: 'chat', block: 'hold', verdict: 'hold', react: 'no', pq: 'hold', combat: 'hold', strike: 'hold', vote: 'hold', byBot: {} };
const NEG = { block: 1, verdict: 7, react: 3, pq: 6, combat: 7, strike: 7, vote: 7 };
let ME = null, lastMineSay = 0;
const lastBotChat = {}, asks = {};
let page = null, srv = null, browser = null;
function pol(bot, kind){ const b = policy.byBot[bot]; return (b && b[kind]) || policy[kind] || 'none'; }
async function reflexFire(bot, a){
  if (!policy.on || a.fired || asks[bot] !== a) return;
  a.fired = true;
  if (lastMineSay > a.t0) { rec('reflex', { bot, kind: a.kind, skip: 'answered' }); return; }
  const act = pol(bot, a.kind);
  if (act === 'none') { rec('reflex', { bot, kind: a.kind, act }, 'REFLEX (' + a.kind + ' from ' + bot + ') silent', false); return; }
  const i = act === 'hold' ? 0 : NEG[a.kind];
  try { await page.evaluate(i => saySend(i), i); } catch (e) {}
  lastMineSay = Date.now();
  rec('reflex', { bot, kind: a.kind, act, i, after: Date.now() - a.t0 }, 'REFLEX (' + a.kind + ' from ' + bot + ') -> "' + SAY[i] + '"', act === 'hold');
}
function armReflex(bot, a, from){ if (a.armed) return; a.armed = from; setTimeout(() => reflexFire(bot, a), policy.delayMs); }
function askKind(w, bot){
  if (/^block verdict/.test(w)) return 'verdict';
  if (/^block\?/.test(w)) return /Any reaction\?|reaction before it resolves/.test(lastBotChat[bot] || '') ? 'react' : 'block';
  if (/^pool question/.test(w)) return 'pq';
  if (/^combat step strike/.test(w)) return 'strike';
  if (/^combat step/.test(w)) return 'combat';
  if (/^votes/.test(w)) return 'vote';
  return null;
}
const QUESTION = /Block\?|Any reaction|lose pool\?|How much\?|Anything before|Any maneuvers\?|What is your strike\?|Any presses\?|Damage: prevent|votes\?|add stealth|may block it/;   // v1.1.0: + bot v0.6.204's verdict question ('X blocks (stealth A vs intercept B) -- You, add stealth, or say Pass to resolve it') and v0.6.203's bounce question ('X now bleeds You for N -- You may block it ...')
const STEP_Q = { 'before range': /Anything before range\?/, 'maneuvers': /Any maneuvers\?/, 'before strikes': /Anything before strikes\?/, 'strike': /What is your strike\?/, 'damage': /Damage: prevent/, 'presses': /Any presses\?/, 'before ending combat': /Anything before ending combat\?/ };   // v1.1.0: the bot's own question per combat step (the bot's Q[] in _phaseStep)
function questionFits(a, msg){ if (!QUESTION.test(msg)) return false; const st = /^combat step (.+?) \(/.exec(a.w || ''); return !(st && STEP_Q[st[1]]) || STEP_Q[st[1]].test(msg); }   // v1.1.0: a late question for the step before must not anchor this step's reflex
const panelLast = {};
async function samplePanel(){
  if (!page || !ME) return;
  let rows = null;
  try { rows = await page.evaluate(() => { try { if (typeof botPanelSeats !== 'function') return null; return botPanelSeats().map(r => { const s = botPanelRead(r.bot); return { bot: s.name, st: s.state, w: s.waitingFor, step: s.step, can: s.canStep, left: s.until ? Math.round((s.until - Date.now()) / 100) / 10 : null }; }); } catch (e) { return null; } }); } catch (e) { return; }
  if (!rows) return;
  const meRx = new RegExp('\\b' + ME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
  for (const r of rows) {
    { const a0 = asks[r.bot]; if (a0 && a0.armT == null && r.left != null) { a0.armT = Date.now(); rec('askArmed', { bot: r.bot, kind: a0.kind, after: a0.armT - a0.t0, left: r.left }, 'CLOCK ' + r.bot + ': ' + r.left + 's');
        if (a0.waitClock) setTimeout(() => armReflex(r.bot, a0, 'clock'), policy.delayMs); } }   // v1.1.0: a fallback that waited for the clock fires delayMs after it starts   // v1.1.0: when the wait's clock starts (bot v0.6.204: once its question is sent)
    const sig = r.st + '|' + r.w + '|' + (r.step || '');
    if (panelLast[r.bot] === sig) continue;
    panelLast[r.bot] = sig;
    const mine = r.st === 'asking' && meRx.test(r.w) && !new RegExp(meRx.source + ' thinking').test(r.w);
    const kind = mine ? askKind(r.w, r.bot) : null;
    rec('panel', r, 'PANEL ' + r.bot + ': ' + r.w + ' [' + r.st + (r.left != null ? ', ' + r.left + 's' : '') + ']', false);
    if (kind) {
      const a = { kind, w: r.w, t0: Date.now(), fired: false, armed: null };
      asks[r.bot] = a;
      rec('ask', { bot: r.bot, kind, w: r.w }, 'ASK ' + kind + ' <- ' + r.bot + ': ' + r.w, true);
      if (r.left != null) { a.armT = a.t0; rec('askArmed', { bot: r.bot, kind, after: 0, left: r.left }, 'CLOCK ' + r.bot + ': ' + r.left + 's (running when the wait was first seen)'); }
      if (policy.anchor === 'status') armReflex(r.bot, a, 'status');
      else setTimeout(() => { if (a.armT == null && !a.chatT) { a.waitClock = true; return; } armReflex(r.bot, a, 'status-fallback'); }, 6000);   // v1.1.0: no clock yet = the bot (v0.6.204+) has not sent its question: wait for it
    } else if (asks[r.bot]) { const a = asks[r.bot]; rec('askEnd', { bot: r.bot, kind: a.kind, ms: Date.now() - a.t0 }); delete asks[r.bot]; }
  }
}

// ---------- websocket frames ----------
let wsN = 0; const lastBoard = {}; let lastTally = '';
function boardSum(pub){ const cards = (pub && pub.cards) || [];
  const live = cards.filter(c => c.zone === 'ready' || c.zone === 'torpor').map(c => (c.faceDown ? '(fd)' : c.name) + (c.zone === 'torpor' ? '[T]' : '') + (c.blood ? ' b' + c.blood : '') + (c.locked ? ' L' : '') + (c.host ? ' @' : ''));
  return { pool: pub && pub.pool, ph: pub && pub.phase, edge: !!(pub && pub.edge), live: live.join(', '), unc: cards.filter(c => c.zone === 'uncontrolled').map(c => 'u' + (c.blood | 0)).join(' ') }; }
function onFrame(info, dir, payload){
  let m = null; if (typeof payload === 'string') { try { m = JSON.parse(payload); } catch (e) {} }
  if (!m) { rec('ws', { ws: info.id, who: info.name, dir, raw: String(payload).slice(0, 200) }); return; }
  if (dir === 'out' && !info.name && (m.t === 'create' || m.t === 'join' || m.t === 'rejoin')) { info.name = m.name || null; rec('wsname', { ws: info.id, name: info.name }, 'SOCKET ' + info.id + ' = ' + info.name); if (info.id === 1 && !ME) ME = info.name; }
  const big = payload.length > 3000;
  rec('ws', { ws: info.id, who: info.name, dir, mt: m.t, m: big ? { t: m.t, len: payload.length, seat: m.seat } : m });
  if (dir === 'out' && info.name === ME) {
    if (m.t === 'chat') { lastMineSay = Date.now(); rec('me', { kind: 'chat' }, 'ME chat: ' + m.msg); }
    else if (m.t === 'say') { lastMineSay = Date.now(); rec('me', { kind: 'say', i: m.i }, 'ME says "' + SAY[m.i] + '"'); }
    else if (m.t === 'log') rec('me', { kind: 'log', txt: strip(m.html) }, 'ME log: ' + strip(m.html));
    else if (m.t === 'pass') rec('me', { kind: 'pass' }, 'ME pass (end of turn)');
    else if (m.t === 'tally') rec('me', { kind: 'tally' }, 'ME tally ' + JSON.stringify(m).slice(0, 160));
    return;
  }
  if (dir !== 'in' || info.name !== ME) return;      // what the table shows the human: their own socket's inbound frames
  const t = m.t;
  if (t === 'chat') { lastBotChat[m.who] = m.msg;
    const a = asks[m.who]; if (a && questionFits(a, m.msg) && !a.chatT) { a.chatT = Date.now(); rec('askChat', { bot: m.who, kind: a.kind, lag: a.chatT - a.t0 }); if (policy.anchor === 'chat') armReflex(m.who, a, 'chat'); }
    rec('chat', { who: m.who, msg: m.msg }, 'CHAT ' + m.who + ': ' + m.msg, ME && new RegExp('\\b' + ME + '\\b').test(m.msg) && /\?|[Hh]olding/.test(m.msg)); }
  else if (t === 'say') rec('say', { who: m.who, i: m.i }, 'SAY ' + m.who + ': ' + SAY[m.i], m.who !== ME && m.i === 0);
  else if (t === 'log') rec('log', { who: m.who, txt: strip(m.html) }, 'LOG ' + (m.who || '') + ': ' + strip(m.html));
  else if (t === 'logTo') rec('logTo', { from: m.from, txt: strip(m.html) }, 'LOGTO ' + m.from + ': ' + strip(m.html));
  else if (t === 'turn') rec('turn', { seat: m.seat, who: m.who }, '=== TURN -> seat ' + m.seat + ' ' + m.who + ' ===', m.who === ME);
  else if (t === 'tally') { const s = JSON.stringify(Object.assign({}, m, { t: undefined })); if (s !== lastTally) { lastTally = s; rec('tally', { m }, 'TALLY ' + (m.mode || 'none') + (m.mode ? ' a=' + m.a + ' b=' + m.b + (m.ph != null ? ' ph=' + m.ph : '') + (m.rd ? ' rd=' + m.rd : '') + (m.rng ? ' ' + m.rng : '') + (m.duel ? ' duel=' + Object.keys(m.duel).map(k => k + ':' + (m.duel[k].name || '')).join(',') : '') : '')); } }
  else if (t === 'botcfg') rec('botcfg', { m }, 'BOTCFG ' + m.tempo + ' ' + m.waitSecs + 's (by ' + m.who + ')');
  else if (t === 'decide') rec('decide', { m }, 'DECIDE window ' + m.secs + 's by ' + m.who);
  else if (t === 'fx') rec('fx', { m: { who: m.who, kind: m.kind, verb: m.verb, card: m.card && m.card.name } }, 'FX ' + m.who + ' ' + m.kind + (m.verb ? ' "' + m.verb + '"' : '') + (m.card && m.card.name ? ' ' + m.card.name : ''));
  else if (t === 'board') { const s = boardSum(m.pub), k = m.seat, p = lastBoard[k], ch = [];
    if (!p || p.pool !== s.pool) ch.push('pool ' + (p ? p.pool : '?') + '->' + s.pool); if (!p || p.ph !== s.ph) ch.push('phase ' + s.ph); if (!p || p.live !== s.live) ch.push('live [' + s.live + ']'); if (!p || p.unc !== s.unc) ch.push('unc [' + s.unc + ']'); if (!p || p.edge !== s.edge) ch.push('edge ' + s.edge);
    lastBoard[k] = s; if (ch.length) rec('board', { seat: k, who: m.who, s }, 'BOARD s' + k + ' ' + m.who + ': ' + ch.join('; ')); }
  else if (['sys', 'err', 'edgeTake', 'edgePass', 'bounty', 'forceSetPool', 'forceOust', 'started', 'dealt', 'closed'].includes(t)) rec(t, { m: payload.length > 1500 ? { t } : m }, t.toUpperCase() + ' ' + payload.slice(0, 220), t === 'err' || t === 'closed');
  else if (t === 'drew') rec('drew', { m }, 'DREW ' + (m.name || '?') + ' -> ' + (m.zone || ''));
}

// ---------- running page code that may open the client's own dialogs ----------
let jobN = 0;
async function runJob(code, opts){
  opts = opts || {}; const id = 'j' + (++jobN); const values = (opts.values || []).slice(); const dialogs = [];
  const expr = `(()=>{ window.__jobs=window.__jobs||{}; window.__jobs['${id}']={done:false}; (async()=>{ ${code} })().then(v=>{ let s; try{ s=JSON.parse(JSON.stringify(v===undefined?null:v)); }catch(e){ s=String(v); } window.__jobs['${id}']={done:true,v:s}; }, e=>{ window.__jobs['${id}']={done:true,err:String(e&&e.stack||e).slice(0,800)}; }); return '${id}'; })()`;
  await page.evaluate(expr);
  const tEnd = Date.now() + (opts.timeout || 15000);
  while (Date.now() < tEnd) {
    await new Promise(r => setTimeout(r, 120));
    const s = await page.evaluate(id => { const j = (window.__jobs || {})[id]; let d = null;
      if (typeof shownModal === 'function' && shownModal() === 'dialogModal') d = { title: document.getElementById('dlgTitle').textContent, msg: document.getElementById('dlgMsg').textContent, prompt: getComputedStyle(document.getElementById('dlgInput')).display !== 'none', input: document.getElementById('dlgInput').value, alt: getComputedStyle(document.getElementById('dlgAlt')).display !== 'none' ? document.getElementById('dlgAlt').textContent : null, ok: document.getElementById('dlgOk').textContent };
      return { j, d }; }, id);
    if (s.d) {
      if (opts.auto === false) return { pending: true, dialog: s.d, dialogs };
      const cancelIt = (opts.cancel || []).some(rx => new RegExp(rx, 'i').test(s.d.msg) || new RegExp(rx, 'i').test(s.d.title));
      const altIt = !cancelIt && s.d.alt && (opts.alt || []).some(rx => new RegExp(rx, 'i').test(s.d.msg) || new RegExp(rx, 'i').test(s.d.alt));
      let ans;
      if (s.d.prompt && !cancelIt) { const v = values.length ? String(values.shift()) : s.d.input; await page.evaluate(v => { document.getElementById('dlgInput').value = v; document.getElementById('dlgOk').click(); }, v); ans = { value: v }; }
      else { const btn = cancelIt ? 'dlgCancel' : (altIt ? 'dlgAlt' : 'dlgOk'); await page.evaluate(b => document.getElementById(b).click(), btn); ans = { pressed: cancelIt ? 'cancel' : (altIt ? s.d.alt : s.d.ok) }; }
      dialogs.push(Object.assign({ msg: s.d.msg }, ans));
      rec('dialog', { msg: s.d.msg, ans }, 'DIALOG "' + s.d.msg.slice(0, 120) + '" -> ' + JSON.stringify(ans));
      continue;
    }
    if (s.j && s.j.done) return Object.assign({ dialogs }, s.j);
  }
  return { timeout: true, dialogs };
}

// ---------- the control port ----------
function body(req){ return new Promise(res => { let b = ''; req.on('data', d => b += d); req.on('end', () => { try { res(b ? JSON.parse(b) : {}); } catch (e) { res({ _raw: b }); } }); }); }
function send(res, o){ res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(o, null, 1)); }
const api = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x'); const q = Object.fromEntries(u.searchParams); const b = req.method === 'POST' ? await body(req) : {};
  try {
    if (u.pathname === '/events') { const since = +(q.since || 0), wait = Math.min(+(q.wait || 0), 300) * 1000;
      if (!feed.some(e => e.n > since && e.u) && wait) await new Promise(r => { const f = () => { clearTimeout(to); r(); }; const to = setTimeout(() => { waiters = waiters.filter(x => x !== f); r(); }, wait); waiters.push(f); });
      if (q.settle) await new Promise(r => setTimeout(r, +q.settle * 1000));
      const evs = feed.filter(e => e.n > since); const max = +(q.max || 200);
      return send(res, { last: seq, t: secs(), n: evs.length, events: evs.slice(-max).map(e => '[' + e.t.toFixed(1) + (e.u ? '!' : '') + '] ' + e.txt) }); }
    if (u.pathname === '/state') return send(res, await page.evaluate(() => PT.state()));
    if (u.pathname === '/js') return send(res, await runJob(b.code, b));
    if (u.pathname === '/say') { const i = typeof b.i === 'number' ? b.i : SAY.findIndex(x => x.toLowerCase().replace(/[^a-z]/g, '') === String(b.i).toLowerCase().replace(/[^a-z]/g, ''));
      if (i < 0) return send(res, { err: 'no such phrase: ' + b.i }); await page.evaluate(i => saySend(i), i); lastMineSay = Date.now(); return send(res, { ok: true, said: SAY[i] }); }
    if (u.pathname === '/chat') { await page.evaluate(v => chatSendLine(v), String(b.text)); lastMineSay = Date.now(); return send(res, { ok: true }); }
    if (u.pathname === '/policy') { const bb = Object.assign({}, b); if (bb.byBot) { policy.byBot = Object.assign({}, policy.byBot, bb.byBot); delete bb.byBot; } Object.assign(policy, bb); rec('policy', { policy }, 'POLICY ' + JSON.stringify(policy)); return send(res, policy); }
    if (u.pathname === '/shot') { const f = path.join(OUT, (q.name || ('shot-' + secs())) + '.png'); await page.screenshot({ path: f }); return send(res, { file: f }); }
    if (u.pathname === '/note') { rec('note', { text: b.text }, 'NOTE ' + b.text); return send(res, { ok: true }); }
    if (u.pathname === '/click') { await page.click(b.sel, { timeout: 5000 }); return send(res, { ok: true }); }
    if (u.pathname === '/fill') { await page.fill(b.sel, String(b.value), { timeout: 5000 }); return send(res, { ok: true }); }
    if (u.pathname === '/select') { await page.selectOption(b.sel, String(b.value), { timeout: 5000 }); return send(res, { ok: true }); }
    if (u.pathname === '/info') return send(res, { out: OUT, dir: DIR, port: PORT, control: CPORT, me: ME, policy, t: secs() });
    if (u.pathname === '/quit') { send(res, { bye: true, out: OUT }); setTimeout(shutdown, 300); return; }
    send(res, { err: 'unknown ' + u.pathname });
  } catch (e) { send(res, { err: String(e && e.stack || e).slice(0, 900) }); }
});

let failedLoads = 0;
async function shutdown(){ try { await browser.close(); } catch (e) {} try { srv.kill(); } catch (e) {} try { api.close(); } catch (e) {} rec('end', { failedLoads }); TL.end(); FEEDF.end(); setTimeout(() => process.exit(0), 300); }
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);

(async () => {
  const { chromium } = loadPlaywright();
  for (const f of ['elysium-server.js', 'elysium-vtes-bord.html', 'elysium-bot.js']) if (!fs.existsSync(path.join(DIR, f))) { console.error('playtest-rig: ' + f + ' is not in ' + DIR + (f === 'elysium-bot.js' ? ' -- copy the bot bundle beside the client (client/docs/START-HERE-CLIENT-CHAT.md)' : '')); process.exit(2); }
  const dataDir = path.join(OUT, 'srvdata'); fs.mkdirSync(dataDir, { recursive: true });
  srv = spawn(process.execPath, [path.join(DIR, 'elysium-server.js'), String(PORT), path.join(DIR, 'elysium-vtes-bord.html'), '--data-dir', dataDir], { stdio: ['ignore', 'pipe', 'pipe'] });
  let so = ''; srv.stdout.on('data', d => { so += d; rec('srv', { out: String(d).slice(0, 400) }); }); srv.stderr.on('data', d => rec('srv', { err: String(d).slice(0, 400) }, 'SERVER-ERR ' + String(d).slice(0, 200), true));
  for (let i = 0; i < 100 && !/Local:/.test(so); i++) await new Promise(r => setTimeout(r, 150));
  browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: VP[0] || 1600, height: VP[1] || 900 } });
  const BACK = backPng();
  await ctx.route('**/*', route => { const url = route.request().url();
    if (VTES && /static\.krcg\.org\/data\/vtes\.json/.test(url)) return route.fulfill({ status: 200, contentType: 'application/json', body: fs.readFileSync(VTES) });
    if (/^https?:\/\/(localhost|127\.0\.0\.1)[:/]/.test(url) || /^(data|blob):/.test(url)) return route.continue();
    if (OFFLINE && !NOBACKS && /static\.krcg\.org\/card\/cardback(crypt|library)\.jpg/.test(url)) return route.fulfill({ status: 200, contentType: 'image/png', body: BACK });
    if (OFFLINE) return route.abort();
    return route.continue(); });
  page = await ctx.newPage();
  page.on('console', m => { const tx = m.text(); if (/^Failed to load resource/.test(tx)) { failedLoads++; return; } const bot = /^\[netbot ([^\]]+)\]/.exec(tx); rec('con', { type: m.type(), bot: bot ? bot[1] : undefined, text: tx.slice(0, 2000) }); });
  page.on('pageerror', e => rec('pageerror', { e: String(e).slice(0, 800) }, 'PAGEERROR ' + String(e).slice(0, 200), true));
  page.on('websocket', ws => { const info = { id: ++wsN, name: null }; rec('wsopen', { ws: info.id, url: ws.url() });
    ws.on('framesent', f => onFrame(info, 'out', f.payload)); ws.on('framereceived', f => onFrame(info, 'in', f.payload)); ws.on('close', () => rec('wsclose', { ws: info.id, who: info.name }, 'SOCKET CLOSED ' + info.id + ' ' + info.name, true)); });
  await page.goto('http://localhost:' + PORT + '/');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { try { closeOverlay(); } catch (e) {} });
  await page.evaluate(fs.readFileSync(path.join(__dirname, 'playtest-page.js'), 'utf8'));
  const ver = await page.evaluate(() => VERSION);
  setInterval(samplePanel, 300);
  setInterval(() => { if (failedLoads) { rec('loads', { failed: failedLoads }); failedLoads = 0; } }, 10000);
  api.listen(CPORT, '127.0.0.1', () => { rec('ready', { PORT, CPORT, OUT, DIR, client: ver }, 'RIG READY client v' + ver + ' -- server :' + PORT + ', control :' + CPORT + ', out ' + OUT, true); console.log('RIG READY ' + OUT); });
})().catch(e => { rec('fatal', { e: String(e && e.stack || e) }, 'FATAL ' + String(e), true); console.error(e); process.exit(1); });
