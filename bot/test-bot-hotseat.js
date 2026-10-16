#!/usr/bin/env node
/* test-bot-hotseat.js v1.2.0 (16 Oct 2026; H11 = the lift carries the combat merge, main's REPLY v2.6.159 section 6) -- THE HOTSEAT GATE. Online / hotseat parity as a test, not a hope (CLAUDE.md 66d: every release of 18-21 Sep was
   measured on the server only). Plays one short four-starter table through the client's REAL hotBridge (lifted verbatim by elysium-bot-hotseat.js) and asserts
   the things that broke silently: the table finishes, every bot knows its deck, block exchanges are two-sided, an oust is seen and paid.
   Needs the released client (elysium-vtes-bord.html) + elysium-cardfx.json beside it; SKIPS LOUDLY otherwise (the canary's rule). ~1-3 min. Run ALONE.      */
const fs = require('fs'), path = require('path');
const client = path.join(__dirname, 'elysium-vtes-bord.html'), cardfx = path.join(__dirname, 'elysium-cardfx.json');
if(!fs.existsSync(client) || !fs.existsSync(cardfx)){ console.log('\n*** SKIPPED: test-bot-hotseat.js needs ' + (!fs.existsSync(client) ? 'elysium-vtes-bord.html' : 'elysium-cardfx.json') + ' beside it -- NOT a pass. Upload the released client and re-run. ***\n0/0 — SKIPPED'); process.exit(0); }
const { runTable, liftBridge, bridgeIn } = require('./elysium-bot-hotseat.js');
let passN = 0, failN = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); c ? passN++ : failN++; };
(async () => {
  const L = liftBridge(client), relaysTally = /case 'tally'/.test(L.bridgeSrc), relaysBounty = /case 'bounty'/.test(L.bridgeSrc);
  console.log('[H] client v' + L.version + ' -- hotBridge relays tally: ' + (relaysTally ? 'YES' : 'no') + ' · bounty: ' + (relaysBounty ? 'YES' : 'no'));
  const seed = +(process.env.HOTSEAT_SEED || 11);
  const r = await runTable(Object.assign({ seed, startPool: 12, askSecs: 2, rounds: 60, stuckMs: 60000, out: process.env.HOTSEAT_OUT || null }, process.env.BOT ? { bot: path.resolve(process.env.BOT) } : {}));
  const c = r.counts; console.log('    bot v' + r.bot + ' · ' + r.rounds + ' rounds · ' + r.secs + ' s · pools ' + r.pools.join('/') + ' · ' + JSON.stringify(c) + ' · dropped by the bridge: ' + JSON.stringify(r.droppedVerbs));
  ok(!r.stuck, 'H1 no seat ever sat on the turn' + (r.stuck ? ' -- STUCK at round ' + r.stuck.round + ' seat ' + r.stuck.seat + (r.stuck.seatOut ? ' (an OUSTED bot was handed the turn and never passed)' : '') : ''));
  ok(r.finished && r.alive.length === 1, 'H2 the table played to last-standing (' + (r.alive[0] || 'nobody') + ')');
  ok(r.manifest.length === 4 && r.manifest.every(m => m.key === m.deck && (m.axes || []).length > 0), 'H3 every bot knows its deck WITHOUT being told a deckName, as the client spawns them: ' + r.manifest.map(m => m.deck + '=' + (m.key || 'UNKNOWN')).join(' '));
  ok(c.blockMade > 0, 'H4 precondition: blocks were attempted (' + c.blockMade + ')');
  ok(c.stealthLooks > 0, 'H5 the ACTOR looks at a bot blocker\'s attempt (' + c.stealthLooks + ' looks, ' + c.stealthCards + ' stealth cards) -- 0 of 35 on v0.6.146 through this bridge');
  ok(relaysTally ? true : c.tallyNet > 0, relaysTally ? 'H6 the bridge relays tally -- the net may rest (' + c.tallyNet + ' firings)' : 'H6 the bridge drops tally and the NET rebuilt the other side\'s number from the log lines (' + c.tallyNet + ' firings)');
  ok(c.ousted >= 3, 'H7 three ousts happened (' + c.ousted + ')');
  ok(relaysBounty ? (c.bountyInferred === 0 && c.oustInferred === 0) : (c.oustInferred >= c.ousted && c.bountyInferred >= 1), relaysBounty ? 'H8 the bridge routes bounty / roster and the bot\'s no-server net stayed ASLEEP (' + c.oustInferred + ' oust reads, ' + c.bountyInferred + ' self-collected; v0.6.150 scored 9 / 3 here because its pool-0 board left before its bounty)' : 'H8 with no roster from the bridge the ousts were READ from the boards (' + c.oustInferred + ' seat-views) and a predator collected its 6 pool (' + c.bountyInferred + ')');
  ok(r.turnsHandedToOustedBots === 0 || c.oustedPass >= r.turnsHandedToOustedBots, r.turnsHandedToOustedBots === 0 ? 'H9 the sweep (following the bridge\'s roster) never handed an ousted bot the turn' : 'H9 every turn the sweep handed to an ousted bot was passed on (' + c.oustedPass + ' of ' + r.turnsHandedToOustedBots + ')');
  ok(r.pools.filter(x => x > 0).length === 1 && r.finished, 'H10 exactly one pool is left standing (' + r.pools.join('/') + ')');
  if(L.cmbNeeded){   // v1.2.0: the bridge's tallyIn names the client's combat merge -- the lift must carry it, or a bot's combat tally relays base fields only (v2.6.159+) or throws (v2.6.129-158)
    const HB = bridgeIn(L).hotBridge; HB.reset([{ name: 'A', bot: true }, { name: 'B', bot: true }]);
    const o1 = HB.tallyIn('A', 1, { mode: 'combat', a: 2, rng: 'long', nx: 'close', sa: 'Hand strike' }), o2 = HB.tallyIn('B', 2, { mode: 'combat', rd: 2 });
    ok(o1.rng === 'long' && o1.sa === 'Hand strike' && o1.a === 2 && o2.rd === 2 && o2.rng === 'close' && o2.rl === 1 && o2.a === 0 && o2.sa === '',
      'H11 the lift carries the combat merge: a combat tally relays its combat fields (rng ' + o1.rng + ', sa "' + o1.sa + '"), and a new round takes "close next round" (rng ' + o2.rng + ', rl ' + o2.rl + ') and zeroes an absent a (' + o2.a + ')');
  } else ok(true, 'H11 the bridge names no combat merge (a client before v2.6.129) -- nothing to lift');
  console.log('\n' + passN + '/' + failN + (failN ? ' — FAIL' : ' — all green')); process.exit(failN ? 1 : 0);
})().catch(e => { console.error('\n  ✗ HOTSEAT GATE ABORT: ' + e.message); console.log('\n' + passN + '/' + (failN + 1) + ' — FAIL'); process.exit(1); });
