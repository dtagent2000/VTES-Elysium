#!/usr/bin/env node
'use strict';
/* gen-cross-check.js v1.0.0 (26 Nov 2026; the V5 sweep's C1: RULINGS D-130, D-132, D-138; docs/specs/spec-card-sweep-2026-11-18.md
   §11.2, §11.7, §11.8) -- THE CROSS-CHECK: our cardfx library against zero-vtes's card definitions (a development-time witness, read
   from a checkout OUTSIDE the repository), card by card and level by level. Generated and never committed: write it to scratch.

   Two reports in one run:
   1. THE FAMILY (`--family`): for each card where either reading carries a family's value, our number at each level beside theirs,
      with a verdict: agree, differ, ours only, theirs only, a formula (X, or a value the definition computes), or a condition (a value
      that applies only "if ...") that one side has and the other lacks. These are the disagreements the readers settle against
      KRCG's text and the rulings (spec §11.2 (5)).
   2. THE FLAGS ("says less"): for each card with a definition, the effects, requirements or actors of a mode that our entry has no
      counterpart for, by the pairing's flag rules -- where the fidelity pass reads by hand (D-138). A flag is a place to look, not
      a verdict: KRCG's text and the rulings decide, zero-vtes proposes, our compiler is the second opinion (spec §5).

   THE PAIRING is `cross-check-pairing.json` beside the tool, committed with it (RULINGS D-140: in a development tool only, never in
   the bundle or the card data; `--pairing FILE` reads another): which of their tokens answer which of our keys. The pairing names
   their effect types; this file holds no zero-vtes identifier but the parser's structural words, and its self-test invents its
   effect names. The pairing's shape (the self-test checks the committed file against it):
     { "family": { "<ours>": { "ours": ["<our fx key>", ...], "theirs": ["<their token>", ...] }, ... },
       "formula": ["<their token whose value is computed>", ...], "formulaOf": { "<formula token>": "<ours>", ... },
       "conditional": ["<their wrapper token whose inner values apply only if ...>"],
       "flags": [ { "name": "...", "what": "...", "theirs": ["<token>", "Req:<token>", "Actor:<token>"], "ours": ["<key>", ...],
                    "unless": ["<their token that makes the flag moot>"], "exceptTypes": ["<our card type the rule skips>"] }, ... ] }
   A token is matched as a call (`Name(3)`, `Name(3, true)`), a struct (`Name { n: 3, ...}`), a stat layer (`Stat:Name` for
   `stat: Stat::Name, n: 3`), or a bare word; `Req:` and `Actor:` prefixes match the mode's requirements and actor. "ours" keys are
   looked for in the mode's `fx`, the mode itself and the entry (`cost`, `req`, `t` ...).

   Levels: their modes follow the order of the discipline lines in KRCG's text; ours carry `at` (`obf` inferior, `OBF` superior,
   `cel+pre` a combined line). A mode pairs with the text's line its `at` names; with no discipline lines, or no `at`, by order.

   Usage (from inside bot/): node gen-cross-check.js --zero DIR [--pairing FILE] [--out FILE.md] [--json FILE] [--decks k1,k2] [--card NAME]
                             node gen-cross-check.js --self-test       (fixed inputs: no zero-vtes, no vtes.json) */

const fs = require('fs'), path = require('path'), cp = require('child_process');
const RS = require('./gen-review-sheet.js');
const VERSION = '1.0.0';
const here = f => path.join(__dirname, f);
const PAIRING = 'cross-check-pairing.json';   // the committed pairing (D-140)

