/* Elysium - check-versions: one-command snapshot drift check.
   Scans a directory (default '.') for the project's key files and prints every
   version marker side by side, WARNING on any drift:
     - client/server code VERSION vs each other (major.minor lockstep; PATCH may
       differ by design, so only a major.minor gap warns for the pair)
     - the four living-doc headers ("client vX / server vY") vs the live code
     - ELYSIUM-PROTOCOL.md's "server **vX** / client **vY**" vs the live code
     - START-HERE.html "Version 1.x" (English onboarding presence)
     - the test suites' handler expectations (49 s2c / 54 c2s as of v2.6.139 / srv-2.6.43)
     - presence of the build/test tool trio the gates cannot run without
     - (monorepo, 12 Oct 2026) the repository ROOT is the download: every root file must be a
       byte copy of client/<name> (ours) or of bot/<name> (the eight bundle files) -- the rule
       in the root CLAUDE.md, asserted instead of promised
   Born from the false-green lesson (a month-stale server hid in the snapshot)
   and the day the cleanup took split_client.py with it.
   Living docs may sit beside the code or in docs/ (the monorepo's client/docs/) -- read() tries both.

   Usage: node check-versions.js [dir]      Exit 0 = everything agrees, 1 = drift. */
'use strict';
const fs = require('fs');
const path = require('path');

const dir = path.resolve(process.argv[2] || '.');
const warns = [];
const rows = [];
function read(f){ for (const d of [dir, path.join(dir, 'docs')]) { try { return fs.readFileSync(path.join(d, f), 'utf8'); } catch {} } return null; }
function row(file, marker){ rows.push([file, marker]); }
function warn(msg){ warns.push(msg); }
function grab(txt, re){ const m = txt && txt.match(re); return m ? m[1] : null; }
function mm(v){ return v ? v.split('.').slice(0, 2).join('.') : null; }   // major.minor

// --- code ---
const cli = read('elysium-vtes-bord.html');
const srv = read('elysium-server.js');
const cliV = grab(cli, /const VERSION='(\d+\.\d+\.\d+)'/);
const srvV = grab(srv, /const VERSION\s*=\s*'(\d+\.\d+\.\d+)'/);
row('elysium-vtes-bord.html', cli ? ('VERSION ' + (cliV || '?')) : 'MISSING');
row('elysium-server.js',      srv ? ('VERSION ' + (srvV || '?')) : 'MISSING');
if (!cli) warn('client file missing');
if (!srv) warn('server file missing');
if (cliV && srvV && mm(cliV) !== mm(srvV))
  warn('client ' + cliV + ' vs server ' + srvV + ' - major.minor lockstep broken (patch drift alone is fine)');

// --- living-doc headers ---
for (const f of ['CLAUDE.md', 'elysium-project-context.md', 'elysium-learnings.md', 'SKILLS.md']){
  const t = read(f);
  const dc = grab(t, /client v(\d+\.\d+\.\d+)/), ds = grab(t, /server v(\d+\.\d+\.\d+)/);
  row(f, t ? ('header client v' + (dc || '?') + ' / server v' + (ds || '?')) : 'MISSING');
  if (!t) { warn(f + ' missing'); continue; }
  if (dc && cliV && dc !== cliV) warn(f + ' header says client v' + dc + ', code is ' + cliV);
  if (ds && srvV && ds !== srvV) warn(f + ' header says server v' + ds + ', code is ' + srvV);
}

// --- protocol doc ---
{
  const t = read('ELYSIUM-PROTOCOL.md');
  const ps = grab(t, /server \*\*v(\d+\.\d+\.\d+)\*\*/), pc = grab(t, /client \*\*v(\d+\.\d+\.\d+)\*\*/);
  row('ELYSIUM-PROTOCOL.md', t ? ('server v' + (ps || '?') + ' / client v' + (pc || '?')) : 'MISSING');
  if (!t) warn('ELYSIUM-PROTOCOL.md missing');
  else {
    if (pc && cliV && pc !== cliV) warn('PROTOCOL header says client v' + pc + ', code is ' + cliV);
    if (ps && srvV && ps !== srvV) warn('PROTOCOL header says server v' + ps + ', code is ' + srvV);
  }
}

// --- onboarding ---
{
  const en = grab(read('START-HERE.html'), /Version (\d+\.\d+)/);
  row('START-HERE.html', en ? ('Version ' + en) : 'MISSING');
  if (!en) warn('START-HERE.html missing');
}

