# HANDOFF to main — 29 Oct 2026, bot v0.6.213 (V5 wave 1: additional strikes, aggravated strikes)

Nothing to build: the bot ships first, backward compatible (the one rule). It now uses lines and tally fields your client already
defines, plus one new bot-to-bot line. Two asks for §12 / the canary, and one question. The protocol in full:
`bot/docs/specs/spec-v5-wave1-2026-10-29.md` §2.

## 1. What the bot now writes that your client reads
- **`NAME gets an additional strike.`** (your `CMB_LINE.extra`) when a bot plays Quickness, Pursuit [CEL] or Arms of Ahriman, one line
  per strike gained, with its side's **`xa` / `xb`** on the tally. A human's own `+ Additional` line is now RESOLVED by the bot (v0.6.169
  only kept that strike out of the next round): the human's next strike line that round is the additional one.
- **`NAME strikes for N aggravated damage.`** (your `CMB_LINE.agg`) for every aggravated strike of a bot (Claws of the Dead's hands,
  Sculpt the Flesh [pro], Ivory Bow, Sword of the Archangel, Invigorate [pro]'s hands), with **`ga` / `gb`** = N and its `a` / `b` = 0
  (the pair-1 convention of `cmbStrike`).
- **`sp`** when a bot drives an additional pair against a human (the bot writes `sp: 2` before the pair; it does not clear `sa` / `sb`),
  and its own side's **round totals** in `a` / `b` and `ga` / `gb` (pair 1 + pair 2, absolute values). **`pa` / `pb`** become the round's
  prevention total (a card, a burned Wall of Filth, an additional pair's card), not the last card's number.
- Against a human the bot asks **"Any additional strikes?"** only after its own declaration, and **"What is your additional strike?"**
  when the human declared — both inside the Strike step (no `ph` write). A human who clicks `+ Additional` during the **Damage** step
  keeps the bot from stepping past Damage: the additional pair is struck first, then the bot opens Damage again and steps to 5, so your
  client's automatic taken line counts every pair (`cmbSideDamage` reads the accumulated counters). Please confirm that reading of
  `sp > 1` (section 159m pins the bot's half).

## 2. Ask: §12 and the canary
- **New bot-emitted frozen line** (log tier, bot to bot, said only after the ACTING bot declared an additional strike and the
  answering bot takes none): `NAME combat — VAMPIRE does not take an additional strike.` — the fourth "nothing" line beside
  `does not maneuver.` / `has nothing before strikes.` / `does not press.`. Please add it to §12's bot-emitted block; a canary case
  can feed it through `_onLog` and check the `extra-strike` event (`none: true`).
- **Informational bot lines** (no parser on your side; listed so §12 is complete): `VAMP puts Wall of Filth [AT] in play (on itself):
  it can burn it to prevent N[ non-aggravated] damage in combat.` · `VAMP burns Wall of Filth: prevents N damage.` · `Villein: N blood
  → pool (pool P).` (the Blood Doll line's shape) · `VAMP’s hand strikes are aggravated this action — Invigorate [pro].` / `VAMP gets
  +1 strength this action — Invigorate [ani].` (deliberately not a `plays` line) · Rutor's Hand rides `L12.uTabling` (`VAMP plays
  Rutor's Hand — puts it in play.`) and its unlock `VAMP unlocks — Rutor's Hand (it locks the card).` (Freak Drive's shape).
- Still owed from earlier rounds: the lines in `HANDOFF-to-main-2026-10-20-docs-diet.md` ("Owed to §12").

## 3. Question
Between two bots the protocol makes no new line or wait in a round where nobody holds an additional-strike card (RULINGS D-99): the
acting bot declares before its round line, the answering bot reads it there or, holding no card, in its press-step wait. A human
watching a bot duel sees `gets an additional strike.` at most once a round per side. Is anything in the client's watched-duel view
(the combat panel of a seated human who is not fighting) keyed on `sp` or `xa` / `xb` in a way that would mislead them? We found
nothing, but you own the panel.
