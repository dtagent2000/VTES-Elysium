#!/usr/bin/env node
'use strict';
/* diag-a1-stash-probe.js — the combat-handshake stash probe (11 Sep 2026, A1)
   Wraps Bot.prototype so every stash write is TAGGED with its source
   ({who, inCombat, combatNo}) and every _awaitOpp* consumption is LOGGED with
   the bot's known opponent (_combatOppName / _lastBlockerName), then runs a
   real 3-bot arena. A consumption whose stashed vampire is not the opponent,
   or whose source was stashed while not in combat, is a STALE consumption --
   the bystander contamination that v0.6.103 fixed (2 of 5 before, 0 of 5 after).
   Usage: node diag-a1-stash-probe.js   (needs elysium-bot.js, elysium-bot-arena.js,
   elysium-server.js and elysium-cardfx.json beside it; ~1-2 min)               */
const { Bot } = require('./elysium-bot.js');
const { runArena } = require('./elysium-bot-arena.js');
const rec = [];
const P = Bot.prototype;
const oRC = P._resolveCombat, oLog = P._onLog, oAS = P._awaitOppStrike, oAP = P._awaitOppPress, oAT = P._awaitOppTaken, oChat = P._onChat;
P._resolveCombat = async function(v, opp){ this.__inCombat = true; this.__combats = (this.__combats||0)+1; try{ return await oRC.call(this, v, opp); } finally { this.__inCombat = false; } };
P._onLog = function(who, html){ const before = this._oppStrike; oLog.call(this, who, html); if(this._oppStrike && this._oppStrike !== before){ this._oppStrike.__src = { who, inCombat: !!this.__inCombat, combatNo: this.__combats||0 }; } };
P._onChat = function(who, msg){ const bp = this._oppPress, bt = this._oppTaken; oChat.call(this, who, msg);
  if(this._oppPress !== undefined && this._oppPress !== bp) this._oppPress.__src = { who, inCombat: !!this.__inCombat, combatNo: this.__combats||0 };
  if(this._oppTaken && this._oppTaken !== bt) this._oppTaken.__src = { who, inCombat: !!this.__inCombat, combatNo: this.__combats||0 }; };
P._awaitOppStrike = function(ms){ if(this._oppStrike) rec.push({ kind:'strike', bot:this.o.name, seat:this.seat, stashed:this._oppStrike.vamp, dealt:this._oppStrike.dealt, src:this._oppStrike.__src, myOpp:this._combatOppName||null, blocker:this._lastBlockerName||null, combatNo:this.__combats||0 }); return oAS.call(this, ms); };
P._awaitOppPress = function(ms){ if(this._oppPress !== undefined) rec.push({ kind:'press', bot:this.o.name, seat:this.seat, stashed:this._oppPress.vamp, cont:this._oppPress.continue, src:this._oppPress.__src, myOpp:this._combatOppName||null, blocker:this._lastBlockerName||null, combatNo:this.__combats||0 }); return oAP.call(this, ms); };
P._awaitOppTaken = function(ms){ if(this._oppTaken) rec.push({ kind:'taken', bot:this.o.name, seat:this.seat, stashed:this._oppTaken.vamp, src:this._oppTaken.__src, myOpp:this._combatOppName||null, blocker:this._lastBlockerName||null, combatNo:this.__combats||0 }); return oAT.call(this, ms); };
(async () => {
  const res = await runArena({ matches: 2, bots: 3, personas: ['shark','grinder','novice'], decks: ['nosferatu','tremere','hacking'], startPool: 15, askSecs: 1, matchTimeoutMs: 200000, log: () => {} });
  console.log('matches', res.results ? res.results.map(r => r.reason + ' win=' + r.winner + ' turns=' + r.playerTurns).join(' | ') : JSON.stringify(Object.keys(res)));
  console.log('stash-consumptions recorded:', rec.length);
  for(const r of rec) console.log(JSON.stringify(r));
})().catch(e => { console.error('ERR', e); process.exit(1); });
