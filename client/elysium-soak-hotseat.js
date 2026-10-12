#!/usr/bin/env node
/* elysium-soak-hotseat.js -- the hotseat soak (main project tool, v1.0.0, 21 Sep 2026)

   WHAT IT IS. Real Bot instances, seated on the REAL client's hotBridge, driven round after
   round by the REAL hotRunBotTurns -- the same three pieces a browser runs offline, minus the
   DOM (elysium-test-harness.js). It answers one question the unit suite cannot: does an
   all-bot table keep MOVING? A relay bug here is rarely a wrong value; it is a table that
   parks (round 3, v2.6.95: one bot's "Hold on..." paused another bot's ask, no timer, forever).

   HOW IT DECIDES "STUCK". The sweep's own idle clock (hotAwaitPass, v2.6.122): if the bot
   holding the turn sends NOTHING over the bridge for --idle ms, the table is stuck. The tool
   answers the idle question with "pass the turn", records the seat + the bot's status(), and
   ends that table. Bots heartbeat a chat line every 30 s on their own turn, so keep --idle
   well under that (default 8000) or a parked table will look alive.

   THE CONTROL. `--control` seats one bot that swallows its turn and never passes, and demands
   that the trip-wire FIRES. A soak that cannot fail proves nothing; run the control whenever
   this file, the harness or hotAwaitPass changes. Exit 0 = the wire caught it.

   WHAT IT IS NOT. No human seat, no DOM, no MP_HANDLERS rendering. And it is not the bot
   project's elysium-bot-hotseat.js: that tool LIFTS the bridge and imitates the sweep; this
   one runs the sweep itself. Different blind spots -- quote both.

   The cardfx database (elysium-cardfx.json) is used when it sits beside this file; without it
   the bots play plain (they say so), nobody is likely to be ousted, and the summary says so.

   Usage:
     node elysium-soak-hotseat.js                        the default battery (six 2-bot tables + one 4-bot)
     node elysium-soak-hotseat.js --decks hacking,sewer [--pool 30] [--rounds 10]
     node elysium-soak-hotseat.js --control              prove the trip-wire fires
     options: --client <file>  --bot <file>  --idle <ms>  --persona expert|experienced|novice  --quiet
   Exit: 0 all tables moved (or the control tripped) . 2 a table stuck (or the control did NOT trip) . 3 cannot run */
'use strict';
const fs = require('fs'), path = require('path');
const SOAK_VERSION = '1.0.0';
const HERE = __dirname;

function arg(name, dflt){ const i = process.argv.indexOf('--' + name); return i > -1 ? (process.argv[i + 1] === undefined || /^--/.test(process.argv[i + 1]) ? true : process.argv[i + 1]) : dflt; }
const sleep = ms => new Promise(r => setTimeout(r, ms));

const DEFAULT_BATTERY = [
  { decks: ['hacking', 'sewer'],        pool: 30, rounds: 10 },
  { decks: ['sewer', 'hacking'],        pool: 30, rounds: 10 },
  { decks: ['malkavian', 'nosferatu'],  pool: 30, rounds: 10 },
  { decks: ['tremere', 'ventrue'],      pool: 30, rounds: 10 },
  { decks: ['hacking', 'malkavian'],    pool: 14, rounds: 14 },
  { decks: ['ventrue', 'sewer'],        pool: 14, rounds: 14 },
  { decks: ['tremere', 'nosferatu', 'malkavian', 'ventrue'], pool: 14, rounds: 12 },
];

/* One table. Returns { decks, pool, rounds, turns, holds, tallies, ousted, stuck:[{seat,status}], ms }.
   opts: { client, BOT, loadClient, fx, idleMs, persona, mute:<seat that never passes, for the control> } */
