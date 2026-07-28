#!/usr/bin/env node
'use strict';
/* ============================================================
   Elysium — client pure-logic test suite (Phase 0)
   Loads the REAL client functions via the shared harness and
   exercises them, so these tests guard the upcoming refactor.
   No DOM, no network, no rendering is asserted.

   Run:  node test-client-logic.js [path/to/elysium-vtes-bord.html]
   (the DOM stub + loader live in elysium-test-harness.js)
   ============================================================ */
const path = require('path');
const { loadClient } = require('./elysium-test-harness');

const CLIENT = process.argv[2] || path.resolve(__dirname, 'elysium-vtes-bord.html');
let API;
try { API = loadClient(CLIENT); }
catch (e) { console.error('FATAL: could not load the client under the harness:\n' + (e.stack || e.message)); process.exit(2); }

/* ---------- tiny test framework ---------- */
let pass = 0, fail = 0; const failed = [];
function test(name, fn){ try { fn(); pass++; console.log('  \u2713 ' + name); }
  catch (e){ fail++; failed.push(name); console.log('  \u2717 ' + name + '\n       ' + (e.message || e)); } }
function assert(c, msg){ if (!c) throw new Error(msg || 'assertion failed'); }
function eq(a, b, msg){ if (a !== b) throw new Error((msg || 'not equal') + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')'); }
function approx(a, b, eps){ if (Math.abs(a - b) > (eps || 1e-9)) throw new Error('not approx (got ' + a + ', want ' + b + ')'); }

/* helper: build a small known board */
function buildBoard(){
  API.clearTable({});
  const s = API.state;
  s.pool = 17; s.edge = false; s.phase = -1; s.deckName = 'Test Deck';
  const v = API.makeCard('Test Vampire', 'crypt'); API.move(v, 'ready', { x: 120, y: 60, faceDown: false }); v.locked = true; v.blood = 2;
  const act = API.makeCard('Test Action', 'lib'); API.move(act, 'hand', {});
  const unc = API.makeCard('Hidden One', 'crypt'); API.move(unc, 'uncontrolled', { x: 30, y: 20, faceDown: true });
  return { v, act, unc };
}

console.log('\nElysium - client logic tests\n');

/* === 1. pubXform / pubInv are exact inverses (the L3 coordinate contract) === */
test('pubXform/pubInv round-trip to identity under a transformed l2pub', () => {
  const L = API.l2pub;
  L.on = true; L.s = 2.35; L.ox = 150; L.oy = 80; L.bx = 12; L.by = 12;
  for (const [x, y] of [[0,0],[12,12],[500,300],[-40,1004],[1003.5, 615.25]]) {
    const f = API.pubXform(x, y);
    const b = API.pubInv(f.x, f.y);
    approx(b.x, x, 1e-6); approx(b.y, y, 1e-6);
  }
});
test('pubXform is a passthrough when l2pub.on is false', () => {
  const L = API.l2pub; L.on = false;
  const f = API.pubXform(123, 456); eq(f.x, 123); eq(f.y, 456);
  const b = API.pubInv(123, 456);   eq(b.x, 123); eq(b.y, 456);
});

/* === 2. serializeGame -> restoreGame is a faithful round-trip (save = wire format) === */
test('serialize -> restore -> serialize is idempotent (excluding the timestamp)', () => {
  buildBoard();
  const blob1 = API.serializeGame();
  const ok = API.restoreGame(blob1, { silent: true });
  assert(ok !== false, 'restoreGame rejected a blob it had just produced');
  const blob2 = API.serializeGame();
  const a = JSON.parse(blob1), b = JSON.parse(blob2);
  delete a.t; delete b.t;                              // t is Date.now() - volatile by design
  eq(JSON.stringify(a), JSON.stringify(b), 'round-trip changed the board');
});
test('restore preserves pool, zones and per-card fields', () => {
  buildBoard();
  const blob = API.serializeGame();
  API.restoreGame(blob, { silent: true });
  const s = API.state;
  eq(s.pool, 17, 'pool not preserved');
  eq(s.zones.ready.length, 1, 'ready count'); eq(s.zones.hand.length, 1, 'hand count'); eq(s.zones.uncontrolled.length, 1, 'uncontrolled count');
  const v = s.cards.get(s.zones.ready[0]);
  eq(v.name, 'Test Vampire', 'card name'); eq(v.locked, true, 'locked'); eq(v.blood, 2, 'blood');
  eq(s.cards.get(s.zones.uncontrolled[0]).faceDown, true, 'face-down preserved');
});

/* === restore keepLog: a hotseat swap shares the turn-history; a fresh load adopts the blob's === */
test('restoreGame keepLog keeps the SHARED turn-history (hotseat); a normal load adopts the blob history', () => {
  buildBoard();
  API.state.turnLogs = [{ turn: 1, lines: ['seat-1 turn-1 line'] }];                 // a shared table history exists
  const seatBlob = JSON.parse(API.serializeGame()); seatBlob.turnLogs = [];           // another seat's blob carries an EMPTY history
  const otherSeatJson = JSON.stringify(seatBlob);
  API.restoreGame(otherSeatJson, { keepLog: true, silent: true });                    // hotseat swap must NOT clobber the shared history
  eq(API.state.turnLogs.length, 1, 'keepLog must keep the shared turn-history across a seat swap');
  API.restoreGame(otherSeatJson, { silent: true });                                   // a fresh (non-hotseat) load adopts the blob's history
  eq(API.state.turnLogs.length, 0, 'without keepLog the blob history loads');
});

