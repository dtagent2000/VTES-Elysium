#!/usr/bin/env node
'use strict';
/* elysium-bot-abstract.js v1.0.0 (27 Nov 2026) -- THE ABSTRACT TABLE, layer 1: a table state built directly, the bots' real code answers.

   One table, in layers (RULINGS D-147, the owner's idea: the abstract table as a steerable test source for many more games). This file
   is its first layer: it builds a state (each seat's vampires, hand and pool) and plays ONE window on it -- the acting seat's turn -- with
   real Bot instances, so what a test reads is the bot's own path: the wire messages in, the finder, the decision, the play out. The later
   layers (D-147; the spec that replaces O-32's): random games from generated states, to measure which cards reach play and in which
   windows (coverage), and the probabilities over card classes that D-83 described, riding on those games. Nothing of theirs is built here.

   What it models: nothing the client does not do. The relay is the client's own hotseat bridge, `hotBridge` and `hotFanOut` lifted
   verbatim from the read-only client copy beside it (elysium-bot-hotseat.js's liftBridge / bridgeIn: the tool the sim table plays on),
   and the clock is the sim's virtual clock (elysium-bot-sim.js's installClock): every wait is a timer, and when the process has nothing
   left to do but wait the clock jumps to the next one. A window that takes seconds at the table takes milliseconds here, and the same
   spec gives the same wire byte for byte (a fixed epoch, a seeded Math.random for the bridge, each bot's own seeded PRNG).
   The state goes in through the bot's own rigged deal (`o.rig`: the hand, the ready vampires, the pool, applied by the `dealt` handler,
   so the bot pushes its board to the table itself); what the rig has no field for (a vampire locked, the Edge) is set after the deal
   and pushed again. The bridge's library and crypt are emptied after the deal, so no draw can bring a card into the window.

   The table's own rules (the rulebook through KRCG, zero-vtes a witness) are tested by `--self-test`: the base windows with no card --
   a block with intercept equal to stealth succeeds, a bleed is for 1, stealth and intercept are played only when needed, the same card
   once per action -- each with its source in the case's line. test-card-scenarios.js is the bench built on this table (the card chain's
   scenarios, generated from cardfx-exact.json).

   Usage (a module; the clock must be installed BEFORE elysium-bot.js is required, so require this file first):
     const T = require('./elysium-bot-abstract.js');
     const r = await T.runWindow({ acting: 1, seats: [
       { name: 'Hanna', pool: 30, hand: ['Lost in Crowds'], ready: [{ name: '"Coach" Tyrone Soros (G6)' }] },
       { name: 'Viktor', pool: 2, hand: [], ready: [{ name: 'Adelaide Davis (G3)', blood: 4 }] } ] });
     r.passed · r.lines (every seat's log and chat text, in order: { seat, who, tier, txt, ms }) · r.wire (every message a bot handed the
     bridge) · r.tallies (every tally a seat wrote) · r.seats[i] (each bot's hand, board, pool and ash heap after the window).
   A seat: { name, pool, hand: [card], ready: [{ name, blood?, cap?, locked?, attached? }], persona?, knobs?, edge? }. A spec: { acting
   (the seat whose turn is played), seats, askSecs (3), capMs (virtual, 120000), seed (1) }.
   CLI: node elysium-bot-abstract.js --self-test [--bot FILE]   (the table's own rules, one line a case; exit 1 on a failure; --bot plays them
   with another bot file, e.g. a mutant for the destructive proof)
*/
const path = require('path'), fs = require('fs');
const ABSTRACT_VERSION = '1.0.0';
const SIM = require(path.join(__dirname, 'elysium-bot-sim.js'));
let CLOCK = null;
function install(){ if(!CLOCK) CLOCK = SIM.installClock(SIM.EPOCH); return CLOCK; }
install();                                            // at require time: before anything requires the bot
const HS = require(path.join(__dirname, 'elysium-bot-hotseat.js'));
let BOT_PATH = path.join(__dirname, 'elysium-bot.js');
let BOT = null, LIFT = null, FXDATA = null;
function useBot(file){ if(BOT) throw new Error('abstract table: the bot is already loaded'); BOT_PATH = path.resolve(file); }   // another bot file (a mutant for a destructive proof, a previous release): before the first window
function bot(){ if(!BOT) BOT = require(BOT_PATH); return BOT; }
function lift(){ if(!LIFT) LIFT = HS.liftBridge(path.join(__dirname, 'elysium-vtes-bord.html')); return LIFT; }
function fxData(){ if(!FXDATA) FXDATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'elysium-cardfx.json'), 'utf8')); return FXDATA; }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const strip = h => String(h == null ? '' : h).replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const SAY = () => bot().SAY || [];

