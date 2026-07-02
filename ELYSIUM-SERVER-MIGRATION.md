# ELYSIUM-SERVER-MIGRATION.md — porting & operating the server

> **Audience.** A competent engineer who wants to take over the *server* side of Elysium — possibly
> in a language other than JavaScript, and possibly with a stronger security/ops posture than the
> bundled reference. You do **not** need to know HTML/JS to do this. You need to know networking,
> WebSocket, JSON, and your own stack.
>
> **Relationship to the other docs.** `ELYSIUM-PROTOCOL.md` is the **authoritative wire contract** —
> the exact verb/message tables there are generated from the live code and kept honest by a lint, so
> when the two disagree, the protocol doc wins and this guide is wrong. This file is the *operational
> companion*: the mental model, the load-bearing details that aren't obvious from a verb list, the
> crypto nuances, the caps, the deployment topology, and a porting checklist. Read them together.
>
> **Status at time of writing.** Reference server: `elysium-server.js`, **v2.5.38**, ~1330 lines,
> Node, **zero npm dependencies**, hand-rolled WebSocket. Reference client: `elysium-vtes-bord.html`,
> v2.5.38, a single static file.

---

## 0. TL;DR

- **The client is bound to a *protocol*, not to Node or JavaScript.** The only coupling between the
  two sides is WebSocket text frames carrying one JSON object per message, each with a string `t`
  field (the verb). Speak that, honor a handful of invariants, and you can write the server in Rust,
  Go, Python, Elixir, C#, Zig — anything with a WebSocket library.
- **Offline play needs no server at all.** Hotseat (pass-and-play on one screen) is entirely
  client-side. A server only exists to enable *online* multiplayer. If your goal is "run good online
  infrastructure," that is exactly and only what the server is for.
