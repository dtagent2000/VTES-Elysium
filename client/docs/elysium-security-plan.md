# Elysium security plan — from the 11 Nov 2026 handoff

*Main's answer to `bot/docs/handoffs/HANDOFF-to-main-2026-11-11-security.md` (the "plan for the rest" it asked for).
Written 11 Nov 2026 with client v2.6.173 / srv-2.6.50. Each item has an order, a "done when", and who decides.
Johan says "kör" item by item. Update the status column when an item moves; keep finished items, struck through, so the
page stays the record.*

## The threat this plan is about

For a free game the main risk is not cheating. It is **a server that is taken over and serves malicious JavaScript to
everyone who opens it** -- the server hands out the client and the bot files itself. Three kinds of defence, kept apart
because they answer different questions:

| Defence | Against | Where it stands (11 Nov) |
|---|---|---|
| **Not being taken over** | a hole in the server or the box | strong already: no open port (Cloudflare tunnel out, Tailscale for SSH), the service sandboxed and unable to write the code files (root-owned, `ProtectSystem=strict`), no npm dependency, manual deploys. The remaining doors are the code itself (items 2–3 below) and the accounts (Cloudflare, Hetzner, Tailscale, GitHub). |
| **Noticing it** | a takeover nobody admits to | NEW: the served-bytes watchdog -- a daily GitHub run, outside the box, checks that every byte elysium.cards serves is a version committed to `main` (runbook §10). |
| **A way around it** | a player who doubts the server | the client file from GitHub, opened on their own machine, joins any server and never runs code the server sends (Help ▸ Local server ▸ Hosting checklist says so). Item 1's `<meta>` policy hardens exactly that copy. |

A Content-Security-Policy is about a **different** risk: script injected through what other players write (names,
clans, card ids, chat) -- one such slip already happened (v2.6.162). A policy sent by a taken-over server protects
nobody, because the attacker writes the header too.

## Built now (client v2.6.173 / srv-2.6.50 — PR "THE WATCHED DOOR")

| Item | What shipped | Measured |
|---|---|---|
| 1. CSP, step 1 | a **report-only** policy on the page, hashes made by the server from the bytes it sends (never stale, no nonce); the last eight inline handlers gone; the help tab's script hashable (`#helpNavJs`); every report reaches `/client-error` as kind `csp` and the digest's own line | headless Chrome on the real pair: page, bot load, help tab, three hosts, 0 reports; v2.6.172 under the same server reports the clan-symbol handler. With the policy switched to ENFORCE in a scratch copy: v2.6.173 works throughout, v2.6.172 loses the help tab's script and the failed clan symbol stays visible |
| 2. Passwords | `s1$` = scrypt over the SHA-256, one salt per server inside every hash, the old hashes wrapped at the first start, a success remembered (never a failure) | dispatch + a live run: a legacy snapshot and save boot as s1, the room opens over a real socket with its old password only, a restart wraps nothing twice and a new room with the same password lands in the old save's group |
| 3. Not encrypted | the Create/Join dialog says it before the password is typed (a quiet line on a private network or tailnet, a warning across the internet); the room bar marks the latter | headless Chrome with two hosts mapped to this machine: `play.example.com` warns and marks, `pi.local` says it quietly, `127.0.0.1` says nothing |
| 4. Checklist + hashes | Help ▸ Local server ▸ Hosting checklist; `client/SHA256SUMS` (our 13 release files; check-versions fails when stale); the watchdog workflow | `test-served-check.js`: the committed release passes, one flipped bit fails, CR LF passes with a note, nothing listening is "could not check"; the same against a shallow clone |
| found | the escrow crypto had no test (CLAUDE.md named a `test-crypto.js` that never reached the repo): FIPS 180-4, RFC 4231, RFC 7914 vectors + a differential AEAD test against Node; `/images/` gets a sandbox policy; the About text no longer says the server cannot read a hand | |

## The order from here

