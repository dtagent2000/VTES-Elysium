# deck-coverage — V5 Starter — Toreador (Black Chantry 2020) (2026-10-29)

Genererad av `gen-deck-coverage.js` v1.1.39 mot `elysium-cardfx.json` (fxv 1, 2365 lib / 1785 crypt / 2422 alias) och den KONSUMTION `elysium-bot.js` faktiskt läser i källkoden (skannad vid körning, inte handunderhållen). Leken: deck-toreador.json.

Syfte: göra "kan botten spela den här leken?" till en mekanisk kontroll — curated-djup och
handlers budgeteras per lek, aldrig som databas-completionism. Detta är en RAPPORT, inte en gate.

## Sammanfattning (qty-viktad, 77 bibliotekskopior)

| Hink | Kopior | Andel |
|---|---:|---:|
| Automatiserade (HANDLER/FULL) | 50 | 65% |
| Delvis (PARTIAL/TABLED-ONLY) | 20 | 26% |
| Ej spelbara av botten idag | 7 | 9% |

Per verdict: FULL 50 · TABLED-ONLY 12 · PARTIAL 8 · NAME-ONLY 5 · INERT 2

## Konsumtionsläget (skannat ur bottens källa vid körning)

- Spel-nycklar botten läser: `allyBurnUnlock`, `allyPressLife`, `bleedAct`, `bleedNullify`, `bloodPerMargin`, `bounce`, `cancelBlock`, `dodge`, `fameOnTarget`, `fetchEquip`, `hostIntercept`, `hostPrevent`, `intercept`, `jackEngine`, `lockMinion`, `lockStealth`, `noBlockMinion`, `openHandPrey`, `peekPreyDiscard`, `poolDmg`, `prevent`, `preyBurnPerCopy`, `preyLock`, `rebelBlood`, `recruitAlly`, `reduce`, `rush`, `rushGrant`, `stealth`, `strengthBonus`, `strikeCE`, `unlock`, `votes`, `votesBonus`, `wake`, `warsawRefresh`, `warsawRescue`
- Fas-inkomst (kräver `phase` på moden): `bankIn`, `bankOut`, `bloodToPool`, `handCycle`, `handSize`, `handSizePerCounter`, `poolGain`, `poolToBlood`, `rescueTorpor`, `transferBurnPool`, `transferSwap`
- Hotläsning (motståndarkort, gör ALDRIG egna kort spelbara): `bloodBurn`, `poolDmg`, `stealBlood`

## Bibliotek (20 unika, 77 kopior)

| Kort | Qty | Verdict | Modes (at → fx → konsumerad/nåbar) | Taggar |
|---|---:|---|---|---|
| Aire of Elation | 2 | FULL | [pre] bleed → ✓(bleed@mod-window)/✓<br>[PRE] bleed → ✓(bleed@mod-window)/✓ | auto |
| Art Museum | 1 | TABLED-ONLY | [—] bloodAdd → —/✓ | auto · persist |
| Bewitching Oration | 4 | FULL | [pre] votes → ✓(votes)/✓<br>[PRE] votes → ✓(votes)/✓ | auto |
| Change of Target | 2 | INERT | [—] unlock → —/✓ | auto |
| Consanguineous Boon | 4 | FULL | — | auto |
| Creepshow Casino | 1 | TABLED-ONLY | [—] stealth → —/✓ | auto · persist |
| Elysium: The Palace of Versailles | 1 | FULL | [—] votes → ✓(votes)/✓ | auto · persist |
| Enchant Kindred | 6 | FULL | [pre D] bleedAct,bleed → ✓(bleedAct)/✓<br>[PRE] bloodAdd,bloodAddTo,bloodAddYounger,actStealth → ✓(bloodAdd@unc-stock)/✓ | auto |
| Kine Resources Contested | 8 | FULL | — | auto |
| Majesty | 6 | FULL | [pre] combatEnds,strikeCE → ✓(strikeCE)/✓<br>[PRE] combatEnds,strikeCE,unlock → ✓(strikeCE)/✓ | auto |
| Parity Shift | 4 | FULL | — | auto |
| Perfect Paragon | 4 | FULL | [pre] votes → ✓(votes)/✓ | auto |
| Resist Earth's Grasp | 8 | PARTIAL | [cel] maneuver,press → —/✓<br>[CEL] stealth → ✓(stealth)/✓ | auto |
| Scalpel Tongue | 4 | NAME-ONLY | — | auto |
| Second Tradition: Domain | 4 | FULL | [—] intercept → ✓(intercept)/✓<br>[—] unlock,intercept,payBlood → ✓(unlock)/✓ | curated |
| Society Hunting Ground | 1 | FULL | [—] bloodAdd,bloodAddTo → ✓(bloodAdd@hunting-ground)/✓ | curated · persist |
| Toreador Grand Ball | 4 | TABLED-ONLY | [— D] — → —/✓ | auto · persist |
| Toreador Justicar | 1 | NAME-ONLY | — | auto |
| Villein | 6 | TABLED-ONLY | — | auto · persist · trifle |
| Voter Captivation | 6 | FULL | [pre] bloodPerMargin → ✓(bloodPerMargin)/✓<br>[PRE] bloodPerMargin,marginToPool → ✓(bloodPerMargin)/✓ | curated |

