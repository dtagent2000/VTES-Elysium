# A human's Toreador Grand Ball and the cardfx `memo` descriptor (RULINGS D-113 (3)–(4); round C, 14 Nov 2026)

*Status: built in bot v0.6.225 (round C, 14 Nov 2026); two human tables in main's play-test rig held — the pair read, and the question with its answer (CHANGELOG v0.6.225).*

Johan, 13 Nov ("alla dina förslag ovan om Jack och Grand Ball låter jättebra", on Claude's proposal of that morning; the order of
21:45: A → B → C, a human table after C). D-113 (3): "A human's Grand Ball: read the lock, the play line's acting minion and target, a
token naming the Ball; if still open, the bot that speaks for the table asks once in chat after their master phase, naming the
candidates; the public answer is every bot's memory, and unanswered, today's generous rule stays." (4): "A curated cardfx `memo`
descriptor (the roles, where each is read, the question, the token texts) keeps it general, Grand Ball first."

## 1. The card and today's rule
"Choose two ready Toreador you control, put this card in play, and lock one of the two. The locked Toreador does not unlock as normal.
The other Toreador's non-bleed actions cannot be blocked." A bot's own Ball names its pair (the frozen play line, the block-bar line,
and since v0.6.221 the tokens on its cards). A human names nothing, so since v0.6.217 no bot blocks a non-bleed action of ANY
Toreador of that human while the Ball is in play (`_humanBallFree`): generous, and wrong for every Toreador but one.

## 2. The descriptor (4)
`cardfx-curated.json`, Toreador Grand Ball, a `memo` object beside its modes:
- `pick`: what the card chooses — `{ "clan": "Toreador", "n": 2 }`.
- `roles`: one entry per lasting choice, in reading order. Each: `role` (`lock` / `free`), `field` (the bot's own card field that
  holds it: `gbLock` / `gbFree`), `token` (the text on that vampire), `ballToken` (the text on the card, `{vamp}` = its name), and
  `read` (how a human's choice is read, tried in order): `lock` = the one of their Toreador that turned locked after the play line
  and before their master phase ended; `pair` = the play line's acting minion and target, less the locked one; `token` = a custom
  token on one of their vampires whose text names the card; `only` = their one other ready, unlocked Toreador.
- `ask`: the question, `{owner}` and `{cands}` filled in.
`_memoMap` (the bot's own tokens) reads `token` / `ballToken` from it — the same texts, so the footprint is IDENTICAL.

## 3. A human's Ball (3): read first, ask last
1. **The play line.** A human's `VAMP plays Toreador Grand Ball.` (the client's line when a vampire is selected; `… was played.`
   without one), with the client's ` Target: X.` suffix when a card is aimed. Every bot records `{ seat, card, actor, target, at }`.
2. **The lock.** One of that human's Toreador that was ready and unlocked at the play line and is locked when their master phase
   ends is the locked one (several: none is taken).
3. **The free one, at the end of their master phase** (their `Phase: Minion.` line, or their next phase line): the first `read` that
   names exactly one vampire — the pair less the locked one; a token naming the card on an unlocked vampire; their only other ready,
   unlocked Toreador.
4. **The question.** Still open (two or more candidates): the bot that speaks for the table (`_isSpokesBot`) asks once, in chat:
   `NAME, your Toreador Grand Ball: which Toreador acts unblocked — A or B?` (the descriptor's `ask`). Every bot knows the
   candidates (the same public reading), so only the speaker asks.
5. **The answer.** The Ball's owner's next chat lines (until their turn ends) that name exactly one candidate (a case-insensitive
   match of its name, or of its first word when no other candidate shares it) set the free one — every bot reads it. Unanswered,
   today's generous rule stays.
6. **What reads it.** `_humanBallFree(p)`: while the Ball is in play and the free one is known, only that vampire's non-bleed actions
   are unblockable (a block of the other Toreador's action is weighed as any); unknown, the generous rule.
7. **Its end.** The memory goes with the Ball (burned, out of play, its owner ousted) or with the named vampire (out of play).

## 4. Lines and the contract
The question is a `chat()` to a human (the tier rule: a question). It is a new bot line, so it goes to main's §12 by a handoff (its
shape; nothing parses it: the answer is the human's free text). Backward compatible: an older client shows a chat bubble.

## 5. Tests and measurement
- A section through `_onLog` / `_onChat` with a human seat: (a) the pair from the play line and the lock: free known, no question;
  (b) the lock and one other Toreador: free known; (c) three Toreador, no pair: the speaker asks once, a non-speaker does not; the
  owner's answer sets the free one in both; (d) unanswered: the generous rule; (e) `_humanBallFree` before and after; (f) the
  descriptor's texts are `_memoMap`'s.
- A footprint on the 240 / the V5 smoke / the Toreador 600: IDENTICAL (no human seat; the descriptor's texts are today's).
- A human table in main's playtest rig: the human plays Toreador and a Grand Ball; the bots read it (or ask), and a bot blocks the
  other Toreador's non-bleed action while it lets the free one's through.
