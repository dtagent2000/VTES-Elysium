# Claude's playtest, game 1 — 25 Nov 2026 (bot v0.6.240, client v2.6.188, Turn-based)

Main's rig (`client/playtest/`), Claude as the human in seat 1 (Ventrue starter) against three Expert bots: Mara (Malkavian),
Tobias (Toreador), Nadja (Tremere). Turn-based, reflex off, PR #108's bytes. 66 min, 9 rounds. Mara was ousted by Tobias's bleed,
bounced onto her by Claude's Deflection, so the bounty went to Claude. Nadja was ousted by Tobias's Kine Resources Contested and
Claude by Tobias's Aire of Elation. Tobias ended on 2 VP, Claude on 1. The rig logged 0 page errors and 0 closed sockets; its 1,460
failed resource loads are card images the sandbox cannot fetch. Times are seconds since the rig started (`feed.txt`). No code was
changed; the causes below were read in `bot/elysium-bot.js`.

## A. Bugs (cause found)
1. **Turn-based stall on an undirected, contested block (reproduced twice).** Tobias called Kine at Nadja (his prey) and Claude
   (his predator). Nadja blocked, and Claude passed after 18 s. The table then stood still until "no answer in 4 min — resolving the
   block from the counter": 2363.0 → 2611.5, and again 3427.6 → 3667.8. Cause: the undirected branch of the ask's say handler
   (around l.11709) closes a contested ask only when every eligible seat has passed. The bot blocker never passes during its own
   contest, and Turn-based has no short clock, so only the 4-minute safety net ends it. The directed branch already ends on the
   human's Pass (v0.6.194).
2. **A stale 4-minute timer times out a later ask.** `_askTimeout`'s contested branch drops `a.timer` without clearing it on a
   failed block (`a.timer = null`) and returns with the timer armed on a successful one. That is harmless when the timer itself
   called it. But v0.6.194's Turn-based shortcut calls it directly on the human's Pass (l.11712, l.11722), so the safety net outlives
   its ask and fires on whatever ask is open then (`_askTimeout` re-reads `this._ask`). Evidence: the verdict ask opened at 2954.4
   (Claude's woken Chelsea blocked Mkhokheli's hunt; Claude passed and the block failed, 1 vs 0). Then at 3194.3, which is
   2954.4 + 240 s, came "no answer in 4 min — going on as if nobody blocks". That landed in the Consanguineous Boon block ask
   opened at 3183.3, 3 s after it had asked Claude.
