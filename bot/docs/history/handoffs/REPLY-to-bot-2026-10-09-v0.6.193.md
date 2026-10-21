# REPLY — main to the bot project: v0.6.193 received (9 Oct 2026)

**From:** main (client **v2.6.139** / server **srv-2.6.43**). **To:** the bot project (bot v0.6.193). **Answers:** `HANDOFF-to-main-2026-09-28-v0_6_193.md` and `spec-bot-tempo-2026-09-27.md`.

**Verified here with v0.6.193 beside the suite:** client suite 236/0 (incl. the LIVE tests), your canary 57/0, endpoint smoke 24/0 (both twd files served with 200).

## 1. The knowledge layer is on in the browser
- **Both spawn paths** (hotseat `hotSpawnBots`, the online lobby's `netBotAdd`) pass `twdProfile` and `twdArchetypes` at construction.
  - One object each per page load, shared by every bot. The browser never parses them per bot.
  - A LIVE test checks identity: `b.twd === profile && b.ark === archetypes`.
- **Over http** the client fetches `elysium-twd-profile.json` and `elysium-twd-archetypes.json` beside `elysium-cardfx.json`.
  - Shape check before handing them over: `cards` for the profile, `archetypes` for the signatures (the same keys your code tests).
  - A missing or misshapen file is `null`. It is never an error, and the bots then simply read no decks.
- **srv-2.6.43 serves both files** on the exact-match route (now a fixed set of four paths). The deploy purges four URLs.
- **One ask — `.js` siblings for file://.** A local-file table cannot `fetch()` the JSONs.
  - The client already tries `elysium-twd-profile.js` and `elysium-twd-archetypes.js` (classic script tags, the `elysium-cardfx.js` vehicle).
  - It reads `globalThis.ELYSIUM_TWD_PROFILE` and `globalThis.ELYSIUM_TWD_ARCHETYPES`.
  - Could `twd-profile.py` / `twd-archetypes.py` write those siblings from the same serialize, as the cardfx compiler does? Until then a local-file table plays without deck knowledge (silently).

## 2. The tempo: main's side is built
**The wire, exactly:**
- **Client → server:** `{ t:'botcfg', tempo?, waitSecs? }`. Our client sends PARTIAL writes: only what the click changed.
- **Server → everyone:** `{ t:'botcfg', who, tempo, waitSecs }`, always the WHOLE state, the sender included.
  - `tempo`: `'standard' | 'adaptive' | 'turn'`. `waitSecs`: 1.0–8.0, clamped, in tenths.
  - An absent or invalid field keeps the stored value. A table with nothing stored merges onto Standard / 3 s. A write with nothing valid is dropped.
- **Who may send:** any seated HUMAN, in the lobby or the game. A seat that joined with `bot:true` is ignored, and spectators and referees cannot send it.
- **Late joiners:** a stored tempo is replayed right after `joined`, before `lobby` in an unstarted room. Your bot hears it before its deck upload. `who` is then the stored setter.
- **Hotseat:** the bridge does the same (`hotBridge.botcfgIn`, self-contained in the literal you lift, replayed after `joined`).

**What a bot will receive in practice:**
- **Seeded default.** Every table with bots starts at Standard / 3 s. The bridge stores it before any bot joins, and online the host's client sends it once when the first bot sits down.
- **Why the seed matters.** Without it your bots would keep their spawn clocks. Ours spawn with `askSecs: 20`, so a combat step waits 60 s (`phaseSecs` = max(6, 3 × askSecs)). That is probably much of the "frustrating wait" in our client.
- **The log line is not yours to parse.** It is the sender's own plain log, `NAME set bot tempo: Adaptive, 3 s.` or `NAME set bot tempo: Turn-based.`, and not a §12 line.

**Johan's three decisions:** built with your proposals, each a one-line change if he decides otherwise.
1. **Anyone at the table** may change the tempo. Online, every seated human now sees the 🤖 badge and its gear, not only the host.
2. **Turn-based "give the bot the word":** a ▶ beside the 🤖 calls `step()` on every bot this tab runs whose wait is steppable and is not a hold.
   - So please make Turn-based waits steppable through `status()` / `step()` (`canStep: true`, `step` = `'resolve-ask'` or `'resolve-pq'`).
   - A non-host human online answers with Pass, a line or the Combat menu. That tab holds no bots, so it cannot step them.
3. **Default:** Standard / 3 s.

**How the panel tells whether a bot reads `botcfg`:** it checks `typeof bot._handlers.botcfg === 'function'`, your dispatch table keyed by wire verb. v0.6.193 has none, so the panel says "This bot file (v…) does not read the tempo yet". Please keep the handler in `_handlers` under that name (or tell us if dispatch changes). v0.6.193 receives `botcfg` silently today, with no handler error (checked LIVE).

## 3. The four silent pool changes
Johan decides. Main has no client work either way.

## 4. Found here, for your awareness
- **Main's v2.6.133 LIVE test was hand-dependent.** The Ventrue deck has Majesty ×6, and with v0.6.193 the bot ended the combat at its strike in about half the runs, so the test waited for a round 2 that never came.
  - We now empty the bot's hand in that test. The flow under test is the helper's, not your card choice.
  - Not a bug report. Is Majesty against a single hand strike for 1 the play you intend?
- **Your combat close (`mode: null`, v0.6.172) works.** The human's screen clears at once.
  - A bare `null` does not run the humans' own resolve settings: their Played batch stays open until their next action.
  - If you want their batches closed with your combat, send `res: 1` with the close. Optional.
- **START-HERE-BOTS.html as re-issued (embedded verbatim):**
  - the footer still says bot v0.6.155 / client v2.6.125;
  - "No deck reading yet" predates the knowledge layer;
  - the setup note lists two bot files (now four);
  - the tempo gear will need a paragraph once your side ships.
- **srv-2.6.43 also fixed the room snapshot.** A seat's bot flag now survives a server restart (it was lost before, and the census counted a restored bot as a human). A restored table is no longer swept after ten minutes, and a reconnecting bot keeps its flag.

## Deploy
- **Client:** v2.6.139 (purge).
- **Server:** srv-2.6.43 (restart).
- **Bot:** v0.6.193 beside the server, with `elysium-cardfx.json`, `elysium-twd-profile.json` and `elysium-twd-archetypes.json`. Purge all four URLs.
