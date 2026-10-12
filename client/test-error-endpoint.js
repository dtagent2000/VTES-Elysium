#!/usr/bin/env node
'use strict';
/* ============================================================
   Elysium - test-error-endpoint (srv-2.6.25, B-54; + the bot statics, srv-2.6.28 / srv-2.6.43)
   Live end-to-end smoke for POST /client-error: spawns the REAL
   server on a random port with a FRESH tmp --data-dir (the diag
   lesson: an unisolated data dir lets a stale snapshot poison
   the next run), then exercises accept / oversize / flood.
   Complements the sync unit tests in test-server-dispatch.js,
   which cover errScrub/errRecord/handleClientError under the
   harness fs stub -- THIS file proves the disk actually gets
   the JSONL row and the rate limiter holds over real HTTP.

   Run:  node test-error-endpoint.js [path/to/elysium-server.js]
   Needs Node >= 18 (global fetch).
   ============================================================ */
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const SRV  = process.argv[2] || path.resolve(__dirname, 'elysium-server.js');
const PORT = 20000 + Math.floor(Math.random() * 20000);
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'ely-errtest-'));
const LOG  = path.join(DATA, 'elysium-errors.log');
const URL_ = 'http://127.0.0.1:' + PORT + '/client-error';

let pass = 0, fail = 0; const failed = [];
function ok(c, name){ if (c){ pass++; console.log('  \u2713 ' + name); } else { fail++; failed.push(name); console.log('  \u2717 ' + name); } }
const sleep = ms => new Promise(r => setTimeout(r, ms));
function lines(){ try { return fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean); } catch (e) { return []; } }

