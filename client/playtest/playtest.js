#!/usr/bin/env node
'use strict';
/* ============================================================
   playtest.js v1.0.0 (14 Oct 2026, client v2.6.158) -- talk to a running playtest-rig.js
   ------------------------------------------------------------
   One command per call, so a person (or a model) can play turn by turn. See PLAYTEST.md.

   Reading
     ev [wait] [settle]        what happened since the last ev (long-polls up to `wait` s for something
                               that needs the human: a question, a Hold on, my turn, an error)
     st | stj                  the table, compact | as JSON
   Setting up
     setup [scenario.json]     create the room, seat the human's deck, add the bots, set the tempo, start
                               (default: scenarios/three-seat.json)
     tempo standard|adaptive|turn [secs]     pol '<json>'  (the reflex: see playtest-rig.js)
   Playing (every one runs the client's own functions; dialogs are answered, OK by default)
     phase unlock|master|minion|influence|discard     pass     resolve (the counter's Resolve)
     influence <card> <n>      out <card> (bring an influenced vampire into play)
     play <card> [--by <vampire>] [--on <vampire>] [--alt <regex>] [--no-draw]
                               --by: the vampire playing it (the anchor); --on: play it ON that vampire;
                               --alt: press the dialog's second button when its text matches (e.g. the
                               level chooser: --alt Superior)
     menu <card> 'Actions>Bleed>Bleed 3' [prompt values...]     discard <card>     clear (played cards
     to the ash heap)     burn <n> [why]     edge (take it)     target <seat> <card id>     give (Turn-based
     play button)     say <phrase|index>     chat <text>     js '<code>' [prompt values...]
   Keeping a record
     note <text>     shot <name>     quit
   Checking the rig itself
     smoke                     after setup: play the human's first turn and wait for the bots' turns;
                               exit 1 on a page error or a turn that never came back
   Flags for the playing commands: --cancel <regex> (press Cancel on a matching dialog), --timeout <ms>.
   Env: CPORT (control port, default 8899), MAX (events shown, default 200).
   ============================================================ */
const http = require('http'), fs = require('fs'), path = require('path');
const CP = +(process.env.CPORT || 8899);
const REPO = path.resolve(__dirname, '..', '..');
function call(p, b, tmo){ return new Promise((res, rej) => { const data = b ? JSON.stringify(b) : null;
  const r = http.request({ host: '127.0.0.1', port: CP, path: p, method: b ? 'POST' : 'GET', headers: b ? { 'content-type': 'application/json' } : {} }, rs => { let s = ''; rs.on('data', d => s += d); rs.on('end', () => { try { res(JSON.parse(s)); } catch (e) { res({ raw: s }); } }); });
  r.on('error', rej); r.setTimeout(tmo || 330000); if (data) r.write(data); r.end(); }); }
