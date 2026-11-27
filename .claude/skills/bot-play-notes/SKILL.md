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
and `playtest-claude-game2-2026-11-25.md`, whose numbered points are cited as #n; `playtest-claude-c1b-2026-11-27.md`, cited by
the rig's seconds). No names of real people and no chat quotes in this file (RULINGS D-141): the bots' names are the table's.

**Adding a note:** one entry under its heading, "Seen:" with its source `[game, date]`, then "Reasoned:" when there is more. When a
later game contradicts a note, change it and say so; never delete it silently.

## How to play a match for an evaluation
- Seen: a match shows what the 240 cannot. Examples are a stall and a stale timer in Turn-based, an answer that arrives before its
  question, and a human's cards the bots do not read (register class 4) [games 1–2, 25 Nov].
- Claude's method, as used [games 1–2]:
  - Use main's rig (`client/playtest/`) in Turn-based, with text cards (`--offline`) and Expert bots.
  - Note the time of anything odd from the rig's seconds, and read its cause in `bot/elysium-bot.js` before calling it a bug.
- Seen: the C1b match's four predictions, written before it (D-93), were all about one deck's card (Lisa's Bonding as stealth).
  Lisa was ousted before the card came at Claude, so none could be read [C1b match, 27 Nov].
  - Reasoned: a test of one deck's card needs that deck alive and acting on the human seat: its predator's seat, and the human
    keeps it from falling (or two decks that hold the card). Predict plays, not picks: the rig records no decide rows.
- Seen: the human seat keeps its own books [C1b match]. The damage line does not move the human's counter (the client's help), an
  opponent's lock (Misdirection) is applied by hand, and the counter takes none of the human's intercept or stealth, from a card
  or a permanent (Guardian Angel, Raven Spy). The bots read only what is on the counter.
  - Reasoned: set the counter after each of your own cards, and check the range before a hand strike (Claude struck at long range
    and the bot booked it: register 4.24).
- Seen: a bot's block question takes "Pass" or "No block"; "No" is not read (register 4.25). A chat "Any blocks?" in place of the
  client's action menu makes every bot ask the pool question [C1b match].
- Reasoned, not yet tried:
  - Two games with a different starter in the human seat may show more than one long game; each report lists the chairs it did
    not see.

## Strategy: the table
- **The oust's VP goes to the predator of the one ousted.**
  - Seen: Claude's Deflection put Tobias's bleed on Mara. It ousted her, and the VP and 6 pool were Claude's [game 1].
  - Seen: Viktor bounced Claude's bleeds onto his own prey Isolde twice, then ousted her [game 2]. Again at the C1b table: Hanna
    moved Claude's bleed of 2 onto her prey Viktor (4200.6), Viktor moved Hanna's 3 onto Claude (3592.7) [C1b match].
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
  - Seen: Viktor ousted Lisa with his second Kine, then called Parity Shift twice. Alexa's Bewitching Oration (+4) and her own
    ability (discard a [dom] card: +1 vote) turned 5 for and 9 against into 10 to 9 (4898.1–4903.1) [C1b match].
  - Reasoned: count a Prince's discards and a vote card in hand before casting the last votes against.

## Tactics: actions and blocks
- **Take the blocker away before the bleed.**
  - Seen: Nadja put Pentex™ Subversion ("this minion cannot block") on Claude's only unlocked blocker, then bled [game 1, #14].
  - Reasoned: count the prey's possible blockers before choosing the bleed.
- **A wake or an unlock is an extra use of a minion.**
  - Seen: Eyes of Argus [AUS] woke Nadja's Ayelech for an action (2266.4) [game 1, #12]. Nadja also played Telepathic
    Misdirection; its mode is not recorded [#14].
  - Seen: Tobias's Majesty [PRE] ended combat and unlocked his vampire, which acted again [game 1, #14].
  - Seen: the bots' locked minions block with wake cards: On the Qui Vive (2846.8, 4791.8, 5610.7), Eyes of Argus (4967.0,
    5696.3), Wake with Evening's Freshness (4363.0), Second Tradition: Domain's +2 (4209.1) [C1b match].
  - Reasoned: a prey whose board is all locked is not open: count the wake cards it has shown.
- **Permanent intercept and a reduction hold a short pool.**
  - Seen: Belinde with Guardian Angel (+1 during a bleed at Claude) and Raven Spy (+1) stopped the bots' bleeds of 1 and 2; no bot
    spent stealth at need 3, even on a bleed that would have ousted Claude (3868.5, 4503.8). Guard Dogs unlocked her to block
    during a bleed at Claude (3634.5). Larissa, a primogen woken by On the Qui Vive, played Protected District (−3) on
    Conditioning's 4 at pool 4 (3992.8–4080.2) [C1b match].
  - Reasoned: two permanent intercept on one blocker tax every small bleed; keep the primogen unlocked (or a wake card) while
    the pool is short.
- **Stealth stacks.**
  - Seen: Henrik stacked Bonding and Mirror Walk as stealth on a bleed [game 2].
  - Seen, separately: Viktor's Alexa blocked with Second Tradition: Domain (+2 intercept) [game 2].
- **A bleed vampires cannot block, as a finisher.**
  - Seen: Viktor ousted Isolde with Conditioning and Daring the Dawn [game 2]. The card says "vampires cannot block this action",
    so allies still can.
  - Reasoned: watch for the turn when your prey is one such bleed from falling.

## The bots as opponents (what to expect, what to test)
- **Bounces.**
  - Seen, bots only (the 24 Nov counts, CHANGELOG v0.6.238 and register 4.6: the release bytes' 240 and a five-starter run):
    Malkavian, Tremere and Ventrue hold bounces; Nosferatu and Toreador hold none (the deck lists).
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
  - Seen: Carrion Crows [ANI] was not applied again on v0.6.244 (4264.0) [C1b match].
- **Undirected blocks at a human table** (register 11.11).
  - Seen: two bots blocked one of Claude's undirected actions and two combats ran (529.3–670.4); a bot predator took over Claude's
    standing block of a bot's referendum (4718.4–4810.0) [C1b match]. The 240 shows no such pair: it needs a human seat.
  - Reasoned: until it is fixed, expect a second block after the first at any undirected action with a human seat; a human
    blocker's Pass does not settle the attempt.
- **Good bot play to keep when tuning.**
  - Seen: Viktor's bounces onto his own prey, and his oust [game 2].
  - Seen: Tobias's lethal Aire of Elation, and his Perfect Paragon read against a younger blocker [game 1, #14].
  - Seen: Tobias's Change of Target, which leaves the blocker unlocked, correct per the KRCG ruling [game 1, #14].
  - Seen: a blocked Govern the Unaligned's blood came back to the actor (the cost is paid only on success), and Majesty's combat
    end dealt no damage either way (a combat-ends strike resolves first) [C1b match, 3720.0, 4676.3].

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
