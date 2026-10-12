#!/usr/bin/env node
'use strict';
/* diag-hb1-smoke.js v0.1.0 (8 Aug 2026, HB1) — runs elysium-bot-diag.html's
   OWN battery headlessly, in the same no-Node sandbox the bot suite's 75d
   gate uses (console + timers only; no require/module/process/Buffer).
   The page ships pre-verified: if this is green, a real browser should only
   be able to disagree about genuinely browser-specific things (script-tag
   loading, fetch, real timer clamping) — which is exactly what HB1 measures.
   Exit 0 = all pass (skips count as pass here since the smoke SUPPLIES the
   card database from disk, so nothing should skip). Exit 1 otherwise.       */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML = fs.readFileSync(path.join(__dirname, 'elysium-bot-diag.html'), 'utf8');
const BOT  = fs.readFileSync(path.join(__dirname, 'elysium-bot.js'), 'utf8');
const FX   = JSON.parse(fs.readFileSync(path.join(__dirname, 'elysium-cardfx.json'), 'utf8'));

const m = HTML.match(/\/\*HB1-BATTERY-START\*\/([\s\S]*?)\/\*HB1-BATTERY-END\*\//);
if (!m) { console.error('battery markers not found in elysium-bot-diag.html'); process.exit(1); }

const ctx = vm.createContext({ console: { log(){}, error(){}, warn(){} },
                               setTimeout, clearTimeout, setInterval, clearInterval });
try {
  vm.runInContext(BOT, ctx, { filename: 'elysium-bot.browser.js' });      // the same sandbox load 75d gates
  vm.runInContext(m[1], ctx, { filename: 'hb1-battery.js' });
} catch (e) {
  console.error('SMOKE ABORT at sandbox load: ' + (e && e.message || e) +
                '\n(an env-agnostic bot must load here — a pre-HB0 bot fails exactly like this)');
  process.exit(1);
}
if (!ctx.__HB1) { console.error('__HB1 not exported by the battery script'); process.exit(1); }

ctx.__env = {
  EB: ctx.ElysiumBot,
  loadError: null,
  fetchFx: () => Promise.resolve(ctx.__fxRaw),
  state: {},
  botLog: () => {},
  log: () => {},
};
ctx.__fxRaw = FX;

const rows = [];
ctx.__report = (name, status, detail) => rows.push({ name, status, detail });

(async () => {
  const sum = await vm.runInContext('__HB1.runHB1Battery(__env, __report)', ctx);
  for (const r of rows) {
    const word = r.status === true ? ' ✓ ' : r.status === 'skip' ? ' ○ ' : ' ✗ ';
    console.log(word + r.name + ' — ' + r.detail);
  }
  const bad = sum.fail + sum.skip;            // a skip here means the fx feed broke — that IS a smoke failure
  console.log('\n' + sum.pass + ' pass / ' + sum.fail + ' fail / ' + sum.skip + ' skip — ' +
              (bad ? 'SMOKE FAIL' : 'the battery holds in the no-Node sandbox'));
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('SMOKE ABORT: ' + (e && e.message || e)); process.exit(1); });
