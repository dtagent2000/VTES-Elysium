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

const VERSION     = '2.6.9';   // v2.6.7: jumped from 2.5.70 to resync major.minor lockstep with the client (2.6.x since the v2.6.0 client-only fix) -- verMM() compares major.minor on every join and was sending every 2.6-client a false '⚠ Version mismatch' sys line against a 2.5 server. No functional change beyond the string.  // kept in lockstep with the client's VERSION (major.minor policy; the client
                               // warns on any mismatch when joining). 2.5.38 adds sanHtml() defence-in-depth
                               // on the logTo relay -- the first server logic change since 2.5.30.
/* v2.5.68 (L1): named flags ride alongside the two positionals.
   --server-pass <p>   the door: hello/create/join require it (timing-safe, throttled)
   --admin-pass <p>    the keys: hello {admin} grants per-connection admin (inherits host gates)
   --create-policy anyone|admin   who may create rooms (default anyone)
   --trust-proxy       behind cloudflared/Caddy on LOOPBACK only: read CF-Connecting-IP /
                       X-Forwarded-For as the connection IP, restoring per-IP limits
   Flags live in the mutable CFG object so the dispatch test-suite can simulate them. */
const _argv = process.argv.slice(2);
const CFG = { srvPassHash: null, adminPassHash: null, createPolicy: 'anyone', trustProxy: false };
const _pos = [];
for(let i = 0; i < _argv.length; i++){
  const a = _argv[i];
  if(a === '--server-pass'){ CFG.srvPassHash = passHashLater(_argv[++i]); }
  else if(a === '--admin-pass'){ CFG.adminPassHash = passHashLater(_argv[++i]); }
  else if(a === '--create-policy'){ CFG.createPolicy = _argv[++i] === 'admin' ? 'admin' : 'anyone'; }
  else if(a === '--trust-proxy'){ CFG.trustProxy = true; }
  else _pos.push(a);
}
function passHashLater(v){ return { _raw: String(v || '') }; }   // crypto's passHash is declared below; resolve after definitions
const PORT        = parseInt(_pos[0], 10) || 8123;
const CLIENT_FILE = path.resolve(__dirname, _pos[1] || 'elysium-vtes-bord.html');
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
if(CFG.srvPassHash   && CFG.srvPassHash._raw   !== undefined) CFG.srvPassHash   = passHash(CFG.srvPassHash._raw);     // v2.5.68: argv parsed before passHash existed
if(CFG.adminPassHash && CFG.adminPassHash._raw !== undefined) CFG.adminPassHash = passHash(CFG.adminPassHash._raw);
function isLoopback(ip){ return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'; }
function deriveIp(remoteAddr, headers){
  // v2.5.68 (L1 --trust-proxy): ONLY when the flag is on AND the transport peer is loopback
  // (i.e. the proxy itself) do we believe forwarding headers -- a remote client sending a
  // forged CF-Connecting-IP never matches the loopback condition, so it cannot spoof.
  const ra = remoteAddr || '?';
  if(!CFG.trustProxy || !isLoopback(ra)) return ra;
  const h = headers || {};
  const cf = String(h['cf-connecting-ip'] || '').trim();
  if(cf) return cf.slice(0, 45);
  const xff = String(h['x-forwarded-for'] || '').split(',')[0].trim();
  return xff ? xff.slice(0, 45) : ra;
}
/* ---------- The lobby door + room list (v2.5.68, L1+L2) ---------- */
const LOBBY_CONNS = new Set();                       // connections that said hello and are not seated -- they get roomList pushes
function doorCheck(conn, m){
  // The server door. No --server-pass => open exactly as before. With it: the first
  // credentialed message (hello, or create/join carrying srvPass for deep links) unlocks
  // the CONNECTION (conn.authed). Wrong tries share one throttle bucket: per-IP when the
  // IP means something, one global bucket at 4x tolerance when everyone is loopback
  // (tunnel WITHOUT --trust-proxy) so friends aren't locked out by one fat-fingered guest.
  if(!CFG.srvPassHash || conn.authed) return true;
  const key = isLoopback(conn.ip) ? 'srv:*' : ('srv:' + conn.ip);
  const cap = isLoopback(conn.ip) ? FAIL_MAX * 4 : FAIL_MAX;
  if(strikes(ipFails, key, FAIL_WIN) >= cap){
    wsSend(conn.sock, { t:'err', msg:'Too many wrong server passwords. Wait a bit.' });
    return false;
  }
  if(m && passMatch(CFG.srvPassHash, m.srvPass)){ conn.authed = true; return true; }
  strike(ipFails, key);
  wsSend(conn.sock, { t:'err', msg:'This server requires a password.' });
  return false;
}
function buildRoomList(){
  const out = [];
  rooms.forEach(r => {
    out.push({ room: r.name, started: !!r.started, lobby: !r.started,
               locked: !!r.hasPass || undefined, tournLock: !!r.tournLock || undefined,
               players: r.players.filter(q => !q.vacant).length, max: MAX_PLAYERS,
               spect: (r.watchers || []).length || undefined,
               names: r.players.filter(q => !q.vacant && !q.anon).map(q => q.name) });
  });
  out.sort((a, b) => (a.started - b.started) || a.room.localeCompare(b.room));   // lobbies first
  return out;
}
function sendRoomList(conn){
  const locked = !!CFG.srvPassHash && !conn.authed;
  wsSend(conn.sock, { t:'roomList', ok: !locked, door: !!CFG.srvPassHash,
                      admin: conn.admin || undefined, srv: VERSION,
                      rooms: locked ? undefined : buildRoomList() });
}
let roomListTimer = null;
function scheduleRoomList(){
  // debounced push to every hello'd, unseated connection; dead/seated entries self-prune
  if(roomListTimer) return;
  roomListTimer = setTimeout(() => {
    roomListTimer = null;
    LOBBY_CONNS.forEach(c => {
      if(c.closed || !c.sock || c.sock.destroyed || c.room){ LOBBY_CONNS.delete(c); return; }
      sendRoomList(c);
    });
  }, 300);
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
  scheduleRoomList();                                                          // v2.5.68 L2: seat counts change
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
function sanHtml(s){                       // server-side twin of the client's sanRemote() (v2.5.38, defence-in-depth):
  s = String(s || '');                     // the logTo html field legitimately carries a tiny tag whitelist -- <b>, <i>
  const links = [];                        // and the log card-link form <b class="clog" data-cid="..."> -- so a plain
                                           // <>-strip would break it. Everything else is stripped. The REFERENCE client
                                           // sanitises again at render (sanRemote); third-party clients MUST do the same
                                           // (see ELYSIUM-PROTOCOL.md §8) -- this layer protects them if they forget.
  s = s.replace(/<b\s+class="clog"\s+data-cid="([^"]*)"\s*>/gi, (m, cid) => { links.push('<b class="clog" data-cid="' + cid.replace(/[<>"'`]/g, '') + '">'); return '\u0001' + (links.length - 1) + '\u0002'; });
  s = s.replace(/<(?!\/?[bi]>)[^>]*>?/gi, '');
  return s.replace(/\u0001(\d+)\u0002/g, (m, i) => links[+i] || '');
}
function findByToken(room, tok){ return room.players.find(p => p.token === tok && !p.vacant); }
function connOf(sock){ for(const c of conns){ if(c.sock === sock) return c; } return null; }
function vWarn(conn, m){
  const verMM = v => String(v||'').split('.').slice(0,2).join('.');   // "2.5.31" -> "2.5": compare only major.minor so a client-only patch bump does not warn (and needs no server restart); a real major/minor drift still warns
  if(m && m.v && verMM(m.v) !== verMM(VERSION))
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
  if(room.tournLock) msg.tournLock = true;             // v2.5.64: the client can surface the lock (e.g. in the lobby)
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

function cleanId(s){ return String(s || '').replace(/[^a-zA-Z0-9_-]/g,'').slice(0, 32); }   // sanitize a card id (gid/cid) for the give/recall verbs
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
    clan:  (typeof pub.clan === 'string' && pub.clan) ? (cleanCard(pub.clan).slice(0, 40) || undefined) : undefined,   // v2.5.62: majority-clan / path symbol for the opponent pool globes — sent by the client for ages, silently dropped by this whitelist (hotseat always worked; online never did)
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
    if(ts >= 1 && ts <= MAX_PLAYERS && tc) out.target = { seat: ts, cid: tc };   // v2.5.61 (review Finding 2): keyed to the constant so a raised seat cap can't silently stop relaying target markers for seat 7+
  }
  if(Array.isArray(pub.tokens)){                       // v2.5.62: felt tokens (the Edge) + the pool-globe position — exported by the client since the token family landed, but this whitelist predates them and dropped the field, so online opponents saw neither the Edge token nor globe moves (the default L4 globe circle is client-local). Hotseat pubs bypass the server, which is why everything "worked offline".
    const toks = [];
    for(const t of pub.tokens.slice(0, 8)){            // generous cap: today it's at most edge + pool
      if(!t || typeof t !== 'object') continue;
      const ty = String(t.type || '').toLowerCase();
      if(!/^[a-z0-9_-]{1,16}$/.test(ty)) continue;     // type is a client-side TOKEN_DEFS key ('edge', 'pool', future family members)
      toks.push({ type: ty,
                  x: Math.max(-2000, Math.min(4000, Math.round(+t.x) || 0)),
                  y: Math.max(-2000, Math.min(4000, Math.round(+t.y) || 0)) });   // canonical 1004x616 board coords, wide clamp for off-felt parking
    }
    if(toks.length) out.tokens = toks;
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
      attached: Array.isArray(c.attached) ? c.attached.slice(0, 30).map(a => cleanCard(String(a)).slice(0, 16)) : undefined,
      actSt: (c.actSt === 'played' || c.actSt === 'resolved') ? c.actSt : undefined,             // v2.5.62: Played-tab action batching for opponents' cards (client sent it; whitelist dropped it)
      _avSeq: (Number.isFinite(+c._avSeq) && +c._avSeq > 0) ? Math.round(+c._avSeq) : undefined, // v2.5.62: wall-clock play order — the cross-seat Played-tab interleave was broken online without it
      path: c.path ? (cleanCard(String(c.path)).slice(0, 40) || undefined) : undefined,          // v2.5.62: chosen-path badge on remote cards (crypt-only + chosen-only enforced client-side per the v2.5.72 merge decision)
      sup: (typeof c.sup === 'string' && /^[a-z]{3}$/i.test(c.sup)) ? c.sup.toLowerCase() : undefined // v2.5.62: superior-discipline trigram badge on remote library cards
    });
  }
  return out;
}

/* ---------- The resource ledger (v2.5.65) ----------
   Server-AUTHORED history of the game's hard resources, derived by diffing each
   started-game `board` push against the seat's previous sanitized pub. The client
   never writes these lines -- it only requests them (ledgerGet) -- so unlike the
   free-text log they cannot be forged or omitted by a modified client. Coverage
   is exactly the pub surface: pool, the Edge, cards entering/leaving/changing
   zone, lock/unlock, face up/down, blood/blue/green and named counters. What has
   no pub footprint (hand contents, private notes) is invisible here BY DESIGN --
   see elysium-anticheat-draft.md section 5. Attribution note: a change caused by
   another player via the `ctrl` verb is applied by the OWNER's client and lands
   in the owner's next push, so the row names the owner, not the instigator. */
const LEDGER_CAP = 800;
function ledgerAdd(room, seat, name, line){
  if(!room.ledger) room.ledger = [];
  room.ledger.push({ t: Date.now(), seat, name: String(name || '').slice(0, 32), line: String(line || '').slice(0, 200) });
  if(room.ledger.length > LEDGER_CAP) room.ledger.splice(0, room.ledger.length - LEDGER_CAP);
}
function ledgerDiff(room, p, prev, next, mark){
  if(!prev || !next) return [];                                  // first push after (re)join or load = baseline, nothing to compare
  const seat = room.players.indexOf(p) + 1, rows = [];
  if(prev.pool !== next.pool)
    rows.push('pool ' + prev.pool + ' \u2192 ' + next.pool + ' (' + (next.pool > prev.pool ? '+' : '') + (next.pool - prev.pool) + ')');
  if(!!prev.edge !== !!next.edge)
    rows.push(next.edge ? 'claimed the Edge' : 'released the Edge');
  const keyed = cs => new Map((cs || []).filter(c => c && c.id).map(c => [c.id, c]));   // id-less cards cannot be tracked across pushes
  const pm = keyed(prev.cards), nm = keyed(next.cards);
  const nameOf = c => c.name || (c.kind === 'crypt' ? 'a face-down crypt card' : 'a face-down card');
  for(const [id, c] of nm){
    const o = pm.get(id);
    if(!o){ rows.push('put ' + nameOf(c) + ' in play (' + c.zone + ')'); continue; }
    if(o.zone !== c.zone)               rows.push(nameOf(c) + ': ' + o.zone + ' \u2192 ' + c.zone);
    if(!!o.locked !== !!c.locked)       rows.push((c.locked ? 'locked ' : 'unlocked ') + nameOf(c));
    if(!!o.faceDown !== !!c.faceDown)   rows.push(c.faceDown ? ('turned ' + nameOf(o) + ' face down') : ('revealed ' + nameOf(c)));
    if((o.blood || 0) !== (c.blood || 0)) rows.push(nameOf(c) + ': blood ' + (o.blood || 0) + ' \u2192 ' + (c.blood || 0));
    if((o.blue  || 0) !== (c.blue  || 0)) rows.push(nameOf(c) + ': blue counters '  + (o.blue  || 0) + ' \u2192 ' + (c.blue  || 0));
    if((o.green || 0) !== (c.green || 0)) rows.push(nameOf(c) + ': green counters ' + (o.green || 0) + ' \u2192 ' + (c.green || 0));
    const ca = (o.counters || []).join(', '), cb = (c.counters || []).join(', ');
    if(ca !== cb) rows.push(nameOf(c) + ': counters [' + (cb || '\u2014') + ']');
  }
  for(const [id, o] of pm) if(!nm.has(id)) rows.push('removed ' + nameOf(o) + ' (from ' + o.zone + ')');
  const added = rows.slice(0, 40).map(l => (mark || '') + l);   // per-push cap so one bombed pub cannot flush the whole ring; v2.5.67: the caller's mark ('↩ undo: ') lands in BOTH the ring and the stream
  for(const line of added) ledgerAdd(room, seat, p.name, line);
  return added;                                                  // v2.5.66: the caller live-streams these to the other seats
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
    bcast(room, { t:'log', who: p.name, html: sanHtml(String(m.html || '').slice(0, 4000)) }, conn.sock);   // v2.5.64: whitelist-sanitised like say/logTo (defence-in-depth; the reference client re-sanitises at render)
  },
  chat(conn, room, p, m){
    if(room.chat === false) return wsSend(conn.sock, { t:'err', msg:'Chat is disabled in this room.' });
    if(p.muted) return wsSend(conn.sock, { t:'err', msg:'You are muted by the host.' });
    const msg = String(m.msg || '').trim().slice(0, 300);
    if(msg) bcast(room, { t:'chat', who: p.name, msg });
  },
  /* ---- game verbs (2B.1): the hidden piles live on the server ---- */
  deck(conn, room, p, m){
    if(room.started && room.tournLock)                           // v2.5.64 tournament lock: no mid-match deck swaps (which also used to self-un-oust via the p.out reset below)
      return wsSend(conn.sock, { t:'err', msg:'Decks are locked for this match (tournament lock).' });
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
    if(room.tournLock) return wsSend(conn.sock, { t:'err', msg:'Decks are locked for this match (tournament lock).' });   // v2.5.64
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
    if(room.turnSeat && room.turnSeat !== i + 1)                 // v2.5.64: only the seat that HAS the turn may pass it (previously ANY seat could fire this and yank the turn to their own prey); hostPass below is the referee override for a stuck seat
      return wsSend(conn.sock, { t:'err', msg:'It is not your turn.' });
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
    if(!(p.token === room.hostToken || conn.admin)) return wsSend(conn.sock, { t:'err', msg:'Only the host can start the game.' });
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
    scheduleRoomList();                                                        // v2.5.68 L2: the lobby list shows lobby->started flips live
    bcast(room, { t:'started', players: roster(room), turn: 1, tournLock: room.tournLock || undefined, matchEnd: room.matchEnd || undefined, tableView: room.tableView || undefined, l3shape: room.l3shape || undefined, boardMode: room.boardMode || undefined });
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
    // v2.5.63: the kind enum and field list catch up with the protocol doc's own §8 contract
    // ("play/flip/rise clones", fields actor/onto/reveal/toName) -- flip and rise were silently
    // dropped and actor/onto/reveal/toName were eaten, so those clones never existed online
    // (the sanitizePub drift class: works in hotseat, dies in the relay).
    const kind = (m.kind === 'lock' || m.kind === 'unlock' || m.kind === 'play' || m.kind === 'flip' || m.kind === 'rise') ? m.kind : null;
    if(!kind) return;
    const card = fxCard(m.card);
    if(!card) return;
    if(kind === 'flip' && m.reveal === false && m.card && typeof m.card === 'object')
      card.name = String(m.card.name || '').slice(0, 120);   // conceal-flip: the face it flips AWAY from was public one frame earlier -- the remote clone needs the name to show face->back (fx is cosmetic; no state trusts it)
    const target = (kind === 'play') ? fxCard(m.target) : null;
    const actor  = (kind === 'play') ? fxCard(m.actor)  : null;
    const onto   = (kind === 'play' && m.onto && typeof m.onto === 'object' && (m.onto.seat|0) >= 1 && (m.onto.seat|0) <= 8)
      ? { seat: m.onto.seat|0, who: cleanName(String(m.onto.who || '')).slice(0, 40) } : null;
    const reveal = (m.reveal === true) ? true : (m.reveal === false ? false : undefined);
    bcast(room, { t:'fx', who: p.name, seat: room.players.indexOf(p) + 1, kind, card,
                  target, actor, onto, reveal, toName: cleanName(String(m.toName || '')).slice(0, 40) || undefined,
                  verb: String(m.verb || '').slice(0, 40) }, conn.sock);
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
    const pubLine = sanHtml(String(m.pub || '').slice(0, 4000));   // v2.5.64: this line fans out as t:'log' to third parties -- same sanHtml wrap as the log verb
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
    const html = sanHtml(String(m.html || '').slice(0, 2000));   // v2.5.38: whitelist-sanitised server-side too (defence-in-depth; the client still sanitises at render)
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
      gid: cleanId(m.gid),                                         // giver-assigned card id -> both sides reference the same card (recall / undo of the give)
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
  recall(conn, room, p, m){                                        // owner -> holder: ask the holder (seat m.seat) to hand a card back
    const seatNo = m.seat | 0;
    const cid = cleanId(m.cid); if(!cid) return;                   // v2.5.56 (backlog 2.4.b): hoisted above the checks so every bounce can echo WHICH recall failed - the client then clears only that cid's guard entry instead of wiping the whole recall guard (two concurrent recalls, one holder offline: the other's protection survives)
    const q = room.players[seatNo - 1];
    if(!q) return wsSend(conn.sock, { t:'err', msg:'No such seat.', cid });
    if(q === p) return wsSend(conn.sock, { t:'err', msg:'That is your own board.', cid });
    if(!q.sock || q.off) return wsSend(conn.sock, { t:'err', msg: q.name + ' is offline — the card stays there.', cid });
    wsSend(q.sock, { t:'recall', cid, from: p.name, fromSeat: room.players.indexOf(p) + 1 });
  },
  recalled(conn, room, p, m){                                      // holder -> owner: confirm/deny; just route it to the owner's seat
    const seatNo = m.seat | 0;
    const q = room.players[seatNo - 1];
    if(!q || !q.sock || q.off) return;
    wsSend(q.sock, { t:'recalled', cid: cleanId(m.cid), ok: !!m.ok,
      name: m.ok ? cleanCard(m.name) : undefined,
      kind: m.ok ? (m.kind === 'crypt' ? 'crypt' : 'lib') : undefined });
  },
  ctrl(conn, room, p, m){                                          // owner -> holder: adjust a card the owner controls, in place on the holder's board (blood +/-)
    const seatNo = m.seat | 0;
    const q = room.players[seatNo - 1];
    if(!q || !q.sock || q.off) return;                             // holder gone -> silently drop (in-place tweak, no user-facing error)
    const cid = cleanId(m.cid); if(!cid) return;
    wsSend(q.sock, { t:'ctrl', cid, act: String(m.act || '').slice(0, 16), from: p.name });
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
    if(!(p.token === room.hostToken || conn.admin)) return wsSend(conn.sock, { t:'err', msg:'Only the host can set a player’s pool.' });
    const q = room.players[(m.seat | 0) - 1];
    if(!q || q.vacant) return wsSend(conn.sock, { t:'err', msg:'No such player.' });
    const v = Math.max(0, Math.min(999, parseInt(m.val, 10) || 0));
    if(q.sock) wsSend(q.sock, { t:'forceSetPool', val: v });          // pool is client-authored -> the target applies it and rebroadcasts; a disconnected target can't (host can oust instead)
    sys(room, 'The host set ' + q.name + '’s pool to ' + v + '.');
  },
  hostOust(conn, room, p, m){
    if(!(p.token === room.hostToken || conn.admin)) return wsSend(conn.sock, { t:'err', msg:'Only the host can oust a player.' });
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
    if(!(p.token === room.hostToken || conn.admin)) return wsSend(conn.sock, { t:'err', msg:'Only the host can do that.' });
    const q = room.players[(m.seat | 0) - 1];
    if(!q) return wsSend(conn.sock, { t:'err', msg:'No such player.' });
    if(q.out){ q.out = false; sys(room, q.name + ' was returned to the game by the host.'); rosterUpd(room); }
  },
  setHelperPolicy(conn, room, p, m){
    if(!(p.token === room.hostToken || conn.admin))
      return wsSend(conn.sock, { t:'err', msg:'Only the host can set the table helper policy.' });
    room.helperPolicy = cleanHelperPolicy(m.policy);
    bcast(room, { t:'helperPolicy', policy: room.helperPolicy });
    sys(room, 'The host set the helper policy — ' + (room.helperPolicy.tournament
      ? 'Tournament mode: all helpers off for everyone.'
      : room.helperPolicy.allowLocal
        ? 'players may use their own helper settings.'
        : 'helpers locked to the host’s settings.'));
  },
  hostPass(conn, room, p, m){
    // v2.5.64 referee kit: advance the turn PAST a stuck/AFK seat without evicting anyone
    // (the paper judge's "play on"). Pairs with the new pass sender-guard -- that guard alone
    // would have removed even the old accidental any-seat escape valve. Only the seat that
    // CURRENTLY holds the turn can be passed: this is an unstick tool, not a turn-setter.
    if(!(p.token === room.hostToken || conn.admin)) return wsSend(conn.sock, { t:'err', msg:'Only the host can pass a turn for someone.' });
    if(!room.started) return wsSend(conn.sock, { t:'err', msg:'The game has not started yet.' });
    const seat = m.seat | 0;
    if(!room.turnSeat || seat !== room.turnSeat)
      return wsSend(conn.sock, { t:'err', msg:'That seat does not have the turn.' });
    const q = room.players[seat - 1];
    const ni = nextLiveSeat(room, seat - 1);
    room.turnSeat = ni + 1;
    bcast(room, { t:'turn', seat: room.turnSeat, who: room.players[ni].name });
    sys(room, '\u23ed The host passed the turn for ' + (q ? q.name : ('seat ' + seat)) + '.');
  },
  hostSetClock(conn, room, p, m){
    // v2.5.64 referee kit: the judge's "+5 minutes". Adjusts the match clock (or, at <= 0
    // remaining, calls time); every client re-syncs via the new 'clock' broadcast. With no
    // clock set, the host can START one mid-game (base = now).
    if(!(p.token === room.hostToken || conn.admin)) return wsSend(conn.sock, { t:'err', msg:'Only the host can adjust the match clock.' });
    if(!room.started) return wsSend(conn.sock, { t:'err', msg:'The game has not started yet.' });
    const d = parseInt(m.plusMins, 10);
    if(!Number.isFinite(d) || !d || Math.abs(d) > 600)
      return wsSend(conn.sock, { t:'err', msg:'Give a clock change between -600 and 600 minutes.' });
    const now = Date.now();
    let end = (room.matchEnd || now) + d * 60000;
    if(end - now > 600 * 60000) end = now + 600 * 60000;         // cap the remaining time at 10 h
    if(end <= now){
      room.matchEnd = null; room.timeCalled = true;
      bcast(room, { t:'clock', matchEnd: null });
      sys(room, '\u23f0 The host called time.');
      bcast(room, { t:'timeup' });
    } else {
      room.matchEnd = end; room.timeCalled = false;
      bcast(room, { t:'clock', matchEnd: end });
      sys(room, '\u23f1 The host adjusted the match clock: ' + (d > 0 ? '+' : '') + d + ' min.');
    }
  },
  ledgerGet(conn, room, p, m){
    // v2.5.65: hand the requester the server-authored resource history. Everything in it
    // was already broadcast as public board state, so any seated player may read it.
    const all = room.ledger || [];
    wsSend(conn.sock, { t:'ledger', rows: all.slice(-300), total: all.length });
  },
  kick(conn, room, p, m){
    if(!(p.token === room.hostToken || conn.admin))
      return wsSend(conn.sock, { t:'err', msg:'Only the host can remove players.' });
    let q = null, isWatcher = false;
    if(m.name != null){
      const nm = cleanName(m.name);
      q = room.players.find(x => x.name.toLowerCase() === nm.toLowerCase() && !x.vacant);   // v2.5.61 (Finding 1): host lookups match the join rule (case-insensitive)
      if(!q){ const w = (room.watchers || []).find(x => x.name.toLowerCase() === nm.toLowerCase()); if(w){ q = w; isWatcher = true; } }
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
    if(!(p.token === room.hostToken || conn.admin)) return wsSend(conn.sock, { t:'err', msg:'Only the host can do that.' });
    const q = room.players.find(x => x.name.toLowerCase() === cleanName(m.name).toLowerCase() && !x.vacant);   // v2.5.61 (Finding 1)
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
    if(!(p.token === room.hostToken || conn.admin)) return wsSend(conn.sock, { t:'err', msg:'Only the host can do that.' });
    const wi = (room.watchers || []).findIndex(w => w.name.toLowerCase() === cleanName(m.name).toLowerCase());   // v2.5.61 (Finding 1)
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
    if(!(p.token === room.hostToken || conn.admin)) return wsSend(conn.sock, { t:'err', msg:'Only the host can mute.' });
    const nm = cleanName(m.name), on = m.on !== false;
    const q = room.players.find(x => x.name.toLowerCase() === nm.toLowerCase()) || (room.watchers || []).find(x => x.name.toLowerCase() === nm.toLowerCase());   // v2.5.61 (Finding 1)
    if(!q || q === p) return wsSend(conn.sock, { t:'err', msg:'No such player.' });
    q.muted = on;
    if(q.sock) wsSend(q.sock, { t:'muted', on });
    sys(room, q.name + (on ? ' was muted by the host. 🔇' : ' was unmuted by the host. 🔊'));
    rosterUpd(room);
    if(!room.started) bcastLobby(room);
  },
  vp(conn, room, p, m){
    if(room.started && room.tournLock)                           // v2.5.64 tournament lock: scoring goes through ousts / the host -- VP self-adjust is a sandbox freedom
      return wsSend(conn.sock, { t:'err', msg:'VP is locked for this match (tournament lock) \u2014 scoring is via ousts.' });
    const d = parseFloat(m.d);
    if(Number.isFinite(d) && Math.abs(d) <= 3){
      const old = p.vp || 0;
      p.vp = Math.max(0, Math.min(10, Math.round((old + d) * 2) / 2));
      if(room.started && p.vp !== old){
        const line = 'adjusted own VP: ' + old + ' \u2192 ' + p.vp;
        ledgerAdd(room, room.players.indexOf(p) + 1, p.name, line);   // v2.5.65: the silent self-adjust now leaves an attributed trail
        bcast(room, { t:'ledgerLive', seat: room.players.indexOf(p) + 1, name: p.name, rows: [line] }, conn.sock);   // v2.5.66: ...and the others hear it live
      }
      rosterUpd(room);
    }
  },
  unoust(conn, room, p, m){
    if(room.started && room.tournLock)                           // v2.5.64: under the lock only the host may reverse an oust (hostUnoust)
      return wsSend(conn.sock, { t:'err', msg:'Un-oust is host-only for this match (tournament lock).' });
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
    if(room.started){
      const rows = ledgerDiff(room, p, p.pub, pub, m.undo === true ? '↩ undo: ' : '');   // v2.5.65: server-authored resource ledger (lobby pushes are setup noise, skipped); v2.5.67: a client-claimed undo push prefixes the batch -- narrative aid, the deltas are true either way
      if(rows && rows.length)                           // v2.5.66: stream the SAME rows live to everyone else -- the opponents' running narration of your hard resources is now server-authored; the pusher keeps their own richer local lines (their client already narrated the action)
        bcast(room, { t:'ledgerLive', seat: room.players.indexOf(p) + 1, name: p.name, rows }, conn.sock);
    }
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
      if(room.started) return wsSend(conn.sock, { t:'err', msg:'Seating is drawn in the lobby \u2014 the game has already started.' });   // v2.5.64: unconditional gate; mid-match this zeroed EVERYONE's vp/out and reshuffled the seats
      shuffle(room.players);
      room.players.forEach(q => { q.out = false; q.vp = 0; });   // new seating = new game
      room.turnSeat = 1;
      bcast(room, { t:'tool', kind:'seating', who: p.name, order: room.players.map(q => q.name) });
      bcast(room, { t:'turn', seat: 1, who: room.players[0].name });
      rosterUpd(room);
    }
  },
  saveMatch(conn, room, p, m){
    if(!(p.token === room.hostToken || conn.admin)) return wsSend(conn.sock, { t:'err', msg:'Only the host can save the match.' });
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
    if(!(p.token === room.hostToken || conn.admin)) return wsSend(conn.sock, { t:'err', msg:'Only the host can manage saved matches.' });
    wsSend(conn.sock, { t:'saveList', saves: saveList(room) });
  },
  delSave(conn, room, p, m){
    if(!(p.token === room.hostToken || conn.admin)) return wsSend(conn.sock, { t:'err', msg:'Only the host can manage saved matches.' });
    const s = saves.get(String(m.name || ''));
    if(s && s.passHash === room.passHash){ saves.delete(s.name); persistSaves(); }
    wsSend(conn.sock, { t:'saveList', saves: saveList(room) });
  },
  loadMatch(conn, room, p, m){
    if(!(p.token === room.hostToken || conn.admin)) return wsSend(conn.sock, { t:'err', msg:'Only the host can load a saved match.' });
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
    room.chat = sv.chat !== false; room.specChat = sv.specChat !== false; room.tournLock = !!sv.tournLock;
    room.ledger = Array.isArray(sv.ledger) ? sv.ledger.slice(-800) : [];   // v2.5.65: a loaded match keeps its evidence trail
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
  if(m.t === 'hello'){
    // v2.5.68 (L1+L2): the browse/credential handshake. Unlocks the door (srvPass), grants
    // per-connection admin (adminPass -- dies with the socket, never stored), registers the
    // connection for live roomList pushes, and answers with the current list.
    if(CFG.srvPassHash && !conn.authed && m.srvPass !== undefined && !doorCheck(conn, m)) return;
    if(CFG.adminPassHash && m.admin !== undefined){
      const key = isLoopback(conn.ip) ? 'srv:*' : ('srv:' + conn.ip);
      if(passMatch(CFG.adminPassHash, m.admin)){ conn.admin = true; }
      else {
        strike(ipFails, key);
        return wsSend(conn.sock, { t:'err', msg:'Wrong admin password.' });
      }
    }
    if(!conn.room) LOBBY_CONNS.add(conn);
    return sendRoomList(conn);
  }
  if(m.t === 'create'){
    if(!doorCheck(conn, m)) return;                                            // v2.5.68 L1: the server door
    if(CFG.createPolicy === 'admin' && !conn.admin)
      return wsSend(conn.sock, { t:'err', msg:'Only the tournament admin can create rooms on this server.' });
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
                   boardMode: m.boardMode === 'classic' ? 'classic' : 'structured',
                   tournLock: m.tournLock === true,            // v2.5.64 referee kit: after start, locks deck swaps + vp self-adjust + self-unoust (the host's own verbs are unaffected)
                   hasPass: !!(m.pass),                        // v2.5.68 L2: the lobby list shows a lock icon without revealing anything else
                   ledger: [] };                               // v2.5.65: server-authored resource history (see ledgerDiff)
    const p = { name: pname, token: token(), sock: conn.sock, last: Date.now(), off: 0, seatPick: null };
    room.hostToken = p.token;
    room.players.push(p);
    rooms.set(name, room);
    conn.room = room; conn.player = p;
    if(m.anon === true) p.anon = true;               // v2.5.68 L2: opt-out from the lobby list's name column
    joinReply(conn.sock, room, p);
    vWarn(conn, m);
    console.log('[room] created "' + name + '" by ' + pname + (room.started ? '' : ' (lobby)'));
    return;
  }

  /* ---- join (also handles reconnect via token) ---- */
  if(m.t === 'join'){
    if(!doorCheck(conn, m)) return;                                            // v2.5.68 L1: the server door (token reconnects also pass through -- the token proves the seat, srvPass proves the server)
    const room = rooms.get(cleanName(m.room));
    if(!room) return wsSend(conn.sock, { t:'err', msg:'No such room.' });
    /* token reconnect — token is the credential, password not needed */
    if(m.token){
      const p = findByToken(room, String(m.token));
      if(p){
        if(p.sock && p.sock !== conn.sock) wsClose(p.sock);   // kick the stale socket
        p.sock = conn.sock; p.last = Date.now(); p.off = 0;
        conn.room = room; conn.player = p;
        if(m.anon === true) p.anon = true;           // v2.5.68 L2
        joinReply(conn.sock, room, p);
        vWarn(conn, m);
        sys(room, p.name + ' reconnected.');
        rosterUpd(room);
        return;
      }
    }
    // Brute-force throttle on the room password. Behind a Cloudflare tunnel every
    // player shows up as the same loopback address, so a per-IP limit would be useless
    // there — it would either lock out ALL tunnel players at once (a shared 127.0.0.1
    // counter) or, if simply exempted, leave password-guessing completely unthrottled.
    // Instead we pick the key by context: a real address keeps the per-IP limit (an
    // internet/LAN attacker is throttled by their own IP, exactly as before), while a
    // tunnelled (loopback) join is throttled PER ROOM. That keeps the protection — five
    // wrong guesses against room X strike only room X — while a fat-fingering player in
    // one room can never lock players out of a different room. The "room:" prefix
    // namespaces the key so it can't collide with a real IP. (The 10-min cleanup sweep
    // below is key-agnostic, so these room: entries expire on their own.)
    const loopback = conn.ip === '127.0.0.1' || conn.ip === '::1' || conn.ip === '::ffff:127.0.0.1';
    const failKey  = loopback ? ('room:' + room.name) : conn.ip;
    if(strikes(ipFails, failKey, FAIL_WIN) >= FAIL_MAX)
      return wsSend(conn.sock, { t:'err', msg:'Too many failed attempts — try again in a few minutes.' });
    if(!passMatch(room.passHash, m.pass || '')){
      strike(ipFails, failKey);
      return wsSend(conn.sock, { t:'err', msg:'Wrong password.' });
    }
    const pname = cleanName(m.name);
    if(!pname) return wsSend(conn.sock, { t:'err', msg:'Player name is required.' });
    if(m.spect){
      room.watchers = room.watchers || [];
      { const lo = pname.toLowerCase();                              // v2.5.61 (review Finding 1): spectators dedup case-insensitively against BOTH seated players and other watchers, same rule the player join enforces - a watcher could previously take "alice" while "Alice" sat at the table, and case-SENSITIVE host lookups could then resolve to the wrong record
        const clash = room.players.some(x => !x.vacant && x.name.toLowerCase() === lo) ||
                      room.watchers.some(w => w.name.toLowerCase() === lo);
        if(clash) return wsSend(conn.sock, { t:'err', msg:'That name is taken at this table.' }); }
      room.watchers.push({ name: pname, sock: conn.sock });
      conn.room = room; conn.watch = true; conn.wname = pname;
      const msg = { t:'joined', room: room.name, spect: true, you: pname,
                    players: roster(room), watchers: room.watchers.length,
                    chat: room.chat !== false, specChat: room.specChat !== false, tournLock: room.tournLock || undefined,
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
      if(m.anon === true) ex.anon = true;            // v2.5.68 L2
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
    if(m.anon === true) p.anon = true;               // v2.5.68 L2
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
  scheduleRoomList();                                                          // v2.5.68 L2: spectator counts change
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
  if(!room.players.length){ rooms.delete(room.name); scheduleRoomList(); console.log('[room] "' + room.name + '" closed (empty)'); }
  else { rosterUpd(room); if(!room.started) bcastLobby(room); }
}

/* ---------- HTTP server (serves the client) + WS upgrade ---------- */
/* v2.6.2 (Johan: players who'd rather download card images into their own local folder
   than rely only on the browser's IndexedDB cache): serves an `images/` directory that sits
   NEXT TO the client file, mirroring the same "next to the client" folder Johan described.
   The regex requires the ENTIRE filename to be pure [a-z0-9] plus one recognised extension --
   by construction this can never contain '/' or '..', which is what the client's own
   norm(name) already produces, so a real card file always matches and nothing else can
   traverse out of IMAGES_DIR. The startsWith check afterward is defence-in-depth on top of
   that, not the primary guard. Missing folder/file -> plain 404, and the CLIENT's existing
   fallback chain (local -> cached-or-CDN) takes it from there; this route never needs its
   own "is the feature on" flag, since an absent folder is silently harmless.
   v2.6.4 widened this to ALSO cover card backs (fixed names cardbackcrypt.jpg/
   cardbacklibrary.jpg) and svg icons (path/superior-discipline/clan symbols, flattened to
   e.g. svg-path-caine.svg -- see the client's svgUrl()) -- hence '-' in the character class
   and 'svg' in the extension list; '/' and '..' remain unrepresentable either way. */
const IMAGES_DIR = path.resolve(path.dirname(CLIENT_FILE), 'images');
const IMG_FILE_RE = /^[a-z0-9-]+\.(webp|jpe?g|svg)$/i;
const srv = http.createServer((req, res) => {
  if(req.method === 'GET' && req.url.startsWith('/images/')){
    let file; try{ file = decodeURIComponent(req.url.slice('/images/'.length)); }catch(e){ file = ''; }
    if(!IMG_FILE_RE.test(file)){ res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
    const full = path.join(IMAGES_DIR, file);
    if(full !== IMAGES_DIR && !full.startsWith(IMAGES_DIR + path.sep)){ res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
    fs.readFile(full, (err, data) => {
      if(err){ res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
      const ct = /\.svg$/i.test(file) ? 'image/svg+xml' : (/\.webp$/i.test(file) ? 'image/webp' : 'image/jpeg');
      res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'public, max-age=86400' });
      res.end(data);
    });
    return;
  }
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
  // Per-IP connection cap. IMPORTANT for tunnel play: when players reach us through a
  // Cloudflare quick tunnel (or any reverse proxy on this same machine), cloudflared
  // connects to localhost, so EVERY remote player shows up here as the loopback
  // address. We therefore exempt loopback from the per-IP cap -- otherwise the 2nd,
  // 3rd, ... tunnel player would be rejected as "too many connections from one IP" and
  // could never join. Direct LAN players still arrive with their own real addresses and
  // are capped normally. (The global per-connection message rate limit below still
  // applies to everyone, tunnelled or not.)
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
                 ip: deriveIp(req.socket.remoteAddress, req.headers), rate: [] };   // v2.5.68: --trust-proxy aware (spoof-safe: headers only believed from loopback)
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
      LOBBY_CONNS.delete(conn);   // v2.6.8: the debounced roomList push only self-prunes when a ROOM event schedules it — on a quiet server, hello'd-then-closed browsers otherwise accumulate forever (each holding a socket reference). Deleting here makes close the primary cleanup; the prune in scheduleRoomList stays as belt-and-braces for any path that misses this.
      if(conn.player && conn.player.sock === conn.sock) dropPlayer(conn, false);
    }
  });
  conns.add(conn);
  sock.on('close', () => conns.delete(conn));
});

/* ---------- Keepalive & cleanup ----------
   Every 30s we (a) reap any socket we haven't heard from in 75s and (b) send a
   WebSocket ping to the rest. The ping matters most for TUNNEL play: a Cloudflare
   quick tunnel drops a WebSocket after ~100s of silence, so a heartbeat well inside
   that window keeps an idle game from being cut off. The 75s reap is deliberately
   longer than two ping intervals, so a peer must miss two heartbeats before we let it
   go (one lost ping is forgiven). Browsers answer pings at the protocol level, so no
   client code is needed. */
const conns = new Set();
setInterval(() => {
  const now = Date.now();
  conns.forEach(c => {
    if(c.sock.destroyed){ conns.delete(c); return; }
    if(now - c.last > 75000){ try{ c.sock.destroy(); }catch(err){} conns.delete(c); return; }   // silent for 75s (2+ missed pings) -> reap
    wsSendFrame(c.sock, 0x9, Buffer.alloc(0));   // 0x9 = WS ping opcode; keeps the tunnel from idling us out
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
      rooms.delete(name); scheduleRoomList();
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
      reactSecs: r.reactSecs || 5, timeCalled: !!r.timeCalled, escrowSalt: r.escrowSalt || null, tournLock: !!r.tournLock, hasPass: !!r.hasPass, ledger: (r.ledger || []).slice(-800),
      helperPolicy: r.helperPolicy || null,
      players: r.players.map(p => ({ name: p.name, token: p.token, seatPick: p.seatPick || null, muted: !!p.muted, vacant: !!p.vacant, anon: !!p.anon || undefined,
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
        chat: r.chat !== false, specChat: r.specChat !== false, started: r.started !== false, tournLock: !!r.tournLock, hasPass: !!r.hasPass, ledger: Array.isArray(r.ledger) ? r.ledger.slice(-800) : [],
        timeCalled: !!r.timeCalled, watchers: [],
        players: (r.players || []).map(p => ({ name: p.name, token: p.token, seatPick: p.seatPick || null, muted: !!p.muted, vacant: !!p.vacant, anon: !!p.anon,
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
const _sleep = () => { snapshot(); persistSaves(); console.log('\n  Rooms saved. The table sleeps.'); process.exit(0); };
process.on('SIGINT',  _sleep);
process.on('SIGTERM', _sleep);   // v2.6.9: SIGTERM is what systemd stop / docker stop / plain kill actually send — the exact signals an always-on named-tunnel/VPS deployment uses. Without this, those paths died un-flushed (losing up to 60s of room state, per the setInterval(snapshot, 60000) cadence); Ctrl+C (SIGINT) was the only graceful exit.

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
    chat: room.chat !== false, specChat: room.specChat !== false, tournLock: !!room.tournLock,
    ledger: (room.ledger || []).slice(-800),
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
  console.log('  Images:   ' + IMAGES_DIR + '  (optional -- served at /images/<file> when present; see Settings \u2192 "Check a local images folder")');
  if(CFG.srvPassHash)   console.log('  Door:     --server-pass is ON (hello/create/join require it)');
  if(CFG.adminPassHash) console.log('  Admin:    --admin-pass is ON' + (CFG.createPolicy === 'admin' ? ' (room creation is admin-only)' : ''));
  if(CFG.trustProxy)    console.log('  Proxy:    --trust-proxy is ON (CF-Connecting-IP/X-Forwarded-For believed from loopback)');
  const ifs = os.networkInterfaces();
  Object.keys(ifs).forEach(k => (ifs[k] || []).forEach(a => {
    if(a.family === 'IPv4' && !a.internal)
      console.log('  Network:  http://' + a.address + ':' + PORT + '   (share this with friends on your LAN/VPN)');
  }));
  console.log('  Client:   ' + CLIENT_FILE + (fs.existsSync(CLIENT_FILE) ? '' : '   (NOT FOUND!)'));
  console.log('  Stop with Ctrl+C. No dependencies, no install — just Node.');
  console.log('');
});
