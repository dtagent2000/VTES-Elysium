# ELYSIUM-PROTOCOL.md — the client↔server contract

> **Protocol family 2.5/2.6 (wire-compatible).** This document reflects client **v2.6.159** / server **v2.6.46** (cli-2.6.159, 16 Oct 2026: client-only, no wire change -- §12 gains the client's Reduce line (`NAME reduces the bleed by N.`, the Bleed menu's Reduce row, asked by bot v0.6.201) and records two bot-emitted lines the bots now read from each other (the DEBUG announcement and its Tournament exit); the hotseat bridge relays a bot's `edgeTake`, `revealHand` and `logTo`, and a human's `edgeTake`, `edgePass`, `revealHand`, `openHand` and targeting `logTo` reach the bot seats, each in the server's own shape (§12.2); cli-2.6.158, 14 Oct 2026: client-only, no wire change -- what the play-test found: the default combatant expires, one image fallback, a master played on a vampire counts, the level chooser follows the anchor; cli-2.6.157, 14 Oct 2026: client-only, no wire change -- the tucked pool globe sits lower; cli-2.6.156, 14 Oct 2026: client-only, no wire change -- a tooltip's words; cli-2.6.155, 14 Oct 2026: client-only, no wire change -- a Large table reaches 19 canonical px further out on both sides and the hand is centred on the table; cli-2.6.154, 14 Oct 2026: client-only, no wire change -- the hand's pin on the table edge; cli-2.6.153 + srv-2.6.46, 14 Oct 2026: ONE additive change -- the room option `tableLayout` ('large'), stored at `create` for a Classic room and echoed wherever `tableSetup` is; see the paragraph after the `tableSetup` one; cli-2.6.152 was a preview never released; cli-2.6.151, 13 Oct 2026: client-only, no wire change -- a seat's `edge` without an `edge` token is drawn on its pool globe; cli-2.6.150, 13 Oct 2026: client-only, no wire change -- the Played tab names a running resolver instead of the tray opening on every screen; before: cli-2.6.149 + srv-2.6.45, 13 Oct 2026: ONE additive change -- a `board` pub may carry `tn` and `rn`, the Turn and Round count its client holds (positive integers, the server caps them at 9999 and drops anything else; §5). A client that reloads or reconnects mid-game takes the table's count from the pubs it is handed (its own stored copy in `joined.myPub` first) until the next `turn`; srv-2.6.44's pub whitelist dropped both, so against it a reload counts from 1 as before. Client-only otherwise: the free board's face rule, torpor on the free board, the felt's turn label, the Played tray and the other seats' cards (no wire change); before: cli-2.6.148, 13 Oct 2026: client-only, no wire change -- a spectator's client no longer sends `board` or `log` (the server always refused both; the refusal fed a loop), and the reference client's lobby offers Add bot in Structured rooms only; cli-2.6.147: client-only -- the dock pin became an icon with a tooltip; before: cli-2.6.146 / srv-2.6.44, 13 Oct 2026: ONE new optional field, `tableSetup` -- the room option 'Suggested table setup' for Classic rooms: `create` may set it, the server stores it and `joined` / `started` / `took` carry it when set (§3, §8); nothing else on the wire changes, and a peer that ignores the field behaves as before. Also srv-2.6.44: loadMatch's `took` carries `boardMode`, which it never did; before: cli-2.6.145, 12 Oct 2026: client-only, no wire change -- one zone rule for single and group moves; cli-2.6.144: one face rule for single and group drags into ready; cli-2.6.143: client-only, no wire change -- the reference client's lobby button now sends `roll` with `sides: 20`, a field the server has always taken; before: cli-2.6.142, 12 Oct 2026: client-only, no wire change -- §12.1 states the hold rule the reference bot (v0.6.198) and the reference client follow: a human's `Hold on…` stops every wait a bot runs on a human, a release from ANY human frees the whole table, a `chat` line holds and releases too, a bot's own `Hold on…` holds nothing; §8 `botcfg` points there. cli-2.6.141, 11 Oct 2026: client-only, no wire change -- the bot project's re-issued guide embedded; v2.6.140's code verified with bot v0.6.197. cli-2.6.140, 11 Oct 2026: client-only, no wire change -- §8 `botcfg` now states what the reference bot does with each tempo (v0.6.195-197). cli-2.6.139 + srv-2.6.43, 9 Oct 2026: `botcfg` -- the table's bot tempo (the bot project's spec-bot-tempo-2026-09-27), c2s and s2c (§7, §8), stored on the room and replayed right after `joined` (§3); the knowledge layer's two JSON statics (§6.3); the room snapshot keeps board style, referee password, match length, the populated flag, the tempo and each seat's bot flag. cli-2.6.138 + srv-2.6.42, 24 Sep 2026: Rescue from torpor splits into a directed and an undirected line; the server clears the shared resolver state (`tally` mode null, broadcast) before every `turn` broadcast. cli-2.6.137, 24 Sep 2026: client-only, no wire change -- nothing in the resolver outlives its action or its turn: the actor's client sends `tally` mode null when its action resolves, every client clears on a turn change and the new turn's client sends it; a new action resolves a finished combat first; the Actions menu gains 'Undirected card action' (`NAME takes an undirected action.`) and the actor writes stealth 1 onto an untouched Block counter opened against its undirected action. cli-2.6.136, 23 Sep 2026: client-only, no wire change -- the taken line and the resolve total leave out a round's every-round damage when a combat-ends strike ended the first pair, and count a first-pair dodge whatever order the strikes arrived in. cli-2.6.135 + srv-2.6.41, 23 Sep 2026: four more combat tally fields -- `ga`/`gb` aggravated damage this round, `ea`/`eb` environmental damage every round; §12 gains the aggravated and every-round lines and the taken line's ' and is burned'. cli-2.6.134, 23 Sep 2026: client-only, no wire change -- the combat lines carry the EFFECT only, one line per choice, amounts from a number menu; three new shapes in §12. cli-2.6.133 + srv-2.6.40, 23 Sep 2026: a combat round change zeroes an ABSENT `a`/`b` too -- they are per-round damage since v2.6.129; a write that carries them wins. cli-2.6.132, 23 Sep 2026: client-only, no wire change -- a menu-started combat shows its panel, the tutorial's Combat step rewritten, a bare number in Weapon or card explains itself. cli-2.6.131, 23 Sep 2026: client-only, no wire change -- with the combat helper OFF, the vampire's Combat menu offers `Damage taken…`, which writes the same frozen taken line by hand. cli-2.6.130, 23 Sep 2026: client-only, no wire change -- a round change straight out of Strike / Damage now counts as passing Damage for the automatic taken line; spectators cannot step. cli-2.6.129 + srv-2.6.39, 23 Sep 2026: THE COMBAT STEPS CARRY STATE -- the combat `tally` gains the round's shared state (`rng` `rl` `nx` `pr` `sp` `ce` `sa` `sb` `xa` `xb` `pa` `pb`, absent = preserve, a changed `rd` starts a fresh round) and §12 gains the client's combat lines (the bot's existing strike / maneuver / press / taken shapes, now also emitted by the reference client, plus three new ones); backward compatible -- an older server drops the new fields and each client keeps its own. cli-2.6.128, 22 Sep 2026: client-only, the Help modal's Close bound to the right element (duplicate id). cli-2.6.127, 22 Sep 2026: client-only, no wire change -- Help… submenu with the START-HERE pages embedded in the client. cli-2.6.126, 22 Sep 2026: client-only, no wire change -- at a hotseat the bridge now carries card `ctrl` verbs to a local bot seat in the server's exact shape, and the client sends the bot-only `act:'burn'` from a Burn row on a bot's card menu, both modes; the server forwards any 16-char `act` unchanged. cli-2.6.125, 21 Sep 2026: client-only, no wire change -- the hotseat bridge relays a bot's `say{i:0}` to other bots like the server does; bot-file floor v0.6.147 enforced at load. cli-2.6.124, 21 Sep 2026: client-only, no wire change -- the quiet bot-file preload fires on intent, once. srv-2.6.38, 21 Sep 2026: no new verb or field -- `bounty` / `hostOust` pay the LIVE predator (ousted seats skipped, vacant ones not) and hand the turn on when the ousted seat held it; an ousted seat's late `pass` is ignored silently. cli-2.6.123, 21 Sep 2026: client-only, no wire change -- hotseat bridge review: host-oust sends bounty + roster before forceOust, gid cleaned like cleanId. cli-2.6.122, 21 Sep 2026: client-only, no wire change -- the hotseat bridge now mirrors `tally` (the srv-2.6.17 absent-field merge), `bounty` + `roster` on every `out` change, `openHand` and `give`/`given` for bot seats, so an offline bot sees what an online one sees. cli-2.6.121, 17 Sep 2026: client-only, CSS only, no wire change. cli-2.6.120, 17 Sep 2026: client-only, no wire change -- per-tier say-bubble time and text recipe settings, local. cli-2.6.119, 17 Sep 2026: client-only, no wire change -- Enter yields to a focused control. cli-2.6.118, 17 Sep 2026: client-only, no wire change -- keyboard/UI round (chat focus key, phase cycle key, rebindable view keys, hotseat turnSeat during the bot sweep, Esc on the start screen). cli-2.6.117, 16 Sep 2026: client-only, no wire change -- the felt is cleared on `closed` and on a failed rejoin exactly as on `leave`. cli-2.6.116, 16 Sep 2026: client-only, no wire change -- `create` always carries tournLock:true now; the key and its server semantics are unchanged. cli-2.6.115, 16 Sep 2026: client-only, no wire change -- removing a bot from the lobby now sends the EXISTING `leave` verb on the BOT's own socket instead of racing a `kick` against that socket's close; worth knowing generally: a bare socket close is a DISCONNECT (the server keeps the seat for the reconnect window, srv 1536) and `kick` refuses a seat inside that window (srv 1027), so a client that owns a peer's socket must make it leave, not close it. cli-2.6.114, 15 Sep 2026: the three §12.0 tiers are pinned as mutually exclusive in the renderer; no wire change. cli-2.6.113, 15 Sep 2026: a local chat-bubble view filter, no wire change. cli-2.6.112, 15 Sep 2026: a helper key ABSENT from a locked policy falls through to the local setting -- the server rebuilds `settings` from its own HELPER_KEYS, so a helper newer than the running server is absent, not off. cli-2.6.111, 15 Sep 2026: the s2c `helperPolicy` broadcast carries its payload as `policy`, not `helperPolicy` -- the client reads both. cli-2.6.110, 15 Sep 2026: the debug gate read conv.tournament as a flat veto -- the player's stored preference, not the table's mode. When the dropdown is present it is the authority. cli-2.6.109, 15 Sep 2026: client-only review fixes to the bot panel, no contract change. cli-2.6.108, 15 Sep 2026, THE BOT PANEL — no wire change: the countdown widget and the debug toggle are in-process (bots live in the host's tab) and a spawn option respectively. §12 gains two settlements from the bot project's 15 Sep handover — the two block shapes are both parsed and neither is canonical, and the undirected announce family is bot-emitted only. cli-2.6.107 + srv-2.6.37, 14 Sep 2026, THREE VOICES — restart: no new verbs, but `HELPER_KEYS` gains `chatFx` (the server builds every host-locked policy from that list alone, so a key it does not know is silently dropped) and new §12.0 writes down what the three log/chat/say channels MEAN, now that they finally look different on screen. cli-2.6.106, 14 Sep 2026, THE CONTRACT ROUND — no wire change: §12 now freezes the CLIENT-emitted minion action lines (blocks / hunts / rescue / diablerie / card action / political action / cast votes), which the bot's grammar table had carried as unverified since THE SPLIT, and new §12.1 freezes the `say{i}` index table, which grew by two APPENDED entries (8 `Any blocks?`, 9 `Any reaction?`). cli-2.6.105 + srv-2.6.36, 14 Sep 2026, CLOSE TABLE — WIRE CHANGE, restart: new c2s `closeRoom` (host/referee) and new s2c `closed{msg}`; the server also raises `closed` on its own when a real leave takes the last non-bot player, and the reaper gives a bot-holding room with no human online a 10-minute grace instead of the 60-minute all-offline rule. Additive — an older client simply never sends or receives them. cli-2.6.104, 14 Sep 2026: client-only, no wire change — the host's helper-policy restore rides BEFORE the `leave` verb, since `leave` drops the connection from the room and every REF_VERB after it is refused. cli-2.6.103, 14 Sep 2026: client-only, no wire change — `setHelperPolicy` from the bot lock now carries the 'all' shape (allowLocal:false) it always meant; the board's wheel/pan exclusion rule is one shared constant. cli-2.6.102, 13 Sep 2026: client-only, no wire change — note that the lobby snapshot's `seats` is room.players.length, the seat-picker range, NOT the table capacity (MAX_PLAYERS). cli-2.6.101, 13 Sep 2026: client-only, no wire change — the online release is the EXISTING say verb. cli-2.6.100, 13 Sep 2026: client-only, no wire change. cli-2.6.99, 13 Sep 2026: client-only, no wire change — an online bot uses the EXISTING join/seat/kick verbs over its own socket, so the server sees an ordinary player that happens to send `bot:true`. cli-2.6.98, 12 Sep 2026: client-only, no wire change — board pubs now travel between local seats over the hotseat bridge, mirroring the server's own broadcast and joiner-seeding. cli-2.6.97, 12 Sep 2026: client-only, no wire change — the hotseat bridge now carries the existing forceSetPool / forceOust verbs to local bot seats. cli-2.6.96 / cli-2.6.95, 12 Sep 2026: client-only, no WIRE change — the hotseat bridge now fans messages between local seats, which is a local topology change, not a protocol one. cli-2.6.94, 12 Sep 2026: client-only, no wire change. cli-2.6.93, 12 Sep 2026: client-only, no wire change. cli-2.6.92, 12 Sep 2026: client-only, no wire change. cli-2.6.91, 11 Sep 2026: client-only, no wire change. cli-2.6.90, 11 Sep 2026: client-only. cli-2.6.89, 11 Sep 2026: CSS only. cli-2.6.88, 11 Sep 2026: client-only. cli-2.6.87, 11 Sep 2026: client-only. cli-2.6.86, 11 Sep 2026: client-only. cli-2.6.85, 11 Sep 2026: CSS only. cli-2.6.84, 11 Sep 2026: CSS only. srv-2.6.35 + cli-2.6.83, 11 Sep 2026: PER-ROOM REFEREE — create/join `refPass`, joined `ref`, lobby/roster watcher `ref`, roomList rooms[].ref; the server-level flag of srv-2.6.34 removed before it was ever deployed. cli-2.6.82, 11 Sep 2026: client-only, no wire change. cli-2.6.81, 11 Sep 2026: CSS only. srv-2.6.34 + cli-2.6.80, 11 Sep 2026: CREATE GAME / JOIN GAME + REFEREE — additive `ref` on roomList; --referee-pass alias; the `admin` wire key is unchanged. cli-2.6.79, 11 Sep 2026: THE LOBBY IS A LOBBY, client-only, no wire change. srv-2.6.33 + cli-2.6.78, 10 Sep 2026: ROOM LIST CARRIES THE TABLE SHAPE -- additive `board` + `helpers` on every roomList entry; the client tags Full tables and Lite sorts Lite-shaped tables first. cli-2.6.77, 10 Sep 2026: THE ? EXPLAINER, client-only, no wire change. cli-2.6.76, 9 Sep 2026: CACHE-FIRST CATALOG, client-only, no wire change. cli-2.6.75, 9 Sep 2026: TUTORIAL = FULL, client-only, no wire change. cli-2.6.74, 9 Sep 2026: LITE MODE — client-only, no wire change; §9 gains the `mode=` prefill parameter. 9 Sep 2026: HISTORY EXTRACTION — comment/header-only, no wire change; the header's full release chain since v2.5.x moved verbatim to elysium-history-2026-09-09.md (archive), and from here on each release adds ONE line to elysium-CHANGELOG.md instead of growing this header. Latest substantive entries, kept for orientation: (cli-2.6.72, 9 Sep 2026: PURE CLIENT — the offline Start readiness gate and a bot at seat 1 (first-human activation, range-based bot sweep, the opening sweep); no wire change — this line moves because check-versions gates the header. — and before that the merge (v2.6.71 / srv-2.6.31, 9 Sep) and the two lineages it joined; see the changelog/archive.) and is guarded by
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
| `create` | `room`, `pass`, `name`, `lobby`, `minutes`, `react`, `l3shape`, `boardMode`, `tableSetup`, `tableLayout`, `chat`, `specChat`, `helperPolicy`, `tournLock`, `srvPass`, `anon`, `bot` — *(`tableView` deprecated cli-2.6.43: client no longer sends it, server still accepts for back-compat; `l3shape` always null, same vestigial class)*, `refPass` | srv-2.6.35: `refPass` (≤40 chars) sets the room's referee password (stored hashed); empty/absent = no referee at this table.
| `hello` | `srvPass`, `admin` | v2.5.68 (L1+L2): the browse/credential handshake — unlocks the server door, optionally grants per-connection admin, registers for live `roomList` pushes, answers with the current list. Sendable before any seat. | Create a room (caps: **50 rooms**, **6 players**; loopback-exempt create cap). The creator becomes host; the room's `hostToken` is minted SERVER-side from the creator's session token (never client-sent), and the `join` verb's `token` is what lets a restarted host reclaim the room. Replies `joined`. |
| `join` | `room`, `pass`, `name`, `spect`, `token`, `bot`, `refPass` | Join by room+password (or spectate with `spect`, or resume with `token`). Failed passwords are throttled — see §4. Replies `joined` (or `err`). | srv-2.6.35: `refPass` joins as the room's REFEREE — always a spectator (`spect` is implied), with every host-gated verb scoped to that room (start, hostSetPool, hostOust, hostUnoust, setHelperPolicy, hostPass, hostSetClock, kick, demote, promote, mute, saveMatch, listSaves, delSave, loadMatch); a wrong key errs 'Wrong referee password.' with the room-password strike, a room without one errs 'This room has no referee password.'.

`chat` and `leave` are additionally honoured pre-seat (lobby chat; abandoning the lobby) — they also
appear in the seated table below.

**srv-2.6.44 / cli-2.6.146 — the room option `tableSetup` ("Suggested table setup"):** `create` may carry `tableSetup: true`. The server keeps it only for a Classic room (`boardMode: 'classic'`) and only for a strict `true`; it then sends `tableSetup: true` in `joined` (players and spectators), `started` and `took`, and its room snapshot round-trips it. A room without the option never mentions the field. **The server does nothing else with it** — the Classic deal is unchanged (`dealt.unc` stays empty). What the option MEANS is the clients' business: the reference client starts each seat's pool globe at a seat spot (seats in turn order, clockwise from the top left: the top row left to right, the lower row right to left; `l4SeatSpot` in the client, formula in `docs/handoffs/REPLY-to-bot-2026-10-13-table-setup.md`) and, at each `dealt`, draws its first four crypt cards with four ordinary `drawCrypt` verbs and lays them face down beside its globe. To the server and to every other peer that is indistinguishable from a player setting up by hand, so a client that ignores the field (cli ≤ 2.6.145, the reference bot ≤ v0.6.198) loses nothing — it sets up as before. The reference client skips the setup at a table with a seated bot (roster `bot` flag) until the bot follows the same seat spots. A replacement server: store one boolean per room and echo it; that is the whole contract.

**srv-2.6.46 / cli-2.6.153 — the room option `tableLayout` ("Table layout"):** `create` may carry `tableLayout: 'large'`. The server keeps it only for a Classic room and only for exactly that string (anything else is the standard layout, `null` on the room); it then sends `tableLayout: 'large'` in `joined` (players and spectators), `started` and both `took`s, and its room snapshot round-trips it, re-validated. A room without it never mentions the field. **The server does nothing else with it.** What it MEANS is the clients': the reference client draws every card on the free board a fifth larger (0.6 of a card instead of 0.5 at the board's scale) and puts its suggested lower seat row at the bottom edge (cards to canonical y 508 instead of 404) and the top row 8 px lower -- the same on every screen at the table, which is why it is the room's and not each player's. A client that ignores the field (cli ≤ 2.6.152) draws the standard size beside the others: positions agree, sizes do not. Independent of `tableSetup`. A replacement server: store one string per room and echo it.

