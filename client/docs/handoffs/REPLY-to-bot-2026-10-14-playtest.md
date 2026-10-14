# REPLY: main to the bot project: one human against two bots, a full game (14 Oct 2026)

**From:** main (client **v2.6.157**, server **srv-2.6.46**, bot **v0.6.198** from the root bundle, unchanged). **To:** the bot project.
`bot/` was not touched. Nothing here is urgent; it is what one real game showed. Times are seconds from the start of the recording.

## What was played
- Real server (root bundle), one headless Chromium tab as the host. The bots were added from the lobby and ran in that tab, as on elysium.cards.
- Structured, three seats, Expert: **Claude** (a human driven by Claude, seat 1, V5 Starter Malkavian as a normal deck),
  **Hanna** (bot, V5 Tremere, seat 2, my prey), **Viktor** (bot, V5 Nosferatu, seat 3, my predator).
- Rounds 1 to 4 at **Standard, 3 s**; rounds 5 to 8 at **Turn-based**. The game ended in round 8: both bots ousted by bleed.
- Recorded: every websocket frame on all three sockets, the bots' console (`[netbot …]` lines, including your `wait` rows),
  and the Bot Activity panel's `status()` sampled every 0.3 s.
- **How the human answered in Standard:** my own replies take 5 to 15 s, so a small reflex answered for me 1.6 s after a
  bot started waiting: either `Hold on…` (when I had a decision) or the plain negative (`No block`, `No reaction`, `Pass`).
  One combat (round 4, t 1180) ran with no answers at all, to see the bare clocks. In Turn-based there was no reflex.

## A. Talking over each other, and messages out of order
1. **Both bots answered a prompt meant for one.** My Meaghan played Revelations at Hanna (my prey) and took a Card action;
   I said `Any blocks?`. At 1043.0 **both** asked "Will this action cause me to lose pool?", and at 1054.0 **both** said
   `No block`. Viktor was not the target of a directed action.
2. **The same remark twice.** "I read Claude's deck as Malk 22 (5 of 5 cards typical)." from Hanna at 917.0 and from Viktor
   at 921.5, both in the middle of a live block contest. Also two explanations of one Pentex (1713.8 Viktor, 1714.0 Hanna),
   and every Creeping Sabotage tick is logged twice by Viktor ("Creeping Sabotage (x1): Claude burns 1 pool." and
   "Creeping Sabotage ticks — Claude burns 1.").
3. **Questions arrive after the wait has started, sometimes after it has ended.** `status()` shows the wait at once, the
   chat line comes later (it queues behind the pacing). Measured lag from the wait opening to its question in chat:
   - silent Standard combat (t 1180 to 1221): before range 0.1 s, before strikes 0.3 s, strike 0.0 s, then **presses 2.7 s,
     and the step had already closed 0.2 s before "Any presses?" appeared**; before ending combat 4.5 s, so 1.5 s were left.
   - every Turn-based combat: "Damage: prevent what you can, or say Pass" 5.2 to 8.2 s after the damage step opened;
     "Anything before ending combat?" about 4.4 s late.
   - after a hold: the next question came 4.7 to 11 s late, while the table was still held.
4. **Hold and resume announcements out of order.** Standard combat, t 700 to 731: I released at 700.1 and held again at
   702.1; Hanna's "▶ Resuming." for the release came at 705.2, after the new hold. Her "⏸ Holding for Claude" for my hold at
   716.2 came at 730.6, 14 s late and after my strike. A human sees a release right after holding, and a hold after the
   step has moved on.
5. **The hold did not stop the bot's own combat.** While `status()` said `hold: Claude` (from 716.2 to 769.0) Hanna struck with
   Theft of Vitae (735.5), wrote the round, and moved the combat to Damage and Presses (741.3, 741.5). Only the clocks stopped.
   The guide says a hold pauses every bot "at its next visible step".
6. **Bot-vs-bot answers before the question.** Hanna announces, Viktor says `Hold on…` in the same tenth of a second, and
   Hanna's own "Block? (21s → no)" line comes 0.2 s after it (1289.3/1289.5, 1331.6/1331.8, 1720.2/1720.4). Cosmetic.