/* === 3. buildPub never leaks the hand; exposes the public board (the secrecy contract) === */
test('buildPub omits the hand, includes public zones, reports the hand COUNT only', () => {
  buildBoard();
  const pub = API.buildPub();
  assert(Array.isArray(pub.cards), 'pub.cards missing');
  assert(pub.cards.every(c => c.zone !== 'hand'), 'a HAND card leaked into pub.cards');
  assert(pub.cards.every(c => c.zone !== 'library' && c.zone !== 'crypt'), 'a hidden pile leaked into pub.cards');
  assert(pub.cards.some(c => c.zone === 'ready' && c.name === 'Test Vampire'), 'ready card missing from pub');
  eq(pub.counts.hand, 1, 'hand count'); eq(pub.pool, 17, 'pool'); eq(pub.bw, 1004, 'canonical width'); eq(pub.bh, 616, 'canonical height');
});

/* === 4. restoreGame is defensive (validates before mutating) === */
test('restoreGame rejects garbage without throwing', () => {
  eq(API.restoreGame('{}', { silent: true }), false, 'empty object should be rejected');
  eq(API.restoreGame('not json', { silent: true }), false, 'non-JSON should be rejected');
  eq(API.restoreGame('{"cards":[],"zones":{}}', { silent: true }) !== false, true, 'a minimal valid shell should load');
});

/* === 5. baseView contract (v1.99.27: always Normal/L2) === */
test('baseView() returns the L2 home view', () => { eq(API.baseView(), 'l2'); });

/* === 6. debug ring buffer captures a tagged trace and dumps it === */
test('dbg() records a capped trace that elysiumDbg() returns', () => {
  if (!API.dbg || !API.elysiumDbg) throw new Error('dbg infrastructure missing (unpatched client?)');
  const log = console.log, warn = console.warn; console.log = console.warn = () => {};   // silence the dump
  let before, buf;
  try {
    before = API.elysiumDbg().length;
    API.dbg('unit-test', new Error('boom-42'));
    buf = API.elysiumDbg();
  } finally { console.log = log; console.warn = warn; }
  eq(buf.length, before + 1, 'ring buffer should grow by exactly one');
  const last = buf[buf.length - 1];
  eq(last.tag, 'unit-test', 'tag not recorded');
  assert(/boom-42/.test(last.msg), 'message not captured: ' + last.msg);
});

/* === 7. mpOnMsg dispatch table is complete (the Phase 1 handler-map) === */
test('MP_HANDLERS is a complete table of function handlers, one per message type', () => {
  if (!API.MP_HANDLERS) throw new Error('MP_HANDLERS not exposed (unpatched client?)');
  const keys = Object.keys(API.MP_HANDLERS);
  eq(keys.length, 47, 'expected 47 message handlers');   // 46 -> 47 at v2.6.16: +tally (shared Block/Vote/Combat resolver counters)
  assert(keys.every(k => typeof API.MP_HANDLERS[k] === 'function'), 'every handler must be a function');
  for (const t of ['joined','board','roster','edgePass','edgeTake','tool','fx','turn','recalled','ctrl','tally']) assert(keys.includes(t), 'missing handler: ' + t);
});

/* === 8. mpOnMsg routes by type and is defensive about unknown / malformed input === */
test('mpOnMsg routes a known type to its handler (muted, bounty)', () => {
  if (!API.mpOnMsg) throw new Error('mpOnMsg not exposed');
  API.net.muted = false;
  API.mpOnMsg(JSON.stringify({ t: 'muted', on: true }));
  eq(API.net.muted, true, "'muted' did not route to net.muted");
  API.state.pool = 10;
  API.mpOnMsg(JSON.stringify({ t: 'bounty', from: 'Prey' }));
  eq(API.state.pool, 16, "'bounty' did not add +6 pool");
});
test('mpOnMsg ignores unknown / malformed input without throwing (else-less chain)', () => {
  API.net.muted = false; API.state.pool = 7;
  API.mpOnMsg(JSON.stringify({ t: '__no_such_verb__' }));   // unknown -> no-op
  eq(API.net.muted, false, 'unknown type changed net.muted'); eq(API.state.pool, 7, 'unknown type changed pool');
  API.mpOnMsg('not json');                                  // parse failure -> swallowed, no throw
});

/* ============================================================
   state-contract depth (Phase 2 step 3) — the net the relocation
   pass needs: the single-zone invariant, attachment fidelity,
   id/position survival, and buildPub purity. These pin behaviours a
   function-reordering could silently break.
   ============================================================ */

