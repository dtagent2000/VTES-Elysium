# Elysium Bots — delivery 19 October 2026 (night): bot v0.6.210 → **v0.6.211**, THE STABLE'S REMAINING CARDS — DEPLOY CANDIDATE

**What it is.** The four weak cards the sim found in the V5 starters (`REPORT-sim-table.md` §5), handled with Johan's choices
of 22:36. The analysis, the experiments and his answers are in `docs/specs/spec-cards-2026-10-19.md`.

**On main after PR #35 (v0.6.209) and PR #36 (v0.6.210), both merged 19 Oct.**
`READ-ME-FIRST-2026-10-19c.md` and `-19b.md` stand for everything else.

## 1. Pentex™ Subversion — `cardfx-compile.js` v1.9.3
- **The miss:** the curated entry was keyed *Pentex(TM) Subversion*. The printed name kept the auto tier's empty entry, so a
  list typed from the data (KRCG's precons, the V5 precon generator) paid 2 pool for a card that did nothing. The bots' own list
  types "(TM)" and never noticed.
- **The fix:** a curated entry keyed by a printed variant is also written under the printed name. The variant key stays, so
  each spelling resolves exactly to itself, and `fxLookup(name).name` keeps equalling the hand's own name (the master loop
  re-anchors by name).
- **What changed in the data:** only that one lib key. Crypt and alias are unchanged, and curated stays 105. The report lists
  the variant instead of "NOT in vtes.json".
- **Tested:**
  - `test-cardfx.js` 275/0, +4 (271/4 on v1.9.2).
  - Section 157a: a whole turn plays Pentex™ on the prey's vampire.
  - A scratch Tremere list typed with ™ (72 matches): 18 uncurated picks on v0.6.210, 31 curated on v0.6.211.

## 2. Weapons and armour over a bare 1-bleed
- **Johan's rule:** "with Govern or Kevlar to choose from you usually choose Govern, but with only a bleed of 1 you probably
  choose the equipment … the Magnum is stable except at the end of the game when you are low on pool".
- **The rule as built:** a weapon or an armour (equip tier 2–3) beats a **bare** plain bleed of 1 — no crypt bonus, and no
  bleed modifier in hand to pump it (`ctx.plainBare`).