**srv-2.6.43 — the late-joiner replay of the bot tempo:** when the room has a stored tempo, `joined` is followed at once by a `botcfg` (§8) — before `lobby` in an unstarted room, before the boards in a started one — so a bot seated in the lobby or mid-game, and every human client, learns the table's tempo without asking. Spectators get no replay (they never set it).

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
  server stamps seat+who and relays. The server's `sanitizePub` is a whitelist: a field it does not
  name never reaches anyone. Since srv-2.6.45 it keeps `tn` / `rn` (the Turn and Round count the
  sending client holds, positive integers ≤ 9999) -- the reference client (cli-2.6.149) takes the
  highest count from the pubs it receives right after joining a running game, until the next `turn`. The server never simulates game rules — **Elysium is a sandbox**
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

### 6.1 Reference-server CLI (MAY — v2.5.68)
`node elysium-server.js [port] [clientfile] [--server-pass P] [--referee-pass P | --admin-pass P] [--create-policy anyone|admin] [--trust-proxy]`. All optional; with none, behaviour is identical to every earlier 2.5 server. The reference server also serves an OPTIONAL `images/` directory beside the client file at `GET /images/<file>` (filename strictly `[a-z0-9-]+.(webp|jpe?g|svg)` — traversal unrepresentable; 404 when absent): a local image tier the client's Settings can prefer before its browser cache/KRCG. Pure HTTP, no WS impact; a server without it degrades gracefully (the client falls through on 404). `--trust-proxy` is for cloudflared/Caddy on the SAME machine: forwarding headers are believed only from a loopback transport peer, restoring per-IP throttles/caps behind a named tunnel.