/* === move keeps a card in exactly one zone (the membership invariant) === */
test('move removes a card from its old zone and adds it to the new one (single-zone invariant)', () => {
  API.clearTable({});
  const c = API.makeCard('Mover', 'crypt'); API.move(c, 'ready', { x: 10, y: 10 });
  eq(API.state.zones.ready.includes(c.id), true, 'not in ready after move'); eq(c.zone, 'ready', 'card.zone not set');
  API.move(c, 'torpor', {});
  eq(API.state.zones.ready.includes(c.id), false, 'still in ready after moving out');
  eq(API.state.zones.torpor.includes(c.id), true, 'not in torpor after move'); eq(c.zone, 'torpor', 'card.zone not torpor');
  const hits = Object.keys(API.state.zones).filter(z => API.state.zones[z].includes(c.id));
  eq(hits.length, 1, 'card present in multiple zones: ' + hits.join(','));
});

/* === an attachment (host.attached + child.host) survives serialize -> restore === */
test('attachments round-trip through serialize/restore', () => {
  if (!API.attach) throw new Error('attach not exposed (harness needs updating)');
  API.clearTable({});
  const host = API.makeCard('Host Vampire', 'crypt'); API.move(host, 'ready', { x: 50, y: 50 });
  const kid  = API.makeCard('Equipment', 'lib');      API.move(kid, 'ready', { x: 60, y: 60 });
  API.attach(kid, host);
  eq(host.attached.includes(kid.id), true, 'attach did not record the child on the host');
  eq(kid.host, host.id, 'attach did not back-reference the host on the child');
  API.restoreGame(API.serializeGame(), { silent: true });
  const rHost = API.state.cards.get(host.id), rKid = API.state.cards.get(kid.id);
  assert(rHost && rKid, 'a card was lost in the round-trip');
  eq(rHost.attached.includes(kid.id), true, 'host.attached lost in round-trip');
  eq(rKid.host, host.id, 'child.host lost in round-trip');
});

/* === card ids and x/y positions survive serialize -> restore === */
test('card ids and x/y positions survive the round-trip', () => {
  API.clearTable({});
  const c = API.makeCard('Placed', 'crypt'); API.move(c, 'ready', { x: 123, y: 77 });
  const id = c.id;
  API.restoreGame(API.serializeGame(), { silent: true });
  const r = API.state.cards.get(id);
  assert(r, 'card id ' + id + ' did not survive restore');
  eq(r.x, 123, 'x not preserved'); eq(r.y, 77, 'y not preserved');
});

/* === buildPub is pure: stable across calls and never mutates state === */
test('buildPub is stable across calls and does not mutate the board', () => {
  buildBoard();
  const zonesBefore = JSON.stringify(Object.keys(API.state.zones).map(z => API.state.zones[z].length));
  const a = JSON.stringify(API.buildPub());
  const b = JSON.stringify(API.buildPub());
  eq(a, b, 'buildPub produced different output on a second call (not pure)');
  const zonesAfter = JSON.stringify(Object.keys(API.state.zones).map(z => API.state.zones[z].length));
  eq(zonesAfter, zonesBefore, 'buildPub mutated the zones');
});

/* === KRCG v3/v5 dual-format card-data parser (v2.5.87) ===
   Self-contained fixtures trimmed from two REAL v4 API responses (GET /card/Bonding,
   GET /card/Gratiano, 4 July 2026) — not dependent on the uploaded originals, which
   won't persist. Exercises processCardData()/buildPrecons() against a v5 library
   card, a v5 crypt card (with a disambiguating suffix), and a legacy v3 card, all
   loaded together, so the format-detection branch and the v3 regression path are
   both proven in the same pass. */
if (!API.processCardData) throw new Error('processCardData not exposed (harness needs updating)');

const V5_LIB = {
  id: 100236, printed_name: 'Bonding', suffix: '', kind: 'Library',
  name_variants: [ { type: 'Lexicographical', name: 'Bonding' } ],
  prints: [
    { set: { id: 300006, code: 'SW' }, occurrences: [ { type: 'Precon', bundle: 'PL', copies: 1, date: null } ] },
    { set: { id: 300033, code: 'V5' }, occurrences: [
        { type: 'Precon', bundle: 'PM', copies: 4, date: null },
        { type: 'Precon', bundle: 'PTr', copies: 6, date: null } ] }
  ],
  types: ['Action Modifier'], text: 'Only usable during a bleed action.\n[dom] +1 bleed (limited).',
  cost: null, clan_requirement: [], path_requirement: [],
  discipline_requirement: { type: 'Mono', disciplines: ['dom'] }
};
const V5_CRYPT = {
  id: 200534, printed_name: 'Gratiano', suffix: 'G2', kind: 'Crypt',
  name_variants: [ { type: 'Lexicographical', name: 'Gratiano' }, { type: 'Lexicographical', name: 'Gratiano (G2)' } ],
  prints: [ { set: { id: 300006, code: 'SW' }, occurrences: [
      { type: 'Rarity', frequency: 'U', copies: 0, date: null },
      { type: 'Precon', bundle: 'PL', copies: 1, date: null } ] } ],
  types: ['Vampire'], text: 'Sabbat priscus: Gratiano gets +1 ballot. +1 bleed.',
  clan: 'Lasombra', path: '', capacity: 8, disciplines: ['obf', 'pot', 'DOM', 'OBT']
};
const V3_CARD = {
  id: 999001, name: 'Test Elder', _name: 'Test Elder', printed_name: 'Test Elder',
  types: ['Vampire'], card_text: 'Sabbat elder. +1 bleed.',
  capacity: 9, disciplines: ['obf', 'oblivion', 'DOM'], clans: ['Lasombra'],
  sets: { 'Fifth Edition': [ { precon: 'Lasombra', copies: 4, release_date: '2015-01-01' } ],
          'Jyhad': [ { rarity: 'Rare', release_date: '1994-08-16' } ] }
};
API.processCardData([V5_LIB, V5_CRYPT, V3_CARD], 'test-fixture');

