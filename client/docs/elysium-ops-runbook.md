# Elysium Ops Runbook — the minimal-maintenance edition

*For Johan, by Claude, 24 July 2026. This is the "for dummies" companion to `elysium-hosting-plan.md`: everything needed to access, update, and un-stick the live server at **https://elysium.cards** — and nothing else. Update this file whenever the ops reality changes.*

---

## 0. The 30-second mental model

Your computer is a **window**; the server is a rented machine in **Helsinki** that runs Elysium day and night whether your computer is on or not. When the terminal prompt is your local one (`PS C:\Users\johan>`), commands run at home. When it's green (`elysium-admin@ubuntu-4gb-hel1-2:~$`), commands run in Helsinki. That one distinction explains 90 % of everything below.

The machine has **zero ports open to the internet**. Players reach it only through the Cloudflare tunnel (the website), and you reach it only through Tailscale (SSH). Both of those are outbound connections *from* the server — nothing on the internet can knock on its door directly. `ssh` to the public IP timing out is therefore **correct behavior**, not a problem.

## 1. Getting into the server

**Prerequisites (one-time, already done):** the Tailscale app is installed and logged in on your computer, with the same account as the server.

Open PowerShell and run:

```
ssh elysium-admin@ubuntu-4gb-hel1-2
```

