#!/usr/bin/env node
'use strict';
/* gen-review-sheet.js v1.0.0 (19 Nov 2026, bot v0.6.234; RULINGS D-125, D-126; docs/specs/spec-card-sweep-2026-11-18.md §3.1, §4.1, §5)
   -- THE REVIEW SHEET: one deck's library cards, each with what decides its reading and what proposes one, so a round splits every
   printed effect into T1 (a key the compiler gives), T2 (shared: printed by two or more library cards) and T3 (the unique remainder)
   on evidence. Generated and never committed: write it to scratch, like a series.

   Per card:
   - KRCG's text, types, cost and rulings count (vtes.json beside the tool, built by krcg-v5.js);
   - our compiled entry (elysium-cardfx.json): its tier, every mode (level, fx keys) and each key's ORIGIN on this card -- `compiler`
     when a compile without the curated file gives the key to this card, `hand` when only the hand entry does; the keys a hand entry
     DROPS (the compiler gives them to this card, the entry does not); each hand-only key's row in the sharing register
     (cardfx-sharing.json);
   - the ledger's verdict in this deck (gen-deck-coverage.js's coverDeck: the deck's crypt, the card text's checks on);
   - zero-vtes, at development time only (D-125): read from a checkout OUTSIDE the repository (--zero DIR), and the sheet names the
     commit it read. The definition's modes (windows, actor, requirements, effects), each effect with the number of zero-vtes's card
     definitions that use it ("printed by N", a lower bound on the library: not every card is defined there); the window matrix's
     row and the rulings ledger's rows, both joined by KRCG id;
   - flags, the mechanical disagreements only: a discipline line of KRCG's text with no mode of ours; mode counts that differ between
     ours, the text's discipline lines and zero-vtes's definition; no zero-vtes definition; a hand-only key still in the register's
     backlog. Every other comparison is the reader's: the sheet puts the readings side by side.
   The rule of evidence (spec §5): KRCG's text and the rulings decide, zero-vtes proposes, our compiler is the second opinion. Nothing
   on a sheet is copied into the repository: what is committed is our own reading, each card checked against KRCG's text.

   Usage (from inside bot/): node gen-review-sheet.js --deck KEY --zero DIR [--out FILE]   (FILE outside bot/; default: stdout)
                             node gen-review-sheet.js --self-test                             (fixed inputs: no zero-vtes, no vtes.json) */

const fs = require('fs'), path = require('path'), cp = require('child_process');
const VERSION = '1.0.0';
const here = f => path.join(__dirname, f);

