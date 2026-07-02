# VTES-Elysium
Digital card game client for Vampire the Eternal Struggle, playable online through private server hosting and offline for tutorial, testing or hot-seat play.

The scope of this project is to have an intuitive UI/UX of modern fidelity that will facilitate synchronized play between multiple people online. It has several basic helper features like a deck builder and small server solution so you can play with your friend group, but players are encouraged to use other specialized tools for deck-building and welcomes other server solutions to facilitate more robust and safe online play with unknown people as well as tournament organization where the game client can act as the "shell" for actual play.

Pure vanilla JS. No framework, no build step, zero dependencies. The client is a single HTML file that renders with DOM and CSS transforms (not canvas) and persists via localStorage. The multiplayer server is dependency-free Node. The WebSocket protocol itself is hand-rolled straight on net/http. Even the crypto is pure JS.

The goal is to have an intuitive game client that looks nice and is easy to set up and play with your friend group.

PLEASE NOTE THIS IS VERY MUCH A WORK IN PROGRESS! All feedback is appreaciated. 🙂

The only file required to try the client is the .html file, which is playable entirely offline. It has an interactive tutorial as well to get you going.

The server requires a few steps that are hopefully not too brutal (two downloads + installs, and two helper files to run). Only one person needs the client and server files, the other players will use the link provided by the host to play the game in their browser (although they might want the client file anyway to explore it offline and maybe complete the tutorial).


Server has been tested and works but is currently being polished and new files will be presented. Client and helper files supports Mac and Linux in theory but has not been tested, so any feedback is appreciated. 
