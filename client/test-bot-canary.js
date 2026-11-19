#!/usr/bin/env node
'use strict';
/* ============================================================================
   test-bot-canary.js — the §12 CONTRACT CANARY                       v1.4.0
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
   v1.1.0 (3 Nov 2026, client v2.6.171): section 6 -- the bot-emitted lines the bot project
   asked main to record (the docs-diet handoff of 20 Oct, bot v0.6.213-215).
   v1.2.0 (11 Nov 2026, client v2.6.174): section 7 -- bot v0.6.217's lines (V5 wave 4, the
   handoff of 3 Nov): Change of Target, the polling-step abstain, an action that burns a card in
   play, the rush line's new granting cards, and the shapes the wave reuses.
   v1.3.0 (15 Nov 2026, client v2.6.175): section 8 -- bot v0.6.219-228's lines (the handoffs of 12-14
   Nov): a HUMAN's Toreador Grand Ball read from the client's play line, the question to its owner and
   the answer, Smiling Jack's burn, Eyes of the Wild, the crypt dodge, the table lines with no reader,
   and the client's aim rule (one aim per action; a bleed names a Methuselah).
   v1.4.0 (19 Nov 2026, client v2.6.176): section 9 -- bot v0.6.230-234's lines (the handoffs of 17-18
   Nov, V5 waves 5a to 6b): a steal, Privileged Position, the referendums without a poll and to burn a
   card in play, Tension in the Ranks, the 'as played' window, Sudden Reversal, Meditative Grove, Yawp
   Court, Week of Nightmares, One With the Land, Night Terrors, a cancel bought with pool, Absolute
   Tyranny. Section 8's control on a CARD in a bleed's suffix is no longer a check (bot v0.6.230's ask):
   it pinned what the bot did not read, so the bot project could not widen the reading.
   v1.5.0 (19 Nov 2026, client v2.6.177): section 10 -- what the bots' readers rest on since v2.6.177: the hotseat
   bridge delivers after the sender's code has returned (section 12.2), and a card dragged from the hand to the table
   writes the menu's play line (section 12). Documentation and client source, positives only.
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

/* ---- 5) v2.6.159 (bot v0.6.201's ask): the client's Reduce line (BLEED_LINE, the Bleed menu's Reduce row) -- extracted
   and EXECUTED, fed through the bot's L12.reduceBy and through a live bot's _onLog mid-bleed; and the two bot-emitted
   DEBUG lines the bots now read from each other, as PROTOCOL section 12 documents them */
const blMatch = CLIENT.match(/const BLEED_LINE=\{[\s\S]*?\n\};/);
ok(!!blMatch, 'extraction anchor: BLEED_LINE block found in the client source (client >= v2.6.159, the Reduce row)');
if(blMatch){
  const BLEED_LINE = new Function('return (' + blMatch[0].replace(/^const BLEED_LINE=/, '').replace(/;$/, '') + ');')();
  const N = '<b class="clog" data-cid="c1">Lisa Noble</b>', strip = s => String(s).replace(/<[^>]*>/g, '');
  const line = strip(BLEED_LINE.reduce(N, 2));
  ok(line === 'Lisa Noble reduces the bleed by 2.', 'BLEED_LINE.reduce builds the frozen shape: "' + line + '"');
  const m = line.match(L12.reduceBy || /$^/);
  ok(!!m && m[1] === 'Lisa Noble' && m[2] === '2' && !m[3], 'bot L12.reduceBy parses the LIVE client line (name, amount, no card)');
  ok(!(line.match(L12.reduce || /$^/)), 'and the bot\'s OWN reduce shape (em-dash, now M) does not match it -- one reduction, counted once');
  const { Bot } = require('./elysium-bot.js');
  const u = new Bot({ server: 'ws://127.0.0.1:1', room: 'x', pass: 'x', name: 'Bot', persona: 'expert', deckName: 'malkavian', paceMs: 0, askSecs: 1, log: () => {} });
  u.seat = 2; u.started = true; u.send = () => {}; u.push = () => {};
  u.players = [{ seat: 1, name: 'Johan' }, { seat: 2, name: 'Bot', bot: true }];
  u._actingVamp = { name: 'Sully', n: 2, target: 1, kind: 'bleed' };
  u._onLog('Johan', BLEED_LINE.reduce(N, 1)); ok(u._actingVamp.n === 1, 'a live bot bleeding Johan for 2 hears his Reduce line: 2 -> 1');
  u._onLog('Johan', BLEED_LINE.reduce(N, 5)); ok(u._actingVamp.n === 0, '...and never below 0');
  u._actingVamp = { name: 'Sully', n: 2, target: 1, kind: 'bleed' }; u._onLog('Anna', BLEED_LINE.reduce(N, 1)); ok(u._actingVamp.n === 2, 'a line from a seat it is NOT bleeding changes nothing');
}
ok(sec12.includes('reduces the bleed by N.'), 'PROTOCOL \u00a712 documents the client\'s Reduce line');
['(bot) is in DEBUG mode', '(bot) leaves DEBUG mode'].forEach(tag => ok(sec12.includes(tag), 'PROTOCOL \u00a712 documents the bot-emitted "' + tag + '" line (the bots read it from each other since v0.6.201)'));
ok(!!(L12.debugOn && 'Ann (bot) is in DEBUG mode: open hand for the humans (the bots look away), crypt face up.'.match(L12.debugOn)), 'bot L12.debugOn parses the documented announcement');
ok(!!(L12.debugOff && 'Ann (bot) leaves DEBUG mode: the table is in Tournament mode now.'.match(L12.debugOff)), 'bot L12.debugOff parses the documented exit');

