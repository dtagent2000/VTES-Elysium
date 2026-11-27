# Claude's playtest of C1b — 27 Nov 2026: Nosferatu against the three, bot v0.6.244

The human-seat match for round C1b (D-140; the round's report: `REPORT-c1b-2026-11-27.md`). Main's rig (`client/playtest/`),
client v2.6.192 at the root, bot v0.6.244 (the branch's release), Turn-based, Expert, `--offline` (text cards). Claude played the
V5 Nosferatu starter in seat 1 against Hanna (Malkavian, Claude's prey), Viktor (Ventrue) and Lisa (Tremere, Claude's
predator, the deck with Bonding ×6). The rig logged 98.4 min, 0 page errors and 0 closed sockets. Times are seconds since the rig
started. The match was stopped after Claude's turn in round 10: pools Claude 2, Hanna 1, Viktor 5 (1 VP); Lisa was ousted by
Viktor's second Kine Resources Contested (about 2139).

## The predictions (registered before the match, D-93)
All four were about Lisa's Bonding [DOM] played as stealth against Claude's block: its +1 bleed said after the blocks are
declined (1), a reduction before that line read off the total (2), no second limited modifier after it (3), and another stealth
card spent first to keep the slot (4). **None could be read**: Lisa was ousted before a Bonding came at Claude (note 2139.3). The
only Bonding of the match was Hanna's Ashley at [dom], a bleed modifier on Viktor after Faceless Night beat Alexa's block
(4366.5–4394.3), bot to bot; its add line and window came as before. The stealth mode, C1b's core, never showed.

What the match did reach of the round's paths, as played (the bots' hands and decide rows are not in the rig's record):
- The stealth looks: Hanna's first look spent Faceless Night against Viktor's blockers (3566.8, 4366.5). The second look stopped
  at stealth 1 vs intercept 2 (3649.3) and Viktor's at 0 vs 2 on bleeds of 1 and 2 (3868.5; 4503.8, a bleed that would have
  ousted Claude): need 3, no stealth spent.
- The bleed total's +0 window after an unpumped bleed (3586.0, 4433.8), and a bounce in it (Viktor's Deflection, 3592.7).
- A human's reduction read off the total: Protected District's −3 on Chelsea's Conditioning (4 → 1, 3994.7 → 4080.2).

## Bot side (in the register)
- **Two blockers of one undirected action** (11.11). First a human actor with two bot blockers: Belinde put Creeping Sabotage in
  play (+1 stealth); Hanna's Colette attempted (529.3) and met the stealth with Telepathic Misdirection, 1 vs 1 (545.5). Then Lisa's
  Ayelech attempted too (Eyes of Argus, 547.7). Its counter write (a=0 b=1) dropped the action's +1 stealth, both bots declared
  "block succeeds" and two combats ran against Belinde (620.3–670.4). Then a bot actor: Claude's
  Wauneka blocked Viktor's Kine at 1 vs 1 (4718.4), Claude's Pass counted as an eligible seat's pass (4783.8), Hanna's Donny
  attempted (On the Qui Vive, Telepathic Misdirection) and the verdict and the combat were his (4809.4). The rulebook: the prey
  has the first opportunity, and no attempt while another minion is blocking. The 240 (v0.6.244's run in the round's gates): of
  1,969 undirected windows where both eligible bots weighed a block, none had two attempts. It needs a human seat.
- **A human's hand strike at long range is booked** (4.24): Colette maneuvered to long (Swallowed by the Night, 5717.9; Claude
  missed it) and Claude's Roundhouse hand strike for 3 put her in torpor (5728.4). The bot's own fist at long deals 0.
- **A human's "No" to a block question is not read** (4.25), though the prompt says `say "block" or "no"` (2343.6, a reminder
  at 2364.5; 3487.0, no answer in 60 s). "Pass" and "No block" work.
- **The turn-end note on a human's undirected action** (11.12): both bots passed Belinde's employ of Raven Spy (0 pool), Claude
  never said "It resolves", and at the turn's end each bot's note called it a bleed ("tell me bleed 0"; 3077–3083 → 3130.0, 3136.8).
- **A human's Carrion Crows** [ANI] again: Alexa took 1, not 3 (4237.8 → 4264.0; 4.21, still open).
- **A human blocker's permanent intercept is on nobody's counter** (4.22, traced): after Claude's blocks the counter showed none of
  Guardian Angel's +1 (a bleed at Claude) or Raven Spy's +1 (3639.9 a=1 b=0; 3868.2; 4503.6). Claude set it by hand; the bots then
  read it.

## By design, or Claude's own miss
- The damage line ("takes N (loses P blood, now M)") does not move the human's counter: the client's help says take it off
  yourself (the note at 2632 was Claude's miss). An opponent's lock is the same: Lisa's Misdirection on Belinde (1114.3), locked
  by hand.
- A human's vote in chat ("I vote 3 against", 2026.6) is not read: a human votes with the minion menu's Cast votes (the frozen
  line, v0.6.111); the bots' own "I vote N" is spoken beside their line. A human copying it is a usability point.
- Every bot asks the pool question when the human's action is a chat "Any blocks?" (502.8, 515.1): each asks about its own pool
  (v0.6.200). The client's action menu avoids it.
- Andi Liu's "now 1" after Claude's damage is right: the bot returned Govern the Unaligned's blood at the block (3557.3 → 3720.0;
  the rulebook: an action's cost is paid only if it succeeds). Majesty's "no damage either way" is right too: a combat-ends strike
  resolves first and ends combat before the other strike (4676.3).
- Claude's misses: Guardian Angel's prevention not used (3770.4); the maneuver above.

## Client side (main; for a handoff, nothing edited)
- The crypt draw with `influence()` did not count a transfer (760.4).
- The rig's `play --on` cannot put a master on an opponent's vampire: Fame landed in Claude's ready region (2739.9); the client's
  drop on an opponent's board gives the card instead.
- The Combat menu offers a hand strike at long range (the counter said long, 5728.0).
- The counter takes no human card's intercept or stealth (Cats' Guidance, Instinctive Reaction, Lost in Crowds besides the
  permanents above): game 2's panel proposal (its point 4) covers it.

## Good bot play
- Bounces onto the bouncer's own prey: Hanna's Deflection moved Claude's bleed of 2 to Viktor (4200.6); Viktor's moved Hanna's 3
  to Claude (3592.7).
- Locked minions block anyway: On the Qui Vive (2846.8, 4791.8, 5610.7), Eyes of Argus (4967.0, 5696.3), Wake with Evening's
  Freshness (4363.0), Second Tradition: Domain's +2 (4209.1).
- Viktor's politics: Kine twice, then two Parity Shifts. Alexa's Bewitching Oration (+4) and her own discard of a [dom] card (+1)
  turned 5 for and 9 against into 10 to 9 (4898.1–4903.1), then Voter Captivation.
- Majesty to leave a combat it would lose (2228, 4584.6); Hidden Strength against Claude's 1 (2583.4).

## What the match did not see
Bonding's stealth mode and the new stealth tie (D-148) at a human block; a bot holding two stealth cards at one block. From the
human seat a bot's pick shows only when it plays a card: the rig records no decide rows.
