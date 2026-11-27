#!/usr/bin/env node
'use strict';
/* test-card-scenarios.js v1.0.0 (27 Nov 2026) -- THE SCENARIO BENCH: the card chain's dynamic link, card by card through the bot's real
   path (RULINGS D-147). A fast gate of its own, outside the suite x3.

   For each row of cardfx-exact.json (the families' exactness record) whose state keeps our value, and each of our modes at that
   level that falls in a window the bench knows, a state is built on the abstract table (elysium-bot-abstract.js: real bots on the
   client's hotseat bridge, the sim's virtual clock) and the bots play it: the card's line on the wire, at its level, with its
   number on the counter. What is right is our entry's value at that level -- the exactness record says the value is right (two
   witnesses agree, a reader graded it, or a round corrected it to the reader's reading); the bench checks the code plays it so.

   The windows of the first family (C1: stealth, intercept, bleed; the bleed action on the table, directed at the prey):
     S  a stealth modifier (a `mod` card, fx.stealth a number): the acting bot holds it, the prey's unlocked vampire attempts to
        block bare (pool 2, nothing in hand): the card is played at its level, "V plays X: +N stealth.", the counter's stealth N;
     I  an intercept reaction or modifier (`react` / `mod`, fx.intercept a number): the acting bot bleeds and answers the bare attempt
        with Lost in Crowds (+1); the prey, the bot under test, plays the card: "W plays X: +N intercept.", the counter's intercept N;
     B  a bleed modifier (`mod`, fx.bleed a number, no stealth and no bleedAct in the mode): the prey's vampire is locked, the bleed goes
        through: "V plays X: +N bleed." and "V adds +N bleed (= 1+N).";
     A  a bleed action card (fx.bleedAct): the acting bot holds only it and bleeds with it: "V plays X — bleeds P for M" with M =
        1 + its bleed, and the counter's stealth at the announce the card's printed stealth (the header's or the mode's, whichever is
        more: _cardActStealth's reading); the prey's vampire is unlocked when the
        mode carries stealth (else the bot rightly keeps the card for a plain bleed), locked otherwise. A mode no better than a plain
        bleed by more than +1 stealth in our entry is no window: decide('action') keeps the card (a card in hand -0.35, a stealth
        +0.2: a decision, not a reading; 9.13 when the card's value sits in another mode).
   The vampire for the card: a crypt entry with the mode's level and no higher (a mode at [obf] on a vampire without superior
   Obfuscate), the entry's clan, sect, title and capacity, and no crypt text the bot reads (its own bonus would add to the counts); a
   plusIf condition is read against it as _plusIf reads it (selfClan, selfTitled; an unread condition adds nothing). Seat 3 sits idle:
   the acting seat's predator, so the prey is no predator (a two-seat table has rules of its own, the bounce's for one).

   The known gaps: cardfx-exact.json's `gaps.bench` names each row the bench plays wrong (its register entry). The bench FAILS on a
   failing row with no entry and on a listed row that passes now, or no longer has a scenario (stale). A row no window takes is
   counted (no window yet: the next family's windows, or the reader gate's). The table's own rules run first (the abstract table's
   --self-test cases): a red there stops the bench, as every scenario stands on them.

   Usage: node test-card-scenarios.js [--card NAME] [--json OUT] [--list] [--bot FILE]   (exit 1 on a failure)
          node test-card-scenarios.js --self-test   (planted cases: a wrong number, a card not played, a stale line, each caught)
   Needs elysium-bot.js, elysium-cardfx.json, cardfx-exact.json, the read-only client copy and the abstract table beside it.         */
const T = require('./elysium-bot-abstract.js');           // first: it installs the virtual clock before the bot is required
const fs = require('fs'), path = require('path');
const BENCH_VERSION = '1.0.0';
const here = f => path.join(__dirname, f);
const KEPT = new Set(['agree', 'graded', 'corrected', 'explained']);
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const IDLE = { name: 'Lisa', pool: 30, hand: [], ready: [] };