async function runTable(spec, opts){
  const { BOT, loadClient } = opts, t00 = Date.now();
  const A = loadClient(opts.client), HB = A.hotBridge, n = spec.decks.length;
  for (const d of spec.decks) if (!BOT.ARCHETYPES[d]) throw new Error('unknown deck key "' + d + '" -- the bot registers: ' + Object.keys(BOT.ARCHETYPES).join(', '));
  const cfg = spec.decks.map((d, i) => ({ name: 'B' + (i + 1), bot: true }));
  HB.reset(cfg);
  A.net.roster = cfg.map((c, i) => ({ seat: i + 1, name: c.name, bot: true, vp: 0 }));
  A.net.you = '(no human)'; A.net.boards = {}; A.net.hot = { boards: {}, undo: {} }; A.localTable = true;
  const R = { decks: spec.decks, pool: spec.pool, rounds: 0, turns: 0, holds: 0, tallies: 0, ousted: [], stuck: [], ms: 0 };
  let lastHeard = Date.now(); const fromBot0 = HB._fromBot.bind(HB);
  HB._fromBot = (seat, rec, m) => { lastHeard = Date.now(); return fromBot0(seat, rec, m); };   // the WATCHDOG's own clock -- deliberately not rec.lastAt, which belongs to the mechanism under test
  const toBot0 = HB.toBot.bind(HB);
  HB.toBot = (seat, m) => {                       // count what one bot's traffic delivers to ANOTHER bot
    if (m && m.t === 'say' && m.i === 0 && m.seat !== seat) R.holds++;
    if (m && m.t === 'tally') R.tallies++;
    if (opts.mute === seat && m && m.t === 'turn' && m.seat === seat) return;   // the control: this seat never hears its own turn, so it never passes
    return toBot0(seat, m);
  };
  const bots = spec.decks.map((d, i) => new BOT.Bot({ room: 'soak', pass: '', name: 'B' + (i + 1), paceMs: 0, askSecs: 1,
    transport: HB.dialFor(i + 1, 'B' + (i + 1)), deck: BOT.ARCHETYPES[d], deckName: d, persona: opts.persona || 'expert',
    cardfxData: opts.fx || null, log: () => {} }));
  try {
    for (const b of bots) await b.connect();
    const t0 = Date.now();
    while (bots.some((b, i) => !HB.seats[i + 1] || !HB.seats[i + 1].deck) && Date.now() - t0 < 8000) await sleep(40);
    if (bots.some((b, i) => !HB.seats[i + 1] || !HB.seats[i + 1].deck)) throw new Error('a bot never uploaded its deck');
    bots.forEach((b, i) => HB.startFor(i + 1)); await sleep(200);
    if (spec.pool !== 30) bots.forEach(b => { b.pool = spec.pool; });
    for (let r = 1; r <= spec.rounds; r++){
      if (A.net.roster.filter(q => !q.out).length <= 1) break;                 // last standing
      const sweep = A.hotRunBotTurns(n + 1, 0, { idleMs: opts.idleMs, onIdle: async seat => {
        let st = null; try { st = bots[seat - 1].status ? bots[seat - 1].status() : null; } catch (e) {}
        R.stuck.push({ seat, round: r, status: st }); return true; } });
      /* The soak leans on hotAwaitPass to notice a parked seat -- so if THAT breaks, the soak would
         hang instead of reporting. An independent watchdog: no bot has said anything over the bridge
         for 3x the idle window and the sweep has still not returned -> stuck, by the tool's own clock. */
      let dog = null; const bark = new Promise(res => { dog = setInterval(() => { if (Date.now() - lastHeard > opts.idleMs * 3) res('watchdog'); }, 250); });
      lastHeard = Date.now();
      const order = await Promise.race([sweep, bark]); clearInterval(dog);
      if (order === 'watchdog'){ const w = A.hotPassWaiter; R.stuck.push({ seat: w ? w.seat : 0, round: r, status: null, watchdog: true }); R.rounds = r; break; }
      R.rounds = r; R.turns += order.length;
      if (R.stuck.length) break;
    }
    R.ousted = A.net.roster.filter(q => q.out).map(q => q.seat);
  } finally {
    bots.forEach(b => { try { b.close(); } catch (e) {} });
    A.localTable = false; try { HB.reset([]); } catch (e) {}
  }
  R.ms = Date.now() - t00;
  return R;
}
function line(R){
  return R.decks.join(' vs ') + ' · pool ' + R.pool + ': ' + R.rounds + ' rounds, ' + R.turns + ' turns, ' + R.holds + ' bot Hold-ons delivered to another bot, '
    + R.tallies + ' tallies fanned, ousted [' + R.ousted.join(',') + '] · ' + (R.stuck.length ? 'STUCK seat ' + R.stuck[0].seat + ' in round ' + R.stuck[0].round + (R.stuck[0].watchdog ? ' (WATCHDOG -- the sweep\'s own idle clock never fired: hotAwaitPass is broken)' : '') : 'moved') + ' · ' + Math.round(R.ms / 1000) + ' s';
}
function loadDeps(clientPath, botPath){
  if (!fs.existsSync(clientPath)) return { err: 'client not found: ' + clientPath };
  if (!fs.existsSync(botPath)) return { err: 'elysium-bot.js not found beside the tool (' + botPath + ') -- the bot is developed in the Elysium Bots project and consumed here as a RELEASE; upload the released file to run a soak' };
  let fx = null; const fxp = path.join(path.dirname(botPath), 'elysium-cardfx.json');
  if (fs.existsSync(fxp)){ try { fx = JSON.parse(fs.readFileSync(fxp, 'utf8')); } catch (e) { return { err: 'elysium-cardfx.json is present but does not parse: ' + e.message }; } }
  return { BOT: require(botPath), loadClient: require(path.join(HERE, 'elysium-test-harness.js')).loadClient, fx };
}

