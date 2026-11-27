# STATUS — Elysium Bots (the one place for the state, D-142; its marked blocks are generated: `tools/round.py status`, D-145)

<!-- round.py:versions -->
**Bot v0.6.245** · arena v1.4.17 · sim table v1.1.0 · cardfx compiler v1.13.0, curated 301 · hotseat tool v1.5.0 · coverage tool v1.1.56 · card ledger v1.3.0 · review sheet v1.1.0 · cross-check v1.2.0 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 · `ana-gates.py` v1.1.4 · abstract table v1.0.0 · reader gate v1.1.0 · scenario bench v1.1.0 · the chat tools v1.0.0 · `tools/public-scan.py` v1.1.1 · `tools/round.py` v1.0.1 · the read-only copies in bot/ are client v2.6.179 / protocol v2.6.179 / srv-2.6.51; the root's release is client v2.6.192 / srv-2.6.54 (the canary's second run).
<!-- /round.py:versions -->

<!-- round.py:deploy -->
**Deploy state** (read at the round's end, 28 Nov): `main` `60c59e8` carries bot v0.6.244 at the root, with client v2.6.192 / srv-2.6.54. Open pull requests: #122 `r11-11` (draft); the private data repo: #11 `words-11-11-order-2026-11-27`.
<!-- /round.py:deploy -->

<!-- round.py:gates -->
## Last gates (`docs/round-record.json`)
`tools/gates.sh --sim` on `r11-11` `58cb57d` + the working tree (28 Nov; bytes `421f5256` / `c92475b9` / cardfx `21ef103f`): PASS 20 · FAIL 0 · SKIPPED 0 — check 38 of 38 scripts parse · lint clean · canary 235/0 · canary-root 235/0 · cardfx 524/0 · precon 18 precons, no problems · ledger-self 81/0 · sheet-self 23/0 · cross-self 19/0 · table-self abstract table 1.0.0: 6/0 (416 ms) · reader 871 rows, 363 gated, 286 read, 65 unread (65 listed, 0 new), 0 stale, 12 no value · self-test 8/0 · bench 821 kept rows, 235 with a scenario, 306 scenarios, 306 played right, 0 rows wrong (0 listed, 0 new), 0 stale · self-test 5/0 · ana-gates-self 35/0 · hb1 11/0 (0 skip) · hotseat 12/0 · doc-budget bootstrap 39337 / 50000 · standing pages 186898 / 187000 · public-scan-self 35/0 · round-self 24/0 · public-scan 0 hits in 0 files · sim-240 240 matches: SAME-PLAY 240 · 0.6.244 -> 0.6.245, with the version put back: 240 matches: IDENTICAL 240 · ana-gates PASS (6 of 6) · bytes 421f5256 c92475b9 21ef103f. CI's suite 2878/0 ×3, `bot-gates` success on `cf2cf29`.
<!-- /round.py:gates -->

## Next (the owner's order, 26–28 Nov: D-144, D-145, D-147, D-148, D-149)
1. **Register 11.15 + 11.17** (the owner, 28 Nov): one record per action, a design round.
2. **C1c** (D-148 (2)): the cross-check compares the price and the condition beside the number; a second sample of the agreeing
   rows is read (`reports/REPORT-c1b-2026-11-27.md`).
3. **Main's replies** (D-148 (3)), a round of their own: "Not yet consumed" below.
4. **The first readers' round** (D-132): its design to the owner first (spec §11.6) and the bundle's exactness field (D-144 (2)).
   Then C2, combat.
5. The register's 8.3 and 11.1: a small release each (D-135).
6. The owner's answers, then a PR each: O-53 (the playtests' table questions; the resolution panel is main's, a handoff) and O-52
   (the pool floor); Cloak the Gathering (8.7) and Raven Spy (1.3). Then the owner playtests the combined version.
7. Faceless Night [OBF] (10.1) waits for its design; O-51, and the 20 Nov proposals with no go-ahead (the pilot's flow, BOARD's
   read-through, class 1's design question, R-47); the rest of BOARD in its order.

## Not yet consumed from main
Client v2.6.187 (#102), v2.6.188 (#104), v2.6.189 (#115), v2.6.190 (#116, comments only), v2.6.191 (#117: a human's blood and pool
moves, no wire change; its reply relays the owner's answer on O-46, no tempo wait: close it) and v2.6.192 (#118, the tutorial's
texts). v2.6.189's reply (`client/docs/handoffs/REPLY-to-bot-2026-11-26-v0.6.241.md`) answers eight handoffs (the queued bridge,
v0.6.235, the guide for v2.6.179, the licence, v0.6.236, v0.6.237, v0.6.240, v0.6.241): its items built or declined, the handoffs
to history, the copies refreshed to the root's release / canary v1.7.0, `bot/README.md` pointing at the root `LICENSE`. Open: the
public repository (main's own scope, the reply's §6); the guide (301 curated) to re-embed.
