# Review: the 14 Oct play-test, finding by finding (bot v0.6.198)

**Source:** main's `client/docs/handoffs/REPLY-to-bot-2026-10-14-playtest.md` (PR #13): one full game on the real server, a human (Claude through main's new rig, `client/playtest/`, Malkavian starter, seat 1) against two Expert bots — Hanna (Tremere, seat 2, the human's prey) and Viktor (Nosferatu, seat 3, the predator). Structured; rounds 1–4 at Standard 3 s, 5–8 Turn-based. Client v2.6.157 / srv-2.6.46 / bot v0.6.198 from the root bundle.

**Method (14–15 Oct, the bot chat):** three independent read-only audits of `bot/elysium-bot.js` — combat between bots; waits and flow towards the human; rules, accounting and chatter — each finding traced to code, with node probes against a COPY of v0.6.198 for the central claims (a Bot built without a socket, or two bots on a stand-in relay), then spot-checked here. KRCG's card texts and rulings were confirmed from `vtes.json` on 14 Oct.

**Line numbers** are v0.6.198's (`git show a9f21b0:bot/elysium-bot.js`). v0.6.199 inserts 9 lines after line 7372.

**Caveats:**
- The game's trace is not in the repo; the order of events is reconstructed from the report's timestamps.
- In Standard, the rig's reflex said "Hold on" 1.6 s after a bot's question, so the Standard waits that ended in a hold are the rig's, not the bots'.
- The probes ran against a stand-in server, not the real one.
- The steal ruling (F19) rests on vekn.net forum rulings; `vtes.json` holds no contrary ruling.

## Summary

| # | Finding | Verdict | Root cause | Round |
| --- | --- | --- | --- | --- |
| 1 | Both bots answer a prompt meant for one | bug (rules) | "Any blocks?" never checks the right to block; `Target:` is not read; a non-target bot can block and lose pool (probe); plus the pool-question chorus (debt 23c) | R1 + R3 |
| 2 | The same remark twice | bug (chatter) | the archetype remark is a `chat()` from every bot, mid-contest too; Pentex / Fame / Misdirection / Creeping have an extra note each | R3 |
| 3 | The question arrives after the wait has started | bug | the clock arms when the question is queued, not sent; every chat ahead of it in the queue costs ~5 s | R3 |
| 4 | Hold / resume said out of order | bug | both lines sit in the ordinary send queue | R3 |
| 5 | A hold does not stop the bot's own combat | bug | an answer ends the frozen wait; the bot's own strike and step writes have no `_holdGate` | R2 |
| 6 | Bot answers before the question | cosmetic | the order between two bots' queues | R3 |
| 7 | Bot-vs-bot combat: a 2 s burst, then ~19 s silence | bug | steps are paced only with a human in the combat; the press wait is `askSecs` 20 when nobody presses (reproduced: 19.2 s) | R2 |
| 8 | Turn-based deadlock in a contested block | bug | resolved only if the LAST passer is a human; the reminder text is fixed when armed; ▶ always writes "nobody answered" | R1 |
| 9 | "Any presses?" does not wait | bug | the human's automatic taken line arrives after step 5 opened, and `_phaseNudge` takes it as an answer in any step | R1 |
| 10 | Bot blocks without a card, then silence | bug | no wait at all: no tempo kind, no clock, no ▶ rung; the actor's Pass is not read | R3 |
| 11 | Announced clock ≠ real clock | bug | two plans computed; same root as 3 | R3 |
| 12 | An empty bot turn takes 27–33 s | tempo | a double beat at turn start, 3.1 s per empty phase (reproduced: 27.5 s) | R3 |
| 13 | A silent combat round takes ~41 s | tempo | twice the slider in every step (reproduced: 37.9 s) | R3 |
| 14 | Turn-based felt right | praise | — | — |
| 15 | Bleed reduction ignored | bug (rules) | the actor's "+0 (= 3)" writes the total back at the target (6445); the Edge moves on a 0 bleed | R1 |
| 16 | Immortal Grapple ignored | bug (race) | the filter exists, but its 200 ms wait loses to the send queue at the client's pace; a late Grapple leaks into the next round; the arena (paceMs 0) never shows it | R2 |
| 17 | Range ignored | bug ×2 | (a) the same race; (b) a human's counter write is taken as a "range correction" whoever wrote it | R2 |
| 18 | Roundhouse one short | bug (compiler) | "+2 damage" compiled as absolute `strike: 2`; 36 library cards share the pattern, in our decks only Roundhouse ×8 | R2 |
| 19 | Stolen blood | not a bug | the steal comes before mending and the excess drains: 5+2 = 7 → 6 → −1 = 5; the line hides the drain | R1 (wording) |
| 20 | The Edge never changes hands on the wire | bug | the bot never sends `edgeTake`; the hotseat bridge does not relay it either | R1 + main |
| 21 | Revelations against a bot | bug | only a line aimed at the bot's POOL arms it, and the client's pick line (`logTo`) is not accepted | R4 + main |
| 22 | Turn-1 discards of key cards | decision | with no ready vampire the whole hand counts as dead | R1 |
| 23 | Haven Uncovered on its own side | data | six masters in the V5 decks are not curated, four do nothing; the guide's "curated to 100 %" was wrong | R4 (guide: R0) |
| 24 | Good calls | praise | — | — |
| + | Creeping Sabotage counted ×3 | bug | `_knownLosses()` inflates `dynFloor` (default on since v0.6.193) in bot-vs-bot games — arena and benches too | R1 |

## A. Talking over each other

### F1 — both bots answer a directed action meant for one (confirmed, rules)
- **The client's lines:** a card play is `Meaghan plays Revelations [aus].` + an optional ` Target: WHO's NAME.` / ` Target: WHO's pool.` (client `targetSuffix`); the Card action row is `… takes a card action.` — a pool aim is used up by the play line, a vampire aim stays on both. `Any blocks?` is SAY[8], broadcast to the whole room with no addressee.
- **The bot:** `L12.actObs` (455) fills `_obs` only and ignores the Target suffix; `_onAnyBlocks` (6982) checks `!_ask && !pending && !_pq` and that the actor is another seat — never whether THIS bot may block. `_openAskedWindow` has a rights check only for political actions (7041–7042).
- **Probe:** with no aim, a vampire aim or a bare card action both bots ask the pool question; Viktor (the actor's PREDATOR) opens a `role:'target'` window and says `Block!` when he holds intercept; without intercept he loses 2 pool on the actor's "It resolves" (20 → 18).
- **Rules (KRCG):** Revelations [aus] is Ⓓ (directed at the prey: only the prey may block); [AUS] puts the card in play with no Ⓓ (undirected: prey and predator may block). The right to block follows the MODE's direction, not the card name.
- **Fix (rules, unconditional):** store the target on `_obs` (` Target: (.+?)'s `), carried to a following line from the same vampire; for a directed action only the target may ask or block, with the actor's prey as the default when no suffix; every other bot stays silent, without even "No block".
- **The chorus (debt 23c) stays for political actions — Johan, 16 Oct:** the pool question's answer is each bot's own STAKE, and a human-called referendum is voted on it (`stake = pending.amount` or `_obs.poolLoss`, 3124–3125: votes against only when the stake is > 0), so a shared answer would vote every bot as if it had the same stake. Every bot keeps its own question at a political action until a better way to allocate the pool loss is worked out (an idea for later: one question with per-seat answers, "Hanna 3, Viktor 0"). At a DIRECTED action only the target asks (the rules fix above, R1). `_isSpokesBot()` (7607; greeting 1107, bare `help` 7568) is kept for remarks that are the same for everyone (F2) and must skip ousted / vacant seats (probe: an ousted Hanna is still the spokesbot).
- **Test:** three bots and a human; "Meaghan takes a card action. Target: S2's Lauren." then say 8 — only S2 asks; S3 / S4 keep their pool after "It resolves" (red on v0.6.198).

### F2 — the same remark twice (confirmed, three sources)
- **Deck read:** `_archetypeSay` (1928) → `this.chat('I read …')` (1932), fired from `_onFx` (2209) when another seat's play makes the read confident; `_arkSaid` is per bot; no spokesbot, no check for a live contest. Probe: two bots, seven plays, both say it.
- **Pentex / Fame / Misdirection:** the actor's note (7973 / 7941 / 7927) and the target's note (6527 / 6566 / 6536) both repeat the play line (7972).
- **Creeping Sabotage:** the parsed line at 3736 ("Creeping Sabotage (x1): Claude burns 1 pool.", read by `L12.creep` 446) plus a note at 3737 ("… ticks — Claude burns 1.").
- **Side bug (probe):** the event-log parser (6283) matches the predator's line, the note AND a bot victim's acknowledgement (6588): one 1-pool tick makes `_knownLosses()` return 3 and inflates the dynamic pool floor (`dynFloor`, on by default since v0.6.193) in bot-vs-bot games. **Fix in R1** (rules): drop the 3737 note, treat 6588 as a note, test `_knownLosses() === 1` after a tick (127y must switch to the 3736 line).
- **Fix (R3, wording):** the archetype remark from the spokesbot only, on the log tier, held back while `_ask` / `pending` / `_pq` / `_phaseWait` / `_inCombat` / a tally is live; delete the actor notes 7973 / 7941 / 7927.

### F3 / F11 — the question arrives after its clock (confirmed)
- Every wait arms when its question is QUEUED: `_phaseStep` writes `ph` (4221), stamps `t0` (4222), queues the question (4224), arms (4235); `_phaseDamage` the same (4249 / 4256 / 4260). Combat waits set the settle to 0 (4168). `_drain` holds each chat 4.96 s after the previous one (`gapNeed`, 794): every chat ahead of a question (the round summary 6059, "Damage:", "▶ Resuming.") costs it ~5 s.
- **Probe:** "before ending combat" opened at 31.97 and reached the wire at 36.41, leaving 1.5 s of a 6 s step.
- **F11:** the announced tail comes from `_askPlan` (7731) before the question is queued; `_restartAskTimer` (7732 → 7647) recomputes a plan whose settle now includes the question's own 4.96 s. Probe: announced 3 s vs a real 8.2 s; 20 vs 25.2 s bot-vs-bot (`mode:'bots'`, legacy `askSecs + settle`, 4169).
- **Rule (R3):** a wait's clock and `t0` start when its question leaves the queue — once, for every kind: `chat(msg, { onWire })`, fired by `_drain` right after `ws.send` (818); phase, damage, block, pool and vote waits arm from it; `status()` shows `until: null` until then and an answer still counts. The settle then disappears and the announced number equals the clock. **Test:** `deadline − sentAt === plan.ms` (± 50 ms).

### F4 — hold / resume said out of order (confirmed)
- Both lines (6776, 6748) are ordinary chats in the same queue. Probe: hold → queue [tally, "What is your strike?", "⏸ Holding"]; release → "▶ Resuming." appended (the release also answered the step, 6854); a second hold found no open wait and said nothing; on the wire "⏸" at 10.1 and "▶ Resuming." at 15.1 — while the table was held again.
- **Fix (R3):** tag both lines with the hold state; `_drain` drops one whose state no longer matches `_held()`, and puts them at the head of the queue.

### F5 — a hold does not stop the bot's own combat (confirmed)
- `_resolveCombatRound` calls `_pace()` only at 5703 and 5999. The step waits freeze (6809), but an answer still ends them (the human's own strike, or F9's taken line); then the bot's strike (5930), the ph 4 / 5 writes, the summary (6059) and the next questions all run. Probe: steal at 28.8, ph 4 / 5 at 34.3, "Any presses?" at 34.9, "before ending" at 40.1 — all under `hold: Claude`, until the release at 45.0.
- **Fix (R2):** `await this._holdGate()` at the top of `_phaseStep` / `_phaseDamage` and before the bot's own strike and press plays. Arenas are untouched (`_held()` needs a human). This is our reading of the guide's "pauses every bot at its next visible step".

### F7 — bot-vs-bot combat: a burst, then silence (confirmed, both halves)
- **Burst:** `_phasesOn()` is false bot-vs-bot (4210 needs a human opponent), so every step question returns at once; combat paces only at 5703 / 5999 and the queue spaces lines 200 ms apart. Probe: 6–8 lines in ~1.9 s.
- **Silence:** the press step — `await this._awaitOppPress(this._lineGraceMs(askSecs * 1000, 'press'))` (5663); `_lineGraceMs` (4124) returns the full `askSecs` with no human in the combat; a bot that does not press sends nothing, so both wait the full 20 s. Probe: last line +1.9 s, both waits empty at +21.0 s — 19.2 s idle (play-test 18.8–19.5 s). The arena pays `askSecs × 1` s (3 s) per round.
- **Fix (R2, rules-safe):** a frozen "X does not press." line (the acting side speaks first, the other answers after seeing it, so a press to end is never missed) ending `_awaitOppPress`; the same handshake family as F16 / F17. Pacing for a watching human: when a human is seated and `paceMs > 0`, `await this._pace()` at each combat step; `_pace` returns at once at paceMs 0 (867), so the arena pays nothing. A hold then also stops bot-vs-bot combat (F5).
- **Test:** relay at paceMs 0, askSecs 5: two non-pressing bots finish a combat in < 1 s (red today); at paceMs 300 with a human seated: ≥ 300 ms between combat lines.

## B. Waits, Standard and Turn-based

### F8 — Turn-based deadlock in a contested block (confirmed)
- Eligible blockers {Claude, Hanna}. Claude's Pass leaves the set incomplete (6921–6930); Hanna's Pass completes it, but the Turn-based shortcut tests the SPEAKER, `this._isHumanName(m.who)` (6925); Hanna is a bot, so it falls to `if(!a.timer) _restartAskTimer()`, the 240 s give-up timer is already armed, and nothing resolves. `status()` shows "block verdict" with nobody (eligible minus passed is empty, 714).
- The reminder text is fixed when armed (`_remindArm(..., this._askRemindText(a))`, 7650) — armed at the intercept booking (7482, t 1853.3), fired 120 s later (1973.3) with the stale "waiting for Claude" (inferred from the timestamps). `step()` always writes "(nobody answered)" (747).
- **Extra (probe):** that path and the directed one (6935) also write "no answer in 4 min — resolving the block from the counter." (7670), because `a._end` is never set: a false line on every Turn-based Pass.
- **Fix (R1):** at 6925 resolve when the ask's plan has no clock, whoever spoke last (`a._end = 'answer'; this._askTimeout()`); `a._end = 'answer'` at 6935 too; build the reminder text when it fires; 747's wording by state. **Test:** both pass orders, b ≥ a — closed, the verdict line written, no "no answer in" note, the row ends `answer`.

### F9 — "Any presses?" does not wait (confirmed; the reporter's guess was wrong)
- Not the bot's own echo: the tally nudge skips own writes (1169) and resolves only on `ph > pw.step` (4276).
- **The cause:** `_phaseDamage` ends with `_cWrite({ ph: 5 })` (4269) on purpose, so the human's client writes its automatic taken line (client `cmbWatch` → `cmbLogTaken`). That line arrives after step 5 has opened (5632) and goes through `_phaseNudge(who, t, 'log')` (6652), whose answer regex includes `takes \d+ \(loses` (4279) — the step ends as `'line'` → `"end":"answer"`. The ph:5 write sits in the queue behind the "Damage:" / summary chat, so it reaches the wire after step 5 is armed.
- **Probe:** Turn-based step 5 ended "answer" after 3.5 s on the taken line, and "Any presses?" went out 0.34 s after it closed; silent Standard 2.2 s.
- **Fix (R1, `_phaseNudge`):** tie each line to its step — the taken and prevent lines answer step 4 only; elsewhere they neither resolve nor re-arm. (It adds ~6 s back to a silent round.)
- **Test:** `_phaseDamage` → Pass → `_phaseAsk(5)`, then the human's taken line: step 5 stays open; a Pass ends it as `'pass'` (red on v0.6.198). Needs damage to reach the human (the real client writes nothing when none came in).

### F10 — the bot blocks a human without a card, then silence (confirmed)
- `_commitBlock` (5460) says Block!, writes b, logs "attempts to block." (5553) and the console line (5535); then only `pending.contested`: no timer, no `_waitPlan` kind, no `_phaseWait`. `status()` falls to `mk('acting', 'reacting to Claude (bleed 3)', p.reactAt, null)` (725) — a past timestamp, no step rung, so ▶ says "nothing to step".
- It ends only on the counter's verdict line (6451) or the actor's "It resolves" (6951); the target branch never reads the actor's Pass (6945–6960). Probe: Pass and a typed pass leave it contested; the verdict line starts the combat.
- **Fix (R3):** a blocker-side verdict wait armed at the end of `_commitBlock` against a human actor: the line "Trevon Parker blocks (stealth 0 vs intercept 0): add stealth, or Resolve the counter" + `_waitTail`; tempo kind `block` (Standard / Adaptive: on the clock the §12 verdict from the counter, as `_askTimeout` does; Turn-based: no clock, a reminder, a `resolve-verdict` rung); the actor's Pass is an answer, a raised `a` restarts the clock, frozen and thawed on a hold, disarmed in `_clearPending`.

### F12 / F13 — pacing (confirmed, reproduced)
- **Empty turn (27.5 s):** two beats before the first line (`pace()` at 7840 from the previous "Turn passed.", then `_announcePhase`'s own `_pace()` at 918); one 3.1 s beat per phase line; a 4.96 s hold after the influence chat (1617); a `pace()` before the pass (8596).
- **Silent combat round (37.9 s):** steps 0, 1, 2, 3 and 6 each wait `base × 2` = 6 s (4172), plus chat gaps.
- **Levers, all rules-safe:** (a) drop the duplicate beat at turn start (−3.1 s); (b) a short `fx` beat (1.24 s) for a phase with nothing to do — every `Phase: X.` line stays (other bots parse it, 6264; the client's phase bar follows it); (c) the round summary (6059) on the log tier when phases are on (also removes most of F3's delay); (d) 1× instead of 2× for the "Anything before…" steps, 2× kept for strike and presses; (e) Adaptive's rules-strict skip (`_phaseSkip`, 4196) under Standard too — rules-safe, but it redefines Standard: Johan's call.

## C. Rules and accounting

### F15 — bleed reduction ignored between bots (confirmed, rules)
- **The reducer:** `_commitReduce` (3563) sets `p.amount = Math.max(0, … − rd.n)` (3584), writes "— reduces the bleed by 3 (now 0)." (3587) and says Pass; no bot parses that line (the event log files it as card-played).
- **The actor:** `_actingVamp.n` stays 3; with a bot target and no modifiers, the v0.6.144 total window writes `adds +0 bleed (= 3)` (8522) and asks "bleed total 3" (8525).
- **The target:** the `L12.add` handler sets `pending.amount = parseInt(m[3])` (6445) — back to 3; the reducer cannot fire again (`reducedOnce`, 3545); "It resolves" takes 3 (6098). Probe: amount 0 → 3, pool 9 → 6; without the total line the pool stays 9.
- **Also:** the Edge moves on a 0 bleed (8533 and 6132; probe), against the bot's own "successful = amount ≥ 1" (8534).
- **Fix (R1, rules):** target — after a reduction apply the `+N` delta, not the absolute total (`p.amount = p.reducedOnce ? Math.max(0, p.amount + +m[2]) : +m[3]`); actor — parse `^(.+?) plays (.+?) — reduces the bleed by (\d+) \(now (\d+)\)\.$` from the target seat and set `n = now`; gate the total window, the Edge and the through-note on `n ≥ 1`. **Test:** pool stays 9, the target keeps the Edge, the actor ends with `n === 0` and sends no "+0" line.

### F16 — Immortal Grapple ignored (confirmed: a race, not a missing filter)
- **Rules (KRCG):** "Only usable at close range before strikes are chosen … [pot] Strikes that are not hand strikes cannot be used this round (by either combatant)". Theft of Vitae is "Strike, ranged".
- **The filter exists:** Grapple line sent (5807), parsed (7438–7442, `_oppGrapple`), `const oppG = await this._awaitOppGrapple(Math.min(200, …))` (5812), `_handStrikeOnly` (5818), honoured by the strike / steal / dodge / combat-ends choosers (3930, 3948, 3908, 3533).
- **The cause:** the 200 ms wait. Each bot's outgoing messages are ≥ 200 ms apart (`_drain`, 794), ~5 s after a chat. Probe: Hanna stopped waiting at +616 ms and chose Theft of Vitae; Viktor's Grapple went out at +664 ms (the play-test's order). The same at paceMs 100 and 300; at paceMs 0 (the arena) it arrives in time — why the arena never shows it. Tests 37n(d) and 125h fake the wait.
- **Second bug (probe):** a late Grapple stays stored and `_awaitOppGrapple` (5607) applies it to the NEXT round.
- **Fix (R2, rules, unconditional):** the before-strikes step becomes a handshake bot-vs-bot — the acting side sends its Grapple line or a frozen "nothing before strikes"; the other side waits for it (askSecs as the safety net), then answers; lines from an earlier round are discarded; older bots fall back to the timeout.
- **Test:** a two-bot relay at paceMs 300: the defender plays Grapple, the actor holding Theft must strike with hands and keep Theft (red today); a late Grapple does not restrict the next round.

### F17 — range ignored (confirmed, two bugs)
- **Tracking:** each bot keeps its own range, close at 5719; the opponent's maneuver comes through the 200 ms `_awaitOppManeuver` (5767), two maneuvers cancel (5769–5770); the strike choice honours long (3930, `longFist` 5897); the receiving side never checks range: `let taken = opp ? (opp.dodge ? 0 : (opp.dealt | 0)) …` (5993).
- **(a) Viktor's Roundhouse = the race (probe):** his maneuver wait ended ~+270 ms, Hanna's "maneuvers to long" went out at +818 ms. At the client's pace this race is normal. A late maneuver also carries into the next round.
- **(b) Lloyd's "hands 1" is NOT the race:** 5771 accepts a "range correction" from ANY human's combat counter (`this._isHumanName(tf.who) && … this._cField('rng') !== undefined`). The human client's auto-join (main's section E, fixed in v2.6.158) wrote a fresh combat counter whose range is the server default, close; the bot's baseline (5616) came from the block counter (no range field), so the default reads as a change. Probe: after "maneuvers to long" the bot logs "the tally says close (a human's correction) -- the field wins", then "strikes (hands) for 1" — the play-test's lines. Any human counter write during a bot-vs-bot combat would still do it.
- **Fix (R2, rules):** at 5771 accept the correction only from the human who is my combat opponent (`this._phasesOn() && tf.who === this._phaseOppPlayer()`); the F16 handshake for the maneuver step; optional net at 5993 (long range: an incoming hand strike counts 0).

### F18 — Roundhouse one short (confirmed, compiler + bot)
- **Rules (KRCG):** "[pot] Strike: hand strike at +2 damage. [POT] … +3".
- **Compiler:** `cardfx-compile.js:342` `put('strike', num(m[1]))` for "hand strike at +N damage" and 343 for "this strike is at +N" — the bonus lands in `strike`, the field "Strike: N damage" (328) uses for absolute damage. Only `strengthBonus` (Preternatural Strength, curated, read by `_strengthBonus` 3592) exists as a bonus field.
- **Bot:** reads `strike` as absolute damage at 3929–3933, `dealt = strike.n` (5941), 4102, and the rush planning 2784 / 2799.
- **Probe:** Ryan + Roundhouse deals 2 (rules 3); + Preternatural Strength [pot] 2 (4); Wauneka + [POT] + [POT] 3 (6).
- **Scope:** in our six decks only Roundhouse (Nosferatu, 8 copies) — .44 Magnum's "2R" is absolute and right. Library-wide 36 cards match the two patterns (25 + 11, `vtes.json` 14 Oct).
- **Fix (R2, rules):** the compiler writes `handBonus: N` (keeping `handStrike`) for 342 / 343; one helper `max(0, 1 + strength + crypt modifier + handBonus)` at the five sites; the checks at 3991 / 4005 that skip strike cards (`typeof strike === 'number'`) look at `handBonus` too. **Test:** test-cardfx — Roundhouse has `handBonus` 2 / 3 and no `strike`; the suite — Ryan + Roundhouse deals 3, 4 with Preternatural Strength [pot].

### F19 — stolen blood (not a bug)
- Writes to Trevon's blood in order: Telepathic Misdirection's cost (5546 / 7174: 6 → 5, no double charge); the steal (5916 `stealTake = Math.min(steal.n, this._stealAvail())`, 5926 `Math.min(myVamp.cap | 0, before + stealTake)`); the damage (6034).
- **Rule:** stolen blood arrives before damage is mended, and blood over capacity drains at once: 5 + 2 = 7 → 6 (capacity) → −1 = 5. The report's 6 applies the damage before the steal. Probe: the human vampire at 3 or at 1 blood, Trevon ends at 5 either way; within round 1 the human's taken line arrives after the bot's strike, so `rec.bloodAt` / `_combatAt` do not enter.
- **Edge case to pin (R2):** both combatants play Theft of Vitae — "they resolve simultaneously: blood amounts are adjusted by the total of gain and loss and no blood wear off" [ANK 20200123] [LSJ 20041027]. Not checked in the bot yet.
- **Wording (R1):** the lines print the card's number (5930 / 5934) and hide the drain — e.g. "steals 2 (1 drains off at capacity 6)". Test: Trevon at 5/6 with Theft [THA] against a fist ends at 5.

### F20 — the Edge is never handed over on the wire (confirmed)
- The bot sets `this.edge = true` after a successful bleed (8533) and publishes `edge: true`, but never sends `edgeTake` (the word does not occur in the file). The protocol's `edgeTake {clearOnly}` → broadcast `edgeTake {bySeat}` is what makes the Edge unique on the human clients; client v2.6.151 now draws the mark from `pub.edge`, but the human's own Edge stays lit until they act.
- **Fix (R1):** send `edgeTake` when the bot gains the Edge (and only then — gated on n ≥ 1, F15). **Main:** the hotseat bridge's `_fromBot` switch has no `edgeTake` case, so offline it is dropped (handoff).

### F21 — Revelations against a bot (confirmed)
- The human-line branch (6509) arms [aus] only on an explicit pool aim at this bot (6515): `…Revelations \[(aus|AUS)\]\.(?: Target: (.+?)'s pool\.)?$`. A vampire aim never matches; no aim gives nothing to compare. Probe: no peek armed, no `revealHand` sent.
- Even when armed, the `logTo` handler (974) accepts only the bot-written `Revelations: discard X.` (8411); the human client's pick (`⋖ Claude targets X (revealed to you — they are targeting it).`, client logTo) is ignored.
- **Fix (R4, bot):** Revelations is prey-locked, so arm it whenever this bot is the actor's prey, ignoring the suffix; read a bare "plays Revelations." as [aus]; after revealing, accept that client logTo shape or a chat `discard <card>` from the actor, and say how. **Main:** online nothing; offline the bridge drops `revealHand` / `logTo`, and the client sends that logTo only `inRoom()` (handoff).

## D. Decisions

### F22 — turn-1 discards of key cards (confirmed)
- The discard phase (8580) calls `_deadHandIndex(readyVampires)` (8583, defined 1422): a card is dead when no READY vampire can use any of its modes. With no ready vampire `[].some()` is false, so every card is dead and the FIRST card in hand goes. The Barrens (4710) and the hand-size revert (4565) use the same helper.
- **Johan's case (15 Oct): Tremere discarded Theft of Vitae and then had no strike after blocking** — every vampire in the Tremere starter has [tha], so Theft of Vitae is dead only when no vampire is ready (probe: no ready vampire → "discards Theft of Vitae"; Lauren ready, locked or not → kept). Same root.
- **Fix (R1):** judge against ready + torpor + uncontrolled vampires; when all are empty, against the deck's crypt list; when no card is dead, skip the discard (it is optional). **Test:** no ready vampire and 4 uncontrolled → −1, no turn-1 discard; the Tremere hand keeps Theft of Vitae.

### F23 — Haven Uncovered on its own side; the curation claim (confirmed)
- **Rules (KRCG):** Haven Uncovered — "Put this card on a ready vampire. Minions can enter combat with this vampire as a +1 stealth Ⓓ action."; The Labyrinth — "Unique location. You can lock this card to give a Nosferatu you control +1 stealth."; Guardian Angel — "Put this card on a ready vampire you control. +1 intercept during bleed actions directed at you … can prevent 1 damage each combat."; Wasserschloss Anif — a blood bank for Tremere.
- **How it is played:** `_bestMasterFor` sets `curated = src === 'hand'` (4404); a host is picked only for income / archetype masters (7878), and `_hostVampFor` returns one of the bot's own vampires; any other persistent master goes on the bot's own board (7980); nothing ever targets an opponent's vampire. The note "(uncurated — adjust if needed)" prints when `!d.pick.curated` (7996): "no hand-curated entry", not "partially known".
- **What does nothing:** Haven Uncovered, The Labyrinth, Wasserschloss Anif, Guardian Angel (the stealth finder is type-filtered to modifiers, 1501; intercept is read from reaction / modifier cards in hand, 3878, or borne equipment / retainers, 2263). Elder Library (4533) and Ventrue HQ (3233) do work.
- **The coverage tool** credits a master FULL when any reader of its fx key exists anywhere (`gen-deck-coverage.js`, 15 Oct: Nosferatu 77/77 FULL incl. Guardian Angel, Haven Uncovered, The Labyrinth; Tremere 75 FULL incl. Wasserschloss, 1 INERT .44 Magnum, 1 PARTIAL Bowl [AUS]; Malkavian 71 FULL, 4 PARTIAL Spying Mission [OBF], 2 HANDLER; Ventrue 77). 51 of the 94 per-deck library entries in the four starters are auto-compiled.
- **Fix:** R0 corrects the guide (done in v0.6.199). R4: curate the six masters — Haven Uncovered held until a rush consumer exists (doctrine 344) or played on an opponent's vampire (Johan's call), The Labyrinth's lock-for-stealth from the board (the Marked Path shape), Guardian Angel's intercept and prevent, Wasserschloss's bank; the coverage tool credits a master only with a board consumer. **Test:** test-cardfx asserts every master in the four V5 decks is `src:'hand'` (red today with these six names).

## Added 15 Oct — two tester reports
- **Debug mode, offline and on a private server: the bots' hands and ash heaps cannot be seen.** See section E.
- **Odd discards** — F22 above.

## E. Debug mode: hands and ash heaps (15 Oct, a tester who plays offline or on a private server)
An audit like the others (client v2.6.158, srv-2.6.46, bot v0.6.198), reproduced in headless Chromium and with a scripted human beside a debug bot on a copy of the server. **The bot's side of the wire works; the faults that hide the hand are mostly in the client.**
- **Offline — the hand is never offered (client).** The bridge forwards the bot's `openHand` (client line 11874) and `net.openHandFrom[2]` holds its 7 cards, but `openHandCardsFor()` (6346–6367) reads only the stored board for that seat when offline — for a bot seat a placeholder (`openHand: []`, built at 10802) — so "👁 Inspect their hand" never appears. A bot's Revelations [AUS] open hand is hidden the same way (read). Patching `openHandCardsFor` in the page to use `net.openHandFrom` made the item appear with the right cards. Their test 2779–2784 checks `net.openHandFrom[2]`, not what the menu reads.
- **Online — the wire works.** The grant arrives after `started` / `dealt` (the server's `started` gate, srv 939), 13 live updates in the run; the item "👁 Inspect their hand (7)" shows the bot's real cards. **But it is only in the pool globe's right-click menu**, and on a Structured table the other seats' globes are not on the Home view — only in the overview (V), a seat visit (1–6) or the Table panel; the tooltip mentions only the ash heap.
- **Enabling debug (client):** `botDebugAllowed()` (11563) reads the offline Helpers dropdown `#offHelpers`, which is always in the page — after Play offline was opened once with its Classic default (Tournament), a normal online room refuses Debug with a false "Tournament mode" tooltip. Offline, `renderOfflineSeats()` runs `botDebugSync()` before `syncOffBotLock()` (10951–10952), so the first bot toggle greys Debug with the same false tooltip until something redraws. Debug is fixed when a bot is created (11208); our guide said "toggling it later takes effect on the next deal" — wrong (fixed in v0.6.199's guide).
- **Command-line bot (bot):** `parseArgs` (8629–8646) has no `--debug` flag and ignores it silently — a private-server table launched from the command line cannot have a debug bot. A CLI bot is also not under any client's tournament check, so the flag must come with the bot's own refusal in a Tournament room (the room's helper policy reaches the bot in `joined`).
- **The ash heap works in every path (not debug-specific):** a remote ash heap is built from the seat's published cards with `zone: 'ash'`, kept with names by the server (srv 484, ≤ 400 cards), published by the bot the way a human client does (bot 924–937, `_toAsh` 6700–6704). "🜂 View their ash heap (N)" shows the right names online and offline. It is hard to find: Structured mats (`buildMat`) draw no ash pile, and our guide's seat-menu list did not mention the item (added in v0.6.199).
- **Nearby:** `net.openHandFrom` is cleared only at page load — the next room or game can offer an old hand for that seat number (client, read); **a debug bot's open hand also reaches the other bots, which treat it as certain knowledge** (bot 2225 → `_pCat` 2249 → the intercept odds at 7189, 7238, 8038), so a table with debug bots does not play like a normal one (bot; the guide now says so).
- **Rounds:** the guide in R0 (done); the bot's `--debug` / `--no-debug-weights` flags with a Tournament refusal, and the debug grant sent to human seats only, in R1; the client items in `HANDOFF-to-main-2026-10-15-v0_6_199.md`.

## The rounds

| Round | Content | Size |
| --- | --- | --- |
| **R0** (v0.6.199, 15 Oct) | the read-only copies (client v2.6.158, srv-2.6.46, protocol); the guide (main's §F, Release hold per bot, curated → covered, the taken line is a report, versions); the data lines (root + bot CLAUDE.md, README, SKILLS, `bot/.gitignore`); `_openSlot` bounded; this review | small |
| **R1** | F8, F9, F1 (the right to block), F15, F20 (+ handoff for the bridge), F22 (incl. Johan's Theft of Vitae case), Creeping ×3, the F19 wording; debug: `--debug` on the command line with a Tournament refusal, the open hand to human seats only (E — Johan 16 Oct: debug is for humans only) | medium |
| **R2** | the bot-vs-bot step handshake (F16, F17a, F7's "does not press"); the range correction only from my human opponent (F17b); `_holdGate` in every step (F5); pacing bot-vs-bot combat when a human is seated (F7); the Roundhouse class `handBonus` (F18); the double-Theft edge case (F19) | larger |
| **R3** | the clock starts when the question leaves the queue (F3, F11); stale hold lines dropped (F4); the blocker's verdict wait (F10); one spokesbot for table remarks (F2 — the pool question stays per bot, Johan 16 Oct); the tempo levers (a)–(d) of F12 / F13, not Adaptive's skip under Standard | largest risk |
| **R4** | the six masters curated (Haven Uncovered: not played until the bot can rush through it, then on an opponent's vampire — Johan 16 Oct); the coverage tool's master rule; Revelations against a bot (F21) | medium |

Gates beyond the suite for R2: a series with the handshake integrity line at 100 % (`ana-combat2.py`) and `ana-ledger.py`. After the rounds: the same scenario in main's rig (`client/playtest/`, `--dir` on a scratch copy of the root with the bot branch), compared with the 14 Oct report's numbers.

**For main (`HANDOFF-to-main-2026-10-15-v0_6_199.md`):** the offline open hand (`openHandCardsFor`), `botDebugAllowed()` online, the Debug row's first draw, stale `net.openHandFrom`, the ash pile / hand on the mat; the bridge relays `edgeTake` (R1); offline `revealHand` / `logTo` for Revelations (R4).

## Decided with Johan (16 Oct)
1. **The order:** R1 → R2 → R3 → R4.
2. **Bot-vs-bot combat is paced** step by step when a human is seated (R2); the arena at paceMs 0 is untouched.
3. **Adaptive's skip stays in Adaptive;** Standard keeps asking every question (the rules-safe levers (a)–(d) in R3 only).
4. **The pool question stays per bot** at political actions — its answer is the bot's stake and its vote. Only a directed action narrows it to the target (R1). A better allocation (per-seat answers in one question) is for later.
5. **Haven Uncovered:** not played until the bot can rush through it, then on an opponent's vampire (R4).
6. **The rig:** we run the scenario ourselves with `--dir` once R1–R3 are in; main can repeat it on the root bundle after the release.
7. **A hold stops the bot's own combat moves too,** not only the clocks (R2).
8. **Debug is for humans only:** the debug bot's open hand goes to human seats, not to the other bots (R1).
