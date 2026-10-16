# deck-coverage — V5 Starter — Malkavian (Black Chantry 2020) (2026-10-16)

Genererad av `gen-deck-coverage.js` v1.1.38 mot `elysium-cardfx.json` (fxv 1, 2365 lib / 1785 crypt / 2422 alias) och den KONSUMTION `elysium-bot.js` faktiskt läser i källkoden (skannad vid körning, inte handunderhållen). Leken: deck-malkavian.json.

Syfte: göra "kan botten spela den här leken?" till en mekanisk kontroll — curated-djup och
handlers budgeteras per lek, aldrig som databas-completionism. Detta är en RAPPORT, inte en gate.

## Sammanfattning (qty-viktad, 77 bibliotekskopior)

| Hink | Kopior | Andel |
|---|---:|---:|
| Automatiserade (HANDLER/FULL) | 73 | 95% |
| Delvis (PARTIAL/TABLED-ONLY) | 4 | 5% |
| Ej spelbara av botten idag | 0 | 0% |

Per verdict: FULL 71 · PARTIAL 4 · HANDLER 2

## Konsumtionsläget (skannat ur bottens källa vid körning)

- Spel-nycklar botten läser: `allyBurnUnlock`, `allyPressLife`, `bleedAct`, `bloodPerMargin`, `bounce`, `cancelBlock`, `dodge`, `fameOnTarget`, `fetchEquip`, `hostIntercept`, `hostPrevent`, `intercept`, `jackEngine`, `lockMinion`, `lockStealth`, `noBlockMinion`, `openHandPrey`, `peekPreyDiscard`, `poolDmg`, `prevent`, `preyBurnPerCopy`, `preyLock`, `rebelBlood`, `recruitAlly`, `reduce`, `rush`, `rushGrant`, `stealth`, `strengthBonus`, `strikeCE`, `unlock`, `votes`, `votesBonus`, `wake`, `warsawRefresh`, `warsawRescue`
- Fas-inkomst (kräver `phase` på moden): `bankIn`, `bankOut`, `bloodToPool`, `handCycle`, `handSize`, `handSizePerCounter`, `poolGain`, `poolToBlood`, `rescueTorpor`, `transferBurnPool`, `transferSwap`
- Hotläsning (motståndarkort, gör ALDRIG egna kort spelbara): `bloodBurn`, `poolDmg`, `stealBlood`
- ⚠ OKLASSADE nycklar hittade i botkällan (uppdatera CLASS-kartan i verktyget): `bleedBonus`, `bleedBoostDiscard`, `bleedNullify`, `blockNotOlder`, `burnAtDamage`, `burnCap`, `burnOnTorpor`, `enterPlay`, `equip`, `interceptMod`, `interceptPaid`, `noHuntStealth`, `noUnlockAfterTitledBleed`, `payBlood`, `preventX`, `ranged`, `referendum`, `selfUnlock`, `stealthMod`, `strengthMod`, `voteBoostDiscard`, `voteTaxAgainst`

## Bibliotek (21 unika, 77 kopior)

