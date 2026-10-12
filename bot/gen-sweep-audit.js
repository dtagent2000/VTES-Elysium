#!/usr/bin/env node
'use strict';
/* gen-sweep-audit.js — one-off script (not part of the shipped pipeline) that
   dumps the FULL persistent/lock sweep results to a markdown file so Johan can
   eyeball every hit, not just the compiler's own --report samples. */

const fs = require('fs');
const { compile } = require('./cardfx-compile.js');

const cards = JSON.parse(fs.readFileSync('vtes.json', 'utf8'));
const curated = JSON.parse(fs.readFileSync('cardfx-curated.json', 'utf8'));
const res = compile(cards, curated);
const lib = res.out.lib;
const byName = {};
cards.forEach(c => { byName[c.name] = c; });

const firstLine = t => (t || '').split('\n')[0];
const reasonFor = name => {
  const c = byName[name];
  if(!c) return 'curated-only (no raw card_text to check)';
  const t = c.card_text || '';
  if(/\blocation\b/i.test(firstLine(t))) return 'location (first line)';
  if(/put this card (?:in|into) play|put this card on|stays? in play|remains? in play/i.test(t)) return 'put-in-play / put-on / stays-in-play';
  return 'curated (auto text did not trigger either pattern)';
};
const lockSnippet = name => {
  const c = byName[name];
  if(!c) return '(curated-only)';
  const m = /([^.\n]*\block this \w+[^.\n]*)/i.exec(c.card_text || '');
  return m ? m[1].trim() : '(curated)';
};

const L = [];
const P = s => L.push(s);

P('# cardfx v1.4.0 sweep-audit — persistent + lock (14 juli 2026)');
P('');
P('Genererad mot verklig `vtes.json` (' + cards.length + ' kort) + `cardfx-curated.json` (' +
  res.out.counts.curated + ' curated entries, ' + Object.keys(curated.lib || {}).length + ' lib-poster). ' +
  'Syfte: kunna scrolla igenom HELA träffytan innan den litas på, inte bara ett sample.');
P('');
P('Regenerera med: `node gen-sweep-audit.js` (kräver `vtes.json` + `cardfx-curated.json` i samma katalog).');
P('');

P('## Sammanfattning');
P('');
P('| | Antal |');
P('|---|---:|');
P('| lib-entries totalt | ' + res.out.counts.lib + ' |');
P('| persistent (alla typer) | ' + res.out.counts.libPersistent + ' |');
P('| lock (alla typer, entries med minst 1 lock-mode) | ' + res.out.counts.libLock + ' |');

const masters = Object.entries(lib).filter(([n, e]) => e.t.includes('master')).sort((a, b) => a[0].localeCompare(b[0]));
const persMasters = masters.filter(([n, e]) => e.persistent);
const lockMasters = masters.filter(([n, e]) => (e.modes || []).some(m => m.lock));
const passivePersistMasters = persMasters.filter(([n, e]) => !(e.modes || []).some(m => m.lock));

P('| Masters totalt | ' + masters.length + ' |');
P('| Masters — persistent | ' + persMasters.length + ' (' + Math.round(100 * persMasters.length / masters.length) + '%) |');
P('| Masters — lock-gated | ' + lockMasters.length + ' |');
P('| Masters — persistent men ingen lock (Passive-kandidater) | ' + passivePersistMasters.length + ' |');
P('');

/* ---------------- known follow-up: curated entries not yet re-tagged ---------------- */
P('## Kända uppföljningar');
P('');
P('Curated-tier (`cardfx-curated.json`) skriver över hela auto-entryn, så dessa 4 kort får INTE');
P('de nya taggarna automatiskt trots att deras egen text skulle matcha — de behöver `persistent`/`lock`');
P('tillagt för hand om ni vill ha full konsekvens mellan tiers:');
P('');
const curatedLibNames = Object.keys(curated.lib || {});
curatedLibNames.forEach(n => {
  const c = byName[n];
  const wouldMatch = c ? (
    (/\blocation\b/i.test(firstLine(c.card_text || '')) || /put this card (?:in|into) play|put this card on|stays? in play|remains? in play/i.test(c.card_text || ''))
    ? 'skulle fått persistent:true' : 'skulle INTE fått persistent'
  ) : '(okänd rå text)';
  const lockWould = c && /\block this \w+/i.test(c.card_text || '') ? ' + lock:true' : '';
  P('- **' + n + '** — ' + wouldMatch + lockWould + ' om den vore auto-tier idag.');
});
P('');

