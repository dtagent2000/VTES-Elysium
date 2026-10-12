delete require.cache[require.resolve('./elysium-bot.js')];
const { Bot } = require('./elysium-bot.js');

const sent = [];
const u = new Bot({ server:'ws://127.0.0.1:1', room:'x', pass:'x', name:'Grinder', paceMs:0, askSecs:1, log:()=>{} });
u.send = obj => sent.push(obj);

// Test 1: chat replaces Trainbot with persona name
u.chat('Trainbot turn 1 (pool 30)');
u.chat('Trainbot: Lisa bleeds Wall for 2. Block?');
u.chat('Trainbot combat — Lisa strikes: 1 damage.');
u.chat('Trainbot takes the bleed for 3. Pool: 27.');
u.chat('Trainbot is ousted. The shadows reclaim their own.');
u.chat('Trainbot abstains.');

console.log('Outgoing chat messages (should say "Grinder" not "Trainbot"):');
const chats = sent.filter(o => o.t === 'chat');
chats.forEach(c => console.log('  ' + c.msg));

const allGrinder = chats.every(c => c.msg.includes('Grinder') && !c.msg.includes('Trainbot'));
console.log(allGrinder ? '\nPASS ✓ — all Trainbot → Grinder' : '\nFAIL ✗');

// Test 2: incoming combat parser handles non-Trainbot prefix
const u2 = new Bot({ server:'ws://127.0.0.1:1', room:'x', pass:'x', name:'Wall', paceMs:0, askSecs:1, log:()=>{} });
u2.seat = 2; u2.started = true; u2.pool = 30;
u2.players = [{seat:1,name:'Grinder',bot:true},{seat:2,name:'Wall',bot:true}];
u2.send = ()=>{}; u2.chat = ()=>{};
u2._stashAccept = () => true;  // accept all for test

// Simulate receiving a press message from "Grinder" (not "Trainbot")
u2._onChat('Grinder', 'Grinder combat — Lisa presses to continue');
console.log('\nIncoming parser test (Grinder combat prefix):');
console.log('  _oppPress:', JSON.stringify(u2._oppPress));
console.log(u2._oppPress && u2._oppPress.continue === true ? 'PASS ✓ — parser accepts any bot name' : 'FAIL ✗');

// Test 3: taken parser with persona prefix
u2._oppTaken = null;
u2._onChat('Grinder', 'Grinder combat — Lisa takes 2 (loses 2 blood, now 1).');
console.log('\n  _oppTaken:', JSON.stringify(u2._oppTaken));
console.log(u2._oppTaken && u2._oppTaken.n === 2 ? 'PASS ✓ — taken parser works' : 'FAIL ✗');
