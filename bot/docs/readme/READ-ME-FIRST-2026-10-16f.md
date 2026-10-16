# Elysium Bots — delivery 16 October 2026 (f): bot v0.6.204 → **v0.6.205** (R4 of the play-test review, with the dodge) — DEPLOY CANDIDATE

**What it is.** Johan merged v0.6.204 (PR #22) and asked for R4 while the client works on its side. My analysis and proposal are `docs/specs/spec-r4-2026-10-16.md`; Johan's answer: "Kan vi ta detta tillsammans med R4 som en PR?" — everything in one PR as v0.6.205 (open question B). Open question A (the dodge's floor at a tie) was not answered; I used my default and said so. R4 is the last round of `docs/reviews/REVIEW-playtest-2026-10-14.md`: Revelations against a bot (F21) and the six uncurated V5 masters (F23), with Haven Uncovered as Johan decided. The dodge rule he decided on 16 Oct rides along.

## 1. The dodge (Johan, 16 Oct 17:47 + 18:06)
- **What it was:** `decide('combat-strike')` dodged a known strike only when it would empty or torpor the vampire or was aggravated, and an unknown one only at blood ≤ 1.
- **Now:** a dodge answers what the opposing strike does to me (damage + steal; their crows land anyway) against what MY strike would deal this round.
  - My number is `_strikePick(vamp, theirDodge)`: the steal, the strike card or weapon, or the fist (1 + strength + the crypt modifier; 0 at long range). It is cut out of `_resolveCombatRound`'s strike choice and that site plays its pick, so the dodge is weighed against the strike that would really be struck. No side effects.
  - A known strike of 2 or more that is more than mine → dodge (`known-out`). An equal one → dodge only with two or more dodges in hand (`known-tie`, `_dodgeCopies`).
  - Aggravated (`known-aggr`) and the survival rule (`known-survival`) as before.
  - An unknown strike (I strike first) is read on the expected strike Majesty already uses (`_expOppStrike`, shared with `_ceCtx`): `unknown-out` / `unknown-tie` on the same rule. With `combatEndStats` 0 there is no expected number, and the old blood ≤ 1 stands.
- **The floor of 2 holds at a tie too** (open question A, my default): 1 vs 1 with two dodges strikes. A one-line change if Johan reads "2 or more" otherwise.
- Knob `dodgeOut` (default 1; 0 = v0.6.204's rule byte for byte), in the manifest's knob list.
- Not built: point 4, the knowledge layer's "a deck that never hits for more than 1: dodge at 1 too".

## 2. F21 — Revelations against a bot
- **What it was:** only `… Revelations [aus]. Target: <bot>'s pool.` armed the [aus] mode. A vampire aim, no aim, or a bare `plays Revelations.` armed nothing, and the human's pick after the reveal was dropped.
- **Now:** Revelations is prey-locked by its text, so it arms when the actor's prey is this bot, whatever the line's suffix says. A bare play line is [aus].
- After the reveal to a HUMAN actor the bot says how to pick: `NAME, pick the card I discard (Revelations): ⌖ target it in the hand I revealed to you, or type "discard CARD".`
- The pick is read from that actor's targeting `logTo` (client v2.6.159+) or a typed `discard CARD` (any case or punctuation; bare, or addressed `@Name discard CARD` as the bleed grammar is), once, until the turn ends (`_revPick`). The card goes to the ash heap and the bot draws (`_revDiscard`, one body with a bot actor's `Revelations: discard X.`).
- Not a wait: no clock, no rung. The human's own action goes on.

## 3. F23 — the six V5 masters (curated 99 → 105)
- **Elder Library, Ventrue Headquarters:** they already worked; curated as they were. Ventrue HQ locks for votes in the bot's own referendums only (a known limit).
- **The Labyrinth:** a lock for +1 stealth to a Nosferatu (`fx.lockStealth`, `lockStealthClan`). `_lockStealthFor` offers the unlocked card from the board to `_bestStealthFor` (spent first on a tie: it unlocks at my unlock phase, the hand card is kept) and to `_stealthStack`; `_spendStealthCard` locks it: `X locks The Labyrinth: +1 stealth.` The tally net reads `locks` too.
- **Guardian Angel:** on my sturdiest ready vampire at play (`host: 'ready'`, `_hostReadyFor`: the highest capacity, then blood; never a second copy on one vampire).
  - +1 intercept in a block of a bleed at me (`_hostedIntercept`), at every site that counts a blocker's intercept and at the planning sites that price the predator's bleeds.
  - Prevent 1 once each combat, after the equipment prevent (`_hostedPrevent`; `VAMP prevents 1 damage (Guardian Angel, once this combat).`).
  - Burned when its vampire goes to torpor (`burnOnHostTorpor`, the shared torpor hook).
- **Wasserschloss Anif:** the blood bank.
  - In my master phase a ready Tremere that can spare it moves 1 blood to the card (`_considerBankIn`, `decide('bank-in')` on the Blood Doll drain's rule: `nobody-waits`, `danger`, `last-blood`, `hunting-anyway`, `nothing-better`, `keeps-action`, `reserve`, `spare`). Only while an uncontrolled Tremere can take the counters.
  - In my influence phase it locks and moves every counter to the uncontrolled Tremere nearest to rising that does not go over its capacity (`_bankTarget`; blood past capacity drains off). Filled exactly, it rises free in the same phase: the payout runs before `_influenceLoop`, whose first look is the free rise (§4). Under it, the transfers finish it.
  - The auto tier's `stealth 1` is gone.
- **Haven Uncovered** (Johan's decision 5: not played until the bot can rush through it, then on an opponent's vampire):
  - Played in my master phase only when a ready, unlocked rusher of mine would rush THIS turn through it: the rush doctrine's best target (never a second Haven on one host), AND the rush through the Haven is what `decide('action')` would pick for that rusher now (§5). Held otherwise.
  - Tabled on my board with the host recorded: `X plays Haven Uncovered — on OWNER's VAMP.` Every bot records it (`L12.havenM`).
  - Any of my minions may then rush its host through it (`_bestHavenRushFor`, preferred to a rush card on an equal or better target): a +1 stealth directed action, no card from hand, the host not locked, the rusher the acting minion. `VAMP enters combat with OWNER's HOST (Haven Uncovered).` (`L12.havenRush`).
  - The target bot opens its rush window (any unlocked minion may block) and on its Pass defends without the lock: `X defends (rushed by Y, Haven Uncovered).`
  - Not built: the host burning the card as its own action; reading a human's Haven play (the client's generic line); the per-minion turn ledger does not count a Haven rush (card-in-play actions are a known gap since v0.6.129), so a minion that acts again could rush through it twice in one turn. A human's rush through a Haven on a bot's vampire goes by `rush` in chat and the bot locks its vampire as for a rush card (the guide says to unlock it by hand).

## 4. Found on the way, fixed
- **Arcane Library's influence lock never fired in play.** `_considerLockIncome` was called for the unlock and master phases only; the unit test 19l-13 called it with 'influence' directly. `_playTurn` now calls it before `_influenceLoop()` (Wasserschloss's payout rides the same call). The smoke: 4 locks in one match.
- **A vampire already at capacity in the uncontrolled region never rose — and stalled the influence phase for the rest of the game.** The planner picked it (a need of 0) and the loop broke: from then on no transfer was spent and no vampire drawn. A probe on v0.6.204 (Lauren 4/4 and Chrysanthemum 0/5 uncontrolled): Chrysanthemum rises, then four transfers a turn go unused. The grinder's stock fills a vampire exactly all the time — superior Govern the Unaligned (Tremere, Malkavian) and Enchant Kindred (Ventrue): the final smoke rose four that way in three matches (Nassir, Dr. Stephen Norton, Oshri Dahan, Sully), and on v0.6.204 each of those bots would have stopped influencing from then on. Arcane Library and Wasserschloss can fill one too now. It rises free at the top of the loop (`_riseFromUnc`, one body with the transfer rise); the influence sentence says `NAME enters play at capacity`.

