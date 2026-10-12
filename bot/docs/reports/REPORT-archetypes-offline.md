# Archetype labels — the offline test (28 Sep 2026)

**Question:** before the bot gets archetype labels, how right are they, and how often would they be wrong in the open world?

**Data.** vtes-skill's reviewed classification (120 named archetypes, TWDA 2021+) joined to KRCG's TWDA export by deck id; 42 archetypes have ≥ 10 decks (690 decks — 15 % of all TWDA decks). The larger VDB-style export Johan found holds the same decks plus 134 newer ones (82 from 2026); it is merged into the profile builder (`twd-profile.py`, now 4,672 decks) but the KRCG export stays the base because its ids are what the classification refers to.

**Model.** A naive-Bayes signature per archetype (card frequencies over its decks, plus the crypt's clan). Test: 5-fold, k random "shown" library cards + the clan.

## Inside the classified world (the 42 archetypes)

| shown cards | top-1 right | top-3 right |
| --- | --- | --- |
| 3 | 81 % | 98 % |
| 5 | 84 % | 99 % |
| 8 | 90 % | 99 % |
| 12 | 92 % | 99 % |

## The open world — decks outside every archetype (85 % of TWDA)

A plain margin gate is falsely confident on 38–54 % of them, and a "beat the TWDA background" gate does not help (any specific archetype fits better than the average deck). A **coverage gate** does: label only when the best archetype wins by a margin ≥ 2 AND ≥ 85 % of the shown cards are typical of it (in ≥ 20 % of its decks).

| gate | archetype decks labelled (8 shown) | of those right | outside decks falsely labelled |
| --- | --- | --- | --- |
| margin only | 74 % | 97 % | 45 % |
| + coverage ≥ 0.7 | 64 % | 98 % | 18 % |
| **+ coverage ≥ 0.85** | **49 %** | **98 %** | **10 %** |

Our four starters, 8 cards shown: Ventrue → Lawfirm, Tremere → Tremere Chantry, Malkavian → Malk 22, Nosferatu → Ani Barons — all sensible.

## Recommendation

Two tiers. **Confident** (margin ≥ 2, coverage ≥ 0.85): about half of the classifiable decks get a label once 8 cards are shown, 98 % right, and about 1 in 10 outside decks gets a wrong one — usable for decisions where the four shares (combat / stealth / intercept / bounce) are not enough, each such use benched. **Closest** (always available, shown with its coverage): for chat and traces only — "closest known archetype: Lawfirm (6 of 8 cards typical)" — never a decision on its own. The continuous expectation from brick 1 keeps driving combat and blocks.