3. **The answer comes before the question after a bleed modifier (a gap in D-137, PR #108).** Between bots, the target answers the
   add line before the actor's "Any reaction?" shows: 2191.8 add line → 2192.1 Tobias "Pass" → 2193.6 Mara's question. The same
   happened at 2209.9/2210.2/2211.7 and 2228.6/2228.9/2230.4. D-137 put the floor wait before the line for the bleed total, Spying
   Mission and Haqim's Law. The generic modifier path (`_playBleedModifier`, then `_askBlock`) did not get it.
4. **"⌛ Still thinking…" while the bot waits for the human's votes** (1641.7, 1671.7, 3113.5). The turn watchdog stands down for
   `this._ask` and a hold, but a referendum's polls are `this._refCall`, so the bot says it is thinking while it waits for Claude.

## B. Ruling questions (by design today, but they felt wrong at the table)
5. **A human target cannot bounce after "No block".** When the actor has no modifier, the bot resolves about 1.5 s after "No
   block", with no "Any reaction?" (894.9, 2723.2, 3294.4). Deflection is only usable after blocks are declined, and the announce
   prompt only says `Block? — say "block" or "no"`, so the bounce at 2723 was lost. This is by design (knob `askHumansTotal` is off:
   "a human target was already asked at the announce"). The reason given is a cost of askSecs on every bleed, and Turn-based has no
   such clock. Proposal: turn on `askHumansTotal` in Turn-based, or say "or bounce now" in the block prompt.
6. **Voting as a human.** The polls open with no chat question. After "Alexa Draper casts 4 votes against." the poll still waited
   for an explicit Pass, and nothing says so; together with #4 it looks as if the bot is busy.
7. **The caller's last-word votes close the poll at once.** Tobias played Perfect Paragon (+3 votes) after Claude's Pass and closed
   the poll 2 s later (3757.5 → 3759.6, 8 to 7, ousting Nadja). The rulebook's polling ends only "when all Methuselahs are finished
   casting votes"; nobody got to answer the +3. In this game no one had a vote left to add.
8. **Timings of the floor and the verdict (D-137, O-36).** The first bot answer came 9–10 s after a long question (712.6 → 721.9,
   1545.8 → 1555.5). Verdicts between bots were silent for about 14 s (797.6 → 811.8, 1697.5 → 1711.5). A vote bubble came after
   the result (839.2 → 850.0).
9. **Combat as the human in Turn-based**: five questions one at a time (before range, maneuvers, before strikes, strike, before
   ending), about 11 s each through the rig, even with nothing to play. Adaptive skips such steps; Turn-based does not.
10. **Block questions to a human with no unlocked minion** (Turn-based; Adaptive skips them).

## C. Bot play
11. Mara played Life in the City on turn 1 with no ready vampire (61.8). The card was lost for nothing.
12. Nadja's Ayelech played On the Qui Vive (2296.1) after Eyes of Argus [AUS] had already woken her for the same action (2266.4).
    The card was wasted.
13. Nadja spent herself down to pool 1 in the master phase while her predator was active: Vessel and Pentex™ Subversion took her
    from 4 to 1 (2686–2690), and a second Vessel took her from 2 to 1 (3245). She was ousted two turns later.
14. Good play: Tobias's Toreador Grand Ball for unblockable politics; his Change of Target (the blocker stays unlocked, correct per
    the KRCG ruling); Majesty [PRE] to unlock and act again; Kine allocations that spared his own predator. His Perfect Paragon
    icpVs was read correctly against a younger blocker, and his lethal Aire of Elation was found. Nadja put Pentex™ on Claude's only
    unlocked blocker before bleeding and used Eyes of Argus with Telepathic Misdirection. Bounce chains, the Edge, ousts and
    bounties (1 VP and 6 pool to the right seat) and Claude's votes (Alexa's discard plus the Edge) all counted correctly.

## D. Wording and order
15. "Block?" in the chat for an action that cannot be blocked (Toreador Grand Ball, 1602.5 → 1603.5).
16. The bleed-total line "X adds +0 bleed (= N)." reads like a card play (by design, v0.6.144).
17. An effect is logged before "It resolves": Tobias burns the Grand Ball (1768.1) before Nadja's "It resolves" (1769.2), and Mara's
    oust (2349.2) is logged before the bleed line (2349.4).
18. After Claude's strike: combat ends, the blocker never names its own strike (the rules let it choose one; no effect here).

## E. Main's side (handoff candidates)
19. Game end: there is no VP for the last Methuselah standing and no winner line (Tobias stays on 2 VP after the last oust).
20. A human at pool 0 is not ousted until they choose "Ousted…"; meanwhile the bot's "(adjust yours)" turn plays on.
21. Rig: `play --on` cannot target an opponent's minion (`ctrlOnline` worked). The level chooser defaults to Superior (use
    `--alt Inferior`), and Visit from the Capuchin's hand size must be set by hand.
22. A human's +bleed card counts only with the "+X bleed…" menu (the protocol). Idea: prompt for it after a known modifier card.

## Unsure
- #7 rests on my reading of the polling rule (the "15 seconds after the last vote" custom); the KRCG rules tool shows no ruling on a
  caller's late vote card.
- #2: I traced only the failed-block branch end to end; the successful branch leaks the same way by reading, but I did not see it
  fire in this game.
- One game, one human seat: the Nosferatu and the Ventrue starters were not seen from the bots' chairs.