/* ---- their side: a mode's text with its shared items expanded, then the tokens the pairing names, with their numbers ---- */
function expand(text, ctx, depth, seen){   // the shared statics / consts a mode names, inlined (four levels); helpers keep their call text
  seen = seen || new Set();
  if ((depth || 0) >= 4) return text;
  return text.replace(/\b([A-Z][A-Z0-9_]{3,})\b/g, (m, r) => {
    const s = ctx.statics.get(r);
    if (!s || s.kind === 'CardDef' || seen.has(r)) return m;
    const next = new Set(seen); next.add(r);
    return '(' + expand(s.body, ctx, (depth || 0) + 1, next) + ')';
  });
}
function spans(text, word){   // [start, end) of each `word { ... }` block (a conditional wrapper)
  const out = [], re = new RegExp('\\b' + word + '\\s*\\{', 'g'); let m;
  while ((m = re.exec(text))){ const o = text.indexOf('{', m.index); out.push([m.index, RS.matchEnd(text, o, '{', '}')]); }
  return out;
}
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function valuesOf(text, token){   // every occurrence of a token: { at, v } with v a number, 'X' (computed) or true (no number)
  const out = [];
  if (token.startsWith('Stat:')){
    const re = new RegExp('stat:\\s*Stat::' + esc(token.slice(5)) + '\\s*,\\s*n:\\s*(-?\\w+)', 'g');
    for (const m of text.matchAll(re)) out.push({ at: m.index, v: /^-?\d+$/.test(m[1]) ? +m[1] : 'X' });
    return out;
  }
  const re = new RegExp('\\b' + esc(token) + '\\b(\\s*\\(\\s*(-?\\w+)|\\s*\\{\\s*n:\\s*(-?\\w+))?', 'g');
  for (const m of text.matchAll(re)){
    const a = m[2] !== undefined ? m[2] : m[3];
    out.push({ at: m.index, v: a === undefined ? true : /^-?\d+$/.test(a) ? +a : 'X' });
  }
  return out;
}
function theirFamily(mode, ctx, P, stats){   // { key: { base, cond, formula } } for one of their modes; stats: count `Stat:` layers (a card in play)
  const text = expand(mode.text, ctx), cs = [].concat(...(P.conditional || []).map(w => spans(text, w)));
  const inCond = at => cs.some(([a, b]) => at >= a && at < b), res = {};
  for (const [key, f] of Object.entries(P.family || {})){
    let base = null, cond = null, formula = false;
    for (const tok of f.theirs.filter(x => stats !== false || !x.startsWith('Stat:'))) for (const o of valuesOf(text, tok)){
      if (o.v === 'X' || o.v === true){ formula = true; continue; }
      if (inCond(o.at)) cond = (cond || 0) + o.v; else base = (base || 0) + o.v;
    }
    for (const tok of P.formula || []) if (valuesOf(text, tok).some(o => !inCond(o.at)) && (P.formulaOf || {})[tok] === key) formula = true;
    if (base !== null || cond !== null || formula) res[key] = { base, cond, formula };
  }
  return res;
}
function hasToken(mode, ctx, tok, args){   // a flag rule's token in a mode: an effect (call, struct, word), Req:, Actor: (args: a macro-built card's arguments)
  if (tok.startsWith('Req:')) return mode.reqs.includes(tok.slice(4)) || new RegExp('Requirement::' + esc(tok.slice(4)) + '\\b').test(expand(mode.text, ctx));
  if (tok.startsWith('Actor:')) return mode.actor.includes(tok.slice(6));
  return valuesOf(expand(mode.text + (args ? '\n,' + args : ''), ctx), tok).length > 0;
}

/* ---- our side ---- */
const isNum = v => typeof v === 'number' && isFinite(v);
function ourFamily(mo, P, head){   // { key: { base, cond, formula } } for one of our modes; head: the entry's level-free mode, which
  // applies at every level ("+1 stealth action." printed before the discipline lines): a key of the level's own wins, and an action's
  // own stealth is the larger of the two, as the bot reads it (_cardActStealth)
  const own = (mo && mo.fx) || {}, hf = (head && head !== mo && head.fx) || {}, res = {};
  const val = k => k === 'actStealth' && isNum(own[k]) && isNum(hf[k]) ? Math.max(own[k], hf[k]) : own[k] !== undefined ? own[k] : hf[k];
  for (const [key, f] of Object.entries(P.family || {})){
    let base = null, formula = false, cond = null;
    for (const k of f.ours){ const v = val(k); if (v === undefined || v === false || v === null) continue; if (isNum(v)) base = (base || 0) + v; else if (v !== true) formula = true; }
    for (const pi of [own.plusIf, hf.plusIf]) if (pi && pi.add) for (const k of f.ours) if (isNum(pi.add[k])) cond = (cond || 0) + pi.add[k];
    if (base !== null || cond !== null || formula) res[key] = { base, cond, formula };
  }
  return res;
}
const headOf = e => { const ms = (e && e.modes) || []; return ms.some(m => m.at) ? ms.find(m => !m.at) || null : null; };   // a level-free mode beside leveled ones
function oursHas(e, mo, keys){   // a key in the mode's fx, the level-free mode's, the mode, or the entry
  const head = headOf(e);
  for (const k of keys){
    if (mo && mo.fx && mo.fx[k] !== undefined) return true;
    if (head && head.fx && head.fx[k] !== undefined) return true;
    if (mo && mo[k] !== undefined && k !== 'fx' && k !== 'at') return true;
    if (e && e[k] !== undefined) return true;
  }
  return false;
}

