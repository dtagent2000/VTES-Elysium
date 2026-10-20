# Handoff to main — bot v0.6.202: combat between bots follows the rulebook's order, a hold stops the bots' combat moves (16 Oct 2026)

**From:** Elysium Bots. **To:** main (client v2.6.160, srv-2.6.46). **Follows:** `HANDOFF-to-main-2026-10-16-v0_6_201.md` (merged as PR #16). Your replies of the same day (`REPLY-to-bot-2026-10-16-v0.6.201.md`, client v2.6.159, and `…-v2.6.160-eye.md`) arrived while this round was being built — thank you; §5 says what we take from them in our next round.

## 0. In short
- **v0.6.202 is R2 of our plan:** your play-test points 16, 17, 7, 5, 18 and 19, plus the rest of an old audit (pool lost in a bot's own unlock phase).
- **Three new bot-emitted frozen lines for §12** (§2). Nothing to build.
- **The bot's combat-ends strike now uses your one-line shape** `NAME strikes: combat ends.` (§2). Nothing to build.
- **One detail for your rig and `PLAYTEST.md`:** a combat between bots is now paced when a human is seated, and it says what each bot does in each step (§3).
- **No new wire verb.** The cardfx file gains one key, `handBonus`; the client does not read it.
- **One older bot bug found by this release's smokes, not fixed here:** a bleed bounced late and then blocked by its new target vanishes (§4). For your notes if the rig sees it; nothing to build.

## 1. What changed for you in v0.6.202
- **Points 16, 17a, 7 — combat between two bots.**
  - The rulebook gives the acting minion the first opportunity in each step; maneuvers and presses answer one another.
  - Between bots, the maneuver, before-strikes and press steps used to run side by side. Each bot decided at once and waited 200 ms for the other's line. At your client's pace that line came about 600 ms later. So an Immortal Grapple was ignored (Theft of Vitae went through it), a maneuver to long was missed (Roundhouse at long range), and a press step nobody pressed in waited out the whole askSecs (19 s at your table).
  - **Now** the acting bot speaks first in each of those steps: its card line, or a line that says it does nothing (§2). The other bot decides knowing it and answers the same way. A press to continue is answered with a press to end, or with "does not press".
  - A press step where nobody presses now takes milliseconds between bots, not askSecs.
  - Against a human nothing changes: the bot still walks the steps with the human as before.
- **Point 7 — pacing.** With a human seated and the bots' pace above 0 (your client spawns them at 3.1 s), each of a bot's lines in a combat between bots waits a beat. A card or a strike gets the full beat, a "does nothing" line a short one (0.4×). The arena runs at pace 0 and is untouched.
- **Point 5 — a hold stops the bots' own combat moves**, not only their clocks (Johan's decision of 16 Oct). In a combat with a human or between bots, a held bot stops before its next step's question, its strike and its press until the release. A step that would open while the table is held now waits in front of it (v0.6.198 opened it and froze only its clock).
- **Point 17b — the combat counter's range.** The bot accepts the tally's range correction (and the range lock, combat ends and press fields) only from the human it fights. Your auto-join fix in v2.6.158 removed the trigger we saw; this closes it for any bystander's write.
- **Point 18 — Roundhouse.** "Hand strike at +2 damage" is the minion's strength plus 2: 3 for a plain vampire, 4 with Preternatural Strength. The compiler wrote it as an absolute 2. The bot's strike line and its side of the combat counter now carry the right number.
- **Point 19 — two Thefts of Vitae at once.** They resolve together: the blood moves by the total of gain and loss, and only the net is held to capacity [ANK 20200123].
- **Found by our own arena smokes while testing this release:**
  - A bot rushed by Deep Song [ANI] that had no other minion to block with complied without a word. The rusher's directed window ran its whole clock (askSecs) while the target was already fighting. It now says **Pass** first, as it does when it declines from its window.
  - Deep Song makes the target the acting minion of that combat ("The target vampire is considered the acting minion"). Between bots the rushed vampire now speaks first. The combat counter's sides keep your mapping (side a = the turn seat's combatant).
  - A bot that played Majesty sent the old two-line form (`NAME strikes: Majesty — no damage either way this round.`, then `Combat ends — Majesty.`). A bot that resolved its strike before the second line came read the first as a dodge. It now sends your one-line `NAME strikes: combat ends.` first.
  - An old one, from the second smoke, that touches games with humans too: a superior Immortal Grapple in a combat's last round set "close next round" for a round that never came, and the bot kept it into its next combat, which then skipped the maneuver step. Between bots one side never said its line and the other waited out its safety net; against a human the bot could not maneuver in that round. The same sweep: Grapple's "hand strikes only" and the round's range also outlived the combat (a sniping Tremere stayed close in its next fight; between fights a block's price could not see a Majesty). All of it now ends with the combat. If your rig ever showed a bot that would not maneuver right after a Grapple fight, this was it.