/* ---- 6) v2.6.171 (bot v0.6.215-216 consumed): the bot-emitted lines the bot project asked main to record -- the docs-diet
   handoff (20 Oct: the block bar, the referendum terms, leaving torpor, Haven Uncovered, Spying Mission) and v0.6.213-215
   (no additional strike, no strike this round, Archon Investigation, a location's intercept lock). For each: PROTOCOL
   section 12 documents the shape, the bot's own parser reads a line built from it, and where the line changes a live bot's
   state at once, a live bot's _onLog is fed the line and the effect is asserted (the handoffs' own suggestions). The
   actor's stealth lines are documented but not pinned: the bot project keeps their reader (NET_STEALTH) outside its
   frozen grammar. Em-dashes and the minus sign are written as escapes (mojibake discipline, section 3). */
{
  [['vampires cannot block this action.', 'the block bar (bot v0.6.127)'],
   ['Referendum terms — CARD: NAME −3', 'the referendum terms (bot v0.6.122)'],
   ['Referendum passes — CARD: TERMS.', 'the referendum result'],
   ['Referendum fails — CARD: blocked.', 'the blocked referendum'],
   ['VAMP attempts to leave torpor.', 'leaving torpor (bot v0.6.128)'],
   ['plays Haven Uncovered — on NAME\'s VAMP.', 'Haven Uncovered placed (bot v0.6.205)'],
   ['enters combat with NAME\'s VAMP (Haven Uncovered).', 'the rush through Haven Uncovered'],
   ['plays Spying Mission [OBF] — the bleed is unsuccessful and burns no pool.', 'Spying Mission\'s cancel (bot v0.6.211)'],
   ['does not take an additional strike.', 'the fourth "nothing" line (bot v0.6.213)'],
   ['gets no strike this round (committed to CARD by its maneuver; REASON).', 'no strike this round (bot v0.6.214)'],
   ['plays Archon Investigation — VAMP is burned (the bleed of N is not successful).', 'Archon Investigation (bot v0.6.215)'],
   ['VAMP locks CARD: +N intercept.', 'a location\'s intercept lock (bot v0.6.215)']
  ].forEach(([tag, what]) => ok(sec12.includes(tag), 'PROTOCOL §12 documents ' + what + ': "' + tag + '"'));

  [['blockBar', 'Day Operation — vampires cannot block this action.'],
   ['refTerms', 'Referendum terms — Kine Resources Contested: Johan −3, Bot −1.'],
   ['refResult', 'Referendum fails — Kine Resources Contested: blocked.'],
   ['uLeave', 'Sully attempts to leave torpor.'],
   ['havenM', 'Ann plays Haven Uncovered — on Johan\'s Lisa Noble.'],
   ['havenRush', 'Gilbert enters combat with Johan\'s Lisa Noble (Haven Uncovered).'],
   ['spyNull', 'Gilbert plays Spying Mission [OBF] — the bleed is unsuccessful and burns no pool.'],
   ['attempt', 'Gilbert attempts to block.'],
   ['interceptPlay', 'Gilbert plays Eagle\'s Sight: +1 intercept.'],
   ['attemptIcp', 'Gilbert attempts to block with +1 intercept (Second Tradition).']
  ].forEach(([k, line]) => ok(!!(L12[k] && line.match(L12[k])), 'bot L12.' + k + ' parses a line built from the documented shape: "' + line + '"'));

  const { Bot } = require('./elysium-bot.js');
  const B = s => '<b>' + s + '</b>';
  const mk6 = extra => { const u = new Bot({ server: 'ws://127.0.0.1:1', room: 'x', pass: 'x', name: 'Bot', persona: 'expert', deckName: 'malkavian', paceMs: 0, askSecs: 1, log: () => {} });
    u.seat = 2; u.started = true; u.send = () => {}; u.push = () => {};
    u.players = [{ seat: 1, name: 'Johan' }, { seat: 2, name: 'Bot', bot: true }, { seat: 3, name: 'Ann', bot: true }];
    return Object.assign(u, extra || {}); };
  const inCombat = () => { const me = { id: 'm1', name: 'Sully', kind: 'crypt', zone: 'ready', blood: 4, cap: 4 };
    return { _inCombat: true, _combatOppName: 'Gilbert', _combatMyVamp: me, board: [me], _rnd: {} }; };
  let u;

  u = mk6(); u._onLog('Ann', B('Day Operation') + ' — vampires cannot block this action.');
  ok(!!(u._blockBar && u._blockBar.card === 'Day Operation' && u._blockBar.bar === 'vampires' && u._blockBar.who === 'Ann'), 'a live bot hears another seat\'s block bar: Day Operation, vampires');

  u = mk6(); u._onLog('Ann', 'Referendum terms — ' + B('Kine Resources Contested') + ': Johan −3, Bot −1.');
  ok(!!(u._refT && u._refT.deltas && u._refT.deltas[2] === -1 && u._refT.deltas[1] === -3), 'a live bot reads its own stake from the terms line (Bot −1, Johan −3)');

  u = mk6({ pending: { who: 'Ann', amount: 3, actingVampName: 'Gilbert' } });
  u._onLog('Ann', B('Gilbert') + ' plays ' + B('Spying Mission') + ' [OBF] — the bleed is unsuccessful and burns no pool.');
  ok(u.pending.amount === 0 && u.pending.nullified === true, 'a live bot being bled for 3 hears Spying Mission\'s cancel: 3 -> 0, nullified');

  u = mk6(); u._onLog('Ann', B('Ann') + ' plays ' + B('Haven Uncovered') + ' — on ' + B('Johan') + '\'s ' + B('Lisa Noble') + '.');
  ok(!!(u._havenSeen && u._havenSeen['Lisa Noble'] && u._havenSeen['Lisa Noble'].owner === 'Johan'), 'a live bot records the host of Haven Uncovered (Johan\'s Lisa Noble)');

  u = mk6(inCombat()); u._onLog('Ann', 'Ann combat — Gilbert does not take an additional strike.');
  { const e = u.ev && u.ev.last('extra-strike'); ok(!!(e && e.none === true && e.vamp === 'Gilbert'), 'a live bot in combat types "does not take an additional strike." as an extra-strike event with none: true'); }

  u = mk6(inCombat()); u._onLog('Ann', B('Gilbert') + ' gets no strike this round (committed to ' + B('Ivory Bow') + ' by its maneuver; Immortal Grapple).');
  { const s = u._oppStrike; ok(!!(s && s.dealt === 0 && !s.dodge && !s.ends && s.vamp === 'Gilbert'), 'a live bot in combat takes "gets no strike this round" as the opponent\'s strike: dealt 0, no dodge, no combat ends'); }

  u = mk6(); u._onLog('Ann', B('Gilbert') + ' plays ' + B('Dummy Card') + '.');
  ok(!!(u._obs && u._obs.who === 'Ann'), 'control: an ordinary play line from Ann enters the bot\'s action memory');
  u = mk6(); u._actingVamp = { v: { name: 'Sully' }, n: 4, played: new Set(), target: 3 };
  u._onLog('Ann', B('Ann') + ' plays ' + B('Archon Investigation') + ' — ' + B('Sully') + ' is burned (the bleed of 4 is not successful).');
  ok(!!(u._actingVamp.archoned && u._actingVamp.archoned.by === 'Ann' && u._actingVamp.archoned.n === 4), 'a live bot bleeding with Sully hears Archon Investigation: archoned { by: Ann, n: 4 }');
  ok(!(u._obs && u._obs.who === 'Ann'), '...and the line is not taken as an action of Ann\'s (the action memory stays empty)');

  u = mk6(); const icp0 = u._opp(3).icpSum | 0;
  u._onLog('Ann', B('Gilbert') + ' locks ' + B('Channel 10') + ': +1 intercept.');
  { const e = u.ev && u.ev.last('intercept'); ok(!!(e && e.lock === true && e.n === 1 && e.card === 'Channel 10'), 'a live bot types the location\'s lock as an intercept event (lock: true, +1, Channel 10)'); }
  ok((u._opp(3).icpSum | 0) === icp0 + 1, 'and adds the +1 to that seat\'s intercept in its model of the opponent');
}