/* ---- levels: KRCG's discipline lines, our `at`, their order ---- */
function textLines(text){   // the discipline lines' tags, normalized like our `at`: [cel][pre] -> cel+pre
  return String(text || '').split('\n').filter(l => /^\s*\[[a-zA-Z]{3,4}\]/.test(l)).map(l => {
    const m = /^\s*((?:\[[a-zA-Z]{3,4}\](?:\s*or\s*)?)+)/.exec(l); const tags = (m ? m[1] : '').match(/\[([a-zA-Z]{3,4})\]/g) || [];
    return tags.map(t => t.slice(1, -1)).join(/\bor\b/.test(m ? m[1] : '') ? '|' : '+');
  });
}
function pairModes(e, def, text){   // [{ i, ours, theirs, level }] ; i is the text's line (or the order); null when the levels cannot be paired
  const ours = (e && e.modes) || [], theirs = def ? (def.modes.length ? def.modes : def.abilities) : [], lines = textLines(text), out = [];
  if (!def) return ours.map((mo, i) => ({ i, ours: mo, theirs: null, level: mo.at || '-' }));
  const leveled = ours.filter(mo => mo !== headOf(e));
  if (lines.length ? theirs.length !== lines.length : theirs.length !== leveled.length) return null;   // their modes do not follow the text's lines: by card
  if (lines.length && ours.some(mo => mo.at)){
    const used = new Set(), head = headOf(e);
    for (const mo of ours){
      if (mo === head) continue;   // read into every level (ourFamily), not a level of its own
      let i = lines.indexOf(mo.at); if (i < 0) i = lines.findIndex(l => l.split(/[|+]/).includes(mo.at));
      if (i < 0 || used.has(i)) { out.push({ i: null, ours: mo, theirs: null, level: mo.at || '-' }); continue; }
      used.add(i); out.push({ i, ours: mo, theirs: theirs[i] || null, level: lines[i] });
    }
    lines.forEach((l, i) => { if (!used.has(i) && theirs[i]) out.push({ i, ours: null, theirs: theirs[i], level: l }); });
  } else {
    const n = Math.max(ours.length, theirs.length);
    for (let i = 0; i < n; i++) out.push({ i, ours: ours[i] || null, theirs: theirs[i] || null, level: (ours[i] && ours[i].at) || lines[i] || (n > 1 ? '#' + (i + 1) : '-') });
  }
  return out;
}

