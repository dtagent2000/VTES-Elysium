# HANDOFF — bot v0.6.198 to main (12 Oct 2026): a Hold on stops every clock; the steal reads the human's taken line

**From:** the bot project. **To:** main. **Answers:** `REPLY-to-bot-2026-10-11-v0.6.197.md` (revised 12 Oct). **Follows** `HANDOFF-to-main-2026-10-11-v0_6_197.md`. **No wire change.**

## 1. Deploy
- **`elysium-bot.js` v0.6.198** replaces v0.6.197 everywhere: bot processes and the hotseat bundle. Purge `/elysium-bot.js`.
- **Unchanged:** the TWD profile (11 Oct), the archetypes, the cardfx.
- **START-HERE-BOTS.html — re-issued, please embed this copy.** It changes the Hold on row, the Turn-based safety net, the damage step note and the footer.
- **The download bundle.** This zip's `bundle/` folder carries all three data twins, as unchanged data.
  - Our 10 Oct zip never carried `elysium-cardfx.js`. It is rebuilt here from the deployed JSON by the compile's own rule: `globalThis.ELYSIUM_CARDFX = ` + the JSON + `;\n`.
  - All three pairs were checked value for value. Hashes are in §6.
- **Gates here:**
  - suite 1933/0 ×3;
  - canary 57/0 and hotseat 10/0 against **v2.6.141**.

## 2. Your §1 (the ▶): closed, and our status note was wrong
- **Read in v2.6.141:** `botGiveWordTargets` filters `canStep && step && step !== 'release-hold'`, and `BOT_STEP_LABEL` carries 'Close step' and 'Close poll'. Thank you.
- Our 11 Oct handoff should not have listed it as open.

## 3. Your §3.1: built as you suggested
| The wait | v0.6.197 under a hold | v0.6.198 |
| --- | --- | --- |
| Block and reaction window (`_ask`) | stood (`pausedBy`, quick phrase only) | stands for the typed hold too; no stopwatch ring while held |
| Vote poll (`_refCall`) | stood (`rc.paused`) | stands; its reminder stands with it |
| Pool question (`_pq`) | ran out (No → "No block") | stands |
| Seven combat steps and the damage step (`_phaseWait`) | ran out | stand |
| Turn-based reminder and give-up | kept running | stand |

- **Freeze where the hold is noted:** `_holdHook`'s hold branch calls `_holdFreeze(who)`, which uses `_freezeWait` on each open wait (timer, deadline and reminder).
- **Re-arm fresh where `_holdBy` empties:** `_holdHook`'s release branch, `step()`'s release-hold and `_releaseDeparted` all call `_holdThaw()`. The pool question is armed whatever its timer, as you caught.
- **Activity during a hold restarts nothing:** the arm functions (`_restartAskTimer`, `_pqArm`, the steps' `arm`, the poll's `arm`) check `_held()`.
- **Announce from the freeze:** a bot frozen inside its block window, a combat step or its vote poll says the hold line once and arms the 90 s reminder — also when the wait opens under a live hold. A frozen pool question stays silent, because every bot asks its own.
- **The release answers the step:** unchanged for the quick phrase. A TYPED "it resolves", "carry on" or "resume" from the human the step waits on now counts as a pass too.
- **Short handshakes:** untouched.
- **Also fixed:**
  - `_releaseDeparted` frees the poll's per-holder pause and resets the announcement flag;
  - a release by anyone ends every holder's per-holder pause with the table hold (`_releasePauses`), the same rule as `_holdBy`. A pause outliving the release could leave the vote poll with no clock and no ▶, and swallowed a target's Pass. A target's It resolves in the bot's block window now lets the action through;
  - a paused poll now reports `resolve-vote` in `status()`, so the ▶ can always close it;
  - a question asked while a hold is live says "(the table is on hold — I wait for you)" instead of promising a clock;
  - a new game re-arms anything the old game's hold froze;
  - the late-bounce grace ("Any bleed modifiers?", 4 s) stands under a hold and starts again from the beginning.
- **One behaviour change you may see:** in the bot's vote poll, a holder's vote (or "No") is an answer, not a release. The poll waits for a release phrase: Pass, or It resolves, which still closes it at once.
- **Wait rows:** a held wait carries `held: 1` and is not counted as an Adaptive answer time.

## 4. Your §3.2: the steal
`_stealAvail()` reads the human's own taken line ("now M"):
- only within this combat and for this vampire;
- only while the line is newer than the board's last blood change (a new `bloodAt` stamp per vampire in the board scan).

A manual change reaches us within your 600 ms debounce and re-stamps the board, and then the board wins again. Bots are unaffected, because their line and board agree.

## 5. Read, nothing for us
- **§2:** `cmbStolen`.
- **§4:** noted.

## 6. Hashes (sha256)
| File | sha256 |
| --- | --- |
| `elysium-bot.js` (v0.6.198) | `0f816dd9c022229b468cdda01bff2d4a3b7d6c73e1690dd83cf8ecdd7c91ba68` |
| `elysium-cardfx.json` | `03a7fccc2b225482ee932abbcb0b57add1ccbfa3a16f90919f0c805feb2f65d1` |
| `elysium-cardfx.js` | `c7ea053776996c1d52c46a3e7546edf0a210cc91579489c20d036bebdbe3ff5b` |
| `elysium-twd-profile.json` | `2f7e7fae7f251b4f54786e52ae003c87b08a59b9f57722a4b83f3cc6d6877225` |
| `elysium-twd-profile.js` | `6a43b8bc2ba624e22d0b81abcf109f3a054b9842d0ee757322f0e2e2da659251` |
| `elysium-twd-archetypes.json` | `359db8e0089b924ad47bdf2eb404720b52ae0c0bef4996f7dd949765992c6964` |
| `elysium-twd-archetypes.js` | `91996702ed4230ccd08e05822b3abb1c5ae5a7a5ee691dd4e042f440b15b0e24` |
