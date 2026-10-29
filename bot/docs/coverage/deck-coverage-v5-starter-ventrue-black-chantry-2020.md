# deck-coverage — V5 Starter — Ventrue (Black Chantry 2020) (2026-10-29)

Genererad av `gen-deck-coverage.js` v1.1.40 mot `elysium-cardfx.json` (fxv 1, 2365 lib / 1785 crypt / 2422 alias) och den KONSUMTION `elysium-bot.js` faktiskt läser i källkoden (skannad vid körning, inte handunderhållen). Leken: deck-ventrue.json.

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

## Bibliotek (23 unika, 77 kopior)

| Kort | Qty | Verdict | Modes (at → fx → konsumerad/nåbar) | Taggar |
|---|---:|---|---|---|
| Anarch Troublemaker | 1 | FULL | [—] giveToPrey,preyLock → ✓(preyLock)/✓ | curated · persist |
| Blood Doll | 3 | FULL | [—] bloodToPool → ✓(bloodToPool@master)/✓<br>[—] poolToBlood → ✓(poolToBlood@master)/✓ | curated · persist |
| Information Highway | 1 | FULL | — | curated · persist · actGrant |
| Misdirection | 1 | FULL | [—] lockMinion → ✓(lockMinion)/✓ | curated |
| Uptown Hunting Ground | 1 | FULL | [—] bloodAdd,bloodAddTo → ✓(bloodAdd@hunting-ground)/✓ | curated · persist |
| Ventrue Headquarters | 1 | FULL | [—] votes → ✓(votes)/✓ | curated · persist |
| Visit from the Capuchin | 1 | FULL | [—] handSizePermanent,handSizePerCounter,replaceBurnsCounter → ✓(handSizePerCounter@permanent)/✓ | curated · persist |
| Wider View | 2 | FULL | [—] transferSwap,transferCost → ✓(transferSwap@influence-loop)/✓<br>[—] transferBurnPool,transferCost → ✓(transferBurnPool@influence-loop)/✓ | curated · persist · trifle |
| Enchant Kindred | 8 | FULL | [pre D] bleedAct,bleed → ✓(bleedAct)/✓<br>[PRE] bloodAdd,bloodAddTo,bloodAddYounger,actStealth → ✓(bloodAdd@unc-stock)/✓ | auto |
| Intimidation | 4 | FULL | [pre D] bleedAct,bleed → ✓(bleedAct)/✓<br>[PRE D] bleedAct,bleed → ✓(bleedAct)/✓ | auto |
| Ancilla Empowerment | 1 | FULL | — | auto |
| Kine Resources Contested | 7 | FULL | — | auto |
| Parity Shift | 5 | FULL | — | auto |
| Bewitching Oration | 4 | FULL | [pre] votes → ✓(votes)/✓<br>[PRE] votes → ✓(votes)/✓ | auto |
| Conditioning | 4 | FULL | [dom] bleed → ✓(bleed@mod-window)/✓<br>[DOM] bleed → ✓(bleed@mod-window)/✓ | auto |
| Daring the Dawn | 1 | FULL | [for] blockBar,selfDmg,selfAggr → ✓(blockBar@announce)/✓<br>[FOR] blockBar,selfDmg,selfAggr → ✓(blockBar@announce)/✓ | auto |
| Freak Drive | 6 | FULL | [for] unlock → ✓(unlock)/✓<br>[FOR] unlock → ✓(unlock)/✓ | auto |
| Voter Captivation | 2 | FULL | [pre] bloodPerMargin → ✓(bloodPerMargin)/✓<br>[PRE] bloodPerMargin,marginToPool → ✓(bloodPerMargin)/✓ | curated |
| Hidden Strength | 4 | FULL | [for] prevent,preventX → ✓(prevent)/✓<br>[FOR] prevent,preventX,press → ✓(press@resolveCombat)/✓ | curated |
| Majesty | 6 | FULL | [pre] combatEnds,strikeCE → ✓(strikeCE)/✓<br>[PRE] combatEnds,strikeCE,unlock → ✓(strikeCE)/✓ | auto |
| Deflection | 6 | FULL | [dom] bounce → ✓(bounce)/✓<br>[DOM] bounce → ✓(bounce)/✓ | auto |
| Second Tradition: Domain | 4 | FULL | [—] intercept → ✓(intercept)/✓<br>[—] unlock,intercept,payBlood → ✓(unlock)/✓ | curated |
| Wake with Evening's Freshness | 4 | FULL | [—] wake → ✓(wake)/✓ | auto |

## Crypt (9 unika, 12 kopior)

| Vampyr | Qty | Cap (annoterad/cardfx) | Unik | Grupp | Discipliner (sup i VERSALER) |
|---|---:|---|---|---|---|
| Alexa Draper (G6) | 1 | —/8 | ja | 6 | DOM for pot PRE |
| Alice Chen (G6) | 2 | —/7 | ja | 6 | dom FOR obf PRE |
| Brock Sterling (G6) | 1 | —/3 | ja | 6 | FOR |
| Chelsea Blake (G6) | 1 | —/5 | ja | 6 | cel DOM for pre |
| Horst von Brühl (G6) | 2 | —/6 | ja | 6 | aus dom FOR pre |
| Madison (G6) | 1 | —/6 | ja | 6 | DOM FOR PRE |
| Naomi Stewart (G6) | 1 | —/5 | ja | 6 | dom FOR PRE |
| Oshri Dahan (G6) | 1 | —/4 | ja | 6 | dom for pre |
| Sybren van Oosten (G6) | 2 | —/7 | ja | 6 | dom FOR PRE tha |


## Kurationskö (allt som inte är FULL/HANDLER, qty-fallande)

Tom — hela biblioteket är automatiserat. 🎉

## Antaganden (uttalade, inte tysta)

- Spelkontext simuleras inte: numerisk `fx.stealth` räknas som konsumerad varhelst den står,
  eftersom `_bestStealthFor` själv inte typ-gatar idag (verktyget speglar konsumenten troget).
- 2-spelar-bounce-dödheten (`_modeUsableBy`s bordsstrukturella koll) är bordstillstånd, inte lekegenskap — utanför scope.
- `poolGain`/`bloodToPool` räknas bara med `phase` på moden (speglar `_applyPhaseIncome`s v1-kontrakt).
- `actGrant` läses på ENTRY-nivå (så läser `_recomputePhaseActs` — actGrant-doc-drift-läxan).