/* ---- names: KRCG's and zero-vtes's spellings meet here (NFKD, the trademark sign, an article moved to the front) ---- */
function normName(s){
  let t = String(s || '').replace(/™/g, '').replace(/\(TM\)/gi, '').normalize('NFKD').replace(/[̀-ͯ]/g, '');   // the sign first: NFKD writes it as TM
  const m = /^(.*), (The|An|A)$/.exec(t); if (m) t = m[2] + ' ' + m[1];
  return t.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/* ---- a small RFC 4180 reader: quoted fields may hold commas, quotes ("") and newlines ---- */
function parseCsv(text){
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++){
    const c = text[i];
    if (q){ if (c === '"'){ if (text[i + 1] === '"'){ f += '"'; i++; } else q = false; } else f += c; continue; }
    if (c === '"') q = true;
    else if (c === ','){ row.push(f); f = ''; }
    else if (c === '\n'){ row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f !== '' || row.length){ row.push(f.replace(/\r$/, '')); rows.push(row); }
  const head = rows.shift() || [];
  return rows.filter(r => r.length > 1 || r[0] !== '').map(r => Object.fromEntries(head.map((h, i) => [h, r[i] === undefined ? '' : r[i]])));
}

/* ---- zero-vtes's definitions (crates/engine/src/cards/defs.rs): every `static NAME: CardDef = CardDef { ... };`, its modes and their
   tokens (Window::, Actor::, Requirement::, Effect::), one level of shared statics resolved. Token inventory, no semantics. ---- */
function matchEnd(src, i, open, close){   // i at `open`; the index after its match (strings, char literals and comments skipped)
  let depth = 0, j = i;
  while (j < src.length){
    const c = src[j];
    if (c === '/' && src[j + 1] === '/'){ const n = src.indexOf('\n', j); j = n < 0 ? src.length : n; continue; }
    if (c === '/' && src[j + 1] === '*'){ const n = src.indexOf('*/', j + 2); j = n < 0 ? src.length : n + 2; continue; }
    if (c === '"'){ j++; while (j < src.length && src[j] !== '"'){ if (src[j] === '\\') j++; j++; } j++; continue; }
    if (c === "'" && /^'(\\.|[^\\'])'/.test(src.slice(j, j + 4))){ j += src[j + 1] === '\\' ? 4 : 3; continue; }
    if (c === open) depth++;
    else if (c === close){ depth--; if (depth === 0) return j + 1; }
    j++;
  }
  return src.length;
}
function topLevelItems(body){   // the comma-separated items of a `[ ... ]` body at depth 0
  const out = []; let depth = 0, start = 0, j = 0;
  while (j < body.length){
    const c = body[j];
    if (c === '"'){ j++; while (j < body.length && body[j] !== '"'){ if (body[j] === '\\') j++; j++; } j++; continue; }
    if (c === '/' && body[j + 1] === '/'){ const n = body.indexOf('\n', j); j = n < 0 ? body.length : n; continue; }
    if (c === "'" && /^'(\\.|[^\\'])'/.test(body.slice(j, j + 4))){ j += body[j + 1] === '\\' ? 4 : 3; continue; }   // a char literal: '}' is no brace
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0){ out.push(body.slice(start, j)); start = j + 1; }
    j++;
  }
  out.push(body.slice(start));
  return out.map(s => s.trim()).filter(Boolean);
}
/* an effect whose first argument is an enum variant is that variant's effect: Effect::Layer(Modifier::PreyOpenHand) is
   Layer(PreyOpenHand), not one of the 409 layers; a number stays out (AddStealth(1) and AddStealth(2) are one kind) */
