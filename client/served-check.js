#!/usr/bin/env node
'use strict';
/* ============================================================
   Elysium - served-check.js (client v2.6.173, 11 Nov 2026, THE WATCHED DOOR;
   the bot project's security handoff, item 4: "a player who doubts a server
   can compare what it served")

   The watchdog. Fetches what a server hands out -- the client page and the
   four bot files -- and checks that each one is, byte for byte, a version of
   the matching root file that was COMMITTED to the given ref (main). A server
   that is taken over and serves something else fails this check, whoever
   wrote what it serves; nothing on the box has to be trusted to say so.

   How a file is matched: the served bytes' git blob id (sha1 of
   "blob <length>\0" + bytes) against the blob ids that path has had in the
   ref's history (`git log -m --raw`, plus the tip itself). Line endings: a
   copy that differs only in CR LF vs LF (a Windows checkout copied to the
   box) also matches, and the report says so -- CR LF changes nothing a
   browser runs. The page is served as-is (the server adds no nonce: its
   report-only policy hashes the file instead), so a match is exact.

   What it cannot see: a server that serves the right bytes to this check and
   other bytes to someone else. It is one observer, once a day; it raises the
   cost of a quiet takeover, it does not make one impossible.

   Usage:  node served-check.js [--base https://elysium.cards] [--repo <monorepo root>] [--ref origin/main]
   Exit:   0 every file served is a committed version (a bot file the server does not serve is noted, not failed)
           1 a file is served that no committed version matches -- the headline names it
           2 the check could not run: the page could not be fetched, or git could not be read
   ============================================================ */
const { execFileSync } = require('child_process');
const crypto = require('crypto'), path = require('path');

const args = process.argv.slice(2);
const argOf = (f, d) => { const i = args.indexOf(f); return (i >= 0 && args[i + 1] !== undefined) ? args[i + 1] : d; };
const BASE = String(argOf('--base', 'https://elysium.cards')).replace(/\/+$/, '');
const REPO = path.resolve(argOf('--repo', path.join(__dirname, '..')));
const REF  = argOf('--ref', 'origin/main');

/* served path -> the root file it must be a version of; `need` = the page itself must be there */
const FILES = [
  { url: '/', file: 'elysium-vtes-bord.html', need: true },
  { url: '/elysium-bot.js', file: 'elysium-bot.js' },
  { url: '/elysium-cardfx.json', file: 'elysium-cardfx.json' },
  { url: '/elysium-twd-profile.json', file: 'elysium-twd-profile.json' },
  { url: '/elysium-twd-archetypes.json', file: 'elysium-twd-archetypes.json' }
];

function blobId(buf){ return crypto.createHash('sha1').update('blob ' + buf.length + '\0').update(buf).digest('hex'); }
function git(a){ return execFileSync('git', ['-C', REPO].concat(a), { encoding: 'utf8', maxBuffer: 64 * 1048576, stdio: ['ignore', 'pipe', 'pipe'] }); }
/* every blob the path has had in REF's history -> the newest commit (short) and date that carried it */
function history(file){
  const seen = new Map();
  const out = git(['log', '-m', '--no-abbrev', '--raw', '--format=C %H %cI', REF, '--', file]);
  let cur = null;
  for (const line of out.split('\n')) {
    if (line.startsWith('C ')) { const p = line.split(' '); cur = { commit: p[1].slice(0, 10), date: p[2].slice(0, 10) }; continue; }
    const m = /^:\d+ \d+ ([0-9a-f]{40}) ([0-9a-f]{40}) /.exec(line);
    if (m && cur && !seen.has(m[2])) seen.set(m[2], cur);
  }
  try { const tip = git(['rev-parse', REF + ':' + file]).trim(); if (/^[0-9a-f]{40}$/.test(tip) && !seen.has(tip)) seen.set(tip, { commit: 'tip', date: '' }); } catch (e) {}
  return seen;
}
function versionOf(text){
  const m = /const VERSION\s*=\s*'(\d+\.\d+\.\d+)'/.exec(text) || /BOT_VERSION\s*[:=]\s*['"]([\d.]+)['"]/.exec(text) || /"version"\s*:\s*"([^"]{1,30})"/.exec(text);
  return m ? m[1] : '';
}

(async () => {
  const rows = []; let bad = 0, cannot = 0;
  for (const f of FILES) {
    let hist;
    try { hist = history(f.file); }
    catch (e) { rows.push([f.url, 'CANNOT', 'git: ' + String(e.message || e).split('\n')[0]]); cannot++; continue; }
    let res, buf;
    try {
      res = await fetch(BASE + f.url, { redirect: 'manual', headers: { 'User-Agent': 'elysium-served-check/1 (+https://github.com/dtagent2000/VTES-Elysium)' } });
      buf = Buffer.from(await res.arrayBuffer());
    } catch (e) { rows.push([f.url, 'CANNOT', 'fetch: ' + String(e.message || e)]); if (f.need) cannot++; continue; }
    if (res.status !== 200) {
      const why = 'HTTP ' + res.status + (res.headers.get('cf-mitigated') ? ' (Cloudflare challenged this runner)' : '');
      if (f.need) { rows.push([f.url, 'CANNOT', why]); cannot++; }
      else rows.push([f.url, 'NOT SERVED', why]);
      continue;
    }
    const ver = versionOf(buf.toString('utf8', 0, Math.min(buf.length, 400000)));
    const exact = hist.get(blobId(buf));
    if (exact) { rows.push([f.url, 'MATCH', (ver ? 'v' + ver + ', ' : '') + 'commit ' + exact.commit + (exact.date ? ' (' + exact.date + ')' : '')]); continue; }
    const lf = Buffer.from(buf.toString('latin1').replace(/\r\n/g, '\n'), 'latin1');
    const loose = lf.length !== buf.length && hist.get(blobId(lf));
    if (loose) { rows.push([f.url, 'MATCH*', (ver ? 'v' + ver + ', ' : '') + 'commit ' + loose.commit + ' -- served with CR LF line endings (a Windows copy); nothing a browser runs differs']); continue; }
    rows.push([f.url, 'UNKNOWN', (ver ? 'claims v' + ver + ', ' : '') + buf.length + ' bytes, sha256 ' + crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16) + '... -- no version committed to ' + REF + ' has these bytes']);
    bad++;
  }
  const head = bad ? 'MISMATCH: ' + BASE + ' serves ' + bad + ' file(s) that match no committed version'
             : cannot ? 'COULD NOT CHECK ' + BASE + ' (' + cannot + ' file(s) could not be read)'
             : 'OK: everything ' + BASE + ' serves is a version committed to ' + REF;
  console.log(head);
  const w = Math.max(...rows.map(r => r[0].length));
  for (const r of rows) console.log('  ' + r[0].padEnd(w) + '  ' + r[1].padEnd(10) + '  ' + r[2]);
  process.exit(bad ? 1 : (cannot ? 2 : 0));
})().catch(e => { console.log('COULD NOT CHECK: ' + (e && e.stack || e)); process.exit(2); });
