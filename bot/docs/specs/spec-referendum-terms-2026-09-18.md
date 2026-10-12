# Spec to the main project — bot-called referendums (18 Sep 2026, bot v0.6.122)

**From:** Elysium Bots. **Needs from main:** nothing blocking — everything below rides existing wire verbs (`log`, `tally`, `say`, `chat`). This spec asks main to (1) FREEZE two new log shapes in §12 and (2) keep three client behaviours the bot now leans on. Optional improvements at the end.

## 1. What a bot-called referendum looks like on the wire (in order)
| # | verb | content | status |
|---|---|---|---|
| 1 | `log` | `Referendum terms — <b>CARD</b>: NAME −3, NAME −1, NAME +3.` | **NEW — please freeze** |
| 2 | `fx` + `tally {mode:'block', a:1, b:0}` | the clone + the political action's +1 stealth | existing |
| 3 | `log` | `<b>VAMPIRE</b> calls a political action.` | frozen (v2.6.106) |
| 4 | `chat` | `Trainbot: VAMPIRE calls CARD — terms. Block? — say "block" or "no" (Ns → no)` | existing ask; prey + predator answer (undirected) |
| 5 | `tally {mode:'vote', a:N, b:0}` + `log` `<b>BOT</b> casts <b>N</b> votes <b>for</b>.` + bubble `I vote N for.` | polling opens; the caller's title votes + 1 for the card | frozen line |
| 6 | every seat | `casts N votes for/against.` lines, counter moves, `No votes from me.` / `Pass` | frozen / existing |
| 7 | `tally {mode:'vote', a:F, b:A}` then `log` `Vote: F for vs A against — vote passes|fails.` | the caller's authoritative count + the client's own frozen verdict line (SKIPPED when a human's Resolve already wrote it) | frozen |
| 8 | `log` | `Referendum passes — <b>CARD</b>: NAME −3, NAME −1.` · `Referendum fails — <b>CARD</b>: no effect.` · `Referendum fails — <b>CARD</b>: blocked.` | **NEW — please freeze** |
| 9 | `tally {mode:null}` + `say` `It resolves` | the action is over | existing |

Grammar: `^Referendum terms — (.+?): (.+)\.$` and `^Referendum (passes|fails) — (.+?): (.+)\.$` (— is U+2014). Terms are `NAME SIGNn` joined by `, `; SIGN is `−` (U+2212), `-` or `+`; NAME is the roster name. Bots apply THEIR OWN delta from line 8, once. **Humans adjust their own pool by hand from line 8** — same convention as `the pool damage lands — NAME, −3 pool (adjust yours)`.

## 2. How a human takes part (Johan, 18 Sep)
- **Thinking time:** `Hold on…` stops the bot's vote clock until that player votes, passes or says `It resolves`.
- **Voting:** the vampire menu's *Cast votes → For / Against* (the frozen line), OR the vote counter's +/−, OR the planned right-click *Votes* entry that adds to the counter. The bot reads all three: it sums the frozen lines per side and takes the larger of that sum and the counter.
- **No votes:** `Pass` (quick phrase) or typing `No votes from me.` Once every other live seat has spoken the polls close without waiting out the clock. A human who only casts votes is NOT treated as finished (a second vampire may vote) — the clock (askSecs, restarted by every vote) closes it.
- **Skip the wait:** `It resolves` from anyone, or **Resolve on the vote counter** — the bot announces the outcome at once. With the counter's Resolve the client's `Vote:` line carries the count; the bot does not repeat it.

## 3. Client behaviours the bot relies on — please keep
1. The `Vote: F for vs A against — vote passes|fails.` line on the vote counter's Resolve.
2. `casts N vote(s) for|against.` from the Cast votes menu. **Recommendation (bot v0.6.124):** let the planned right-click *Votes* entry do BOTH — emit the frozen line AND add to the counter, the way the bots do. Then the counter is always the full truth. Today the bot takes the larger of (sum of lines, counter) per side, which under-counts only when three channels mix (one human via the line alone, another via the counter alone, a bot via both).
3. `tally` absent-field preservation within a mode (srv-2.6.17).

## 4. Optional, would make it better
- Since v0.6.124 the bots vote in ring order from the caller, one beat apart, each adding to the counter as it stands at that moment — a human's +2 is no longer overwritten. A human adjusting the counter in the same instant as a bot can still collide.
- **An additive counter verb** (`tallyAdd {side, n}`): bots write ABSOLUTE `a`/`b`; three bots voting on the same open-edge lose updates to each other. The caller compensates by counting lines and rewriting the total before the verdict, so the COUNTER can briefly show less than the log says.
- **Pool adjust from the result line:** a click target on line 8 that applies the viewer's own delta.
- **Lobby:** `ventrue` is a new bot archetype (HOT_BOT_DECKS).

## 5. Not in v0 (known limits)
No deals or vote trading; no Edge vote; no vote-locking cards besides Ventrue Headquarters; Voter Captivation is not played; humans' referendums are unchanged (the R3 pool question still asks, because a human caller sends no terms line).

## 6. Added with bot v0.6.123 (informational — nothing for the client to parse)
- `<b>VAMPIRE</b> unlocks — <b>CARD</b> (after a successful action).` / `(after the block).` — a Freak Drive-class modifier; deliberately NOT a `plays` line, so nothing reads it as a new action. The vampire's unlocked state rides the normal board push.
- `Combat ends — <b>CARD</b>.` — follows the existing dodge-shaped strike line (`… strikes: CARD — no damage either way this round.`) when the strike ended the combat (Majesty). A bot opponent skips its press on it; a human simply reads it.

