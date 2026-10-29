# deck-coverage — V5 Starter — Nosferatu (Black Chantry 2020) (2026-10-29)

Genererad av `gen-deck-coverage.js` v1.1.40 mot `elysium-cardfx.json` (fxv 1, 2365 lib / 1785 crypt / 2422 alias) och den KONSUMTION `elysium-bot.js` faktiskt läser i källkoden (skannad vid körning, inte handunderhållen). Leken: deck-nosferatu.json.

Syfte: göra "kan botten spela den här leken?" till en mekanisk kontroll — curated-djup och
handlers budgeteras per lek, aldrig som databas-completionism. Detta är en RAPPORT, inte en gate.

## Sammanfattning (qty-viktad, 77 bibliotekskopior)

| Hink | Kopior | Andel |
|---|---:|---:|
| Automatiserade (HANDLER/FULL) | 77 | 100% |
| Delvis (PARTIAL/TABLED-ONLY) | 0 | 0% |
| Ej spelbara av botten idag | 0 | 0% |

Per verdict: FULL 77

## Konsumtionsläget (skannat ur bottens källa vid körning)

- Spel-nycklar botten läser: `aggrHands`, `allyBurnUnlock`, `allyPressLife`, `bleedAct`, `bleedNullify`, `bloodPerMargin`, `bounce`, `burnPrevent`, `cancelBlock`, `dodge`, `fameOnTarget`, `fetchEquip`, `hostIntercept`, `hostPrevent`, `intercept`, `jackEngine`, `lockMinion`, `lockStealth`, `lockToUnlock`, `noBlockMinion`, `openHandPrey`, `peekPreyDiscard`, `poolDmg`, `poolFromHost`, `prevent`, `preyBurnPerCopy`, `preyLock`, `rebelBlood`, `recruitAlly`, `reduce`, `rush`, `rushGrant`, `stealth`, `strengthAction`, `strengthBonus`, `strikeCE`, `unlock`, `votes`, `votesBonus`, `wake`, `warsawRefresh`, `warsawRescue`
- Fas-inkomst (kräver `phase` på moden): `bankIn`, `bankOut`, `bloodToPool`, `handCycle`, `handSize`, `handSizePerCounter`, `poolGain`, `poolToBlood`, `rescueTorpor`, `transferBurnPool`, `transferSwap`
- Hotläsning (motståndarkort, gör ALDRIG egna kort spelbara): `bloodBurn`, `poolDmg`, `stealBlood`

## Bibliotek (26 unika, 77 kopior)

