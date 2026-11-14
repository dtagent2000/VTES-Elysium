# STATUS — Elysium Bots (rewritten at every release; 14 November 2026)

**Bot v0.6.226** (14 Nov 2026, round D: Jack's self-consistent runway) · arena v1.4.12 · sim table v1.1.0 · cardfx compiler v1.9.8,
curated 187 · hotseat tool v1.4.1 · coverage tool v1.1.46 · card ledger v1.1.2 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 ·
`ana-gates.py` v1.1.2 · built against the root's release, client v2.6.174 / srv-2.6.50 (main's canary v1.2.0 143/0 against it);
the read-only copies in `bot/` are client v2.6.174 / protocol v2.6.174 / srv-2.6.50 and main's canary v1.2.0 (refreshed 13 Nov).

**Deploy state:** `main` carries v0.6.225 (#68–#70, merged 14 Nov). **Open PR:** #71 (round D, this release).

## Last gates (v0.6.226 release bytes `08ed02fb`, 14 Nov 2026)
Suite **2479/0 ×3** (frozen snapshots) · canary **143/0** ×2 · hotseat **11/0** · main's client suite 361/2 (the handoffs' two) ·
`check-versions.js` agrees · arena smoke with a rigged Jack PASS 7/7 (a bot burned it) · the sim against v0.6.225 (version set
back): at 0 the 240, the V5 smoke and the 600 IDENTICAL; at 1 the 240 DIVERGED 9, the V5 smoke 2, the 600 37, only where a Jack is
in play; `ana-gates.py` PASS · the mirror bench and the bench pinned to Nosferatu: no loss.

## What v0.6.226 did
D-115 (O-40): what a Smiling Jack takes from a seat is read over a runway that pays its growing counter, so it never passes the
seat's pool (it did in 70 of 331 plan reads on the 240). The burns, the waits and the owner's defence read it; `jackRunway` 1
after a mirror bench with no loss (the variant seat −0.01, 95 % [−0.03, +0.01]).

## Next (Johan's order of 14 Nov 12:06)
1. The hotseat's dropped Pass (round E, the next PR): the bridge delivers in the same call, so a target's instant Pass reaches the
   actor inside its own send, before its line counts as on the wire.
2. O-41 (my Jack's worth: the owner's horizon) when Johan has answered; Toreador's eight proposals (Johan's "kör" each); V5 wave 5
   (D-107); Q4; C5; C6; the abstract model.

## Not yet consumed from main
Nothing new. Owed by main: the guide re-embed and the registry test (v0.6.219's to v0.6.226's handoffs); the Grand Ball
question's line in §12 and the sticky target (v0.6.225's handoff).

## Known, not built
Between bots a contested block's verdict waits for the actor's clock · `askHumansTotal` off until the human harness learns the
second question · the hotseat drops a bot's Pass in the modifier window · the rest is on the BOARD.
