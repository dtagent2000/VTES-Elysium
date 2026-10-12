# Elysium Security Manifest

*Living document, first published 24 July 2026 (client v2.6.41 / server v2.6.20, elysium.cards go-live day). Two parts: the full manifest for anyone who wants detail, and the short About-dialog insert (§8) for everyone else. Update whenever the security posture changes; the change log is §9.*

---

## 1. Architecture in one paragraph

Elysium is one HTML file (the client) and one Node.js file (the server), with **zero third-party code dependencies on either side** — the entire npm supply-chain attack class, the most common compromise vector for small web services, does not exist here. The server runs on a single machine in Helsinki, Finland (EU), with **zero network ports open to the internet**: players reach it exclusively through an encrypted Cloudflare tunnel (the server dials *out* to Cloudflare; nothing can dial in), and the operator reaches it exclusively through a private Tailscale network. The service runs as an unprivileged system user inside a systemd sandbox (`ProtectSystem=strict`, `NoNewPrivileges`, memory-capped) that can write only to its own data directory. The operating system security-patches itself daily.

## 2. What data exists, where, and for how long

**No accounts exist.** No emails, no registration, no passwords tied to identity, no tracking pixels, no analytics, no ads. Elysium itself sets no cookies; play requires only choosing a display name.

| Data | Where it lives | For how long |
|---|---|---|
| Display name, room name, chat, public game state (board, resources, log) | Server memory + a periodic disk snapshot (so tables survive restarts) | Deleted when the room empties; a room where everyone has been offline > 60 min expires automatically |
| Your decklist during play | Server memory only — required so the server can hold your hidden library/crypt and deal your cards (this is what makes cheating hard) | Expires with the room, same rules as above |
| Your hand | **Encrypted on your device** with a key derived from the room password before it ever leaves your browser; the server stores and relays the sealed blob but cannot read it | Expires with the room |
| Named match saves | Server disk, opt-in (you click Save), max 3 per password group | Auto-deleted after 90 days without a save or load |
| Your IP address | Used in memory for rate-limiting and abuse throttles; written to server logs **only when an abuse limit trips** | Rotates out with normal system log rotation |
| Deck library, settings, card-image archive | **Your browser only** (localStorage/IndexedDB on the elysium.cards origin, or your local file copy) | Never uploaded; yours entirely |

## 3. Who can see what

- **Other players in your room** see exactly what the game rules reveal: names, chat, the public board. Never your hand, never your library, never your unrevealed crypt — those live server-side (hidden zones) or encrypted (hand), and the protocol's standing invariant is that hidden information appears in no broadcast, ever.
- **People outside your room** see nothing of it. The lobby's room list shows room names and player names unless the room sets the anonymous flag; passworded rooms show a lock.
- **Cloudflare** carries all traffic as the TLS-terminating edge (like a very large share of the web). In principle Cloudflare's infrastructure can observe traffic passing through it; this is the standard trade of using any CDN/DDoS shield.
- **The operator (one private person in Sweden)** can technically read what the server holds: public room state and decks-in-play in memory/snapshots, and abuse-event logs. He cannot read hands (encrypted client-side). No monitoring of game content happens; logs exist for abuse defense and debugging. This is an honesty statement about trust, not a practice.

## 4. Transport & perimeter

Browser ↔ Cloudflare: HTTPS/WSS enforced (HTTP is 301-redirected at the edge, so passwords and play never travel in cleartext). Cloudflare ↔ server: the outbound-established, credentialed tunnel. Server perimeter: on-box firewall default-denies everything inbound except the private Tailscale interface, and (platform round, §5) an infrastructure-level Hetzner firewall in front of the machine denies all inbound before packets even reach it. SSH exists only inside the operator's private Tailscale network with password authentication disabled and root login disabled. Fallback administrative access is the hosting provider's out-of-band console, behind a 2FA-protected account.

## 5. Platform controls (enabled inventory)

