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

   Usage (from inside bot/): node gen-review-sheet.js --deck KEY --zero DIR [--out FILE]   (DIR and FILE outside the repository;
                             FILE's default: stdout)
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
   tokens (Window::, Actor::, Requirement::, Effect::, Terms::), one level of shared `static` and `const` items, macros and `const fn`
   helpers (defs.rs's own and cards/mod.rs's) resolved. Token inventory, no semantics. ---- */
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
const TOK = /\b(Window|Actor|Requirement|Effect|Terms)::(\w+)(?:\(\s*\w+::(\w+))?/g;   // Terms: what an ability asks (The Barrens' discard is Terms::Discard, no Effect)
function tokensOf(text, ctx, seen){   // { Window, Actor, Requirement, Effect }: the text's own, and what its shared items, macros and helpers hold
  const t = { Window: new Set(), Actor: new Set(), Requirement: new Set(), Effect: new Set() }, done = new Set(seen);
  const add = x => { for (const m of x.matchAll(TOK)){ if (m[1] === 'Terms') t.Effect.add('Terms:' + m[2]); else t[m[1]].add(m[1] === 'Effect' && m[3] ? m[2] + '(' + m[3] + ')' : m[2]); } };
  const walk = (x, depth) => {   // a shared item built by a helper, a helper calling a helper: followed four levels deep, each item once
    add(x); if (depth >= 4) return;
    for (const r of new Set([...x.matchAll(/\b([A-Z][A-Z0-9_]{3,})\b/g)].map(m => m[1]))){
      if (done.has(r) || !ctx.statics.has(r) || ctx.statics.get(r).kind === 'CardDef') continue;
      done.add(r); walk(ctx.statics.get(r).body, depth + 1);
    }
    for (const r of new Set([...x.matchAll(/\b([a-z_]+)!\(/g)].map(m => m[1]))) if (ctx.macros.has(r) && !done.has(r + '!')){ done.add(r + '!'); walk(ctx.macros.get(r), depth + 1); }
    for (const r of new Set([...x.matchAll(/\b([a-z_][a-z_0-9]*)\(/g)].map(m => m[1]))) if (ctx.fns.has(r) && !done.has(r + '()')){ done.add(r + '()'); walk(ctx.fns.get(r), depth + 1); }   // bleed(1, true) is a bleed modifier
  };
  walk(text, 0);
  return t;
}
function itemsOf(body, field, ctx){   // a CardDef's `modes:` or `abilities:` as items: a literal list, a static's list, or a macro's body (one item)
  const mi = body.search(new RegExp('\\b' + field + ':\\s*')); if (mi < 0) return [];
  const rest = body.slice(mi).replace(new RegExp('^' + field + ':\\s*'), '');
  const b = rest.indexOf('[');
  if (b >= 0 && b < 3) return topLevelItems(rest.slice(b + 1, matchEnd(rest, b, '[', ']') - 1));
  const mac = /^([a-z_]+)!\(/.exec(rest); if (mac && ctx.macros.has(mac[1])) return [ctx.macros.get(mac[1]) + rest.slice(0, matchEnd(rest, rest.indexOf('('), '(', ')'))];
  const ref = /^&?([A-Z][A-Z0-9_]+)/.exec(rest);
  if (ref && ctx.statics.has(ref[1])){ const sb = ctx.statics.get(ref[1]).body.replace(/^&\s*/, ''); return sb.startsWith('[') ? topLevelItems(sb.slice(1, -1)) : [sb]; }
  return [];
}
function parseDefs(src, helpers){   // helpers: more source read for its `const fn` helpers only (cards/mod.rs)
  const statics = new Map(), macros = new Map(), fns = new Map(), ctx = { statics, macros, fns };
  for (const m of src.matchAll(/^macro_rules!\s+(\w+)\s*\{/gm)){ const o = src.indexOf('{', m.index); macros.set(m[1], src.slice(o, matchEnd(src, o, '{', '}'))); }
  for (const t of [src, helpers || '']) for (const m of t.matchAll(/^(?:pub(?:\([^)]*\))? )?const fn ([a-z_0-9]+)\s*\(/gm)){ const o = t.indexOf('{', m.index); if (o > 0 && !fns.has(m[1])) fns.set(m[1], t.slice(o, matchEnd(t, o, '{', '}'))); }
  for (const m of src.matchAll(/^(?:pub(?:\([^)]*\))? )?(?:static|const) ([A-Z][A-Z0-9_]*): (&?\[?\w+)[^=]*= /gm)){   // a `const` item is shared like a `static`
    const k = m[2].replace(/[&[]/g, ''), at = m.index + m[0].length;
    const open = src.slice(at).search(/[{[(]/); if (open < 0 || open > 80) continue;
    const o = at + open, ch = src[o], cl = ch === '{' ? '}' : ch === '[' ? ']' : ')';
    statics.set(m[1], { kind: k, body: src.slice(at, matchEnd(src, o, ch, cl)).trim() });   // from after `= `: `Effect::Tick(..)` and `boost(..)` keep their head
  }
  const cardDefs = [];
  for (const [name, s] of statics){
    if (s.kind !== 'CardDef') continue;
    const nm = /\bname:\s*"((?:[^"\\]|\\.)*)"/.exec(s.body); if (!nm || !nm[1]) continue;   // a template (name "") is no card
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
  const zsrc = fs.readFileSync(path.join(o.zero, 'crates', 'engine', 'src', 'cards', 'defs.rs'), 'utf8'), zmod = path.join(o.zero, 'crates', 'engine', 'src', 'cards', 'mod.rs');
  const { defs, effUse } = parseDefs(zsrc, fs.existsSync(zmod) ? fs.readFileSync(zmod, 'utf8') : '');
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

/* ---- the repository guard: a zero-vtes clone and a sheet stay OUTSIDE the repository (spec-card-sweep §3.1, §5). A path is followed
   through symlinks (its nearest existing ancestor's real path: an --out file need not exist yet) and, where the file system folds
   case (win32, darwin), compared without it. ---- */
function realish(p){
  let cur = path.resolve(p); const rest = [];
  for (let hops = 0; hops < 64; hops++){   // a link, dangling or not, is followed to its target: writing through it lands there
    let st = null; try { st = fs.lstatSync(cur); } catch (e){ st = null; }
    if (st && st.isSymbolicLink()){ cur = path.resolve(path.dirname(cur), fs.readlinkSync(cur)); continue; }
    if (st) break;
    const up = path.dirname(cur); if (up === cur) break; rest.unshift(path.basename(cur)); cur = up;
  }
  let real = cur; try { real = fs.realpathSync.native(cur); } catch (e){ real = cur; }
  return path.join(real, ...rest);
}
function insideRepo(p, repo, fold){
  const f = x => (fold ? x.toLowerCase() : x), a = f(realish(p)), r = f(realish(repo));
  return a === r || a.startsWith(r + path.sep);
}

/* the self-test's fixtures are invented: card names, statics and every token's variant are made up for the parser's paths; only the
   format's structural words (CardDef, ModeDef, mode_of, the five token families, `..CARD`) are zero-vtes's, because the parser reads them */
function selfTest(quiet){
  let of = 0, bad = 0, skipped = 0; const eq = (a, b, what) => { of++; if (JSON.stringify(a) === JSON.stringify(b)) return; bad++; console.error('gen-review-sheet self-test FAIL ' + what + ': ' + JSON.stringify(a) + ' != ' + JSON.stringify(b)); };
  eq([normName('Pentex™ Subversion'), normName('Pentex(TM) Subversion'), normName('Barrens, The'), normName('Flávio')], ['pentex subversion', 'pentex subversion', 'the barrens', 'flavio'], 'names');
  eq(parseCsv('id,name,review\n1,"a, b",ok\n2,"say ""x""\nand y",\n'), [{ id: '1', name: 'a, b', review: 'ok' }, { id: '2', name: 'say "x"\nand y', review: '' }], 'csv: commas, quotes, a newline in a field');
  const src = [
    '/// "A comment with {a brace} in it."',
    'pub static ALPHA: CardDef = CardDef {',
    '    name: "Alpha Card",',
    '    modes: &[',
    '        mode_of(&[Window::WinOne], Actor::WhoOne, &[Requirement::NeedOne], &[Effect::DoOne]),',
    '        mode_of(&[Window::WinOne], Actor::WhoOne, &[Requirement::NeedTwo], &[Effect::DoOne]),',
    '    ],',
    '    ..CARD',
    '};',
    'static SHARED_STEP: ModeDef = mode_of(&[Window::WinTwo], Actor::WhoOne, &[], &[Effect::DoTwo(1)]);',
    'pub static BETA: CardDef = CardDef { name: "Beta Card", modes: &[SHARED_STEP, ModeDef { target: x(\'}\'), ..mode_of(&[Window::WinTwo], Actor::WhoOne, &[Requirement::NeedThree], &[Effect::DoTwo(2), Effect::DoOne]) }], ..CARD };',
    'pub static GAMMA: CardDef = CardDef { name: "Gamma, The", modes: &UNKNOWN_MODES, ..CARD };',
    'pub const TEMPLATE: CardDef = CardDef { name: "", modes: &[], ..CARD };' ].join('\n');
  const src2 = src + '\n' + [
    'macro_rules! plot_pick { ($n:expr) => { mode_of(&[Window::WinThree], Actor::WhoTwo, &[], &[Effect::Gather($n)]) }; }',
    'macro_rules! plot { ($name:ident, $printed:expr) => { pub static $name: CardDef = CardDef { name: $printed, modes: &[plot_pick!(1)], ..CARD }; }; }',
    'plot!(PLOT_A, "Plot Card A");',
    'plot!(PLOT_B, "Plot Card B");',
    'pub static DELTA: CardDef = CardDef { name: "Delta Card", modes: &[mode_of(&[Window::WinFour], Actor::WhoTwo, &[], &[Effect::PutDown])], abilities: &[mode_of(&[Window::WinFour], Actor::WhoThree, &[], &[Effect::Shift])], ..CARD };' ].join('\n');
  const z = parseDefs(src2), al = z.defs.get('alpha card'), be = z.defs.get('beta card');
  eq([z.defs.size, al.modes.length, al.modes[1].reqs, al.effects], [6, 2, ['NeedTwo'], ['DoOne']], 'defs: a card, its two modes, the comment\'s brace skipped, a template with no name no card');
  const pa = z.defs.get('plot card a'), de = z.defs.get('delta card');
  eq([pa.macro, pa.modes.length, pa.effects, z.effUse.get('Gather')], ['plot', 1, ['Gather'], 2], 'defs: a card a macro builds, its nested macro resolved, shared by two');
  eq([de.modes[0].effects, de.abilities.length, de.abilities[0].effects], [['PutDown'], 1, ['Shift']], 'defs: an in-play ability apart from the modes');
  const z3 = parseDefs('pub static E: CardDef = CardDef { name: "Epsilon", modes: &[mode_of(&[], Actor::WhoOne, &[], &[Effect::Begin(Kind::Thing), Effect::Plus(1), Effect::Wrap(Mark::Tilt)])], ..CARD };');
  eq(z3.defs.get('epsilon').effects, ['Begin(Thing)', 'Plus', 'Wrap(Tilt)'], 'an enum argument names the effect, a number does not');
  const z4 = parseDefs('pub static Z: CardDef = CardDef { name: "Lot, The", modes: &[mode_of(&[Window::WinFive], Actor::WhoTwo, &[], &[Effect::PutDown])], abilities: &[ModeDef { terms: Some(Terms::GiveUp { n: 1, of: Pick::Any }), ..mode_of(&[Window::WinSix], Actor::WhoThree, &[Requirement::NeedFour], &[Effect::TapIt]) }], ..CARD };');
  eq(z4.defs.get('the lot').abilities[0].effects.slice().sort(), ['TapIt', 'Terms:GiveUp'], 'an ability\'s terms count as what it does');
  eq([be.modes.length, be.modes[0].effects, be.modes[1].effects, be.modes[1].reqs], [2, ['DoTwo'], ['DoTwo', 'DoOne'], ['NeedThree']], 'defs: a shared static resolved in a mode, a char literal brace skipped');
  eq([z.effUse.get('DoOne'), z.effUse.get('DoTwo')], [2, 1], 'printed by N: definitions that use the effect');
  eq(z.defs.get('the gamma').modes.length, 0, 'defs: modes by a reference no static defines are none, not a crash');
  const z5 = parseDefs(['const STEP_C: ModeDef = mode_of(&[Window::WinSeven], Actor::WhoOne, &[], &[Effect::DoThree]);',
    'const fn helped(n: u8) -> ModeDef { mode_of(&[Window::WinEight], Actor::WhoFour, &[], &[outer(n)]) }',
    'pub static ETA: CardDef = CardDef { name: "Eta Card", modes: &[STEP_C, helped(1)], ..CARD };'].join('\n'), 'pub const fn outer(n: u8) -> Effect { Effect::Outer { n } }');
  const et = z5.defs.get('eta card');
  const z6 = parseDefs(['const TICK_UP: Effect = Effect::Tick(Kind::Up);', 'const BOOST_ONE: Effect = boost(1);', 'const fn boost(n: u8) -> Effect { Effect::Boost { n } }',
    'static THETA_MODES: &[ModeDef] = &[mode_of(&[Window::WinNine], Actor::WhoOne, &[], &[TICK_UP, BOOST_ONE]), mode_of(&[Window::WinTen], Actor::WhoOne, &[], &[Effect::Rest])];',
    'pub static THETA: CardDef = CardDef { name: "Theta Card", modes: THETA_MODES, ..CARD };'].join('\n'));
  eq([z6.defs.get('theta card').modes.length, z6.defs.get('theta card').modes[0].effects, z6.defs.get('theta card').modes[1].effects], [2, ['Tick(Up)', 'Boost'], ['Rest']], 'a shared item that is an effect or a helper call keeps its head; a shared list behind &[...] is its items');
  eq([et.modes.length, et.modes[0].effects, et.modes[1].windows, et.modes[1].effects], [2, ['DoThree'], ['WinEight'], ['Outer']], 'a `const` item shared like a static; a `const fn` helper read, its own call to a helper of the other file too');
  const repo = path.resolve(__dirname, '..');
  eq([insideRepo(path.join(repo, 'bot', 'sheet.md'), repo), insideRepo(path.join(repo, 'no', 'such', 'dir', 'x.md'), repo), insideRepo(path.join(path.dirname(repo), path.basename(repo) + '-old', 'x.md'), repo)], [true, true, false], 'inside the repository: a file in bot/, a path not made yet; a sibling folder that only starts with its name is not');
  eq(insideRepo(repo.toUpperCase() + path.sep + 'x.md', repo, true), true, 'inside the repository: case folded where the file system folds it (win32, darwin)');
  let tmp = null; try { tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'grs-')); fs.symlinkSync(repo, path.join(tmp, 'link'), 'dir'); } catch (e){ tmp = null; }
  if (tmp){ let dang = false; try { fs.symlinkSync(path.join(repo, 'bot', 'no-such-sheet-' + process.pid + '.md'), path.join(tmp, 'dangling.md'), 'file'); dang = true; } catch (e){ dang = false; }
    eq([insideRepo(path.join(tmp, 'link', 'bot', 'x.md'), repo), insideRepo(path.join(tmp, 'x.md'), repo), dang && insideRepo(path.join(tmp, 'dangling.md'), repo)], [true, false, true], 'inside the repository: through a folder symlink, and a dangling file symlink into it');
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e){ /* scratch */ } }
  else { skipped++; console.error('gen-review-sheet self-test: SKIPPED the symlink check (no symlink can be made here)'); }
  const e = { src: 'hand', modes: [{ at: 'for', fx: { unlock: true, actAgain: 1 } }] }, a = { src: 'auto', modes: [{ at: 'for', fx: { unlock: true, stealth: 1 } }] };
  eq(keyOrigins(e, a), { origin: { unlock: 'compiler', actAgain: 'hand' }, dropped: ['stealth'] }, 'origins: compiler, hand, and the dropped key');
  eq(keyOrigins(a, a).dropped, [], 'an auto entry drops nothing');
  eq([registerState({ backlog: ['k'] }, 'k'), registerState({ shared: { k: ['A', 'B'] } }, 'k'), registerState({ unique: { k: ['A'] } }, 'k'), registerState({}, 'k')], ['backlog', 'shared with A, B', 'unique', 'no row'], 'the register\'s states');
  eq(discLines('Only usable after action resolution.\n[for] One.\n[FOR] Two.'), 2, 'discipline lines');
  if (!quiet || bad || skipped) console.log('gen-review-sheet --self-test: ' + (of - bad) + ' of ' + of + ' checks' + (bad ? ' -- FAILED' : ' passed') + (skipped ? ', ' + skipped + ' SKIPPED' : ''));
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
  const repo = path.resolve(__dirname, '..'), fold = process.platform === 'win32' || process.platform === 'darwin', inRepo = f => insideRepo(f, repo, fold);   // bot/ sits at the monorepo's root
  if (inRepo(o.zero)){ console.error('gen-review-sheet: zero-vtes is read from a checkout OUTSIDE the repository (spec-card-sweep §5), not ' + o.zero); process.exit(2); }
  if (!fs.existsSync(path.join(o.zero, 'crates', 'engine', 'src', 'cards', 'defs.rs'))){ console.error('gen-review-sheet: no crates/engine/src/cards/defs.rs under ' + o.zero); process.exit(2); }
  if (o.out && inRepo(o.out)){ console.error('gen-review-sheet: the sheet is never written inside the repository (spec-card-sweep §3.1): write it to scratch'); process.exit(2); }
  if (selfTest(true)){ console.error('gen-review-sheet: the self-test failed -- no sheet written'); process.exit(1); }
  const text = sheet(o);
  if (o.out){ fs.writeFileSync(o.out, text); console.error('gen-review-sheet v' + VERSION + ': ' + o.deck + ' -> ' + o.out); } else process.stdout.write(text + '\n');
}
module.exports = { VERSION, normName, parseCsv, parseDefs, keyOrigins, registerState, discLines, insideRepo };