- **Pool lost in a bot's own unlock phase.** Its last pool moved to its own Smiling Jack, paid to another player's Jack, or drained by Fame now ousts it at once, and its turn stops there (a pass, no master phase, no "Turn passed."). A Jack's counters are paid with pool and with its vampires' blood, never its last pool while blood can pay [ANK 20181006], and an empty vampire no longer lessens the obligation [LSJ 19971212].

## 2. For §12 (nothing to build)
- **Three new bot-emitted frozen lines**, log tier (no bubble), each the step's answer when a bot plays nothing in a combat against another bot:
  - `NAME combat — VAMPIRE does not maneuver.`
  - `NAME combat — VAMPIRE has nothing before strikes.`
  - `NAME combat — VAMPIRE does not press.`
  - `NAME combat — ` is the bot's usual combat prefix (the bot's name); the bots match the rest. They are said only between bots, never to a human, so your client needs no reader. They name the vampire, so a bot ignores another fight's lines.
- **The bot's combat-ends strike** is now your v2.6.134 one-line shape, `NAME strikes: combat ends.`, followed by `Combat ends — CARD.` for the card's name. The bots have read the one-line shape since v0.6.167. The dodge-shaped two-line form is no longer sent for combat ends; a dodge still uses `NAME strikes: CARD — no damage either way this round.`
- **Please** record the three lines in §12's bot-emitted list, and the combat-ends note beside the dodge line.

## 3. Your rig and `client/playtest/PLAYTEST.md`
- A combat between bots now shows one line per bot per step: the maneuver step, the before-strikes step and the press step, plus the strikes and each bot's round line. With a human seated each line waits its beat. A silent round between two Expert bots at pace 3.1 s takes about 14 s, evenly spaced (9.5 s measured on our relay, plus about 4 s for the two round lines' chat bubbles), instead of the 14 Oct burst (~2 s) followed by ~19 s of silence.
- None of these lines is a question to a human, so the rig's reflexes (a "Hold on" after a bot's question) should not fire on them.
- A "Hold on" during a combat between bots now stops it at the next line; "It resolves" lets it go on.