### 6.2 Reference-server error intake (MAY — srv-2.6.25; B-63 dump srv-2.6.29)
`POST /client-error` — the client's crash/report telemetry (B-54) lands here as JSON. Pure HTTP, zero WS impact; a server without it degrades gracefully (the client fires-and-forgets via `sendBeacon`/`fetch` keepalive and never reads the answer). Reference implementation: body hard-capped at 64 kB (B-63; 32 kB before srv-2.6.29; oversize → socket destroyed, no response), rate-limited per **derived** IP (10 posts / 10 min — behind a tunnel every raw socket is loopback, so the limiter keys on `deriveIp`), field-whitelisted and control-char-scrubbed through the pure `errRecord()`, appended as one JSONL row to `DATA_DIR/elysium-errors.log` (1 MB → `.1` rotation, 4 MB total disk guard), and answered `204 No Content` in every visible case — accepted, limited and malformed alike, so the endpoint gives probes nothing to measure. No IP address is ever written to the log. **B-63 (srv-2.6.29):** a `kind:'report'` payload MAY carry `dump:{game,env}` — the reporting client's full player-visible snapshot — plus the ladder flags `dumpTrunc`/`dumpErr`; the server whitelists it level by level through the pure `dumpRecord()` (board ≤600 field-picked entries, hand ≤120, seats ≤8, deck census ≤30, everything scrubbed and dInt-coerced, unknown keys dropped at every depth; `env.settings` — srv-2.6.30 — is the one SHAPE-whitelisted member: the client's preference surface is client-defined and grows, so the contract is key pattern `/^[A-Za-z0-9_]{1,24}$/` + value types boolean/finite-number/short-string + a 48-entry cap rather than a name list). The `ring` accepts BOTH element shapes: `{t,m}` objects (v2.6.60+ clients — `t` kept as a full ms epoch) and bare strings (older clients), capped at the last 200 (`ERR_RING_MAX`). The privacy rule that an opponent's face-down card arrives as a nameless position stub is enforced CLIENT-side at capture; the server never invents an `n` field but cannot verify a modified client's honesty (manifest §S6). The companion pull route `GET /client-errors.txt?key=<admin-pass>` (v2.6.25 amend) serves the concatenated `.1`+`.log` as plain text (`&dl=1` for an attachment) — gated on the existing `--admin-pass` credential via the same timing-safe compare as `hello`, throttled per derived IP, 404-uniform on every failure, and absent entirely when no admin pass is configured. Its sibling `GET /admin/maintenance?key=<admin-pass>` (srv-2.6.26) controls the graceful-drain window: `&on=1&hours=H&msg=...` arms it (persisted to `DATA_DIR/maintenance.json`, survives restart, auto-expires), `&off=1` clears, no action returns status JSON; re-arming re-broadcasts the notice -- the manual reminder button. Same auth family, same throttle map.

### 6.3 Reference-server bot statics (MAY — srv-2.6.28; srv-2.6.43)
`GET /elysium-bot.js` and `GET /elysium-cardfx.json` — the two files a hosted client's hotseat-bot loader fetches from its serving host (HB2c). **srv-2.6.43:** plus `GET /elysium-twd-profile.json` and `GET /elysium-twd-archetypes.json`, the bot's knowledge layer (bot v0.6.187 / v0.6.192): the client fetches both beside the cardfx database and hands them to every browser bot as `twdProfile` / `twdArchetypes`; absent, the bots read no decks (never an error). Same rules for all four files: exact `req.url` match, same headers, same purge on deploy. Reference implementation: **exact** `req.url` match (no pattern, nothing decoded — a near-name miss such as `/elysium-bot.js.bak` and an encoded traversal shape such as `/elysium-bot.js%2F..%2Fx` both 404), served with `application/javascript` / `application/json`, `X-Content-Type-Options: nosniff`, and a 300 s cache header (the deploy ritual purges both URLs alongside the client). The sibling `elysium-cardfx.js` (the file:// loader's script-tag form of the same data, cardfx-compile v1.6.13) belongs to the offline download bundle, not to the hosted route.

## 7. Client → server verbs (54 seated + 3 pre-seat) — the seated `GAME_HANDLERS` table

Machine-readable index (guarded by the lint — keep sorted):

<!-- protocol-lint:c2s -->`board` `botcfg` `bounty` `browse` `chat` `closeRoom` `ctrl` `decide` `deck` `delSave` `demote` `draw` `drawCrypt` `edgePass` `edgeTake` `fx` `give` `handEscrow` `hostOust` `hostPass` `hostSetClock` `hostSetPool` `hostUnoust` `kick` `leave` `ledgerGet` `listSaves` `loadMatch` `log` `logTo` `mute` `openHand` `pass` `pileBulk` `pileReturn` `pileTake` `pileTop` `promote` `recall` `recalled` `redeal` `reveal` `revealHand` `roll` `saveMatch` `say` `seat` `setHelperPolicy` `shufPile` `start` `tally` `tool` `unoust` `vp`<!-- /protocol-lint:c2s -->

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
| `pass` | — | `turn` |  | End your turn. SERVER advances `room.turnSeat` to the next live seat and broadcasts `turn` (turn order is server-authoritative). v2.5.64: guarded — errs unless the sender's seat IS `room.turnSeat` (previously any seat could fire it); `hostPass` is the referee override. srv-2.6.38: a pass from a seat that is `out` and does not hold the turn is ignored SILENTLY (its oust already moved the turn; bots still pass by themselves afterwards). |
| `roll` | `sides` | `roll` |  | Dice roll (`sides`); server rolls and broadcasts `roll` so nobody rolls client-side. |
| `vp` | `d` | `ledgerLive` |  | Adjust your victory points by `d` (clamped 0–10 in 0.5 steps server-side). Errs after start when the room's `tournLock` is on (scoring is via ousts/host). v2.5.66: a started-game self-adjust streams its attributed ledger row to everyone else. |
| `unoust` | — | — |  | Un-oust yourself (mirrors hostUnoust for self). Errs after start under `tournLock` (host-only then). |
| `ledgerGet` | — | `ledger` |  | Request the server-authored resource history (any seated player — every row is already-broadcast public state). Reply goes to the requester only: the latest 300 rows + the total count. |
| `bounty` | — | `bounty` |  | Report your own oust. SERVER marks you out, routes +6 pool to the LIVE predator's client and sets its +1 VP (srv-2.6.38: the ring predecessor, skipping seats already `out`; a vacant seat still counts), broadcasts `roster`, then -- if you held the turn -- advances it to the next live seat and broadcasts `turn` (srv-2.6.38; this row promised it before the server did it). |
| `say` | `i` | `say` |  | Quick phrase by index `i`; broadcast `say`. |
| `decide` | — | `decide` |  | Open a reaction window; server stamps who + the room's `reactSecs` and broadcasts `decide`. |
| `tally` | `mode`, `a`, `b`, `ph`, `rd`, `res`, `duelCid`, `duelName`; combat only (srv-2.6.39): `rng`, `rl`, `nx`, `pr`, `sp`, `ce`, `sa`, `sb`, `xa`, `xb`, `pa`, `pb`; (srv-2.6.41) `ga`, `gb`, `ea`, `eb` | `tally` | started‑gate | Shared resolver counters (Block / Vote / Combat / Free): absolute values, clamped 0–99 (`ph` = combat phase 0–6), last write wins, ANY seat may adjust; **srv-2.6.39 (combat only):** the round's shared state — `rng` `'close'|'long'` (default close each round), `rl` 0/1 (range SET for this round, maneuvers can no longer change it), `nx` `''|'close'|'long'` (a range set for NEXT round), `pr` `null|'continue'|'end'`, `sp` strike pair 1–9, `ce` 0/1 (a combat-ends strike ended it), `sa`/`sb` the acting / opposing side's strike label (40 chars, no `<>`), `xa`/`xb` additional strikes 0–9, `pa`/`pb` damage prevented 0–99; **srv-2.6.41:** `ga`/`gb` aggravated damage dealt by the acting / opposing side this round 0–99, `ea`/`eb` environmental damage the side inflicts EVERY round 0–99 (Carrion Crows-class — a new round KEEPS it, a mode change clears it); `a`/`b` are that round's (normal) damage dealt by the acting / opposing side. Same absent-preserve rule as below, plus: a CHANGED `rd` resets every absent per-round field to its default — **srv-2.6.40: including `a`/`b`** (0), (`nx`, if set, carries into `rng` with `rl` 1). Validated field by field (`tallyCombat`; the client's `tallyCombatMerge` and the hotseat bridge run the same rule — a suite test compares them on random writes); `mode:null` (or unknown) clears. **v2.6.17:** an ABSENT `a`/`b`/`ph`/`rd` PRESERVES the room's current value while `mode` is unchanged (a mode change starts fresh) — field-owning writers (the bots) send only their own side, so concurrent writes can no longer clobber each other's counters (the v2.6.14 duel-map principle applied to the counters themselves); the human client keeps sending the whole state, unchanged behaviour. `'free'` accepted as a mode (shipped client-side in v2.6.37; the validator was nulling it until v2.6.17). `res` is a transient resolve flag — relayed, never stored. Stored on `room.tally` — late joiners get a `tally` in the join reply — and cleared on `start`. Broadcast echoes to the sender. |
| `botcfg` | `tempo`, `waitSecs` | `botcfg` | seated human | srv-2.6.43 (the bot project's spec-bot-tempo-2026-09-27) — the table's BOT TEMPO: `tempo` one of `'standard'` / `'adaptive'` / `'turn'`, `waitSecs` a number 1.0–8.0 (clamped, tenths of a second). Any seated HUMAN may set it, in the lobby or the game; a seat that joined with `bot:true` is ignored; spectators and referees never reach this verb (not a referee verb). A PARTIAL write keeps the absent field (the v2.6.17 rule — two humans changing different settings at once cannot undo each other); a table with none yet merges onto Standard / 3 s; a write with nothing valid stores and sends nothing. Stored on `room.botcfg` with the setter's name, broadcast WHOLE to everyone incl. the sender (an idempotent echo), replayed to a late joiner right after `joined` (§3), kept in the room snapshot. The change's log line — `NAME set bot tempo: Adaptive, 3 s.` / `NAME set bot tempo: Turn-based.` — is the sender client's own (a plain `log`, not a §12 line: no bot parses it); the server says nothing itself. The reference client seeds Standard / 3 s once a table has bots (the host, quietly, with no line). |
| `fx` | `actor`, `card`, `kind`, `onto`, `reveal`, `target`, `toName`, `verb` | `fx` | started‑gate | Card-event animation relay (play/flip/rise clones): sanitised card/target/actor info, broadcast `fx` to everyone else. |
| `log` | `html` | `log` |  | Append a public log line to the table log; server stamps `who` and broadcasts `log`. |
| `logTo` | `html`, `toSeat` | `logTo` | started‑gate | Route a private log note (`html`, sanitised) to seat `toSeat`; the recipient gets `logTo` stamped with `from`. |
| `tool` | `kind`, `n` | `tool`, `turn` |  | Shared table tools (timer / turn-order draw): `kind`,`n`; server may broadcast `tool` and/or `turn`. v2.5.64: `kind:'seating'` is lobby-only (errs after start — it reshuffles seats and zeroes everyone's vp/out). |

### Deck & the server-held piles

| verb | fields read | emits | gates | semantics |
|---|---|---|---|---|
| `deck` | `crypt`, `library`, `name` | `deckok` | started‑gate | Upload your deck: `library`/`crypt` name arrays (sanitised, capped) + `name`. Server SHUFFLES and stores the hidden piles; replies `deckok`, broadcasts `pileN`. Errs after start under `tournLock` (no mid-match deck swaps). |
| `redeal` | — | — | started‑gate | Reshuffle-and-redeal your own piles pre-start. Errs under `tournLock` once started. |
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
| `board` | `pub`, `undo` | `board`, `ledgerLive` |  | Push your public board blob (`pub`, from buildPub); server broadcasts `board` (seat+who stamped) to everyone else. THE core sync verb. v2.5.66: on started-game pushes the resource-ledger diff rows also stream to everyone else as `ledgerLive`. v2.5.67: optional `undo:true` (sent by the client's snapshot-undo) prefixes that batch's rows '↩ undo: ' — client-claimed narrative aid, the deltas are true either way. |
| `handEscrow` | `blob` | — |  | Store your encrypted hand `blob`. Opaque to the server (client-side AEAD; key derived from the room's `escrowSalt`); returned on rejoin/promote. |
| `revealHand` | `cards`, `pub`, `to` | `log`, `revealHand` | started‑gate | One-shot hand reveal to seat `to` (or all); routed privately, logged. |
| `openHand` | `cards`, `revoke`, `to` | `openHandGrant`, `openHandRevoke` | started‑gate | Standing open-hand grant (or `revoke`) to seat `to`; server routes `openHandGrant`/`openHandRevoke`. |

### Cross-board card lifecycle

| verb | fields read | emits | gates | semantics |
|---|---|---|---|---|
| `give` | `attachTo`, `card`, `gid`, `rx`, `ry`, `seat` | `gave`, `given` |  | Move a card object to seat `seat`'s board (drop fraction `rx`/`ry`, optional `attachTo`). Whitelisted fields incl. giver-assigned `gid`; server auto-stamps `owner`. Emits `given` to the holder, `gave` back. |
| `recall` | `cid`, `seat` | `recall` |  | OWNER asks holder `seat` to remove card `cid` (take-back / burn / undo-of-give). Pure routing; forwards `recall` to the holder. |
| `recalled` | `cid`, `kind`, `name`, `ok`, `seat` | `recalled` |  | HOLDER confirms/denies a recall (`ok`, card info); routed back to the owner. |
| `ctrl` | `act`, `cid`, `seat` | `ctrl` |  | OWNER adjusts a controlled card in place on the holder's board (`act`: blood/blue/green ±1, lock/unlock, flip, torpor/untorpor; plus `burn` -- remove from game, attachments dropped -- which the reference client sends only to a self-declared bot seat, cli-2.6.126); routed to the holder, no server-side ownership check (the reference client's holder-side validates `owner===from` — v0.4.4, 13 July: EXCEPT for a seat that self-declared `bot:true` at create/join, whose own headless `ctrl` handler applies any sender's `act` — the bot-elements exception, since a headless bot can't model every triggered ability). |

### The Edge

| verb | fields read | emits | gates | semantics |
|---|---|---|---|---|
| `edgePass` | `fromName`, `pos`, `toSeat` | `edgePass` | started‑gate | Hand The Edge to `toSeat` with a drop `pos`; server validates and broadcasts `edgePass`. |
| `edgeTake` | `clearOnly` | `edgeTake` | started‑gate | Take The Edge (or `clearOnly` to just clear); broadcast `edgeTake`. |

### Host controls

| verb | fields read | emits | gates | semantics |
|---|---|---|---|---|
| `hostSetPool` | `seat`, `val` | `forceSetPool` | host | HOST sets seat's pool to `val` (routed `forceSetPool`). |
| `hostOust` | `seat` | `bounty`, `forceOust` | host | HOST forcibly ousts a seat (bounty flow included: live predator, and the turn is handed on if that seat held it -- srv-2.6.38). |
| `hostUnoust` | `seat` | — | host | HOST reverses an oust. |
| `setHelperPolicy` | `policy` | `helperPolicy` | host | HOST sets the table's helper policy; broadcast `helperPolicy`. |
| `hostPass` | `seat` | `turn` | host started‑gate | HOST advances the turn PAST seat `seat` (must be the current `turnSeat`) — the referee "play on" for a stuck/AFK player; nobody is removed. Broadcasts `turn` + a sys line. |
| `hostSetClock` | `plusMins` | `clock`, `timeup` | host started‑gate | HOST adjusts the match clock by `plusMins` (±, clamped; remaining capped at 10 h; no clock yet ⇒ starts one from now). Result ≤ 0 calls time (`clock` with null + `timeup`); otherwise broadcasts `clock` with the new `matchEnd`. |
| `kick` | `name`, `seat` | — | host started‑gate | HOST removes a player/spectator (by seat or name). |
| `closeRoom` | — | `closed` | host/referee | srv-2.6.36 — HOST (or this room's referee) ENDS the table: `closed{msg}` is broadcast to every player and spectator, the room is deleted from the list, then every socket is closed. Idempotent against a race. The server also raises it by itself in two bot cases: a real `leave` that takes the last non-bot player, and the reaper's 10-minute grace for a room holding bots with no human online. |
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

## 8. Server → client messages (49) — the client's `MP_HANDLERS` table

<!-- protocol-lint:s2c -->`board` `botcfg` `bounty` `chat` `clock` `closed` `ctrl` `dealt` `decide` `deckok` `demoted` `drew` `edgePass` `edgeTake` `err` `forceOust` `forceSetPool` `fx` `gave` `given` `helperPolicy` `joined` `ledger` `ledgerLive` `lobby` `log` `logTo` `matchSaved` `muted` `openHandGrant` `openHandRevoke` `pileList` `pileN` `recall` `recalled` `revealHand` `revealed` `roll` `roomList` `roster` `saveList` `say` `started` `sys` `tally` `timeup` `took` `tool` `turn`<!-- /protocol-lint:s2c -->

> **Client-side sanitisation contract.** Fields that carry HTML fragments — today only `logTo.html` — are
> UNTRUSTED input to every client: a client MUST sanitise them at render time. The reference whitelist is
> `<b>`, `<i>` and the log card-link form `<b class="clog" data-cid="…">` (see `sanRemote()` in the reference
> client). From server v2.5.38 the reference server also pre-sanitises the field with the same whitelist
> (`sanHtml()`, defence-in-depth) — but a client MUST NOT rely on any server having done so.

### Session & roster

| message | fields | semantics |
|---|---|---|
| `joined` | `boardMode`, `chat`, `crypt`, `escrowSalt`, `handBlob`, `helperPolicy`, `l3shape`, `lib`, `lobby`, `matchEnd`, `myPub`, `players`, `reactSecs`, `room`, `seat`, `specChat`, `spect`, `srv`, `tableLayout`, `tableSetup`, `tableView`, `token`, `tournLock`, `turn`, `watchers`, `you`, `ref` | Session established (you). Carries your seat/room/`token` (rejoin key), roster `players`, room config (boardMode, tableView, l3shape, reactSecs, chat flags, helperPolicy), match state (`lobby`, `turn`, `matchEnd`), your restored `myPub`/`handBlob`+`escrowSalt`, pile counts `lib`/`crypt`, `watchers`, server version `srv`. | srv-2.6.35: `ref:true` when the joiner is the room's referee (a spectator with host powers). srv-2.6.44: `tableSetup:true` when the room has the option (§3); absent otherwise.
| `lobby` | `players`, `watchers`, (watchers[].ref) | Roster refresh while un-started (players + watcher count). Each `players[]` entry (v0.4.4, 13 July): `bot` (optional, true only for a seat that self-declared `bot:true` at create/join — the bot-elements exception). | srv-2.6.35: each `watchers[]` entry carries `ref:true` for the room's referee.
| `took` | `boardMode`, `crypt`, `deckName`, `escrowSalt`, `handBlob`, `l3shape`, `lib`, `loaded`, `matchEnd`, `pub`, `reactSecs`, `seat`, `tableLayout`, `tableSetup`, `tableView`, `token`, `turn` | You took/were given a seat (promote, loadMatch, seat pick): full per-seat restore payload (pub, handBlob, escrowSalt, piles, turn, room config, `token`). srv-2.6.44: BOTH senders carry `boardMode` and (when set) `tableSetup` -- loadMatch's never carried `boardMode`. cli-2.6.146: an absent `boardMode` / `tableSetup` keeps what `joined` said (the handler used to default an absent `boardMode` to `structured`). |
| `demoted` | — | You were moved to spectator. |
| `started` | `boardMode`, `l3shape`, `matchEnd`, `players`, `tableLayout`, `tableSetup`, `tableView`, `tournLock`, `turn` | Match started: roster, turn, room view locks, matchEnd, the room's tournament-lock flag and (srv-2.6.44, when set) `tableSetup`, (srv-2.6.46, when 'large') `tableLayout`. |
| `roster` | `players`, `watcherList`, `watchers`, (watcherList[].ref) | Seated-game roster refresh (players, watchers, watcherList). Same per-player `bot` field as `lobby`. | srv-2.6.35: `watcherList[]` entries carry `ref:true` for the room's referee.
| `sys` | `msg` | System line (version-mismatch warning, notices). |
| `err` | `msg`, `cid` | Human-readable error line for your last request (`msg`). `cid` (v2.5.56, optional): recall bounces echo the failed card id so the client clears only that recall-guard entry - absent on all other errors and on pre-2.5.56 servers (the client falls back to the old wholesale clear). |

### Turn, table & voice

| message | fields | semantics |
|---|---|---|
| `turn` | `seat`, `who` | Turn passed: active `seat`/`who`. Server-authoritative. **srv-2.6.42:** every path that moves the turn (pass, oust, start) first clears the shared resolver state — `room.tally = null` and a `tally` broadcast with `mode: null` — so no Block / Vote / Combat counter outlives a turn. |
| `roll` | `n`, `sides`, `who` | Dice result broadcast (`who`, `sides`, `n`). |
| `say` | `i`, `seat`, `who` | Quick phrase (`i`) from `who`/`seat`. |
| `decide` | `secs`, `who` | Reaction window opened (`secs`, `who`) — run the shared countdown. |
| `tally` | `mode`, `a`, `b`, `ph`, `rd`, `res`, `duel`; combat only: `rng` `rl` `nx` `pr` `sp` `ce` `sa` `sb` `xa` `xb` `pa` `pb` `ga` `gb` `ea` `eb` | Shared resolver counters, whole state (`mode` null = cleared; `ph` = combat phase 0–6; the combat fields always ride a combat broadcast, never another mode's — srv-2.6.39). On `res` every client closes its own card-play batch and applies its own local clear/discard setting. A remote OPEN auto-pins the Played peek; the reference client renders the state and ignores the sender name riding the message. |
| `botcfg` | `tempo`, `waitSecs` | srv-2.6.43 — the table's bot tempo, WHOLE state: `{ t:'botcfg', who, tempo, waitSecs }` (`who` = the human who set it; on the join replay the stored setter). Sent to everyone on every change and to a late joiner right after `joined`. The reference client shows it in its Bot settings panel and writes no line (the sender did). A BOT applies it to every wait it makes on a HUMAN — block window, reaction question, pool question, vote poll, the combat steps. The reference bot (v0.6.195–197): *Standard* = every wait is `waitSecs`, a combat step that asks the human twice that, the silent damage step once — and not at all when no damage reaches the human's minion this round; *Adaptive* = 1.5 × the human's median answer time (their last 7 answers), at least 0.8 s, at most the Standard wait — and questions the human has no legal way to answer are skipped (the block question with no ready or every locked minion and an empty hand, a reaction or 'anything before…' with an empty hand, the damage step with an empty hand and no equipment; the strike and the press are always asked); *Turn-based* = no clock, a reminder after 2 minutes, the wait resolves as a Pass after 4. Every such wait is steppable through the bot's in-process `status()` / `step()` (rungs `resolve-ask`, `resolve-pq`, `resolve-phase`, `resolve-vote`). Bot-vs-bot handshakes keep their own short windows in every mode (the bot tells a human by `players[].bot`). A bot that does not read it (≤ v0.6.193), and any bot at a table with nothing stored, keeps the clocks it was started with — the reference client seeds Standard / 3 s. A human's `Hold on…` stops every such wait — Turn-based's reminder and give-up included — and a release starts each again from the beginning (reference bot v0.6.198; the rule is in §12.1). |
| `fx` | `actor`, `card`, `kind`, `onto`, `reveal`, `seat`, `target`, `toName`, `verb`, `who` | Remote card-event animation (play/flip/rise clone) with sanitised card/actor/target info. |
| `log` | `html`, `who` | Public log line from `who`. |
| `logTo` | `from`, `html` | Private log note routed to you from `from`. |
| `chat` | `msg`, `who` | Chat line (`who`,`msg`). |
| `muted` | `on` | Your chat was (un)muted (`on`). |
| `tool` | `kind`, `n`, `order`, `result`, `who` | Shared tool event (timer / turn-order result). |
| `timeup` | — | Match clock hit zero (bell). |
| `clock` | `matchEnd` | v2.5.64: the host adjusted (or called) the match clock via `hostSetClock` — re-sync the countdown to `matchEnd` (epoch ms), or hide it when null. |
| `closed` | `msg` | v2.6.105: the ROOM has ended and no longer exists — not a drop and not a kick. Tear down to the start screen and show `msg`. A client MUST NOT attempt to rejoin: set the session state to disconnected BEFORE the socket closes, or an auto-reconnect will chase a deleted room. Sent by `closeRoom` and by the server's own bot-room rules. |
| `ledger` | `rows`, `total` | v2.5.65: reply to `ledgerGet` — `rows` is the latest ≤300 entries `{t, seat, name, line}` of the server-authored resource history, `total` the full count held server-side. |
| `roomList` | `ok`, `door`, `admin`, `srv`, `rooms` | v2.5.68 (L2): reply to `hello` AND a debounced live push to hello'd, unseated connections whenever rooms change. `ok:false` + `door:true` = locked server, no rooms included. Each room: `{room, started, lobby, locked?, tournLock?, board, helpers, players, max, spect?, names}` — `names` omits `anon` players. | srv-2.6.33 adds `board` ('classic' \| 'structured') and `helpers` ('local' \| 'tournament' \| 'all', the create-time helper mode read back from the stored policy): the client tags tables that deviate from Lite conditions (Structured, or helpers 'all') in both modes, and in Lite lists Classic + non-'all' tables first. Old clients ignore both keys; old servers omit them and the client tags nothing. srv-2.6.35: each room carries `ref:true` when it has a referee password (the client shows ⚖). The srv-2.6.34 server-level `ref` flag was never deployed and is gone. The hello `admin` key remains the OPERATOR credential (`--referee-pass` / `--admin-pass`): it passes every host gate on every table and is what `--create-policy admin` checks; table referees are per room (join `refPass`).
| `ledgerLive` | `seat`, `name`, `rows` | v2.5.66: another seat's push just produced resource-ledger rows — `rows` is that batch (≤40 strings), `seat`/`name` the acting player. Sent to everyone except the pusher; render as real (archived) log lines, never relay back. v2.5.67: rows from an undo push arrive prefixed '↩ undo: '. |

### Deck & piles (private + public)

| message | fields | semantics |
|---|---|---|
| `deckok` | `deckName` | Your deck upload was accepted (`deckName`). |
| `dealt` | `deckName`, `hand`, `unc`, `lib`, `crypt` | Your private opening deal (hand + uncontrolled) after start/redeal. `lib`/`crypt` are the remaining pile counts — the server always sent them; since v2.6.55 the client prints them in the deal log line (B-53 layer 3: a partial deck exposes itself at the moment of the deal). |
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
| `ctrl` | `act`, `cid`, `from` | You are the HOLDER: apply `act` (blood/blue/green ±1, lock/unlock, flip, torpor/untorpor; a bot seat also accepts `burn`, bot ≥ v0.6.129) to card `cid` in place, then re-push your board. The reference client validates `owner===from` before applying; a bot seat's own handler (v0.4.4) does NOT — it trusts any sender, since it self-declared `bot:true` and opted into table-wide control of its elements. |

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
| `helperPolicy` | `policy` (also accepted: `helperPolicy`) | Table helper policy changed. **The payload field is `policy`** (srv 957) — `joined` stamps the same object as `helperPolicy` (srv 411), and the two names have disagreed since the policy shipped. The client reads `m.policy \|\| m.helperPolicy` so every deployed server works. Reading only the second nulled the policy on every confirmation, after which `hx()` fell through to each player's LOCAL `conv.tournament` — a table created as "All helpers on" silently ran with every helper off (found by Johan, v2.6.111). |

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

`mode=lite` | `mode=full` (client v2.6.74+) selects the client's interface mode before the dialog opens and persists it
like the start-screen pill (Lite = the Lackey-comparable online-only surface; Full = everything). In Lite a
`room=`/`server=` link lands on the Join half of the dialog; it still never connects on its own.

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

## 12. Frozen machine-readable log lines (the bot contract)

These exact strings ride the `log` relay and are parsed by automation (the Trainbot). **Wording, casing, punctuation and the em-dash are load-bearing** — changing any of them is a breaking change and requires a version note here.

- `NAME bleeds for N.` — base bleed announce (optional ` Target: …` suffix follows when a target is set; two shapes: a card reference, or the player-level `Target: WHO's pool.` from a pool-globe aim, v2.6.21).
- `NAME adds +X bleed (= T).` — post-announce bleed modifier; `T` is the batch-scoped running total.
- `Block: Stealth A vs Intercept B — block succeeds.` / `… — block fails.` — succeeds when `B >= A`.
- `Vote: A for vs B against — vote passes.` / `… — vote fails.` — passes when `A > B`.
- `Combat: A vs B damage dealt.`

**Client-emitted minion action lines** (v2.6.106 — frozen here for the first time. The bot's own grammar table has carried these as *"human clients' wording unverified (main-project ask)"* since THE SPLIT; this block is that answer. Every one is `cardRefCap(c) + ' ' + VERB + targetSuffix()`, so an optional ` Target: ….` may follow any of them):

- `NAME blocks.` — a declared block. **Emitted by the blocking minion's own Actions menu**, which means a bot waiting for the `Block!` say must also accept this line as the block itself: a human who right-clicks Block before reaching for the quick phrase has already announced it. **Settled 15 Sep 2026 (bot v0.6.110):** there are TWO block shapes and neither is canonical — the reference client writes `NAME blocks.`, the bots write `NAME attempts to block.` (`L12.attempt`). The bot parses BOTH additively and takes whichever arrives first as the attempt; if a `blocks.` line lands before the human's `Block!` phrase it does not then ask "Who blocks?", and if the phrase comes first with no line inside its grace window it asks once. Recorded here so neither project re-opens the question or changes one shape to match the other.
- `NAME hunts.` — undirected (v2.6.137).
- `NAME attempts to rescue a vampire from torpor.` — v2.6.138: directed, at the Methuselah whose vampire it is (Actions ▸ Rescue from torpor ▸ Opponent's vampire).
- `NAME attempts to rescue their own vampire from torpor.` — v2.6.138: undirected (Actions ▸ Rescue from torpor ▸ My vampire).
- `NAME commits diablerie!` — note the exclamation mark; this is the one action line that does not end in a period.
- `NAME takes a card action.` — the generic card action; **v2.6.137: treated as DIRECTED** (the +1 stealth is not added). A bot that cannot identify the card behind it has no way to price the action from the line alone.
- `NAME takes an undirected action.` — v2.6.137: Actions ▸ Undirected card action (equip, recruit, employ …). Undirected: +1 stealth, predator and prey may block.
- `NAME calls a political action.` — v2.6.106; undirected (v2.6.137). A true action: it locks, closes the play batch and carries the target suffix, so it reaches a bot's block step on the same path as a bleed.
- `NAME casts N vote for.` / `NAME casts N votes against.` — v2.6.106. Singular `vote` at N=1, plural otherwise; `for` and `against` are lower case. Announce only — no lock, no batch close (a titled minion keeps its votes while locked).
- `NAME's card action is used.` — a NON-minion card in a counter zone (a retainer, an equipment); distinct from `takes a card action.` above.

**Client-emitted reaction line** (v2.6.159 — asked by bot v0.6.201; Johan, 16 Oct: the interim for every reduction card the bots do not know yet):

- `NAME reduces the bleed by N.` — Actions ▸ Bleed ▸ `Reduce bleed −1` / `−2` / `−X…`, written by the reacting minion of the Methuselah being bled. A reaction, not an action: no lock, no batch close, and **no target suffix** (the bot's `L12.reduceBy` ends at the period). N is 1 or more. The bot also accepts a card in brackets, `NAME reduces the bleed by N (CARD).`; the reference client writes the bare form (its effect-line style, like `NAME prevents N damage.`). It is NOT the bot's own reduce shape `NAME plays CARD — reduces the bleed by N (now M).` (em-dash, `(now M)`): each reduction is counted once. Bot v0.6.201+ reads it only from the seat it is bleeding and only during a bleed (not a pool-damage action): it lowers its bleed by N, never below 0, and a bleed reduced to 0 moves no Edge.

**Bot-emitted lines** (the reference client never writes these; they are still frozen contract — the bots both emit AND parse them). **Note (15 Sep 2026):** the *undirected* family in the bot's grammar — `equips`/`employs`, `recruits`, the blood-stock, tabling, fetch and strength announces — is bot-emitted only. The reference client has no menu item that writes them (a human equipping a minion moves a card and logs nothing parseable), so the bots' undirected-block doctrine currently fires bot-against-bot and never against a human. **Open, not blocking:** either this client gains those announce lines, or the asymmetry stays documented here. It is recorded so the next reader of either project does not mistake it for a bug.

- `NAME plays CARD — N pool damage to WHO.` — directed non-bleed pool damage (Inside Dirt-class, bot v0.6.8): the optional phrase `: burns the Edge` may precede the em-dash when the card's cost burns it. NOT a bleed: unbouncable (Deflection's own text is "only usable by the Methuselah being bled") and the Edge never transfers on resolve. Blockable as any directed action; resolution rides the existing `It resolves` say.
- `NAME plays CARD: cancels the block attempt by PLAYER — that minion cannot try again.` — Elder Impersonation-class superior (bot v0.6.9): the announced attempt fails outright and the attempting minion is excluded from retrying this action (the receiver's attempted-set, registered at attempt time, enforces it — the receiving code path is exactly the block-fails branch). The action stays live and blockable by other minions.
- `NAME strikes (hands) for 1.` / `NAME strikes with CARD for N.` / `NAME strikes: CARD — no damage either way this round.` — combat strike announces (emitted since bot v1/steg 6; parsed since v0.6.4's combat handshake: each side takes what the opponent's line actually announced, a silent human falls back to the rulebook default 1 within askSecs).
- `NAME (bot) is in DEBUG mode: open hand for the humans (the bots look away), crypt face up, decision weighting in the log.` — without the weighting `…, crypt face up.` Older bots wrote `…: open hand, crypt face up…` (v0.6.112–199) and `…: open hand to the human players, …` (v0.6.200). Emitted since v0.6.112; from v0.6.201 the OTHER bots read it: they match only the head `NAME (bot) is in DEBUG mode` and key on the sender, and look away from that seat's open hand (no hand intel; a debug grant never answers their Revelations [aus] reveal). Log tier, no bubble.
- `NAME (bot) leaves DEBUG mode: the table is in Tournament mode now.` — v0.6.200+: the room's helper policy turned Tournament and the bot revoked its debug view. Log tier, no bubble.

**Client-emitted combat lines** (v2.6.129; **v2.6.134: EFFECT only, one line per choice, no card names** — the card's own "plays" line already shows it). The vampire's right-click `Combat` submenu and the combat panel write them; they are NOT actions (no lock, no batch close). Amounts come from a 1 2 3 4 N… number menu:

- Already parsed by the released bot: `NAME strikes (hands) for 1.` / `NAME strikes with hands for N.` · `NAME strikes with a weapon for N.` (a weapon is kept distinct — cards trigger on weapons) · `NAME strikes: dodge — no damage either way this round.` · `NAME maneuvers to close|long.` · `NAME presses to continue|end.`
- **New in v2.6.134 (bot follow-up):** `NAME strikes for N.` (any other strike — a discipline, a card, a strength-boosted hand) · `NAME strikes: steals N blood.` (one line; was two) · `NAME strikes: combat ends.` (one line; was the dodge shape plus `Combat ends — CARD.`)
- **New in v2.6.135 (bot follow-up):** `NAME strikes for N aggravated damage.` (cannot be mended) · `NAME inflicts N damage on the opposing minion each round.` / `NAME inflicts no more damage each round.` (Carrion Crows-class: not a strike, cannot be dodged, lasts the whole combat)
- **Action lines (v2.6.137):** undirected actions are `NAME hunts.`, `NAME calls a political action.` and the new `NAME takes an undirected action.` (equip, recruit, employ …); the actor writes `a: 1` onto an untouched Block counter opened against one (the BLOCKER opens the counter). A steal shows on the victim's panel as "Stolen: N blood" from the strike label `Steal N` — the client never moves the blood.
- Logged for the table: `NAME gets an additional strike.` · `NAME prevents N damage.` · `NAME sets range to close|long[ next round].` (Set range used after range is determined is for next round)
- `NAME takes N (loses P blood, now M).` — optionally ` and goes to torpor` before the period, or (v2.6.135) ` and is burned` when aggravated damage destroys an already-wounded vampire. N includes aggravated and every-round damage (v2.6.136: every-round damage lands during the normal strike resolution, so a combat-ends strike in the first pair cancels it; a first-pair dodge stops the opposing STRIKE, never the every-round damage); the count follows the rulebook: prevention on aggravated first, normal damage mended with blood, the first unprevented aggravated point wounds, each further point costs 1 blood or the vampire is burned. Written AUTOMATICALLY, once per round, by the client that owns the combatant, when the table steps past Damage resolution (or resolves from Strike / Damage): N = damage after prevention, P = blood burned to mend, M = blood left, counted from the blood the vampire had when Damage resolution began. After a combat-ends strike the round's damage counts as handled (v2.6.134). Nothing on the board changes — the player burns the blood. **v2.6.131:** with the combat helper OFF (Classic / tournament) nothing writes it automatically; the vampire's `Combat ▸ Damage taken ▸ 1 2 3 4 N…` (shown only then) writes the same line from the vampire's current blood. **The lines in this block are the contract with or without helpers; the combat tally fields exist only when the writer has the combat helper on.**

`NAME` is the card reference (a `<b class=clog>` link in HTML; strip tags before matching). All other tokens are plain text.

### 12.0 Three channels, three voices

A sender chooses how loudly a line lands by choosing its CHANNEL. All three have existed since well before this section; v2.6.107 is where they finally look different on screen.

| channel | bubble | use it for |
|---|---|---|
| `log{html}` | none | **Status.** Bookkeeping the table should be able to read but not be interrupted by — a card being played, a cost being paid, a counter moving. |
| `chat{msg}` | calm tier (v2.6.107): normal reading size, wrapped in a narrow column | **Speech.** Anything written to be read as a sentence: a question, an explanation, an introduction. |
| `say{i}` | the loud tier: short, large, across the table | **A call.** The fixed phrases in §12.1 and nothing else — they are sized to be shouted, and a paragraph in that face cannot be read before it fades. |

**What governs each tier in the reference client (v2.6.114).** The three are deliberately NOT symmetric:

| tier | table gate | local gate |
|---|---|---|
| `log` | — (no bubble to gate) | — |
| `chat` | `hx('chatFx')` — host-lockable, tournament-absolute | `conv.chatBubbles`: Show all / Hide mine / Hide all |
| `say{i}` | **none** | **none** — a quick phrase always shows, by design: if you reach for one you want it seen |

The loud tier has **two** sources: `say{i}` and the resolver verdict lines (§12), which pulse through the same bubble. A renderer must keep the tiers mutually exclusive — one event, one bubble; a quick phrase must never also pop the chat bubble.

Automation should pick per line, not per sender. The known offender is an announce-then-ask pair ("I play CARD, the bleed is now N" immediately followed by "any response?"): the first is status, the second is speech, and sending both as `chat` — or worse, both as `say` — puts two bubbles on screen for one event. A receiver never re-classifies; the channel it arrives on is the decision.

### 12.1 The quick-phrase table (`say{i}`)

`say` carries an **index**, not a string, and the bot mirrors this array. Entries may only ever be **appended** — an insertion or a reorder silently renumbers every phrase for every peer running an older build, with no error anywhere.

| i | phrase | since |
|---|---|---|
| 0 | `Hold on…` | v1 |
| 1 | `No block` | v1 |
| 2 | `Block!` | v1 |
| 3 | `No reaction` | v1 |
| 4 | `It resolves` | v1 |
| 5 | `Yes` | v1 |
| 6 | `No` | v1 |
| 7 | `Pass` | v1 |
| 8 | `Any blocks?` | v2.6.106 |
| 9 | `Any reaction?` | v2.6.106 |

A receiver MUST tolerate an unknown index (ignore it) rather than fail: that is what makes appending safe in a mixed-version room.

**The hold (index 0).** `Hold on…` asks the table to wait. It counts from a HUMAN only: a bot's own index 0 is the thinking announce before it answers a block or a reaction, and it holds nothing. A `chat` line that starts with `hold on` (case-insensitive, after trimming) holds too. A release is index 1, 2, 3, 4 or 7, or a `chat` line that starts with `carry on`, `resume` or `it resolves`, from ANY human, and it frees the whole table, not only the speaker's hold. Index 5 and 6 (`Yes` / `No`) answer and never release. A holder who is out, vacant or offline in the roster holds nothing. The reference bot (v0.6.198) stops every wait it makes on a human while a hold is live — its block and reaction questions, its pool question, its vote poll, every combat step and the damage step, Turn-based's reminder and give-up included — and starts each again from the beginning on release; its in-process `release-hold` rung (`status()` / `step()`) frees that bot alone. The reference client's hold badge follows the same rule.

### 12.2 The hotseat bridge plays the server (reference client)

At a hotseat (Play offline) the bot seats live in the human's tab and talk to `hotBridge`, which answers in the server's own shapes so a bot cannot tell it from a room. These relays are not wire verbs of their own — they are the server's, mirrored; the bot project lifts the bridge literal (`const hotBridge = {…}` + `function hotFanOut`) verbatim for its hotseat gate, so the literal reads nothing of the client but `VERSION`, `net`, `log`, `localTable` and `MP_HANDLERS`, and every other client function it calls is `typeof`-guarded (pinned by a client-suite test since v2.6.159; before it a combat tally threw in the lift, because `tallyIn` called `tallyCombatMerge` bare — the lift now relays the base fields, as a pre-2.6.39 server did). v2.6.159 adds the last ones a released bot sends or reads:

| from | message | to | as the server does |
|---|---|---|---|
| a bot | `edgeTake` | the human (`MP_HANDLERS.edgeTake`, a stored human's saved board, every public mat) and the other bots | `{t:'edgeTake', bySeat, clearOnly}` to every other seat (srv `edgeTake`) |
| a bot | `revealHand` | the recipient only (`to` a seat, or `'all'`); the card-free `pub` line as a `log` to every other seat | `{t:'revealHand', from, seat, who, cards}` (srv `revealHand`) |
| a bot | `logTo` | the one seat named by `toSeat` | `{t:'logTo', from, html}` (srv `logTo`) |
| the human | `edgeTake` (the Edge button) | every bot | as above |
| the human | `edgePass` (the Edge dragged onto a bot's ready region) | that bot only | `{t:'edgePass', toSeat, fromName, pos}` (srv `edgePass`) |
| the human | `revealHand` (Reveal hand to …) | a bot recipient, or every bot for `'all'`; the public line to the other bots | as above |
| the human | `openHand` grant / revoke (Open hand …) | the granted bot(s); re-sent on every board push while the grant stands | `openHandGrant {from, seat, who, cards}` / `openHandRevoke {from, seat}` (srv `openHand`) |
| the human | the targeting `logTo` (a card picked from a bot's revealed or open hand) | that bot only | as above |

A human at the same screen reads the one shared log, so nothing is sent to a human seat over the bridge; a line addressed to a human who is not holding the device names its recipient instead of saying "you". Earlier: `tally`, `bounty` + `roster`, `openHand` from a bot and `give` / `given` (v2.6.122), `say` including a bot's `Hold on…` (v2.6.125), `ctrl` (v2.6.126), `botcfg` (v2.6.139).

## 13. Licensing note

The protocol and Elysium's code are Johan's to open as he wishes. **Card images, card data and VTES
IP are NOT part of this contract** — they come from KRCG under Paradox Interactive's Dark Pack terms
(free, non-commercial, attribution + legal text required). A third-party deployment must carry its
own Dark Pack compliance.