test('v5 library card (Bonding): text/types/discipline_requirement mapped, no clan requirement, capacity null, cost degrades to blank', () => {
  const b = API.cardInfo.get(API.norm('Bonding'));
  assert(b, 'Bonding not found in cardInfo');
  eq(b.text, 'Only usable during a bleed action.\n[dom] +1 bleed (limited).', 'text');
  eq(b.types, 'Action Modifier', 'types');
  eq(b.disc, 'dom', 'discipline_requirement.disciplines not folded into disc');
  eq(b.clansArr.length, 0, 'clan_requirement:[] should give an empty clansArr');
  eq(b.cap, null, 'library card must not get a capacity');
  eq(b.pool, '', 'cost:null must not fabricate a pool cost'); eq(b.blood, '', 'cost:null must not fabricate a blood cost');
});

test('v5 crypt card (Gratiano): clan/capacity/disciplines/path mapped, sect derived by regex, found by BOTH bare and suffixed name_variant', () => {
  const g = API.cardInfo.get(API.norm('Gratiano'));
  const g2 = API.cardInfo.get(API.norm('Gratiano (G2)'));
  assert(g, 'Gratiano not found by bare printed_name'); assert(g2, 'Gratiano (G2) not found by its own name_variant');
  eq(g.clansArr.length, 1, 'clan should give a single-entry clansArr'); eq(g.clansArr[0], 'Lasombra', 'clan value');
  eq(g.cap, 8, 'capacity');
  eq(g.disc, 'obf pot DOM OBT', 'disciplines join, incl. superior trigrams');
  eq(g.path, null, 'empty-string path must normalize to null, same as v3\'s falsy case');
  eq(g.sect, 'Sabbat', 'sect must be derived from text (v5 has no sect field at all)');
});

test('v3 legacy card still parses unchanged (regression guard against the v5 branch)', () => {
  const t = API.cardInfo.get(API.norm('Test Elder'));
  assert(t, 'v3 card not found'); eq(t.text, 'Sabbat elder. +1 bleed.', 'card_text');
  eq(t.disc, 'obf oblivion DOM', 'v3 dual trigram/fullname discipline join');
  eq(t.clansArr.length, 1, 'v3 clans array'); eq(t.clansArr[0], 'Lasombra', 'v3 clan value');
});

test('image name registration: v5 suffix baked into the key (matches the real print filename), v3 uses .name, both present after one load', () => {
  assert(API.cardImageNames.has('gratianog2'), 'Gratiano (G2) image key should be "gratianog2" (matches static.krcg.org/card/set/.../gratianog2.jpg)');
  assert(API.cardImageNames.has('bonding'), 'Bonding image key should be plain "bonding"');
  assert(API.cardImageNames.has('testelder'), 'v3 Test Elder image key should come from .name');
});

test('buildPrecons: v5 prints[] and v3 sets{} both build correct precon entries + v5/legacy catalog split, in the same load', () => {
  const swpl = API.precons.get('SW :: PL');
  assert(swpl, 'v5 precon "SW :: PL" not built from Gratiano\'s Sabbat-War/PL occurrence');
  eq(swpl.crypt.get('Gratiano (G2)'), 1, 'SW::PL crypt count for Gratiano (G2)');
  assert(API.catalog.legacy.some(e => e.name === 'Gratiano (G2)'), 'SW is not a v5-era code -> should classify legacy');
  const v5pm = API.precons.get('V5 :: PM');
  assert(v5pm, 'v5 precon "V5 :: PM" not built from Bonding\'s Fifth-Edition/PM occurrence');
  eq(v5pm.library.get('Bonding'), 4, 'V5::PM library count for Bonding');
  assert(API.catalog.v5.some(e => e.name === 'Bonding'), 'V5 code should classify v5-era');
  const v3prec = API.precons.get('Fifth Edition :: Lasombra');
  assert(v3prec, 'v3 legacy precon path (card.sets) must still build');
  eq(v3prec.crypt.get('Test Elder'), 4, 'v3 Fifth Edition :: Lasombra crypt count');
  assert(API.catalog.v5.some(e => e.name === 'Test Elder'), 'v3 "Fifth Edition" set name should still classify v5-era via isV5Set()');
});