/* ---- 7) v2.6.174 (bot v0.6.217-218 consumed): bot v0.6.217's lines, V5 wave 4 (bot/docs/handoffs/HANDOFF-to-main-
   2026-11-03-v0_6_217.md section 2) -- Change of Target (the bot's line and a human's play line), the polling-step abstain
   in both shapes, an action that burns a card in play, the rush line's two new granting cards, and the shapes the wave
   reuses (the Grand Ball's block bar, a combat ended before range, a title referendum's terms). Change of Target and the
   abstain are module constants of the bot's grammar, not in L12: their readers are the bot's own classifier (the event a
   live bot's _onLog records) and the live state change. The apostrophes are load-bearing and pinned both ways: the
   abstain line keeps the card names' straight ' (a U+2019 spelling is not read), the owner's burn line and the
   before-range combat end carry U+2019. Em-dashes and U+2019 are written as escapes (section 3's discipline). */
{
  [['plays Change of Target — unlocks; the action ends unsuccessfully.', 'Change of Target, the bot\'s line (bot v0.6.217)'],
   ['VAMP plays Change of Target.', 'Change of Target, a human\'s play line'],
   ['plays Scalpel Tongue [LVL] — NAME\'s VAMP is locked[, burns 1 blood] and abstains (N votes cancelled).', 'the abstain, Scalpel Tongue'],
   ['locks: Saulot\'s Guiding Wisdom — NAME\'s VAMP abstains (N votes cancelled).', 'the abstain, Saulot\'s Guiding Wisdom'],
   ['takes an action to burn NAME\'s CARD.', 'an action that burns a card in play'],
   ['burns CARD (VAMP’s action).', 'the owner\'s burn line (U+2019)'],
   ['enters combat with NAME\'s VAMP (Saulot\'s Avenging Fist).', 'the rush granted by Saulot\'s Avenging Fist'],
   ['(Regent).', 'the rush granted by a Regent'],
   ['Toreador Grand Ball — minions cannot block this action.', 'the Grand Ball\'s block bar'],
   ['Combat ends — Saulot’s Guiding Wisdom.', 'a combat ended before range (U+2019)'],
   ['Referendum terms — Toreador Justicar: VAMP takes the title (Justicar, 3 votes).', 'a title referendum\'s terms']
  ].forEach(([tag, what]) => ok(sec12.includes(tag), 'PROTOCOL §12 documents ' + what + ': "' + tag + '"'));

  { const m = 'Gilbert takes an action to burn Bot\'s Toreador Grand Ball.'.match(L12.burnAct || /$^/);
    ok(!!m && m[1] === 'Gilbert' && m[2] === 'Bot' && m[3] === 'Toreador Grand Ball', 'bot L12.burnAct reads the actor, the owner and the card'); }
  [['Saulot\'s Avenging Fist', 'Saulot\'s Avenging Fist'], ['Regent', 'Regent'], ['Haven Uncovered', 'Haven Uncovered']].forEach(([card, want]) => {
    const m = ('Gilbert enters combat with Bot\'s Sully (' + card + ').').match(L12.havenRush || /$^/);
    ok(!!m && m[4] === want && m[3] === 'Sully' && m[2] === 'Bot', 'bot L12.havenRush reads the granting card: (' + card + ')');
  });
  { const m = 'Toreador Grand Ball — minions cannot block this action.'.match(L12.blockBar || /$^/);
    ok(!!m && m[1] === 'Toreador Grand Ball' && m[2] === 'minions', 'bot L12.blockBar reads the Grand Ball\'s bar (minions)'); }
  { const m = 'Combat ends — Saulot’s Guiding Wisdom.'.match(L12.combatEnds || /$^/);
    ok(!!m && m[1] === 'Saulot’s Guiding Wisdom', 'bot L12.combatEnds reads a combat ended before range'); }
  ok(CLIENT.includes("cardRefCap(a)+' plays '+cardRef(c)+_mt+'.'"), 'client source still names the selected vampire (the anchor) in its card-play line (the fragment a human\'s Change of Target rides on)');

  const { Bot, sayIdx } = require('./elysium-bot.js');
  const B = s => '<b>' + s + '</b>', CL = (id, s) => '<b class="clog" data-cid="' + id + '">' + s + '</b>';
  const strip = s => String(s).replace(/<[^>]*>/g, '');
  const mk7 = () => { const sent = []; const u = new Bot({ server: 'ws://127.0.0.1:1', room: 'x', pass: 'x', name: 'Bot', persona: 'expert', deckName: 'malkavian', paceMs: 0, askSecs: 1, log: () => {} });
    u.seat = 2; u.started = true; u.send = m => sent.push(m); u.push = () => {};
    u.players = [{ seat: 1, name: 'Johan' }, { seat: 2, name: 'Bot', bot: true }, { seat: 3, name: 'Ann', bot: true }];
    u._sent = sent; return u; };
  const vamp = (id, name, locked) => ({ id, name, kind: 'crypt', zone: 'ready', blood: 4, cap: 4, locked: !!locked });
  const saidPass = u => u._sent.some(m => m && m.t === 'say' && m.i === sayIdx('Pass'));
  let u, me;

  /* Change of Target */
  u = mk7(); u._myBlockOf = { vamp: 'Gilbert', at: Date.now() };
  u._onLog('Ann', B('Gilbert') + ' plays ' + B('Change of Target') + ' — unlocks; the action ends unsuccessfully.');
  ok(!!(u._cotCancel && u._cotCancel.vamp === 'Gilbert'), 'a live bot that blocked Gilbert hears his Change of Target: the combat it began is cancelled');
  { const e = u.ev && u.ev.last('cot'); ok(!!(e && e.vamp === 'Gilbert'), 'and its classifier types the line as a cot event (Gilbert)'); }
  me = vamp('m1', 'Sully', true); u.board = [me]; u._combatOppName = 'Gilbert';
  ok(typeof u._cotHit === 'function' && u._cotHit(me) === true && me.locked === false, 'at its first combat step the blocker learns the combat never began, and unlocks');
  u = mk7(); u._myBlockOf = { vamp: 'Lisa Noble', at: Date.now() };
  u._onLog('Johan', CL('c1', 'Lisa Noble') + ' plays ' + CL('c9', 'Change of Target') + '.');
  ok(!!(u._cotCancel && u._cotCancel.vamp === 'Lisa Noble'), 'a human\'s plain play line (the client\'s markup) is read the same way');
  u = mk7(); u._myBlockOf = { vamp: 'Lisa Noble', at: Date.now() };
  u._onLog('Johan', CL('c1', 'Lisa Noble') + ' plays ' + CL('c9', 'Change of Target') + '. Target: ' + B('Bot') + '\'s ' + B('Sully') + '.');
  ok(!!(u._cotCancel && u._cotCancel.vamp === 'Lisa Noble'), '...and with the client\'s Target suffix');
  u = mk7(); u._myBlockOf = { vamp: 'Gilbert', at: Date.now() };
  u._onLog('Ann', B('Rafael') + ' plays ' + B('Change of Target') + ' — unlocks; the action ends unsuccessfully.');
  ok(!u._cotCancel, 'control: a Change of Target by a vampire this bot did not block cancels nothing');

  /* the polling-step abstain */
  u = mk7(); me = vamp('m1', 'Sully'); u.board = [me];
  u._onLog('Ann', B('Gilbert') + ' plays ' + B('Scalpel Tongue') + ' [CEL] — Bot\'s ' + B('Sully') + ' is locked, burns 1 blood and abstains (2 votes cancelled).');
  ok(me.locked === true && me.blood === 3, 'a live bot whose Sully is named in Scalpel Tongue [CEL]\'s abstain locks him and burns 1 blood (4 -> 3)');
  { const e = u.ev && u.ev.last('abstain'); ok(!!(e && e.owner === 'Bot' && e.vamp === 'Sully' && e.card === 'Scalpel Tongue' && e.n === 2 && e.burn === 1), 'and types it as an abstain event (Bot\'s Sully, Scalpel Tongue, 2 votes, burn 1)'); }
  u = mk7(); me = vamp('m1', 'Sully'); u.board = [me];
  u._onLog('Ann', B('Gilbert') + ' plays ' + B('Scalpel Tongue') + ' [pre] — Bot\'s ' + B('Sully') + ' is locked and abstains (1 vote cancelled).');
  ok(me.locked === true && me.blood === 4, 'Scalpel Tongue [pre] (inferior, 1 vote): locked, no blood burned');
  u = mk7(); me = vamp('m1', 'Sully'); u.board = [me];
  u._onLog('Ann', B('Rafael') + ' locks: ' + B('Saulot\'s Guiding Wisdom') + ' — Bot\'s ' + B('Sully') + ' abstains (3 votes cancelled).');
  { const e = u.ev && u.ev.last('abstain'); ok(!!(e && e.card === 'Saulot\'s Guiding Wisdom' && e.n === 3 && e.burn === 0) && me.locked === false && me.blood === 4, 'Saulot\'s Guiding Wisdom\'s abstain is read (3 votes) and neither locks nor burns the voter\'s vampire'); }
  u = mk7(); me = vamp('m1', 'Sully'); u.board = [me];
  u._onLog('Ann', B('Rafael') + ' locks: ' + B('Saulot’s Guiding Wisdom') + ' — Bot\'s ' + B('Sully') + ' abstains (3 votes cancelled).');
  ok(!(u.ev && u.ev.last('abstain')), 'the straight apostrophe is load-bearing: Saulot’s Guiding Wisdom spelled with U+2019 is not read as an abstain');
  u = mk7(); me = vamp('m1', 'Sully'); u.board = [me];
  u._onLog('Ann', B('Gilbert') + ' plays ' + B('Scalpel Tongue') + ' [CEL] — Johan\'s ' + B('Sully') + ' is locked, burns 1 blood and abstains (2 votes cancelled).');
  ok(me.locked === false && me.blood === 4, 'control: the abstain of another Methuselah\'s Sully leaves this bot\'s Sully alone');

  /* an action that burns a card in play */
  const ball = () => ({ id: 'm7', name: 'Toreador Grand Ball', kind: 'lib', zone: 'ready', faceDown: false, locked: false, blood: 0 });
  u = mk7(); let gb = ball(); u.board = [vamp('m1', 'Sully', true), gb];
  u._onLog('Ann', B('Gilbert') + ' takes an action to burn ' + B('Bot') + '\'s ' + B('Toreador Grand Ball') + '.');
  ok(gb.zone === 'ash' && saidPass(u), 'a live bot with no minion to block says Pass and burns its Toreador Grand Ball');
  ok(u._sent.some(m => m && m.t === 'log' && strip(m.html) === 'Bot burns Toreador Grand Ball (Gilbert’s action).'), 'and writes the owner\'s line as documented: "Bot burns Toreador Grand Ball (Gilbert’s action)."');
  { const e = u.ev && u.ev.last('burn-card'); ok(!!(e && e.vamp === 'Gilbert' && e.owner === 'Bot' && e.card === 'Toreador Grand Ball'), 'its classifier types the action as a burn-card event'); }
  u = mk7(); gb = ball(); u.board = [vamp('m1', 'Sully'), gb];
  u._onLog('Ann', B('Gilbert') + ' takes an action to burn ' + B('Bot') + '\'s ' + B('Toreador Grand Ball') + '.');
  { const p = u.pending; ok(gb.zone === 'ready' && !!(p && p.sub === 'burnCard' && p.burnCard === 'Toreador Grand Ball' && p.actingVampName === 'Gilbert'), 'with an unlocked minion it opens its block window on the action instead (the card stays in play)'); }

  /* the rush line's new granting cards: Haven's terms */
  [['Saulot\'s Avenging Fist', 'grant'], ['Regent', 'grant'], ['Haven Uncovered', 'haven']].forEach(([card, via]) => {
    u = mk7(); u.board = [vamp('m1', 'Sully'), vamp('m2', 'Ozmo')];
    u._onLog('Ann', B('Gilbert') + ' enters combat with ' + B('Bot') + '\'s ' + B('Sully') + ' (' + card + ').');
    const p = u.pending;
    ok(!!(p && p.kind === 'rush' && p.via === via && p.card === card && p.noLock === true && p.targetActs === false && p.rushTarget === 'Sully'), 'a live bot rushed through ' + card + ' opens a block window on Haven\'s terms (via ' + via + ', the host does not lock, the rusher acts)');
  });
  u = mk7(); me = vamp('m1', 'Sully'); u.board = [me];
  u._onLog('Ann', B('Gilbert') + ' enters combat with ' + B('Bot') + '\'s ' + B('Sully') + ' (Saulot\'s Avenging Fist).');
  ok(saidPass(u) && me.locked === false, 'with nobody else to block it says Pass and its Sully fights unlocked');

  /* the reused shapes */
  u = mk7(); u._onLog('Ann', B('Toreador Grand Ball') + ' — minions cannot block this action.');
  ok(!!(u._blockBar && u._blockBar.card === 'Toreador Grand Ball' && u._blockBar.bar === 'minions' && u._blockBar.who === 'Ann'), 'a live bot hears the Grand Ball\'s bar: minions cannot block the action that follows');
  u = mk7(); u._inCombat = true; u._combatOppName = 'Gilbert'; u._rnd = {}; let woke = null; u._maneuverWaiter = r => { woke = r; };
  u._onLog('Ann', 'Combat ends — ' + B('Saulot’s Guiding Wisdom') + '.');
  ok(!!(woke && woke.ended === true) && u._oppEndedCombat === true, 'a live bot waiting for the acting minion\'s first line is woken by a combat ended before range');
  u = mk7(); u._onLog('Ann', 'Referendum terms — ' + B('Toreador Justicar') + ': Gilbert takes the title (Justicar, 3 votes).');
  ok(!!(u._refT && u._refT.card === 'Toreador Justicar') && (u._refT.deltas[2] | 0) === 0, 'a live bot reads a title referendum\'s terms with a stake of 0');
}

