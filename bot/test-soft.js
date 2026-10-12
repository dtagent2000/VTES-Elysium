delete require.cache[require.resolve('./elysium-bot.js')];
const { Bot } = require('./elysium-bot.js');

function mkBot() {
  const u = new Bot({ server:'ws://127.0.0.1:1', room:'x', pass:'x', name:'Bot2', paceMs:0, askSecs:5, log:()=>{} });
  u.seat = 2; u.started = true; u.pool = 30;
  u.players = [
    { seat:1, name:'Human', bot:false },
    { seat:2, name:'Bot2',  bot:true },
    { seat:3, name:'Bot3',  bot:true },
    { seat:4, name:'Mid',   bot:false },  // human in between
    { seat:5, name:'Bot5',  bot:true }
  ];
  u.send = ()=>{}; u.push = ()=>{};
  u.chat = ()=>{};
  u._armReactTimer = ()=>{};
  u._actingVamp = { v: { name: 'Lisa' }, n: 0, played: new Set() };
  return u;
}

// Test 1: Default — only prey + predator in eligible (fast flow)
const u1 = mkBot();
const p1 = u1._askBlock('Hunt. Block?');
setTimeout(() => {
  console.log('Test 1: Default eligible (no intermediate opt-in)');
  console.log('  Eligible:', [...u1._ask.eligible]);
  const ok = u1._ask.eligible.has('Bot3') && u1._ask.eligible.has('Human')
          && !u1._ask.eligible.has('Mid') && !u1._ask.eligible.has('Bot5');
  console.log(ok ? 'PASS ✓ — only prey (Bot3) + predator (Human)' : 'FAIL ✗');

  // Prey + predator pass → window closes immediately (no waiting for Mid/Bot5)
  u1._onSay({ i: 7, who: 'Bot3', seat: 3 });
  u1._onSay({ i: 7, who: 'Human', seat: 1 });
  p1.then(a => {
    console.log('  Window closed:', a.what);
    console.log(a.what === 'no' ? 'PASS ✓ — fast close, no intermediate wait' : 'FAIL ✗');

    // Test 2: Intermediate player says Hold on → promoted
    const u2 = mkBot();
    const p2 = u2._askBlock('Hunt. Block?');
    setTimeout(() => {
      console.log('\nTest 2: Mid says Hold on → promoted into eligible');
      u2._onSay({ i: 0, who: 'Mid', seat: 4 });  // say "Hold on…"
      console.log('  Eligible after Hold on:', [...u2._ask.eligible]);
      const ok2 = u2._ask.eligible.has('Mid');
      console.log(ok2 ? 'PASS ✓ — Mid promoted' : 'FAIL ✗');

      // Prey + predator pass, but Mid still holding → window stays open
      u2._onSay({ i: 7, who: 'Bot3', seat: 3 });
      u2._onSay({ i: 7, who: 'Human', seat: 1 });
      console.log('  Prey+pred passed, ask open?', !!u2._ask);
      console.log(u2._ask ? 'PASS ✓ — waiting for Mid (promoted)' : 'FAIL ✗');

      // Mid passes → window closes
      u2._onSay({ i: 7, who: 'Mid', seat: 4 });
      p2.then(a2 => {
        console.log('  Mid passes → answer:', a2.what);
        console.log(a2.what === 'no' ? 'PASS ✓ — clean close after promotion' : 'FAIL ✗');

        // Test 3: Intermediate player says Block! (works without Hold on)
        const u3 = mkBot();
        const p3 = u3._askBlock('Hunt. Block?');
        setTimeout(() => {
          console.log('\nTest 3: Mid says Block! directly (no Hold on needed)');
          u3._onSay({ i: 2, who: 'Mid', seat: 4 });  // Block!
          p3.then(a3 => {
            console.log('  Answer:', a3.what, 'by:', a3.who);
            console.log(a3.what === 'block' ? 'PASS ✓ — Block! always works' : 'FAIL ✗');
          });
        }, 10);
      });
    }, 10);
  });
}, 10);
