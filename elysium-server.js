#!/usr/bin/env node
'use strict';
/* ============================================================
   Elysium server — milestone 2A (rooms, shared log, tools)
   Zero dependencies: plain Node http + crypto + a hand-rolled
   WebSocket layer. Run:  node elysium-server.js [port] [client.html]
   ============================================================ */
const http   = require('http');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');

const VERSION     = '2.3';
const PORT        = parseInt(process.argv[2], 10) || 8123;
const CLIENT_FILE = path.resolve(__dirname, process.argv[3] || 'elysium-vtes-bord.html');
const MAX_ROOMS   = 50;
const MAX_PLAYERS = 6;
const GRACE_MS    = 30000;         // a freshly-dropped seat can't be rebound for this long (reconnect window)
const MAX_SAVES   = 50;            // named match saves kept on disk (these never auto-expire)
const MAX_MSG     = 256 * 1024;        // max incoming websocket message (bytes)
const WS_GUID     = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_CONN_PER_IP = 16;          // concurrent sockets per remote IP (loopback exempt)

/* Last-resort safety net: a single malformed message or a library edge case
   must never take the whole table down with it. Log and keep serving.        */
process.on('uncaughtException',  err => console.log('[uncaught] ' + (err && err.stack || err)));
process.on('unhandledRejection', err => console.log('[unhandled] ' + (err && err.stack || err)));

/* ---------- Unbiased randomness (same rejection sampling as the client) ---------- */
function rnd(n){
  if(n <= 1) return 0;
  const lim = Math.floor(4294967296 / n) * n;
  let x;
  do { x = crypto.randomBytes(4).readUInt32BE(0); } while(x >= lim);
  return x % n;
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=rnd(i+1); [a[i],a[j]]=[a[j],a[i]]; } }
function token(){ return crypto.randomBytes(12).toString('hex'); }

/* ---------- WebSocket framing ---------- */
function wsSendFrame(sock, op, payload){
  if(sock.destroyed) return;
  const len = payload.length;
  let head;
  if(len < 126){
    head = Buffer.from([0x80 | op, len]);
  } else if(len < 65536){
    head = Buffer.alloc(4);
    head[0] = 0x80 | op; head[1] = 126; head.writeUInt16BE(len, 2);
  } else {
    head = Buffer.alloc(10);
    head[0] = 0x80 | op; head[1] = 127;
    head.writeUInt32BE(0, 2); head.writeUInt32BE(len, 6);
  }
  try { sock.write(Buffer.concat([head, payload])); } catch(err) {}
}
function wsSend(sock, obj){
  try { wsSendFrame(sock, 0x1, Buffer.from(JSON.stringify(obj))); } catch(err) {}
}
function wsClose(sock){
  wsSendFrame(sock, 0x8, Buffer.alloc(0));
  setTimeout(()=>{ try{ sock.destroy(); }catch(err){} }, 400);
}
/* Incremental frame parser: handles chunked TCP, masking, fragmentation,
   ping/pong and close. Calls cb.msg(text) / cb.close(). */
function wsAttach(sock, cb){
  let buf = Buffer.alloc(0);
  let frags = [], fragOp = 0;
  sock.on('data', d => {
    buf = Buffer.concat([buf, d]);
    while(true){
      if(buf.length < 2) break;
      const b0 = buf[0], b1 = buf[1];
      const fin    = (b0 & 0x80) !== 0;
      const op     =  b0 & 0x0f;
      const masked = (b1 & 0x80) !== 0;
      let len = b1 & 0x7f, off = 2;
      if(len === 126){
        if(buf.length < 4) break;
        len = buf.readUInt16BE(2); off = 4;
      } else if(len === 127){
        if(buf.length < 10) break;
        const hi = buf.readUInt32BE(2);
        len = buf.readUInt32BE(6); off = 10;
        if(hi !== 0 || len > MAX_MSG){ wsClose(sock); return; }
      }
      if(len > MAX_MSG){ wsClose(sock); return; }
      let mask = null;
      if(masked){
        if(buf.length < off + 4) break;
        mask = buf.subarray(off, off + 4); off += 4;
      }
      if(buf.length < off + len) break;
      let payload = Buffer.from(buf.subarray(off, off + len));
      buf = buf.subarray(off + len);
      if(mask) for(let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];

      if(op === 0x8){ cb.close(); wsClose(sock); return; }
      else if(op === 0x9){ wsSendFrame(sock, 0xA, payload); cb.alive(); }
      else if(op === 0xA){ cb.alive(); }
      else if(op === 0x1 || op === 0x2 || op === 0x0){
        cb.alive();
        if(op !== 0x0){ fragOp = op; frags = [payload]; }
        else frags.push(payload);
        if(frags.reduce((s,f)=>s+f.length,0) > MAX_MSG){ wsClose(sock); return; }
        if(fin){
          const whole = Buffer.concat(frags); frags = [];
          if(fragOp === 0x1) cb.msg(whole.toString('utf8'));
        }
      }
    }
  });
  sock.on('error', ()=>cb.close());
  sock.on('close', ()=>cb.close());
}

