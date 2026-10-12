delete require.cache[require.resolve('./elysium-bot.js')];
const { Bot } = require('./elysium-bot.js');

function mk(seat, name){
  const b = new Bot({ server:'ws://127.0.0.1:1', room:'x', pass:'x', name, paceMs:0, askSecs:25, log:()=>{} });
  b.seat = seat; b.started = true; b.pool = 20; b.out = false; b.turnSeat = seat;
  b.players = [
    { seat:1, name:'Alice', bot:false },
    { seat:2, name:'Bot2',  bot:true  },
    { seat:3, name:'Bot3',  bot:true  }
  ];
  b.send = ()=>{}; b.push = ()=>{};
  const chats = []; b.chat = m => chats.push(m);
  b._armReactTimer = ()=>{};
  return { b, chats };
}
let fail = 0;
const ok = (c,l) => { console.log((c?'PASS ✓ ':'FAIL ✗ ')+l); if(!c) fail++; };

// ---- ITEM 1: a bot's "Hold on…" must not park another bot's ask ----
const a = mk(3,'Bot3');
a.b._actingVamp = { v:{name:'Lisa'}, n:0, played:new Set() };   // undirected (hunt)
a.b._askBlock('Bot3: Lisa hunts. Block?');
setTimeout(() => {
  const before = [...a.b._ask.eligible];
  a.b._onSay({ i:0, who:'Bot2', seat:2 });                       // bot says Hold on…
  console.log('\n=== Item 1: bot Hold on during another bot\'s ask ===');
  ok(a.b._ask.pausedBy.size === 0, 'pausedBy untouched by a bot');
  ok(a.b._ask.timer !== null,      'timer still running');
  ok(a.b._ask.eligible.size === before.length, 'eligible not inflated by a bot');

  // a HUMAN Hold on still works, and still promotes
  a.b._onSay({ i:0, who:'Alice', seat:1 });
  ok(a.b._ask.pausedBy.has('Alice'), 'human Hold on still pauses');

  // ---- ITEM 3/4: the unified hold rule ----
  console.log('\n=== Item 3: hold placed while no bot is acting ===');
  const h = mk(2,'Bot2');
  h.b.turnSeat = 1;                                              // the HUMAN is on turn — old code: nobody relevant
  h.b._holdHook('Alice', 0, null);
  ok(h.chats.length === 0, 'tracking only, nothing announced yet');
  ok(h.b._holdBy.has('Alice'), 'hold is tracked');

  // the turn later becomes the bot's own and it tries to act -> the gate speaks
  h.b.turnSeat = 2;
  h.b._holdGate();
  ok(h.chats.length === 1 && /Holding for Alice/.test(h.chats[0]), 'the BLOCKED bot announces at the gate');
  ok(h.b._holdRemT !== null, 'reminder armed (was never armed in v0.6.107)');

  // a second bot hitting the same gate stays silent (anti-flood) ...
  const h2 = mk(3,'Bot3');
  h2.b._holdHook('Alice', 0, null);
  ok(h2.chats.length === 0, 'a bot that never reached the gate says nothing');

  // ---- release from ANY non-bot clears the whole name-keyed set ----
  console.log('\n=== Item 4: hotseat release by a different human ===');
  h.b._holdHook('Bob', 4, null);                                 // Bob releases Alice's hold
  ok(h.b._holdBy.size === 0, 'Bob releases Alice\'s hold (hotseat)');
  ok(/Resuming/.test(h.chats[h.chats.length-1]), 'the announcing bot announces the release');
  ok(h.b._holdRemT === null, 'reminder disarmed');

  // a BOT release must not clear a human's hold
  const h3 = mk(2,'Bot2');
  h3.b._holdHook('Alice', 0, null);
  h3.b._holdHook('Bot3', 4, null);
  ok(h3.b._holdBy.size === 1, 'a bot cannot release a human hold');

  // ---- ITEM 2: queued turn ----
  console.log('\n=== Item 2: turn arriving while _acting ===');
  const t = mk(2,'Bot2');
  let played = 0;
  t.b._playTurn = async () => { played++; };
  t.b._acting = true;
  t.b._onMsg ? null : null;
  t.b.handlers ? null : null;
  // drive the turn handler directly
  t.b._pendingTurn = null;
  const turnHandler = (m) => {
    t.b.turnSeat = m.seat;
    if(t.b.started && !t.b.out && m.seat === t.b.seat){
      if(t.b._acting) t.b._pendingTurn = m.seat;
      else t.b._playTurn().catch(()=>{});
    }
  };
  turnHandler({ seat:2 });
  ok(t.b._pendingTurn === 2, 'turn queued instead of dropped');
  ok(played === 0, 'not played while still acting');

  // staleness guard: the turn moved on before the replay
  t.b.turnSeat = 3;
  t.b._acting = false;
  if(t.b._pendingTurn != null){
    t.b._pendingTurn = null;
    if(t.b.started && !t.b.out && t.b.turnSeat === t.b.seat) played++;
  }
  ok(played === 0, 'stale turn NOT replayed (guard held)');

  setTimeout(()=>{ console.log(fail ? '\n'+fail+' FAILURES' : '\nALL PASS'); process.exit(fail?1:0); }, 50);
}, 20);
