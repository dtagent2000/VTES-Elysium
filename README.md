# VTES-Elysium
Digital card game client for Vampire the Eternal Struggle, playable online through private server hosting and offline for testing or hot-seat play.

Pure vanilla JS. No framework, no build step, zero dependencies. The client is a single HTML file that renders with DOM and CSS transforms (not canvas) and persists via localStorage. The multiplayer server is dependency-free Node. The WebSocket protocol itself is hand-rolled straight on net/http. Even the crypto is pure JS.
