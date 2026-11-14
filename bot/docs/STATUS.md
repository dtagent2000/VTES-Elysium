# STATUS — Elysium Bots (rewritten at every release; 14 November 2026)

**Bot v0.6.227** (14 Nov 2026, round E: the hotseat's dropped Pass) · arena v1.4.12 · sim table v1.1.0 · cardfx compiler v1.9.8,
curated 187 · hotseat tool v1.4.1 · coverage tool v1.1.46 · card ledger v1.1.2 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 ·
`ana-gates.py` v1.1.2 · built against the root's release, client v2.6.174 / srv-2.6.50 (main's canary v1.2.0 143/0 against it);
the read-only copies in `bot/` are client v2.6.174 / protocol v2.6.174 / srv-2.6.50 and main's canary v1.2.0 (refreshed 13 Nov).

**Deploy state:** `main` carries v0.6.225. **Open PRs:** #71 (round D, v0.6.226); round E (this release) on it — merge in order.

## Last gates (v0.6.227 release bytes, 14 Nov 2026)
To come with the gates (the PR carries them). The sim against v0.6.226: the 240's modifier windows that ran out 1135 → 2 of 1309,
stale answers 1431 → 3; play unchanged but in a few matches; the hotseat gate 12/0 (H12), 11/1 on v0.6.226.

## What v0.6.227 did
At a hotseat table a bot's bleed modifier no longer waits out its clock: the bridge delivers inside the send, and the actor now
counts a line as sent once it has left its queue (and never sends inside its own send).

## Next (Johan's order of 14 Nov 12:06)
1. O-41 (my Jack's worth: the owner's horizon) when Johan has answered; Toreador's eight proposals (Johan's "kör" each).
2. A window that opens after its line was delivered (BOARD); V5 wave 5 (D-107); Q4; C5; C6; the abstract model.

## Not yet consumed from main
Nothing new. Owed by main: the guide re-embed and the registry test (v0.6.219's to v0.6.227's handoffs); the Grand Ball
question's line in §12 and the sticky target (v0.6.225's handoff); whether `hotBridge.toBot` stays synchronous (v0.6.227's).

## Known, not built
Between bots a contested block's verdict waits for the actor's clock · `askHumansTotal` off until the human harness learns the
second question · the rest is on the BOARD.
