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

  /* 7) srv-2.6.50 THE WATCHED DOOR, live: a boot WRAPS srv-2.6.49's SHA-256 hashes and writes both files at once; the restored
     room opens with its old password over a real socket and nothing else; the page carries a report-only policy holding the
     hash of every script in the very bytes sent; /images/ answers with a sandbox; and a restart ADOPTS the salt: nothing is
     wrapped twice, and a new room with the same password lands in the old save's group (D4). */
  const crypto7 = require('crypto');
  const sha7 = t => crypto7.createHash('sha256').update(t, 'utf8').digest('hex');
  const S1 = /^s1\$[0-9a-f]{32}\$[0-9a-f]{64}$/;
  const DATA3 = fs.mkdtempSync(path.join(os.tmpdir(), 'ely-errtest3-'));
  const SITE = path.join(DATA3, 'site'); fs.mkdirSync(path.join(SITE, 'images'), { recursive: true });
  fs.copyFileSync(path.join(path.dirname(SRV), 'elysium-vtes-bord.html'), path.join(SITE, 'elysium-vtes-bord.html'));
  fs.writeFileSync(path.join(SITE, 'images', 'probe.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  fs.writeFileSync(path.join(DATA3, 'elysium-rooms.json'), JSON.stringify([{ name: 'Old50', passHash: sha7('fredag'), refHash: sha7('domare'), hostToken: 'ht',
    created: Date.now(), started: true, everPop: true, players: [{ name: 'Ann', token: 'tk-ann' }] }]));
  fs.writeFileSync(path.join(DATA3, 'elysium-saves.json'), JSON.stringify([{ name: 'friday50', passHash: sha7('fredag'), roomName: 'Old50', savedAt: Date.now(), touchedAt: Date.now(), players: [] }]));
  const boot7 = async port => {
    const c = spawn(process.execPath, [SRV, String(port), path.join(SITE, 'elysium-vtes-bord.html'), '--data-dir', DATA3], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', upx = false; c.stdout.on('data', d => { out += d; if (/Data:/.test(out)) upx = true; }); c.stderr.on('data', () => {});
    const t = Date.now(); while (!upx && Date.now() - t < 8000) await sleep(100);
    return { c, up: upx, out: () => out };
  };
  const files7 = () => { try { return { rooms: JSON.parse(fs.readFileSync(path.join(DATA3, 'elysium-rooms.json'), 'utf8')),
                                       saves: JSON.parse(fs.readFileSync(path.join(DATA3, 'elysium-saves.json'), 'utf8')) }; } catch (e) { return { rooms: [], saves: [] }; } };
  const ws7 = (port, msg) => new Promise(res => {                                   // Node 22's own WebSocket; the first joined/err answers
    let done = false; const ws = new WebSocket('ws://127.0.0.1:' + port);
    const fin = v => { if (!done){ done = true; try { ws.close(); } catch (e) {} res(v); } };
    ws.onopen = () => ws.send(JSON.stringify(msg));
    ws.onmessage = ev => { let m = null; try { m = JSON.parse(String(ev.data)); } catch (e) {} if (m && (m.t === 'joined' || m.t === 'err')) fin(m); };
    ws.onerror = () => fin(null); setTimeout(() => fin(null), 4000);
  });
  const PORT3 = 20000 + Math.floor(Math.random() * 20000);
  const b1 = await boot7(PORT3);
  ok(b1.up && /\b3 stored password hash\(es\) moved from SHA-256 to scrypt/.test(b1.out()), 'srv-2.6.50: the boot wraps the room\'s two old hashes and the save\'s one, and says so');
  await sleep(400);
  let F = files7();
  const old = F.rooms.find(r => r.name === 'Old50') || {}, fri = F.saves.find(x => x.name === 'friday50') || {};
  const raw7 = fs.readFileSync(path.join(DATA3, 'elysium-rooms.json'), 'utf8') + fs.readFileSync(path.join(DATA3, 'elysium-saves.json'), 'utf8');
  ok(S1.test(old.passHash || '') && S1.test(old.refHash || '') && S1.test(fri.passHash || '') && !/"[0-9a-f]{64}"/.test(raw7),
     'both files are written at once: s1 everywhere, no SHA-256 hash left on disk');
  ok(fri.passHash === old.passHash, 'the save and its room land on the same hash (the group rule)');
  if (typeof WebSocket === 'function'){
    const bad = await ws7(PORT3, { t: 'join', room: 'Old50', name: 'Bob', pass: 'fel' });
    ok(bad && bad.t === 'err' && /Wrong password/.test(bad.msg || ''), 'over a real socket: the restored room refuses a wrong password');
    const good = await ws7(PORT3, { t: 'join', room: 'Old50', name: 'Bob', pass: 'fredag' });
    ok(good && good.t === 'joined', 'and seats its old one');
  } else console.log('  (the socket checks need Node 22\'s WebSocket -- skipped here)');
  const pg = await fetch('http://127.0.0.1:' + PORT3 + '/');
  const body7 = await pg.text(), pol7 = pg.headers.get('content-security-policy-report-only') || '';
  const want7 = []; body7.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, (a, t) => { const h = "'sha256-" + crypto7.createHash('sha256').update(t, 'utf8').digest('base64') + "'"; if (want7.indexOf(h) < 0) want7.push(h); return a; });
  ok(pg.status === 200 && want7.length >= 2 && want7.every(h => pol7.includes(h)) && !pg.headers.get('content-security-policy'),
     'GET /: a REPORT-ONLY policy holding the hash of every script in the bytes sent (' + want7.length + '), and no enforcing one');
  ok(pol7.includes("connect-src 'self' ws://127.0.0.1:" + PORT3 + ' wss://127.0.0.1:' + PORT3) && pg.headers.get('x-frame-options') === 'DENY',
     'its own host spelled out for the sockets; the old hardening headers stay');
  const im7 = await fetch('http://127.0.0.1:' + PORT3 + '/images/probe.svg');
  ok(im7.status === 200 && /sandbox/.test(im7.headers.get('content-security-policy') || '') && /default-src 'none'/.test(im7.headers.get('content-security-policy') || ''),
     'GET /images/probe.svg: a sandbox policy -- opened on its own, the SVG\'s script never runs');
  b1.c.kill('SIGTERM'); await sleep(500); try { b1.c.kill('SIGKILL'); } catch (e) {}
  const before = JSON.stringify(files7().saves.map(x => x.passHash));
  const PORT4 = 20000 + Math.floor(Math.random() * 20000);
  const b2 = await boot7(PORT4);
  ok(b2.up && !/moved from SHA-256/.test(b2.out()), 'a restart wraps nothing twice');
  if (typeof WebSocket === 'function'){
    const mk = await ws7(PORT4, { t: 'create', room: 'New50', name: 'Cid', pass: 'fredag', lobby: true });
    ok(mk && mk.t === 'joined', 'a new room with the same password is created after the restart');
    const again = await ws7(PORT4, { t: 'join', room: 'Old50', name: 'Dan', pass: 'fredag' });
    ok(again && again.t === 'joined', 'the restored room still opens with its password after a second start');
  }
  b2.c.kill('SIGTERM'); await sleep(500); try { b2.c.kill('SIGKILL'); } catch (e) {}
  F = files7();
  const nw = F.rooms.find(r => r.name === 'New50');
  ok(JSON.stringify(F.saves.map(x => x.passHash)) === before && (typeof WebSocket !== 'function' || (nw && nw.passHash === fri.passHash)),
     'the salt is adopted from the files: the new room\'s hash equals the old save\'s, so its save list still shows it');
  try { fs.rmSync(DATA3, { recursive: true, force: true }); } catch (e) {}
  try { fs.rmSync(DATA, { recursive: true, force: true }); } catch (e) {}
  try { fs.rmSync(DATA2, { recursive: true, force: true }); } catch (e) {}
  console.log('\n' + pass + ' passed, ' + fail + ' failed' + (fail ? '  - ' + failed.join(', ') : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL', e && e.stack || e); process.exit(2); });