/* ---------- Abuse protection ---------- */
const RATE_N      = 80;            // max messages per connection…
const RATE_WIN    = 10000;         // …per 10 seconds
const FAIL_MAX    = 5;             // wrong passwords per IP…
const FAIL_WIN    = 10 * 60000;    // …per 10 minutes → lockout
const CREATE_MAX  = 4;             // rooms created per IP…
const CREATE_WIN  = 60 * 60000;    // …per hour
const ipFails   = new Map();       // ip -> [timestamps]
const ipCreates = new Map();
function strikes(map, ip, win){
  const now = Date.now();
  const a = (map.get(ip) || []).filter(t => now - t < win);
  map.set(ip, a);
  return a.length;
}
function strike(map, ip){
  const a = map.get(ip) || [];
  a.push(Date.now());
  map.set(ip, a);
}
function passHash(s){ return crypto.createHash('sha256').update(String(s || '')).digest('hex'); }
function passMatch(hashHex, given){
  const a = Buffer.from(passHash(given), 'utf8');
  const b = Buffer.from(String(hashHex || ''), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const HELPER_KEYS = ['on','unlockPrompt','counts','passConfirm','warn','edge','hand','handReminder','pathBlood'];   // host-lockable helpers — mirror the client's HELPER_DEFS
function cleanHelperPolicy(raw){
  const s  = (raw && typeof raw === 'object') ? raw : {};
  const ss = (s.settings && typeof s.settings === 'object') ? s.settings : {};
  const out = { settings: {}, allowLocal: s.allowLocal !== false, tournament: !!s.tournament };
  for(const k of HELPER_KEYS) out.settings[k] = ss[k] !== false;   // default on
  return out;
}

/* ---------- Rooms ---------- */
const rooms = new Map();   // name -> { name, pass, players:[{name, token, sock, last, off}], hostToken, created }

function roster(room){
  return room.players.map((p, i) => ({
    seat: i + 1, name: p.name, online: !!p.sock, host: p.token === room.hostToken,
    out: !!p.out, vp: p.vp || 0, vacant: !!p.vacant, off: p.off || 0, muted: !!p.muted
  }));
}
function bcast(room, obj, except){
  room.players.forEach(p => { if(p.sock && p.sock !== except) wsSend(p.sock, obj); });
  (room.watchers || []).forEach(w => { if(w.sock && w.sock !== except) wsSend(w.sock, obj); });
}
function sys(room, msg){ bcast(room, { t:'sys', msg }); }
function rosterUpd(room){ bcast(room, { t:'roster', players: roster(room), watchers: (room.watchers || []).length, watcherList: (room.watchers || []).map(w => ({ name: w.name, muted: !!w.muted })) }); }
/* Lobby snapshot — sent while a room waits for the host to start. Carries each
   player's claimed seat and whether they've loaded a deck, plus the spectators. */
function lobbyState(room){
  return { t:'lobby',
    seats: room.players.length,
    players: room.players.map((q, i) => ({
      idx: i + 1, name: q.name, online: !!q.sock, host: q.token === room.hostToken,
      seat: q.seatPick || null, muted: !!q.muted,
      deck: !!(q.game && q.game.deckLib && q.game.deckLib.length) })),
    watchers: (room.watchers || []).map(w => ({ name: w.name, muted: !!w.muted })) };
}
function bcastLobby(room){ if(!room.started) bcast(room, lobbyState(room)); }
/* Next seat in rotation, skipping ousted AND vacant (awaiting-takeover) seats. */
function nextLiveSeat(room, fromIdx){
  const n = room.players.length;
  for(let k = 1; k <= n; k++){ const c = (fromIdx + k) % n; const q = room.players[c]; if(q && !q.out && !q.vacant) return c; }
  return fromIdx;
}
/* Free a seat mid-game: the deck + public board stay (frozen) for a replacement.
   toSpectator → the controller becomes a watcher; otherwise they're disconnected. */
function vacateSeat(room, q, toSpectator){
  const idx = room.players.indexOf(q);
  const sock = q.sock;
  q.vacant = true; q.sock = null; q.off = 0;
  q.token = token();                        // orphan the seat's credential — only a takeover re-binds it
  if(toSpectator && sock){
    room.watchers = room.watchers || [];
    room.watchers.push({ name: q.name, sock, muted: !!q.muted });
    const c = connOf(sock); if(c){ c.player = null; c.watch = true; c.wname = q.name; }
    wsSend(sock, { t:'demoted' });
  } else if(sock){
    wsSend(sock, { t:'err', msg:'You were removed from the table by the host.' });
    try{ wsClose(sock); }catch(err){}
  }
  if(room.turnSeat === idx + 1){            // the active seat was vacated — move the turn on
    const ni = nextLiveSeat(room, idx);
    room.turnSeat = ni + 1;
    bcast(room, { t:'turn', seat: room.turnSeat, who: room.players[ni].name });
  }
}
function cleanName(s){ return String(s || '').replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0, 24); }
function findByToken(room, tok){ return room.players.find(p => p.token === tok && !p.vacant); }
function connOf(sock){ for(const c of conns){ if(c.sock === sock) return c; } return null; }
function vWarn(conn, m){
  if(m && m.v && String(m.v) !== VERSION)
    wsSend(conn.sock, { t:'sys', msg:'⚠ Version mismatch — client v' + cleanName(String(m.v)).slice(0,12) + ' / server v' + VERSION + '. Update the older one.' });
}

function joinReply(sock, room, p){
  const msg = { t:'joined', room: room.name, token: p.token, you: p.name,
                seat: room.players.indexOf(p) + 1, players: roster(room) };
  if(p.game) Object.assign(msg, pileCounts(p.game));   // your deck is still alive server-side
  if(room.turnSeat) msg.turn = room.turnSeat;
  if(room.matchEnd) msg.matchEnd = room.matchEnd;
  msg.reactSecs = room.reactSecs || 5;
  if(room.tableView) msg.tableView = room.tableView;
  if(room.l3shape) msg.l3shape = room.l3shape;
  msg.boardMode = room.boardMode || 'structured';
  msg.chat = room.chat !== false; msg.specChat = room.specChat !== false;
  msg.srv = VERSION;
  msg.watchers = (room.watchers || []).length;
  msg.lobby = !room.started;
  if(room.escrowSalt) msg.escrowSalt = room.escrowSalt;
  msg.helperPolicy = room.helperPolicy || cleanHelperPolicy(null);
  if(p.handBlob) msg.handBlob = p.handBlob;     // your encrypted hand, restorable even after cleared storage
  if(p.pubOwn || p.pub) msg.myPub = p.pubOwn || p.pub;
  wsSend(sock, msg);
  if(!room.started){ wsSend(sock, lobbyState(room)); return; }   // a waiting lobby — no boards to push yet
  /* Newcomers get everyone's current public boards */
  room.players.forEach(q => {
    if(q !== p && q.pub) wsSend(sock, { t:'board', seat: room.players.indexOf(q) + 1, who: q.name, pub: q.pub });
  });
}

/* ---------- Server-side game state (milestone 2B.1) ----------
   The hidden piles live here. Clients never receive library/crypt
   contents except through explicit, owner-only verbs (draw, browse). */
const MAX_PILE = 250, MAX_NAME = 64, MAX_PUB_CARDS = 400;

function cleanCard(s){ return String(s || '').replace(/[\u0000-\u001f\u007f<>]/g,'').trim().slice(0, MAX_NAME); }
function expandDeck(list){
  const out = [];
  if(Array.isArray(list)) for(const e of list){
    if(!e) continue;
    const name = cleanCard(e.name);
    const qty  = Math.max(1, Math.min(parseInt(e.qty, 10) || 1, 30));
    if(!name) continue;
    for(let i = 0; i < qty && out.length < MAX_PILE; i++) out.push(name);
  }
  return out;
}
function pileCounts(g){ return { lib: g.lib.length, crypt: g.crypt.length }; }
function dealNow(p, room){
  const g = p.game;
  g.lib   = [...g.deckLib];   shuffle(g.lib);
  g.crypt = [...g.deckCrypt]; shuffle(g.crypt);
  const hand = [], unc = [];
  for(let i = 0; i < 7 && g.lib.length;   i++) hand.push(g.lib.pop());
  if(!room || room.boardMode !== 'classic') for(let i = 0; i < 4 && g.crypt.length; i++) unc.push(g.crypt.pop());
  wsSend(p.sock, Object.assign({ t:'dealt', deckName: g.deckName, hand, unc }, pileCounts(g)));
}
function sendDrew(p, zone, kind, name, extra){
  wsSend(p.sock, Object.assign({ t:'drew', zone, kind, name }, extra || {}, pileCounts(p.game)));
}
/* Defense in depth: re-filter the public board server-side so hidden
   info can never be relayed even if a client "forgets" to strip it. */
const PUB_ZONES = ['ready','torpor','uncontrolled','ash','burned'];
function sanitizePub(pub, keepHidden){
  if(!pub || typeof pub !== 'object') return null;
  const out = {
    deckName: keepHidden ? cleanCard(pub.deckName) : '',    // owner's own pubOwn keeps the name; never relay it to opponents
    pool:  Math.max(-99, Math.min(999, parseInt(pub.pool, 10) || 0)),
    edge:  !!pub.edge,
    phase: Math.max(-1, Math.min(9, parseInt(pub.phase, 10) ?? -1)),
    bw: Math.max(300, Math.min(10000, parseInt(pub.bw, 10) || 1200)),
    bh: Math.max(200, Math.min(10000, parseInt(pub.bh, 10) || 700)),
    counts: {
      hand:    Math.max(0, Math.min(99,  parseInt(pub.counts && pub.counts.hand, 10)    || 0)),
      library: Math.max(0, Math.min(999, parseInt(pub.counts && pub.counts.library, 10) || 0)),
      crypt:   Math.max(0, Math.min(999, parseInt(pub.counts && pub.counts.crypt, 10)   || 0))
    },
    cards: []
  };
  if(pub.target && typeof pub.target === 'object'){
    const ts = parseInt(pub.target.seat, 10), tc = cleanCard(String(pub.target.cid || '')).slice(0, 16);
    if(ts >= 1 && ts <= 6 && tc) out.target = { seat: ts, cid: tc };
  }
  const cards = Array.isArray(pub.cards) ? pub.cards.slice(0, MAX_PUB_CARDS) : [];
  for(const c of cards){
    if(!c || !PUB_ZONES.includes(c.zone)) continue;     // hand/library/crypt never relay
    out.cards.push({
      id: cleanCard(c.id).slice(0, 16),
      name: (c.faceDown && !keepHidden) ? undefined : cleanCard(c.name) || undefined,
      kind: c.kind === 'crypt' ? 'crypt' : 'lib',
      zone: c.zone,
      x: Math.round(+c.x) || 0, y: Math.round(+c.y) || 0,
      locked: !!c.locked || undefined,
      faceDown: !!c.faceDown || undefined,
      blood: Math.max(0, Math.min(99, parseInt(c.blood, 10) || 0)) || undefined,
      blue:  Math.max(0, Math.min(99, parseInt(c.blue, 10)  || 0)) || undefined,
      green: Math.max(0, Math.min(99, parseInt(c.green, 10) || 0)) || undefined,
      counters: Array.isArray(c.counters) ? c.counters.slice(0, 12).map(cleanCard).filter(Boolean) : undefined,
      owner: c.owner ? cleanCard(c.owner) : undefined,
      controller: c.controller ? cleanCard(c.controller) : undefined,
      host: c.host ? cleanCard(String(c.host)).slice(0, 16) : undefined,
      attached: Array.isArray(c.attached) ? c.attached.slice(0, 30).map(a => cleanCard(String(a)).slice(0, 16)) : undefined
    });
  }
  return out;
}

/* ---------- Per-connection message handling ---------- */
function fxCard(o){                                   // sanitise an FX card payload before relaying (only public fields; face-down never carries a name)
  if(!o || typeof o !== 'object') return null;
  const kind = (o.kind === 'crypt') ? 'crypt' : 'lib';
  const faceDown = !!o.faceDown;
  const name = faceDown ? '' : String(o.name || '').slice(0, 120);
  return { name, kind, faceDown };
}
// In-game message dispatch. One handler per verb (signature: conn, room, p, m). Order-independent;
// add a verb by adding a key. Runs inside handle()'s try, so a throw lands in its catch.
const GAME_HANDLERS = {
  log(conn, room, p, m){
    bcast(room, { t:'log', who: p.name, html: String(m.html || '').slice(0, 4000) }, conn.sock);
  },
  chat(conn, room, p, m){
    if(room.chat === false) return wsSend(conn.sock, { t:'err', msg:'Chat is disabled in this room.' });
    if(p.muted) return wsSend(conn.sock, { t:'err', msg:'You are muted by the host.' });
    const msg = String(m.msg || '').trim().slice(0, 300);
    if(msg) bcast(room, { t:'chat', who: p.name, msg });
  },
  /* ---- game verbs (2B.1): the hidden piles live on the server ---- */
  deck(conn, room, p, m){
    const lib = expandDeck(m.library), crypt = expandDeck(m.crypt);
    if(!lib.length && !crypt.length) return wsSend(conn.sock, { t:'err', msg:'The deck was empty.' });
    p.game = { deckName: cleanCard(m.name), deckLib: lib, deckCrypt: crypt, lib: [], crypt: [] };
    if(room.started) dealNow(p, room);
    else { wsSend(conn.sock, { t:'deckok', deckName: p.game.deckName }); bcastLobby(room); }
    if(p.out){ p.out = false; rosterUpd(room); }   // a fresh deal puts you back in the game
    console.log('[game] ' + p.name + ' loaded a deck (' + crypt.length + ' crypt / ' + lib.length + ' library) in "' + room.name + '"' + (room.started ? '' : ' (lobby)'));
  },
  redeal(conn, room, p, m){
    if(!room.started) return wsSend(conn.sock, { t:'err', msg:'The game has not started yet.' });
    if(!p.game) return wsSend(conn.sock, { t:'err', msg:'Import a deck first.' });
    dealNow(p, room);
  },
  draw(conn, room, p, m){
    if(!p.game || !p.game.lib.length) return wsSend(conn.sock, { t:'err', msg:'The library is empty.' });
    sendDrew(p, 'hand', 'lib', p.game.lib.pop());
  },
  drawCrypt(conn, room, p, m){
    if(!p.game || !p.game.crypt.length) return wsSend(conn.sock, { t:'err', msg:'The crypt is empty.' });
    sendDrew(p, 'uncontrolled', 'crypt', p.game.crypt.pop());
  },
  pileTop(conn, room, p, m){
    if(!p.game) return;
    const isCrypt = m.kind === 'crypt';
    const pile = isCrypt ? p.game.crypt : p.game.lib;
    if(!pile.length) return wsSend(conn.sock, { t:'err', msg: isCrypt ? 'The crypt is empty.' : 'The library is empty.' });
    const zone = m.action === 'burn' ? 'burned' : 'ash';
    const count = Math.min(Math.max(parseInt(m.n,10)||1, 1), pile.length);
    for(let i=0;i<count;i++){
      if(!pile.length) break;
      sendDrew(p, zone, isCrypt ? 'crypt' : 'lib', pile.pop());
    }
  },
  pileReturn(conn, room, p, m){
    if(!p.game) return;
    const name = cleanCard(m.name);
    if(!name) return;
    const pile = m.kind === 'crypt' ? p.game.crypt : p.game.lib;
    if(pile.length >= MAX_PILE) return;
    if(m.pos === 'bottom') pile.unshift(name);
    else if(m.pos === 'shuffle'){ pile.push(name); shuffle(pile); }
    else pile.push(name);
    wsSend(conn.sock, Object.assign({ t:'pileN' }, pileCounts(p.game)));
  },
  shufPile(conn, room, p, m){
    if(!p.game) return;
    shuffle(m.pile === 'crypt' ? p.game.crypt : p.game.lib);
    wsSend(conn.sock, Object.assign({ t:'pileN' }, pileCounts(p.game)));
  },
  browse(conn, room, p, m){
    if(!p.game) return wsSend(conn.sock, { t:'err', msg:'Import a deck first.' });
    const pile = m.pile === 'crypt' ? p.game.crypt : p.game.lib;
    /* Owner-only: the list goes to this socket and nowhere else */
    wsSend(conn.sock, { t:'pileList', pile: m.pile === 'crypt' ? 'crypt' : 'library', names: [...pile].reverse() });
  },
  pileTake(conn, room, p, m){
    if(!p.game) return;
    const crypt = m.pile === 'crypt';
    const pile = crypt ? p.game.crypt : p.game.lib;
    const name = cleanCard(m.name);
    let idx = pile.length - 1 - (parseInt(m.i, 10) || 0);     // client lists top-first
    if(pile[idx] !== name){                                    // pile shifted — find by name from the top
      idx = pile.lastIndexOf(name);
    }
    if(idx < 0 || idx >= pile.length) return wsSend(conn.sock, { t:'err', msg:'That card is no longer there.' });
    pile.splice(idx, 1);
    sendDrew(p, crypt ? 'uncontrolled' : 'hand', crypt ? 'crypt' : 'lib', name, { took: true, pile: crypt ? 'crypt' : 'library' });
  },
  reveal(conn, room, p, m){
    if(!p.game) return wsSend(conn.sock, { t:'err', msg:'Import a deck first.' });
    const isCrypt = m.kind === 'crypt';
    const pile = isCrypt ? p.game.crypt : p.game.lib;
    if(!pile.length) return wsSend(conn.sock, { t:'err', msg: isCrypt ? 'The crypt is empty.' : 'The library is empty.' });
    const n = Math.min(Math.max(1, parseInt(m.n, 10) || 1), 30, pile.length);
    const names = [];
    for(let i = 0; i < n; i++) names.push(pile.pop());
    wsSend(conn.sock, Object.assign({ t:'revealed', names, kind: isCrypt ? 'crypt' : 'lib' }, pileCounts(p.game)));
  },
  pileBulk(conn, room, p, m){
    if(!p.game) return;
    const addL = Array.isArray(m.lib)   ? m.lib.slice(0, MAX_PILE).map(cleanCard).filter(Boolean)   : [];
    const addC = Array.isArray(m.crypt) ? m.crypt.slice(0, MAX_PILE).map(cleanCard).filter(Boolean) : [];
    addL.forEach(nm => { if(p.game.lib.length   < MAX_PILE) p.game.lib.push(nm); });
    addC.forEach(nm => { if(p.game.crypt.length < MAX_PILE) p.game.crypt.push(nm); });
    if(m.shuffle){ shuffle(p.game.lib); shuffle(p.game.crypt); }
    wsSend(conn.sock, Object.assign({ t:'pileN' }, pileCounts(p.game)));
  },
  pass(conn, room, p, m){
    const n = room.players.length;
    const i = room.players.indexOf(p);
    if(i > -1 && n){
      const ni = nextLiveSeat(room, i);               // your prey is next, skipping ousted & vacant seats
      room.turnSeat = ni + 1;
      bcast(room, { t:'turn', seat: room.turnSeat, who: room.players[ni].name });
    }
  },
  /* ---- lobby: roll a die, claim a seat, start the game ---- */
  roll(conn, room, p, m){
    const sides = (m.sides >= 2 && m.sides <= 100) ? (m.sides | 0) : 6;
    bcast(room, { t:'roll', who: p.name, n: rnd(sides) + 1, sides });
  },
  seat(conn, room, p, m){
    if(room.started) return wsSend(conn.sock, { t:'err', msg:'The game has already started.' });
    const i = m.seat | 0, N = room.players.length;
    if(i < 1 || i > N) return wsSend(conn.sock, { t:'err', msg:'No such seat.' });
    if(room.players.some(q => q !== p && q.seatPick === i))
      return wsSend(conn.sock, { t:'err', msg:'That seat is already taken.' });
    p.seatPick = i;
    bcastLobby(room);
  },
  start(conn, room, p, m){
    if(p.token !== room.hostToken) return wsSend(conn.sock, { t:'err', msg:'Only the host can start the game.' });
    if(room.started)               return wsSend(conn.sock, { t:'err', msg:'The game has already started.' });
    const N = room.players.length;
    if(!room.players.every(q => q.sock))
      return wsSend(conn.sock, { t:'err', msg:'Everyone must be connected to start.' });
    if(!room.players.every(q => q.game && q.game.deckLib && q.game.deckLib.length))
      return wsSend(conn.sock, { t:'err', msg:'Everyone must load a deck first.' });
    const picks = room.players.map(q => q.seatPick);
    if(!(picks.every(s => s >= 1 && s <= N) && new Set(picks).size === N))
      return wsSend(conn.sock, { t:'err', msg:'Everyone must pick a seat first.' });
    room.players.sort((a, b) => a.seatPick - b.seatPick);     // claimed seats become the turn order
    room.players.forEach(q => { q.seatPick = null; q.out = false; q.vp = 0; });
    room.started = true;
    room.turnSeat = 1;
    if(room.matchMins) room.matchEnd = Date.now() + room.matchMins * 60000;
    bcast(room, { t:'started', players: roster(room), turn: 1, matchEnd: room.matchEnd || undefined, tableView: room.tableView || undefined, l3shape: room.l3shape || undefined, boardMode: room.boardMode || undefined });
    bcast(room, { t:'turn', seat: 1, who: room.players[0].name });
    sys(room, 'The game begins — seats are locked. 🦇');
    room.players.forEach(q => { if(q.sock) dealNow(q, room); });
    rosterUpd(room);
    console.log('[room] "' + room.name + '" started with ' + N + ' player(s)');
  },
  say(conn, room, p, m){
    const i = parseInt(m.i, 10);
    if(i >= 0 && i <= 15)
      bcast(room, { t:'say', who: p.name, seat: room.players.indexOf(p) + 1, i });
  },
  decide(conn, room, p, m){
    bcast(room, { t:'decide', who: p.name, secs: room.reactSecs || 5 });
  },
  fx(conn, room, p, m){
    if(!room.started) return;
    const kind = (m.kind === 'lock' || m.kind === 'unlock' || m.kind === 'play') ? m.kind : null;
    if(!kind) return;
    const card = fxCard(m.card);
    if(!card) return;
    const target = (kind === 'play') ? fxCard(m.target) : null;
    bcast(room, { t:'fx', who: p.name, seat: room.players.indexOf(p) + 1, kind, card, target, verb: String(m.verb || '').slice(0, 40) }, conn.sock);
  },
  revealHand(conn, room, p, m){
    // Hand reveal. The private card list goes ONLY to the recipient(s). A public line
    // (no card names) goes to everyone else — but NOT the recipient (they get the
    // detailed private line instead) and NOT the sender (the sender logs it locally).
    if(!room.started) return;
    const cards = (Array.isArray(m.cards) ? m.cards : []).slice(0, 30).map(c => ({
      name: cleanCard(String(c.name || '')),
      kind: c.kind === 'crypt' ? 'crypt' : 'lib'
    })).filter(c => c.name);
    if(!cards.length) return;
    const payload = { t:'revealHand', from: p.name, seat: room.players.indexOf(p) + 1, who: p.name, cards };
    const pubLine = String(m.pub || '').slice(0, 4000);
    if(m.to === 'all'){
      // Everyone except the sender is a recipient -> private line to all of them; no public line needed.
      bcast(room, payload, conn.sock);
    } else {
      const seatNo = m.to | 0;
      const q = room.players[seatNo - 1];
      if(q && q.sock && !q.off) wsSend(q.sock, payload);   // private list to the recipient only
      // Public line to everyone EXCEPT the sender and the recipient.
      if(pubLine){
        room.players.forEach(x => { if(x !== p && x !== q && x.sock) wsSend(x.sock, { t:'log', who: p.name, html: pubLine }); });
        (room.watchers || []).forEach(w => { if(w.sock) wsSend(w.sock, { t:'log', who: p.name, html: pubLine }); });
      }
    }
  },
  logTo(conn, room, p, m){
    // Private log line from one player to a specific seat (used for target-of-revealed-card).
    // The sender has already logged their own private line locally; this routes a private
    // notification to one recipient only. No public line — the caller sends that separately.
    if(!room.started) return;
    const toSeat = m.toSeat | 0;
    const q = room.players[toSeat - 1];
    const html = String(m.html || '').slice(0, 2000);
    if(q && q !== p && q.sock && !q.off) wsSend(q.sock, { t:'logTo', from: p.name, html });
  },
  openHand(conn, room, p, m){
    // Standing "play with open hand" grant. Routes the granter's live hand (clean card
    // list) to the chosen recipient(s), or a revoke notice. Same trust model as revealHand:
    // the card names leave the client in clear and the server can see them (a deliberate
    // exception to the escrow secrecy, scoped to the grant). The granter's own client owns
    // the grant state; the server only routes.
    if(!room.started) return;
    const seatOf = room.players.indexOf(p) + 1;
    const cards = (Array.isArray(m.cards) ? m.cards : []).slice(0, 30).map(c => ({
      name: cleanCard(String(c.name || '')),
      kind: c.kind === 'crypt' ? 'crypt' : 'lib'
    })).filter(c => c.name);
    if(m.revoke){
      const payload = { t:'openHandRevoke', from: p.name, seat: seatOf };
      if(m.to === 'all') bcast(room, payload, conn.sock);
      else { const q = room.players[(m.to | 0) - 1]; if(q && q.sock && !q.off) wsSend(q.sock, payload); }
      return;
    }
    const payload = { t:'openHandGrant', from: p.name, seat: seatOf, who: p.name, cards };
    if(m.to === 'all'){
      bcast(room, payload, conn.sock);                 // everyone else may inspect
    } else {
      const q = room.players[(m.to | 0) - 1];
      if(q && q.sock && !q.off) wsSend(q.sock, payload); // private to the one recipient
    }
  },
  give(conn, room, p, m){
    const seatNo = m.seat | 0;
    const q = room.players[seatNo - 1];
    if(!q) return wsSend(conn.sock, { t:'err', msg:'No such seat.' });
    if(q === p) return wsSend(conn.sock, { t:'err', msg:'That is your own board.' });
    if(!q.sock || q.off) return wsSend(conn.sock, { t:'err', msg: q.name + ' is offline — the card stays with you.' });
    const card = m.card || {};
    const ci = v => Math.max(0, Math.min(99, parseInt(v, 10) || 0));
    wsSend(q.sock, {
      t:'given', from: p.name,
      name: cleanCard(card.name), kind: card.kind === 'crypt' ? 'crypt' : 'lib',
      faceDown: !!card.faceDown, locked: !!card.locked,
      blood: ci(card.blood), blue: ci(card.blue), green: ci(card.green),
      counters: Array.isArray(card.counters) ? card.counters.slice(0, 12).map(cleanCard).filter(Boolean) : [],
      owner: cleanCard(card.owner) || p.name,                       // auto-stamp the giver
      attachTo: m.attachTo ? cleanCard(String(m.attachTo)) : null,
      rx: typeof m.rx === 'number' ? Math.max(0, Math.min(1, m.rx)) : null,
      ry: typeof m.ry === 'number' ? Math.max(0, Math.min(1, m.ry)) : null
    });
    wsSend(conn.sock, { t:'gave', to: q.name });
  },
  bounty(conn, room, p, m){
    const i = room.players.indexOf(p);
    p.out = true;                                   // ousted Methuselahs leave the rotation
    if(room.players.length > 1 && i > -1){
      const pred = room.players[(i - 1 + room.players.length) % room.players.length];
      if(pred !== p){
        pred.vp = Math.min(10, (pred.vp || 0) + 1); // rulebook: 1 VP + 6 pool to the predator
        if(pred.sock) wsSend(pred.sock, { t:'bounty', from: p.name });
      }
      sys(room, p.name + ' was ousted — the 6 pool bounty and 1 VP go to ' + pred.name + '.');
    }
    rosterUpd(room);
  },
  hostSetPool(conn, room, p, m){
    if(p.token !== room.hostToken) return wsSend(conn.sock, { t:'err', msg:'Only the host can set a player’s pool.' });
    const q = room.players[(m.seat | 0) - 1];
    if(!q || q.vacant) return wsSend(conn.sock, { t:'err', msg:'No such player.' });
    const v = Math.max(0, Math.min(999, parseInt(m.val, 10) || 0));
    if(q.sock) wsSend(q.sock, { t:'forceSetPool', val: v });          // pool is client-authored -> the target applies it and rebroadcasts; a disconnected target can't (host can oust instead)
    sys(room, 'The host set ' + q.name + '’s pool to ' + v + '.');
  },
  hostOust(conn, room, p, m){
    if(p.token !== room.hostToken) return wsSend(conn.sock, { t:'err', msg:'Only the host can oust a player.' });
    const i = (m.seat | 0) - 1, q = room.players[i];
    if(!q || q.vacant) return wsSend(conn.sock, { t:'err', msg:'No such player.' });
    if(q.out) return wsSend(conn.sock, { t:'err', msg:'That player is already ousted.' });
    q.out = true;                                                      // server-authoritative: works even if the target is disconnected
    if(room.players.length > 1){
      const pred = room.players[(i - 1 + room.players.length) % room.players.length];
      if(pred !== q){
        pred.vp = Math.min(10, (pred.vp || 0) + 1);
        if(pred.sock) wsSend(pred.sock, { t:'bounty', from: q.name });
        sys(room, q.name + ' was ousted by the host — the 6 pool bounty and 1 VP go to ' + pred.name + '.');
      } else sys(room, q.name + ' was ousted by the host.');
    } else sys(room, q.name + ' was ousted by the host.');
    if(q.sock) wsSend(q.sock, { t:'forceOust' });                      // tell the (connected) target to return its cards; cosmetic, skipped if offline
    rosterUpd(room);
  },
  hostUnoust(conn, room, p, m){
    if(p.token !== room.hostToken) return wsSend(conn.sock, { t:'err', msg:'Only the host can do that.' });
    const q = room.players[(m.seat | 0) - 1];
    if(!q) return wsSend(conn.sock, { t:'err', msg:'No such player.' });
    if(q.out){ q.out = false; sys(room, q.name + ' was returned to the game by the host.'); rosterUpd(room); }
  },
  setHelperPolicy(conn, room, p, m){
    if(p.token !== room.hostToken)
      return wsSend(conn.sock, { t:'err', msg:'Only the host can set the table helper policy.' });
    room.helperPolicy = cleanHelperPolicy(m.policy);
    bcast(room, { t:'helperPolicy', policy: room.helperPolicy });
    sys(room, 'The host set the helper policy — ' + (room.helperPolicy.tournament
      ? 'Tournament mode: all helpers off for everyone.'
      : room.helperPolicy.allowLocal
        ? 'players may use their own helper settings.'
        : 'helpers locked to the host’s settings.'));
  },
  kick(conn, room, p, m){
    if(p.token !== room.hostToken)
      return wsSend(conn.sock, { t:'err', msg:'Only the host can remove players.' });
    let q = null, isWatcher = false;
    if(m.name != null){
      const nm = cleanName(m.name);
      q = room.players.find(x => x.name === nm && !x.vacant);
      if(!q){ const w = (room.watchers || []).find(x => x.name === nm); if(w){ q = w; isWatcher = true; } }
    } else {
      q = room.players[(m.seat | 0) - 1];
    }
    if(!q || q === p) return wsSend(conn.sock, { t:'err', msg:'No such player.' });
    if(isWatcher){
      room.watchers = (room.watchers || []).filter(w => w !== q);
      if(q.sock){ wsSend(q.sock, { t:'err', msg:'You were removed by the host.' }); try{ wsClose(q.sock); }catch(err){} }
    } else {
      if(q.vacant) return wsSend(conn.sock, { t:'err', msg:'That seat is already open.' });
      if(!q.sock && q.off && Date.now() - q.off < GRACE_MS)
        return wsSend(conn.sock, { t:'err', msg:'That seat is still reconnecting — give them a moment.' });
      if(room.started){
        vacateSeat(room, q, false);            // seat frozen for a takeover, controller disconnected
        sys(room, q.name + '’s seat was vacated by the host — promote a spectator to take it over.');
      } else {
        room.players.splice(room.players.indexOf(q), 1);
        room.players.forEach(x => { if(x.seatPick > room.players.length) x.seatPick = null; });
        if(q.sock){ wsSend(q.sock, { t:'err', msg:'You were removed by the host.' }); try{ wsClose(q.sock); }catch(err){} }
        sys(room, q.name + ' was removed by the host.');
      }
    }
    console.log('[room] ' + q.name + ' kicked/vacated in "' + room.name + '" by ' + p.name);
    rosterUpd(room);
    if(!room.started) bcastLobby(room);
  },
  demote(conn, room, p, m){
    if(p.token !== room.hostToken) return wsSend(conn.sock, { t:'err', msg:'Only the host can do that.' });
    const q = room.players.find(x => x.name === cleanName(m.name) && !x.vacant);
    if(!q || q === p) return wsSend(conn.sock, { t:'err', msg:'No such player.' });
    if(!q.sock && q.off && Date.now() - q.off < GRACE_MS)
      return wsSend(conn.sock, { t:'err', msg:'That seat is still reconnecting — give them a moment.' });
    if(room.started){
      vacateSeat(room, q, true);               // seat frozen for a takeover, controller → spectator
      sys(room, q.name + '’s seat is now open — promote a spectator to take it over. 👁');
    } else {
      room.players.splice(room.players.indexOf(q), 1);
      room.players.forEach(x => { if(x.seatPick > room.players.length) x.seatPick = null; });
      room.watchers = room.watchers || [];
      room.watchers.push({ name: q.name, sock: q.sock, muted: !!q.muted });
      const qc = q.sock && connOf(q.sock);
      if(qc){ qc.player = null; qc.watch = true; qc.wname = q.name; }
      if(q.sock) wsSend(q.sock, { t:'demoted' });
      sys(room, q.name + ' was moved to spectator by the host. 👁');
    }
    rosterUpd(room); bcastLobby(room);
  },
  promote(conn, room, p, m){
    if(p.token !== room.hostToken) return wsSend(conn.sock, { t:'err', msg:'Only the host can do that.' });
    const wi = (room.watchers || []).findIndex(w => w.name === cleanName(m.name));
    if(wi < 0) return wsSend(conn.sock, { t:'err', msg:'No such spectator.' });
    if(room.started){
      /* takeover: a spectator inherits a vacant seat's deck + frozen board, with an empty hand */
      const target = room.players[(m.seat | 0) - 1];
      if(!target || !target.vacant) return wsSend(conn.sock, { t:'err', msg:'That seat is not open for takeover.' });
      const w = room.watchers.splice(wi, 1)[0];
      target.name = w.name; target.token = token(); target.sock = w.sock;
      target.vacant = false; target.off = 0; target.muted = !!w.muted;
      const wc = w.sock && connOf(w.sock);
      if(wc){ wc.watch = false; wc.wname = null; wc.player = target; }
      const seatNo = room.players.indexOf(target) + 1;
      if(w.sock) wsSend(w.sock, {
        t:'took', token: target.token, seat: seatNo,
        deckName: target.game ? target.game.deckName : '',
        lib: target.game ? target.game.lib.length : 0,
        crypt: target.game ? target.game.crypt.length : 0,
        pub: target.pubOwn || target.pub || null,
        hand: [],                                     // legacy shape; the real hand rides in handBlob below
        escrowSalt: room.escrowSalt || undefined,
        handBlob: target.handBlob || undefined,       // the AFK player's encrypted hand — restored on takeover
        turn: room.turnSeat || null, matchEnd: room.matchEnd || undefined, reactSecs: room.reactSecs || 5,
        boardMode: room.boardMode || undefined,
        srv: VERSION });
      sys(room, w.name + ' took over seat ' + seatNo + '. 🪑');
      console.log('[room] ' + w.name + ' took over seat ' + seatNo + ' in "' + room.name + '"');
      rosterUpd(room);
    } else {
      if(room.players.length >= MAX_PLAYERS) return wsSend(conn.sock, { t:'err', msg:'The table is full ('+MAX_PLAYERS+' seats).' });
      const w = room.watchers.splice(wi, 1)[0];
      const np = { name: w.name, token: token(), sock: w.sock, last: Date.now(), off: w.sock ? 0 : Date.now(), seatPick: null, muted: !!w.muted };
      room.players.push(np);
      const wc = w.sock && connOf(w.sock);
      if(wc){ wc.watch = false; wc.wname = null; wc.player = np; }
      if(w.sock) joinReply(w.sock, room, np);
      sys(room, w.name + ' was promoted to a player by the host.');
      rosterUpd(room); bcastLobby(room);
    }
  },
  mute(conn, room, p, m){
    if(p.token !== room.hostToken) return wsSend(conn.sock, { t:'err', msg:'Only the host can mute.' });
    const nm = cleanName(m.name), on = m.on !== false;
    const q = room.players.find(x => x.name === nm) || (room.watchers || []).find(x => x.name === nm);
    if(!q || q === p) return wsSend(conn.sock, { t:'err', msg:'No such player.' });
    q.muted = on;
    if(q.sock) wsSend(q.sock, { t:'muted', on });
    sys(room, q.name + (on ? ' was muted by the host. 🔇' : ' was unmuted by the host. 🔊'));
    rosterUpd(room);
    if(!room.started) bcastLobby(room);
  },
  vp(conn, room, p, m){
    const d = parseFloat(m.d);
    if(Number.isFinite(d) && Math.abs(d) <= 3){
      p.vp = Math.max(0, Math.min(10, Math.round(((p.vp || 0) + d) * 2) / 2));
      rosterUpd(room);
    }
  },
  unoust(conn, room, p, m){
    if(p.out){ p.out = false; sys(room, p.name + ' returns to the game.'); rosterUpd(room); }
  },
  edgePass(conn, room, p, m){   // relay Edge handoff to the target player; sender already released it locally
    if(!room.started) return;
    const q=room.players[(m.toSeat|0)-1];
    const pos = m.pos && Number.isFinite(m.pos.x) && Number.isFinite(m.pos.y) ? { x: Math.round(+m.pos.x), y: Math.round(+m.pos.y) } : undefined;
    if(q&&q.sock) wsSend(q.sock, {t:'edgePass', toSeat:m.toSeat|0, fromName:String(m.fromName||p.name).slice(0,32), pos});
  },
  edgeTake(conn, room, p, m){   // a player took the Edge via their button → tell everyone else they lost it (Edge is unique)
    if(!room.started) return;
    bcast(room, {t:'edgeTake', bySeat:room.players.indexOf(p)+1, clearOnly:!!m.clearOnly}, conn.sock);
  },
  board(conn, room, p, m){
    p.pubOwn = sanitizePub(m.pub, true);
    const pub = sanitizePub(m.pub);
    if(!pub) return;
    p.pub = pub;
    bcast(room, { t:'board', seat: room.players.indexOf(p) + 1, who: p.name, pub }, conn.sock);
  },
  handEscrow(conn, room, p, m){
    /* an opaque, client-encrypted hand blob. The server stores and routes it but
       never decrypts it (it has no key). It is never broadcast — only handed back
       to the seat's owner on reconnect or to whoever takes the seat over / loads it. */
    if(typeof m.blob === 'string' && m.blob.length <= 200000) p.handBlob = m.blob;
    else if(m.blob === null) p.handBlob = undefined;     // explicit clear (empty hand)
  },
  tool(conn, room, p, m){
    if(m.kind === 'coin'){
      bcast(room, { t:'tool', kind:'coin', who: p.name, result: rnd(2) === 0 ? 'Heads' : 'Tails' });
    } else if(m.kind === 'die'){
      const n = [4,6,8,10,12,20].includes(m.n) ? m.n : 6;
      bcast(room, { t:'tool', kind:'die', who: p.name, n, result: rnd(n) + 1 });
    } else if(m.kind === 'seating'){
      shuffle(room.players);
      room.players.forEach(q => { q.out = false; q.vp = 0; });   // new seating = new game
      room.turnSeat = 1;
      bcast(room, { t:'tool', kind:'seating', who: p.name, order: room.players.map(q => q.name) });
      bcast(room, { t:'turn', seat: 1, who: room.players[0].name });
      rosterUpd(room);
    }
  },
  saveMatch(conn, room, p, m){
    if(p.token !== room.hostToken) return wsSend(conn.sock, { t:'err', msg:'Only the host can save the match.' });
    if(!room.started) return wsSend(conn.sock, { t:'err', msg:'Start the game before saving a match.' });
    let nm = cleanCard(m.name).slice(0, 40).trim();
    if(!nm) nm = room.name + ' ' + new Date().toISOString().slice(0, 10);
    if(!saves.has(nm) && saves.size >= MAX_SAVES)
      return wsSend(conn.sock, { t:'err', msg:'Saved-match limit reached (' + MAX_SAVES + '). Delete one first.' });
    saves.set(nm, buildSave(room, nm));
    persistSaves();
    wsSend(conn.sock, { t:'matchSaved', name: nm, at: Date.now(), saves: saveList(room) });
    sys(room, p.name + ' saved the match as “' + nm + '”. 💾');
    console.log('[save] "' + room.name + '" saved as "' + nm + '" by ' + p.name);
  },
  listSaves(conn, room, p, m){
    if(p.token !== room.hostToken) return wsSend(conn.sock, { t:'err', msg:'Only the host can manage saved matches.' });
    wsSend(conn.sock, { t:'saveList', saves: saveList(room) });
  },
  delSave(conn, room, p, m){
    if(p.token !== room.hostToken) return wsSend(conn.sock, { t:'err', msg:'Only the host can manage saved matches.' });
    const s = saves.get(String(m.name || ''));
    if(s && s.passHash === room.passHash){ saves.delete(s.name); persistSaves(); }
    wsSend(conn.sock, { t:'saveList', saves: saveList(room) });
  },
  loadMatch(conn, room, p, m){
    if(p.token !== room.hostToken) return wsSend(conn.sock, { t:'err', msg:'Only the host can load a saved match.' });
    if(room.started) return wsSend(conn.sock, { t:'err', msg:'Load into a fresh lobby — finish or leave the current game first.' });
    const sv = saves.get(String(m.name || ''));
    if(!sv) return wsSend(conn.sock, { t:'err', msg:'No such saved match.' });
    if(sv.passHash !== room.passHash)
      return wsSend(conn.sock, { t:'err', msg:'That match has a different password. Create the room with the match’s original password, then load.' });
    const myName = p.name.toLowerCase();
    const mine = (sv.players || []).find(sp => sp.name.toLowerCase() === myName);
    if(!mine) return wsSend(conn.sock, { t:'err', msg:'Your name “' + p.name + '” wasn’t a player in this match. Rejoin the lobby as one of: ' + (sv.players || []).map(s => s.name).join(', ') + ' — then load.' });

    /* any other sockets in this lobby lose their seats — they rejoin by name */
    const others = [];
    room.players.forEach(q => { if(q.sock && q.sock !== conn.sock) others.push(q.sock); });
    (room.watchers || []).forEach(w => { if(w.sock && w.sock !== conn.sock) others.push(w.sock); });

    const hostTok = p.token;
    room.players = (sv.players || []).map(sp => {
      const isMe = sp.name.toLowerCase() === myName;
      return {
        name: sp.name, seatPick: sp.seatPick || null, vp: sp.vp || 0, out: !!sp.out, muted: !!sp.muted, vacant: false,
        game: sp.game || null, pub: sp.pub || null, pubOwn: sp.pubOwn || sp.pub || null,
        handBlob: sp.handBlob || undefined,
        token: isMe ? hostTok : token(),
        sock: isMe ? conn.sock : null,
        last: Date.now(), off: isMe ? 0 : Date.now()
      };
    });
    room.watchers = [];
    room.hostToken = hostTok;
    room.started = true;
    room.escrowSalt = sv.escrowSalt || room.escrowSalt || token();   // keep the salt the blobs were sealed under
    room.turnSeat = sv.turnSeat || 1;
    room.reactSecs = sv.reactSecs || 5;
    room.helperPolicy = cleanHelperPolicy(sv.helperPolicy);
    room.chat = sv.chat !== false; room.specChat = sv.specChat !== false;
    room.matchMins = sv.matchMins || 0;
    if(sv.timeCalled){ room.timeCalled = true; room.matchEnd = null; }
    else if(sv.matchRemaining != null){ room.timeCalled = false; room.matchEnd = Date.now() + sv.matchRemaining; }
    else { room.timeCalled = false; room.matchEnd = null; }

    const meP = room.players.find(q => q.token === hostTok);
    conn.player = meP;

    others.forEach(sk => {
      const c = connOf(sk);
      if(c){ c.player = null; c.watch = false; c.room = null; }
      try{ wsSend(sk, { t:'err', msg:'The host loaded a saved match — rejoin with your name to take your seat.' }); }catch(e){}
      try{ wsClose(sk); }catch(e){}
    });

    const seatNo = room.players.indexOf(meP) + 1;
    wsSend(conn.sock, {
      t:'took', token: meP.token, seat: seatNo,
      deckName: meP.game ? meP.game.deckName : '',
      lib:   meP.game && meP.game.lib   ? meP.game.lib.length   : 0,
      crypt: meP.game && meP.game.crypt ? meP.game.crypt.length : 0,
      pub: meP.pubOwn || meP.pub || null,
      hand: [],
      escrowSalt: room.escrowSalt || undefined,
      handBlob: meP.handBlob || undefined,
      turn: room.turnSeat, matchEnd: room.matchEnd || undefined, reactSecs: room.reactSecs,
      loaded: sv.name, srv: VERSION
    });
    sys(room, p.name + ' loaded the saved match “' + sv.name + '”. Other players: rejoin with your names to retake your seats. 💾');
    console.log('[save] "' + room.name + '" loaded match "' + sv.name + '" by ' + p.name);
    rosterUpd(room);
    snapshot();
  },
  leave(conn, room, p, m){
    dropPlayer(conn, true);
  }
};

function handle(conn, raw){
  let m;
  try { m = JSON.parse(raw); } catch(err) { return; }
  if(!m || typeof m.t !== 'string') return;
  try {

  /* ---- create room ---- */
  if(m.t === 'create'){
    const name = cleanName(m.room), pname = cleanName(m.name);
    if(!name || !pname) return wsSend(conn.sock, { t:'err', msg:'Room name and player name are required.' });
    if(rooms.has(name))  return wsSend(conn.sock, { t:'err', msg:'That room name is taken.' });
    if(rooms.size >= MAX_ROOMS) return wsSend(conn.sock, { t:'err', msg:'The server is full (too many rooms).' });
    const loopback = conn.ip === '127.0.0.1' || conn.ip === '::1' || conn.ip === '::ffff:127.0.0.1';
    if(!loopback){
      if(strikes(ipCreates, conn.ip, CREATE_WIN) >= CREATE_MAX)
        return wsSend(conn.sock, { t:'err', msg:'Room creation limit reached — try again later.' });
      strike(ipCreates, conn.ip);
    }
    const mins = parseInt(m.minutes, 10);
    const rs   = parseInt(m.react, 10);
    const room = { name, passHash: passHash(m.pass || ''), players: [], watchers: [], hostToken: null, created: Date.now(),
                   started: !m.lobby,                          // lobby rooms wait for the host to Start
                   escrowSalt: token(),                        // public salt for client-side hand-escrow key derivation
                   matchEnd: (mins >= 5 && mins <= 600) ? Date.now() + mins * 60000 : null,
                   matchMins: (mins >= 5 && mins <= 600) ? mins : 0,
                   chat: m.chat !== false, specChat: m.specChat !== false,
                   helperPolicy: cleanHelperPolicy(m.helperPolicy),   // host-governed helper settings for the table
                   reactSecs: (rs >= 3 && rs <= 30) ? rs : 5,
                   tableView: (m.tableView === 'normal' || m.tableView === 'simplified') ? m.tableView : null, l3shape: (m.l3shape === 'square' || m.l3shape === 'circle') ? m.l3shape : null,
                   boardMode: m.boardMode === 'classic' ? 'classic' : 'structured' };
    const p = { name: pname, token: token(), sock: conn.sock, last: Date.now(), off: 0, seatPick: null };
    room.hostToken = p.token;
    room.players.push(p);
    rooms.set(name, room);
    conn.room = room; conn.player = p;
    joinReply(conn.sock, room, p);
    vWarn(conn, m);
    console.log('[room] created "' + name + '" by ' + pname + (room.started ? '' : ' (lobby)'));
    return;
  }

  /* ---- join (also handles reconnect via token) ---- */
  if(m.t === 'join'){
    const room = rooms.get(cleanName(m.room));
    if(!room) return wsSend(conn.sock, { t:'err', msg:'No such room.' });
    /* token reconnect — token is the credential, password not needed */
    if(m.token){
      const p = findByToken(room, String(m.token));
      if(p){
        if(p.sock && p.sock !== conn.sock) wsClose(p.sock);   // kick the stale socket
        p.sock = conn.sock; p.last = Date.now(); p.off = 0;
        conn.room = room; conn.player = p;
        joinReply(conn.sock, room, p);
        vWarn(conn, m);
        sys(room, p.name + ' reconnected.');
        rosterUpd(room);
        return;
      }
    }
    if(strikes(ipFails, conn.ip, FAIL_WIN) >= FAIL_MAX)
      return wsSend(conn.sock, { t:'err', msg:'Too many failed attempts — try again in a few minutes.' });
    if(!passMatch(room.passHash, m.pass || '')){
      strike(ipFails, conn.ip);
      return wsSend(conn.sock, { t:'err', msg:'Wrong password.' });
    }
    const pname = cleanName(m.name);
    if(!pname) return wsSend(conn.sock, { t:'err', msg:'Player name is required.' });
    if(m.spect){
      room.watchers = room.watchers || [];
      room.watchers.push({ name: pname, sock: conn.sock });
      conn.room = room; conn.watch = true; conn.wname = pname;
      const msg = { t:'joined', room: room.name, spect: true, you: pname,
                    players: roster(room), watchers: room.watchers.length,
                    chat: room.chat !== false, specChat: room.specChat !== false,
                    srv: VERSION, reactSecs: room.reactSecs || 5, tableView: room.tableView || undefined, l3shape: room.l3shape || undefined, boardMode: room.boardMode || undefined, lobby: !room.started };
      if(room.escrowSalt) msg.escrowSalt = room.escrowSalt;
      if(room.turnSeat) msg.turn = room.turnSeat;
      if(room.matchEnd) msg.matchEnd = room.matchEnd;
      wsSend(conn.sock, msg);
      if(!room.started) wsSend(conn.sock, lobbyState(room));
      else room.players.forEach(q => {
        if(q.pub) wsSend(conn.sock, { t:'board', seat: room.players.indexOf(q) + 1, who: q.name, pub: q.pub });
      });
      vWarn(conn, m);
      sys(room, pname + ' is watching. 👁');
      rosterUpd(room);
      if(!room.started) bcastLobby(room);
      return;
    }
    const ex = room.players.find(p => p.name.toLowerCase() === pname.toLowerCase() && !p.vacant);
    if(ex){
      if(ex.sock && !ex.off)
        return wsSend(conn.sock, { t:'err', msg:'That name is taken in this room.' });
      /* The seat's owner is back without their token (new tab, cleared storage):
         the name + the room password is enough to reclaim an offline seat.   */
      ex.token = token();                      // fresh credential — the old one is dead
      ex.sock = conn.sock; ex.last = Date.now(); ex.off = 0;
      conn.room = room; conn.player = ex;
      joinReply(conn.sock, room, ex);
      vWarn(conn, m);
      sys(room, ex.name + ' reconnected.');
      rosterUpd(room);
      return;
    }
    if(room.players.length >= MAX_PLAYERS)
      return wsSend(conn.sock, { t:'err', msg:'The room is full ('+MAX_PLAYERS+' seats).' });
    const p = { name: pname, token: token(), sock: conn.sock, last: Date.now(), off: 0, seatPick: null };
    room.players.push(p);
    conn.room = room; conn.player = p;
    joinReply(conn.sock, room, p);
    vWarn(conn, m);
    sys(room, pname + ' joined ' + (room.started ? 'the table (seat ' + room.players.length + ').' : 'the lobby.'));
    rosterUpd(room);
    if(!room.started) bcastLobby(room);
    return;
  }

  /* ---- spectators may only chat ---- */
  if(conn.room && conn.watch){
    if(m.t === 'chat'){
      if(conn.room.chat === false || conn.room.specChat === false)
        return wsSend(conn.sock, { t:'err', msg:'Chat is off for spectators in this room.' });
      const w = (conn.room.watchers || []).find(x => x.sock === conn.sock);
      if(w && w.muted) return wsSend(conn.sock, { t:'err', msg:'You are muted by the host.' });
      const msg = String(m.msg || '').trim().slice(0, 300);
      if(msg) bcast(conn.room, { t:'chat', who: '👁 ' + conn.wname, msg });
    } else if(m.t === 'leave'){
      dropWatcher(conn);
    } else {
      wsSend(conn.sock, { t:'err', msg:'Spectators can only chat.' });
    }
    return;
  }

  /* ---- everything below requires being seated ---- */
  const room = conn.room, p = conn.player;
  if(!room || !p) return wsSend(conn.sock, { t:'err', msg:'Join a room first.' });
  p.last = Date.now();

  const h = GAME_HANDLERS[m.t];
  if(h) h(conn, room, p, m);   // unknown verbs are ignored, exactly as the old else-less chain did

  } catch(err){
    console.log('[error] message handler threw on a "' + (m && m.t) + '" message: ' + (err && err.message));
    try { wsSend(conn.sock, { t:'err', msg:'That action could not be processed.' }); } catch(e){}
  }
}

function dropWatcher(conn){
  const room = conn.room;
  if(!room || !conn.watch) return;
  room.watchers = (room.watchers || []).filter(w => w.sock !== conn.sock);
  sys(room, conn.wname + ' stopped watching.');
  rosterUpd(room);
  if(!room.started) bcastLobby(room);
  conn.room = null; conn.watch = false;
}
function dropPlayer(conn, forGood){
  if(conn.watch){ dropWatcher(conn); return; }
  const room = conn.room, p = conn.player;
  if(!room || !p) return;
  conn.room = null; conn.player = null;
  if(forGood){
    const i = room.players.indexOf(p);
    if(i > -1) room.players.splice(i, 1);
    if(p.token === room.hostToken && room.players[0]) room.hostToken = room.players[0].token;
    if(!room.started) room.players.forEach(q => { if(q.seatPick > room.players.length) q.seatPick = null; });
    sys(room, p.name + ' left the ' + (room.started ? 'table.' : 'lobby.'));
    console.log('[room] ' + p.name + ' left "' + room.name + '"');
  } else {
    p.sock = null; p.off = Date.now();
    sys(room, p.name + ' disconnected.');
  }
  if(!room.players.length){ rooms.delete(room.name); console.log('[room] "' + room.name + '" closed (empty)'); }
  else { rosterUpd(room); if(!room.started) bcastLobby(room); }
}

/* ---------- HTTP server (serves the client) + WS upgrade ---------- */
const srv = http.createServer((req, res) => {
  if(req.method === 'GET' && (req.url === '/' || req.url === '/index.html')){
    fs.readFile(CLIENT_FILE, (err, data) => {
      if(err){
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Elysium server is running, but the client file was not found:\n' + CLIENT_FILE +
                '\nPlace elysium-vtes-bord.html next to elysium-server.js (or pass its path as the 2nd argument).');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(data);
    });
    return;
  }
  if(req.url === '/favicon.ico'){ res.writeHead(204); res.end(); return; }
  res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found');
});
srv.on('clientError', (err, sock) => { try{ sock.destroy(); }catch(e){} });

srv.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  if(!key || String(req.headers.upgrade || '').toLowerCase() !== 'websocket'){ sock.destroy(); return; }
  const ip = req.socket.remoteAddress || '?';
  const loopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  if(!loopback){
    let n = 0; conns.forEach(c => { if(c.ip === ip) n++; });
    if(n >= MAX_CONN_PER_IP){ console.log('[abuse] connection cap hit by ' + ip); sock.destroy(); return; }
  }
  const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\n' +
             'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
             'Sec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  sock.setNoDelay(true);

  const conn = { sock, room: null, player: null, last: Date.now(), closed: false,
                 ip: req.socket.remoteAddress || '?', rate: [] };
  wsAttach(sock, {
    msg: raw => {
      conn.last = Date.now();
      conn.rate = conn.rate.filter(t => conn.last - t < RATE_WIN);
      conn.rate.push(conn.last);
      if(conn.rate.length > RATE_N){
        wsSend(conn.sock, { t:'err', msg:'Slow down — too many messages.' });
        console.log('[abuse] rate limit hit by ' + conn.ip);
        wsClose(conn.sock);
        return;
      }
      handle(conn, raw);
    },
    alive: ()  => { conn.last = Date.now(); if(conn.player) conn.player.last = conn.last; },
    close: ()  => {
      if(conn.closed) return;
      conn.closed = true;
      if(conn.player && conn.player.sock === conn.sock) dropPlayer(conn, false);
    }
  });
  conns.add(conn);
  sock.on('close', () => conns.delete(conn));
});

