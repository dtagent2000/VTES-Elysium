const { Bot } = require('./elysium-bot.js');

// Test 2: Synergy flip — when card synergy overrides tempo
const u = new Bot({ server:'ws://127.0.0.1:1', room:'x', pass:'x', name:'U', paceMs:0, askSecs:1, log:()=>{} });
u.seat = 1; u.started = true; u.pool = 30; u.inf = 1; u.ownTurns = 1;
u.players = [{seat:1,name:'U'},{seat:2,name:'B'}];
u.phaseActs = { master:1, influence:4, discard:1 };
u.board = []; u.unc = [];

// Load cardfx so _influenceSynergy actually works
try { u.fx = { lib:{}, crypt:{}, alias:{}, normIdx: new Map() }; } catch(e){}

// Fake fxLookup: Deep Song requires sup-ANI
u.fxLookup = name => {
  if(name === 'Deep Song') return { kind:'lib', name, e:{ t:['action'], modes:[
    { at:'ani', fx:{ rush:true } },
    { at:'ANI', fx:{ rush:true } }
  ]}};
  return null;
};
// Fake _modeUsableBy: prince has ANI, scout doesn't
u._modeUsableBy = (mo, c) => {
  if(mo.at === 'ANI' && c.name === 'Prince') return true;
  if(mo.at === 'ani') return true;
  return false;
};

// Heavy hand synergy: 6 Deep Songs = lots of supFit for Prince
u.hand = ['Deep Song','Deep Song','Deep Song','Deep Song','Deep Song','Deep Song'];

const prince = { id:'p', name:'Prince', kind:'crypt', zone:'uncontrolled', cap:7, blood:0 };
const scout  = { id:'s', name:'Scout',  kind:'crypt', zone:'uncontrolled', cap:4, blood:0 };

const synP = u._influenceSynergy(prince);
const synS = u._influenceSynergy(scout);
console.log('Prince synergy:', synP, '  Scout synergy:', synS);

const emits = []; u._emit = (n, d) => emits.push({ n, d });
const pick = u._planInfluence([prince, scout]);
console.log('With 6 Deep Songs, planner picks:', pick.name);
const e = emits.find(x => x.n === 'influence-plan');
if(e) console.log('  score:', e.d.score, ' order:', e.d.order, ' rises:', JSON.stringify(e.d.rises));

// Test 3: Pre-stocked blood (Govern already placed blood)
const u2 = new Bot({ server:'ws://127.0.0.1:1', room:'x', pass:'x', name:'U2', paceMs:0, askSecs:1, log:()=>{} });
u2.seat = 1; u2.started = true; u2.pool = 25; u2.inf = 3; u2.ownTurns = 2;
u2.players = [{seat:1,name:'U2'},{seat:2,name:'B'}];
u2.phaseActs = { master:1, influence:4, discard:1 };
u2.board = []; u2.hand = [];
const big = { id:'b', name:'BigVamp', kind:'crypt', zone:'uncontrolled', cap:7, blood:4 }; // 4 pre-stocked!
const small = { id:'s', name:'SmallVamp', kind:'crypt', zone:'uncontrolled', cap:3, blood:0 };
u2.unc = [big, small];

const emits2 = []; u2._emit = (n, d) => emits2.push({ n, d });
const pick2 = u2._planInfluence([big, small]);
console.log('\nPre-stocked: BigVamp has 4/7 blood, SmallVamp 0/3');
console.log('With 3 transfers this turn, planner picks:', pick2.name);
const e2 = emits2.find(x => x.n === 'influence-plan');
if(e2) console.log('  rises:', JSON.stringify(e2.d.rises));
console.log(pick2.name === 'BigVamp'
  ? 'PASS ✓ — BigVamp needs only 3 more, rises THIS turn'
  : 'FAIL ✗');