/* === parseDeck: 'NxName' with no space, and headerless plain-list imports (v2.5.89) ===
   Real-world trigger: a tournament software export (KRCG's 'text/jol' style) writes crypt then a
   blank line then library, no 'Crypt'/'Library' labels at all, and no space between the count and
   the 'x' ("3xAmavi"). Both were silently broken before this version -- see elysium-learnings.md
   for the exact before/after. */
if (!API.parseDeck) throw new Error('parseDeck not exposed (harness needs updating)');

test('parseDeck: "NxName" with no space after the x parses the count and name correctly', () => {
  const p = API.parseDeck('Crypt:\n3xAmavi\n1xDolie\nLibrary:\n6xAshur Tablets');
  eq(p.crypt.length, 2, 'crypt entries'); eq(p.crypt[0].name, 'Amavi', 'no stray leading x'); eq(p.crypt[0].qty, 3, 'qty');
  eq(p.library[0].name, 'Ashur Tablets', 'library name'); eq(p.library[0].qty, 6, 'qty');
});

test('parseDeck: a headerless plain list (crypt block, blank line, library block) is split positionally when no card database is loaded', () => {
  const p = API.parseDeck('3xAmavi\n1xDolie\n\n6xAshur Tablets\n3xVessel');
  eq(p.crypt.length, 2, 'crypt count'); assert(p.crypt.some(e => e.name === 'Amavi'), 'Amavi should land in crypt (before the gap)');
  eq(p.library.length, 2, 'library count'); assert(p.library.some(e => e.name === 'Ashur Tablets'), 'Ashur Tablets should land in library (after the gap)');
});

test('parseDeck: with a loaded card database, classification is by CARD TYPE, not position (even across a misleading gap)', () => {
  // deliberately put a library card BEFORE the blank line and a crypt card AFTER it -- position alone would get this backwards
  API.processCardData([
    { id: 1, name: 'Ashur Tablets', types: ['Master'], card_text: '' },
    { id: 2, name: 'Amavi', types: ['Vampire'], card_text: '', capacity: 8, disciplines: ['abo','ani','for'], clans: ['Akunanse'] }
  ], 'test-fixture-parsedeck');
  const p = API.parseDeck('1xAshur Tablets\n\n1xAmavi');
  eq(p.library.length, 1, 'Ashur Tablets classified by type, not by being first'); eq(p.library[0].name, 'Ashur Tablets');
  eq(p.crypt.length, 1, 'Amavi classified by type, not by being after the gap'); eq(p.crypt[0].name, 'Amavi');
});

test('parseDeck: Text/TWD headers still parse with no space before the parenthesis and dash underlines (tournament export variant)', () => {
  const p = API.parseDeck('Deck Name: fakir matador\n\nCrypt(7 cards, min=15, max=35, avg=6.14)\n-----------------------------------------\n3x Amavi            8  ABO ANI FOR pre pro              Akunanse:4\n\nLibrary (90 cards)\nMaster (1; 0 trifle)\n6x Ashur Tablets');
  eq(p.name, 'fakir matador', 'deck name'); eq(p.crypt.length, 1, 'crypt entry'); eq(p.crypt[0].name, 'Amavi', 'capacity/discipline/clan columns stripped');
  eq(p.library.length, 1, 'library entry'); eq(p.library[0].name, 'Ashur Tablets', 'category sub-header (Master) does not get parsed as a card');
});

test('parseDeck: Lackey format (library first with no header, then a bare "Crypt:" line, tab-separated) still parses correctly', () => {
  const p = API.parseDeck('6\tAshur Tablets\n3\tVessel\nCrypt:\n3\tAmavi\n1\tDolie');
  eq(p.library.length, 2, 'library entries before the Crypt: marker'); eq(p.library[0].name, 'Ashur Tablets');
  eq(p.crypt.length, 2, 'crypt entries after the Crypt: marker'); eq(p.crypt[0].name, 'Amavi');
});

/* === Tutorial: advanced sections are never auto-chained (v2.5.91) === */
if (!API.tutNextReady) throw new Error('tutNextReady not exposed (harness needs updating)');

test('tutNextReady: finishing the last Classic section no longer auto-suggests the advanced tier', () => {
  eq(API.tutNextReady('classic-interact'), null, 'classic-interact should not chain into structured-intro');
});

test('tutNextReady: the two advanced sections never chain into each other either', () => {
  eq(API.tutNextReady('structured-intro'), null, 'structured-intro should not chain into Structured II (advanced picks are always free)');
  eq(API.tutNextReady('structured-helpers'), null, 'Structured II should not chain into online-join');   // v2.6.25
  eq(API.tutNextReady('online-hosting'), null, 'online-hosting is the last section anyway');
});

test('tutNextReady: the basics chain itself is unaffected (regression guard)', () => {
  assert(API.TUT_ORDER && API.TUT_ORDER.length > 0, 'TUT_ORDER exposed');
  const i = API.TUT_ORDER.indexOf('classic-intro');
  assert(i > 0, 'classic-intro should exist in TUT_ORDER');
  const nx = API.tutNextReady(API.TUT_ORDER[i - 1]);
  eq(nx, 'classic-intro', 'the section right before classic-intro should still chain forward into it');
});

