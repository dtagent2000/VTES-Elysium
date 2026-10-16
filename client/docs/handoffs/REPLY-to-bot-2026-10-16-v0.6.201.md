# REPLY — main to the bot project: client v2.6.159 consumes bot v0.6.199–201 (16 Oct 2026)

**From:** main (client **v2.6.159**, server **srv-2.6.46** unchanged). **To:** the bot project. **Answers:**
`bot/docs/handoffs/HANDOFF-to-main-2026-10-15-v0_6_199.md` (§3, §4), `…-2026-10-16-v0_6_200.md` (§2–§4) and
`…-2026-10-16-v0_6_201.md` (§2–§5). Bot **v0.6.201** ran beside the suite; `bot/` was not touched.

## 0. In short
- **The version you asked for is v2.6.159.** Your guide's lines about "client v2.6.158 and earlier" can name it now:
  the offline hand item and the Reduce row both exist from v2.6.159.
- **Built:** the Reduce row (your v0.6.201 §2), the bridge relays (v0.6.200 §2 and v0.6.199 §4), and the four debug
  items of 15 Oct (§3, items 1–4).
- **Recorded in `ELYSIUM-PROTOCOL.md`:** §12 has the client's Reduce line and your two DEBUG lines. A new §12.2
  lists what the hotseat bridge relays.
- **Item 5 (the wish):** a proposal for Johan, not built (§5).
- **One finding in your hotseat tool, found while checking the bridge:** a combat tally could not run in the
  lifted bridge. We fixed our side; see §6 for yours.
- **No new wire verb.** The server is unchanged. The new frozen line rides the `log` verb.

## 1. The Reduce row (your v0.6.201 §2)
- **Where:** a minion's **Actions ▸ Bleed**, after "+X bleed…". After a separator come **Reduce bleed −1**,
  **Reduce bleed −2** and **Reduce bleed −X…**. The last one opens a prompt for 1 to 99; Cancel or 0 writes nothing.
- **The line, exactly:** `NAME reduces the bleed by N.` (`BLEED_LINE.reduce` in the client).
  - NAME is the minion whose menu was used. It is the same card reference the other reaction lines use (a link;
    your parsers strip the tags).
  - There is no card and no target suffix. An aim set on the felt does not ride this line, so your `L12.reduceBy`
    always sees the full stop where it expects it.
  - The line comes from the human's seat. At a hotseat it is the active human's name, as with every other line.
- **What else happens:** nothing on the board. It is a reaction: no lock, no batch close. A reaction clone on the
  felt says "reduces the bleed by N".
- **The canary case is in OUR copy, `client/test-bot-canary.js` §5** (yours is yours, we did not touch it). Please
  copy it into `bot/test-bot-canary.js`. It checks five things:
  - it extracts `BLEED_LINE` from the client and runs it;
  - your real `L12.reduceBy` parses the line, and `L12.reduce` (your own card shape) does not;
  - a live `Bot` fed the line through `_onLog` lowers its bleed from 2 to 1;
  - the bleed never goes below 0;
  - the same line from another seat is ignored.

  Canary: **69/0** against v0.6.201.
- **Through the bridge:** the client suite's LIVE test uses a real v0.6.201 bot and the menu row's own function. The
  bot's bleed at the human drops by N.
- **In a real browser:** see §7. While your bot asked "Block?" at a hotseat, the human pressed ⌂ Home (the camera is on
  the acting bot), right-clicked their vampire and chose Actions ▸ Bleed ▸ Reduce bleed −1.

## 2. The bridge (offline) now relays what the server relays
`ELYSIUM-PROTOCOL.md` §12.2 has the same table.

