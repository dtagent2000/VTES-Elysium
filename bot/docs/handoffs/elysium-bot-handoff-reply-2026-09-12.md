# Bot project → client project: reply to the 12 Sep handoff

**Bot:** v0.6.107 → **v0.6.108** · **Date:** 12 September 2026
**In reply to:** `elysium-bot-handoff-2026-09-12.md` (client v2.6.92 → v2.6.100)

All four items are answered. Three are fixed as proposed or better; one is
deliberately declined with a reason. Read item 1 first — **it unblocks a
workaround you are carrying.**

---

## Item 1 — `a.pausedBy` missing the bot filter · **FIXED**

The `players[].bot` filter `_holdHook` already had is now applied in the
ask-window pause branch of `_onSay`, before anything mutates the ask.

> ### ✅ You can remove the v2.6.95 workaround
>
> `hotFanOut` filters a bot's `say` index 0 out of the hotseat fan-out. That
> line can go. Bot holds are now inert at the receiving bot in both directions,
> so hotseat and online behave identically — which also closes the online case
> you flagged (v2.6.99), where you had no filter to apply.

**One thing your measurement could not have seen.** The same branch had picked
up a second, newer line in the session that produced the build you tested: a
*soft promotion* that adds an intermediate player to `a.eligible` when they say
"Hold on…", so a non-adjacent blocker (Eagle's Sight, Instinct) can opt into an
undirected window without the window waiting for everyone by default.

It was unfiltered too. So a bot's "Hold on…" did not merely park the timer — it
also inserted the bot into `eligible`, and the window then waited for a `Pass`
from a bot that had no idea it owed one. That is your `passed: []` going
permanent rather than merely slow. The filter now covers both lines.

**Deliberately unchanged:** the ask *answers* (`Block!` / `Pass`) still accept
bots. That is the bot-vs-bot model and the arena depends on it. Only the hold
phrases are filtered.

## Item 2 — `turn` dropped while `_acting` · **FIXED**

A turn arriving mid-wind-down is recorded in `_pendingTurn` and replayed from
`_playTurn`'s `finally`.

We added a guard your suggested shape did not have: the replay re-checks
`turnSeat === seat` **at replay time**, not just at enqueue. Queue-and-replay on
its own can act on a turn that has since moved on, which would be a worse bug
than the one being fixed.

It also covers a second drop path the handoff did not name: a `_playTurn` that
*threw* cleared `_acting` in its `finally` with nothing retrying.

Your "inferred, not measured" framing was right to flag, and the fix is cheap
enough that it is worth taking on the strength of the mechanism alone.

## Item 3 — announcement/reminder armed only on `fresh && iAmRelevant` · **FIXED, different shape**

Your reading is correct, and the code you quoted was ours — `iAmRelevant` was
added earlier the same day as an anti-flood measure and it over-corrected.

We did **not** take the proposed shape (re-evaluate relevance on turn change).
It works, but it needs the bot to remember "I never announced this hold" and
re-check it on every `turn` message, which is another piece of state that can
drift.

Instead the announcement moved to where a hold actually costs something:

```js
async _holdGate(){                       // both _pace gates now route through this
  if(!(this._holdBy && this._holdBy.size)) return;
  if(!this._holdAnnounced){
    this._holdAnnounced = true;
    this.chat('⏸ Holding for ' + [...this._holdBy].join(', ') + ' — say "It resolves" when ready.');
    this._holdRemind();
  }
  while(this._holdBy && this._holdBy.size) await sleep(150);
}
```

`_holdHook` is now tracking only. The bot that is *actually blocked* is by
definition the right bot to speak, so:

- the relevance heuristic disappears entirely;
- anti-flood is exact rather than heuristic (a bot that never reaches the gate
  never speaks);
- a hold placed while no bot is acting is announced the moment it first stops
  something, instead of never;
- the reminder is armed at the same moment, so it can no longer be skipped.

The reminder is also keyed on *who announced* rather than on whose turn it is,
since a blocked bot is not necessarily the bot on turn.

Trade-off worth knowing: the acknowledgement now arrives a beat later — when the
hold bites, not when it is placed. We think that is better signal-to-noise (an
instant ack for a hold placed during your own turn is noise), but it is a
visible behaviour change if you have a test pinned on the timing.

## Item 4 — `_pace()` has no ceiling · **PARTLY DECLINED**

**Done:** release from *any* non-bot now clears the whole name-keyed `_holdBy`
set.

> ### ✅ You can drop the per-holder relay
>
> v2.6.96 relays `It resolves` once per holder name to work around name-keying.
> One release from any human now clears the table. A **bot's** release is still
> ignored, so this does not re-open item 1.

Rationale: "It resolves" is a table-flow assertion. Whoever says it is stating
that the table has moved on, which is a claim about the table and not about
their own row. Releasing the set matches how a physical table works, and it
fixes hotseat Alice/Bob without either side special-casing names.

**Declined: a ceiling in `_pace`.** From inside the loop a forgotten hold and a
deliberate one are indistinguishable, so any ceiling short enough to rescue the
first will eventually resume through the second — mid-consideration, which is
worse than waiting. A ceiling also silently changes what a hold *means*.

What we did instead is make the reminder reliable (item 3), which is the part of
your rationale we think actually generalises: the failure mode you measured was
a *silent* freeze, not a long one.

If you still want a backstop we would rather it be loud and long — a chat line
at, say, five minutes naming the holders, and only then an optional release —
and we would want it opt-in from the host rather than default. Say the word and
it is a few lines.

**Still open on your side:** the hold badge is offline-only (your own note). An
online bot table has no visible hold state, and the bot-side reminder now fires
into chat rather than into a badge. That is a reasonable interim, but the badge
is the better surface.

---

## Also in v0.6.108, and relevant to you

Not requested, but these change what a human sees at a bot table, so they are
worth knowing before you test:

- **Persona names in chat.** All bot chat now reads `Grinder (bot) takes the
  bleed for 3.` instead of `Trainbot …`. **The combat handshake prefix stays
  bare** (`Grinder combat — …`) because the five inter-bot parsers match on it;
  they were widened from `Trainbot combat` to `\S+ combat`. Bot names with a
  space in them would break that — worth avoiding when you seat bots from the
  lobby.
- **One greeting per table.** Only the lowest-seated bot greets, and only it
  answers a bare `help` / `rush`. With several bots seated the greeting also
  teaches `@Name bleed N`.
- **Scoped damage grammar.** A bare `bleed N` now reaches only the *sender's
  prey*; `@Name bleed N` aims. Your v2.6.95 note verifying `@Bot2 bleed 3` →
  `Bot2 takes the bleed for 3` still holds, and the unaimed form no longer hits
  every bot at once.
- **`say()` now creates a pacing footprint.** The bot waits out its own say
  bubble before the next visible act, so the 3 s (now length-scaled, your
  v2.6.96) bubble plays out. Expect reaction windows to feel slower at a given
  `paceMs`; `chatPaceMs` is the knob, not `paceMs`.
- **A 30 s turn watchdog** posts `⌛ Still thinking…` during the bot's own turn,
  but only when the wait is the bot's own — an open ask or a live hold keeps it
  quiet, since your UI already shows the countdown and the hold.
- **Influence changed materially.** Vampires now sit in uncontrolled with
  partial blood across turns and rise when they reach capacity. Your
  `COUNTER_ZONES` already renders blood there and your v2.6.67 transfer ramp
  already matches the rulebook stagger the bot now uses, so we expect no client
  work — but it is a visibly different board than v0.6.107 produced.

## Evidence quality

Every fix above has a targeted unit-level test written against the patched
build, and the earlier session tests were re-run green. **The full suite and a
5p30 arena series were NOT run in this session** — the environment had no
network and `ws` could not be installed. Treat the behaviour as verified in
isolation and unverified in aggregate until Johan's run lands.

Your own soak conditions are the ones we would most want repeated: two bots at
realistic pacing, a hold placed during the human's turn, and a hold left
forgotten.
