# ELYSIUM-PROTOCOL.md — the client↔server contract

> **Protocol family 2.5.** This document reflects client **v2.5.73** / server **v2.5.62** (v2.5.62: the reference server's `sanitizePub` whitelist catches up with the §5 pub surface stated below — `tokens`, `clan` and the card fields `actSt`/`_avSeq`/`path`/`sup` are now actually relayed, sanitized; no verb or field-list changes, pub internals are payload not message fields) (v2.5.72 = the A+B branch merge — protocol-wise identical to the v2.5.61 era: the B-branch was client-only and `sup` rides the pub snapshot exactly like `path` does) (v2.5.56: `err` gains an optional `cid` for recall bounces — §8; §3 field lists corrected by the new lint check. v2.5.57–62: new `ctrl` act VALUES + Give back both ride existing generic routing/verbs — no field-list changes. v2.5.61: spectator-name dedup + case-insensitive host lookups, behaviour-only) and is guarded by
> `node test-protocol-doc.js`, which diffs the verb/message indexes below against the LIVE
> `GAME_HANDLERS` (server) and `MP_HANDLERS` (client) tables — if this doc and the code drift, the lint
> fails. **Any protocol change ships with an update here + a green lint run.**
>
> Audience: anyone who wants to put their OWN server (matchmaking, tournaments, hosting) behind the
> Elysium client. The client is a self-contained `elysium-vtes-bord.html`; point its *Server address*
> field (or a deep link, §9) at your endpoint and speak this protocol.

## 1. Transport & framing

- **WebSocket, text frames, one JSON object per message.** Every message has a string field `t` (the
  verb / message type). No binary frames, no batching, no compression requirements.
- **Unknown-verb rule (BOTH directions, load-bearing):** receivers ignore any `t` they do not know.
  This is the forward-compatibility contract — a newer client against an older server (or vice versa)
  degrades gracefully instead of erroring. A third-party server MUST keep this rule.
- **One origin serves both** in the reference setup: the Node server serves the client file over HTTP
  (`Cache-Control: no-store`, fresh read per request) and upgrades to WebSocket on the same port
  (default **8123**, `process.argv[2]` overrides). A third-party deployment MAY host the client
  anywhere (it is a static file) — the *Server address* field / `?server=` deep link points the socket
  elsewhere. Constraint: an **https page can only open `wss://`** (mixed content), and the client
  never appends `:8123` over https (a tunnel/proxy answers on 443). Over plain http a portless host
  gets `:8123`. This is `cleanAddr()`/`mpConnect()` behaviour and any fronting proxy must match it.

## 2. Connection lifecycle

- **Keepalive:** the server pings every **30 s**; browsers answer at the protocol level (no client
  code). A dead-connection reaper runs at **75 s** (>2 ping intervals — one missed ping is forgiven).
  A Cloudflare quick tunnel idles out around ~100 s, so these numbers are load-bearing: a replacement
  server SHOULD keep a ≤30 s ping.
- **Reconnect & rejoin:** the client auto-reconnects with immediate **2.5 s** retries and replays its
  session `token` (issued in `joined`/`took`) via `join` — the server restores the same seat, pub,
  pile counts and escrow blob. Treat the token as the seat's bearer credential.
- **Version handshake (advisory, never a gate):** client sends `v` in `create`/`join`; server replies
  with `srv`. BOTH sides compare **major.minor only** (`verMM`) and print a warning line on mismatch.
  Patch drift is by design (client-only fixes ship without a server restart).

## 3. Session establishment (pre-seat verbs)

These are handled by the server's staged pre-dispatch, before the seated `GAME_HANDLERS` table:

<!-- protocol-lint:session -->`create` `join`<!-- /protocol-lint:session -->

| verb | key fields | semantics |
|---|---|---|
| `create` | `room`, `pass`, `name`, `lobby`, `minutes`, `react`, `tableView`, `l3shape`, `boardMode`, `chat`, `specChat`, `helperPolicy` | Create a room (caps: **50 rooms**, **6 players**; loopback-exempt create cap). The creator becomes host; the room's `hostToken` is minted SERVER-side from the creator's session token (never client-sent), and the `join` verb's `token` is what lets a restarted host reclaim the room. Replies `joined`. |
| `join` | `room`, `pass`, `name`, `spect`, `token` | Join by room+password (or spectate with `spect`, or resume with `token`). Failed passwords are throttled — see §4. Replies `joined` (or `err`). |

`chat` and `leave` are additionally honoured pre-seat (lobby chat; abandoning the lobby) — they also
appear in the seated table below.

## 4. Identity & security invariants — a replacement server MUST inherit these

1. **The server derives the actor's seat.** Seats are array positions: `room.players.indexOf(p)+1`.
   NEVER trust a client-sent seat for identity — a client can lie. (Client-sent seat fields like
   `give.seat` name the *target*, which is fine; the *sender* is always derived.)
2. **Sanitise every string** before storing or re-broadcasting: the reference sanitisers are
   `cleanName` (names/rooms), `cleanCard` (card names, length-capped), `cleanId` (gid/cid,
   `[a-zA-Z0-9_-]`, ≤32 chars), plus length caps on arrays (deck sizes, counters, saves).
3. **Rate limits must answer: “what does this key to behind a tunnel?”** Behind a TLS tunnel every
   player is loopback (`127.0.0.1` / `::1` / `::ffff:127.0.0.1`). The connection cap and room-create
   cap EXEMPT loopback; the password-fail throttle CANNOT (that would unthrottle brute force over a
   tunnel), so it re-keys: `failKey = loopback ? 'room:'+room.name : conn.ip` — per-room over a
   tunnel, per-IP otherwise. Any new limit needs the same decision.
4. **Hidden stays hidden.** Opponent hands, libraries and crypts NEVER appear in any broadcast. Piles
   live server-side as name arrays; only counts (`pileN`) and the owner's private results (`drew`,
   `pileList`, `dealt`) leave the server. The hand travels only as an **escrow blob** (§5).