/* === v2.6.51: the pile-park bounce (freeReadySpot) ===
   Exercised against the REAL function, not a reimplementation.
   The scale below was MEASURED, not assumed: a first draft of this fixture guessed that the DOM
   stub reports l4mode and set l2pub.s=2 to cancel L4_CARD_S — the boxes came back at 168x236, i.e.
   the stub's classList.contains() answers false, so l4on() was off and the felt factor was 1. The
   Classic branch is now turned on explicitly instead of being assumed (classic() below), which is
   the whole point: that branch is the one that shipped the bug. */
if (!API.freeReadySpot) throw new Error('freeReadySpot not exposed (harness needs updating)');
if (!API.__stubEl) throw new Error('__stubEl not exposed (harness needs updating)');

const CLS = API.__stubEl.classList._t;
function classic(on){ if (on) CLS.add('l4mode'); else CLS.delete('l4mode'); }   // l4on() reads board.classList.contains('l4mode')
function feltFixture(l4){
  API.clearTable({});
  classic(!!l4);
  const L = API.l2pub; L.on = true; L.ox = 0; L.oy = 0; L.bx = 0; L.by = 0;
  L.s = l4 ? 2 : 1;   // felt scale = l2pub.s * (l4 ? L4_CARD_S(0.5) : 1) — pinned to 1 either way, so every box below is a plain CW x CH and the numbers read by eye
  return L;
}
const FELT = { x:0, y:0, w:1004, h:616 };

test('freeReadySpot: an empty felt returns the requested point untouched — including the LOWER half', () => {
  feltFixture(true);
  const p = API.freeReadySpot(300, 480, API.CW, API.CH, FELT, 2);
  eq(p.x, 300); eq(p.y, 480, 'y=480 is below the old zoneRect(ready) band and must survive');
});

test('freeReadySpot: the requested point is clamped INTO the region, never outside it', () => {
  feltFixture(true);
  const lo = API.freeReadySpot(-500, -500, API.CW, API.CH, FELT, 2);
  eq(lo.x, 2); eq(lo.y, 2);
  const hi = API.freeReadySpot(9000, 9000, API.CW, API.CH, FELT, 2);
  eq(hi.x, FELT.w - API.CW - 2); eq(hi.y, FELT.h - API.CH - 2);
});

test('freeReadySpot: a card dropped on top of another BOUNCES to a free spot beside it', () => {
  feltFixture(true);
  const a = API.makeCard('Sitting Vampire', 'crypt');
  API.move(a, 'ready', { x: 400, y: 300, faceDown: true });
  const p = API.freeReadySpot(400, 300, API.CW, API.CH, FELT, 2);
  assert(p.x !== 400 || p.y !== 300, 'an exact overlap must not be allowed to stand');
  const dx = Math.abs(p.x - 400), dy = Math.abs(p.y - 300);
  assert(dx >= API.CW * 0.55 || dy >= API.CH * 0.55, 'the bounced card must clear the overlap threshold');
  assert(dx <= API.CW * 1.1 && dy <= API.CH * 1.1, 'and it must land in the NEIGHBOURING slot, not across the table');
});

test('freeReadySpot: tight edge-to-edge packing is preserved (Johan\u2019s face-down rows)', () => {
  feltFixture(true);
  const a = API.makeCard('Packed One', 'crypt');
  API.move(a, 'ready', { x: 400, y: 300, faceDown: true });
  const p = API.freeReadySpot(400 + API.CW, 300, API.CW, API.CH, FELT, 2);   // exactly edge to edge
  eq(p.x, 400 + API.CW, 'a card placed flush beside another must not be pushed away');
  eq(p.y, 300);
});

test('freeReadySpot: in Classic, uncontrolled and torpor cards count as occupied felt too', () => {
  feltFixture(true);
  const u = API.makeCard('Waiting One', 'crypt');
  API.move(u, 'uncontrolled', { x: 200, y: 240, faceDown: true });
  // Coordinate asymmetry worth knowing: move() canonicalises opts.x/y for 'ready' (readyToCanon),
  // but stores them RAW for uncontrolled/torpor — they are already canonical there. The bounce
  // compares DISPLAY boxes, so the expected point is the pubXform of the canonical one.
  const d = API.pubXform(200, 240);
  const boxes = API.occupiedFeltBoxes();
  assert(boxes.some(b => Math.abs(b.x - d.x) < 1 && Math.abs(b.y - d.y) < 1),
    'an uncontrolled card sits on the open table in Classic and must be visible to the bounce');
  const p = API.freeReadySpot(d.x, d.y, API.CW, API.CH, FELT, 2);
  assert(p.x !== d.x || p.y !== d.y, 'parking straight onto your own uncontrolled vampire must bounce');
});

test('freeReadySpot: in STRUCTURED only ready is free placement, so uncontrolled is not felt', () => {
  feltFixture(false);           // the other zones have their own boxes there — laid out by layoutZone, not by the player
  const u = API.makeCard('Boxed One', 'crypt');
  API.move(u, 'uncontrolled', { x: 200, y: 240, faceDown: true });
  eq(API.occupiedFeltBoxes().length, 0, 'a Structured uncontrolled card must not block a ready-region park');
});

