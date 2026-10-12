# deck-coverage — V5 Starter — Toreador (Black Chantry 2020) (2026-07-23)

Genererad av `gen-deck-coverage.js` v1.1.14 mot `elysium-cardfx.json` (fxv 1, 2364 lib / 1785 crypt / 2422 alias) och den KONSUMTION `elysium-bot.js` faktiskt läser i källkoden (skannad vid körning, inte handunderhållen). Leken: v5-toreador-starter.json.

Syfte: göra "kan botten spela den här leken?" till en mekanisk kontroll — curated-djup och
handlers budgeteras per lek, aldrig som databas-completionism. Detta är en RAPPORT, inte en gate.

## Sammanfattning (qty-viktad, 77 bibliotekskopior)

| Hink | Kopior | Andel |
|---|---:|---:|
| Automatiserade (HANDLER/FULL) | 22 | 29% |
| Delvis (PARTIAL/TABLED-ONLY) | 20 | 26% |
| Ej spelbara av botten idag | 35 | 45% |

Per verdict: FULL 22 · NAME-ONLY 18 · INERT 17 · TABLED-ONLY 12 · PARTIAL 8

## Konsumtionsläget (skannat ur bottens källa vid körning)

- Spel-nycklar botten läser: `bleedAct`, `bounce`, `cancelBlock`, `dodge`, `intercept`, `poolDmg`, `prevent`, `stealth`, `wake`
- Fas-inkomst (kräver `phase` på moden): `bloodToPool`, `handCycle`, `handSize`, `poolGain`, `rescueTorpor`, `transferBurnPool`, `transferSwap`
- Hotläsning (motståndarkort, gör ALDRIG egna kort spelbara): `bloodBurn`, `poolDmg`, `stealBlood`

## Bibliotek (20 unika, 77 kopior)

| Kort | Qty | Verdict | Modes (at → fx → konsumerad/nåbar) | Taggar |
|---|---:|---|---|---|
| Art Museum | 1 | TABLED-ONLY | [—] bloodAdd → —/✓ | auto · persist |
| Creepshow Casino | 1 | FULL | [—] stealth → ✓(stealth)/✓ | auto · persist |
| Elysium: The Palace of Versailles | 1 | TABLED-ONLY | [—] votes → —/✓ | auto · persist |
| Society Hunting Ground | 1 | FULL | [—] bloodAdd,bloodAddTo → ✓(bloodAdd@hunting-ground)/✓ | curated · persist |
| Toreador Grand Ball | 4 | TABLED-ONLY | [— D] — → —/✓ | auto · persist |
| Villein | 6 | TABLED-ONLY | — | auto · persist · trifle |
| Enchant Kindred | 6 | FULL | [pre D] bleedAct,bleed → ✓(bleedAct)/✓<br>[PRE] bloodAdd,bloodAddTo,bloodAddYounger,actStealth → ✓(bloodAdd@unc-stock)/✓ | auto |
| Consanguineous Boon | 4 | NAME-ONLY | — | auto |
| Kine Resources Contested | 8 | FULL | [—] poolDmg → ✓(poolDmg)/✓ | auto |
| Parity Shift | 4 | NAME-ONLY | — | auto |
| Toreador Justicar | 1 | INERT | [—] votes → —/✓ | auto |
| Aire of Elation | 2 | FULL | [pre] bleed → ✓(bleed@mod-window)/✓<br>[PRE] bleed → ✓(bleed@mod-window)/✓ | auto |
| Bewitching Oration | 4 | INERT | [pre] votes → —/✓<br>[PRE] votes → —/✓ | auto |
| Change of Target | 2 | INERT | [—] unlock → —/✓ | auto |
| Perfect Paragon | 4 | INERT | [pre] votes → —/✓ | auto |
| Voter Captivation | 6 | NAME-ONLY | — | auto |
| Resist Earth's Grasp | 8 | PARTIAL | [cel] maneuver,press → —/✓<br>[CEL] stealth → ✓(stealth)/✓ | auto |
| Scalpel Tongue | 4 | NAME-ONLY | — | auto |
| Majesty | 6 | INERT | [pre] combatEnds → —/✓<br>[PRE] combatEnds,unlock → —/✓ | auto |
| Second Tradition: Domain | 4 | FULL | [—] intercept → ✓(intercept)/✓ | auto |

