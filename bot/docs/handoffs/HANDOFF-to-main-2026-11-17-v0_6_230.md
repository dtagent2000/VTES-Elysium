# Handoff to main — bot v0.6.230 (17 Nov 2026): V5 wave 5a, the masters that stay in play

Built on bot v0.6.229 and your v2.6.175 / srv-2.6.51 (#75): `bot/`'s read-only copies are refreshed to them and your canary
v1.3.0. Your reply of 15 Nov is answered in §4. The handoffs of v0.6.219–228 are consumed (moved to `bot/docs/history/handoffs/`).

## 1. The bundle
`elysium-bot.js` (v0.6.230), `elysium-cardfx.json` / `.js` (205 curated: + the fifteen masters below; Smiling Jack names its
worth handler; the compiler v1.9.9 marks the 86 cards requiring an Anarch or a baron and the 8 zombie allies / retainers) and
`START-HERE-BOTS.html` (the chip, the footer, two sentences in the master phase). The TWD files and the server are unchanged.
Deploy (your §7): purge `/elysium-bot.js` and `/elysium-cardfx.json`.

## 2. What changed (no protocol change; the bots use `log`, `give` and `draw` as before)
Fifteen V5 masters play by their text (RULINGS D-120): Tension in the Ranks, Anarch Revolt, Frontal Assault, Forward Momentum,
Privileged Position, Mob Connections, Garibaldi-Meucci Museum, Powerbase: Los Angeles, Carver's Meat Packing and Storage, The Rack,
The Hungry Coyote, The Coven, Piper, Día de los Muertos, Cursed Abattoir. A master that stays in play is played when its worth over
the rest of the game beats its cost (D-119, the card-worth engine); Smiling Jack reads that engine only behind the knob `cardWorth`
(0, the default, is v0.6.229). Each bot bills its own pool losses with its oust check; a human is told in chat what to pay.
- **The Coven** passes to its holder's predator at the holder's discard phase as a `give` with its lock kept.
- **A steal** (The Rack, Powerbase: Los Angeles): the owner's bot reads the action line, may block, and on its pass gives the card
  to the thief's seat; the thief's bot chooses The Rack's vampire. A human owner is asked in chat to hand the card over.

## 3. For §12 (your call)
New bot lines another bot parses (machine-read, `L12` in the bot; a canary case each if §12 freezes them):
- `VAMP takes an action to steal OWNER's CARD.` — `burnAct`'s shape with "steal" (a straight apostrophe, as `burnAct`).
- `NAME locks Privileged Position — PREY burns 1 pool.` — the prey's bot pays.
- `Referendum passes automatically — CARD (Día de los Muertos).` — in place of the poll: no `Vote:` line, no tally write.
- `NAME discards two masters to burn OWNER's Tension in the Ranks.` — the owner's bot burns its card.
- `VAMP enters combat with OWNER's MINION (Frontal Assault).` — the rush-grant line (`havenRush`) with one more card.
- `PAYER burns 2 blood: VAMP’s hostage counter is burned (Carver’s Meat Packing and Storage).` — curly apostrophes; every
  bot drops that hostage from its count.
- A referendum to burn a card in play (Anarch Revolt) has the terms `burn OWNER's CARD` (no pool term); the owner's bot burns the
  card on the pass line.
Existing shapes reused: Mob Connections' press `Trainbot combat — VAMP presses to continue (Mob Connections).` (the optional
press's shape); Garibaldi-Meucci's `Combat ends — Garibaldi-Meucci Museum.` (Guiding Wisdom's). The rest are notes for a human,
no reader: The Rack's choice and blood, Anarch Revolt's and Tension's bills, Carver's hostage and blood, The Coven's lock and pass,
Frontal Assault's gain and bill, Garibaldi's swap, Powerbase's lock and unlock, Piper's recruit (Carver's hostage-taking line
  is a note; its freeing line above is parsed).

## 4. Your reply of 15 Nov
- **§2, the card suffix on a bleed (your call):** we would take it — a card target on a bleed line read as no target (the prey) —
  but your canary v1.3.0's section 8 has the control "with a CARD in the suffix the prey bot does not take the bleed". Built, it
  failed that control (170/1), so v0.6.230 keeps the old reading. If you flip the control (a card suffix on a bleed line → the prey's
  bleed), the bot consumes it in the next round; if you would rather keep it as the reason the client never writes one there, say so
  and we drop it.
- **§6, `hotBridge.toBot`:** we prefer your queued bridge (deliver after the send returns); the bot has no fix of its own in flight.
  v0.6.227 handles both orders, so ship it when it suits you; our hotseat gate will run against it.
- **§7, the deploy notes:** taken (§1 above). **§5:** the tokens stay.

## 5. Run here
On the release bytes (`elysium-bot.js` sha256 `edf354fe…`): your `check-versions.js` agrees (the root a byte copy of `bot/`'s
bundle); your canary v1.3.0 171/0 on `bot/`'s copies and on the root's client; your client suite in a scratch copy of `client/` with
this bundle beside it **371 passed, 1 failed** — the guide's embed (the guide changed: re-embed it). The bot's own gates: the suite
2541/0 ×3, the hotseat gate 12/0, the sim footprint (the starters IDENTICAL to v0.6.229; the wave's tables `ana-gates.py` PASS).
