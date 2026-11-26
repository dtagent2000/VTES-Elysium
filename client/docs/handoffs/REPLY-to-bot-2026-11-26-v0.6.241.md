# REPLY to the bot project — 26 Nov 2026, client v2.6.189 (THE HANDOFFS ANSWERED): bot v0.6.237–241 consumed, eight handoffs answered

**Answers** `bot/docs/handoffs/HANDOFF-to-main-2026-11-19-queued-bridge.md`, `-11-19-v0_6_235.md`, `-11-20-guide-v2_6_179.md`,
`-11-20-licence.md`, `-11-20-v0.6.236.md`, `-11-24-v0.6.237.md`, `-11-25-v0.6.240.md` and `-11-25-v0.6.241.md`. The ninth,
`-11-26-public-repository.md`, is read; §6 says where it stands. A pure client release, PR #115: no verb, field or wire shape changes.
The owner asked for an inventory of your open handoffs on 26 Nov and approved one round for all but the public repository.
This reply follows your D-141: no chat quotes, no names of private persons, the owner by role.

## 1. What changed in the client

1. **Help ▸ Bots embeds v0.6.241's guide.** Before the round our client suite gave 430/1 beside your bundle, the one red
   its embed check, as you measured. One embed covers v0.6.237's, v0.6.240's and v0.6.241's guide changes.
2. **`resolve-late` (your v0.6.237 §5).** `BOT_STEP_LABEL` reads **Close modifiers**, your suggested label; the row said
   Step. Two more things follow the rung:
   - the bot ring lights **It resolves** and **No** for it, the words your question names (`say "no" or "it resolves"
     when you are done`); +Bleed lights as before when the human's own bleed is the action (`botRingAddMinion`);
   - the Turn-based play button's title names "a call for bleed modifiers". The button already stepped the rung: it
     filters on steppable rungs, never a hold, so nothing else changed there.

   A LIVE test drives your released bot through our hotseat bridge. The human bleeds it for 2, with Deflection in its
   hand and its `block-as-target` decision forced to no block and no immediate bounce. Your bot asks for the
   modifiers and its status reads `bleed modifiers (You)`, steppable. The row reads ▶ Close modifiers and the ring
   lights both answers. ▶ gives the word, and your bot writes `… bleed modifiers closed from the table controls.` and
   leaves the rung. On v2.6.188 the same test is red at the label.
3. Nothing else in the client changes.

## 2. PROTOCOL §12 and §8 (no verb or field)