const TOK = /\b(Window|Actor|Requirement|Effect)::(\w+)(?:\(\s*\w+::(\w+))?/g;
function tokensOf(text, ctx, seen){   // { Window, Actor, Requirement, Effect }: the text's own, and one level of shared statics and macros
  const t = { Window: new Set(), Actor: new Set(), Requirement: new Set(), Effect: new Set() };
  const add = x => { for (const m of x.matchAll(TOK)) t[m[1]].add(m[1] === 'Effect' && m[3] ? m[2] + '(' + m[3] + ')' : m[2]); };
  add(text);
  for (const r of new Set([...text.matchAll(/\b([A-Z][A-Z0-9_]{3,})\b/g)].map(m => m[1]))){
    if (seen.has(r) || !ctx.statics.has(r) || ctx.statics.get(r).kind === 'CardDef') continue;
    add(ctx.statics.get(r).body);
  }
  for (const r of new Set([...text.matchAll(/\b([a-z_]+)!\(/g)].map(m => m[1]))) if (ctx.macros.has(r)) add(ctx.macros.get(r));
  return t;
}
function itemsOf(body, field, ctx){   // a CardDef's `modes:` or `abilities:` as items: a literal list, a static's list, or a macro's body (one item)
  const mi = body.search(new RegExp('\\b' + field + ':\\s*')); if (mi < 0) return [];
  const rest = body.slice(mi).replace(new RegExp('^' + field + ':\\s*'), '');
  const b = rest.indexOf('[');
  if (b >= 0 && b < 3) return topLevelItems(rest.slice(b + 1, matchEnd(rest, b, '[', ']') - 1));
  const mac = /^([a-z_]+)!\(/.exec(rest); if (mac && ctx.macros.has(mac[1])) return [ctx.macros.get(mac[1]) + rest.slice(0, matchEnd(rest, rest.indexOf('('), '(', ')'))];
  const ref = /^&?([A-Z][A-Z0-9_]+)/.exec(rest);
  if (ref && ctx.statics.has(ref[1])){ const sb = ctx.statics.get(ref[1]).body; return sb.startsWith('[') ? topLevelItems(sb.slice(1, -1)) : [sb]; }
  return [];
}
function parseDefs(src){
  const statics = new Map(), macros = new Map(), ctx = { statics, macros };
  for (const m of src.matchAll(/^macro_rules!\s+(\w+)\s*\{/gm)){ const o = src.indexOf('{', m.index); macros.set(m[1], src.slice(o, matchEnd(src, o, '{', '}'))); }
  for (const m of src.matchAll(/^(?:pub(?:\([^)]*\))? )?static (\w+): (&?\[?\w+)[^=]*= /gm)){
    const k = m[2].replace(/[&[]/g, ''), at = m.index + m[0].length;
    const open = src.slice(at).search(/[{[(]/); if (open < 0 || open > 80) continue;
    const o = at + open, ch = src[o], cl = ch === '{' ? '}' : ch === '[' ? ']' : ')';
    statics.set(m[1], { kind: k, body: src.slice(o, matchEnd(src, o, ch, cl)) });
  }
  const cardDefs = [];
  for (const [name, s] of statics){
    if (s.kind !== 'CardDef') continue;
    const nm = /\bname:\s*"((?:[^"\\]|\\.)*)"/.exec(s.body); if (!nm) continue;
    cardDefs.push({ static: name, name: nm[1].replace(/\\"/g, '"'), body: s.body, args: '', macro: null });
  }
  for (const m of src.matchAll(/^([a-z_]+)!\(\s*([A-Z][A-Z0-9_]+)\s*,\s*"((?:[^"\\]|\\.)*)"/gm)){   // a card a macro builds: hunting_ground!(NAME, "Printed")
    const mb = macros.get(m[1]); if (!mb || !/\bCardDef\b/.test(mb)) continue;
    const o = src.indexOf('(', m.index);
    cardDefs.push({ static: m[2], name: m[3].replace(/\\"/g, '"'), body: mb, args: src.slice(o, matchEnd(src, o, '(', ')')), macro: m[1] });
  }
  const defs = new Map(), effUse = new Map();
  for (const c of cardDefs){
    const seen = new Set([c.static]), one = it => { const t = tokensOf(it, ctx, seen); return { windows: [...t.Window], actor: [...t.Actor], reqs: [...t.Requirement], effects: [...t.Effect] }; };
    const all = tokensOf(c.body + c.args, ctx, seen), argE = [...tokensOf(c.args, ctx, seen).Effect];
    const d = { static: c.static, name: c.name, macro: c.macro, modes: itemsOf(c.body, 'modes', ctx).map(one), abilities: itemsOf(c.body, 'abilities', ctx).map(one), argEffects: argE, effects: [...all.Effect], windows: [...all.Window] };
    const k = normName(c.name); if (!defs.has(k)) defs.set(k, d);
    for (const e of d.effects) effUse.set(e, (effUse.get(e) || 0) + 1);
  }
  return { defs, effUse };
}

/* ---- our side: each key's origin on this card, the dropped keys, the register's rows ---- */
const fxKeysOf = e => { const s = new Set(); if (!e) return s;
  for (const mo of (e.modes || [])) for (const k of Object.keys((mo && mo.fx) || {})) s.add(k);
  if (e.ref && e.ref.fx) for (const k of Object.keys(e.ref.fx)) s.add(k);
  return s; };
function keyOrigins(entry, autoEntry){   // { key: 'compiler' | 'hand' }, dropped: [keys the compiler gives this card that the entry lacks]
  const ours = fxKeysOf(entry), auto = fxKeysOf(autoEntry), origin = {};
  for (const k of ours) origin[k] = auto.has(k) ? 'compiler' : 'hand';
  return { origin, dropped: entry && entry.src === 'hand' ? [...auto].filter(k => !ours.has(k)).sort() : [] };
}
function registerState(reg, key){
  if (!reg) return null;
  if ((reg.backlog || []).includes(key)) return 'backlog';
  if (reg.shared && Object.prototype.hasOwnProperty.call(reg.shared, key)) return 'shared with ' + reg.shared[key].join(', ');
  if (reg.unique && Object.prototype.hasOwnProperty.call(reg.unique, key)) return 'unique';
  return 'no row';
}
const discLines = text => String(text || '').split('\n').filter(l => /^\s*\[[a-zA-Z]{3,4}\]/.test(l)).length;

/* ---- the sheet ---- */
function sheet(o){
  const COV = require('./gen-deck-coverage.js'), SH = require('./cardfx-sharing.js');
  const cards = JSON.parse(fs.readFileSync(here('vtes.json'), 'utf8'));
  const byName = new Map(); for (const c of cards) for (const n of [c.name, c.printed_name, c._name].concat(c.name_variants || [])) if (n && !byName.has(n)) byName.set(n, c);
  const auto = require('./cardfx-compile.js').compile(cards, null).out.lib;
  let reg = null; try { reg = JSON.parse(fs.readFileSync(here('cardfx-sharing.json'), 'utf8')); } catch (e){ reg = null; }
  const handOnly = SH.handOnlyKeys(COV.fx.lib);
  const deck = JSON.parse(fs.readFileSync(here('deck-' + o.deck + '.json'), 'utf8'));
  const textOf = (canon, name) => { const k = byName.get(canon) || byName.get(name); return k ? (k.card_text || '') : null; };
  const { libRows } = COV.coverDeck(deck, textOf);
  const zsrc = fs.readFileSync(path.join(o.zero, 'crates', 'engine', 'src', 'cards', 'defs.rs'), 'utf8');
  const { defs, effUse } = parseDefs(zsrc);
  const wm = new Map(parseCsv(fs.readFileSync(path.join(o.zero, 'data', 'window-matrix-reviewed.csv'), 'utf8')).map(r => [String(r.id), r]));
  const rl = new Map(); for (const r of parseCsv(fs.readFileSync(path.join(o.zero, 'data', 'rulings-v5.csv'), 'utf8'))){ const k = String(r.card_id); if (!rl.has(k)) rl.set(k, []); rl.get(k).push(r); }
  let commit = '?'; try { commit = cp.execFileSync('git', ['-C', o.zero, 'log', '-1', '--format=%h %cs %s'], { encoding: 'utf8' }).trim(); } catch (e){ commit = '? (not a git checkout)'; }
  const L = [], P = s => L.push(s), rows = [];
  for (const r of libRows){
    const kc = byName.get(r.canon) || byName.get(r.name) || null, e = r.e, ae = r.canon ? auto[r.canon] : null;
    const { origin, dropped } = keyOrigins(e, ae), zd = kc ? defs.get(normName(kc.printed_name || kc.name)) || defs.get(normName(kc.name)) : defs.get(normName(r.name));
    const ourModes = ((e && e.modes) || []).length, textModes = kc ? discLines(kc.card_text) : 0, zModes = zd ? zd.modes.length : null;
    const flags = [];
    r.per.filter(p => p.textLine && p.fxKeys === 'no mode').forEach(p => flags.push('the text\'s [' + p.at + '] line has no mode of ours'));
    if (!zd) flags.push('no zero-vtes definition');
    if (zd && textModes && zModes !== textModes) flags.push('zero-vtes has ' + zModes + ' mode(s), the text ' + textModes + ' discipline line(s)');
    if (textModes && ourModes !== textModes && !flags.some(f => /has no mode of ours/.test(f))) flags.push('ours has ' + ourModes + ' mode(s), the text ' + textModes + ' discipline line(s)');
    const backlog = Object.keys(origin).filter(k => handOnly.has(k) && registerState(reg, k) === 'backlog');
    if (backlog.length) flags.push('hand-only key(s) in the backlog: ' + backlog.join(', '));
    rows.push({ r, kc, e, origin, dropped, zd, flags, handN: Object.keys(origin).filter(k => handOnly.has(k)).length });
  }
  P('# Review sheet: ' + (deck.name || o.deck) + ' (`' + o.deck + '`)');
  P('');
  P('`gen-review-sheet.js` v' + VERSION + ' · bot v' + require('./elysium-bot.js').BOT_VERSION + ' · cardfx ' + (COV.fx.counts.curated || '?') + ' curated · zero-vtes `' + commit + '` (' + defs.size + ' definitions) · ' + libRows.length + ' library cards. Generated, never committed (spec-card-sweep §3.1). KRCG\'s text and the rulings decide, zero-vtes proposes, our compiler is the second opinion.');
  P('');
  P('| card | × | verdict | tier | our keys (hand-only) | zero-vtes modes | effects printed by 1 | flags |'); P('|---|---:|---|---|---|---:|---|---|');
  for (const x of rows){
    const uniq = x.zd ? x.zd.effects.filter(ef => effUse.get(ef) === 1) : [];
    P('| ' + [x.kc ? (x.kc.printed_name || x.kc.name) : x.r.name, x.r.qty, x.r.verdict, x.e ? (x.e.handler ? 'handler' : x.e.src === 'hand' ? 'curated' : 'auto') : '—',
      Object.keys(x.origin).length + ' (' + x.handN + ')', x.zd ? x.zd.modes.length : '—', uniq.join(', ') || '—', x.flags.length].join(' | ') + ' |');
  }
  P('');
  for (const x of rows){
    const kc = x.kc, nm = kc ? (kc.printed_name || kc.name) : x.r.name;
    P('## ' + nm + ' — ' + (kc ? (kc.types || []).join('/') : '?') + ' · ×' + x.r.qty + ' · ' + x.r.verdict);
    P('');
    if (kc){
      P('**KRCG** (id ' + kc.id + '; ' + [kc.blood_cost ? kc.blood_cost + ' blood' : '', kc.pool_cost ? kc.pool_cost + ' pool' : ''].filter(Boolean).join(', ') + (kc.blood_cost || kc.pool_cost ? '; ' : '') + (kc.rulings || []).length + ' rulings):');
      P(''); String(kc.card_text || '').split('\n').forEach(l => P('> ' + l)); P('');
    } else P('**KRCG**: no text for the name.\n');
    const modes = ((x.e && x.e.modes) || []).map(mo => '`[' + (mo.at || '—') + ']` ' + (Object.keys(mo.fx || {}).map(k => k + (x.origin[k] === 'hand' ? '*' : '')).join(', ') || '(no fx)'));
    P('**Ours** (' + (x.e ? (x.e.handler ? 'handler ' + x.e.handler : x.e.src === 'hand' ? 'curated' : 'auto') : 'no entry') + '; * = a key only the hand entry gives this card): ' + (modes.join(' · ') || 'no modes') +
      (x.e && x.e.ref && x.e.ref.fx ? ' · ref ' + Object.keys(x.e.ref.fx).join(', ') : '') + (x.dropped.length ? ' · **dropped** from the compile: ' + x.dropped.join(', ') : '') + '.');
    const hk = Object.keys(x.origin).filter(k => x.origin[k] === 'hand');
    if (hk.length) P('Register: ' + hk.map(k => '`' + k + '` ' + (SH.handOnlyKeys(COV.fx.lib).has(k) ? registerState(reg, k) : 'not hand-only (the compiler gives it to other cards)')).join(' · ') + '.');
    P('');
    if (x.zd){
      const line = (m, i, tag) => P(tag + (i + 1) + '. ' + (m.windows.join('/') || '—') + ' · ' + (m.actor.join('/') || '—') + (m.reqs.length ? ' · requires ' + m.reqs.join(', ') : '') + ' → ' + (m.effects.map(ef => ef + ' (' + effUse.get(ef) + ')').join(', ') || 'no effect'));
      P('**zero-vtes** (`' + x.zd.static + '`' + (x.zd.macro ? ', built by `' + x.zd.macro + '!`' : '') + '; ' + x.zd.modes.length + ' mode(s)' + (x.zd.abilities.length ? ', ' + x.zd.abilities.length + ' in-play ability(ies)' : '') + '; the number after an effect: the definitions that use it):');
      x.zd.modes.forEach((m, i) => line(m, i, ''));
      x.zd.abilities.forEach((m, i) => line(m, i, 'ability '));
      if (x.zd.macro && x.zd.argEffects.length) P('the macro\'s own arguments → ' + x.zd.argEffects.map(ef => ef + ' (' + effUse.get(ef) + ')').join(', '));
    } else P('**zero-vtes**: no definition.');
    const w = kc && wm.get(String(kc.id)), rr = kc ? rl.get(String(kc.id)) || [] : [];
    P('Window matrix: ' + (w ? w.windows + (w.flags ? ' (' + w.flags + ')' : '') + (w.review && w.review !== 'ok' ? ' — review: ' + w.review : '') : '—') + ' · rulings ledger: ' + rr.length +
      (rr.length ? ' (' + Object.entries(rr.reduce((a, q) => { const s = String(q.status || '').split(':')[0] || '?'; a[s] = (a[s] || 0) + 1; return a; }, {})).map(([s, n]) => s + ' ' + n).join(', ') + ')' : '') + '.');
    P('');
    P('**Flags:** ' + (x.flags.join('; ') || 'none') + '.');
    P('');
    P('**Split** (the reader fills it: T1 a key the compiler gives · T2 shared, who else prints it · T3 the remainder):');
    P('');
  }
  return L.join('\n');
}

function selfTest(quiet){
  let of = 0, bad = 0; const eq = (a, b, what) => { of++; if (JSON.stringify(a) === JSON.stringify(b)) return; bad++; console.error('gen-review-sheet self-test FAIL ' + what + ': ' + JSON.stringify(a) + ' != ' + JSON.stringify(b)); };
  eq([normName('Pentex™ Subversion'), normName('Pentex(TM) Subversion'), normName('Barrens, The'), normName('Flávio')], ['pentex subversion', 'pentex subversion', 'the barrens', 'flavio'], 'names');
  eq(parseCsv('id,name,review\n1,"a, b",ok\n2,"say ""x""\nand y",\n'), [{ id: '1', name: 'a, b', review: 'ok' }, { id: '2', name: 'say "x"\nand y', review: '' }], 'csv: commas, quotes, a newline in a field');
  const src = [
    '/// "Only usable after action resolution. {not a brace}"',
    'pub static FREAK: CardDef = CardDef {',
    '    name: "Freak Drive",',
    '    modes: &[',
    '        mode_of(&[Window::ActionAfterResolution], Actor::ActingMinion, &[Requirement::ActionSuccessful], &[Effect::UnlockActor]),',
    '        mode_of(&[Window::ActionAfterResolution], Actor::ActingMinion, &[Requirement::ActionBlocked], &[Effect::UnlockActor]),',
    '    ],',
    '    ..CARD',
    '};',
    'static STEALTH_ONE: ModeDef = mode_of(&[Window::ActionStealthIntercept], Actor::ActingMinion, &[], &[Effect::Stealth(1)]);',
    'pub static CLOAK: CardDef = CardDef { name: "Cloak the Gathering", modes: &[STEALTH_ONE, ModeDef { target: x(\'}\'), ..mode_of(&[Window::ActionStealthIntercept], Actor::ActingMinion, &[Requirement::Superior], &[Effect::Stealth(2), Effect::UnlockActor]) }], ..CARD };',
    'pub static SHARED_MODES: CardDef = CardDef { name: "Shared, The", modes: &FREAK_MODES_X, ..CARD };' ].join('\n');
  const src2 = src + '\n' + [
    'macro_rules! ground_pick { ($n:expr) => { mode_of(&[Window::UnlockPhaseOwn], Actor::Controller, &[], &[Effect::HuntingGroundBlood($n)]) }; }',
    'macro_rules! ground { ($name:ident, $printed:expr) => { pub static $name: CardDef = CardDef { name: $printed, modes: &[ground_pick!(1)], ..CARD }; }; }',
    'ground!(ASYLUM, "Asylum Hunting Ground");',
    'ground!(PALLA, "Palla Grande");',
    'pub static DOLL: CardDef = CardDef { name: "Blood Doll", modes: &[mode_of(&[Window::MasterPhase], Actor::Methuselah, &[], &[Effect::PutOnTarget])], abilities: &[mode_of(&[Window::MasterPhase], Actor::Controller, &[], &[Effect::MoveBlood])], ..CARD };' ].join('\n');
  const z = parseDefs(src2), fd = z.defs.get('freak drive'), cl = z.defs.get('cloak the gathering');
  eq([z.defs.size, fd.modes.length, fd.modes[1].reqs, fd.effects], [6, 2, ['ActionBlocked'], ['UnlockActor']], 'defs: a card, its two modes, the comment\'s brace skipped');
  const ag = z.defs.get('asylum hunting ground'), bd = z.defs.get('blood doll');
  eq([ag.macro, ag.modes.length, ag.effects, z.effUse.get('HuntingGroundBlood')], ['ground', 1, ['HuntingGroundBlood'], 2], 'defs: a card a macro builds, its nested macro resolved, shared by two');
  eq([bd.modes[0].effects, bd.abilities.length, bd.abilities[0].effects], [['PutOnTarget'], 1, ['MoveBlood']], 'defs: an in-play ability apart from the modes');
  const z3 = parseDefs('pub static R: CardDef = CardDef { name: "Rev", modes: &[mode_of(&[], Actor::ActingMinion, &[], &[Effect::DeclareAction(ActionKind::Card), Effect::AddStealth(1), Effect::Layer(Modifier::PreyOpenHand)])], ..CARD };');
  eq(z3.defs.get('rev').effects, ['DeclareAction(Card)', 'AddStealth', 'Layer(PreyOpenHand)'], 'an enum argument names the effect, a number does not');
  eq([cl.modes.length, cl.modes[0].effects, cl.modes[1].effects, cl.modes[1].reqs], [2, ['Stealth'], ['Stealth', 'UnlockActor'], ['Superior']], 'defs: a shared static resolved in a mode, a char literal brace skipped');
  eq([z.effUse.get('UnlockActor'), z.effUse.get('Stealth')], [2, 1], 'printed by N: definitions that use the effect');
  eq(z.defs.get('the shared').modes.length, 0, 'defs: modes by a reference no static defines are none, not a crash');
  const e = { src: 'hand', modes: [{ at: 'for', fx: { unlock: true, actAgain: 1 } }] }, a = { src: 'auto', modes: [{ at: 'for', fx: { unlock: true, stealth: 1 } }] };
  eq(keyOrigins(e, a), { origin: { unlock: 'compiler', actAgain: 'hand' }, dropped: ['stealth'] }, 'origins: compiler, hand, and the dropped key');
  eq(keyOrigins(a, a).dropped, [], 'an auto entry drops nothing');
  eq([registerState({ backlog: ['k'] }, 'k'), registerState({ shared: { k: ['A', 'B'] } }, 'k'), registerState({ unique: { k: ['A'] } }, 'k'), registerState({}, 'k')], ['backlog', 'shared with A, B', 'unique', 'no row'], 'the register\'s states');
  eq(discLines('Only usable after action resolution.\n[for] One.\n[FOR] Two.'), 2, 'discipline lines');
  if (!quiet || bad) console.log('gen-review-sheet --self-test: ' + (of - bad) + ' of ' + of + ' checks' + (bad ? ' -- FAILED' : ' passed'));
  return bad;
}

if (require.main === module){
  const a = process.argv.slice(2), o = { deck: null, zero: null, out: null };
  for (let i = 0; i < a.length; i++){
    if (a[i] === '--self-test') process.exit(selfTest() ? 1 : 0);
    else if (a[i] === '--deck') o.deck = a[++i];
    else if (a[i] === '--zero') o.zero = path.resolve(a[++i]);
    else if (a[i] === '--out') o.out = path.resolve(a[++i]);
    else if (a[i] === '--help' || a[i] === '-h'){ console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]); process.exit(0); }
    else { console.error('gen-review-sheet: unknown argument ' + a[i]); process.exit(2); }
  }
  if (!o.deck || !o.zero){ console.error('gen-review-sheet: --deck KEY and --zero DIR are both needed (zero-vtes: a checkout outside the repository; HOWTO)'); process.exit(2); }
  if (!fs.existsSync(path.join(o.zero, 'crates', 'engine', 'src', 'cards', 'defs.rs'))){ console.error('gen-review-sheet: no crates/engine/src/cards/defs.rs under ' + o.zero); process.exit(2); }
  if (o.out && path.resolve(o.out).startsWith(path.resolve(__dirname) + path.sep)){ console.error('gen-review-sheet: the sheet is never written inside bot/ (spec-card-sweep §3.1): write it to scratch'); process.exit(2); }
  if (selfTest(true)){ console.error('gen-review-sheet: the self-test failed -- no sheet written'); process.exit(1); }
  const text = sheet(o);
  if (o.out){ fs.writeFileSync(o.out, text); console.error('gen-review-sheet v' + VERSION + ': ' + o.deck + ' -> ' + o.out); } else process.stdout.write(text + '\n');
}
module.exports = { VERSION, normName, parseCsv, parseDefs, keyOrigins, registerState, discLines };
