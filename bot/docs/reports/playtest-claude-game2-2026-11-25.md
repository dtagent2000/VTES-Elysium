# Claude's playtest, game 2 — 25 Nov 2026: Nosferatu, the resolution panel and the bot control

Same rig and bytes as game 1 (`playtest-claude-game1-2026-11-25.md`, whose numbers are used below): bot v0.6.240, client
v2.6.188, Turn-based, `--offline` (text cards). Claude played the Nosferatu starter in seat 1 against Viktor (Ventrue), Isolde
(Toreador) and Henrik (Tremere), all Expert. The game ran 55 min and was stopped in round 8. By then Viktor had ousted Isolde with
bleeds that Claude bounced his way and a lethal Conditioning plus Daring the Dawn; Claude was on pool 6 and Henrik on pool 5. The
rig logged 0 page errors and 0 closed sockets. Times are seconds since the rig started. Screenshots are in the session (`/tmp/pt-g2/*.png`).

## The proposals, tested where the bugs came back
| # | Game 2 | What the proposal would have changed |
|---|---|---|
| 1 Stall | 3206.0: Viktor's Kine; Henrik (a bot) blocks and Claude is also eligible; Claude passes at 3230.9 and the table stops ("block verdict (Henrik)"). The hub's row button "▶ Close window" ended it at 85.5 s; without it the 4-minute net (about 3451) would have. | With "Turn-based: an undirected contested ask ends once every human eligible has passed", it would have closed at 3230.9 with the same verdict (1 vs 1, blocked) that the button produced 52 s later. Confirmed. |
| 2 Stale timer | 884.2 = 644.2 + 240 s exactly. This time it came from the **successful** branch: Claude's Pass ended The Dowager's block (block succeeds), and the timer had last restarted when Claude set the counter at 644.2. It closed Henrik's block question on Trevon's bleed 70 s after it opened ("going on as if nobody blocks"), costing 3 pool. The next, identical bleed was blocked with Guard Dogs. | With `_askTimeout` clearing its timer on both branches, or a timer that may only time out its own ask, the question would have waited. Confirmed. This settles game 1's "unsure": both branches leak. |
| 3 Answer before question | 2601.4 Horst's Conditioning add line → 2601.7 Isolde "Pass" → 2603.2 Viktor's "Any reaction?" | The D-137 floor wait before `_playBleedModifier` puts the question first. Confirmed. |
| 4 "Still thinking…" | Three times, and not only for votes: 716.3 and 1488.3 (combat waits on Claude), 1786.6 (votes). | Refined: stand down whenever the bot's panel state is "asking", instead of listing `_ask` and `_refCall`. |
| 6 Votes | Claude cast 7 votes against, but the counter showed 8 for vs 2 against until Claude's Pass; then it was 8 vs 9 (screenshot `g2-panel-vote-mine`). | Confirmed. |
| 7 Last-word votes | 482.9 Claude passes → Viktor discards Deflection for +1 → closed 2.1 s later, 4 to 3, while Claude held Protected District (+3 against). This time it changed the outcome: +3 pool to Claude's prey. | With "a late vote reopens the poll to the humans", Claude's +3 would have made it 4 to 6, so it fails. Confirmed. |
| 5 No reaction after "No block" | Not testable: the Nosferatu deck has no bounce. The ring's own note on "No block" promises "the bot may still pump and ask for reactions", which the bot does not do. | — |

## New findings
Bot side:
- **Mirror Walk [THA] is modeled as +1 stealth only** (cardfx `src: auto`). "If this action is blocked, lock the blocking minion and
  end the action before block resolution" is missing, so Henrik's Rosalina (b3) and Trevon went into combat against Claude's
  blockers instead of ending the action (625.4, 1362.7, 2046.7). The card is in the Tremere starter: a base-deck card with no
  curated entry.
- A human's environmental combat damage is not applied: Carrion Crows' 2R (1474.3, 2817) is ignored; the bot narrates the strike
  alone and ignores a later change on the counter.
- A human's Pass at the strike step counts as no strike (0 damage); the rules make a hand strike the default.
- After a human plays a combat card in a step, the bot moves to the next step, so the human's next Pass answers one step later.
  Claude's strike step became a Pass (2797.6 → 2816.8).
- "(G6)" still shows in a Ventrue bot's chat and narration: "Alice Chen (G6) blocks (stealth 0 vs intercept 0)", "Uptown Hunting
  Ground: Alice Chen (G6) gains 1 blood", the combat lines and the rise FX. "I add 1 votes for." uses the plural.
