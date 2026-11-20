# STATUS — Elysium Bots (rewritten at every release; 20 November 2026)

**Bot v0.6.236** (20 Nov 2026, the Banu Haqim pilot) · arena v1.4.15 · sim table v1.1.0 · cardfx compiler v1.11.4, curated 218 ·
hotseat tool v1.4.1 · coverage tool v1.1.55 · card ledger v1.2.2 · review sheet v1.0.1 · precon generator v1.1.1 · `krcg-v5.js`
v1.0.0 · `ana-gates.py` v1.1.4 · built and gated against client v2.6.179 / srv-2.6.51 (the root's release); the read-only
copies in bot/ are client v2.6.179 / protocol v2.6.179 / srv-2.6.51 and main's canary v1.5.0.

**Deploy state:** `main` carries v0.6.235 and client v2.6.179. **Open PRs:** #93 (the docs round of 20 Nov: D-132, D-133,
BOARD's fold; no bot change) and, on it, #94: the pilot's release (v0.6.236, D-134).

## Last gates (v0.6.236's bytes: `elysium-bot.js` `4c193599`)
20 Nov, the release: suite **2733/0 ×3** (6 GB heap) · sections 181 58/0, 182 57/0 · `test-cardfx` 500/0 · canary 235/0 ×2 ·
hotseat 12/0 · HB1 11/0 · main's client suite 383/1 (the guide's embed) · the 240 against v0.6.235, the version normalized:
DIVERGED 14, SAME-PLAY 5, IDENTICAL 221 (the rules corrections: Aunt Linda's retainers, one drain context) · the 14 V5 smokes:
banuhaqim and brujah as registered, four moved by the corrections · the pilot's 48: handshake 3416/3416 · `ana-gates.py` PASS on
all 16 · the arena smoke (one match, the four starters, real clock) PASS 7/7 · lint, `gen-precon --check` clean.

## Next
1. **C**, concentrated (spec-card-sweep §11.8, D-132): C1 the cross-check tool with `stealth` / `actStealth`, `intercept`, `bleed`;
   then the first reader's round, its design to Johan first (§11.6). The pilot's riders (spec-sweep-pilot §6) ride with C.
2. Johan: O-49 (the experiment's employ without Animalism); the pilot's flow proposals (its PR); BOARD's read-through (#93).
3. The fizzle misread; Q4; C5; C6 (the suite's 6 GB heap first); the abstract model.

## Not yet consumed from main
Nothing. Handed to main, unanswered (`docs/handoffs/`): the queued bridge (19 Nov; its ask: the canary's five cardfx checks skip
loudly, token `SKIPPED`), v0.6.235's bundle (19 Nov), the guide for v2.6.179 and the licence (20 Nov, D-128), v0.6.236's lines
(20 Nov).