async function main(){
  const client = path.resolve(arg('client', path.join(HERE, 'elysium-vtes-bord.html'))), botPath = path.resolve(arg('bot', path.join(HERE, 'elysium-bot.js')));
  const D = loadDeps(client, botPath); if (D.err){ console.error('soak: ' + D.err); process.exit(3); }
  const idleMs = +arg('idle', 8000) || 8000, quiet = !!arg('quiet', false), persona = arg('persona', 'expert');
  const cv = (fs.readFileSync(client, 'utf8').match(/const VERSION='([^']+)'/) || [])[1] || '?';
  console.log('Elysium hotseat soak v' + SOAK_VERSION + ' · client v' + cv + ' · bot v' + (D.BOT.BOT_VERSION || '?') + ' · cardfx database: ' + (D.fx ? 'yes' : 'NO -- bots play plain, ousts unlikely') + ' · idle trip-wire ' + idleMs + ' ms\n');
  const base = { client, BOT: D.BOT, loadClient: D.loadClient, fx: D.fx, idleMs, persona };

  if (arg('control', false)){
    const R = await runTable({ decks: ['hacking', 'sewer'], pool: 30, rounds: 3 }, Object.assign({}, base, { mute: 2, idleMs: Math.min(idleMs, 3000) }));
    console.log('CONTROL (seat 2 never hears its turn): ' + line(R));
    const ok = R.stuck.length === 1 && R.stuck[0].seat === 2 && !R.stuck[0].watchdog;   // the watchdog catching it means the table WAS parked but the client's own clock slept -- that is a client fault, not a pass
    const dogOnly = R.stuck.length === 1 && R.stuck[0].watchdog;
    console.log(ok ? '\nthe trip-wire FIRED on the parked seat -- a soak can fail, so a clean one means something'
      : dogOnly ? '\nCLIENT FAULT: the table was parked and only this tool\'s watchdog noticed -- hotAwaitPass\'s idle clock never asked. In a browser that table would sit forever'
      : '\nNOTHING FIRED -- neither the client\'s idle clock nor the watchdog saw the parked seat; do not trust this tool\'s clean runs');
    process.exit(ok ? 0 : 2);
  }
  const one = arg('decks', null);
  const battery = one ? [{ decks: String(one).split(',').map(s => s.trim()).filter(Boolean), pool: +arg('pool', 30) || 30, rounds: +arg('rounds', 10) || 10 }] : DEFAULT_BATTERY;
  const out = [];
  for (const spec of battery){ const R = await runTable(spec, base); out.push(R); console.log((R.stuck.length ? '  ✗ ' : '  ✓ ') + line(R));
    if (R.stuck.length && !quiet) console.log('      status of the parked bot: ' + JSON.stringify(R.stuck[0].status).slice(0, 400)); }
  const stuck = out.filter(R => R.stuck.length).length, holds = out.reduce((s, R) => s + R.holds, 0), ousts = out.reduce((s, R) => s + R.ousted.length, 0);
  console.log('\n' + out.length + ' tables · ' + out.reduce((s, R) => s + R.turns, 0) + ' turns · ' + holds + ' bot Hold-ons delivered · ' + ousts + ' ousts · ' + stuck + ' STUCK');
  if (!ousts) console.log('note: nobody was ousted in this run' + (D.fx ? '' : ' (no cardfx database beside the tool)') + ' -- the oust path (bounty / roster / the sweep skipping a fallen seat) was NOT exercised; the client suite\'s LIVE tests cover it in the small');
  process.exit(stuck ? 2 : 0);
}
if (require.main === module) main().catch(e => { console.error('soak: ' + ((e && e.message) || e) + (process.env.SOAK_STACK ? '\n' + (e && e.stack) : '')); process.exit(3); });   // a usage mistake gets a sentence, not a stack (SOAK_STACK=1 for the stack)
module.exports = { runTable, loadDeps, DEFAULT_BATTERY, SOAK_VERSION };
