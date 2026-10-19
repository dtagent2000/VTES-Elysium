#!/usr/bin/env node
'use strict';
/* elysium-bot-sim.js v1.0.0 (19 Oct 2026) -- THE SIM TABLE: the headless hotseat table under a VIRTUAL CLOCK.

   Why: the arena waits, it does not compute. A 4-bot arena match took 212 s of wall clock and ~3 s of CPU (19 Oct, srv-2.6.46); the rest
   is clocks running out (askSecs, grace windows, pacing). The hotseat table (elysium-bot-hotseat.js: the client's real hotBridge lifted
   verbatim + real Bot instances, ONE process, a seeded deal) has no network at all, so every wait in it is a timer. Here every match runs in
   its own process with setTimeout / clearTimeout / setInterval / clearInterval / Date replaced by a virtual clock: when the process has
   nothing left to do but wait, the clock jumps to the next timer. A match takes about a second instead of minutes, and the same spec gives
   the same trace byte for byte (fixed epoch, seeded deal), so a match can be replayed and two versions compared decision by decision.

   Seating (Johan, 19 Oct: "we should test all possible seatings, since it affects tactical choices"):
     --seatings all     every permutation of the deck list (default): 4 decks = 24, 5 decks = 120 -- every cyclic order x every starting seat
     --seatings random  --matches N seeded random orders (from --seed)
     --seatings fixed   the deck list as given
   --seeds K plays every seating with K deals (deal seeds S0 .. S0+K-1, S0 = --seed, default 1; the same deal seeds in every seating).
   Seat 1 takes the first turn; a seat's prey is the next seat (VTES: to the left), its predator the previous one.

   Profile: --profile client (default) = how the client spawns a hotseat bot (paceMs 3100, askSecs 20, deckName) -- what an offline player
   sits at; --profile arena = the arena's settings (paceMs 0, askSecs 3, no deckName) for comparisons with older arena series. --pace and
   --ask-secs override either. Under the virtual clock neither costs wall time.

   Knobs: --knob k=v (every seat) · --knob DECK:k=v (that deck wherever it sits) · --knob N:k=v (seat N, the arena's form). Personas:
   --personas expert (all) or one per deck in --decks order (the persona follows its deck through the seatings).

   Output (--trace DIR, default ./sim-<time>): one match-NNNN.jsonl per match in the arena's envelope ({t, match, bot, type, data}; t is
   virtual ms; a final `result` row with winner / vp / oustOrder / reason / rounds / bots) so gen-match-dossier, gen-trace-harvest,
   gen-batch-review, ana-inv and the other readers work unchanged; design.json; summary.json + SUMMARY.md (per deck, per seat position,
   per prey and predator). --resume skips matches whose file has a result row. --summarize DIR re-reads a directory.

   VP and winner: the arena's computeVp / deriveWinner (VEKN: 1 VP per prey ousted, +1 to the sole survivor, 1/2 to time-limit survivors,
   winner = most VP). The game ENDS when one Methuselah is left: an oust after that (the winner burning itself out on its own last action)
   is not counted -- it is reported as a post-game oust, a finding in itself.

   Not a timing gate: zero latency and ideal ordering can hide a race a real table shows. The real-clock gates stay (canary, hotseat gate,
   the arena on a real server); --real runs this same table on the real clock for an equivalence check.

   Usage: node elysium-bot-sim.js --decks malkavian,tremere,nosferatu,ventrue [--seatings all|random|fixed] [--seeds K] [--seed S0]
            [--matches N] [--profile client|arena] [--pace MS] [--ask-secs S] [--start-pool 30] [--rounds 50] [--personas ...]
            [--knob ...] [--arm asis|tally|full] [--client FILE] [--workers W] [--trace DIR] [--resume] [--real] [--timeout SECS] [--list]
          node elysium-bot-sim.js --summarize DIR
*/
const path = require('path'), fs = require('fs');
const SIM_VERSION = '1.0.0';
const EPOCH = Date.UTC(2026, 0, 1, 12, 0, 0);   // the virtual clock's start: fixed, so generated ids and every timestamp repeat

