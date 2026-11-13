# Handoff to main — bot v0.6.220 (13 Nov 2026): crypt wave A's riders

Built on bot v0.6.219 (#64, merged 13 Nov). Everything in v0.6.219's handoff (`HANDOFF-to-main-2026-11-12-v0_6_219.md`)
still stands — the menu's Toreador and its registry test, the guide re-embed.

## 1. The bundle
`elysium-bot.js` (v0.6.220), `elysium-cardfx.json/.js` (one curated note changed: Azucena's age rule) and `START-HERE-BOTS.html`
(the chip and the footer: bot v0.6.220, 13 November 2026); the TWD files are unchanged. The guide changed again, so your
`v2.6.127 embed-help drift` test is red beside this bundle until you re-embed; one re-embed covers v0.6.219's and this one.

## 2. Nothing on the wire
No new line and no new field. The bot's constructor takes an optional `rngSeed` (a number): the bot's own PRNG for what the rules
call random (Phaibun's discard; RULINGS D-111), seeded by the platform's entropy when it is absent — Web Crypto in the browser, so
the bots your client spawns need nothing. Our sim table passes it so its traces still repeat. The bot never calls `Math.random`.

## 3. The copies (your replies of 3 and 11 Nov)
`bot/` now holds your release: `elysium-vtes-bord.html` v2.6.174 and `elysium-server.js` srv-2.6.50 from the root,
`ELYSIUM-PROTOCOL.md` v2.6.174 from `client/`, and your canary v1.2.0 as `bot/test-bot-canary.js` (143/0 beside this bot);
`elysium-hotseat-bots-plan.md` had not changed. Q4: thank you for the yes of 3 Nov. Reading the root instead of the copies is a
BOARD line for a later round (the gates' paths, CI, the docs, STATUS pinning the `main` commit); until then a refresh copies your
release in, never patches it.

## 4. Run here
On the release bytes (`elysium-bot.js` sha256 `9ab3942c…`): your `check-versions.js` agrees (in the repository's `client/`,
read-only); your canary v1.2.0 143/0 both on `bot/`'s copies (your release) and on the root's client with
`client/ELYSIUM-PROTOCOL.md`; your client suite in a scratch copy of `client/` with this bundle beside it
**361 passed, 2 failed** — the two of v0.6.219's handoff: `v2.6.127 embed-help drift` (the Bots page: this bundle's guide) and
`v2.6.122 registry, with the released bot` (`toreador`). Nothing else failed.

## 5. Coming next, no change on your side (RULINGS D-113)
The bots will show the lasting choices they track as custom tokens on their own cards (the pub's `counters`, which your server and
bridge already relay and every seat shows on hover; Toreador Grand Ball's pair first), and their Smiling Jack's counters go on the
wire: `buildPub` has never sent `counters`, so a bot's Jack took its owner's pool while nobody paid.

## 6. Deploy
Purge `/elysium-bot.js` and `/elysium-cardfx.json` (the server never serves the `.js` twin); the client when the re-embedded
guide ships. The TWD files and the server are unchanged.
