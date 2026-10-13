#!/usr/bin/env node
'use strict';
/* ============================================================
   Elysium - server dispatch test suite (Phase 1)
   Loads the real server in Node (http/fs stubbed so it does NOT
   bind a port or touch disk), then exercises handle() + the new
   GAME_HANDLERS map. Guards the dispatch refactor.

   Run:  node test-server-dispatch.js [path/to/elysium-server.js]
   (the stub loader lives in elysium-test-harness.js)
   ============================================================ */
const path = require('path');
const { loadServer } = require('./elysium-test-harness');

const SRV = process.argv[2] || path.resolve(__dirname, 'elysium-server.js');
let S;
try { S = loadServer(SRV); }
catch (e) { console.error('FATAL: could not load the server under the harness:\n' + (e.stack || e.message)); process.exit(2); }

/* ---------- tiny test framework ---------- */
let pass = 0, fail = 0; const failed = [];
function test(name, fn){ try { fn(); pass++; console.log('  \u2713 ' + name); }
  catch (e){ fail++; failed.push(name); console.log('  \u2717 ' + name + '\n       ' + (e.message || e)); } }
function assert(c, msg){ if (!c) throw new Error(msg || 'assertion failed'); }
function eq(a, b, msg){ if (a !== b) throw new Error((msg || 'not equal') + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function fakeSock(){ return { destroyed: false, writable: true, write(){ return true; }, end(){}, destroy(){}, on(){}, once(){} }; }
function recSock(){                                     // recording socket: decodes server->client WS text frames so routing verbs can be asserted end-to-end (review Finding 5)
  const msgs = [];
  const sock = { destroyed:false, writable:true, msgs,
    write(buf){ try{
      const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
      let i = 0;
      while (i < b.length){                             // frames may be coalesced in one write
        const len7 = b[i+1] & 0x7f; let off = i+2, len = len7;
        if (len7 === 126){ len = b.readUInt16BE(i+2); off = i+4; }
        else if (len7 === 127){ len = Number(b.readBigUInt64BE(i+2)); off = i+10; }
        const txt = b.slice(off, off+len).toString('utf8');
        try{ msgs.push(JSON.parse(txt)); }catch(_e){}
        i = off + len;
      }
    }catch(_e){} return true; },
    end(){}, destroy(){}, on(){}, once(){} };
  return sock;
}

console.log('\nElysium - server dispatch tests\n');

/* === 1. the extracted map is well-formed === */
test('GAME_HANDLERS is a complete table of function handlers, one per in-game verb', () => {
  if (!S.GAME_HANDLERS) throw new Error('GAME_HANDLERS not exposed (unpatched server?)');
  const keys = Object.keys(S.GAME_HANDLERS);
  eq(keys.length, 54, 'expected 54 in-game handlers');   // 51 -> 52 at server v2.6.11: +tally (shared Block/Vote/Combat resolver counters); 52 -> 53 at srv-2.6.36: +closeRoom; 53 -> 54 at srv-2.6.43: +botcfg (the table's bot tempo)
  assert(keys.every(k => typeof S.GAME_HANDLERS[k] === 'function'), 'every handler must be a function');
  for (const t of ['log','chat','deck','draw','pass','start','give','bounty','edgePass','edgeTake','board','loadMatch','leave','recall','recalled','ctrl','tally','botcfg'])
    assert(keys.includes(t), 'missing handler: ' + t);
});

/* === 1b. tally (server v2.6.11): clamp, whole-state room store, null-clear, started-gate === */
test('tally clamps + stores whole-state on the room, clears on null-mode, and is started-gated', () => {
  const p1 = { name: 'A', sock: fakeSock() }, p2 = { name: 'B', sock: fakeSock() };
  const room = { started: true, players: [p1, p2], watchers: [] };
  const conn = { sock: p1.sock };
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'block', a: 120, b: -5, ph: 99, rd: 500, res: 1 });
  assert(room.tally && room.tally.mode === 'block', 'mode stored on the room');
  eq(room.tally.a, 99, 'a clamped to 99');
  eq(room.tally.b, 0, 'negative b clamped to 0');
  eq(room.tally.ph, 6, 'phase clamped to the last rulebook step (0-6)');   // v2.6.12
  eq(room.tally.rd, 99, 'round counter clamped to 99');   // v2.6.13
  assert(!('res' in room.tally), 'the resolve flag is transient -- relayed, never stored');   // v2.6.12
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat', a: 1, b: 2 });
  eq(room.tally.rd, 1, 'absent round counter defaults to 1');   // v2.6.13
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'nonsense', a: 3, b: 1 });
  eq(room.tally, null, 'unknown / cleared mode nulls the room tally');
  const cold = { started: false, players: [p1], watchers: [] };
  S.GAME_HANDLERS.tally(conn, cold, p1, { t: 'tally', mode: 'vote', a: 1, b: 0 });
  assert(cold.tally === undefined, 'lobby rooms ignore tally (started-gate)');
});

/* === 1c. tally (server v2.6.17): absent-field PRESERVE (same mode), fresh on mode change, +'free' === */
test('tally v2.6.17: absent fields preserve while the mode is unchanged; a mode change starts fresh; free is a real mode', () => {
  const p1 = { name: 'A', sock: fakeSock() }, p2 = { name: 'B', sock: fakeSock() };
  const room = { started: true, players: [p1, p2], watchers: [] };
  const conn = { sock: p1.sock };
  /* the race this fixes (fas A+ ladder audit): the attacker's stealth write --
     carrying its last-OBSERVED copy of b under whole-state last-write-wins --
     clobbered the defender's just-written intercept ("Intercept 0" against a
     played +1). Field-owning writers now send partials; absent = preserve. */
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'block', a: 5, b: 7 });
  eq(room.tally.a, 5, 'full-state write stores a');
  S.GAME_HANDLERS.tally(conn, room, p2, { t: 'tally', mode: 'block', b: 2 });
  eq(room.tally.a, 5, "the defender's b-only write PRESERVES the attacker's a -- the race is gone");
  eq(room.tally.b, 2, 'and lands its own b');
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'block', a: 9 });
  eq(room.tally.b, 2, "the attacker's a-only write preserves the defender's b symmetrically");
  eq(room.tally.a, 9, 'and lands its own a');
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'vote' });
  eq(room.tally.a, 0, 'a MODE CHANGE starts fresh -- stale counters never leak into a new referendum');
  eq(room.tally.b, 0, 'both sides');
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'free', a: 3, b: 1 });
  assert(room.tally && room.tally.mode === 'free', "'free' is a real stored mode -- the client shipped it in v2.6.37 but the validator was nulling it (client<->server drift, found in this audit)");
});

/* === 1d. combat state (srv-2.6.39): the round's shared fields ride the combat tally === */
test('srv-2.6.39 combat tally: rng/rl/nx/pr/sp/ce/sa/sb/xa/xb/pa/pb stored + broadcast, absent preserves, a changed rd starts a fresh round (nx carries in, set), a mode change starts fresh, other modes carry none', () => {
  const p1 = { name: 'A', sock: recSock() }, p2 = { name: 'B', sock: fakeSock() };
  const room = { started: true, players: [p1, p2], watchers: [] };
  const conn = { sock: p1.sock };
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat', a: 0, b: 0, ph: 1, rd: 1, rng: 'long' });
  eq(room.tally.rng, 'long'); eq(room.tally.pr, null, 'defaults for the fields not sent'); eq(room.tally.sp, 1);
  S.GAME_HANDLERS.tally(conn, room, p2, { t: 'tally', mode: 'combat', pr: 'continue', sb: 'Hand 1', xb: 2, pb: 1, nx: 'close' });
  eq(room.tally.rng, 'long', "B's partial write preserved A's range"); eq(room.tally.pr, 'continue'); eq(room.tally.sb, 'Hand 1'); eq(room.tally.xb, 2); eq(room.tally.pb, 1);
  const out = p1.sock.msgs[p1.sock.msgs.length - 1];
  eq(out.rng, 'long', 'the broadcast carries the whole combat state'); eq(out.pr, 'continue'); eq(out.nx, 'close'); eq(out.sb, 'Hand 1');
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat', a: 0, b: 0, ph: 0, rd: 2 });
  eq(room.tally.pr, null, 'a new round clears the press'); eq(room.tally.sb, ''); eq(room.tally.xb, 0); eq(room.tally.pb, 0);
  eq(room.tally.rng, 'close', 'the next-round range carried in'); eq(room.tally.rl, 1, '...set for the round'); eq(room.tally.nx, '');
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat', rng: 'far', pr: 'x', sp: 50, xa: -1, pa: 300, sa: '<i>'.repeat(30) });
  eq(room.tally.rng, 'close'); eq(room.tally.pr, null); eq(room.tally.sp, 9); eq(room.tally.xa, 0); eq(room.tally.pa, 99); assert(room.tally.sa.length <= 40 && !/[<>]/.test(room.tally.sa), 'label hygiene');
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'block', a: 1 });
  assert(!('rng' in room.tally), 'a block tally stores no combat fields'); const ob = p1.sock.msgs[p1.sock.msgs.length - 1]; assert(!('pr' in ob), '...and broadcasts none');
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat' }); eq(room.tally.rng, 'close', 'a mode change starts fresh'); eq(room.tally.rl, 0);
});

test('srv-2.6.40 a new combat round zeroes an ABSENT a/b (per-round damage; the bot writes rd:2 alone); a write that carries them wins; the same round keeps them', () => {
  const p1 = { name: 'A', sock: fakeSock() }; const room = { started: true, players: [p1], watchers: [] }; const conn = { sock: p1.sock };
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat', a: 3, b: 2, rd: 1 });
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat', ph: 4 }); eq(room.tally.a, 3, 'same round: kept'); eq(room.tally.b, 2);
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat', rd: 2 }); eq(room.tally.a, 0, 'new round: a zeroed'); eq(room.tally.b, 0, '...b zeroed');
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat', rd: 3, a: 4 }); eq(room.tally.a, 4, 'carried a wins'); eq(room.tally.b, 0);
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'block', a: 1 }); S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'block', rd: 2 }); eq(room.tally.a, 1, 'other modes: rd never zeroes');
});

test('srv-2.6.41 combat tally: ga/gb (aggravated this round) are cleared by a new round, ea/eb (every-round environmental damage) SURVIVE it; a mode change clears both; broadcast carries them', () => {
  const p1 = { name: 'A', sock: recSock() }; const room = { started: true, players: [p1], watchers: [] }; const conn = { sock: p1.sock };
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat', rd: 1, ga: 2, ea: 1, eb: 150 });
  eq(room.tally.ga, 2); eq(room.tally.ea, 1); eq(room.tally.eb, 99, 'clamped');
  const out = p1.sock.msgs[p1.sock.msgs.length - 1]; eq(out.ga, 2); eq(out.ea, 1);
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat', rd: 2 }); eq(room.tally.ga, 0, 'aggravated: per round'); eq(room.tally.ea, 1, 'every-round damage survives the new round'); eq(room.tally.eb, 99);
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'block' }); S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat' }); eq(room.tally.ea, 0, 'a mode change clears it');
});

test('srv-2.6.42 nothing outlives a turn: a pass clears room.tally and broadcasts the close BEFORE the turn (so a turn that goes to a bot starts clean too)', () => {
  const p1 = { name: 'A', sock: recSock() }, p2 = { name: 'B', sock: recSock() };
  const room = { started: true, players: [p1, p2], watchers: [], turnSeat: 1 };
  S.GAME_HANDLERS.tally({ sock: p1.sock }, room, p1, { t: 'tally', mode: 'combat', a: 2, rd: 1, pr: 'continue' });
  assert(room.tally && room.tally.mode === 'combat');
  const n0 = p2.sock.msgs.length; S.GAME_HANDLERS.pass({ sock: p1.sock }, room, p1, { t: 'pass' });
  eq(room.tally, null, 'the resolver is cleared on the server');
  const after = p2.sock.msgs.slice(n0).map(m => m.t + (m.t === 'tally' ? ':' + m.mode : ''));
  const it = after.indexOf('tally:null'), iu = after.indexOf('turn'); assert(it >= 0 && iu > it, 'tally close broadcast before the turn: ' + after.join(','));
  const n1 = p2.sock.msgs.length; S.GAME_HANDLERS.pass({ sock: p2.sock }, room, p2, { t: 'pass' });
  eq(p2.sock.msgs.slice(n1).filter(m => m.t === 'tally').length, 0, 'no tally open -> no extra broadcast');
});