const argv = process.argv.slice(2);
const flag = (k, d) => { const i = argv.indexOf(k); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const bool = k => { const i = argv.indexOf(k); if (i < 0) return false; argv.splice(i, 1); return true; };
const J = JSON.stringify;
async function job(code, values, extra){ return call('/js', Object.assign({ code, values: values || [], timeout: +(TMO || 15000), cancel: CANCEL ? [CANCEL] : [], alt: ALT ? [ALT] : [] }, extra || {})); }
let TMO, CANCEL, ALT;
const fmtCard = c => c ? (c.name + (c.cap ? '/' + c.cap : '') + (c.blood ? ' b' + c.blood : '') + (c.locked ? ' LOCKED' : '') + (c.fd ? ' (fd)' : '') + (c.att && c.att.length ? ' +[' + c.att.join(', ') + ']' : '') + ' #' + c.id) : '?';
async function events(wait, settle){
  const info = await call('/info'); const CUR = path.join(info.out, '.cursor-' + CP);
  const since = fs.existsSync(CUR) ? +fs.readFileSync(CUR, 'utf8') : 0;
  const r = await call('/events?since=' + since + '&wait=' + (wait || 0) + (settle ? '&settle=' + settle : '') + '&max=' + (process.env.MAX || 200));
  fs.writeFileSync(CUR, String(r.last)); return r;
}
function deckText(spec){   // 'bot:<key>' = a bot project deck (read from bot/, never written), a path to a deck text, or the text itself
  if (/^bot:/.test(spec)) { const d = JSON.parse(fs.readFileSync(path.join(REPO, 'bot', 'deck-' + spec.slice(4) + '.json'), 'utf8'));
    return 'Deck Name: ' + d.name + '\nCrypt\n' + d.crypt.map(c => c.qty + 'x ' + c.name).join('\n') + '\nLibrary\n' + d.library.map(c => c.qty + 'x ' + c.name).join('\n') + '\n'; }
  if (fs.existsSync(spec)) return fs.readFileSync(spec, 'utf8');
  return spec;
}
async function setup(file){
  const sc = JSON.parse(fs.readFileSync(file || path.join(__dirname, 'scenarios', 'three-seat.json'), 'utf8'));
  const step = async (label, p) => { const r = await p; if (r && (r.err || r.timeout || (r.v && r.v.ok === false))) { console.log('setup failed at ' + label + ': ' + J(r)); process.exit(1); } return r; };
  await step('open', job("openMP('create'); await new Promise(r=>setTimeout(r,400)); return shownModal();"));
  await step('fold', call('/click', { sel: '#mpGsToggle' }));
  await step('name', call('/fill', { sel: '#mpName', value: sc.human.name }));
  await step('room', call('/fill', { sel: '#mpRoom', value: sc.room || 'playtest' }));
  await step('board', call('/select', { sel: '#mpBoard', value: sc.board || 'structured' }));
  await step('create', call('/click', { sel: '#mpCreate' }));
  await step('lobby', job('for(let i=0;i<80 && net.lobby!==true;i++) await new Promise(r=>setTimeout(r,150)); return { ok: net.lobby===true };'));
  const text = deckText(sc.human.deck);
  await step('deck', job('buildDeck(parseDeck(' + J(text) + ')); await new Promise(r=>setTimeout(r,500)); if(shownModal()!=="lobbyModal"){ try{ openOverlay("lobbyModal"); renderLobby(); }catch(e){} } await new Promise(r=>setTimeout(r,300)); return { ok: !!state.deckName };'));
  await step('seat', call('/click', { sel: '.lobseatbtn[data-seat="' + (sc.human.seat || 1) + '"]' }));
  for (const b of sc.bots || []) {
    await step('bot name', call('/fill', { sel: '#lobBotName', value: b.name }));
    await step('bot deck', call('/select', { sel: '#lobBotDeck', value: b.deck }));
    await step('bot persona', call('/select', { sel: '#lobBotPersona', value: b.persona || 'expert' }));
    await step('bot add', call('/click', { sel: '#lobBotAdd' }));
    await step('bot seated', job('const t0=Date.now(); while(Date.now()-t0<20000){ const p=((net.lobbyData||{}).players||[]).find(q=>q.name===' + J(b.name) + '); if(p&&p.deck&&p.seat) return { ok:true, seat:p.seat }; await new Promise(r=>setTimeout(r,200)); } return { ok:false };', [], { timeout: 25000 }));
  }
  if (sc.tempo) await step('tempo', job('return { ok: PT.tempo(' + J(sc.tempo.tempo || null) + ',' + J(sc.tempo.waitSecs || null) + ') !== undefined, tempo: botCfgNow() };'));
  if (sc.reflex) await step('reflex', call('/policy', sc.reflex));
  await step('start', call('/click', { sel: '#lobStart' }));
  const r = await step('started', job("for(let i=0;i<100 && !(net.status==='in' && net.lobby===false);i++) await new Promise(r=>setTimeout(r,150)); await new Promise(r=>setTimeout(r,3000)); if(shownModal()==='mpModal'){ try{ document.getElementById('mpClose').click(); }catch(e){} } return { ok: net.status==='in', turn: net.turnSeat, seat: mySeat(), players: net.roster.map(p=>p.seat+':'+p.name+(p.bot?' (bot)':'')) };", [], { timeout: 25000 }));
  console.log('started: ' + J(r.v));
}
async function smoke(){
  const st0 = await call('/state'); if (st0.err) { console.log('no game: ' + st0.err); process.exit(1); }
  const me = st0.seat; let t0 = Date.now(), errors = [];
  const waitTurn = async (pred, label, secs) => { const end = Date.now() + secs * 1000; for (;;) { const r = await events(20); r.events.forEach(e => { if (/PAGEERROR|SERVER-ERR|FATAL/.test(e)) errors.push(e); }); const s = await call('/state'); if (pred(s)) return s; if (Date.now() > end) { console.log('smoke: ' + label + ' never came (' + secs + ' s)'); process.exit(1); } } };
  await waitTurn(s => s.turnSeat === me, 'my first turn', 120);
  for (const ph of [0, 1, 2, 3]) await job('return await PT.phase(' + ph + ');');
  const unc = (await call('/state')).unc; if (unc.length) await job('return await PT.influence(' + J(unc[0].id) + ', 1);');
  await job('return await PT.phase(4);'); await job('await pass(); return net.turnSeat;');
  const s1 = await waitTurn(s => s.turnSeat === me && s.turnNo > st0.turnNo, 'my second turn (every bot played its turn)', 300);
  console.log('smoke: ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s, turn ' + st0.turnNo + ' -> ' + s1.turnNo + ', bots: ' + s1.bots.map(b => b.name + ' ' + b.state).join(', ') + ', page errors: ' + errors.length);
  if (errors.length) { errors.forEach(e => console.log('  ' + e)); process.exit(1); }
}
(async () => {
  TMO = flag('--timeout', process.env.TMO); CANCEL = flag('--cancel', null); ALT = flag('--alt', null);
  const by = flag('--by', null), on = flag('--on', null), noDraw = bool('--no-draw');
  const [cmd, ...a] = argv;
  if (cmd === 'ev') { const r = await events(a[0], a[1]); console.log('t=' + r.t + 's  (' + r.n + ' new)'); (r.events || []).forEach(e => console.log(e)); return; }
  if (cmd === 'st' || cmd === 'stj') { const s = await call('/state'); if (cmd === 'stj' || s.err) { console.log(J(s, null, 1)); return; }
    console.log('v' + s.version + ' | turn: seat ' + s.turnSeat + ' (me ' + s.seat + ') round ' + s.round + ' turn ' + s.turnNo + ' | my phase ' + s.phaseName + ' | pool ' + s.pool + (s.edge ? ' EDGE' : '') + ' | transfers ' + s.transfersLeft + ' | masters ' + s.masters + ' | lib ' + s.lib + ' crypt ' + s.crypt + ' ash ' + s.ash + ' | dialog ' + s.modal + ' | tempo ' + (s.tempo ? s.tempo.tempo + (s.tempo.tempo === 'turn' ? '' : ' ' + s.tempo.waitSecs + 's') : '-'));
    console.log('HAND: ' + s.hand.map(fmtCard).join(' | ')); console.log('READY: ' + s.ready.map(fmtCard).join(' | ')); console.log('UNC: ' + s.unc.map(fmtCard).join(' | '));
    if (s.torpor.length) console.log('TORPOR: ' + s.torpor.map(fmtCard).join(' | '));
    s.seats.forEach(p => { if (p.seat === s.seat) return; console.log('S' + p.seat + ' ' + p.name + (p.bot ? ' [bot]' : '') + (p.out ? ' OUT' : '') + ': pool ' + p.pool + ' vp ' + p.vp + (p.edge ? ' EDGE' : '') + ' hand ' + p.hand + ' | ' + (p.live || []).map(c => c.name + (c.z === 'torpor' ? '[TORPOR]' : '') + (c.blood ? ' b' + c.blood : '') + (c.locked ? ' L' : '') + (c.host ? ' @' + c.host : '') + ' #' + c.id).join(', ') + ' | unc ' + J(p.unc)); });
    if (s.avr && s.avr.mode) console.log('COUNTER: ' + J(s.avr));
    if (s.bots.length) console.log('BOTS: ' + s.bots.map(b => b.name + ': ' + (b.waitingFor || b.state)).join(' | '));
    if (s.target) console.log('TARGET: ' + J(s.target)); return; }
  if (cmd === 'setup') return setup(a[0]);
  if (cmd === 'smoke') return smoke();
  if (cmd === 'js') { console.log(J(await job(a[0], a.slice(1)), null, 1)); return; }
  if (cmd === 'menu') { console.log(J(await job('return await PT.menu(PT.id(' + J(a[0]) + '),' + J(a[1].split('>').map(x => x.trim())) + ');', a.slice(2)))); return; }
  if (cmd === 'phase') { console.log(J(await job('return await PT.phase(' + (/^\d$/.test(a[0]) ? a[0] : J(a[0])) + ');'))); return; }
  if (cmd === 'pass') { console.log(J(await job('await pass(); return net.turnSeat;'))); return; }
  if (cmd === 'resolve') { console.log(J(await job('avrResolve(); return avr.mode;'))); return; }
  if (cmd === 'influence') { console.log(J(await job('return await PT.influence(' + J(a[0]) + ',' + (+a[1] || 1) + ');'))); return; }
  if (cmd === 'out') { console.log(J(await job('return await PT.bringOut(' + J(a[0]) + ');'))); return; }
  if (cmd === 'play') { console.log(J(await job('return await PT.play(' + J(a[0]) + ',' + J({ by, on, noDraw }) + ');'))); return; }
  if (cmd === 'discard') { console.log(J(await job('return await PT.discard(' + J(a[0]) + ');'))); return; }
  if (cmd === 'clear') { console.log(J(await job('return PT.clearPlayed();'))); return; }
  if (cmd === 'burn') { console.log(J(await job('return PT.burnPool(' + (+a[0] || 1) + ',' + J(a.slice(1).join(' ') || '') + ');'))); return; }
  if (cmd === 'edge') { console.log(J(await job('return PT.takeEdge();'))); return; }
  if (cmd === 'target') { console.log(J(await job('return PT.target(' + (+a[0]) + ',' + J(a[1]) + ');'))); return; }
  if (cmd === 'give') { console.log(J(await job('return PT.giveWord();'))); return; }
  if (cmd === 'tempo') { console.log(J(await job('PT.tempo(' + J(a[0]) + ',' + (a[1] ? +a[1] : 'null') + '); return botCfgNow();'))); return; }
  if (cmd === 'say') { console.log(J(await call('/say', { i: /^\d+$/.test(a[0]) ? +a[0] : a.join(' ') }))); return; }
  if (cmd === 'chat') { console.log(J(await call('/chat', { text: a.join(' ') }))); return; }
  if (cmd === 'pol') { console.log(J(await call('/policy', JSON.parse(a[0] || '{}')))); return; }
  if (cmd === 'shot') { console.log(J(await call('/shot?name=' + encodeURIComponent(a[0] || 'shot')))); return; }
  if (cmd === 'note') { console.log(J(await call('/note', { text: a.join(' ') }))); return; }
  if (cmd === 'info') { console.log(J(await call('/info'), null, 1)); return; }
  if (cmd === 'quit') { console.log(J(await call('/quit'))); return; }
  console.log('unknown command -- see the header of playtest.js');
})().catch(e => { console.log('ERR ' + e.message + (e.code === 'ECONNREFUSED' ? ' (is playtest-rig.js running on control port ' + CP + '?)' : '')); process.exit(1); });
