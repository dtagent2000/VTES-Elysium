# HANDOFF — bot v0.6.196 to main (10 Oct 2026): combat ends by the opposing strike, the damage step, two steal fixes

**From:** the bot project. **To:** main. **Follows** `HANDOFF-to-main-2026-10-09-v0_6_195.md`. If that one hasn't reached you, read it first; this one only adds. **No wire change.**

## 1. Deploy
- **`elysium-bot.js` v0.6.196** replaces v0.6.195 (or v0.6.193) everywhere: bot processes and the hotseat bundle.
- Unchanged since v0.6.195: the cardfx and the TWD JSON files with their `.js` twins.
- **START-HERE-BOTS.html — re-issued; please embed this copy.** It covers combat ends, the damage step and the footer.
- **Gates here:**
  - suite 1838/0;
  - canary 57/0 and hotseat 10/0 against v2.6.138, the newest client in this project;
  - test-cardfx 261/0.

  Please run your client suite and our canary with v0.6.196 beside v2.6.139.

## 2. Combat ends (Majesty) — your v0.6.193 finding, now built
Your question was whether Majesty against a single hand strike for 1 is intended. Johan's direction: save it for an opponent whose strike is dangerous. v0.6.196 does that (knob `combatEndStats`, default 1 after a bench).

- **Which strike the bot weighs.**
  - When the human declared first, the strike it saw. The acting side declares first, so a human acting has already answered "What is your strike?".
  - Otherwise, the expected strike from its table model.
- **Always played:** a strike that would put the vampire in torpor, or an aggravated strike (or a seat that has shown aggravated strikes).
- **Never played:** against the human's dodge.
- **Otherwise it is a trade:** what the card saves against what it is worth kept.
  - Saved: their damage + steal, plus the unlock at superior Presence, minus Majesty's own blood.
  - Kept: the table's most dangerous expected strike, shared by the copies in hand.
- **Against a hand strike for 1** it now usually keeps Majesty. It may still play it when the unlock matters and it holds spare copies.
- **Your LIVE test** with the bot's hand emptied is unaffected either way.
- **Bench** (Ventrue's seat, 24 matches per arm on the same seeds): no loss — −0.11 vs −0.12 VP against a quarter of the table. The bot spent about 19 fewer Majesty per 24 matches.

## 3. The damage step
- **Nothing reaches the human's minion this round** (the human dodged, the bot stole instead of striking, fists at long range): there is nothing to prevent. The bot writes ph 4 and moves on at once, in every tempo, Turn-based included. The wait row says `no damage reaches their minion`.
- **Damage is coming:** Standard waits 1 × the slider (2 × in v0.6.194–195), so 3 s at your seeded default. Adaptive's ceiling likewise. Carrion Crows counts as damage coming.
- **A table with no botcfg** keeps the old clock.

## 4. Two steal fixes — rules corrections, no knob
**The human steals from the bot.**
- **Before:** the bot lost the blood the moment the human's steal line arrived, before its own strike. If it then ended the combat (Majesty) or dodged, the blood was gone anyway.
- **Now:** the steal waits for the bot's strike. It lands at resolution, or not at all after the bot's combat ends or dodge.
- **One check on your side.** When the bot ends the combat or dodges after the human declared a steal, the human should not gain the blood either. If anything in the client moves stolen blood for the human, it should follow the same rule. If the human moves it by hand, nothing to do.

**The bot steals from the human.**
- **Before:** the bot gained the card's full number even from a vampire holding 0 or 1 blood.
- **Now:** it takes at most what the human's vampire holds on the board. Against an empty vampire it keeps the steal card and strikes with its hands instead (1 damage the vampire cannot mend).
- **The line is unchanged:** `NAME strikes: steals 2 blood.` still carries the card's number, and the human moves what they have.
- **What the bot relies on:** it reads the human's blood counter from the board when it chooses its strike, so the counter needs to be current at that moment.

## 5. Still open from 9 Oct
- **The ▶:** please step every rung that is not `release-hold` (filter, not allow-list).
- **Two labels for `BOT_STEP_LABEL`:** `'resolve-phase': 'Close step'` and `'resolve-vote': 'Close poll'`.
- **The four silent pool changes:** still Johan's decision. Only the bot's own referendum swing can happen with today's decks.