/* === 1c. duel map (server v2.6.14): per-seat merge, leave, survives counter pushes, drops on mode exit === */
test('duel combatants merge per seat, survive counter pushes, leave on null, drop when combat ends', () => {
  const p1 = { name: 'A', sock: fakeSock() }, p2 = { name: 'B', sock: fakeSock() };
  const room = { started: true, players: [p1, p2], watchers: [] };
  const conn = { sock: p1.sock };
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat', a: 0, b: 0, duelCid: 'c1'.repeat(20), duelName: 'Dominique' });
  assert(room.tally.duel && room.tally.duel[1], 'seat 1 announced');
  eq(room.tally.duel[1].cid.length, 16, 'cid length-capped');
  S.GAME_HANDLERS.tally({ sock: p2.sock }, room, p2, { t: 'tally', mode: 'combat', a: 0, b: 0, duelCid: 'c2', duelName: 'Ayelech' });
  assert(room.tally.duel[1] && room.tally.duel[2], 'both seats merged -- B\'s announce kept A\'s');
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat', a: 3, b: 1 });
  assert(room.tally.duel[1] && room.tally.duel[2], 'a plain counter push preserves the map');
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'combat', a: 3, b: 1, duelCid: null });
  assert(!room.tally.duel[1] && room.tally.duel[2], 'duelCid:null leaves; the other seat stays');
  S.GAME_HANDLERS.tally(conn, room, p1, { t: 'tally', mode: 'vote', a: 1, b: 0 });
  assert(!('duel' in room.tally), 'leaving combat drops the duel map');
});

/* === 2. handle() still routes the staged pre-dispatch (create) end-to-end === */
test('handle() routes the pre-dispatch "create" verb (a room is registered and the conn is seated)', () => {
  if (!S.handle || !S.rooms) throw new Error('handle/rooms not exposed');
  S.rooms.clear();
  const conn = { ip: '127.0.0.1', sock: fakeSock() };
  S.handle(conn, JSON.stringify({ t: 'create', room: 'TestRoom', name: 'Alice' }));
  eq(S.rooms.size, 1, 'create did not register a room');
  const room = [...S.rooms.values()][0];
  eq(room.players.length, 1, 'create did not seat exactly one player');
  assert(conn.room === room && conn.player === room.players[0], 'conn was not bound to the new room/seat');
});

/* === 3. a seated connection ignores unknown / malformed verbs without throwing === */
test('seated handle() ignores an unknown verb and malformed input (dispatch miss)', () => {
  S.rooms.clear();
  const conn = { ip: '127.0.0.1', sock: fakeSock() };
  S.handle(conn, JSON.stringify({ t: 'create', room: 'R2', name: 'Bob' }));   // seats conn
  const before = S.rooms.size;
  S.handle(conn, JSON.stringify({ t: '__no_such_verb__' }));   // dispatch miss -> no-op
  eq(S.rooms.size, before, 'unknown verb mutated rooms');
  S.handle(conn, 'not json');                                  // parse failure -> swallowed, no throw
});

/* === 4. tunnel (loopback) password-fails are throttled PER ROOM, not per shared IP === */
test('failed loopback joins throttle per-room, so one room cannot lock out another over a tunnel', () => {
  if (!S.ipFails) throw new Error('ipFails not exposed by harness (unpatched?)');
  S.rooms.clear(); S.ipFails.clear();
  const FAIL_MAX = S.FAIL_MAX || 5;
  // two password-protected rooms, both created over loopback (as every tunnel player appears)
  S.handle({ ip:'127.0.0.1', sock: fakeSock() }, JSON.stringify({ t:'create', room:'RoomA', name:'HostA', pass:'secretA' }));
  S.handle({ ip:'127.0.0.1', sock: fakeSock() }, JSON.stringify({ t:'create', room:'RoomB', name:'HostB', pass:'secretB' }));
  // a loopback connection hammers RoomA with wrong passwords up to the cap
  const bad = { ip:'127.0.0.1', sock: fakeSock() };
  for (let i = 0; i < FAIL_MAX; i++) S.handle(bad, JSON.stringify({ t:'join', room:'RoomA', name:'X', pass:'nope' }));
  eq((S.ipFails.get('room:RoomA') || []).length, FAIL_MAX, 'RoomA strikes were not counted under its own room key');
  // the shared loopback IP must NOT be a key (that is exactly what would cross-lock every tunnel room)...
  assert(!S.ipFails.has('127.0.0.1'), 'loopback IP was used as a key — would lock out all tunnel rooms at once');
  // ...and a different room is wholly untouched
  assert(!S.ipFails.has('room:RoomB'), 'RoomB must be unaffected by RoomA brute-force');
});

/* === 5. real-IP password-fails are still throttled PER IP (internet protection intact) === */
test('failed joins from a real address still throttle per-IP, preserving brute-force protection', () => {
  S.rooms.clear(); S.ipFails.clear();
  S.handle({ ip:'127.0.0.1', sock: fakeSock() }, JSON.stringify({ t:'create', room:'RoomC', name:'HostC', pass:'secretC' }));
  const bad = { ip:'203.0.113.7', sock: fakeSock() };   // a real, routable (non-loopback) address
  S.handle(bad, JSON.stringify({ t:'join', room:'RoomC', name:'Y', pass:'wrong' }));
  eq((S.ipFails.get('203.0.113.7') || []).length, 1, 'a real IP must be keyed by its own address');
  assert(!S.ipFails.has('room:RoomC'), 'real-IP fails must not fall under the room key');
});

/* ---------- summary ---------- */

/* === 6. give -> recall LOOPBACK (review Finding 5): the cross-board family's behaviour, end-to-end === */
test('give->recall loopback: gid preserved to the holder, recall routed back, err echoes cid (v2.5.56)', () => {
  S.rooms.clear();
  const cA = { ip:'127.0.0.1', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'LB', name:'Alice' }));
  const cB = { ip:'127.0.0.2', sock: recSock() };
  S.handle(cB, JSON.stringify({ t:'join', room:'LB', pass:'', name:'Bob' }));
  const room = [...S.rooms.values()][0];
  eq(room.players.length, 2, 'both seats filled');
  cA.sock.msgs.length = 0; cB.sock.msgs.length = 0;
  // A gives a card to seat 2 with a giver-assigned gid
  S.handle(cA, JSON.stringify({ t:'give', seat:2, gid:'gLB1', rx:0.5, ry:0.5, card:{ name:'Ghoul Retainer', kind:'lib' } }));
  const given = cB.sock.msgs.find(x => x.t === 'given');
  assert(given, 'holder never received the given message');
  eq(given.gid, 'gLB1', 'giver-assigned gid must reach the holder verbatim');
  assert(cA.sock.msgs.some(x => x.t === 'gave'), 'giver never received the gave ack');
  // A recalls it: the holder must be told which cid
  cB.sock.msgs.length = 0;
  S.handle(cA, JSON.stringify({ t:'recall', seat:2, cid:'gLB1' }));
  const rc = cB.sock.msgs.find(x => x.t === 'recall');
  assert(rc, 'holder never received the recall');
  eq(rc.cid, 'gLB1', 'recall must carry the same shared cid');
  eq(rc.fromSeat, 1, 'recall must name the owner seat (server-derived)');
  // B confirms: the owner gets the recalled reply
  cA.sock.msgs.length = 0;
  S.handle(cB, JSON.stringify({ t:'recalled', seat:1, cid:'gLB1', ok:true, name:'Ghoul Retainer', kind:'lib' }));
  const rd = cA.sock.msgs.find(x => x.t === 'recalled');
  assert(rd && rd.ok === true && rd.cid === 'gLB1', 'owner never received the ok confirmation with the shared cid');
  // v2.5.56: a bounce (offline holder) must echo the cid so the owner clears only that guard entry
  room.players[1].off = true;
  cA.sock.msgs.length = 0;
  S.handle(cA, JSON.stringify({ t:'recall', seat:2, cid:'gLB2' }));
  const er = cA.sock.msgs.find(x => x.t === 'err');
  assert(er, 'offline bounce never produced an err');
  eq(er.cid, 'gLB2', 'the err must echo WHICH recall failed (v2.5.56 targeted guard clear)');
});

/* === 7. v2.5.64 referee kit: the pass sender-guard + hostPass, end-to-end === */
test('pass is guarded (only the turn seat may fire it) and hostPass advances a stuck seat', () => {
  S.rooms.clear();
  const cA = { ip:'127.0.0.1', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'RK', name:'Alice' }));
  const cB = { ip:'127.0.0.2', sock: recSock() };
  S.handle(cB, JSON.stringify({ t:'join', room:'RK', pass:'', name:'Bob' }));
  const room = [...S.rooms.values()][0];
  room.started = true; room.turnSeat = 1;                       // simulate a started game, Alice's turn
  // Bob (seat 2) tries to pass -> guarded err, turn untouched
  cB.sock.msgs.length = 0;
  S.handle(cB, JSON.stringify({ t:'pass' }));
  assert(cB.sock.msgs.some(x => x.t === 'err'), 'off-turn pass must err');
  eq(room.turnSeat, 1, 'off-turn pass must not move the turn');
  // Alice passes legitimately -> turn advances to 2
  S.handle(cA, JSON.stringify({ t:'pass' }));
  eq(room.turnSeat, 2, 'the turn seat itself must still be able to pass');
  // Bob (non-host) tries hostPass -> host-gated err
  cB.sock.msgs.length = 0;
  S.handle(cB, JSON.stringify({ t:'hostPass', seat:2 }));
  assert(cB.sock.msgs.some(x => x.t === 'err'), 'non-host hostPass must err');
  eq(room.turnSeat, 2, 'non-host hostPass must not move the turn');
  // Host aims hostPass at the WRONG seat (not the turn holder) -> err
  cA.sock.msgs.length = 0;
  S.handle(cA, JSON.stringify({ t:'hostPass', seat:1 }));
  assert(cA.sock.msgs.some(x => x.t === 'err'), 'hostPass at a non-turn seat must err (unstick tool, not a turn-setter)');
  eq(room.turnSeat, 2, 'wrong-seat hostPass must not move the turn');
  // Host unsticks the actual turn seat -> advances, turn broadcast lands on the other client
  cB.sock.msgs.length = 0;
  S.handle(cA, JSON.stringify({ t:'hostPass', seat:2 }));
  eq(room.turnSeat, 1, 'hostPass must advance from the stuck seat via nextLiveSeat');
  assert(cB.sock.msgs.some(x => x.t === 'turn' && x.seat === 1), 'hostPass must broadcast the new turn');
});

/* === 8. v2.5.64 tournament lock: deck/vp err after start; host verbs unaffected === */
test('tournLock blocks mid-match deck swaps and vp self-adjust, but not the bounty path', () => {
  S.rooms.clear();
  const cA = { ip:'127.0.0.1', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'TL', name:'Alice', lobby:true, tournLock:true }));   // lobby:true — otherwise create starts the room immediately (started = !m.lobby) and the lock would bite the "pre-start" upload below
  const room = [...S.rooms.values()][0];
  assert(room.tournLock === true, 'create must store tournLock');
  const cB = { ip:'127.0.0.2', sock: recSock() };
  S.handle(cB, JSON.stringify({ t:'join', room:'TL', pass:'', name:'Bob' }));
  const bob = room.players[1];
  // pre-start deck upload must still work (the lock bites only after start)
  S.handle(cB, JSON.stringify({ t:'deck', library:[{name:'Govern the Unaligned',qty:30},{name:'Deflection',qty:30}], crypt:[{name:'Gratiano',qty:12}], name:'D' }));   // expandDeck expects {name,qty} objects (the client's wire shape), not bare strings. Legal-sized since v2.6.25's amend: tournLock rooms now ALSO enforce 12+/60-90 on upload, so the old 1/1 fixture would be refused for size, not for the lock
  assert(bob.game && bob.game.deckLib.length === 60, 'pre-start deck upload must pass under the lock (legal size)');
  room.started = true; room.turnSeat = 1;
  // mid-match deck swap -> err, stored deck untouched
  cB.sock.msgs.length = 0;
  S.handle(cB, JSON.stringify({ t:'deck', library:[{name:'Bum Rush',qty:1}], crypt:[{name:'Gratiano',qty:1}], name:'Swap' }));
  assert(cB.sock.msgs.some(x => x.t === 'err'), 'mid-match deck under tournLock must err');
  eq(bob.game.deckName, 'D', 'the stored deck must be untouched by a locked swap attempt');
  // vp self-adjust -> err, value untouched
  cB.sock.msgs.length = 0;
  S.handle(cB, JSON.stringify({ t:'vp', d: 2 }));
  assert(cB.sock.msgs.some(x => x.t === 'err'), 'vp self-adjust under tournLock must err');
  eq(bob.vp || 0, 0, 'vp must be unchanged');
  // the legitimate scoring path (bounty) still works: Bob ousts, Alice (predator) gets +1 VP
  S.handle(cB, JSON.stringify({ t:'bounty' }));
  eq(room.players[0].vp, 1, 'bounty must still award the predator +1 VP under the lock');
  assert(bob.out === true, 'bounty must still mark the seat out');
  // self-unoust -> err under the lock; the seat stays out
  cB.sock.msgs.length = 0;
  S.handle(cB, JSON.stringify({ t:'unoust' }));
  assert(cB.sock.msgs.some(x => x.t === 'err'), 'self-unoust under tournLock must err');
  assert(bob.out === true, 'the seat must stay out');
});