/* ---------------- the virtual clock (child process only; installed BEFORE the bot is required) ---------------- */
function installClock(epoch){
  const realSetImmediate = setImmediate, realSetTimeout = setTimeout, RealDate = Date;
  let now = epoch, seq = 0, fired = 0, jumped = 0, stop = false, error = null;
  const q = new Map();
  const handle = id => ({ id, ref(){ return this; }, unref(){ return this; }, hasRef(){ return true; },
    refresh(){ const t = q.get(id); if(t) t.when = now + t.ms; return this; }, [Symbol.toPrimitive](){ return id; } });
  global.setTimeout = (fn, ms, ...args) => { const id = ++seq, d = Math.max(0, +ms || 0); q.set(id, { id, when: now + d, ms: d, fn, args }); return handle(id); };
  global.setInterval = (fn, ms, ...args) => { const id = ++seq, d = Math.max(1, +ms || 1); q.set(id, { id, when: now + d, ms: d, fn, args, every: d }); return handle(id); };
  global.clearTimeout = global.clearInterval = t => { if(t == null) return; q.delete(typeof t === 'object' ? t.id : +t); };
  class VDate extends RealDate { constructor(...a){ if(a.length) super(...a); else super(now); } static now(){ return now; } }
  global.Date = VDate;
  const settle = () => new Promise(r => realSetImmediate(r));   // every microtask drains before an immediate runs
  (async () => {
    while(!stop){
      await settle(); await settle();
      if(stop) break;
      let next = null;
      for(const t of q.values()) if(!next || t.when < next.when || (t.when === next.when && t.id < next.id)) next = t;
      if(!next){ await new Promise(r => realSetTimeout(r, 2)); continue; }   // nothing scheduled: real I/O may still be pending
      if(next.when > now){ jumped += next.when - now; now = next.when; }
      if(next.every) next.when = now + next.every; else q.delete(next.id);
      fired++;
      try { next.fn(...(next.args || [])); }
      catch(e){ error = error || (e && e.stack || String(e)); }   // a real timer that throws crashes the process: the match is reported as a crash, never swallowed
    }
  })();
  return { stop(){ stop = true; }, stats(){ return { timersFired: fired, jumpedMs: jumped, pending: q.size }; }, error: () => error, realNow: () => RealDate.now() };
}

/* ---------------- one match (child) ---------------- */
async function runOne(spec){
  const clock = spec.real ? null : installClock(EPOCH);
  const wall0 = clock ? clock.realNow() : Date.now(), cpu0 = process.cpuUsage();
  const { runTable } = require(path.join(__dirname, 'elysium-bot-hotseat.js'));
  const { computeVp, deriveWinner } = require(path.join(__dirname, 'elysium-bot-arena.js'));
  const rows = [];
  const r = await runTable({ decks: spec.order, seed: spec.seed, rounds: spec.rounds, startPool: spec.startPool, askSecs: spec.askSecs, paceMs: spec.paceMs,
    deckname: spec.deckname, personas: spec.personas, knobs: spec.knobs, seatKnobs: spec.seatKnobs, arm: spec.arm, client: spec.client, stuckMs: spec.stuckMs,
    onEvent: e => rows.push({ t: Date.now(), match: spec.idx, round: e.round, bot: e.who, type: e.type, data: e.d }) });
  if(clock) clock.stop();
  const names = r.names, n = names.length;
  const ousted = []; rows.forEach(x => { if(x.type === 'ousted' && !ousted.includes(x.bot)) ousted.push(x.bot); });
  names.forEach(nm => { if(!r.alive.includes(nm) && !ousted.includes(nm)) ousted.push(nm); });   // out without an `ousted` emit: last, order unknown
  const gameOusts = ousted.slice(0, n - 1), postGame = ousted.slice(n - 1);
  const reason = r.stuck ? 'stuck' : (gameOusts.length >= n - 1 ? 'last-standing' : 'turn-cap');
  const vp = computeVp(names, gameOusts, reason), winner = r.stuck ? null : deriveWinner(vp, gameOusts, names);
  const deckOf = {}; names.forEach((nm, i) => deckOf[nm] = spec.order[i]);
  const cpu = process.cpuUsage(cpu0);
  const result = {
    match: spec.idx, sim: SIM_VERSION, bot: r.bot, client: r.client, arm: r.arm, clock: clock ? 'virtual' : 'real', seed: spec.seed, seating: spec.tag,
    winner, winnerDeck: winner ? deckOf[winner] : null, reason, vp, oustOrder: gameOusts, postGameOusts: postGame,
    rounds: r.rounds, tableSecs: r.secs, stuck: r.stuck, pools: r.pools, droppedVerbs: r.droppedVerbs, counts: r.counts,
    invFlags: rows.filter(x => x.type === 'inv-flag').length,
    bots: names.map((nm, i) => ({ name: nm, seat: i + 1, deck: spec.order[i], persona: r.personas[i], knobs: Object.assign({}, spec.knobs || {}, (spec.seatKnobs || {})[i + 1] || {}) })),
    wallMs: (clock ? clock.realNow() : Date.now()) - wall0, cpuMs: Math.round((cpu.user + cpu.system) / 1000), clockStats: clock ? clock.stats() : null
  };
  const err = clock && clock.error();
  if(err){ result.crash = true; result.err = String(err).slice(0, 1500); }
  if(spec.dir){
    rows.push({ t: Date.now(), match: spec.idx, type: 'result', data: result });
    fs.writeFileSync(path.join(spec.dir, matchFile(spec.idx)), rows.map(x => JSON.stringify(x)).join('\n') + '\n');
  }
  return result;
}
const matchFile = idx => 'match-' + String(idx).padStart(4, '0') + '.jsonl';

