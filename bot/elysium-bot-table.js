#!/usr/bin/env node
'use strict';
/* ============================================================================
   elysium-bot-table.js — seat a whole TABLE of Trainbots            v1.2.0
   v1.2.0 (9 Oct 2026, bot v0.6.194): --tempo standard:3|adaptive:3|turn -- the tempo every bot
   starts with until the table sends a botcfg (the client's gear in the Bot button).
   v1.1.1 (21 Sep 2026, bot v0.6.150): the experience levels -- expert,experienced,novice;
   old names still accepted (the bot's personaKey), seats are named after the canonical level.
   v1.1.0 (11 Sep 2026, A3 #12): --decks a,b,c rotates the registered
   ARCHETYPES over the seats (every live-table bot used to play DEFAULT_DECK);
   the CLI main is guarded (require.main) so the suite can test parseArgs and
   resolveDeck; parseArgs/resolveDeck exported.
   ----------------------------------------------------------------------------
   Spawns N Bot instances (in ONE process) into an existing lobby room, with
   persona rotation and staggered joins. Zero dependencies — rides the
   gate-proven Bot class in elysium-bot.js.

   usage:
     node elysium-bot-table.js --room NAME --pass PASS
          [--server ws://127.0.0.1:8123]
          [--count 3]                       how many bots to seat
          [--personas expert,experienced,novice] rotation (see PERSONAS in the bot)
          [--decks nosferatu,tremere,...]   rotation over ARCHETYPES (default:
                                            hacking, the sample deck, for all)
          [--names Alice,Bob]               optional explicit names (else the
                                            persona name, numbered on repeats)
          [--cardfx elysium-cardfx.json]    default: beside elysium-bot.js
          [--ask-secs 25] [--pace 900] [--tempo standard:3|adaptive:3|turn]

   Flow: create an ONLINE room in the Elysium client first (lobby), pick your
   own seat + deck, then run this — the bots fill free seats and upload their
   sample playbooks. Press Start when the table is full. Ctrl+C removes them.
   ========================================================================== */

const { Bot, PERSONAS, ARCHETYPES, BOT_VERSION, personaKey, parseTempoArg } = require('./elysium-bot.js');

function parseArgs(argv){
  const o = { server: 'ws://127.0.0.1:8123', count: 3, personas: 'expert,experienced,novice',
              askSecs: 25, pace: 900 };
  for(let i = 2; i < argv.length; i++){
    const a = argv[i], next = () => argv[++i];
    if(a === '--server') o.server = next();
    else if(a === '--room') o.room = next();
    else if(a === '--pass') o.pass = next();
    else if(a === '--count') o.count = Math.max(1, Math.min(4, parseInt(next(), 10) || 3));
    else if(a === '--personas') o.personas = next();
    else if(a === '--decks') o.decks = next();   // v1.1.0 (#12)
    else if(a === '--names') o.names = next();
    else if(a === '--cardfx') o.cardfx = next();
    else if(a === '--ask-secs') o.askSecs = Math.max(3, parseInt(next(), 10) || 25);
    else if(a === '--pace') o.pace = Math.max(0, parseInt(next(), 10) || 900);
    else if(a === '--tempo'){ const t = parseTempoArg && parseTempoArg(next()); if(t) o.tempo = t; }   // v1.2.0
    else if(a === '--help' || a === '-h'){ o.help = true; }
  }
  return o;
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const sleep = ms => new Promise(r => setTimeout(r, ms));
function resolveDeck(name){          // v1.1.0 (#12): a registered archetype by name, or null (the caller decides what a miss means)
  const key = String(name || '').trim().toLowerCase();
  return (key && ARCHETYPES[key]) ? { deck: ARCHETYPES[key], deckName: key } : null;
}

async function main(){
  const o = parseArgs(process.argv);
  if(o.help || !o.room || !o.pass){
    console.log('usage: node elysium-bot-table.js --room NAME --pass PASS\n' +
                '       [--server ws://127.0.0.1:8123] [--count 3]\n' +
                '       [--personas expert,experienced,novice] [--names A,B,C]\n' +
                '       [--decks nosferatu,tremere,...] (registered: ' + Object.keys(ARCHETYPES).join(', ') + ')\n' +
                '       [--cardfx path] [--ask-secs 25] [--pace 900] [--tempo standard:3|adaptive:3|turn]\n' +
                'Create the room in the Elysium client first (online lobby), then run this.');
    process.exit(o.help ? 0 : 1);
  }
  const personaList = o.personas.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const deckList = (o.decks || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);   // v1.1.0 (#12)
  for(const d of deckList) if(!resolveDeck(d)){ console.error('unknown deck "' + d + '" -- registered: ' + Object.keys(ARCHETYPES).join(', ')); process.exit(1); }
  const nameList = (o.names || '').split(',').map(s => s.trim()).filter(Boolean);
  const bots = [];
  const used = new Map();                                // name -> count (dedupe suffixes)

  console.log('elysium-bot-table v1.2.0 — Trainbot v' + BOT_VERSION +
              ' × ' + o.count + ' → ' + o.room + ' @ ' + o.server);

  for(let i = 0; i < o.count; i++){
    const asked = personaList[i % personaList.length] || 'expert', persona = (personaKey && personaKey(asked)) || asked;   // v1.1.1: canonical level (shark -> expert); an unknown string is passed on and the bot plays it as expert
    const dk = deckList.length ? resolveDeck(deckList[i % deckList.length]) : null;   // v1.1.0 (#12): rotates like personas
    if(!PERSONAS[persona]) console.log('  (unknown level "' + asked + '" — novice | experienced | expert; the bot plays it as expert)');
    let name = nameList[i] || cap(persona);
    const n = (used.get(name) || 0) + 1; used.set(name, n);
    if(n > 1) name += '-' + n;
    const tag = '[' + name + ']';
    const bot = new Bot({
      server: o.server, room: o.room, pass: o.pass, name,
      persona, cardfx: o.cardfx, askSecs: o.askSecs, paceMs: o.pace, tempo: o.tempo || null,   // v1.2.0
      deck: dk ? dk.deck : null, deckName: dk ? dk.deckName : undefined,   // v1.1.0 (#12)
      log: (...a) => console.log(' ', tag, ...a)
    });
    if(dk) console.log(' ', tag, 'deck:', dk.deckName);
    if(o.tempo) console.log(' ', tag, 'tempo:', o.tempo.tempo + (o.tempo.waitSecs ? ' ' + o.tempo.waitSecs + ' s' : ''));
    try{
      await bot.connect();
      bots.push(bot);
    }catch(e){
      console.error(' ', tag, 'FAILED to join:', e.message);
    }
    await sleep(600);                                    // gentle, staggered arrivals
  }

  if(!bots.length){ console.error('no bots seated — is the room name/password right and the server up?'); process.exit(1); }
  console.log(bots.length + ' bot(s) at the table. Start the game from the host client. Ctrl+C removes them.');

  const bye = () => {
    console.log('\nclosing ' + bots.length + ' bot(s)…');
    bots.forEach(b => { try{ b.close(); }catch(e){} });
    setTimeout(() => process.exit(0), 300);
  };
  process.on('SIGINT', bye);
  process.on('SIGTERM', bye);
}

if(require.main === module) main().catch(e => { console.error('fatal:', e.message); process.exit(1); });   // v1.1.0: importable (the suite tests parseArgs/resolveDeck)
module.exports = { parseArgs, resolveDeck };