/* === 9. v2.5.64: tool:seating is lobby-only (unconditional, no flag needed) === */
test('tool:seating errs after start and leaves seats/vp/out untouched', () => {
  S.rooms.clear();
  const cA = { ip:'127.0.0.1', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'SG', name:'Alice' }));
  const cB = { ip:'127.0.0.2', sock: recSock() };
  S.handle(cB, JSON.stringify({ t:'join', room:'SG', pass:'', name:'Bob' }));
  const room = [...S.rooms.values()][0];
  room.started = true; room.turnSeat = 2;
  room.players[0].vp = 1.5; room.players[1].out = true;         // a mid-game standings snapshot
  cB.sock.msgs.length = 0;
  S.handle(cB, JSON.stringify({ t:'tool', kind:'seating' }));
  assert(cB.sock.msgs.some(x => x.t === 'err'), 'mid-match seating must err');
  eq(room.players[0].name, 'Alice', 'seat order must be untouched');
  eq(room.players[0].vp, 1.5, 'vp must survive a blocked seating attempt');
  assert(room.players[1].out === true, 'out flags must survive');
  eq(room.turnSeat, 2, 'turnSeat must be untouched');
});

/* === 10. v2.5.65 resource ledger: board-push diffs are recorded server-side and served via ledgerGet === */
test('the ledger records pool/card/lock/blood deltas from board pushes, skips the baseline and lobby, and ledgerGet serves them', () => {
  S.rooms.clear();
  const cA = { ip:'127.0.0.1', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'LG', name:'Alice', lobby:true }));
  const cB = { ip:'127.0.0.2', sock: recSock() };
  S.handle(cB, JSON.stringify({ t:'join', room:'LG', pass:'', name:'Bob' }));
  const room = [...S.rooms.values()][0];
  // a LOBBY push must not generate rows (setup noise)
  S.handle(cB, JSON.stringify({ t:'board', pub:{ pool:30, cards:[] } }));
  eq((room.ledger || []).length, 0, 'lobby pushes must not reach the ledger');
  room.started = true; room.turnSeat = 1;
  // first started push = baseline for the diff that follows (p.pub was set in the lobby, so this one DOES diff pool 30->30 = nothing)
  S.handle(cB, JSON.stringify({ t:'board', pub:{ pool:30, cards:[{ id:'c1', name:'Gratiano', kind:'crypt', zone:'ready', x:10, y:10 }] } }));
  const afterFirst = (room.ledger || []).length;
  assert(afterFirst >= 1, 'a new card entering play must be recorded');
  // second push: pool down 3, the card locks and gains blood
  S.handle(cB, JSON.stringify({ t:'board', pub:{ pool:27, cards:[{ id:'c1', name:'Gratiano', kind:'crypt', zone:'ready', x:10, y:10, locked:true, blood:2 }] } }));
  const lines = (room.ledger || []).map(r => r.line);
  assert(lines.some(l => /pool 30 \u2192 27 \(-3\)/.test(l)), 'the pool delta must be recorded (got: ' + lines.join(' | ') + ')');
  assert(lines.some(l => /locked Gratiano/.test(l)), 'the lock must be recorded');
  assert(lines.some(l => /Gratiano: blood 0 \u2192 2/.test(l)), 'the blood delta must be recorded');
  assert(room.ledger.every(r => r.seat === 2 && r.name === 'Bob'), 'rows must be attributed to the pushing seat');
  // ledgerGet: the requester (Alice) receives rows + total
  cA.sock.msgs.length = 0;
  S.handle(cA, JSON.stringify({ t:'ledgerGet' }));
  const rep = cA.sock.msgs.find(x => x.t === 'ledger');
  assert(rep, 'ledgerGet never answered');
  eq(rep.total, room.ledger.length, 'total must match the ring size');
  assert(Array.isArray(rep.rows) && rep.rows.length === room.ledger.length, 'all rows expected under the 300 cap');
});

/* === 11. v2.5.66: ledger rows stream live to everyone EXCEPT the pusher === */
test('board-push ledger rows broadcast as ledgerLive to the other seats only', () => {
  S.rooms.clear();
  const cA = { ip:'127.0.0.1', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'LL', name:'Alice', lobby:true }));
  const cB = { ip:'127.0.0.2', sock: recSock() };
  S.handle(cB, JSON.stringify({ t:'join', room:'LL', pass:'', name:'Bob' }));
  const room = [...S.rooms.values()][0];
  S.handle(cB, JSON.stringify({ t:'board', pub:{ pool:30, cards:[] } }));      // lobby baseline
  room.started = true; room.turnSeat = 1;
  cA.sock.msgs.length = 0; cB.sock.msgs.length = 0;
  S.handle(cB, JSON.stringify({ t:'board', pub:{ pool:27, cards:[] } }));      // Bob pays 3 pool
  const toA = cA.sock.msgs.find(x => x.t === 'ledgerLive');
  assert(toA, 'the OTHER seat must receive ledgerLive');
  eq(toA.seat, 2, 'the batch must carry the acting seat');
  eq(toA.name, 'Bob', 'the batch must carry the acting name');
  assert(Array.isArray(toA.rows) && toA.rows.some(l => /pool 30 \u2192 27/.test(l)), 'the rows must carry the delta (got: ' + JSON.stringify(toA.rows) + ')');
  assert(!cB.sock.msgs.some(x => x.t === 'ledgerLive'), 'the PUSHER must not receive their own ledgerLive');
  // vp self-adjust streams too
  cA.sock.msgs.length = 0;
  S.handle(cB, JSON.stringify({ t:'vp', d: 1 }));
  const vpLive = cA.sock.msgs.find(x => x.t === 'ledgerLive');
  assert(vpLive && vpLive.rows.some(l => /adjusted own VP/.test(l)), 'the vp row must stream live');
});

/* === 12. v2.5.67: an undo-flagged push prefixes its rows in BOTH the ring and the stream === */
test('board push with undo:true marks the batch; an unflagged push stays unmarked', () => {
  S.rooms.clear();
  const cA = { ip:'127.0.0.1', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'UM', name:'Alice', lobby:true }));
  const cB = { ip:'127.0.0.2', sock: recSock() };
  S.handle(cB, JSON.stringify({ t:'join', room:'UM', pass:'', name:'Bob' }));
  const room = [...S.rooms.values()][0];
  S.handle(cB, JSON.stringify({ t:'board', pub:{ pool:30, cards:[] } }));          // lobby baseline
  room.started = true; room.turnSeat = 1;
  S.handle(cB, JSON.stringify({ t:'board', pub:{ pool:27, cards:[] } }));          // normal action: pay 3
  cA.sock.msgs.length = 0;
  S.handle(cB, JSON.stringify({ t:'board', pub:{ pool:30, cards:[] }, undo:true }));   // undo it
  const live = cA.sock.msgs.find(x => x.t === 'ledgerLive');
  assert(live && live.rows.length, 'the undo push must still stream');
  assert(live.rows.every(l => l.startsWith('\u21a9 undo: ')), 'streamed rows must carry the undo prefix (got: ' + JSON.stringify(live.rows) + ')');
  assert(room.ledger.some(r => r.line.startsWith('\u21a9 undo: ') && /pool 27 \u2192 30/.test(r.line)), 'the RING must hold the same prefixed line');
  const unmarked = room.ledger.find(r => /pool 30 \u2192 27/.test(r.line));
  assert(unmarked && !unmarked.line.startsWith('\u21a9'), 'the earlier normal push must be unmarked');
});

/* === 13. v2.5.68 L1: the server door === */
test('the door: locked server rejects create/join without srvPass, hello unlocks the connection', () => {
  S.rooms.clear(); S.ipFails.clear();
  S.CFG.srvPassHash = null;
  const sha = require('crypto').createHash('sha256').update('hemligt', 'utf8').digest('hex');
  S.CFG.srvPassHash = sha;
  const c = { ip:'10.0.0.5', sock: recSock() };
  S.handle(c, JSON.stringify({ t:'create', room:'D1', name:'Alice' }));
  assert(c.sock.msgs.some(x => x.t === 'err' && /password/i.test(x.msg)), 'doored create must err');
  eq(S.rooms.size, 0, 'no room may exist behind a locked door');
  c.sock.msgs.length = 0;
  S.handle(c, JSON.stringify({ t:'hello', srvPass:'fel' }));
  assert(c.sock.msgs.some(x => x.t === 'err'), 'wrong srvPass in hello must err');
  c.sock.msgs.length = 0;
  S.handle(c, JSON.stringify({ t:'hello', srvPass:'hemligt' }));
  const rl = c.sock.msgs.find(x => x.t === 'roomList');
  assert(rl && rl.ok === true && rl.door === true, 'right srvPass must answer an unlocked roomList');
  S.handle(c, JSON.stringify({ t:'create', room:'D1', name:'Alice', lobby:true }));
  eq(S.rooms.size, 1, 'the authed connection may now create');
  // deep-link path: a FRESH connection with srvPass directly on join
  const c2 = { ip:'10.0.0.6', sock: recSock() };
  S.handle(c2, JSON.stringify({ t:'join', room:'D1', pass:'', name:'Bob', srvPass:'hemligt' }));
  assert([...S.rooms.values()][0].players.length === 2, 'join carrying srvPass must pass the door without hello');
  S.CFG.srvPassHash = null;
});

/* === 14. v2.5.68 L1: admin — create policy + inheriting a host gate === */
test('create-policy admin gates creation; hello-granted admin inherits host verbs', () => {
  S.rooms.clear(); S.ipFails.clear();
  const sha = require('crypto').createHash('sha256').update('nyckel', 'utf8').digest('hex');
  S.CFG.adminPassHash = sha; S.CFG.createPolicy = 'admin';
  const c = { ip:'10.0.0.7', sock: recSock() };
  S.handle(c, JSON.stringify({ t:'create', room:'A1', name:'Alice', lobby:true }));
  assert(c.sock.msgs.some(x => x.t === 'err' && /admin/i.test(x.msg)), 'anyone-create must err under admin policy');
  S.handle(c, JSON.stringify({ t:'hello', admin:'nyckel' }));
  S.handle(c, JSON.stringify({ t:'create', room:'A1', name:'Alice', lobby:true }));
  eq(S.rooms.size, 1, 'admin may create');
  // a NON-host admin runs a host verb: Bob joins as plain player in a second conn, admin kicks via hostSetClock gate path
  const room = [...S.rooms.values()][0];
  const cB = { ip:'10.0.0.8', sock: recSock() };
  S.handle(cB, JSON.stringify({ t:'join', room:'A1', pass:'', name:'Bob' }));
  S.handle(cB, JSON.stringify({ t:'hello', admin:'nyckel' }));            // Bob presents the keys too
  room.started = true; room.turnSeat = 1;
  cB.sock.msgs.length = 0;
  S.handle(cB, JSON.stringify({ t:'hostPass', seat:1 }));                 // Bob is NOT hostToken -- admin inheritance must open the gate
  assert(!cB.sock.msgs.some(x => x.t === 'err' && /host/i.test(x.msg)), 'admin must inherit the host gate');
  eq(room.turnSeat, 2, 'the admin-driven hostPass must advance the turn');
  S.CFG.adminPassHash = null; S.CFG.createPolicy = 'anyone';
});

/* === srv-2.6.36: CLOSE TABLE — the verb, the human census, the bot grace === */
test('srv-2.6.36: closeRoom is host-gated, tells everyone why, deletes the room and closes every socket', () => {
  S.rooms.clear(); S.ipFails.clear();
  const cA = { ip:'10.1.0.1', sock: recSock() };
  const cB = { ip:'10.1.0.2', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'C1', name:'Alice', lobby:true }));
  S.handle(cB, JSON.stringify({ t:'join', room:'C1', pass:'', name:'Bob' }));
  eq(S.rooms.size, 1, 'room up with two players');
  cB.sock.msgs.length = 0;
  S.handle(cB, JSON.stringify({ t:'closeRoom' }));                       // Bob is not the host
  assert(cB.sock.msgs.some(x => x.t === 'err' && /host/i.test(x.msg)), 'a non-host is refused');
  eq(S.rooms.size, 1, 'and the room survives the attempt');
  cA.sock.msgs.length = 0; cB.sock.msgs.length = 0;
  S.handle(cA, JSON.stringify({ t:'closeRoom' }));
  const bye = cB.sock.msgs.find(x => x.t === 'closed');
  assert(bye, 'every client hears `closed` -- they must know why, and must not rejoin a room that is gone');
  assert(/Alice/.test(bye.msg) && /closed the table/i.test(bye.msg), 'named and explained: ' + JSON.stringify(bye.msg));
  assert(cA.sock.msgs.some(x => x.t === 'closed'), 'the host hears it too');
  eq(S.rooms.size, 0, 'the room is gone as an INTENT, not by emptying');
});
test('srv-2.6.36: humansLeft counts roster seats, not sockets -- and the last human LEAVING closes a bot table', () => {
  S.rooms.clear(); S.ipFails.clear();
  const cA = { ip:'10.1.0.3', sock: recSock() };
  const cBot = { ip:'10.1.0.4', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'C2', name:'Alice', lobby:true }));
  S.handle(cBot, JSON.stringify({ t:'join', room:'C2', pass:'', name:'B1', bot:true }));
  const room = [...S.rooms.values()][0];
  eq(room.players.length, 2, 'a human and a bot');
  eq(S.humansLeft(room), 1, 'the bot does not count as a human');
  // a DISCONNECT is not a leave: the seat stays, the room stays, the reconnect window holds
  S.drop(cA);
  eq(S.rooms.size, 1, 'a dropped connection keeps its room -- that is what the reconnect window is for');
  eq(S.humansLeft([...S.rooms.values()][0]), 1, 'the disconnected human is still a roster seat');
  // a real leave takes the seat with it
  const cA2 = { ip:'10.1.0.3', sock: recSock() };
  S.handle(cA2, JSON.stringify({ t:'join', room:'C2', pass:'', name:'Alice' }));
  S.handle(cA2, JSON.stringify({ t:'leave' }));
  eq(S.rooms.size, 0, 'the last human left and only bots were seated -- the room closes now, not in an hour');
  assert(cBot.sock.msgs.some(x => x.t === 'closed'), 'the bots are told, then disconnected');
});
test('srv-2.6.36: a room of humans is untouched by the bot rules', () => {
  S.rooms.clear(); S.ipFails.clear();
  const cA = { ip:'10.1.0.5', sock: recSock() };
  const cB = { ip:'10.1.0.6', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'C3', name:'Alice', lobby:true }));
  S.handle(cB, JSON.stringify({ t:'join', room:'C3', pass:'', name:'Bob' }));
  S.handle(cA, JSON.stringify({ t:'leave' }));
  eq(S.rooms.size, 1, 'Bob is a human: his room lives on exactly as before');
  eq(S.humansLeft([...S.rooms.values()][0]), 1);
  S.handle(cB, JSON.stringify({ t:'leave' }));
  eq(S.rooms.size, 0, 'and the ordinary empty rule still closes it');
});