- **The crypto is already client-side, and the server's crypto duty is almost nothing:** hand out a
  random salt, store one opaque blob per seat, hand it back on reconnect. The server never holds a
  key and cannot read a hand. You can improve the security *around* this freely; you can even
  strengthen the cipher (that's a client change); the one thing that *weakens* the design is moving
  hand encryption into the server. See §8 — it's the single real trap in the whole port.
- **A minimum viable server is small.** The "MUST" surface is relay + server-held hidden piles + a
  referee minimum (turn order, dice, VP, oust bounty) + opaque escrow storage. Host controls and
  named saves are "MAY."
- **You can validate a fresh server black-box.** The network conformance suites talk the wire
  protocol over loopback and are therefore language-agnostic — they'll test a Rust server just as
  well as the Node one (caveat in §11 about which suites currently ship).

---

## 1. The mental model

Elysium is a **sandbox**, not a rules engine. It enforces no game rules — the players do, exactly as
at a physical table — but it logs everything, keeps hidden cards genuinely hidden, and shows every
public action to the whole table. Keep that framing: the server is not a game simulator.

Split of responsibility:

| Concern | Who owns it | Why |
|---|---|---|
| UI / UX / rendering / animations / input | **Client** | It's a browser app; this is its whole job. |
| Public board state (positions, face-up names, counters, tokens, targeting) | **Client-authoritative**, server relays | The table is the referee; each client asserts its own board. |
| Hidden piles (library / crypt) | **Server-authoritative** | Only place that can hold secret order without a client seeing it. |
| The few things a table can't self-referee: turn order, dice, VP clamping, oust bounty | **Server** | Needs one trusted arbiter. |
| The hand | **Neither can read it but the owner** | Travels only as a client-encrypted opaque blob (§8). |
| Tournament authority (accounts, brackets, matchmaking, results) | **A layer *around* the protocol** | Deliberately outside the in-game protocol — see §7. |

The reference server is the *implementation* of the server-owned rows. A port re-implements those
rows; it does not need to touch anything the client owns.

---

## 2. The single coupling: the wire protocol

- **Transport.** WebSocket. **Text frames only**, **one JSON object per message**, each with a
  string `t`. No binary frames, no batching, no compression are required by the protocol.
- **The unknown-verb rule is load-bearing in BOTH directions.** A receiver *ignores* any `t` it does
  not recognize. This is the forward-compatibility contract: a newer client against an older server
  (or vice versa) degrades gracefully instead of erroring. **Your server must keep this rule** — do
  not reject or 400 on an unknown verb; drop it silently.
- **Do not re-derive the verb set from this guide.** The complete, current list — **48 client→server
  verbs** and **42 server→client messages**, with their field lists — lives in `ELYSIUM-PROTOCOL.md`
  §7 and §8, generated from the live handler tables and guarded by `test-protocol-doc.js`. Implement
  against *that*. Below I describe verbs by *functional group* (which is stable and conceptual);
  the exact fields are in the protocol doc.

**Functional groups (conceptual map — fields in `ELYSIUM-PROTOCOL.md`):**

- *Session & lobby*: create/join/seat/roll/start/leave, roster & lobby snapshots.
- *Turn, table & voice*: pass→turn, the reaction-window "decide," short "say" emotes, generic
  dice/coin "tool," free-form log & chat relay.
- *Deck & the server-held piles*: upload a deck; draw / draw-crypt / browse / reveal / take / return
  / shuffle / bulk-move; deal on start. These are the hidden-stays-hidden verbs — results go only to
  the owning socket; everyone else sees counts.
- *Board sync & hand escrow*: the periodic public-board push; store/return the opaque hand blob.
- *Cross-board card lifecycle*: give a card to another seat (with a stable id), recall it, confirm a
  recall, adjust a controlled card in place. Pure routing; ids preserved.
- *The Edge*: pass the single contestable token; take it (it's unique, so everyone else is told they
  lost it).
- *Host controls*: kick / promote / demote / mute / set-pool / oust / un-oust / helper policy.
- *Named saves*: save / list / delete / load a match (host-only).

---

## 3. What the reference server actually is (a map for reading `elysium-server.js`)

If you want to read the reference before porting, here's its shape top-to-bottom. It's one file,
so this is your table of contents:

1. **Constants & config** — version, port (`process.argv[2]` overrides 8123), caps (§6).
2. **Randomness** — rejection-sampled unbiased `rnd()` / `shuffle()` (the client uses the same
   algorithm; keep yours unbiased too). `token()` = 12 random bytes hex (96-bit credential/salt).
3. **WebSocket framing** — `wsSendFrame` / `wsAttach`: a hand-rolled parser handling chunked TCP,
   masking, fragmentation, ping/pong (`0x9`/`0xA`), and close (`0x8`). You'll almost certainly use a
   library instead — fine, as long as the behaviour in §4 is preserved.
4. **Abuse protection** — the rate/fail/create counters and the `strikes()`/`strike()` helpers.
5. **Rooms & roster** — the `rooms` map, `roster()`, `bcast()`, lobby snapshots, seat rotation
   (`nextLiveSeat`), seat vacate/takeover.
6. **Sanitizers** — `cleanName`, `cleanCard`, `cleanId`, `sanHtml`, `sanitizePub`, `fxCard`.
7. **Server-side game state** — deck expansion, deal, the hidden piles, `pileCounts`.
8. **`GAME_HANDLERS`** — the seated dispatch table, one function per verb (signature
   `(conn, room, p, m)`). Order-independent; adding a verb is adding a key.
9. **`handle()`** — the entry point: parses JSON, runs the pre-dispatch `create`/`join` (and the
   spectator/lobby special cases), then routes seated messages through `GAME_HANDLERS`. Everything
   runs in one try/catch so a throw becomes an error reply, never a crash.
10. **HTTP server + WS upgrade** — serves the client file (`no-store`) and upgrades to WebSocket.
11. **Keepalive & cleanup** — the 30s ping / 75s reaper / 10-min room-expiry sweeps.
12. **Persistence** — `elysium-rooms.json` (rolling snapshot) and `elysium-saves.json` (named
    saves). Both best-effort; both replaceable by whatever storage you like.

The reference is deliberately dependency-free and single-file because that's the easiest thing for a
hobbyist to run. **You are under no obligation to keep either property.** A port with a proper
framework, a database, structured logging and a process supervisor is a strict improvement for
serious hosting.

---

## 4. The load-bearing details a port MUST match (the non-obvious ones)

These are the things that aren't visible in the verb list but will break the client if you get them
wrong. This section is the one most likely to save you debugging time.

**4.1 URL / TLS behaviour.** The reference serves the client and the WebSocket on **one origin**, but
a port may host the client anywhere (it's a static file) and point the socket elsewhere. Regardless:

- An **https page can only open a `wss://` socket** (browsers block `ws://` from https as mixed
  content). If players reach you over TLS (a tunnel or reverse proxy), the socket is `wss://`.
- The client **never appends `:8123` over https** — a tunnel/proxy answers on **443**, and the local
  8123 is not publicly reachable. Over plain http a portless host gets `:8123` appended.
- This is `cleanAddr()` / `mpConnect()` behaviour on the client, and **any fronting proxy you deploy
  must be consistent with it** (terminate TLS on 443, forward to your WS port, don't expose the raw
  port publicly).

**4.2 Keepalive timing is load-bearing.** A Cloudflare quick tunnel (and many proxies) idles out a
silent WebSocket at ~100 s. The reference therefore:

- **pings every 30 s** (browsers answer at the protocol level — no client code), and
- **reaps a connection after 75 s** of silence (> 2 ping intervals, so one missed ping is forgiven).

Keep a **ping interval ≤ 30 s** and a reaper comfortably above it. If you go silent longer than the
tunnel's idle window, quiet games drop.

**4.3 Reconnect & the session token.** On `joined`/`took` the server issues a `token`. The client
auto-reconnects with **immediate 2.5 s retries** and replays that token via `join`; the server must
then restore the *same* seat, public board, pile counts and escrow blob. **Treat the token as the
seat's bearer credential** — whoever presents it owns that seat. Also honor a **grace window**
(reference: `GRACE_MS = 30000`) during which a just-dropped seat cannot be reassigned/kicked, so a
brief network blip doesn't cost the seat.

**4.4 Version handshake is advisory, never a gate.** The client sends `v` in `create`/`join`; you
reply with `srv`. **Both sides compare major.minor only** and merely print a warning line on
mismatch. Patch drift is by design (client-only fixes ship without a server change). Do **not** hard-
reject on version — just echo `srv` and let the client warn.

**4.5 Framing limits.** The reference caps an incoming message at **256 KB** (`MAX_MSG`) and closes on
oversize frames. Pick a sane cap; the escrow blob (§8) is the largest single payload at ≤ 200 000
bytes, so your message cap must exceed that with headroom.

---

## 5. The five security invariants (a replacement server MUST inherit these)

These mirror `ELYSIUM-PROTOCOL.md` §4, expanded with the reference specifics and the *why*.

1. **Derive the actor's seat server-side; never trust a client-sent seat for identity.** Seats are
   *array positions* — `players.indexOf(sender)+1` — not a stored field a client can set. A client
   *may* send a seat that names a **target** (e.g. "give to seat 3"); that's fine. The **sender's**
   seat is always derived. (Reference gotcha: a player object has no `.seat` field at all; addressing
   `players.find(x=>x.seat===n)` would silently find nothing — index into `players[seat-1]`.)

2. **Sanitize every string before storing or re-broadcasting.** The reference sanitizers are
   `cleanName` (names/rooms; strips control chars and `<>`), `cleanCard` (card names, length-capped),
   `cleanId` (gid/cid → `[A-Za-z0-9_-]`, ≤ 32 chars), plus length caps on every array (deck sizes,
   counters, saves, pub cards). There's also `sanHtml` for the one relay field that legitimately
   carries a tiny tag whitelist (`<b>`, `<i>`, and the log card-link form) — everything else is
   stripped. **The reference client sanitizes again at render; a third-party client MUST too** — but
   your server sanitizing on ingest is the defence-in-depth layer that protects clients that forget.

3. **Rate limits must answer: "what does this key to behind a tunnel?"** Behind a TLS tunnel every
   player arrives as loopback (`127.0.0.1` / `::1` / `::ffff:127.0.0.1`), so a naive per-IP counter
   silently becomes a *global* counter across all tunnel players. The reference resolves this per
   limit: the **connection cap and room-create cap EXEMPT loopback** (a tunnel legitimately
   multiplexes many players through one loopback address); the **password-fail throttle cannot**
   exempt it (that would unthrottle brute force over a tunnel), so it **re-keys**:
   `failKey = loopback ? 'room:'+room.name : conn.ip` — per-room over a tunnel, per-IP otherwise.
   **Any new limit you add needs the same decision made explicitly.**

4. **Hidden stays hidden.** Opponent hands, libraries and crypts NEVER appear in any broadcast. Piles
   live server-side as name arrays; only *counts* (`pileN`) and the *owner's private* results
   (`drew`, `pileList`, `dealt`, `revealed`) leave the server, addressed to that one socket. Public
   boards are additionally re-filtered server-side (`sanitizePub`) as defence-in-depth: a fixed
   zone whitelist, and a face-down card's name is dropped for opponents even if a client "forgets" to.

5. **Host identity is the creating connection**, reclaimable via a `hostToken` (so a restarted host
   can retake the room). Host-only verbs (marked in `ELYSIUM-PROTOCOL.md` §7) **must be gated** on
   presenting the host token — not on a client claiming to be host.

### 5.1 The security posture you're inheriting (the threat model)

Before hardening anything, know what the reference design is *for*, so you tune to the right bar:

- **Primary scope: playing with friends.** The dominant threat is *accidental information leakage* —
  someone glimpsing a hidden card, or a hand persisting in cleartext somewhere. Against that the
  design is deliberately *generous*: hidden piles live server-side, `sanitizePub` re-filters public
  boards defensively (invariant 4 above), and the hand is encrypted so even a curious host can't read it.
- **Secondary scope: playing with strangers — supported, with eyes open.** Here an *active
  adversary* is added, and the reference holds up well (seat derived server-side, all strings
  sanitized, the tunnel-aware throttles, encrypt-then-MAC on the hand). But three trade-offs are
  **deliberate**, and a server author hardening for public/tournament exposure should treat them as
  the first targets:
  1. **The hand cipher is "obfuscation-grade" by its own admission** — good enough to keep a curious
     server and other players out of your hand, but not an audited construction. Stronger crypto is
     the `E2:` client-side path in §8.2/§8.3, *not* a server change.
  2. **Public board state is client-trusted — this is the sandbox by design.** A player can lie about
     *their own* board (claim 30 pool), exactly as at a physical table where someone could fudge
     their own counters. The mitigation is **social, not technical**: the log shows every action to
     the whole table. A server MUST NOT try to "fix" this by simulating rules — that would stop being
     Elysium. (It re-sanitizes the pub for *secrecy* — invariant 4 — but never for *rule correctness*.)
  3. **One known gap: spectator names aren't deduplicated** — a watcher can shadow a seated player's
     name (§14). Minor, but worth closing before inviting genuine strangers.
- **The implication.** A *friends* deployment is well-served as-is (generously so). A *public /
  tournament* deployment inherits a solid base but should: adopt the `E2:` cipher (§8), accept the
  sandbox-trust as a design constraint (mitigate socially, or gate who can join at all via an outer
  layer, §7.1), close the spectator-dedup gap, and — the moment rooms become browsable — add the
  abuse controls that a public surface needs (§7.1, "Exposure posture"). None of these is an open
  door today; they're the calibration points for a higher exposure posture.

---

## 6. The concrete limits (reference values — tune, but know them)

| Constant | Value | Meaning |
|---|---|---|
| `MAX_ROOMS` | 50 | rooms on the server |
| `MAX_PLAYERS` | 6 | seats per room |
| `MAX_CONN_PER_IP` | 16 | concurrent sockets per IP (**loopback exempt** — tunnel) |
| `RATE_N` / `RATE_WIN` | 80 / 10 s | per-connection message rate |
| `FAIL_MAX` / `FAIL_WIN` | 5 / 10 min | wrong-password strikes → lockout (keyed per §5.3) |
| `CREATE_MAX` / `CREATE_WIN` | 4 / 60 min | room creations per IP (**loopback exempt**) |
| `GRACE_MS` | 30 s | a dropped seat can't be rebound/kicked for this long (reconnect window) |
| `MAX_MSG` | 256 KB | max incoming WS message |
| `MAX_PILE` | 250 | cards per hidden pile |
| `MAX_NAME` | 64 | card-name length cap |
| `MAX_PUB_CARDS` | 400 | cards in a relayed public board |
| `MAX_SAVES` | 50 | named match saves on disk |
| hand escrow blob | ≤ 200 000 bytes | the largest single payload |
| ping / reaper | 30 s / 75 s | keepalive (§4.2) |

**Maintainability note (a real one in the current code):** the seat-target validation in
`sanitizePub` hard-codes `6` rather than referencing `MAX_PLAYERS`. If you raise the seat cap in a
port, don't inherit that literal — key every seat bound to the same constant.

---

## 7. The state model in depth

- **Public boards are client-authoritative.** Each client serializes its own board into a filtered
  `pub` (positions, face-up names, counters, tokens, clan, targeting) and pushes it via the board
  verb (debounced ~600 ms on the client). The server stamps seat + who and relays — and re-sanitizes
  (`sanitizePub`) as above. The server never simulates rules.
- **Hidden piles are server-authoritative.** Deck upload → the server shuffles → draw/browse/reveal/
  take act on the server's copy. This is the only state the server *owns* rather than relays.
- **The referee minimum is server-side:** turn order (`pass` → `turn`), dice (`roll`, `tool`), VP
  clamping (0–10 in 0.5 steps), and the oust bounty (+6 pool routed to the predator's client, +1 VP
  set server-side). These are the handful of things a table cannot self-referee.
- **Tournament authority goes AROUND the protocol, not inside it.** A pre-stage (accounts, brackets,
  matchmaking, results) *creates rooms*, *deep-links players in* (§9 of the protocol doc:
  `?server=&room=&name=`), *spectates*, and *collects results* — the in-game protocol stays a sandbox
  on purpose. If you're building the "tournament server" of your dreams, build it as this outer
  layer; you don't have to (and shouldn't) fold match authority into the in-game verbs.

### 7.1 The "lobby" — two different things, and where each belongs

The word *lobby* is overloaded in Elysium, and a server author should hold the two meanings apart:

- **What the reference calls the "lobby" today is a *room-scoped pre-game staging area*** — seat
  picking, deck loading, dice rolls, and the host's Start gate, all *inside one already-created
  room*. It is **fully optional and fully server-controlled**: room creation carries a `lobby`
  flag (`create.lobby` → the server's `started = !lobby`). Skip it (`lobby:false`) and players drop
  straight into a live game; run it and the server drives the client's staging view via `lobby`
  snapshots. The **client only renders** this view — it appears when the server sends lobby snapshots
  and never appears if the server just sends `started`. So a replacement server can (a) run the
  reference staging flow, (b) skip it, or (c) replace it with its own seat-assignment (e.g. a
  tournament bracket seats players and starts the room directly, no manual picking).

- **What most multiplayer games call a "lobby" — a browsable *directory of rooms* players discover,
  create (with passwords), and *request to join* — does NOT exist in the protocol today, by design.**
  Rooms are **unlisted**: you join by knowing the room name + password. That opacity is itself a
  privacy property — a private game between friends is not discoverable or enumerable by anyone.
  There is deliberately no "list all rooms" verb and no join-request/approve flow.

**Where a real room-directory belongs.** It is a *discovery / matchmaking* concern, the same category
as tournament authority above — not in-game state. The design-consistent home for it is therefore an
**outer layer**, and it already has a hook: a directory service (which MAY share the WebSocket
server's process) maintains the list of public rooms, handles browse + create + join-request/approve,
and once a player is admitted, emits the existing **deep-link** (`?server=&room=&name=`) into the
actual game room. The in-game protocol stays a pure sandbox. Two honest paths:

- **Path A — in-protocol.** Add verbs (`listRooms`, and optionally `requestJoin` / `approveJoin`).
  The reference already holds every room in a `rooms` Map, so *listing* is trivial to expose.
  Self-contained, but it **grows the protocol surface** (more verbs to spec, lint and conform) and
  pulls discovery into the sandbox the design has kept clean.
- **Path B — out-of-band (recommended for consistency).** A separate directory layer + the existing
  deep-link. Keeps the in-game protocol untouched, composes with the tournament-authority pattern,
  and lets a server-focused contributor own the whole "hall" independently of the game protocol.

Either way, the **client grows a room-browser *view*** (a UI concern) that talks to whichever path
you pick. Design decisions a directory raises — flag them early so nothing is foreclosed:

- **Listability.** Which rooms are public vs unlisted — a per-room flag, so the current
  private-by-default behaviour is preserved and only opted out of deliberately.
- **Join model.** Keep the password gate, add request/approve, or both. Request/approve is a new
  concept (today it's binary: right password = in) and wants host-side rate-limiting.
- **Identity.** A public browsable hall with join-requests usually wants *some* notion of player
  identity/accounts — again an outer-layer concern, not the in-game protocol's.
- **Exposure posture.** A private-by-obscurity tool becomes a public surface the moment rooms are
  browsable; spam-room creation, the join-request channel and enumeration all need abuse controls
  (the reference's existing create/rate caps are a starting point, not a finished answer).
- **Naming.** When the real hall arrives, rename today's room-scoped "lobby" (to e.g. *staging* /
  *pre-game*) so the word *Lobby* is free for the directory — or name the new one *the Hall* — to
  avoid the collision above.

**The good news:** none of this needs to change anything today. The architecture already accommodates
a room-directory cleanly through the outer-layer pattern and the deep-link, so it stays a clean
*forward* option rather than a refactor debt — appropriate for a post-1.0-client milestone.

---

## 8. The crypto — the heart of the "can I do my own?" question

This is the section that matters most for someone security-minded, so it's the most detailed.

### 8.1 How it works right now

- **The key is derived entirely in the client.** When a player is in a room, the client takes the
  room's **public salt** (`escrowSalt`) plus the **room password** and runs **PBKDF2-HMAC-SHA256,
  20 000 iterations**, producing a 64-byte key split into a 32-byte encryption key and a 32-byte MAC
  key. The server never sees the password and never derives anything.
- **The salt** is issued by the server at room creation — a random 96-bit value (12 random bytes,
  hex) — and is *public* (it's meant to be shared; its only job is to make the derived key unique per
  room and resist precomputation). It is persisted alongside saves so a loaded match derives the same
  key.
- **The AEAD** is encrypt-then-MAC: a SHA-256-based CTR keystream encrypts the hand JSON, then
  HMAC-SHA256 over `(version-byte ‖ nonce ‖ ciphertext)` authenticates it. The wire form is
  `E1:` + base64(`nonce[16] ‖ ciphertext ‖ tag[32]`). Decryption checks the tag in constant time and
  refuses on any mismatch (wrong password, tampering, corruption). A reference copy of this cipher
  lives standalone in `esc-crypto.js`.
- **The server's entire crypto duty** is three lines of behaviour: (1) generate the random salt at
  create and include it in the join reply; (2) store the latest opaque `blob` per seat when a client
  sends the escrow verb (`null` clears it); (3) return that blob on reconnect, on seat-takeover, and
  on match-load. **It never decrypts, never verifies, never inspects the format.** To the server the
  blob is an opaque length-capped string.

That's why `ELYSIUM-PROTOCOL.md` §5 says **"zero crypto required server-side."** It is literally true:
a conforming server can treat the blob as an opaque token and be fully correct.

### 8.2 What "do your own crypto" can mean — and the three cases

The question splits into three, and the answers differ sharply. This table is the single most
important thing to internalize before touching crypto:

| What you want to do | Where the change lives | Client change? | Keeps zero-knowledge? |
|---|---|---|---|
| **Harden *around* the crypto** — your own salt scheme, encrypt-at-rest of the stored blob, TTL/revocation on the blob, mTLS / auth-gateway / extra rate-limiting in front | **Server** (your domain) | No | **Yes** |
| **Strengthen the *cipher itself*** — e.g. AES-GCM via WebCrypto, Argon2id instead of PBKDF2 | **Client** (it's client-side crypto) | Yes (client fork) | **Yes** |
| **Move hand encryption *into* the server** — server holds a key, encrypts/decrypts hands | **Server** + protocol | Yes | **No — this destroys it** |

**Case 1 — harden around it (fully open, no coordination):** Everything the server *does* with crypto
is yours to improve. Generate the salt differently (longer, per-session, from an HSM) as long as you
return the same salt the blob was sealed under so the client's key still derives. Encrypt the stored
blob at rest in your database. Add a TTL and drop stale blobs. Put mTLS or an auth gateway in front.
None of this requires the client to change or even know, because the salt's *role* is preserved and
the blob stays opaque. This is squarely within — and encouraged for — serious hosting.

**Case 2 — strengthen the client cipher (a client fork, cleanly versioned):** If you consider the
current cipher too weak (it's self-described as "obfuscation-grade," honest about not being an audited
construction), you can replace it with a stronger one. But be precise: **that is a change to the
client, not the server.** The server wouldn't notice — it stores whatever bytes it's handed. The
`E1:` prefix exists exactly for this: a new scheme becomes `E2:`, and the client can support both
during a transition (try `E2`, fall back to `E1`). Because the blob is an opaque string in the escrow
verb, a client with a new cipher and a *different-language server* interoperate with **no server-side
coordination** — as long as the salt still flows.

**Case 3 — the one real trap:** If you think "I'll do crypto *properly* by moving it server-side,"
you invert the entire security property. Right now the guarantee is: *the server provably cannot see
your hand, even if it wants to, even if it's compromised.* The moment the server holds a key it
becomes a trusted party that sees every player's secret cards in cleartext. For a tournament with a
trusted organizer that *might* be an acceptable, deliberate trade — but understand that you are
**tearing down the zero-knowledge property, not strengthening it.** Do it only as a conscious switch
to a trusted-arbiter model, never by accident thinking it's an upgrade.

### 8.3 The `E2:` migration path, concretely

If someone wants to ship a stronger cipher, the shape is:

1. Implement the new construction in the client behind an `E2:` prefix (new format, new KDF/cipher).
2. On **decrypt**, branch on the prefix: `E2:` → new path; `E1:` → existing path. Keep `E1:` decrypt
   for as long as old blobs might exist (saved matches, a mid-game player who hasn't re-escrowed).
3. On **encrypt**, always emit `E2:`. The first hand change re-seals the blob in the new format; the
   old `E1:` blob is replaced naturally.
4. The **server needs no change** — it stores and returns `E2:` bytes exactly as it did `E1:`.
5. Optionally bump the client version; the handshake is advisory, so nothing hard-breaks.

The point of §8 as a whole: the crypto is **not locked**, its format is **already versioned** for a
clean swap, and the server's crypto surface (salt + opaque store) is **entirely yours** to harden
without affecting any other part. The only thing to avoid is pulling the key onto the server by
mistake and believing it's an improvement.

---

## 9. MUST vs MAY — the minimum viable server

Full table in `ELYSIUM-PROTOCOL.md` §6. Summary:

**MUST (a game does not function without these):**

- WS upgrade + JSON `{t}` framing + the unknown-verb tolerance (§2).
- `create` / `join` with the password throttle (§5.3), the `joined` payload, and `token` rejoin.
- Pure relay verbs: board, log, chat, say, decide, fx, logTo, tool.
- Server-held hidden piles: the deck-upload / draw / browse / reveal / take / return / shuffle /
  bulk family, plus deal-on-start and the count/result replies. This is the hidden-stays-hidden core.
- The referee minimum: pass→turn, dice, VP, oust bounty, un-oust.
- Escrow: issue the salt, store/return the opaque blob.
- Cross-board: give (with a stable id) / recall / recalled / ctrl — pure routing, ids preserved.
- Edge relay: pass / take — validated, seat-derived.
- Hand reveal / open-hand grants — private routing.

**MAY (strongly recommended for public hosting, but a game runs without them):**

- Host controls (kick / promote / demote / mute / set-pool / oust / un-oust / helper policy).
- Named saves (save / list / delete / load) — the reference persists to JSON files, cap 50.
- Serving the client file itself (`no-store`) — you can host the client as a static asset anywhere.

A "MUST-only" server is genuinely small — it's a relay with a pile store and a thin referee. That's a
weekend in most languages once you have a WebSocket library.

---

## 10. Persistence — what must survive a restart

The reference persists two things; **both are "MAY" and both are replaceable with any storage** (a
database is a natural upgrade):

- **`elysium-rooms.json`** — a rolling snapshot (every 60 s and on SIGINT). Restored on boot unless
  older than 24 h. This is what makes **token rejoin survive a server restart**: to preserve it, your
  store must round-trip, per room: the room's pass hash + host token + settings + escrow salt, and
  per player: name, **token**, seat pick, VP, out/vacant flags, the server-held **piles** (`game`),
  and the **hand blob**. If you drop this, a restart simply means players re-join fresh — acceptable
  for some deployments, so it's genuinely optional.
- **`elysium-saves.json`** — named match saves; unlike the room snapshot these **never expire on
  age** (they live until the host deletes them), cap 50. A save is a self-contained snapshot of a
  started game including every seat's public board and hand blob (hands stay client-side; a loaded
  match restores decks + public boards with empty hands, exactly like a seat takeover).

Everything about *how* this is stored (files, SQLite, Postgres, Redis, S3) is yours. The contract is
only *what* must be recoverable for token-rejoin and match-load to work.

---

## 11. Conformance — proving your server works

There are two flavours of test, and the distinction matters for a non-JS port:

- **Black-box (language-agnostic).** The network conformance suites (`test-2a` … `test-2g`,
  ~195 assertions) connect to a *running* server over a loopback WebSocket and exercise rooms & auth
  (incl. the password-throttle / lockout), state sync, escrow round-trips, and saves. Because they
  speak only the wire protocol, **they validate ANY server** — point them at your Rust/Go/Python
  build: start it on a test port, then run each suite against that port. (`test-crypto.js` validates
  the escrow AEAD standalone and is only relevant if you're touching the cipher — Case 2.)
  Operational note from the reference: delete `elysium-rooms.json` + `elysium-saves.json` between
  runs, since the lockout test poisons the localhost IP.
- **White-box (JS reference only).** `test-server-dispatch.js` and `test-protocol-doc.js`
  `require()` the JS server module directly (via a harness that stubs `http` so nothing binds a
  port). They check the reference's dispatch shape and that `ELYSIUM-PROTOCOL.md` matches the live
  handler tables. These test the **reference implementation**, not your port — but the protocol-doc
  lint is still valuable to *you* as the canonical, always-current field reference to implement
  against.

> **Honest caveat about the current snapshot:** the black-box suites (`test-2a` … `test-2g`,
> `test-crypto.js`) are referenced by `ELYSIUM-PROTOCOL.md` §10 but are **not present in the current
> project snapshot** (only `test-client-logic.js`, `test-server-dispatch.js`, `test-protocol-doc.js`
> ship). If you're validating a fresh server, you'll want those recovered from the reference repo —
> or, failing that, treat `ELYSIUM-PROTOCOL.md` §7/§8 as the spec and write your own conformance
> tests from the field lists (they're exact and machine-generated, so they're a reliable basis).

The pragmatic path for a port: implement against the protocol doc, stand your server next to the
reference client, and play — the client's diagnostic ring buffer (`elysiumDbg()` in the browser
console) records silent network/escrow errors even with debug off, so it's your best live signal.

---

## 12. Deployment topology

- **One origin (reference default):** the server serves the client over HTTP and upgrades to
  WebSocket on the same port. Simplest to run.
- **Split hosting (fine, and common for scale):** host the client as a static file anywhere (CDN,
  object store, GitHub Pages) and run the WebSocket server separately. The *Server address* field and
  the `?server=` deep link point the socket at your server. The client is genuinely just a static
  asset — no build step, no server-side rendering.
- **TLS / tunnels / reverse proxies.** Whatever fronts your server MUST: terminate TLS on 443 and
  forward to your WS port (§4.1); **not buffer WebSocket frames**; keep idle timeouts **above** your
  ping interval (§4.2); and pass the WS upgrade headers through. If any of those slip, symptoms are
  the classic ones — connects then immediately drops, or quiet games die after ~100 s.
- **Deep-link integration (the tournament hook):** `?server=<addr>&room=<room>&name=<player>` pre-
  fills and opens the join dialog — one click from a seat. **Password is deliberately not a URL
  parameter** (URLs leak via history/logs/screenshots) and the client never auto-joins from a link.
  Build your outer tournament layer to emit these links.

---

## 13. A porting checklist (recommended order)

1. **WebSocket echo.** Stand up a WS server in your language; confirm a browser can connect over
   `ws://` locally and `wss://` through your intended TLS front. Get the upgrade + framing right
   first (or lean on a mature library).
2. **The unknown-verb rule + JSON `{t}` parse.** Ignore anything you don't handle. Build the
   `handle()` equivalent: parse, validate `t` is a string, dispatch, and wrap it so a handler throw
   becomes an error reply, not a crash.
3. **`create` / `join` + roster + the `joined` payload + `token` rejoin.** Get identity right:
   **derive the seat**, issue and honor the token, apply the password throttle with the tunnel-aware
   key (§5.3). This is the spine.
4. **Relay verbs.** Board push (+ server-side re-sanitize), log, chat, say, decide, fx, tool. Pure
   routing — quick once the spine exists.
5. **Server-held piles.** Deck upload → shuffle (unbiased!) → the draw/browse/reveal/take/return
   family, with results going only to the owning socket. This is where hidden-stays-hidden lives —
   test it hardest.
6. **Referee minimum.** pass→turn (skipping ousted/vacant seats), dice, VP clamp, oust bounty.
7. **Escrow.** Issue the salt at create; store/return the opaque blob on the escrow verb / reconnect
   / takeover / load. **Do not decrypt anything.**
8. **Cross-board + Edge.** give/recall/recalled/ctrl and edge pass/take — routing with preserved ids
   and seat-derived senders.
9. **Keepalive & reconnect.** 30 s ping, 75 s reaper, the grace window. Verify a quiet game survives
   past the tunnel idle window.
10. **MAY features as desired.** Host controls, named saves (or your DB equivalent), serving the
    client.
11. **Validate.** Run the black-box suites against your server (§11), then play against the real
    client with `elysiumDbg()` open.

Work top-down: a server that reaches step 5 already supports a full sandbox game; steps 6–8 add the
referee and cross-board niceties; 9 is what makes it robust over real networks.

---

## 14. Non-obvious pitfalls (gifts from the reference's own history)

These bit the reference or were caught in review; a porter should know them up front:

- **Seats are array positions, not a field.** There is no `.seat` on a player. Index `players[seat-1]`
  and derive the sender's seat as `indexOf+1`. Trusting a client-sent seat for *identity* is the
  classic hole.
- **Behind a tunnel, everyone is loopback.** Any per-IP counter silently becomes global across all
  tunnel players. Decide, per limit, whether to exempt loopback or re-key (§5.3) — explicitly, every
  time you add one.
- **Read a token's live position before you remove it.** In the Edge handoff, reading the token after
  removing it returns null and loses the drop position. (Analogous care applies to any "capture then
  mutate" sequence.)
- **`sanitizePub` hard-codes the seat bound (`6`) instead of `MAX_PLAYERS`.** If you raise the seat
  cap, key every bound to the constant, or target markers silently vanish for the new seats.
- **Spectator names aren't deduplicated.** Player join enforces case-insensitive name uniqueness, but
  spectator join pushes any name unconditionally, and some host actions match names case-sensitively.
  A clean port should run spectator names through the same dedup and make host name-lookups
  case-insensitive, so a watcher can't shadow a seated player.
- **The version handshake is advisory.** Never hard-reject on version; compare major.minor and warn.
- **Keep randomness unbiased.** The reference uses rejection sampling for shuffles and dice; a naive
  `rand() % n` biases the crypt/library order and the dice. For a game about hidden decks, that's a
  correctness bug, not a nicety.

---

## 15. Licensing / Dark Pack (out of protocol scope)

The protocol and Elysium's own code are the author's to open as they wish. **Card images, card data
and VTES IP are NOT part of this contract** — they come from KRCG under Paradox Interactive's Dark
Pack terms (free, non-commercial; the Dark Pack logo + the exact legal text + an "unofficial" notice
are required). A third-party deployment that ships or proxies card art/data **must carry its own Dark
Pack compliance**. The server itself never handles card art — it stores card *names* as strings — so
in practice this obligation lands on whoever hosts the client and its card-image fetches, not on the
WebSocket server per se. Confirm the current Dark Pack terms before publishing.

---

### Appendix — one-paragraph summary to hand a prospective maintainer

*Elysium's client is a browser UI bound to a WebSocket + JSON protocol, not to any language. The
server's job is to relay client-authoritative public boards, hold the hidden libraries/crypts, act as
a thin referee (turn order, dice, VP, oust bounty), and store one opaque encrypted hand-blob per seat
that it can never read. Honor five invariants (derive the seat, sanitize strings, make rate limits
tunnel-aware, keep hidden hidden, gate host actions), keep a ≤30 s keepalive ping and token-based
reconnect, and you can rewrite the whole thing in any stack. The crypto is client-side and versioned
(`E1:`/`E2:`); you can harden everything around it and even strengthen the cipher (a client change)
without touching interop — the only misstep is moving hand encryption onto the server, which trades
away the zero-knowledge property. The authoritative field-level contract is `ELYSIUM-PROTOCOL.md`
(§7/§8, generated from and linted against the live code); this file is the operational companion.*