5. **Host identity** is the creating connection (reclaimable via `hostToken`); host-only verbs are
   marked in §7 and MUST be gated.

## 5. The state model (what kind of server this is)

- **Public boards are client-authoritative.** Each client pushes its own `pub` (a filtered
  serialisation — positions, face-up names, counters, tokens, clan, targeting) via `board`; the
  server stamps seat+who and relays. The server never simulates game rules — **Elysium is a sandbox**
  and the table is the referee.
- **Hidden piles are server-authoritative** (deck upload → server shuffles → `draw`/`browse`/… act on
  the server copy). Turn order (`pass`→`turn`), dice (`roll`), VP clamping and the oust bounty
  (+6 pool routed to the predator, +1 VP server-side) are also server-side — the small set of things
  a table cannot self-referee.
- **The hand escrow is opaque to the server.** The client encrypts its hand with a key derived from
  the room's public `escrowSalt` (issued at create, persisted with saves) using client-side AEAD
  (SHA-256/HMAC/PBKDF2 — reference copy in `esc-crypto.js`). The server's whole duty: hand out the
  salt, store the latest `blob` per seat, return it on rejoin/promote/load. **Zero crypto required
  server-side.**
- **Tournament authority goes AROUND this protocol, not inside it.** A pre-stage (accounts, brackets,
  matchmaking) creates rooms, deep-links players in (§9), spectates, and collects results — the
  in-game protocol stays a sandbox on purpose.

## 6. Minimum viable server (MUST) vs reference extras (MAY)

