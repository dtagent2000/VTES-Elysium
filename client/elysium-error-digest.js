#!/usr/bin/env node
'use strict';
/* ============================================================
   Elysium - elysium-error-digest.js (ops companion, v1.4, 9 Sep 2026)
   v1.4 (Johan: 'so I stop wondering whether it is players or Cloudflare'):
   crash rows thrown by FOREIGN scripts are folded into one line -- a
   src under /cdn-cgi/ is Cloudflare's own injected beacon/challenge/
   Rocket Loader crashing in the player's browser, and the bare
   'Script error.' message is cross-origin/extension noise with no
   detail by design. They still land in the log (jq finds them via
   .src); only the Discord headline changes: kinds shows them as
   'foreign', they never take a crash line, and one summary line
   says how many there were. The v2.6.64 client's crash notice uses
   the same two tests, so player and ops see one consistent rule.
   v1.3 = v1.1 + v1.2 merged. Lineage: v1.1 (8 Aug, built the same
   morning Johan asked "where are the logs?") renders REPORTS as
   inline detail blocks -- note + deck/counts + mode + the last ring
   lines, newest first, at most 3 per digest; crashes stay
   aggregated (that is where volume lives). The v1.1 delivery was
   never scp:ed -- the very next message in that chat became the
   B-63 dump idea and eclipsed it; recovered VERBATIM from the
   delivery transcript 11 Aug. v1.2 (B-63) contributes the
   [+snapshot] tag, here adapted onto the detail line: it says a
   full dump rides that row -- the payload itself is NEVER rendered
   inline (Discord is the headline, GET /client-errors.txt + jq is
   the detail).
   Reads DATA_DIR/elysium-errors.log (+ .1), aggregates the rows
   newer than the state file's watermark, and posts a compact
   digest to a Discord webhook. Telemetry nobody reads is
   decoration -- this closes the loop. Zero dependencies: node
   only (fs, path, https), no jq, no curl.

   Modes
     (default)        daily digest: post whatever is new; SILENT
                      when nothing is new (signal, not noise)
     --min N          threshold alert: post only if new >= N
                      (run this on a frequent timer with its OWN
                      --state file so it never eats the digest's)
     --heartbeat      post even when 0 new ("all quiet" proof of
                      life -- wire to a weekly timer if wanted)
     --dry-run        print instead of posting; NEVER writes
                      state (safe to run anytime, also the test)
     --mark-only      write the watermark = now and exit; use
                      once at install so the first digest does
                      not replay history

   Config
     --webhook URL    or env DISCORD_WEBHOOK (required to post)
     --data-dir P     where the log lives (default: script dir,
                      mirroring the server's own default)
     --state P        watermark file (default:
                      <data-dir>/elysium-digest-state.json)

   State is written ONLY after a successful post (or --mark-only),
   so a failed webhook naturally retries with the same rows on
   the next timer tick. Exit codes: 0 ok/silent, 1 post failed.
   ============================================================ */
const fs = require('fs'), path = require('path'), https = require('https');

const args = process.argv.slice(2);
function argOf(flag, dflt){ const i = args.indexOf(flag); return (i >= 0 && args[i+1] !== undefined) ? args[i+1] : dflt; }
const has = f => args.includes(f);

const DATA_DIR = path.resolve(argOf('--data-dir', __dirname));
const LOG   = path.join(DATA_DIR, 'elysium-errors.log');
const STATE = path.resolve(argOf('--state', path.join(DATA_DIR, 'elysium-digest-state.json')));
const HOOK  = argOf('--webhook', process.env.DISCORD_WEBHOOK || '');
const MIN   = parseInt(argOf('--min', '1'), 10) || 1;
const DRY   = has('--dry-run');
const BEAT  = has('--heartbeat');
const CAP_TOTAL = 4 * 1024 * 1024;                       /* mirror of the server's ERR_TOTAL_MAX */

function readState(){ try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (e) { return { lastTs: '' }; } }
function writeState(ts){ try { fs.writeFileSync(STATE, JSON.stringify({ lastTs: ts, wrote: new Date().toISOString() }) + '\n'); } catch (e) { console.error('state write failed: ' + e.message); } }

if (has('--mark-only')) { writeState(new Date().toISOString()); console.log('watermark set to now (' + STATE + ')'); process.exit(0); }

/* ---- gather ---- */
function readLines(p){ try { return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean); } catch (e) { return []; } }
const raw = readLines(LOG + '.1').concat(readLines(LOG));   /* rotated first keeps chronology */
let logBytes = 0; try { logBytes = fs.statSync(LOG).size; } catch (e) {}
try { logBytes += fs.statSync(LOG + '.1').size; } catch (e) {}

const state = readState();
const recs = [];
for (const line of raw) {
  let r = null; try { r = JSON.parse(line); } catch (e) { continue; }        /* tolerate torn tails */
  if (r && r.ts && (!state.lastTs || r.ts > state.lastTs)) recs.push(r);
}

if (!recs.length && !BEAT) { if (DRY) console.log('(dry-run) nothing new since ' + (state.lastTs || 'ever') + ' -- silent'); process.exit(0); }
if (recs.length < MIN && !BEAT) { if (DRY) console.log('(dry-run) ' + recs.length + ' new < --min ' + MIN + ' -- silent'); process.exit(0); }

