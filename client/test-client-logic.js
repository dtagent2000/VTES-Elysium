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
const asyncTests = []; function testA(name, fn){ asyncTests.push([name, fn]); }   // v2.6.59 (HB2b): async sections queue here and run AFTER the sync battery
const HAVE_BOT = require('fs').existsSync(require('path').join(__dirname, 'elysium-bot.js'));
let skipped = 0;
function testB(name, fn){   // 9 Sep 2026 (the project split): tests that need elysium-bot.js beside the suite. The bot is developed in the Elysium Bots project and consumed here as a RELEASE -- without the file these skip loudly instead of failing; a session that touches hotBridge uploads the released bot to run them.
  if (HAVE_BOT) return testA(name, fn);
  asyncTests.push([name, async () => { const e = new Error('SKIP -- needs elysium-bot.js beside the suite (the bot lives in the Elysium Bots project; upload the released bot to run this)'); e.skip = true; throw e; }]);
}

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
  eq(keys.length, 49, 'expected 49 message handlers');   // 46 -> 47 at v2.6.16: +tally (shared Block/Vote/Combat resolver counters); 47 -> 48 at v2.6.105: +closed; 48 -> 49 at v2.6.139: +botcfg (the table's bot tempo)
  assert(keys.every(k => typeof API.MP_HANDLERS[k] === 'function'), 'every handler must be a function');
  for (const t of ['joined','board','roster','edgePass','edgeTake','tool','fx','turn','recalled','ctrl','tally','botcfg']) assert(keys.includes(t), 'missing handler: ' + t);
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

/* === B-53 import guards + B-54 telemetry (v2.6.55) === */
test('parseDeck counts skipped lines: qty-after format yields 0/0 with every line skipped', () => {
  const p = API.parseDeck('Theo Bell x2\nArika x4\nGovern the Unaligned x4\nConditioning x5\n');
  const t = API.deckTotals(p);
  eq(t.crypt, 0); eq(t.library, 0);
  eq(p.skipped, 4, 'all four content lines rejected by the leading-digit rule');
  eq(p.skippedLines.length, 4);
});

test('parseDeck: a 7-line hand list is the poison shape -- 0 crypt / 7 library, zero skips', () => {
  const p = API.parseDeck('1x Vessel\n1x Magic of the Smith\n1x On the Qui Vive\n1x Taste of Vitae\n1x Deflection\n1x Blood Doll\n1x Conditioning\n');
  const t = API.deckTotals(p);
  eq(t.crypt, 0); eq(t.library, 7); eq(p.skipped, 0);
});

test('deckSanityText flags the poison shape and stays silent on a legal deck', () => {
  const poison = API.parseDeck('1x Vessel\n1x Blood Doll\n1x Conditioning\n1x Deflection\n1x On the Qui Vive\n1x Taste of Vitae\n1x Magic of the Smith\n');
  const warn = API.deckSanityText(poison);
  assert(warn && /0 crypt \/ 7 library/.test(warn), 'the confirm text carries the parsed counts');
  const legal = API.parseDeck('Crypt:\n12x Tupdog\nLibrary:\n30x Computer Hacking\n30x Conditioning\n');
  eq(API.deckSanityText(legal), null, '12 crypt / 60 library passes without a confirm');
});

test('deckOverwriteText fires only on a drastic same-name shrink', () => {
  const oldText = 'Deck Name: C5\nCrypt:\n12x Tupdog\nLibrary:\n30x Computer Hacking\n30x Conditioning\n';
  const poison = API.parseDeck('Deck Name: C5\n1x Vessel\n1x Blood Doll\n1x Conditioning\n1x Deflection\n1x On the Qui Vive\n1x Taste of Vitae\n1x Magic of the Smith\n');
  const warn = API.deckOverwriteText(oldText, poison, 'C5');
  assert(warn && /12 crypt \/ 60 library/.test(warn) && /0 crypt \/ 7 library/.test(warn),
    'the overwrite confirm names both sizes');
  const same = API.parseDeck(oldText);
  eq(API.deckOverwriteText(oldText, same, 'C5'), null, 'a same-size re-save passes silently');
  eq(API.deckOverwriteText('', poison, 'New'), null, 'no prior deck -> no guard');
});

test('errRing captures public log lines, strips HTML, honors noRing and private flags, caps at RING_MAX=200 (B-63)', () => {
  const ring = API.errRing;
  ring.length = 0;
  API.log('<b>Public</b> event one');
  eq(ring.length, 1);
  eq(ring[0].m, 'Public event one', 'HTML stripped before entering the ring');
  assert(typeof ring[0].t === 'number' && ring[0].t > 0, 'entries carry a wire-ready {t,m} timestamp');
  API.log('<span class="rwho">Alice:</span> <i>secret chat</i>', true, undefined, { noRing: true });
  eq(ring.length, 1, 'chat opts out via noRing -- the WRONG case is what the old design assumed was automatic');
  API.log('a private hand reveal', false, true);
  eq(ring.length, 1, 'private lines never enter the ring');
  eq(API.RING_MAX, 200, 'B-63: the cap is a named const at 200 (was an inline 40)');
  for (let i = 0; i < 230; i++) API.log('filler ' + i);
  eq(ring.length, 200, 'the ring caps at RING_MAX, oldest dropped');
  eq(ring[199].m, 'filler 229');
});

test('onClientError dedupes by message+source+line and caps the session at 5', () => {
  const sent = API._errSent;
  sent.clear();
  API.onClientError('Boom', 'app.js', 10, 2, 'stack');
  API.onClientError('Boom', 'app.js', 10, 2, 'stack');
  eq(sent.size, 1, 'the identical error records once');
  API.onClientError('E2', 'app.js', 1, 0, '');
  API.onClientError('E3', 'app.js', 2, 0, '');
  API.onClientError('E4', 'app.js', 3, 0, '');
  API.onClientError('E5', 'app.js', 4, 0, '');
  API.onClientError('E6', 'app.js', 5, 0, '');
  eq(sent.size, 5, 'the session caps at 5 distinct errors');
});

test('deckLegalText: the tournament hard verdict (12+ crypt, 60-90 library inclusive)', () => {
  const P=(c,l)=>({ crypt:c?[{qty:c,name:'V'}]:[], library:l?[{qty:l,name:'C'}]:[], skipped:0 });
  assert(API.deckLegalText(P(6,49)), 'the First Blood shape (6/49) is refused');
  eq(API.deckLegalText(P(12,77)), null, 'a V5 starter (12/77) passes');
  eq(API.deckLegalText(P(12,60)), null, 'the 60 floor is inclusive');
  eq(API.deckLegalText(P(12,90)), null, 'the 90 ceiling is inclusive');
  assert(API.deckLegalText(P(12,91)), '91 library is refused');
  assert(API.deckLegalText(P(11,60)), '11 crypt is refused');
  assert(/First Blood/.test(API.deckLegalText(P(6,49))), 'the refusal message still names the intro decks');
  assert(/Legal deck only/.test(API.deckLegalText(P(6,49))), 'v2.6.58: the hatch names the switch that causes the stop, not Tournament mode');
});

test('qty cap is 90: the legal 12x Tupdog / 90x Computer Hacking meme deck reads 12/90 and passes the gate', () => {
  const p = API.parseDeck('Deck Name: Meme\nCrypt:\n12x Tupdog\nLibrary:\n90x Computer Hacking\n');
  const t = API.deckTotals(p);
  eq(t.crypt, 12); eq(t.library, 90, 'a single 90x line survives intact (the old 30-cap shrank it)');
  eq(API.deckLegalText(p), null, 'the meme deck is tournament legal');
  const over = API.parseDeck('Crypt:\n12x Tupdog\nLibrary:\n120x Computer Hacking\n');
  eq(API.deckTotals(over).library, 90, 'the cap still bites at the library ceiling');
});

test('tutDeckRank: legal beats First Blood beats poison, so the tutorial always seats the best available', () => {
  const legal='Crypt:\n12x Tupdog\nLibrary:\n30x Computer Hacking\n30x Conditioning\n';
  const fb='Crypt:\n6x Tupdog\nLibrary:\n30x Computer Hacking\n19x Conditioning\n';
  const poison='1x Vessel\n1x Blood Doll\n1x Conditioning\n1x Deflection\n1x On the Qui Vive\n1x Taste of Vitae\n1x Magic of the Smith\n';
  const r = API.tutDeckRank([{text:poison},{text:fb},{text:legal}]);
  eq(r[0], 2, 'the legal deck seats first');
  eq(r[1], 1, 'the First Blood shape beats the poison on size');
  eq(r[2], 0, 'the poison seats only as a last resort');
  eq(API.tutDeckRank([{text:fb}])[0], 0, 'an all-intro collection still seats -- preference, never a gate');
});

/* === v2.6.56: dismissRoute — the sticky-lobby dismissal ladder (backdrop + Escape share it) === */
test('dismissRoute: duo (deck lab beside a lobby) wins every tie — the gesture closes only the lab', () => {
  eq(API.dismissRoute(true, 'deckLab', false, true), 'lab');
  eq(API.dismissRoute(true, 'lobbyModal', true, true), 'lab', 'even with a pending import-return and a live lobby, the duo rung is first');
});

test('dismissRoute: an import that displaced a lobby routes back to it; a plain import closes', () => {
  eq(API.dismissRoute(false, 'importModal', true, true), 'lobby');
  eq(API.dismissRoute(false, 'importModal', true, false), 'lobby', 'the return itself is the ticket — closeToLobby() re-checks liveness and falls through if the room died');
  eq(API.dismissRoute(false, 'importModal', false, true), 'close', 'no pending return: a plain import dismisses as before');
});

test('dismissRoute: a LIVE online lobby answers stay; a dead room closes; every other modal closes', () => {
  eq(API.dismissRoute(false, 'lobbyModal', false, true), 'stay', 'the fix itself: net.lobby + lobbyModal = dismiss-proof');
  eq(API.dismissRoute(false, 'lobbyModal', false, false), 'close', 'the room died while the window was up — it may close normally');
  for (const m of ['settingsModal', 'mpModal', 'offlineModal', 'aboutModal', 'savesModal', null])
    eq(API.dismissRoute(false, m, false, true), 'close', 'inLobby but another modal shown (' + m + '): that modal still dismisses');
});

/* === v2.6.57: B-53 follow-up -- preamble prose + the unknown-name gate (Johan/Tim's Hecata file) === */
if (!API.deckUnknownNames || !API.deckUnknownText) throw new Error('deckUnknownNames/deckUnknownText not exposed (harness needs updating)');

test('parseDeck: with BOTH section headers, a qty-line before the first header is prose, not a card (the "9 times out of 10" ghost)', () => {
  const p = API.parseDeck('Deck Name: Hecata swarm\nAbout the deck:\n9 times out of 10 you want to pay the upkeep for your Servitors.\n\nCrypt (2 cards)\n2x Alek Konig  3 OBL  Hecata:6\n\nLibrary (10 cards)\nAlly (10)\n10x Spectral Servitor');
  const t = API.deckTotals(p);
  eq(t.crypt, 2, 'crypt reads true'); eq(t.library, 10, 'the 9x prose ghost no longer inflates the library');
  assert(p.skippedLines.some(l => /9 times out of 10/.test(l)), 'the prose line is visible in the receipt, not silently dropped');
});

test('parseDeck: the original B-53 battery ghost ("90 cards of pure aggro") now parses to the TRUE counts instead of a refusable 150', () => {
  const p = API.parseDeck('Deck Name: Aggro\nDescription:\n90 cards of pure aggro\n\nCrypt (12 cards)\n12x Tupdog\n\nLibrary (60 cards)\n30x Computer Hacking\n30x Conditioning');
  const t = API.deckTotals(p);
  eq(t.crypt, 12); eq(t.library, 60, 'was 150 with the ghost -- the deck is simply read correctly now');
  eq(API.deckLegalText(p), null, 'and it passes the tournament gate exactly as the player expects');
});

test('parseDeck: the preamble rule needs BOTH headers -- Lackey (Crypt: only) and headerless lists keep the old resolution', () => {
  const lk = API.parseDeck('6\tAshur Tablets\n3\tVessel\nCrypt:\n3\tAmavi');
  eq(lk.library.length, 2, 'Lackey pre-header cards still classify as cards (only one header present)');
  eq(lk.crypt.length, 1, 'and the Crypt: section still lands');
  const hl = API.parseDeck('3xAmavi\n1xDolie\n\n6xAshur Tablets');
  eq(hl.crypt.length + hl.library.length, 3, 'a headerless list is untouched');
});

test('deckUnknownNames: authoritative against a provided DB, quiet when the DB is absent or empty', () => {
  const p = { crypt:[{qty:1,name:'Amavi'}], library:[{qty:2,name:'Compter Hacking'},{qty:1,name:'Ashur Tablets'}] };
  const db = new Map([[API.norm('Amavi'), ['Vampire']], [API.norm('Ashur Tablets'), ['Master']]]);
  const u = API.deckUnknownNames(p, db);
  eq(u.length, 1, 'exactly the miss'); eq(u[0], 'Compter Hacking', 'the misspelling is named');
  eq(API.deckUnknownNames(p, new Map()).length, 0, 'empty DB stays quiet (no false alarms)');
  eq(API.deckUnknownNames(p, null).length, 0, 'absent DB stays quiet');
});

test('deckUnknownText: tournament teaches the escape hatch, casual asks consent, a 273-char prose ghost is truncated', () => {
  const hard = API.deckUnknownText(['Compter Hacking'], true);
  assert(/1 card name /.test(hard) && /Compter Hacking/.test(hard), 'names the miss');
  assert(/Legal cards only/.test(hard) && /turn it off in Settings/.test(hard), 'v2.6.58: the hatch names the switch that causes the stop, not Tournament mode');
  const soft = API.deckUnknownText(['A','B'], false);
  assert(/2 card names/.test(soft) && /Import anyway\?/.test(soft), 'casual keeps the confirm shape');
  assert(API.deckUnknownText(['x'.repeat(273)], true).length < 400, 'a prose-length name cannot blow up the dialog');
  eq(API.deckUnknownText([], true), null, 'nothing to say -> null');
});

test('end to end: a Hecata-shaped import is legal-sized AND the unknown gate has nothing left to flag -- the two layers compose', () => {
  const p = API.parseDeck('Deck Name: Mini\nAbout:\n9 times out of 10 keep bleeding.\n\nCrypt (12 cards)\n12x Amavi\n\nLibrary (60 cards)\n60x Ashur Tablets');
  eq(API.deckLegalText(p), null, 'true counts pass the size gate');
  const db = new Map([[API.norm('Amavi'), ['Vampire']], [API.norm('Ashur Tablets'), ['Master']]]);
  eq(API.deckUnknownNames(p, db).length, 0, 'no ghost ever reaches the DB check');
});

/* === v2.6.58: the deck gates become their own switches (Johan: don't mix them up with Tournament mode) === */
test('conv: the two Legal-only switches exist and default ON -- a fresh install keeps the pre-split hard-gate behavior', () => {
  const fresh = loadClient(CLIENT);   // the live API's conv is MUTATED by earlier tests (hx/policy tests flip tournament) -- defaults must be read off a fresh load
  eq(typeof fresh.conv.legalDeck, 'boolean', 'legalDeck exists');
  eq(typeof fresh.conv.legalCards, 'boolean', 'legalCards exists');
  eq(fresh.conv.legalDeck, true, 'fresh default matches the old tournament:true riding');
  eq(fresh.conv.legalCards, true);
  eq(fresh.conv.tournament, true, 'Tournament mode itself is untouched -- still the helpers master switch');
});

/* === HB2b: the hotseat bot bridge — a REAL Bot end-to-end (async) === */
testB('HB2b: a real Bot crosses the bridge -- join>deck>dealt(7/4)>turn-1>pass; the pub lands via the remote-player path', async () => {
  const BOT = require('./elysium-bot.js');
  const HB = API.hotBridge;
  assert(HB && typeof HB.dialFor === 'function', 'hotBridge exposed by the harness');
  HB.reset([{ name: 'You' }, { name: 'Bridgebot', bot: true }]);
  let passedSeat = null; HB.onPass = s => { passedSeat = s; };
  const b = new BOT.Bot({ room: 'hot', pass: '', name: 'Bridgebot', paceMs: 0, askSecs: 1,
                          transport: HB.dialFor(2, 'Bridgebot'), log: () => {} });
  await b.connect();
  const t0 = Date.now();
  while ((!HB.seats[2] || !HB.seats[2].deck) && Date.now() - t0 < 4000) await new Promise(r => setTimeout(r, 40));
  assert(HB.seats[2] && HB.seats[2].deck && HB.seats[2].deck.library.length > 0, 'the deck upload drained through the token bucket and expanded');
  assert(HB.startFor(2) === true, 'the deal fired');
  await new Promise(r => setTimeout(r, 120));
  eq(b.hand.length, 7, 'a seven-card opening hand (the dealNow mirror)');
  eq(b.unc.length, 4, 'four uncontrolled crypt cards');
  HB.turn(2);
  const t1 = Date.now();
  while (passedSeat === null && Date.now() - t1 < 30000) await new Promise(r => setTimeout(r, 100));
  eq(passedSeat, 2, 'the bot played turn 1 and PASSED through the bridge (onPass hook)');
  assert(API.net && API.net.boards && API.net.boards[2] && API.net.boards[2].pub, 'the board pub landed in net.boards[2] -- the remote-player path');
  assert(API.net.boards[2].ts, 'the pub arrived via the HANDLER path, not the fallback (MP_HANDLERS.board stamps ts; the fallback does not)');
  assert((API.errRing || []).some(r => /\[Bridgebot\]/.test(r && r.m || '')), 'the bot\u2019s log lines routed through MP_HANDLERS.log into errRing -- who-attributed');
  const ser = API.serializeGame ? API.serializeGame() : null;
  assert(!API.serializeGame || (typeof ser === 'string' ? (ser.length > 2 && !!JSON.parse(ser)) : (ser && typeof ser === 'object')),
         'serializeGame runs clean with a bot seat present (the HB2b audit; string or object accepted, parseable required)');
  b.close();
});

/* === HB2c: hotRunBotTurns sequences TWO real bots in seat order (async) === */
testB('v2.6.72: hotRunBotTurns RANGE -- a bot at seat 1 plays in its true place: after the human at seat 2 the order is [3, 1]; the opening (0 -> first human) plays [1] alone', async () => {
  const BOT = require('./elysium-bot.js');
  const HB = API.hotBridge, RUN = API.hotRunBotTurns;
  HB.reset([{ name: 'One', bot: true }, { name: 'You' }, { name: 'Three', bot: true }]);
  API.offlineCfg = [{ name: 'One', botP: 'experienced' }, { name: 'You' }, { name: 'Three', botP: 'experienced' }];
  API.net.roster = [{ seat: 1, name: 'One' }, { seat: 2, name: 'You' }, { seat: 3, name: 'Three' }];
  const mk = (seat, nm) => new BOT.Bot({ room: 'hot', pass: '', name: nm, paceMs: 0, askSecs: 1, transport: HB.dialFor(seat, nm), log: () => {} });
  const b1 = mk(1, 'One'), b3 = mk(3, 'Three');
  await b1.connect(); await b3.connect();
  const t0 = Date.now();
  while ((!HB.seats[1] || !HB.seats[1].deck || !HB.seats[3] || !HB.seats[3].deck) && Date.now() - t0 < 6000) await new Promise(r => setTimeout(r, 40));
  assert(HB.startFor(1) && HB.startFor(3), 'both bots dealt');
  await new Promise(r => setTimeout(r, 150));
  eq(API.hotNextHuman(2), 2, 'the only human is their own successor');
  const opening = await RUN(0, 2, { skipCounterFor: 1 });
  eq(JSON.stringify(opening), '[1]', 'the opening sweep plays exactly the leading bot');
  const round = await RUN(2, 2);
  eq(JSON.stringify(round), '[3,1]', 'after the human at seat 2, seat 3 plays, THEN seat 1 -- circle order, not ascending');
  const legacy = await RUN();
  eq(JSON.stringify(legacy), '[1,3]', 'no args = the legacy every-bot ascending sweep (HB2c contract kept)');
  b1.close(); b3.close(); API.offlineCfg = []; API.net.roster = [];
});

testB('HB2c: hotRunBotTurns runs two real bot seats in order [2,3] and restores onPass', async () => {
  const BOT = require('./elysium-bot.js');
  const HB = API.hotBridge, RUN = API.hotRunBotTurns;
  assert(typeof RUN === 'function', 'hotRunBotTurns exposed by the harness');
  HB.reset([{ name: 'You' }, { name: 'Two', bot: true }, { name: 'Three', bot: true }]);
  const sentinel = () => {}; HB.onPass = sentinel;
  const mk = (seat, nm) => new BOT.Bot({ room: 'hot', pass: '', name: nm, paceMs: 0, askSecs: 1,
                                         transport: HB.dialFor(seat, nm), log: () => {} });
  const b2 = mk(2, 'Two'), b3 = mk(3, 'Three');
  await b2.connect(); await b3.connect();
  const t0 = Date.now();
  while ((!HB.seats[2] || !HB.seats[2].deck || !HB.seats[3] || !HB.seats[3].deck) && Date.now() - t0 < 5000)
    await new Promise(r => setTimeout(r, 40));
  assert(HB.startFor(2) && HB.startFor(3), 'both bots dealt');
  const order = await RUN();
  assert(Array.isArray(order) && order.length === 2 && order[0] === 2 && order[1] === 3,
         'the sweep ran seat 2 then seat 3 (got ' + JSON.stringify(order) + ')');
  assert(HB.onPass === sentinel, 'onPass restored after the sweep (the save/restore contract)');
  b2.close(); b3.close();
});

/* === v2.6.70: the phase-leave gate must survive state.cards being a MAP === */
testA('v2.6.70: phaseLeaveOK(0) on an empty table resolves true without throwing -- the Map-method regression guard', async () => {
  assert(typeof API.phaseLeaveOK === 'function', 'phaseLeaveOK exposed by the harness');
  const r = await API.phaseLeaveOK(0);
  assert(r === true, 'an empty board skips the unlock-triggered confirm (and the Array-method bug throws here by construction)');
});

/* === v2.6.60: B-63 diagnostic dump -- the support bundle riding every report === */
test('fitReport: an already-small payload passes untouched', () => {
  const small = { kind:'report', ring:[{t:1,m:'a'},{t:2,m:'b'}], summary:{}, dump:{ game:{ board:[] }, env:{} } };
  const q = API.fitReport(small);
  eq(q.ring.length, 2); assert(q.dump, 'the dump survives whole'); eq(q.dumpTrunc, undefined);
});
test('fitReport degrade ladder stage 1: a fat ring is trimmed before the dump is touched', () => {
  const ring = []; for (let i = 0; i < 200; i++) ring.push({ t: 1723100000000 + i, m: 'x'.repeat(190) });
  const board = []; for (let i = 0; i < 50; i++) board.push({ id:'c'+i, z:'ready', s:1, x:i, y:i, n:'N'+i, k:'l', b:2, c:['counter-one','counter-two'], att:['c1','c2'] });
  const p = API.fitReport({ kind:'report', ver:'t', ua:'t', note:'n', ring, summary:{}, dump:{ game:{ board }, env:{} } });
  assert(JSON.stringify(p).length <= API.DUMP_BUDGET, 'fits the budget');
  eq(p.ring.length, 120, 'ring trimmed to 120 first');
  assert(p.dump && p.dump.game.board[0].c, 'board detail untouched at this stage');
});
test('fitReport degrade ladder stage 3: board counter detail is stripped before the dump is dropped', () => {
  const ring = []; for (let i = 0; i < 200; i++) ring.push({ t: 1723100000000 + i, m: 'x'.repeat(190) });
  const board = []; for (let i = 0; i < 350; i++) board.push({ id:'c'+i, z:'ready', s:1, x:i, y:i, n:'N'+i, k:'l', b:2, c:['counter-one','counter-two'], att:['c1','c2'] });
  const p = API.fitReport({ kind:'report', ver:'t', ua:'t', note:'n', ring, summary:{}, dump:{ game:{ board }, env:{} } });
  assert(JSON.stringify(p).length <= API.DUMP_BUDGET, 'fits the budget');
  eq(p.ring.length, 80, 'ring at the 80 floor');
  assert(p.dump, 'the dump SURVIVES -- positions still tell the story');
  const e = p.dump.game.board[0];
  eq(e.n, 'N0', 'names kept'); eq(e.c, undefined, 'counter detail stripped'); eq(e.b, undefined); eq(e.att, undefined);
});
test('fitReport degrade ladder stage 4: an impossible dump is dropped with dumpTrunc:1 -- the report itself NEVER fails', () => {
  const ring = []; for (let i = 0; i < 200; i++) ring.push({ t: 1723100000000 + i, m: 'x'.repeat(190) });
  const board = []; for (let i = 0; i < 600; i++) board.push({ id:'c'+i, z:'ready', s:1, x:i, y:i, n:'NameName'+i, k:'l', b:2, c:['counter-one','counter-two'], att:['c1','c2'] });
  const p = API.fitReport({ kind:'report', ver:'t', ua:'t', note:'n', ring, summary:{}, dump:{ game:{ board }, env:{} } });
  assert(JSON.stringify(p).length <= API.DUMP_BUDGET, 'fits the budget');
  eq(p.dump, undefined, 'the dump is gone'); eq(p.dumpTrunc, 1, '...and says so');
  eq(p.kind, 'report', 'the report core is intact');
});
test('deckCensus: saved-deck shapes with the legality warn -- a poisoned save shows itself in every report (B-53 visibility)', () => {
  API.storeDeck('Census Legal', 'Crypt:\n12x Tupdog\nLibrary:\n60x Computer Hacking\n');
  API.storeDeck('Census Poison', '1x Vessel\n1x Blood Doll\n1x Conditioning\n1x Deflection\n1x On the Qui Vive\n1x Taste of Vitae\n1x Magic of the Smith\n');
  const c = API.deckCensus();
  const ok = c.find(d => d.name === 'Census Legal'), bad = c.find(d => d.name === 'Census Poison');
  assert(ok && bad, 'both saves are in the census');
  eq(ok.crypt, 12); eq(ok.library, 60); eq(ok.warn, 0, 'a legal deck carries warn:0');
  eq(bad.crypt, 0); eq(bad.library, 7); eq(bad.warn, 1, 'the poisoned shape carries warn:1');
});
test('the consent text names the widened scope honestly (table AND hand, deck census) and keeps the exclusions', () => {
  const src = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/your full visible table AND your own hand/.test(src), 'consent names the table and the hand (D2)');
  assert(/saved-deck names with card counts/.test(src), 'consent names the deck census');
  assert(/your settings toggles/.test(src), 'consent names the settings (v2.6.62)');
  assert(/never chat, never your opponents/.test(src), 'consent keeps the exclusions (D3)');
});

/* === v2.6.64: compat shim, crash notice, boot flag (second telemetry harvest) === */
test('_atPolyfill matches native Array/String .at on every edge (negatives, out of range, fractions, NaN)', () => {
  const arr = ['a', 'b', 'c'], str = 'xyz';
  for (const n of [0, 1, 2, 3, -1, -3, -4, 1.7, -1.2, NaN, undefined, '1']) {
    eq(API._atPolyfill.call(arr, n), arr.at(n), 'array .at(' + String(n) + ')');
    eq(API._atPolyfill.call(str, n), str.at(n), 'string .at(' + String(n) + ')');
  }
  eq(API._atPolyfill.call([], -1), undefined, 'empty array');
});
test('crashNotice: once per session, skips cross-origin noise and Cloudflare-injected sources, then arms on the first real error', () => {
  API.resetCrashNotice();
  API.crashNotice('Script error.', '', false);
  eq(API.crashNoticed, false, '"Script error." never arms the notice');
  API.crashNotice('TypeError: t.entries.at is not a function', 'https://elysium.cards/cdn-cgi/challenge-platform/x.js', true);
  eq(API.crashNoticed, false, 'a /cdn-cgi/ source never arms it -- not our code, not actionable');
  API.crashNotice('TypeError: boom', 'https://elysium.cards/', true);
  eq(API.crashNoticed, true, 'the first real error arms it');
  API.crashNotice('TypeError: boom 2', 'https://elysium.cards/', true);
  eq(API.crashNoticed, true, '...and it stays armed (one per session)');
  API.resetCrashNotice();
});
test('the main script raises the boot flag as its last statement -- what the ES5 legacy guard waits for', () => {
  eq(API.booted, true, 'window.__elysiumBooted is true after a full load');
});

/* === telemetry-track async tests (buildDump awaits storage.estimate) -- ride the HB2b testA runner (merge, v2.6.71) === */
testA('buildDump: own cards carry names (face-up AND own face-down), an opponent face-down is a NAMELESS stub (T4), hand + seats + env ride', async () => {
  API.clearTable({});
  const s = API.state, n = API.net;
  s.deckName = 'Dump Deck'; s.pool = 11; s.turn = 3; s.phase = 2;
  const v = API.makeCard('Own Vampire', 'crypt'); API.move(v, 'ready', { x: 100, y: 50, faceDown: false }); v.locked = true; v.blood = 2; v.counters.push('corruption');
  const fdOwn = API.makeCard('My Secret', 'lib'); API.move(fdOwn, 'ready', { x: 200, y: 60, faceDown: true });
  const h1 = API.makeCard('Hand Card', 'lib'); API.move(h1, 'hand', {});
  n.you = 'Reporter';
  n.roster = [{ seat: 1, name: 'Reporter' }, { seat: 2, name: 'Rival' }];
  n.boards = { 2: { who: 'Rival', pub: { pool: 7, cards: [
    { id: 'r1', name: 'Rival Vamp', kind: 'crypt', zone: 'ready', x: 10, y: 20, locked: true },
    { id: 'r2', name: 'LEAKME', kind: 'lib', zone: 'ready', x: 30, y: 40, faceDown: true } ] } } };
  const d = await API.buildDump();
  eq(d.game.deckName, 'Dump Deck'); eq(d.game.mySeat, 1); eq(d.game.turn, 3); eq(d.game.handN, 1);
  eq(d.game.hand[0], 'Hand Card', 'the reporter\'s own hand names are included (D2)');
  const own = d.game.board.find(e => e.id === String(v.id));
  assert(own && own.n === 'Own Vampire' && own.l === 1 && own.b === 2 && own.c && own.c[0] === 'corruption', 'own face-up entry carries name + detail');
  const ownFd = d.game.board.find(e => e.id === String(fdOwn.id));
  assert(ownFd && ownFd.fd === 1 && ownFd.n === 'My Secret', 'the reporter\'s OWN face-down card keeps its name -- theirs to share');
  const rv = d.game.board.find(e => e.id === 'r1');
  assert(rv && rv.n === 'Rival Vamp' && rv.s === 2 && rv.l === 1, 'an opponent face-UP card carries its name');
  const stub = d.game.board.find(e => e.id === 'r2');
  assert(stub && stub.fd === 1 && stub.n === undefined && stub.c === undefined && stub.k === undefined, 'an opponent FACE-DOWN card is a position-only stub -- NO name field at all (T4; hotseat pubs carry names, the filter is here)');
  const seat2 = d.game.seats.find(x => x.s === 2);
  eq(seat2.pool, 7, 'an opponent pool is read from their pub');
  eq(d.game.seats.find(x => x.s === 1).pool, 11, 'own pool from state');
  eq(d.env.storage.usedKB, null, 'the harness navigator has no storage.estimate -- nulls, never a throw (T3)');
  const st = d.env.settings;
  assert(st && st.errPing === true, 'settings ride -- errPing among them (v2.6.62: the whole conv surface replaced the four-flag quartet)');
  eq(st.defaultView, 'normal', 'string settings pass (capped 32)');
  eq(st.animSpeed, 1, 'numeric settings pass');
  assert(typeof st.tutDoneN === 'number', 'tutDone rides as a COUNT');
  eq(st.tutDone, undefined, '...never as the raw array');
  eq(st.sfxIndiv, undefined, 'object-valued settings are skipped -- scalars only');
  eq(st.localImgAuto, false, 'the server-probe auto-on flag rides too (every images gate reads conv.localImg||localImgAuto)');
  assert(typeof d.env.screen === 'string' && /\dx\d/.test(d.env.screen), 'viewport string');
  eq(d.env.db.loaded, d.env.db.cards > 0, 'db.loaded mirrors a populated cardTypes (earlier suite tests feed processCardData a mini-DB, so it may be true here)');
  n.roster = []; n.boards = {}; n.you = null;   // leave the shared net clean for any later suite additions
});

testA('buildDump: a spectator (not in the roster) dumps the boards they watch with mySeat:null', async () => {
  API.clearTable({});
  const n = API.net;
  n.you = 'Watcher';
  n.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'Bob' }];
  n.boards = { 1: { who: 'Alice', pub: { pool: 30, cards: [{ id: 'a1', name: 'Alpha', kind: 'crypt', zone: 'ready', x: 1, y: 2 }] } },
               2: { who: 'Bob',   pub: { pool: 28, cards: [{ id: 'b1', name: 'Beta', kind: 'lib', zone: 'ready', x: 3, y: 4, faceDown: true }] } } };
  const d = await API.buildDump();
  eq(d.game.mySeat, null, 'a spectator has no seat -- null, never a lying 0');
  assert(d.game.board.find(e => e.id === 'a1' && e.n === 'Alpha'), 'the watched face-up board is visible to them -- same rule');
  const stub = d.game.board.find(e => e.id === 'b1');
  assert(stub && stub.fd === 1 && stub.n === undefined, 'face-down stays a stub for a spectator too');
  n.roster = []; n.boards = {}; n.you = null;
});

/* === v2.6.71 (the merge): Johan's hotseat Hold on report -- the whole path, bot-side airtight + client-side hardened === */
test('hotSpawnBots gives bots a human-scale ask window (askSecs 20) and saySend relays BEFORE it paints', () => {
  const src = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/paceMs:3100, askSecs:20,/.test(src), 'askSecs 20 at the spawn site (was 2 -- the window closed before a human could react)');
  const relay = src.indexOf('MOVED ABOVE THE PAINT'), paint = src.indexOf("try{ showSay(i, net.you||state.playerName||'You'");
  assert(relay > 0 && paint > relay, 'the bridge relay precedes showSay in saySend -- a paint miss can never eat the wire');
});
testB('hotseat Hold on end to end: a HUMAN say pauses a real paced bot at the bridge, It resolves releases it and the turn completes', async () => {
  const BOT = require('./elysium-bot.js');
  const HB = API.hotBridge;
  HB.reset([{ name: 'You' }, { name: 'Holdbot', bot: true }]);
  let passedAt = null; HB.onPass = s => { if (s === 2) passedAt = Date.now(); };
  const chats = [];
  const b = new BOT.Bot({ room: 'hot', pass: '', name: 'Holdbot', paceMs: 300, askSecs: 1,
                          transport: HB.dialFor(2, 'Holdbot'), log: () => {} });
  const origChat = b.chat.bind(b); b.chat = (x) => { chats.push(String(x)); return origChat(x); };
  await b.connect();
  const t0 = Date.now();
  while ((!HB.seats[2] || !HB.seats[2].deck) && Date.now() - t0 < 4000) await new Promise(r => setTimeout(r, 40));
  assert(HB.startFor(2) === true, 'the deal fired');
  await new Promise(r => setTimeout(r, 120));
  const say = (i) => Object.keys(HB.seats || {}).forEach(k => HB.toBot(+k, { t: 'say', who: 'You', seat: 1, i }));
  say(0);                                                   // Hold on... from the human seat
  await new Promise(r => setTimeout(r, 60));
  assert(b._holdBy && b._holdBy.has('You'), 'the hold engaged for the human sayer');
  eq(chats.some(c => /Holding/.test(c)), false, 'v0.6.106 anti-flood: a bot that is NOT on turn and has no open ask stays silent -- with N bots seated, N simultaneous "Holding" lines would bury the table (the hold still engaged above, which is what matters)');
  HB.turn(2);
  await new Promise(r => setTimeout(r, 1500));
  eq(passedAt, null, 'a held bot does NOT play its turn (1.5 s in, no pass)');
  say(4);                                                   // It resolves
  const t1 = Date.now();
  while (passedAt === null && Date.now() - t1 < 20000) await new Promise(r => setTimeout(r, 100));
  assert(passedAt !== null, 'released, the bot played the turn and passed through the bridge');
  eq(chats.some(c => /Holding/.test(c)), true, 'CLOSED in bot v0.6.108: this pinned the v0.6.107 gap -- the ack fired only on the fresh empty->held transition, so a hold placed while no bot was relevant was never announced and the human just saw a bot stop. v0.6.108 moved the announcement into _pace\'s wait gate, so the bot that is actually BLOCKED announces. The client-side answer (the v2.6.96 hold badge) stays either way.');
  assert(chats.some(c => /Resuming/.test(c)), 'the release IS announced (the relevant bot is on turn by then)');
  eq(b._holdBy.size, 0, 'the hold set is empty after release');
  b.close();
});

/* === v2.6.108 LIVE: the panel's seam against a REAL bot, not a fake status() === */
testB('v2.6.108 LIVE: status()/step() on a real held bot -- the panel reads the hold, step() releases it, and the turn then completes', async () => {
  const BOT = require('./elysium-bot.js');
  const HB = API.hotBridge;
  HB.reset([{ name: 'You' }, { name: 'Stepbot', bot: true }]);
  let passedAt = null; HB.onPass = s => { if (s === 2) passedAt = Date.now(); };
  const b = new BOT.Bot({ room: 'hot', pass: '', name: 'Stepbot', paceMs: 300, askSecs: 1,
                          transport: HB.dialFor(2, 'Stepbot'), log: () => {} });
  await b.connect();
  const t0 = Date.now();
  while ((!HB.seats[2] || !HB.seats[2].deck) && Date.now() - t0 < 4000) await new Promise(r => setTimeout(r, 40));
  assert(HB.startFor(2) === true, 'the deal fired');
  await new Promise(r => setTimeout(r, 120));
  // the panel's read path against the live object, BEFORE anything is pending
  API.hotBots[2] = b;
  const idle = API.botPanelRead(b);
  eq(idle.name, 'Stepbot', 'the live status() names the bot');
  eq(idle.canStep, false, 'nothing to step while idle -- the button must be disabled, not merely inert');
  eq(API.botPanelSeats().length, 1, 'the panel sees the seat');
  // put it in a hold from the human seat, exactly as the table would
  Object.keys(HB.seats || {}).forEach(k => HB.toBot(+k, { t: 'say', who: 'You', seat: 1, i: 0 }));
  await new Promise(r => setTimeout(r, 60));
  const held = API.botPanelRead(b);
  eq(held.state, 'held', 'the live bot reports held');
  assert(/hold: You/.test(held.waitingFor), 'and says WHO in table language: ' + JSON.stringify(held.waitingFor));
  eq(held.until, null, 'a hold has no deadline by design -- the panel shows an em-dash, never a made-up number');
  eq(held.step, 'release-hold'); eq(held.canStep, true);
  eq(API.BOT_STEP_LABEL[held.step], 'Release hold', 'the button labels itself from the rung');
  eq(API.botPanelCountdown(held.until, Date.now()), '\u2014');
  HB.turn(2);
  await new Promise(r => setTimeout(r, 900));
  eq(passedAt, null, 'held: the turn does not play (0.9 s in, no pass)');
  // THE PRESS -- through the same method the panel's button calls
  const out = b.step();
  eq(out.did, 'release-hold', 'step() released the hold: ' + JSON.stringify(out));
  eq(b._holdBy.size, 0, 'and the hold set is empty');
  const t1 = Date.now();
  while (passedAt === null && Date.now() - t1 < 20000) await new Promise(r => setTimeout(r, 100));
  assert(passedAt !== null, 'released by the panel, the bot played its turn and passed -- same outcome the table\'s "It resolves" produces');
  const again = b.step();
  eq(again.did, null, 'a second press is a no-op with a reason, never a double release: ' + JSON.stringify(again.why));
  delete API.hotBots[2];
  b.close();
});

/* === v2.6.72 (Johan's two offline finds): the Start gate, and a bot at seat 1 === */
test('offlineReady: Start needs two players, one human, and a deck on every human seat -- and names what is missing', () => {
  API.storeDeck('Ready Deck', 'Crypt:\n12x Tupdog\nLibrary:\n60x Computer Hacking\n');
  const decks = API.loadDecks(); const di = decks.findIndex(d => d.name === 'Ready Deck'); assert(di >= 0, 'fixture deck saved');
  API.offlineCfg = [{ name: 'You', deckIdx: -1 }];
  eq(API.offlineReady().ok, false, 'one seat is not a table');
  API.offlineCfg = [{ name: 'You', deckIdx: -1 }, { name: 'Bram', deckIdx: -1 }];
  const r1 = API.offlineReady(); eq(r1.ok, false); assert(/Pick a deck for: You, Bram/.test(r1.why), 'names every human seat without a deck');
  API.offlineCfg = [{ name: 'You', deckIdx: di }, { name: 'Bram', deckIdx: -1, botP: 'experienced' }];
  eq(API.offlineReady().ok, true, 'a human with a deck plus a bot (bots always carry a deck) is ready');
  API.offlineCfg = [{ name: 'One', deckIdx: -1, botP: 'expert' }, { name: 'Two', deckIdx: -1, botP: 'novice' }];
  const r2 = API.offlineReady(); eq(r2.ok, false); assert(/human/.test(r2.why), 'an all-bot table is refused (that is the arena)');
  API.offlineCfg = [{ name: 'Bot', deckIdx: -1, botP: 'expert' }, { name: 'You', deckIdx: di }];
  eq(API.offlineReady().ok, true, 'a bot at seat 1 with a human at seat 2 is ready');
});
test('startHotseat with a bot at seat 1 activates the first HUMAN (net.you, mySeat) while turn 1 still belongs to seat 1', () => {
  const deck = 'Crypt:\n12x Tupdog\nLibrary:\n60x Computer Hacking\n';
  API.offlineCfg = [{ name: 'Bot', deckIdx: -1, botP: 'expert' }, { name: 'You', deckIdx: 0 }];
  API.startHotseat([{ name: 'Bot', bot: true, deckText: deck }, { name: 'You', deckText: deck }], 'structured');
  eq(API.net.you, 'You', 'the device holder is the first human, not seat 1');
  eq(API.net.turnSeat, 1, 'turn 1 is seat 1\'s -- the bot\'s -- the opening sweep will play it');
  assert(API.net.roster[0].bot === true && API.net.roster[1].host === true, 'roster carries the bot flag; the human is the host');
  assert(API.net.boards[1] && !API.net.boards[2], 'seat 1 has a pub (placeholder until the bot pushes); the active human seat has none');
  eq(API.hotNextHuman(2), 2, 'with one human, the next human after them is themselves (a full ring of bots between)');
  API.offlineCfg = [];
});

/* === v2.6.74: LITE MODE + the card database on by default + the alpha pill === */
test('v2.6.74: uiFirstRunMode -- a first visit on a SERVED page starts in Lite; file:// and localhost start in Full', () => {
  eq(API.uiFirstRunMode('https:', 'elysium.cards'), 'lite', 'the website');
  eq(API.uiFirstRunMode('https:', 'wild-name.trycloudflare.com'), 'lite', 'a tunnel');
  eq(API.uiFirstRunMode('http:', '192.168.1.42:8123'), 'lite', 'a LAN host');
  eq(API.uiFirstRunMode('file:', ''), 'full', 'the double-clicked download');
  eq(API.uiFirstRunMode('http:', 'localhost:8123'), 'full', 'the host on their own machine');
  eq(API.uiFirstRunMode('http:', '127.0.0.1'), 'full');
  eq(API.uiFirstRunMode(undefined, undefined), 'full', 'garbage in -> the safe default');
});
test('v2.6.74: the card database is ON for a fresh install, migrated ON once for a pre-flag install, and left OFF for an install that opted out after the flag', () => {
  const KEY = 'elysium.convenience';
  const fresh = loadClient(CLIENT);
  eq(fresh.conv.cardDB, true, 'fresh default'); eq(fresh.conv.dbDefault, true, 'the flag rides from the literal');
  const old = loadClient(CLIENT, { storage: { [KEY]: JSON.stringify({ cardDB: false, anim: 'on' }) } });   // a 2.6.73 install that never enabled the database
  eq(old.conv.cardDB, true, 'pre-flag install: migrated on once'); eq(old.conv.anim, 'on', 'the rest of the stored settings survive the migration');
  const opted = loadClient(CLIENT, { storage: { [KEY]: JSON.stringify({ cardDB: false, dbDefault: true }) } });
  eq(opted.conv.cardDB, false, 'an install that turned the database off AFTER the flag is respected');
});
test('v2.6.74: the first-visit rule reads the stored settings, not the page -- a returning visitor on the website keeps Full; a stored mode round-trips', () => {
  const KEY = 'elysium.convenience';
  const first = loadClient(CLIENT, { location: { protocol: 'https:', host: 'elysium.cards', href: 'https://elysium.cards/' } });
  eq(first.conv.uiMode, 'lite', 'nothing stored + the website = Lite');
  eq(first.uiMode(), 'lite'); eq(first.uiLite(), true);
  const back = loadClient(CLIENT, { location: { protocol: 'https:', host: 'elysium.cards' }, storage: { [KEY]: JSON.stringify({ anim: 'on' }) } });
  eq(back.conv.uiMode, 'full', 'a returning visitor (any stored settings, no uiMode) stays in Full -- existing players see no change');
  const stored = loadClient(CLIENT, { storage: { [KEY]: JSON.stringify({ uiMode: 'lite', modeHintDone: true, uiProf: { full: { anim: 'mine', pco: 'all', sfxVol: 70, junk: 1 }, lite: 'garbage' } }) } });
  eq(stored.conv.uiMode, 'lite', 'the mode you had last time'); eq(stored.conv.modeHintDone, true);
  eq(JSON.stringify(stored.conv.uiProf), JSON.stringify({ full: { anim: 'mine', pco: 'all', sfxVol: 70 } }), 'stored profiles are sanitised to the trio (unknown keys dropped, a non-object dropped)');
  const bad = loadClient(CLIENT, { storage: { [KEY]: JSON.stringify({ uiMode: 'nope' }) } });
  eq(bad.conv.uiMode, 'full', 'an illegal stored mode falls back to Full');
  eq(API.conv.uiMode, 'full', 'the harness default (http://localhost, nothing stored) boots Full');
});
test('v2.6.74: uiProfileSwap remembers the anim/pco/sfx trio PER MODE -- a switch never clobbers what you set in the other mode', () => {
  const F = loadClient(CLIENT); const c = F.conv;
  c.uiMode = 'full'; c.anim = 'on'; c.pco = 'mine'; c.sfxVol = 40;
  eq(F.uiProfileSwap('full', 'full'), false, 'same mode: a no-op'); eq(c.sfxVol, 40);
  eq(F.uiProfileSwap('full', 'lite'), true);
  eq(c.anim, 'all', 'Lite preset: animations all hidden'); eq(c.pco, 'all', 'Lite preset: player colours all hidden'); eq(c.sfxVol, 0, 'Lite preset: sound off');
  eq(JSON.stringify(c.uiProf.full), JSON.stringify({ anim: 'on', pco: 'mine', sfxVol: 40 }), 'the Full trio was remembered on the way out');
  c.sfxVol = 25;                                                   // the player turns sound on while in Lite
  F.uiProfileSwap('lite', 'full');
  eq(c.anim, 'on'); eq(c.pco, 'mine'); eq(c.sfxVol, 40, 'back in Full: exactly the values Full had');
  F.uiProfileSwap('full', 'lite');
  eq(c.sfxVol, 25, 'back in Lite: the Lite-time change was remembered, the preset did not overwrite it');
  eq(c.anim, 'all');
  const G = loadClient(CLIENT); G.conv.uiMode = 'lite'; G.conv.anim = 'all'; G.conv.pco = 'all'; G.conv.sfxVol = 0;
  G.uiProfileSwap('lite', 'full');                                 // a first-visit Lite player switching to Full for the first time
  eq(G.conv.anim, 'on'); eq(G.conv.pco, 'mine'); eq(G.conv.sfxVol, 0, 'no Full memory yet -> the literal defaults, not the Lite values');
  eq(JSON.stringify(F.UI_PRESET.lite), JSON.stringify({ anim: 'all', pco: 'all', sfxVol: 0 }));
});
test('v2.6.75: uiMode / uiSetMode -- opening the tutorial in Lite SWITCHES to Full for real (trio included, you stay), and the switch refuses inside a lobby or a room', () => {
  const F = loadClient(CLIENT);
  eq(F.uiMode(), 'full', 'harness default');
  eq(F.uiSetMode('lite'), true); eq(F.conv.uiMode, 'lite'); eq(F.uiMode(), 'lite');
  eq(F.conv.anim, 'all', 'the switch applied the Lite trio');
  F.openTutorial();                                                // from the menu, the only tutorial entry Lite has
  eq(F.conv.uiMode, 'full', 'the tutorial is a Full thing: a REAL switch'); eq(F.uiMode(), 'full');
  eq(F.conv.anim, 'on', 'the Full trio is back -- the tutorial shows what it talks about (v2.6.74\'s presentation-only lift did not)');
  F.tutEnd();
  eq(F.conv.uiMode, 'full', 'and you stay in Full afterwards (the pill takes you back)');
  eq(F.uiSetMode('lite'), true);
  F.net.lobby = true;
  eq(F.uiSetMode('full'), false, 'refused inside a lobby'); eq(F.conv.uiMode, 'lite');
  F.net.lobby = false; F.net.status = 'in';
  eq(F.uiSetMode('full'), false, 'refused inside a room'); eq(F.conv.uiMode, 'lite');
  F.net.status = 'off';
  eq(F.uiSetMode('full'), true); eq(F.conv.uiMode, 'full'); eq(F.conv.anim, 'on', 'the remembered Full trio is back');
  eq(F.uiSetMode('bogus'), true, 'an unknown mode name means Full'); eq(F.conv.uiMode, 'full');
});
test('v2.6.74: mpLiteAddr keeps a served host and falls back to elysium.cards for an address-less client (file://, no memory)', () => {
  eq(API.mpLiteAddr('elysium.cards'), 'elysium.cards', 'the https page host, as openMP filled it');
  eq(API.mpLiteAddr('https://friend.trycloudflare.com'), 'https://friend.trycloudflare.com');
  eq(API.mpLiteAddr(' 192.168.1.42:8123 '), '192.168.1.42:8123', 'trimmed, otherwise untouched');
  eq(API.mpLiteAddr(''), 'https://elysium.cards'); eq(API.mpLiteAddr('   '), 'https://elysium.cards'); eq(API.mpLiteAddr(undefined), 'https://elysium.cards');
});
test('v2.6.74/75: the welcome KRCG block and its two tutorial steps are gone; the Lite entry points, the tutorial switch and the Tournament-lock default are in the file', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  for (const dead of ['id="btnEmptyDB"', 'id="btnEmptyImg"', 'id="emptyKrcg"', "id:'intro-db'", "id:'intro-img'", "$('#btnEmptyDB')", "$('#btnEmptyImg')"])
    eq(html.indexOf(dead), -1, dead + ' should be gone (the database is on by default)');
  for (const live of ['id="modeToggle"', 'id="modeHint"', 'id="btnEmptyCreate"', 'id="btnEmptyJoin"', 'id="mpGsToggle"', 'id="offAlphaNote"', 'id="emptyPlayLine"', 'id="emptyPlayRow"', 'id="emptyToolRow"'])
    assert(html.indexOf(live) > 0, live + ' missing');
  assert(html.indexOf('body.lite #emptyToolRow, body.lite #emptyPlayLine, body.lite #btnEmptyOffline') > 0, 'v2.6.85: Lite hides the whole tool row (Settings / Deck Lab / Tutorial) -- the card is Create + Join');
  for (const live of [])
    assert(html.indexOf(live) > 0, live + ' missing');
  eq(html.indexOf('id="mpTournLock"'), -1, 'v2.6.116: the Tournament lock checkbox is gone -- the lock is always on');
  const ot = html.slice(html.indexOf('function openTutorial(){'), html.indexOf('function openTutorial(){') + 400);
  assert(/uiSetMode\('full'/.test(ot), 'openTutorial switches to Full (v2.6.75)');
  eq((html.match(/uiLift\(/g) || []).length, 0, 'the v2.6.74 presentation-only lift is gone');
  // every Lite-hidden welcome/lobby id is a tutorial target somewhere -> the switch is load-bearing, not decorative
  const i = html.indexOf('const TUT_SECTIONS = {'), j = html.indexOf('function tutVis(el)');
  const targets = html.slice(i, j);
  for (const id of ['btnEmptyDeckLab', 'btnEmptyCreate', 'btnEmptyOffline', 'lobImport'])
    assert(targets.indexOf("$('#" + id + "')") > 0, 'the tutorial still spotlights #' + id + ' -- the lift stays load-bearing');
});
test('v2.6.74/80: the Create/Join dialog -- two halves in both modes, the Game settings and Local server folds, Lite hides only .mpFull, the referee row', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const dlg = html.slice(html.indexOf('<div class="modal" id="mpModal">'), html.indexOf('<div class="modal" id="lobbyModal">'));
  for (const f of ['Server address', 'Server password'])
    assert(dlg.indexOf('<div class="mpfield mpFull mpSrv"><label>' + f + '</label>') > 0, f + ' lives in the Full-only Local server fold');
  assert(dlg.indexOf('<div class="mpfield mpFull mpSrv mpCreateOnly"><label>Server referee key</label><input id="mpAdmin"') > 0, 'the operator key (--create-policy admin) sits in the Local server fold, create side');
  assert(dlg.indexOf('<div class="mpfield mpCreateOnly mpGs mpFull"><label>Referee password</label><input id="mpRefRoom"') > 0, 'v2.6.83: the TABLE referee password is a Game settings field (Full)');
  for (const f of ['Match length', 'Reaction timer'])
    assert(dlg.indexOf('<div class="mpfield mpCreateOnly mpGs"><label>' + f + '</label>') > 0, f + ' folds under Game settings in both modes');
  for (const f of ['Board style', 'Helpers'])
    assert(dlg.indexOf('<div class="mpfield mpCreateOnly mpGs mpFull"><label>' + f + '</label>') > 0, f + ' folds under Game settings, Full only');
  assert(/tournLock:true,/.test(html) && !/#mpTournLock'\)\.checked/.test(html), 'v2.6.116: mpCreate sends tournLock:true for every room and nothing reads a checkbox');
  assert(/class="mpcheck mpCreateOnly mpGs"><input type="checkbox" id="mpChat" checked/.test(dlg) && /class="mpcheck mpCreateOnly mpGs"><input type="checkbox" id="mpSpecChat" checked/.test(dlg), 'chat folds in both modes');
  assert(/class="mpcheck mpJoinOnly"><input type="checkbox" id="mpSpect"/.test(dlg), 'spectator is join-only, both modes');
  assert(/class="mpcheck mpJoinOnly mpFull" id="mpRefRow"><input type="checkbox" id="mpRef"/.test(dlg), 'Join as referee: join-only, Full only');
  assert(/class="mpfield mpJoinOnly mpFull mpRefPass"><label>Referee password<\/label><input id="mpRefPass"/.test(dlg), 'the referee password row follows the checkbox');
  eq(dlg.indexOf('mpAnon'), -1, "'Hide my name' is parked (kodarkivering.md)");
  eq(dlg.indexOf('Admin password'), -1, 'Admin reads Referee everywhere in the dialog');
  assert(/id="mpGsToggle"/.test(dlg) && /id="mpSrvToggle"/.test(dlg), 'both fold buttons');
  assert(/class="btn primary mpJoinOnly" id="mpJoin"/.test(dlg) && /class="btn primary mpCreateOnly" id="mpCreate"/.test(dlg), 'the footer buttons follow their halves');
  assert(/id="mpRooms" class="mpJoinOnly"/.test(dlg) && /<div class="mpJoinOnly" style="margin:8px 0 4px"><button class="btn" id="mpBrowse"/.test(dlg), 'the room list is join-only');
  eq(dlg.indexOf('<p class="note mpFull">'), -1, 'the long note is gone');
  const css = html.slice(0, html.indexOf('<script'));
  for (const sel of ['body.lite #mpModal .mpFull', '#mpModal[data-mp="create"] .mpJoinOnly, #mpModal[data-mp="join"] .mpCreateOnly', '#mpModal:not(.gsOpen) .mpGs, #mpModal:not(.srvOpen) .mpSrv', '#mpModal:not(.refOn) .mpRefPass', 'body:not(.lite) .liteOnly'])
    assert(css.indexOf(sel) > 0, 'missing CSS gate: ' + sel);
  eq(html.indexOf('id="btnEmptyOnline"'), -1, 'Play online is gone from the start screen');
  assert(html.indexOf("{label:'Create game', fn:()=>openMP('create')},   // v2.6.80") > 0, 'Full menu: Create game / Join game');
});
test('v2.6.74: the new conv keys ride the B-63 dump as scalars (uiProf is an object and is skipped), within the 48-entry cap', () => {
  const F = loadClient(CLIENT); const c = F.conv;
  let n = 0; for (const k in c) { const v = c[k]; if (typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string') n++; }
  n += 2;                                                          // tutDoneN + localImgAuto ride too
  assert(n <= 48, 'dump.env.settings would exceed the server cap: ' + n);
  eq(typeof c.uiMode, 'string'); eq(typeof c.dbDefault, 'boolean'); eq(typeof c.modeHintDone, 'boolean'); eq(typeof c.uiProf, 'object');
});

/* === v2.6.76: cache-first catalog (one fetch a week, not one per start) + the reconnect guard === */
test('v2.6.76: vtesStale -- a cached catalog younger than a week is fresh, older or unstamped is stale', () => {
  const W = API.VTES_MAX_AGE_MS; eq(W, 7 * 24 * 3600 * 1000, 'a week');
  const now = 1_800_000_000_000;
  eq(API.vtesStale(now - 1000, now), false, 'just cached');
  eq(API.vtesStale(now - W + 1, now), false, 'six days and change');
  eq(API.vtesStale(now - W - 1, now), true, 'a week and a moment');
  eq(API.vtesStale(undefined, now), true, 'no timestamp (a pre-ts cache record) is stale');
  eq(API.vtesStale(0, now), true); eq(API.vtesStale('yesterday', now), true);
});
testA('v2.6.76: loadCardDB is cache-first -- with no IndexedDB it resolves to the fetch chain without throwing, and the source asks the cache BEFORE any fetch', async () => {
  const c = await API.vtesCached(); eq(c, null, 'no indexedDB under the harness reads as no cache, never a rejection');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const body = html.slice(html.indexOf('function loadCardDB(){'), html.indexOf('function _loadCardDBFetch(){'));
  assert(body.indexOf('vtesCached()') > 0 && body.indexOf('fetch(') < 0, 'loadCardDB itself never fetches -- the cache decides');
  assert(/conv\.jsonSync && vtesStale\(/.test(body), 'the network is asked only when sync is on AND the copy is stale');
  eq(html.indexOf('_loadCardDBNet'), -1, 'the old sync-off-only cache branch is gone (cache-first is unconditional now)');
  const refresh = html.slice(html.indexOf("$('#jsonDlBtn').addEventListener('click'"), html.indexOf("$('#jsonDlBtn').addEventListener('click'") + 300);
  assert(/fetchVtesJson\(\)/.test(refresh), 'the Settings Refresh button still forces a fetch');
});
test('v2.6.76: Join game in Lite does not auto-list rooms during a reconnect (it would replace the rejoin socket)', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const om = html.slice(html.indexOf('function openMP(flavor){'), html.indexOf("$('#mpCreate').addEventListener('click',mpCreate);"));
  assert(/_fl==='join' && net\.status!=='re'\) mpBrowse\(\)/.test(om), 'the auto-list is guarded on net.status !== re');
});

/* === v2.6.77: the ? explainer beside the pill === */
test('v2.6.77: the ? explainer toggles, opening it counts the first-visit welcome as seen, and the markup carries both bubble bodies', () => {
  const F = loadClient(CLIENT);
  eq(F.modeHelpOpen, false); eq(F.conv.modeHintDone, false, 'fresh: the welcome has not been seen');
  eq(F.modeHelpToggle(), true, 'click ? -> open'); eq(F.conv.modeHintDone, true, 'opening the explainer counts as having seen the welcome');
  eq(F.modeHelpToggle(), false, 'click ? again -> closed');
  eq(F.modeHelpToggle(true), true); eq(F.modeHelpToggle(false), false, 'explicit on/off (Got it, Esc)');
  eq(F.uiMode(), 'full', 'the explainer is not Lite-gated -- it opened in Full');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  for (const id of ['id="modeHelp"', 'id="modeHintMore"', 'id="modeHintClose"', 'class="mhShort"', 'class="mhLong"', 'id="modeCtl"']) assert(html.indexOf(id) > 0, id + ' missing');
  assert(html.indexOf('Welcome to Elysium') > 0 && html.indexOf('perfect for getting a game going right away') > 0, 'the compact first-visit wording');
  assert(html.indexOf("if(e.key==='Escape' && _modeHelpOpen)") > 0, 'Esc closes the explainer');
});

/* === v2.6.78: Full tables tagged in the room list, Lite-shaped first in Lite === */
test('v2.6.78: roomIsLiteShaped / roomTags / roomFullNote -- only a Structured board or forced-on helpers deviate; an old server (no keys) is Lite-shaped', () => {
  const A = { room:'a', board:'classic', helpers:'tournament' }, B = { room:'b', board:'structured', helpers:'tournament' };
  const C = { room:'c', board:'classic', helpers:'all' }, D = { room:'d', board:'classic', helpers:'local' }, E = { room:'e' };
  eq(API.roomIsLiteShaped(A), true); eq(API.roomIsLiteShaped(B), false); eq(API.roomIsLiteShaped(C), false);
  eq(API.roomIsLiteShaped(D), true, "a 'local' policy is Lite-shaped in effect -- the Lite player's own tournament setting applies");
  eq(API.roomIsLiteShaped(E), true, 'a pre-2.6.33 server sends no keys: never tagged, never shouted at');
  eq(JSON.stringify(API.roomTags(A)), '[]'); eq(JSON.stringify(API.roomTags(B)), '["Structured"]'); eq(JSON.stringify(API.roomTags(C)), '["Helpers on"]');
  eq(JSON.stringify(API.roomTags({ board:'structured', helpers:'all' })), '["Structured","Helpers on"]'); eq(JSON.stringify(API.roomTags(E)), '[]');
  eq(API.roomFullNote(A), ''); assert(/Joining a Full table/.test(API.roomFullNote(B)) && /structured/.test(API.roomFullNote(B)), 'the Lite join toast names the deviation');
});
test('v2.6.78: roomListOrder -- Full keeps the server order; Lite puts Lite-shaped tables first inside the lobby / playing groups, stably', () => {
  const rooms = [ { room:'L1', started:false, board:'structured', helpers:'all' }, { room:'L2', started:false, board:'classic', helpers:'tournament' },
                  { room:'L3', started:false, board:'classic', helpers:'all' }, { room:'L4', started:false, board:'classic', helpers:'local' },
                  { room:'P1', started:true, board:'structured' }, { room:'P2', started:true, board:'classic', helpers:'tournament' } ];
  const names = (l) => l.map(r => r.room).join(',');
  eq(names(API.roomListOrder(rooms, false)), 'L1,L2,L3,L4,P1,P2', 'Full: untouched');
  eq(names(API.roomListOrder(rooms, true)), 'L2,L4,L1,L3,P2,P1', 'Lite: Lite-shaped first within each group, original order otherwise');
  eq(rooms[0].room, 'L1', 'the input array is not mutated');
  eq(names(API.roomListOrder([], true)), ''); eq(names(API.roomListOrder(undefined, true)), '');
});

/* === v2.6.79: the lobby is a lobby -- in-game chrome hides on an idle table === */
test('v2.6.79: tableIdle -- empty table + no hotseat game + no room = idle; a room or a card on the table ends it; the CSS gate and both call sites exist', () => {
  const F = loadClient(CLIENT);
  eq(F.tableIdle(), true, 'fresh boot: the start-screen lobby');
  F.syncIdleUI();                                                  // must not throw under the stubs
  F.net.status = 'in'; eq(F.tableIdle(), false, 'in a room (even the lobby stage) the chrome is back'); F.net.status = 'off';
  eq(F.tableIdle(), true);
  F.state.cards.set('x1', { id:'x1', zone:'hand' }); eq(F.tableIdle(), false, 'a solo-loaded deck is a table again'); F.state.cards.delete('x1');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf('body.idle aside, body.idle #playedTab, body.idle #readyTab, body.idle #statsDock, body.idle #phases, body.idle #btnTarget, body.idle #btnHoldOn, body.idle #btnDecide, body.idle #btnUndo, body.idle #deckName{display:none !important}') > 0, 'the idle CSS gate (v2.6.84: + the Table tab/dock)');
  eq(html.indexOf('body.idle #btnMenu'), -1, 'Menu is never hidden');
  const lay = html.slice(html.indexOf('function layout(){'), html.indexOf('function layout(){') + 80);
  assert(/syncIdleUI\(\)/.test(lay), 'layout() syncs the lobby chrome');
  const sw = html.slice(html.indexOf('function syncWelcome(){'), html.indexOf('function syncWelcome(){') + 1200);
  assert(/syncIdleUI\(\)/.test(sw), 'syncWelcome() syncs it too');
  // the tutorial spotlights header tools only inside chapters that run on a live table (the classic ones and the lobby chapter after Start) -- never on the idle welcome
  const intro = html.slice(html.indexOf('  introduction: {'), html.indexOf('  decklab: {'));
  for (const id of ['btnTarget', 'btnHoldOn', 'btnDecide', 'btnUndo', 'playedTab', 'readyTab', 'statsTab', 'phases', 'asideToggle']) eq(intro.indexOf("$('#" + id + "')"), -1, 'the introduction chapter must not spotlight #' + id + ' (hidden at the lobby)');
});

/* === v2.6.80: Create / Join in Full, folds, referee === */
test('v2.6.80/83: mpSetFlavor / mpFold / mpRefSync -- flavours in both modes, a referee is a spectator with the room key on the join, the list request carries no key, the client gates open for net.isRef', () => {
  const F = loadClient(CLIENT);
  eq(F.mpSetFlavor('join'), undefined); eq(F.mpFold('gs', true), true); eq(F.mpFold('gs', false), false); eq(F.mpFold('srv', true), true);   // explicit on/off (the fold state lives on the modal element; the harness classList is write-only, so toggle semantics are a browser check)
  F.mpSetFlavor('create');
  F.mpRefSync();                                                    // must not throw; the checkbox stub is written, not read
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const j = html.slice(html.indexOf('function mpJoin(){'), html.indexOf('function mpJoin(){') + 1400);
  assert(/spect:\(_ref\?true:\$\('#mpSpect'\)\.checked\)/.test(j), 'a referee joins as spectator, always');
  assert(/refPass:_ref\|\|undefined/.test(j) && j.indexOf("t:'hello'") < 0, 'v2.6.83: the room referee password rides the join itself, never a hello');
  eq(j.indexOf('anon:'), -1, 'anon is gone from join');
  const c = html.slice(html.indexOf('function mpCreate(){'), html.indexOf('function mpJoin(){'));
  eq(c.indexOf('anon:'), -1, 'anon is gone from create');
  const rl = html.slice(html.indexOf('  roomList(m){'), html.indexOf('  roomList(m){') + 1600);
  assert(/r\.ref\?' <span title="This table has a referee password">/.test(rl), 'v2.6.83: rooms with a referee password carry the scale in the list');
  eq(rl.indexOf('net.srvRef'), -1, 'the srv-2.6.34 server-level flag is gone');
  for (const gate of ["(inRoom() && (net.isHost||net.isRef))", "if(net.isHost||net.isRef){", "const _isHost = localTable || (inRoom() && (net.isHost||net.isRef))", "net.spect=!!m.spect; net.isRef=!!m.ref;"]) assert(html.indexOf(gate) > 0, 'v2.6.83 client gate missing: ' + gate);
  const b = html.slice(html.indexOf('function mpBrowse(){'), html.indexOf('function mpBrowse(){') + 900);
  assert(b.indexOf('admin:') < 0 && b.indexOf("$('#mpAdmin')") < 0 && b.indexOf("$('#mpRefPass')") < 0, 'v2.6.82/83: the list request carries NO key (a stale wrong key would strike the IP on every automatic listing)');
  assert(/refPass:\$\('#mpRefRoom'\)\.value\|\|undefined/.test(c), 'v2.6.83: create sends the table referee password');
  assert(/if\(\$\('#mpRef'\)\.checked && !_ref\)\{ toast\('Enter the referee password'\)/.test(j), 'v2.6.82: referee ticked with an empty key toasts, never a silent spectator join');
});
test('v2.6.80: the online tutorial chapters target only fields that live in the half they open, and open folds before spotlighting folded fields', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const dlg = html.slice(html.indexOf('<div class="modal" id="mpModal">'), html.indexOf('<div class="modal" id="lobbyModal">'));
  const half = (id) => { const m = dlg.match(new RegExp('<[a-z]+ class="([^"]*)"[^>]*id="' + id + '"')); if (m) return m[1]; const m2 = dlg.match(new RegExp('class="([^"]*)"><label>[^<]*</label><(?:input|select) id="' + id + '"')); return m2 ? m2[1] : ''; };
  const steps = (sec) => { const i = html.indexOf("  '" + sec + "': {"); const j = html.indexOf('\n  },\n', i); return html.slice(i, j); };
  const joinSteps = steps('online-join'), hostSteps = steps('online-hosting');
  for (const id of ['mpAddr', 'mpName', 'mpBrowse', 'mpRoom', 'mpSrvPass', 'mpSpect']) assert(joinSteps.indexOf("$('#" + id + "')") > 0, 'join chapter spotlights #' + id);
  assert(joinSteps.indexOf("mpSetFlavor('join')") > 0, 'join chapter opens the Join half');
  eq(half('mpSpect').indexOf('mpCreateOnly'), -1, 'nothing join-only is create-only');
  for (const id of ['mpAddr', 'mpSrvPass']) assert(half(id).indexOf('mpSrv') >= 0 && joinSteps.indexOf("onEnter:function(){ mpFold('srv', true); }") > 0, '#' + id + ' is in the Local server fold and the chapter opens it');
  assert(hostSteps.indexOf("mpSetFlavor('create')") > 0 && hostSteps.indexOf("mpFold('gs', true)") > 0 && hostSteps.indexOf("mpFold('srv', true)") > 0, 'host chapter opens the Create half and both folds');
  for (const id of ['mpTime', 'mpBoard', 'mpHelpers', 'mpRefRoom', 'mpChat', 'mpCreate']) assert(hostSteps.indexOf("$('#" + id + "')") > 0, 'host chapter spotlights #' + id);
  eq(hostSteps.indexOf("oh-tournlock"), -1, 'v2.6.116: no tutorial stop for a checkbox that no longer exists');
  assert(hostSteps.indexOf('Tournament lock</b> (the') > 0, 'the lock is explained in the Helpers stop instead');
  eq(hostSteps.indexOf("$('#mpAdmin')"), -1, 'v2.6.83: the operator key is not a tutorial stop any more (the table referee password is)');
  eq(hostSteps.indexOf("$('#mpBrowse')"), -1, 'the host chapter no longer spotlights the room list (join-only now)');
  assert(hostSteps.indexOf("{ id:'oh-join'") > 0 && hostSteps.slice(hostSteps.indexOf("{ id:'oh-join'")).indexOf("mpSetFlavor('join')") > 0, 'oh-join switches to the Join half before spotlighting #mpJoin');
  eq(html.indexOf("target:()=>$('#btnEmptyOnline')"), -1, 'no chapter targets the retired Play online button');
});

/* === v2.6.86: the Settings overhaul === */
test('v2.6.86: Settings -- five sections, every control id still present exactly once, an Advanced fold per section (button immediately before its box), and no description over 100 characters', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const m = html.slice(html.indexOf('<div class="modal" id="settingsModal">'), html.indexOf('<div class="modal" id="logModal">'));
  eq((m.match(/class="set-section"/g) || []).length, 6, 'six sections (v2.6.87: + Fixed controls at the bottom)');
  for (const h of ['Table', 'Play helpers', 'Files &amp; storage', 'Sound', 'Shortcuts', 'Fixed controls', 'Table policy (host)']) assert(m.indexOf('>' + h + '</div>') > 0, 'section heading ' + h);
  const ids = ['convCardDB', 'jsonCacheInfo', 'jsonDlBtn', 'jsonFileBtn', 'jsonFile', 'jsonSyncToggle', 'imgCacheToggle', 'localImgHelpBtn', 'localImgToggle', 'localImgHelp', 'imgSyncRow', 'imgSyncToggle', 'imgFmt', 'imgDlAll', 'imgDlDeck', 'imgDlGame', 'imgProgressRow', 'imgProgressText', 'imgProgressBar', 'imgCancel', 'imgCacheInfo', 'imgPersist', 'imgClear', 'imgPersistInfo', 'imgPersistText', 'storageSaveInfo', 'storageSaveClear', 'autosaveMode', 'storageDeckInfo', 'storageDeckClear', 'storageSettingsInfo', 'storageSettingsReset', 'storageTotalInfo', 'storageNuke', 'convLegalDeck', 'convLegalCards', 'helperBanner', 'convTournament', 'helperOn', 'helperUnlock', 'helperCounts', 'helperPass', 'helperWarn', 'helperEdge', 'helperHand', 'helperHandReminder', 'helperPathBlood', 'helperResBlock', 'helperResVote', 'helperResCombat', 'helperModeChoice', 'helperHostBox', 'helperTournament', 'helperAllowLocal', 'convPredator', 'convAutoLock', 'convEdgeToken', 'convCardTip', 'convErrPing', 'convHoverPreview', 'convShowWelcome', 'convL3collapse', 'convPlayedSort', 'convAvrResolveClear', 'convAnim', 'animSpeedDn', 'animSpeedVal', 'animSpeedUp', 'convDrawClick', 'convDockDrag', 'convTouchUI', 'convPco', 'convPcoNeutral', 'convPoolColor', 'brightness', 'brightVal', 'uiBrightness', 'uiBrightVal', 'sfxVol', 'sfxVolVal', 'sfxAdvGrid', 'setMouse', 'convShiftPeek', 'setBasic', 'advToggle', 'setAdv', 'keysReset', 'settingsSave', 'settingsLoad', 'settingsClose'];
  for (const id of ids) eq((m.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, 'control #' + id + ' exactly once');
  eq((m.match(/class="btn set-advbtn"/g) || []).length, 5, 'four Advanced folds + the Fixed controls fold (Shortcuts keeps its own advanced toggle)');
  assert(m.indexOf('data-label="Show fixed controls"') > 0 && m.lastIndexOf('class="set-section"') < m.indexOf('>Fixed controls</div>'), 'v2.6.87: Fixed controls is the LAST section and carries its own fold label');
  eq((m.match(/class="btn set-advbtn"[^>]*>[^<]*<\/button>\s*<div class="set-adv" hidden>/g) || []).length, 5, 'each fold button is immediately followed by its box (setAdvToggle reads nextElementSibling)');
  const sls = (m.match(/<span class="sl"[^>]*>[\s\S]*?<\/span>/g) || []).map(x => x.replace(/<[^>]+>/g, '').replace(/&[a-z]+;|&#\d+;/g, 'x').trim());
  assert(sls.length >= 50, 'the rows are there: ' + sls.length);
  const long = sls.filter(t => t.length > 100);
  eq(long.length, 0, 'every description is one short line: ' + JSON.stringify(long));
  assert(html.indexOf('.set-adv[hidden]{display:none}') > 0, 'the class-beats-[hidden] guard for the fold box');
  assert(html.indexOf("document.querySelectorAll('#settingsModal .set-advbtn').forEach(b=>b.addEventListener('click',()=>setAdvToggle(b)))") > 0, 'the fold buttons are wired');
  eq(API.setAdvToggle(null), false, 'a missing button/box is a no-op');
});

/* === v2.6.88: three basic shortcuts + the ? text === */
test('v2.6.88: Target, Lock/unlock selected and Discard hovered card are basic shortcuts (still T / L / X); the ? explainer carries the new wording', () => {
  const A = API.ACTIONS; assert(Array.isArray(A) && A.length > 20, 'ACTIONS exposed');
  const by = {}; for (const a of A) by[a.id] = a;
  for (const [id, key] of [['target', 'T'], ['lockSel', 'L'], ['ashHover', 'X']]) { eq(by[id].grp, 'basic', id + ' is basic'); eq(by[id].def, key, id + ' keeps its default key'); }
  eq(A.filter(a => a.grp === 'basic').length, 8, 'eight basic rows (5 + the 3 promoted)');
  eq(A.filter(a => a.id === 'target').length, 1, 'no duplicate rows after the move');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf('online play on a Classic open table with imported decks') > 0 && html.indexOf('engage with the more unique aspects of the client') > 0, 'the ? explainer wording');
});

/* === v2.6.89: dialogs fit the window === */
test('v2.6.89/90: every modal body can shrink inside the 84vh flex column, the welcome card scrolls, and the ? explainer is a fixed bubble clamped to the viewport', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const css = html.slice(0, html.indexOf('<script'));
  assert(/\.modal \.mbody, #labLoadModal \.mbody\{[^}]*flex:1 1 auto; min-height:0/.test(css), 'mbody: flex + min-height:0 (a flex child defaults to min-height:auto and refuses to shrink)');
  assert(/\.modal, #labLoadModal\{\s*width:min\(680px, 92vw\); max-height:84vh; display:none; flex-direction:column;/.test(css), 'the modal cap is still 84vh in a flex column');
  assert(/#empty\{[^}]*overflow:auto/.test(css) && /#empty \.inner\{position:relative; max-height:calc\(100% - 32px\); overflow:auto/.test(css), 'the welcome card scrolls rather than bleeding');
  assert(/#modeHint\{position:fixed; width:282px; max-width:calc\(100vw - 16px\); overflow:auto;/.test(css), 'v2.6.90: the explainer is a fixed bubble clamped to the viewport');
  assert(html.indexOf("window.addEventListener('resize', modeHintPlace);") > 0 && /function modeHintPlace\(\)/.test(html), 'modeHintPlace exists and follows resizes');
  const empty = html.slice(html.indexOf('<div id="empty">'), html.indexOf('</main>'));
  assert(empty.indexOf('<div id="modeHint"') > empty.indexOf('id="emptyHide"'), 'the bubble lives in #empty AFTER the card (outside its backdrop-filter, which would pin a fixed child)');
});

/* === v2.6.91: the Settings header names the mode + Reset to the mode's defaults; the offline 1v1 find === */
test('v2.6.91: settingsDefaults -- Full IS the literal, Lite differs only in UI_PRESET\'s trio, the profile shape is complete', () => {
  const F = API.settingsDefaults('full'), L = API.settingsDefaults('lite');
  for (const k of API.SETTINGS_CONV_KEYS) eq(F.conv[k], API.CONV_DEFAULTS[k], 'Full default for conv.' + k + ' is the literal');
  eq(JSON.stringify(API.settingsDiff(F, L).sort()), JSON.stringify(['conv.anim', 'conv.pco']), 'the two modes differ in anim + pco only (sfxVol is 0 in both presets)');
  eq(L.conv.anim, API.UI_PRESET.lite.anim); eq(L.conv.pco, API.UI_PRESET.lite.pco); eq(L.conv.sfxVol, API.UI_PRESET.lite.sfxVol);
  eq(F.brightness, 100); eq(F.uiBrightness, 100); eq(F.autosave, 'minute');
  eq(Object.keys(F.helper).length, API.HELPER_DEFS.length, 'every helper flag'); eq(Object.keys(F.keys).length, API.ACTIONS.length, 'every shortcut');
  assert(Object.keys(F.sfx).length >= 8 && F.sfx.unlock === 150 && F.sfx.playCard === 100, 'the per-channel sound defaults (effective values, not the sparse literal)');
  eq(API.settingsDefaults('garbage').conv.anim, 'on', 'an unknown mode reads as Full');
});
test('v2.6.91: a fresh boot is at the Full defaults; every kind of deviation registers as exactly one dotted path; effective sound levels compare, not the sparse map', () => {
  const A = loadClient(CLIENT);
  eq(A.uiMode(), 'full', 'localhost boots in Full'); eq(A.settingsIsCustom(), false, 'a fresh install is not custom');
  eq(A.settingsDiff(A.settingsProfile(), A.settingsDefaults('full')).length, 0);
  A.conv.sfxVol = 50; eq(JSON.stringify(A.settingsDiff(A.settingsProfile(), A.settingsDefaults('full'))), JSON.stringify(['conv.sfxVol'])); A.conv.sfxVol = 0;
  A.conv.sfxIndiv = { unlock: 150, lock: 150, logEvent: 125 }; eq(A.settingsIsCustom(), false, 'the literal sparse map IS the default profile');
  A.conv.sfxIndiv = {}; eq(A.settingsIsCustom(), false, 'an empty map too');
  A.conv.sfxIndiv = { unlock: 100 }; eq(JSON.stringify(A.settingsDiff(A.settingsProfile(), A.settingsDefaults('full'))), JSON.stringify(['sfx.unlock'])); A.conv.sfxIndiv = {};
  A.helper.counts = false; eq(JSON.stringify(A.settingsDiff(A.settingsProfile(), A.settingsDefaults('full'))), JSON.stringify(['helper.counts'])); A.helper.counts = true;
  const a0 = A.ACTIONS[0]; A.keyBinds[a0.id] = 'Q'; eq(JSON.stringify(A.settingsDiff(A.settingsProfile(), A.settingsDefaults('full'))), JSON.stringify(['keys.' + a0.id])); A.keyBinds[a0.id] = a0.def;
  A.conv.animSpeed = 1.1; eq(JSON.stringify(A.settingsDiff(A.settingsProfile(), A.settingsDefaults('full'))), JSON.stringify(['conv.animSpeed']));
  A.conv.animSpeed = 1.0000000001; eq(A.settingsIsCustom(), false, 'float noise is not a deviation'); A.conv.animSpeed = 1.0;
  A.conv.uiMode = 'lite'; eq(A.uiMode(), 'lite'); eq(A.settingsIsCustom(), true, 'the Full trio under the Lite label is custom (anim on / pco mine vs the Lite preset)');
  eq(JSON.stringify(A.settingsDiff(A.settingsProfile(), A.settingsDefaults('lite')).sort()), JSON.stringify(['conv.anim', 'conv.pco']));
});
test('v2.6.91: settingsApplyProfile restores a mode\'s defaults LIVE and persists every store; Reset is refused while a lobby or table is live', () => {
  const A = loadClient(CLIENT);
  A.conv.uiMode = 'lite';
  A.conv.sfxVol = 80; A.conv.sfxIndiv = { oust: 20 }; A.helper.warn = false; A.conv.cardTip = false; A.keyBinds[A.ACTIONS[1].id] = 'F9';
  assert(A.settingsDiff(A.settingsProfile(), A.settingsDefaults('lite')).length >= 6, 'deviations in place');
  A.settingsApplyProfile(A.settingsDefaults('lite'));
  eq(A.settingsIsCustom(), false, 'back at the Lite defaults');
  eq(A.conv.anim, 'all'); eq(A.conv.pco, 'all'); eq(A.conv.sfxVol, 0); eq(A.helper.warn, true); eq(A.conv.cardTip, true); eq(A.keyBinds[A.ACTIONS[1].id], A.ACTIONS[1].def);
  eq(JSON.stringify(A.conv.sfxIndiv), '{}', 'the per-channel map is cleared (defaults are implicit)');
  eq(A.brightVal, 100); eq(A.uiBrightVal, 100); eq(A.autoSaveMode, 'minute');
  eq(A.conv.uiMode, 'lite', 'the mode itself is untouched'); eq(A.conv.dbDefault, true, 'and so is the migration flag');
  const st = A.settingsApplyProfile.toString();
  assert(/saveConv\(\)/.test(st) && /saveHelper\(\)/.test(st) && /saveKeys\(\)/.test(st) && /BRIGHT_KEY/.test(st) && /UI_BRIGHT_KEY/.test(st) && /AUTOSAVE_KEY/.test(st), 'every store is written');
  assert(/applyPco\(\)/.test(st) && /applyTouchUI\(\)/.test(st) && /applyHelper\(\)/.test(st) && /syncHelperUI\(\)/.test(st) && /rebuildKeymap\(\)/.test(st) && /applyBrightness\(\)/.test(st) && /applyUiBrightness\(\)/.test(st) && /applyAutosaveMode\(\)/.test(st) && /animMode=conv\.anim/.test(st), 'the live apply chain runs (no reload)');
  const custom = A.settingsDefaults('lite'); custom.brightness = 130; custom.autosave = 'off';
  A.settingsApplyProfile(custom); eq(A.brightVal, 130); eq(A.autoSaveMode, 'off');
  eq(JSON.stringify(A.settingsDiff(A.settingsProfile(), A.settingsDefaults('lite')).sort()), JSON.stringify(['autosave', 'brightness']));
  eq(A.settingsResetBlocked(), false, 'idle: Reset allowed'); eq(A.settingsResetWhy(), '', 'no reason when allowed');
  A.net.lobby = true; eq(A.settingsResetBlocked(), true, 'a live lobby blocks it'); eq(A.settingsResetWhy(), 'Leave the game or lobby first'); A.net.lobby = false;
  A.startHotseat([{ name: 'A', deckText: 'Crypt:\n12x Tupdog\nLibrary:\n60x Computer Hacking\n' }, { name: 'B', deckText: 'Crypt:\n12x Tupdog\nLibrary:\n60x Computer Hacking\n' }], 'structured');
  eq(A.settingsResetBlocked(), true, 'a live hotseat blocks it (it overrides conv.tournament for the session)');
});
test('v2.6.91: the Settings header markup + wiring -- tag and Reset in the h3, the delegated re-read, saveKeys and openSettings paint it', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const m = html.slice(html.indexOf('<div class="modal" id="settingsModal">'), html.indexOf('<div class="modal" id="logModal">'));
  assert(/<h3 class="set-h3">Settings<span id="setModeTag" class="set-modetag">[^<]*<\/span><button class="btn set-reset" id="setReset" type="button"/.test(m), 'the header: title, mode tag, Reset');
  eq((m.match(/id="setModeTag"/g) || []).length, 1); eq((m.match(/id="setReset"/g) || []).length, 1);
  assert(/\.set-h3\{display:flex; align-items:center; gap:10px\}/.test(html) && /\.set-reset\{margin-left:auto;/.test(html), 'flex header, Reset pushed right');
  assert(html.indexOf("['input','change','click'].forEach(ev=>$('#settingsModal').addEventListener(ev, settingsHeadSync));") > 0, 'the delegated re-read');
  assert(/function saveKeys\(\)\{[^\n]*settingsHeadSync\(\);/.test(html), 'a key rebinding (a document keydown) repaints the header through saveKeys');
  assert(/buildSfxAdvGrid\(\);\n  settingsHeadSync\(\);[^\n]*\n  openOverlay\('settingsModal'\);/.test(html), 'openSettings paints the header before showing the dialog');
  assert(html.indexOf("$('#setReset').addEventListener('click', settingsResetToMode);") > 0, 'Reset is wired');
  assert(/async function settingsResetToMode\(\)\{\n  \{ const why=settingsResetWhy\(\); if\(why\)\{ toast\(why\); return false; \} \}\n  stopListen\(\);/.test(html) && /await uiConfirm\('Reset every setting in this dialog to the '/.test(html), 'Reset honours the guard, drops a half-finished rebinding, then asks');
  eq(typeof API.settingsHeadSync(), 'undefined', 'settingsHeadSync runs under the stub without throwing');
});
test('v2.6.91 (Johan\'s 1v1 find): offlineSeatSet writes the field AND re-syncs Start -- a deck picked after toggling a bot enables the table; every seat-row listener routes through it', () => {
  API.storeDeck('Duel Deck', 'Crypt:\n12x Tupdog\nLibrary:\n60x Computer Hacking\n');
  const di = API.loadDecks().findIndex(d => d.name === 'Duel Deck'); assert(di >= 0, 'fixture deck saved');
  API.offlineCfg = [{ name: 'You', deckIdx: -1 }, { name: 'Bram', deckIdx: -1, botP: 'experienced' }];   // bot toggled FIRST (the re-render that happens there paints 'Pick a deck for: You')
  const r0 = API.offlineReady(); eq(r0.ok, false); assert(/Pick a deck for: You/.test(r0.why));
  const r1 = API.offlineSeatSet(0, 'deckIdx', di);                                                    // then the deck -- the listener path that used to stop at the assignment
  eq(r1.ok, true, 'the readiness the button/hint were painted from'); eq(API.offlineCfg[0].deckIdx, di, 'the field is written');
  eq(API.offlineReady().ok, true, '1v1 human vs bot is ready');
  const r2 = API.offlineSeatSet(1, 'name', 'Zed'); eq(API.offlineCfg[1].name, 'Zed'); eq(r2.ok, true, 'a name edit re-syncs too (the hint names seats)');
  API.offlineSeatSet(1, 'botDeckKey', 'nosferatu'); eq(API.offlineCfg[1].botDeckKey, 'nosferatu');
  eq(API.offlineSeatSet(7, 'deckIdx', 0).ok, true, 'an out-of-range row is a no-op that still reports readiness');
  eq(API.offlineSeatSet(0, 'deckIdx', -1).ok, false, 'un-picking the deck disables Start again');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  for (const p of ["nm.addEventListener('input',()=>offlineSeatSet(i,'name',nm.value))", "sel.addEventListener('change',()=>offlineSeatSet(i,'botDeckKey',sel.value))", "sel.addEventListener('change',()=>offlineSeatSet(i,'deckIdx',+sel.value))"]) assert(html.indexOf(p) > 0, 'listener routes through offlineSeatSet: ' + p.slice(0, 40));
  assert(!/offlineCfg\[i\]\.(deckIdx|name|botDeckIdx|botDeckKey)=/.test(html), 'no seat-row listener writes offlineCfg directly any more');
  API.offlineCfg = [];
});

/* === v2.6.92: the Tournament override is a session === */
test('v2.6.92: hotTournSession snapshots the player\'s own conv.tournament, the table runs on the override, leaveHotseat restores it -- so the next saveConv cannot persist the table\'s value; a deliberate mid-table edit survives', () => {
  const A = loadClient(CLIENT);
  const deck = 'Crypt:\n12x Tupdog\nLibrary:\n60x Computer Hacking\n';
  eq(A.conv.tournament, true, 'the stored default'); eq(A.hotTournBefore, null, 'no override in force');
  A.hotTournSession(false);                                   // a Structured hotseat with 'Your local settings'
  eq(A.conv.tournament, false, 'the table runs without tournament mode'); eq(A.hotTournBefore, true, 'the player\'s own value is remembered');
  A.hotTournSession(false); eq(A.hotTournBefore, true, 'a second call does not overwrite the snapshot with the override');
  A.startHotseat([{ name: 'A', deckText: deck }, { name: 'B', deckText: deck }], 'structured');
  assert(A.settingsDiff(A.settingsProfile(), A.settingsDefaults('full')).indexOf('conv.tournament') >= 0, 'during the table the v2.6.91 header would read (custom) -- and Reset is blocked there');
  A.leaveHotseat();
  eq(A.conv.tournament, true, 'restored on leave'); eq(A.hotTournBefore, null, 'and the snapshot is cleared');
  eq(A.settingsIsCustom(), false, 'the header reads plain Full mode again');
  eq(A.hotTournRestore(), false, 'restore with nothing in force is a no-op');
  A.hotTournSession(true); A.conv.tournament = false;         // the Settings checkbox flipped DURING the table (its handler mirrors the edit into the snapshot)
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("$('#convTournament').addEventListener('change',e=>{ conv.tournament=e.target.checked; if(hotTournBefore!==null) hotTournBefore=conv.tournament; saveConv();") > 0, 'the checkbox handler updates the snapshot while an override is in force');
  A.hotTournRestore();
  assert(html.indexOf("    hotTournSession(hmEl.value==='tournament');") > 0, 'startOfflineFromCfg routes through it');
  assert(html.indexOf("    hotTournSession(true);") > 0 && html.indexOf("  if((d.boardMode||'classic')==='classic') hotTournSession(true);") > 0, 'the fresh AND the resumed Classic tutorial route through it');
  assert(/helperAllOn=false; hotTournRestore\(\); syncHelperUI\(\);/.test(html), 'leaveHotseat restores');
  const bare = (html.match(/conv\.tournament\s*=/g) || []).length;
  eq(bare, 5, 'the only bare writes left: the loader, the import, the Settings checkbox, and the two inside hotTournSession/hotTournRestore');
});

/* === v2.6.93: the bot lock — bots force Structured + All helpers on, greyed out === */
test('v2.6.93 (Johan): syncOffBotLock code wiring -- renderOfflineSeats AND openOffline call it; the function forces Structured + All helpers on + disables both; the unlock path restores the pre-bot values + re-enables; the _preBotVal snapshot is idempotent', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf('syncOffBotLock();                                              // v2.6.93: every re-render checks the bot lock') > 0, 'called in renderOfflineSeats');
  assert(html.indexOf('syncOffBotLock();                                              // v2.6.93: if bots survived from last modal open, lock immediately') > 0, 'called in openOffline');
  assert(html.indexOf("board.value='structured'; helpers.value='all'; board.disabled=true; helpers.disabled=true;") > 0, 'the lock: force values + disable');
  assert(html.indexOf("board.disabled=false; helpers.disabled=false;") > 0, 'the unlock: re-enable');
  assert(/if\(!board\._preBotVal\) board\._preBotVal=board\.value;/.test(html), 'snapshot only ONCE (idempotent -- a second bot does not overwrite the pre-bot choice with the forced value)');
  assert(/if\(board\._preBotVal\)\{ board\.value=board\._preBotVal; board\._preBotVal=null; \}/.test(html), 'restore + clear on unlock');
  assert(/if\(helpers\._preBotVal\)\{ helpers\.value=helpers\._preBotVal; helpers\._preBotVal=null; \}/.test(html), 'helpers too');
  assert(/const anyBot=offlineCfg\.some\(q=>q&&q\.botP\);/.test(html), 'the guard reads the live offlineCfg');
  const A = loadClient(CLIENT);
  A.offlineCfg = [{ name: 'A', deckIdx: -1 }]; A.syncOffBotLock();  // call-safety under the stub (no bots)
  A.offlineCfg = [{ name: 'A', deckIdx: -1, botP: 'novice' }]; A.syncOffBotLock();  // call-safety with a bot
  A.offlineCfg = [];
});
test('v2.6.93: the board-style change listener still goes through syncOffTournament (the board→helpers default); the #offBoard listener is NOT disabled in code (only the element)', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/\$\('#offBoard'\)\.addEventListener\('change',\s*syncOffTournament\)/.test(html), 'the listener is still wired');
  assert(!/removeEventListener.*syncOffTournament/.test(html), 'it is never removed (disabling the element is enough)');
});
test('v2.6.93: startOfflineFromCfg reads #offBoard and #offHelpers — the forced values ARE what the table starts with when bots are present (no special-case needed in the start path)', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/const boardMode=\$\('#offBoard'\)\?\$\('#offBoard'\)\.value:'structured';/.test(html), 'boardMode comes from the select (locked to structured when a bot is present)');
  assert(/const hmEl=\$\('#offHelpers'\)/.test(html), 'helpers come from the select (locked to all when a bot is present)');
});

/* === v2.6.94: say bubble clamp — text wraps and scales instead of spilling outside the board === */
test('v2.6.94 (Johan): .sayb has max-width + word-wrap instead of white-space:nowrap; .saytxt and .saywho use clamp() for responsive font size', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(!/\.sayb\{[^}]*white-space:\s*nowrap/.test(html), '.sayb must NOT have white-space:nowrap (it caused long bot chat to spill outside the board)');
  assert(/\.sayb\{[^}]*max-width:\s*min\(92vw,\s*92%\)/.test(html), '.sayb has a max-width clamp (viewport + parent)');
  assert(/\.sayb\{[^}]*overflow-wrap:\s*break-word/.test(html), '.sayb wraps long words');
  assert(/\.saytxt\{[^}]*clamp\(\s*22px,\s*4\.5vw,\s*58px\s*\)/.test(html), '.saytxt font scales via clamp(22px, 4.5vw, 58px)');
  assert(/\.saywho\{[^}]*clamp\(\s*12px,\s*1\.4vw,\s*18px\s*\)/.test(html), '.saywho font scales via clamp(12px, 1.4vw, 18px)');
});
test('v2.6.94/v2.6.107: chatBubble clamps (180 chars since the chat tier) and still delegates to sayBubble', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/raw\.length>180/.test(html), 'v2.6.107: was 120 -- a readable column fits more without stretching, and the log keeps the full line either way');
  assert(html.indexOf("try{ sayBubble(sayLabel(st, who), who, st, t, 'chat'); }catch(e){}") > 0, 'chatBubble delegates to sayBubble, now asking for the chat variant -- one mounting path, not two');
});

/* === v2.6.95: the hotseat broadcast bus === */
test('v2.6.95: hotFanOut reaches every seat EXCEPT the sender, and stays silent when there is no local table', () => {
  const A = loadClient(CLIENT);
  const HB = A.hotBridge;
  HB.reset([{ name: 'You' }, { name: 'B1', bot: true }, { name: 'B2', bot: true }]);
  const got = { 2: [], 3: [] };
  HB.seats[2] = { cb: { msg: j => got[2].push(JSON.parse(j)) } };
  HB.seats[3] = { cb: { msg: j => got[3].push(JSON.parse(j)) } };
  A.localTable = false;
  A.hotFanOut({ t: 'log', who: 'You', html: 'x' }, 1);
  eq(got[2].length + got[3].length, 0, 'no local table -> the bus is dead (an online room must never see hotseat traffic)');
  A.localTable = true;
  A.hotFanOut({ t: 'log', who: 'You', html: 'Alpha bleeds for 2.' }, 1);
  eq(got[2].length, 1, 'the human line reached bot seat 2'); eq(got[3].length, 1, 'and seat 3');
  eq(got[2][0].html, 'Alpha bleeds for 2.'); eq(got[2][0].who, 'You');
  got[2].length = 0; got[3].length = 0;
  A.hotFanOut({ t: 'log', who: 'B1', html: 'Beta bleeds for 1.' }, 2);
  eq(got[2].length, 0, 'the SENDER never hears its own line back -- the echo guard');
  eq(got[3].length, 1, 'the other bot does');
  A.localTable = false; HB.reset([]);
});
test('v2.6.95: mpRelay carries the local human\'s public line onto the bus; log(localOnly) never does -- which is what makes a loop impossible', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/function mpRelay\(html\)\{[\s\S]*?hotRelayLog\(html\);/.test(html), 'mpRelay ends in the hotseat mirror');
  assert(/if\(!localOnly\) mpRelay\(msg\);/.test(html), 'log() only relays non-localOnly lines');
  assert(/log\('<span class="rwho">\['\+esc\(m\.who\)\+'\]<\/span> '\+sanRemote\(m\.html\), true\)/.test(html),
         'a line injected FROM a bot is logged localOnly=true -> it cannot reach mpRelay -> it cannot bounce back out');
  assert(/hotFanOut\(\{ t: 'log', who, html: m\.html \}, seat\);/.test(html), 'a bot log line fans out to the other bots');
  assert(/hotFanOut\(\{ t: 'chat', who, msg: m\.msg \}, seat\);/.test(html), 'chat too');
  assert(/hotFanOut\(Object\.assign\(\{\}, m, \{ t: 'fx', who, seat \}\), seat\);/.test(html), 'and fx');
});
test("v2.6.125 (was v2.6.95): a BOT's \"Hold on…\" IS relayed to the other bots now -- the server's relay exactly; the bot filters it itself, and the roster keeps the `bot` flag that filter reads", () => {
  const A = loadClient(CLIENT);
  const HB = A.hotBridge;
  HB.reset([{ name: 'You' }, { name: 'B1', bot: true }, { name: 'B2', bot: true }]);
  const got = { 2: [], 3: [] };
  HB.seats[2] = { name: 'B1', cb: { msg: j => got[2].push(JSON.parse(j)) } };
  HB.seats[3] = { name: 'B2', cb: { msg: j => got[3].push(JSON.parse(j)) } };
  A.localTable = true;
  HB._fromBot(2, HB.seats[2], { t: 'say', who: 'B1', i: 0 });          // a bot says "Hold on..."
  eq(got[3].length, 1, 'seat 3 receives it -- v2.6.95..124 withheld it because the bot could not filter it yet; it can now'); eq(got[3][0].i, 0); eq(got[3][0].who, 'B1');
  eq(got[2].length, 0, 'never back to the sender');
  HB._fromBot(2, HB.seats[2], { t: 'say', who: 'B1', i: 7 }); eq(got[3].length, 2, 'and every other phrase, as before');
  got[3].length = 0; A.hotFanOut({ t: 'say', who: 'You', seat: 1, i: 0 }, 1); eq(got[3].length, 1, "the human's Hold on… reaches every bot");
  const r = HB.rosterMsg().players; eq(r[1].bot, true); eq(r[2].bot, true); eq(r[0].bot, undefined, 'LOAD-BEARING since this release: the bot\'s ask-pause filter is `players[].bot`, and a roster push REPLACES its players -- drop the flag and the round-3 deadlock returns at the first oust');
  eq(HB.players()[1].bot, true, 'and the same flag rides `joined`');
  A.localTable = false; HB.reset([]);
});
test('v2.6.125: the bot-file version floor is real -- refused below v0.6.147 with a readable reason, checked on every load', () => {
  const A = loadClient(CLIENT); const ok = A.hotBotVersionOk;
  for (const v of ['0.6.147', '0.6.151', '0.7.0', '1.0.0', '0.6.1470']) assert(ok(v), v + ' passes');
  for (const v of ['0.6.146', '0.6.94', '0.5.999', '', undefined, 'abc', '0.6', '0.6.x']) assert(!ok(v), String(v) + ' is refused');
  const html = require('fs').readFileSync(CLIENT, 'utf8'); const L = html.slice(html.indexOf('function hotLoadBotRes'), html.indexOf('function hotBotsTeardown'));
  const at = L.indexOf('if(!hotBotVersionOk(_bv)) throw new Error('), inner = L.indexOf("if(typeof ElysiumBot==='undefined'){");
  assert(at > 0 && at > L.indexOf('exported nothing') && at < L.indexOf('let fx=null;'), 'the check sits AFTER the inject block and before the database load -- so it also runs when an old global is already defined');
  assert(inner > 0 && inner < at);
});
test('v2.6.95: the chat line exists at a local table and speaks onto the bus; the room bar stays hidden offline', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/if\(net\.status==='off'\)\{ bar\.hidden=true; chat\.hidden=!localTable; return; \}/.test(html),
         'offline: no room bar, but a hotseat gets the chat line (the bots advertise "bleed N" / "@Name bleed N" in their opening line)');
  assert(/else if\(localTable\)\{[\s\S]*?hotFanOut\(\{ t:'chat', who:_who, msg:_msg \}, _seat\);/.test(html), 'the send path speaks onto the bus offline');
  assert(/updateRoomBar\(\);\s*\/\/ v2\.6\.95: brings the chat line up for the hotseat/.test(html), 'startHotseat raises it');
  assert(/updateRoomBar\(\);\s*\/\/ v2\.6\.95: and the chat line goes away with the table/.test(html), 'leaveHotseat drops it');
});

/* === v2.6.96: the visible hold, the bubble's lifetime, prey/predator offline === */
test('v2.6.96: hotHoldNote mirrors the bot\'s own hold grammar -- index 0 holds, 1/2/3/4/7 release, "Yes"/"No" deliberately do not', () => {
  const A = loadClient(CLIENT);
  const HB = A.hotBridge;
  HB.reset([{ name: 'Alice' }, { name: 'B1', bot: true }]);
  HB.seats[2] = { cb: { msg: () => {} } };                    // v2.6.101: a hold is only tracked when the table HAS a bot to hold
  A.localTable = true; A.net.you = 'Alice';
  eq(A.hotHoldBy.size, 0);
  A.hotHoldNote(0); eq([...A.hotHoldBy].join(), 'Alice', 'Hold on… holds');
  A.hotHoldNote(5); eq(A.hotHoldBy.size, 1, '"Yes" is not a release (the bot does not treat it as one either)');
  A.hotHoldNote(6); eq(A.hotHoldBy.size, 1, 'nor "No"');
  A.hotHoldNote(4); eq(A.hotHoldBy.size, 0, '"It resolves" releases');
  for (const i of [1, 2, 3, 7]) { A.hotHoldNote(0); A.hotHoldNote(i); eq(A.hotHoldBy.size, 0, 'index ' + i + ' releases'); }
  A.localTable = false; A.net.status = 'off'; A.hotHoldNote(0);
  eq(A.hotHoldBy.size, 0, 'no table with bots -> nothing is tracked (v2.6.101 tightened this from "no local table")');
  HB.reset([]);
});
test('v2.6.96: hotHoldRelease clears EVERY outstanding hold by name -- the fix for a hold one hotseat human cannot clear for another', () => {
  const A = loadClient(CLIENT);
  const HB = A.hotBridge;
  HB.reset([{ name: 'Alice' }, { name: 'Bob' }, { name: 'B1', bot: true }]);
  const got = [];
  HB.seats[3] = { cb: { msg: j => got.push(JSON.parse(j)) } };
  A.localTable = true;
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'Bob' }, { seat: 3, name: 'B1', bot: true }];
  A.net.you = 'Alice'; A.hotHoldNote(0);
  A.net.you = 'Bob';   A.hotHoldNote(0);
  eq(A.hotHoldBy.size, 2, 'both humans hold');
  got.length = 0;
  eq(A.hotHoldRelease(), true);
  eq(A.hotHoldBy.size, 0, 'the client set is cleared');
  eq(got.length, 2, 'one release relayed PER HOLDER (kept: since bot v0.6.108 the first already frees the table, and each holder\'s It resolves still closes what waits on that holder)');
  eq(got.every(m => m.t === 'say' && m.i === 4), true, "released with 'It resolves' -- the one phrase the ask window does not consume, so a release is never mistaken for a block answer");
  eq(got.map(m => m.who).sort().join(), 'Alice,Bob', 'under the HOLDERS\' names, with their seats');
  eq(got.find(m => m.who === 'Alice').seat, 1); eq(got.find(m => m.who === 'Bob').seat, 2);
  eq(A.hotHoldRelease(), false, 'nothing outstanding -> a no-op');
  A.localTable = false; HB.reset([]);
});
test('v2.6.96: sayBubbleMs -- a quick phrase keeps the original 3 s, a long bot line gets reading time, capped at 9 s', () => {
  const A = loadClient(CLIENT);
  eq(A.sayBubbleMs('Block!'), 3000, 'short phrases are unchanged');
  eq(A.sayBubbleMs(''), 3000); eq(A.sayBubbleMs('Pass'), 3000);
  eq(A.sayBubbleMs('x'.repeat(20)), 3000, 'the ramp starts past 20 chars');
  eq(A.sayBubbleMs('x'.repeat(40)), 3900);
  eq(A.sayBubbleMs('x'.repeat(120)), 7500, "a 120-char line (chatBubble's clamp) gets 7.5 s, not 3");
  eq(A.sayBubbleMs('x'.repeat(400)), 9000, 'capped');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/d\.style\.animationDuration=sayBubbleMs\(text, variant\)\+'ms';/.test(html), 'the bubble sets its own duration (v2.6.120: per tier)');
  assert(/animation:sayb 3s ease-out forwards/.test(html), 'the CSS default stays 3 s -- the inline duration overrides it per bubble');
});
test('v2.6.96: PREY/PREDATOR labels work at a hotseat (was inRoom, now tableView); heads-up still shows the name', () => {
  const A = loadClient(CLIENT);
  A.localTable = true;
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'Bot1', bot: true }, { seat: 3, name: 'Bot2', bot: true }];
  A.net.turnSeat = 1;
  eq(A.sayLabel(2, 'Bot1'), 'Prey', 'the seat after the turn player is Prey -- offline, where the human faces two bots');
  eq(A.sayLabel(3, 'Bot2'), 'Predator');
  eq(A.sayLabel(1, 'Alice'), 'Alice', 'the turn player keeps their name');
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'Bot1', bot: true }];
  eq(A.sayLabel(2, 'Bot1'), 'Bot1', 'heads-up: both prey and predator, so the name stands');
  A.localTable = false; A.net.turnSeat = null; A.net.roster = [];
  eq(A.sayLabel(2, 'Bot1'), 'Bot1', 'solo: no table, no labels');
});
test('v2.6.96: the hold badge markup and its wiring', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/<div id="holdBadge" hidden title="The bots are paused\. Click to resume them\.">/.test(html), 'the badge exists and starts hidden');
  assert(/<span id="holdWho"><\/span>/.test(html) && /<span class="hbgo">Resume<\/span>/.test(html), 'it names the holder and offers Resume');
  assert(html.indexOf("$('#holdBadge').addEventListener('click', hotHoldRelease);") > 0, 'clicking it resumes');
  assert(/hotHoldNote\(i\);\s+\/\/ v2\.6\.96/.test(html), 'saySend feeds it');
  assert(/hotHoldBy\.clear\(\); hotHoldSync\(\);\s+\/\/ v2\.6\.96: no table, no hold/.test(html), 'leaveHotseat clears it');
  assert(/const live=hotHoldBy\.size>0 && hotHoldTableHasBots\(\);/.test(html),
         'the badge only shows at a table that actually has bots (v2.6.101 widened this from localTable-only to bridge seats OR the online roster flag)');
});

/* === v2.6.97: the referee verbs reach a bot seat === */
test('v2.6.97: hotBotSeat is true only for a roster bot that is actually connected to the bridge, at a local table', () => {
  const A = loadClient(CLIENT);
  const HB = A.hotBridge;
  HB.reset([{ name: 'Alice' }, { name: 'Bot1', bot: true }]);
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'Bot1', bot: true }];
  A.localTable = false;
  eq(A.hotBotSeat(2), false, 'no local table -> no bot seat (online has the server for this)');
  A.localTable = true;
  eq(A.hotBotSeat(2), false, 'roster says bot but nothing is connected on the bridge -> nothing to send to');
  HB.seats[2] = { cb: { msg: () => {} } };
  eq(A.hotBotSeat(2), true);
  eq(A.hotBotSeat(1), false, 'a human seat is never one');
  eq(A.hotBotSeat(9), false, 'an unknown seat is not one');
  A.localTable = false; HB.reset([]);
});
test('v2.6.97: hostSetPoolHot sends forceSetPool to a bot seat and leaves a human seat on the old path', () => {
  const A = loadClient(CLIENT);
  const HB = A.hotBridge;
  HB.reset([{ name: 'Alice' }, { name: 'Bot1', bot: true }]);
  const sent = [];
  HB.seats[2] = { cb: { msg: j => sent.push(JSON.parse(j)) } };
  A.localTable = true;
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'Bot1', bot: true }];
  A.net.boards = { 2: { pub: { pool: 30, counts: { hand: 7, library: 60, crypt: 12 }, cards: [] } } };
  A.hostSetPoolHot(2, 5);
  eq(sent.length, 1, 'the bot is told');
  eq(sent[0].t, 'forceSetPool'); eq(sent[0].val, 5);
  eq(A.net.boards[2].pub.pool, 5, 'the local pub is written too, for instant feedback -- the bot\'s own push confirms it right after');
  sent.length = 0;
  A.net.boards[1] = { pub: { pool: 30, counts: { hand: 7, library: 60, crypt: 12 }, cards: [] } };
  A.hostSetPoolHot(1, 7);
  eq(sent.length, 0, 'a human seat sends nothing to any bot');
  eq(A.net.boards[1].pub.pool, 7, 'and still edits the stored board exactly as before');
  A.localTable = false; HB.reset([]);
});
test('v2.6.97: draining a bot to zero routes through the full oust path -- the bot is told AND the table bookkeeping runs', () => {
  const A = loadClient(CLIENT);
  const HB = A.hotBridge;
  HB.reset([{ name: 'Alice' }, { name: 'Bot1', bot: true }]);
  const sent = [];
  HB.seats[2] = { cb: { msg: j => sent.push(JSON.parse(j)) } };
  A.localTable = true;
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'Bot1', bot: true }];
  A.net.boards = { 2: { pub: { pool: 3, counts: { hand: 7, library: 60, crypt: 12 }, cards: [] } } };
  A.hostSetPoolHot(2, 0);
  eq(sent.some(m => m.t === 'forceOust'), true, "a zero pool means the bot ousts itself anyway (forceSetPool clamps and ousts) -- so send the oust and keep the predator's bounty and the roster flag, instead of half a state");
  eq(sent.some(m => m.t === 'forceSetPool'), false, 'and not both');
  eq(!!A.net.roster.find(q => q.seat === 2).out, true, 'the roster marks it out');
  A.localTable = false; HB.reset([]);
});
test('v2.6.97: hostOustHot tells a bot seat, and the quick Pool ± steps are no longer online-only', () => {
  const A = loadClient(CLIENT);
  const HB = A.hotBridge;
  HB.reset([{ name: 'Alice' }, { name: 'Bot1', bot: true }]);
  const sent = [];
  HB.seats[2] = { cb: { msg: j => sent.push(JSON.parse(j)) } };
  A.localTable = true;
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'Bot1', bot: true }];
  A.net.boards = { 2: { pub: { pool: 12, counts: { hand: 7, library: 60, crypt: 12 }, cards: [] } } };
  A.hostOustHot(2);
  eq(sent.filter(m => m.t === 'forceOust').length, 1, 'the bot is told to oust -- otherwise it keeps taking turns while the table thinks it is dead');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/if\(inRoom\(\) \|\| hotBotSeat\(seat\)\)\{/.test(html), 'the ± steps are offered offline for a bot seat');
  assert(/if\(inRoom\(\)\) mpSend\(\{ t:'hostSetPool', seat, val:_v \}\); else hostSetPoolHot\(seat, _v\);/.test(html), 'and route locally when offline');
  assert(/const _mine=\(c\.owner\|\|null\)===\(net\.you\|\|''\), _hs=\(net\.hot && !inRoom\(\)\)/.test(html), 'the v0.4.4 card-level rule is untouched');
  A.localTable = false; HB.reset([]);
});

/* === v2.6.98: board pubs ride the bus, so the bots can see the table === */
test('v2.6.98: a bot\'s board pub fans out to the OTHER bots, never back to the sender', () => {
  const A = loadClient(CLIENT);
  const HB = A.hotBridge;
  HB.reset([{ name: 'Alice' }, { name: 'B1', bot: true }, { name: 'B2', bot: true }]);
  const got = { 2: [], 3: [] };
  HB.seats[2] = { cb: { msg: j => got[2].push(JSON.parse(j)) } };
  HB.seats[3] = { cb: { msg: j => got[3].push(JSON.parse(j)) } };
  A.localTable = true;
  HB._fromBot(2, HB.seats[2], { t: 'board', pub: { pool: 27, cards: [] } });
  eq(got[2].length, 0, 'the sender never gets its own board back');
  eq(got[3].length, 1, 'the other bot does -- this is what fills this.table');
  eq(got[3][0].t, 'board'); eq(got[3][0].seat, 2); eq(got[3][0].pub.pool, 27);
  A.localTable = false; HB.reset([]);
});
test('v2.6.98: hotPushBoardNow sends the ACTIVE human\'s board to every bot seat, and no-ops when there is nothing to send to', () => {
  const A = loadClient(CLIENT);
  const HB = A.hotBridge;
  HB.reset([{ name: 'Alice' }, { name: 'B1', bot: true }]);
  const got = [];
  A.localTable = false;
  A.hotPushBoardNow();
  eq(got.length, 0, 'no local table -> nothing (online the server does this)');
  A.localTable = true;
  A.hotPushBoardNow();
  eq(got.length, 0, 'no bot seats connected -> nothing');
  HB.seats[2] = { cb: { msg: j => got.push(JSON.parse(j)) } };
  A.net.you = 'Alice';
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'B1', bot: true }];
  A.hotPushBoardNow();
  eq(got.length, 1, 'the bot seat gets the human board');
  eq(got[0].t, 'board'); eq(got[0].seat, 1, 'tagged with the human\'s seat'); eq(got[0].who, 'Alice');
  assert(got[0].pub && typeof got[0].pub === 'object', 'it carries a real pub, the same shape the server broadcasts');
  A.localTable = false; HB.reset([]);
});
test('v2.6.98: the push paths route offline, on the same debounce as online, and startHotseat seeds the bots', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/if\(!inRoom\(\)\)\{ hotSchedulePushBoard\(\); return; \}/.test(html), 'schedulePush routes offline instead of returning empty-handed');
  assert(/if\(!inRoom\(\)\)\{ hotPushBoardNow\(\); return; \}/.test(html), 'pushNow too -- immediate, as online');
  assert(/hotPushTimer=setTimeout\(hotPushBoardNow, 600\);/.test(html), 'same 600 ms debounce as the online push -- buildPub is not free and boards mutate in bursts');
  assert(/hotPushBoardNow\(\);\s+\/\/ v2\.6\.98: seed the bots with the human's opening board/.test(html),
         'startHotseat seeds, the way the server hands a joiner every existing pub -- otherwise a bot is blind until the human first acts');
  assert(/hotFanOut\(\{ t: 'board', seat, who, pub \}, seat\);/.test(html), 'bot -> other bots (v2.6.164: the pub the server would relay, B.pubPublic)');
});

/* === v2.6.99: online bots, added from the lobby === */
test('v2.6.99: netBotWhy gates on host + lobby + Full + Structured + a free seat, in that order', () => {
  const A = loadClient(CLIENT);
  A.net.lobby = false; A.net.isHost = false;
  assert(/Only the host/.test(A.netBotWhy()), 'not in a lobby');
  A.net.lobby = true;
  assert(/Only the host/.test(A.netBotWhy()), 'in the lobby but not the host');
  A.net.isHost = true;
  A.conv.uiMode = 'lite';
  assert(/Full mode/.test(A.netBotWhy()), 'Lite has no bots');
  A.conv.uiMode = 'full';
  A.net.lobbyData = { boardMode: 'classic', players: [], seats: 5 };
  assert(/Structured/.test(A.netBotWhy()), 'a Classic room can never host bots -- boardMode is fixed at creation and no verb changes it');
  /* v2.6.102 (Johan's browser pass): the cap is the SERVER's MAX_PLAYERS, not the lobby
     snapshot's `seats` -- srv 318 sets that to room.players.length (the seat-picker's
     range), so comparing against it made a host sitting alone read "the table is full". */
  A.net.lobbyData = { boardMode: 'structured', players: [{ name: 'a' }], seats: 1 };
  eq(A.netBotWhy(), '', 'a host sitting ALONE may add a bot -- seats:1 is not a capacity');
  A.net.lobbyData = { boardMode: 'structured', players: [{ name: 'a' }, { name: 'b' }], seats: 2 };
  eq(A.netBotWhy(), '', 'two players, still room for four more');
  A.net.lobbyData = { boardMode: 'structured', players: 'abcde'.split('').map(n => ({ name: n })), seats: 5 };
  eq(A.netBotWhy(), '', 'five: the sixth seat is still free');
  A.net.lobbyData = { boardMode: 'structured', players: 'abcdef'.split('').map(n => ({ name: n })), seats: 6 };
  assert(/full \(6 seats\)/.test(A.netBotWhy()), 'six is the ceiling, and the message names it as the server does');
  A.net.lobbyData = { players: [{ name: 'a' }], seats: 1 };
  eq(A.netBotWhy(), '', 'a snapshot without boardMode is treated as Structured, as the server does');
});
test('v2.6.99: netBotName takes the next free name from the same pool the offline lobby uses, then falls back', () => {
  const A = loadClient(CLIENT);
  A.net.lobbyData = { players: [] };
  eq(A.netBotName(), 'Astrid', 'the first of DEMO_NAMES -- so an online table reads like the offline one it is compared against');
  A.net.lobbyData = { players: [{ name: 'Astrid' }, { name: 'Bram' }] };
  eq(A.netBotName(), 'Caine');
  A.net.lobbyData = { players: ['Astrid', 'Bram', 'Caine', 'Dorian', 'Esme'].map(n => ({ name: n })) };
  eq(A.netBotName(), 'Bot 2', 'pool exhausted -> a numbered fallback that still cannot collide');
});
test('v2.6.99: netBotDial builds a socket to the SAME server the human is on, and honours the secure flag', () => {
  const A = loadClient(CLIENT);
  const seen = [];
  const prevWS = global.WebSocket;
  global.WebSocket = function (url) { seen.push(url); this.send = () => {}; this.close = () => {}; };
  try {
    A.net.addr = 'example.test:8123'; A.net.sec = false;
    const t1 = A.netBotDial()('ignored', {});
    eq(seen[0], 'ws://example.test:8123', 'plain ws on a plain target; the url argument is ignored -- net.addr is the truth');
    A.net.sec = true;
    A.netBotDial()('ignored', {});
    eq(seen[1], 'wss://example.test:8123', 'wss when the target is secure, or a tunnel would refuse it');
    assert(t1 && typeof t1.send === 'function' && typeof t1.close === 'function', "wsConnect's contract: {send, close}");
  } finally { global.WebSocket = prevWS; }
});
test('v2.6.99: the lobby markup, the spawn options and the teardown paths', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/<div id="lobBotWrap" hidden>/.test(html), 'the bot row exists and starts hidden');
  assert(/id="lobBotName"/.test(html) && /id="lobBotDeck"/.test(html) && /id="lobBotPersona"/.test(html) && /id="lobBotAdd"/.test(html), 'name, deck, persona, add');
  assert(/Bots are pre-alpha and not yet stable/.test(html), 'the disclaimer is on the table, not buried in a tooltip');
  assert(/wrap\.hidden=!show;/.test(html) && /const show=net\.lobby && net\.isHost && !uiLite\(\);/.test(html), 'host-only, lobby-only, Full-only');
  assert(/room:net\.room, pass:net\.pass\|\|'', transport:netBotDial\(\)/.test(html), 'the bot joins the room the host is already in');
  assert(/reconnect:true,/.test(html), 'an injected transport is opt-in for reconnect (bot v0.6.94) -- online we want a tunnel blink to re-seat it by token, like a human');
  assert(/persona:persona\|\|HOT_BOT_PERSONA, paceMs:3100, askSecs:20,/.test(html) && /persona:pl\.botP\|\|HOT_BOT_PERSONA, paceMs:3100, askSecs:20,/.test(html), 'same pacing and ask window as the offline bots, so the comparison is like-for-like');
  assert(/netBots\[p\.name\]\.bot\.send\(\{ t:'seat', seat:v \}\)/.test(html), "the seat picker sends on the BOT's own socket, the same verb a human uses");
  assert(/if\(netBots\[name\]\) await netBotRemove\(name\); else mpSend\(\{t:'kick', name\}\);/.test(html), 'removing a bot goes through netBotRemove -- and is AWAITED since v2.6.115, because the bot leaves on its own socket and the close waits for the server to confirm');
  assert(/try\{ netBotsTeardown\(\); \}catch\(_e\)\{\}/.test(html), 'leaving the room kills them');
  assert(/if\(_netBotPolicyBefore\) return;/.test(html), 'the remembered helper policy is never overwritten by the locked one');
});
test('v2.6.99: netBotsTeardown closes every instance and forgets the remembered policy', () => {
  const A = loadClient(CLIENT);
  let closed = 0;
  A.netBots['X'] = { bot: { close: () => { closed++; } } };
  A.netBots['Y'] = { bot: { close: () => { closed++; } } };
  eq(A.netBotCount(), 2);
  A.netBotsTeardown();
  eq(closed, 2, 'both sockets closed');
  eq(A.netBotCount(), 0);
});

/* === v2.6.100: the helper-policy snapshot reads the ROOM, not the Settings checkboxes === */
test('v2.6.100: netBotHelperLock remembers net.helperPolicy (the server-sent live policy) and netBotHelperUnlock restores exactly that; the lock is idempotent', () => {
  const A = loadClient(CLIENT);
  const sent = [];
  A.net.ws = { readyState: 1, send: j => sent.push(JSON.parse(j)) };
  const live = { settings: { counts: false, warn: true }, allowLocal: false, tournament: true };
  A.net.helperPolicy = live;
  A.netBotHelperLock();
  eq(sent.length, 1, 'the lock is pushed');
  eq(sent[0].t, 'setHelperPolicy'); eq(sent[0].policy.tournament, false, 'no tournament mode');
  eq(sent[0].policy.allowLocal, false, "v2.6.103: was `true` here, and that WAS the bug -- allowLocal:true is the 'local' mode, so the lock locked nothing. The v2.6.100 remember-and-restore contract this test guards is unchanged");
  eq(Object.values(sent[0].policy.settings).every(v => v === true), true, 'every helper on');
  A.net.helperPolicy = { settings: {}, allowLocal: true, tournament: false };   // the room now REPORTS the locked policy back
  A.netBotHelperLock();
  eq(sent.length, 1, 'a second lock (second bot) pushes nothing and must NOT overwrite the memory with the locked policy');
  A.netBotHelperUnlock();
  eq(sent.length, 2, 'unlock pushes once');
  eq(JSON.stringify(sent[1].policy), JSON.stringify(live), 'and restores the policy the room actually had -- from net.helperPolicy, not from the Settings checkboxes (which hold HTML defaults if the dialog was never opened)');
  A.netBotHelperUnlock();
  eq(sent.length, 2, 'nothing remembered -> a no-op');
  A.net.ws = null;
});

/* === v2.6.101: the hold badge follows the table, online included === */
test('v2.6.101: hotHoldTableHasBots reads bridge seats offline and the server roster online, and is false with no bots anywhere', () => {
  const A = loadClient(CLIENT);
  const HB = A.hotBridge;
  A.localTable = false; A.net.status = 'off'; A.net.roster = [];
  eq(A.hotHoldTableHasBots(), false, 'no table at all');
  A.net.status = 'in'; A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'Bob' }];
  eq(A.hotHoldTableHasBots(), false, 'an online room of humans has nothing to hold');
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'B1', bot: true }];
  eq(A.hotHoldTableHasBots(), true, "online: the SERVER's roster flag, so it is true for every player, not just the host who added them");
  A.net.status = 'off'; A.localTable = true;
  HB.reset([{ name: 'You' }, { name: 'B1', bot: true }]);
  eq(A.hotHoldTableHasBots(), false, 'offline with no bot connected on the bridge');
  HB.seats[2] = { cb: { msg: () => {} } };
  eq(A.hotHoldTableHasBots(), true);
  A.localTable = false; HB.reset([]); A.net.roster = [];
});
test('v2.6.101: online, a hold placed by ANOTHER player is tracked and shown, and this client refuses to release it', () => {
  const A = loadClient(CLIENT);
  A.localTable = false; A.net.status = 'in'; A.net.you = 'Bob';
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'Bob' }, { seat: 3, name: 'B1', bot: true }];
  A.hotHoldMark('Alice', 0);
  eq([...A.hotHoldBy].join(), 'Alice', "another player's hold is visible -- a frozen online table explains itself");
  eq(A.hotHoldRelease(), false, 'and the badge offers no button for it: online the button stays the holder\'s (a choice since bot v0.6.108 made any human\'s It resolves free the table -- see v2.6.142)');
  eq([...A.hotHoldBy].join(), 'Alice', 'still held');
  A.hotHoldMark('Alice', 4);
  eq(A.hotHoldBy.size, 0, "Alice's own release clears it");
  A.net.status = 'off'; A.net.roster = [];
});
test('v2.6.101: online, your OWN hold is released with a real say broadcast; the release phrase set is unchanged', () => {
  const A = loadClient(CLIENT);
  const sent = [];
  A.localTable = false; A.net.status = 'in'; A.net.you = 'Bob';
  A.net.ws = { readyState: 1, send: j => sent.push(JSON.parse(j)) };
  A.net.roster = [{ seat: 1, name: 'Bob' }, { seat: 2, name: 'B1', bot: true }];
  A.hotHoldMark('Bob', 0);
  eq(A.hotHoldBy.size, 1);
  eq(A.hotHoldRelease(), true);
  eq(sent.some(m => m.t === 'say' && m.i === 4), true, "'It resolves' goes on the wire -- a badge that only cleared local state would leave the bots held");
  eq(A.hotHoldBy.size, 0, 'and the badge clears through saySend -> hotHoldNote');
  A.hotHoldMark('Bob', 0); A.hotHoldMark('Bob', 5);
  eq(A.hotHoldBy.size, 1, '"Yes" is still not a release, online as offline');
  A.hotHoldMark('Bob', 7);
  eq(A.hotHoldBy.size, 0, 'Pass is');
  A.net.ws = null; A.net.status = 'off'; A.net.roster = [];
});
test('v2.6.101: the wiring -- inbound says feed the badge, the Resume affordance hides for someone else\'s hold, leaving a room clears it', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/say\(m\)\{ showSay\(m\.i, m\.who\|\|'\?', m\.seat\|0\); hotHoldMark\(m\.who\|\|'\?', m\.i\|0\);/.test(html), "another player's phrase feeds the badge");
  assert(/if\(go\)\{ go\.style\.display=mine\?'':'none'; \}/.test(html), 'no dead Resume button for a hold you cannot release');
  assert(/hotHoldBy\.clear\(\); try\{ hotHoldSync\(\); \}catch\(_e\)\{\}   \/\/ v2\.6\.101: no table, no hold/.test(html), 'leaving an online room clears it, as leaveHotseat does offline');
  assert(/saySend\(4\);\s+\/\/ 'It resolves' in your own name/.test(html), 'the online release is a real broadcast');
  assert(/const live=hotHoldBy\.size>0 && hotHoldTableHasBots\(\);/.test(html), 'the badge follows the table, not localTable');
});

/* ---------- v2.6.142: THE BADGE KNOWS THE HOLD (bot v0.6.198: a Hold on stops every clock a bot runs on a human) ---------- */
test('v2.6.142: the badge follows the bots\' own hold rule -- a BOT never holds or releases (its Hold on is a thinking announce), and a release from ANY human releases the whole table', () => {
  const A = loadClient(CLIENT);
  const toasts = []; A.toast = m => toasts.push(String(m));
  A.localTable = false; A.net.status = 'in'; A.net.you = 'Carl';
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'Bob' }, { seat: 3, name: 'Carl' }, { seat: 4, name: 'B1', bot: true }];
  A.hotHoldMark('B1', 0);
  eq(A.hotHoldBy.size, 0, "a bot's own 'Hold on...' holds nothing -- the bots ignore it (bot _holdHook: bots never operate the hold)");
  A.hotHoldMark('Alice', 0); A.hotHoldMark('Bob', 0);
  eq([...A.hotHoldBy].sort().join(), 'Alice,Bob');
  A.hotHoldMark('B1', 4);
  eq(A.hotHoldBy.size, 2, "a bot's release phrase frees nobody's hold");
  eq(A.hotHoldRelease(), false, "online the badge button stays the holder's");
  assert(/Alice, Bob hold the bots \u2014 ask them, or say It resolves/.test(toasts.join('|')), 'and the toast says what does work: ' + JSON.stringify(toasts));
  A.hotHoldMark('Bob', 7);
  eq(A.hotHoldBy.size, 0, "Bob's Pass releases the TABLE, Alice's hold included -- the bots' rule since v0.6.108 (v2.6.141 left 'Alice' on the badge)");
  A.hotHoldMark('Alice', 0); A.hotHoldMark('Carl', 5);
  eq(A.hotHoldBy.size, 1, '"Yes" is still not a release, from anyone');
  A.hotHoldMark('Carl', 2);
  eq(A.hotHoldBy.size, 0, 'Block! is');
  A.net.status = 'off'; A.net.roster = [];
});
test('v2.6.142: a typed line holds and releases with the bots\' own patterns -- /^hold on\\b/i and /^(carry on|resume|it resolves)\\b/i, anchored and trimmed', () => {
  const A = loadClient(CLIENT);
  A.localTable = false; A.net.status = 'in'; A.net.you = 'Alice';
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'B1', bot: true }];
  A.hotHoldMark('Alice', -1, 'Hold on, checking a card');
  eq([...A.hotHoldBy].join(), 'Alice', '"Hold on, ..." holds (case-insensitive)');
  A.hotHoldMark('Alice', -1, 'please hold on'); eq(A.hotHoldBy.size, 1, 'anchored at the start, as in the bot -- and no release either');
  A.hotHoldMark('Alice', -1, 'it resolves'); eq(A.hotHoldBy.size, 0, '"it resolves" releases');
  for (const line of ['carry on', 'Resume please', '  It resolves.']) { A.hotHoldMark('Alice', -1, 'hold on'); A.hotHoldMark('Alice', -1, line); eq(A.hotHoldBy.size, 0, JSON.stringify(line) + ' releases'); }
  A.hotHoldMark('Alice', -1, 'hold on'); A.hotHoldMark('Alice', -1, 'holding on'); eq(A.hotHoldBy.size, 1, '"holding on" is neither a hold nor a release (the word boundary)');
  A.hotHoldMark('B1', -1, 'resume'); eq(A.hotHoldBy.size, 1, "a bot's chat never releases");
  A.hotHoldMark('B1', -1, 'hold on'); eq([...A.hotHoldBy].join(), 'Alice', "nor holds");
  A.net.status = 'off'; A.net.roster = [];
});
test('v2.6.142: a holder who is out, vacant or offline holds nothing -- hotHoldPrune drops them as the bots do (_releaseDeparted); a holder still seated keeps the hold', () => {
  const A = loadClient(CLIENT);
  A.localTable = false; A.net.status = 'in'; A.net.you = 'Dana';
  A.net.roster = [{ seat: 1, name: 'Alice', online: true }, { seat: 2, name: 'Bob', online: true }, { seat: 3, name: 'Cleo', online: true }, { seat: 4, name: 'B1', bot: true, online: true }];
  ['Alice', 'Bob', 'Cleo'].forEach(n => A.hotHoldMark(n, 0));
  eq(A.hotHoldBy.size, 3);
  eq(A.hotHoldPrune(), false, 'everyone still at the table: nothing to drop');
  A.net.roster[0].online = false; A.net.roster[1].out = true;
  eq(A.hotHoldPrune(), true);
  eq([...A.hotHoldBy].join(), 'Cleo', 'offline Alice and ousted Bob are dropped; Cleo, still seated, holds');
  A.net.roster[2].vacant = true;
  A.hotHoldPrune();
  eq(A.hotHoldBy.size, 0, 'a vacated seat holds nothing');
  A.net.status = 'off'; A.net.roster = [];
});
test('v2.6.142: the panel\'s Release hold frees ONE bot; the badge clears only when no bot this tab runs is still held', () => {
  const A = loadClient(CLIENT);
  const HB = A.hotBridge;
  HB.reset([{ name: 'You' }, { name: 'B1', bot: true }, { name: 'B2', bot: true }]);
  HB.seats[2] = { cb: { msg: () => {} } }; HB.seats[3] = { cb: { msg: () => {} } };
  A.localTable = true; A.net.you = 'You';
  A.net.roster = [{ seat: 1, name: 'You' }, { seat: 2, name: 'B1', bot: true }, { seat: 3, name: 'B2', bot: true }];
  const mk = held => ({ status: () => ({ name: 'x', state: held.v ? 'held' : 'idle', waitingFor: held.v ? 'hold: You' : 'nothing pending', until: null, step: held.v ? 'release-hold' : null, canStep: !!held.v }) });
  const h2 = { v: true }, h3 = { v: true };
  A.hotBots[2] = mk(h2); A.hotBots[3] = mk(h3);
  A.hotHoldNote(0);
  eq(A.hotHoldBy.size, 1);
  h2.v = false;
  eq(A.hotHoldAfterPanelRelease(), false, 'one bot released, the other still held: the badge stays');
  eq(A.hotHoldBy.size, 1);
  h3.v = false;
  eq(A.hotHoldAfterPanelRelease(), true, 'no bot held any more: the badge clears with them');
  eq(A.hotHoldBy.size, 0);
  delete A.hotBots[2]; delete A.hotBots[3]; A.localTable = false; HB.reset([]); A.net.roster = [];
});
test('v2.6.142: Bot settings says Hold on stops every bot clock -- and leaves the line out for a loaded bot file older than v0.6.198', () => {
  const A = loadClient(CLIENT);
  try {
    delete global.ElysiumBot;
    eq(A.botCfgHoldLine(), A.BOTCFG_HOLD, 'no bot file loaded (a seated human online): the line shows');
    assert(/^\u2757 Hold on stops every bot clock that waits on you; each starts again from the beginning when the hold is released\.$/.test(A.BOTCFG_HOLD), JSON.stringify(A.BOTCFG_HOLD));
    global.ElysiumBot = { BOT_VERSION: '0.6.197', ARCHETYPES: {} };
    eq(A.botCfgHoldLine(), '', 'v0.6.197 runs its pool question and combat steps through a hold -- no overclaim');
    global.ElysiumBot = { BOT_VERSION: '0.6.198', ARCHETYPES: {} };
    eq(A.botCfgHoldLine(), A.BOTCFG_HOLD);
  } finally { delete global.ElysiumBot; }
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("+(botCfgHoldLine() ? '<div") > 0, 'the Bot settings block renders it');
});
test('v2.6.142: the wiring -- both chat paths and both roster paths feed the badge, the Enter handler is chatSendLine, and no text claims only the holder can resume', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("chatBubble(m.who, 0, m.msg, 'wire'); hotHoldMark(m.who||'?', -1, m.msg); },") > 0, 'an inbound chat line feeds the badge (online: the echo of your own line too)');
  assert(/e\.target\.value='';\s*chatSendLine\(v\);\s*\}\);/.test(html), 'the Enter handler is one call');
  const at = html.indexOf('function chatSendLine(v){'); assert(at > 0, 'chatSendLine exists');
  const cs = html.slice(at, html.indexOf('\n}\n', at));
  assert(/hotFanOut\(\{ t:'chat'[\s\S]*hotHoldMark\(_who, -1, _msg\);/.test(cs), 'offline the sender marks its own typed hold (no echo comes back)');
  assert(/roster\(m\)\{\s*net\.roster=m\.players\|\|\[\];\s*hotHoldPrune\(\);/.test(html), 'the roster prunes departed holders');
  assert(/function hotRosterPush\(\)\{[^\n]*\n\s*hotHoldPrune\(\);/.test(html), 'and so does an offline oust');
  assert(html.indexOf("if(out && out.did==='release-hold') hotHoldAfterPanelRelease();") > 0, "the panel's release reaches the badge");
  eq(html.indexOf('only they can resume the bots'), -1, 'the tooltip claim is gone');
  eq(html.indexOf("can resume the bots.'"), -1, 'and so is the toast');
});

/* ---------- v2.6.103: ONE RULE FOR THE FELT ---------- */
test('v2.6.103: isBoardChrome -- chrome and cards swallow the board gestures, surfaces do not', () => {
  const A = loadClient(CLIENT);
  const el = sel => ({ closest: q => (String(q).split(',').some(t => sel.includes(t.trim())) ? {} : null) });
  // chrome + cards: the wheel must never reach the zoom through these
  for (const s of ['.card', '.l4globe', '.l4pbtn', '#edge', '#poolWrap', '#dockPool', '#z-hand', '.zone.pile', '#phases', '#l2dock', '#l2dockbg', '#dockLog', '#l3zoomCtl', '#holdBadge'])
    eq(A.isBoardChrome(el([s])), true, s + ' swallows the wheel (Johan: chrome blocks, even where the scroll has no effect of its own)');
  // surfaces: these ARE the table and must keep zooming -- in L3 they are most of the screen
  for (const s of ['#board', '#z-ready', '#z-uncontrolled', '#z-torpor', '.l3mat', '#l3stage'])
    eq(A.isBoardChrome(el([s])), false, s + ' is table surface -- block it and there is nowhere left to zoom');
  eq(A.isBoardChrome(null), false, 'a null target is not chrome');
  eq(A.isBoardChrome({}), false, 'a target without closest() is tolerated, never thrown on');
});
test('v2.6.103: BOTH board handlers read the one constant, and every wheel consumer stops the wheel', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const wheelBody = html.slice(html.indexOf("board.addEventListener('wheel'"), html.indexOf("let _l4PanPrev=0;"));
  assert(/if\(isBoardChrome\(e\.target\)\) return;/.test(wheelBody), 'the zoom consults the rule -- this was the missing half, not a missing stopPropagation');
  const panStart = html.indexOf("let _l4PanPrev=0;");   // three handlers share that signature; the PAN one is the one after this marker
  assert(panStart > 0, 'found the pan handler');
  const panBody = html.slice(panStart, panStart + 1400);
  assert(/if\(isBoardChrome\(e\.target\)\) return;/.test(panBody), 'the pan reads the SAME constant -- its hand-written copy is what let the two drift apart');
  assert(html.indexOf(".closest('.card,.l4globe,.l4pbtn,#edge,#poolWrap,#phases,#l2dock,#l2dockbg')") === -1, 'the hand-written duplicate list is gone');
  // every wheel CONSUMER stops the wheel; the board's own zoom is the only listener that may let it run on
  const bodies = [];
  for (let i = html.indexOf("addEventListener('wheel'"); i > -1; i = html.indexOf("addEventListener('wheel'", i + 1))
    bodies.push({ at: i, src: html.slice(i, html.indexOf('passive:false', i)) });
  eq(bodies.length, 10, 'found every wheel listener -- a new one must declare which side of the rule it is on');
  const bare = bodies.filter(b => !/stopPropagation\(\)/.test(b.src));
  eq(bare.length, 1, 'exactly one listener forwards the wheel: the board zoom itself (was 3 -- #pool and #dockPool leaked into it)');
  assert(html.slice(Math.max(0, bare[0].at - 6), bare[0].at).indexOf('board.') > -1, 'and that one is #board, not a consumer');
});
test('v2.6.103: the bot helper lock sends the ALL shape -- allowLocal:false, or it locks nothing', () => {
  const A = loadClient(CLIENT);
  const all = A.helperPolicyFor('all');
  eq(all.allowLocal, false, "'all' is the locked-to-the-table mode; allowLocal:true is 'local' and hx() falls through to each player's own Settings");
  eq(all.tournament, false);
  assert(Object.keys(all.settings).length > 0 && Object.values(all.settings).every(v => v === true), 'every helper on');
  const sent = [];
  A.net.status = 'in'; A.net.you = 'Host'; A.net.isHost = true;
  A.net.ws = { readyState: 1, send: j => sent.push(JSON.parse(j)) };
  A.net.helperPolicy = { settings: {}, allowLocal: true, tournament: false };
  A.netBotHelperLock();
  const push = sent.find(m => m.t === 'setHelperPolicy');
  assert(push, 'the lock pushes a policy');
  eq(push.policy.allowLocal, false, 'the lock is a LOCK -- this is the bug: it used to send allowLocal:true');
  eq(push.policy.tournament, false, 'bots run without tournament mode');
  assert(Object.values(push.policy.settings).every(v => v === true), 'with every helper on');
  sent.length = 0;
  A.netBotHelperLock();
  eq(sent.length, 0, 'idempotent: a second bot never re-locks or overwrites the remembered policy');
  A.netBotHelperUnlock();
  const back = sent.find(m => m.t === 'setHelperPolicy');
  assert(back && back.policy.allowLocal === true, "the host's own policy comes back when the last bot leaves");
  A.net.ws = null; A.net.status = 'off'; A.net.isHost = false; A.net.helperPolicy = null;
});
test('v2.6.104: leaving a room hands the helper policy back BEFORE the leave verb, and quietly', () => {
  const A = loadClient(CLIENT);
  const sent = [];
  A.net.status = 'in'; A.net.you = 'Host'; A.net.isHost = true; A.net.room = 'R';
  A.net.ws = { readyState: 1, send: j => sent.push(JSON.parse(j)), close(){} };
  const mine = { settings: { counts: false }, allowLocal: true, tournament: false };
  A.net.helperPolicy = mine;
  A.netBotHelperLock();
  eq(sent.filter(m => m.t === 'setHelperPolicy').length, 1, 'locked');
  sent.length = 0;
  A.mpLeave();
  const order = sent.map(m => m.t);
  const iPol = order.indexOf('setHelperPolicy'), iLeave = order.indexOf('leave');
  assert(iPol > -1, 'the policy is handed back when the host leaves with bots still seated -- v2.6.103 made the lock real, so leaving it behind strands the remaining players');
  assert(iLeave > -1 && iPol < iLeave, 'and it rides BEFORE `leave`: the server drops the connection from the room there (srv 1261), after which every REF_VERB answers \'Join a room first\'');
  eq(JSON.stringify(sent[iPol].policy), JSON.stringify(mine), "restores the room's own policy, not the locked one");
  A.net.ws = null; A.net.status = 'off'; A.net.isHost = false; A.net.helperPolicy = null; A.net.room = null;
});
test('v2.6.104: the quiet flag is only for the teardown path -- a normal unlock still says so', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/function netBotHelperUnlock\(quiet\)/.test(html), 'the unlock takes the flag');
  assert(/if\(!quiet\) toast\('\\u21ba Helper policy restored'\)/.test(html), 'removing the last bot by hand still toasts');
  assert(/try\{ netBotHelperUnlock\(true\); \}catch\(_e\)\{\}\n  if\(net\.status==='in'\) mpSend\(\{t:'leave'\}\);/.test(html), 'the leave path is quiet, and the ordering is pinned in the source too');
  const tdAt = html.indexOf('function netBotsTeardown()');
  const td = html.slice(tdAt, html.indexOf('\n}', tdAt));   // the function body only -- the lock/unlock pair sits right after it
  const tdCode = td.replace(/\/\/[^\n]*/g, '');   // strip prose: the comment in there NAMES netBotHelperUnlock to explain why it is absent (second time this session a comment tripped a source census -- match code, not words)
  assert(!/netBotHelperUnlock/.test(tdCode), 'the restore deliberately does NOT live in the teardown -- it would bounce from there');
});

/* ---------- v2.6.105: CLOSE TABLE ---------- */
test('v2.6.105: mpCanCloseRoom -- ask only when somebody else would be left behind; bots are not somebody', () => {
  const A = loadClient(CLIENT);
  A.net.status = 'in'; A.net.you = 'Alice'; A.net.isHost = true; A.net.watchers = 0; A.net.watcherList = [];
  A.net.roster = [{ seat: 1, name: 'Alice' }];
  eq(A.mpCanCloseRoom(), false, 'a host alone: leaving already ends it, so do not ask a question with one answer');
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'B1', bot: true }];
  eq(A.mpCanCloseRoom(), false, 'alone with bots is still alone -- srv-2.6.36 closes the room when the last human leaves');
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'Bob' }];
  eq(A.mpCanCloseRoom(), true, 'another human: leave and close are genuinely different outcomes');
  A.net.roster = [{ seat: 1, name: 'Alice' }]; A.net.watcherList = [{ name: 'Eve' }];
  eq(A.mpCanCloseRoom(), true, 'a spectator counts too -- closing disconnects them');
  A.net.watcherList = []; A.net.isHost = false;
  A.net.roster = [{ seat: 1, name: 'Alice' }, { seat: 2, name: 'Bob' }];
  eq(A.mpCanCloseRoom(), false, 'not the host, not your call');
  A.net.isRef = true;
  eq(A.mpCanCloseRoom(), true, 'a referee reaches every host verb (v2.6.83), this one included');
  A.net.isRef = false; A.net.status = 'off'; A.net.roster = []; A.net.you = null;
});
test('v2.6.105: mpCloseRoom sends the verb, and `closed` tears down WITHOUT a rejoin loop', () => {
  const A = loadClient(CLIENT);
  const sent = [];
  A.net.status = 'in'; A.net.you = 'Alice'; A.net.isHost = true; A.net.room = 'R';
  A.net.ws = { readyState: 1, send: j => sent.push(JSON.parse(j)), close(){} };
  A.mpCloseRoom();
  assert(sent.some(m => m.t === 'closeRoom'), 'the host asks the server to end it -- the server answers `closed` to everyone, this client included');
  sent.length = 0;
  A.MP_HANDLERS.closed({ t: 'closed', msg: 'Alice closed the table.' });
  eq(A.net.status, 'off', "status is 'off', so ws.onclose cannot start the 2.5 s rejoin against a room that no longer exists");
  eq(A.net.room, null, 'and the client is fully out');
  eq(sent.some(m => m.t === 'leave'), false, 'no `leave` is sent to a room that is already gone');
  A.net.ws = null; A.net.isHost = false;
});
test('v2.6.105: the menu wiring -- Close table is online-only, and Leave seat offers the three-way to a host with company', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/if\(inRoom\(\)\) _hostSub\.push\('-', \{label:'Close table/.test(html), 'Close table sits in the Host menu and only online -- a hotseat has no room to close');
  assert(/if\(mpCanCloseRoom\(\)\)\{/.test(html), 'Leave seat consults the gate');
  assert(/kind:'choose'[\s\S]{0,240}okText:'Leave only', altText:'Close the table'/.test(html), 'three-way: leave only / close / cancel');
  assert(/if\(r==='alt'\) mpCloseRoom\(\); else if\(r==='ok'\) mpLeave\(\);/.test(html), "and cancel (null) does neither -- the default must be to do nothing");
});

/* ---------- v2.6.106: THE CONTRACT ROUND ---------- */
test('v2.6.106: SAY grew by APPENDING -- every pre-existing index is exactly where it was', () => {
  const A = loadClient(CLIENT);
  const was = ['Hold on\u2026', 'No block', 'Block!', 'No reaction', 'It resolves', 'Yes', 'No', 'Pass'];
  was.forEach((p, i) => eq(A.SAY[i], p, 'index ' + i + ' must not move: `say` carries an INDEX and the bot mirrors this array, so a reorder renumbers every phrase for every older peer with no error anywhere'));
  eq(A.SAY[8], 'Any blocks?', 'new: the asking side of a phrase that only existed as an answer');
  eq(A.SAY[9], 'Any reaction?');
  eq(A.SAY.length, 10);
});
test('v2.6.106: the protocol doc freezes exactly what the client emits -- no drift between §12 and the code', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const doc = require('fs').readFileSync(require('path').resolve(__dirname, 'ELYSIUM-PROTOCOL.md'), 'utf8');
  // every action verb the Actions menu can log must appear verbatim in the frozen block
  const verbs = ['blocks.', 'hunts.', 'attempts to rescue a vampire from torpor.', 'attempts to rescue their own vampire from torpor.', 'commits diablerie!', 'takes a card action.', 'takes an undirected action.', 'calls a political action.'];   // v2.6.137/138: + the undirected card action, + the own-vampire rescue
  for (const v of verbs) {
    assert(html.includes("'" + v + "'"), 'the client still emits: ' + v);
    assert(doc.includes('`NAME ' + v + '`'), '§12 freezes it: ' + v + ' -- the bot grammar had these as "unverified (main-project ask)" until now');
  }
  assert(doc.includes('`NAME casts N vote for.`') && doc.includes('`NAME casts N votes against.`'), '§12 carries both vote shapes, singular and plural');
  // §12.1 index table must agree with the live array, row for row
  const A = loadClient(CLIENT);
  const rows = [...doc.matchAll(/^\| (\d) \| `([^`]+)` \|/gm)].map(m => [ +m[1], m[2] ]);
  eq(rows.length, A.SAY.length, '§12.1 has a row per phrase');
  rows.forEach(([i, phrase]) => eq(phrase, A.SAY[i], '§12.1 row ' + i + ' matches the live SAY'));
});
test('v2.6.106: the Vote submenu -- a political action IS an action, casting votes is not', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/\{label:'Political action', fn:act\('calls a political action\.','calls a vote'(,true,true)?\)\}/.test(html),   // v2.6.137: + the undirected flag
    'Political action goes through act(): it locks, closes the play batch and carries the target suffix, so a bot block step runs on it exactly as on a bleed');
  const vote = html.slice(html.indexOf('const actVote='), html.indexOf("items.push({label:'Actions'"));
  assert(!/resolvePlayedActions\(\)/.test(vote), 'casting votes must NOT close the play batch');
  assert(!/setLocked\(/.test(vote), 'and must NOT lock: a titled minion keeps its votes while locked');
  assert(/vote'\+\(n===1\?'':'s'\)/.test(vote), 'singular at 1, plural above -- the shape §12 froze');
  assert(/Math\.max\(1, Math\.min\(99, parseInt\(v,10\)\|\|0\)\)/.test(vote), 'clamped 1..99 like Bleed X');
});

/* ---------- v2.6.107: THREE VOICES ---------- */
test('v2.6.107: the helper key lives in BOTH lists -- client HELPER_DEFS and server HELPER_KEYS are one contract', () => {
  const A = loadClient(CLIENT);
  const srv = require('fs').readFileSync(require('path').resolve(__dirname, 'elysium-server.js'), 'utf8');
  const keys = A.HELPER_DEFS.map(d => d.key);
  assert(keys.includes('chatFx'), 'the client knows the key');
  const m = srv.match(/const HELPER_KEYS = \[([^\]]*)\]/);
  assert(m, 'found the server list');
  const srvKeys = [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]);
  // the whole point: cleanHelperPolicy builds `settings` from the SERVER list alone,
  // so any key the client knows and the server does not is dropped from every host-locked policy
  const missing = keys.filter(k => !srvKeys.includes(k));
  eq(missing.length, 0, 'keys the client has and the server drops: ' + missing.join(','));
  const extra = srvKeys.filter(k => !keys.includes(k));
  eq(extra.length, 0, 'keys the server accepts and the client never sets: ' + extra.join(','));
});
test('v2.6.107: the chat tier is a VARIANT of the one bubble, overriding only what must change', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/function sayBubble\(role, who, seat, text, variant\)/.test(html), 'one recipe, parameterised -- a parallel chatBubble mount would be a second path to drift from');
  assert(/d\.className = \(\(variant==='chat'\) \? 'sayb chatb ' : 'sayb '\)\+sayTextClass\(variant\)/.test(html), "the variant only adds a class; 'sayb' stays the default for quick phrases and verdicts (v2.6.120: + the text recipe class)");
  assert(/while\(_sayFxActive\.length>=3\)/.test(html), 'and the eviction budget stays SHARED -- three bubbles is the whole screen, chat included');
  // the calmer typography: smaller than the phrase face, and a measure that wraps instead of stretching
  assert(/\.sayb\.chatb\{max-width:min\(46ch, 70vw\)\}/.test(html), 'a narrow column, not 92vw');
  assert(/\.sayb\.chatb \.saytxt\{font:700 clamp\(15px, 1\.6vw, 24px\)/.test(html), 'normal reading size (the phrase face is clamp(22px,4.5vw,58px)); v2.6.118: weight 700 for legibility -- the SIZE is what this pins');
  assert(/\.sayb\.chatb \.saycircle\{width:110px/.test(html), 'the 190px medallion would swallow a 16px line -- scaled with the text');
  assert(/\.sayb \.saytxt\{display:block; position:relative; z-index:1; font:700 clamp\(22px, 4\.5vw, 58px\)/.test(html), 'the QUICK PHRASE face is untouched: "Block!" is still a shout across the table');
});
test('v2.6.107: chat animation is gated by its own helper, and the log line never is', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const cb = html.slice(html.indexOf('function chatBubble('), html.indexOf('function chatBubble(') + 900);
  assert(/if\(!hx\('chatFx'\)\) return;/.test(cb), 'hideable locally, host-lockable, off in tournament mode like every helper');
  // the gate sits in the BUBBLE, not in the chat handler: turning the animation off must not cost you the message
  const handler = html.slice(html.indexOf('  chat(m){'), html.indexOf('  chat(m){') + 420);
  assert(/log\(/.test(handler) && !/hx\('chatFx'\)/.test(handler), 'the chat line still reaches the log with the animation off');
});

/* ---------- v2.6.108: THE BOT PANEL ---------- */
test('v2.6.108: botPanelRead never trusts the bot and never throws into the render loop', () => {
  const A = loadClient(CLIENT);
  const live = { status: () => ({ state: 'held', waitingFor: 'hold: Johan', until: null, seat: 2, name: 'Astrid', step: 'release-hold', canStep: true }) };
  const r = A.botPanelRead(live);
  eq(r.name, 'Astrid'); eq(r.state, 'held'); eq(r.waitingFor, 'hold: Johan');
  eq(r.until, null, 'a hold has NO deadline by design (bot 615) -- it ends when a human says so');
  eq(r.step, 'release-hold'); eq(r.canStep, true);
  // status() is THEIR contract; the panel repaints 4x a second and must survive every shape
  eq(A.botPanelRead({ status: () => { throw new Error('boom'); } }).canStep, false, 'a throwing status() degrades to a readable row');
  eq(A.botPanelRead({ status: () => null }).waitingFor, 'no status');
  eq(A.botPanelRead({}).canStep, false, 'a bot with no status() at all (an older release) still renders');
  eq(A.botPanelRead(null).canStep, false);
  eq(A.botPanelRead({ status: () => ({ until: -5 }) }).until, null, 'a nonsense deadline is no deadline');
  eq(A.botPanelRead({ status: () => ({ canStep: true }) }).canStep, true);
});
test('v2.6.108: the countdown reads seconds, and says nothing where there is nothing to say', () => {
  const A = loadClient(CLIENT);
  const now = 1000000;
  eq(A.botPanelCountdown(now + 7400, now), '7s');
  eq(A.botPanelCountdown(now - 3000, now), '0s', 'an expired deadline floors at 0, never counts negative');
  eq(A.botPanelCountdown(null, now), '\u2014', 'a hold gets an em-dash, not a fake number');
  // every step rung the bot can name must have a button label, or the button says "Step" and the user guesses
  ['release-hold', 'resolve-ask', 'resolve-pq', 'resolve-phase', 'resolve-vote'].forEach(k => assert(A.BOT_STEP_LABEL[k], 'labelled: ' + k));   // v2.6.140: bot v0.6.195's combat step and vote poll
});
test('v2.6.108: botPanelSeats collects this tab\'s bots in both modes and tolerates neither existing', () => {
  const A = loadClient(CLIENT);
  const b = n => ({ status: () => ({ name: n, state: 'idle', waitingFor: 'nothing pending' }) });
  A.hotBots[3] = b('Seat3'); A.hotBots[2] = b('Seat2');
  eq(A.botPanelSeats().map(r => r.key).join(','), 's2,s3', 'offline seats in seat order');
  delete A.hotBots[2]; delete A.hotBots[3];
  A.netBots['Bram'] = { bot: b('Bram') }; A.netBots['Astrid'] = { bot: b('Astrid') };
  eq(A.botPanelSeats().map(r => r.key).join(','), 'nAstrid,nBram', 'online by name -- host-only, since only the host holds the sockets');
  A.netBots['Ghost'] = {};
  eq(A.botPanelSeats().length, 2, 'a half-torn-down entry is skipped, not rendered as a broken row');
  delete A.netBots['Bram']; delete A.netBots['Astrid']; delete A.netBots['Ghost'];
  eq(A.botPanelSeats().length, 0);
});
test('v2.6.108: debug is refused under Tournament mode -- the bot cannot see the mode, so we enforce it', () => {
  const A = loadClient(CLIENT);
  A.conv.tournament = false; A.net.helperPolicy = null;
  eq(A.botDebugAllowed(), true, 'an ordinary table may run a debug bot');
  A.net.helperPolicy = { settings: {}, allowLocal: false, tournament: true };
  eq(A.botDebugAllowed(), false, 'online tournament refuses it: debug is perfect information about one seat');
  A.net.helperPolicy = null;
  // v2.6.110: THE MIRROR BUG -- conv.tournament is the player's STORED preference and must NOT override the dropdown
  A.conv.tournament = true;
  A.__doc._ids['offHelpers'] = null;                      // explicitly no dropdown: $() must return null, not the generic stub
  eq(A.botDebugAllowed(), false, 'with no dropdown present, conv.tournament is the only signal and earns the veto');
  delete A.__doc._ids['offHelpers'];
  // but the setup panel's dropdown IS the authority for offline tables
  const fakeOff = { value: 'all', disabled: false };
  A.__doc._ids['offHelpers'] = fakeOff;
  eq(A.botDebugAllowed(), true, "v2.6.110: the dropdown says Helpers on, conv.tournament says tournament -- the DROPDOWN wins, because it is the table's mode, picked deliberately. This was the mirror bug: v2.6.109 let the stored preference override the visible UI");
  fakeOff.value = 'tournament';
  eq(A.botDebugAllowed(), false, 'and when the dropdown says tournament, it is refused regardless of conv');
  delete A.__doc._ids['offHelpers'];
  A.conv.tournament = false;
  // and the spawn option can never be true while it is refused, whatever the checkbox says
  A.net.helperPolicy = { tournament: true };
  eq(A.botDebugOn(), false, 'botDebugOn goes through the gate -- a stale checked box cannot leak perfect information into a tournament');
  A.net.helperPolicy = null;
});
test('v2.6.108: the panel is BOARD_CHROME, and both spawn paths pass the debug option', () => {
  const A = loadClient(CLIENT);
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const el = { closest: q => (String(q).includes('#hotBotBtn') ? {} : null) };
  eq(A.isBoardChrome(el), true, 'the panel swallows the wheel and never starts a pan -- one line in the v2.6.103 constant, both gestures');
  eq((html.match(/debug:botDebugOn\(\)/g) || []).length, 2, 'BOTH spawn paths pass it: online netBotAdd and offline hotBotAdd');
  assert(/Run bot turns/.test(html), 'the offline sweep moved INTO the panel -- step() pulls a wait forward, it does not play a turn');
  assert(html.indexOf("el.textContent='\\ud83e\\udd16 \\u25b6'") === -1, 'and the old floating button is gone, not left competing for the same corner');
});

/* ---------- v2.6.109: the review found three wiring gaps in v2.6.108 -- pinned ---------- */
test('v2.6.109: the panel shows and hides SYMMETRICALLY on both bot paths, and the offline debug row follows the alpha note', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  // (1) online never showed it: the mount lived only on the offline path
  const add = html.slice(html.indexOf('async function netBotAdd('), html.indexOf('async function netBotAdd(') + 3200);
  assert(/netBotHelperLock\(\);\n\s*botCfgSeed\(\);[^\n]*\n\s*hotBotBtnShow\(true\);/.test(add), 'netBotAdd mounts the panel right after the helper lock (v2.6.139: and the tempo seed between them)');
  const rem = html.slice(html.indexOf('function netBotRemove('), html.indexOf('function netBotsTeardown('));
  assert(/hotBotBtnShow\(false\);/.test(rem), 'netBotRemove asks it to collapse away (it only does when the last bot is gone)');
  const td = html.slice(html.indexOf('function netBotsTeardown('), html.indexOf('function netBotsTeardown(') + 700);
  assert(/hotBotBtnShow\(false\);/.test(td), 'and so does the teardown');
  // (2) the hide is CONDITIONAL on there being no bots left -- a remove of one of three must not kill the panel
  const show = html.slice(html.indexOf('function hotBotBtnShow(on){'), html.indexOf('function hotBotBtnShow(on){') + 600);
  assert(/if\(!on && !botBtnWanted\(\)\)\{/.test(show), 'hide only when nothing wants it (v2.6.139: no bot in this tab AND not a seated human at an online bot table)');
  assert(/function botBtnWanted\(\)\{ return botPanelSeats\(\)\.length>0 \|\|/.test(html), '...and the registry is still the first reason to show it');
  // (3) offline: the debug row is the alpha note\'s sibling and must follow the same toggle
  const rs = html.slice(html.indexOf("const _an=$('#offAlphaNote');"), html.indexOf("const _an=$('#offAlphaNote');") + 400);
  assert(/botDebugSync\(\);/.test(rs), 'renderOfflineSeats re-syncs the debug row (it used to wait for a dropdown change)');
});
test('v2.6.109: the 4 Hz loop rebuilds the DOM only when the panel\'s SHAPE changes -- a plain tick never eats a click', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const r = html.slice(html.indexOf('function botPanelRender(){'), html.indexOf('function botPanelRender(){') + 5000);
  assert(/const sig=\(_botPanelOpen\?'o':'c'\)/.test(r), 'a shape signature (open state, rows, names, reasons, rungs, steppability, has-deadline)');
  assert(/if\(el\._botSig===sig\)\{/.test(r), 'an unchanged shape short-circuits');
  assert(/c\.textContent=botPanelCountdown\(r\.st\.until, now\)/.test(r), 'and only rewrites the countdown text in place');
  assert(/class="botPanelCd" data-i="'\+i\+'"/.test(r), 'the countdown span is addressable for that in-place update');
  const sigLine = r.slice(r.indexOf('const sig='), r.indexOf('\n', r.indexOf('const sig=')));
  assert(!/until\)/.test(sigLine) || /until==null\?'-':'t'/.test(sigLine), 'the DEADLINE VALUE is deliberately NOT in the signature -- only whether one exists -- or every second would rebuild the buttons');
});

/* ---------- v2.6.111: TWO NAMES FOR ONE THING ---------- */
test('v2.6.111: the helperPolicy broadcast lands -- the server calls the field `policy`, `joined` calls it `helperPolicy`', () => {
  const A = loadClient(CLIENT);
  const srv = require('fs').readFileSync(require('path').resolve(__dirname, 'elysium-server.js'), 'utf8');
  // the two server send sites really do disagree -- that is the fact this test exists to pin
  assert(/bcast\(room, \{ t:'helperPolicy', policy: room\.helperPolicy \}\)/.test(srv), "the broadcast carries `policy`");
  assert(/msg\.helperPolicy = room\.helperPolicy/.test(srv), '`joined` carries `helperPolicy`');
  const locked = { settings: { on: true, passConfirm: true }, allowLocal: false, tournament: false };
  A.net.status = 'in'; A.conv.tournament = true;        // the local setting hx() falls through to when the policy is lost
  A.MP_HANDLERS.helperPolicy({ t: 'helperPolicy', policy: locked });
  assert(A.net.helperPolicy, 'the LIVE broadcast shape lands -- reading only m.helperPolicy nulled it, and then hx() fell through to the local conv.tournament: every helper off on a table created with "All helpers on"');
  eq(A.net.helperPolicy.allowLocal, false);
  eq(A.hx('on'), true, 'and the table policy beats the local tournament setting, which is the whole point of locking it');
  A.MP_HANDLERS.helperPolicy({ t: 'helperPolicy', helperPolicy: locked });
  assert(A.net.helperPolicy, 'the joined-style name still works, so an older or newer server both land');
  A.MP_HANDLERS.helperPolicy({ t: 'helperPolicy' });
  eq(A.net.helperPolicy, null, 'and a genuinely empty push still clears it');
  A.conv.tournament = false; A.net.status = 'off'; A.net.helperPolicy = null;
});
test('v2.6.111: create sends the policy the dropdown names, and `all` really means locked-and-on', () => {
  const A = loadClient(CLIENT);
  const all = A.helperPolicyFor('all');
  eq(all.allowLocal, false); eq(all.tournament, false);
  assert(A.HELPER_DEFS.every(d => all.settings[d.key] === true), 'every helper on');
  A.net.status = 'in'; A.net.helperPolicy = all; A.conv.tournament = true;
  A.HELPER_DEFS.forEach(d => eq(A.hx(d.key), true, d.key + ' is on under an all-locked table even with local tournament set'));
  A.conv.tournament = false; A.net.status = 'off'; A.net.helperPolicy = null;
});

/* ---------- v2.6.112: ABSENT IS NOT OFF ---------- */
test('v2.6.112: a helper key the locked policy never mentions falls through to local, not to OFF', () => {
  const A = loadClient(CLIENT);
  A.net.status = 'in'; A.conv.tournament = false;
  // exactly what a srv-2.6.35 room stamps: cleanHelperPolicy rebuilds settings from ITS OWN
  // HELPER_KEYS, so a helper newer than the running server is simply not in the map
  const older = { settings: {}, allowLocal: false, tournament: false };
  A.HELPER_DEFS.filter(d => d.key !== 'chatFx').forEach(d => { older.settings[d.key] = true; });
  A.net.helperPolicy = older;
  eq('chatFx' in older.settings, false, 'the older server never heard of this key');
  eq(A.hx('on'), true, 'keys the table DOES govern still come from the table');
  eq(A.hx('chatFx'), true, "v2.6.107's chat animation was dead on every srv-2.6.35 table: absent read as off, so chatBubble returned before it ever drew");
  // and a key the table genuinely turns OFF is still off -- that is the distinction
  older.settings.chatFx = false;
  eq(A.hx('chatFx'), false, '"the table says off" and "the table has never heard of this" must not collapse into one answer');
  delete older.settings.chatFx;
  // tournament still wins over everything, known key or not
  A.net.helperPolicy = { settings: {}, allowLocal: false, tournament: true };
  eq(A.hx('chatFx'), false, 'tournament mode is absolute -- an unknown key must not become a hole in it');
  eq(A.hx('on'), false);
  A.net.helperPolicy = null; A.net.status = 'off';
});
test('v2.6.112: the bot panel sits top-right, clear of the pool globe', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const at = html.indexOf("el.id='hotBotBtn'");
  const css = html.slice(html.indexOf("cssText='", at) + 9, html.indexOf("';", html.indexOf("cssText='", at)));   // the STYLE STRING only -- the comment beside it says "was bottom:64px", and a prose match would read it (third time this session; match code, not words)
  assert(/top:74px/.test(css), 'under the menu bar');
  assert(!/bottom:/.test(css), 'and no longer anchored to the bottom, where a laptop viewport puts the pool globe over it');
});

/* ---------- v2.6.113: WHOSE BUBBLE ---------- */
test('v2.6.113: chatBubbleWanted -- three modes, and an unknown value falls back to the default', () => {
  const A = loadClient(CLIENT);
  A.net.you = 'Johan';
  A.conv.chatBubbles = 'others';
  eq(A.chatBubbleWanted('Astrid'), true, 'default: other people pop');
  eq(A.chatBubbleWanted('Johan'), false, 'default: your own line does not -- the v2.6.50 behaviour, now a CHOICE instead of a hard-coded test in the handler');
  A.conv.chatBubbles = 'all';
  eq(A.chatBubbleWanted('Johan'), true, 'Show all includes your own');
  eq(A.chatBubbleWanted('Astrid'), true);
  A.conv.chatBubbles = 'none';
  eq(A.chatBubbleWanted('Astrid'), false, 'Hide all means all');
  eq(A.chatBubbleWanted('Johan'), false);
  A.conv.chatBubbles = 'nonsense';
  eq(A.chatBubbleWanted('Johan'), false, 'a stored value from another build falls back to the default rather than showing everything');
  eq(A.chatBubbleWanted('Astrid'), true);
  A.conv.chatBubbles = 'others'; A.net.you = null;
});
test('v2.6.113: the local filter can only SUBTRACT from what the table allows', () => {
  const A = loadClient(CLIENT);
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const cb = html.slice(html.indexOf('function chatBubble(who, seat, text'), html.indexOf('function chatBubble(who, seat, text') + 900);   // v2.6.115 added a 4th parameter -- anchor on the stem
  const iTable = cb.indexOf("hx('chatFx')"), iMine = cb.indexOf('chatBubbleWanted(');
  assert(iTable > -1 && iMine > iTable, "the TABLE's gate is asked first: a local preference must never show a bubble the host has locked off, or tournament mode has a hole in it");
  // the handler no longer decides who: that is what made it unchoosable
  const h = html.slice(html.indexOf('  chat(m){'), html.indexOf('  chat(m){') + 340);
  assert(!/!==\(net\.you/.test(h), 'the "not mine" test is out of the handler');
  assert(/chatBubble\(m\.who, 0, m\.msg, 'wire'\)/.test(h), 'which now calls unconditionally and lets the filter decide -- tagged `wire` since v2.6.115 so the filter can tell an echo from a first showing');
  // and the setting persists like every other conv value
  assert(/chatBubbles:'others'/.test(html), 'a default in conv');
  assert(/s\.chatBubbles==='all'\|\|s\.chatBubbles==='others'\|\|s\.chatBubbles==='none'/.test(html), 'validated on load');
  assert(/'hoverPreview','chatBubbles'/.test(html), 'and carried by settings profiles like its neighbour');
  // quick phrases must be untouched -- they have their own animation and their own setting
  const sb = html.slice(html.indexOf('function sayBubble(role, who, seat, text, variant)'), html.indexOf('function sayBubble(role, who, seat, text, variant)') + 700);
  assert(!/chatBubbleWanted/.test(sb), 'sayBubble never consults the chat filter');
});

/* ---------- v2.6.114: the tiers never cross ---------- */
test('v2.6.114: a quick phrase NEVER reaches the chat tier, and chat never reaches the loud one', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const body = html.slice(html.indexOf('function sayBubble(role, who, seat, text, variant)'));
  // exactly one caller asks for the calm tier; the rest are the loud one
  const calls = [];
  for (let i = body.indexOf('sayBubble('); i > -1; i = body.indexOf('sayBubble(', i + 1)) {
    const line = body.slice(i, body.indexOf('\n', i));
    if (/^sayBubble\(role, who, seat, text, variant\)/.test(line)) continue;   // the definition
    calls.push(/'chat'/.test(line) ? 'chat' : 'loud');
  }
  eq(calls.filter(c => c === 'chat').length, 1, 'ONE caller asks for .chatb -- chatBubble, and nothing else');
  assert(calls.filter(c => c === 'loud').length >= 2, 'the quick phrase and the resolver verdict both stay loud');
  // showSay is the quick-phrase path: it must not know the chat tier exists
  const sy = html.slice(html.indexOf('function showSay(i, who, seat)'), html.indexOf('function restoreFromPub('));
  assert(!/chatBubble/.test(sy), "a quick phrase must not also pop a chat bubble -- Johan's ask: a phrase is meant to be seen, and seen ONCE");
  assert(!/'chat'/.test(sy), 'and never asks sayBubble for the calm variant');
  // and the chat handler is not a second route into the phrase table
  const ch = html.slice(html.indexOf('  chat(m){'), html.indexOf('  chat(m){') + 340);
  assert(!/showSay|SAY\[/.test(ch), 'the chat channel never renders a quick phrase');
});

/* ---------- v2.6.115: THE ECHO, THE STOPWATCH AND THE X ---------- */
test('v2.6.115: the wire echo of your OWN chat line never bubbles, in any mode', () => {
  const A = loadClient(CLIENT);
  A.net.you = 'Johan';
  A.conv.chatBubbles = 'all';
  eq(A.chatBubbleWanted('Johan'), true, "Show all still shows your own line -- painted by the SEND path, the moment you press Enter");
  eq(A.chatBubbleWanted('Johan', 'wire'), false, 'but the server echoing it back does NOT paint a second one -- the double bubble Johan reported');
  eq(A.chatBubbleWanted('Astrid', 'wire'), true, 'someone else arrives only over the wire, so the wire must still be allowed to bubble');
  A.conv.chatBubbles = 'others';
  eq(A.chatBubbleWanted('Johan'), false, 'Hide mine is unchanged');
  eq(A.chatBubbleWanted('Johan', 'wire'), false);
  eq(A.chatBubbleWanted('Astrid', 'wire'), true);
  A.conv.chatBubbles = 'none';
  eq(A.chatBubbleWanted('Astrid', 'wire'), false, 'Hide all still means all');
  A.conv.chatBubbles = 'others'; A.net.you = null;
});
test('v2.6.115: only the wire side is tagged -- the send path stays the one that paints', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const h = html.slice(html.indexOf('  chat(m){'), html.indexOf('  chat(m){') + 340);
  assert(/chatBubble\(m\.who, 0, m\.msg, 'wire'\)/.test(h), 'the handler marks its call as the echo');
  const send = html.slice(html.indexOf("if(inRoom()){ mpSend({t:'chat'"), html.indexOf("if(inRoom()){ mpSend({t:'chat'") + 320);
  assert(/chatBubble\(_who, _seat, _msg\)/.test(send) && !/'wire'/.test(send), 'the sender-side paint is untagged: it is the one your own line keeps');
});
test('v2.6.115: dfxCancel is the ONE way a Reaction window stops early', () => {
  const A = loadClient(CLIENT);
  eq(typeof A.dfxCancel, 'function', 'exposed for the suite');
  eq(A.dfxCancel(), false, 'no window running -> nothing to cancel, and no throw');
  A.net.dfxT = setInterval(() => {}, 1000);
  eq(A.dfxCancel(), true, 'a running window is cancelled');
  eq(A.net.dfxT, null, 'and the timer handle is cleared, which is what every caller checks');
  eq(A.dfxCancel(), false, 'idempotent -- a second answer to the same window is a no-op');
});
test('v2.6.115: a quick phrase, a played card and an announced action all end the window', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const sy = html.slice(html.indexOf('function showSay(i, who, seat)'), html.indexOf('function restoreFromPub('));
  assert(/dfxCancel\(\);/.test(sy), 'the v2.6.33 behaviour, now through the shared path');
  const fx = html.slice(html.indexOf('function cardFx(c, kind, opts)'), html.indexOf('function cardFx(c, kind, opts)') + 2600);
  const iCancel = fx.indexOf('dfxCancel()'), iAnim = fx.indexOf("if(animMode==='all') return;");
  assert(iCancel > -1 && iAnim > iCancel, 'the cancel sits ABOVE the animMode early-returns -- a player who renders no animations still gets it, and a remote fx cancels exactly as my own play does');
  assert(/kind==='play' \|\| \(kind==='lock' && opts\.verb && !\/\^by \/\.test\(String\(opts\.verb\)\)\)/.test(fx), "a bare Lock carries no verb and is not an answer; an announced action's clone always does");
  const acts = html.slice(html.indexOf('const act=(verb,fxv,resolve=true'), html.indexOf('const act=(verb,fxv,resolve=true') + 1500);   // v2.6.137: the signature gained undir
  assert((acts.match(/dfxCancel\(\)/g) || []).length >= 2, 'act() and actBleed() cancel locally too, for the autoLock-off case where no clone is emitted at all');
  // and the resolver counters deliberately do NOT: a bot writes its stealth tally at every announce
  const tally = html.slice(html.indexOf('  tally(m){'), html.indexOf('  tally(m){') + 700);
  assert(!/dfxCancel/.test(tally), 'a tally is not evidence that anybody reacted');
});
test('v2.6.115: the lobby X makes the bot LEAVE, and only closes its socket once the seat is gone', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const rem = html.slice(html.indexOf('function netBotRemove('), html.indexOf('function netBotsTeardown('));
  const iLeave = rem.indexOf("rec.bot.send({ t:'leave' })"), iWait = rem.indexOf('netBotLobbyHas(nm)'), iClose = rem.indexOf('rec.bot.close()');
  assert(iLeave > -1, "the bot departs on its OWN socket -- a bare close is a DISCONNECT and the server holds the seat for the reconnect window");
  assert(iWait > iLeave && iClose > iWait, 'the close waits for the lobby push to confirm the seat is gone');
  const iKick = rem.indexOf("t:'kick'");
  assert(iKick > iLeave && iKick < iClose, 'the host kick stays as the fallback for a bot whose socket is already dead');
  assert(/hotBotBtnShow\(false\);/.test(rem), 'netBotRemove asks the panel to collapse away (it only does when the last bot is gone)');
  assert(/async function netBotRemove/.test(html), 'and it is async, so the caller can await the confirmation');
});

/* ---------- v2.6.117: THE PERMANENT RESUME ---------- */
test('v2.6.117: a table that ends by `closed` is cleared and forgets its save -- it never becomes a solo save', () => {
  const A = loadClient(CLIENT);
  A.net.status = 'in'; A.net.room = 'R'; A.net.you = 'J'; A.net.deckUp = true;
  A.net.ws = { readyState: 1, send(){}, close(){} };
  const c = A.makeCard('Zip', 'crypt'); A.move(c, 'ready', {});
  A.__ls.setItem('elysium.game::R::J', 'the online save');
  assert(A.state.cards.size === 1, 'an online deal put a card on the felt');
  A.MP_HANDLERS.closed({ msg: 'The host closed the table.' });
  eq(A.state.cards.size, 0, 'the felt is cleared -- hadGame used to read inRoom(), which `closed` had already set to off, so the online board stayed and the minute autosave wrote it to the BARE key');
  eq(A.__ls.getItem('elysium.game::R::J'), null, "the room's own save is removed, as on an ordinary leave");
  eq(A.__ls.getItem('elysium.game'), null, 'and nothing landed on the solo key -- the permanent Resume Johan saw');
  eq(A.net.room, null); eq(A.net.deckUp, false);
});
test('v2.6.117: the failed-rejoin path clears the dead room\'s table the same way', () => {
  const A = loadClient(CLIENT);
  A.net.status = 're'; A.net.room = 'R'; A.net.you = 'J'; A.net.deckUp = true;
  const c = A.makeCard('Zip', 'crypt'); A.move(c, 'ready', {});
  A.__ls.setItem('elysium.game::R::J', 'the online save');
  A.MP_HANDLERS.err({ msg: 'No such room.' });
  eq(A.state.cards.size, 0, 'the room is gone; its cards go with it');
  eq(A.__ls.getItem('elysium.game::R::J'), null);
  eq(A.__ls.getItem('elysium.game'), null);
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/const hadGame=!!net\.deckUp;/.test(html), 'the question is whether an online deal put the cards here -- deckUp answers it without consulting net.status');
  const code = html.split('\n').filter(l => !/^const VERSION=/.test(l)).join('\n');   // the release note names the function too
  eq((code.match(/mpTableGone\(/g) || []).length, 3, 'one definition, two callers (mpLeave and the failed rejoin)');
});

/* ---------- v2.6.118: FIVE FROM THE FEEDBACK ROUND ---------- */
test('v2.6.118: four new rebindable actions with their defaults; § and Tab left the fixed list and the fixed dispatch block', () => {
  const A = loadClient(CLIENT);
  const by = {}; for (const a of A.ACTIONS) by[a.id] = a;
  for (const [id, key] of [['phaseNext', '§'], ['chatFocus', 'Enter'], ['cycleView', 'V'], ['activeHome', 'Tab']]) {
    assert(by[id], id + ' exists'); eq(by[id].grp, 'adv', id + ' is advanced'); eq(by[id].def, key, id + ' default key'); eq(typeof by[id].fn, 'function');
  }
  eq(!!by.chatFocus.nav && !!by.cycleView.nav && !!by.activeHome.nav, true, 'view/UI moves are not undo points');
  eq(!by.phaseNext.nav, true, 'the phase cycle IS an undo point, exactly like F1-F5');
  eq(typeof by.cycleView.when, 'function'); eq(typeof by.activeHome.when, 'function'); eq(typeof by.chatFocus.when, 'function'); eq(by.chatFocus.when, A.chatFocusWanted, 'v2.6.119: the gate also reads the focused control');
  eq(A.keyBinds.phaseNext, '§'); eq(A.keyBinds.activeHome, 'Tab');
  assert(!A.MOUSE_FIXED.some(m => /§/.test(m[0]) || /^Tab/.test(m[0])), 'the fixed-controls list no longer claims § or Tab');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(!/e\.key==='§'/.test(html) && !/e\.key==='Tab'\)\{ e\.preventDefault\(\); toggleActiveHome/.test(html), 'the fixed dispatch lines are gone -- the keymap owns both keys now');
  assert(/document\.addEventListener\('keydown',keyDispatch\);/.test(html), 'the global handler IS keyDispatch');
});
test('v2.6.118: keyBindsReconcile -- a newcomer whose default the player had already bound elsewhere starts unbound; the player\'s binding wins', () => {
  const A = loadClient(CLIENT);
  const draw = A.ACTIONS[0].id;
  A.keyBinds[draw] = 'V';                                   // as the loader would have applied it from storage
  const blanked = A.keyBindsReconcile({ [draw]: 'V' });
  eq(JSON.stringify(blanked), JSON.stringify(['cycleView']), 'cycleView (default V) yields to the stored binding');
  eq(A.keyBinds.cycleView, ''); eq(A.keyBinds[draw], 'V');
  A.keyBinds[draw] = 'D'; A.keyBinds.cycleView = 'V';
  eq(A.keyBindsReconcile({ [draw]: 'D' }).length, 0, 'no collision, nothing blanked');
  eq(A.keyBindsReconcile({ cycleView: 'V' }).length, 0, 'a stored key for the action itself is not a collision with itself');
});
test('v2.6.118: keyDispatch -- Enter focuses the chat line only when it is on screen; typing inside an input never dispatches; a when()-gated key is left to the browser', () => {
  const A = loadClient(CLIENT);
  let focused = 0, prevented = 0;
  A.__doc._ids['chatIn'] = { focus(){ focused++; }, hidden:false, classList:{ contains:()=>false, add(){}, remove(){}, toggle(){} } };
  A.__doc._ids['chatRow'] = { hidden:true };
  const ev = (key, extra) => Object.assign({ key, target:{ matches:()=>false }, preventDefault(){ prevented++; } }, extra || {});
  eq(A.chatVisible(), false);
  eq(A.keyDispatch(ev('Enter')), false, 'no chat line: the action does not apply -> not handled'); eq(focused, 0); eq(prevented, 0, 'and NOT prevented -- the browser keeps Enter');
  A.__doc._ids['chatRow'] = { hidden:false };
  eq(A.chatVisible(), true);
  eq(A.keyDispatch(ev('Enter')), true, 'chat line on screen: Enter is handled'); eq(focused, 1); eq(prevented, 1);
  eq(A.keyDispatch(ev('Enter', { target:{ matches:sel=>true } })), false, 'inside an input the keymap is silent (the field already has the caret)'); eq(focused, 1);
  A.__doc.activeElement = { tagName:'BUTTON' };
  eq(A.keyDispatch(ev('Enter')), false, 'v2.6.119: a FOCUSED button owns Enter -- not taken, not prevented, the control activates'); eq(focused, 1); eq(prevented, 1);
  A.__doc.activeElement = { tagName:'BODY' };
  eq(A.keyDispatch(ev('Enter')), true, 'a bare focus hands Enter to the chat line again'); eq(focused, 2); eq(prevented, 2);
  delete A.__doc.activeElement;
  eq(A.keyDispatch(ev('V')), false, 'cycleView is gated on tableView(): not in a room -> the key is not taken'); eq(prevented, 2);
  A.localTable = true;
  eq(A.keyDispatch(ev('V')), true, 'in a (hotseat) room the same key is handled'); eq(prevented, 3);
  A.localTable = false;
  delete A.__doc._ids['chatIn']; delete A.__doc._ids['chatRow'];
});
testA('v2.6.118: § cycles the phases through activatePhase -- -1 -> Unlock, Unlock -> Master, Discard wraps to Unlock', async () => {
  const A = loadClient(CLIENT);
  A.state.phase = -1;
  const ev = key => ({ key, target:{ matches:()=>false }, preventDefault(){} });
  eq(A.keyDispatch(ev('§')), true, 'the key is bound');
  await new Promise(r => setTimeout(r, 20));
  eq(A.state.phase, 0, 'before the first phase of a turn the cycle starts at Unlock');
  await A.phaseNext(); eq(A.state.phase, 1, 'Unlock -> Master (through phaseLeaveOK, which resolves on an empty board)');
  A.state.phase = 4; await A.phaseNext(); eq(A.state.phase, 0, 'Discard wraps to Unlock');
});
testA('v2.6.118: during the offline bot sweep the ACTING bot is net.turnSeat, and the human\'s seat is restored after -- what Tab (toggleActiveHome) reads', async () => {
  const A = loadClient(CLIENT);
  const HB = A.hotBridge;
  HB.reset([{ name:'You' }, { name:'Two', bot:true }]);
  HB.seats[2] = { name:'Two', deck:{}, lib:[], crypt:[] };
  A.net.roster = [{ seat:1, name:'You' }, { seat:2, name:'Two', bot:true }];
  A.net.you = 'You'; A.net.turnSeat = 1; A.localTable = true;
  const seen = [];
  HB.turn = seat => { seen.push({ seat, turnSeat: A.net.turnSeat }); setTimeout(() => HB.onPass(seat), 0); };
  const order = await A.hotRunBotTurns(1, 1);
  eq(JSON.stringify(order), '[2]');
  eq(seen.length, 1); eq(seen[0].turnSeat, 2, 'while the bot plays, IT is the active seat -- v2.6.117 kept the human here, so Tab always "went home"');
  eq(A.net.turnSeat, 1, 'the human\'s seat is back before pass() writes the next one');
  A.localTable = false; A.net.roster = []; HB.reset([]);
});
test('v2.6.118: Esc on the idle start screen skips goHome -- the felt and the pool globe stay off the welcome card (source pin: the handler is a document listener the harness cannot fire)', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/if\(state\.picking\)\{ stopPicking\(\); return; \} if\(!tableIdle\(\)\) goHome\(\); clearSel\(\); \}/.test(html), 'the Esc rung reads the idle predicate before going home');
  const css = html.slice(0, html.indexOf('<script'));
  assert(/#sayFx \.sayb\.txt-crisp \.saytxt\{font-weight:700; color:#f4ecdc; text-shadow:0 1px 2px #000/.test(css), 'the crisp chat text (weight 700, brighter, tight dark halo) -- v2.6.120: now the .txt-crisp recipe, the chat tier\'s default via conv.chatText');
  assert(/\.sayb\.chatb \.saycircle\{width:110px; height:110px; opacity:\.32\}/.test(css) && /\.sayb\.chatb \.sayclan\{width:100px; height:100px; opacity:\.40\}/.test(css), 'the medallion and the clan mark keep their transparency');
});

/* ---------- v2.6.120: THE BUBBLE IS YOURS TO TUNE ---------- */
test('v2.6.120: sayBubbleMs -- 100% is exactly the v2.6.96 numbers; each tier reads ITS multiplier; out-of-range values fall back to 1.0', () => {
  const A = loadClient(CLIENT);
  eq(A.conv.sayDur, 1.0); eq(A.conv.chatDur, 1.0); eq(A.conv.sayText, 'normal'); eq(A.conv.chatText, 'crisp');
  eq(A.sayBubbleMs('Block!'), 3000); eq(A.sayBubbleMs('Block!', 'chat'), 3000);
  const long = 'x'.repeat(120); eq(A.sayBubbleMs(long), 7500); eq(A.sayBubbleMs(long, 'chat'), 7500);
  A.conv.sayDur = 0.5; A.conv.chatDur = 2.0;
  eq(A.sayBubbleMs('Block!'), 1500, 'quick phrases at 50%'); eq(A.sayBubbleMs('Block!', undefined), 1500, 'verdicts (no variant) share the quick-phrase tier');
  eq(A.sayBubbleMs('Block!', 'chat'), 6000, 'chat at 200%'); eq(A.sayBubbleMs(long, 'chat'), 15000, 'the 9 s cap is the base; the multiplier applies after it');
  A.conv.sayDur = 7; eq(A.sayBubbleMs('Block!'), 3000, 'an out-of-range value is ignored, not applied');
  A.conv.sayDur = 1.0; A.conv.chatDur = 1.0;
});
test('v2.6.120: sayTextClass -- per tier, unknown values fall to the tier default; the bubble element wears the class; the three CSS recipes set weight/colour/shadow only and sit after the .chatb rules', () => {
  const A = loadClient(CLIENT);
  eq(A.sayTextClass(), 'txt-normal'); eq(A.sayTextClass('chat'), 'txt-crisp');
  A.conv.sayText = 'crisp'; A.conv.chatText = 'soft'; eq(A.sayTextClass(), 'txt-crisp'); eq(A.sayTextClass('chat'), 'txt-soft');
  A.conv.sayText = 'bogus'; A.conv.chatText = 'bogus'; eq(A.sayTextClass(), 'txt-normal', 'unknown -> the quick-phrase default'); eq(A.sayTextClass('chat'), 'txt-crisp', 'unknown -> the chat default');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/d\.className = \(\(variant==='chat'\) \? 'sayb chatb ' : 'sayb '\)\+sayTextClass\(variant\);/.test(html), 'sayBubble puts the recipe class on the ONE element');
  assert(/d\.style\.animationDuration=sayBubbleMs\(text, variant\)\+'ms';/.test(html), 'and passes the tier to the timer');
  const css = html.slice(0, html.indexOf('<script'));
  for (const m of ['soft', 'normal', 'crisp']) {
    const sel = '#sayFx .sayb.txt-' + m + ' .saytxt{';
    assert(css.indexOf(sel) > 0, 'v2.6.121: recipe ' + m + ' is anchored on #sayFx -- an id outranks .sayb.chatb .saytxt wherever the rules sit (v2.6.120 relied on source order)');
    const rule = css.slice(css.indexOf(sel)); const body = rule.slice(0, rule.indexOf('}')); assert(!/font:|font-size|clamp\(/.test(body), 'recipe ' + m + ' never touches the size clamp');
  }
  assert(/const host=\$\('#sayFx'\);/.test(html), 'and #sayFx IS where every bubble mounts, so the anchor always applies');
  assert(!/\n\.sayb\.txt-/.test(css), 'no un-anchored recipe left behind');
  assert(/\.sayb\.chatb \.saycircle\{width:110px; height:110px; opacity:\.32\}/.test(css) && /\.sayb\.chatb \.sayclan\{width:100px; height:100px; opacity:\.40\}/.test(css), 'medallion + clan mark untouched');
  assert(!/\.sayb\.txt-[a-z]+ \.say(circle|clan)/.test(css), 'no recipe reaches the medallion or the clan mark');
});
test('v2.6.120: the four controls exist once under Table > Advanced, join the Lite/Full profile, the loader clamps them, and the chat-bubbles tooltip no longer claims a setting that did not exist', () => {
  const A = loadClient(CLIENT, { storage: { 'elysium.convenience': JSON.stringify({ sayDur: 0.75, chatDur: 9, sayText: 'crisp', chatText: 'weird' }) } });
  eq(A.conv.sayDur, 0.75, 'a stored in-range multiplier loads'); eq(A.conv.chatDur, 1.0, 'an out-of-range one is dropped'); eq(A.conv.sayText, 'crisp'); eq(A.conv.chatText, 'crisp', 'an unknown text mode keeps the default (v2.6.113 rule)');
  for (const k of ['sayDur', 'chatDur', 'sayText', 'chatText']) assert(A.SETTINGS_CONV_KEYS.includes(k), k + ' is in the profile (Reset restores it, (custom) sees it)');
  const d = A.settingsDefaults('full'); eq(d.conv.sayDur, 1.0); eq(d.conv.chatText, 'crisp');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const m = html.slice(html.indexOf('id="settingsModal"'), html.indexOf('id="settingsModal"') + 60000);
  for (const id of ['sayDurDn', 'sayDurVal', 'sayDurUp', 'chatDurDn', 'chatDurVal', 'chatDurUp', 'convSayText', 'convChatText']) eq((m.match(new RegExp('id="' + id + '"', 'g')) || []).length, 1, '#' + id + ' exactly once');
  const iAnim = m.indexOf('id="animSpeedUp"'), iSay = m.indexOf('id="sayDurDn"'), iFold = m.indexOf('Hide the neutral rings');
  assert(iAnim < iSay && iSay < iFold, 'the rows sit right after Animation length in the Table Advanced fold');
  assert(!/which has its own setting above/.test(html), 'the v2.6.114 misstatement is gone from the HTML');
  assert(/never touches the quick-phrase bubbles &mdash; their time and text are set under Table &rsaquo; Advanced/.test(html), 'and the tooltip names where the quick-phrase setting actually lives');
  assert(/they share the bubble/.test(html), 'the quick-phrase row says verdicts ride along (v2.6.114: the loud tier has two sources)');
});

/* === v2.6.122: THE PARITY ROUND -- online <-> hotseat parity for bots (bot-project spec, 21 Sep 2026) === */
function parityTable(A, names){   // names: [['You'], ['B2', true], ...] -> a local table with FAKE bridge seats that record what they are sent
  const HB = A.hotBridge, got = {};
  HB.reset(names.map(n => ({ name: n[0], bot: !!n[1] })));
  A.net.roster = names.map((n, i) => ({ seat: i + 1, name: n[0], bot: !!n[1], vp: 0 }));
  A.net.you = names.find(n => !n[1])[0]; A.net.boards = {}; A.net.hot = { boards: {}, undo: {} };
  names.forEach((n, i) => { if (n[1]){ got[i + 1] = []; HB.seats[i + 1] = { name: n[0], cb: { msg: j => got[i + 1].push(JSON.parse(j)) } }; } else A.net.hot.boards[i + 1] = JSON.stringify({ pool: 30, cards: [], zones: {} }); });
  A.localTable = true;
  return { HB, got, from: (seat, m) => HB._fromBot(seat, HB.seats[seat], m), clear: () => Object.keys(got).forEach(k => { got[k].length = 0; }) };
}
test('v2.6.122 tally: the bridge keeps ONE table tally like the server -- a bot\'s partial write reaches every bot INCLUDING the sender and the human\'s avr; absent fields are preserved, a mode change starts fresh, res is relayed and never stored', () => {
  const A = loadClient(CLIENT); const T = parityTable(A, [['You'], ['B2', true], ['B3', true]]);
  T.from(2, { t: 'tally', mode: 'block', a: 1 });
  T.from(3, { t: 'tally', mode: 'block', b: 2 });
  for (const k of [2, 3]){ const last = T.got[k][T.got[k].length - 1]; eq(T.got[k].length, 2, 'seat ' + k + ' got both broadcasts (no except -- the sender too)'); eq(last.t, 'tally'); eq(last.who, 'B3'); eq(last.a, 1, 'the actor\'s stealth survived the blocker\'s partial write (srv-2.6.17)'); eq(last.b, 2); }
  eq(A.avr.mode, 'block'); eq(A.avr.a, 1); eq(A.avr.b, 2, 'the human\'s Played-tab counters follow, through MP_HANDLERS.tally');
  T.from(2, { t: 'tally', mode: 'vote', a: 3 });
  eq(T.HB.tally.b, 0, 'a mode change starts fresh -- the block\'s intercept does not leak into the referendum'); eq(T.HB.tally.ph, 0); eq(T.HB.tally.rd, 1);
  T.clear(); T.from(2, { t: 'tally', mode: null, a: 0, b: 0, res: 1 });
  eq(T.got[3][0].res, 1, 'res rides the broadcast'); eq(T.HB.tally, null, '...and is never stored');
  T.from(2, { t: 'tally', mode: 'bogus', a: 5 }); eq(T.HB.tally, null, 'an unknown mode is null, as the server\'s validator has it');
  A.localTable = false; T.HB.reset([]);
});
test('v2.6.122 tally: the combat duel map is merged PER SEAT and dropped when the tally leaves combat; the human\'s own counters and announcement go the same way as who:<human>', () => {
  const A = loadClient(CLIENT); const T = parityTable(A, [['You'], ['B2', true], ['B3', true]]);
  T.from(2, { t: 'tally', mode: 'combat', a: 0, b: 0, duelCid: 'v7', duelName: 'Lenny' });
  A.hotTallySend({ t: 'tally', mode: 'combat', a: 2, b: 0, ph: 1, rd: 1, duelCid: 'c4', duelName: 'Mine' });
  const last = T.got[3][T.got[3].length - 1];
  eq(last.who, 'You'); eq(last.a, 2); eq(last.ph, 1);
  eq(last.duel[2].cid, 'v7', 'the human\'s whole-state push did not erase the bot\'s announcement'); eq(last.duel[1].name, 'Mine'); eq(last.duel[1].who, 'You');
  T.from(3, { t: 'tally', mode: 'combat', duelCid: null }); assert(!T.HB.tally.duel[3] && T.HB.tally.duel[2], 'duelCid:null leaves, for that seat only');
  A.hotTallySend({ t: 'tally', mode: null, a: 0, b: 0, ph: 0, rd: 1 }); eq(T.HB.tally, null);
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/function avrCanPush\(\)\{ return !\(net\.spect \|\| \(!inRoom\(\) && !hotBotsSeated\(\)\)\); \}/.test(html) && /function avrPush\(\)\{ if\(!avrCanPush\(\)\) return;/.test(html), 'avrPush no longer returns just because there is no room');   // v2.6.164: the guard lives in avrCanPush (the unsent-click memory reads it too)
  eq((html.match(/else if\(!inRoom\(\)\) hotTallySend\(\{ t:'tally', mode:null/g) || []).length, 2, 'both the Block clear and the Vote/Combat resolve have the hotseat twin');
  assert(/avrDuelRender\(\); hotTallySend\(\{ t:'tally', mode:avr\.mode/.test(html), 'and so does the duel announcement');
  A.localTable = false; T.HB.reset([]);
  const B = loadClient(CLIENT); B.hotBridge.reset([{ name: 'A' }, { name: 'B' }]); B.localTable = true; B.net.you = 'A';
  B.hotTallySend({ t: 'tally', mode: 'block', a: 1 }); eq(B.hotBridge.tally, null, 'a human-only hotseat is untouched: no bot seats, no table tally');
  B.localTable = false;
});
test('v2.6.122 bounty: a bot\'s oust marks it out, pays the LIVE predator (skipping ousted seats) by VERB when that is a bot and into the live pool when it is the active human, and every bot gets the server\'s roster shape', () => {
  const A = loadClient(CLIENT); const T = parityTable(A, [['You'], ['B2', true], ['B3', true], ['B4', true]]);
  A.state.pool = 30;
  T.from(3, { t: 'bounty' });
  const b2 = T.got[2].filter(m => m.t === 'bounty'); eq(b2.length, 1, 'the bot predator got the verb'); eq(b2[0].from, 'B3');
  eq(T.got[4].filter(m => m.t === 'bounty').length, 0, 'nobody else did');
  for (const k of [2, 3, 4]){ const r = T.got[k].filter(m => m.t === 'roster'); eq(r.length, 1, 'seat ' + k + ' got ONE roster'); const p3 = r[0].players[2];
    eq(JSON.stringify(Object.keys(p3).sort()), JSON.stringify(['bot', 'name', 'online', 'out', 'seat', 'vacant', 'vp']), 'rosterUpd\'s player shape'); eq(p3.out, true); eq(p3.online, true); eq(p3.vacant, false); eq(r[0].players[1].vp, 1, 'the predator\'s VP rides the roster'); }
  eq(A.net.roster[2].out, true, 'the client\'s own roster agrees'); eq(A.net.roster[1].vp, 1);
  T.from(3, { t: 'bounty' }); eq(T.got[2].filter(m => m.t === 'bounty').length, 1, 'told twice = paid once');
  T.clear(); T.from(4, { t: 'bounty' });
  eq(T.got[2].filter(m => m.t === 'bounty').length, 1, 'seat 4\'s ring predecessor (3) is OUT -- the bounty goes to the live one, seat 2');
  T.clear(); T.from(2, { t: 'bounty' });
  eq(A.state.pool, 36, 'the active HUMAN predator is the live state: +6 there, not in a stale blob'); eq(A.net.roster[0].vp, 1);
  assert(T.got[3].some(m => m.t === 'roster' && m.players[1].out), 'an ousted bot still hears the roster');
  A.localTable = false; T.HB.reset([]);
});
test('v2.6.122 bounty: a HOST oust pays a bot predator by verb and pushes the roster BEFORE the pool-0 board; un-oust pushes it again; a stored human predator keeps the blob path', () => {
  const A = loadClient(CLIENT); const T = parityTable(A, [['You'], ['Ann'], ['B3', true], ['B4', true]]);
  A.hostOustHot(4);
  const seq3 = T.got[3].map(m => m.t); eq(JSON.stringify(seq3), JSON.stringify(['bounty', 'roster']), 'the bot predator: the verb, then the roster');
  eq(T.got[3][0].from, 'B4'); assert(T.got[4].some(m => m.t === 'forceOust') && T.got[4].some(m => m.t === 'roster'), 'the ousted bot is told (v2.6.97) and hears the roster');
  T.clear(); A.hostUnoustHot(4); eq(T.got[3][0].t, 'roster'); eq(T.got[3][0].players[3].out, false);
  T.clear(); A.hostOustHot(3);
  eq(JSON.parse(A.net.hot.boards[2]).pool, 36, 'a STORED human predator: the blob, as before'); eq(A.net.roster[1].vp, 1);
  const html = require('fs').readFileSync(CLIENT, 'utf8'); const o = html.slice(html.indexOf('async function ousted(opts)'), html.indexOf("$('#pool').addEventListener('contextmenu'"));
  assert(/if\(localTable\)\{ hotRosterPush\(\);/.test(o), 'the human\'s own Ousted... pushes the roster too');
  assert(/me\.out=false;\s*\n\s*log\([^\n]*returns to the game[^\n]*\n\s*hotRosterPush\(\);/.test(html), 'and so does the self un-oust');
  A.localTable = false; T.HB.reset([]);
});
testA('v2.6.122 sweep: an OUSTED bot is never handed the turn (the freeze, measured 4 of 4), and a bot that never passes cannot park the table -- the idle clock ASKS, Keep waiting re-arms, Pass moves on', async () => {
  const A = loadClient(CLIENT); const T = parityTable(A, [['You'], ['B2', true], ['B3', true]]);
  A.net.roster[1].out = true;
  let asks = 0; const turns = [];
  T.HB.seats[3].cb.msg = j => { const m = JSON.parse(j); if (m.t === 'turn' && m.seat === 3) turns.push(3); };
  T.HB.seats[2].cb.msg = j => { const m = JSON.parse(j); if (m.t === 'turn' && m.seat === 2) turns.push(2); };
  const order = await A.hotRunBotTurns(1, 1, { idleMs: 60, onIdle: async () => { asks++; return asks >= 2; } });
  eq(JSON.stringify(Array.from(order)), '[3]', 'seat 2 is out: skipped entirely'); assert(!turns.includes(2), 'it was never sent its own turn');
  eq(asks, 2, 'the first answer was Keep waiting -- the clock re-armed and asked again'); eq(JSON.stringify(order.forced), '[3]');
  eq(A.hotPassWaiter, null, 'no waiter left behind');
  const p = A.hotRunBotTurns(1, 1, { idleMs: 600000 }); await new Promise(r => setTimeout(r, 30));
  eq(A.hotPassWaiter.seat, 3); eq(A.hotForcePass(2), false, 'only the seat being waited on'); eq(A.hotForcePass(3), true, 'the seat-menu exit'); await p;
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/\(!inRoom\(\) && hotPassWaiter && hotPassWaiter\.seat===seat\)\)/.test(html) && /if\(!inRoom\(\)\)\{ hotForcePass\(seat\); return; \}/.test(html), 'Pass their turn... is on the seat menu offline for that bot, and routes to hotForcePass');
  A.localTable = false; T.HB.reset([]);
});
test('v2.6.122 relays: a bot\'s openHand reaches the human\'s open-hand receiver and the other bots (to:all) or one seat; give becomes the server\'s whitelisted given + gave', () => {
  const A = loadClient(CLIENT); const T = parityTable(A, [['You'], ['B2', true], ['B3', true]]);
  T.from(2, { t: 'openHand', to: 'all', cards: [{ name: 'Govern the Unaligned', kind: 'lib', junk: 1 }, { name: '' }] });
  eq(JSON.stringify(A.net.openHandFrom[2]), JSON.stringify([{ name: 'Govern the Unaligned', kind: 'lib' }]), 'the Debug toggle has something to show offline');
  eq(T.got[3][0].t, 'openHandGrant'); eq(T.got[3][0].seat, 2); eq(T.got[2].length, 0, 'never back to the sender');
  T.from(2, { t: 'openHand', to: 'all', revoke: true }); eq(A.net.openHandFrom[2], undefined); eq(T.got[3][1].t, 'openHandRevoke');
  T.clear(); T.from(2, { t: 'give', seat: 3, gid: 'm3', rx: 7, card: { name: 'Anarch Troublemaker', kind: 'lib', blood: 500, evil: 'x' } });
  const g = T.got[3][0]; eq(g.t, 'given'); eq(g.from, 'B2'); eq(g.gid, 'm3'); eq(g.owner, 'B2', 'owner auto-stamped'); eq(g.blood, 99); eq(g.rx, 1); eq(g.evil, undefined, 'whitelist');
  eq(T.got[2][0].t, 'gave'); eq(T.got[2][0].to, 'B3');
  T.clear(); T.from(2, { t: 'give', seat: 2, card: { name: 'X' } }); eq(T.got[2].length, 0, 'your own board is refused');
  for (const t of ['logTo', 'revealHand', 'decide', 'nonsense']) T.from(2, { t });   // tolerated silently
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/if\(hotBotSeat\(seat\)\) return giveHotToBot\(seat, hostCid, rx, ry, c\);/.test(html), 'human -> bot: giveHot hands a bot seat the verb instead of writing into its placeholder blob');
  A.localTable = false; T.HB.reset([]);
});
test('v2.6.122 decks + levels: the menu is the bot\'s registry by KEY (Ventrue included, the embedded copies gone, wall hidden), both spawn paths pass deckName, and the experience levels are Novice / Experienced / Expert with Expert the default everywhere', () => {
  const A = loadClient(CLIENT); const html = require('fs').readFileSync(CLIENT, 'utf8');
  eq(JSON.stringify(A.HOT_BOT_DECKS.map(r => r.key)), JSON.stringify(['hacking', 'sewer', 'tremere', 'nosferatu', 'malkavian', 'ventrue']));
  assert(!/Black Chantry 2020/.test(html), 'no embedded V5 deck list left to drift');
  eq((html.match(/deck:hotBotDeckFor\(deckKey\), deckName:deckKey,/g) || []).length, 2, 'netBotAdd AND hotSpawnBots tell the bot which deck it plays');
  eq(A.hotBotDeckKey('nope'), 'hacking', 'an unknown key falls back to the first deck'); eq(A.hotBotDeckKey('ventrue'), 'ventrue');
  let err = null; try { A.hotBotDeckFor('ventrue'); } catch (e){ err = e; } assert(err && /v0\.6\.147 or newer/.test(err.message), 'without the bot file loaded the reason is readable');
  eq(A.HOT_BOT_PERSONA, 'expert'); eq(JSON.stringify(A.HOT_BOT_PERSONAS.map(q => q[0])), JSON.stringify(['expert', 'experienced', 'novice']), 'the toggle\'s first click lands on Expert');
  assert(!/grinder|shark/.test(html.replace(/<template id="helpDoc[\s\S]*?<\/template>/g, '').replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')), 'no grinder / shark left outside comments (the embedded Help pages are the bot project\'s prose -- "a grinder keeps its home quota" is an archetype there, not a persona key -- and are excluded, v2.6.127)');
  assert(/<option value="expert" selected>Expert<\/option><option value="experienced">Experienced<\/option><option value="novice">Novice<\/option>/.test(html), 'the lobby select: values AND labels, Expert selected');
  assert(/\|\|\{\}\)\.value\|\|HOT_BOT_PERSONA\)\)/.test(html), 'the lobby read falls back to the default');
});
testB('v2.6.122 registry, with the released bot: every menu key resolves in ElysiumBot.ARCHETYPES, the bot accepts every level key, and a key the client has never heard of shows up under the deck\'s own name', async () => {
  const BOT = require('./elysium-bot.js'); const A = loadClient(CLIENT);
  for (const r of A.HOT_BOT_DECKS) assert(BOT.ARCHETYPES[r.key] && BOT.ARCHETYPES[r.key].crypt, r.key + ' is in the registry');
  for (const q of A.HOT_BOT_PERSONAS) eq(BOT.personaKey(q[0]), q[0], q[0] + ' is a canonical level key');
  global.ElysiumBot = Object.assign({}, BOT, { ARCHETYPES: Object.assign({ brandnew: { name: 'A Deck From The Future', crypt: [], library: [] } }, BOT.ARCHETYPES) });
  try { const menu = A.hotBotDeckMenu(); const extra = menu.filter(r => !A.HOT_BOT_DECKS.some(k => k.key === r.key));
    eq(JSON.stringify(extra), JSON.stringify([{ key: 'brandnew', label: 'A Deck From The Future' }]), 'new decks arrive with a bot release; wall stays hidden');
    assert(A.hotBotDeckFor('ventrue') === BOT.ARCHETYPES.ventrue, 'the SAME object -- the bot recognises it by identity'); }
  finally { delete global.ElysiumBot; }
});
testB('v2.6.122 LIVE: two real bots over the bridge -- a forced oust of one completes the round, its bot predator collects exactly once, and a real bot\'s block tally reaches the other bot and avr', async () => {
  const BOT = require('./elysium-bot.js'); const A = loadClient(CLIENT); const HB = A.hotBridge;
  HB.reset([{ name: 'You' }, { name: 'Two', bot: true }, { name: 'Three', bot: true }]);
  A.net.roster = [{ seat: 1, name: 'You', vp: 0 }, { seat: 2, name: 'Two', bot: true, vp: 0 }, { seat: 3, name: 'Three', bot: true, vp: 0 }];
  A.net.you = 'You'; A.net.boards = {}; A.net.hot = { boards: { 1: JSON.stringify({ pool: 30 }) }, undo: {} }; A.localTable = true;
  const mk = (seat, nm) => new BOT.Bot({ room: 'hot', pass: '', name: nm, paceMs: 0, askSecs: 1, transport: HB.dialFor(seat, nm), deck: BOT.ARCHETYPES.ventrue, deckName: 'ventrue', persona: 'expert', log: () => {} });
  const b2 = mk(2, 'Two'), b3 = mk(3, 'Three'); await b2.connect(); await b3.connect();
  const t0 = Date.now(); while ((!HB.seats[2] || !HB.seats[2].deck || !HB.seats[3] || !HB.seats[3].deck) && Date.now() - t0 < 6000) await new Promise(r => setTimeout(r, 40));
  assert(HB.startFor(2) && HB.startFor(3), 'both dealt'); await new Promise(r => setTimeout(r, 150));
  const pool2 = b2.pool;
  b3.pool = 0; b3._oust(false);                                   // the bot's own oust path: board (pool 0), then `bounty`
  const t1 = Date.now(); while (!A.net.roster[2].out && Date.now() - t1 < 4000) await new Promise(r => setTimeout(r, 25));
  eq(A.net.roster[2].out, true, 'the bridge heard the bounty'); await new Promise(r => setTimeout(r, 200));
  eq(b2.pool, pool2 + 6, 'the predator collected ONCE (its no-server net and the real verb de-duplicate)');
  assert((b2.players[2] || {}).out === true, 'and knows from the ROSTER that seat 3 is gone');
  const order = await A.hotRunBotTurns(1, 1, { idleMs: 600000 });
  eq(JSON.stringify(Array.from(order)), '[2]', 'the sweep completes the round around the fallen seat');
  b2.send({ t: 'tally', mode: 'block', b: 2 });
  const t2 = Date.now(); while (!(A.avr && A.avr.mode === 'block' && A.avr.b === 2) && Date.now() - t2 < 4000) await new Promise(r => setTimeout(r, 25));
  eq(A.avr.b, 2, 'avr follows a real bot\'s counter'); assert(b3.tally && b3.tally.mode === 'block' && b3.tally.b === 2 && b3.tally.who === 'Two', 'and so does the other bot');
  b2.close(); b3.close(); A.localTable = false; HB.reset([]);
});

/* === v2.6.123: self-review of THE PARITY ROUND (Johan's standing gate) === */
test('v2.6.123: gid is cleaned like the server\'s cleanId (strip + 32, not the duel cid\'s 16); a give to an OUSTED bot is refused before our copy is destroyed; the bot file preloads quietly so registry decks can reach the menus before the first spawn', () => {
  const A = loadClient(CLIENT); const T = parityTable(A, [['You'], ['B2', true], ['B3', true]]);
  T.from(2, { t: 'give', seat: 3, gid: 'g<abc>_0123456789-0123456789-0123456789', card: { name: 'Fame' } });
  eq(T.got[3][0].gid, 'gabc_0123456789-0123456789-01234', 'srv 429: /[^a-zA-Z0-9_-]/ stripped, 32 kept');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const g = html.slice(html.indexOf('function giveHotToBot('), html.indexOf('function startGiveDrag('));
  assert(g.indexOf(').out){ toast(') > 0 && g.indexOf(').out){ toast(') < g.indexOf('hotBridge.toBot(') && g.indexOf('hotBridge.toBot(') < g.indexOf('destroyLocal(c)'), 'out-check, THEN the verb, THEN the local destroy');
  assert(/if\(offlineCfg\[i\]&&offlineCfg\[i\]\.botP\) hotBotMenuPreload\(renderOfflineSeats\);/.test(html) && /_dk\.addEventListener\('pointerdown', _go\); _dk\.addEventListener\('focus', _go\);/.test(html), 'both lobbies preload -- on INTENT');
  const rl = html.slice(html.indexOf("const wrap=$('#lobBotWrap')"), html.indexOf("const why=netBotWhy(), btn=$('#lobBotAdd')"));
  assert(rl.length > 100 && !/hotBotMenuPreload\(/.test(rl), 'v2.6.124: NEVER from the lobby render -- that was ~700 kB + the cardfx database for every Full-mode host opening any lobby, and a 404 per lobby push where the bot file is absent');
  assert(/if\(typeof ElysiumBot!=='undefined' \|\| _hotBotPreloadTried\) return;\s*\n\s*_hotBotPreloadTried=true;/.test(html), 'and the quiet path tries once per page load');
  assert(/hotLoadBotRes\(\)\.then\(\(\)=>\{[^\n]*\}, \(\)=>\{\}\);/.test(html), 'and a failed preload is silent -- the spawn path owns the error dialog');
  A.localTable = false; T.HB.reset([]);
});
testB('v2.6.123 LIVE: a HOST oust of a bot reaches its bot predator as bounty > roster > pool-0 board -- the bot\'s no-server net never fires, so +6 is right without leaning on its de-duplication', async () => {
  const BOT = require('./elysium-bot.js'); const A = loadClient(CLIENT); const HB = A.hotBridge;
  HB.reset([{ name: 'You' }, { name: 'Two', bot: true }, { name: 'Three', bot: true }]);
  A.net.roster = [{ seat: 1, name: 'You', vp: 0 }, { seat: 2, name: 'Two', bot: true, vp: 0 }, { seat: 3, name: 'Three', bot: true, vp: 0 }];
  A.net.you = 'You'; A.net.boards = {}; A.net.hot = { boards: { 1: '{}', 2: '{}', 3: '{}' }, undo: {} }; A.localTable = true;
  const ev = [];
  const mk = (seat, nm) => new BOT.Bot({ room: 'hot', pass: '', name: nm, paceMs: 0, askSecs: 1, transport: HB.dialFor(seat, nm), log: () => {},
    onEvent: (t, m) => { if (nm === 'Two' && (t === 'bounty' || t === 'roster' || t === 'bot:oust-inferred' || (t === 'board' && m.seat === 3 && m.pub && m.pub.pool <= 0))) ev.push(t); } });
  const b2 = mk(2, 'Two'), b3 = mk(3, 'Three'); await b2.connect(); await b3.connect();
  const t0 = Date.now(); while ((!HB.seats[2] || !HB.seats[2].deck || !HB.seats[3] || !HB.seats[3].deck) && Date.now() - t0 < 6000) await new Promise(r => setTimeout(r, 40));
  assert(HB.startFor(2) && HB.startFor(3), 'both dealt'); await new Promise(r => setTimeout(r, 200)); ev.length = 0;
  const pool2 = b2.pool; A.hostOustHot(3); await new Promise(r => setTimeout(r, 400));
  eq(ev.slice(0, 3).join(' > '), 'bounty > roster > board', 'the order on the wire'); assert(!ev.includes('bot:oust-inferred'), 'the net stood down');
  eq(b2.pool, pool2 + 6); eq(b3.out, true, 'and the ousted bot was told');
  b2.close(); b3.close(); A.localTable = false; HB.reset([]);
});

/* === v2.6.126: bot-card controls at a hotseat + Burn (the bot project's handover, 22 Sep 2026) === */
test('v2.6.126 hotCtrl: a card verb aimed at a BOT seat rides the bridge in the server\'s exact shape and is applied optimistically; a human seat never touches the bridge and keeps the owner check; the menu carries a Burn row for bot seats only, behind a confirm', () => {
  const A = loadClient(CLIENT); const T = parityTable(A, [['You'], ['B2', true], ['B3', true], ['Four']]);   // seat 4: a second HUMAN (hotReRender re-persists the active human's own blob, so the human-seat case has to live on someone else's board -- as it does at the table)
  A.net.boards[2] = { pub: { pool: 30, counts: { library: 0, crypt: 0 }, cards: [{ id: 'v1', name: 'Anson', kind: 'crypt', zone: 'ready', blood: 4 }, { id: 'e1', name: 'Bowl', kind: 'lib', zone: 'ready', host: 'v1' }, { id: 'v2', name: 'Zoe', kind: 'crypt', zone: 'torpor', blood: 1 }] }, ts: 0 };
  A.hotCtrl(2, 'v1', 'lock');
  eq(JSON.stringify(T.got[2]), JSON.stringify([{ t: 'ctrl', cid: 'v1', act: 'lock', from: 'You' }]), 'srv 927\'s shape: {t, cid, act, from} -- the bot logs `ctrl from You: lock on Anson`, applies, pushes');
  eq(T.got[3].length, 0, 'only the holder hears it, as online');
  eq(A.net.boards[2].pub.cards[0].locked, true, 'optimistic: the mat shows the lock before the bot\'s push');
  A.hotCtrl(2, 'v1', 'blood-'); eq(A.net.boards[2].pub.cards[0].blood, 3); eq(T.got[2][1].act, 'blood-');
  A.hotCtrl(2, 'v2', 'burn'); eq(T.got[2][2].act, 'burn');
  eq(A.net.boards[2].pub.cards.map(c => c.id).join(','), 'v1,e1', 'optimistic burn removes the card');
  A.hotCtrl(2, 'v1', 'burn'); eq(A.net.boards[2].pub.cards.length, 0, '...and whatever rides on it (the bot drops attachments too)');
  A.hotCtrl(2, 'v1', 'x'.repeat(40)); eq(T.got[2][4].act, 'x'.repeat(16), 'act clamped to 16 like the server');
  // a HUMAN seat: the existing body, no bridge
  A.net.hot.boards[4] = JSON.stringify({ pool: 30, cards: [{ id: 'h1', name: 'Mine', kind: 'crypt', zone: 'ready', blood: 2, owner: 'You' }, { id: 'h2', name: 'Theirs', kind: 'crypt', zone: 'ready', blood: 2, owner: 'Other' }], zones: {} });
  A.net.boards[4] = { pub: { pool: 30, counts: { library: 0, crypt: 0 }, cards: [{ id: 'h1', blood: 2 }, { id: 'h2', blood: 2 }] } };
  A.hotCtrl(4, 'h1', 'blood-'); eq(JSON.parse(A.net.hot.boards[4]).cards[0].blood, 1, 'own card on a human board: applied in place');
  A.hotCtrl(4, 'h2', 'blood-'); eq(JSON.parse(A.net.hot.boards[4]).cards[1].blood, 2, 'someone else\'s card on a human board: refused (owner check intact)');
  eq(T.got[2].length + T.got[3].length, 5, 'no bridge traffic from the human seat');
  // the menu row, pinned in source
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const menu = html.slice(html.indexOf("const _botSeat=!!(net.roster||[]).find(q=>q.seat===ctx.seat && q.bot);"), html.indexOf("items.push({label:'Visit this board'"));
  assert(/if\(_botSeat && !_mine\) items\.push\(\{label:'\\ud83d\\udd25 Burn \(remove from game\)', noUndo:true/.test(menu), 'the Burn row: bot seats only (a human\'s own card has Burn to my ash above), noUndo -- the bot owns the state');
  assert(/uiConfirm\('Burn '\+/.test(menu) && /_do\('burn'\)/.test(menu), 'behind a confirm, sent through _do so it works in BOTH modes');
  assert(html.indexOf("if(hotBotSeat(seat)){") > 0 && html.indexOf("if(hotBotSeat(seat)){", html.indexOf('function hotCtrl(')) < html.indexOf("if(!net.hot || !net.hot.boards || net.hot.boards[seat]==null) return;", html.indexOf('function hotCtrl(')), 'hotCtrl: the bot route comes BEFORE the stored-blob guard that killed it');
  A.localTable = false; T.HB.reset([]);
});
testB('v2.6.126 LIVE: a real bot\'s card obeys the hotseat menu -- blood-, torpor, untorpor land in its next publish, and burn removes the card with the bot\'s "is burned" line', async () => {
  const BOT = require('./elysium-bot.js'); const A = loadClient(CLIENT); const HB = A.hotBridge;
  HB.reset([{ name: 'You' }, { name: 'Two', bot: true }]);
  A.net.roster = [{ seat: 1, name: 'You', vp: 0 }, { seat: 2, name: 'Two', bot: true, vp: 0 }];
  A.net.you = 'You'; A.net.boards = {}; A.net.hot = { boards: { 1: JSON.stringify({ pool: 30 }), 2: '{}' }, undo: {} }; A.localTable = true;
  const pubs = [], chats = [];
  const _from = HB._fromBot.bind(HB); HB._fromBot = (seat, rec, m) => { if (m && m.t === 'board' && m.pub) pubs.push(m.pub); if (m && (m.t === 'chat' || m.t === 'log')) chats.push(String(m.text || m.msg || m.html || JSON.stringify(m))); return _from(seat, rec, m); };   // v2.6.129: + the log tier -- the bot's note() rides {t:'log'} since v0.6.114, so this test (written without the bot beside it) listened on the wrong channel
  const b2 = new BOT.Bot({ room: 'hot', pass: '', name: 'Two', paceMs: 0, askSecs: 1, transport: HB.dialFor(2, 'Two'), deck: BOT.ARCHETYPES.ventrue, deckName: 'ventrue', persona: 'expert', log: () => {} });
  await b2.connect();
  const t0 = Date.now(); while ((!HB.seats[2] || !HB.seats[2].deck) && Date.now() - t0 < 6000) await new Promise(r => setTimeout(r, 40));
  assert(HB.startFor(2), 'dealt'); await new Promise(r => setTimeout(r, 250));
  const next = async (n0) => { const t = Date.now(); while (pubs.length <= n0 && Date.now() - t < 4000) await new Promise(r => setTimeout(r, 25)); assert(pubs.length > n0, 'the bot published after the verb'); return pubs[pubs.length - 1]; };
  const first = pubs[pubs.length - 1]; const v = (first.cards || []).find(c => c.kind === 'crypt'); assert(v, 'a vampire in the bot\'s first pub');
  const blood0 = v.blood | 0; let n = pubs.length;
  A.hotCtrl(2, v.id, 'blood-'); let pub = await next(n); eq((pub.cards.find(c => c.id === v.id).blood | 0), Math.max(0, blood0 - 1), 'blood dropped by 1 in the bot\'s own publish');
  n = pubs.length; A.hotCtrl(2, v.id, 'torpor'); pub = await next(n); eq(pub.cards.find(c => c.id === v.id).zone, 'torpor');
  n = pubs.length; A.hotCtrl(2, v.id, 'untorpor'); pub = await next(n); eq(pub.cards.find(c => c.id === v.id).zone || 'ready', 'ready');
  n = pubs.length; A.hotCtrl(2, v.id, 'burn'); pub = await next(n); assert(!pub.cards.some(c => c.id === v.id), 'burned: gone from the next pub');
  const t1 = Date.now(); while (!chats.some(x => /is burned/.test(x)) && Date.now() - t1 < 3000) await new Promise(r => setTimeout(r, 25));
  assert(chats.some(x => /is burned/.test(x)), 'the bot said so ("<vamp> is burned ...")');
  HB._fromBot = _from; b2.close(); A.localTable = false; HB.reset([]);
});

testB('v2.6.133 LIVE: a scripted human (Lisa) blocks the REAL bot and fights two rounds through the combat helper -- the bot drives the steps, fills its damage, steps 4 -> 5 so Lisa\'s client writes her taken line, the rd:2 wrap zeroes a/b, and nothing waits on typed grammar', async () => {
  const BOT = require('./elysium-bot.js'); const A = loadClient(CLIENT); const HB = A.hotBridge;
  HB.reset([{ name: 'You' }, { name: 'Two', bot: true }]);
  A.net.roster = [{ seat: 1, name: 'You', vp: 0 }, { seat: 2, name: 'Two', bot: true, vp: 0 }];
  A.net.you = 'You'; A.net.boards = {}; A.net.hot = { boards: { 1: JSON.stringify({ pool: 30 }), 2: '{}' }, undo: {} }; A.localTable = true; A.conv.tournament = false; A.net.helperPolicy = null;
  const botLines = []; const _from = HB._fromBot.bind(HB); HB._fromBot = (seat, rec, m) => { if (m && (m.t === 'chat' || m.t === 'log')) botLines.push(String(m.text || m.msg || m.html || '').replace(/<[^>]*>/g, '')); return _from(seat, rec, m); };
  const b2 = new BOT.Bot({ room: 'hot', pass: '', name: 'Two', paceMs: 0, askSecs: 1, phaseSecs: 1, transport: HB.dialFor(2, 'Two'), deck: BOT.ARCHETYPES.ventrue, deckName: 'ventrue', persona: 'expert', log: () => {} });
  await b2.connect(); const t0 = Date.now(); while ((!HB.seats[2] || !HB.seats[2].deck) && Date.now() - t0 < 6000) await new Promise(r => setTimeout(r, 40));
  assert(HB.startFor(2), 'dealt'); await new Promise(r => setTimeout(r, 300));
  b2.hand.length = 0;   // v2.6.139: the HAND decided this test -- the Ventrue deck carries Majesty x6 (~54 % of opening hands), and a bot that ends the combat at its strike leaves no round 2 to check. Hand strikes only: the flow under test is the helper's, not the bot's card choice (the hidden-randomness class)
  const v = A.makeCard('Lisa', 'crypt'); A.move(v, 'ready', { x: 100, y: 60, faceDown: false }); v.blood = 3;
  const t1 = Date.now(); while (b2._seatOfVamp('Lisa') !== 1 && Date.now() - t1 < 3000) await new Promise(r => setTimeout(r, 50));
  eq(b2._seatOfVamp('Lisa'), 1, 'the bot sees Lisa on seat 1 (her board reached it)');
  const u = b2.unc.shift(); const bv = { id: u.id, name: u.name, kind: 'crypt', zone: 'ready', x: 0, y: 0, locked: false, faceDown: false, blood: 4, cap: u.cap || 5 }; b2.board.push(bv); b2.push();
  A.net.turnSeat = 2; b2._actingVamp = { v: bv, n: 1, played: new Set() }; b2._lastBlockerName = 'Lisa';   // the bot acts, Lisa blocked
  const seen = []; let done = false;
  const human = (async () => { let struck = 0, pressed = 0; while (!done){ await new Promise(r => setTimeout(r, 40));
    const k = A.avr.rd + ':' + A.avr.ph + ':' + A.avr.a + ':' + A.avr.b; if (seen[seen.length - 1] !== k) seen.push(k);
    if (A.avr.mode === 'combat' && (A.avr.ph | 0) === 3 && struck < (A.avr.rd | 0)){ struck = A.avr.rd | 0; await A.cmbStrike('hand', v); }
    if (A.avr.mode === 'combat' && (A.avr.ph | 0) === 5 && (A.avr.rd | 0) === 1 && !pressed){ pressed = 1; A.cmbPress(v, 'continue'); } } })();
  await b2._resolveCombat(bv, 'Lisa'); done = true; await human;
  const mine = A.errRing.map(e => e.m).filter(l => /^Lisa /.test(l));
  eq(mine.filter(l => / takes /.test(l)).length, 2, 'a taken line per round, written when the BOT stepped past Damage: ' + JSON.stringify(mine));
  eq(mine.find(l => / takes /.test(l)), 'Lisa takes 1 (loses 1 blood, now 2).');
  assert(mine.includes('Lisa presses to continue.'), 'Lisa\'s press'); assert(seen.some(k => /^2:/.test(k)), 'the bot honoured it: round 2 -- ' + seen.join(' '));
  assert(seen.includes('1:3:1:0') || seen.includes('1:3:1:1'), 'the bot wrote its damage into a (acting): ' + seen.join(' '));
  assert(seen.some(k => /^2:0:0:0$/.test(k)) && !seen.some(k => /^2:0:1/.test(k)), 'round 2 starts at 0 vs 0 (v2.6.133): ' + seen.join(' '));
  assert(seen.some(k => /^2:6:/.test(k)), 'the bot walked the table to End of round in round 2: ' + seen.join(' '));
  eq(A.avr.mode, null, 'v2.6.139: and then CLOSED its combat (bot v0.6.172+, main asked for it on 24 Sep) -- the mirror is clean at once; reading the final state for round 2 was the old test\'s assumption');
  assert(!botLines.some(l => /no strike line within the window/.test(l)), 'the bot never timed out on Lisa\'s strike');
  HB._fromBot = _from; b2.close(); A.localTable = false; HB.reset([]);
});

/* === the hotseat soak tool (elysium-soak-hotseat.js v1.0.0, 21 Sep 2026) === */
testB('soak tool: the NEGATIVE CONTROL trips -- a seat that never hears its turn is reported STUCK by the sweep\'s own idle clock (a soak that cannot fail proves nothing)', async () => {
  const S = require('./elysium-soak-hotseat.js'); const D = S.loadDeps(CLIENT, require('path').join(__dirname, 'elysium-bot.js')); assert(!D.err, D.err);
  const R = await S.runTable({ decks: ['hacking', 'sewer'], pool: 30, rounds: 2 }, { client: CLIENT, BOT: D.BOT, loadClient: D.loadClient, fx: D.fx, idleMs: 1500, mute: 2 });
  eq(R.stuck.length, 1, 'exactly one parked seat'); eq(R.stuck[0].seat, 2); eq(R.stuck[0].round, 1); eq(R.turns, 2, 'seat 1 played, seat 2 was passed FOR (forced), then the table ended');
  assert(Array.isArray(S.DEFAULT_BATTERY) && S.DEFAULT_BATTERY.length === 7 && S.DEFAULT_BATTERY.every(t => t.decks.every(d => D.BOT.ARCHETYPES[d])), 'every deck in the default battery is a key the released bot registers');
});

/* === v2.6.127: Help inside the client (Menu -> Help -> Rulebook / Bots / Local server / Report a problem) === */
test('v2.6.127 Help menu: one Help... submenu carries Rulebook, Bots, Local server, Report a problem in that order; the two old top-level rows are gone; both pages are embedded <template>s with prefixed ids, no script, and a marker pair embed-help.js can find', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const menu = html.slice(html.indexOf("$('#btnMenu').addEventListener('click',e=>{"), html.indexOf("showMenu(_menuItems, r.right-200, r.bottom+6);"));
  const help = /\{label:'Help\\u2026', sub:\[([\s\S]*?)\]\}\);/.exec(menu); assert(help, 'a Help... submenu on the main menu');
  const labels = [...help[1].matchAll(/label:'([^']+)'/g)].map(m => m[1]);
  eq(labels.join('|'), "Rulebook|Bots|Local server|Report a problem\\u2026", 'Johan\'s order: Rulebook, Bots, Local server, Report a problem...');
  assert(/fn:\(\)=>openHelp\('bots'\)/.test(help[1]) && /fn:\(\)=>openHelp\('server'\)/.test(help[1]) && /fn:openErrReport/.test(help[1]) && /vekn\.net\/rulebook/.test(help[1]), 'each row does what its label says');
  const outside = menu.replace(help[0], '');
  assert(!/label:'Rulebook'/.test(outside) && !/label:'Report a problem/.test(outside), 'no Rulebook / Report a problem left at the top level');
  assert(/label:'Settings'/.test(outside) && /label:'About'/.test(outside), 'Settings and About stay where they were');
  // the pages
  for (const [key, pre, mustHave] of [['bots', 'hb-', ['id="hb-controls"', 'id="hb-setup"', 'Hold on']], ['server', 'hs-', ['id="hs-setup"', 'github.com/dtagent2000/VTES-Elysium', 'Never double-click', 'Tailscale', '--referee-pass']]]) {
    const tpl = new RegExp('<template id="helpDoc' + (key === 'bots' ? 'Bots' : 'Server') + '">\\n<!-- @@HELP:' + key + ' -->\\n([\\s\\S]*?)\\n<!-- @@/HELP:' + key + ' -->\\n</template>').exec(html);
    assert(tpl, 'the ' + key + ' template with its marker pair');
    const body = tpl[1];
    assert(body.length > 20000, key + ': a real page is embedded (' + body.length + ' chars)');
    for (const s of mustHave) assert(body.indexOf(s) >= 0, key + ' page carries "' + s + '"');
    assert(!/<script/i.test(body), key + ': the page\'s own script is dropped (the modal and the tab bring their own)');
    const ids = [...body.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]); assert(ids.length > 3 && ids.every(id => id.startsWith(pre)), key + ': every id prefixed ' + pre + ' so the client\'s own ids can never collide');
    const hrefs = [...body.matchAll(/\shref="#([^"]+)"/g)].map(m => m[1]); assert(hrefs.length > 3 && hrefs.every(id => id.startsWith(pre)), key + ': every #href prefixed too');
    for (const id of hrefs) assert(ids.includes(id), key + ': #' + id + ' points at an id in the page');
    assert(/<nav class="nav"/.test(body) && /<header class="hero"/.test(body) && /<main>/.test(body) && /<footer>/.test(body), key + ': the START-HERE-BOTS shape -- nav, hero, main, footer');
  }
  // the design lives once: the #helpCss block in <head>, scoped, and read by the standalone builder
  const css = /<style id="helpCss">([\s\S]*?)<\/style>/.exec(html); assert(css, 'one <style id="helpCss"> block');
  const rules = css[1].replace(/\/\*[\s\S]*?\*\//g, '').split('}').map(r => r.split('{')[0].trim()).filter(Boolean);
  const unscoped = rules.filter(r => !r.split(',').every(sel => /^(\.helpDoc|body\.helpDoc|html\.helpPage|#helpModal|@media)/.test(sel.trim())));
  eq(unscoped.length, 0, 'every rule is scoped (.helpDoc / #helpModal / the standalone html+body classes): ' + unscoped.join(' ; '));
  assert(/\.helpDoc main\{[^}]*display:block/.test(css[1]) && /\.helpDoc h3\{[^}]*text-transform:none/.test(css[1]) && /\.helpDoc \.hero\{[^}]*display:grid/.test(css[1]), 'the client selectors that would reach the page (main{display:flex}, .modal h3, header) are re-stated');
  assert(/getElementById\('helpCss'\)/.test(html) && /<template id="helpDocBots">/.test(html) && /<template id="helpDocServer">/.test(html), 'the modal and the tab read the same block and the same templates');
  assert(/Menu \\u2192 Help \\u2192 Report a problem/.test(html), 'the crash notice points at the new home of Report a problem');
});
test('v2.6.127 helpStandalone builds ONE self-contained page from the template + the #helpCss block (title escaped, body.helpDoc, one script, the client\'s own script tag never spelled out); openHelp renders into the modal without touching location.hash', () => {
  const A = loadClient(CLIENT);
  A.__doc._ids.helpCss = { textContent: '.helpDoc{color:red}' };
  A.__doc._ids.helpDocServer = { innerHTML: '<nav class="nav"><ul><li><a href="#hs-x">X</a></li></ul></nav><main><section id="hs-x"><h2>X &amp; Y</h2></section></main>' };
  const page = A.helpStandalone('server');
  assert(page.startsWith('<!DOCTYPE html><html lang="en" class="helpPage">'), 'a full document');
  assert(page.indexOf('<style>.helpDoc{color:red}</style>') > 0, 'the #helpCss block travels with it');
  assert(page.indexOf('<body class="helpDoc"><nav class="nav">') > 0 && page.indexOf('<section id="hs-x">') > 0, 'the template markup is the body');
  assert(page.indexOf('<title>Elysium \u2014 Running your own server</title>') > 0, 'the page title');
  eq((page.match(/<script>/g) || []).length, 1, 'exactly one script (the nav/hash helper)'); assert(/<\/script><\/body><\/html>$/.test(page), '...closing the document');
  eq(A.helpStandalone('nope'), '', 'an unknown key builds nothing');
  const html = require('fs').readFileSync(CLIENT, 'utf8'); const src = html.slice(html.indexOf('function helpStandalone('), html.indexOf('function helpWire('));
  assert(!/<script>/.test(src) && !/<\/script>/.test(src), 'the builder never spells the bare tag out (the client\'s own script would end there; the harness and the splitter key on the one bare tag)');
  eq(Object.keys(A.HELP_DOCS).join(','), 'bots,server', 'the two pages');
  // openHelp: renders, opens the overlay, remembers which page for the tab button
  A.__doc._ids.helpDocBody = { innerHTML: '', scrollTop: 9, querySelectorAll: () => [], querySelector: () => null, getBoundingClientRect: () => ({ top: 0 }) };
  A.__doc._ids.helpDocTitle = { textContent: '' };
  A.openHelp('server');
  eq(A.__doc._ids.helpDocTitle.textContent, 'Running your own server', 'the header names the page');
  eq(A.__doc._ids.helpDocBody.innerHTML, A.__doc._ids.helpDocServer.innerHTML, 'the template is rendered into the modal body');
  eq(A.__doc._ids.helpDocBody.scrollTop, 0, 'scrolled to the top');
  assert(A.helpCurrent() === 'server', 'the tab button opens THIS page');
  A.openHelp('bots'); assert(A.helpCurrent() === 'bots');
  A.openHelp('nope'); assert(A.helpCurrent() === 'bots', 'an unknown key changes nothing');
  delete A.__doc._ids.helpCss; delete A.__doc._ids.helpDocServer; delete A.__doc._ids.helpDocBody; delete A.__doc._ids.helpDocTitle;
});
test('v2.6.127 embed-help drift: the embedded Local-server page equals help-local-server.html beside the suite (ours -- required), and the Bots page equals START-HERE-BOTS.html when the bot project\'s release sits beside (skips loudly otherwise)', () => {
  const fs = require('fs'), path = require('path'); const E = require('./embed-help.js'); const html = fs.readFileSync(CLIENT, 'utf8');
  const srv = path.join(__dirname, 'help-local-server.html'); assert(fs.existsSync(srv), 'help-local-server.html is this project\'s authoring source and ships beside the suite');
  eq(E.embedded(html, 'server').body, E.render('server', srv), 'server page: the client and the source agree byte for byte (re-embed: node embed-help.js server help-local-server.html)');
  const bots = path.join(__dirname, 'START-HERE-BOTS.html');
  if (fs.existsSync(bots)) eq(E.embedded(html, 'bots').body, E.render('bots', bots), 'bots page: the client and the bot project\'s file agree (re-embed: node embed-help.js bots START-HERE-BOTS.html)');
  else console.log('       (START-HERE-BOTS.html not beside the suite -- the bots-page drift check was skipped; upload the bot project\'s release to run it)');
  // the tool's own contract
  const lifted = E.prefixIds(E.liftBody('<html><body>\n<nav><a href="#a">x</a></nav><main id="a"><svg><path marker-end="url(#m)"/><marker id="m"/></svg></main><script>bad()</script>\n</body></html>'), 'hb-');
  eq(lifted, '<nav><a href="#hb-a">x</a></nav><main id="hb-a"><svg><path marker-end="url(#hb-m)"/><marker id="hb-m"/></svg></main>', 'ids, #hrefs and SVG url(#) refs prefixed, the script dropped');
  let err = null; try { E.embedded('<html></html>', 'bots'); } catch (e){ err = e; } assert(err && /markers/.test(err.message), 'a client without the marker pair is refused with a readable reason');
});

test('v2.6.127 hotfix: every id in the client\'s static HTML is unique -- $() binds to the FIRST match, so a duplicate silently wires a listener to the wrong element (the Help modal\'s Close hit the shortcut overlay\'s #helpClose)', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const markup = html.replace(/<template id="helpDoc[\s\S]*?<\/template>/g, '').replace(/<script>[\s\S]*<\/script>\s*<\/body>/, '').replace(/<script id="legacyGuard">[\s\S]*?<\/script>/, '');   // static markup only: template content is inert until rendered (and prefixed), scripts build ids at runtime
  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]); const seen = new Set(); const dup = [];
  for (const id of ids){ if (seen.has(id)) dup.push(id); seen.add(id); }
  eq(dup.length, 0, 'duplicate ids: ' + dup.join(', '));
  assert(ids.includes('helpDocClose') && ids.includes('helpClose'), 'both closes exist, under different ids');
  assert(/\$\('#helpDocClose'\)\.addEventListener\('click', closeOverlay\)/.test(html), 'the modal\'s Close is bound to ITS button');
});

/* ---------- v2.6.129: THE COMBAT STEPS CARRY STATE (Johan's step-driven combat helper, rulebook-checked 23 Sep) ---------- */
function cmbTable(turnSeat){   // a hotseat with one FAKE bot seat (records what it is sent); the human's vampire Lisa (3 blood) in the ready region
  const A = loadClient(CLIENT); const T = parityTable(A, [['You'], ['B2', true]]);
  A.conv.tournament = false; A.net.helperPolicy = null; A.net.turnSeat = turnSeat;
  A.clearTable({}); const v = A.makeCard('Lisa', 'crypt'); A.move(v, 'ready', { x: 100, y: 60, faceDown: false }); v.blood = 3;
  const lines = () => A.errRing.map(e => e.m);
  const answer = (...vals) => { const q = vals.slice(); A.uiDialog = () => Promise.resolve(q.length ? q.shift() : null); };
  return { A, T, v, lines, answer, bot: (m) => T.from(2, Object.assign({ t: 'tally', mode: 'combat' }, m)) };
}
test('v2.6.134 combat lines: EFFECT only, one line per choice, no card names (hand 1 / hands for N / a weapon / strike for N / steal / dodge / combat ends / extra / prevent / maneuver / set range / press / taken)', () => {
  const A = loadClient(CLIENT), L = A.CMB_LINE, N = '<b class="clog" data-cid="c1">Lisa</b>';
  eq(L.hand(N, 1), N + ' strikes (hands) for 1.'); eq(L.hand(N, 3), N + ' strikes with hands for 3.');
  eq(L.weapon(N, 2), N + ' strikes with a weapon for 2.'); eq(L.strike(N, 2), N + ' strikes for 2.');
  eq(L.steal(N, 2), N + ' strikes: steals 2 blood.'); eq(L.dodge(N), N + ' strikes: dodge \u2014 no damage either way this round.'); eq(L.ends(N), N + ' strikes: combat ends.');
  eq(L.extra(N), N + ' gets an additional strike.'); eq(L.prev(N, 1), N + ' prevents 1 damage.');
  eq(L.man(N, 'long'), N + ' maneuvers to long.'); eq(L.press(N, 'continue'), N + ' presses to continue.');
  eq(L.setr(N, 'close', false), N + ' sets range to close.'); eq(L.setr(N, 'long', true), N + ' sets range to long next round.');
  eq(L.taken(N, 2, 2, 1, false), N + ' takes 2 (loses 2 blood, now 1).'); eq(L.taken(N, 4, 3, 0, true), N + ' takes 4 (loses 3 blood, now 0) and goes to torpor.');
});
testB('v2.6.134 combat lines x the RELEASED bot: hand / hands for N / a weapon / dodge / maneuver / press / taken match its own regexes; strike-for-N, steal and combat-ends are the three NEW shapes (bot follow-up)', async () => {
  const { L12 } = require('./elysium-bot.js'); const A = loadClient(CLIENT), L = A.CMB_LINE, strip = h => h.replace(/<[^>]*>/g, ''), N = '<b class="clog">Lisa</b>';
  assert(L12.strikeH.test(strip(L.hand(N, 1))), 'strikeH'); assert(L12.strikeC.test(strip(L.hand(N, 2))), 'strikeC (hands for N)');
  const w = strip(L.weapon(N, 2)).match(L12.strikeC); assert(w && w[2] === 'a weapon' && w[3] === '2', 'a weapon strike reads as a strike for 2');
  assert(L12.strikeD.test(strip(L.dodge(N))), 'strikeD');
  const t = strip(L.taken(N, 3, 2, 0, true)).match(/(?:dealt; |^(?:\S+ combat \u2014 )?)([^;]+?) (?:takes|dodges the strike .*?takes) (\d+) \(loses (\d+) blood(?:, now (\d+))?/);
  assert(t && t[1] === 'Lisa' && t[3] === '2' && t[4] === '0', 'taken');
  assert(/^(?:\S+ combat \u2014 )?(.+?) maneuvers to (close|long)/i.test(strip(L.man(N, 'long'))), 'maneuver'); assert(/^(?:\S+ combat \u2014 )?(.+?) presses to (continue|end)/i.test(strip(L.press(N, 'end'))), 'press');
  assert(!L12.strikeD.test(strip(L.ends(N))), 'combat ends is NOT a dodge shape any more (the bot must learn "strikes: combat ends.")');
});
test('v2.6.129 tallyCombatMerge = srv-2.6.39 tallyCombat: absent preserves, a changed rd starts a fresh round (a next-round range carries in, locked), clamps and label hygiene', () => {
  const A = loadClient(CLIENT), M = A.tallyCombatMerge;
  const fresh = M({}, null); eq(fresh.rng, 'close'); eq(fresh.pr, null); eq(fresh.sp, 1); eq(fresh.nx, '');
  const r1 = Object.assign({ rd: 1 }, M({ rng: 'long', pr: 'continue', sa: 'Hand 1', xa: 1, pa: 2, nx: 'long' }, null));
  const kept = M({ sb: 'Dodge' }, r1); eq(kept.rng, 'long', 'absent rng preserved'); eq(kept.pr, 'continue'); eq(kept.sa, 'Hand 1'); eq(kept.sb, 'Dodge');
  const r2 = M({ rd: 2 }, r1); eq(r2.pr, null, 'new round: press cleared'); eq(r2.sa, ''); eq(r2.xa, 0); eq(r2.pa, 0); eq(r2.rng, 'long', 'the next-round range carried in'); eq(r2.rl, 1, '...and it is SET (maneuvers cannot move it)'); eq(r2.nx, '');
  const r3 = M({ rd: 2 }, Object.assign({}, r1, { nx: '' })); eq(r3.rng, 'close', 'no next-round effect -> close, the rulebook default'); eq(r3.rl, 0);
  const cl = M({ rng: 'far', pr: 'maybe', sp: 44, xa: -3, pb: 500, sa: '<b>x</b>'.repeat(20) }, null);
  eq(cl.rng, 'close'); eq(cl.pr, null); eq(cl.sp, 9); eq(cl.xa, 0); eq(cl.pb, 99); assert(cl.sa.length <= 40 && !/[<>]/.test(cl.sa), 'label capped + no angle brackets');
});
test('v2.6.129 twin: the client\'s tallyCombatMerge and the server\'s tallyCombat agree on 400 random writes (the rule lives in two files -- this is what keeps them one)', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, 'elysium-server.js'), 'utf8');
  const i = src.indexOf('const TALLY_CMB_KEYS'), j = src.indexOf('\nconst GAME_HANDLERS');
  assert(i > 0 && j > i, 'server anchor: TALLY_CMB_KEYS .. GAME_HANDLERS');
  const srvMerge = new Function(src.slice(i, j) + '\nreturn tallyCombat;')();
  const A = loadClient(CLIENT); let seed = 7; const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed >>> 16) % n; };   // v2.6.133: the HIGH bits -- an LCG's low bits have a tiny period (rnd(4) repeated every 4 calls)
  const pick = arr => arr[rnd(arr.length)];
  const vals = { rng: ['close', 'long', 'far', null], rl: [0, 1, 5, 'x'], nx: ['', 'close', 'long', 'x'], pr: [null, 'continue', 'end', 'x'], sp: [0, 1, 3, 20, 'y'], ce: [0, 1, true],
                 sa: ['', 'Hand 1', '<b>x</b>', 'y'.repeat(60)], sb: ['Dodge', null], xa: [0, 2, -1, 40], xb: [1, 'z'], pa: [0, 5, 500], pb: [3, -2], rd: [1, 2, 3, 0] };
  let prevC = null, prevS = null;
  for (let n = 0; n < 400; n++){
    const m = {}; Object.keys(vals).forEach(k => { if (rnd(3) === 0) m[k] = pick(vals[k]); });
    const c = A.tallyCombatMerge(m, prevC), s = srvMerge(m, prevS);
    eq(JSON.stringify(c), JSON.stringify(s), 'write #' + n + ' ' + JSON.stringify(m));
    const rd = ('rd' in m) ? Math.max(1, Math.min(99, (m.rd | 0) || 1)) : ((prevC && prevC.rd) || 1);
    prevC = Object.assign({ rd }, c); prevS = Object.assign({ rd }, s); if (rnd(10) === 0){ prevC = null; prevS = null; }
  }
});
test('v2.6.129 hotBridge: the table tally carries the combat state to every bot seat, keeps a bot\'s partial write beside the human\'s, and MP_HANDLERS.tally hands it to avr', () => {
  const { A, T, bot } = cmbTable(2);
  A.hotTallySend({ t: 'tally', mode: 'combat', a: 0, b: 0, ph: 1, rd: 1, rng: 'long' });
  bot({ pr: 'continue', sa: 'Hand 1' });
  const last = T.got[2][T.got[2].length - 1]; eq(last.rng, 'long', 'the human\'s range survived the bot\'s partial write'); eq(last.pr, 'continue'); eq(last.sa, 'Hand 1');
  eq(A.avr.rng, 'long'); eq(A.avr.pr, 'continue'); eq(A.avr.sa, 'Hand 1', 'avr follows the table tally');
  bot({ mode: 'block', a: 1 }); eq(T.HB.tally.rng, undefined, 'a non-combat tally carries no combat fields'); eq(A.avr.rng, 'close', 'and avr falls back to the defaults');
  A.localTable = false; T.HB.reset([]);
});
testA('v2.6.134 combat flow at a hotseat (human BLOCKS a bot): menu actions with menu amounts open the combat, fill the counters by range, snapshot blood on Damage, log the taken line ONCE, carry a next-round range and skip the maneuver step', async () => {
  const { A, T, v, lines, bot } = cmbTable(2);
  A.cmbManeuver(v); eq(A.avr.mode, 'combat'); eq(A.avr.duel[1].cid, v.id); eq(A.avr.rng, 'long'); eq(A.avr.ph, 1); assert(lines().includes('Lisa maneuvers to long.'));
  bot({ duelCid: 'b9', duelName: 'Bot Vamp', rng: 'close' }); eq(A.cmbSidesIn(A.avr).act, 2); eq(A.avr.rng, 'close');
  A.cmbStrike('hand', v, 1); eq(A.avr.b, 1); eq(A.avr.sb, 'Hand 1'); eq(A.avr.ph, 3);
  A.cmbManeuver(v); A.cmbStrike('hand', v, 2); eq(A.avr.b, 0, 'a hand strike does nothing at long'); assert(lines().includes('Lisa strikes with hands for 2.'));
  A.cmbStrike('weapon', v, 2); eq(A.avr.b, 2, 'a weapon at long: the player gave the number'); eq(A.avr.sb, 'Weapon 2'); assert(lines().includes('Lisa strikes with a weapon for 2.'));
  bot({ a: 3, sa: 'Hand 3' }); eq(A.avr.a, 3); eq(A.avr.sb, 'Weapon 2');
  A.cmbPrevent(v, 1); eq(A.avr.pb, 1); eq(A.avr.ph, 4); assert(lines().includes('Lisa prevents 1 damage.'));
  v.blood = 1; A.avrPhase(1); eq(A.avr.ph, 5);
  const tk = lines().filter(l => / takes /.test(l)); eq(tk.length, 1); eq(tk[0], 'Lisa takes 2 (loses 2 blood, now 1).');
  A.avrPhaseTo(4); A.avrPhaseTo(5); eq(lines().filter(l => / takes /.test(l)).length, 1);
  A.cmbSetRange('long', true, v); eq(A.avr.nx, 'long'); assert(lines().includes('Lisa sets range to long next round.'));
  A.cmbPress(v); eq(A.avr.pr, 'continue'); A.avrPhase(1); A.avrPhase(1); eq(A.avr.rd, 2); eq(A.avr.rng, 'long'); eq(A.avr.rl, 1);
  A.avrPhase(1); eq(A.avr.ph, 2, 'a set range skips Determine range');
  const n0 = lines().length; A.cmbManeuver(v); eq(lines().length, n0); eq(A.cmbMenu(v)[0].sub[0].disabled, true, 'Range > Maneuver disabled while set');
  A.cmbStrike('ends', v); eq(A.avr.ce, 1); eq(A.avr.ph, 6); assert(lines().includes('Lisa strikes: combat ends.')); eq(lines().filter(l => /combat ends|Combat ends/.test(l)).length, 1, 'ONE line for combat ends');
  A.avrPhase(1); eq(A.avr.mode, null); assert(lines().includes('Combat: 3 vs 2 damage dealt.'), 'v2.6.135: the resolve line sums the WHOLE combat (round 1: 3 vs 2, round 2 ended by combat ends)');
  A.localTable = false; T.HB.reset([]);
});
testA('v2.6.134 resolve straight out of Strike logs my taken line first; a remote step past Damage logs it here; x never does; additional strikes add a pair; steal and dodge are one line each', async () => {
  let { A, T, v, lines, bot } = cmbTable(1);
  A.cmbStrike('hand', v, 1); eq(A.avr.a, 1); bot({ duelCid: 'b9', duelName: 'Bot Vamp', b: 2 });
  A.cmbExtra(v); eq(A.avr.xa, 1); assert(lines().includes('Lisa gets an additional strike.'));
  A.cmbNextPair(); eq(A.avr.sp, 2); A.cmbStrike('strike', v, 1); eq(A.avr.a, 2, 'the additional pair adds'); assert(lines().includes('Lisa strikes for 1.'));
  A.avrResolve(); const L = lines(); const it = L.indexOf('Lisa takes 2 (loses 2 blood, now 1).'); assert(it >= 0); assert(L.indexOf('Combat: 2 vs 2 damage dealt.') > it);
  ({ A, T, v, lines, bot } = cmbTable(1));
  A.cmbStrike('steal', v, 2); eq(lines().filter(l => /^Lisa strikes/.test(l)).length, 1, 'steal = one line'); assert(lines().includes('Lisa strikes: steals 2 blood.')); eq(A.avr.a, 0, 'a steal is not damage');
  bot({ duelCid: 'b9', duelName: 'Bot Vamp', b: 4 }); A.avrPhaseTo(4); bot({ ph: 5 });
  eq(lines().filter(l => / takes /.test(l))[0], 'Lisa takes 4 (loses 3 blood, now 0) and goes to torpor.');
  A.cmbStrike('dodge', v); assert(lines().includes('Lisa strikes: dodge \u2014 no damage either way this round.'));   // (v2.6.136: after the taken check -- a dodge BEFORE the bot's 4 would, correctly, make it miss)
  ({ A, T, v, lines, bot } = cmbTable(1));
  A.cmbStrike('hand', v, 1); bot({ duelCid: 'b9', duelName: 'Bot Vamp', b: 1 }); A.avrClear();
  eq(lines().filter(l => / takes /.test(l)).length, 0); A.localTable = false; T.HB.reset([]);
});
testA('v2.6.130 another seat races Damage -> Press -> End -> Round 2 inside one debounce: this screen sees ph 4 then rd 2 -- its own taken line is still written, once, from round 1\'s numbers; a spectator\'s rail never moves their view', async () => {
  const { A, T, v, lines, bot } = cmbTable(1);
  await A.cmbStrike('hand', v); bot({ duelCid: 'b9', duelName: 'Bot Vamp', b: 2 }); bot({ ph: 4 });
  bot({ ph: 0, rd: 2, a: 0, b: 0 });
  const tk = lines().filter(l => / takes /.test(l)); eq(tk.length, 1, 'the line was written although ph 5 never arrived'); eq(tk[0], 'Lisa takes 2 (loses 2 blood, now 1).');
  bot({ ph: 1 }); eq(lines().filter(l => / takes /.test(l)).length, 1, 'round 2 stepping does not repeat round 1');
  bot({ ph: 6 }); bot({ ph: 0, rd: 3 }); eq(lines().filter(l => / takes /.test(l)).length, 1, 'a normal wrap from End of round logs nothing (nothing came in during round 2)');
  A.net.spect = true; const ph0 = A.avr.ph; A.avrPhaseTo(4); eq(A.avr.ph, ph0, 'spectator: the rail does not move their view'); A.avrPhase(1); eq(A.avr.ph, ph0, '...nor Next');
  A.net.spect = false; A.localTable = false; T.HB.reset([]);
});
testA('v2.6.131/134 Classic without helpers: the Combat menu works as log lines only (no combat state), and "Damage taken" -- shown ONLY with the combat helper off -- writes the frozen taken line from a number menu without touching the board', async () => {
  const { A, T, v, lines, answer } = cmbTable(2);
  const row = () => A.cmbMenu(v).find(x => x && x.label === 'Damage taken');
  assert(!row(), 'helper ON: no row');
  A.conv.tournament = true; A.net.helperPolicy = null; assert(row(), 'helper OFF: the row is there');
  A.cmbStrike('hand', v, 1); eq(A.avr.mode === 'combat', false); assert(lines().includes('Lisa strikes (hands) for 1.'));
  A.cmbManeuver(v, 'long'); A.cmbPress(v, 'continue'); assert(lines().includes('Lisa maneuvers to long.') && lines().includes('Lisa presses to continue.'));
  const r = row().sub; eq(r.map(x => x.label).join(' '), '1 2 3 4 N\u2026', 'the Bleed-style number menu');
  r[3].fn(); assert(lines().includes('Lisa takes 4 (loses 3 blood, now 0) and goes to torpor.')); eq(v.blood, 3, 'board untouched');
  answer('1'); await r[4].fn(); assert(lines().includes('Lisa takes 1 (loses 1 blood, now 2).'), 'N... asks the amount');
  const tk = () => lines().filter(l => / takes /.test(l)).length; const n0 = tk(); answer(null); await r[4].fn(); eq(tk(), n0, 'Cancel writes nothing');
  A.localTable = false; T.HB.reset([]);
});
testA('v2.6.132 pre-test fixes: a combat started from the right-click menu pins the Played window; the tutorial describes the step rail', async () => {
  const { A, T, v } = cmbTable(2);
  eq(A.playedPinned, false); A.cmbManeuver(v); eq(A.avr.mode, 'combat'); eq(A.playedPinned, true, 'the menu-started combat shows its panel');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(!/Damage numbers reset <b>manually<\/b>/.test(html)); assert(/The row becomes the <b>step rail<\/b>/.test(html));
  A.localTable = false; T.HB.reset([]);
});
test('v2.6.133 twin (whole tally): the server\'s GAME_HANDLERS.tally and the hotseat bridge\'s tallyIn store the same combat tally over 400 random partial writes -- a/b/ph/rd, the duel map and the twelve fields, incl. srv-2.6.40\'s new-round zeroing of an absent a/b', () => {
  const { loadServer } = require('./elysium-test-harness.js');
  const S = loadServer(require('path').join(__dirname, 'elysium-server.js')); const A = loadClient(CLIENT); const HB = A.hotBridge;
  HB.reset([{ name: 'You' }, { name: 'B2', bot: true }]); A.net.roster = [{ seat: 1, name: 'You', vp: 0 }, { seat: 2, name: 'B2', bot: true, vp: 0 }];
  const sock = { destroyed: false, writable: true, write(){ return true; }, end(){}, destroy(){}, on(){}, once(){} };
  const P = [{ name: 'You', sock }, { name: 'B2', sock }]; const room = { started: true, players: P, watchers: [] };
  let seed = 11; const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed >>> 16) % n; };   // the HIGH bits (see the v2.6.129 twin)
  let hits = 0; const pool = { ga: [0, 2], eb: [0, 1], a: [0, 2, 5], b: [1, 3], ph: [0, 3, 4, 5, 6], rd: [1, 2, 3], rng: ['long', 'close'], pr: ['continue', null], sa: ['Hand 1'], xb: [1], pb: [1], nx: ['close', ''] };
  for (let n = 0; n < 400; n++){
    const m = { t: 'tally', mode: rnd(12) === 0 ? 'block' : 'combat' }; Object.keys(pool).forEach(k => { if (rnd(4) === 0) m[k] = pool[k][rnd(pool[k].length)]; });
    const seat = 1 + rnd(2); if (rnd(6) === 0) m.duelCid = 'c' + seat;
    const pv = room.tally; if (pv && pv.mode === 'combat' && m.mode === 'combat' && ('rd' in m) && m.rd !== pv.rd && !('a' in m) && pv.a) hits++;
    S.GAME_HANDLERS.tally({ sock }, room, P[seat - 1], m); HB.tallyIn(P[seat - 1].name, seat, m);
    const strip = t => t ? JSON.stringify(Object.assign({}, t, { duel: t.duel ? Object.keys(t.duel).sort().map(k => k + ':' + t.duel[k].cid).join(',') : undefined })) : 'null';
    eq(strip(HB.tally), strip(room.tally), 'write #' + n + ' ' + JSON.stringify(m));
  }
  assert(hits >= 10, 'the sequence must actually exercise a new round with an absent a over a live a (hits ' + hits + ')');   // a twin that never meets the case proves nothing
  HB.reset([]);
});
testA('v2.6.133 the bot\'s round wrap as v0.6.166 writes it (rd:2 alone, then ph:0): round 1\'s damage does not ride into round 2, nothing re-fires, and a human strike in round 2 survives the bot\'s per-round announce', async () => {
  const { A, T, v, lines, bot } = cmbTable(2);
  bot({ duelCid: 'b9', duelName: 'Bot Vamp' }); await A.cmbStrike('hand', v); bot({ ph: 3 }); bot({ a: 2, sa: '.44 Magnum 2' });
  bot({ ph: 4 }); bot({ ph: 5 }); eq(lines().filter(l => / takes /.test(l))[0], 'Lisa takes 2 (loses 2 blood, now 1).', 'a BOT stepping 4 -> 5 writes my taken line');
  bot({ ph: 6 }); bot({ rd: 2 }); eq(A.avr.a, 0, 'round 2 starts with a = 0'); eq(A.avr.b, 0, '...and b = 0'); eq(A.avr.sb, ''); eq(A.avr.pr, null);
  bot({ ph: 0 }); eq(A.avr.rd, 2); eq(lines().filter(l => / takes /.test(l)).length, 1, 'the 6 -> 0 drop re-fires nothing');
  bot({ duelCid: 'b9', duelName: 'Bot Vamp' }); await A.cmbStrike('hand', v); bot({ duelCid: 'b9', duelName: 'Bot Vamp' });
  eq(A.avr.b, 1, 'my round-2 strike survives the bot\'s announce'); eq(A.avr.sb, 'Hand 1');
  bot({ rd: 3, a: 4 }); eq(A.avr.a, 4, 'a write that CARRIES a/b with the new round wins'); eq(A.avr.b, 0);
  A.localTable = false; T.HB.reset([]);
});
testA('v2.6.134 participants: the minion that BLOCKED (their turn) or ACTED (yours) joins by default when a combat opens -- by a bot or by you; clicking your field lists your ready minions to change or leave; after combat ends, a bot striking anyway writes no taken line', async () => {
  let { A, T, v, lines, bot } = cmbTable(2);
  let shown = null; A.showMenu = items => { shown = items; };
  const menuRow = (card, ...path) => { A.cardMenu(card, 0, 0); let it = shown; for (const p of path){ const r = it.find(x => x && x.label === p); assert(r, 'menu row ' + p); if (r.sub) it = r.sub; else return r; } return it; };
  menuRow(v, 'Actions', 'Block').fn(); assert(lines().includes('Lisa blocks.'), 'blocked through the real Actions menu');
  bot({ duelCid: 'b9', duelName: 'Bot Vamp' }); eq(A.avr.mode, 'combat'); eq(A.avr.duel[1] && A.avr.duel[1].cid, v.id, 'the bot opened the combat: Lisa (the blocker) joined by default');
  const w = A.makeCard('Marcus', 'crypt'); A.move(w, 'ready', { x: 200, y: 60, faceDown: false }); w.blood = 2;
  A.cmbPick({ clientX: 0, clientY: 0 }); const labels = shown.filter(x => x !== '-').map(x => x.label);
  assert(labels.includes('\u2713 Lisa (3)') && labels.includes('Marcus (2)') && labels.includes('Leave the combat'), 'the list: ' + labels.join(' | '));
  shown.find(x => x.label === 'Marcus (2)').fn(); eq(A.avr.duel[1].cid, w.id, 'changed to Marcus');
  A.cmbPick({}); shown.find(x => x.label === 'Leave the combat').fn(); eq(A.avr.duel[1], undefined, 'left');
  A.localTable = false; T.HB.reset([]);
  ({ A, T, v, lines, bot } = cmbTable(1)); A.showMenu = items => { shown = items; };
  const bleed = (() => { A.cardMenu(v, 0, 0); return shown.find(x => x.label === 'Actions').sub.find(x => x.label === 'Bleed').sub; })();
  bleed[0].fn(); assert(lines().some(l => /^Lisa bleeds for 1\./.test(l)), 'bled through the menu');
  A.avrOpen('combat'); eq(A.avr.duel[1] && A.avr.duel[1].cid, v.id, 'your Combat button: Lisa (the actor) joined by default');
  A.cmbStrike('ends', v); eq(A.avr.ce, 1);
  bot({ duelCid: 'b9', duelName: 'Bot Vamp' }); bot({ b: 1, sb: 'Hand' }); bot({ ph: 4 }); bot({ ph: 5 });
  eq(lines().filter(l => / takes /.test(l)).length, 0, 'the bot struck after combat ends and stepped 4 -> 5: no taken line (seen vs v0.6.166)');
  A.localTable = false; T.HB.reset([]);
});
test('v2.6.135 cmbDamage follows the rulebook: normal damage mended with blood; the first unprevented aggravated point wounds, each further point costs 1 blood or the vampire is BURNED; prevention goes on aggravated first; normal is handled before aggravated', () => {
  const A = loadClient(CLIENT), D = (n, p, b, g) => { const v = A.cmbDamage(n, p, b, g); return [v.net, v.burn, v.left, v.wounded, v.burned].join(','); };
  eq(D(2, 0, 3, 0), '2,2,1,false,false', 'plain: 2 in, 2 blood burned');
  eq(D(4, 0, 3, 0), '4,3,0,true,false', 'more than the blood: wounded');
  eq(D(0, 0, 3, 1), '1,0,3,true,false', 'one aggravated: wounded, no blood burned (it cannot be mended)');
  eq(D(0, 0, 3, 3), '3,2,1,true,false', 'three aggravated: the first wounds, two more cost 2 blood');
  eq(D(0, 0, 1, 3), '3,1,0,true,true', 'three aggravated on 1 blood: burned');
  eq(D(2, 0, 1, 1), '3,1,0,true,true', 'the forum case: Crows 2 on 1 blood wounds, then 1 aggravated on a wounded vampire with no blood burns it');
  eq(D(1, 1, 3, 1), '1,1,2,false,false', 'prevention on the aggravated point first');
});
testA('v2.6.135 aggravated, wounded and every-round damage at a hotseat: the menu rows, the read-out, the burned taken line, a wounded combatant ends the combat (Press skipped), Carrion Crows damage survives a new round, the history, and the resolve line sums the whole combat', async () => {
  let { A, T, v, lines, bot } = cmbTable(1);
  const m = A.cmbMenu(v); assert(m.find(x => x.label === 'Aggravated') && m.find(x => x.label === 'Damage each round'), 'the two new rows');
  A.cmbStrike('hand', v, 1); bot({ duelCid: 'b9', duelName: 'Bot Vamp' });
  A.cmbEnv(v, 1); eq(A.avr.ea, 1); assert(lines().includes('Lisa inflicts 1 damage on the opposing minion each round.'));
  bot({ gb: 2, sb: 'Aggravated 2' }); eq(A.avr.gb, 2);
  A.avrPhaseTo(4); const d = A.cmbSideDamage(A.avr, 'a'); eq([d.inc, d.agg, d.wounded].join(','), '0,2,true', 'Lisa: 2 aggravated in -> wounded');
  A.cmbPress(v); eq(A.avr.pr, 'continue');
  A.avrPhaseTo(4); A.avrPhase(1); eq(A.avr.ph, 6, 'wounded: Press is skipped');
  eq(lines().filter(l => / takes /.test(l))[0], 'Lisa takes 2 (loses 1 blood, now 2) and goes to torpor.', 'the first aggravated point wounds, the second costs 1 blood');
  A.avrPhase(1); eq(A.avr.mode, null, 'End of round ends the combat despite the press to continue');
  assert(lines().includes('Combat: 2 vs 2 damage dealt.'), 'the resolve line: Lisa 1 hand + 1 each round, the bot 2 aggravated');
  A.localTable = false; T.HB.reset([]);
  ({ A, T, v, lines, bot } = cmbTable(1));
  A.cmbStrike('hand', v, 1); bot({ duelCid: 'b9', duelName: 'Bot Vamp', b: 1 }); A.cmbEnv(v, 1); A.cmbStrike('dodge', v);
  eq(A.avr.a, 0, 'a dodge: my strike does nothing'); eq(A.avr.b, 0, '...and theirs misses'); eq(A.avr.ea, 1, 'but every-round damage cannot be dodged');
  A.cmbPress(v); A.avrPhaseTo(6); A.avrPhase(1); eq(A.avr.rd, 2, 'round 2'); eq(A.avr.ea, 1, 'Carrion Crows damage survives the new round'); eq(A.avr.a, 0);
  eq(A.cmbHist.length, 1, 'round 1 is in the history'); eq(A.cmbHist[0].da, 1, 'round 1: Lisa dealt 1 (the every-round damage)');
  bot({ b: 2 }); A.avrPhaseTo(6); A.avrPhase(1); eq(A.avr.mode, null);
  assert(lines().includes('Combat: 2 vs 2 damage dealt.'), 'the whole combat: Lisa 1 + 1 each round, the bot 0 + 2: ' + JSON.stringify(lines().filter(l => /^Combat:/.test(l))));
  A.localTable = false; T.HB.reset([]);
});
testA('v2.6.136 Carrion Crows needs a strike resolution: a combat-ends strike in the FIRST pair cancels that round\'s every-round damage (no taken line, not in the total); in a LATER pair it already landed; a dodge never stops it', async () => {
  let { A, T, v, lines, bot } = cmbTable(1);
  A.cmbStrike('hand', v, 1); bot({ duelCid: 'b9', duelName: 'Bot Vamp', eb: 1 });   // the bot's crows on Lisa
  A.cmbStrike('ends', v); eq(A.avr.ce, 1); eq(A.cmbSideDamage(A.avr, 'a').inc, 0, 'pair 1 combat ends: the crows never land');
  eq(lines().filter(l => / takes /.test(l)).length, 0, 'no taken line'); A.avrPhase(1); eq(A.avr.mode, null);
  assert(lines().includes('Combat: 0 vs 0 damage dealt.'), 'not in the total either: ' + JSON.stringify(lines().filter(l => /^Combat:/.test(l))));
  A.localTable = false; T.HB.reset([]);
  ({ A, T, v, lines, bot } = cmbTable(1));
  A.cmbStrike('hand', v, 1); bot({ duelCid: 'b9', duelName: 'Bot Vamp', eb: 1, xb: 1 }); A.cmbExtra(v); A.cmbNextPair(); eq(A.avr.sp, 2);
  A.cmbStrike('ends', v); eq(A.cmbSideDamage(A.avr, 'a').inc, 1, 'pair 2 combat ends: the crows landed with pair 1');
  eq(lines().filter(l => / takes /.test(l))[0], 'Lisa takes 1 (loses 1 blood, now 2).');
  A.localTable = false; T.HB.reset([]);
  ({ A, T, v, lines, bot } = cmbTable(1));
  A.cmbStrike('dodge', v); bot({ duelCid: 'b9', duelName: 'Bot Vamp', b: 2, eb: 1 }); eq(A.cmbSideDamage(A.avr, 'a').inc, 1, 'a dodge stops the strike, not the crows');
  A.localTable = false; T.HB.reset([]);
});
testA('v2.6.137 nothing outlives its action or its turn: the ACTOR closes the block counter on the wire when its action resolves; a new action resolves a finished combat first; a Block opened against Hunt / Political / Undirected card action gets stealth 1 from the actor (Bleed stays 0); a turn change clears the resolver everywhere', async () => {
  let { A, T, v, lines, bot } = cmbTable(1);
  A.avr = A.avrFresh(null);   // the harness boots before the helpers are switched on -- start from a clean resolver
  let shown = null; A.showMenu = items => { shown = items; };
  const action = label => { v.locked = false; A.cardMenu(v, 0, 0); shown.find(x => x.label === 'Actions').sub.find(x => x.label === label).fn(); };   // unlock between actions (autoLock locks the actor)
  const bleed1 = () => { v.locked = false; A.cardMenu(v, 0, 0); shown.find(x => x.label === 'Actions').sub.find(x => x.label === 'Bleed').sub[0].fn(); };
  bleed1(); eq(A.actUndir, false, 'a bleed is directed');
  bot({ mode: 'block', b: 1 }); eq(A.avr.mode, 'block', 'the BOT opened the block counter against my bleed'); eq(A.avr.a, 0, 'directed: stealth stays 0');
  bot({ mode: 'block', a: 2 }); eq(T.HB.tally.a, 2);
  A.resolvePlayedActions(); assert(A.avr.mode !== 'block'); eq(T.HB.tally, null, 'the ACTOR\'s resolve closed the table\'s block counter -- the bot no longer sees stealth 2 on the next action');
  action('Hunt'); eq(A.actUndir, true, 'Hunt is undirected');
  bot({ mode: 'block', b: 1 }); eq(A.avr.a, 1, 'the bot opened a block against my hunt: I (the actor) wrote stealth 1'); eq(T.HB.tally.a, 1, '...on the table too');
  A.resolvePlayedActions();
  v.locked = false; A.cardMenu(v, 0, 0); assert(shown.find(x => x.label === 'Actions').sub.some(x => x.label === 'Undirected card action'), 'the new row');
  action('Undirected card action'); assert(lines().includes('Lisa takes an undirected action.')); eq(A.actUndir, true);
  bot({ mode: 'block', a: 3 }); eq(A.avr.a, 3, 'a touched stealth is never overwritten'); A.resolvePlayedActions();
  action('Card action'); eq(A.actUndir, false, 'a plain card action is directed');
  A.cmbStrike('hand', v, 1); bot({ duelCid: 'b9', duelName: 'Bot Vamp' }); A.avrPhaseTo(6); eq(A.avr.mode, 'combat');
  v.locked = false; A.cardMenu(v, 0, 0); shown.find(x => x.label === 'Actions').sub.find(x => x.label === 'Vote').sub.find(x => x.label === 'Political action').fn();   // Actions > Vote > Political action
  eq(A.actUndir, true, 'a political action is undirected'); assert(A.avr.mode !== 'combat', 'the finished combat was resolved by the new action'); assert(lines().some(l => /^Combat: 1 vs 0 damage dealt\./.test(l)));
  A.cmbStrike('hand', v, 1); eq(A.avr.ph, 3); bleed1(); eq(A.avr.mode, 'combat', 'a combat mid-round is not touched');
  A.localTable = false; T.HB.reset([]);
  ({ A, T, v } = cmbTable(2)); A.cmbStrike('hand', v, 1); eq(A.avr.mode, 'combat');
  A.MP_HANDLERS.turn({ seat: 2, who: 'B2' }); assert(A.avr.mode !== 'combat', 'a turn change clears the resolver on this screen');
  A.localTable = false; T.HB.reset([]);
});
testA('v2.6.138 Rescue from torpor has two directions, and the undirected flag dies with its action: My vampire (undirected) / Opponent\'s vampire (directed); a card played as the NEXT action (never through the menu) no longer inherits the +1', async () => {
  const { A, T, v, lines, bot } = cmbTable(1); A.avr = A.avrFresh(null);
  let shown = null; A.showMenu = items => { shown = items; };
  const rescue = which => { v.locked = false; A.cardMenu(v, 0, 0); shown.find(x => x.label === 'Actions').sub.find(x => x.label === 'Rescue from torpor').sub.find(x => x.label === which).fn(); };
  rescue('My vampire'); assert(lines().includes('Lisa attempts to rescue their own vampire from torpor.')); eq(A.actUndir, true, 'own vampire: undirected');
  bot({ mode: 'block', b: 1 }); eq(A.avr.a, 1, 'the block against it opens at stealth 1');
  A.resolvePlayedActions(); eq(A.actUndir, false, 'the action is over: the flag is gone');
  bot({ mode: 'block', b: 1 }); eq(A.avr.a, 0, 'a block against the NEXT action (a card played, no menu) stays at 0');
  A.resolvePlayedActions();
  rescue("Opponent's vampire"); assert(lines().includes('Lisa attempts to rescue a vampire from torpor.')); eq(A.actUndir, false, "an opponent's vampire: directed");
  A.localTable = false; T.HB.reset([]);
});
test('v2.6.134 combat menu layout (Johan): Combat > Range (Maneuver / Set range close / long) | Hand strike / Weapon / Strike / Steal blood > 1 2 3 4 N... | Dodge | Combat ends | Additional strike | Prevent damage > ... | Press; nothing pushes an undo', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/items\.push\(\{label:'Actions', sub:\[[\s\S]*?\]\}\);\n      items\.push\(\{label:'Combat', sub:cmbMenu\(c\)\}\);/.test(html), 'Combat sits right after Actions');
  const A = loadClient(CLIENT); A.conv.tournament = false; A.net.helperPolicy = null;   // combat helper ON (with it off, Damage taken joins the menu -- the v2.6.131 test)
  const m = A.cmbMenu({ id: 'c1', name: 'Lisa' }); const lab = m.filter(x => x !== '-').map(x => x.label);
  eq(lab.join(' | '), 'Range | Hand strike | Weapon | Strike | Aggravated | Steal blood | Dodge | Combat ends | Additional strike | Prevent damage | Damage each round | Press to continue | Press to end');   // v2.6.135: + Aggravated, + Damage each round
  eq(m[0].sub.filter(x => x !== '-').map(x => x.label).join(' | '), 'Maneuver to long | Maneuver to close | Set range: close | Set range: long', 'no combat open: both maneuvers');
  ['Hand strike', 'Weapon', 'Strike', 'Aggravated', 'Steal blood', 'Prevent damage', 'Damage each round'].forEach(k => eq(m.find(x => x.label === k).sub.map(x => x.label).join(' '), '1 2 3 4 N\u2026', k + ' has the number menu'));
  const flat = []; const walk = a => a.forEach(x => { if (x === '-') return; if (x.sub) walk(x.sub); else flat.push(x); }); walk(m);
  assert(flat.every(x => x.noUndo || x.disabled), 'no combat row pushes an undo'); assert(m.every(x => x === '-' || !x.sub || x.sub.every(y => y === '-' || !y.sub)), 'never deeper than three levels (Combat > row > number)');
  assert(/const AVR_PHASES=\['Before range','Determine range','Before strikes','Strike','Damage resolution','Press','End of round'\]/.test(html));
  assert(/<span id="avrCnt">/.test(html) && /cnt\.style\.display = isC \? 'none' : ''/.test(html));
});

/* ======================= v2.6.139: THE BOT TEMPO + THE KNOWLEDGE LAYER ======================= */
test('v2.6.139 bot tempo twin: the client\'s botCfgMerge, the hotseat bridge\'s botcfgIn and the server\'s GAME_HANDLERS.botcfg store the same table tempo over 400 random partial writes -- and the client lands the server\'s broadcast unchanged', () => {
  const { loadServer } = require('./elysium-test-harness.js');
  const S = loadServer(require('path').join(__dirname, 'elysium-server.js')); const A = loadClient(CLIENT); const HB = A.hotBridge;
  HB.reset([{ name: 'You' }, { name: 'B2', bot: true }]);
  const sock = { destroyed: false, writable: true, write(){ return true; }, end(){}, destroy(){}, on(){}, once(){} };
  const P = [{ name: 'You', sock }]; const room = { started: false, players: P, watchers: [] };
  let seed = 7; const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed >>> 16) % n; };
  const T = ['standard', 'adaptive', 'turn', 'fast', 'TURN', '', null, 5, '__proto__', 'constructor'];
  const W = [1, 2.5, 3, 8, 0, -2, 9.99, 12, '3', '2.46', ' ', 'x', null, true, NaN, Infinity, 7.04, '0x10', 4.95];
  let cli = null, partial = 0, refused = 0;
  for (let n = 0; n < 400; n++){
    const m = { t: 'botcfg' }; if (rnd(3)) m.tempo = T[rnd(T.length)]; if (rnd(3)) m.waitSecs = W[rnd(W.length)];
    const before = JSON.stringify(room.botcfg || null);
    S.GAME_HANDLERS.botcfg({ sock }, room, P[0], m); HB.botcfgIn('You', m); const c = A.botCfgMerge(m.tempo, m.waitSecs, cli); if (c) cli = c;
    if (JSON.stringify(room.botcfg || null) === before) refused++; else if (!('tempo' in m) || !('waitSecs' in m)) partial++;
    const strip = x => x ? x.tempo + '/' + x.waitSecs : 'null';
    eq(strip(HB.botcfg), strip(room.botcfg), 'bridge vs server, write #' + n + ' ' + JSON.stringify(m));
    eq(strip(cli), strip(room.botcfg), 'client vs server, write #' + n + ' ' + JSON.stringify(m));
    if (room.botcfg){ A.MP_HANDLERS.botcfg(Object.assign({ t: 'botcfg' }, room.botcfg)); eq(strip(A.net.botcfg), strip(room.botcfg), 'the broadcast lands as sent'); }
  }
  assert(partial >= 40 && refused >= 40, 'the sequence must exercise partial writes AND ignored ones (partial ' + partial + ', ignored ' + refused + ')');   // a twin that never meets the case proves nothing
  HB.reset([]);
});
test('v2.6.139 the bridge keeps the table tempo like the server: botcfgIn fans the WHOLE state to every bot seat, a bot that joins later gets it right after `joined`, reset forgets it, and a bot cannot set it', () => {
  const A = loadClient(CLIENT); const HB = A.hotBridge;
  HB.reset([{ name: 'You' }, { name: 'B2', bot: true }, { name: 'B3', bot: true }]);
  const got = { 2: [], 3: [] }; const dial = k => HB.dialFor(k, 'B' + k)('x', { open(){}, msg: j => got[k].push(JSON.parse(j)), close(){} });
  const t2 = dial(2);
  eq(HB.botcfgIn('', A.BOTCFG0).waitSecs, 3, 'the seed stores Standard / 3 s');
  eq(got[2].filter(m => m.t === 'botcfg').length, 1, 'a seated bot hears it at once');
  HB.botcfgIn('You', { tempo: 'turn' });
  const last = got[2].filter(m => m.t === 'botcfg').pop(); eq(JSON.stringify(last), JSON.stringify({ t: 'botcfg', tempo: 'turn', waitSecs: 3, who: 'You' }), 'the whole state, named');
  const t3 = dial(3); t3.send({ t: 'join', room: 'hotseat', name: 'B3', bot: true });
  const seq = got[3].map(m => m.t); eq(seq.join(','), 'joined,botcfg', 'a later bot: joined, then the stored tempo');
  eq(got[3][1].tempo, 'turn');
  t2.send({ t: 'botcfg', tempo: 'standard' }); eq(HB.botcfg.tempo, 'turn', 'a BOT never sets the table tempo (the default case of _fromBot)');
  eq(HB.botcfgIn('You', { tempo: 'nope', waitSecs: 'x' }), null, 'nothing valid -> nothing stored, nothing sent');
  HB.reset([]); eq(HB.botcfg, null, 'a new table starts with none');
  const html = require('fs').readFileSync(CLIENT, 'utf8'); const sp = html.slice(html.indexOf('async function hotSpawnBots('), html.indexOf('function hotNextHuman('));
  assert(/hotBridge\.reset\([^\n]*\n\s*hotBridge\.botcfgIn\('', BOTCFG0\);/.test(sp), 'hotSpawnBots seeds Standard / 3 s right after the reset -- BEFORE any bot joins, so each one is told at `joined`');
});
test('v2.6.139 botCfgSet: offline the bridge + ONE log line (none for a no-change), online a PARTIAL write + the line; refused for spectators, an older server and a table without bots; the host seeds Standard / 3 s once and quietly', () => {
  const A = loadClient(CLIENT); const HB = A.hotBridge; const lines = () => A.errRing.map(e => e.m);
  const toasts = []; A.toast = (m) => toasts.push(String(m));
  // offline
  HB.reset([{ name: 'Lisa' }, { name: 'B2', bot: true }]); A.localTable = true; A.net.you = 'Lisa';
  eq(A.botCfgWhy(), 'No bots at this table.', 'no bot seated yet');
  HB.seats[2] = { cb: { msg(){} }, name: 'B2' };
  HB.botcfgIn('', A.BOTCFG0); eq(A.botCfgWhy(), '');
  eq(A.botCfgSet({ tempo: 'adaptive' }), true); eq(HB.botcfg.tempo, 'adaptive'); eq(HB.botcfg.who, 'Lisa');
  assert(lines().includes('Lisa set bot tempo: Adaptive, 3 s.'), 'the spec\'s line, word for word: ' + JSON.stringify(lines().slice(-2)));
  eq(A.botCfgSet({ tempo: 'adaptive' }), false, 'the same value again'); eq(lines().filter(l => /set bot tempo/.test(l)).length, 1, 'no change, no line');
  A.botCfgSet({ waitSecs: 2.5 }); assert(lines().includes('Lisa set bot tempo: Adaptive, 2.5 s.'));
  A.botCfgSet({ tempo: 'turn' }); assert(lines().includes('Lisa set bot tempo: Turn-based.'), 'Turn-based has no clock to name');
  eq(HB.botcfg.waitSecs, 2.5, 'the wait is kept for when the table leaves Turn-based');
  A.localTable = false; HB.reset([]);
  // online
  const sent = []; A.net.ws = { readyState: 1, send: j => sent.push(JSON.parse(j)) }; A.net.status = 'in'; A.net.room = 'R'; A.net.you = 'Bob'; A.net.spect = false;
  A.net.roster = [{ seat: 1, name: 'Bob', host: true }, { seat: 2, name: 'B2', bot: true }]; A.net.isHost = true; A.net.botcfg = null;
  A.net.srvV = '2.6.42'; assert(/needs v2\.6\.43/.test(A.botCfgWhy()), 'an older server cannot relay it -- the panel says so: ' + A.botCfgWhy());
  eq(A.botCfgSeed(), false, 'and the host does not seed into a server that would drop it'); eq(sent.length, 0);
  A.net.srvV = '2.6.43'; eq(A.botCfgWhy(), '');
  const bc = () => sent.filter(m => m.t === 'botcfg');   // the wire also carries the relayed log line (mpRelay) -- read the verb itself
  eq(A.botCfgSeed(), true, 'host + bots + nothing stored: one seed'); eq(JSON.stringify(bc().pop()), JSON.stringify({ t: 'botcfg', tempo: 'standard', waitSecs: 3 })); sent.length = 0;
  eq(lines().filter(l => /Bob set bot tempo/.test(l)).length, 0, 'quietly -- the table\'s default is nobody\'s change');
  eq(A.botCfgSeed(), false, 'once'); eq(bc().length, 0);
  A.botCfgSet({ waitSecs: 5 }); eq(JSON.stringify(bc().pop()), JSON.stringify({ t: 'botcfg', waitSecs: 5 }), 'PARTIAL: only what the click changed (a concurrent tempo change elsewhere survives)');
  eq(sent.filter(m => m.t === 'log').length, 1, 'and ONE line rides the wire with it');
  assert(lines().includes('Bob set bot tempo: Standard, 5 s.'));
  A.MP_HANDLERS.botcfg({ t: 'botcfg', who: 'Ann', tempo: 'turn', waitSecs: 5 }); eq(A.botCfgNow().tempo, 'turn', 'another human\'s change lands');
  A.net.isHost = false; A.net.botcfg = null; eq(A.botCfgSeed(), false, 'only the host seeds');
  A.net.spect = true; assert(/Spectators/.test(A.botCfgWhy())); eq(A.botCfgSet({ tempo: 'standard' }), false); assert(toasts.some(t => /Spectators/.test(t)), 'refused out loud');
  A.net.spect = false; A.net.roster = [{ seat: 1, name: 'Bob' }]; A.net.isHost = true; eq(A.botCfgSeed(), false, 'no bots at the table, nothing to seed');
  A.net.ws = null; A.net.status = 'off'; A.net.roster = []; A.net.room = null;
});
test('v2.6.139 the badge: the bots this tab runs, or ANY seated human at an online table with bots (the gear is everyone\'s); never a spectator; the gear rides the collapsed badge, the settings block reads the table', () => {
  const A = loadClient(CLIENT); const HB = A.hotBridge;
  eq(A.botBtnWanted(), false, 'no table');
  A.net.status = 'in'; A.net.room = 'R'; A.net.spect = false; A.net.roster = [{ seat: 1, name: 'Ann' }, { seat: 2, name: 'B2', bot: true }];
  eq(A.botBtnWanted(), true, 'a non-host human at a bot table -- the bots live in the host\'s tab, but the tempo is everyone\'s');
  A.net.spect = true; eq(A.botBtnWanted(), false, 'a spectator watches');
  A.net.spect = false; A.net.roster = [{ seat: 1, name: 'Ann' }]; eq(A.botBtnWanted(), false, 'no bots, no badge');
  A.net.status = 'off'; A.net.roster = [];
  // the render: a fake element catches the markup
  const el = { innerHTML: '', _botSig: null, querySelector: () => null, querySelectorAll: () => [], remove(){} }; A.__doc._ids.hotBotBtn = el;
  A.localTable = true; HB.reset([{ name: 'Lisa' }, { name: 'B2', bot: true }]); HB.seats[2] = { cb: { msg(){} }, name: 'B2' }; HB.botcfgIn('', A.BOTCFG0);
  const fake = { status: () => ({ name: 'B2', state: 'asking', waitingFor: 'block decision', until: null, step: 'resolve-ask', canStep: true }), step: () => ({ did: 'resolve-ask', why: 'window closed' }), _handlers: { tally(){}, say(){} } };
  A.hotBots[2] = fake;
  A.botPanelOpen = false; A.botPanelRender();
  assert(/id="botCfgGear"/.test(el.innerHTML), 'the gear IN the Bot button (spec section 1)'); assert(!/id="botGiveWord"/.test(el.innerHTML), 'Standard: no give-the-word button');
  HB.botcfgIn('Lisa', { tempo: 'turn' }); A.botPanelRender();
  assert(/id="botGiveWord"/.test(el.innerHTML), 'Turn-based + a bot waiting on a window: the play button beside the badge');
  let stepped = 0; fake.step = () => { stepped++; return { did: 'resolve-ask', why: 'window closed' }; };
  eq(A.botGiveWord(), 1, 'it steps the waiting bot'); eq(stepped, 1);
  fake.status = () => ({ name: 'B2', state: 'held', waitingFor: 'held by Lisa', until: null, step: 'release-hold', canStep: true });
  eq(A.botGiveWordWanted(), false, 'never a hold -- that is a human\'s pause, released by that human');
  A.botPanelOpen = true; A.botCfgOpen = true; el._botSig = null; A.botPanelRender();
  assert(/BOT SETTINGS/.test(el.innerHTML), 'the settings block'); assert(/data-t="turn" aria-pressed="true"/.test(el.innerHTML), 'the current tempo is pressed');
  assert(/id="botCfgWait"[^>]*disabled/.test(el.innerHTML), 'Turn-based greys the wait slider');
  assert(/does not read the tempo yet/.test(el.innerHTML), 'a bot file with no botcfg handler (bot <= v0.6.193) is named honestly -- its own clocks stay');
  fake._handlers.botcfg = () => {}; el._botSig = null; A.botPanelRender(); assert(!/does not read the tempo yet/.test(el.innerHTML), '...and the line goes away for a bot that reads it');
  delete A.hotBots[2]; A.localTable = false; HB.reset([]); delete A.__doc._ids.hotBotBtn;
  const h2 = (() => { A.net.status = 'in'; A.net.room = 'R'; A.net.srvV = '2.6.43'; A.net.roster = [{ seat: 1, name: 'Ann' }, { seat: 2, name: 'B2', bot: true }]; const x = A.botCfgHtml([]); A.net.status = 'off'; A.net.roster = []; return x; })();
  assert(!/disabled/.test(h2.replace(/id="botCfgWait"[^>]*>/, '')), 'a non-host human may press the tempo buttons');
});
test('v2.6.140 bot v0.6.195\'s two new rungs: resolve-phase (an open combat step) reads "Close step", resolve-vote (its vote poll) "Close poll" -- and the play button is a FILTER: every steppable rung but a hold, a rung a later bot names included (the bot project\'s ask: "filter, don\'t allow-list")', () => {
  const A = loadClient(CLIENT); const HB = A.hotBridge;
  eq(A.BOT_STEP_LABEL['resolve-phase'], 'Close step'); eq(A.BOT_STEP_LABEL['resolve-vote'], 'Close poll');
  const row = (key, step, canStep) => ({ key, bot: {}, st: { name: key, step, canStep } });
  const rows = [row('ask', 'resolve-ask', true), row('pq', 'resolve-pq', true), row('phase', 'resolve-phase', true), row('vote', 'resolve-vote', true),
    row('hold', 'release-hold', true), row('later', 'resolve-later', true), row('pacing', 'resolve-phase', false), row('none', null, true)];
  eq(A.botGiveWordTargets(rows).map(r => r.key).join(','), 'ask,pq,phase,vote,later', 'every steppable rung but a hold; a wait the bot will not let go of (canStep false) and a wait with no rung stay put');
  // the panel: a row's button reads its label off the rung, and in Turn-based the play button steps a bot that waits in a combat step
  const el = { innerHTML: '', _botSig: null, querySelector: () => null, querySelectorAll: () => [], remove(){} }; A.__doc._ids.hotBotBtn = el;
  A.localTable = true; HB.reset([{ name: 'Lisa' }, { name: 'B2', bot: true }]); HB.seats[2] = { cb: { msg(){} }, name: 'B2' }; HB.botcfgIn('', A.BOTCFG0); HB.botcfgIn('Lisa', { tempo: 'turn' });
  let stepped = 0;
  const fake = { status: () => ({ name: 'B2', state: 'waiting', waitingFor: 'combat step maneuvers (Lisa)', until: null, step: 'resolve-phase', canStep: true }),
    step: () => { stepped++; return { did: 'resolve-phase', why: 'closed the step' }; }, _handlers: { botcfg(){} } };
  A.hotBots[2] = fake;
  A.botPanelOpen = true; A.botCfgOpen = false; A.botPanelRender();
  assert(/Close step<\/button>/.test(el.innerHTML), 'the combat-step row says Close step');
  assert(/id="botGiveWord"/.test(el.innerHTML), 'Turn-based + a bot waiting in a combat step: the play button is there (an allow-list of the first two rungs would hide it)');
  eq(A.botGiveWord(), 1, 'and it steps the combat step'); eq(stepped, 1);
  fake.status = () => ({ name: 'B2', state: 'waiting', waitingFor: 'votes (Lisa)', until: null, step: 'resolve-vote', canStep: true }); el._botSig = null; A.botPanelRender();
  assert(/Close poll<\/button>/.test(el.innerHTML), 'the vote-poll row says Close poll');
  delete A.hotBots[2]; A.localTable = false; HB.reset([]); delete A.__doc._ids.hotBotBtn;
});
test('v2.6.140 the Stolen read-out follows bot v0.6.196\'s steal rule: a dodge OR a first-pair combat-ends strike stops the steal (as it stops the damage), in a later pair the first pair\'s steal stood; and Bot settings says the damage step waits once, a question in combat twice', () => {
  const A = loadClient(CLIENT);
  const st = o => Object.assign({ mode: 'combat', rd: 1, ph: 4, sp: 1, sa: 'Steal 2', sb: 'Hand 1' }, o);
  eq(JSON.stringify(A.cmbStolen(st(), 'b')), '{"n":2}', 'b is stolen from -- the card\'s number (the victim moves what the vampire holds)');
  eq(A.cmbStolen(st(), 'a'), null, 'the stealer loses nothing');
  eq(A.cmbStolen(st({ sb: 'Dodge' }), 'b'), null, 'the victim dodged: nothing lands');
  eq(A.cmbStolen(st({ sb: 'Combat ends', ce: 1 }), 'b'), null, 'the victim ended the combat in the first pair: the steal never lands -- v2.6.139 still said "move it"');
  eq(A.cmbStolen(st({ ce: 1 }), 'b'), null, 'whoever ended it: combat ends before the strikes resolve, exactly as for the damage (cmbEnvOf)');
  eq(JSON.stringify(A.cmbStolen(st({ ce: 1, sp: 2 }), 'b')), '{"n":2}', 'combat ended in a LATER pair: the first pair\'s steal had already landed (the v2.6.130 rule)');
  eq(A.cmbStolen(st({ sa: 'Hand 1' }), 'b'), null, 'no steal, no read-out');
  eq(A.cmbStolen({}, 'b'), null); eq(A.cmbStolen(null, 'b'), null, 'no tally reads as nothing, never a throw in the render');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/const sv=cmbStolen\(avr, side\); if\(sv\)/.test(html) && !/const sm=\/\^Steal/.test(html), 'the panel\'s read-out goes through the one rule');
  assert(/standard:'Every wait on a human lasts the wait time \(a question in combat: twice that\)/.test(html), 'Standard: the silent damage step is 1 x since bot v0.6.196 -- only a combat question is twice');
  assert(/adaptive:'[^']*never past the wait time \(a question in combat: twice that\)/.test(html), 'Adaptive\'s ceiling likewise');
});
test('v2.6.140 the .js twins a local-file table reads (elysium-twd-profile.js / elysium-twd-archetypes.js, bot v0.6.195) carry exactly the JSONs\' data under the names the client reads -- when the bot project\'s release sits beside the suite (skips loudly otherwise)', () => {
  const fs = require('fs'), path = require('path'), vm = require('vm');
  const pairs = [['elysium-twd-profile', 'ELYSIUM_TWD_PROFILE', 'cards'], ['elysium-twd-archetypes', 'ELYSIUM_TWD_ARCHETYPES', 'archetypes'], ['elysium-cardfx', 'ELYSIUM_CARDFX', null]];
  let ran = 0;
  for (const [base, glob, key] of pairs) {
    const js = path.join(__dirname, base + '.js'), json = path.join(__dirname, base + '.json');
    if (!fs.existsSync(js) || !fs.existsSync(json)) { console.log('       (' + base + '.js / .json not both beside the suite -- the twin check for it was skipped; upload the bot project\'s release to run it)'); continue; }
    const sb = {}; sb.globalThis = sb; sb.window = sb; vm.runInNewContext(fs.readFileSync(js, 'utf8'), sb, { filename: base + '.js' });
    assert(sb[glob] && typeof sb[glob] === 'object', base + '.js sets ' + glob + ' -- the name hotLoadBotRes reads on file://');
    const a = JSON.stringify(sb[glob]), b = JSON.stringify(JSON.parse(fs.readFileSync(json, 'utf8')));   // one serialize, two writes -- the same data, byte for byte once re-serialized
    if (a !== b){ let i = 0; while (i < a.length && a[i] === b[i]) i++; throw new Error(base + ': the twin and the JSON differ (' + a.length + ' vs ' + b.length + ' chars; first difference at ' + i + ': ' + JSON.stringify(a.slice(Math.max(0, i - 40), i + 40)) + ')'); }
    if (key) assert(sb[glob][key], base + ': the shape the client checks (' + key + ')');
    ran++;
  }
  if (ran) console.log('       (' + ran + ' of 3 twin pairs checked)');
});
test('v2.6.139 the knowledge layer reaches every browser bot: both spawn paths hand over twdProfile / twdArchetypes from ONE loader; http fetches the two JSONs beside cardfx, file:// injects .js siblings; the server serves the JSONs', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  eq((html.match(/twdProfile:twd, twdArchetypes:ark,/g) || []).length, 2, 'netBotAdd AND hotSpawnBots pass both objects');
  eq((html.match(/const \{ fx, twd, ark \}=await hotLoadBotRes\(\);/g) || []).length, 2, 'from the same once-per-page loader');
  const L = html.slice(html.indexOf('function hotLoadBotRes'), html.indexOf('/* ---------- v2.6.99 (Johan): ONLINE bots'));
  for (const nm of ['elysium-twd-profile.json', 'elysium-twd-archetypes.json', 'elysium-twd-profile.js', 'elysium-twd-archetypes.js', 'ELYSIUM_TWD_PROFILE', 'ELYSIUM_TWD_ARCHETYPES']) assert(L.indexOf(nm) > 0, 'the loader knows ' + nm);
  const srv = require('fs').readFileSync(require('path').join(__dirname, 'elysium-server.js'), 'utf8');
  assert(/new Set\(\['\/elysium-bot\.js', '\/elysium-cardfx\.json', '\/elysium-twd-profile\.json', '\/elysium-twd-archetypes\.json'\]\)/.test(srv), 'srv-2.6.43 serves both JSONs on the exact-match route');
});
testA('v2.6.139 hotLoadBotRes over http: three fetches (cardfx + profile + archetypes), each shape-checked, a missing or misshapen one is null and never fatal', async () => {
  const served = { 'elysium-cardfx.json': { fxv: 1 }, 'elysium-twd-profile.json': { cards: { 'Bum\'s Rush': [0.5] }, clans: {} }, 'elysium-twd-archetypes.json': { archetypes: [{ name: 'Lawfirm' }] } };
  const asked = [];
  const mk = srv => loadClient(CLIENT, { location: { protocol: 'http:', host: 'x' }, fetch: nm => { asked.push(nm); const j = srv[nm]; return Promise.resolve(j === undefined ? { ok: false, json: () => Promise.reject(new Error('404')) } : { ok: true, json: () => Promise.resolve(j) }); } });
  global.ElysiumBot = { BOT_VERSION: '0.6.193', ARCHETYPES: {} };
  try {
    let A = mk(served); let r = await A.hotLoadBotRes();
    eq(r.fx.fxv, 1); assert(r.twd && r.twd.cards, 'the profile object'); assert(r.ark && r.ark.archetypes, 'the archetypes object');
    eq(asked.filter(n => /^elysium-/.test(n)).sort().join(','), 'elysium-cardfx.json,elysium-twd-archetypes.json,elysium-twd-profile.json', 'three bot-file fetches, nothing else (the boot\'s own card database fetch rides the same stub)');
    eq(await A.hotLoadBotRes(), r, 'ONE promise per page load -- every bot gets the same objects');
    A = mk({ 'elysium-cardfx.json': { fxv: 1 }, 'elysium-twd-archetypes.json': '<!doctype html>' }); r = await A.hotLoadBotRes();
    eq(r.twd, null, 'missing profile -> null (the bot reads no decks)'); eq(r.ark, null, 'an index page served for the path -> null, not handed to the bot'); eq(r.fx.fxv, 1, 'cardfx unaffected');
  } finally { delete global.ElysiumBot; }
});
testA('v2.6.140 hotLoadBotRes on a LOCAL FILE: three classic scripts (cardfx + the two twd twins, bot v0.6.195), each read off the global it sets; a twin that is not beside the client is null and never fatal', async () => {
  const fs = require('fs'), path = require('path'), vm = require('vm');
  const A = loadClient(CLIENT, { location: { protocol: 'file:', host: '' } });
  const injected = [];
  A.__doc.createElement = tag => ({ tag });
  A.__doc.head = { appendChild: sc => { injected.push(sc.src); const f = path.join(__dirname, sc.src);   // a classic <script>: run the file beside the suite, or fail like a missing file
    setTimeout(() => { if (fs.existsSync(f)) { vm.runInThisContext(fs.readFileSync(f, 'utf8'), { filename: sc.src }); sc.onload(); } else sc.onerror(); }, 0); } };
  global.ElysiumBot = { BOT_VERSION: '0.6.195', ARCHETYPES: {} };
  try {
    const r = await A.hotLoadBotRes();
    eq(injected.join(','), 'elysium-cardfx.js,elysium-twd-profile.js,elysium-twd-archetypes.js', 'three classic scripts, nothing fetched -- a local file cannot fetch()');
    for (const [nm, k, key] of [['elysium-twd-profile', 'twd', 'cards'], ['elysium-twd-archetypes', 'ark', 'archetypes']]) {
      const js = path.join(__dirname, nm + '.js'), json = path.join(__dirname, nm + '.json');
      if (!fs.existsSync(js)) { eq(r[k], null, nm + '.js not beside: null -- the bots read no decks, nothing breaks'); console.log('       (' + nm + '.js not beside the suite -- only the missing-file path was checked; upload the bot project\'s release to run the rest)'); continue; }
      assert(r[k] && r[k][key], nm + '.js beside the client: the bot is handed the object it sets (shape: ' + key + ')');
      if (fs.existsSync(json)) assert(JSON.stringify(r[k]) === JSON.stringify(JSON.parse(fs.readFileSync(json, 'utf8'))), nm + ': the local-file table hands the bot the same data as a served one');
    }
  } finally { delete global.ElysiumBot; delete global.ELYSIUM_CARDFX; delete global.ELYSIUM_TWD_PROFILE; delete global.ELYSIUM_TWD_ARCHETYPES; }
});
testB('v2.6.139 LIVE with the released bot: the knowledge objects are the ones the bot holds, and a bot that does not read botcfg yet takes the table tempo silently (no handler error) -- the panel names it', async () => {
  const BOT = require('./elysium-bot.js'); const A = loadClient(CLIENT); const HB = A.hotBridge;
  HB.reset([{ name: 'You' }, { name: 'Two', bot: true }]); A.localTable = true;
  HB.botcfgIn('', A.BOTCFG0);
  const prof = { cards: {}, clans: {} }, ark = { archetypes: [], vocab: [], gate: {} }; const errs = [];
  const b = new BOT.Bot({ room: 'hot', pass: '', name: 'Two', paceMs: 0, askSecs: 1, transport: HB.dialFor(2, 'Two'), deck: BOT.ARCHETYPES.ventrue, deckName: 'ventrue', persona: 'expert',
    twdProfile: prof, twdArchetypes: ark, log: (...a) => { const t = a.join(' '); if (/handler error/.test(t)) errs.push(t); } });
  assert(b.twd === prof && b.ark === ark, 'the bot holds exactly the objects it was handed -- in a browser nothing else would reach it');
  await b.connect(); const t0 = Date.now(); while ((!HB.seats[2] || !HB.seats[2].deck) && Date.now() - t0 < 6000) await new Promise(r => setTimeout(r, 40));
  HB.botcfgIn('You', { tempo: 'adaptive', waitSecs: 2 }); await new Promise(r => setTimeout(r, 120));
  eq(errs.length, 0, 'no handler error for botcfg: ' + errs.join(' | '));
  const reads = !!(b._handlers && typeof b._handlers.botcfg === 'function');
  const rows = [{ key: 's2', bot: b, st: A.botPanelSeats ? { canStep: false } : {} }];
  eq(A.botCfgDeafVer(rows) === '', reads, reads ? 'this bot reads botcfg -- the panel stays quiet' : 'bot v' + BOT.BOT_VERSION + ' has no botcfg handler yet -- the panel says so');
  b.close(); A.localTable = false; HB.reset([]);
});
testB('v2.6.140 LIVE, the tempo meets the REAL bot through the bridge: the seeded Standard 3 s shortens its block window (spawned with askSecs 20), and in Turn-based it waits on the human with no clock until the play button gives it the word -- a bot that does not read botcfg (<= v0.6.193) skips loudly', async () => {
  const BOT = require('./elysium-bot.js'); const A = loadClient(CLIENT); const HB = A.hotBridge;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  HB.reset([{ name: 'You' }, { name: 'Two', bot: true }]);
  A.net.roster = [{ seat: 1, name: 'You', vp: 0 }, { seat: 2, name: 'Two', bot: true, vp: 0 }];
  A.net.you = 'You'; A.net.boards = {}; A.net.hot = { boards: { 1: JSON.stringify({ pool: 30 }), 2: '{}' }, undo: {} }; A.localTable = true; A.conv.tournament = false;
  HB.botcfgIn('', A.BOTCFG0);   // the seed hotSpawnBots stores before any bot joins
  let passes = 0; HB.onPass = s => { if (s === 2) passes++; };
  const b = new BOT.Bot({ room: 'hot', pass: '', name: 'Two', paceMs: 0, askSecs: 20, transport: HB.dialFor(2, 'Two'), deck: BOT.ARCHETYPES.ventrue, deckName: 'ventrue', persona: 'expert', log: () => {} });
  const waitOnHuman = async (ms, armed) => { const t = Date.now(); let st = null; while (Date.now() - t < ms){ st = A.botPanelRead(b); if (st.canStep && st.step && st.step !== 'release-hold' && (!armed || st.until != null)) return st; await sleep(50); } return st; };   // v2.6.162: armed -- bot v0.6.204 arms a wait's clock when its question is ON THE WIRE; while the question is still queued the wait is steppable with until: null (the bot project's handoff v0.6.204 section 3), so the Standard half waits for the clock itself
  const nextTurn = async (n) => { b.hand.length = 0; HB.turn(2); };   // an empty hand: a plain bleed -- the flow under test is the WAIT, not the bot's card choice (the hidden-randomness class)
  try {
    await b.connect(); const t0 = Date.now(); while ((!HB.seats[2] || !HB.seats[2].deck) && Date.now() - t0 < 6000) await sleep(40);
    if (!(b._handlers && typeof b._handlers.botcfg === 'function')){ const e = new Error('SKIP -- bot v' + BOT.BOT_VERSION + ' beside the suite does not read botcfg; the tempo checks need v0.6.194+'); e.skip = true; throw e; }
    assert(HB.startFor(2), 'dealt'); await sleep(300);
    const u = b.unc.shift(); b.board.push({ id: u.id, name: u.name, kind: 'crypt', zone: 'ready', x: 0, y: 0, locked: false, faceDown: false, blood: u.cap || 5, cap: u.cap || 5 }); b.push();
    const v = A.makeCard('Lisa', 'crypt'); A.move(v, 'ready', { x: 100, y: 60, faceDown: false }); v.blood = 3;   // the human could block -- so every tempo asks
    A.hotBots[2] = b; await sleep(700);
    // 1. Standard 3 s, seeded: the window closes on the table's clock, not the spawn's 20 s
    await nextTurn(); let st = await waitOnHuman(10000, true);
    assert(st && st.canStep, 'Standard: the bot waits on the human: ' + JSON.stringify(st));
    assert(st.until != null && st.until - Date.now() <= 6500, 'the seeded Standard 3 s is what the bot keeps, not askSecs 20 (left: ' + (st.until == null ? 'none' : Math.round(st.until - Date.now()) + ' ms') + ')');
    let t = Date.now(); while (passes < 1 && Date.now() - t < 20000) await sleep(100);
    eq(passes, 1, 'the turn completes on the short clock');
    // 2. Turn-based: no clock; the play button gives the word
    HB.botcfgIn('You', { tempo: 'turn' });
    await nextTurn(); st = await waitOnHuman(10000);
    assert(st && st.canStep, 'Turn-based: the bot waits on the human: ' + JSON.stringify(st));
    eq(st.until, null, 'no clock -- the panel shows an em-dash');
    await sleep(1500);
    eq(passes, 1, 'it does not go on by itself'); eq(A.botPanelRead(b).step, st.step, 'the same wait, 1.5 s later');
    assert(A.botGiveWordWanted(), 'the play button is offered');
    eq(A.botGiveWord(), 1, 'it gives the bot the word');
    t = Date.now(); while (passes < 2 && Date.now() - t < 20000) await sleep(100);
    eq(passes, 2, 'and the turn completes');
  } finally { delete A.hotBots[2]; b.close(); A.localTable = false; HB.reset([]); }
});
testB('v2.6.142 LIVE: the badge and the REAL bot agree on the hold -- the bot\'s own Hold on never shows, a typed "hold on" through the chat line holds both, a typed "it resolves" releases both, and the panel\'s Release hold clears the badge with the bot', async () => {
  const BOT = require('./elysium-bot.js'); const A = loadClient(CLIENT); const HB = A.hotBridge;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  HB.reset([{ name: 'You' }, { name: 'Agreebot', bot: true }]);
  A.net.roster = [{ seat: 1, name: 'You' }, { seat: 2, name: 'Agreebot', bot: true }];
  A.net.you = 'You'; A.localTable = true;
  const b = new BOT.Bot({ room: 'hot', pass: '', name: 'Agreebot', paceMs: 300, askSecs: 1, transport: HB.dialFor(2, 'Agreebot'), log: () => {} });
  const seen = []; const origSay = A.MP_HANDLERS.say;
  A.MP_HANDLERS.say = m => { seen.push(m.i | 0); return origSay(m); };
  try {
    await b.connect(); const t0 = Date.now(); while ((!HB.seats[2] || !HB.seats[2].deck) && Date.now() - t0 < 4000) await sleep(40);
    assert(HB.startFor(2) === true, 'the deal fired'); await sleep(150);
    A.hotBots[2] = b;
    // 1. the bot's own Hold on, once this client has received it
    b.say('Hold on\u2026');
    let t = Date.now(); while (!seen.includes(0) && Date.now() - t < 8000) await sleep(40);
    assert(seen.includes(0), "the bot's Hold on reached the client");
    eq(A.hotHoldBy.size, 0, "a bot's Hold on is not a hold: the badge stays empty (v2.6.141 read 'Bots held by Agreebot')");
    // 2. a typed hold, through the chat line's own send path
    A.chatSendLine('hold on, checking a card'); await sleep(200);
    assert(b._holdBy && b._holdBy.has('You'), 'the real bot is held by the typed line');
    eq(A.botPanelRead(b).state, 'held', 'and says so through status()');
    eq([...A.hotHoldBy].join(), 'You', 'the badge shows the same hold (v2.6.141 stayed empty)');
    // 3. a typed release
    A.chatSendLine('it resolves'); await sleep(200);
    eq(b._holdBy.size, 0, 'the real bot is released');
    eq(A.hotHoldBy.size, 0, 'and so is the badge');
    // 4. the panel's Release hold
    A.chatSendLine('hold on'); await sleep(200);
    eq(A.hotHoldBy.size, 1); eq(A.botPanelRead(b).state, 'held');
    const out = b.step();
    eq(out.did, 'release-hold', 'the panel button releases the bot: ' + JSON.stringify(out));
    eq(A.hotHoldAfterPanelRelease(), true, 'no bot is held any more, so the badge clears with it');
    eq(A.hotHoldBy.size, 0);
  } finally { A.MP_HANDLERS.say = origSay; delete A.hotBots[2]; b.close(); A.localTable = false; HB.reset([]); A.net.roster = []; }
});
/* ---------- v2.6.143: THE TABLE LISTENS (a player's first-night feedback) ---------- */
const ADV_DB = [   // KRCG's real v3 shape for the three ways cards share a bare name: a vampire + its advanced version, an old vampire + its new-group reprint, and a card alone
  { id: 1, name: 'Alan Sovereign (G3)', _name: 'Alan Sovereign', printed_name: 'Alan Sovereign', name_variants: ['Alan Sovereign'], types: ['Vampire'], card_text: 'BASE text', capacity: 6, group: '3' },
  { id: 2, name: 'Alan Sovereign (G3 ADV)', _name: 'Alan Sovereign', printed_name: 'Alan Sovereign', name_variants: ['Alan Sovereign (ADV)'], adv: true, types: ['Vampire'], card_text: 'ADVANCED text', capacity: 6, group: '3' },
  { id: 3, name: 'Theo Bell (G2)', _name: 'Theo Bell', printed_name: 'Theo Bell', name_variants: ['Theo Bell'], types: ['Vampire'], card_text: 'OLD Theo', capacity: 7, group: '2' },
  { id: 4, name: 'Theo Bell (G6)', _name: 'Theo Bell', printed_name: 'Theo Bell', types: ['Vampire'], card_text: 'NEW Theo', capacity: 8, group: '6' },
  { id: 5, name: 'Tegyrius, Vizier (G2 ADV)', _name: 'Tegyrius, Vizier', printed_name: 'Tegyrius, Vizier', name_variants: ['Tegyrius (G2 ADV)', 'Tegyrius, Vizier (ADV)', 'Tegyrius (ADV)'], adv: true, types: ['Vampire'], card_text: 'ADV Tegyrius', capacity: 9 },
  { id: 6, name: 'Blood Doll', _name: 'Blood Doll', printed_name: 'Blood Doll', types: ['Master'], card_text: 'doll' }
];
test('v2.6.143: every export spelling of an advanced vampire is a known name -- "Name (ADV)" lives only in KRCG\'s name_variants, which the v3 parser never read', () => {
  if (!API.buildCardIndex || !API.cardIsAdv) throw new Error('buildCardIndex / cardIsAdv not exposed (harness needs updating)');
  const ix = API.buildCardIndex(ADV_DB), N = API.norm;
  for (const nm of ['Alan Sovereign (ADV)', 'Alan Sovereign (G3 ADV)', 'Tegyrius (ADV)', 'Tegyrius, Vizier (ADV)', 'Tegyrius (G2 ADV)'])
    assert(ix.map.get(N(nm)), nm + ' is known');
  eq(ix.info.get(N('Alan Sovereign (ADV)')).text, 'ADVANCED text', 'and it is the advanced card');
  const deck = API.parseDeck('Crypt (12 cards)\n2x Alan Sovereign (ADV)     6 AUS DOM for pre  Ventrue:3\n2x Alan Sovereign           6 AUS DOM for      Ventrue:3\n1x Tegyrius, Vizier (ADV)\nLibrary (1)\n1x Blood Doll\n1x Not A Card\n');
  eq(API.deckUnknownNames(deck, ix.map).join('|'), 'Not A Card', 'a VDB-style list with advanced vampires passes the Legal-cards gate; a real misspelling is still caught');
  eq(API.cardIsAdv(ADV_DB[1]), true); eq(API.cardIsAdv(ADV_DB[0]), false);
  eq(API.cardIsAdv({ name: 'X (G1 ADV)' }), true, 'v3 without the flag: the name says so');
  eq(API.cardIsAdv({ printed_name: 'X', suffix: 'G1 ADV', kind: 'Crypt' }), true, 'v5: the suffix says so');
  eq(API.cardIsAdv({ name: 'Advocate' }), false, 'a name that merely contains the letters is not advanced');
});
test('v2.6.143: the bare name belongs to the card KRCG names it for -- the base vampire, the older printing -- in ANY file order (last-wins gave it to the advanced card and the reprint)', () => {
  const N = API.norm;
  for (const list of [ADV_DB, ADV_DB.slice().reverse()]) {
    const ix = API.buildCardIndex(list);
    eq(ix.info.get(N('Alan Sovereign')).text, 'BASE text', 'the bare name is the base vampire');
    eq(ix.info.get(N('Alan Sovereign (G3)')).text, 'BASE text');
    eq(ix.info.get(N('Theo Bell')).text, 'OLD Theo', 'the bare name is the printing whose name_variants claims it');
    eq(ix.info.get(N('Theo Bell (G6)')).text, 'NEW Theo', 'the reprint keeps its own full name');
    eq(ix.info.get(N('Theo Bell (G6)')).cap, 8);
    eq(ix.info.get(N('Tegyrius, Vizier')).text, 'ADV Tegyrius', 'a bare name nobody else claims still resolves (weak fill)');
    eq(ix.info.get(N('Blood Doll')).text, 'doll');
    eq(ix.imgNames.has('alansovereigng3adv'), true, 'the image names are untouched');
  }
  const two = API.buildCardIndex([{ name: 'Z (G1 ADV)', _name: 'Z', adv: true, types: ['Vampire'], card_text: 'adv' }, { name: 'Z (G1)', _name: 'Z', types: ['Vampire'], card_text: 'base' }]);
  eq(two.info.get('z').text, 'base', 'with no name_variants at all, a base card still displaces an advanced card\'s hold on the bare name');
  const rev = API.buildCardIndex([{ name: 'Z (G1)', _name: 'Z', types: ['Vampire'], card_text: 'base' }, { name: 'Z (G1 ADV)', _name: 'Z', adv: true, types: ['Vampire'], card_text: 'adv' }]);
  eq(rev.info.get('z').text, 'base', 'in either order');
});
test('v2.6.143: the v5 shape keeps its rule -- a suffixed card\'s printed_name is weak, its name_variants are strong', () => {
  const v5 = (suffix, variants, text) => ({ printed_name: 'Kemintiri', suffix, kind: 'Crypt', name_variants: variants.map(n => ({ type: 'Lexicographical', name: n })), prints: [], types: ['Vampire'], text });
  for (const list of [[v5('G2', ['Kemintiri', 'Kemintiri (G2)'], 'base'), v5('G2 ADV', ['Kemintiri (ADV)', 'Kemintiri (G2 ADV)'], 'adv')]]) for (const l of [list, list.slice().reverse()]) {
    const ix = API.buildCardIndex(l);
    eq(ix.info.get('kemintiri').text, 'base'); eq(ix.info.get('kemintiriadv').text, 'adv'); eq(ix.info.get('kemintirig2adv').text, 'adv');
  }
});
test('v2.6.143: a precon list and the catalog keep an advanced vampire as its own entry, under the name the importer reads', () => {
  const A = loadClient(CLIENT);
  const sets = { 'Test Set': [{ precon: 'Starter', copies: 1, release_date: '2001-01-01' }] };
  A.processCardData([Object.assign({}, ADV_DB[0], { sets }), Object.assign({}, ADV_DB[1], { sets })], 'test-fixture');
  const pc = A.precons.get('Test Set :: Starter'); assert(pc, 'the precon was built');
  eq(A.catalog.legacy.concat(A.catalog.v5).map(c => c.name).sort().join('|'), 'Alan Sovereign|Alan Sovereign (ADV)', 'the catalog lists both');
  const names = [...pc.crypt.keys()].sort().join('|');
  eq(names, 'Alan Sovereign|Alan Sovereign (ADV)', 'two entries (the bare _name merged them into one before)');
  for (const nm of pc.crypt.keys()) assert(A.cardInfo.get(A.norm(nm)), nm + ' resolves in the same database');
});
test('v2.6.143: the lobby die is a D20 and every roll names its die; a die from the right-click menu lands in the lobby list too', () => {
  const A = loadClient(CLIENT);
  if (!A.rollLine || !A.lobbyRollPush) throw new Error('rollLine / lobbyRollPush not exposed (harness needs updating)');
  eq(A.LOBBY_DIE, 20);
  eq(A.rollLine('Anna', 14, 20), 'Anna rolled <b>14</b> (D20)');
  eq(A.rollLine('<b>x</b>', 3, 6), '&lt;b&gt;x&lt;/b&gt; rolled <b>3</b> (D6)', 'the name is escaped');
  A.net.lobby = false; A.net.rolls = [];
  eq(A.lobbyRollPush('x'), false, 'no lobby: the caller keeps its toast'); eq(A.net.rolls.length, 0);
  A.net.lobby = true;
  A.MP_HANDLERS.roll({ who: 'Anna', n: 14, sides: 20 });
  A.MP_HANDLERS.roll({ who: 'Old', n: 4 });                       // a pre-2.6.143 client's roll carries no sides to an old server -> the server's default
  A.MP_HANDLERS.tool({ kind: 'die', who: 'Erik', n: 12, result: 7 });
  A.MP_HANDLERS.tool({ kind: 'coin', who: 'Erik', result: 'Heads' });
  eq(A.net.rolls.join(' / '), 'Anna rolled <b>14</b> (D20) / Old rolled <b>4</b> (D6) / Erik rolled <b>7</b> (D12)', 'lobby die, legacy die and menu die in one list; a coin is not a roll');
  for (let i = 0; i < 14; i++) A.MP_HANDLERS.tool({ kind: 'die', who: 'E', n: 20, result: i + 1 });
  eq(A.net.rolls.length, 10, 'the list keeps the last ten');
  A.net.lobby = false; A.net.rolls = [];
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("$('#lobRoll').addEventListener('click',()=>mpSend({t:'roll', sides:LOBBY_DIE}));") > 0, 'the button sends the die');
  eq(html.indexOf("mpSend({t:'roll'})"), -1, 'and no caller rolls without one');
  assert(/id="lobRoll"[^>]*>🎲 Roll a D20<\/button>/.test(html), 'the button says which die');
  const srv = require('fs').readFileSync(require('path').join(__dirname, 'elysium-server.js'), 'utf8');
  assert(srv.indexOf("const sides = (m.sides >= 2 && m.sides <= 100) ? (m.sides | 0) : 6;") > 0, 'the server already takes sides (no server change, no wire change)');
});
test('v2.6.143: the dock pin has ONE setter -- the visible button, the background click and every release go through setDockPin', () => {
  const A = loadClient(CLIENT);
  if (!A.setDockPin) throw new Error('setDockPin not exposed (harness needs updating)');
  eq(A.dockPinned, false);
  A.setDockPin(true); eq(A.dockPinned, true);
  A.setDockPin(false); eq(A.dockPinned, false);
  A.setDockPin(true);
  A.__stubEl.classList._t.add('l2dockopen');
  try { A.setL2Dock(false); } finally { A.__stubEl.classList._t.delete('l2dockopen'); }
  eq(A.dockPinned, false, 'a close that executes releases the pin');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(/<div id="l2dockbg"[^\n]*<\/div><\/div>\n\s*<button type="button" id="l2dockPin" aria-pressed="false"/.test(html), 'the button is the PANEL\'s own, right after its background (v2.6.146: the top right corner -- in v2.6.143 it sat inside the Hand box)');
  eq(/id="z-hand">[^\n]*l2dockPin/.test(html), false, 'and it is out of the Hand box');
  assert(html.indexOf('#board.l2dockopen #l2dockPin{ display:inline-flex; }') > 0, 'and shows whenever the dock is open');
  assert(html.indexOf("_pb.addEventListener('click', e=>{ e.stopPropagation(); setDockPin(!dockPinned); });") > 0, 'a click toggles');
  eq((html.match(/dockPinned\s*=\s*(true|false|!!on)/g) || []).join(), 'dockPinned=false,dockPinned=!!on', 'the flag is assigned at its declaration and in the setter only');
  eq((html.match(/classList\.(add|remove|toggle)\('pinned'/g) || []).length, 1, 'and the glowing edge moves in the setter only');
  assert(html.indexOf("#l2dockClose,#l2dockbg,#l2dockPin')) return;") > 0, 'a click on the pin never starts a marquee');
});
/* ---------- v2.6.144: ONE RULE FOR ONE AND FOR MANY ---------- */
test('v2.6.144: a drag into ready shows the same face for one card and for a group -- on the free board an uncontrolled card keeps its face, on a structured board it comes into play face up', () => {
  const A = loadClient(CLIENT);
  if (!A.readyDropFace) throw new Error('readyDropFace not exposed (harness needs updating)');
  const T = A.__stubEl.classList._t; T.delete('l4mode');
  eq(A.readyDropFace({ faceDown: true }, 'uncontrolled'), false, 'structured: uncontrolled -> ready brings the vampire into play');
  eq(A.readyDropFace({ faceDown: true }, 'hand'), false, 'a hand card is played face up');
  eq(A.readyDropFace({ faceDown: true }, 'ready'), true, 'a face-down card already on the felt keeps its face');
  eq(A.readyDropFace({ faceDown: false }, 'torpor'), false); eq(A.readyDropFace({ faceDown: true }, 'torpor'), true);
  T.add('l4mode');
  try {
    eq(A.readyDropFace({ faceDown: true }, 'uncontrolled'), true, 'free board: a drag only repositions -- the card stays face down');
    eq(A.readyDropFace({ faceDown: false }, 'uncontrolled'), false, 'and a card already face up stays up');
    eq(A.readyDropFace({ faceDown: true }, 'hand'), false, 'a hand card is still played face up');
  } finally { T.delete('l4mode'); }
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf('const fd = readyDropFace(c, from);') > 0, 'the single drop asks the rule');
  assert(html.indexOf('const fd = readyDropFace(m.c, m.c.zone);') > 0, 'the group drop asks the SAME rule (it had its own copy, without the free-board exception)');
  eq(html.indexOf("m.c.zone==='uncontrolled' ? false : m.c.faceDown"), -1, 'the copy is gone');
  eq((html.match(/from==='uncontrolled' && !l4on\(\)/g) || []).length, 1, 'the free-board exception is written once');
});
/* ---------- v2.6.145: THE GROUP KNOWS THE ZONES ---------- */
test('v2.6.145: a zone refuses the same cards whether one is moved or many -- torpor and uncontrolled take crypt cards only, the hand takes library cards only', () => {
  const A = loadClient(CLIENT);
  if (!A.zoneRefuses || !A.groupMove) throw new Error('zoneRefuses / groupMove not exposed (harness needs updating)');
  const V = { kind: 'crypt' }, L = { kind: 'lib' };
  eq(A.zoneRefuses(V, 'hand'), true, 'a vampire never goes to the hand'); eq(A.zoneRefuses(L, 'hand'), false);
  eq(A.zoneRefuses(L, 'torpor'), true, 'a library card never goes to torpor'); eq(A.zoneRefuses(V, 'torpor'), false);
  eq(A.zoneRefuses(L, 'uncontrolled'), true); eq(A.zoneRefuses(V, 'uncontrolled'), false);
  for (const z of ['ready', 'ash', 'burned', 'library', 'crypt']) { eq(A.zoneRefuses(V, z), false, z); eq(A.zoneRefuses(L, z), false, z); }
  // the group command, on real cards
  A.clearTable({});
  const v = A.makeCard('Vamp', 'crypt'); A.move(v, 'ready', { x: 50, y: 50, faceDown: false }); v.blood = 3; v.locked = true;
  const l = A.makeCard('Ally', 'lib'); A.move(l, 'ready', { x: 150, y: 50, faceDown: false });
  A.clearSel(); A.addSel([v.id, l.id]); A.groupMove('torpor');
  eq(v.zone, 'torpor', 'the vampire goes'); eq(v.blood, 3, 'with its blood');
  eq(l.zone, 'ready', 'the library card stays where it was (it went to torpor before)');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  eq((html.match(/zoneRefuses\(c,'(hand|torpor|uncontrolled)'\)\)\{ layout\(\); return; \}/g) || []).length, 3, 'the single drag asks the rule for all three zones');
  assert(html.indexOf('if(zoneRefuses(m.c,z)) return;') > 0, 'the group drag asks the same rule (it checked torpor and uncontrolled, never the hand)');
  assert(html.indexOf('!zoneRefuses(c,zone) && move(c,zone)') > 0, 'and so does the group command');
  eq(html.indexOf("if(z==='torpor' && m.c.kind!=='crypt') return;"), -1, 'the partial copy is gone');
});
/* ---------- v2.6.146: THE TABLE IS SET (the suggested table setup; server srv-2.6.44) ---------- */
const DECK146 = (() => { let t = 'Deck Name: T\nCrypt\n'; for (let i = 1; i <= 12; i++) t += '1x Vampire ' + i + '\n'; t += 'Library\n'; for (let i = 1; i <= 60; i++) t += '1x Card ' + i + '\n'; return t; })();
const ROSTER146 = n => ['Johan', 'Anna', 'Erik', 'Maria', 'Olof', 'Sara'].slice(0, n).map((name, i) => ({ seat: i + 1, name }));
function seatBlock146(A, idx, N){                                   // a seat's footprint: its globe (name line + circle) and its four cards
  const G = A.l4SeatGeo(), g = A.l4SeatSpot(idx, N), cards = A.l4CryptSpots(g.x, g.y);
  const xs = [g.x, g.x + G.gw].concat(cards.flatMap(c => [c.x, c.x + G.cw])), ys = [g.y, g.y + G.lbl + G.gw].concat(cards.flatMap(c => [c.y, c.y + G.ch]));
  return { g, cards, left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}
test('v2.6.146: ordinal -- 1st 2nd 3rd 4th, the teens are all th, and 21st starts over', () => {
  if (!API.ordinal) throw new Error('ordinal not exposed (harness needs updating)');
  eq([1, 2, 3, 4, 5, 6, 11, 12, 13, 21, 22, 23, 24, 101, 111, 112].map(API.ordinal).join(' '), '1st 2nd 3rd 4th 5th 6th 11th 12th 13th 21st 22nd 23rd 24th 101st 111th 112th');
});
test('v2.6.146: the seat spots -- for 1 to 6 seats every seat has its own footprint inside the shared table, the order runs clockwise from the top left (top row left to right, lower row right to left), and the lower row ends ABOVE the open hand panel', () => {
  if (!API.l4SeatSpot || !API.l4CryptSpots || !API.pubBox) throw new Error('l4SeatSpot / l4CryptSpots / pubBox not exposed (harness needs updating)');
  const T = API.pubBox(), G = API.l4SeatGeo();
  eq(API.L4_SEAT.lowBottom, 404, 'the lower row\'s cards end at canonical y 404');
  assert(API.L4_SEAT.lowBottom < 410, 'the open hand panel begins at 410-425 on every laptop window measured (14 sizes, card viewer closed; lower with it open) -- a pinned hand must not hide two seats');
  for (let N = 1; N <= 6; N++) {
    const B = [...Array(N).keys()].map(i => seatBlock146(API, i, N)), topN = Math.ceil(N / 2);
    B.forEach((b, i) => {
      assert(b.left >= T.x && b.right <= T.x + T.w + 0.5 && b.top >= T.y && b.bottom <= T.y + T.h, 'N=' + N + ' seat ' + (i + 1) + ' lies inside the table every client shows in full: ' + JSON.stringify([b.left, b.top, b.right, b.bottom]));
      eq(b.cards.length, 4); assert(b.cards.every(c => c.y === b.cards[0].y), 'four cards in one row');
      const mirror = b.g.x > T.x + T.w / 2;
      if (mirror) assert(b.cards.every(c => c.x + G.cw <= b.g.x), 'N=' + N + ' seat ' + (i + 1) + ': on the right half the globe sits on the outside, its cards toward the middle');
      else assert(b.cards.every(c => c.x >= b.g.x + G.gw), 'N=' + N + ' seat ' + (i + 1) + ': cards to the right of the globe');
      if (i >= topN) eq(b.cards[0].y + G.ch, 404, 'N=' + N + ' seat ' + (i + 1) + ': a lower-row card ends at 404');
      else eq(b.g.y, 25, 'N=' + N + ' seat ' + (i + 1) + ': the top row is at the top edge again (v2.6.150; v2.6.149 had it at y 132 under the Played tray, which no longer opens by itself)');
    });
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++)
      assert(B[i].right + 8 <= B[j].left || B[j].right + 8 <= B[i].left || B[i].bottom + 8 <= B[j].top || B[j].bottom + 8 <= B[i].top, 'N=' + N + ': seats ' + (i + 1) + ' and ' + (j + 1) + ' do not touch');
    for (let i = 1; i < topN; i++) assert(B[i].g.x > B[i - 1].g.x, 'N=' + N + ': the top row runs left to right');
    for (let i = topN + 1; i < N; i++) assert(B[i].g.x < B[i - 1].g.x, 'N=' + N + ': the lower row runs right to left, so the seats go clockwise');
  }
  eq(JSON.stringify([0, 1, 2, 3, 4].map(i => { const g = API.l4SeatSpot(i, 5); return [g.x, g.y]; })), '[[26,25],[385,25],[933,25],[933,341],[26,341]]', 'five seats: top left, top centre, top right, lower right, lower left -- the layout a Lackey table uses');
  eq(JSON.stringify(API.l4CryptSpots(26, 25).map(c => c.x)), '[81,127,173,219]'); eq(JSON.stringify(API.l4CryptSpots(933, 25).map(c => c.x)), '[743,789,835,881]');
  eq(JSON.stringify([0, 1, 2, 3].map(i => API.l4SeatSpot(i, 4).x)), '[26,933,933,26]', 'four seats: the corners');
  eq(JSON.stringify([0, 1].map(i => { const g = API.l4SeatSpot(i, 2); return [g.x, g.y]; })), '[[385,25],[385,341]]', 'two seats face each other');
  // a globe the player has moved: the cards follow it, on the side where they fit, and never leave the table
  const far = API.l4CryptSpots(960, 500); assert(far.every(c => c.x + G.cw <= 960 && c.x >= T.x), 'near the right edge the cards go to the left'); assert(far[0].y + G.ch <= T.y + T.h, 'and are clamped onto the table');
  const mid = API.l4CryptSpots(500, 250); assert(mid.every(c => c.x >= 500 + G.gw), 'in the middle they go to the right');
});
test('v2.6.153: the Table layout is the ROOM\'s -- Large cards (srv-2.6.46 tableLayout) draws the free board\'s cards at 0.6 and puts the lower row at y 508, the top row 8 px lower, for everyone; Standard, a Structured table and an absent value keep 0.5 and the old spots; the personal table edge (conv.handRim) changes neither', () => {
  const API = loadClient(CLIENT);
  if (!API.tableLarge || !API.tableLayoutSync || !API.rimGeo) throw new Error('tableLarge / tableLayoutSync / rimGeo not exposed (harness needs updating)');
  eq(API.conv.handRim, 'dock', 'the edge is off by default'); eq(API.L4_SEAT.largeBottom, 508); eq(API.L4_SEAT.largeTop, 8);
  API.net.boardMode = 'classic'; API.net.tableLayout = '';
  eq(API.tableLarge(), false); API.tableLayoutSync(false); eq(API.L4_CARD_S, 0.5);
  eq(API.l4SeatSpot(4, 5).y, 341, 'standard: the old lower spot'); eq(API.l4SeatSpot(0, 5).y, 25);
  API.conv.handRim = 'rim';
  eq(API.tableLarge(), false, 'the personal edge does not make a Large table'); eq(API.l4SeatSpot(4, 5).y, 341, 'and does not move the rows (v2.6.152 did)');
  API.net.tableLayout = 'large';
  eq(API.tableLarge(), true); eq(API.tableLayoutSync(false), true, 'the size changed'); eq(API.L4_CARD_S, 0.6, 'cards a fifth larger');
  const G = API.l4SeatGeo();
  eq(Math.round(API.l4SeatSpot(4, 5).y + G.dy + G.ch), 508, 'large: a lower-row card ends at 508');
  eq(API.l4SeatSpot(0, 5).y, 33, 'large: the top row at y 33'); eq(API.l4SeatSpot(0, 5).x, 7, 'v2.6.155: the corner seats 19 px further out'); eq(API.l4SeatSpot(3, 5).x, 952, 'on both sides');
  eq(Math.round(API.pubBox().w), 1010, 'the Large box is 2 x 19 wider (972 + 38)');
  eq(JSON.stringify([0, 1, 2, 3, 4].map(i => { const g = API.l4SeatSpot(i, 5); return [g.x, g.y]; })), '[[7,33],[368,33],[952,33],[952,439],[7,439]]', 'five seats at a Large table, as REPLY-to-bot-2026-10-14-table-layout.md \u00a72 states them'); eq(Math.round(API.l4SeatSpot(1, 5).x + (API.l4SeatGeo().blockW) / 2), 502, 'the centre seat stays in the middle');
  API.conv.handRim = 'dock'; eq(API.l4SeatSpot(4, 5).y + 0, API.l4SeatSpot(4, 5).y, 'the dock choice does not matter either'); eq(API.L4_CARD_S, 0.6);
  API.net.boardMode = 'structured';
  eq(API.tableLarge(), false, 'a Structured table is never Large'); API.tableLayoutSync(false); eq(API.L4_CARD_S, 0.5); eq(API.l4SeatSpot(4, 5).y, 341);
  API.net.boardMode = 'classic'; API.net.tableLayout = ''; API.tableLayoutSync(false); eq(API.L4_CARD_S, 0.5, 'back to standard');
  const g = API.rimGeo();
  assert(g.hand.w > 3 * g.pw, 'the hand pocket is the widest');
  assert(g.crypt.x < g.library.x && g.library.x + g.pw <= g.hand.x && g.hand.x + g.hand.w <= g.ash.x && g.ash.x + g.pw <= g.pool.x, 'crypt, library, hand, ash heap, pool globe from left to right');
  assert(g.pool.x + g.pool.w <= g.W - 34, 'the pool pocket stays clear of the corner buttons');
  assert(g.raised < g.crypt.tuck && g.hand.tuck < g.crypt.tuck, 'raised is higher than tucked; the hand shows a taller strip (its titles)');
});
test('v2.6.153: the Table layout on the wire -- joined, started and took set it (an absent value in took keeps the room\'s), a Structured room is never Large, the host whose server dropped the field is told; the create dialog sends it only for a Classic room', () => {
  const A = loadClient(CLIENT);
  A.MP_HANDLERS.joined({ room: 'R', token: 't', you: 'Anna', seat: 1, players: ROSTER146(2), boardMode: 'classic', tableLayout: 'large', lobby: true });
  eq(A.net.tableLayout, 'large', 'joined sets it'); eq(A.L4_CARD_S, 0.6, 'and the card size with it');
  A.MP_HANDLERS.took({ seat: 1, lib: 0, crypt: 0, loaded: 'sv' });
  eq(A.net.tableLayout, 'large', 'a took without it keeps the room\'s');
  A.MP_HANDLERS.started({ players: ROSTER146(2), turn: 1, boardMode: 'classic' });
  eq(A.net.tableLayout, '', 'started without it: standard'); eq(A.L4_CARD_S, 0.5);
  A.MP_HANDLERS.started({ players: ROSTER146(2), turn: 1, boardMode: 'classic', tableLayout: 'large' });
  eq(A.net.tableLayout, 'large'); eq(A.L4_CARD_S, 0.6);
  A.MP_HANDLERS.started({ players: ROSTER146(2), turn: 1, boardMode: 'structured', tableLayout: 'large' });
  eq(A.L4_CARD_S, 0.5, 'a Structured room is never Large');
  A.MP_HANDLERS.joined({ room: 'R', token: 't', you: 'Anna', seat: 1, players: ROSTER146(2), boardMode: 'classic', tableLayout: 'huge', lobby: true });
  eq(A.net.tableLayout, '', 'an unknown value is standard');
  const B = loadClient(CLIENT), ringB = () => { const r = (typeof B.errRing === 'function') ? B.errRing() : B.errRing; return (r || []).map(e => e.m).join('\n'); };
  B.net._createLayout = true;
  B.MP_HANDLERS.joined({ room: 'R', token: 't', you: 'Anna', seat: 1, players: ROSTER146(1), boardMode: 'classic', lobby: true });   // an older server: the field is gone
  eq(B.net.tableLayout, ''); eq(B.net._createLayout, false, 'asked once');
  assert(/does not know the table layout yet/.test(ringB()), 'the host is told: ' + ringB().slice(-200));
  eq(B.net._layoutMissed, true, 'and it is remembered for the deal');
  B.net.ws = { readyState: 1, send(){} }; B.net.status = 'in';
  B.MP_HANDLERS.dealt({ deckName: 'D', hand: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], unc: [], lib: 53, crypt: 12 });
  eq((ringB().match(/does not know the table layout yet/g) || []).length, 2, 'said again after the deal line (the deal clears the log)'); eq(B.net._layoutMissed, false, 'once');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("net._createLayout = ($('#mpBoard').value==='classic') && !!($('#mpLayout') && $('#mpLayout').value==='large');") > 0, 'create reads the select, for a Classic room only');
  assert(html.indexOf("tableLayout:net._createLayout?'large':undefined,") > 0, 'and sends the field only when it is Large -- an old server sees the create it always saw');
  assert(/id="mpSetupDesc">[^\n]*\n\s*<div class="mpfield mpCreateOnly mpGs mpFull" id="mpLayoutRow">/.test(html), 'the Table layout row follows the setup\'s description (the dialog pairs a row with its description)');
});
test('v2.6.154: the hand\'s pin on the table edge pins the hand only -- a second click releases it; the other pockets are untouched', () => {
  const A = loadClient(CLIENT);
  if (!A.rimIsUp || !A.rimPinToggle) throw new Error('rimIsUp / rimPinToggle not exposed (harness needs updating)');
  eq(A.rimIsUp('hand'), false); A.rimPinToggle(); eq(A.rimIsUp('hand'), true, 'pinned up');
  eq(A.rimIsUp('library'), false); eq(A.rimIsUp('pool'), false, 'only the hand');
  A.rimPinToggle(); eq(A.rimIsUp('hand'), false, 'released');
});
test('v2.6.153: Play offline hands the Table layout to the table before the deal -- a Large Classic hotseat with the setup lays every seat\'s four cards at the Large spots (0.6 apart), and its globes start on the Large rows', () => {
  const A = loadClient(CLIENT);
  if (!A.startHotseat) throw new Error('startHotseat not exposed (harness needs updating)');
  A.startHotseat([{ name: 'You', deckText: DECK146 }, { name: 'Erik', deckText: DECK146 }, { name: 'Anna', deckText: DECK146 }, { name: 'Sara', deckText: DECK146 }, { name: 'Nils', deckText: DECK146 }], 'classic', { tableSetup: true, tableLayout: 'large' });
  eq(A.net.tableLayout, 'large'); eq(A.L4_CARD_S, 0.6);
  const unc = A.state.zones.uncontrolled.map(id => A.state.cards.get(id)).sort((a, b) => a.x - b.x);
  eq(unc.length, 4, 'four setup cards for the seat in front of the screen');
  const g = A.l4SeatSpot(0, 5), spots = A.l4CryptSpots(g.x, g.y);
  eq(JSON.stringify(unc.map(c => [c.x, c.y])), JSON.stringify(spots.map(p => [p.x, p.y])), 'at the Large spots');
  eq(spots[1].x - spots[0].x, Math.round(84 * 0.6 + 4), 'a Large card plus the 4 px gap apart');
  const B = loadClient(CLIENT);
  B.startHotseat([{ name: 'You', deckText: DECK146 }, { name: 'Erik', deckText: DECK146 }], 'classic', { tableSetup: true });
  eq(B.net.tableLayout, '', 'no layout given: standard'); eq(B.L4_CARD_S, 0.5);
  const C = loadClient(CLIENT);
  C.startHotseat([{ name: 'You', deckText: DECK146 }, { name: 'Erik', deckText: DECK146 }], 'structured', { tableSetup: true, tableLayout: 'large' });
  eq(C.net.tableLayout, '', 'a Structured table ignores it'); eq(C.L4_CARD_S, 0.5);
});
test('v2.6.146: tableSetupOn -- a Classic table with the option; never a Structured one; never a table with a seated bot (bots camp by their own pattern); a vacant bot seat does not count', () => {
  const A = loadClient(CLIENT);
  if (!A.tableSetupOn) throw new Error('tableSetupOn not exposed (harness needs updating)');
  A.net.roster = ROSTER146(3);
  A.net.boardMode = 'classic'; A.net.tableSetup = false; eq(A.tableSetupOn(), false, 'the option is off');
  A.net.tableSetup = true; eq(A.tableSetupOn(), true, 'Classic + option');
  A.net.boardMode = 'structured'; eq(A.tableSetupOn(), false, 'a Structured table has its own zones');
  A.net.boardMode = 'classic'; A.net.roster[1].bot = true; eq(A.tableSetupOn(), false, 'a bot is seated');
  A.net.roster[1].vacant = true; eq(A.tableSetupOn(), true, 'the bot left');
});
test('v2.6.146: online, the deal on a Classic table with the option asks for the first four crypt cards with the ORDINARY verb and lays the answers face down beside the globe; the deal line says so once, and a card drawn later is an ordinary draw', () => {
  const A = loadClient(CLIENT), sent = [];
  A.net.ws = { readyState: 1, send: j => sent.push(JSON.parse(j)) }; A.net.status = 'in'; A.net.you = 'Anna';
  A.net.roster = ROSTER146(5); A.net.boardMode = 'classic'; A.net.tableSetup = true;
  A.MP_HANDLERS.dealt({ deckName: 'D', hand: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], unc: [], lib: 53, crypt: 12 });
  eq(JSON.stringify(sent.filter(m => m.t === 'drawCrypt')), JSON.stringify([{ t: 'drawCrypt' }, { t: 'drawCrypt' }, { t: 'drawCrypt' }, { t: 'drawCrypt' }]), 'four bare drawCrypt verbs -- exactly what four double-clicks on the crypt send');
  const line = sent.find(m => m.t === 'log' && /New deal/.test(m.html)); assert(line, 'the deal line went out');
  assert(/4 crypt cards were placed face down beside the pool\./.test(line.html), 'it announces the setup: ' + line.html);
  assert(/crypt: 8 remain/.test(line.html), 'and counts the crypt AFTER it');
  const spots = A.l4SetupSpots(2);
  eq(JSON.stringify(spots), JSON.stringify(A.l4CryptSpots(385, 25)), 'seat 2 of 5 sits top centre');
  for (let i = 0; i < 4; i++) A.MP_HANDLERS.drew({ zone: 'uncontrolled', kind: 'crypt', name: 'V' + i, lib: 53, crypt: 11 - i });
  const unc = () => A.state.zones.uncontrolled.map(id => A.state.cards.get(id));
  eq(unc().length, 4);
  unc().forEach((c, i) => { eq(c.x, spots[i].x, 'card ' + i + ' x'); eq(c.y, spots[i].y, 'card ' + i + ' y'); eq(c.faceDown, true, 'face down'); });
  eq(A.state.cryptDrawHistory.length, 4, 'they are draws -- Undo last draw takes them back, as after a hand-made setup');
  eq(sent.filter(m => m.t === 'log' && /Drew/.test(m.html)).length, 0, 'no per-card line: five players would open with twenty of them');
  A.MP_HANDLERS.drew({ zone: 'uncontrolled', kind: 'crypt', name: 'V4', lib: 53, crypt: 7 });
  const fifth = unc()[4]; assert(!spots.some(sp => sp.x === fifth.x && sp.y === fifth.y), 'the fifth card is not a setup card');
  eq(sent.filter(m => m.t === 'log' && /Drew <b>1 crypt card<\/b>/.test(m.html)).length, 1, 'and it logs like any draw');
  eq(sent.filter(m => m.t === 'drawCrypt').length, 4, 'the client asked exactly four times');
});
test('v2.6.146: no setup draws without the option, on a Structured table, or beside a bot; a short crypt gives what it has; a fetched card is never mistaken for a setup card', () => {
  const run = (cfg, crypt) => { const A = loadClient(CLIENT), sent = [];
    A.net.ws = { readyState: 1, send: j => sent.push(JSON.parse(j)) }; A.net.status = 'in'; A.net.you = 'Anna';
    A.net.roster = ROSTER146(4); Object.assign(A.net, cfg.net); if (cfg.bot) A.net.roster[2].bot = true;
    A.MP_HANDLERS.dealt({ deckName: 'D', hand: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], unc: cfg.unc || [], lib: 53, crypt });
    return { A, sent, draws: sent.filter(m => m.t === 'drawCrypt').length, line: (sent.find(m => m.t === 'log' && /New deal/.test(m.html)) || {}).html || '' }; };
  let r = run({ net: { boardMode: 'classic', tableSetup: false } }, 12);
  eq(r.draws, 0, 'option off: nothing asked'); assert(/draw crypt cards manually from the dock/.test(r.line), 'and the old deal line, word for word'); assert(/crypt: 12 remain/.test(r.line));
  r.A.MP_HANDLERS.drew({ zone: 'uncontrolled', kind: 'crypt', name: 'V', lib: 53, crypt: 11 });
  eq(r.sent.filter(m => m.t === 'log' && /Drew <b>1 crypt card<\/b>/.test(m.html)).length, 1, 'a hand-made draw logs as it always did');
  r = run({ net: { boardMode: 'structured', tableSetup: true }, unc: ['V1', 'V2', 'V3', 'V4'] }, 8);
  eq(r.draws, 0, 'Structured: the server dealt the four'); assert(/and 4 uncontrolled crypt cards/.test(r.line)); eq(r.A.state.zones.uncontrolled.length, 4);
  r = run({ net: { boardMode: 'classic', tableSetup: true }, bot: true }, 12);
  eq(r.draws, 0, 'a bot at the table: the hand-made setup');
  r = run({ net: { boardMode: 'classic', tableSetup: true } }, 2);
  eq(r.draws, 2, 'a crypt of two gives two'); assert(/2 crypt cards were placed/.test(r.line)); assert(/crypt: 0 remain/.test(r.line));
  r = run({ net: { boardMode: 'classic', tableSetup: true } }, 12);
  r.A.MP_HANDLERS.drew({ zone: 'uncontrolled', kind: 'crypt', name: 'Fetched', took: true, pile: 'crypt', lib: 53, crypt: 11 });
  eq(r.A.net.setupSpots.length, 4, 'a card fetched by a search keeps out of the setup spots');
});
test('v2.6.146: offline, every seat of a Classic hotseat table with the option starts with four crypt cards face down beside ITS spot -- on every seat\'s own board and in what the others see; without the option none; a Structured table deals its four into the zone as before', () => {
  const start = (mode, opts, n) => { const A = loadClient(CLIENT); A.startHotseat(ROSTER146(n || 4).map(p => ({ name: p.name, deckText: DECK146 })), mode, opts); return A; };
  const uncOf = (A, seat) => (JSON.parse(A.net.hot.boards[seat]).cards || []).filter(c => c.zone === 'uncontrolled');
  let A = start('classic', { tableSetup: true });
  eq(A.net.tableSetup, true); eq(A.tableSetupOn(), true);
  for (let seat = 1; seat <= 4; seat++) {
    const g = A.l4SeatSpot(seat - 1, 4), spots = A.l4CryptSpots(g.x, g.y), u = uncOf(A, seat);
    eq(u.length, 4, 'seat ' + seat + ' has four (the first build dealt NONE: an else that belonged to the loop\'s inner if)');
    u.sort((p, q) => p.x - q.x);                                  // the saved board lists cards by id, not by the order they were laid out
    u.forEach((c, i) => { eq(c.x, spots[i].x, 'seat ' + seat + ' card ' + i + ' x'); eq(c.y, spots[i].y, 'seat ' + seat + ' card ' + i + ' y'); eq(c.faceDown, true); });
    eq(JSON.parse(A.net.hot.boards[seat]).cards.filter(c => c.zone === 'crypt').length, 8, 'and eight left in the crypt');
    eq(JSON.parse(A.net.hot.boards[seat]).cards.filter(c => c.zone === 'hand').length, 7);
  }
  const pub3 = A.net.boards[3].pub.cards.filter(c => c.zone === 'uncontrolled'), g3 = A.l4SeatSpot(2, 4);
  eq(JSON.stringify(pub3.map(c => [c.x, c.y]).sort((p, q) => p[0] - q[0])), JSON.stringify(A.l4CryptSpots(g3.x, g3.y).map(c => [c.x, c.y])), 'seat 3 as the others see it: four cards beside its globe');
  assert(pub3.every(c => c.faceDown === true), 'face down');
  A = start('classic', { tableSetup: false });
  eq(A.tableSetupOn(), false); eq(uncOf(A, 1).length, 0, 'option off: the hand-made setup, as before'); eq(uncOf(A, 2).length, 0);
  A = start('classic');                                           // the tutorials and every other caller pass no options
  eq(A.net.tableSetup, false, 'no options = off (the tutorials teach the hand-made setup)'); eq(uncOf(A, 1).length, 0);
  A = start('structured', { tableSetup: true });
  eq(A.net.tableSetup, false, 'the option is Classic-only'); eq(uncOf(A, 1).length, 4, 'a Structured table still deals four into the uncontrolled zone'); eq(uncOf(A, 3).length, 4);
  A.leaveHotseat(); eq(A.net.tableSetup, false, 'and nothing rides out of the table');
});
test('v2.6.146: the globes START at the seat spots with the option (and on the old ring without it); a globe the player moved keeps its place; a new deal lays the cards beside where the globe is NOW', () => {
  const A = loadClient(CLIENT);
  if (!A.renderL4Globes || !A.l4Globes) throw new Error('renderL4Globes / l4Globes not exposed (harness needs updating)');
  A.localTable = true; A.net.you = 'Johan'; A.net.roster = ROSTER146(5); A.net.boardMode = 'classic';
  A.net.tableSetup = false; A.renderL4Globes();
  eq(JSON.stringify([...A.l4Globes.values()].map(g => [g.x, g.y])), '[[470,58],[622,169],[564,347],[376,347],[318,169]]', 'without the option: the ring in the middle, exactly as before');
  A.l4Globes.clear(); A.net.tableSetup = true; A.renderL4Globes();
  eq(JSON.stringify([...A.l4Globes.values()].map(g => [g.x, g.y])), '[[26,25],[385,25],[933,25],[933,341],[26,341]]', 'with it: each seat at its spot');
  A.l4Globes.get(1).x = 500; A.l4Globes.get(1).y = 250; A.renderL4Globes();
  eq(JSON.stringify([A.l4Globes.get(1).x, A.l4Globes.get(1).y]), '[500,250]', 'a moved globe is not pulled back by a re-render');
  eq(JSON.stringify(A.l4SetupSpots(1)), JSON.stringify(A.l4CryptSpots(500, 250)), 'and the next deal\'s cards follow it');
  eq(JSON.stringify(A.l4SetupSpots(4)), JSON.stringify(A.l4CryptSpots(933, 341)), 'an untouched seat keeps its spot');
  A.net.roster[2].vacant = true; A.l4Globes.clear(); A.renderL4Globes();
  eq(JSON.stringify([A.l4Globes.get(4).x, A.l4Globes.get(4).y]), '[933,341]', 'an ousted seat moves nobody: a spot depends on the seat number and the table size only');
  eq(A.l4Globes.has(3), false, 'the vacant seat has no globe');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("if(!l4hintDone && !_setup){") > 0, 'no "drag your pool globe to your seat" hint when the globe already is there');
  assert(html.indexOf(`'<div class="l4gseat">\\u{1FA91}\\u00a0'+ordinal(glob.seat)+'</div>'`) > 0 && html.indexOf("sc.textContent='\\u{1FA91}\\u00a0'+ordinal(glob.seat);") > 0, 'v2.6.150: the chair and the ordinal sit in their own line UNDER the globe, written by the first build and the repaint alike; the name line holds the name alone');
  eq(/<div class="l4glabel">[^\n]*l4gseat/.test(html), false, 'and no longer inside the name line');
});
test('v2.6.146: the option on the wire -- joined and started set it, took keeps the room\'s board style when its message carries none (loadMatch on a server before srv-2.6.44), and a host whose server dropped the field is told', () => {
  const A = loadClient(CLIENT);
  const ring = () => { const r = (typeof A.errRing === 'function') ? A.errRing() : A.errRing; return (r || []).map(e => e.m).join('\n'); };
  A.MP_HANDLERS.joined({ room: 'R', token: 't', you: 'Anna', seat: 1, players: ROSTER146(2), boardMode: 'classic', tableSetup: true, lobby: true });
  eq(A.net.tableSetup, true, 'joined sets it'); eq(A.net.boardMode, 'classic');
  A.MP_HANDLERS.took({ seat: 1, lib: 0, crypt: 0, loaded: 'sv' });
  eq(A.net.boardMode, 'classic', 'a took without boardMode keeps the room\'s (it flipped the host of a Classic room to Structured)'); eq(A.net.tableSetup, true, 'and the option');
  A.MP_HANDLERS.took({ seat: 1, lib: 0, crypt: 0, boardMode: 'structured' });
  eq(A.net.boardMode, 'structured', 'a took that names one is obeyed');
  A.MP_HANDLERS.started({ players: ROSTER146(2), turn: 1, boardMode: 'classic', tableSetup: true });
  eq(A.net.tableSetup, true, 'started sets it');
  A.MP_HANDLERS.started({ players: ROSTER146(2), turn: 1, boardMode: 'classic' });
  eq(A.net.tableSetup, false, 'and clears it when the room has none');
  const B = loadClient(CLIENT), ringB = () => { const r = (typeof B.errRing === 'function') ? B.errRing() : B.errRing; return (r || []).map(e => e.m).join('\n'); };
  B.net._createSetup = true;
  B.MP_HANDLERS.joined({ room: 'R', token: 't', you: 'Anna', seat: 1, players: ROSTER146(1), boardMode: 'classic', lobby: true });   // an older server: the field is gone
  eq(B.net.tableSetup, false); eq(B.net._createSetup, false, 'asked once');
  assert(/does not know the suggested table setup yet/.test(ringB()), 'the host is told, instead of a silent table without it: ' + ringB().slice(-200));
  eq(B.net._setupMissed, true, 'and it is remembered for the deal');
  B.net.ws = { readyState: 1, send(){} }; B.net.status = 'in';
  B.MP_HANDLERS.dealt({ deckName: 'D', hand: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], unc: [], lib: 53, crypt: 12 });
  eq((ringB().match(/does not know the suggested table setup yet/g) || []).length, 2, 'said again after the deal line -- the deal clears the log, and the lobby covered the first one');
  eq(B.net._setupMissed, false, 'once');
  const C = loadClient(CLIENT), ringC = () => { const r = (typeof C.errRing === 'function') ? C.errRing() : C.errRing; return (r || []).map(e => e.m).join('\n'); };
  C.net.ws = { readyState: 1, send(){} }; C.net.status = 'in'; C.net.you = 'Anna'; C.net.roster = ROSTER146(3); C.net.roster[2].bot = true; C.net.boardMode = 'classic'; C.net.tableSetup = true;
  C.MP_HANDLERS.dealt({ deckName: 'D', hand: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], unc: [], lib: 53, crypt: 12 });
  assert(/skipped at a table with bots/.test(ringC()), 'a table with a bot says why there is no setup, after the deal line');
  assert(!/does not know the suggested table setup/.test(ring()), 'a server that took it says nothing');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("net._createSetup = ($('#mpBoard').value==='classic') && !!($('#mpSetup') && $('#mpSetup').checked);") > 0, 'create reads the box, for a Classic room only');
  assert(html.indexOf("tableSetup:net._createSetup||undefined,") > 0, 'and sends the field only when it is set -- an old server sees the create it always saw');
  assert(/<label class="mpcheck mpCreateOnly mpGs" id="mpSetupRow"><input type="checkbox" id="mpSetup" checked> Suggested table setup<\/label>/.test(html), 'Game settings carries the box, ticked, in Lite too (no mpFull)');
  assert(/<input type="checkbox" id="offSetup" checked> Suggested table setup<\/label>/.test(html), 'and Play offline');
  assert(html.indexOf("startHotseat(players, boardMode, { tableSetup: !!($('#offSetup') && $('#offSetup').checked), tableLayout:") > 0, 'which hands it to the table (v2.6.153: beside the Table layout)');
  assert(html.indexOf("tableSetup: B._tableSetup || undefined,") > 0, 'the hotseat bridge tells its bots what the server would');
  assert(html.indexOf("#mpSetupRow{grid-column:auto}") > 0, 'the row takes ONE cell of the dialog\'s two-column grid, its description the other (a bare .mpcheck spans both, and the description then pushed every later row out of step)');
  assert(/board\.disabled=false; helpers\.disabled=false;\n  \}\n  tableSetupSync\(\);/.test(html), 'a bot seat forces Structured in code (no change event) -- the box is greyed with it');
  assert(html.indexOf("['mpBoard','offBoard'].forEach(id=>{ const e=$('#'+id); if(e) e.addEventListener('change', tableSetupSync); });") > 0, 'both board-style selects grey their box');
});
test('v2.6.146: the pin button is the panel\'s own corner and the pinned edge is calm', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("#l2dockPin{ display:none; position:absolute; right:12px; bottom:calc(1.5% + (var(--ch) + 34px) * var(--dock-s) + 14px - 17px); z-index:4610;") > 0, 'top right corner, inside the 14px strip above the dock\'s boxes');
  eq((html.match(/height:calc\(1\.5% \+ \(var\(--ch\) \+ 34px\) \* var\(--dock-s\) \+ 14px\)/g) || []).length, 2, 'the same height formula the panel\'s two background rules use -- if they change, the button must follow');
  assert(/#board\.l2dockopen #z-pool\{[^}]*z-index:4600;/.test(html), 'the dock\'s boxes sit at 4600; the button at 4610 is above them and stays clickable');
  assert(html.indexOf("#l2dockbg.pinned{ box-shadow:0 -2px 8px rgba(232,201,106,.12), inset 0 1px 0 rgba(232,201,106,.42); }") > 0, 'a thin line and a faint light (it was a 16px glow at .45 and a 2px line at .6)');
  assert(html.indexOf("_pb.title=dockPinned?'Pinned':'Not pinned';") > 0, 'v2.6.147: the button says nothing itself -- the words (Pinned / Not pinned) are its tooltip');
  const A = loadClient(CLIENT); A.setDockPin(true); eq(A.dockPinned, true); A.setDockPin(false); eq(A.dockPinned, false);
});
test('v2.6.148: a spectator sends no board and no log line -- the refused push was logged, and the log line scheduled the next push', () => {
  const A = loadClient(CLIENT), sent = [];
  A.net.ws = { readyState: 1, send: j => sent.push(JSON.parse(j)) }; A.net.status = 'in'; A.net.you = 'Titta'; A.net.roster = ROSTER146(2);
  A.net.spect = true;
  A.pushNow(); A.mpRelay('<b>x</b>'); A.MP_HANDLERS.err({ msg: 'Spectators can only chat.' });
  eq(sent.length, 0, 'nothing leaves a watching client: ' + JSON.stringify(sent));
  A.net.spect = false;
  A.pushNow(); A.mpRelay('<b>x</b>');
  eq(sent.map(m => m.t).join(), 'board,log', 'a player still pushes and relays');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("pushTimer=setTimeout(()=>{ if(inRoom() && !net.spect && net.ws") > 0, 'the debounced push checks again when it FIRES -- one scheduled before the client knew it was watching still went out');
  assert(/function schedulePush\(\)\{[\s\S]{0,400}\n  if\(net\.spect\) return;/.test(html), 'and schedulePush stops before arming the timer');
});
test('v2.6.148: arriving at a running game -- a watcher is "watching" only once the game runs, lands on the felt of a free board and on the turn-holder\'s seat of a Structured table; a player lands at home; the welcome layer stays off a watched table', () => {
  const A = loadClient(CLIENT);
  A.net.status = 'in'; A.net.you = 'Titta'; A.net.roster = ROSTER146(3); A.net.spect = true;
  A.net.lobby = true; eq(A.mpWatching(), false, 'not in the lobby');
  A.net.lobby = false; eq(A.mpWatching(), true);
  A.net.boardMode = 'classic'; eq(A.mpLandView(), 'l4', 'the shared felt');
  A.net.boardMode = 'structured'; A.net.turnSeat = 2; eq(A.mpLandView(), 2, 'the seat whose turn it is');
  A.net.turnSeat = null; eq(A.mpLandView(), 1, 'no turn known: the first seat');
  A.net.roster[0].out = true; eq(A.mpLandView(), 2, 'an ousted seat is passed over');
  A.net.roster[0].out = false; A.net.roster[0].vacant = true; A.net.turnSeat = 1; eq(A.mpLandView(), 2, 'and a vacant one');
  A.net.spect = false; A.net.you = 'Johan'; eq(A.mpLandView(), 'l2', 'a player: the home view'); eq(A.mpWatching(), false);
  A.net.status = 'off'; A.net.spect = true; eq(A.mpWatching(), false, 'not without a room');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("$('#empty').style.display = (state.cards.size || _watching) ? 'none' : 'grid';") > 0, 'the welcome layer');
  assert(html.indexOf("if(was!=='re') mpLandAtTable();") > 0, 'joined goes to the table -- but an automatic reconnect keeps the view the player had');
  assert(/if\(!net\.spect\) schedulePush\(\);\n    mpLandAtTable\(\);/.test(html), 'started takes a spectator along too');
  assert(html.indexOf("function goHome(){ switchView(mpWatching() ? mpLandView() : baseView());") > 0, 'Esc / Home lead a watcher to the same place');
  assert(html.indexOf("if(typeof v==='number' && net.view!=='l2') switchView(baseView());") > 0, 'a seat visit is entered through the home frame (from the start view it drew bare felt)');
  assert(html.indexOf("if(shownModal()==='mpModal') closeOverlay();") > 0, 'and the Join dialog closes');
});
test('v2.6.148: restoring from the table snapshot on a free-board table keeps every published position; a Structured table restores as before', () => {
  const A = loadClient(CLIENT);
  const pub = { bw: 1004, bh: 616, pool: 27, cards: [
    { id: 'a', name: 'V1', kind: 'crypt', zone: 'ready', x: 602, y: 150, faceDown: true },
    { id: 'b', name: 'V2', kind: 'crypt', zone: 'uncontrolled', x: 486, y: 29, faceDown: true },
    { id: 'c', name: 'V3', kind: 'crypt', zone: 'torpor', x: 700, y: 400 },
    { id: 'd', name: 'L1', kind: 'lib', zone: 'ash' } ] };
  A.net.status = 'in'; A.net.you = 'Johan'; A.net.roster = ROSTER146(2); A.net.boardMode = 'classic';
  A.restoreFromPub(pub);
  const by = n => [...A.state.cards.values()].find(c => c.name === n);
  eq(JSON.stringify([by('V1').x, by('V1').y]), '[602,150]', 'ready: as published (it was rescaled by the live board)');
  eq(JSON.stringify([by('V2').x, by('V2').y, by('V2').faceDown]), '[486,29,true]', 'uncontrolled keeps its place and its back (it fell to the centre row)');
  eq(JSON.stringify([by('V3').x, by('V3').y]), '[700,400]', 'torpor too');
  eq(A.state.pool, 27);
  const B = loadClient(CLIENT);
  B.net.status = 'in'; B.net.you = 'Johan'; B.net.roster = ROSTER146(2); B.net.boardMode = 'structured';
  B.restoreFromPub(pub);
  const u = [...B.state.cards.values()].find(c => c.name === 'V2');
  eq(JSON.stringify([u.x, u.y]), '[0,0]', 'Structured: zone-laid cards carry no position, as before');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("if(pc.zone==='ready' && !_fb){") > 0, 'the old scaling stays for the Structured layout only');
});
test('v2.6.148: a reload keeps the own pool globe -- joined reads its place from the server\'s copy of the board, and a new match forgets it', () => {
  const A = loadClient(CLIENT);
  A.net.ws = { readyState: 1, send(){} };
  const J = extra => Object.assign({ room: 'r', token: 't', you: 'Johan', seat: 1, players: ROSTER146(5), boardMode: 'classic', tableSetup: true, lobby: false, srv: '2.6.44' }, extra);
  A.MP_HANDLERS.joined(J({ myPub: { cards: [], tokens: [{ type: 'edge', x: 1, y: 2 }, { type: 'pool', x: 520, y: 126 }] } }));
  eq(JSON.stringify(A.net._myGlobeAt), '{"x":520,"y":126}');
  A.l4Globes.clear(); A.renderL4Globes();
  eq(JSON.stringify([A.l4Globes.get(1).x, A.l4Globes.get(1).y]), '[520,126]', 'my globe: where the server last saw it');
  eq(JSON.stringify([A.l4Globes.get(2).x, A.l4Globes.get(2).y]), '[385,25]', 'the others: their seat spots until their boards arrive');
  A.MP_HANDLERS.joined(J({ myPub: { cards: [] } })); eq(A.net._myGlobeAt, null, 'no token, nothing remembered');
  A.MP_HANDLERS.joined(J({ spect: true, myPub: { cards: [], tokens: [{ type: 'pool', x: 5, y: 5 }] } })); eq(A.net._myGlobeAt, null, 'a spectator has no globe');
  A.net._myGlobeAt = { x: 1, y: 1 }; A.MP_HANDLERS.started({ players: ROSTER146(5), turn: 1, boardMode: 'classic', tableSetup: true });
  eq(A.net._myGlobeAt, null, 'a new match starts from the seats');
});
test('v2.6.148: the lobby offers Add bot in a Structured room only -- the rule reads the ROOM\'s board style, because the lobby message never carried one', () => {
  const A = loadClient(CLIENT);
  A.net.lobby = true; A.net.isHost = true; A.conv.uiMode = 'full';
  A.net.lobbyData = { players: [{ name: 'a' }], seats: 1 };         // exactly what the server sends: seats, players, watchers
  A.net.boardMode = 'classic';
  assert(/Structured/.test(A.netBotWhy()), 'a Classic room refuses');
  A.net.boardMode = 'structured';
  eq(A.netBotWhy(), '', 'a Structured room offers the button');
  const srv = require('fs').readFileSync(require('path').join(__dirname, 'elysium-server.js'), 'utf8');
  const ls = srv.slice(srv.indexOf('function lobbyState(room){'), srv.indexOf('function bcastLobby'));
  eq(/boardMode/.test(ls), false, 'the server\'s lobby message has no boardMode -- which is why the old check never fired');
});
test('v2.6.147: the pin is the needle alone -- it lies while the panel is loose and stands when the panel is pinned, the tooltip says which, and the setter never rewrites the button', () => {
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const m = /<button type="button" id="l2dockPin" aria-pressed="false" aria-label="([^"]+)" title="Not pinned"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="[^"]+"\/><\/svg><\/button>/.exec(html);
  assert(m, 'an icon button: one SVG path and no text, the name in aria-label, the state in aria-pressed, "Not pinned" as the first tooltip');
  eq(m[1], 'Keep the panel open', 'the name says what the button does and never changes -- a toggle button\'s state is aria-pressed');
  eq(/id="l2dockPin"[^\n]*&#128204;/.test(html), false, 'the pushpin emoji is gone: its own tilt differs from font to font, and a turn has to start from a known angle');
  assert(html.indexOf('#l2dockPin svg{ width:12px; height:12px; fill:currentColor; transform:rotate(90deg);') > 0, 'lying on its side while the panel is loose');
  assert(html.indexOf('#l2dockPin.on svg{ transform:none; }') > 0, 'standing, point down, when the panel is pinned');
  assert(html.indexOf('@media (prefers-reduced-motion:reduce){ #l2dockPin svg{ transition:none } }') > 0, 'no turning animation for reduced motion');
  assert(/#l2dockPin\{[^}]*width:22px; height:16px; padding:0;/.test(html), 'a small chip -- no room kept for words');
  const A = loadClient(CLIENT);
  const cls = new Set(), attrs = {};
  const btn = { innerHTML: '<svg/>', textContent: '', title: 'Not pinned', classList: { toggle(c, on){ if(on) cls.add(c); else cls.delete(c); return !!on; } }, setAttribute(k, v){ attrs[k] = v; } };
  A.__doc._ids.l2dockPin = btn;
  try {
    A.setDockPin(true);
    eq(btn.title, 'Pinned'); eq(attrs['aria-pressed'], 'true'); eq(cls.has('on'), true, 'the class that stands the needle up');
    A.setDockPin(false);
    eq(btn.title, 'Not pinned'); eq(attrs['aria-pressed'], 'false'); eq(cls.has('on'), false, 'and lays it down again');
    eq(btn.innerHTML, '<svg/>', 'the icon is static markup -- the setter writes nothing into the button');
    eq(btn.textContent, '');
    A.setDockPin(true);
    A.__stubEl.classList._t.add('l2dockopen');
    try { A.setL2Dock(false); } finally { A.__stubEl.classList._t.delete('l2dockopen'); }
    eq(A.dockPinned, false); eq(btn.title, 'Not pinned', 'a close that executes releases the pin, and the tooltip follows through the same setter');
  } finally { delete A.__doc._ids.l2dockPin; }
});
/* ---------- v2.6.149: THE FACE DECIDES (Johan's 'kör' on K1-K6, and three faults found on the way) ---------- */
function l4mode149(A, on){ const T = A.__stubEl.classList._t; if (on) T.add('l4mode'); else T.delete('l4mode'); }
test('v2.6.149 (K1): on the free board a crypt card between ready and uncontrolled is where its FACE says -- a face-down card dragged stays uncontrolled, a vampire flipped up where it lies is in play; torpor, library cards, riders and the Structured board are left alone', () => {
  const A = loadClient(CLIENT);
  if (!A.freeFaceZone || !A.freeFaceSync || !A.freeFaceSyncAll || !A.unlockedMinions || !A.tap || !A.readyToCanon) throw new Error('freeFaceZone / freeFaceSync / freeFaceSyncAll / unlockedMinions / tap / readyToCanon not exposed (harness needs updating)');
  A.clearTable({});
  const L = A.l2pub; L.on = true; L.s = 1.2; L.ox = 40; L.oy = 30; L.bx = 0; L.by = 0;
  try {
    l4mode149(A, false);
    const s1 = A.makeCard('V1', 'crypt'); A.move(s1, 'ready', { x: 100, y: 100, faceDown: true });
    eq(s1.zone, 'ready', 'Structured: nothing changes -- a face-down card moved into ready is in ready, as before');
    l4mode149(A, true);
    eq(A.freeFaceZone({ kind: 'crypt', faceDown: true }, 'ready'), 'uncontrolled');
    eq(A.freeFaceZone({ kind: 'crypt', faceDown: false }, 'uncontrolled'), 'ready');
    eq(A.freeFaceZone({ kind: 'crypt', faceDown: false }, 'torpor'), 'torpor'); eq(A.freeFaceZone({ kind: 'crypt', faceDown: true }, 'torpor'), 'torpor', 'torpor is left alone: only To torpor / Leave torpor move a card in or out (K3)');
    eq(A.freeFaceZone({ kind: 'lib', faceDown: true }, 'ready'), 'ready', 'a library card played face down is still in ready');
    eq(A.freeFaceZone({ kind: 'crypt', faceDown: true, host: 'c9' }, 'ready'), 'ready', 'a card riding on another keeps the zone attach() gave it');
    // a drag of a face-down card -- what dropCard asks for: 'ready' at a DISPLAY point
    const v = A.makeCard('V2', 'crypt'); A.move(v, 'uncontrolled', { faceDown: true, x: 300, y: 200 });
    A.move(v, 'ready', { x: 520, y: 260, faceDown: true, disp: true });
    eq(v.zone, 'uncontrolled', 'free board: dragged face down, still uncontrolled (v2.6.148: ready -- MINION 1, the vampire count +1, blood on it no transfer)');
    assert(A.state.zones.uncontrolled.includes(v.id) && !A.state.zones.ready.includes(v.id), 'and the zone lists agree');
    const cc = A.readyToCanon(520, 260); approx(v.x, cc.x, 1e-9); approx(v.y, cc.y, 1e-9);
    // flipped up where it lies
    const x0 = v.x, y0 = v.y; v.faceDown = false;
    eq(A.freeFaceSync(v), true); eq(v.zone, 'ready', 'flipped up where it lies: in play (v2.6.148: still uncontrolled -- no clan, no Actions menu, +1 blood charged as a transfer)'); eq(v.x, x0); eq(v.y, y0);
    eq(A.unlockedMinions(), 1, 'counted as a minion -- and the face-down card left in ready while Structured is not (the belt)');
    v.faceDown = true; A.freeFaceSync(v); eq(v.zone, 'uncontrolled', 'flipped back down: uncontrolled again'); eq(A.unlockedMinions(), 0);
    // the double-click
    const w = A.makeCard('V3', 'crypt'); A.move(w, 'uncontrolled', { faceDown: true, x: 50, y: 60 });
    A.tap(w, {}); A.tap(w, {});
    eq(w.faceDown, false); eq(w.zone, 'ready', 'a double-click: face up AND in play');
    const u = A.makeCard('V4', 'crypt'); A.move(u, 'uncontrolled', { faceDown: false }); eq(u.zone, 'ready', 'a face-up card asked into uncontrolled is in play');
    l4mode149(A, false); const old = A.makeCard('V5', 'crypt'); A.move(old, 'ready', { faceDown: true }); l4mode149(A, true);
    eq(old.zone, 'ready'); A.freeFaceSyncAll(); eq(old.zone, 'uncontrolled', 'a board an older client saved is put right on entering the free board');
    const host = A.makeCard('V6', 'crypt'); A.move(host, 'ready', { x: 10, y: 10, faceDown: false });
    const rider = A.makeCard('V7', 'crypt'); A.move(rider, 'ready', { x: 12, y: 12, faceDown: false }); A.attach(rider, host); rider.faceDown = true; A.freeFaceSync(rider);
    eq(rider.zone, 'ready', 'a rider keeps the zone attach() gave it, face down or not');
    A.move(host, 'torpor', { keepChildren: false }); eq(rider.host, host.id, 'torpor keeps its riders');
    A.attach(host, A.makeCard('V8', 'crypt'));                    // the host is stacked elsewhere: its own riders are released
    eq(rider.host, null); eq(rider.zone, 'uncontrolled', 'a released face-down rider is an uncontrolled card (it stayed ready with no host -- the review\'s finding)');
  } finally { l4mode149(A, false); L.on = false; }
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  eq((html.match(/ensureImg\(c\); freeFaceSync\(c\);/g) || []).length, 5, 'every flip asks: the double-click, the card menu, the controller\'s ctrl flip, Flip face up selected, Flip selected');
  assert(html.indexOf("{ const fz=freeFaceZone(c, zone);") > 0, 'move() asks');
  assert(html.indexOf("freed.forEach(k=>freeFaceSync(k));") > 0 && html.indexOf("detachFromHost(c); c.x=c.tx+30; c.y=c.ty+10; freeFaceSync(c); layout();") > 0, 'released and detached riders ask');
});
test('v2.6.149 (K3, K2): torpor survives a drag on the free board, a dragged uncontrolled or torpored crypt card never attaches to what it lands on, and Leave torpor leaves the vampire where it lies', () => {
  const A = loadClient(CLIENT);
  if (!A.freeDragKeepsZone) throw new Error('freeDragKeepsZone not exposed (harness needs updating)');
  const L = A.l2pub; L.on = true; L.s = 1.5; L.ox = 20; L.oy = 10; L.bx = 0; L.by = 0;
  A.clearTable({});
  try {
    l4mode149(A, true);
    eq(A.freeDragKeepsZone({ kind: 'crypt', faceDown: false }, 'torpor'), true);
    eq(A.freeDragKeepsZone({ kind: 'crypt', faceDown: true }, 'uncontrolled'), true);
    eq(A.freeDragKeepsZone({ kind: 'crypt', faceDown: false }, 'ready'), false, 'a ready vampire may still be stacked on another card');
    eq(A.freeDragKeepsZone({ kind: 'lib', faceDown: false }, 'hand'), false, 'a card from the hand is still played onto a vampire');
    const t = A.makeCard('T1', 'crypt'); A.move(t, 'ready', { x: 100, y: 100, faceDown: false });
    const at0 = { x: t.x, y: t.y }; A.move(t, 'torpor'); eq(t.zone, 'torpor'); eq(t.x, at0.x, 'To torpor: where it lies on the free board'); eq(t.y, at0.y);
    A.move(t, 'torpor', { x: 400, y: 300, faceDown: false, disp: true });   // what dropCard now asks for a torpored card on the free board
    eq(t.zone, 'torpor', 'dragged: still in torpor (v2.6.148: ready, "→ the ready region.")');
    const cc = A.readyToCanon(400, 300); approx(t.x, cc.x, 1e-9); approx(t.y, cc.y, 1e-9);
    const at = { x: t.x, y: t.y }; A.move(t, 'ready'); eq(t.zone, 'ready'); eq(t.x, at.x, 'Leave torpor (the menu\'s move on the free board): where it lies'); eq(t.y, at.y);
    l4mode149(A, false);
    eq(A.freeDragKeepsZone({ kind: 'crypt', faceDown: false }, 'torpor'), false, 'Structured: a drag out of the torpor box is leaving torpor, as before');
  } finally { l4mode149(A, false); L.on = false; }
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("const target=keepZone ? null : attachTargetAt(cx,cy,c);") > 0, 'the single drop asks before it attaches');
  assert(html.indexOf("const dz = (l4on() && from==='torpor') ? 'torpor' : 'ready';") > 0 && html.indexOf("move(c,dz,{x:X,y:Y,faceDown:fd,keepChildren:c.attached.length>0,disp:true});") > 0, 'the single drop keeps torpor on the free board');
  assert(html.indexOf("const dz = (l4on() && m.c.zone==='torpor') ? 'torpor' : 'ready';") > 0 && html.indexOf("move(m.c,dz,{x:X,y:Y,faceDown:fd,keepHost:true,disp:true});") > 0, 'and so does the group drop');
  assert(html.indexOf("fn:()=>{ if(l4on()) move(c,'ready'); else { const r=zoneRect('ready'); move(c,'ready',{x:r.x+24,y:r.y+24}); } log(cardRefCap(c)+' left torpor.'); }") > 0, 'K2: the menu item -- zoneRect(\'ready\') is the whole felt there, so the vampire landed in its top-left corner');
  assert(html.indexOf("#board.l4mode .card.torp::after{content:'TORPOR';") > 0, 'K3: the mark');
  assert(html.indexOf("c.el.classList.toggle('torp', _l4 && c.zone==='torpor');") > 0, 'own cards carry it (one pass in layout)');
  assert(html.indexOf("((ctx && c.zone==='torpor' && l4on())?' torp':'')") > 0, 'and every other seat\'s cards (addRCard)');
});
test('v2.6.149 (K4 + found on the way): the felt\'s Round/Turn label follows the counter, and the counter survives a reconnect -- kept on an automatic reconnect, taken from the boards after a reload until the next turn', () => {
  const A = loadClient(CLIENT);
  if (!A.tnAdopt || !A.turnLabel) throw new Error('tnAdopt / turnLabel not exposed (harness needs updating)');
  A.net.ws = { readyState: 1, send(){} };
  const J = extra => Object.assign({ room: 'r', token: 't', you: 'Johan', seat: 1, players: ROSTER146(2), boardMode: 'classic', lobby: false, srv: '2.6.44', myPub: { cards: [] } }, extra);
  const PB = (tn, rn) => ({ cards: [], counts: { hand: 7, library: 40, crypt: 8 }, pool: 30, tn, rn });   // a pub as clients send it
  A.MP_HANDLERS.joined(J({}));
  eq(A.net.turnNo, 0); eq(A.net.tnSync, true, 'a running game: the count comes from the boards');
  A.MP_HANDLERS.board({ seat: 2, who: 'Anna', pub: PB(5, 3) });
  eq(A.net.turnNo, 5); eq(A.net.roundNo, 3, 'a reload: the table\'s count, from another seat\'s board'); eq(A.turnLabel(), 'Round 3 · Turn 5');
  A.MP_HANDLERS.board({ seat: 2, who: 'Anna', pub: PB(4, 2) }); eq(A.net.turnNo, 5, 'never down');
  A.MP_HANDLERS.turn({ seat: 2, who: 'Anna' });
  eq(A.net.turnNo, 6); eq(A.net.tnSync, false, 'the next turn closes the window -- the count is the client\'s own again');
  A.MP_HANDLERS.board({ seat: 2, who: 'Anna', pub: PB(40, 20) }); eq(A.net.turnNo, 6, 'outside the window a board does not move it');
  A.net.status = 're'; A.MP_HANDLERS.joined(J({}));
  eq(A.net.turnNo, 6, 'an automatic reconnect keeps the count (v2.6.148 zeroed it: "▶ Round 1 · Turn 1" and the opening transfer ramp again)'); eq(A.net.roundNo, 3);
  A.MP_HANDLERS.board({ seat: 2, who: 'Anna', pub: PB(8, 4) }); eq(A.net.turnNo, 8, '...and catches up with turns it missed while away');
  A.net.status = 'off'; A.MP_HANDLERS.joined(J({ myPub: { cards: [], tn: 11, rn: 6 } })); eq(A.net.turnNo, 11, 'a reload with nobody else answering: my own board, as the server kept it');
  A.MP_HANDLERS.joined(J({ lobby: true })); eq(A.net.tnSync, false, 'the lobby: nothing to take');
  A.net.turnNo = 9; A.net.roundNo = 5; A.net.status = 're'; A.net.room = 'old';
  A.MP_HANDLERS.joined(J({ room: 'new' })); eq(A.net.turnNo, 0, 'still retrying a lost server and joining ANOTHER room by hand: the old count does not ride in (the review\'s finding)');
  A.net.turnNo = 3; A.net.roundNo = 2;
  A.MP_HANDLERS.took({ seat: 2, token: 't2', pub: { cards: [], tn: 12, rn: 6 }, loaded: 'sv' });
  eq(A.net.turnNo, 12); eq(A.net.roundNo, 6, 'a loaded match: its own count, from the board handed back');
  A.net.turnNo = 20; A.net.roundNo = 9; A.MP_HANDLERS.took({ seat: 2, token: 't2', pub: { cards: [], tn: 12, rn: 6 }, loaded: 'sv' }); eq(A.net.turnNo, 12, 'whatever this client counted before');
  A.net.turnNo = 2; A.net.roundNo = 1; A.MP_HANDLERS.took({ seat: 3, token: 't3', pub: { cards: [], tn: 15, rn: 8 } }); eq(A.net.turnNo, 15, 'a seat taken over: the seat\'s count'); eq(A.net.tnSync, true, 'and the window is open until the next turn');
  eq(A.tnAdopt({ tn: 40 }), false, 'a turn without its round is not taken (it would reset the round)'); eq(A.net.turnNo, 15);
  A.net.status = 'in'; A.net.turnNo = 7; A.net.roundNo = 4;
  const pub = A.buildPub(); eq(pub.tn, 7); eq(pub.rn, 4, 'every pub carries the count online');
  A.net.status = 'off'; eq(A.buildPub().tn, undefined, 'and not offline');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const atc = html.slice(html.indexOf('function advanceTurnCounter('), html.indexOf('function tnAdopt('));
  assert(atc.indexOf('updateL3Timer();') > 0, 'advanceTurnCounter writes the felt label (it was written only when the felt was rebuilt -- "Round 1 · Turn 1" all game)');
  assert(html.indexOf("if(late && !warned){ warned=true; toast('⏳ Five minutes left on the match clock'); }\n    updateL3Timer();") > 0, 'and the felt\'s centre clock ticks with the match clock');
  assert(html.indexOf("clearInterval(net.clockT); net.clockT=null;\n      updateL3Timer();") > 0 && html.indexOf("if(!net.matchEnd){ el.hidden=true; updateL3Timer(); return; }") > 0, '...to the end, and clears with it');
});
test('v2.6.149 (K5) / v2.6.150: another seat\'s resolver never opens the Played tray on my screen -- the tab lights up and names it; a combat I start from the card menu shows the tray and takes it away again; my own pin stays', () => {
  const A = loadClient(CLIENT);
  if (!A.pinPlayed || !A.closePlayed || !A.togglePlayed || A.playedAutoPin === undefined) throw new Error('pinPlayed / closePlayed / togglePlayed / playedAutoPin not exposed (harness needs updating)');
  const cls = new Set(); A.__doc._ids.playedOverlay = { classList: { add(c){ cls.add(c); }, remove(c){ cls.delete(c); }, contains(c){ return cls.has(c); }, toggle(c, on){ if (on) cls.add(c); else cls.delete(c); return !!on; } } };
  try {
    A.net.helperPolicy = { allowLocal: false, settings: { resBlock: true, resVote: true, resCombat: true } };   // the table's helpers on, as the host set them
    const tabCls = new Set(); let lab = { hidden: true, textContent: '' };
    A.__doc._ids.playedTab = { classList: { add(c){ tabCls.add(c); }, remove(c){ tabCls.delete(c); }, contains(c){ return tabCls.has(c); }, toggle(c, on){ if (on) tabCls.add(c); else tabCls.delete(c); return !!on; } } };
    A.__doc._ids.playedTabAvr = lab;
    A.MP_HANDLERS.tally({ mode: 'vote', a: 1, b: 0 });
    eq(A.playedPinned, false, 'someone opens a Vote: NOTHING opens on my screen (v2.6.149 pinned the tray; Johan: each player opens or pins by themselves)'); eq(cls.has('show'), false);
    eq(tabCls.has('live'), true, 'the tab pulses'); eq(lab.hidden, false); eq(lab.textContent, 'VOTE', 'and names the resolver');
    A.MP_HANDLERS.tally({ mode: null, a: 0, b: 0, res: 1 });
    eq(tabCls.has('live'), false, 'the Vote resolves: the tab goes quiet'); eq(lab.hidden, true);
    A.pinPlayed(); eq(A.playedAutoPin, false, 'a pin of my own');
    A.MP_HANDLERS.tally({ mode: 'vote', a: 0, b: 0 }); A.MP_HANDLERS.tally({ mode: null, a: 0, b: 0 });
    eq(A.playedPinned, true, 'a tray I pinned myself stays'); A.closePlayed();
    A.pinPlayedAuto(); eq(A.playedAutoPin, true, 'a combat I start from the card menu shows the tray (cmbEnsure)');
    A.avr.mode = 'combat'; A.avrRender(); A.avr.mode = null; A.avrRender();
    eq(A.playedPinned, false, '...and the tray goes with the combat');
    A.pinPlayedAuto(); A.togglePlayed(); A.togglePlayed(); eq(A.playedPinned, true); eq(A.playedAutoPin, false, 'two clicks on the tab: mine from then on');
    A.avr.mode = null; A.avrRender(); eq(A.playedPinned, true, 'and it stays');
  } finally { delete A.__doc._ids.playedOverlay; delete A.__doc._ids.playedTab; delete A.__doc._ids.playedTabAvr; A.net.helperPolicy = null; }
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("if(avr.mode!=='combat'){ avrOpen('combat'); if(avr.mode==='combat' && !playedIsOpen()) pinPlayedAuto(); }") > 0, 'a combat started from the card menu shows its panel the same way');
  assert(/let playedPinned=false, playedShowT=null, playedHideT=null, playedAutoPin=false;[^\n]*\nlet avr=avrFresh\(null\)/.test(html), 'the tray\'s state is declared beside avr: avrRender runs during start-up and reads it (declared where playedPinned was, the page died in the TDZ -- twice)');
  assert(html.indexOf("if(!_ov($('#playedOverlay')) && !_ov($('#playedTab'))) hidePlayedSoon(); } }") > 0, 'a hover peek the live resolver held open closes with it too (the review found it: hidePlayedSoon refuses while a resolver runs, and nothing hid it afterwards)');
  eq(API.L4_SEAT.topY, undefined, 'v2.6.150: the top row is back at the top edge');
  assert(html.indexOf("const gy=top ? T.y+L4_SEAT.m+(tableLarge()?L4_SEAT.largeTop:0) : (tableLarge()?L4_SEAT.largeBottom:L4_SEAT.lowBottom)-G.ch-G.dy;") > 0, "the seat formula (v2.6.153: the room's Table layout moves both rows)");
  eq(html.indexOf("hx(AVR_HKEYS[avr.mode]) && !playedIsOpen()) pinPlayedAuto(); avrRender();"), -1, 'the tally handler pins nothing');
});
test('v2.6.149 (K6): a roster change no longer empties the felt of the other seats\' cards, and a seat that dropped off says so on its globe', () => {
  const A = loadClient(CLIENT);
  A.net.ws = { readyState: 1, send(){} };
  const P = on => [{ seat: 1, name: 'Johan', online: true }, { seat: 2, name: 'Anna', online: on }];
  A.MP_HANDLERS.joined({ room: 'r', token: 't', you: 'Johan', seat: 1, players: P(false), boardMode: 'classic', lobby: false, srv: '2.6.44', myPub: { cards: [] } });
  A.l4Globes.clear(); A.renderL4Globes();
  eq(A.l4Globes.get(2).off, true, 'Anna is offline: her globe says so'); eq(A.l4Globes.get(1).off, false, 'never my own');
  A.net.roster = P(true); A.renderL4Globes(); eq(A.l4Globes.get(2).off, false, 'back online');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const rg = html.slice(html.indexOf('function renderL4Globes(){'), html.indexOf('function bindL4GlobeDrag('));
  assert(rg.indexOf('clearL4Globes();') > 0 && rg.lastIndexOf('if(l4on()) updateL4Opponents();') > rg.indexOf('clearL4Globes();'), 'clearL4Globes takes #l4oppWrap with it -- the other seats are drawn again at the end (v2.6.148: gone until the next board, or your own card move)');
  assert(html.indexOf('.l4globe.l4goff::after{ content:\'offline\';') > 0, 'the mark');
  const cl = html.slice(html.indexOf('function clearL4Globes(){'), html.indexOf('function renderL4OppCards(){'));
  eq(/l4oppWrap'\); if\(ow\) ow\.remove\(\)/.test(cl), false, 'and clearL4Globes no longer tears the layer down (every renderL4 -- a resize too -- rebuilt it from scratch)');
});
test('v2.6.149 (found on the way): another seat\'s attached cards ride on their host in every view -- torpor included -- and a card listed in a host\'s attached list without a host of its own (the released bot\'s equipment) is never drawn on its own', () => {
  if (!API.pubRiders) throw new Error('pubRiders not exposed (harness needs updating)');
  const R = API.pubRiders([
    { id: 'v1', kind: 'crypt', zone: 'ready', attached: ['e1', 'k1'] },
    { id: 'e1', kind: 'lib', zone: 'ready' },                            // the bot's equipment: in the list, no host
    { id: 'k1', kind: 'lib', zone: 'ready', host: 'v1' },
    { id: 'v2', kind: 'crypt', zone: 'torpor', attached: ['k2'] },
    { id: 'k2', kind: 'lib', zone: 'ready', host: 'v2' },
    { id: 'a1', kind: 'lib', zone: 'ready' }, { id: 'x1', kind: 'lib', zone: 'ash', attached: ['z9'] } ]);
  eq([...R].sort().join(), 'e1,k1,k2', 'riders: by host, or by a host\'s list; an ash card has no riders');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const l4 = html.slice(html.indexOf('function renderL4OppCards(){'), html.indexOf('function createL4Globe('));
  assert(l4.indexOf("cards.filter(c=>(c.zone==='torpor'||c.zone==='uncontrolled')&&!riders.has(c.id)).forEach(drawStack);") > 0, 'the free board: torpor and uncontrolled hosts carry their cards (v2.6.148: a torpored vampire\'s equipment vanished from every other screen)');
  assert(l4.indexOf("cards.filter(c=>c.zone==='ready'&&!riders.has(c.id)).forEach(drawStack);") > 0, 'and no rider is drawn on its own (the bot\'s equipment went to its corner)');
  const bm = html.slice(html.indexOf('function buildMat('), html.indexOf('function l3geom('));
  assert(bm.indexOf("const riders=pubRiders(cards);") > 0 && bm.indexOf("hx+CX*s*(k+1), hy-CY*s*(k+1)") > 0, 'the Structured mats: the same');
  const rf = html.slice(html.indexOf('function renderFull(host, seat){'), html.indexOf('function buildMat('));
  assert(rf.indexOf("const riders=pubRiders(cards);") > 0 && rf.indexOf("hx+CX*(k+1), hy-CY*(k+1)") > 0, 'and the single-board inspector');
  eq((html.match(/if\(kc && COUNTER_ZONES\.includes\(kc\.zone\)\) addRCard\(/g) || []).length, 5, 'every kids loop skips an id left in `attached` for a card in the ash heap or burned');
  const A = loadClient(CLIENT); A.net.status = 'in'; A.net.you = 'Johan'; A.net.roster = ROSTER146(2); A.net.boardMode = 'structured';
  A.restoreFromPub({ pool: 30, cards: [ { id: 'v', name: 'V1', kind: 'crypt', zone: 'torpor', attached: ['k'] }, { id: 'k', name: 'Card 1', kind: 'lib', zone: 'ready', host: 'v' } ] });
  const v = [...A.state.cards.values()].find(c => c.name === 'V1'), k = [...A.state.cards.values()].find(c => c.name === 'Card 1');
  eq(k.host, v.id, 'a snapshot restore puts a torpored vampire\'s equipment back ON it (it came back loose)');
});
test('v2.6.149: a snapshot restore and a card played onto my board get their face WITH the move, so the free board\'s face rule sees it; a parked crypt card is "on the table" there', () => {
  const A = loadClient(CLIENT);
  if (!A.parkWhere) throw new Error('parkWhere not exposed (harness needs updating)');
  A.net.status = 'in'; A.net.you = 'Johan'; A.net.roster = ROSTER146(2); A.net.boardMode = 'classic';
  l4mode149(A, true);
  try {
    A.restoreFromPub({ pool: 30, cards: [
      { id: 'a', name: 'V1', kind: 'crypt', zone: 'ready', x: 100, y: 100 },
      { id: 'b', name: 'V2', kind: 'crypt', zone: 'ready', x: 200, y: 100, faceDown: true },
      { id: 'c', name: 'V3', kind: 'crypt', zone: 'uncontrolled', x: 300, y: 100 },
      { id: 'd', name: 'V4', kind: 'crypt', zone: 'uncontrolled', x: 400, y: 100, faceDown: true } ] });
    const z = n => { const c = [...A.state.cards.values()].find(k => k.name === n); return c.zone + '/' + (c.faceDown ? 'down' : 'up') + '@' + c.x + ',' + c.y; };
    eq(z('V1'), 'ready/up@100,100', 'a face-up vampire stays in play (made face down, it would have been filed uncontrolled)');
    eq(z('V2'), 'uncontrolled/down@200,100', 'an older client\'s dragged face-down card is put right');
    eq(z('V3'), 'ready/up@300,100', 'and so is a vampire it flipped where it lay');
    eq(z('V4'), 'uncontrolled/down@400,100');
    eq(A.parkWhere('crypt'), 'on the table'); eq(A.parkWhere('lib'), 'in the ready region');
  } finally { l4mode149(A, false); }
  eq(A.parkWhere('crypt'), 'in the ready region', 'Structured: unchanged');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("move(c,'ready',{ faceDown:!!m.faceDown });") > 0 && html.indexOf("    c.faceDown=!!m.faceDown;\n    const hostC=") < 0, 'given: the face goes in with the move');
  eq((html.match(/face down '\+parkWhere\(/g) || []).length, 5, 'the crypt park lines ask: two prompts, the offline menu, the offline drag, the online reveal');
});
/* ---------- v2.6.151: THE EDGE ON THE GLOBE, ORDINALS EVERYWHERE ---------- */
test('v2.6.151: a seat that holds the Edge shows it on its pool globe unless it has an Edge token on the felt; the seat chips in the Table panel, a seat visit and the own pool name say 1st, 2nd ... like the globes; the help pages mention the suggested table setup', () => {
  const A = loadClient(CLIENT);
  if (!A.l4GlobeEdges) throw new Error('l4GlobeEdges not exposed (harness needs updating)');
  A.net.ws = { readyState: 1, send(){} };
  A.MP_HANDLERS.joined({ room: 'r', token: 't', you: 'Johan', seat: 1, players: ROSTER146(3), boardMode: 'classic', lobby: false, srv: '2.6.45', myPub: { cards: [] } });
  const on = new Map();
  A.l4Globes.clear(); A.renderL4Globes();
  A.l4Globes.forEach(g => { g.el = { classList: { toggle(c, v){ if (c === 'l4gedgeon') on.set(g.seat, !!v); return !!v; }, add(){}, remove(){}, contains(){ return false; } }, querySelector(){ return null; }, querySelectorAll(){ return []; }, style: {} }; });   // the stub element swallows writes; a tiny real one records the class
  A.net.boards[2] = { who: 'Anna', pub: { cards: [], edge: true } };
  A.net.boards[3] = { who: 'Erik', pub: { cards: [], edge: true, tokens: [{ type: 'edge', x: 1, y: 1 }] } };
  A.state.edge = false; A.l4GlobeEdges();
  eq(on.get(2), true, 'Anna holds the Edge and has no token on the felt: her globe says EDGE (a bot publishes exactly this)');
  eq(on.get(3), false, 'Erik has an Edge token out: the token says it, not the globe');
  eq(on.get(1), false, 'I do not hold it');
  A.state.edge = true; A.conv.edgeToken = false; A.l4GlobeEdges(); eq(on.get(1), true, 'I hold it with the token setting off: my globe says so');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("l4GlobeEdges();                                                   // v2.6.151\n  renderL4OppCards();") > 0, 'every board update refreshes the marks');
  assert(html.indexOf("if(typeof l4Globes!=='undefined' && l4Globes.size) l4GlobeEdges();   // v2.6.151: my own globe's Edge mark") > 0, 'and so does taking or releasing the Edge');
  assert(html.indexOf(`'<span class="l4gedge" title="Holds the Edge">EDGE</span>'`) > 0, 'the mark is in the globe');
  assert(html.indexOf(">🪑'+ordinal(o.seat)+'</span>'") > 0, 'the Table panel chip');
  assert(html.indexOf("font-size:16.5px\">'+ordinal(seat)+'</span>'") > 0, 'the seat visit header');
  assert(html.indexOf("ps.textContent=sx ? '🪑'+ordinal(sx) : '';") > 0, 'the own pool name');
  const help = require('fs').readFileSync(require('path').join(__dirname, 'help-local-server.html'), 'utf8'), start = require('fs').readFileSync(require('path').join(__dirname, 'START-HERE.html'), 'utf8');
  assert(help.indexOf('Suggested table setup') > 0 && start.indexOf('Suggested table setup') > 0, 'Help -> Local server and START-HERE mention the option');
});
/* ---------- v2.6.158: what the play-test found (one human, two bots, a full game; client/playtest/) ---------- */
testA('v2.6.158 (the play-test) the default combatant: a blocker from an earlier turn, a failed block, or a combat between two OTHER seats never pulls my minion in; my own block that held still does', async () => {
  const mk = turnSeat => { const A = loadClient(CLIENT); const T = parityTable(A, [['You'], ['B2', true], ['B3', true]]);
    A.conv.tournament = false; A.net.helperPolicy = null; A.net.turnSeat = turnSeat;
    A.clearTable({}); const v = A.makeCard('Lisa', 'crypt'); A.move(v, 'ready', { x: 100, y: 60, faceDown: false }); v.blood = 3;
    let shown = null; A.showMenu = items => { shown = items; };
    const block = () => { A.cardMenu(v, 0, 0); shown.find(x => x && x.label === 'Actions').sub.find(x => x.label === 'Block').fn(); };
    return { A, T, v, block, done: () => { A.localTable = false; T.HB.reset([]); } }; };
  let k = mk(2); k.block(); k.T.from(2, { t: 'tally', mode: null });
  k.A.net.turnSeat = 3; k.A.tallyStaleClose('turn', false);
  k.T.from(3, { t: 'tally', mode: 'combat', duelCid: 'x3', duelName: 'Ryan' });
  eq(k.A.avr.mode, 'combat'); eq(k.A.avr.duel[1], undefined, 'a blocker from an earlier turn stays out (it joined three bot fights in the play-test)'); k.done();
  k = mk(2); k.block();
  k.T.from(3, { t: 'tally', mode: 'combat', duelCid: 'x3', duelName: 'Ryan' });
  eq(k.A.avr.duel[1], undefined, 'B3 already faces the acting seat B2: a combat between two others is not mine'); k.done();
  k = mk(2); k.block(); k.T.from(2, { t: 'tally', mode: 'block', a: 3, b: 1 }); k.T.from(2, { t: 'tally', mode: null });
  k.T.from(2, { t: 'tally', mode: 'combat', duelCid: 'x2', duelName: 'Lauren' });
  eq(k.A.avr.duel[1], undefined, 'my block failed (stealth 3 vs intercept 1): no combat of mine'); k.done();
  k = mk(2); k.block(); k.T.from(2, { t: 'tally', mode: 'block', a: 1, b: 1 });
  k.T.from(2, { t: 'tally', mode: 'combat', duelCid: 'x2', duelName: 'Lauren' });
  eq(k.A.avr.duel[1] && k.A.avr.duel[1].cid, k.v.id, 'my block held: Lisa joins by default, straight from the Block counter'); k.done();
  k = mk(2); k.block(); k.T.from(2, { t: 'tally', mode: 'block', a: 1, b: 2 }); k.T.from(2, { t: 'tally', mode: null });
  k.T.from(2, { t: 'tally', mode: 'combat', duelCid: 'x2', duelName: 'Lauren' });
  eq(k.A.avr.duel[1] && k.A.avr.duel[1].cid, k.v.id, '...and when the counter was cleared before the combat opened (a human resolving it)'); 
  k.T.from(2, { t: 'tally', mode: null, res: 1 });
  k.T.from(2, { t: 'tally', mode: 'combat', duelCid: 'x2', duelName: 'Lauren' });
  eq(k.A.avr.duel[1], undefined, 'that combat ended: the next one in the same turn starts without me'); k.done();
});
test('v2.6.158 (the play-test) an image whose fallback cannot load either gets ONE fallback, not a loop: imgFallbackOnce, and the card-event clone through it', () => {
  const A = loadClient(CLIENT);
  const fake = () => { const img = { sets: [], h: [], pending: 0, classList: { add(){}, remove(){}, toggle(){} }, addEventListener(t, f){ if (t === 'error') this.h.push(f); } };
    let src = ''; Object.defineProperty(img, 'src', { get(){ return src; }, set(v){ src = v; img.sets.push(v); img.pending++; } }); return img; };
  const pump = img => { let n = 0; while (img.pending && n < 200){ img.pending--; n++; img.h.forEach(f => f()); } return n; };   // every load fails: one error event per src set
  const i1 = fake(); i1.src = 'face.jpg'; A.imgFallbackOnce(i1, 'back.jpg'); pump(i1);
  eq(i1.sets.join(' '), 'face.jpg back.jpg', 'the face fails, the back is tried once, and its failure ends it');
  const made = [], doc = A.__doc, orig = doc.createElement;
  doc.createElement = t => { if (t === 'img'){ const f = fake(); made.push(f); return f; } return orig(t); };
  try { const c = A.makeCard('Govern the Unaligned', 'lib'); c.faceDown = true; A.cardFx(c, 'play', { remote: true, who: 'Anna', seat: 2 }); }
  finally { doc.createElement = orig; }
  assert(made.length >= 1, 'the clone made its image');
  const n = made.map(m => { pump(m); return m.sets.length; });
  assert(n.every(x => x <= 2), 'at most the start and one fallback per image, got ' + n.join(',') + ' (v2.6.157: 201, the cap of this pump)');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  eq((html.match(/addEventListener\('error',\(\)=>\{ *[a-z0-9]+\.src=/g) || []).length, 0, 'no handler in the client sets a src on every error any more');
});
testA('v2.6.158 (the play-test) a master played ON a vampire uses up the master action: Play on X passes the master gate, and so does a drop onto the vampire', async () => {
  const A = loadClient(CLIENT); A.conv.tournament = false; A.net.helperPolicy = null;
  A.clearTable({}); const v = A.makeCard('Ashley', 'crypt'); A.move(v, 'ready', { x: 100, y: 60, faceDown: false }); v.blood = 3;
  const doll = A.makeCard('Blood Doll', 'lib'); A.move(doll, 'hand');
  A.state.phase = 1; A.state.phaseUsed.master = 0;
  A.selectOnly(v); eq(A.activeAnchor() && A.activeAnchor().id, v.id, 'Ashley is the anchor');
  await A.playOnActive(doll, false);
  eq(doll.host, v.id, 'played on Ashley');
  eq(A.state.phaseUsed.master, 1, 'Play on Ashley used up the master action (v2.6.157: 0, and the phase bar went on offering one)');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  assert(html.indexOf("if(from==='hand' && !(await masterPlayGate(c))){ layout(); return; }    // v2.6.158: a master dropped ON a vampire counts") > 0, 'the drop onto a vampire runs the same gate');
});
testA('v2.6.158 (the play-test) the level chooser follows the vampire playing the card: an anchored obf-only vampire is offered inferior first though another ready vampire has OBF; with no anchor the old rule (any ready vampire) holds', async () => {
  const A = loadClient(CLIENT); A.conv.tournament = false; A.net.helperPolicy = null;
  A.processCardData([
    { id: 1, name: 'Ashley', _name: 'Ashley', printed_name: 'Ashley', types: ['Vampire'], card_text: 'Camarilla.', capacity: 3, disciplines: ['dom', 'obf'], clans: ['Malkavian'] },
    { id: 2, name: 'Dr. Stephen Norton', _name: 'Dr. Stephen Norton', printed_name: 'Dr. Stephen Norton', types: ['Vampire'], card_text: 'Camarilla.', capacity: 4, disciplines: ['aus', 'OBF'], clans: ['Malkavian'] },
    { id: 3, name: 'Lost in Crowds', _name: 'Lost in Crowds', printed_name: 'Lost in Crowds', types: ['Action Modifier'], card_text: '[obf] +1 stealth.\n[OBF] As above, but for +2 stealth.', disciplines: ['obf'] }
  ], 'fixture');
  A.clearTable({});
  const ash = A.makeCard('Ashley', 'crypt'); A.move(ash, 'ready', { x: 100, y: 60, faceDown: false });
  const nor = A.makeCard('Dr. Stephen Norton', 'crypt'); A.move(nor, 'ready', { x: 200, y: 60, faceDown: false });
  const lic = A.makeCard('Lost in Crowds', 'lib'); A.move(lic, 'hand');
  let asked = null; A.uiDialog = o => { asked = o; return Promise.resolve('ok'); };
  A.selectOnly(ash); await A.modeChooseGate(lic, false);
  eq(asked && asked.okText, 'Inferior [obf]', 'Ashley plays it: inferior first (the play-test logged [OBF] for her)'); eq(asked.altText, 'Superior [OBF]'); eq(lic._modeTxt, '[obf]');
  A.selectOnly(nor); asked = null; await A.modeChooseGate(lic, false); eq(asked && asked.okText, 'Superior [OBF]', 'Norton plays it: superior first');
  A.state.selected.clear(); A.state.anchor = null; asked = null; await A.modeChooseGate(lic, false); eq(asked && asked.okText, 'Superior [OBF]', 'no anchor: any ready vampire, as before');
});
test('v2.6.158 a v5 crypt card keeps its disciplines with their case (the level chooser reads them; the v5 parser had only the joined string)', () => {
  const A = loadClient(CLIENT); A.processCardData([V5_LIB, V5_CRYPT, V3_CARD], 'test-fixture');   // a fresh client: later tests reload the shared API's database
  const g = A.cardInfo.get(A.norm('Gratiano'));
  assert(g && Array.isArray(g.disciplines), 'v5 crypt meta has a disciplines array');
  eq(g.disciplines.join(' '), 'obf pot DOM OBT', 'case kept: UPPER = superior');
  eq(A.cardInfo.get(A.norm('Test Elder')).disciplines.join(' '), 'obf oblivion DOM', 'v3 unchanged');
});
/* ---------- v2.6.159: the bot project's 15-16 Oct handoffs (bot v0.6.199-201) -- the bridge relays, the Debug bot's hand, the Reduce row ---------- */
function captureLog(A){   // what log() wrote -- private lines included (they reach neither curLines nor the error ring): a #log list and plain <li> objects
  const doc = A.__doc, lines = [], origCE = doc.createElement;
  doc._ids['log'] = { children: [], prepend(li){ lines.push(String(li.innerHTML)); this.children.unshift(li); }, get lastChild(){ const c = this.children; return { remove(){ c.pop(); } }; } };
  doc.createElement = t => (t === 'li' ? { innerHTML: '', cloneNode(){ return this; } } : origCE(t));
  const strip = s => String(s).replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');   // v2.6.163: decode like textContent -- escapeHtml escapes quotes now, and a real bot's random hand holding Wake with Evening's Freshness failed the Revelations check about one run in three
  return { lines, text: () => lines.map(strip), restore(){ delete doc._ids['log']; doc.createElement = origCE; } };
}
test('v2.6.159 the Edge at a hotseat: a bot\'s edgeTake reaches the human (a stored human\'s board and every mat too) and the other bots in the server\'s shape; the human\'s take reaches every bot, a hand-off to a bot is its edgePass (bot v0.6.200, play-test point 20: two Edge holders)', () => {
  const A = loadClient(CLIENT); const T = parityTable(A, [['You'], ['B2', true], ['Anna'], ['B4', true]]);
  A.net.hot.boards[3] = JSON.stringify({ pool: 30, cards: [], zones: {}, edge: true, edgeTok: { x: 5, y: 6 } });   // a stored human who held it
  A.net.boards[3] = { who: 'Anna', pub: { edge: true, tokens: [{ type: 'edge', x: 5, y: 6 }], cards: [], pool: 30, counts: { hand: 7, library: 40, crypt: 8 } } };
  A.state.edge = true;                                                                                           // ...and the active human too
  T.from(2, { t: 'edgeTake' });
  eq(A.state.edge, false, 'the active human\'s Edge clears (v2.6.158: the bridge had no case -- dropped, two holders)');
  const st = JSON.parse(A.net.hot.boards[3]); eq(st.edge, false, 'a stored human\'s saved board too'); eq(st.edgeTok, null);
  eq(A.net.boards[3].pub.edge, false, 'and their public mat'); eq(A.net.boards[3].pub.tokens.length, 0);
  const ET = k => T.got[k].filter(m => m.t === 'edgeTake' || m.t === 'edgePass');   // (the human's own 'B2 took the Edge.' line rides the log relay to every bot, as online)
  eq(JSON.stringify(ET(4)), JSON.stringify([{ t: 'edgeTake', bySeat: 2, clearOnly: false }]), 'the other bot hears it in the server\'s shape');
  eq(ET(2).length, 0, 'never back to the taker');
  T.clear(); A.state.edge = true; A.edgeTakeover();
  eq(JSON.stringify(ET(2)), JSON.stringify([{ t: 'edgeTake', bySeat: 1, clearOnly: false }]), 'the human\'s take reaches every bot (v2.6.158: online only -- a bot that held it re-lit it at its next push)');
  eq(ET(4).length, 1);
  T.clear(); A.state.edge = true; A.edgeHandoffHotseat(4, { x: 10, y: 20 });
  eq(JSON.stringify(ET(4)), JSON.stringify([{ t: 'edgePass', toSeat: 4, fromName: 'You', pos: { x: 10, y: 20 } }]), 'a hand-off to a bot is the server\'s edgePass, to that seat only');
  eq(ET(2).length, 0); eq(A.state.edge, false);
  T.clear(); A.state.edge = true; A.edgeHandoffHotseat(3, { x: 1, y: 1 }); eq(ET(2).length + ET(4).length, 0, 'a hand-off to a human seat sends no bot anything');
  A.localTable = false; T.HB.reset([]);
});
test('v2.6.159 Revelations at a hotseat, the bot\'s side: its revealHand reaches the human recipient as a private list (a stored human\'s names them), every other seat the card-free public line; its logTo (the discard command) reaches the seat it names (bot R3 -- the bridge dropped both)', () => {
  const A = loadClient(CLIENT); const T = parityTable(A, [['You'], ['B2', true], ['Anna'], ['B4', true]]);
  const L = captureLog(A);
  try {
    const cards = [{ name: 'Govern the Unaligned', kind: 'lib', junk: 1 }, { name: '' }];
    const pub = '<b>B2</b> reveals their hand to <b>You</b> (Revelations).';
    T.from(2, { t: 'revealHand', to: 1, cards, pub });
    assert(L.text().includes('B2 revealed to you: Govern the Unaligned.'), 'the active human reads the list, privately: ' + JSON.stringify(L.text()));
    eq(JSON.stringify(T.got[4]), JSON.stringify([{ t: 'log', who: 'B2', html: pub }]), 'the other bot gets the public line only');
    eq(T.got[2].length, 0, 'never back to the sender');
    T.clear(); L.lines.length = 0;
    T.from(2, { t: 'revealHand', to: 4, cards, pub: 'P' });
    eq(T.got[4][0].t, 'revealHand'); eq(T.got[4][0].seat, 2); eq(T.got[4][0].from, 'B2');
    eq(JSON.stringify(T.got[4][0].cards), JSON.stringify([{ name: 'Govern the Unaligned', kind: 'lib' }]), 'a bot recipient gets the list, whitelisted like the server\'s');
    assert(L.text().includes('[B2] P'), 'the human, a third party this time, reads the public line: ' + JSON.stringify(L.text()));
    T.clear(); L.lines.length = 0;
    T.from(2, { t: 'revealHand', to: 3, cards, pub: 'P' });
    assert(L.text().includes('B2 revealed to Anna: Govern the Unaligned.'), 'a stored human\'s list names its recipient (one screen, one log): ' + JSON.stringify(L.text()));
    eq(JSON.stringify(T.got[4]), JSON.stringify([{ t: 'log', who: 'B2', html: 'P' }]));
    T.clear(); L.lines.length = 0;
    T.from(2, { t: 'revealHand', to: 'all', cards });
    assert(L.text().includes('B2 revealed to you: Govern the Unaligned.'), 'to all: the human'); eq(T.got[4][0].t, 'revealHand', '...and every other bot');
    T.clear(); L.lines.length = 0;
    T.from(2, { t: 'logTo', toSeat: 1, html: 'Revelations: discard <b>Deflection</b>.' });
    assert(L.text().includes('[B2] Revelations: discard Deflection.'), 'the bot\'s discard command reaches the human it names: ' + JSON.stringify(L.text()));
    T.from(2, { t: 'logTo', toSeat: 3, html: 'Revelations: discard <b>Deflection</b>.' });
    assert(L.text().includes('[B2 → Anna] Revelations: discard Deflection.'), 'a stored human\'s line names them: ' + JSON.stringify(L.text()));
    T.from(2, { t: 'logTo', toSeat: 4, html: 'x' }); eq(JSON.stringify(T.got[4]), JSON.stringify([{ t: 'logTo', from: 'B2', html: 'x' }]), 'a bot recipient');
    T.clear(); L.lines.length = 0;
    T.from(2, { t: 'logTo', toSeat: 2, html: 'x' }); T.from(2, { t: 'logTo', toSeat: 9, html: 'x' }); T.from(2, { t: 'revealHand', to: 2, cards }); T.from(2, { t: 'revealHand', to: 1, cards: [] });
    eq(T.got[2].length + T.got[4].length + L.lines.length, 0, 'to itself, out of range, an empty list: nothing anywhere');
  } finally { L.restore(); A.localTable = false; T.HB.reset([]); }
});
test('v2.6.159 Revelations at a hotseat, the human\'s side: Reveal hand to a bot, an open hand toward the bots and a target picked from a bot\'s hand reach the bot seats as the server routes them (a bot\'s Revelations [aus] on you waited 30 s for the reveal and gave up)', () => {
  const A = loadClient(CLIENT); const T = parityTable(A, [['You'], ['B2', true], ['Anna'], ['B4', true]]);
  A.clearTable({}); const g = A.makeCard('Govern the Unaligned', 'lib'); A.move(g, 'hand'); const d = A.makeCard('Deflection', 'lib'); A.move(d, 'hand');
  A.revealHandTo([g, d], 2);
  const rv = T.got[2][0];
  assert(rv && rv.t === 'revealHand' && rv.seat === 1 && rv.from === 'You' && rv.who === 'You', 'the recipient bot gets the server\'s private list (v2.6.158: a local line and an animation, nothing for the bot): ' + JSON.stringify(rv));
  eq(rv.cards.map(c => c.name).join(), 'Govern the Unaligned,Deflection');
  eq(T.got[4][0].t, 'log'); assert(/revealed their hand to/.test(T.got[4][0].html) && !/Govern/.test(T.got[4][0].html), 'the other bot the card-free public line');
  T.clear(); A.revealHandTo([g], 'all'); eq(T.got[2][0].t, 'revealHand'); eq(T.got[4][0].t, 'revealHand', 'to all: every bot');
  T.clear(); A.state.openHand = []; A.openHandGrant('all');
  const og = T.got[2].find(m => m.t === 'openHandGrant'); assert(og && og.seat === 1 && og.cards.length === 2 && og.who === 'You', 'an open hand toward all reaches the bots (v2.6.158: online only)');
  T.clear(); A.hotPushBoardNow(); assert(T.got[4].some(m => m.t === 'openHandGrant'), 'and it follows every board push, as schedulePush does online');
  T.clear(); A.openHandRevoke('all'); eq(T.got[2].filter(m => m.t === 'openHandRevoke').length, 1, 'the revoke too');
  T.clear(); A.openHandGrant(4); eq(T.got[4].filter(m => m.t === 'openHandGrant').length, 1); eq(T.got[2].filter(m => m.t === 'openHandGrant').length, 0, 'a grant to one bot reaches that bot only');
  A.openHandRevoke(4); eq(T.got[4].filter(m => m.t === 'openHandRevoke').length, 1);
  T.clear(); A.setNameTarget({ name: 'Deflection', seat: 2, who: 'B2', visibility: 'private' });
  const lt = T.got[2].find(m => m.t === 'logTo');
  assert(lt && lt.from === 'You' && /targets <b>Deflection<\/b> \(revealed to you/.test(lt.html), 'the pick reaches the bot that revealed (v2.6.158: online only): ' + JSON.stringify(T.got[2]));
  eq(T.got[4].filter(m => m.t === 'logTo').length, 0, '...that bot only'); assert(T.got[4].some(m => m.t === 'log' && /targets a revealed card/.test(m.html)), 'everyone gets the public line, as before');
  T.clear(); A.setNameTarget({ name: 'X', seat: 3, who: 'Anna', visibility: 'hand' });
  eq(T.got[2].filter(m => m.t === 'logTo').length + T.got[4].filter(m => m.t === 'logTo').length, 0, 'a human hand owner at this screen gets nothing on the wire');
  A.setNameTarget(null);
  A.localTable = false; T.HB.reset([]);
});
test('v2.6.159 Debug bot offline: Inspect their hand reads a BOT seat\'s grant, not its empty stored board; a human seat still reads its stored board; the hands opened to me belong to the room or table (the bot project\'s 15 Oct audit, items 1 and 4)', () => {
  const A = loadClient(CLIENT); const T = parityTable(A, [['You'], ['B2', true], ['Anna']]);
  A.net.hot.boards[2] = JSON.stringify({ pool: 30, cards: [], zones: { hand: [] }, openHand: [] });   // the placeholder startHotseat files for a bot seat
  T.from(2, { t: 'openHand', to: 'all', cards: [{ name: 'Govern the Unaligned', kind: 'lib' }, { name: 'Deflection', kind: 'lib' }] });
  eq(JSON.stringify(A.openHandCardsFor(2)), JSON.stringify([{ name: 'Govern the Unaligned', kind: 'lib' }, { name: 'Deflection', kind: 'lib' }]), 'the bot\'s grant (v2.6.158: null -- it read the placeholder board)');
  eq(A.oppPoolMenuItems(2)[0].label, '👁 Inspect their hand (2)', 'so the pool menu offers it');
  A.net.hot.boards[3] = JSON.stringify({ pool: 30, openHand: ['all'], cards: [{ id: 'h1', name: 'Bonding', kind: 'lib' }], zones: { hand: ['h1'] } });
  eq(JSON.stringify(A.openHandCardsFor(3)), JSON.stringify([{ name: 'Bonding', kind: 'lib' }]), 'a human seat at a hotseat still reads its stored board');
  T.from(2, { t: 'openHand', to: 'all', revoke: true }); eq(A.openHandCardsFor(2), null, 'a revoke ends it');
  A.net.openHandFrom[2] = [{ name: 'X', kind: 'lib' }]; A.leaveHotseat(); eq(JSON.stringify(A.net.openHandFrom), '{}', 'leaving the table clears them (v2.6.158: only a page load did)');
  A.net.openHandFrom[2] = [{ name: 'X', kind: 'lib' }]; A.startHotseat([{ name: 'You' }, { name: 'B' }], 'structured'); eq(JSON.stringify(A.net.openHandFrom), '{}', 'a new table starts without them'); A.leaveHotseat();
  A.net.ws = { readyState: 1, send(){} };
  const J = extra => Object.assign({ room: 'r', token: 't', you: 'Johan', seat: 1, players: ROSTER146(2), boardMode: 'structured', lobby: false, srv: '2.6.46', myPub: { cards: [] } }, extra);
  A.net.openHandFrom[2] = [{ name: 'X', kind: 'lib' }]; A.MP_HANDLERS.joined(J({})); eq(JSON.stringify(A.net.openHandFrom), '{}', 'a fresh join starts empty');
  A.net.openHandFrom[2] = [{ name: 'X', kind: 'lib' }]; A.net.status = 're'; A.MP_HANDLERS.joined(J({})); eq((A.net.openHandFrom[2] || []).length, 1, 'an automatic reconnect into the SAME room keeps what it was shown (the server keeps no grants)');
  A.net.status = 're'; A.MP_HANDLERS.joined(J({ room: 'other' })); eq(JSON.stringify(A.net.openHandFrom), '{}', 'another room: empty');
  A.net.openHandFrom[2] = [{ name: 'X', kind: 'lib' }]; A.mpLeave(); eq(JSON.stringify(A.net.openHandFrom), '{}', 'leaving the room clears them');
});
test('v2.6.159 Debug bot: online the ROOM\'s policy decides alone -- a Play offline dropdown left on Tournament no longer greys Debug in an ordinary room; offline the first bot toggle paints the row AFTER the lock forces Helpers on (the bot project\'s 15 Oct audit, items 2 and 3)', () => {
  const A = loadClient(CLIENT); A.conv.tournament = false;
  const off = { value: 'tournament', disabled: false }; A.__doc._ids['offHelpers'] = off;   // Play offline was opened once with its Classic default
  try {
    A.net.status = 'in'; A.net.helperPolicy = { settings: {}, allowLocal: false, tournament: false };
    eq(A.botDebugAllowed(), true, 'an ordinary room may run a debug bot (v2.6.158: false -- the hidden offline dropdown said Tournament)');
    A.net.helperPolicy = { tournament: true }; eq(A.botDebugAllowed(), false, 'a Tournament room refuses it');
    A.net.helperPolicy = null; A.conv.tournament = true; eq(A.botDebugAllowed(), false, 'a room with no policy at all (a pre-2.6 server): the stored preference, failing closed');
    A.conv.tournament = false; eq(A.botDebugAllowed(), true);
    A.net.status = 'off'; eq(A.botDebugAllowed(), false, 'offline the dropdown is the table\'s mode, as before'); off.value = 'all'; eq(A.botDebugAllowed(), true);
    const board = { value: 'classic', disabled: false }, row = { style: { display: '', opacity: '' }, title: '' }, chk = { checked: false, disabled: false }, note = { style: { display: '' } };
    Object.assign(A.__doc._ids, { offBoard: board, offBotDebugRow: row, offBotDebug: chk, offAlphaNote: note });
    off.value = 'tournament';
    A.offlineCfg = [{ name: 'You', deckIdx: -1 }, { name: 'Bot', deckIdx: -1, botP: 'expert' }];
    A.renderOfflineSeats();
    eq(off.value, 'all', 'the lock forced Helpers on'); eq(chk.disabled, false, 'and the Debug box is usable (v2.6.158: greyed by the value the lock was about to replace)'); eq(row.title, '', 'with no false Tournament tooltip');
    off.value = 'tournament'; chk.disabled = true; A.syncOffBotLock(); eq(chk.disabled, false, 'the lock repaints the row itself -- openOffline calls it last, after syncOffTournament set the dropdown in code');
    A.offlineCfg = [{ name: 'You', deckIdx: -1 }, { name: 'Ann', deckIdx: -1 }]; A.renderOfflineSeats();   // no bots: the lock lets go
    off.value = 'local'; chk.disabled = false; board.value = 'classic'; A.syncOffTournament();
    eq(off.value, 'tournament'); eq(chk.disabled, true, 'a switch to Classic (Tournament by default) repaints the row after the value is set in code -- the #offBoard listener that painted it runs first, on the old value');
  } finally { for (const k of ['offHelpers', 'offBoard', 'offBotDebugRow', 'offBotDebug', 'offAlphaNote']) delete A.__doc._ids[k]; A.net.status = 'off'; A.net.helperPolicy = null; }
});
test('v2.6.159 the bridge stays liftable: the bot project lifts `const hotBridge = {...}` and `function hotFanOut` VERBATIM (bot/elysium-bot-hotseat.js, the same cut markers) into a context with no client functions -- every client name the lift refers to is typeof-guarded or part of that context, and every relay runs there, a COMBAT tally included (tallyIn called tallyCombatMerge / AVR_CMB_KEYS bare since v2.6.129: in the lift a bot\'s combat tally threw and the dial swallowed it)', () => {
  const vm = require('vm'), html = require('fs').readFileSync(CLIENT, 'utf8');
  const span = (from, to) => { const i = html.indexOf(from); assert(i >= 0, 'client marker missing: ' + from); const j = html.indexOf(to, i); assert(j >= 0, 'end marker missing after: ' + from); return [i, j + to.length]; };
  const [b0, b1] = span('const hotBridge = {', 'hotBridge.reset([]);'), [f0, f1] = span('function hotFanOut(msg, fromSeat){', '\n}');
  const src = html.slice(b0, b1) + '\n' + html.slice(f0, f1);
  // (1) static: the client's top-level names (outside the lift) that the lift mentions -- each one guarded by typeof, or one the lift's context provides
  const rest = html.slice(0, f0) + html.slice(f1, b0) + html.slice(b1), top = new Set();
  for (const m of rest.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm)) top.add(m[1]);
  for (const m of rest.matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm)) top.add(m[1]);
  const code = src.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/'(?:\\.|[^'\\\n])*'/g, "''").replace(/`(?:\\.|[^`\\])*`/g, '``');
  const CTX = ['VERSION', 'net', 'log', 'localTable', 'MP_HANDLERS'], used = new Set();
  for (const m of code.matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)\b/g)) if (top.has(m[2])) used.add(m[2]);
  const bare = [...used].filter(n => CTX.indexOf(n) < 0 && !new RegExp('typeof\\s+' + n + '\\b').test(code));
  eq(bare.join(', '), '', 'client names the lift calls bare (v2.6.158: tallyCombatMerge, AVR_CMB_KEYS)');
  assert(used.has('hotEdgeTaken') && used.has('MP_HANDLERS'), 'the scan sees the guarded calls too (it is not vacuous)');
  // (2) run it: the lift's own context, three bots, every case from seat 1
  const ctx = vm.createContext({ console: { log(){}, warn(){} }, setTimeout, clearTimeout, JSON, Math, Object, Array, String, Date, parseInt, VERSION: 'lift', localTable: true,
    net: { boards: {}, roster: [] }, MP_HANDLERS: { board(){}, log(){}, say(){}, chat(){}, fx(){} }, log(){} });
  vm.runInContext(src + '\nthis.hotBridge = hotBridge; this.hotFanOut = hotFanOut;', ctx);
  const HB = ctx.hotBridge, got = { 1: [], 2: [], 3: [] };
  HB.reset([{ name: 'B1', bot: true }, { name: 'B2', bot: true }, { name: 'B3', bot: true }]);
  [1, 2, 3].forEach(s => HB.dialFor(s, 'B' + s)('hot', { open(){}, msg(j){ got[s].push(JSON.parse(j)); }, close(){} }));
  const card = { name: 'Govern the Unaligned', kind: 'lib' }, errs = [];
  [{ t: 'join' }, { t: 'deck', name: 'd', library: [{ name: 'Govern the Unaligned', qty: 2 }], crypt: [{ name: 'Lisa', qty: 1 }] }, { t: 'seat', seat: 1 },
   { t: 'draw' }, { t: 'drawCrypt' }, { t: 'board', pub: { pool: 30, cards: [] } }, { t: 'log', html: 'x' }, { t: 'say', i: 1 }, { t: 'chat', msg: 'x' }, { t: 'fx', kind: 'rise' },
   { t: 'tally', mode: 'block', a: 1 }, { t: 'tally', mode: 'combat', a: 2, rng: 'long', duelCid: 'c1', duelName: 'Lisa' }, { t: 'tally', mode: null },
   { t: 'openHand', to: 'all', cards: [card] }, { t: 'openHand', to: 'all', revoke: true }, { t: 'edgeTake' },
   { t: 'revealHand', to: 2, cards: [card], pub: 'B1 reveals a card to B2.' }, { t: 'revealHand', to: 'all', cards: [card] }, { t: 'logTo', toSeat: 3, html: 'Revelations: discard <b>X</b>.' },
   { t: 'give', seat: 2, gid: 'g1', card: { name: 'Anarch Troublemaker' } }, { t: 'bounty' }, { t: 'pass' }
  ].forEach(m => { try { HB._fromBot(1, HB.seats[1], m); } catch (e) { errs.push(m.t + (m.mode ? '/' + m.mode : '') + ': ' + e.message); } });
  eq(errs.join(' | '), '', 'every case runs in the lift (v2.6.158: "tally/combat: tallyCombatMerge is not defined")');
  const of = (s, t) => got[s].filter(x => x.t === t);
  const ct = of(2, 'tally').find(x => x.mode === 'combat');
  assert(ct && ct.a === 2 && ct.duel && ct.duel[1] && ct.duel[1].cid === 'c1', 'the combat tally reaches the other bots, its duel included (the lift relays the base fields, as a pre-2.6.39 server did)');
  assert(of(3, 'tally').some(x => x.mode === 'combat'), 'to every other bot');
  eq(JSON.stringify(of(2, 'edgeTake')[0]), JSON.stringify({ t: 'edgeTake', bySeat: 1, clearOnly: false }), 'edgeTake in the server\'s shape');
  assert(of(2, 'revealHand').length === 2 && of(3, 'revealHand').length === 1 && of(3, 'log').some(x => /reveals a card to B2/.test(x.html)), 'revealHand: the recipient gets the cards, a third party the public line, "all" reaches both');
  assert(of(3, 'logTo').length === 1 && of(2, 'logTo').length === 0, 'logTo reaches the seat it names only');
  assert(of(2, 'openHandGrant').length === 1 && of(3, 'openHandRevoke').length === 1, 'the open hand and its revoke');
  assert(of(2, 'given').length === 1 && of(1, 'gave').length === 1, 'give -> given + gave');
  assert(of(3, 'bounty').length === 1 && of(2, 'roster').length >= 1, 'bounty pays the live predator (seat 3) and the roster goes out');
  // the real client keeps the combat fields (the guard degrades only where the client is absent)
  const A = loadClient(CLIENT); A.hotBridge.reset([{ name: 'B1', bot: true }, { name: 'B2', bot: true }]);
  const out = A.hotBridge.tallyIn('B1', 1, { mode: 'combat', a: 2, rng: 'long' });
  eq(out.rng, 'long', 'in the client the combat tally still carries its combat fields (tallyCombatMerge)');
  A.hotBridge.reset([]);
});
testA('v2.6.159 the Bleed menu\'s Reduce row (bot v0.6.201\'s ask): Actions > Bleed > Reduce bleed -1 / -2 / -X writes "NAME reduces the bleed by N." from the reacting minion -- no lock, no batch close, no target suffix -- and the line reaches the bots', async () => {
  const { A, T, v, lines, answer } = cmbTable(2);
  let shown = null; A.showMenu = items => { shown = items; };
  const row = lbl => { A.cardMenu(v, 0, 0); return shown.find(x => x.label === 'Actions').sub.find(x => x.label === 'Bleed').sub.find(x => x && x.label === lbl); };
  assert(row('Reduce bleed −1') && row('Reduce bleed −2') && row('Reduce bleed −X…'), 'three rows under Bleed (v2.6.158: none)');
  A.net.rtarget = { cid: 'pool', seat: 2, who: 'B2' };                                 // an aim on the felt must NOT ride the line
  T.clear(); row('Reduce bleed −1').fn();
  eq(lines()[lines().length - 1], 'Lisa reduces the bleed by 1.', 'the line, exactly -- no target suffix (the bot\'s L12.reduceBy ends at the period)');
  eq(v.locked, false, 'a reaction: no lock');
  assert(T.got[2].some(m => m.t === 'log' && /Lisa<\/b> reduces the bleed by 1\.$/.test(m.html) && m.who === 'You'), 'the bot bleeding you hears it, from your seat');
  row('Reduce bleed −2').fn(); eq(lines()[lines().length - 1], 'Lisa reduces the bleed by 2.');
  answer('3'); await row('Reduce bleed −X…').fn(); eq(lines()[lines().length - 1], 'Lisa reduces the bleed by 3.');
  answer(null); const n0 = lines().length; await row('Reduce bleed −X…').fn(); eq(lines().length, n0, 'a cancelled prompt writes nothing');
  answer('0'); await row('Reduce bleed −X…').fn(); eq(lines().length, n0, 'nor does 0');
  eq(A.BLEED_LINE.reduce('Lisa', 2), 'Lisa reduces the bleed by 2.', 'one builder (the canary runs it against the bot)');
  A.net.rtarget = null; A.localTable = false; T.HB.reset([]);
});
testB('v2.6.159 LIVE: the REAL bot hears the Reduce row (its bleed at you drops by N through the bridge) and shares the Edge with you -- its edgeTake clears yours, your take clears its, your hand-off lights its own (play-test points 15 and 20)', async () => {
  const BOT = require('./elysium-bot.js'); const A = loadClient(CLIENT); const HB = A.hotBridge;
  if (!(BOT.L12 && BOT.L12.reduceBy)){ const e = new Error('SKIP -- the bot beside the suite predates v0.6.201 (no L12.reduceBy)'); e.skip = true; throw e; }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  HB.reset([{ name: 'You' }, { name: 'Edgebot', bot: true }]);
  A.net.roster = [{ seat: 1, name: 'You' }, { seat: 2, name: 'Edgebot', bot: true }];
  A.net.you = 'You'; A.localTable = true; A.net.boards = {};
  A.net.hot = { boards: { 1: JSON.stringify({ pool: 30, cards: [], zones: {} }), 2: JSON.stringify({ pool: 30, cards: [], zones: { hand: [] }, openHand: [] }) }, undo: {} };
  const b = new BOT.Bot({ room: 'hot', pass: '', name: 'Edgebot', paceMs: 0, askSecs: 1, transport: HB.dialFor(2, 'Edgebot'), log: () => {} });
  const until = async (fn, ms) => { const t = Date.now(); while (!fn() && Date.now() - t < (ms || 3000)) await sleep(30); return fn(); };
  try {
    await b.connect(); await until(() => HB.seats[2] && HB.seats[2].deck, 4000);
    assert(HB.startFor(2) === true, 'the deal fired'); await sleep(150);
    A.clearTable({}); const v = A.makeCard('Lisa', 'crypt'); A.move(v, 'ready', { x: 100, y: 60, faceDown: false });
    b._actingVamp = { name: 'Botvamp', n: 2, target: 1, kind: 'bleed' };
    let shown = null; A.showMenu = items => { shown = items; };
    A.cardMenu(v, 0, 0); shown.find(x => x.label === 'Actions').sub.find(x => x.label === 'Bleed').sub.find(x => x && x.label === 'Reduce bleed −1').fn();
    await until(() => b._actingVamp.n !== 2);
    eq(b._actingVamp.n, 1, 'the real bot\'s bleed at me dropped from 2 to 1');
    b._actingVamp = null;
    A.state.edge = true; b._takeEdge();
    await until(() => !A.state.edge);
    eq(A.state.edge, false, 'the bot\'s edgeTake cleared mine (v2.6.158: dropped -- two holders)'); eq(b.edge, true);
    A.state.edge = true; A.edgeTakeover(); await until(() => !b.edge);
    eq(b.edge, false, 'my take cleared the bot\'s (v2.6.158: its next push re-lit it)');
    A.edgeHandoffHotseat(2, { x: 10, y: 20 }); await until(() => b.edge);
    eq(b.edge, true, 'my hand-off lit the bot\'s own Edge');
  } finally { b.close(); A.localTable = false; HB.reset([]); A.net.roster = []; A.net.hot = null; }
});
testB('v2.6.159 LIVE: a REAL Debug bot at a hotseat -- its grant reaches the human, the pool menu offers "Inspect their hand" with its actual cards (the tester\'s report: v2.6.158 read the empty placeholder board); and Revelations both ways -- the bot\'s reveal reaches you, yours reaches its waiter, your open hand its intel', async () => {
  const BOT = require('./elysium-bot.js'); const A = loadClient(CLIENT); const HB = A.hotBridge;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  HB.reset([{ name: 'You' }, { name: 'Debugbot', bot: true }]);
  A.net.roster = [{ seat: 1, name: 'You' }, { seat: 2, name: 'Debugbot', bot: true }];
  A.net.you = 'You'; A.localTable = true; A.net.boards = {}; A.net.openHandFrom = {};
  A.net.hot = { boards: { 1: JSON.stringify({ pool: 30, cards: [], zones: {} }), 2: JSON.stringify({ pool: 30, cards: [], zones: { hand: [] }, openHand: [] }) }, undo: {} };
  const b = new BOT.Bot({ room: 'hot', pass: '', name: 'Debugbot', paceMs: 0, askSecs: 1, debug: true, transport: HB.dialFor(2, 'Debugbot'), log: () => {} });
  const until = async (fn, ms) => { const t = Date.now(); while (!fn() && Date.now() - t < (ms || 3000)) await sleep(30); return fn(); };
  const L = captureLog(A);
  try {
    await b.connect(); await until(() => HB.seats[2] && HB.seats[2].deck, 4000);
    assert(HB.startFor(2) === true, 'the deal fired');
    await until(() => A.canSeeOpenHand(2), 4000);
    eq(A.oppPoolMenuItems(2)[0].label, '👁 Inspect their hand (' + b.hand.length + ')', 'the menu item, with the bot\'s hand size');
    eq(A.openHandCardsFor(2).map(c => c.name).join('|'), b.hand.join('|'), 'the bot\'s actual hand');
    // the bot as the TARGET of Revelations [aus]: its reveal reaches me privately
    b._armPending('You', 0, 'Lisa', null, 'peek'); if (b.pending){ b.pending.peekSup = false; b.pending.actorName = 'You'; }
    L.lines.length = 0; b._applyPending('test');
    await until(() => L.text().some(l => /^Debugbot revealed to you: /.test(l)));
    const rl = L.text().find(l => /^Debugbot revealed to you: /.test(l));
    assert(rl && b.hand.every(n => rl.indexOf(n) >= 0), 'the bot\'s Revelations reveal reaches me, every card in it (v2.6.158: dropped): ' + rl);
    // the bot as the ACTOR: it waits for my reveal -- the bridge hands it over
    A.clearTable({}); const g = A.makeCard('Govern the Unaligned', 'lib'); A.move(g, 'hand');
    const w = b._awaitReveal(1, 3000); A.revealHandTo([g], 2); const got = await w;
    eq(got && got.cards.map(c => c.name).join(), 'Govern the Unaligned', 'its reveal waiter gets my cards (v2.6.158: 30 s, then "no reveal received")');
    A.state.openHand = []; A.openHandGrant('all'); await until(() => b._handIntel(1) && b._handIntel(1).mode === 'open');
    eq(b._handIntel(1) && b._handIntel(1).mode, 'open', 'my open hand reaches its intel (a bot\'s Revelations [AUS] reads the grant)');
    A.openHandRevoke('all'); await until(() => !b._handIntel(1)); eq(b._handIntel(1), null, 'and the revoke ends it');
    b.send({ t: 'logTo', toSeat: 1, html: 'Revelations: discard <b>Govern the Unaligned</b>.' });
    await until(() => L.text().includes('[Debugbot] Revelations: discard Govern the Unaligned.'));
    assert(L.text().includes('[Debugbot] Revelations: discard Govern the Unaligned.'), 'its discard command reaches me');
  } finally { L.restore(); b.close(); A.localTable = false; HB.reset([]); A.net.roster = []; A.net.hot = null; A.net.openHandFrom = {}; }
});
test('v2.6.160 the eye (Johan, the bot project\'s item 5): its state -- quiet until there is something to see, on with an ash heap or burned pile, gold (lit) while their hand is open to you -- and its rows are the pool menu\'s look rows, now pure UI (noUndo)', () => {
  const A = loadClient(CLIENT);
  A.localTable = false; A.net.openHandFrom = {};
  A.net.boards = { 2: { who: 'Astrid', pub: { pool: 30, cards: [], counts: { hand: 7, library: 40, crypt: 8 } } } };
  let st = A.mateyeState(2);
  eq(st.cls, 'quiet', 'nothing to see yet: greyed'); eq(st.hand, null); eq(st.ash, 0); eq(st.burned, 0);
  eq(st.title, 'Ash heap 0 · burned 0 — click to look');
  A.net.boards[2].pub.cards = [{ id: 'b1', zone: 'burned', name: 'Bum' }];
  eq(A.mateyeState(2).cls, 'on', 'a burned card is something to see');
  A.net.boards[2].pub.cards.push({ id: 'a1', zone: 'ash', name: 'Deflection' }, { id: 'a2', zone: 'ash', name: 'Govern the Unaligned' });
  st = A.mateyeState(2); eq(st.cls, 'on'); eq(st.ash, 2); eq(st.burned, 1);
  A.net.openHandFrom[2] = [{ name: 'Computer Hacking', kind: 'lib' }, { name: 'Leverage', kind: 'lib' }, { name: 'Dodge', kind: 'lib' }];
  st = A.mateyeState(2);
  eq(st.cls, 'lit', 'their hand is open to me'); eq(st.hand, 3);
  eq(st.title, 'Their hand is open to you (3) · Ash heap 2 · burned 1 — click to look');
  const rows = A.oppLookItems(2);
  eq(rows.map(r => r.label).join(' | '), '👁 Inspect their hand (3) | 🜂 View their ash heap (2) | 🔥 View their burned cards (1)');
  assert(rows.every(r => r.noUndo === true && typeof r.fn === 'function'), 'look rows make no undo point (pure UI, T3b)');
  const pool = A.oppPoolMenuItems(2).filter(x => x && x !== '-');
  eq(pool.slice(0, 3).map(r => r.label).join(' | '), rows.map(r => r.label).join(' | '), 'the pool\'s right-click starts with the SAME rows (one builder)');
  eq(pool[3].label, '⌖ Target their pool', 'then the pool target, as before');
  const el = { className: '', title: '' };
  A.mateyePaint(el, 2); eq(el.className, 'mateye lit'); assert(/^Their hand is open to you \(3\)/.test(el.title));
  delete A.net.openHandFrom[2]; A.net.boards[2].pub.cards = [];
  A.mateyePaint(el, 2); eq(el.className, 'mateye quiet', 'back to greyed');
  const svg = A.mateyeSvg();
  assert(/^<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="[^"]+"\/><\/svg>$/.test(svg), 'one path, currentColor (the v2.6.147 icon rule)');
});
test('v2.6.160 the eye: a grant or a revoke repaints every eye of that seat (the seat visit was the only repaint); and the eye sits on the mat as board chrome, at the pool zone\'s corner where your own Edge sits', () => {
  const A = loadClient(CLIENT), D = A.__doc, saved = D.querySelectorAll;
  A.localTable = false; A.net.openHandFrom = {}; A.net.view = 'ov';
  A.net.boards = { 2: { who: 'Astrid', pub: { pool: 30, cards: [{ id: 'a1', zone: 'ash', name: 'Deflection' }], counts: { hand: 7, library: 40, crypt: 8 } } } };
  const eyes = [{ className: 'mateye on', title: '' }, { className: 'mateye on', title: '' }], asked = [];
  D.querySelectorAll = sel => { asked.push(sel); return sel === '.mateye[data-seat="2"]' ? eyes : []; };
  try {
    A.MP_HANDLERS.openHandGrant({ t: 'openHandGrant', seat: 2, from: 'Astrid', cards: [{ name: 'Dodge', kind: 'lib' }] });
    assert(eyes.every(e => e.className === 'mateye lit'), 'both eyes of seat 2 lit (the helicopter mat and a column, say) (got ' + eyes.map(e => e.className) + ')');
    A.MP_HANDLERS.openHandRevoke({ t: 'openHandRevoke', seat: 2, from: 'Astrid' });
    assert(eyes.every(e => e.className === 'mateye on'), 'and back to on (an ash heap is still there)');
    assert(asked.includes('.mateye[data-seat="2"]'), 'it looked the eyes up by seat');
  } finally { D.querySelectorAll = saved; }
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const bm = html.slice(html.indexOf('function buildMat('), html.indexOf('function l3geom('));
  const i = bm.indexOf('if(!me && seat!=null){                                    // v2.6.160');
  assert(i > 0, 'the eye block in buildMat, for another seat only');
  const blk = bm.slice(i, bm.indexOf('(pub.tokens||[]).forEach', i));
  assert(blk.indexOf('mateyePaint(ey, seat)') >= 0 && blk.indexOf('mateyeSvg()') >= 0, 'painted from mateyeState, drawn from the one SVG');
  assert(blk.indexOf("X(cz.pl.x+cz.pl.w)-s*0.00807*bw-esz") >= 0 && blk.indexOf('Y(cz.pl.y)+s*0.023*bh') >= 0, 'in the pool zone\'s top right -- the own Edge marker\'s 0.94 x 0.668 of the stage');
  assert(blk.indexOf("showMenu(oppLookItems(seat)") >= 0, 'it opens the look rows');
  assert(blk.indexOf("addEventListener('click', look)") >= 0 && blk.indexOf("addEventListener('contextmenu', look)") >= 0 && /const look=e=>\{ e\.preventDefault\(\); e\.stopPropagation\(\);/.test(blk), 'a click and a right-click (or a long-press), and neither reaches the mat (no seat jump) or the quick-phrase fallback');
  assert(blk.indexOf("createElement('div')") >= 0, 'a div like #edge: no tab stop (Tab is the keymap\'s)');
  assert(A.isBoardChrome({ closest: sel => (sel.split(',').indexOf('.mateye') >= 0 ? {} : null) }), 'board chrome: a press on the eye never starts the L3 pan, the wheel never zooms');
  assert(/\.mateye\.quiet\{ opacity:\.4; \}/.test(html) && /\.mateye\.lit\{ border-color:var\(--brass\);/.test(html), 'greyed when quiet, brass when lit');
});
test('v2.6.161 a seat visit from the helicopter view stands on L2, as a visit from L2 does -- switchView enters L2 under it (v2.6.160: exitL3 alone left the board on the retired L1 stage, where fitBoard scales the 1004 x 616 board, and the visit had no hand dock; found running the eye online)', () => {
  const A = loadClient(CLIENT), D = A.__doc, synced = [];
  const tab = id => ({ classList: { toggle(c){ synced.push(id + ':' + c); }, add(){}, remove(){}, contains(){ return false; } }, title: '', style: {} });
  D._ids.l2preyTab = tab('prey'); D._ids.l2predTab = tab('pred');                    // renderL2 syncs these two tabs (l2syncTabs): the trace that L2 was entered
  A.net.roster = [{ seat: 1, name: 'Me' }, { seat: 2, name: 'Astrid' }, { seat: 3, name: 'Bo' }];
  const pub = { pool: 30, cards: [], counts: { hand: 7, library: 40, crypt: 8 } };
  A.net.boards = { 2: { who: 'Astrid', pub }, 3: { who: 'Bo', pub } };
  A.net.view = 'ov'; A.switchView(2);
  eq(A.net.view, 2, 'the visit');
  assert(synced.length > 0, 'from the helicopter view the visit stands on L2: renderL2 ran under it (v2.6.160: it did not)');
  synced.length = 0; A.switchView(3);
  eq(synced.length, 0, 'a visit to another visit stays where it stands');
  synced.length = 0; A.net.view = 'l2'; A.switchView(2);
  eq(synced.length, 0, 'a visit from L2 keeps L2 as it was (no second render)');
  synced.length = 0; A.switchView('l2');
  assert(synced.length > 0, 'Home from a visit: L2, as before');
  const html = require('fs').readFileSync(CLIENT, 'utf8');
  const sv = html.slice(html.indexOf('function switchView(target, instant){'), html.indexOf('function jumpSeat(n){'));
  const iView = sv.indexOf('net.view=target;'), iFix = sv.indexOf("if(prev==='ov' && typeof target==='number') enterL2();"), iMenus = sv.indexOf('renderReady(); renderHand();');
  assert(iView > 0 && iFix > iView && iMenus > iFix, 'entered once net.view is the visit and before renderReady/renderHand, so they see the board a visit from L2 sees');
  const fb = html.slice(html.indexOf('function fitBoard(){'), html.indexOf('function enterL0(){'));
  assert(fb.indexOf("if(board.classList.contains('l2cols')){ board.style.transform='';") > 0 && fb.indexOf("board.style.transform='scale('+(s||1)+')';") > 0, 'why: L2 columns fill the area by CSS; without l2cols (what exitL3 leaves) fitBoard scales the 1004 x 616 stage');
});
testA('v2.6.161 the side panel settles on its OWN transitionend: a 250 ms backstop that fires first no longer swallows it (when frames stalled after a view switch, the backstop measured the panel before it moved and nothing measured it again -- a seat visit from the helicopter view stayed 1172 px wide in a 1098 px area); the newest call owns the transition; a child\'s transition does not count', async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const A = loadClient(CLIENT), D = A.__doc, W = A.__win, q0 = D.querySelector, tes = [];
  const aside = { addEventListener(t, f){ if (t === 'transitionend') tes.push(f); }, removeEventListener(t, f){ const i = tes.indexOf(f); if (i >= 0) tes.splice(i, 1); } };
  await sleep(320);                                                                      // the boot's own setAside (enterL0) settles first
  let n = 0; W.dispatchEvent = e => { if (e && e.type === 'resize') n++; return true; };   // requestAnimationFrame never calls back in the harness: only the settle's resizes are counted
  D.querySelector = sel => sel === 'aside' ? aside : q0(sel);
  const end = (target = aside, propertyName = 'width') => { const f = tes[tes.length - 1]; if (f) f({ propertyName, target }); };
  try {
    A.setAside(false, false);
    eq(tes.length, 1, 'one listener waits for the panel');
    await sleep(320);
    eq(n, 1, 'a stalled transition: the backstop sends one resize');
    eq(tes.length, 1, 'and the listener still waits');
    end();
    eq(n, 2, 'the panel\'s own end, AFTER the backstop, sends the final resize (v2.6.160: swallowed -- the geometry measured before the panel moved stayed)');
    eq(tes.length, 0, 'and the listener leaves');
    n = 0; A.setAside(true, false); end();
    eq(n, 1, 'the usual order: the end sends the resize');
    await sleep(320); eq(n, 1, 'and the backstop then stays quiet');
    n = 0; A.setAside(false, false); A.setAside(false, false);
    eq(tes.length, 1, 'two calls in a row: only the newest listens');
    end({}); eq(n, 0, 'a child\'s width transition bubbling up does not count');
    end(aside, 'opacity'); eq(n, 0, 'nor does another property');
    await sleep(320); eq(n, 1, 'one backstop, not two (the older call\'s was cleared)');
    end(); eq(n, 2, 'and the real end still comes through');
  } finally { D.querySelector = q0; }
});
test('v2.6.162 bot v0.6.204\'s new rung: resolve-verdict (a bot blocked YOUR action and waits for your stealth or your word) reads "Declare verdict" -- v2.6.161 drew "Step"; the Turn-based play button steps it and its title names a block verdict; a wait whose question is still queued shows the dash with its button live', () => {
  const A = loadClient(CLIENT); const HB = A.hotBridge;
  eq(A.BOT_STEP_LABEL['resolve-verdict'], 'Declare verdict', 'the label the bot project suggested');
  ['release-hold', 'resolve-ask', 'resolve-pq', 'resolve-phase', 'resolve-vote'].forEach(k => assert(A.BOT_STEP_LABEL[k] && A.BOT_STEP_LABEL[k] !== 'Declare verdict', 'every older rung keeps its own label: ' + k));
  const el = { innerHTML: '', _botSig: null, querySelector: () => null, querySelectorAll: () => [], remove(){} }; A.__doc._ids.hotBotBtn = el;
  A.localTable = true; HB.reset([{ name: 'Lisa' }, { name: 'B2', bot: true }]); HB.seats[2] = { cb: { msg(){} }, name: 'B2' }; HB.botcfgIn('', A.BOTCFG0); HB.botcfgIn('Lisa', { tempo: 'turn' });
  let stepped = 0;
  const fake = { status: () => ({ name: 'B2', state: 'asking', waitingFor: 'block verdict (Lisa)', until: null, step: 'resolve-verdict', canStep: true }),
    step: () => { stepped++; return { did: 'resolve-verdict', why: 'declared the block verdict from the counter the way the clock would have' }; }, _handlers: { botcfg(){} } };
  A.hotBots[2] = fake;
  try {
    A.botPanelOpen = true; A.botCfgOpen = false; A.botPanelRender();
    assert(/\u25b6 Declare verdict<\/button>/.test(el.innerHTML), 'the row says Declare verdict (v2.6.161: Step)');
    assert(/block verdict \(Lisa\)/.test(el.innerHTML), 'what it waits for, in the bot\'s own words');
    assert(/class="botPanelCd" data-i="0"[^>]*>\u2014<\/span>/.test(el.innerHTML), 'no clock yet: the dash (bot v0.6.204: the clock starts when the question is sent; until then until is null)');
    assert(!/class="botPanelStep" data-i="0" disabled/.test(el.innerHTML), 'and the button is live meanwhile -- an answer before the question is on the wire still counts');
    assert(/id="botGiveWord" title="[^"]*a block verdict; never a hold"/.test(el.innerHTML), 'Turn-based: the play button is there, and its title names the block verdict');
    eq(A.botGiveWord(), 1, 'the play button steps it (a filter since v2.6.140, so no allow-list to grow)'); eq(stepped, 1);
  } finally { delete A.hotBots[2]; A.localTable = false; HB.reset([]); delete A.__doc._ids.hotBotBtn; }
});
testB('v2.6.162 LIVE: a REAL bot (v0.6.204+) blocks your bleed and waits for your word -- the panel reads "block verdict (You)" and Declare verdict, no clock in Turn-based, the play button gives it the word, the verdict line comes from the BLOCKER\'s seat (its `who` is the bot, the name the bubble shows) and the combat counter follows; an older bot skips loudly', async () => {
  const BOT = require('./elysium-bot.js'); const A = loadClient(CLIENT); const HB = A.hotBridge;
  if (typeof BOT.Bot.prototype._vwArm !== 'function'){ const e = new Error('SKIP -- bot v' + BOT.BOT_VERSION + ' beside the suite has no verdict wait; this needs v0.6.204+'); e.skip = true; throw e; }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const until = async (fn, ms) => { const t = Date.now(); let v = fn(); while (!v && Date.now() - t < (ms || 3000)){ await sleep(30); v = fn(); } return v; };
  HB.reset([{ name: 'You' }, { name: 'Wallbot', bot: true }]);
  A.net.roster = [{ seat: 1, name: 'You', vp: 0 }, { seat: 2, name: 'Wallbot', bot: true, vp: 0 }];
  A.net.you = 'You'; A.net.boards = {}; A.net.hot = { boards: { 1: JSON.stringify({ pool: 30 }), 2: '{}' }, undo: {} }; A.localTable = true; A.conv.tournament = false;
  HB.botcfgIn('', A.BOTCFG0); HB.botcfgIn('You', { tempo: 'turn' });
  const b = new BOT.Bot({ room: 'hot', pass: '', name: 'Wallbot', paceMs: 0, askSecs: 20, transport: HB.dialFor(2, 'Wallbot'), deck: BOT.ARCHETYPES.ventrue, deckName: 'ventrue', persona: 'expert', log: () => {} });
  const dec0 = b.decide.bind(b);
  b.decide = (k, ctx) => { const d = dec0(k, ctx); return k === 'block-as-target' ? Object.assign({}, d, { block: true, bounce: false, why: 'the test: block' }) : d; };   // the flow under test is the WAIT, not the bot's choice (the hidden-randomness class)
  const logs = [], chats = []; const log0 = A.MP_HANDLERS.log, chat0 = A.MP_HANDLERS.chat;
  A.MP_HANDLERS.log = m => { logs.push({ who: m.who, txt: String(m.html || '').replace(/<[^>]*>/g, '') }); return log0(m); };
  A.MP_HANDLERS.chat = m => { chats.push({ who: m.who, msg: String(m.msg || '') }); return chat0(m); };
  const el = { innerHTML: '', _botSig: null, querySelector: () => null, querySelectorAll: () => [], remove(){} };
  try {
    await b.connect(); await until(() => HB.seats[2] && HB.seats[2].deck, 6000);
    assert(HB.startFor(2), 'dealt'); await sleep(300);
    const u = b.unc.shift(); b.board.push({ id: u.id, name: u.name, kind: 'crypt', zone: 'ready', x: 0, y: 0, locked: false, faceDown: false, blood: u.cap || 5, cap: u.cap || 5 }); b.hand.length = 0; b.push();   // a blocker and no intercept card: a bare block, stealth 0 vs intercept 0 holds
    A.hotBots[2] = b;
    A.clearTable({}); const v = A.makeCard('Lisa', 'crypt'); A.move(v, 'ready', { x: 100, y: 60, faceDown: false }); v.blood = 3;
    HB.turn(1); await sleep(150);
    let shown = null; A.showMenu = items => { shown = items; };
    A.cardMenu(v, 0, 0); shown.find(x => x.label === 'Actions').sub.find(x => x.label === 'Bleed').sub.find(x => x && x.label === 'Bleed 2').fn();
    const st = await until(() => { const s = A.botPanelRead(b); return s.step === 'resolve-verdict' ? s : null; }, 10000);
    assert(st, 'the bot blocked and waits on the actor (v0.6.203: "attempts to block." and then silence): ' + JSON.stringify(A.botPanelRead(b)));
    eq(st.waitingFor, 'block verdict (You)'); eq(st.state, 'asking'); assert(st.canStep, 'steppable');
    eq(st.until, null, 'Turn-based: no clock -- the panel shows the dash');
    assert(logs.some(l => l.who === 'Wallbot' && /attempts to block\.$/.test(l.txt)), 'the bare attempt reached the client');
    const qm = await until(() => { for (const c of chats){ const mm = c.who === 'Wallbot' && /blocks \(stealth 0 vs intercept (-?\d+)\) \u2014 You, add stealth, or say Pass to resolve it \(no clock \u2014 I wait for you\)$/.exec(c.msg); if (mm) return mm; } return null; }, 3000);
    assert(qm, 'the question names the counter, whose move it is and the tempo (Turn-based: no clock): ' + JSON.stringify(chats.map(c => c.msg)));
    const B = +qm[1], ok = B >= 0;   // a crypt card may carry its own intercept (Dowager-class); the deal is random, so the test reads the number the bot wrote
    eq(A.avr.mode, 'block', 'the shared counter is open in block mode');
    A.__doc._ids.hotBotBtn = el; A.botPanelOpen = true; A.botCfgOpen = false; A.botPanelRender();
    assert(/\u25b6 Declare verdict<\/button>/.test(el.innerHTML), 'the real bot\'s rung reads Declare verdict (v2.6.161: Step)');
    assert(A.botGiveWordWanted(), 'Turn-based: the play button is offered');
    const n0 = logs.length;
    eq(A.botGiveWord(), 1, 'the play button gives the bot the word');
    const vline = await until(() => logs.slice(n0).find(l => /^Block: Stealth \d+ vs Intercept -?\d+ \u2014 block (succeeds|fails)\.$/.test(l.txt)), 5000);
    assert(vline, 'the verdict line reached the client: ' + JSON.stringify(logs.slice(n0)));
    eq(vline.txt, 'Block: Stealth 0 vs Intercept ' + B + ' \u2014 block ' + (ok ? 'succeeds' : 'fails') + '.', 'declared from the counter the question named');
    eq(vline.who, 'Wallbot', 'from the BLOCKER\'s seat -- the bubble (maybeVerdictPulse) names the bot that declared it, as a human\'s Resolve names that human');
    assert(logs.slice(n0).some(l => l.who === 'Wallbot' && /block verdict declared from the table controls\.$/.test(l.txt)), 'the press is said out loud');
    if (ok) eq(await until(() => A.avr.mode === 'combat' ? 'combat' : null, 5000), 'combat', 'the counter becomes the combat counter (block -> combat, as after a bot actor\'s own verdict)');
  } finally { delete A.hotBots[2]; b.close(); A.localTable = false; HB.reset([]); A.MP_HANDLERS.log = log0; A.MP_HANDLERS.chat = chat0; A.net.roster = []; A.net.hot = null; delete A.__doc._ids.hotBotBtn; }
});
testB('v2.6.162 LIVE: a REAL bot\'s verdict clock (v0.6.204+) starts when its question reaches you -- the question arrives with no clock running, then the panel counts the seeded Standard 3 s from that moment (not less), and on the clock the blocker declares the verdict itself', async () => {
  const BOT = require('./elysium-bot.js'); const A = loadClient(CLIENT); const HB = A.hotBridge;
  if (typeof BOT.Bot.prototype._vwArm !== 'function'){ const e = new Error('SKIP -- bot v' + BOT.BOT_VERSION + ' beside the suite has no verdict wait; this needs v0.6.204+'); e.skip = true; throw e; }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const until = async (fn, ms) => { const t = Date.now(); let v = fn(); while (!v && Date.now() - t < (ms || 3000)){ await sleep(20); v = fn(); } return v; };
  HB.reset([{ name: 'You' }, { name: 'Gatebot', bot: true }]);
  A.net.roster = [{ seat: 1, name: 'You', vp: 0 }, { seat: 2, name: 'Gatebot', bot: true, vp: 0 }];
  A.net.you = 'You'; A.net.boards = {}; A.net.hot = { boards: { 1: JSON.stringify({ pool: 30 }), 2: '{}' }, undo: {} }; A.localTable = true; A.conv.tournament = false;
  HB.botcfgIn('', A.BOTCFG0);   // Standard 3 s, the seed hotSpawnBots stores before any bot joins
  const b = new BOT.Bot({ room: 'hot', pass: '', name: 'Gatebot', paceMs: 0, askSecs: 20, transport: HB.dialFor(2, 'Gatebot'), deck: BOT.ARCHETYPES.ventrue, deckName: 'ventrue', persona: 'expert', log: () => {} });
  const dec0 = b.decide.bind(b);
  b.decide = (k, ctx) => { const d = dec0(k, ctx); return k === 'block-as-target' ? Object.assign({}, d, { block: true, bounce: false, why: 'the test: block' }) : d; };
  const logs = [], qs = []; const log0 = A.MP_HANDLERS.log, chat0 = A.MP_HANDLERS.chat;
  A.MP_HANDLERS.log = m => { logs.push({ t: Date.now(), who: m.who, txt: String(m.html || '').replace(/<[^>]*>/g, '') }); return log0(m); };
  A.MP_HANDLERS.chat = m => { if (m.who === 'Gatebot' && /add stealth, or say Pass/.test(String(m.msg || ''))) qs.push({ t: Date.now(), until: A.botPanelRead(b).until, msg: String(m.msg) }); return chat0(m); };
  try {
    await b.connect(); await until(() => HB.seats[2] && HB.seats[2].deck, 6000);
    assert(HB.startFor(2), 'dealt'); await sleep(300);
    const u = b.unc.shift(); b.board.push({ id: u.id, name: u.name, kind: 'crypt', zone: 'ready', x: 0, y: 0, locked: false, faceDown: false, blood: u.cap || 5, cap: u.cap || 5 }); b.hand.length = 0; b.push();
    A.hotBots[2] = b;
    A.clearTable({}); const v = A.makeCard('Lisa', 'crypt'); A.move(v, 'ready', { x: 100, y: 60, faceDown: false }); v.blood = 3;
    HB.turn(1); await sleep(150);
    let shown = null; A.showMenu = items => { shown = items; };
    A.cardMenu(v, 0, 0); shown.find(x => x.label === 'Actions').sub.find(x => x.label === 'Bleed').sub.find(x => x && x.label === 'Bleed 2').fn();
    const q = await until(() => qs[0], 10000);
    assert(q, 'the verdict question reached the client');
    assert(/\(3s \u2192 the block (succeeds|fails)\)$/.test(q.msg), 'it announces the seeded 3 s and what happens then: ' + q.msg);
    eq(q.until, null, 'when the question arrives no clock runs yet (bot v0.6.203 and older armed a wait when its line was QUEUED)');
    const st = await until(() => { const s = A.botPanelRead(b); return s.until != null ? s : null; }, 1000);
    assert(st, 'right after the question, the clock runs');
    eq(st.step, 'resolve-verdict');
    const left = st.until - q.t; assert(left >= 2700 && left <= 3300, 'the full 3 s count from the question (' + left + ' ms)');
    const vl = await until(() => logs.find(l => /^Block: Stealth \d+ vs Intercept -?\d+ \u2014 block (succeeds|fails)\.$/.test(l.txt)), 6000);
    assert(vl, 'on the clock the blocker declares the verdict');
    eq(vl.who, 'Gatebot'); assert(/^Block: Stealth 0 vs Intercept -?\d+ \u2014 block (succeeds|fails)\.$/.test(vl.txt), vl.txt);
    assert(vl.t - q.t >= 2800, 'not before its 3 s were up (' + (vl.t - q.t) + ' ms after the question)');
  } finally { delete A.hotBots[2]; b.close(); A.localTable = false; HB.reset([]); A.MP_HANDLERS.log = log0; A.MP_HANDLERS.chat = chat0; A.net.roster = []; A.net.hot = null; }
});
/* === v2.6.163 (the 16 Oct code review, finding 1; Johan: 'kör A'): another player's name, clan and cards are escaped in attributes too === */
test('v2.6.163 escapeHtml escapes " and \' as well as & < > (and still takes null)', () => {
  eq(API.escapeHtml('a"b\'c<d>&e'), 'a&quot;b&#39;c&lt;d&gt;&amp;e');
  eq(API.escapeHtml(null), ''); eq(API.esc(undefined), '');
  eq(API.escapeHtml('Felix "Fix" Hessian'), 'Felix &quot;Fix&quot; Hessian', 'a card name with quotes (the Imbued carry them)');
});
test('v2.6.163 XSS: another player\'s name, clan and card fields reach no attribute raw, in any view (v2.6.162: a quote ended alt="..." -- the review ran script in a second tab through a board\'s clan, no click needed)', () => {
  const R = loadClient(CLIENT);
  const P1 = 'Q" data-pwn="1', P2 = "Q' data-pwn='1";   // no < or >: the server strips those, quotes it relayed (srv-2.6.46)
  R.net.status = 'in'; R.net.room = 'R'; R.net.you = 'Me'; R.net.started = true; R.net.turnSeat = 2;
  R.net.roster = [ { seat: 1, name: 'Me', vp: 0, online: true, host: true }, { seat: 2, name: P1, vp: 1, online: true }, { seat: 3, name: P2, vp: 0, online: false } ];
  R.net.watchers = 1; R.net.watcherList = [ { name: P1 } ];
  const card = (id, extra) => Object.assign({ id, name: P1, kind: 'crypt', zone: 'ready', x: 100, y: 60, blood: 2, owner: P1, controller: P2, counters: [P1] }, extra || {});
  const pub = clan => ({ pool: 30, clan, edge: false, counts: { hand: 7, library: 40, crypt: 8 }, bw: 1004, bh: 616,
    cards: [ card('c1'), card('c2', { kind: 'lib', host: 'c1', name: P2 }), card('c3', { zone: 'torpor' }) ] });
  R.net.boards = { 2: { who: P1, pub: pub(P1) }, 3: { who: P2, pub: pub(P2) } };
  const errs = [], run = (nm, fn) => { try { fn(); } catch (e) { errs.push(nm + ': ' + e.message); } };
  R.__htmlRec.start();
  for (const v of ['ov', 'l2', 'l4', 2, 3]){
    R.net.view = v;
    run('view ' + v, () => { if (v === 'ov') R.renderL3(); else if (v === 'l2') R.renderL2(); else if (v === 'l4') { R.renderL4(); R.updateL4Opponents(); R.renderL4Globes(); } else R.renderRemote(v); });
  }
  run('renderStats', () => R.renderStats()); run('renderLobby', () => R.renderLobby()); run('updateRoomBar', () => R.updateRoomBar());
  run('updateTurnText', () => R.updateTurnText()); run('sayBubble', () => R.sayBubble(P1, P1, 2, P1));
  run('previewRemote', () => R.previewRemote(card('c9'), { who: P1 }));
  const html = R.__htmlRec.stop();
  eq(errs.length, 0, 'every renderer ran under the harness: ' + errs.join(' | '));
  const bad = html.filter(h => /data-pwn=["']1/.test(h));
  const at = h => { const i = h.search(/data-pwn=["']1/); return h.slice(Math.max(0, i - 70), i + 14); };
  eq(bad.length, 0, 'a raw quote from another player reached the HTML: ' + bad.slice(0, 2).map(at).join(' || '));
  const all = html.join('\n');   // coverage: the sites the review named were drawn here -- escaped
  assert(/alt="Q&quot; data-pwn=&quot;1"/.test(all), 'a clan symbol\'s alt (the pool globe, the mat label), escaped');
  assert(/alt="Q&#39; data-pwn=&#39;1"/.test(all), 'the single-quote payload, escaped');
  assert(/title="Q&quot; data-pwn=&quot;1"/.test(all), 'a name in a title attribute (the stats row), escaped');
  assert(html.length >= 30, 'the renderers wrote HTML (' + html.length + ' writes)');
});
test('v2.6.163 the suite\'s log capture reads a line as the player does: an escaped apostrophe or quote decodes (a LIVE test failed whenever a real bot\'s hand held Wake with Evening\'s Freshness)', () => {
  const R = loadClient(CLIENT), L = captureLog(R);
  try { R.log('<b>' + R.esc("Wake with Evening's Freshness") + '</b> and <b>' + R.esc('Felix "Fix" Hessian') + '</b> & co', true); }
  finally { L.restore(); }
  assert(/Evening&#39;s/.test(L.lines[0]), 'the log line carries the entity (v2.6.163): ' + L.lines[0]);
  eq(L.text()[0], "Wake with Evening's Freshness and Felix \"Fix\" Hessian & co");
});
test('v2.6.163 a toast or a menu label is text: none is built with esc/escapeHtml (an escaped name read O&#39;Neil once quotes were escaped; the review found the log link\'s "⋖ Target:" row)', () => {
  const src = require('fs').readFileSync(CLIENT, 'utf8');
  const hits = src.match(/toast\([^;\n]*?(?:esc|escapeHtml)\(/g) || [];
  eq(hits.length, 0, 'toast() calls that escape: ' + hits.slice(0, 3).join(' | '));
  const labels = src.match(/\blabel\s*[:=]\s*[^,;\n]*?(?<![A-Za-z0-9_$.])(?:esc|escapeHtml)\(/g) || [];
  eq(labels.length, 0, 'menu labels built with escaping (renderItems sets textContent): ' + labels.slice(0, 3).join(' | '));
  const R = loadClient(CLIENT), el = { textContent: '', classList: { add(){}, remove(){} } };
  R.__doc._ids.toast = el;
  R.toast("O'Neil & Sons took a card back");
  eq(el.textContent, "O'Neil & Sons took a card back", 'toast() is textContent');
});

/* === v2.6.164 (group B of the 16 Oct code review; Johan 17 Oct: values below 0 too) === */
function sentLog(A){ const sent = []; A.net.ws = { readyState: 1, send: j => sent.push(JSON.parse(j)) }; return sent; }
testA('v2.6.164 pass() only on your own turn, online: another seat\'s turn sends nothing and moves nothing (v2.6.163 logged "Turn passed." to the table and moved its own turn while the server refused); a held key passes once until the server\'s turn arrives', async () => {
  const A = loadClient(CLIENT); const toasts = []; A.toast = m => toasts.push(String(m)); A.uiDialog = () => Promise.resolve(true);
  A.net.status = 'in'; A.net.deckUp = true; A.net.you = 'You'; A.net.roster = [{ seat: 1, name: 'You' }, { seat: 2, name: 'Bo' }];
  const sent = sentLog(A); A.state.phase = -1; const t0 = A.state.turn;
  A.net.turnSeat = 2;
  await A.pass();
  eq(sent.filter(m => m.t === 'pass' || m.t === 'log').length, 0, 'nothing on the wire: ' + JSON.stringify(sent.map(m => m.t)));
  eq(A.state.turn, t0, 'the turn did not move here');
  assert(toasts.some(t => /not your turn/.test(t) && /Bo/.test(t)), 'the toast says whose turn it is: ' + toasts.join(' | '));
  A.net.turnSeat = 1; toasts.length = 0;
  await A.pass();
  eq(sent.filter(m => m.t === 'pass').length, 1, 'my turn: one pass');
  await A.pass(); await A.pass();
  eq(sent.filter(m => m.t === 'pass').length, 1, 'a held key: still one pass while it is on its way');
  A.MP_HANDLERS.turn({ t: 'turn', seat: 1, who: 'You' });
  await A.pass();
  eq(sent.filter(m => m.t === 'pass').length, 2, 'after the server\'s turn the next pass goes out');
  assert(A.net._passPending > 0, 'set up: a pass in flight');
  A.mpLeave();
  eq(A.net._passPending, 0, 'leaving the room drops the pass in flight (the next room starts clean)');
  A.net.ws = null; A.net.status = 'off';
});
testA('v2.6.164 pass() at a hotseat during a bot\'s turn does nothing (v2.6.163 passed for the bot and the sweep never ended)', async () => {
  const A = loadClient(CLIENT); const toasts = []; A.toast = m => toasts.push(String(m)); A.uiDialog = () => Promise.resolve(true);
  const T = parityTable(A, [['You'], ['B2', true]]);
  A.state.phase = -1; const t0 = A.state.turn;
  A.net.turnSeat = 2;
  const p = A.pass();   // not awaited: v2.6.163 would hang in its sweep
  await new Promise(r => setTimeout(r, 30));
  eq(A.state.turn, t0, 'the turn did not move');
  assert(toasts.some(t => /B2 is playing/.test(t)), 'the toast names the bot: ' + toasts.join(' | '));
  await Promise.race([p, new Promise(r => setTimeout(r, 50))]);
  A.localTable = false; T.HB.reset([]); A.net.roster = []; A.net.hot = null;
});
testA('v2.6.164 the hotseat bridge clears the table tally at every turn change and tells the bots, as the server does (v2.6.163 kept a bot\'s stealth 2 into the next turn: its next block read "Stealth 2 vs Intercept 1")', async () => {
  const A = loadClient(CLIENT); A.toast = () => {};
  const T = parityTable(A, [['You'], ['B2', true], ['B3', true]]);
  A.conv.tournament = false; A.net.helperPolicy = null; A.net.turnSeat = 2;
  T.from(2, { t: 'tally', mode: 'block', a: 2 });                   // B2 acts: stealth 2 on the table
  eq(T.HB.tally && T.HB.tally.a, 2, 'set up: a stealth 2 on the table'); eq(A.avr.mode, 'block', 'and on my screen');
  A.resolvePlayedActions();                                         // my screen closes its counter by itself (I am not the turn seat: nothing goes on the wire)
  eq(A.avr.mode, null, 'my counter is closed'); eq(T.HB.tally && T.HB.tally.a, 2, 'the table\'s is not');
  T.clear();
  const sw = A.hotRunBotTurns(2, 1);                                // the turn moves on to B3 (the seats after 2, up to 1)
  await new Promise(r => setTimeout(r, 30));
  eq(T.HB.tally, null, 'the bridge\'s tally is closed at the turn change (v2.6.163: tallyStaleClose saw no counter on my screen and sent nothing)');
  assert(T.got[3].some(m => m.t === 'tally' && m.mode === null), 'and the bot whose turn it is is told (the server\'s turnTallyClear shape)');
  T.from(3, { t: 'tally', mode: 'block', b: 1 });
  eq(T.HB.tally.a, 0, 'a fresh block starts at stealth 0'); eq(T.HB.tally.b, 1);
  T.from(3, { t: 'tally', mode: 'free', a: 1, b: 1 });             // a free counter is table state too
  eq(A.avr.mode, 'free', 'set up: a free counter on my screen');
  T.from(3, { t: 'pass' }); await sw;
  T.clear();
  const sw2 = A.hotRunBotTurns(1, 3);                               // the next turn change (B2's turn)
  await new Promise(r => setTimeout(r, 30));
  eq(T.HB.tally, null, 'a free counter is closed at the turn change as well (v2.6.163: tallyStaleClose skips free mode)'); eq(A.avr.mode, null, 'on my screen too');
  assert(T.got[2].some(m => m.t === 'tally' && m.mode === null), 'B2 is told');
  T.from(2, { t: 'pass' }); await sw2;
  A.localTable = false; T.HB.reset([]); A.net.roster = []; A.net.hot = null;
});
test('v2.6.164 a hotseat hand-off restores the seat, it does not change its phase: the counter the reacting player opened survives the hand-back, the action stays played, the master bonus stays (v2.6.163: closed, resolved, 0)', () => {
  const A = loadClient(CLIENT); A.toast = () => {};
  const T = parityTable(A, [['Ann'], ['Bob'], ['B3', true]]);
  A.conv.tournament = false; A.net.helperPolicy = null; A.net.turnSeat = 1; A.net.you = 'Ann';
  A.clearTable({ keepLog: true }); A.setPhase(1); A.snapshotPlayed();
  A.state.masterBonus = 1;
  const act = A.makeCard('Some Action', 'lib'); A.move(act, 'ready', { x: 100, y: 60, faceDown: false }); act.actSt = 'played';
  A.setActivePlayer(2, { quiet: true });
  assert(A.collectPlayed().some(x => x.c.name === 'Some Action'), 'Bob, reacting, sees Ann\'s action in the Played tray (v2.6.163 re-baselined it away)');
  A.avr = A.avrFresh('block'); A.avrAdjust('b', 2); T.HB.tallyIn('Bob', 2, { mode: 'block', a: 0, b: 2 }); T.clear();
  A.setActivePlayer(1, { quiet: true });
  eq(A.state.masterBonus, 1, 'Ann\'s master bonus is hers again');
  eq((A.state.cards.get(act.id) || {}).actSt, 'played', 'her action is still played');
  eq(A.avr.mode, 'block', 'Bob\'s block counter is still open'); eq(T.HB.tally && T.HB.tally.b, 2, 'on the bridge too');
  assert(!T.got[3].some(m => m.t === 'tally' && m.mode === null), 'no bot was told the counter closed');
  A.localTable = false; T.HB.reset([]); A.net.roster = []; A.net.hot = null;
});
testA('v2.6.164 an oust reaches the server whatever the award setting: award:false when it is off (v2.6.163 sent nothing -- the seat stayed in the turn order); an older server, which would pay anyway, keeps v2.6.163\'s behaviour and the player is told', async () => {
  const A = loadClient(CLIENT); A.toast = () => {}; A.uiDialog = () => Promise.resolve(true);
  const sent = sentLog(A);
  A.net.status = 'in'; A.net.deckUp = true; A.net.roster = [{ seat: 1, name: 'Me' }, { seat: 2, name: 'Pred' }]; A.net.you = 'Me';
  A.clearTable({ keepLog: true }); A.move(A.makeCard('V', 'crypt'), 'ready', { x: 50, y: 50, faceDown: false });
  A.conv.poolToPredator = false;
  await A.ousted({});
  const b1 = sent.filter(m => m.t === 'bounty');
  eq(b1.length, 1, 'the oust is sent'); eq(b1[0].award, false, 'with award:false');
  sent.length = 0; A.conv.poolToPredator = true;
  A.move(A.makeCard('V2', 'crypt'), 'ready', { x: 60, y: 60, faceDown: false });
  await A.ousted({});
  const b2 = sent.filter(m => m.t === 'bounty');
  eq(b2.length, 1); assert(!('award' in b2[0]), 'the setting on: the plain bounty, as before');
  const L = captureLog(A);
  try {
    A.conv.poolToPredator = false; A.net.srvV = '2.6.47'; sent.length = 0;
    A.move(A.makeCard('V3', 'crypt'), 'ready', { x: 70, y: 70, faceDown: false }); await A.ousted({});
    eq(sent.filter(m => m.t === 'bounty').length, 0, 'an older server reads no `award` and would pay the full bounty: nothing is sent, as v2.6.163 (the review: a table that settles by hand was paid twice)');
    assert(L.text().some(t => /^The oust was not sent: this server \(v2\.6\.47\) pays the bounty with every oust, and your automatic award is off\. Leaving it to the table needs server v2\.6\.48 or newer; until then the host can pass your turns\.$/.test(t)), 'and the player is told why (' + JSON.stringify(L.text().slice(0, 3)) + ')');
    L.lines.length = 0; A.net.srvV = '2.6.48'; sent.length = 0;
    A.move(A.makeCard('V4', 'crypt'), 'ready', { x: 80, y: 80, faceDown: false }); await A.ousted({});
    eq(sent.filter(m => m.t === 'bounty' && m.award === false).length, 1, 'srv-2.6.48 reads the field: award:false goes out');
    assert(!L.text().some(t => /was not sent/.test(t)), 'and no note');
  } finally { L.restore(); }
  A.net.ws = null; A.net.status = 'off'; A.net.roster = [];
});
test('v2.6.164 the Block counter goes below 0 (the rulebook; Johan 17 Oct): the counter, an incoming tally, the bridge, the verdict line and its bubble -- votes and damage still stop at 0', () => {
  const A = loadClient(CLIENT);
  eq(A.tallyClamp('block', -3), -3); eq(A.tallyClamp('block', -120), -99); eq(A.tallyClamp('vote', -1), 0); eq(A.tallyClamp('combat', -1), 0); eq(A.tallyClamp('free', -1), 0);
  A.avr = A.avrFresh('block'); A.avrAdjust('b', -1);
  eq(A.avr.b, -1, 'the counter\'s minus goes below 0');
  A.avr = A.avrFresh('vote'); A.avrAdjust('a', -1);
  eq(A.avr.a, 0, 'a vote does not');
  A.MP_HANDLERS.tally({ t: 'tally', mode: 'block', a: 0, b: -1 });
  eq(A.avr.b, -1, 'an incoming block keeps its negative intercept');
  eq(A.AVR_DEFS.block.line(0, -1), 'Block: Stealth 0 vs Intercept -1 — block fails.', 'and the verdict follows the rule');
  assert(A.maybeVerdictPulse('Block: Stealth 0 vs Intercept -1 — block fails.', 'Bot', 2), 'the bubble reads a negative number (VERDICT_RE)');
  const T = parityTable(A, [['You'], ['B2', true]]);
  T.from(2, { t: 'tally', mode: 'block', b: -1 });
  eq(T.HB.tally.b, -1, 'the bridge keeps it'); assert(T.got[2].some(m => m.t === 'tally' && m.b === -1), 'and relays it to the bots');
  A.localTable = false; T.HB.reset([]); A.net.roster = []; A.net.hot = null; A.avr = A.avrFresh(null);
});
test('v2.6.164 the hotseat bridge relays boards as the server would: no deck name, no face-down card\'s name, no card outside the public zones -- a human\'s to the bots, a bot\'s to the human and the others (v2.6.163 relayed both raw)', () => {
  const A = loadClient(CLIENT); A.toast = () => {};
  const T = parityTable(A, [['You'], ['B2', true], ['B3', true]]);
  A.clearTable({ keepLog: true }); A.state.deckName = 'My Secret Deck';
  const h = A.makeCard('Secret Vampire', 'crypt'); A.move(h, 'uncontrolled', { x: 30, y: 20, faceDown: true });
  const o = A.makeCard('Open Vampire', 'crypt'); A.move(o, 'ready', { x: 90, y: 20, faceDown: false });
  A.hotPushBoardNow();
  const pb = (T.got[2].filter(m => m.t === 'board').pop() || {}).pub || {};
  eq(pb.deckName, '', 'no deck name');
  const ch = (pb.cards || []).find(c => c.id === h.id), co = (pb.cards || []).find(c => c.id === o.id);
  assert(ch && ch.name === undefined, 'the face-down card carries no name'); eq(co && co.name, 'Open Vampire', 'a face-up card keeps its name');
  T.clear();
  T.from(2, { t: 'board', pub: { deckName: 'Bot Deck', pool: 30, cards: [{ id: 'b1', name: 'Hidden', kind: 'crypt', zone: 'uncontrolled', faceDown: true }, { id: 'b2', name: 'Shown', kind: 'crypt', zone: 'ready' }, { id: 'b3', name: 'InHand', kind: 'lib', zone: 'hand' }] } });
  const seen = (A.net.boards[2] || {}).pub || {};
  eq(seen.deckName, '', 'the human sees no bot deck name');
  eq((seen.cards || []).map(c => c.id + ':' + (c.name || '-')).join(','), 'b1:-,b2:Shown', 'no face-down name, no hand card');
  const relay = (T.got[3].filter(m => m.t === 'board').pop() || {}).pub || {};
  eq((relay.cards || []).map(c => c.id + ':' + (c.name || '-')).join(','), 'b1:-,b2:Shown', 'the other bot sees the same');
  A.localTable = false; T.HB.reset([]); A.net.roster = []; A.net.hot = null;
});
testA('v2.6.164 my counter click survives a write that lands inside its 120 ms debounce (v2.6.163 replaced it and then sent the other side\'s numbers); leaving a hotseat table closes the counter', async () => {
  const A = loadClient(CLIENT); A.toast = () => {};
  const T = parityTable(A, [['You'], ['B2', true]]);
  A.conv.tournament = false; A.net.helperPolicy = null; A.net.turnSeat = 1;
  T.from(2, { t: 'tally', mode: 'block', a: 0, b: 0 });
  A.avrAdjust('a', 1);
  T.from(2, { t: 'tally', mode: 'block', b: 1 });
  eq(A.avr.a, 1, 'my +1 stealth is still on my screen'); eq(A.avr.b, 1, 'beside the bot\'s +1 intercept');
  await new Promise(r => setTimeout(r, 250));
  eq(T.HB.tally.a, 1, 'and the debounce sent it'); eq(T.HB.tally.b, 1);
  eq(A._avrDirty, null, 'nothing left pending');
  A.avr = A.avrFresh('vote'); A.avr.a = 3;
  A.leaveHotseat();
  eq(A.avr.mode, null, 'no table, no counter (v2.6.163 kept a vote 3/1)');
  T.HB.reset([]); A.net.roster = []; A.net.hot = null;
});

testA('v2.6.164 (the review) a pass that waited on the bots\' sweep does not outlive its table: leave mid-sweep and every later pass still works (the first build said "The bell is already ringing." until a reload)', async () => {
  const A = loadClient(CLIENT); const toasts = []; A.toast = m => toasts.push(String(m)); A.uiDialog = () => Promise.resolve(true);
  const T = parityTable(A, [['You'], ['B2', true]]);
  A.offlineCfg = [{ name: 'You' }, { name: 'B2', botP: true }];
  A.state.phase = -1; A.net.turnSeat = 1;
  A.pass();                                                          // my turn: the sweep hands B2 the turn and waits for its pass
  await new Promise(r => setTimeout(r, 50));
  assert(T.got[2].some(m => m.t === 'turn'), 'set up: the bot holds the turn');
  eq(A.passBlockedWhy(), 'The bell is already ringing.', 'while the sweep runs, a second pass waits');
  A.leaveHotseat();                                                  // the human gives up on the slow bot
  eq(A._passBusy, 0, 'the table took its pass with it');
  eq(A.passBlockedWhy(), null, 'a solo table may pass');
  const t0 = A.state.turn; await A.pass();
  eq(A.state.turn, t0 + 1, 'and does');
});
test('v2.6.164 (the review) my seat is a seat I hold: an open seat keeps its leaver\'s name, so a name match must skip it (srv-2.6.48 vacates on a leave; the first build found the empty seat and refused my own pass)', () => {
  const A = loadClient(CLIENT); A.toast = () => {};
  A.net.status = 'in'; A.net.you = 'P2';
  A.net.roster = [{ seat: 1, name: 'P1' }, { seat: 2, name: 'P2', vacant: true }, { seat: 3, name: 'P3' }, { seat: 4, name: 'P2' }];
  eq(A.mySeat(), 4, 'the seat P2 holds, not the open seat with the old name');
  eq(A.rosterMe().seat, 4);
  A.net.turnSeat = 4; eq(A.passBlockedWhy(), null, 'so my own turn is mine');
  A.net.roster = [{ seat: 1, name: 'P1' }, { seat: 2, name: 'P2', vacant: true }];
  eq(A.mySeat(), 0, 'a spectator whose old seat is open holds no seat');
  A.net.status = 'off'; A.net.roster = [];
});
testA('v2.6.164 (the review) the unsent-click memory lives only while a send is pending: a spectator\'s click, a resolve inside the debounce, a mode change and a turn change all end it (the first build froze later counters and wrote them back over the table)', async () => {
  const A = loadClient(CLIENT); A.toast = () => {}; A.uiDialog = () => Promise.resolve(true);
  A.net.status = 'in'; A.net.deckUp = true; A.net.roster = [{ seat: 1, name: 'Ann' }, { seat: 2, name: 'Bob' }];
  let sent = sentLog(A);
  // a referee / spectator: the click is never sent, so it is never "unsent"
  A.net.spect = true; A.net.you = 'Ref';
  A.MP_HANDLERS.tally({ t: 'tally', who: 'Ann', mode: 'block', a: 0, b: 0 });
  A.avrAdjust('a', 1);
  eq(A._avrDirty, null, 'no memory for a click that is never sent');
  A.MP_HANDLERS.tally({ t: 'tally', who: 'Ann', mode: 'block', a: 3, b: 0 });
  eq(A.avr.a, 3, 'the table\'s 3 shows (the first build kept the stray 1)');
  // a seated player clicks and resolves at once
  A.net.spect = false; A.net.you = 'Bob'; A.net.turnSeat = 1;
  A.MP_HANDLERS.tally({ t: 'tally', who: 'Ann', mode: null, a: 0, b: 0 });
  A.MP_HANDLERS.tally({ t: 'tally', who: 'Ann', mode: 'block', a: 0, b: 0 });
  A.avrAdjust('b', 1);
  assert(A._avrDirty && A._avrDirty.b === 1, 'set up: a click waiting for its send');
  A.avrResolve();
  eq(A._avrDirty, null, 'the resolve drops the pending send and what it carried');
  for (const m of [{ a: 0, b: 0 }, { a: 1, b: 0 }, { a: 1, b: 1 }, { a: 1, b: 2 }]) A.MP_HANDLERS.tally(Object.assign({ t: 'tally', who: 'Cy', mode: 'block' }, m));
  eq(A.avr.b, 2, 'a later block shows the table\'s 2 (the first build kept 1)');
  sent.length = 0; A.avrAdjust('a', 1);
  await new Promise(r => setTimeout(r, 250));
  const push = sent.filter(m => m.t === 'tally').pop();
  assert(push && push.a === 2 && push.b === 2, 'my next push carries the table\'s intercept, not my old 1: ' + JSON.stringify(push));
  // a mode change in the message ends the memory
  A.avrAdjust('a', 1); A.MP_HANDLERS.tally({ t: 'tally', who: 'Cy', mode: 'vote', a: 4, b: 0 });
  eq(A._avrDirty, null, 'a mode change ends it'); eq(A.avr.a, 4);
  // a click older than the debounce is no longer "unsent"
  A.MP_HANDLERS.tally({ t: 'tally', who: 'Cy', mode: 'block', a: 0, b: 0 });
  A.avrAdjust('a', 1); A._avrDirty.at -= 1000;
  A.MP_HANDLERS.tally({ t: 'tally', who: 'Cy', mode: 'block', a: 0, b: 1 });
  eq(A.avr.a, 0, 'a stale memory does not override the table');
  A.avrSendCancel(); A.net.ws = null; A.net.status = 'off'; A.net.roster = [];
  // at a hotseat the turn change cancels a pending send, so the old counter cannot ride into the next turn
  const B = loadClient(CLIENT); B.toast = () => {};
  const T = parityTable(B, [['You'], ['B2', true]]);
  B.conv.tournament = false; B.net.helperPolicy = null; B.net.turnSeat = 1;
  T.from(2, { t: 'tally', mode: 'block', a: 2 });
  B.avrAdjust('b', 1);
  B.hotTurnTallyClear();
  await new Promise(r => setTimeout(r, 250));
  eq(T.HB.tally, null, 'the turn change closed the table tally, and no late debounced push reopened it');
  B.localTable = false; T.HB.reset([]); B.net.roster = []; B.net.hot = null;
});
test('v2.6.164 (the review) the first human\'s turn after the opening sweep starts clean, as every later turn does: the bridge\'s tally closes and the bots are told', () => {
  const A = loadClient(CLIENT); A.toast = () => {};
  const T = parityTable(A, [['B1', true], ['You']]);
  A.conv.tournament = false; A.net.helperPolicy = null; A.net.turnSeat = 1;
  T.from(1, { t: 'tally', mode: 'block', a: 2 });                    // the sweep's last bot left a stealth on the table
  T.clear();
  A.hotFirstHumanTurn(2);
  eq(A.net.turnSeat, 2); eq(T.HB.tally, null, 'closed');
  assert(T.got[1].some(m => m.t === 'tally' && m.mode === null), 'and the bot is told');
  A.localTable = false; T.HB.reset([]); A.net.roster = []; A.net.hot = null;
});
testA('v2.6.164 (the review) at a hotseat an un-oust takes back the VP its oust paid, as srv-2.6.48 does, and an oust pays once', async () => {
  const A = loadClient(CLIENT); A.toast = () => {}; A.uiDialog = () => Promise.resolve(true);
  const T = parityTable(A, [['Ann'], ['Bob'], ['B3', true]]);
  A.conv.poolToPredator = true; A.net.turnSeat = 1; A.net.you = 'Bob';
  A.clearTable({ keepLog: true }); A.move(A.makeCard('V', 'crypt'), 'ready', { x: 50, y: 50, faceDown: false });
  await A.ousted({});
  const ann = A.net.roster.find(q => q.name === 'Ann'), bob = A.net.roster.find(q => q.name === 'Bob');
  eq(ann.vp, 1, 'Bob falls: Ann, his predator, gets the VP'); eq(bob.vpSeat, 1, 'remembered');
  A.move(A.makeCard('V2', 'crypt'), 'ready', { x: 60, y: 60, faceDown: false });
  await A.ousted({});
  eq(ann.vp, 1, 'a second oust of an ousted seat pays nothing');
  A.unoustHot();
  eq(bob.out, false); eq(ann.vp, 0, 'the un-oust takes the VP back'); eq(bob.vpSeat, 0);
  A.hostOustHot(3); const b3 = A.net.roster.find(q => q.seat === 3);
  eq(bob.vp, 1, 'B3 falls: Bob, its live predator, is paid');
  A.hostUnoustHot(3); eq(bob.vp, 0, 'the host\'s un-oust takes it back'); eq(b3.vpSeat, 0);
  A.localTable = false; T.HB.reset([]); A.net.roster = []; A.net.hot = null;
});

/* ---------- async sections run after the sync battery, then the summary ---------- */
(async () => {
  for (const [name, fn] of asyncTests){
    try { await fn(); pass++; console.log('  \u2713 ' + name); }
    catch (e){ if (e && e.skip){ skipped++; console.log('  \u25cb ' + name + '\n       ' + e.message); continue; }
               fail++; failed.push(name); console.log('  \u2717 ' + name + '\n       ' + (e.message || e)); }
  }
  console.log('\n' + pass + ' passed, ' + fail + ' failed' + (skipped ? ', ' + skipped + ' skipped (need elysium-bot.js)' : '') + (fail ? '  - ' + failed.join(', ') : ''));
  process.exit(fail ? 1 : 0);
})();


