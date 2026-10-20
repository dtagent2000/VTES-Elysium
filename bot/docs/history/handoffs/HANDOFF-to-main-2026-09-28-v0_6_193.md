# HANDOFF — bot v0.6.193 to main (28 Sep 2026): deploy, the tempo spec, three asks

**From:** the bot project. **To:** main (client v2.6.138 / srv-2.6.42 are the versions we built against).

## 1. Deploy
- **`elysium-bot.js` v0.6.193** to the bot processes AND the hotseat bundle (v0.6.174 → 193 since the last deploy; gates green: suite 1749/0, canary 57/0 vs v2.6.138, hotseat 10/0).
- **`elysium-cardfx.json`** (recompiled 25 Sep: `ranged` on strikes, Bowl of Convergence's paid intercept, Legion, Madman's Quill, inherited requirements) — beside the bot.
- **`elysium-twd-profile.json`** (93 KB) and **`elysium-twd-archetypes.json`** (55 KB) — beside the bot. They are the knowledge layer's data (§3). In node the bot loads them from its own directory; **in the browser the client must hand them to the bot as `twdProfile` and `twdArchetypes`** (two objects) at construction — that is the one client change the knowledge layer needs. Without them the knowledge is simply off.

## 2. The tempo — `spec-bot-tempo-2026-09-27.md`
The players' main complaint is the wait against bots. The spec asks for a gear in the Bot button (tempo: Standard / Adaptive / Turn-based, a wait-time slider), one message `botcfg` (client → server → all, stored for late joiners), and a log line on each change. The bot side is next on our list and can be built in parallel; a bot without a `botcfg` behaves exactly as today. Three decisions are yours (who may change it, the Bot button as "give the bot the word" in Turn-based, the default).

## 3. What changed in the bot since the last handover (for your awareness)
- **The knowledge layer, brick 1 (on):** from KRCG's TWDA export the bot expects what a seat's deck is (combat / stealth / intercept / bounce) from its crypt's clan and the library cards it has shown — public evidence only. A Tremere sniper facing a pacifist seat now presses instead of maneuvering. Benched: no loss.
- **Brick 2 (on):** the influence floor rises with the recurring losses a bot carries (Creeping Sabotage, Smiling Jack, Fame). Re-benched after a fix: no loss.
- **Archetype labels (explanation only):** once per seat, when confident, a bot says what it reads a deck as ("I read Johan's deck as Lawfirm (7 of 8 cards typical)."). No decision reads a label. Knob `arkChat: 0` silences it.
- **No wire changes.** No new lines, no new tally fields, no new messages from the bot. Everything you built for v2.6.134–138 is used as is.

## 4. Three asks
1. **`twdProfile` and `twdArchetypes` in the browser bundle** (§1) — small, and it turns the knowledge layer on in hotseat.
2. **The tempo** (§2) — the spec.
3. **The four silent pool changes** (from the invariant work): a political action's pool cost at announce, an ally recruit's cost, a blocked action's returned cost, and a bot's own referendum swing change the bot's pool with no table line. They are correct by the rules, but a human cannot see them in the log. Johan decides whether the bot should print a short line for each (e.g. `pays 1 pool for X`); it is a bot-side change, no client work — flagged here so you know why a bot's pool can move without a line today.

## 5. Not in this handover
The rest of the knowledge layer (the press feature, the calibration of blocks and the Malkavian wave, personas) is bot-side work with no client dependency; nothing to build on your side for it.
