# The helper gate — design decision (16 September 2026, bot v0.6.113)

*Why the bot's phase narration, counter writes and block verdicts are UNCONDITIONAL, and the alternative we chose NOT to build — kept here so it can be revisited on its merits if the assumptions below stop holding.*

## The finding

After the client's v2.6.111 fix (Create game's "All helpers on — locked" finally held), Johan's bots went quiet about their phases. Before the fix — helpers actually OFF — they had narrated `Phase: Unlock.` … `Phase: Discard.` every turn.

Root cause: five behaviours were gated on `caps.tally`, a flag the bot sets when it first OBSERVES a `tally` message on the wire:

| site | behaviour when `caps.tally` was false |
|---|---|
| `_announcePhase` | no phase lines at all |
| `_announceTallyA` | the bot's own stealth never written to the shared counter |
| `decide('block-as-target')`, directed and undirected | `classic table (no resolver) — sandbox default: let it through` for EVERY block decision |
| `_onBlockAttempt` | a shouted `Block!` conceded the block unread (instant combat) |
| `_askTimeout` | the clock could not declare a verdict |

`caps.tally` was meant as a proxy for "this is a Structured, helpers-on table". It is not one:

- **It never read the helper policy.** The server sends it on `joined` (srv 411) and as a `helperPolicy` broadcast (srv 957); the bot's `joined` handler read only `boardMode`, and `helperPolicy` had no handler at all.
- **It fired more readily on the table it meant to exclude.** A helpers-OFF human gets the bare `free` counter on screen from the first render (`avrFreeAvailable()` is true only when all three named resolvers are off), and any ± click sends `{t:'tally', mode:'free'}`. A helpers-ON human must open Block/Vote/Combat first — and Block additionally needs a selected ready minion.
- **Offline it could never fire.** `hotBridge._fromBot` drops `tally` (`default: break`) and `hotFanOut` relays only board/log/say/chat/fx. Every hotseat bot table ran uninformed, always.
- **The first block of every online game was mishandled even with helpers on:** `avrOpen('block')` sends the `say 'Block!'` synchronously but debounces its tally 120 ms, so the shout always beat the counter that would have informed the bot.
- **The arena hit exactly this on 16 July** and seeded a tally at match start rather than fixing the root (`elysium-bot-arena.js` v1.0.1: "12/12 block-as-target windows degraded to let-it-through").

The v2.6.111 client bug had been supplying the seed by accident (Johan's local `conv.tournament` fell through, gave him the free counter, and his first ± click informed the bot). Fixing the client removed the accidental seed and exposed the design flaw.

## The decision: split the two questions, gate neither on helpers

**Game logic never depends on the humans' UI state.** Whether the bot blocks is a rules question, weighed on the merits. The two `let it through` short-circuits are gone.

**Structured narration is the bot's own protocol.** The `Phase:` lines, the bot's stealth/intercept on the shared counter, and the §12 verdict line are the bot's equivalent of a human saying "Unlock" aloud and moving the counter so the table can follow and react — `Hold on…` into a phase, read a real stealth number before playing intercept. They are unconditional, the same class as `Turn passed.` (unconditional since v0.5). A shouted `Block!` always opens the referendum; the verdict comes from a human's §12 resolve line or, at the clock, from the bot's own tally — **the bot is the resolver-holder whenever nobody else is.** `_writeTally` mirrors its writes into `this.tally` (server merge rule) so that path works offline where no echo exists.

`caps.tally` survives as a diagnostic flag only. The arena seed is removed.

Johan's framing (16 Sep): bots need not use ALL helpers — only where a helper frames structure that both humans and bots read. Phases and the three resolvers are exactly that set. Prompts with no bot analogue (`unlockPrompt`, `passConfirm`, `warn`, `hand*`) stay human-only; the bot just does the thing. Candidates for later, same test: `modeChoice` (announce the level a card is played at) and `counts` (a line when a phase gains extra actions).

### Why this beats the alternative

- No new wire contract, no new handler, no dependency on hotBridge sending anything.
- No "key absent = off or unknown?" semantics — the exact bug class the client hit in v2.6.112.
- Consistent with the alpha rule: a bot table IS Structured + helpers-on by construction (`syncOffBotLock` offline, `netBotHelperLock` → `helperPolicyFor('all')` online). Asking the policy for permission solves a problem we decided must not exist.
- The one thing we give up — a bot that falls silent under Tournament mode — is arguably not a loss: a human in Tournament mode also says "Unlock" aloud. Debug mode is already forced off there, so nothing secret leaks.

## The alternative, documented for revisiting: read the helper policy from the wire

If bots ever need to play at tables where helpers are legitimately OFF for everyone (a real tournament-practice table with a bot seat-filler, say), this is the shape:

1. **Read `joined.helperPolicy`** in the `joined` handler beside `boardMode`, and add a `helperPolicy` handler for the broadcast (`m.policy || m.helperPolicy` — the two names the v2.6.111 note documents). Both already arrive at the bot today; zero server/client change.
2. **`caps.helpers(key)`**, mirroring the client's `hx()` ladder exactly: `policy.tournament → false`; `!policy.allowLocal && key in policy.settings → settings[key]`; **absent policy or absent key → true** (never false — see the v2.6.112 lesson; and hotBridge sends no policy, so the default must be the bot-table default).
3. Gate `_announcePhase` on `caps.helpers('on')` — the same condition the client uses to show `#phases` (`bar.classList.toggle('helperoff', !hx('on'))`).
4. Gate ONLY narration. Block decisions stay unconditional regardless — that part of v0.6.113 is not negotiable under any policy model.
5. Ask main for `helperPolicy` on hotBridge's synthetic `joined` (it already carries `boardMode`) so offline and online behave identically.

Cost: one handler, one helper, a suite section. Risk: the absent-key semantics, and a second place (after the client) that must track `HELPER_KEYS` drift. Revisit when a real table needs a quiet bot; not before.

## Verification (16 Sep 2026)

Suite section 88 (16 assertions; `diag-88.js` standalone): 16/0 on v0.6.113, 7 red on v0.6.112. Suite 937/0 ×3. Canary 37/0 vs client v2.6.114. HB1 11/11. Seed-free 3-bot arena match: 17 block windows, 3 blocks weighed on T1, zero `classic table` verdicts in the trace.
