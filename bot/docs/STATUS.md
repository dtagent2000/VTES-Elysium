# STATUS — Elysium Bots (rewritten at every release and round; 26 November 2026)

**Bot v0.6.242** (26 Nov 2026, the bundle's cleanup release) · arena v1.4.17 · sim table v1.1.0 · cardfx compiler v1.11.4, curated 221 ·
hotseat tool v1.5.0 · coverage tool v1.1.56 · card ledger v1.3.0 · review sheet v1.0.1 · precon generator v1.1.1 · `krcg-v5.js`
v1.0.0 · `ana-gates.py` v1.1.4 · the chat recorder and `tools/ana-chat.py` v1.0.0 · the workflow scripts (W1) ·
`tools/public-scan.py` v1.1.1 · the read-only copies in bot/ are client v2.6.179 / protocol v2.6.179 / srv-2.6.51;
the root's release is client v2.6.188 / srv-2.6.53 (the canary's second run).

**Deploy state:** `main` carries v0.6.241, W1 (#110), W1b (#111) and the cleanup round (#113). **Open:** v0.6.242, the bundle's
cleanup release (#114; D-141 – D-143), with the private data repo's #5 (D-143's words); C1's first part (#112, a draft, to rebase
on main after #114).

## Last gates (v0.6.242's release bytes, `154debea`, cardfx `52477ed1`; the suite file `0e306ac2`)
26 Nov, on bb857db: `tools/gates.sh --sim` PASS 15/15 (canary 235/0 ×2 · cardfx 503/0 · hotseat 12/0 · HB1 11/0 · lint clean ·
precon 18 · doc-budget · public-scan 0 hits, the tree 0) · CI's suite 2841/0 ×3 · main's client suite beside these bytes 430/1
(the guide's embed) · the 240 against v0.6.241 SAME-PLAY 240, IDENTICAL 240 with the version and the decide rows' changed
attribution put back on both sides (only the results' wall and cpu times differ), `ana-gates.py` PASS 6/6.

## Next (the owner's order of 26 Nov; D-142)
1. **C1** (spec-card-sweep §11.8, D-132): #112 rebased on main, its release then v0.6.243; the readers on the flagged rows, the
   corrections; then the fidelity pass of the other 13 V5 decks reads only the flagged cards (D-138).
2. The register's Bonding [DOM] (10.17) and Protection Racket (7.5), then 8.3 and 11.1: a small release each (D-135).
3. The owner's answers, then a PR each: O-53 (the playtests' table questions; the resolution panel is main's, a handoff) and O-52
   (the pool floor); Cloak the Gathering (8.7) and Raven Spy (1.3). Then the owner playtests the combined version.
4. Faceless Night [OBF] (10.1) waits for its design. Still open: O-51; main's v2.6.187–188 (the guide, the copies, the canary
   cases for `BLOCKED_LOCK` and `RIDER_STEALTH`); asked 20 Nov, no go-ahead: the pilot's flow proposals, the D line on KRCG's MCP,
   BOARD's read-through, class 1's design question (R-47); C's riders; the fizzle misread; Q4; C5; C6; the abstract model; class
   14; `ana-windows.py` and the floor; the steal-pair debt.

## Not yet consumed from main
Client v2.6.187 (#102) and v2.6.188 (#104). Unanswered handoffs (`docs/handoffs/`): the queued bridge (19 Nov), v0.6.235's
bundle, the guide for v2.6.179 and the licence (D-128), v0.6.236's and v0.6.237's lines, v0.6.240's and v0.6.241's (`BLOCKED_LOCK`,
`RIDER_STEALTH` for §12), the public repository (26 Nov: main's files under D-141), v0.6.242's (re-embed the guide: it covers the
re-embeds v0.6.240's and v0.6.241's asked for; the sewer deck's new name).
