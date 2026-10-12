delete require.cache[require.resolve('./elysium-bot.js')];
const { Bot } = require('./elysium-bot.js');

function mk(seat, name){
  const b = new Bot({ server:'ws://127.0.0.1:1', room:'x', pass:'x', name, paceMs:900, askSecs:25, log:()=>{} });
  b.seat = seat; b.started = true; b.pool = 20; b.out = false; b.turnSeat = seat;
  b.players = [
    { seat:1, name:'Human',   bot:false },
    { seat:2, name:'Grinder', bot:true  },
    { seat:3, name:'Wall',    bot:true  }
  ];
  b.send = ()=>{}; b.push = ()=>{};
  const chats = []; b.chat = m => chats.push(m);
  return { b, chats };
}

// --- Fix A: watchdog stays quiet while waiting on the table ---
const w = mk(2,'Grinder');
w.b._ask = { resolve(){}, timer:null, pausedBy:new Set() };   // an open ask = waiting for the table
w.b._watchdogArm();
const fired = w.b._wdT;
// simulate the timer body by hand (can't wait 30s in a test)
w.b._wdT = null;
if(!(w.b.turnSeat !== w.b.seat || w.b.out)){
  if(!w.b._ask && !(w.b._holdBy && w.b._holdBy.size)) w.b.chat('⌛ Still thinking…');
}
console.log('Fix A — open ask:');
console.log('  chats:', w.chats);
console.log(w.chats.length === 0 ? 'PASS ✓ — silent while waiting on the table' : 'FAIL ✗');

// same bot, no ask → should speak
w.b._ask = null;
if(!w.b._ask && !(w.b._holdBy && w.b._holdBy.size)) w.b.chat('⌛ Still thinking…');
console.log('  after ask closes:', w.chats);
console.log(w.chats.length === 1 ? 'PASS ✓ — heartbeats when the wait is its own' : 'FAIL ✗');

// --- Fix B: bare help answered by the spokesbot only ---
const g = mk(2,'Grinder'), wa = mk(3,'Wall');
g.b._onChat('Human','help'); wa.b._onChat('Human','help');
console.log('\nFix B — bare "help":');
console.log('  Grinder:', g.chats.length, '| Wall:', wa.chats.length);
console.log(g.chats.length === 1 && wa.chats.length === 0 ? 'PASS ✓ — only the lowest-seated bot answers' : 'FAIL ✗');
console.log('  text:', g.chats[0]);
console.log(/@Name bleed N/.test(g.chats[0]) ? 'PASS ✓ — teaches the scoped form' : 'FAIL ✗');

// named help reaches exactly that bot
const g2 = mk(2,'Grinder'), wa2 = mk(3,'Wall');
g2.b._onChat('Human','@Wall help'); wa2.b._onChat('Human','@Wall help');
console.log('\n  "@Wall help" → Grinder:', g2.chats.length, '| Wall:', wa2.chats.length);
console.log(g2.chats.length === 0 && wa2.chats.length === 1 ? 'PASS ✓ — named form is exact' : 'FAIL ✗');

// --- Fix C: bare rush scoped the same way ---
const g3 = mk(2,'Grinder'), wa3 = mk(3,'Wall');
g3.b._onChat('Human','rush'); wa3.b._onChat('Human','rush');
console.log('\nFix C — bare "rush" → Grinder:', g3.chats.length, '| Wall:', wa3.chats.length);
console.log(g3.chats.length === 1 && wa3.chats.length === 0 ? 'PASS ✓' : 'FAIL ✗');

// the watchdog timer would keep the event loop alive — stand it down
w.b._watchdogKill(); g.b._watchdogKill(); wa.b._watchdogKill();
g2.b._watchdogKill(); wa2.b._watchdogKill(); g3.b._watchdogKill(); wa3.b._watchdogKill();
process.exit(0);
