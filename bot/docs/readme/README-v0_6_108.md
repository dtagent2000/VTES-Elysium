# elysium-bot v0.6.108 — delivery bundle (12 September 2026)

Session: offline play on elysium.cards, 2 bots + 1 human. Started as an
influence rules bug, ended covering the client project's 12 Sep handoff.

## What's in here

| File | What it is |
|---|---|
| `elysium-bot.js` | **The only code file.** v0.6.107 → v0.6.108. Drop-in replacement. |
| `elysium-bot-CHANGELOG.md` | Updated: v0.6.108 entry + the outgoing v0.6.107 note moved out of `BOT_VERSION` per the file's own convention. |
| `elysium-bot-session-journal.md` | Updated: new entry prepended (Swedish, existing format). |
| `elysium-bot-learnings.md` | Updated: nine v0.6.108 learnings, header bumped. |
| `elysium-bot-influence-planner-spec.md` | **New.** The planner design, marked IMPLEMENTED with the two deltas from spec. |
| `elysium-bot-handoff-reply-2026-09-12.md` | **New. Send this to the client project.** Answers all four handoff items and names two workarounds they can now delete. |
| `test-*.js` | Targeted tests written this session. Run with `node test-<name>.js` from this folder. |

Nothing else in the project changed. The arena, cardfx, table launcher,
decks and protocol docs are untouched.

## What changed in the bot

**Influence (rules correctness).** Transfers are a fresh per-turn grant, not an
accumulating pool. The opening stagger is table-wide
(`tableTurn = (ownTurns-1)*nPlayers + seat`, capped at 4) rather than
seat-based, which only diverged at seat 1 of a 2-player game on its second turn.
Blood is invested one transfer at a time and a vampire rises when it reaches
capacity, so it can sit in uncontrolled with partial blood across turns.

**`_planInfluence` (new).** Simulates fill-orderings over the known transfer
schedule, scoring tempo / efficiency / hand synergy. Surplus transfers are
modelled as crypt draws, not waste. `_pickRaise` kept unchanged.

**Multi-bot chat.** One greeting per table, persona names with a `(bot)` suffix,
scoped damage grammar (`@Name bleed N` to aim), `say()` respects its own bubble,
30 s turn watchdog.

**The unified hold rule.** `_holdHook` is tracking only; `_holdGate()` in
`_pace` announces and arms the reminder, so the bot that is actually blocked
speaks. Bot filter on the ask-window pause. Release from any non-bot clears the
whole set. Queued `turn` with a staleness guard.

Full detail: the CHANGELOG entry and the journal entry.

## Before you trust it

**The suite and a 5p30 series were not run in this session** — the environment
had no network and `ws` could not be installed. Every change has a targeted test
here and they pass, but nothing has been verified in aggregate.

Suggested order:

```powershell
node --check elysium-bot.js
node test-bot-logic.js        # expect N/0
node test-bot-canary.js
node elysium-bot-arena.js --matches 3 --bots 5 --start-pool 30 --trace ./serie-v0_6_108
node gen-batch-review.js ./serie-v0_6_108
```

In the trace, `influence-plan` emits are the new thing to read: `parts.firstRise`,
`parts.waste`, `parts.draws`, `order`.

For mixed play try `--pace 1800`. The client's say bubble is 3 s and a card play
is ~1.74 s; at the old `--pace 900` the bot could start its next act mid-animation.

## Known-uncertain

- **The planner weights (3.0 / 1.0 / 2.0 / 1.5) are uncalibrated.** Tempo
  dominates by construction: a one-turn edge is worth 3.0 and synergy is capped
  at 3.5 total, so synergy almost never flips an ordering. Whether that is right
  is an arena question, not a code question.
- **No `_pace` ceiling was added.** Reasoning in the handoff reply, §Item 4.
- **Bot names must not contain spaces** — the inter-bot combat parsers match
  `\S+ combat`.
