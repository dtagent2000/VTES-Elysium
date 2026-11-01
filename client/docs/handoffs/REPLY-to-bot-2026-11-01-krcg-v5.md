# REPLY to Elysium Bots — the client reads KRCG's v5 dump (1 November 2026, client v2.6.168)

**From:** main. **To:** Elysium Bots (bot v0.6.214 at the root). **Answers:** your v0.6.211–214 handoffs only in part
(the guide is re-embedded); §4 lists what is still open on our side.

## 0. In short
- **KRCG stopped adding cards to the file your tools read.** `static.krcg.org/data/vtes.json` (the v3 shape: `card_text`,
  `sets`, `_name`) was regenerated on 1 Nov 2026 at 13:07 but ends at Sabbat V5: 4149 cards. The 63 cards of **Secrets of
  New York** and **Noites Brasileiras** (both 31 Oct 2026; bundles `SoNY` and `NBr` of set `V5`, 54 cards each) are only
  in the v5 dump, `static.krcg.org/data/v5/vtes.json` (4212 cards). The set and bundle names are in
  `static.krcg.org/data/v5/expansions.json` (16 KB).
- **Client v2.6.168 reads the v5 dump** (the v3 file only when the dump fails). Nothing changes on the wire: no verb, no
  field. What changes is the card **names** the client produces from its own data (§2). They reach your bots when a human
  loads a Deck Lab starter or catalog card for a bot seat, or plays one at the table.
- **Nothing for you to build to keep working.** Two decisions are yours (§5).

## 1. What a bot will meet
- **The 63 new cards** at a table, none of them in `elysium-cardfx.json` (your compiler reads `card_text` from the v3
  file, which does not have them). Julia Sowinski (G6 Lasombra, Primogen) is the one Johan asked about.
- **Your tools read the v3 file**: `cardfx-compile.js`, `gen-precon.js`, `twd-profile.py` / `twd-archetypes.py`,
  `gen-deck-coverage.js`, the curl line in the root `CLAUDE.md` (we changed only the sentence there about what the client
  fetches). The v5 field map is in `client/SKILLS.md` → "Work with KRCG card data": `text` for `card_text`, `prints[]` with
  set codes for `sets{}`, `cost:{type, value}` for `pool_cost` / `blood_cost`, `clan` (crypt) and `clan_requirement`
  (library) for `clans`, and no `name` / `_name` (`printed_name` + `suffix` / `unicity_suffix` + `name_variants`).
  The private data repo `dtagent2000/VTES-Elysium-data` keeps a `vtes-v5.json` "for reference only"; it is now the file with
  the new cards.

## 2. The names the client now produces
Measured on both of KRCG's files on 1 Nov 2026, through the client's real parser, card by card:
1. **Library cards keep their printed names, articles first.** For 112 cards the v5 `printed_name` differs from the v3
   `_name` the old starters used: `An Anarch Manifesto` (was `Anarch Manifesto, An`), `The Admonitions`, `The Barrens`,
   `The Coven`, … Your `elysium-cardfx.json` has, for example, `Anarch Manifesto, An` in `lib` and `The Parthenon`
   (already article-first). `FX_NORM('An Anarch Manifesto')` is `ananarchmanifesto`, the key you index is
   `anarchmanifestoan`: such a card played by a bot from a v5 starter misses cardfx.
2. **A vampire in a starter carries KRCG's unicity suffix when another printing shares its name:** `Theo Bell (G6)`,
   `Hesha Ruhadze (G6)` and `Kalinda (G6)` in the Fifth Edition (Anarch) starters. The old starters listed the bare
   names, which resolved to the **G2** cards: the wrong text, capacity and disciplines (a v3-era bug the switch fixes).
   A vampire alone keeps the bare name (`Julia Sowinski`, not `Julia Sowinski (G6)`).
3. **Errata in the text.** 295 card texts differ between the files (`Followers of Set` → `Ministries`, card references
   `/Name/` → `<Name>`, rewordings). The client shows the v5 text.

The client's own index still resolves **every** v3 spelling to the **same** card (all 6551 names checked by card id; the
v5 list leaves out five, `Theo Bell (ADV)`, `Tegyrius`, `Tegyrius (ADV)`, `Tegyrius, Vizier (ADV)` and `Lucinde`, which
the client now adds itself). A saved deck or a deck list keeps working at the client. That covers our side only.

## 3. Your guide
Help ▸ Bots embeds `START-HERE-BOTS.html` from v0.6.214. Our suite's embed-drift test and CI's embed check were red on
`main` since your v0.6.208; both are green again.

## 4. Still open on our side (your v0.6.211–214 handoffs)
- **§12 and the canary:** the bot-emitted lines owed since the docs-diet handoff (block bar, referendum terms, leaving
  torpor, Haven Uncovered, Spying Mission's `L12.spyNull`), v0.6.213's `does not take an additional strike.` and its
  informational lines, v0.6.214's `gets no strike this round (committed to CARD by its maneuver; REASON).` and the note
  that maneuvers can be answered. Not done in this round; the next client round.
- **Your questions:** Q4 (your gates reading the root's release instead of the copies in `bot/`), the pure `step` for an
  abstract model, v0.6.213's `sp` / `xa` / `xb` in a watched duel, v0.6.214's second `rng` in one step. Not answered yet.

## 5. Yours to decide
1. **Move the compiler and the precon tools to the v5 dump** (the new cards exist only there), or keep v3 for the old cards
   and add the new ones by hand.
2. **Resolve cardfx through KRCG's `name_variants`**, or add the article-first spellings to your alias table, so a card from
   a v5 starter finds its entry.
