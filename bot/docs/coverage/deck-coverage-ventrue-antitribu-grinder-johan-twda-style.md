# deck-coverage — Ventrue antitribu Grinder (Johan, TWDA-style) (2026-07-23)

Genererad av `gen-deck-coverage.js` v1.1.14 mot `elysium-cardfx.json` (fxv 1, 2364 lib / 1785 crypt / 2422 alias) och den KONSUMTION `elysium-bot.js` faktiskt läser i källkoden (skannad vid körning, inte handunderhållen). Leken: vtru-grinder-johan.json.

Syfte: göra "kan botten spela den här leken?" till en mekanisk kontroll — curated-djup och
handlers budgeteras per lek, aldrig som databas-completionism. Detta är en RAPPORT, inte en gate.

## Sammanfattning (qty-viktad, 90 bibliotekskopior)

| Hink | Kopior | Andel |
|---|---:|---:|
| Automatiserade (HANDLER/FULL) | 80 | 89% |
| Delvis (PARTIAL/TABLED-ONLY) | 0 | 0% |
| Ej spelbara av botten idag | 10 | 11% |

Per verdict: FULL 78 · NAME-ONLY 10 · HANDLER 2

## Konsumtionsläget (skannat ur bottens källa vid körning)

- Spel-nycklar botten läser: `bleedAct`, `bounce`, `cancelBlock`, `dodge`, `intercept`, `poolDmg`, `prevent`, `stealth`, `wake`
- Fas-inkomst (kräver `phase` på moden): `bloodToPool`, `handCycle`, `handSize`, `poolGain`, `rescueTorpor`, `transferBurnPool`, `transferSwap`
- Hotläsning (motståndarkort, gör ALDRIG egna kort spelbara): `bloodBurn`, `poolDmg`, `stealBlood`

## Bibliotek (23 unika, 90 kopior)

| Kort | Qty | Verdict | Modes (at → fx → konsumerad/nåbar) | Taggar |
|---|---:|---|---|---|
| Channel 10 | 1 | FULL | [—] intercept → ✓(intercept)/✓ | auto · persist |
| Corporate Hunting Ground | 1 | FULL | [—] bloodAdd,bloodAddTo → ✓(bloodAdd@hunting-ground)/✓ | curated · persist |
| Dreams of the Sphinx | 3 | FULL | [—] handSize → ✓(handSize@lock-income)/✓<br>[—] poolGain → ✓(poolGain@lock-income)/✓<br>[—] bloodAdd,bloodAddTo → ✓(bloodAdd@lock-income)/✓ | curated · persist |
| Effective Management | 2 | HANDLER | — | curated · handler:effective-management |
| KRCG News Radio | 1 | FULL | [—] intercept → ✓(intercept)/✓ | auto · persist |
| London Evening Star, Tabloid Newspaper | 1 | FULL | [—] intercept → ✓(intercept)/✓ | auto · persist |
| The Rumor Mill, Tabloid Newspaper | 1 | FULL | [—] intercept → ✓(intercept)/✓ | auto · persist |
| Vessel | 4 | FULL | [—] bloodToPool → ✓(bloodToPool@unlock)/✓ | curated · persist · trifle |
| Wider View | 1 | FULL | [—] transferSwap,transferCost → ✓(transferSwap@influence-loop)/✓<br>[—] transferBurnPool,transferCost → ✓(transferBurnPool@influence-loop)/✓ | curated · persist · trifle |
| Govern the Unaligned | 13 | FULL | [dom D] bleedAct,bleed → ✓(bleedAct)/✓<br>[DOM] bloodAdd,bloodAddTo,bloodAddYounger,actStealth → ✓(bloodAdd@unc-stock)/✓ | auto |
| Under Siege | 3 | FULL | [—] intercept,actStealth → ✓(intercept)/✓ | auto · persist |
| Bonding | 4 | FULL | [dom] bleed → ✓(bleed@mod-window)/✓<br>[DOM] bleed,stealth → ✓(stealth)/✓ | auto |
| Conditioning | 4 | FULL | [dom] bleed → ✓(bleed@mod-window)/✓<br>[DOM] bleed → ✓(bleed@mod-window)/✓ | auto |
| Deflection | 5 | FULL | [dom] bounce → ✓(bounce)/✓<br>[DOM] bounce → ✓(bounce)/✓ | auto |
| Delaying Tactics | 4 | NAME-ONLY | — | auto |
| Eyes of Argus | 6 | FULL | [aus] intercept → ✓(intercept)/✓<br>[AUS] wake → ✓(wake)/✓ | auto |
| Telepathic Misdirection | 3 | FULL | [aus] intercept → ✓(intercept)/✓<br>[AUS] bounce → ✓(bounce)/✓ | auto |
| On the Qui Vive | 4 | FULL | [—] wake → ✓(wake)/✓ | auto |
| Enhanced Senses | 6 | FULL | [aus] intercept → ✓(intercept)/✓<br>[AUS] intercept → ✓(intercept)/✓ | auto |
| Hidden Strength | 4 | FULL | [for] prevent → ✓(prevent)/✓<br>[FOR] prevent,press → ✓(press@resolveCombat)/✓ | curated |
| Rolling with the Punches | 8 | FULL | [for] prevent → ✓(prevent)/✓<br>[FOR] prevent → ✓(prevent)/✓ | auto |
| Soak | 5 | FULL | [for] prevent → ✓(prevent)/✓<br>[FOR] prevent → ✓(prevent)/✓ | curated |
| Weighted Walking Stick | 6 | NAME-ONLY | — | auto |

