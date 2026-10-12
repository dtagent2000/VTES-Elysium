# Elysium Bots — delivery 25 September 2026 (d): cardfx compiler **v1.9.1** (bot unchanged, v0.6.175)

**What was checked.** The sweep's second pass compared cardfx against KRCG on four things: library costs, discipline requirements, clan requirements, and the crypt basics. The results are in `REPORT-cardfx-sweep-full.md`, section "Pass 2".

**What agreed.**
- All 977 costs agree with KRCG.
- All 1,785 crypt entries agree: capacity, clan, disciplines, group and title.
- The 3 numeric abilities of our 56 deck vampires are all modelled.

**What was fixed (compiler v1.9.1).** Curated entries now inherit the data's discipline and clan requirements, the same way they already inherited costs.
- 13 cards regained a requirement: Deep Song, Guard Dogs, Creeping Sabotage (Nosferatu) and others.
- Masters never inherit a clan, so the Hunting Grounds and Warsaw Station stay clan-free.
- No play changed: the bot gates play on the mode's discipline level.

**What is left for later.** About 640 numeric crypt abilities across the whole crypt are still unmodelled. They matter when the bots play decks beyond the six starters, so they belong to the knowledge / meta layer.

**Gates.**
- test-cardfx: 261/0
- Suite: 1717/0
- Canary: 57/0
- Hotseat: 10/0
- Bot-only regression: handshake 156/156, names 148/148

**Deploy:** `elysium-cardfx.json`. The bot is unchanged at v0.6.175.

**Replace:** `elysium-cardfx.json`, `cardfx-compile.js`, `test-cardfx.js`, `REPORT-cardfx-sweep-full.md`, `elysium-bot-CHANGELOG.md`, `CLAUDE.md`.

**Add:** `sweep-pass2.py`, `sweep-pass2-rows.csv`, this file.
