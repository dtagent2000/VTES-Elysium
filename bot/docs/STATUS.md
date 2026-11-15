# STATUS — Elysium Bots (rewritten at every release; 15 November 2026)

**Bot v0.6.229** (15 Nov 2026, the bench round) · arena v1.4.13 · sim table v1.1.0 · cardfx compiler v1.9.8, curated 190
· hotseat tool v1.4.1 · coverage tool v1.1.47 · card ledger v1.1.3 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 · `ana-gates.py`
v1.1.3 · built against the root's release, client v2.6.174 / srv-2.6.50 (main's canary v1.2.0 143/0 against it); the read-only
copies in `bot/` are client v2.6.174 / protocol v2.6.174 / srv-2.6.50 and main's canary v1.2.0.

**Deploy state:** `main` carries v0.6.228. **Open PR:** #74 (this release).

## Last gates (v0.6.229 release bytes `e306ac04`, 15 Nov 2026)
Suite **2517/0 ×3** · canary **143/0** ×2 · cardfx 324/0 · hotseat 12/0 · the lint clean · `ana-gates.py --self-test` 35/0 ·
section 174 20/0 · the sim: at 0 the release bytes play v0.6.228 (the 240, the V5 smoke, the 600 IDENTICAL); the release footprint's
audits PASS but the 600's match 512 (the fizzle lead, BOARD).

## What v0.6.229 did
Toreador's guide proposals, benched (D-118): the Grand Ball's free Toreador calls its referendum on its turn (D-117), the referendum
comes after the cheap actions (or opens the turn when it carries Scalpel Tongue's lock), the first influence opens the stock engine,
Villein leaves blood for two cards. Toreador +0.08 VP with the five (pinned); the wide clog lost and is gone. Scalpel Tongue is
played once per action (the egress review).

## Next (Johan's order of 14 Nov)
1. V5 wave 5 with the persistent-card engine (O-41 generalised); D-107's shape is Johan's. O-43 is Johan's (the Ball's guard).
2. The window opened after its line; the fizzle misread (BOARD); Q4; C5; C6; the abstract model.

## Not yet consumed from main
Nothing new. Owed by main: the guide re-embed and the registry test (v0.6.219's on); the Ball question's line in §12 and the
sticky target (v0.6.225's); `hotBridge.toBot` synchronous? (v0.6.227's); the new bot lines (v0.6.228's).

## Known, not built
A contested block's verdict between bots waits for the actor's clock · `askHumansTotal` off (the human harness) · the BOARD.
