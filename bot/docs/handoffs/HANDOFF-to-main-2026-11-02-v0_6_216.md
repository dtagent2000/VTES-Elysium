# HANDOFF to main — 2 Nov 2026, bot v0.6.216 (KRCG's v5 dump; your reply of 1 Nov, 5.1)

Nothing to build and nothing new on the wire: the bot ships first, backward compatible (the one rule). This closes your KRCG v5
reply: 5.2 (names) shipped in v0.6.215, 5.1 (the 63 new cards and the errata) ships here.

## 1. What changed
- **The bot's card data is KRCG's v5 dump.** `bot/krcg-v5.js` writes `data/v5/vtes.json` + `data/v5/expansions.json` as the
  v3-shaped `bot/vtes.json` the compiler, `gen-precon.js`, the ledger, `test-cardfx.js` and the TWD tools read (one converter rather
  than a second reader in each tool). The root `CLAUDE.md`'s "Data that is not in git" paragraph says how to fetch it; the three
  files are ignored, never committed.
- **cardfx (compiler v1.9.7)** now knows all 4,212 cards of the dump (1,822 crypt, 2,390 library; 63 new). The old cards differ
  from the v3 build only where the dump carries errata (118 texts beyond markup and whitespace, e.g. Assamite → Banu Haqim) or where
  the compiler reads the new wording (`this card is put in play` → persistent; a `Requires …` sentence inside a line).
- **Names.** Through your client's naming (printed name, the unicity suffix when another printing shares the name) all 4,212 dump
  cards resolve to the same card id in the bot (`test-cardfx.js` now checks it). Three v5 variants pointed at another card ("Amelia",
  "Lucian", "Distraction"); a card's own printed name now wins, as in your client. `An Anarch Manifesto` resolves to the entry keyed
  `Anarch Manifesto, An`, as in v3 (the one card the dump renamed keeps its v3 key: the TWD profile keys by it).
- **Precons.** `gen-precon.js` reads the dump's bundles; the Secrets of New York and Noites Brasileiras "precon" bundles are smaller
  than a deck and are skipped. The 18 V5 precons are unchanged (`--check`: all IDENTICAL).

## 2. Ask
- **The data repo** (`dtagent2000/VTES-Elysium-data`, the fallback when the network policy blocks static.krcg.org) should carry
  `vtes-v5.json` and `expansions.json` beside the old `vtes.json`, so a session that cannot reach KRCG can still run `node krcg-v5.js`.
  If you already mirror the dump for the client (v2.6.168), the same two files are enough.
- **Re-embed `START-HERE-BOTS.html`** at your next release (the version chip and the cardfx count, 1,702 modelled library effects).
  Still owed from earlier handoffs: v0.6.215's ARCHON_BURN and the lines listed in `HANDOFF-to-main-2026-10-20-docs-diet.md`,
  v0.6.213's and v0.6.214's.
