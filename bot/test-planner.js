// Quick smoke test of the influence planner
const path = './elysium-bot.js';
delete require.cache[require.resolve(path)];
const { Bot } = require(path);

const u = new Bot({ server:'ws://127.0.0.1:1', room:'x', pass:'x', name:'U', paceMs:0, askSecs:1, log:()=>{} });
u.seat = 1; u.started = true; u.pool = 30; u.inf = 1; u.ownTurns = 1;
u.players = [{seat:1,name:'U'},{seat:2,name:'B'}];
u.phaseActs = { master:1, influence:4, discard:1 };
u.board = []; u.hand = [];

// The worked example: Cap-7 Prince (high synergy) vs Cap-4 Scout (low synergy)
const prince = { id:'p', name:'Prince', kind:'crypt', zone:'uncontrolled', cap:7, blood:0 };
const scout  = { id:'s', name:'Scout',  kind:'crypt', zone:'uncontrolled', cap:4, blood:0 };
u.unc = [prince, scout];

// Test schedule
const sched = u._influenceSchedule(6);
console.log('Schedule (seat 1, 2p):', sched);  // expect [1, 3, 4, 4, 4, 4, 4]

// Test simulation: Scout first vs Prince first
const planA = u._simInfluence([scout, prince], sched, 30, 3);
const planB = u._simInfluence([prince, scout], sched, 30, 3);
console.log('Scout first:', JSON.stringify(planA));
console.log('Prince first:', JSON.stringify(planB));

const scoreA = u._scorePlan(planA, sched, 0.5);
const scoreB = u._scorePlan(planB, sched, 2.0);
console.log('Score A (Scout first, syn 0.5):', scoreA.toFixed(2));
console.log('Score B (Prince first, syn 2.0):', scoreB.toFixed(2));

// Test the full planner
const emits = []; u._emit = (n, d) => emits.push({ n, d });
const pick = u._planInfluence([prince, scout]);
console.log('Planner picks:', pick.name);
const e = emits.find(x => x.n === 'influence-plan');
if(e) console.log('Trace:', JSON.stringify(e.d, null, 2));

// Verify: with 1 transfer this turn, Scout first gets first rise at turn 1 (slot 1 = 3 xfers, cumul 1+3=4>=4)
// while Prince first gets first rise at turn 2 (slot 2 = 4 xfers, cumul 1+3+4=8>=7)
console.log('\nExpected: Scout first wins on tempo (rises turn 1 vs turn 2)');
console.log(pick.name === 'Scout' ? 'PASS ✓' : 'FAIL ✗ — got ' + pick.name);
