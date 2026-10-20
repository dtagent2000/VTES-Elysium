# Cardfx sweep — source mapping (KRCG, vtes-rulings, vtes-skill) (copied into git 20 Oct 2026)

**Origin:** the Claude Doc of the same name (Johan's, 25 Sep 2026, https://claude.ai/artifact/AGzYhap2bMyc4vwhRFzUUj), copied
verbatim below (spec-cleanup-2026-10-20.md §5.4).

**Status on 20 Oct 2026:** the sweep ran on 25–26 Sep: the pilot and the full library (`reports/REPORT-cardfx-sweep-pilot.md`,
`reports/REPORT-cardfx-sweep-full.md`, `sweep-pilot.py`, `sweep-pass2.py`, `sweep-full.py`); the `actStealth` question is settled
(RULINGS R-14); a `ranged` flag exists in the compiler and the bot. The mapping below stands as the method for the graded rules
readings of the V5 waves (HARNESS, spec-cleanup T3). The last section ("What to upload") is stale: `vtes.json` comes from KRCG
or the private data repo (root CLAUDE.md), and vtes-rulings / vtes-skill are not in git.

---

# Cardfx sweep — source mapping (KRCG, vtes-rulings, vtes-skill)

2026-09-25 · @Johan Adamsson

Card text comes from KRCG, the ruling on a card from vtes-rulings, the general rule from the rulebook in vtes-skill; the sweep compares our cardfx against all three and brings every disagreement to Johan.

Our cardfx today holds 2,365 library cards: 1,670 with modes, 780 of them keyed by discipline level (`tha` / `THA`), 395 with an action stealth and 110 with a strike. The sweep checks those fields, starting with the cards in our four starter decks.

**Blocker:** the sandbox has no network, so the source files have to be uploaded to the project first (last section).

## The sources

| Source | Holds | Format | Licence | Settles |
| --- | --- | --- | --- | --- |
| KRCG `vtes.json` (already the input of `cardfx-compile.js`) | Every card's printed text, types, disciplines, VEKN id | JSON | VEKN data, used with permission | What the card SAYS |
| [vtes-rulings](https://github.com/vtes-biased/vtes-rulings) | The official rulings, one YAML file, plus card groups and reference links | YAML | MIT | How a card is RULED to work |
| [vtes-skill](https://github.com/vtes-biased/vtes-skill) `references/rules/` | The 2024 rulebook verbatim, about 2,600 rulings distilled into principles, judges' and tournament guides | Markdown | MIT; game content under Dark Pack | The GENERAL rule (undirected +1, range, aggravated) |
| vtes-skill `references/strategy/` | Theory, a modules catalogue, archetype classification, meta history | Markdown | MIT | The knowledge layer (below), not the sweep |

The rulings file is built to be read without tooling: rulings carry discipline symbols in brackets (`[pot]` for inferior, `[POT]` for superior), card names in braces, and reference ids at the end.

## Cardfx fields → source → check

| Cardfx field | Question | Source | Check |
| --- | --- | --- | --- |
| `modes[].at` (inferior / superior) | Is each level's effect on the right mode? | KRCG text (`[pot]` / `[POT]` segments) + rulings with a level prefix | Each mode's `fx` matches its own text segment; a ruling on one level lands on that mode only |
| `req` on the entry vs on a mode | Is a restriction the whole card's or one level's? | KRCG text + rulings | The July audit found 11 of 21 `rangeLong` and 21 of 83 `beforeRangeDetermined` are mode-specific; move each to its mode |
| `actStealth` | Does it include the undirected +1? | Rulebook (undirected actions) + the card's `dir` + printed stealth | Settled by the rulebook (pilot, 25 Sep): an action card is at 0 stealth unless it prints stealth, so `actStealth` = the printed total; the undirected +1 belongs to basic actions only. cardfx agreed on 17 of 17 deck action modes |
| `strike`, `handStrike`, a `ranged` flag | Does the strike reach at long range? | KRCG text ("ranged") + rulings | Add `ranged` per strike mode; VTES-Player found .44 Magnum had no weapon profile at all |
| `stealBlood`, `aggravated`, `prevent`, `press`, `maneuver` | Does the level give what the text says? | KRCG text + rulings | Text match per mode; rulings for timing (e.g. a bundled press) |
| `dir` (directed / undirected) | Who may block? | Rulebook + card text | Needed for `actStealth` and for the block window |
| Political terms (knowledge layer) | Which way does pool move, per seat? | KRCG text + rulings | A polarity per political card, VTES-Player's lesson (Parity Shift reverses the obvious sign) |

## Joining the data

The three sources join on the VEKN card id; our cardfx joins by card name, so the sweep adds the id to every cardfx entry.

- **Rulings key:** `<card_id>|<card_name>` with the VEKN CSV id and name; groups of cards use ids starting with `G` (in `groups.yaml`).
- **Our key:** the card name (plus `alias`); `vtes.json` gives name → id, which also settles same-name variants.
- **Discipline trigrams line up:** our `modes[].at` already uses the same lower / upper-case trigrams as the rulings (`tha` / `THA`), so a ruling's level prefix maps straight onto a mode.
- **Card-type symbols** in rulings (`[COMBAT]`, `[ACTION]` …) map onto our `t` list.

## The sweep process

The sweep writes a diff report, never silent edits: every card where cardfx, the text and the rulings disagree gets a row, and Johan rules on the ones a rule cannot settle.

1. **Pilot:** every card in the four starter decks plus the Hacking / Wall / Sewer lists — the cards the bots actually play, so a wrong field shows up in series.
2. **Then by type, most bot-relevant first:** combat cards, action modifiers (stealth, bleed), reactions (intercept, bounce), actions, political actions, equipment, allies and retainers.
3. **Per card, one diff row:** field · cardfx now · what the text says · what the rulings say · proposed value · rule or ruling cited.
4. **Fixes land in `cardfx-curated.json`** (the override layer the compiler already honours), each with its source citation; the compiler's own patterns are fixed only where a whole family is wrong.
5. **Gates per batch:** suite, canary, and a ledger series; `ana-block.py` for stealth / intercept changes.

| Report column | Example |
| --- | --- |
| Card | .44 Magnum |
| Field | `strike` mode: `ranged` |
| Cardfx now | missing |
| Text / ruling | its printed strike, read from KRCG (an R marks ranged damage) |
| Proposed | `ranged: true` |

## Knowledge-layer questions → vtes-skill strategy

The strategy references answer the questions Johan deferred to the knowledge layer; they are read now so the event log records what they need, and used after the sweep.

| Deferred question | Strategy reference | What we take |
| --- | --- | --- |
| Block doctrine: do not block combat decks unless you must | Archetype classification, theory | Which archetypes punish a block, by what they show |
| Tremere: maneuver when combat is expected, press against pacifists | Archetype classification | An expected-combat score per seat from its shown cards |
| Malkavian's wave: narrow to 0 blood or a Nosferatu that cannot press | Modules catalogue | Which modules mean "this seat fights" |
| Rush priority, seize the moment | Theory, calibration lessons | When a torpor is worth an action |
| Personas per deck (the meta layer) | Meta history, archetypes | The postures a real player of that archetype takes |

The event log's `card-played` events are the evidence each of these reads; the archetype is the prior before enough is seen.

## What to upload before the sweep can start

The sandbox cannot reach the network, so these files have to be added to the project; with them the pilot can start in the next session.

- [ ] **KRCG `vtes.json`** — the snapshot `cardfx-compile.js` was built from (main's project may already hold it).
- [ ] **vtes-rulings:** `rulings/rulings.yaml`, `rulings/groups.yaml`, `rulings/references.yaml`.
- [ ] **vtes-skill `references/rules/`** — at least the rulebook and the advanced-rules synthesis.
- [ ] **vtes-skill `references/strategy/`** — the archetype classification and the modules catalogue (for the knowledge layer; can wait).
- [ ] **Attribution:** a short `THIRD-PARTY.md` naming vtes-rulings and vtes-skill (MIT) and the Dark Pack notice for game content — written by us when the files arrive.

## Sources

- [vtes-rulings](https://github.com/vtes-biased/vtes-rulings) — format, symbols, key format, MIT licence
- [vtes-skill](https://github.com/vtes-biased/vtes-skill) — layout, sources, MIT licence