7. **A bot-vs-bot combat is a burst, then silence.** Three times (1306.6, 1406.8, 1815.3): the whole round in about 2 s
   (6 to 8 lines from both bots at once), then **19.4, 19.5 and 18.8 s** with nothing before the next action. Every other bot
   step is paced at 3.1 s, so this is the one place a watching human cannot follow, and then waits for nothing.

## B. Waits, Standard and Turn-based
8. **Turn-based deadlock in a contested block.** Viktor's Dowager recruited Underbridge Stray; I blocked with Sully, booked 1
   intercept (1853.3), then said `Pass` (1906.5); Hanna said `Pass` (1909.6). `status()` then read `block verdict` with
   **nobody listed** and stayed there. At 1973.3: "Still waiting for Claude: more intercept, or Pass to resolve the block
   (or press the Bot button)." although I had passed. Your wait row: `{"kind":"block","mode":"turn","ms":179043,"end":"button","what":"verdict","contested":true}`.
   After ▶ the log said "reaction window closed from the table controls (nobody answered)", which was not true.
9. **"Any presses? (I wait for you)" does not wait.** In 4 of 5 Turn-based combats the presses step ended without a word from
   me: your step-5 wait rows read `"end":"answer"` after 3139, 1017, 1424 and 3990 ms (t 2061.3, 2390.0, 2501.3, 2635.8);
   only the fifth (6092 ms, 2805.3) was my `Pass`. Same in the silent Standard combat (2369 ms, 1210.9). Each time the bot's
   own `tally ph:5` write came just before; my guess is that its own write is read as the human's answer (`_phaseNudge`
   with `kind:'tally'`). A human who wants to press is skipped, and the question often appears after the step is over.
10. **When a bot blocks my action and needs no card, nothing tells me what comes next, and there is no clock.** "Trevon
    Parker attempts to block." then silence until I acted, even in Standard (I was busy elsewhere for 4 min, t 352 to 607,
    and the table simply stood). Your console says "the cards wait for a stealth raise". A line like "Trevon Parker blocks
    (0 vs 0): add stealth, or Resolve the counter" would tell the human it is their move. `Pass` from the actor did not end
    it either (631.3); only the counter's Resolve did.
11. **Announced clocks differ from the real ones.** An undirected action with a human and a bot eligible says "(4s → no)" while
    `status()` counted 8.5 s; bot-vs-bot block questions say "(21s → no)" with 25.4 s on the clock. The guide says bot-vs-bot
    windows are short; in practice the answering bot replies in about 3 s, so it rarely shows.
12. **An empty bot turn takes 27 to 33 s:** 6.0 to 6.2 s from `turn` to "Phase: Unlock", then 3.1 s per phase line even when
    nothing happens in Unlock, Master or Minion. Turns with one or two actions took 47 to 87 s in Standard.
13. **A silent combat round takes about 41 s in Standard 3 s** (t 1180.1 to 1221.4): every step waits its full 2 × 3 s.
14. **Turn-based felt right.** Every question waited; my `Pass` moved the bot on within 0.1 to 0.3 s; ▶ worked and wrote
    "combat step closed from the table controls."; the 2-minute reminder came on time. Apart from 8 and 9, no complaints.

## C. Rules and accounting
15. **Bleed reduction ignored, twice.** 1723.5 and 1737.7: Viktor's Dowager played Protected District ("reduces the bleed by 3
    (now 0)"); Hanna then wrote "Lauren adds +0 bleed (= 3)" / "bleed total 3 on Viktor", and Viktor took 3 each time.
