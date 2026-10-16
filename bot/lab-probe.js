#!/usr/bin/env node
'use strict';
/* lab-probe.js v1.0.0 (17 Oct 2026, bot v0.6.206) -- THE PROBE LAB: one minion phase, the same table three times.
   Johan (16 Oct): measure the probe reservation before and after. The arena meets the probe about once in three matches, so a
   series counts it but cannot weigh it. This lab builds N random tables where the probe order can fire (a stealth-bleed actor
   with a heavy bleed in hand and at most one stealth card, a prey with bodies up), and plays the actor's whole turn on each
   table once per arm -- probeHold 0 (as played since v0.6.143), 1 (the reservation as designed), 2 (only when my actors
   out-number my prey's unlocked bodies) -- against real bots: the prey decides its blocks, bounces and clogs with its own
   logic, a third seat takes what is bounced. Same seed, same table in every arm: the only difference is the knob.
   Usage (from bot/): node lab-probe.js [N=120] [SEED=1] [ARMS=0,1,2] > lab.jsonl ; then python3 ana-lab.py lab.jsonl
   Each line: { i, arm, fired, reserved, outnumber, holds, acts: [{vamp, card, n, final, end}], preyLoss, thirdLoss, heavy }   */
const path = require('path');
const { Bot, SAY } = require(path.join(__dirname, 'elysium-bot.js'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const strip = h => String(h || '').replace(/<[^>]*>/g, '');
const N = +(process.argv[2] || 120), SEED = +(process.argv[3] || 1), ARMS = String(process.argv[4] || '0,1,2').split(',').map(Number);

function rng(seed){ let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (R, a) => a[Math.floor(R() * a.length)];
const shuffle = (R, a) => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const deckOf = name => require(path.join(__dirname, 'deck-' + name + '.json'));
const libList = d => { const out = []; (d.library || []).forEach(c => { for(let k = 0; k < (c.qty | 0); k++) out.push(c.name); }); return out; };

const MAL_DOM = ['Colette', 'Gelasia Fotiou', 'Donny Kowalczyk', 'Alexander Silverson'];   // [dom]/[DOM]: they can bleed with the Govern
const MAL_OTHER = ['Dr. Stephen Norton', 'Meaghan', 'Ashley', 'Sully', 'Andi Liu'];
const HEAVY = ['Govern the Unaligned', 'Conditioning'];
const PREY_DECKS = ['tremere', 'ventrue', 'nosferatu', 'malkavian'];

function buildTable(i){
  const R = rng(SEED * 100003 + i * 7919);
  const nAct = R() < 0.5 ? 2 : 3;
  const actNames = shuffle(R, MAL_DOM).slice(0, Math.max(1, nAct - (R() < 0.4 ? 1 : 0)));
  while(actNames.length < nAct) actNames.push(pick(R, MAL_OTHER.filter(n => !actNames.includes(n))));
  const actors = actNames.map((n, k) => ({ id: 'a' + k, name: n, kind: 'crypt', zone: 'ready', locked: false, blood: 2 + Math.floor(R() * 4), cap: 6, attached: [] }));
  const mal = deckOf('malkavian'), malLib = libList(mal);
  const bot0 = new Bot({ server: 'ws://127.0.0.1:1', room: 'x', pass: 'x', name: 'Lab', persona: 'expert', deckName: 'malkavian', paceMs: 0, log: () => {} });
  const isStealth = n => { const h = bot0.fxLookup(n); return !!(h && h.kind === 'lib' && bot0._cats(h.e).includes('stealth')); };
  const filler = malLib.filter(n => !HEAVY.includes(n) && !isStealth(n));
  const hand = [pick(R, HEAVY)]; if(R() < 0.35) hand.push(pick(R, HEAVY));
  if(R() < 0.15) hand.push(pick(R, malLib.filter(isStealth)));   // the probe wants at most one stealth card -- mostly none
  while(hand.length < 7) hand.push(pick(R, filler));
  const pd = pick(R, PREY_DECKS), pdeck = deckOf(pd), plib = libList(pdeck);
  const pcrypt = shuffle(R, (pdeck.crypt || []).map(c => c.name)).slice(0, 3);
  const nPrey = 1 + Math.floor(R() * 3);
  const prey = pcrypt.slice(0, nPrey).map((n, k) => ({ id: 'p' + k, name: n, kind: 'crypt', zone: 'ready', locked: false, blood: 2 + Math.floor(R() * 4), cap: 6, attached: [] }));
  const preyHand = shuffle(R, plib).slice(0, 7);
  return { actors, hand: shuffle(R, hand), pd, prey, preyHand, preyPool: 14 + Math.floor(R() * 12), actPool: 14 + Math.floor(R() * 12) };
}

async function playArm(tb, arm){
  const P = [{ seat: 1, name: 'Mal', online: true, bot: true }, { seat: 2, name: 'Viktor', online: true, bot: true }, { seat: 3, name: 'Nora', online: true, bot: true }];
  const mk = (name, seat, deck, x) => { const u = new Bot(Object.assign({ server: 'ws://127.0.0.1:1', room: 'x', pass: 'x', name, persona: 'expert', deckName: deck, paceMs: 0, askSecs: 0.4, phaseSecs: 0.3, twdKnow: 0, log: () => {} }, x || {}));
    u.seat = seat; u.started = true; u.players = P.map(p => Object.assign({}, p)); u.push = () => {}; u.fxClone = () => {}; u.rows = [];
    u.onEvent = (t, m) => { if(/^bot:(probe-order|probe-hold|through|blocked|took-bleed|play)$/.test(t)) u.rows.push({ t: t.slice(4), m }); };
    return u; };
  const A = mk('Mal', 1, 'malkavian', { probeHold: arm }), V = mk('Viktor', 2, tb.pd), N3 = mk('Nora', 3, 'nosferatu');
  const all = [A, V, N3];
  for(const from of all) from.send = m => {
    if(!m) return;
    if(m.t === 'say'){ const d = { t: 'say', i: m.i, who: from.o.name }; for(const to of all) if(to !== from) setTimeout(() => { if(!to.out) to._dispatch(d); }, 20); return; }
    if(m.t !== 'log' && m.t !== 'chat') return;
    from._evRecord(from.o.name, m.t === 'log' ? strip(m.html) : String(m.msg || ''), m.t, true);
    const d = Object.assign({}, m, { who: from.o.name }); for(const to of all) if(to !== from) setTimeout(() => { if(!to.out) to._dispatch(d); }, 20); };
  A.board = tb.actors.map(c => Object.assign({}, c)); A.hand = tb.hand.slice(); A.pool = tb.actPool; A.cryptN = 0; A.unc = []; A.turnSeat = 1;
  V.board = tb.prey.map(c => Object.assign({}, c)); V.hand = tb.preyHand.slice(); V.pool = tb.preyPool; V.turnSeat = 1;
  N3.board = [{ id: 'n1', name: 'Ryan (G6)', kind: 'crypt', zone: 'ready', locked: true, blood: 4, cap: 4, attached: [] }]; N3.hand = []; N3.pool = 20; N3.turnSeat = 1;
  const pubOf = u => ({ pool: u.pool, cards: u.board.map(c => ({ id: c.id, kind: c.kind, name: c.name, zone: c.zone, blood: c.blood, locked: c.locked })) });
  for(const u of all){ u.table = {}; for(const o of all) if(o !== u) u.table[o.seat] = { pub: pubOf(o), seen: new Set(), seeded: true }; }
  const v0 = V.pool, n0 = N3.pool;
  let err = null;
  await Promise.race([A._playTurn().catch(e => { err = e.message; }), sleep(25000)]);
  await sleep(250); all.forEach(u => { u.out = true; });
  const po = (A.rows.find(r => r.t === 'probe-order') || {}).m || null;
  const acts = A.rows.filter(r => r.t === 'through' || r.t === 'blocked').map(r => ({ vamp: r.m.vamp, card: r.m.card || null, n: r.m.n, final: r.m.final != null ? r.m.final : null, bounced: !!r.m.bounced, end: r.t, kind: r.m.kind || null }));
  const heavyPlays = acts.filter(a => HEAVY.includes(a.card));
  return { arm, err, fired: !!po, reserved: !!(po && po.reserved), outnumber: po ? po.outnumber : null, preyUp: po ? po.preyUp : tb.prey.length, nAct: tb.actors.length,
    holds: A.rows.filter(r => r.t === 'probe-hold').length, acts, preyLoss: v0 - V.pool, thirdLoss: n0 - N3.pool,
    heavy: heavyPlays.map(a => a.end + (a.bounced ? '-bounced' : '')), blocks: acts.filter(a => a.end === 'blocked').length, pd: tb.pd };
}

(async () => {
  for(let i = 1; i <= N; i++){
    const tb = buildTable(i);
    for(const arm of ARMS){ const r = await playArm(tb, arm); r.i = i; process.stdout.write(JSON.stringify(r) + '\n'); }
  }
  process.exit(0);
})();