- **Cloudflare:** Always Use HTTPS ON · DNSSEC ON (platform round) · Rocket Loader OFF, Email Obfuscation OFF, and every HTML-rewriting feature OFF, verified by byte-comparing edge-served pages against the origin file · unmetered DDoS protection (free plan) · account on app-based 2FA with offline recovery codes · domain auto-renew ON.
- **Hetzner:** Cloud Firewall with zero inbound allow-rules applied in front of the machine (platform round) · delete/rebuild protection ON (platform round) · account on 2FA.
- **Tailscale:** two-device private tailnet · Tailscale SSH with tailnet-identity auth · **server node key expiry disabled** (platform round — prevents a silent day-180 lockout) · account (Google) on 2FA.
- **On the box:** unattended security upgrades daily · service sandboxed and memory-capped · graceful SIGTERM flush (updates mid-game cost ~2 s and tables restore automatically).
- **In the application:** per-connection message rate limits, per-IP connection caps (proxy-aware, keyed on real client IPs), password-fail lockouts, global connection ceiling, spectator caps, 256 KB message size cap, a WebSocket Origin allowlist (blocks hostile third-party pages from opening sockets via visitors' browsers; the downloaded local client remains supported), a slow-reader guard (connections that stop draining are dropped), a room-reservation system (squatter bots filling the room list can occupy at most 40 of 50 slots; the final 10 are permanently reserved for rooms that have ever seated a real player, and never-seated shells expire in 10 minutes), standard security headers (nosniff, frame-embedding denied, no referrer leakage), input sanitization on every string, server-derived identity (a client can never claim another seat), and timing-safe password comparison.

## 6. Honest limitations & remaining risks

- **This is a hobby service, run best-effort by one person.** No SLA, no on-call team, no formal third-party security audit or penetration test has been performed.
- **The global room list can be squatted by a determined adversary with many IP addresses** — the reservation system plus short expiry for empty rooms reduces the impact but doesn't eliminate it; the Cloudflare IP Access Rule is the ban hammer if it ever becomes real. **Room passwords are shared secrets between friends** — everyone at the table types the same phrase. Pick a fun phrase; never reuse a real password from anywhere else.
- **Chat and names are visible to your room** (and to the room's spectators). Say nothing you wouldn't say at a physical table with an open door.
- **Anti-cheat is social, not cryptographic, for public state**: hidden zones are protected server-side, but the server deliberately does not enforce game rules — rooms are consenting groups, and the ledger makes public resources unforgeable, not unbreakable.
- **Infrastructure trust:** Cloudflare, Hetzner, and Tailscale are load-bearing. A compromise of those platforms — or of the operator's accounts with them — is the realistic worst case, which is why all three sit behind hardware-independent 2FA and the recovery material lives offline.
- **Backups** of the (low-value, mostly ephemeral) server data follow a local rotation on the machine; treat named saves as a convenience, not an archive.

## 7. Contact & data requests

Questions, security reports, or "please delete X": contact the operator via the route in the About dialog. There is deliberately little to request — the design goal is that the interesting data never reaches the server at all.

## 8. The About-dialog insert (integrate in the H4 client session, EN, ~200 words)

> **Security & your data, in short**
>
> Elysium runs on a single small server in the EU (Helsinki) with **zero open network ports** — all traffic flows through an encrypted tunnel over HTTPS/WSS. The software has **zero third-party dependencies**, sets no trackers or analytics, and requires no account.
>
> While you play, the server handles your display name, room name, chat, and the public board — plus your decklist in server memory, so it can hold your hidden cards honestly. **Your hand is encrypted on your device with the room password before it leaves; the server relays it but cannot read it.** Your IP is used for rate-limiting and is logged only on abuse events. Room data expires within an hour of everyone leaving; named saves are opt-in and expire after 90 days untouched. Your deck library, settings, and card images live **only in your browser** — never uploaded.
>
> Honest limits: this is a hobby service run best-effort by one person, without a formal security audit. Room passwords are shared phrases between friends — **pick a fun phrase, never a real password.** Questions, bug reports, or feedback: the 'Tools feedback' channel on the V:TES Discord. Full details live in the Elysium Security Manifest.

## 9. POST /client-error — the first body-reading route (and its two GET siblings; srv-2.6.25–26)

Surface: unauthenticated HTTP POST, JSON body. Mitigations, in request order: (1) body hard cap
64 kB (B-63, srv-2.6.29; 32 kB before) — the socket is destroyed mid-stream at the cap, no response is written (nothing to
measure); (2) rate limit 10 posts / 10 min keyed on `deriveIp` (NOT the raw socket address —
behind the Cloudflare tunnel every raw peer is loopback), pruned in the existing GC sweep, and
posts beyond the cap are swallowed WITHOUT recording a strike (the window cannot be extended by
flooding); (3) strict field whitelist via the pure `errRecord()` — unknown keys never reach disk,
every string is control-char-scrubbed and length-capped, `ring` ≤200 × 200 chars (`ERR_RING_MAX`, B-63; both
element shapes accepted — `{t,m}` objects from v2.6.60+ clients with `t` dInt-coerced, bare strings from older), `summary` is a
field pick, and a report's OPTIONAL `dump:{game,env}` (B-63) goes through the pure `dumpRecord()` — the same
whitelist discipline one level down: board ≤600 field-picked entries, hand ≤120 scrubbed names, seats ≤8,
deck census ≤30, every number `dInt()`-coerced (deliberately NOT `|0`, which int32-wrecks ms epochs), unknown
keys dropped at EVERY depth; `env.settings` (srv-2.6.30) is the one SHAPE-whitelisted member — the client's
preference surface is client-defined and growing, so the contract is key pattern + scalar-only value types +
per-value and per-bag caps rather than a name list, with the same nothing-unvetted guarantee (settings are the
reporter's own UI preferences: no names, no tokens, consent-covered); (4) `204 No Content` in every visible case — accepted, rate-limited and malformed
are indistinguishable to a prober; (5) disk: JSONL append-only, 1 MB rotation to a single `.1`,
4 MB total guard of last resort — a determined flood costs at most 4 MB once and then writes
nothing; (6) **no IP address is ever persisted** — the address exists only in the in-memory
limiter map; (7) the JSONL is never rendered as HTML by anything — it is read with jq/tail; if a
future admin UI ever displays it, escape at THAT boundary. Residual risk accepted: a botnet
rotating IPs can write 10 rows each until the 4 MB guard closes the book — bounded, boring, and
observable in the file itself. **B-63 privacy note (the widened WRITE payload):** the rule that an
opponent's face-down card arrives as a NAMELESS position stub is enforced CLIENT-side at capture
(`_dumpCard`), because in hotseat `buildPub` shares names between local seats — the server never
invents an `n` field but CANNOT verify a modified client's honesty. That is the same posture as the
whole open-data client model: the dump only ever contains what the REPORTING player could already
see plus their own hand (included by consent — the report dialog says so in plain words), so a lying
client leaks only its own information.


**GET /client-errors.txt — the first authenticated read surface.** Gated on the EXISTING
`--admin-pass` credential via the same timing-safe `passMatch` as the hello door; failed
attempts throttled per derived IP (`ipLogAuth`, same window/max as the intake); **404-uniform**
— wrong key, locked out, and no-key-configured are indistinguishable, and without
`--admin-pass` the route is OFF entirely; the lockout holds even against the CORRECT key
(brute force buys nothing). The log contains no IPs by construction, so the read surface leaks
no identities. The key rides in the URL through Cloudflare's TLS — accepted for the admin's
own credential; rotation = change the flag + restart.

**GET /admin/maintenance — the control surface.** Same auth family and the SAME throttle map
as the log pull. Strict `on/off === '1'` (a truthy-string `?on=0` must not arm). State
persisted to DATA_DIR (a crash-restart cannot silently reopen creation) and auto-expiring (an
admin who forgets `&off=1` leaks nothing — the window closes itself). Named trade-off: GET
with side effects — impure REST, deliberately chosen for phone-browser ergonomics; the blast
radius of a leaked arm-URL is a nuisance broadcast plus paused creation until expiry, bounded
and reversible.

## 10. Change log

- **24 July 2026** — first publication, on go-live day. Platform round booked the same day: Hetzner Cloud Firewall (deny-all inbound) + delete protection, Tailscale server-key expiry disabled, Cloudflare DNSSEC.
- **24 July 2026, late** — final-sanity round (srv-2.6.21): WebSocket Origin allowlist, security headers, slow-reader guard; edge-cache rule promoted to pre-wide-launch.
- **24 July 2026, very late** — room-flood reservation guard (srv-2.6.22: RESERVED_POPULATED=10, never-seated 10-min reap, everPop flag) and the admin create-throttle bypass (srv-2.6.23).
- **26 July 2026** — §8 integrated verbatim into the client's About dialog (cli-2.6.42); the donations line verified compliant with the Dark Pack agreement (time/materials donations explicitly permitted) and framed as voluntary server-cost support.
- **5–7 August 2026** — the telemetry surface lands (srv-2.6.25–26): POST /client-error intake (32 kB cap, deriveIp-keyed limiter, field whitelist, 204-always, no IP persisted), GET /client-errors.txt admin pull (timing-safe passMatch, 404-uniform, OFF without --admin-pass), GET /admin/maintenance graceful-drain window (persisted, auto-expiring). Details in §9.
- **8 August 2026** — bot statics route (srv-2.6.28, hotseat-bot track): `GET /elysium-bot.js` + `GET /elysium-cardfx.json` by EXACT `req.url` match (nothing decoded, no pattern: near-name misses and encoded traversal shapes 404), `nosniff`, 300 s cache, purge ritual alongside the client. Protocol §6.3.
- **9 September 2026** — THE MERGE (srv-2.6.31 = srv-2.6.28 + srv-2.6.29/30): no new surface, the union of the two lineages' HTTP routes; WebSocket verbs untouched.
- **11 August 2026** — B-63 diagnostic dump (srv-2.6.29): report payloads MAY carry the client's full player-visible snapshot; body cap 32→64 kB, ring 30→200 both-shapes, the pure `dumpRecord()` whitelist at every level, `dInt()` numeric coercion. Opponent face-down cards arrive as nameless stubs — filtered CLIENT-side, honestly unverifiable server-side (same open-data posture as always). Details in §9.
- **9 October 2026** — srv-2.6.43: the bot knowledge layer's two data files (`/elysium-twd-profile.json`, `/elysium-twd-archetypes.json`) join the bot statics on the SAME exact-match route (a fixed set of four paths; nothing decoded, same headers, 300 s cache, purged on deploy). The new WebSocket verb `botcfg` (the table's bot tempo) is a bounded table setting: two validated fields (an enum and a clamped number), seated humans only, stored per room, replayed to late joiners. The room snapshot now also keeps board style, the referee password's hash (the same hash form as the room password, which the snapshot has always held), match length, the populated flag, the tempo and each seat's bot flag — no new personal data; a restored table is no longer swept as an empty shell after a restart.