## Crypt (9 unika, 12 kopior)

| Vampyr | Qty | Cap (annoterad/cardfx) | Unik | Grupp | Discipliner (sup i VERSALER) |
|---|---:|---|---|---|---|
| Nik Sicko | 1 | ?/? | ? | ? | UNRESOLVED |
| Min-seo (G6) | 1 | —/3 | ja | 6 | aus cel |
| Massimo Falconi (G6) | 1 | —/4 | ja | 6 | aus cel pre |
| Bret Stryker (G6) | 1 | —/4 | ja | 6 | CEL PRE |
| Tamoszius (G6) | 1 | —/5 | ja | 6 | aus CEL PRE |
| Kathy Glens (G6) | 1 | —/5 | ja | 6 | aus cel PRE tha |
| Mkhokheli (G6) | 2 | —/6 | ja | 6 | aus cel for PRE |
| Flávio Gonçalves (G6) | 2 | —/7 | ja | 6 | aus CEL for PRE |
| Catalina Vega (G6) | 2 | —/8 | ja | 6 | AUS CEL for PRE |


## Kurationskö (allt som inte är FULL/HANDLER, qty-fallande)

| Kort | Qty | Verdict | Föreslaget nästa steg |
|---|---:|---|---|
| Resist Earth's Grasp | 8 | PARTIAL | okonsumerade modes: [cel] maneuver,press |
| Villein | 6 | TABLED-ONLY | spelas blint som master; phase-inkomst/handler om effekten ska automatiseras |
| Voter Captivation | 6 | NAME-ONLY | curate:a modes (auto-tiern extraherade inget) |
| Majesty | 6 | INERT | fx-nycklar botten inte läser (combatEnds, unlock) — utöka konsumenten eller acceptera som död vikt |
| Toreador Grand Ball | 4 | TABLED-ONLY | spelas blint som master; phase-inkomst/handler om effekten ska automatiseras |
| Consanguineous Boon | 4 | NAME-ONLY | curate:a modes (auto-tiern extraherade inget) |
| Parity Shift | 4 | NAME-ONLY | curate:a modes (auto-tiern extraherade inget) |
| Bewitching Oration | 4 | INERT | fx-nycklar botten inte läser (votes) — utöka konsumenten eller acceptera som död vikt |
| Perfect Paragon | 4 | INERT | fx-nycklar botten inte läser (votes) — utöka konsumenten eller acceptera som död vikt |
| Scalpel Tongue | 4 | NAME-ONLY | curate:a modes (auto-tiern extraherade inget) |
| Change of Target | 2 | INERT | fx-nycklar botten inte läser (unlock) — utöka konsumenten eller acceptera som död vikt |
| Art Museum | 1 | TABLED-ONLY | spelas blint som master; phase-inkomst/handler om effekten ska automatiseras |
| Elysium: The Palace of Versailles | 1 | TABLED-ONLY | spelas blint som master; phase-inkomst/handler om effekten ska automatiseras |
| Toreador Justicar | 1 | INERT | fx-nycklar botten inte läser (votes) — utöka konsumenten eller acceptera som död vikt |

## Antaganden (uttalade, inte tysta)

- Spelkontext simuleras inte: numerisk `fx.stealth` räknas som konsumerad varhelst den står,
  eftersom `_bestStealthFor` själv inte typ-gatar idag (verktyget speglar konsumenten troget).
- 2-spelar-bounce-dödheten (`_modeUsableBy`s bordsstrukturella koll) är bordstillstånd, inte lekegenskap — utanför scope.
- `poolGain`/`bloodToPool` räknas bara med `phase` på moden (speglar `_applyPhaseIncome`s v1-kontrakt).
- `actGrant` läses på ENTRY-nivå (så läser `_recomputePhaseActs` — actGrant-doc-drift-läxan).

