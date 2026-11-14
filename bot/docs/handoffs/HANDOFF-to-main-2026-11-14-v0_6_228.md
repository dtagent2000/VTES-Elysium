# Handoff to main — bot v0.6.228 (14 Nov 2026): round F, Toreador at 100 %

Built on bot v0.6.227 (round E). Everything in v0.6.219's to v0.6.227's handoffs still stands — the menu's Toreador and its registry
test, the guide re-embed, the Grand Ball question's line in §12, the ask about the sticky target and whether `hotBridge.toBot` stays
synchronous.

## 1. The bundle
`elysium-bot.js` (v0.6.228), `elysium-cardfx.json` / `.js` (190 curated: + Perfect Paragon, Elysium: The Palace of Versailles, Eyes
of the Wild; Scalpel Tongue's modes) and `START-HERE-BOTS.html` (the chip and the footer). The TWD files and the server copies are
unchanged.

## 2. What changed (no protocol change; nothing for the client to do)
Every card in the Toreador precon now plays by its text (its coverage report: 77 of 77 library copies automated):
- **Perfect Paragon [PRE]** ("allies and younger vampires get −1 intercept") is played as stealth after a block attempt by an ally or
  a vampire younger than the actor. Its line keeps the stealth line's shape and gives the card's words:
  `VAMP plays Perfect Paragon (allies and younger vampires get −1 intercept): +1 stealth.` When a later blocker it does not reach
  attempts, the bot takes the +1 off the counter, and puts it back for one it reaches:
  `VAMP: Perfect Paragon does not reach BLOCKER (−1 stealth).` / `VAMP: Perfect Paragon reaches BLOCKER (+1 stealth).`
- **Versailles** gives +1 vote per titled Camarilla vampire of the bot's (the lock line names the total); none, no lock.
- **Scalpel Tongue** needs Celerity and Presence. The abstain line is unchanged (§12's one-token level).
- **Eyes of the Wild** (the Gangrel precon) is a locked Gangrel's block: `VAMP plays Eyes of the Wild: unlocks.`, then
  `VAMP attempts to block with +1 intercept (Eyes of the Wild).` (§12's shape; the blood burned shows on the board), and after an
  action it did not block, `VAMP locks again: it did not block this action (Eyes of the Wild).`
- A bot's locked titled vampire blocks through **Second Tradition: Domain** (and a Nosferatu through Guard Dogs) without a wake card
  in hand; the **Toreador Grand Ball** waits for a turn its unblockable Toreador would call a referendum.

## 3. For §12 (your call)
The three new lines in §2 are bot lines. The adjustment line is read by the bots' hotseat tally net (bot-internal, as the stealth
line is); the relock line is a note for a human. Neither needs a client reader. If §12 lists the bots' own lines, these belong
beside `VAMP plays CARD: +N stealth.`

## 4. Run here
On the release bytes (`elysium-bot.js` sha256 `c94c22be…`): your `check-versions.js` agrees; your canary v1.2.0 143/0 on `bot/`'s
copies and on the root's client; your client suite in a scratch copy of `client/` with this bundle beside it **361 passed, 2
failed** — the two of v0.6.219's handoff. One server-arena match at the client's pace (Toreador and three starters): every audit
PASS, the locked routes (Second Tradition, Guard Dogs) on the wire.

## 5. Deploy
Purge `/elysium-bot.js`, `/elysium-cardfx.json`, `/elysium-cardfx.js` and `/START-HERE-BOTS.html`. The TWD files and the server are
unchanged.