function modesAt(e, lvl){
  const ms = (e.modes || []).filter(mo => mo && mo.fx);
  if(lvl === 'all' || lvl == null) return ms;
  if(lvl === '-' || /^#\d+$/.test(lvl)) return ms.filter(mo => !mo.at);
  return ms.filter(mo => mo.at === lvl);
}
const num = v => typeof v === 'number' && isFinite(v);
function windowFor(fam, e, mo){
  const t = e.t || [], f = mo.fx;
  if(e.req && e.req.unmodelled) return { none: 'the entry is unmodelled' };
  if(f.selfDmg || f.selfTorpor) return { none: 'a self-price mode (only its own consumer plays it)' };
  if(t.includes('action') && f.bleedAct && !(num(f.bleed) && f.bleed > 0) && !(actStealthOf(e, mo) > 1))
    return { none: 'a bleed card the action scorer keeps (a bleed of 1 at +1 stealth at most: the card in hand outweighs it)' };
  if(fam === 'stealth' && t.includes('action') && f.bleedAct) return num(f.actStealth) || num(f.stealth) ? { w: 'A', key: 'stealth' } : { none: 'no number' };
  if(fam === 'bleed' && t.includes('action') && f.bleedAct) return { w: 'A', key: 'bleed' };
  if(fam === 'stealth' && t.includes('mod') && f.stealth !== undefined){
    if(!num(f.stealth)) return { none: 'stealth ' + f.stealth };
    if(f.icpVs) return { none: 'a stealth against one kind of blocker (icpVs)' };
    if(e.notBleed || mo.notBleed) return { none: 'not usable during a bleed (the bench\'s action is a bleed)' };
    return { w: 'S' };
  }
  if(fam === 'intercept' && (t.includes('react') || t.includes('mod')) && f.intercept !== undefined){
    if(!num(f.intercept)) return { none: 'intercept ' + f.intercept };
    if(mo.when) return { none: 'an unlock reaction (when ' + mo.when + ')' };
    return { w: 'I' };
  }
  if(fam === 'bleed' && t.includes('mod') && f.bleed !== undefined && !f.bleedAct && f.stealth === undefined){
    if(!num(f.bleed)) return { none: 'bleed ' + f.bleed };
    if(e.notBleed || mo.notBleed) return { none: 'not usable during a bleed' };
    return { w: 'B' };
  }
  return null;
}
/* The vampire that can play mode mo of entry e (null with a reason when the crypt has none). */
function vampireFor(e, mo){
  const r = e.req || {}, want = { exact: true, noText: true };
  const own = new Set(String(mo.at || '').toLowerCase().split('+').filter(Boolean));
  const others = [...new Set((e.modes || []).filter(m2 => m2 !== mo && m2.at).flatMap(m2 => String(m2.at).toLowerCase().split('+')))].filter(x => !own.has(x));
  if(others.length) want.without = others;   // the mode alone: a vampire with another mode's discipline would play that mode when it is worth more (Skullduggery's [pre] beside its [obf])
  const cost = (e.cost && num(e.cost.blood)) ? e.cost.blood : 0;
  if(cost) want.minCap = cost + 2;
  if(mo.at) want.disc = mo.at;
  else if(r.disc && r.disc.length && !(e.t || []).some(t => t === 'equip' || t === 'retainer' || t === 'ally')) want.disc = String(r.disc[0]).toLowerCase();
  if(r.clan && r.clan.length) want.clan = r.clan;
  if(r.sect) want.sect = r.sect;
  if(e.anarchReq) want.sect = 'Anarch';
  if(r.title || (r.titles && r.titles.length)){ want.titled = true; if(r.titles && r.titles.length) want.titles = r.titles; }
  if(r.capMin) want.minCap = Math.max(want.minCap || 0, r.capMin);
  const n = T.pickVampire(want);
  return n ? { name: n } : { none: 'no vampire in the crypt for ' + JSON.stringify(want) };
}
function plusIfFor(mo, key, vampName, crypt){
  const pi = mo.fx && mo.fx.plusIf; if(!pi || !pi.add || !num(pi.add[key])) return 0;
  const c = pi.if || {}, ce = crypt[vampName] || {};
  if(Object.keys(c).some(k => k !== 'selfClan' && k !== 'selfTitled')) return 0;   // _plusIf fails an unread condition closed
  if(c.selfClan && !String(ce.clan || '').split('/').includes(c.selfClan)) return 0;
  if(c.selfTitled && !ce.title) return 0;
  return pi.add[key];
}
/* The action's stealth as the card prints it: the level-free header's "+N stealth action" or the played mode's, whichever is more
   (_cardActStealth's reading, the rush's and the attach's; _bestBleedCardFor reads the played mode's only: 9.13). */
function actStealthOf(e, mo){ let st = 0; for(const m of (e.modes || [])){ if(!m || !m.fx || (m.at && m !== mo)) continue; const v = num(m.fx.actStealth) ? m.fx.actStealth : (m === mo && num(m.fx.stealth)) ? m.fx.stealth : 0; if(v > st) st = v; } return st; }
function bloodFor(e, crypt, name){ const cap = (crypt[name] || {}).cap | 0, cost = (e.cost && num(e.cost.blood)) ? e.cost.blood : 0; return Math.max(1, Math.min(cap || 3, Math.max(3, cost + 2))); }   // enough to pay the card and keep 1

/* One scenario: the spec and its check. */
function scenarioFor(card, e, mo, win, crypt){
  const v = vampireFor(e, mo); if(v.none) return { none: v.none };
  const V = v.name, cost = (e.cost && num(e.cost.blood)) ? e.cost.blood : 0, edge = !!e.costEdge || !!(mo.fx && mo.fx.costEdge);
  const blocker = T.pickVampire({ disc: 'aus', exact: true, noText: true, notName: [V] }), actor = T.pickVampire({ disc: 'obf', exact: true, noText: true, notName: [V] });
  const me = { name: 'Hanna', pool: 30, hand: [card], ready: [{ name: V, blood: bloodFor(e, crypt, V) }], edge };
  const preyPool = (mo.req && num(mo.req.targetPoolMax)) ? Math.max(1, mo.req.targetPoolMax) : 20;   // Foreshadowing Destruction [DOM]: the target at 9 or fewer pool
  if(e.cost && num(e.cost.pool) && e.cost.pool >= 30) return { none: 'a pool cost of ' + e.cost.pool };
  if(win.w === 'S'){
    const N = mo.fx.stealth + plusIfFor(mo, 'stealth', V, crypt);
    return { what: 'S: +' + N + ' stealth', spec: { acting: 1, seats: [me, { name: 'Viktor', pool: 2, hand: [], ready: [{ name: blocker, blood: 4 }] }, IDLE] },
      check: r => { const re = new RegExp('^' + esc(V) + ' plays ' + esc(card) + '(?: \\[[^\\]]+\\])?(?: \\([^)]*\\))?: \\+(\\d+) stealth\\.$'), l = T.linesOf(r, 1, re)[0], m = l && l.txt.match(re);
        const got = m ? +m[1] : null, tal = T.tallyOf(r, 1, 'block').some(x => x.a === N), blood = l ? T.bloodAt(r, 1, V, l.ms) : null;
        const ok = got === N && tal && !r.seats[0].hand.includes(card) && blood === bloodFor(e, crypt, V) - cost;
        return { ok, got: m ? l.txt + (tal ? '' : ' (no counter at ' + N + ')') + (blood === bloodFor(e, crypt, V) - cost ? '' : ' (blood ' + blood + ', cost ' + cost + ')') : 'not played: ' + (T.linesOf(r, 1, /stealth|Block:/).map(x => x.txt).slice(-3).join(' | ') || T.linesOf(r).map(x => x.txt).slice(-3).join(' | ')) }; } };
  }
  if(win.w === 'I'){
    const N = mo.fx.intercept + plusIfFor(mo, 'intercept', V, crypt);
    return { what: 'I: +' + N + ' intercept', spec: { acting: 1, seats: [{ name: 'Hanna', pool: 30, hand: ['Lost in Crowds'], ready: [{ name: actor, blood: 3 }] },
        { name: 'Viktor', pool: 2, hand: [card], ready: [{ name: V, blood: bloodFor(e, crypt, V) }], edge }, IDLE] },
      check: r => { const re = new RegExp('^' + esc(V) + ' plays ' + esc(card) + ': \\+(\\d+) intercept\\.$'), l = T.linesOf(r, 2, re)[0], m = l && l.txt.match(re);
        const got = m ? +m[1] : null, tal = T.tallyOf(r, 2, 'block').some(x => x.b === N), blood = l ? T.bloodAt(r, 2, V, l.ms) : null;
        const ok = got === N && tal && !r.seats[1].hand.includes(card) && blood === bloodFor(e, crypt, V) - cost;
        return { ok, got: m ? l.txt + (tal ? '' : ' (no counter at ' + N + ')') + (blood === bloodFor(e, crypt, V) - cost ? '' : ' (blood ' + blood + ', cost ' + cost + ')') : 'not played: ' + (T.linesOf(r, 2).map(x => x.txt).slice(-3).join(' | ') || T.linesOf(r).map(x => x.txt).slice(-3).join(' | ')) }; } };
  }
  if(win.w === 'B'){
    const N = mo.fx.bleed + plusIfFor(mo, 'bleed', V, crypt);
    return { what: 'B: +' + N + ' bleed', spec: { acting: 1, seats: [me, { name: 'Viktor', pool: preyPool, hand: [], ready: [{ name: blocker, blood: 4, locked: true }] }, IDLE] },
      check: r => { const re = new RegExp('^' + esc(V) + ' plays ' + esc(card) + ':(?: burns the Edge for)? \\+(\\d+) bleed\\.$'), l = T.linesOf(r, 1, re)[0], m = l && l.txt.match(re);
        const add = T.linesOf(r, 1, new RegExp('^' + esc(V) + ' adds \\+' + N + ' bleed \\(= ' + (1 + N) + '\\)\\.$'))[0];
        const ok = !!m && +m[1] === N && !!add && !r.seats[0].hand.includes(card);
        return { ok, got: m ? l.txt + (add ? '' : ' (no "adds +' + N + ' bleed (= ' + (1 + N) + ')" line)') : 'not played: ' + T.linesOf(r, 1).map(x => x.txt).filter(x => /bleed/.test(x)).slice(-3).join(' | ') }; } };
  }
  if(win.w === 'A'){
    const M = 1 + (num(mo.fx.bleed) ? mo.fx.bleed : 0), S = actStealthOf(e, mo);
    return { what: 'A: bleed ' + M + ' at +' + S + ' stealth', spec: { acting: 1, seats: [me, { name: 'Viktor', pool: 20, hand: [], ready: [{ name: blocker, blood: 4, locked: !(S > 0) }] }, IDLE] },   // a card's stealth is worth something only against an unlocked blocker
      check: r => { const q = T.linesOf(r, 1, new RegExp('plays ' + esc(card) + ' — bleeds \\S.* for (\\d+)'))[0], ann = T.linesOf(r, 1, new RegExp('^' + esc(V) + ' bleeds for (\\d+)\\.$'))[0];
        const qm = q && q.txt.match(/ for (\d+)/), am = ann && ann.txt.match(/for (\d+)\./), t0 = T.tallyOf(r, 1, 'block')[0];
        const okM = !!qm && +qm[1] === M && !!am && +am[1] === M, okS = !!t0 && (t0.a | 0) === S;
        return { ok: okM && (win.key !== 'stealth' || okS) && okM, got: q ? q.txt + ' / ' + (ann ? ann.txt : 'no announce') + ' / counter ' + (t0 ? t0.a : 'none') : 'not played as the bleed: ' + T.linesOf(r, 1).map(x => x.txt).filter(x => /bleed/.test(x)).slice(0, 2).join(' | ') }; } };
  }
  return { none: 'no window' };
}

function rowsOf(ex){ const out = [];
  for(const [card, ks] of Object.entries((ex && ex.cards) || {})) for(const [fam, v] of Object.entries(ks))
    for(const [lvl, st] of Object.entries(typeof v === 'string' ? { all: v } : v)) out.push({ card, fam, lvl, st: String(st) });
  return out; }
const gapAt = (g, r) => { const c = g && g[r.card], v = c && c[r.fam]; if(v == null) return null; return typeof v === 'string' ? (r.lvl === 'all' ? v : null) : (v[r.lvl] || null); };
function listed(g){ const out = []; for(const [card, ks] of Object.entries(g || {})) for(const [fam, v] of Object.entries(ks)) for(const [lvl, id] of Object.entries(typeof v === 'string' ? { all: v } : v)) out.push({ card, fam, lvl, id: String(id) }); return out; }

async function runBench(ex, fx, opts){
  const o = opts || {}, lib = fx.lib, crypt = fx.crypt, gaps = (ex.gaps && ex.gaps.bench) || {};
  const res = { rows: 0, kept: 0, scenarios: 0, pass: 0, failRows: [], newFails: [], stale: [], noWindow: {}, rowsWithScenario: 0, details: [] };
  const seen = new Set();
  for(const row of rowsOf(ex)){
    if(o.card && row.card !== o.card) continue;
    res.rows++; if(!KEPT.has(row.st.split(' ')[0])) continue; res.kept++;
    const e = lib[row.card]; if(!e) continue;
    const id = gapAt(gaps, row), runs = [];
    for(const mo of modesAt(e, row.lvl)){
      const win = windowFor(row.fam, e, mo); if(!win) continue;
      if(win.none){ res.noWindow[win.none] = (res.noWindow[win.none] || 0) + 1; continue; }
      const sc = scenarioFor(row.card, e, mo, win, crypt);
      if(sc.none){ res.noWindow[sc.none.replace(/ for \{.*$/, '')] = (res.noWindow[sc.none.replace(/ for \{.*$/, '')] || 0) + 1; continue; }
      let v; try { const r = await (o.run || T.runWindow)(sc.spec); v = r.passed ? sc.check(r) : { ok: false, got: 'the acting seat never passed' }; } catch(err){ v = { ok: false, got: 'threw: ' + err.message }; }
      res.scenarios++; if(v.ok) res.pass++;
      runs.push({ at: mo.at || null, what: sc.what, vamp: (sc.spec.seats[sc.spec.seats[0].hand.includes(row.card) ? 0 : 1].ready[0] || {}).name, ok: v.ok, got: v.got });
    }
    if(!runs.length){ if(id) res.stale.push(Object.assign({ id, why: 'no scenario takes the row now' }, row)); continue; }
    res.rowsWithScenario++; seen.add(row.card + '|' + row.fam + '|' + row.lvl);
    const bad = runs.filter(x => !x.ok), det = Object.assign({ runs, id }, row); res.details.push(det);
    if(bad.length){ res.failRows.push(det); if(!id) res.newFails.push(det); }
    else if(id) res.stale.push(Object.assign({ why: 'every scenario passes now' }, det));
  }
  if(!o.card) for(const L of listed(gaps)) if(!seen.has(L.card + '|' + L.fam + '|' + L.lvl) && !res.stale.some(x => x.card === L.card && x.fam === L.fam && x.lvl === L.lvl)) res.stale.push(Object.assign({ why: 'no such row with a scenario' }, L));
  return res;
}

async function selfTest(){
  let pass = 0, fail = 0; const ok = (c, m) => { if(c) pass++; else fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
  const fx = JSON.parse(fs.readFileSync(here('elysium-cardfx.json'), 'utf8'));
  /* real scenarios on known cards: each window plays its card right */
  const ex = { cards: { 'Lost in Crowds': { stealth: { obf: 'agree', OBF: 'agree' } }, 'Eyes of Argus': { intercept: { aus: 'agree' } }, 'Conditioning': { bleed: { dom: 'agree' } },
                        'Govern the Unaligned': { bleed: { dom: 'agree' } } }, gaps: { bench: {} } };
  const r = await runBench(ex, fx, {});
  ok(r.scenarios === 5 && r.pass === 5 && r.newFails.length === 0, 'the four windows on cards the starters play: Lost in Crowds [obf] and [OBF], Eyes of Argus [aus], Conditioning [dom], Govern the Unaligned [dom] (got ' + r.pass + ' of ' + r.scenarios + ': ' + r.details.filter(d => d.runs.some(x => !x.ok)).map(d => d.card + ' ' + d.runs.map(x => x.got).join('; ')).join(' / ') + ')');
  /* planted: a wrong number in our entry (the bot plays the card at 2, the record says 1 was right: the bench sees the line's 2) */
  const fx2 = JSON.parse(JSON.stringify(fx)); fx2.lib['Lost in Crowds'].modes.find(m => m.at === 'obf').fx.stealth = 3;
  const r2 = await runBench({ cards: { 'Lost in Crowds': { stealth: { obf: 'agree' } } }, gaps: { bench: {} } }, fx2, { run: spec => T.runWindow(spec) });
  ok(r2.newFails.length === 1, 'planted: an expected value the bot does not play (the bench reads +3 where the bot plays +1) is a new failure');
  /* planted: a card not played (a stealth card a vampire without the discipline holds: the table's bot cannot play it) */
  const r3 = await runBench({ cards: { 'Lost in Crowds': { stealth: { obf: 'agree' } } }, gaps: { bench: {} } }, fx, { run: spec => { spec.seats[0].ready[0].name = T.pickVampire({ disc: 'aus', exact: true, noText: true, without: ['obf'] }); return T.runWindow(spec); } });
  ok(r3.newFails.length === 1 && /not played/.test(r3.newFails[0].runs[0].got), 'planted: a card the bot does not play is a new failure (' + (r3.newFails[0] ? r3.newFails[0].runs[0].got.slice(0, 80) : 'none') + ')');
  /* planted: a listed gap whose row passes now is stale; a listed gap with no such row is stale */
  const r4 = await runBench({ cards: { 'Lost in Crowds': { stealth: { obf: 'agree' } } }, gaps: { bench: { 'Lost in Crowds': { stealth: { obf: '7.6' } }, 'No Such Card': { bleed: '7.6' } } } }, fx, {});
  ok(r4.stale.length === 2, 'planted: a listed row that passes now and a listed row that does not exist are each stale (got ' + r4.stale.length + ')');
  console.log('scenario bench ' + BENCH_VERSION + ' self-test: ' + pass + '/' + fail);
  return fail;
}

async function main(){
  const a = process.argv.slice(2), arg = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  if(arg('--bot')) T.useBot(arg('--bot'));
  if(a.includes('--self-test')){ const f = await selfTest(); return f ? 1 : 0; }
  /* the table's own rules first: every scenario stands on them */
  let tableFail = 0; for(const c of T.SELF){ let v; try { const r = await T.runWindow(c.spec()); v = r.passed ? c.check(r) : { ok: false, got: 'never passed' }; } catch(e){ v = { ok: false, got: e.message }; }
    if(!v.ok){ tableFail++; console.log('FAIL the table\'s rule ' + c.id + ': ' + c.rule + ' -- got: ' + v.got); } }
  if(tableFail){ console.log('scenario bench ' + BENCH_VERSION + ': the table\'s own rules fail (' + tableFail + '): no scenario is read -- FAIL'); return 1; }
  const ex = JSON.parse(fs.readFileSync(here('cardfx-exact.json'), 'utf8')), fx = JSON.parse(fs.readFileSync(here('elysium-cardfx.json'), 'utf8'));
  const CLOCK = T.install(), w0 = CLOCK.realNow(), res = await runBench(ex, fx, { card: arg('--card') });
  if(arg('--json')) fs.writeFileSync(arg('--json'), JSON.stringify(Object.assign({ tool: 'test-card-scenarios ' + BENCH_VERSION, table: T.ABSTRACT_VERSION, bot: require(here('elysium-bot.js')).BOT_VERSION }, res), null, 1) + '\n');
  if(a.includes('--list')) res.failRows.forEach(d => console.log((d.id ? 'listed ' + d.id : 'NEW    ') + ' | ' + d.card + ' | ' + d.fam + ' ' + d.lvl + ' (' + d.st + ') | ' + d.runs.filter(x => !x.ok).map(x => '[' + (x.at || '-') + '] ' + x.what + ' on ' + x.vamp + ': ' + x.got).join(' ; ')));
  res.newFails.forEach(d => console.log('FAIL played wrong: ' + d.card + ' ' + d.fam + ' ' + d.lvl + ' -- ' + d.runs.filter(x => !x.ok).map(x => '[' + (x.at || '-') + '] ' + x.what + ': ' + x.got).join(' ; ') + ' -- fix it, or register the gap and list it in cardfx-exact.json gaps.bench'));
  res.stale.forEach(x => console.log('FAIL stale: ' + x.card + ' ' + x.fam + ' ' + x.lvl + ' is listed as ' + (x.id || '?') + ' but ' + x.why + ' -- delete its line'));
  const nw = Object.entries(res.noWindow).sort((p, q) => q[1] - p[1]).map(([k, n]) => k + ' ' + n).join(', ');
  const fails = res.newFails.length + res.stale.length;
  console.log('scenario bench ' + BENCH_VERSION + ' (table ' + T.ABSTRACT_VERSION + '): ' + res.kept + ' kept rows, ' + res.rowsWithScenario + ' with a scenario, ' + res.scenarios + ' scenarios, ' + res.pass + ' played right, '
    + res.failRows.length + ' rows wrong (' + (res.failRows.length - res.newFails.length) + ' listed, ' + res.newFails.length + ' new), ' + res.stale.length + ' stale; no window: ' + (nw || 'none') + ' (' + Math.round((CLOCK.realNow() - w0) / 100) / 10 + ' s) -- ' + (fails ? 'FAIL' : 'PASS'));
  return fails ? 1 : 0;
}
module.exports = { runBench, windowFor, scenarioFor, vampireFor, BENCH_VERSION };
if(require.main === module) main().then(c => process.exit(c)).catch(e => { console.error('SCENARIO BENCH FAILED:', e && e.stack || e); process.exit(1); });