/* === 15. v2.5.68 L2: roomList content — lock icon, counts, anon names === */
test('buildRoomList reports lock/started/counts and honours anon', () => {
  S.rooms.clear(); S.ipFails.clear();
  const cA = { ip:'10.0.0.9', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'R1', name:'Alice', pass:'pw', lobby:true, anon:true }));
  const cB = { ip:'10.0.0.10', sock: recSock() };
  S.handle(cB, JSON.stringify({ t:'join', room:'R1', pass:'pw', name:'Bob' }));
  const list = S.buildRoomList();
  eq(list.length, 1, 'one room listed');
  const r = list[0];
  assert(r.locked === true, 'a password room must carry locked');
  eq(r.players, 2, 'seat count');
  assert(r.lobby === true && r.started === false, 'lobby state');
  assert(r.names.length === 1 && r.names[0] === 'Bob', 'anon creator must be omitted from names (got: ' + JSON.stringify(r.names) + ')');
});

/* === srv-2.6.33: the room list carries the table shape === */
test('srv-2.6.33: roomList entries carry board + helpers, derived from the room as created', () => {
  S.rooms.clear(); S.ipFails.clear();
  const mk = (room, extra) => { const c = { ip:'10.0.0.20', sock: recSock() }; S.handle(c, JSON.stringify(Object.assign({ t:'create', room, name:'Host', lobby:true }, extra))); };
  mk('Classic-T', { boardMode:'classic', helperPolicy:{ settings:{}, allowLocal:false, tournament:true } });
  mk('Struct-All', { boardMode:'structured', helperPolicy:{ settings:{}, allowLocal:false, tournament:false } });
  mk('Classic-Local', { boardMode:'classic', helperPolicy:{ settings:{}, allowLocal:true, tournament:false } });
  mk('Default', {});
  const by = {}; for (const r of S.buildRoomList()) by[r.room] = r;
  eq(by['Classic-T'].board, 'classic'); eq(by['Classic-T'].helpers, 'tournament');
  eq(by['Struct-All'].board, 'structured'); eq(by['Struct-All'].helpers, 'all');
  eq(by['Classic-Local'].board, 'classic'); eq(by['Classic-Local'].helpers, 'local');
  eq(by['Default'].board, 'structured', 'no boardMode = structured (the pre-existing default)'); eq(by['Default'].helpers, 'local', 'no policy = local (cleanHelperPolicy default)');
  eq(S.helperMode(null), 'local'); eq(S.helperMode({ tournament:true, allowLocal:false }), 'tournament'); eq(S.helperMode({ allowLocal:false }), 'all');
});

/* === srv-2.6.35: the per-room referee === */
test('srv-2.6.35: a room created with refPass carries ref in the list; a spectator joining with the key becomes the referee (watches, never plays) and reaches the host verbs; wrong or absent keys err with a strike', () => {
  S.rooms.clear(); S.ipFails.clear(); S.CFG.srvPassHash = null; S.CFG.adminPassHash = null;
  const host = { ip:'10.0.0.40', sock: recSock() };
  S.handle(host, JSON.stringify({ t:'create', room:'Cup', name:'Alice', lobby:true, refPass:'whistle' }));
  const plain = { ip:'10.0.0.41', sock: recSock() };
  S.handle(plain, JSON.stringify({ t:'create', room:'Casual', name:'Zed', lobby:true }));
  const by = {}; for (const r of S.buildRoomList()) by[r.room] = r;
  eq(by['Cup'].ref, true, 'the room has a referee password'); eq(by['Casual'].ref, undefined, 'no key, no flag');
  // wrong key: err + a strike on the room-password key; no key on a room without one: a plain err
  const bad = { ip:'10.0.0.42', sock: recSock() };
  S.handle(bad, JSON.stringify({ t:'join', room:'Cup', pass:'', name:'Mallory', refPass:'nope' }));
  assert(bad.sock.msgs.some(x => x.t === 'err' && /referee password/i.test(x.msg)), 'wrong referee key errs');
  eq(S.strikes(S.ipFails, '10.0.0.42', 600000) >= 1, true, 'and strikes the IP');
  const noref = { ip:'10.0.0.43', sock: recSock() };
  S.handle(noref, JSON.stringify({ t:'join', room:'Casual', pass:'', name:'Judge', refPass:'anything' }));
  assert(noref.sock.msgs.some(x => x.t === 'err' && /no referee password/i.test(x.msg)), 'a room without a key refuses referees');
  // the real referee
  const ref = { ip:'10.0.0.44', sock: recSock() };
  S.handle(ref, JSON.stringify({ t:'join', room:'Cup', pass:'', name:'Judy', refPass:'whistle' }));
  const jd = ref.sock.msgs.find(x => x.t === 'joined');
  assert(jd && jd.spect === true && jd.ref === true, 'joined as a spectator AND a referee (got ' + JSON.stringify(jd && {spect: jd.spect, ref: jd.ref}) + ')');
  const cup = S.rooms.get('Cup');
  eq(cup.players.filter(p => !p.vacant).length, 1, 'the referee took no seat');
  assert(cup.watchers.some(w => w.name === 'Judy' && w.ref === true), 'listed among the watchers with the ref mark');
  // host verbs reach the handlers through the watcher dispatch: mute the host's player
  const guest = { ip:'10.0.0.45', sock: recSock() };
  S.handle(guest, JSON.stringify({ t:'join', room:'Cup', pass:'', name:'Bob' }));
  ref.sock.msgs.length = 0;
  S.handle(ref, JSON.stringify({ t:'mute', name:'Bob', on:true }));
  assert(!ref.sock.msgs.some(x => x.t === 'err'), 'a referee may mute (no "Spectators can only chat" and no "Only the host")');
  eq(cup.players.find(p => p.name === 'Bob').muted, true, 'Bob is muted by the referee');
  // a plain spectator still cannot
  const spec = { ip:'10.0.0.46', sock: recSock() };
  S.handle(spec, JSON.stringify({ t:'join', room:'Cup', pass:'', name:'Eve', spect:true }));
  spec.sock.msgs.length = 0;
  S.handle(spec, JSON.stringify({ t:'mute', name:'Bob', on:false }));
  assert(spec.sock.msgs.some(x => x.t === 'err' && /only chat/i.test(x.msg)), 'a plain spectator is still chat-only');
  eq(cup.players.find(p => p.name === 'Bob').muted, true);
  // a referee's game verbs (not in REF_VERBS) are refused like any spectator's
  ref.sock.msgs.length = 0;
  S.handle(ref, JSON.stringify({ t:'draw' }));
  assert(ref.sock.msgs.some(x => x.t === 'err' && /only chat/i.test(x.msg)), 'a referee never plays');
  eq(S.hostOrRef({ admin:true }, cup, null), true, 'the server operator key still passes every gate');
  eq(S.hostOrRef({}, cup, { token:'x' }), false);
  eq(S.hostOrRef({ ref:true, room:cup }, cup, { token:null, ref:true }), true);
  eq(S.hostOrRef({ ref:true, room:S.rooms.get('Casual') }, cup, null), false, 'referee powers are scoped to the room joined');
});

/* === 16. v2.5.68 L1: deriveIp — spoof-safe proxy trust === */
test('deriveIp believes forwarding headers only from loopback and only under the flag', () => {
  const D = S.deriveIp;
  S.CFG.trustProxy = false;
  eq(D('127.0.0.1', { 'cf-connecting-ip':'1.2.3.4' }), '127.0.0.1', 'flag off => transport peer');
  S.CFG.trustProxy = true;
  eq(D('127.0.0.1', { 'cf-connecting-ip':'1.2.3.4' }), '1.2.3.4', 'loopback + flag => CF header');
  eq(D('127.0.0.1', { 'x-forwarded-for':'5.6.7.8, 9.9.9.9' }), '5.6.7.8', 'XFF first hop as fallback');
  eq(D('203.0.113.7', { 'cf-connecting-ip':'1.2.3.4' }), '203.0.113.7', 'NON-loopback peer with a forged header must be ignored');
  S.CFG.trustProxy = false;
});

/* === 17. srv-2.6.18 hosting hardening (plan H1): spectator cap, saves group cap + TTL, --bind === */
test('a room admits at most MAX_WATCHERS spectators; the next join gets a clear err', () => {
  if (!S.MAX_WATCHERS) throw new Error('MAX_WATCHERS not exposed (unpatched server/harness?)');
  S.handle({ ip:'127.0.0.1', sock: fakeSock() }, JSON.stringify({ t:'create', room:'SpecRoom', name:'SpecHost', pass:'sp' }));
  for (let i = 1; i <= S.MAX_WATCHERS; i++)
    S.handle({ ip:'127.0.0.1', sock: fakeSock() }, JSON.stringify({ t:'join', room:'SpecRoom', name:'W' + i, pass:'sp', spect: true }));
  const room = S.rooms.get('SpecRoom');
  eq((room.watchers || []).length, S.MAX_WATCHERS, 'cap fills exactly');
  const late = { ip:'127.0.0.1', sock: recSock() };
  S.handle(late, JSON.stringify({ t:'join', room:'SpecRoom', name:'Wlate', pass:'sp', spect: true }));
  eq((room.watchers || []).length, S.MAX_WATCHERS, 'the late spectator must not be admitted');
  assert(late.sock.msgs.some(m => m.t === 'err' && /Spectator limit/.test(m.msg || '')), 'the late spectator must get the limit err');
});

test('named saves cap at SAVES_PER_GROUP per password group; overwrite never counts; another group is unaffected', () => {
  if (!S.saves || !S.GAME_HANDLERS_saveMatch) throw new Error('saves/saveMatch not exposed');
  S.saves.clear();
  const mkRoom = ph => ({ name:'SaveRoom' + ph, passHash: ph, hostToken:'tok' + ph, started: true, players: [{ name:'H' + ph }] });
  const rA = mkRoom('HA'), pA = { token:'tokHA', name:'HHA' };
  const sock = recSock(), connA = { sock };
  for (let i = 1; i <= S.SAVES_PER_GROUP; i++)
    S.GAME_HANDLERS_saveMatch(connA, rA, pA, { name: 'save' + i });
  eq(S.saves.size, S.SAVES_PER_GROUP, 'group A fills to the cap');
  S.GAME_HANDLERS_saveMatch(connA, rA, pA, { name: 'save-toomany' });
  eq(S.saves.size, S.SAVES_PER_GROUP, 'a 4th NEW save in the same group must be refused');
  assert(sock.msgs.some(m => m.t === 'err' && /password group/.test(m.msg || '')), 'the refusal must name the group cap');
  S.GAME_HANDLERS_saveMatch(connA, rA, pA, { name: 'save1' });                       // overwrite an existing name
  eq(S.saves.size, S.SAVES_PER_GROUP, 'overwriting an existing save never counts against the cap');
  const rB = mkRoom('HB'), pB = { token:'tokHB', name:'HHB' };
  S.GAME_HANDLERS_saveMatch({ sock: recSock() }, rB, pB, { name: 'other-group' });
  eq(S.saves.size, S.SAVES_PER_GROUP + 1, 'a different password group has its own quota');
  assert(typeof S.saves.get('other-group').touchedAt === 'number', 'buildSave must stamp touchedAt (the TTL clock)');
  S.saves.clear();
});