test('freeReadySpot: a locked card is measured rotated (wider, shorter)', () => {
  feltFixture(true);
  const a = API.makeCard('Locked One', 'crypt');
  API.move(a, 'ready', { x: 400, y: 300, faceDown: false });
  a.locked = true;
  const boxes = API.occupiedFeltBoxes();
  const b = boxes.find(q => Math.abs(q.x - 400) < 1);
  assert(b, 'the locked card is on the felt');
  eq(b.w, API.CH, 'a rotated card is CH wide');
  eq(b.h, API.CW, 'and CW tall');
});

/* === v2.6.51: the ROOT CAUSE, driven through the real online park path ===
   revealed() is where an online pile-drag lands. It used to clamp to zoneRect('ready'), which on a
   Classic table is the top 44.5 % band of the felt — so a drop in the lower half was pushed up.
   Under the stub zoneRect() reports all zeros, which makes the old behaviour especially stark: the
   card would have come to rest at y=4. */
test('revealed(): a Classic drop in the LOWER half of the felt stays where it was dropped', () => {
  feltFixture(true);
  API.pendingRevealDrop = { x: 300, y: 470 };
  API.MP_HANDLERS.revealed({ kind: 'crypt', names: ['Dropped Vampire'] });
  const c = [...API.state.cards.values()].find(x => x.name === 'Dropped Vampire');
  assert(c, 'the revealed card was created');
  eq(c.tx, 300, 'x survives the drop');
  eq(c.ty, 470, 'y survives the drop — this is the whole bug: it used to be clamped up to the ready band');
});

test('revealed(): the fan of a multi-card reveal does not stack the cards on each other', () => {
  feltFixture(true);
  API.pendingRevealDrop = null;
  API.MP_HANDLERS.revealed({ kind: 'library', names: ['Fan A', 'Fan B', 'Fan C'] });
  const cs = ['Fan A','Fan B','Fan C'].map(n => [...API.state.cards.values()].find(x => x.name === n));
  assert(cs.every(Boolean), 'all three cards were created');
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++)
    assert(Math.abs(cs[i].tx - cs[j].tx) >= API.CW * 0.55 || Math.abs(cs[i].ty - cs[j].ty) >= API.CH * 0.55,
      'fanned cards ' + i + ' and ' + j + ' are stacked on top of each other');
});

/* === v2.6.51: the three create-time Helpers modes === */
if (!API.helperPolicyFor) throw new Error('helperPolicyFor not exposed (harness needs updating)');

test('helperPolicyFor: the three modes map onto the policy triple hx() reads', () => {
  const t = API.helperPolicyFor('tournament');
  eq(t.tournament, true); eq(t.allowLocal, false);
  const a = API.helperPolicyFor('all');
  eq(a.tournament, false); eq(a.allowLocal, false);
  assert(API.HELPER_DEFS.length > 0, 'HELPER_DEFS exposed');
  assert(API.HELPER_DEFS.every(d => a.settings[d.key] === true), 'every registered helper is on in the all-on mode');
  const l = API.helperPolicyFor('local');
  eq(l.tournament, false); eq(l.allowLocal, true);
});

test('helperPolicyFor: an unknown/absent mode falls back to player\u2019s choice, never to a locked table', () => {
  const d = API.helperPolicyFor(undefined);
  eq(d.allowLocal, true); eq(d.tournament, false);
});

test('hx: the hotseat all-on flag never writes into the persisted helper object', () => {
  const H = API.helper, D = API.HELPER_DEFS;
  for (const d of D) H[d.key] = false;          // every helper genuinely off in the player's own settings
  API.net.helperPolicy = null; API.conv.tournament = false;
  eq(API.hx(D[0].key), false, 'baseline: the player\u2019s own setting is off');
  API.setHelperAllOn(true);
  eq(API.hx(D[0].key), true, 'the hotseat mode reports every helper on');
  assert(D.every(d => H[d.key] === false), 'the PERSISTED helper object must be untouched -- saveHelper() would write it to localStorage');
  API.setHelperAllOn(false);
  eq(API.hx(D[0].key), false, 'clearing the flag returns the player to their own settings');
});

test('hx: tournament still wins over the all-on flag', () => {
  const D = API.HELPER_DEFS;
  API.net.helperPolicy = null; API.conv.tournament = true; API.setHelperAllOn(true);
  eq(API.hx(D[0].key), false, 'tournament mode must beat all-on, whichever order they are set in');
  API.conv.tournament = false; API.setHelperAllOn(false);
});

/* === v2.6.52: the tutorial as a gated artifact ===
   Written after a live audit found oh-open pointing at #btnPlay, an id that had not existed
   in the DOM for a long time: the step rendered with no spotlight and nobody noticed, because
   nothing ever checked. The same class as the retired #offTournament references. */
if (!API.TUT_SECTIONS) throw new Error('TUT_SECTIONS not exposed (harness needs updating)');