// --- suite expectations ---
{
  const c = grab(read('test-client-logic.js'),    /eq\(keys\.length,\s*(\d+)/);
  const s = grab(read('test-server-dispatch.js'), /eq\(keys\.length,\s*(\d+)/);
  row('test-client-logic.js',    c ? ('expects ' + c + ' s2c handlers') : 'MISSING');
  row('test-server-dispatch.js', s ? ('expects ' + s + ' c2s handlers') : 'MISSING');
  if (c && c !== '49') warn('client suite expects ' + c + ' handlers (current protocol: 49)');   // 46 -> 47 at v2.6.16: +tally (s2c); 47 -> 48 at v2.6.105: +closed; 48 -> 49 at v2.6.139: +botcfg
  if (s && s !== '54') warn('server suite expects ' + s + ' handlers (current protocol: 54)');   // 51 -> 52 at server v2.6.11: +tally (c2s); 52 -> 53 at srv-2.6.36: +closeRoom; 53 -> 54 at srv-2.6.43: +botcfg
  if (!c) warn('test-client-logic.js missing');
  if (!s) warn('test-server-dispatch.js missing');
  row('test-protocol-doc.js', read('test-protocol-doc.js') ? 'present' : 'MISSING');
  if (!read('test-protocol-doc.js')) warn('test-protocol-doc.js (the protocol lint) missing');
}

// --- the tool trio the gates cannot run without ---
for (const f of ['split_client.py', 'elysium-build.js', 'elysium-test-harness.js', 'elysium-soak-hotseat.js', 'embed-help.js', 'help-local-server.html']){   // v2.6.127: the Help-page embed tool + our Local-server authoring source (the drift test needs both)
  const ok = fs.existsSync(path.join(dir, f));
  row(f, ok ? 'present' : 'MISSING');
  if (!ok) warn(f + ' missing - the round-trip gate / suites cannot run');
}

// --- the monorepo root is the download (12 Oct 2026) ---
// When this directory is the monorepo's client/ (a parent with CLAUDE.md, bot/ and client/), every
// regular file at the root must equal client/<name> or bot/<name> byte for byte. Root-only files
// (the root CLAUDE.md, README.md, dotfiles) are skipped; a root file with no twin on either side
// warns too -- nothing lands at the root by hand.
{
  const root = path.dirname(dir);
  const isMono = path.basename(dir) === 'client' && fs.existsSync(path.join(root, 'CLAUDE.md')) && fs.existsSync(path.join(root, 'bot')) && fs.existsSync(path.join(root, 'client'));
  if (isMono) {
    const ROOT_ONLY = new Set(['CLAUDE.md', 'README.md']);
    // The bot bundle is the ONLY thing the root takes from bot/. Everything else must equal client/ --
    // bot/ also carries read-only copies of OUR server, client and protocol, and a stale root server
    // matching bot/'s old copy must not pass as current.
    const BOT_BUNDLE = new Set(['elysium-bot.js', 'elysium-cardfx.json', 'elysium-cardfx.js', 'elysium-twd-profile.json', 'elysium-twd-profile.js',
                                'elysium-twd-archetypes.json', 'elysium-twd-archetypes.js', 'START-HERE-BOTS.html']);
    let n = 0, bad = 0;
    for (const f of fs.readdirSync(root).sort()) {
      if (f[0] === '.' || ROOT_ONLY.has(f)) continue;
      const rp = path.join(root, f);
      if (!fs.statSync(rp).isFile()) continue;
      n++;
      const twin = BOT_BUNDLE.has(f) ? path.join(root, 'bot', f) : path.join(dir, f);
      if (!fs.existsSync(twin)) { bad++; warn('root/' + f + ' has no twin at ' + path.relative(root, twin) + ' -- the root is a copy of a release, never edited by hand'); continue; }
      if (!fs.readFileSync(rp).equals(fs.readFileSync(twin))) { bad++; warn('root/' + f + ' differs from ' + path.relative(root, twin) + ' -- copy the release to the root, or the root is stale'); }
    }
    row('repo root (the download)', bad ? (bad + ' of ' + n + ' files drift') : (n + ' files, each a byte copy of client/ or bot/'));
  }
}

// --- print ---
console.log('\nElysium - version & snapshot check: ' + dir + '\n');
const w = Math.max(...rows.map(r => r[0].length)) + 2;
for (const [f, m] of rows) console.log('  ' + f.padEnd(w) + m);
if (warns.length){
  console.log('\n  WARNINGS (' + warns.length + '):');
  for (const m of warns) console.log('   ! ' + m);
  console.log('\ndrift detected');
  process.exit(1);
}
console.log('\neverything agrees');
process.exit(0);
