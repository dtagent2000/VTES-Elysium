#!/usr/bin/env node
'use strict';
/* ============================================================
   Elysium - test-served-check (client v2.6.173, THE WATCHED DOOR)
   The watchdog has to be able to fail, or its green means nothing (the soak's
   lesson, 21 Sep). Runs the REAL server from the repository root -- the
   committed release, client page and bot files beside it -- and points
   served-check.js at it:
     1) the release as committed           -> exit 0, every file MATCH
     2) the same page with one byte changed -> exit 1, the page UNKNOWN
     3) the page with CR LF line endings    -> exit 0, MATCH* (a Windows copy)
     4) nothing listening                   -> exit 2, could not check
   Uses --ref HEAD, so it holds in CI's shallow checkout as well as in a full
   clone. Needs git and Node >= 18. The root must equal HEAD (no uncommitted
   release copy) for case 1 -- in CI it always does.

   Run:  node test-served-check.js
   ============================================================ */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const ROOT = path.resolve(__dirname, '..');
const CHECK = path.join(__dirname, 'served-check.js');
let pass = 0, fail = 0; const failed = [];
function ok(c, name){ if (c){ pass++; console.log('  ✓ ' + name); } else { fail++; failed.push(name); console.log('  ✗ ' + name); } }
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function boot(clientPath){
  const port = 20000 + Math.floor(Math.random() * 20000);
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'ely-served-'));
  const a = [path.join(ROOT, 'elysium-server.js'), String(port)].concat(clientPath ? [clientPath] : []).concat(['--data-dir', data]);
  const c = spawn(process.execPath, a, { stdio: ['ignore', 'pipe', 'pipe'] });
  let up = false; c.stdout.on('data', d => { if (/Data:/.test(String(d))) up = true; }); c.stderr.on('data', () => {});
  const t = Date.now(); while (!up && Date.now() - t < 8000) await sleep(100);
  return { c, port, data, up };
}
function check(port){
  const r = spawnSync(process.execPath, [CHECK, '--base', 'http://127.0.0.1:' + port, '--repo', ROOT, '--ref', 'HEAD'], { encoding: 'utf8', timeout: 60000 });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
function stop(s){ try { s.c.kill('SIGKILL'); } catch (e) {} try { fs.rmSync(s.data, { recursive: true, force: true }); } catch (e) {} }

(async () => {
  console.log('\nElysium - served-check (the watchdog) against the real server\n');
  const page = fs.readFileSync(path.join(ROOT, 'elysium-vtes-bord.html'));
  let dirty = '';
  try { dirty = spawnSync('git', ['-C', ROOT, 'status', '--porcelain', '--', 'elysium-vtes-bord.html', 'elysium-server.js', 'elysium-bot.js', 'elysium-cardfx.json', 'elysium-twd-profile.json', 'elysium-twd-archetypes.json'], { encoding: 'utf8' }).stdout.trim(); } catch (e) {}
  if (dirty) console.log('  (the root holds an uncommitted release copy -- case 1 reads it against HEAD and is expected to fail until it is committed)\n');

  /* 1) the committed release */
  let s = await boot(null);
  ok(s.up, 'the root\'s server boots');
  let r = check(s.port);
  ok(r.code === 0 && /^OK: /.test(r.out) && /\/\s+MATCH\s/.test(r.out), 'the release as committed: exit 0, the page MATCH (' + r.code + ')');
  ok(/\/elysium-bot\.js\s+MATCH\s/.test(r.out) && /\/elysium-cardfx\.json\s+MATCH\s/.test(r.out), 'the bot files beside it: MATCH');
  stop(s);
  if (r.code !== 0) console.log(r.out.replace(/^/gm, '      '));

  /* 2) one byte changed */
  const site = fs.mkdtempSync(path.join(os.tmpdir(), 'ely-served-site-'));
  const evil = Buffer.from(page); const at = evil.indexOf(Buffer.from('<title>')) + 7; evil[at] = evil[at] ^ 0x20;   // 'E' -> 'e': one bit
  fs.writeFileSync(path.join(site, 'evil.html'), evil);
  s = await boot(path.join(site, 'evil.html'));
  r = check(s.port);
  ok(r.code === 1 && /^MISMATCH: /.test(r.out) && /\/\s+UNKNOWN\s/.test(r.out), 'one bit changed in the page: exit 1, the page UNKNOWN (' + r.code + ')');
  ok(/\/elysium-bot\.js\s+MATCH\s/.test(r.out), 'and the untouched bot file still MATCH');
  stop(s);

  /* 3) CR LF line endings */
  fs.writeFileSync(path.join(site, 'crlf.html'), Buffer.from(page.toString('latin1').replace(/\n/g, '\r\n'), 'latin1'));
  s = await boot(path.join(site, 'crlf.html'));
  r = check(s.port);
  ok(r.code === 0 && /\/\s+MATCH\*\s/.test(r.out) && /CR LF/.test(r.out), 'the page with CR LF line endings: exit 0, MATCH* and says why (' + r.code + ')');
  stop(s);

  /* 4) nothing listening */
  r = check(1);
  ok(r.code === 2 && /^COULD NOT CHECK/.test(r.out), 'nothing listening: exit 2, could not check (' + r.code + ')');

  try { fs.rmSync(site, { recursive: true, force: true }); } catch (e) {}
  console.log('\n' + pass + ' passed, ' + fail + ' failed' + (fail ? '  - ' + failed.join(', ') : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e && e.stack || e); process.exit(2); });
