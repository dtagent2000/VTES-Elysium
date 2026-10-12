# elysium-core-plan.md — One brain for the table (v1.0, 9 September 2026)

*Purpose: start the "shared game core → local server" track in a FRESH chat at full
speed. Read this together with CLAUDE.md, elysium-session-journal.md,
elysium-project-context.md and elysium-learnings.md (newest entries first), and
elysium-hotseat-bots-plan.md for the hotseat-bot architecture this builds on.
Conversation in Swedish; code and docs in English. Update ALL living docs after
every implementation, and this file when the plan itself changes.
State at writing: client **v2.6.71** · server **srv-2.6.31** · bot **v0.6.101** ·
digest **v1.4** — the merge of the hotseat-bot and telemetry lineages, ONE line.*

## 0. The diagnosis this plan answers

Johan's felt problem (9 Sep): the bot handling is hard to hold in the head. The
finding: **the bot is not the problem — the table has three brains.** Three
implementations of the game's rules must agree:

1. **elysium-server.js** — rooms, seats, deals (server-hidden piles), turn order,
   relays, tally merge, ledger. The authority online.
2. **The hotseat blob machinery in the client** — the ACTIVE seat lives in `state`,
   every other human seat is a frozen JSON blob in `net.hot.boards`, and mutators
   (pool, edge, oust, bounty) POKE those blobs: parse → change → re-stringify.
   The same rules, re-implemented as pokes.
3. **hotBridge** (HB2, v2.6.59+) — an in-client mini-server that plays the server
   role for bot seats: join/deck/deal/turn/draw + relays, "dealNow-mirrored".

Every "sibling" bug in the bot track was the same bug — a mirror that missed a
detail: `drew` zone `unc` vs `uncontrolled` (v2.6.66), `joined.boardMode` never
sent so classic tables dealt structured (v2.6.69), `MAX_PILE` 500 vs the server's
250 (HB2b amend). Manual sibling sweeps found them one at a time; only a
structural cure ends the class.

The bot itself is already unified (HB0, v0.6.94): one file, one wire contract,
transport injected, same code under Node and in a browser. The asymmetry left
to remove is on the TABLE side.

**The principle, restated.** The single-file client was never the real rule;
the real rule is **"one download, zero terminal"**: no install, no PowerShell,
double-click works, offline works. v2.6.61 already ships hotseat bots as a
four-file folder (client + elysium-bot.js + elysium-cardfx.js +
elysium-cardfx.json). A folder honours the rule as well as a file does; a zip
from elysium.cards with START-HERE.html as the front door makes it one click.
Nothing below breaks the rule.

## 1. Step 1 — the shared game core (`elysium-core.js`)

**What it is.** The pure game logic, extracted from the server into ONE file that
both the server and the client consume — so hotBridge stops mirroring and starts
CALLING the same code the server runs.

**What moves (the mirrored surface, from the bridge's own duties):**
- `expandDeck` and its caps (`MAX_PILE`, `MAX_NAME`) — the bridge's `_expand`.
- `dealNow` (7 hand / 4 unc, classic = 0 unc, counts in lockstep) — the bridge's `startFor`.
- draw / drawCrypt → `drew {zone, kind, name, lib, crypt}` shapes.
- turn rotation and the `turn` / `started` / `lobby` / `joined` message shapes.
- tally merge (the absent-field preserve, srv-2.6.17) and, later, the ledger
  (`ledgerDiff` / `ledgerLive`) — the bridge does not do these yet; when it does,
  it does them through the core.
- The message-shape constants the sibling sweep audited by hand (v2.6.69):
  they become the core's exported schema, so a shape exists exactly once.

**How it is consumed.**
- Server: `const core = require('./elysium-core.js')`.
- Client: the build pipeline inlines it as a FRAGMENT. `split_client.py` /
  `elysium-build.js` already assemble the client from twelve fragments
  (net.js, hotseat.js, tokens-engine.js, …); the core becomes one more, with the
  same markers. The delivered client stays ONE file. B1 (split → build → cmp)
  proves the round-trip as it does today.
- The file is env-agnostic by the HB0 pattern: no `require` inside, UMD-lite
  export (`module.exports` under Node, `globalThis.ElysiumCore` in the page),
  wrapped in one IIFE so nothing leaks into the client's lexical scope (the
  `const net` collision that killed bot v0.6.96 is the precedent).

