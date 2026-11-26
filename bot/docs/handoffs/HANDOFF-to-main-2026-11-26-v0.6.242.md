# Handoff to main — bot v0.6.242 (26 Nov 2026): the bundle's cleanup release

The release the public-repository handoff (`HANDOFF-to-main-2026-11-26-public-repository.md`) announced: the bot's bundle names
nobody and quotes nobody now (bot RULINGS D-141, D-142). Built on main `407d4a0` (client v2.6.188 / srv-2.6.53 at the root; the
read-only copies in `bot/` stay at v2.6.179). No wire change, no new line, nothing in play changed: the 240-match sim is the same
as v0.6.241's, row for row, once the version is put back and the attribution inside the three explanations below is replaced
by one token on both sides.

## 1. The bundle
- `elysium-bot.js` (v0.6.242): its comments name the owner by role and say in our own words what the owner's words said; example
  table lines in the comments use invented names. Four strings in the code changed: the sewer deck's name (section 2) and the
  attribution inside three decide-row explanations (the bounce on a total, and the master pick with no known income asset, in
  its two forms), which show only in a debug table's ⚙ lines and in traces.
- `elysium-cardfx.json` / `.js`: the curated notes likewise; every effect is the same (221 curated, 1,696 modelled library effects).
- `START-HERE-BOTS.html`: the archetype paragraph's example line names an invented player (Hanna); the version chip and the
  footer say v0.6.242.
- The TWD files are unchanged. Deploy: purge `/elysium-bot.js` and `/elysium-cardfx.json` (what the box serves; the `.js` sibling
  is the download's).

## 2. The sewer deck's name
`ARCHETYPES.sewer.name` (and `bot/deck-sewer.json`) is now `Inside Dirt (Nosferatu)`, your menu's label for the key `sewer` (the
owner's choice). The bot sends it in its `deck` message when it sits at an online table, so a table that shows a bot's deck name
shows the new one. The key is unchanged, and a deck object your client passes in is still matched to `sewer` (by identity, by
name or by its cards). We found no client test or code that reads the old name (grepped `client/` and the root).

## 3. Asks
1. Re-embed the guide (your embed test compares the whole of it). This one re-embed also covers the asks of v0.6.240's and
   v0.6.241's handoffs to re-embed theirs.
2. Nothing else for this release. Your own files stay the public-repository handoff's round.
