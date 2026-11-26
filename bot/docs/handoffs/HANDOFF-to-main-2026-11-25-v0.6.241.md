# Handoff to main — bot v0.6.241 (25 Nov 2026): the exactness round

Stacked on v0.6.240 (#108): merge #108 first. Built on your v2.6.188 / srv-2.6.53 (no wire change of yours consumed; the read-only
copies in `bot/` stay at v2.6.179). From Johan's D-138 (25 Nov 20:43): the table bugs Claude's two playtest games found, the base
starters' card gaps, and a second number beside "playable" in `docs/CARDS.md` (text-checked and exact). No new verb or field. One
new bot line (section 2), one changed play line (section 3), and Turn-based timers that now behave (section 4). The bot ships first:
the new line is backward compatible (a human reads it as any log line).

## 1. The bundle
`elysium-bot.js` (v0.6.241), `elysium-cardfx.json` / `.js` (curated 218 → 221: Aire of Elation, The Warrens, Mirror Walk), and
`START-HERE-BOTS.html` (the version chip and the footer: bot v0.6.241, cardfx 221 curated). The TWD files and the server are
unchanged. Deploy: purge `/elysium-bot.js` and `/elysium-cardfx.json` (what the box serves; the `.js` sibling is the download's). Your embed test compares the whole guide: re-embed it.

## 2. A new bot line for §12
- **An 'if blocked' card that locks the blocker and ends the action** (Mirror Walk [THA]; the acting bot's line after a successful
  block of its acting vampire, before any other card, with no combat after it):
  `VAMP is blocked — CARD [LVL]: NAME's BLOCKER is locked; the action ends unsuccessfully.`
  e.g. `Rosalina Cortez is blocked — Mirror Walk [THA]: Johan's The Dowager is locked; the action ends unsuccessfully.`
  The acting bot's "Blocked. Combat begins." note comes before it, as for Change of Target's line (§12, bot v0.6.217): that combat
  never begins. A bot blocker reads it (its combat never begins, its vampire stays locked); a human blocker locks their own minion
  and plays no combat. The bot's grammar: `BLOCKED_LOCK` (`/^(.+?) is blocked — (.+?)(?: \[([A-Za-z]+)\])?: (?:(.+?)'s )?(.+?) is
  locked; the action ends unsuccessfully\.$/`, a straight apostrophe). Once §12 has it, the bot adds the canary case (`sec12`
  documents it), as for v0.6.217's lines.

## 3. A changed play line, now read by the bots
A stealth card whose mode carries a rider the bot reads names its level: `VAMP plays Mirror Walk [THA]: +1 stealth.` (was
`VAMP plays Mirror Walk: +1 stealth.`), so the table knows what a block brings; other stealth lines are unchanged. §12 lists the
actor's stealth line as `VAMP plays|burns|locks CARD: +N stealth.`; the level rides inside CARD. Since this release the bots read
the level too: a bot that may block hears the rider there (`RIDER_STEALTH`, `/^(.+?) plays (.+?) \[([A-Za-z]+)\]: \+(\d+)
stealth\.$/`, the card's mode at that level carrying `blockedLockEnd`) and, at its own successful verdict, locks its vampire and
begins no combat, without waiting for section 2's line. The line is no longer only the tally net's (`NET_STEALTH`, your canary's
note at line 189): it belongs pinned, with a canary case. Your client and server read no stealth play line (we grepped
`elysium-vtes-bord.html`, `elysium-server.js` and your tests). A human's play line already names the level when your table helper
`modeChoice` is on (`playLineHtml`: `VAMP plays Mirror Walk [THA].`); the bots do not read that shape yet (our register's 4.20):
nothing for you to build.

## 4. Timing
Under Turn-based a contest a human's Pass ended no longer leaves its 4-minute net armed into the next question (the net fired "no
answer in 4 min" 70 s into a new question at Claude's table); an undirected contest whose last human has passed is a bot-only
window (the bots' clock declares the verdict; it waited out the 4-minute net); a bleed modifier's add line waits for a free floor
and the board goes behind it, so the question follows the add line on the wire; the turn watchdog's "⌛ Still thinking…" is not
said while the bot waits on the table (a poll, a combat step, a verdict). Your client suite beside this bundle: section 6.

## 5. Asks
1. Re-embed the guide.
2. Add section 2's line to PROTOCOL §12, and section 3's level in the stealth line (`CARD [LVL]` for a rider mode); then the bot
   adds the canary cases for both (as for v0.6.217's lines).
3. From Claude's playtests (`bot/docs/reports/playtest-claude-game2-2026-11-25.md`, 25 Nov): the resolution panel's proposals A–E are the owner's
   to weigh first (RULINGS O-53); nothing to build before that.

## 6. Run here
On the release bytes (the sha256 in the PR body): your canary on `bot/`'s copies and on the root's v2.6.188 (235/0 each), your
canary v1.6.0 (247/0), your client suite in a scratch copy of `client/` with this bundle beside it (430/1, the guide's embed),
the bot's suite (2841/0 ×3), the hotseat gate (12/0), HB1 (11/0), the sim's 240 (`ana-gates.py` PASS 6/6) and the arena smoke
(PASS 7/7). The root is a byte copy of `bot/`'s bundle (your `check-versions.js`: everything agrees).
