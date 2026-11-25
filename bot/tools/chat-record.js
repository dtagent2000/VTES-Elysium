#!/usr/bin/env node
'use strict';
/* tools/chat-record.js v1.0.0 (25 Nov 2026, bot v0.6.240, the chat round: BOARD, RULINGS D-136 / D-137) -- THE CHAT RECORDER.
   A bots-only hotseat table at the client's own pace (paceMs 3100, askSecs 20, deckName: how elysium-vtes-bord.html spawns a hotseat
   bot), played by elysium-bot-hotseat.js's runTable through the client's lifted hotBridge, and every message a bot hands the bridge
   (chat, say, log, fx, tally, and decide: the room's Reaction stopwatch, a countdown on every screen) written with its time: what the table SHOWS and when, for tools/ana-chat.py. The real clock: a recording
   of 5 rounds takes 10-15 minutes, so launch it detached and poll. The deal is seeded (the same seed deals the same cards); the timing
   is the real clock's, so two recordings of the same bytes agree in shape, not byte for byte.
     usage (from bot/): node tools/chat-record.js --out FILE.jsonl [--bot FILE] [--client FILE] [--seed 7] [--rounds 5] [--pace 3100]
                        [--ask-secs 20] [--decks malkavian,tremere,nosferatu,ventrue] [--names Mara,Tobias,Nadja,Viktor]
   The first row is { t: 'meta', ... } (the bot and client versions, the options, how the table ended); then one row per message:
   { ms, round, turn, seat, who, t } and chat: text · say: i · log: text (tags stripped) · fx: kind, card, ck, actor, verb · tally: mode, a, b ·
   decide: nothing more (the ring itself is the event).
   Exit 0 = the table ran its rounds or finished; 1 = it stuck or failed (the rows so far are still written). */
const fs = require('fs'), path = require('path');
const B = path.resolve(__dirname, '..');
const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const OUT = arg('--out', null);
if(!OUT){ console.error('usage: node tools/chat-record.js --out FILE.jsonl [--bot FILE] [--client FILE] [--seed N] [--rounds N] [--pace MS] [--ask-secs S] [--decks a,b,c,d] [--names A,B,C,D]'); process.exit(2); }
const o = {
  bot: path.resolve(arg('--bot', path.join(B, 'elysium-bot.js'))), client: path.resolve(arg('--client', path.join(B, 'elysium-vtes-bord.html'))),
  seed: +arg('--seed', 7), rounds: +arg('--rounds', 5), paceMs: +arg('--pace', 3100), askSecs: +arg('--ask-secs', 20),
  decks: arg('--decks', 'malkavian,tremere,nosferatu,ventrue').split(','), names: arg('--names', 'Mara,Tobias,Nadja,Viktor').split(','),
};
if(o.names.length < o.decks.length){ console.error('--names needs one name per deck'); process.exit(2); }
const HT = require(path.join(B, 'elysium-bot-hotseat.js'));
const rows = [];
const strip = h => String(h || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
function onWire(w){
  const m = w.m; if(!m || !['chat', 'say', 'log', 'fx', 'tally', 'decide'].includes(m.t)) return;
  const row = { ms: w.ms, round: w.round, turn: w.turn, seat: w.seat, who: w.who, t: m.t };
  if(m.t === 'chat') row.text = String(m.msg || '');
  else if(m.t === 'say') row.i = m.i;
  else if(m.t === 'log') row.text = strip(m.html);
  else if(m.t === 'fx') Object.assign(row, { kind: m.kind, card: m.card && m.card.name, ck: m.card && m.card.kind, actor: m.actor && m.actor.name, verb: m.verb });
  else if(m.t === 'tally') Object.assign(row, { mode: m.mode, a: m.a, b: m.b });
  rows.push(row);
}
const write = meta => fs.writeFileSync(OUT, [JSON.stringify(Object.assign({ t: 'meta', tool: 'chat-record 1.0.0' }, meta))].concat(rows.map(r => JSON.stringify(r))).join('\n') + '\n');
const opts = { o: { seed: o.seed, rounds: o.rounds, paceMs: o.paceMs, askSecs: o.askSecs, decks: o.decks, names: o.names.slice(0, o.decks.length) } };
const t0 = Date.now();
const tick = setInterval(() => write(Object.assign({ partial: true }, opts)), 30000);   // a long run leaves its rows on disk as it goes
HT.runTable({ decks: o.decks, names: o.names.slice(0, o.decks.length), seed: o.seed, rounds: o.rounds, paceMs: o.paceMs, askSecs: o.askSecs, deckname: true,
  persona: 'expert', startPool: 30, bot: o.bot, client: o.client, stuckMs: 600000, onWire,
  progress: l => process.stderr.write(l + '\n') })
  .then(res => {
    clearInterval(tick);
    write(Object.assign(opts, { bot: res.bot, client: res.client, rounds: res.rounds, finished: res.finished, stuck: res.stuck, alive: res.alive, pools: res.pools, secs: Math.round((Date.now() - t0) / 1000) }));
    process.stderr.write('chat-record: ' + rows.length + ' rows, bot v' + res.bot + ', client v' + res.client + (res.stuck ? ', STUCK at ' + JSON.stringify(res.stuck) : '') + ' -> ' + OUT + '\n');
    process.exit(res.stuck ? 1 : 0);
  })
  .catch(e => { clearInterval(tick); write(Object.assign(opts, { failed: String(e && e.message || e) })); console.error('chat-record FAILED:', e && e.message || e); process.exit(1); });