## Crypt (9 unika, 12 kopior)

| Vampyr | Qty | Cap (annoterad/cardfx) | Unik | Grupp | Discipliner (sup i VERSALER) |
|---|---:|---|---|---|---|
| Bret Stryker (G6) | 1 | —/4 | ja | 6 | CEL PRE |
| Catalina Vega (G6) | 2 | —/8 | ja | 6 | AUS CEL for PRE |
| Flávio Gonçalves (G6) | 2 | —/7 | ja | 6 | aus CEL for PRE |
| Kathy Glens (G6) | 1 | —/5 | ja | 6 | aus cel PRE tha |
| Massimo Falconi (G6) | 1 | —/4 | ja | 6 | aus cel pre |
| Min-seo (G6) | 1 | —/3 | ja | 6 | aus cel |
| Mkhokheli (G6) | 2 | —/6 | ja | 6 | aus cel for PRE |
| Nik Sikko (G6) | 1 | —/3 | ja | 6 | cel pre |
| Tamoszius (G6) | 1 | —/5 | ja | 6 | aus CEL PRE |


## Kurationskö (allt som inte är FULL/HANDLER, qty-fallande)

| Kort | Qty | Verdict | Föreslaget nästa steg |
|---|---:|---|---|
| Resist Earth's Grasp | 8 | PARTIAL | okonsumerade modes: [cel] maneuver,press |
| Villein | 6 | TABLED-ONLY | spelas blint som master; phase-inkomst/handler om effekten ska automatiseras |
| Scalpel Tongue | 4 | NAME-ONLY | curate:a modes (auto-tiern extraherade inget) |
| Toreador Grand Ball | 4 | TABLED-ONLY | spelas blint som master; phase-inkomst/handler om effekten ska automatiseras |
| Change of Target | 2 | INERT | inga konsumerade moder |
| Art Museum | 1 | TABLED-ONLY | spelas blint som master; phase-inkomst/handler om effekten ska automatiseras |
| Creepshow Casino | 1 | TABLED-ONLY | spelas blint som master; phase-inkomst/handler om effekten ska automatiseras |
| Toreador Justicar | 1 | NAME-ONLY | curate:a modes (auto-tiern extraherade inget) |

## Antaganden (uttalade, inte tysta)

- Spelkontext simuleras inte: numerisk `fx.stealth` räknas som konsumerad varhelst den står,
  eftersom `_bestStealthFor` själv inte typ-gatar idag (verktyget speglar konsumenten troget).
- 2-spelar-bounce-dödheten (`_modeUsableBy`s bordsstrukturella koll) är bordstillstånd, inte lekegenskap — utanför scope.
- `poolGain`/`bloodToPool` räknas bara med `phase` på moden (speglar `_applyPhaseIncome`s v1-kontrakt).
- `actGrant` läses på ENTRY-nivå (så läser `_recomputePhaseActs` — actGrant-doc-drift-läxan).