(async () => {
  console.log('\nElysium - error endpoint live smoke (port ' + PORT + ', data ' + DATA + ')\n');
  const child = spawn(process.execPath, [SRV, String(PORT), '--data-dir', DATA], { stdio: ['ignore', 'pipe', 'pipe'] });
  let up = false;
  child.stdout.on('data', d => { if (/Data:|listening|port/i.test(String(d))) up = true; });
  child.stderr.on('data', () => {});
  const t0 = Date.now();
  while (!up && Date.now() - t0 < 8000) await sleep(100);
  ok(up, 'server boots on a random port with an isolated tmp --data-dir');

  /* 1) a valid post answers 204 and lands exactly one whitelisted JSONL row -- B-63: WITH a dump that round-trips */
  const r1 = await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'report', ver: '2.6.60', note: 'smoke', evil: 'dropme',
                           ring: [{ t: 1723100000000, m: 'line1' }, 'old-shape line'],
                           summary: { libN: 53, deckName: 'C5' },
                           dump: { game: { turn: 2, deckName: 'C5', libN: 53, cryptN: 9, handN: 7,
                                           hand: ['Vessel'], board: [{ id: 'c1', z: 'ready', s: 1, x: 10, y: 20, n: 'Alpha' },
                                                                     { id: 'r2', z: 'ready', s: 2, x: 30, y: 40, fd: 1 }] },
                                   env: { ua: 'smoke', screen: '1280x800', dpr: 1, decks: [{ name: 'C5', crypt: 12, library: 60, warn: 0 }],
                                          settings: { autoLock: true, defaultView: 'normal', animSpeed: 1.5, sfxIndiv: { unlock: 150 } } } } }) });
  ok(r1.status === 204, 'valid post answers 204');
  await sleep(250);                                    /* appendFile is fire-and-forget */
  let L = lines();
  ok(L.length === 1, 'exactly one JSONL row lands in elysium-errors.log (' + L.length + ')');
  let rec = null; try { rec = JSON.parse(L[0]); } catch (e) {}
  ok(rec && rec.kind === 'report' && rec.note === 'smoke' && rec.evil === undefined
        && rec.summary && rec.summary.libN === 53 && rec.summary.deckName === 'C5',
     'the row is whitelisted: evil dropped, summary picked, note kept');
  ok(rec && rec.dump && rec.dump.game && rec.dump.game.deckName === 'C5'
        && rec.dump.game.board.length === 2 && rec.dump.game.board[1].n === undefined
        && rec.dump.env && rec.dump.env.decks[0].name === 'C5',
     'B-63: the dump round-trips whole -- and the face-down stub stays nameless on disk');
  ok(rec && rec.dump.env.settings && rec.dump.env.settings.autoLock === true
        && rec.dump.env.settings.defaultView === 'normal' && rec.dump.env.settings.animSpeed === 1.5
        && rec.dump.env.settings.sfxIndiv === undefined,
     'srv-2.6.30: settings ride the dump (shape-gated -- the object value was dropped)');
  ok(rec && Array.isArray(rec.ring) && rec.ring[0] && rec.ring[0].m === 'line1' && rec.ring[1] === 'old-shape line',
     'B-63: both ring shapes land ({t,m} kept, bare string kept)');
  ok(rec && rec.ip === undefined, 'no IP address in the record -- the address lives only in the in-memory limiter');

  /* 2) an oversized body is destroyed without writing a row (B-63/T6: the cap moved 32 -> 64 kB, so the probe must exceed 64) */
  let threw = false;
  try { await fetch(URL_, { method: 'POST', body: 'x'.repeat(80 * 1024) }); } catch (e) { threw = true; }
  await sleep(250);
  ok(lines().length === 1, 'an oversized post writes nothing (socket destroyed' + (threw ? ', fetch rejected' : ', server gave no 2xx') + ')');

  /* 3) flood: strikes freeze at ERR_MAX -- the log caps at 10 rows total for this ip/window */
  for (let i = 0; i < 12; i++) {
    try { await fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ kind: 'crash', msg: 'flood ' + i }) }); } catch (e) {}
  }
  await sleep(400);
  L = lines();
  ok(L.length === 10, 'the window admits ERR_MAX rows total, the flood is swallowed silently (' + L.length + '/10)');

  /* 4) without --admin-pass the log route does not exist */
  const r404 = await fetch('http://127.0.0.1:' + PORT + '/client-errors.txt?key=anything');
  ok(r404.status === 404, 'GET /client-errors.txt is OFF when no --admin-pass is configured');

  /* HB2c (srv-2.6.28): the two bot-loader statics */
  const B = 'http://127.0.0.1:' + PORT;
  const g1 = await fetch(B + '/elysium-bot.js');
  ok(g1.status === 200 && /^application\/javascript/.test(g1.headers.get('content-type') || '')
       && g1.headers.get('x-content-type-options') === 'nosniff'
       && /BOT_VERSION/.test(await g1.text()),
     'GET /elysium-bot.js: 200, application/javascript, nosniff, real bot source');
  const g2 = await fetch(B + '/elysium-cardfx.json');
  let fx28 = null; try { fx28 = JSON.parse(await g2.text()); } catch (e) {}
  ok(g2.status === 200 && /^application\/json/.test(g2.headers.get('content-type') || '')
       && fx28 && fx28.fxv === 1,
     'GET /elysium-cardfx.json: 200, application/json, parses with fxv===1');
  /* srv-2.6.43: the knowledge layer's two data files ride the same route. They are the bot project's release
     artifacts -- beside the server they must serve as JSON with their own shape; absent, the route answers 404
     (the bot simply reads no decks) and this test says which case it measured. */
  for (const [nm, key] of [['elysium-twd-profile.json', 'cards'], ['elysium-twd-archetypes.json', 'archetypes']]) {
    const beside = fs.existsSync(path.join(path.dirname(SRV), nm));
    const gt = await fetch(B + '/' + nm); let jt = null; const body = await gt.text(); try { jt = JSON.parse(body); } catch (e) {}
    if (beside) ok(gt.status === 200 && /^application\/json/.test(gt.headers.get('content-type') || '') && gt.headers.get('x-content-type-options') === 'nosniff' && jt && jt[key],
                   'GET /' + nm + ': 200, application/json, nosniff, parses with `' + key + '` (srv-2.6.43)');
    else ok(gt.status === 404, 'GET /' + nm + ': not beside the server -> 404, nothing else answers (srv-2.6.43; upload the bot release to test the 200)');
  }
  const g3 = await fetch(B + '/elysium-bot.js.bak');
  ok(g3.status === 404, 'a near-name miss 404s -- exact match, not a pattern');
  const g4 = await fetch(B + '/elysium-bot.js%2F..%2Fx');
  ok(g4.status === 404, 'an encoded traversal shape 404s -- req.url never matches, nothing is decoded');

  child.kill('SIGTERM'); await sleep(300);
  try { child.kill('SIGKILL'); } catch (e) {}

  /* 5) second spawn WITH --admin-pass: the pull half end to end */
  const PORT2 = 20000 + Math.floor(Math.random() * 20000);
  const DATA2 = fs.mkdtempSync(path.join(os.tmpdir(), 'ely-errtest2-'));
  const c2 = spawn(process.execPath, [SRV, String(PORT2), '--data-dir', DATA2, '--admin-pass', 's3cr3t'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let up2 = false; c2.stdout.on('data', d => { if (/Data:|listening|port/i.test(String(d))) up2 = true; }); c2.stderr.on('data', () => {});
  const t1 = Date.now(); while (!up2 && Date.now() - t1 < 8000) await sleep(100);
  ok(up2, 'admin-pass server boots');
  await fetch('http://127.0.0.1:' + PORT2 + '/client-error', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'crash', ver: '2.6.55', msg: 'needle-for-the-pull-test' }) });
  await sleep(250);
  const rBad = await fetch('http://127.0.0.1:' + PORT2 + '/client-errors.txt?key=wrong');
  ok(rBad.status === 404, 'a wrong admin key answers 404-uniform');
  const rOk = await fetch('http://127.0.0.1:' + PORT2 + '/client-errors.txt?key=s3cr3t');
  const txt = rOk.status === 200 ? await rOk.text() : '';
  ok(rOk.status === 200 && txt.includes('needle-for-the-pull-test'), 'the right key pulls the posted record back out (' + rOk.status + ')');
  const rDl = await fetch('http://127.0.0.1:' + PORT2 + '/client-errors.txt?key=s3cr3t&dl=1');
  ok(/attachment/.test(rDl.headers.get('content-disposition') || ''), 'dl=1 serves as a .txt download');

  /* 6) maintenance control end to end: arm -> status -> clear */
  const mOn = await fetch('http://127.0.0.1:' + PORT2 + '/admin/maintenance?key=s3cr3t&on=1&hours=1&msg=smoke-drain');
  const jOn = mOn.status === 200 ? await mOn.json() : {};
  ok(mOn.status === 200 && jOn.active === true && /smoke-drain/.test(jOn.msg || ''), 'arming answers 200 with active:true');
  const mOff = await fetch('http://127.0.0.1:' + PORT2 + '/admin/maintenance?key=s3cr3t&off=1');
  const jOff = mOff.status === 200 ? await mOff.json() : { active: true };
  ok(jOff.active === false, 'off clears the window');
  const mBad = await fetch('http://127.0.0.1:' + PORT2 + '/admin/maintenance?key=nope&on=1');
  ok(mBad.status === 404, 'the control is 404-uniform to a wrong key');

  c2.kill('SIGTERM'); await sleep(300);
  try { c2.kill('SIGKILL'); } catch (e) {}
  try { fs.rmSync(DATA, { recursive: true, force: true }); } catch (e) {}
  try { fs.rmSync(DATA2, { recursive: true, force: true }); } catch (e) {}
  console.log('\n' + pass + ' passed, ' + fail + ' failed' + (fail ? '  - ' + failed.join(', ') : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e && e.stack || e); process.exit(2); });
