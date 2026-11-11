# STATUS — Elysium Bots (rewritten at every release; 11 November 2026)

**Bot v0.6.218** (11 Nov 2026, round C2) · arena v1.4.8 · sim table v1.1.0 (round C3) · cardfx compiler v1.9.8, curated 156 · hotseat tool v1.4.0 ·
coverage tool v1.1.44 · precon generator v1.1.1 · KRCG converter `krcg-v5.js` v1.0.0 · `ana-gates.py` v1.0.0 ·
built against the root's release, client v2.6.172 / srv-2.6.49 (our canary 69/0 against it);
the read-only copies in `bot/` are client v2.6.162 / protocol v2.6.162 / srv-2.6.46 (refreshed 16 Oct; how: HARNESS).

**Deploy state:** `main` carries v0.6.217 (#47), client v2.6.172 (main's #51), C3 (#50), the Toreador read (#52), crypt round 0
(#53), C4's CI (#54, #57), the v5 TWDA (#58, D-110) and the security handoff to main (#59). **Open PR:** round C2, v0.6.218.

## Last gates (v0.6.218 release bytes, 11 Nov 2026)
Suite **2393/0 ×3** (alone, frozen snapshots, `--max-old-space-size=4096`) · lint 0 findings on 25 files, nothing suppressed ·
canary **69/0** (bot/'s copies) and 69/0 (root v2.6.172 + `client/ELYSIUM-PROTOCOL.md`) · hotseat **11/0** · HB1 **11/11** ·
test-cardfx **315/0** · `gen-precon.js --check` 18 precons, no problems · main's `check-versions.js` agrees · sim vs v0.6.217: the
240-match client design SAME-PLAY 240 (the version string only; IDENTICAL 240 with it normalized) · `ana-gates.py` on it: PASS 6 of 6.

## What v0.6.218 did (the latest release; older ones in the CHANGELOG)
Round C2, no behaviour change: the lint's 26 first-run findings fixed and its suppressions pruned to `{}`; the ten legacy tests and
`_bumpTallyB` deleted; `ana-gates.py` (one PASS / FAIL line per series audit, HOWTO) and the ledger's own row for a bleed after the
game's end; the guide's chip, footer and curated count (main's 6 Nov note).

## Next (proposed; Johan orders the board)
1. Crypt wave A (D-108): Claude's proposal of 6 Nov (in chat) waits for Johan's "kör"; then Toreador in the menu.
2. V5 wave 5 — Johan picks its shape: the eighteen masters in play, Meditative Grove's cancel, Sudden Reversal's window (D-107).
3. C5 (the leak test) before crypt wave B; C6; the knowledge layer's Kevlar and the prey's wakes (65f); the abstract model spec.

## Not yet consumed from main
Main's reply of 3 Nov (`REPLY-to-bot-2026-11-03-v0.6.216.md`: canary v1.1.0 pins every bot line through v0.6.216 — copy it into
`bot/`; Q4: gate on the root's release, record the `main` commit; the data repo's v5 dump) — a bot round; 17–18 Oct's: BOARD.
Still owed by main: v0.6.217's COT, ABSTAIN and burn-card lines in §12 and the canary; the pure `step`, `sp` / `xa` / `xb`, the
second `rng`; the v0.6.218 guide's re-embed (`HANDOFF-to-main-2026-11-11-v0_6_218.md`); the security plan (`HANDOFF-to-main-2026-11-11-security.md`).

## Known, not built
A human's bounce of a bot's bleed and a human's Haven Uncovered are not read · between bots a contested block's verdict waits for the
actor's clock · on the sim table most bot-vs-bot reaction windows run out their clock (BOARD) · `askHumansTotal` off until the human
harness learns the second question · the waves' riders (BOARD) · a rushed actor's maneuver wait hits its safety net about once in 200
· a failed blocker fights the later blocker's combat and can spend a strike card (3 in 840 five-seat matches; the Toreador report).