## 5. Found by the release's own pre-flight smoke (seed 4005), fixed
- The first cut played Haven Uncovered on the rush chooser's target alone. The Haven went on Christine Boscacci; then its rusher equipped Raven Spy (permanents first, 98), and a plain bleed outscored the rush anyway (1.2 vs 1.1). A target is not a rush.
- Now `_havenHostPick` asks the action scorer: the minion loop's own ctx with the Haven's rush in it (`_actionCtxFor`, cut out of the loop: the same finders and keys), the hold-the-Govern weight (`_actionCtxAdjust(…, ahead)` — the turn ledger and the probe describe a minion phase not yet begun; the ledger still holds last turn's acts until it starts), the scorer without its trace row (`_decide`).

## 6. Found, NOT fixed (older, since v0.6.143)
- **The probe-then-punch reservation never takes effect.** The minion phase sets `this._probe` and resets it to null two lines later, before the first actor, so a prober is never kept off the heavy card. 117g sets `_probe` by hand, so the suite never saw it. The ordering half (the puncher last) works.
- Fixing it changes the stealth-bleed play that v0.6.143 was measured with, so it is a proposal for Johan, not a rider: move the reset above the ordering, then measure on the balanced design before keeping it.

## 7. The coverage tool and the cardfx test
- `gen-deck-coverage.js` v1.1.38: a MASTER mode counts as consumed only through a key with a board / master consumer (`MASTER_KEYS`); the hand finders' keys never certify a master (they made Guardian Angel, Haven Uncovered, The Labyrinth and Wasserschloss FULL). Its second version site (the report header) had stood at v1.1.34 since v1.1.35 — resynced.
- The four V5 starter reports in `docs/coverage/` regenerated (they were from 18 Sep): Malkavian FULL 71 · PARTIAL 4 · HANDLER 2; Nosferatu FULL 77; Tremere FULL 75 · INERT 1 (.44 Magnum) · PARTIAL 1 (Bowl of Convergence [AUS]); Ventrue FULL 77.
- `test-cardfx.js` 271/0: every master in the four V5 decks is `src: 'hand'`, plus the six shapes (265/6 on the old curated file).

## 8. Main's client v2.6.162, consumed
- Main merged client v2.6.162 (PR #23) and its follow-up (PR #24: docs, rig, tests — no client change) during this round; the branch merges origin/main. The read-only copies in `bot/` (`elysium-vtes-bord.html`, `ELYSIUM-PROTOCOL.md`) are the current main's (v2.6.162 with #24's §12 wording); the server and the hotseat plan were already identical.
- Their `REPLY-to-bot-2026-10-16-v0.6.204.md`, §4:
  - finding 2 (the guide): the nav chip said v0.6.203, and the Controls list called the new rung "▶ Step" — both fixed (the chip and the footer now say client v2.6.162; the rung is ▶ Declare verdict, their label);
  - finding 1: after a question, everything the bot sends waits the chat beat (~4.96 s at the client's pace) — the verdict line, the booking of a typed stealth, the hold lines. Their idea: status lines (log / tally) skip the chat beat, or the next wait shows only once the verdict is on the wire. A design question: an analysis and a proposal for Johan in the next round, not built here.

## 9. Tests
- **Section 146** (16): the dodge — known and unknown strikes, the tie with one and two dodges, long range, a steal, aggravated, survival, `combatEndStats` 0, `dodgeOut` 0, and a two-bot relay where the strike played is the one the dodge weighed.
- **Section 147** (13): Revelations — the arming shapes, a non-prey actor, the pick by logTo and by chat (bare and addressed), a pick from another seat, the turn's end, a bot actor's line.
- **Section 148** (23): The Labyrinth (offered, counted, locked, typed as stealth), Guardian Angel (the host, the bleed-only intercept, the forecasts, the prevent typed as a prevention, the burn at torpor), Wasserschloss (in, out, nobody waiting, never over capacity, filled exactly and risen free), a whole `_playTurn` with Arcane Library, the free rise. Elder Library and Ventrue HQ are pinned in `test-cardfx.js`.
- **Section 149** (14): Haven Uncovered — the data and frozen lines, the hold and the pick, the smoke's case (a permanent first, a better bleed), the target side, and a whole turn between two bots through the rush.
- **Destructive on v0.6.204:** 146 4/12, 147 6/7, 148 4/19, 149 1/13 — no abort. The late assertions are red on their own pre-change bytes: 149's smoke case 13/1, 147's addressed discard 12/1, 148's exact fill 22/1.
- **Old tests moved:** 143d runs with `dodgeOut: 0` (it pins the survival rule); 139c's Revelations line became a Bum's Rush (Revelations no longer reads its Target suffix); 121f reads `locks`.

## Gates
All from `bot/`, on the final bytes (`elysium-bot.js` 859b7b72…, `test-bot-logic.js` 047d87e8…, `elysium-cardfx.json` bea73088…):
- `node --check` on every changed JS file (the bot, the suite, `test-cardfx.js`, `gen-deck-coverage.js`).
- `test-bot-logic.js` **2178/0 ×3**, alone, detached, each run in a frozen snapshot of `bot/` (v0.6.204: 2112; +66 = sections 146–149).
- `test-bot-canary.js` **69/0**, against the read-only copies of main's current client (v2.6.162 with PR #24's §12 wording).
- `test-cardfx.js` **271/0** (265/6 on the old curated file).
- `diag-hb1-smoke.js` **11/11**; `test-bot-hotseat.js` **11/0** (alone, against the v2.6.162 copy).
- `client/check-versions.js` after the root copy: everything agrees (the root's 21 files, each a byte copy of `client/` or `bot/`).
- Destructive on v0.6.204: 146 4/12, 147 6/7, 148 4/19, 149 1/13 — no abort; the late assertions are red on their own pre-change bytes (13/1, 12/1, 22/1).
- Beside main's client (a scratch copy of this branch — origin/main with this PR — with the bot bundle beside `client/`): the client suite **303/1** — the one red is the embed drift (Help ▸ Bots embeds v0.6.204's guide; one re-embed closes it), and their two v2.6.162 LIVE tests with the real bot (the verdict wait, its clock from the wire) are green beside v0.6.205; their canary **69/0**.
- **The arena smoke on the final bytes** (seed 4003, 3 matches, 4 Expert bots: malkavian, tremere, nosferatu, ventrue; pool 30): no timeouts (7, 10 and 8 rounds; 209–279 s a match).
  - `ana-ledger.py`: every bleed paired (64 equal), **VANISHED 0**; the combat names 100 right; dealt = taken in 88 rows, and the 12 others explained (7 Guardian Angel prevents on its host, 3 Hidden Strength, 2 Carrion Crows); steal pairs 6 of 6 equal (11 stolen = 11 lost).
  - `ana-combat2.py`: handshake integrity 104/0, range agreement 104/0, press agreement 74/0, no wait ran into the safety net.
  - `ana-inv.py`: **0 flags**. `ana-block.py` (now counting The Labyrinth's lock as stealth): no violation (168 actions, 46 blocked).
  - R4 in play: Haven Uncovered played once and held twice (no rusher's action); four rushes went through it — two by its placer's Nosferatu (back, at its predator's Chelsea Blake) and two by the Tremere (forward, the same host: any minion may) — and one was blocked. Four free rises, each a stock that filled a vampire exactly (superior Govern for Tremere and Malkavian ×2, Enchant Kindred for Ventrue). Guardian Angel twice, seven prevents. Arcane Library: four influence locks. Wasserschloss Anif once (no blood banked: the pool was in danger twice, nobody waited once). Two Revelations discards between bots.
- **The pre-flight smokes** (before the last changes): seed 4003 ×3 twice and seed 4005 ×2 twice with hacking, sewer, nosferatu and tremere (the four V5 decks hold no dodge card). The same audits were clean; one "range differs" pair in the first was two back-to-back combats of the same two vampires paired across by the tool's 9 s window, each combat agreeing with itself. Dodges: survival 22, known-survival 2, `unknown-out` 2; kept: `known-keep` 3, `unknown-keep` 6, `known-nothing` 1. The first seed-4005 run found the Haven played without a rush (§5).

## For main
- Send `HANDOFF-to-main-2026-10-16-v0_6_205.md`: the two frozen Haven lines for §12, the `locks` stealth verb, the new log notes and the one new chat instruction, the rig and PLAYTEST.md notes, the guide re-embed.
- Deploy `elysium-bot.js` v0.6.205 and the cardfx files (curated 105); re-embed `START-HERE-BOTS.html` (v2.6.162 embeds v0.6.204's).

## Things I am not sure about
- **Question A, the dodge's tie.** I read "against everything with 2 or more damage" as a floor that holds at a tie too: 1 against 1 with two dodges in hand strikes. If Johan meant that two dodges always take a tie, it is one line.
- **The dodge rule barely shows at these tables.** Most strikes in the starter decks are for 1, so in the smokes almost every dodge was the old survival rule; the new branches fired twice (`unknown-out`, the pre-flight dodge smoke). The unknown case leans on the table model's expected strike (1 + 2 × the seat's combat share, prior-blended), which read 1.5–2.2 for these decks: a seat that has shown a strike for 2 tips it over the floor fast. Not benched; `dodgeOut` is there for the larger re-measure.
- **The Haven's look ahead approximates the minion phase.** It asks each rusher as if it acted now; the real phase orders its actors (the worst blocker first, keep-a-blocker, the probe order), and an earlier actor can change the picture, so a Haven can still sit unused for a turn now and then. Live, the final smoke ran it once: held twice, then played on the predator's Chelsea Blake and rushed through four times (two by the Nosferatu, two by the Tremere) — one smoke, no measurement.
- **Guardian Angel prevents normal damage only**, as the equipment prevent does: an all-aggravated strike is not prevented by it. Rare at these tables; one line if it matters.
- **The free-rise fix changes three decks' play more than its size suggests.** Before it, a Tremere, Malkavian or Ventrue bot whose stock action (superior Govern, Enchant Kindred) filled a vampire exactly stopped influencing for the rest of the game — four times in the final smoke's three matches. Older numbers for those decks (series, benches, the balanced baselines) may carry that stall; I have not measured how often it happened in them.
- **A human's Haven Uncovered is not read**, and a human's rush through a Haven on a bot's vampire makes the bot lock that vampire (the generic rush-by-chat path). The guide says so; a fix needs the client's Haven line or a rule on the chat path.
- **The Revelations pick has no clock.** If the human never picks, nothing is discarded and the bot draws nothing; the pick closes at the end of the turn. I think that is the right reading of a sandbox table, but it is a choice.
- **The probe reservation (§6)** has been dead since v0.6.143. I did not fix it, because v0.6.143's measurements were made with it dead.
- **Main's finding 1 (§8)** is untouched: the verdict line still waits the chat beat after the question.

## Next
R4 was the review's last round. In Johan's order (READ-ME-FIRST-2026-10-16e, "After R4"):
1. The play-test scenario in main's rig, run by us with `--dir` on a scratch copy of the root with the bot branch, compared with the 14 Oct report's numbers — the proof that R0–R4 fixed what the play-test found.
2. The larger re-measure in the arena once every fix is in (Johan's answer 4); the dodge's knob `dodgeOut` can be benched there.
3. The probe reservation (§6): Johan's call.
4. Main's finding 1 (§8): the chat beat after a question — an analysis and a proposal for Johan.
5. Parked, outside the review: one pool question with per-seat answers at a political action; a human's bounce of a bot's bleed; a bot new target bouncing onward; when a bot target plays its reduce card; the dodge's knowledge-layer step; the tempo lever for a watched bot-vs-bot combat; a human's Haven Uncovered read by the bots.