/* ---------- Keepalive & cleanup ---------- */
const conns = new Set();
setInterval(() => {
  const now = Date.now();
  conns.forEach(c => {
    if(c.sock.destroyed){ conns.delete(c); return; }
    if(now - c.last > 75000){ try{ c.sock.destroy(); }catch(err){} conns.delete(c); return; }
    wsSendFrame(c.sock, 0x9, Buffer.alloc(0));   // ping
  });
}, 30000);
setInterval(() => {
  const now = Date.now();
  ipFails.forEach((a, ip) => { if(!a.some(t => now - t < FAIL_WIN)) ipFails.delete(ip); });
  ipCreates.forEach((a, ip) => { if(!a.some(t => now - t < CREATE_WIN)) ipCreates.delete(ip); });
  rooms.forEach((room, name) => {
    const allOff = room.players.every(p => !p.sock);
    const oldest = Math.max(0, ...room.players.map(p => p.off || 0));
    if(allOff && room.players.length && now - oldest > 60 * 60000){
      rooms.delete(name);
      console.log('[room] "' + name + '" expired (everyone offline > 60 min)');
    }
  });
}, 10 * 60000);

/* ---------- Persistence: the table survives a server restart ---------- */
const STORE = path.resolve(__dirname, 'elysium-rooms.json');
function snapshot(){
  try{
    const data = [...rooms.values()].map(r => ({
      name: r.name, passHash: r.passHash, hostToken: r.hostToken, created: r.created,
      chat: r.chat !== false, specChat: r.specChat !== false, started: r.started !== false,
      turnSeat: r.turnSeat || null, matchEnd: r.matchEnd || null,
      reactSecs: r.reactSecs || 5, timeCalled: !!r.timeCalled, escrowSalt: r.escrowSalt || null,
      helperPolicy: r.helperPolicy || null,
      players: r.players.map(p => ({ name: p.name, token: p.token, seatPick: p.seatPick || null, muted: !!p.muted, vacant: !!p.vacant,
        vp: p.vp || 0, out: !!p.out, game: p.game || null, handBlob: p.handBlob || null }))
    }));
    fs.writeFileSync(STORE + '.tmp', JSON.stringify(data));
    fs.renameSync(STORE + '.tmp', STORE);
  }catch(err){ /* persistence is best-effort */ }
}
function restore(){
  try{
    if(!fs.existsSync(STORE)) return;
    if(Date.now() - fs.statSync(STORE).mtimeMs > 24 * 3600000) return;   // stale
    const data = JSON.parse(fs.readFileSync(STORE, 'utf8'));
    let n = 0;
    for(const r of data){
      if(!r || !r.name || rooms.has(r.name)) continue;
      rooms.set(r.name, {
        name: r.name, passHash: r.passHash || (r.pass != null ? passHash(r.pass) : passHash('')), hostToken: r.hostToken || null,
        created: r.created || Date.now(), turnSeat: r.turnSeat || null,
        matchEnd: r.matchEnd || null, reactSecs: r.reactSecs || 5, escrowSalt: r.escrowSalt || token(),
        helperPolicy: cleanHelperPolicy(r.helperPolicy),
        chat: r.chat !== false, specChat: r.specChat !== false, started: r.started !== false,
        timeCalled: !!r.timeCalled, watchers: [],
        players: (r.players || []).map(p => ({ name: p.name, token: p.token, seatPick: p.seatPick || null, muted: !!p.muted, vacant: !!p.vacant,
          sock: null, last: Date.now(), off: Date.now(),
          vp: p.vp || 0, out: !!p.out, game: p.game || null, handBlob: p.handBlob || null }))
      });
      n++;
    }
    if(n) console.log('[boot] restored ' + n + ' room(s) from disk — token rejoin works as usual');
  }catch(err){ console.log('[boot] could not restore rooms: ' + err.message); }
}
restore();
setInterval(snapshot, 60000);
process.on('SIGINT', () => { snapshot(); persistSaves(); console.log('\n  Rooms saved. The table sleeps.'); process.exit(0); });

