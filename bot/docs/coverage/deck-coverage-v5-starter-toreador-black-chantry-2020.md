# deck-coverage — V5 Starter — Toreador (Black Chantry 2020) (2026-11-14)

Genererad av `gen-deck-coverage.js` v1.1.47 mot `elysium-cardfx.json` (fxv 1, 2391 lib / 1822 crypt / 3347 alias) och den KONSUMTION `elysium-bot.js` faktiskt läser i källkoden (skannad vid körning, inte handunderhållen). Leken: deck-toreador.json.

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

- Spel-nycklar botten läser: `abstainLock`, `abstainVoter`, `aggrHands`, `allyBurnUnlock`, `allyPressLife`, `bleedAct`, `bleedAtAnnounce`, `bleedDiscardCombat`, `bleedNullify`, `blockedPoolBurn`, `bloodPerMargin`, `bounce`, `burnActor`, `burnCardAction`, `burnPrevent`, `cancelBlock`, `discUp`, `dodge`, `endAction`, `endCombatLock`, `fameOnTarget`, `fetchEquip`, `grandBall`, `hostIntercept`, `hostPrevent`, `icpVs`, `intercept`, `jackEngine`, `lockIntercept`, `lockMinion`, `lockStealth`, `lockToUnlock`, `noBlockMinion`, `openHandPrey`, `peekPreyDiscard`, `poolDmg`, `poolFromHost`, `prevent`, `preyBurnPerCopy`, `preyLock`, `rebelBlood`, `recruitAlly`, `recruitDiscount`, `reduce`, `rush`, `rushGrant`, `rushHostBy`, `rushSelf`, `stealth`, `strengthAction`, `strengthBonus`, `strikeCE`, `titleVotes`, `unlock`, `unlockAfterCombat`, `votes`, `votesBonus`, `wake`, `warsawRefresh`, `warsawRescue`
- Fas-inkomst (kräver `phase` på moden): `bankIn`, `bankOut`, `bloodToPool`, `handCycle`, `handSize`, `handSizePerCounter`, `poolGain`, `poolToBlood`, `rescueTorpor`, `transferBurnPool`, `transferSwap`
- Hotläsning (motståndarkort, gör ALDRIG egna kort spelbara): `bloodBurn`, `poolDmg`, `stealBlood`
- Disciplinrader (v1.1.47): varje rad i kortets text som börjar med disciplinmarkörer måste ha en mode -- annars PARTIAL (KRCG:s text, `vtes.json`).

## Bibliotek (20 unika, 77 kopior)

| Kort | Qty | Verdict | Modes (at → fx → konsumerad/nåbar) | Taggar |
|---|---:|---|---|---|
| Aire of Elation | 2 | FULL | [pre] bleed → ✓(bleed@mod-window)/✓<br>[PRE] bleed → ✓(bleed@mod-window)/✓ | auto |
| Art Museum | 1 | FULL | [—] bloodAdd,bloodAddTo,bloodAddClan → ✓(bloodAdd@lock-income)/✓ | curated · persist |
| Bewitching Oration | 4 | FULL | [pre] votes → ✓(votes)/✓<br>[PRE] votes → ✓(votes)/✓ | auto |
| Change of Target | 2 | FULL | [—] unlock,endAction → ✓(unlock)/✓ | curated |
| Consanguineous Boon | 4 | FULL | — | auto |
| Creepshow Casino | 1 | FULL | [—] lockStealth,lockStealthAt → ✓(lockStealth)/✓ | curated · persist |
| Elysium: The Palace of Versailles | 1 | FULL | [—] votes,votesEach → ✓(votes)/✓ | curated · persist |
| Enchant Kindred | 6 | FULL | [pre D] bleedAct,bleed → ✓(bleedAct)/✓<br>[PRE] bloodAdd,bloodAddTo,bloodAddYounger,actStealth → ✓(bloodAdd@unc-stock)/✓ | auto |
| Kine Resources Contested | 8 | FULL | — | auto |
| Majesty | 6 | FULL | [pre] combatEnds,strikeCE → ✓(strikeCE)/✓<br>[PRE] combatEnds,strikeCE,unlock → ✓(strikeCE)/✓ | auto |
| Parity Shift | 4 | FULL | — | auto |
| Perfect Paragon | 4 | FULL | [pre] votes → ✓(votes)/✓<br>[PRE] icpVs → ✓(icpVs)/✓ | curated |
| Resist Earth's Grasp | 8 | FULL | [cel] press → ✓(press@resolveCombat)/✓<br>[cel] maneuver,pressOpt → ✓(maneuver@resolveCombat)/✓<br>[CEL] stealth → ✓(stealth)/✓ | curated |
| Scalpel Tongue | 4 | FULL | [cel+pre] abstainVoter → ✓(abstainVoter)/✓<br>[CEL+PRE] abstainVoter,voterBloodBurn → ✓(abstainVoter)/✓ | curated |
| Second Tradition: Domain | 4 | FULL | [—] intercept → ✓(intercept)/✓<br>[—] unlock,intercept,payBlood → ✓(unlock)/✓ | curated |
| Society Hunting Ground | 1 | FULL | [—] bloodAdd,bloodAddTo → ✓(bloodAdd@hunting-ground)/✓ | curated · persist |
| Toreador Grand Ball | 4 | FULL | [—] grandBall → ✓(grandBall)/✓<br>[— D] burnCardAction,burnStealthClan → ✓(burnCardAction)/✓ | curated · persist |
| Toreador Justicar | 1 | FULL | — | curated · persist |
| Villein | 6 | FULL | [—] poolFromHost,poolFromHostMin,hostCopyCost → ✓(poolFromHost)/✓ | curated · persist · trifle |
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

Tom — hela biblioteket är automatiserat. 🎉

## Antaganden (uttalade, inte tysta)

- Spelkontext simuleras inte: numerisk `fx.stealth` räknas som konsumerad varhelst den står,
  eftersom `_bestStealthFor` själv inte typ-gatar idag (verktyget speglar konsumenten troget).
- 2-spelar-bounce-dödheten (`_modeUsableBy`s bordsstrukturella koll) är bordstillstånd, inte lekegenskap — utanför scope.
- `poolGain`/`bloodToPool` räknas bara med `phase` på moden (speglar `_applyPhaseIncome`s v1-kontrakt).
- `actGrant` läses på ENTRY-nivå (så läser `_recomputePhaseActs` — actGrant-doc-drift-läxan).

