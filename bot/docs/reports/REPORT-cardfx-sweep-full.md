# Cardfx sweep — full library (25 Sep 2026)

**Scope:** every cardfx library entry with modes (1,670 entries, 2,396 modes) against KRCG's card text with "As above" resolved, plus the number of rulings per card (vtes-rulings). Tool: `sweep-full.py`; rows in `sweep-full-rows.csv`.

## Verdict

The auto-compiled cardfx holds up: after reading every flagged row by hand, **2 wrong values** remain across the library, plus the **`ranged` field** added in this sweep.

| # | Card | Finding | Fix |
| --- | --- | --- | --- |
| 1 | **All strike / steal cards** | No `ranged` field; the bot treated every non-hand strike as usable at long range | Compiler v1.9.0 tags `ranged` from the R suffix or "Strike, ranged" (109 modes; Stunt Cycle curated). The bot (v0.6.175) uses only ranged strikes, steals and weapon strikes at long range. 14 melee cards are no longer offered at long (Talbot's Chainsaw, Burning Touch, Putrefaction, Song in the Dark …) |
| 2 | **Legion** | `actStealth` 2; the card's own action is "+1 stealth action" — the auto tier took the +2 of the fledgling ability it grants | Curated: 1 |
| 3 | **Madman's Quill** | An extra `dem` mode with bleed 1, made from the attached card's passive (Dementation vampires get +1 bleed against the controller) — not a playable mode | Curated: mode dropped, passive noted as unmodelled |
| — | Bowl of Convergence [AUS] (pilot) | Paid +1 intercept missing | Fixed in v0.6.174 |

Neither Legion nor Madman's Quill is in the bots' decks today.

**False positives (checker limits, cardfx correct):** 21 political actions whose "+1 stealth political action" burn option is already `actStealth` 1; "As [mel] above" / "As [str] above" and two-discipline levels ([aus][val]) not parsed by the checker (Death of the Drum, Hexe, Eye of Unforgiving Heaven, Collapse the Arches); Call the Lamprey's ally-only [obt] steal (curated empty on purpose); two conditional persistent bleed bonuses (Raising the Portcullis, Sabbat Inquisitor) that are unmodelled by design.

**What the sweep did not check (next passes):** crypt abilities; requirements (`req`) per level beyond range; costs; card types without numeric effects (masters, events). The inferior/superior definition work continues on these.

## Pass 2 — costs, requirements, crypt basics (`sweep-pass2.py`, rows in `sweep-pass2-rows.csv`)

| Check | Result |
| --- | --- |
| Library costs (pool / blood) vs KRCG | 977 agree; 2 X-costs (Creeping Sabotage, Hidden Strength) modelled on purpose |
| Discipline requirement vs KRCG | 916 agree after the fix below |
| Clan requirement vs KRCG | 451 agree; 24 masters carry a clan icon that is not a requirement (Hunting Grounds, Warsaw Station) — correct; Enticement's "Follower of Set" vs KRCG's none, harmless |
| Crypt: capacity, clan, disciplines (inferior / superior), group, title | All 1,785 agree |

**Fixed — compiler v1.9.1:** curated library entries now inherit the data's discipline and clan requirements when they do not restate them (the same rule costs already followed). 13 entries regained a requirement: 11 disciplines (Deep Song, Guard Dogs, Murder of Crows, Cats' Guidance, Magic of the Smith, Preternatural Strength, Revelations, Spying Mission, Underbridge Stray, Enticement, Foreshadowing Destruction) and 2 clans (Creeping Sabotage: Nosferatu; Forced Confessional: Salubri). Masters never inherit a clan. The bot gates play on the mode's discipline level, so no play changed (regression, 3 matches: handshake 156/156, names 148/148, bleed and steal ledgers balance).

**Crypt abilities:** all 3 numeric abilities in our 56 deck vampires are modelled (Lenny Burkhead +1 bleed, Larissa Moreira's discard-for-bleed, The Dowager's +1 intercept on directed actions). Across the whole crypt about 640 numeric abilities (+bleed, +stealth, +strength, +intercept, prevent) are unmodelled — they matter when the bots play other decks, so they belong to the knowledge / meta layer, not this sweep.

---

## Checker output

Entries with modes: 1670 · modes checked: 2395 · entries without a KRCG match: 0.

| Finding | Count |
| --- | --- |
| extra ranged | 5 |
| missing bleed | 2 |
| missing stealBlood | 1 |
| missing stealth | 21 |
| strike modes melee/hand | 98 |
| strike modes ranged | 109 |

Full rows: `sweep-full-rows.csv` (card, level, field, finding, cardfx, text, number of rulings on the card).