/* A vampire for a seat: the crypt entries of cardfx, filtered by what a card asks. want = { disc: 'obf' (inferior or better) | 'OBF'
   (superior), exact: true (the level and no higher: a mode at inferior is tested on a vampire without the superior), clan (or a list:
   any of them), sect, titled, titles: [the printed titles, any of them], minCap, without: [disciplines it must not have], noText (no crypt text the bot
   reads), notName: [names] }. The first match in name order (a stable pick); null when none fits. */
function pickVampire(want){
  const cr = fxData().crypt || {}, w = want || {}, not = new Set(w.notName || []);
  const lvls = String(w.disc || '').split('+').filter(Boolean);
  const names = Object.keys(cr).sort();
  for(const n of names){
    const e = cr[n]; if(!e || not.has(n)) continue;
    const d = e.disc || { all: [], sup: [] };
    if(!lvls.every(t => { const lo = t.toLowerCase(), sup = t !== lo;
      if(sup) return (d.sup || []).includes(lo);
      return (d.all || []).includes(lo) && !(w.exact && (d.sup || []).includes(lo)); })) continue;
    if(w.without && w.without.some(x => (d.all || []).includes(String(x).toLowerCase()))) continue;   // none of these disciplines at any level
    if(w.clan && ![].concat(w.clan).some(c => String(e.clan || '').split('/').includes(c))) continue;   // a clan, or any of a list
    if(w.sect && e.sect !== w.sect) continue;
    if(w.titled === true && !e.title) continue;
    if(w.titles && !w.titles.some(t => { const a = String(e.title || '').toLowerCase(), b = String(t).toLowerCase(); return !!a && (a === b || (b === 'inner circle member' && a === 'inner circle')); })) continue;
    if(w.titled === false && e.title) continue;
    if(w.minCap && !((e.cap | 0) >= w.minCap)) continue;
    if(w.noText && e.fx && Object.keys(e.fx).length) continue;   // a vampire whose own text the bot reads (crypt fx) would add to the counts
    return n;
  }
  return null;
}

