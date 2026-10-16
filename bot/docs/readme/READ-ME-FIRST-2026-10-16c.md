# Elysium Bots — delivery 16 October 2026 (c): bot v0.6.201 → **v0.6.202** (R2 of the 14 Oct play-test review) — DEPLOY CANDIDATE

**What it is.** R2 of our plan for main's 14 Oct play-test (`docs/reviews/REVIEW-playtest-2026-10-14.md`): combat between bots in the rulebook's order, a hold that stops the bots' combat moves, Roundhouse, two steals at once — and, under Johan's new rule (combine fixes that belong together), the rest of the v0.6.140 audit. Johan merged v0.6.201 (PR #16) and runs a client round in parallel.

## 1. Combat between bots: the acting minion speaks first (points 16, 17a, 7)
- **Before:** between two bots the maneuver, before-strikes and press steps ran side by side. Each bot decided at once and waited 200 ms for the other's line. At the client's pace the line came ~600 ms later:
  - an Immortal Grapple was ignored (Theft of Vitae through it);
  - a maneuver to long was missed (Roundhouse at long range);
  - a late line leaked into the next round;
  - a press step nobody pressed in waited out the whole askSecs (19 s at the client).
- **Now:** the acting minion speaks first in each of those steps — its card line, or a frozen line on the log tier:
  - `NAME does not maneuver.` / `NAME has nothing before strikes.` / `NAME does not press.`
  - the other bot decides knowing it and answers the same way; the acting side waits for the answer;
  - a press to continue is answered with a press to end or `does not press.`, in either direction;
  - the defender never plays a second maneuver to long, and an inferior Grapple on top of the opponent's adds nothing.
- **Safety:** the wait's net is askSecs (an older bot never says "nothing"), frozen while a human holds; a line from an earlier round is dropped at the next round's start; the Grapple stash is an event like the press and the maneuver; a replaced waiter resolves instead of hanging.
- **Who:** my combat opponent is a bot seat — known, the actor's blocker by the attempt line's sender, or unknown at a table with no human. A human (or an unknown opponent at a human table) keeps the old flow.
- **Pacing (Johan's decision 2):** with a human seated and paceMs > 0, a beat before each line — a play the step beat, a "nothing" line the short fx beat. A silent round at the client's 3.1 s: about 14 s, evenly spaced. The arena is untouched.

## 2. A hold stops the bots' own combat moves (point 5, Johan's decision 7)
- A held bot stops before its next step's question, its strike and its press, until the release — against a human or another bot.
- A step that would open under a live hold now waits in front of it. The v0.6.198 test that pinned the old behaviour (137f) is updated, with the decision in its name.

## 3. The tally, Roundhouse, two steals (points 17b, 18, 19)
- **17b:** the tally's range correction, range lock, combat-ends and press fields count only from the human the bot fights. A bystander's counter never moves a fight between bots.
- **18:** "hand strike at +N damage" / "this strike is at +N damage" is a bonus on the hand strike. cardfx compiler v1.9.2 writes `handBonus` (35 cards); `_modeStrikeDmg` adds strength: Roundhouse [pot] 3 with a plain vampire, 4 with Preternatural Strength; Wauneka's [POT] 4. The rush planner reads the same helper.
- **19:** both combatants steal at once → they resolve together [ANK 20200123]: the blood moves by the total, only the net is held to capacity (5/6, Theft [THA] against Theft [THA]: 5, was 4).

## 4. Pool lost in my own unlock (the v0.6.140 audit, finished)
- My last pool on my own Smiling Jack, an opponent's Jack, or Fame's unlock drain ousts me — and the turn stops there (a pass; no master phase, no "Turn passed.").
- A Jack's counters are paid with pool while comfortable, never my last pool while blood can pay, then blood across vampires, the rest from pool [ANK 20181006]; an empty vampire no longer lessens the obligation [LSJ 19971212].

## 5. Found by this release's own arena smokes (fixed)
The first smoke (2 matches, seed 4002) counted 7 safety-net misses — every one a bug:
- **A silent rush comply:** a bot rushed by Deep Song with no other unlocked minion complied without a word, so the rusher's directed window ran its whole clock while the target was already fighting. It says **Pass** now.
- **Deep Song's acting minion:** "the target vampire is considered the acting minion during that combat" — between bots the rushed vampire speaks first (`_combatActing` / `targetActs`); the rusher arms at its announce for the target's early lines; the counter's sides keep main's mapping.
- **A two-line combat-ends strike:** Majesty went out as the dodge-shaped line plus `Combat ends — X.`; a bot that resolved before the second line read a dodge. Now the protocol's one-line `NAME strikes: combat ends.` first.
- **A stale taken line:** the press decision read the previous round's taken line and pressed into a vampire already in torpor, then fought a phantom round 3. Now only this round's line (`_rndAt`), and a downed opponent ends the combat after the press step.
- **The analysis tool:** two "range disagreements" were `ana-combat2.py` pairing rows across two fights of one Ventrue; it pairs on both crossed names now. The invariant check counts the borne crows (Murder of Crows) beside a played Carrion Crows.

The second smoke on the then-final code (2 matches, seed 4003) counted 3 misses and one pair of rows that disagreed on the range — all from one old bug:
- **"Close next round" outlived its combat.** Horace's superior Immortal Grapple in the LAST round of a fight set the next round to close (`_forceCloseNextRound` for him, `_nextRange` for his opponent through `sets range to close next round.`) — a round that never came. Both bots' next combats skipped the maneuver step: Horace never said `does not maneuver.`, Ayelech waited out the safety net and maneuvered to long alone, and Horace struck Roundhouse at close while Ayelech stole at long. The Malkavian's next fight lost its maneuver step the same way. A range set for the next round now dies with the combat (`_resolveCombat`'s finally, and `_clearCombatStashes`). The leak dates from v0.6.28 / v0.6.164; against a human it cost the bot its maneuver in that round. Test 141o replays it: a real two-bot duel ending on a superior Grapple, then the Nosferatu's next combat against a fresh Tremere (red on the pre-fix bytes and on v0.6.201).
- **The same class, swept:** the round's range and Immortal Grapple's "hand strikes only" (`_handStrikeOnly`, reset only at the before-strikes step) outlived the round and the combat too. The next round's or next combat's maneuver step read the restriction — a sniping Tremere found no ranged card under it and stayed close (141p) — and the finders that plan between fights (a block's price, a chump bleed's cover, a rush's reach) saw "hand strikes only" (no Majesty, no dodge) or "long" (no fists) from the previous fight. 16 combats in the R2 smokes began after a final-round Grapple. The restriction resets at each round's start; a combat's end leaves no restriction and a close range.

## 6. Found by the smokes, NOT fixed here: a bleed that vanishes after a late bounce (older — since v0.6.144)
- **What:** a bleed goes through the block step, the target bounces it in the reactions-only window that follows (the late bounce, v0.6.144–145), and the NEW target attempts a block. The acting bot refuses it — "blocks were declined this action — only reactions (reduce, bounce) remain" (`_onBlockAttempt`'s `reactionsOnly` branch, v0.6.114) — and then says It resolves. The new target had shouted Block!, so its pending is `contested`, and on It resolves it drops the bleed as "contested, unresolved" (the `_onSay` branch). Nobody loses pool: the bounce plus a block attempt cancel the bleed.
- **The rules:** Deflection, Redirection and Telepathic Misdirection all say "Change the target of the bleed to another Methuselah … (that Methuselah can attempt to block)". The refusal is right for the ORIGINAL target after a modifier (a modifier never reopens blocks), wrong for the new target after a bounce.
- **How often:** 21 bleeds in the 12 smoke matches of this round — 3 in the 2 matches of v0.6.201, so it is not R2's doing. Most were bleeds of 1 sent on by the spare-bounce rule; some were Governs of 3. One more of the same family: a target that re-attempted a block after a modifier (illegal, refused correctly) also dropped the bleed (1 case). Since the late bounce of 20 Sep, every bounce deck (Malkavian, Tremere, Ventrue) has had this free cancel in the arena — the September and October deck-balance reads may lean on it.
- **Now measured:** `ana-ledger.py` pairs the other way too — a bleed `through` of 1+ that no seat took within 8 s — and names the cause (`VANISHED -- bounced late, the new target blocked (refused)` / `… a block attempt after blocks were declined (refused)`). The gate is 0.
- **Proposal (for Johan's "kör"; a short round before R3):**
  1. The actor: a bounce re-targets the bleed and gives the new target its block step — a block attempt from the new target's seat is accepted in that window (the stealth contest, the verdict, combat if blocked, no Edge then); the refusal stays for every other seat and after a modifier.
  2. The target: a block attempt the actor refused must not cost the bleed — on the refusal the pending is no longer contested, and It resolves takes the bleed. And a bot target never attempts a block in a window it knows is reactions-only for it.
  3. A section with three bots on the in-memory relay (bleed → late bounce → the new target blocks / does not block), red on v0.6.201, and the smoke's `VANISHED` count at 0.

## Gates
- On the final bytes (`elysium-bot.js` sha256 `1d0ffac5…`, `test-bot-logic.js` `6f2451ab…`):
  - `node --check` on every changed file; `ana-combat2.py` and `ana-ledger.py` compile;
  - `test-bot-logic.js` ×3, alone: **2043/0, 2043/0, 2043/0**;
  - `test-bot-canary.js` **57/0** · `diag-hb1-smoke.js` **11/0** · `test-bot-hotseat.js` **10/0** · `test-cardfx.js` **265/0** (with `vtes.json`);
  - `client/check-versions.js`: everything agrees (the root's 21 files are byte copies).
- **Destructive:** section 141 on v0.6.201 (run with its own cardfx) **4/32** — 32 red, the 4 guards green on both, no abort; on this release's pre-fix bytes **31/5** (the five assertions of 141o / 141p). `test-cardfx.js` against the v1.9.1 compiler: 6 red.
- **Beside main's current client (v2.6.160)** — `origin/main` in a scratch worktree with this branch's `bot/` and root bundle laid over it: main's client suite **298/1** (the one is the embed drift — re-embed the guide; no skips, the real-bot tests green), main's canary **69/0**, `check-versions.js` on that merge result: everything agrees.
- **Arena smokes** (4 Expert bots — malkavian, tremere, nosferatu, ventrue — pool 30; `ana-combat2.py`, `ana-ledger.py`, `ana-inv.py`, `ana-block.py`):
  - seed 4002 ×2, the first cut: 7 safety-net misses — 4 bugs, fixed (§5);
  - seed 4002 ×3, after their fixes: handshake integrity 126/0, range agreement 126/0, press agreement 98/0, no miss;
  - seed 4003 ×2: 3 misses and one pair that disagreed on the range — the "close next round" leak, fixed (§5);
  - **seed 4003 ×3, the final bytes:** handshake integrity **112/0**, range agreement **112/0**, press-outcome agreement **86/0**, **no safety-net miss**; the 10 combats that followed a final-round Grapple all clean. The ledger: 45 bleeds equal and 16 more by the actor's modifiers; dealt = taken in 106 rows, the other 4 explained (3 crows, 1 Hidden Strength); 8 steal pairs equal. `ana-inv.py`: 4 flags, both kinds older than this release and observe-only — 3 "my strike, less taken" on a Ventrue's Hidden Strength (the invariant does not subtract an opponent's prevention: all 6 such flags in the R2 smokes sit on one), 1 Ventrue pool drift +2 from Wider View's transfer burn (`this.pool += burnGain` writes only a note, no pool event — v0.6.37). `ana-block.py`: 1 "R6" row, a window artefact of the late bounce below.
  - **A bug the smokes found that is NOT fixed here (older than this release) — §6:** a bleed bounced late and then blocked by its new target vanishes — 4 in the final smoke, 21 in all 12 smoke matches, 3 of them on v0.6.201. `ana-ledger.py` now counts it.

## For main
- Send `HANDOFF-to-main-2026-10-16-v0_6_202.md`:
  - three bot-emitted lines and the combat-ends shape for §12 — nothing to build;
  - the rig / `PLAYTEST.md`: a combat between bots is paced now and says each step;
  - known limits: Deep Song in a combat with a human (the phases keep the turn seat as acting), and the vanished bleed of §6 (older, not fixed here);
  - a note on the old leak, which touched games with humans too (a bot that would not maneuver right after a Grapple fight);
  - main's replies of 16 Oct (client v2.6.159 and v2.6.160, PRs #17 and #18) built everything we had open — the Reduce row, the bridge relays, the debug items, the eye; §5 lists what we take from them next round.
- Deploy `elysium-bot.js` v0.6.202 and `elysium-cardfx.json` / `.js` (v1.9.2), and re-embed `START-HERE-BOTS.html`. The twd files are unchanged.

## Next
Proposed first (Johan decides): the vanished-bleed fix of §6, as a short round of its own.

Then main's replies of 16 Oct (`client/docs/handoffs/REPLY-to-bot-2026-10-16-v0.6.201.md`, `…-v2.6.160-eye.md`), which arrived during R2:
- copy their canary §5 (the Reduce line) into `bot/test-bot-canary.js`;
- refresh the read-only `elysium-vtes-bord.html` / `ELYSIUM-PROTOCOL.md` to v2.6.160, then the canary and the hotseat gate against them;
- the guide: v2.6.159 where it says "v2.6.158 and earlier", the ⌂ Home + Hold on sentence for the Reduce row at a hotseat, the eye in Structured;
- the hotseat tool's lift: `AVR_CMB0`, `AVR_CMB_KEYS`, `tallyCombatMerge` beside the literal.

R3, unchanged:
- a clock starts when its question reaches the wire (3, 11);
- stale hold lines are dropped (4);
- a verdict wait when a bot blocks without a card (10);
- one spokesbot for table remarks (2), while the pool question stays per bot;
- the tempo levers (12, 13).

Then R4 (the uncurated V5 masters, Revelations against a bot), and the scenario in main's rig with `--dir`.
