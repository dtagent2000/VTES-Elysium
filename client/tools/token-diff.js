#!/usr/bin/env node
// tools/token-diff.js OLD NEW (client v2.6.190, 27 Nov 2026) -- prove that two versions of a JS file, or of an html page
// with inline scripts and styles, differ only in comments: every <script> is compared token by token (acorn), every
// <style> with its /* */ comments removed and its whitespace collapsed, the markup with its <!-- --> comments removed and
// its whitespace collapsed. Prints each difference (a token's kind and value on both sides) and exits 0; the caller
// reads the list (a comments-only release shows one difference per file: the VERSION string). acorn is not in the
// repository: `npm install --prefix /tmp/acorn acorn@8` and `ACORN=/tmp/acorn/node_modules/acorn node tools/token-diff.js
// OLD NEW` (SKILLS, "Prove a comments-only release").
'use strict';
const fs = require('fs');
const acorn = require(process.env.ACORN || 'acorn');
const [, , A, B] = process.argv;
const a = fs.readFileSync(A, 'utf8'), b = fs.readFileSync(B, 'utf8');

function jsTokens(src) {
  const out = [];
  for (const t of acorn.tokenizer(src, { ecmaVersion: 'latest', allowHashBang: true, allowReturnOutsideFunction: true,
                                         allowAwaitOutsideFunction: true, sourceType: 'script' })) {
    out.push((t.type.label) + '\u0001' + (t.value === undefined ? '' : String(t.value)));
  }
  return out;
}
function segments(html) {   // [{kind, text}] in document order
  const segs = []; const re = /<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>/gi; let k = 0, m;
  while ((m = re.exec(html))) {
    segs.push({ kind: 'markup', text: html.slice(k, m.index) + '<' + m[1] + m[2] + '>' });
    segs.push({ kind: m[1].toLowerCase(), attrs: m[2], text: m[3] }); k = re.lastIndex;
  }
  segs.push({ kind: 'markup', text: html.slice(k) });
  return segs;
}
const squash = s => s.replace(/\s+/g, ' ').trim();
function norm(seg) {
  if (seg.kind === 'script') {
    if (/type\s*=\s*["']?(application\/json|application\/ld\+json)/i.test(seg.attrs || '')) return { kind: 'json', toks: [squash(seg.text)] };
    try { return { kind: 'js', toks: jsTokens(seg.text) }; }
    catch (e) { return { kind: 'js?', toks: [squash(seg.text)], err: e.message }; }
  }
  if (seg.kind === 'style') return { kind: 'css', toks: [squash(seg.text.replace(/\/\*[\s\S]*?\*\//g, ''))] };
  return { kind: 'markup', toks: [squash(seg.text.replace(/<!--[\s\S]*?-->/g, ''))] };
}
function diffToks(x, y, label, diffs) {
  if (x.length !== y.length) diffs.push(label + ': token count ' + x.length + ' vs ' + y.length);
  const n = Math.min(x.length, y.length);
  for (let i = 0; i < n; i++) if (x[i] !== y[i]) diffs.push(label + ' #' + i + ': ' + JSON.stringify(x[i].slice(0, 160)) + ' -> ' + JSON.stringify(y[i].slice(0, 160)));
}
const diffs = [];
if (/\.html?$/i.test(A)) {
  const sa = segments(a), sb = segments(b);
  if (sa.length !== sb.length) diffs.push('segment count ' + sa.length + ' vs ' + sb.length);
  let js = 0, css = 0, mk = 0, errs = 0;
  for (let i = 0; i < Math.min(sa.length, sb.length); i++) {
    const x = norm(sa[i]), y = norm(sb[i]);
    if (x.err || y.err) { errs++; }
    if (x.kind === 'js') js++; else if (x.kind === 'css') css++; else if (x.kind === 'markup') mk++;
    diffToks(x.toks, y.toks, 'segment ' + i + ' (' + x.kind + ')', diffs);
  }
  console.log('segments: ' + sa.length + ' (' + js + ' scripts tokenized, ' + css + ' styles, ' + mk + ' markup runs, ' + errs + ' not tokenizable)');
} else {
  diffToks(jsTokens(a), jsTokens(b), 'js', diffs);
}
console.log(diffs.length ? diffs.join('\n') : 'IDENTICAL apart from comments and whitespace');
console.log('differences: ' + diffs.length);