**Versioning and gates.**
- `CORE_VERSION` in the file. `check-versions.js` verifies that the server's
  required core and the client's embedded core are the same version; the
  protocol header carries it. A core change = server restart + client purge
  (already the rule for any wire change).
- **Parity tests are the method.** Each piece moves with a test proving
  `server function ≡ core function` on fixtures (JSON-equal outputs: the deal,
  the drew shapes, the tally merge). The dispatch suite exercises the server
  side, the client suite the bridge side; destructive verification per move
  (the new test must FAIL against the pre-move file).
- Order the moves by bug history: `expandDeck` caps first (HB2b), then
  `dealNow` + `drew` (v2.6.66/69), then turn/started/lobby/joined shapes, then
  tally, then ledger. Five to seven sessions of one piece each.

**Size:** medium. No UI change, no wire change, no hotseat rewrite. The client's
hotseat blobs remain for now — step 1 removes brain 3's independence, not brain 2.

## 2. Step 2 — hotseat as a local instance of the real server

**The model.** *Every table is a room, every seat is a client.* Offline play
becomes online play with the server running in the page over a loopback
transport. Humans are virtual clients too — N client-states (hand, visible
board, per-seat settings), the UI bound to ONE of them at a time through the
seat-swap gesture that already exists. Bots are exactly the clients they are
online. One mental model; the hotseat special cases disappear.

**Why the earlier rejection does not hold.** The HB2 plan rejected "1b: an
in-browser real server" because it "changes the mode's nature and blocks mixed
human+bot hotseat". Virtual clients per seat are precisely what allow mixed
tables; and changing the mode's nature is the point — hotseat stops being a
parallel rule engine.

**Feasibility, already half-proven.**
- The test harness's `loadServer` runs the real server under `fs`/`http` stubs
  today (that is how the dispatch suite works).
- `hotBridge.dialFor` already IS a transport injection of wsConnect's exact
  contract `(url, cb{open,msg,close}) → {send, close}` — the loopback the local
  server needs.
- Making the server env-agnostic is the symmetric twin of HB0: an `IS_NODE`
  gate, transport injection for connections, storage injection for
  persistence (`fs` → `localStorage`), `crypto` → WebCrypto or a tiny hash for
  `passHash`; `http` is unused in-page.

