delete require.cache[require.resolve('./elysium-bot.js')];
const { Bot } = require('./elysium-bot.js');
const sent = [];
const u = new Bot({ server:'ws://127.0.0.1:1', room:'x', pass:'x', name:'Grinder', paceMs:0, log:()=>{} });
u.send = obj => sent.push(obj);

u.chat('Trainbot turn 1 (pool 30)');
u.chat('Trainbot: Lisa bleeds Wall for 2. Block?');
u.chat('Trainbot combat — Lisa strikes: 1 damage.');
u.chat('Trainbot takes the bleed for 3. Pool: 27.');
u.chat('Trainbot abstains.');
u.chat('Trainbot is ousted. The shadows reclaim their own.');

const chats = sent.filter(o => o.t === 'chat').map(c => c.msg);
chats.forEach(c => console.log(c));

console.log('\nChecks:');
console.log(chats[0].includes('Grinder (bot) turn')     ? '✓ turn banner'   : '✗ turn banner');
console.log(chats[1].includes('Grinder (bot): Lisa')     ? '✓ bleed announce' : '✗ bleed announce');
console.log(chats[2].includes('Grinder combat')          ? '✓ combat prefix (no bot)' : '✗ combat prefix');
console.log(!chats[2].includes('(bot) combat')            ? '✓ parser-safe'   : '✗ parser-broken');
console.log(chats[3].includes('Grinder (bot) takes')     ? '✓ damage ack'    : '✗ damage ack');
console.log(chats[4].includes('Grinder (bot) abstains')  ? '✓ abstain'       : '✗ abstain');
console.log(chats[5].includes('Grinder (bot) is ousted') ? '✓ oust'          : '✗ oust');