| Capability | MUST/MAY | Notes |
|---|---|---|
| WS upgrade + JSON `{t}` framing + unknown-verb tolerance | MUST | §1 |
| `create`/`join` (+password throttle per §4), `joined` payload, session `token` rejoin | MUST | §3 |
| Relay verbs: `board`, `log`, `chat`, `say`, `decide`, `fx`, `logTo`, `tool` | MUST | pure routing |
| Server-held piles: `deck`…`pileBulk`, `dealt`/`drew`/`pileN`/`pileList`/`revealed` | MUST | hidden-stays-hidden |
| Turn/dice/VP/bounty: `pass`→`turn`, `roll`, `vp`, `bounty`, `unoust` | MUST | the referee minimum |
| Escrow: `escrowSalt` + `handEscrow` store/return | MUST | opaque blobs |
| Cross-board: `give`(+`gid`) / `recall` / `recalled` / `ctrl` | MUST | pure routing, ids preserved |
| Edge relay: `edgePass` / `edgeTake` | MUST | validated, seat-derived |
| Hand reveal / open hand: `revealHand`, `openHand` grants | MUST | private routing |
| Host controls: kick/promote/demote/mute/hostSetPool/hostOust/hostUnoust/setHelperPolicy | MAY | strongly recommended for public hosting |
| Named saves: `saveMatch`/`listSaves`/`delSave`/`loadMatch` (+autosave housekeeping) | MAY | reference persists to JSON files, cap 50 |
| Serving the client file itself (`no-store`) | MAY | host the client anywhere |

## 7. Client → server verbs (48) — the seated `GAME_HANDLERS` table

Machine-readable index (guarded by the lint — keep sorted):

<!-- protocol-lint:c2s -->`board` `bounty` `browse` `chat` `ctrl` `decide` `deck` `delSave` `demote` `draw` `drawCrypt` `edgePass` `edgeTake` `fx` `give` `handEscrow` `hostOust` `hostSetPool` `hostUnoust` `kick` `leave` `listSaves` `loadMatch` `log` `logTo` `mute` `openHand` `pass` `pileBulk` `pileReturn` `pileTake` `pileTop` `promote` `recall` `recalled` `redeal` `reveal` `revealHand` `roll` `saveMatch` `say` `seat` `setHelperPolicy` `shufPile` `start` `tool` `unoust` `vp`<!-- /protocol-lint:c2s -->

*fields read* = the `m.*` fields the reference server consumes (anything else is ignored);
*emits* = message types this verb can produce (an `err` reply is always possible and omitted);
*gates* = `host` (host-only) / `started‑gate` (behaviour differs before vs after match start).

### Session & lobby

| verb | fields read | emits | gates | semantics |
|---|---|---|---|---|
| `chat` | `msg` | `chat` |  | Table chat. Also accepted PRE-seat in the lobby. Respects the room's chat / spectator-chat toggles and per-player mute. |
| `seat` | `seat` | — | started‑gate | Pick/switch seat in the LOBBY (pre-start only). |
| `start` | — | `started`, `turn` | host started‑gate | HOST starts the match: locks the roster, deals per stored decks, broadcasts `started` + first `turn`. |
| `leave` | — | — |  | Leave your seat / the room. Also honoured PRE-seat. Vacates the seat; turn advances if it was yours. |

### Turn, table & voice

| verb | fields read | emits | gates | semantics |
|---|---|---|---|---|
| `pass` | — | `turn` |  | End your turn. SERVER advances `room.turnSeat` to the next live seat and broadcasts `turn` (turn order is server-authoritative). |
| `roll` | `sides` | `roll` |  | Dice roll (`sides`); server rolls and broadcasts `roll` so nobody rolls client-side. |
| `vp` | `d` | — |  | Adjust your victory points by `d` (clamped 0–10 in 0.5 steps server-side). |
| `unoust` | — | — |  | Un-oust yourself (mirrors hostUnoust for self). |
| `bounty` | — | `bounty` |  | Report your own oust. SERVER routes +6 pool to the predator's client, sets +1 VP server-side, marks you out, advances the turn if needed. |
| `say` | `i` | `say` |  | Quick phrase by index `i`; broadcast `say`. |
| `decide` | — | `decide` |  | Open a reaction window; server stamps who + the room's `reactSecs` and broadcasts `decide`. |
| `fx` | `card`, `kind`, `target`, `verb` | `fx` | started‑gate | Card-event animation relay (play/flip/rise clones): sanitised card/target/actor info, broadcast `fx` to everyone else. |
| `log` | `html` | `log` |  | Append a public log line to the table log; server stamps `who` and broadcasts `log`. |
| `logTo` | `html`, `toSeat` | `logTo` | started‑gate | Route a private log note (`html`, sanitised) to seat `toSeat`; the recipient gets `logTo` stamped with `from`. |
| `tool` | `kind`, `n` | `tool`, `turn` |  | Shared table tools (timer / turn-order draw): `kind`,`n`; server may broadcast `tool` and/or `turn`. |

