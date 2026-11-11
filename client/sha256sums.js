#!/usr/bin/env node
'use strict';
/* ============================================================
   Elysium - sha256sums.js (client v2.6.173, 11 Nov 2026, THE WATCHED DOOR;
   the bot project's security handoff, item 4: release hashes)

   Writes client/SHA256SUMS: the SHA-256 of every file this project
   releases to the repository root (the download), in the format
   `sha256sum -c` reads, so a host -- or a player who doubts a server --
   can check a copy against GitHub:

       sha256sum -c client/SHA256SUMS          (from the repository root)
       shasum -a 256 -c client/SHA256SUMS      (macOS)

   Which files: every regular file at the root that is OURS -- not the
   root's own CLAUDE.md / README.md, not a dotfile, and not the bot bundle.
   The bundle is the bot project's release: it changes with their merges,
   which our gates never see run, so listing it here would turn our CI red
   the day after each bot release (the 6 Nov lesson, 'TWENTY-ONE SECONDS').
   The hashes are taken from client/ (the root is a byte copy of it -- the
   gate in check-versions.js), so the file can be written before or after
   the release copy.

   check-versions.js loads sumsText() and fails when SHA256SUMS on disk is
   not current, so it cannot drift. The watchdog (served-check.js) checks a
   running server against git itself and does not need this file.

   Usage:  node sha256sums.js            write SHA256SUMS beside this file
           node sha256sums.js --check    exit 1 when SHA256SUMS is not current
   ============================================================ */
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const ROOT_ONLY = new Set(['CLAUDE.md', 'README.md']);
const BOT_BUNDLE = new Set(['elysium-bot.js', 'elysium-cardfx.json', 'elysium-cardfx.js', 'elysium-twd-profile.json', 'elysium-twd-profile.js',
                            'elysium-twd-archetypes.json', 'elysium-twd-archetypes.js', 'START-HERE-BOTS.html']);   // the same eight as check-versions.js (it asserts the two lists agree)

/* our release files at the root of the monorepo `dir` lives in (dir = client/), sorted; null outside the monorepo */
function releaseFiles(dir){
  const root = path.dirname(path.resolve(dir));
  if (path.basename(path.resolve(dir)) !== 'client' || !fs.existsSync(path.join(root, 'bot'))) return null;
  return fs.readdirSync(root).filter(f => f[0] !== '.' && !ROOT_ONLY.has(f) && !BOT_BUNDLE.has(f)
    && fs.statSync(path.join(root, f)).isFile() && fs.existsSync(path.join(dir, f))).sort();
}
/* the text SHA256SUMS must hold: '<sha256>  <name>' per release file (two spaces: text mode, as sha256sum writes it) */
function sumsText(dir){
  const files = releaseFiles(dir);
  if (!files) return null;
  return files.map(f => crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, f))).digest('hex') + '  ' + f).join('\n') + '\n';
}
module.exports = { ROOT_ONLY, BOT_BUNDLE, releaseFiles, sumsText };

if (require.main === module) {
  const dir = __dirname, out = path.join(dir, 'SHA256SUMS');
  const want = sumsText(dir);
  if (want === null) { console.error('sha256sums: not inside the monorepo (client/ beside bot/) -- nothing to list'); process.exit(2); }
  let have = null; try { have = fs.readFileSync(out, 'utf8'); } catch (e) {}
  if (process.argv.includes('--check')) {
    if (have === want) { console.log('sha256sums: SHA256SUMS is current (' + want.trim().split('\n').length + ' files)'); process.exit(0); }
    console.error('sha256sums: SHA256SUMS is ' + (have === null ? 'missing' : 'stale') + ' -- run node sha256sums.js'); process.exit(1);
  }
  fs.writeFileSync(out, want);
  console.log('sha256sums: wrote SHA256SUMS (' + want.trim().split('\n').length + ' files)' + (have === want ? ', unchanged' : ''));
}
