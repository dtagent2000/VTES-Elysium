# Cardfx LGD Audit — the Nosferatu-campaign keys vs the whole database

> **26 July 2026 (Johan's inventory ask).** For every fx key minted during the
> Nosferatu push (N0→P0), measure the FAMILY SIZE across all of vtes.json and
> judge the tagging level: GENERAL-CORRECT, CARD-SPECIFIC-OK (family ≤ 2, the
> Chantry precedent), SIBLINGS-READY (the consumer already serves them —
> curation alone yields future FULLs), or rider-TODO. Method: regex family
> sweeps over card_text, then a LIBRARY filter (the raw sweep's trap: crypt
> cards carry the same phrases as INNATE abilities — Adhiambo's rush, vampires'
> +strength, titles' votes — which are NOT library-tag territory).

## 1. The verdict table

| Key | Family (library) | Verdict | Notes |
|---|---|---|---|
| `rush` | **105** (Bum's Rush class) | **GENERAL-CORRECT, siblings-ready** | Finder/branch/score/targeter are 100% key-driven. The L12 comply grammar is per-card FROZEN by design (Deep Song's line today; each curated sibling adds its own frozen line — the additive M-pattern, never a regression risk). |
| `reduce` | **5** (Banner of Neutrality, Dummy Corporation, Nest of Eagles, Truth in Ink + District) | **GENERAL-CORRECT, ride-free ×4** | The finder reads `mo.req` generically — no req ⇒ any unlocked reactor. Curation alone makes the four siblings FULL in any future deck. |
| `votesBonus` | **10** react-type | **GENERAL-CORRECT, ride-free** | Same req machinery; the P0 window serves them all. |
| `strengthBonus` | **68** (weapon-damage forms excluded) | **GENERAL-CORRECT, large family ready** | The bearer-derivation (richest-usable) is fully general. The weapon sub-family (damage = strength+N) stays a documented exclusion — unchanged boundary. |
| `allyBurnUnlock` / mini-ally model | **15 of 119** allies are sit-and-burn | **GENERAL-CORRECT within the honest boundary** | 15 allies fit the never-acts model as-is; the other 104 await the full (combat-capable) ally class. `allyPressLife` raw hits (17) include OUTSIDE-burner cards — eyeball at curation. |
| `fameOnTarget` | 2 (the other is a crypt innate) | **CARD-SPECIFIC-OK** | Chantry precedent confirmed. |
| `rebelBlood` | **1** | **CARD-SPECIFIC-OK — perfect LGD** | |
| `jackEngine` | 1 (unique) | **CARD-SPECIFIC-OK** | |
| `preyBurnPerCopy` | **2 — Army of Rats is a TRUE sibling** | **GENERAL-CORRECT + rider-TODO** | Army's text adds a per-NAME cap: "You can burn only 1 pool each turn with Army of Rats cards" — our engine counts copies (correct for Creeping's own text). Army rides free WITH a small `burnCap` rider read at curation time. Documented, not built. |
| `warsawRescue` | 3 raw, but the siblings differ | **CARD-SPECIFIC-OK** | Renewed Vigor = self-attach self-rescue (a different shape); White Nights Massacre = transient burn-a-vampire. No shared denominator worth a key. |
| `warsawRefresh` | member of a **15-card "unlock the acting" family** | **GENERAL-CORRECT for its sub-shape** | The family splits by trigger: at-end-of-TURN (Baseball Bat, Leather Jacket, Distant Friend), immediate (Claiming the Body, Gifts From Hereafter, Warsaw), and the acting-minion SWAP relative (Mask of a Thousand Faces — a future class of its own). The shared asset is the CONSUMER CORE: unlock-the-actor + the `_actorQueue` revisit. |
| `recruitAlly` / `allyLife` | — | **GENERAL-CORRECT** | The [ani]/[ANI] richest-mode recruit generalizes to any discipline-gated ally. |

## 2. The finds (Johan's "or can we find more?")

### 2.1 THE FREAK DRIVE FIND 🎯
> *"Only usable after action resolution. [for] Only usable if the action was
> successful. Unlock this vampire. [FOR] Only usable if the action was blocked.
> Unlock this vampire."*

This is **exactly our infrastructure**: the v0.6.64 B-fix's live `_actorQueue`
revisit IS Freak Drive's engine, built before its card. The act-again family
counts 4 more (Ahrimane Protectorate, Augur, Big Game, Strix). Freak Drive is
among the most-played cards in competitive VTES — the day the first [for] deck
registers (Ventrue!), the key lands as `selfUnlockAfterAction` with a
success/blocked rider and the motor is ALREADY TESTED. Zero build today; the
audit's job is knowing it.

### 2.2 The "unlock the acting" family map
Fifteen library cards share the core; three trigger-shapes. Future keys can
share `_actorQueue` regardless of shape — the at-end-of-turn variants would
queue at TURN level (a small extension), the immediates ride as-is.

### 2.3 Army of Rats
Creeping Sabotage's classic sibling — rides `preyBurnPerCopy` free once the
`burnCap` rider exists (a curation-time read, one line in the unlock engine).

## 3. Method notes
- Sweeps: regex families over `card_text`; the LIBRARY filter excludes
  crypt-innate phrasing (the raw sweep's biggest distortion: rush 168→105,
  strength 204→68, votes 40→10).
- The Chantry precedent governs family ≤ 2: card-specific vocabulary is the
  RIGHT LGD when no sibling shares the mechanic.
- "Ride-free-ready" means: consumer already serves the sibling; curation is
  the only step, and it belongs to the deck that first registers the card
  (deck-driven depth over database completionism — the standing methodology).

## 4. Recommendation
**We are in phase.** No key needs renaming (names are cosmetic; consumers are
the contract, and every consumer is fx-literal-driven post the scanner
lessons). Two rider-TODOs (Army `burnCap`, at-end-of-turn refresh) and one
strategic note (Freak Drive's ready motor) are the whole backlog — all
deck-triggered, none urgent.