test('sweepSaves expires only saves untouched past SAVE_TTL_MS', () => {
  if (!S.sweepSaves) throw new Error('sweepSaves not exposed');
  S.saves.clear();
  const now = Date.now();
  S.saves.set('ancient', { name:'ancient', passHash:'X', savedAt: 1, touchedAt: 1 });
  S.saves.set('legacy-no-touch', { name:'legacy-no-touch', passHash:'X', savedAt: 1 });                    // pre-2.6.18 shape: savedAt is the fallback clock
  S.saves.set('fresh', { name:'fresh', passHash:'X', savedAt: now, touchedAt: now });
  const n = S.sweepSaves(now);
  eq(n, 2, 'exactly the two stale saves expire');
  assert(!S.saves.has('ancient') && !S.saves.has('legacy-no-touch') && S.saves.has('fresh'), 'fresh survives, stale are gone');
  S.saves.clear();
});

test('CFG carries the --bind flag (default null = all interfaces) and the global ceiling exists', () => {
  assert(S.CFG && ('bind' in S.CFG), 'CFG.bind missing');
  eq(S.CFG.bind, null, 'default bind must be null (all interfaces -- LAN hosting unchanged)');
  assert(typeof S.MAX_CONN_TOTAL === 'number' && S.MAX_CONN_TOTAL >= 300, 'MAX_CONN_TOTAL must exist and exceed full legitimate load');
});

/* === 18. v2.6.19 uncertainty round: same-name overwrite from another password group must bounce === */
test('a save name owned by one password group cannot be overwritten (clobbered) from another', () => {
  S.saves.clear();
  const rA = { name:'ClA', passHash:'GH-A', hostToken:'ta', started:true, players:[{ name:'A' }] };
  const rB = { name:'ClB', passHash:'GH-B', hostToken:'tb', started:true, players:[{ name:'B' }] };
  S.GAME_HANDLERS_saveMatch({ sock: recSock() }, rA, { token:'ta', name:'A' }, { name: 'friday-game' });
  const spy = recSock();
  S.GAME_HANDLERS_saveMatch({ sock: spy }, rB, { token:'tb', name:'B' }, { name: 'friday-game' });
  assert(spy.msgs.some(m => m.t === 'err' && /another table/.test(m.msg || '')), 'the cross-group overwrite must be refused with the taken-name err');
  eq(S.saves.get('friday-game').passHash, 'GH-A', 'the original group keeps its save untouched');
  eq(S.saves.size, 1, 'no second save sneaks in under the same name');
  S.GAME_HANDLERS_saveMatch({ sock: recSock() }, rA, { token:'ta', name:'A' }, { name: 'friday-game' });
  eq(S.saves.get('friday-game').passHash, 'GH-A', 'the OWNING group may still overwrite its own save');
  S.saves.clear();
});

/* === 19. v2.6.20: --data-dir flag exists with an unchanged default === */
test('CFG carries dataDir (default null = beside the server file, the pre-2.6.20 behavior)', () => {
  assert(S.CFG && ('dataDir' in S.CFG), 'CFG.dataDir missing');
  eq(S.CFG.dataDir, null, 'default must be null so every existing local/LAN deployment is byte-identical in behavior');
});

/* === 20. v2.6.21: WS Origin allowlist -- default open, flag-gated, null and absent semantics === */
test('originOk: default accepts everything; with an allowlist only listed origins + absent headers pass', () => {
  if (!S.originOk) throw new Error('originOk not exposed');
  eq(S.originOk('https://evil.example'), true, 'flag unset (default) must accept all -- pre-2.6.21 behavior');
  S.CFG.origin = new Set(['https://elysium.cards', 'null']);
  eq(S.originOk('https://elysium.cards'), true, 'the deployed origin passes');
  eq(S.originOk('null'), true, "the literal 'null' (file:// downloaded client) passes when listed");
  eq(S.originOk(undefined), true, 'absent Origin (bots/non-browser tools) always passes');
  eq(S.originOk('https://evil.example'), false, 'an unlisted browser origin is rejected');
  S.CFG.origin = null;
  eq(S.originOk('https://evil.example'), true, 'restored default accepts again (CFG is live-flippable)');
});

/* === 21. v2.6.22: reserved-populated slots defend the room list against an empty-shell flood === */
test('a created room is populated at once (creator is seated); reservation is exposed and sane', () => {
  assert(typeof S.RESERVED_POPULATED === 'number' && S.RESERVED_POPULATED > 0, 'RESERVED_POPULATED must exist');
  assert(S.RESERVED_POPULATED < S.MAX_ROOMS, 'reservation must be a fraction of MAX_ROOMS, not all of it');
  S.rooms.clear();
  S.handle({ ip:'9.9.9.9', sock: fakeSock() }, JSON.stringify({ t:'create', room:'RealRoom', name:'Host', pass:'x' }));
  const r = S.rooms.get('RealRoom');
  assert(r && r.everPop === true, 'the creator seating themselves must mark the room everPop=true immediately');
  S.rooms.clear();
});

test('once MAX_ROOMS - RESERVED_POPULATED empty shells exist, a further empty-shell create is refused, protecting real-game slots', () => {
  S.rooms.clear();
  const cap = S.MAX_ROOMS - S.RESERVED_POPULATED;
  // forge empty shells directly (everPop=false, no seated players) to simulate an abandoned-room flood without socket plumbing
  for (let i = 0; i < cap; i++) S.rooms.set('shell' + i, { name:'shell' + i, passHash:'', players:[], watchers:[], everPop:false, created: Date.now() });
  eq(S.rooms.size, cap, 'preconditions: exactly the non-reserved capacity is filled with shells');
  const spy = recSock();
  S.handle({ ip:'8.8.8.8', sock: spy }, JSON.stringify({ t:'create', room:'OneMoreShellAttempt', name:'Troll', pass:'x' }));
  assert(!S.rooms.has('OneMoreShellAttempt'), 'the create must be refused while only reserved slots remain');
  assert(spy.msgs.some(m => m.t === 'err' && /idle rooms/.test(m.msg || '')), 'the refusal must explain idle-room pressure');
  eq(S.rooms.size, cap, 'no room was added');
  S.rooms.clear();
});

/* === 21. v2.6.23: the tournament admin bypasses the per-IP create throttle === */
test('an admin connection can create more than CREATE_MAX rooms; a plain connection still cannot', () => {
  const adm = { ip:'10.9.9.9', admin: true, sock: recSock() };
  for (let i = 1; i <= 6; i++)
    S.handle(adm, JSON.stringify({ t:'create', room:'Tourn' + i, name:'TO', pass:'t' }));
  let mine = 0; S.rooms.forEach((r, n) => { if (/^Tourn/.test(n)) mine++; });
  eq(mine, 6, 'the tournament organizer seats 6 tables from one IP without tripping the throttle');
  const pleb = { ip:'10.8.8.8', sock: recSock() };
  for (let i = 1; i <= 5; i++)
    S.handle(pleb, JSON.stringify({ t:'create', room:'Pleb' + i, name:'P', pass:'p' }));
  assert(pleb.sock.msgs.some(m => m.t === 'err' && /creation limit/.test(m.msg || '')), 'a non-admin still hits the 4/hour throttle');
  ['Tourn1','Tourn2','Tourn3','Tourn4','Tourn5','Tourn6','Pleb1','Pleb2','Pleb3','Pleb4'].forEach(n => S.rooms.delete(n));
});

/* === srv-2.6.25: B-54 client-error intake === */
test('errScrub strips control characters and caps length', () => {
  eq(S.errScrub('a\u0000b\u001fc\u007fd', 100), 'a b c d');
  eq(S.errScrub('x'.repeat(50), 10).length, 10);
  eq(S.errScrub(null, 10), '');
});

test('errRecord whitelists fields, coerces kind, caps the ring at ERR_RING_MAX=200 and keeps BOTH ring shapes (B-63)', () => {
  eq(S.errRecord(null), null);
  eq(S.errRecord('nope'), null);
  eq(S.ERR_RING_MAX, 200, 'the ring depth is a named 200, lockstep with the client\'s RING_MAX');
  const ring = []; for (let i = 0; i < 230; i++) ring.push({ t: 1723100000000 + i, m: 'line' + i + '\u0000x' });
  ring.push('bare old-client line\u0000!');
  const r = S.errRecord({ kind:'weird', ver:'2.6.60', msg:'m', evil:'dropped', ring,
    summary:{ mode:'online', libN:'53', cryptN:8, hand:7, cards:99, deckName:'C5\u0000!', extra:'dropped' } });
  eq(r.kind, 'crash', 'unknown kind coerces to crash');
  eq(r.evil, undefined, 'unknown top-level keys never reach the log');
  eq(r.ring.length, 200, 'ring capped at the last ERR_RING_MAX');
  eq(r.ring[199], 'bare old-client line !', 'a bare string stays a scrubbed string -- <=2.6.58 clients keep working');
  const obj = r.ring[198];
  eq(obj.m, 'line229 x', 'an {t,m} element keeps its scrubbed m');
  eq(obj.t, 1723100000229, '...and its FULL ms-epoch timestamp -- dInt, never |0 (int32 would wreck it)');
  eq(r.summary.libN, 53, 'numeric coercion');
  eq(r.summary.deckName, 'C5 !');
  eq(r.summary.extra, undefined, 'summary is a pick, not a passthrough');
  const rep = S.errRecord({ kind:'report', note:'n'.repeat(600) });
  eq(rep.kind, 'report'); eq(rep.note.length, 500, 'note capped');
  eq(S.errRecord({ kind:'report', summary:{ ver:'2.6.55' } }).ver, '2.6.55', 'ver falls back to summary.ver -- the digest histogram must never show ? for reports');
  eq(S.errRecord({ kind:'report', summary:{ mode:'online' } }).mode, 'online', 'mode gets the same two-shape fallback');
});

test('dumpRecord: whitelist at EVERY level -- unknown keys dropped, caps enforced, dInt coercion (B-63)', () => {
  eq(S.dumpRecord(null), null); eq(S.dumpRecord('x'), null); eq(S.dumpRecord({}), null, 'an empty dump is dropped, not stored');
  const board = []; for (let i = 0; i < 650; i++) board.push({ id:'c'+i, z:'ready', s:1, x:1.9, y:2, n:'Name'+i, evil:'x' });
  const hand = []; for (let i = 0; i < 130; i++) hand.push('H' + i);
  const d = S.dumpRecord({
    game:{ turn:'3', phase:2, activeSeat:1, mySeat:null, deckName:'D\u0000!', libN:'53', cryptN:9, handN:7,
      seats:[{ s:1, name:'A\u0000', pool:11, evil:1 }, { s:2, name:'B', pool:null, out:true }], hand, board, evil:'drop' },
    env:{ ua:'UA', screen:'1280x800', dpr:2.625, lang:'sv-SE', uptimeMs:3600000000,
      ws:{ connected:1, status:'in', reconnects:'2', lastMsgAgoMs:150, evil:9 },
      db:{ loaded:true, cards:4159, source:'KRCG' },
      storage:{ usedKB:1200, quotaKB:50000 },
      decks:[{ name:'Poison', crypt:0, library:7, warn:1, evil:'x' }, { name:'OK', crypt:12, library:60, warn:0, era:'v5' }],
      settings:{ autoLock:true, animSpeed:1.2564, defaultView:'normal', note:'N\u0000!', sfxIndiv:{ unlock:150 }, tutDone:[1,2],
                 'bad key!':1, ['k'.repeat(30)]:1, inf:Infinity, evil:1 }, evil:'drop' },
    evil:'drop' });
  eq(d.evil, undefined); eq(d.game.evil, undefined); eq(d.env.evil, undefined, 'unknown keys never reach disk at any level');
  eq(d.game.turn, 3, 'string numerics coerce'); eq(d.game.mySeat, null, 'a null mySeat (spectator) survives AS null');
  eq(d.game.board.length, 600, 'board capped at 600'); eq(d.game.hand.length, 120, 'hand capped at 120');
  eq(d.game.board[0].evil, undefined, 'board entries are picked field-by-field'); eq(d.game.board[0].x, 1, 'coords floor to ints');
  eq(d.game.seats[0].evil, undefined); eq(d.game.seats[0].name, 'A ', 'seat names scrubbed');
  eq(d.game.seats[1].out, 1); eq(d.game.seats[1].pool, null, 'an unknown opponent pool stays null');
  eq(d.game.deckName, 'D !');
  eq(d.env.uptimeMs, 3600000000, 'a multi-day uptime survives whole -- dInt, never |0');
  eq(d.env.ws.evil, undefined); eq(d.env.ws.reconnects, 2); eq(d.env.ws.lastMsgAgoMs, 150);
  eq(d.env.dpr, 2.63, 'dpr rounded to two decimals');
  eq(d.env.decks.length, 2); eq(d.env.decks[0].evil, undefined); eq(d.env.decks[0].warn, 1); eq(d.env.decks[1].era, 'v5');
  const sg = d.env.settings;
  eq(sg.autoLock, true, 'settings: booleans pass natively (srv-2.6.30 shape gate)');
  eq(sg.animSpeed, 1.256, 'settings: finite numbers pass, 3-dp rounded');
  eq(sg.defaultView, 'normal', 'settings: strings pass'); eq(sg.note, 'N !', '...errScrub applied');
  eq(sg.sfxIndiv, undefined, 'settings: object values dropped'); eq(sg.tutDone, undefined, 'settings: array values dropped');
  eq(sg['bad key!'], undefined, 'settings: pattern-violating keys dropped');
  eq(sg['k'.repeat(30)], undefined, 'settings: over-long keys dropped');
  eq(sg.inf, undefined, 'settings: non-finite numbers dropped');
  eq(sg.evil, 1, 'settings: the shape IS the whitelist -- a well-shaped unknown key passes by design (the field set is client-defined)');
  const wide = {}; for (let i = 0; i < 60; i++) wide['k' + i] = true;
  eq(Object.keys(S.dumpRecord({ env:{ settings: wide } }).env.settings).length, 48, 'settings capped at 48 entries');
  eq(S.dumpRecord({ env:{ settings:{ f:function(){} } } }).env.settings, undefined, 'a settings bag with nothing shaped right contributes no settings key');
});

