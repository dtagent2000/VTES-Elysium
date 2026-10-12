#!/usr/bin/env node
'use strict';
/* diag-give-probe.js — the LIVE give -> given probe (debt 26a, 18 Sep 2026). Runs a real 3-bot arena (real server), drops an
   Anarch Troublemaker on the first bot's board at its 2nd unlock, and records every `give` sent, every `given` / `err` received.
   Usage: node diag-give-probe.js   (needs elysium-bot.js, elysium-bot-arena.js, elysium-server.js, elysium-cardfx.json; ~1-2 min) */
const { Bot } = require('./elysium-bot.js');
const { runArena } = require('./elysium-bot-arena.js');
const rec = []; let injected = false;
const P = Bot.prototype, oGL = P._maybeGiveLock, oMk = P._mkHandlers, oSend = P.send;
P._maybeGiveLock = function(){ if(!injected && (this.ownTurns | 0) >= 2 && this.started && !this.out){ injected = true; this.board.push({ id: this.gid(), name: 'Anarch Troublemaker', kind: 'lib', zone: 'ready', faceDown: false, x: 64, y: 64, locked: false }); rec.push({ k: 'inject', bot: this.o.name, seat: this.seat }); }
  const r = oGL.call(this); if(r) rec.push({ k: 'give-lock', bot: this.o.name, seat: this.seat, prey: this.preySeat() }); return r; };
P.send = function(m){ if(m && m.t === 'give') rec.push({ k: 'SEND give', bot: this.o.name, msg: JSON.stringify(m).slice(0, 220) }); return oSend.call(this, m); };
P._mkHandlers = function(){ const h = oMk.call(this); const g = h.given, e = h.err, self = this;
  h.given = m => { rec.push({ k: 'RECV given', bot: self.o.name, name: m && m.name, gid: m && m.gid }); return g(m); };
  h.err = m => { rec.push({ k: 'RECV err', bot: self.o.name, msg: m && m.msg }); return e(m); };
  h.gave = m => { rec.push({ k: 'RECV gave', bot: self.o.name, to: m && m.to }); };
  return h; };
(async () => {
  const res = await runArena({ matches: 1, bots: 3, personas: ['shark', 'shark', 'shark'], decks: ['ventrue', 'tremere', 'nosferatu'], startPool: 30, askSecs: 1, matchTimeoutMs: 100000, log: () => {} });
  console.log('match:', res.results ? res.results.map(r => r.reason + ' turns=' + r.playerTurns).join(' | ') : Object.keys(res));
  for(const r of rec) console.log(JSON.stringify(r));
  const sent = rec.filter(r => r.k === 'SEND give').length, got = rec.filter(r => r.k === 'RECV given').length;
  console.log(sent + ' give sent / ' + got + ' given received' + (sent && sent === got ? ' — ok' : ' — FAIL'));
  process.exit(sent && sent === got ? 0 : 1);
})().catch(e => { console.error('ERR', e); process.exit(1); });
