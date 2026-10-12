#!/usr/bin/env node
'use strict';
/* ============================================================================
   test-bot-canary.js — the §12 CONTRACT CANARY                       v1.0.0
   ----------------------------------------------------------------------------
   PROTOCOL.md §12 is the authoritative, "frozen" bot contract. Three things
   must agree at all times: (1) what §12 DOCUMENTS, (2) what the CLIENT
   actually emits on the `log` relay, and (3) what the BOT's L12 regexes
   actually parse. Nothing stops a future client edit from drifting the
   wording while §12 and the bot stay untouched — that breaks the bot
   SILENTLY (no error, just quietly-wrong behaviour, e.g. a bleed the bot
   never arms). This file makes that loud instead.

   It tests the REAL artifacts, not lookalikes: `L12` is required directly
   from elysium-bot.js (already exported — no bot changes needed), and the
   three resolver line-builders (AVR_DEFS.block/vote/combat.line) are
   extracted from the CLIENT SOURCE ITSELF and executed, so this checks the
   client's actual code, not a hand-copied guess of what it does.

   No server, no network, sub-second. Run it in the gate battery alongside
   the bot regression suite (see CLAUDE.md / SKILLS.md's gate list).
   ========================================================================== */

const fs = require('fs');
const path = require('path');
/* 9 Sep 2026 (the project split): this canary is the CONTRACT test between the bot's parsers (L12) and the client's
   frozen §12 log grammars, so it needs BOTH files beside it. It lives in both projects; whichever side changes runs it
   with the OTHER side's released file uploaded beside the suite. Missing counterpart = a loud skip, never a fake pass. */
for (const need of ['elysium-bot.js', 'elysium-vtes-bord.html', 'ELYSIUM-PROTOCOL.md']) {
  if (!require('fs').existsSync(require('path').join(__dirname, need))) {
    console.log('\u25cb CANARY SKIPPED -- needs ' + need + ' beside it (the released file from the sister project). 0 checks run.');
    process.exit(0);
  }
}
const { L12 } = require('./elysium-bot.js');

let passN = 0, failN = 0;
function ok(cond, label){ if(cond) passN++; else { failN++; console.log('  \u2717 ' + label); } }

const CLIENT = fs.readFileSync(path.join(__dirname, 'elysium-vtes-bord.html'), 'utf8');
const PROTOCOL = fs.readFileSync(path.join(__dirname, 'ELYSIUM-PROTOCOL.md'), 'utf8');

/* ---- 1) extract + EXECUTE the client's own AVR_DEFS line-builders --------
   These three are pure functions of (a,b) with no DOM dependency, so the
   exact live client code can be pulled out and run here, not reimplemented. */
const avrMatch = CLIENT.match(/const AVR_DEFS=\{[\s\S]*?\n\};/);
ok(!!avrMatch, 'extraction anchor: AVR_DEFS block found in the client source');
let AVR_DEFS = null;
if(avrMatch){
  AVR_DEFS = new Function('return (' + avrMatch[0].replace(/^const AVR_DEFS=/, '').replace(/;$/, '') + ');')();
}
ok(!!(AVR_DEFS && AVR_DEFS.block && AVR_DEFS.vote && AVR_DEFS.combat &&
      typeof AVR_DEFS.block.line === 'function' && typeof AVR_DEFS.vote.line === 'function' &&
      typeof AVR_DEFS.combat.line === 'function'),
   'extraction sanity: all three mode line-builders came through as functions (anchor captured the right span)');

if(AVR_DEFS){
  [['block', 3, 5, 'succeeds'], ['block', 5, 3, 'fails'], ['block', 4, 4, 'succeeds'],   // ties: B>=A succeeds
   ['vote', 6, 2, 'passes'], ['vote', 2, 6, 'fails'], ['vote', 3, 3, 'fails'],            // ties: A>B required, so a tie fails
   ['combat', 4, 1, null]].forEach(([mode, a, b, want]) => {
    const line = AVR_DEFS[mode].line(a, b);
    const m = line.match(L12[mode]);
    ok(!!m, 'bot L12.' + mode + ' parses the LIVE client line: "' + line + '"');
    if(m && want) ok(m[3] === want, mode + ' ' + a + ' vs ' + b + ' verdict extracted correctly (' + want + ')');
  });
}

