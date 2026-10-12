#!/usr/bin/env node
'use strict';
/* ============================================================
   Elysium - build step (B1)
   Assembles the single-file client from elysium-src/:
     shell.html   - the HTML/CSS shell with a /*@@ELYSIUM_APP_JS@@*\/ placeholder
     manifest.txt - ordered list of JS fragment filenames (one per line)
     <fragments>  - plain .js pieces that share ONE scope (no import/export)

   The fragments are joined in manifest order and dropped into the shell.
   No transpilation, no npm, no bundler - faithful to "open the .html and it runs".
   The output is byte-identical to a hand-edited single file (verify with cmp).

   Usage:  node elysium-build.js            -> writes elysium-vtes-bord.html
           node elysium-build.js out.html   -> writes out.html
   ============================================================ */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'elysium-src');
const OUT = process.argv[2] || path.join(ROOT, 'elysium-vtes-bord.html');
const PLACEHOLDER = '/*@@ELYSIUM_APP_JS@@*/';

function die(msg){ console.error('build: ' + msg); process.exit(1); }

let shell;
try { shell = fs.readFileSync(path.join(SRC, 'shell.html'), 'utf8'); }
catch (e) { die('cannot read elysium-src/shell.html (' + e.message + ')'); }

let manifest;
try {
  manifest = fs.readFileSync(path.join(SRC, 'manifest.txt'), 'utf8')
    .split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
} catch (e) { die('cannot read elysium-src/manifest.txt (' + e.message + ')'); }
if (!manifest.length) die('manifest.txt is empty');

const pieces = manifest.map(name => {
  const p = path.join(SRC, name);
  if (!fs.existsSync(p)) die('manifest lists "' + name + '" but elysium-src/' + name + ' is missing');
  return fs.readFileSync(p, 'utf8');
});
const js = pieces.join('');                       // shared scope: plain concatenation, no separators

if (shell.indexOf(PLACEHOLDER) < 0) die('shell.html is missing the ' + PLACEHOLDER + ' placeholder');
const out = shell.replace(PLACEHOLDER, () => js);  // function replacer => no $-substitution surprises in the JS

fs.writeFileSync(OUT, out);
console.log('built ' + path.basename(OUT) + ' from ' + manifest.length + ' fragments (' + out.length + ' bytes): ' + manifest.join(' + '));