### Deck & the server-held piles

| verb | fields read | emits | gates | semantics |
|---|---|---|---|---|
| `deck` | `crypt`, `library`, `name` | `deckok` | started‑gate | Upload your deck: `library`/`crypt` name arrays (sanitised, capped) + `name`. Server SHUFFLES and stores the hidden piles; replies `deckok`, broadcasts `pileN`. |
| `redeal` | — | — | started‑gate | Reshuffle-and-redeal your own piles pre-start. |
| `draw` | — | — |  | Draw the top library card. Server pops it and returns it privately in `drew`; broadcasts `pileN`. |
| `drawCrypt` | — | — |  | Draw the top crypt card (influence). Private `drew` + `pileN`. |
| `pileTop` | `action`, `kind`, `n` | — |  | Peek/act on the top `n` of a pile (`kind`), per `action`. |
| `pileReturn` | `kind`, `name`, `pos` | `pileN` |  | Return a named card to a pile at `pos` (top/bottom/shuffle-in). |
| `shufPile` | `pile` | `pileN` |  | Shuffle one of your piles. |
| `browse` | `pile` | `pileList` |  | Request your own pile listing; replies privately with `pileList`. |
| `pileTake` | `i`, `name`, `pile` | — |  | Take card `i`/`name` out of a browsed pile into hand. |
| `reveal` | `kind`, `n` | `revealed` |  | Reveal top `n` of a pile to the table (`revealed` broadcast). |
| `pileBulk` | `crypt`, `lib`, `shuffle` | `pileN` |  | Bulk-return arrays to `crypt`/`lib` (with optional `shuffle`) — used by board resets/loads; broadcasts `pileN`. |

### Board sync & hand escrow

