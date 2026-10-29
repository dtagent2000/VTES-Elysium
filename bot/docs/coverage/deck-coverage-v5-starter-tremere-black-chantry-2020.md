# deck-coverage — V5 Starter — Tremere (Black Chantry 2020) (2026-10-29)

Genererad av `gen-deck-coverage.js` v1.1.40 mot `elysium-cardfx.json` (fxv 1, 2365 lib / 1785 crypt / 2422 alias) och den KONSUMTION `elysium-bot.js` faktiskt läser i källkoden (skannad vid körning, inte handunderhållen). Leken: deck-tremere.json.

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

## Bibliotek (24 unika, 77 kopior)

| Kort | Qty | Verdict | Modes (at → fx → konsumerad/nåbar) | Taggar |
|---|---:|---|---|---|
| Academic Hunting Ground | 1 | FULL | [—] bloodAdd,bloodAddTo → ✓(bloodAdd@hunting-ground)/✓ | curated · persist |
| Arcane Library | 1 | FULL | [—] bloodAdd,bloodAddTo → ✓(bloodAdd@lock-income)/✓ | curated · persist |
| Chantry | 1 | FULL | [—] rescueTorpor → ✓(rescueTorpor@lock-income)/✓ | curated · persist |
| Misdirection | 1 | FULL | [—] lockMinion → ✓(lockMinion)/✓ | curated |
| Pentex(TM) Subversion | 1 | FULL | [—] noBlockMinion → ✓(noBlockMinion)/✓ | curated · persist |
| Wasserschloss Anif, Austria | 1 | FULL | [—] bankIn,bankClan → ✓(bankIn@master)/✓<br>[—] bankOut,bankClan → ✓(bankOut@lock-income)/✓ | curated · persist |
| Vessel | 4 | FULL | [—] bloodToPool → ✓(bloodToPool@unlock)/✓<br>[—] poolToBlood → ✓(poolToBlood@unlock)/✓ | curated · persist · trifle |
| Wider View | 1 | FULL | [—] transferSwap,transferCost → ✓(transferSwap@influence-loop)/✓<br>[—] transferBurnPool,transferCost → ✓(transferBurnPool@influence-loop)/✓ | curated · persist · trifle |
| Govern the Unaligned | 12 | FULL | [dom D] bleedAct,bleed → ✓(bleedAct)/✓<br>[DOM] bloodAdd,bloodAddTo,bloodAddYounger,actStealth → ✓(bloodAdd@unc-stock)/✓ | auto |
| Magic of the Smith | 2 | FULL | [tha] actStealth,fetchEquip → ✓(fetchEquip)/✓<br>[THA] actStealth,fetchEquip → ✓(fetchEquip)/✓ | curated |
| .44 Magnum | 1 | FULL | [—] maneuver,strike,ranged → ✓(equip-grant (bearer readers))/✓ | auto · persist |
| Bowl of Convergence | 1 | FULL | [aus] intercept → ✓(equip-grant (bearer readers))/✓<br>[AUS] intercept,interceptPaid,interceptPaidBlood → ✓(equip-grant (bearer readers))/✓ | curated · persist |
| Kevlar Vest | 1 | FULL | [—] prevent → ✓(equip-grant (bearer readers))/✓ | auto · persist |
| Sport Bike | 1 | FULL | [—] intercept → ✓(equip-grant (bearer readers))/✓ | auto · persist |
| Bonding | 6 | FULL | [dom] bleed → ✓(bleed@mod-window)/✓<br>[DOM] bleed,stealth → ✓(stealth)/✓ | auto |
| Mirror Walk | 6 | FULL | [tha] stealth → ✓(stealth)/✓<br>[THA] stealth → ✓(stealth)/✓ | auto |
| Apportation | 4 | FULL | [tha] press → ✓(press@resolveCombat)/✓<br>[THA] maneuver → ✓(maneuver@resolveCombat)/✓ | auto |
| Theft of Vitae | 10 | FULL | [tha] stealBlood,ranged → ✓(stealBlood@strike)/✓<br>[THA] stealBlood,ranged → ✓(stealBlood@strike)/✓ | auto |
| Deflection | 4 | FULL | [dom] bounce → ✓(bounce)/✓<br>[DOM] bounce → ✓(bounce)/✓ | auto |
| Eyes of Argus | 6 | FULL | [aus] intercept → ✓(intercept)/✓<br>[AUS] wake → ✓(wake)/✓ | auto |
| On the Qui Vive | 4 | FULL | [—] wake → ✓(wake)/✓ | auto |
| Precognition | 2 | FULL | [aus] intercept → ✓(intercept)/✓<br>[AUS] intercept,prevent → ✓(intercept)/✓ | auto |
| Spirit's Touch | 2 | FULL | [aus] intercept → ✓(intercept)/✓<br>[AUS] intercept,maneuver → ✓(intercept)/✓ | auto |
| Telepathic Misdirection | 4 | FULL | [aus] intercept → ✓(intercept)/✓<br>[AUS] bounce → ✓(bounce)/✓ | auto |

## Crypt (9 unika, 12 kopior)

| Vampyr | Qty | Cap (annoterad/cardfx) | Unik | Grupp | Discipliner (sup i VERSALER) |
|---|---:|---|---|---|---|
| Ayelech (G6) | 2 | —/7 | ja | 6 | AUS DOM THA |
| Chrysanthemum (G6) | 1 | —/5 | ja | 6 | AUS dom THA |
| Inês Tristão (G6) | 2 | —/6 | ja | 6 | aus dom pre THA |
| Lauren (G6) | 1 | —/4 | ja | 6 | aus dom tha |
| Lloyd Brooks (G6) | 1 | —/6 | ja | 6 | aus DOM pot THA |
| Nassir (G6) | 1 | —/4 | ja | 6 | aus THA |
| Patrik Söderberg (G6) | 1 | —/5 | ja | 6 | AUS dom for tha |
| Rosalina Cortez (G6) | 1 | —/3 | ja | 6 | THA |
| Trevon Parker (G6) | 2 | —/6 | ja | 6 | AUS DOM THA |


## Kurationskö (allt som inte är FULL/HANDLER, qty-fallande)

Tom — hela biblioteket är automatiserat. 🎉

## Antaganden (uttalade, inte tysta)

- Spelkontext simuleras inte: numerisk `fx.stealth` räknas som konsumerad varhelst den står,
  eftersom `_bestStealthFor` själv inte typ-gatar idag (verktyget speglar konsumenten troget).
- 2-spelar-bounce-dödheten (`_modeUsableBy`s bordsstrukturella koll) är bordstillstånd, inte lekegenskap — utanför scope.
- `poolGain`/`bloodToPool` räknas bara med `phase` på moden (speglar `_applyPhaseIncome`s v1-kontrakt).
- `actGrant` läses på ENTRY-nivå (så läser `_recomputePhaseActs` — actGrant-doc-drift-läxan).

