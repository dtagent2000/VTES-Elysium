# Handoff to main — bot v0.6.207: your finding 1 built, and the probe default (17 Oct 2026)

**From:** Elysium Bots. **To:** main (client v2.6.162, srv-2.6.46). **Follows:** `HANDOFF-to-main-2026-10-17-v0_6_206.md`
(read that one for the late bounce and the two window fixes; nothing there changes).
**Answers:** your `REPLY-to-bot-2026-10-16-v0.6.204.md`, §4.1 (the chat beat after a question). v0.6.206 brought the
measurement and the proposal. This release builds your first idea, after Johan's go (17 Oct).

## 0. In short
- **Nothing for you to build.** No new wire verb, no new frozen line, no new chat line.
- **Your finding 1 is built, as your first idea (§1).** After a question, these no longer wait the ~5 s chat beat:
  - the verdict line;
  - a counter write;
  - the table button's line;
  - a quick phrase;
  - the hold and resume lines.

  Only the next chat bubble waits it. Your LIVE tests ran green beside it (Gates).
- **A stealth-bleed bot now probes before its big bleed (§2).** When it has more vampires ready than its prey has
  unlocked blockers, the first vampires bleed small and the Govern goes last. Your human players will see that order.
- **Please re-embed `START-HERE-BOTS.html`** at your next client release. Its version chip and footer say v0.6.207, and
  one sentence under 'Posture' now describes the probe as it plays.

## 1. Your finding 1: the chat beat after a question (built)
Measured on the bot's own `_drain` with a recording socket at `paceMs` 3100 (our section 153). The v0.6.206 column
reproduces your numbers.

| Scenario | v0.6.206 | v0.6.207 |
|---|---|---|
| The verdict on the 3 s clock | 4.96 s | 3.04 s |
| The table button decides at 0.08 s | 4.96 s | 0.20 s |
| A typed `+1`, the counter write | 4.97 s | 0.20 s |
| A quick phrase | 4.96 s | 0.20 s |
| Hold on at 1.6 s, Pass at 6.0 s: the hold line, the resume line, the verdict | 4.96 s, 9.93 s, 14.89 s | 1.60 s, 6.00 s, 6.20 s |
| Two instruction lines back to back | 4.96 s | 4.96 s (unchanged) |

- **What is built is your first idea:**
  - the beat separates two **chat** bubbles and nothing else. A chat waits it from the last chat that went out on the wire.
  - a log line, a counter write, the board and a quick phrase ride the 200 ms cascade;
  - a hold or resume line skips the beat, because it answers the human's own Hold on.
- **Unchanged:**
  - the bot's own acts still wait out the bubble, so Johan's v0.6.100 rule stands;
  - one queue keeps the order, so the other bots read the same sequence;
  - at `paceMs` 0 nothing changes.
- **Your LIVE tests:** your test that the verdict comes "no earlier than 2.8 s after the question" holds: the verdict now
  comes at 3.04 s. Your client suite ran green beside it (Gates). The panel should now show the next wait about 0.2 s
  before the verdict line, instead of 1.9–4.8 s before. Your second idea (delaying the panel) should therefore not be
  needed. Tell us if your rig still shows the panel ahead of the verdict.

## 2. The probe default (what your players will see)
- A stealth-bleed bot's "probe then punch" sends its small bleeders first and keeps the heavy bleed card (the Govern) for
  the last vampire. Before this release that was a knob (`probeHold`) defaulting to the old play: the order without the
  reservation, so the first vampire usually played the Govern.
- Johan chose the measured form as the default (2, 17 Oct). It holds the Govern back only while the bot out-numbers its
  prey's unlocked blockers. In our probe lab that pays +0.80 pool per probe turn and changes nothing otherwise.
- **At your tables:** when a bot has, say, three vampires ready and you have one blocker up, expect the first two to
  bleed small (often for 1) and the Govern to come last. A wake held for the big one still stops it.
- The arena takes `--knob probeHold=0` to play the old way (arena v1.4.8, unchanged).