/* ---- 2) the bleed lines aren't isolable pure functions (cardRefCap/
   targetSuffix touch DOM state) -- assert the load-bearing literal
   fragments the client actually concatenates still exist verbatim, then
   confirm the bot's regex accepts a line built from PROTOCOL's own shape -- */
["' bleeds for '", "' adds +'", "' bleed (= '", "' Target: '"].forEach(frag => {
  ok(CLIENT.includes(frag), 'client source still contains the load-bearing fragment ' + frag);
});
ok(!!'Lisa Noble bleeds for 2.'.match(L12.bleed), 'L12.bleed parses the base shape');
ok(!!("Lisa Noble bleeds for 2. Target: Rex's pool.").match(L12.bleed), 'L12.bleed parses the pool-target shape (v2.6.21)');
ok(!!'Lisa Noble adds +1 bleed (= 3).'.match(L12.add), 'L12.add parses the running-total shape');

/* ---- 3) PROTOCOL.md §12's own prose -- the documented template shapes,
   cross-checked against a concrete line the bot regex must accept. Safely
   avoids the em-dash byte in this file's own string literals (mojibake
   discipline) by checking the halves either side of it separately. ------- */
const i12 = PROTOCOL.indexOf('## 12.'), i13 = PROTOCOL.indexOf('## 13.');
ok(i12 >= 0 && i13 > i12, 'extraction anchor: PROTOCOL.md \u00a712 section found');
const sec12 = (i12 >= 0 && i13 > i12) ? PROTOCOL.slice(i12, i13) : '';

[['NAME bleeds for N.', 'Lisa Noble bleeds for 2.', L12.bleed],
 ['NAME adds +X bleed (= T).', 'Lisa Noble adds +1 bleed (= 3).', L12.add],
 ['Block: Stealth A vs Intercept B', 'Block: Stealth 1 vs Intercept 2 \u2014 block fails.', L12.block],
 ['Vote: A for vs B against', 'Vote: 1 for vs 2 against \u2014 vote fails.', L12.vote],
 ['Combat: A vs B damage dealt.', 'Combat: 1 vs 2 damage dealt.', L12.combat]
].forEach(([tag, sample, re]) => {
  ok(sec12.includes(tag), 'PROTOCOL \u00a712 still documents the "' + tag + '" shape');
  ok(!!sample.match(re), 'the bot regex accepts a line built from that documented shape');
});
['block succeeds.', 'block fails.', 'vote passes.', 'vote fails.'].forEach(frag => {
  ok(sec12.includes(frag), 'PROTOCOL \u00a712 documents the verdict wording "' + frag + '"');
});

/* ---- 4) v0.6.164: the client's COMBAT line-builders (CMB_LINE, client v2.6.132) -- extracted and EXECUTED,
   every line fed through a live bot's _onLog mid-combat, the effect asserted (main's spec-bot-combat-fields §3) */
