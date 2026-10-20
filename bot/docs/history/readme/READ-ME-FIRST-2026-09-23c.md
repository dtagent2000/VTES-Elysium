# Elysium Bots — HANDOVER 23 September 2026 (c) — start here in the next chat

**State:** bot **v0.6.162** (deploy candidate — `elysium-bot.js` to main; rollback `combatMind: 0` = decisions only), arena v1.4.3, cardfx unchanged, client reference v2.6.125 / srv-2.6.38. Gates: suite 1661/0 ×3, canary 37/0, hotseat 10/0.

## What the combat block did (22–23 Sep)
- **Three rule bugs found and fixed:** the v0.6.114 handshake regression (press / maneuver / Grapple / Crows never reached a bot opponent), the continued-round race (phantom opp-silent rounds), the steal victim (a bot never lost blood to Theft of Vitae since v0.6.19). Plus: rules corrections no longer behind the knob (v0.6.162).
- **Johan's rulings built (behind `combatMind`):** Grapple only behind Roundhouse / Crows / strength; bundled presses (superior Grapple, Hidden Strength) consumed; press worth (torpor shot from the opponent's own taken line, card round), press-to-end; range posture chase / snipe / wave; Taste after a card round; pure stealth before Swallowed; silent opponent at long = 0; the rush kit; "seize the moment" (torpor-certain likely-through rush beats permanents-first); the chase press (Stray press when the opponent waved to long).
- **Measured:** `REPORT-combat-komplett.md` §1–§7 (series cmb1 → cmb7, same seeds). Mechanism counts are stable; deck-level W/VP at n = 12 swings ±12 VP (§7) — balance questions need 48+ matches per arm.
- **Compared with Black Chantry's V5 guides** (Nosferatu / Tremere / Malkavian help sheets): Nosferatu close to the guide; Tremere's guide makes Theft + press the core (ours maneuvers first); Malkavian's guide keeps the wave narrow (0 blood, or a Nosferatu that cannot press); all three say don't block Nosferatu / Tremere unless you must.

## Johan's standing decisions (23 Sep)
- Block doctrine ("don't block combat decks"), Tremere's maneuver-vs-press choice (maneuver when combat is expected, press vs pacifist decks) → **wait for the knowledge / meta layer** (dynamic opponent expectations, no hard-coded corners).
- Nosferatu's Grapple vs combat-ends decks: covered by the damage rule where it matters.
- **Open:** narrowing Malkavian's wave to the guide's two cases — likely the knowledge layer too.

## Next, in order
1. **Main builds the client combat controls** — `spec-client-combat-controls-2026-09-23.md` (frozen strike / maneuver / press / taken lines the bot already parses; tally `rng` / `pr`; counter pills; vampire `Combat ▸` submenu).
2. Bot follow-up when main ships (spec §6): read / write `rng` / `pr`, parse `sets range to`, canary.
3. The **combat phase routine** vs humans (`combatPhases`, Johan's seven phrases).
4. The **cardfx sweep + inferior/superior definition** — own chat.
5. Knowledge layer (twd_decks.json), then the meta layer.

## Watch items (not bugs)
Wave posture broad (`oppCombat ≥ 0.2`); `_wantPress` uses the seat's average damage; `_rushLikelyThrough` counts bodies not unlock-reactions (Cats' Guidance); round 2+ waits two windows vs humans (slow, correct); one Ryan / Brock Sterling opponent-name mismatch (cmb4).

## Files of this block
`READ-ME-FIRST-2026-09-22c … 23b` (per release), `REPORT-serie-cmb1.md`, `REPORT-serie-cmb2.md`, `REPORT-combat-komplett.md`, `REPORT-combat-series-table.txt`, tools `ana-combat.py`, `ana-combat2.py`, `ana-combat-sum.py`, `ana-rush.py`, `run-ser.sh`, `run-t.sh`, `run-m.sh`.