Green prompt = you're in. Commands that start with `sudo` will ask for a password: that is **your elysium-admin account password** (the one you chose in `adduser`), and it's remembered for ~15 minutes per session. To leave: `exit` (or just close the window — the server doesn't care).

**If SSH doesn't work:** check that Tailscale is running on your computer (the tray icon) and that the server shows *Connected* at console.tailscale.com. **The emergency door if all else fails:** Hetzner's panel → your server → the `>_` console icon — a browser-based screen directly into the machine. You can never be fully locked out.

## 2. Updating the SERVER (new `elysium-server.js` from Claude)

Step 1 — download the delivered file from the chat into your local project folder, then in **PowerShell**:

```
cd C:\sökväg\till\din\elysium-mapp
findstr "const VERSION" elysium-server.js
scp elysium-server.js elysium-admin@ubuntu-4gb-hel1-2:/tmp/
```

The `findstr` line is your don't-ship-the-wrong-file check — make sure it says the version you expect (this has bitten us once already).

Step 2 — in the **server window**:

```
sudo mv /tmp/elysium-server.js /opt/elysium/
sudo chown root:root /opt/elysium/elysium-server.js
sudo systemctl restart elysium
curl -s http://127.0.0.1:8123/healthz
```

The `curl` must answer with the **new** version number — that's the receipt. The restart is graceful: rooms and saves are flushed to disk, downtime is ~2 seconds, and connected players auto-reconnect with their tables restored. Mid-game updates are survivable by design. *(srv-2.6.43, 9 Oct 2026: before this version a restored table forgot its board style and referee password, and a table nobody had rejoined within ten minutes of the restart was swept as an empty shell — fixed; a restored table now lives by the ordinary one-hour offline rule.)*

**srv-2.6.50 and later (11 Nov 2026, THE WATCHED DOOR): back up the data directory BEFORE the restart.** At its first start srv-2.6.50 turns every stored password hash (rooms, referee keys, saves) from SHA-256 into a slow, salted scrypt hash and writes both files at once. An older server cannot read the new hashes: going back to srv-2.6.49 needs the copy you take now.

```
sudo cp -a /opt/elysium/data /root/elysium-data-before-2.6.50
sudo systemctl restart elysium
sudo journalctl -u elysium -n 40 --no-pager | grep -E "moved from SHA-256|restored|loaded"
```

The journal line says how many hashes moved (none, if no room or save had one). **Rollback, if ever:** stop the service, put srv-2.6.49 back AND copy the saved directory back over `/opt/elysium/data`, start. The salt lives inside each hash -- there is no extra key file to keep.

## 3. Updating the CLIENT (new `elysium-vtes-bord.html`)

Same shape, no restart needed — the server reads the client file fresh on every page load:

```
scp elysium-vtes-bord.html elysium-admin@ubuntu-4gb-hel1-2:/tmp/
```

```
sudo mv /tmp/elysium-vtes-bord.html /opt/elysium/
sudo chown root:root /opt/elysium/elysium-vtes-bord.html
```

Receipt: reload https://elysium.cards (Ctrl+F5 for a hard reload) and check the version in the client. **Note:** as of today no Cloudflare cache rule covers the page, so the new client serves immediately. *If* the Appendix B cache rules are ever enabled for `/`, add one step: Cloudflare dashboard → Caching → Purge Cache.

Players don't need to do anything — next page load gets the new client. Remember the lockstep rule: client and server should share major.minor (2.6.x ↔ 2.6.x); if they drift, the in-game version warning tells the players by itself.

## 3b. Updating the BOT files (releases of the Elysium Bots project)

The bots are four files beside the server, served to every player's browser by exact name (srv-2.6.28; the two `twd` files since srv-2.6.43). They come from the sister project's release — never edit them here:

```
scp elysium-bot.js elysium-cardfx.json elysium-twd-profile.json elysium-twd-archetypes.json elysium-admin@ubuntu-4gb-hel1-2:/tmp/
```

```
sudo mv /tmp/elysium-bot.js /tmp/elysium-cardfx.json /tmp/elysium-twd-profile.json /tmp/elysium-twd-archetypes.json /opt/elysium/
sudo chown root:root /opt/elysium/elysium-bot.js /opt/elysium/elysium-cardfx.json /opt/elysium/elysium-twd-profile.json /opt/elysium/elysium-twd-archetypes.json
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8123/elysium-twd-profile.json
```

No restart for the files themselves (each request reads them fresh); the `curl` must say `200` (a `404` means the server is older than srv-2.6.43 or the file is missing — the bots then play without deck knowledge). They are cached 300 s at the edge: **purge all four URLs** in Cloudflare (Caching → Purge Cache → Custom: `https://elysium.cards/elysium-bot.js`, `/elysium-cardfx.json`, `/elysium-twd-profile.json`, `/elysium-twd-archetypes.json`) together with the client. A stale bot file beside a new client is the v2.6.63 loader-forensics class.

**Purge only what changed (11 Oct 2026).** `cmp` each new file against the one on the box first: an identical file needs no purge. For bot v0.6.197 that means `/elysium-bot.js` and `/elysium-twd-profile.json` (rebuilt with a fifth share); `elysium-cardfx.json` and `elysium-twd-archetypes.json` are byte-identical to v0.6.193's. **The `.js` twins** (`elysium-cardfx.js`, `elysium-twd-profile.js`, `elysium-twd-archetypes.js`, bot v0.6.195+) are NOT for the box — the server never serves them; they belong in the download bundle (GitHub) beside the client, for a table opened as a local file. For bot v0.6.198 (12 Oct) only `/elysium-bot.js` changed (the three JSONs are byte-identical to v0.6.197's); take all three `.js` twins from that zip's `bundle/` — the first release that carries `elysium-cardfx.js`.

## 4. Is everything alive? (the health checks)

From **anywhere** (even your phone): open https://elysium.cards/healthz — a small JSON with room count, connection count, and server version. That one URL answers "is the whole chain up?"

From the **server window**, when you want detail:

```
systemctl status elysium --no-pager
systemctl status cloudflared --no-pager
sudo journalctl -u elysium -n 30 --no-pager
```