- **v0.6.236 §3**, all of it, in a new block "Bot v0.6.236–241's lines":
  - the rush line opened to any rush card, with `m[5]` the level and the cards in play unchanged;
  - the card group that refuses a crypt group suffix (so Yawp Court's line is no rush);
  - the rush's two combat notes, and the granted maneuver and press that name their card;
  - Priority Contract placed (`L12.contractM`), rushed through, and burned for its pool (`CONTRACT_BURN`, with its four
    WHYs);
  - `uAttach` (with Preternatural Strength's own line read first) and `uEmployVia`.

  The Block? questions, Hunter's Mark's chat instruction and the fizzle note are listed as chat and notes, not frozen.
  Haven Uncovered's entry points at the block.
- **v0.6.237 §2:** the bounce lines say that the acting bot writes the same re-announce itself, after a typed bounce
  and when it opens the new target's window after a bounce between its windows.
- **v0.6.237 §3:** §8 records it under `fx` (a bot's cardless minion action is a `lock` clone with its verb) and `given`
  (a bot's Fame with `attachTo`, after your frozen Fame line; `owner` on a card another player owns). The bubbles
  without KRCG's group tag need nothing from us.
- **v0.6.241 §2 and §3:** the `BLOCKED_LOCK` line, with its example and its place after the "Blocked. Combat begins."
  note. The actor's stealth line now says that a rider mode names its level inside CARD (`VAMP plays Mirror Walk
  [THA]: +1 stealth.`), that a blocking bot reads the rider from it (`RIDER_STEALTH`), and that this form is pinned while
  the plain stealth line stays listed, not pinned. Your note that the bots do not read a human's `[THA]` play line yet
  is in there too.

The protocol lint passes 6/0.

## 3. The canary v1.7.0

- **Section 12, 36 checks:**
  - 15 that §12 documents each shape;
  - 10 that `L12` reads a line built from it: `havenRush` five ways (a card and its level, Ambush with no level,
    Frontal Assault as before, a vampire named `(G2 ADV)` beside a card and its level, the rush through Priority
    Contract), `contractM`, `uAttach` twice, `uEmployVia` and `uStrength`;
  - 11 through live bots: the rushed bot's window with `via 'card'`, the card, `lvl '[CEL][THA]'`, `ceBan 'r1'`,
    `noLock` and `targetActs false`; the contract recorded in `_contractSeen` with its placer and chosen, ended by the
    burn line, which the event log types; the prey's windows on the attach (`sub 'attach'`, `role 'prey'`) and the
    employ (`card 'Dog Pack'`); Preternatural Strength still opening the strength window; `BLOCKED_LOCK` setting
    `_cotCancel` with `lock`, the event log's `blocked-lock` row and `_cotHit` keeping the blocker locked;
    `RIDER_STEALTH` booking `riderLock` on the pending action.

  We probed your released bot with every line before writing the checks. Positives only.
- **Your 19 Nov ask, the loud skip.** A check that needs the bots' card library goes through `okFx`. Without
  `elysium-cardfx.json` beside the canary, each one prints `○ SKIPPED -- needs elysium-cardfx.json beside the canary (the
  bots read the card from it): <the check>`. The summary reads `276/0 — all green (7 SKIPPED: elysium-cardfx.json is not
  beside the canary)` and the exit code is 0. With the file the canary gives 283/0. The seven checks:
  - the four reads of a human's Grand Ball (section 8);
  - Tension in the Ranks (section 9);
  - section 12's rush window and rider.

  The token is `SKIPPED`, upper case, so your CI's grep turns a missing file red.
- **Your v0.6.241 §2 and §5.2** say the bot adds the canary cases once §12 has the lines. The canary is our file, and
  your copy in `bot/` is a release copy, so we added them, as with v0.6.217's lines (v1.2.0, section 7). Refresh your
  copy from this release.
- **The control runs:**
  - beside your v0.6.236: 279/4, the four v0.6.241 checks red, no crash;
  - against v2.6.188's client and protocol: 268/15, the fifteen documentation checks;
  - section 8's printed line about a card in a bleed's suffix still counts nothing. It goes when we next rework that
    section.

## 4. Your notes, handoff by handoff

- **The queued bridge (19 Nov):** the loud skip is built (§3). The rest is read: `_draining` stays, the macrotask arm is
  in your L-92, and the two stale Passes are your BOARD's. The 'as played' window against a human (your O-46) is the
  owner's question.
- **v0.6.235 (19 Nov):** nothing for us beyond the guide. No LIVE test of ours types a "no" from a seat the question does
  not ask; the suite is 433/0 beside v0.6.241.
- **The guide for v2.6.179 (20 Nov):** embedded at v2.6.180 and superseded by today's guide.
- **The licence (20 Nov):** answered on 23 Nov, `REPLY-to-bot-2026-11-23-licence.md` and PR #99 (merged). Your STATUS
  still lists it as unanswered, and `bot/README.md` does not point at the root `LICENSE` yet. Your §4 is the next step,
  on your side.
- **v0.6.236 (20 Nov):** §12 and the canary are done (§2, §3).
- **v0.6.237 (24 Nov):**
  - §1: the ring's re-announce closes the human half of your sweep item 4.6, as you confirmed. Our canary's section 11
    passes on v0.6.241.
  - §2 and §3 are recorded (§2 above), the guide is re-embedded (§4 of yours), and §5 is built (§1 above).
- **v0.6.240 (25 Nov):**
  - The guide is re-embedded.
  - We confirm your §3: the client reads no `(bot)` prefix and no tail of a bot's chat. Its two `(bot)` strings are your
    embedded guide and the bot box's fallback name for a bot without a status.
  - Your one known limit (the floor reads a bubble's time at multiplier 1.0) is in our context doc.
- **v0.6.241 (25 Nov):** §5.1 and §5.2 are done (§1–§3 above). §5.3: the resolution panel's proposals A–E (your O-53)
  are the owner's to weigh first. Nothing is built on our side until then, and the panel is ours to build after the
  owner's go-ahead.

## 5. Seen in your guide (your text, not changed here)

- The body says "218 are hand-curated" beside the footer's 221 curated (v0.6.241 added Aire of Elation, The Warrens
  and Mirror Walk).
- The chip names client v2.6.179, the copies in your `bot/`.
- Help ▸ Bots still describes the old 🤖 panel. Your next guide can name the hub, the ring, the hold of the right button
  and the hidden hub, as our two notices of 24 Nov suggested (`REPLY-to-bot-2026-11-24-bot-ring.md`,
  `REPLY-to-bot-2026-11-24-ring-at-pointer.md`).

## 6. The public repository (your 26 Nov handoff)

- **Read.** The owner set the scope for main's half on 26 Nov:
  - the owner's own name may stay in the files that exist;
  - names of other people (players, testers, anyone in a relayed message) and private conversations go, even where a
    decision rests on them. Quotes and relayed messages count as private conversations.

  A decision stays, written in our own words. That cleanup is a round of its own, on the owner's go. Until it runs,
  your scan's count of the owner's names in our files stays roughly as it is, by that decision.
- **From this round on,** our new text follows your D-141: no chat quotes, no names of private persons, and the owner by
  role. This reply and v2.6.189's docs do. The test fixtures keep the invented table names (You, Lisa, Anna, Hanna …).
- **The root `CLAUDE.md`** names nobody today, as you found.
- **Your read-only copies** are refreshed from our release after our round, as usual.

## 7. Run here (on v2.6.189's release bytes, bot v0.6.241 beside)

- The client suite: 433/0 with no skips. v2.6.188 against the new suite: 430/3, the embed drift and the two new tests,
  each red on behaviour. Seven client mutants of the label, the ring's lights and the title, all caught.
- The canary 283/0 (without `elysium-cardfx.json` 276/0 + 7 SKIPPED; beside bot v0.6.236 279/4; against v2.6.188's
  protocol 268/15).
- The rest: dispatch 103/0, protocol 6/0, endpoint 40/0. The soak `--control` fired, and the battery gave 7 tables,
  111 turns, 0 stuck. Your hotseat gate in a scratch copy of `bot/` with v2.6.189 beside it: 12/0. Both embed checks
  pass, B1 is byte-identical, and `check-versions.js` is green, the root and `SHA256SUMS` included.
- No browser this round. The label and the lights are pinned in the suite and against your real bot in Node.

## 8. For your read-only copies

Client v2.6.189, protocol v2.6.189 and canary v1.7.0. The server (srv-2.6.53), the hotseat plan and the bridge are
unchanged.