/* ---- aggregate ---- */
function tally(map, key){ if (!key) return; map.set(key, (map.get(key) || 0) + 1); }
function top(map, n){ return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n); }
const kinds = new Map(), vers = new Map(), crashes = new Map();
let foreign = 0;   /* v1.4 */
function isForeign(r) {   /* v1.4: same two tests as the client's crashNotice() -- Cloudflare-injected source, or the detail-less cross-origin message */
  if (r.kind !== 'crash') return false;
  const src = String(r.src || ''), msg = String(r.msg || '');
  return /\/cdn-cgi\//.test(src) || msg === 'Script error.' || /^Uncaught Script error\.?$/.test(msg);
}
let newest = state.lastTs || '';
for (const r of recs) {
  const fr = isForeign(r); if (fr) foreign++;   /* v1.4 */
  tally(kinds, fr ? 'foreign' : (r.kind || '?'));
  if (r.kind !== 'server') tally(vers, r.ver || '?');   /* server rows carry srv-x.y.z -- not cache-relevant, keep the histogram about CLIENTS */
  if (r.kind !== 'report' && !fr) tally(crashes, String(r.msg || '(no message)').slice(0, 80));   /* v1.1: reports render as detail blocks below instead of a histogram line; v1.4: foreign rows never take a crash line */
  if (r.ts > newest) newest = r.ts;
}

/* ---- compose (Discord content cap 2000; stay well under) ---- */
const day = new Date().toISOString().slice(0, 10);
const L = [];
L.push('**Elysium error digest** — ' + day);
L.push(recs.length + ' new record(s) since ' + (state.lastTs ? state.lastTs.replace('T', ' ').slice(0, 16) : 'the beginning')
  + '  ·  log ' + Math.round(logBytes / 1024) + ' kB / ' + Math.round(CAP_TOTAL / 1024) + ' kB cap');
if (recs.length) {
  L.push('kinds: ' + top(kinds, 6).map(([k, n]) => k + ' ×' + n).join(' · '));
  L.push('versions: ' + top(vers, 4).map(([k, n]) => k + ' ×' + n).join(' · ')
    + (vers.size > 1 ? '  ← mixed = stale cached clients?' : ''));
  for (const [m, n] of top(crashes, 3)) L.push('· `' + m.replace(/`/g, "'") + '` ×' + n);
  if (foreign) L.push('· foreign-script noise ×' + foreign + ' — Cloudflare /cdn-cgi/ or cross-origin "Script error.", not Elysium (jq: .src)');   /* v1.4 */
  const reports = recs.filter(r => r.kind === 'report');
  for (const r of reports.slice(-3).reverse()) {                 /* v1.1: newest first, at most 3 detailed */
    const su = r.summary || {};
    const meta = [];
    if (su.deckName) meta.push('deck "' + String(su.deckName).slice(0, 40) + '"');
    if (su.libN !== undefined || su.cryptN !== undefined) meta.push((su.cryptN | 0) + 'c/' + (su.libN | 0) + 'l left');
    if (su.hand !== undefined) meta.push('hand ' + (su.hand | 0));
    if (su.mode || r.mode) meta.push(su.mode || r.mode);
    L.push('· report [' + (r.ver || '?') + '] "' + String(r.note || '').slice(0, 90).replace(/`/g, "'") + '"'
      + (meta.length ? ' — ' + meta.join(' · ') : '')
      + (r.dump ? '  [+snapshot]' : ''));                        /* v1.2/B-63 tag: a full dump rides this row -- pull route + jq for the payload */
    if (Array.isArray(r.ring) && r.ring.length)
      L.push('    ring: ' + r.ring.slice(-4).map(x => String((x && x.m !== undefined) ? x.m : x).slice(0, 110)).join(' | ').replace(/`/g, "'"));   /* v1.3: both ring shapes ({t,m} from v2.6.60+, bare strings before) */
  }
  if (reports.length > 3) L.push('· … and ' + (reports.length - 3) + ' more report(s) — pull the log for the rest');
} else {
  L.push('all quiet — heartbeat only.');
}
let msg = L.join('\n'); if (msg.length > 1900) msg = msg.slice(0, 1897) + '…';

/* ---- deliver ---- */
if (DRY) { console.log('---- dry-run message ----\n' + msg + '\n---- (state NOT written) ----'); process.exit(0); }
if (!HOOK) { console.error('no webhook: pass --webhook or set DISCORD_WEBHOOK'); process.exit(1); }

const u = new URL(HOOK);
const body = JSON.stringify({ content: msg });
const req = https.request({ method: 'POST', hostname: u.hostname, path: u.pathname + u.search,
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, timeout: 10000 },
  res => {
    res.resume();
    if (res.statusCode >= 200 && res.statusCode < 300) { writeState(newest || new Date().toISOString()); console.log('posted ' + recs.length + ' record(s); watermark ' + newest); }
    else { console.error('webhook answered ' + res.statusCode + ' -- state NOT advanced, will retry'); process.exitCode = 1; }
  });
req.on('error', e => { console.error('webhook failed: ' + e.message + ' -- state NOT advanced, will retry'); process.exitCode = 1; });
req.on('timeout', () => { req.destroy(new Error('timeout')); });
req.end(body);