test('dumpRecord: a face-down stub without n stays nameless -- the server never invents the field (B-63/T4 note: the filter itself is client-side)', () => {
  const d = S.dumpRecord({ game:{ board:[{ id:'r2', z:'ready', s:2, x:1, y:1, fd:1 }] } });
  const e = d.game.board[0];
  eq(e.fd, 1); eq(e.n, undefined, 'no n in, no n out');
  eq(e.s, 2); eq(e.z, 'ready');
});

test('errRecord passes the dump through dumpRecord and keeps the degrade-ladder flags (B-63)', () => {
  const r = S.errRecord({ kind:'report', ver:'2.6.60', dump:{ game:{ turn:1 }, junk:1 }, dumpErr:1 });
  assert(r.dump && r.dump.game && r.dump.game.turn === 1, 'the dump rides the record');
  eq(r.dump.junk, undefined, '...whitelisted on the way');
  eq(r.dumpErr, 1, 'dumpErr survives -- the report that arrived despite a client-side dump throw');
  eq(S.errRecord({ kind:'report', dumpTrunc:1 }).dumpTrunc, 1, 'dumpTrunc survives -- the ladder dropped the dump to fit');
  eq(S.errRecord({ kind:'report', dump:'nope' }).dump, undefined, 'a non-object dump is dropped');
  eq(S.errRecord({ kind:'crash', msg:'x' }).dump, undefined, 'a plain crash carries no dump field');
});

test('handleClientError: a valid post answers 204 and records one strike for the derived ip', () => {
  const { EventEmitter } = require('events');
  S.ipErrs.clear();
  const req = new EventEmitter();
  req.socket = { remoteAddress: '203.0.113.7' }; req.headers = {}; req.destroy = () => {};
  const res = { code: 0, writeHead(c){ this.code = c; }, end(){ this.ended = true; } };
  S.handleClientError(req, res);
  req.emit('data', Buffer.from(JSON.stringify({ kind:'crash', ver:'2.6.55', msg:'boom' })));
  req.emit('end');
  eq(res.code, 204);
  const ip = S.deriveIp('203.0.113.7', {});
  eq((S.ipErrs.get(ip) || []).length, 1, 'exactly one strike recorded');
});

test('handleClientError: the 11th post inside the window is swallowed -- 204, no new strike', () => {
  const { EventEmitter } = require('events');
  S.ipErrs.clear();
  const ip = S.deriveIp('203.0.113.8', {});
  let last = null;
  for (let i = 0; i < 12; i++) {
    const req = new EventEmitter();
    req.socket = { remoteAddress: '203.0.113.8' }; req.headers = {}; req.destroy = () => {};
    last = { code: 0, writeHead(c){ this.code = c; }, end(){} };
    S.handleClientError(req, last);
    req.emit('data', Buffer.from(JSON.stringify({ kind:'crash', msg:'flood ' + i })));
    req.emit('end');
  }
  eq(last.code, 204, 'no probing feedback: the limited post still gets 204');
  eq((S.ipErrs.get(ip) || []).length, S.ERR_MAX, 'strikes freeze at ERR_MAX -- posts beyond it are dropped, not recorded');
});

test('handleClientError: an oversized body is destroyed without a response or a strike', () => {
  const { EventEmitter } = require('events');
  S.ipErrs.clear();
  const req = new EventEmitter();
  let destroyed = false;
  req.socket = { remoteAddress: '203.0.113.9' }; req.headers = {}; req.destroy = () => { destroyed = true; };
  const res = { code: 0, writeHead(c){ this.code = c; }, end(){} };
  S.handleClientError(req, res);
  req.emit('data', Buffer.alloc(S.ERR_BODY_MAX + 1));
  req.emit('end');
  assert(destroyed, 'the request is destroyed at the cap');
  eq(res.code, 0, 'no response is handed to an oversized post');
  const ip = S.deriveIp('203.0.113.9', {});
  eq((S.ipErrs.get(ip) || []).length, 0, 'no strike either -- the body never reached parsing');
});

test('deck: a tournament-locked room refuses illegal sizes; casual rooms accept intro decks', () => {
  const p = { name:'T', sock: fakeSock() };
  const room = { started:false, tournLock:true, players:[p], watchers:[] };
  const conn = { sock: p.sock };
  S.GAME_HANDLERS.deck(conn, room, p, { t:'deck', name:'FB', crypt:[{name:'V',qty:6}], library:[{name:'C',qty:30},{name:'D',qty:19}] });
  assert(!p.game, 'the First Blood shape (6/49) is not stored in a tournLock room');
  S.GAME_HANDLERS.deck(conn, room, p, { t:'deck', name:'OK', crypt:[{name:'V',qty:12}], library:[{name:'C',qty:30},{name:'D',qty:30}] });
  assert(p.game && p.game.deckCrypt.length===12 && p.game.deckLib.length===60, 'a legal 12/60 deck loads');
  const p2 = { name:'U', sock: fakeSock() }; room.players.push(p2);
  S.GAME_HANDLERS.deck({sock:p2.sock}, room, p2, { t:'deck', name:'Big', crypt:[{name:'V',qty:12}], library:[{name:'C',qty:30},{name:'D',qty:30},{name:'E',qty:30},{name:'F',qty:1}] });
  assert(!p2.game, '91 library is refused in a tournLock room');
  const room2 = { started:false, players:[], watchers:[] };
  const p3 = { name:'W', sock: fakeSock() };
  S.GAME_HANDLERS.deck({sock:p3.sock}, room2, p3, { t:'deck', name:'FB', crypt:[{name:'V',qty:6}], library:[{name:'C',qty:30},{name:'D',qty:19}] });
  assert(p3.game && p3.game.deckLib.length===49, 'a casual room accepts the intro-product shape');
});

test('expandDeck lockstep: a single qty:90 entry expands fully and the meme deck loads in a tournLock room', () => {
  const p = { name:'M', sock: fakeSock() };
  const room = { started:false, tournLock:true, players:[p], watchers:[] };
  S.GAME_HANDLERS.deck({sock:p.sock}, room, p, { t:'deck', name:'Meme', crypt:[{name:'Tupdog',qty:12}], library:[{name:'Computer Hacking',qty:90}] });
  assert(p.game && p.game.deckCrypt.length===12 && p.game.deckLib.length===90, '12/90 loads under the lock (the old 30-cap made this 12/30 and refusable)');
});

test('serverErrRecord: the server reports on itself with the same caps and shape family', () => {
  const r = S.serverErrRecord('uncaught', new Error('boom\u0000!'));
  eq(r.kind, 'server'); eq(r.src, 'uncaught');
  eq(r.msg, 'boom !', 'control chars scrubbed');
  assert(r.ver && r.stack && r.ts, 'version, stack and timestamp ride along');
  eq(S.serverErrRecord('unhandled', 'plain string').msg, 'plain string', 'non-Error reasons survive');
  assert(!(() => { S.errAppend(r); return false; })(), 'errAppend is a safe no-throw under the harness fs stub');
});

test('handleLogFetch: 404-uniform without a key, on a wrong key, and under lockout; 200 with the right key', () => {
  function fReq(url, ipAddr){ return { url, socket:{ remoteAddress: ipAddr }, headers:{} }; }
  function fRes(){ return { code:0, hdr:null, body:'', writeHead(c,h){ this.code=c; this.hdr=h||{}; }, end(b){ this.body=String(b||''); } }; }
  const saved = S.CFG.adminPassHash;
  S.CFG.adminPassHash = null; S.ipLogAuth.clear();
  let r = fRes(); S.handleLogFetch(fReq('/client-errors.txt?key=whatever', '198.51.100.1'), r);
  eq(r.code, 404, 'no --admin-pass => the route does not exist');
  S.CFG.adminPassHash = S.passHash('s3cr3t');
  r = fRes(); S.handleLogFetch(fReq('/client-errors.txt?key=wrong', '198.51.100.1'), r);
  eq(r.code, 404, 'wrong key is indistinguishable from no route');
  const ip = S.deriveIp('198.51.100.1', {});
  eq((S.ipLogAuth.get(ip)||[]).length, 1, 'the failure recorded a strike');
  r = fRes(); S.handleLogFetch(fReq('/client-errors.txt?key=s3cr3t', '198.51.100.1'), r);
  eq(r.code, 200, 'the right key reads the log');
  assert(/text\/plain/.test(r.hdr['Content-Type']), 'served as plain text');
  assert(!r.hdr['Content-Disposition'], 'inline by default (select-and-copy)');
  r = fRes(); S.handleLogFetch(fReq('/client-errors.txt?key=s3cr3t&dl=1', '198.51.100.1'), r);
  assert(/attachment/.test(r.hdr['Content-Disposition']||''), 'dl=1 downloads as .txt');
  for (let i = 0; i < 12; i++){ const x=fRes(); S.handleLogFetch(fReq('/client-errors.txt?key=bad'+i, '198.51.100.2'), x); }
  r = fRes(); S.handleLogFetch(fReq('/client-errors.txt?key=s3cr3t', '198.51.100.2'), r);
  eq(r.code, 404, 'lockout holds even against the CORRECT key -- brute force buys nothing');
  S.CFG.adminPassHash = saved; S.ipLogAuth.clear();
});

test('maintenance: auto-expiry reopens, the notice composes, and the HTTP control arms/broadcasts/clears', () => {
  const saved = S.CFG.adminPassHash;
  S.CFG.adminPassHash = S.passHash('s3cr3t'); S.ipLogAuth.clear();
  S._maint = { until: Date.now() - 1000, msg: 'old' };
  eq(S.maintActive(), false, 'a past window expires itself');
  eq(S._maint, null, '...and clears the state');
  S._maint = { until: Date.now() + 2 * 3600000, msg: 'Update tonight 21:00.' };
  assert(/Update tonight 21:00\./.test(S.maintNotice()) && /2 hour/.test(S.maintNotice()), 'custom message + rounded time ride the notice');
  const rsock = recSock();
  const room = { name:'Rmaint', started:true, players:[{ name:'A', sock: rsock }], watchers:[] };
  S.rooms.set('Rmaint', room);
  function fReq(url){ return { url, socket:{ remoteAddress:'198.51.100.9' }, headers:{} }; }
  function fRes(){ return { code:0, body:'', writeHead(c){ this.code=c; }, end(b){ this.body=String(b||''); } }; }
  let r = fRes(); S.handleMaintenance(fReq('/admin/maintenance?key=wrong&on=1'), r);
  eq(r.code, 404, 'wrong key: 404-uniform, nothing armed by it');
  r = fRes(); S.handleMaintenance(fReq('/admin/maintenance?key=s3cr3t&on=1&hours=1&msg=Drain%20test'), r);
  eq(r.code, 200, 'arming answers 200');
  assert(S.maintActive() && /Drain test/.test(S.maintNotice()), 'the window is armed with the message');
  assert(rsock.msgs.some(m => m.t === 'sys' && /Drain test/.test(m.msg)), 'every room got the sys broadcast at arming');
  r = fRes(); S.handleMaintenance(fReq('/admin/maintenance?key=s3cr3t'), r);
  assert(/"active":true/.test(r.body), 'status reads back armed');
  r = fRes(); S.handleMaintenance(fReq('/admin/maintenance?key=s3cr3t&off=1'), r);
  assert(/"active":false/.test(r.body) && !S.maintActive(), 'off clears the window');
  S.rooms.delete('Rmaint'); S.CFG.adminPassHash = saved; S.ipLogAuth.clear(); S._maint = null;
});