| # | Item | Done when | Decides | Status |
|---|---|---|---|---|
| 1 | **Enforce the CSP.** After a week on elysium.cards with the report-only policy: the header becomes `Content-Security-Policy` (+ `frame-ancestors 'none'`), and the page itself carries a `<meta>` policy with the same hashes, so the downloaded `file://` client is covered too (`file:` added to `script-src`/`img-src`, `ws: wss:` to `connect-src` -- the file must reach any server). A tool writes the meta's hashes; `check-versions.js` fails on a stale one (a stale hash would blank the client in every browser -- the gate is the safety). | the digest's CSP line quiet for 7 days of real traffic; Firefox and Safari loaded the enforcing page once (by hand, or a player's report); the headless run green under enforcement in all three contexts (served, `file://`, a LAN host) | Johan, when the week is quiet | open |
| 2 | **A fuzz of every client→server verb.** Random types, sizes, unicode, negative and huge numbers, `__proto__`/`constructor` keys, for each verb in PROTOCOL §7 against the real server, with three invariants checked after every message: the process lives, no hidden zone appears in any message to another connection, the snapshot round-trips. A fixed seed and a short budget in CI, long runs by hand. (The 17 Oct fuzz covered the framing only.) The bot project's own client must keep masking its frames (item 5). | the fuzz is in CI and a 1-hour run finds nothing open | main | open |
| 3 | **Reviewable by an outsider.** A security map (`client/docs/elysium-security-map.md`): the trust boundaries, every place peer data is rendered (today ~160 `innerHTML` writes) and how it is escaped, the verbs and their checks, the crypto. Plus a gate that refuses an `innerHTML` built from a peer string without the escaper (or an annotated exception). Then an outside human reviews it -- the map is the packet. Thomas W.'s "too vibe-coded" is about this, more than about module boundaries. | the map exists, the gate is in CI, and a reviewer has read it | main builds; Johan finds the reviewer | open |
| 4 | **The slow hash under a flood.** Each fresh wrong guess costs ~40 ms of the event loop; the lockouts are per address, so a botnet could slow the server. A server-wide budget of hashes per second (beyond it: "busy, try again", no hash) closes it. | a test drives 200 fresh guesses from 200 addresses and the event loop never stalls past 100 ms | main | open |
| 5 | **Unmasked WebSocket frames.** srv-2.6.47 accepts and logs them (`[ws] unmasked client frames …`). On the box: `sudo journalctl -u elysium --since "2026-10-17" \| grep unmasked`. Empty → refuse them (RFC 6455 §5.1: close the connection), with a test; and the bot project confirms its Node client masks (the server comment says it does). | the log has been read, and the refusal ships with a test | Johan reads the log; main builds | open |
| 6 | **Bots in the host's tab.** The host can read the bots' hands (devtools; the bots' console names hand cards). Now: say so where bots are added ("the bots run in your browser; you can see their hands"), and the bot project quiets its console outside debug. Bots spawned on the server instead: parked -- the bot's code would run inside the server process (a new attack surface that parses other players' lines), on a 2-vCPU box, and every bot release would become a server deploy. | the line is in the client; their console is quiet by default | main (the line); the bot project (the console) | open |
| 7 | **A verifiable shuffle.** A hash of the dealt order published at the deal only proves the order was not changed AFTERWARDS -- not that it was fair (a server can commit to a stacked deck). The working shape is commit-then-mix: the server commits to its seed, each player sends a seed of their own, the order comes from both, and everything is revealed after the game for the client to check. Every reshuffle (a search) needs the same. | Johan wants it (low value for a free game) | Johan | parked |
| 8 | **The hidden piles at rest.** Not worth encrypting: the running process holds them, so the key would sit beside them; the realistic leak is a backup -- keep backups short-lived and readable by root only. The manifest says this. | written down (done with this round) | — | ~~done~~ |
| 9 | **WebCrypto for the escrow.** Not worth two code paths (the escrow must also work over plain-http LAN, where `crypto.subtle` does not exist). The weak link is the room password, not the cipher; the known-answer tests (built now) are the guard. Reopen if the cipher itself changes. | — | — | ~~decided: no~~ |
| 10 | **Google Fonts.** The page loads two font families from Google, so every visitor's address goes to Google, and the policy must allow two Google hosts. Self-hosting them (OFL, ~200 kB) removes both, against Johan's wish that the root hold no third-party files. | Johan's call | Johan | open |
| 11 | **Secrets on the command line.** `--server-pass`/`--admin-pass` are visible to anyone who can list processes on the same machine. A `--admin-pass-file` (or an environment variable) would keep them off it. Low on a box nobody else logs in to; the checklist says so for shared machines. | — | Johan | open |

## Not in this plan

Cheating with hidden information inside the rules (the server already holds every pile and relays only what the rules
reveal); account security (there are no accounts); denial of service at Cloudflare's scale (Cloudflare's).

*Evidence for every "measured" above: `client/docs/elysium-session-journal.md` (DEN BEVAKADE DÖRREN, 11 Nov 2026).*
