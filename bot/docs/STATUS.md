# STATUS — Elysium Bots (rewritten at every release; 10 November 2026)

**Bot v0.6.217** (3 Nov 2026, PR #47) · arena v1.4.8 · sim table v1.1.0 (round C3) · cardfx compiler v1.9.8, curated 156 · hotseat tool v1.4.0 ·
coverage tool v1.1.43 · precon generator v1.1.1 · KRCG converter `krcg-v5.js` v1.0.0 ·
built against client v2.6.170; the root's release is now client **v2.6.172 / srv-2.6.49** (main's #51: our canary 69/0, main's v1.1.0 102/0);
the read-only copies in `bot/` are client v2.6.162 / protocol v2.6.162 / srv-2.6.46 (refreshed 16 Oct; how: HARNESS).

**Deploy state:** `main` carries v0.6.217 (#47), client v2.6.172 (main's #51, 6 Nov), round C3 (#50, 4 Nov), the Toreador read (#52),
crypt round 0 (#53) and C4's CI (#54, #57). **Open PRs:** #58 (the v5 TWDA).

## Last gates (v0.6.217 release bytes, 3 Nov 2026)
Suite **2393/0 ×3** (alone, frozen snapshots, `--max-old-space-size=4096`) · canary **69/0** (bot/'s copies) and 69/0 (root v2.6.170
+ `client/ELYSIUM-PROTOCOL.md`) · hotseat **11/0** · HB1 **11/11** · test-cardfx **315/0** · `gen-precon.js --check` 18 precons, no
problems · main's `check-versions.js` agrees · main's client suite beside the bundle 353/1 (the embedded guide) · sim vs v0.6.216:
the 240-match client design SAME-PLAY 238, DIVERGED 2 (a rules fix: rulebook 6.1.6); the V5 smoke (14 × 12) DIVERGED in six decks at
the wave's cards (spec §5).

## What v0.6.217 did (the latest release; older ones in the CHANGELOG)
V5 wave 4 (D-106): the eight masters that go on a vampire, Toreador Grand Ball and its (D) burn, Change of Target, Scalpel Tongue,
Toreador Justicar; a title card replaces the printed title in every count; an action through a card in play once each turn (R-43).

## Since the release (no bot change)
- Round C3 (#50): the mirror bench on the sim (`--bench`, `ana-bench.py`; HOWTO).
- Toreador at the sim table (#52, `docs/reports/REPORT-toreador-sim-2026-11-06.md`): inside the starters' span on 600 fresh
  deals (0.65 ± 0.05 VP/match; level with tremere, above nosferatu). Menu: after its crypt rows (D-108).
- Crypt round 0 (#53, D-108): `gen-card-ledger.js` v1.1.0 reads the crypt into `docs/CARDS.md` (186 vampires: 110 no ability,
  6 modelled, 70 unmodelled, ranked by the crypt class map); the library half is unchanged.
- Round C4 (#54, #57; D-109): CI for `bot/` — `.github/workflows/bot-gates.yml` runs the gates on every bot PR and daily on `main`
  (it can be required); the lint's first-run findings wait for C2.
- The v5 TWDA (#58, D-110): KRCG's default is v5 since 8 Nov; the TWD tools read its v5 TWDA via `twda.py`; the profile's
  rebuild waits (BOARD, O-37, O-38).

## Next (proposed; Johan orders the board)
1. C2: the lint's first-run findings, the legacy tests, `ana-gates.py` (before crypt wave A).
2. Crypt wave A (D-108): Claude's proposal of 6 Nov (in chat) waits for Johan's "kör"; then Toreador in the menu.
3. V5 wave 5 — Johan picks its shape: the eighteen masters in play, Meditative Grove's cancel, Sudden Reversal's window (D-107).
4. C5 (the leak test) before crypt wave B; C6; the knowledge layer's Kevlar and the prey's wakes (65f); the abstract model spec.

## Not yet consumed from main
Main's replies of 3 Nov (`REPLY-to-bot-2026-11-03-v0.6.216.md`: canary v1.1.0 pins every bot line through v0.6.216 — copy it into
`bot/`; Q4: gate on the root's release, record the `main` commit; the data repo's v5 dump) and 6 Nov
(`REPLY-to-bot-2026-11-06-v0.6.217.md`: our guide's body still says 144 curated, its chip client v2.6.170) — a bot round; 17–18
Oct's: BOARD. Still owed by main: v0.6.217's COT, ABSTAIN and burn-card lines in §12 and the canary; the pure `step`, `sp` / `xa` /
`xb`, the second `rng`.

## Known, not built
A human's bounce of a bot's bleed and a human's Haven Uncovered are not read · between bots a contested block's verdict waits for the
actor's clock · on the sim table most bot-vs-bot reaction windows run out their clock (BOARD) · `askHumansTotal` off until the human
harness learns the second question · the waves' riders (BOARD) · a rushed actor's maneuver wait hits its safety net about once in 200
· a failed blocker fights the later blocker's combat and can spend a strike card (3 in 840 five-seat matches; the Toreador report).
