#!/usr/bin/env node
/* elysium-bot-hotseat.js v1.3.0 (19 Oct 2026) -- THE HOTSEAT TABLE, headless.
   Lifts `const hotBridge = {...}` and `function hotFanOut` VERBATIM out of the client source beside it (elysium-vtes-bord.html, READ-ONLY here) and drives real
   Bot instances through them the way the client's hotRunBotTurns does: one `turn` per bot seat round the ring from the CONFIG (not the roster), waiting for
   that seat's `pass`. Whatever the bridge drops is dropped here too -- this is the client's relay, not a model of it.
   CLI:   node elysium-bot-hotseat.js [--decks malkavian,tremere,nosferatu,ventrue] [--seed N] [--rounds 25] [--start-pool 30] [--ask-secs 3] [--persona expert]
                                      [--deckname 1] [--arm asis|tally|full] [--out events.jsonl] [--client ./elysium-vtes-bord.html] [--bot ./elysium-bot.js]
   arms:  asis  = the bridge exactly as shipped (the default, and the only arm the gate uses)
          tally = + the server's tally relay (field-preserving merge, fanned to ALL seats incl. the sender)  -- "what if main ships rule 1"
          nohold = the shipped bridge with its v2.6.95 'a bot's Hold on... is not relayed to bots' filter REMOVED (main's open question D, 21 Sep)
          full  = + bounty / roster-on-oust with server semantics, ousted seats skipped by the sweep          -- "what if main ships all of it"
   Module: require('./elysium-bot-hotseat.js').runTable(opts) -> Promise<result>  (test-bot-hotseat.js is the gate built on it)
   v1.2.0 (main's REPLY v2.6.159 section 6): the bridge's tallyIn calls tallyCombatMerge / AVR_CMB_KEYS (bare v2.6.129-158, typeof-guarded since v2.6.159), and this
   context had neither -- a bot's COMBAT tally threw in the lift and never reached the other bot (v2.6.159+: it relayed its base fields only). The lift now cuts
   the three self-contained definitions beside the literal (AVR_CMB0, AVR_CMB_KEYS, tallyCombatMerge -- the rule the real client and srv-2.6.39+ apply), so a
   combat tally carries rng / rl / nx / pr / sp / ce / sa / sb / xa / xb / pa / pb / ga / gb / ea / eb as at a real table. bridgeIn(L) is the one context.
   v1.3.0 (19 Oct 2026, the sim table): three OPTIONAL inputs for elysium-bot-sim.js, absent = v1.2.0 byte for byte (the gate passes none of them):
   o.personas (one per seat, else o.persona), o.seatKnobs ({seat: {knob: v}}, merged over o.knobs), o.onEvent(e) (called with every bot event as it is
   pushed). The result also names the seats (res.names) and the persona each bot played (res.personas). */
