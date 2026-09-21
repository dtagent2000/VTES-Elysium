#!/usr/bin/env node
(function(){                                    // v0.6.97 (LEXICAL ARMOR): the whole bot lives in one IIFE -- see the BOT_VERSION note
'use strict';
/* ============================================================================
   elysium-bot.js — "Trainbot" (v0.1.0 M1 skeleton, 11 July 2026 → v0.5.0,
   13 July 2026 — masters/hunt/pool economy, §7.6 of elysium-bot-spec.md)

   A headless Elysium client that takes a real seat and plays a deliberately
   simple game of VTES. Zero dependencies, single file — a sibling of
   elysium-server.js in spirit. Protocol family 2.6 (see ELYSIUM-PROTOCOL.md).

   WHAT IT IS:  a sparring dummy / seat filler / deck-flow tester
                (the Succubus Club "Trainbot" ambition level).
   WHAT IT IS NOT: a competitive opponent. Full rules enforcement, deep
                politics and hidden-info inference beyond the honest §7
                read are explicit non-goals — see elysium-bot-spec.md §7
                (M3 is deliberately never coming).

   USAGE:
     node elysium-bot.js --server ws://127.0.0.1:8123 --room Fangs \
                         --pass secret --name Trainbot [--seat 2] \
                         [--deck my-playbook.json] [--ask-secs 25]

   THE SANDBOX CONTRACT (why the chat grammar exists):
   Elysium enforces no rules — the table is the referee. The bot's OWN turns
   need nobody's help (it moves its own cards, adjusts its own pool, and its
   `board` push shows everyone the result). INCOMING actions have no
   structured event, so the table talks to the bot in chat:

       bleed 2        the bot takes 2 pool damage (it self-adjusts + pushes)
       vote 3         same, from a referendum
       block  / no    answers to the bot's own "Block?" questions
       rush ...       politely declined (multi-round press/rush stays out of
                      scope — M2's combat module v1 is one round, announce-only)

   The bot's announces always carry the mechanical fact, so the table never
   has to guess what just happened.

   PLAYBOOK: a deck JSON with annotated crypt capacities —
       { "name": "...", "crypt": [{"name","qty","cap"}], "library": [{"name","qty"}] }
   The server never validates names; caps drive the influence schedule.
   Card FACTS (disciplines, costs, fx, and now per-mode `phase` timing for
   passive income) live in the shared elysium-cardfx.json library, not here —
   playbooks stay the interface for WHICH cards/personas, never card rules.

   TURN ENGINE (correct VTES phase order; each phase self-announces via
   `_announcePhase` — ALWAYS, since v0.6.113 — with the same
   `log('Phase: <b>X</b>.')` a human's Structured phase-bar helper sends):
     Unlock (unlocks all + Edge cash-in + Vessel-class income) →
     Master (plays known income assets — Blood Doll/Vessel — one action,
             +1 bonus if a trifle was played, + Blood-Doll-class income) →
     Minion (mandatory hunt at 0 blood, else bleed OR a persona-weighted
             voluntary hunt; every ready unlocked vampire acts once) →
     Influence (real opening-transfer stagger: min(4, seat) on the first turn) →
     Discard (one dead card cycled — a master is judged like any other card
              now that Master can play the known income assets) → pass
   ========================================================================= */

/* v0.6.94 (HB0): the environment gate. The four Node builtins power ONLY the
   edges -- wsConnect/wsFrame (transport), loadCardfx/parseArgs (file reads),
   and the CLI main. Every edge is injectable (o.transport, o.cardfxData) or
   CLI-only, so the CORE never touches them; guarded requires let this SAME
   file load in a browser -- the single-source rule: no browser fork, ever.  */
const IS_NODE = typeof process !== 'undefined' && !!(process.versions && process.versions.node);
const net    = IS_NODE ? require('net')    : null;
const http   = IS_NODE ? require('http')   : null;
const crypto = IS_NODE ? require('crypto') : null;
const fs     = IS_NODE ? require('fs')     : null;

const BOT_VERSION = '0.6.151'; // v0.6.151 (21 Sep 2026, MAIN'S PARITY HANDOVER -- two findings in the bot, both confirmed): (B1) _onGiven looked for the host vampire by NAME but the wire carries its CARD ID, so a human's Fame / Pentex dropped on a bot's vampire never armed the famed / no-block hooks, online or offline -- id first now, name as the fallback. (B2) _oust() published the pool-0 board BEFORE sending `bounty`; against a bridge that relays bounty (client >= v2.6.122) the v0.6.147 no-server net therefore still did the relay's job -- `bounty` goes first now and the net sleeps there (it still works behind an older bridge). Hotseat tool / gate v1.1.0: the sweep follows the bridge's own roster, arm `nohold`, H8 demands a DORMANT net when the bridge relays bounty. Open by Johan's ruling: no un-oust receiver (main's B4) until feedback asks for it. No other decision logic changed.
// v0.6.119c (18 Sep 2026, THE STRATEGY LAYER -- B2 step 3, elysium-bot-strategy-layer-spec.md): layer 3 of Johan's four-layer model as ONE plan per turn -- this.plan = { phase build/mid/end, posture lunge/hold/build/race, target, home, floor, reads } built by _strategize() at unlock and at the minion head from the table model + my own offensive ledger (_myForecast: best bleed per body, hand cards counted once, x my measured hit rate; preyTto = prey pool / forecast). Consumers, the ONLY places tactics read it: _keepBlocker (plan.home: inside the horizon H = 3, the SMALLEST number of bodies whose expected blocks buy one whole predator turn -- 119's first cut, EV per body, held racing decks home and was replaced after serie-b2s3 -- the grinding quota as floor while the predator reaches me inside 2H, lunge = 0), the influence loop + planner (_poolFloorEff: one expected predator turn of pool, x1.25 -- computed and emitted, consumed only with o.planFloor after the two series showed no gain), the action scorer (offW on bleed/pd/card/creep, econW on equip/fetch/recruit/strength/peek, the structural stock pick yields at preyTto <= 1.5), the rush scorer (target.dir x1.25 for a disabling deck whose predator reaches it inside H). NO persona term inside (debt 2): three personas read the same plan. One emit: `plan`. Section 93 (diag-93.js). Null point: serie-b2null-all.
// v0.6.118d (18 Sep, pre-B2 clean-up): action classes in the per-minion ledger (offensive / economy / utility, _actionClass) -- the forecast's hit rate divides blocked by OFFENSIVE actions only; default hit 0.75 (measured). Calibration note in oppForecast.
// v0.6.118c (18 Sep, pre-flight): Underbridge Stray costs 1 blood (Johan's ruling; curated + recruit finder gates/pays blood at announce); suite fixture 5c announces stealth 1 (the latent shuffle flake).
// v0.6.118b (17 Sep, B2 step 2a, same day -- THE HOME QUOTA): a GRINDING deck (tremere's bounce, a wall's intercept) keeps 1 body home by design (2 at >= 4 ready) -- serie-b2s1 read 'no unlocked body' in 27 of tremere's 46 windows: the intercept cards were never the bottleneck, the bodies were; the acting order now puts the WORST blocker first so the body kept is the one worth keeping (_blockerWorth); the lunge exception (prey <= 4) still wins. The nosferatu hypothesis was REJECTED by the traces (torpor 1/0/2 across the series; Shark-2 won by bleeding 42 and 31 through, not by punishing blockers).
// v0.6.118 (17 Sep 2026, THE TABLE MODEL -- B2's foundation, elysium-bot-table-model-spec.md, Johan's three answers of 17 Sep): one public-information record per opponent seat (this.opp[seat]: crypt clans/disciplines/equipment from the pubs, the full fx-key vocabulary from face-up clones + THE ASH DIFF, per-minion action/bleed/blocked ledger from the L12 announces + verdicts, announced stealth from the tallies, my own combat wounds) with prior-blended reads: oppCombat, oppStealth, oppCombatCost (blood + P(torpor) x rescue), oppForecast (per-minion avg bleed x hit rate), turnsToOust (pool / forecast, the 6-8 oust range raising it), oppAxes (fx-key archetype signature + confidence), oppPosture, predatorIsBleeder; _oppPrior is the slot the TWDA archetype table fills later. B2 STEP 1 on top of it: (a) THE BARE BLOCK -- the `icp <= 0` return no longer closes a stealth-0 window when an unlocked body stands; EV = pool damage stopped - oppCombatCost, persona knob bareBlock (novice off / grinder chump / shark any), desperation (turnsToOust <= 1) overrides; (b) urgency computed before that gate; (c) KEEP A BLOCKER -- the last unlocked body stays home when the predator is a bleeder and turnsToOust is within the persona's limit, unless the prey is at lunge range. block-eval emits carry the model reads (forecast/tto/oppCombat/oppStealth/axes) for calibration; a keep-blocker emit. readP() untouched (reads[seat].seen is the model's seen). Section 92 (diag-92.js). Null point: serie-5p30/match-1-mu5fgte0 (prey 0/11 T1 blocks vs stealth 0).
const WIRE_V      = '2.6.0';       // sent as `v` in create/join: verMM(major.minor) must match the server family or every join prints a mismatch sys line
const MAX_MSG     = 256 * 1024;    // mirror of the server's inbound cap

/* ---------- Minimal RFC 6455 client (mirrors the server's wsAttach) ------ */
/* Client→server frames are ALWAYS masked (RFC 6455 §5.3). Our own server
   tolerates unmasked, but any strict proxy/tunnel in front of it will not. */
function wsFrame(op, payload){
  const mask = crypto.randomBytes(4);
  const len  = payload.length;
  let head;
  if(len < 126){
    head = Buffer.from([0x80 | op, 0x80 | len]);
  } else if(len < 65536){
    head = Buffer.alloc(4);
    head[0] = 0x80 | op; head[1] = 0x80 | 126; head.writeUInt16BE(len, 2);
  } else {
    head = Buffer.alloc(10);
    head[0] = 0x80 | op; head[1] = 0x80 | 127;
    head.writeUInt32BE(0, 2); head.writeUInt32BE(len, 6);
  }
  const body = Buffer.from(payload);                 // copy — we XOR in place
  for(let i = 0; i < body.length; i++) body[i] ^= mask[i & 3];
  return Buffer.concat([head, mask, body]);
}

/* wsConnect(url, cb) -> handle. cb: { open(), msg(text), close(err?) }
   handle: { send(obj), close() }                                          */
function wsConnect(url, cb){
  const u = new URL(url);
  if(u.protocol !== 'ws:')
    throw new Error('Only ws:// is supported by the bot (run it next to the server; a tunnel terminates TLS before the server anyway).');
  const key = crypto.randomBytes(16).toString('base64');
  const req = http.request({
    host: u.hostname, port: u.port || 8123, path: u.pathname || '/',
    headers: {
      'Connection': 'Upgrade', 'Upgrade': 'websocket',
      'Sec-WebSocket-Key': key, 'Sec-WebSocket-Version': '13'
    }
  });
  const handle = { sock: null, closed: false,
    send(obj){ if(this.sock && !this.closed) try{ this.sock.write(wsFrame(0x1, Buffer.from(JSON.stringify(obj)))); }catch(e){} },
    close(){ if(this.sock && !this.closed){ this.closed = true; try{ this.sock.write(wsFrame(0x8, Buffer.alloc(0))); this.sock.end(); }catch(e){} } }
  };
  req.on('upgrade', (res, sock, head) => {
    const expect = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    if(res.headers['sec-websocket-accept'] !== expect){ sock.destroy(); return cb.close(new Error('bad Sec-WebSocket-Accept')); }
    handle.sock = sock;
    sock.setNoDelay(true);
    /* Incremental parser — the same shape as the server's wsAttach:
       chunked TCP, 16/64-bit lengths, fragmentation, ping/pong, close. */
    let buf = head && head.length ? Buffer.from(head) : Buffer.alloc(0);
    let frags = [], fragOp = 0;
    const feed = d => {
      buf = Buffer.concat([buf, d]);
      while(true){
        if(buf.length < 2) break;
        const b0 = buf[0], b1 = buf[1];
        const fin = (b0 & 0x80) !== 0, op = b0 & 0x0f, masked = (b1 & 0x80) !== 0;
        let len = b1 & 0x7f, off = 2;
        if(len === 126){ if(buf.length < 4) break; len = buf.readUInt16BE(2); off = 4; }
        else if(len === 127){
          if(buf.length < 10) break;
          const hi = buf.readUInt32BE(2); len = buf.readUInt32BE(6); off = 10;
          if(hi !== 0 || len > MAX_MSG){ handle.close(); return cb.close(new Error('oversize frame')); }
        }
        if(len > MAX_MSG){ handle.close(); return cb.close(new Error('oversize frame')); }
        let mask = null;
        if(masked){ if(buf.length < off + 4) break; mask = buf.subarray(off, off + 4); off += 4; }
        if(buf.length < off + len) break;
        const payload = Buffer.from(buf.subarray(off, off + len));
        buf = buf.subarray(off + len);
        if(mask) for(let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
        if(op === 0x8){ handle.closed = true; try{ sock.end(); }catch(e){} return cb.close(); }
        else if(op === 0x9){ try{ sock.write(wsFrame(0xA, payload)); }catch(e){} }   // server pings every 30 s; the pong is what keeps our seat alive past the 75 s reaper
        else if(op === 0xA){ /* pong — nothing to do */ }
        else if(op === 0x1 || op === 0x2 || op === 0x0){
          if(op !== 0x0){ fragOp = op; frags = [payload]; } else frags.push(payload);
          if(frags.reduce((s, f) => s + f.length, 0) > MAX_MSG){ handle.close(); return cb.close(new Error('oversize message')); }
          if(fin){ const whole = Buffer.concat(frags); frags = []; if(fragOp === 0x1) cb.msg(whole.toString('utf8')); }
        }
      }
    };
    sock.on('data', feed);
    sock.on('error', e => { if(!handle.closed){ handle.closed = true; cb.close(e); } });
    sock.on('close', () => { if(!handle.closed){ handle.closed = true; cb.close(); } });
    cb.open();
  });
  req.on('error', e => cb.close(e));
  req.end();
  return handle;
}

/* ---------- The default playbook (SAMPLE — flavour, not a tuned deck) ----
   Real card names so KRCG images render at the table; capacities annotated
   by hand and only used for the influence schedule. The M1 playbook pass
   replaces this with a curated TWDA-derived list + per-card roles.         */
const DEFAULT_DECK = {
  name: 'Trainbot: Leveraging my Hacking Skills',
  crypt: [
    { name: 'Christine Boscacci', qty: 1, cap: 2 },
    { name: 'Mustafa Rahman',     qty: 1, cap: 2 },
    { name: 'New Blood',          qty: 1, cap: 2 },
    { name: 'Ohanna',             qty: 1, cap: 2 },
    { name: 'Samson',             qty: 1, cap: 2 },
    { name: 'Anarch Convert',     qty: 1, cap: 1 },
    { name: 'Antoinette DuChamp', qty: 1, cap: 1 },
    { name: 'Franciscus',         qty: 1, cap: 1 },
    { name: 'Julius',             qty: 1, cap: 1 },
    { name: 'Navar McClaren',     qty: 1, cap: 1 },
    { name: 'Royce',              qty: 1, cap: 1 },
    { name: 'Smudge the Ignored', qty: 1, cap: 1 }
  ],
  library: [
    { name: 'Ashur Tablets',                qty: 6 },
    { name: 'Effective Management',         qty: 6 },
    { name: 'Information Highway',          qty: 2 },
    { name: 'Parthenon, The',               qty: 2 },
    { name: 'Computer Hacking',             qty: 20 },
    { name: 'Leverage',                     qty: 9 },
    { name: 'Deflection',                   qty: 4 },
    { name: 'Wake with Evening\'s Freshness', qty: 3 },
    { name: 'Dodge',                        qty: 10 }
  ]
};

/* steg "archetypes" (16 July 2026, backlog "Four focused archetypes"): the second
   registered playbook -- an AUS wall. Its JOB in the arena is the coverage the
   mirror matches can never produce: intercept -> real BLOCKS -> combat -> dodge.
   Composition rules honoured: every card's compiled entry source-verified; no
   dead cardboard (Telepathic Misdirection deliberately EXCLUDED: its bounce mode
   is AUS-superior and this all-basic-aus weenie crypt could never play it --
   the same discipline-mismatch class the old sample deck's Obfuscate bug had);
   crypt is group-legal (G1+G2 neighbours only, caps 1-3, avg ~2.7 -- a slower,
   thicker board than hacking's 1.4, thematically right for a wall). */
const WALL_DECK = {
  name: 'Trainbot: First Wall (sample)',
  crypt: [
    { name: 'Franciscus',        qty: 1, cap: 1 },
    { name: 'Brazil',            qty: 1, cap: 2 },
    { name: 'Dieter Kleist',     qty: 1, cap: 2 },
    { name: 'Ashlesha',          qty: 1, cap: 3 },
    { name: 'Blythe Candeleria', qty: 1, cap: 3 },
    { name: 'Colin Flynn',       qty: 1, cap: 3 },
    { name: 'Dan Murdock',       qty: 1, cap: 3 },
    { name: 'Dollface',          qty: 1, cap: 3 },
    { name: 'Dr. John Casey',    qty: 1, cap: 3 },
    { name: 'Isabel de Leon',    qty: 1, cap: 3 },
    { name: 'Tsigane',           qty: 1, cap: 3 },
    { name: 'Z\u00f6e',            qty: 1, cap: 3 }
  ],
  library: [
    { name: 'Enhanced Senses',   qty: 10 },   // aus +1 / AUS +2 intercept
    { name: 'Eyes of Argus',     qty: 8 },    // aus +2 intercept (the AUS wake mode is unreachable with this crypt -- but the BASIC mode is the deck's best intercept, so the card earns its slot regardless)
    { name: 'Precognition',      qty: 6 },    // aus +1 intercept (AUS adds prevent -- unreachable, same note)
    { name: 'Forced Awakening',  qty: 6 },    // wake, discipline-free
    { name: 'Dodge',             qty: 12 },   // the combat answer, discipline-free
    { name: 'Computer Hacking',  qty: 14 },   // the offense, discipline-free
    { name: 'Blood Doll',        qty: 4 }     // master economy
  ]
};

/* fas A (16 July 2026): the third archetype -- Johan's real Nosferatu antitribu
   weenie stealth-bleed variant, offered as the stealth test vehicle for the
   contested-ladder/fails-branch coverage. Source-verified card by card against
   vtes.json; Marked Path/Elder-Imp-superior/Perfectionist/Wider View curated
   note-only (misplay-dangerous or consumer-less -- honest dead weight beats
   misplay); Inside Dirt x15 known-inert until the pool-damage consumer (fas B).
   Crypt G4+G5 legal, superior OBF on 4/12. NOTE: Johan's paste header said 80
   library cards but the section sums give 76 -- registered as listed (legal
   60-90), flagged in the journal. */
const SEWER_DECK = {
  name: 'Nosferatu Weenie Stealth (Johan)',
  crypt: [
    { name: 'Frank Litzpar',   qty: 1, cap: 5 },
    { name: 'Skidmark',        qty: 1, cap: 5 },
    { name: 'Skulk',           qty: 2, cap: 4 },
    { name: 'Aaron Bathurst',  qty: 1, cap: 4 },
    { name: 'Lubomira Hradok', qty: 2, cap: 3 },
    { name: 'Blister',         qty: 1, cap: 3 },
    { name: 'Bloodfeud',       qty: 2, cap: 2 },
    { name: 'Old Neddacka',    qty: 2, cap: 2 }
  ],
  library: [
    { name: 'Dreams of the Sphinx',   qty: 3 },
    { name: 'Life in the City',       qty: 4 },
    { name: 'Information Highway',    qty: 1 },
    { name: 'Perfectionist',          qty: 2 },
    { name: 'Vessel',                 qty: 4 },
    { name: 'Effective Management',   qty: 2 },
    { name: 'Wider View',             qty: 1 },
    { name: 'Inside Dirt',            qty: 15 },
    { name: 'Night Moves',            qty: 15 },
    { name: 'Cloak the Gathering',    qty: 2 },
    { name: 'Elder Impersonation',    qty: 2 },
    { name: 'Forgotten Labyrinth',    qty: 5 },
    { name: 'Lost in Crowds',         qty: 5 },
    { name: 'Marked Path',            qty: 6 },
    { name: 'Swallowed by the Night', qty: 4 },
    { name: 'Dodge',                  qty: 5 }
  ]
};

/* v0.6.16 (Johan's V5-starter onboarding idea): the FIRST two of the five VTES
   5th Edition (Black Chantry, 30 Nov 2020) preconstructed starter decks --
   source-verified against the official published decklists (12 crypt / 77
   library each, cross-checked to the printed total). Coverage-measured before
   registration (gen-deck-coverage.js): Malkavian 62/11/4 (80% auto), Tremere
   53/5/19 (69% auto) -- the two strongest of the five, and both carry 12x
   Govern the Unaligned, making them the first real arena exercise for the
   superior-Govern grinder path (v0.6.14) end-to-end. Toreador/Nosferatu/Ventrue
   held back deliberately: their weak spots are whole UNSWEPT vocabulary
   families (votes/politics; physical combat) that a deck registration can't
   paper over -- registering them now would just arena-test the gaps, not the
   bot. No `cap` annotations needed: _addUnc's three-tier ladder resolves
   capacity from cardfx when the deck entry omits it (verified, see fxCryptCap). */
const MALKAVIAN_DECK = {
  name: 'V5 Starter — Malkavian (Black Chantry 2020)',
  crypt: [
    { name: 'Ashley', qty: 1 }, { name: 'Dr. Stephen Norton', qty: 1 }, { name: 'Sully', qty: 1 },
    { name: 'Colette', qty: 1 }, { name: 'Gelasia Fotiou', qty: 1 }, { name: 'Meaghan', qty: 1 },
    { name: 'Andi Liu', qty: 2 }, { name: 'Alexander Silverson', qty: 2 }, { name: 'Donny Kowalczyk', qty: 2 }
  ],
  library: [
    { name: 'Asylum Hunting Ground', qty: 1 }, { name: 'The Barrens', qty: 1 }, { name: 'Blood Doll', qty: 4 },
    { name: 'Dreams of the Sphinx', qty: 1 }, { name: 'Elder Library', qty: 1 }, { name: 'Life in the City', qty: 2 },
    { name: 'Wider View', qty: 1 },
    { name: 'Govern the Unaligned', qty: 12 }, { name: 'Revelations', qty: 4 },
    { name: 'Bonding', qty: 4 }, { name: 'Cloak the Gathering', qty: 4 }, { name: 'Conditioning', qty: 4 },
    { name: 'Faceless Night', qty: 4 }, { name: 'Foreshadowing Destruction', qty: 2 },
    { name: 'Lost in Crowds', qty: 4 }, { name: 'Spying Mission', qty: 4 },
    { name: 'Swallowed by the Night', qty: 4 },
    { name: 'Deflection', qty: 5 }, { name: 'Eyes of Argus', qty: 5 }, { name: 'On the Qui Vive', qty: 5 },
    { name: 'Telepathic Misdirection', qty: 5 }
  ]
};
const TREMERE_DECK = {
  name: 'V5 Starter — Tremere (Black Chantry 2020)',
  crypt: [
    { name: 'Ayelech', qty: 2 }, { name: 'Chrysanthemum', qty: 1 }, { name: 'Inês Tristão', qty: 2 },
    { name: 'Lauren', qty: 1 }, { name: 'Lloyd Brooks', qty: 1 }, { name: 'Nassir', qty: 1 },
    { name: 'Patrik Söderberg', qty: 1 }, { name: 'Rosalina Cortez', qty: 1 }, { name: 'Trevon Parker', qty: 2 }
  ],
  library: [
    { name: 'Academic Hunting Ground', qty: 1 }, { name: 'Arcane Library', qty: 1 }, { name: 'Chantry', qty: 1 },
    { name: 'Misdirection', qty: 1 }, { name: 'Pentex(TM) Subversion', qty: 1 },
    { name: 'Wasserschloss Anif, Austria', qty: 1 }, { name: 'Vessel', qty: 4 }, { name: 'Wider View', qty: 1 },
    { name: 'Govern the Unaligned', qty: 12 }, { name: 'Magic of the Smith', qty: 2 },
    { name: '.44 Magnum', qty: 1 }, { name: 'Bowl of Convergence', qty: 1 }, { name: 'Kevlar Vest', qty: 1 },
    { name: 'Sport Bike', qty: 1 },
    { name: 'Bonding', qty: 6 }, { name: 'Mirror Walk', qty: 6 },
    { name: 'Apportation', qty: 4 }, { name: 'Theft of Vitae', qty: 10 },
    { name: 'Deflection', qty: 4 }, { name: 'Eyes of Argus', qty: 6 }, { name: 'On the Qui Vive', qty: 4 },
    { name: 'Precognition', qty: 2 }, { name: "Spirit's Touch", qty: 2 }, { name: 'Telepathic Misdirection', qty: 4 }
  ]
};
const NOSFERATU_DECK = {   // v0.6.55 (A1): V5 Starter -- Nosferatu (Black Chantry 2020), derived via gen-precon from vtes.json sets data and cross-validated against the curated list (identical 26/77 unique names) -- the SAME source deck-nosferatu.json feeds gen-deck-coverage (67/77 auto, 87%)
  name: 'V5 Starter \u2014 Nosferatu (Black Chantry 2020)',
  crypt: [ { name: 'Aunt Linda (G6)', qty: 1 }, { name: 'Baixinho (G6)', qty: 1 }, { name: 'Belinde (G6)', qty: 2 }, { name: 'Horace Radcliffe (G6)', qty: 1 }, { name: 'Larissa Moreira (G6)', qty: 2 }, { name: 'Lenny Burkhead (G6)', qty: 2 }, { name: 'Ryan (G6)', qty: 1 }, { name: 'The Dowager (G6)', qty: 1 }, { name: 'Wauneka (G6)', qty: 1 } ],
  library: [ { name: 'Carrion Crows', qty: 2 }, { name: 'Cats\' Guidance', qty: 4 }, { name: 'Creeping Sabotage', qty: 4 }, { name: 'Deep Song', qty: 6 }, { name: 'Fame', qty: 1 }, { name: 'Guard Dogs', qty: 4 }, { name: 'Guardian Angel', qty: 1 }, { name: 'Haven Uncovered', qty: 1 }, { name: 'Immortal Grapple', qty: 4 }, { name: 'Instinctive Reaction', qty: 4 }, { name: 'Lost in Crowds', qty: 4 }, { name: 'Murder of Crows', qty: 2 }, { name: 'On the Qui Vive', qty: 5 }, { name: 'Preternatural Strength', qty: 2 }, { name: 'Protected District', qty: 4 }, { name: 'Raven Spy', qty: 2 }, { name: 'Rebel', qty: 1 }, { name: 'Roundhouse', qty: 8 }, { name: 'Slum Hunting Ground', qty: 1 }, { name: 'Smiling Jack, The Anarch', qty: 1 }, { name: 'Taste of Vitae', qty: 4 }, { name: 'The Labyrinth', qty: 1 }, { name: 'The Warrens', qty: 4 }, { name: 'Underbridge Stray', qty: 2 }, { name: 'Vessel', qty: 4 }, { name: 'Warsaw Station', qty: 1 } ]
};
const VENTRUE_DECK = {   // v0.6.122 (18 Sep 2026): V5 Starter -- Ventrue (Black Chantry 2020), Johan's printed list (12 crypt / 77 library) -- the SAME list deck-ventrue.json feeds gen-deck-coverage. The first deck with political actions.
  name: 'V5 Starter \u2014 Ventrue (Black Chantry 2020)',
  crypt: [ { name: 'Alexa Draper (G6)', qty: 1 }, { name: 'Alice Chen (G6)', qty: 2 }, { name: 'Brock Sterling (G6)', qty: 1 }, { name: 'Chelsea Blake (G6)', qty: 1 }, { name: 'Horst von Brühl (G6)', qty: 2 }, { name: 'Madison (G6)', qty: 1 }, { name: 'Naomi Stewart (G6)', qty: 1 }, { name: 'Oshri Dahan (G6)', qty: 1 }, { name: 'Sybren van Oosten (G6)', qty: 2 } ],
  library: [ { name: 'Anarch Troublemaker', qty: 1 }, { name: 'Blood Doll', qty: 3 }, { name: 'Information Highway', qty: 1 }, { name: 'Misdirection', qty: 1 }, { name: 'Uptown Hunting Ground', qty: 1 }, { name: 'Ventrue Headquarters', qty: 1 }, { name: 'Visit from the Capuchin', qty: 1 }, { name: 'Wider View', qty: 2 }, { name: 'Enchant Kindred', qty: 8 }, { name: 'Intimidation', qty: 4 }, { name: 'Ancilla Empowerment', qty: 1 }, { name: 'Kine Resources Contested', qty: 7 }, { name: 'Parity Shift', qty: 5 }, { name: 'Bewitching Oration', qty: 4 }, { name: 'Conditioning', qty: 4 }, { name: 'Daring the Dawn', qty: 1 }, { name: 'Freak Drive', qty: 6 }, { name: 'Voter Captivation', qty: 2 }, { name: 'Hidden Strength', qty: 4 }, { name: 'Majesty', qty: 6 }, { name: 'Deflection', qty: 6 }, { name: 'Second Tradition: Domain', qty: 4 }, { name: 'Wake with Evening\'s Freshness', qty: 4 } ]
};
const ARCHETYPES = { hacking: DEFAULT_DECK, wall: WALL_DECK, sewer: SEWER_DECK, malkavian: MALKAVIAN_DECK, tremere: TREMERE_DECK, nosferatu: NOSFERATU_DECK, ventrue: VENTRUE_DECK };
const NET_STEALTH = /^(.+?) (?:plays|burns) .+?: \+(\d+) stealth\.$/, NET_UNLOCK_IC = /^(.+?) attempts to block with \+(\d+) intercept \(.+\)\.$/;   // v0.6.147: the tally net's two readers (bot-emitted lines; not part of the frozen L12 contract the canary pins)
const DECK_STRATEGY = {   // A2 (v0.6.73): the reviewer's yardstick -- curated intent per archetype, emitted in the manifest so play is judged AGAINST strategy, not in a vacuum
  hacking:   { strategy: 'Ashur-cycling swarm: cap-1/2 crypt floods the table fast, Leverage-class bleed pressure every turn, Ashur Tablets recycle the engine; win by tempo before the table organizes.', axes: ['swarm-bleed', 'cycling', 'tempo'] },
  wall:      { strategy: 'Intercept fortress: block-first posture, equipment intercept (Bowl/Bike class), punish attempted actions and grind; win late by outlasting.', axes: ['wall', 'intercept', 'attrition'] },
  sewer:     { strategy: 'Weenie stealth-bleed: obfuscate swarm slips small bleeds through every turn; minimal combat, race the clock.', axes: ['stealth-bleed', 'swarm', 'race'] },
  malkavian: { strategy: 'Stealth-bleed with intel: dem/obf bleed engine, Kindred Spirits class chip damage, Revelations-style hand reads; win by steady pressure and information.', axes: ['stealth-bleed', 'intel', 'pressure'] },
  tremere:   { strategy: 'Bounce-wall with THA reach: aus intercept + Deflection-class bounce redirects pressure, Theft tempo swings blood; win by deflected attrition.', axes: ['wall', 'bounce', 'blood-tempo'] },
  ventrue:   { strategy: 'Vote-and-bleed toolbox: princes call Kine Resources Contested / Parity Shift on their own title votes, dom/pre bleeds (Enchant Kindred, Conditioning) between referendums, Deflection + Second Tradition at home; Freak Drive acts twice; win by pool damage the prey cannot block or outvote.', axes: ['vote', 'bleed', 'bounce'] },
  nosferatu: { strategy: 'Menace attrition: Fame/Creeping pool pressure + [ANI] rush control keeps threats in torpor; win by bleed+drain, not combat volume.', axes: ['menace', 'rush-control', 'stealth-bleed'], permFirst: true }   // v0.6.132: the helpsheet's early game -- permanents before pressure
};   // the registry the arena's --decks resolves against (bot v0.6.2; malkavian/tremere added v0.6.16; nosferatu v0.6.55 -- the doctrine deck, arena-ready at 87%)


/* ---------- bespoke, one-off card-effect handlers (v1.4.1, 14 July) --------
   Some card effects don't share enough mechanical shape with anything else to
   earn a generic `fx` key -- the same "vocabulary follows the consumer" call
   already made for Ashur Tablets' own copy-count threshold
   (cardfx-persistent-lock-design-decisions.md §8). Rather than sprinkle card-
   NAME checks into the generic play loop, the loop only ever asks "does this
   entry name a `handler`" (a curated, entry-level string field) and dispatches
   here -- the bespoke-ness lives in this registry, not in the generic code.
   Each handler is `async (bot) => { ... }`; called once, after the card has
   already resolved (placed on the board or ashed) and been logged/pushed.    */
const CARD_HANDLERS = {
  'life-in-the-city': async function(bot){   // v1.6.3/v1.6.4 (Johan's "push Inside Dirt to 100%" GO): "Trifle. Add 1 blood to a ready vampire." -- a genuine CHOICE (which ready vampire?), not an automatic phase-income trigger (_applyPhaseIncome's host-scan doesn't apply -- this card has no host, resolves once, is already in the ash heap by the time this runs). Target law mirrors _bestBloodStockFor's own spirit for consistency across the whole bloodAddTo family: highest-CAPACITY ready vampire that still wants blood (blood < cap) -- "closest to rising" doesn't quite apply to an already-ready vampire, but "most valuable to keep topped up" does, and reusing the SAME comparison keeps the family's target-selection logic uniform rather than inventing a new rule per card.
    const h = bot.fxLookup('Life in the City');
    const n = (h && h.kind === 'lib' && h.e.modes && h.e.modes[0] && h.e.modes[0].fx && h.e.modes[0].fx.bloodAdd) || 1;
    let best = null;
    bot.board.forEach(c => {
      if(c.kind !== 'crypt' || c.zone !== 'ready') return;
      if((c.blood | 0) >= (c.cap | 0)) return;   // already full -- adding here would be wasted (the universal capacity-overflow rule, same as steal-blood's)
      if(!best || (c.cap | 0) > (best.cap | 0)) best = c;
    });
    if(!best){ bot.o.log('life-in-the-city: no ready vampire wants blood (all full or none in play)'); return; }
    best.blood = Math.min(best.cap | 0, (best.blood | 0) + n);
    bot.chat('Trainbot: Life in the City adds ' + n + ' blood to ' + best.name + ' (blood now ' + best.blood + ').');
    bot.push();
  },
  'effective-management': async function(bot){   // "Move the top card from your crypt to your uncontrolled region." -- literally the SAME operation the bot's own normal, PAID Influence-phase vampire fetch already performs (see the `drawCrypt` send a few hundred lines down) -- just free instead of costing 4 transfers + 1 pool. No new crypt-tracking needed: `drawCrypt` is an EXISTING wire verb the server resolves (arrives async into `unc` on a later loop/turn, exactly like the paid version already does). "Top of crypt" also isn't a player CHOICE at all -- it's a shuffled stack position, not a decision -- so this needed no decide() branch, just the same `cryptN > 0` guard the paid path already uses.
    if(!(bot.cryptN > 0)){ bot.o.log('effective-management: crypt is empty, nothing to fetch'); return; }
    bot.send({ t: 'drawCrypt' });
    bot.chat('Crypt: Trainbot fetches a new vampire (Effective Management, free).');
  },
  'ashur-tablets': async function(bot){   // v1.4.2/v1.4.3 (14 July): dispatched after EVERY Ashur Tablets play -- a no-op until MY OWN third copy is in play (mandatory, immediate per rulebook -- Johan confirmed). "Only one Ashur Tablets can be played each turn" needs no new enforcement -- it falls out of the EXISTING played-name exclusion in _bestMasterFor/the master-play loop, already turn-scoped. The removal+benefit logic itself lives in _ashurResolve (v1.4.3), shared with _checkAshurTableWide's watch for someone ELSE crossing the threshold -- see that method for why.
    const mine = bot.board.filter(c => c.name === 'Ashur Tablets' && c.zone === 'ready').length;
    if(mine >= 3) await bot._ashurResolve(true);
  }
};

/* ---------- Board geometry (canonical 1004x616, CW 84 / CH 118) ---------- */
const GEO = {
  bw: 1004, bh: 616,
  readyY: 175, torporY: 320, uncY: 470, ashX: 900, ashY: 470,
  x0: 40, dx: 96
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- the table's spoken vocabulary (client SAY list, v2.6.x) ------
   Mirror of the client's `const SAY=[...]` — ONE contract, two implementations
   in lockstep (send needs the index; receive string-checks, never positions). */
const SAY = ['Hold on\u2026', 'No block', 'Block!', 'No reaction', 'It resolves', 'Yes', 'No', 'Pass', 'Any blocks?', 'Any reaction?'];   // v0.6.110 (R2, #11): 8/9 APPENDED to mirror client v2.6.106 -- the ASKING side of two phrases that existed only as answers, so a human can prompt the bot the way the bot prompts a human. `say{i}` is an index on the wire: append, never reorder.
const UND_KINDS = new Set(['stock', 'recruit', 'strength', 'creep', 'equip', 'fetch', 'political']);   // v0.6.122: a political action is undirected (+1 stealth) -- prey and predator answer its Block?
const sayIdx = phrase => SAY.indexOf(phrase);

/* Named personality presets — knobs for the decide() seam (bot-spec §7).
   A persona is HOW the bot weighs the same facts; cardfx stays shared truth. */
const PERSONAS = {
  novice:  { aggression: 0.8, blockShy: 1.3, insight: 0.1, bareBlock: 'off' },      // v0.6.118 (B2 step 1, doctrine 3.3): the BARE block (no intercept card, actor at stealth 0) -- off / chump / any; desperation overrides all three
  experienced: { aggression: 1.0, blockShy: 1.0, insight: 0.5, bareBlock: 'chump' },   // was 'grinder' until v0.6.148
  expert:      { aggression: 1.2, blockShy: 0.8, insight: 0.9, bareBlock: 'any' }        // was 'shark' -- the reference every series has run on, and the DEFAULT for a string the bot does not know
};
/* v0.6.149 (Johan, 21 Sep): the toggle is SIMULATED EXPERIENCE, so the levels are named for it -- Novice / Experienced / Expert. The old names stay accepted as
   aliases (run scripts, old traces' readers, the suite's 135 option strings prove the alias path); the manifest and every emit carry the CANONICAL name. */
const PERSONA_ALIAS = { grinder: 'experienced', shark: 'expert' };
const personaKey = n => { const k = String(n == null ? '' : n).trim().toLowerCase(); return PERSONAS[k] ? k : (PERSONA_ALIAS[k] || null); };

/* client-identical norm(): the pubs carry RAW deck-list names (parseDeck never
   canonicalizes), so the lookup ladder's last tier must match the client's. */
const FX_NORM = n => String(n || '').replace(/\u2122/g, 'tm')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]/g, '');

const stripTags = h => String(h || '').replace(/<[^>]*>/g, '');
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* PROTOCOL §12 frozen machine-readable lines — wording/punctuation/em-dash are
   load-bearing; these regexes parse the STRIPPED text of the `log` relay.    */
const L12 = {
  bleed:  /^(.+?) bleeds for (\d+)\.(?: Target: (.+?)\.)?$/,
  add:    /^(.+?) adds \+(\d+) bleed \(= (\d+)\)\.(?: Target: (.+?)\.)?$/,
  block:  /^Block: Stealth (-?\d+) vs Intercept (-?\d+) \u2014 block (succeeds|fails)\.$/,   // VA review (2 Aug, rulebook-verified): stealth/intercept 'can decrease even below 0' (vekn.net Detailed Turn Sequence) and the verdict is the RAW comparison -- the grammar accepts negatives so a bare Christine's -1 or a Royce-taxed announce parses
  poolDmg: /^(.+?) plays (.+?)(?:: burns the Edge)? \u2014 (\d+) pool damage to (.+?)\.$/,   // fas B (16 July)
  cancel: /^(.+?) plays (.+?): cancels the block attempt by (.+?) \u2014 that minion cannot try again\.$/,   // fas C (16 July): Elder Impersonation-class superior -- the attempt fails outright; the defender's own attempted-set (registered at ATTEMPT time, fas A+) already excludes the minion, so the receiving side is exactly the fails-branch code path   // fas B (16 July): Inside Dirt-class -- DIRECTED pool damage that is NOT a bleed (unbouncable: Deflection's own text is "only usable by the Methuselah being bled"); the Edge phrase is optional so future non-Edge poolDmg cards share the grammar
  peekI: /^(.+?) plays Revelations \[aus\] \u2014 looks at (.+?)'s hand\. Target: (.+?)\.$/,   // R3 (24 July): frozen [aus] announce -- m[2] = the prey NAME; the Target suffix keeps the pool-target grammar family
  peekS: /^(.+?) plays Revelations \[AUS\] \u2014 (.+?) plays with an open hand\.$/,   // R3: frozen [AUS] announce -- undirected, no Target suffix; the NAMED prey complies
  lockM: /^(.+?) plays (?:.+?) \u2014 locks (.+?)'s (.+?)\.$/,   // v0.6.128: the FAMILY -- any card (was hard-coded Misdirection; Anarch Troublemaker is the second member). Group numbers unchanged.  //   // M1: frozen -- m[2]=owner seat name, m[3]=vampire; the named owner complies by locking
  pentexM: /^(.+?) plays Pentex(?:\(TM\)|\u2122) Subversion \u2014 on (.+?)'s (.+?)\.$/,   // M2: frozen -- TM/\u2122 tolerant; m[2]=owner, m[3]=the vampire that cannot block
  rush: /^(.+?) plays Deep Song \[ANI\] \u2014 rushes (.+?)'s (.+?)\.$/,   // N2: frozen -- m[2]=target OWNER seat name, m[3]=the rushed vampire; the named owner complies (lock + defender handshake)
  fameM: /^(.+?) plays Fame \u2014 on (.+?)'s (.+?)\.$/,   // N3: frozen -- m[2]=owner, m[3]=the famed vampire; ALL observers track it, the owner arms the torpor hook
  creep: /^Creeping Sabotage \(x(\d+)\): (.+?) burns (\d+) pool\.$/,   // N3: frozen -- m[2]=the named prey complies
  rescueE: /^(.+?) rescues (.+?)\u2019s (.+?) from torpor \((.+?) pays (\d+), (.+?) pays (\d+)\)\.$/,   // v0.6.72 (#7): frozen -- m[2]=owner complies, m[3]=vamp, m[5]=their blood share
  strikeD: /^(.+?) strikes: (.+?) \u2014 no damage either way this round\.$/,   // v0.6.4: the OUTBOUND grammar has existed since steg 6 (dodge) / v1 (hands, card) -- only the PARSER was missing, which is exactly why the attacker's "assume incoming 1" phantom survived: the real answer was already on the wire, unread
  strikeC: /^(.+?) strikes with (.+?) for (\d+)\.$/,
  attempt: /^(.+?) attempts to block\.$/,                    // v0.6.106 (#14): bot-emitted, frozen -- the bare block attempt names the blocking vampire
  political: /^(.+?) calls a political action\.(?: Target: (.+?)\.)?$/,   // v0.6.111 (R3, #10): the client's Vote submenu (v2.6.106), frozen in §12 -- an ACTION like any other, so the block step runs on it; the optional Target suffix rides the same grammar family as a bleed's
  votes: /^(.+?) casts (\d+) votes? (for|against)\.$/,                     // v0.6.111 (R3, #10): the client's Cast votes line, frozen -- how every seat's votes reach the table (mine included)
  blockAct: /^(.+?) blocks\.$/,                              // v0.6.110 (R2, #12): the CLIENT's Block menu action (v2.6.106, frozen in §12) -- parsed BESIDE `attempts to block.`, never instead of it: both shapes name the blocking minion, and a human who right-clicks Block before shouting Block! has already blocked
  actObs: /^(.+?) (bleeds for (\d+)|hunts|calls a political action|attempts to rescue a vampire from torpor|commits diablerie|plays (.+?))[.!]/,   // v0.6.110 (R2, #11): the SHORT-TERM ACTION MEMORY grammar -- the client's action-menu lines plus a card play. Not a window opener: it only remembers WHAT the last other-seat action was, so a later "Any blocks?" has something to ask about
  interceptPlay: /^(.+?) plays (.+?): \+(\d+) intercept\.$/,   // v0.6.106 (#14): the existing bot-emitted intercept line, now also the blocker-name carrier
  strikeH: /^(.+?) strikes \(hands\) for 1\.$/,
  vote:   /^Vote: (\d+) for vs (\d+) against \u2014 vote (passes|fails)\.$/,
  combatEnds: /^Combat ends \u2014 (.+?)\.$/,   // v0.6.123 (bot grammar): follows a strikeD-shaped line when the strike ended the combat (Majesty-class)
  refTerms: /^Referendum terms \u2014 (.+?): (.+)\.$/,          // v0.6.122 (bot grammar, spec-referendum-terms): the caller's machine-readable terms, sent BEFORE the frozen `calls a political action.` line
  refResult: /^Referendum (passes|fails) \u2014 (.+?): (.+)\.$/,   // v0.6.122: the outcome + the same terms (self-contained: a seat applies its own delta from THIS line)
  blockBar: /^(.+?) \u2014 (vampires|allies|minions) cannot block this action\.$/,   // v0.6.127 (bot grammar, cardfx fx.blockBar): m[1] = the card, sent BEFORE the action's announce (the terms-line precedent) so the window opens with the bar known; a human reads it as table talk and complies by hand
  /* v0.6.107 (B1): the UNDIRECTED family -- the bot's own frozen announce lines for actions the rulebook lets the actor's prey AND predator block (prey first). Human clients' wording for these is unverified (main-project ask). */
  uHunt:     /^(.+?) hunts\.$/,
  uRescue:   /^(.+?) attempts to rescue a vampire from torpor\.$/,   // v0.6.127: the CLIENT's frozen action-menu line (no Target suffix = the actor's OWN vampire, undirected) -- it was only short-term memory (actObs); now it opens the prey/predator window like every other undirected action
  uLeave:    /^(.+?) attempts to leave torpor\.$/,   // v0.6.128 (bot grammar): a torpored vampire's own action (+1 stealth, 2 blood). Blocked by a vampire = NO combat, the blocker may diablerise -- bots never do, so a bot answers Pass at once; a human may block
  uEquip:    /^(.+?) (equips|employs) (.+?)\.$/,
  uRecruit:  /^(.+?) recruits (.+?) \[(.+?)\]\.$/,
  uStock:    /^(.+?) plays (.+?) \u2014 (\d+) blood onto an uncontrolled vampire\.$/,
  uTabling:  /^(.+?) plays (.+?) \u2014 puts it in play\.$/,
  uFetch:    /^(.+?) plays (.+?) \[(tha|THA)\] \u2014 fetches (.+?)\.$/,
  uStrength: /^(.+?) plays (.+?) \[(.+?)\] \u2014 on themselves \(\+(\d+) strength\)\.$/,
  combat: /^Combat: (\d+) vs (\d+) damage dealt\.$/
};
const poolTargetName = t => { const m = t && t.match(/^(.+)'s pool$/); return m ? m[1] : null; };

/* ---------- the cardfx library (elysium-cardfx.json) ----------------------
   Facts about cards (see elysium-cardfx-design.md). Loaded once; lookups run
   the THREE-TIER ladder: exact -> lowercase alias -> norm index (built here). */
function prepCardfx(raw){                 // v0.6.94 (HB0): the file-free half -- a browser bridge passes the parsed JSON straight in (o.cardfxData); loadCardfx below is now just fs + this
  if(!raw || raw.fxv !== 1 || !raw.lib || !raw.crypt) return null;
  const normIdx = new Map();
  const put = (k, canonical) => { const n = FX_NORM(k); if(n && !normIdx.has(n)) normIdx.set(n, canonical); };
  Object.keys(raw.lib).forEach(k => put(k, k));
  Object.keys(raw.crypt).forEach(k => put(k, k));
  Object.entries(raw.alias || {}).forEach(([a, c]) => put(a, c));
  return { lib: raw.lib, crypt: raw.crypt, alias: raw.alias || {}, normIdx, counts: raw.counts || {} };
}
function loadCardfx(file){
  let raw;
  try{ raw = JSON.parse(fs.readFileSync(file, 'utf8')); }catch(e){ return null; }   // fs is null in a browser -> TypeError -> caught -> null, same honest degradation as a missing file
  return prepCardfx(raw);
}

/* ============================ The bot ==================================== */
class Bot {
  constructor(opts){
    this.o = Object.assign({
      server: 'ws://127.0.0.1:8123', room: '', pass: '', name: 'Trainbot',
      seat: 0,                 // 0 = pick the lowest free seat in the lobby
      deck: null,              // playbook object; null = DEFAULT_DECK
      askSecs: 25,             // how long "Block?" waits before defaulting to no
      create: false,           // create the room instead of joining (the bot becomes HOST — the arena's seat-1 pattern)
      startPool: 30,           // opening pool (sandbox knob; the arena uses low pools for fast matches)
      paceMs: 2000,            // thinking pause between announces (0 in tests) — human tables need the beats to breathe (Johan, live test)
      reactGraceMs: 2000,      // v0.6.114 (Johan): once the room's Reaction stopwatch has rung and run out, the bot resumes this long after it -- the window's deadline is re-stamped to stopwatch-end + this (askSecs then only caps the pre-stopwatch phase). Clock 5 s -> the bot resumes 7 s after the stopwatch started; table activity still restarts everything.
      reactClockMs: 7000,      // v0.6.109 (#13, Johan): table silence before I ring the ROOM's Reaction stopwatch. Was a hardcoded 5000 since v0.3.10 and fired too eagerly — a player who is mid-sentence got clocked. The knob exists so the client can tune it on the wire later without another bot release; the ask's own askSecs window is untouched.
      debug: false,            // v0.6.112 (R4, #3b -- the item the 14 Sep handoff omitted entirely): Johan's review mode. Open hand to the whole table, crypt face UP, and the decision weighting in the log. NEVER on by default and never in a tournament: it hands every opponent perfect information about me. The toggle belongs on the client's lobby; this is the bot half.
      debugWeights: true,      // v0.6.112 (R4): the log half of debug can be muted on its own -- the hand and crypt alone are often enough, and the weighting is chatty
      politicsAsk: true,       // v0.6.111 (R3, #10): a political action opens the pool question BY ITSELF (no 'Any blocks?' needed) -- Johan: the Vote submenu 'triggers the block step for the bots'. false = the R2 behaviour, prompt-only.
      whoBlocksGraceMs: 2500,  // v0.6.110 (R2, #12, Johan): after a human shouts Block! I wait this long for a blocker line (`NAME blocks.` / `NAME attempts to block.`) before asking "Who blocks?" -- long enough to right-click the minion, short enough that a forgotten block does not stall the table
      reactPaceMs: null,       // v0.6.109 (#13, the OTHER half): how long I sit on a reaction of my own once the table has declared its intention. null = paceMs * 0.6. Deliberately its own knob and not paceMs: Johan wants the bot's ANSWERS quicker without speeding up its turn, and the old value (max(paceMs, thinkMs)) made a persona's thinkMs able to lengthen it but never shorten it.
      poolFloor: 6,            // never influence below this pool
    rushBackWeight: 1, rushFwdWeight: 1, crossRushWeight: 0,   // v0.6.53 (rush-theory v1.1): direction knobs -- cross soft-ZERO per Johan (sweepable in the arena; the counterfactual log answers R-Q5)
    permFirst: 1,            // v0.6.132 (Johan's GO, 19 Sep; serie-null4 reading 28h): for a deck whose manifest says permFirst (the Black Chantry helpsheet's 'take actions to get permanent intercept and permanent damage enhancers'), a permanent in hand (equip / retainer / strength / ally) is put in play BEFORE a bleed -- structurally, like the stock rule; never on a lunge turn or with the prey within a turn and a half; 0 = the old score contest, kept so the same seeds run both ways
    polOverBuild: 1,         // v0.6.131 (debt 23b, Johan 18 Sep): a referendum I hold the votes for beats build-first when it IS economy (it pays me pool: Parity Shift) or when its own damage brings my prey within oust reach (KRC); 0 = the old unconditional build-first, kept so the same seeds can be run both ways
    grinderReadyTarget: 3,   // v0.6.14 (superior Govern): while ready crypt count < this, a blood-stock action (bloodAdd@unc) is picked STRUCTURALLY over bleeding -- build first, grind later; 0 disables the path entirely
      cardfx: null,            // path to elysium-cardfx.json (null = look beside the script)
      cardfxData: null,        // v0.6.94 (HB0): pre-parsed cardfx JSON OBJECT -- the browser channel (no fs); beats the path rungs when set. Node callers may use it too.
      transport: null,         // v0.6.94 (HB0): (url, cb{open,msg,close}) -> {send(obj), close()} dial injection; null = the built-in wsConnect (Node ws://). The hotseat bridge's seam.
      persona: null,           // knob overrides for the decide() seam
      log: (...a) => console.log('[bot]', ...a)
    }, opts || {});
    this.deck = this.o.deck || DEFAULT_DECK;
    /* the decide() seam's knobs — v0.2 ships the SOCKET with a first trivial
       scorer; the full personality-weight system is v0.3 (bot-spec §7).      */
    if(typeof this.o.persona === 'string'){ const pk = personaKey(this.o.persona); if(!pk) this.o.log('persona "' + this.o.persona + '" is not known (novice | experienced | expert) \u2014 playing as expert'); this.o.persona = pk || 'expert'; }   // v0.6.149: canonical name from here on; an unknown string used to fall SILENTLY to the bare base knobs
    const pOpt = (typeof this.o.persona === 'string') ? (PERSONAS[this.o.persona] || {}) : (this.o.persona || {});
    this.persona = Object.assign({ aggression: 1.0, blockShy: 1.0, insight: 0.5, thinkMs: 1600,
      grinderReadyTarget: this.o.grinderReadyTarget }, pOpt);   // v0.6.16 (arena onboarding, pre-flight check before the Malkavian/Tremere run): P was built from PERSONAS[name] + a base object that never carried this key, so ANY named persona (shark/grinder/novice -- exactly what the arena passes) silently read P.grinderReadyTarget===undefined; readyCrypt < undefined is always false, so the WHOLE superior-Govern grinder path built this session was structurally unreachable outside raw persona-OBJECT unit tests. Sourced from this.o so the constructor knob (opts.grinderReadyTarget) still works; pOpt can still override per-persona later.
    const fxPath = this.o.cardfxData ? '(o.cardfxData -- pre-parsed injection)'   // v0.6.94 (HB0): three-rung fx source -- data object > explicit path > beside-the-script default
                 : this.o.cardfx || (IS_NODE ? require('path').join(__dirname, 'elysium-cardfx.json')
                                             : 'no cardfx source in this environment -- pass o.cardfxData');
    this.fx = this.o.cardfxData ? prepCardfx(this.o.cardfxData) : loadCardfx(fxPath);
    if(this.fx) this.o.log('cardfx loaded: ' + (this.fx.counts.lib || '?') + ' lib / ' +
                           (this.fx.counts.crypt || '?') + ' crypt / ' + this.fx.normIdx.size + ' norm keys');
    else this.o.log('⚠ cardfx NOT loaded (' + fxPath + ') — the bot plays WITHOUT card knowledge: plain bleeds only, no card plays, no stealth, no threat reads. Fix: place elysium-cardfx.json next to elysium-bot.js (or pass --cardfx <path>; a browser passes o.cardfxData).');

    this.ws = null;
    this.seat = 0; this.token = null; this.started = false; this.out = false;
    this.players = [];               // latest roster [{seat,name,out,vacant,...}]
    this.turnSeat = 0; this.ownTurns = 0; this.inf = 0; this._tableBlockAttempts = 0;
    this.pool = 30; this.edge = false;
    /* v0.5+ (Johan, 14 July): the SAME phase-action economy the client's own
       Structured helpers track (state.phaseActs/phaseUsed + the Trifle-only
       state.masterBonus) -- generalized to all three adjustable phases so a
       future curated card can grant bonus actions to ANY of them, not just
       Master. phaseActs = the PERMANENT baseline (rulebook default here;
       bumped by an in-play `actGrant{persist:'inplay'}` card via
       _recomputePhaseActs, mirroring the client's manual scroll/right-click
       adjuster); phaseBonus = TEMPORARY, resets every one of the bot's own
       turns (Trifle's capped-at-1 bonus, and later a bespoke `persist:'turn'`
       card); phaseUsed = consumed so far THIS turn. Available = acts+bonus-used
       (see _phaseAvail). Discipline unchanged from before: Minion is NOT in
       here (it's derived from unlocked minions, exactly like the client).  */
    this.phaseActs = { master: 1, influence: 4, discard: 1 };
    this.phaseBonus = { master: 0, influence: 0, discard: 0 };
    this.phaseUsed = { master: 0, influence: 0, discard: 0 };
    this.hand = []; this.unc = [];   // unc: [{id,name,cap}]
    this.board = [];                 // cards in play: {id,name,kind,zone,x,y,locked,faceDown,blood}
    this.libN = 0; this.cryptN = 0;
    this._gid = 0; this._acting = false; this._seatPicked = false;
    this._sq = []; this._sqT = null;                    // paced outbound queue (token bucket — see _drain())
    this._ask = null;                // pending Block? question {resolve, timer, pausedBy:Set}
    /* --- v0.2 perception state --- */
    this.table = {};                 // seat -> { pub, seen:Set(ids), seeded:bool } (per-seat: cids collide cross-seat!)
    this.reads = {};                 // seat -> { seen: {...} } — the honest hand-READ memory; v0.6.118: `seen` is the SAME object as this.opp[seat].seen (readP keeps its signature)
    this.opp = {};                   // v0.6.118 (B2's foundation, elysium-bot-table-model-spec.md): seat -> the per-opponent TABLE MODEL, public information only, match-scoped -- see _opp()
    this.tally = null;               // last tally mirror: the broadcast, and (v0.6.113) the bot's own writes -- see _writeTally
    this.caps = { tally: false, classic: false };   // capability detection by OBSERVATION. v0.6.113 (THE HELPER GATE): caps.tally is a DIAGNOSTIC flag only ("a counter has been seen on this table") -- nothing decides on it any more; classic still drives the deal and the L4 camp
    this.pending = null;             // incoming-bleed machine: {who, amount, contested, passTimer}
    this._handlers = this._mkHandlers();
    if(!this.o.deckName && this.o.deck){   // v0.6.147 (THE HOTSEAT NET): the CLIENT spawns bots with a deck OBJECT and no deckName (netBotAdd AND hotSpawnBots, v2.6.121), so DECK_STRATEGY[undefined] was {} at every human table -- no axes, posture 'resisting', no stealth axis, no permFirst: everything the arena measured since v0.6.107 ran only in the arena. Identity first, then the deck's printed name, then the exact card list.
      const sig = d => { try { return JSON.stringify([(d.crypt || []).map(e => [e.name, e.qty | 0]).sort(), (d.library || []).map(e => [e.name, e.qty | 0]).sort()]); } catch(e){ return null; } };
      const mine = sig(this.o.deck), nm = String(this.o.deck.name || '').trim();
      const key = Object.keys(ARCHETYPES).find(k => ARCHETYPES[k] === this.o.deck) || (nm && Object.keys(ARCHETYPES).find(k => String(ARCHETYPES[k].name || '').trim() === nm)) || (mine && Object.keys(ARCHETYPES).find(k => sig(ARCHETYPES[k]) === mine)) || null;
      if(key){ this.o.deckName = key; this._deckNameInferred = true; }
    }
    this.onEvent = opts && opts.onEvent || null;   // test hook: (type, msg) for every inbound message
  }

  /* ---------- lifecycle ---------- */
  connect(rejoin){                   // v0.6.106 (#11): rejoin=true re-dials the same server and joins with the seat TOKEN (the server's reconnect path: password not needed, the seat is reclaimed, everyone's boards are replayed)
    return new Promise((resolve, reject) => {
      let opened = false;
      const dial = this.o.transport || wsConnect;   // v0.6.94 (HB0): injectable transport -- wsConnect's exact contract; the future hotseat bridge dials here, the Node wire path is byte-untouched when absent
      this._rejoining = !!(rejoin && this.token);
      this.ws = dial(this.o.server, {
        open: () => {
          opened = true;
          this.o.log('connected to', this.o.server + (this._rejoining ? ' (rejoin)' : ''));
          if(this._rejoining) this.ws.send({ t: 'join', room: this.o.room, pass: this.o.pass, name: this.o.name, v: WIRE_V, bot: true, token: this.token });
          else this.ws.send({ t: this.o.create ? 'create' : 'join', room: this.o.room, pass: this.o.pass,
                         lobby: this.o.create ? true : undefined,
                         name: this.o.name, v: WIRE_V, bot: true });   // v0.4.4 (Johan, 13 July): self-declares as a bot seat -- lets ANY player control its elements (see the 'ctrl' handler below)
          resolve();
        },
        msg: raw => { let m; try{ m = JSON.parse(raw); }catch(e){ return; } this._dispatch(m); },
        close: err => {
          if(!opened) return reject(err || new Error('connect failed'));
          this.o.log('connection closed' + (err ? ' (' + err.message + ')' : ''));
          if(this.o.onClose) this.o.onClose(err);
          this._maybeReconnect(err);                 // v0.6.106 (#11)
        }
      });
    });
  }
  _maybeReconnect(err){              // v0.6.106 (#11): a dropped socket mid-game (network blip, a rate-limit kick, a server restart) used to leave a DEAD SEAT for the rest of the match -- the server has supported token rejoin all along. Backoff 500 ms x2^(n-1), 5 tries; never after close(), never when not started or already ousted; o.reconnect === false disables (tests, the hotseat bridge owns its transport)
    if(this._closing || !this.started || this.out || !this.token || this.o.reconnect === false) return;
    if(this.o.transport && this.o.reconnect !== true) return;   // deploy review (11 Sep): an INJECTED transport (the hotseat bridge, the suites) owns its own lifecycle -- re-dialing it could seat a duplicate; reconnect there is opt-in (o.reconnect === true). The built-in ws:// dial reconnects by default.
    const max = this.o.reconnectMax || 5, n = this._reconnN = (this._reconnN | 0) + 1;
    if(n > max){ this.o.log('reconnect: giving up after ' + max + ' attempts'); return; }
    const delay = Math.min(8000, (this.o.reconnectBaseMs || 500) * Math.pow(2, n - 1));
    this.o.log('reconnect: attempt ' + n + '/' + max + ' in ' + delay + ' ms' + (err && err.message ? ' (' + err.message + ')' : ''));
    this._reconnT = setTimeout(() => {
      this._reconnT = null; if(this._closing) return;
      this.connect(true).then(() => {
        this._rejoinT = setTimeout(() => {           // the joined-watchdog: a dial that opens but never seats us (room gone, token dead) must not hang forever
          this._rejoinT = null;
          if(this._rejoining && !this._closing){ this.o.log('reconnect: no joined reply within 6 s -- retrying'); try{ this.ws.close(); }catch(e){} this._maybeReconnect(new Error('no joined reply')); }
        }, this.o.rejoinWatchdogMs || 6000);
      }).catch(e => { this.o.log('reconnect: dial failed' + (e && e.message ? ' (' + e.message + ')' : '')); this._maybeReconnect(e); });
    }, delay);
  }
  close(){ this._closing = true; if(this._reconnT){ clearTimeout(this._reconnT); this._reconnT = null; } if(this._rejoinT){ clearTimeout(this._rejoinT); this._rejoinT = null; } if(this._holdRemT){ clearTimeout(this._holdRemT); this._holdRemT = null; } if(this.ws) this.ws.close(); }   // v0.6.106 (#11): an explicit close never reconnects

  /* ---------- the widget seam (v0.6.109, #1) --------------------------------
     Two public methods, no wire change: online and offline alike the bots live
     in the host's own tab, so the countdown widget (main project, HANDOFF §4)
     calls these directly.

     THE FROZEN RULE: step() may never produce an outcome the bot could not have
     reached by itself. Every rung pulls an ALREADY EXISTING wait forward — a
     hold the table would have released, an ask the clock would have timed out
     (via _askTimeout, the literal same method the timer calls). No second code
     path, so the suite keeps being a true statement about the bot with the
     button as well as without it. The corollary is deliberate: some waits are
     READABLE but not steppable — a pacing beat, and an incoming action's own
     reaction window — and there status() reports the deadline while step
     reports null, because faking progress there would decide the game for a
     human who is still typing.

     `waitingFor` is the half Johan asked for: the WHY, in table language, not
     a state name. `step` names the rung the next press would take, so the
     widget can label its own button ("Release Anna's hold" / "Resolve — no
     block") instead of guessing. */
  status(){
    const now = Date.now();
    const mk = (state, waitingFor, until, step) => ({ state, waitingFor, until: until || null,
      seat: this.seat, name: this.o.name, version: BOT_VERSION, step: step || null, canStep: !!step });
    if(this.out)      return mk('idle', 'ousted', null, null);
    if(!this.started) return mk('idle', 'waiting for the table to start', null, null);
    if(this._holdBy && this._holdBy.size)
      return mk('held', 'hold: ' + [...this._holdBy].join(', '), null, 'release-hold');   // a hold has NO deadline by design: it ends when a human says so (the 90 s _holdRemind is a nudge, not a clock), so `until` is honestly null and the number the widget would have shown is replaced by the button
    const a = this._ask;
    if(a){
      let who;
      if(a.pausedBy && a.pausedBy.size)   who = [...a.pausedBy].join(', ') + ' thinking';
      else if(a.undirected && a.eligible) who = [...a.eligible].filter(n => !(a.passed && a.passed.has(n))).join(', ');
      else                                who = this.seatName(a.target || this.preySeat());
      return mk('asking', (a.contested ? 'block verdict' : 'block?') + (who ? ' (' + who + ')' : ''), a.deadline, 'resolve-ask');
    }
    const q = this._pq;
    if(q) return mk('asking', 'pool question' + (q.stage === 'amt' ? ' (how much?)' : '') + ' (' + q.who + ')', q.deadline, 'resolve-pq');   // v0.6.110 (R2): my own question to the table -- steppable, and the step runs the clock's own body
    const p = this.pending;
    if(p) return mk('acting', 'reacting to ' + (p.who || 'an action') + (p.amount ? ' (' + (p.kind || 'action') + ' ' + p.amount + ')' : ''), p.reactAt, null);
    if(this._beatUntil && this._beatUntil > now) return mk('acting', 'thinking', this._beatUntil, null);
    if(this._acting)  return mk('acting', 'my turn', null, null);
    if(this.turnSeat && this.turnSeat !== this.seat)
      return mk('waiting-turn', this.seatName(this.turnSeat) + '\u2019s turn', null, null);
    return mk('idle', 'nothing pending', null, null);
  }
  step(){
    const s = this.status();
    if(s.step === 'release-hold'){
      const names = this._holdBy ? [...this._holdBy] : [];
      if(!names.length) return { did: null, why: 'the hold released itself first' };   // single-flight: two panicked presses must not release twice
      this._holdBy.clear();
      if(this._holdRemT){ clearTimeout(this._holdRemT); this._holdRemT = null; }
      if(this._holdAnnounced){ this._holdAnnounced = false; this.chat('\u25b6 Resuming.'); }   // the same release the table's 'It resolves' performs, announced by the same rule (only the bot that announced the hold speaks)
      this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b>: hold by <b>' + esc(names.join(', ')) + '</b> released from the table controls.' });   // a press that moves the game for everyone is never silent
      return { did: 'release-hold', who: names, why: 'released the hold held by ' + names.join(', ') };
    }
    if(s.step === 'resolve-ask'){
      if(!this._ask) return { did: null, why: 'the ask resolved itself first' };
      this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b>: reaction window closed from the table controls (nobody answered).' });
      this._askTimeout();   // NOT _answer('no') -- the clock's own body, so a contested window still declares its verdict from the tally exactly as it would have
      return { did: 'resolve-ask', why: 'closed the reaction window the way the ' + this.o.askSecs + 's clock would have' };
    }
    if(s.step === 'resolve-pq'){
      if(!this._pq) return { did: null, why: 'the question resolved itself first' };
      this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b>: pool question closed from the table controls (nobody answered).' });
      this._pqTimeout();   // the clock's own body: stage yn -> "no", stage amt -> 1
      return { did: 'resolve-pq', why: 'closed the pool question the way the ' + this.o.askSecs + 's clock would have' };
    }
    return { did: null, why: 'nothing to step: ' + s.waitingFor };
  }

  /* ---------- wire helpers ---------- */
  /* Outbound pacing: the server hard-CLOSES any connection that exceeds
     RATE_N (80 msgs / 10 s) — and a disconnected bot is a dead seat. send()
     therefore drains through a rolling-window queue that stays safely under
     the limit at any paceMs (burst turns at paceMs 0 hit ~20 msg/s raw).   */
  send(obj){ this._sq.push(obj); this._drain(); }
  _drain(){
    if(this._sqT || !this._sq.length) return;
    const later = ms => { this._sqT = setTimeout(() => { this._sqT = null; this._drain(); }, ms); };
    if(!this.ws) return later(100);                    // queued before connect finished
    const now = Date.now();
    /* token bucket: burst 8, refill 1 per 150 ms (≈6.7/s sustained — 74.7
       of the server's 80 msgs/10 s worst-case incl. the burst, leaving room
       for the unqueued join handshake). Bursts land together (fx+log+chat),
       and a critical say is never parked behind a saturated window.        */
    if(this._tokT === undefined){ this._tok = 8; this._tokT = now; }
    this._tok = Math.min(8, this._tok + (now - this._tokT) / 150);
    this._tokT = now;
    if(this._tok < 1) return later(Math.ceil((1 - this._tok) * 150));
    if(this.o.paceMs){                                    // v0.6.100b (the 78d gate caught v0.6.100's level miss): the gap must hold since the LAST WIRE SEND regardless of queue state -- three separate send() calls in one tick each drained instantly because the finally's gap only ever saw a non-empty queue. The guard now lives at the TOP: after a CHAT the next message waits the full chat beat (bubbles succeed), after anything else the 200 ms cascade.
      const gapNeed = (this._lastSentT === 'chat')
        ? Math.max(200, this.o.chatPaceMs !== undefined ? this.o.chatPaceMs : Math.round(this.o.paceMs * 1.6))
        : (this._lastSendAt ? 200 : 0);
      const gw = (this._lastSendAt || 0) + gapNeed - now;
      if(gw > 0) return later(gw);
    }
    this._tok -= 1;
    let obj = null;
    try{
      obj = this._sq.shift();
      if(obj && obj.__board){
        this._pushQ = false; obj = { t: 'board', pub: this.buildPub() };
        /* v0.6.112 (R4): the open-hand grant re-syncs HERE and nowhere else.
           The hand has 34 mutation sites; hooking each one is how you silently
           miss the 35th, and a debug view frozen on a stale hand is worse than
           no debug view -- Johan would be grading decisions against the wrong
           cards without ever being told. Every one of those sites already ends
           in push(), and push() funnels through this single queued flush, so
           one hook covers all of them by construction. This mirrors the
           client's own architecture exactly: refreshOpenHands() hangs off
           schedulePush() for the same reason. The signature guard keeps a
           board push that did not touch the hand off the wire. */
        this._syncOpenHand();
      }
      this.ws.send(obj);
      this._lastSendAt = Date.now(); this._lastSentT = obj && obj.t;
      if(obj && obj.t === 'chat') this._lastChatAt = this._lastSendAt;   // the bubble starts when the wire carries it -- _pace's chat-hold and _chatSettleMs read this
    }catch(e){ this.o.log('drain error:', e.message); }   // one bad frame must never stop the queue
    finally{ if(this._sq.length) later(this.o.paceMs ? 60 : 30); }   // re-enter; the top gate does the pacing
  }
  chat(msg){
    /* v0.6.109 (FOUND BY THE SUITE, section 5): the v0.6.108 rewrite protected the
       combat handshake prefix with `.replace(/Trainbot combat/, name + ' combat')`
       FIRST -- which is a no-op when the bot is literally named "Trainbot" (the
       default, i.e. every human table where nobody renames it), so the second
       replace then mangled it to "Trainbot (bot) combat". The suite's
       /Trainbot combat/ never matched, and every receiving bot's
       `^(?:\S+ combat \u2014 )?(.+?) presses to` captured "Trainbot (bot) combat
       \u2014 Lisa" as the vampire name. The arena rotates names and never sees the
       literal, and the suite was not run at v0.6.108 -- so it shipped. A
       sentinel makes the protection independent of what the name happens to be. */
    const S = '\u0001';
    const out = String(msg).replace(/Trainbot combat/g, S).replace(/Trainbot/g, this.o.name + ' (bot)').replace(new RegExp(S, 'g'), this.o.name + ' combat');
    this.send({ t: 'chat', msg: out.slice(0, 300) }); if(this._wdT) this._watchdogArm();
  }   // v0.6.108: persona name + (bot) suffix; re-arm watchdog on visible output
  /* v0.6.114 (Johan, THE THREE TIERS): the bot's SYSTEM text. PROTOCOL §12.0 has three
     render tiers -- `log` (status, no bubble), `chat` (a calm bubble), `say` (the quick-
     phrase animation) -- and until now the bot spoke on chat tier about nearly everything,
     including events that already had an fx clone AND a frozen log line. Rule from here:
     an EVENT (a play, a tick, a rise, a pool change, the turn banner, the greeting) is a
     note; a QUESTION or an INSTRUCTION to a human (Block?, Any reaction?, Who blocks?,
     Hold-on acks, "tell me if your side differs") is chat. Same persona rewrite as chat();
     a leading "Trainbot: " is dropped because the client already prefixes [name]. Named
     note() because status() is the widget seam (v0.6.109). */
  note(msg){
    const S = '\u0001';
    let out = String(msg).replace(/^Trainbot:\s*/, '');
    out = out.replace(/Trainbot combat/g, S).replace(/Trainbot/g, this.o.name + ' (bot)').replace(new RegExp(S, 'g'), this.o.name + ' combat');
    this.send({ t: 'log', html: esc(out.slice(0, 300)) }); if(this._wdT) this._watchdogArm();
  }

  /* Pacing GATE (v0.4.5, Johan: 2s between every visible bot command in a
     real game -- actions AND reactions). Enforces AT LEAST paceMs since the
     last time this resolved, rather than a blind fixed sleep: a step that
     already took a while (a network round trip, an askBlock wait) is never
     followed by an EXTRA needless pause, but a fast step always gets the
     full breathing room. paceMs:0 (tests/the arena) never waits at all --
     the fast lane is unchanged. Call this immediately BEFORE each action a
     human at the table needs a moment to register (a played card, a bleed,
     a block, a wake, an influence raise...), not after — so the gap always
     precedes what it's pacing, matching the minion loop's existing feel.  */
  async _pace(kind){                                   // v0.6.99 (THE BEAT MODEL, Johan's design locked 8 Aug): the flat gate becomes multidimensional -- no arg = 'step' (paceMs, every legacy site unchanged), 'chat' = chatPaceMs or paceMs*1.6 (a declaration bubble plays out before the next act), 'fx' = fxBeatMs or paceMs*0.4 (the event animation's moment). paceMs 0 zeroes EVERY kind, so the suite stays fast by construction.
    await this._holdGate();   // v0.6.95 (HOLD): a human said Hold on... -- every visible act waits here. v0.6.108: the gate also ANNOUNCES (see _holdGate)
    if(!this.o.paceMs) return;
    const base = this.o.paceMs;
    const ms = kind === 'chat' ? (this.o.chatPaceMs !== undefined ? this.o.chatPaceMs : Math.round(base * 1.6))
             : kind === 'fx'   ? (this.o.fxBeatMs  !== undefined ? this.o.fxBeatMs  : Math.round(base * 0.4))
             : base;
    const cp = this.o.chatPaceMs !== undefined ? this.o.chatPaceMs : Math.round(base * 1.6);
    const chatHold = this._lastChatAt ? (this._lastChatAt + cp - Date.now()) : 0;   // v0.6.100 (Johan: 'chatten respekterar inte pausreglerna'): the NEXT visible act -- whatever its kind -- waits out the latest bubble; chat trumps default exactly as the locked design says, with zero site retags
    const wait = Math.max((this._lastActAt || 0) + ms - Date.now(), chatHold);
    this._beatUntil = wait > 0 ? Date.now() + wait : 0;   // v0.6.109 (#1): READABLE, never steppable. A beat is 2 s of the bot thinking out loud, not a deadlock, and sleep() cannot be cut short without making the gate interruptible everywhere -- so the widget shows the number and leaves the button disabled, which is exactly the honest answer.
    if(wait > 0) await sleep(wait);
    const lateHold = this._lastChatAt ? (this._lastChatAt + cp - Date.now()) : 0;   // v0.6.101 (Johan's simultaneous-vampires report): a bubble that DRAINED while we slept -- the pre-sleep chatHold read a stale stamp, so a raise's chat (queued, gap-held ~5 s) let the NEXT raise fire mid-bubble and the __board dedup swallowed its push into one two-vampire diff. The post-sleep re-check waits the late bubble out; boards drain between acts, diffs separate, cards fly one at a time.
    if(lateHold > 0) await sleep(lateHold);
    await this._holdGate();   // v0.6.101 amend (the sweep): the sleeps are ~5 s now -- a Hold on... arriving MID-sleep must still bite BEFORE the act fires, so the gate re-checks at the tail too (top + tail = airtight)
    this._lastActAt = Date.now();
  }
  _chatSettleMs(){                                        // v0.6.100: how long until every queued/playing bubble has had its beat -- the ask clock arms AFTER this (Johan's third point)
    if(!this.o.paceMs) return 0;
    const cp = this.o.chatPaceMs !== undefined ? this.o.chatPaceMs : Math.round(this.o.paceMs * 1.6);
    const hold = this._lastChatAt ? Math.max(0, this._lastChatAt + cp - Date.now()) : 0;
    let q = 0; for(const o of this._sq) q += (o && o.t === 'chat') ? cp : 200;
    return hold + q;
  }
  _beat(kind){ return this._pace(kind); }              // v0.6.99: the locked design's vocabulary -- an alias today, the seam for closed-loop beats (HB2e) tomorrow

  /* v0.5 (Johan): behave like a human using the Structured phase-bar helpers
     -- clicking a phase button is nothing but log('Phase: <b>X</b>.') with no
     localOnly flag (confirmed in the client source: activatePhase() → log() →
     mpRelay()), so the bot just sends the identical line, paced like any
     other visible command.
     v0.6.113 (Johan, 16 Sep 2026 -- THE HELPER GATE): UNCONDITIONAL. This
     used to be gated on caps.tally, "the same signal that flips the bot into
     informed mode", on the theory that tally traffic correlates with the
     helpers-on table a phase bar exists for. It does not: caps.tally is set
     by OBSERVING a resolver counter, and a helpers-OFF human gets the bare
     `free` counter on screen from the first render (any ± click shares a
     tally) while a helpers-ON human has to open Block/Vote/Combat first --
     so the proxy fired MORE readily on the table it was meant to exclude,
     never at all offline (hotBridge relays no tally), and the v2.6.111
     helper-policy bug had been supplying the seed by accident. The lines are
     the bot's own protocol -- the equivalent of a human saying "Unlock" aloud
     so the table can Hold on... and play into the phase -- and belong to the
     bot, not to whatever helpers the humans have switched on. Same class as
     `Turn passed.` (unconditional since v0.5). A helpers-off client still
     renders remote log lines; only its own buttons are hidden. */
  async _announcePhase(name){
    await this._pace();
    this.send({ t: 'log', html: 'Phase: <b>' + name + '</b>.' });
  }

  gid(){ return 'bot' + (++this._gid) + '_' + Date.now().toString(36).slice(-4); }

  buildPub(){
    return {
      deckName: this.deck.name || '', pool: this.pool, edge: this.edge, phase: -1,
      bw: GEO.bw, bh: GEO.bh,
      counts: { hand: this.hand.length, library: this.libN, crypt: this.cryptN },
      tokens: this.caps.classic ? [Object.assign({ type: 'pool' }, this.campAnchor())] : [],
      cards: this.board.map(c => ({
        id: c.id, name: c.name, kind: c.kind, zone: c.zone,
        x: Math.round(c.x), y: Math.round(c.y),
        locked: c.locked || undefined, faceDown: (this._debugHand && c.kind === 'crypt') ? undefined : (c.faceDown || undefined),   // v0.6.112 (R4): debug turns my uncontrolled crypt face UP for everyone -- Johan grading what the bot is building toward, not guessing at it
        blood: c.blood || undefined,
        host: c.host || undefined, attached: (c.attached && c.attached.length) ? c.attached : undefined   // v0.5: master-phase permanents (Blood Doll/Vessel) attach to a vampire -- without these two fields the client's sanitizePub shape has nothing to render the link with, and the card would show as a stray unattached card on other players' boards
      }))
    };
  }
  /* Board pushes are QUEUE-COALESCED: push() drops an order-preserving
     placeholder into the paced send queue; at drain time it materializes the
     LATEST pub. Bursts collapse to one wire push, causal order holds (a chat
     sent after push() still arrives after the board — no reordering).      */
  push(){
    if(this._pushQ) return;            // one already queued — it will carry the freshest pub
    this._pushQ = true;
    this.send({ __board: true });
  }

  /* ---------- table awareness ---------- */
  live(seat){ const p = this.players[seat - 1]; return p && !p.out && !p.vacant; }
  nextLive(from){ const n = this.players.length; for(let k = 1; k <= n; k++){ const s = ((from - 1 + k) % n) + 1; if(this.live(s)) return s; } return from; }
  prevLive(from){ const n = this.players.length; for(let k = 1; k <= n; k++){ const s = ((from - 1 - k + n * 8) % n) + 1; if(this.live(s)) return s; } return from; }
  preySeat(){ return this.nextLive(this.seat); }
  predSeat(){ return this.prevLive(this.seat); }   // v0.5: named symmetrically with preySeat() -- was always inlined as prevLive(this.seat) at each call site (predName, the bounce-legality check); a 2-live-player table is exactly predSeat()===preySeat()
  seatName(s){ const p = this.players[s - 1]; return p ? p.name : ('seat ' + s); }

  /* ---------- inbound dispatch ---------- */
  _dispatch(m){
    if(this.onEvent) try{ this.onEvent(m.t, m); }catch(e){}
    /* synthetic 'bot:' events (decide/through/blocked/…) are emitted via _emit —
       same channel, prefixed so they can never collide with wire verbs.      */
    const h = this._handlers[m.t];
    if(!h) return;                     // unknown-verb rule: silently ignore the rest
    try{ h(m); }                       // one bad message must never kill the process --
    catch(e){ this.o.log('handler error (' + m.t + '):', e.message); }   // the launcher seats a whole table in ONE process
  }

  _mkHandlers(){
    return {
      revealHand:     m => this._onRevealHand(m),     // R2 (v0.6.43): hand-intel -- see the block above interceptPotential
      openHandGrant:  m => this._onOpenHandGrant(m),
      openHandRevoke: m => this._onOpenHandRevoke(m),
      logTo: m => {                                    // R3: private line -- Revelations' discard command is the only consumed shape today
        const t = stripTags(String((m && m.html) || '')).trim();
        const dm = t.match(/^Revelations: discard (.+?)\.$/);
        if(!dm) return;
        const nm = dm[1], ix = this.hand.indexOf(nm);
        if(ix >= 0){
          this.hand.splice(ix, 1);
          this._toAsh(nm);
          this.send({ t: 'draw' });                    // the replacement draw the actor never sees (LSJ 20100119)
          this.push();
          this.note('Trainbot discards ' + nm + ' (Revelations) and draws.');
          this._emit('forced-discard', { name: nm });
        } else this.note('Trainbot: I do not hold ' + nm + ' \u2014 table\u2019s call.');
      },
      joined: m => {
        this.seat = m.seat; this.token = m.token; this.players = m.players || [];
        this.started = !m.lobby;
        this._noServer = /^hotseat-bridge/.test(String(m.srv || ''));   // v0.6.147: the client's hotseat bridge names itself in `srv` -- there is no server behind it to keep the roster or route the bounty (see _onBoard)
        if(m.reactSecs > 0) this._reactSecs = m.reactSecs | 0;   // v0.6.114: the room's Reaction stopwatch length -- the window re-stamps against it once the stopwatch has rung
        if(m.turn) this.turnSeat = m.turn;
        this.o.log('joined "' + m.room + '" as seat ' + this.seat +
                   (m.lobby ? ' (lobby)' : '') + ' — server v' + (m.srv || '?'));
        if(m.boardMode === 'classic'){
          this.caps.classic = true;
          this.o.log('note: classic board mode — no opening uncontrolled deal; the bot will drawCrypt as needed');
        }
        if(this._rejoining){                         // v0.6.106 (#11): a REJOIN -- the seat is reclaimed with hand/board/pool intact in this process; the deck must NOT be re-uploaded (the server would deal a fresh hand mid-game)
          this._rejoining = false; this._reconnN = 0;
          if(this._rejoinT){ clearTimeout(this._rejoinT); this._rejoinT = null; }
          this.o.log('rejoined "' + m.room + '" as seat ' + this.seat + ' -- resuming');
          this.push();                                  // re-sync my board for everyone
          if(this.started && !this.out && m.turn === this.seat && !this._acting)   // my turn came while I was away: the table is waiting on me
            this._playTurn().catch(e => this.o.log('turn error:', e.message));
          return;
        }
        /* upload the playbook immediately; seat pick happens on the lobby push */
        this.send({ t: 'deck', name: this.deck.name,
                    library: this.deck.library.map(e => ({ name: e.name, qty: e.qty })),
                    crypt:   this.deck.crypt.map(e => ({ name: e.name, qty: e.qty })) });
      },
      lobby: m => {
        if(this._seatPicked || this.started) return;
        const want = this.o.seat || 0;
        const me = (m.players || []).find(p => p.name === this.o.name);
        if(me && me.seat){ this._seatPicked = true; return; }
        const taken = new Set((m.players || []).map(p => p.seat).filter(Boolean));
        let pick = 0;
        if(want && !taken.has(want)) pick = want;
        else for(let s = 1; s <= m.seats; s++) if(!taken.has(s)){ pick = s; break; }
        if(pick){ this._seatPicked = true; this.send({ t: 'seat', seat: pick }); }
      },
      deckok: m => this.o.log('deck accepted: ' + m.deckName),
      started: m => {
        this.started = true; this.players = m.players || this.players;
        this.seat = (this.players.find(p => p.name === this.o.name) || { seat: this.seat }).seat;
        this.out = false; this.ownTurns = 0; this.inf = 0; this._tableBlockAttempts = 0;
        this._holdBy = new Set(); if(this._holdRemT){ clearTimeout(this._holdRemT); this._holdRemT = null; }   // v0.6.95: a fresh game holds for nobody
        this._holdAnnounced = false; this._pendingTurn = null;   // v0.6.108: and carries no queued turn or stale hold announcement
        this.o.log('game started — I am seat ' + this.seat + ', my prey is ' + this.seatName(this.preySeat()));
      },
      dealt: m => {
        this.hand = [...(m.hand || [])];
        this.libN = m.lib || 0; this.cryptN = m.crypt || 0;
        this.pool = this.o.startPool; this.edge = false; this.board = []; this.unc = []; this._handSizeBonus = 0; this._handSizePermanentPrev = 0;
        this.phaseActs = { master: 1, influence: 4, discard: 1 };
        this.phaseBonus = { master: 0, influence: 0, discard: 0 };
        this.phaseUsed = { master: 0, influence: 0, discard: 0 };
        this.table = {}; this.reads = {}; this.opp = {}; this._clearPending('fresh deal'); this._clearCombatStashes();
        /* v0.6.112 (R4, #3b): debug arms on the deal, not at construction -- openHand
           is started-gated by the server, so a grant sent before the match exists is
           silently dropped. Announced in chat because a table that can see my hand
           must KNOW it can; a silent debug mode is an unfair table, not a debug mode. */
        if(this.o.debug && !this._debugHand){
          this._debugHand = true;
          this.note('Trainbot is in DEBUG mode: open hand, crypt face up' + (this.o.debugWeights !== false ? ', decision weighting in the log' : '') + '.');
        }
        (m.unc || []).forEach(name => this._addUnc(name));
        /* v0.6.17 (Johan's practical-testing GO, T2-adjacent "rigged path"): o.rig lets
           a caller (the arena's --rig, or a direct test) OVERRIDE the server's random
           deal with a forced starting hand/board -- entirely bot-LOCAL, no server
           change needed (training backlog T2's own design lean: "(b) needs no server
           change"). The server never validates hand contents -- push() just
           broadcasts this.hand/board/pool verbatim (confirmed by reading push() and
           the __board serialize path) -- so a rigged bot plays through the REAL
           announce/handshake pipeline exactly like a normally-dealt one. This closes
           the gap between an isolated finder unit test (32e: calls _bestBloodStockFor
           directly) and waiting on random arena draws to exercise a specific
           card/mechanism end-to-end. Deliberately narrower than full T2 (no seeded
           PRNG, no cross-game determinism, no T3 integration) -- see
           elysium-bot-training-backlog.md; this is a standalone practical slice, not
           a claim of having built T2.                                               */
        if(this.o.rig){
          const r = this.o.rig;
          if(r.hand) this.hand = [...r.hand];
          if(r.unc){
            this.unc.forEach(c => { const i = this.board.indexOf(c); if(i >= 0) this.board.splice(i, 1); });
            this.unc = [];
            r.unc.forEach(name => this._addUnc(name));
          }
          (r.ready || []).forEach(spec => {
            const cap = (typeof spec.cap === 'number') ? spec.cap
                      : (this.fxCryptCap(spec.name) != null) ? this.fxCryptCap(spec.name) : 3;
            const pos = this._openSlot('ready');
            this.board.push({ id: this.gid(), name: spec.name, kind: 'crypt', zone: 'ready',
                               x: pos.x, y: pos.y, faceDown: false, locked: false,
                               blood: (typeof spec.blood === 'number') ? spec.blood : cap, cap });
          });
          if(typeof r.pool === 'number') this.pool = r.pool;
          /* v0.6.18 (Johan's standing question): a name listed in BOTH r.unc and
             r.ready (or colliding with a legitimate 2nd-copy elsewhere) silently
             produces two separate board entries -- harmless if the deck really PRINTS
             that many copies (Ayelech x2 in the Tremere V5 starter), a quietly-
             impossible board otherwise (most named vampires are singletons). This is
             a TESTING tool where an intentionally-illegal rig can be a legitimate
             stress probe, so this warns rather than throws -- but it must never be
             SILENT, matching the deal-as-gameplay-feature/specification-gaming stance
             elsewhere in this project (sanctioned when visible, never when hidden). */
          const counts = {};
          this.board.filter(c => c.kind === 'crypt').forEach(c => counts[c.name] = (counts[c.name] || 0) + 1);
          for(const name in counts){
            const meta = this.deck.crypt.find(e => e.name === name);
            const printed = meta ? meta.qty : 0;
            if(counts[name] > printed) this.o.log('⚠ rig: "' + name + '" appears ' + counts[name] + 'x on the board but the deck prints only ' + printed + ' cop' + (printed === 1 ? 'y' : 'ies') + ' -- check rig.unc/rig.ready for an overlap, or a name not in this deck\'s own crypt list (typo / wrong-deck name)');
          }
        }
        this._emit('dealt', { hand: [...this.hand], unc: this.unc.map(c => c.name), startPool: this.pool, rigged: !!this.o.rig });
        this._emitManifest();   // A2: the yardstick rides right behind the opening
        this.push();
        /* greeting: only the FIRST bot in seat order speaks — multiple bots
           each announcing their grammar floods the chat with animations.
           All bots still play identically; the grammar applies to all of them. */
        const botSeats = (this.players || []).filter(p => p.bot && !p.vacant).map(p => p.seat).sort((a, b) => a - b);
        if(this._isSpokesBot()){
          const nBots = botSeats.length, we = nBots > 1;
          this.note('Trainbot' + (we ? ' (\u00d7' + nBots + ')' : '') + ' is seated. ' + (we ? 'We answer' : 'I answer') + ' to: "bleed N", "vote N", and "block/no" when ' + (we ? 'we ask' : 'I ask') + '. Be gentle. 🦇');
          if(we)   // v0.6.108: with several bots seated, a bare "bleed N" only reaches the sender's prey — teach the scoped form up front
            this.note('With several bots seated, a bare "bleed N" goes to your prey \u2014 say "@Name bleed N" to aim at a specific one.');
          if(this.caps.classic)
            this.note('Tip: ' + (we ? 'Bots play' : 'I play') + ' best on a Structured table with the resolvers on \u2014 but ' + (we ? 'we' : 'I') + ' will follow along here.');
        }
        if(this.caps.classic && this.unc.length === 0 && this.cryptN > 0){   // v0.6.98 (Johan's question: 'so the bot draws 4 in classic now?' -- the honest answer was NO, and that was the bug): a human in classic places 4 uncontrolled FREE as setup; the bot's equivalent is 4 cost-free drawCrypt verbs -- the 4-transfers+1-pool price belongs to the influence FETCH's bookkeeping, never to the wire verb itself. Pre-existing online too (the server deals 0 in classic); this closes it everywhere.
          const n0 = Math.min(4, this.cryptN);
          for(let i = 0; i < n0; i++) this.send({ t: 'drawCrypt' });
          this.o.log('classic setup: drawing the opening ' + n0 + ' uncontrolled (free -- the same 4 a Structured deal grants)');
        }
      },
      drew: m => {
        this.libN = m.lib ?? this.libN; this.cryptN = m.crypt ?? this.cryptN;
        if(m.zone === 'hand'){
          if(this._fetchDebt && (this._fetchDebt[m.name] | 0) > 0){   // E1: the phantom copy of an already-fetched card -- consume the debt, redraw, stay honest
            this._fetchDebt[m.name]--;
            this.send({ t: 'draw' });
            if(!this._fetchNoteDone){ this._fetchNoteDone = true; this.note('Trainbot: drew the previously fetched copy \u2014 cycling it (Magic of the Smith bookkeeping).'); }
          } else { this.hand.push(m.name); this._syncOpenHand(); this.push(); }
        }   // R3: a draw changes the granted open hand
        else if(m.zone === 'uncontrolled'){ this._addUnc(m.name); this.push(); }
      },
      roster: m => {
        this.players = m.players || this.players;
        if(this._ask && this._ask.target && !this.live(this._ask.target))   // v0.6.106 (#3): the ask's OWN target (ousted or vacant) -- the old `preySeat() && p.out` could never hold, preySeat() already skips out seats
          this._answer('no', null);                      // the target left mid-ask — the window dies with them
        this._releaseDeparted(m.players || []);          // v0.6.106 (#5): a departed holder/thinker no longer freezes the bot
      },
      turn: m => {
        if(this.pending && m.seat !== this.turnSeat){
          /* the acting turn ended with my pending bleed unresolved — never
             auto-apply stale damage; the chat grammar is the safety valve.  */
          this.chat('Note: an unresolved bleed at me expired with the turn — if it landed, tell me "bleed ' + this.pending.amount + '".');
          this._clearPending('turn change');
        }
        this.turnSeat = m.seat;
        if(this.started && this.out && m.seat === this.seat){   // v0.6.147 (THE HOTSEAT NET, measured: 4 of 4 bridge tables froze at the first turn handed to an ousted bot): the SERVER never gives an ousted seat the turn (nextLiveSeat), but the client's hotseat sweep walks its config, not the roster, and waits for a `pass` with no timeout. An ousted bot hands the turn straight on. Online this branch is unreachable.
          this._emit('ousted-pass', { turn: m.seat }); this.send({ t: 'pass' }); return; }
        if(this.started && !this.out && m.seat === this.seat){
          /* v0.6.108 (client handoff item 2): a turn arriving while the bot is
             still winding down its previous one used to be dropped silently
             with nothing to retrigger it. Queue it instead; _playTurn's finally
             replays it — re-checking turnSeat first, so a turn that has since
             moved on is never replayed stale. Also covers the second drop path
             the handoff didn't name: a _playTurn that THREW clears _acting in
             its finally, and nothing retried. */
          if(this._acting) this._pendingTurn = m.seat;
          else this._playTurn().catch(e => this.o.log('turn error:', e.message));
        }
      },
      board: m => this._onBoard(m),
      say:   m => this._onSay(m),
      log:   m => this._onLog(m.who, m.html),
      tally: m => {
        const wasVote = this.tally && this.tally.mode === 'vote';
        this.caps.tally = true; this.tally = m;
        if(m && m.who !== this.o.name) this._fTallyAt = Date.now();   // v0.6.147: a counter written by SOMEBODY ELSE reached me -- the relay carries tally, the net below stands down
        if(m.mode === 'block' && this._ask && this._ask.contested && this._actingVamp && !this.out){ try { this._stealthSecondLook(); } catch(e){ this.o.log('second-look error:', e.message); } }   // v0.6.143c
        if(m.mode === 'block' && this.pending && this.pending.contested && this.pending.blockerVamp && !this.out){ try { this._interceptSecondLook(); } catch(e){ this.o.log('blocker second-look error:', e.message); } }   // v0.6.143d
        if(m.mode === 'block' && this._oppLastAct && (m.a | 0) > (this._oppLastAct.a | 0)) this._oppLastAct.a = m.a | 0;   // v0.6.118: announced stealth, remembered per action (the max the window reached)
        if(m.mode === 'vote' && !wasVote && !this.out) this._onVoteOpen(m).catch(e => this.o.log('vote-open error:', e.message));   // P0: the polling window IS this edge; v0.6.68: .catch (fire-and-forget hardening)
        if(this._refCall && !this._refCall.closed){ const rc = this._refCall;   // v0.6.122: my referendum is polling -- a counter moved by hand (+/- or the client's Votes menu) is a vote too; the counter CLOSING under me is a human's Resolve
          if(m.mode === 'vote'){ if((m.a | 0) !== (rc.lastA | 0) || (m.b | 0) !== (rc.lastB | 0)){ rc.lastA = m.a | 0; rc.lastB = m.b | 0; rc.arm(); } }
          else if(wasVote) rc.done('the counter was closed'); }
        if(m.mode !== 'vote' && wasVote) this._onVoteClose();                  // P0: the referendum closed -- the once-guard re-arms   // M2 (spec §7.5-D): the table never waits on a bot with no titles; v0.4.2: the ousted stay quiet
        if(m.mode === null && this._ask && this._ask.contested){   // v0.3.9 (Johan): a null tally with no verdict line = the block was WITHDRAWN (the × cancel) — reopen the window fresh
          this._ask.contested = false;
          this._restartAskTimer();
          this._armReactTimer();
        } },
      fx:    m => this._onFx(m),
      chat: m => this._onChat(m.who, m.msg),
      sys: m => this.o.log('sys:', m.msg),
      err: m => { this.o.log('err:', m.msg); this._emit('server-err', { msg: m && m.msg }); },   // v0.6.130: a refused verb was invisible in every trace (debt 26a)
      forceSetPool: m => {                             // the host referee kit (hostSetPool → this) — v0.3.7: clamp + oust-on-zero (a host draining a bot to 0 means exactly that)
        this.pool = Math.max(0, Math.min(999, m.val | 0));
        this.note('Trainbot: pool set to ' + this.pool + ' by the host.');
        if(this.pool <= 0 && !this.out) this._oust(true); else this.push();
      },
      forceOust: () => this._oust(true),
      given: m => this._onGiven(m),   // v0.6.128: a card dropped on MY board by another player (protocol s2c `given`) -- ignored until now
      ctrl: m => {                       // v0.4.4 (Johan, 13 July): bot-elements exception -- ANY player may adjust
        const c = this.board.find(x => x.id === String(m.cid || '')); if(!c) return;   // this seat's own cards, since a headless bot can't model every triggered ability (untap-phase pings, torpor, etc.). No owner check by design: the client already gates the menu to bot seats only (net.roster[].bot), so reaching this handler at all already means the table opted in.
        const act = String(m.act || '');
        if(act === 'blood+') c.blood = Math.min(99, (c.blood | 0) + 1);
        else if(act === 'blood-') c.blood = Math.max(0, (c.blood | 0) - 1);
        else if(act === 'blue+') c.blue = Math.min(99, (c.blue | 0) + 1);
        else if(act === 'blue-') c.blue = Math.max(0, (c.blue | 0) - 1);
        else if(act === 'green+') c.green = Math.min(99, (c.green | 0) + 1);
        else if(act === 'green-') c.green = Math.max(0, (c.green | 0) - 1);
        else if(act === 'lock') c.locked = true;
        else if(act === 'unlock') c.locked = false;
        else if(act === 'flip') c.faceDown = !c.faceDown;
        else if(act === 'burn'){ const was = c.zone; c.zone = 'burned'; this.board = this.board.filter(x => x !== c && x.attachTo !== c.name); this.note('Trainbot: ' + c.name + ' is burned' + (was === 'torpor' ? ' (diablerie or final death in torpor)' : '') + '.'); this._emit('burned-by-table', { card: c.name, from: was }); }   // v0.6.129: the table burns one of my cards -- a human's diablerie of my torpored vampire had no verb (spec to main: add Burn to the bot-element menu)
        else if(act === 'torpor'){ c.zone = 'torpor'; const tp = this._openSlot('torpor', c); c.x = tp.x; c.y = tp.y; this._fameTorporHook(c); }   // v0.4.5: reposition too -- a bare zone flip left x/y wherever the card used to be (e.g. still its old uncontrolled slot), off the actual torpor/ready row
        else if(act === 'untorpor'){ c.zone = 'ready'; const rp = this._openSlot('ready', c); c.x = rp.x; c.y = rp.y; this._emit('recover', { vamp: c.name, via: 'untorpor' }); }
        else return;                     // unknown verb: ignore rather than push a no-op board
        this.o.log('ctrl from ' + (m.from || '?') + ': ' + act + ' on ' + (c.name || c.id));
        this.push();
      },
      bounty: m => {
        if(this._bountyFrom && this._bountyFrom.has(m.from)){ this.o.log('bounty from ' + m.from + ' already collected (no-server net)'); return; }   // v0.6.147
        this.pool += 6;
        this.push();
        this.note('Trainbot collects the bounty from ' + m.from + ': +6 pool (' + this.pool + ') and 1 VP. The Jyhad provides.');
      }
    };
  }

  _addUnc(name){
    const meta = this.deck.crypt.find(e => e.name === name);
    const cap = (meta && typeof meta.cap === 'number') ? meta.cap       // playbook annotation = override
              : (this.fxCryptCap(name) != null) ? this.fxCryptCap(name) // cardfx (three-tier ladder)
              : 3;                                                      // last resort — annotate or ship cardfx
    const pos = this._openSlot('uncontrolled');          // v0.4.5: NOT this.unc.length (a raised/removed card can hole the middle -- see _openSlot)
    const c = { id: this.gid(), name, kind: 'crypt', zone: 'uncontrolled',
                x: pos.x, y: pos.y, faceDown: true, locked: false, blood: 0, cap };
    this.unc.push(c); this.board.push(c);
  }

  /* ---------- cardfx: the three-tier name ladder ---------- */
  fxLookup(name){
    const f = this.fx; if(!f || !name) return null;
    const hit = canon => f.lib[canon] ? { kind: 'lib', name: canon, e: f.lib[canon] }
              : f.crypt[canon] ? { kind: 'crypt', name: canon, e: f.crypt[canon] } : null;
    let h = hit(name); if(h) return h;                              // 1) exact
    const viaAlias = f.alias[String(name).trim().toLowerCase()];    // 2) lowercase alias
    if(viaAlias && (h = hit(viaAlias))) return h;
    const viaNorm = f.normIdx.get(FX_NORM(name));                   // 3) client-identical norm
    if(viaNorm && (h = hit(viaNorm))) return h;
    return null;
  }
  fxCryptCap(name){ const h = this.fxLookup(name); return (h && h.kind === 'crypt' && typeof h.e.cap === 'number') ? h.e.cap : null; }
  fxCryptUnique(name){ const h = this.fxLookup(name); return (h && h.kind === 'crypt') ? h.e.unique : undefined; }   // undefined = unique (the default); false = the five true non-uniques
  /* ---- VA (2 Aug, elysium-bot-vampire-plan.md): crypt-ability consumers -- the numeric
     quartet + the twin-site filter. Each seat applies its OWN vampires' curated fx (the
     both-sides two-driver model); the only cross-read is fxCryptCap on the ANNOUNCED
     actor name (Navar's age rule). Per-minion stealth/intercept TOTALS floor at 0
     everywhere they are compared or written (rulebook: neither can be reduced below
     zero -- so a bare Christine at raw -1 still legally blocks a 0-stealth action);
     the raw helpers return unfloored deltas, the floor sits at the summing sites.    */
  _cryptFxOf(name){ const h = this.fxLookup(name); return (h && h.kind === 'crypt' && h.e.fx) || null; }
  _cryptBleedBonus(vamp){ const fx = vamp && this._cryptFxOf(vamp.name); return (fx && (fx.bleedBonus | 0)) || 0; }   // Lenny Burkhead: +1 bleed, passive unconditional   // the local is NAMED fx so the coverage scanner's fx.<key> literal sees the read (the N4a scanner lesson, applied at birth this time -- the first draft's `f` hid all four keys)
  _cryptStealthMod(vamp, kind){ const fx = vamp && this._cryptFxOf(vamp.name); const m = fx && fx.stealthMod;
    return (m && (!m.when || m.when === kind)) ? (m.n | 0) : 0; }                                                  // Royce: -1 stealth when bleeding
  _cryptIntercept(vamp, pOrKind){ const fx = vamp && this._cryptFxOf(vamp.name); const m = fx && fx.interceptMod;
    if(!m) return 0;
    const kind = (typeof pOrKind === 'string') ? pOrKind : (pOrKind && pOrKind.kind);
    const peekDir = !!(pOrKind && typeof pOrKind === 'object' && kind === 'peek' && pOrKind.peekSup === false);   // VA review (2 Aug): the [aus] Revelations IS directed and the pending has carried the form since R3 (peekSup, set at both arm grammars) -- the earlier "cannot distinguish" under-claim was wrong, so the Dowager +1 now applies on aus-peek blocks too; a bare 'peek' string (legacy/tests) stays conservatively undirected
    const directed = (kind === 'bleed' || kind === 'pool' || kind === 'rush' || peekDir);   // the blockable directed kinds this bot arms
    const on = !m.when || (m.when === 'bleed' ? kind === 'bleed' : m.when === 'directed' ? directed : false);
    return on ? (m.n | 0) : 0; }                                                                                   // The Dowager: +1 directed / Christine Boscacci: -1 on bleeds
  _cryptCannotBlock(vamp, actorName){ const fx = vamp && this._cryptFxOf(vamp.name); if(!(fx && fx.blockNotOlder)) return false;
    const myCap = this.fxCryptCap(vamp.name), aCap = actorName ? this.fxCryptCap(actorName) : null;
    return (myCap != null && aCap != null && aCap > myCap); }                                                      // Navar McClaren: older = strictly higher CAPACITY (the age rule, v0.6.15 source-verify); unknown caps invent no restriction
  _cryptStrengthMod(vamp, oppName){ const fx = vamp && this._cryptFxOf(vamp.name); const m = fx && fx.strengthMod;   // VB: Blythe-class conditional strength (printed: "-1 strength when in combat with a Malkavian")
    if(!m || !oppName) return 0;
    if(m.vsClan){ const h = this.fxLookup(oppName); const cl = h && h.kind === 'crypt' && h.e.clan; const arr = Array.isArray(cl) ? cl : (cl ? [cl] : []);
      if(!arr.includes(m.vsClan)) return 0; }
    return m.n | 0; }
  _cryptBleedBoostFx(vamp){ const fx = vamp && this._cryptFxOf(vamp.name); return (fx && fx.bleedBoostDiscard) || null; }   // VB: Larissa-class -- discard a card requiring the named discipline for +n bleed
  _cryptSelfUnlockFx(vamp){ const fx = vamp && this._cryptFxOf(vamp.name); return (fx && fx.selfUnlock) || null; }   // v0.6.127: Sybren-class -- unlocks himself when his window opens ({ when: 'refPassed' }, the act-again riders' vocabulary)
  _cryptVoteBoostFx(vamp){ const fx = vamp && this._cryptFxOf(vamp.name); return (fx && fx.voteBoostDiscard) || null; }   // v0.6.127: Alexa-class -- discard a card requiring the named discipline for +n votes in ANY referendum's polling step (Larissa's shape)
  _cryptVoteTax(name){ const fx = name ? this._cryptFxOf(name) : null; return (fx && (fx.voteTaxAgainst | 0)) || 0; }   // v0.6.127: Silverson-class -- vampires burn n blood to cast votes AGAINST a referendum this vampire called
  _discardPickFor(disc, force, skip){   // a hand card that REQUIRES the discipline (every mode gated on it, the Larissa rule). Policy: a dead card first, then a duplicate, then surplus >= 3; `force` takes the first one left (a vote that turns a referendum is worth a card that is replaced anyway)
    const need = ((disc || '') + '').toLowerCase(); if(!need) return null;
    const isReq = nm => { const h = this.fxLookup(nm); if(!h || h.kind !== 'lib') return false; const ms = h.e.modes || []; return ms.length > 0 && ms.every(mo => ((mo.at || '') + '').toLowerCase() === need); };
    const q = (this.hand || []).map((nm, i) => ({ nm, i })).filter(o => isReq(o.nm) && !(skip && skip.indexOf(o.nm) >= 0));
    if(!q.length) return null;
    const di = this._deadHandIndex((this.board || []).filter(c => c.kind === 'crypt' && c.zone === 'ready'));
    const dup = q.find(o => q.some(x => x.i !== o.i && x.nm === o.nm));
    return q.find(o => o.i === di) || dup || (q.length >= 3 ? q[0] : null) || (force ? q[0] : null);
  }
  _voteDiscardBoosts(force, skip){   // one entry per ready vampire of mine with the Alexa-class text and a card to pay with; once per referendum per vampire (v1)
    const out = [], used = (skip || []).slice();
    (this.board || []).forEach(c => { if(!c || c.kind !== 'crypt' || c.zone !== 'ready') return;
      const vb = this._cryptVoteBoostFx(c); if(!vb) return;
      const pick = this._discardPickFor(vb.disc, force, used); if(!pick) return;
      used.push(pick.nm); out.push({ kind: 'discard', vamp: c, name: pick.nm, n: vb.n | 0 }); });
    return out;
  }
  _spendVoteDiscard(b, dir){
    const j = this.hand.indexOf(b.name); if(j < 0) return false;
    this.hand.splice(j, 1); this._drawOwed = (this._drawOwed || 0) + 1; this._toAsh(b.name);
    this.send({ t: 'log', html: '<b>' + esc(b.vamp.name) + '</b> discards <b>' + esc(b.name) + '</b> \u2014 +' + b.n + ' vote' + (b.n === 1 ? '' : 's') + ' ' + dir + ' the referendum.' });
    this._emitPlay(b.name, 'vote-discard', b.vamp.name);
    return true;
  }
  _titleVoters(){ const out = []; (this.board || []).forEach(c => { if(!c || c.kind !== 'crypt' || c.zone !== 'ready') return; const h = this.fxLookup(c.name); const v = (h && h.kind === 'crypt' && typeof h.e.votes === 'number') ? h.e.votes : 0; if(v > 0) out.push({ c, votes: v }); }); return out; }
  _votesToCast(dir, stake){          // v0.6.127: my title votes for THIS referendum after the crypt layer. Silverson-class tax on an AGAINST vote: each voting vampire burns the tax; one that would drop to 0 blood pays only when the referendum costs me pool, and a 0-blood vampire's votes stay home. Alexa-class discard: only when it costs me pool (the caller's side holds it like any other boost).
    const tax = dir === 'against' ? this._cryptVoteTax(this._refActor && this._refActor.vamp) : 0;
    let n = 0; const paid = [];
    this._titleVoters().forEach(x => { if(!tax){ n += x.votes; return; }
      const b = x.c.blood | 0; if(b >= tax + 1 || (stake > 0 && b >= tax)){ x.c.blood = b - tax; n += x.votes; paid.push(x.c.name); } });
    let boost = 0;
    if(dir === 'against' && stake > 0) this._voteDiscardBoosts(false, null).forEach(b => { if(tax && paid.indexOf(b.vamp.name) < 0) return; if(this._spendVoteDiscard(b, 'against')) boost += b.n; });
    if(paid.length){ this.push(); this.send({ t: 'log', html: '<b>' + esc(paid.join(', ')) + '</b> burn' + (paid.length === 1 ? 's' : '') + ' ' + tax + ' blood to vote against \u2014 <b>' + esc(this._refActor.vamp) + '</b>.' }); this._emit('vote-tax', { by: this._refActor.vamp, paid, tax }); }
    if(boost) this._flushDraws();
    return { n: n + boost, tax, paid, boost };
  }
  _undirectedBaseStealth(v, kind){   // VC (rulebook, vekn.net -- the Wauneka hunt example + comprehensive rules): the undirected BASE actions hunt/equip/recruit carry a DEFAULT +1 stealth; card actions keep their own printed stealth and are untouched. Zoe's printed exception ('does not get the usual +1 stealth when hunting') zeroes the hunt case only.
    if(kind === 'hunt'){ const fx = this._cryptFxOf(v && v.name); if(fx && fx.noHuntStealth) return 0; }
    return 1; }
  _maybeEnterPlayDraw(card){         // VC: New Blood -- 'As New Blood enters play during your influence phase, choose any circle and draw 1 card from your crypt.' The crypt draw is the mechanic; the circle choice is table-noted (Blood Brother circles are unmodeled).
    const fx = this._cryptFxOf(card && card.name);
    const dn = fx && fx.enterPlay && (fx.enterPlay.drawCrypt | 0);
    if(!(dn > 0)) return 0;
    for(let i = 0; i < dn; i++) this.send({ t: 'drawCrypt' });
    this.note(card.name + ' enters play \u2014 draws ' + dn + ' from the crypt (printed enter-play draw; circle choice unmodeled, note it at the table).');
    return dn; }
  _maybeLubomiraMark(v){             // VC: Lubomira Hradok -- 'If Lubomira successfully bleeds a Methuselah who controls a ready titled vampire, she does not unlock as normal during her next unlock phase.' Ruling [PIB 20110915]: SHE is the one who doesn't unlock. Called at the bleed-success commit; the target seat is the ACTUAL bleed target (_actingVamp.target follows bounces). Titles are PRINTED (fxLookup .title -- the rebelBlood read path); acquired titles stay politics-scope.
    const fx = this._cryptFxOf(v && v.name);
    if(!(fx && fx.noUnlockAfterTitledBleed)) return false;
    const tSeat = this._actingVamp && this._actingVamp.target;
    const tPub = this.table && this.table[tSeat] && this.table[tSeat].pub;
    const titled = !!(tPub && (tPub.cards || []).some(c => {
      if(c.zone !== 'ready') return false;
      const hv = this.fxLookup(c.name);
      return !!(hv && hv.e && hv.e.title); }));
    if(!titled) return false;
    v._skipNextUnlock = true;
    this.note(v.name + ' bled a Methuselah with a ready titled vampire \u2014 she will not unlock as normal next unlock phase (her printed text).');
    return true; }
  _duelOppName(){                      // VB review: the combat OPPONENT's vampire name from the server-merged duel map (srv keys duel[seat] per seat, srv-2.6.14) -- the seat that isn't mine. Read LAZILY at the strike site: by then the opponent's strike line has arrived, which proves their _resolveCombat entry (and thus their duel write) preceded it -- race-free.
    const d = this.tally && this.tally.duel; if(!d) return null;
    for(const k in d){ if((k | 0) !== this.seat && d[k] && d[k].name) return d[k].name; }
    return null; }
  _maybeLarissaBoost(v, act){          // VB: "During a bleed action, Larissa can discard a card requiring Animalism [ani] to get +1 bleed" -- once per action (v1), BEFORE the announce so tally/emit/comply all see the boosted n. A qualifying card REQUIRES the discipline: every mode carries that at (case-folded, [ani]+[ANI] both qualify, mixed-discipline cards do not). Policy: a genuinely DEAD qualifying card first (free lunch), else surplus >= 3 -- never trade a scarce live card for +1.
    const bb = this._cryptBleedBoostFx(v); if(!bb) return false;
    const need = ((bb.disc || '') + '').toLowerCase();
    const isReq = nm => { const h = this.fxLookup(nm); if(!h || h.kind !== 'lib') return false; const ms = h.e.modes || []; return ms.length > 0 && ms.every(mo => ((mo.at || '') + '').toLowerCase() === need); };
    const q = this.hand.map((nm, i) => ({ nm, i })).filter(o => isReq(o.nm));
    if(!q.length) return false;
    const di = this._deadHandIndex(this.board.filter(c => c.kind === 'crypt' && c.zone === 'ready'));
    const pick = q.find(o => o.i === di) || (q.length >= 3 ? q[0] : null);
    if(!pick) return false;
    this.hand.splice(pick.i, 1); this._drawOwed = (this._drawOwed || 0) + 1;
    this._toAsh(pick.nm);
    act.n = (act.n | 0) + (bb.n | 0);
    this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> discards <b>' + esc(pick.nm) + '</b> \u2014 +' + (bb.n | 0) + ' bleed.' });
    this._emitPlay(pick.nm, 'larissa-boost', v.name);
    return true; }
  _inPlayNorms(){                    // norm'd names IN PLAY table-wide (ready/torpor; uncontrolled is not in play)
    const out = new Set();
    this.board.forEach(c => { if(c.zone !== 'uncontrolled' && c.name) out.add(FX_NORM(c.name)); });
    Object.values(this.table).forEach(t => (t.pub && t.pub.cards || []).forEach(c => {
      if(c.zone !== 'uncontrolled' && c.name && !c.faceDown) out.add(FX_NORM(c.name));
    }));
    return out;
  }
  _mayPlay(canonical, entry, played, asReferendum){   // rules gate for playing a library card
    if(entry.t && entry.t.indexOf('political') >= 0 && asReferendum !== true) return false;   // v0.6.121 (debt 14): a political card is played ONLY by calling its referendum -- no finder may offer it as a plain action (Kine Resources Contested carried an auto poolDmg:1 and would have resolved as a directed burn-1 with no vote). cardfx v1.7.0 closes the same hole in the DATA (outcome keys live in e.ref); this line holds against an older compile. The referendum caller passes asReferendum = true.
    if(played && played.has(FX_NORM(canonical))) return false;              // same-named modifier/reaction: once per ACTION (rulebook)
    if(entry.unique && this._inPlayNorms().has(FX_NORM(canonical))) return false;   // unique cards contest like vampires — never start one
    return true;
  }
  fxThreatOf(e){                    // the DEFENDER's read of a lib entry: worst-case pool/blood pain
    let pool = 0, blood = 0;
    (e.modes || []).forEach(mo => {
      if(typeof mo.fx.poolDmg === 'number') pool = Math.max(pool, mo.fx.poolDmg);
      if(typeof mo.fx.bleed === 'number' && mo.fx.bleedAct) pool = Math.max(pool, 1 + mo.fx.bleed);
      if(typeof mo.fx.bloodBurn === 'number') blood = Math.max(blood, mo.fx.bloodBurn);
      if(typeof mo.fx.stealBlood === 'number') blood = Math.max(blood, mo.fx.stealBlood);
    });
    pool = Math.max(pool, this._refWorstPool(e));   // v0.6.121: a referendum's terms are a threat too (cardfx v1.7.0 moved them out of modes)
    return { pool, blood };
  }
  _refWorstPool(e){                 // v0.6.121: the most pool ONE Methuselah can lose to this referendum, from the printed terms alone (no table): alloc n among >= min -> n - (min - 1); chosen / move -> n; each -> n (x2 when it scales with a board counter -- a guess, flagged as one). Tag-only cards fall back to the generic key in ref.fx.
    const r = e && e.ref; if(!r) return 0;
    let w = 0;
    (r.pool || []).forEach(p => { if(p.sign > 0) return; const n = typeof p.n === 'number' ? p.n : 4;
      w = Math.max(w, p.scope === 'alloc' ? n - ((p.min | 0 || 1) - 1) : p.scope === 'each' ? n * (p.per ? 2 : 1) : n); });
    if(!w && r.fx && typeof r.fx.poolDmg === 'number') w = r.fx.poolDmg;
    return w;
  }
  _modeUsableBy(mo, vamp, o){       // can THIS vampire meet the mode's discipline gate?
    if(mo.fx && (mo.fx.selfDmg || mo.fx.selfTorpor) && !(o && o.selfPrice)) return false;   // v0.6.127 (cardfx v1.9.0): a mode that HURTS its own vampire (Daring the Dawn, Force of Will, Day Operation) is closed to every generic finder -- only a consumer that pays the price asks with { selfPrice: true } (the unpaid-cost rule, applied at birth)
    if(mo.fx && mo.fx.bounce && this.predSeat() === this.preySeat()) return false;   // v0.5 (Johan): a bounce needs "another Methuselah" per the rulebook -- in a 2-live-player table my prey IS my predator, so no legal destination ever exists. Same fact _reactWindow's bounceLegal already checks per-actor; here it's the table-structural version so discard (and anything else asking _modeUsable) treats a bounce-only card as dead fodder instead of holding it forever
    if(!mo.at) return true;
    const cv = this.fxLookup(vamp.name); const d = cv && cv.kind === 'crypt' && cv.e.disc;
    if(!d) return false;
    return mo.at.split('+').every(tok => tok === tok.toUpperCase()
      ? d.sup.includes(tok.toLowerCase()) : d.all.includes(tok.toLowerCase()));
  }
  _modeUsable(mo, vamps, o){ return vamps.some(v => this._modeUsableBy(mo, v, o)); }
  _surplusStealthIndex(vamps){       // v0.6.79 (Johan's starve-out reflection): a PURE-stealth card is dead weight when the table never blocks -- pick one to cycle
    let stealthN = 0, idx = -1;
    this.hand.forEach((nm, i2) => {
      const h = this.fxLookup(nm); if(!h || h.kind !== 'lib') return;
      const cats = this._cats(h.e);
      if(cats.includes('stealth')){ stealthN++; if(idx < 0 && cats.length === 1) idx = i2; }
    });
    return (stealthN >= 3 && (this._unblockedStreak | 0) >= 3) ? idx : -1;
  }
  _stealthGlutIndex(){               // v0.6.120 (Johan, 18 Sep): never sit on more than THREE stealth cards, and keep them DIFFERENT so they can all go on one action -- malkavian held 54 % stealth at its action decisions across 15 matches (a table that rarely blocks never asks for them; the Toreador help sheet recommends exactly that against Malkavians). Shed a duplicate name first, then the weakest; only stealth modifiers without a second job the bot plays count.
    const st = []; this.hand.forEach((n, idx) => { const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('mod')) return;
      const ms = (h.e.modes || []).filter(m => m.fx); const sm = ms.filter(m => typeof m.fx.stealth === 'number'); if(!sm.length) return;
      if(ms.some(m => m.fx.bleed || m.fx.bleedNullify || m.fx.cancelBlock || m.fx.bounce || m.fx.wake)) return;   // a second JOB the bot plays keeps the card out of the count (Bonding, Spying Mission, Elder Impersonation); a combat maneuver on the side (Swallowed by the Night) does not
      st.push({ idx, name: h.name, s: Math.max(...sm.map(m => m.fx.stealth)) }); });
    const t = this._off || { through: 0, blocked: 0 }; const nOff = t.through + t.blocked;
    const cap = (nOff >= 4 && t.blocked / nOff >= 0.4) ? 4 : 3;                    // MY OWN ledger: a prey that blocks 40 % of my bleeds earns the fourth stealth card; a stingy blocker does not
    if(st.length <= cap) return -1;
    const seen = {}; let dup = null; for(const e of st){ if(seen[e.name]){ dup = e; break; } seen[e.name] = 1; }
    const shed = dup || st.slice().sort((a, b) => a.s - b.s)[0];
    return shed.idx;
  }
  _deadHandIndex(vamps){             // v0.5 (§7.6 D, extracted for direct testability like _unlockPhase): the FIRST hand card no ready vampire can do anything with -- masters included now that module A can play the known income assets (no more unconditional master death); a bounce-only mode's 2-live-player deadness comes for free via _modeUsable → _modeUsableBy
    return this.hand.findIndex(n => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib') return false;
      return (h.e.modes || []).length > 0 &&
             !(h.e.modes || []).some(mo => this._modeUsable(mo, vamps, { selfPrice: true }));   // v0.6.127: a self-price card is HELD for its moment, not dead
    });
  }
  _bestPeekFor(vamp){               // R3: Revelations (peekPreyDiscard/openHandPrey). Superior-if-able v1 -- persona knob later; prey-locked by card text (dir:'prey').
    if(!this.fx) return null;
    for(let idx=0; idx<this.hand.length; idx++){
      const h=this.fxLookup(this.hand[idx]); if(!h||h.kind!=='lib') continue;
      let sup=false, inf=false, st=0;
      (h.e.modes||[]).forEach(mo=>{ const f=mo.fx||{};
        if(typeof f.actStealth==='number') st=f.actStealth;
        if(mo.fx.openHandPrey && this._modeUsableBy(mo,vamp)) sup=true;    // fx.openHandPrey -- literal read, the coverage scanner tracks fx.<key>
        if(mo.fx.peekPreyDiscard && this._modeUsableBy(mo,vamp)) inf=true; });  // fx.peekPreyDiscard
      if(!sup && !inf) continue;
      const cB = (h.e.cost && h.e.cost.blood) || 0;   // v0.6.117: Revelations costs 1 blood -- the data always said so; the curated overlay had dropped it until cardfx v1.6.14 (cost inheritance)
      if(cB > (vamp.blood | 0)) continue;
      return { idx, name:h.name, kind:'peek', supMode:sup, st, n:1, cost: cB ? { blood: cB } : null };
    }
    return null;
  }
  _bestCancelBlockFor(vamp, played){   // fas C (16 July): Elder Impersonation-class superior -- fx.cancelBlock, played the moment a minion ATTEMPTS to block: the attempt fails outright and that minion never retries this action. Strictly stronger than spending stealth (a guarantee, not a contest), gated by the mode's own discipline requirement (OBF -- basic-obf vampires never see it).
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('mod')) return;   // v0.6.12: the finder's WINDOW defines the card type -- an action-modifier window offers action modifiers only (all 3 cancelBlock carriers are mods today; future-proofing against the class Johan's standing question surfaced)
      if(!this._mayPlay(h.name, h.e, played)) return;
      const cost = (h.e.cost && h.e.cost.blood) || 0;
      if(cost > (vamp.blood | 0)) return;
      (h.e.modes || []).forEach(mo => {
        if(!mo.fx || !mo.fx.cancelBlock || !this._modeUsableBy(mo, vamp)) return;
        if(!best) best = { idx, name: h.name, cost };
      });
    });
    return best;
  }
  _stealthStack(vamp, played){       // v0.6.143 (Johan's stealth-bleed doctrine, 20 Sep): how many DIFFERENT stealth cards this vampire can still play this action (same name once per action) and what they add up to -- 'two in hand is decent, three with a +bleed card is really good, one is a gamble'
    const seen = new Set(); let S = 0, sum = 0;
    (this.hand || []).forEach(n => { const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('mod') || seen.has(FX_NORM(h.name))) return;
      if(!this._mayPlay(h.name, h.e, played)) return; if(((h.e.cost && h.e.cost.blood) || 0) > (vamp.blood | 0)) return;
      let best = 0; (h.e.modes || []).forEach(mo => { const st = mo.fx && mo.fx.stealth; if(typeof st === 'number' && st > best && this._modeUsableBy(mo, vamp)) best = st; });
      if(best > 0){ seen.add(FX_NORM(h.name)); S++; sum += best; } });
    return { S, sum };
  }
  _preyUnlockedN(){ const ps = this.preySeat(); if(!ps || ps === this.seat) return 0; const t = this.table[ps]; const cs = (t && t.pub && t.pub.cards) || []; return cs.filter(c => c && c.kind === 'crypt' && c.zone === 'ready' && !c.locked).length; }
  _pPump(seat){ const o = seat ? this._opp(seat) : null; const n = o ? (o.hitsN | 0) : 0, big = o ? (o.hitsBig | 0) : 0; return +((big + 0.25 * 4) / (n + 4)).toFixed(2); }   // v0.6.146: P(a bleed from this seat lands 3+), prior 0.25 worth four observations
  _bounceLeftShare(){                // v0.6.146: the share of my REMAINING library that is bounce -- will I draw another one soon?
    const left = this._remainingLibrary(); let tot = 0, bn = 0; Object.keys(left).forEach(n => { const q = Math.max(0, left[n] | 0); if(!q) return; tot += q; const h = this.fxLookup(n); if(h && h.kind === 'lib' && this._cats(h.e).includes('bounce')) bn += q; });
    return tot ? +(bn / tot).toFixed(3) : 0;
  }
  _bounceReserve(){                  // v0.6.146 THE DYNAMIC RESERVE (Johan's GO, 21 Sep: 'make the threshold more dynamic -- it touches ventrue, malkavian and tremere'): how many bounce cards must STAY in hand after sending on a total of 1. v0.6.145 said 'one, always' -- it saw the hand only. A human also counts what is left in the library, how often this predator pumps, and his own position.
    const pred = this.predSeat(), r = this.plan && this.plan.reads; const pPump = this._pPump(pred), share = this._bounceLeftShare(), cp = this._critPool();
    const preyTto = r && r.preyTto != null ? +r.preyTto : 99, preyPool = r && r.preyPool != null ? +r.preyPool : 30;
    const defensive = (this.pool | 0) <= cp.crit + 4 && preyPool > 15;   // I am the one in trouble and my prey is healthy: a pool sent on buys little, a bounce kept may save the game
    const rich = share >= 0.10;                                          // about one card in eight still to come is a bounce
    let R = 1; const why = ['one kept for a heavier bleed'];
    if(pPump >= 0.4){ R++; why.push('this predator lands 3+ on ' + Math.round(pPump * 100) + ' % of its bleeds: one more'); }
    if(defensive){ R++; why.push('my pool ' + this.pool + ' is near the critical ' + cp.crit + ' and my prey sits at ' + preyPool + ': one more'); }
    if(rich && pPump < 0.25 && !defensive){ R--; why.push('my library is still ' + Math.round(share * 100) + ' % bounce and this predator seldom pumps: none need stay'); }
    if(preyTto <= 1.5){ R = 0; why.length = 0; why.push('my prey is ' + preyTto + ' turns from falling: every pool sent on counts'); }
    return { R: Math.max(0, Math.min(3, R)), pPump, share, defensive, preyTto, why: why.join('; ') };
  }
  _pDrawStealth(vamp){               // v0.6.143b (Johan: 'one can always top-deck what one needs'): the chance that ONE replacement draw is a stealth card this vampire can play -- from my own list minus hand, board and ash
    const left = this._remainingLibrary(); (this._ashNames || []).forEach(n => { if(left[n]) left[n]--; });
    let tot = 0, st = 0; Object.keys(left).forEach(n => { const q = Math.max(0, left[n] | 0); if(!q) return; tot += q; const h = this.fxLookup(n);
      if(h && h.kind === 'lib' && (h.e.t || []).includes('mod') && (h.e.modes || []).some(mo => mo.fx && typeof mo.fx.stealth === 'number' && mo.fx.stealth > 0 && this._modeUsableBy(mo, vamp))) st += q; });
    return tot ? +(st / tot).toFixed(2) : 0;
  }
  _pBleedThrough(){                  // v0.6.143b (statistics): how often MY bleeds get through against THIS prey -- a prior of 0.7 worth three observations, reset when the prey changes. 'Hold the Govern' reads this instead of a constant (Johan: it depends on the opponent's statistics).
    const ps = this.preySeat(); const L = this._bleedLedger && this._bleedLedger.seat === ps ? this._bleedLedger : { n: 0, blocked: 0 };
    return +(((L.n - L.blocked) + 0.7 * 3) / (L.n + 3)).toFixed(2);
  }
  _noteMyBleed(blocked){ const ps = this.preySeat(); if(!this._bleedLedger || this._bleedLedger.seat !== ps) this._bleedLedger = { seat: ps, n: 0, blocked: 0 }; this._bleedLedger.n++; if(blocked) this._bleedLedger.blocked++; }
  _stealthAxis(){ return this._deckAxes().includes('stealth-bleed'); }
  _combatCover(v){ return !!(this._bestCombatEndFor(v) || this._bestDodgeFor(v) || this._bestManeuverFor(v)); }   // v0.6.143: Johan -- a chump bleed is better with a combat ends, a dodge or a maneuver to long range in hand
  _bestStealthFor(vamp, played, targetSeat){   // highest usable +stealth for this acting vampire: hand cards, PLUS (fas C, 16 July) board-attached Marked Path-class burns whose recorded target matches THIS action's target. v0.6.12 (18 July, Johan's standing question): TYPE-FILTERED to action modifiers -- 147 non-mod cards (ally/equip/master/retainer grants, combat stealth) carry mode fx.stealth and were offerable from hand as mid-action modifiers; the actStealth sweep closed the Action-card half of this class, the type filter closes the rest structurally
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('mod')) return;
      if(!this._mayPlay(h.name, h.e, played)) return;   // rules gate: unique-in-play + once-per-action same name
      const cB = (h.e.cost && h.e.cost.blood) || 0;      // v0.6.116 round 2 (Johan's "any other unpaid costs?" sweep): the SECOND real find -- this finder never read cost.blood either, and the play site (_onBlockAttempt's spend-stealth branch) never paid it. ~30 compiled stealth mods cost blood (Forgotten Labyrinth 1 -- x5 in the sewer deck -- Blanket of Night 1, Mind Tricks 1, Alacrity 2, ...); all played free. Gate + carry, the intercept finder's own shape (which has done this since v0.6.13).
      if(cB > (vamp.blood | 0)) return;
      (h.e.modes || []).forEach(mo => {
        const st = mo.fx && mo.fx.stealth;
        if(typeof st === 'number' && this._modeUsableBy(mo, vamp) && (!best || st > best.s))
          best = { idx, name: h.name, s: st, cost: cB ? { blood: cB } : null };
      });
    });
    if(targetSeat){
      /* fas C: step 2 of the Marked Path mechanic -- an attached copy is burnable
         ONLY during an action by THIS vampire directed at the SAME Methuselah the
         card was earned against (mpTarget, recorded at attach). The stealth value
         (mpStealth 1/2) was fixed by the mode level at ATTACH time, per card text. */
      this.board.forEach(c => {
        if(c.kind !== 'lib' || c.host !== vamp.id || !(c.mpStealth > 0) || this._outOfPlay(c)) return;
        if(c.mpTarget !== targetSeat) return;
        if(played && played.has(FX_NORM(c.name))) return;   // once-per-action same name holds for burns too
        if(!best || c.mpStealth > best.s) best = { name: c.name, s: c.mpStealth, fromBoard: c.id };
      });
    }
    return best;
  }
  _bestBleedCardFor(vamp){          // highest usable bleed-ACTION card in hand for this vampire
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib') return;
      if(!this._mayPlay(h.name, h.e, null)) return;     // rules gate: a unique action card in play anywhere blocks a second
      if(h.e.cost && h.e.cost.pool) return;               // v0.6.116: pool-costed bleed actions stay out of scope (none compiled today; the stock finder's own precedent)
      const cB = (h.e.cost && h.e.cost.blood) || 0;       // v0.6.116 (Johan's Tremere test, 16 Sep: "Govern [dom] bled without paying"): the finder never read cost.blood -- 22 compiled bleed actions carry one (Govern 1, Dominate Kine 2, Propaganda 2, Cheat the Fates 3, ...) and every one announced free. Same gate + same carried cost shape as _bestBloodStockFor (the superior-Govern sibling, which got this right in v0.6.14).
      if(cB > (vamp.blood | 0)) return;                   // cannot announce what the vampire cannot pay
      (h.e.modes || []).forEach(mo => {
        if(!mo.fx || !mo.fx.bleedAct || !this._modeUsableBy(mo, vamp)) return;
        const amt = 1 + (typeof mo.fx.bleed === 'number' ? mo.fx.bleed : 0);
        const st = (typeof mo.fx.actStealth === 'number') ? mo.fx.actStealth
                 : (typeof mo.fx.stealth === 'number') ? mo.fx.stealth : 0;   // fas A (16 July, sewer archetype): Night Moves-class BUILT-IN stealth ("bleed at +3/+6 stealth") -- carried so the announce can book it into tally a, where the contested verdict actually reads it. v0.6.11 (17 July, fas B/C sweep): the compiler now emits actStealth for built-in action stealth (cardfx v1.5.0) so the generic modifier finder (_bestStealthFor) is structurally blind to Action cards -- it would otherwise play one from hand as a mid-action modifier the moment a deck holds two differently-named stealth actions. This announce-side booking is the ONE site that legitimately wants the built-in value; stealth kept as fallback for older compiled databases.
        if(!best || amt > best.n || (amt === best.n && st > (best.st | 0))) best = { idx, name: h.name, n: amt, st, cost: cB ? { blood: cB } : null, bloodAfter: (vamp.blood | 0) - cB };   // v0.6.116: cost paid at announce (the bleed branch), bloodAfter read by decide('action')'s cost drag
      });
    });
    if(best) best.n += this._cryptBleedBonus(vamp);   // VA: Lenny-class passive bleed bonus -- applied ONCE at ACTION construction so the decision scoring AND every downstream read (announce/emit/comply) agree; the MODIFIER finder (_bestBleedModifierFor) must NEVER carry this, or the same +1 lands twice when a modifier stacks on the boosted action (the 70c vanilla red test caught the first draft's mis-placed anchor doing exactly that)
    return best;
  }
  _bestPoolDmgActionFor(vamp){      // fas B (16 July): Inside Dirt-class -- a DIRECTED action dealing pool damage that is NOT a bleed (its curated note calls it "the canonical 'block this even though it isn't a bleed' example"). v1 scope: the pool mode only ("burn 3 pool from your prey") -- the card's OTHER mode (burn 3 blood from any Methuselah's vampire) needs opponent-board mutation the sandbox routes through the OWNER, a separate phase.
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib') return;
      if(!this._mayPlay(h.name, h.e, null)) return;
      if(h.e.costEdge && !this.edge) return;             // entry-level, the Leverage precedent: a card that needs the Edge is simply unplayable without it
      if(h.e.cost && h.e.cost.blood && h.e.cost.blood > (vamp.blood | 0)) return;   // v0.6.116: same blood gate as the bleed finder (latent here -- no compiled poolDmg action costs blood today; the branch below pays it if one ever does)
      if(h.e.req && h.e.req.clan && h.e.req.clan.length){
        /* clan gate (fas B): the compiler already extracts crypt clans -- and the sewer
           deck makes this a REAL correctness need: Bloodfeud is Malkavian antitribu and
           must NEVER be offered the Nosferatu-antitribu-only Inside Dirt. */
        const ck = this.fxLookup(vamp.name);
        const vclan = ck && ck.kind === 'crypt' && ck.e.clan;
        if(!vclan || h.e.req.clan.indexOf(vclan) < 0) return;
      }
      (h.e.modes || []).forEach(mo => {
        if(!mo.fx || !(mo.fx.poolDmg > 0) || !this._modeUsableBy(mo, vamp)) return;
        if(!best || mo.fx.poolDmg > best.n) best = { idx, name: h.name, n: mo.fx.poolDmg, kind: 'pool', costEdge: !!h.e.costEdge, cost: h.e.cost || null };
      });
    });
    return best;
  }
  _bestBloodStockFor(vamp){         // v0.6.14 (Johan's blood-placement family): a playable ACTION whose mode carries bloodAdd + bloodAddTo:'unc' (superior Govern-class) plus a LEGAL uncontrolled target. Target law: bloodAddYounger compares CAPACITY (the rulebook's age rule -- strictly lower than the acting vampire's; vekn.net confirms NO generation tiebreak exists, so equal-capacity is correctly excluded, not a gap), and the target must still want blood (blood < cap; stocking past cap is legal but wasted in this bot's raise economy). Picks the HIGHEST-cap legal target (closest to rising = fastest acceleration). Blood costs are paid by the acting vampire at announce (Govern itself costs 1 blood -- the first draft's cost-free gate killed the very card this pin is for); pool-costed actions stay out of scope.
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('action')) return;
      if(!this._mayPlay(h.name, h.e, null)) return;
      if(h.e.req && h.e.req.title) return;   // v0.6.15 (source-verify pass): a card-level TITLE precondition (Fourth Tradition: The Accounting -- "Requires a prince or justicar") the bot cannot check today (titles are untracked, politics-engine scope) -- fail CLOSED, exactly like the clan gate below fails closed on an unknown clan
      if(h.e.cost && h.e.cost.pool) return;
      const costB = (h.e.cost && h.e.cost.blood) || 0;
      if(costB > (vamp.blood | 0)) return;
      /* v0.6.15: BLEED-RIDER guard. Two cards in the family (Break the Bonds, Public
         Trust) auto-tagged bloodAddTo cleanly by TEXT but are structurally a directed
         bleed with the stock effect as a CONDITIONAL bonus ("If the bleed is
         successful, add 1 blood..."), not a Govern-shaped standalone action -- they
         are already offered correctly via _bestBleedCardFor's OR-fan-out handling, and
         this finder must not double-claim them with the wrong (undirected, no-Edge,
         no-bounce) exec shape. Two structural tells, found by comparing the compiled
         JSON, not the card text: (a) the bloodAdd MODE itself carries dir or bleedAct
         (Public Trust: co-located in [PRE]); (b) the ENTRY has a separate at:null mode
         that is itself an unconditional bleed (Break the Bonds: the riders are
         additive bonuses on a mandatory base, not modal alternatives like Govern's
         [dom]/[DOM] pair).                                                          */
      const hasBaseBleed = (h.e.modes || []).some(m => (m.at === null || m.at === undefined) && m.fx && m.fx.bleedAct);
      (h.e.modes || []).forEach(mo => {
        if(!mo.fx || !(mo.fx.bloodAdd > 0) || mo.fx.bloodAddTo !== 'unc' || !this._modeUsableBy(mo, vamp)) return;
        if(hasBaseBleed || mo.dir || mo.fx.bleedAct) return;
        const tgt = this.unc
          .filter(u => (!mo.fx.bloodAddYounger || (u.cap | 0) < (vamp.cap | 0)) && (u.blood | 0) < (u.cap | 0))
          .sort((a, b) => (b.cap | 0) - (a.cap | 0))[0];
        if(!tgt) return;
        if(!best || mo.fx.bloodAdd > best.n) best = { idx, name: h.name, n: mo.fx.bloodAdd, st: (mo.fx.actStealth | 0), kind: 'stock', target: tgt, cost: costB ? { blood: costB } : null };
      });
    });
    return best;
  }
  _raiseNeed(c){ return Math.max(0, (c.cap | 0) - (c.blood | 0)); }   // v0.6.14: what an influence raise still costs (pool AND transfers) after pre-stocked blood -- the whole point of the grinder path; rulebook-true (transfers already banked as blood on the card)
  /* v0.6.117 (Johan, 16 Sep 2026 -- THE SPOKEN INFLUENCE): the phase's raises used to be
     narrated as one `Influence: …` note PER transfer batch, on log tier -- which online sat
     right next to the server's own ledger rows (`NAME: blood 1 → 4`, `revealed NAME`,
     `uncontrolled → ready`, `pool 23 → 20`) saying the same thing, and offline sat beside
     the rise fx. The notes are gone. In their place the phase ends with ONE chat bubble in
     the words a human uses at the table ("I influence 3 blood to Nassir, who enters play,
     and 1 blood to an uncontrolled vampire") -- the text-to-speech concept will read it
     aloud one day. Rules kept: a partial fill never names the vampire (v0.6.114); the
     rise names it (the flip is public). The wrapper exists because the loop has six exit
     paths -- every one of them must flush the sentence.                                */
  async _influenceLoop(){
    this._infSaid = [];
    try{ await this._influenceLoopInner(); }
    finally{
      const parts = this._infSaid || []; this._infSaid = null;
      if(parts.length && !this.out) this.chat(this._influenceSentence(parts));
    }
  }
  _influenceSentence(parts){   // v0.6.117: pure -- the suite reads it directly
    const seg = []; let uncN = 0;
    parts.filter(q => q.kind !== 'draw').forEach(q => {
      if(q.rise) seg.push(q.n + ' blood to ' + q.name + ', who enters play');
      else seg.push(q.n + ' blood to ' + (uncN++ ? 'another' : 'an') + ' uncontrolled vampire');
    });
    const draw = parts.find(q => q.kind === 'draw');
    let line = '';
    if(seg.length) line = 'I influence ' + (seg.length > 1 ? seg.slice(0, -1).join(', ') + ', and ' + seg[seg.length - 1] : seg[0]);
    if(draw) line += (line ? ', and ' : 'I ') + 'use ' + draw.transfers + ' transfers to draw a new vampire';
    return line + '.';
  }
  async _influenceLoopInner(){   // v0.6.37 (Johan's ask, Wider View -- the last Inside Dirt card): extracted verbatim from _playTurn's own influence-phase while-loop, specifically so it's directly testable on its own (matching the same reasoning that pulled _revertHandSizeBonus out of the discard-phase block) -- no behavioral change to the pre-existing raise/draw logic, just a name and a call site. Wider View's own two abilities (a 1-transfer duplicate-swap, a 4-transfer burn-for-2-pool) are new branches inside this same loop, since transfers (this.inf) were already tracked here and both abilities are plain transfer-spending options, NOT lock-gated like Dreams of the Sphinx.
    let brought = 0;
    while(!this.out){
      /* v0.3.2 crypt uniqueness: never raise a second copy of a name that
         is already in play (ready OR torpor) — visible-rules courtesy; the
         playbook's duplicate copies stay as draw redundancy. (Cross-player
         contests remain the table's call — sandbox.)                     */
      const inPlay = new Set(this.board.filter(c => c.kind === 'crypt' && c.zone !== 'uncontrolled').map(c => c.name));
      /* v0.6.37: source-verified vekn.net first -- the normal crypt draw costs
         4 transfers + 1 pool (the branch just below); a transferSwap-tagged
         card's own "use N transfers to draw 1 card... and then remove a
         crypt card in your uncontrolled region" is dramatically cheaper but
         FORCES sacrificing an existing uncontrolled crypt card -- Johan's own
         described use case (Wider View specifically): swap out a duplicate
         you already have stuck (can never be raised anyway, per the SAME
         inPlay check the line above already computes). Read by FX KEY, not
         hardcoded to Wider View's name, so any future card sharing this shape
         (this session's own "vocabulary follows the consumer" + "as general
         as possible" precedent, same spirit as _addCounter/_burnIfCounters)
         is automatically covered too. Tried FIRST, before the normal draw,
         since it's strictly cheaper value whenever a genuine duplicate
         exists to spend. */
      let swapCard = null, swapCost = 0;
      this.board.forEach(c => {
        if(c.kind !== 'lib' || c.host || this._outOfPlay(c)) return;
        const h = this.fxLookup(c.name); if(!h || h.kind !== 'lib') return;
        (h.e.modes || []).forEach(mo => {
          if(mo.fx && mo.fx.transferSwap && typeof mo.fx.transferCost === 'number'){ swapCard = c; swapCost = mo.fx.transferCost; }
        });
      });
      if(swapCard){
        const dup = this.unc.find(c => this.fxCryptUnique(c.name) !== false && inPlay.has(c.name));
        if(dup && this.cryptN > 0 && this.inf >= swapCost){
          await this._pace();
          this.inf -= swapCost;
          this.unc = this.unc.filter(c => c !== dup);
          this.push();
          this.note(swapCard.name + ': Trainbot uses ' + swapCost + ' transfer' + (swapCost === 1 ? '' : 's') + ' to draw a new vampire, removing a duplicate ' + dup.name + ' from the game.');
          this.send({ t: 'drawCrypt' });
          continue;   // loop again -- more duplicates or transfers may remain
        }
      }
      const raiseables = this.unc.filter(c => this.fxCryptUnique(c.name) === false || !inPlay.has(c.name));   // tag-aware: the five true non-uniques MAY duplicate
      const cheapest = this._planInfluence(raiseables);   // v2 (influence planner, 12 Sep 2026): multi-vampire transfer allocation replaces the greedy single-pick; _pickRaise kept for test compat
      const zeroReady = !this.board.some(c => c.kind === 'crypt' && c.zone === 'ready');   // v0.6.69 (#1): the survival exception -- a bot with zero ready minions is dead anyway; the floor drops to 1 (never 0 = self-oust)
      const floorEff = zeroReady ? 1 : this._poolFloorEff();   // v0.6.119: the plan raises the knob to one expected predator turn of pool
      if(!cheapest && this.cryptN > 0 && this.inf >= 4 && this.pool - 1 >= floorEff){
        await this._pace();                             // v0.4.5: this used to fire the instant the minion phase ended -- every phase transition now shares the same beat
        this.inf -= 4; this.pool -= 1;           // rulebook: 4 transfers + 1 pool moves a crypt card to uncontrolled
        this.push();
        if(this._infSaid) this._infSaid.push({ kind: 'draw', transfers: 4 });   // v0.6.117: said once, in the phase's chat bubble; the pool paid is on the board (ledger online)
        this.send({ t: 'drawCrypt' });           // arrives async into uncontrolled; raised on a later loop/turn
        break;
      }
      let burnCard = null, burnCost = 0, burnGain = 0;   // v0.6.37: Ability 2 (burn for pool), same fx-key-read generalization as the swap above -- Wider View's own "use 4 transfers to burn this card and gain 2 pool"
      this.board.forEach(c => {
        if(c.kind !== 'lib' || c.host || this._outOfPlay(c)) return;
        const h = this.fxLookup(c.name); if(!h || h.kind !== 'lib') return;
        (h.e.modes || []).forEach(mo => {
          if(mo.fx && typeof mo.fx.transferBurnPool === 'number' && typeof mo.fx.transferCost === 'number'){ burnCard = c; burnCost = mo.fx.transferCost; burnGain = mo.fx.transferBurnPool; }
        });
      });
      if(!cheapest && burnCard && this.inf >= burnCost){   // only when NOTHING better remains for these transfers (no duplicate to swap, no vampire to raise, no crypt card left to draw), matching the "don't waste a resource, but don't sacrifice a better option" spirit already established for Life in the City's own capacity check
        await this._pace();
        this.inf -= burnCost; this.pool += burnGain;
        burnCard.zone = 'burned';
        this.push();
        this.note(burnCard.name + ': Trainbot uses ' + burnCost + ' transfers to burn it for +' + burnGain + ' pool (pool ' + this.pool + ') -- nothing better to spend the transfers on this turn.');
        continue;   // v0.6.38 (Johan's standing question, checking Wider View for uncertainty -- found live): unlike the normal draw above (async -- drawCrypt's card arrives later, so break avoids a wasted immediate re-check), burning is a pure SYNCHRONOUS state change with nothing to wait for. Verified live: two Wider Views + 8 transfers only burned ONE (pool +2, not +4) because break stopped the loop before a second, still-affordable burn could be found on the next pass -- continue lets the loop correctly re-scan and catch a second (or further) opportunity in the same influence phase.
      }
      if(!cheapest) break;
      const need = this._raiseNeed(cheapest);   // v0.6.14: pre-stocked blood (superior Govern) discounts BOTH the pool and the transfers -- rulebook-true, and the whole grinder payoff
      if(need <= 0 || this.inf <= 0) break;
      /* INCREMENTAL INVESTMENT — rulebook-true transfer model: each transfer
         moves 1 blood from pool to the vampire in uncontrolled (costing 1 pool
         + 1 transfer). Spend as many as we can afford this turn — the vampire
         rises to ready the moment it reaches capacity, whether that's this
         turn or a future one. Unused transfers are lost at end of phase.
         The old atomic model (save transfers across turns, raise in one shot)
         was incorrect: transfers cannot be saved between influence phases.  */
      const canSpend = Math.min(this.inf, need, Math.max(0, this.pool - floorEff));   // v0.6.69 (#1): floorEff — the survival exception applies
      if(canSpend <= 0) break;
      await this._pace();                               // v0.4.5: moved from after push() to before it -- a multi-raise phase now opens EVERY raise with the same beat the minion loop uses, not just its announce
      this.inf -= canSpend; this.pool -= canSpend;
      cheapest.blood = (cheapest.blood | 0) + canSpend;
      /* v0.6.114 (Johan): a PARTIAL fill keeps the card FACE DOWN. The line that flipped it
         here ("blood is being placed -- the vampire is now visible") was wrong in rules and
         in intent: uncontrolled identity is hidden until the vampire enters play; only the
         blood counters on the face-down card are public, as on a physical table. The rise
         branch flips it, and the rise fx (reveal:true) is the table's flip. */
      if(cheapest.blood >= cheapest.cap){
        /* RISE — blood reached capacity, move to ready */
        cheapest.zone = 'ready'; cheapest.locked = false; cheapest.faceDown = false;
        cheapest.blood = cheapest.cap;                  // clamp (defensive — shouldn't exceed, but safe)
        this._maybeEnterPlayDraw(cheapest);   // VC: New Blood's printed enter-play crypt draw
        const rp = this._openSlot('ready', cheapest);   // v0.4.5: was a naive "current ready count" index -- collided whenever an earlier vampire had already left ready out of turn (torpor); see _openSlot
        cheapest.x = rp.x; cheapest.y = rp.y;
        this.unc = this.unc.filter(c => c !== cheapest);
        const preStocked = cheapest.cap - canSpend;     // blood that was already there before this turn's transfers
        this._emit('raise', { name: cheapest.name, need: canSpend, turn: this.ownTurns | 0, poolAfter: this.pool, infAfter: this.inf });   // v0.6.77 (A5): the turn field makes influence tempo EXACT   // v0.6.76: REALITY beside the reasoning -- phantoms are now exposable
        brought++;
        this.push();
        this.fxClone({ name: cheapest.name, kind: 'crypt' }, 'rises', { kind: 'rise', reveal: true });   // v0.4.5: the table SEES it now -- was missing entirely; mirrors the client's own cardFx(c,'rise',{reveal}) for a human's uncontrolled/torpor->ready move()
        if(this._infSaid) this._infSaid.push({ rise: true, name: cheapest.name, n: canSpend });   // v0.6.117: the rise fx + the ledger carry the event; the phase's ONE chat bubble carries the words
      } else {
        /* PARTIAL — blood placed but vampire stays in uncontrolled */
        this.push();
        if(this._infSaid) this._infSaid.push({ rise: false, n: canSpend });   // v0.6.117: nameless (v0.6.114 rule), said in the phase's chat bubble   // v0.6.109 (#3a, Johan): a PARTIAL fill leaks nothing any more -- the card is still face down in my uncontrolled region, so naming it (and its cap, and its progress) handed the table a free read on what is coming. The RISE line below keeps the name deliberately: the moment it rises the card is public on the felt anyway (fxClone reveal:true), so hiding it there would be theatre, not secrecy.
      }
    }
  }
  _bestBleedModifierFor(vamp, played, limitedUsed){   // steg 2 (15 July, cardfx-persistent-lock-design-decisions.md §13): a usable POST-announce bleed modifier (Leverage-class -- fx.bleed WITHOUT bleedAct, the flag that marks _bestBleedCardFor's own domain, the base action card itself) for the acting vampire's already-live, unblocked action. `costEdge` (Inside Dirt carries the same flag, unconsumed until now) gates on the bot CURRENTLY holding the Edge -- checked entry-level, before even looking at modes, since a card that needs it is simply unplayable without it, exactly like a blood cost the vampire can't pay. steg 4 (16 July, real card_text from vtes.json): `limitedUsed` enforces "only one (limited) bleed modifier per action" (Conditioning/Bonding both carry it; Leverage explicitly does not, per its own "does not count against the limit" text) -- checked entry-level exactly like costEdge, before modes. Any mode granting fx.stealth is skipped outright: stealth has no purpose once the block phase is already over (Bonding's own ruling, "[DOM] cannot be used if you do not need the stealth at the time you play it"), and this is the ONLY window this finder is offered in today -- a general rule, not a Bonding-specific carve-out.
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('mod')) return;   // v0.6.12: type filter -- 70 non-mod cards (Camera Phone-class equipment/master/ally bleed grants) carry fx.bleed-without-bleedAct and were offerable as post-announce modifiers
      if(!this._mayPlay(h.name, h.e, played)) return;
      if(h.e.costEdge && !this.edge) return;
      if(h.e.limited && limitedUsed) return;
      (h.e.modes || []).forEach(mo => {
        if(!mo.fx || typeof mo.fx.bleed !== 'number' || mo.fx.bleedAct) return;
        if(mo.fx.stealth) return;
        if(!this._modeUsableBy(mo, vamp)) return;
        if((vamp.blood | 0) < ((h.e.cost && h.e.cost.blood) || 0)) return;
        if(mo.req && typeof mo.req.targetPoolMax === 'number'){   // v0.6.105 (track C): Foreshadowing Destruction-class -- the bonus exists only while the target's pool is at or under the cap; an unknown pool fails CLOSED (a missed +3 beats a phantom one)
          const ts = this._actingVamp && this._actingVamp.target, tp = ts && this.table[ts] && this.table[ts].pub;
          if(!tp || typeof tp.pool !== 'number' || tp.pool > mo.req.targetPoolMax) return;
        }
        if(!best || mo.fx.bleed > best.n) best = { idx, name: h.name, n: mo.fx.bleed, cost: h.e.cost || null, costEdge: !!h.e.costEdge, edgeLock: !!h.e.edgeLock, limited: !!h.e.limited };
      });
    });
    return best;
  }

  /* ---------- the hand READ (spec §7 `insight`): inference, never knowledge.
     Hands never travel the wire; this is the honest read a human makes: what
     categories has this seat SHOWN, scaled by how many cards they hold.    */
  _cats(entry){
    const out = new Set();
    (entry.modes || []).forEach(mo => {
      const f = mo.fx || {};
      if(f.bounce) out.add('bounce');
      if(typeof f.stealth === 'number' || typeof f.actStealth === 'number') out.add('stealth');
      if(typeof f.intercept === 'number' || f.wake) out.add('intercept');
      if(typeof f.votes === 'number') out.add('votes');
      /* v0.6.118: the combat family and the rest of the fx vocabulary the table-model readers need */
      if(f.strike || f.handStrike || f.addStrike || f.envDmgPerRound || f.strengthBonus) out.add('strike');   // env damage and strength ARE strikes for the danger read
      if(f.aggr) out.add('aggr');
      if(f.press) out.add('press');
      if(f.maneuver) out.add('maneuver');
      if(f.dodge || f.combatEnds) out.add('dodge');
      if(f.prevent) out.add('prevent');
      if(f.stealBlood) out.add('stealBlood');
      if(typeof f.bleed === 'number' && f.bleed > 0) out.add('bleedMod');
      if(f.rush) out.add('rush');
    });
    const tt = entry.t || [];
    if(tt.includes('combat') && !out.size) out.add('combatCard');   // v0.6.118: an auto-tier combat card with no modelled fx (Torn Signpost-class) still tells the danger read that combat cards are in the deck
    if(tt.includes('equip')) out.add('equip');
    if(tt.includes('retainer')) out.add('retainer');
    if(tt.includes('ally')) out.add('ally');
    return [...out];
  }
  /* ==================== v0.6.118: THE TABLE MODEL (B2's foundation) ====================
     elysium-bot-table-model-spec.md. One record per opponent seat, fed ONLY by what any
     seat can see: the pub boards (crypt cards with clan/disciplines via cardfx, equipment
     attached, the ASH HEAP), the face-up fx clones, the frozen L12 lines (announces, the
     block verdicts, the tallies) and my own combats. Hands never enter it (handIntel stays
     its own ground truth). Cleared with this.table on a fresh deal; nothing on disk.
     Every derived read blends a weak PRIOR (what the board shows before anything was
     played: disciplines, weapons, clan) with the observed counts by evidence weight
     n/(n+k) -- a smarter prior (the TWDA archetype table Johan described) slots into
     _oppPrior() later without touching a reader.                                       */
  _opp(seat){
    seat = seat | 0;
    let o = this.opp[seat];
    if(!o){
      o = this.opp[seat] = { seen: {}, cards: {}, vamps: {}, clans: {}, disc: {}, equip: {}, readyN: 0, torporN: 0, uncN: 0, pool: 30, handN: 4, ash: 0,
                             minions: {}, stealthUsed: [], votesCalled: 0, combat: { n: 0, dmgSum: 0, torporsInflicted: 0 }, lastClone: {} };
      const r = this.reads[seat] = this.reads[seat] || { seen: {} };
      o.seen = r.seen;                                       // one object: readP() keeps reading reads[seat].seen
    }
    return o;
  }
  _noteObserved(seat, name, viaAsh){
    const h = this.fxLookup(name); if(!h || h.kind !== 'lib') return;
    const o = this._opp(seat);
    if(viaAsh){                                              // the ash diff is the source that never misses a play -- but a face-up clone of the same name just arrived for most of them: count each play once
      const t = o.lastClone[name] || 0; if(t && Date.now() - t < 8000) return;   // (|| not |: a Date.now() overflows int32)
    } else o.lastClone[name] = Date.now();
    o.cards[name] = (o.cards[name] || 0) + 1;
    this._cats(h.e).forEach(c => { o.seen[c] = (o.seen[c] || 0) + 1; });
  }
  _scanOpp(seat, pub){                 // writer: _onBoard on every push -- the crypt half of the model (public: every ready/torpor card is face-up)
    const o = this._opp(seat);
    o.vamps = {}; o.clans = {}; o.disc = {}; o.equip = {}; o.readyN = 0; o.torporN = 0; o.uncN = 0;
    const cards = (pub && pub.cards) || [];
    const byId = {}; cards.forEach(c => { if(c && c.id) byId[c.id] = c; });
    cards.forEach(c => {
      if(!c || c.kind !== 'crypt') return;
      if(c.zone === 'uncontrolled'){ o.uncN++; return; }
      if(c.zone !== 'ready' && c.zone !== 'torpor') return;
      if(c.zone === 'ready') o.readyN++; else o.torporN++;
      if(c.faceDown || !c.name) return;
      const h = this.fxLookup(c.name); const e = (h && h.kind === 'crypt') ? h.e : null;
      const rec = { clan: (e && e.clan) || null, cap: (e && e.cap) | 0, disc: (e && e.disc) || { all: [], sup: [] }, zone: c.zone, blood: c.blood | 0, locked: !!c.locked, equip: [] };
      (c.attached || []).forEach(id => { const a = byId[id]; if(!a || a.kind !== 'lib' || !a.name) return;
        const ah = this.fxLookup(a.name); if(!ah || ah.kind !== 'lib') return;
        const tt = ah.e.t || []; if(!tt.includes('equip') && !tt.includes('retainer')) return;
        const cats = this._cats(ah.e); rec.equip.push(a.name); o.equip[a.name] = cats; });
      o.vamps[c.name] = rec;
      if(rec.clan) o.clans[rec.clan] = (o.clans[rec.clan] || 0) + 1;
      (rec.disc.all || []).forEach(d => { const dd = o.disc[d] = o.disc[d] || { inf: 0, sup: 0 }; if((rec.disc.sup || []).includes(d)) dd.sup++; else dd.inf++; });
    });
    if(pub){ if(typeof pub.pool === 'number') o.pool = pub.pool; if(pub.counts && typeof pub.counts.hand === 'number') o.handN = pub.counts.hand; if(typeof pub.edge === 'boolean') o.edge = pub.edge; }
    o.ash = cards.filter(c => c && c.kind !== 'crypt' && c.zone === 'ash').length;
  }
  _minionRec(seat, vamp){ const o = this._opp(seat); return o.minions[vamp] = o.minions[vamp] || { actions: 0, offensive: 0, economy: 0, utility: 0, bleeds: 0, bleedSum: 0, blocked: 0, hitMax: 0 }; }
  _actionClass(verb, cardName){   // v0.6.118d (Johan, 18 Sep): offensive (bleed / political / rush / pool damage) · economy (hunt, blood or pool gain) · utility (the rest) -- the hit rate divides blocked by OFFENSIVE actions only, so a minion that hunts three times does not look unblockable
    if(/^bleeds for|^calls a political action|^commits diablerie/.test(verb)) return 'offensive';
    if(/^hunts/.test(verb)) return 'economy';
    if(/^plays /.test(verb) && cardName){ const h = this.fxLookup(cardName); const e = h && h.kind === 'lib' ? h.e : null;
      if(e){ const th = this.fxThreatOf(e); if(th && (th.pool || th.rush || th.blood)) return 'offensive';
        const cats = this._cats(e); if(cats.includes('stealBlood')) return 'offensive';
        if((e.modes || []).some(mo => mo.fx && (mo.fx.bloodAdd || mo.fx.poolGain || mo.fx.recruitAlly || mo.fx.equip))) return 'economy'; } }
    return 'utility';
  }
  _seatOfVamp(name){                   // the seat whose pub holds this crypt card (ready/torpor); 0 when unknown
    if(!name) return 0;
    for(const k of Object.keys(this.table || {})){ const t = this.table[k]; if(!t || !t.pub) continue;
      if((t.pub.cards || []).some(c => c && c.kind === 'crypt' && c.name === name && (c.zone === 'ready' || c.zone === 'torpor'))) return k | 0; }
    return 0;
  }
  _noteOppCombat(oppVampName, dmgTaken){   // writer: my own combat damage lines -- the only combat source with certain numbers
    const seat = this._seatOfVamp(oppVampName); if(!seat || seat === this.seat) return;
    const o = this._opp(seat); o.combat.n++; o.combat.dmgSum += Math.max(0, dmgTaken | 0);
  }
  static _blend(prior, observed, n, k){ n = Math.max(0, n); return (prior * k + observed * n) / (k + n); }
  _oppPrior(seat){                     // THE PRIOR SLOT: today = what the board shows (disciplines, weapons, clan); later = the TWDA archetype table (crypt profile + first masters + ash) -- readers do not change when it does
    const o = this._opp(seat);
    const D = o.disc || {}; const cov = d => (D[d] ? (D[d].inf + 2 * D[d].sup) : 0);
    const combatDisc = cov('pot') + cov('cel') + cov('for') + cov('ani') + cov('pro') + cov('thn') + cov('qui') + cov('vic');
    const stealthDisc = cov('obf') + 0.5 * cov('obt');
    const bleedDisc = cov('dom') + cov('pre') + 0.5 * cov('dem') + 0.5 * cov('aus');
    let weapons = 0; Object.values(o.equip || {}).forEach(cats => { if(cats.includes('strike') || cats.includes('aggr') || cats.includes('maneuver')) weapons++; });
    const minionN = Math.max(1, o.readyN + o.torporN);
    return { combat: Math.min(1, (combatDisc / (2 * minionN)) * 0.6 + weapons * 0.25),
             stealth: Math.min(2, (stealthDisc / minionN) * 1.2),
             bleed: 1 + Math.min(1, bleedDisc / (2 * minionN)),
             dmgPerCombat: 1 + Math.min(2, combatDisc / (2 * minionN) * 1.5 + weapons * 0.5) };
  }
  oppCombat(seat){                     // 0..1: how dangerous is combat against this seat's minions -- prior (disciplines, weapons) blended with the combat cards seen and the damage they actually dealt me
    const o = this._opp(seat), pr = this._oppPrior(seat);
    const sn = o.seen || {}; const cards = (sn.strike | 0) + (sn.aggr | 0) * 1.5 + (sn.press | 0) * 0.5 + (sn.maneuver | 0) * 0.5 + (sn.combatCard | 0) * 0.5;
    const obsCards = Math.min(1, cards / 4), nCards = (sn.strike | 0) + (sn.aggr | 0) + (sn.press | 0) + (sn.maneuver | 0) + (sn.combatCard | 0);
    const obsDmg = o.combat.n ? Math.min(1, (o.combat.dmgSum / o.combat.n) / 3) : 0;
    const observed = (nCards + o.combat.n) ? (obsCards * nCards + obsDmg * o.combat.n) / (nCards + o.combat.n) : 0;
    return +Bot._blend(pr.combat, observed, nCards + o.combat.n, 3).toFixed(2);
  }
  oppStealth(seat){                    // expected announced stealth on this seat's next directed action
    const o = this._opp(seat), pr = this._oppPrior(seat);
    const used = o.stealthUsed || []; const n = used.length;
    const obs = n ? used.reduce((a, b) => a + b, 0) / n : 0;
    return +Bot._blend(pr.stealth, obs, n, 2).toFixed(2);
  }
  oppCombatCost(seat, blocker){        // pool-equivalents I expect to lose if my block SUCCEEDS and combat follows: blood lost + P(torpor) x the rescue price
    const o = this._opp(seat), pr = this._oppPrior(seat);
    const obs = o.combat.n ? o.combat.dmgSum / o.combat.n : 0;
    const dmg = Bot._blend(pr.dmgPerCombat, obs, o.combat.n, 2);
    const blood = blocker ? (blocker.blood | 0) : 2;
    const pTorpor = Math.max(0, Math.min(1, (dmg - blood + 1) / 3));
    return +(Math.min(dmg, blood) + pTorpor * 3).toFixed(2);
  }
  oppForecast(seat){                   // pool damage this seat's UNLOCKED ready minions can deal next turn: per-minion avg bleed x hit rate, seat average or the prior where a minion has no history
    const o = this._opp(seat), pr = this._oppPrior(seat);
    const M = o.minions || {}; const withData = Object.values(M).filter(m => m.bleeds > 0);
    const seatAvg = withData.length ? withData.reduce((a, m) => a + m.bleedSum / m.bleeds, 0) / withData.length : null;
    let f = 0;
    Object.keys(o.vamps || {}).forEach(name => { const v = o.vamps[name]; if(v.zone !== 'ready') return;   // ALL ready minions: they unlock before their next turn -- the b2s1 series' first two matches read tto 99 on the bot's own turn because the predator's minions were still locked from acting, and keep-a-blocker never fired
      const m = M[name]; let dmg, hit;
      if(m && m.bleeds > 0){ dmg = m.bleedSum / m.bleeds; hit = m.offensive ? Math.max(0.3, 1 - m.blocked / m.offensive) : 0.75; }   // v0.6.118d: blocked / OFFENSIVE, not / all actions
      else { dmg = seatAvg != null ? seatAvg : pr.bleed; hit = 0.75; }   // v0.6.118d: 0.75 = the measured hit rate across all five decks in serie-b2null-all (0.72-0.81); was 0.8. Calibration on that series: forecast/actual ratio 0.66 (the forecast OVER-read once bots bare-blocked) -- re-measure after B2 step 1
      f += dmg * hit; });
    return +f.toFixed(2);
  }
  turnsToOust(seat){                   // how many predator turns my pool survives at the forecast -- the number B2's posture and desperation hang on (Johan, 17 Sep)
    seat = seat || this.predSeat(); const f = this.oppForecast(seat);
    const pool = Math.max(0, this.pool | 0);
    const oustRange = Math.max(0, 8 - pool) * 0.25;   // Johan: 6-8 pool is the "oust range" -- a predator that can smell it prioritises pool damage
    return f > 0 ? +(pool / (f * (1 + oustRange))).toFixed(2) : 99;
  }
  oppAxes(seat){                       // the fx-key archetype signature with a confidence -- 80% of "which deck is this" after three or four cards, no TWDA needed
    const o = this._opp(seat), sn = o.seen || {}, pr = this._oppPrior(seat);
    const M = Object.values(o.minions || {}); const bleeds = M.reduce((a, m) => a + m.bleeds, 0);
    const ax = [];
    if(bleeds >= 2 || (sn.bleedMod | 0) >= 1 || pr.bleed >= 1.6) ax.push('bleed');
    if((sn.stealth | 0) >= 1 || this.oppStealth(seat) >= 1) ax.push('stealth-bleed');
    if(this.oppCombat(seat) >= 0.5) ax.push('combat');
    if((sn.intercept | 0) >= 2) ax.push('wall');
    if((sn.bounce | 0) >= 1) ax.push('bounce');
    if((sn.votes | 0) >= 1 || o.votesCalled >= 1) ax.push('vote');
    if((sn.rush | 0) >= 1) ax.push('rush-control');
    const evidence = Object.values(sn).reduce((a, b) => a + (b | 0), 0) + bleeds + o.combat.n;
    return { axes: ax, confidence: +Math.min(1, evidence / 6).toFixed(2) };
  }
  oppPosture(seat){ const ax = this.oppAxes(seat).axes; if(ax.includes('combat') || ax.includes('rush-control')) return 'disabling'; if(ax.includes('wall') || ax.includes('bounce')) return 'grinding'; return 'resisting'; }
  predatorIsBleeder(){ const s = this.predSeat(); if(!s) return false; const o = this._opp(s); const bleeds = Object.values(o.minions || {}).reduce((a, m) => a + m.bleeds, 0); return bleeds >= 2 || this.oppAxes(s).axes.includes('bleed'); }
  _bareBlockers(p){                    // unlocked bodies that may block right now (no card needed at stealth 0)
    return this.board.filter(c => c.zone === 'ready' && c.kind === 'crypt' && !c.locked && !(p && p.attempted && p.attempted.has(c.id)) && !(this._pentexVamp && c.name === this._pentexVamp) && !this._cryptCannotBlock(c, p && p.actingVampName));
  }
  _homeQuota(){                        // v0.6.118b (B2 step 2a, doctrine 2.4 -- the serie-b2s1 reading: "no unlocked body" in 27 of tremere's 46 windows): a GRINDING deck keeps bodies home BY DESIGN, not only in distress
    if(this._posture() !== 'grinding') return 0;
    const ready = this.board.filter(c => c.zone === 'ready' && c.kind === 'crypt').length;
    if(ready <= 1) return 0;                                                       // a lone vampire cannot be a wall and an economy at once
    return ready >= 4 ? 2 : 1;
  }
  _blockerWorth(c){                    // how good a body is at staying home: card intercept it could play + borne intercept + blood to survive the fight
    const ic = this._bestInterceptFor(c, null);
    return ((ic && ic.s) | 0) + this._equipIntercept(c) + (c.blood | 0) * 0.1;
  }
  _keepBlocker(v, actors, ai){         // B2 posture: bodies stay home -- the grinding deck's quota by design, or the LAST body when the predator is a bleeder and my pool is within reach
    if((v.blood | 0) === 0) return null;                                           // the mandatory hunt wins
    const others = actors.slice(ai + 1).filter(c => c.zone === 'ready' && !c.locked);
    const preyT = this.table[this.preySeat()]; const preyPool = (preyT && preyT.pub && typeof preyT.pub.pool === 'number') ? preyT.pub.pool : 30;
    if(preyPool <= 4) return null;                                                 // Johan: "...om man inte tror att man har chans att ousta" -- a lunge beats a wall
    const plan = this.plan;                                                        // v0.6.119 (the strategy layer): the plan owns how many bodies stay home -- the grinding quota is its floor, an EV-kept body its addition, a lunge its zero
    if(plan && plan.posture === 'lunge') return null;
    const quota = plan ? (plan.home | 0) : this._homeQuota();
    if(quota && 1 + others.length <= quota) return { tto: this.turnsToOust(), quota, why: 'keeps ' + v.name + ' home: ' + (plan ? 'plan ' + plan.posture + ', ' + quota + ' home' : 'grinding deck, quota ' + quota) + ' of ' + this.board.filter(c => c.zone === 'ready' && c.kind === 'crypt').length + ' ready' };
    if(others.length) return null;                                                 // not the last body
    if(this._wakeBlockersAfter(v)) return null;                                     // v0.6.120 (Johan, 18 Sep): "har man wake kan man spela mer aggressivt" -- the last body acts when it can wake itself to block
    if(this.board.filter(c => c.zone === 'ready' && c.kind === 'crypt' && !c.locked).length !== 1) return null;
    if(!this.predatorIsBleeder()) return null;
    const tto = this.turnsToOust();
    const limit = this.persona.insight <= 0.2 ? 2.5 : this.persona.insight >= 0.8 ? 1.2 : 2;   // novice keeps early, shark only when it truly bites
    if(tto > limit) return null;
    return { tto, why: 'keeps ' + v.name + ' unlocked: predator is a bleeder, forecast ' + this.oppForecast(this.predSeat()) + ' vs pool ' + this.pool + ' (turns to oust ' + tto + ')' };
  }
  /* ==================== end of the table model ==================== */
  /* ==================== THE STRATEGY LAYER (v0.6.119, B2 step 3 -- elysium-bot-strategy-layer-spec.md) ====================
     Layer 3 of Johan's four-layer model: ONE plan per turn -- game phase + posture + target, with the two
     numbers the tactics need from it (bodies to keep home, the influence floor). The tactics READ this.plan;
     they never recompute it, and NO persona term lives in here (CLAUDE.md debt 2 -- the persona is the final
     filter, after the decision basis). Public information + own state only; opponent reads go through the
     table model. The null point's reading (serie-b2null-all): the slow decks spent their few actions on
     equipment/stock/peeks while the prey sat at 8-10 pool, and nothing in the bot said "the prey is two
     turns from dead" -- or "I am". */
  _offNote(type, d){                   // my own offensive ledger, fed from the through/blocked emits: only bleed-class actions (no `kind`, not the hunt)
    if(!d || d.kind || d.card === 'hunt') return;
    const t = this._off || (this._off = { through: 0, blocked: 0, dmg: 0 });
    if(type === 'through'){ if((d.n | 0) <= 0) return; t.through++; t.dmg += d.n | 0; }
    else if(type === 'blocked'){ if((d.n | 0) <= 0) return; t.blocked++; }
  }
  _myHitRate(){ const t = this._off || { through: 0, blocked: 0 }; const n = t.through + t.blocked; return +Bot._blend(0.75, n ? t.through / n : 0, n, 3).toFixed(2); }   // prior 0.75 = the measured table rate (serie-b2null-all), k = 3
  _myBodies(){ return this.board.filter(c => c && c.kind === 'crypt' && c.zone === 'ready' && !(this._pentexVamp && c.name === this._pentexVamp)); }
  _myBleedEach(){                      // each ready body's best bleed next turn; a hand card is counted ONCE (best body first)
    const used = {}; const out = []; const copies = nm => this.hand.filter(h => { const x = this.fxLookup(h); return h === nm || (x && x.name === nm); }).length;   // the finder returns the SAME best index for every body -- count by name against the copies held
    const cand = this._myBodies().map(v => ({ v, c: (v.blood | 0) > 0 ? this._bestBleedCardFor(v) : null })).sort((a, b) => ((b.c && b.c.n) | 0) - ((a.c && a.c.n) | 0));
    for(const e of cand){ let n = 1; if((e.v.blood | 0) === 0) n = 0;   // a 0-blood body hunts (rulebook) -- no bleed from it
      else if(e.c && (used[e.c.name] | 0) < copies(e.c.name)){ used[e.c.name] = (used[e.c.name] | 0) + 1; n = Math.max(1, e.c.n | 0); }
      out.push({ v: e.v, n }); }
    return out;
  }
  _myForecast(raw){ const s = this._myBleedEach().reduce((a, e) => a + e.n, 0); return +(raw ? s : s * this._myHitRate()).toFixed(2); }
  _predAvgBleed(){ const s = this.predSeat(); if(!s) return 0; const o = this._opp(s); const M = Object.values(o.minions || {}).filter(m => m.bleeds > 0);
    return M.length ? M.reduce((a, m) => a + m.bleedSum / m.bleeds, 0) / M.length : this._oppPrior(s).bleed; }
  predHits(seat){                      // v0.6.137 (statistics): the predator's ready minions' EXPECTED hits, biggest first -- oppForecast's own terms, kept per minion
    seat = seat || this.predSeat(); if(!seat) return []; const o = this._opp(seat), pr = this._oppPrior(seat), M = o.minions || {};
    const withData = Object.values(M).filter(m => m.bleeds > 0); const seatAvg = withData.length ? withData.reduce((a, m) => a + m.bleedSum / m.bleeds, 0) / withData.length : null;
    return Object.keys(o.vamps || {}).filter(n => o.vamps[n].zone === 'ready').map(n => { const m = M[n];
      return m && m.bleeds > 0 ? (m.bleedSum / m.bleeds) * (m.offensive ? Math.max(0.3, 1 - m.blocked / m.offensive) : 0.75) : (seatAvg != null ? seatAvg : pr.bleed) * 0.75; }).sort((a, b) => b - a);
  }
  _actValue(v){                        // v0.6.137: this body's best action THIS turn in pool terms (spec-home-pricing section 2.2). A hunting body is no candidate (null). Economy (permanent / stock) is worth about a pool.
    if(!v || (v.blood | 0) === 0) return null;
    const done = this._turnActs && this._turnActs[v.id]; const bled = !!(done && done.has('bleed')), voted = !!(done && done.has('political'));
    let best = 0, what = 'nothing';
    const take = (x, w) => { if(x > best){ best = x; what = w; } };
    if(!bled){ take(1 + (this._cryptBleedBonus ? this._cryptBleedBonus(v) : 0), 'a plain bleed'); const c = this._bestBleedCardFor(v); if(c) take(c.n | 0, c.name); }
    const pd = this._bestPoolDmgActionFor ? this._bestPoolDmgActionFor(v) : null; if(pd) take(pd.n | 0, pd.name);
    if(!voted){ const pol = this._bestPoliticalFor(v); if(pol && (pol.pass || 0) >= 0.5) take(((pol.n | 0) + Math.max(0, (pol.deltas && pol.deltas[this.seat]) | 0)) * pol.pass, pol.name); }
    const perm = this._bestEquipActionFor(v) || (this._bestStrengthFor ? this._bestStrengthFor(v) : null) || (this._bestRecruitFor ? this._bestRecruitFor(v) : null) || this._bestBloodStockFor(v);
    if(perm) take(1.0, perm.name);
    return { n: best, what };
  }
  _priceHome(bodies, wOff, wDef, wakes){   // v0.6.137 (the general layer): how many bodies are worth MORE at home than acting -- stay = pStop x the k-th expected predator hit (wakes already cover the first ones, a bounce in hand lifts the first stayer to 0.9), act = the body's best action x my through rate; exchange rate = the plan's own wDef / wOff. Never the whole bench, at most one per predator minion.
    const hw = this.o.homeWeight == null ? 1 : +this.o.homeWeight; if(!(hw > 0)) return { home: 0, why: [] };
    const pred = this.predSeat(), hits = this.predHits(pred).slice(wakes | 0); if(!hits.length) return { home: 0, why: [] };
    const st = this.oppStealth(pred), raw = this._myForecast(true), thru = raw > 0 ? Math.max(0.3, Math.min(1, this._myForecast(false) / raw)) : 0.75;
    const free = bodies.filter(v => (v.blood | 0) > 0 && !v.locked); const bounce = this._bestBounceFor(free, new Set());
    const cand = free.map(v => { const ic = this._bestInterceptFor(v, null); const icp = ((ic && ic.s) | 0) + this._equipIntercept(v); const a = this._actValue(v);
      return { v, pStop: Math.max(0.05, Math.min(0.9, 0.5 + 0.35 * (icp - st))), act: a ? a.n * thru : 0, what: a ? a.what : 'nothing' }; });
    /* v0.6.138 THE FORWARD GEAR (serie-home1 run 4: five bodies walled for 33 turns against three and could not finish): when I out-body my prey by two or more, staying is worth
       half, and from four bodies up at least TWO always go forward. Bench superiority is a read the turns-to-fall exchange rate cannot see. */
    const prey = this.preySeat(), preyReady = prey && prey !== this.seat ? ((this._opp(prey).readyN | 0) || Object.keys(this._opp(prey).vamps || {}).filter(n => this._opp(prey).vamps[n].zone === 'ready').length) : 0;
    const fwd = bodies.length - preyReady >= 2 ? 0.5 : 1;
    const cap = Math.min(hits.length, Math.max(0, bodies.length - (bodies.length >= 4 ? 2 : 1))); const why = []; let home = 0; const used = new Set();
    for(let k = 0; k < cap; k++){ let pick = null;
      cand.forEach(c => { if(used.has(c.v.id)) return; const ps = (k === 0 && bounce) ? Math.max(c.pStop, 0.9) : c.pStop; const m = ps * hits[k] * wDef * hw * fwd - c.act * wOff; if(m > 0 && (!pick || m > pick.m)) pick = { c, m, ps }; });
      if(!pick) break; used.add(pick.c.v.id); home++;
      why.push(pick.c.v.name + ' is worth more at home (stops ' + (pick.ps * hits[k]).toFixed(2) + ' of a ' + hits[k].toFixed(2) + ' hit \u00d7 ' + wDef.toFixed(2) + ') than acting (' + pick.c.what + ' ' + pick.c.act.toFixed(2) + ' \u00d7 ' + wOff.toFixed(2) + ')'); }
    if(home && fwd < 1) why.push('(I out-body my prey ' + bodies.length + ' to ' + preyReady + ': staying counted at half)');
    return { home, why };
  }
  _raceHome(bodies, wakes){            // v0.6.138 (Johan, 20 Sep): 'a racing deck exists to go forward; it seldom leaves bodies up other than with a bounce in hand, no wake at the same time, against a deck averaging 2+ pool damage, when the vampire itself has only managed a bleed of 1-2 -- at a bleed of 1 the weight to block is larger, depending on the predator's statistics'
    const hw = this.o.homeWeight == null ? 1 : +this.o.homeWeight; if(!(hw > 0) || (wakes | 0) > 0) return { home: 0, why: [] };   // a wake in hand: act, and wake to bounce
    const free = bodies.filter(v => (v.blood | 0) > 0 && !v.locked); const bounce = this._bestBounceFor(free, new Set()); if(!bounce || bodies.length < 2) return { home: 0, why: [] };
    const hit = this.predHits()[0] || 0; if(hit < 2) return { home: 0, why: [] };
    const raw = this._myForecast(true), thru = raw > 0 ? Math.max(0.3, Math.min(1, this._myForecast(false) / raw)) : 0.75;
    let pick = null; free.forEach(v => { const a = this._actValue(v); if(!a || a.n > 2) return; const m = 0.9 * hit * hw - a.n * thru; if(m > 0 && (!pick || m > pick.m)) pick = { v, a, m }; });   // in POOL: what the bounce sends on against what this body would have dealt
    return pick ? { home: 1, why: [pick.v.name + ' stays up for the ' + bounce.name + ' (no wake in hand): it sends on ' + (0.9 * hit).toFixed(2) + ' of a ' + hit.toFixed(2) + ' hit, more than its own ' + pick.a.what + ' (' + (pick.a.n * thru).toFixed(2) + ')'] } : { home: 0, why: [] };
  }
  _noteHit(p){                         // v0.6.136 (statistics layer): what an action REALLY cost me, written to the acting minion -- the announce says 'bleeds for 3', the Conditioning comes later
    const seat = p && p.actorSeat, vamp = this._obs && this._obs.seat === seat ? this._obs.vamp : null; if(!seat || !vamp) return;
    const rec = this._minionRec(seat, vamp), n = (p.amount | 0); if(n > (rec.hitMax | 0)) rec.hitMax = n;
    const os = this._opp(seat); os.hitsN = (os.hitsN | 0) + 1; if(n >= 3) os.hitsBig = (os.hitsBig | 0) + 1;   // v0.6.146: how often this seat's bleeds LAND heavy (3+) -- the pump rate the bounce reserve reads
  }
  predBurst(seat){                     // v0.6.136 (Johan, 19 Sep: 'a Dominate deck seen with Govern and Conditioning reaches 6 pool with one action'): the WORST predator turn the table has shown me -- every ready minion lands its biggest hit. An unseen minion gets the prior: its seat's average bleed, one more when the seat shows bleed disciplines.
    seat = seat || this.predSeat(); if(!seat) return 0; const o = this._opp(seat), pr = this._oppPrior(seat), M = o.minions || {}; let b = 0;
    Object.keys(o.vamps || {}).forEach(name => { if(o.vamps[name].zone !== 'ready') return; const m = M[name];
      b += m && (m.hitMax | 0) > 0 ? m.hitMax : Math.ceil(pr.bleed) + (pr.bleed > 1.3 ? 1 : 0); });
    return b;
  }
  _critPool(){                         // v0.6.136: the pool level at which I am ONE predator turn from falling -- Johan: 6 is the floor of it, the rest is dynamic: it RISES with what I face (predBurst) and FALLS with what I can stop now (unlocked bodies whose intercept meets its stealth, wakes for the locked ones, a bounce in hand). critRisk scales the dynamic part (0 = the fixed floor, the original; 1 = full) -- a persona's appetite, to be MEASURED both ways (Johan).
    const floor = this.o.poolFloor | 0, risk = this.o.critRisk == null ? 1 : +this.o.critRisk; const pred = this.predSeat();
    if(!(risk > 0) || !pred) return { crit: floor, burst: 0, stopped: 0, floor, risk };
    const o = this._opp(pred), M = o.minions || {}, pr = this._oppPrior(pred), st = this.oppStealth(pred);
    const hits = Object.keys(o.vamps || {}).filter(n => o.vamps[n].zone === 'ready').map(n => { const m = M[n]; return m && (m.hitMax | 0) > 0 ? m.hitMax : Math.ceil(pr.bleed) + (pr.bleed > 1.3 ? 1 : 0); }).sort((a, b) => b - a);
    const burst = hits.reduce((a, b) => a + b, 0);
    const bodies = this.board.filter(c => c && c.kind === 'crypt' && c.zone === 'ready' && (c.blood | 0) > 0);
    let wakes = 0; (this.hand || []).forEach(nm => { const h = this.fxLookup(nm); if(h && h.kind === 'lib' && (h.e.modes || []).some(mo => mo.fx && mo.fx.wake)) wakes++; });
    const stops = []; bodies.forEach(v => { if(v.locked){ if(wakes > 0) wakes--; else return; }
      const ic = this._bestInterceptFor(v, null); const icp = ((ic && ic.s) | 0) + this._equipIntercept(v); stops.push(Math.max(0.05, Math.min(0.9, 0.5 + 0.35 * (icp - st)))); });   // the plan's own block odds
    const bounce = this._bestBounceFor(bodies.filter(v => !v.locked), new Set()); if(bounce) stops.push(0.9);
    stops.sort((a, b) => b - a); let stopped = 0; for(let i = 0; i < Math.min(stops.length, hits.length); i++) stopped += stops[i] * hits[i];   // my best stopper meets its biggest hit
    const crit = Math.max(floor, Math.min(15, Math.ceil(floor + risk * Math.max(0, (burst - stopped) - floor))));
    return { crit, burst, stopped: +stopped.toFixed(2), floor, risk };
  }
  _predReadyN(){ const s = this.predSeat(); if(!s) return 0; const o = this._opp(s); return Object.values(o.vamps || {}).filter(v => v.zone === 'ready').length; }
  _strategize(tag){
    try{
      const pred = this.predSeat(), prey = this.preySeat();
      const preyT = this.table[prey]; const preyPool = (preyT && preyT.pub && typeof preyT.pub.pool === 'number') ? preyT.pub.pool : 30;
      const bodies = this._myBodies(), alive = this._liveCount();
      const myFc = this._myForecast(false), myFcRaw = this._myForecast(true);
      const predFc = pred ? this.oppForecast(pred) : 0, myTto = pred ? this.turnsToOust(pred) : 99;
      const preyTto = +(preyPool / Math.max(0.5, myFc)).toFixed(2);
      const phase = this._endgameNow() ? 'end' : (bodies.length < 2 || (this.ownTurns | 0) <= 2) ? 'build' : 'mid';
      const wOff = 1 / Math.max(0.5, preyTto), wDef = 1 / Math.max(0.5, myTto);
      const lunge = bodies.length > 0 && (preyPool <= 4 || preyPool <= myFcRaw);
      /* home: body by body, best blocker first -- defend when a pool point saved outweighs the pool point it would deal */
      const H = 3;                                                                 // the planning horizon in predator turns -- ONE constant today; the persona spec's horizon (novice 1 / grinder 2 / shark 3+) replaces it in the persona step, not here
      let home = 0; const quota = myTto <= 2 * H ? this._homeQuota() : 0; const homeWhy = [];   // the grinding quota holds while the predator can reach me inside two horizons -- nobody walls against an empty board
      if(!lunge && pred && bodies.length && myTto <= H && predFc > 0){              // defence is priced only when the predator reaches me inside the horizon: blocking wins no VP, it buys turns
        /* v0.6.119b (serie-b2s3's reading): the first cut compared EV per body (pool saved / myTto vs pool dealt / preyTto) and
           held racing decks home against a swarm -- sewer's use fell 89 -> 70 % and its through 44 -> 25 while the swarm still
           killed it on the same turn. A block that cannot change WHEN I die is not worth an action: bodies stay home only when
           that buys at least ONE WHOLE predator turn, and the smallest number that does. */
        const avg = this._predAvgBleed(), st = this.oppStealth(pred);
        const cap = Math.min(this._predReadyN(), Math.max(0, bodies.length - 1));   // at most one per predator minion, and never the whole bench (a plan that does nothing loses)
        const ranked = bodies.filter(v => (v.blood | 0) > 0 && !v.locked).sort((x, y) => this._blockerWorth(y) - this._blockerWorth(x));
        const range = 1 + Math.max(0, 8 - (this.pool | 0)) * 0.25;                  // turnsToOust's own oust-range factor
        let saved = 0;
        for(let h = 1; h <= Math.min(cap, ranked.length); h++){ const v = ranked[h - 1];
          const ic = this._bestInterceptFor(v, null); const icp = ((ic && ic.s) | 0) + this._equipIntercept(v);
          const pBlock = Math.max(0.05, Math.min(0.9, 0.5 + 0.35 * (icp - st)));
          saved += avg * pBlock;
          const ttoH = (this.pool | 0) / (Math.max(0.25, predFc - saved) * range);
          if(ttoH - myTto >= 1){ home = h; homeWhy.push(h + ' home: ' + myTto + ' -> ' + ttoH.toFixed(2) + ' turns'); break; } }
      }
      if(!lunge && quota > home) home = Math.min(quota, Math.max(0, bodies.length - 1));
      const wakes = this._wakesInHand(); if(wakes && home){ homeWhy.push(wakes + ' wake(s) in hand stand in for ' + Math.min(wakes, home) + ' bod' + (Math.min(wakes, home) === 1 ? 'y' : 'ies')); home = Math.max(0, home - wakes); }   // v0.6.120: a wake in hand IS a body at home -- the deck attacks with everything and still blocks
      /* v0.6.137 (spec-home-pricing-2026-09-19): per-body pricing for the CONTROL postures (grinding, disabling) and for everyone at or under the critical pool.
         The racing postures keep v0.6.119b's gate above -- the sewer lesson. The number is already net of wakes (they fill the first slots). */
      const critNow = this._critPool(); let priced = null;
      /* v0.6.138 (serie-home A vs B + Johan, 20 Sep): DISABLING decks price per body, with a FORWARD term; GRINDING decks keep their design quota and get no pricing on top
         (tremere turtled: dealt -34 %); a RACING deck goes forward -- it leaves ONE body up only on Johan's rule (_raceHome). */
      const post = this._posture();
      if(!lunge && pred && bodies.length > 1 && predFc > 0 && preyPool > 4){
        if(post === 'disabling') priced = this._priceHome(bodies, wOff, wDef, wakes);
        else if(post === 'resisting') priced = this._raceHome(bodies, wakes);
        if(priced && priced.home > home){ home = priced.home; priced.why.forEach(w => homeWhy.push(w)); } }
      const posture = lunge ? 'lunge' : (home >= 1 && (home * 2 >= bodies.length || myTto <= H)) ? 'hold' : phase === 'build' ? 'build' : 'race';   // hold = bodies actually stay home; a deck that is dying and cannot buy a turn RACES
      const floor = Math.max(this.o.poolFloor | 0, (pred && this._predReadyN() && bodies.length >= 2) ? Math.ceil(1.25 * predFc) : 0);   // under two bodies the bench matters more than the bank -- the knob alone
      const target = (!lunge && myTto <= H && pred && this._posture() === 'disabling') ? { seat: pred, dir: 'back', mode: 'minions' } : { seat: prey, dir: 'fwd', mode: 'pool' };
      const why = posture === 'lunge' ? 'prey at ' + preyPool + ' pool, my bodies can land ' + myFcRaw + ' -- everything goes forward'
                : posture === 'hold' ? 'I last ' + myTto + ' predator turn(s), my prey ' + preyTto + ' of mine -- ' + home + ' bod' + (home === 1 ? 'y' : 'ies') + ' stay home' + (homeWhy.length ? ' (' + homeWhy.join(', ') + ')' : '')
                : posture === 'build' ? 'building: ' + bodies.length + ' ready, own turn ' + (this.ownTurns | 0)
                : 'racing: prey falls in ' + preyTto + ' of my turns, I in ' + myTto + ' of my predator\'s';
      const prev = this.plan;
      this.plan = { turn: this.ownTurns | 0, tag, phase, posture, home, floor, target, wOff: +wOff.toFixed(2), wDef: +wDef.toFixed(2),
                    reads: { myTto, preyTto, myFc, myFcRaw, predFc, pool: this.pool | 0, preyPool, ready: bodies.length, alive, crit: critNow, pricedHome: priced ? priced.home : null }, why };
      if(tag === 'unlock' || !prev || prev.posture !== posture || prev.home !== home || prev.floor !== floor){
        this._emit('plan', this.plan); this.o.log('plan (' + tag + '): ' + phase + ' / ' + posture + ' -- ' + why + '; influence floor ' + floor); }
    }catch(e){ this.o.log('strategize error:', e.message); }
    return this.plan;
  }
  _poolFloorEff(){ const p = this.plan; return Math.max(this.o.poolFloor | 0, this.o.planFloor ? ((p && p.floor) | 0) : 0); }   // the influence floor the tactics read. v0.6.119c: the plan's floor is COMPUTED and EMITTED but only CONSUMED when o.planFloor is set -- serie-b2s3/b2s3b showed no survival gain from it (tremere ousted at 6,5,6,5,6 vs the null's 6,5,9,5,6) and fewer raises (14 -> 11); a behaviour change with no measured benefit does not ship switched on
  _planOffW(){ const p = this.plan; return p ? Math.max(1, Math.min(1.5, 0.9 + 0.6 / Math.max(0.4, p.reads.preyTto))) : 1; }          // a bleed is worth more the closer the prey is to falling
  _planEconW(){ const p = this.plan; return p ? Math.max(0.4, Math.min(1, p.reads.preyTto / 3)) * (p.phase === 'build' ? 1.15 : 1) : 1; }   // shopping is worth less the closer the prey is; a little more while building
  /* ==================== end of the strategy layer ==================== */
  readP(seat, cat){                 // P(this seat holds `cat`) — v1: flat prior + shown boosts, hand-size scaled
    const t = this.table[seat];
    const hand = (t && t.pub && t.pub.counts) ? t.pub.counts.hand : 4;   // unknown ≠ empty: neutral 4
    const seen = (this.reads[seat] && this.reads[seat].seen[cat]) || 0;
    return Math.min(0.9, (0.15 + 0.25 * seen) * Math.min(1, hand / 4));
  }
  _onFx(m){                         // structured observation: face-up play clones carry the card name
    if(!this.started || !m || m.kind !== 'play' || m.seat === this.seat) return;
    if(m.card && m.card.name && !m.card.faceDown) this._noteObserved(m.seat, m.card.name);
  }
  /* ---------- hand-intel (R2, plan section 4): legal ground truth about a hand ----
     Populated ONLY by revealHand / openHandGrant / openHandRevoke addressed to this
     seat (the server routes the private list to recipients only) -- never from pub,
     never from anything else. Decay lives in _onBoard. */
  _handIntel(seat){ return (this.handIntel && this.handIntel[seat|0]) || null; }
  _setHandIntel(seat, mode, cards){
    this.handIntel = this.handIntel || {};
    this.handIntel[seat|0] = {
      mode, asOf: Date.now(), unknownDraws: 0,
      cards: (cards||[]).slice(0,30).map(c=>({ name:String((c&&c.name)||''), kind:(c&&c.kind)==='crypt'?'crypt':'lib' })).filter(c=>c.name)
    };
    if(this._emit) this._emit('hand-intel', { seat: seat|0, mode, n: this.handIntel[seat|0].cards.length });
  }
  _onRevealHand(m){ if(!m || !(m.seat|0) || (m.seat|0)===this.seat || !Array.isArray(m.cards)) return; this._setHandIntel(m.seat, 'snap', m.cards); this._resolveRevealWaiter(m.seat); }
  _onOpenHandGrant(m){ if(!m || !(m.seat|0) || (m.seat|0)===this.seat || !Array.isArray(m.cards)) return; this._setHandIntel(m.seat, 'open', m.cards); this._resolveRevealWaiter(m.seat); }
  _resolveRevealWaiter(seat){        // R3: an [aus] actor may be awaiting exactly this reveal (a grant counts too)
    const w=this._revealWaiter; if(!w || w.seat!==(seat|0)) return;
    this._revealWaiter=null; clearTimeout(w.t);
    const hi=this._handIntel(seat);
    w.res({ cards: hi ? hi.cards.slice() : [] });
  }
  _awaitReveal(seat, ms){            // R3: one-shot waiter the actor branch uses after [aus] resolves; instant when intel is already live
    const hi=this._handIntel(seat);
    if(hi && hi.mode) return Promise.resolve({ cards: hi.cards.slice() });
    return new Promise(res=>{ this._revealWaiter={ seat: seat|0, res, t: setTimeout(()=>{ if(this._revealWaiter && this._revealWaiter.res===res){ this._revealWaiter=null; res(null); } }, Math.max(500, ms|0)) }; });
  }
  _syncOpenHand(force){                   // R3: the granter owns the open-hand state (server design) -- re-send the live list on every change while active
    if(!this._openHandActive && !this._debugHand) return;
    /* v0.6.112 (R4): called from the board-push flush, i.e. potentially on every
       board change. The signature guard means only a hand that ACTUALLY moved
       reaches the wire -- order included, since a reordered hand is a different
       view even at the same length. */
    const sig = this.hand.join('\u0001');
    if(!force && sig === this._openHandSig) return;
    this._openHandSig = sig;
    this.send({ t:'openHand', to:'all', cards: this.hand.map(n=>({ name:n, kind:'lib' })) });
  }
  _onOpenHandRevoke(m){ if(!m || !this.handIntel) return; delete this.handIntel[m.seat|0]; if(this._emit) this._emit('hand-intel', { seat: m.seat|0, mode: null, n: 0 }); }
  _pCat(seat, cat){                 // ground-truth-aware P(seat holds cat): intel overrides the readP inference
    const hi = this._handIntel(seat);
    if(hi && this.fx){
      for(const c of hi.cards){ const h = this.fxLookup(c.name); if(h && h.kind==='lib' && this._cats(h.e).includes(cat)) return 1; }
      if(hi.mode==='open') return 0;                          // live open hand, category absent: certainty
      const k = hi.cards.length, u = hi.unknownDraws|0;       // stale snapshot: only the unknown slots can hide one
      return this.readP(seat, cat) * (u>0 ? u/(k+u) : 0);
    }
    return this.readP(seat, cat);
  }
  _attachedEquips(vamp){             // E1: this vampire's in-play equipment; N0: RETAINERS attach the same way (Raven Spy-class) -- one reader serves both
    const ids = new Set(vamp && vamp.attached || []);
    return this.board.filter(c => { if(!c || !ids.has(c.id) || c.kind !== 'lib' || this._outOfPlay(c)) return false;
      const h = this.fxLookup(c.name); if(!h || h.kind !== 'lib') return false;
      const tt = (h.e.t) || []; return tt.includes('equip') || tt.includes('retainer'); });
  }
  _borneEnvFor(vamp){                // N0: attached envDmgPerRound sum (Murder of Crows-class) -- the borne crows peck every combat, no once-per-combat card limit
    let n = 0;
    this._attachedEquips(vamp).forEach(c => { const h = this.fxLookup(c.name);
      let cm = 0;
      (h.e.modes || []).forEach(mo => { if(mo.fx && typeof mo.fx.envDmgPerRound === 'number' && this._modeUsableBy(mo, vamp) && mo.fx.envDmgPerRound > cm) cm = mo.fx.envDmgPerRound; });
      n += cm; });
    return n;
  }
  _equipIntercept(vamp){             // E1: passive +intercept from borne equipment (fx.intercept), mode-gated (Bowl's [aus]). Per-CARD MAX, not a mode sum -- Bowl's [AUS] line is the same grant with an OPTIONAL burn-blood extra (not modeled v1), so counting both modes would double the passive.
    let n = 0;
    this._attachedEquips(vamp).forEach(c => { const h = this.fxLookup(c.name);
      let cm = 0;
      (h.e.modes || []).forEach(mo => { if(mo.fx && typeof mo.fx.intercept === 'number' && this._modeUsableBy(mo, vamp) && mo.fx.intercept > cm) cm = mo.fx.intercept; });
      n += cm; });
    return n;
  }
  _equipPrevent(vamp){               // E1: Kevlar-class -- fx.prevent from borne equipment, ONCE each combat (conservative 1; the 2-vs-guns upgrade is a later refinement)
    if(this._equipPreventUsed) return 0;
    let best = 0;
    this._attachedEquips(vamp).forEach(c => { const h = this.fxLookup(c.name);
      (h.e.modes || []).forEach(mo => { if(mo.fx && typeof mo.fx.prevent === 'number' && this._modeUsableBy(mo, vamp)) best = Math.max(best, 1); }); });
    if(best > 0) this._equipPreventUsed = true;
    return best;
  }
  _equipCombatOption(vamp, key){     // E1: fx.strike / fx.maneuver granted by borne equipment (.44). Guns are never hand strikes -> excluded under Immortal Grapple; ranged works at any range. Maneuver: once each combat.
    if(key === 'strike' && this._handStrikeOnly) return null;
    if(key === 'maneuver' && this._equipManeuverUsed) return null;
    let best = null;
    this._attachedEquips(vamp).forEach(c => { const h = this.fxLookup(c.name);
      (h.e.modes || []).forEach(mo => { const v = mo.fx && mo.fx[key];
        if(typeof v === 'number' && this._modeUsableBy(mo, vamp) && (!best || v > best.n)) best = { name: c.name, n: v, fromEquip: true }; }); });
    return best;
  }
  _remainingLibrary(){               // E1 (the Ashur precedent): the server's piles are hidden count-only -- estimate remaining as deck minus hand minus every board name (any zone)
    const left = {};
    ((this.deck && this.deck.library) || []).forEach(e => { const n = e.name || e; left[n] = (left[n] | 0) + (e.qty || 1); });
    this.hand.forEach(n => { if(left[n]) left[n]--; });
    this.board.forEach(c => { if(c && c.kind === 'lib' && left[c.name]) left[c.name]--; });
    return left;
  }
  _equipLadderTier(name, vamp, kinds){   // Johan's frozen fetch ladder: 1 = usable intercept, 2 = weapons (incl. envDmg pecking), 3 = prevent armor, 4 = other. N0: kinds defaults ['equip'] so the MotS FETCH stays equipment-only per its card text; the equip/employ finder passes ['equip','retainer'].
    const kk = kinds || ['equip'];
    const h = this.fxLookup(name); if(!h || h.kind !== 'lib' || !((h.e.t) || []).some(t => kk.includes(t))) return 0;
    if(h.e.unique && this._uniqueInPlay(h.name)) return 0;
    if(this._attachedEquips(vamp).some(c => c.name === h.name)) return 0;   // one-per-minion (Kevlar/vehicle wording) -- conservative for all equipment
    let t = 4;
    (h.e.modes || []).forEach(mo => { const f = mo.fx || {};
      if(typeof f.intercept === 'number' && this._modeUsableBy(mo, vamp)) t = Math.min(t, 1);
      if(typeof f.strike === 'number') t = Math.min(t, 2);
      if(typeof f.envDmgPerRound === 'number' && this._modeUsableBy(mo, vamp)) t = Math.min(t, 2);   // N0: the pecking crow is weapon-tier
      if(typeof f.prevent === 'number') t = Math.min(t, 3); });
    return t;
  }
  _bestEquipActionFor(vamp){         // E1: the best equipment in HAND to take (an equip action); N0: RETAINERS too (an employ action -- cost.blood paid by the acting vampire, guarded to leave >= 1 blood)
    if(!this.fx) return null;
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib') return;
      const tt = (h.e.t) || []; const isRet = tt.includes('retainer');
      if(!tt.includes('equip') && !isRet) return;
      const cP = (h.e.cost && h.e.cost.pool) || 0, cB = (h.e.cost && h.e.cost.blood) || 0;
      if(cP > this.pool) return;
      if(cB > 0 && (vamp.blood | 0) <= cB) return;   // employ must leave the bearer >= 1 blood
      const tier = this._equipLadderTier(h.name, vamp, ['equip','retainer']); if(!tier) return;
      if(!best || tier < best.tier) best = { idx, name: h.name, kind: 'equip', cost: cP, costBlood: cB, isRetainer: isRet, tier, st: 0, n: 1 };
    });
    return best;
  }
  _bestFetchFor(vamp){               // E1: Magic of the Smith -- fx.fetchEquip; target from the remaining library via the ladder
    if(!this.fx) return null;
    for(let idx = 0; idx < this.hand.length; idx++){
      const h = this.fxLookup(this.hand[idx]); if(!h || h.kind !== 'lib') continue;
      let st = 0, okF = false;
      (h.e.modes || []).forEach(mo => { if(mo.fx && mo.fx.fetchEquip && this._modeUsableBy(mo, vamp)){ okF = true; if(typeof mo.fx.actStealth === 'number' && mo.fx.actStealth > st) st = mo.fx.actStealth; } });
      if(!okF) continue;
      const cB = (h.e.cost && h.e.cost.blood) || 0;   // v0.6.117: Magic of the Smith costs 1 blood (cardfx v1.6.14 surfaced it); the fetch's `cost` field is the TARGET's pool price, so the card's own price rides costBlood like the equip finder's
      if(cB > (vamp.blood | 0)) continue;
      const left = this._remainingLibrary();
      let target = null;
      for(const nm in left){ if(left[nm] <= 0) continue;
        const tier = this._equipLadderTier(nm, vamp); if(!tier) continue;
        const th = this.fxLookup(nm); const cost = (th.e.cost && th.e.cost.pool) || 0;
        if(cost > this.pool) continue;
        if(!target || tier < target.tier) target = { name: th.name, cost, tier }; }
      if(!target) return null;
      return { idx, name: h.name, kind: 'fetch', st, target, cost: target.cost, tier: target.tier, n: 1, costBlood: cB };
    }
    return null;
  }
  _doEquip(vamp, name, cost, costBlood){   // E1: pay + materialize on the bearer; N0: retainers pay BLOOD from the bearer
    this.pool = Math.max(0, this.pool - (cost | 0));
    if(costBlood) vamp.blood = Math.max(0, (vamp.blood | 0) - (costBlood | 0));
    const id = this.gid();
    this.board.push({ id, name, kind: 'lib', zone: 'ready', faceDown: false, x: 64, y: 64, locked: false });
    vamp.attached = vamp.attached || []; vamp.attached.push(id);
    this.push();
    return id;
  }
  _uniqueInPlay(name){               // M2: is a copy of this UNIQUE card visible in ready play anywhere (my board or any seat's pub)?
    if(this.board.some(c => c && c.kind === 'lib' && c.zone === 'ready' && c.name === name)) return true;
    for(const k in this.table){ const t = this.table[k];
      if(t && t.pub && (t.pub.cards || []).some(c => c && c.kind === 'lib' && c.zone === 'ready' && c.name === name)) return true; }
    return false;
  }
  _bestNeutralizeTarget(seat, opts){  // M1 (Johan's heuristic, tremere-plan section 2): which prey vampire's neutralization best clears my action lane
    const o = opts || {}; const t = this.table[seat]; if(!t || !t.pub) return null;
    const hi = this._handIntel(seat);
    let intelBounce = false;
    if(hi && this.fx) for(const c of hi.cards){ const h = this.fxLookup(c.name);
      if(h && h.kind === 'lib' && (h.e.modes || []).some(mo => (mo.fx || {}).bounce)){ intelBounce = true; break; } }
    let best = null, bs = 0;
    (t.pub.cards || []).forEach(c => {
      if(!c || c.kind !== 'crypt' || c.zone !== 'ready') return;
      if(o.needUnlocked && c.locked) return;             // Misdirection: locking a locked minion is a wasted card
      const cv = this.fxLookup(c.name); if(!cv || cv.kind !== 'crypt') return;
      const d = cv.e.disc || { all: [], sup: [] };
      const supB = (d.sup || []).filter(x => x === 'dom' || x === 'aus').length;   // the bounce disciplines (Deflection=dom, Telepathic Misdirection=aus; aus also = intercept)
      const allB = (d.all || []).filter(x => x === 'dom' || x === 'aus').length;
      const sc = (cv.e.cap | 0) + 3 * supB + 1.5 * (allB - supB) + ((intelBounce && allB) ? 2 : 0) + (!c.locked ? 0.5 : 0);
      if(sc > bs){ bs = sc; best = { name: c.name, id: c.id, seat, score: sc }; }
    });
    return best;
  }
  _pickForcedDiscard(cards){        // R3 ladder v2 (Johan's Malkavian baseline, 24 July): bounce 100 > reaction w/ wake OR unlock 80 > reaction w/ +intercept 60 > master 40 > deterministic type-STARVATION (the first type the target holds LEAST of; fixed type order on ties; first-in-reveal-order within it). Zero Math.random (the T2 verification stands -- seedable PRNG later if genuine randomness is wanted).
    const info = (cards||[]).map(c => { const h = this.fxLookup(c && c.name); return (h && h.kind === 'lib') ? { name: c.name, e: h.e } : null; }).filter(Boolean);
    let best = null, bs = 0;
    info.forEach(x => {
      const isReact = (x.e.t || []).includes('react'), isMaster = (x.e.t || []).includes('master');
      let bnc = false, wk = false, ic = false;
      (x.e.modes || []).forEach(mo => { const f = mo.fx || {};
        if(f.bounce) bnc = true; if(f.wake || f.unlock) wk = true;
        if(typeof f.intercept === 'number') ic = true; });
      const sc = bnc ? 100 : (isReact && wk) ? 80 : (isReact && ic) ? 60 : (isMaster ? 40 : 0);
      if(sc > bs){ bs = sc; best = x.name; }
    });
    if(best) return best;
    const order = ['action','mod','react','combat','master','ally','equip','retainer','event','political'];
    const cnt = {}; info.forEach(x => { const ty = (x.e.t || ['?'])[0]; cnt[ty] = (cnt[ty] || 0) + 1; });
    let ty = null, tn = Infinity;
    order.concat(Object.keys(cnt).filter(k => !order.includes(k))).forEach(k => { if(cnt[k] != null && cnt[k] < tn){ tn = cnt[k]; ty = k; } });
    const hit = info.find(x => (x.e.t || ['?'])[0] === ty);
    return hit ? hit.name : (info[0] ? info[0].name : null);
  }


  interceptPotential(reacted, p){      // best single usable +intercept in hand right now (M2: the real thing plays only one per attempt, so "potential" means best immediately available, not an optimistic sum). Must agree with the once-per-action ledger the EXECUTION side enforces, or the decision commits to a block it can no longer back with a card.   // VA: p (the pending) brings kind + actingVampName so the crypt mods and the Navar filter shape the DECISION exactly like the pick/wire -- decision/pick agreement, the E1/45f principle
    if(!this.fx) return 0;
    const wakeAvail = !!this._wakeCard();
    const vamps = this.board.filter(c => c.zone === 'ready' && c.kind === 'crypt' && (!c.locked || wakeAvail) && !this._cryptCannotBlock(c, p && p.actingVampName)
      && !(p && p.attempted && p.attempted.has(c.id)) && !(this._pentexVamp && c.name === this._pentexVamp));   // v0.6.103 (#4): decision == pick -- a failed attempter and a Pentexed minion count for neither (the v0.4.1/v0.4.3 drift class, third occurrence)
    let best = -Infinity;
    vamps.forEach(v => { const b = this._bestInterceptFor(v, reacted || null); const s2 = (b ? b.s : 0) + this._equipIntercept(v) + this._cryptIntercept(v, p); if(s2 > best) best = s2; });   // v0.6.48 (uncertainty review): borne equipment (Bowl/Sport Bike) counts toward the DECISION too -- decision/pick agreement; the execution side (_setTallyB + _pickBlocker) already read it   // VA review: RAW best -- the old `best = 0` seed was an implicit floor (a lone Christine must report -1, not 0); empty candidate set still reports 0
    return (best === -Infinity) ? 0 : best;
  }
  _findStray(){                      // N4d: a ready ally with fx.allyPressLife and life left (fx-literal identification -- the scanner lesson pre-applied)
    return this.board.find(c => { if(!c || c.zone !== 'ready' || this._outOfPlay(c) || (c.life | 0) < 1) return false;
      const h = this.fxLookup(c.name); return h && h.kind === 'lib' && ((h.e.t) || []).includes('ally') && (h.e.modes || []).some(mo => mo.fx && mo.fx.allyPressLife); }) || null;
  }
  _strayPressBurn(){                 // N4d consumer A: burn 1 life for a press to my combatant; the ally dies to 'burned' at 0
    const st = this._findStray(); if(!st) return false;
    st.life = (st.life | 0) - 1;
    if(st.life <= 0){ st.zone = 'burned'; this.note('Trainbot: the Stray gives its last \u2014 press granted, the animal is spent.'); }
    else this.note('Trainbot: the Stray burns 1 life \u2014 press granted (' + st.life + ' left).');
    this.push();
    return true;
  }
  _strayUnlockBurn(vamp){            // N4d consumer B: burn the WHOLE ally to TRULY unlock a ready minion (the locked-blocker chain's third rung); requires fx.allyBurnUnlock
    if(!vamp || !vamp.locked) return false;
    const st = this.board.find(c => { if(!c || c.zone !== 'ready' || this._outOfPlay(c)) return false;
      const h = this.fxLookup(c.name); return h && h.kind === 'lib' && ((h.e.t) || []).includes('ally') && (h.e.modes || []).some(mo => mo.fx && mo.fx.allyBurnUnlock); });
    if(!st) return false;
    st.zone = 'burned';
    vamp.locked = false;
    this.push();
    this.note('Trainbot: the Stray is burned \u2014 ' + vamp.name + ' unlocks to meet the threat.');
    this._emit('stray-unlock', { vamp: vamp.name });
    return true;
  }
  _bestRecruitFor(vamp){             // N4d: an ally-type fx.recruitAlly card -- richest usable mode (ANI life 2 over ani life 1), pool guard
    if(!this.fx || !vamp) return null;
    for(let idx = 0; idx < this.hand.length; idx++){
      const h = this.fxLookup(this.hand[idx]); if(!h || h.kind !== 'lib' || !((h.e.t) || []).includes('ally')) continue;
      let best = null;
      (h.e.modes || []).forEach(mo => { if(!mo.fx || !mo.fx.recruitAlly || !this._modeUsableBy(mo, vamp)) return;
        if(!best || (mo.fx.allyLife | 0) > (best.fx.allyLife | 0)) best = mo; });
      if(!best) continue;
      const cB = (h.e.cost && h.e.cost.blood) | 0;   // v0.6.118c (Johan's ruling, 18 Sep): Underbridge Stray costs 1 BLOOD -- an [ani] ally the vampire pays for; the pool default applies only when the card names no blood cost
      const costP = cB ? ((h.e.cost && h.e.cost.pool) | 0) : (((h.e.cost && h.e.cost.pool) | 0) || 1);
      if(cB > (vamp.blood | 0)) continue;
      if(this.pool < costP + 1) continue;   // leave >= 1 pool
      return { idx, name: h.name, kind: 'recruit', life: best.fx.allyLife | 0, at: best.at, costPool: costP, costBlood: cB, st: 0, n: 1 };
    }
    return null;
  }
  _emitManifest(){                   // A2 (v0.6.73): deck intent + effective knobs
    const ds = (typeof DECK_STRATEGY !== 'undefined' && DECK_STRATEGY[this.o.deckName]) || {};
    const kn = {}; for(const k of ['rushBackWeight','rushFwdWeight','crossRushWeight','poolFloor','paceMs','askSecs','polOverBuild','permFirst','fitWeight','critRisk','homeWeight','stealthStack','lateBounce','bounceSpare']) if(this.o[k] !== undefined) kn[k] = this.o[k];
    this._emit('manifest', { seat: this.o.seat || null, deck: this.o.deckName || null, persona: this.o.persona, strategy: ds.strategy || null, axes: ds.axes || [], knobs: kn });   // v0.6.88: seat carried when the arena provides it -- the manifest is now self-describing for seat order
  }
  _deckAxes(){ const ds = (typeof DECK_STRATEGY !== 'undefined' && DECK_STRATEGY[this.o.deckName]) || {}; return ds.axes || []; }   // v0.6.107 (B1): the manifest's axes, finally read
  _posture(){                        // v0.6.107 (B1, doctrine section 2.2): disabling / grinding / resisting from the deck axes -- resisting when unknown (the conservative posture)
    const ax = this._deckAxes();
    if(ax.includes('menace') || ax.includes('rush-control')) return 'disabling';
    if(ax.includes('wall') || ax.includes('bounce') || ax.includes('attrition') || ax.includes('intercept')) return 'grinding';
    return 'resisting';
  }
  _deckAxis(){                       // v0.6.107 (B1, doctrine section 3.2): the multiplier on the UNDIRECTED block score -- the directed T1 path keeps 1.0 until B2 evaluates it in the arena
    const ax = this._deckAxes();
    if(ax.includes('bounce')) return 1.0;          // bounce-wall (tremere)
    if(ax.includes('wall')) return 1.3;
    if(ax.includes('menace')) return 1.15;
    if(ax.includes('swarm-bleed')) return 0.8;
    if(ax.includes('stealth-bleed')) return 0.7;
    return 1.0;
  }
  _threatClassOf(sub, info, actorSeat, role){   // v0.6.107 (B1, doctrine section 3.1): what resolves if I let this through -- read from cardfx fx keys and the actor's pub, never from card names
    const tpub = this.table[actorSeat] && this.table[actorSeat].pub;
    const cards = (tpub && tpub.cards) || [];
    const fxOf = nm => { const h = nm && this.fxLookup(nm); return (h && h.kind === 'lib') ? h.e : null; };
    const hasKey = (e, keys) => !!(e && (e.modes || []).some(mo => mo.fx && keys.some(k => mo.fx[k] !== undefined && mo.fx[k] !== false && mo.fx[k] !== 0)));
    if(sub === 'equip' || sub === 'fetch'){
      const e = fxOf(info.card);
      if(hasKey(e, ['intercept', 'wake'])) return { T: 'T2', note: info.card + ' grants intercept' };
      if(hasKey(e, ['strike', 'strengthBonus', 'envDmgPerRound', 'prevent', 'maneuver', 'press', 'stealBlood', 'dodge'])) return { T: 'T3', note: info.card + ' is a combat advantage' };
      return { T: 'T6', note: info.card + ': no threat key' };
    }
    if(sub === 'strength') return { T: 'T3', note: 'permanent strength' };
    if(sub === 'recruit') return { T: 'T4b', note: 'a minion enters ' + this.seatName(actorSeat) + "'s ready region" };
    if(sub === 'rescue') return { T: 'T4b', note: 'a vampire returns to ' + this.seatName(actorSeat) + "'s ready region" };   // v0.6.127: the same class as a recruit -- a body comes (back) into play
    if(sub === 'stock') return { T: 'T4', note: 'blood onto ' + this.seatName(actorSeat) + "'s uncontrolled" };
    if(sub === 'hunt'){
      const v = cards.find(c => c && c.kind === 'crypt' && c.name === info.vamp);
      const famed = !!(this._famedSeen && this._famedSeen[info.vamp]);
      if((v && (v.blood | 0) <= 0) || famed) return { T: 'T5', note: famed ? 'the famed vampire feeds' : 'a forced hunt at 0 blood' };
      return { T: 'T6', note: 'an ordinary hunt' };
    }
    if(sub === 'tabling'){
      const e = fxOf(info.card);
      if(role === 'prey' && hasKey(e, ['preyBurnPerCopy'])) return { T: 'T1', amount: 3, note: info.card + ' will drip my pool' };   // Creeping Sabotage-class: the PREY pays 1/turn -- weighed as a few turns' worth
      return { T: 'T6', note: info.card + ' tabled' };
    }
    if(sub === 'rush') return { T: 'T5', note: 'a rush at ' + (info.target || 'my vampire') };
    return { T: 'T6', note: sub };
  }
  _parseUndirected(who, t){          // v0.6.107 (B1): the L12.undirected family -> a reaction window for the actor's prey (first) and predator (second)
    if(!this.started || this.out) return false;
    let m, sub, info;
    if((m = t.match(L12.uHunt))){ sub = 'hunt'; info = { vamp: m[1] }; }
    else if((m = t.match(L12.uEquip))){ sub = 'equip'; info = { vamp: m[1], card: m[3], verb: m[2] }; }
    else if((m = t.match(L12.uRecruit))){ sub = 'recruit'; info = { vamp: m[1], card: m[2] }; }
    else if((m = t.match(L12.uStock))){ sub = 'stock'; info = { vamp: m[1], card: m[2], n: parseInt(m[3], 10) }; }
    else if((m = t.match(L12.uTabling))){ sub = 'tabling'; info = { vamp: m[1], card: m[2] }; }
    else if((m = t.match(L12.uFetch))){ sub = 'fetch'; info = { vamp: m[1], card: m[4], via: m[2] }; }
    else if((m = t.match(L12.uStrength))){ sub = 'strength'; info = { vamp: m[1], card: m[2] }; }
    else if((m = t.match(L12.uRescue))){ sub = 'rescue'; info = { vamp: m[1] }; }   // v0.6.127
    else if((m = t.match(L12.uLeave))){ sub = 'leave'; info = { vamp: m[1] }; }   // v0.6.128
    else return false;
    const actorSeat = this._seatOfName(who);
    if(!actorSeat || actorSeat === this.seat) return true;             // not a seated actor (or my own echo) -- parsed, no window
    const role = (this.nextLive(actorSeat) === this.seat) ? 'prey' : (this.prevLive(actorSeat) === this.seat) ? 'predator' : null;
    if(!role) return true;                                             // neither prey nor predator of the actor: no block rights
    if(this.pending) this._clearPending('superseded by ' + sub);
    const cls = this._threatClassOf(sub, info, actorSeat, role);
    const tpub = this.table[actorSeat] && this.table[actorSeat].pub;
    const actorUnlocked = ((tpub && tpub.cards) || []).filter(c => c && c.kind === 'crypt' && c.zone === 'ready' && !c.locked && c.name !== info.vamp).length;
    const preySeat = this.nextLive(actorSeat);
    const waitingFor = (role === 'predator' && preySeat !== this.seat && this.live(preySeat)) ? this.seatName(preySeat) : null;   // the prey answers first; a 2-live-player table collapses prey and predator onto me
    this.pending = { who, amount: cls.amount | 0, kind: 'undirected', sub, T: cls.T, role, actorSeat, actorUnlocked, actingVampName: info.vamp, contested: false, reacted: new Set(), blockerVamp: null, declined: false, attempted: new Set(), waitingFor, note: cls.note, card: info.card || null };
    this.o.log('undirected window: ' + sub + ' by ' + who + ' (' + cls.T + ', I am ' + role + (waitingFor ? ', waiting for ' + waitingFor : '') + ')');
    if(sub === 'leave') this.pending.declined = true;   // v0.6.128: a block here is no combat -- it is an offer to diablerise, which the bot never takes (debt 25c); Pass at once so the actor does not wait out the clock
    if(!waitingFor) this._reactWindow();
    return true;
  }
  _rushWindowOpens(who, rusherVamp, vc){   // v0.6.107 (B1): a Deep Song rush at MY vampire -- a directed action I may block with any unlocked minion; returns true when a window opened (comply follows my own Pass)
    if(!this.started || this.out) return false;
    const actorSeat = this._seatOfName(who); if(!actorSeat) return false;
    const unlocked = this.board.some(c => c && c.kind === 'crypt' && c.zone === 'ready' && !c.locked && c !== vc) || !!this._wakeCard();
    if(!unlocked) return false;                                        // nobody to block with -- comply as before
    if(this.pending) this._clearPending('superseded by rush');
    const role = (this.nextLive(actorSeat) === this.seat) ? 'prey' : (this.prevLive(actorSeat) === this.seat) ? 'predator' : 'cross';
    this.pending = { who, amount: 0, kind: 'rush', sub: 'rush', T: 'T5', role, actorSeat, actorUnlocked: 0, actingVampName: rusherVamp, rushTarget: vc.name, contested: false, reacted: new Set(), blockerVamp: null, declined: false, attempted: new Set(), waitingFor: null, famedTarget: !!(this._famedMine && this._famedMine.has(vc.name)) };
    this._reactWindow();
    return true;
  }
  _complyRush(p){                     // v0.6.107 (B1): the rushed vampire locks and fights the rusher (the pre-B1 comply, now on MY Pass)
    const vc = this.board.find(c => c && c.kind === 'crypt' && c.zone === 'ready' && c.name === p.rushTarget);
    if(!vc) return;
    vc.locked = true; this.push();
    this.note('Trainbot: ' + vc.name + ' locks and defends (Deep Song rush).');
    this._emit('rushed', { vamp: vc.name, by: p.actingVampName });
    this._clearCombatStashes(); this._combatArmed = true;
    this._resolveCombat(vc, p.actingVampName).catch(e => this.o.log('rush defend error:', e.message));
  }
  _emitSnapshot(tag){                // A2 (v0.6.73): my sanitized view at a decision boundary -- the facit is the UNION across bots, assembled by the dossier, never here
    try{
      const ready = [], torpor = [];
      for(const c of this.board){ if(!c || c.kind !== 'crypt') continue;
        const e2 = { n: c.name, b: c.blood | 0, l: !!c.locked };
        const att = (c.attached || []).map(a2 => a2 && (a2.name || a2)).filter(Boolean);
        if(att.length) e2.att = att;
        if(c.zone === 'ready') ready.push(e2); else if(c.zone === 'torpor') torpor.push(e2); }
      const pubs = {};
      for(const [seat, tb] of Object.entries(this.table || {})){
        if(+seat === this.seat || !tb || !tb.pub) continue;
        const cs = tb.pub.cards || [];
        pubs[seat] = { pool: tb.pub.pool, ready: cs.filter(c => c && c.kind === 'crypt' && c.zone === 'ready').length, torpor: cs.filter(c => c && c.kind === 'crypt' && c.zone === 'torpor').length }; }
      const threat = { predPressure: this._predPressureLast | 0, famedSeen: Object.keys(this._famedSeen || {}), tblk: { a: this._tableBlockAttempts | 0, r: +this._tableBlockRate().toFixed(2) } };   // v0.6.93: the table block climate in every snapshot -- dossier-measurable
      try{ threat.tPred = +this._tableThreat(this.predSeat()).toFixed(1); threat.tPrey = +this._tableThreat(this.preySeat()).toFixed(1); }catch(e2){}
      this._emit('snapshot', { tag, turn: this.ownTurns | 0, pool: this.pool, edge: !!this.edge, handN: this.hand.length, unc: (this.unc || []).length, ready, torpor, pubs, threat });
    }catch(e){ this.o.log('snapshot emit error:', e.message); }
  }
  _emitPlay(card, window, vampName){ this._emit('play', { card, window, vamp: vampName || null }); }   // A2: invisible card-spends get names (bounce-card + combat = A2b)
  _pickRaise(cands){                 // v0.6.75 (the influence planner): scored raise pick -- Johan's opening-book design
    if(!cands || !cands.length) return null;
    const readyV = this.board.filter(c => c && c.kind === 'crypt' && c.zone === 'ready');
    const zeroReady = readyV.length === 0;
    const REACT_KEYS = ['bounce', 'reduce', 'wake', 'intercept', 'unlock'];   // v0.6.75-fix2: the key is 'unlock' (Cats' Guidance truth), not unlockReact
    const scored = cands.map(c => {
      let supFit = 0, reactFit = 0;
      for(const nm of this.hand){
        const h = this.fxLookup(nm); if(!h || h.kind !== 'lib') continue;
        let reactMe = false;
        for(const mo of (h.e.modes || [])){
          if(!mo.fx) continue;
          const me = this._modeUsableBy(mo, c);
          if(me && REACT_KEYS.some(k => mo.fx[k])) reactMe = true;
          if(!mo.at || !me) continue;   // v0.6.75-fix2: PER-MODE accounting on DISCIPLINE-GATED modes only -- card-level fitsMe let Wauneka tie Horace via the universal-usable bleed mode (67a taught both lessons)
          if(!readyV.some(r => this._modeUsableBy(mo, r))) supFit++;
        }
        if(zeroReady && reactMe) reactFit++;
      }
      supFit = Math.min(2, supFit);
      reactFit = Math.min(1.5, 0.5 * reactFit);
      const need = Math.max(0, (c.cap | 0) - (c.blood | 0));
      const roundsExtra = need <= this.inf ? 0 : Math.ceil((need - this.inf) / 4);
      const tempo = roundsExtra === 0 ? 1.2 : -0.6 * roundsExtra;
      const score = supFit + reactFit + tempo - 0.05 * (c.cap | 0);
      return { c, score, parts: { supFit, reactFit, tempo, roundsExtra, cap: c.cap | 0 } };
    }).sort((a, b) => (b.score - a.score) || (a.c.cap - b.c.cap));
    if(this._infPickTurn !== this.ownTurns){   // v0.6.76: one reasoning emit per own turn -- loop iterations re-call this, the trace should not stutter
      this._infPickTurn = this.ownTurns;
      this._emit('influence-pick', { picked: scored[0].c.name, considered: scored.slice(0, 3).map(x => ({ name: x.c.name, score: +x.score.toFixed(2), ...x.parts })) });
    }
    return scored[0].c;
  }
  /* ---- influence planner v2 (Johan, 12 Sep 2026): multi-vampire transfer
     allocation. Simulates fill-orderings over the known transfer schedule
     and scores by tempo (first rise turn), efficiency (wasted transfers),
     and synergy (supFit/reactFit from hand cards). Replaces _pickRaise as
     the _influenceLoop's pick function; _pickRaise is kept for direct test
     compatibility and as the synergy scorer's foundation. ---- */
  _influenceSchedule(horizon){
    const nP = Math.max(1, (this.players || []).length);
    const baseInf = (this.phaseActs && this.phaseActs.influence) || 4;
    const sched = [this.inf];   // slot 0 = remaining transfers THIS turn
    for(let ot = this.ownTurns + 1; ot <= this.ownTurns + horizon; ot++){
      const tt = (ot - 1) * nP + this.seat;
      sched.push(tt <= 4 ? Math.min(baseInf, tt) : baseInf);
    }
    return sched;
  }
  _influenceSynergy(c){
    const readyV = this.board.filter(v => v && v.kind === 'crypt' && v.zone === 'ready');
    const zeroReady = readyV.length === 0;
    const REACT_KEYS = ['bounce', 'reduce', 'wake', 'intercept', 'unlock'];
    let supFit = 0, reactFit = 0;
    for(const nm of this.hand){
      const h = this.fxLookup(nm); if(!h || h.kind !== 'lib') continue;
      let reactMe = false;
      for(const mo of (h.e.modes || [])){
        if(!mo.fx) continue;
        const me = this._modeUsableBy(mo, c);
        if(me && REACT_KEYS.some(k => mo.fx[k])) reactMe = true;
        if(!mo.at || !me) continue;
        if(!readyV.some(r => this._modeUsableBy(mo, r))) supFit++;
      }
      if(zeroReady && reactMe) reactFit++;
    }
    return Math.min(2, supFit) + Math.min(1.5, 0.5 * reactFit);
  }
  _simInfluence(ordering, schedule, startPool, poolFloor, cryptN){
    const rises = [];
    let waste = 0, draws = 0, cursor = 0, simPool = startPool;
    const bloods = ordering.map(c => c.blood | 0);
    const caps   = ordering.map(c => c.cap | 0);
    const cn = (typeof cryptN === 'number') ? cryptN : 99;   // assume crypt available when unknown
    for(let t = 0; t < schedule.length; t++){
      let xfers = schedule[t];
      while(xfers > 0 && cursor < ordering.length){
        const need = caps[cursor] - bloods[cursor];
        const canSpend = Math.min(xfers, need, Math.max(0, simPool - poolFloor));
        if(canSpend <= 0) break;
        xfers -= canSpend; simPool -= canSpend;
        bloods[cursor] += canSpend;
        if(bloods[cursor] >= caps[cursor]){ rises.push({ name: ordering[cursor].name, turn: t }); cursor++; }
      }
      /* surplus transfers after all candidates are filled (or pool-floored):
         spend on crypt draws (4 transfers + 1 pool each) — pipeline for
         future vampires, NOT waste. Essential for weenie decks where a
         constant flow of minions keeps pressure up. */
      while(xfers >= 4 && simPool - 1 >= poolFloor && draws < cn){
        xfers -= 4; simPool -= 1; draws++;
      }
      waste += xfers;
    }
    return { rises, waste, draws };
  }
  _scorePlan(plan, schedule, synScore){
    const firstRise  = plan.rises[0] ? plan.rises[0].turn : 99;
    const secondRise = plan.rises[1] ? plan.rises[1].turn : 99;
    const tempoScore = (7 - firstRise) * 3.0 + (7 - secondRise) * 1.0;
    const totalAvail = schedule.reduce((a, b) => a + b, 0) || 1;
    const effScore   = (totalAvail - plan.waste) / totalAvail;
    return tempoScore + effScore * 2.0 + (synScore || 0) * 1.5;
  }
  _genOrderings(cands){
    if(cands.length <= 4){
      // full permutations — at most 24
      const perms = [];
      const perm = (arr, cur) => {
        if(!arr.length){ perms.push(cur.slice()); return; }
        for(let i = 0; i < arr.length; i++){
          cur.push(arr[i]);
          perm(arr.slice(0, i).concat(arr.slice(i + 1)), cur);
          cur.pop();
        }
      };
      perm(cands, []);
      return perms;
    }
    // 5+ candidates: pruned top-12
    const bySyn = cands.slice().sort((a, b) => this._influenceSynergy(b) - this._influenceSynergy(a));
    const byCap = cands.slice().sort((a, b) => (a.cap | 0) - (b.cap | 0));
    const byNeed = cands.slice().sort((a, b) => ((a.cap | 0) - (a.blood | 0)) - ((b.cap | 0) - (b.blood | 0)));
    const seen = new Set();
    const out = [];
    const add = ord => { const key = ord.map(c => c.id).join(','); if(!seen.has(key)){ seen.add(key); out.push(ord); } };
    add(byCap); add(bySyn); add(byNeed);
    add(byCap.slice().reverse()); add(bySyn.slice().reverse());
    // try each top-3 synergy candidate as first position
    for(let i = 0; i < Math.min(3, bySyn.length) && out.length < 12; i++){
      const first = bySyn[i];
      const rest = byCap.filter(c => c !== first);
      add([first, ...rest]);
    }
    return out.slice(0, 12);
  }
  _deckFit(c){                       // v0.6.135 (general layer, every deck): how much of MY LIBRARY can this vampire play? Per discipline-gated library card: 1 when a SUPERIOR mode is usable, 0.5 when only an inferior one, 0 when none -- weighted by copies. Deck-agnostic: nosferatu's list ranks Horace Radcliffe 0.95, the [ANI] primogens 0.80-0.84, Ryan 0.50, Baixinho 0.34 -- its Black Chantry helpsheet's opening, with no discipline named here.
    if(!c || !this.fx) return 0; this._fitCache = this._fitCache || {}; if(this._fitCache[c.name] != null) return this._fitCache[c.name];
    let fit = 0, N = 0;
    ((this.deck && this.deck.library) || []).forEach(e => { const h = this.fxLookup(e.name || e); if(!h || h.kind !== 'lib') return;
      const modes = (h.e.modes || []).filter(mo => mo && mo.at); if(!modes.length) return; const q = e.qty || 1; N += q; let best = 0;
      modes.forEach(mo => { if(!this._modeUsableBy(mo, c)) return; const sup = String(mo.at) === String(mo.at).toUpperCase(); best = Math.max(best, sup ? 1 : 0.5); });
      fit += best * q; });
    return (this._fitCache[c.name] = N ? +(fit / N).toFixed(3) : 0);
  }
  _planInfluence(cands){
    if(!cands || !cands.length) return null;
    if(cands.length === 1){
      if(this._infPickTurn !== this.ownTurns){
        this._infPickTurn = this.ownTurns;
        this._emit('influence-plan', { picked: cands[0].name, reason: 'single-candidate' });
      }
      return cands[0];
    }
    const horizon = 6;
    const schedule = this._influenceSchedule(horizon);
    const zeroReady = !this.board.some(c => c.kind === 'crypt' && c.zone === 'ready');
    const poolFloor = zeroReady ? 1 : this._poolFloorEff();   // v0.6.119: same floor as the loop that spends it
    const orderings = this._genOrderings(cands);

    let best = null;
    for(const ord of orderings){
      const plan = this._simInfluence(ord, schedule, this.pool, poolFloor, this.cryptN);
      const synScore = this._influenceSynergy(ord[0]);
      const fitW = this.o.fitWeight == null ? 8 : +this.o.fitWeight;   // v0.6.135: 0.4 of fit outweighs ONE turn of tempo (3.0), not two -- my judgment, knob fitWeight (0 = the old planner)
      const fitScore = fitW ? fitW * (this._deckFit(ord[0]) + 0.5 * (ord[1] ? this._deckFit(ord[1]) : 0)) : 0;
      const score = this._scorePlan(plan, schedule, synScore) + fitScore;
      if(!best || score > best.score){
        best = { ordering: ord, plan, score, synScore,
                 parts: { firstRise: plan.rises[0] ? plan.rises[0].turn : 99,
                          secondRise: plan.rises[1] ? plan.rises[1].turn : 99,
                          waste: plan.waste, draws: plan.draws, synScore: +synScore.toFixed(2), fit: this._deckFit(ord[0]), fit2: ord[1] ? this._deckFit(ord[1]) : null, fitScore: +fitScore.toFixed(2) } };
      }
    }
    if(this._infPickTurn !== this.ownTurns){
      this._infPickTurn = this.ownTurns;
      this._emit('influence-plan', {
        picked: best.ordering[0].name,
        score: +best.score.toFixed(2),
        schedule: schedule.slice(0, 4),
        order: best.ordering.slice(0, 3).map(c => c.name),
        rises: best.plan.rises.slice(0, 3),
        parts: best.parts,
        considered: orderings.length
      });
    }
    return best.ordering[0];
  }
  _rushExpectation(vamp){            // v0.6.74 (Johan's design): expected combat outcome -- the rush scorer's ground truth
    let expDmg = 1 + this._strengthBonus(vamp);   // bare hand + attached (Preternatural class)
    let nCombat = 0;
    for(const nm of this.hand){
      const h = this.fxLookup(nm); if(!h || h.kind !== 'lib') continue;
      let combaty = false;
      for(const mo of (h.e.modes || [])){
        if(!mo.fx) continue;
        const f = mo.fx;
        if(f.strike && this._modeUsableBy(mo, vamp)){ combaty = true; if((f.strike | 0) > expDmg) expDmg = f.strike | 0; }
        if(f.restrictHandStrike || f.press || f.dodge){ if(this._modeUsableBy(mo, vamp)) combaty = true; }
      }
      if(combaty) nCombat++;
    }
    /* v0.6.133 (general combat): damage that lands BESIDE the strike -- the borne crows (Murder of Crows-class, every combat) and a
       Carrion Crows in hand (this combat). serie-perm1 built the permanents and the rush could not see them. */
    const envBorne = this._borneEnvFor(vamp) | 0; const cc = this._bestCarrionCrowsFor(vamp); const envHand = cc ? (cc.n | 0) || 1 : 0;
    if(cc) nCombat++;
    expDmg += envBorne + envHand;
    return { expDmg, nCombat, env: envBorne + envHand };
  }
  _rushCapableNow(){                 // v2 (#7): a usable rush card in hand + ANY ready vampire of mine that can play it superior -- the re-torpor is the yo-yo's whole point
    for(let idx = 0; idx < this.hand.length; idx++){
      const h = this.fxLookup(this.hand[idx]); if(!h || h.kind !== 'lib') continue;
      for(const mo of (h.e.modes || [])){
        if(!mo.fx || !mo.fx.rush) continue;
        if(this.board.some(v => v && v.kind === 'crypt' && v.zone === 'ready' && this._modeUsableBy(mo, v))) return true;
      }
    }
    return false;
  }
  _bestOwnRescueFor(vamp){           // v0.6.127: the basic action the bot never had -- a ready vampire rescues one of MINE from torpor (rulebook: undirected, 0 stealth, 2 blood paid by the rescuer and / or the rescued, in any split). Until now a torpored vampire stayed down for the rest of the game unless Warsaw Station or the Chantry brought it back.
    if(!vamp) return null;
    const torp = (this.board || []).filter(c => c && c.kind === 'crypt' && c.zone === 'torpor' && !(!c.locked && (c.blood | 0) >= 2)); if(!torp.length) return null;   // v0.6.128: an unlocked vampire with 2 blood leaves torpor on its OWN action -- no ready body is spent on it
    const capOf = c => { const k = this.fxCryptCap(c.name); return typeof k === 'number' ? k : 0; };
    const T = torp.slice().sort((a, b) => (capOf(b) - capOf(a)) || ((b.blood | 0) - (a.blood | 0)))[0];
    const tb = T.blood | 0, vb = vamp.blood | 0; if(tb + vb < 3) return null;        // 2 to pay + 1 left on my actor
    let tPays = 0, mine = 0;
    for(let i = 0; i < 2; i++){ if(tb - tPays > 0 && (tb - tPays >= vb - mine || vb - mine <= 1)) tPays++; else mine++; }   // the richer body pays, the rescuer keeps >= 1
    if(vb - mine < 1) return null;
    return { kind: 'ownRescue', target: T, who: T.name, cap: capOf(T), tPays, mine, st: 0, n: 0 };
  }
  async _leaveTorpor(v){             // v0.6.128: the torpored vampire's own action -- +1 stealth, undirected, 2 blood on success. Blocked = the action fails, NO combat (a vampire blocker may diablerise; that is the table's call)
    if(!v || v.zone !== 'torpor' || v.locked || (v.blood | 0) < 2) return false;
    v.locked = true; this._actingVamp = { v, n: 0, played: new Set(), kind: 'leaveTorpor', target: null }; this.push();
    this.fxClone(v, 'leaves torpor');
    this._announceTallyA(1);
    this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> attempts to leave torpor.' });
    const ans = await this._askBlock('Trainbot: ' + v.name + ' attempts to leave torpor (+1 stealth). Block?');
    await sleep(150);
    if(ans.what === 'block'){
      this.note('Blocked' + (ans.who ? ' by ' + ans.who : '') + ' \u2014 ' + v.name + ' stays in torpor. No combat: a blocking vampire may diablerise instead.');
      this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: 0, kind: 'leaveTorpor', by: this._lastBlockerName || ans.who || null });
      this.say('It resolves');
    } else {
      v.blood = Math.max(0, (v.blood | 0) - 2); v.zone = 'ready'; const rp = this._openSlot('ready', v); v.x = rp.x; v.y = rp.y;
      this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: 0, kind: 'leaveTorpor' });
      this._emit('recover', { vamp: v.name, via: 'leaveTorpor', paid: 2 });
      this.say('It resolves');
      this.note(v.name + ' leaves torpor (pays 2 blood) \u2014 ready again.');
      this.push();
    }
    this._lastAct = null;                                                            // never an act-again trigger
    this._actingVamp = null; this._flushDraws();
    return true;
  }
  _votesDominant(){                  // my title votes beat every other seat's put together: a blood hunt on whoever diablerises my torpored vampire is mine to pass
    let others = 0; (this.players || []).forEach(pl => { if(pl.seat !== this.seat && this.live(pl.seat)) others += this._seatTitleVotes(pl.seat); });
    const mine = this._myTitleVotes().n; return mine > 0 && mine > others;
  }
  _selfPriceMitigation(v, c){        // Johan, 18 Sep: Daring the Dawn must be MITIGABLE or clearly worth it. What gets this vampire out of torpor again, read before the card is played
    const extra = c.selfTorpor ? 0 : Math.max(0, (c.selfDmg | 0) - 1);                // aggravated beyond the first point: 1 blood each
    const after = (v.blood | 0) - (c.cost | 0) - extra;
    if(after < 0) return { survives: false, after, selfExit: null, rescuer: null, votes: false };
    const fd = this._bestActAgainFor(v, 'through');
    const selfExit = (fd && after - (fd.cost | 0) >= 2) ? fd.name : null;             // Freak Drive-class unlocks it in torpor, 2 blood walk it out
    const other = (this.board || []).find(x => x && x !== v && x.kind === 'crypt' && x.zone === 'ready' && (x.blood | 0) >= 1 && (x.blood | 0) + after >= 3);
    return { survives: true, after, selfExit, rescuer: other ? other.name : null, votes: this._votesDominant() };
  }
  _onGiven(m){                       // v0.6.128 (debt 21b): recreate the card with the SAME id (`gid`) so both sides reference one object; it is mine to control from here on (the pub diff shows it). Troublemaker, a human's Pentex or Fame, a handed-over equipment.
    if(!this.started || this.out || !m || !m.name) return;
    let id = m.gid || this.gid(); const clash = (this.board || []).find(c => c && c.id === id);
    if(clash && clash.name === m.name) return;                                       // the same card told twice
    if(clash) id = this.gid();                                                       // v0.6.130 (debt 26a, FOUND): a master played by the bot is born with a SEAT-LOCAL id ('m3') -- the receiver had its own 'm3', and the v0.6.128 guard dropped the gift silently
    const card = { id, name: m.name, kind: m.kind === 'crypt' ? 'crypt' : 'lib', zone: 'ready', faceDown: !!m.faceDown, locked: !!m.locked, x: 64, y: 64, owner: m.owner || m.from || null, givenBy: m.from || null };
    if(card.kind === 'crypt') card.blood = m.blood | 0;
    if(m.attachTo) card.attachTo = m.attachTo;
    if(m.attachTo){ const hg = [m.name, m.name.replace(/\u2122/g, '(TM)')].map(nm => this.fxLookup(nm)).find(h => h && h.kind === 'lib' && (h.e.modes || []).some(mo => mo.fx && Object.keys(mo.fx).length)) || this.fxLookup(m.name), host =   /* the curated Pentex entry is keyed '(TM)', the client's card is named with the trademark sign -- debt 26e */ (this.board || []).find(x => x && x.kind === 'crypt' && x.id === m.attachTo) || (this.board || []).find(x => x && x.kind === 'crypt' && x.name === m.attachTo);   /* v0.6.151 (main's B1, 21 Sep): the wire carries the HOST'S CARD ID -- the client sends `targetEl.dataset.cid` (= the id in my own pub), the server and the bridge relay it untouched. v0.6.129 matched a NAME, so a human's Fame / Pentex on my vampire never armed _famedMine / _pentexVamp, online or offline (bot-to-bot gives send no attachTo, so the arena never saw it). Id first; the name stays as the fallback. */   // v0.6.129: a card dropped ON my vampire arms the same hooks its log line would have (a human's drop sends no such line)
      if(host && hg && hg.kind === 'lib'){ const has = k => (hg.e.modes || []).some(mo => mo.fx && mo.fx[k]);
        if(has('fameOnTarget')){ (this._famedMine = this._famedMine || new Set()).add(host.name); (this._famedSeen = this._famedSeen || {})[host.name] = true; }
        if(has('noBlockMinion')) this._pentexVamp = host.name; } }
    this.board.push(card); this.push();
    this.o.log('given: ' + m.name + ' from ' + (m.from || '?') + (m.attachTo ? ' (on ' + m.attachTo + ')' : ''));
    this._emit('given', { card: m.name, from: m.from || null, attachTo: m.attachTo || null });
  }
  _maybeGiveLock(){                  // v0.6.128: Anarch Troublemaker-class (fx.preyLock + fx.giveToPrey, unlock phase): hand the card to my prey and lock up to n of its vampires -- the unlocked ones at MY unlock are exactly the blockers it kept home. v0: fire when the lock takes EVERY unlocked prey vampire or the full n, and I have a vampire to act with. The equipment-burn alternative is not built.
    if(!this.started || this.out) return false;
    const c = (this.board || []).find(x => { if(!x || x.kind === 'crypt' || x.faceDown || x.zone === 'ash') return false; const h = this.fxLookup(x.name); return !!(h && h.kind === 'lib' && (h.e.modes || []).some(mo => mo.fx && mo.fx.preyLock && mo.fx.giveToPrey)); });
    if(!c) return false;
    const h = this.fxLookup(c.name), mo = h.e.modes.find(x => x.fx && x.fx.preyLock), n = mo.fx.preyLock | 0;
    const prey = this.preySeat(); if(!prey || prey === this.seat || !this.live(prey)) return false;
    const mineReady = (this.board || []).filter(x => x.kind === 'crypt' && x.zone === 'ready').length;
    const cap = x => { const k = this.fxCryptCap(x.name); return typeof k === 'number' ? k : (x.cap | 0); };
    const open = this._seatCards(prey).filter(x => x && x.kind === 'crypt' && x.zone === 'ready' && !x.locked && x.name && !x.faceDown).sort((a, b) => cap(b) - cap(a));
    const d = this.decide('give-lock', { card: c.name, n, open: open.length, mineReady });
    this.o.log('give-lock: ' + d.why);
    if(!d.play) return false;
    const targets = open.slice(0, n), preyN = this.seatName(prey);
    const i = this.board.indexOf(c); if(i >= 0) this.board.splice(i, 1);
    if(!/^bot/.test(String(c.id))) c.id = this.gid();                                  // v0.6.130: never give away a seat-local id -- a table-unique gid travels with the card
    this.send({ t: 'give', seat: prey, gid: c.id, rx: 0.5, ry: 0.5, card: { name: c.name, kind: 'lib', faceDown: false, locked: false, owner: c.owner || this.o.name } });
    this.push();
    this.fxClone({ name: c.name, kind: 'lib' }, 'to ' + preyN + ' \u2014 locks ' + targets.length);
    targets.forEach(x => this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> plays <b>' + esc(c.name) + '</b> \u2014 locks ' + esc(preyN) + "'s <b>" + esc(x.name) + '</b>.' }));   // the L12.lockM family: the named owner complies
    this.chat(preyN + ': ' + c.name + ' is yours now \u2014 lock ' + targets.map(x => x.name).join(' and ') + '.');
    this._emit('give-lock', { card: c.name, to: preyN, locked: targets.map(x => x.name) });
    return true;
  }
  /* v0.6.129 (Johan, 18 Sep + rulebook 'Minion phase'): a minion performs at most ONE bleed action and ONE political action each turn, and
     never the same NAMED action card twice (Govern [dom] then Govern [DOM] is illegal), even if it unlocks. The bot had no such ledger:
     every Freak Drive re-bleed since v0.6.123 was an illegal action. */
  _noteTurnAct(v, act){ const s = (this._turnActs = this._turnActs || {})[v.id] = (this._turnActs[v.id] || new Set());
    if(!act.kind || act.kind === 'bleed') s.add('bleed'); if(act.kind === 'political') s.add('political');
    if(act.name && typeof act.idx === 'number') s.add('card:' + FX_NORM(act.name)); }
  _decideAction(v, ctx){
    const done = this._turnActs && this._turnActs[v.id];
    if(done && done.size){
      Object.keys(ctx).forEach(k => { const c = ctx[k]; if(c && typeof c === 'object' && c.name && typeof c.idx === 'number' && done.has('card:' + FX_NORM(c.name))) ctx[k] = null; });
      if(done.has('political')) ctx.pol = null;
      if(done.has('bleed')){ ctx.card = null; ctx.plain = { n: 0, illegal: true }; }
    }
    if(this._probe && v.id !== this._probe.puncherId && ctx.card && (ctx.card.n | 0) >= 2 && this.board.some(c => c && c.id === this._probe.puncherId && c.zone === 'ready' && !c.locked)){   // v0.6.143: a prober bleeds small -- the heavy card waits for the puncher
      ctx.cardReserved = ctx.card.name; ctx.card = null; }
    if(this.o.stealthStack !== 0 && ctx.card && (ctx.card.n | 0) >= 2 && !(ctx.card.st | 0)){   // v0.6.143 HOLD THE GOVERN (Johan): a heavy bleed with NO stealth in hand into a prey with a body up is a card thrown at a blocker -- a weight, not a ban ('room to hold back')
      const up = this._preyUnlockedN(), stk = this._stealthStack(v, new Set());
      if(up > 0 && stk.S === 0){ const pT = this._pBleedThrough(); const w = +Math.max(0.4, Math.min(1, pT / 0.7)).toFixed(2);   // v0.6.143b: the weight IS the statistic -- at the prior (0.7 through) nothing is held, at 0.3 through the card is worth x0.43
        if(w < 1) ctx.holdBleed = { up, w, why: 'no stealth in hand, my prey has ' + up + ' unlocked ' + (up === 1 ? 'body' : 'bodies') + ' and lets ' + Math.round(pT * 100) + ' % of my bleeds through' }; }
    }
    const choice = this.decide('action', ctx);
    if(choice.pick && choice.pick.illegal) return { pick: null, why: 'already bled this turn and nothing else worth doing \u2014 stays home (one bleed per minion per turn)' };
    return choice;
  }
  oppIntercept(seat){                // v0.6.129: the intercept this seat has actually shown per block attempt, blended with a 0.5 prior (weight 2) -- public lines only
    const o = this._opp(seat); return (0.5 * 2 + (o.icpSum | 0)) / (2 + (o.blockTries | 0)); }
  _maybeBlockBarRef(v, act){         // v0.6.129 (Johan): Daring the Dawn on a REFERENDUM that takes 3+ from my prey -- when the prey can really block it (average intercept ~1 and an unlocked body) or it ousts; the same mitigable-or-worth-it rule on top; never on a long shot
    const c = this._bestBlockBarFor(v); if(!c) return false;
    const prey = this.preySeat(), hit = Math.max(0, -((act.deltas || {})[prey] | 0));
    const un = st => this._seatCards(st).filter(x => x && x.kind === 'crypt' && x.zone === 'ready' && !x.locked).length;
    const blockers = un(prey) + (this.predSeat() !== prey ? un(this.predSeat()) : 0);
    const d = this.decide('block-bar', { vamp: v, card: c, n: hit, potential: hit, preyPool: this._seatPool(prey), blockers, mit: this._selfPriceMitigation(v, c), ref: true, avgIcp: this.oppIntercept(prey), pass: act.pass });
    this.o.log('block-bar (' + v.name + ', referendum): ' + d.why);
    if(!d.play) return false;
    const j = this.hand.indexOf(c.name); if(j < 0) return false;
    this.hand.splice(j, 1); this._drawOwed = (this._drawOwed || 0) + 1; this._toAsh(c.name);
    if(c.cost) v.blood = Math.max(0, (v.blood | 0) - c.cost);
    this._actingVamp.played.add(FX_NORM(c.name)); this._actingVamp.selfPrice = c; this.push();
    this.fxClone({ name: c.name, kind: 'lib' }, (c.at ? '[' + c.at + '] ' : '') + 'vampires cannot block', { actor: v });
    this.send({ t: 'log', html: '<b>' + esc(c.name) + '</b> \u2014 vampires cannot block this action.' });
    this._emitPlay(c.name, 'block-bar', v.name);
    this._emit('block-bar', { vamp: v.name, card: c.name, n: hit, preyPool: this._seatPool(prey), blockers, ref: act.name, why: d.tag || null });
    return true;
  }
  /* v0.6.130 (rulebook 'Resolve the action' + Johan, 18 Sep -- debt 1 / 26c): the ACTION's own cost is paid only when the action succeeds;
     modifiers and reactions are paid as played. The bot keeps taking the cost off at the announce -- that IS the parked blood a human sets
     aside so a modifier cannot spend what the action still needs -- and gives it back the moment the action is blocked, BEFORE the combat,
     in every branch (only the referendum did, since v0.6.126). The Edge burned as a cost is not restored (latent: Inside Dirt). */
  _park(blood, pool){ const a = this._actingVamp; if(!a) return; a.parked = a.parked || { blood: 0, pool: 0 }; a.parked.blood += blood | 0; a.parked.pool += pool | 0; }
  _returnParked(){ const a = this._actingVamp, pk = a && a.parked; if(!pk || !(pk.blood || pk.pool)) return; a.parked = null;
    const v = a.v; if(pk.blood && v){ const cap = this.fxCryptCap(v.name); v.blood = Math.min(typeof cap === 'number' ? cap : 99, (v.blood | 0) + pk.blood); }
    if(pk.pool) this.pool = (this.pool | 0) + pk.pool;
    this.push(); this._emit('cost-returned', { blood: pk.blood, pool: pk.pool }); }
  _bestBlockBarFor(vamp){            // v0.6.127 (cardfx v1.9.0, fx.blockBar): Daring the Dawn-class -- an action modifier that bars VAMPIRES from blocking this action and bills its own vampire afterwards (selfDmg / selfTorpor). v0 keeps to the self-price members: a free bar (Beast Meld [ANI][PRO]) carries a 'non-bleed only' condition the data does not read yet. The cheapest price wins (the superior mode).
    let best = null;
    (this.hand || []).forEach((nm, idx) => { const h = this.fxLookup(nm); if(!h || h.kind !== 'lib' || (h.e.t || []).indexOf('mod') < 0) return;
      const cost = (h.e.cost && h.e.cost.blood) | 0; if(cost > (vamp.blood | 0)) return;
      (h.e.modes || []).forEach(mo => { if(!mo.fx || (mo.fx.blockBar !== 'vampires' && mo.fx.blockBar !== 'all') || !(mo.fx.selfDmg || mo.fx.selfTorpor) || !this._modeUsableBy(mo, vamp, { selfPrice: true })) return;
        const price = mo.fx.selfTorpor ? 1.5 : (mo.fx.selfDmg | 0);
        if(!best || price < best.price) best = { idx, name: h.name, at: mo.at || '', bar: mo.fx.blockBar, selfDmg: mo.fx.selfDmg | 0, selfAggr: !!mo.fx.selfAggr, selfTorpor: !!mo.fx.selfTorpor, cost, price }; }); });
    return best;
  }
  _maybeBlockBar(v, act, prey){      // BEFORE the announce (the terms-line precedent): every seat must know the bar when its window opens
    const c = this._bestBlockBarFor(v); if(!c) return false;
    const mod = this._bestBleedModifierFor(v, new Set([FX_NORM(c.name)]), false);
    const tpub = this.table[prey] && this.table[prey].pub;
    const blockers = ((tpub && tpub.cards) || []).filter(x => x && x.kind === 'crypt' && x.zone === 'ready' && !x.locked).length;
    const d = this.decide('block-bar', { vamp: v, card: c, n: act.n | 0, potential: (act.n | 0) + (mod ? mod.n | 0 : 0), preyPool: this._seatPool(prey), blockers, mit: this._selfPriceMitigation(v, c) });
    this.o.log('block-bar (' + v.name + '): ' + d.why);
    if(!d.play) return false;
    const j = this.hand.indexOf(c.name); if(j < 0) return false;
    this.hand.splice(j, 1); this._drawOwed = (this._drawOwed || 0) + 1; this._toAsh(c.name);
    if(c.cost) v.blood = Math.max(0, (v.blood | 0) - c.cost);
    this._actingVamp.played.add(FX_NORM(c.name)); this._actingVamp.selfPrice = c; this.push();
    this.fxClone({ name: c.name, kind: 'lib' }, (c.at ? '[' + c.at + '] ' : '') + 'vampires cannot block', { actor: v });
    this.send({ t: 'log', html: '<b>' + esc(c.name) + '</b> \u2014 vampires cannot block this action.' });   // L12.blockBar, bot grammar
    this._emitPlay(c.name, 'block-bar', v.name);
    this._emit('block-bar', { vamp: v.name, card: c.name, n: act.n | 0, preyPool: this._seatPool(prey), blockers, selfDmg: c.selfDmg, selfTorpor: c.selfTorpor, why: d.tag || null });
    return true;
  }
  _settleSelfPrice(v){               // after action resolution, blocked or not: the vampire pays what its own card billed. Aggravated (rulebook): the first point sends a ready vampire to torpor; every further point on a wounded vampire burns 1 blood -- or the vampire, when it has none.
    const sp = this._actingVamp && this._actingVamp.selfPrice; if(!sp || !v) return;
    this._actingVamp.selfPrice = null;
    if(this.out || v.zone === 'burned' || v.zone === 'ash') return;
    const down = () => { v.zone = 'torpor'; const tp = this._openSlot('torpor', v); v.x = tp.x; v.y = tp.y; this._fameTorporHook(v); };
    let said = [];
    if(sp.selfTorpor){ if(v.zone === 'ready'){ down(); said.push('goes to torpor'); } }
    else for(let i = 0; i < (sp.selfDmg | 0); i++){
      if(sp.selfAggr){
        if(v.zone === 'ready'){ down(); said.push('goes to torpor'); }
        else if((v.blood | 0) > 0){ v.blood = (v.blood | 0) - 1; said.push('burns 1 blood'); }
        else { v.zone = 'burned'; said.push('is burned'); break; }
      } else if((v.blood | 0) > 0){ v.blood = (v.blood | 0) - 1; said.push('burns 1 blood'); }
      else if(v.zone === 'ready'){ down(); said.push('goes to torpor'); }
    }
    this.push();
    this.note(v.name + ' pays for ' + sp.name + ' \u2014 ' + (sp.selfTorpor ? 'the sun' : sp.selfDmg + ' unpreventable' + (sp.selfAggr ? ' aggravated' : '') + ' damage') + ': ' + (said.join(', ') || 'nothing left to take') + '.');
    this._emit('self-price', { vamp: v.name, card: sp.name, zone: v.zone, blood: v.blood | 0 });
  }
  _bestEnemyRescueFor(vamp){         // v2 (#7): a FAMED enemy vampire in torpor + rush capability now -- the forced split t = min(2, their blood), mine = 2 - t (rulebook 6.5.3: the acting controller chooses)
    if(!vamp || !this._famedSeen) return null;
    if(!this._rushCapableNow()) return null;
    let best = null;
    for(const [seat, tb] of Object.entries(this.table || {})){
      if(+seat === this.seat || !tb || !tb.pub) continue;
      if(+seat !== this.preySeat()) continue;   // v0.6.133 (Johan, 19 Sep): the Fame need not be mine, but one rescues only one's PREY's vampire -- anything else is table talk, which a bot does not have
      for(const c of (tb.pub.cards || [])){
        if(!c || c.kind !== 'crypt' || c.zone !== 'torpor') continue;
        if(!this._famedSeen[c.name]) continue;
        const t = Math.min(2, (c.blood | 0));
        const mine = 2 - t;
        if((vamp.blood | 0) < mine + 1) continue;   // leave >= 1 on my actor
        const score = t * 10 + (c.cap | 0);          // prefer the FREE rescue, tiebreak bigger cap (bigger re-torpor target value)
        if(!best || score > best.score) best = { kind: 'enemyRescue', seat: +seat, name: c.name, tPays: t, mine, score, st: 0, n: 1 };
      }
    }
    return best;
  }
  _bestVotesReactFor(){              // P0: a react-type fx.votesBonus card + an UNLOCKED reactor satisfying req.title (PRINTED -- the N4a insight)
    if(!this.fx) return null;
    for(let idx = 0; idx < this.hand.length; idx++){
      const h = this.fxLookup(this.hand[idx]); if(!h || h.kind !== 'lib' || !((h.e.t) || []).includes('react')) continue;
      const wakeOk = !!this._wakeCard();   // v0.6.67 (the combo): the vote window gets the same widening
      for(const mo of (h.e.modes || [])){
        if(!mo.fx || !mo.fx.votesBonus) continue;
        const needT = mo.req && mo.req.title;
        const pool = this.board.filter(v => { if(!v || v.kind !== 'crypt' || v.zone !== 'ready' || (v.locked && !wakeOk)) return false;
          if(!needT) return true;
          const hv = this.fxLookup(v.name);
          return hv && hv.e && String(hv.e.title || '').toLowerCase() === String(needT).toLowerCase(); });
        pool.sort((a2, b2) => ((a2.locked ? 1 : 0) - (b2.locked ? 1 : 0)));
        if(!pool.length) continue;
        return { idx, name: h.name, n: mo.fx.votesBonus, vamp: pool[0] };
      }
    }
    return null;
  }
  _refStaggerMs(){                   // v0.6.124: bots write ABSOLUTE counter values; three of them voting on the same open edge lost each other's updates -- and would overwrite a human's +2. Vote in ring order from the caller, one beat apart, each reading the counter as it stands THEN.
    const rt = this._refT; if(!rt || !rt.seat) return 0;
    let d = 0, st = rt.seat; const n = (this.players || []).length;
    for(let k = 0; k < n && st !== this.seat; k++){ st = this.nextLive(st); d++; }
    return d * Math.max(200, Math.min(600, (this.o.paceMs | 0) || 250));
  }
  _voteCounter(m){ return (this.tally && this.tally.mode === 'vote') ? this.tally : (m || {}); }
  _voteMirror(fld, val){ if(this.tally && this.tally.mode === 'vote'){ const t = Object.assign({}, this.tally); t[fld] = val; this.tally = t; } }   // v0.6.124: my own write, mirrored at once -- the District branch runs right after the title votes, before the echo, and used to overwrite them with open-edge + its own   // v0.6.124: the counter as it stands NOW (the tally handler mirrors every message), not the open-edge snapshot
  async _onVoteOpen(m){              // P0 (the politics engine's FIRST brick): the polling window -- District's defensive votes land in the SHARED against-counter. v0.6.67: async for the wake pacing beat
    { const wait = this._refStaggerMs(); if(wait > 0){ await sleep(wait); if(this.out || !(this.tally && this.tally.mode === 'vote')) return; } }   // v0.6.124: my beat in the ring; the polls may have closed meanwhile
    this._castTitleVotes(m);         // v0.6.111 (R3, #10): my own title votes go FIRST -- the District branch below has three abstain early-returns that would otherwise swallow them
    if(this._callingReferendum) return;   // v0.6.66 (the review's seam): the tally carries no WHO -- when Q-work lets THIS bot call referendums, the caller sets this flag or District votes against ITSELF
    if(this._votedThisRef) return;
    if(this._refT && this._refVoteDir(this._refT.deltas).dir !== 'against'){ this._sayAbstain(); return; }   // v0.6.122: District's votes are AGAINST votes -- never spent on a referendum I want or do not care about
    const vr = this._bestVotesReactFor();
    if(!vr){ this._sayAbstain(); return; }
    const needsWakeV = !!vr.vamp.locked;                 // v0.6.67 (the combo): re-derived, the bounce precedent
    const wkV = needsWakeV ? this._wakeCard() : null;
    if(needsWakeV && !wkV){ this._sayAbstain(); return; }
    if(wkV){
      this.hand.splice(wkV.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
      this._toAsh(wkV.name);
      this.fxClone({ name: wkV.name, kind: 'lib' }, 'may react as though unlocked', { actor: vr.vamp });
      this.send({ t: 'log', html: '<b>' + esc(vr.vamp.name) + '</b> plays <b>' + esc(wkV.name) + '</b>: may react as though unlocked.' });
      this._emitPlay(wkV.name, 'wake', vr.vamp.name);
      await this._pace();
    }
    const j = this.hand.indexOf(vr.name);
    if(j < 0){ this._sayAbstain(); return; }
    this.hand.splice(j, 1); this._drawOwed = (this._drawOwed || 0) + 1;
    this._toAsh(vr.name);
    this._emitPlay(vr.name, 'react-votes', vr.vamp.name);
    this.fxClone({ name: vr.name, kind: 'lib' }, '+' + vr.n + ' votes against', { actor: vr.vamp });
    this.send({ t: 'log', html: '<b>' + esc(vr.vamp.name) + '</b> plays <b>' + esc(vr.name) + '</b> \u2014 +' + vr.n + ' votes against the referendum.' });
    { const nb = (this._voteCounter(m).b | 0) + vr.n; this.send({ t: 'tally', mode: 'vote', b: nb }); this._voteMirror('b', nb); }   // absolute against-total; `a` rides srv-2.6.17's absent-field preserve untouched; v0.6.124: from the counter as it stands now
    this.chat('I vote ' + vr.n + ' against.');   // v0.6.117: the play line + fx carry the card; the bubble is what a human says aloud
    this._votedThisRef = true;
    this.push();
  }
  _sayAbstain(){   // v0.6.117: a referendum the bot has nothing to say against -- one bubble per referendum, the way a human says "no votes from me" (was a `Trainbot abstains.` note, invisible at the table)
    if(this._abstainSaid || this._didCastRef) return;   // v0.6.122: a seat that just CAST votes does not also say it has none (the District branch's abstain exits ran after the title votes)
    this._abstainSaid = true;
    this.chat('No votes from me.');
  }
  _onVoteClose(){ this._votedThisRef = false; this._castThisRef = false; this._refVotes = null; this._abstainSaid = false; this._didCastRef = false; }   // P0: the once-per-referendum guard re-arms on the mode-exit edge; v0.6.111 (R3): so do the title-vote guard and the running count
  /* v0.6.111 (R3, #10) ------------------------------------------------------
     My own TITLE votes. The cardfx crypt entries carry `title` and `votes`, so
     this is READ, not inferred. A locked titled minion still votes (rulebook,
     and the client's own note on the Cast votes item); torpor does not. */
  _myTitleVotes(){
    let n = 0; const who = [];
    (this.board || []).forEach(c => {
      if(!c || c.kind !== 'crypt' || c.zone !== 'ready') return;
      const h = this.fxLookup(c.name);
      const v = (h && h.kind === 'crypt' && typeof h.e.votes === 'number') ? h.e.votes : 0;
      if(v > 0){ n += v; who.push(c.name + ' (' + (h.e.title || '?') + ', ' + v + ')'); }
    });
    return { n, who };
  }
  /* The DIRECTION is the R2 answer, not a new judgement: a referendum that costs
     me pool gets my votes against it, one that costs me nothing gets none. The
     bot cannot model table diplomacy yet, and inventing a preference it cannot
     defend is worse than abstaining -- Johan's framing for this whole submenu was
     "some reaction at least", not a politics engine. Persona weighting, bargaining
     and vote-trading are the obvious next dimension, deliberately not v1. */
  _castTitleVotes(m){
    if(this._castThisRef || this._callingReferendum || this.out) return;
    const rt = this._refT;
    if(rt){   // v0.6.122 (THE VOTER v0): a bot-called referendum with terms on record -- direction from _refVoteDir, both ways. v0.6.124: NO clock on the terms (was 180 s -- a human table with Hold on in the block step and again in the polls outlived it, and the voter fell back to against-only); they die with the action: the result line, the caller's It resolves, a new terms line, or somebody ELSE announcing a political action
      const tvR = this._myTitleVotes(); if(!tvR.n) return;
      this._castThisRef = true;
      const vd = this._refVoteDir(rt.deltas);
      if(vd.dir){ const vc = this._votesToCast(vd.dir, Math.max(0, -(rt.deltas[this.seat] | 0))); tvR.n = vc.n;   // v0.6.127: the crypt layer -- a Silverson-class tax may keep votes home, an Alexa-class discard may add one
        if(!tvR.n){ this._emit('ref-vote', { card: rt.card, dir: null, n: 0, my: rt.deltas[this.seat] | 0, prey: rt.deltas[this.preySeat()] | 0, taxed: vc.tax }); this.o.log('referendum: no votes cast (' + vd.why + '; the vote tax of ' + vc.tax + ' blood is not worth it)'); return; } }
      this._emit('ref-vote', { card: rt.card, dir: vd.dir, n: vd.dir ? tvR.n : 0, my: rt.deltas[this.seat] | 0, prey: rt.deltas[this.preySeat()] | 0 });
      if(!vd.dir){ this.o.log('referendum: ' + tvR.n + ' title votes held back (' + vd.why + ')'); return; }
      this._didCastRef = true;
      const fld = vd.dir === 'for' ? 'a' : 'b', msg = { t: 'tally', mode: 'vote' }; msg[fld] = (this._voteCounter(m)[fld] | 0) + tvR.n;
      this.send(msg); this._voteMirror(fld, msg[fld]);
      this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> casts <b>' + tvR.n + '</b> vote' + (tvR.n === 1 ? '' : 's') + ' <b>' + vd.dir + '</b>.' });
      this.chat('I vote ' + tvR.n + ' ' + vd.dir + '.');
      this.o.log('referendum: casting ' + tvR.n + ' ' + vd.dir + ' (' + vd.why + ')');
      return;
    }
    const stake = (this.pending && this.pending.kind === 'asked') ? (this.pending.amount | 0)
                : (this._obs && this._obs.poolLoss > 0 ? this._obs.poolLoss | 0 : 0);
    const tv = this._myTitleVotes();
    if(!tv.n) return;                                   // no titles: the table never waits on me (M2, spec §7.5-D)
    this._castThisRef = true;
    if(stake <= 0){ this.o.log('referendum: ' + tv.n + ' title votes held back (nothing at stake for me)'); return; }
    { const vc = this._votesToCast('against', stake); tv.n = vc.n; if(!tv.n){ this.o.log('referendum: no votes cast (the vote tax of ' + vc.tax + ' blood keeps them home)'); return; } }   // v0.6.127: the crypt layer
    { const nb = (this._voteCounter(m).b | 0) + tv.n; this.send({ t: 'tally', mode: 'vote', b: nb }); this._voteMirror('b', nb); }   // absolute against-total, the P0 convention; `a` rides srv-2.6.17's absent-field preserve; v0.6.124: from the counter as it stands now
    this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> casts <b>' + tv.n + '</b> vote' + (tv.n === 1 ? '' : 's') + ' <b>against</b>.' });   // the CLIENT's frozen §12 shape, so every peer parses mine exactly as it parses a human's
    this._didCastRef = true;
    this.chat('I vote ' + tv.n + ' against.');   // v0.6.117: the frozen `casts N votes against.` line above is the record; the bubble is the spoken vote (the stake stays in o.log)
    this.o.log('referendum: casting ' + tv.n + ' against (' + tv.who.join(', ') + '), stake ' + stake);
  }
  /* ======================= THE REFERENDUM (v0.6.122, the politics leg step 2 + 3) =======================
     Johan, 18 Sep 2026: simple first. One resolver turns a card's printed terms (cardfx e.ref.pool) and the
     PUBLIC table into a per-seat delta map; everything reads that map -- the terms line, the vote, the
     block stake, the action score. No deals, no meta layer.                                               */
  _seatCards(seat){ return seat === this.seat ? (this.board || []) : ((((this.table || {})[seat] || {}).pub || {}).cards || []); }
  _seatPool(seat){ if(seat === this.seat) return this.pool | 0; const pub = ((this.table || {})[seat] || {}).pub; return pub && typeof pub.pool === 'number' ? pub.pool : 30; }
  _seatTitleVotes(seat, minBlood){   // title votes a seat can cast: ready titled vampires (locked ones vote too; torpor does not). v0.6.127: minBlood = a Silverson-class tax -- a vampire that cannot pay it cannot vote against
    let n = 0;
    this._seatCards(seat).forEach(c => { if(!c || c.kind !== 'crypt' || c.zone !== 'ready' || (minBlood > 0 && (c.blood | 0) < minBlood)) return;
      const h = this.fxLookup(c.name); if(h && h.kind === 'crypt' && typeof h.e.votes === 'number') n += h.e.votes; });
    return n;
  }
  _refCount(seat, per, clan){        // the PUBLIC board counters a term can scale with
    const cards = this._seatCards(seat).filter(c => c && c.name);
    const cr = c => { const h = c.kind === 'crypt' ? this.fxLookup(c.name) : null; return h && h.kind === 'crypt' ? h.e : null; };
    const isAlly = c => { if(c.kind === 'crypt') return false; const h = this.fxLookup(c.name); return !!(h && h.kind === 'lib' && (h.e.t || []).indexOf('ally') >= 0); };
    const readyV = cards.filter(c => c.kind === 'crypt' && c.zone === 'ready');
    const minions = cards.filter(c => c.zone === 'ready' && (c.kind === 'crypt' || isAlly(c)));
    if(per === 'minion') return minions.length;
    if(per === 'lockedMinion') return minions.filter(c => c.locked).length;
    if(per === 'torporVamp') return cards.filter(c => c.kind === 'crypt' && c.zone === 'torpor').length;
    if(per === 'clanVamp') return readyV.filter(c => { const e = cr(c); return e && e.clan === clan; }).length;
    if(per === 'cap8Vamp') return readyV.filter(c => { const e = cr(c); return e && (e.cap | 0) >= 8; }).length;
    if(per === 'indieAnarchVamp') return readyV.filter(c => { const e = cr(c); return e && /^(Independent|Anarch)$/i.test(e.sect || ''); }).length;
    return 0;
  }
  _refValue(deltas){                 // what a delta map is worth TO ME: my prey's loss in full, my own pool at 0.8, everyone else's loss a little
    const prey = this.preySeat(); let v = 0;
    Object.keys(deltas).forEach(k => { const st = k | 0, d = deltas[k];
      if(st === this.seat) v += 0.8 * d; else if(st === prey) v -= d; else v -= 0.15 * d; });
    if(prey !== this.seat && -(deltas[prey] || 0) >= this._seatPool(prey) && this._seatPool(prey) > 0) v += 3;   // the referendum ousts my prey
    return v;
  }
  _refDeltas(e){                     // entry -> { deltas: {seat: n}, note } for the best LEGAL choice this table allows, or null
    const terms = e && e.ref && e.ref.pool; if(!terms || !terms.length) return null;
    const seats = (this.players || []).map(p => p.seat).filter(st => this.live(st));
    const others = seats.filter(st => st !== this.seat);
    if(!others.length) return null;
    const prey = this.preySeat(), deltas = {}, notes = [];
    const add = (st, d) => { if(d) deltas[st] = (deltas[st] | 0) + d; };
    for(const tm of terms){
      const n = tm.n === 'players' ? seats.length : tm.n; if(typeof n !== 'number' || n <= 0) return null;
      if(tm.scope === 'alloc'){
        /* v0 split (agreed 18 Sep): everything the rules allow on my prey, 1 point each on as many other
           Methuselahs as `min` demands -- the opponents with the FEWEST title votes on the table (they can
           resist least); myself only when nobody else is left (a 2-player KRC is 3 + 1 on me). */
        const min = tm.min | 0 || 1, pool = (tm.others ? others : seats).filter(st => st !== prey);
        const fill = pool.filter(st => st !== this.seat).sort((a, b) => this._seatTitleVotes(a) - this._seatTitleVotes(b) || a - b);
        if(!tm.others && pool.indexOf(this.seat) >= 0) fill.push(this.seat);
        if(fill.length < min - 1 || n < min) return null;
        /* v0.6.126 (self-review 6): never put more on my prey than it HAS -- the points beyond its pool go to the same
           side seats, fewest title votes first (ties: not my prey's prey -- feeding my prey's oust pays it 6 pool). */
        if(tm.sign < 0){ const pp = this.nextLive(prey); fill.sort((a, b) => this._seatTitleVotes(a) - this._seatTitleVotes(b) || ((a === pp) - (b === pp)) || a - b); if(!tm.others){ const mi = fill.indexOf(this.seat); if(mi >= 0){ fill.splice(mi, 1); fill.push(this.seat); } } }
        const side = fill.slice(0, min - 1);
        let onPrey = n - side.length;
        if(tm.sign < 0 && side.length){ const has = Math.max(1, this._seatPool(prey)); if(onPrey > has){ add(side[0], tm.sign * (onPrey - has)); onPrey = has; } }
        add(prey, tm.sign * onPrey); side.forEach(st => add(st, tm.sign));
      } else if(tm.scope === 'each'){
        let clan = null;
        if(tm.per === 'clanVamp'){   // "choose a clan": the one that maximises my side of the ledger
          const clans = {}; seats.forEach(st => this._seatCards(st).forEach(c => { const h = c && c.kind === 'crypt' && c.zone === 'ready' ? this.fxLookup(c.name) : null; if(h && h.kind === 'crypt' && h.e.clan) clans[h.e.clan] = 1; }));
          let bestV = -1e9; Object.keys(clans).forEach(cl => { const d = {}; seats.forEach(st => { d[st] = tm.sign * n * this._refCount(st, 'clanVamp', cl); }); const v = this._refValue(d); if(v > bestV){ bestV = v; clan = cl; } });
          if(!clan) return null; notes.push('clan ' + clan);
        }
        seats.forEach(st => add(st, tm.sign * n * (tm.per ? this._refCount(st, tm.per, clan) : 1)));
      } else if(tm.scope === 'chosen'){ add(tm.sign < 0 ? prey : this.seat, tm.sign * n);
      } else if(tm.scope === 'self'){ add(this.seat, tm.sign * n);
      } else if(tm.scope === 'move'){
        /* Parity Shift: from a Methuselah with MORE pool than me -- my prey when it qualifies, else the
           richest -- all of it to me (v0: no gifts). */
        const mine = this.pool | 0, richer = others.filter(st => this._seatPool(st) > mine);
        if(!richer.length) return null;
        const from = richer.indexOf(prey) >= 0 ? prey : richer.sort((a, b) => this._seatPool(b) - this._seatPool(a) || a - b)[0];
        const amt = Math.min(n, this._seatPool(from));
        add(from, -amt); add(this.seat, amt);
      } else return null;
    }
    Object.keys(deltas).forEach(k => { if(!deltas[k]) delete deltas[k]; });
    if(!Object.keys(deltas).length) return null;
    return { deltas, note: notes.join(', ') };
  }
  _refTermsText(deltas){             // "Alice \u22123, Bob \u22121, U +3" -- seat order, names as the roster spells them
    return Object.keys(deltas).map(k => k | 0).sort((a, b) => a - b).map(st => this.seatName(st) + ' ' + (deltas[st] < 0 ? '\u2212' : '+') + Math.abs(deltas[st])).join(', ');
  }
  _parseRefTerms(txt){               // the inverse; unknown names are dropped (a spectator's typo must not move pool)
    const out = {}; String(txt || '').split(/,\s*/).forEach(part => { const m = part.match(/^(.+?) ([+\u2212-])(\d{1,2})$/); if(!m) return;
      const st = this._seatOfName(m[1]); if(st) out[st] = (m[2] === '+' ? 1 : -1) * parseInt(m[3], 10); });
    return out;
  }
  _voteBoosts(v){                    // extra votes I can add during polling: a votes MODIFIER the acting vampire can play (Bewitching Oration) and an unlocked in-play votes card (Ventrue Headquarters)
    const out = [];
    let bestMod = null;
    (this.hand || []).forEach((nm, idx) => { const h = this.fxLookup(nm); if(!h || h.kind !== 'lib' || (h.e.t || []).indexOf('mod') < 0) return;
      if(h.e.cost && h.e.cost.blood && h.e.cost.blood > (v.blood | 0)) return;
      (h.e.modes || []).forEach(mo => { if(mo.fx && typeof mo.fx.votes === 'number' && mo.fx.votes > 0 && this._modeUsableBy(mo, v) && (!bestMod || mo.fx.votes > bestMod.n)) bestMod = { kind: 'mod', idx, name: h.name, n: mo.fx.votes, cost: h.e.cost || null }; }); });
    if(bestMod) out.push(bestMod);
    (this.board || []).forEach(c => { if(!c || c.kind === 'crypt' || c.locked || c.zone === 'ash') return; const h = this.fxLookup(c.name); if(!h || h.kind !== 'lib' || !h.e.persistent) return;
      (h.e.modes || []).forEach(mo => { if(mo.lock && mo.fx && typeof mo.fx.votes === 'number' && mo.fx.votes > 0) out.push({ kind: 'inplay', card: c, name: h.name, n: mo.fx.votes }); }); });
    this._voteDiscardBoosts(true, bestMod ? [bestMod.name] : null).forEach(b => out.push(b));   // v0.6.127: Alexa-class (crypt fx.voteBoostDiscard) -- never the card the modifier boost is about to play
    return out;
  }
  _bestPoliticalFor(vamp){           // a political card in hand this vampire may call, with the best legal terms and an honest pass estimate
    let best = null;
    const ck = this.fxLookup(vamp.name), ce = ck && ck.kind === 'crypt' ? ck.e : null;
    (this.hand || []).forEach((nm, idx) => {
      const h = this.fxLookup(nm); if(!h || h.kind !== 'lib' || (h.e.t || []).indexOf('political') < 0) return;
      const e = h.e; if(!e.ref || !e.ref.pool) return;
      if(!this._mayPlay(h.name, e, null, true)) return;
      const rq = e.req || {};
      if(rq.unmodelled) return;                                                    // a requirement the data cannot verify: fail closed
      if(rq.title || rq.titles){ const tl = ((ce && ce.title) || '').toLowerCase(); if(!tl) return; if(rq.titles && !rq.titles.some(x => x === tl || x.indexOf(tl) === 0)) return; }
      if(rq.clan && rq.clan.length && (!ce || rq.clan.indexOf(ce.clan) < 0)) return;
      if(rq.disc && rq.disc.length && (!ce || !ce.disc || !rq.disc.some(d => ce.disc.all.indexOf(d) >= 0))) return;
      if(e.cost && e.cost.blood && e.cost.blood > (vamp.blood | 0)) return;
      if(e.cost && e.cost.pool && e.cost.pool >= (this.pool | 0)) return;
      const rd = this._refDeltas(e); if(!rd) return;
      const value = this._refValue(rd.deltas); if(!(value > 0)) return;
      const prey = this.preySeat(), taxMine = this._cryptVoteTax(vamp.name);   // v0.6.127: Silverson-class -- the table's against-votes cost blood
      const mine = this._myTitleVotes().n + 1 + this._voteBoosts(vamp).reduce((a, b) => a + b.n, 0);   // titles + the card's own vote + what I can add in polling
      let agst = 0, forO = 0;
      (this.players || []).forEach(pl => { const st = pl.seat; if(st === this.seat || !this.live(st)) return;   // the v0 voter rule, applied to THEM (v0.6.124: both directions)
        const theirs = rd.deltas[st] | 0, theirPrey = this.nextLive(st), led = theirs - (theirPrey === st ? 0 : (rd.deltas[theirPrey] | 0));
        if(theirs < 0 || led < 0) agst += this._seatTitleVotes(st, taxMine); else if(led > 0) forO += this._seatTitleVotes(st); });
      const pass = (mine + forO > agst) ? 0.85 : (mine + forO === agst ? 0.2 : 0.08);
      const cand = { idx, name: h.name, kind: 'political', n: Math.max(0, -(rd.deltas[prey] | 0)), st: 1, cost: e.cost || null, deltas: rd.deltas, note: rd.note, value, pass, mine, agst, forO };
      if(!best || cand.value * cand.pass > best.value * best.pass) best = cand;
    });
    return best;
  }
  _actAgainCtx(v, c){                // v0.6.137: what the Freak Drive-class decision reads when the turn ledger leaves this vampire nothing to do (spec-home-pricing section 2.3)
    const hw = this.o.homeWeight == null ? 1 : +this.o.homeWeight; if(!(hw > 0)) return { priced: false };   // 0 = the original
    const a = this._actValue(Object.assign({}, v, { blood: Math.max(0, (v.blood | 0) - (c.cost | 0)) })); const actLeft = !!(a && a.n > 0);
    if(actLeft) return { priced: true, actLeft: true };
    const r = this.plan && this.plan.reads; const preyTto = r ? +r.preyTto : 99, myTto = r ? +r.myTto : 99;
    let saveForLunge = null;
    if(preyTto <= 2){ const others = (this.hand || []).filter(n => n !== c.name); const has = k => others.some(n => { const h = this.fxLookup(n); return h && h.kind === 'lib' && (h.e.modes || []).some(mo => mo.fx && mo.fx[k]); });
      if(has('bleedAct') && (has('referendum') || has('political'))) saveForLunge = 'my prey falls in ' + preyTto + ' of my turns and the hand holds a bleed and a referendum \u2014 it is worth two actions then'; }
    const pred = this.predSeat(), hits = this.predHits(pred), st = this.oppStealth(pred);
    const covered = this.board.filter(x => x && x.kind === 'crypt' && x.zone === 'ready' && !x.locked && x.id !== v.id && (x.blood | 0) > 0).length + this._wakesInHand();   // bodies already up AND wakes: wake + Freak Drive prices the SECOND block
    const hit = hits[covered] || 0; const ic = this._bestInterceptFor(v, null); const icp = ((ic && ic.s) | 0) + this._equipIntercept(v);
    const bounce = covered === 0 && this._bestBounceFor([v], new Set()); const pStop = bounce ? 0.9 : Math.max(0.05, Math.min(0.9, 0.5 + 0.35 * (icp - st)));
    const unlockValue = +(pStop * hit * hw).toFixed(2);   // v0.6.138: in POOL (v0.6.137 scaled it by 1 / myTto and compared it with a raw score price -- it could never win: 0 plays in serie-home1)
    const clogged = !(this.hand || []).some(n => { if(n === c.name) return false; const h = this.fxLookup(n); return h && h.kind === 'lib' && ((h.e.t || []).includes('react') || (h.e.modes || []).some(mo => mo.fx && (mo.fx.bleedAct || mo.fx.referendum || mo.fx.rush))); });
    const cp = this._critPool(), burst = this.predBurst(pred); const edge = ((this.pool | 0) <= cp.crit || burst >= (this.pool | 0)) ? { pool: this.pool | 0, crit: cp.crit, burst, lethal: burst >= (this.pool | 0) } : null;   // v0.6.141: the doll drain's edge, read here too
    return { priced: true, actLeft: false, saveForLunge, unlockValue, edge, uncoveredHit: hit, hitNo: covered + 1, unlockWhy: 'stops ' + (pStop * hit).toFixed(2) + ' of predator hit #' + (covered + 1) + (hit ? ' (' + hit.toFixed(2) + ')' : ' (none expected)') + ', I last ' + myTto + ' turns', clogged };
  }
  _drainCtx(host){                   // v0.6.134: what the Blood Doll-class drain decision reads -- statistics layer, every deck
    const r = this.plan && this.plan.reads; const myTto = r && r.myTto != null ? +r.myTto : null;
    const cp = this._critPool();   // v0.6.136: the edge is dynamic (was the fixed floor)
    const danger = (this.pool | 0) <= cp.crit || (myTto != null && myTto <= 1.5);
    let reserve = 0;                 // the dearest blood cost among the cards in hand this vampire could pay for (Deflection, Second Tradition, Freak Drive, a Govern...)
    (this.hand || []).forEach(nm => { const h = this.fxLookup(nm); if(!h || h.kind !== 'lib') return; const cb = (h.e.cost && h.e.cost.blood) | 0; if(cb > reserve && (h.e.modes || [{}]).some(mo => this._modeUsableBy(mo, host))) reserve = cb; });
    const card = this._bestBleedCardFor(host), pol = this._bestPoliticalFor(host), perm = this._bestEquipActionFor(host);
    const hasAction = pol ? pol.name : card ? card.name : perm ? perm.name : null;
    return { host, cap: this.fxCryptCap(host.name), pool: this.pool | 0, myTto, danger, crit: cp.crit, reserve: Math.min(3, reserve), hasAction };
  }
  _deckPermFirst(){ const ds = (typeof DECK_STRATEGY !== 'undefined' && DECK_STRATEGY[this.o.deckName]) || {}; return !!ds.permFirst; }   // v0.6.132: a manifest fact, not a deck name inside a tactic
  _polOverBuild(pol){                // v0.6.131 (debt 23b, Johan 18 Sep): when does a referendum beat build-first? Only with the votes (pass >= 0.8, the Daring the Dawn bar) AND one of: it pays ME pool (the pool is the next vampire -- the same build one turn later, and the prey is down too), or its own damage ousts my prey / leaves it within a turn and a half of my forecast (the v0.6.119 build-first exit, with the referendum's damage counted in). Plain damage on a healthy prey does NOT qualify -- that is what build-first is for. Reads the plan, computes no strategy of its own.
    if(!pol || !this.o.polOverBuild || !((pol.pass || 0) >= 0.8)) return null;
    const me = (pol.deltas && pol.deltas[this.seat]) | 0, prey = this.preySeat();
    if(me > 0) return { tag: 'economy', why: 'it pays me ' + me + ' pool \u2014 the same build a turn later' + ((pol.n | 0) > 0 ? ', and my prey loses ' + pol.n : '') };
    const n = pol.n | 0; if(!(n > 0) || prey === this.seat) return null;
    const pp = this._seatPool(prey) | 0; if(!(pp > 0)) return null;
    if(n >= pp) return { tag: 'reach', why: 'it ousts my prey (' + n + ' vs ' + pp + ' pool)' };
    const fc = this.plan && this.plan.reads ? +this.plan.reads.myFc : 0; if(!(fc > 0)) return null;
    const tto = (pp - n) / Math.max(0.5, fc);
    return tto <= 1.5 ? { tag: 'reach', why: 'it leaves my prey at ' + (pp - n) + ' pool, ' + tto.toFixed(2) + ' of my turns from falling' } : null;
  }
  _refVoteDir(deltas){               // THE VOTER v0 (Johan, 15 + 18 Sep): it costs me pool -> against; else my ledger minus my prey's: for when positive, AGAINST when negative (v0.6.124), abstain at zero
    const my = deltas[this.seat] | 0, pr = this.preySeat() === this.seat ? 0 : (deltas[this.preySeat()] | 0);
    if(my < 0) return { dir: 'against', why: 'it costs me ' + (-my) + ' pool' };
    const led = 'my ledger ' + (my >= 0 ? '+' : '') + my + ', my prey ' + (pr > 0 ? '+' : '') + pr;
    if(my - pr > 0) return { dir: 'for', why: led };
    if(my - pr < 0) return { dir: 'against', why: led + ' \u2014 it feeds my prey' };   // v0.6.124 (Johan, 18 Sep): the rule is symmetric -- a referendum that helps my prey more than me gets my votes against (my prey calling Parity Shift on itself was an abstain)
    return { dir: null, why: 'nothing in it for me' };
  }
  _refPoll(rc){                      // the vote clock: askSecs of silence closes the polls; every vote, tally move or Hold on restarts it; 'It resolves' (or the tally's Resolve) from anyone closes at once; all other live seats heard = closed
    return new Promise(resolve => {
      rc.done = why => { if(rc.closed) return; rc.closed = why; if(rc.timer) clearTimeout(rc.timer); resolve(why); };
      rc.arm = () => { if(rc.closed) return; if(rc.timer) clearTimeout(rc.timer);
        if(rc.paused.size) return;                                                  // someone said Hold on: the clock stands until they speak
        const others = (this.players || []).filter(pl => pl.seat !== this.seat && this.live(pl.seat)).map(pl => pl.name);
        if(others.length && others.every(nm => rc.heard.has(nm))) return rc.done('everyone has spoken');
        rc.timer = setTimeout(() => rc.done('the clock ran out'), this.o.askSecs * 1000 + this._chatSettleMs()); };
      rc.arm();
    });
  }
  async _callReferendum(v, act){     // the CALLER: terms -> announce -> block step (prey + predator) -> polling -> verdict -> effects
    const h = this.fxLookup(act.name), e = h && h.e;
    const terms = this._refTermsText(act.deltas);
    this._actingVamp.kind = 'political'; this._actingVamp.target = null;
    if(act.cost && act.cost.blood) { v.blood = Math.max(0, (v.blood | 0) - act.cost.blood); this._park(act.cost.blood, 0); }   // costs at announce (debt 1)
    if(act.cost && act.cost.pool){ this.pool = Math.max(0, (this.pool | 0) - act.cost.pool); this._park(0, act.cost.pool); }
    this.push();
    if(this._actingVamp && this._actingVamp.played) this._maybeBlockBarRef(v, act);   // v0.6.129: the bar line goes out before the terms and the announce
    this.send({ t: 'log', html: 'Referendum terms \u2014 <b>' + esc(act.name) + '</b>: ' + esc(terms) + '.' });   // FIRST: every bot reads its stake from this before the block question opens
    this.fxClone({ name: act.name, kind: 'lib' }, 'calls a referendum', { actor: v });
    this._announceTallyA(1 + this._cryptStealthMod(v, 'political'));                   // rulebook: a political action is undirected, +1 stealth
    this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> calls a political action.' });   // the client's frozen shape (v2.6.106)
    this._emit('referendum-called', { vamp: v.name, card: act.name, deltas: act.deltas, value: +act.value.toFixed(2), pass: act.pass, mine: act.mine, agst: act.agst });
    const ans = await this._askBlock('Trainbot: ' + v.name + ' calls ' + act.name + ' \u2014 ' + terms + '. Block?');
    await sleep(150);
    if(ans.what === 'block'){
      this.note('Blocked' + (ans.who ? ' by ' + ans.who : '') + '. Combat begins.');
      this._toAsh(act.name);
      this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: act.n, card: act.name, by: this._lastBlockerName || ans.who || null, kind: 'political' });
      this.send({ t: 'log', html: 'Referendum fails \u2014 <b>' + esc(act.name) + '</b>: blocked.' });
      await this._resolveCombat(v);
      return;
    }
    /* polling */
    this._callingReferendum = true;
    const rc = this._refCall = { for: 0, against: 0, by: {}, heard: new Set(), paused: new Set(), lastA: 0, lastB: 0, closed: null, timer: null, line: null };
    let mine = this._myTitleVotes().n + 1;
    try {
      this._writeTally({ mode: 'vote', a: mine, b: 0 });
      this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> casts <b>' + mine + '</b> vote' + (mine === 1 ? '' : 's') + ' <b>for</b>.' });
      this.chat('I vote ' + mine + ' for.');
      await this._refPoll(rc);
      const tot = () => ({ f: Math.max(mine + rc.for, rc.lastA | 0, rc.line ? rc.line.a : 0), a: Math.max(rc.against, rc.lastB | 0, rc.line ? rc.line.b : 0) });
      /* the boosts are held until the count says they are needed -- and spent only when they turn it */
      let t = tot();
      if(t.f <= t.a){
        const boosts = this._voteBoosts(v), need = t.a - t.f + 1;
        if(boosts.reduce((x, b) => x + b.n, 0) >= need){
          let got = 0;
          for(const b of boosts.sort((x, y) => y.n - x.n)){ if(got >= need) break;
            if(b.kind === 'discard'){ if(this._spendVoteDiscard(b, 'for')) got += b.n; continue; }   // v0.6.127
            if(b.kind === 'mod'){ const j = this.hand.indexOf(b.name); if(j < 0) continue; this.hand.splice(j, 1); this._drawOwed = (this._drawOwed || 0) + 1; this._toAsh(b.name);
              if(b.cost && b.cost.blood) v.blood = Math.max(0, (v.blood | 0) - b.cost.blood);
              this.fxClone({ name: b.name, kind: 'lib' }, '+' + b.n + ' votes', { actor: v }); this._emitPlay(b.name, 'mod-votes', v.name); }
            else { b.card.locked = true; this.fxClone(b.card, 'locks for +' + b.n + ' votes'); this._emitPlay(b.name, 'inplay-votes', null); }
            this.send({ t: 'log', html: '<b>' + esc(b.kind === 'mod' ? v.name : this.o.name) + '</b> ' + (b.kind === 'mod' ? 'plays' : 'locks') + ' <b>' + esc(b.name) + '</b> \u2014 +' + b.n + ' votes for the referendum.' });
            got += b.n; }
          mine += got; this.push();
          this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> casts <b>' + got + '</b> vote' + (got === 1 ? '' : 's') + ' <b>for</b>.' });
          this.chat('I add ' + got + ' votes for.');
          this._writeTally({ mode: 'vote', a: mine + rc.for });
          if(!rc.line){ rc.closed = null; await this._refPoll(rc); }               // the table may answer the boost
          t = tot();
        }
      }
      const passed = t.f > t.a;
      this._writeTally({ mode: 'vote', a: Math.min(99, t.f), b: Math.min(99, t.a) });   // the AUTHORITATIVE count: bots' absolute tally writes race each other, the frozen `casts` lines do not
      if(!rc.line) this.send({ t: 'log', html: 'Vote: ' + t.f + ' for vs ' + t.a + ' against \u2014 vote ' + (passed ? 'passes' : 'fails') + '.' });   // the client's frozen verdict line (skipped when a human's Resolve already wrote it)
      this.send({ t: 'log', html: 'Referendum ' + (passed ? 'passes' : 'fails') + ' \u2014 <b>' + esc(act.name) + '</b>: ' + (passed ? esc(terms) : 'no effect') + '.' });
      this.chat(passed ? 'The referendum passes, ' + t.f + ' to ' + t.a + '.' : 'The referendum fails, ' + t.f + ' to ' + t.a + '.');
      this._emit('referendum', { vamp: v.name, card: act.name, passed, for: t.f, against: t.a, mine, deltas: act.deltas, closed: rc.closed });
      this._toAsh(act.name);
      this._writeTally({ mode: null, a: 0, b: 0 });
      if(passed){
        const my = act.deltas[this.seat] | 0;
        if(my){ this.pool = Math.max(0, (this.pool | 0) + my); }
        this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: act.n, card: act.name, kind: 'political' });
        this.say('It resolves');
        this.push();
        if(this.pool <= 0 && !this.out){ this._oust(false); return; }
        this._maybeMarginBlood(v, t.f - t.a);   // v0.6.125: Voter Captivation -- before the act-again look, so its blood can pay Freak Drive
        for(const k of Object.keys(act.deltas)){ const st = k | 0; if(st !== this.seat && act.deltas[st] < 0) await this._settleOust(st, -act.deltas[st]); }
      } else {
        this._unblockedStreak = 0;
        this.say('It resolves');                                                   // the ACTION is over either way -- clears every seat's short-term memory (decision A)
      }
    } finally { this._callingReferendum = false; this._refCall = null; if(rc.timer) clearTimeout(rc.timer); }
  }
  _onRefTerms(who, card, txt){       // a caller's terms line: remember my stake until the action is over
    const st = this._seatOfName(who); if(!st || st === this.seat || this.out) return;
    const deltas = this._parseRefTerms(txt);
    this._refT = { who, seat: st, card, deltas, at: Date.now(), applied: false };
    this.o.log('referendum terms from ' + who + ' (' + card + '): ' + txt + ' -- mine ' + (deltas[this.seat] | 0));
  }
  _refWindow(who, vampName){         // the block step on a bot-called referendum: prey and predator only (undirected), my stake = what the terms take from me
    const rt = this._refT; if(!rt || rt.who !== who || Date.now() - rt.at > 20000) return false;
    const actorSeat = rt.seat;
    const role = (this.nextLive(actorSeat) === this.seat) ? 'prey' : (this.prevLive(actorSeat) === this.seat) ? 'predator' : null;
    if(this._obs && this._obs.who === who) this._obs.poolLoss = Math.max(0, -(rt.deltas[this.seat] | 0));   // the pool question is ANSWERED -- never asked in chat
    if(!role) return true;
    if(this.pending) this._clearPending('superseded by political');
    const amount = Math.max(0, -(rt.deltas[this.seat] | 0));
    const tpub = this.table[actorSeat] && this.table[actorSeat].pub;
    const actorUnlocked = ((tpub && tpub.cards) || []).filter(c => c && c.kind === 'crypt' && c.zone === 'ready' && !c.locked && c.name !== vampName).length;
    const preySeat = this.nextLive(actorSeat);
    const waitingFor = (role === 'predator' && preySeat !== this.seat && this.live(preySeat)) ? this.seatName(preySeat) : null;
    this.pending = { who, amount, kind: 'undirected', sub: 'political', T: amount > 0 ? 'T1' : 'T6', role, actorSeat, actorUnlocked, actingVampName: vampName, contested: false, reacted: new Set(), blockerVamp: null, declined: false, attempted: new Set(), waitingFor, note: rt.card + (amount ? ' would cost me ' + amount : ' costs me nothing'), card: rt.card };
    this.o.log('undirected window: political (' + rt.card + ') by ' + who + ' (' + this.pending.T + ', I am ' + role + ', stake ' + amount + (waitingFor ? ', waiting for ' + waitingFor : '') + ')');
    if(!waitingFor) this._reactWindow();
    return true;
  }
  _onRefResult(who, passed, card, txt){   // the caller's outcome line: apply MY delta here, once -- both signs, no pending needed
    const st = this._seatOfName(who); if(!st || st === this.seat || this.out) return;
    const rt = this._refT;
    if(this.pending && this.pending.sub === 'political') this._clearPending('referendum ' + (passed ? 'passed' : 'failed'));
    if(!passed){ this._refT = null; return; }
    if(rt && rt.applied) return;
    const deltas = this._parseRefTerms(txt), my = deltas[this.seat] | 0;
    if(rt) rt.applied = true;
    this._refT = null;
    if(!my) return;
    this.pool = (this.pool | 0) + my;
    if(my < 0){ this._predPressure = (this._predPressure | 0) + (st === this.predSeat() ? -my : 0); this._emit('took-pooldmg', { n: -my, pool: this.pool, via: 'referendum', card }); }
    else this._emit('pool-gain', { n: my, pool: this.pool, via: 'referendum', card });
    if(this.pool > 0){ this.push(); this.chat(my < 0 ? 'I lose ' + (-my) + ' pool to the referendum. Pool: ' + this.pool + '.' : 'I gain ' + my + ' pool from the referendum. Pool: ' + this.pool + '.'); }
    else this._oust(false);
  }
  /* ======================= ACT AGAIN (v0.6.123, the politics leg step 4) =======================
     Freak Drive-class: an action modifier that unlocks its vampire AFTER the action is over. cardfx v1.8.0
     carries the window as a mode rider (when: actSuccess | actBlocked | actFailed). The vampire goes back on
     the LIVE actor queue -- the Warsaw Station precedent (v0.6.64) -- so everything downstream (keep-a-blocker,
     the plan, the action choice) treats it as any other unlocked body: it may act again OR stay home. */
  _maybeMarginBlood(v, margin){      // v0.6.125: Voter Captivation-class (fx.bloodPerMargin, when refPassed) -- after MY referendum passed: the acting vampire gains 1 blood per vote of margin, capped at capacity; the [PRE] mode may send up to marginToPool of it to my pool instead
    if(!(margin > 0) || !v || v.zone !== 'ready') return false;
    let best = null;
    (this.hand || []).forEach((nm, idx) => { const h = this.fxLookup(nm); if(!h || h.kind !== 'lib' || (h.e.t || []).indexOf('mod') < 0) return;
      (h.e.modes || []).forEach(mo => { if(!mo.fx || !mo.fx.bloodPerMargin || mo.when !== 'refPassed' || !this._modeUsableBy(mo, v)) return;
        const cand = { idx, name: h.name, per: mo.fx.bloodPerMargin, toPool: mo.fx.marginToPool | 0 }; if(!best || cand.toPool > best.toPool) best = cand; }); });
    if(!best) return false;
    const gain = margin * best.per, cap = this.fxCryptCap(v.name), room = Math.max(0, (typeof cap === 'number' ? cap : 99) - (v.blood | 0));
    let toPool = Math.min(best.toPool, Math.max(0, gain - room));                       // overflow first: blood the vampire cannot hold
    if(best.toPool > toPool && this.pool <= (this.o.poolFloor | 0) + 4) toPool = Math.min(best.toPool, gain);   // a thin pool takes its full share
    const toBlood = Math.min(room, gain - toPool);
    if(toBlood + toPool <= 0) return false;                                             // a full vampire and no pool mode: the card would do nothing
    const j = this.hand.indexOf(best.name); if(j < 0) return false;
    this.hand.splice(j, 1); this._drawOwed = (this._drawOwed || 0) + 1; this._toAsh(best.name);
    v.blood = (v.blood | 0) + toBlood; this.pool += toPool; this.push();
    this.fxClone({ name: best.name, kind: 'lib' }, '+' + toBlood + ' blood' + (toPool ? ', +' + toPool + ' pool' : ''), { actor: v });
    this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> gains ' + toBlood + ' blood \u2014 <b>' + esc(best.name) + '</b> (passed by ' + margin + (toPool ? '; ' + toPool + ' to pool, now ' + this.pool : '') + ').' });   // not a `plays` line: nothing may read it as a new action
    this._emitPlay(best.name, 'ref-margin', v.name);
    this._emit('margin-blood', { vamp: v.name, card: best.name, margin, toBlood, toPool });
    return true;
  }
  _bestActAgainFor(vamp, outcome){
    const want = outcome === 'through' ? ['actSuccess'] : outcome === 'blocked' ? ['actBlocked', 'actFailed'] : [];
    if(!want.length) return null;
    let best = null;
    (this.hand || []).forEach((nm, idx) => {
      const h = this.fxLookup(nm); if(!h || h.kind !== 'lib' || (h.e.t || []).indexOf('mod') < 0) return;
      if(h.e.oncePerTurn && this._actAgainUsed && this._actAgainUsed.has(FX_NORM(h.name) + '|' + vamp.id)) return;
      const cost = (h.e.cost && h.e.cost.blood) | 0; if(cost > (vamp.blood | 0)) return;
      (h.e.modes || []).forEach(mo => { if(best || !mo.fx || !mo.fx.unlock || want.indexOf(mo.when) < 0 || !this._modeUsableBy(mo, vamp)) return;
        best = { idx, name: h.name, cost, when: mo.when, oncePerTurn: !!h.e.oncePerTurn }; });
    });
    return best;
  }
  _maybeActAgain(v, actors, idx){    // called between actors and once after the last one; consumes _lastAct so a vampire kept home on its revisit is never re-queued
    const la = this._lastAct; this._lastAct = null;
    if(!la || !v || la.vamp !== v.name || this.out || (v.zone !== 'ready' && v.zone !== 'torpor')) return false;   // v0.6.128: a vampire its own card sent to torpor may still unlock -- to walk out (needs 2 blood after the card)
    const inTorpor = v.zone === 'torpor';
    this._actAgainN = this._actAgainN || {};
    if((this._actAgainN[v.id] | 0) >= 2) return false;                              // a hard stop: two extra actions per vampire per turn
    const queued = () => actors.indexOf(v, idx + 1) >= 0;
    if(!v.locked){                                                                  // already unlocked during the action (Majesty [PRE] in the block's combat): just revisit
      if(queued()) return false;
      actors.push(v); this._actAgainN[v.id] = (this._actAgainN[v.id] | 0) + 1;
      this._emit('act-again', { vamp: v.name, card: null, outcome: la.outcome, via: 'unlocked in combat' });
      return true;
    }
    const su = this._cryptSelfUnlockFx(v);                                           // v0.6.127: Sybren-class -- his own text unlocks him after HIS referendum passed: no card, no cost, before any Freak Drive is looked at
    if(su && su.when === 'refPassed' && la.kind === 'political' && la.outcome === 'through' && !(this._actAgainUsed && this._actAgainUsed.has('self|' + v.id))){
      (this._actAgainUsed = this._actAgainUsed || new Set()).add('self|' + v.id);   // v0.6.129: one political action per vampire per turn, so the text fires once   // every passed referendum is a new trigger by the text; the two-extra-actions cap above is the only stop
      v.locked = false; this.push();
      this._actAgainN[v.id] = (this._actAgainN[v.id] | 0) + 1;
      this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> unlocks \u2014 his referendum passed.' });
      this._emit('act-again', { vamp: v.name, card: null, outcome: la.outcome, via: 'crypt text', blood: v.blood });
      if(!queued()) actors.push(v);
      return true;
    }
    const c = this._bestActAgainFor(v, la.outcome); if(!c) return false;
    const d = this.decide('act-again', Object.assign({ vamp: v, card: c, outcome: la.outcome, inTorpor }, this._actAgainCtx(v, c)));
    if(!d.play){ this.o.log('act-again (' + v.name + '): ' + d.why); return false; }
    const j = this.hand.indexOf(c.name); if(j < 0) return false;
    this.hand.splice(j, 1); this._drawOwed = (this._drawOwed || 0) + 1; this._toAsh(c.name);
    if(c.cost) v.blood = Math.max(0, (v.blood | 0) - c.cost);
    v.locked = false; this.push();
    if(c.oncePerTurn){ this._actAgainUsed = this._actAgainUsed || new Set(); this._actAgainUsed.add(FX_NORM(c.name) + '|' + v.id); }
    this._actAgainN[v.id] = (this._actAgainN[v.id] | 0) + 1;
    this.fxClone({ name: c.name, kind: 'lib' }, 'unlocks', { actor: v });
    this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> unlocks \u2014 <b>' + esc(c.name) + '</b>' + (la.outcome === 'blocked' ? ' (after the block)' : ' (after a successful action)') + '.' });
    this.o.log('act-again (' + v.name + '): ' + d.why);
    this._emitPlay(c.name, 'act-again', v.name);
    this._emit('act-again', { vamp: v.name, card: c.name, outcome: la.outcome, blood: v.blood });
    this._flushDraws();
    if(!queued()) actors.push(v);
    return true;
  }
  _bestCombatEndFor(vamp){           // Majesty-class: a COMBAT card whose strike ends combat (fx.strikeCE); the mode that also unlocks is preferred
    if(this._handStrikeOnly) return null;                                            // Immortal Grapple: hand strikes only
    let best = null;
    (this.hand || []).forEach((nm, idx) => {
      const h = this.fxLookup(nm); if(!h || h.kind !== 'lib' || (h.e.t || []).indexOf('combat') < 0) return;
      const cost = (h.e.cost && h.e.cost.blood) | 0; if(cost > (vamp.blood | 0)) return;
      (h.e.modes || []).forEach(mo => { if(!mo.fx || !mo.fx.strikeCE || !this._modeUsableBy(mo, vamp)) return;
        const cand = { idx, name: h.name, cost, unlock: !!mo.fx.unlock };
        if(!best || (cand.unlock && !best.unlock)) best = cand; });
    });
    return best;
  }
  _bestReduceFor(vamps, p){          // N4c: a react-type fx.reduce card + an eligible UNLOCKED reactor (req.title vs PRINTED title); threshold amount >= 2, one per action
    if(!this.fx || !p || p.kind !== 'bleed' || (p.amount | 0) < 2 || p.reducedOnce) return null;
    for(let idx = 0; idx < this.hand.length; idx++){
      const h = this.fxLookup(this.hand[idx]); if(!h || h.kind !== 'lib' || !((h.e.t) || []).includes('react')) continue;
      const wakeOk = !!this._wakeCard();   // v0.6.67 (the combo): a wake in hand widens the pool to LOCKED reactors -- the bounce steg-6 pattern
      for(const mo of (h.e.modes || [])){
        if(!mo.fx || !mo.fx.reduce) continue;
        const needT = mo.req && mo.req.title;
        const pool = (vamps || []).filter(v => { if(!v || (v.locked && !wakeOk)) return false;
          if(!needT) return true;
          const hv = this.fxLookup(v.name);
          return hv && hv.e && String(hv.e.title || '').toLowerCase() === String(needT).toLowerCase(); });
        pool.sort((a2, b2) => ((a2.locked ? 1 : 0) - (b2.locked ? 1 : 0)));   // unlocked PREFERRED -- never spend the wake needlessly
        if(!pool.length) continue;
        return { idx, name: h.name, n: mo.fx.reduce, vamp: pool[0] };
      }
    }
    return null;
  }
  async _commitReduce(p, rd){        // N4c: the reducer IS the payer -- p.amount drops bot-locally, the log line is table-truth; then Pass closes my window. v0.6.67: async for the wake pacing beat
    const needsWake = !!rd.vamp.locked;                  // re-derived from CURRENT state (the bounce precedent) -- the vampire may have (un)locked under the think delay
    const wk = needsWake ? this._wakeCard() : null;
    const wkCost = (wk && wk.cost && wk.cost.blood) || 0;
    if((needsWake && !wk) || (rd.vamp.blood | 0) < wkCost){
      this.o.log('reduce reconsidered (wake or blood no longer available) \u2014 re-evaluating'); return this._reactWindow();
    }
    if(wk){                                              // v0.6.67 (the combo): the wake play -- _commitBounce's sequence VERBATIM; the reactor STAYS locked ('as though unlocked' is the rule)
      this.hand.splice(wk.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
      this._toAsh(wk.name);
      if(wkCost) rd.vamp.blood = Math.max(0, (rd.vamp.blood | 0) - wkCost);
      this.fxClone({ name: wk.name, kind: 'lib' }, 'may react as though unlocked', { actor: rd.vamp });
      this.send({ t: 'log', html: '<b>' + esc(rd.vamp.name) + '</b> plays <b>' + esc(wk.name) + '</b>: may react as though unlocked.' });
      this._emitPlay(wk.name, 'wake', rd.vamp.name);
      await this._pace();
    }
    const j = this.hand.indexOf(rd.name);   // v0.4.2: re-anchor by name after the think delay (and the wake splice just above shifts it AGAIN)
    if(j < 0 || this.pending !== p){ this.o.log('reduce reconsidered \u2014 re-evaluating'); return this._reactWindow(); }
    this.hand.splice(j, 1); this._drawOwed = (this._drawOwed || 0) + 1;
    this._toAsh(rd.name);
    this._emitPlay(rd.name, 'react-reduce', rd.vamp.name);
    p.amount = Math.max(0, (p.amount | 0) - rd.n);
    p.reducedOnce = true;
    this.fxClone({ name: rd.name, kind: 'lib' }, 'reduces the bleed by ' + rd.n, { actor: rd.vamp });
    this.send({ t: 'log', html: '<b>' + esc(rd.vamp.name) + '</b> plays <b>' + esc(rd.name) + '</b> \u2014 reduces the bleed by ' + rd.n + ' (now ' + p.amount + ').' });

    this.push();
    this.say('Pass');
  }
  _strengthBonus(vamp){              // N4b: sum attached fx.strengthBonus -- strength IS base hand-strike damage
    let b = 0;
    ((vamp && vamp.attached) || []).forEach(id => { const c = this.board.find(x => x && x.id === id); if(!c || this._outOfPlay(c)) return;
      const h = this.fxLookup(c.name); if(h && h.kind === 'lib'){
        let m = 0;   // the PLAYED mode isn't stored on the board card -- but it's DERIVABLE from the bearer: richest-usable, the same pick the finder made (54a's own catch)
        (h.e.modes || []).forEach(mo => { if(mo.fx && mo.fx.strengthBonus && this._modeUsableBy(mo, vamp) && mo.fx.strengthBonus > m) m = mo.fx.strengthBonus; });
        b += m;
      } });
    return b;
  }
  _bestStrengthFor(vamp){            // N4b: an attachable strength action -- richest usable mode wins; one per vampire per the card's own text
    if(!this.fx || !vamp) return null;
    if(this._strengthBonus(vamp) > 0) return null;   // 'A vampire can have only one Preternatural Strength' -- generalized to the key
    if((vamp.blood | 0) < 2) return null;            // cost 1 blood, leave >= 1 (the employ guard)
    for(let idx = 0; idx < this.hand.length; idx++){
      const h = this.fxLookup(this.hand[idx]); if(!h || h.kind !== 'lib' || !((h.e.t) || []).includes('action')) continue;
      let best = null, st = 0;
      (h.e.modes || []).forEach(mo => { if(!mo.fx || !mo.fx.strengthBonus || !this._modeUsableBy(mo, vamp)) return;
        if(!best || mo.fx.strengthBonus > best.fx.strengthBonus) best = mo;
        if(typeof mo.fx.actStealth === 'number' && mo.fx.actStealth > st) st = mo.fx.actStealth; });
      if(!best) continue;
      return { idx, name: h.name, kind: 'strength', bonus: best.fx.strengthBonus, at: best.at, st, n: 1, costBlood: ((h.e.cost && h.e.cost.blood) | 0) || 1 };
    }
    return null;
  }
  _maybeRebelBlood(blocker, actingName){   // N4a: Rebel -- 'Once each turn, if they block a titled vampire ... gains 1 blood before block resolution.' Printed titles are fxLookup-readable; acquired titles stay politics-scope. Extracted from _commitBlock's success commit for direct testability.
    if(this._rebelUsedThisTurn || !blocker || !actingName) return;
    const hasRebel = (blocker.attached || []).some(id => { const c = this.board.find(b => b && b.id === id); if(!c || this._outOfPlay(c)) return false;
      const hc = this.fxLookup(c.name); return hc && hc.kind === 'lib' && (hc.e.modes || []).some(mo => mo.fx && mo.fx.rebelBlood); });
    if(!hasRebel) return;
    const ha = this.fxLookup(actingName);
    if(!ha || !ha.e || !ha.e.title) return;
    const capR = (typeof blocker.cap === 'number') ? blocker.cap : 99;
    blocker.blood = Math.min(capR, (blocker.blood | 0) + 1);
    this._rebelUsedThisTurn = true; this.push();
    this.note('Trainbot: Rebel \u2014 ' + blocker.name + ' gains 1 blood (blocking the titled ' + actingName + ').');
  }
  _maybeWarsawRefresh(v){            // N4a: after a SUCCESSFUL UNDIRECTED action by a clan-Nosferatu vampire -- lock the ready Station, unlock the actor (pure tempo)
    if(!v) return;
    const h = this.fxLookup(v.name);
    if(!h || !h.e || h.e.clan !== 'Nosferatu') return;
    const st = this.board.find(c => { if(!c || c.kind !== 'lib' || c.zone !== 'ready' || c.locked || this._outOfPlay(c)) return false;
      const hc = this.fxLookup(c.name); return hc && hc.kind === 'lib' && (hc.e.modes || []).some(mo => mo.fx && mo.fx.warsawRefresh); });
    if(!st) return;
    st.locked = true; v.locked = false; this.push();
    if(Array.isArray(this._actorQueue)) this._actorQueue.push(v);   // v0.6.64 (B-fix): the revisit -- the index loop reaches this and the vampire acts AGAIN (self-limiting: the Station locks per refresh)
    this.note('Trainbot: Warsaw Station locks \u2014 ' + v.name + ' unlocks (refresh \u2014 acts again).');
    this._emit('warsaw-refresh', { vamp: v.name });
  }
  _maybeWarsawRescue(){              // N4a: burn the Station (locked or not) to move a torpored Nosferatu of mine to ready -- cost-free per the text; checked at my unlock
    const st = this.board.find(c => { if(!c || c.kind !== 'lib' || c.zone === 'burned' || c.zone === 'ash') return false;
      const hc = this.fxLookup(c.name); return hc && hc.kind === 'lib' && (hc.e.modes || []).some(mo => mo.fx && mo.fx.warsawRescue); });
    if(!st) return;
    const vt = this.board.find(c => { if(!c || c.kind !== 'crypt' || c.zone !== 'torpor') return false;
      const h = this.fxLookup(c.name); return h && h.e && h.e.clan === 'Nosferatu'; });
    if(!vt) return;
    st.zone = 'burned';
    vt.zone = 'ready'; const pos = this._openSlot('ready', vt); vt.x = pos.x; vt.y = pos.y;
    this._emit('recover', { vamp: vt.name, via: 'warsaw' });   // A2b: torpor time's other end
    this.push();
    this.note('Trainbot: Warsaw Station burns \u2014 ' + vt.name + ' rises from torpor.');
    this._emit('warsaw-rescue', { vamp: vt.name });
  }
  _rolloverPredPressure(){           // v1.1: decide reads LAST round's felt pressure; the counter rolls at my unlock
    this._predPressureLast = this._predPressure | 0;
    this._predPressure = 0;
  }
  _tableThreat(seat){                // v1.1: who is the table threat -- pub-readable only (ready count/caps + pool deficit from the nominal 30). v0.6.57: reads this.table[seat].pub -- the source _onBoard actually WRITES and _bestNeutralizeTarget already reads; players[] is the roster, never carries pubs (the fixture had codified the wrong structure)
    const tb = this.table && this.table[seat];
    if(!tb || !tb.pub) return 0;
    let t = 0;
    (tb.pub.cards || []).forEach(c => { if(c && c.kind === 'crypt' && c.zone === 'ready'){
      const h = this.fxLookup(c.name); t += 2 + 0.3 * ((h && h.e && h.e.cap) | 0); } });
    const pool = (typeof tb.pub.pool === 'number') ? tb.pub.pool : 30;
    t += Math.max(0, 30 - pool) * 0.15;
    return t;
  }
  _rushCandidates(seat){             // v1.1: that seat's ready vampires. v0.6.57: pub from this.table[seat] (the _onBoard store, the M1 source); owner name from the roster
    const tb = this.table && this.table[seat];
    const p = (this.players || []).find(q => q && q.seat === seat);
    return ((((tb && tb.pub && tb.pub.cards)) || []).filter(c => c && c.kind === 'crypt' && c.zone === 'ready'))
      .map(c => ({ name: c.name, owner: (p && p.name) || this.seatName(seat), seat, blood: (c.blood | 0) }));
  }
  _rushScore(vamp, c){               // v1.1: value x feasibility - chump + Fame bonus (the frozen baseline, rush-theory section 3)
    const h = this.fxLookup(c.name); const e = (h && h.e) || {};
    const cap = e.cap | 0; const d = e.disc || { all: [], sup: [] };
    const supDA = (d.sup || []).some(x => x === 'dom' || x === 'aus');
    const basDA = !supDA && (d.all || []).some(x => x === 'dom' || x === 'aus');
    let sc = cap + (supDA ? 3 : 0) + (basDA ? 1.5 : 0);
    const dmg = ((this._bestStrikeFor(vamp) || {}).n || 1) + this._borneEnvFor(vamp) + this._strengthBonus(vamp);   // N4b: torpor-reach honesty
    if(c.blood > dmg + 1) sc *= 0.5;                       // out of torpor reach this combat -- soft, not a ban
    const supAny = ((d.sup || []).length > 0);
    if(c.blood <= 1 && cap <= 3 && !supAny) sc *= 0.15;    // the Primer's chump lesson: empty smalls repel rushes
    if(this._famedSeen && this._famedSeen[c.name]) sc += 8; // the Fame-synergy pool bridge
    return sc;
  }
  _bestCreepFor(){                   // N3: Creeping Sabotage in hand (fx.preyBurnPerCopy) -- its OWN finder so the bare-actStealth misplay guard stays intact
    if(!this.fx) return null;
    for(let idx = 0; idx < this.hand.length; idx++){
      const h = this.fxLookup(this.hand[idx]); if(!h || h.kind !== 'lib' || !((h.e.t) || []).includes('action')) continue;
      const mo = (h.e.modes || []).find(m => m.fx && m.fx.preyBurnPerCopy);
      if(!mo) continue;
      let st = 0; (h.e.modes || []).forEach(m => { if(m.fx && typeof m.fx.actStealth === 'number' && m.fx.actStealth > st) st = m.fx.actStealth; });
      return { idx, name: h.name, kind: 'creep', st, n: 1 };
    }
    return null;
  }
  _fameTorporHook(vamp){             // N3: Fame -- 3 pool on EACH torpor entry of a famed vampire I control (the yo-yo's engine half). v0.6.54 (A1): ALWAYS emits 'torpor' first -- the arena's doctrine metric rides the same three flip sites
    if(!vamp) return;
    const famed = !!(this._famedMine && this._famedMine.has(vamp.name));
    this._emit('torpor', { vamp: vamp.name, famed });
    if(famed){
      this.pool = Math.max(0, this.pool - 3);
      this.note('Trainbot: Fame \u2014 ' + vamp.name + ' hits torpor, 3 pool burned.');
      if(this.pool <= 0 && !this.out){ this._oust(false); return; }   // v0.6.140: Fame can oust ME -- serie-bal3 run 7: ventrue went to 0 pool on its own turn, played on for four more actions and was ousted only when its own referendum resolved
    }
    const fx = this._cryptFxOf(vamp.name);   // VB: the Julius-class burnOnTorpor rider -- printed "If Julius goes into torpor, burn him": he DOES enter torpor (so Fame's on-entry trigger fires first, above), THEN the burn lands
    if(fx && fx.burnOnTorpor){
      vamp.zone = 'burned';
      this.note('Trainbot: ' + vamp.name + ' goes into torpor and is BURNED (his own curse).');
    }
    if(famed || (fx && fx.burnOnTorpor)) this.push();
  }
  _menaceUnlockEngine(){             // N3: the unlock-phase menace settle -- Creeping line, Jack tick, Jack pay, Fame drain
    if(!this.started || this.out) return;
    const myReady = nm => this.board.filter(c => c && c.kind === 'lib' && c.zone === 'ready' && !this._outOfPlay(c) && c.name === nm);
    /* v0.6.71 (#8): the settle is KEY-driven per-NAME groups now (the fourth
       scanner-lesson sibling: the finder read fx.preyBurnPerCopy, this engine
       was name-locked). mo.fx.burnCap caps a name's summed per-turn burn
       ('only 1 pool each turn with Army of Rats cards'). The Creeping line
       stays BYTE-IDENTICAL (frozen L12.creep); future names inherit the FORM,
       their victim regex landing additively at curation. */
    const burnGroups = {};
    this.board.forEach(c => { if(!c || c.kind !== 'lib' || c.zone !== 'ready' || this._outOfPlay(c)) return;
      const h = this.fxLookup(c.name); if(!h || h.kind !== 'lib') return;
      const mo = (h.e.modes || []).find(m2 => m2.fx && m2.fx.preyBurnPerCopy); if(!mo) return;
      const g = burnGroups[c.name] = burnGroups[c.name] || { n: 0, per: (mo.fx.preyBurnPerCopy | 0) || 1, cap: (typeof mo.fx.burnCap === 'number') ? mo.fx.burnCap : Infinity };
      g.n++; });
    for(const nm of Object.keys(burnGroups)){
      const g = burnGroups[nm];
      const burn = Math.min(g.n * g.per, g.cap);
      if(burn <= 0) continue;
      const preyN = this.seatName(this.preySeat());
      this.send({ t: 'log', html: nm + ' (x' + g.n + '): <b>' + esc(preyN) + '</b> burns ' + burn + ' pool.' });
      this.note('Trainbot: ' + nm + ' ticks \u2014 ' + preyN + ' burns ' + burn + '.');
    }
    const jack = myReady('Smiling Jack, The Anarch')[0];
    if(jack && this.pool > 0){       // MANDATORY wording ('move 1 counter from your pool') -- the only guard is having pool at all
      /* The counters DUALITY: _addCounter is the NUMBER utility (DotS/Ashur,
         own-side burnAtCounters) -- but cleanCard relays ONLY array counters,
         and Jack's VICTIM side reads the pub. A relayable token array it is. */
      jack.counters = Array.isArray(jack.counters) ? jack.counters : [];
      this.pool -= 1; jack.counters.push('pool'); this.push();
      this.note('Trainbot: Smiling Jack ticks \u2014 ' + jack.counters.length + ' counter(s).');
    }
    let jackOwed = 0;                // the VICTIM side: self-serve, correctly timed (it IS my unlock), pub-relayed counters
    Object.entries(this.table || {}).forEach(([sk, t]) => { const sn = parseInt(sk, 10); if(!t || !t.pub || sn === this.seat) return;   // v0.6.104 (#8): pubs live in this.table (the _onBoard store) -- players[] is the roster and never carries them; the old read made every opponent's Jack free
      (t.pub.cards || []).forEach(c => { if(c && c.kind !== 'crypt' && c.zone === 'ready' && c.name === 'Smiling Jack, The Anarch') jackOwed += ((c.counters || []).length); }); });
    if(jackOwed > 0){
      const aggrJ = (this.persona && typeof this.persona.aggression === 'number') ? this.persona.aggression : 1.0;   // v0.6.104 (#10): the EFFECTIVE knobs (object personas, arena overrides) -- PERSONAS[this.o.persona] was undefined for anything but a named string
      const jackFloor = Math.round(4 * aggrJ);   // v0.6.71 (#8): aggression-scaled on the persona table's REAL 0.8-1.2 multiplier scale -- novice 3 / grinder 4 (the old flat behavior exactly) / shark 5: vampires-as-tools pay pool late, the reckless pay easily
      if(this.pool >= jackFloor){ this.pool = Math.max(0, this.pool - jackOwed); this.note('Trainbot: Smiling Jack \u2014 pays ' + jackOwed + ' pool.'); }
      else {
        let v = null; this.board.forEach(c => { if(c && c.kind === 'crypt' && c.zone === 'ready' && (!v || (c.blood | 0) > (v.blood | 0))) v = c; });
        if(v){ v.blood = Math.max(0, (v.blood | 0) - jackOwed); this.note('Trainbot: Smiling Jack \u2014 ' + v.name + ' burns ' + jackOwed + ' blood.'); }
        else { this.pool = Math.max(0, this.pool - jackOwed); this.note('Trainbot: Smiling Jack \u2014 pays ' + jackOwed + ' pool (no vampire).'); }
      }
      this.push();
    }
    if(this._famedMine && this._famedMine.size){   // the 1/unlock drain -- OWN-unlock settle only (documented UNDER-claim v1)
      let drained = 0;
      this._famedMine.forEach(nm => { if(this.board.some(c => c && c.kind === 'crypt' && c.zone === 'torpor' && c.name === nm)) drained++; });
      if(drained > 0){ this.pool = Math.max(0, this.pool - drained); this.push(); this.note('Trainbot: Fame drains ' + drained + ' (own-unlock settle).'); }
    }
  }
  _bestRushTargetFor(vamp){          // v1.1 (rush-theory section 3): the DIRECTION CHOOSER with tunable weights + the counterfactual log
    const press = this._predPressureLast | 0;
    const wB = ((this.o.rushBackWeight ?? 1)) * (1 + Math.min(3, press) * 0.5);   // felt pressure scales the backrush appetite
    const wF = (this.o.rushFwdWeight ?? 1);
    const wC = (this.o.crossRushWeight ?? 0);
    const evalDir = (seat) => { let b = null;
      for(const c of this._rushCandidates(seat)){ const r = this._rushScore(vamp, c); if(!b || r > b.raw) b = Object.assign({ raw: r }, c); }
      return b; };
    const bPred = evalDir(this.predSeat());
    const bPrey = evalDir(this.preySeat());
    let bCross = null;
    (this.players || []).forEach(p => { if(!p || p.seat === this.seat || p.seat === this.preySeat() || p.seat === this.predSeat() || p.out) return;
      const c = evalDir(p.seat); if(c && (!bCross || c.raw > bCross.raw)) bCross = c; });
    if(bCross && wC === 0 && (!bPred || bCross.raw > bPred.raw) && (!bPrey || bCross.raw > bPrey.raw)){
      this._cfCross = (this._cfCross | 0) + 1;             // R-Q5's dataset: the doctrine silenced a raw-threat top pick
      const tPred = this._tableThreat(this.predSeat()), tPrey = this._tableThreat(this.preySeat()), tCross = this._tableThreat(bCross.seat);   // v0.6.58: the R-Q5 dominance triple -- _tableThreat's consumer; the trace carries the gate variable the sweep analyzes
      this._emit('rush-counterfactual', { target: bCross.name, owner: bCross.owner, raw: bCross.raw, tPred, tPrey, tCross });
      this.o.log('rush counterfactual: cross-table ' + bCross.name + ' (raw ' + bCross.raw.toFixed(1) + ') suppressed at weight 0');
    }
    const opts = [];
    if(bPred) opts.push(Object.assign({ w: bPred.raw * wB, dir: 'back' }, bPred));
    if(bPrey) opts.push(Object.assign({ w: bPrey.raw * wF, dir: 'fwd' }, bPrey));
    if(bCross && wC > 0) opts.push(Object.assign({ w: bCross.raw * wC, dir: 'cross' }, bCross));
    let best = null;
    for(const o2 of opts) if(o2.w > 0 && (!best || o2.w > best.w || (o2.w === best.w && o2.dir === 'fwd'))) best = o2;   // tie prefers FORWARD (the race clock)
    return best;
  }
  _bestRushFor(vamp){                // N2: a usable rush card (fx.rush) + a live target
    if(!this.fx) return null;
    for(let idx = 0; idx < this.hand.length; idx++){
      const h = this.fxLookup(this.hand[idx]); if(!h || h.kind !== 'lib' || !((h.e.t) || []).includes('action')) continue;
      let ok2 = false, lockT = false;
      (h.e.modes || []).forEach(mo => { if(mo.fx && mo.fx.rush && this._modeUsableBy(mo, vamp)){ ok2 = true; if(mo.fx.lockTarget) lockT = true; } });
      if(!ok2) continue;
      const target = this._bestRushTargetFor(vamp);
      if(!target) return null;
      return { idx, name: h.name, kind: 'rush', target, lockTarget: lockT, st: 0, n: 1, exp: this._rushExpectation(vamp), myBlood: vamp.blood | 0 };   // v0.6.74: the expectation rides the pick
    }
    return null;
  }
  _bestUnlockReactFor(vamp, when){   // N1: a usable TRUE-unlock reaction for this vampire in this WINDOW -- fx.unlock, mode.when === when (curated riders; bare fx.unlock cannot tell Guard Dogs from Cats' Guidance)
    if(!this.fx) return null;
    for(let idx = 0; idx < this.hand.length; idx++){
      const h = this.fxLookup(this.hand[idx]); if(!h || h.kind !== 'lib' || !((h.e.t) || []).includes('react')) continue;
      let found = null;
      for(const mo of (h.e.modes || [])){
        if(!mo.fx || !mo.fx.unlock || mo.when !== when) continue;
        if(!this._modeUsableBy(mo, vamp) || !this._titleOk(h, vamp)) continue;
        const cB = ((h.e.cost && h.e.cost.blood) || 0) + (mo.fx.payBlood | 0); if((vamp.blood | 0) < cB) continue;   // v0.6.139: fx.payBlood = the price of THIS mode (Second Tradition's locked route burns 1 blood; its plain +2 is free)
        if(!found || mo.fx.maneuver) found = { idx, name: h.name, cost: cB ? { blood: cB } : null, maneuverGrant: !!mo.fx.maneuver, intercept: mo.fx.intercept | 0 };   // v0.6.28's lesson, third appearance: a later RICHER usable mode overrides the earlier plain one (superior-if-able)
      }
      if(found) return found;
    }
    return null;
  }
  async _playUnlockReact(vamp, un){  // N1: splice/ash/pay + TRULY unlock (wake's stronger sibling) + the [ANI] maneuver-grant rider
    await this._pace();
    this.hand.splice(un.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
    this._toAsh(un.name);
    this._emitPlay(un.name, 'react-unlock', vamp && vamp.name);   // v0.6.139: this spend left no trace row (CLAUDE.md 43c)
    if(un.cost && un.cost.blood) vamp.blood = Math.max(0, (vamp.blood | 0) - un.cost.blood);
    vamp.locked = false;
    if(un.maneuverGrant) this._reactManeuverGrant = true;
    this.fxClone({ name: un.name, kind: 'lib' }, 'unlocks ' + vamp.name, { actor: vamp });
    this.send({ t: 'log', html: '<b>' + esc(vamp.name) + '</b> plays <b>' + esc(un.name) + '</b>: unlocks.' });
    this.push();
  }
  async _maybePostBlockUnlock(blocker){   // N1: Cats' Guidance -- after block resolution, a LOCKED blocker with a postBlock unlock refreshes the wall
    if(!blocker || !blocker.locked || blocker.zone !== 'ready' || this.out) return;
    const un = this._bestUnlockReactFor(blocker, 'postBlock');
    if(!un) return;
    await this._playUnlockReact(blocker, un);
    this.note('Trainbot: ' + blocker.name + ' unlocks (' + un.name + ') \u2014 the wall refreshes.');
  }
  _wakeCard(){                       // a usable "may block/react as though untapped" card (On the Qui Vive & co) -- cost-free, disc-free today, but read cost/req anyway for future cards in this family. v0.6.13 (restlist read): TYPE-FILTERED to react/mod -- Aye (a MASTER granting wake) and No Secrets From the Magaji (an ACTION) carry fx.wake as grants and were playable from hand in the reaction window
    for(let idx = 0; idx < this.hand.length; idx++){
      const h = this.fxLookup(this.hand[idx]); if(!h || h.kind !== 'lib' || !(h.e.t || []).some(t => t === 'react' || t === 'mod')) continue;
      const mo = (h.e.modes || []).find(m => m.fx && m.fx.wake);
      if(mo) return { idx, name: h.name, cost: h.e.cost || null };
    }
    return null;
  }
  _wakeCardFor(vamp){                // v0.6.120: the wake THIS vampire can actually play -- _wakeCard() is vampire-blind (written when every wake was discipline-free); Eyes of Argus wakes only at superior Auspex, so the blind finder let any sleeper 'play' it. Discipline gate via _modeUsableBy, blood cost checked.
    for(let idx = 0; idx < this.hand.length; idx++){
      const h = this.fxLookup(this.hand[idx]); if(!h || h.kind !== 'lib' || !(h.e.t || []).some(t => t === 'react' || t === 'mod')) continue;
      const mo = (h.e.modes || []).find(m => m.fx && m.fx.wake && this._modeUsableBy(m, vamp));
      if(!mo) continue;
      const cB = (h.e.cost && h.e.cost.blood) || 0; if(cB > (vamp.blood | 0)) continue;
      return { idx, name: h.name, cost: h.e.cost || null };
    }
    return null;
  }
  _wakeBlockers(p){                  // v0.6.120 (THE WAKE BLOCK): LOCKED bodies that could block right now behind a wake they can play -- the bare block's second bench
    return this.board.filter(c => c.zone === 'ready' && c.kind === 'crypt' && c.locked && !(p && p.attempted && p.attempted.has(c.id)) && !(this._pentexVamp && c.name === this._pentexVamp) && !this._cryptCannotBlock(c, p && p.actingVampName) && !!this._wakeCardFor(c));
  }
  _wakeBlockersAfter(v){ return !!this._wakeCardFor(v); }                         // would this body still be a blocker after it locks? (it holds a wake it can play)
  _wakesInHand(){ let n = 0; for(const c of this.hand){ const h = this.fxLookup(c); if(!h || h.kind !== 'lib' || !(h.e.t || []).some(t => t === 'react' || t === 'mod')) continue;
      if((h.e.modes || []).some(m => m.fx && m.fx.wake)) n++;
      else { const lb = (h.e.modes || []).find(m => m.when === 'lockedBlock' && m.fx && m.fx.unlock);   // v0.6.142: Second Tradition-class IS a wake (and an intercept) for a body that can pay for it and holds the title -- the plan, the critical pool and the act-again pricing all count wakes here
        if(lb && (this.board || []).some(v => v && v.kind === 'crypt' && v.zone === 'ready' && (v.blood | 0) > (lb.fx.payBlood | 0) && this._titleOk(h, v))) n++; } }
    return n; }
  _titleOk(h, vamp){                 // v0.6.139: a card-level TITLE requirement on a reaction ('Requires a prince or justicar' -- Second Tradition) against the vampire's PRINTED title. Until now the intercept finder never looked: any vampire could 'play' Second Tradition.
    const rq = h && h.e && h.e.req; if(!rq || !rq.title) return true;
    const cv = vamp && this.fxLookup(vamp.name); const t = String((cv && cv.kind === 'crypt' && cv.e.title) || '').toLowerCase(); if(!t) return false;
    return Array.isArray(rq.titles) && rq.titles.length ? rq.titles.map(x => String(x).toLowerCase()).includes(t) : true;
  }
  _bestInterceptFor(vamp, played){   // mirrors _bestStealthFor's shape/contract exactly, for the defending side. v0.6.13 (restlist read): TYPE-FILTERED to react/mod -- 72 non-matching cards (Bowl of Convergence-class equipment, action grants, allies) carry mode fx.intercept; the v0.6.12 sweep covered the modifier+combat windows but missed the REACTION family's three finders
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).some(t => t === 'react' || t === 'mod')) return;
      if(played && played.has(FX_NORM(h.name))) return;   // once-per-ACTION reaction ledger
      if(!this._titleOk(h, vamp)) return;   // v0.6.139
      (h.e.modes || []).forEach(mo => {
        const ic = mo.fx && mo.fx.intercept;
        if(mo.when === 'lockedBlock') return;   // v0.6.139: the locked-only mode is the sleeper route's, never a plain intercept
        if(typeof ic === 'number' && this._modeUsableBy(mo, vamp) &&
           (vamp.blood | 0) >= ((h.e.cost && h.e.cost.blood) || 0) && (!best || ic > best.s))
          best = { idx, name: h.name, s: ic, cost: h.e.cost || null };
      });
    });
    return best;
  }
  _bestBounceFor(vamps, played){     // Deflection & co: find a usable bounce card (redirect target is decided by the caller). v1.4.3: also returns `lock` from the mode (true for [dom]-style "Lock this reacting vampire", absent/undefined for [DOM]-style "do not lock") so _commitBounce can decide whether to lock. steg 6 (16 July, rulebook glossary): a WAKE in hand widens the candidate pool to LOCKED vampires too -- "a vampire that wakes during an action can ... play reaction cards as though unlocked for the duration of the action". An UNLOCKED candidate is always preferred (never spend the wake needlessly); `needsWake` tells _commitBounce to play the wake first.
    let best = null;
    const wk = this._wakeCard();
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).some(t => t === 'react' || t === 'mod')) return;   // v0.6.13: reaction-family type filter (Contingency Planning, a MASTER, carries fx.bounce)
      if(played && played.has(FX_NORM(h.name))) return;
      (h.e.modes || []).forEach(mo => {
        if(best || !(mo.fx && mo.fx.bounce)) return;
        const usable = vv => this._modeUsableBy(mo, vv) && (vv.blood | 0) >= ((h.e.cost && h.e.cost.blood) || 0);
        const vUn = vamps.find(vv => !vv.locked && usable(vv));
        const v = vUn || (wk ? vamps.find(vv => vv.locked && usable(vv)) : null);
        if(v) best = { idx, name: h.name, cost: h.e.cost || null, vamp: v, lock: mo.lock, needsWake: !vUn };   // v1.4.3: mo.lock carried through (true = lock, undefined/absent = don't lock; mirrors cardfx's own three-state)
      });
    });
    return best;
  }
  _bestDodgeFor(vamp){               // steg 6 (16 July): a usable Strike:-dodge card (fx.dodge) -- the deck's ENTIRE combat suite (Dodge x10) had zero consumers until now. Rules: a dodge is a STRIKE choice; a successful dodge means no damage in EITHER direction this round (v1 one-round model: dealt 0, taken 0).
    if(this._handStrikeOnly) return null;   // v0.6.28 fix (found while verifying the half-finished Immortal Grapple work, source-verified independently): "You can not... use any Dodges... or any other strike that is not a hand strike" -- dodge is explicitly banned while Immortal Grapple is active, not merely one option among others
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('combat')) return;   // v0.6.12: combat window plays combat cards -- 9 non-combat carriers (Creep Show the MASTER, allies with built-in dodge, equipment) were offerable from hand
      (h.e.modes || []).forEach(mo => {
        if(best || !(mo.fx && mo.fx.dodge)) return;
        if(!this._modeUsableBy(mo, vamp)) return;
        if((vamp.blood | 0) < ((h.e.cost && h.e.cost.blood) || 0)) return;
        best = { idx, name: h.name, cost: h.e.cost || null };
      });
    });
    return best;
  }
  _bestStrikeFor(vamp){              // a usable strike card, else the rulebook default (hands, handled by the caller)
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('combat')) return;   // v0.6.12: 24 non-combat strike carriers (.44 Magnum-class weapons -- attached-equipment consumption is a FUTURE board-scan, not a hand play)
      if(h.e.req && (h.e.req.beforeRangeDetermined || h.e.req.notFirstRound)) return;   // still genuinely unverifiable in v1 -- no "before Determine Range" window distinct from the maneuver step, no round counter
      if(h.e.req && h.e.req.rangeClose && this._range !== 'close') return;   // v0.6.24: CASHES IN the earlier exclusion now that this._range is tracked -- Blood Fury/Loving Agony become playable exactly when the round is actually at close range, not blanket-excluded forever
      if(h.e.req && h.e.req.rangeLong && this._range !== 'long') return;
      (h.e.modes || []).forEach(mo => {
        const st = mo.fx && mo.fx.strike;
        if(typeof st === 'number' && !mo.fx.maneuver && !mo.fx.press && (!this._handStrikeOnly || mo.fx.handStrike) && this._modeUsableBy(mo, vamp) &&   // v0.6.20: co-located maneuver/press = a bundled ability, not a clean strike bonus (Slam's superior, Lam Into) -- same guard as steal's, conservatively also excludes 2 false positives (Pounce, Taming the Beast) where "press" describes an unrelated consequence, not a granted option; a missed tag over a wrong one. v0.6.28 (Immortal Grapple): while _handStrikeOnly is active, only handStrike-tagged modes qualify -- source-verified "strikes that are not hand strikes cannot be used this round (by either combatant)"
           (vamp.blood | 0) >= ((h.e.cost && h.e.cost.blood) || 0) && (!best || st > best.n))
          best = { idx, name: h.name, n: st, cost: h.e.cost || null };
      });
    });
    const eqSt = this._equipCombatOption(vamp, 'strike');   // E1: the FUTURE arrived -- the .44's board-granted strike (fx.strike), never under Immortal Grapple, ranged works at any range
    if(eqSt && (!best || eqSt.n > best.n)) best = { idx: -1, name: eqSt.name, n: eqSt.n, cost: null, fromEquip: true };
    return best;
  }
  _bestStealStrikeFor(vamp){         // v0.6.19 (Johan's combat GO, steal-blood family, source-verified vekn.net 19 July): a usable "steal N blood/life" strike -- REPLACES damage entirely (rulebook: "does not count as damage"), so this is NOT fx.strike's damage-bonus shape at all; the caller sets dealt=0 for the frozen strike line, not this card's N. Two exclusion layers, both measured against the full 410-card Combat pool before writing this, not guessed: (a) entry-level req.beforeRangeDetermined/rangeClose/rangeLong/notFirstRound -- timing preconditions the bot's v1 single-round, no-range architecture cannot verify, fail closed exactly like req.title (83/19/17/4 cards respectively; excludes Hunger of Marduk, Donnybrook, Drain Essence); (b) mode-level: stealBlood co-located with maneuver or press in the SAME mode means a bundled multi-part ability (Diversion's "with 1 optional maneuver", Kraken's Kiss's "once each round... can strike" granted-ability-on-a-press-strike), not a clean isolated steal -- the bleed-rider guard's shape, reapplied. Call the Lamprey's ally-only inferior mode is curated empty (cardfx-curated.json), not guarded here -- a target-TYPE restriction, not a timing one.
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('combat')) return;
      if(h.e.req && (h.e.req.beforeRangeDetermined || h.e.req.notFirstRound)) return;
      if(h.e.req && h.e.req.rangeClose && this._range !== 'close') return;   // v0.6.24: same cash-in as _bestStrikeFor
      if(h.e.req && h.e.req.rangeLong && this._range !== 'long') return;
      (h.e.modes || []).forEach(mo => {
        const st = mo.fx && mo.fx.stealBlood;
        if(typeof st !== 'number' || mo.fx.maneuver || mo.fx.press || (this._handStrikeOnly && !mo.fx.handStrike)) return;   // v0.6.28 (Immortal Grapple): every measured steal-blood card is "Strike, ranged" or similar -- NONE are handStrike-tagged, so this correctly excludes ALL of them while the restriction is active, not a guess
        if(this._modeUsableBy(mo, vamp) && (vamp.blood | 0) >= ((h.e.cost && h.e.cost.blood) || 0) && (!best || st > best.n))
          best = { idx, name: h.name, n: st, cost: h.e.cost || null };
      });
    });
    return best;
  }
  _preventXFor(prevent, taken, vamp){   // v0.6.142: how much blood Hidden Strength-class pays on top of its free floor -- the rest of the incoming hit, never the vampire's last blood
    if(!prevent || !prevent.x || typeof prevent.n !== 'number') return 0;
    return Math.max(0, Math.min((taken | 0) - prevent.n, (vamp.blood | 0) - 1));
  }
  _bestPreventFor(vamp){             // a usable damage-prevention card for MY incoming hit (v1: assumes 1, the rulebook default)
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('combat')) return;   // v0.6.12: 22 non-combat prevent carriers (Blood Shield-class equipment, action-card armors)
      (h.e.modes || []).forEach(mo => {
        const pv = mo.fx && mo.fx.prevent;
        if(pv === undefined || !this._modeUsableBy(mo, vamp) || (vamp.blood | 0) < ((h.e.cost && h.e.cost.blood) || 0)) return;
        const val = pv === 'all' ? 999 : pv;
        if(!best || val > best._val || (val === best._val && mo.fx.preventX && !best.x)) best = { idx, name: h.name, n: pv, _val: val, cost: h.e.cost || null, x: !!mo.fx.preventX };   // v0.6.142: x = 'pay X blood for X more' (Hidden Strength)
      });
    });
    return best;
  }
  _bestTasteFor(vamp){               // v0.6.21 (Johan's combat GO, Taste of Vitae -- completing the half-finished parser found via standing-question review, 19 July): a usable "gains blood equal to what the opponent LOST this round" end-of-round card. Rulebook restrictions modeled: "not usable by a vampire being burned or going to torpor" is the CALLER's job (checked against MY OWN unmended>0 before this is ever invoked, not here -- this finder only knows about hand/discipline/cost); "only one each round" is automatically satisfied by the v1 single-round architecture (this finder, and the hook that calls it, only ever run once per combat today -- a future multi-round session would need an explicit once-per-round ledger, same shape as the per-action `played` set).
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('combat')) return;
      (h.e.modes || []).forEach(mo => {
        if(!mo.fx || !mo.fx.gainOppLoss || !this._modeUsableBy(mo, vamp) || (vamp.blood | 0) < ((h.e.cost && h.e.cost.blood) || 0)) return;
        if(!best) best = { idx, name: h.name, cost: h.e.cost || null };   // no numeric N to compare -- the gain is whatever the opponent announces, not a printed card value
      });
    });
    return best;
  }
  _bestPressFor(vamp){               // v0.6.22 (Johan's combat GO, the multi-round loop -- Press): the SIMPLEST press shape only (Apportation: standalone, no bundled strike/steal, no third-party target) -- source-verified 19 July that press is OPTIONAL by default convention (Talbot's Chainsaw is the documented mandatory exception, not the rule), so this finder's presence just means "I COULD press", the decide-shaped "do I WANT to" choice lives in the caller (_resolveCombat), same split as _bestBloodStockFor/grinderReadyTarget. Excludes modes that ALSO carry maneuver/strike/stealBlood (a bundled ability like Grasp of the Python or Slam's superior -- documented in the combat plan §5.6, not built) and the same four unverifiable-precondition req flags every other v2 finder already excludes.
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('combat')) return;
      if(h.e.req && (h.e.req.beforeRangeDetermined || h.e.req.notFirstRound)) return;
      if(h.e.req && h.e.req.rangeClose && this._range !== 'close') return;   // v0.6.24: same cash-in, applied consistently even though no CURRENT press card in the family actually carries a range req
      if(h.e.req && h.e.req.rangeLong && this._range !== 'long') return;
      (h.e.modes || []).forEach(mo => {
        if(!mo.fx || !mo.fx.press || mo.fx.maneuver || typeof mo.fx.strike === 'number' || mo.fx.stealBlood || mo.fx.restrictHandStrike) return;   // v0.6.28 fix (found while verifying the half-finished Immortal Grapple work): Immortal Grapple's [POT] mode bundles press WITH restrictHandStrike -- without this exclusion, a press-decision step at end-of-round could mistake it for a plain press card and play it for that reason alone, silently also imposing the hand-strike restriction the caller never intended
        if(this._modeUsableBy(mo, vamp) && (vamp.blood | 0) >= ((h.e.cost && h.e.cost.blood) || 0) && !best) best = { idx, name: h.name, cost: h.e.cost || null };
      });
    });
    return best;
  }
  _bestManeuverFor(vamp){            // v0.6.24 (Johan's combat GO, the range concept): the SIMPLEST maneuver shape only (Apportation [THA]/Swallowed by the Night [OBF]: standalone, no bundled strike/press/steal, no forced accompanying strike like Aid From Bats). Same exclusion pattern as _bestPressFor exactly -- measured 93 maneuver-carrying modes, 41 clean cards (Apportation, Swallowed by the Night among them), 44 bundled (documented in combat plan §5.6-successor, not built).
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('combat')) return;
      if(h.e.req && (h.e.req.beforeRangeDetermined || h.e.req.notFirstRound)) return;
      if(h.e.req && h.e.req.rangeClose && this._range !== 'close') return;
      if(h.e.req && h.e.req.rangeLong && this._range !== 'long') return;
      (h.e.modes || []).forEach(mo => {
        if(!mo.fx || !mo.fx.maneuver || mo.fx.press || typeof mo.fx.strike === 'number' || mo.fx.stealBlood || mo.fx.restrictHandStrike) return;   // v0.6.28: same defensive exclusion as _bestPressFor -- no current maneuver-tagged card also carries restrictHandStrike, but Grasp of the Python's superior (documented, not built) will, so this is future-proofing not a live fix
        if(this._modeUsableBy(mo, vamp) && (vamp.blood | 0) >= ((h.e.cost && h.e.cost.blood) || 0) && !best) best = { idx, name: h.name, cost: h.e.cost || null };
      });
    });
    const eqMv = this._equipCombatOption(vamp, 'maneuver');   // E1: the .44's one optional maneuver each combat (fx.maneuver)
    if(eqMv && !best) best = { idx: -1, name: eqMv.name, n: eqMv.n, cost: null, fromEquip: true };
    if(!best && this._reactManeuverGrant) best = { idx: -1, name: 'Guard Dogs', n: 1, cost: null, fromEquip: true, fromGrant: true };   // N1: the [ANI] rider -- one maneuver in the RESULTING combat
    return best;
  }
  _bestCarrionCrowsFor(vamp){        // v0.6.26 (Johan's combat GO, Carrion Crows -- the persistent-this-combat modifier concept): "Only usable before range is determined" -- unlike the other three req.beforeRangeDetermined-excluded finders, THIS is exactly that window (played by _resolveCombatRound's new step-1 block, before the maneuver/range step), so it does NOT exclude on that flag -- it's the one card class where beforeRangeDetermined is verifiable, not unverifiable. Deliberately narrow to Carrion Crows' own envDmgPerRound key (measured: the ONLY one of 9 "environmental damage" cards with this clean, unconditional-on-range, once-per-combat shape).
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('combat')) return;
      (h.e.modes || []).forEach(mo => {
        const n2 = mo.fx && mo.fx.envDmgPerRound;
        if(typeof n2 !== 'number') return;
        if(this._modeUsableBy(mo, vamp) && (vamp.blood | 0) >= ((h.e.cost && h.e.cost.blood) || 0) && (!best || n2 > best.n)) best = { idx, name: h.name, n: n2, cost: h.e.cost || null };
      });
    });
    return best;
  }
  _bestImmortalGrappleFor(vamp){     // v0.6.28 (Johan's combat GO, Immortal Grapple -- the strike-type restriction concept): "Only usable at close range before strikes are chosen" -- the "Pre-Strike" window (step 3 of 7), source-verified vekn.net + official FAQ 3.16 first ("restricts both minions... to only using 'hand strikes'"). req.rangeClose is ALREADY on this card's entry, and this._range is now tracked, so the normal exclusion (this._range !== 'close') correctly gates it -- no special-case needed the way beforeRangeDetermined needed one for Carrion Crows, since THIS window comes AFTER range is determined, not before.
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('combat')) return;
      if(h.e.req && h.e.req.rangeClose && this._range !== 'close') return;
      if(h.e.req && h.e.req.rangeLong && this._range !== 'long') return;
      (h.e.modes || []).forEach(mo => {
        if(!mo.fx || !mo.fx.restrictHandStrike) return;
        const isSup = !!mo.at && mo.at === mo.at.toUpperCase();
        if(this._modeUsableBy(mo, vamp) && (vamp.blood | 0) >= ((h.e.cost && h.e.cost.blood) || 0) && (!best || isSup)) best = { idx, name: h.name, superior: isSup, cost: h.e.cost || null };   // v0.6.28 fix (standing-question review, found live): the original "!best" (first-found-wins) meant [pot] (inferior, iterated first) always blocked [POT] from ever updating `best`, so `superior` silently reported FALSE even for a genuinely superior-potence vampire -- verified live against Aaradhya, The Callous Tyrant (real superior pot): reported false before this fix. A later usable SUPERIOR mode now always overrides an earlier inferior one.
      });
    });
    return best;
  }
  _bestMasterFor(excludeNorms){       // v0.5+ (Johan, 14 July): ALWAYS a candidate to play A master if we hold one -- not just recognized income assets. The library defines WHAT a card does (`known` := a cardfx `phase`-tagged income fx this bot can actually execute); persona/decide() picks WHICH one when there's a choice. An unknown master still gets played (cost paid, placed in play) -- a human corrects/completes its effect via the existing ctrl mechanism if the curated data doesn't (yet) cover it, same spirit as the bot-elements exception.
    const out = [];
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).includes('master')) return;
      if(excludeNorms && excludeNorms.has(FX_NORM(h.name))) return;
      if(!this._mayPlay(h.name, h.e, null)) return;             // the general unique-in-play gate (forward-compatible; neither Blood Doll nor Vessel is unique today)
      const cost = (h.e.cost && h.e.cost.pool) || 0;
      if(cost > this.pool) return;
      const known = (h.e.modes || []).some(mo => mo.phase && mo.fx && (typeof mo.fx.poolGain === 'number' || typeof mo.fx.bloodToPool === 'number'));
      // v1.4.0 follow-up (14 July): `persistent`/`curated` are SEPARATE questions from `known` -- known only ever meant "has a phase-tagged income fx that attaches to a host vampire" (true for exactly Blood Doll/Vessel). Parthenon/Information Highway/Ashur Tablets are now curated too but are Locations (no host) with no recognized income fx, so they'd have been wrongly bucketed as "uncurated" by the old known-only messaging -- see the MASTER play loop and decide('master-play') below.
      const persistent = !!h.e.persistent;
      const curated = h.e.src === 'hand';
      const handler = h.e.handler || null;    // v1.4.1 (14 July): the bespoke CARD_HANDLERS key, if this entry names one
      out.push({ idx, name: h.name, cost, trifle: !!h.e.trifle, known, persistent, curated, handler, archetype: !!h.e.archetype });   // fas C: archetype masters attach to a vampire at play, gated one-per-vampire
    });
    return out;
  }
  _hostVampFor(noArchetype){           // any vampire I control can host a permanent (rulebook has no readiness requirement for this); prefer a READY one, fall back to torpor. fas C (16 July): noArchetype excludes vampires already carrying an archetype ("a vampire can have only one archetype") -- the attach gate for Perfectionist-class cards.
    const hasArch = v => (v.attached || []).some(id => {
      const c = this.board.find(x => x.id === id); if(!c) return false;
      const h = this.fxLookup(c.name);
      return h && h.kind === 'lib' && !!h.e.archetype;
    });
    const ok = v => !noArchetype || !hasArch(v);
    return this.board.find(c => c.kind === 'crypt' && c.zone === 'ready' && ok(c)) ||
           this.board.find(c => c.kind === 'crypt' && c.zone === 'torpor' && ok(c)) || null;
  }
  _ashScoreFor(name){                  // v1.4.2 (14 July): Ashur Tablets' own retrieval pick -- a GENERAL v1 foundation, deliberately NOT persona-weighted yet (Johan's call: theorize/playtest toward tuning later, cardfx-persistent-lock-design-decisions.md §7/§11). Three additive factors, each independently justified by community VTES strategy discussion (recursion is valued as adaptable "tutoring", master retrieval is a named real pattern) rather than invented from scratch -- BUT the exact WEIGHTS below (2, 2, 1) are NOT calibrated against anything, just reasonable starting guesses to land a working v1; expect to retune them (and to add a persona dimension) once real games have been played, see §7 for the full future-adjustments list:
    const h = this.fxLookup(name);
    const types = (h && h.kind === 'lib' && h.e.t) || [];
    let score = 0;
    if(types.includes('master')) score += 2;                       // engine-piece bonus -- "essential master cards" is a recognized AT-enabled pattern, not a guess
    const deckEntry = (this.deck.library || []).find(e => FX_NORM(e.name) === FX_NORM(name));
    const total = deckEntry ? (deckEntry.qty || 0) : 0;
    if(total > 0){
      const seen = this.hand.filter(n => FX_NORM(n) === FX_NORM(name)).length +
                   this.board.filter(c => c.kind === 'lib' && FX_NORM(c.name) === FX_NORM(name)).length;   // includes the ash-heap copy itself -- it's already "seen"
      const remaining = Math.max(0, total - seen);
      score += 2 * (1 - remaining / total);                        // scarcity -- Johan's "few copies left in the deck" idea, computed from the decklist qty vs. everywhere the bot can currently see a copy (hand+board, ash/burned included) -- no NEW tracking, the bot already knows both numbers
    }
    if(types.length){
      const handTypes = new Set();
      this.hand.forEach(n => { const hh = this.fxLookup(n); (hh && hh.e.t || []).forEach(t => handTypes.add(t)); });
      if(!types.some(t => handTypes.has(t))) score += 1;            // mix -- Johan's "good mix of card types" idea: a type the hand doesn't already have gets a nudge
    }
    return score;
  }
  async _ashurResolve(iTriggered){     // v1.4.3 (14 July): the shared removal+benefit logic -- called EITHER when *I* just crossed my own threshold (iTriggered:true, from CARD_HANDLERS right after playing my 3rd copy) OR when _checkAshurTableWide observes someone ELSE crossed theirs (iTriggered:false). My own copies are removed EITHER way (the rulebook: "remove all copies in play... even controlled by other Methuselahs") -- only the actual trigger gets the +3 pool and the ash-heap dig; a collateral loss gets nothing, exactly per the card text.
    const copies = this.board.filter(c => c.name === 'Ashur Tablets' && c.zone === 'ready');
    if(!copies.length) return;
    copies.forEach(c => { c.zone = 'burned'; c.locked = false; });   // "remove...from the game" -- the client's own zone for that, a local mutation exactly like _toAsh's pattern (just a different destination)
    if(iTriggered){
      this.pool += 3;
      this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> removes 3 copies of <b>Ashur Tablets</b> from the game to gain 3 pool.' });
      this.note('Ashur Tablets: 3 in play \u2014 removing them for 3 pool + an ash-heap dig.');
      const ashEntries = this.board.filter(c => c.kind === 'lib' && c.zone === 'ash');
      if(ashEntries.length){
        const scored = ashEntries.map(c => ({ c, score: this._ashScoreFor(c.name) }))
                                  .sort((a, b) => b.score - a.score);
        const chosen = scored.slice(0, 13);      // "choose up to thirteen" -- anything beyond stays behind in the ash heap, untouched
        const d = this.decide('ashur-retrieve', { candidates: chosen.map(x => ({ name: x.c.name, score: x.score })) });
        this.o.log('ashur-retrieve: ' + d.why);
        const pickEntry = (d.pick && chosen.find(x => x.c.name === d.pick)) || chosen[0];
        const bi = this.board.indexOf(pickEntry.c);
        if(bi >= 0) this.board.splice(bi, 1);
        this.hand.push(pickEntry.c.name);
        const rest = chosen.filter(x => x.c !== pickEntry.c);
        rest.forEach(x => { const i = this.board.indexOf(x.c); if(i >= 0) this.board.splice(i, 1); });
        if(rest.length) this.send({ t: 'pileBulk', lib: rest.map(x => x.c.name), shuffle: true });   // first used v1.4.2 (untested by the bot before that, unlike drawCrypt) -- server-confirmed shape: bulk-pushes names into the undrawn library pile, shuffles
        this.note('Ashur Tablets: retrieved ' + pickEntry.c.name + ' to hand' +
                 (rest.length ? (', shuffled ' + rest.length + ' back into the library') : '') + '.');
      }
    } else {
      this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> loses ' + copies.length + ' cop' + (copies.length === 1 ? 'y' : 'ies') +
                 ' of <b>Ashur Tablets</b> to another Methuselah\u2019s threshold.' });
      this.note('Ashur Tablets: triggered elsewhere at the table \u2014 my own cop' + (copies.length === 1 ? 'y is' : 'ies are') +
                ' removed too (no benefit \u2014 not my trigger).');
    }
    this.push();
  }
  async _checkAshurTableWide(){        // v1.4.3 (14 July, Johan: "kan vi trigga bottens beteende när en MÄNSKLIG spelare spelar sin 3e?"): PURELY OBSERVATIONAL, no new wire verb needed at all -- the server already relays every seat's published board (`this.table[seat].pub.cards`), the SAME data `_inPlayNorms` already reads for the unique-in-play gate. Called once per own turn (see _playTurn, right after _recomputePhaseActs). NOTE what this does NOT check: "does anyone currently show >=3 in `ready`" -- that signal is only visible for the instant BETWEEN a seat crossing the threshold and their OWN handler burning the 3 copies (the very same tick, in practice), so by the time it's a DIFFERENT seat's turn to look, it's already gone. Instead this tracks each seat's 'burned' Ashur Tablets COUNT turn over turn (`_ashurSeenBurned`) -- burned is a one-way, permanent zone, so a rise in that count is a reliable, still-observable-later signal that a threshold fired somewhere, even on someone's very first turn. My own crossing is handled at play-time already (CARD_HANDLERS, above).
    this._ashurSeenBurned = this._ashurSeenBurned || {};
    let someoneElseCrossed = false;
    Object.keys(this.table).forEach(seatKey => {
      const t = this.table[seatKey];
      const cards = (t.pub && t.pub.cards) || [];
      const burnedNow = cards.filter(c => c.name === 'Ashur Tablets' && c.zone === 'burned' && !c.faceDown).length;
      if(burnedNow > (this._ashurSeenBurned[seatKey] || 0)) someoneElseCrossed = true;
      this._ashurSeenBurned[seatKey] = burnedNow;
    });
    if(!someoneElseCrossed) return;
    const mine = this.board.filter(c => c.name === 'Ashur Tablets' && c.zone === 'ready').length;
    if(mine > 0) await this._ashurResolve(false);
  }
  _phaseAvail(k){ return Math.max(0, (this.phaseActs[k] || 0) + (this.phaseBonus[k] || 0) - (this.phaseUsed[k] || 0)); }   // v0.5+ (Johan, 14 July): the tiny shared arithmetic behind the client's own phaseActs/phaseUsed pair (kept inline, not a separate file -- bot-focused for now per Johan's call; revisit only once a client-side auto-flow makes literal sharing worth it)
  _grantTrifleBonus(){                 // v0.5+ (Johan, 14 July, extracted for direct testability like _flushDraws/_deadHandIndex): Trifle's OWN cap -- at most ONE +1 to phaseBonus.master per turn, no matter how many trifles get played. Independent of any OTHER bonus source (e.g. a future Parthenon `actGrant`) -- those just add to the SAME phaseBonus.master pool from a different origin, uncapped by this one.
    if(this._trifleBonusUsed) return false;
    this._trifleBonusUsed = true;
    this.phaseBonus.master += 1;
    return true;
  }
  _recomputePhaseActs(){               // v0.5+ (Johan, 14 July): rebuild the PERMANENT baseline from any in-play card curated with `actGrant{persist:'inplay'}` (e.g. a future Information Highway: +2 influence) -- run once per own turn so a permanent that entered/left play since last turn is reflected. No shipped card carries this tag yet (Johan: save the concrete rule for a later tagging round) -- this is pure infrastructure, a documented no-op until then.
    const base = { master: 1, influence: 4, discard: 1 };
    this.board.forEach(c => {
      if(c.kind !== 'lib' || this._outOfPlay(c)) return;
      const h = this.fxLookup(c.name); if(!h || h.kind !== 'lib') return;
      const g = h.e.actGrant; if(!g || g.persist !== 'inplay' || !base.hasOwnProperty(g.phase)) return;
      base[g.phase] += (g.amount | 0);
    });
    this.phaseActs = base;
  }
  async _considerTurnActGrants(phaseKey){   // v1.4.0 (14 July): the persist:'turn' counterpart to _recomputePhaseActs's persist:'inplay' baseline. UNLIKE the baseline (automatic, recomputed every turn regardless of choice), a persist:'turn' bonus requires spending the card's own lock -- so this scans in-play, UNLOCKED library cards for an eligible actGrant{persist:'turn', phase:phaseKey} and asks decide() whether to spend it. Call AFTER _unlockPhase() (a card locked last turn must be unlocked again first) and BEFORE the phase's own play loop (so a granted bonus is visible to that loop's very first _phaseAvail check). Today's only consumer is Parthenon, whose own decide() branch is intentionally unconditional (no host to compete for, no stated action-slot cost to lock it) -- the reader itself stays generic, the same "vocabulary follows the consumer" discipline as _applyPhaseIncome/_recomputePhaseActs, so a FUTURE bespoke persist:'turn' card only needs curated data + its own decide() weighing, not a change here.
    for(const c of this.board){
      if(c.kind !== 'lib' || c.locked || this._outOfPlay(c)) continue;
      const h = this.fxLookup(c.name); if(!h || h.kind !== 'lib') continue;
      const g = h.e.actGrant; if(!g || g.persist !== 'turn' || g.phase !== phaseKey) continue;
      const d = this.decide('lock-actgrant', { name: c.name, grant: g });
      if(!d.lock) continue;
      await this._pace();
      c.locked = true;
      this.phaseBonus[phaseKey] = (this.phaseBonus[phaseKey] || 0) + (g.amount | 0);
      this.o.log('lock-actgrant: ' + d.why);
      this.fxClone({ name: c.name, kind: 'lib' }, 'is locked');
      const n = g.amount | 0;
      this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> locks <b>' + esc(c.name) + '</b> for +' + n + ' ' + phaseKey + ' phase action' + (n === 1 ? '' : 's') + '.' });
      this.push();
    }
  }
  _outOfPlay(c){   // v0.6.34 (Johan's standing question, checking the hand-size sweep for uncertainty -- found live): a card that has left play (discarded to the public ash heap, or burned/removed from the game) REMAINS an entry in this.board with its zone changed, rather than being spliced out -- confirmed against the Ashur Tablets test fixture (an ash-zone Govern the Unaligned genuinely coexists in board). Any scan for "is this permanent still active" needs this check; the four scans below did not have it (a real, if narrow, pre-existing gap this session inherited into _handSizePermanentTotal too when the pattern was copied from _considerLockIncome's own scan).
    return c.zone === 'ash' || c.zone === 'burned';
  }
  _addCounter(c, n){   // v1.6.7/v0.6.35 (Johan's ask, "build the counter, as general as possible"): a GENERAL counter utility, deliberately separated from any specific trigger (locking, unlock-phase, bleed success/failure...) -- measured 10 cards sharing "add N counter(s) to this card" + "lock" wording first; only Dreams of the Sphinx and Total Insanity share the CLEAN "counter accumulates, auto-burns at a fixed threshold" shape this utility targets. The other 8 (Constant Revolution, Fatuus Mastery, Forward Momentum, Gate of Acheron, Hourglass of the Mind, Pit of Contemplation, Powerbase: Rome, Temptation) each spend/compare/scale counters in their own distinct way -- genuinely different mechanics, not variations this one utility should try to absorb. Pure state mutation, no side effects (chat/push are the CALLER's job, same division of labour as _handSizePermanentTotal being pure while _considerLockIncome does the announcing).
    c.counters = (c.counters | 0) + (n || 1);
    return c.counters;
  }
  _burnIfCounters(c, threshold){   // the auto-burn half: threshold reached -> zone='burned' (the SAME convention Ashur Tablets already established, recognized by _outOfPlay above -- not spliced out of this.board, matching how a card leaving play already works everywhere else this session touched). Returns whether it burned, so the caller can adjust its own announcement.
    if((c.counters | 0) < threshold) return false;
    c.zone = 'burned';
    return true;
  }
  _handSizePermanentTotal(){   // v1.6.6/v0.6.33 (Johan's "sweep it while it's fresh" GO, hand-size family): pure computation, no side effects -- sums every freestanding (host-free, matching _considerLockIncome's own convention) in-play permanent handSize source (Elder Library, British Museum, Monastery of Shadows, Tabriz Assembly, Weeping Stone, Shaal Fragment). Shared by _recomputeHandSizeBaseline (entering-play detection) AND _considerLockIncome's own handSize branch (so a temporary bonus stacks correctly on TOP of whatever permanent total is already active, not computed in isolation as if base(7) were the only other contributor).
    let total = 0;
    this.board.forEach(c => {
      if(c.kind !== 'lib' || c.host || this._outOfPlay(c)) return;
      const h = this.fxLookup(c.name); if(!h || h.kind !== 'lib') return;
      (h.e.modes || []).forEach(mo => {
        if(mo.fx && mo.fx.handSizePermanent && typeof mo.fx.handSize === 'number') total += mo.fx.handSize;
        if(mo.fx && mo.fx.handSizePermanent && typeof mo.fx.handSizePerCounter === 'number') total += mo.fx.handSizePerCounter * (c.counters | 0);   // v0.6.125: Visit from the Capuchin -- the bonus IS the counters, so it shrinks as they burn
      });
    });
    return total;
  }
  _recomputeHandSizeBaseline(){   // v0.6.33: the passive-permanent sibling of _recomputePhaseActs's own "refresh the baseline from whatever's in play right now" pattern -- called once per turn (turn start). A NEWLY entered permanent (Elder Library etc.) means the true target rose since last check; draw up to it now, mirroring the same "immediately draw up to your hand size" rule Dreams of the Sphinx's temporary bonus already implements. Never discards on a DECREASE (a permanent leaving play mid-game is rare and not handled this round -- documented, not silently wrong: this only ever draws up, never claims to shed the difference).
    const total = this._handSizePermanentTotal();
    const prev = this._handSizePermanentPrev || 0;
    this._handSizePermanentPrev = total;
    if(total > prev){
      const target = 7 + total + (this._handSizeBonus || 0);
      const owed = target - this.hand.length;
      for(let i = 0; i < owed; i++) this.send({ t: 'draw' });
    }
  }
  _tableBlockRate(){ return (this._tableBlockAttempts | 0) / Math.max(1, this.ownTurns | 0); }   // v0.6.93: block attempts observed per own round -- the climate read future consumers calibrate against (benchmark metas expected < ~0.5/turn)
  _liveCount(){ let n = 0; for(const q of (this.players || [])) if(q && !q.out && !q.vacant) n++; return n; }   // B-55b: remaining players, the same roster read live(seat) already trusts
  _endgameNow(){ return !!this.started && this._liveCount() > 0 && this._liveCount() <= 3; }   // B-55b BASE: <= 3 alive = the endgame read (the Grinder's naked 2-2 finish sits inside this); contender/VP refinement = documented v1.1
  _isDefenseCard(name){ const lk = this.fxLookup(name); if(!lk) return false; const cats = this._cats(lk.e || lk) || []; return cats.includes('bounce') || cats.includes('intercept'); }   // B-55b: the existing _cats vocabulary -- wake folds into intercept (R2), so bounce+intercept covers the defense class with zero new classification
  _revertHandSizeBonus(){   // v0.6.32 (Johan's ask, continuing Dreams of the Sphinx): extracted from the discard-phase loop specifically so it's directly testable on its own -- "until the end of the turn" expires HERE (discard phase is the turn's last phase), and per the SAME rule that granted it ("discard down to or draw up to your hand size" whenever it changes), reverting to the base 7 means discarding any excess now. Prefers a genuinely dead-hand card if one remains (worthless to hold regardless); falls back to the front of the hand for any remainder -- WHICH excess card to shed is a real strategic question this v1 doesn't weigh, matching Dreams of the Sphinx's own "ignore the 3-counter budget" simplification already noted at the lock-income decide() case.
    if(!(this._handSizeBonus > 0)) return;
    const base = 7 + this._handSizePermanentTotal();   // v0.6.33: revert to base+PERMANENT, not flat 7 -- a temporary bonus expiring should never strip away Elder Library etc.'s own still-active permanent contribution
    let excess = this.hand.length - base;
    while(excess > 0){
      const vamps = this.board.filter(c => c.zone === 'ready' && c.kind === 'crypt');
      let di = this._deadHandIndex(vamps);
      if(di < 0){ const si = this._surplusStealthIndex(vamps); if(si >= 0){ di = si; this.o.log('starve-out counter: cycling a surplus stealth card (streak ' + this._unblockedStreak + ')'); } }   // v0.6.79 (improvement 3): reuses the EXISTING discard path
      if(di < 0){
        di = 0;
        if(this._endgameNow() && this._isDefenseCard(this.hand[0])){   // B-55b (endgame posture, BASE v1): at <= 3 alive, the front-of-hand fallback must not shed the defense that decides the finish -- prefer the first NON-defense card instead; an all-defense hand still sheds (the hand-size rule is a must). Persona differentiation (the shark's gamble) = documented v1.1, measured first per the evaluation doctrine.
          const alt = this.hand.findIndex(n => !this._isDefenseCard(n));
          if(alt >= 0){ this._emit('posture', { kept: this.hand[0], shed: this.hand[alt], alive: this._liveCount() }); this.o.log('endgame posture: retaining ' + this.hand[0] + ', shedding ' + this.hand[alt] + ' (' + this._liveCount() + ' alive)'); di = alt; }
        }
      }
      const name = this.hand.splice(di, 1)[0];
      this._emit('revert', { shed: name, alive: this._liveCount(), endgame: this._endgameNow() });   // v0.6.92 (harvest seed 1, observability): EVERY revert-shed becomes visible with alive+endgame tagging -- unlocks the reframed B-55b prediction ('of reverts at <=3 alive, the kept-branch fires when a non-defense alternative exists'); the harvest's posture=0 was unreadable precisely because this function ran silently outside the posture branch.
      this._toAsh(name);
      this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> discards <b>' + esc(name) + '</b> (hand size bonus expired).' });
      excess--;
    }
    this._handSizeBonus = 0;
    this.push();
  }
  async _considerLockIncome(phaseKey){   // v1.6.4/v0.6.31-32 (Johan's "push Inside Dirt to 100%" GO, Dreams of the Sphinx): the income-flavoured sibling of _considerTurnActGrants -- SAME shape (scan in-play UNLOCKED library permanents, check an eligible lock-gated mode for THIS phase, decide(), lock+apply), generalized so Arcane Library/Chantry (both lock-based income masters, phase-income-v2-plan.md) can reuse this reader later, not just Dreams of the Sphinx. THREE fx shapes handled: poolGain (optionally costEdge-gated at the MODE level -- distinct from Leverage's entry-level costEdge), bloodAdd+bloodAddTo:'unc' (target-selection mirrors _bestBloodStockFor's own spirit), and handSize (source-verified vekn.net: hand size is an ACTIVE target, not a passive ceiling -- "discard down to or draw up to your hand size" whenever it changes; draws immediately up to base(7)+bonus, reverted at end of turn via _revertHandSizeBonus).
    for(const c of this.board){
      if(c.kind !== 'lib' || c.locked || c.host || this._outOfPlay(c)) continue;   // freestanding only -- host-attached recurring income already goes through _applyPhaseIncome
      const h = this.fxLookup(c.name); if(!h || h.kind !== 'lib') continue;
      for(const mo of h.e.modes || []){
        if(!mo.lock || mo.phase !== phaseKey || this._outOfPlay(c)) continue;   // v0.6.36 (Johan's standing question, checking the counter/burn mechanic for uncertainty -- found live): re-checked EVERY iteration, not just once before the loop -- a card with multiple modes sharing the SAME phase (Dreams of the Sphinx's bloodAdd and handSize both being phase:'master') could burn from the FIRST mode's counter increment and then still fire the SECOND mode on the same now-out-of-play card, since the outer scan's _outOfPlay check only ran once, before either mode was tried. Verified live: counters reached 4 (past the burnAtCounters:3 threshold) because both modes fired in one call.
        if(typeof mo.fx.poolGain === 'number'){
          if(mo.costEdge && !this.edge) continue;
          const d = this.decide('lock-income', { name: c.name, kind: 'poolGain', amount: mo.fx.poolGain });
          if(!d.lock) continue;
          await this._pace();
          c.locked = true;
          this.pool += mo.fx.poolGain;
          let counterNote = '';
          if(h.e.burnAtCounters){ this._addCounter(c, 1); if(this._burnIfCounters(c, h.e.burnAtCounters)) counterNote = ' (' + h.e.burnAtCounters + ' counters -- burned)'; else counterNote = ' (' + c.counters + '/' + h.e.burnAtCounters + ' counters)'; }
          this.o.log('lock-income: ' + d.why);
          this.fxClone({ name: c.name, kind: 'lib' }, 'is locked');
          this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> locks <b>' + esc(c.name) + '</b> for +' + mo.fx.poolGain + ' pool' + esc(counterNote) + '.' });
          this.push();
        } else if(typeof mo.fx.bloodAdd === 'number' && mo.fx.bloodAddTo === 'unc'){
          const targetClan = h.e.req && h.e.req.clan;   // v0.6.40 (Johan's ask, Arcane Library -- the cheapest-win pick): unlike Dreams of the Sphinx's own bloodAdd (any uncontrolled vampire), this card's target must ALSO be the matching clan -- checked here since Dreams of the Sphinx has no req.clan at all (this filter is a no-op for it, verified: undefined req.clan skips the check entirely, same target pool as before)
          let target = null;
          this.unc.forEach(v => {
            if((v.blood | 0) >= (v.cap | 0)) return;
            if(targetClan){ const vh = this.fxLookup(v.name); if(!vh || vh.kind !== 'crypt' || !targetClan.includes(vh.e.clan)) return; }
            if(!target || (v.cap | 0) > (target.cap | 0)) target = v;
          });
          if(!target) continue;
          const d = this.decide('lock-income', { name: c.name, kind: 'bloodAdd', amount: mo.fx.bloodAdd, target });
          if(!d.lock) continue;
          await this._pace();
          c.locked = true;
          target.blood = Math.min(target.cap | 0, (target.blood | 0) + mo.fx.bloodAdd);
          let counterNote2 = '';
          if(h.e.burnAtCounters){ this._addCounter(c, 1); if(this._burnIfCounters(c, h.e.burnAtCounters)) counterNote2 = ' (' + h.e.burnAtCounters + ' counters -- burned)'; else counterNote2 = ' (' + c.counters + '/' + h.e.burnAtCounters + ' counters)'; }
          this.o.log('lock-income: ' + d.why);
          this.fxClone({ name: c.name, kind: 'lib' }, 'is locked');
          this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> locks <b>' + esc(c.name) + '</b> to add ' + mo.fx.bloodAdd + ' blood to an uncontrolled vampire' + esc(counterNote2) + '.' });   // uncontrolled is face-down, same "never name the target" convention as superior-Govern's own announce
          this.push();
        } else if(typeof mo.fx.handSize === 'number'){
          const target = 7 + this._handSizePermanentTotal() + (this._handSizeBonus || 0) + mo.fx.handSize;   // v0.6.32/33 (Johan's ask, continuing Dreams of the Sphinx): source-verified vekn.net first -- hand size is NOT a passive ceiling, it's an ACTIVE target: "whenever they don't match... immediately discard down to or draw up to your hand size". 7 is VTES's universal base, UNIFIED with any permanent sources already in play (Elder Library etc.) and any temporary bonus already active THIS turn (a second lock-based card, stacking) -- computing this mode's amount in isolation would under-draw whenever another source is simultaneously active. Only worth locking if there's something to actually gain THIS moment (hand already below the new target) -- otherwise it spends one of the card's 3 total lock-uses for zero benefit, same "don't waste a lock" spirit as Life in the City's own capacity check.
          const owed = target - this.hand.length;
          if(owed <= 0) continue;
          const d = this.decide('lock-income', { name: c.name, kind: 'handSize', amount: mo.fx.handSize });
          if(!d.lock) continue;
          await this._pace();
          c.locked = true;
          this._handSizeBonus = (this._handSizeBonus || 0) + mo.fx.handSize;   // tracked so the end-of-turn reversion knows how much to revert -- "until the end of the turn" (independent of the card's own continued existence -- verified live, 19 July: the bonus correctly persists even if THIS card burns from reaching its counter threshold this same lock)
          for(let i = 0; i < owed; i++) this.send({ t: 'draw' });
          let counterNote3 = '';
          if(h.e.burnAtCounters){ this._addCounter(c, 1); if(this._burnIfCounters(c, h.e.burnAtCounters)) counterNote3 = ' (' + h.e.burnAtCounters + ' counters -- burned)'; else counterNote3 = ' (' + c.counters + '/' + h.e.burnAtCounters + ' counters)'; }
          this.o.log('lock-income: ' + d.why);
          this.fxClone({ name: c.name, kind: 'lib' }, 'is locked');
          this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> locks <b>' + esc(c.name) + '</b> for +' + mo.fx.handSize + ' hand size, drawing ' + owed + ' card' + (owed === 1 ? '' : 's') + ' up to the new limit' + esc(counterNote3) + '.' });
          this.push();
        }
      }
    }
  }
  async _considerLockRescue(phaseKey){   // v0.6.39 (Johan's ask, Chantry -- the last card on phase-income-v2-plan.md): source-verified vekn.net first, both the card text AND the official ruling ("Rescue a Vampire from Torpor" is a standardized action type whose cost splits between the payer and the rescued vampire). Kept as its OWN function rather than a fourth branch on _considerLockIncome, even though the scan shape is identical -- "income" doesn't semantically fit a torpor-to-ready move, matching this session's own established naming precedent (_recomputeHandSizeBaseline is a separate sibling of _recomputePhaseActs, not a bolted-on branch). Measured the whole family first: only 3 cards mention "from torpor"+"ready region" at all, and the other two (Renewed Vigor, Torpid Blood) share nothing structurally with this shape -- rescueTorpor is Chantry-specific vocabulary, not a guessed-at generalization. v1 scope: only rescues the bot's OWN torpored vampire of the matching clan (the card technically can help ANY player's Tremere, per the official ruling's "their controller" -- multiplayer-diplomacy altruism is out of scope, no infrastructure for it). Cost preference: pool first (never weakens a combat-capable ready vampire), falling back to blood from a ready same-clan vampire only if pool is insufficient.
    for(const c of this.board){
      if(c.kind !== 'lib' || c.locked || c.host || this._outOfPlay(c)) continue;
      const h = this.fxLookup(c.name); if(!h || h.kind !== 'lib') continue;
      const clan = h.e.req && h.e.req.clan && h.e.req.clan[0];
      for(const mo of h.e.modes || []){
        if(!mo.lock || mo.phase !== phaseKey || this._outOfPlay(c)) continue;
        if(typeof mo.fx.rescueTorpor !== 'number' || !clan) continue;
        const amount = mo.fx.rescueTorpor;
        const target = this.board.find(v => v.kind === 'crypt' && v.zone === 'torpor' && this.fxLookup(v.name) && this.fxLookup(v.name).e.clan === clan);
        if(!target) continue;
        let payer = null;   // 'pool', or a ready same-clan vampire object to burn blood from
        if(this.pool >= amount) payer = 'pool';
        else{
          const p = this.board.find(v => v.kind === 'crypt' && v.zone === 'ready' && (v.blood | 0) - amount >= 1 && this.fxLookup(v.name) && this.fxLookup(v.name).e.clan === clan);   // v0.6.39: requires at least 1 blood LEFT after paying, not just enough to cover the cost -- rescuing one vampire by leaving another at 0 (risking its own torpor) is a bad trade this finder shouldn't offer at all
          if(p) payer = p;
        }
        if(!payer) continue;
        const d = this.decide('lock-rescue', { name: c.name, target: target.name, via: payer === 'pool' ? 'pool' : 'blood' });
        if(!d.lock) continue;
        await this._pace();
        c.locked = true;
        if(payer === 'pool') this.pool -= amount; else payer.blood = (payer.blood | 0) - amount;
        target.zone = 'ready'; target.faceDown = false; target.locked = false;
        const rp = this._openSlot('ready', target);
        target.x = rp.x; target.y = rp.y;
        this.push();
        this.o.log('lock-rescue: ' + d.why);
        this.fxClone({ name: c.name, kind: 'lib' }, 'is locked');
        this.fxClone({ name: target.name, kind: 'crypt' }, 'rises', { kind: 'rise', reveal: true });
        this.note(c.name + ': Trainbot locks it and burns ' + amount + ' ' + (payer === 'pool' ? 'pool' : 'blood from ' + payer.name) + ' to rescue ' + target.name + ' from torpor.');
      }
    }
  }
  async _considerHuntingGround(phaseKey){   // v0.6.41 (Johan's ask, "process the hunting ground family, gives many free to other decks"): source-verified vekn.net first -- 40 cards mention "hunting ground", measured before curating anything. 23 share this EXACT effect across two surface phrasings ("a ready vampire you control can gain 1 blood" / "you may move 1 blood from the blood bank to a ready vampire you control"), unlock-phase, NOT lock-gated -- a genuinely new THIRD shape (freestanding, phase-triggered, optional-but-obviously-always-taken), distinct from _applyPhaseIncome's host-attached automatic triggers and _considerLockIncome's lock-gated choices. bloodAddTo:'own-ready' already existed from Life in the City -- reused, not reinvented. Kept as its own function (not a branch on either sibling) for the same naming-clarity reason _considerLockRescue was: this scan has no lock check at all, a structurally different shape worth its own name. Fails closed on req.title exactly like the ALREADY-established precedent at _bestBloodStockFor's own title-gate (titles are untracked bot-wide, politics-engine scope) -- Papillon stays correctly unreachable, not silently mis-played.
    if(phaseKey !== 'unlock' || this._huntingGroundUsedThisTurn) return;   // "a vampire can gain blood from only one hunting ground each turn" -- a single flag shared across EVERY hunting ground card in play, not per-card
    for(const c of this.board){
      if(c.kind !== 'lib' || c.host || this._outOfPlay(c)) continue;
      const h = this.fxLookup(c.name); if(!h || h.kind !== 'lib') continue;
      if(h.e.req && h.e.req.title) continue;   // fail closed -- untracked, same precedent as _bestBloodStockFor
      const clan = h.e.req && h.e.req.clan;
      for(const mo of h.e.modes || []){
        if(mo.lock || mo.phase !== phaseKey || typeof mo.fx.bloodAdd !== 'number' || mo.fx.bloodAddTo !== 'own-ready') continue;
        let target = null;
        this.board.forEach(v => {
          if(v.kind !== 'crypt' || v.zone !== 'ready') return;
          if((v.blood | 0) >= (v.cap | 0)) return;
          if(clan){ const vh = this.fxLookup(v.name); if(!vh || vh.kind !== 'crypt' || !clan.includes(vh.e.clan)) return; }
          if(!target || (v.cap | 0) > (target.cap | 0)) target = v;
        });
        if(!target) continue;
        target.blood = Math.min(target.cap | 0, (target.blood | 0) + mo.fx.bloodAdd);
        this._huntingGroundUsedThisTurn = true;
        this.push();
        this.o.log('hunting-ground: ' + c.name + ' -> ' + target.name + ' +' + mo.fx.bloodAdd + ' blood');
        this.fxClone({ name: c.name, kind: 'lib' }, 'triggers');
        this.note(c.name + ': ' + target.name + ' gains ' + mo.fx.bloodAdd + ' blood.');
        return;   // only ONE hunting ground per turn -- stop immediately, don't even scan for other copies
      }
    }
  }
  async _considerHandCycle(phaseKey){   // v0.6.42 (Johan's ask, The Barrens -- from the 19 July backlog note): source-verified vekn.net first -- "You can lock this card to discard a card (draw up afterward)", NOT phase-restricted by the card itself; phase:'master' is this bot's own sensible-timing pick, the SAME precedent already set for Dreams of the Sphinx's own un-phase-restricted choices. Kept as its own function (not a branch on _considerLockIncome) for the same naming-clarity reason _considerLockRescue/_considerHuntingGround were -- a hand-cycling trade isn't "income" in any sense those siblings share. Reuses _deadHandIndex verbatim (the SAME dead-card-detection already trusted for the discard-phase and _revertHandSizeBonus) -- only fires when a genuinely dead card exists to discard; never trades away a live, useful card for an unknown random one.
    for(const c of this.board){
      if(c.kind !== 'lib' || c.locked || c.host || this._outOfPlay(c)) continue;
      const h = this.fxLookup(c.name); if(!h || h.kind !== 'lib') continue;
      for(const mo of h.e.modes || []){
        if(!mo.lock || mo.phase !== phaseKey || !mo.fx.handCycle) continue;
        const vamps = this.board.filter(v => v.zone === 'ready' && v.kind === 'crypt');
        const di = this._deadHandIndex(vamps);
        if(di < 0) continue;   // nothing genuinely dead to discard -- don't trade a live card for a random one
        const d = this.decide('lock-handcycle', { name: c.name });
        if(!d.lock) continue;
        await this._pace();
        c.locked = true;
        const discarded = this.hand.splice(di, 1)[0];
        this._toAsh(discarded);
        this.send({ t: 'draw' });
        this.push();
        this.o.log('hand-cycle: ' + d.why);
        this.fxClone({ name: c.name, kind: 'lib' }, 'is locked');
        this.note(c.name + ': Trainbot locks it to discard ' + discarded + ' and draw a fresh card.');
        return;
      }
    }
  }
  _applyPhaseIncome(phaseKey){        // v0.5 (§7.6 C, Johan: phase-EXACT): recurring master-permanent income fires at the CARD's OWN phase -- the timing lives in cardfx's `phase` field on the mode (Blood Doll: 'master', Vessel: 'unlock'), never hardcoded per card name here, so any future income asset only needs tagging in the library, not a bot code change. v1: bloodToPool + poolGain only for HOST-ATTACHED permanents -- freestanding lock-gated income (Dreams of the Sphinx) goes through the separate _considerLockIncome above instead, since it's a CHOICE (spend the lock), not an automatic trigger.
    let changed = false;
    this.board.forEach(c => {
      if(c.kind !== 'lib' || !c.host || this._outOfPlay(c)) return;                   // only MY in-play attached permanents
      const host = this.board.find(v => v.id === c.host); if(!host) return;
      const h = this.fxLookup(c.name); if(!h || h.kind !== 'lib') return;
      (h.e.modes || []).forEach(mo => {
        if(mo.phase !== phaseKey || !mo.fx || this._outOfPlay(c)) return;   // v0.6.36: same defensive re-check as _considerLockIncome -- no current _applyPhaseIncome-consumed card burns mid-iteration, but a future one combining host-attached income with a counter/burn mechanic would hit the identical class of bug without this
        const lastBlood = (host.blood | 0) <= 1, poolSafe = this.pool > (this.o.poolFloor | 0);   // v0.6.104 (#13): 'may move' -- never drain a vampire's LAST blood while my pool is comfortable (a 0-blood minion cannot pay Deflection/Conditioning); at or under poolFloor survival wins and the drain proceeds
        if(typeof mo.fx.poolToBlood === 'number'){   // v0.6.125 (Johan's remaining-cards round): THE REVERSE DIRECTION -- Blood Doll / Vessel 'may move' either way. v0, deliberately narrow so it cannot oscillate with the drain below: only a host at 0 BLOOD is fed (1 pool buys back the action a forced hunt would cost), only from a comfortable pool, once per card per phase.
          const d = this.decide('income-direction', { host, pool: this.pool, cap: this.fxCryptCap(host.name) });
          if(d.toBlood){
            const moved = Math.min(mo.fx.poolToBlood, Math.max(0, this.pool - 1));
            if(moved > 0){ this.pool -= moved; host.blood = (host.blood | 0) + moved; changed = true;
              this.fxClone({ name: c.name, kind: 'lib' }, moved + ' pool \u2192 blood');
              this.send({ t: 'log', html: '<b>' + esc(c.name) + '</b>: ' + moved + ' pool \u2192 <b>' + esc(host.name) + '</b> (pool ' + this.pool + ').' });
              this._emit('income-direction', { card: c.name, host: host.name, dir: 'toBlood', pool: this.pool }); this.o.log('income-direction: ' + d.why); }
          }
          return;
        }
        const drain = typeof mo.fx.bloodToPool === 'number' && (host.blood | 0) > 0 ? this.decide('income-drain', this._drainCtx(host)) : null;   // v0.6.134: 'may move' is a DECISION (was: whenever the host had any blood beyond its last)
        if(drain){ this._emit('income-drain', { card: c.name, host: host.name, blood: host.blood | 0, pool: this.pool, drain: drain.drain, tag: drain.tag }); if(!drain.drain) this.o.log('income-drain: ' + drain.why); }
        if(drain && drain.drain){
          const moved = Math.min(mo.fx.bloodToPool, host.blood | 0);
          host.blood -= moved; this.pool += moved; changed = true;
          this.fxClone({ name: c.name, kind: 'lib' }, moved + ' blood \u2192 pool');   // v0.6.109 (#4, Johan: "let the bot Target the card producing the effect so it shows"): the LOG already named the card; this is the visual half -- the card itself flies up with its own status caption, which is this bot's equivalent of a human setting Target before acting
          this.send({ t: 'log', html: '<b>' + esc(c.name) + '</b>: ' + moved + ' blood \u2192 pool (pool ' + this.pool + ').' });
        } else if(typeof mo.fx.poolGain === 'number'){
          this.pool += mo.fx.poolGain; changed = true;
          this.fxClone({ name: c.name, kind: 'lib' }, '+' + mo.fx.poolGain + ' pool');   // v0.6.109 (#4): same attribution on the poolGain rung
          this.send({ t: 'log', html: '<b>' + esc(c.name) + '</b>: +' + mo.fx.poolGain + ' pool (pool ' + this.pool + ').' });
        }
      });
    });
    if(changed) this.push();
  }
  _writeTally(extra){                // v0.6.7 (server v2.6.17 pairing): send ONLY the fields the caller owns -- the server now PRESERVES absent fields while the mode is unchanged, so the old merge-fill (which carried our last-OBSERVED copy of the OTHER side's counter) is exactly what raced: our stealth write could clobber the defender's just-written intercept under whole-state last-write-wins. `mode` is always sent (the server keys preservation on it). Our own state syncs via the broadcast echo -- the server echoes tally to the sender too (empirically verified 16 July; log lines are NOT echoed, tally/chat/say ARE).
    const mode = (extra && extra.mode) || (this.tally && this.tally.mode) || null;
    this.send(Object.assign({ t: 'tally', mode }, extra));
    /* v0.6.113 (THE HELPER GATE): MIRROR the write locally, with the server's own
       merge rule (same mode preserves absent fields; a mode change starts fresh).
       Online the echo lands ~immediately and is idempotent over this. Offline
       (hotBridge) there IS no echo -- and since the bot is now the resolver-holder
       whenever nobody else is (a contested window declares its verdict from
       this.tally at the clock), a write the bot cannot read back would leave it
       declaring from a stale or empty counter. The old 'READ-ONLY, never written'
       rule on this.tally was a guard against a bot INVENTING the other side's
       number; a bot recording its OWN write is exactly what the server would
       have told it anyway. */
    const prev = (this.tally && this.tally.mode === mode) ? this.tally : { a: 0, b: 0, ph: 0, rd: 1 };
    this.tally = mode ? Object.assign({}, prev, extra || {}, { mode }) : null;
  }
  _bumpTallyB(n){                    // my own committed intercept -- the only field the DEFENDING side writes (fas A: 'a' now has a bot writer too, see _bumpTallyA -- the old "a human's to set" held only while every attacker was human)   // VA review (2 Aug): ORPHAN since fas A+ replaced accumulation with _setTallyB's write-fresh -- zero callers (grep-proven). Kept for reference; do NOT revive without the raw-accumulator treatment _bumpTallyA now has, or a Christine-class floored base re-opens the phantom-value class on the b side.
    const cur = (this.tally && this.tally.mode === 'block') ? this.tally : { a: 0, b: 0, ph: 0, rd: 1 };
    this._writeTally({ mode: 'block', b: Math.min(99, (cur.b | 0) + n) });
  }
  _setTallyB(n){                     // fas A+ (16 July): a NEW block attempt's intercept, written fresh -- per-minion per the rulebook; _writeTally's own merge preserves the attacker's a   // VA review: negatives pass through (rulebook below-0); -9 sanity cap
    this._writeTally({ mode: 'block', b: Math.min(99, Math.max(-9, n | 0)) });
  }
  _announceTallyA(raw){
    this._clearCombatStashes();      // v0.6.103 (#1): a new action of MINE starts with an empty handshake -- whatever was stashed belonged to an earlier combat (mine or somebody else's)
    this._lastBlockerName = null;   // B-55e-b: every new announce starts with no known blocker              // VA review (2 Aug, SOURCE-VERIFIED reversal): the rulebook says stealth/intercept 'can decrease even below 0' and the block verdict is the RAW >= comparison (vekn.net Detailed Turn Sequence + FAQ 3.22: 'Can I block a 0-stealth action if I have -1 intercept?' -- negatives are all possible, so NO) -- the earlier floor-at-0 design was WRONG and would have let a bare Christine block and a Royce shed his tax. EVERY block-mode announce routes here: the actor-side RAW total is stored (for _bumpTallyA's arithmetic) and written AS-IS to the wire; the L12.block regex was widened to -?\d+ the same round. -9 is a sanity cap only.
    this._actStealthRaw = raw | 0;
    this._writeTally({ mode: 'block', a: Math.min(99, Math.max(-9, raw | 0)), b: 0 });   // v0.6.113 (THE HELPER GATE): was `if(this.caps.tally)` -- the bot's own stealth on the shared counter IS the structured outcome announcement Johan wants the resolvers for (humans and bots read the same number), so it never waits for a human to open a counter first; the write is also what lets the bot declare a verdict itself when the clock runs out (see _askTimeout)
  }
  _bumpTallyA(n){                    // fas A (16 July, sewer archetype root-cause): my own committed STEALTH as the acting side -- without this, a bot attacker's stealth (spent in _onBlockAttempt or built into the action card) never reached the shared tally, so the v0.6.3 contested-verdict declaration read a=0 and a block "succeeded" against +3 stealth: a wrong verdict   // VA review: accumulates on the actor-side RAW total (seeded by _announceTallyA; falls back to the current wire a when unseeded -- legacy/direct-call safety), writes floored.
    const cur = (this.tally && this.tally.mode === 'block') ? this.tally : { a: 0, b: 0, ph: 0, rd: 1 };
    if(this._actStealthRaw == null) this._actStealthRaw = (cur.a | 0);
    this._actStealthRaw += (n | 0);
    this._writeTally({ mode: 'block', a: Math.min(99, Math.max(-9, this._actStealthRaw)) });   // VA review: RAW to the wire (rulebook: below-0 is real); -9 sanity cap
  }

  /* ---------- the decide() seam (bot-spec §7: socket in v0.2, brain in v0.3) */
  decide(q, ctx){
    const out = this._decide(q, ctx);
    if(q === 'action'){                // v0.6.79 (match improvement 2): repeat-pick streak -- the decay's memory
      const nm = out && out.pick && out.pick.name;
      if(nm && nm === this._lastPickName) this._pickStreak = (this._pickStreak | 0) + 1;
      else { this._lastPickName = nm || null; this._pickStreak = 0; }
    }
    if(this._debugHand && this.o.debugWeights !== false) this._logWeight(q, ctx, out);   // v0.6.112 (R4): the same seam the trace harvester reads, rendered for a human at the table
    this._emit('decide', { q, ctx, out, pool: this.pool, hand: this.hand.slice() });   // v0.6.70 (#2): NAMES, not size -- F-Q1's closer (the harvester's exposure union becomes complete; array-guarded readers since harvest v1.0.2). v0.6.1 (16 July, arena EVALUATE): ctx included so a trace can explain WHY a decision had the inputs it had (hasBounce/icp/amount...), not just what came out -- the first real arena runs needed exactly this to distinguish 'bounce never offered' from 'bounce declined'
    return out;
  }
  /* v0.6.112 (R4, #3b): the decision weighting, for a human reading the log live.
     decide() is already the single funnel every judgement passes through, so this
     is one hook, not a hundred. Deliberately a `log` (status tier, PROTOCOL §12.0)
     and never chat: weighting is reference material you scroll back through, not
     speech -- and at chat tier it would drown the table it is meant to explain.
     Renders the `why` the seam already produces; a decision with no why is not
     worth a line.

     MEASURED 15 Sep 2026 (so the next reader does not have to guess how much
     of the bot's thinking actually reaches the log): 25 return sites across the
     15 decide branches, of which exactly TWO render nothing -- `react-delay`
     (a duration, not a judgement) and `hunt-or-bleed`'s empty "nothing to do"
     return. Every other branch carries at least a `why`, and block-as-target
     carries `why` on all 11 of its returns. So the log is dense by default.
     If it ever looks sparse at the table, the cause is a branch that returned
     early WITHOUT a why -- fix it in the seam by giving that return a why, never
     here by inventing text the decision did not produce. A renderer that
     fabricates reasoning is worse than a quiet one: it would have Johan grading
     a rationale the bot never had. */
  _logWeight(q, ctx, out){
    if(!out) return;
    const why = out.why || out.note || null;
    const pick = out.pick ? (out.pick.name || out.pick) : (out.name || null);
    const bits = [];
    if(pick) bits.push('<b>' + esc(String(pick)) + '</b>');
    if(typeof out.score === 'number') bits.push('score ' + (Math.round(out.score * 100) / 100));
    if(typeof out.p === 'number') bits.push('p ' + (Math.round(out.p * 100) / 100));
    if(out.block !== undefined) bits.push(out.block ? 'BLOCK' : 'let through');
    if(why) bits.push(esc(String(why)));
    if(!bits.length) return;
    const tgt = ctx && (ctx.T || ctx.role);
    this.send({ t: 'log', html: '\u2699 <i>' + esc(q) + (tgt ? ' [' + esc(String(tgt)) + ']' : '') + '</i>: ' + bits.join(' \u00b7 ') });
  }
  _decide(q, ctx){
    const P = this.persona;
    switch(q){
      case 'block-as-target': {     // M2: bounce beats a contested block outright when available (cheap, decisive, no risk). steg 5 (16 July, rulebook-verified): `ctx.blockAllowed=false` means blocks were already FINALLY declined for this action -- the rulebook's "Detailed course of an action" (C: blocks declined by all) never reopens them short of a target change, but the reaction window (bounce) STAYS live through every modifier exchange: Deflection & co are, per their own card text, "only usable after blocks are declined", so post-decline is bounce's NORMAL home, not an exception.
        if(ctx.T && ctx.T !== 'T1'){    // v0.6.107 (B1, doctrine section 3.2): the UNDIRECTED classes -- odds x threat x combatFit - lockCost, times the deck axis, over blockShy; the directed T1 path below is byte-identical (its axes come with B2's arena evaluation)
          if(ctx.blockAllowed === false) return { block: false, bounce: false, score: 0, why: 'blocks finally declined this action \u2014 pass' };
          /* v0.6.113 (THE HELPER GATE): the `if(!this.caps.tally) ... 'classic table (no resolver) -- sandbox default: let it through'` return that sat here is GONE. Whether the bot blocks is game logic; it never depends on which helpers the humans have switched on. The gate silently disarmed the whole defence module until a human happened to open a counter (the arena hit it 16 July and seeded a tally instead of fixing it; every helpers-on online table hit it from client v2.6.111 on, and every hotseat table always had). */
          if(P.insight <= 0.2 && ctx.T !== 'T2') return { block: false, bounce: false, score: 0, why: 'novice depth: only pool damage and permanent intercept are weighed \u2014 ' + ctx.T + ' let through' };
          if(ctx.icp <= 0) return { block: false, bounce: false, score: 0, why: 'no usable intercept (undirected actions carry +1 stealth; a bare body cannot reach it)' };
          const odds = ctx.stealthA > 0 ? Math.min(1.3, ctx.icp / ctx.stealthA) : 1.3;
          const posture = this._posture(), axis = this._deckAxis();
          const W = { T2: (axis >= 1.15 ? 1.4 : 1.2), T3: (posture === 'disabling' ? 1.3 : posture === 'resisting' ? 0.6 : 1.0), T4: (ctx.role === 'predator' ? 0.9 : 0.4), T4b: Math.min(1.1, 0.4 + 0.15 * Math.max(0, (ctx.actorUnlocked | 0) + 1 - 2)), T5: ((posture === 'resisting') ? 0.2 : 0.7) + (ctx.famedTarget ? 0.3 : 0), T6: (axis >= 1.3 ? 0.6 : 0.3) };
          const w = W[ctx.T] !== undefined ? W[ctx.T] : 0.3;
          const dirW = ctx.role === 'predator' ? 1.0 + 0.1 * Math.min(3, this._predPressureLast | 0) : (ctx.T === 'T2' ? 1.0 : 0.8);
          const combatFit = posture === 'disabling' ? 1.0 : posture === 'grinding' ? 0.9 : 0.7;
          const lockCost = this._wakeCard() ? 0 : Math.min(0.3, 0.15 * (ctx.actorUnlocked | 0));
          const score = (odds * w * dirW * combatFit - lockCost) * axis / P.blockShy;
          const parts = { odds: +odds.toFixed(2), w: +w.toFixed(2), dirW: +dirW.toFixed(2), combatFit, lockCost: +lockCost.toFixed(2), axis, posture, blockShy: P.blockShy };
          return { block: score >= 1, bounce: false, score, parts,
                   why: ctx.T + '/' + (ctx.sub || '?') + ' as ' + ctx.role + ': odds ' + odds.toFixed(2) + ' \u00d7 w ' + w.toFixed(2) + ' \u00d7 dir ' + dirW.toFixed(2) + ' \u00d7 fit ' + combatFit + ' \u2212 lock ' + lockCost.toFixed(2) + ', \u00d7 axis ' + axis + ' \u00f7 blockShy ' + P.blockShy + ' = ' + score.toFixed(2) };
        }
        if(this.o.lateBounce !== 0 && ctx.hasBounce){   // v0.6.144 THE LATE BOUNCE (Johan: bouncing at once, and above all bouncing a bleed of 1, is a beginner's mistake -- the bounce is played on the TOTAL, after the +bleed modifiers). serie-bal5: the first response with a bounce in hand was BOUNCE 11 of 11 times, 6 of them on an announced bleed of 1; no bounce ever caught a pumped bleed.
          if(ctx.blockAllowed === false){                 // the blocks are over: this is the total
            if((ctx.amount | 0) >= 2 || ctx.edge) return { block: false, bounce: true, tag: 'bounce-total', why: 'the bleed stands at ' + ctx.amount + ' after the modifiers' + (ctx.edge ? ' and my pool is at the edge' : '') + ' \u2014 NOW the bounce (wake included: only on a total of 2+, Johan)' };
            const dyn = this.o.bounceSpare == null && ctx.reserve ? ctx.reserve : null;   // v0.6.146: the reserve is DYNAMIC by default; bounceSpare N pins the v0.6.145 fixed threshold (2), 0 = never on a total of 1
            if(dyn){ if((ctx.amount | 0) >= 1 && (ctx.bounceN | 0) - 1 >= dyn.R) return { block: false, bounce: true, tag: 'bounce-spare', reserve: dyn.R, why: 'a total of ' + ctx.amount + ' with ' + ctx.bounceN + ' bounce cards in hand, reserve ' + dyn.R + ' (' + dyn.why + '): one goes now' };
              return { block: false, bounce: false, tag: 'bounce-kept', reserve: dyn.R, why: 'a total of ' + ctx.amount + ': ' + ctx.bounceN + ' bounce card(s) in hand, reserve ' + dyn.R + ' (' + dyn.why + ') \u2014 kept' }; }
            const spareAt = this.o.bounceSpare == null ? 2 : +this.o.bounceSpare;   // v0.6.145 (serie-bal6: bounces fell 53 -> 18 and malkavian rose to 9 wins -- 'never on a total of 1' starved decks that hold 8-10 bounce cards; a bounce kept for ever clogs MY hand, the mirror of Johan's clog). The TIMING stays (always on the total); a total of 1 is bounced when another bounce stays in hand -- the last one waits for a heavier bleed (v0.6.79's rule, on the total).
            if((ctx.amount | 0) >= 1 && spareAt > 0 && (ctx.bounceN | 0) >= spareAt) return { block: false, bounce: true, tag: 'bounce-spare', why: 'a total of ' + ctx.amount + ', and ' + ctx.bounceN + ' bounce cards in hand: one goes now (a small bleed sent on is free damage to my prey), the last one waits for a heavier bleed' };
            return { block: false, bounce: false, tag: 'bounce-kept', why: 'a total of ' + ctx.amount + ' is not worth my LAST bounce \u2014 kept for a heavier bleed' };
          }
          ctx.holdBounce = true;                          // first window: the block question first; the bounce waits for the total
        } else
        if(ctx.hasBounce) return { block: false, bounce: true, why: 'Deflection available \u2014 redirect beats a contested block' + (ctx.blockAllowed === false ? ' (blocks already finally declined; bounce is the one reaction still live)' : '') };
        if(ctx.blockAllowed === false) return { block: false, bounce: false, why: 'blocks finally declined this action (rulebook: never reopened by a modifier) and no bounce in hand \u2014 pass' };
        // v0.6.113 (THE HELPER GATE): the directed `!this.caps.tally -> let it through` return removed here too -- see the undirected branch above.
        if(ctx.stealthA < 0) return { block: true, why: 'announced stealth is NEGATIVE (Royce-class tax) \u2014 icp ' + ctx.icp + ' >= ' + ctx.stealthA + ' is certain for ANY minion, cards or not' };   // VA review (raw model): must precede the icp<=0 shortcut -- that shortcut encodes the v1 hand-card-centric stance for a >= 0 (bare 0-vs-0 blocks stay declined by design, unchanged), but a negative announce makes even the cardless block rules-certain
        if(this.o.lateBounce !== 0 && ctx.stealthBleeder && ctx.isBleed !== false && (ctx.amount | 0) === 1 && !ctx.edge)   // v0.6.144 THE CLOG (Johan): against a stealth bleeder a bleed of 1 is let through WITHOUT an attempt -- its stealth cards stay stuck in its hand -- despite the risk of a Conditioning; a gamble I stop taking at the edge of my pool
          return { block: false, bounce: false, tag: 'clog', why: 'a stealth bleeder bleeds for 1: no attempt \u2014 every block I try lets it cycle a stealth card (pool ' + this.pool + ' can afford the pump it has shown: ' + (ctx.pumpSeen | 0) + ')' };
        if(ctx.holdBounce && (ctx.amount | 0) >= 2 && ctx.stealthA === 0 && ctx.blockAllowed !== false && this.pending && this._bareBlockers(this.pending).length)   // v0.6.144 DRAW THE STEALTH (Johan): a front-heavy bleed is worth the attempt anyway -- it must at least spend stealth, and the bounce comes after. A failed attempt does not lock the vampire.
          return { block: true, bounce: false, tag: 'draw-stealth', why: 'a bleed of ' + ctx.amount + ' with a bounce in hand: attempt the block first (free if it fails, it costs them stealth) \u2014 the bounce waits for the total' };
        const urgency = 0.6 + Math.min(1.4, ctx.amount / Math.max(1, this.pool));         // a bigger bite of a thinner pool raises urgency
        /* v0.6.118 (B2 step 1, doctrine 3.3 + Johan 17 Sep): THE BARE BLOCK. The old
           `icp <= 0 -> no usable intercept` return sat here, ABOVE urgency, and closed
           every window where the actor announced stealth 0 and an unlocked body stood
           ready -- 11 of 11 in B2's null point. A bare block at stealth 0 is rules-
           certain (0 >= 0); what it costs is the combat that follows. So it is an EV
           question: gain = the pool damage stopped (+ the actor's tempo), cost = what
           this seat's minions do to my blocker (oppCombatCost: blood lost + P(torpor) x
           the rescue price), read from the table model. The persona's bareBlock knob
           gates the DISCRETIONARY case (novice off, grinder chump-only, shark any);
           desperation (turnsToOust <= 1: the alternative is the oust) overrides all. */
        if(ctx.icp <= 0){
          if(ctx.stealthA !== 0 || ctx.blockAllowed === false) return { block: false, bounce: false, why: 'no usable intercept in hand' + (ctx.stealthA > 0 ? ' against stealth ' + ctx.stealthA : '') };
          let bodies = this._bareBlockers(this.pending), viaWake = false;
          if(!bodies.length){ bodies = this._wakeBlockers(this.pending); viaWake = bodies.length > 0; }   // v0.6.120 (THE WAKE BLOCK): 15 matches, three decks with 5-10 wakes each, ONE wake played -- in 96 of 330 'no unlocked body' windows a wake sat in hand. The intercept path always counted a wake (interceptPotential); the bare block never did
          if(!bodies.length) return { block: false, bounce: false, why: 'no usable intercept in hand and no unlocked body for a bare block' + (this._wakesInHand() ? ' (a wake in hand, but no locked body that can play it)' : '') };
          const seat = ctx.actorSeat | 0;
          const tto = this.turnsToOust(seat || undefined);
          const desperate = tto <= 1;
          const knob = P.bareBlock || 'chump';
          const chump = c => (this.fxCryptCap(c.name) | 0) <= 2 && (c.blood | 0) >= 1;
          const oc = seat ? this.oppCombat(seat) : 0.5;
          const eligible = desperate ? bodies : knob === 'any' ? bodies : knob === 'chump' ? (oc < 0.3 ? bodies : bodies.filter(chump)) : [];   // 'chump' is danger-aware: against a seat that is no combat threat (oppCombat < 0.3) any body is a chump
          if(!eligible.length) return { block: false, bounce: false, score: 0, why: 'bare block possible (stealth 0) but bareBlock=' + knob + ' declines' + (knob === 'chump' ? ' (no chump body, oppCombat ' + oc + ')' : '') + ', turns to oust ' + tto };
          let best = null;
          eligible.forEach(c => { const cost = (seat ? this.oppCombatCost(seat, c) : 1.5) + (viaWake ? 0.35 : 0); const gain = (ctx.amount | 0) + 0.5; const ev = gain - cost;   // v0.6.120: the wake is a card spent -- the action scorer's own 0.35
            if(!best || ev > best.ev) best = { c, cost, gain, ev }; });
          const margin = P.insight <= 0.2 ? 1.0 : P.insight >= 0.8 ? 0 : 0.5;   // novice wants a clear edge, shark takes even money
          const go = desperate || best.ev >= margin;
          const parts = { bare: true, viaWake, gain: +best.gain.toFixed(2), cost: best.cost, ev: +best.ev.toFixed(2), margin, tto, oppCombat: seat ? this.oppCombat(seat) : null, body: best.c.name, desperate };
          return { block: go, bounce: false, score: go ? 1 : 0, parts, bare: true,
                   why: 'bare block (stealth 0, ' + best.c.name + (viaWake ? ' behind a wake' : '') + '): gain ' + best.gain.toFixed(1) + ' \u2212 combat cost ' + best.cost.toFixed(1) + ' = ' + best.ev.toFixed(1) + (desperate ? ' -- DESPERATE (turns to oust ' + tto + ')' : ' vs margin ' + margin) + (go ? ' \u2192 block' : ' \u2192 let through') };
        }
        const odds = ctx.stealthA > 0 ? Math.min(1.3, ctx.icp / ctx.stealthA)
                   : 1.3;   // B-55a: a === 0 is KNOWN on the wire (every announce writes a fresh tally since fas A/VC) -- with icp >= 1 the verdict iB >= sA is rules-CERTAIN, priced at the same cap a big surplus already earns. The old 'unknown 0.75' was a div-by-zero dodge that mispriced certainty as risk: the 4/4 zero-block wall of serie-5p30-vtrack. icp <= 0 never reaches this line; urgency and blockShy still weigh the COMBAT/lock risk, which is the persona's honest domain.
        const score = (odds * urgency) / P.blockShy;                                     // blockShy divides: higher = more reluctant (novice 1.3, shark 0.8)
        return { block: score >= 1, bounce: false,
                 why: 'odds ' + odds.toFixed(2) + ' (a=' + ctx.stealthA + ')' + ' \u00d7 urgency ' + urgency.toFixed(2) +
                      ' \u00f7 blockShy ' + P.blockShy + ' = ' + score.toFixed(2) };
      }
      case 'react-delay':                              // v0.4.5 (Johan, live test): a reaction is still a bot command -- it gets the SAME paceMs floor as a turn action (was capped at thinkMs=1600, under the 2s ask); a persona's thinkMs can only make the pause LONGER, never shorter than a real table's pace
        /* v0.6.109 (#13, Johan, live online test): "the bot's answer to an announced
           intention comes too long after the announcement". The v0.4.5 floor did the
           opposite — max(paceMs, thinkMs) meant a persona could only ever make the
           answer SLOWER than the table's pace, never faster, and the answer is the one
           beat a waiting human feels most. Own knob (o.reactPaceMs, default 0.6×pace)
           so a quicker reaction never leaks into the bot's own turn tempo. paceMs 0
           still zeroes it: the suite and the arena keep the fast lane byte-for-byte. */
        return { ms: this.o.paceMs ? (this.o.reactPaceMs != null ? this.o.reactPaceMs : Math.round(this.o.paceMs * 0.6)) : 40 };
      case 'combat-strike': {       // steg 6 (16 July): dodge vs strike -- deliberately DUMB v1 per Johan ("okej att ha det som 'dum' grundstrategi just nu"): dodge exactly when taking the assumed default incoming 1 would torpor me (survival), else strike for value and save the dodge. No persona weighting yet -- a future refinement alongside the blood-cost weighing decide('bleed-modifier') also defers.
        const fragile = (ctx.vamp.blood | 0) <= 1;
        return { dodge: !!ctx.dodge && fragile,
                 why: !ctx.dodge ? 'no dodge in hand'
                      : fragile ? 'blood ' + (ctx.vamp.blood | 0) + ' \u2264 1: the default incoming 1 would drain me empty (forced hunt next turn) \u2014 dodge to keep the blood'   // v0.6.4: was "would torpor", wrong per the rulebook (paying exactly your last blood has no other negative effect); the dodge threshold itself stays -- avoiding the empty/forced-hunt state is still worth the card
                                : 'healthy (blood ' + (ctx.vamp.blood | 0) + '): strike for value, save the dodge' };
      }
      case 'income-drain': {        // v0.6.134 (Johan, 19 Sep: 'on the edge of an oust it can be worth it anyway, or when the vampire lacks sensible actions and may as well hunt -- make the judgment flexible'). serie-bal1 run 2: the doll took Chelsea Blake 2 -> 1 every turn, the hunt rule sent her hunting 1 -> 2, and she never acted again.
        const b = ctx.host.blood | 0, cap = ctx.cap || 99, after = b - 1;
        const huntScore = x => (Math.max(0, cap - x) / Math.max(1, cap)) * 1.5 / P.aggression;   // hunt-or-bleed's own formula -- the two rules must agree or they chase each other
        if(ctx.danger) return { drain: true, tag: 'survival', why: 'pool ' + ctx.pool + (ctx.crit != null ? ' at or under the critical level ' + ctx.crit : '') + (ctx.myTto != null ? ', ' + ctx.myTto + ' turns from falling' : '') + ': every pool counts, the blood goes' };
        if(after <= 0) return { drain: false, tag: 'last-blood', why: ctx.host.name + ' keeps its last blood (a 0-blood minion pays for nothing and must hunt)' };
        if(huntScore(b) >= 1) return { drain: true, tag: 'hunting-anyway', why: ctx.host.name + ' (' + b + '/' + cap + ') hunts this turn with or without it: the pool is free' };
        if(huntScore(after) >= 1){     // the drain would push the host over the hunt bar: it costs the vampire's ACTION
          if(!ctx.hasAction) return { drain: true, tag: 'nothing-better', why: ctx.host.name + ' has no card action worth a turn: 1 pool now and a hunt is the better use' };
          return { drain: false, tag: 'keeps-action', why: ctx.host.name + ' (' + b + '/' + cap + ') would drop under its hunt bar and lose ' + ctx.hasAction + ' for 1 pool' };
        }
        if(after < (ctx.reserve | 0)) return { drain: false, tag: 'reserve', why: ctx.host.name + ' keeps ' + ctx.reserve + ' blood for the cards in hand (would be left with ' + after + ')' };
        return { drain: true, tag: 'spare', why: ctx.host.name + ' can spare it (' + after + ' left, reserve ' + (ctx.reserve | 0) + ')' };
      }
      case 'income-direction': {    // v0.6.125: feed a 0-blood host from a comfortable pool (max(10, poolFloor + 4) -- the forced hunt it spares is a whole action; below that the pool is worth more than the action)
        const dry = (ctx.host.blood | 0) === 0, rich = (ctx.pool | 0) >= Math.max(10, (this.o.poolFloor | 0) + 4);   // an ABSOLUTE floor too: the suite's own 0-blood scenario (pool 5) must still hunt -- 5 pool is nobody's comfortable
        return { toBlood: dry && rich, why: dry ? (rich ? ctx.host.name + ' is at 0 blood and the pool (' + ctx.pool + ') can spare 1: no forced hunt' : ctx.host.name + ' is at 0 blood but the pool (' + ctx.pool + ') is too thin to feed it') : 'host has blood' };
      }
      case 'act-again': {           // v0.6.123: DUMB v0 like combat-strike -- the unlock is worth the card and the blood whenever the vampire is left with blood to act on; a body that ends at 0 would only buy a forced hunt
        const after = (ctx.vamp.blood | 0) - (ctx.card.cost | 0);
        if(!ctx.inTorpor && after >= 1 && ctx.priced && ctx.actLeft === false){   // v0.6.137 (Johan's order, 19 Sep): nothing legal is left for this vampire -- the card buys an UNLOCKED BODY, not an action
          if(ctx.edge && ctx.uncoveredHit > 0) return { play: true, tag: 'survival', scores: { unlockValue: ctx.unlockValue, crit: ctx.edge.crit, burst: ctx.edge.burst }, why: ctx.card.name + ': SURVIVAL \u2014 pool ' + ctx.edge.pool + ' is ' + (ctx.edge.lethal ? 'within one predator turn (burst ' + ctx.edge.burst + ')' : 'at or under the critical level ' + ctx.edge.crit) + ' and predator hit #' + ctx.hitNo + ' has nobody to meet it: ' + ctx.vamp.name + ' comes up (a stopped hit here is a turn of life, not ' + ctx.unlockValue + ' pool)' };   // v0.6.141 (48c): 4 of 30 holds were followed by an oust the same round, at estimates of 0.00-0.33 against a price of 1
          if(ctx.saveForLunge) return { play: false, tag: 'save-for-lunge', why: ctx.card.name + ' held: ' + ctx.saveForLunge };
          const price = 0.5 + 0.5 * (ctx.card.cost | 0);   // v0.6.138: a card is worth about half a pool, a blood the other half -- Freak Drive = 1 pool
          if((ctx.unlockValue || 0) >= price) return { play: true, tag: 'unlocked-body', scores: { unlockValue: ctx.unlockValue, price }, why: ctx.card.name + ': no action left, but ' + ctx.vamp.name + ' unlocked is worth ' + ctx.unlockValue + ' (' + ctx.unlockWhy + ') against ' + price.toFixed(2) };
          if(ctx.clogged) return { play: true, tag: 'de-clog', why: ctx.card.name + ': no action left and the hand holds neither an offensive action nor a reaction \u2014 cycle it' };
          return { play: false, tag: 'not-worth-it', scores: { unlockValue: ctx.unlockValue, price }, why: ctx.card.name + ' held: no action left and an unlocked ' + ctx.vamp.name + ' is worth ' + (ctx.unlockValue || 0) + ' (' + ctx.unlockWhy + ') against ' + price.toFixed(2) };
        }
        if(ctx.inTorpor) return { play: after >= 2, why: after >= 2 ? ctx.card.name + ': unlock IN TORPOR \u2014 ' + ctx.vamp.name + ' walks out on its own action (2 of ' + after + ' blood)' : ctx.card.name + ' held: ' + ctx.vamp.name + ' is in torpor without the 2 blood to leave it' };   // v0.6.128
        return { play: after >= 1, why: after >= 1 ? ctx.card.name + ' after a ' + (ctx.outcome === 'blocked' ? 'blocked' : 'successful') + ' action: unlock (blood ' + after + ' left) \u2014 act again or stay home'
                                                     : ctx.card.name + ' held: it would leave ' + ctx.vamp.name + ' at 0 blood' };
      }
      case 'combat-end': {          // v0.6.123: Strike: combat ends. v0: always -- this deck has nothing to win in a fight; the [PRE] unlock makes it better than free
        return { end: !!ctx.ce, why: ctx.ce ? ctx.ce.name + ': combat ends' + (ctx.ce.unlock ? ' and ' + ctx.vamp.name + ' unlocks' : '') : 'no combat-ends strike' };
      }
      case 'give-lock': {           // v0.6.128: Anarch Troublemaker-class. The card leaves me for good (it travels on to my prey's prey), so it must take the prey's WHOLE unlocked defence or its full n
        if(!(ctx.mineReady > 0)) return { play: false, why: ctx.card + ' held: I have no vampire to act behind it' };
        if(!(ctx.open > 0)) return { play: false, why: ctx.card + ' held: my prey has no unlocked vampire' };
        return { play: true, why: ctx.card + ': my prey kept ' + ctx.open + ' unlocked \u2014 ' + Math.min(ctx.open, ctx.n) + ' lock' + (Math.min(ctx.open, ctx.n) === 1 ? 's' : '') + (ctx.open <= ctx.n ? ', its whole defence' : '') };
      }
      case 'block-bar': {           // v0.6.128 (Johan, 18 Sep): Daring the Dawn-class must be MITIGABLE or clearly WORTH it. Worth it = this bleed (with the modifier I hold) ousts my prey. Mitigable = the vampire comes back: it can Freak Drive and walk out of torpor itself, another ready vampire can rescue it, or my title votes dominate the table (a diablerist loses the blood hunt). A mitigable play still needs a bleed worth barring (>= 3) and a prey that could block.
        const mit = ctx.mit || { survives: true };
        const lethal = (ctx.potential | 0) >= (ctx.preyPool | 0) && (ctx.preyPool | 0) > 0;
        if(!(ctx.blockers > 0)) return { play: false, why: ctx.card.name + ' held: the prey has no unlocked vampire to block with' };
        if(ctx.ref && !((ctx.pass || 0) >= 0.8)) return { play: false, why: ctx.card.name + ' held: the referendum is not likely to pass (' + ctx.pass + ') \u2014 an unblockable failure buys nothing' };   // v0.6.129
        if(ctx.ref && !lethal && !((ctx.avgIcp || 0) >= 0.95)) return { play: false, why: ctx.card.name + ' held: my prey shows ' + (ctx.avgIcp || 0).toFixed(2) + ' intercept per attempt \u2014 the +1 stealth of a political action is bar enough' };
        if(lethal) return { play: true, tag: 'lethal', why: ctx.card.name + ': a lethal bleed (' + ctx.potential + ' vs ' + ctx.preyPool + ' pool) that ' + ctx.blockers + ' unlocked vampire' + (ctx.blockers === 1 ? '' : 's') + ' may not block \u2014 worth ' + ctx.vamp.name + (mit.survives ? ' in torpor' : ' itself') };
        if(!mit.survives) return { play: false, why: ctx.card.name + ' held: ' + ctx.vamp.name + ' would be burned by it and the bleed does not oust' };
        const how = mit.selfExit ? 'self-exit' : mit.rescuer ? 'rescuer' : mit.votes ? 'votes' : null;
        if(!how) return { play: false, why: ctx.card.name + ' held: not lethal (' + ctx.potential + ' vs ' + ctx.preyPool + ') and nothing brings ' + ctx.vamp.name + ' back \u2014 no Freak Drive + 2 blood, no rescuer, no vote majority' };
        if((ctx.potential | 0) < 3) return { play: false, why: ctx.card.name + ' held: a bleed of ' + ctx.potential + ' is not worth a trip to torpor' };
        return { play: true, tag: how, why: ctx.card.name + ': a bleed of ' + ctx.potential + ' the prey may not block \u2014 mitigated: ' + (mit.selfExit ? mit.selfExit + ' + 2 blood walks ' + ctx.vamp.name + ' out of torpor' : mit.rescuer ? mit.rescuer + ' can rescue' : 'my title votes dominate the table (a diablerist loses the blood hunt)') };
      }
      case 'bleed-target':
        return { seat: this.preySeat(), why: 'prey default' };
      case 'action': {              // plain bleed 1 vs a bleed-action card vs a pool-damage action (fas B) from hand
        const offW = this._planOffW(), econW = this._planEconW();   // v0.6.119 (the strategy layer): the plan prices the two action classes -- a bleed is worth more the closer the prey is to falling, shopping less; both 1.0 without a plan
        let pick = ctx.plain, why = 'plain bleed' + (offW > 1 ? ' (plan x' + offW.toFixed(2) + ')' : ''), sPick = 1 * P.aggression * offW;
        const scores = { bleed: +(1 * P.aggression * offW).toFixed(2) };   // A2: the losers' podium
        if(offW !== 1 || econW !== 1){ scores.planOffW = +offW.toFixed(2); scores.planEconW = +econW.toFixed(2); }
        if(ctx.stock && ctx.readyCrypt < P.grinderReadyTarget && !(this.plan && (this.plan.posture === 'lunge' || this.plan.reads.preyTto <= 1.5))){   // v0.6.119: build-first stops when the prey is within a turn and a half
          /* v0.6.14 (superior Govern): a STRUCTURAL pick, not a score contest -- the same
             card usually scores higher as its inferior bleed (Govern: 3 * aggression),
             so a marginal weight would never grind. Build-first is a strategy phase:
             while the ready bench is under grinderReadyTarget, stock the uncontrolled
             region; the persona knob (0 = off) is the whole tuning surface for now.  */
          pick = ctx.stock; sPick = 99; scores.stock = 99;
          why = 'grinder: ' + ctx.stock.name + ' stocks ' + ctx.stock.n + ' blood (ready ' + ctx.readyCrypt + ' < target ' + P.grinderReadyTarget + ')';
          const ob = this._polOverBuild(ctx.pol);   // v0.6.131 (debt 23b): the two cases where a referendum is the better build
          if(ob){ pick = ctx.pol; sPick = 99.2; scores.pol = 99.2; scores.polOverBuild = ob.tag;
            why = ctx.pol.name + ' (referendum) before the bench (ready ' + ctx.readyCrypt + ' < target ' + P.grinderReadyTarget + '): ' + ob.why + ' \u2014 pass ' + ctx.pol.pass + ' (my votes ' + ctx.pol.mine + ' vs ' + ctx.pol.agst + ' against)'; }
        }
        if(ctx.ownRescue && !(this.plan && this.plan.posture === 'lunge')){
          /* v0.6.127: rescue my own vampire from torpor. While the bench is under the build-first target it IS
             the build -- the cheapest ready body on the table (2 blood, no transfers, no turn of influence) --
             so it outranks the stock; after that it competes on a plain score that grows with the capacity
             coming back. A lunge turn keeps bleeding. */
          const building = ctx.readyCrypt < P.grinderReadyTarget;
          const sRes = building ? 99.5 : (1.4 + 0.2 * (ctx.ownRescue.cap | 0)) * econW; scores.ownRescue = +(sRes).toFixed(2);
          if(sRes > sPick){ pick = ctx.ownRescue; sPick = sRes; why = 'rescue ' + ctx.ownRescue.who + ' from torpor (' + ctx.ownRescue.who + ' pays ' + ctx.ownRescue.tPays + ', the rescuer ' + ctx.ownRescue.mine + ')' + (building ? ' \u2014 the cheapest body for the bench (ready ' + ctx.readyCrypt + ' < target ' + P.grinderReadyTarget + ')' : ': ' + sRes.toFixed(2)); }
        }
        if(this.o.permFirst && sPick < 98 && this._deckPermFirst() && !(this.plan && (this.plan.posture === 'lunge' || this.plan.reads.preyTto <= 1.5))){
          /* v0.6.132: the permanent build. serie-null4: Murder of Crows lost to a plain bleed of 1 about twenty times by a hair
             (1.15 vs 1.2-1.4) and nosferatu took 48 plain bleeds to 17 build actions -- the opposite of its helpsheet. The
             permanents in a hand are few, so the rule limits itself; the intercept tier goes first, then the higher plain score. */
          const cands = [ctx.equip && { c: ctx.equip, s: ctx.equip.tier === 1 ? 1.5 : 1.15, what: 'equip ' + ctx.equip.name + (ctx.equip.tier === 1 ? ' (intercept)' : '') },
                         ctx.strength && { c: ctx.strength, s: 0.9 + 0.15 * ctx.strength.bonus, what: ctx.strength.name + ' +' + ctx.strength.bonus + ' strength' },
                         ctx.recruit && { c: ctx.recruit, s: 0.85 + 0.1 * ctx.recruit.life, what: 'recruit ' + ctx.recruit.name }].filter(Boolean).sort((a, b) => b.s - a.s);
          if(cands.length){ pick = cands[0].c; sPick = 98; scores.permFirst = 98; why = 'permanents first: ' + cands[0].what + ' before any pressure (the deck builds its board; prey ' + (this.plan ? this.plan.reads.preyTto + ' turns away' : 'not in reach') + ')'; }
        }
        if(ctx.pd){
          /* fas B (16 July): Inside Dirt-class pool damage. Worth its full n (pool
             pressure is the win condition), minus the Edge forfeiture when costEdge
             (the SAME 0.5 weight the Leverage bleed-modifier decision already uses:
             burning the Edge now forfeits its passive +1 pool at my next unlock).
             At 3 pool for the Edge that is 2.5 -- deliberately beats a plain bleed
             whenever the Edge is held: bleed to WIN the Edge, spend it on Dirt. */
          const sPd = ctx.pd.n * P.aggression * offW - (ctx.pd.costEdge ? 0.5 : 0); scores.pd = +(sPd).toFixed(2);
          if(sPd > sPick){ pick = ctx.pd; sPick = sPd; why = ctx.pd.name + ' (pool dmg): ' + sPd.toFixed(2) + ' vs plain ' + (1 * P.aggression).toFixed(2) + (ctx.pd.costEdge ? ' (incl. Edge forfeit 0.5)' : ''); }
        }
        if(ctx.pol){
          /* v0.6.122 (the politics leg): a referendum. Worth what the terms are worth to me (_refValue: my
             prey's loss in full, my own pool at 0.8) times an honest pass estimate from the title votes on the
             table -- so a KRC that the table can vote down scores like the long shot it is. */
          const sPol = ctx.pol.value * ctx.pol.pass * P.aggression * offW; scores.pol = +(sPol).toFixed(2);
          if(sPol > sPick){ pick = ctx.pol; sPick = sPol; why = ctx.pol.name + ' (referendum): value ' + ctx.pol.value.toFixed(2) + ' \u00d7 pass ' + ctx.pol.pass + ' = ' + sPol.toFixed(2) + ' (my votes ' + ctx.pol.mine + ' vs ' + ctx.pol.agst + ' against' + (ctx.pol.forO ? ', ' + ctx.pol.forO + ' likely for' : '') + ')'; }
        }
        if(ctx.peek){
          /* R3 (24 July): Revelations -- intel is the prize. Worth MORE when I know
             less (no live handIntel on the prey) and when the inference says their
             bounce threatens my bleeds; superior (a standing open hand) adds a
             premium. v1 weights, deliberately simple, aggression-scaled. */
          const preyS=this.preySeat();
          const noIntel=!this._handIntel(preyS);
          const sPk=(1.2 + (noIntel?0.6:0) + 0.4*this.readP(preyS,'bounce') + (ctx.peek.supMode?0.3:0)) * P.aggression * econW; scores.peek = +(sPk).toFixed(2);
          if(sPk > sPick){ pick=ctx.peek; sPick=sPk; why='Revelations ['+(ctx.peek.supMode?'AUS':'aus')+']: intel '+sPk.toFixed(2)+(noIntel?' (no live intel on prey)':''); }
        }
        if(ctx.enemyRescue){
          const sRes = (1.3 + 0.35 * ctx.enemyRescue.tPays + 1.05) * P.aggression; scores.enemyRescue = +(sRes).toFixed(2);   // v0.6.91 CHAIN-PRICING (Johan's option ii, 4 Aug, from the fame-rig 0/6 finding): +0.35*3 = the expected re-torpor Fame burn, priced in the SAME per-pool currency as the t term -- the finder already guarantees _rushCapableNow (line 1555), so the chain payoff is real for every built candidate. Johan's bar verbatim ('det maaste vara vaert det, saerskilt naer man betalar blood sjaelv'): the chain value must CARRY the blood cost (mine = 2-t); t=0 shark now scores (1.3+1.05)*1.3 = 3.06 -- beats Deep Song n=2 (2.6), still loses to n=3 (3.9). Under ACTIVE EVALUATION via the same rig (registered prediction: >= 1 full yo-yo cycle).   // v2 (#7): the WEIGHING -- free rescue (t=2) clears the bleed bar; pay-it-all (t=0) sits at it; both knobs documented
          if(sRes > sPick){ pick = ctx.enemyRescue; sPick = sRes; why = 'enemy rescue ' + ctx.enemyRescue.name + ' (they pay ' + ctx.enemyRescue.tPays + ', I pay ' + ctx.enemyRescue.mine + ', +chain): ' + sRes.toFixed(2); }
        }
        if(ctx.recruit){
          const sRec = (0.85 + 0.1 * ctx.recruit.life) * P.aggression * econW; scores.recruit = +(sRec).toFixed(2);   // N4d: a defensive tool -- below live pressure lines, above idling
          if(sRec > sPick){ pick = ctx.recruit; sPick = sRec; why = ctx.recruit.name + ' [' + (ctx.recruit.at || '') + '] life ' + ctx.recruit.life + ': ' + sRec.toFixed(2); }
        }
        if(ctx.strength){
          const sSt = (0.9 + 0.15 * ctx.strength.bonus) * P.aggression * econW; scores.strength = +(sSt).toFixed(2);   // N4b: combat prep -- loses to a live bleed line, wins over idling
          if(sSt > sPick){ pick = ctx.strength; sPick = sSt; why = ctx.strength.name + ' [' + (ctx.strength.at || '') + '] +' + ctx.strength.bonus + ' strength: ' + sSt.toFixed(2); }
        }
        if(ctx.creep){
          const myCreeps = this.board.filter(c => c && c.kind === 'lib' && c.zone === 'ready' && !this._outOfPlay(c) && c.name === 'Creeping Sabotage').length;
          const sC = (1.15 + 0.1 * myCreeps) * P.aggression * offW; scores.creep = +(sC).toFixed(2);   // N3: the drip stacks -- each tabled copy makes the next worth more
          if(sC > sPick){ pick = ctx.creep; sPick = sC; why = 'Creeping Sabotage (copy ' + (myCreeps + 1) + '): ' + sC.toFixed(2); }
        }
        if(ctx.rush){
          /* v0.6.56 (A1c, live-arena finding): the flat 1.25 base could NEVER beat a
             bleed-action card (n x aggression -- Deep Song's own [ani] side scores 2 x
             aggr), so a rush deck never rushed. sR now reads the v1.1 targeter's own
             WEIGHTED score: felt pressure (backrush weight) and the +8 Fame bonus flip
             the mode competition exactly when the doctrine says they should -- calm,
             unfamed forward rushes stay BELOW the bleed bar (the race clock). */
          const ex = ctx.rush.exp || { expDmg: 1, nCombat: 0 };
          const tb = (ctx.rush.target.blood != null ? ctx.rush.target.blood : ctx.rush.target.tBlood) | 0;   // v0.6.133 BUG FIX: the finder's target carries `blood`; `tBlood` never existed on it, so tb was 0 and mult 1.35 on EVERY live rush since v0.6.74 (serie-null4 / perm1: 21 rushes, 16 without a combat card, 3 torpors -- all at 0 blood)
          const mult = ex.expDmg >= tb ? 1.35 : (ex.expDmg >= tb - 1 ? 1.0 : 0.55);   // v0.6.74: Johan's rule -- no combat cards wants 0-1 blood targets
          const dirW = (this.plan && this.plan.target && this.plan.target.mode === 'minions' && ctx.rush.target.dir === this.plan.target.dir) ? 1.25 : 1;   // v0.6.119: the plan's target -- a disabling deck in hold turns on its predator's minions
          const myB = ctx.rush.myBlood;   // v0.6.133 (general combat, own risk): the target strikes back for at least 1 -- a rusher at 0 blood goes to torpor on it, at 1 blood it comes home empty
          const riskW = myB == null ? 1 : (myB <= 0 ? 0.3 : myB === 1 ? 0.7 : 1);
          const sR = (0.8 + 0.12 * (ctx.rush.target.w || 0)) * mult * riskW * P.aggression * dirW + Math.min(0.15, 0.05 * ex.nCombat); scores.rush = +(sR).toFixed(2); scores.rushParts = { tb, expDmg: ex.expDmg, mult, riskW };
          if(sR > sPick){ pick = ctx.rush; sPick = sR; why = 'rush ' + ctx.rush.target.name + ' (blood ' + ctx.rush.target.blood + ', expDmg ' + ex.expDmg + ' vs ' + tb + ', combat cards ' + ex.nCombat + '): ' + sR.toFixed(2); }   // v0.6.74: the calculation visible in every dossier
        }
        if(ctx.equip){
          const sEq = (ctx.equip.tier === 1 ? 1.5 : 1.15) * econW; scores.equip = +(sEq).toFixed(2);   // E1: intercept-equipment (the wall investment) outranks weapons/armor; deliberately NOT aggression-scaled
          if(sEq > sPick){ pick = ctx.equip; sPick = sEq; why = 'equip ' + ctx.equip.name + ' (tier ' + ctx.equip.tier + '): ' + sEq.toFixed(2); }
        }
        if(ctx.fetch){
          const sF = (1.35 + (ctx.fetch.tier === 1 ? 0.35 : 0)) * econW; scores.fetch = +(sF).toFixed(2);   // E1: the tutor beats the raw equip slightly (card selection), tier-1 targets more still
          if(sF > sPick){ pick = ctx.fetch; sPick = sF; why = 'Magic of the Smith -> ' + ctx.fetch.target.name + ' (tier ' + ctx.fetch.tier + '): ' + sF.toFixed(2); }
        }
        if(ctx.card){
          const cardB  = (ctx.card.cost && ctx.card.cost.blood) || 0;   // v0.6.116: blood is a real price -- 0.1/point (the cancel-block weight), plus a soft drag when paying leaves the actor thin: 0.6 at 1 blood left, 1.2 at 0 (empty = forced hunt next turn; the employ guard's "leave >= 1" as a weight, not a hard gate, because a +2 bleed for the last blood is often RIGHT). Govern [dom] (bleed 3, cost 1) from 3 blood: 3-0.35-0.1 = 2.55; from 1 blood: 1.35 -- still beats plain 1.0. Dominate Kine (bleed 2 +1 st, cost 2) from 2 blood: 2-0.35+0.2-0.2-1.2 = 0.45 -- plain bleed, keep the blood.
          const lowB   = cardB && ctx.card.bloodAfter != null ? (ctx.card.bloodAfter <= 0 ? 1.2 : ctx.card.bloodAfter === 1 ? 0.6 : 0) : 0;
          const sCard  = ctx.card.n * P.aggression * offW - 0.35 + (ctx.card.st | 0) * 0.2 - cardB * 0.1 - lowB - (this._lastPickName === ctx.card.name ? 0.15 * (this._pickStreak | 0) : 0);   // v0.6.79: repeat-pick decay -- the freeze antidote   // a card in hand has value — small spend cost; fas A (16 July): built-in stealth is WORTH something (each point lowers block odds -- Night Moves at bleed 1 was scoring 0.65 vs plain 1.0 and never got played, its +3/+6 stealth weighed at zero); 0.2/point is the deliberately dumb v1 weight
          const sCardH = ctx.holdBleed ? sCard * (ctx.holdBleed.w || 0.6) : sCard; if(ctx.holdBleed){ scores.cardHeld = +sCardH.toFixed(2); scores.holdBleed = ctx.holdBleed.why; }   // v0.6.143
          if(sCardH > sPick){ pick = ctx.card; sPick = sCardH; why = ctx.card.name + ': ' + sCardH.toFixed(2) + (ctx.holdBleed ? ' (held back x' + (ctx.holdBleed.w || 0.6) + ': ' + ctx.holdBleed.why + ')' : '') + (cardB ? ' (blood cost ' + cardB + (lowB ? ', leaves ' + ctx.card.bloodAfter : '') + ')' : '') + ' vs best-so-far'; }
        }
        return { pick, why, scores };   // A2: the podium rides the action out
      }
      case 'cancel-block': {        // fas C (16 July): Elder Impersonation-class -- a GUARANTEE vs spend-stealth's bet, so it carries a flat +0.25 certainty premium on top of the same stakes weighting; the blood cost drags 0.1/point. At stakes 3 (Inside Dirt) a grinder scores 1.0*1.0+0.25-0.1 = 1.15 -> spend; at stakes 1 (a hunt) 0.65 -> save the card (an exact tie falls on the save side by design).
        const stakesW = Math.min(1, Math.max(0.25, (ctx.stakes || 1) / 2));
        const score = P.aggression * stakesW + 0.25 - (ctx.cost || 0) * 0.1;   // premium 0.25 (not 0.3): an exact-threshold tie at stakes 1 must fall on the SAVE side -- the card is precious
        return { spend: score >= 0.7, why: 'cancel-block score ' + score.toFixed(2) + ' (stakes-weight ' + stakesW.toFixed(2) + ' + guarantee 0.25 \u2212 blood ' + ((ctx.cost || 0) * 0.1).toFixed(1) + ') vs 0.7' };
      }
      case 'spend-stealth': {        // v0.5+ (Johan, 14 July): "every action treated fundamentally the same" -- the bot CAN try to answer Block! with stealth regardless of which action is under attack (bleed, hunt, anything future); aggression/insight decide overall willingness same as before, and a NEW stakes factor lets a persona weight WHICH actions are worth burning a stealth card on -- a bleed's stakes scale with its amount (2 = an unmodified typical bleed, today's baseline, unchanged behaviour), hunt's fixed 1-blood prize is deliberately worth less than that baseline, so the SAME persona is now less eager to spend precious stealth defending a hunt than an equivalent-strength bleed. Capped at 1 (a huge bleed doesn't get MORE eager than the base aggression/insight read already allows) and floored so it never zeroes out entirely.
        const stakesW = Math.min(1, Math.max(0.25, (ctx.stakes || 1) / 2));
        if(ctx.stack && this.o.stealthStack !== 0){   // v0.6.143 CONTEST BY STACK (Johan's doctrine). The tally is PUBLIC: I know the stealth I need right now (their intercept - my stealth + 1, permanents included); what I do not know is what they can still ADD.
          const S = ctx.stack.S | 0, sum = ctx.stack.sum | 0, need = Math.max(1, ctx.need | 0), more = (ctx.pIntEff != null ? ctx.pIntEff : ctx.pInt) >= 0.5 ? 1 : 0, big = (ctx.stakes || 1) >= 3, axis = !!ctx.axis, pD = +ctx.pDraw || 0;
          let go, tag;
          if(S <= 0 || sum < need){ go = false; tag = S <= 0 ? 'no-stealth' : 'cannot-reach'; }                                  // even the whole stack does not beat what is already on the table: keep the cards
          else if(sum >= need + more){ go = true; tag = (S >= 3 || (S >= 2 && big)) ? 'strong-stack' : 'stack'; }                  // I beat the tally AND what they can plausibly add
          else if(big && (axis || P.aggression >= 1.2)){ go = true; tag = 'gamble'; }                                              // I beat the tally, they may still answer: taken when the bleed can become 3+ -- and an intercept card drawn out is one less for the next bleed
          else if(axis && (ctx.stakes || 1) >= 2 && pD >= 0.25){ go = true; tag = 'gamble-draw'; }                                 // Johan: the replacement draw can be the next stealth card
          else { go = false; tag = 'outstacked'; }
          return { spend: go, tag, pump: ctx.pump | 0, stack: S, need, theirs: more,
                   why: 'stealth in hand ' + S + ' card(s) adding ' + sum + ' vs ' + need + ' needed now' + (more ? ' + a plausible intercept card (P ' + (ctx.pIntEff != null ? ctx.pIntEff : ctx.pInt).toFixed(2) + (ctx.attempts ? ', ' + ctx.attempts + ' attempt(s) already drawn this turn' : '') + ')' : ' (they probably hold no more intercept)') + ', bleed can become ' + (ctx.stakes || 1) + (pD ? ', top-deck ' + pD : '') + ' \u2192 ' + tag };
        }
        return { spend: P.aggression * (1 - P.insight * ctx.pInt) * stakesW >= 0.5, pump: ctx.pump | 0,
                 why: 'aggr ' + P.aggression + ' × (1 − insight ' + P.insight + ' × P(int) ' + ctx.pInt.toFixed(2) + ') × stakes-weight ' + stakesW.toFixed(2) + ' (stakes ' + (ctx.stakes || 1) + (ctx.pump ? ' = the announced ' + ctx.announced + ' + a modifier in hand worth ' + ctx.pump : '') + ')' };
      }
      case 'bleed-modifier': {     // steg 2 (15 July): Leverage-class -- burn the Edge (if held) for +bleed on an action that's already going through. A REAL trade-off (unlike Parthenon's lock, which has none): burning it now forfeits the passive +1 pool this same Edge would otherwise grant at my OWN next unlock phase, in exchange for extra damage to the opponent RIGHT NOW -- persona-weighted on aggression, not unconditional. steg 4 (16 July, real Conditioning/Bonding card_text): generalized cost-aware -- a PURE blood cost (no Edge involved) has no such forfeiture to weigh, so it carries no penalty; only an actual `costEdge` card pays it.
        const edgePenalty = ctx.mod.costEdge ? 0.5 : 0;
        const score = ctx.mod.n * P.aggression - edgePenalty;
        return { play: score > 0, why: '+' + ctx.mod.n + ' bleed \u00d7 aggr ' + P.aggression + (edgePenalty ? ' \u2212 forfeited Edge-pool (\u2248' + edgePenalty + ')' : ' (blood-only cost, no Edge forfeiture)') + ' = ' + score.toFixed(2) };
      }
      case 'master-play': {         // v0.5+ (Johan, 14 July): the RULE is "always play A master if we hold one" -- not persona-weighted itself (more economy is good for every persona alike), but there's a real preference ORDER: a trifle+known-asset combo first (the bonus action affords a second play the SAME phase), else any other KNOWN income asset, else -- Johan's rule -- whatever master we DO have, even if its effect isn't curated yet (a human corrects/completes it via ctrl).
        if(!ctx.cands.length) return { pick: null, why: 'no master in hand (or none affordable)' };
        const known = ctx.cands.filter(c => c.known);
        const trifle = ctx.cands.find(c => c.trifle), knownPlain = known.find(c => !c.trifle);
        let pick, why;
        if(trifle && knownPlain){ pick = trifle; why = 'trifle (' + trifle.name + ') first \u2014 its bonus action affords ' + knownPlain.name + ' the SAME phase'; }
        else if(known.length){ pick = known[0]; why = 'known income asset: ' + pick.name; }
        else {
          pick = ctx.cands.reduce((a, b) => b.cost < a.cost ? b : a);
          // v1.4.0 follow-up (14 July): `known` only ever meant "recognized recurring-income fx" -- a curated Location (Parthenon/Information Highway/Ashur Tablets) correctly has none, but IS fully verified data, not a card the bot is guessing about. Distinguish on `curated` (src:'hand'), not `known`, so the log stops telling Johan a hand-checked card "might need adjusting".
          why = pick.curated
            ? ('curated, no recurring-income fx to model \u2014 always play A master (Johan, 14 July): ' + pick.name)
            : ('no known income asset in hand \u2014 always play A master (Johan, 14 July): ' + pick.name + ' (effect uncurated; a human can correct/complete it)');
        }
        return { pick, why };
      }
      case 'lock-actgrant': {       // v1.4.0 (14 July): whether to spend an in-play card's lock for its persist:'turn' actGrant bonus. Today's only consumer, The Parthenon, has NO real tradeoff -- no host vampire to compete for, no stated action-slot cost to lock it (the text doesn't say "as a master phase action", so locking only ADDS a slot, never spends one), and a fixed +1 amount, not a choice between several effects. Unconditional lock is therefore not a simplification, it's the actually-correct answer for this specific card -- kept as its own case (not inlined/hardcoded in the caller) so a FUTURE bespoke persist:'turn' card with a genuine tradeoff (a multi-choice card in the Dreams-of-the-Sphinx mould, or one with a real cost) has a natural place to add persona-weighted logic without restructuring _considerTurnActGrants itself.
        return { lock: true, why: ctx.name + ': actGrant persist:turn, no stated cost to lock \u2014 pure upside' };
      }
      case 'lock-income': {   // v0.6.31 (Johan's "push Inside Dirt to 100%" GO, Dreams of the Sphinx): whether to spend an in-play card's lock for a poolGain or bloodAdd choice. v1-simple, matching lock-actgrant's own precedent: ALWAYS take free pool/blood when eligible -- both are pure upside in isolation (no stated per-use cost beyond the lock itself). The genuine tradeoff this glosses over: Dreams of the Sphinx gains a counter per lock regardless of WHICH ability was used and burns at 3 -- a real "which of my 3 total uses is this worth" budget question, not modelled yet. Kept as its own case (not unconditional-inlined) for exactly the same reason lock-actgrant's comment gives: a future persona-weighted refinement (spend the budget on the highest-value choice, or hold it for a bigger later need) has a natural home here without restructuring _considerLockIncome itself.
        return { lock: true, why: ctx.name + ': ' + ctx.kind + ' +' + ctx.amount + ', no stated per-use cost beyond the lock itself \u2014 pure upside (v1: ignores the shared 3-counter burn budget across all of this card\'s choices)' };
      }
      case 'lock-rescue': {   // v0.6.39 (Johan's ask, Chantry): whether to spend a lock to rescue a torpored same-clan vampire. A torpored vampire is completely unavailable (can't act, can't block) -- getting it back is close to unconditional value, matching the SAME "v1-simple, pure upside" precedent as lock-income and lock-actgrant. The one genuine tradeoff (weakening a ready vampire by burning its blood) is already screened at the FINDER, not here: _considerLockRescue only offers a blood-payer that keeps at least 1 blood afterward, so by the time this decision runs, neither payment path leaves the bot worse off in a way worth second-guessing.
        return { lock: true, why: ctx.name + ': rescue ' + ctx.target + ' from torpor via ' + ctx.via + ' \u2014 a torpored vampire is fully unavailable, getting it back is close to unconditional value' };
      }
      case 'lock-handcycle': {   // v0.6.42 (Johan's ask, The Barrens): whether to spend a lock to discard a dead card and draw a fresh one. The genuine tradeoff (is this dead card worth more sitting in hand than a random unknown replacement) is already screened at the FINDER -- _considerHandCycle only offers this when _deadHandIndex found a card no ready vampire can do ANYTHING with, so there's no real downside left to weigh: a card worth zero right now, traded for a fresh unknown, is close to unconditional value, matching the same v1-simple precedent as lock-income/lock-rescue.
        return { lock: true, why: ctx.name + ': discard a dead card, draw fresh \u2014 the discarded card was worth nothing to any ready vampire, so the trade is close to unconditional value' };
      }
      case 'ashur-retrieve': {      // v1.4.2 (14 July): WHICH ash-heap card to move to hand -- Ashur Tablets' own retrieval choice. `ctx.candidates` arrives PRE-SCORED and pre-sorted (highest first) by CARD_HANDLERS['ashur-tablets'] via _ashScoreFor -- same division of labour as master-play (the caller gathers/scores candidates, decide() just picks). GENERAL v1 foundation only, no persona weighting yet (Johan, 14 July: land the general shape first, tune later against real playtests) -- the highest score wins outright.
        if(!ctx.candidates.length) return { pick: null, why: 'ash heap is empty \u2014 nothing to retrieve' };
        const top = ctx.candidates[0];
        return { pick: top.name, why: 'highest score (' + top.score.toFixed(2) + '): ' + top.name };
      }
      case 'hunt-or-bleed': {       // v0.5 (§7.6 B, Johan: "även frivilligt, persona-vägt"). Mandatory 0-blood hunts never reach this case (the caller decides those directly, unconditionally) -- this is only an otherwise-healthy vampire choosing hunt (build blood) over its usual bleed. Same >=1 scoring convention as block-as-target: higher urgency (more empty) or LOWER aggression pulls toward hunting; a high-aggression "weenie bleed" persona rarely volunteers, a cautious one tops up earlier.
        const cap = this.fxCryptCap(ctx.vamp.name) || 99;
        const need = Math.max(0, cap - (ctx.vamp.blood | 0));
        const urgency = need / Math.max(1, cap);
        const score = (urgency * 1.5) / P.aggression;
        return { hunt: score >= 1, why: 'blood ' + (ctx.vamp.blood | 0) + '/' + cap + ', urgency ' + urgency.toFixed(2) +
                                        ' \u00d7 1.5 \u00f7 aggr ' + P.aggression + ' = ' + score.toFixed(2) };
      }
    }
    return {};
  }

  /* ---------- table model + threat reads (pub diffs, seat-scoped ids) ----- */
  _onBoard(m){
    if(!m || !m.pub) return;
    const prevEdge = !!(this.table[m.seat] && this.table[m.seat].pub && this.table[m.seat].pub.edge);
    if(m.seat !== this.seat && m.pub.edge && !prevEdge && this.edge){ this.edge = false; this.push(); }   // the Edge is table-singular — yield on a RISING claim only (a STALE pub still carrying edge must not strip a fresh win)
    const t = this.table[m.seat] = this.table[m.seat] || { seen: new Set(), seeded: false };
    const hi = (m.seat !== this.seat) ? this._handIntel(m.seat) : null;   // R2 (v0.6.43): honest intel decay
    if(hi){
      const prevHand = (t.pub && t.pub.counts) ? (t.pub.counts.hand|0) : null;
      const nowHand  = (m.pub.counts) ? (m.pub.counts.hand|0) : null;
      if(prevHand != null && nowHand != null && nowHand > prevHand) hi.unknownDraws += (nowHand - prevHand);   // every observed draw dilutes (incl. the hidden [aus] replacement)
    }
    const fresh = [];
    (m.pub.cards || []).forEach(c => {
      if(t.seen.has(c.id)) return;
      t.seen.add(c.id);
      if(hi && c.name && c.kind !== 'crypt'){ const ix = hi.cards.findIndex(x => x.name === c.name); if(ix >= 0) hi.cards.splice(ix, 1); }   // a known name visibly left their hand (played/ashed/anywhere); face-down plays stay honest-unknown
      if(t.seeded && m.seat !== this.seat && !c.faceDown && c.name && c.kind !== 'crypt' && c.zone === 'ready')
        fresh.push(c);
      else if(t.seeded && m.seat !== this.seat && !c.faceDown && c.name && c.kind !== 'crypt' && c.zone === 'ash')
        this._noteObserved(m.seat, c.name, true);   // v0.6.118: THE ASH DIFF -- a card that went hand -> ash (reaction, combat, discard) never shows as a ready card; the ash heap is public and never misses a play
    });
    t.pub = m.pub; t.seeded = true;
    if(this._noServer && this.started && m.seat !== this.seat) this._noServerOust(m.seat, m.pub);   // v0.6.147
    if(m.seat !== this.seat) this._scanOpp(m.seat, m.pub);   // v0.6.118: the crypt half of the table model
    if(this._pentexWatch && m.seat === this._pentexWatch.seat){   // M2: freedom returns when the actor's Pentex leaves ready play
      const pxNow = (m.pub.cards || []).some(c => c && c.kind !== 'crypt' && c.zone === 'ready' && /^Pentex(\(TM\)|\u2122) Subversion$/.test(c.name || ''));
      if(pxNow) this._pentexWatch.seen = true;
      else if(this._pentexWatch.seen){
        this.note('Trainbot: Pentex left play \u2014 ' + (this._pentexVamp || 'the vampire') + ' can block again.');
        this._pentexVamp = null; this._pentexWatch = null;
      }
    }
    if(this._openHandActive && m.seat === this._openHandActive.seat){   // R3: the grant dies with the actor's tabled Revelations
      const revNow = (m.pub.cards || []).some(c => c && c.name === 'Revelations' && c.kind !== 'crypt' && c.zone === 'ready');
      if(revNow) this._openHandActive.seen = true;
      else if(this._openHandActive.seen){
        /* v0.6.112 (R4 self-review): if debug keeps the hand open anyway, revoking
           and immediately re-granting would blink the view and chat "open hand ends"
           when it did not. The Revelations STATE still resets — it is the WIRE revoke
           and the misleading chat that are suppressed. */
        this._openHandActive = null;
        if(!this._debugHand){
          this.send({ t:'openHand', to:'all', revoke: true });
          this.note('Trainbot: Revelations left play \u2014 open hand ends.');
        } else {
          this.o.log('Revelations left play — open hand stays (debug mode)');
        }
      }
    }
    fresh.forEach(c => this._threatNote(m.seat, c));
  }
  _threatNote(seat, c){
    this._noteObserved(seat, c.name);
    const h = this.fxLookup(c.name); if(!h || h.kind !== 'lib') return;
    const th = this.fxThreatOf(h.e);
    if(th.pool || th.blood){
      this._lastThreat = { seat, name: h.name, pool: th.pool, blood: th.blood, ts: Date.now() };
      this.o.log('threat read: ' + c.name + ' (seat ' + seat + ') → up to ' +
                 (th.pool ? th.pool + ' pool' : '') + (th.pool && th.blood ? ' / ' : '') +
                 (th.blood ? th.blood + ' blood' : ''));
    }
  }

  /* ---------- the pending-bleed machine (spec §5; bot as TARGET) -----------
     Announce ≠ resolve: NEVER auto-apply on the announce line. One refinement
     over the spec pseudocode, documented there: say-'Block!' marks the bleed
     CONTESTED instead of clearing — a cleared pending would silently eat a
     failed-block-then-'It resolves' bleed. Unresolved contests never
     auto-apply; the chat grammar stays the table's safety valve.            */
  predName(){ return this.seatName(this.prevLive(this.seat)); }
  _armPending(who, amount, actingVampName, owner, kind){   // v1.4.3 (14 July): added `actingVampName` + `owner`. `owner` is the Methuselah who CONTROLS the acting minion — equals `who` (the message sender) for a DIRECT bleed, but differs for a BOUNCED re-announce: BotB sends the re-announce (who='BotB'), but the acting minion still belongs to Johan (owner='Johan'). If `owner` is null/undefined, falls back to `who` (the common, direct case). Every downstream check that asks "whose action is this" reads `pending.who` (set to `owner`), not the message-level `who` — so +X adds (sent by the original owner, not the bouncer), 'It resolves' (said by the original owner), and Edge assignment all route correctly regardless of HOW the bleed reached this target.
    const realOwner = owner || who;
    this.pending = { who: realOwner, amount, kind: kind || 'bleed', actingVampName: actingVampName || null, contested: false, reacted: new Set(), blockerVamp: null, declined: false, attempted: new Set() };   // fas B (16 July): kind 'bleed' | 'pool' -- pool damage is NOT a bleed: _reactWindow suppresses bounce, _applyPending skips the Edge transfer   // fas A+ (16 July): vampire IDs that already made a FAILED block attempt this action -- the rulebook (Johan's steg-3 reading, verified steg 5): a failed attempt means retrying with a DIFFERENT minion; the same one never goes again   // steg 3 (15 July): `declined` -- see _reactWindow
    this.o.log('pending bleed armed: ' + amount + ' from ' + realOwner + (actingVampName ? ' (' + actingVampName + ')' : '') + (owner && owner !== who ? ' (via bounce from ' + who + ')' : ''));
    this._reactWindow();
  }
  _reactWindow(){
    this._emitSnapshot('react');       // A2 (rich option): the state every reaction decision saw                    // the symmetric window: Hold on… (thinking) → a real decision (M2) → Pass
    if(!this.pending || this.out) return;
    const p = this.pending;
    if(p.passTimer) clearTimeout(p.passTimer);
    if(this._blockBar && this._blockBar.who === p.who && this._blockBar.bar !== 'allies' && !p.declined){ p.declined = true; p.barred = this._blockBar.card; this.o.log('react window: ' + this._blockBar.card + ' \u2014 my vampires cannot block this action (reactions only)'); this._emit('block-barred', { by: p.who, card: this._blockBar.card }); }   // v0.6.127 (L12.blockBar): every blocker I have is a vampire -- the block is off the table, a bounce or a reducer is not
    const vamps = this.board.filter(c => c.zone === 'ready' && c.kind === 'crypt');
    const actorSeat = ((this.players || []).find(q => q.name === p.who) || {}).seat;
    /* v0.4.1 (Johan, source-verified): bounce needs "another Methuselah OTHER
       THAN the acting minion's controller" -- and the rulebook is explicit,
       "you can never bleed yourself" -- so if MY OWN prey happens to BE the
       actor (a 2-live-player table, where predator and prey collapse onto
       the same single other seat), there is no legal destination and bounce
       must not even be offered as an option.                               */
    const bounceLegal = !!actorSeat && this.preySeat() !== actorSeat && p.kind !== 'pool' && p.kind !== 'undirected' && p.kind !== 'rush' && p.kind !== 'asked';   // v0.6.110 (R2): an action I only know as "costs me N pool" is not a bleed -- Deflection has nothing to redirect   // v0.6.107 (B1): only a BLEED can be redirected   // fas B: pool damage is NOT a bleed -- Deflection & co are, per their own text, "only usable by the Methuselah being bled"; no bounce window exists against Inside Dirt
    let bounce = bounceLegal ? this._bestBounceFor(vamps, p.reacted) : null;
    if(bounce){                        // v0.6.79 (match improvement 1): save the LAST bounce for lethal hits -- amount/pool danger gate
      const bounceN = this.hand.filter(n2 => { const h2 = this.fxLookup(n2); return h2 && h2.kind === 'lib' && this._cats(h2.e).includes('bounce'); }).length;
      const danger = (p.amount | 0) / Math.max(1, this.pool);
      const PB = this.persona || PERSONAS.experienced;   // v0.6.104 (#6): same fix as the Jack floor -- the v0.6.16 class, site two
      if(PB.aggression < 1 && bounceN <= 1 && (p.amount | 0) <= 1){ bounce = null; this.o.log('bounce saved (last one, chip hit: danger ' + danger.toFixed(2) + ')'); }   // v1 = chip-saver (amount<=1); the ratio version (danger<0.25) broke the live bounce test at pool 30 -- v2 with persona tuning noted in recommendations
    }
    const rd = this._bestReduceFor(vamps, p);   // N4c: the fallback reducer (District's live half)
    /* steg 3 → steg 5 (16 July, rulebook-verified against vekn.net's
       "Detailed course of an action" + the rules director's May 2022
       newsletter): a decline is FINAL for BLOCKS ONLY -- "once every
       Methuselah has declined to block, the impulse goes back to the acting
       Methuselah who can increase the bleed or pass, then to the defending
       Methuselah to play 'bleed bounce' cards". Deflection & co are, per
       their own card text, "only usable after blocks are declined" -- so a
       reopened window (a modifier bump via L12.add) must still offer BOUNCE
       (steg 3 wrongly auto-passed the whole window; that over-generalized
       Johan's block-finality rule to reactions too). Only when declined AND
       nothing to bounce with is the immediate no-theatre Pass right. */
    if(p.declined && !bounce){ this.say('Pass'); return; }
    this.say('Hold on\u2026');
    const stealthA = (this.tally && this.tally.mode === 'block') ? (this.tally.a | 0) : 0;
    if(p.lateTimer){ clearTimeout(p.lateTimer); p.lateTimer = null; }
    const cpD = this._critPool(), actorP = (this.players || []).find(q => q.name === p.who) || {};
    const sbRead = actorSeat ? ((this.oppAxes(actorSeat).axes || []).includes('stealth-bleed') || this.oppStealth(actorSeat) >= 1) : false;   // 'this predator is a stealth bleeder': what the table model has seen (clan / disciplines / a TWD baseline are the later, better reads -- Johan)
    const pumpSeen = actorSeat ? Math.max(0, ...Object.values((this._opp(actorSeat).minions) || {}).map(mm => mm.hitMax | 0)) : 0;
    const bounceCards = this.hand.filter(n2 => { const h2 = this.fxLookup(n2); return h2 && h2.kind === 'lib' && this._cats(h2.e).includes('bounce'); }).length;
    const d = this.decide('block-as-target', { reserve: bounce && p.declined ? this._bounceReserve() : null, bounceN: bounceCards, isBleed: p.kind === 'bleed', edge: (this.pool | 0) <= cpD.crit || (p.amount | 0) >= (this.pool | 0), stealthBleeder: sbRead && (this.pool | 0) > cpD.crit + pumpSeen, pumpSeen, actorBot: !!actorP.bot,
      icp: this.interceptPotential(p.reacted, p), amount: p.amount, stealthA, hasBounce: !!bounce, blockAllowed: !p.declined,
      T: p.T || 'T1', role: p.role || 'target', sub: p.sub || p.kind, actorSeat: actorSeat || null, actorUnlocked: p.actorUnlocked | 0, famedTarget: !!p.famedTarget });   // v0.6.107 (B1): the threat class + role ride into the scorer
    if(d.tag) this._emit('defence-plan', { tag: d.tag, amount: p.amount | 0, hasBounce: !!bounce, bounceN: bounceCards, reserve: d.reserve != null ? d.reserve : null, stealthBleeder: sbRead, pool: this.pool | 0, crit: cpD.crit });
    this._emit('block-eval', { kind: p.kind, sub: p.sub || null, T: p.T || 'T1', role: p.role || 'target', block: !!d.block, bounce: !!d.bounce, score: (typeof d.score === 'number') ? +d.score.toFixed(2) : null, parts: d.parts || null, why: d.why,
      model: actorSeat ? { forecast: this.oppForecast(actorSeat), tto: this.turnsToOust(actorSeat), oppCombat: this.oppCombat(actorSeat), oppStealth: this.oppStealth(actorSeat), axes: this.oppAxes(actorSeat).axes } : null });   // v0.6.118: the table-model reads at decision time -- the arena calibrates the priors against them   // v0.6.107 (B1): every window is evaluable
    const reactMs = this.decide('react-delay', {}).ms;
    p.reactAt = Date.now() + reactMs;   // v0.6.109 (#1): the widget can SHOW this wait ("reacting to Alice's bleed, 1.2s") but step() deliberately does not resolve it -- the only honest resolutions here are the bot's own decision (which is already running) or the actor resolving their action, and inventing a third would let a button reach a game state the bot could not reach alone
    p.passTimer = setTimeout(() => {
      if(this.pending !== p || this.out) return;
      if(d.bounce && bounce) this._commitBounce(p, bounce).catch(e => this.o.log('commitBounce error:', e.message));   // steg 6: async now (may pace a wake->bounce combo) -- fire-and-forget like _commitBlock just below
      else if(d.block && !p.declined) this._commitBlock(p, d).catch(e => this.o.log('commitBlock error:', e.message));   // v0.4.5: _commitBlock is now async (paces a wake->intercept combo) -- fire-and-forget like _playTurn(); steg 5: the !declined belt to the decide()-level suspender -- a block after a final decline must never fire from EITHER layer
      else if(rd) this._commitReduce(p, rd).catch(e => this.o.log('reduce commit error:', e.message));   // N4c: the FOURTH outcome; v0.6.68: .catch -- fire-and-forget async must never kill the process (the _resolveCombat precedent)
      else if(bounce && this.o.lateBounce !== 0 && !p.declined && !actorP.bot && (p.amount | 0) >= 2){   // v0.6.144: a HUMAN actor may resolve without ever opening a window on the total -- so I ASK (Johan: 'the bot should ask for any bleed modifiers before the bleed resolves') and, if no modifier comes, bounce after a short grace
        this.o.log('react window: ' + d.why + ' \u2192 no block; asking for the total'); p.declined = true;
        this.chat('Trainbot: no block. Any bleed modifiers? I may still react to the total.');
        this._emit('defence-plan', { tag: 'ask-total', amount: p.amount | 0 });
        p.lateTimer = setTimeout(() => { if(this.pending !== p || this.out) return; const b2 = this._bestBounceFor(this.board.filter(c => c.zone === 'ready' && c.kind === 'crypt'), p.reacted); if(b2) this._commitBounce(p, b2).catch(e => this.o.log('late bounce error:', e.message)); else this.say('Pass'); }, (this.o.modGraceMs != null ? this.o.modGraceMs : 4000));
      }
      else { this.o.log('react window: ' + d.why); p.declined = true; this.say('Pass'); if(p.kind === 'rush') this._complyRush(p); }   // v0.6.107 (B1): declining a rush = the rushed vampire locks and fights   // steg 3: the decline itself -- final for BLOCKS (never set on a failed ATTEMPT; that path re-enters via _onLog's L12.block fail handler with declined still false). steg 5: no longer final for the whole window -- see above.
    }, reactMs);
  }
  async _commitBounce(p, bounce){          // Deflection & co (rulebook, source-verified): redirects to ANY Methuselah other than the acting minion's controller -- v1 defaults to MY OWN prey, the conventional choice (pass the bleed downstream, same as a real player usually does). v1.4.3 (14 July): the log line is now a SPEC-CORRECT L12.bleed re-announce with a Target: suffix, not a freeform prose line -- fixed because (a) the diagnostic run proved the old freeform line didn't match any L12 pattern at all, so the NEW target's pending never armed, and (b) the real human client uses exactly this mechanism (pool-targeting + targetSuffix() on the next log line) for the same operation, confirmed from klientkoden. Johan, 14 July: "man sätter target på den man vill Bounca till och spelar kortet, som då genom klonamination och logg visar vem som är target." steg 6 (16 July): now async -- a LOCKED reactor spends a wake FIRST (rulebook glossary: a woken vampire "can ... play reaction cards as though unlocked for the duration of the action"; it STAYS locked -- wake ≠ unlock), mirroring _commitBlock's own wake path, with a pace beat between the two plays.
    const cost = (bounce.cost && bounce.cost.blood) || 0;
    const needsWake = !!bounce.vamp.locked;              // re-derived from CURRENT state, not the scored-time flag -- the vampire may have (un)locked under the think delay
    const wk = needsWake ? this._wakeCard() : null;
    const wkCost = (wk && wk.cost && wk.cost.blood) || 0;
    if(this.hand.indexOf(bounce.name) < 0 || (needsWake && !wk) || (bounce.vamp.blood | 0) < cost + wkCost){
      this.o.log('bounce reconsidered (card, wake, or vampire no longer available) \u2014 re-evaluating');
      return this._reactWindow();
    }
    if(wk){                                              // steg 6: the wake play itself -- the SAME card family _commitBlock already spends for a locked blocker, now also serving a locked bouncer
      this.hand.splice(wk.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
      this._toAsh(wk.name);   // v0.6.12 (18 July, ash sweep): EVERY hand play reaches the public ash heap -- eight reaction/combat/modifier paths spliced the card into thin air since their birth (only actions/masters/discards ever called _toAsh)
      this._emitPlay(wk.name, 'wake', bounce.vamp && bounce.vamp.name);   // v0.6.139: this spend left no trace row (CLAUDE.md 43c)
      if(wkCost) bounce.vamp.blood = Math.max(0, (bounce.vamp.blood | 0) - wkCost);
      this.fxClone({ name: wk.name, kind: 'lib' }, 'may react as though unlocked', { actor: bounce.vamp });
      this.send({ t: 'log', html: '<b>' + esc(bounce.vamp.name) + '</b> plays <b>' + esc(wk.name) + '</b>: may react as though unlocked.' });
      await this._pace();                                // a beat between the wake reveal and the bounce itself, mirroring _commitBlock's wake->intercept pacing
    }
    const j = this.hand.indexOf(bounce.name);            // v0.4.2: the idx was computed BEFORE the think delay -- re-anchor by name; the hand may have shifted under us (and steg 6: the wake splice just above shifts it AGAIN)
    if(j < 0){
      this.o.log('bounce reconsidered (card left the hand after the wake) \u2014 re-evaluating');
      return this._reactWindow();
    }
    bounce.idx = j;
    p.reacted.add(FX_NORM(bounce.name));
    this.hand.splice(bounce.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
    this._toAsh(bounce.name);   // v0.6.12 ash sweep
    this._emitPlay(bounce.name, 'react-bounce', (bounce.vamp && bounce.vamp.name) || null);   // A2b (9th review): the OBJECT is the parameter -- bounce.vamp is the reactor
    if(cost) bounce.vamp.blood = Math.max(0, (bounce.vamp.blood | 0) - cost);
    if(bounce.lock !== false) bounce.vamp.locked = true;   // v1.4.3: Deflection [dom] locks the reacting vampire; [DOM] ("do not lock") doesn't; steg 6: a WOKEN reactor is already locked (wake never unlocks -- rulebook glossary), so this is idempotent for that path -- the lock tag from cardfx already distinguishes these (mode.lock:true vs absent), but _bestBounceFor returns the mode's own lock field; `false` is the explicit "do not lock" (same three-state as the compiler's own negation handling)
    const newPreyName = this.seatName(this.preySeat());
    this.fxClone({ name: bounce.name, kind: 'lib' }, 'bounces the bleed', { actor: bounce.vamp });
    /* the CARD-PLAY line (what the bounce card itself does -- purely informational, not L12-parsed) */
    this.send({ t: 'log', html: '<b>' + esc(bounce.vamp.name) + '</b> plays <b>' + esc(bounce.name) + '</b>: the bleed is redirected to ' + esc(newPreyName) + '.' });
    /* the RE-ANNOUNCE line (the REAL signal the NEW target's _onLog → L12.bleed parser arms its pending from):
       uses the ORIGINAL acting minion's name (from p.actingVampName, preserved across bounces) and
       the CURRENT amount (from p.amount, which may have been modified by +X cards already), with a
       Target: suffix naming the new target's pool -- identical to what a human client sends when
       pool-targeting someone and clicking "Bleed N" (targetSuffix() appends "Target: X's pool."). */
    const actVamp = p.actingVampName || 'A minion';   // fallback if the vampire name wasn't captured (a legacy pending, or a human's log line where m[1] wasn't a vampire name we recognize -- belt-and-suspenders, shouldn't happen in practice)
    this.send({ t: 'log', html: '<b>' + esc(actVamp) + '</b> bleeds for ' + p.amount + '. Target: ' + esc(newPreyName) + "'s pool." });

    this.say('Pass');   // steg 2 fix (15 July, found via diag-steg2.js): _reactWindow ALWAYS opens with 'Hold on…', pausing any actor's _ask (a.pausedBy.add + timer cleared) -- but until now bounce never sent ANY of the three phrases _onSay's pausedBy.delete() listens for, so a bouncing reactor stayed "still thinking" forever from the actor's point of view: the ask's timer never restarts, and even a CORRECTLY-tracked new target's own Pass can't resolve it (blocked by `!a.pausedBy.size`). Bounce IS a "not blocking" outcome exactly like _reactWindow's own plain pass branch just below -- same phrase, same meaning.
    this.push();
    this._clearPending('bounced via ' + bounce.name);   // the action continues, but no longer targets me
  }
  _playBleedModifier(vamp, mod){     // steg 2 (15 July): pays the cost, bumps _actingVamp.n, and sends a SPEC-CORRECT L12.add re-announce -- the bot's first-ever sender of this line (PROTOCOL §12 already documented it for a human's own +X bleed submenu; a receiving bot's _onLog already reopens ITS _reactWindow on any matching add, built for that human case, works identically here with zero new receiving-side code). Re-anchors the hand index by NAME (the same v0.4.2 bounce lesson: an await between scoring and playing may let the hand shift under us).
    const av = this._actingVamp; if(!av) return false;
    const j = this.hand.indexOf(mod.name);
    if(j < 0) return false;
    const bloodCost = (mod.cost && mod.cost.blood) || 0;
    if((vamp.blood | 0) < bloodCost) return false;
    av.played.add(FX_NORM(mod.name));
    this.hand.splice(j, 1); this._drawOwed = (this._drawOwed || 0) + 1;
    this._toAsh(mod.name);   // v0.6.12 ash sweep
    this._emitPlay(mod.name, 'bleed-mod', av && av.v && av.v.name);   // v0.6.139: this spend left no trace row (CLAUDE.md 43c)
    if(bloodCost) vamp.blood = Math.max(0, (vamp.blood | 0) - bloodCost);
    if(mod.costEdge) this.edge = false;     // burns the CURRENT Edge as Leverage's own cost
    if(mod.edgeLock) av.edgeLocked = true;  // steg 4 (16 July, real card_text): "You cannot gain the Edge this action. If you would get the Edge, it is burned instead." -- corrects steg 2's wrong assumption that a burn-then-regrant was fine; checked at final resolution below
    if(mod.limited) av.limitedUsed = true;  // steg 4: only ONE (limited) bleed modifier per action (Conditioning/Bonding both carry it) -- Leverage itself is exempt (its own text: "does not count against the limit"), so this only ever gets set by a genuinely (limited) card
    av.n += mod.n;
    this.fxClone({ name: mod.name, kind: 'lib' }, '+' + mod.n + ' bleed', { actor: vamp });
    this.send({ t: 'log', html: '<b>' + esc(vamp.name) + '</b> plays <b>' + esc(mod.name) + '</b>' + (mod.costEdge ? ': burns the Edge for' : ':') + ' +' + mod.n + ' bleed.' });
    this.send({ t: 'log', html: '<b>' + esc(vamp.name) + '</b> adds +' + mod.n + ' bleed (= ' + av.n + ').' });   // PROTOCOL §12, frozen wording -- the re-announce a receiving bot's L12.add parser matches
    /* v0.6.109 (#7b, Johan's double bubble): this site used to ALSO chat the
       play, ~150 ms before _playMinion's _askBlock chatted "adds +N bleed —
       now M on X. Reactions?" — two loud bubbles for ONE event. Per PROTOCOL
       §12.0 the announce is STATUS and the question is SPEECH, and the two
       log lines directly above already carry the announce in full (the play
       line + the frozen L12.add re-announce). So the chat is deleted, not
       demoted: there was nothing in it the log did not already say. */
    this.push();
    return true;
  }
  _pickBlocker(reacted, attempted, p){  // v0.4.3: the DECISION (interceptPotential) sums capability across ALL vampires -- the pick must agree, or a wrong-disc vampire first in board order leaves the counted card unplayable (proven: Zip picked while only Abderrahim could use the aus intercept). Best usable intercept wins; ties/no-cards fall back to board order. fas A+ (16 July): `attempted` excludes vampires whose block attempt already FAILED this action -- same-minion retries are illegal.   // VA: p brings kind + actingVampName for the crypt mods + the Navar age filter
    let best = null, bestS = -1;
    this.board.forEach(c => {
      if(c.zone !== 'ready' || c.kind !== 'crypt' || c.locked) return;
      if(this._pentexVamp && c.name === this._pentexVamp) return;   // M2: this minion cannot block (Pentex)
      if(this._cryptCannotBlock(c, p && p.actingVampName)) return;  // VA: Navar-class -- cannot block an older (higher-cap) actor
      if(attempted && attempted.has(c.id)) return;   // fas A+: a failed attempter never retries the same action
      const ic = this._bestInterceptFor(c, reacted || null);
      const frail = ((c.blood | 0) <= 1) ? -0.4 : 0;   // B-55f BASE (4 Aug, M4's four-straight-Zöe trace): a 1-blood blocker eats the default incoming strike into TORPOR -- at equal intercept, prefer a body that survives the trade (3-blood Casey stood idle while Zöe blocked herself to torpor). The -0.4 is tie-breaker-scale: intercept CAPABILITY still dominates (a dying vampire WITH the card beats a healthy bare one), and a dying SOLE candidate is still picked (blocking beats not blocking -- decide already said yes). GENERAL base behavior per Johan's doctrine: every blocking bot weighs survivability; archetype-level intercept BANKING is the deck-axis sibling (B-55f-b).
      const sc = (ic ? ic.s : 0) + this._equipIntercept(c) + this._cryptIntercept(c, p) + frail;   // E1: borne equipment counts   // VA: + crypt intercept
      if(sc > bestS){ best = c; bestS = sc; }
    });
    return best;
  }
  async _commitBlock(p, d){          // wake (if needed) -> an intercept card if one's usable -> the shared counter learns MY commitment
    this.o.log('react window: ' + d.why + ' \u2192 committing to block');
    p.contested = true;
    this._clearCombatStashes(); this._combatArmed = true;   // v0.6.103 (#1): the defender's handshake starts here, not at the verdict
    let blocker = this._pickBlocker(p.reacted, p.attempted, p);   // VA: the pending rides along (kind + actor for the crypt layer)
    let plan = null;                 // v0.6.103 (#4): FIND a route to a blocker first (finders only, no side effects), say Block! only when one exists, THEN play the route -- v0.6.102 shouted Block! before looking and could follow with Pass; the visible order Block! -> wake reveal -> intercept (v0.4.5's beat) is preserved
    if(!blocker){
      const wk = this._wakeCard();
      const wkCost = (wk && wk.cost && wk.cost.blood) || 0;
      const eligible = c => c.zone === 'ready' && c.kind === 'crypt' && c.locked && !(p.attempted && p.attempted.has(c.id)) && !(this._pentexVamp && c.name === this._pentexVamp) && !this._cryptCannotBlock(c, p.actingVampName);   // fas A+: a failed attempter never retries; M2: Pentex; VA: Navar -- the same three filters the three rungs always applied
      /* N1: a TRUE unlock beats act-as-unlocked -- Guard Dogs-class tried FIRST
         (bleeds only, per the card's own text), wake as the fallback, the Stray third. */
      if(p.kind === 'bleed'){
        for(const uc of this.board.filter(eligible)){
          const un = this._bestUnlockReactFor(uc, 'bleedAtMe');
          if(un){ plan = { kind: 'unlockReact', vamp: uc, un }; break; }
        }
      }
      if(!plan){                     // v0.6.139: Second Tradition-class -- a locked TITLED vampire unlocks to block ANY action, the intercept comes with it; tried before a plain wake (a wake would still need an intercept card)
        for(const uc of this.board.filter(eligible)){
          const un = this._bestUnlockReactFor(uc, 'lockedBlock');
          if(un){ plan = { kind: 'unlockReact', vamp: uc, un }; break; }
        }
      }
      if(!plan && wk){
        const want = d && d.parts && d.parts.viaWake ? d.parts.body : null;            // v0.6.120: decision == pick -- the body the EV chose wakes, when it still can
        const cands = this.board.filter(eligible).sort((a, b) => (b.name === want) - (a.name === want));
        for(const c of cands){ const w2 = this._wakeCardFor(c); if(w2){ plan = { kind: 'wake', vamp: c, wk: w2, wkCost: (w2.cost && w2.cost.blood) || 0 }; break; } }   // v0.4.2: only SPEND the wake when there is actually a sleeper to wake (and it can pay); v0.6.120: ...and PLAY (Eyes of Argus needs superior Auspex -- the blind finder handed it to anyone)
      }
      if(!plan){                     // N4d consumer B: the chain's THIRD rung -- burn the Stray for a TRUE unlock (unlockReact > wake > STRAY)
        const sCand = this.board.find(eligible);
        const stray = sCand && this.board.find(c => { if(!c || c.zone !== 'ready' || this._outOfPlay(c)) return false;
          const h = this.fxLookup(c.name); return h && h.kind === 'lib' && ((h.e.t) || []).includes('ally') && (h.e.modes || []).some(mo => mo.fx && mo.fx.allyBurnUnlock); });
        if(sCand && stray) plan = { kind: 'stray', vamp: sCand };
      }
    }
    if(!blocker && !plan){           // fas A+ (16 July): no un-attempted candidate remains -- retrying with the SAME minion is illegal, so this is a genuine end of the road: decline (final for blocks, steg 5) instead of looping a doomed Block!/fails cycle
      this.o.log('block: no un-attempted candidate remains \u2014 declining');
      p.contested = false; p.declined = true; this.say('Pass');
      return;
    }
    this.say('Block!');              // v0.6.103 (#4): a blocker exists, or a route to one does -- never a phantom Block!
    if(!blocker){
      if(plan.kind === 'unlockReact'){ await this._playUnlockReact(plan.vamp, plan.un); blocker = plan.vamp; }
      else if(plan.kind === 'wake'){
        const wk = plan.wk, wkCost = plan.wkCost, sleeper = plan.vamp;
        await this._pace();                              // v0.4.5: a beat between "Block!" and the wake reveal, instead of both firing in the same instant
        this.hand.splice(wk.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
        this._toAsh(wk.name);   // v0.6.12 ash sweep
        if(wkCost) sleeper.blood = Math.max(0, (sleeper.blood | 0) - wkCost);
        this.fxClone({ name: wk.name, kind: 'lib' }, 'may block as though unlocked', { actor: sleeper });
        this._emitPlay(wk.name, 'wake', sleeper.name);   // v0.6.120: the block route's wake never emitted a play -- the 15-match read counted ONE wake because only the vote/reduce routes reported theirs
        this.send({ t: 'log', html: '<b>' + esc(sleeper.name) + '</b> plays <b>' + esc(wk.name) + '</b>: may block as though unlocked.' });   // steg 6 (16 July): 'untapped' -> 'unlocked', the rulebook's own rename (tap/untap died with the Deckmaster era)
        blocker = sleeper;
      }
      else if(plan.kind === 'stray'){ if(this._strayUnlockBurn(plan.vamp)) blocker = plan.vamp; }
      if(!blocker){                  // belt: the route failed at play time (a shift under the await) -- withdraw honestly rather than attempt with nobody
        this.o.log('block: the locked-blocker route failed at play time \u2014 declining');
        p.contested = false; p.declined = true; this.say('Pass');
        return;
      }
    }
    p.attempted.add(blocker.id);     // fas A+: registered at ATTEMPT time -- if the verdict fails, this vampire is out of the running for this action (a failed attempt does NOT lock, per the rulebook; exclusion is by id, not by lock state)
    p.blockerVamp = blocker;         // remembered for the combat hand-off if the block succeeds (this.pending dies with the verdict)
    this._maybeRebelBlood(blocker, p.actingVampName);   // N4a: extracted for testability (the _revertHandSizeBonus precedent)
    const unIc = (typeof plan !== 'undefined' && plan && plan.kind === 'unlockReact' && plan.un && plan.un.intercept) | 0;   // v0.6.139: the unlock card carried its own intercept (Second Tradition) -- no second card, one reaction per action per card
    if(unIc) p.reacted.add(FX_NORM(plan.un.name));
    const ic = blocker && !unIc && this._bestInterceptFor(blocker, p.reacted);
    if(unIc){
      this._setTallyB(unIc + this._equipIntercept(blocker) + this._cryptIntercept(blocker, p));
      this.send({ t: 'log', html: '<b>' + esc(blocker.name) + '</b> attempts to block with +' + unIc + ' intercept (<b>' + esc(plan.un.name) + '</b>).' });
    } else if(ic){
      await this._pace();                                // v0.4.5: so a wake+intercept combo doesn't land as one instant double-play
      p.reacted.add(FX_NORM(ic.name));
      this.hand.splice(ic.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
      this._toAsh(ic.name);   // v0.6.12 ash sweep
      this._emitPlay(ic.name, 'react-intercept', blocker && blocker.name);   // v0.6.139: this spend left no trace row (CLAUDE.md 43c)
      if(ic.cost && ic.cost.blood) blocker.blood = Math.max(0, (blocker.blood | 0) - ic.cost.blood);
      this.fxClone({ name: ic.name, kind: 'lib' }, '+' + ic.s + ' intercept', { actor: blocker });
      this.send({ t: 'log', html: '<b>' + esc(blocker.name) + '</b> plays <b>' + esc(ic.name) + '</b>: +' + ic.s + ' intercept.' });

      this._setTallyB((ic.s) + this._equipIntercept(blocker) + this._cryptIntercept(blocker, p));   // VA review: RAW (rulebook: intercept below 0 is real; the verdict compares raw)   // fas A+ (16 July, rulebook source-verified): intercept belongs to THE MINION -- "all modifications made to a minion's stealth or intercept remain in effect for the duration of the action" (vekn.net Detailed Turn Sequence) -- so a NEW attempt by a DIFFERENT minion (the attempted-set guarantees it IS different) starts from ITS OWN intercept: b is written FRESH, never accumulated across minions. The old _bumpTallyB stacked d1's +2 under d2's +1 into a phantom b=3.   // VA: + crypt intercept (Dowager/Christine), the minion's TOTAL floored at 0 on the wire
    } else if(blocker){
      this._setTallyB((0) + this._equipIntercept(blocker) + this._cryptIntercept(blocker, p));   // VA review: RAW -- a bare Christine writes -1 and the actor's raw verdict correctly FAILS her block vs 0 stealth   // fas C uncertainty-review (16 July, Johan's question): a BARE attempt (no intercept card) must still write b FRESH -- the new minion's OWN intercept is 0 (+permanents, unmodelled in v1). Without this, the PREVIOUS attempt's b (a different minion's card, possibly a cancelled attempt's) survived in the shared tally and the verdict attributed it to the new blocker: the exact per-minion violation class fas A+ was built to kill, hiding in the card-less branch.   // VA: the bare attempt carries the crypt layer too -- a bare Dowager blocks a directed action at b=1
      this.send({ t: 'log', html: '<b>' + esc(blocker.name) + '</b> attempts to block.' });   // v0.6.106 (#14): FROZEN bot-emitted line -- the actor's L12.attempt parser reads the blocker name from here (was the 'Trainbot:' chat prefix)

    }
    this._noteBlockAttempt(blocker && blocker.name, true);   // v0.6.106 (#14): OWN attempts count toward the table climate here (the server never echoes my log lines)
    this._emit('block-made', { vamp: (blocker && blocker.name) || null });   // A2b (9th review): emitted at the chain's END -- three blocker sources converge here. B-55e (3 Aug): the emit sat INSIDE the else-if(blocker) bare-attempt branch, so the CARD-playing path (ic -- the common path for real intercept decks) never emitted since A2b's birth: the measurement series' 5 yes-decisions all played Enhanced Senses/Forced Awakening, blocked successfully, fought combats -- and left zero block-made events. Baixinho's bare attempts (the else path) were the only ones ever counted. Moved to the chain's TRUE end.
    this.push();
  }
  _clearCombatStashes(){             // v0.6.103 (#1): the five one-shot stashes + the persistent opponent Carrion Crows + the armed flag -- called at every own announce (actor), at every block commit (defender), at a rush comply, at dealt and at oust. NEVER at _resolveCombat entry: the defender's verdict hand-off runs ahead of the attacker's Blocked branch, so a legitimate opponent line may already sit here (the dodge-branch comment's case)
    this._oppEndedCombat = false; this._oppStrike = null; this._oppTaken = null; this._oppPress = undefined; this._oppManeuver = undefined; this._oppGrapple = undefined; this._oppCarrionCrows = null;
    this._combatArmed = false; this._combatOppName = null;   // v0.6.105: the previous combat's opponent name must not outrank the next action's blocker in _expectedOppVamp
  }
  _expectedOppVamp(){                // v0.6.103 (#1): who I am fighting (or about to fight): defender side = the announced actor (set by the caller of _resolveCombat); actor side = my blocker's vampire from the B-55e-b chat parse (valid only while I am the acting side -- _actingVamp is live)
    return this._combatOppName || (this._actingVamp ? this._lastBlockerName : null) || null;
  }
  _stashAccept(vamp){                // v0.6.103 (#1): may this incoming combat line enter my stash? IN combat: only my known opponent's (unknown opponent, e.g. a human blocker, accepts any -- humans never type the grammar anyway); OUTSIDE combat: only when a block/rush has ARMED me and the line names the vampire I expect (the early-arrival case). A bystander is never armed -> never stashes. The old code accepted every line at the table ("every strike line we receive is the OPPONENT's" was only true at 2-bot tables).
    const exp = this._expectedOppVamp();
    if(this._inCombat) return !exp || !vamp || vamp === exp;
    return !!(this._combatArmed && exp && vamp && vamp === exp);
  }
  _awaitOppStrike(ms){               // v0.6.4: the combat handshake's receive half -- returns the opponent's already-stashed strike (they may announce BEFORE our round starts: the defender's verdict hand-off runs ahead of the attacker's Blocked branch), else arms a one-shot waiter with a human-table timeout (a human never types the strike grammar -- null falls back to the old assume-1)
    if(this._oppStrike){ const s = this._oppStrike; this._oppStrike = null; return Promise.resolve(s); }
    return new Promise(res => {
      this._strikeWaiter = res;
      setTimeout(() => { if(this._strikeWaiter === res){ this._strikeWaiter = null; res(null); } }, ms || 2000);
    });
  }
  _awaitOppTaken(ms){                // v0.6.21 (Taste of Vitae): the SAME one-shot stash/waiter shape as _awaitOppStrike, but for the opponent's END-OF-ROUND "takes N (blood M)" chat narration rather than their strike announcement. This arrives LATER in the causal chain than the strike line (the opponent must first receive OUR strike via their own _awaitOppStrike before they can compute and announce their own final result) -- a human table, or an opponent who hasn't reached that point yet, both fall through to null within the timeout, and Taste of Vitae is simply not played rather than guessed.
    if(this._oppTaken){ const s = this._oppTaken; this._oppTaken = null; return Promise.resolve(s); }
    return new Promise(res => {
      this._takenWaiter = res;
      setTimeout(() => { if(this._takenWaiter === res){ this._takenWaiter = null; res(null); } }, ms || 2000);
    });
  }
  _awaitOppPress(ms){                // v0.6.22 (the multi-round loop, Press): the SAME stash/waiter shape again, for the opponent's own "presses to continue/end" announcement -- arrives after THEIR round-end resolution, same causal-chain reasoning as _awaitOppTaken. null on timeout (silent opponent / human table) is treated as "did not press" by the caller, not as "definitely separates" -- see _resolveCombat's own comment for why that distinction matters when I myself already pressed.
    if(this._oppPress !== undefined){ const s = this._oppPress; this._oppPress = undefined; return Promise.resolve(s); }
    return new Promise(res => {
      this._pressWaiter = res;
      setTimeout(() => { if(this._pressWaiter === res){ this._pressWaiter = null; res(null); } }, ms || 2000);
    });
  }
  _awaitOppManeuver(ms){              // v0.6.24 (the range concept, maneuvers): the SAME stash/waiter shape a third time, for the opponent's "maneuvers to close/long" announcement -- arrives EARLIEST in the causal chain (Determine Range is step 2, before Strike), unlike _awaitOppTaken/_awaitOppPress which arrive late. null on timeout means no evidence they maneuvered -- range stays at whatever I determined from my own side, matching the press handshake's same "absent evidence is not evidence of absence" philosophy.
    if(this._oppManeuver !== undefined){ const s = this._oppManeuver; this._oppManeuver = undefined; return Promise.resolve(s); }
    return new Promise(res => {
      this._maneuverWaiter = res;
      setTimeout(() => { if(this._maneuverWaiter === res){ this._maneuverWaiter = null; res(null); } }, ms || 2000);
    });
  }
  _awaitOppGrapple(ms){                // v0.6.28 (Immortal Grapple, the strike-type restriction): the SAME stash/waiter shape a fourth time, for the opponent's "plays Immortal Grapple" Pre-Strike announcement. Same rare-mechanic reasoning as maneuver's short timeout (Immortal Grapple + Grasp of the Python's superior are the only 2 cards needing this) -- null means no evidence, not "definitely didn't".
    if(this._oppGrapple !== undefined){ const s = this._oppGrapple; this._oppGrapple = undefined; return Promise.resolve(s); }
    return new Promise(res => {
      this._grappleWaiter = res;
      setTimeout(() => { if(this._grappleWaiter === res){ this._grappleWaiter = null; res(null); } }, ms || 2000);
    });
  }
  async _resolveCombat(myVamp, oppName){      // v0.6.22 (Johan's combat GO, the multi-round loop): the OUTER wrapper _resolveCombatRound was always meant to grow into (§7.5-C's original design: "plays at most the rounds a press grants"). Deliberately a THIN wrapper, not an internal rewrite -- _resolveCombatRound stays exactly as tested (every existing 37a-37g test calls it directly and is untouched), this just repeats it while there's an uncancelled press. v1 scope (source-verified vekn.net 19 July, combat plan §5.5): "if there is an UNCANCELLED press to continue, a new round begins" -- only ONE side needs to press. My bot NEVER attempts to cancel an incoming press (that decision -- "is it worth spending my own press just to deny theirs" -- is a future addition, not built); it presses when IT wants to (a simple, deliberately-dumb v1 threshold, matching grinderReadyTarget's own precedent: not fragile), and separately just detects whether the opponent pressed at all, treating any detected opponent press as uncancelled. Silent opponent (timeout, human table) is NOT treated as "they definitely didn't press" vs "they definitely did" -- it's simply absent evidence, so it doesn't extend combat on its own; only a DETECTED press (mine or theirs) does.
    this._carrionCrows = null; this._equipPreventUsed = false; this._equipManeuverUsed = false;   // v0.6.103 (#1): the OPPONENT's crows are no longer reset here (an early crows announce was wiped by the late-entering attacker) -- they live in the stash set cleared at announce/commit   // E1: per-combat equipment options
    this._borneEnvDmg = this._borneEnvFor(myVamp); this._borneAnnounced = false;
    this._combatOppName = oppName || (this._actingVamp ? this._lastBlockerName : null) || null; this._combatDmgTaken = 0;   // v0.6.103 (#1): the actor side learns its opponent from the B-55e-b blocker name (a bot blocker always chats it before the verdict)   // VB: the opposing vampire's NAME when the caller knows it (defender sites: the announced actor; a blocked ACTOR's blocker stays null -- documented v1 under-claim for Blythe-as-actor) + the Franciscus-class per-combat damage accumulator   // N0: the borne crows peck every combat   // v0.6.26: per-COMBAT state (not per-round like _range) -- "only one Carrion Crows each combat", and the opponent's active one persists across every round of THIS combat, reset only when a new one starts
    this._inCombat = true;   // v0.6.103 (#1): the handshake window -- _stashAccept reads it
    try{
    for(let round = 1; ; round++){
      const res = await this._resolveCombatRound(myVamp, round > 1);
      if(myVamp.zone === 'torpor') return;                    // combat already over from my own side
      if(res && res.ended) return;                            // v0.6.123: I ended the combat (Majesty)
      if(this._oppEndedCombat){ this._oppEndedCombat = false; return; }   // v0.6.123: THEY did -- no press into a fight that is over
      if(res && res.opponentSilent) return;                   // v0.6.23: a round-2+ opponent who never even answered the STRIKE handshake is the strongest signal this bot can get that there's no one left to press against -- stop offering more presses into the void rather than looping on phantom rounds
      const press = this._bestPressFor(myVamp);
      let continuing = false;
      if(press && (myVamp.blood | 0) > 1){                    // v1-dumb "do I want to" threshold: not fragile -- same spirit as case 'combat-strike', no persona weighting yet
        this.hand.splice(press.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
        this._toAsh(press.name);
        this._emitPlay(press.name, 'combat-press', myVamp && myVamp.name);   // v0.6.139: this spend left no trace row (CLAUDE.md 43c)
        if(press.cost && press.cost.blood) myVamp.blood = Math.max(0, (myVamp.blood | 0) - press.cost.blood);
        this.fxClone({ name: press.name, kind: 'lib' }, 'presses to continue', { actor: myVamp });

        this.push();
        continuing = true;
      } else if((myVamp.blood | 0) > 1 && this._strayPressBurn()){   // N4d consumer A: no press card -- the Stray burns a life for the press (the SAME v1-dumb willingness threshold)

        continuing = true;
      }
      const oppP = await this._awaitOppPress((this.o.askSecs || 2) * 1000);
      if(oppP && oppP.continue) continuing = true;
      if(!continuing) return;
    }
    } finally { this._inCombat = false; this._combatArmed = false; this._combatOppName = null; }   // v0.6.103 (#1); v0.6.105: the name dies with the combat
  }
  async _resolveCombatRound(myVamp, continued){ // v1 CUT LINE (spec §7.5-C): announce-only, one round, applies MY side; the opponent's strike isn't modelled -- assumes the rulebook default (hands, 1) unless I prevent it. Never steps the shared ph/rd counters. v0.6.23 (standing-question fix, the multi-round loop): `continued` is a NEW, backward-compatible optional 2nd arg -- every existing call (all of 37a-37g, all 6 real call sites for round 1) passes nothing, so this defaults falsy and behaves EXACTLY as before. `_resolveCombat` passes true for round 2+ ONLY.
    this._writeTally({ mode: 'combat', a: 0, b: 0, duelCid: myVamp.id, duelName: myVamp.name });   // combat IS server-merged per seat (v2.6.14); a/b zeroed explicitly (v0.4.2) -- the block referendum's stale stealth/intercept numbers must not masquerade as damage counters (the client's own avrOpen starts fresh too)
    /* v0.6.26 (Johan's combat GO, Carrion Crows): step 1 of 7, "Before Range" --
       source-verified vekn.net first (envDmgPerRound, §5.5-successor in the combat
       plan). "A vampire can play only one Carrion Crows each combat" -- tracked on
       `this._carrionCrows`, reset once per COMBAT (in _resolveCombat, not here --
       this runs every round). No real downside to playing it once available (free
       ongoing damage to the opponent, no cost on the card), so the v1 decision is
       simply "play it the first round I can", unlike press/maneuver's threshold. */
    if(!this._carrionCrows){
      if(this._borneEnvDmg > 0 && !this._borneAnnounced){
        /* N0: Murder of Crows-class -- announce with the Carrion phrase family so the
           generalized victim parser applies it via the SAME taken+= line. */
        this._borneAnnounced = true;
        this.note('Trainbot combat \u2014 ' + myVamp.name + "'s Murder of Crows: opposing minion takes " + this._borneEnvDmg + ' environmental damage each round for the rest of this combat (unpreventable by strikes, cannot be dodged).');
        await this._pace();
      }
      const cc = this._bestCarrionCrowsFor(myVamp);
      if(cc){
        this.hand.splice(cc.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
        this._toAsh(cc.name);
        if(cc.cost && cc.cost.blood) myVamp.blood = Math.max(0, (myVamp.blood | 0) - cc.cost.blood);
        this._carrionCrows = { n: cc.n };
        this.fxClone({ name: cc.name, kind: 'lib' }, 'plays Carrion Crows', { actor: myVamp });
        this._emitPlay('Carrion Crows', 'combat-env', myVamp.name);
        this.note('Trainbot combat \u2014 ' + myVamp.name + ' plays Carrion Crows: opposing minion takes ' + cc.n + ' environmental damage each round for the rest of this combat (unpreventable by strikes, cannot be dodged).');
        this.push();
      }
    }
    this._range = 'close';
    /* v0.6.28 (Immortal Grapple, superior): "If another round of combat occurs, that
       round is at close range (skip the determine range step for that round)" --
       when set by a PRIOR round's superior Grapple, this round's ENTIRE maneuver/
       range-determination step is skipped outright (not just my own maneuver check),
       consumed (reset false) once used, range stays at the 'close' default above. */
    if(this._forceCloseNextRound){
      this._forceCloseNextRound = false;
    } else {
      const maneuver = this._bestManeuverFor(myVamp);
      let myManeuvers = 0;
      if(maneuver){
        const wantLong = this.hand.some(n => {
          const h = this.fxLookup(n); if(!h || h.kind !== 'lib') return false;
          if(!(h.e.req && h.e.req.rangeLong)) return false;
          return (h.e.modes || []).some(mo => mo.fx && (typeof mo.fx.strike === 'number' || typeof mo.fx.stealBlood === 'number')
            && this._modeUsableBy(mo, myVamp) && (myVamp.blood | 0) >= ((h.e.cost && h.e.cost.blood) || 0));   // v0.6.25 (standing-question fix): the ORIGINAL check only asked "is there a rangeLong strike/steal card in hand" -- not "can THIS vampire actually USE it" (discipline) or "can it still afford the card's own cost after maneuvering". A vampire holding Death of the Drum with no cel/mel at all would maneuver to long for a card it could never play, wasting the maneuver for nothing (found live: Abraham DuSable, THA-only, still maneuvered).
        });
        if(wantLong){
        if(!maneuver.fromEquip){ this.hand.splice(maneuver.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1; } else { if(maneuver.fromGrant) this._reactManeuverGrant = false; else this._equipManeuverUsed = true; }   // E1/N1: board- and grant-maneuvers never splice; each consumes its OWN once-flag
          this._toAsh(maneuver.name);
          this._emitPlay(maneuver.name, 'combat-maneuver', myVamp && myVamp.name);   // v0.6.139: this spend left no trace row (CLAUDE.md 43c)
          if(maneuver.cost && maneuver.cost.blood) myVamp.blood = Math.max(0, (myVamp.blood | 0) - maneuver.cost.blood);
          this.fxClone({ name: maneuver.name, kind: 'lib' }, 'maneuvers to long', { actor: myVamp });

          this.push();
          myManeuvers = 1;
        }
      }
      /* v0.6.24: a SHORTER timeout than strike/press/taken's askSecs-derived one, on
         purpose. Maneuvers are rare (41 clean cards total, measured, out of the whole
         game) -- in the overwhelmingly common case where NEITHER side has one, BOTH
         sides would otherwise stall the full askSecs waiting for an announcement that
         can structurally never arrive (a real bot with no maneuver card never sends
         one). A real opponent WITH a maneuver still has ample time (network+decide
         latency is milliseconds); a genuinely slow human typing it by hand is the only
         realistic miss, an acceptable trade against doubling every round's latency.  */
      const oppM = await this._awaitOppManeuver(Math.min(200, (this.o.askSecs || 2) * 1000));
      const oppManeuvers = oppM ? 1 : 0;
      if((myManeuvers + oppManeuvers) % 2 === 1) this._range = 'long';
    }
    /* v0.6.28 (Johan's combat GO, Immortal Grapple -- the strike-type restriction
       concept): step 3 of 7, "Pre-Strike", AFTER range is determined (unlike Carrion
       Crows' step-1 window). "Cannot be used this round (by either combatant)" is
       SYMMETRIC -- one shared flag (`_handStrikeOnly`) covers both my own strike
       choice below and the opponent's, reset every round (unlike Carrion Crows'
       per-combat persistence). v1-dumb "do I want to" heuristic: play it UNLESS my
       own hand already holds a strike/steal card that ISN'T handStrike-tagged (a
       ranged/weapon option I'd rather keep available for myself) -- restricting the
       opponent is free value only when I'm not restricting away something I wanted. */
    this._handStrikeOnly = false;
    const grapple = this._bestImmortalGrappleFor(myVamp);
    if(grapple){
      const wouldCostMe = this.hand.some(n => {
        const h = this.fxLookup(n); if(!h || h.kind !== 'lib') return false;
        if(h.e.req && h.e.req.rangeClose && this._range !== 'close') return false;   // v0.6.28 fix (found live while testing): a rangeLong-gated card at close range (no maneuver played) was NEVER available this round regardless of Grapple -- the original check only asked "discipline usable", not "range-compatible right now", so it thought it had something worth preserving when it didn't
        if(h.e.req && h.e.req.rangeLong && this._range !== 'long') return false;
        return (h.e.modes || []).some(mo => this._modeUsableBy(mo, myVamp) &&
          ((typeof mo.fx.strike === 'number' || typeof mo.fx.stealBlood === 'number') && !mo.fx.handStrike || mo.fx.dodge));   // v0.6.29 (standing-question fix, found live): the original check only asked about strike/steal cards, never dodge -- but Immortal Grapple bans dodge ENTIRELY too ("You can not use any Dodges"), so a vampire holding a plain "Dodge" card would play Grapple anyway and then find its OWN dodge unusable this round. Verified live: "Mother" Anja Giovanni with Immortal Grapple + Dodge played Grapple, losing the Dodge option for nothing.
      });
      if(!wouldCostMe){
        this.hand.splice(grapple.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
        this._toAsh(grapple.name);
        this._emitPlay(grapple.name, 'combat-grapple', myVamp && myVamp.name);   // v0.6.139: this spend left no trace row (CLAUDE.md 43c)
        if(grapple.cost && grapple.cost.blood) myVamp.blood = Math.max(0, (myVamp.blood | 0) - grapple.cost.blood);
        this._handStrikeOnly = true;
        if(grapple.superior) this._forceCloseNextRound = true;   // "if another round of combat occurs, that round is at close range (skip the determine range step for that round)"
        this.fxClone({ name: grapple.name, kind: 'lib' }, 'plays Immortal Grapple', { actor: myVamp });

        this.push();
      }
    }
    const oppG = await this._awaitOppGrapple(Math.min(200, (this.o.askSecs || 2) * 1000));
    if(oppG) this._handStrikeOnly = true;
    const ce = this._bestCombatEndFor(myVamp);
    if(ce && this.decide('combat-end', { ce, vamp: myVamp }).end){   // v0.6.123: Strike: combat ends (Majesty). On the wire it IS the dodge shape -- no damage either way this round -- plus a `Combat ends` line so a bot opponent does not press into a fight that is over. It resolves before every other strike, so environmental damage (Carrion Crows) does not land either.
      this.hand.splice(ce.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1; this._toAsh(ce.name);
      if(ce.cost) myVamp.blood = Math.max(0, (myVamp.blood | 0) - ce.cost);
      this.fxClone({ name: ce.name, kind: 'lib' }, 'combat ends', { actor: myVamp });
      this._emitPlay(ce.name, 'combat-end', myVamp.name);
      this.send({ t: 'log', html: '<b>' + esc(myVamp.name) + '</b> strikes: <b>' + esc(ce.name) + '</b> \u2014 no damage either way this round.' });
      this.send({ t: 'log', html: 'Combat ends \u2014 <b>' + esc(ce.name) + '</b>.' });
      if(ce.unlock) myVamp.locked = false;
      await this._awaitOppStrike((this.o.askSecs || 2) * 1000);   // consume their strike line (the dodge branch's reason): keeps the one-slot stash clean for the NEXT combat
      this.chat('Trainbot combat \u2014 ' + myVamp.name + ' plays ' + ce.name + ': combat ends, no damage either way' + (ce.unlock ? '; ' + myVamp.name + ' unlocks' : '') + '. Tell me if your side differs.');
      this.push();
      return { ended: true };
    }
    const dodge = this._bestDodgeFor(myVamp);
    const dd = this.decide('combat-strike', { dodge, vamp: myVamp });
    if(dodge && dd.dodge){           // steg 6 (16 July): Strike: dodge -- no damage in EITHER direction this round FROM THE STRIKE ITSELF (so no prevent needed there); the vampire's own strike slot is consumed by the dodge
      this.o.log('combat-strike (' + myVamp.name + '): ' + dd.why);
      this.hand.splice(dodge.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
      this._toAsh(dodge.name);   // v0.6.12 ash sweep
      if(dodge.cost && dodge.cost.blood) myVamp.blood = Math.max(0, (myVamp.blood | 0) - dodge.cost.blood);
      this.fxClone({ name: dodge.name, kind: 'lib' }, 'dodges', { actor: myVamp });
      this._emitPlay(dodge.name, 'combat-dodge', myVamp.name);
      this.send({ t: 'log', html: '<b>' + esc(myVamp.name) + '</b> strikes: <b>' + esc(dodge.name) + '</b> \u2014 no damage either way this round.' });
      await this._awaitOppStrike((this.o.askSecs || 2) * 1000);   // v0.6.4: a dodge needs nothing from the opponent (0/0 regardless) -- but consuming their strike line here keeps the one-slot stash clean for the NEXT combat, and synchronises the round's end
      /* v0.6.27 (Johan's standing question, checking Carrion Crows for uncertainty --
         the DODGE-BYPASSES-ENVIRONMENTAL-DAMAGE bug): this branch used to `return`
         immediately here, before the code below that applies the opponent's active
         Carrion Crows ever ran -- meaning a dodging vampire took ZERO environmental
         damage, directly contradicting the rule this session already source-verified
         and wrote into the non-dodge path: "environmental damage... cannot be
         dodged". Found live: a fragile (blood 1) vampire facing an active enemy
         Carrion Crows (2/round) correctly CHOSE to dodge (per the existing fragile
         heuristic) and then incorrectly took 0 damage instead of 2 -- the dodge
         "protected" it from something the rulebook explicitly says it cannot. */
      if(this._oppCarrionCrows){
        const taken2 = this._oppCarrionCrows.n;
        const paid2 = Math.min(taken2, myVamp.blood | 0);
        const unmended2 = taken2 - paid2;
        myVamp.blood = (myVamp.blood | 0) - paid2;
        this._combatDmgTaken = (this._combatDmgTaken | 0) + taken2;   // VB review fix: undodgeable environmental damage is TAKEN damage -- the Franciscus accumulator was blind to the whole dodge branch
        let line2 = myVamp.name + ' dodges the strike (no damage either way from it), but Carrion Crows still lands: takes ' + taken2 + ' (loses ' + paid2 + ' blood, now ' + myVamp.blood + ').';
        const fx = this._cryptFxOf(myVamp.name);
        if(fx && fx.burnAtDamage != null && this._combatDmgTaken > fx.burnAtDamage){   // VB review fix: the burn check was ALSO missing here -- a Franciscus crossing the threshold on dodge-round env damage torpored instead of burning
          myVamp.zone = 'burned';
          line2 += ' ' + myVamp.name + ' is BURNED (took ' + this._combatDmgTaken + ' this combat, more than ' + fx.burnAtDamage + ' \u2014 his own curse; no torpor).';
        } else if(unmended2 > 0){
          myVamp.zone = 'torpor'; this._fameTorporHook(myVamp);
          if(myVamp.zone === 'burned'){
            line2 += ' ' + myVamp.name + ' goes into torpor and is BURNED (his own curse).';   // VB review: the Julius-consistency branch -- the hook may burn him, the line must not claim torpor
          } else {
            const tp2 = this._openSlot('torpor', myVamp);
            myVamp.x = tp2.x; myVamp.y = tp2.y;
            line2 += ' ' + myVamp.name + ' goes to torpor (' + unmended2 + ' unmended).';
          }
        }
        this.chat('Trainbot combat \u2014 ' + line2 + ' Tell me if your side differs.');
        this.push();
        return;
      }
      this.chat('Trainbot combat \u2014 ' + myVamp.name + ' dodges: no damage dealt or taken this round. Tell me if your side differs.');
      this.push();
      return;
    }
    if(dodge) this.o.log('combat-strike (' + myVamp.name + '): ' + dd.why);   // a dodge was available but the decision chose to strike -- log the why either way
    const strike = this._bestStrikeFor(myVamp);
    const steal = this._bestStealStrikeFor(myVamp);
    let dealt = 1, strikeLine = myVamp.name + ' strikes (hands) for 1';
    const sbN4 = this._strengthBonus(myVamp) + this._cryptStrengthMod(myVamp, this._combatOppName || this._duelOppName());   // N4b: strength IS base hand damage   // VB: + the crypt vsClan mod (Blythe -1 vs Malkavian); negatives are rules-real (FAQ 3.22), a hand strike floors at 0. VB review: the lazy _duelOppName fallback CLOSES the 13-site blocked-ACTOR under-claim -- the defender's duel write provably precedes their strike line, which we have already awaited
    if(sbN4 !== 0){ dealt = Math.max(0, 1 + sbN4); strikeLine = myVamp.name + ' strikes with hands for ' + dealt; }
    /* v0.6.19 (Johan's combat GO, source-verified vekn.net rulebook 19 July): "Steal
       Blood: ...does NOT count as damage... occurs before the mend damage step... If
       the stolen blood causes the striking vampire to have more blood than their
       capacity, the excess drains off immediately." Three consequences: (1) the
       FROZEN strike line still says "for 0" (dealt=0, not the card's steal amount) --
       the opponent's _awaitOppStrike parser reads dealt straight from that number, and
       0 correctly tells them no damage lands from this strike; (2) myVamp.blood gains
       the stolen amount HERE, before this same round's taken/paid/torpor math below,
       so a steal can help mend damage the opponent deals ME this identical round
       (the rulebook's own point of specifying this timing); (3) capped at myVamp.cap,
       matching the rulebook's own worked example (Chrysanthemum cap 5 + 4 blood steals
       2 -> 6 -> capped to 5). v1 tie-break: prefer steal only when my vampire is below
       capacity (an overflow-doomed steal wastes value a real damage strike wouldn't) --
       untested by Malkavian/Tremere today (neither deck ever offers both on one
       vampire), kept simple on purpose. */
    if(steal && (myVamp.blood | 0) < (myVamp.cap | 0) && (!strike || steal.n >= (strike.n | 0))){
      this.hand.splice(steal.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
      this._toAsh(steal.name);
      if(steal.cost && steal.cost.blood) myVamp.blood = Math.max(0, (myVamp.blood | 0) - steal.cost.blood);
      myVamp.blood = Math.min(myVamp.cap | 0, (myVamp.blood | 0) + steal.n);
      this.fxClone({ name: steal.name, kind: 'lib' }, 'steals ' + steal.n + ' blood', { actor: myVamp });
      this.send({ t: 'log', html: '<b>' + esc(myVamp.name) + '</b> strikes with <b>' + esc(steal.name) + '</b> for 0.' });
      this._emitPlay(steal.name, 'combat-steal', myVamp.name);
      this.note('Trainbot combat \u2014 ' + myVamp.name + ' strikes with ' + steal.name + ': steals ' + steal.n + ' blood (not damage; blood now ' + myVamp.blood + ').');
      dealt = 0; strikeLine = myVamp.name + ' strikes with ' + steal.name + ' for 0 (steals ' + steal.n + ' blood)';
    } else if(strike){
      if(!strike.fromEquip){ this.hand.splice(strike.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1; }   // E1: a board-granted strike never splices the hand
      if(!strike.fromEquip) this._toAsh(strike.name);   // E1 guard
      if(strike.cost && strike.cost.blood) myVamp.blood = Math.max(0, (myVamp.blood | 0) - strike.cost.blood);
      this.fxClone({ name: strike.name, kind: 'lib' }, 'strikes for ' + strike.n, { actor: myVamp });
      this.send({ t: 'log', html: '<b>' + esc(myVamp.name) + '</b> strikes with <b>' + esc(strike.name) + '</b> for ' + strike.n + '.' });
      this._emitPlay(strike.name, 'combat-strike', myVamp.name);
      dealt = strike.n; strikeLine = myVamp.name + ' strikes with ' + strike.name + ' for ' + dealt;
    } else if(sbN4 !== 0){
      /* N4b: the boosted bare fist rides the strikeC CHANNEL ('with hands') so the
         frozen strikeH 'for 1' grammar stays byte-identical for the unboosted case
         and the opponent's existing number-parser reads the true total. */
      this.send({ t: 'log', html: '<b>' + esc(myVamp.name) + '</b> strikes with <b>hands</b> for ' + dealt + '.' });
    } else {
      this.send({ t: 'log', html: '<b>' + esc(myVamp.name) + '</b> strikes (hands) for 1.' });
    }
    /* v0.6.4 COMBAT HANDSHAKE (16 July, arena root-cause after the block-verdict
       fix made bot-vs-bot combat REAL): the old `taken = 1` assumed the rulebook
       default no matter what the opponent actually did -- the attacker's vampire
       paid a PHANTOM blood against a dodge ("no damage either way") and could
       even torpor off nothing, while a card strike for 2 was under-taken. The
       real answer was already on the wire (both bots have always announced
       their strike as a log line); only the parser was missing. We now WAIT for
       the opponent's strike line (they announce before waiting too, so no
       deadlock) and take what they actually dealt; a silent opponent (a human
       table -- no human types the strike grammar) falls back to the old
       assume-1 within askSecs, with the "tell me if it differs" chat intact. */
    const opp = await this._awaitOppStrike((this.o.askSecs || 2) * 1000);
    /* v0.6.23 (Johan's standing question, checking the multi-round loop for
       uncertainty): a round-2+ timeout is NOT the same evidence as a round-1 timeout.
       Round 1 is only ever reached because combat just started -- the opponent is
       GUARANTEED to be a live, ready combatant (silence there just means a human
       table didn't type the grammar, so assume-1 was always safe). Round 2+ ONLY
       exists because someone pressed -- and this bot has NO visibility into whether
       MY OWN round-1 strike already burned/torpored the opponent (the architecture
       never mutates the opponent's board; "their own bot instance does that from
       their own side"). Assuming the rulebook default 1 in that silence would deal
       PHANTOM damage to a fight that may have already ended. Fail safe instead: a
       continued-round timeout assumes 0 (not "they dealt nothing", but "no evidence
       they're still here to deal anything") and reports opponentSilent so the caller
       can stop offering more presses into the void. */
    const opponentSilent = continued && !opp;
    let taken = opp ? (opp.dodge ? 0 : (opp.dealt | 0)) : (continued ? 0 : 1);
    this.o.log('combat incoming (' + myVamp.name + '): ' + (opp ? (opp.dodge ? opp.vamp + ' dodged \u2014 0' : opp.vamp + ' dealt ' + opp.dealt) : 'no strike line within the window \u2014 assuming the rulebook default 1'));
    if(taken > 0){ const _ep = this._equipPrevent(myVamp); if(_ep > 0){ taken = Math.max(0, taken - _ep); this.note('Trainbot: equipment prevents ' + _ep + ' (once this combat).'); } }   // E1: Kevlar-class fires BEFORE spending a hand card
    const prevent = taken > 0 ? this._bestPreventFor(myVamp) : null;   // v0.6.4: never burn a prevent card against zero incoming (a dodge) -- the old code would have wasted it
    if(prevent){
      await this._pace();            // v0.4.5: a beat between the strike and the prevent card -- two combat plays no longer land in the same instant
      this.hand.splice(prevent.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
      this._toAsh(prevent.name);   // v0.6.12 ash sweep
      this._emitPlay(prevent.name, 'combat-prevent', myVamp && myVamp.name);   // v0.6.139: this spend left no trace row (CLAUDE.md 43c)
      if(prevent.cost && prevent.cost.blood) myVamp.blood = Math.max(0, (myVamp.blood | 0) - prevent.cost.blood);
      if(prevent.x && typeof prevent.n === 'number' && taken > prevent.n){   // v0.6.142 (Johan, 20 Sep): Hidden Strength's X -- pay what the hit needs and prevent it ALL (no real downside: it is mostly aggravated damage one prevents this way, and it denies the effects that need the opposing vampire to deal more than mine). The vampire keeps 1 blood.
        const X = this._preventXFor(prevent, taken, myVamp);
        if(X > 0){ myVamp.blood = (myVamp.blood | 0) - X; prevent.n += X; this._emit('prevent-x', { card: prevent.name, vamp: myVamp.name, x: X, prevents: prevent.n, incoming: taken, blood: myVamp.blood | 0 }); }
      }
      this.fxClone({ name: prevent.name, kind: 'lib' }, 'prevents damage', { actor: myVamp });
      this.send({ t: 'log', html: '<b>' + esc(myVamp.name) + '</b> plays <b>' + esc(prevent.name) + '</b>: prevents ' + (prevent.n === 'all' ? 'all' : prevent.n) + ' damage.' });
      taken = prevent.n === 'all' ? 0 : Math.max(0, taken - prevent.n);
    }
    /* v1.6.1/v0.6.26 (Johan's combat GO, Carrion Crows): the OPPONENT's active
       Carrion Crows adds environmental damage HERE -- after prevention (source-
       verified: "high profile prevention cards... just won't work against it",
       most prevent wording is strike-specific), and unconditionally regardless of
       dodge (source-verified: "environmental damage... cannot be dodged" -- the
       official 2024 rulebook clarification). Combines into the SAME taken/paid/
       unmended math below rather than a separate mend step -- this bot models no
       First Strike interaction at all (the one documented case where environmental
       damage can be skipped entirely), so there is no scenario where environmental
       damage would need to be withheld pending an earlier resolution. */
    if(this._oppCarrionCrows) taken += this._oppCarrionCrows.n;
    this._combatDmgTaken = (this._combatDmgTaken | 0) + taken;   // VB: Franciscus-class -- "damage taken during a single combat" accumulates across ROUNDS of this combat (the printed text's own scope), reset at _resolveCombat entry
    /* v0.6.4 TORPOR RULE FIX (rulebook, source-verified 16 July): "a vampire can
       burn all of their blood if needed, and doing so does not have any other
       negative effects" -- torpor requires damage EXCEEDING blood ("more damage
       ... than they have blood"). The old `blood === 0 -> torpor` KO'd a
       vampire that paid exactly its last blood; correct is: pay what you can,
       any UNMENDED remainder wounds you -> torpor. An emptied-but-mended
       vampire stays ready (and the existing mandatory-hunt rule takes over
       next turn). */
    const paid = Math.min(taken, myVamp.blood | 0);
    const unmended = taken - paid;
    myVamp.blood = (myVamp.blood | 0) - paid;
    this._noteOppCombat(this._combatOppName, taken);   // v0.6.118: the combat half of the table model -- certain numbers, my own wounds
    let line = strikeLine + ' dealt; ' + myVamp.name + ' takes ' + taken + ' (loses ' + paid + ' blood, now ' + myVamp.blood + ').';   // v0.6.21 fix (Johan's standing question): the ORIGINAL half-finished Taste of Vitae parser read `taken` (raw damage) here, but the rulebook grants blood equal to what was LOST -- "takes N (blood M)" collapsed the two whenever unmended>0 (torpor: taken > blood-before, but paid caps at what the vampire actually HAD to lose). Explicit "loses P blood" clause added; no test asserted the old exact wording (grep-verified before changing it).
    const fx = this._cryptFxOf(myVamp.name);   // VB scanner-lesson (5th occurrence caught by the coverage facit): the local MUST be named `fx` so the source scanner sees the literal fx.burnAtDamage
    if(fx && fx.burnAtDamage != null && this._combatDmgTaken > fx.burnAtDamage){   // VB: printed "burned (WITHOUT going into torpor) if he takes MORE THAN N damage during a single combat" -- strict >, mended damage still counts as TAKEN, and the burn PREEMPTS the torpor path (no torpor entry => no Fame trigger)
      myVamp.zone = 'burned';
      line += ' ' + myVamp.name + ' is BURNED (took ' + this._combatDmgTaken + ' this combat, more than ' + fx.burnAtDamage + ' \u2014 his own curse; no torpor).';
    } else if(unmended > 0){
      myVamp.zone = 'torpor'; this._fameTorporHook(myVamp);
      if(myVamp.zone === 'burned'){
        line += ' ' + myVamp.name + ' goes into torpor and is BURNED (his own curse).';   // VB review: Julius-consistency -- the hook burns him, the combat line must agree
      } else {
        const tp = this._openSlot('torpor', myVamp);   // v0.4.5: was a hardcoded slot('torpor',0) -- every KO'd vampire landed on the SAME spot, stacking if more than one was ever down at once
        myVamp.x = tp.x; myVamp.y = tp.y;
        line += ' ' + myVamp.name + ' goes to torpor (' + unmended + ' unmended).';
      }
    }
    this.chat('Trainbot combat \u2014 ' + line + ' One round \u2014 tell me if your side\u2019s damage differs.');
    this.push();
    /* v0.6.21 (Johan's combat GO, Taste of Vitae -- completing the half-finished
       parser found via standing-question review, 19 July): end-of-round, AFTER my
       own announcement went out (giving the opponent a chance to have processed my
       strike and announced their own taken/lost figure -- the causal-chain ordering
       _awaitOppTaken's own comment describes). "Not usable by a vampire being burned
       or going to torpor" gates on MY OWN unmended status here directly (the finder
       has no visibility into this round's torpor outcome, only hand/discipline/cost).
       "Only one each round" is free: this hook runs once per _resolveCombatRound call,
       and v1 never calls it twice for the same combat (the single-round cut line).  */
    if(unmended === 0){
      const taste = this._bestTasteFor(myVamp);
      if(taste){
        const oppT = await this._awaitOppTaken((this.o.askSecs || 2) * 1000);
        if(oppT && oppT.n > 0){
          this.hand.splice(taste.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
          this._toAsh(taste.name);
          this._emitPlay(taste.name, 'combat-after', myVamp && myVamp.name);   // v0.6.139: this spend left no trace row (CLAUDE.md 43c)
          if(taste.cost && taste.cost.blood) myVamp.blood = Math.max(0, (myVamp.blood | 0) - taste.cost.blood);
          myVamp.blood = Math.min(myVamp.cap | 0, (myVamp.blood | 0) + oppT.n);   // v1.5.8/v0.6.19's steal-blood overflow rule applies universally to any blood gain, not just "steal"-worded cards
          this.fxClone({ name: taste.name, kind: 'lib' }, 'gains ' + oppT.n + ' blood', { actor: myVamp });
          this.note('Trainbot combat \u2014 ' + myVamp.name + ' plays ' + taste.name + ': gains ' + oppT.n + ' blood lost by ' + oppT.vamp + ' (blood now ' + myVamp.blood + ').');
          this.push();
        }
      }
    }
    return { opponentSilent };
  }
  _applyPending(via){
    const p = this.pending; if(!p) return;
    this._clearPending('resolved via ' + via);
    if(this.out) return;
    if(p.kind === 'undirected' || p.kind === 'rush'){ this._emit('let-through', { sub: p.sub || p.kind, role: p.role || null, T: p.T || null }); return; }   // v0.6.107 (B1): nothing lands on me -- the window simply closes
    /* v0.6.111 (R3 self-review): kind 'asked' (the R2 pool question and R3 politics) falls through to
       the generic pool -= p.amount below, exactly like kind 'bleed' -- which is the DESIGN, not an
       accident. Bounce and peek are kind-gated; an asked pending carries the table's own number and
       must deduct it, so the generic path is its correct home. */
    this.pool -= p.amount;
    this._predPressure = (this._predPressure | 0) + (p.amount | 0);   // v1.1: felt predator pressure feeds the backrush appetite
    if(p.kind === 'peek'){
      /* R3: Revelations resolved against me -- comply. NOT a bleed: amount is 0 (the
         generic deduction above was a no-op), the Edge stays. [aus]: reveal my hand
         PRIVATELY to the actor; their logTo discard command follows. [AUS]: standing
         open hand to all + _syncOpenHand on every change; the _onBoard watcher
         revokes when the actor's tabled Revelations leaves ready. */
      const aSeat = this._seatOfName(p.who) || this.predSeat();
      if(p.peekSup){
        this._openHandActive = { seat: aSeat, seen: false };
        this._syncOpenHand(true);   // v0.6.112 (R4): FORCED -- the grant's opening push must reach the actor even when the hand happens to match the last signature, or they are granted a view of nothing
        this.note('Trainbot plays with an open hand (Revelations).');
        this._emit('open-hand', { to: 'all', actorSeat: aSeat });
      } else {
        this.send({ t:'revealHand', to: aSeat, cards: this.hand.map(n=>({ name:n, kind:'lib' })),
                    pub: '<b>' + esc(this.seatName(this.seat)) + '</b> reveals their hand to <b>' + esc(p.who || '') + '</b> (Revelations).' });
        this.note('Trainbot reveals the hand to ' + (p.who || 'the actor') + ' (Revelations).');
        this._emit('revealed-hand', { to: aSeat, n: this.hand.length });
      }
      return;
    }
    if(p.kind === 'pool'){
      /* fas B (16 July): Inside Dirt-class pool damage -- NOT a bleed, so the Edge
         does NOT transfer (rulebook: the Edge changes hands on a successful BLEED
         only; Inside Dirt even burned the attacker's Edge as its own cost). */
      this._noteHit(p); this._emit('took-pooldmg', { n: p.amount, pool: this.pool });
      if(this.pool > 0){
        this.push();
        this.chat('I take ' + p.amount + ' pool damage. Pool: ' + this.pool + '.');   // v0.6.117: spoken, as a human acknowledges the hit
      } else this._oust(false);
      return;
    }
    this._noteHit(p); this._emit('took-bleed', { n: p.amount, pool: this.pool });
    if(this.edge) this.edge = false;                     // the successful bleeder takes the Edge from me
    if(this.pool > 0){
      this.push();
      this.chat('I take ' + p.amount + '. Pool: ' + this.pool + '.');   // v0.6.117: spoken -- "I take 3, pool 27" is how the bled player answers at a table
    } else this._oust(false);
  }
  _clearPending(reason){
    this._reactManeuverGrant = false;   // N1 belt: a failed block means no resulting combat -- the Guard Dogs rider dies with the pending
    this._actStealthRaw = null;         // VA review belt: the actor-side raw stealth total dies with the action (the next announce re-seeds it)
    /* v0.6.111 (R3 self-review): the pool question and the observation die with
       the pending -- an oust, a turn change, or a fresh deal must not leave a
       stale timer ticking. _clearPending is already the single bottleneck for all
       three paths (l.878, l.971, _oust->_clearPending), so this is enough. */
    if(this._pq){ if(this._pq.timer) clearTimeout(this._pq.timer); this._pq = null; }
    this._obs = null;   // v0.6.111 (R3 self-review, simplified): every pending-clear also clears the observation. A bounce supersedes the pending but not the action -- however, a bounced bleed has already opened its own pending and never used _obs, so clearing it is harmless and simpler than a guard that was wrong on null-card actions anyway.
    if(!this.pending) return;
    if(this.pending.passTimer) clearTimeout(this.pending.passTimer);
    this.o.log('pending cleared (' + reason + ')');
    this.pending = null;
  }

  /* ---------- §12 line parsing (the `log` relay; sender never echoes) ----- */
  _onLog(who, html){
    if(this.out || !this.started) return;
    const t = stripTags(html).trim();
    let m;
    /* v0.6.110 (R2, #11, Johan's decision A): the SHORT-TERM ACTION MEMORY.
       Any action-shaped line from another seated player replaces what I
       remember; the memory lives until the actor's "It resolves" or until the
       next action overwrites it. It opens no window and decides nothing -- it
       exists so that a later "Any blocks?" knows WHICH action the table means. */
    if(who !== this.o.name && (m = t.match(L12.actObs))){
      const oseat = this._seatOfName(who);
      if(oseat && oseat !== this.seat){
        this._obs = { who, seat: oseat, vamp: m[1], verb: m[2], card: m[4] || null, line: t, at: Date.now(), poolLoss: null };
        if(this._blockBar){ if(this._blockBar.who === who && this._blockBar.fresh) this._blockBar.fresh = false; else if(this._blockBar.who !== who) this._blockBar = null; }   // v0.6.127: the bar belongs to the announce that follows it; another Methuselah's action ends it
        /* v0.6.118: the per-minion ledger the forecast reads -- flush the previous action's stealth first */
        if(this._oppLastAct && this._oppLastAct.a > 0) this._opp(this._oppLastAct.seat).stealthUsed.push(this._oppLastAct.a);
        const rec = this._minionRec(oseat, m[1]); rec.actions++;
        const cls = this._actionClass(m[2], m[4] || null); rec[cls]++;   // v0.6.118d: offensive / economy / utility
        if(m[3]){ const n = parseInt(m[3], 10) | 0; rec.bleeds++; rec.bleedSum += n; if(n > (rec.hitMax | 0)) rec.hitMax = n; }   // v0.6.136: the biggest ANNOUNCED bleed; _noteHit raises it to the biggest REALISED one (modifiers land after the announce)
        if(/calls a political action/.test(m[2])) this._opp(oseat).votesCalled++;
        this._oppLastAct = { seat: oseat, vamp: m[1], a: 0, at: Date.now(), offensive: cls === 'offensive' };
      }
    }
    if((m = t.match(L12.bleed))){
      const vampName = m[1], amount = parseInt(m[2], 10), target = m[3] || null;
      const poolT = target && poolTargetName(target);
      /* steg 2 (15 July): if THIS is MY OWN acting vampire being re-announced with
         a Target: suffix, my own action was just bounced -- update the tracked
         target so the eventual "It resolves"/late-block bookkeeping (and the
         _onSay pass-detection below) reference the CURRENT target, not the stale
         original prey. Independent of `mine` just below (that's about being the
         TARGET of a bleed; this is about being its SOURCE). */
      if(this._actingVamp && poolT && vampName === this._actingVamp.v.name){
        const seat = ((this.players || []).find(q => q.name === poolT) || {}).seat;
        if(seat) this._actingVamp.target = seat;
        this._actingVamp.bounced = true;   // v0.6.144 (Johan): a bot very rarely pumps a bleed AFTER it was bounced (only a strong meta reason -- table talk a bot does not have)
        this._actingVamp.reactionsSeen = true;   // fas C: a bounce IS a reaction card played -- Perfectionist's clean-action test fails
      }
      const mine = poolT ? (poolT === this.o.name)
                         : (!target && who === this.predName());     // spec §5 arming rule
      if(mine){
        if(this.pending && this.pending.who === who) this.o.log('pending superseded (re-announce)');
        /* v1.4.3: when a TARGET: suffix is present, this is potentially a BOUNCED
           re-announce — `who` (the message sender) may be the BOUNCER, not the acting
           minion's owner. The real owner is whoever CONTROLS the named vampire (m[1]).
           We look it up in published boards (same data _inPlayNorms already reads);
           if not found (a human's freeform text, or a vampire name not visible on any
           board), fall back to `who` (correct for the common direct-bleed case). */
        let owner = who;
        if(poolT){
          for(const [seatKey, t2] of Object.entries(this.table)){
            const cards = (t2.pub && t2.pub.cards) || [];
            if(cards.some(c => c.name === vampName && c.kind === 'crypt' && !c.faceDown)){
              const seatNum = parseInt(seatKey, 10);
              if(!isNaN(seatNum)) owner = this.seatName(seatNum);
              break;
            }
          }
        }
        this._armPending(who, amount, vampName, owner);
      } else if(this.pending && poolT){
        /* v1.4.3: was `pending.who === who` — but after the owner-vs-sender fix,
           pending.who is the REAL owner (e.g. 'Johan'), while `who` at this point
           might be the bouncer ('BotB'). Match on the acting VAMPIRE name instead
           (the real anchor: it's the same minion acting regardless of how many
           redirections happen) — if we know it and it matches, this IS our pending
           being retargeted away from us.  Fall back to the old pending.who check
           for cases where we never captured the vampire name.                    */
        const matchesPending = (this.pending.actingVampName && this.pending.actingVampName === vampName) ||
                               this.pending.who === who;
        if(matchesPending) this._clearPending('re-targeted to ' + poolT);
      }
      return;
    }
    if((m = t.match(L12.add))){
      /* v1.4.3: same fix as above — `who` (message sender) may be a bouncer, not the
         original owner; match on pending.who (the real owner) OR on the acting vampire
         name (m[1] in L12.add).  The vampire name is the most stable anchor.           */
      if(this.pending && (this.pending.who === who || (this.pending.actingVampName && this.pending.actingVampName === m[1]))){
        this.pending.amount = parseInt(m[3], 10);                    // T, the running total
        this.pending.contested = false;
        this._reactWindow();                                         // every +X REOPENS the window
      }
      return;
    }
    if((m = t.match(L12.block))){
      const success = m[3] === 'succeeds';
      if(!this._ask && this._oppLastAct && Date.now() - this._oppLastAct.at < 120000){   // v0.6.118: their action met a verdict -- the hit rate the forecast reads
        const la = this._oppLastAct; if(success && la.offensive) this._minionRec(la.seat, la.vamp).blocked++;   // v0.6.118d: only an OFFENSIVE action's block counts against the hit rate
        if(la.a > 0) this._opp(la.seat).stealthUsed.push(la.a);
        this._oppLastAct = null;
      }
      if(this._ask){                                                 // as ACTOR: the referendum answers my Block? itself
        if(success) return this._answer('block', who || 'the table');
        this._ask.contested = false;                                 // failed block: contest settled, window continues
        this._restartAskTimer();
        return;
      }
      if(this.pending){
        const blockerVamp = this.pending.blockerVamp;                 // read before _clearPending wipes this.pending
        const oppName = this.pending.actingVampName || null;          // VB: the combat opponent's name, hoisted the same way (this.pending is null by the _resolveCombat call)
        if(success){
          this._clearPending('block succeeded');
          if(blockerVamp){
            blockerVamp.locked = true;                                // v0.4.3 (rulebook): "If a block attempt is successful, then the blocking minion LOCKS and enters combat" -- the wake path arrives here already locked, idempotent either way
            this._resolveCombat(blockerVamp, oppName).then(() => { this._reactManeuverGrant = false; return this._maybePostBlockUnlock(blockerVamp); }).catch(e => this.o.log('resolveCombat error:', e.message));   // M2: my successful block becomes combat, blocker's side; N1: the .then chain clears the Guard Dogs maneuver-grant deterministically and runs the Cats' Guidance post-block refresh
          }
        }
        else { this.pending.contested = false; if(!(this.pending.role === 'predator' && this.pending.waitingFor)) this._reactWindow(); } // action continues, bleed still live -- M2: try again (another card, or give up -> Pass). v0.6.107: a PREDATOR-role window stays shut until the prey has declined (rulebook order)
      }
      return;
    }
    if((m = t.match(L12.cancel))){
      /* fas C (16 July): my block attempt was CANCELLED (Elder Impersonation-class).
         m[3] names ME (the blocking player). The failed minion is already in
         pending.attempted (registered at attempt time, fas A+), so this is exactly
         the fails-branch: contest over, window reopens for a DIFFERENT minion. */
      if(m[3] === this.seatName(this.seat) && this.pending){
        this.pending.contested = false;
        this._reactWindow();
      }
      return;
    }
    if((m = t.match(L12.poolDmg))){
      /* fas B (16 July): Inside Dirt-class directed pool damage. The line names its
         target explicitly (m[4]) -- arm only when that is ME. kind:'pool' rides the
         pending: no bounce window (unbouncable), no Edge transfer on resolve. The
         block path (Block! -> verdict -> combat) is the bleed machinery, shared. */
      if(m[4] === this.seatName(this.seat) && !this.out){
        this._armPending(who, parseInt(m[3], 10), m[1], null, 'pool');
      }
      return;
    }
    if((m = t.match(L12.peekI)) || (m = t.match(L12.peekS))){
      /* R3: Revelations announced (bot grammar). m[2] names the prey -- arm only when
         that is ME. kind:'peek': NOT a bleed (no bounce window, no Edge, amount 0);
         the shared block machinery handles Block!/verdict/combat as usual. */
      if(m[2] === this.seatName(this.seat) && !this.out){
        this._armPending(who, 0, m[1], null, 'peek');
        if(this.pending){ this.pending.peekSup = t.indexOf('[AUS]') >= 0; this.pending.actorName = who; }
      }
      return;
    }
    if((m = t.match(/^(.+?) plays Revelations \[(aus|AUS)\]\.(?: Target: (.+?)'s pool\.)?$/))){
      /* R3: the HUMAN client's R1 play-log grammar. [aus] carries the Target suffix
         (arm when it names me); [AUS] is undirected -- comply iff the ACTOR is my
         predator (their prey is me). The human-backup constant running the other
         way: a human actor gets full bot compliance with zero extra machinery. */
      const supH = m[2] === 'AUS';
      const mine = supH ? (this._seatOfName(who) === this.predSeat()) : (m[3] === this.seatName(this.seat));
      if(mine && !this.out){
        this._armPending(who, 0, m[1], null, 'peek');
        if(this.pending){ this.pending.peekSup = supH; this.pending.actorName = who; }
      }
      return;
    }
    if((m = t.match(L12.pentexM))){
      /* M2: Pentex resolved onto one of MY vampires -- standing cannot-block. */
      if(m[2] === this.seatName(this.seat) && !this.out){
        this._pentexVamp = m[3];
        this._pentexWatch = { seat: this._seatOfName(m[1]) || this.predSeat(), seen: false };
        this.note('Trainbot: ' + m[3] + ' cannot block (Pentex).');
        this._emit('pentexed', { vamp: m[3] });
      }
      return;
    }
    if((m = t.match(L12.lockM))){
      /* M1: Misdirection resolved against one of MY vampires -- comply by locking it. */
      if(m[2] === this.seatName(this.seat) && !this.out){
        const vc = this.board.find(c => c && c.kind === 'crypt' && c.zone === 'ready' && c.name === m[3]);
        if(vc && !vc.locked){ vc.locked = true; this.push(); this.note('Trainbot: ' + vc.name + ' locks (' + ((t.match(/ plays (.+?) \u2014 locks /) || [])[1] || 'Misdirection') + ').'); this._emit('locked-by-misdirection', { vamp: vc.name }); }
      }
      return;
    }
    if((m = t.match(L12.rush))){
      /* N2: Deep Song [ANI] rushed one of MY vampires -- comply by locking it and
         entering the defender-side combat handshake (the block-combat two-driver
         model; no post-block refresh -- the target never blocked). */
      if(m[2] === this.seatName(this.seat) && !this.out){
        const vc = this.board.find(c => c && c.kind === 'crypt' && c.zone === 'ready' && c.name === m[3]);
        if(vc && this._rushWindowOpens(who, m[1], vc)) return;   // v0.6.107 (B1): the rushed owner may BLOCK first (any unlocked minion, rulebook) -- comply happens on my own Pass
        if(vc){
          vc.locked = true; this.push();
          this.note('Trainbot: ' + vc.name + ' locks and defends (Deep Song rush).');
          this._emit('rushed', { vamp: vc.name, by: m[1] });
          this._clearCombatStashes(); this._combatArmed = true;   // v0.6.103 (#1): a fresh handshake against the named rusher
          this._resolveCombat(vc, m[1]).catch(e => this.o.log('rush defend error:', e.message));   // VB: the rush ACTOR is the combat opponent -- Blythe's vsClan mod sees the right clan
        }
      }
      return;
    }
    if((m = t.match(L12.fameM))){
      /* N3: Fame landed somewhere -- EVERY observer records it (the rush-theory
         Fame-synergy bonus reads _famedSeen); the named OWNER additionally arms
         the torpor hook + the own-unlock drain via _famedMine. */
      this._famedSeen = this._famedSeen || {};
      this._famedSeen[m[3]] = { owner: m[2], by: m[1] };
      if(m[2] === this.seatName(this.seat) && !this.out){
        this._famedMine = this._famedMine || new Set();
        this._famedMine.add(m[3]);
        this.note('Trainbot: ' + m[3] + ' is famed \u2014 torpor now costs me.');
      }
      return;
    }
    if((m = t.match(L12.rescueE))){   // v2 (#7): the OWNER side -- move my named vampire torpor->ready and pay my forced share (the acting controller chose the split; rulebook 6.5.3)
      if(m[2] === (this.o && this.o.name) || m[2] === this.name || m[2] === this.seatName(this.seat)){   // v0.6.72-fix: this.name lands at welcome -- o.name is constructor-truth (the creep comply uses seatName for the same reason)
        const vc = this.board.find(c => c && c.kind === 'crypt' && c.zone === 'torpor' && c.name === m[3]);
        if(vc){
          vc.blood = Math.max(0, (vc.blood | 0) - (+m[5] || 0));
          vc.zone = 'ready';
          const rp = this._openSlot('ready', vc); vc.x = rp.x; vc.y = rp.y;   // neither locks nor unlocks -- lock state carries over
          this._emit('recover', { vamp: vc.name, via: 'enemyRescue', paid: +m[5] || 0 });   // A2b
          this.push();
          this.note('Trainbot: ' + m[3] + ' is rescued (pays ' + m[5] + ') \u2014 ready again.');
        }
      }
      return;
    }
    if((m = t.match(L12.creep))){
      /* N3: Creeping Sabotage ticked -- the NAMED prey complies. */
      if(m[2] === this.seatName(this.seat) && !this.out){
        const nC = Math.max(0, parseInt(m[3], 10) || 0);
        if(nC > 0){ this.pool = Math.max(0, this.pool - nC); this._predPressure = (this._predPressure | 0) + nC; this.push(); this.note('Trainbot: Creeping Sabotage \u2014 I burn ' + nC + ' pool.'); }   // v0.6.58: creep loss IS predator pressure -- 'your prey burns' makes the actor MY predator by definition (Jack/Fame payments stay excluded: cross/self, not predator-attributable)
      }
      return;
    }
    if((m = t.match(L12.blockBar))){ if(who !== this.o.name && this._seatOfName(who)){ this._blockBar = { who, card: m[1], bar: m[2], fresh: true }; this.o.log('block bar from ' + who + ': ' + m[1] + ' \u2014 ' + m[2] + ' cannot block the action that follows'); } return; }   // v0.6.127: arrives BEFORE the announce
    if(this._parseUndirected(who, t)) return;   // v0.6.107 (B1): the undirected family -- arms a window for the actor's prey/predator
    if((m = t.match(L12.combatEnds))){ if(who !== this.o.name && this._inCombat) this._oppEndedCombat = true; return; }   // v0.6.123
    if((m = t.match(L12.refTerms))){ this._onRefTerms(who, m[1], m[2]); return; }          // v0.6.122: a bot caller's terms (arrive BEFORE its announce)
    if((m = t.match(L12.refResult))){ this._onRefResult(who, m[1] === 'passes', m[2], m[3]); return; }
    if((m = t.match(L12.vote))){ const rc = this._refCall; if(rc && !rc.closed && who !== this.o.name){ rc.line = { a: parseInt(m[1], 10) | 0, b: parseInt(m[2], 10) | 0 }; rc.done('the tally was resolved by ' + who); } return; }   // v0.6.122: a human pressed Resolve on the vote counter -- I announce the outcome at once
    if((m = t.match(L12.political))){
      if(this._refT && this._refT.who !== who) this._refT = null;   // v0.6.124: another Methuselah's political action -- the terms on record are not its terms
      if(who !== this.o.name) this._refActor = { who, vamp: m[1] };   // v0.6.127: WHO calls it -- the crypt layer reads the acting vampire's text (Silverson-class vote tax)
      if(who !== this.o.name && this._refWindow(who, m[1])) return;   // v0.6.122: a bot-called referendum with terms -- the stake is known, the pool question is never asked, prey and predator only
      /* v0.6.111 (R3, #10): a political action IS an action -- the block step runs.
         The R2 memory is already set above (actObs matched the same line); all R3
         adds is that it opens the pool question WITHOUT waiting to be prompted,
         because a table heading into a referendum rarely pauses to say "Any
         blocks?". Everything after that is R2's ladder, untouched. */
      if(this.o.politicsAsk !== false && who !== this.o.name){
        const ps = this._seatOfName(who);
        if(ps && ps !== this.seat) this._onAnyBlocks(who, 'Any blocks?');
      }
      return;
    }
    if((m = t.match(L12.votes))){
      const vn = parseInt(m[2], 10) | 0, dir = m[3];
      { const rc = this._refCall; if(rc && !rc.closed && who !== this.o.name){ rc[dir] += vn; rc.by[who] = (rc.by[who] | 0) + vn; const sp = (this.players || []).find(q => q && q.name === who); if(sp && sp.bot) rc.heard.add(who); rc.paused.delete(who); rc.arm(); } }   // v0.6.122: the caller counts the frozen LINES -- bots' absolute tally writes race each other, log lines do not
      this._refVotes = this._refVotes || { for: 0, against: 0, by: {} };
      this._refVotes[dir] += vn; this._refVotes.by[who] = (this._refVotes.by[who] | 0) + vn;
      this.o.log('referendum: ' + who + ' casts ' + vn + ' ' + dir + ' (for ' + this._refVotes.for + ' / against ' + this._refVotes.against + ')');
      return;
    }
    if((m = t.match(L12.attempt)) || (m = t.match(L12.interceptPlay)) || (m = t.match(L12.blockAct))){   // v0.6.106 (#14): another seat's block attempt -- the blocker's vampire name (latest attempt wins) + the table climate counter; v0.6.110 (R2, #12): + the client's `NAME blocks.`
      { const st = this._seatOfName(who); if(st && st !== this.seat){ const oo = this._opp(st); const ip = t.match(L12.interceptPlay); if(ip) oo.icpSum = (oo.icpSum | 0) + (parseInt(ip[3], 10) | 0); else oo.blockTries = (oo.blockTries | 0) + 1; } }   // v0.6.129: oppIntercept's writers -- an attempt line counts the try, an intercept line adds to it
      this._noteBlockAttempt(m[1], false);
      /* v0.6.110 (R2, #12, Johan): "if the player runs the Block action BEFORE the
         Block! phrase, treat it as the block and do not wait for the phrase." The
         line already names the minion, so it IS the attempt: run the same handler
         the phrase would have, and mark the ask so a Block! that follows from the
         same seat is recognised as the shout for THIS attempt, not a second one. */
      { const a1 = this._ask, av1 = this._actingVamp;   // v0.6.147 (THE HOTSEAT NET): the blocker's attempt LINE is sent in the same tick as its tally write, so 'line seen, no foreign tally 500 ms later' = this relay drops tally
        if(a1 && a1.contested && av1 && who !== this.o.name && ((this.players || []).find(p => p.name === who) || {}).bot){
          const ipm = t.match(L12.interceptPlay), n1 = ipm ? (parseInt(ipm[3], 10) | 0) : 0, at1 = Date.now();
          const tm1 = setTimeout(() => { try { this._tallyNetActor(who, n1, av1, a1, at1, m[1]); } catch(e){ this.o.log('tally net error:', e.message); } }, 500); if(tm1.unref) tm1.unref(); } }
      const a = this._ask;
      if(a && !a.contested && this._seatOfName(who) && who !== this.o.name){
        if(a._whoT){ clearTimeout(a._whoT); a._whoT = null; }
        if(a._sayBlockFrom === who) return;                       // the shout came first; this line only names the minion
        a._lineBlockFrom = who; a._lineBlockAt = Date.now();
        this._onBlockAttempt(who);
      }
      return;
    }
    if((m = t.match(NET_STEALTH)) && who !== this.o.name){   // v0.6.147 (THE HOTSEAT NET): the ACTOR's stealth line, heard by the blocker -- same rule, mirrored
      const p1 = this.pending;
      if(p1 && p1.contested && p1.blockerVamp && !this.out){ const n1 = parseInt(m[2], 10) | 0, at1 = Date.now();
        const tm1 = setTimeout(() => { try { this._tallyNetBlocker(n1, p1, at1); } catch(e){ this.o.log('tally net error:', e.message); } }, 500); if(tm1.unref) tm1.unref(); }
    }
    if((m = t.match(NET_UNLOCK_IC)) && who !== this.o.name){   // `X attempts to block with +N intercept (CARD).` -- the unlock-reaction attempt (Second Tradition); no L12 entry reads it
      const a1 = this._ask, av1 = this._actingVamp;
      if(a1 && a1.contested && av1){ const n1 = parseInt(m[2], 10) | 0, at1 = Date.now(), mn1 = m[1];
        const tm1 = setTimeout(() => { try { this._tallyNetActor(who, n1, av1, a1, at1, mn1); } catch(e){ this.o.log('tally net error:', e.message); } }, 500); if(tm1.unref) tm1.unref(); }
    }
    if((m = t.match(L12.strikeD)) || (m = t.match(L12.strikeC)) || (m = t.match(L12.strikeH))){
      /* v0.6.4 (combat handshake): the server never echoes a sender's own log
         lines back (proven in section 36's diagnostics), so EVERY strike line
         we receive is the OPPONENT's -- no name filtering needed. Stash the
         parsed strike; wake a waiting _resolveCombatRound if one is mid-round. */
      const dodge = !!t.match(L12.strikeD);
      const cm = t.match(L12.strikeC);
      if(!this._stashAccept(m[1])) return;   // v0.6.103 (#1): not my opponent (or I am not in/armed for a combat) -- a bystander's view of somebody else's fight
      this._oppStrike = { vamp: m[1], dodge, dealt: dodge ? 0 : (cm ? parseInt(cm[3], 10) : 1) };
      if(this._strikeWaiter){ const w = this._strikeWaiter; this._strikeWaiter = null; const s = this._oppStrike; this._oppStrike = null; w(s); }
      return;
    }
  }

  /* ---------- the say channel (SAY broadcast; string-checked) ------------- */
  say(phrase){ const i = sayIdx(phrase); if(i >= 0){ this.send({ t: 'say', i }); this._lastChatAt = Date.now(); } }   // v0.6.108: say creates a timing footprint — the client's say-bubble is 3 s, so _pace's chatHold must gate on it the same way it gates on chat()
  _seatOfName(name){ const p=(this.players||[]).find(q=>q && q.name===name); return p ? (p.seat|0) : 0; }   // R3: roster lookup, 0 when unknown
  _emit(type, data){ if((type === 'through' || type === 'blocked') && data && data.card !== 'hunt' && (data.kind == null || data.kind === 'bleed') && (data.n | 0) > 0) this._noteMyBleed(type === 'blocked');   // v0.6.143b: my bleed-through ledger against this prey
    if(type === 'blocked') this._returnParked(); else if(type === 'through' && this._actingVamp) this._actingVamp.parked = null;   // v0.6.130 (rulebook + Johan, debt 26c): an action's cost is paid only if it SUCCEEDS
    if(type === 'through' || type === 'blocked'){ this._lastAct = { vamp: data && data.vamp, outcome: type, kind: (data && data.kind) || null }; try{ this._offNote(type, data); }catch(e){} }   // v0.6.123: the act-again hook reads the SAME two emits the strategy layer's ledger rides   // v0.6.119: the strategy layer's own offensive ledger rides the two emits that already mark every resolved action
    if(this.onEvent) try{ this.onEvent('bot:' + type, data || {}); }catch(e){} }
  _flushDraws(){                     // v0.5: extracted so master-play and hunt (which `continue`s past the old inline drain) can never silently DEFER a draw-owed -- every code path that increments _drawOwed now has a nearby place to flush it instead of relying on some LATER vampire's bleed branch happening to reach it
    while((this._drawOwed || 0) > 0){ this._drawOwed--;
      if((this._replaceExempt | 0) > 0){ this._replaceExempt--; this.send({ t: 'draw' }); continue; }   // v0.6.125: "replace a card OTHER THAN this card" -- the Capuchin's own replacement is an ordinary draw
      const cap = this._replaceCounterCard();
      if(cap){ cap.counters = (cap.counters | 0) - 1; this._handSizePermanentPrev = this._handSizePermanentTotal();   // v0.6.125: a replacement burns a counter INSTEAD of drawing (hand size fell by the same 1, so the hand is still full)
        this._emit('replace-counter', { card: cap.name, left: cap.counters });
        if(cap.counters <= 0){ cap.zone = 'burned'; this.send({ t: 'log', html: '<b>' + esc(cap.name) + '</b> has no counters left \u2014 burned.' }); }
        this.push(); continue; }
      this.send({ t: 'draw' }); }
  }
  _replaceCounterCard(){             // v0.6.125: an in-play card whose counters stand in for my replacements (fx.replaceBurnsCounter)
    return (this.board || []).find(c => { if(!c || c.kind !== 'lib' || this._outOfPlay(c) || !((c.counters | 0) > 0)) return false;
      const h = this.fxLookup(c.name); return !!(h && h.kind === 'lib' && (h.e.modes || []).some(mo => mo.fx && mo.fx.replaceBurnsCounter)); }) || null;
  }
  _toAsh(name){                      // v0.3.8: the PUBLIC ash heap — discards and resolved action cards are open information (the host's "View their ash heap" shows them)
    this.board.push({ id: 'a' + (this._ashSeq = (this._ashSeq || 0) + 1), name, kind: 'lib',
                      zone: 'ash', faceDown: false, x: 40, y: 40 + ((this._ashSeq % 12) * 4), locked: false });
    this._syncOpenHand();            // R3: every public hand-exit re-syncs an active open-hand grant
  }
  fxClone(card, verb, opts){              // a presentational clone for the humans (v0.3.7, Johan: bleeds should ANIMATE). v0.4.5: optional opts.kind ('rise' for a vampire brought into play -- the client's OWN uncontrolled/torpor->ready move() already fires the identical cardFx(c,'rise',{reveal}), and the protocol/server already relay 'rise'; the bot just never sent it) + opts.reveal (the rise flip). Omitted opts = byte-identical to the old 2-arg call (kind:'play', reveal:undefined).
    opts = opts || {};
    const actor = (opts.kind || 'play') === 'play' && opts.actor && opts.actor.name ? { name: String(opts.actor.name), kind: 'crypt', faceDown: false } : null;   // v0.6.114 (Johan): the MINION that plays the card -- the client renders [vampire] -> [card] and captions "X plays Y" (fxCardInfo shape). Masters/events pass no actor: the Methuselah plays those.
    this.send({ t: 'fx', kind: opts.kind || 'play', card: { name: card.name, kind: card.kind || 'lib', faceDown: false },
                target: null, actor, onto: null, verb: String(verb || '').slice(0, 40), reveal: opts.reveal, toName: '' });
  }
  /* ---------- v0.6.95: the general table HOLD (Johan's Hold on\u2026 pause) ----
     Humans only (roster bot flag; unknown senders count as human, fail-safe).
     Engage: SAY[0] or an anchored chat 'hold on'. Release: the sayer's next
     flow phrase (say 1/2/3/4/7) or chat 'carry on'/'resume'/'it resolves'.
     The gate lives in _pace(); acks are chat lines; reminder on MY turn.   */
  _noteBlockAttempt(vamp, own){      // v0.6.106 (#14): one site for both readers -- others' attempts arrive as frozen log lines, my own are noted at _commitBlock. The name is what the actor's handshake filter keys on (_expectedOppVamp); the counter is v0.6.93's table block climate (READ = BASE; consumers are documented, not built)
    if(!own && vamp){ this._lastBlockerName = vamp; this._lastBlockerAt = Date.now(); }   // v0.6.110 (R2, #12): the stamp is what the Who-blocks grace compares against
    this._tableBlockAttempts = (this._tableBlockAttempts | 0) + 1;
  }
  _holdHook(who, i, txt){
    const p = (this.players || []).find(q => q && q.name === who);
    if(p && p.bot) return;                                     // bots never operate the hold
    const hold = txt != null ? /^hold on\b/i.test(txt) : i === 0;
    const rel  = txt != null ? /^(carry on|resume|it resolves)\b/i.test(txt)
                             : (i === 1 || i === 2 || i === 3 || i === 4 || i === 7);
    /* v0.6.108 (THE UNIFIED HOLD RULE — client handoff items 1/3/4, 12 Sep):
       this hook is TRACKING ONLY. The acknowledgement and the reminder moved
       into _pace's wait gate (_holdGate), where the bot that is ACTUALLY
       blocked announces. That removes the v0.6.107 relevance heuristic
       (turnSeat/_ask), which silently dropped the announcement — and the
       reminder with it — whenever a hold landed while no bot was acting, and
       never re-armed when the turn later became a bot's own. Announcing at
       the gate gives exact anti-flood for free: only a blocked bot speaks. */
    if(hold){
      this._holdBy = this._holdBy || new Set();
      this._holdBy.add(who);
    } else if(rel && this._holdBy && this._holdBy.size){
      /* a release from ANY non-bot clears the WHOLE set. Holds are keyed by
         name, so at a hotseat (one device, several humans) Alice's hold could
         otherwise never be released by Bob — measured client-side, which had
         to relay "It resolves" once per holder name to work around it. The
         phrase is a table-flow assertion: whoever says it is stating that the
         table has moved on, so it releases the table, not just their own row. */
      this._holdBy.clear();
      if(this._holdRemT){ clearTimeout(this._holdRemT); this._holdRemT = null; }
      if(this._holdAnnounced){ this._holdAnnounced = false; this.chat('\u25b6 Resuming.'); }   // only the bot that announced the hold announces the release
    }
  }
  /* v0.6.108: the wait gate — the single place a hold actually costs time.
     The first bot to arrive here while a hold is live announces it and arms
     the reminder; every other bot waits silently. Replaces the three
     half-rules the hold used to be spread across. */
  async _holdGate(){
    if(!(this._holdBy && this._holdBy.size)) return;
    if(!this._holdAnnounced){
      this._holdAnnounced = true;
      this.chat('\u23f8 Holding for ' + [...this._holdBy].join(', ') + ' \u2014 say "It resolves" when ready.');
      this._holdRemind();
    }
    while(this._holdBy && this._holdBy.size) await sleep(150);
  }
  _releaseDeparted(players){         // v0.6.106 (#5): anyone offline, vacant or out can no longer say 'It resolves' -- drop their Hold on and their ask pause
    const gone = new Set(players.filter(p => p && (p.out || p.vacant || p.online === false)).map(p => p.name));
    if(!gone.size) return;
    if(this._holdBy && this._holdBy.size){
      let rel = false; for(const n of [...this._holdBy]) if(gone.has(n)){ this._holdBy.delete(n); rel = true; }
      if(rel && !this._holdBy.size){ if(this._holdRemT){ clearTimeout(this._holdRemT); this._holdRemT = null; } this.chat('\u25b6 Resuming (the holder left the table).'); }
    }
    if(this._ask && this._ask.pausedBy && this._ask.pausedBy.size){
      let rel2 = false; for(const n of [...this._ask.pausedBy]) if(gone.has(n)){ this._ask.pausedBy.delete(n); rel2 = true; }
      if(rel2 && !this._ask.pausedBy.size && !this._ask.timer) this._restartAskTimer();
    }
  }
  _holdRemind(){
    if(this._holdRemT) clearTimeout(this._holdRemT);
    this._holdRemT = setTimeout(() => {
      this._holdRemT = null;
      if(!this._holdBy || !this._holdBy.size){ this._holdAnnounced = false; return; }
      if(this._holdAnnounced && !this.out)                     // v0.6.108: keyed on WHO ANNOUNCED, not on whose turn it is — a blocked bot is not necessarily the bot on turn
        this.chat('\u23f8 Still holding for ' + [...this._holdBy].join(', ') + '.');
      this._holdRemind();
    }, 90000);
  }

  _onSay(m){
    if(!this.started) return;
    const phrase = SAY[m.i]; if(!phrase) return;                     // unknown index: tolerate (reorder safety)
    if(m.who === this.o.name) return;                                // my own broadcast echoes back
    this._holdHook(m.who, m.i, null);                                // v0.6.95: the general table hold -- runs for EVERY say, never returns early (the ask-window protocol below stays byte-untouched)
    if(phrase === 'It resolves' && this._refActor && this._refActor.who === m.who) this._refActor = null;   // v0.6.127
    if(phrase === 'It resolves' && this._blockBar && this._blockBar.who === m.who) this._blockBar = null;   // v0.6.127: the bar dies with its action
    if(phrase === 'It resolves' && this._refT && this._refT.who === m.who) this._refT = null;   // v0.6.124: the caller's action is over -- so are its terms (the result line normally got here first)
    if(this._refCall && !this._refCall.closed && !this._ask){         // v0.6.122: MY referendum is polling -- Johan (18 Sep): Hold on buys thinking time, 'It resolves' from anyone ends the wait and I announce the outcome at once; Pass = no votes
      const rc = this._refCall, sp = (this.players || []).find(q => q && q.name === m.who);
      if(phrase === 'It resolves'){ rc.paused.delete(m.who); rc.done('resolved by ' + m.who); return; }
      if(phrase === 'Hold on\u2026'){ if(!(sp && sp.bot)){ rc.paused.add(m.who); if(rc.timer){ clearTimeout(rc.timer); rc.timer = null; } } return; }
      if(phrase === 'Pass' || phrase === 'No'){ rc.paused.delete(m.who); rc.heard.add(m.who); rc.arm(); return; }
    }
    /* as ACTOR: my Block? window listens to the table's phrases */
    if(this._ask){
      const a = this._ask;
      if(phrase === 'Hold on\u2026'){                               // someone is thinking — pause my timeout
        /* v0.6.108 (client handoff item 1, MEASURED deadlock): bots never
           operate the hold — the same doctrine _holdHook already applies,
           which this branch was missing. Without it one bot parks another
           bot's undirected ask with no timer and nothing that ever releases
           it (soak deadlocked in round 3: pausedBy ['Bot2'], timer false,
           passed [] — permanent). The filter must cover the promotion below
           too, or a bot also inflates the eligible set and the window then
           waits on a Pass that never comes. The ask ANSWERS (Block!/Pass)
           below stay open to bots — that is the whole bot-vs-bot model. */
        const hp = (this.players || []).find(q => q && q.name === m.who);
        if(hp && hp.bot) return;
        a.pausedBy.add(m.who); if(a.timer){ clearTimeout(a.timer); a.timer = null; a.deadline = null; }   // v0.6.109 (#1): the deadline dies WITH the timer. Without this, status() kept reporting the stamp from before the pause -- the widget would count a paused window down past zero and sit there, which is precisely the "waitingFor must be honest" failure the seam exists to prevent. A paused ask has no deadline, exactly like a hold, and says so.
        /* v0.6.108 (soft promotion): an intermediate player (not in the
           hard eligible set) who says "Hold on…" during an undirected ask
           promotes themselves into the eligible set — they've signalled
           they want to react (Eagle's Sight, Instinct, etc.). The window
           now waits for their Pass too. Without this, they'd pause the
           timer but their eventual Pass wouldn't count toward closing. */
        if(a.undirected && !a.eligible.has(m.who)) a.eligible.add(m.who);
        return;
      }
      if(phrase === 'Block!'){
        /* v0.6.110 (R2, #12, Johan): the Who-blocks grace. A shouted Block! that
           no `NAME blocks.` / `NAME attempts to block.` line follows within
           o.whoBlocksGraceMs gets ONE "Who blocks?" from me -- long enough for the
           human to right-click the minion, short enough that a forgotten block
           never stalls the table. If the line came first (above), the shout is
           the same attempt and the handler must not run twice. */
        if(a._lineBlockFrom === m.who){ if(a._whoT){ clearTimeout(a._whoT); a._whoT = null; } return; }
        a._sayBlockFrom = m.who; a._sayBlockAt = Date.now();
        if(a._whoT) clearTimeout(a._whoT);
        const hp2 = (this.players || []).find(q => q && q.name === m.who);
        if(!(hp2 && hp2.bot)){                                       // a bot blocker always emits its frozen line first; only a human can forget
          const askRef = a;
          a._whoT = setTimeout(() => {
            askRef._whoT = null;
            if(this._ask !== askRef || this.out) return;
            if((this._lastBlockerAt || 0) >= askRef._sayBlockAt) return;   // a blocker line landed meanwhile
            this.chat('Trainbot: Who blocks? Right-click the minion and choose Block.');
          }, (this.o.whoBlocksGraceMs != null ? this.o.whoBlocksGraceMs : 2500));
        }
        return this._onBlockAttempt(m.who);
      }
      if(a.reactionsOnly && phrase === 'Yes'){ const hpY = (this.players || []).find(q => q && q.name === m.who); if(!(hpY && hpY.bot)){ a.pausedBy.add(m.who); if(a.timer){ clearTimeout(a.timer); a.timer = null; a.deadline = null; } } return; }   // v0.6.144 (Johan): 'Yes' to 'Any reaction?' on a bleed total = I am reacting, wait for me (the Hold on... semantics)
      if(phrase === 'No block' || phrase === 'No reaction' || phrase === 'Pass' || (a.reactionsOnly && phrase === 'No')){   // v0.6.144: 'No' answers a reactions-only question at once
        this._lastDecline = { who: m.who, phrase, at: Date.now() };   // 'No block' declines the BLOCK only -- the custom is then to hear the bleed total; 'No reaction' / 'Pass' decline everything
        a.pausedBy.delete(m.who);
        /* steg 2 (15 July): was hardcoded to MY OWN prey -- broke down the moment
           a bleed could be bounced mid-action to some OTHER seat (the bouncer's
           own prey, not mine). _actingVamp.target tracks the CURRENT target (see
           _onLog's L12.bleed handler); falls back to preySeat for hunt, which has
           no target/bounce concept at all, preserving the old behaviour there. */
        if(a.undirected){                                              // v0.6.107 (B1): prey AND predator may block; the ask closes when both have declined (or the timer speaks)
          if(a.eligible.has(m.who)){
            a.passed.add(m.who);
            if([...a.eligible].every(n => a.passed.has(n)) && !a.pausedBy.size){
              if(a.contested){ if(!a.timer) this._restartAskTimer(); return; }
              return this._answer('no', m.who);
            }
          }
          if(!a.pausedBy.size && !a.timer) this._restartAskTimer();
          return;
        }
        const curTarget = this.seatName((this._actingVamp && this._actingVamp.target) || this.preySeat());
        if(m.who === curTarget && !a.pausedBy.size){
          if(a.contested){             // fas A+ (16 July): a target's Pass DURING a live contest means "no more cards from me", not "no block happened" -- the referendum already holds a mechanical answer (tally a/b) and the verdict declaration must resolve it, or a winning b>=a block gets swallowed as a through-bleed (the no-candidate decline's Pass raced the verdict timer exactly this way). Make sure the verdict clock is running and let IT decide.
            if(!a.timer) this._restartAskTimer();
            return;
          }
          return this._answer('no', m.who);
        }
        if(!a.pausedBy.size && !a.timer) this._restartAskTimer();    // everyone done thinking — clock resumes fresh
        return;
      }
    }
    /* as TARGET: resolution + contest signals for the pending bleed */
    if(this.pending){
      if(this.pending.role === 'predator' && this.pending.waitingFor === m.who && (phrase === 'No block' || phrase === 'No reaction' || phrase === 'Pass')){   // v0.6.107 (B1): the prey declined -- the predator's window opens now (rulebook: prey first, then predator)
        this.pending.waitingFor = null; this.pending.contested = false; this._reactWindow(); return;
      }
      if(phrase === 'Block!'){ this.pending.contested = true; return; }
      if(phrase === 'It resolves' && m.who === this.pending.who){
        if(this.pending.contested){
          this.chat('A block was announced but never resolved — if the bleed landed anyway, tell me "bleed ' + this.pending.amount + '".');
          this._clearPending('contested, unresolved');
        } else this._applyPending("say 'It resolves'");
        if(this._obs && this._obs.who === m.who) this._obs = null;   // v0.6.110 (R2): the remembered action is over
        return;
      }
    }
    /* v0.6.110 (R2, #11): the table PROMPTS me. No ask of my own, no pending --
       the fall-through that used to be silent. */
    if(phrase === 'It resolves' && this._obs && this._obs.who === m.who){ this._obs = null; return; }   // decision A: resolve clears the memory
    if(this._pq){ if(phrase === 'Yes' || phrase === 'No') return this._pqAnswer(phrase.toLowerCase(), m.who); return; }
    if(phrase === 'Any blocks?' || phrase === 'Any reaction?') return this._onAnyBlocks(m.who, phrase);
  }

  /* ---------- the pool question (v0.6.110, R2, #11) --------------------------
     A human plays an action I cannot classify and prompts "Any blocks?". I have
     no cardfx knowledge to weigh it with, so I ask the table the one thing the
     block decision actually needs -- "Will this action cause me to lose pool?"
     and, on Yes, "How much?" -- and then hand the answer to the SAME machinery
     a bleed would use: a T1 pending with amount = the number. The directed
     scorer weighs it by amount/pool, _reactWindow says Hold on and decides,
     _commitBlock or Pass follows, and _applyPending deducts the pool on the
     actor's "It resolves". Nothing new decides anything.
     Johan's decisions (15 Sep): the answer lives with THIS action only -- gone at
     "It resolves" or when the next action overwrites the memory (A); an
     unanswered question runs on the askSecs clock and defaults to "not
     blocking", because the bot must never freeze the table for its own
     uncertainty (B). Readable AND steppable in status()/step(): the timeout
     body is _pqTimeout, the same rule as _askTimeout. */
  _onAnyBlocks(who, phrase){
    if(!this.started || this.out || this._ask || this.pending || this._pq) return;
    const o = this._obs;
    if(!o || o.seat === this.seat || Date.now() - o.at > 120000) return;   // nothing on record: silence, not a guess
    if(o.poolLoss != null) return this._openAskedWindow();
    this._pq = { who, phrase, stage: 'yn', deadline: 0, timer: null, obs: o };
    this.chat('Trainbot: Will this action cause me to lose pool? (Yes / No)');
    this._pqArm();
  }
  _pqArm(){
    const q = this._pq; if(!q) return;
    if(q.timer) clearTimeout(q.timer);
    const wait = this.o.askSecs * 1000 + this._chatSettleMs();
    q.deadline = Date.now() + wait;
    q.timer = setTimeout(() => this._pqTimeout(), wait);
  }
  _pqTimeout(){
    const q = this._pq; if(!q) return;
    if(q.stage === 'yn') return this._pqAnswer('no', null);        // decision B: silence means I let it through
    return this._pqAnswer('1', null);                               // a Yes with no number is at least 1 pool
  }
  _pqAnswer(ans, who){
    const q = this._pq; if(!q) return;
    if(q.timer){ clearTimeout(q.timer); q.timer = null; }
    if(q.stage === 'yn'){
      if(ans === 'yes'){
        q.stage = 'amt';
        this.chat('Trainbot: How much?');
        this._pqArm();
        return;
      }
      this._pq = null;
      if(q.obs === this._obs) q.obs.poolLoss = 0;
      this.o.log('pool question: ' + (who || 'timeout') + ' says no -- letting it through');
      this.say('No block');
      return;
    }
    const n = Math.max(1, Math.min(99, parseInt(ans, 10) || 1));
    this._pq = null;
    if(q.obs !== this._obs) return;                                   // the memory moved on while we talked: the answer belongs to a dead action
    q.obs.poolLoss = n;
    this.o.log('pool question: ' + (who || 'timeout') + ' says ' + n + ' pool');
    this._openAskedWindow();
  }
  _openAskedWindow(){
    const o = this._obs; if(!o || this.pending || this.out) return;
    if(!(o.poolLoss > 0)){ if(!(/calls a political action/.test(o.verb || '') && this.nextLive(o.seat) !== this.seat && this.prevLive(o.seat) !== this.seat)) this.say('No block'); return; }   // v0.6.126: a seat with no block rights does not announce that it will not block
    const tpub = this.table[o.seat] && this.table[o.seat].pub;
    const actorUnlocked = ((tpub && tpub.cards) || []).filter(c => c && c.kind === 'crypt' && c.zone === 'ready' && !c.locked && c.name !== o.vamp).length;
    /* v0.6.126 (self-review 8): a political action is UNDIRECTED -- only the actor's prey and predator may block it. The
       bot-called path has followed that since v0.6.122; a HUMAN-called one opened this window at every bot seat. A
       cross-table seat still needs the pending (the actor's It resolves deducts the pool through it, and the vote reads
       the stake from _obs) -- it just gets no block step: declined from birth, no react window, nothing said. */
    const political = /calls a political action/.test(o.verb || '');
    const noRights = political && this.nextLive(o.seat) !== this.seat && this.prevLive(o.seat) !== this.seat;
    this.pending = { who: o.who, amount: o.poolLoss, kind: 'asked', sub: 'asked', T: 'T1', role: 'target', actorSeat: o.seat, actorUnlocked,
                     actingVampName: o.vamp, contested: false, reacted: new Set(), blockerVamp: null, declined: noRights, attempted: new Set(), waitingFor: null };
    this.o.log('asked window: ' + o.verb + ' by ' + o.who + ' (' + o.poolLoss + ' pool if it resolves)' + (noRights ? ' -- cross-table: no block rights on an undirected action, the stake stands for the vote' : ''));
    if(noRights) return;
    this._reactWindow();
  }

  async _maybeAttachMarkedPath(v, targetSeat, played){
    /* fas C (16 July): step 1 of the Marked Path two-step. "Only usable after a
       successful directed action" -- called from BOTH through branches (bleed and
       pool damage). Attaches to the acting vampire, recording the action's TARGET
       and the mode-level stealth (1 basic / 2 superior, fixed at attach per the
       card text). v1: always attach when found -- no cost, pure upside, so no
       persona dimension yet (flagged in the note for future tuning). */
    if(!targetSeat) return;
    let best = null;
    this.hand.forEach((n, idx) => {
      const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !h.e.attachAfterSuccess) return;
      if(!this._mayPlay(h.name, h.e, played || null)) return;   // fas C uncertainty-review: the attach happens WITHIN the action ("only usable after a successful directed action" -- an action-modifier window), so the same-name-once-per-action ledger applies: a Marked Path BURNED for stealth this action blocks ATTACHING another this action. Conservative read, consistent with the burn side; the is-a-burn-a-play rules question is flagged in the backlog.
      (h.e.modes || []).forEach(mo => {
        if(!mo.fx || !(mo.fx.stealthLater > 0) || !this._modeUsableBy(mo, v)) return;
        if(!best || mo.fx.stealthLater > best.s) best = { idx, name: h.name, s: mo.fx.stealthLater };
      });
    });
    if(!best) return;
    await this._pace();
    this.hand.splice(best.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
    const card = { id: 'm' + (this._mSeq = (this._mSeq || 0) + 1), name: best.name, kind: 'lib', zone: 'ready',
                   host: v.id, faceDown: false, locked: false, blood: 0, x: v.x, y: v.y,
                   mpTarget: targetSeat, mpStealth: best.s };   // bot-local memory: push's explicit field map never forwards mp* -- the recorded target leaks nothing
    this.board.push(card);
    v.attached = v.attached || []; v.attached.push(card.id);
    this._emit('mp-attach', { vamp: v.name, target: targetSeat, s: best.s });   // fas C: arena-trace visibility (the fas-B lesson: enrich the trace)
    this.fxClone({ name: best.name, kind: 'lib' }, 'is put on ' + v.name, { actor: v });
    this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> puts <b>' + esc(best.name) + '</b> in play (on itself).' });
    this.note('Trainbot: ' + best.name + ' goes on ' + v.name + ' \u2014 burnable later for +' + best.s + ' stealth against the same target.');
    this.push();
  }
  _maybePerfectionist(v){
    /* fas C (16 July): the Perfectionist post-action hook -- "once each turn, this
       vampire can gain 1 blood after performing a successful action during which
       no reaction cards were played". Clean-action test is the conservative v1
       reactionsSeen flag (any Block!/bounce dirties it); blood is capped at
       capacity per the rulebook; once-per-turn per vampire via _perfUsed. */
    const av = this._actingVamp;
    if(av && av.reactionsSeen) return;
    if(this._perfUsed && this._perfUsed.has(v.id)) return;
    let hasArch = false;
    this.board.forEach(c => {
      if(hasArch || c.kind !== 'lib' || c.host !== v.id || this._outOfPlay(c)) return;
      const h = this.fxLookup(c.name);
      if(h && h.kind === 'lib' && (h.e.modes || []).some(mo => mo.fx && mo.fx.bloodAfterCleanAction > 0)) hasArch = true;
    });
    if(!hasArch) return;
    const ck = this.fxLookup(v.name);
    const cap = (ck && ck.kind === 'crypt') ? (ck.e.cap | 0) : 99;
    if((v.blood | 0) >= cap) return;
    (this._perfUsed = this._perfUsed || new Set()).add(v.id);
    v.blood = (v.blood | 0) + 1;
    this._emit('perf-gain', { vamp: v.name, blood: v.blood });
    this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> gains 1 blood (<b>Perfectionist</b>).' });
    this.note('Trainbot: ' + v.name + ' +1 blood (Perfectionist \u2014 clean successful action). Blood: ' + v.blood + '.');
    this.push();
  }

  /* A 'Block!' against the bot's own action: v0.3 may answer with a stealth
     card first (insight-weighted read of the blocker's intercept). The chat
     grammar's 'block' stays a BLUNT channel — it always goes to combat.    */
  _spendStealthCard(st, av, a){        // v0.6.143c: the ONE place a stealth card is spent (the first look at the shout and the second look at the tally both come here)
    a.contested = true;
    if(av.played) av.played.add(FX_NORM(st.name));   // this name is spent for THIS action
    if(st.fromBoard){
      /* fas C: a Marked Path BURN -- the card leaves the board (and its host's
         attached list), not the hand. The stealth then rides the same tally/
         announce path as any hand card. */
      const bi = this.board.findIndex(c => c.id === st.fromBoard);
      if(bi >= 0){
        const hostV = this.board.find(x => x.id === this.board[bi].host);
        if(hostV && hostV.attached) hostV.attached = hostV.attached.filter(id => id !== st.fromBoard);
        this.board.splice(bi, 1);
      }
      this._toAsh(st.name);
    } else {
      this.hand.splice(st.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
      if(st.cost && st.cost.blood) av.v.blood = Math.max(0, (av.v.blood | 0) - st.cost.blood);   // v0.6.116 round 2: the stealth card's blood cost, paid by the acting vampire when played (the intercept side has paid at line ~3532 since v0.6.13; this side never did). Board burns (Marked Path) carry no cost.
      this._toAsh(st.name);   // v0.6.12 ash sweep -- the hand-played stealth branch (the Marked Path BURN branch above already had its own _toAsh)
      this._emitPlay(st.name, 'stealth', av && av.v && av.v.name);   // v0.6.139: this spend left no trace row (CLAUDE.md 43c)
    }
    this.fxClone({ name: st.name, kind: 'lib' }, '+' + st.s + ' stealth', { actor: av.v });
    this._bumpTallyA(st.s);   // fas A (16 July): the spent stealth must reach the shared tally -- the v0.6.3 contested verdict is computed from a/b, and a bot attacker's stealth previously never got there (a=0 -> a wrong "block succeeds" against any stealth)
    this.send({ t: 'log', html: '<b>' + esc(av.v.name) + '</b> ' + (st.fromBoard ? 'burns' : 'plays') + ' ' + esc(st.name) + ': +' + st.s + ' stealth.' });

    this.push();
    this._restartAskTimer();             // the table resolves the contest (§12 Block line / prey pass)
  }
  _interceptStack(vamp, played){     // v0.6.143d: the defender's mirror of _stealthStack -- DIFFERENT playable intercept cards and what they add
    const seen = new Set(); let S = 0, sum = 0;
    (this.hand || []).forEach(n => { const h = this.fxLookup(n); if(!h || h.kind !== 'lib' || !(h.e.t || []).some(t => t === 'react' || t === 'mod') || seen.has(FX_NORM(h.name))) return;
      if(played && played.has(FX_NORM(h.name))) return; if(!this._titleOk(h, vamp)) return; if(((h.e.cost && h.e.cost.blood) || 0) > (vamp.blood | 0)) return;
      let best = 0; (h.e.modes || []).forEach(mo => { if(mo.when === 'lockedBlock') return; const ic = mo.fx && mo.fx.intercept; if(typeof ic === 'number' && ic > best && this._modeUsableBy(mo, vamp)) best = ic; });
      if(best > 0){ seen.add(FX_NORM(h.name)); S++; sum += best; } });
    return { S, sum };
  }
  _interceptSecondLook(){            // v0.6.143d (Johan, 20 Sep: 'a bot that plays ONE intercept card even when it holds more and more are needed is a clear limitation / bug'): the blocker's side of the exchange. When the tally moves and my block now FAILS, I look again: can the intercept I still hold reach their stealth? Then the next card goes down; if it cannot, the cards are kept.
    const p = this.pending; if(!p || !p.contested || !p.blockerVamp || this.out || this.o.stealthStack === 0) return;
    const t = this.tally; if(!t || t.mode !== 'block') return; const b = t.b | 0, a = t.a | 0; if(b >= a) return;   // the block succeeds as it stands
    if((p.icLooks | 0) >= 4) return; p.icLooks = (p.icLooks | 0) + 1;
    const blocker = p.blockerVamp, need = a - b, stack = this._interceptStack(blocker, p.reacted), ic = this._bestInterceptFor(blocker, p.reacted);
    let tag, go = false;
    if(!ic || stack.S <= 0) tag = 'no-intercept';
    else if(stack.sum < need) tag = 'cannot-reach';
    else if((p.amount | 0) < 2 && ic.s < need) tag = 'not-worth-two';      // a bleed of 1 is not worth two intercept cards
    else { go = true; tag = 'answer'; }
    this._emit('intercept-stack', { vamp: blocker.name, look: 1 + (p.icLooks | 0), S: stack.S, sum: stack.sum, need, answer: go, tag, amount: p.amount | 0, tally: { a, b } });
    this.o.log('blocker second look (stealth ' + a + ' vs intercept ' + b + '): ' + tag);
    if(!go) return;
    p.reacted.add(FX_NORM(ic.name));
    this.hand.splice(ic.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1; this._toAsh(ic.name);
    this._emitPlay(ic.name, 'react-intercept', blocker.name);
    if(ic.cost && ic.cost.blood) blocker.blood = Math.max(0, (blocker.blood | 0) - ic.cost.blood);
    this.fxClone({ name: ic.name, kind: 'lib' }, '+' + ic.s + ' intercept', { actor: blocker });
    this.send({ t: 'log', html: '<b>' + esc(blocker.name) + '</b> plays <b>' + esc(ic.name) + '</b>: +' + ic.s + ' intercept.' });
    this._setTallyB(b + ic.s); this.push();
  }
  _stealthSecondLook(){               // v0.6.143c THE SECOND LOOK (smoke1: `need` was 1 in 20 of 20 decisions -- the first look fires on the blocker's 'Block!' SHOUT, before it has played its intercept and written the tally; and nothing ever looked again, so no second stealth card was ever played). When the tally moves and the block currently SUCCEEDS, the actor looks at the real numbers: can my remaining stealth reach it?
    const a = this._ask, av = this._actingVamp; if(!a || !a.contested || !av || this.out || this.o.stealthStack === 0) return;
    const t = this.tally; if(!t || t.mode !== 'block') return; const b = t.b | 0, sa = t.a | 0; if(b < sa) return;   // the block fails as it stands: nothing to answer
    if((av.looks | 0) >= 4) return; av.looks = (av.looks | 0) + 1;
    const st = this._bestStealthFor(av.v, av.played, av.target); const stack = this._stealthStack(av.v, av.played); const need = b - sa + 1;
    const annN = (typeof av.n === 'number' ? av.n : 1); let pump = 0;
    if(av.kind === 'bleed' || (av.kind == null && av.target)){ const bm = this._bestBleedModifierFor(av.v, av.played, av.limitedUsed); if(bm && typeof bm.n === 'number' && (!st || bm.name !== st.name)) pump = bm.n | 0; }
    const bw = a._lineBlockFrom || a._sayBlockFrom || null; const bSeat = bw ? ((this.players || []).find(p => p.name === bw) || {}).seat : null;
    const pInt = +((bSeat ? this._pCat(bSeat, 'intercept') : 0.15) * (b > 0 ? 0.6 : 1)).toFixed(2);   // intercept already on the table (a card or a permanent) makes a FURTHER card less likely
    const d = st ? this.decide('spend-stealth', { pInt, pIntEff: pInt, attempts: 0, need, stakes: annN + pump, announced: annN, pump, stack, axis: this._stealthAxis(), pDraw: this._pDrawStealth(av.v), second: true })
                 : { spend: false, tag: 'no-stealth', stack: 0, need, theirs: 0, why: 'no stealth card left to answer intercept ' + b + ' vs stealth ' + sa };
    this._emit('stealth-stack', { vamp: av.v.name, look: 1 + (av.looks | 0), S: d.stack, sum: stack.sum, need, more: d.theirs, contest: !!d.spend, tag: d.tag, stakes: annN + pump, tally: { a: sa, b } });
    this.o.log('second look (stealth ' + sa + ' vs intercept ' + b + '): ' + d.why + ' \u2192 ' + (d.spend ? 'another stealth card' : 'stop'));
    if(d.spend && st) this._spendStealthCard(st, av, a);
  }
  /* v0.6.147 THE TALLY NET. Online the server relays every tally to every seat; the client's hotseat bridge (v2.6.121) drops the verb, so at a hotseat table
     the actor never saw the blocker's intercept, the blocker never saw the actor's stealth, the v0.6.143 first look waited for a tally that never came
     (measured through the real bridge: 0 stealth cards, 0 second looks in 35 block attempts) and the verdict was declared from half a counter. The net
     stands down the moment ANY foreign tally has arrived since the attempt; otherwise it rebuilds the other side's number from the frozen LOG lines, which
     every relay carries -- exact for the cards, blind to a permanent's intercept / an action's inherent stealth (those live only on the counter). */
  _tallyNetActor(who, n, av, a, since, minion){
    if(this.out || this._ask !== a || this._actingVamp !== av || !a.contested) return;
    const t0 = (av._deferred && av._deferred.at) || ((since || 0) - 1500); if(this._fTallyAt && this._fTallyAt >= t0 - 50) return;   // the relay carries tally (any foreign counter since the shout; the bot's send queue may put the tally a beat BEFORE the line): the second look owns this
    clearTimeout(av._netT); av._netT = null;
    const cur = (this.tally && this.tally.mode === 'block') ? this.tally : { mode: 'block', a: 0, b: 0, ph: 0, rd: 1 };
    const first = !!av._deferred, fresh = first || (minion && av._netMinion && minion !== av._netMinion); if(minion) av._netMinion = minion;   // v0.6.148: intercept belongs to THE MINION (rulebook; _setTallyB writes fresh per attempt) -- a second minion's attempt after a failed one must not inherit the first one's number, and gets its own first look
    if(typeof n === 'number'){ const b1 = fresh ? n : (cur.b | 0) + n; this.tally = Object.assign({}, cur, { mode: 'block', b: b1 }); }   // the first line WRITES the attempt's intercept (as _setTallyB does), later lines add to it; a LOCAL mirror only -- never sent, b is not mine to write
    this._emit('tally-net', { side: 'actor', vamp: av.v && av.v.name, from: who, line: n, a: this.tally ? this.tally.a | 0 : 0, b: this.tally ? this.tally.b | 0 : 0, first, minion: minion || null });
    if(first){ av._deferred = null;
      const st = this._bestStealthFor(av.v, av.played, av.target); if(st) this._stealthFirstLook(who, av, a, st);
      return; }
    this._stealthSecondLook();
  }
  _tallyNetBlocker(n, p, since){
    if(this.out || this.pending !== p || !p.contested || !p.blockerVamp) return;
    if(this._fTallyAt && this._fTallyAt >= since - 1500) return;
    const cur = (this.tally && this.tally.mode === 'block') ? this.tally : { mode: 'block', a: 0, b: 0, ph: 0, rd: 1 };
    this.tally = Object.assign({}, cur, { mode: 'block', a: (cur.a | 0) + n });
    this._emit('tally-net', { side: 'blocker', vamp: p.blockerVamp.name, line: n, a: this.tally.a | 0, b: this.tally.b | 0 });
    this._interceptSecondLook();
  }
  _stealthFirstLook(who, av, a, st){   // v0.6.147: the v0.6.141-143 first look, lifted out of _onBlockAttempt unchanged so the tally net can run it too; returns true when a stealth card went down
    const seat = ((this.players || []).find(p => p.name === who) || {}).seat;
    const pInt = seat ? this._pCat(seat, 'intercept') : 0.15;   // R2 (v0.6.43): ground truth (revealed/open hand) overrides the inference when present
    /* v0.6.141 (serie-bal3: malkavian answered a block with stealth 20 of 78 times): the stakes of a bleed are what it can BECOME, not what was announced -- a stealth-bleed deck slips the bleed of 1
       past the blocker and pumps it afterwards (Conditioning +3). The best bleed modifier this vampire can still play counts. */
    const annN = (typeof av.n === 'number' ? av.n : 1); let pump = 0;
    if(av.kind === 'bleed' || (av.kind == null && av.target)){ const bm = this._bestBleedModifierFor(av.v, av.played, av.limitedUsed); /* a bleed carries a target and no kind; a hunt has neither */ if(bm && typeof bm.n === 'number' && st && bm.name !== st.name) pump = bm.n | 0; }
    const stack = this._stealthStack(av.v, av.played);
    const tb = this.tally && this.tally.mode === 'block' ? (this.tally.b | 0) : 0, ta = this.tally && this.tally.mode === 'block' ? (this.tally.a | 0) : 0; const need = Math.max(1, tb - ta + 1);   // a block succeeds when intercept >= stealth
    if(!av.attemptCounted){ av.attemptCounted = true; this._turnAttempts = (this._turnAttempts | 0) + 1; }   // PROBE THEN PUNCH's other half: every block attempt my prey has already made this turn has cost it a wake or an intercept card more often than not
    const attemptsBefore = Math.max(0, (this._turnAttempts | 0) - 1), pIntEff = +(pInt * Math.pow(0.6, attemptsBefore)).toFixed(2);
    const d = this.decide('spend-stealth', { pInt, pIntEff, attempts: attemptsBefore, need, stakes: annN + pump, announced: annN, pump, stack, axis: this._stealthAxis(), pDraw: this._pDrawStealth(av.v) });
    if(d.tag) this._emit('stealth-stack', { vamp: av.v.name, S: d.stack, sum: stack.sum, need: d.need, more: d.theirs, contest: !!d.spend, tag: d.tag, stakes: annN + pump, pInt: +pInt.toFixed(2), pIntEff, attempts: attemptsBefore });
    this.o.log('block attempt by ' + who + ': ' + d.why + ' → ' + (d.spend ? 'stealth' : 'await verdict'));
    if(d.spend){ this._spendStealthCard(st, av, a); return true; }
    return false;
  }
  _onBlockAttempt(who){
    { const a0 = this._ask;
      if(a0 && a0.reactionsOnly){        // v0.6.114 (Johan): blocks were FINALLY declined before my modifier -- the block step is over, only reactions remain. Refuse out loud (the human may not have noticed), keep the window open for reduce/bounce/No reaction, never contest.
        this.chat('Trainbot: blocks were declined this action \u2014 only reactions (reduce, bounce) remain. Say "no reaction" or play yours.');
        this._restartAskTimer();
        return;
      } }
    const a = this._ask; if(!a) return;
    this._combatArmed = true;   // v0.6.103 (#1): somebody attempts to block MY action -- their early strike line may legitimately arrive before my Blocked branch enters _resolveCombat
    const av = this._actingVamp;
    if(av) av.reactionsSeen = true;   // fas C (Perfectionist's clean-action test): conservative v1 -- ANY Block! attempt marks the action dirty (the attempt almost always rides an intercept card; a bare shout is rare, and erring strict never over-gains)
    const cb = av && this._bestCancelBlockFor(av.v, av.played);
    if(cb){
      /* fas C (16 July): Elder Impersonation-class -- a GUARANTEED answer, checked
         BEFORE the stealth bet. The attempt fails outright; the action stays live
         and blockable by OTHER minions (the ask window simply continues). The
         defender's attempted-set already excludes the failed minion on receipt. */
      const d = this.decide('cancel-block', { stakes: (typeof av.n === 'number' ? av.n : 1), cost: cb.cost });
      this.o.log('block attempt by ' + who + ': ' + d.why + ' → ' + (d.spend ? 'CANCEL' : 'fall through'));
      if(d.spend){
        if(av.played) av.played.add(FX_NORM(cb.name));
        this.hand.splice(cb.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1;
        this._toAsh(cb.name);   // v0.6.12 ash sweep
        this._emitPlay(cb.name, 'cancel-block', av && av.v && av.v.name);   // v0.6.139: this spend left no trace row (CLAUDE.md 43c)
        if(cb.cost) av.v.blood = Math.max(0, (av.v.blood | 0) - cb.cost);
        this.fxClone({ name: cb.name, kind: 'lib' }, 'cancels the block', { actor: av.v });
        this.send({ t: 'log', html: '<b>' + esc(av.v.name) + '</b> plays <b>' + esc(cb.name) + '</b>: cancels the block attempt by <b>' + esc(who) + '</b> \u2014 that minion cannot try again.' });

        this.push();
        a.contested = false;                 // no contest exists -- the attempt died outright; the window continues for OTHER minions
        this._restartAskTimer();
        return;
      }
    }
    const st = av && this._bestStealthFor(av.v, av.played, av.target);   // fas C: av.target lets attached Marked Path burns qualify (same-target rule)
    const botBlocker = !!((this.players || []).find(p => p.name === who) || {}).bot;
    if(st && !a.contested && !(botBlocker && this.o.stealthStack !== 0)){
      if(this._stealthFirstLook(who, av, a, st)) return;
    }
    else if(st && !a.contested && botBlocker){   // v0.6.147 (THE HOTSEAT NET): the look is DEFERRED to the blocker's tally -- remember that, so a tally that never comes (a relay that drops it: the client's hotBridge, v2.6.121) cannot silence the actor. The blocker's own attempt LINE arms the short net (_tallyNetActor); this belt covers a line that never comes either.
      av._deferred = { who, at: Date.now() };
      const beltMs = Math.max(1200, Math.round((this.o.askSecs || 3) * 600)); clearTimeout(av._netT);
      av._netT = setTimeout(() => { try { this._tallyNetActor(who, null, av, a); } catch(e){ this.o.log('tally net error:', e.message); } }, beltMs); if(av._netT.unref) av._netT.unref();
    }
    /* v0.3.7 (Johan): 'Block!' opens the REFERENDUM — wait for the §12 verdict
       instead of assuming the block lands. v0.3.8: EVERY repeated 'Block!'
       refreshes the wait. v0.6.113 (THE HELPER GATE): ALWAYS -- the old
       `if(this.caps.tally)` guard fell through to `_answer('block')` (instant
       combat, the block conceded unread) on any table where no counter had been
       seen yet. That was every hotseat table, and online the FIRST block of every
       game even with helpers on: avrOpen('block') sends the say 'Block!'
       synchronously but debounces its tally 120 ms, so the shout always beat the
       counter that would have informed it. Now the verdict comes from the §12
       line when a human resolves it, or from the bot's own tally at the clock
       (_askTimeout) -- the bot is the resolver-holder when nobody else is. */
    a.contested = true;
    this._restartAskTimer();
  }

  /* ---------- L4 citizenship: the seat-anchored camp (spec §6 i) ----------
     Classic renders opponent cards at RAW pub coordinates on the shared felt,
     so the bot pitches camp at its seat's angle instead of squatting on the
     canonical left band. Structured keeps the zone-band GEO untouched.      */
  campAnchor(){
    const n = Math.max(2, (this.players || []).length || 5);
    const ang = (((this.seat - 1) % n) / n) * 2 * Math.PI - Math.PI / 2;
    return { x: Math.round(502 + 350 * Math.cos(ang)), y: Math.round(300 + 180 * Math.sin(ang)) };
  }
  slot(zone, idx){
    const cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    if(!this.caps.classic){
      if(zone === 'ready')  return { x: GEO.x0 + idx * GEO.dx, y: GEO.readyY };
      if(zone === 'torpor') return { x: GEO.x0 + idx * GEO.dx, y: GEO.torporY };
      return { x: GEO.x0 + idx * GEO.dx, y: GEO.uncY };
    }
    const a = this.campAnchor();
    const y = zone === 'ready' ? a.y - 75 : zone === 'torpor' ? a.y + 5 : a.y + 85;
    return { x: cl(a.x - 150 + idx * GEO.dx, 12, GEO.bw - 96), y: cl(y, 12, GEO.bh - 130) };
  }
  /* v0.4.5 (Johan, live test): slot(zone,idx) is a pure idx->{x,y} formula
     with no memory of who's already there. A raw "current zone population
     count" as idx only works while the zone stays contiguous 0..N-1 -- true
     right up until a card LEAVES the zone out of turn (a vampire torpors in
     combat, or a human torpors/untorpors one via the bot-elements ctrl
     exception), freeing a MIDDLE slot while the others keep their original
     index. The next arrival then recomputes the same index from the new
     (smaller) count and lands exactly on top of a still-occupied card.
     This scans for the first slot(zone,idx) not already held by ANOTHER
     card in that zone -- `exclude` lets the caller check against everyone
     else while a card that already carries this zone (e.g. its zone was
     just set before x/y is assigned) doesn't block its own placement.    */
  _openSlot(zone, exclude){
    for(let idx = 0; ; idx++){
      const p = this.slot(zone, idx);
      if(!this.board.some(c => c !== exclude && c.zone === zone && c.x === p.x && c.y === p.y)) return p;
    }
  }

  /* ---------- the chat contract (incoming) ---------- */
  _onChat(who, msg){
    /* v0.6.106 (#14): the B-55e-b chat parse (`^Trainbot: X attempts the block.` / `plays Y (+N intercept).`) is RETIRED -- the blocker's name rides the frozen log lines L12.attempt / L12.interceptPlay (see _onLog → _noteBlockAttempt) and own attempts are counted at _commitBlock; the 'Trainbot:' chat prefix is narration again, free to change. */
    if(who === this.o.name) return;                            // our own lines echo back
    const txt = String(msg || '').trim();
    this._holdHook(who, -1, txt);                              // v0.6.95: chat-side hold fallback ('hold on' pauses, 'carry on'/'resume'/'it resolves' release)
    if(this._refCall && !this._refCall.closed && /^(no votes from me|i abstain|abstain)\.?$/i.test(txt)){ this._refCall.heard.add(who); this._refCall.paused.delete(who); this._refCall.arm(); }   // v0.6.122: a bot's abstain bubble (and a human typing the same) counts as having spoken
    /* v0.6.21 (Johan's combat GO, Taste of Vitae): the opponent's own end-of-round
       "X takes N (loses P blood, now M)." narration -- sent via chat() (Trainbot
       combat narration is freeform, not a frozen §12 line), so this is a NEW read,
       not a reuse of the strikeC machinery. Mirrors the strike handshake's own
       reasoning: the chat channel already self-filters our own echoed lines (the
       guard above), so any incoming "takes N" is someone else's -- same precedent
       _oppStrike's comment relies on, no stricter per-combatant name check added
       here either, for consistency with that existing choice rather than inventing
       a new standard. Reads the "loses P blood" clause specifically (blood LOST),
       not the raw damage-taken number -- these differ whenever the opponent goes to
       torpor this round (paid caps at what they actually had to lose).            */
    let tm = txt.match(/(?:dealt; |^(?:\S+ combat \u2014 )?)([^;]+?) (?:takes|dodges the strike .*?takes) (\d+) \(loses (\d+) blood/);   // v0.6.103 (#1): the vampire that TOOK the damage (after 'dealt; ' in the normal line, after the prefix in the dodge+crows line) -- the old lazy (.+?) captured the whole strike clause
    if(tm && !this._stashAccept(tm[1])) tm = null;   // v0.6.103 (#1): not my opponent -> not my stash
    if(tm){
      this._oppTaken = { vamp: tm[1], n: parseInt(tm[3], 10) };
      if(this._takenWaiter){ const w = this._takenWaiter; this._takenWaiter = null; const s = this._oppTaken; this._oppTaken = null; w(s); }
    }
    /* v0.6.22 (Johan's combat GO, the multi-round loop -- Press, source-verified
       vekn.net 19 July): "If there is an UNCANCELLED press to continue, a new round
       begins" -- only ONE side needs to press; the other doesn't need to agree, only
       to actively cancel with their OWN press. v1 scope: my bot never attempts to
       cancel an incoming press (that's its own future decision, documented not
       built) -- it only detects whether the opponent pressed at all, and if so,
       treats it as uncancelled (continues). Mirrors _oppTaken exactly: same
       self-filter (top of this function), same stash/waiter shape.               */
    const pm0 = txt.match(/^(?:\S+ combat \u2014 )?(.+?) presses to (continue|end)/i);   // v0.6.103 (#1): bare vampire name (the old regex captured 'Trainbot combat -- Lisa')
    const pm = (pm0 && this._stashAccept(pm0[1])) ? pm0 : null;
    if(pm){
      this._oppPress = { vamp: pm[1], continue: pm[2].toLowerCase() === 'continue' };
      if(this._pressWaiter){ const w = this._pressWaiter; this._pressWaiter = null; const s = this._oppPress; this._oppPress = undefined; w(s); }
    }
    /* v0.6.24 (Johan's combat GO, the range concept): "maneuvers to close/long" --
       mirrors the press parser exactly, same self-filter, same stash/waiter shape. */
    const mm0 = txt.match(/^(?:\S+ combat \u2014 )?(.+?) maneuvers to (close|long)/i);
    const mm = (mm0 && this._stashAccept(mm0[1])) ? mm0 : null;
    if(mm){
      this._oppManeuver = { vamp: mm[1], range: mm[2].toLowerCase() };
      if(this._maneuverWaiter){ const w = this._maneuverWaiter; this._maneuverWaiter = null; const s = this._oppManeuver; this._oppManeuver = undefined; w(s); }
    }
    /* v0.6.26 (Johan's combat GO, Carrion Crows): unlike every other opp-parser in
       this file, this one is NOT a one-shot stash/waiter -- Carrion Crows announces
       ONCE ("...for the rest of this combat") and then applies EVERY round without
       needing to be re-announced, so `this._oppCarrionCrows` is set PERSISTENTLY
       here and read directly by _resolveCombatRound's taken+= line, never consumed/
       cleared until _resolveCombat resets it for a new combat. */
    const ccm0 = txt.match(/^(?:\S+ combat \u2014 )?(.+?)(?: plays carrion crows|'s murder of crows): opposing minion takes (\d+) environmental damage each round/i);
    const ccm = (ccm0 && this._stashAccept(ccm0[1])) ? [ccm0[0], ccm0[2]] : null;   // v0.6.103 (#1): a bystander's view of somebody else's crows must not peck ME in my next combat   // N0: the borne crows share the frozen phrase family -- one parser, one taken+= line
    if(ccm) this._oppCarrionCrows = { n: parseInt(ccm[1], 10) };
    /* v0.6.28 (Immortal Grapple): a normal one-shot stash/waiter (like maneuver/
       press), NOT persistent like Carrion Crows -- "cannot be used THIS round" is
       reset every round by _resolveCombatRound's own `this._handStrikeOnly = false`. */
    const igm0 = txt.match(/^(?:\S+ combat \u2014 )?(.+?) plays immortal grapple: strikes that are not hand strikes cannot be used this round/i);
    const igm = (igm0 && this._stashAccept(igm0[1])) ? igm0 : null;
    if(igm){
      this._oppGrapple = true;
      if(this._grappleWaiter){ const w = this._grappleWaiter; this._grappleWaiter = null; const s = this._oppGrapple; this._oppGrapple = undefined; w(s); }
    }
    /* v0.6.110 (R2, #11): typed answers to MY pool question, and the typed form
       of the prompt itself -- the quick phrases are the fast path, chat is the
       fallback the feedback explicitly asked for ("snabbfrasa eller chattskriva"). */
    if(this._pq){
      if(this._pq.stage === 'yn'){
        if(/^\s*(yes|ja|yep|y)\b/i.test(txt))          return this._pqAnswer('yes', who);
        if(/^\s*(no|nej|nope|n)\b/i.test(txt))         return this._pqAnswer('no', who);
      } else {
        const nm = txt.match(/(\d+)/); if(nm)              return this._pqAnswer(nm[1], who);
      }
      return;
    }
    if(!this._ask && !this.pending && /^\s*any (blocks?|reactions?)\??\s*$/i.test(txt)) return this._onAnyBlocks(who, 'Any blocks?');
    /* answers to a pending Block? question — from anyone; the table referees */
    if(this._ask){
      if(/^\s*block\b/i.test(txt))            return this._answer('block', who);
      if(/^\s*(no|nej|through|pass)\b/i.test(txt)) return this._answer('no', who);
    }
    /* damage grammar: "bleed 2" / "vote 3" — manual fallback for when the
       normal say/log flow didn't resolve the damage. In multi-bot games the
       grammar must be SCOPED: a bare "bleed 3" applies only to the sender's
       prey bot (the most common case); "@BotName bleed 3" targets a specific
       bot by name (for bounced bleeds or political damage at a non-prey). */
    const nameRe = new RegExp('^\\s*@?' + this.o.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[,:!]?\\s*', 'i');
    const namedMe = nameRe.test(txt);
    const genericRe = /^\s*(?:@?trainbot[:,]?\s*)?/i;
    const bodyMatch = txt.replace(namedMe ? nameRe : genericRe, '');
    const dm = bodyMatch.match(/^(bleed|vote)\s+(\d{1,2})\s*$/i);
    if(dm){
      /* scope: named → always; unnamed → only if the sender is my predator
         (i.e. I am the sender's prey — the natural target for unspecified damage) */
      if(!namedMe && this.seatName(this.predSeat()) !== who) return;
      if(this.out) return this.note(this.o.name + ' is already ousted \u2014 the dead bleed no more.');
      const kind = dm[1].toLowerCase(), n = Math.min(30, parseInt(dm[2], 10) || 0);
      if(!n) return;
      this.pool -= n;
      if(this.pool > 0){
        this.push();
        this.chat('I take ' + n + (kind === 'bleed' ? '' : ' ' + kind) + '. Pool: ' + this.pool + '.');   // v0.6.117: same spoken ack as the It-resolves path
      } else this._oust(false);
      return;
    }
    /* v0.6.108: a BARE "help"/"rush" is a table-wide question — only the
       spokesbot answers, or N bots reply in chorus. The named form
       ("@Grinder help") always reaches exactly that bot. */
    if(/^rush\b/i.test(bodyMatch) && (namedMe || this._isSpokesBot()))
      return this.note(this.o.name + ' has no combat module yet (M2). Treat my vampires kindly \u2014 or the host can referee.');
    if(/^help\b/i.test(bodyMatch) && (namedMe || this._isSpokesBot())){
      const several = (this.players || []).filter(p => p.bot && !p.vacant).length > 1;
      return this.chat(this.o.name + ' v' + BOT_VERSION + ' \u2014 I understand: "bleed N", "vote N", "block"/"no" (when I ask), "help".' + (several ? ' Aim at one bot with "@Name bleed N".' : ''));
    }
  }

  _answer(what, who){
    const a = this._ask; this._ask = null;
    if(this._rcT){ clearTimeout(this._rcT); this._rcT = null; }   // the answered ask stands the clock trigger down
    if(a){ if(a.timer) clearTimeout(a.timer); if(a._whoT){ clearTimeout(a._whoT); a._whoT = null; } a.resolve({ what, who }); }   // v0.6.110 (R2, #12): a resolved ask never asks who blocked
  }
  _armReactTimer(){                    // v0.3.10 (Johan): after 5 s of silence, ring the table's EXISTING Reaction timer — the server broadcasts who + the room's reactSecs, every client shows the countdown. The bot's own patient window (askSecs) is untouched: the stopwatch prompts, the ask decides.
    if(this._rcT) clearTimeout(this._rcT);
    this._rcT = setTimeout(() => {
      this._rcT = null;
      const a = this._ask; if(!a) return;
      this.send({ t: 'decide' });
      /* v0.6.114 (Johan: "the bot resumes too long after the stopwatch ends"): the window
         used to keep its full askSecs (20 s at a human table) regardless of the stopwatch,
         so the table sat through ~8 s of silence after the countdown hit zero. The ring now
         re-stamps the deadline to stopwatch-end + reactGraceMs -- never LATER than the
         deadline already held. reactSecs is the room's (joined.reactSecs), default 5. */
      if(a.pausedBy && a.pausedBy.size) return;   // v0.6.115 (self-review): a Hold on... nulls timer AND deadline (4363) -- `!a.deadline` below would have armed a clock on a window a human is holding, closing it after ~7 s despite the hold. The stopwatch may ring; it never overrules a hold.
      const secs = (this._reactSecs > 0 ? this._reactSecs : 5);
      const wait = secs * 1000 + (this.o.reactGraceMs != null ? this.o.reactGraceMs : 2000);
      if(!a.deadline || Date.now() + wait < a.deadline){
        if(a.timer) clearTimeout(a.timer);
        a.deadline = Date.now() + wait;
        a.timer = setTimeout(() => this._askTimeout(), wait);
      }
    }, (this.o.reactClockMs != null ? this.o.reactClockMs : 7000));   // v0.6.109 (#13): was a hardcoded 5000 -- see o.reactClockMs
  }
  /* v0.6.108: am I the bot that speaks for the table? The lowest-seated bot
     answers table-wide questions ("help") so N bots don't all reply at once.
     No bots in the roster (roster not yet read) = fail-safe yes. */
  _isSpokesBot(){
    const seats = (this.players || []).filter(p => p.bot && !p.vacant).map(p => p.seat).sort((a, b) => a - b);
    return !seats.length || seats[0] === this.seat;
  }
  /* v0.6.108: turn watchdog — heartbeat during the bot's own turn.
     If nothing visible (chat/fx/board) has been sent for 30 seconds while
     this bot owns the turn, post a brief status line so the table knows
     the bot is still alive. Clears itself on turn end or on any visible
     send. Detects hangs and reassures humans in slow phases. */
  _watchdogArm(){
    this._watchdogKill();
    if(!this.o.paceMs) return;                               // arena (pace 0) = no watchdog
    this._wdT = setTimeout(() => {
      this._wdT = null;
      if(this.turnSeat !== this.seat || this.out) return;    // not my turn any more — stand down
      /* only heartbeat when the wait is MINE. An open ask or a table hold
         means the bot is waiting for the TABLE, not thinking: the client
         already shows the reaction countdown / the hold ack, and saying
         "still thinking" there would be plainly wrong. Re-arm either way
         so the heartbeat resumes once the table hands control back. */
      if(!this._ask && !(this._holdBy && this._holdBy.size)) this.chat('\u231b Still thinking\u2026');
      this._watchdogArm();
    }, 30000);
  }
  _watchdogKill(){ if(this._wdT){ clearTimeout(this._wdT); this._wdT = null; } }
  _restartAskTimer(){
    const a = this._ask; if(!a) return;
    if(a.timer) clearTimeout(a.timer);
    const wait = this.o.askSecs * 1000 + this._chatSettleMs();   // v0.6.109 (#1): computed ONCE and stamped, so status() reports the deadline the timer actually holds instead of re-deriving it (and re-reading a _chatSettleMs that has moved on since)
    a.deadline = Date.now() + wait;
    a.timer = setTimeout(() => this._askTimeout(), wait);
    this._armReactTimer();   // v0.6.115 (self-review): the stopwatch is "N s of table SILENCE" -- silence restarts on activity, so every restart re-arms it. Was armed only at the window's opening (3 sites vs 15 restarts): one reaction played after the ring handed the table a fresh 20 s with no stopwatch -- the dead air v0.6.114 removed, back in exactly the case that happens at a table. Every window now ends <= reactClockMs + reactSecs + grace after the LAST activity, whatever askSecs is.
  }
  /* v0.6.109 (#1, the widget seam): the timer's body, extracted VERBATIM so that
     step()'s resolve-ask rung runs the IDENTICAL path the clock would have run --
     including the contested-referendum branch below, which pointedly does NOT
     resolve to 'no' but declares the verdict from the tally. A step() that called
     _answer('no') directly would have produced an outcome the bot cannot reach on
     its own, which is the one thing the widget rule forbids. Re-reads this._ask on
     entry (the closure captured it), which is also what makes a double click a
     no-op by construction. */
  _askTimeout(){
    const a = this._ask; if(!a) return;
      /* v0.6.3 (16 July, arena root-cause): a CONTESTED referendum that times
         out is not "nobody pursued it" -- the contest already has a mechanical
         answer sitting in the shared tally (rulebook: "if the intercept is
         greater or equal to the stealth, the action is blocked"). The old
         unconditional 'no' silently swallowed a b>=a block whenever nobody
         wrote the §12 verdict line -- REGARDLESS of room type: in an all-bot
         room nobody ever writes it (the same observation-capability class as
         arena v1.0.1's tally seed), and even in a human room a forgotten
         verdict click let the bleed through against the rules. The bot now
         DECLARES the verdict itself from the tally (the exact §12 line both
         its own L12.block handler and the DEFENDER's combat hand-off already
         consume) -- a human resolver who clicks within askSecs still wins the
         race, since an inbound verdict resolves the ask and kills this timer.
         Non-contested silence stays 'no', unchanged. */
      if(a.contested && this.tally && this.tally.mode === 'block'){   // v0.6.113: caps.tally dropped from the condition -- this.tally is now also fed by the bot's own writes (_writeTally mirrors), so a contested window ALWAYS has a counter to declare from once the actor announced
        const sA = this.tally.a | 0, iB = this.tally.b | 0;
        this._ask = null;   // the L12.block echo of OUR OWN line must not re-enter this ask -- the answer comes from _answer via the local resolve below, not the handler
        this.send({ t: 'log', html: 'Block: Stealth ' + sA + ' vs Intercept ' + iB + ' \u2014 block ' + (iB >= sA ? 'succeeds' : 'fails') + '.' });   // PROTOCOL §12, frozen wording -- the defender's L12.block handler fires its combat hand-off from this exact line
        this.push();
        if(iB >= sA) return a.resolve({ what: 'block', who: null });
        /* failed contest: the action continues -- same shape as an inbound 'fails' verdict */
        this._ask = a; a.contested = false; a.timer = null; this._restartAskTimer();
        return;
      }
    this._ask = null; a.resolve({ what: 'no', who: null });
    // v0.6.100 (Johan): the clock that lands here starts AFTER the declaration bubbles settle -- animation, then declaration, then the stopwatch, in succession. v0.3.8: non-contested silence always means 'no' -- post-stealth quiet is a conceded block (classic); v0.6.3: a CONTESTED timeout now resolves the referendum from the tally instead (see above)
  }
  /* The reaction window as ACTOR (spec §5): the chat grammar, the say phrases
     ('Block!' answers; 'Hold on…' pauses the clock until that thinker passes)
     and a live §12 Block-resolve line ALL answer the same question — the bot
     accepts whichever channel the table speaks.                             */
  _askBlock(question, askOpts){
    askOpts = askOpts || {};
    const reactionsOnly = !!askOpts.reactionsOnly;   // v0.6.114: after blocks were declined, only reactions remain (rulebook "Detailed course of an action": a modifier never reopens blocks)
    const tail = reactionsOnly ? ' \u2014 reduce, bounce or say "no reaction" (' + this.o.askSecs + 's \u2192 resolves)' : ' \u2014 say "block" or "no" (' + this.o.askSecs + 's \u2192 no)';
    return new Promise(resolve => {
      const targetSeat = (this._actingVamp && this._actingVamp.target) || this.preySeat();   // steg 2 (15 July): the CURRENT target (may differ from prey after a mid-action bounce), falling back to prey for hunt
      const av = this._actingVamp;
      const undirected = !!av && (UND_KINDS.has(av.kind) || (!av.kind && !av.target));   // v0.6.107 (B1): hunt / stock / recruit / strength / creep / equip / fetch -- prey AND predator may block
      if(undirected){
        /* v0.6.108: the eligible set is prey + predator (the players who
           can block by default — range restriction). Intermediate players
           are "soft" — the window does NOT wait for them. But if an
           intermediate player says "Hold on…" BEFORE the window closes,
           they're promoted into the eligible set (Eagle's Sight, Instinct,
           or any future range-lifting card). Block! from anyone always
           works regardless (line _onBlockAttempt fires outside eligible).
           This keeps the default flow fast (2 players) while letting
           edge cases opt in without forcing everyone to explicitly pass. */
        const elig = new Set([this.nextLive(this.seat), this.prevLive(this.seat)].filter(sn => sn && sn !== this.seat && this.live(sn)).map(sn => this.seatName(sn)));
        if(!elig.size) return resolve({ what: 'no', who: null });
        this.chat(question + tail);
        this._ask = { resolve, timer: null, pausedBy: new Set(), contested: false, target: targetSeat, undirected: true, eligible: elig, passed: new Set(), reactionsOnly };
        this._restartAskTimer();
        this._armReactTimer();
        return;
      }
      const preyOut = (this.players || []).some(p => p.seat === targetSeat && p.out);
      if(preyOut) return resolve({ what: 'no', who: null });   // never wait on ghosts: an ousted target can't block
      this.chat(question + tail);
      this._ask = { resolve, timer: null, pausedBy: new Set(), contested: false, target: targetSeat, reactionsOnly };   // v0.6.106 (#3): the roster hook reads THIS
      this._restartAskTimer();
      this._armReactTimer();                                   // v0.3.10: 5 s of table silence → the ROOM's Reaction timer (decide verb); the ask still waits its full askSecs
    });
  }

  _settleMs(){ return Math.max(300, Math.min(1500, this.o.paceMs | 0 || 600)); }   // v0.6.103 (#2): how long to wait for a roster after a possible oust -- bounded, pace-scaled
  async _settleOust(seat, n){        // v0.6.103 (#2): after a directed through-resolution of n against `seat`: if their last pushed pool cannot survive it, wait (bounded) until the roster marks them out -- at paceMs 0 the next Block? would otherwise open before the prey's bounty/roster is even read (no macrotask yield between 'It resolves' and the next ask)
    const tp = this.table && this.table[seat] && this.table[seat].pub;
    if(!tp || typeof tp.pool !== 'number' || tp.pool - (n | 0) > 0) return false;
    const t0 = Date.now(), ms = this._settleMs();
    while(this.live(seat) && Date.now() - t0 < ms) await sleep(25);
    return !this.live(seat);
  }
  async _settleOusts(ms){            // v0.6.103 (#2): any live seat whose last pushed pool is already <= 0 (a creep/Jack burn at my unlock, a bounty in flight) -- wait for the roster to agree before I pick a prey
    const t0 = Date.now();
    const stale = () => { const ps = this.preySeat(); const t = this.table[ps]; return this.live(ps) && !!(t && t.pub && typeof t.pub.pool === 'number' && t.pub.pool <= 0); };   // v0.6.104: PREY only -- a cross-table human parked at 0 without pressing ousted must not cost every bot turn a settle wait; only the prey's oust changes my target
    while(stale() && Date.now() - t0 < ms) await sleep(25);
  }
  /* v0.6.147 (THE HOTSEAT NET): the SERVER marks an ousted seat `out` in the roster and routes the 6 pool to its predator. The client's hotseat bridge
     (v2.6.121) does neither for bot seats: `bounty` is dropped, no roster follows an oust, and awardBountyHot writes the pool into a stored blob a bot seat
     does not have. Without this every bot kept bleeding the ghost of its first fallen prey and never collected. ONLY where `joined.srv` says there is no
     server: a seat whose published pool is 0 is out (and comes back if its pool does -- a host un-oust, a slip of the hand); when it was MY prey I collect,
     once per seat, and a real `bounty` that does arrive later for the same name is not counted twice. Online the roster and the bounty verb stay the only authority. */
  _noServerOust(seat, pub){
    const pl = (this.players || [])[seat - 1]; if(!pl || typeof pub.pool !== 'number') return;
    if(pub.pool <= 0 && !pl.out){
      const wasMyPrey = !this.out && this.preySeat() === seat;
      pl.out = true; pl._outInferred = true;
      this._emit('oust-inferred', { seat, name: pl.name, myPrey: wasMyPrey });
      if(this._ask && this._ask.target === seat) this._answer('no', null);
      if(wasMyPrey){ this._bountyFrom = this._bountyFrom || new Set();
        if(!this._bountyFrom.has(pl.name)){ this._bountyFrom.add(pl.name); this.pool += 6; this.push();
          this.note('Trainbot collects the bounty from ' + pl.name + ': +6 pool (' + this.pool + ') and 1 VP. The Jyhad provides.'); } }
    } else if(pub.pool > 0 && pl.out && pl._outInferred){ pl.out = false; pl._outInferred = false; this._emit('oust-inferred', { seat, name: pl.name, undone: true }); }
  }
  _oust(byHost){
    this._emit('ousted', { byHost: !!byHost, pool: this.pool });
    this._clearPending('ousted'); this._clearCombatStashes();
    /* v0.6.112 (R4 self-review): revoke the open-hand grant on oust. An ousted bot
       has no hand and will push no further board updates, so the receiver would sit
       on a stale empty card list forever. The _clearPending above already killed _pq
       and _obs; this closes the visual half. */
    if(this._debugHand || this._openHandActive){ this.send({ t:'openHand', to:'all', revoke: true }); this._debugHand = false; this._openHandActive = null; this._openHandSig = null; }
    this.edge = false;                                 // rulebook: the Edge leaves play with its ousted holder
    this.out = true; this.pool = Math.min(this.pool, 0);
    this.board = []; this.unc = []; this.pool = 0;
    this.note('Trainbot is ousted' + (byHost ? ' by the host' : '') + '. The shadows reclaim their own. 🦇');   // the line first (as always: the table reads WHY, then the server's bounty line), then the verb, then the board
    if(!byHost) this.send({ t: 'bounty' });        // server routes +6/+1 VP to my predator. v0.6.151 (main's B2, measured: 9 oust reads + 3 bounties taken by the no-server net THROUGH a bridge that relays bounty): sent BEFORE the pool-0 board, because my queue drains in order -- the relay's `bounty` > `roster` now reach the predator ahead of the board, the seat is already `out` when the pub lands and the net stays asleep. Behind a bridge that drops the verb (client <= v2.6.121) nothing arrives first and the net still reads the board.
    this.push();
  }

  /* ---------- the turn engine ---------- */
  /* v0.4.6 (Johan, source-verified against vekn.net): "A vampire in torpor is
     still considered controlled but is not ready. They still unlock at the
     start of the unlock phase." A torpid vampire staying LOCKED forever (the
     bot never touched anything outside zone==='ready') was cosmetically and
     mechanically wrong -- some cards read a torpid minion's lock state, and
     the client renders a stale lock glyph on it either way. Unlocking never
     MOVES it to ready (that needs a real rescue effect); it only clears the
     flag, exactly like a ready vampire.                                    */
  async _unlockPhase(){
    let n = 0;
    this.board.forEach(c => {
      const skip = c._skipNextUnlock; if(skip) c._skipNextUnlock = false;   // VC: Lubomira's marker clears at THIS unlock phase whether or not she is locked (one phase, exactly)
      if((c.zone === 'ready' || c.zone === 'torpor') && c.locked){
        if(skip){ this.note(c.name + ' does not unlock as normal (her printed text).'); return; }
        c.locked = false; n++; } });
    /* v0.6.109 (#4, Johan: "run the unlock first, before the other unlock-phase
       effects"): the unlock ALREADY ran first — it is the loop directly above,
       ahead of the announce and of _applyPhaseIncome. What Johan saw was PUSH
       ordering, not logic ordering: nothing synced until the income pushed, so
       "Gained 1 pool from the Edge" and "Vessel: 1 blood → pool" landed on the
       felt BEFORE the cards visibly turned upright. Syncing the unlock on its
       own, here, puts the phase back in the order the phase actually has. */
    if(n) this.push();
    await this._announcePhase('Unlock');
    if(this.edge){                       // v0.5 (Johan, 13 July + correction 14 July): PASSIVE, not an exchange -- still holding the Edge at your own unlock phase (i.e. held it a full round) just ALSO gives +1 pool from the blood bank; the Edge itself is untouched (stays held -- burning it is a SEPARATE active choice, e.g. Leverage's bleed-boost or burning it for +1 Vote as a base action). Bots ALWAYS take the passive bonus (no reason to ever decline free pool); a human still has to remember it themselves.
      this.pool++;
      this.send({ t: 'log', html: 'Gained <b>1 pool</b> from the Edge.' });   // exact client wording (the human Edge-helper's own line) for parity
    }
    this._perfUsed = new Set();          // fas C: Perfectionist's once-each-turn gate resets at MY turn start
    this._rebelUsedThisTurn = false;     // N4a: Rebel's once-each-turn gate, same reset site
    this._huntingGroundUsedThisTurn = false;   // v0.6.41: "only one hunting ground each turn" -- same reset-at-turn-start shape as _perfUsed just above
    this._applyPhaseIncome('unlock');    // Vessel-class recurring triggers tagged phase:'unlock' in cardfx
    this._emitSnapshot('unlock');        // A2: the turn-boundary view, BEFORE the menace engine mutates it
    this._strategize('unlock');          // v0.6.119 (the strategy layer): the turn's plan, from the same boundary view
    this._menaceUnlockEngine();          // N3: Creeping line + Jack tick/pay + Fame drain (own-unlock settle)
    this._maybeGiveLock();               // v0.6.128: Anarch Troublemaker-class, 'during your unlock phase'
    this._maybeWarsawRescue();           // N4a: the Station's burn-rescue, checked at my unlock
    this._rolloverPredPressure();        // v1.1: last round's felt pressure becomes this turn's backrush input
    await this._considerLockIncome('unlock');   // v0.6.31: Dreams of the Sphinx's pool-gain-if-Edge choice (lock-gated, not automatic -- distinct from the line above)
    await this._considerHuntingGround('unlock');   // v0.6.41: the hunting-ground family's own stated phase -- "during your unlock phase"
    this.push();
    return n;
  }
  async _playTurn(){
    this._acting = true;
    this._watchdogArm();                   // v0.6.108: heartbeat during the bot's own turn — detects hangs, reassures humans
    const pace = () => this._pace();       // v0.4.5: routes through the gate (waits only the REMAINING time since the last action) instead of a blind full-length sleep every call
    try{
      this.ownTurns++;
      await pace();
      /* v0.6.117: the '— Trainbot, turn N —' banner is gone -- the client prints its own TURN N header, and the bot's private count beside it (turn 1 under TURN 2) read as a contradiction. `ownTurns` still counts (emits, tempo). */
      this.phaseUsed = { master: 0, influence: 0, discard: 0 };     // v0.5+ (Johan, 14 July): fresh every one of MY OWN turns, mirroring the client's own per-turn phaseUsed reset
      this.phaseBonus = { master: 0, influence: 0, discard: 0 };    // TEMPORARY bonuses (Trifle, a future Parthenon-class card) never carry over
      this._trifleBonusUsed = false;                                // Trifle's OWN cap (max +1/turn, independent of any other bonus source)
      this._recomputePhaseActs();                                   // refresh the PERMANENT baseline from whatever's in play right now
      this._recomputeHandSizeBaseline();                            // v0.6.33: same "refresh from what's in play" spirit, for permanent handSize sources (Elder Library etc.) that may have entered play since last checked
      await this._checkAshurTableWide();                            // v1.4.3: catch a human's (or another bot's) Ashur Tablets threshold crossed since my last turn -- my own copies get swept as collateral, no benefit, before anything else this turn happens

      /* UNLOCK */
      await this._unlockPhase();

      /* MASTER — v0.5+ (Johan, 14 July): the rule is now "always play A
         master if we hold one" — the phase-action ECONOMY (base + temporary
         bonus − used) is generic across Master/Influence/Discard (see
         _phaseAvail); Trifle grants its OWN capped +1 bonus this turn
         (rulebook), independent of any bespoke `actGrant` source (e.g.
         Parthenon) which just adds to the SAME phaseBonus.master pool from
         a different origin. A KNOWN card (curated `phase`-tagged income fx)
         attaches to a vampire exactly as before. v1.4.0 follow-up (14 July):
         a PERSISTENT card (known or not) is placed on the board as before;
         a NON-persistent one (Effective Management: no location/put-in-play
         text) now resolves and goes straight to the PUBLIC ash heap instead
         — the earlier code parked EVERY played master on the board forever,
         which was only ever correct for persistent ones (see
         cardfx-persistent-lock-design-decisions.md for the full story).    */
      await this._announcePhase('Master');
      await this._considerTurnActGrants('master');   // v1.4.0: lock any eligible actGrant{persist:'turn'} card (Parthenon) BEFORE the loop below, so a granted bonus action is visible to the very first _phaseAvail check
      await this._considerLockIncome('master');   // v0.6.31: Dreams of the Sphinx's blood-add-to-uncontrolled choice (this bot's own sensible-timing pick, not a rules-mandated phase -- the card itself states no restriction)
      await this._considerLockRescue('master');   // v0.6.39: Chantry's own stated phase -- "during your master phase"
      await this._considerHandCycle('master');   // v0.6.42: The Barrens -- not phase-restricted by the card itself, master is this bot's own sensible-timing pick
      {
        const played = new Set();
        while(this._phaseAvail('master') > 0 && !this.out){
          const cands = this._bestMasterFor(played);
          if(!cands.length) break;
          const d = this.decide('master-play', { cands });
          if(!d.pick) break;
          const host = (d.pick.known || d.pick.archetype) ? this._hostVampFor(d.pick.archetype) : null;   // fas C: archetype masters (Perfectionist) attach too -- and the archetype-aware picker enforces one-per-vampire
          if((d.pick.known || d.pick.archetype) && !host) break;     // a known income asset (or an archetype with no eligible vampire) needs a host — hold the card rather than misplay it
          this.o.log('master-play: ' + d.why);
          await pace();
          const j = this.hand.indexOf(d.pick.name);      // re-anchor by NAME after the pace() await (v0.4.2's bounce lesson: idx computed before a pause may no longer hold)
          if(j < 0 || d.pick.cost > this.pool){ played.add(FX_NORM(d.pick.name)); continue; }   // shifted under us — exclude and let the loop try the next candidate (guaranteed to terminate: played only grows)
          const _lk = this.fxLookup(d.pick.name);
          const _lockM = !!(_lk && _lk.kind === 'lib' && (_lk.e.modes || []).some(mo => mo.fx && mo.fx.lockMinion));   // fx.lockMinion -- literal read, the coverage scanner tracks fx.<key> (the R3 lesson, second time)
          let _lockT = null;
          if(_lockM){
            _lockT = this._bestNeutralizeTarget(this.preySeat(), { needUnlocked: true });   // M1: unlocked REQUIRED for Misdirection
            if(!_lockT){ played.add(FX_NORM(d.pick.name)); continue; }                      // HOLD the card -- pre-splice: nothing paid, nothing lost
          }
          const _fmM = !!(_lk && _lk.kind === 'lib' && (_lk.e.modes || []).some(mo => mo.fx && mo.fx.fameOnTarget));   // N3: fx.fameOnTarget -- literal read
          let _fmT = null;
          if(_fmM){
            if(this._uniqueInPlay(d.pick.name)){ played.add(FX_NORM(d.pick.name)); continue; }
            _fmT = this._bestNeutralizeTarget(this.preySeat(), {});   // the rush doctrine: Fame the vampire you intend to rush -- the value pick
            if(!_fmT){ played.add(FX_NORM(d.pick.name)); continue; }
          }
          const _sjM = !!(_lk && _lk.kind === 'lib' && (_lk.e.modes || []).some(mo => mo.fx && mo.fx.jackEngine));   // N3: fx.jackEngine -- literal read
          if(_sjM && this._uniqueInPlay(d.pick.name)){ played.add(FX_NORM(d.pick.name)); continue; }
          const _nbM = !!(_lk && _lk.kind === 'lib' && (_lk.e.modes || []).some(mo => mo.fx && mo.fx.noBlockMinion));   // fx.noBlockMinion -- literal read for the coverage scanner
          let _nbT = null;
          if(_nbM){
            if(this._uniqueInPlay(d.pick.name)){ played.add(FX_NORM(d.pick.name)); continue; }   // M2: Unique -- never play into a visible copy
            _nbT = this._bestNeutralizeTarget(this.preySeat(), {});                              // M2: persistent effect -- unlocked is only the tiebreak
            if(!_nbT){ played.add(FX_NORM(d.pick.name)); continue; }                             // HOLD pre-splice
          }
          this.hand.splice(j, 1); this._drawOwed = (this._drawOwed || 0) + 1;
          this.pool -= d.pick.cost;
          /* v0.6.109 (#5, Johan: "the bot doesn't seem to pay Vessel's cost"):
             it always did — this line, since v0.5 — and the cardfx entry has
             carried cost.pool 1 all along. What was missing is that NOBODY AT
             THE TABLE COULD SEE IT: the play line says "plays Vessel on X."
             and nothing else, and because Vessel is a trifle the bonus action
             usually buys a second master whose own income can hand the pool
             straight back inside the same phase — a visible net of zero. An
             additive STATUS line (never a change to the frozen play line, so
             no peer's parser moves) makes the payment auditable. */
          if(d.pick.cost) this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> pays <b>' + d.pick.cost + ' pool</b> for <b>' + esc(d.pick.name) + '</b> (pool ' + this.pool + ').' });
          if(_lockM && _lockT){
            /* M1 (25 July): Misdirection -- 'Lock a minion.' One-shot targeted lock,
               resolves straight to ash. Target per Johan's frozen heuristic. The
               TARGET side (bot) complies via L12.lockM; a human target uses the
               table/ctrl path (the human-backup constant). */
            this._toAsh(d.pick.name);
            this.fxClone({ name: d.pick.name, kind: 'lib' }, 'locks ' + _lockT.name);
            this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> plays <b>Misdirection</b> \u2014 locks <b>' + esc(this.seatName(_lockT.seat)) + "</b>'s <b>" + esc(_lockT.name) + '</b>.' });
            this.note('Trainbot: Misdirection \u2014 ' + _lockT.name + ' locks. Clearing the lane.');
            this.push();
            played.add(FX_NORM(d.pick.name));
            this.phaseUsed.master++;
            if(d.pick.trifle) this._grantTrifleBonus();
            continue;
          }
          if(_fmM && _fmT){
            /* N3: Fame -- tabled on MY board (the M2 placement); the frozen line
               names owner+vampire so EVERY observer can track it. */
            this.board.push({ id: this.gid(), name: d.pick.name, kind: 'lib', zone: 'ready',
                              faceDown: false, x: 64, y: 64, locked: false });
            this.fxClone({ name: d.pick.name, kind: 'lib' }, 'on ' + _fmT.name);
            this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> plays <b>Fame</b> \u2014 on <b>' + esc(this.seatName(_fmT.seat)) + "</b>'s <b>" + esc(_fmT.name) + '</b>.' });
            this.note('Trainbot: Fame on ' + _fmT.name + ' \u2014 torpor will cost them.');
            this._famedSeen = this._famedSeen || {};
            this._famedSeen[_fmT.name] = { owner: this.seatName(_fmT.seat), by: this.o.name };
            this.push();
            played.add(FX_NORM(d.pick.name));
            this.phaseUsed.master++;
            if(d.pick.trifle) this._grantTrifleBonus();
            continue;
          }
          if(_sjM){
            /* N3: Smiling Jack -- tabled unique; the engine ticks at my unlock,
               victims self-serve from the pub counters. */
            this.board.push({ id: this.gid(), name: d.pick.name, kind: 'lib', zone: 'ready',
                              faceDown: false, x: 64, y: 64, locked: false, counters: [] });
            this.fxClone({ name: d.pick.name, kind: 'lib' }, 'in play');
            this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> plays <b>Smiling Jack, The Anarch</b>.' });
            this.note('Trainbot: Smiling Jack is in play \u2014 the meter starts at my unlock.');
            this.push();
            played.add(FX_NORM(d.pick.name));
            this.phaseUsed.master++;
            if(d.pick.trifle) this._grantTrifleBonus();
            continue;
          }
          if(_nbM && _nbT){
            /* M2 (25 July): Pentex(TM) Subversion -- tabled persistent on MY board
               (TABLED-ONLY placement); the frozen line names the target vampire. The
               TARGET side complies via L12.pentexM; a human target uses the
               table/ctrl path (the human-backup constant). Burn is table-handled. */
            this.board.push({ id: this.gid(), name: d.pick.name, kind: 'lib', zone: 'ready',
                              faceDown: false, x: 64, y: 64, locked: false });
            this.fxClone({ name: d.pick.name, kind: 'lib' }, 'on ' + _nbT.name);
            this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> plays <b>' + esc(d.pick.name) + '</b> \u2014 on <b>' + esc(this.seatName(_nbT.seat)) + "</b>'s <b>" + esc(_nbT.name) + '</b>.' });
            this.note('Trainbot: ' + d.pick.name + ' \u2014 ' + _nbT.name + ' cannot block.');
            this.push();
            played.add(FX_NORM(d.pick.name));
            this.phaseUsed.master++;
            if(d.pick.trifle) this._grantTrifleBonus();
            continue;
          }
          if(d.pick.persistent){
            const card = { id: 'm' + (this._mSeq = (this._mSeq || 0) + 1), name: d.pick.name, kind: 'lib', zone: 'ready',
                           host: host ? host.id : undefined, faceDown: false, locked: false, blood: 0,
                           x: host ? host.x : (100 + (this.board.length * 20) % 800), y: host ? host.y : 40 };
            this.board.push(card);
            { const _ec = this.fxLookup(d.pick.name); const _n = _ec && _ec.kind === 'lib' ? (_ec.e.enterCounters | 0) : 0;   // v0.6.125: "put this card in play with N counters" (Visit from the Capuchin). When the counters ARE hand size, draw up to the new size at once and exempt the card's own pending replacement.
              if(_n > 0){ card.counters = _n;
                if((_ec.e.modes || []).some(mo => mo.fx && mo.fx.handSizePerCounter)){ for(let _i = 0; _i < _n; _i++) this.send({ t: 'draw' }); this._handSizePermanentPrev = this._handSizePermanentTotal(); this._replaceExempt = (this._replaceExempt | 0) + 1;
                  this._emit('hand-size-up', { card: d.pick.name, by: _n }); } } }
            if(host){ host.attached = host.attached || []; host.attached.push(card.id); }
            this.fxClone({ name: d.pick.name, kind: 'lib' }, 'is put in play');
          } else {
            this._toAsh(d.pick.name);          // v1.4.0: resolves immediately, never sat on the board to begin with (Effective Management's motivating case)
            this.fxClone({ name: d.pick.name, kind: 'lib' }, 'resolves');
          }
          this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> plays <b>' + esc(d.pick.name) + '</b>' + (host ? ' on <b>' + esc(host.name) + '</b>' : '') + '.' });
          if(!d.pick.curated) this.note('Trainbot: ' + d.pick.name + (host ? ' on ' + host.name : '') + ' (uncurated \u2014 adjust if needed).');   // v0.6.117 (Johan's noise round): the play line + fx clone (+ the ledger online) already say the card was played -- the note survives ONLY as the uncurated warning
          this.push();
          if(d.pick.handler && CARD_HANDLERS[d.pick.handler]) await CARD_HANDLERS[d.pick.handler](this);   // v1.4.1: the bespoke effect itself, AFTER the card's own placement/ash is logged+synced
          played.add(FX_NORM(d.pick.name));
          this.phaseUsed.master++;
          if(d.pick.trifle) this._grantTrifleBonus();
        }
      }
      this._flushDraws();
      this._applyPhaseIncome('master');   // Blood-Doll-class recurring triggers on permanents ALREADY in play (from a previous turn)

      /* MINION — every ready, unlocked vampire acts once. Mandatory hunt at
         0 blood (rulebook, vekn.net: "vampires with no blood are forced to
         hunt, and this action must be announced and resolved before any
         other actions may be taken that turn") is enforced by ORDER: any
         0-blood vampire is moved to the FRONT of the acting list, so its
         hunt always resolves before any other vampire's bleed this phase.
         v0.3: the bleed action is CHOSEN (plain bleed vs a bleed-action card
         from hand — decide() seam), the announce rides the §12 frozen line
         at the chosen amount, and a 'Block!' can be met with a stealth card
         (insight-weighted) before the ask resolves. Played cards are drawn
         back after resolution.                                            */
      await this._announcePhase('Minion');
      await this._settleOusts(this._settleMs());   // v0.6.103 (#2): a creep/Jack oust at my own unlock may not have reached the roster yet
      this._strategize('minion');          // v0.6.119: re-read after the master phase (pool, hand and the board may have moved)
      let prey = this.decide('bleed-target', {}).seat;
      const actors = this.board.filter(c => c.zone === 'ready' && c.kind === 'crypt' && !c.locked)
                                .sort((a, b) => (((a.blood | 0) === 0 ? 0 : 1) - ((b.blood | 0) === 0 ? 0 : 1)) || (this._blockerWorth(a) - this._blockerWorth(b)));   // v0.5: 0-blood vampires FIRST — the mandatory-hunt precondition; v0.6.118b: then the WORST blockers first, so the body that stays home (last) is the one worth keeping
      /* v0.6.143 PROBE THEN PUNCH (Johan): with a heavy bleed in hand, under two stealth cards and a prey body up, the SMALL bleeders go first -- the threat of a modifier draws the block (or a wake, or an intercept card),
         and the heavy bleed goes last into what is left. Only for a stealth-bleed deck, and only when the plan keeps nobody home (the order otherwise decides WHO stays: v0.6.118b). The chump bleeder with combat cover goes first of all. */
      if(this.o.stealthStack !== 0 && this._stealthAxis() && !((this.plan && this.plan.home) | 0) && actors.length >= 2 && this._preyUnlockedN() > 0){
        const vals = new Map(actors.map(a => [a.id, ((this._actValue(a) || {}).n) || 0])); const heavy = Math.max(...vals.values());
        const maxS = Math.max(...actors.map(a => this._stealthStack(a, new Set()).S));
        const preyInt = this._pCat(this.preySeat(), 'intercept');
        if(heavy >= 2 && (maxS === 0 || (maxS === 1 && preyInt >= 0.5))){   // v0.6.143d (Johan, 20 Sep): the bleed of 1 is RESERVED for making the best conditions for a stronger action when I hold NO stealth -- perhaps with one card when worried (an intercept-heavy prey); otherwise it is better to roll more cards and draw into more +bleed for later
          actors.sort((a, b) => (((a.blood | 0) === 0 ? 0 : 1) - ((b.blood | 0) === 0 ? 0 : 1)) || (vals.get(a.id) - vals.get(b.id)) || ((this._combatCover(b) ? 1 : 0) - (this._combatCover(a) ? 1 : 0)));
          /* the PUNCHER goes last: the body with the biggest stealth stack among those who can land the heavy bleed. Everyone before it keeps its hands off the heavy card (see _decideAction) -- otherwise the first actor simply plays the Govern and there is no probe. */
          const heavyOnes = actors.filter(a => vals.get(a.id) === heavy && (a.blood | 0) > 0); const puncher = heavyOnes.sort((a, b) => this._stealthStack(b, new Set()).S - this._stealthStack(a, new Set()).S)[0];
          if(puncher && actors.length >= 2){ const ix = actors.indexOf(puncher); actors.splice(ix, 1); actors.push(puncher); this._probe = { puncherId: puncher.id, heavy }; }
          this._emit('probe-order', { order: actors.map(a => ({ vamp: a.name, n: vals.get(a.id), cover: this._combatCover(a) })), puncher: puncher ? puncher.name : null, heavy, stealth: maxS, preyUp: this._preyUnlockedN() });
        }
      }
      this.board.filter(c => c.kind === 'crypt' && c.zone === 'torpor' && !c.locked && (c.blood | 0) >= 2).forEach(c => actors.unshift(c));   // v0.6.128: a torpored vampire with 2 blood walks out on its OWN action, before any ready body considers rescuing it
      this._actorQueue = actors;   // v0.6.64 (B-fix): the LIVE queue -- Warsaw's refresh pushes the actor back on and the index loop revisits it
      this._turnAttempts = 0; this._probe = null;   // v0.6.143: block attempts my prey has made against me THIS turn; the probe order's reservation
      this._actAgainUsed = new Set(); this._actAgainN = {}; this._lastAct = null; this._turnActs = {};   // v0.6.123: per minion phase; v0.6.129: + the per-minion ledger of what was already done this turn
      for(let _ai = 0; ; _ai++){   // v0.6.64: index form over the LIVE queue (a for..of snapshot made the refreshed vampire's extra action an illusion). v0.6.126: the act-again look is ONE visible step at the top of every pass -- including the pass AFTER the last actor, which is why the exit test sits below it (it was hidden in the for-condition as _actAgainTail)
        if(this.out) break;
        if(_ai > 0) this._maybeActAgain(actors[_ai - 1], actors, _ai - 1);   // v0.6.123: Freak Drive-class, after the previous actor's action is fully over (combat included); may push the vampire back on the queue
        if(_ai >= actors.length) break;
        const v = actors[_ai];
        this._lastAct = null;
        await pace();
        if(_ai > 0) prey = this.decide('bleed-target', {}).seat;   // v0.6.103 (#2): PER ACTOR -- the previous minion may have ousted the prey (v0.6.102 read it once and bled a ghost for the rest of the phase); v0.6.104: read AFTER the pace beat so a human table's pace is also the roster's window
        if(v.zone === 'torpor'){ await this._leaveTorpor(v); continue; }   // v0.6.128
        const mandatory = (v.blood | 0) === 0;
        const keep = this._keepBlocker(v, actors, _ai);   // v0.6.118 (B2 posture, doctrine 2.4): the last unlocked body stays home against a bleeder within reach
        if(keep){ this.o.log('posture: ' + keep.why); this._emit('keep-blocker', { vamp: v.name, tto: keep.tto, quota: keep.quota || 0 }); continue; }
        const hd = mandatory ? { hunt: true, why: 'mandatory: 0 blood (rulebook)' } : this.decide('hunt-or-bleed', { vamp: v });
        if(hd.hunt){
          this.o.log('action (' + v.name + '): ' + hd.why);
          v.locked = true; this._actingVamp = { v, n: 1, played: new Set() };   // v0.5+ (Johan, 14 July): "every action treated fundamentally the same" -- hunt gets the SAME reactive-stealth mechanism as bleed now, just with its own (fixed, low) stakes value for the persona weighting below
          this.push();
          this.fxClone(v, 'hunts');
          this._announceTallyA(this._undirectedBaseStealth(v, 'hunt'));   // VC: hunt NEVER wrote a tally before -- the defender's decide read the PREVIOUS action's stale a. Rulebook default +1 (the Wauneka example), Zoe's exception via the helper.
          this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> hunts.' });
          const ans = await this._askBlock('Trainbot: ' + v.name + ' hunts. Block?');
          await sleep(150);
          if(ans.what === 'block'){
            this.note('Blocked' + (ans.who ? ' by ' + ans.who : '') + '. Combat begins.');
            this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: 0, card: null, by: this._lastBlockerName || null });
            await this._resolveCombat(v);   // v0.6.22: multi-round wrapper (was the single-round primitive directly)
          } else {
            const cap = this.fxCryptCap(v.name);
            v.blood = Math.min(typeof cap === 'number' ? cap : 99, (v.blood | 0) + 1);   // rulebook: hunt gains 1 blood, capped at capacity
            this._maybeWarsawRefresh(v);   // N4a: hunt is undirected
            this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: 0, card: 'hunt' });
            this.say('It resolves');
            this.note(v.name + ' hunts successfully \u2014 +1 blood (' + v.blood + ').');
            this.push();
          }
          this._actingVamp = null;
          this._flushDraws();
          continue;
        }
        const choice = this._decideAction(v, { plain: { n: 1 + this._cryptBleedBonus(v) }, card: this._bestBleedCardFor(v), pd: this._bestPoolDmgActionFor(v), pol: this._bestPoliticalFor(v), stock: this._bestBloodStockFor(v), peek: this._bestPeekFor(v), equip: this._bestEquipActionFor(v), fetch: this._bestFetchFor(v), rush: this._bestRushFor(v), creep: this._bestCreepFor(), strength: this._bestStrengthFor(v), recruit: this._bestRecruitFor(v), enemyRescue: this._bestEnemyRescueFor(v), ownRescue: this._bestOwnRescueFor(v), readyCrypt: this.board.filter(c => c.kind === 'crypt' && c.zone === 'ready').length, edge: this.edge });   // fas B: edge in the ctx -- the arena traces need it to distinguish 'Dirt unfound' from 'Edge not held' (in 2-player the opponent's intervening bleed usually reclaims it, so Dirt windows are rare and PRECIOUS)   // VA: plain bleed carries the Lenny-class crypt bonus from birth
        const act = choice.pick; this.o.log('action (' + v.name + '): ' + choice.why);
        if(!act){ this._emit('stays-home', { vamp: v.name, why: 'no legal action left this turn' }); continue; }   // v0.6.129: everything it could do, it has already done this turn
        this._noteTurnAct(v, act);
        if(act.name && typeof act.idx === 'number'){ this.hand.splice(act.idx, 1); this._drawOwed = (this._drawOwed || 0) + 1; }   // v0.6.127: a card-less pick that carries a `name` (enemyRescue names the rescued vampire) has no idx -- splice(undefined, 1) silently ate hand[0] and drew a replacement
        v.locked = true; this._actingVamp = { v, n: act.n, played: new Set(), target: prey, edgeLocked: false, limitedUsed: false };   // per-ACTION modifier ledger (same-name once per action); `target` (steg 2, 15 July): the seat currently being bled, tracked because a bounce can move it mid-action -- see _onLog's L12.bleed handler; `edgeLocked`/`limitedUsed` (steg 4, 16 July): see _playBleedModifier
        if(act.kind === 'stock'){
          /* v0.6.14: the blood-stock action (superior Govern-class). Mirrors the pool
             branch's announce/handshake shape exactly: undirected, so the sandbox's
             open "Block?" question IS the block-rights model (predator and prey may
             both answer -- the table sorts it out, same as every other verdict).
             tally a = the action's built-in stealth (actStealth, Night Moves booking).
             No Edge on success (not a bleed), no Marked Path window (not directed).
             The effect is bot-LOCAL board state: unc blood + push(), the exact channel
             influence itself uses -- no new wire verb. The chat deliberately does NOT
             name the target: uncontrolled cards are face-down to the table.          */
          this._actingVamp.kind = 'stock';
          if(act.cost && act.cost.blood) { v.blood = Math.max(0, (v.blood | 0) - act.cost.blood); this._park(act.cost.blood, 0); }   // v0.6.14: the card's blood cost, paid by the acting vampire at announce (Govern: 1) -- the same Math.max floor the bounce payment uses
          this.push();
          this.fxClone({ name: act.name, kind: 'lib' }, 'stocks ' + act.n + ' blood', { actor: v });
          this._announceTallyA((act.st | 0));
          this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> plays <b>' + esc(act.name) + '</b> \u2014 ' + act.n + ' blood onto an uncontrolled vampire.' });
          const qs = 'Trainbot: ' + v.name + ' plays ' + act.name + (act.st ? ' (+' + act.st + ' stealth)' : '') + ' \u2014 ' + act.n + ' blood onto an uncontrolled vampire. Block?';
          const ansS = await this._askBlock(qs);
          await sleep(150);
          if(ansS.what === 'block'){
            this.note('Blocked' + (ansS.who ? ' by ' + ansS.who : '') + '. Combat begins.');
            this._toAsh(act.name);
            this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: act.n, by: this._lastBlockerName || ansS.who || null });
            await this._resolveCombat(v);   // v0.6.22: multi-round wrapper (was the single-round primitive directly)
          } else {
            this._toAsh(act.name);
            act.target.blood = (act.target.blood | 0) + act.n;
            this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: act.n, card: act.name, kind: 'stock' });
            this.say('It resolves');
            this._maybeWarsawRefresh(v);   // N4a: stock is undirected
            this.note('Trainbot: ' + act.n + ' blood banked onto an uncontrolled vampire \u2014 the next rise comes cheaper.');
            this.push();
            this._maybePerfectionist(v);
          }
          this._actingVamp = null;
          this._flushDraws();
          continue;
        }
        if(act.kind === 'ownRescue'){
          /* v0.6.127: the UNDIRECTED rescue of my own vampire. The announce is the CLIENT's frozen action-menu
             line, so a human table reads it as its own and every bot opens the prey / predator window on it
             (L12.uRescue). Cost on SUCCESS (the enemyRescue precedent); blocked = combat, nothing paid. */
          this._actingVamp.kind = 'ownRescue'; this._actingVamp.target = null;
          this.push();
          this.fxClone(v, 'rescues ' + act.who);
          this._announceTallyA(1);   // v0.6.129 (Johan + rulebook): +1 stealth when rescuer and rescued share a controller; 0 only for another Methuselah's vampire (the enemyRescue branch)
          this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> attempts to rescue a vampire from torpor.' });
          const ansO = await this._askBlock('Trainbot: ' + v.name + ' rescues ' + act.who + ' from torpor (+1 stealth). Block?');
          await sleep(150);
          if(ansO.what === 'block'){
            this.note('Blocked' + (ansO.who ? ' by ' + ansO.who : '') + '. Combat begins.');
            this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: 0, kind: 'ownRescue', by: this._lastBlockerName || null });
            await this._resolveCombat(v);
          } else {
            const T = act.target;
            this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: 0, kind: 'ownRescue', target: act.who });
            this.say('It resolves');
            if(T && T.zone === 'torpor'){
              T.blood = Math.max(0, (T.blood | 0) - act.tPays); v.blood = Math.max(0, (v.blood | 0) - act.mine);
              T.zone = 'ready'; const rp = this._openSlot('ready', T); T.x = rp.x; T.y = rp.y;
              this._emit('recover', { vamp: T.name, via: 'ownRescue', paid: act.tPays + act.mine });
              this.note(act.who + ' is rescued from torpor (' + act.who + ' pays ' + act.tPays + ', ' + v.name + ' pays ' + act.mine + ') \u2014 ready again.');
            }
            this.push();
            this._maybeWarsawRefresh(v);
          }
          this._actingVamp = null;
          this._flushDraws();
          continue;
        }
        if(act.kind === 'enemyRescue'){
          /* v2 (#7): the DIRECTED template -- rescue a FAMED enemy from torpor.
             The split is announced WITH the action (rulebook); cost paid on
             SUCCESS; the rescued neither locks nor unlocks; blocked = combat. */
          this._actingVamp.kind = 'enemyRescue';
          this._actingVamp.target = act.seat;
          this.push();
          const ownerN = this.seatName(act.seat);
          this._announceTallyA(0);
          this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> rescues <b>' + esc(ownerN) + '</b>\u2019s <b>' + esc(act.name) + '</b> from torpor (' + esc(act.name) + ' pays ' + act.tPays + ', ' + esc(v.name) + ' pays ' + act.mine + ').' });
          const ansR = await this._askBlock('Trainbot: ' + v.name + ' rescues ' + act.name + ' from torpor. Block?');
          await sleep(150);
          if(ansR.what === 'block'){
            this.note('Blocked' + (ansR.who ? ' by ' + ansR.who : '') + '. Combat begins.');
            this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: act.n, kind: 'enemyRescue', by: this._lastBlockerName || null });
            await this._resolveCombat(v);
          } else {
            this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: act.n, kind: 'enemyRescue', target: act.name, tPays: act.tPays });
            this.say('It resolves');
            if(act.mine > 0) v.blood = Math.max(0, (v.blood | 0) - act.mine);   // cost on SUCCESS; my share only -- theirs lands via the comply
            this.push();
            this.note('Trainbot: ' + act.name + ' rises \u2014 famed and ready. The yo-yo turns.');
          }
          this._actingVamp = null;
          this._flushDraws();
          continue;
        }
        if(act.kind === 'recruit'){
          /* N4d: recruit the Stray -- the STOCK/undirected template; tabled with a
             BOT-LOCAL life field (my-side consumers only, zero wire risk). */
          this._actingVamp.kind = 'recruit';
          if(act.costBlood){ v.blood = Math.max(0, (v.blood | 0) - act.costBlood); this._park(act.costBlood, 0); }   // v0.6.118c: the blood price is paid as the card is played (announce), blocked or not
          this.push();
          this.fxClone({ name: act.name, kind: 'lib' }, '[' + (act.at || '') + '] recruits (life ' + act.life + ')', { actor: v });
          this._announceTallyA(this._undirectedBaseStealth(v, 'recruit'));   // VC: recruit is an undirected BASE action at default +1 stealth (comprehensive rules) -- announced at 0 since birth
          this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> recruits <b>' + esc(act.name) + '</b> [' + esc(act.at || '') + '].' });
          const ansRc = await this._askBlock('Trainbot: ' + v.name + ' recruits ' + act.name + '. Block?');
          await sleep(150);
          if(ansRc.what === 'block'){
            this.note('Blocked' + (ansRc.who ? ' by ' + ansRc.who : '') + '. Combat begins.');
            this._toAsh(act.name);
            this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: act.n, by: this._lastBlockerName || null });
            await this._resolveCombat(v);
          } else {
            this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: act.n, card: act.name, kind: 'recruit' });
            this.say('It resolves');
            this.pool = Math.max(0, this.pool - act.costPool);
            this.board.push({ id: this.gid(), name: act.name, kind: 'lib', zone: 'ready',
                              faceDown: false, x: 64, y: 64, locked: false, life: act.life });
            this.push();
            this.note('Trainbot: ' + act.name + ' enters play (life ' + act.life + ').');
            this._maybeWarsawRefresh(v);   // N4d: recruiting is undirected -- the SIXTH site
          }
          this._actingVamp = null;
          this._flushDraws();
          continue;
        }
        if(act.kind === 'strength'){
          /* N4b: attach-to-SELF via the STOCK/undirected template -- the E1 _doEquip
             shape reused verbatim; Warsaw's refresh applies (the fifth site). */
          this._actingVamp.kind = 'strength';
          this.push();
          this.fxClone({ name: act.name, kind: 'lib' }, '[' + (act.at || '') + '] on self', { actor: v });
          this._announceTallyA((act.st | 0));
          this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> plays <b>' + esc(act.name) + '</b> [' + esc(act.at || '') + '] \u2014 on themselves (+' + act.bonus + ' strength).' });
          const ansS = await this._askBlock('Trainbot: ' + v.name + ' plays ' + act.name + ' (+' + act.st + ' stealth). Block?');
          await sleep(150);
          if(ansS.what === 'block'){
            this.note('Blocked' + (ansS.who ? ' by ' + ansS.who : '') + '. Combat begins.');
            this._toAsh(act.name);
            this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: act.n, by: this._lastBlockerName || null });
            await this._resolveCombat(v);
          } else {
            this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: act.n, card: act.name, kind: 'strength' });
            this.say('It resolves');
            this._doEquip(v, act.name, 0, act.costBlood);
            this.note('Trainbot: ' + v.name + ' now has +' + act.bonus + ' strength (base fist ' + (1 + this._strengthBonus(v)) + ').');
            this._maybeWarsawRefresh(v);   // N4b: strength-attach is undirected
          }
          this._actingVamp = null;
          this._flushDraws();
          continue;
        }
        if(act.kind === 'creep'){
          /* N3: Creeping Sabotage -- the undirected tabling template (the [AUS]/M2
             family): announce, ask, on through the card ENTERS PLAY persistent. */
          this._actingVamp.kind = 'creep';
          this.push();
          this.fxClone({ name: act.name, kind: 'lib' }, 'puts in play', { actor: v });
          this._announceTallyA((act.st | 0));
          this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> plays <b>' + esc(act.name) + '</b> \u2014 puts it in play.' });
          const ansC = await this._askBlock('Trainbot: ' + v.name + ' plays ' + act.name + (act.st ? ' (+' + act.st + ' stealth)' : '') + '. Block?');
          await sleep(150);
          if(ansC.what === 'block'){
            this.note('Blocked' + (ansC.who ? ' by ' + ansC.who : '') + '. Combat begins.');
            this._toAsh(act.name);
            this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: act.n, by: this._lastBlockerName || null });
            await this._resolveCombat(v);
          } else {
            this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: act.n, card: act.name, kind: 'creep' });
            this.say('It resolves');
            this.board.push({ id: this.gid(), name: act.name, kind: 'lib', zone: 'ready',
                              faceDown: false, x: 64, y: 64, locked: false });
            this.push();
            this.note('Trainbot: ' + act.name + ' is in play \u2014 the drip starts at my unlock.');
            this._maybeWarsawRefresh(v);   // N4a: creep is undirected
            this._maybePerfectionist(v);
          }
          this._actingVamp = null;
          this._flushDraws();
          continue;
        }
        if(act.kind === 'rush'){
          /* N2 (25 July): the FIRST RUSH -- Deep Song [ANI]. The DIRECTED template
             (the shared preamble already points target at prey); on through the
             named target locks (their side complies via L12.rush, the M1 mirror)
             and BOTH sides enter the combat handshake -- the block-combat
             two-driver model. The acting-minion reversal is table-announced,
             mechanically moot in this symmetric model. */
          this._actingVamp.kind = 'rush';
          this._actingVamp.target = act.target.seat;   // v1.1: a BACKRUSH asks the predator, not the default prey
          if(act.cost && act.cost.blood) { v.blood = Math.max(0, (v.blood | 0) - act.cost.blood); this._park(act.cost.blood, 0); }   // v0.6.116 round 2: the finder (_bestRushFor) already gated on cost.blood and carried it, but the branch never paid it -- latent (no compiled rush card costs blood today), closed for symmetry with the bleed/stock/pool branches
          this.push();
          this.fxClone({ name: act.name, kind: 'lib' }, '[ANI] rushes ' + act.target.name, { actor: v });
          this._announceTallyA(0);
          this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> plays <b>' + esc(act.name) + '</b> [ANI] \u2014 rushes <b>' + esc(act.target.owner) + "</b>'s <b>" + esc(act.target.name) + '</b>.' });
          const ansR = await this._askBlock('Trainbot: ' + v.name + ' rushes ' + act.target.name + ' (Deep Song [ANI]). Block?');
          await sleep(150);
          if(ansR.what === 'block'){
            this.note('Blocked' + (ansR.who ? ' by ' + ansR.who : '') + '. Combat begins.');
            this._toAsh(act.name);
            this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: act.n, kind: 'rush', dir: act.target.dir, by: this._lastBlockerName || null });   // v0.6.54 (A1)
            await this._resolveCombat(v);
          } else {
            this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: act.n, card: act.name, kind: 'rush', target: act.target.name, dir: act.target.dir, owner: act.target.owner, tBlood: act.target.blood, famed: !!(this._famedSeen && this._famedSeen[act.target.name]) });   // v0.6.54 (A1): the doctrine payload
            this.say('It resolves');
            this._toAsh(act.name);
            this.note('Trainbot: ' + act.target.name + ' locks and is the acting minion this combat (Deep Song). Combat begins.');
            await this._resolveCombat(v, act.target.name);   // v0.6.103 (#1): the rushed vampire IS my combat opponent
          }
          this._actingVamp = null;
          this._flushDraws();
          continue;
        }
        if(act.kind === 'equip'){
          /* E1 (25 July): the equip ACTION (undirected, the stock template). The card
             was spliced by the shared preamble -- on through it enters play on the
             bearer via _doEquip; on blocked it ashes (the Inside Dirt convention:
             committed at announce; the table's call for purists). */
          this._actingVamp.kind = 'equip';
          this.push();
          const eqVerb = act.isRetainer ? 'employs' : 'equips';   // N0: retainers say it right
          this.fxClone({ name: act.name, kind: 'lib' }, eqVerb, { actor: v });
          this._announceTallyA(this._undirectedBaseStealth(v, 'equip'));   // VC: equip is an undirected BASE action at default +1 stealth (comprehensive rules) -- announced at 0 since birth
          this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> ' + eqVerb + ' <b>' + esc(act.name) + '</b>.' });
          const ansE = await this._askBlock('Trainbot: ' + v.name + ' ' + eqVerb + ' ' + act.name + '. Block?');
          await sleep(150);
          if(ansE.what === 'block'){
            this.note('Blocked' + (ansE.who ? ' by ' + ansE.who : '') + '. Combat begins.');
            this._toAsh(act.name);
            this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: act.n, by: this._lastBlockerName || null });
            await this._resolveCombat(v);
          } else {
            this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: act.n, card: act.name, kind: 'equip' });
            this.say('It resolves');
            this._maybeWarsawRefresh(v);   // N4a: equip is undirected
            this._doEquip(v, act.name, act.cost | 0, act.costBlood | 0);
            this.note('Trainbot: ' + v.name + ' now bears ' + act.name + '.');
            this._maybePerfectionist(v);
          }
          this._actingVamp = null;
          this._flushDraws();
          continue;
        }
        if(act.kind === 'fetch'){
          /* E1 (25 July): Magic of the Smith -- the bot-local fetch (the Ashur
             precedent: server piles hidden count-only, no search verb). On through:
             MotS ashes, the target materializes on the acting vampire with cost
             paid, and a _fetchDebt entry makes the later phantom draw self-correct. */
          this._actingVamp.kind = 'fetch';
          if(act.costBlood){ v.blood = Math.max(0, (v.blood | 0) - act.costBlood); this._park(act.costBlood, 0); }   // v0.6.117: the card's own blood cost, paid at announce (the bleed branch's v0.6.116 precedent)
          this.push();
          const supF = act.st >= 3;
          this.fxClone({ name: act.name, kind: 'lib' }, supF ? '[THA]' : '[tha]', { actor: v });
          this._announceTallyA((act.st | 0));
          this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> plays <b>' + esc(act.name) + '</b> ' + (supF ? '[THA]' : '[tha]') + ' \u2014 fetches <b>' + esc(act.target.name) + '</b>.' });
          const ansF = await this._askBlock('Trainbot: ' + v.name + ' plays ' + act.name + (act.st ? ' (+' + act.st + ' stealth)' : '') + ' \u2014 fetching equipment. Block?');
          await sleep(150);
          if(ansF.what === 'block'){
            this.note('Blocked' + (ansF.who ? ' by ' + ansF.who : '') + '. Combat begins.');
            this._toAsh(act.name);
            this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: act.n, by: this._lastBlockerName || null });
            await this._resolveCombat(v);
          } else {
            this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: act.n, card: act.name, kind: 'fetch', target: act.target.name });
            this.say('It resolves');
            this._maybeWarsawRefresh(v);   // v0.6.71 (#8): fetch is undirected -- site 5
            this._toAsh(act.name);
            this._doEquip(v, act.target.name, act.target.cost | 0);
            this._fetchDebt = this._fetchDebt || {};
            this._fetchDebt[act.target.name] = (this._fetchDebt[act.target.name] | 0) + 1;
            this.note('Trainbot: fetches ' + act.target.name + ' from the library and equips ' + v.name + ' (library shuffled \u2014 the fetched copy is off the top).');
            this._maybePerfectionist(v);
          }
          this._actingVamp = null;
          this._flushDraws();
          continue;
        }
        if(act.kind === 'peek'){
          /* R3 (24 July, plan section 5): Revelations, both modes. [aus] = the POOL
             template (directed at prey: blockable, Marked Path applies, NOT a bleed --
             no bounce, no Edge). [AUS] = the STOCK template (undirected: the open
             Block? model, no Marked Path); on through the card is TABLED as a
             freestanding burnable persistent, and the prey's open-hand grants feed
             handIntel (R2) automatically. Human prey compliance = courtesy chat +
             the existing client UI (the human-backup constant). */
          this._actingVamp.kind = 'peek';
          if(act.cost && act.cost.blood) { v.blood = Math.max(0, (v.blood | 0) - act.cost.blood); this._park(act.cost.blood, 0); }   // v0.6.117: Revelations' 1 blood, paid at announce
          this.push();
          this.fxClone({ name: act.name, kind: 'lib' }, act.supMode ? '[AUS]' : '[aus]', { actor: v });
          this._announceTallyA((act.st|0));
          const preyName = this.seatName(prey);
          if(act.supMode){
            this.send({ t:'log', html: '<b>' + esc(v.name) + '</b> plays Revelations [AUS] \u2014 <b>' + esc(preyName) + '</b> plays with an open hand.' });
          } else {
            this.send({ t:'log', html: '<b>' + esc(v.name) + '</b> plays Revelations [aus] \u2014 looks at <b>' + esc(preyName) + "</b>'s hand. Target: <b>" + esc(preyName) + '</b>.' });
          }
          const qk = 'Trainbot: ' + v.name + ' plays Revelations ' + (act.supMode ? '[AUS] \u2014 ' + preyName + ' plays with an open hand' : '[aus] \u2014 looks at ' + preyName + "'s hand") + (act.st ? ' (+' + act.st + ' stealth)' : '') + '. Block?';
          const ansK = await this._askBlock(qk);
          await sleep(150);
          if(ansK.what === 'block'){
            this.note('Blocked' + (ansK.who ? ' by ' + ansK.who : '') + '. Combat begins.');
            this._toAsh(act.name);
            this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: act.n, by: this._lastBlockerName || ansK.who || null });
            await this._resolveCombat(v);
          } else {
            this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: act.n, card: act.name, kind: 'peek', sup: !!act.supMode });
            this.say('It resolves');
            if(act.supMode) this._maybeWarsawRefresh(v);   // v0.6.71 (#8, review-fix): the finder's field is supMode (TRUE iff the [AUS] openHandPrey stock-shape) -- 'at' never existed, site 6 was a dead branch until the seventh review caught it
            if(act.supMode){
              this.board.push({ id: this.gid(), name: act.name, kind: 'lib', zone: 'ready',
                                faceDown: false, x: 60, y: 60, locked: false });   // burnable by any minion as a (D) action -- the table handles that; a bot-initiated burn is the v1.5 candidate
              this.push();
              this.chat('Trainbot: Revelations is in play \u2014 ' + preyName + ', please play with an open hand (hand menu \u2192 Open hand \u2192 everyone). I read the grants.');
            } else {
              this._toAsh(act.name);
              this.push();
              this.chat('Trainbot: ' + preyName + ', please reveal your hand to me (Revelations). Humans: hand menu \u2192 Reveal hand \u2192 seat ' + this.seat + '.');
              const preyIsBot = (this.players||[]).some(pl => pl && pl.seat===prey && pl.bot);   // v0.4.4 self-declared bot seats ride the roster
              const revealMs = preyIsBot ? Math.max(4000, (this.askSecs|0)*1000) : 30000;         // sanity review (25 July): a HUMAN prey needs time to find the hand menu -- 4 s was bot-tuned; the human-backup constant demands a real window
              const got = await this._awaitReveal(prey, revealMs);
              if(got && got.cards && got.cards.length){
                const pickN = this._pickForcedDiscard(got.cards);
                if(pickN){
                  this.send({ t:'logTo', toSeat: prey, html: 'Revelations: discard <b>' + esc(pickN) + '</b>.' });
                  this.chat('Trainbot: ' + preyName + ' \u2014 discard ' + pickN + ' (Revelations), then draw up.');
                }
              } else this.note("Trainbot: no reveal received \u2014 table's call; skipping the discard.");
              await this._maybeAttachMarkedPath(v, prey, this._actingVamp.played);
            }
            this._maybePerfectionist(v);
          }
          this._actingVamp = null;
          this._flushDraws();
          continue;
        }
        if(act.kind === 'political'){   // v0.6.122: the referendum caller
          await this._callReferendum(v, act);
          this._settleSelfPrice(v);   // v0.6.129: Daring the Dawn on a referendum is paid after resolution too
          this._actingVamp = null;
          this._flushDraws();
          continue;
        }
        if(act.kind === 'pool'){
          /* fas B (16 July): the Inside Dirt-class DIRECTED pool-damage action -- its
             own branch because it is NOT a bleed: no bounce exists against it
             (Deflection: "only usable by the Methuselah being bled"), no bleed
             modifiers apply after it, and a successful resolve grants NO Edge
             (only bleeds do). It IS blockable (directed, 0 stealth) and the
             existing block-answer machinery (Block! -> spend-stealth -> verdict ->
             combat) is shared unchanged: _actingVamp.n carries the stakes (3). */
          this._actingVamp.kind = 'pool';
          if(act.costEdge) this.edge = false;           // cost paid at announce, per card text ("Burn the Edge to ...") -- the same local-flip + push the Leverage path uses; pub diff carries it
          if(act.cost && act.cost.blood) { v.blood = Math.max(0, (v.blood | 0) - act.cost.blood); this._park(act.cost.blood, 0); }   // v0.6.116: blood cost at announce (latent for Inside Dirt, which costs the Edge, not blood)
          this.push();
          this.fxClone({ name: act.name, kind: 'lib' }, act.n + ' pool damage', { actor: v });
          this._announceTallyA(0);   // fresh referendum, no built-in stealth on this card
          this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> plays <b>' + esc(act.name) + '</b>' + (act.costEdge ? ': burns the Edge' : '') + ' \u2014 ' + act.n + ' pool damage to <b>' + esc(this.seatName(prey)) + '</b>.' });
          const qp = 'Trainbot: ' + v.name + ' plays ' + act.name + ' \u2014 ' + act.n + ' pool damage to ' + this.seatName(prey) + ' (not a bleed \u2014 no bounce). Block?';
          const ansP = await this._askBlock(qp);
          await sleep(150);
          if(ansP.what === 'block'){
            this.note('Blocked' + (ansP.who ? ' by ' + ansP.who : '') + '. Combat begins.');
            this._toAsh(act.name);                      // a blocked action card still resolves to the ash heap
            this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: act.n, by: this._lastBlockerName || ansP.who || null });
            await this._resolveCombat(v);   // v0.6.22: multi-round wrapper (was the single-round primitive directly)
          } else {
            this._toAsh(act.name);
            this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: act.n, card: act.name, kind: 'pool' });
            this.say('It resolves');
            this.note('Trainbot: the pool damage lands \u2014 ' + this.seatName(prey) + ', \u2212' + act.n + ' pool (adjust yours).');
            this.push();                                 // deliberately NO Edge gain here -- rulebook: only a successful BLEED grants the Edge
            await this._maybeAttachMarkedPath(v, prey, this._actingVamp.played);  // fas C: Inside Dirt is a successful DIRECTED action too -- the attach window applies
            this._maybePerfectionist(v);                 // fas C: and so does the clean-action blood hook
            await this._settleOust(prey, act.n);          // v0.6.103 (#2)
          }
          this._actingVamp = null;
          this._flushDraws();
          continue;
        }
        if(act.name && act.cost && act.cost.blood) { v.blood = Math.max(0, (v.blood | 0) - act.cost.blood); this._park(act.cost.blood, 0); }   // v0.6.116 (Johan's Tremere test): the card's blood cost, paid by the acting vampire at announce -- the stock branch (v0.6.14) and _playBleedModifier (steg 2) both did this; the bleed-ACTION branch never did, so Govern [dom] and 21 other costed bleed actions announced free. Same Math.max floor, paid BEFORE push() so the pub diff carries it.
        this.push();
        this.fxClone(act.name ? { name: act.name, kind: 'lib' } : v, 'bleeds for ' + act.n, act.name ? { actor: v } : undefined);   // the table SEES the play (clone animation)
        this._maybeBlockBar(v, act, prey);   // v0.6.127: Daring the Dawn-class -- the lethal bleed nobody's vampires may block
        this._maybeLarissaBoost(v, act);   // VB: Larissa-class +1-bleed discard, extracted for direct testability (the _revertHandSizeBonus precedent)
        this._announceTallyA((act.st | 0) + this._cryptStealthMod(v, 'bleed'));   // fas A (16 July): EVERY announce starts the block referendum FRESH -- a = the action card's built-in stealth (Night Moves-class; the contested verdict reads THIS), b = 0 (the previous action's intercept is stale by definition -- the same explicit-reset principle as combat's a:0/b:0, and it closes the cross-action tally-accumulation gap from the uncertainty review)   // VA: + the Royce-class crypt stealth mod, RAW here -- _announceTallyA floors for the wire and keeps the raw for _bumpTallyA
        this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> bleeds for ' + act.n + '.' });
        const q = act.name
          ? 'Trainbot: ' + v.name + ' plays ' + act.name + ' — bleeds ' + this.seatName(prey) + ' for ' + act.n + (act.st ? ' (+' + act.st + ' stealth)' : '') + '. Block?'
          : 'Trainbot: ' + v.name + ' bleeds ' + this.seatName(prey) + ' for ' + act.n + '. Block?';
        const ans = await this._askBlock(q);
        await sleep(150);
        if(ans.what === 'block'){
          this.note('Blocked' + (ans.who ? ' by ' + ans.who : '') + '. Combat begins.');
          if(act.name) this._toAsh(act.name);          // a blocked action card still resolves to the ash heap
          this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: act.n, by: this._lastBlockerName || ans.who || null });
          await this._resolveCombat(v);   // v0.6.22: multi-round wrapper (was the single-round primitive directly)            // M2: data-driven (strike/prevent), the acting vampire's own side (_resolveCombatRound places its own torpor slot); v0.4.5: now async (paces strike->prevent), already inside _playTurn so a direct await
        } else {
          if(act.name) this._toAsh(act.name);          // a resolved action card goes to the ash heap (public)
          this._unblockedStreak = (this._unblockedStreak | 0) + 1; this._emit('through', { vamp: v.name, n: act.n, card: act.name || null });
          /* steg 2 (15 July, cardfx-persistent-lock-design-decisions.md §13): "all
             declined" opens MY OWN modifier window (Leverage's spot) -- each play
             sends a real L12.add re-announce (a receiving bot's _onLog already
             reopens ITS OWN _reactWindow on that match, unchanged since it was
             built for the human case) and re-asks Block?, so a late reaction
             (another bounce, or a rethink) still surfaces through the SAME signal
             channels the first ask already listens on. Terminates the moment no
             usable, un-played modifier remains -- with today's single-card deck
             (Leverage) this runs at most one extra round in practice; a deck with
             several distinct modifiers would need the "does a SECOND modifier
             require an intervening reaction" nuance Johan's rule summary didn't
             resolve -- deliberately not invented here, flagged for whenever a real
             card makes it matter. */
          let curAns = ans, pumped = 0;
          while(true){
            if(this._actingVamp.bounced && this.o.lateBounce !== 0){ this.o.log('bleed-modifier: the bleed was bounced \u2014 no pump on somebody else\'s prey'); break; }   // v0.6.144
            const mod = this._bestBleedModifierFor(v, this._actingVamp.played, this._actingVamp.limitedUsed);
            if(!mod) break;
            const d = this.decide('bleed-modifier', { mod, amount: this._actingVamp.n });
            this.o.log('bleed-modifier (' + v.name + '): ' + d.why);
            if(!d.play) break;
            await pace();
            if(!this._playBleedModifier(v, mod)) break;   // card/vampire shifted under the await -- stop rather than loop forever
            pumped++;
            await sleep(150);
            curAns = await this._askBlock('Trainbot: ' + v.name + ' adds +' + mod.n + ' bleed \u2014 now ' + this._actingVamp.n + ' on ' + this.seatName(this._actingVamp.target) + '. Any reaction?', { reactionsOnly: true });   // v0.6.114 (Johan's rule): blocks were finally declined before the modifier -- this window takes REACTIONS only (reduce/bounce); a Block! is refused, not contested   // steg 5 (16 July, rulebook-verified): a modifier NEVER reopens blocks ("Detailed course of an action", C: only a target change does) -- so the prompt invites REACTIONS (Deflection/Pass), not a block. Sandbox tolerance below is deliberate: if a human insists on a late block anyway, the table is the referee (house rule, agreed take-back) -- the bot follows the rules itself but never enforces them on others.
            await sleep(150);
            if(curAns.what === 'block') break;   // a late block ends the window outright -- combat, not more offers (sandbox: the table allowed it, so honour it)
          }
          /* v0.6.144 THE BLEED TOTAL (Johan, 20 Sep: 'experienced players always ask for the bleed total after blocks are declined -- it is established custom that a bounce is played AFTER the +bleed modifiers'). When I pumped, the window after the
             last modifier WAS that moment. When I did not, nobody ever got one: the bleed resolved straight after the blocks were declined, so a defender holding its bounce for the total never got to play it. One reactions-only window on the total, in the
             frozen L12.add grammar with +0 (no protocol change: every client and bot already reopens its window on that line). */
          const tgtBot = !!((this.players || []).find(q => q.seat === this._actingVamp.target) || {}).bot;   // a BOT target holds its bounce for this window; a human target was already asked 'Any reaction?' at the announce and answers in its own time -- a second full ask on every bleed would cost a human table askSecs per bleed (the suite's live table showed it)
          const tgtName = this.seatName(this._actingVamp.target), ld = this._lastDecline; const humanWantsTotal = !!this.o.askHumansTotal && !tgtBot && ld && ld.who === tgtName && ld.phrase === 'No block' && Date.now() - ld.at < 60000;   /* knob askHumansTotal, OFF until the suite's human harness learns to answer the second question: it declines with 'No block' everywhere and then stays silent, so every bleed waited a full askSecs (suite abort at 'turn back after bot turn 4') */   // v0.6.144 (Johan: 'it should ask human players too -- it decides a lot and it is how humans play each other'): a human who said 'No block' declined the block ONLY and hears the total; one who said 'No reaction' / 'Pass' declined everything; one who said nothing is not there. Answer with No / No reaction (closes at once) or Yes (wait for me).
          if(this.o.lateBounce !== 0 && (tgtBot || humanWantsTotal) && !pumped && curAns.what !== 'block' && !this._actingVamp.bounced && (this._actingVamp.n | 0) >= 1 && this._actingVamp.target){
            this.send({ t: 'log', html: '<b>' + esc(v.name) + '</b> adds +0 bleed (= ' + this._actingVamp.n + ').' });
            this._emit('bleed-total', { vamp: v.name, n: this._actingVamp.n, pumped: 0 });
            await sleep(150);
            curAns = await this._askBlock('Trainbot: ' + v.name + ' \u2014 bleed total ' + this._actingVamp.n + ' on ' + this.seatName(this._actingVamp.target) + ', no more modifiers. Any reaction before it resolves?', { reactionsOnly: true });
            await sleep(150);
          }
          if(curAns.what === 'block'){
            this.note('Blocked' + (curAns.who ? ' by ' + curAns.who : '') + '. Combat begins.');
            this._unblockedStreak = 0; this._emit('blocked', { vamp: v.name, n: this._actingVamp.n, by: this._lastBlockerName || curAns.who || null });
            await this._resolveCombat(v);   // v0.6.22: multi-round wrapper (was the single-round primitive directly)
          } else {
            if(!this._actingVamp.edgeLocked) this.edge = true;   // rulebook: a successful bleed gives the acting Methuselah the Edge
            if(this._actingVamp.n >= 1) this._maybeLubomiraMark(v);   // VC: 'successfully bleeds' = bleed amount >= 1 (the rulebook's own definition) -- UNLESS a card played this action locks that out (Leverage, steg 4/16 July: "You cannot gain the Edge this action. If you would get the Edge, it is burned instead." -- steg 2 wrongly assumed burn-then-regrant was fine, corrected once the real card_text was available)
            this.say('It resolves');
            this.note('The bleed goes through: ' + this.seatName(this._actingVamp.target) + ', -' + this._actingVamp.n + ' pool (adjust yours).');
            this.push();
            await this._maybeAttachMarkedPath(v, this._actingVamp.target, this._actingVamp.played);   // fas C: "after a successful directed action" -- the attach window
            this._maybePerfectionist(v);                                     // fas C: the clean-action blood hook
            await this._settleOust(this._actingVamp.target, this._actingVamp.n);   // v0.6.103 (#2): if this could have ousted, wait for the roster before the next minion picks its prey
          }
        }
        this._settleSelfPrice(v);   // v0.6.127: 'after action resolution', blocked or not
        this._actingVamp = null;
        this._flushDraws();
      }

      /* INFLUENCE — rulebook transfer stagger: during the first four GAME
         turns (table-wide, not per-player), each Methuselah receives
         transfers limited to the number of game turns that have passed.
         After the 4th game turn every Methuselah receives the full amount.
         tableTurn = (ownTurns - 1) * numPlayers + seat — gives the
         sequential game-turn number this player's current turn represents.
         Transfers are FRESH each turn (= not +=) — unused transfers from
         a previous influence phase are lost, per the rulebook.
         (v0.5+: phaseActs.influence + any bonus from in-play `actGrant`
         cards, e.g. a curated Information Highway, raises the PERMANENT
         baseline via _recomputePhaseActs and this reads it generically.) */
      await this._announcePhase('Influence');
      const availInf = this._phaseAvail('influence');
      const nPlayers = Math.max(1, (this.players || []).length);
      const tableTurn = (this.ownTurns - 1) * nPlayers + this.seat;
      this.inf = (tableTurn <= 4) ? Math.min(availInf, tableTurn) : availInf;
      this.phaseUsed.influence = this.inf;
      await this._influenceLoop();

      /* DISCARD — v0.5+ (Johan, 14 July): generalized to the SAME phase-
         action economy as Master/Influence (base 1, rulebook default; a
         future card could still raise it via `actGrant`, same as the
         others) — a loop, not a single check, though nothing shipped today
         changes discard's baseline. Masters are no longer automatically
         dead (module A can now play the known income assets, and per
         Johan's "always play A master" rule, module A empties the hand of
         masters far more aggressively than before) — a master is judged by
         the SAME general "does any mode actually work" check as everything
         else. That check (_modeUsable → _modeUsableBy) was ALSO widened
         this session to treat a bounce-only mode as unusable in a 2-live-
         player table (Johan's ask) — discard gets that for free from the
         one shared place, no parallel special-case here.                  */
      await this._announcePhase('Discard');
      while(!this.out && this._phaseAvail('discard') > 0){
        const vamps = this.board.filter(c => c.zone === 'ready' && c.kind === 'crypt');
        let di = this._deadHandIndex(vamps);
        if(di < 0){ di = this._stealthGlutIndex(); if(di >= 0){ this._emit('shed', { card: this.hand[di], why: 'stealth-glut' }); this.o.log('discard: ' + this.hand[di] + ' -- more stealth in hand than one action can use'); } }   // v0.6.120: a dead card first, then the glut
        if(di < 0) break;
        await pace();                             // v0.4.5: the discard used to fire the instant influence ended
        const name = this.hand.splice(di, 1)[0];
        this._toAsh(name);
        this.push();
        this.send({ t: 'log', html: '<b>' + esc(this.o.name) + '</b> discards <b>' + esc(name) + '</b>.' });
        this.send({ t: 'draw' });
        this.phaseUsed.discard++;
      }
      this._revertHandSizeBonus();

      await pace();
      if(this.out){ this.send({ t: 'pass' }); }   // v0.6.140 THE FREEZE: a bot ousted on its OWN turn (Fame, a referendum of its own, a self-inflicted cost) never passed -- the server gives the turn only to the seat that holds it, so the table froze until the arena's 600 s timeout (serie-bal3 run 7: 451 s of silence). The server's pass handler accepts the turn seat whether or not it is out and skips ousted seats.
      if(!this.out){
        this.push();
        this.send({ t: 'log', html: '<b>Turn passed.</b>' });   // v0.5: parity with a human's own Pass button (pass() → log(), unconditional — Pass itself isn't gated behind helpers being on, unlike the five phase buttons)   // v0.6.117: the 'Trainbot passes.' note that followed it was the bot's own duplicate -- gone
        this.send({ t: 'pass' });
      }
    } finally {
      this._acting = false;
      this._watchdogKill();                // v0.6.108: turn over — no more heartbeats needed
      if(this._pendingTurn != null){       // v0.6.108 (handoff item 2): a turn arrived mid-wind-down
        this._pendingTurn = null;
        if(this.started && !this.out && this.turnSeat === this.seat)   // STALENESS GUARD: only if the turn is still mine
          setTimeout(() => { if(!this._acting) this._playTurn().catch(e => this.o.log('turn error:', e.message)); }, 0);   // out of this finally, never re-entrant
      }
    }
  }
}

/* ---------- CLI ---------- */
function parseArgs(argv){
  const o = {};
  for(let i = 0; i < argv.length; i++){
    const a = argv[i];
    const next = () => argv[++i];
    if(a === '--server') o.server = next();
    else if(a === '--room') o.room = next();
    else if(a === '--pass') o.pass = next();
    else if(a === '--name') o.name = next();
    else if(a === '--seat') o.seat = parseInt(next(), 10) || 0;
    else if(a === '--ask-secs') o.askSecs = Math.max(3, parseInt(next(), 10) || 25);
    else if(a === '--cardfx') o.cardfx = next();
    else if(a === '--persona') o.persona = next();
    else if(a === '--deck'){ const f = next(); o.deck = JSON.parse(fs.readFileSync(f, 'utf8')); }
    else if(a === '--help' || a === '-h') o.help = true;
  }
  if(o.persona == null) o.persona = 'expert';   // v0.6.150 (Johan, 21 Sep: Expert is the default): the COMMAND LINE only -- a Bot constructed with no persona keeps the bare base knobs the suite's fixtures are built on
  return o;
}

if(typeof require !== 'undefined' && require.main === module){   // v0.6.94 (HB0): typeof-guarded -- a browser has no require, and the CLI block must not even evaluate
  const o = parseArgs(process.argv.slice(2));
  if(o.help || !o.room){
    console.log('Trainbot v' + BOT_VERSION + ' — a sparring-dummy seat for Elysium (protocol 2.6)\n' +
      'usage: node elysium-bot.js --server ws://host:8123 --room NAME --pass PASS\n' +
      '       [--name Trainbot] [--seat N] [--deck playbook.json] [--ask-secs 25]\n' +
      '       [--cardfx elysium-cardfx.json]   (default: beside this script)\n' +
      '       [--persona novice|experienced|expert]\n' +
      'The room must already exist (create it as a lobby in the client, then start\n' +
      'the bot, pick seats, Start). Table chat: "help" for the bot\'s grammar.');
    process.exit(o.help ? 0 : 1);
  }
  const bot = new Bot(o);
  bot.connect().catch(e => { console.error('[bot] could not connect:', e.message); process.exit(1); });
  process.on('SIGINT',  () => { bot.close(); setTimeout(() => process.exit(0), 300); });
  process.on('SIGTERM', () => { bot.close(); setTimeout(() => process.exit(0), 300); });
}

const BOT_EXPORTS = { PERSONA_ALIAS, personaKey, Bot, wsConnect, wsFrame, parseArgs, DEFAULT_DECK, WALL_DECK, SEWER_DECK, ARCHETYPES, BOT_VERSION, WIRE_V,
                      SAY, sayIdx, FX_NORM, L12, stripTags, loadCardfx, prepCardfx, PERSONAS, CARD_HANDLERS };
if(IS_NODE && typeof module !== 'undefined' && module.exports) module.exports = BOT_EXPORTS;   // Node: the require() surface is unchanged (+ prepCardfx)
else if(typeof globalThis !== 'undefined') globalThis.ElysiumBot = BOT_EXPORTS;                // v0.6.96: browser -- ALSO when the page carries a module shim: IS_NODE, not module, discriminates (Johan's first client-page spawn-fail round)
})();                                           // v0.6.97: the lexical-armor IIFE closes
