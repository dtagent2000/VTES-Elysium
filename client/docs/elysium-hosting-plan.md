# Elysium — Permanent Hosting Plan (24/7 public instance)

*Self-contained hand-off, 17 July 2026. A fresh chat can execute this plan from this brief alone. Read `elysium-project-context.md` + `elysium-learnings.md` first as usual. Companion to the retired backlog §4 "VPS hosting" item, which this document supersedes and expands.*

*Status: **DECIDED 17 July 2026 — D1–D7 all locked (Johan: "kör på allt som rekommenderas", D2 = elysium.cards). H1 ✅ + uncertainty round ✅ (srv-2.6.19 is the deploy version); H2+ unblocked.** The domain's availability is finally confirmed only at registration — fallback ladder in §6/D2. Extended the same evening after the final "anything I've missed?" sweep: meta-account hardening (H2 step 0 + threat-model row), the soft launch (H3), OG tags / password placeholder / best-effort About (H4), and the restore drill + bus-factor items (H5). **Del A executed 24 July 2026: elysium.cards REGISTERED at Cloudflare** (first attempt bounced, cause unrecorded — resolved on retry); the availability caveat and fallback ladder are retired, kept for history. **H2 WENT LIVE 24 July 2026, evening: box hardened (zero open ports), srv-2.6.20 under systemd, dashboard-managed tunnel up, elysium.cards serving — byte-identity receipt IDENTISK (edge bytes = origin file).** Remaining H2 tail: EO toggle confirmation, images/vtes.json population (D5), cache rules (Appendix B), apt origins for cloudflared/tailscale (H5). Next: H3 smoke.*

---

## 1. Why this document exists

The verdict from the playtest community: people like the client a lot, but most are uncomfortable or skeptical about running a private server themselves. The project therefore pivots from "everyone hosts their own" to **one permanently hosted instance where anyone can open the page and create a room** — the lobby (L1+L2, shipped v2.5.68) already IS that product; what's missing is a place for it to live 24/7 with a security posture Johan doesn't have to be a network engineer to trust.

Johan's stated constraint: he is a UI/UX person, not a network-security person. The plan is therefore optimized for **minimal attack surface by architecture** (things that are secure because they don't exist, not because they're configured correctly) and **minimal ongoing operator burden** — over raw flexibility.

## 2. What already exists (source-verified inventory)

This section is the genomlysning proper. Every claim below was verified against `elysium-server.js` (v2.6.17) / `elysium-vtes-bord.html` (v2.6.41) / `ELYSIUM-PROTOCOL.md` §4 on 17 July 2026 — line references are vs those versions and will drift.

**The honest headline: the codebase is already substantially deployment-ready.** The v2.5.x tunnel/lobby/hardening arc built the groundwork deliberately. What remains is a small code punch list (§7, H1) plus infrastructure and operations — not a code project.

### 2.1 Transport & client

- The server hosts the page AND the WebSocket on one origin; the client derives `wss://`/`ws://` and port from the page's own scheme (`cleanAddr` strips `:8123` over https). A named tunnel behaves identically to the quick tunnels already in daily use — zero client changes needed.
- 30 s server WS ping keeps idle games alive through Cloudflare's ~100 s idle timeout; 75 s dead-connection reaper; client auto-reconnects at 2.5 s with a superseded-socket guard.
- Stable origin = guest persistence: IndexedDB (image archive + ~3 MB card DB) and localStorage (saved decks) are per-origin. Every quick tunnel was a fresh origin, so guests re-downloaded everything each session. A permanent domain fixes this for free — the backlog's "second motivation," now the primary one.

### 2.2 Server door, roles, and proxy awareness

- `--server-pass` (the door; timing-safe, throttled), `--admin-pass` (per-connection admin via `hello`, dies with the socket, inherits every host err-gate), `--create-policy anyone|admin`, `--trust-proxy` (believe `CF-Connecting-IP`/`X-Forwarded-For` **only** from a loopback transport peer — spoof-safe). All live in the mutable `CFG` object, all covered by the dispatch suite.
- Host identity per room = the creating connection, reclaimable via `hostToken`. Host-only verbs gated (§7 of the protocol), admin inherits them.

### 2.3 Abuse limits (verified constants, v2.6.17)