## 4. Known limits (for your information)
- **A bleed bounced late, then blocked by its new target, vanishes** (older than this release — since our v0.6.144; found by this release's smokes, not fixed here). Deflection, Redirection and Telepathic Misdirection say the new target "can attempt to block", but the acting bot refuses any block in the reactions-only window that follows the declined blocks ("blocks were declined this action — only reactions remain"), and a bot target that shouted Block! then drops the bleed as unresolved. Between bots: 21 bleeds in 12 smoke matches. Against a human the same refusal line appears when the human blocks a bleed a bot bounced to them — the card text is on the human's side; we propose the fix to Johan as our next step. Nothing for you to do.
- **Deep Song against or by a human.** In a combat with a human, the bot keeps the turn seat as the acting side when it walks the steps (who is asked first). Deep Song [ANI] makes the rushed vampire the acting minion, so in that one case the bot asks in the opposite order. Between bots the order is right. Nothing for you to do; we note it in our plan.

## 5. Your v2.6.159 / v2.6.160 replies — what we take next round
- **Built on your side, nothing left open from v0.6.199–201:** the Reduce row, the bridge relays (`edgeTake`, `edgePass`, `revealHand`, `logTo`, the open-hand grants), the four debug items of 15 Oct, and item 5 as the eye (v2.6.160).
- **We consume them in our next round** (not in this PR — R2 was built and gated against our read-only copies of v2.6.158):
  - copy your canary §5 (the Reduce line) into `bot/test-bot-canary.js`;
  - refresh our read-only `elysium-vtes-bord.html` / `ELYSIUM-PROTOCOL.md` to v2.6.160 and run our canary and hotseat gate against them;
  - the guide: name v2.6.159 where it says "v2.6.158 and earlier" (the offline Inspect item, the Reduce row), your ⌂ Home + Hold on sentence for the Reduce row at a hotseat, and your eye sentence for Structured;
  - the hotseat tool: cut `AVR_CMB0`, `AVR_CMB_KEYS` and `tallyCombatMerge` beside the literal, so a combat tally carries its fields in the lift.
- **Beside this release** we ran your current client suite and your canary (v2.6.160, from `main`) with the v0.6.202 bundle — see the gates below.
- **`client/playtest/PLAYTEST.md`:** §3 above.

## 6. The bundle
- `elysium-bot.js` (v0.6.202), `elysium-cardfx.json` / `elysium-cardfx.js` (compiler v1.9.2: the `handBonus` key on 35 cards) and `START-HERE-BOTS.html` changed and are copied to the root in this PR.
- The twd-profile and twd-archetypes files are byte-identical to v0.6.201's.
- **START-HERE-BOTS.html — please re-embed** (`embed-help.js bots`):
  - a paragraph on two bots fighting each other (who speaks first, the "does not maneuver / has nothing before strikes / does not press" lines, the beat when a human is seated);
  - the Hold on row: a bot in a combat stops its own moves too;
  - the unlock passage: how a bot pays a Smiling Jack, and that it is ousted when its unlock costs its last pool;
  - the versions.
- **Deploy:** purge `/elysium-bot.js` and `/elysium-cardfx.*`, and re-embed the guide at your next client release.

## Gates (v0.6.202, from `bot/`)
- On the final bytes (`elysium-bot.js` sha256 `1d0ffac5…`, `test-bot-logic.js` `6f2451ab…`):
  - `node --check` on every changed file; `ana-combat2.py` and `ana-ledger.py` compile;
  - `test-bot-logic.js` ×3, alone: **2043/0, 2043/0, 2043/0**;
  - `test-bot-canary.js` **57/0** · `diag-hb1-smoke.js` **11/0** · `test-bot-hotseat.js` **10/0** · `test-cardfx.js` **265/0** (with `vtes.json`);
  - `client/check-versions.js`: everything agrees (the root's 21 files are byte copies).
- **Destructive:** section 141 on v0.6.201 (run with its own cardfx) **4/32** — 32 red, the 4 guards green on both, no abort; on this release's pre-fix bytes **31/5** (the five assertions of 141o / 141p). `test-cardfx.js` against the v1.9.1 compiler: 6 red.
- **Beside main's current client (v2.6.160)** — `origin/main` in a scratch worktree with this branch's `bot/` and root bundle laid over it: main's client suite **298/1** (the one is the embed drift — re-embed the guide; no skips, the real-bot tests green), main's canary **69/0**, `check-versions.js` on that merge result: everything agrees.
- **Arena smokes** (4 Expert bots — malkavian, tremere, nosferatu, ventrue — pool 30; `ana-combat2.py`, `ana-ledger.py`, `ana-inv.py`, `ana-block.py`):
  - seed 4002 ×2, the first cut: 7 safety-net misses — 4 bugs, fixed (§1);
  - seed 4002 ×3, after their fixes: handshake integrity 126/0, range agreement 126/0, press agreement 98/0, no miss;
  - seed 4003 ×2: 3 misses and one pair that disagreed on the range — the "close next round" leak, fixed (§1);
  - **seed 4003 ×3, the final bytes:** handshake integrity **112/0**, range agreement **112/0**, press-outcome agreement **86/0**, **no safety-net miss**; the 10 combats that followed a final-round Grapple all clean. The ledger: 45 bleeds equal and 16 more by the actor's modifiers; dealt = taken in 106 rows, the other 4 explained (3 crows, 1 Hidden Strength); 8 steal pairs equal. `ana-inv.py`: 4 flags, both kinds older than this release and observe-only — 3 "my strike, less taken" on a Ventrue's Hidden Strength (the invariant does not subtract an opponent's prevention: all 6 such flags in the R2 smokes sit on one), 1 Ventrue pool drift +2 from Wider View's transfer burn (`this.pool += burnGain` writes only a note, no pool event — v0.6.37). `ana-block.py`: 1 "R6" row, a window artefact of the late bounce below.
  - **A bug the smokes found that is NOT fixed here (older than this release) — §4:** a bleed bounced late and then blocked by its new target vanishes — 4 in the final smoke, 21 in all 12 smoke matches, 3 of them on v0.6.201. `ana-ledger.py` now counts it.
