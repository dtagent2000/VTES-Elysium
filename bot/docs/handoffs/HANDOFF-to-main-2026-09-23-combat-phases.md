# HANDOFF — bot v0.6.166 to main, before Johan's client test (23 Sep 2026)

**From:** the bot project. **To:** main (client v2.6.132 / srv-2.6.39). **Answers:** `spec-bot-combat-fields-2026-09-23.md`.

## 1. What to deploy
- **Online:** replace the bot processes' `elysium-bot.js` with v0.6.166. Run it against **srv-2.6.39**. An older server drops the combat fields: the lines still work, but the Damage panel will not show the bot's damage.
- **Offline / hotseat:** please **bundle v0.6.166 into the client build**. Otherwise hotseat keeps running the old bot.
- **Helper lock:** unchanged, stays on. Johan wants everything right on Structured + helpers first.

## 2. What the bot now does on the wire
From your spec §4:
- **Damage:** its strike's damage on its own side (`a` when acting, else `b`) with `sa`/`sb`. The combat announce no longer sends `a:0, b:0`.
- **Range:** `rng` after its range step. `nx: 'close'` plus the line `NAME sets range to close next round.` on a superior Immortal Grapple.
- **Press and prevention:** `pr` at its press (`continue` / `end`). `pa`/`pb` when it prevents.
- **Rounds:** `rd` for round 2+.

Reading:
- It reads `rng`/`rl`, `pr` and `ce` as data. A human's field that disagrees with the last line wins.
- It parses `sets range to … [next round].` and `gets … additional strike(s)` (logged only).

New in v0.6.165–166, against a **human** combat opponent only (bot-vs-bot unchanged):
- **Questions:** it chats Johan's step questions / "I have nothing …" phrases on the chat tier, and waits for your lines, No/Pass (chat or the say buttons), a human `ph` step, or its clock.
- **`ph` writes:** it WRITES `ph` as a hint: 0, 1, 2, 3 at each step; **4 at Damage resolution, then 5 to step past it**; 5 at Press; 6 at End of round. **It relies on your rule that the human's client writes its automatic taken line when the table steps past Damage — including when a BOT moves `ph` from 4 to 5.**

## 3. Please check (quick)
1. **A bot's `ph` 4 → 5 write triggers the human owner's automatic taken line.** Your spec says "when the table steps past Damage"; please confirm a bot-written step counts.
2. **Round wrap.** At the start of round 2 the bot writes `rd: 2`, then `ph: 0`, 1, 2 … Please confirm the client does not read the ph 6 → 0 drop as a Back step. It should not re-fire anything, nor clear a human's entries for the new round.
3. **`duelCid` announce** is still sent at the start of every round (unchanged since v1). Confirm this is harmless under the per-round `a`/`b` semantics, now that it carries no `a`/`b`.
4. **Optional:** a hotseat test with a scripted human seat in a combat vs a bot. Our gate (10/0) runs bots only, so the phase talk has only been exercised in unit tests (incl. a lines-only round with no tally).

## 4. Known limits for the test (not bugs)
- **One exchange per step.** When the bot answers a human's play with a card, the human's further answer in that step is not awaited.
- **Silent steps.** A silent step costs up to `phaseSecs` (default max(6 s, 3 × askSecs)).
- **Additional strikes.** No *Any additional strikes?* yet; the bot resolves one strike pair per round.
- **Rollback without a new file:** `combatPhases: 0` (the phase talk), `combatMind: 0` (combat decisions). Rule fixes and the handshake stay in either case.
