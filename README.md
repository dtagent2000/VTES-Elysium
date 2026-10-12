# VTES-Elysium
Digital card game client for Vampire the Eternal Struggle, playable online at https://elysium.cards, through private server hosting as well as offline for tutorial, testing or hot-seat play.

The scope of this project is to be a game client with an intuitive UI/UX of modern fidelity that will facilitate synchronized play between multiple people online. It has several basic helper features like a deck builder and small server solution so you can play with your friend group, but players are encouraged to use other specialized tools for deck-building and welcomes other server solutions to facilitate more robust and safe online play with unknown people as well as tournament organization.

Crated with Claude code, almost exclusively through vibe coding (although personal background in HTML/JS has helped) with a mix of models from Sonnet through Fable. Pure vanilla JS. No framework, no build step, zero dependencies. The client is a single HTML file that renders with DOM and CSS transforms (not canvas) and persists via localStorage. The multiplayer server is dependency-free Node. The WebSocket protocol itself is hand-rolled straight on net/http. Even the crypto is pure JS.

TL;DR: The goal is to have an intuitive game client that looks nice and is easy to set up and play with your friend group.

PLEASE NOTE THIS IS VERY MUCH A WORK IN PROGRESS! All feedback is appreaciated. 🙂

The only file required to try the client is the .html file, which is playable entirely offline. It has an interactive tutorial as well to get you going.

The server requires a few steps that are hopefully not too brutal (two downloads + installs, and two helper files to run). Only one person needs the client and server files, the other players will use the link provided by the host to play the game in their browser (although they might want the client file anyway to explore it offline and maybe complete the tutorial).


Server has been tested and works. Client and helper files supports Mac and Linux in theory but has not been tested, so any feedback is appreciated. 

## Bots (Elysium Bots)

The client can seat automated opponents — offline (hot-seat) or online. The bot bundle ships with the download:
`elysium-bot.js`, `elysium-cardfx.json` / `.js` (the card-effect library compiled from KRCG's `vtes.json`),
`elysium-twd-profile.json` / `.js` and `elysium-twd-archetypes.json` / `.js` (the tournament-deck prior the bots
read opponents against). Open **`START-HERE-BOTS.html`** for the player guide: what the bots know, the three
experience levels (Novice / Experienced / Expert), how to seat them and how a bot plays at your table.

Current bot: **v0.6.198** (12 Oct 2026), built against client v2.6.141 / server srv-2.6.43.

## Repository layout

This repository is a monorepo for two sister projects that only consume each other's releases:

| Folder | What |
| --- | --- |
| `/` | **the download** — exactly what a player gets: client, server, start scripts, the bot bundle, the guides |
| `client/` | the client & server project: sources, test harness and suites, `ELYSIUM-PROTOCOL.md`, its own docs |
| `bot/` | the bot project: `elysium-bot.js`, the arena (`elysium-bot-arena.js`), the cardfx pipeline, the suites, decks, analysis tools, its own docs |

`CLAUDE.md` at the root states the one rule (each half never edits the other's files; deploy = copy to the root).
Developers start in `bot/CLAUDE.md` or `client/CLAUDE.md`.
