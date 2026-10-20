# Handoff to main — bot v0.6.206: the late bounce, the probe reservation, and our answer to your finding 1 (17 Oct 2026)

**From:** Elysium Bots. **To:** main (client v2.6.162, srv-2.6.46). **Follows:** `HANDOFF-to-main-2026-10-16-v0_6_205.md`.
**Answers:** your `REPLY-to-bot-2026-10-16-v0.6.204.md`, §4.1 (the chat beat after a question) — an analysis and a
proposal, waiting for Johan.

## 0. In short
- **Nothing for you to build.** No new wire verb, no new frozen line, no new chat line.
- **Between bots, a bleed could be bounced after it had resolved** (found in our v0.6.205 smoke, older than that
  release). Fixed bot-side (§1). At a table with humans it could only happen between two bots (one bot fetching, then
  bleeding another bot); a human's own actions were never involved.
- **Two more fixes in the bot's own block windows** (§2), found by this release's smoke. Both need an answer within
  150 ms of the line that opens the window, so they bit at pace 0 (our arena) and not at your tables.
- **One log line reads differently:** a bot's Magic of the Smith now notes `CARD comes from the library onto VAMPIRE
  (library shuffled — the fetched copy is off the top).` If your rig matches the old wording (`fetches … and equips …`),
  please update it. It is an explanation line, not a frozen one.
- **Your finding 1:** we measured it on the bot's own send queue and propose your first idea (§4). Johan decides; if he
  says go, it ships in our next release with a note here.
- **Please re-embed `START-HERE-BOTS.html`** at your next client release: its version chip and footer say v0.6.206. Nothing
  else in the guide changed.

## 1. The late bounce (fixed in v0.6.206)
- **What happened:** a bot that fetched with Magic of the Smith noted `fetches X from the library and equips V (…).`
  That line matches the undirected equip grammar (`VAMPIRE equips CARD.`), so the other bots opened a block window for
  an equip that never happened and said Pass. That Pass reached the acting bot while its next action, a bleed, was still
  in its own send queue, and it answered that bleed's `Block?`. Every answer after it came one window late: the bleed
  resolved, then the bounce came.
- **Three bot-side layers, each enough alone:**
  - the note is reworded;
  - a bot's line that names no minion on its own public board opens no window;
  - a bot's answer that arrives while the line that opened the acting bot's window (its announce, a modifier's add
    line) is still in that bot's send queue is ignored as stale.
- **Your human players are untouched.** A human's lines and answers are never second-guessed. The client can show an
  action through its fx clone before the bot's log line arrives, so a human may legitimately answer early.

## 2. Two window fixes found by this release's smoke (pace 0 only)
- **The stale guard's first cut** waited for everything the acting bot had queued before its question. After a
  modifier's add line the bot pushes its board, so a bot target's Pass on the add line was taken for stale and the
  window ran out its clock. It now anchors on the line that opens the window.
- **An older race (since our v0.6.144's bleed total):** the acting bot slept 150 ms between a modifier's add line (or
  the bleed total's `+0` line) and opening the reactions-only window. A bot answers in ~50 ms at pace 0, so the answer
  found no window and was lost. The window ran out its clock — two bleed totals in three in our arena smokes — and once
  in a while a bounce's new target's block attempt was never taken up, so the bleed landed on the blocker. The window
  now opens with its line.
- **At your tables:** a bot answers after its reaction pace (seconds), and a human cannot answer within 150 ms, so
  neither fault could bite there. Nothing changes in what you see, except that the reactions-only question may reach
  the wire about 150 ms sooner after its line.

## 3. The probe reservation (knob, default unchanged)
- A stealth-bleed bot's "probe then punch" was meant to send small bleeders first and keep the heavy bleed card for the
  last vampire. The ordering half worked; the reservation never took effect (since v0.6.143).
- It is now a knob, `probeHold`, measured and left at 0 (as it has played) until Johan decides. Nothing changes at your
  tables today.
- The arena gets `--knob probeHold=N` and `--knob dodgeOut=N` (arena v1.4.8; `dodgeOut` was missing from the arena's
  whitelist since v0.6.205).

## 4. Your finding 1 — the chat beat after a question
We measured it on the bot's own `_drain`, with a recording socket at `paceMs` 3100. Our "today" column reproduces your
numbers.

| Scenario | Today | With the proposal |
|---|---|---|
| The verdict on the 3 s clock | 4.96 s | 3.04 s |
| The table button decides at 0.08 s | 4.96 s | 0.20 s |
| A typed `+1`, the counter write | 4.97 s | 0.20 s |
| Hold on at 1.6 s, Pass at 6.0 s: the hold line, the resume line, the verdict | 4.96 s, 9.93 s, 14.89 s | 1.60 s, 6.01 s, 6.21 s |
| Two instruction lines back to back | 4.96 s | 4.96 s (unchanged) |

- **The proposal is your first idea:**
  - the beat separates two **chat** bubbles and nothing else;
  - a log line, a counter write, the board and a quick phrase ride the 200 ms cascade;
  - a hold or resume line skips the beat, because it answers the human's own Hold on.
- **Unchanged:**
  - the bot's own acts still wait out the bubble, so Johan's v0.6.100 rule stands;
  - one queue keeps the order, so the other bots read the same sequence;
  - at `paceMs` 0 nothing changes.
- **Your LIVE tests:** "the verdict no earlier than 2.8 s after the question" holds, because the verdict now comes at
  3.04 s. The panel would show the next wait about 0.2 s before the verdict line instead of 1.9–4.8 s, so your second
  idea is not needed unless your rig still shows the order.
- The full analysis is in `bot/docs/specs/spec-next-2026-10-17.md` §3.

## 5. The bundle
- Changed and copied to the root: `elysium-bot.js` (v0.6.206) and `START-HERE-BOTS.html` (the version only). cardfx and
  the twd files are byte-identical.
- **Deploy:** purge `/elysium-bot.js`, and re-embed the guide at your next client release.

## Gates (v0.6.206, from `bot/`)
- `node --check` on every changed file (`elysium-bot.js`, `test-bot-logic.js`, `elysium-bot-arena.js`, `lab-probe.js`; the
  Python tools compile).
- **Suite 2199/0 ×3** — alone, each run in a frozen snapshot; `elysium-bot.js` a9e38637…, `test-bot-logic.js` b6b35673…,
  `elysium-cardfx.json` bea73088…. v0.6.205 had 2182; the 17 new are sections 150–152.
- **Canary 69/0** (main's current client copies), **HB1 11/11**, **hotseat 11/0**. test-cardfx not run (cardfx unchanged).
- **check-versions** (from `client/`): everything agrees; the root's 21 files are byte copies.
- **Beside main's client v2.6.162:** the client suite 303/1 — the one red is the embed drift (Help ▸ Bots embeds an older
  guide; a re-embed closes it). Every LIVE test with the real bot is green. Their canary 69/0.
- **The final smoke** — seeds 9701, 9702, 9703 and 4003, the V5 table, the final code (the bytes differ only in the version
  comment):
  - bleed 77/77 paired, VANISHED 0;
  - the reactions-only windows: 0 of 80 ran out their clock and went through; 5 were blocks taken up, with the verdict at
    the clock;
  - one `stale-answer` row, and a right one (a hunt's line held back while the acting bot's prey was ousted);
  - handshake integrity, range and press 188/0, 188/0, 150/0, no wait in the safety net;
  - invariants 0 flags; the block audit 0 violations; no late bounce in 77 bleeds through; 2 fetches, no phantom window;
  - dealt ≠ taken in 24 rows, all explained: 18 Guardian Angel, 4 the Murder of Crows Larissa Moreira bore, 2 Carrion
    Crows.
- **The probe series:** seven matches on the first cut, then stopped. The knob fires, and their audits found the first
  fix in §2.
- **The lab:** 360 tables (seeds 1–3), the order fired on 207, 0 errors; arm 2's derivation matched on all 120 tables where
  arm 2 ran.
