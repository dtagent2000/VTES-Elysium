# HANDOFF to main — 3 Nov 2026, bot v0.6.217 (V5 wave 4: the masters on a vampire, Toreador's last cards)

Nothing to build: the bot ships first, backward compatible (the one rule). Three new bot lines another bot reads, one widened; the
rest are table lines. The protocol in full: `bot/docs/specs/spec-v5-wave4-2026-11-03.md` §2.

## 1. What changed on the wire
- **Change of Target** (an action modifier, "only usable if this minion is blocked, before block resolution"): after a successful
  block of its acting vampire, before any combat line, a bot may send `VAMP plays Change of Target — unlocks; the action ends
  unsuccessfully.` The bot that blocked THAT vampire ends the combat it began at its verdict and unlocks its blocker. A human's plain
  play line `VAMP plays Change of Target.` is read the same way by a bot blocker. A human blocker reads the line: no combat.
- **The polling-step abstain** (Scalpel Tongue; Saulot's Guiding Wisdom's lock): on its OWN referendum, after the votes are cast and
  only when it turns the count, a bot sends `VAMP plays Scalpel Tongue [LVL] — OWNER's TARGET is locked[, burns 1 blood] and abstains
  (N votes cancelled).` or `BEARER locks: Saulot's Guiding Wisdom — OWNER's TARGET abstains (N votes cancelled).` The caller has
  already taken the N votes off its count and writes the vote counter's `b` down by N; the voter's bot locks the vampire and burns
  its blood. A human voter reads it. Then the poll reopens (the vote clock again, as after a boost: the table may answer), and the
  verdict line that follows is your frozen `Vote: F for vs A against — vote passes|fails.`
- **An action that burns a card in play** (Toreador Grand Ball: "Minions can burn this card as a (D) action"): `VAMP takes an action
  to burn OWNER's Toreador Grand Ball.` The owner's bot opens its block window on it (directed: only its minions may block); on its
  Pass it burns the card (`OWNER burns Toreador Grand Ball (VAMP’s action).`). A human owner gets a chat line.
- **Widened:** the Haven Uncovered rush line now also names the other cards that grant a rush: `RUSHER enters combat with OWNER's
  VAMP (Saulot's Avenging Fist).` and `(… (Regent).` — Haven's terms (the host does not lock, the rusher acts).
- **Reused, unchanged:** your block-bar shape `Toreador Grand Ball — minions cannot block this action.` before each non-bleed action
  of the Grand Ball's unblockable Toreador; `Combat ends — Saulot’s Guiding Wisdom.` (a combat ended before range).
- **Table lines, no reader on your side:** `SEAT plays Toreador Grand Ball: LOCKED is locked and does not unlock as normal; FREE’s
  non-bleed actions cannot be blocked.`; `SEAT burns N pool (Terrifying Visage: VAMP was blocked).` (the BLOCKER's own line, before
  combat); `VAMP burns 1 blood to unlock (Monster).`; `VAMP takes the title: Toreador Justicar (Justicar, 3 votes).`; `BEARER locks:
  Saulot’s Guiding Wisdom — the combat of VAMP ends before range.`; the title referendum's terms `Referendum terms — Toreador
  Justicar: VAMP takes the title (Justicar, 3 votes).` A chat line to a human blocker: `Terrifying Visage: NAME burns N pool before
  the combat.`
- **A human's Toreador Grand Ball:** the human names no pair, so while one is in play no bot blocks a non-bleed action of that human's
  Toreador (nothing on the wire; the bot's own Ball sends the bar line above).
- **Title cards count:** a Regent, a Toreador Justicar or a Saulot's Guiding Wisdom on a vampire replaces its printed title for every
  vote a bot counts (one title per vampire, the rulebook). The cards are on the pub board with `host` / `attached` as before.

## 2. Owed to your §12 and the canary
The three new lines (COT, ABSTAIN in both shapes, the burn action) and the widened enters-combat line — with the earlier bot-emitted
lines STATUS lists. Each ends with `.`; none ends with `plays X.` (`L12.actObs` sees the Scalpel Tongue line as a card play by the
acting vampire, as it does the other modifiers' lines). The apostrophes are load-bearing: the lines quoted above with ’ (U+2019) are
sent with it; the ABSTAIN line keeps the card names' straight ' (`Saulot's Guiding Wisdom`), as its parser reads them.

## 3. Nothing else
No client change is needed. The guide (`START-HERE-BOTS.html`) has the new version chip; re-embed it when you next release.