const fs = require('fs'), vm = require('vm'), path = require('path');
function liftBridge(clientPath){
  const html = fs.readFileSync(clientPath, 'utf8');
  const cut = (from, to) => { const i = html.indexOf(from); if(i < 0) throw new Error('client marker missing: ' + from); const j = html.indexOf(to, i); if(j < 0) throw new Error('client marker end missing after: ' + from); return html.slice(i, j + to.length); };
  const bridgeSrc = cut('const hotBridge = {', 'hotBridge.reset([]);'), cmbNeeded = /tallyCombatMerge|AVR_CMB_KEYS/.test(bridgeSrc);
  const cmb = cmbNeeded ? [cut('const AVR_CMB0=', '});'), cut('const AVR_CMB_KEYS=', ';'), cut('function tallyCombatMerge(m, prev){', '\n}')] : [];   // v1.2.0: needed = the bridge names them; then a missing definition is an error, not a silent base-fields relay
  return { version: (html.match(/VERSION='([^']+)'/) || [])[1] || '?', bridgeSrc, fanSrc: cut('function hotFanOut(msg, fromSeat){', '\n}'), cmbNeeded, cmbSrc: cmb.join('\n') };
}
function bridgeIn(L, extra){   // v1.2.0: the ONE context the lift runs in -- main's lift contract names VERSION, net, log, localTable, MP_HANDLERS; everything else the literal calls is typeof-guarded
  const ctx = vm.createContext(Object.assign({ console, setTimeout, clearTimeout, JSON, Math, Object, Array, String, Date, parseInt, VERSION: L.version, localTable: true, net: { boards: {}, roster: [] },
    MP_HANDLERS: { board(){}, log(){}, say(){}, chat(){}, fx(){} }, log(){} }, extra || {}));
  vm.runInContext((L.cmbSrc ? L.cmbSrc + '\n' : '') + L.bridgeSrc + '\n' + L.fanSrc + '\nthis.hotBridge = hotBridge; this.hotFanOut = hotFanOut;', ctx);
  return ctx;
}

async function runTable(opts){
  const o = Object.assign({ decks: ['malkavian', 'tremere', 'nosferatu', 'ventrue'], seed: 1, rounds: 25, startPool: 30, askSecs: 3, paceMs: 0, persona: 'expert', deckname: false, arm: 'asis', out: null,
    client: path.join(__dirname, 'elysium-vtes-bord.html'), bot: path.join(__dirname, 'elysium-bot.js'), cardfx: path.join(__dirname, 'elysium-cardfx.json'), stuckMs: 90000, progress: null }, opts || {});
  const { Bot, ARCHETYPES, BOT_VERSION } = require(path.resolve(o.bot));
  const realRandom = Math.random; let s = (o.seed >>> 0) || 1; Math.random = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };   // the bridge shuffles with Math.random: a seed repeats the deal
  try {
    const L = liftBridge(o.client), dropped = {}, humanLog = [];
    if(o.arm === 'nohold'){ const F = "if (!(m.i === 0 && (hotBridge._cfg || [])[seat - 1] && (hotBridge._cfg || [])[seat - 1].bot))"; if(L.bridgeSrc.indexOf(F) < 0) throw new Error('arm nohold: the bridge has no Hold-on filter to remove (already gone?)'); L.bridgeSrc = L.bridgeSrc.replace(F, 'if (true)'); }   // v1.1.0: 'what if main removes the v2.6.95 filter' -- a bot's say{i:0} then reaches every bot, as on the server
    const ctx = bridgeIn(L, { MP_HANDLERS: { board(){}, log(m){ humanLog.push(m); }, say(){}, chat(){}, fx(){} } });
    const HB = ctx.hotBridge, orig = HB._fromBot.bind(HB), room = { tally: null }, roster = [];
    let holdsRelayed = 0; const toBot0 = HB.toBot.bind(HB); HB.toBot = function(seat, m){ if(m && m.t === 'say' && m.i === 0 && ((HB._cfg || [])[(m.seat | 0) - 1] || {}).bot) holdsRelayed++; return toBot0(seat, m); };   // v1.1.0: how many times one bot's 'Hold on...' reached another bot
    const HANDLED = new Set((L.bridgeSrc.match(/case '([A-Za-z]+)'/g) || []).map(x => x.slice(6, -1)));   // v1.0.1: read from the LIFTED source -- when main adds a case, the verb leaves the dropped list by itself
    HB._fromBot = function(seat, rec, m){
      if(m && typeof m.t === 'string' && !HANDLED.has(m.t)) dropped[m.t] = (dropped[m.t] || 0) + 1;   // counted in every arm: what a bot SAID that the shipped bridge has no case for
      if(o.arm !== 'asis' && m && m.t === 'tally'){   // the server's handler, field for field
        const mode = ['block', 'vote', 'combat', 'free'].includes(m.mode) ? m.mode : null, prev = (room.tally && room.tally.mode === mode) ? room.tally : null;
        const f = (k, lo, hi, d) => (k in m) ? Math.max(lo, Math.min(hi, m[k] | 0)) : (prev ? prev[k] : d);
        const t = { mode, a: f('a', 0, 99, 0), b: f('b', 0, 99, 0), ph: f('ph', 0, 6, 0), rd: Math.max(1, f('rd', 1, 99, 1)) };
        room.tally = mode ? t : null; const out = Object.assign({ t: 'tally', who: rec.name }, t); if(m.res) out.res = 1;
        Object.keys(HB.seats).forEach(k => HB.toBot(+k, out)); return; }
      if(o.arm === 'full' && m && m.t === 'bounty'){
        const me = roster.find(q => q.seat === seat); if(me) me.out = true;
        const n = roster.length; let pred = null; for(let k = 1; k < n; k++){ const q = roster[(seat - 1 - k + n * 8) % n]; if(!q.out){ pred = q; break; } }
        if(pred) HB.toBot(pred.seat, { t: 'bounty', from: rec.name });
        Object.keys(HB.seats).forEach(k => HB.toBot(+k, { t: 'roster', players: roster.map(q => Object.assign({ online: true, vp: 0, vacant: false }, q)) })); return; }
      return orig(seat, rec, m);
    };
    const cardfxData = JSON.parse(fs.readFileSync(o.cardfx, 'utf8'));
    const names = o.decks.map((d, i) => 'B' + (i + 1) + '-' + d), ev = [], bots = []; let round = 0;
    HB.reset(names.map(n => ({ name: n, bot: true }))); names.forEach((n, i) => roster.push({ seat: i + 1, name: n, bot: true, out: false }));
    for(let i = 0; i < o.decks.length; i++){ const seat = i + 1; if(!ARCHETYPES[o.decks[i]]) throw new Error('unknown deck ' + o.decks[i]);
      const deck = JSON.parse(JSON.stringify(ARCHETYPES[o.decks[i]]));   // a COPY, as the client embeds them -- never the registry object itself
      const b = new Bot(Object.assign({ name: names[i], room: 'hotseat', pass: '', transport: HB.dialFor(seat, names[i]), cardfxData, deck, persona: (o.personas && o.personas[i]) || o.persona, paceMs: o.paceMs, askSecs: o.askSecs, startPool: o.startPool,
        log: () => {}, onEvent: (t, d) => { if(t.indexOf('bot:') === 0){ const e = { round, who: names[i], deck: o.decks[i], type: t.slice(4), d }; ev.push(e); if(o.onEvent) o.onEvent(e); } } }, o.deckname ? { deckName: o.decks[i] } : {}, o.knobs || {}, (o.seatKnobs || {})[seat] || {}));
      bots.push(b); await b.connect(); const t0 = Date.now(); while(!(HB.seats[seat] && HB.seats[seat].deck) && Date.now() - t0 < 5000) await new Promise(r => setTimeout(r, 30));
      if(!(HB.seats[seat] && HB.seats[seat].deck)) throw new Error('deck upload never arrived for seat ' + seat); HB.startFor(seat); }
    const t0 = Date.now(); let stuck = null, turnsToOusted = 0;
    outer: for(round = 1; round <= o.rounds; round++){
      for(let seat = 1; seat <= o.decks.length; seat++){
        if(o.arm === 'full' && roster[seat - 1].out) continue;
        if(HB._out && HB._out[seat]) continue;   // v1.1.0: client >= v2.6.122 keeps the roster in the bridge and its sweep skips ousted seats -- follow it; an older bridge has no _out and the config walk stands
        if(bots[seat - 1].out) turnsToOusted++;
        const okPass = await new Promise(res => { const to = setTimeout(() => res(false), o.stuckMs); HB.onPass = s2 => { if(s2 === seat){ clearTimeout(to); res(true); } }; HB.turn(seat); });
        if(o.progress) o.progress('r' + round + 's' + seat + (okPass ? '' : ' !STUCK') + ' ' + Math.round((Date.now() - t0) / 1000) + 's pools=' + bots.map(b => b.pool).join('/'));
        if(!okPass){ stuck = { round, seat, seatOut: !!bots[seat - 1].out }; break outer; }
        if(bots.filter(b => !b.out).length <= 1) break outer; } }
    const c = t => ev.filter(e => e.type === t), plays = c('play'), w = x => plays.filter(e => e.d.window === x).length;
    const res = { tool: 'elysium-bot-hotseat 1.3.0', bot: BOT_VERSION, client: L.version, names, personas: names.map((n, i) => (o.personas && o.personas[i]) || o.persona), combatMerge: !!L.cmbSrc, arm: o.arm, deckNamePassed: !!o.deckname, seed: o.seed, decks: o.decks, rounds: Math.min(round, o.rounds), secs: Math.round((Date.now() - t0) / 1000),
      finished: !stuck && bots.filter(b => !b.out).length <= 1, stuck, alive: bots.filter(b => !b.out).map(b => b.o.name), pools: bots.map(b => b.pool), turnsHandedToOustedBots: turnsToOusted, droppedVerbs: dropped, botHoldsRelayedToBots: holdsRelayed,
      manifest: c('manifest').map(e => ({ deck: e.deck, key: e.d.deck, axes: e.d.axes })),
      counts: { through: c('through').length, blocked: c('blocked').length, blockMade: c('block-made').length, stealthCards: w('stealth'), interceptCards: w('react-intercept'), stealthLooks: c('stealth-stack').length,
        interceptLooks: c('intercept-stack').length, bleedTotals: c('bleed-total').length, tallyNet: c('tally-net').length, oustInferred: c('oust-inferred').filter(e => !e.d.undone).length, bountyInferred: c('oust-inferred').filter(e => e.d.myPrey).length, oustedPass: c('ousted-pass').length, ousted: c('ousted').length } };
    if(o.out) fs.writeFileSync(o.out, ev.map(e => JSON.stringify(e)).join('\n'));
    bots.forEach(b => { try { b.close(); } catch(e){} });
    return res;
  } finally { Math.random = realRandom; }
}

module.exports = { runTable, liftBridge, bridgeIn };
if(require.main === module){
  const A = process.argv.slice(2), opt = k => { const i = A.indexOf('--' + k); return i < 0 ? null : A[i + 1]; }, o = { progress: l => process.stderr.write(l + '\n') };
  if(opt('decks')) o.decks = opt('decks').split(','); ['seed', 'rounds'].forEach(k => { if(opt(k)) o[k] = +opt(k); });
  if(opt('start-pool')) o.startPool = +opt('start-pool'); if(opt('ask-secs')) o.askSecs = +opt('ask-secs'); if(opt('persona')) o.persona = opt('persona'); if(opt('deckname')) o.deckname = opt('deckname') === '1';
  if(opt('arm')) o.arm = opt('arm'); if(opt('out')) o.out = opt('out'); if(opt('client')) o.client = opt('client'); if(opt('bot')) o.bot = opt('bot');
  runTable(o).then(r => { console.log(JSON.stringify(r, null, 1)); process.exit(0); }).catch(e => { console.error('HOTSEAT TABLE FAILED:', e.message); process.exit(1); });
}