const cmbMatch = CLIENT.match(/const CMB_LINE=\{[\s\S]*?\n\};/);
ok(!!cmbMatch, 'extraction anchor: CMB_LINE block found in the client source (client >= v2.6.134, effect-only lines)');
if(cmbMatch){
  const CMB_LINE = new Function('return (' + cmbMatch[0].replace(/^const CMB_LINE=/, '').replace(/;$/, '') + ');')();
  const { Bot } = require('./elysium-bot.js');
  const mk = () => { const u = new Bot({ server: 'ws://127.0.0.1:1', room: 'x', pass: 'x', name: 'Bot', persona: 'expert', deckName: 'malkavian', paceMs: 0, askSecs: 1, log: () => {} });
    u.seat = 2; u.started = true; u.send = () => {}; u.push = () => {};
    u.players = [{ seat: 1, name: 'Johan' }, { seat: 2, name: 'Bot', bot: true }];
    const me = { id: 'm1', name: 'Sully', kind: 'crypt', zone: 'ready', blood: 4, cap: 4 }; u.board = [me];
    u._inCombat = true; u._combatMyVamp = me; u._combatOppName = 'Lisa'; u._rnd = {}; return u; };
  let u = mk(); u._onLog('Johan', CMB_LINE.hand('Lisa', 1)); ok(u._oppStrike && u._oppStrike.dealt === 1, 'CMB_LINE.hand(1) -> a strike for 1');
  u = mk(); u._onLog('Johan', CMB_LINE.hand('Lisa', 3)); ok(u._oppStrike && u._oppStrike.dealt === 3, 'CMB_LINE.hand(3) -> a strike for 3');
  u = mk(); u._onLog('Johan', CMB_LINE.weapon('Lisa', 2)); ok(u._oppStrike && u._oppStrike.dealt === 2, 'CMB_LINE.weapon -> a strike for 2');
  u = mk(); u._onLog('Johan', CMB_LINE.strike('Lisa', 3)); ok(u._oppStrike && u._oppStrike.dealt === 3 && !u._oppStrike.aggr, 'CMB_LINE.strike (v2.6.134, no card) -> a strike for 3');
  u = mk(); u._onLog('Johan', CMB_LINE.steal('Lisa', 2)); ok(u._oppStrike && u._oppStrike.dealt === 0 && u._oppStrike.steal === 2 && u._combatMyVamp.blood === 2 && u._rnd.stolenFromMe === 2, 'CMB_LINE.steal (ONE line) -> a strike for 0 AND the bot loses 2 blood (not damage)');
  u = mk(); u._onLog('Johan', CMB_LINE.dodge('Lisa')); ok(u._oppStrike && u._oppStrike.dodge === true, 'CMB_LINE.dodge -> a dodge');
  u = mk(); u._onLog('Johan', CMB_LINE.ends('Lisa')); ok(u._oppStrike && u._oppStrike.ends === true && u._oppEndedCombat === true, 'CMB_LINE.ends (ONE line) -> combat ends');
  u = mk(); u._onLog('Johan', CMB_LINE.agg('Lisa', 2)); ok(u._oppStrike && u._oppStrike.aggr === 2 && u._oppStrike.dealt === 0, 'CMB_LINE.agg -> an aggravated strike for 2');
  u = mk(); u._onLog('Johan', CMB_LINE.env('Lisa', 2)); ok(u._oppCarrionCrows && u._oppCarrionCrows.n === 2, 'CMB_LINE.env(2) -> every-round damage 2');
  u._onLog('Johan', CMB_LINE.env('Lisa', 0)); ok(u._oppCarrionCrows === null, 'CMB_LINE.env(0) -> no more every-round damage');
  u = mk(); u._onLog('Johan', CMB_LINE.man('Lisa', 'long')); ok(u._oppManeuver && u._oppManeuver.range === 'long', 'CMB_LINE.man -> a maneuver to long');
  u = mk(); u._onLog('Johan', CMB_LINE.setr('Lisa', 'long', false)); ok(u._setRangeNow === 'long', 'CMB_LINE.setr (this round) -> the range is set, no maneuvers');
  u = mk(); u._onLog('Johan', CMB_LINE.setr('Lisa', 'close', true)); ok(u._nextRange === 'close', 'CMB_LINE.setr (next round) -> carried to the next round');
  u = mk(); u._onLog('Johan', CMB_LINE.press('Lisa', 'continue')); ok(u._oppPress && u._oppPress.continue === true, 'CMB_LINE.press continue');
  u = mk(); u._onLog('Johan', CMB_LINE.press('Lisa', 'end')); ok(u._oppPress && u._oppPress.continue === false, 'CMB_LINE.press end');
  u = mk(); let threw = null; try { u._onLog('Johan', CMB_LINE.extra('Lisa')); u._onLog('Johan', CMB_LINE.prev('Lisa', 1)); } catch(e){ threw = e; }
  ok(!threw, 'CMB_LINE.extra / prev are read without error (table talk for the bot today)');
  u = mk(); u._onLog('Johan', CMB_LINE.taken('Lisa', 3, 2, 0, true, false)); ok(u._oppLastTaken && u._oppLastTaken.n === 2 && u._oppLastTaken.now === 0 && u._oppLastTaken.down === true, 'CMB_LINE.taken (torpor) -> loses 2, now 0, down');
  u = mk(); u._onLog('Johan', CMB_LINE.taken('Lisa', 2, 1, 0, false, true)); ok(u._oppLastTaken && u._oppLastTaken.down === true, 'CMB_LINE.taken (burned, v2.6.135) -> down');
  u = mk(); u._onLog('Johan', CMB_LINE.taken('Lisa', 1, 1, 3, false, false)); ok(u._oppLastTaken && u._oppLastTaken.now === 3 && u._oppLastTaken.down === false, 'CMB_LINE.taken -> now 3, not down');
}

console.log('\n' + passN + '/' + failN + (failN ? ' \u2014 FAIL' : ' \u2014 all green'));
process.exit(failN ? 1 : 0);
