# HANDOFF to main — 2 Nov 2026, bot v0.6.215 (V5 wave 3: the masters)

Nothing to build: the bot ships first, backward compatible (the one rule). One new bot line another bot reads; the rest are table
lines. The protocol in full: `bot/docs/specs/spec-v5-wave3-2026-11-02.md` §2. This also answers your KRCG v5 reply of 1 Nov (§3).

## 1. What changed on the wire
- **Archon Investigation** (an out-of-turn master): when a minion bleeds a bot for 4 or more and the bot declines to block, the bot may
  pay 3 pool and send `SEAT plays Archon Investigation — VAMP is burned (the bleed of N is not successful).` (after its own
  `pays 3 pool for Archon Investigation (pool P).` line), clear the bleed and say `Pass`. An acting BOT reads the line, burns its
  minion (and the cards on it) and resolves the bleed as not successful: no pool, no Edge. An acting HUMAN gets a chat line asking
  them to move the vampire to their ash heap. The line ends with `.` after a parenthesis, so `L12.actObs` sees `plays Archon
  Investigation — …` as a card play by that seat, as it does Misdirection's and Fame's lines.
- **A location's lock for intercept at a block attempt**: `VAMP attempts to block.` (your §12 attempt line) first, then `VAMP locks
  CARD: +N intercept.` (Market Square, Channel 10, KRCG News Radio, Wall Street Night). A lock later in the contest sends the lock line
  only. The stealth locks keep The Labyrinth's `VAMP locks CARD: +N stealth.`; Creepshow Casino's goes out at the announce, BEFORE
  the announce line (`recruits` / `equips` / `employs` / `calls a political action`), and the tally's `a` includes it.
- **Table lines, no reader on your side:** `VAMP discards CARD (Haqim's Law: Retribution): +1 bleed.` followed by your frozen
  `adds +1 bleed (= N).`; `VAMP burns 1 blood (Club Illusion): +1 bleed.` before the bleed line (the bleed line carries the new
  amount); `SEAT locks|uses CARD to add 1 blood to an uncontrolled vampire.`; `SEAT adds 3 blood to an uncontrolled vampire (Unholy
  Sacrament).`; `SEAT reveals a Hecata from the top of the crypt and draws it (Family Gathering).` (a `drawCrypt`; the vampire
  arrives with 1 blood).
- **Masters wait for their requirements** (RULINGS R-42): a bot plays a master only while it controls a READY vampire meeting the
  card's requirements, the clan icon included. A Ventrue Headquarters or a Hunting Ground is no longer played in the bot's first
  master phase, before any vampire is out. Out-of-turn masters are never played in the bot's own master phase.

## 2. Ask: §12 and the canary
- **ARCHON_BURN** for §12's bot-emitted block and a canary case: feed the line through `_onLog` while `_actingVamp` names VAMP and
  check `_actingVamp.archoned` (`{ by, n }`).
- **§12's attempt line** could say that a bot's intercept from a location is `attempts to block.` + `locks CARD: +N intercept.`
  (the attempt line is the blocker-name carrier, as `plays CARD: +N intercept.` is for a card).
- **Re-embed `START-HERE-BOTS.html`** at your next release (its Master paragraph and the curated count changed). Still owed from
  earlier handoffs: the lines listed in `HANDOFF-to-main-2026-10-20-docs-diet.md`, v0.6.213's and v0.6.214's.

## 3. Your KRCG v5 reply (1 Nov)
- **5.2, names:** done. The compiler (v1.9.6) adds an article-first alias for every v3 key ending ', The' / ', An' / ', A'. Through
  your client's naming (printed name, the unicity suffix when another printing shares the name) all 4,149 v3 cards resolve to the
  same card id in the bot (measured on both of KRCG's files today; `An Anarch Manifesto` was the one miss, the G6 vampires were right).
- **5.1, the 63 new cards:** Johan's order is after this wave — the compiler and the precon tools move to the v5 dump in a round of
  their own (bot BOARD), with the 295 errata texts diffed. Until then a bot that meets a Secrets of New York or Noites Brasileiras
  card does not know it: a card with no cardfx entry is never played (every finder starts from the entry), and a vampire
  among them is a stranger to the table model (no capacity, clan or disciplines).
