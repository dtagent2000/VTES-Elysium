#!/usr/bin/env node
'use strict';
/* ============================================================
   embed-help.js v1.0.0 (22 Sep 2026, client v2.6.127) — Help pages INTO the client
   ------------------------------------------------------------
   The client's Menu → Help → Bots / Local server pages are embedded in
   elysium-vtes-bord.html as <template> blocks, so a player needs no side
   document — and the same block is what "↗ Open in new tab" turns into a
   standalone page. This tool lifts the BODY of a START-HERE-styled page
   (nav + hero + main + footer, minus its <script>) into the client between
   the marker comments   <!-- @@HELP:<key> -->  …  <!-- @@/HELP:<key> -->
   and prefixes every id / #href (hb- for bots, hs- for server) so the page's
   anchors can never collide with the client's own ids.

   The CSS is NOT lifted: the page design lives once in the client's
   <style id="helpCss"> block (scoped under .helpDoc). If the bot project
   changes their stylesheet, mirror it there by hand.

   Usage
     node embed-help.js bots   START-HERE-BOTS.html          [client.html]
     node embed-help.js server help-local-server.html       [client.html]
     node embed-help.js --check bots START-HERE-BOTS.html   [client.html]   (exit 1 on drift, nothing written)

   Ownership: START-HERE-BOTS.html is the Elysium Bots project's release —
   we embed it verbatim and never edit its text here. Re-run this tool
   whenever they re-issue the file. help-local-server.html is ours.
   ============================================================ */
const fs = require('fs'), path = require('path');

const PREFIX = { bots: 'hb-', server: 'hs-' };

function liftBody(pageHtml){
  const m = /<body[^>]*>([\s\S]*)<\/body>/i.exec(pageHtml);
  if(!m) throw new Error('no <body> in the page');
  let body = m[1];
  body = body.replace(/<script[\s\S]*?<\/script>/gi, '');   // the page's own nav/hash script: the client's help modal supplies its own
  return body.trim();
}
function prefixIds(body, pre){
  body = body.replace(/\sid="([^"]+)"/g, (s, id) => ' id="' + pre + id + '"');
  body = body.replace(/\shref="#([^"]+)"/g, (s, id) => ' href="#' + pre + id + '"');
  body = body.replace(/url\(#([^)]+)\)/g, (s, id) => 'url(#' + pre + id + ')');   // SVG marker refs (the hero's arrow)
  return body;
}
function embedded(clientHtml, key){
  const open = '<!-- @@HELP:' + key + ' -->', close = '<!-- @@/HELP:' + key + ' -->';
  const i = clientHtml.indexOf(open), j = clientHtml.indexOf(close);
  if(i < 0 || j < 0 || j < i) throw new Error('markers for "' + key + '" not found in the client (need ' + open + ' … ' + close + ')');
  if(clientHtml.indexOf(open, i + 1) >= 0) throw new Error('marker ' + open + ' appears twice');
  return { i: i + open.length, j, open, close, body: clientHtml.slice(i + open.length, j).trim() };
}
function render(key, pagePath){
  if(!PREFIX[key]) throw new Error('key must be bots | server');
  return prefixIds(liftBody(fs.readFileSync(pagePath, 'utf8')), PREFIX[key]);
}

function main(argv){
  const check = argv[0] === '--check'; if(check) argv = argv.slice(1);
  const [key, pagePath, clientArg] = argv;
  if(!key || !pagePath){ console.error('usage: node embed-help.js [--check] <bots|server> <page.html> [client.html]'); return 2; }
  const clientPath = clientArg || path.resolve(__dirname, 'elysium-vtes-bord.html');
  const client = fs.readFileSync(clientPath, 'utf8');
  const want = render(key, pagePath);
  const have = embedded(client, key);
  if(have.body === want){ console.log('embed-help: ' + key + ' is up to date (' + want.length + ' chars)'); return 0; }
  if(check){ console.error('embed-help: DRIFT -- the client\'s embedded "' + key + '" page differs from ' + path.basename(pagePath) + ' (' + have.body.length + ' vs ' + want.length + ' chars). Re-run without --check to embed.'); return 1; }
  const out = client.slice(0, have.i) + '\n' + want + '\n' + client.slice(have.j);
  fs.writeFileSync(clientPath, out);
  console.log('embed-help: embedded ' + key + ' from ' + path.basename(pagePath) + ' into ' + path.basename(clientPath) + ' (' + want.length + ' chars)');
  return 0;
}

module.exports = { liftBody, prefixIds, embedded, render, PREFIX };
if(require.main === module) process.exit(main(process.argv.slice(2)));
