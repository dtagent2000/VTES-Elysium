#!/usr/bin/env node
'use strict';
/* tools/hotseat-in-browser.js v1.0.0 (14 Nov 2026, bot v0.6.227, round E; its egress review's fixes) -- the hotseat table with bots in a REAL browser: the client
   (bot/'s read-only copy, elysium-vtes-bord.html) in headless Chromium, served with the bot bundle beside it, one human seat that only
   passes and three bot seats, as a player sets it up (offlineCfg + startOfflineFromCfg). Each pass runs the client's own sweep of the
   bot seats (passNow -> hotRunBotTurns), so the bots act through the page's hotBridge, which delivers a line in the same call. Each
   bot's events are collected in the page (its onEvent): the bot-vs-bot bleed-modifier windows (a play in window bleed-mod, to the
   actor's next through / blocked), how long each took and how many outlasted 2.5 s plus the pace with no answer row between, and every
   stale-answer row; the page's console is kept too. A diagnostic, not a gate (Playwright; main's client is read, never edited).
     usage (from bot/): node tools/hotseat-in-browser.js [--bot FILE] [--sweeps N] [--out DIR]   (--out: a new or empty directory)
     NODE_PATH must reach playwright (here /opt/npm-tools/node_modules); PLAYWRIGHT_BROWSERS_PATH the browsers (here /opt/pw-browsers).
   Exit 0 = modifier windows were played and none ran out and no answer was dropped as stale; 1 = stale answers or run-outs;
   2 = the table did not run; 3 = it ran but no bot-vs-bot modifier window opened (nothing exercised). */
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const B = path.resolve(__dirname, '..'), BOT = path.resolve(arg('--bot', path.join(B, 'elysium-bot.js'))), SWEEPS = +arg('--sweeps', 4);
const OUT = path.resolve(arg('--out', path.join(os.tmpdir(), 'hotseat-in-browser')));
let chromium; try { ({ chromium } = require('playwright')); } catch(e){ console.error('playwright not found (set NODE_PATH)'); process.exit(2); }
if(fs.existsSync(OUT) && fs.readdirSync(OUT).some(f => !['console.txt', 'result.json', 'table.png', 'events.json'].includes(f))){ console.error('--out ' + OUT + ' holds other files: give a new or empty directory'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const W = fs.mkdtempSync(path.join(os.tmpdir(), 'hsb-')), WS = W + path.sep;
fs.copyFileSync(path.join(B, 'elysium-vtes-bord.html'), path.join(W, 'index.html'));
fs.copyFileSync(BOT, path.join(W, 'elysium-bot.js'));
for(const f of ['elysium-cardfx.json', 'elysium-cardfx.js', 'elysium-twd-profile.json', 'elysium-twd-profile.js', 'elysium-twd-archetypes.json', 'elysium-twd-archetypes.js'])
  if(fs.existsSync(path.join(B, f))) fs.copyFileSync(path.join(B, f), path.join(W, f));
const deck = JSON.parse(fs.readFileSync(path.join(B, 'deck-nosferatu.json'), 'utf8'));   // the human's deck: any legal list the client parses
const deckText = 'Crypt (' + deck.crypt.reduce((a, c) => a + c.qty, 0) + ')\n' + deck.crypt.map(c => c.qty + 'x ' + c.name).join('\n')
  + '\n\nLibrary (' + deck.library.reduce((a, c) => a + c.qty, 0) + ')\n' + deck.library.map(c => c.qty + 'x ' + c.name).join('\n') + '\n';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const srv = http.createServer((q, r) => { try {
    const u = q.url.split('?')[0], p = path.join(W, decodeURIComponent(u === '/' ? '/index.html' : u));
    if(!p.startsWith(WS) || !fs.existsSync(p) || !fs.statSync(p).isFile()){ r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r);
  } catch(e){ try { r.writeHead(404); r.end(); } catch(_e){} } });
const BOTV = (fs.readFileSync(BOT, 'utf8').match(/const BOT_VERSION = '([0-9.]+)'/) || [])[1] || null;
const done = code => { try { srv.close(); } catch(e){} try { fs.rmSync(W, { recursive: true, force: true }); } catch(e){} process.exit(code); };
(async () => {
  await new Promise(res => srv.listen(0, '127.0.0.1', res)); const url = 'http://127.0.0.1:' + srv.address().port + '/';
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.route('**/*', rt => rt.request().url().startsWith(url) ? rt.continue() : rt.abort());   // offline: only the local files
  const con = [], log = fs.createWriteStream(path.join(OUT, 'console.txt'));
  page.on('console', m => { const t = m.text(); con.push({ t: Date.now(), x: t }); log.write(t + '\n'); });
  await page.goto(url); await page.waitForFunction(() => typeof startOfflineFromCfg === 'function', null, { timeout: 30000 });
  await page.evaluate(t => { localStorage.setItem(DECKS_KEY, JSON.stringify([{ name: 'Human (Nosferatu)', text: t }])); }, deckText);
  const setup = await page.evaluate(async () => {
    window.uiConfirm = async () => true; window.uiAlert = async () => {};   // a player who answers every confirm with yes
    offlineCfg = [{ name: 'You', deckIdx: 0 }, { name: 'Hanna', botP: 'expert', botDeckKey: 'malkavian' }, { name: 'Viktor', botP: 'expert', botDeckKey: 'tremere' },
                  { name: 'Nora', botP: 'expert', botDeckKey: 'ventrue' }];
    await startOfflineFromCfg();
    const t0 = Date.now(); while(Object.keys(hotBridge.seats || {}).length < 3 && Date.now() - t0 < 30000) await new Promise(r => setTimeout(r, 200));
    window.__ev = []; Object.keys(hotBots || {}).forEach(k => { const b = hotBots[k], prev = b.onEvent;   // every bot's own rows, as the hotseat tool collects them
      b.onEvent = (t, d) => { try { if(/^bot:/.test(String(t))) window.__ev.push({ t: Date.now(), seat: +k, type: String(t).slice(4), d: (t === 'bot:play' || t === 'bot:stale-answer' || t === 'bot:through' || t === 'bot:blocked') ? d : undefined }); } catch(e){} if(prev) prev(t, d); }; });   // the bot's own rows only (onEvent also sees every inbound message)
    return { client: VERSION, botVersion: (typeof ElysiumBot !== 'undefined' && ElysiumBot.BOT_VERSION) || null, seats: Object.keys(hotBridge.seats || {}).length, turnSeat: net.turnSeat };
  });
  console.log('setup ' + JSON.stringify(setup) + ' · the bot file ' + BOTV);
  if(setup.seats < 3 || (BOTV && setup.botVersion !== BOTV)){ console.log(setup.seats < 3 ? 'the bots were not seated' : 'the page runs another bot than --bot'); await browser.close(); done(2); }
  const sweeps = [];
  for(let k = 0; k < SWEEPS; k++){
    const t0 = Date.now(), ok = await page.evaluate(async () => { try { await passNow(); return { ok: true, turnSeat: net.turnSeat, out: (net.roster || []).filter(q => q.out).map(q => q.name) }; } catch(e){ return { ok: false, err: String(e && e.message || e) }; } });
    sweeps.push({ k: k + 1, secs: Math.round((Date.now() - t0) / 1000), ok });
    console.log('sweep ' + (k + 1) + ': ' + Math.round((Date.now() - t0) / 1000) + ' s ' + JSON.stringify(ok));
    if(!ok.ok || (ok.out || []).includes('You')) break;
  }
  const ev = await page.evaluate(() => window.__ev || []); fs.writeFileSync(path.join(OUT, 'events.json'), JSON.stringify(ev));
  const ANS = ['decide', 'play', 'block-eval', 'defence-plan', 'block-made', 'stale-answer'], lim = 2500 + 3100;   // ana-windows v1.1's answer rows and limit at the client pace
  const wins = []; ev.forEach((e, i) => { if(e.type !== 'play' || !e.d || e.d.window !== 'bleed-mod') return;
    const end = ev.slice(i + 1).find(x => x.seat === e.seat && (x.type === 'through' || x.type === 'blocked')); if(!end) return;
    const chain = [e.t].concat(ev.slice(i + 1).filter(x => x.t <= end.t && x.seat !== e.seat && ANS.includes(x.type)).map(x => x.t), [end.t]);
    const gap = Math.max(...chain.slice(1).map((t, k) => t - chain[k])); wins.push({ ms: end.t - e.t, gap, ranOut: gap > lim }); });
  const stale = ev.filter(e => e.type === 'stale-answer'), by = {}; stale.forEach(e => { const k = (e.d && e.d.phrase) || '?'; by[k] = (by[k] || 0) + 1; });
  const ranOut = wins.filter(w => w.ranOut).length, res = { setup, botFile: BOTV, sweeps, modifierWindows: wins.length, ranOut, windowMs: wins.map(w => w.ms), staleAnswers: stale.length, staleBy: by, consoleLines: con.length };
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(res, null, 1));
  console.log('result ' + JSON.stringify({ modifierWindows: wins.length, ranOut, staleAnswers: stale.length, staleBy: by, windowMs: res.windowMs, sweeps: sweeps.map(s => s.secs) }));
  await page.screenshot({ path: path.join(OUT, 'table.png') }).catch(() => {});
  await browser.close(); log.end();
  done(!(sweeps.length && sweeps.every(s => s.ok.ok)) ? 2 : (stale.length || ranOut) ? 1 : wins.length ? 0 : 3);
})().catch(e => { console.error('ABORT ' + (e && e.stack || e)); done(2); });
