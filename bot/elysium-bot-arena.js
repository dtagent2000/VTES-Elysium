#!/usr/bin/env node
'use strict';
const RUN_ID = Date.now().toString(36);   // v1.2.4 (#5): process-unique trace names -- the serie-first overwrite lesson (four of five traces lost)
/* ============================================================================
   elysium-bot-arena.js — headless bot-vs-bot match runner            v1.2.9
   ----------------------------------------------------------------------------
   v1.2.9 (16 Sep 2026, THE HELPER GATE): the v1.0.1 tally seed removed --
   bot v0.6.113 no longer decides on caps.tally (see the note at the start
   site). Arena matches now exercise the same block/verdict path a human table
   does. No other change.
   v1.2.8 (11 Sep 2026, B1): per-bot block-window tallies off the new
   `block-eval` emit -- windows seen, blocks decided, decided blocks per threat
   class (T1..T6) and per role (prey/predator/target) -- reported in
   results.doctrine and aggregated per persona in the summary (the doctrine's
   section-6 metrics: block-rate per class and role).
   ----------------------------------------------------------------------------
   v1.1.5 (24 July, standing-question round): timing-scope note on t0 (per-match
   ms EXCLUDES teardown/server boot — games/hour ≈1–2% optimistic vs true
   wall-clock-with-gaps), and the conflation warning now states its equal-length
   precondition (unequal persona/deck lists cycle pairings with period lcm).
   ----------------------------------------------------------------------------
   v1.2.4 (25 July, A1 -- the DOCTRINE HARVEST, rush-theory section 4): per-bot
   doctrine tallies collected on the enriched v0.6.54 emits (rush through/blocked
   carry dir/tBlood/famed; 'torpor' fires at every flip site; 'rushed' marks the
   defender side; 'rush-counterfactual' is R-Q5's dataset) -- backrush share,
   first-rush direction, chump-rushes (tBlood <= 1 unfamed), Fame conversions,
   torpors (famed split), times-rushed, suppressed cross picks. Reported per bot
   in results.doctrine and aggregated per persona in the summary's own doctrine
   section. Metrics are ALWAYS collected (tracing stays opt-in via --trace).
   v1.1.4 (24 July, T1): per-match wall-clock + events count in results, a
   games/hour extrapolation in the summary (the ONE number L2 planning needs),
   --bots lifted 2–5 (server MAX_PLAYERS=6; VTES tables top at 5), and an
   explicit warning when decks differ: decks rotate IN STEP with personas, so
   per-persona summary rows conflate persona+deck (T3 duplicate seating is the
   real separation).
   ----------------------------------------------------------------------------
   The EVALUATE rung of the authoring pipeline (bot-spec §7): plays N matches
   of Trainbots against each other on a real (copied, isolated) server, to
   last-standing, and reports wins / turns / damage per persona — with an
   optional JSONL trace per match (every decide(), every through/blocked
   bleed, dealt hands for reproducibility). Zero dependencies.

   usage:
     node elysium-bot-arena.js [--matches 3] [--bots 3 (2-5)]
          [--personas expert,experienced,novice]   (rotated one seat per match)
          [--start-pool 12]                   (low pool = fast matches)
          [--turn-cap 200] [--match-timeout 120]
          [--trace DIR]                       (writes DIR/match-N-<runid>.jsonl + summary.json; runid is process-unique -- #5: separate runs never overwrite)
          [--pace 0] [--ask-secs 3] [--cardfx path]

   As a module:  const { runArena } = require('./elysium-bot-arena.js');
                 const results = await runArena({ matches: 1, bots: 2, ... });
   ========================================================================== */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { Bot, PERSONAS, ARCHETYPES, BOT_VERSION } = require('./elysium-bot.js');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const rotate = (arr, k) => arr.map((_, i) => arr[(i + k) % arr.length]);
const PERMUTE_DECKS = process.argv.includes('--permute-decks');   // v1.2.7 (harvest seed 2) -- v1.3.0: now the DEFAULT; kept as a no-op alias
/* v1.3.0 (17 Sep 2026, Johan): RANDOM SEATING BY DEFAULT. The per-match rotation kept
   every persona/deck pair's NEIGHBOURS fixed -- hacking preyed on sewer, malkavian bled
   into the tremere wall, in every match of every series -- so per-deck rows measured
   table geometry as much as decks. Now each match seats the pairs in a random order
   from a run seed (printed in the header, settable with --seed N for a repeatable
   series); --fixed-seats restores the rotation for matchup-specific experiments.     */