/* ---- 8) v2.6.175 (bot v0.6.219-229 consumed): bot v0.6.219-228's lines (bot/docs/handoffs/HANDOFF-to-main-2026-11-12 ..
   -11-14-*.md). A HUMAN's Toreador Grand Ball is read from the client's own card-play line and its Target suffix (the pair),
   from which of the two turns locked once the master phase ends, and -- when the bots still cannot tell -- from the owner's
   free-text answer to one bot's question in chat; the reader is the bot's memo (its `bot:memo` event), not L12. Smiling Jack
   rides the frozen burnAct line with a comma in the card's name; Eyes of the Wild rides attemptIcp; the crypt dodge is the
   client's own strikeD line. And the client's aim rule of v2.6.175: the bots' prey test takes a bleed with no target or a
   pool target. Whether it takes one with a CARD in the suffix is the bot project's reading to choose (v1.4.0: reported, not
   checked). Em-dashes and U+2019 are escapes (section 3). */
{
  [['VAMP plays Toreador Grand Ball. Target: X.', 'a human\'s Toreador Grand Ball, the client\'s play line the bots read'],
   ['NAME, your Toreador Grand Ball: which Toreador acts unblocked — A or B?', 'the Grand Ball question to its owner (its shape)'],
   ['takes an action to burn NAME\'s Smiling Jack, The Anarch.', 'Smiling Jack\'s burn (the comma in its name)'],
   ['NAME: your Smiling Jack, The Anarch is burned.', 'the chat line to a human owner'],
   ['VAMP plays Perfect Paragon (allies and younger vampires get −1 intercept): +1 stealth.', 'Perfect Paragon\'s stealth line'],
   ['VAMP: Perfect Paragon does not reach BLOCKER (−1 stealth).', 'Perfect Paragon\'s adjustment (no reach)'],
   ['VAMP: Perfect Paragon reaches BLOCKER (+1 stealth).', 'Perfect Paragon\'s adjustment (reach)'],
   ['VAMP plays Eyes of the Wild: unlocks.', 'Eyes of the Wild\'s unlock'],
   ['VAMP attempts to block with +1 intercept (Eyes of the Wild).', 'Eyes of the Wild\'s attempt'],
   ['VAMP locks again: it did not block this action (Eyes of the Wild).', 'Eyes of the Wild\'s relock note'],
   ['NAME strikes: dodge — no damage either way this round.', 'the crypt dodge (the client\'s own line)'],
   ['NAME discards CARD at random to strike: dodge.', 'Phaibun\'s discard (no reader)'],
   ['The bleed has no target: NAME was ousted in its window.', 'an action at an ousted seat fizzles (no reader)'],
   ['The referendum’s part for NAME does nothing: ousted in its window.', 'a referendum part for an ousted seat (no reader)'],
   ['an aim rides only the action it was used in', 'the client\'s aim rule (v2.6.175)'],
   ['the pool aim is the only suffix a bleed carries', 'a bleed\'s one suffix (v2.6.175)']
  ].forEach(([tag, what]) => ok(sec12.includes(tag), 'PROTOCOL §12 documents ' + what + ': "' + tag + '"'));

  { const m = 'Gilbert takes an action to burn Bot\'s Smiling Jack, The Anarch.'.match(L12.burnAct || /$^/);
    ok(!!m && m[1] === 'Gilbert' && m[2] === 'Bot' && m[3] === 'Smiling Jack, The Anarch', 'bot L12.burnAct reads a card whose name carries a comma'); }
  { const m = 'Rudi attempts to block with +1 intercept (Eyes of the Wild).'.match(L12.attemptIcp || /$^/);
    ok(!!m && m[1] === 'Rudi' && m[2] === '1' && m[3] === 'Eyes of the Wild', 'bot L12.attemptIcp reads Eyes of the Wild\'s attempt'); }
  ok(!!L12.strikeD && L12.strikeD.test('Flávio Gonçalves strikes: dodge — no damage either way this round.'), 'bot L12.strikeD reads the crypt dodge');
  ok(CLIENT.includes("log(cardRefCap(c)+' bleeds for '+n+'.'+bleedTargetSuffix());") && CLIENT.includes("log(cardRefCap(c)+' adds +'+x+' bleed (= '+t+').'+bleedTargetSuffix());"), 'client source: the bleed and +X bleed lines carry the pool-only suffix (bleedTargetSuffix)');
  ok(CLIENT.includes("if(state.targetUsed){ state.targetUsed=false; if(state.target || net.rtarget) clearAnyTarget(true); }"), 'client source: a used aim clears when its action resolves (resolvePlayedActions)');

  const { Bot } = require('./elysium-bot.js');
  const B = s => '<b>' + s + '</b>', CL = (id, s) => '<b class="clog" data-cid="' + id + '">' + s + '</b>';
  const mk8 = () => { const sent = []; const u = new Bot({ server: 'ws://127.0.0.1:1', room: 'x', pass: 'x', name: 'Bot', persona: 'expert', deckName: 'malkavian', paceMs: 0, askSecs: 1, log: () => {} });
    u.seat = 2; u.started = true; u.send = m => sent.push(m); u.push = () => {}; u.chat = t => sent.push({ t: 'chat', text: t });
    u.players = [{ seat: 1, name: 'Johan' }, { seat: 2, name: 'Bot', bot: true }, { seat: 3, name: 'Ann', bot: true }];
    u._sent = sent; u._evs = []; u.onEvent = (t, d) => u._evs.push([t, d]); return u; };
  const tor = (id, name, locked) => ({ id, name, kind: 'crypt', zone: 'ready', blood: 4, faceDown: false, locked: !!locked, counters: [] });
  const gbCard = { id: 'c3', name: 'Toreador Grand Ball', kind: 'lib', zone: 'ready', faceDown: false };
  const memoOf = u => u._evs.filter(x => x[0] === 'bot:memo').map(x => x[1]);
  const ballTable = (suffix, lockFirst) => { const u = mk8(); u.table = { 1: { pub: { cards: [tor('c1', 'Catalina Vega'), tor('c2', 'Flávio Gonçalves')] } } };
    u._onLog('Johan', CL('c1', 'Catalina Vega') + ' plays ' + CL('c3', 'Toreador Grand Ball') + '.' + (suffix ? ' Target: ' + CL('c2', 'Flávio Gonçalves') + '.' : ''));
    u.table[1].pub.cards = [tor('c1', 'Catalina Vega', lockFirst), tor('c2', 'Flávio Gonçalves'), gbCard];
    u._onLog('Johan', 'Phase: ' + B('Minion') + '.'); if (typeof u._hMemoBoard === 'function') u._hMemoBoard(1); return u; };   // guarded: an older bot (no human memo before v0.6.225) gives red lines, not a crash
  let u = ballTable(true, true), mm = memoOf(u)[0];
  ok(!!mm && mm.card === 'Toreador Grand Ball' && mm.lock === 'Catalina Vega' && mm.free === 'Flávio Gonçalves' && mm.via === 'pair', 'a live bot reads a human\'s Ball from the client\'s play line and its Target (the pair) and the lock on their board: Flávio acts unblocked (' + JSON.stringify(mm) + ')');
  u = ballTable(false, true); mm = memoOf(u)[0];
  ok(!!mm && mm.free === 'Flávio Gonçalves' && mm.via === 'only', 'without the Target it reads the human\'s only other ready Toreador');
  u = ballTable(true, false); mm = memoOf(u)[0];
  const asked = u._sent.find(m => m && m.t === 'chat');
  ok(!!mm && mm.free === null && !!asked && asked.text === 'Johan, your Toreador Grand Ball: which Toreador acts unblocked — Catalina Vega or Flávio Gonçalves?', 'with no lock to read, the bot that speaks for the table asks in the documented shape: ' + JSON.stringify(asked && asked.text));
  u._onChat('Johan', 'Flavio'); mm = memoOf(u).slice(-1)[0];
  ok(!!mm && mm.free === 'Flávio Gonçalves' && mm.via === 'answer', 'and the owner\'s free-text answer (one name, accents aside) becomes its memory');

  u = mk8(); u._onLog('Johan', CL('c1', 'Lisa') + ' bleeds for 1.');
  ok(!!(u.pending && u.pending.amount === 1 && u.pending.who === 'Johan'), 'the prey test: a human\'s bleed with no target reaches its prey bot');
  u = mk8(); u._onLog('Johan', CL('c1', 'Lisa') + ' bleeds for 1. Target: ' + B('Bot') + '\'s ' + B('pool') + '.');
  ok(!!(u.pending && u.pending.amount === 1), '...and with a pool aim at it');
  /* v1.4.0 (client v2.6.176, bot v0.6.230's ask): a CARD in the suffix was a control here ("the prey bot does not take the
     bleed"). A cached v2.6.174 page still writes such a line, and the bot project wants to read it as the prey's bleed; built,
     that reading failed this file (170/1). It is the bot's reading to choose, so the line below reports it and checks nothing.
     main pins the new reading as a positive when it consumes the release that takes it. */
  u = mk8(); u._onLog('Johan', CL('c1', 'Lisa') + ' bleeds for 1. Target: ' + B('Bot') + '\'s ' + B('Sully') + '.');
  console.log('  \u25cb the prey test with a CARD in the suffix (a client older than v2.6.175): this bot ' + (u.pending && u.pending.amount === 1 ? 'takes the bleed as its prey\'s' : 'reads it as aimed at nobody') + ' -- reported, not checked');
}

