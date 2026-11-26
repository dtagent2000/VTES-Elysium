---
name: bot-play-notes
description: Claude's own notes on V:TES strategy and tactics from playing against the Elysium bots in the human seat (main's playtest rig), with what the bots do well and badly as opponents. Use when playing a match to evaluate a bot change, when judging whether a bot decision is good, and when designing the knowledge layer (layer 2) or the meta layer (layer 3). Add to it after every playtest (RULINGS D-140).
---

# Playing against the bots: notes on strategy and tactics

These are Claude's notes as a player: observations, not rules. Each note keeps what was **seen**, with its source, apart from
what Claude **reasons** from it, so it can be weighed and taken back. Card text and rulings come from KRCG (`bot/vtes.json`, the
KRCG tools), never from these notes. A note that grows into a bot decision goes the usual way: a proposal, the owner's go-ahead,
a knob with a 0-path, a measurement (bot/CLAUDE.md). A match's bugs go to `bot/docs/SWEEP-REGISTER.md` or BOARD, its questions
for the owner to RULINGS (HARNESS, the round's step 9). The reports are in `bot/docs/reports/` (`playtest-claude-game1-2026-11-25.md`
and `playtest-claude-game2-2026-11-25.md`; the games' numbered points are cited as #n). No names of real people and no chat
quotes in this file (RULINGS D-141): the bots' names are the table's.

**Adding a note:** one entry under its heading, "Seen:" with its source `[game, date]`, then "Reasoned:" when there is more. When a
later game contradicts a note, change it and say so; never delete it silently.

## How to play a match for an evaluation
- Seen: a match shows what the 240 cannot. Examples are a stall and a stale timer in Turn-based, an answer that arrives before its
  question, and a human's cards the bots do not read (register class 4) [games 1–2, 25 Nov].
- Claude's method, as used [games 1–2]:
  - Use main's rig (`client/playtest/`) in Turn-based, with text cards (`--offline`) and Expert bots.
  - Note the time of anything odd from the rig's seconds, and read its cause in `bot/elysium-bot.js` before calling it a bug.
- Reasoned, not yet tried:
  - Before the match, write down what the change should make the bots do differently, then look for it (D-93's prediction).
  - Two games with a different starter in the human seat may show more than one long game; each report lists the chairs it did
    not see.

## Strategy: the table
- **The oust's VP goes to the predator of the one ousted.**
  - Seen: Claude's Deflection put Tobias's bleed on Mara. It ousted her, and the VP and 6 pool were Claude's [game 1].
  - Seen: Viktor bounced Claude's bleeds onto his own prey Isolde twice, then ousted her [game 2].
  - Reasoned: a big bleed bounced onto your own prey can be your oust. Where to bounce when your prey is not in reach is the meta
    layer's open lever: the bounce target toward the table threat (RULINGS O-31).
- **Pool is a clock.**
  - Seen: Nadja spent herself to pool 1 in the master phase while her predator was active. Vessel and Pentex™ Subversion took her
    from 4 to 1, and a second Vessel from 2 to 1. She was ousted two turns later [game 1, #13].
  - Reasoned: a master that pays nothing back this turn may not be worth the last pool. RULINGS O-52 holds the proposal.
- **Politics.**
  - Seen: Tobias played Toreador Grand Ball, so his other Toreador's non-bleed actions could not be blocked, for his politics
    [game 1, #14]. He ousted Nadja with Kine Resources Contested [game 1].
  - Not measured: whether that was faster than bleeding would have been.

## Tactics: actions and blocks
- **Take the blocker away before the bleed.**
  - Seen: Nadja put Pentex™ Subversion ("this minion cannot block") on Claude's only unlocked blocker, then bled [game 1, #14].
  - Reasoned: count the prey's possible blockers before choosing the bleed.
- **A wake or an unlock is an extra use of a minion.**
  - Seen: Eyes of Argus [AUS] woke Nadja's Ayelech for an action (2266.4) [game 1, #12]. Nadja also played Telepathic
    Misdirection; its mode is not recorded [#14].
  - Seen: Tobias's Majesty [PRE] ended combat and unlocked his vampire, which acted again [game 1, #14].
- **Stealth stacks.**
  - Seen: Henrik stacked Bonding and Mirror Walk as stealth on a bleed [game 2].
  - Seen, separately: Viktor's Alexa blocked with Second Tradition: Domain (+2 intercept) [game 2].
- **A bleed vampires cannot block, as a finisher.**
  - Seen: Viktor ousted Isolde with Conditioning and Daring the Dawn [game 2]. The card says "vampires cannot block this action",
    so allies still can.
  - Reasoned: watch for the turn when your prey is one such bleed from falling.

## The bots as opponents (what to expect, what to test)
- **Bounces.**
  - Seen, bots only (the 24 Nov counts, CHANGELOG v0.6.238 and register 4.6: the release bytes' 240 and a five-starter run): Malkavian, Tremere and
    Ventrue hold bounces; Nosferatu and Toreador hold none.
  - Seen: a first target with a usable bounce bounced every bleed of 2 or more (345 of 345) and took most bleeds of 1. A bot that
    is a bounce's new target does not bounce onward (register 4.6).
  - Reasoned, not tried: a human can bleed for 1 into a bot that keeps its bounce.
- **"No block" with no modifier.**
  - Seen: after a human's "No block", the bot resolved about 1.5 s later with no "Any reaction?", and Claude's bounce was lost
    (2723) [game 1, #5].
  - RULINGS O-53 holds the proposals: `askHumansTotal` in Turn-based, or "or bounce now" in the block prompt.
- **A human's cards and counters the bots miss.**
  - Seen: the bots did not apply a human's Carrion Crows' environmental damage, and a human's Pass at the strike step counted as
    no strike [game 2].
  - Seen: the shared counters did not count the printed +1 intercept of Claude's The Dowager. Which side missed it is not traced
    [game 2, the panel's point 4].
  - Register class 4: the entries for Carrion Crows (4.21), The Dowager (4.22) and the strike-step Pass (4.23) come with C1. Play
    such cards in a match to test the readers.
- **Good bot play to keep when tuning.**
  - Seen: Viktor's bounces onto his own prey, and his oust [game 2].
  - Seen: Tobias's lethal Aire of Elation, and his Perfect Paragon read against a younger blocker [game 1, #14].
  - Seen: Tobias's Change of Target, which leaves the blocker unlocked, correct per the KRCG ruling [game 1, #14].

## Open questions for the knowledge and meta layers
- **The bounce.**
  - Today a first target always bounces a total of 2 or more, and any total when its pool is at the edge (at or under the
    critical pool, or the bleed would take it all). Otherwise a total of 1 is bounced only beyond a dynamic reserve
    (`_bounceReserve`), which reads the predator's observed pumps, the bounce share left in the library, its own pool against the
    critical pool and the prey's turns to fall.
  - Open: whether the TWD profile and the cards a seat has shown should feed that reserve, and whether a total of 2 should ever
    pass to keep the last bounce.
- **Table politics:** Kine allocations, and whom to spare and why. These belong to the meta layer (threat, offers) [game 1].
- **Reading a human:** what a human holds back, and how fast they answer. The first public evidence for that is the chat
  [games 1–2].