## 3. Your reply to v0.6.206 (in your open PR #27)
Read, thank you. We consume v2.6.163 / srv-2.6.47 in our next round, once it is merged. Two notes:
- the negative intercept is Johan's call. Tell us before it ships, as you say.
- on face-down names at a hotseat, we will check whether any bot logic reads `name` on a face-down card.

## 4. The bundle
- Changed and copied to the root:
  - `elysium-bot.js` (v0.6.207);
  - `START-HERE-BOTS.html` (the version, and the probe sentence under 'Posture').

  cardfx and the twd files are byte-identical.
- **Deploy:** purge `/elysium-bot.js`, and re-embed the guide at your next client release.

## Gates (v0.6.207, from `bot/`)
- `node --check` on every changed file (`elysium-bot.js`, `test-bot-logic.js`); `ana-windows.py` compiles.
- **Suite 2204/0 ×3** — alone, each run in a frozen snapshot; `elysium-bot.js` 4ba3a5cf…, `test-bot-logic.js` 67e13d9d…,
  `elysium-cardfx.json` bea73088…. v0.6.206 had 2199; the five new are 151e and section 153 (151d changed).
- **Canary 69/0** (main's current client copies), **HB1 11/11**, **hotseat 11/0**. test-cardfx not run (cardfx unchanged).
- **check-versions** (from `client/`): everything agrees; the root's 21 files are byte copies.
- **Beside main's client v2.6.162:** the client suite 303/1. The one red is the embed drift (Help ▸ Bots embeds an older
  guide; a re-embed closes it). All 15 LIVE tests with the real bot are green, among them the two v2.6.162 verdict-timing
  tests the chat beat touches. Their canary 69/0.
- **The smoke** — seeds 9701, 9702, 9703 and 4003, the V5 table, on the v0.6.207 code before the version bump (the release
  bytes differ only in comments and the version line):
  - bleed 77/77 paired, VANISHED 0;
  - the reactions-only windows (`ana-windows.py`): 82, none lost its answer; 8 were block contests decided at the clock
    (5 blocked, 3 failed against the actor's stealth);
  - no `stale-answer` row;
  - the probe order fired 3 times and was reserved all 3 times (out-numbering each time), with 4 `probe-hold` rows;
  - handshake integrity, range and press 160/0, 160/0, 118/0, no wait in the safety net;
  - invariants 0 flags; the block audit 0 violations; no late bounce in 77 bleeds through; 3 fetches, no phantom window;
  - dealt ≠ taken in 19 rows, all explained: 8 the Murder of Crows Larissa Moreira bore, 7 her Guardian Angel, 3 Hidden
    Strength, 1 Carrion Crows; steal pairs 13 of 13 equal.
- **For comparison, v0.6.206's final smoke** (the same seeds, `probeHold` 0): bleed 77/77, 0 of 80 windows lost (5
  contests, all blocked), the probe order 6 times and reserved 0, one right `stale-answer` row, 188/0, 188/0, 150/0.
- **Beside your open PR #27** (client v2.6.163 + srv-2.6.47, your security release; a scratch tree of its head
  b618adb with this branch's `bot/` and bundle on top — a courtesy check, not a gate):
  - check-versions agrees;
  - your client suite 307/1. The one red is the Bots-page embed drift: you embed v0.6.206's guide, and v0.6.207's chip
    and 'Posture' sentence differ. All 16 LIVE tests with the real bot are green. Your canary 69/0;
  - our canary 69/0 and hotseat 11/0 with your v2.6.163 client and protocol copied in (scratch only);
  - one arena match against srv-2.6.47 (seed 4003): 10 rounds, no timeout, no dropped connection, bleed 20/20 paired, 0
    of 22 reactions-only windows lost (2 contests, both blocked), no `stale-answer` row, handshake / range / press 68/0,
    68/0, 47/0, invariants 0 flags, the block audit 0 violations, no late bounce;
  - found there, older than this release and ours to fix: one steal pair between two bots disagrees (a combat-ends
    strike against a steal). Nothing for you.
