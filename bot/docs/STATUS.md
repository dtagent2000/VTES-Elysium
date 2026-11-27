# STATUS — Elysium Bots (the one place for the state, D-142; its marked blocks are generated: `tools/round.py status`, D-145)

<!-- round.py:versions -->
**Bot v0.6.243** · arena v1.4.17 · sim table v1.1.0 · cardfx compiler v1.12.0, curated 301 · hotseat tool v1.5.0 · coverage tool v1.1.56 · card ledger v1.3.0 · review sheet v1.1.0 · cross-check v1.2.0 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 · `ana-gates.py` v1.1.4 · the chat tools v1.0.0 · `tools/public-scan.py` v1.1.1 · `tools/round.py` v1.0.0 · the read-only copies in bot/ are client v2.6.179 / protocol v2.6.179 / srv-2.6.51; the root's release is client v2.6.192 / srv-2.6.54 (the canary's second run).
<!-- /round.py:versions -->

<!-- round.py:deploy -->
**Deploy state** (read at the round's end, 27 Nov): `main` `77c5ded` carries bot v0.6.243 at the root, with client v2.6.192 / srv-2.6.54. Open pull requests: #119 `docs-diet` (draft); the private data repo: #8 `words-d145-2026-11-27`.
<!-- /round.py:deploy -->

<!-- round.py:gates -->
## Last gates (`docs/round-record.json`)
`tools/gates.sh` on `docs-diet` `eb0f3c8` (27 Nov; bytes `14d48ac8` / `bae2970e` / cardfx `c4b9545e`): PASS 16 · FAIL 0 · SKIPPED 0 — check 35 of 35 scripts parse · lint clean · canary 235/0 · canary-root 235/0 · cardfx 516/0 · precon 18 precons, no problems · ledger-self 81/0 · sheet-self 23/0 · cross-self 19/0 · ana-gates-self 35/0 · hb1 11/0 (0 skip) · doc-budget bootstrap 39238 / 50000 · standing pages 183455 / 184000 · public-scan-self 35/0 · round-self 24/0 · public-scan 0 hits in 0 files · test-doc-budget every case red, the baseline and the allowed moves green. CI's suite 2841/0 ×3, `bot-gates` success on `cca8d0c`.
<!-- /round.py:gates -->

## Next (the owner's order of 26–27 Nov: D-144, D-145, and his yes after C1 to the card chain)
1. **The card chain**, before C1b: a reader gate (a corrected key or shape no code reads fails), scenario tests per card through
   the bot's real path, a sample of the agreeing rows read, the decks in play first; its design questions on that round's card.
   The readers' output is a data file beside the round's report (D-145).
2. **C1b**: the fidelity pass of the other 13 V5 decks reads their flagged cards (D-138, D-144 (1)), with the family's second
   pass on the 29 "extra cost" flags (spec §11.7).
3. **The first readers' round** (D-132): its design to the owner first (spec §11.6: who moves the counter when a human plays a
   stealth card, a number entered both ways counted once) and the bundle's exactness field (D-144 (2)). Then C2, combat.
4. The register's Bonding [DOM] (10.17) and Protection Racket (7.5, its reader: 7.6), then 8.3 and 11.1: a small release each (D-135).
5. The owner's answers, then a PR each: O-53 (the playtests' table questions; the resolution panel is main's, a handoff) and O-52
   (the pool floor); Cloak the Gathering (8.7) and Raven Spy (1.3). Then the owner playtests the combined version.
6. Faceless Night [OBF] (10.1) waits for its design. Still open: O-51; main's v2.6.187–188 (the guide, the copies, the canary
   cases for `BLOCKED_LOCK` and `RIDER_STEALTH`); asked 20 Nov, no go-ahead: the pilot's flow proposals, BOARD's read-through,
   class 1's design question (R-47); C's riders; the fizzle misread; Q4; C5; C6; the abstract model; class 14; `ana-windows.py` and
   the floor; the steal-pair debt.

## Not yet consumed from main
Client v2.6.187 (#102), v2.6.188 (#104), v2.6.189 (#115), v2.6.190 (#116, comments only), v2.6.191 (#117: a human's blood and pool
moves, no wire change; its reply relays the owner's answer on O-46, no tempo wait: close it) and v2.6.192 (#118, the tutorial's
texts). v2.6.189's reply (`client/docs/handoffs/REPLY-to-bot-2026-11-26-v0.6.241.md`) answers eight handoffs (the queued bridge,
v0.6.235, the guide for v2.6.179, the licence, v0.6.236, v0.6.237, v0.6.240, v0.6.241): to consume in a bot round (its items built
or declined, the handoffs moved to history, the copies refreshed to the root's release / canary v1.7.0, `bot/README.md` to point
at the root `LICENSE`). Open: the public repository (main set its own scope, the reply's §6); v0.6.243's guide (301 curated) to
re-embed.