/* === srv-2.6.38: an oust pays the LIVE predator and hands the turn on (bot-project spec, 21 Sep 2026) === */
function oustTable(n){
  S.rooms.clear(); const cs = [];
  for (let k = 0; k < n; k++){ const c = { ip:'127.0.0.' + (k + 1), sock: recSock() }; cs.push(c);
    S.handle(c, JSON.stringify(k ? { t:'join', room:'OU', pass:'', name:'P' + (k + 1) } : { t:'create', room:'OU', name:'P1', lobby:true })); }
  const room = [...S.rooms.values()][0]; room.started = true; room.turnSeat = 1; cs.forEach(c => { c.sock.msgs.length = 0; });
  return { room, cs };
}
test('srv-2.6.38 bounty: the ring predecessor is skipped when it is already OUT -- VP and the bounty verb go to the live predator, never to a dead seat', () => {
  const { room, cs } = oustTable(4);
  S.handle(cs[1], JSON.stringify({ t:'bounty' }));                  // P2 falls: predator P1
  eq(room.players[0].vp, 1); assert(cs[0].sock.msgs.some(x => x.t === 'bounty' && x.from === 'P2'));
  cs.forEach(c => { c.sock.msgs.length = 0; });
  S.handle(cs[2], JSON.stringify({ t:'bounty' }));                  // P3 falls: its ring predecessor P2 is OUT
  eq(room.players[1].vp || 0, 0, 'the dead seat gets nothing'); eq(room.players[0].vp, 2, 'the live predator does');
  assert(cs[0].sock.msgs.some(x => x.t === 'bounty' && x.from === 'P3'), 'and receives the verb'); assert(!cs[1].sock.msgs.some(x => x.t === 'bounty'));
  assert(cs[3].sock.msgs.some(x => x.t === 'sys' && /go to P1\./.test(x.msg)), 'the table is told the right name');
});
test('srv-2.6.38 hostOust: same rule; a VACANT predecessor is still in the game and stays the predator; the last seat standing pays nobody', () => {
  const { room, cs } = oustTable(3);
  room.players[1].out = true;
  S.handle(cs[0], JSON.stringify({ t:'hostOust', seat: 3 }));
  eq(room.players[0].vp, 1, 'P3\'s live predator is P1 (P2 is out)'); eq(room.players[1].vp || 0, 0);
  const t2 = oustTable(3); t2.room.players[1].vacant = true;
  S.handle(t2.cs[2], JSON.stringify({ t:'bounty' })); eq(t2.room.players[1].vp, 1, 'vacant is not out -- unchanged behaviour');
  const t3 = oustTable(2); t3.room.players[0].out = true;
  S.handle(t3.cs[1], JSON.stringify({ t:'bounty' })); eq(t3.room.players[0].vp || 0, 0, 'nobody left: no VP to a dead seat');
  assert(t3.cs[1].sock.msgs.some(x => x.t === 'sys' && /^P2 was ousted\.$/.test(x.msg)));
});
test('srv-2.6.38 turn: an oust of the seat that HOLDS the turn hands it to the next live seat, after the roster; the ousted seat\'s late pass is refused; an oust of any other seat leaves the turn alone', () => {
  const { room, cs } = oustTable(4);
  room.players[1].out = true;                                        // P2 already gone -> P1's successor is P3
  S.handle(cs[0], JSON.stringify({ t:'bounty' }));                  // P1 falls on its OWN turn
  eq(room.turnSeat, 3, 'nextLiveSeat, as hostPass would');
  const seq = cs[2].sock.msgs.filter(x => x.t === 'roster' || x.t === 'turn').map(x => x.t).join('>'); eq(seq, 'roster>turn', 'clients learn why before they learn what');
  const tm = cs[2].sock.msgs.find(x => x.t === 'turn'); eq(tm.seat, 3); eq(tm.who, 'P3');
  cs[0].sock.msgs.length = 0; S.handle(cs[0], JSON.stringify({ t:'pass' }));   // the bot passes by itself since v0.6.140
  eq(cs[0].sock.msgs.filter(x => x.t === 'err').length, 0, 'an ousted seat\'s late pass is expected: SILENT (live: it was an err in every bot trace)'); eq(room.turnSeat, 3, 'and the turn is never advanced twice');
  cs[3].sock.msgs.length = 0; S.handle(cs[3], JSON.stringify({ t:'pass' })); assert(cs[3].sock.msgs.some(x => x.t === 'err'), 'a LIVE seat passing out of turn is still refused out loud (v2.5.64)');
  cs.forEach(c => { c.sock.msgs.length = 0; });
  S.handle(cs[3], JSON.stringify({ t:'bounty' })); eq(room.turnSeat, 3, 'P4 did not hold the turn'); assert(!cs[2].sock.msgs.some(x => x.t === 'turn'));
  const h = oustTable(3); h.room.turnSeat = 2; S.handle(h.cs[0], JSON.stringify({ t:'hostOust', seat: 2 })); eq(h.room.turnSeat, 3, 'the host\'s oust of the turn holder does the same');
  const last = oustTable(2); last.room.players[1].out = true; S.handle(last.cs[0], JSON.stringify({ t:'bounty' })); eq(last.room.turnSeat, 1, 'nobody to hand it to: the marker stays');
});

/* === srv-2.6.43: THE BOT TEMPO (spec-bot-tempo-2026-09-27) + the knowledge statics + the snapshot it exposed === */
test('srv-2.6.43 botcfg: any seated HUMAN sets the table tempo (lobby or game), validated and merged (absent keeps, none yet = Standard / 3 s), stored whole, broadcast whole to everyone incl. the sender; a bot is ignored; nothing valid = nothing sent', () => {
  S.rooms.clear(); S.ipFails.clear();
  const cA = { ip:'10.4.0.1', sock: recSock() }, cB = { ip:'10.4.0.2', sock: recSock() }, cBot = { ip:'10.4.0.3', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'T1', name:'Alice', lobby:true }));
  S.handle(cB, JSON.stringify({ t:'join', room:'T1', pass:'', name:'Bob' }));
  S.handle(cBot, JSON.stringify({ t:'join', room:'T1', pass:'', name:'B1', bot:true }));
  const room = [...S.rooms.values()][0]; eq(room.started, false, 'still the lobby'); eq(room.botcfg, undefined, 'a fresh room has no tempo stored');
  const last = c => c.sock.msgs.filter(x => x.t === 'botcfg').slice(-1)[0];
  S.handle(cB, JSON.stringify({ t:'botcfg', tempo:'adaptive' }));                    // a NON-host human, in the lobby, a partial write
  eq(JSON.stringify(room.botcfg), JSON.stringify({ tempo:'adaptive', waitSecs:3, who:'Bob' }), 'merged onto Standard / 3 s, the setter named');
  for (const c of [cA, cB, cBot]) eq(JSON.stringify(last(c)), JSON.stringify({ t:'botcfg', tempo:'adaptive', waitSecs:3, who:'Bob' }), 'everyone gets the WHOLE state -- the sender too (an idempotent echo)');
  S.handle(cA, JSON.stringify({ t:'botcfg', waitSecs: 12.7 })); eq(room.botcfg.waitSecs, 8, 'clamped to 8'); eq(room.botcfg.tempo, 'adaptive', 'the absent tempo kept'); eq(room.botcfg.who, 'Alice');
  S.handle(cA, JSON.stringify({ t:'botcfg', waitSecs: 2.46 })); eq(room.botcfg.waitSecs, 2.5, 'tenths of a second');
  S.handle(cA, JSON.stringify({ t:'botcfg', waitSecs: '0.2' })); eq(room.botcfg.waitSecs, 1, 'a numeric string is a number; clamped to 1');
  const n0 = cB.sock.msgs.length;
  for (const bad of [{ tempo:'fast' }, { tempo:'TURN' }, { tempo:'__proto__' }, { waitSecs:'x' }, { waitSecs:' ' }, { waitSecs:null }, { waitSecs:true }, {}])
    S.handle(cA, JSON.stringify(Object.assign({ t:'botcfg' }, bad)));
  eq(cB.sock.msgs.length, n0, 'nothing valid -> nothing stored, nothing broadcast'); eq(room.botcfg.tempo, 'adaptive'); eq(room.botcfg.waitSecs, 1);
  S.handle(cA, JSON.stringify({ t:'botcfg', tempo:'fast', waitSecs: 4 })); eq(room.botcfg.tempo, 'adaptive', 'an invalid field is ignored...'); eq(room.botcfg.waitSecs, 4, '...the valid one lands');
  S.handle(cBot, JSON.stringify({ t:'botcfg', tempo:'turn' })); eq(room.botcfg.tempo, 'adaptive', 'a BOT never sets the table tempo');
  S.handle(cA, JSON.stringify({ t:'botcfg', tempo:'turn' })); eq(room.botcfg.tempo, 'turn'); eq(room.botcfg.waitSecs, 4, 'turn keeps the wait for when the table leaves it');
  const w = { ip:'10.4.0.9', sock: recSock() }; S.handle(w, JSON.stringify({ t:'join', room:'T1', pass:'', name:'Watcher', spect:true }));
  w.sock.msgs.length = 0; S.handle(w, JSON.stringify({ t:'botcfg', tempo:'standard' }));
  assert(w.sock.msgs.some(x => x.t === 'err' && /only chat/.test(x.msg)), 'a spectator is refused'); eq(room.botcfg.tempo, 'turn');
});
test('srv-2.6.43 botcfg reaches a LATE JOINER right after `joined` -- in the lobby (bots are added there) and mid-game; a room without one sends none', () => {
  S.rooms.clear(); S.ipFails.clear();
  const cA = { ip:'10.4.1.1', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'T2', name:'Alice', lobby:true }));
  const cB = { ip:'10.4.1.2', sock: recSock() }; S.handle(cB, JSON.stringify({ t:'join', room:'T2', pass:'', name:'B1', bot:true }));
  eq(cB.sock.msgs.filter(x => x.t === 'botcfg').length, 0, 'nothing stored -> nothing replayed (a bot without botcfg keeps its own clocks)');
  S.handle(cA, JSON.stringify({ t:'botcfg', tempo:'standard', waitSecs:5 }));
  const cC = { ip:'10.4.1.3', sock: recSock() }; S.handle(cC, JSON.stringify({ t:'join', room:'T2', pass:'', name:'B2', bot:true }));
  const seq = cC.sock.msgs.map(x => x.t); const ij = seq.indexOf('joined'), ib = seq.indexOf('botcfg'), il = seq.indexOf('lobby');
  assert(ij >= 0 && ib > ij && il > ib, 'joined > botcfg > lobby: ' + seq.join(','));
  eq(cC.sock.msgs[ib].waitSecs, 5); eq(cC.sock.msgs[ib].who, 'Alice', 'the stored setter rides along');
  const room = [...S.rooms.values()][0]; room.started = true;
  const cD = { ip:'10.4.1.4', sock: recSock() }; S.joinReply(cD.sock, room, room.players[1]);
  assert(cD.sock.msgs.some(x => x.t === 'botcfg' && x.tempo === 'standard' && x.waitSecs === 5), 'mid-game too');
});
test('srv-2.6.43 the twin rule, server side: botcfgMerge -- partial writes, clamps, tenths, the Standard / 3 s base', () => {
  const M = S.botcfgMerge;
  eq(JSON.stringify(M('turn', undefined, null)), JSON.stringify({ tempo:'turn', waitSecs:3 }));
  eq(JSON.stringify(M(undefined, 7.04, { tempo:'adaptive', waitSecs:2 })), JSON.stringify({ tempo:'adaptive', waitSecs:7 }));
  eq(M(undefined, undefined, null), null); eq(M('nope', 'nope', null), null);
  eq(M(undefined, -3, null).waitSecs, 1); eq(M(undefined, Infinity, null), null, 'not finite = not a value');
});
test('srv-2.6.43 GET statics: the knowledge layer\'s two files ride the SAME exact-match set as the bot and cardfx; nothing near them does', () => {
  const B = S.BOT_STATICS; assert(B instanceof Set, 'BOT_STATICS exposed');
  for (const u of ['/elysium-bot.js', '/elysium-cardfx.json', '/elysium-twd-profile.json', '/elysium-twd-archetypes.json']) assert(B.has(u), u);
  for (const u of ['/elysium-twd-profile.json.bak', '/elysium-twd-profile.js', '/elysium-twd-profile.json%2F..', '/ELYSIUM-TWD-PROFILE.JSON', '/elysium-twd-profile.json?x=1']) assert(!B.has(u), u + ' is not served');
  eq(B.size, 4);
});
test('srv-2.6.43 the room snapshot round-trips what it used to drop: boardMode, refHash, matchMins, everPop, botcfg and the bot flag; a legacy record with players counts as populated', () => {
  S.rooms.clear(); S.ipFails.clear();
  const cA = { ip:'10.4.2.1', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'T3', name:'Alice', lobby:true, boardMode:'classic', refPass:'ref!', minutes: 90 }));
  const cB = { ip:'10.4.2.2', sock: recSock() }; S.handle(cB, JSON.stringify({ t:'join', room:'T3', pass:'', name:'B1', bot:true }));
  S.handle(cA, JSON.stringify({ t:'botcfg', tempo:'adaptive', waitSecs: 2.5 }));
  const room = [...S.rooms.values()][0];
  eq(room.boardMode, 'classic'); assert(room.refHash, 'a referee password'); assert(room.everPop, 'populated');
  const back = S.roomUnsnap(JSON.parse(JSON.stringify(S.roomSnap(room))));   // through JSON, exactly as the disk sees it
  eq(back.boardMode, 'classic', 'a restored Classic table stays Classic (joinReply defaulted it to structured)');
  eq(back.refHash, room.refHash, 'the referee password survives');
  eq(back.matchMins, room.matchMins, 'the match length survives'); assert(back.matchMins >= 5, 'the create path stored it: ' + room.matchMins);
  eq(back.everPop, true, 'a restored table is not a never-seated shell -- the 10-minute squatter sweep left it alone only if someone rejoined in time');
  eq(JSON.stringify(back.botcfg), JSON.stringify({ tempo:'adaptive', waitSecs:2.5, who:'Alice' }), 'the tempo survives');
  eq(back.players[1].bot, true, 'the bot is still a bot'); eq(back.players[0].bot, undefined, 'the human is still a human');
  eq(S.humansLeft(back), 1, 'so the census holds across a restart');
  const legacy = JSON.parse(JSON.stringify(S.roomSnap(room))); delete legacy.everPop; delete legacy.boardMode; delete legacy.botcfg; legacy.players.forEach(p => delete p.bot);
  const lb = S.roomUnsnap(legacy);
  eq(lb.everPop, true, 'a pre-2.6.43 record with players WAS populated'); eq(lb.boardMode, 'structured', 'unknown mode falls back as the create path would'); eq(lb.botcfg, null);
  eq(S.roomUnsnap(Object.assign({}, legacy, { players: [] })).everPop, false, 'an empty legacy shell stays sweepable');
  eq(S.roomUnsnap(Object.assign({}, legacy, { botcfg: { tempo:'warp', waitSecs:'x' } })).botcfg, null, 'a garbled stored tempo is dropped, not trusted');
  eq(S.roomUnsnap(Object.assign({}, legacy, { matchMins: 9999 })).matchMins, 0, 'matchMins validated like the create path');
});
test('srv-2.6.43 a reconnecting bot keeps its flag -- by token and by name; a name-reclaim marks the room populated', () => {
  S.rooms.clear(); S.ipFails.clear();
  const cA = { ip:'10.4.3.1', sock: recSock() }; S.handle(cA, JSON.stringify({ t:'create', room:'T4', name:'Alice', lobby:true }));
  const cB = { ip:'10.4.3.2', sock: recSock() }; S.handle(cB, JSON.stringify({ t:'join', room:'T4', pass:'', name:'B1', bot:true }));
  const room = [...S.rooms.values()][0]; const p = room.players[1]; const tok = p.token;
  delete p.bot; S.drop(cB);                                                     // exactly the state a pre-2.6.43 restart restored
  const cB2 = { ip:'10.4.3.2', sock: recSock() }; S.handle(cB2, JSON.stringify({ t:'join', room:'T4', pass:'', name:'B1', bot:true, token: tok }));
  eq(p.bot, true, 'the token path re-reads the self-declaration');
  delete p.bot; S.drop(cB2); room.everPop = false;
  const cB3 = { ip:'10.4.3.2', sock: recSock() }; S.handle(cB3, JSON.stringify({ t:'join', room:'T4', pass:'', name:'B1', bot:true }));
  eq(p.bot, true, 'the name-reclaim path too'); eq(room.everPop, true, 'and a reclaimed seat marks the room real');
  const cH = { ip:'10.4.3.5', sock: recSock() }; S.handle(cH, JSON.stringify({ t:'join', room:'T4', pass:'', name:'Hugo' }));
  eq(room.players[2].bot, undefined, 'a human never becomes a bot by omission');
});