- Good play: Viktor bounced Claude's bleeds twice onto his own prey Isolde, then ousted her with an unblockable Conditioning
  (Daring the Dawn). Alexa used Second Tradition: Domain to block with +2. Henrik stacked Bonding and Mirror Walk as stealth.

Client side (main):
- The Block action locks the human's blocker at the attempt; by the rules a blocker locks only once the block succeeds.
- The Played shelf never shows a bot's modifier, reaction or intercept card that goes straight to the ash heap (Mirror Walk,
  Telepathic Misdirection, Conditioning). Yet it kept another seat's master from an earlier phase (Arcane Library, shown while Trevon's
  Govern the Unaligned was being resolved).

## The resolution panel: why it feels messy (the owner found it messy)
1. **It shows numbers but not the situation.** "STEALTH 1 vs 0 INTERCEPT" or "FOR 3 vs 2 AGAINST" appears without the action it
   belongs to (who, which card, against whom, a referendum's terms) and without whose answer is awaited. The human assembles that
   from the chat log (the bot's question), the hub (badge and rows) and the board. Only combat shows the situation, with the duel
   cards, the step bar and the range, and combat felt clearest.
2. **Two things share one box, and the shelf misleads.** "Played this phase" sits above the resolver, but bots' ash-bound cards
   never appear and stale cards linger, so it does not tell the story of the current action.
3. **The answers are elsewhere.** The panel has one generic PASS, while the bots' questions expect No block, No reaction, Pass, No
   or It resolves. Votes are cast from each vampire's right-click menu, strikes from its Combat menu, and a block is Actions > Block
   plus "Block!". The panel offers none of these for the current step.
4. **Shared, manual counters.** Anyone can press −/+, RESOLVE or × even when a bot is the referee. A printed bonus (The Dowager's +1
   intercept), a cast vote (until Pass) and a late change (Carrion Crows) are not counted.

**Proposal (main's side; a handoff after the owner's go-ahead):**
- A. **The action, always in one line** at the top: "Trevon Parker (Henrik) bleeds you for 3 · Govern the Unaligned [dom] ·
  stealth 0", or "Parity Shift (Viktor): Viktor +3, Isolde −3". The data is already on the frozen L12 lines the client parses.
- B. **"Waiting for: you"** with only the answers that are valid right now as buttons:
  - block step: Block with ▾ (my eligible minions, plus a hint when a wake or unlock card in hand would make one eligible) / No
    block / Hold on;
  - after blocks are declined: Bounce ▾ / Reduce ▾ / No reaction;
  - my contested block: +intercept / Pass;
  - my own action: +stealth / +bleed / It resolves;
  - vote: Cast votes ▾ (my titled vampires, the Edge and vote cards) / Done voting, with who has voted and who is still to vote;
  - combat: Strike ▾ (hand strike by default) / Nothing, with the step marked "your move".
  A bot waiting on a bot shows "Viktor waits for Henrik" with the hub's Close window button right there.
- C. **An action timeline** instead of the shelf: every card played in the action, by every seat and in order, including the
  ash-bound ones, with the counter change each caused.
- D. **A bot referee owns RESOLVE and ×.** The human gets their own "+1 intercept" or "+1 stealth" for their side, not the whole
  counter.
- E. **Count automatically what is safe** (titled votes, the Edge), and prompt for the rest ("The Warrens: +3?").

## The bot control (hub, ring, rim ▶)
What works: the badge with ▶ on the robot ("a bot waits on you"), the rows with each bot's wait ("block verdict (Henrik)"), and the
row's Step button. "Close window" ended the stall at once (3283), so the escape hatch exists. The tempo choice is explained in plain
words. Hold on works. The ring at the pointer is fast, and its gold segments mark the answers that make sense now.

What does not:
1. **The rim ▶ does not cover a bot waiting on a bot.** In game 1 it answered "No bot is waiting on you" during the stall; only the
   row button in the open hub helped. Let ▶ close a bot-on-bot window that holds the table, or let the badge say who waits on whom.
2. Three identical "Claude's turn" rows when nothing waits; collapse them into one line.
3. In Turn-based the "Wait time 3 s" slider is shown but does nothing; hide it there.
4. The ring is icons only, and six of its answers mean some kind of no (Yes, No, Pass, It resolves, No block, No reaction); the
   labels appear only on hover. Show only the valid answers, with their labels, or move them into the panel (B) so that there is one
   place to answer. Today a human looks in three places: the chat on the left, the panel at the top and the hub on the right.

## Unsure
- B is a design direction, not a specification. It needs the owner's view on how much the panel may own before main builds anything.
- The combat step advance after a human's card: I am not sure whether it is the bot or the client that moves the step.
- One game per seat: Malkavian was not seen from a bot's chair in game 2.