const FIXED_SEATS = process.argv.includes('--fixed-seats');
const RUN_SEED = (() => { const i = process.argv.indexOf('--seed'); return i >= 0 ? (parseInt(process.argv[i + 1], 10) >>> 0) : ((Date.now() ^ (process.pid << 8)) >>> 0); })();

/* ---------- one isolated scratch server (a COPY: the store is __dirname- --
   anchored, so spawning the original would pollute the real rooms file).   */
function spawnServer(){
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'elysium-arena-'));
  fs.copyFileSync(path.join(__dirname, 'elysium-server.js'), path.join(tmp, 'elysium-server.js'));
  const port = 8600 + Math.floor(Math.random() * 300);
  const srv = spawn(process.execPath, [path.join(tmp, 'elysium-server.js'), String(port)],
                    { cwd: tmp, stdio: 'ignore' });
  return { srv, url: 'ws://127.0.0.1:' + port, tmp };
}

/* ---------- one match ---------- */
async function runMatch(mi, serverUrl, o, log){
  let personas, decks;
  if(!FIXED_SEATS){   // v1.3.0: random seating from the run seed is the default (was --permute-decks, v1.2.7); the old rotation behind --fixed-seats   // v1.2.7 (harvest seed 2): rotation preserves neighborhoods (the first harvest proved hacking sat as tremere's predator in ALL matches) -- this flag applies a deterministic seeded Fisher-Yates PERMUTATION of the persona<->deck PAIRS per match instead, so matchups vary while pairings stay intact and runs stay reproducible (seed = match index).
    let sd = (((mi * 2654435761) >>> 0) ^ ((RUN_SEED * 40503) >>> 0)) >>> 0; sd ^= sd >>> 16; sd = (sd * 0x45d9f3b) >>> 0; sd ^= sd >>> 13;   // v1.3.0: hash-mixed (seed, match) so small seeds do not correlate consecutive matches
    const rnd = () => ((sd = (sd * 1103515245 + 12345) >>> 0) / 4294967296);
    const nSeats = Math.max(o.bots | 0, o.personas.length, o.decks.length);   // v1.3.1: seat the PAIRS, one per seat -- with `--personas shark` (one entry) the old idx was one seat long and every bot fell back to deck[0]: five hacking decks in the first all-shark series
    const idx = Array.from({ length: nSeats }, (_, i) => i);
    for(let i = idx.length - 1; i > 0; i--){ const j = Math.floor(rnd() * (i + 1)); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    personas = idx.map(i => o.personas[i % o.personas.length]);
    decks    = idx.map(i => o.decks[i % o.decks.length]);
  } else {
    personas = rotate(o.personas, mi - 1);          // seat fairness: rotate one step per match
    decks = rotate(o.decks, mi - 1);                // v1.1.0: decks rotate IN STEP with personas (pairing constant); see --permute-decks for matchup variance
  }
  const room = 'arena' + Date.now().toString(36).slice(-5) + '-' + mi;
  const seating = (() => { const cnt = new Map(); return personas.map((pn, i) => { const base = cap(pn); const n = (cnt.get(base) || 0) + 1; cnt.set(base, n); return (n > 1 ? base + '-' + n : base) + '/' + (decks[i] || '?'); }); })();   // v1.3.0: seat order 1..N; v1.3.1: the BOT NAMES as the roster gets them (Shark, Shark-2, ...) so the line joins to the traces
  const used = new Map();
  const feed = [];                                      // every event, in arrival order
  const state = {
    t0: Date.now(), events: 0,                          // v1.1.4 (T1): wall-clock from match entry + inbound-event count. v1.1.5 scope: ms INCLUDES connect+lobby+game but EXCLUDES the finally-teardown (~200ms) and the one-time server boot (800ms) — games/hour is ~1–2% optimistic vs true wall-clock-with-gaps, and ms/turn carries a few % of setup amortized over the match's turns
    roster: [], turns: 0, started: false, seating,   // v1.3.0
    per: {},                                            // name -> { persona, dealt, blocked, through, taken, decisions }
    oustOrder: [], traceLines: []
  };
  const trace = (bot, type, data) => {
    if(!o.trace) return;
    state.traceLines.push(JSON.stringify({ t: Date.now(), match: mi, bot, type, data }));
  };
  const onEvent = name => (type, msg) => {
    feed.push({ name, type });
    state.events++;                                     // v1.1.4 (T1): messages/game proxy
    const p = state.per[name];
    if(type === 'roster' || type === 'lobby'){
      const players = msg.players || [];
      if(type === 'roster' && state.started){
        players.forEach(q => {                          // record oust TRANSITIONS in order
          const prev = state.roster.find(r => r.seat === q.seat);
          if(q.out && !(prev && prev.out) && !state.oustOrder.includes(q.name)) state.oustOrder.push(q.name);
        });
        state.roster = players;
      } else if(type === 'lobby') state.lobby = players;
    }
    if(type === 'turn' && name === state.hostName) state.turns++;
    if(type === 'bot:decide' && p){ p.decisions++; trace(name, 'decide', msg); }
    if(type === 'bot:dealt') trace(name, 'dealt', msg);                 // reproducibility record
    if(type === 'bot:through' && p){ p.through += msg.n; trace(name, 'through', msg); }
    if(type === 'bot:blocked' && p){ p.blocked += msg.n; trace(name, 'blocked', msg); }
    if(type === 'bot:took-bleed' && p){ p.taken += msg.n; trace(name, 'took-bleed', msg); }
    if(type === 'bot:through' && p && msg && msg.kind === 'rush'){   // v1.2.4 (A1): doctrine classification off the enriched payload
      const d = msg.dir === 'back' ? 'rushB' : (msg.dir === 'cross' ? 'rushX' : 'rushF'); p[d]++;
      if(!p.firstRush) p.firstRush = msg.dir || 'fwd';
      if((msg.tBlood | 0) <= 1 && !msg.famed) p.chumpRush++;
      if(msg.famed) p.famedRush++;
    }
    if(type === 'bot:blocked' && p && msg && msg.kind === 'rush'){ p.rushBlocked++; if(!p.firstRush) p.firstRush = msg.dir || 'fwd'; }
    if(type === 'bot:rush-counterfactual' && p) p.cf++;
    if(type === 'bot:torpor' && p && msg){ p.torpors++; if(msg.famed) p.famedTorpors++; }
    if(type === 'bot:rushed' && p) p.rushedBy++;
    if(type === 'bot:block-eval' && p && msg){                          // v1.2.8 (B1): the window tallies
      p.windows++;
      if(msg.block){ p.blocksDecided++; p.byT[msg.T || '?'] = (p.byT[msg.T || '?'] || 0) + 1; p.byRole[msg.role || '?'] = (p.byRole[msg.role || '?'] || 0) + 1; }
    }
    if(type === 'bot:ousted') trace(name, 'ousted', msg);
    const TRACED = ['bot:decide', 'bot:dealt', 'bot:through', 'bot:blocked', 'bot:took-bleed', 'bot:ousted'];
    if(type.indexOf('bot:') === 0 && TRACED.indexOf(type) < 0) trace(name, type.slice(4), msg);   // v1.1.2 (fas C): forward-compatible catch-all -- NEW bot emits (mp-attach, perf-gain, took-pooldmg...) reach the trace without arena edits. Found the hard way: the fas-C mechanics fired invisibly behind this whitelist and looked like a bug (the fas-B trace-enrichment lesson, now structural)
  };

  const bots = [];
  try{
    for(let i = 0; i < o.bots; i++){
      const persona = personas[i % personas.length];
      let name = cap(persona);
      const n = (used.get(name) || 0) + 1; used.set(name, n);
      if(n > 1) name += '-' + n;
      if(i === 0) state.hostName = name;
      state.per[name] = { persona, deck: decks[i % decks.length], through: 0, blocked: 0, taken: 0, decisions: 0,
                          rushB: 0, rushF: 0, rushX: 0, rushBlocked: 0, firstRush: null, chumpRush: 0, famedRush: 0, cf: 0, torpors: 0, famedTorpors: 0, rushedBy: 0,
                          windows: 0, blocksDecided: 0, byT: {}, byRole: {} };   // v1.2.4 (A1): the doctrine tallies; v1.2.8 (B1): the block-window tallies
      const deckName = decks[i % decks.length];
      const deck = ARCHETYPES[deckName];
      if(!deck) throw new Error("unknown archetype '" + deckName + "' (registered: " + Object.keys(ARCHETYPES).join(', ') + ")");
      const bot = new Bot({
        seat: i + 1,   // v1.2.6: the arena OWNS the seat -- carried into the bot's manifest emit so trace analysis never again infers seat from emission order (async connects race) or name sort (mixed personas break it); the retro-relabel v2 proved winners were order-robust by inheritance convergence, but luck is not a contract
        server: serverUrl, room, pass: 'x', name, deck,
        deckName,   // A2 (v1.2.4): the manifest reads DECK_STRATEGY[deckName] -- the yardstick needs the key
        create: i === 0, persona, cardfx: o.cardfx,
        paceMs: o.pace, askSecs: o.askSecs, startPool: o.startPool,
        ...(o.knobs || {}), ...((o.seatKnobs || {})[i + 1] || {}),   // v1.2.4 (#6): spread LAST -- knobs may override pace/askSecs when swept
        rig: (o.rig || [])[i] || null,
        log: () => {}, onEvent: onEvent(name)
      });
      await bot.connect();
      bots.push(bot);
      await sleep(150);
    }

    /* everyone seated + decked → the HOST BOT starts the game */
    const t0 = Date.now();
    while(!(state.lobby && state.lobby.filter(q => q.deck).length === o.bots)){
      if(Date.now() - t0 > 15000) throw new Error('lobby never filled');
      await sleep(80);
    }
    bots[0].send({ t: 'start' });
    /* v1.2.9 (16 Sep 2026, bot v0.6.113 THE HELPER GATE): the tally SEED that sat
       here since v1.0.1 (16 July) is gone. It papered over a bot bug -- block
       decisions and phase narration were gated on caps.tally, set only by
       observing a counter, so an all-bot room degraded to "let it through" until
       someone blocked. The bot no longer decides on caps.tally at all, and it
       writes its own stealth to the shared counter at every announce; the arena
       now runs the same code path a human table does, seed-free. */
    state.started = true;

    /* play to last-standing (or the caps) */
    while(true){
      await sleep(120);
      const alive = state.roster.length ? state.roster.filter(q => !q.vacant && !q.out) : null;
      if(alive && alive.length === 1)
        return finish(mi, state, { winner: alive[0].name, reason: 'last-standing' }, o);
      if(state.turns >= o.turnCap)
        return finish(mi, state, { winner: null, reason: 'turn-cap' }, o);
      if(Date.now() - t0 > o.matchTimeoutMs)
        return finish(mi, state, { winner: null, reason: 'timeout' }, o);
    }
  } finally {
    bots.forEach(b => { try{ b.close(); }catch(e){} });
    await sleep(200);
  }
}

function computeVp(names, oustOrder, reason){   // v1.2.5 (VEKN winner fix, source-verified vekn.net 4 Aug): 1 VP per prey ousted (ouster = the victim's LIVE predator in the ring); at the TIME limit every non-ousted gets +0.5 EXCEPT a sole survivor; a sole survivor (any reason) gets the FULL +1 survival VP the rulebook awards -- the piece v1.2.4 missed for last-standing endings.
  const seatOf = {}; names.forEach((n, i) => seatOf[n] = i + 1);
  const alive = new Set(names);
  const vp = {}; names.forEach(n => vp[n] = 0);
  for(const ousted of (oustOrder || [])){
    const vs = seatOf[ousted]; if(!vs) continue;
    let pred = null;
    for(let d = 1; d < names.length; d++){
      const cand = names[((vs - 1 - d) % names.length + names.length) % names.length];
      if(alive.has(cand) && cand !== ousted){ pred = cand; break; }
    }
    if(pred) vp[pred] += 1;
    alive.delete(ousted);
  }
  if(alive.size === 1){ vp[[...alive][0]] += 1; }                                          // the survival VP: full, regardless of how the game ended (vekn: "unless that player is the last one surviving... full Victory Point")
  else if(reason === 'timeout' || reason === 'turn-cap'){ for(const n of alive) vp[n] += 0.5; }   // vekn 3.7: half-point to time-limit survivors when MORE than one remains
  return vp;
}
function deriveWinner(vp, oustOrder, names){   // v1.2.5: VEKN "most victory points wins, even if ousted". Tiebreak (arena convention, documented): a still-alive leader beats ousted leaders; among ousted leaders, the LATEST-ousted wins (longest life). Returns null only on an empty table.
  const max = Math.max(...names.map(n => vp[n] || 0));
  const leaders = names.filter(n => (vp[n] || 0) === max);
  if(leaders.length === 1) return leaders[0];
  const ousted = new Set(oustOrder || []);
  const aliveLeaders = leaders.filter(n => !ousted.has(n));
  if(aliveLeaders.length === 1) return aliveLeaders[0];
  const pool = aliveLeaders.length ? aliveLeaders : leaders;
  let best = pool[0], bestIdx = (oustOrder || []).indexOf(pool[0]);
  for(const n of pool){ const i = (oustOrder || []).indexOf(n); if(i > bestIdx){ best = n; bestIdx = i; } }
  return best;
}
function finish(mi, state, end, o){
  const vpMap = computeVp(Object.keys(state.per), state.oustOrder, end.reason);
  const vekWinner = deriveWinner(vpMap, state.oustOrder, Object.keys(state.per));   // v1.2.5: the winner is the VP leader per VEKN -- end.winner (last-standing) demotes to the tiebreak role inside deriveWinner; end.reason still names HOW the game ended
  const result = {
    match: mi, winner: (vekWinner != null ? vekWinner : end.winner), reason: end.reason, seating: state.seating || null,   // v1.3.0   // v1.2.5: VEKN most-VP winner (1 VP no longer beats 3)
    ms: Date.now() - state.t0, events: state.events,    // v1.1.4 (T1)
    playerTurns: state.turns,
    rounds: Math.max(1, Math.round(state.turns / Math.max(1, Object.keys(state.per).length))),
    oustOrder: state.oustOrder,
    vp: vpMap,   // v1.2.5: computed by computeVp (survival VP now included for last-standing endings)
    bots: Object.entries(state.per).map(([name, p], bIdx) => ({
      name, persona: p.persona, deck: p.deck,
      knobs: { ...(o.knobs || {}), ...((o.seatKnobs || {})[bIdx + 1] || {}) },   // v1.2.4 (#6): the trace carries each bot's EFFECTIVE knob set (bIdx+1 = seat, per-insertion order)
      damageDealt: p.through, announcedBlocked: p.blocked,
      damageTaken: p.taken, decisions: p.decisions,
      doctrine: { rushB: p.rushB, rushF: p.rushF, rushX: p.rushX, rushBlocked: p.rushBlocked,
                  firstRush: p.firstRush, chumpRush: p.chumpRush, famedRush: p.famedRush,
                  cf: p.cf, torpors: p.torpors, famedTorpors: p.famedTorpors, rushedBy: p.rushedBy,
                  windows: p.windows, blocksDecided: p.blocksDecided, byT: p.byT, byRole: p.byRole }   // v1.2.4 (A1); v1.2.8 (B1)
    }))
  };
  if(o.trace){
    fs.mkdirSync(o.trace, { recursive: true });
    state.traceLines.push(JSON.stringify({ t: Date.now(), match: mi, type: 'result', data: result }));
    fs.writeFileSync(path.join(o.trace, 'match-' + mi + '-' + RUN_ID + '.jsonl'), state.traceLines.join('\n') + '\n');
  }
  return result;
}

/* ---------- the arena ---------- */
async function runArena(opts){
  const o = Object.assign({
    matches: 3, bots: 3, personas: ['expert'], decks: ['hacking'],   // v1.3.1 (18 Sep, Johan): SHARK for every seat by default -- the bots must play correctly from their knowledge before novice/grinder deviations are measured; --personas still overrides
    startPool: 12, turnCap: 200, matchTimeoutMs: 600000,   // v1.3.3: was 120 s -- a 5p30 match runs 170-270 s, so the default silently voided it (reason 'timeout', winner by VP-so-far); pass --match-timeout for short probes
    pace: 0, askSecs: 3, cardfx: null, trace: null, serverUrl: null, knobs: {}, seatKnobs: {},   // v1.2.4 (#6): sweep knobs -- global + per-seat (treatment vs control in ONE match)
    log: console.log
  }, opts || {});
  o.bots = Math.max(2, Math.min(5, o.bots));   // v1.1.4: 2–5 (server MAX_PLAYERS=6; VTES standard table tops at 5) — T1 measures the 3–5-seat curve
  const log = o.log;

  let owned = null;
  const serverUrl = o.serverUrl || (owned = spawnServer(), await sleep(800), owned.url);
  log('arena v1.4.7 — Trainbot v' + BOT_VERSION + ' · ' + o.matches + ' match(es) × ' +
      o.bots + ' bots · personas ' + o.personas.join('/') + ' · decks ' + o.decks.join('/') + ' · start pool ' + o.startPool);
  log('  seating: ' + (FIXED_SEATS ? 'FIXED (v1.2 rotation, neighbourhoods constant)' : 'RANDOM per match, seed ' + RUN_SEED + ' (repeat with --seed ' + RUN_SEED + ')'));   // v1.3.0
  if(Object.keys(o.knobs).length || Object.keys(o.seatKnobs).length){
    const g = Object.entries(o.knobs).map(([k, v]) => k + '=' + v).join(' ');
    const sk = Object.entries(o.seatKnobs).map(([si2, kv]) => si2 + ':{' + Object.entries(kv).map(([k, v]) => k + '=' + v).join(' ') + '}').join(' ');
    log('  knobs: ' + [g, sk].filter(Boolean).join(' \u00b7 '));   // v1.2.4 (#6): the experiment parameters, visible
  }
  if(new Set(o.decks).size > 1)
    log('  note: persona/deck pairs are locked by list position (per-persona rows conflate persona+deck); v1.3.0 seats the pairs RANDOMLY per match unless --fixed-seats, so neighbourhoods vary -- read matchups from the seats line under each match.');

  const matches = [];
  try{
    for(let mi = 1; mi <= o.matches; mi++){
      const r = await runMatch(mi, serverUrl, o, log);
      matches.push(r);
      log('  match ' + mi + ': ' + (r.winner ? r.winner + ' wins' : 'no winner (' + r.reason + ')') +
          ' · ' + r.rounds + ' rounds (' + r.playerTurns + ' player-turns)' +
          ' · ' + (r.ms / 1000).toFixed(1) + 's · ' + r.events + ' events' +
          (r.oustOrder.length ? ' · ousts: ' + r.oustOrder.join(' → ') : '') +
          ' · VP ' + Object.entries(r.vp || {}).map(([n2, v2]) => n2 + ' ' + v2).join(' ') +
          (r.seating ? '\n           seats 1..' + r.seating.length + ': ' + r.seating.join(' → ') + ' → (1)' : ''));   // v1.2.4; v1.3.0: the seating -- predator -> prey reads left to right
    }
  } finally {
    if(owned){ try{ owned.srv.kill('SIGKILL'); }catch(e){} }
  }

  /* per-persona summary -- v1.3.2 (18 Sep 2026): keyed by persona/deck PAIR, and a per-DECK table below it. With shark on every seat (v1.3.1) a per-persona row is one row; what B2 measures is the deck. */
  const summary = {};
  const keyOf = b => (b.persona || '?') + '/' + (b.deck || '?');
  matches.forEach(r => r.bots.forEach(b => {
    const s = summary[keyOf(b)] = summary[keyOf(b)] ||
      { matches: 0, wins: 0, damageDealt: 0, damageTaken: 0, decisions: 0,
        rushB: 0, rushF: 0, rushX: 0, firstB: 0, firstAny: 0, chump: 0, famed: 0, cf: 0, torpors: 0, vp: 0, windows: 0, blocksDecided: 0, byT: {}, byRole: {} };   // v1.2.4 (A1 + tournament VP); v1.2.8 (B1)
    s.matches++; s.damageDealt += b.damageDealt; s.damageTaken += b.damageTaken; s.decisions += b.decisions;
    const dd = b.doctrine || {};   // v1.2.4 (A1)
    s.rushB += dd.rushB | 0; s.rushF += dd.rushF | 0; s.rushX += dd.rushX | 0;
    if(dd.firstRush){ s.firstAny++; if(dd.firstRush === 'back') s.firstB++; }
    s.chump += dd.chumpRush | 0; s.famed += dd.famedRush | 0; s.cf += dd.cf | 0; s.torpors += dd.torpors | 0;
    s.windows += dd.windows | 0; s.blocksDecided += dd.blocksDecided | 0;   // v1.2.8 (B1)
    Object.entries(dd.byT || {}).forEach(([k, v]) => { s.byT[k] = (s.byT[k] || 0) + v; });
    Object.entries(dd.byRole || {}).forEach(([k, v]) => { s.byRole[k] = (s.byRole[k] || 0) + v; });
    if(r.winner === b.name) s.wins++;
    s.vp += ((r.vp || {})[b.name] || 0);   // v1.2.4: tournament VP per persona
  }));
  Object.values(summary).forEach(s => s.winRate = +(s.wins / Math.max(1, s.matches)).toFixed(2));
  /* v1.3.2: per-DECK standings -- wins, VP, first-out, bleed through, windows/blocks -- read from the same bot records; deck is the axis B2 is measured on */
  const byDeck = {};
  matches.forEach(r => {
    const firstOut = (r.oustOrder || [])[0];
    r.bots.forEach(b => { const d = byDeck[b.deck || '?'] = byDeck[b.deck || '?'] || { matches: 0, wins: 0, vp: 0, firstOut: 0, dealt: 0, taken: 0, windows: 0, blocks: 0 };
      d.matches++; if(r.winner === b.name) d.wins++; d.vp += ((r.vp || {})[b.name] || 0); if(firstOut === b.name) d.firstOut++;
      d.dealt += b.damageDealt | 0; d.taken += b.damageTaken | 0; const dd = b.doctrine || {}; d.windows += dd.windows | 0; d.blocks += dd.blocksDecided | 0; });
  });
  log('   per deck (v1.3.2) ');
  Object.entries(byDeck).sort((a, b) => b[1].vp - a[1].vp).forEach(([d, x]) =>
    log('  ' + d.padEnd(10) + ' wins ' + x.wins + '/' + x.matches + '  VP ' + x.vp + '  first out ' + x.firstOut + '  dealt ' + x.dealt + '  taken ' + x.taken + '  windows ' + x.windows + '  blocks ' + x.blocks + ' (' + (x.windows ? Math.round(100 * x.blocks / x.windows) : 0) + '%)'));

  log('  — summary —');
  Object.entries(summary).forEach(([p, s]) =>
    log('  ' + p.padEnd(8) + ' wins ' + s.wins + '/' + s.matches + ' (' + Math.round(s.winRate * 100) + '%)' +
        ' · dealt ' + s.damageDealt + ' · taken ' + s.damageTaken + ' · decisions ' + s.decisions));
  log('  — doctrine (rush-theory v1.1) —');   // v1.2.4 (A1): the section-4 metrics
  Object.entries(summary).forEach(([p, s]) => {
    const tot = s.rushB + s.rushF + s.rushX;
    log('  ' + p.padEnd(8) + ' rushes ' + tot + ' (back ' + s.rushB + ' · fwd ' + s.rushF + ' · cross ' + s.rushX + ')' +
        ' · first-backrush ' + s.firstB + '/' + s.firstAny + ' · chump ' + s.chump + ' · famed ' + s.famed +
        ' · torpors ' + s.torpors + ' · cf ' + s.cf);
  });
  log('  — block windows (doctrine section 6, B1) —');   // v1.2.8: windows seen / blocks decided, per class and role
  Object.entries(summary).forEach(([p, s]) => {
    const t = Object.entries(s.byT).map(([k, v]) => k + ' ' + v).join(' · ') || '-';
    const r = Object.entries(s.byRole).map(([k, v]) => k + ' ' + v).join(' · ') || '-';
    log('  ' + p.padEnd(8) + ' windows ' + s.windows + ' · blocks ' + s.blocksDecided + ' (' + (s.windows ? Math.round(100 * s.blocksDecided / s.windows) : 0) + '%) · by class ' + t + ' · by role ' + r);
  });
  /* v1.1.4 (T1): the throughput number every L1/L2 promise depends on */
  const timing = (() => {
    const ms = matches.map(r => r.ms), total = ms.reduce((a, b) => a + b, 0);
    const avg = total / Math.max(1, ms.length);
    return { matches: ms.length, totalMs: total, avgMs: Math.round(avg),
             minMs: Math.min(...ms), maxMs: Math.max(...ms),
             gamesPerHour: +(3600000 / avg).toFixed(1),
             avgMsPerPlayerTurn: Math.round(total / Math.max(1, matches.reduce((a, r) => a + r.playerTurns, 0))) };
  })();
  log('  timing: avg ' + (timing.avgMs / 1000).toFixed(1) + 's/match (min ' + (timing.minMs / 1000).toFixed(1) +
      ' · max ' + (timing.maxMs / 1000).toFixed(1) + ') · ' + timing.avgMsPerPlayerTurn + ' ms/player-turn · ≈ ' +
      timing.gamesPerHour + ' games/hour (this machine, these knobs)');
  const results = { matches, summary, byDeck, timing };   // v1.3.2: per-deck standings in summary.json too
  if(o.trace) fs.writeFileSync(path.join(o.trace, 'summary.json'), JSON.stringify(results, null, 2));
  return results;
}

module.exports = { runArena, computeVp, deriveWinner };   // v1.2.5: pure winner logic exported for the suite

/* ---------- CLI ---------- */
if(require.main === module){
  const argv = process.argv, o = {};
  for(let i = 2; i < argv.length; i++){
    const a = argv[i], next = () => argv[++i];
    if(a === '--matches') o.matches = parseInt(next(), 10) || 3;
    else if(a === '--bots') o.bots = parseInt(next(), 10) || 3;
    else if(a === '--personas') o.personas = next().split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    else if(a === '--decks') o.decks = next().split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    else if(a === '--start-pool') o.startPool = Math.max(3, parseInt(next(), 10) || 12);
    else if(a === '--turn-cap') o.turnCap = parseInt(next(), 10) || 200;
    else if(a === '--match-timeout') o.matchTimeoutMs = (parseInt(next(), 10) || 600) * 1000;
    else if(a === '--trace') o.trace = next();
    else if(a === '--rig-file') o.rigFile = next();   // v1.1.3 (Johan's practical-testing GO): JSON array, index-aligned to bot seat order (0-based); an entry can be null/omitted for a normal random deal on that seat. Shape: {"hand":[...], "unc":[...], "ready":[{"name":..,"blood":..}], "pool":N} -- see elysium-bot.js's `dealt` handler, v0.6.17.
    else if(a === '--pace') o.pace = Math.max(0, parseInt(next(), 10) || 0);
    else if(a === '--ask-secs') o.askSecs = Math.max(2, parseInt(next(), 10) || 3);
    else if(a === '--knob'){   // v1.2.4 (#6): --knob key=val[,key=val...] with optional seat prefix N:key=val -- whitelisted so a typo warns, never silently misconfigures
      const WL = ['rushBackWeight','rushFwdWeight','crossRushWeight','poolFloor','paceMs','askSecs','polOverBuild','permFirst','fitWeight','critRisk','homeWeight','stealthStack','lateBounce','bounceSpare','combatMind','twdKnow','dynFloor','combatEndStats','waveNarrow','blockCost'];   // v1.4.7: +waveNarrow, +blockCost (bot v0.6.197)   // v1.4.6: +combatEndStats (bot v0.6.196)   // v1.4.5: +dynFloor (bot v0.6.189)   // v1.4.4: +twdKnow (bot v0.6.187)   // v1.4.3: +combatMind (bot v0.6.156)   // v1.3.4: debt 23b's switch
      o.knobs = o.knobs || {}; o.seatKnobs = o.seatKnobs || {};   // lazy-init -- the arg loop may run against a pre-defaults o
      for(const ent of String(next()).split(',')){
        const m = ent.trim().match(/^(?:(\d+):)?([A-Za-z]+)=(-?[\d.]+)$/);
        if(!m){ console.error('knob ignored (bad form): ' + ent); continue; }
        if(!WL.includes(m[2])){ console.error('knob ignored (not whitelisted): ' + m[2]); continue; }
        const v = parseFloat(m[3]);
        if(m[1]) (o.seatKnobs[+m[1]] = o.seatKnobs[+m[1]] || {})[m[2]] = v;
        else o.knobs[m[2]] = v;
      }
    }
    else if(a === '--cardfx') o.cardfx = next();
    else if(a === '--seed'){ next(); }   // v1.3.0: consumed at module load (RUN_SEED)
    else if(a === '--fixed-seats' || a === '--permute-decks'){ }   // v1.3.0: module-load flags
    else if(a === '--help' || a === '-h'){
      console.log('usage: node elysium-bot-arena.js [--matches 3] [--bots 3 (2-5)] [--personas expert,experienced,novice]\n' +
                  '       [--start-pool 12] [--turn-cap 200] [--match-timeout 120] [--trace DIR]\n' +
                  '       [--pace 0] [--ask-secs 3] [--cardfx path] [--rig-file rig.json]\n' +
                  '       [--seed N] (repeat a random seating) [--fixed-seats] (v1.2 rotation: fixed neighbourhoods, for matchup experiments)');
      process.exit(0);
    }
  }
  if(o.rigFile) o.rig = JSON.parse(fs.readFileSync(o.rigFile, 'utf8'));   // array, index-aligned to bot seat order
  runArena(o).then(() => process.exit(0))
             .catch(e => { console.error('arena fatal:', e.message); process.exit(1); });
}
