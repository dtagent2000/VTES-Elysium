#!/usr/bin/env node
'use strict';
/* tools/hotseat-in-browser.js v1.0.0 (14 Nov 2026, bot v0.6.227, round E) -- the hotseat table with bots in a REAL browser: the client
   (bot/'s read-only copy, elysium-vtes-bord.html) in headless Chromium, served with the bot bundle beside it, one human seat that only
   passes and three bot seats, as a player sets it up (offlineCfg + startOfflineFromCfg). Each pass runs the client's own sweep of the
   bot seats (passNow -> hotRunBotTurns), so the bots act through the page's hotBridge, which delivers a line in the same call. The
   page's console carries every bot's log: the script counts "stale ... ignored" (an answer the actor dropped as stale) and the bots'
   bleed-modifier plays, and reports the time each sweep took. A diagnostic, not a gate (Playwright; main's client is read, never edited).
     usage (from bot/): node tools/hotseat-in-browser.js [--bot FILE] [--sweeps N] [--out DIR]
     NODE_PATH must reach playwright (here /opt/npm-tools/node_modules); PLAYWRIGHT_BROWSERS_PATH the browsers (here /opt/pw-browsers).
   Exit 0 = the table ran its sweeps and no answer was dropped as stale; 1 = stale answers; 2 = the table did not run. */
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const B = path.resolve(__dirname, '..'), BOT = path.resolve(arg('--bot', path.join(B, 'elysium-bot.js'))), SWEEPS = +arg('--sweeps', 4);
const OUT = path.resolve(arg('--out', path.join(os.tmpdir(), 'hotseat-in-browser')));
let chromium; try { ({ chromium } = require('playwright')); } catch(e){ console.error('playwright not found (set NODE_PATH)'); process.exit(2); }
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const W = fs.mkdtempSync(path.join(os.tmpdir(), 'hsb-'));
fs.copyFileSync(path.join(B, 'elysium-vtes-bord.html'), path.join(W, 'index.html'));
fs.copyFileSync(BOT, path.join(W, 'elysium-bot.js'));
for(const f of ['elysium-cardfx.json', 'elysium-cardfx.js', 'elysium-twd-profile.json', 'elysium-twd-profile.js', 'elysium-twd-archetypes.json', 'elysium-twd-archetypes.js'])
  if(fs.existsSync(path.join(B, f))) fs.copyFileSync(path.join(B, f), path.join(W, f));
const deck = JSON.parse(fs.readFileSync(path.join(B, 'deck-nosferatu.json'), 'utf8'));   // the human's deck: any legal list the client parses
const deckText = 'Crypt (' + deck.crypt.reduce((a, c) => a + c.qty, 0) + ')\n' + deck.crypt.map(c => c.qty + 'x ' + c.name).join('\n')
  + '\n\nLibrary (' + deck.library.reduce((a, c) => a + c.qty, 0) + ')\n' + deck.library.map(c => c.qty + 'x ' + c.name).join('\n') + '\n';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const p = path.join(W, decodeURIComponent((q.url.split('?')[0] === '/' ? '/index.html' : q.url.split('?')[0])));
  if(!p.startsWith(W) || !fs.existsSync(p)){ r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
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
    return { client: VERSION, botVersion: (typeof ElysiumBot !== 'undefined' && ElysiumBot.BOT_VERSION) || null, seats: Object.keys(hotBridge.seats || {}).length, turnSeat: net.turnSeat };
  });
  console.log('setup ' + JSON.stringify(setup));
  if(setup.seats < 3){ console.log('the bots were not seated'); await browser.close(); srv.close(); process.exit(2); }
  const sweeps = [];
  for(let k = 0; k < SWEEPS; k++){
    const t0 = Date.now(), ok = await page.evaluate(async () => { try { await passNow(); return { ok: true, turnSeat: net.turnSeat, out: (net.roster || []).filter(q => q.out).map(q => q.name) }; } catch(e){ return { ok: false, err: String(e && e.message || e) }; } });
    sweeps.push({ k: k + 1, secs: Math.round((Date.now() - t0) / 1000), ok });
    console.log('sweep ' + (k + 1) + ': ' + Math.round((Date.now() - t0) / 1000) + ' s ' + JSON.stringify(ok));
    if(!ok.ok || (ok.out || []).includes('You')) break;
  }
  const stale = con.filter(c => /\] stale .* ignored/.test(c.x)), mods = con.filter(c => /adds \+\d+ bleed|bleed-mod/i.test(c.x));
  const by = {}; stale.forEach(c => { const m = c.x.match(/stale (.+?) from (.+?) ignored/); const k = m ? m[1] : '?'; by[k] = (by[k] || 0) + 1; });
  const res = { setup, sweeps, staleAnswers: stale.length, staleBy: by, modifierLines: mods.length, consoleLines: con.length };
  fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(res, null, 1));
  console.log('result ' + JSON.stringify({ staleAnswers: res.staleAnswers, staleBy: by, modifierLines: res.modifierLines, sweeps: sweeps.map(s => s.secs) }));
  await page.screenshot({ path: path.join(OUT, 'table.png') }).catch(() => {});
  await browser.close(); srv.close(); log.end();
  process.exit(sweeps.length && sweeps.every(s => s.ok.ok) ? (stale.length ? 1 : 0) : 2);
})().catch(e => { console.error('ABORT ' + (e && e.stack || e)); try { srv.close(); } catch(_e){} process.exit(2); });