| verb | fields read | emits | gates | semantics |
|---|---|---|---|---|
| `board` | `pub` | `board` |  | Push your public board blob (`pub`, from buildPub); server broadcasts `board` (seat+who stamped) to everyone else. THE core sync verb. |
| `handEscrow` | `blob` | — |  | Store your encrypted hand `blob`. Opaque to the server (client-side AEAD; key derived from the room's `escrowSalt`); returned on rejoin/promote. |
| `revealHand` | `cards`, `pub`, `to` | `log`, `revealHand` | started‑gate | One-shot hand reveal to seat `to` (or all); routed privately, logged. |
| `openHand` | `cards`, `revoke`, `to` | `openHandGrant`, `openHandRevoke` | started‑gate | Standing open-hand grant (or `revoke`) to seat `to`; server routes `openHandGrant`/`openHandRevoke`. |

### Cross-board card lifecycle

| verb | fields read | emits | gates | semantics |
|---|---|---|---|---|
| `give` | `attachTo`, `card`, `gid`, `rx`, `ry`, `seat` | `gave`, `given` |  | Move a card object to seat `seat`'s board (drop fraction `rx`/`ry`, optional `attachTo`). Whitelisted fields incl. giver-assigned `gid`; server auto-stamps `owner`. Emits `given` to the holder, `gave` back. |
| `recall` | `cid`, `seat` | `recall` |  | OWNER asks holder `seat` to remove card `cid` (take-back / burn / undo-of-give). Pure routing; forwards `recall` to the holder. |
| `recalled` | `cid`, `kind`, `name`, `ok`, `seat` | `recalled` |  | HOLDER confirms/denies a recall (`ok`, card info); routed back to the owner. |
| `ctrl` | `act`, `cid`, `seat` | `ctrl` |  | OWNER adjusts a controlled card in place on the holder's board (`act`, e.g. blood +/-); routed to the holder. |

### The Edge

| verb | fields read | emits | gates | semantics |
|---|---|---|---|---|
| `edgePass` | `fromName`, `pos`, `toSeat` | `edgePass` | started‑gate | Hand The Edge to `toSeat` with a drop `pos`; server validates and broadcasts `edgePass`. |
| `edgeTake` | `clearOnly` | `edgeTake` | started‑gate | Take The Edge (or `clearOnly` to just clear); broadcast `edgeTake`. |

### Host controls

| verb | fields read | emits | gates | semantics |
|---|---|---|---|---|
| `hostSetPool` | `seat`, `val` | `forceSetPool` | host | HOST sets seat's pool to `val` (routed `forceSetPool`). |
| `hostOust` | `seat` | `bounty`, `forceOust` | host | HOST forcibly ousts a seat (bounty flow included). |
| `hostUnoust` | `seat` | — | host | HOST reverses an oust. |
| `setHelperPolicy` | `policy` | `helperPolicy` | host | HOST sets the table's helper policy; broadcast `helperPolicy`. |
| `kick` | `name`, `seat` | — | host started‑gate | HOST removes a player/spectator (by seat or name). |
| `demote` | `name` | `demoted` | host started‑gate | HOST moves a player to spectator (`demoted` to them). |
| `promote` | `name`, `seat` | `took` | host started‑gate | HOST seats a spectator (they receive `took`). |
| `mute` | `name`, `on` | `muted` | host started‑gate | HOST (un)mutes a participant's chat. |

### Named saves (host)

| verb | fields read | emits | gates | semantics |
|---|---|---|---|---|
| `saveMatch` | `name` | `matchSaved` | host started‑gate | HOST: persist the room (pubs + piles + escrow blobs + meta) under `name`; replies `matchSaved`. |
| `listSaves` | — | `saveList` | host | HOST: list named saves (`saveList`). |
| `delSave` | `name` | `saveList` | host | HOST: delete a named save. |
| `loadMatch` | `name` | `took` | host started‑gate | HOST: load a named save into the room; seated players receive `took` with their restored state. |

## 8. Server → client messages (42) — the client's `MP_HANDLERS` table

<!-- protocol-lint:s2c -->`board` `bounty` `chat` `ctrl` `dealt` `decide` `deckok` `demoted` `drew` `edgePass` `edgeTake` `err` `forceOust` `forceSetPool` `fx` `gave` `given` `helperPolicy` `joined` `lobby` `log` `logTo` `matchSaved` `muted` `openHandGrant` `openHandRevoke` `pileList` `pileN` `recall` `recalled` `revealHand` `revealed` `roll` `roster` `saveList` `say` `started` `sys` `timeup` `took` `tool` `turn`<!-- /protocol-lint:s2c -->

> **Client-side sanitisation contract.** Fields that carry HTML fragments — today only `logTo.html` — are
> UNTRUSTED input to every client: a client MUST sanitise them at render time. The reference whitelist is
> `<b>`, `<i>` and the log card-link form `<b class="clog" data-cid="…">` (see `sanRemote()` in the reference
> client). From server v2.5.38 the reference server also pre-sanitises the field with the same whitelist
> (`sanHtml()`, defence-in-depth) — but a client MUST NOT rely on any server having done so.

### Session & roster

| message | fields | semantics |
|---|---|---|
| `joined` | `boardMode`, `chat`, `crypt`, `escrowSalt`, `handBlob`, `helperPolicy`, `l3shape`, `lib`, `lobby`, `matchEnd`, `myPub`, `players`, `reactSecs`, `room`, `seat`, `specChat`, `spect`, `srv`, `tableView`, `token`, `turn`, `watchers`, `you` | Session established (you). Carries your seat/room/`token` (rejoin key), roster `players`, room config (boardMode, tableView, l3shape, reactSecs, chat flags, helperPolicy), match state (`lobby`, `turn`, `matchEnd`), your restored `myPub`/`handBlob`+`escrowSalt`, pile counts `lib`/`crypt`, `watchers`, server version `srv`. |
| `lobby` | `players`, `watchers` | Roster refresh while un-started (players + watcher count). |
| `took` | `boardMode`, `crypt`, `deckName`, `escrowSalt`, `handBlob`, `l3shape`, `lib`, `loaded`, `matchEnd`, `pub`, `reactSecs`, `seat`, `tableView`, `token`, `turn` | You took/were given a seat (promote, loadMatch, seat pick): full per-seat restore payload (pub, handBlob, escrowSalt, piles, turn, room config, `token`). |
| `demoted` | — | You were moved to spectator. |
| `started` | `boardMode`, `l3shape`, `matchEnd`, `players`, `tableView`, `turn` | Match started: roster, turn, room view locks, matchEnd. |
| `roster` | `players`, `watcherList`, `watchers` | Seated-game roster refresh (players, watchers, watcherList). |
| `sys` | `msg` | System line (version-mismatch warning, notices). |
| `err` | `msg`, `cid` | Human-readable error line for your last request (`msg`). `cid` (v2.5.56, optional): recall bounces echo the failed card id so the client clears only that recall-guard entry - absent on all other errors and on pre-2.5.56 servers (the client falls back to the old wholesale clear). |

### Turn, table & voice

| message | fields | semantics |
|---|---|---|
| `turn` | `seat`, `who` | Turn passed: active `seat`/`who`. Server-authoritative. |
| `roll` | `n`, `sides`, `who` | Dice result broadcast (`who`, `sides`, `n`). |
| `say` | `i`, `seat`, `who` | Quick phrase (`i`) from `who`/`seat`. |
| `decide` | `secs`, `who` | Reaction window opened (`secs`, `who`) — run the shared countdown. |
| `fx` | `actor`, `card`, `kind`, `onto`, `reveal`, `seat`, `target`, `toName`, `verb`, `who` | Remote card-event animation (play/flip/rise clone) with sanitised card/actor/target info. |
| `log` | `html`, `who` | Public log line from `who`. |
| `logTo` | `from`, `html` | Private log note routed to you from `from`. |
| `chat` | `msg`, `who` | Chat line (`who`,`msg`). |
| `muted` | `on` | Your chat was (un)muted (`on`). |
| `tool` | `kind`, `n`, `order`, `result`, `who` | Shared tool event (timer / turn-order result). |
| `timeup` | — | Match clock hit zero (bell). |

### Deck & piles (private + public)

| message | fields | semantics |
|---|---|---|
| `deckok` | `deckName` | Your deck upload was accepted (`deckName`). |
| `dealt` | `deckName`, `hand`, `unc` | Your private opening deal (hand + uncontrolled) after start/redeal. |
| `drew` | `kind`, `name`, `pile`, `took`, `zone` | Your private draw result (`kind`,`name`,`pile`,`zone`,`took`). |
| `revealed` | `kind`, `names` | Public pile reveal (`kind`, `names`). |
| `pileN` | — | Pile counters update (your `lib`/`crypt` counts live server-side). |
| `pileList` | `names`, `pile` | Your requested pile listing (private browse). |

### Board sync & hands

| message | fields | semantics |
|---|---|---|
| `board` | `pub`, `seat`, `who` | Another seat's public board blob (`seat`,`who`,`pub`) — store in net.boards and re-render. |
| `revealHand` | `cards`, `from`, `seat`, `who` | A hand reveal shown to you (cards, from, seat). |
| `openHandGrant` | `cards`, `seat` | Standing open-hand from `seat` (cards; re-pushed on change). |
| `openHandRevoke` | `seat` | That grant ended. |

### Cross-board card lifecycle

| message | fields | semantics |
|---|---|---|
| `given` | `attachTo`, `blood`, `blue`, `counters`, `faceDown`, `from`, `gid`, `green`, `kind`, `locked`, `name`, `owner`, `rx`, `ry` | A card arrives on YOUR board from `from` (whitelisted fields incl. `gid`, `owner` auto-stamped, drop `rx`/`ry`, optional `attachTo`). Recreate it with the SAME id (`gid`). |
| `gave` | `to` | Ack to the giver (`to`). |
| `recall` | `cid`, `from`, `fromSeat` | You are the HOLDER: owner `from` wants card `cid` removed. Remove it, re-push your board, reply `recalled`. |
| `recalled` | `cid`, `kind`, `name`, `ok` | You are the OWNER: your recall resolved (`ok`, card info) — recreate in hand/ash per your pending intent. |
| `ctrl` | `act`, `cid`, `from` | You are the HOLDER: apply `act` (e.g. blood +/-) to card `cid` in place, then re-push your board. |

### The Edge

| message | fields | semantics |
|---|---|---|
| `edgeTake` | `bySeat`, `clearOnly` | `bySeat` took The Edge (or clear-only). |
| `edgePass` | `fromName`, `pos`, `toSeat` | The Edge was handed to `toSeat` at `pos`. |

### Pool, VP & host actions

| message | fields | semantics |
|---|---|---|
| `bounty` | `from` | You are the predator: +6 pool from `from`'s oust (VP was set server-side). |
| `forceSetPool` | `val` | Host set your pool to `val`. |
| `forceOust` | — | Host ousted you. |
| `helperPolicy` | `helperPolicy` | Table helper policy changed. |

### Named saves

| message | fields | semantics |
|---|---|---|
| `matchSaved` | `name`, `saves` | A named save landed (`name`, updated `saves`). |
| `saveList` | `saves` | Named saves listing. |

## 9. Deep-link prefill (client v2.5.37+)

`https://<client-host>/?server=<addr>&room=<room>&name=<player>` pre-fills the Play-online dialog and
opens it — one click from joining. **`pass` is deliberately NOT a parameter** (URLs leak via history,
logs, screenshots); the player types it. The client never auto-joins from a link. `server=` accepts
anything the dialog field accepts (`cleanAddr` normalises; the https-page→wss rule from §1 applies).
This is the integration hook for a tournament pre-stage.

## 10. Conformance — the executable spec

- **`test-2a` … `test-2g`** (~195 assertions, loopback WebSocket): rooms & auth (2a incl. the
  password-throttle / lockout), state sync, escrow round-trips, saves. Run them against YOUR server:
  `node your-server.js 89XX` then `node test-2a.js 89XX` (delete `elysium-rooms.json` +
  `elysium-saves.json` between runs — 2a's lockout test poisons the localhost IP).
- **`test-server-dispatch.js`** (5): the `handle()`/`GAME_HANDLERS` routing shape + throttle keying.
- **`test-crypto.js`**: the escrow AEAD, standalone.
- **`test-protocol-doc.js`**: THIS document vs the live handler tables (both directions).

## 11. Change discipline

A protocol change = code + this doc + a green `node test-protocol-doc.js`, in the same delivery.
The lint parses only the three `protocol-lint` marker blocks above; prose can evolve freely.

## 12. Licensing note

The protocol and Elysium's code are Johan's to open as he wishes. **Card images, card data and VTES
IP are NOT part of this contract** — they come from KRCG under Paradox Interactive's Dark Pack terms
(free, non-commercial, attribution + legal text required). A third-party deployment must carry its
own Dark Pack compliance.