| Kort | Qty | Verdict | Modes (at → fx → konsumerad/nåbar) | Taggar |
|---|---:|---|---|---|
| Asylum Hunting Ground | 1 | FULL | [—] bloodAdd,bloodAddTo → ✓(bloodAdd@hunting-ground)/✓ | curated · persist |
| The Barrens | 1 | FULL | [—] handCycle → ✓(handCycle@lock-income)/✓ | curated · persist |
| Blood Doll | 4 | FULL | [—] bloodToPool → ✓(bloodToPool@master)/✓<br>[—] poolToBlood → ✓(poolToBlood@master)/✓ | curated · persist |
| Dreams of the Sphinx | 1 | FULL | [—] handSize → ✓(handSize@lock-income)/✓<br>[—] poolGain → ✓(poolGain@lock-income)/✓<br>[—] bloodAdd,bloodAddTo → ✓(bloodAdd@lock-income)/✓ | curated · persist |
| Elder Library | 1 | FULL | [—] handSize,handSizePermanent → ✓(handSize@permanent)/✓ | curated · persist |
| Life in the City | 2 | HANDLER | [—] bloodAdd,bloodAddTo → —/✓ | curated · trifle · handler:life-in-the-city |
| Wider View | 1 | FULL | [—] transferSwap,transferCost → ✓(transferSwap@influence-loop)/✓<br>[—] transferBurnPool,transferCost → ✓(transferBurnPool@influence-loop)/✓ | curated · persist · trifle |
| Govern the Unaligned | 12 | FULL | [dom D] bleedAct,bleed → ✓(bleedAct)/✓<br>[DOM] bloodAdd,bloodAddTo,bloodAddYounger,actStealth → ✓(bloodAdd@unc-stock)/✓ | auto |
| Revelations | 4 | FULL | [—] actStealth → ✓(actStealth@peek-tally)/✓<br>[aus] peekPreyDiscard,dir → ✓(peekPreyDiscard)/✓<br>[AUS] openHandPrey,persistent,dir → ✓(openHandPrey)/✓ | curated |
| Bonding | 4 | FULL | [dom] bleed → ✓(bleed@mod-window)/✓<br>[DOM] bleed,stealth → ✓(stealth)/✓ | auto |
| Cloak the Gathering | 4 | FULL | [obf] stealth → ✓(stealth)/✓<br>[OBF] stealth → ✓(stealth)/✓ | auto |
| Conditioning | 4 | FULL | [dom] bleed → ✓(bleed@mod-window)/✓<br>[DOM] bleed → ✓(bleed@mod-window)/✓ | auto |
| Faceless Night | 4 | FULL | [obf] stealth → ✓(stealth)/✓<br>[OBF] stealth → ✓(stealth)/✓ | auto |
| Foreshadowing Destruction | 2 | FULL | [dom] bleed → ✓(bleed@mod-window)/✓<br>[DOM] bleed → ✓(bleed@mod-window)/✓ | curated |
| Lost in Crowds | 4 | FULL | [obf] stealth → ✓(stealth)/✓<br>[OBF] stealth → ✓(stealth)/✓ | auto |
| Spying Mission | 4 | PARTIAL | [obf] stealth → ✓(stealth)/✓<br>[OBF] bleedNullify,bleedBank → —/✓ | curated |
| Swallowed by the Night | 4 | FULL | [obf] stealth → ✓(stealth)/✓<br>[OBF] maneuver → ✓(maneuver@resolveCombat)/✓ | auto |
| Deflection | 5 | FULL | [dom] bounce → ✓(bounce)/✓<br>[DOM] bounce → ✓(bounce)/✓ | auto |
| Eyes of Argus | 5 | FULL | [aus] intercept → ✓(intercept)/✓<br>[AUS] wake → ✓(wake)/✓ | auto |
| On the Qui Vive | 5 | FULL | [—] wake → ✓(wake)/✓ | auto |
| Telepathic Misdirection | 5 | FULL | [aus] intercept → ✓(intercept)/✓<br>[AUS] bounce → ✓(bounce)/✓ | auto |

## Crypt (9 unika, 12 kopior)

| Vampyr | Qty | Cap (annoterad/cardfx) | Unik | Grupp | Discipliner (sup i VERSALER) |
|---|---:|---|---|---|---|
| Ashley (G6) | 1 | —/3 | ja | 6 | dom obf |
| Dr. Stephen Norton (G6) | 1 | —/4 | ja | 6 | aus OBF |
| Sully (G6) | 1 | —/4 | ja | 6 | aus dom obf |
| Colette (G6) | 1 | —/5 | ja | 6 | AUS dom OBF |
| Gelasia Fotiou (G6) | 1 | —/6 | ja | 6 | AUS DOM obf pre |
| Meaghan (G6) | 1 | —/3 | ja | 6 | aus obf |
| Andi Liu (G6) | 2 | —/6 | ja | 6 | aus DOM obf pre |
| Alexander Silverson (G6) | 2 | —/8 | ja | 6 | AUS DOM OBF pre |
| Donny Kowalczyk (G6) | 2 | —/6 | ja | 6 | AUS cel dom obf |


## Kurationskö (allt som inte är FULL/HANDLER, qty-fallande)

| Kort | Qty | Verdict | Föreslaget nästa steg |
|---|---:|---|---|
| Spying Mission | 4 | PARTIAL | okonsumerade modes: [OBF] bleedNullify,bleedBank |

## Antaganden (uttalade, inte tysta)

- Spelkontext simuleras inte: numerisk `fx.stealth` räknas som konsumerad varhelst den står,
  eftersom `_bestStealthFor` själv inte typ-gatar idag (verktyget speglar konsumenten troget).
- 2-spelar-bounce-dödheten (`_modeUsableBy`s bordsstrukturella koll) är bordstillstånd, inte lekegenskap — utanför scope.
- `poolGain`/`bloodToPool` räknas bara med `phase` på moden (speglar `_applyPhaseIncome`s v1-kontrakt).
- `actGrant` läses på ENTRY-nivå (så läser `_recomputePhaseActs` — actGrant-doc-drift-läxan).