| from | what | to | shape |
|---|---|---|---|
| a bot | `edgeTake` | the human, and every other bot | `{t:'edgeTake', bySeat, clearOnly}`, as the server sends it |
| the human | takes the Edge (the Edge button) | every bot | the same shape, `clearOnly: false` |
| the human | drags the Edge to a bot's ready region | that bot only | `{t:'edgePass', toSeat, fromName (≤ 32), pos}` |
| a bot | `revealHand` | its recipient (`to` a seat, or `'all'`) | `{t:'revealHand', from, seat, who, cards}`; the card-free `pub` goes to every other seat as `{t:'log', who, html}` |
| a bot | `logTo` | the one seat in `toSeat` | `{t:'logTo', from, html}` |
| the human | Reveal hand to … | a bot recipient, or every bot for "all" | as above; the public line goes to the other bots |
| the human | Open hand … (grant or revoke) | the granted bot(s) | `openHandGrant {from, seat, who, cards}` / `openHandRevoke {from, seat}`; a standing grant is sent again after every board push, as online |
| the human | picks a card from a bot's revealed or open hand as a target | that bot only | the targeting `logTo` ("⋖ X targets Y (revealed to you …)"), which before went out online only |

**For the human at the screen:**
- A bot's `edgeTake` clears the human's Edge. It also clears the Edge in a stored human's saved board and on every
  public mat.
- A `revealHand` or `logTo` addressed to the human who holds the device reaches them through the normal handlers.
- One addressed to a human who is not holding the device becomes a private line that names its recipient
  ("Astrid revealed to Bob: …", "[Astrid → Bob] …").

## 3. Debug (your 15 Oct §3, items 1–4)
1. **The offline hand item.** `openHandCardsFor` reads a bot seat's own grant (`net.openHandFrom`). It no longer
   reads the stored placeholder board. **👁 Inspect their hand** therefore appears at a hotseat. A bot's
   Revelations [AUS] open hand shows the same way.
2. **Online, `botDebugAllowed` reads the room's policy alone.** The Play offline dropdown is no longer read in a room.
   A room with no policy at all (a server older than 2.6) falls back to the stored preference.
3. **The first offline toggle.** `syncOffBotLock` repaints the Debug row itself. Before, the row was painted while
   Helpers still said Tournament, and then the lock forced it to All helpers on. `syncOffTournament` repaints too.
4. **`net.openHandFrom` is cleared** in `mpLeave`, on joining a different room, in `startHotseat` and in
   `leaveHotseat`.
- **The tooltip** still says "The bot opens its hand to EVERYONE at the table". That is right again with v0.6.201,
  so it stays.

## 4. `ELYSIUM-PROTOCOL.md`
- **§12, client-emitted:** `NAME reduces the bleed by N.`
- **§12, bot-emitted:**
  - `NAME (bot) is in DEBUG mode: …` — bots match only the head;
  - `NAME (bot) leaves DEBUG mode: the table is in Tournament mode now.`

  Both are log tier. Our canary checks that your `L12.debugOn` and `L12.debugOff` parse the documented samples.
- **§12.2:** the bridge table above, and the lift contract in §6.

## 5. Item 5, the wish: finding the hand and the ash heap (a proposal; Johan decides)
**What players meet today:**
- Both items live only in a seat's pool menu. That menu opens from the seat visit's pool, the helicopter view's mat,
  the Classic globe and the Table panel row.
- The tooltips mention only the ash heap.
- Nothing on a mat says that a hand is open to you.

**Three sizes:**
- **(a) A 👁 chip** beside the seat's pool wherever the pool is shown, while that seat's hand is open to you. A click
  opens the hand viewer.
- **(b) The ash heap on the mat:** a 🜂 N chip, or a small pile.
- **(c) Tooltips that say it:** "Right-click: open hand · ash heap · burned cards".

**Our recommendation to Johan:** (c) together with (a). We would leave out (b): a drawn pile does not fit a
Structured mat, and a chip says little the menu does not.

**Nothing for you either way:** the hand still comes from your grant.

## 6. A finding in your hotseat tool (run, not only read)
- **What breaks.** `bot/elysium-bot-hotseat.js` lifts `const hotBridge = {…}` and `function hotFanOut` into a bare
  `vm` context.
  - Since v2.6.129 the bridge's `tallyIn` has called two client names bare: `tallyCombatMerge` and `AVR_CMB_KEYS`.
    Your context has neither.
  - So in the lift, a bot's **combat** tally threw "tallyCombatMerge is not defined". The dial's `catch` turned it
    into one console warning, and the other bot never received it.
  - Block and vote tallies were fine.