/* ---- the cross-check ---- */
const IN_PLAY = new Set(['equip', 'ally', 'retainer', 'master', 'event', 'power', 'location', 'conviction']);   // our types a card stays in play as
function crossCheck(o){   // o: { lib, cards (vtes.json), defs, ctx, P, decks: { key: Set(names) } }
  const byNorm = new Map(); for (const c of o.cards) for (const n of [c.name, c.printed_name, c._name].concat(c.name_variants || [])) if (n && !byNorm.has(RS.normName(n))) byNorm.set(RS.normName(n), c);
  const fam = [], flags = [], seenDefs = new Set();
  for (const [name, e] of Object.entries(o.lib)){
    const k = RS.normName(name), def = o.defs.get(k) || null, kc = byNorm.get(k), text = kc ? kc.card_text : '';
    if (def) seenDefs.add(k);
    const decks = Object.keys(o.decks || {}).filter(d => o.decks[d].has(name)), t = e.t || [];
    const head = headOf(e), inPlay = t.some(x => IN_PLAY.has(x)), stats = inPlay;   // a card in play: its abilities and its bearer's stats are its effect
    const theirOf = m => theirFamily({ text: [m.text].concat(inPlay && def ? def.abilities.map(a => a.text) : [], def && def.macro ? [def.args || ''] : []).join('\n,') }, o.ctx, o.P, stats);   // a macro-built card: its own arguments carry its numbers
    let pms = pairModes(e, def, text), byCard = false;
    if (!pms){   // the levels cannot be paired: the card's values, all levels together (ours from every mode, theirs from every mode)
      byCard = true;
      const merge = list => { const r = {}; for (const f of list) for (const [k, v] of Object.entries(f)){ const x = r[k] || (r[k] = { base: null, cond: null, formula: false, set: new Set() }); x.formula = x.formula || v.formula; if (v.base !== null) x.set.add(v.base); if (v.cond !== null) x.cond = v.cond; } for (const x of Object.values(r)){ x.base = x.set.size ? [...x.set].sort((p, q) => p - q).join('/') : null; delete x.set; } return r; };
      const ofam = merge(((e.modes || []).filter(mo => mo !== head)).map(mo => ourFamily(mo, o.P, head)).concat(head && !(e.modes || []).some(mo => mo !== head) ? [ourFamily(head, o.P, null)] : []));
      const tfam = merge((def.modes.length ? def.modes : def.abilities).map(theirOf));
      pms = [{ i: null, ours: { fx: {} }, theirs: { text: '' }, level: 'all', ofam, tfam }];
    }
    for (const pm of pms){
      const ofam = pm.ofam || (pm.ours ? ourFamily(pm.ours, o.P, head) : {});
      const tfam = pm.tfam || (pm.theirs ? theirOf(pm.theirs) : {});
      for (const key of new Set([...Object.keys(ofam), ...Object.keys(tfam)])){
        const a = ofam[key] || null, b = tfam[key] || null; let verdict;
        if (!def) verdict = 'no definition';
        else if (!pm.theirs) verdict = 'no mode of theirs';
        else if (!pm.ours) verdict = 'no mode of ours';
        else if ((a && a.formula) || (b && b.formula)) verdict = 'formula';
        else if (!a) verdict = 'theirs only';
        else if (!b) verdict = 'ours only';
        else if (a.base !== b.base) verdict = 'differ';
        else if (a.cond !== b.cond) verdict = b.cond !== null && a.cond === null ? 'condition missing' : 'condition differs';
        else verdict = 'agree';
        fam.push({ card: name, t, level: pm.level, key, ours: a, theirs: b, verdict: byCard && verdict !== 'agree' ? verdict + ' (by card)' : verdict, decks, src: e.src || '' });
      }
      if (!def || !pm.theirs || byCard) continue;
      for (const rule of o.P.flags || []){
        if (rule.exceptTypes && t.some(x => rule.exceptTypes.includes(x))) continue;
        const hit = rule.theirs.filter(tok => hasToken(pm.theirs, o.ctx, tok));
        if (!hit.length || (rule.unless || []).some(tok => hasToken(pm.theirs, o.ctx, tok))) continue;
        if (pm.ours ? oursHas(e, pm.ours, rule.ours || []) : oursHas(e, null, rule.ours || [])) continue;
        flags.push({ card: name, t, level: pm.level, flag: rule.name, what: rule.what || '', tokens: hit, ours: pm.ours ? Object.keys(pm.ours.fx || {}) : null, decks, src: e.src || '' });
      }
    }
    if (def && byCard) for (const rule of o.P.flags || []){   // the levels unpaired: a rule hit anywhere in their modes against the whole entry
      if (rule.exceptTypes && t.some(x => rule.exceptTypes.includes(x))) continue;
      const ms = def.modes.length ? def.modes : def.abilities, hit = [...new Set([].concat(...ms.map(m => rule.theirs.filter(tok => hasToken(m, o.ctx, tok)))))];
      if (!hit.length || ms.some(m => (rule.unless || []).some(tok => hasToken(m, o.ctx, tok)))) continue;
      if ((e.modes || []).some(mo => oursHas(e, mo, rule.ours || [])) || oursHas(e, null, rule.ours || [])) continue;
      flags.push({ card: name, t, level: 'all', flag: rule.name, what: rule.what || '', tokens: hit, ours: null, decks, src: e.src || '' });
    }
    const lines = textLines(text), ats = new Set((e.modes || []).map(mo => mo.at).filter(Boolean)), lost = lines.filter(l => !ats.has(l) && !l.split(/[|+]/).some(x => ats.has(x)));
    if (lines.length && lost.length && (e.modes || []).length) flags.push({ card: name, t, level: lost.join(', '), flag: 'level with no mode', what: 'a discipline line of KRCG\'s text that no mode of ours names (' + lines.length + ' lines, ' + ats.size + ' levels of ours)', tokens: [], ours: null, decks, src: e.src || '' });   // KRCG against ours: no definition needed
  }
  return { fam, flags, defsUnjoined: [...o.defs.keys()].filter(k => !seenDefs.has(k)) };
}