/* ---------- Named match saves: a host can store a game under a name and
   load it back later. Unlike the room snapshot above, these NEVER expire
   on age — they live until the host deletes them. Hands stay client-side
   (the server never sees them), so a loaded match restores every seat's
   deck + public board with an empty hand, exactly like a seat takeover. */
const SAVES = path.resolve(__dirname, 'elysium-saves.json');
const saves = new Map();
function persistSaves(){
  try{
    fs.writeFileSync(SAVES + '.tmp', JSON.stringify([...saves.values()]));
    fs.renameSync(SAVES + '.tmp', SAVES);
  }catch(err){ /* best-effort */ }
}
function loadSaves(){
  try{
    if(!fs.existsSync(SAVES)) return;
    const data = JSON.parse(fs.readFileSync(SAVES, 'utf8'));
    if(Array.isArray(data)) for(const s of data){ if(s && s.name) saves.set(s.name, s); }
    if(saves.size) console.log('[boot] loaded ' + saves.size + ' saved match(es)');
  }catch(err){ console.log('[boot] could not load saved matches: ' + err.message); }
}
loadSaves();
/* a self-contained snapshot of a started game, including every seat's public board */
function buildSave(room, name){
  return {
    name, savedAt: Date.now(), roomName: room.name, passHash: room.passHash,
    started: true, turnSeat: room.turnSeat || 1,
    escrowSalt: room.escrowSalt || null,
    matchMins: room.matchMins || 0,
    matchRemaining: room.matchEnd ? Math.max(0, room.matchEnd - Date.now()) : null,
    timeCalled: !!room.timeCalled,
    reactSecs: room.reactSecs || 5,
    helperPolicy: room.helperPolicy || null,
    chat: room.chat !== false, specChat: room.specChat !== false,
    players: room.players.filter(q => !q.vacant).map(q => ({
      name: q.name, seatPick: q.seatPick || null, vp: q.vp || 0, out: !!q.out, muted: !!q.muted,
      game: q.game || null, pub: q.pub || null, pubOwn: q.pubOwn || q.pub || null,
      handBlob: q.handBlob || null
    }))
  };
}
/* the host only sees saves that match their room's password (their own group's saves) */
function saveList(room){
  return [...saves.values()]
    .filter(s => s.passHash === room.passHash)
    .sort((a, b) => b.savedAt - a.savedAt)
    .map(s => ({ name: s.name, savedAt: s.savedAt, roomName: s.roomName,
                 turn: s.turnSeat || 1, players: (s.players || []).map(q => q.name) }));
}

/* Match clocks: call time once when a room's clock runs out */
setInterval(() => {
  const now = Date.now();
  rooms.forEach(room => {
    if(room.matchEnd && !room.timeCalled && now >= room.matchEnd){
      room.timeCalled = true;
      sys(room, '⏰ Time is called — the match clock has run out.');
      bcast(room, { t:'timeup' });
    }
  });
}, 5000);

/* ---------- Boot ---------- */
srv.listen(PORT, () => {
  console.log('');
  console.log('  ELYSIUM server v' + VERSION + ' — the table is open');
  console.log('  ----------------------------------------');
  console.log('  Local:    http://localhost:' + PORT);
  const ifs = os.networkInterfaces();
  Object.keys(ifs).forEach(k => (ifs[k] || []).forEach(a => {
    if(a.family === 'IPv4' && !a.internal)
      console.log('  Network:  http://' + a.address + ':' + PORT + '   (share this with friends on your LAN/VPN)');
  }));
  console.log('  Client:   ' + CLIENT_FILE + (fs.existsSync(CLIENT_FILE) ? '' : '   (NOT FOUND!)'));
  console.log('  Stop with Ctrl+C. No dependencies, no install — just Node.');
  console.log('');
});