The journal shows the boot banner and any `[abuse]`/`[room]` lines. (Plain `journalctl` without sudo shows "No entries" — that's the permission model, not a silent server.)

## 5. When something is wrong — the panic ladder

1. **`sudo systemctl restart elysium`** — fixes most things; rooms are flushed and restored.
2. **`sudo reboot`** — fixes more things; *everything* (firewall, Tailscale, tunnel, Elysium) starts by itself. Wait ~30 s, then check /healthz.
3. Still down? Check https://www.cloudflarestatus.com and Hetzner's status page — it might not be you. Otherwise: Hetzner console as the way in, and bring the problem to Claude with the last `journalctl` lines.

Never debug on a hunch at midnight — the service auto-restarts on crashes (`Restart=on-failure`), so if it's dead, something real is wrong and the journal knows what.

## 6. What maintains itself vs. what needs you

**Self-maintaining (no action):** Ubuntu security patches and Node (unattended-upgrades, runs daily), Elysium crash-recovery (systemd), TLS certificates (Cloudflare), the tunnel connection (cloudflared reconnects on its own).

**Needs you, ~10 minutes per quarter:**

```
sudo apt update && sudo apt -y upgrade
sudo journalctl -u elysium --since "-90 days" | grep abuse | tail -20
```

(The first also picks up cloudflared/tailscale versions; the second is a glance at whether anyone has been hammering the doors — expect it empty.) A `sudo reboot` after big upgrades doesn't hurt.

**The card database on the box (client v2.6.168, 1 Nov 2026).** When `/opt/elysium/images/vtes.json` exists, every client
reads it before KRCG (the auto tier), so the table sees new cards only when that file is replaced. Since v2.6.168 the
client reads KRCG's **v5 dump**: KRCG stopped adding cards to the old file (`data/vtes.json` ends at Sabbat V5), and the
cards of Secrets of New York and Noites Brasileiras (31 Oct 2026) are only in `data/v5/vtes.json`. Check, refresh, purge:

```
ls -la /opt/elysium/images/vtes.json      # no file: the clients read KRCG directly -- nothing to do
cd /opt/elysium/images && sudo curl -fsS -o vtes.json.new https://static.krcg.org/data/v5/vtes.json \
  && sudo mv vtes.json.new vtes.json && sudo chown root:root vtes.json
```

Then purge the one URL in Cloudflare (Caching -> Configuration -> Purge Cache -> Custom purge -> URL
`https://elysium.cards/images/vtes.json`): the server sends it with a one-day cache. The set and starter names
(`expansions.json`) are not served from the box (the server's `/images/` route takes `vtes.json` only); clients fetch
them from KRCG (16 KB) and carry a built-in copy. A client caches the database for a week; one that cached the old
file refreshes once on its own. Do this after a client release that says so, and with the quarterly round.

**Only ever via Claude:** changes to Elysium itself. The deploy is always §2/§3 above — no npm, no build step, ever. That's the zero-dependency dividend.

## 7. Where the keys live (fill in and keep OFFLINE too)

- **elysium-admin password** (sudo): _______
- **admin-pass** (in-game moderation; in `/opt/elysium/admin.env` on the box): _______
- **SSH key**: `C:\Users\johan\.ssh\id_ed25519` (the `.pub` twin is public; the other never leaves your computer)
- **Accounts** (all with app-based 2FA + recovery codes printed): Cloudflare (domain + tunnel), Hetzner (the machine), Tailscale/Google (the SSH path)
- The trusted second admin (H5) gets: the admin-pass + this file's §1/§4/§5.
- **GitHub** (the repository is where every file the box serves comes from): 2FA with a passkey or an app, recovery codes offline. If deploys are ever automated from GitHub (the `live` branch idea, 14 Oct), GitHub becomes part of the path to the box: protect `main` and `live` first.
- **SERVED_CHECK_WEBHOOK** (GitHub → the repository → Settings → Secrets and variables → Actions): a Discord webhook URL for the watchdog's red runs (§10). Optional; without it a red run is only GitHub's own notice.

## 8. Not yet installed (honesty box — next session's list)

- **Backups**: the nightly cron (plan Appendix C) is NOT set up yet — until then, a lost box means lost saves (rooms are ephemeral anyway).
- **Card images on the box** (plan D5): `/opt/elysium/images/` is empty; clients currently fetch art from krcg's CDN (works fine, just slower first loads).
  *(1 Nov 2026: `client/CLAUDE.md`'s 27 July entry says D5 was executed on the box, 4159 files. The two disagree; `ls /opt/elysium/images | wc -l`
  settles it, and §6 has the card-database refresh.)*
- **Cache rules** (plan Appendix B §5) and **UptimeRobot** on /healthz.
- **H3 smoke list**: the formal live test round (phone on mobile data, restart mid-game, throttle proof) — do before inviting the wider community.
- **Platform hardening round** (plan Appendix E, 4 clicks, all free): Hetzner Cloud Firewall deny-all + delete protection, Tailscale server-key expiry OFF (the day-180 calendar bomb!), Cloudflare DNSSEC ON — pending Johan's confirmation.

## 9. Error telemetry, log pulls & the maintenance window (srv-2.6.25–26, 5–7 Aug 2026)

- **Error log location:** `<data-dir>/elysium-errors.log` (+ `.1` after rotation). On the VPS
  that is the systemd unit's `--data-dir`.
- **Daily glance:** `tail -5 elysium-errors.log | jq -r '[.ts,.kind,.ver,(.msg//.note)]|@tsv'`
- **Whose crash is it?** `jq -r 'select(.kind=="crash") | .src' elysium-errors.log | sort | uniq -c` — a `/cdn-cgi/` source is Cloudflare's own injected script (beacon / challenge / Rocket Loader) crashing in the player's browser, not us (v2.6.64: minified names like `t.entries.at` are the tell); an empty src is an unhandled promise rejection.
- **B-63 dump reading (v2.6.60/srv-2.6.29 — the support bundle):** a report row may carry the full
  player-visible snapshot. The digest tags such rows `[+snapshot]`; read them here, never in Discord:
  - latest dump-carrying report: `jq -c 'select(.dump)' elysium-errors.log | tail -1`
  - the game at a glance: `jq 'select(.dump) | .dump.game | {turn,phase,activeSeat,mySeat,deckName,libN,cryptN,handN}' elysium-errors.log | tail -8`
  - board size + a card: `jq 'select(.dump) | .dump.game.board | length' elysium-errors.log | tail -1` and `... .dump.game.board[0]`
  - the last 15 log lines around the incident (both ring shapes): `jq -r 'select(.kind=="report") | .ring[-15:][] | .m? // .' elysium-errors.log | tail -15`
  - poisoned saved decks (B-53 visibility): `jq -c 'select(.dump) | .dump.env.decks[]? | select(.warn==1)' elysium-errors.log`
  - connection health: `jq 'select(.dump) | .dump.env.ws' elysium-errors.log | tail -3`
  - the reporter's settings (srv-2.6.30 — rendering bugs live here): `jq 'select(.dump) | .dump.env.settings | {defaultView,anim,touchUI,localImg,localImgAuto,imgCache,hoverPreview}' elysium-errors.log | tail -3` — or the whole bag with `.dump.env.settings`
  - `dumpTrunc:1` = the client's degrade ladder dropped the dump to fit 48 kB (the ring survived); `dumpErr:1` = buildDump threw client-side — the report still arrived. Paste the whole row into a Claude session; the shape is jq-friendly by design (max nesting 3).
- **After a deploy:** the `.ver` histogram (§D) shows who is still running a stale cached client.
- **Rotation is automatic** (1 MB → `.1`, 4 MB total stop). Manual reset if ever needed:
  `rm elysium-errors.log elysium-errors.log.1` — the server recreates on the next post.
- **Restart note:** srv-2.6.25 requires a server restart to expose the route; the client half is
  cache-refresh only. **srv-2.6.43 (9 Oct 2026):** the bot purge is FOUR URLs now (+ `/elysium-twd-profile.json`, `/elysium-twd-archetypes.json` — §3b). **v2.6.71 / srv-2.6.31 (the merge):** restart the server, then purge THREE URLs on Cloudflare — the
  client AND `/elysium-bot.js` AND `/elysium-cardfx.json` (the hosted hotseat-bot loader fetches the two statics from the
  serving host with a 300 s cache; a stale bot file beside a new client is exactly the v2.6.63 loader-forensics class).
  Before purging, verify in the browser: the only-Unlock phase-button report (v2.6.70, root open) on a plain hotseat table.
  The two bot statics and START-HERE-BOTS are RELEASES of the sister project Elysium Bots (9 Sep split) — take the
  versions its elysium-bot-CHANGELOG.md names, never edit them in this project. **B-63 (srv-2.6.29) likewise:** restart for the 64 kB cap + dumpRecord, Cloudflare
  purge for the v2.6.60 client, digest v1.3 is a script swap (no unit change; it carries the 8 Aug v1.1 detail blocks too — recovered from the delivery transcript, since v1.1 was never scp:ed).
- **Maintenance window from anywhere (wave 5):** arm from any browser:
  `https://elysium.cards/admin/maintenance?key=<admin-pass>&on=1&hours=4&msg=Update%20tonight%2021:00`
  — status: same URL with just `?key=`; clear: `&off=1`. Re-open the arm URL to re-broadcast
  the reminder. Auto-expires on its own. Typical update night: arm with hours=4 → play out →
  deploy + restart (window survives) → verify → `&off=1` (or let it expire).
- **Log pull from anywhere (wave 4b):** `https://elysium.cards/client-errors.txt?key=<admin-pass>`
  in any browser (add `&dl=1` to download). Requires `--admin-pass` on the server unit. The key
  rides in the URL through Cloudflare's TLS — acceptable for the admin's own credential;
  rotation = change the flag + restart. Paste the rows straight into a Claude session.
- **Digest install (wave 4):** put `elysium-error-digest.js` next to the server. Secrets:
  `install -d -m 700 /etc/elysium && printf 'DISCORD_WEBHOOK=%s\n' '<url>' > /etc/elysium/digest.env && chmod 600 /etc/elysium/digest.env`.
  Units (adjust the two paths to match the main unit's ExecStart/--data-dir):

  ```ini
  # /etc/systemd/system/elysium-digest.service
  [Unit]
  Description=Elysium error digest (Discord)
  [Service]
  Type=oneshot
  EnvironmentFile=/etc/elysium/digest.env
  ExecStart=/usr/bin/node /opt/elysium/elysium-error-digest.js --data-dir /opt/elysium/data

  # /etc/systemd/system/elysium-digest.timer
  [Unit]
  Description=Daily Elysium error digest
  [Timer]
  OnCalendar=*-*-* 08:00:00
  Persistent=true
  [Install]
  WantedBy=timers.target
  ```

  First run: `node elysium-error-digest.js --data-dir <same> --mark-only` (never replay
  history), rehearse with `--dry-run`, then `systemctl daemon-reload && systemctl enable --now
  elysium-digest.timer`. Optional storm alarm: a second service/timer pair every 15 min with
  `--min 10 --state <data>/elysium-alert-state.json` — its own state file so it never eats the
  daily digest's watermark. Optional weekly heartbeat: a third timer with `--heartbeat`.

## 10. The served-bytes watchdog (client v2.6.173, 11 Nov 2026)

`.github/workflows/served-check.yml` runs once a day at 05:17 UTC on GitHub's machines -- outside the box. It fetches what elysium.cards hands out (the page and the four bot files) and checks each one against every version of that root file committed to `main` (`client/served-check.js`). Green = every byte served is a release. The point is the case nothing on the box would admit to: a server that has been taken over and serves something else.

- **Red, `MISMATCH`:** a file matches no committed version. First question: was something deployed from a branch before its merge (or edited on the box)? If not, treat it as a compromise: take the service down (`sudo systemctl stop elysium`), keep the files for a look, rebuild from GitHub.
- **Red, `COULD NOT CHECK`:** the site did not answer GitHub's runner (down, or Cloudflare challenged the runner). Not a sign of tampering; check `/healthz` from your own browser.
- **Run it now:** GitHub → Actions → *served check* → *Run workflow*; or from a clone, `node client/served-check.js` (exit 0 / 1 / 2 as above).
- **Hear of it:** set the `SERVED_CHECK_WEBHOOK` secret (§7) and a red run posts one line to that Discord channel.
- **Deploy what is merged.** A file copied to the box from a branch before Johan's merge reads as a mismatch until the merge.

**The page's report-only policy (srv-2.6.50).** For a week or more after this deploy the browsers report what the page's Content-Security-Policy *would* block; the client sends each report to `/client-error` as kind `csp`, and the digest (v1.5 -- copy the new `elysium-error-digest.js` next to the server with this deploy) shows them on a line of their own: `· CSP report-only ×N: …`. A quiet line for the week is the signal for the next round (enforcing). A line that is not quiet is the list of what the policy still lacks.

---

*Golden rules, once more: green prompt = Helsinki · verify the version before you ship (`findstr`) · never close a working session before the new path is proven · when in doubt, /healthz first, journal second, Claude third.* 🦇