/* ---- the report ---- */
const fmtV = v => !v ? '—' : v.formula ? 'X' : (v.base === null ? '' : String(v.base)) + (v.cond !== null ? (v.base === null ? '' : ' ') + '(+' + v.cond + ' if)' : '');
function report(r, meta){
  const L = [], P = s => L.push(s), tally = {};
  for (const x of r.fam) tally[x.verdict] = (tally[x.verdict] || 0) + 1;
  const cards = new Set(r.fam.map(x => x.card)), modReact = r.fam.filter(x => x.t.some(t => t === 'mod' || t === 'react') && x.key !== 'actStealth');
  P('# The cross-check: our cardfx against zero-vtes (scratch; never committed)');
  P('');
  P('gen-cross-check.js v' + VERSION + ' · zero-vtes ' + meta.commit + ' · ' + meta.defs + ' definitions · our library ' + meta.lib + ' entries · pairing `' + meta.pairing + '`');
  P('');
  P('## The family (' + Object.keys(meta.P.family || {}).join(', ') + '): ' + r.fam.length + ' rows on ' + cards.size + ' cards');
  P('');
  P(Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
  P('');
  const mr = {}; for (const x of modReact) mr[x.verdict] = (mr[x.verdict] || 0) + 1;
  P('Modifiers and reactions only (spec §11.7\'s scan): ' + modReact.length + ' rows on ' + new Set(modReact.map(x => x.card)).size + ' cards · ' + Object.entries(mr).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
  P('');
  P('| Card | Level | Key | Ours | Theirs | Verdict | Decks |'); P('|---|---|---|---|---|---|---|');
  const order = ['differ', 'condition missing', 'condition differs', 'ours only', 'theirs only', 'formula', 'no mode of ours', 'no mode of theirs', 'no definition', 'agree'];
  const rank = v => { const i = order.indexOf(v.replace(' (by card)', '')); return i < 0 ? order.length : i; };
  for (const x of r.fam.slice().sort((p, q) => rank(p.verdict) - rank(q.verdict))) if (x.verdict !== 'agree' || meta.all) P('| ' + [x.card, '`' + x.level + '`', x.key, fmtV(x.ours), fmtV(x.theirs), x.verdict, x.decks.join(', ') || '—'].join(' | ') + ' |');
  P('');
  const ft = {}; for (const f of r.flags) ft[f.flag] = (ft[f.flag] || 0) + 1;
  P('## The flags ("says less"): ' + r.flags.length + ' on ' + new Set(r.flags.map(f => f.card)).size + ' cards · ' + Object.entries(ft).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(' · '));
  P('');
  const deckKeys = [...new Set(r.flags.flatMap(f => f.decks))].sort();
  for (const d of deckKeys.concat(['(no deck)'])){
    const fs2 = r.flags.filter(f => d === '(no deck)' ? !f.decks.length : f.decks.includes(d)); if (!fs2.length) continue;
    if (d === '(no deck)' && !meta.all){ P('### ' + d + ': ' + fs2.length + ' flags on ' + new Set(fs2.map(f => f.card)).size + ' cards (`--all` lists them)'); P(''); continue; }
    P('### ' + d + ': ' + fs2.length + ' flags on ' + new Set(fs2.map(f => f.card)).size + ' cards'); P('');
    for (const f of fs2) P('- **' + f.card + '** `' + f.level + '` ' + f.flag + (f.tokens.length ? ' (' + f.tokens.join(', ') + ')' : '') + (f.what ? ': ' + f.what : '') + (f.ours ? ' · ours: ' + (f.ours.join(', ') || 'no fx') : ''));
    P('');
  }
  if (r.defsUnjoined.length && !meta.card) { P('## Definitions with no entry of ours (' + r.defsUnjoined.length + ')'); P(''); P(r.defsUnjoined.slice(0, 60).join(' · ') + (r.defsUnjoined.length > 60 ? ' …' : '')); P(''); }
  return L.join('\n') + '\n';
}

/* ---- the self-test: invented cards, invented effect names; the code that writes the report ---- */
function selfTest(quiet){
  let n = 0, f = 0; const ok = (c, m) => { n++; if (!c){ f++; console.log('  ✗ ' + m); } else if (!quiet) console.log('  ✓ ' + m); };
  const src = [
    'const PLUS_ONE_VEIL: Effect = Effect::Veil(1);',
    'pub static CLOAK_A: CardDef = CardDef { name: "Cloak A", modes: &[ mode_of(&[Window::W], Actor::ActingMinion, &[Requirement::R], &[Effect::Veil(1)]), mode_of(&[Window::W], Actor::ActingMinion, &[], &[Effect::Veil(2), Effect::EndIfCaught]) ], ..CARD };',
    'pub static CLOAK_B: CardDef = CardDef { name: "Cloak B", modes: &[ mode_of(&[Window::W], Actor::ActingMinion, &[], &[PLUS_ONE_VEIL, Effect::Gate { on: On::Actor, requires: &[Requirement::Clan("X")], then: &Effect::Veil(1) }]) ], ..CARD };',
    'pub static WARD_C: CardDef = CardDef { name: "Ward C", modes: &[ mode_of(&[Window::W], Actor::OtherReady, &[], &[Effect::Layer(Modifier::Bearer { stat: Stat::Guard, n: 2, during: &[], who: Bearer::Any })]) ], ..CARD };',
    'pub static SCRY_D: CardDef = CardDef { name: "Scry D", modes: &[ mode_of(&[Window::W], Actor::ActingMinion, &[], &[Effect::VeilX, Effect::PayRed(2)]) ], ..CARD };',
    'pub static ONLY_E: CardDef = CardDef { name: "Only E", modes: &[ mode_of(&[Window::W], Actor::ActingMinion, &[], &[Effect::Veil(1)]) ], ..CARD };'
  ].join('\n');
  const { defs, ctx } = RS.parseDefs(src, '');
  const P = { family: { veil: { ours: ['stealth', 'actStealth'], theirs: ['Veil', 'Stat:Veil'] }, guard: { ours: ['intercept'], theirs: ['Stat:Guard'] } },
    formula: ['VeilX'], formulaOf: { VeilX: 'veil' }, conditional: ['Gate'],
    flags: [ { name: 'end-if-caught', theirs: ['EndIfCaught'], ours: ['blockedLockEnd'] }, { name: 'who plays it', theirs: ['Actor:OtherReady'], ours: ['playedBy'] },
             { name: 'cost', theirs: ['PayRed'], ours: ['selfPay'] } ] };
  const cards = [ { name: 'Cloak A', card_text: '[obf] +1 veil.\n[OBF] +2 veil, and end if caught.' }, { name: 'Cloak B', card_text: '+1 veil, +1 more if X.' },
    { name: 'Ward C', card_text: '+2 guard.' }, { name: 'Scry D', card_text: 'X veil; pay 2.' }, { name: 'Only E', card_text: '[dom] +1 veil.' }, { name: 'Ours F', card_text: '+1 veil.' },
    { name: 'Lines G', card_text: '[ani] +1 veil.\n[ANI] +2 veil.' } ];
  const lib = {
    'Cloak A': { t: ['mod'], modes: [ { at: 'OBF', fx: { stealth: 2 } }, { at: 'obf', fx: { stealth: 1 } } ] },     // our modes out of order: paired by `at`
    'Cloak B': { t: ['mod'], modes: [ { at: null, fx: { stealth: 1 } } ] },                                         // the condition missing
    'Ward C': { t: ['equip'], modes: [ { at: null, fx: { intercept: 1 } } ] },                                      // differ; who plays it
    'Scry D': { t: ['mod'], modes: [ { at: null, fx: { stealth: 'X' } } ] },                                         // formula; cost flagged
    'Only E': { t: ['action'], modes: [ { at: 'dom', fx: { actStealth: 1 } } ] },                                    // agree through actStealth
    'Ours F': { t: ['mod'], modes: [ { at: null, fx: { stealth: 1 } } ] },                                          // no definition
    'Lines G': { t: ['mod'], modes: [ { at: 'ani', fx: { stealth: 1 } } ] } };                                       // [ANI] has no mode of ours                                         // no definition
  const r = crossCheck({ lib, cards, defs, ctx, P, decks: { deckx: new Set(['Cloak A', 'Ward C']) } });
  const row = (c, lv, k) => r.fam.find(x => x.card === c && x.level === lv && x.key === k);
  ok(defs.size === 5 && ctx && ctx.statics.has('PLUS_ONE_VEIL'), 'the parser reads five invented definitions and keeps the shared const');
  ok(row('Cloak A', 'obf', 'veil') && row('Cloak A', 'obf', 'veil').verdict === 'agree' && row('Cloak A', 'OBF', 'veil').verdict === 'agree', 'levels pair by `at` against the text\'s lines, whatever our modes\' order');
  ok(r.flags.some(x => x.card === 'Cloak A' && x.level === 'OBF' && x.flag === 'end-if-caught') && !r.flags.some(x => x.card === 'Cloak A' && x.level === 'obf' && x.flag === 'end-if-caught'), 'a rider on the superior mode only is flagged there only');
  const b = r.fam.find(x => x.card === 'Cloak B');
  ok(b && b.theirs.base === 1 && b.theirs.cond === 1 && b.verdict === 'condition missing', 'a shared const expands to its value, a wrapped value counts as a condition, ours lacking it says so (got ' + JSON.stringify(b) + ')');
  const c = r.fam.find(x => x.card === 'Ward C');
  ok(c && c.theirs.base === 2 && c.ours.base === 1 && c.verdict === 'differ', 'a stat layer reads its number; 1 against 2 differs');
  ok(r.flags.some(x => x.card === 'Ward C' && x.flag === 'who plays it'), 'an actor rule flags the mode whose actor ours does not model');
  ok(r.fam.some(x => x.card === 'Scry D' && x.verdict === 'formula') && r.flags.some(x => x.card === 'Scry D' && x.flag === 'cost'), 'X on either side is a formula; a cost token with no key of ours is flagged');
  ok(r.fam.some(x => x.card === 'Only E' && x.verdict === 'agree' && x.ours.base === 1), 'an action\'s own stealth (actStealth) answers the same token');
  ok(r.fam.some(x => x.card === 'Ours F' && x.verdict === 'no definition'), 'a card with no definition is single-witness');
  ok(!r.flags.some(x => x.flag === 'level with no mode' && x.card === 'Cloak A') && r.flags.some(x => x.flag === 'level with no mode' && x.card === 'Lines G' && x.level === 'ANI'), 'a discipline line no mode of ours names is flagged (Lines G\'s [ANI]), none where every line has its mode');
  const md = report(r, { commit: 'test', defs: defs.size, lib: 6, pairing: 'test', P });
  ok(/\| Ward C \| `-` \| guard \| 1 \| 2 \| differ \| deckx \|/.test(md) && /### deckx: /.test(md), 'the report renders a differing row with its deck, and the flags by deck');
  ok(!/Veil|Guard|Gate|EndIfCaught|PayRed/.test(fs.readFileSync(__filename, 'utf8').split('/* ---- the self-test')[0]), 'the tool\'s code above the self-test names none of the self-test\'s invented tokens');
  // the committed pairing (D-140): it parses and has the header's shape, so a broken edit fails the self-test and CI
  let CP = null; try { CP = JSON.parse(fs.readFileSync(here(PAIRING), 'utf8')); } catch (e){ CP = null; }
  const strs = x => Array.isArray(x) && x.length > 0 && x.every(t => typeof t === 'string' && t.length > 0);
  const fam = CP && CP.family && typeof CP.family === 'object' ? CP.family : {}, fOf = CP && CP.formulaOf && typeof CP.formulaOf === 'object' ? CP.formulaOf : null;
  ok(CP && Object.keys(fam).length > 0 && Object.values(fam).every(v => v && strs(v.ours) && strs(v.theirs))
     && strs(CP.formula) && fOf && CP.formula.every(t => fOf[t] in fam) && Object.keys(fOf).every(t => CP.formula.includes(t))
     && strs(CP.conditional) && Array.isArray(CP.flags) && CP.flags.length > 0
     && CP.flags.every(g => g && typeof g.name === 'string' && g.name && typeof g.what === 'string' && g.what && strs(g.theirs) && strs(g.ours)
       && (g.unless === undefined || strs(g.unless)) && (g.exceptTypes === undefined || strs(g.exceptTypes))),
     'the committed pairing (' + PAIRING + ', D-140) parses and has the header\'s shape');
  console.log('gen-cross-check --self-test: ' + (n - f) + ' of ' + n + ' checks passed');
  return f === 0;
}

if (require.main === module){
  const a = process.argv.slice(2), opt = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  if (a.includes('--self-test')) process.exit(selfTest(false) ? 0 : 1);
  const zero = opt('--zero'), pairing = opt('--pairing') || here(PAIRING), out = opt('--out'), js = opt('--json'), only = opt('--card');
  if (!zero){ console.error('usage: node gen-cross-check.js --zero DIR [--pairing FILE] [--out FILE.md] [--json FILE] [--decks k1,k2] [--card NAME] [--all] | --self-test'); process.exit(2); }
  const repo = path.resolve(__dirname, '..');
  for (const [what, p] of [['--zero', zero], ['--out', out], ['--json', js]]) if (p && RS.insideRepo(p, repo)){ console.error('gen-cross-check: ' + what + ' must be outside the repository (spec-card-sweep §5): ' + p); process.exit(2); }
  if (!fs.existsSync(here('vtes.json'))){ console.error('gen-cross-check: vtes.json is missing beside the tool (bash tools/setup.sh)'); process.exit(2); }
  const P = JSON.parse(fs.readFileSync(pairing, 'utf8'));
  const cards = JSON.parse(fs.readFileSync(here('vtes.json'), 'utf8')), lib = JSON.parse(fs.readFileSync(here('elysium-cardfx.json'), 'utf8')).lib;
  const cdir = path.join(zero, 'crates', 'engine', 'src', 'cards'), modrs = path.join(cdir, 'mod.rs');
  const { defs, ctx } = RS.parseDefs(fs.readFileSync(path.join(cdir, 'defs.rs'), 'utf8'), fs.existsSync(modrs) ? fs.readFileSync(modrs, 'utf8') : '');
  let commit = '?'; try { commit = cp.execFileSync('git', ['-C', zero, 'log', '-1', '--format=%h %cs'], { encoding: 'utf8' }).trim(); } catch (e){ commit = '? (not a git checkout)'; }
  const decks = {}, want = (opt('--decks') || '').split(',').filter(Boolean);
  for (const f of fs.readdirSync(__dirname).filter(x => /^deck-[a-z]+\.json$/.test(x))){
    const key = f.slice(5, -5); if (want.length && !want.includes(key)) continue;
    try { const d = JSON.parse(fs.readFileSync(here(f), 'utf8')); decks[key] = new Set((d.library || []).map(c => c.name)); } catch (e){ /* a deck file the tool cannot read is left out */ }
  }
  const lib2 = only ? Object.fromEntries(Object.entries(lib).filter(([k]) => RS.normName(k) === RS.normName(only))) : lib;
  const r = crossCheck({ lib: lib2, cards, defs, ctx, P, decks });
  const md = report(r, { commit, defs: defs.size, lib: Object.keys(lib2).length, pairing: path.basename(pairing), P, all: a.includes('--all') || !!only, card: only });
  if (out) fs.writeFileSync(out, md); else process.stdout.write(md);
  if (js) fs.writeFileSync(js, JSON.stringify({ version: VERSION, commit, fam: r.fam, flags: r.flags }, null, 1));
  if (out) console.log('gen-cross-check v' + VERSION + ': ' + r.fam.length + ' family rows, ' + r.flags.length + ' flags -> ' + out);
}
module.exports = { VERSION, crossCheck, pairModes, textLines, theirFamily, ourFamily, report, selfTest };