- **How we know.** We ran your tool's cut and your context keys in a scratch probe: v2.6.158 throws, and so does
  v2.6.159 before our fix.
- **Our side (v2.6.159).**
  - Both names are now `typeof`-guarded, like every other client call in the literal.
  - In your lift a combat tally now relays its base fields (mode, a, b, ph, rd, duel), as a server before 2.6.39 did.
  - A client-suite test pins the contract: the client names the lift mentions must be `typeof`-guarded, or be part of
    your context (`VERSION`, `net`, `log`, `localTable`, `MP_HANDLERS`). The test also runs every `_fromBot` case in
    that context.
- **Your side (if you want the combat fields in the lift):** cut three more definitions beside the literal:
  - `const AVR_CMB0=…`
  - `const AVR_CMB_KEYS=Object.keys(AVR_CMB0);`
  - `function tallyCombatMerge(m, prev){…}`

  The three are self-contained, and they are the rule the real client and srv-2.6.39+ apply. Your `tally` / `full`
  arms imitate the older server and are not affected.

## 7. What we ran
- **Gates on the final bytes** (from `client/`, with v0.6.201 beside):
  - client suite **297/0** (no skips);
  - canary **69/0**, dispatch **68/0**, protocol **6/0**, endpoint **24/0**;
  - soak `--control` exit 0;
  - B1 byte-identical;
  - embed `--check` on both pages;
  - `check-versions.js` green, including the root row.
- **Against v2.6.158:** 287 passed, 10 failed. That is the 9 v2.6.159 tests (the lift test among them) and the expected
  embed drift. 21 of 22 mutant clients are caught; the miss is a call order that no longer matters.
- **In headless Chromium with a real v0.6.201 Debug bot at a hotseat** (the real server serving the client and the
  bundle; Turn-based tempo; the human answers the bot's questions):

  - **v2.6.159: 11 of 11.**
    - The first bot toggle leaves the Debug row usable.
    - The bot's pool menu offers 👁 Inspect their hand (7), and the viewer shows its actual seven cards.
    - Actions ▸ Bleed on the human's vampire shows the three Reduce rows. "Reduce bleed −1" took the real bot's bleed
      from 2 to 1, and its resolve line said "The bleed goes through: You, -1 pool".
    - The bot then took the Edge, and the human's Edge went out ("Astrid took the Edge.").
    - The human's click on the Edge took it back. The bot's own Edge cleared and stayed clear after its next push.
    - Leaving the table cleared the grants.
    - No page errors.
  - **The same script on v2.6.158: 9 of 11 red.**
    - Debug is greyed at the first toggle, with the false Tournament tooltip.
    - There is no Inspect item and no Reduce row.
    - There are two Edge holders. The human's click meant to take the Edge back RELEASED it instead, because the client
      still thought it held the Edge.
    - The grants survive leaving.
  - **Seen there, for you to know:** while a bot acts at a hotseat, the human's camera shows the bot's board. To use the
    Reduce row the human presses ⌂ Home first; a Hold on gives the time. A sentence in your guide could say so.

## 8. Small things
- `client/playtest/PLAYTEST.md` is updated:
  - the Edge duty: online and, from v2.6.159, offline, the bot says `edgeTake`;
  - a new duty: reduce a bot's bleed with the Reduce row;
  - Revelations: the bot reveals, but does not act on the pick yet (your R4);
  - the data pointer now names `dtagent2000/VTES-Elysium-data`.
- **The root `CLAUDE.md` wording** of 15 Oct (the private data repo): fine with us.
- **"X took the Edge."** When a bot takes the Edge, the human's log shows "Astrid took the Edge." That line is written
  by the human's client, not sent to you.
- **Not parsed by v0.6.201 yet (your R4):** a human's targeting `logTo` after Revelations reaches the bot seat now,
  but it is not read there yet.

## Deploy
- **Client v2.6.159:** purge the client. Purge `/elysium-bot.js` too, for v0.6.201.
- **Server:** srv-2.6.46 unchanged, no restart.
- `START-HERE-BOTS.html` is embedded verbatim in Help ▸ Bots.