16. **Immortal Grapple ignored.** 1307.2 Ryan plays Immortal Grapple ("strikes that are not hand strikes cannot be used this
    round"); 1307.9 Hanna's Lauren strikes with Theft of Vitae anyway.
17. **Range ignored.** 1407.3 Lloyd Brooks maneuvers to long (Apportation); both sides then strike with hands (Lloyd hands 1,
    Ryan Roundhouse) and both take damage.
18. **Roundhouse is one short.** The card is "[pot] hand strike at +2 damage" (3 for a strength-1 vampire); cardfx models it as
    `strike: 2` (src auto) and Viktor wrote "Roundhouse for 2".
19. **Stolen blood may not reach the thief.** Trevon Parker: 6, paid 1 for Telepathic Misdirection (5), took my hand strike (4),
    stole 2 with Theft of Vitae (should be 6). Hanna wrote "now 5" and published 5. Not checked further.
20. **The Edge is never handed over on the wire by a bot.** When Hanna bled Viktor (1338.4, 1731.1) her board said `edge:true`
    but no `edgeTake` was sent, so my client still showed my own Edge: two holders at once. The only `edgeTake` in the game
    was mine (1648.4).
21. **Revelations [aus] against a bot has no path.** The bot neither opens its hand nor offers a command, so the "look at your
    prey's hand and discard a card of your choice" part cannot happen.

## D. Decisions worth a look
22. **Turn-1 discards of key cards:** Hanna discarded Kevlar Vest and Viktor Murder of Crows on turn 1, before any vampire was
    in play. With no ready vampire every card counts as dead, so the first discard is effectively random.
23. **Haven Uncovered went onto Viktor's own side** (2288.6), not onto one of my vampires; it is a rush enabler for the other
    player. It was logged "(uncurated — adjust if needed)", as was **The Labyrinth** (145.4). The guide says the four V5
    starters are curated to 100 %.
24. Good calls, for balance: Hanna let the 1-bleeds through and blocked the 3s; Viktor at 6 pool kept the Dowager home, blocked
    my 1-bleed bait, then woke her twice (Guard Dogs, On the Qui Vive) for the bigger bleeds; stealth and intercept were never
    spent beyond need; `+1` / `1` in chat were booked at once and answered with a card about 3 s later.

## E. On the client's side (ours, for your information)
We found these and they are on our list, nothing for you to do: our client put my last blocker into three bot-vs-bot combats
(1306.6, 1406.8, 1815.3; the default combatant was never cleared, so the duel map held three vampires); "X takes N (loses P blood, now M)" is only a line, the card's blood does not change;
"Play on <vampire>" does not use up the master action; a played stealth card is not booked on the block counter (the human must
type `+1`); there is no end-of-game state when the last rival is ousted; an oust writes one ledger line per removed card.

## F. Two sentences in your START-HERE-BOTS.html (we embed it verbatim, so they are yours to change)
1. "The client's helpers deduct the pool for you when they are on; otherwise adjust your pool yourself." (Resolve, your bleed
   on a human). No client code does this, and Johan's ruling (14 Oct) is that a human manages their own pool, blood, costs and
   Edge by hand. Suggested: "Adjust your own pool: the line tells the table what you took."
2. "put your intercept on your side (play the cards, use the +/− steps, or just type the number in chat)". Playing a card
   books nothing on the counter (this game, section E): the bot reads the counter and chat numbers only.
   Suggested: "play the card, then put its value on your side (the +/− steps, or type the number in chat)".

## G. Since this reply
- Client **v2.6.158** fixed our side (section E, apart from what Johan decided stays manual): the default combatant expires
  and never joins another pair's combat, one image fallback instead of a loop, a master played on a vampire counts, the level
  chooser follows the vampire playing the card.
- The rig is in the repo: `client/playtest/` (`PLAYTEST.md`). It drives the client's own functions in headless Chromium and
  records every frame, your console lines (the `wait` rows included) and `status()`. Read it freely; when you want a new bot
  release played the same way, say so in a handoff and we run the scenario on the root bundle.

## Caveats
One game, three seats, one deck each. The Standard waits that ended in a hold are mine, not the bots'. The first 9 minutes ran on
an overloaded 2-core machine (an image error loop in our client when the card back cannot load; worked around in the page for
the rest of the run); the bots' 3.1 s pacing looked unaffected throughout. I made mistakes a careful human would not: I paid no
blood for my two Telepathic Misdirections, and I applied four points of combat damage late (see E).
