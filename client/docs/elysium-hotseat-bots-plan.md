# elysium-hotseat-bots-plan.md — HB2: bots in the hotseat client (v1.0, 8 Aug 2026)

*Track: HB (hotseat/browser bots). Preceded by HB0 (env-agnostic seams, bot
v0.6.94) and HB1 (browser spike — green in Johan's real browser, both serving
modes). Frozen decision from the HB0 session: architecture **1a**, a bespoke
hotseat adapter; 1b (in-browser real server via harness shims) rejected —
changes the mode's nature and blocks mixed human+bot hotseat.*

## 1. The wire contract (definitive, choke-point-enumerated)

Regex enumeration over send-sites UNDERCOUNTED: the board verb is born inside
`_drain` from a queued `{__board:true}` sentinel (line ~569) and never appears
as a literal `t:'board'` at any call site — `push()` (line ~632) enqueues the
sentinel, `_pushQ` dedupes, and the pub is built FRESH by `buildPub()` at
flush time. The choke points are the ground truth: the single `ws.send` in
`_drain` + the connect-time raw send.

**Bot → bridge (19):** join, create, board (sentinel), bounty, chat, decide,
deck, draw, drawCrypt, fx, log, logTo, openHand, pass, pileBulk, revealHand,
say, seat, tally.

**Bridge → bot (24, runtime-verified via `Object.keys(b._handlers)`):**
board, bounty, chat, ctrl, dealt, deckok, drew, err, forceOust, forceSetPool,
fx, joined, lobby, log, logTo, openHandGrant, openHandRevoke, revealHand,
roster, say, started, sys, tally, turn.

Server-side facts that shape the bridge: the server's `fx` handler is a pure
sanitizing BROADCAST relay (no board mutation); the `board` c2s handler stores
`p.pub`, relays `{t:'board', seat, who, pub}`, and feeds the resource LEDGER
(ledgerDiff/ledgerLive) — a hotseat bridge that wants ledger parity later
hooks the same point.

## 2. Architecture: the bot seat is a REMOTE PLAYER

Hotseat today has two seat kinds: the ACTIVE seat (live `state`) and frozen
seats (JSON blobs in `net.hot.boards`, mutated via parse→poke→re-stringify —
see edgeHandoffHotseat ~6756, pool ~6815, oust ~6836; `net.boards[seat].pub`
is the rendered mat view). HB2 adds a third kind: the BOT seat — a live agent
whose authoritative state lives in its Bot instance (in-browser, injected
transport), **with NO blob**.

- **Visible surface:** the bot's `{t:'board', pub}` lands in
  `net.boards[seat].pub` — the SAME rendered-mat path a remote online player
  uses. Zero new rendering.
- **Actions:** the bot's log/say/fx lines land in the shared hotseat log —
  the same §12 lines online tables see.
- **Client → bot:** the shared log's structured lines route into the bot's
  chat/log inbound; its parsers are the exact ones online play already
  trusts.
- **Mutators route, never poke:** hotseat code that today pokes blobs by seat
  (pool, edge, oust, bounty) gains a bot branch that sends the wire verb
  through the bridge (forceSetPool / tally / forceOust / bounty) — the
  remote-player doctrine applied consistently, so the bot's own bookkeeping
  stays authoritative and the two-sources-of-truth drift class never opens.

## 3. The bridge's server-role duties

Handshake (join→joined synthetic, deck→deckok, lobby→seat — hotseat cfg
pre-assigns, the bot's own pick honored when free, started); deal (shuffle
the seat's chosen deck or DEFAULT_DECK, `dealt {hand, lib, crypt}`,
draw/drawCrypt→pop→drew); turn (t:'turn' on hotseat advance, bot's pass→
advance); relay (both directions per §2); tally (the hotseat shared tally IS
the store — bridge mirrors both ways); reveal flows (revealHand/openHand ↔
the existing hotseat reveal branches, the ~4390 family); ctrl (human-backup —
hotseat-native, since the human can already touch everything).

## 4. Loading & packaging (v1)

Runtime script-tag injection of `elysium-bot.js` + fetch of
`elysium-cardfx.json` → `o.cardfxData`, from the serving host. file:// gets
an honest "bots unavailable here" (the classic-script CORS exemption does not
cover fetch). Server sibling-statics need ONE route at deploy-packaging time
(HB1 finding); `python3 -m http.server` covers local play today.

## 5. Slicing

- **HB2a (THIS DOC, done):** contract + architecture + hotseat reading.
- **HB2b:** the bridge core in the client monolith, harness-testable —
  HotseatBridge takes a real Bot through join→…→dealt→turn-1 draw→pass
  against real hotseat state, driven by client-suite tests (harness-exposure
  pattern). Includes the serialize/undo audit (see risks).
- **HB2c:** UI — 🤖 per-seat toggle in the offline modal (alpha-tagged),
  loader, honest file:// refusal.
- **HB2d:** the full loop — announce routing both ways, tally bridging,
  mutator routing, reveal flows, fx/board rendering, ctrl backup.
- **HB2e:** Page Visibility pause + visible badge, polish, START-HERE/host
  docs.

## 6. Design questions (Johan's call)

1. **Announce discipline:** v1 relies on the client's structured actions —
   they already write §12 lines into the shared log, the grammar online bots
   parse. Free-form manual card moves stay a documented gap, exactly as
   online-vs-bot today (the ctrl exception exists for this).
2. **Background-tab throttling:** Page Visibility pause with a visible "bot
   paused" badge, rather than a blind slow-motion bot.
3. **Seat model:** NO blob for bot seats; mutators route wire verbs (the
   mirror-blob alternative reopens the dual-source drift class).

## 7. Known risks

- The bot's token bucket (burst 8, ~6.7 msg/s sustained) meets zero-latency
  local dispatch: fine, but the bridge must never assume synchronous reply
  ordering — every exchange is async, as on the wire.
- Hotseat free-chat reaches the bot's parsers; the §12 grammar is
  prefix-anchored, so noise is inert (same as online).
- serializeGame/restoreGame and snapshot/restoreSnap must NOT capture bot
  internals (they live outside `state`), but the bot seat's pub in
  `net.boards` must survive seat swap and undo — audit in HB2b (the
  dual-transport lesson's sibling).
- Save/load of a hotseat game with bot seats: the Bot instance cannot be
  serialized in v1 — a loaded game re-seats the bot FRESH (documented alpha
  limitation; the deck re-deals or the seat converts to human).