| Limit | Value | Keying | Tunnel-aware? |
|---|---|---|---|
| Message rate | 80 msg / 10 s per connection → hard close | per connection | n/a |
| Max WS message | 256 KB (single frame AND fragment reassembly) | per message | n/a |
| Concurrent sockets | 16 per IP | per IP, loopback exempt | ✔ restored by `--trust-proxy` |
| Password failures | 5 / 10 min → lockout | per IP; per-room when loopback | ✔ by design |
| Room creation | 4 / hour | per IP, loopback exempt; global bucket at 4× when all-loopback | ✔ restored by `--trust-proxy` |
| Rooms (global) | 50 | global | n/a |
| Players per room | 6 (+ spectators, **no per-room spectator cap found** — H1 item) | per room | — |
| Named saves | 50 global, never expire, deletion gated on the room passHash | global | — (policy decision D4) |

### 2.4 Room & data lifecycle

- Empty rooms are deleted immediately on last leave. Rooms where **everyone** has been offline > 60 min expire (both verified). So a public instance self-cleans; junk cannot accumulate beyond MAX_ROOMS for more than an hour.
- Persistence: `elysium-rooms.json` + `elysium-saves.json`, snapshot every 60 s + on SIGINT **and** SIGTERM (srv-2.6.9 — built specifically for the systemd/always-on case). Writes are `writeFileSync` to `.tmp` then rename — atomic, but blocking (known debt; a few ms at this data size, H1 makes it async as belt-and-braces).
- `uncaughtException`/`unhandledRejection` are logged-and-survived — one malformed message can't take the table down.

### 2.5 Protocol security invariants (PROTOCOL §4, all verified present)

1. The server derives the actor's seat from the connection — never trusts a client-sent seat for identity.
2. Every string sanitized before store/re-broadcast (`cleanName`/`cleanCard`/`cleanId`, length caps on arrays); `log` and `revealHand.pub` are `sanHtml()`-wrapped server-side (v2.5.64).
3. Every rate limit answers "what does this key to behind a tunnel?" (the loopback rules above).
4. Hidden stays hidden: opponent hands/libraries/crypts never in any broadcast; the hand travels only as an encrypted escrow blob (PBKDF2 from the room password + public salt — the server routes but cannot read it).
5. `/images/` path traversal is unrepresentable: the `norm()` character-class whitelist plus a `startsWith(IMAGES_DIR)` defence-in-depth check; `vtes.json` is exact-name whitelisted; served with async `fs.readFile`.
6. The server-authored resource ledger (v2.5.65–66) means a modified client can neither forge nor omit the public-resource narration.

### 2.6 The supply-chain story (worth stating out loud)

Zero npm dependencies on both sides. The entire npm supply-chain attack class — the dominant real-world compromise vector for small Node services — **is absent by construction**. The trust surface is: the Node runtime, the OS, Cloudflare, and Elysium's own two files. This is a genuinely strong security property of the zero-dep philosophy and should be preserved through deployment (no bundlers, no Docker-image dependency layers required — deploy is literally `scp` of two files).

### 2.7 Known gaps this plan addresses

