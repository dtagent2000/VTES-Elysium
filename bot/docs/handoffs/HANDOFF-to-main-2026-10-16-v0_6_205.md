# Handoff to main — bot v0.6.205: R4 of the play-test review with the dodge — Revelations against a bot, the six V5 masters, Haven Uncovered (16 Oct 2026)

**From:** Elysium Bots. **To:** main (client v2.6.162, srv-2.6.46). **Follows:** `HANDOFF-to-main-2026-10-16-v0_6_204.md`. **Answers:** your play-test reply `REPLY-to-bot-2026-10-14-playtest.md`, findings F21 and F23, as planned in `bot/docs/reviews/REVIEW-playtest-2026-10-14.md` (R4, the review's last round); and your `REPLY-to-bot-2026-10-16-v0.6.204.md` (§4).

## 0. In short
- **v0.6.205 is R4 of our play-test review, with Johan's dodge rule baked in** (one PR, Johan 16 Oct).
- **No new wire verb.** Two new frozen log lines, both for Haven Uncovered (§2). Every other new line is an explanation on the log tier, or one instruction to a human in chat.
- **Revelations against a bot now works for a human** (F21). It reads the targeting line your client already sends since v2.6.159 — nothing to build.
- **Nothing of yours goes red that we know of:** your suite beside this release is in the gates below.
- **Your reply to v0.6.204 is consumed:** the read-only copies in `bot/` are client v2.6.162's (the canary 69/0 against them), and your two guide findings are fixed (§5). Your finding 1, the chat beat after a question, is a design question for our next round (§4).
- **Please re-embed `START-HERE-BOTS.html`** (§5).

## 1. What changed for you in v0.6.205
- **The dodge (Johan, 16 Oct).** A bot dodges a strike of 2 or more that would do more to its vampire (damage + steal) than its own strike would do this round. It dodges an equal strike only when it holds two dodges. It always dodges aggravated damage or a strike that would empty or torpor its vampire, as before. When the bot strikes first it reads your expected strike (the number its Majesty already uses).
  - The yardstick is the strike the bot would really play this round: its strike card or weapon, a steal, or its hand (1 + strength; 0 at long range).
  - Between bots nothing changes in the handshake: the answering bot already knows the acting bot's strike when it chooses (v0.6.203).
  - Against a human the bot reads your announced strike when you strike first (the combat steps ask the acting minion first), and your expected strike when it strikes first — the same rule as its Majesty.
- **Revelations against a bot (F21).** The bot armed Revelations only on `Revelations [aus]. Target: <bot>'s pool.`. A vampire aim, no aim, or a bare `plays Revelations.` (no mode chooser) armed nothing, and after the reveal your pick was dropped.
  - Now it arms whenever the actor's prey is that bot, whatever the line's Target suffix says (the card says "your prey"). A bare play line is read as [aus].
  - After it reveals its hand to a human actor, the bot says how to pick (§2) and reads the pick from your client's private line `⋖ NAME targets CARD (revealed to you — they are targeting it).` or from a typed `discard CARD`. Only that actor's pick counts, once, until the turn ends. The card goes to the ash heap and the bot draws.
  - This is not a wait: no clock, no rung. The human's own action goes on, and the table never stands on the pick.
  - At superior ([AUS]) nothing changes: the bot plays with an open hand.
- **The six uncurated V5 masters (F23).** All of them are hand-curated now; the guide's "four masters do nothing" paragraph is gone.
  - **Elder Library, Ventrue Headquarters:** as before (they already worked). Ventrue Headquarters locks for votes in the bot's own referendums only.
  - **The Labyrinth:** the bot locks it for +1 stealth to a Nosferatu, like a stealth card: `Ryan (G6) locks The Labyrinth: +1 stealth.` It unlocks at the bot's unlock phase.
  - **Guardian Angel:** goes on the bot's sturdiest ready vampire. That vampire gets +1 intercept when it blocks a bleed at the bot, and prevents 1 damage once each combat (a log line, §2). The card burns when its vampire goes to torpor (a log line).
  - **Wasserschloss Anif:** in its master phase, a ready Tremere that can spare it moves 1 blood to the card; in its influence phase the bot locks the card and moves every counter to an uncontrolled Tremere (log lines, §2). It banks only while an uncontrolled Tremere can take the counters.
  - **Haven Uncovered:** the bot plays it only on an opponent's vampire that one of its ready vampires would rush that turn through it — the rush must be the action that vampire would choose (Johan's decision 5 of 16 Oct: not played until the bot can rush through it). After that any minion may enter combat with that vampire as a +1 stealth directed action; the bot's own minions do it with a frozen line (§2). The host does not lock, and the rushing vampire is the acting minion.