- **Where it does not apply:**
  - never against a bleed card (it keeps its own score: Govern's is far above);
  - never with the prey within reach (the lunge rule);
  - a pool-cost item at 6 pool or less keeps the flat price (`ctx.lowPool`).
- **Knob** `equipOverPlain`: 1 (default); 0 = the flat 1.15 × economy weight, as before.

## 3. Spying Mission [OBF] — option B
- **When:** a bounced bleed of 2 or more is about to land on somebody other than my prey. With four players that is my prey's
  prey, with three my predator.
- **What happens:**
  - The bleed is made unsuccessful: no pool, no Edge.
  - The frozen line goes out: `<vampire> plays Spying Mission [OBF] — the bleed is unsuccessful and burns no pool.`
    (`L12.spyNull`). A bot target sets its pending bleed to 0.
  - The card goes on the vampire with +2 banked against that Methuselah.
- **The bank:** burned the next time that vampire is about to successfully bleed the same Methuselah, in a modifier's shape —
  the frozen L12.add line, then a reactions-only window.
- **As stealth:** the card is spent last at equal stealth (Johan: "you play it as stealth last of the stealth cards you already
  have in hand"). A combat dual card (Swallowed by the Night) is still kept over it.
- **Knob** `spyCancelMin`: 2 (default); 0 = never.

## 4. Section 157 (19)
- **Pentex:** the lookup, the master finder, and a whole turn.
- **Equipment:** the Magnum over a bare 1-bleed; not with a modifier in hand; Govern first; not at 6 pool; Kevlar at a healthy
  pool; not in a lunge; knob 0; the two ctx reads.
- **Spying Mission:**
  - the stealth order, and the decision;
  - the cancel on the actor's side and on the target's side;
  - not played on an unbounced bleed, on 1, or without superior OBF;
  - the bank against the right Methuselah only, and not after a bounce.
- **Destructively on v0.6.210:** 8 red, 5 green by design, then the run stops at 157i (the functions do not exist).

## 5. The sim (240-match client design, v0.6.210 → v0.6.211)

| | v0.6.210 | v0.6.211 |
|---|---:|---:|
| Kevlar Vest equipped | 0 | 29 |
| .44 Magnum arrived (equipped + fetched) / strikes | 11 / 7 | 44 / 39 |
| Spying Mission as stealth / bleeds cancelled / banks paid | 278 / 0 / 0 | 248 / 7 / 1 |
| VP/match: malkavian · ventrue · tremere · nosferatu | 1.94 · 1.04 · 0.76 · 0.25 | 1.94 · 1.05 · 0.73 · 0.28 |

- **The cancels:** all 7 were bleeds bounced onto my prey's prey, of 2–5 pool. Every VP move is inside one SE (0.05–0.11).
- **Footprint:** 83 SAME-PLAY and 157 DIVERGED, 70 of them with another outcome.
  - 93 diverge first at a Malkavian stealth play (Cloak the Gathering before Spying Mission).
  - 63 diverge first at a Tremere action (the equipment).
  - 1 diverges first at a cancel.
- **Played at 0 pool:** 0.

## 6. Gates (on the release bytes)
- `node --check` on every changed JS file (`elysium-bot.js`, `test-bot-logic.js`, `cardfx-compile.js`, `test-cardfx.js`).
- **Suite 2244/0 ×3** (alone, frozen snapshot with the root client v2.6.167 one level up, so 154f ran each time; v0.6.210: 2225, +19 = section 157;
  release bytes `elysium-bot.js` 03cc8ee7…, `test-bot-logic.js` 3a69c74c…, `elysium-cardfx.json` 8f78ba98… (compile v1.9.3)).
- **Canary 69/0** with `bot/`'s read-only copies and **69/0** with main's v2.6.167 client + protocol and srv-2.6.49.
- **Hotseat gate 11/0**, **HB1 11/11**, **test-cardfx 275/0** (271/4 on the v1.9.2 compiler).
- **Section 157 destructively:** on v0.6.210's `elysium-bot.js` + cardfx 8 red, 5 green by design, then the run stops at 157i (the functions do not exist).
- **check-versions** (run on `client/`): everything agrees; the root's 21 files are byte copies of client/ or bot/.
- **The sim on the final bytes:** 240 last-standing, played at 0 pool 0, IDENTICAL 240 to the measured run (only a comment changed since).

## 7. Release
- `BOT_VERSION` 0.6.211. The CHANGELOG carries v0.6.211 (Bot) and compile v1.9.3 (cardfx).
- Updated: the handshake in `bot/CLAUDE.md`, the context, the learnings, the journal, `README.md`, the spec's §5 and
  `docs/START-HERE-BOTS-CHAT.md`. `START-HERE-BOTS.html`: version chip and footer only.
- The bundle (`elysium-bot.js`, `elysium-cardfx.json/.js`, `START-HERE-BOTS.html`) is copied to the root.
- Handoff: `docs/handoffs/HANDOFF-to-main-2026-10-19-v0_6_211.md` (nothing to build; one new bot line; re-embed the guide and
  the cardfx).

## 8. Next
- **Kevlar in the knowledge layer.** Johan: it is very valuable against Gangrel and statistically frequent aggravated damage.
  The TWD profile and the archetypes could price armour by what the table's decks deal.
- **The V5 plan:** precon generator, coverage class map, Toreador, waves.

## 9. Anything I'm unsure about
- **Two keep-it rules meet on one tie.** "Spying Mission last" and v0.6.156's "keep Swallowed by the Night for combat" can apply
  to the same equal-stealth choice. I let the combat card be kept, so there Spying Mission is spent first. Johan's call.
- **The bank's +2 comes before a reactions window.** If the bleed is then bounced, the +2 rides it to somebody else, although
  the card speaks of "the same Methuselah". This is a rules edge case I did not close.
- **"Low pool" is a fixed 6** (Johan's floor), not the dynamic critical level. The dynamic level writes a trace row every time it
  is read, and the action ctx is built for every actor.
- **Both Pentex spellings in one game are two cards to `_uniqueInPlay`,** because it compares names exactly. That needs a
  "(TM)" list and a ™ list at the same table.
- **The footprint is large (157 of 240) but the VP is not.** Most divergences start at the Malkavian stealth order, a small change
  repeated every turn. I read the deck numbers as "no measurable change", not as "proven equal".
