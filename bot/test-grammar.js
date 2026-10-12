delete require.cache[require.resolve('./elysium-bot.js')];
const { Bot } = require('./elysium-bot.js');

function mk(seat, name) {
  const b = new Bot({ server:'ws://127.0.0.1:1', room:'x', pass:'x', name, paceMs:0, askSecs:1, log:()=>{} });
  b.seat = seat; b.started = true; b.pool = 20; b.out = false;
  b.players = [
    { seat:1, name:'Human', bot:false },
    { seat:2, name:'Grinder', bot:true },
    { seat:3, name:'Predator', bot:true },
    { seat:4, name:'Wall', bot:true }
  ];
  b.send = ()=>{}; b.push = ()=>{};
  const chats = []; b.chat = msg => chats.push(msg);
  return { b, chats };
}

// Setup: Human(1) → Grinder(2) → Predator(3) → Wall(4) → Human(1)
// Human's prey = Grinder (seat 2). Grinder's predator = Human.
// Predator's predator = Grinder. Wall's predator = Predator.

const g = mk(2, 'Grinder');    // prey of Human
const p = mk(3, 'Predator');   // prey of Grinder
const w = mk(4, 'Wall');       // prey of Predator

// Test 1: bare "bleed 3" — only Grinder (Human's prey) should respond
g.b._onChat('Human', 'bleed 3');
p.b._onChat('Human', 'bleed 3');
w.b._onChat('Human', 'bleed 3');
console.log('Test 1: bare "bleed 3" from Human');
console.log('  Grinder pool:', g.b.pool, '(should be 17)');
console.log('  Predator pool:', p.b.pool, '(should be 20 — not targeted)');
console.log('  Wall pool:', w.b.pool, '(should be 20 — not targeted)');
console.log(g.b.pool === 17 && p.b.pool === 20 && w.b.pool === 20 ? 'PASS ✓' : 'FAIL ✗');

// Test 2: named "@Wall bleed 5" — only Wall should respond
g.b._onChat('Human', '@Wall bleed 5');
p.b._onChat('Human', '@Wall bleed 5');
w.b._onChat('Human', '@Wall bleed 5');
console.log('\nTest 2: "@Wall bleed 5" from Human');
console.log('  Grinder pool:', g.b.pool, '(should still be 17)');
console.log('  Predator pool:', p.b.pool, '(should still be 20)');
console.log('  Wall pool:', w.b.pool, '(should be 15)');
console.log(g.b.pool === 17 && p.b.pool === 20 && w.b.pool === 15 ? 'PASS ✓' : 'FAIL ✗');

// Test 3: "Grinder, vote 2" — only Grinder responds
g.b._onChat('Human', 'Grinder, vote 2');
p.b._onChat('Human', 'Grinder, vote 2');
w.b._onChat('Human', 'Grinder, vote 2');
console.log('\nTest 3: "Grinder, vote 2" from Human');
console.log('  Grinder pool:', g.b.pool, '(should be 15)');
console.log('  Predator pool:', p.b.pool, '(should still be 20)');
console.log('  Wall pool:', w.b.pool, '(should still be 15)');
console.log(g.b.pool === 15 && p.b.pool === 20 && w.b.pool === 15 ? 'PASS ✓' : 'FAIL ✗');

// Test 4: verify chat messages use the bot's actual name, not "Trainbot"
console.log('\nTest 4: chat uses bot name');
console.log('  Grinder chats:', g.chats.filter(m => /takes the/.test(m)));
console.log(g.chats.some(m => m.startsWith('Grinder takes')) ? 'PASS ✓ — uses persona name' : 'FAIL ✗');

// Test 5: help command responds with bot name
g.chats.length = 0;
g.b._onChat('Human', 'help');
console.log('\nTest 5: help uses bot name');
console.log('  Response:', g.chats[0] || '(none)');
console.log(g.chats[0] && g.chats[0].startsWith('Grinder v') ? 'PASS ✓' : 'FAIL ✗');