/* ---------- srv-2.6.44: THE TABLE IS SET (the room option tableSetup) ---------- */
const DECK44 = { t:'deck', library:[{ name:'Govern the Unaligned', qty:30 }, { name:'Deflection', qty:30 }], crypt:[{ name:'Gratiano', qty:12 }], name:'D' };
test('srv-2.6.44 tableSetup: a Classic room created with it stores it and tells every client -- the creator, a late joiner, a spectator, and everyone again at start; the Classic deal itself is untouched', () => {
  S.rooms.clear(); S.ipFails.clear();
  const cA = { ip:'10.5.1.1', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'TS1', name:'Alice', lobby:true, boardMode:'classic', tableSetup:true }));
  const room = S.rooms.get('TS1');
  eq(room.tableSetup, true, 'create stores the option');
  eq(cA.sock.msgs.find(m => m.t === 'joined').tableSetup, true, 'the creator hears it in joined');
  const cB = { ip:'10.5.1.2', sock: recSock() }; S.handle(cB, JSON.stringify({ t:'join', room:'TS1', pass:'', name:'Bob' }));
  eq(cB.sock.msgs.find(m => m.t === 'joined').tableSetup, true, 'a later joiner hears it');
  const cW = { ip:'10.5.1.3', sock: recSock() }; S.handle(cW, JSON.stringify({ t:'join', room:'TS1', pass:'', name:'Wanda', spect:true }));
  const jw = cW.sock.msgs.find(m => m.t === 'joined'); eq(jw.spect, true); eq(jw.tableSetup, true, 'a spectator hears it');
  S.handle(cA, JSON.stringify(DECK44)); S.handle(cB, JSON.stringify(DECK44));
  S.handle(cA, JSON.stringify({ t:'seat', seat:1 })); S.handle(cB, JSON.stringify({ t:'seat', seat:2 }));
  cA.sock.msgs.length = 0; cB.sock.msgs.length = 0;
  S.handle(cA, JSON.stringify({ t:'start' }));
  eq(room.started, true, 'the game started');
  for (const c of [cA, cB]) {
    const st = c.sock.msgs.find(m => m.t === 'started'); assert(st, 'started arrived'); eq(st.tableSetup, true, 'started carries it'); eq(st.boardMode, 'classic');
    const d = c.sock.msgs.find(m => m.t === 'dealt'); assert(d, 'dealt arrived');
    eq(d.hand.length, 7, 'seven cards'); eq(d.unc.length, 0, 'and NO uncontrolled: the Classic deal is exactly what it was -- the four setup cards are the client\'s own drawCrypt verbs');
    eq(d.crypt, 12, 'the whole crypt is still on the server');
  }
  // the four setup draws are the ordinary verb: private, one card each, nothing broadcast
  cA.sock.msgs.length = 0; cB.sock.msgs.length = 0;
  for (let i = 0; i < 4; i++) S.handle(cA, JSON.stringify({ t:'drawCrypt' }));
  const drews = cA.sock.msgs.filter(m => m.t === 'drew');
  eq(drews.length, 4); assert(drews.every(m => m.zone === 'uncontrolled' && m.kind === 'crypt'), 'four uncontrolled crypt cards'); eq(drews[3].crypt, 8, 'pile count follows');
  eq(cB.sock.msgs.length, 0, 'the other seat hears nothing about them (they see the cards through the board push, as with a hand-made setup)');
});
test('srv-2.6.44 tableSetup is Classic-only and strict: a Structured room, a room created without it, and a non-boolean value never carry it -- an old client\'s create is unchanged', () => {
  S.rooms.clear(); S.ipFails.clear();
  const mk = (name, extra) => { const c = { ip:'10.5.2.' + (S.rooms.size + 1), sock: recSock() }; S.handle(c, JSON.stringify(Object.assign({ t:'create', room:name, name:'H' + name, lobby:true }, extra))); return c; };
  const cases = [['Struct', { boardMode:'structured', tableSetup:true }], ['Plain', { boardMode:'classic' }], ['Str', { boardMode:'classic', tableSetup:'yes' }], ['One', { boardMode:'classic', tableSetup:1 }], ['Legacy', {}]];
  for (const [name, extra] of cases) {
    const c = mk(name, extra), room = S.rooms.get(name), j = c.sock.msgs.find(m => m.t === 'joined');
    eq(room.tableSetup, false, name + ': not stored'); eq('tableSetup' in j, false, name + ': joined does not mention it');
  }
});
test('srv-2.6.44 the snapshot round-trips tableSetup, re-validated: a legacy record has none, and a Structured record can never carry one', () => {
  S.rooms.clear(); S.ipFails.clear();
  const cA = { ip:'10.5.3.1', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'TS3', name:'Alice', lobby:true, boardMode:'classic', tableSetup:true }));
  const room = S.rooms.get('TS3');
  const disk = JSON.parse(JSON.stringify(S.roomSnap(room)));
  eq(disk.tableSetup, true, 'written');
  eq(S.roomUnsnap(disk).tableSetup, true, 'and read back -- a restarted server keeps telling rejoining clients');
  const legacy = Object.assign({}, disk); delete legacy.tableSetup;
  eq(S.roomUnsnap(legacy).tableSetup, false, 'a pre-2.6.44 record: off');
  eq(S.roomUnsnap(Object.assign({}, disk, { boardMode:'structured' })).tableSetup, false, 'a Structured record never carries it');
  eq(S.roomUnsnap(Object.assign({}, disk, { tableSetup:'true' })).tableSetup, false, 'a garbled value is dropped');
});
test('srv-2.6.44 both `took` messages carry the room\'s boardMode and tableSetup -- loadMatch\'s never carried boardMode, so the host of a Classic room was told nothing and its client fell back to Structured', () => {
  if (!S.saves) throw new Error('saves not exposed');
  S.rooms.clear(); S.ipFails.clear(); S.saves.clear();
  const cA = { ip:'10.5.4.1', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'TS4', name:'Alice', lobby:true, boardMode:'classic', tableSetup:true }));
  const room = S.rooms.get('TS4');
  S.saves.set('sv44', { name:'sv44', passHash: room.passHash, players:[{ name:'Alice', game:null }, { name:'Bob', game:null }], turnSeat:1, reactSecs:5, touchedAt: Date.now() });
  cA.sock.msgs.length = 0;
  S.handle(cA, JSON.stringify({ t:'loadMatch', name:'sv44' }));
  const tk = cA.sock.msgs.find(m => m.t === 'took'); assert(tk, 'loadMatch answered with took: ' + JSON.stringify(cA.sock.msgs.map(m => m.t + (m.msg ? ':' + m.msg : ''))));
  eq(tk.loaded, 'sv44'); eq(tk.boardMode, 'classic', 'the host is told the board style'); eq(tk.tableSetup, true, 'and the option');
  S.saves.clear();
  const src = require('fs').readFileSync(SRV, 'utf8');
  const sites = [...src.matchAll(/t:'took'/g)].map(m => m.index);
  eq(sites.length, 2, 'two took sites (takeover / promote, and loadMatch)');
  for (const at of sites) assert(src.slice(at, at + 1100).indexOf('boardMode: room.boardMode || undefined, tableSetup: room.tableSetup || undefined,') > 0, 'the took at ' + at + ' carries the pair');
});

test('srv-2.6.45 a pub keeps the Turn/Round count (tn / rn) -- positive integers capped at 9999, anything else dropped -- so a client that reloads or reconnects mid-game can take it from the boards (cli-2.6.149)', () => {
  S.rooms.clear(); S.ipFails.clear();
  const cA = { ip:'10.6.0.1', sock: recSock() }, cB = { ip:'10.6.0.2', sock: recSock() };
  S.handle(cA, JSON.stringify({ t:'create', room:'TN', name:'Alice', lobby:true }));
  S.handle(cB, JSON.stringify({ t:'join', room:'TN', pass:'', name:'Bob' }));
  const room = S.rooms.get('TN'); room.started = true; room.turnSeat = 1;
  cA.sock.msgs.length = 0;
  S.handle(cB, JSON.stringify({ t:'board', pub:{ pool:30, cards:[], tn:7, rn:4 } }));
  const b = cA.sock.msgs.find(m => m.t === 'board'); assert(b, 'relayed');
  eq(b.pub.tn, 7); eq(b.pub.rn, 4, 'the count rides the relay (srv-2.6.44 dropped it: the pub is a whitelist)');
  eq(room.players[1].pubOwn.tn, 7, 'and the stored copy the owner is handed back on a reload');
  for (const [tn, rn] of [[0, 0], [-3, 2.5], ['x', null], [12, 'y']]) {
    cA.sock.msgs.length = 0; S.handle(cB, JSON.stringify({ t:'board', pub:{ pool:30, cards:[], tn, rn } }));
    const m = cA.sock.msgs.find(x => x.t === 'board');
    eq(m.pub.tn, tn === 12 ? 12 : undefined, 'tn ' + JSON.stringify(tn)); eq(m.pub.rn, rn === 2.5 ? 2 : undefined, 'rn ' + JSON.stringify(rn));
  }
  cA.sock.msgs.length = 0; S.handle(cB, JSON.stringify({ t:'board', pub:{ pool:30, cards:[], tn:123456, rn:99999 } }));
  const big = cA.sock.msgs.find(x => x.t === 'board'); eq(big.pub.tn, 9999); eq(big.pub.rn, 9999, 'capped');
});

console.log('\n' + pass + ' passed, ' + fail + ' failed' + (fail ? '  - ' + failed.join(', ') : ''));
process.exit(fail ? 1 : 0);