/* ---- 9) v2.6.176 (bot v0.6.230-234 consumed): the lines of V5 waves 5a, 5b, 6a and 6b (bot/docs/handoffs/HANDOFF-to-main-
   2026-11-17-v0_6_230.md, -11-18-v0_6_232.md, -v0_6_233.md and -v0_6_234.md, section 3 of each). All twenty are in the bot's
   L12: section 12 documents the shape, and L12.<key> reads a line built from it with the captures its reader keys on. Five
   are also driven through a live bot's _onLog, where the line changes that bot's state at once: Privileged Position (the prey
   pays), Tension in the Ranks and a referendum that burns a card in play (the owner's card goes), a hostage freed (U+2019
   twice), and another bot's cancel of a HUMAN's master (this bot holds its own Sudden Reversal). Positives only: a check that
   pins what a bot does NOT read stops the bot project from widening that reading (section 8's control, v1.4.0). Last, what the
   bots' fx readers rest on at a hotseat since v2.6.176: the bridge relays a human's card clone. */
{
  [['VAMP takes an action to steal NAME\'s CARD.', 'a steal'],
   ['NAME locks Privileged Position — PREY burns 1 pool.', 'Privileged Position'],
   ['Referendum passes automatically — CARD (Día de los Muertos).', 'a referendum without a poll'],
   ['NAME discards two masters to burn OWNER\'s Tension in the Ranks.', 'Tension in the Ranks'],
   ['VAMP enters combat with NAME\'s VAMP (Frontal Assault).', 'the rush granted by Frontal Assault'],
   ['PAYER burns 2 blood: VAMP’s hostage counter is burned (Carver’s Meat Packing and Storage).', 'a hostage freed (U+2019)'],
   ['Referendum terms — CARD: burn OWNER\'s CARD.', 'a referendum to burn a card in play, its terms'],
   ['Referendum passes — CARD: burn OWNER\'s CARD.', 'a referendum to burn a card in play, its result'],
   ['NAME is playing CARD.', 'the \'as played\' line'],
   ['NAME is playing CARD — on OWNER\'s VAMP.', 'the \'as played\' line with its target'],
   ['NAME plays Sudden Reversal — cancels OWNER\'s CARD (its cost is not paid).', 'Sudden Reversal\'s cancel'],
   ['NAME\'s Sudden Reversal comes too late for OWNER\'s CARD.', 'a Sudden Reversal that came too late'],
   ['NAME locks Meditative Grove — CARD is cancelled (its cost is still paid).', 'Meditative Grove\'s cancel'],
   ['VAMP\'s political action succeeds — the referendum follows.', 'the success line before a referendum'],
   ['NAME locks Yawp Court — VAMP enters combat with OWNER\'s VAMP.', 'Yawp Court\'s combat'],
   ['Yawp Court — VAMP is still ready: the referendum goes on.', 'Yawp Court, the referendum goes on'],
   ['NAME moves a nightmare counter to OWNER\'s VAMP (Week of Nightmares: N left).', 'Week of Nightmares, a counter moved'],
   ['Week of Nightmares has no counters left — each Ravnos burns 1 blood for each nightmare counter on it, or is burned.', 'Week of Nightmares, the end'],
   ['VAMP plays CARD: unlocks; if they block, neither combatant strikes in the first round.', 'One With the Land\'s unlock line'],
   ['VAMP gets no strike this round (One With the Land).', 'One With the Land\'s round without strikes'],
   ['VAMP plays CARD: ACTOR\'s stealth is 0.', 'Night Terrors'],
   ['NAME burns N pool to cancel CARD.', 'a cancel bought with pool'],
   ['VAMP plays CARD: vampires not on the Path of PATH get -1 vote.', 'Absolute Tyranny (an ASCII hyphen-minus)'],
   ['NAME combat — VAMP presses to continue (Mob Connections).', 'Mob Connections\' press (a reused shape)'],
   ['Combat ends — Garibaldi-Meucci Museum.', 'Garibaldi-Meucci Museum\'s combat end (a reused shape)'],
   ['VAMP plays Forced Confessional (the blocking minion gets −1 intercept): +1 stealth.', 'Forced Confessional\'s stealth line (listed, not pinned)'],
   ['VAMP puts Shadow Cloak on itself — minions without Auspex cannot perform actions directed at it until NAME\'s next unlock phase.', 'Shadow Cloak\'s line for the humans (no reader)'],
   ['NAME burns Shadow Cloak from VAMP (unlock phase).', 'Shadow Cloak burned (no reader)'],
   ['a card target on a bleed line may be read as no target', 'the reading a bot may take of a cached client\'s bleed (v2.6.176)'],
   ['the bridge relays a human\'s card clone', 'the hotseat bridge\'s fx relay (v2.6.176, section 12.2)'],
   ['A human\'s cards are read from the play clone, not from a line', 'where the bots read a human\'s master, Sudden Reversal and frenzy card']
  ].forEach(([tag, what]) => ok(sec12.includes(tag), 'PROTOCOL §12 documents ' + what + ': "' + tag + '"'));

  const rd = (key, line, want, what) => { const m = line.match(L12[key] || /$^/);
    ok(!!m && want.every((w, i) => m[i + 1] === w), 'bot L12.' + key + ' reads ' + what + (m ? ' (' + JSON.stringify(m.slice(1)) + ')' : ' -- no match: "' + line + '"')); };
  rd('stealAct', 'Gilbert takes an action to steal Bot\'s The Rack.', ['Gilbert', 'Bot', 'The Rack'], 'the thief, the owner and the card');
  rd('ppBurn', 'Ann locks Privileged Position — Bot burns 1 pool.', ['Ann', 'Bot'], 'the card\'s Methuselah and the prey who pays');
  rd('autoPass', 'Referendum passes automatically — Anarch Revolt (Día de los Muertos).', ['Anarch Revolt'], 'the referendum that needed no poll');
  rd('tensionBurn', 'Ann discards two masters to burn Bot\'s Tension in the Ranks.', ['Ann', 'Bot'], 'who burns whose Tension in the Ranks');
  rd('havenRush', 'Gilbert enters combat with Bot\'s Sully (Frontal Assault).', ['Gilbert', 'Bot', 'Sully', 'Frontal Assault'], 'the rush granted by Frontal Assault');
  rd('hostageFree', 'Ann burns 2 blood: Sully’s hostage counter is burned (Carver’s Meat Packing and Storage).', ['Ann', 'Sully'], 'the payer and the vampire whose hostage counter burned (U+2019)');
  rd('refTerms', 'Referendum terms — Anarch Revolt: burn Bot\'s Anarch Revolt.', ['Anarch Revolt', 'burn Bot\'s Anarch Revolt'], 'a burn referendum\'s terms (no pool term)');
  rd('refResult', 'Referendum passes — Anarch Revolt: burn Bot\'s Anarch Revolt.', ['passes', 'Anarch Revolt', 'burn Bot\'s Anarch Revolt'], 'the same terms on the result line');
  rd('asPlayed', 'Ann is playing Blood Doll.', ['Ann', 'Blood Doll', undefined, undefined], 'a master as it is played');
  rd('asPlayed', 'Ann is playing Fame — on Bot\'s Sully.', ['Ann', 'Fame', 'Bot', 'Sully'], 'a master as it is played on a vampire');
  rd('srCancel', 'Ann plays Sudden Reversal — cancels Bot\'s Blood Doll (its cost is not paid).', ['Ann', 'Bot', 'Blood Doll'], 'the canceller, the owner and the master');
  rd('srLate', 'Ann\'s Sudden Reversal comes too late for Bot\'s Blood Doll.', ['Ann', 'Bot', 'Blood Doll'], 'whose cancel came too late, and for which master');
  rd('groveCancel', 'Ann locks Meditative Grove — Deep Song is cancelled (its cost is still paid).', ['Ann', 'Deep Song'], 'the Grove\'s Methuselah and the cancelled card');
  rd('polSuccess', 'Gilbert\'s political action succeeds — the referendum follows.', ['Gilbert'], 'the acting vampire of a successful political action');
  rd('yawp', 'Ann locks Yawp Court — Lisa enters combat with Bot\'s Gilbert.', ['Ann', 'Lisa', 'Bot', 'Gilbert'], 'the Court\'s owner, its Sabbat vampire and the acting vampire');
  rd('yawpOn', 'Yawp Court — Gilbert is still ready: the referendum goes on.', ['Gilbert'], 'the acting vampire that stayed ready');
  rd('wonMove', 'Ann moves a nightmare counter to Bot\'s Sully (Week of Nightmares: 3 left).', ['Ann', 'Bot', 'Sully', '3'], 'the counter\'s new vampire and how many are left');
  ok(!!L12.wonEnd && L12.wonEnd.test('Week of Nightmares has no counters left — each Ravnos burns 1 blood for each nightmare counter on it, or is burned.'), 'bot L12.wonEnd reads the end of Week of Nightmares');
  rd('noStrikeR1', 'Lisa plays One With the Land: unlocks; if they block, neither combatant strikes in the first round.', ['Lisa', 'One With the Land'], 'the unlocking blocker and its card');
  rd('stealthZero', 'Lisa plays Night Terrors: Gilbert\'s stealth is 0.', ['Lisa', 'Night Terrors', 'Gilbert'], 'the blocker, the card and the acting vampire');
  rd('payCancel', 'Ann burns 1 pool to cancel True Love\'s Face.', ['Ann', '1', 'True Love\'s Face'], 'who pays how much to cancel which card');
  rd('tyranny', 'Lisa plays Absolute Tyranny: vampires not on the Path of Power and the Inner Voice get -1 vote.', ['Lisa', 'Absolute Tyranny', 'Power and the Inner Voice'], 'the voter, the card and the Path');
  rd('combatEnds', 'Combat ends — Garibaldi-Meucci Museum.', ['Garibaldi-Meucci Museum'], 'Garibaldi-Meucci Museum\'s combat end');

  const { Bot } = require('./elysium-bot.js');
  const B = s => '<b>' + s + '</b>', strip = s => String(s).replace(/<[^>]*>/g, '');
  const mk9 = () => { const sent = []; const u = new Bot({ server: 'ws://127.0.0.1:1', room: 'x', pass: 'x', name: 'Bot', persona: 'expert', deckName: 'malkavian', paceMs: 0, askSecs: 1, log: () => {} });
    u.seat = 2; u.started = true; u.send = m => sent.push(m); u.push = () => {}; u.chat = t => sent.push({ t: 'chat', text: t });
    u.players = [{ seat: 1, name: 'Johan' }, { seat: 2, name: 'Bot', bot: true }, { seat: 3, name: 'Ann', bot: true }];
    u._sent = sent; return u; };
  const inPlay = (id, name) => ({ id, name, kind: 'lib', zone: 'ready', faceDown: false, locked: false });
  let u = mk9(); u.pool = 10; u._onLog('Ann', B('Ann') + ' locks ' + B('Privileged Position') + ' — ' + B('Bot') + ' burns 1 pool.');
  ok(u.pool === 9, 'a live bot named as the prey pays Privileged Position\'s pool (pool ' + u.pool + ')');
  u = mk9(); u.board = [inPlay('t1', 'Tension in the Ranks')]; u._onLog('Ann', B('Ann') + ' discards two masters to burn ' + B('Bot') + '\'s ' + B('Tension in the Ranks') + '.');
  ok(u.board[0] && u.board[0].zone === 'ash', 'a live bot burns its Tension in the Ranks on the line that names it as the owner');
  u = mk9(); u.board = [inPlay('r1', 'Anarch Revolt')]; u._onLog('Ann', 'Referendum passes — ' + B('Anarch Revolt') + ': burn ' + B('Bot') + '\'s ' + B('Anarch Revolt') + '.');
  ok(u.board[0] && u.board[0].zone === 'ash' && u._sent.some(m => m && m.t === 'log' && strip(m.html) === 'Bot burns Anarch Revolt (the referendum passed).'), 'a live bot burns its card on a burn referendum\'s pass line and says so at the table');
  u = mk9(); u._w5Hostages = new Map([['h1', { seat: 3, name: 'Sully' }], ['h2', { seat: 3, name: 'Lisa' }]]);
  u._onLog('Ann', B('Ann') + ' burns 2 blood: ' + B('Sully') + '’s hostage counter is burned (Carver’s Meat Packing and Storage).');
  ok(u._w5Hostages.size === 1 && u._w5Hostages.has('h2'), 'a live bot drops that hostage of the sending seat from its count, and only that one');
  u = mk9(); u._onLog('Ann', B('Ann') + ' plays ' + B('Sudden Reversal') + ' — cancels ' + B('Johan') + '\'s ' + B('Fame') + ' (its cost is not paid).');
  ok(!!(u._srSeenHuman && u._srSeenHuman.owner === 'Johan' && u._srSeenHuman.card === 'Fame'), 'a live bot that hears another bot cancel a HUMAN\'s master notes it (it holds its own Sudden Reversal)');

  ok(CLIENT.includes('  fxIn(who, seatNo, m){') && CLIENT.includes('if(inRoom()) mpSend(fxm); else hotFxSend(fxm);'), 'client source: at a hotseat a human\'s card clone goes to the bot seats through the bridge (fxIn) -- what the bots\' fx readers rest on there (v2.6.176)');
  ok(CLIENT.includes('function rtTargetInfo(rt){') && !CLIENT.includes("kind:'lib', faceDown: !!net.rtarget.faceDown"), 'client source: a cross-board aim carries the aimed card\'s own kind into the clone (v2.6.176; a vampire was \'lib\')');
}