/* One window: the acting seat's turn on a built state. */
async function runWindow(spec){
  const { Bot } = bot(), L = lift(), S = spec.seats || [], acting = spec.acting | 0 || 1;
  const realRandom = Math.random; let s = ((spec.seed | 0) || 1) >>> 0;
  Math.random = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };   // the bridge shuffles the deal with it
  const t0 = Date.now(), wire = [], lines = [], tallies = [], bots = [];
  try {
    const ctx = HS.bridgeIn(L, { MP_HANDLERS: { board(){}, log(){}, say(){}, chat(){}, fx(){}, tally(){} } });
    const HB = ctx.hotBridge, orig = HB._fromBot.bind(HB);
    HB._fromBot = function(seat, rec, m){
      if(m && typeof m.t === 'string'){
        const ms = Date.now() - t0, who = rec && rec.name, row = { ms, seat, who, m: JSON.parse(JSON.stringify(m)) }, i = wire.length;
        wire.push(row);   // i: the line's place on the wire (several messages share a virtual ms)
        if(m.t === 'log') lines.push({ ms, i, seat, who, tier: 'log', txt: strip(m.html) });
        else if(m.t === 'chat') lines.push({ ms, i, seat, who, tier: 'chat', txt: String(m.msg || '') });
        else if(m.t === 'say') lines.push({ ms, i, seat, who, tier: 'say', txt: SAY()[m.i] || ('say#' + m.i) });
        else if(m.t === 'tally') tallies.push({ ms, seat, who, mode: m.mode, a: m.a, b: m.b });
      }
      return orig(seat, rec, m);
    };
    HB.reset(S.map(x => ({ name: x.name, bot: true })));
    for(let i = 0; i < S.length; i++){
      const seat = i + 1, x = S[i];
      const ready = (x.ready || []).map(v => ({ name: v.name, blood: v.blood, cap: v.cap }));
      const deck = { name: 'abstract', crypt: [{ name: (ready[0] && ready[0].name) || '"Coach" Tyrone Soros (G6)', qty: 12 }],
                     library: [{ name: (x.hand && x.hand[0]) || 'Dodge', qty: 60 }] };   // what the bridge deals is replaced by the rig at once
      const b = new Bot(Object.assign({ name: x.name, room: 'abstract', pass: '', transport: HB.dialFor(seat, x.name), cardfxData: fxData(), deck,
        persona: x.persona || 'expert', paceMs: 0, askSecs: spec.askSecs || 3, startPool: 30, rngSeed: (Math.imul(((spec.seed | 0) || 1) >>> 0, 2654435761) + Math.imul(seat, 40503)) >>> 0,
        rig: { hand: (x.hand || []).slice(), unc: [], ready, pool: typeof x.pool === 'number' ? x.pool : 30 },
        log: () => {}, onEvent: () => {} }, x.knobs || {}));
      bots.push(b); await b.connect();
      const w0 = Date.now(); while(!(HB.seats[seat] && HB.seats[seat].deck) && Date.now() - w0 < 5000) await sleep(10);
      if(!(HB.seats[seat] && HB.seats[seat].deck)) throw new Error('abstract table: the deck upload never arrived for seat ' + seat);
      HB.startFor(seat);
    }
    await sleep(400);                                   // the deal's own pushes and the greeting settle
    for(let i = 0; i < S.length; i++){
      const seat = i + 1, x = S[i], b = bots[i], rec = HB.seats[seat];
      if(rec){ rec.lib = []; rec.crypt = []; }          // no draw brings a card into the window
      const crypt = b.board.filter(c => c && c.kind === 'crypt' && c.zone === 'ready');
      (x.ready || []).forEach((v, k) => { const c = crypt[k]; if(!c) return;
        if(v.locked) c.locked = true;
        if(typeof v.blood === 'number') c.blood = v.blood; });
      if(x.edge) b.edge = true;
      b.unc = []; b.cryptN = 0; b.libN = 0;
      b.push();
    }
    await sleep(400);
    const passed = await new Promise(res => { const to = setTimeout(() => res(false), spec.capMs || 120000); HB.onPass = s2 => { if(s2 === acting){ clearTimeout(to); res(true); } }; HB.turn(acting); });
    await sleep(50);
    const seats = bots.map((b, i) => ({ seat: i + 1, name: S[i].name, hand: (b.hand || []).slice(), pool: b.pool, edge: !!b.edge, ash: (b.ash || b._ash || []).slice ? (b.ash || b._ash || []).slice() : [],
      board: (b.board || []).filter(c => c).map(c => ({ name: c.name, kind: c.kind, zone: c.zone, blood: c.blood, locked: !!c.locked })) }));
    return { tool: 'elysium-bot-abstract ' + ABSTRACT_VERSION, bot: bot().BOT_VERSION, client: L.version, passed, ms: Date.now() - t0, wire, lines, tallies, seats, names: S.map(x => x.name) };
  } finally {
    bots.forEach(b => { try { b.out = true; b.close(); } catch(e){} });
    Math.random = realRandom;
  }
}

/* A window's reading helpers, for the tests built on the table. */
const linesOf = (r, seat, re) => r.lines.filter(l => (!seat || l.seat === seat) && (!re || re.test(l.txt)));
const bloodAt = (r, seat, name, line) => { const w = r.wire.find((x, k) => k > line.i && x.seat === seat && x.m.t === 'board' && x.m.pub && (x.m.pub.cards || []).some(c => c && c.name === name));   // the seat's first board push after the line on the wire: a cost paid shows there, before any combat
  const c = w && w.m.pub.cards.find(c => c && c.name === name); return c ? (c.blood | 0) : null; };   // a pub card at 0 blood carries none
const tallyOf = (r, seat, mode) => r.tallies.filter(t => (!seat || t.seat === seat) && (!mode || t.mode === mode));