**Spike first (HB1-style, one session, before any commitment).** Load the real
server in the page (or in a Worker via a blob URL — see below), connect two
virtual human clients and one bot over loopback, run dealt → turn → pass in a
loop. Record what breaks (crypto, fs, timers, the unit's own assumptions) and
what the UI needs to bind to N client-states. The spike's verdict sequences the
slices.

**What disappears when step 2 lands.**
- `net.hot.boards` and every poke mutator (`edgeHandoffHotseat`, the pool and
  oust pokes, bounty) — mutators become wire verbs, the remote-player doctrine
  applied to humans too.
- The hotseat branches in `pass()` / `setActivePlayer` / the sweep
  (`hotRunBotTurns`) — turn order is the server's.
- The placeholder blob a bot seat gets from `startHotseat`.
- The serialize/restore drift class for hotseat (B-45 family) — there is no
  frozen state to keep in lockstep.
- hotBridge itself: its duties ARE the server's.
- The HB2d surface (mutator routing, tally bridging, reveal flows, ask relay)
  is not built — it is inherited from online play for free.

**Open design questions (Johan's calls, in the spike report).**
- **Undo.** Online has none; hotseat has `undoStack`. A local server can snapshot
  cheaply — decide parity: undo stays a hotseat-only affordance implemented as
  server snapshots, or disappears. (Tutorial chapters rely on undo? verify.)
- **Save/load.** The server's saves machinery in `localStorage`; the Bot instance
  still cannot be serialized (v1 limitation stands: a loaded game re-seats bots
  fresh).
- **Tutorials.** The classic chapters run on hotseat internals today; they must
  run on the local server. The demo-lobby fixtures (`tutDemoLobby`) are the
  model — the tutorial becomes a scripted room.
- **Views.** L3/L4 already render remote players from pubs with positions; a
  human's own board stays live `state` bound to the active virtual client.
- **Workers.** file:// blocks worker URLs but blob-URL workers work. Running the
  local server (and the bots) in Workers makes the client/server boundary a
  real message boundary in the browser too — the isolation that would have made
  the `const net` collision impossible. A refinement, not a prerequisite.
- **Chat in hotseat.** The chat row is hidden when `net.status === 'off'`; with a
  local room it simply appears — the HB2d chat relay comes for free.

**Size:** a project, not a round. Sequence AFTER step 1: with the core in place,
step 2 is "move hotseat's state down onto the core", not a rewrite from zero.

## 3. Sequencing and gates

1. **Deploy the merge** (v2.6.71 / srv-2.6.31 / digest v1.4): restart, purge the
   client AND `/elysium-bot.js` AND `/elysium-cardfx.json`. Browser
   verification first (the only-Unlock phase-button report, v2.6.70, root
   still open).
2. **Step 1 pieces**, one per session, each with its parity test and destructive
   verification. Living-doc ritual after each.
3. **The step 2 spike**, one session, report with verdicts.
4. **Step 2 slices** on the spike's verdicts, each gated.

Gates are unchanged: `node --check` → client suite → dispatch suite → protocol
lint → canary → bot suite ×3 when the bot changes → HB1 smoke → endpoint smoke →
B1 byte-identical → check-versions (extended with the core-parity check).
Delivery = full files to `/mnt/user-data/outputs/` + `present_files`; patch
scripts only if two chats ever work the same files again — the merge lesson
says: don't.

## 4. The offline bundle (packaging, when convenient)

A zip served from elysium.cards ("Elysium offline bundle"): `elysium-vtes-bord.html`,
`elysium-bot.js`, `elysium-cardfx.js`, `elysium-cardfx.json`, `START-HERE.html`,
`START-HERE-BOTS.html`. One exact-match static route (the srv-2.6.28 family),
the same purge ritual, START-HERE as the front door. Not urgent; natural once
step 2 lands, fine earlier.

## 5. Not recommended

- Rewriting hotseat before the core exists (step 2 without step 1 is a rewrite
  from zero and re-implements brain 1 a fourth time).
- Keeping hotBridge as a permanent third brain "because it works" — it works
  today; every future server rule change is a new sibling to hunt.
- A Node-spawned local server for offline play — needs a terminal; breaks the
  restated principle.
- Rewriting the bot — HB0 got it right; leave it.

## 6. Open items carried into this track

- **only-Unlock** (v2.6.70, hotseat phase buttons): root open, needs the F12
  console text from Johan's browser.
- **HB2d** (if step 2 is far off and hotseat bots are played meanwhile): mutator
  routing, chat row + chat relay in hotseat, ask relay / visible countdown for
  the human, reveal flows, save/load with bots; HB2e Page Visibility pause +
  paused badge.
- **Bot:** the turn-based transfer ramp for 3+-seat tables; influence partial
  fills (the spend gap, journal 9 Aug); both need arena evaluation per the
  doctrine (change · prediction · observed).
- **Telemetry:** crash clusters B/C (faceDown ×1, tx ×2) await raw JSONL rows.
- **Hygiene:** `elysium-bot.js`'s version-history comment is one unreadable line
  — move history to a CHANGELOG file when convenient (cosmetic, ask first).
