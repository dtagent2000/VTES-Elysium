/* run137.js -- suite section 137 (v0.6.198, the hold gate) standalone, so a mutant bot can be run in isolation.
   BOTDIR = the folder holding elysium-bot.js (+ cardfx / twd json); default: bot/ (two levels up). */
const path = require('path'); const W = process.env.BOTDIR || path.join(__dirname, '..', '..');
const { Bot } = require(path.join(W, 'elysium-bot.js'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let passN = 0, failN = 0; const ok = (c, m) => { if(c){ passN++; } else { failN++; console.log('  FAIL ' + m); } };
(async () => {
  /* ================= 137) v0.6.198: A HOLD STOPS EVERY CLOCK THAT WAITS ON A HUMAN (Johan's principle, agreed with main 12 Oct) + the steal reads the human's taken line ================= */
  console.log('\n[137] a Hold on stops every clock that waits on a human and restarts it fresh on the release; the steal cap reads the human’s own taken line');
  { const mk = (extra) => { const u = new Bot(Object.assign({ server: 'ws://127.0.0.1:1', room: 'x', pass: 'x', name: 'T', persona: 'expert', deckName: 'malkavian', paceMs: 0, askSecs: 0.3, phaseSecs: 0.4, log: () => {} }, extra || {}));
      u.seat = 2; u.started = true; u.caps.tally = true; u.push = () => {}; u.sent = []; u.send = m => u.sent.push(m); u.says = []; u.say = m => u.says.push(m); u.notes = []; u.note = m => u.notes.push(m); u.chats = []; u.chat = m => u.chats.push(m); u.rows = []; u._emit = (ty, d) => u.rows.push({ ty, d });
      u.players = [{ seat: 1, name: 'Johan' }, { seat: 2, name: 'T', bot: true }, { seat: 3, name: 'Anna' }];
      u.table = { 1: { pub: { cards: [{ id: 'l1', name: 'Lisa', kind: 'crypt', zone: 'ready', blood: 4 }] } }, 3: { pub: { cards: [{ id: 'a1', name: 'Ada', kind: 'crypt', zone: 'ready', blood: 4 }] } } };
      u._opp(1).handN = 5; u._opp(3).handN = 5;   // full seat records (the pool question's amount path reaches the table model)
      const v = { id: 'v1', name: 'Sully', kind: 'crypt', zone: 'ready', locked: true, blood: 4, cap: 4 }; u.board = [v]; u.hand = [];
      u._actingVamp = { v, n: 1, played: new Set(), target: 1, kind: 'bleed' };
      return { u, v }; };
    const std1 ={ tempo: { tempo: 'standard', waitSecs: 1 } };
    const polObs = () => ({ seat: 1, who: 'Johan', verb: 'calls a political action', at: Date.now(), vamp: 'Lisa' });
    // a) the pool question (main's table: "No" -- the stage-one clock answered No and the bot said No block while the human held)
    { const { u } = mk(std1); u._obs = polObs(); u._onAnyBlocks('Johan', 'Any blocks?');
      ok(u._pq && u._pq.timer && u._pq.deadline > Date.now(), '137a fixture: the pool question runs on the 1 s clock');
      u._onSay({ who: 'Johan', i: 0 });
      ok(u._pq && u._pq.timer === null && u._pq.deadline === null, '137a a Hold on stops the pool question’s clock (timer and deadline null)');
      const st = u.status(); ok(st.state === 'held' && st.step === 'release-hold', '137a ...status() reports the hold (the ▶ filter never steps it)');
      await sleep(1400);
      ok(u._pq && !u.says.includes('No block'), '137a ...past its 1 s nothing has answered for the holder (v0.6.197: the clock said No and the bot said No block)');
      ok(!u.chats.some(c => /Holding for/.test(c)), '137a ...silently: every bot may hold its own pool question (debt 23c) -- the question is already on the table');
      u._onChat('Johan', 'yes');
      ok(u._pq && u._pq.stage === 'amt' && u._pq.timer === null, '137a an ANSWER still lands under the hold (Yes -> How much?), and the next stage is frozen too');
      ok(!(u._rt['Johan'] && u._rt['Johan'].length) && u.rows.some(r => r.ty === 'wait' && r.d.kind === 'pq' && r.d.stage === 'yn' && r.d.held === 1), '137a ...an answer across a hold is not an answer time (no Adaptive measurement); its wait row says held');
      const t1 = Date.now(); u._onSay({ who: 'Anna', i: 7 });
      ok(u._pq && u._pq.timer && u._pq.deadline >= t1 + 900, '137a the release (Anna’s Pass -- any human’s release frees the table) re-arms it FRESH: a full clock from now (' + (u._pq.deadline - t1) + ' ms)');
      await sleep(1500);
      ok(!u._pq && u.rows.some(r => r.ty === 'wait' && r.d.kind === 'pq' && r.d.stage === 'amt' && r.d.end === 'clock'), '137a ...which then runs out as usual (the clock’s 1 pool)'); }
    // b) the TYPED forms
    { const { u } = mk(std1); u._obs = polObs(); u._onAnyBlocks('Johan', 'Any blocks?');
      u._onChat('Johan', 'hold on');
      ok(u._pq.timer === null && u._held(), '137b a typed "hold on" freezes it the same way');
      u._onChat('Johan', 'carry on');
      ok(u._pq.timer && !u._held() && u._pq.deadline > Date.now() + 500, '137b ...a typed "carry on" releases it with a fresh clock');
      u._onChat('Johan', 'no'); ok(!u._pq, '137b ...and the answer closes it'); }
    // c) the combat steps (main's table: "No" -- the step timed out, wrote the next ph and moved on; the quick phrase never reached _phaseNudge)
    { const { u } = mk(std1); u._inCombat = true; u._combatOppName = 'Lisa'; u._cSide = 'b';
      const p = u._phaseStep(1, 'ask', false); await sleep(10);
      ok(u._phaseWait && u._phaseWait.timer, '137c fixture: "Any maneuvers?" waits on Johan on the 2 s step clock');
      u._onSay({ who: 'Johan', i: 0 });
      ok(u._phaseWait.timer === null && u._phaseWait.deadline === null, '137c a Hold on stops the combat step');
      ok(u.chats.filter(c => /^⏸ Holding for Johan/.test(c)).length === 1, '137c ...and the bot frozen inside the step says the hold itself (it never reaches _holdGate, so the hold was silent)');
      u._onChat('Johan', 'thinking...'); ok(u._phaseWait.timer === null, '137c ...table talk during the hold restarts nothing (it used to restart the clock once)');
      await sleep(2300); ok(u._phaseWait && !u._phaseWait.done && !u.sent.some(m => m.t === 'tally' && m.ph === 2), '137c ...past the 2 s step clock the step is still open and no next ph was written');
      const t1 = Date.now(); u._onSay({ who: 'Anna', i: 4 });
      ok(u._phaseWait && u._phaseWait.timer && u._phaseWait.deadline >= t1 + 1900 && u.chats.some(c => /^▶ Resuming/.test(c)), '137c another human’s release restarts the step FRESH (a full 2 s from now) and the bot that said the hold says Resuming');
      u._onChat('Johan', 'No'); const r = await p;
      ok(r === 'pass' && u.rows.some(x => x.ty === 'wait' && x.d.kind === 'phase' && x.d.held === 1) && !(u._rt['Johan'] && u._rt['Johan'].length), '137c the human’s answer ends it; the wait row says held, no answer time measured across the hold'); }
    // d) the damage step: Hold on is how a human finds a prevention card; a TYPED "it resolves" answers the step as the quick phrase does
    { const { u } = mk(std1); u._inCombat = true; u._combatOppName = 'Lisa'; u._cSide = 'a'; u._rnd = { dealt: 2 };
      const p = u._phaseDamage(); await sleep(10);
      u._onChat('Johan', 'hold on'); ok(u._phaseWait && u._phaseWait.step === 4 && u._phaseWait.timer === null, '137d the damage step stands under a typed hold on');
      await sleep(1300); ok(u._phaseWait && !u._phaseWait.done, '137d ...past its 1 s slider');
      u._onChat('Johan', 'it resolves'); const r = await p;
      ok(r === 'pass' && !u._held(), '137d a typed "it resolves" from the human it waits on answers the step (main: the release answers the step) and releases the hold'); }
    // e) Turn-based: the reminder and the four-minute give-up stand under a hold (main: the held human heard both "Still waiting" and "Still holding")
    { const { u } = mk({ tempo: { tempo: 'turn' }, tempoRemindMs: 150, tempoGiveUpMs: 400 });
      const p = u._askBlock('Q?'); await sleep(10);
      u._onSay({ who: 'Johan', i: 0 }); await sleep(600);
      ok(u._ask && !u.chats.some(c => /^Still waiting/.test(c)), '137e Turn-based block question under a hold: neither the reminder nor the give-up runs');
      u._onSay({ who: 'Johan', i: 1 }); const r = await p; ok(r.what === 'no', '137e ...the holder’s answer (No block) ends it'); }
    { const { u } = mk({ tempo: { tempo: 'turn' }, tempoRemindMs: 150, tempoGiveUpMs: 400 }); const rc = { heard: new Set(), paused: new Set() }; u._refCall = rc; const p = u._refPoll(rc); await sleep(10);
      u._onSay({ who: 'Johan', i: 0 });
      ok(rc.paused.has('Johan') && rc.timer === null && rc.deadline === null && u.chats.some(c => /^⏸ Holding for Johan/.test(c)), '137e my vote poll under a hold: clock, deadline and reminder stand, and I say the hold');
      await sleep(600); ok(!rc.closed && !u.chats.some(c => /^Still waiting for votes/.test(c)), '137e ...past the give-up it is still open, with no reminder');
      u._onSay({ who: 'Johan', i: 7 }); const why = await p;
      ok(/clock/.test(why) && rc.heard.has('Johan'), '137e ...after the holder’s Pass the Turn-based clock runs again from the beginning (and closes on its give-up: ' + why + ')'); }
    // f) a hold that is already live when a wait opens: the clock never starts; completion is not a clock
    { const { u } = mk(std1); u._holdBy = new Set(['Anna']); const rc = { heard: new Set(), paused: new Set() }; u._refCall = rc; const p = u._refPoll(rc); await sleep(10);
      ok(rc.timer === null && rc.deadline === null && !rc.closed, '137f a hold live when my poll opens: its clock never starts');
      await sleep(1300); ok(!rc.closed, '137f ...past the 1 s slider still open');
      rc.heard.add('Johan'); rc.heard.add('Anna'); rc.arm(); const why = await p;
      ok(/everyone has spoken/.test(why), '137f ...but completion is not a clock: when everybody has spoken the poll closes, hold or not'); }
    { const { u } = mk(std1); u._holdBy = new Set(['Anna']); u._inCombat = true; u._combatOppName = 'Lisa'; u._cSide = 'b';
      const p = u._phaseStep(1, 'ask', false); await sleep(10);
      ok(u._phaseWait && u._phaseWait.timer === null && u.chats.filter(c => /^\u23f8 Holding for Anna/.test(c)).length === 1, '137f a combat step that opens under a live hold stands and says the hold (review: it froze silently)');
      u._onChat('Johan', 'No'); await p;
      const pa = u._askBlock('Q?'); await sleep(10); ok(u.chats.some(c => /^Q\? .*\(the table is on hold \u2014 I wait for you\)$/.test(c)), '137f ...and a question asked under a hold does not promise a clock in its tail: ' + u.chats[u.chats.length - 1]);
      u._onSay({ who: 'Anna', i: 4 }); u._onChat('Johan', 'no'); await pa; }
    { const { u } = mk(std1); u._holdBy = new Set(['Anna']); const p = u._askBlock('Q?'); await sleep(10);
      ok(u._ask && u._ask.timer === null && u._ask.deadline === null, '137f a hold live when my block question opens: its clock never starts');
      await sleep(1300); ok(!!u._ask, '137f ...past the slider still open');
      const t1 = Date.now(); u._onSay({ who: 'Anna', i: 4 });
      ok(u._ask && u._ask.timer && u._ask.deadline >= t1 + 900, '137f the release starts it from the beginning');
      const r = await Promise.race([p, sleep(3000).then(() => ({ what: 'not closed after 3 s' }))]); ok(r.what === 'no' && Date.now() - t1 >= 900, '137f ...and it then runs its full clock (' + (Date.now() - t1) + ' ms, ' + r.what + ')'); if(u._ask) u._answer('no', null); }
    // g) a holder who leaves: the table hold AND my poll's pause are released, the clock restarts, and the next hold is announced again
    { const { u } = mk(std1); const rc = { heard: new Set(), paused: new Set() }; u._refCall = rc; const p = u._refPoll(rc); await sleep(10);
      u._onSay({ who: 'Anna', i: 0 });
      ok(rc.paused.has('Anna') && u._held() && u._holdAnnounced, '137g fixture: Anna holds my poll; I said the hold');
      u._releaseDeparted([{ name: 'Anna', seat: 3, online: false }]);
      ok(!u._held() && !rc.paused.size && rc.timer && !u._holdAnnounced && u.chats.some(c => /holder left the table/.test(c)), '137g a holder who left releases the hold AND my poll’s pause (it waited for her word for ever), the clock restarts, the announcement flag resets');
      u._onSay({ who: 'Johan', i: 0 }); ok(u.chats.filter(c => /^⏸ Holding for/.test(c)).length === 2, '137g ...so the NEXT hold is announced again (the flag stayed set before)');
      u._onSay({ who: 'Johan', i: 4 }); await p; }
    // h) the panel's Release hold (step) thaws exactly as It resolves does
    { const { u } = mk(std1); u._obs = polObs(); u._onAnyBlocks('Johan', 'Any blocks?'); u._onSay({ who: 'Johan', i: 0 });
      ok(u.status().step === 'release-hold', '137h fixture: held');
      const s = u.step(); ok(s.did === 'release-hold' && u._pq && u._pq.timer && u._pq.deadline > Date.now() + 500, '137h step()’s Release hold restarts the frozen clocks fresh, as It resolves does');
      u._onChat('Johan', 'no'); }
    // i) the typed hold pauses my block window like the quick phrase, and the room's stopwatch does not ring on a held table
    { const { u } = mk({ askSecs: 30, reactClockMs: 80, reactGraceMs: 100 }); u._reactSecs = 1;
      const p = u._askBlock('Q?'); await sleep(10);
      u._onChat('Johan', 'hold on');
      ok(u._ask.pausedBy.has('Johan') && u._ask.timer === null && u._ask.deadline === null, '137i a TYPED hold on pauses my block window exactly as the quick phrase does (it kept its clock)');
      await sleep(300); ok(!u.sent.some(m => m.t === 'decide'), '137i ...and the room’s stopwatch does not ring on a held table (its countdown would run on every screen)');
      ok(u.chats.filter(c => /^\u23f8 Holding for Johan/.test(c)).length === 1, '137i ...and the bot waiting in its block window says the hold (it never reaches _holdGate)');
      u._onChat('Johan', 'no'); const r = await p; ok(r.what === 'no', '137i ...the holder’s answer ends the window'); }
    // j) the holder's OWN release ends their own pause: "It resolves" from the target = let it through (it used to leave the window paused with no clock); a typed "carry on" restarts the clock fresh; somebody else's release leaves the holder's pause alone
    { const { u } = mk(std1); const p = u._askBlock('Q?'); await sleep(10);
      u._onSay({ who: 'Johan', i: 0 }); ok(u._ask.pausedBy.has('Johan') && u._ask.timer === null, '137j fixture: Johan (the target) holds my block question');
      u._onSay({ who: 'Johan', i: 4 }); const r = await Promise.race([p, sleep(2500).then(() => ({ what: 'still paused after 2.5 s' }))]);
      ok(r.what === 'no' && !u._held(), '137j his own "It resolves" ends his pause and lets the action through (v0.6.197: the window stayed paused, no clock, until he answered again; got: ' + r.what + ')');
      if(u._ask) u._answer('no', null); }
    { const { u } = mk(std1); const p = u._askBlock('Q?'); await sleep(10);
      u._onChat('Johan', 'hold on'); const t1 = Date.now(); u._onChat('Johan', 'carry on');
      ok(u._ask && !u._ask.pausedBy.size && u._ask.timer && u._ask.deadline >= t1 + 900, '137j ...his typed "carry on" restarts my window’s clock from the beginning');
      u._onChat('Johan', 'no'); await p; }
    { const { u } = mk(std1); const p = u._askBlock('Q?'); await sleep(10);
      u._onSay({ who: 'Johan', i: 0 }); const t1 = Date.now(); u._onSay({ who: 'Anna', i: 4 });
      ok(u._ask && !u._ask.pausedBy.size && u._ask.timer && u._ask.deadline >= t1 + 900 && !u._held(), '137j ...and ANYONE\u2019s release ends every holder\u2019s pause with the table hold (the same rule as _holdBy): my window\u2019s clock starts again from the beginning');
      u._onSay({ who: 'Johan', i: 1 }); const r = await p; ok(r.what === 'no', '137j ...and his No block ends it'); }
    { const { u } = mk(std1); const p = u._askBlock('Q?'); await sleep(10);
      u._onChat('Anna', 'hold on'); u._onSay({ who: 'Johan', i: 7 });
      const r = await Promise.race([p, sleep(1500).then(() => ({ what: 'not answered after 1.5 s' }))]);
      ok(r.what === 'no', '137j a cross-table human types hold on and the TARGET passes: the Pass still answers my window at once (review: her pause outlived the release and swallowed the answer; got: ' + r.what + ')');
      if(u._ask) u._answer('no', null); }
    { const { u } = mk(std1); const rc = { heard: new Set(), paused: new Set() }; u._refCall = rc; const p = u._refPoll(rc); await sleep(10);
      u._onChat('Anna', 'hold on'); ok(rc.paused.has('Anna') && rc.timer === null, '137j fixture: Anna\u2019s typed hold pauses my poll');
      const t1 = Date.now(); u._onChat('Johan', 'carry on');
      ok(!rc.paused.size && rc.timer && rc.deadline >= t1 + 900, '137j ...Johan\u2019s typed carry on releases the table and her pause: the poll\u2019s clock starts again (review: it stayed with no clock and no button)');
      const why = await Promise.race([p, sleep(2500).then(() => 'not closed after 2.5 s')]); ok(/clock/.test(why), '137j ...and the poll closes on it (' + why + ')'); if(!rc.closed) rc.done('cleanup'); }
    { const { u } = mk(std1); const rc = { heard: new Set(), paused: new Set(['Anna']) }; rc.closed = false; u._refCall = rc;
      const st = u.status(); ok(st.step === 'resolve-vote' && /Anna thinking/.test(st.waitingFor), '137j a paused poll stays steppable (status names who is thinking): ' + st.waitingFor); }
    // k) the late-bounce grace (Any bleed modifiers?) waits on the human, so it stands under a hold too
    { const { u } = mk(); let fired = 0; u._onSay({ who: 'Johan', i: 0 }); u._heldTimeout(() => { fired = Date.now(); }, 100);
      await sleep(400); ok(!fired, '137k _heldTimeout: opened under a hold, it stands');
      let tr = Date.now(); u._onSay({ who: 'Johan', i: 4 }); await sleep(500); ok(fired && fired - tr >= 95, '137k ...and from the release runs its FULL grace (' + (fired - tr) + ' ms)');
      let f4 = 0; u._heldTimeout(() => { f4 = Date.now(); }, 300); await sleep(50); u._onSay({ who: 'Johan', i: 0 }); await sleep(100); tr = Date.now(); u._onSay({ who: 'Johan', i: 4 }); await sleep(450);
      ok(f4 && f4 - tr >= 290, '137k ...a hold that starts and ends INSIDE the grace restarts it from the beginning too (review: it fired 149 ms after the release; now ' + (f4 - tr) + ' ms)');
      let f5 = 0; u._heldTimeout(() => { f5 = Date.now(); }, 200); await sleep(50); u._onSay({ who: 'Johan', i: 0 }); await sleep(400);
      ok(!f5, '137k ...a grace already running when a hold lands stands past its due time');
      tr = Date.now(); u._onSay({ who: 'Johan', i: 4 }); await sleep(350); ok(f5 && f5 - tr >= 190, '137k ...and runs its full grace from the release (' + (f5 - tr) + ' ms)');
      let f2 = 0; const h = u._heldTimeout(() => { f2 = 1; }, 50); h.cancel(); await sleep(120); ok(!f2 && !u._heldTimers.has(h), '137k ...cancel() stops it and drops it');
      let f3 = 0; u._heldTimeout(() => { f3 = 1; }, 50); await sleep(150); ok(f3 === 1 && u._heldTimers.size === 0, '137k ...no hold: an ordinary timer, gone once it fired');
      const src = require('fs').readFileSync(require('path').join(W, 'elysium-bot.js'), 'utf8');
      ok(/p\.lateTimer = this\._heldTimeout\(/.test(src) && /p\.lateTimer\.cancel\) p\.lateTimer\.cancel\(\)/.test(src), '137k the late-bounce grace runs on it (the bounce used to land while the human held)'); }
    // m) a new game thaws what the old game's hold froze (review: the frozen wait never re-armed); a second poll starts with no held mark
    { const { u } = mk(std1); u._obs = polObs(); u._onAnyBlocks('Johan', 'Any blocks?'); u._onSay({ who: 'Johan', i: 0 });
      ok(u._pq && u._pq.timer === null, '137m fixture: a pool question frozen by a hold');
      u._dispatch({ t: 'started', players: u.players }); ok(!u._held() && u._pq && u._pq.timer, '137m a fresh started clears the hold AND re-arms the frozen wait, as it would have run unheld');
      u._onChat('Johan', 'no'); }
    { const { u } = mk(std1); const rc = { heard: new Set(), paused: new Set() }; u._refCall = rc; rc._held = true; const p = u._refPoll(rc);
      ok(rc._held === false, '137m a poll run again (after a vote boost) is a fresh wait: no held mark carried over'); rc.done('test'); await p; }
    // l) main 12 Oct §3.2: the steal cap reads the human's own taken line within the combat until their board changes
    { const u = new Bot({ server: 'ws://127.0.0.1:1', room: 'x', pass: 'x', name: 'S', persona: 'expert', deckName: 'tremere', paceMs: 0, log: () => {} });
      u.seat = 2; u.started = true; u.players = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'S', bot: true }];
      u.table = { 1: { pub: { cards: [{ id: 't1', name: 'Theo Bell', kind: 'crypt', zone: 'ready', blood: 3 }] } } }; u._scanOpp(1, u.table[1].pub);
      u._combatOppName = 'Theo Bell'; u._combatAt = Date.now() - 50;
      ok(u._stealAvail() === 3, '137l round 1: the board (3)');
      await sleep(5); u._oppLastTaken = { vamp: 'Theo Bell', n: 2, now: 1, at: Date.now() };
      ok(u._stealAvail() === 1, '137l round 2 vs a human: the board still shows 3 (their client never applies combat damage) -- their own taken line says now 1, the cap is 1');
      u._scanOpp(1, u.table[1].pub); ok(u._stealAvail() === 1, '137l ...a push with the count unchanged keeps the old stamp: the line stays the fresher');
      await sleep(5); u.table[1].pub.cards[0].blood = 2; u._scanOpp(1, u.table[1].pub);
      ok(u._stealAvail() === 2, '137l ...until the board changes: the player set 2 by hand -- the board wins again');
      u._oppLastTaken = { vamp: 'Theo Bell', n: 1, now: 0, at: u._combatAt - 1000 }; ok(u._stealAvail() === 2, '137l a taken line from before this combat never stands in for the board');
      u._oppLastTaken = { vamp: 'Someone Else', n: 1, now: 0, at: Date.now() + 1000 }; ok(u._stealAvail() === 2, '137l ...nor one for another vampire');
      u.table[1].pub.cards = []; u._scanOpp(1, u.table[1].pub); u._combatOpp = () => ({ seat: 1, o: {}, rec: null, name: 'Theo Bell' }); u._oppLastTaken = { vamp: 'Theo Bell', n: 1, now: 2, at: Date.now() + 2000 };
      ok(u._stealAvail() === 2, '137l no board record at all: their own line still gives the number (was: the card’s own number)'); }
  }

  console.log(passN + '/' + failN); process.exit(failN ? 1 : 0);
})().catch(e => { console.log('ABORT ' + e.stack); process.exit(2); });