/* ---- 10) v2.6.177: two things the bots' readers rest on. The hotseat bridge delivers after the sender's code has returned,
   as the server does (section 12.2): a bot's line can no longer be answered before that bot has opened the window it asks in
   (the bot project's L-92 and its BOARD line "A window can open after its line was delivered"). And a card dragged from the
   hand to the table writes the menu's play line, its level and its aim included (section 12), so a reader of a human's play
   line -- the Toreador Grand Ball's pair, a card aimed at a bot's vampire -- reads a dragged card as it reads one played from
   the menu. Positives only. */
{
  ok(sec12.includes('the bridge delivers after the sender\'s code has returned, as the server does') && sec12.includes('a microtask') && sec12.includes('one hop at a time'), 'section 12.2 documents the queued bridge (v2.6.177): after the send returns, a microtask, one hop at a time');
  ok(sec12.includes('since v2.6.177, a drag') && sec12.includes('`VAMP plays CARD.` / `CARD was played.`'), 'section 12 documents the card-play line and that a drag writes it (v2.6.177)');
  ok(CLIENT.includes('this._q.push({ seat, r, txt: JSON.stringify(msg) }); this._arm(); },') && CLIENT.includes('else Promise.resolve().then(() => B.drain());'), 'client source: the bridge queues a message at the send and delivers it in a drain after the sender\'s code (v2.6.177)');
  const dc = CLIENT.slice(CLIENT.indexOf('async function dropCard(c,d){'), CLIENT.indexOf('function groupDrop(c,d){')), pf = CLIENT.slice(CLIENT.indexOf('async function playFromHand(c,faceDown){'), CLIENT.indexOf('async function playOnActive(c,faceDown){'));
  ok(dc.includes('log(playLineHtml(c, a));') && dc.includes('await modeChooseGate(c, false)') && pf.includes('log(playLineHtml(c, a));'), 'client source: a drag and the menu\'s Play write one play line, the level asked on both (v2.6.177)');
}

console.log('\n' + passN + '/' + failN + (failN ? ' \u2014 FAIL' : ' \u2014 all green'));
process.exit(failN ? 1 : 0);