- `srv.listen(PORT)` binds all interfaces (no host arg) — fine behind ufw, but loopback-bind is free depth (H1).
- No `/healthz` route for uptime monitoring (H1).
- No global (non-per-IP) connection ceiling (H1).
- No per-room spectator cap (H1 — verify then cap).
- `writeFileSync` blocking (H1 — async).
- Named-saves policy unfit for a public instance as-is: 50 global slots, first-come, never expire (D4).
- No focused audit of client `innerHTML` sinks against the §4 sanitizers since the stakes rose (H1 — review pass, likely zero changes; the server-side `sanHtml` + client escaping discipline is believed complete, but "believed" isn't "audited at public-instance stakes").
- HTTP `requestTimeout`/`headersTimeout` left at Node defaults (fine behind Cloudflare, which absorbs slowloris; H1 sets them explicitly anyway — one line).

## 3. Threat model for a public 24/7 instance

| Threat | Mitigation (existing ✔ / planned →) | Residual |
|---|---|---|
| Volumetric DDoS | → Cloudflare edge (free plan includes unmetered DDoS) | CF-grade; acceptable |
| Origin discovery / direct attack on the VPS | → Named tunnel = **zero inbound ports**; origin IP never in DNS | Effectively closed |
| Password brute force (rooms) | ✔ 5/10 min throttle, per-real-IP via `--trust-proxy` | Closed |
| Socket/memory exhaustion | ✔ 256 KB msg cap, 16 conns/IP, 80 msg/10 s; → global ceiling, spectator cap | Low |
| Malicious payloads / identity spoofing | ✔ §4 invariants (seat derivation, sanitizers, whitelists) | Low |
| XSS via chat/log/names | ✔ server `sanHtml` + client escaping; → H1 sink review at public stakes | Low after review |
| Supply chain | ✔ zero npm deps; → OS/Node patching via unattended-upgrades + LTS | Low |
| Server compromise blast radius | → dedicated user, systemd sandboxing, nothing else on the box, no secrets beyond pass-hashes + tunnel credential | Contained |
| Cheating | ✔ sanitize/gate/ledger observation model (the server still can't spell "bleed" — by design); rooms are consenting friend groups with passwords | Accepted per project philosophy |
| Griefing/moderation on a public lobby | ✔ room passwords, anon flag, host mute/kick, admin role; → CF IP rules as the ban hammer; → About-page contact | Manageable |
| Privacy/GDPR | ✔ no accounts; room data expires ≤ 60 min after everyone leaves; saves are user-initiated; → one About line stating this + contact | Minimal footprint |
| **Meta-account compromise (Cloudflare / Hetzner / Tailscale — the new crown jewels)** | → the origin is unaddressable, so the panels that CONTROL it become the target: app-based 2FA on all three, recovery codes stored offline, domain auto-renew ON (an expired domain is registrable by anyone — and every guest's stored address then points at a stranger's server), billing e-mail actively read (an expired card deletes the VPS after a grace period). H2 step 0. | Low with step 0 done; the most common miss in otherwise well-hardened hobby deploys |
| Community dependency (bus factor of one) | → a second trusted admin holds the admin-pass + a one-line runbook; Hetzner's web console is the emergency door if every SSH path fails; keys' whereabouts written down (H5) | Accepted for a hobby service; mitigated |
| Operator error (the real risk for a non-network person) | → architecture where the dangerous knobs don't exist: no open ports to firewall wrong, no TLS certs to renew, no npm to update | This is the design driver |

## 4. Architecture options compared

**A. VPS + named Cloudflare Tunnel** *(recommended)* — `cloudflared` runs on the VPS and dials **out** to Cloudflare; the public hostname routes through that tunnel to `localhost:8123`. Zero inbound ports. TLS, DDoS, caching, stable domain all at the CF edge (free plan). Matches `--trust-proxy` exactly (it was written for this). Same mental model as today's quick tunnels — continuity for Johan as operator. Cost: VPS ~€4/mo + domain ~$11/yr.

**B. VPS + Caddy direct (optionally behind CF orange-cloud)** — Caddy auto-TLS, ports 80/443 open, 8123 loopback. One less third party in the data path, but now there ARE open ports, cert renewal, and direct-exposure concerns to own. More knobs = more operator risk for this operator. Kept as the documented "Bring your own server" alternative for self-hosters, not chosen for the official instance.

**C. PaaS (Fly.io / Railway / Render)** — the platform owns OS/TLS. But: free tiers either sleep (Render — kills 24/7 WS rooms) or are gone; persistent volumes needed for the two JSON files; a Dockerfile/build artifact enters a zero-build project; platform semantics (machine stop/start) to learn. Costs land at the same ~$4–5/mo as a VPS with less control. Rejected for the official instance.

**D. Home server / Raspberry Pi + named tunnel** — 0 kr/mo and technically sound (tunnel hides the home IP, opens no ports). Rejected for the official instance on separation-of-concerns (a public service should not live on the home LAN) and uptime (ISP, power, "someone rebooted the router"). Valid budget fallback.

**E. Cloudflare Workers/Durable Objects rewrite** — would require rewriting the hand-rolled WS server for a proprietary runtime. Violates the zero-dep/single-file philosophy for no benefit at this scale. Rejected.

## 5. Recommended target architecture

```
Browser ──TLS──▶ Cloudflare edge ──(outbound-established tunnel)──▶ cloudflared ──▶ 127.0.0.1:8123
        (wss)    · DDoS shield                (on the VPS)              elysium-server.js
                 · cache /images/* (long TTL)                           --trust-proxy
                 · cache / (short TTL, purge on deploy)                 --admin-pass <secret>
                 · Auto Minify OFF, Rocket Loader OFF  ◀ FOOTGUN        --create-policy anyone
                                                                        (no --server-pass: open door)
VPS: Hetzner CX22 (Helsinki) · Ubuntu 24.04 LTS minimal · Node 22 LTS
     ufw: deny ALL incoming (SSH via Tailscale only → zero open ports on the public interface)
     systemd: elysium.service (hardened, dedicated user) + cloudflared.service
     unattended-upgrades ON · data in /opt/elysium/data (rooms/saves JSON) · nightly local backup rotation
```

Design notes:

- **The security headline for a non-network operator:** the machine is unaddressable from the internet. The only ingress is an outbound-established, credentialed tunnel to Cloudflare. There is no firewall rule to get wrong, no cert to renew, no port to forget open. Compromise requires compromising Cloudflare, Tailscale, SSH keys, or Elysium itself.
- **Room privacy model on the open door:** the door stays open (`--server-pass` unset) — that IS the product. Privacy is per-room passwords + the `anon` flag, both shipped. `--create-policy anyone` keeps room creation frictionless; the 4/hour-per-real-IP create throttle (restored by `--trust-proxy`) is the abuse brake. Admin-pass is Johan's moderation key.
- **CF cache split:** `/images/*` = static card scans, cache aggressively (e.g. Edge TTL 1 month) — the VPS then serves each image roughly once ever. `/` = the 1 MB client, short TTL (e.g. 5 min) or Bypass + rely on the server's own headers; **purge on every deploy** either way (runbook step). WS upgrade paths are passed through automatically.
- **The minify footgun (this WILL break the client if missed):** Cloudflare's Auto Minify / Rocket Loader / Email Obfuscation rewrite inline HTML/JS. Elysium is one giant inline-script file. All three must be OFF (Rocket Loader is off by default; verify all three). Recorded in learnings.
- **Self-host `images/` + `vtes.json` on the VPS (D5, recommended yes):** ~0.5–1 GB disk, served through the existing whitelisted route, edge-cached — guests get instant art on a stable origin and static.krcg.org is spared the load. Refresh manually/quarterly (documented one-liner in the runbook). If declined, the client's krcg-tier fallback continues to work unchanged.
- **Bots as a consequence, not a scope item:** Trainbots are ws-only and can run ON the VPS against loopback — public bot-filled tables become a `systemd` unit away once the bot track wants it. Noted for the horizon; nothing in this plan depends on it.

## 6. Decisions — LOCKED 17 July 2026 ("kör på allt som rekommenderas" + D2 chosen)

| # | Decision | DECIDED |
|---|---|---|
| D1 | Provider | **Hetzner CX22, Helsinki** (~€3.95/mo ≈ 45 kr). Oracle Cloud Free Tier (0 kr) considered and passed on per its honest caveats (capacity waits, documented account-reclamation stories on idle free accounts). PaaS/home rejected per §4. |
| D2 | Domain name | **REGISTERED ✔ 24 July 2026 (Del A).** **elysium.cards** — keeps the project name (in-lore, Elysium is the sanctioned neutral ground where violence is forbidden: the right name for a shared table — the game even has Master cards *Elysium: The Arboretum* / *The Palace of Versailles*), the TLD says "card game," and it carries no WoD/Paradox mark (cleanest Dark Pack posture). Verified 17 July 2026: `.cards` IS on Cloudflare Registrar's TLD list (Identity Digital); **elysium.games is TAKEN** (a live game-store site in Lakewood, US); **.se is NOT on CF Registrar** (a Swedish registrar + CF nameservers would work but is unnecessary — the audience is international, EN UI/docs). Availability is finally confirmed only at registration (at-cost price shows at checkout); **fallback ladder if taken: elysium.zone → elysium-vtes.com** (both plausible-available; the latter matches the repo's own file naming). `staging.elysium.cards` reserved for a test instance (Appendix B). |
| D3 | Public policy | **Door OPEN, `--create-policy anyone`, admin-pass set, room passwords as the privacy layer.** |
| D4 | Named-saves policy for a public instance | **Per-room cap 3 + 90-day-untouched TTL** (H1-e), replacing the 50-global-forever model. |
| D5 | Self-host images + vtes.json | **Yes** (rationale in §5). |
| D6 | SSH access | **Tailscale-only** (Johan already uses Tailscale per START-HERE) → ufw denies everything on the public interface, literally zero open ports. |
| D7 | Backup ambition | **Nightly `tar` of `/opt/elysium/data` + the two server files, 7-day local rotation** (Appendix C). No off-site — the data is low-value (rooms expire, saves are convenience). |

## 7. The plan

### H0 — Decisions ✅ (17 July 2026)
All seven locked — see §6. Recommended immediately regardless of H1/H2 timing: register **elysium.cards** now; it's cheap insurance and the name is now spoken in the open.

### H1 — Server/client hardening punch list — ✅ SHIPPED 17 July 2026 as srv-2.6.18

Each item: small, independent, seven-file-chain-exempt where no protocol change occurs (none is expected; protocol-lint must still run green), gated by the client/server gate sequences as usual. New caps get dispatch-suite assertions.

- **H1-a** `--bind <host>` (default current behaviour; deployment sets `127.0.0.1`) — loopback bind as defence-in-depth.
- **H1-b** Global connection ceiling (`MAX_CONN_TOTAL`, e.g. 300; loopback-exempt question answered: keyed globally, no exemption — the whole point) + dispatch test.
- **H1-c** Per-room spectator cap (e.g. 10) + dispatch test. (Verify none exists first — none was found in this audit.)
- **H1-d** Async persistence: `writeFileSync` → `fs.promises.writeFile` with an in-flight/coalesce guard; SIGTERM path stays synchronous (process is exiting — sync is correct there).
- **H1-e** Saves policy per D4 (per-room cap + TTL sweep in the existing 5-min room-expiry interval).
- **H1-f** `/healthz` route: `200 {"ok":true,"rooms":N,"conns":M,"v":VERSION}` — feeds uptime monitoring; counts only, no names.
- **H1-g** Explicit `srv.requestTimeout`/`headersTimeout` (one line each).
- **H1-h** Client `innerHTML` sink review pass against the §4 sanitizer inventory — an audit with a written result in learnings, expected outcome "no changes needed," but done at public-instance stakes.
- **Gates:** server syntax, dispatch suite (extended), protocol-lint 6/0 (no doc change expected — no verbs touched), canary 37/0, client gates only if H1-h changes anything, check-versions. Version bumps: server patch bump (behavioural), client only if H1-h touches it.

**Shipped results (17 July 2026, srv-2.6.18):** all eight items landed in one session, zero wire changes (two new `err` texts only). Deviations from the sketch, recorded: MAX_CONN_TOTAL is **400**, not the example 300 — full legitimate load (50 rooms × 6 players) is exactly 300, so the guard sits above it; the saves group key is the **passHash group** (the scoping rule `saveList` already used), with the noted consequence that all password-LESS rooms share one 3-save quota (pre-existing semantics, now tighter — room passwords are the recommendation anyway); `loadMatch` also refreshes `touchedAt` so an actively replayed campaign never expires, and legacy saves are backfilled from `savedAt` at boot. H1-h verdict: **zero fixes** — the escape discipline is complete and layered (full write-up in `elysium-learnings.md`). Gate results: dispatch **19/0 → 23/0** (new §17), protocol-lint 6/0, canary 37/0, client-logic 29/0, bot **285/0 ×3** (two documented 5b-flake aborts between greens — the known environment class). Client untouched. **Same-evening uncertainty round → srv-2.6.19** (Johan's standing question, 4th real catch): the pre-existing cross-group save-overwrite clobber fixed (saveMatch now enforces the passHash check delSave always had — public-instance griefing severity), fail-loud `srv.on('error')` (the zombie-listener class a typo'd `--bind` could newly trigger), and the HTTP timeout trio re-ordered for reusing proxies (keepAlive 65s < headers 66s < request 120s). Dispatch **24/0**, bot 285/0 ×2 on 2.6.19. **Server restart required on adoption — 2.6.19 is the H2 deploy version; the local/LAN default behaviour is unchanged.**

### H2 — Infrastructure provisioning (one focused evening, checklist-driven; Claude pairs via chat)

**Step 0 — account hardening, before anything else:** enable **app-based 2FA on Cloudflare, Hetzner, and Tailscale**; print/store the recovery codes offline; at registration turn **domain auto-renew ON**; and confirm the billing e-mail is one Johan actually reads. Rationale in the §3 meta-account row — the machine is unaddressable, so these three panels ARE the attack surface now.

1. Register **elysium.cards** (D2; fallback ladder in §6 if taken at checkout) at Cloudflare Registrar; zone lands in the same account.
2. Provision VPS (D1), Ubuntu LTS minimal (the plan said 24.04; the live box came up as **26.04 LTS** — accepted deviation, newer LTS with longer support). First login: create user `elysium-admin`, disable root SSH + password auth, install Tailscale, verify Tailscale SSH works, **then** `ufw default deny incoming && ufw enable` (order matters — don't lock yourself out; Tailscale traffic rides its own interface; and even if BOTH SSH paths ever fail, **Hetzner's web console in the panel is the emergency door — you are never fully locked out**).
3. `unattended-upgrades` on. Node LTS — **live box: Ubuntu 26.04's own repo shipped Node v22.22.1**, so NodeSource proved unnecessary (and distro Node gets auto-patched by unattended-upgrades — strictly better); keep NodeSource only as the fallback if a future distro lags. No npm install — nothing to install.
4. Layout: `/opt/elysium/{elysium-server.js, elysium-vtes-bord.html, images/, data/}`; service user `elysium` owns `data/` only.
5. `elysium.service` (Appendix A): hardened unit — dedicated user, `ProtectSystem=strict`, `ReadWritePaths=/opt/elysium/data`, `NoNewPrivileges`, `PrivateTmp`, `MemoryMax=512M`, `Restart=on-failure`, working dir `data/` (so the JSON files land there), flags per D3 + `--bind 127.0.0.1`.
6. `cloudflared` via Cloudflare's apt repo, then a **dashboard-managed named tunnel** (chosen live 24 July over the CLI-file variant — token-based `cloudflared service install <token>`, ingress configured in the Zero Trust UI: hostname elysium.cards → HTTP 127.0.0.1:8123; same named-tunnel architecture, fewer moving parts for this operator) — and add the apt repo to unattended-upgrades' allowed origins so the tunnel daemon patches itself alongside the OS.
7. Cloudflare dashboard checklist (Appendix B): WebSockets ON (default), Auto Minify OFF / Rocket Loader OFF / Email Obfuscation OFF, cache rules per §5, SSL mode is dictated by the tunnel (no origin cert needed — that's the point), Bot Fight Mode OFF initially (can challenge legitimate clients; revisit only if abused).
8. Populate `images/` + `vtes.json` (D5): one-time rsync/curl loop from static.krcg.org (runbook one-liner), or copy Johan's existing local archive folder.

### H3 — Deploy + smoke (same evening)

`scp` the two files, `systemctl start`, then the live checklist: page loads on the domain over https; lobby lists; create a passworded room from browser A, join from browser B (different network — phone on mobile data — so `--trust-proxy` per-real-IP behaviour is actually exercised); idle a started game > 2 min (ping keepalive through CF proven); kill a client and reconnect within grace; wrong room password ×5 from the phone → lockout message (throttle proven per-real-IP); admin `hello` login works; `/images/` responds with CF cache HIT on second load; `/healthz` responds; `systemctl restart elysium` mid-game → clients auto-reconnect and the room restores from snapshot (the whole persistence story proven end-to-end); SIGTERM flush verified in the journal (`journalctl -u elysium`).

Then **launch in two stages**: the smoke list above first, then one full REAL game night with the trusted friend group on the new address — only after that evening spread the link wider. The moment a permanent address exists, downtime reads as "an outage" in people's eyes; the staged start plus the About best-effort line (H4) sets expectations before the audience grows.

### H4 — Documentation round (½ session)

- Host Guide "Bring your own server": replace the sketch with this plan's H2 condensed as the worked example (option B documented as the Caddy alternative for self-hosters).
- START-HERE/STARTA-HAR: the hosted URL becomes the "just play" path; hosting instructions demoted to "advanced / your own table."
- About dialog: hosted-instance line — data lifetime, **"hobby project, best effort"**, and a contact route. **The exact text now exists: `elysium-security-manifest.md` §8 is the ready-to-integrate About insert** (~200 words, EN), backed by the full manifest. Backlog §4 item closed → pointer here. Living docs per ritual.
- **Open Graph meta tags** in the client (`og:title` / `og:description` / `og:image`) so a shared elysium.cards link unfurls invitingly on Discord instead of a blank box — a public instance makes link-sharing the de-facto front page.
- **Room-password placeholder nudge** — e.g. *"make up a fun phrase — not a real password"*: strangers may read the field as a REAL password field and reuse actual credentials, which the room's shared-secret model then spreads in plaintext among the group.
- **✅ The three client items above SHIPPED 26 July as cli-2.6.42** (B1 roundtrip byte-identical, all gates green; og:image booked with D5; contact-route = support page for now, dedicated email/Discord is Johan's open one-line swap). BMC link verified Dark Pack-compliant (donations for time/materials explicitly allowed) and reframed as server-cost support. **H4 remaining: Host Guide worked example + START-HERE hosted-URL path.** Original note: the three items above touch the client → H4 becomes a small gated client session (client-logic 29/0, dispatch, lint, canary, **B1 byte-identical roundtrip**, check-versions; client patch bump), not a pure docs pass.

### H5 — Operations (steady state, ~0 h/week by design)

- **Deploy runbook:** now a standalone doc — **`elysium-ops-runbook.md`** (created 24 July on Johan's request: access, server/client update recipes with receipts, health checks, the panic ladder, self-maintaining vs. quarterly, key locations, and an honesty box of not-yet-installed items). Update the runbook whenever ops reality changes; it joins the living-docs ritual for hosting sessions.
- **Backups:** D7 cron (Appendix C). **Once, in week one: a restore DRILL** — unpack yesterday's tar into an empty dir, point a server at it, watch the rooms come back. Ten minutes, once; it turns the backup from a hope into insurance.
- **Bus factor:** one trusted friend holds the admin password + a one-line runbook ("mute/kick via admin hello; is it alive → /healthz; panic → tell Johan"). Write down where the keys live (SSH key, recovery codes, admin.env). Hetzner's web console remains the ultimate emergency door.
- **Monitoring:** UptimeRobot (free) on `https://<domain>/healthz`; `Restart=on-failure` self-heals; optional `OnFailure=` → ntfy push.
- **Cadence:** quarterly — glance at `journalctl` `[abuse]` lines, refresh images, confirm unattended-upgrades ran, check Node LTS status.
- **Incident basics:** griefing → host tools / admin mute/kick; persistent abuser → Cloudflare IP Access Rule (the ban hammer lives at the edge, not in Elysium); compromise suspicion → `systemctl stop`, rotate admin-pass + tunnel credential, redeploy from the canonical files (nothing else lives on the box).

## 8. Cost & effort

| Item | Cost |
|---|---|
| Hetzner CX22-class (current gen) | **Observed real price 24 July 2026: €6.86/mo incl. 25% Swedish VAT (≈ 78 kr; ~€5.49 ex-VAT — 2026 CX-line pricing).** The plan's original ~€3.95 was 2024-era ex-VAT; estimate retired. Oracle Free (0 kr) remains the theoretical alternative per D1. |
| Domain (CF Registrar) | ~$10–12/yr |
| Cloudflare, Tailscale, UptimeRobot | 0 kr (free tiers, comfortably within limits) |
| **Total** | **≈ 85–95 kr/mo incl. moms** (VPS ~78 kr + domain amortized ~10 kr) — the 2024-era "50–60 kr" estimate is retired |

Effort: H1 ≈ 1 session · H2+H3 ≈ one focused evening (checklist + pairing) · H4 ≈ ½ session · H5 ≈ ~1 h setup, then minutes/quarter.

## 9. Explicitly out of scope

Accounts/identity, matchmaking, multi-region, horizontal scaling (one process comfortably serves 50 rooms of a card game), a rules engine (the server stays dumb — project law), federation, and containerization (Docker adds an image-supply-chain and build step for zero benefit over `scp` + systemd here).

## 10. Sandbox honesty — what is and isn't verified

Verified in this session: every §2 claim against source. **Not verifiable from the sandbox:** anything involving the actual VPS, Cloudflare, DNS, Tailscale, or live WS behaviour through the edge — H2/H3's checklists exist precisely because those must be proven live, by Johan, step by step. The H3 smoke list is the acceptance gate.

---

## Appendix A — `elysium.service` (hardened unit, ready to adapt)

```ini
[Unit]
Description=Elysium VTES server
After=network-online.target
Wants=network-online.target

[Service]
User=elysium
Group=elysium
WorkingDirectory=/opt/elysium/data
ExecStart=/usr/bin/node /opt/elysium/elysium-server.js --bind 127.0.0.1 --data-dir /opt/elysium/data --origin https://elysium.cards,null --trust-proxy --create-policy anyone --admin-pass ${ADMIN_PASS}
EnvironmentFile=/opt/elysium/admin.env
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/elysium/data
PrivateTmp=true
MemoryMax=512M
KillSignal=SIGTERM
TimeoutStopSec=15

[Install]
WantedBy=multi-user.target
```

Notes: `--bind` shipped in srv-2.6.18 (H1-a); **`--data-dir` shipped in srv-2.6.20 (24 July, caught live during H2)** — STORE/SAVES resolve beside the SERVER FILE by default, so without the flag the hardened unit would have made persistence silently fail (EACCES eaten by the best-effort catch); the earlier claim here that `WorkingDirectory=` placed the JSON files was WRONG and is retired. `admin.env` contains `ADMIN_PASS=…`, mode 600, owner root — the one secret on the box besides the tunnel credential. Port and client path use the server's defaults (8123, client beside the server file). `images/` lives beside the client file per `IMAGES_DIR` resolution — read-only to the service user, exactly as `ProtectSystem=strict` wants it.

## Appendix B — Cloudflare dashboard checklist

1. Zone: **elysium.cards** (D2). DNS record is created by `cloudflared tunnel route dns` — verify it's proxied (orange).
2. Network → WebSockets: ON (default).
3. The rewrite footguns, 2026 locations (UI reshuffles bitten live, see journal 24 July): **Rocket Loader** → Speed → Optimization, verify OFF (was off by default). **Email Address Obfuscation** → **Security → Settings** in the current layout (Scrape Shield in older ones) — reportedly ON by default, switch OFF. Auto Minify: removed by Cloudflare itself (non-issue). **Verification beats archaeology:** `curl -s https://elysium.cards/ | cmp - /opt/elysium/elysium-vtes-bord.html` from the box must print nothing (add `&& echo IDENTISK`) — byte-identical edge delivery proves the whole class inactive. *(The inline-script client integrity footgun — see learnings.)*
4. **SSL/TLS → Edge Certificates → "Always Use HTTPS": ON** — *(checklist gap caught live 24 July by Johan's first-browser-load screenshot showing "Not secure": a bare-typed domain loads over http, which means cleartext room passwords, ws:// instead of wss://, AND a split browser origin — http:// and https:// are different origins, so guests who start on the http variant build their deck library there and "lose everything" when they later arrive via https. The 301 at the edge touches no bytes — policy-compatible; leave the neighboring "Automatic HTTPS Rewrites" OFF, it is rewrite-class.)* The canonical address is https://elysium.cards from day one, BEFORE the first guest.
5. Caching → Cache Rules — **promoted from polish to pre-wide-launch (final-sanity finding 24 July): the origin serves `/` with `Cache-Control: no-store`, so today EVERY page load pulls the full 1 MB from the origin through the tunnel — a cheap L7 drip could saturate egress.** Rule for `/images/*`: Cache Everything, Edge TTL 1 month. Rule for `/`: Edge TTL 5 min **with origin-override (the rule must ignore the origin's no-store for EDGE caching; leave browser TTL respecting origin)** + purge on every client deploy. Cloudflare's one free rate-limiting rule stays in reserve if analytics ever show L7 abuse despite the cache.
6. Security: level default; Bot Fight Mode OFF initially; IP Access Rules = the moderation ban hammer.
7. (Later, optional) Cloudflare Access in front of a staging hostname if a test instance is ever wanted; HSTS only much later, once https-everything has been stable for weeks (misconfigured HSTS can lock the domain out — not worth it yet).

## Appendix E — Platform hardening round (booked 24 July 2026, security review)

Free controls the three platforms offer that the base plan didn't use, prioritized:

1. **Hetzner Cloud Firewall, deny-all inbound** — Console → Firewalls → create (remove every suggested inbound rule; outbound unrestricted) → apply to the server. A stateful perimeter BEFORE packets reach the box: even if on-box ufw were ever disabled by mistake, the perimeter holds. Tailscale may fall back to relayed (DERP) connections — SSH still works; if noticeably slow, allow inbound UDP 41641 later.
2. **Hetzner delete/rebuild protection** — server → enable Protection. Stops fat-finger (or hijacked-account-in-a-hurry) destruction.
3. **Tailscale: disable key expiry on the server node** — console → Machines → ⋮ → Disable key expiry. Without it the node key expires (~180 days) and the ONLY SSH path silently dies — a calendar bomb for a solo operator.
4. **Cloudflare DNSSEC ON** — zone → DNS → Settings → Enable (registrar is Cloudflare, so it's one click, fully automatic). Signs DNS answers against spoofing.

Considered and deliberately NOT enabled now: **Tailnet Lock** (protects against a hijacked Tailscale account adding rogue devices, but signing-key management is a real lockout risk for a solo operator — revisit if a second admin device joins); **CF rate-limiting rule** (app-level throttles + free DDoS cover the realistic cases; one free rule is available if L7 floods ever show up in analytics); **auto-reboot for kernel updates** (`Unattended-Upgrade::Automatic-Reboot` at 05:30 — graceful flush makes it survivable, but manual quarterly reboots suffice at this scale); **HSTS** (already booked: only after weeks of stable https); **Hetzner paid backups/snapshots** (D7 chose local rotation; a manual snapshot before major changes is cheap insurance when wanted).

## Appendix C — backup cron (D7 baseline)

```bash
# /etc/cron.daily/elysium-backup  (chmod +x)
#!/bin/sh
d=/opt/elysium/backups
mkdir -p "$d"
tar czf "$d/elysium-$(date +%F).tar.gz" -C /opt/elysium data elysium-server.js elysium-vtes-bord.html
ls -t "$d"/elysium-*.tar.gz | tail -n +8 | xargs -r rm --
```

## Appendix D — images refresh one-liner (D5, quarterly)

```bash
# from the names the client already knows; simplest: copy Johan's local archive, or:
cd /opt/elysium/images && curl -sO https://static.krcg.org/vtes.json  # + rsync of the card set as documented in the Host Guide round (H4)
```

*Bottom line for the executor: run H1 as one ordinary gated server session; then H2/H3 are a checklist evening with Johan at the keyboard and this document open. The architecture's whole point is that after H3, the operational security posture is "there is nothing listening" — the strongest posture available to a hobby operator, and the cheapest to maintain.*