/* ---------------- the table's own rules (--self-test) ----------------
   Each case: a base window with no card of the family under test, its source, and what the rule says must happen. The sources: the
   rulebook (vekn.net's rules, as KRCG's MCP serves them: vtes_rules_search / vtes_rules_read) and our RULINGS; zero-vtes's engine is
   the witness named on the case (its crates/engine, read at the pin setup.sh names). */
const SELF = [
  { id: 'R1', rule: 'a block succeeds when the blocker\'s intercept equals or exceeds the acting minion\'s stealth, both 0 by default (rulebook #stealth-and-intercept-resolution; zero-vtes engine actions.rs: intercept_of >= stealth)',
    spec: () => ({ acting: 1, seats: [
      { name: 'Hanna', pool: 30, hand: [], ready: [{ name: pickVampire({ disc: 'obf', exact: true, noText: true }), blood: 3 }] },
      { name: 'Viktor', pool: 2, hand: [], ready: [{ name: pickVampire({ disc: 'aus', exact: true, noText: true }), blood: 4 }] },
      { name: 'Lisa', pool: 30, hand: [], ready: [] } ] }),
    check: r => { const v = linesOf(r, 1, /^Block: Stealth (\d+) vs Intercept (\d+) — block succeeds\./)[0]; const m = v && v.txt.match(/Stealth (\d+) vs Intercept (\d+)/);
      return { ok: !!m && +m[1] === 0 && +m[2] === 0 && linesOf(r, 2, /attempts to block\.$/).length === 1, got: v ? v.txt : linesOf(r).map(l => l.txt).slice(-6).join(' | ') }; } },
  { id: 'R2', rule: 'an unblocked bleed burns 1 pool by default (rulebook #effect under Bleed; zero-vtes engine state.rs base_bleed)',
    spec: () => ({ acting: 1, seats: [
      { name: 'Hanna', pool: 30, hand: [], ready: [{ name: pickVampire({ disc: 'obf', exact: true, noText: true }), blood: 3 }] },
      { name: 'Viktor', pool: 20, hand: [], ready: [{ name: pickVampire({ disc: 'aus', exact: true, noText: true }), blood: 4, locked: true }] },
      { name: 'Lisa', pool: 30, hand: [], ready: [] } ] }),
    check: r => { const b = linesOf(r, 1, / bleeds for (\d+)\.$/)[0], g = linesOf(r, 1, /^The bleed goes through: Viktor, -(\d+) pool/)[0];
      return { ok: !!b && /for 1\.$/.test(b.txt) && !!g && /-1 pool/.test(g.txt), got: [b && b.txt, g && g.txt].join(' | ') }; } },
  { id: 'R3', rule: 'stealth is added only when needed: no block attempt, no stealth card (rulebook #stealth-and-intercept-resolution; RULINGS R-12; zero-vtes engine cards/mod.rs StealthNeeded)',
    spec: () => ({ acting: 1, seats: [
      { name: 'Hanna', pool: 30, hand: ['Lost in Crowds'], ready: [{ name: pickVampire({ disc: 'obf', exact: true, noText: true }), blood: 3 }] },
      { name: 'Viktor', pool: 20, hand: [], ready: [{ name: pickVampire({ disc: 'aus', exact: true, noText: true }), blood: 4, locked: true }] },
      { name: 'Lisa', pool: 30, hand: [], ready: [] } ] }),
    check: r => { const st = linesOf(r, 1, /: \+\d+ stealth\.$/); return { ok: !st.length && r.seats[0].hand.includes('Lost in Crowds'), got: st.map(l => l.txt).join(' | ') || 'no stealth line, the card kept' }; } },
  { id: 'R4', rule: 'intercept is added only when needed: a 0-stealth bleed is blocked bare and the intercept card kept (rulebook #stealth-and-intercept-resolution; RULINGS R-12; zero-vtes engine cards/mod.rs InterceptNeeded)',
    spec: () => ({ acting: 1, seats: [
      { name: 'Hanna', pool: 30, hand: [], ready: [{ name: pickVampire({ disc: 'obf', exact: true, noText: true }), blood: 3 }] },
      { name: 'Viktor', pool: 2, hand: ['Eyes of Argus'], ready: [{ name: pickVampire({ disc: 'aus', exact: true, noText: true }), blood: 4 }] },
      { name: 'Lisa', pool: 30, hand: [], ready: [] } ] }),
    check: r => { const ic = linesOf(r, 2, /: \+\d+ intercept\.$/), at = linesOf(r, 2, /attempts to block\.$/);
      return { ok: !ic.length && at.length === 1 && r.seats[1].hand.includes('Eyes of Argus'), got: (ic.concat(at)).map(l => l.txt).join(' | ') }; } },
  { id: 'R5', rule: 'a minion plays the same action modifier once per action: a second Lost in Crowds would win the contest and is not played (rulebook #action-modifier-cards)',
    spec: () => ({ acting: 1, seats: [
      { name: 'Hanna', pool: 30, hand: ['Lost in Crowds', 'Lost in Crowds'], ready: [{ name: pickVampire({ disc: 'obf', exact: true, noText: true }), blood: 3 }] },
      { name: 'Viktor', pool: 2, hand: ['Telepathic Misdirection'], ready: [{ name: pickVampire({ disc: 'aus', exact: true, noText: true }), blood: 4 }] },
      { name: 'Lisa', pool: 30, hand: [], ready: [] } ] }),
    check: r => { const st = linesOf(r, 1, /plays Lost in Crowds: \+1 stealth\.$/), ic = linesOf(r, 2, /plays Telepathic Misdirection: \+1 intercept\.$/), v = linesOf(r, 1, /^Block: Stealth 1 vs Intercept 1 — block succeeds\./);
      return { ok: st.length === 1 && ic.length === 1 && v.length === 1, got: st.length + ' Lost in Crowds, ' + ic.length + ' Telepathic Misdirection, ' + (linesOf(r, 1, /^Block: /)[0] || { txt: 'no verdict' }).txt }; } },
  { id: 'R6', rule: 'one (limited) bleed modifier per action: Conditioning, not Threats beside it; its blood cost paid by the acting vampire (rulebook #bleed and #limited; zero-vtes engine actions.rs limited_bleed_used)',
    spec: () => ({ acting: 1, seats: [
      { name: 'Hanna', pool: 30, hand: ['Conditioning', 'Threats'], ready: [{ name: pickVampire({ disc: 'dom', exact: true, noText: true }), blood: 5 }] },
      { name: 'Viktor', pool: 20, hand: [], ready: [{ name: pickVampire({ disc: 'aus', exact: true, noText: true }), blood: 4, locked: true }] },
      { name: 'Lisa', pool: 30, hand: [], ready: [] } ] }),
    check: r => { const m = linesOf(r, 1, /plays (Conditioning|Threats): \+\d+ bleed\.$/), v = (r.seats[0].board.find(c => c.kind === 'crypt') || {});
      return { ok: m.length === 1 && /Conditioning: \+2/.test(m[0].txt) && r.seats[0].hand.includes('Threats') && v.blood === 4, got: m.map(l => l.txt).join(' | ') + '; the vampire at ' + v.blood + ' blood' }; } }
];