/* ---------------- the design ---------------- */
function permutations(a){
  if(a.length <= 1) return [a.slice()];
  const out = [], seen = new Set();
  a.forEach((x, i) => permutations(a.slice(0, i).concat(a.slice(i + 1))).forEach(p => { const q = [x].concat(p), k = q.join(','); if(!seen.has(k)){ seen.add(k); out.push(q); } }));
  return out;
}
function rng(seed){ let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function shuffled(a, r){ const b = a.slice(); for(let i = b.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

function parseArgs(argv){
  const o = { decks: ['malkavian', 'tremere', 'nosferatu', 'ventrue'], seatings: 'all', seeds: 1, seed: 1, matches: 24, profile: 'client', pace: null, askSecs: null,
    startPool: 30, rounds: 50, personas: ['expert'], knobs: [], arm: 'asis', client: path.join(__dirname, 'elysium-vtes-bord.html'), workers: null, trace: null,
    resume: false, real: false, timeout: null, list: false, summarize: null, stuckSecs: 1800 };
  for(let i = 0; i < argv.length; i++){
    const a = argv[i], next = () => argv[++i];
    if(a === '--decks') o.decks = next().split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    else if(a === '--seatings') o.seatings = next();
    else if(a === '--seeds') o.seeds = Math.max(1, parseInt(next(), 10) || 1);
    else if(a === '--seed') o.seed = parseInt(next(), 10) >>> 0;
    else if(a === '--matches') o.matches = Math.max(1, parseInt(next(), 10) || 1);
    else if(a === '--profile') o.profile = next();
    else if(a === '--pace') o.pace = Math.max(0, parseInt(next(), 10) || 0);
    else if(a === '--ask-secs') o.askSecs = Math.max(1, parseFloat(next()) || 3);
    else if(a === '--start-pool') o.startPool = Math.max(3, parseInt(next(), 10) || 30);
    else if(a === '--rounds') o.rounds = Math.max(1, parseInt(next(), 10) || 50);
    else if(a === '--personas') o.personas = next().split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    else if(a === '--knob') o.knobs.push(...next().split(',').map(s => s.trim()).filter(Boolean));
    else if(a === '--arm') o.arm = next();
    else if(a === '--client') o.client = path.resolve(next());
    else if(a === '--workers') o.workers = Math.max(1, parseInt(next(), 10) || 1);
    else if(a === '--trace') o.trace = path.resolve(next());
    else if(a === '--resume') o.resume = true;
    else if(a === '--real') o.real = true;
    else if(a === '--timeout') o.timeout = Math.max(5, parseInt(next(), 10) || 120);
    else if(a === '--stuck-secs') o.stuckSecs = Math.max(30, parseInt(next(), 10) || 1800);
    else if(a === '--list') o.list = true;
    else if(a === '--summarize') o.summarize = path.resolve(next());
    else if(a === '--help' || a === '-h'){ console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); process.exit(0); }
    else { console.error('sim: unknown argument ' + a); process.exit(2); }
  }
  if(!['client', 'arena'].includes(o.profile)){ console.error('sim: --profile is client or arena'); process.exit(2); }
  if(!['all', 'random', 'fixed'].includes(o.seatings)){ console.error('sim: --seatings is all, random or fixed'); process.exit(2); }
  const P = o.profile === 'client' ? { paceMs: 3100, askSecs: 20, deckname: true } : { paceMs: 0, askSecs: 3, deckname: false };   // client: the hotseat spawn in elysium-vtes-bord.html (v2.6.71 / Johan's live calibration); arena: elysium-bot-arena.js defaults
  o.paceMs = o.pace != null ? o.pace : P.paceMs; o.askSecsEff = o.askSecs != null ? o.askSecs : P.askSecs; o.deckname = P.deckname;
  if(o.workers == null) o.workers = o.real ? 4 : Math.max(1, require('os').cpus().length);
  if(o.timeout == null) o.timeout = o.real ? 3600 : 180;
  return o;
}

function parseKnobs(list, decks){   // -> { global: {k: v}, byDeck: {deck: {k: v}}, bySeat: {N: {k: v}} }
  const K = { global: {}, byDeck: {}, bySeat: {} };
  for(const ent of list){
    const m = ent.match(/^(?:([A-Za-z0-9_-]+):)?([A-Za-z]+)=(-?[\d.]+)$/);
    if(!m){ console.error('sim: knob ignored (bad form): ' + ent); continue; }
    const v = parseFloat(m[3]);
    if(!m[1]) K.global[m[2]] = v;
    else if(/^\d+$/.test(m[1])) (K.bySeat[+m[1]] = K.bySeat[+m[1]] || {})[m[2]] = v;
    else if(decks.includes(m[1].toLowerCase())) (K.byDeck[m[1].toLowerCase()] = K.byDeck[m[1].toLowerCase()] || {})[m[2]] = v;
    else console.error('sim: knob ignored (no deck or seat ' + m[1] + ' in this design): ' + ent);
  }
  return K;
}
function warnUnknownKnobs(K){   // the bot ignores a knob it does not read -- say so instead of measuring nothing (CLAUDE.md: prove a knob fires)
  try {
    const { Bot } = require(path.join(__dirname, 'elysium-bot.js'));
    const probe = new Bot({ log: () => {}, cardfxData: { v: 1, lib: {}, crypt: {} } });
    const src = fs.readFileSync(path.join(__dirname, 'elysium-bot.js'), 'utf8');
    const names = new Set([...Object.keys(K.global), ...Object.values(K.byDeck).flatMap(Object.keys), ...Object.values(K.bySeat).flatMap(Object.keys)]);
    for(const k of names) if(!(k in probe.o) && !new RegExp('\\bo\\.' + k + '\\b').test(src)) console.error('sim: WARNING knob ' + k + ' is neither a bot default nor read as this.o.' + k + ' -- a typo measures nothing');
  } catch(e){ /* the check is advice only */ }
}

function buildDesign(o){
  let orders;
  if(o.seatings === 'all') orders = permutations(o.decks);
  else if(o.seatings === 'fixed') orders = [o.decks.slice()];
  else { const r = rng(Math.imul(o.seed || 1, 2654435761) >>> 0); orders = Array.from({ length: o.matches }, () => shuffled(o.decks, r)); }
  const personaOf = {}; o.decks.forEach((d, i) => personaOf[d] = o.personas.length === 1 ? o.personas[0] : (o.personas[i] || 'expert'));
  const K = parseKnobs(o.knobs, o.decks);
  const specs = []; let idx = 0;
  for(const order of orders){
    for(let k = 0; k < o.seeds; k++){
      idx++;
      const seatKnobs = {};
      order.forEach((d, i) => { const s = i + 1, m = Object.assign({}, K.byDeck[d] || {}, K.bySeat[s] || {}); if(Object.keys(m).length) seatKnobs[s] = m; });
      specs.push({ idx, order, tag: order.join('>'), seed: o.seed + k, personas: order.map(d => personaOf[d]), knobs: K.global, seatKnobs,
        rounds: o.rounds, startPool: o.startPool, askSecs: o.askSecsEff, paceMs: o.paceMs, deckname: o.deckname, arm: o.arm, client: o.client,
        stuckMs: o.stuckSecs * 1000, real: o.real, dir: o.trace });
    }
  }
  return { specs, K };
}

/* ---------------- the pool (parent) ---------------- */
function runChild(spec, timeoutSecs){
  const { spawn } = require('child_process');
  return new Promise(resolve => {
    const ch = spawn(process.execPath, [__filename, '--one', JSON.stringify(spec)], { cwd: __dirname, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    ch.stdout.on('data', d => { out += d; }); ch.stderr.on('data', d => { err += d; if(err.length > 20000) err = err.slice(-10000); });
    const to = setTimeout(() => { try { ch.kill('SIGKILL'); } catch(e){} }, timeoutSecs * 1000);
    ch.on('close', (code, sig) => {
      clearTimeout(to);
      const line = out.split('\n').filter(l => l.startsWith('SIMRESULT ')).pop();
      let r = null; try { r = line ? JSON.parse(line.slice(10)) : null; } catch(e){ r = null; }
      if(!r) r = { match: spec.idx, seating: spec.tag, seed: spec.seed, crash: true, code, signal: sig || null, err: (err || '').slice(-1500) };
      resolve(r);
    });
  });
}
function readResult(file){
  try { const lines = fs.readFileSync(file, 'utf8').trim().split('\n'); const last = JSON.parse(lines[lines.length - 1]); return last.type === 'result' ? last.data : null; } catch(e){ return null; }
}
async function runPool(specs, o){
  const results = new Array(specs.length); let next = 0, done = 0; const t0 = Date.now(); let lastLog = 0;
  const one = async () => {
    while(next < specs.length){
      const i = next++, sp = specs[i];
      if(o.resume && o.trace){ const prev = readResult(path.join(o.trace, matchFile(sp.idx))); if(prev){ results[i] = prev; done++; continue; } }
      results[i] = await runChild(sp, o.timeout); done++;
      if(Date.now() - lastLog > 5000 || done === specs.length){ lastLog = Date.now(); process.stderr.write('sim: ' + done + '/' + specs.length + ' matches · ' + Math.round((Date.now() - t0) / 1000) + ' s\n'); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(o.workers, specs.length) }, one));
  return { results, wallSecs: (Date.now() - t0) / 1000 };
}

/* ---------------- the summary ---------------- */
function summarize(results, meta){
  const ok = results.filter(r => r && !r.crash && r.reason !== 'stuck');
  const decks = [...new Set(ok.flatMap(r => r.bots.map(b => b.deck)))].sort();
  const D = {}; decks.forEach(d => D[d] = { seats: 0, wins: 0, vp: [], firstOut: 0, survived: 0, bySeat: {}, vsPrey: {}, vsPred: {}, postGame: 0 });
  const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const se = a => { if(a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) * (y - m), 0) / (a.length - 1) / a.length); };
  const push = (o, k, v) => { (o[k] = o[k] || []).push(v); };
  for(const r of ok){
    const n = r.bots.length;
    r.bots.forEach((b, i) => {
      const d = D[b.deck], v = (r.vp || {})[b.name] || 0;
      d.seats++; d.vp.push(v); if(r.winner === b.name) d.wins++;
      if((r.oustOrder || [])[0] === b.name) d.firstOut++;
      if(!(r.oustOrder || []).includes(b.name)) d.survived++;
      if((r.postGameOusts || []).includes(b.name)) d.postGame++;
      push(d.bySeat, i + 1, v);
      push(d.vsPrey, r.bots[(i + 1) % n].deck, v);
      push(d.vsPred, r.bots[(i - 1 + n) % n].deck, v);
    });
  }
  const reasons = {}; results.forEach(r => { const k = !r ? 'missing' : (r.crash ? 'crash' : r.reason); reasons[k] = (reasons[k] || 0) + 1; });
  const out = { meta, matches: results.length, counted: ok.length, reasons,
    postGameOustMatches: ok.filter(r => (r.postGameOusts || []).length).map(r => ({ match: r.match, seating: r.seating, seed: r.seed, who: r.postGameOusts })),
    problems: results.filter(r => !r || r.crash || r.reason === 'stuck').map(r => r ? { match: r.match, seating: r.seating, seed: r.seed, crash: !!r.crash, stuck: r.stuck || null, err: r.err ? String(r.err).split('\n')[0] : null } : null),
    invFlags: ok.reduce((x, r) => x + (r.invFlags || 0), 0),
    rounds: +mean(ok.map(r => r.rounds || 0)).toFixed(2), tableSecs: Math.round(ok.reduce((x, r) => x + (r.tableSecs || 0), 0)),
    decks: {} };
  decks.forEach(d => { const x = D[d], f = a => +mean(a).toFixed(2);
    out.decks[d] = { seats: x.seats, wins: x.wins, vp: +x.vp.reduce((a, b) => a + b, 0).toFixed(1), vpPerMatch: f(x.vp), vpSE: +se(x.vp).toFixed(2), winRate: +(x.wins / Math.max(1, x.seats)).toFixed(3),
      firstOut: x.firstOut, survived: x.survived, postGameOusts: x.postGame,
      vpBySeat: Object.fromEntries(Object.entries(x.bySeat).map(([k, a]) => [k, f(a)])),
      vpVsPrey: Object.fromEntries(Object.entries(x.vsPrey).map(([k, a]) => [k, f(a)])),
      vpVsPred: Object.fromEntries(Object.entries(x.vsPred).map(([k, a]) => [k, f(a)])) }; });
  return out;
}
function summaryMd(S){
  const L = [], decks = Object.keys(S.decks), seats = [...new Set(decks.flatMap(d => Object.keys(S.decks[d].vpBySeat)))].sort((a, b) => a - b);
  const m = S.meta || {};
  L.push('# Sim series — ' + (m.label || ''), '');
  L.push('bot v' + (m.bot || '?') + ' · client v' + (m.client || '?') + ' · sim v' + SIM_VERSION + ' · ' + (m.clock || '?') + ' clock · profile ' + (m.profile || '?') + ' (pace ' + m.paceMs + ' ms, askSecs ' + m.askSecs + ')' +
    ' · seatings ' + (m.seatings || '?') + ' × ' + (m.seeds || 1) + ' seed(s) from ' + (m.seed != null ? m.seed : '?') + ' · start pool ' + (m.startPool || '?') + (m.knobs && m.knobs.length ? ' · knobs ' + m.knobs.join(' ') : ''), '');
  L.push(S.matches + ' matches (' + Object.entries(S.reasons).map(([k, v]) => k + ' ' + v).join(', ') + ') · ' + S.rounds + ' rounds/match · ' + S.tableSecs + ' s of table time' +
    (m.wallSecs != null ? ' in ' + m.wallSecs.toFixed(1) + ' s of wall clock' : '') + ' · invariant flags ' + S.invFlags, '');
  L.push('| deck | seats | wins | win rate | VP/match (± SE) | first out | survived | post-game ousts |', '|---|---:|---:|---:|---:|---:|---:|---:|');
  decks.sort((a, b) => S.decks[b].vpPerMatch - S.decks[a].vpPerMatch).forEach(d => { const x = S.decks[d];
    L.push('| ' + d + ' | ' + x.seats + ' | ' + x.wins + ' | ' + (100 * x.winRate).toFixed(0) + '% | ' + x.vpPerMatch.toFixed(2) + ' ± ' + x.vpSE.toFixed(2) + ' | ' + x.firstOut + ' | ' + x.survived + ' | ' + x.postGameOusts + ' |'); });
  L.push('', '**VP/match by seat** (seat 1 takes the first turn)', '', '| deck | ' + seats.map(s => 'seat ' + s).join(' | ') + ' |', '|---|' + seats.map(() => '---:').join('|') + '|');
  decks.forEach(d => L.push('| ' + d + ' | ' + seats.map(s => (S.decks[d].vpBySeat[s] != null ? S.decks[d].vpBySeat[s].toFixed(2) : '—')).join(' | ') + ' |'));
  L.push('', '**VP/match by prey** (row = the deck, column = the deck it preys on)', '', '| deck | ' + decks.map(d => d).join(' | ') + ' |', '|---|' + decks.map(() => '---:').join('|') + '|');
  decks.forEach(d => L.push('| ' + d + ' | ' + decks.map(p => (S.decks[d].vpVsPrey[p] != null ? S.decks[d].vpVsPrey[p].toFixed(2) : '—')).join(' | ') + ' |'));
  L.push('', '**VP/match by predator** (row = the deck, column = the deck that preys on it)', '', '| deck | ' + decks.map(d => d).join(' | ') + ' |', '|---|' + decks.map(() => '---:').join('|') + '|');
  decks.forEach(d => L.push('| ' + d + ' | ' + decks.map(p => (S.decks[d].vpVsPred[p] != null ? S.decks[d].vpVsPred[p].toFixed(2) : '—')).join(' | ') + ' |'));
  if(S.postGameOustMatches.length) L.push('', '**Post-game ousts** (an oust after one Methuselah was left — not counted): ' + S.postGameOustMatches.map(x => '#' + x.match + ' ' + x.who.join('+')).join(', '));
  if(S.problems.length) L.push('', '**Problems** (not counted): ' + S.problems.map(x => x ? '#' + x.match + (x.crash ? ' CRASH ' + (x.err || '') : ' STUCK r' + (x.stuck && x.stuck.round) + 's' + (x.stuck && x.stuck.seat)) : 'missing').join('; '));
  L.push('');
  return L.join('\n');
}

/* ---------------- main ---------------- */
if(require.main === module){
  if(process.argv[2] === '--one'){
    let spec; try { spec = JSON.parse(process.argv[3]); } catch(e){ console.error('sim: bad spec'); process.exit(2); }
    runOne(spec).then(r => { process.stdout.write('SIMRESULT ' + JSON.stringify(r) + '\n'); process.exit(r.crash ? 1 : 0); })
                .catch(e => { process.stderr.write('SIM MATCH FAILED: ' + (e && e.stack || e) + '\n'); process.exit(1); });
  } else {
    const o = parseArgs(process.argv.slice(2));
    if(o.summarize){
      const files = fs.readdirSync(o.summarize).filter(f => /^match-.*\.jsonl$/.test(f)).sort();
      const results = files.map(f => readResult(path.join(o.summarize, f)));
      let meta = {}; try { meta = JSON.parse(fs.readFileSync(path.join(o.summarize, 'design.json'), 'utf8')).meta || {}; } catch(e){}
      const S = summarize(results, meta); fs.writeFileSync(path.join(o.summarize, 'summary.json'), JSON.stringify(S, null, 1)); const md = summaryMd(S); fs.writeFileSync(path.join(o.summarize, 'SUMMARY.md'), md); console.log(md);
      process.exit(0);
    }
    const { specs, K } = buildDesign(o);
    if(o.list){ specs.forEach(s => console.log('#' + s.idx + ' seed ' + s.seed + ' ' + s.tag + (Object.keys(s.seatKnobs).length ? ' knobs ' + JSON.stringify(s.seatKnobs) : ''))); console.log(specs.length + ' matches'); process.exit(0); }
    if(!fs.existsSync(o.client)){ console.error('sim: the client file is missing: ' + o.client + ' (the hotseat table lifts its hotBridge)'); process.exit(2); }
    warnUnknownKnobs(K);
    if(!o.trace) o.trace = path.resolve('sim-' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15));
    fs.mkdirSync(o.trace, { recursive: true }); specs.forEach(s => s.dir = o.trace);
    const { BOT_VERSION } = require(path.join(__dirname, 'elysium-bot.js'));
    const cv = (fs.readFileSync(o.client, 'utf8').match(/VERSION='([^']+)'/) || [])[1] || '?';
    const meta = { label: path.basename(o.trace), bot: BOT_VERSION, client: cv, clock: o.real ? 'real' : 'virtual', profile: o.profile, paceMs: o.paceMs, askSecs: o.askSecsEff, deckname: o.deckname,
      seatings: o.seatings, seeds: o.seeds, seed: o.seed, decks: o.decks, personas: o.personas, knobs: o.knobs, startPool: o.startPool, rounds: o.rounds, arm: o.arm, workers: o.workers, sim: SIM_VERSION };
    fs.writeFileSync(path.join(o.trace, 'design.json'), JSON.stringify({ meta, specs: specs.map(s => ({ idx: s.idx, seating: s.tag, seed: s.seed, personas: s.personas, knobs: s.knobs, seatKnobs: s.seatKnobs })) }, null, 1));
    process.stderr.write('sim v' + SIM_VERSION + ' · bot v' + BOT_VERSION + ' · client v' + cv + ' · ' + specs.length + ' matches (' + o.seatings + ' seatings × ' + o.seeds + ' seed(s)) · ' + o.workers + ' workers · ' + (o.real ? 'REAL' : 'virtual') + ' clock · profile ' + o.profile + ' → ' + o.trace + '\n');
    runPool(specs, o).then(({ results, wallSecs }) => {
      meta.wallSecs = wallSecs;
      const S = summarize(results, meta); fs.writeFileSync(path.join(o.trace, 'summary.json'), JSON.stringify(S, null, 1));
      const md = summaryMd(S); fs.writeFileSync(path.join(o.trace, 'SUMMARY.md'), md); console.log(md);
      process.exit(S.problems.length ? 1 : 0);
    });
  }
}
module.exports = { installClock, runOne, permutations, buildDesign, summarize, summaryMd, parseArgs, SIM_VERSION, EPOCH };
