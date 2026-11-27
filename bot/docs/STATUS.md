# STATUS — Elysium Bots (rewritten at every release and round; 27 November 2026)

**Bot v0.6.243** (27 Nov 2026, C1: the V5 sweep's first family) · arena v1.4.17 · sim table v1.1.0 · cardfx compiler v1.12.0, curated 301 ·
hotseat tool v1.5.0 · coverage tool v1.1.56 · card ledger v1.3.0 · review sheet v1.1.0 · cross-check v1.2.0 · precon generator v1.1.1 · `krcg-v5.js`
v1.0.0 · `ana-gates.py` v1.1.4 · the chat recorder and `tools/ana-chat.py` v1.0.0 · the workflow scripts (W1) ·
`tools/public-scan.py` v1.1.1 · the read-only copies in bot/ are client v2.6.179 / protocol v2.6.179 / srv-2.6.51;
the root's release is client v2.6.191 / srv-2.6.54 (the canary's second run).

**Deploy state:** `main` carries v0.6.242 (#114), client v2.6.190 (#116, comments only) and v2.6.191 (#117, merged into C1's branch). **Open:** v0.6.243, C1 (#112: the
cross-check tool, the family's corrections, `cardfx-exact.json`; D-144), with the private data repo's #7 (D-144's words).

## Last gates (v0.6.243's release bytes, `14d48ac8`, cardfx `c4b9545e`; the suite file `bae2970e`)
27 Nov, on 86d02f6: `tools/gates.sh --sim --smokes` PASS 17 · FAIL 1 (canary 235/0 ×2, the root's v2.6.191 · cardfx 516/0 ·
hotseat 12/0 · HB1 11/0 · lint clean · precon 18 · cross-check 19/0 · doc-budget · public-scan 0 hits · the 240 against v0.6.242
SAME-PLAY 240, IDENTICAL 240 with the version put back, `ana-gates.py` PASS 6/6); the FAIL is the V5 smokes, 13 of 14: banuhaqim's
ledger fault, main's bytes give it too on the same seed. CI's suite ×3: the PR.

## Next (the owner's order of 26 Nov and D-144)
1. **C1b**: the fidelity pass of the other 13 V5 decks reads their flagged cards (D-138, D-144 (1)), with the family's second pass:
   the 29 "extra cost" flags the pairing's blood token now finds (spec §11.7).
2. **The first readers' round** (D-132): its design to the owner first (spec §11.6: who moves the counter when a human plays a
   stealth card, a number entered both ways counted once) and the bundle's exactness field (D-144 (2)). Then C2, combat.
3. The register's Bonding [DOM] (10.17) and Protection Racket (7.5, its reader: 7.6), then 8.3 and 11.1: a small release each (D-135).
4. The owner's answers, then a PR each: O-53 (the playtests' table questions; the resolution panel is main's, a handoff) and O-52
   (the pool floor); Cloak the Gathering (8.7) and Raven Spy (1.3). Then the owner playtests the combined version.
5. Faceless Night [OBF] (10.1) waits for its design. Still open: O-51; main's v2.6.187–188 (the guide, the copies, the canary
   cases for `BLOCKED_LOCK` and `RIDER_STEALTH`); asked 20 Nov, no go-ahead: the pilot's flow proposals, BOARD's read-through,
   class 1's design question (R-47); C's riders; the fizzle misread; Q4; C5; C6; the abstract model; class 14; `ana-windows.py` and
   the floor; the steal-pair debt.

## Not yet consumed from main
Client v2.6.187 (#102), v2.6.188 (#104), v2.6.189 (#115), v2.6.190 (#116, comments only) and v2.6.191 (#117: a human's blood
and pool moves, no wire change; its reply to v0.6.242 relays the owner's answer on O-46, no tempo wait: close it): v2.6.189's reply
(`client/docs/handoffs/REPLY-to-bot-2026-11-26-v0.6.241.md`) answers eight handoffs (the queued bridge, v0.6.235, the guide for
v2.6.179, the licence, v0.6.236, v0.6.237, v0.6.240, v0.6.241): to consume in a bot round (its items built or declined, the
handoffs moved to history, the copies refreshed to v2.6.191 / canary v1.7.0, `bot/README.md` to point at the root `LICENSE`).
Open: the public repository (main set its own scope, the reply's §6); v0.6.243's guide (301 curated) to re-embed. v0.6.242's
asks were answered in v2.6.191's reply (the guide embedded, the deck's name needs nothing).
