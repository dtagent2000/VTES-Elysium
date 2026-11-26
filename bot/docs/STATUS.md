# STATUS — Elysium Bots (rewritten at every release and round; 26 November 2026)

**Bot v0.6.241** (25 Nov 2026, the exactness round) · arena v1.4.17 · sim table v1.1.0 · cardfx compiler v1.11.4, curated 221 ·
hotseat tool v1.5.0 · coverage tool v1.1.56 · card ledger v1.3.0 · review sheet v1.0.1 · precon generator v1.1.1 · `krcg-v5.js`
v1.0.0 · `ana-gates.py` v1.1.4 · the chat recorder and `tools/ana-chat.py` v1.0.0 · the workflow scripts (W1) ·
the read-only copies in bot/ are client v2.6.179 / protocol v2.6.179 / srv-2.6.51;
the root's release is client v2.6.188 / srv-2.6.53 (the canary's second run).

**Deploy state:** `main` carries v0.6.241 (#108 and #109 merged 26 Nov) and client v2.6.188 (#104). **Open:** W1, the workflow
round (D-139, no bot change).

## Last gates (v0.6.241's release bytes, `d797e1fd`, test `a8557422`, cardfx `4627ff1c`)
26 Nov: the suite 2841/0 ×3 · canary 235/0 ×2, main's v1.6.0 247/0 · cardfx 503/0 · hotseat 12/0 · HB1 11/0 · lint clean ·
main's client suite 430/1 (the guide's embed) · the arena smoke PASS 7/7 · the 240 against v0.6.240 DIVERGED 196 / SAME-PLAY 44,
`ana-gates.py` PASS 6/6. W1 (the same bytes): `tools/gates.sh --sim` PASS 13/13, the 240 IDENTICAL; CI 2841/0 ×3.

## Next (Johan's order of 26 Nov, the project's handoff)
1. **C1**, the cross-check against zero-vtes (spec-card-sweep §11.8, D-132): the tool (a family's values by level; where our entry
   says less), then `stealth` / `actStealth`, `intercept`, `bleed` over the library; the fidelity pass of the other 13 V5 decks then
   reads only the flagged cards (D-138).
2. The register's active entries Bonding [DOM] (10.17) and Protection Racket (7.5) (Johan's order), then 8.3 and 11.1: a small
   release each (D-135).
3. Johan's answers, then a PR each: O-53 (the playtests' table questions; the resolution panel is main's, a handoff) and O-52
   (the pool floor); Cloak the Gathering (8.7) and Raven Spy (1.3). Then Johan playtests the combined version.
4. Faceless Night [OBF] (10.1) waits for its design. Not yet in the register: a human's Carrion Crows (its environmental damage)
   and The Dowager's +1 at a human table (class 4; BOARD's D-111 line): C1's PR adds them.
5. Still open: Johan's rulings on the chat lines (O-51); main's v2.6.187–188 (the guide, the copies, the canary cases for
   `BLOCKED_LOCK` and `RIDER_STEALTH`); asked 20 Nov, no kör: the pilot's flow proposals, the D line on KRCG's MCP, BOARD's
   read-through, class 1's design question (R-47); C's riders; the fizzle misread; Q4; C5; C6; the abstract model; class 14;
   `ana-windows.py` and the floor; the steal-pair debt.

## Not yet consumed from main
Client v2.6.187 (#102) and v2.6.188 (#104). Unanswered handoffs (`docs/handoffs/`): the queued bridge (19 Nov), v0.6.235's
bundle, the guide for v2.6.179 and the licence (D-128), v0.6.236's and v0.6.237's lines, v0.6.240's and v0.6.241's (re-embed the
guide; `BLOCKED_LOCK`, `RIDER_STEALTH` for §12).