- **Found on the way:** Arcane Library's lock in the influence phase never fired in play (only a unit test called it), and a vampire already at capacity in the uncontrolled region (superior Govern can fill one exactly) never rose. Both fixed; the second shows in the influence sentence (§2).

## 2. For §12
- **New frozen lines** (log tier, bot-emitted; every bot reads them):
  - `NAME plays Haven Uncovered — on OWNER's VAMPIRE.` — `L12.havenM`: m[1] the Methuselah who placed it, m[2] the host's owner, m[3] the host. Every bot records the host.
  - `VAMPIRE enters combat with OWNER's HOST (Haven Uncovered).` — `L12.havenRush`: m[1] the rusher, m[2] the host's owner, m[3] the host. The owner's bot opens its block window (any unlocked minion may block, as for Deep Song); on its Pass the host fights without locking.
  - The rushing bot then asks the usual `… enters combat with HOST (Haven Uncovered, +1 stealth). Block?`; a human owner answers with the usual block flow.
- **The stealth line gets a third verb:** `NAME plays|burns|locks CARD: +N stealth.` (`locks` for The Labyrinth). Our tally net reads all three; your rig may want `locks` if it reads stealth lines.
- **New explanation lines on the log tier** (no reader needed):
  - `VAMPIRE prevents 1 damage (Guardian Angel, once this combat).`
  - `Guardian Angel burns — VAMPIRE is in torpor.`
  - `VAMPIRE moves 1 blood to Wasserschloss Anif, Austria (N on it).`
  - `NAME locks Wasserschloss Anif, Austria to move N blood to an uncontrolled vampire.` (the target is never named: superior Govern's convention for a face-down card)
  - `VAMPIRE defends (rushed by RUSHER, Haven Uncovered).` and `Combat begins: RUSHER against HOST (Haven Uncovered).`
- **One new chat line, an instruction to a human** (speech tier; no clock):
  - `NAME (bot): HUMAN, pick the card I discard (Revelations): ⌖ target it in the hand I revealed to you, or type "discard CARD".`
- **The influence sentence** can end `…, and NAME enters play at capacity.` (a vampire that rises for free).

## 3. Your suite, your rig and `client/playtest/PLAYTEST.md`
- **Your suite:** see the gates below.
- **The rig:** if it classifies bot lines, the two frozen Haven lines and the `locks` stealth verb are new (§2). The Revelations instruction is not a question with a clock; it should not count as a wait.
- **PLAYTEST.md:** if it says Revelations does nothing against a bot, that is no longer true. A human's Revelations at a bot that is their prey: inferior → the bot reveals its hand to the actor and the actor picks with ⌖ Target or `discard CARD`; superior → an open hand, as before.

## 4. Known, not built
- **A human's Haven Uncovered is not read by the bots** (your client's play line is the generic one). A human's rush through a Haven on a bot's vampire goes by `rush` in chat, like a rush card, and the bot then locks its vampire — a Haven rush locks nobody; the guide says to unlock it by hand.
- Ventrue Headquarters is not used as a voter in another Methuselah's referendum.
- The host's own action to burn Haven Uncovered, and Wasserschloss Anif's burn action, are not built.
- Guardian Angel's prevention covers normal damage only (as the equipment prevent does); an all-aggravated strike is not prevented by it.
- Older, unchanged: a human's bounce of a bot's bleed is not read by the acting bot (handoff v0.6.203, §3).
- **Your finding 1 (REPLY v0.6.204, §4.1), not built here:** after a question, everything the bot sends waits the chat beat (~4.96 s at the client's pace), the verdict line and the booking of a typed stealth included. Your idea (status lines skip the chat beat, or the next wait shows only once the verdict is on the wire) is a design question; it goes to Johan with our proposal in the next round.

## 5. The bundle
- Changed and copied to the root in this PR: `elysium-bot.js` (v0.6.205), `elysium-cardfx.json` / `.js` (curated 99 → 105: the six masters) and `START-HERE-BOTS.html`. The twd files are byte-identical.
- **START-HERE-BOTS.html — please re-embed** (`embed-help.js bots`). Your v2.6.162 embeds v0.6.204's guide. This release adds:
  - your two findings (REPLY v0.6.204, §4.2): the nav chip and the footer now say bot v0.6.205 · client v2.6.162, and the Controls list names the rung **▶ Declare verdict**;
  - the curated masters (the "four masters do nothing" paragraph is replaced);
  - Haven Uncovered and Guardian Angel in the master phase;
  - the dodge rule in Combat;
  - "Revelations against a bot" and "Haven Uncovered on your vampire" under "Where its understanding ends";
  - the version and the curated count.
- **Deploy:** purge `/elysium-bot.js`, `/elysium-cardfx.json` and `/elysium-cardfx.js`, and re-embed the guide at your next client release.

## Gates (v0.6.205, from `bot/`)
GATES_PLACEHOLDER
