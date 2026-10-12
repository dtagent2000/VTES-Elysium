delete require.cache[require.resolve('./elysium-bot.js')];
const { Bot } = require('./elysium-bot.js');

const u = new Bot({ server:'ws://127.0.0.1:1', room:'x', pass:'x', name:'Bot2', paceMs:0, askSecs:5, log:()=>{} });
u.seat = 2; u.started = true; u.pool = 30;
u.players = [
  { seat:1, name:'Human',  bot:false },
  { seat:2, name:'Bot2',   bot:true },
  { seat:3, name:'Bot3',   bot:true },
  { seat:4, name:'Bot4',   bot:true },
  { seat:5, name:'Bot5',   bot:true }
];
u.send = ()=>{}; u.push = ()=>{};
const chats = []; u.chat = msg => chats.push(msg);
u._armReactTimer = ()=>{};

// Hunt: kind=undefined, target=undefined → undirected
u._actingVamp = { v: { name: 'Lisa' }, n: 0, played: new Set() };
const prom = u._askBlock('Bot2: Lisa hunts. Block?');

// Give the promise constructor a tick
setTimeout(() => {
  if(!u._ask) { console.log('FAIL — _ask not set (undirected detection failed)'); return; }
  console.log('5-player game, Bot2 acts (undirected hunt):');
  console.log('  Eligible:', [...u._ask.eligible]);

  const allIn = u._ask.eligible.has('Bot3') && u._ask.eligible.has('Bot4') &&
                u._ask.eligible.has('Bot5') && u._ask.eligible.has('Human');
  const meOut = !u._ask.eligible.has('Bot2');
  console.log(allIn && meOut ? 'PASS ✓ — all 4 live players eligible' : 'FAIL ✗');

  // Intermediate player passes
  u._onSay({ i: 7, who: 'Bot4', seat: 4 });
  console.log('\nBot4 (intermediate) says Pass:', [...u._ask.passed]);
  console.log(u._ask.passed.has('Bot4') ? 'PASS ✓' : 'FAIL ✗');

  // Three pass, one remains
  u._onSay({ i: 7, who: 'Bot3', seat: 3 });
  u._onSay({ i: 7, who: 'Bot5', seat: 5 });
  console.log('\n3/4 passed, ask open?', !!u._ask);
  console.log(u._ask ? 'PASS ✓ — waiting for Human' : 'FAIL ✗');

  // Final pass closes
  u._onSay({ i: 7, who: 'Human', seat: 1 });
  prom.then(ans => {
    console.log('\nAll 4 passed → answer:', ans.what);
    console.log(ans.what === 'no' ? 'PASS ✓' : 'FAIL ✗');
    console.log('\nChat:', chats[0]);
    console.log(/clockwise from Bot3/.test(chats[0]) ? 'PASS ✓ — clockwise prompt' : 'FAIL ✗');
  });
}, 10);
