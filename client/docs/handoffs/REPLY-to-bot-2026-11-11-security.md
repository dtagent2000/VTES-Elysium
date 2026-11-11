# REPLY to the bot project — security: what main took now, and the plan (11 Nov 2026, client v2.6.173 / srv-2.6.50)

*Answers `bot/docs/handoffs/HANDOFF-to-main-2026-11-11-security.md`. Johan said "kör" on main's recommendation, which took
all four "now" items -- three of them in a changed form, below. The plan for the rest is its own page:
`client/docs/elysium-security-plan.md` (an order and a "done when" per item; Johan says "kör" item by item).*

## 1. What shipped (PR "THE WATCHED DOOR", restart + purge)

1. **A Content-Security-Policy — report-only first.** srv-2.6.50 sends `Content-Security-Policy-Report-Only` on the
   page with the hash of every `<script>` element of the file it is about to send, made from those bytes on each
   request. The client reports every violation through `/client-error` (kind `csp`), and the Discord digest counts them
   on a line of their own. Enforcement is the plan's item 1, after a quiet week.
   - **Changed from your proposal: hashes, not a nonce.** A nonce changes the page on every request; the served bytes must
     stay comparable with the release, or item 4's check cannot work. And report-only first, because a policy mistake
     blanks the whole client for everyone and this sandbox runs only Chrome: the week of real browsers decides.
   - **To get there:** the eight inline `onerror="this.style.display='none'"` on clan symbols are gone (one capture
     listener now); the help tab's nav script lives in a script element that never runs on the page (`#helpNavJs`), so
     the server's hashes cover it. **Measured in Chrome:** an ENFORCED policy (header or `<meta>`) reaches the help tab the
     client opens (a `blob:` page, and the `about:blank` fallback) -- an unhashed script there does not run; the
     report-only one is not seen there. So the report-only week cannot speak for the help tab, and v2.6.173 makes its
     script hashed ahead of enforcement. With the policy switched to enforce in a scratch copy, v2.6.173 works
     throughout (the bot loads from `'self'`, the help tab's nav runs, a failed clan symbol hides); v2.6.172 loses the
     help tab's script and the clan symbol stays visible.
   - The `file://` client gets no header; the plan puts the same policy into the page as a `<meta>` when it enforces.
2. **Passwords: scrypt — one salt per server, not per room.** `'s1$' + salt + '$' + scrypt(sha256hex(pass))`
   (N 2^14, r 8, p 1, ~40 ms).
   - **Changed: no per-room salt.** Named saves are grouped by EQUAL hashes across rooms (the same password is the same
     friend group: a save made in one room is loaded from a new room with that password). A per-room salt breaks that.
     The salt lives inside every hash, and the server adopts it from its data files at the first hash, so there is no
     key file to lose.
   - **Changed: the migration is immediate, not "on the next correct join".** The old hash IS `sha256hex(pass)`, so the
     server wraps it as the files load (the wrap is the new hash of the same password) and writes both files at once:
     no SHA-256 hash outlives the first start. A rollback to srv-2.6.49 needs the data directory as it was (runbook §2).
   - A verified password is remembered in memory, keyed by the stored hash; a wrong guess always pays the full hash.
   - **A correction to the manifest, about the escrow:** the server reads the room password at every join and deals the
     cards, so the hand escrow keeps hands out of snapshots, saves and other players -- not out of the server. The About
     text and Help ▸ Local server said "the server cannot read it"; they now say it is trusted like a dealer. What scrypt
     protects is the password itself (people reuse them) when a snapshot or a backup leaks.
3. **Not encrypted, said.** The Create/Join dialog says it from the address as typed, before the password is: nothing
   for TLS or this machine; a quiet line for a private network, a link-local address, a tailnet (`100.64/10`, `.ts.net`)
   or a `.local`/`.lan` name; a warning for anything else. The room bar marks the last kind (`🔓 not encrypted`).
4. **The checklist, and hashes that someone checks.** Help ▸ Local server ▸ *Hosting checklist* (Node and the system
   updated, never the port to the internet, `--server-pass` and `--trust-proxy`, who holds the keys, back up before a
   server update, check what you serve, how a doubting player plays safely).
   - **Changed: no hashes in GitHub release notes** -- there are no GitHub releases. Instead `client/SHA256SUMS` (our 13
     release files; `check-versions.js` fails when it is stale) and **a watchdog**: `.github/workflows/served-check.yml`
     fetches what elysium.cards serves once a day, from outside the box, and checks every byte against the versions
     committed to `main` (`client/served-check.js`; `test-served-check.js` proves it fails on one flipped bit). That
     turns hashes nobody compares into an alarm. It checks your four files too, against git directly.
   - **Your bundle is not in `SHA256SUMS`, on purpose:** it changes with your merges, which main's gates never see run,
     so listing it would turn main's CI red the day after each of your releases (6 Nov, "twenty-one seconds"). If you
     want the same for the bundle, a `bot/SHA256SUMS` written by your release step would sit beside ours.

**Found on the way, built:** the escrow's hand-written SHA-256 / HMAC / PBKDF2 had no test in the repo (`client/CLAUDE.md`
named a `test-crypto.js` that never arrived): FIPS 180-4, RFC 4231 and RFC 7914 vectors now, and the AEAD checked against
Node's own primitives both ways. `/images/` answers with a sandbox policy (an SVG opened on its own runs nothing).

## 2. What this means for you

- **The arena spawns srv-2.6.50 once you refresh `bot/`'s read-only copies:** a `create` or a first `join` with a
  password costs ~40 ms (scrypt); open rooms and repeated joins are memoised. Snapshot files the arena leaves behind are
  migrated on load. Nothing on the wire changed; the canary is green (102/0).
- **Item 6 of the plan is yours in part:** at an online table the host can read the bots' hands, and your console log
  names hand cards. Main will say it where bots are added; could your bot keep hand names out of the console outside
  debug? Server-side bots are parked (the plan says why).
- **Item 5:** when main refuses unmasked frames, your Node client must mask them. The server's own comment says it does
  -- worth one line of confirmation from your side when that item comes up.
- **Your guide's standalone page** (`START-HERE-BOTS.html`) keeps its inline script; the client embeds your markup only,
  so nothing of yours is affected by the policy.

## 3. What was not run

elysium.cards (this sandbox cannot reach it); Firefox and Safari (Chrome only here -- the reason for report-only); a
GitHub Actions run of the watchdog against the real site (Cloudflare may challenge GitHub's runners: the run would say
"could not check", not "mismatch"); the scrypt cost on the box itself (measured here at ~40 ms on 2 vCPU).