test('tutorial: every $(\u2019#id\u2019) step target exists in the DOM', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const i = html.indexOf('const TUT_SECTIONS = {'), j = html.indexOf('function tutVis(el)');
  assert(i > 0 && j > i, 'could not locate the TUT_SECTIONS block in the client file');
  const ids = Array.from(new Set((html.slice(i, j).match(/\$\('#[A-Za-z0-9_-]+'\)/g) || [])
    .map(s => s.slice(4, -2))));
  assert(ids.length > 50, 'expected the sweep to find the tutorial targets, found ' + ids.length);
  const dead = ids.filter(id => html.indexOf('id="' + id + '"') < 0 && html.indexOf("id='" + id + "'") < 0);
  eq(dead.length, 0, 'tutorial steps point at ids that no longer exist: ' + dead.join(', '));
});

test('tutorial: every chapter in TUT_ORDER is registered and has steps', () => {
  for (const key of API.TUT_ORDER) {
    const sec = API.TUT_SECTIONS[key];
    assert(sec, 'TUT_ORDER lists "' + key + '" but TUT_SECTIONS has no such chapter');
    assert(sec.name && sec.desc, key + ' is missing its picker name/description');
    assert(sec.steps && sec.steps.length, key + ' has no steps');
    const ids = sec.steps.map(s => s.id);
    eq(new Set(ids).size, ids.length, 'duplicate step ids in ' + key);
  }
  for (const key of Object.keys(API.TUT_SECTIONS)) {
    assert(API.TUT_ORDER.indexOf(key) > -1, 'chapter "' + key + '" exists but the picker never lists it');
  }
});

test('tutorial: the three online chapters are present and independently unlockable', () => {
  for (const key of ['online-join', 'online-hosting', 'online-selfhost']) {
    assert(API.TUT_SECTIONS[key], 'missing chapter ' + key);
    assert(API.TUT_ADVANCED.has(key), key + ' must stay out of the linear basics chain');
  }
});

test('tutorial: the Join chapter shows a GUEST lobby, not the host\u2019s', () => {
  API.tutDemoLobby('guest');
  const players = API.net.lobbyData.players, me = players.find(p => p.name === API.net.you);
  assert(me, 'the demo fixture must contain the viewer');
  eq(me.host, false, 'the guest must not be the host');
  eq(API.net.isHost, false, 'renderLobby must not grant host powers in the guest fixture');
  assert(players.some(p => p.host && p.name !== API.net.you), 'somebody else has to own the room');
  assert(players.filter(p => p.seat >= 1).length >= 2, 'seats already taken, so "greyed out" is visible');
  eq(me.seat, 0, 'the guest still has a seat to claim -- the step tells them to click one');
  eq(me.deck, false, 'and a deck to load, so the status line reads what the step describes');
  API.tutDemoLobbyTeardown();
});

test('tutorial: the Host chapter still shows the host\u2019s own lobby', () => {
  API.tutDemoLobby();
  const me = API.net.lobbyData.players.find(p => p.name === API.net.you);
  eq(me.host, true, 'the host fixture is unchanged');
  eq(API.net.isHost, true, 'the moderation buttons and Start game depend on this');
  API.tutDemoLobbyTeardown();
});

/* === v2.6.54: the address rule the v2.6.53 placeholder got wrong ===
   cleanAddr() decides ws-vs-wss by PORT: a bare host on a non-https page is a direct LAN
   connection and gets :8123, while a TLS front (tunnel, reverse proxy, elysium.cards) answers
   only on 443 and must NOT carry a port. The harness page is http:, i.e. the same branch a
   downloaded file:// client takes -- which is the only context where the placeholder is ever
   read, and where "elysium.cards" without a scheme silently becomes an unreachable address. */
if (!API.cleanAddr) throw new Error('cleanAddr not exposed (harness needs updating)');

test('cleanAddr: a bare host from a non-https page is a DIRECT connection and gets :8123', () => {
  eq(API.cleanAddr('elysium.cards', false), 'elysium.cards:8123',
     'this is exactly why the field must be typed with its scheme from a downloaded client');
  eq(API.cleanAddr('192.168.1.42', false), '192.168.1.42:8123');
  eq(API.cleanAddr('192.168.1.42:8123', false), '192.168.1.42:8123', 'an explicit LAN port is left alone');
});

test('cleanAddr: a TLS target keeps port 443 \u2014 scheme stripped, :8123 never added or kept', () => {
  eq(API.cleanAddr('https://elysium.cards', true), 'elysium.cards');
  eq(API.cleanAddr('wss://elysium.cards', true), 'elysium.cards');
  eq(API.cleanAddr('https://abc-def.trycloudflare.com/', true), 'abc-def.trycloudflare.com', 'path dropped too');
  eq(API.cleanAddr('elysium.cards:8123', true), 'elysium.cards',
     'a stray LAN-style port must be stripped: the edge never exposes 8123');
});

/* ---------- summary ---------- */
console.log('\n' + pass + ' passed, ' + fail + ' failed' + (fail ? '  - ' + failed.join(', ') : ''));
process.exit(fail ? 1 : 0);


