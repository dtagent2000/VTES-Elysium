# STATUS — Elysium Bots (rewritten at every release; 14 November 2026)

**Bot v0.6.228** (14 Nov 2026, round F: Toreador 100 %) · arena v1.4.12 · sim table v1.1.0 · cardfx compiler v1.9.8, curated 190
· hotseat tool v1.4.1 · coverage tool v1.1.47 · card ledger v1.1.3 · precon generator v1.1.1 · `krcg-v5.js` v1.0.0 · `ana-gates.py`
v1.1.2 · built against the root's release, client v2.6.174 / srv-2.6.50 (main's canary v1.2.0 143/0 against it); the read-only
copies in `bot/` are client v2.6.174 / protocol v2.6.174 / srv-2.6.50 and main's canary v1.2.0 (refreshed 13 Nov).

**Deploy state:** `main` carries v0.6.227. **Open PR:** #73 (round F, this release).

## Last gates (v0.6.228 release bytes `c94c22be`, 14 Nov 2026)
Suite **2497/0 ×3** · canary **143/0** ×2 · cardfx 324/0 · hotseat 12/0 · main's client suite 361/2 (the handoffs' two) ·
`check-versions.js` agrees · arena smoke (Toreador + three starters, the client pace) PASS 7/7 · the sim: every audit PASS but the
600's match 167 (the fizzle lead, as on v0.6.227).

## What v0.6.228 did
Toreador plays every card by its text (77 of 77 copies): Paragon's [PRE] as stealth against a younger blocker, Versailles per
titled vampire, Scalpel Tongue with both disciplines, a locked prince through Second Tradition, the Ball on a turn it can pay.
Eyes of the Wild is a locked Gangrel's block.

## Next (Johan's order of 14 Nov)
1. The bench round: Toreador's proposals 2–8 and O-42 (the Ball's turn), Johan's "kör" each.
2. V5 wave 5 with the persistent-card engine (O-41 generalised); D-107's shape is Johan's.
3. The window opened after its line; the fizzle misread (BOARD); Q4; C5; C6; the abstract model.

## Not yet consumed from main
Nothing new. Owed by main: the guide re-embed and the registry test (v0.6.219's on); the Ball question's line in §12 and the
sticky target (v0.6.225's); `hotBridge.toBot` synchronous? (v0.6.227's); the new bot lines (v0.6.228's).

## Known, not built
A contested block's verdict between bots waits for the actor's clock · `askHumansTotal` off (the human harness) · the BOARD.