/* ---------------- edge cases worth a second look ---------------- */
P('## Kluriga edge-cases hittade under granskningen');
P('');
P('Dessa slog inte igenom av misstag i produktionskörningen (redan fixade och gate-testade),');
P('men listas här så ni kan syna resonemanget direkt utan att behöva läsa diff:en.');
P('');
P('**Negerad lock ("do/does not lock this/that X") — 11 kort, alla korrekt UTAN lock på den negerade sidan:**');
P('');
const negRe = /\bdo(?:es)? not lock (?:this|that) \w+/i;
const negCards = cards.filter(c => negRe.test(c.card_text || ''));
P('| Kort | Negerad textsnutt |');
P('|---|---|');
negCards.forEach(c => {
  const m = negRe.exec(c.card_text || '');
  const ctx = (c.card_text || '').slice(Math.max(0, m.index - 15), m.index + m[0].length + 15);
  P('| ' + c._name + ' | …' + ctx.trim().replace(/\|/g, '\\|') + '… |');
});
P('');
P('**Deflection och Devil-Channel: Throat är spegelbilder av varandra:** Deflections [dom] kostar');
P('en lock, [DOM] (\"As above, but do not lock this vampire\") tar bort kostnaden. Devil-Channel: Throats');
P('[abo] har INGEN lock (\"do not lock that minion\"), men [ABO] (\"As above, but lock that blocking minion\")');
P('LÄGGER TILL en lock som inferior-läget saknar — motsatt riktning, båda korrekt hanterade.');
P('');
P('**Känd, accepterad miss (inte en felaktig tagg):** Gift of Sleep har både en genuin \"Lock that ally\"');
P('(dess egen [obe]-reaktionsmode) OCH en orelaterad \"do not lock this vampire\"-påminnelse i SAMMA segment.');
P('If/else-if-strukturen låter negationen vinna, så ally-låsningen missas helt (ingen mode alls för det läget)');
P('— en miss, inte en felaktig tagg, i linje med auto-nivåns uttalade tolerans (se cardfx-design.md §6).');
P('');

/* ---------------- full Masters table ---------------- */
P('## Alla 525 Masters — persistent / lock-status');
P('');
P('`—` = nej. Reason-kolumnen visar VILKET mönster som slog till för persistent.');
P('');
P('| Kort | Persistent | Grund | Lock |');
P('|---|:---:|---|:---:|');
masters.forEach(([n, e]) => {
  const pers = e.persistent ? '✓' : '—';
  const reason = e.persistent ? reasonFor(n) : '';
  const lock = (e.modes || []).some(m => m.lock) ? '✓' : '—';
  P('| ' + n + ' | ' + pers + ' | ' + reason + ' | ' + lock + ' |');
});
P('');

/* ---------------- full Lock listing, ALL types, with matched snippet ---------------- */
const allLock = Object.entries(lib).filter(([n, e]) => (e.modes || []).some(m => m.lock)).sort((a, b) => a[0].localeCompare(b[0]));
P('## Alla ' + allLock.length + ' lock-taggade kort (alla korttyper), med matchad textsnutt');
P('');
P('| Kort | Typ | Matchad text |');
P('|---|---|---|');
allLock.forEach(([n, e]) => {
  P('| ' + n + ' | ' + e.t.join('/') + ' | ' + lockSnippet(n).replace(/\|/g, '\\|') + ' |');
});
P('');

/* ---------------- non-Master persistent: type breakdown only (expected-persistent types) ---------------- */
const nonMasterPersist = Object.entries(lib).filter(([n, e]) => e.persistent && !e.t.includes('master'));
const typeBreak = {};
nonMasterPersist.forEach(([n, e]) => e.t.forEach(t => { typeBreak[t] = (typeBreak[t] || 0) + 1; }));
P('## Persistent utanför Masters — typfördelning (' + nonMasterPersist.length + ' kort totalt)');
P('');
P('Equipment/Ally/Retainer/Event är redan väntat ~alltid persistenta per korttyp (Johans egen premiss) —');
P('den här tabellen är bara för att bekräfta att inget oväntat läckte in, inte en granskningskö.');
P('');
P('| Typ | Antal |');
P('|---|---:|');
Object.entries(typeBreak).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => P('| ' + t + ' | ' + n + ' |'));
P('');

fs.writeFileSync('cardfx-sweep-audit.md', L.join('\n') + '\n');
console.log('wrote cardfx-sweep-audit.md, ' + L.length + ' lines, ' +
  fs.statSync('cardfx-sweep-audit.md').size + ' bytes');