async function selfTest(){
  let pass = 0, fail = 0; const t0 = CLOCK.realNow();
  for(const c of SELF){
    let res; try { const r = await runWindow(c.spec()); res = r.passed ? c.check(r) : { ok: false, got: 'the acting seat never passed' }; } catch(e){ res = { ok: false, got: 'threw: ' + e.message }; }
    if(res.ok) pass++; else fail++;
    console.log((res.ok ? 'PASS ' : 'FAIL ') + c.id + ' ' + c.rule + (res.ok ? '' : ' -- got: ' + res.got));
  }
  console.log('abstract table ' + ABSTRACT_VERSION + ': ' + pass + '/' + fail + ' (' + (CLOCK.realNow() - t0) + ' ms)');
  return fail;
}

module.exports = { runWindow, pickVampire, linesOf, tallyOf, bloodAt, install, useBot, strip, SELF, selfTest, ABSTRACT_VERSION };
if(require.main === module){
  const a = process.argv.slice(2), bi = a.indexOf('--bot');
  if(bi >= 0 && a[bi + 1]) useBot(a[bi + 1]);
  if(a.includes('--self-test')) selfTest().then(f => { CLOCK.stop(); process.exit(f ? 1 : 0); }).catch(e => { console.error('ABSTRACT TABLE FAILED:', e && e.stack || e); process.exit(1); });
  else { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); process.exit(0); }
}
