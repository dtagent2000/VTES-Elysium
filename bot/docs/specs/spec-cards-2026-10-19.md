# The stable's remaining cards — analysis and proposals (19 Oct 2026, late evening)

Johan, 19 Oct 22:02: "we can take this now, while you have the full context and can evaluate with our new test
environment". The four cards come from the sim's first baseline (`docs/reports/REPORT-sim-table.md` §5).

All numbers are from the sim, on bot v0.6.210 bytes. Unless a row says otherwise the series is the 240-match client-profile
design: the four V5 starters, every seating × 10 deals. Experiments ran on a scratch copy of the bot, never in `bot/`.

## 1. Pentex™ Subversion — a name, not a doctrine (proposal: just fix it)
- **The data:** the curated entry is keyed *Pentex(TM) Subversion*, the old spelling. The printed name in `vtes.json` is
  *Pentex™ Subversion*, and it lists *Pentex(TM) Subversion* as a name variant.
- **What the compiler does:** the curated overlay writes the curated entry under the old key and leaves the printed name on
  its empty auto entry (master, 2 pool, no effect). It is the only one of the 105 curated keys that is not a printed name; the
  compiler's report flags it ("curated names NOT in vtes.json").
- **What the bot gets:**
  - A list typed with **(TM)** (the bots' own Tremere list) plays the curated card.
  - A list typed with **™** (KRCG's precons, and every deck the V5 precon generator would write) gets an uncurated master. It
    is paid for and played with no effect.
  - The readers of an opponent's play are spelling-tolerant already.
- **Fix** (`cardfx-compile.js` v1.9.3): a curated entry keyed by a printed variant is also written under the printed name.
  Each spelling then resolves exactly to itself, so `fxLookup(name).name` keeps equalling the hand's own name. The master
  loop re-anchors by name; resolving *(TM)* to the printed name would have broken the bots' own list.
- **Prototype result:** the compiled cardfx differs from today's in exactly one key, *Pentex™ Subversion*, now curated. Crypt
  and alias tables are unchanged.
- **Tests:** `test-cardfx.js` (both keys curated; the report no longer flags the name) and a bot section (a ™ copy in hand is
  played with its cannot-block target).

## 2. Kevlar Vest and .44 Magnum — the scorer, not a bug (proposal: Johan's call, A or B)
- **The cause:** the action scorer prices every non-intercept equipment flat: `1.15 × econW` (economy weight ≤ 1, ×1.15 in
  the build phase). A plain bleed is `1 × aggression (1.2) × offW (≥ 1)`. A weapon or an armour therefore wins only in the
  build phase with the prey six or more turns from falling.
- **The finder:** the equip finder offers one item per actor, the best tier (intercept 1, weapon 2, armour 3). With both cards
  in hand, Kevlar never gets the slot.
- **Baseline:**

| | offered as the actor's equip option | taken |
|---|---:|---:|
| Kevlar Vest | 429 | 0 |
| .44 Magnum | 692 | 11 (7 equips + 4 via Magic of the Smith) |

  - The Magnum fired 7 strikes.
  - In the same table the Nosferatu (`permFirst`) equipped Murder of Crows 151 times and Raven Spy 155 times.
- **Experiment:** Tremere only (`--knob tremere:combatEquipW=…` on a scratch copy), tier 2–3 equipment × the knob.

| Tremere | ×1 (today) | ×1.3 (= the intercept price 1.5) | ×1.6 |
|---|---:|---:|---:|
| Kevlar equipped | 0 | 42 | 49 |
| .44 Magnum arrived | 11 | 53 | 58 |
| Magnum strikes | 7 | 36 | 45 |
| combat rounds of an equipped vampire, dealt ≥ taken / less | 15 / 2 | 124 / 20 | 136 / 22 |
| Tremere VP/match ± SE | 0.76 ± 0.08 | 0.69 ± 0.08 | 0.73 ± 0.08 |
| matches that diverged from today | — | 101 | 110 |

- **Reading the experiment:**
  - The cards do their job once equipped: the bearer wins most of its combat rounds.
  - Equipping more neither costs nor buys measurable VP at 240 matches (the differences are under one SE).
- **Options:**
  - **A — leave the price.** The sim says the bot's choice costs nothing measurable here. Kevlar's cardfx would be curated to
    its printed text: 2 against gun strikes, 1 otherwise. The engine already prevents 1, so behaviour does not change.
  - **B — Tremere prices weapons and armour like an intercept item (1.5).** It would be a deck-strategy fact like Nosferatu's
    `permFirst`: the "snipe" combat posture wants a ranged strike, and the wall wants survivable blockers. It ships only if a
    960-match run (4 × the deals) shows Tremere's VP not lower beyond noise.
  - **C — your own doctrine.** For example, armour only when a seat that can reach me rushes.
- **Recommendation:** B if the goal is that the stable's cards show up and work, A if VP is the only arbiter.

## 3. Spying Mission's [OBF] — the card's classic use is real but rare (proposal: Johan's rule, B recommended)
- **Card text:** "[OBF] Only usable if a bleed would be successful. Instead, the bleed burns no pool, is unsuccessful, and
  this card is put on this vampire. The next time this vampire is about to successfully bleed the same Methuselah, burn this
  card and this vampire gets +2 bleed."
- **Today:** 278 plays, every one the [obf] +1 stealth. The bot has no consumer for the superior mode, by design (cardfx
  note, 11 Sep).
- **When it matters, measured:**
  - Of 1,984 Malkavian bleeds that went through, **111 were bounced**.
  - With four players left, all 87 went to my grand-prey, which is the bouncer's own prey: the bounce turns my bleed into my
    prey's pressure.
  - With three players left, the other 24 went to my predator; ousting them hands my prey the VP.
  - 9 of the 111 ousted the new target.
  - In **10** of them the actor had a superior-[OBF] vampire and Spying Mission in hand (amounts 2–5). That is 0.04 per match.
- **Options:**
  - **A — never** (today). Stealth only.
  - **B — cancel a bounced bleed of 2 or more that is about to land on someone other than my prey.** The card goes on the
    vampire with its +2 banked against that Methuselah. The bank pays when that Methuselah becomes my prey, which happens
    after my prey is ousted.
  - **C — B for any amount**, or B plus holding a copy back for it when the prey has shown a bounce.
- **Cost of B:**
  - A frozen line for the cancel, telling the target and the table "unsuccessful, no pool".
  - The attached card and its +2 at a later bleed on the same Methuselah: an add line, as a modifier.
  - A section in the suite and a sim check: the 10 opportunities taken, nothing else changed.
- **Recommendation:** B, with Johan's threshold.

## 4. Order of work after "kör"
1. Pentex (the compiler, then the cardfx regenerated, then the tests).
2. Johan's choice for Kevlar and Magnum.
3. Spying Mission per his rule.
4. Then the gates, the sim baseline and the footprint, and one PR stacked on #36.
