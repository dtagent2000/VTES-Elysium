# Elysium Bots — delivery 19 October 2026 (late evening): bot v0.6.209 → **v0.6.210**, THE LAST POOL — DEPLOY CANDIDATE

**What it is.** A fix the sim table found while v0.6.209's numbers were being checked (the round's own review). By Johan's
16 Oct combining rule it may ride in the round; it ships as a PR of its own **stacked on PR #35 (v0.6.209) — merge #35 first.**
v0.6.209's READ-ME-FIRST (`READ-ME-FIRST-2026-10-19b.md`) stands for everything else, and the sim table's evidence is
`docs/reports/REPORT-sim-table.md` (§7 is this round).

## 1. The fault
- `_bestMasterFor` admitted a master at `cost > pool`. A bot at pool 1 paid its last pool for Vessel (or Wider View, Ventrue
  Headquarters, The Labyrinth); one at pool 2 paid its last two for a Hunting Ground (or Arcane Library, Pentex Subversion,
  Warsaw Station, Guardian Angel). Every case was in the bot's own master phase.
- "A Methuselah with no pool is ousted", but nothing ousted the bot. It played on at 0 until a bleed took it below 0, while the
  other bots' no-server net (v0.6.147) had already read it as out.
- **On v0.6.209's 240-match baseline:** 35 bots in 33 matches (Tremere 12, Nosferatu 10, Ventrue 9, Malkavian 4). After the
  payment they made 101 actions that went through, 65 card plays, 46 blocks and 5 referendum calls, and 3 of the 35 went on to
  win. v0.6.208 has the same fault.
- **The same comparison in two more finders:** the equip finder (.44 Magnum costs 2 pool) and the fetch finder's target. The
  ally finder ("leave >= 1 pool") and the political finder (`cost >= pool`) were already right.
- **Two fixtures locked the bug in.** Section 19c had asserted "with 1 pool both income assets are affordable candidates"
  since July, and section 24 played The Parthenon (2 pool) at pool 2 — its five assertions were the first run's five reds.

## 2. The fix (v0.6.210)
- **The finders:** a pool cost must leave me at least 1 pool — in `_bestMasterFor` and the master loop's re-check after the
  pace, in `_bestEquipActionFor`, and for the target in `_bestFetchFor`.
- **The net (the v0.6.140 / v0.6.202 audit, one phase further):** 0 pool after my master phase, or before a minion's action,
  ousts me at once. A master-phase oust stops the turn — no minion phase, no "Turn passed.", the pass hands the turn on — the
  way an unlock-phase oust already did.
- **Section 156 (8 assertions):**
  - the master finder at pool 1 and 2 (Vessel), and at pool 2 and 3 (Asylum Hunting Ground);
  - the equip finder and the fetch finder with .44 Magnum at pool 2 and 3;
  - a whole turn at pool 1 with Vessel in hand: Vessel stays, the turn passes as usual;
  - a master phase that ends at 0 pool: ousted at once, bounty, pass, no minion phase.
- **Destructive check:** 2/6 on v0.6.209's `elysium-bot.js` (156a, the first 156c, and 156d–g red; 156b and the second 156c
  are green by design).
- **19c:** now pool 2. **Section 24** (the live Parthenon integration) set pool 2 for a card that costs 2 — the same
  pattern — and now sets 3: it tests the lock, not the price.

## 3. Footprint and the new baseline
- **The footprint** (`ana-sim-diff.py`, the same 240-match all-seatings design, v0.6.209 → v0.6.210): 200 SAME-PLAY and 40
  DIVERGED. In every diverged match the first change is a master pick.
  - 33 are exactly the matches with a bot at 0 pool; 23 of them have another outcome.
  - 7 had a Misdirection picked at pool 1 and then held for want of a target, so nothing was paid. With that one row dropped,
    those 7 matches are identical.
- **Master picks costing the last pool:** 44 → 0. **Bots deciding at 0 pool:** 35 → 0. The net never fired.

| Deck (client profile) | v0.6.209 wins / VP per match | v0.6.210 wins / VP per match ± SE | Arena profile, v0.6.210 |
|---|---|---|---|
| malkavian | 124 / 1.91 | 128 / 1.94 ± 0.11 | 126 / 1.95 |
| ventrue | 55 / 1.05 | 54 / 1.04 ± 0.09 | 54 / 0.96 |
| tremere | 40 / 0.77 | 40 / 0.76 ± 0.08 | 45 / 0.85 |
| nosferatu | 21 / 0.27 | 18 / 0.25 ± 0.05 | 15 / 0.24 |

