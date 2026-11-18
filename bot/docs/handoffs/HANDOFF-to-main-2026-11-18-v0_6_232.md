# Handoff to main — bot v0.6.232 (18 Nov 2026): V5 wave 5b, the 'as played' window and the cancel cards

Built on bot v0.6.231 (#78) and your v2.6.175 / srv-2.6.51. The handoffs of v0.6.230 and v0.6.231 are still open on your side
(v0.6.230's §4: the card-suffix control in your canary); this one adds the items below.

## 1. The bundle
`elysium-bot.js` (v0.6.232), `elysium-cardfx.json` / `.js` (208 curated: + Sudden Reversal, Yawp Court, Week of Nightmares;
Meditative Grove's cancel; the compiler v1.9.10 tags frenzy cards) and `START-HERE-BOTS.html` (the chip, the footer, the master
phase's window and a new section "Cards that answer yours"). The TWD files and the server are unchanged. Deploy: purge
`/elysium-bot.js`, `/elysium-cardfx.json`, `/elysium-cardfx.js` and `/START-HERE-BOTS.html`. **The guide changed: re-embed it**
(your registry/guide test reads the embed).

## 2. What changed (no protocol change; `log`, `chat`, `give`, `draw` as before)
- **The master phase's timing.** A bot's master now LANDS FIRST: its fx clone (it used to come with the play line) and the new line
  below, then the beat the master phase already waited (`_pace`, then the Hold gate: a Hold on in the beat holds the master), then
  the payment and the play line as before. At a paced table a master still costs one beat; a master the bot holds (no target) now
  costs none. At pace 0 a grace `asPlayedMs` (0 = one macrotask; the arena passes 500 ms). Your client suite's LIVE tests that time
  a bot's master phase may see the clone one beat earlier.
- **Sudden Reversal** (RULINGS D-107 shape A, D-122). Between bots it is silent (the line). Against a human: the bot reads a human's
  master from your **s2c `fx` relay** (kind `play`: `seat`, `card` {name, kind, faceDown}, `actor`, `target` — PROTOCOL's `fx`
  row; the clone the client sends when a card is played from hand) and answers with the line and a chat line ("NAME: your CARD is cancelled by my
  Sudden Reversal — put it in your ash heap; its cost is not paid."). A human's Sudden Reversal (its fx play clone) inside the bot's
  window cancels the bot's master; after it the bot says "too late" in chat. The bot relies on that clone for every card a human
  plays from hand: please tell us if it is not sent in some path (a card played by drag to the table, a card played from the menu).
- **Meditative Grove** cancels a frenzy card played on the bot's Salubri: a Deep Song [ANI] rush (a bot's line or a human's
  `rush` chat), a human's frenzy combat card in the bot's combat (read from the same fx play clone). Line + chat to a human.
- **Yawp Court**: after a bot's unblocked political action, while another seat shows an unlocked Yawp Court and a ready unlocked
  Sabbat, the bot writes the success line, waits a beat, and a bot owner may fight its acting vampire before the referendum.
- **Week of Nightmares**: bots move nightmare counters at their unlock (a human owner is told in chat to put one on, a human
  controller to take one off); the special hunt announces as a hunt (`VAMP hunts.`, the usual ask) and then the result line.

## 3. For §12 (your call; machine-read lines, `L12` in the bot)
- `NAME is playing CARD.` / `NAME is playing CARD — on OWNER's VAMP.` (`asPlayed`) — "is playing" matches no `plays` parser.
- `NAME plays Sudden Reversal — cancels OWNER's CARD (its cost is not paid).` (`srCancel`)
- `NAME's Sudden Reversal comes too late for OWNER's CARD.` (`srLate`)
- `NAME locks Meditative Grove — CARD is cancelled (its cost is still paid).` (`groveCancel`)
- `VAMP's political action succeeds — the referendum follows.` (`polSuccess`)
- `NAME locks Yawp Court — VAMP enters combat with OWNER's VAMP.` (`yawp`)
- `Yawp Court — VAMP is still ready: the referendum goes on.` (`yawpOn`)
- `NAME moves a nightmare counter to OWNER's VAMP (Week of Nightmares: N left).` (`wonMove`)
- `Week of Nightmares has no counters left — each Ravnos burns 1 blood for each nightmare counter on it, or is burned.` (`wonEnd`)
Notes for a human (no parser, the event log only): `VAMP hunts (Week of Nightmares): steals 1 blood from X.`, `VAMP burns N
blood (Week of Nightmares).`, `VAMP is burned (Week of Nightmares).`, `VAMP takes 2 environmental damage from Yawp Court: loses N
blood, now M[, and goes to torpor].`; `Referendum fails — CARD: no referendum (Yawp Court).` is the existing result shape.
Straight apostrophes and the em dash, as the other bot lines.

## 4. Run here
On the release bytes (`elysium-bot.js` sha256 `316b4649…`, `elysium-cardfx.json` `5c95a3d5…`): your canary v1.3.0 171/0 on `bot/`'s copies and on
the root's client; your client suite in a scratch copy of `client/` with this bundle beside it **371 passed, 1 failed** — the
guide's embed (the guide changed: re-embed it). The bot's own gates: the suite 2570/0 ×3, the hotseat gate 12/0, HB1 11/11, the sim
footprint (the starters' 240 DIVERGED 28 against v0.6.231: the master phase's timing, no decision rule; `ana-gates.py` PASS on
the 240 and the V5 tables), one real-clock arena match with the 500 ms grace PASS 7/7. The root is a byte copy of `bot/`'s bundle
(your `check-versions.js` reads it).
