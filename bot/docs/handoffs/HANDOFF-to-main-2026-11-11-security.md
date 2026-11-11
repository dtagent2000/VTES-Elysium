# HANDOFF to main — security: the critical items now, a plan for the rest (11 Nov 2026, bot v0.6.217 unchanged)

**Why.** On Discord a player (Steeve) argued that community web clients are exploit vectors: a public server that many people
run becomes a target, and an AI-written code base repeats patterns an attacker can predict. For a game without prize money,
cheating is not the main risk. **The risk is a server that is taken over and serves malicious JavaScript to everyone who opens
it** — the server hands out the client and the bot files itself. Johan asked us to send main what is critical now and ask main
for a plan for the rest. Everything below was read in the root's release (`elysium-server.js`, `elysium-vtes-bord.html`,
11 Nov), not run. Each item is main's call; the bot side changes nothing.

## What already holds (so the plan starts from it)
- Hidden information stays on the server: piles are server-side, `sanitizePub` whitelists every relayed board (no hand, no
  library, no face-down name), draws go only to their owner (PROTOCOL §4–5).
- The server has **no npm dependencies** (only `crypto fs http os path`) and the client loads **no external script** — no
  supply chain to poison.
- The 16–17 Oct review closed XSS through quotes, bounded WebSocket frames and fragments, rate-limited connections and the
  admin door, and fixed `X-Forwarded-For`. The HTML response already sends `nosniff`, `X-Frame-Options: DENY` and
  `Referrer-Policy: no-referrer`.

## Critical now (proposed for one round)
1. **A Content-Security-Policy on the client page.** None today. Peers control strings the client renders (names, clans, card
   ids, chat); one XSS has already happened. A CSP is the defence in depth that turns the next escaping slip into nothing:
   `script-src` limited to the page's own inline code (a hash or a nonce the server computes when it serves the page — the
   client is one file), `connect-src` to the server's own origin plus static.krcg.org, `img-src` to self, `data:`/`blob:` and
   static.krcg.org, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`. A `file://` client gets no header, so
   a `<meta>` CSP in the page is worth weighing too. Run the suite and the headless-Chromium probes under the policy:
   anything that breaks is something an attacker could have used.
2. **Room and server passwords: a salted, slow hash.** `passHash` is plain SHA-256 without a salt (`elysium-server.js:274`), and
   the room snapshot and the saves are scoped by it, so a leaked `elysium-rooms.json` gives every weak room password at
   dictionary speed — and with it the hand escrow, whose key is derived from the same password. Node's own `crypto.scrypt`
   (no dependency) with a per-room salt; existing snapshots need a migration path (rehash on the next correct join).
3. **Say when a connection is not encrypted.** The guided launchers use the Cloudflare tunnel (wss), but a direct `IP:8123`
   is plain `ws://`: room password, chat and the escrow blob in clear text. A visible line in the Join dialog and the table
   ("this connection is not encrypted") when the server is neither local nor TLS.
4. **A host checklist** (Help ▸ Local server and the runbook, short): keep Node up to date, never expose the port directly
   (tunnel only), use `--server-pass` for a public server, who holds the box's login, purge after a release. And **release
   hashes**: the sha256 of the root's client, server and bot files in the GitHub release notes, so a player who doubts a
   server can compare what it served.

## Ask: a plan for the rest
A short page with an order and a "done when" for each, so Johan can say "kör" item by item. Our list to start from:
- the unmasked WebSocket frames still accepted (`elysium-server.js:127`): measure whether any proxy sends them, then follow
  RFC 6455 §5.1;
- the hand-written SHA-256 / HMAC / PBKDF2 in the client (`elysium-vtes-bord.html:9655`, 20,000 iterations): WebCrypto where
  the page runs in a secure context, the own code only as the fallback, and a known-answer test against RFC vectors;
- online bots run in the host's tab (the host can read their hands; their console log names hand cards): bots spawned on
  the server for a hosted table;
- the hidden piles are plain text in `elysium-rooms.json`: whether encryption at rest is worth it when the running process
  holds them anyway;
- a verifiable shuffle (a hash of the dealt order published at the deal, the order shown after the game);
- a differential fuzz of every client→server verb (the 17 Oct frame fuzz covered the framing only) and, once, a review by a
  human outside the project;
- the single 1.6 MB client file: what would make it reviewable by an outsider (Thomas W.'s "too vibe-coded" is about this) —
  module boundaries, a map of where peer-controlled data is rendered.

Reply in `client/docs/handoffs/REPLY-to-bot-*.md` with what you take now and the plan page (or where it lives).
