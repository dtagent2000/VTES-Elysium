delete require.cache[require.resolve('./elysium-bot.js')];
const { Bot } = require('./elysium-bot.js');

// Weenie scenario: three cap-1 vampires, seat 2, 2-player
const u = new Bot({ server:'ws://127.0.0.1:1', room:'x', pass:'x', name:'U', paceMs:0, askSecs:1, log:()=>{} });
u.seat = 2; u.started = true; u.pool = 30; u.ownTurns = 1;
u.players = [{seat:1,name:'A'},{seat:2,name:'U'}];
u.phaseActs = { master:1, influence:4, discard:1 };
u.board = []; u.hand = []; u.cryptN = 8;

// tableTurn = (1-1)*2 + 2 = 2, so inf = min(4, 2) = 2
u.inf = 2;

const a = { id:'a', name:'Weenie A', kind:'crypt', zone:'uncontrolled', cap:1, blood:0 };
const b = { id:'b', name:'Weenie B', kind:'crypt', zone:'uncontrolled', cap:1, blood:0 };
const c = { id:'c', name:'Weenie C', kind:'crypt', zone:'uncontrolled', cap:1, blood:0 };
u.unc = [a, b, c];

const emits = []; u._emit = (n, d) => emits.push({ n, d });
const pick = u._planInfluence([a, b, c]);

const e = emits.find(x => x.n === 'influence-plan');
console.log('Weenie deck, seat 2, turn 1 (2 transfers):');
console.log('  Schedule:', e.d.schedule);
console.log('  Picked:', e.d.picked);
console.log('  Rises:', JSON.stringify(e.d.rises));
console.log('  Draws:', e.d.parts.draws, ' Waste:', e.d.parts.waste);

// Verify: with 2 transfers, we raise 2 weenies immediately.
// Next turn (4 xfers): raise 3rd weenie (1 xfer), then leftover 3 < 4 = no draw, 3 waste
// Turn after (4 xfers): 4 xfers, crypt draw! draws=1
console.log('\nExpect: 2+ rises on turn 0, draws > 0 over horizon');
console.log(e.d.parts.draws > 0 ? 'PASS ✓ — surplus transfers fund crypt draws' : 'FAIL ✗');

// Compare: what if we DON'T model draws?
const planNoDraw = u._simInfluence([a,b,c], u._influenceSchedule(6), 30, 3, 0); // cryptN=0 = no draws
console.log('\nWith cryptN=0 (no draws): waste =', planNoDraw.waste, 'draws =', planNoDraw.draws);
console.log('With cryptN=8 (draws):    waste =', e.d.parts.waste, 'draws =', e.d.parts.draws);
console.log(e.d.parts.waste < planNoDraw.waste ? 'PASS ✓ — draws reduce measured waste' : 'FAIL ✗');