## Crypt (9 unika, 12 kopior)

| Vampyr | Qty | Cap (annoterad/cardfx) | Unik | Grupp | Discipliner (sup i VERSALER) |
|---|---:|---|---|---|---|
| Owain Evans, The Wanderer (G3) | 2 | 8/8 | ja | 3 | AUS cel DOM FOR pre |
| Blackhorse Tanner (G3) | 2 | 7/7 | ja | 3 | AUS DOM FOR |
| Edward Neally (G3) | 1 | 7/7 | ja | 3 | aus DOM FOR pre |
| Jefferson Foster (G4) | 1 | 6/6 | ja | 4 | AUS DOM for tha |
| Mariel St. John (G4) | 1 | 6/6 | ja | 4 | AUS dom FOR pro |
| Neighbor John (G4) | 2 | 5/5 | ja | 4 | AUS dom for |
| Jephta Hester (G4) | 1 | 5/5 | ja | 4 | aus DOM FOR |
| Lana Butcher (G3) | 1 | 3/3 | ja | 3 | dom for |
| Ulrike Rothbart (G4) | 1 | 3/3 | ja | 4 | dom for |


## Kurationskö (allt som inte är FULL/HANDLER, qty-fallande)

| Kort | Qty | Verdict | Föreslaget nästa steg |
|---|---:|---|---|
| Weighted Walking Stick | 6 | NAME-ONLY | curate:a modes (auto-tiern extraherade inget) |
| Delaying Tactics | 4 | NAME-ONLY | curate:a modes (auto-tiern extraherade inget) |

## Antaganden (uttalade, inte tysta)

- Spelkontext simuleras inte: numerisk `fx.stealth` räknas som konsumerad varhelst den står,
  eftersom `_bestStealthFor` själv inte typ-gatar idag (verktyget speglar konsumenten troget).
- 2-spelar-bounce-dödheten (`_modeUsableBy`s bordsstrukturella koll) är bordstillstånd, inte lekegenskap — utanför scope.
- `poolGain`/`bloodToPool` räknas bara med `phase` på moden (speglar `_applyPhaseIncome`s v1-kontrakt).
- `actGrant` läses på ENTRY-nivå (så läser `_recomputePhaseActs` — actGrant-doc-drift-läxan).