| Kort | Qty | Verdict | Modes (at → fx → konsumerad/nåbar) | Taggar |
|---|---:|---|---|---|
| Carrion Crows | 2 | FULL | [ani] envDmgPerRound → ✓(envDmgPerRound@beforeRange)/✓<br>[ANI] envDmgPerRound → ✓(envDmgPerRound@beforeRange)/✓ | auto |
| Cats' Guidance | 4 | FULL | [ani] unlock → ✓(unlock)/✓<br>[ANI] intercept → ✓(intercept)/✓ | curated |
| Creeping Sabotage | 4 | FULL | [—] actStealth,preyBurnPerCopy → ✓(preyBurnPerCopy)/✓ | curated · persist |
| Deep Song | 6 | FULL | [ani D] bleedAct,bleed → ✓(bleedAct)/✓<br>[ANI D] rush,lockTarget → ✓(rush)/✓ | curated |
| Fame | 1 | FULL | [—] fameOnTarget → ✓(fameOnTarget)/✓ | curated · persist |
| Guard Dogs | 4 | FULL | [ani] unlock → ✓(unlock)/✓<br>[ANI] unlock,maneuver → ✓(unlock)/✓ | curated |
| Guardian Angel | 1 | FULL | [—] hostIntercept,hostInterceptOn,hostPrevent → ✓(hostIntercept)/✓ | curated · persist |
| Haven Uncovered | 1 | FULL | [—] rushGrant → ✓(rushGrant)/✓ | curated · persist |
| Immortal Grapple | 4 | FULL | [pot] restrictHandStrike → ✓(restrictHandStrike@preStrike)/✓<br>[POT] restrictHandStrike,press → ✓(restrictHandStrike@preStrike)/✓ | auto |
| Instinctive Reaction | 4 | FULL | [ani] intercept → ✓(intercept)/✓<br>[ANI] intercept,maneuver → ✓(intercept)/✓ | auto |
| Lost in Crowds | 4 | FULL | [obf] stealth → ✓(stealth)/✓<br>[OBF] stealth → ✓(stealth)/✓ | auto |
| Murder of Crows | 2 | FULL | [ani] envDmgPerRound → ✓(attach-grant (bearer readers))/✓<br>[ANI] envDmgPerRound → ✓(attach-grant (bearer readers))/✓ | curated · persist |
| On the Qui Vive | 5 | FULL | [—] wake → ✓(wake)/✓ | auto |
| Preternatural Strength | 2 | FULL | [pot] actStealth,strengthBonus → ✓(strengthBonus)/✓<br>[POT] actStealth,strengthBonus → ✓(strengthBonus)/✓ | curated · persist |
| Protected District | 4 | FULL | [—] reduce → ✓(reduce)/✓<br>[—] votesBonus → ✓(votesBonus)/✓ | curated |
| Raven Spy | 2 | FULL | [ani] intercept → ✓(attach-grant (bearer readers))/✓<br>[ANI] intercept → ✓(attach-grant (bearer readers))/✓ | auto · persist |
| Rebel | 1 | FULL | [—] rebelBlood → ✓(rebelBlood)/✓ | curated · persist · trifle |
| Roundhouse | 8 | FULL | [pot] handBonus,handStrike → ✓(strike)/✓<br>[POT] handBonus,handStrike → ✓(strike)/✓ | auto |
| Slum Hunting Ground | 1 | FULL | [—] bloodAdd,bloodAddTo → ✓(bloodAdd@hunting-ground)/✓ | curated · persist |
| Smiling Jack, The Anarch | 1 | FULL | [—] jackEngine → ✓(jackEngine)/✓ | curated · persist |
| Taste of Vitae | 4 | FULL | [—] gainOppLoss → ✓(gainOppLoss@endOfRound)/✓ | curated |
| The Labyrinth | 1 | FULL | [—] lockStealth,lockStealthClan → ✓(lockStealth)/✓ | curated · persist |
| The Warrens | 4 | FULL | [—] intercept → ✓(intercept)/✓ | auto |
| Underbridge Stray | 2 | FULL | [ani] recruitAlly,allyLife,allyPressLife,allyBurnUnlock → ✓(recruitAlly)/✓<br>[ANI] recruitAlly,allyLife,allyPressLife,allyBurnUnlock → ✓(recruitAlly)/✓ | curated · persist |
| Vessel | 4 | FULL | [—] bloodToPool → ✓(bloodToPool@unlock)/✓<br>[—] poolToBlood → ✓(poolToBlood@unlock)/✓ | curated · persist · trifle |
| Warsaw Station | 1 | FULL | [—] warsawRefresh,warsawRescue → ✓(warsawRefresh)/✓ | curated · persist |

## Crypt (9 unika, 12 kopior)

| Vampyr | Qty | Cap (annoterad/cardfx) | Unik | Grupp | Discipliner (sup i VERSALER) |
|---|---:|---|---|---|---|
| Aunt Linda (G6) | 1 | —/4 | ja | 6 | obf POT |
| Baixinho (G6) | 1 | —/3 | ja | 6 | ani obf |
| Belinde (G6) | 2 | —/6 | ja | 6 | ani aus OBF pot |
| Horace Radcliffe (G6) | 1 | —/5 | ja | 6 | ANI obf POT |
| Larissa Moreira (G6) | 2 | —/6 | ja | 6 | ANI OBF pot |
| Lenny Burkhead (G6) | 2 | —/6 | ja | 6 | ANI obf pot pre |
| Ryan (G6) | 1 | —/4 | ja | 6 | ani obf pot |
| The Dowager (G6) | 1 | —/6 | ja | 6 | ANI aus OBF pot |
| Wauneka (G6) | 1 | —/5 | ja | 6 | ani aus obf POT |


## Kurationskö (allt som inte är FULL/HANDLER, qty-fallande)

Tom — hela biblioteket är automatiserat. 🎉

## Antaganden (uttalade, inte tysta)

- Spelkontext simuleras inte: numerisk `fx.stealth` räknas som konsumerad varhelst den står,
  eftersom `_bestStealthFor` själv inte typ-gatar idag (verktyget speglar konsumenten troget).
- 2-spelar-bounce-dödheten (`_modeUsableBy`s bordsstrukturella koll) är bordstillstånd, inte lekegenskap — utanför scope.
- `poolGain`/`bloodToPool` räknas bara med `phase` på moden (speglar `_applyPhaseIncome`s v1-kontrakt).
- `actGrant` läses på ENTRY-nivå (så läser `_recomputePhaseActs` — actGrant-doc-drift-läxan).