- **Seating:** it still moves a deck by up to ~0.7 VP/match. Tremere scores 0.50 with Ventrue as its predator and 1.13 with
  Nosferatu; Malkavian scores 1.65 behind Ventrue and 2.36 behind Nosferatu.
- **The stable's cards on v0.6.210:**
  - Kevlar Vest: in hand in 84 matches, never equipped.
  - .44 Magnum: in hand in 103, picked 11 times, equipped 7 times, 7 strikes with it.
  - Spying Mission: 278 plays, all as the [obf] stealth.

## 4. Sim v1.0.1
- **Played at 0 pool:** a bot that decides at pool ≤ 0 before its own `ousted` row is playing while ousted.
- **Where it shows:** the result row lists them (`zeroPool`), `summary.json` sums them, and `SUMMARY.md` prints the count in
  its header and the matches under the tables. They are listed, not excluded.
- **Checked:** 4 on the 24-match design on v0.6.209, 0 on v0.6.210. `--summarize` on older traces prints "?".

Also corrected in #35's docs: v0.6.209's 16 diverged matches are 10 KRC splits that moved the overflow off the caller, and 6
calls the self-oust guard dropped (2 KRC, 4 Ancilla). They are not "12 KRC splits, 4 Ancilla calls".

## 5. Gates (on the release bytes)
- `node --check` on every changed JS file (`elysium-bot.js`, `elysium-bot-sim.js`, `test-bot-logic.js`).
- **Suite 2225/0 ×3** (alone, frozen snapshot with the root client v2.6.167 one level up, so 154f ran each time; v0.6.209: 2217, +8 = section 156;
  release bytes `elysium-bot.js` 3c3c2b71…, `test-bot-logic.js` dbadba5d…, `elysium-cardfx.json` bea73088… unchanged).
- **Canary 69/0** with `bot/`'s read-only copies and **69/0** with main's v2.6.167 client + protocol and srv-2.6.49.
- **Hotseat gate 11/0**, **HB1 11/11**.
- **Section 156 destructively:** 2/6 on v0.6.209's `elysium-bot.js` (156a, the first 156c, 156d–g red; two green by design).
- **check-versions** (run on `client/`, which checks the root too): everything agrees; the root's 21 files are byte copies of client/ or bot/.
- `test-cardfx.js` not run (cardfx unchanged).
- **The sim:** the 240-match client baseline on the final bytes with sim v1.0.1: 240 last-standing, played at 0 pool 0; against the sim v1.0.0 run of the same bytes SAME-PLAY 240, every row identical (timestamps included) once the new zeroPool field is set aside; the arena profile on the same bot bytes:
  240 last-standing, 0 crashes, 0 stuck.

## 6. Release
- `BOT_VERSION` 0.6.210. The CHANGELOG carries v0.6.210 on top (Bot) and sim v1.0.1 (Tools).
- Updated: the handshake in `bot/CLAUDE.md`, the context, the learnings, `SKILLS.md`, `README.md`, the journal, the report's
  §7 and `docs/START-HERE-BOTS-CHAT.md`. `START-HERE-BOTS.html`: version chip and footer only.
- The bundle is copied to the root.
- Handoff: `docs/handoffs/HANDOFF-to-main-2026-10-19-v0_6_210.md` (nothing for main to build; re-embed the guide).

## 7. Next
Unchanged from v0.6.209: the stable's cards (Johan's next step, waiting for his "kör" and his rule of thumb for Spying
Mission's [OBF] bank), then the V5 plan.

## 8. Anything I'm unsure about
- **The net in the turn engine never fired in 240 matches.** Section 156g tests it (a stubbed master phase that ends at 0
  pool); no real game has exercised it.
- **I did not inventory every pool payment the bot makes.** The three finders and the two that were already right cover what
  the traces show. A pool cost paid somewhere else is caught by the net before the next action, not at the moment it is paid.
- **A transient zero is invisible to the net.** In some cases a Blood Doll drain in the same master phase put the pool back
  to 1 (match 50). By the rules the bot was out at the payment anyway; only the finders prevent that now.
- **The self-oust guards (v0.6.209's referendum guard and this one) are strict "never".** I know of no rule that makes paying
  the last pool right, but I did not check the rulebook for an exception.
