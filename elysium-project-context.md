# Elysium - Project Context & Working Reference

> **This doc reflects Elysium v2.3 / server 2.3 (last updated 26 June 2026).** Always work from the newest copy: if an older project snapshot disagrees with the chat's latest delivered output, the higher version number wins. (Note: **2.0 marks the completion of the structural refactor** — incremental work continues on 2.x.)
>
> **Protocol for these two docs:** at the start of work on a game project, read the latest project-context and learnings docs *first* - before digging into the code or the rest of the files. After each implementation, update them where needed - a version bump, a new learning or pitfall, a changed convention.

A fast-start orientation for picking up Elysium development, especially from a fresh AI session. Pair this with **elysium-learnings.md** (learnings + collaboration). The user-facing manuals live in the three generated Word files; the forward backlog is in **elysium-roadmap.md** and **elysium-touch-migration-roadmap.md**.

## What Elysium is

A free, browser-based digital table for *Vampire: The Eternal Struggle* (VTES), Dark Pack compliant. It is a **sandbox**: it enforces no game rules - the players do - but it logs everything, keeps hidden cards genuinely hidden, and shows every action to the whole table. Two ways to play:

- **Hotseat** - several players take turns on one screen, no server.
- **Online** - a bundled Node server holds the hidden piles and relays the table to networked players.

Tech: a single self-contained HTML file (vanilla JS + HTML5 Canvas/DOM, **zero dependencies**) for the client, and a single Node file (**zero npm packages**, hand-rolled WebSocket) for the server. Current version: **client 2.3 / server 2.3**.

## The files

| File | What it is |
|------|-----------|
| `elysium-vtes-bord.html` | The client - the entire game, UI, network layer, and the embedded hand-escrow crypto. ~10,000+ lines. Almost all work happens here. Current version: **2.3**. |
| `elysium-server.js` | The server - rooms, hidden piles, relay, sanitisation, named saves. ~56 KB. Also serves the client file to browsers. |
| `escrow-crypto.js` | Standalone reference copy of the hand-escrow crypto (SHA-256/HMAC/PBKDF2/AEAD); the same code is embedded in the client. |
| `build-docs-en.js` | Generator for the three **English** Word docs (uses the `docx` npm lib). Edit the content here, then re-run; do not hand-edit the .docx. |
| `build-docs.js` | Generator for the three **Swedish** Word docs (Spelarmanual / Vardguide / Teknisk...). Kept in sync separately. |
| `Elysium - Player Manual.docx`, `... Host Guide.docx`, `... Technical Documentation & Roadmap.docx` | The generated English docs. |
| `elysium-roadmap.md`, `elysium-touch-migration-roadmap.md` | Forward backlog + the dedicated touch-input plan. |
| `elysium-relocation-plan.md` | The consolidated relocation plan (replaces `elysium-relocation-brief.md`). Documents the discipline rule, TDZ constraints, frozen items, all decisions, and verification commands. Kept for reference — the relocation is complete. |
| `relocate.py` | The Python script that executed the relocation (brace-counting parser, 42 functions). Kept for reference. |
| `kodarkivering.md` | Parked / retired code, archived verbatim with what/why/where notes (the Alt views, the L3 circle table, `renderOval`, the Simplified default-view setting). Nothing here is wired into the client. |
| `START-HERE.html` / `STARTA-HAR.html` | Browser onboarding for people you share Elysium with (guest / host / Tailscale + troubleshooting), EN / SV. |
| `start-elysium.bat` | Windows launcher with a Node check. Never double-click the .js directly - the Windows Script Host kills it with "Invalid character, line 1". |
| `harness_faithful.js` | A headless harness that runs the client's script to completion in Node (see Verifying). |
| `test-2a/2b/2c/2d/2e/2f/2g.js`, `test-autosave.js`, `test-crypto.js`, `test-helper-policy.js` | The server + crypto test suites. |
| `test-client-logic.js` | The **client** logic suite (Phases 0–1). Loads the real client functions in Node under a DOM stub and asserts serialize<->restore, the `pubXform`/`pubInv` inverse, `buildPub` hand-secrecy, `restoreGame` defensiveness, `baseView`, the debug ring buffer, the `mpOnMsg` handler-map routing, and the hotseat-log `keepLog` guard, plus the state-contract depth (single-zone `move` invariant, attachment round-trip, id/position survival, `buildPub` purity). Run: `node test-client-logic.js` (16 assertions) + `node test-server-dispatch.js` (3, the server `handle()`/`GAME_HANDLERS` via `loadServer`). |
| `elysium-test-harness.js` | Shared zero-dep stub-loader the client suite requires - the one place the Proxy DOM stub lives. (Complements `harness_faithful.js`, the load smoke-check; fold that in here when convenient so the two stubs don't drift.) |

## Working environment & hard constraints

The development sandbox is **not** a browser and **not** a live network:

- **It cannot render HTML or run the server / multiplayer.** So everything visual or runtime - animations, layout, the views, turn flow, the hidden hand, hotseat switching, every online path - is **unverified by the assistant**. Johan tests these live. Always say so.
- **bash networking is usually disabled** (egress off; loopback uncertain). Don't assume you can install npm packages, and don't run the WebSocket test suites blind expecting them to connect.
- **Node is available**, and the **`docx` npm lib is installed** (so the doc generators run).
- Files the assistant creates are only visible to Johan after `cp` to `/mnt/user-data/outputs/` **and** a `present_files` call.

## How to verify a change (without rendering)

These are the reliable gates in the sandbox:

- **Client JS syntax:** `sed -n '/<script>/,/<\/script>/p' elysium-vtes-bord.html | sed '1d;$d' | node --check -` (expect no output = clean).
- **Client load harness:** `timeout 60 node harness_faithful.js elysium-vtes-bord.html` -> expect `SCRIPT RAN TO COMPLETION`, plus `drawCard: OK` / `layout: OK`. Catches runtime ReferenceErrors the syntax check misses.
- **Client logic suite:** `node test-client-logic.js` -> expect `16 passed, 0 failed`. Drives the *real* serialize/restore/buildPub/pubXform/baseView/dbg functions through a DOM stub (`elysium-test-harness.js`), so it guards the module extraction - it catches logic regressions the syntax + load checks can't.
- **Server JS syntax:** `node --check elysium-server.js`.
- **Word docs:** after `node build-docs-en.js`, validate each with `python3 /mnt/skills/public/docx/scripts/office/validate.py "<file>.docx"`, and run `extract-text "<file>.docx"` to confirm the content rendered and no `\u` / `\U` escapes leaked through.
- **Server test suites (network permitting):** run `node elysium-server.js 89XX` in the background, then `node test-2a.js 89XX` (2b/2e/2f/2g likewise); `node test-crypto.js` is standalone. Delete `elysium-rooms.json` *and* `elysium-saves.json` between runs (2a's lockout test poisons the localhost IP). ~195 assertions total. Often not runnable here - don't claim a green run you didn't do.

## Skills & tools needed

- **docx skill** (`/mnt/skills/public/docx/SKILL.md`) - read it before regenerating or editing the Word docs. The generators already follow its patterns (explicit page size, `LevelFormat.BULLET` rather than unicode bullets, dual table widths, no `\n` inside runs).
- No special skill is needed for the client/server - they're vanilla JS. The `frontend-design` skill only matters for genuinely new standalone UI, which Elysium is not.

## Safe editing workflow (one huge file)

The client is a single ~6,600-line file, so edits must be precise:

- **Atomic multi-edit batches:** write a Python heredoc that first does `assert s.count(find)==n` for **all** edits, then applies **all** the replaces, then writes. If any anchor is wrong, nothing is written and you see exactly which one.
- **Unique, plain-ASCII anchors:** line numbers shift after every edit, so re-grep; make find-strings unique; and choose anchors **without** smart quotes, em-dashes or arrows, since matching those exactly is error-prone. Put the fancy characters only in the *replacement*.
- **The unicode/emoji escape trap (this has bitten twice):** inside a `<< 'PYEOF'` heredoc, write `\uXXXX` / `\U0001XXXX` with a **single** backslash to *produce* the character; a double backslash produces the literal text `\uXXXX` in the file.
- **Always** `cp` the regenerated/edited deliverable to `/mnt/user-data/outputs/` and call `present_files` - and double-check you copied the freshly built version, not a stale one.

## Architecture in brief

- **One file per side**, both dependency-free. The client is authoritative for your own board; the server is authoritative for hidden piles (library/crypt) and, online, for victory points.
- **`serializeGame()` / `restoreGame()`** capture and restore a whole board as a JSON blob; **`buildPub()`** produces the public (opponent-visible) view. **Save format = wire format** - the same public representation is the autosave and the network payload. This dual purpose is deliberate; preserve its forward-compatibility.
- **Hotseat = the same model, locally.** `net.hot.boards[seat]` holds each seat's `serializeGame()` blob (a **JSON string**, not an object); the active player `net.you` is switchable (PRIORITY bar / Table dock); non-active seats render from a locally-built `buildPub()` stored at `net.boards[seat].pub`. The roster, the shared Round/Turn counter and the aim live on `net` (never swapped). The seam: view/turn behaviour gates on **`tableView()`** (true in both modes); networking keys off **`inRoom()`** only where a real socket is involved.
- **L3 "helicopter" view has two coordinate worlds.** Opponent furniture (mats, centre timer, table) lives inside `#l3stage`, which carries `translate(pan) scale(Z)` and so pans/zooms as one rigid unit. Your own live board (`#z-ready`, `#poolWrap`, `#edge`, your cards, the Edge token) stays on `#board` and is hand-positioned by `setCenterFrameA`, folding the same transform in manually (`Px+Z*coord` for position **and** `scale(Z)` for size). `l2pub` already contains `Z` (`l2pub.s = baseS*Z`), so anything routed through `pubXform`/`pubInv` is automatically correct under zoom — don't re-multiply. See learnings for the full set of L3 rules.
- **Tokens are a family beside the card system.** Non-card objects must never enter `state.cards`/`state.zones` (it breaks the card pipeline). The Edge lives in a separate `tokens` Map with `TOKEN_DEFS` (registry: `label/size/svg/menu` per type) and a generic engine (`makeToken`/`placeToken`/`bindTokenDrag`/`removeToken`) that *reuses* `pubXform`/`cardTransform` for placement but skips zone/`move()` logic. `buildPub()` exports `tokens:[{type,x,y}]` and `buildMat()` draws them so a token shows on its controller's mat in every view. A new token type = one `TOKEN_DEFS` entry.
- **Online flow:** a board change builds `buildPub()` (debounced) -> the server sanitises -> broadcast as `board`; hidden ops (draw / browse / reveal / take) are owner-exclusive verbs; the hand never leaves the client except as an **encrypted escrow blob** (key derived via PBKDF2 from the room password + a public salt; the server stores and routes it but cannot read it).
- **Helpers** (toggleable conveniences): a phase-structure assistant, the **oust helper** (`conv.poolToPredator`, on by default) that awards the ousted player's predator +6 pool and +1 VP, and the **path blood helper** (`hx('pathBlood')`, default off) that burns 1 blood when a Sabbat vampire follows a Path (Influence phase only).
- **Board Mode** (`net.boardMode`): an exclusive choice made at game start — **Classic** (`'classic'`, default: L4 free-form open table, Lackey-style) or **Structured** (`'structured'`: L2 columns + L3 helicopter, guided zones). The mode is set in the lobby (online) or hotseat-setup, stored on the server room, and relayed to all clients. `freeBoard()` gates Classic-specific behaviour; `baseView()` returns `'l4'` in Classic, `'l2'` in Structured; `levelOrder()` returns `['l4']` (single view, no stepping) or `['l2','ov']`. Classic + Tournament Mode = a clean Lackey-like experience (both are default on first run). Online: pool globe positions are exported in `buildPub()` as `{type:'pool', x, y}` in the tokens array; opponent globes are updated via `updateL4Opponents()` in the `board` handler; opponent cards are rendered via `renderL4OppCards()` using `addRCard` into `#l4oppWrap`.
- **L0 idle board.** A clean felt surface with no game UI. `#board.l0mode` fills `#tableArea` via `position:absolute; inset:0; width:auto; height:auto; transform:none !important` (like L3/L4). All direct children except `#empty` and `#toast` hidden via `display:none !important`; `#empty`'s background set to `none` so the board's felt pattern (repeating-linear-gradients) shows through; `#l1zoomWrap` hidden via `:has()`. `enterL0()` strips L2/L3/L4/l2cols classes, adds `l0mode`, clears inline transform. Entered at startup, after Reset table, after leaving an online room with a game, after leaving hotseat. Exited in `enterL2/L3/L4`, `buildDeck` (solo), `startHotseat`, Resume click. Not part of the Tab step-cycle — lives outside the game loop.
- **L4 element scaling**: `const L4_CARD_S=0.5, L4_TOKEN_S=0.7` — cards at 50%, tokens/globes at 70% of native size. Applied in `place()`, `placeToken()`, `placeL4Globe()`, `regrabAtScale`, drag-move `sc`, group drag `ms`, ghost elements, and drop-offset calculations. One line to change both values.
- **L4 interaction model**: single-click+drag = marquee/lasso selection (works everywhere on the board); double-click+hold = pan. Dock stays open during card drag (hover-logic manages open/close based on position). Pool globe: +/- buttons on hover, scroll-wheel for pool, grab-drag to reposition. Opponent globes are read-only (no buttons, default cursor).

## Conventions

- **Communication is in Swedish; the app UI and all docs are in English.**
- Dark Pack compliant (unofficial, non-commercial fan project; attribution in About and the docs).
- Client `VERSION` (currently `2.2`) is stamped into saves and the online handshake (`v:VERSION` on join). Server `VERSION` is **`1.9`** and **decoupled** from the client number - the server compares the client's `v` against its own and only emits a *warning* sys-message on mismatch (no hard check on file load). Online is rarely tested (hotseat is primary), so a client↔server gap is tolerated. Client-only changes (CSS/JS) do **not** require a server bump; bump the server when the wire protocol changes (the Edge token added `edgePass`/`edgeTake` verbs) or when server behaviour changes — 1.9 fixed `HELPER_KEYS` so locked tables relay `hand`/`handReminder`; no new verb, but a behaviour change worth the bump.

## VTES glossary (the domain in one screen)

The terms that show up in Elysium's UI and mechanics:

- **Methuselah** - a player (the elder vampire you play as).
- **Pool** - your life total; reaching 0 means you are ousted.
- **Crypt** - your stack of vampires (you draw minions from it). **Library** - your deck of everything else.
- **Minion** - a vampire or ally in play under your control (the crypt cards in the ready region).
- **Uncontrolled** - crypt cards drawn but not yet in play (face down); you spend pool to **influence** them in.
- **Bleed** - the core attack: reduce your prey's pool.
- **Prey** - the player you bleed (next in turn order). **Predator** - the player who bleeds you (previous in turn order). Seating *is* the turn order.
- **Ousted** - eliminated (pool hits 0); your predator collects the bounty (+6 pool, +1 VP).
- **The Edge** - a single contestable token at the table; holding it adds to bleeds and fuels some effects.
- **Torpor** - incapacitated vampires (not destroyed - they can come back).
- **Victory Point (VP)** - the win condition; earned by ousting a Methuselah (+1) or at game end.
- **Phases** - a turn runs Unlock -> Master -> Minion -> Influence -> Discard (the F1-F5 phase bar mirrors this).
- **Card types** - Master, Action, Reaction, Combat, Equipment, Ally, Political (vote/referendum), plus action modifiers.

For anything deeper - exact timing, edge-case rulings, how a specific mechanic resolves - check the **official rulebook at vekn.net/rulebook** (the same link Elysium ships in-app, under About/help). When a game function is unclear, look it up there rather than guessing. Card data and rules text come from KRCG (static.krcg.org).

## Key functions & globals (navigating the client)

The architecturally important entry points in the one ~10,000-line `elysium-vtes-bord.html`:

**State & serialization**
- `serializeGame()` / `restoreGame(blob, opts)` - capture / restore a whole board as a JSON blob (this is the save = wire format).
- `buildPub()` - the public, opponent-visible view of your board (the network + overview payload).
- `makeCard()`, `move(card, zone, opts)`, `place(...)`, `layout()` - create a card, move it between zones, position it, re-lay the board. Cards sit on a composite `transform`, so animations use the separate `rotate` property.
- `animCard(card, type)` - the rise / flip entrance animations.

**Mode & turn**
- `tableView()` - true in hotseat *and* online (gates view/turn behaviour). `inRoom()` - true only in a real online room. `netGame()` - an online game is in progress.
- `pass()` - end the turn (bell + advance the turn; in hotseat it also hands control to the next seat).
- `advanceTurnCounter(seat, opts)` / `turnLabel()` - the shared Round/Turn counter.
- `ousted()` - the oust sweep; plus `awardBountyHot()` (hotseat predator bounty), `unoustHot()`, `adjustHotVp(seat, d)` (hotseat manual VP).

**Hotseat**
- `startHotseat(players, boardMode)` - start local pass-and-play; `setActivePlayer(seat, opts)` - switch the controlling player; `updateHotHud()` - the PRIORITY bar; `mySeat()` - the active seat. Per-seat state lives in `net.hot.boards[seat]`; the roster + counter live on `net`.

**Board mode & views**
- `freeBoard()` - true when `net.boardMode==='classic'` (the L4 free board). `l4on()` - true when `board.classList.contains('l4mode')`.
- `convertCardKind(c, toCrypt)` - converts a library card to crypt kind (vampire) or reverts. Sets `c.kind`, `c.converted`, updates CSS classes + back image + clan detection. Persisted in snapshot, serializeGame, and buildPub.
- `groupAlign(base)` - aligns selected cards side by side, anchored from `base`. Hotkey `A`. Spacing: `CW*L4_CARD_S` in L4, `CW` in other views (zero gap).
- `renderL4OppCards()` - renders opponent cards on the L4 board surface via `addRCard` into `#l4oppWrap`. Called from `updateL4Opponents()` and `layout()`.
- **Path of Enlightenment (planned):** V5 Sabbat vampires can choose one of 4 paths (Caine, Cathari, Death, Power). KRCG PR #830 adds `Card.path` to vtes.json (OPEN, not merged). Elysium design: `c.path` property, right-click "Choose Path →" submenu on Sabbat crypt cards, auto-detection (`detectPath()`/`activePath()`), path-icon on pool globe (priority: path > clan when path has more vampires; tie → clan wins), path badge on card face. Full spec in session journal "Planerad feature: Path of Enlightenment".
- `baseView()` - `'l4'` in Classic, `'l2'` in Structured. `levelOrder()` - `['l4']` or `['l2','ov']`. `cycleView()` is a no-op in Classic (single view).
- `enterL4()` / `exitL4()` - lifecycle for L4. `renderL4()` - sets up the board surface (stage + table + centre timer), `l3myslot` to full felt area, `l2pub` via `setCenterFrameA`. L4 piggybacks on L3 infrastructure (`l3mode` + `l4mode` on board): zoom/pan, dock panel, hand-hover, scroll-to-zoom, drag-to-pan all reuse `l3on()===true` paths. Zone boxes hidden via CSS (`#board.l4mode` rules: transparent borders, hidden labels/poolWrap).
- **L4 pool globes** (`l4Globes` Map): per-player draggable pool displays on the free board. `createL4Globe(seat, name, pool, mine)` builds a `.l4globe` element (Cinzel label + 64px red globe with pool numeral). YOUR globe: drag + scroll-wheel (`bumpPool`) + right-click (`selfPoolMenuItems`). Opponent globes: right-click (`oppPoolMenuItems`), read-only display. `renderL4Globes()` creates them in a circle around centre; `layoutL4Globes()` re-places on zoom/pan (called by `layout()`); `updateL4GlobePool(seat, pool)` refreshes the numeral.

**Views**
- `renderStats()` + `statRow()` + `renderOtherBoards()` - the Table dock (per-player stats + the "on other boards" overview). `renderOval()`, `renderFull()`, `addRCard()` - the oval and visit views.

**L3 "helicopter" overview** (the coordinate model is in Architecture + learnings)
- `renderL3()` - rebuilds the bird's-eye: `#l3stage` (transformed wrapper holding opponent `.mat`s + `#l3timer` + `#l3table`), then `setCenterFrameA(myslot)` for your own live board. `l3slots(N, me, seats)` returns the per-player-count geometry (2p/3p two-band, even 4+ grid, odd 5+ pentagon/three-band) — **every branch returns `clockCy`** (centre-clock Y, used to anchor the Edge button).
- `setCenterFrameA(fx,fy,fw,fh)` - folds your board into its slot: zones + pool + Edge button via `Px+Z*coord` (+`scale(Z)` for the button). `applyL3Transform()` - the light pan/zoom update (no mat rebuild): re-applies the stage transform, re-runs `setCenterFrameA`, re-places the Edge token. `clearL3()` / `enterL3()` / `exitL3()` - lifecycle (clearL3 resets inline styles incl. the pool globe's L3 sizing and the `l2pool` class).
- `pubXform(x,y)` / `pubInv(x,y)` - canonical↔display (exact inverses; `l2pub.s` includes Z). `pubCanon(zone)` - canonical rect per zone (supports `ready/uncontrolled/torpor/pool`). `pubBox()` = `l2geo('box',1004,616)` (the shared canonical box all boards map into).
- `opponentSurfaceAt(cx,cy)` / `readyZoneAt(cx,cy)` - geometric hit-test for which opponent board / Ready zone is under the cursor (rect comparison, robust across stacking contexts; used by card-give and the Edge token).

**Tokens (the Edge, and future tokens)**
- `TOKEN_DEFS` - registry (`edge` only so far): `label/size/svg(sz)/menu(tok)`. `makeToken/placeToken/bindTokenDrag/removeToken/layoutTokens` - the generic engine (token lives on `#board`, placed via `pubXform`+`cardTransform`, drag reuses `bindCard`'s `f`/`ox/oy` math but skips zone logic).
- `ensureEdgeToken()` - creates/repositions the Edge token (default: lower-right of Ready). `toggleEdge()` - the button: take→`edgeTakeover()` (authoritative, clears the Edge everywhere + re-seats), release→clear local. `edgeHandoffHotseat(toSeat, dropPos)` - hotseat handoff (writes edge+pos into the target's stored JSON + pub). Online uses the `edgePass` (drag handoff) and `edgeTake` (button takeover) verbs.

**Online**
- `mpSend({t:'...'})` - send a verb to the server. The full protocol (verbs in / messages out) is catalogued in the Technical Documentation.

**Decks**
- `parseDeck()` / `buildDeck()` - parse a Lackey/TWD list and lay out the deck.

**Settings**
- `conv` - the conveniences object (`conv.poolToPredator` = oust helper, on by default; `conv.anim`, `conv.pco`, ...). Persisted via `saveConv()` / `loadConv()`.

**Played cards & left panel (v1.6 / v1.7)**
- `collectPlayed()` / `snapshotPlayed()` / `renderPlayed()` - the Played-cards tab: collect the loose-in-play library cards **not** in the baseline (mine from `state.zones.ready`, each opponent from `net.boards[seat].pub`); re-baseline the display; render the tab badge + overlay. `avBaseline` is a persistent set of **card ids** (ID-only keys survive hotseat take-control); re-baselined on phase change / game start / manual Clear, *not* on view open/close. **`tagPlayed(c)`** is the universal play-to-ready hook that also refreshes the tab (this is what keeps the count consistent across every play path).
- `avRenderCard(host, c, scale, colHex, interactive, hoverName)` - **returns the `.avc` wrapper element** (used in v1.7 to attach per-card listeners). Renders a tray/overlay card with an owner-colour outline + hover preview; stamps `data-card-name` for the Ctrl-hover lupp (face-down omitted, so nothing leaks). `showHoverFor(el, x, y)` is **name-based** (reads `data-card-name`), so it inspects board `.card`s and `.avc` tray cards alike.
- `cycleView()` - the `§` key: toggles Helicopter (`'ov'`) and the home view (`baseView()`). `sanRemote(html)` - sanitises relayed log HTML while preserving the `clog` card-links.
- Left panel: `cardFallbackHTML(name)` (in-frame fallback on image error), `#helpToggle` / `#helpOverlay` (the `?` overlay), and the log-peek helpers `fillLogPeek()` / `syncLogPeek()`.
- **Per-card interactions in `#playedRow` (v1.7):** left-click calls `selectOnly(c)` + `layout()` + `renderPlayed()` (own cards only; opponent cards ignored silently). Right-click opens `showMenu()` with **Clear this card** (`avBaseline.add(c.id)` — removes from display, card stays on board; works for all cards) and **Discard this card** (own cards only: `pushUndo()` + `move(live,'ash',{})` with live zone re-check). "Clear" button renamed **"Clear all"** to distinguish from per-card clear.
- **Tab centering (v1.7):** `--aside-w` CSS variable (268px open, 0px when `body.aside-collapsed`) drives `--tab-mid: calc(var(--aside-w)/2 + 50%)`. All four elements (`#playedTab`, `#playedOverlay`, `#readyTab`, `#readyPeek`) use `left: var(--tab-mid)` so they stay centred over the visible board area regardless of panel state.
- **Overflow behaviour (confirmed, no fix needed):** `#playedRow` and `#readyRow` both use `flex-wrap:wrap`; their parent overlays have `max-height` + `overflow:auto`. Many cards wrap to additional rows and the overlay scrolls.


## conv — local settings reference (v1.10)

`conv` is the local conveniences object, persisted via `saveConv()` / `loadConv()` (key `elysium.convenience` in localStorage). All fields are local-only unless noted.

| Field | Type | Default | What it does |
|-------|------|---------|--------------|
| `cardDB` | bool | false | Load KRCG vtes.json (minion detection, deck lab catalog, card text) |
| `poolToPredator` | bool | true | Auto-award 6 pool oust bounty to predator |
| `autoLock` | bool | true | Auto-lock acting card on action |
| `anim` | string | `'on'` | Clone animations: `'on'`/`'mine'`/`'all'` |
| `animSpeed` | number | 1.0 | Animation duration scale (0.5–2.0, ±10% steps). Applied as inline `style.animationDuration` on `.cfx` wrap + `.cfximg` children. `_swapAt` (flip midpoint) also scaled. No-op at 1.0. |
| `drawClick` | string | `'double'` | `'single'` = click draws; `'double'` = dblclick draws. Ctrl+click undo always on click. All 5 draw elements updated: `#z-library`, `#z-crypt`, `#dockLib`, `#dockCrypt`, `#avLib`, `#qrLib`. |
| `pco` | string | `'on'` | Player-colour outlines: `'on'`/`'mine'`/`'all'` |
| `pcoHome` | bool | true | Hide board-owner's own outlines in home area |
| `pcoNeutral` | bool | false | Hide neutral selection/target rings |
| `poolPlayerColor` | bool | false | Tint pool globes with each player's seat colour (all views) |
| `qrView` | bool | true | Use Quick React strip (vs. classic Alt tray) |
| `l3shape` | string | `'square'` | L3 table shape: `'circle'`/`'square'` |
| `cardTip` | bool | true | Instant card-name tooltip on hover |
| `defaultView` | string | `'normal'` | Home view: `'normal'`/`'simplified'` |

`openSettings()` syncs all values to the UI on open. Each setting has a corresponding `addEventListener` that calls `saveConv()` on change.

## Card object fields — owner and controller

Each card object (`state.cards.get(id)`) carries:
- **`c.owner`** — whose deck it came from. Drives oust logic: cards you own but someone else controls stay on their board; cards others own in your zones go to their ash heap. Set at import/deal; correctable via *Set owner* in the right-click menu.
- **`c.controller`** — who controls the card right now. Changed by in-game effects via *Give control*. Separate from owner.
- **`c.path`** — path of enlightenment (V5 Sabbat), e.g. `'Path of Caine'`. Null for vampires without a chosen path. Set via the right-click "Follow Path" menu or from KRCG data (when PR #830 merges). Serialized everywhere (snapshot, save, pub, hand escrow).
- **`c.noPath`** — boolean. True when the player chose "No path" to hide the Follow Path menu item for this card. Only relevant without KRCG data (where the menu shows on all vampires). Serialized alongside `path`.
- Both are runtime fields on the card object. Saved in autosave snapshots as part of the board state. **Do not affect the deck library.**

## KRCG discipline format — two formats in the wild

`card.disciplines` in vtes.json is an array that may contain **either** trigrams (`["dom", "aus"]`) for older disciplines **or** full names (`["oblivion"]`) for newer ones (Oblivion confirmed; others may follow the same pattern). `DISC_NAMES` maps trigram→fullname; `DISC_ABBR` (added v1.9) is the reverse, fullname→trigram. `cardTags(c)` adds both forms for every discipline word so that `obl:`, `oblivion:`, `dom:`, `dominate:` etc. all work as filters.

## startHotseat — board-building sequence

```
players.forEach((p,i)=>{
  if(p.boardJson) restoreGame(...)           // resumed save — no redeal
  else if(p.deckText) { buildDeck(parseDeck(p.deckText)); dealOpeningSync(); }  // fresh deck → auto deal
  else clearTable(...)                       // no deck
  net.hot.boards[seat] = serializeGame();    // snapshot includes the dealt hand
  net.boards[seat] = { who, pub: buildPub(), ts }
})
restoreGame(net.hot.boards[1], ...)          // activate seat 1
```

`dealOpeningSync()` is the synchronous counterpart to `dealOpening()` (which uses setTimeout for animation effect in solo play). Draws 7 library cards to hand + 4 crypt cards to uncontrolled.

Online start: server calls `dealNow(q)` per player on `start`, client receives `dealt` message.

## v1.5 - the table views, made interactive (18 June 2026)

The biggest shift since v1.4. The old oval overview (`renderOval`/`renderFull`) is superseded; the three views are now:

- **Simplified** (`net.view === null`) - your own board, full size, fully interactive (the former "level 1").
- **Normal** (`'l2'`) - your live board in the centre with prey / predator as upright columns either side. Built by `enterL2()` / `renderL2()`.
- **Helicopter** (`'ov'`) - the whole table as a round table, or a Lackey-style square (`conv.l3shape`), everyone upright, you at the bottom. Built by `enterL3()` / `renderL3()`; opponent mats via `buildMat` / `addRCard`. (A single-board *visit* is still `net.view === <seat number>`.)

Key additions:

- **`switchView(target)`** is the one entry point (null / seat / `'l2'` / `'ov'`); **`baseView()`** returns the home view (`'l2'` — always Normal since v1.99.27), and **`goHome()` = `switchView(baseView())`** is wired to every "go home" path (Home/0, Esc, your own seat, Tab-home, hotseat active-player switch, rvBack). Games now *open* in `baseView()` (hotseat at start; online on 'started'/'took').
- **`conv.defaultView`** (`'normal'` | `'simplified'`, default normal) - the local home-view setting (Settings -> Default table view).
- **Cross-table play in any view** - `opponentSurfaceAt(cx,cy)` geometrically hit-tests the opponent board (`.l2pane2[data-seat]` / `.mat[data-seat]`) under the cursor; `giveTo(seat, surfaceEl, targetEl, x, y, c)` is the one give. Online it goes via the server (`mpSend({t:'give'})` -> `given`/`gave` echoes); **hotseat has no server, so `giveHot(...)` injects the card into the target seat's stored board + its public snapshot and removes it from your hand**. The Reaction strip drags through `qrDragGive` (drop on an opponent -> give, on your board -> play, back on the strip -> cancel).
- **Host-locked table view** - the create dialog has a Table view picker; the host's Normal/Simplified choice locks the view for everyone. Mirrors the reaction-timer pattern exactly: the **server** stores `room.tableView` and forwards it in the join/state, `lobby`-join and `started` messages; the **client** sends it in `create` and reads it into `net.tableViewLock` (which `baseView()` already honours).

> v1.5 is **confirmed live**. See v1.6 below.

## v1.6 - Played cards, the left-panel pass, and cross-table polish (20 June 2026)

Confirmed live by Johan. Five threads on top of v1.5:

- **Played-cards tab + overlay (new).** A window-fixed tab pinned under the top menu (centre), available in every view, online and offline. It shows everything played *this phase* - yours and every opponent's - as thumbnails outlined in each owner's colour, with a live count badge. **Hover-peek + click-pin** (the log-peek pattern), and it recedes (dimmed) when nothing is played. Overlay actions: **Clear** (re-baselines the display - cards stay on the board) and **Discard mine** (sweeps your own played cards to ash on demand). The Reaction strip (Quick-React + classic Alt) each gained a **Clear** button too.
  - *Data model:* `collectPlayed()` diffs the loose-in-play library cards against `avBaseline` (a persistent set of **card ids**); `snapshotPlayed()` re-captures it on phase change / game start / manual Clear - never on view open/close. The old auto-discard + auto-baseline-reset on closing the strip is **gone** (closing no longer touches your cards). `renderPlayed()` is driven from `renderAltIfOpen()` and from `tagPlayed()` (the universal play-to-ready point), which is what makes the count consistent.
  - *Inspect:* played thumbnails support the Ctrl-hover lupp while the left panel is collapsed - `avRenderCard` stamps `data-card-name` on the `.avc` wrapper (face-down omitted) and the pointer tracker matches `.avc[data-card-name]`; `showHoverFor` is name-based, so opponents' cards inspect too.
- **Left-panel (card viewer) overhaul - six points.** Ctrl-hover lupp fires while the pointer is stationary (track `lastCardEl` on pointermove, use it on Ctrl-keydown); the name tooltip is suppressed during a Ctrl-hover. The "Card text" rules section is **CSS-hidden** rather than removed (keeps its DOM handler alive); a card-image load failure falls back to name + KRCG text in-frame (`cardFallbackHTML`). The "Controls" list moved into a **`?` help overlay**. Log card-links drive the aside viewer on hover and a pinned detail view on click; hovering the collapsed **Panel** tab (or holding Shift) peeks the log, card links inside floating the card at the pointer.
- **Cross-table give from the Quick-React strip - fixed (three causes).** The felt marquee now excludes `.qrc / #qrbar / #altview`; `qrHandDown` calls `preventDefault()` (a missing one let a selection-drag fire `pointercancel` and kill the drag); and `giveHot`'s re-render gained the `typeof net.view==='number' -> renderRemote` case + `renderAltIfOpen()`, so a given card actually lands on a single-board visit.
- **Opponent-card log links - fixed.** `sanRemote` was stripping the `clog` tags from relayed plays. It now placeholder-protects the `<b class="clog" data-cid=...>` opener (sanitising the id), strips everything else, and restores - so opponents' log entries are clickable. Unit-tested in the harness.
- **`§` is now an L3 <-> home toggle.** `cycleView()` toggles `switchView(net.view==='ov' ? baseView() : 'ov')` - Helicopter from anywhere, home (Normal/Simplified, host-lock respected) back. The own single-board (Simplified) is intentionally no longer on the `§` loop when Normal is home.

> **In flight (designed, not built):** folding the Reaction strip's last unique job - locking/selecting your own ready cards while viewing *another* player's board - into a discreet **Ready peek-tab** fixed to the centre of the hand panel, shown only off your own board (opponent visit / Helicopter). Full shape + an optional Played-cards "phase log" are parked in the roadmap. Next build focus otherwise: Helicopter (L3) layout optimisation.

## v1.7 - Played-tab polish and tab-centering (21 June 2026)

Three improvements on top of v1.6:

- **Rename.** The tab label and overlay title changed from "Played cards" to "Played". The header "Clear" button became **"Clear all"** to distinguish it from the new per-card clear in the right-click menu.
- **Tab centering follows the left panel.** `--aside-w` (268px / 0px on collapse) + `--tab-mid: calc(var(--aside-w)/2 + 50%)` in CSS; `body.aside-collapsed` overrides to 0px. `#playedTab`, `#playedOverlay`, `#readyTab`, `#readyPeek` all use `left: var(--tab-mid)` — they now track the visible board centre as the panel opens/closes.
- **Per-card interactions in the Played overlay.** Left-click selects the card (own cards only: `selectOnly` + `layout` + `renderPlayed`). Right-click opens the standard `showMenu` with two items: **Clear this card** (removes from Played display without touching the board, works for any card) and **Discard this card** (own cards only, with `pushUndo` + live zone check).

> v1.7 syntax verified. Runtime test pending (Johan).


## v1.8–v1.10 — auto-deal, discipline search fix, animation speed, draw-click (21 June 2026)

Four improvements on top of v1.7:

- **Auto shuffle+deal on hotseat start (v1.8).** `startHotseat()` now calls `dealOpeningSync()` for every player whose `deckText` is set, immediately after `buildDeck()` and before `serializeGame()` snapshots the board. `boardJson` (resumed saves) and empty boards are unaffected. Online unchanged — the server deals via `dealNow()`.

- **Oblivion (obl) searchable in deck lab (v1.9).** KRCG sends newer disciplines as full names (`"oblivion"`) rather than trigrams (`"obl"`). Added `DISC_ABBR` (inverted `DISC_NAMES`) and a reverse-lookup in `cardTags()` so both forms are always indexed. Fixes `obl:` and `oblivion:` filters, and future-proofs any other discipline KRCG delivers as a full name.

- **Animation length setting (v1.10).** `conv.animSpeed` (0.5–2.0, default 1.0, ±10% steps). Scales `.cfx` clone animation durations via inline `style.animationDuration` on the wrap element and all `.cfximg` children. The `_swapAt` flip-midpoint timeout is also scaled. No-op at 1.0. UI: +/− buttons in Settings → Convenience.

- **Draw-click setting (v1.10).** `conv.drawClick` (`'double'`|`'single'`, default `'double'`). All six draw-capable elements got both `click` and `dblclick` listeners; the click handler skips draw in double-click mode (except Ctrl+click undo, always on click). Crypt draw goes through `influence()`, not `drawCard()`.

> v1.8–v1.10 syntax verified. Runtime test pending (Johan).

## v1.11 – Click-cancel, actor card in play-FX, shuffle riffle animation (21 June 2026)

Three polish additions on top of v1.10:

- **Click to cancel clone animations.** A `click` listener with `{ once: true }` on the `.cfx` wrap element removes it immediately. `#cardFx` has `pointer-events:none` on the host div, but that does not affect children appended inside — the click reaches the wrap correctly.

- **Actor card in the play-FX animation.** `cardFx()` now accepts `opts.actor` (a card object). When present, the actor's card image (`.cfximg.tgt.actor`, 122×170 px — same size as the existing target thumbnail) is prepended to the row via `insertBefore`, giving a left-card → main-card layout. The caption replaces the seat·who label with `opts.actor.name`. Three call sites updated:
  - `tagPlayed` — `actor: activeAnchor()`; `target: curTargetCard(c)`
  - drag-attach (drop on card from hand) — `actor: activeAnchor()`; `target` = the card dropped onto
  - `playOnActive` (double-click hand card when anchor exists) — **was** wrongly sending `{ target: a }` (anchor shown as target-arrow); fixed to `{ actor: a, target: curTargetCard(c)||undefined }`
  - Cross-table gives (`qrGiveToTarget`, `giveTo`, `giveHot`) — no actor, intentionally

- **Shuffle riffle FX.** `shuffleFx(zone)` appends a `.sfx-wrap` inside the pile element(s) for the given zone. Three `.sfx-card` children (with the correct card back image) fan out and fall back over ~0.82 s using `sfxRiffle` keyframes with staggered delays (0/60/120 ms) and per-card custom properties (`--sfx-tx`, `--sfx-r`). A `.sfx-sheen` gold-glimmer overlay fades in/out on top. Both the board pile (`#z-crypt`/`#z-library`) and dock pile (`#dockCrypt`/`#dockLib`) animate simultaneously. Triggered from: `shuffleZone` (local and online paths), `groupShuffleIn`, and both deal/import shuffle calls.

> v1.11 syntax verified. Runtime test pending (Johan).

## v1.12 – SFX library wired to game events (21 June 2026)

Eight sound effects from the SFX demo (`vtes-sfx-demo.html`) hooked to in-game events:

| Event | Sound | Function |
|-------|-------|----------|
| Play card | Blood Slap | `sfxPlayCard()` in `tagPlayed` |
| Unlock (single) | Discipline | `sfxDiscipline()` in `setLocked(c, false)` |
| Lock (single) | Conclave | `sfxConclave()` in `setLocked(c, true)` |
| Pass | Bell Moll (E) | `bell()` replaced with gothic FM bell |
| Oust | Final Death | `sfxFinalDeath()` in `ousted()` |
| Any log event | Warded | `sfxWarded()` in `log()` with 320ms cooldown |
| "Hold on…" phrase | Bell pitch-drop (C) | `sfxHoldOn()` in `showSay` when `i===4` |
| Your turn! | Vessel heartbeat | `heartbeat()` replaced with richer 3-layer version |

Shared audio primitives (`sfxMakeReverb`, `sfxThud`, `sfxNoise`, `sfxOsc`) added — all use the shared `actx` and the existing reverb pattern. No external files, all Web Audio API synthesis inline.

> v1.12 syntax verified. Runtime test pending (Johan).

## v1.13 – SFX volume settings (21 June 2026)

Sound settings added to the Settings panel on top of v1.12:

- **Master SFX volume slider** (0–200%, default 100%) in the Convenience section, above Quick React. Controls all 8 SFX channels simultaneously. Persisted in `conv.sfxVol`.
- **Per-channel volume grid** (Sound effects — per-channel section, after Convenience). 8 sliders in a 2-column grid — one per SFX event (Play card / Blood Slap, Unlock / Discipline, Lock / Conclave, Pass bell / Bell Moll, Oust / Final Death, Log event / Warded, "Hold on…" / Bell pitch-drop, Your turn! / Vessel). Each 0–200%, default 100%, persisted in `conv.sfxIndiv[channelId]`. Grid built dynamically by `buildSfxAdvGrid()` in `openSettings`.
- **`sfxGain(ch, base)`** — shared multiplier function. Returns `base × (conv.sfxVol/100) × (conv.sfxIndiv[ch]/100)`. Called in every named SFX function at the point where gain values are set.

> v1.13 syntax verified. Runtime test pending (Johan).


## v1.14 – Main menu restructure + Tools to right-click (22 June 2026)

Menu reorganised into a cleaner hierarchy:

- **Host…** (sub, shown only when `localTable || (inRoom() && net.isHost)`) → New deal, Reset table, Randomize seating, Save game to file, Load game from file
- **Play…** (sub, always visible) → Online…, Offline — hotseat…, Solo — practice board…
- **Decks…** (sub, always visible) → Load deck…, Deck lab…
- Rulebook / Settings / About (flat, at bottom)

Removed from main menu:
- **Take priority** — already in the PRIORITY bar / Table dock, no longer duplicated here
- **Tools** (coin, dice) — removed from main menu

Tools moved to **right-click / felt context menu** (`openSayMenu`): separator + **🎲 Dice & coin** submenu (🪙 Flip a coin + D4/D6/D8/D10/D12/D20) appended after the phrase list.

**Solo** mode: `openOffline(mode)` now accepts `mode='solo'` — resets `offlineCfg` to one seat (you) before opening the offline modal, so no dummy opponents need to be removed manually.

> v1.14 syntax verified. Runtime test pending (Johan).

## v1.14 – Huvudmenyrenovering (22 juni)

Menyn omstrukturerad till en hierarki med undermenyer. Fullständig struktur i session-journalen. Nyckelkonventioner:

- `…` på föräldrar (Host…/Play…/Decks…), aldrig på löv-val
- Game log + Leave seat visas när `localTable || inRoom()`, med `confirm()` på Leave seat
- Host-undermenyn visas när `localTable || (inRoom() && net.isHost)`
- Solo = `openImport()` (inte `openOffline`) — samma som startskärmens "Play solo"-knapp
- Tools (coin/dice) flyttad till `openSayMenu` (högerklicksmeny), längst ner som `🎲 Dice & coin`
- Hold on… överst i `SAY`-arrayen (index 0), `sfxHoldOn` kontrollerar `i===0`
- SFX master volume default 0% (inte 100%) — nya spelare skräms inte av ljud

## v1.18 – Lokal tournament mode (22 juni)

`conv.tournament` (bool, default `true`) tillagd som lokal inställning. Visas som **Tournament mode**-checkbox överst i Phase helper-sektionen i Settings.

**Prioritetsordning:**
1. `net.helperPolicy` (online) — trumfar alltid
2. `conv.tournament` — gäller bara när `!inRoom()` (ingen online-policy)

`hx(key)` utökad: `if(!p && conv.tournament) return false;` — samma effekt som online tournament men lokalt.

`syncHelperUI` uppdaterad: `#convTournament` gråas ut när man är online (policy tar över); banner visas lokalt med "Tournament mode is on — all helpers are off." Individuella helper-toggles disabled när lokal tournament är på.

`#convTournament`-lyssnare: `conv.tournament=e.target.checked; saveConv(); applyHelper(); syncHelperUI();`

**conv-tabellen tillägg:**
| `tournament` | bool | `true` | Lokal tournament mode — alla helpers av, råa Lackey-känslan |

## v1.17 – Hand zone högerklicksmeny: djupare fix + polish (22 juni)

Fortsättning på v1.16 — tre iterationer för att få menyn att fungera i alla vyer och med rätt visuell feedback:

**DOM-strukturproblemet:** Kort appendas till `#board`, inte `#z-hand`. `closest('#z-hand')` fungerar för tom zon-bakgrund men aldrig för kort. Fix: capture-lyssnaren kollar `state.cards.get(el.dataset.cid).zone==='hand'` för kortdetektering, och `closest('#z-hand')` för tom bakgrund.

**`_menuPinnedHover`** — global som sätts när zone-menyn öppnas på ett handkort, rensas i `hideMenu()`. Används som mutex av:
- `pointerout`-lyssnaren → kortet förblir lyftat (`handhover`) medan menyn är öppen
- `pointermove` på `board` + `rview` → docken stängs inte när musen rör sig till menyn ovanför

**Kortets `contextmenu`-lyssnare** ändrad: för handkort anropas `e.preventDefault(); e.stopPropagation(); return;` — hindrar `cardMenu` från att öppnas, låter capture ta hand om allt.

**Kortnamn i Selected-labels:** `_sel.name` injiceras dynamiskt när menyn byggs, t.ex. `Selected (Govern the Unaligned)`.

## v1.16 – Hand zone högerklicksmeny ombyggd (22 juni)

`#z-hand` contextmenu ersatt med en hierarkisk undermenystruktur. Tre nya lägen: zone-wide bulk-operationer, Selected (kräver hover), och Random X (prompt för antal).

**Ny menystruktur:**
- **Play card…** → Face-up / Face-down (Selected)
- **Discard card…** → Random X… / Selected
- **Return card to library…** → Random X… (→ Top/Bottom/Shuffle in) / Selected… (→ Top/Bottom/Shuffle in)
- **Burn card…** → Random X… / Selected
- ─── separator ───
- **Shuffle library**
- ─── separator (om `hx('hand')`) ───
- Max hand size +1 / -1 / Reset (oförändrade)

**Nya hjälpfunktioner** (efter `discardRandomHand`):
`_promptN`, `_randomSubset`, `discardRandomHandN`, `burnRandomHandN`, `returnRandomHandN(pos)`, `_requireSelected(fn)`

**`_lastHandHover`** — ny modul-global (rad ~1983) satt i pointerover-lyssnaren. Kvarstår efter hover — sista hovrade handkortet = "selected".

**Ej implementerade (återkommer):** Reveal…, Browse → Search/Show & shuffle, Play with open hand.

## v1.15 – Skift-logg interaktivitet (22 juni)

- Kortvisning vid hover: `.show.peeking { pointer-events:auto }` + `logInspectRender` med `s=2.619` (~220px bred, matchar hoverCard)
- Scroll: `wheel`-lyssnare på `#logPeekList` med `e.preventDefault()` kringgår Shift+scroll=horisontell-beteendet
- Tab-hover parkerad (kommenterad) — Shift räcker

> v1.14–v1.15 syntax verifierat. Runtime-test kvar hos Johan.


## v1.19 – Bugfix: conv TDZ-krasch (22 juni)

**Rotorsak:** `hx()` innehöll `if(!p && conv.tournament) return false;` (tillagt i v1.18). `hx()` anropas av `applyHelper()` som ett top-level statement (rad ~4884 i HTML). `conv` deklarerades med `let` på rad ~8283 — långt efter. `let`/`const` hoistas inte ur sin temporal dead zone, vilket ger **"Cannot access 'conv' before initialization"** och kraschar hela scriptet vid laddning. Event-lyssnare sattes aldrig upp → inga knappar fungerade.

**Fix:** Hela conv-blocket (`const CONV_KEY` + `let conv={}` + localStorage-parsningen) flyttades till direkt efter `net`-deklarationen tidigt i scriptet. `animMode=conv.anim; applyPco();` lämnades kvar på ursprungsplatsen (de beror på `animMode` som deklareras sent).

**Lärdom → se learnings.md**

## v1.19–v1.20 – Hand reveal + 3-level menus (22 June 2026)

### Hand reveal to opponents
A hand-zone right-click action: **Reveal… → Hand… / Random X… / Selected… → All players / [per player]**. Implemented in `revealHandTo(cards, toSeat)` with `toSeat` a seat number or `'all'`. Card-mechanic support (some VTES cards reveal hand cards).

Log orientation:
- **Sender** sees "You revealed to <recipient/everyone>: <cards>" with `data-cid` card links (owns the cards).
- **Recipient** sees "<sender> revealed to you: <cards>" with `data-name` links.
- **Public line** ("X revealed their hand to Y", no card names) shows only to non-recipients. Online: the server distributes it to third parties (not the sender, not the recipient). Reveal-to-all has no public line (everyone is a recipient).

`cardFx` gained `kind='handreveal'` — a multi-card clone animation tagged separately from `play` (CSS `.cfx.handreveal`). It does NOT broadcast via `t:'fx'`; reveal routing goes through the dedicated `t:'revealHand'` verb.

Protocol `t:'revealHand'`: `{cards:[{name,kind}], to: seat|'all', pub}` → server sends the private card list only to recipient(s), and the public line to third parties.

### `log()` privateLine parameter
`log(msg, localOnly, privateLine)` — a third arg. Private lines (all reveal lines) display live but are never pushed to `curLines`, so they never reach the per-turn archive, the `.txt` download, or the autosave. Only public lines are archived/persisted.

### 3-level context menus
The menu system originally had one `#submenu` panel (2 levels). Reveal and Return-to-library are 3 levels deep, so a third panel `#submenu2` was added. `_childOf(el)` maps menu→submenu→submenu2; hovering a sub-item opens the child panel, hovering a leaf closes it. **Z-index: all three panels at 8000/8010/8020** — above `.card.handhover` (4800 !important) and `#poolWrap` in L2 dock (4700), below `#logInspect` (8600) / `#hoverCard` (9000) / `#cardTip` (9999). Earlier attempts using close-delay timers and pointer-events juggling caused new bugs; the clean fix is just the extra panel + correct z-index.

### Log card preview supports `data-name`
`findInspect(cid, name)` now falls back to a synthetic card (`synthetic:true`) when there's no live card for the cid but a name is present — so revealed cards (which the recipient doesn't own) still show their image on hover. `logInspectRender` renders synthetic cards as a plain image; `previewName(name)` feeds the left-panel viewer. All three hover paths (`#log` ctrl/panel, outside-click guard, `#logPeek` Shift-log) match `.clog[data-cid],.clog[data-name]`.

### Hotseat ↔ online divergence (reveal)
Hotseat uses ONE shared table log across all seats (`setActivePlayer` → `restoreGame(..., {keepLog:true})`, which doesn't touch the visible log). There is no per-seat log to write into. So a hotseat reveal shows only the sender's single line + one animation; an online recipient's private "X revealed to you" line cannot be reproduced in hotseat without a per-seat-log rearchitecture. Deliberate trade-off — build online carefully and verify the recipient view live when it matters.

## v1.21 – Pool glob reachable with the dock collapsed (22 June 2026)

Bugfix. In L2 Home (and L3 Helicopter) the pool glob's right-click menu (Set pool / Ousted / Burned cards), the +/- buttons and scroll-to-adjust only worked while the bottom dock (Crypt/Library/Ash heap/Hand) was unfolded. Folded down, a right-click on the glob produced the generic quick-phrase menu instead.

**Root cause:** `#poolWrap` carries no z-index of its own. The z-index lift to 4700 was scoped to `.l2dockopen` only (CSS ~line 476), so when the dock was collapsed `#poolWrap` fell back to auto z-index — *below* the collapsed dock handle `#l2dock` (z-4410), which sits over the bottom strip and overlaps the pool zone. `#l2dock` is **not** in the `board` contextmenu bail-list (`.card,...,#poolWrap,...`), so the right-click landed on the handle, bubbled to `board` → `openSayMenu`. The `document` fallback also fires only when `!e.defaultPrevented`, and since the poolWrap listener never ran, nothing prevented it.

**Fix (CSS only):**
- L2 solo/columns (~line 476): dropped the `.l2dockopen` qualifier so `#poolWrap{ z-index:4700 }` applies in **both** dock states. Purely additive for the collapsed state (dock cards are `display:none` then) and identical to before when open → zero regression risk.
- L3 (~line 803): bumped `#board.l3mode #poolWrap` from `z-index:40` to **4500** — above the dock handle (4410) and dockbg (4400) so the pool stays interactive with the dock collapsed, but **below** the dock cards (4600) so it can never cover them when the dock is open.

**Not a duplicate element:** there is only one `#poolWrap`; there is no second "drawn" pool glob inside the dock. The faint visual difference when the dock is open is just `#l2dockbg` (the dark gradient, z-4400, bottom 32%) showing through the transparent parts of the framed pool box behind the glob. Collapsed → no dockbg → glob sits on plain felt. The fix does not change the collapsed-state appearance.

> v1.21 is CSS-only; client JS syntax verified. Runtime/visual test pending (Johan): confirm the pool right-click menu, +/- and scroll work in L2 Home **and** L3 Helicopter with the dock folded down, and that nothing odd stacks over the L3 pool when the dock is open.

## v1.22 – Own pool glob conditional during a Visit (22 June 2026)

Refinement on top of v1.21. While visiting an opponent (`body.invisit`, an L2 seat visit), your *own* pool glob is now tied to the dock:

- **Dock collapsed** -> your `#poolWrap` is hidden (`display:none`), so the opponent's pool globe (drawn on the `#rview` mat) shows through. You're focused on their board.
- **Dock unfolded** -> your `#poolWrap` reappears (and the v1.21 z-4700 lift keeps it above the `#rview` overlay at 3500, so it's reachable). This lets you spend/reduce your own pool *on the spot* during an action that costs you pool while you're reviewing their board — no trip back home.

**Fix (CSS only, one rule)** added beside the other Visit template exceptions (~line 491):
`body.invisit #board:not(.l2dockopen) #poolWrap{ display:none; }`

This only affects opponent visits — L2 Home and L3 are untouched (`body.invisit` is set only when `typeof net.view==='number'`, toggled in `switchView`). A visit keeps L2 mode (so the real L2 dock is present), which is exactly why the dockopen test works here.

> v1.22 is CSS-only; client JS syntax verified. Runtime/visual test pending (Johan): in an L2 Visit, confirm your own pool glob hides with the dock folded down (opponent's globe visible) and reappears + is right-clickable / +-/scroll-adjustable with the dock unfolded.

## v1.23 – Opponent pool globe matches your own exactly (22 June 2026)

Cosmetic precision fix. In an L2 Visit the opponent's pool globe rendered ~4% larger than your own live globe.

**Cause:** your live `#pool` is a fixed **96px** globe (in the 1004x616 design stage), shown at `96 * l2pub.s` in L2. The opponent globe (`buildMat`, ~line 6938) was sized from the pool *zone* rect: `gd = min(s*cz.pl.w*0.86, s*cz.pl.h*0.60)`, which for the canonical pool zone (135.54 x 166.32) resolves to `99.79 * s` — a hair bigger than `96 * s`. When the two view scales align (your home frame and the visit mat fill the same area), the result is the visible ~4% (99.79/96 = 1.039) size difference.

**Fix:** express the opponent globe as the *same fraction of the pool zone* the live 96px globe occupies, derived from the same `L2GEO` constants:
`const GW=96/(L2GEO.pool.w*1004), GH=96/(L2GEO.pool.h*616); gd=max(16, min(s*cz.pl.w*GW, s*cz.pl.h*GH));`
For a real opponent (`buildPub` always sends `bw:1004, bh:616`) both products equal `96 * s`, so the globe is now the live 96px globe scaled by the mat scale — pixel-for-pixel identical to your own when the scales align. The `k=gd/96` shadow factor now resolves to `s` (cleaner; shadows scale with the mat like everything else). Font ratio (`gd*0.333`) unchanged (matches the live `32px/96px`).

> v1.23 client JS syntax verified. Runtime/visual test pending (Johan): in an L2 Visit with the dock unfolded, eyeball your own globe against the opponent's — they should now read identical. (Locally-fabricated practice opponents send `bw:W,bh:H`, so their globe tracks the live proportion rather than a literal 96px — expected.)

## v1.24 – Opponent pool right-click: public piles (ash heap + burned) (22 June 2026)

The opponent pool right-click menu (visit + L3) gained a second public pile and is now reachable on the whole globe/zone, not just the tiny "Pool N" text.

- **`viewOppBurned(seat)`** added next to `viewOppAsh(seat)` — same read-only browse-modal pattern, filters `pub.cards` for `zone==='burned'` (burned is in `PUBZ`, so it ships in every public board). `browseZone='burned'; browseDirty=false` → the close handler only reshuffles library/crypt, so nothing destructive happens.
- The opponent-pool capture-phase contextmenu listener now shows **both** options with live counts: `🜂 View their ash heap (n)` + `🔥 View their burned cards (n)`. Counts come from `(net.boards[seat].pub.cards)` filtered by zone.
- **Hit area widened:** in `buildMat`, the pool **zone box**, the **globe** (L2/visit), and the **L3 pool value** now carry `data-seat` + class `matpool` (gated `!me && seat!=null`), so right-clicking anywhere on the opponent's pool opens the menu. `zbox` now returns its element so the pool box can be tagged. `.matpool` has no CSS of its own — pure behavioural hook — so tagging adds no visual change (only a `context-menu` cursor + title).
- Works in **both transports**: `net.boards[seat].pub` is populated identically (online relay `m.pub`, hotseat `setActivePlayer`→`buildPub()`), both carrying the canonical board.

> v1.24 client JS syntax verified. Runtime test pending (Johan): in a visit AND in L3, right-click an opponent's globe / pool zone → both pile views open and show the right cards; confirm in hotseat and online.

## v1.25 – Host control on the opponent pool menu (22 June 2026)

Full host control built (Johan chose the unrestricted option). The opponent pool right-click menu (visit + L3) now shows, for the host (`localTable || (inRoom() && net.isHost)`), below the public-pile items:
- **⚙ Set their pool…** — `hostSetPoolPrompt(seat, name, current)`.
- **💀 Oust this player…** / **↩ Return them to the game** — `hostOustSeat(seat, name, undo)`, toggling on the target's `out` flag.

**Authority split (because pool is client-authored, `out`/VP are server-authoritative):**
- **Oust (online):** server verb `{t:'hostOust', seat}` (host-token checked) mirrors the `bounty` handler — sets `q.out=true`, awards the immediate predator +1 VP server-side + relays `{t:'bounty'}` (the +6) to the predator's client, `sys()`-logs, `rosterUpd`. Works even if the target is **disconnected**. It also relays `{t:'forceOust'}` to the target (if connected) → their client runs `ousted({forced:true})` to return cards (cosmetic).
- **Set pool (online):** `{t:'hostSetPool', seat, val}` → server relays `{t:'forceSetPool', val}` to the target's socket → their client sets `state.pool` + `schedulePush()` (rebroadcast). **Only lands if the target is connected** (present-but-idle AFK is fine); a disconnected target can't apply it — host can oust instead.
- **Un-oust (online):** `{t:'hostUnoust', seat}` → clears `q.out`, `sys`, `rosterUpd`.
- **Hotseat:** all local. `hostSetPoolHot` edits the stored `net.hot.boards[seat]` blob (+ live `net.boards[seat].pub`). `hostOustHot` marks the roster seat out, calls `awardBountyHot(seat)` (now takes an optional oust seat), zeroes the stored pool/edge. `hostUnoustHot` clears out. Each refreshes the on-screen mat (`switchView`/`renderL3`).

**`ousted(opts)` gained an `opts.forced` path:** skips the `confirm()`, skips the self-bounty `mpSend({t:'bounty'})` (the server already awarded it on host-oust), and makes the three oust narrative `log()` lines `localOnly` (the server `sys()`-logs the authoritative line, so no duplicate). All existing `ousted()` callers pass nothing → unchanged.

**New protocol verbs:** client→server `hostSetPool` / `hostOust` / `hostUnoust`; server→client `forceSetPool` / `forceOust`. All wire-compatible additions (the server's verb chain ends in a benign `else`, so a new client against an old server just no-ops the host action — no crash). `VERSION` left as-is (these don't change the save/handshake format; consistent with prior practice where VERSION tracks save format, not feature count).

> v1.25 client + server JS syntax verified. NOT runtime-tested (sandbox can't run the server or multiplayer). Johan to verify live: (1) host sets a connected opponent's pool in an online game; (2) host ousts a connected opponent (cards return, predator gets +6/+1 VP) AND an AFK/disconnected opponent (server marks out + awards predator even with no client response); (3) un-oust; (4) the same Set pool / Oust on a stored seat in hotseat. Worth a run of the server test suite too.

## v1.26 – Table-panel rows open the pool menu (22 June 2026)

The fold-out **Table** panel (`#statsDock`, rows built by `statRow`) now answers right-clicks: each player row opens the very same pool right-click menu you'd get on that seat's pool globe — and it follows *what you may see* of that seat.

- **Opponent row** -> `oppPoolMenuItems(seat)`: 🜂 ash heap (n) + 🔥 burned cards (n) (both public). For the **host** (`localTable || (inRoom() && net.isHost)`) it also gets ⚙ Set their pool… and 💀 Oust / ↩ Return — identical to the globe menu.
- **Your own row** -> `selfPoolMenuItems()`: 🜂 your ash heap + 🔥 burned cards (interactive `browse`, you can retrieve), then ⚙ Set pool… and 💀 Ousted… / ↩ Return to the game (always yours, host or not).
- Works in **both transports** unchanged — opponent data reads from `net.boards[seat].pub` (online relay or hotseat `buildPub`), your own from `state`.

**Single-sourced opponent menu:** the opponent menu body was extracted from the global `.matpool` capture-phase listener into **`oppPoolMenuItems(seat)`**, now called by both the listener and the Table row — so the globe menu and the panel menu can never drift apart. `selfPoolMenuItems()` is the parallel for your own seat (it does *not* alter the existing `#poolWrap` glob menu, which still omits ash heap — the panel row is the richer entry point).

**Row handler guards (in `statRow`):** skips vacant seats, skips when the right-click lands on a host mod button (`.smbtn`, so mute/demote/kick keep their own behaviour), and requires a seat for opponent rows. `o.me` is checked first (your own online row also carries `seat`).

> v1.26 client JS syntax verified (the load harness isn't in this project snapshot, so only the syntax gate ran). Runtime test pending (Johan): right-click rows in the Table panel — opponent row shows ash/burned (+ host controls as host), your own row shows ash/burned + set pool + ousted; confirm in solo, hotseat and online.

## v1.27 – Table panel grid layout (22 June 2026)

The Table panel (`#statsPanel`) was restyled from a ragged flex row to a proper CSS grid so player names never push the stats columns onto a second line.

**Layout:** `#statsPanel` widened from 284px → 310px. Each `.srow` is now `display:grid` with **7 fixed columns**: `14px | 1fr | 30px | 34px | 34px | 30px | auto` = `[lead] [name] [pool] [lib] [minions] [vp] [mod-buttons]`. The name column is the only `1fr` and gets `overflow:hidden; white-space:nowrap; text-overflow:ellipsis`, so long names truncate gracefully instead of wrapping.

**Cells per row:**
- **col 1 – `.slead`**: inline-flex with turn indicator (▶) + colour dot (`.scol`). When no colour dot is available (solo/spectator view), falls back to a seat-number badge (`.sseat`, muted brass text).
- **col 2 – `.sncell`**: name (`.sn`), host ★, oust 💀, status (reconnecting/open), muted 🔇.
- **col 3 – `.spool` / `.sedge`**: pool number; turns into "EDGE" badge (red) when the player holds the edge.
- **col 4 – `.slib`**: 📚 + library count.
- **col 5 – `.smin`**: 🧛 + minion count.
- **col 6 – `.svp`**: 🏆 + VP (clickable for you / host in hotseat).
- **col 7 – `.smod`**: host mod buttons (mute/demote/kick) — `auto` width, collapses when absent.

**Header row:** `renderStats` prepends a `.srow-hdr` with matching `grid-template-columns` and Cinzel labels (Pool / 📚 / 🧛 / 🏆).

**`.smbtn` / `smod` CSS unchanged** (they live in col 7 which is `auto`, so they still look the same). `hover` background still works because `.srow` itself keeps `border-radius` and the bg rule applies to the grid container, not `display:contents`.

> v1.27 CSS+JS syntax verified. Runtime test pending (Johan): open Table panel in solo, hotseat, and online; check that all columns align across players; long names truncate with ellipsis; turn indicator, colour dot, pool, lib, minion and VP columns stay in their columns regardless of name length; host mod buttons appear correctly for the host.

## v1.28 – Table panel bug fixes: dot+triangle overlap, right-click menu (22 June 2026)

Two bugs introduced in v1.27 fixed:

**Bug 1 – turn-indicator + colour dot both shown simultaneously.** `leadHtml` previously always included `dot` alongside `turnSpan`, so when it was a player's turn the colour dot appeared jammed beside/behind the triangle in col 1. Fix: `leadHtml` now branches on `o.turn` — when it's that player's turn, the col-1 cell shows **only the triangle** (coloured with their seat hex via `style="color:..."` on `.sturn`); when it's not their turn, it shows **the dot OR the seat-number fallback** as before.

**Bug 2 – Table panel rows showed the quick-phrase menu instead of the pool menu on right-click.** The v1.26 contextmenu listener was applied to the row element `d`, but the global board contextmenu handler (`openSayMenu`, listening on `document` at bubble phase) was firing instead. The row listener called `e.preventDefault() + e.stopPropagation()`, which should have been enough — but the v1.26 edits were accidentally lost when v1.27 rebuilt from the project source instead of chaining from the v1.26 output. This delivery re-applies both patches in a single pass from the clean v1.25 base. Both listeners are now present and the stopPropagation prevents the board handler from seeing the event.

> v1.28 CSS+JS syntax verified. Runtime tests pending (Johan): (1) turn indicator — triangle only, no dot alongside it, triangle coloured with the seat's colour; (2) right-click any Table-panel row — own row → ash/burned + set pool + ousted; opponent row → ash/burned (+ host controls as host); (3) all v1.27 column alignment still holds.

## v1.29 – Play with open hand (standing hand-reveal grant) (22 June 2026)

A persistent "open hand" grant: a player can let one chosen opponent — or all players — inspect their hand at will, the standing-subscription counterpart to the one-shot `revealHand`. A deliberate, scoped exception to the hidden-hand secrecy rule.

**Granter side — hand right-click menu.** Below `Reveal…` a new branch **`Play with open hand…`** (label flips to **`Open hand (on)…`** while any grant is active) with `_openHandMenu()`:
- Grant targets: **All players**, then each living opponent not already granted.
- Revoke section (only when a grant is active): **■ Stop: <name>** per grantee, **■ Stop: all players** (when 'all' is active), and **■ Stop: everyone** (when >1 individual grant).

**State & persistence.** `state.openHand` — an array of seat numbers and/or the `'all'` sentinel (`'all'` supersedes individual grants). Serialized in `serializeGame`/`restoreGame` (survives save/load + hotseat swaps, per Johan's choice), reset in `clearTable`. **Deliberately NOT in the undo `snapshot()`** — a grant is a social action, so undoing a card move must not silently toggle it.

**Live re-push.** `refreshOpenHands()` is hooked into `schedulePush()` (the universal board-change point, beside `pushEscrow()`), so every hand change online re-pushes the live hand to every active grantee. Hotseat/solo grantees read the stored/live board directly — no push.

**Grantee side.** `net.openHandFrom = { seat -> [cardInfos] }` holds live-pushed hands (online). `openHandCardsFor(seat)` resolves the hand: online from `net.openHandFrom`; **hotseat by parsing the granter's stored `net.hot.boards[seat]` blob** (checks its `openHand` includes my seat or `'all'`, then maps `zones.hand`→`cards`). `canSeeOpenHand(seat)` gates the menu item. `viewOppHand(seat)` is the read-only inspector overlay (reuses `#browseModal`, `browseZone='openhand'`, no take/reshuffle — same pattern as `viewOppAsh`/`viewOppBurned`).

**Where the inspect item appears.** `oppPoolMenuItems(seat)` gets **👁 Inspect their hand (n)** `unshift`ed to the top when `canSeeOpenHand(seat)`. Because the Table-panel row and the pool globe/zone both call `oppPoolMenuItems`, the item shows in **both** the pool zone right-click menu (L2 Visit / L3) and the Table tab row — automatically, no extra wiring.

**Visibility.** Grant and revoke each emit a **public, archived** `log(..., true)` line ("X is now playing with an open hand toward Y" / "X stopped…"), per Johan's choice.

**Protocol (wire-compatible additions).** client→server `openHand {to: seat|'all', cards:[...]}` and `openHand {to, revoke:true}`; server→client `openHandGrant {from, seat, who, cards}` / `openHandRevoke {from, seat}`. Server handler mirrors `revealHand`'s trust model (card names leave the client in clear, server routes them; `cleanCard`-sanitised, capped at 30). The grantee client stores/clears `net.openHandFrom[seat]` and closes the inspector if open on a revoked seat. `VERSION` left at 1.6 — `openHand` is an additive save field (old clients ignore it; the server verb chain's benign `else` no-ops an unknown verb), consistent with the v1.25 precedent.

> v1.29 client + server JS syntax verified (no load harness in this snapshot). NOT runtime-tested (sandbox can't render or run the server/multiplayer). Johan to verify live: (1) online — grant to one opponent, confirm only they get 👁 Inspect their hand on your pool/Table row and the contents match; draw/play a card and confirm their inspector reflects it live; revoke and confirm the item disappears; (2) grant to all; (3) hotseat — grant from seat A, switch to seat B, confirm B sees A's open hand via the stored blob; (4) save & load mid-grant, confirm the grant persists; (5) the public log lines appear for third parties.

## v1.30 – Ctrl+hover lupp in browse modal (22 June 2026)

Ctrl+hover card preview now works inside `#browseModal` (ash heap, burned cards, open hand, online library/crypt browse) — without requiring the left panel to be collapsed.

**Two changes:**
- **`data-card-name` stamped on every `.bcard`** at creation time in all five builders: `browse()`, `viewOppAsh()`, `viewOppBurned()`, `viewOppHand()`, `netBrowseOpen()`. Face-down cards are skipped (no name leaks).
- **Gate relaxed in the lupp handlers** (`pointermove` + `keydown('Control')`): the condition was `asideCollapsed`; now it also fires when `lastCardEl` is a `.bcard` (i.e. a browse-modal card is under the pointer), regardless of panel state. The existing `lastCardEl` selector is extended with `.bcard[data-card-name]`.

`showHoverFor` is unchanged — it already reads `el.dataset.cardName` and positions the overlay at the pointer. No server change.

> v1.30 client JS syntax verified. Runtime test pending (Johan): open ash heap / burned / open hand overlay, hold Ctrl and hover a card — full-size preview should appear at the pointer whether the left panel is open or closed.

## v1.31 – Hand menu cleanup (22 June 2026)

Two small UX fixes in the hand zone right-click menu:
- **"Play with open hand…" moved into the `Reveal…` submenu** (as the last item, after a separator). It's semantically a reveal-family action and belongs there rather than as a top-level sibling.
- **"Shuffle library" removed from the hand menu** — it was contextually misplaced; the library right-click menu is the natural home for it.

## v1.32 – Scroll to adjust max hand size + token permanence clarification (22 June 2026)

**Token permanence (confirmed, no code change):** blood/blue/green counters survive pass-skiften. `pass()` kallar varken `clearTable` eller nollställer tokens; de serialiseras i `serializeGame()` och `snapshot()`. Designat beteende — vampyrer bär sina counters mellan rundor.

**Scroll on `#z-hand` to adjust max hand size:** `#z-hand` fick en `wheel`-lyssnare (passive:false, 200ms cooldown, samma mönster som kort-wheeln) som kallar `adjustMaxHand(±1)` + `renderHand()`. Gatas på `hx('hand')` — samma flagga som hand-size-menyn och draw-varningen. `cnt-hand` uppdateras nu till `n/maxHand` (t.ex. `3/7`), och `#z-hand.title` sätts till en helpful tooltip som bekräftar scroll-beteendet.

## v1.47 – Target from opponent ash heap browse (22 June 2026)

Double-clicking a card in `viewOppAsh` now sets/clears it as the active remote target via `setRTarget`, using the same log line and target-button highlight as targeting a card in play.

**`viewOppAsh(seat)`:** Each `.bcard` gets a `dblclick` listener. On double-click: clears the `.btarget` CSS class from all cards in the grid, then checks `net.rtarget` — if the card is already the current target, calls `setRTarget(null)` (clears); otherwise adds `.btarget` to the element and calls `setRTarget({seat, cid, who, name, faceDown})`. When the modal opens, any card that is already `net.rtarget` gets `.btarget` immediately so the mark is visible from the start. Note text updated to `'Public pile — double-click a card to set/clear target.'`

**CSS `.bcard.btarget`:** crimson `box-shadow` ring on `.bimg` + red `.bname` text + `⌖` reticle symbol via `::before` on `.bcard.btarget` (positioned `top:-2px; left:50%`). `.bcard.btarget` gets `position:relative` so the pseudo-element is anchored correctly. The `⌖` is placed on `.bcard` (not `.bimg`) to avoid being clipped by `.bimg`'s `overflow:hidden`.

**Why `setRTarget` and not a local-only flag:** `setRTarget` logs the target openly ("⌖ Target: Name."), updates the target button, and syncs via `schedulePush` — exactly what targeting in play does. The ash heap card not being in `COUNTER_ZONES` is intentional: the target is a communication tool ("I want you to burn this"), not an action target, so it persisting until manually cleared or the board updates is correct.


## v1.46 – Burn X random from ash heap (22 June 2026)

New `burnRandomAshN()` function alongside the existing single-card `burnRandomAsh()`. Prompts for a count via `_promptN`, then picks that many distinct random cards from `state.zones.ash` via `_randomSubset`, burns each (`move(c,'burned')`), logs each with `cardRef(c)`, and adds a summary line when n>1.

**Menu label** `'Burn random card'` → `'Burn X random…'` pointing to the new N-variant. **Shortcut `burnRndAsh`** also updated to call `burnRandomAshN` (the single-card function is preserved in code but no longer wired to anything by default). No server changes — ash heap is always a local pile.


## v1.45 – Ash heap browse consolidated into submenu (22 June 2026)

The two separate ash heap browse actions ("Browse…" and "Burn a card… (choose)") are replaced by a single **Browse…** entry with three submenu items available everywhere the ash heap can be opened:

- **View only** — opens the modal with no action listener; cards can be Ctrl+hovered for preview but cannot be interacted with.
- **Pick card(s)** — double-click any card to move it to hand (previous v1.44 behaviour). Modal stays open; pick as many as you want.
- **Burn card(s)** — double-click any card to burn it. Modal stays open; burn as many as you want.

**`browse()` changes:**
- New `mode==='view'` arm: title prefix `'View: '`, note `'Public pile — view only. Ctrl+hover for card preview.'`, no event listener attached to `.bcard` elements (but `data-card-name` is still set, so Ctrl+hover works).
- `mode==='burn'` listener changed from `click` to `dblclick` — consistent with pick, avoids accidental burns.
- `_titlePfx` local: `'Burn — '` / `'View: '` / `'Browse: '`.

**Entry points updated** (all now show the three-item submenu):
- `#z-ash` click listener
- `#z-ash` contextmenu → `Browse…` sub (replaces flat `Browse…` + `Burn a card… (choose)`)
- `#dockAsh` click listener
- `selfPoolMenuItems()` pool right-click → `Browse ash heap (N)…` sub

**Shortcut `browseAsh`** still calls `browse('ash')` directly (pick mode) — keyboard shortcuts skip the menu, which is the right default.


## v1.44 – Ash heap browse: double-click to fetch + hover-able log (22 June 2026)

Ash heap `Browse…` now requires a **double-click** to take a card (was single-click). The ash heap is a public zone with no hidden-information implications, but the dblclick convention matches library and crypt, prevents accidental picks, and is consistent across all browse-to-hand paths.

**`browse()` `else`-block split:** the shared `else { d.addEventListener('click', ...) }` is now split into `else if(z==='ash')` (dblclick) and `else` (click, burned pile only). This matches the library/crypt branching style added in v1.33/v1.41.

**Log text improved:** was `'<b>'+escapeHtml(c.name)+'</b> was fetched from the ash heap.'` — now `cardRefCap(c)+' was fetched from the ash heap.'`. `cardRefCap` produces `<b class="clog" data-cid="...">Name</b>`, which makes the card name clickable/hoverable in the log (hover to preview in the aside, Ctrl+hover when collapsed). Same fix applied to burned pile log (was identical pattern).

**`browseNote` text added for ash:** `'Double-click a card to return it to your hand. The ash heap is public — the card name is logged openly.'` (was empty string for non-library, non-crypt zones).

**No reveal-menu for ash:** unlike the library (where the fetched card is secret), ash heap cards are public knowledge. The log line openly names the card (`cardRefCap`), which is correct VTES behaviour — no "Keep secret / Reveal to…" prompt needed.

**No network change:** `browse('ash')` is always offline (the early-return for `netGame()` only applies to library and crypt). No server-side patch needed.


## v1.43 – Attached cards stay with host in uncontrolled/torpor (22 June 2026)

Two-line change that makes attached library cards follow a vampire when it moves to the uncontrolled or torpor zone (via card effects), while remaining visually stacked under it.

**`move()` (line 2155):** `zone!=='ready'` → `!COUNTER_ZONES.includes(zone)`. Since `COUNTER_ZONES = ['ready','uncontrolled','torpor']`, this prevents `releaseChildren` from firing when the host moves between any of these three zones. Children retain their `c.host` reference and stay in `state.zones.ready`.

**`layoutZone()` torpor/uncontrolled branch:** Added `if(c.host) return` guard (safety, prevents rendering a child twice), then after placing each host card renders its attached children with the same `CX`/`CY` stack offsets used in the ready region: `place(kc, hx+CX*(k+1), hy-CY*(k+1), ...)` + `classList.add('stkk')`. Children in `state.zones.ready` are already skipped by ready's `if(c.host) return` — so they're rendered only once, by the uncontrolled/torpor pass.

**Why it's safe:** serialization (snapshot/restoreSnap) saves and restores `host` + `attached` arrays as-is, so undo/autosave/online-sync all work. When the vampire later returns to ready (enters play), `move(host, 'ready')` doesn't call `releaseChildren` (since we're going *to* 'ready'), so children come along — ready layout then renders them stacked, exactly as before.

**Not changed:** torpor stack rendering is also improved as a side-effect (torpor is in COUNTER_ZONES), though the primary use case is uncontrolled.

## v1.42 – Prevent cross-deck contamination in dropCard (22 June 2026)

Three guard fixes in `dropCard()`. `groupDrop()` was already correct (it uses `m.c.kind` to route each card to its own pile); `move()` only guarded crypt→ash. The drag path `dropCard` had no kind checks.

- **Pile drop (z==='library'||z==='crypt'):** `move(c, z)` → `move(c, dest)` where `dest = c.kind==='crypt'?'crypt':'library'`. Dropping a crypt card on the library pile (or vice versa) now silently routes it to its own pile. Mirrors what `groupDrop` already did.
- **Hand drop (z==='hand'):** Added `if(c.kind==='crypt'){ layout(); return; }` — crypt vampires dragged to the hand zone are silently rejected (no log, no move).
- **Uncontrolled drop (z==='uncontrolled'):** Added `if(c.kind!=='crypt'){ layout(); return; }` — library cards dragged to the uncontrolled zone are silently rejected. Crypt cards continue to work (this is the standard drag-to-influence path).

Note: attached children (library cards on a vampire) don't follow the host to uncontrolled anyway — `move()` calls `releaseChildren()` for non-ready destinations, so they stay in ready. The guard is still correct and safe.

## v1.41 – Crypt browse: dblclick to fetch + always reshuffle (22 June 2026)

Mirrors the library browse changes from v1.33, applied to the crypt in both browse paths:

**Offline `browse()` function:**
- Crypt branch split out of the shared `else` into its own `else if(z==='crypt')` block, changing the listener from `click` to `dblclick`. Ash heap and burned pile retain single-click (unchanged).
- Note text updated: `'Double-click a card to fetch it. The crypt is always reshuffled when you close.'`

**`#browseClose` handler:** `browseDirty &&` guard removed for crypt — `shuffleZone('crypt')` now fires unconditionally when `browseZone==='crypt'`, matching library behaviour.

**Online `netBrowseOpen()` function:**
- `click` listener changed to `dblclick` (fixes library too — single-click fetch was a v1.33 omission in the online path).
- Note text made pile-specific: crypt gets the new text; library gets `'Double-click a card to fetch it. The library is always reshuffled when you close.'`

## v1.40 – Crypt pile drag-to-influence / drag-to-park (22 June 2026)

Mirror of the library's drag-to-draw / drag-to-park feature (v1.35), adapted for crypt:

- **Drop on `#z-uncontrolled`** → calls `influence()` (draw 1 crypt card to the uncontrolled region)
- **Drop on ready region** → parks the top card face-down at the exact drop position (offline: direct move; online: `pendingRevealDrop + mpSend({t:'reveal', kind:'crypt', n:1})`)
- **Drop elsewhere** → cancelled, nothing happens

**Ghost:** `#cryptDragGhost` fixed-position div, crypt card-back image (`cardbackcrypt.jpg`), same 84×118 px / 78% opacity / `translate(-50%,-60%)` as the library ghost. Ring colours: **purple (`#8e44ad`)** = uncontrolled, **green (`#5ba85b`)** = ready (same green as library).

**Dock close on drag start:** when `cd.started` becomes true, the IIFE explicitly closes the dock panel so the drop targets (ready and uncontrolled, both above the dock) are unobstructed: `setL2Dock(false)` for L2/L3 home dock, `closeHand()` for the visit `#handPeek` panel.

**Wired to** `['#z-crypt','#dockCrypt']` via `forEach` — same two elements as the context menu. Uses `setPointerCapture` + global `pointermove`/`pointerup` listeners; 5 px movement threshold. Known caveat (same as library): sub-threshold tap on crypt while pointer is captured is silenced by `preventDefault` on `pointerdown`.

## v1.39 – Reveal top X from crypt (park face down) (22 June 2026)

New `revealTopCrypt()` function mirroring `revealTop()`. Prompts for a count, pops that many cards from `state.zones.crypt`, moves each to 'ready' face-down with the same staggered X offset as the library variant. Online: sends `{t:'reveal', kind:'crypt', n}`.

**Server `reveal` handler** extended: `isCrypt = m.kind==='crypt'` selects `p.game.crypt` vs `p.game.lib`. Response now always includes `kind: isCrypt ? 'crypt' : 'lib'` so the client knows which pile the cards came from. Wire-compatible: old client receives `kind:'lib'` and falls through to library behaviour.

**Client `revealed` handler** fixes: `makeCard(nm,'lib')` → `makeCard(nm, m.kind==='crypt'?'crypt':'lib')` so revealed crypt cards get the right type. Log line updated: `'of the library'` → `'of the '+(m.kind==='crypt'?'crypt':'library')`.

**Crypt contextmenu** updated: "Reveal top X… (park face down)" added to the forEach block, between "Burn top X…" and the separator before Shuffle/Browse.

## v1.38 – Burn top X from crypt (22 June 2026)

New `burnTopCryptN()` function mirroring `burnTopLibraryN()` for the library. Prompts for a count, then burns that many cards from the top of the crypt to the burned zone. Online: sends `{t:'pileTop', action:'burn', kind:'crypt', n}` — single round-trip, server loops.

**Crypt contextmenu** refactored from a single `#z-crypt` listener to a `forEach(['#z-crypt','#dockCrypt'])` that wires the same menu to both the board pile and the dock tile. New menu layout: Draw 1 / Influence / Undo — separator — **Burn top X…** — separator — Shuffle / Browse.

**Server `pileTop` handler** extended with `isCrypt = m.kind==='crypt'` branch: selects `p.game.crypt` vs `p.game.lib`, sends the correct `kind` field in each `sendDrew` call, and returns the right empty-pile error message. Wire-compatible: old clients without `kind` field fall through to `isCrypt=false` → library behaviour unchanged.

**Client `drew` handler** log message fixed: `'Burned the top card of the library'` is now `'Burned the top card of the '+(m.kind==='crypt'?'crypt':'library')` so online crypt burns log correctly.

## v1.37 – Fly-to-pile targets the collapsed dock handle (22 June 2026)

Follow-up to v1.36: when the dock (crypt/library/ash/hand) is **collapsed**, all four pile representations are `display:none`, so `pileAnchorEl` returned null and the fly animation was skipped. Now it falls back to the visible dock handle, so the card flies into the panel and disappears into it.

**`pileAnchorEl(pile)` fallback chain:** after the normal pile list (`z-library`/`dockLib`/`avLib`/`qrLib`, or `z-crypt`/`dockCrypt`) finds nothing visible, it returns the first visible of **`#l2dock`** (the folded-dock handle in L2/L3) or **`#handTab`** (the hand handle shown when visiting another board). Factored the visibility test into a `_visibleEl(id)` helper (offsetParent + non-zero rect) reused for both the pile list and the handle fallback.

**Visual result:** the handle is a wide, ~26 px-tall bar, so the clone's uniform `scale = min(1, tw/from.width, th/from.height)` collapses it toward the handle's small height — it visibly shrinks into the panel rather than landing as a full card. No change needed to `flyToPile`'s geometry; the new anchor just feeds it the handle's rect.

## v1.36 – Fly-to-pile animation on non-drag returns (22 June 2026)

When a card is returned to the library or crypt by any means **other than a mouse drag**, a quick clone now flies from the card's screen position to the visible pile, shrinking and fading as it lands. Drag-returns are deliberately excluded — the card already visibly moves under the cursor.

**`flyToPile(c)`:** Captures the card's `getBoundingClientRect()`, finds the first *visible* pile representation via `pileAnchorEl(pile)`, spawns a fixed-position `.flycard` div (the card's image — face if known, else the back), and CSS-transitions it (transform translate+scale + opacity) over ~300 ms (scaled by `conv.animSpeed`). Double-`requestAnimationFrame` ensures the start frame paints before the transition begins. Cleanup on `transitionend` with a `setTimeout` safety net. Honours `animMode==='all'` (animations off → no clone). Purely local — no network involvement.

**`pileAnchorEl(pile)`:** Returns the first on-screen pile element from a priority list — library: `z-library` → `dockLib` → `avLib` → `qrLib`; crypt: `z-crypt` → `dockCrypt`. Uses `offsetParent!==null` + non-zero rect to detect visibility, so it targets whichever representation the current view actually shows. Returns null (animation skipped silently) if none is visible.

**Call sites (all the non-drag return paths):**
- `returnToPile(c, pos, opts)` — gained an `opts.noFly` flag; calls `flyToPile(c)` before `move()` unless `noFly` is set. This covers the card right-click menu (Top/Bottom/Shuffle in), the hand menu's Selected-card return, and `returnRandomHandN` (which loops `returnToPile`, so each random card flies individually).
- `undoDraw`, `undoDrawStep`, `undoCryptDraw` — `flyToPile(c)` added before their `move(c,'library'|'crypt')` call. Conceptually an undo, but visually identical (a card leaves hand/uncontrolled for the pile), so the same feedback applies.

**NOT touched (drag paths):** `dropCard` and `groupDrop` — dropping a card or group on the library/crypt zone keeps moving under the cursor with no clone, as requested.

## v1.35 – Library pile drag-to-draw / drag-to-park (22 June 2026)

Dragging from the library pile (`#z-library`) or dock tile (`#dockLib`) lets the player route the top card to two destinations:

- **Drop on `#z-hand`** → draws 1 card (calls `drawCard()`, identical to a normal draw click)
- **Drop on the ready region** → parks the top card face-down at the exact drop position (equivalent to "Reveal top X=1", but placed where the pointer lands)
- **Drop anywhere else** → cancelled, nothing happens

**Ghost card:** A fixed-position `#libDragGhost` div (library card-back image, 84×118 px, 78% opacity, `transform:translate(-50%,-60%)` so it hovers slightly above the pointer) appears after a 5 px movement threshold and tracks the pointer. A gold ring (`ghost-hand` class, `box-shadow:0 0 0 3px #c8a84b`) appears when over `#z-hand`; a green ring (`ghost-ready`, `0 0 0 3px #5ba85b`) when over the ready region; no ring otherwise.

**Implementation:** Self-contained IIFE right after the existing `#z-library` click/dblclick listeners. Uses `setPointerCapture` so the ghost tracks the pointer even if it leaves the element. The existing click and dblclick listeners are fully preserved — if the pointer moves <5 px before release, the ghost never appears and the release fires as a normal click/dblclick event (because `pointerdown` calls `e.preventDefault()+stopPropagation` only after the element reference is saved, and `drawCard()` is called explicitly in `onUp` for the hand target — wait, actually: `preventDefault` is called on pointerdown. The click events on `#z-library` listen to `click`/`dblclick`, which are suppressed by `preventDefault`. The drag handler instead calls `drawCard()` directly in `onUp` for a hand-drop, so draw-on-click still works — **but** a non-drag (sub-5px move) falls through `onUp` with `tgt='cancel'` since `ld.started` is false. This means a sub-threshold touch on `#z-library` is silenced by `preventDefault`. **Only relevant for pointer devices** — mouse users always move a bit; touch users may notice a tap that produces no draw.

> **Known caveat:** `pointerdown` on the library calls `preventDefault()`, which suppresses the resulting `click`/`dblclick` events. The drag handler compensates by calling `drawCard()` directly on hand-drops, but a sub-threshold release (tap without movement) is treated as `cancel` and does nothing. This is acceptable for mouse play (users always move slightly); for touch-only play it may feel slightly dead. A future fix: call `drawCard()` in `onUp` when `!ld.started && tgt==='hand'` — but `tgt` is derived from `e.clientX/Y` which for a tap lands on the library itself, not the hand. To fix properly: treat `!ld.started` as "user tapped, don't intercept" and call `libDragCleanup` + let the click bubble. Deferred.

**Online ready-park:** Sets `pendingRevealDrop = {x, y}` (board canvas coords) before sending `{t:'reveal', n:1}`. The `revealed` network handler checks `pendingRevealDrop` and uses its coords for the first card's placement (subsequent cards from a multi-card reveal fall back to the default staggered formula). `pendingRevealDrop` is consumed (set to null) on first read, so it never bleeds into a subsequent unrelated reveal.

## v1.34 – Discard/Burn top X from library (22 June 2026)

Library right-click menu: "Discard top card" and "Burn top card" replaced by **"Discard top X…"** and **"Burn top X…"** — both prompt for a count and operate on that many cards from the top.

**Client:** Two new functions `discardTopLibraryN()` / `burnTopLibraryN()` — `_promptN()` for count, then offline: `pushUndo()` + loop popping `state.zones.library.at(-1)`, one log line per card + a summary line for n>1. Online: single `{t:'pileTop', action, n}` send (the server loops internally). The old `discardTopLibrary` / `burnTopLibrary` (single-card) are kept intact as the target for keyboard shortcuts, and also now include `pushUndo()` for consistency.

**Server:** `pileTop` handler extended with `count = Math.min(Math.max(parseInt(m.n,10)||1, 1), lib.length)` and a loop calling `sendDrew` for each card. Wire-compatible: old client sends no `n` → `parseInt(undefined)=NaN` → `||1` → single card, identical to before.

## v1.33 – Library browse: double-click to fetch + always-reshuffle (22 June 2026)

Two UX changes to the library `Browse…` modal:

**Double-click to fetch.** Each `.bcard` in the library browse now requires a `dblclick` to take the card to the hand (was single `click`). Single-click on a card still previews it via Ctrl+hover (unchanged). Burn mode (ash heap) and all other zones (crypt, ash, burned) keep their existing single-click behaviour — only `z==='library'` in `browse()` is affected.

**Reveal prompt after fetch.** Immediately after the card is moved to the hand (`move(c,'hand')`), a centred menu appears: "Keep secret" (no-op) at the top, then a separator, then the full `_revealToMenu([c])` list (All players / named opponents). This is the identical reveal flow used by the hand menu's `Reveal… → Selected card` path, so it works in solo (log only), hotseat, and online.

**Library always reshuffled on close.** `$('#browseClose')` logic changed: library shuffles unconditionally (`if(browseZone==='library') shuffleZone('library')`); crypt still only reshuffles when `browseDirty` (a card was taken). Note text in the modal updated to match: "Double-click a card to fetch it. The library is always reshuffled when you close."

## v1.48 – Send card… submenu + Set owner removed (22 June 2026)

**`cardMenu(c,x,y)` restructured** for cards in play (the `else` branch, covering ready/torpor/uncontrolled):

The flat sequence of zone-move items (`To torpor`, `Leave torpor`, `To hand`, `To ash heap`, `Burn`) is replaced by a single **`Send card… ▸`** submenu built dynamically from `sendSub`:

- **Crypt cards:** `To torpor` (if not already in torpor) *or* `Leave torpor` (if in torpor) + `To burned`.
- **Library cards:** `To hand` + `To ash heap` + `To burned` + `Return to library ▸ Top / Bottom / Shuffle in` (via `pileSub(c)`).

The `pileSub(c)` call that previously appeared as a top-level item is now nested inside the library arm of `sendSub`, keeping all destination actions together under one parent.

**`Set owner…` removed from the menu.** The `owner` field is preserved in the card model and the oust logic (`ousted()` still uses it to route foreign cards to the right ash heap), but manual editing of `owner` is not needed in normal play — `Give control…` covers the practical use-case (keeping a card in play through a controller's oust). A comment in the code marks the removed handler for future reference.

**`Give control…`** is unchanged in behaviour; it remains a direct top-level item below `Send card…`.

## v1.50 – cardFx actor mode: vampyr-spelar-kort animation (23 June 2026)

When a card is dragged from the hand to the ready region with an active (selected) vampire anchor, `cardFx` now plays with an **actor mode** layout: vampire (small, left) ➤ arrow ➤ played card (large, right). Previously, this drag path triggered no animation at all.

**`cardFx` opts.actor:** New option `{ actor: vampCard }` that reverses the visual order from the existing target mode. The main `cfximg` (the played card, already built first) stays large; the actor image is inserted as a `.cfximg.tgt` to the left of an arrow. The caption shows `"<vampire name> plays <card name>"` with the player label `"(seat · name)"` on a smaller second line via a new `.cfxsub` element.

**Call site in `dropCard`:** After the existing log line at the drag-to-ready branch, `if(a){ qrPhasePlayed.add(c.id); cardFx(c, 'play', { actor: a }); }` — only fires when there's an active anchor, mirrors the `qrPhasePlayed` pattern already used by `playOnActive`.

**Broadcast:** `actor` field added to the `t:'fx'` mpSend and to the `t:'fx'` remote handler, so online spectators/opponents see the same actor-mode animation.

**CSS `.cfx .cfxsub`:** Small secondary line below `.cfxcap`, 15px Cinzel, 70% opacity, for the player label in actor mode.

## v1.49 – Flip face up selected + face-down log inspect (23 June 2026)

**Three fixes:**

**1. `groupMenu` — "Flip face up selected":** New menu item added between `Unlock selected` and `Stack selected`. Calls new `groupFlipUp()` function (inserted just before `flipSelected()`). Only flips cards that are currently face-down; logs each card individually with `cardRefCap(c)+' flipped face up.'` (so the new clickable log link works immediately). Existing `flipSelected()` (keyboard shortcut F, toggles in both directions, single summary log) is unchanged.

**2. `cardRef` / `cardRefCap` — always include `data-cid`:** Face-down cards previously returned plain text `'a face-down card'` with no `data-cid`, making log hover/click and ctrl+hover non-functional. Fixed: face-down cards now return `<b class="clog" data-cid="...">a face-down card</b>` — same clickable element as revealed cards, but with generic text. The card viewer shows the back-face image (via `addRCard` which already handles `faceDown`).

**3. `findInspect` — allow face-down cards:** Guard `!lc.faceDown` on line 2791 prevented face-down cards from being found at all. Changed to `(!name || lc.faceDown || lc.name===name)` — a face-down card always matches by `cid` regardless of name (since we can't verify the name anyway). Same fix applied to the `net.boards` loop for remote cards.

## v1.51 – cardFx dubbelklick + hand-meny konsistens (23 June 2026)

**Dubbelklick** på handkort ändrat från `playOnActive` till `playFromHand` — spelar alltid till brädet, aldrig fäst på vampyr. Konsekvent med drag och med högerklicksmenyn "Play" / "Face-up".

**Hand zone högerklicksmeny** "Play card…"-submenyn fick ett tredje val: `Play on <vampyrnamn> (<kortnamn>)` — visas bara när en vampyr är markerad (via `activeAnchor()`). Byggs dynamiskt via IIFE. Anropar `playOnActive` → actor-mode-animationen triggas.

**`playFromHand` skickar aktör till `tagPlayed`:** `tagPlayed(c, a || undefined)` — samma mönster som `dropCard`. Alla play-vägar (dubbelklick, hand-meny Face-up, hand-meny Play on X) ger nu actor-mode-animationen när vampyr är markerad.

## v1.52 – cardFx caption-system fullständigt omskrivet (23 June 2026)

Alla `cardFx`-animationers caption reviderade till att spegla loggtexten, med kortnamn i `cfxwho`-färg och spelarnamn som kontext.

**Nya caption-format per situation:**

| Situation | Caption |
|-----------|---------|
| Vampyr spelar kort (actor mode) | `Dominique plays Govern the Unaligned` + `(Johan)` sub |
| Kort spelas på vampyr (target, ingen onto) | `Blood Doll was played on Dominique` + `(Johan)` sub |
| Spelare spelar utan vampyr | `Johan plays Dreams of the Sphinx` |
| Cross-table give (onto) | `Johan plays Blood Doll` + onto-chip i motspelararfärg (oförändrad) |
| Bring into play (rise) | `Johan brings Dominique into play` |
| Flip face up | `Johan reveals Dominique` |
| Flip face down | `Johan conceals Dominique` |
| Hand reveal | `Johan revealed 3 cards to Anna` |
| Lock/unlock | `Johan locked Dominique` / `Johan unlocked Dominique` |

**`toName` skickas nu** i `mpSend` för `t:'revealHand'` och i `t:'fx'`-broadcastet så online-motspelare ser rätt namn i sin handreveal-animation.

**Caption-blocket** omstruktурerat till en gren per `kind`+opts-kombination med `_dot`, `_who`, `_playerLabel`, `_cname()`, `_sub()` hjälpvariabler. Face-down-fallbacks: "a face-down card" / "a card" / "a vampire" beroende på kontext.

## v1.56 – Settings KRCG-beskrivning utökad (23 June 2026)

Card Database-beskrivningen i Settings → Convenience ersatt med en fyra-punktslista: (1) minion detection, (2) korttext + statistik i preview, (3) typordnad handsortering, (4) Deck Lab + katalog. Avslutas med graceful-degradation-notering och cache-info.

## v1.57 – Edge-knapp: anpassad tooltip via data-tip (23 June 2026)

`#edge` fick `data-tip="The Edge — grants +1 pool at Unlock"`. `title`-attributet togs bort helt för att undvika dubbla tooltips (native browser + anpassad).

**`cardTip`-systemet utökat:** `mouseover`-lyssnaren kollar nu `t.closest('[data-tip]')` som ett alternativt spår. Om ett `data-tip`-element träffas (och inget `.card`) visas `tipEl.dataset.tip` i `#cardTip`. Mekanismen är generell — vilket UI-element som helst kan nu få snabb tooltip med `data-tip`.

## v1.58 – nudgeFree: kort staplas aldrig helt (23 June 2026)

Ny hjälpfunktion `nudgeFree(wx, wy)` placerad precis före `playFromHand`. Provar 9 positioner i spiral; returnerar första position där minst 20px ("peek margin") av varje befintligt ready-kort syns. Fallback: slumpmässig vinkel med 30px offset. Patchad i `playFromHand`, `revealTop`, `revealTopCrypt`. `state.zones.hand`-arrayen muteras aldrig.

## v1.59 – Deck Lab: Load saved deck-lista (23 June 2026)

Ny `deckrow` ovanför precon-raden i Deck Lab med `#savedDeckSel` + `#labDelSaved`. `refreshLabDeckSel()` fyller listan från `loadDecks()`. Change-listener kör `loadParsedIntoEditor` + sätter `editDeck.name` och `editOrig`. Delete bekräftar och synkar båda select-listor. Kallas vid `openDeckLab`, `openDeckLabBeside`, `labSaveLib` och `newEmptyDeck`.

## v1.60 – Torpor-buggar fixade (23 June 2026)

**Bugg 1:** `dropCard` saknade `c.kind==='crypt'`-guard för torpor (uncontrolled hade det redan). Bibliotekskort kunde dras dit och hamnade i odefinerat tillstånd. Fix: identisk guard tillagd i `dropCard` och `groupDrop`.

**Bugg 2:** `restack(c)` använde `c.x/c.y` (kanoniska ready-koordinater) för att placera kort i torpor/uncontrolled. `c.x/c.y` uppdateras bara vid ready-placering; torpor-layout sätter korrekt position i `c.tx/c.ty`. Fix: `restack` väljer nu `c.tx/c.ty` för icke-ready-zoner.

## v1.67 – Baskortet överst vid stack-drag (23 June 2026)

`.card.dragging { z-index: 5000 !important }` — `!important` slog igenom oavsett inline z-index. Barnen fick `.dragging` och hamnade ovanpå hosten. Fix: ny `drag.hostGroup`-flagga som suppressar `.dragging` på barn i host-drags. Hosten behåller `.dragging` exklusivt → alltid överst.

## v1.66 – Stack drag-and-drop: barn följer baskortet (23 June 2026)

Single-card drag lossade alltid stacken (avsiktlig design). Ändrat: om `c.attached.length > 0` byggs `drag.group` med barnen (offset relativt host) + `drag.hostGroup=true`, och `releaseChildren` hoppas över. `move()` fick `keepChildren`-flagga. `dropCard` uppdaterad för ready (barnens kanoniska x/y uppdateras), torpor och uncontrolled. Nytt "Detach all attached cards"-val i `cardMenu` för baskortet.

## v1.65 – Hand-panelsortering fixad (23 June 2026)

`renderHand()` sorterade bara en lokal kopia → `#handRow` korrekt men `layoutZone('hand')` använde `state.zones.hand` i insättningsordning. Fix: `state.zones.hand.sort(handSortCmp)` in-place i `move()` direkt efter `push(c.id)` → alla renderingsvägar täckta.

## v1.64 – KRCG-typnamn korrigerade (23 June 2026)

`HAND_TYPE_ORDER` uppdaterad med exakta KRCG-strängar: `'political action':2`, `'action modifier':6`. `handTypeWords` förenklat till direktuppslag utan ord-splittning. `TYPE_LABELS` korrigerade. KRCG:s officiella typformat: enkla strängar som `"Action Modifier"`, `"Political Action"` — aldrig slash-sammansatta i enstaka element.

## v1.63 – Deck Lab: bibliotekskort per typ (23 June 2026)

Ny `.esubhead`-CSS och `elistLibrarySections(m, bucket)` ersätter platt alphabetisk `elistSection('Library',...)`. Grupperar med `handTypeTuple`, rubrik per sektion med antal, fallback till platt lista utan DB.

## v1.62 – Torpor hover-bounce fix: lx/ly (23 June 2026)

`restack` använde `c.tx/c.ty` (post-transform) → dubbel-`pubXform` i L2 → bounce. Fix: `layoutZone('torpor/uncontrolled')` sparar pre-transform `hx/hy` i `c.lx/c.ly`. `restack` använder `c.lx/c.ly` för icke-ready-zoner, `c.x/c.y` för ready.

## v1.61 – Edge-knapp klickbar i L2 (23 June 2026)


`#poolWrap` i L2 täckte `#edge` geometriskt (edge vid `pubXform(0.94*bw2, 0.668*bh2)` — mitt i pool-boxen). Z-index hjälper inte för syskon-element som absorberar pointer events.

Fix: `pointer-events:none` på `#poolWrap` i L2; `pointer-events:auto` på `#pool` och `#pname`. `wheel`- och `contextmenu`-lyssnare flyttade från `#poolWrap` till `#pool`. Edge-positionen oförändrad.

## v1.55 – Hand panel sorted by type then alpha (23 June 2026)


Cards in the Hand panel (visible in L2 Home, L2 Visit, and L3 Overview) are now displayed sorted left-to-right by library type first, then alphabetically within each type.

**Type order:** master → action → political → ally → retainer → equipment → modifier → reaction → combat → other (event, conviction, power, unknown).

**Implementation:**
- `HAND_TYPE_ORDER` constant (map of type string → numeric priority, 0–8; other = 99).
- `handTypePri(c)` — resolves a card's best (lowest) priority from `cardTypes` (the KRCG database map). Crypt cards in hand get priority -1 (float left as an edge case). Falls back to 99 if the DB is not loaded.
- `handSortCmp(a, b)` — comparator: primary key = type priority, secondary key = `localeCompare` on `c.name`.
- `renderHand()` — one new line `cards.sort(handSortCmp)` after the cards array is built, before rendering.

**Fallback:** if the card database is not loaded (`cardTypes === null`), `handTypePri` returns 99 for all library cards — the hand still sorts alphabetically, just without type grouping.

**Scope:** Hand panel only. The physical `state.zones.hand` array order is not mutated (sort is on a derived copy). Crypt/library/ash browse and play order are unaffected.

## v1.53 – Lock/unlock caption inkluderar kortnamn (23 June 2026)

Lock/unlock fallback-grenen i caption-blocket fick kortnamn: `Johan locked Dominique` / `Johan unlocked Dominique`. Kortnamnet renderas i `cfxwho`-färg. Face-down-kort visas utan namn (ingen läcka).

## v1.54 – Klick på klonanimation avbryter den (23 June 2026)

`wrap.addEventListener('click', ()=>wrap.remove(), { once:true })` tillagt på varje animation-wrap. Eftersom `#cardFx` har `pointer-events:none` på containernivå sätts `pointer-events:auto` och `cursor:pointer` direkt på wrappen — klick landar rätt utan att blockera brädet när ingen animation spelas.

## v1.68 – #poolHelp återinförd vid pool-cirkeln (23 June 2026)

`#helpToggle` hade förflyttats till `#l1zoomWrap` (zoom-raden uppe i hörnet) och var inte längre synlig vid pool-zonen. Nytt element `#poolHelp` (26×26px cirkulär ?-knapp) återinförd vid spegelvänd position mot Edge:

- **L1:** `right:124px; bottom:26px` (Edge är `right:124px; bottom:122px` — identisk höger-offset, men längs pool-globens underkant)
- **L2 columns:** `pubXform(0.845*bw2, 0.915*bh2)` — nedre vänstra av pool-boxen (Edge är övre högra)
- **L3:** `pwRight+4+(26+6)px` — 6px gap till höger om Edge i pool-stripen

Delar `#helpOverlay` med `#helpToggle`. Separat click-IIFE synkar `.on`-klassen på båda knapparna. `data-tip` ger tooltip via `cardTip`-systemet. Inkluderad i alla clearL2-reset-arrayer.

## v1.68 – #poolHelp återinförd vid pool-globen (23 June 2026)

`#helpToggle` hade förflyttats till zoom-raden. Nytt `#poolHelp` (26×26px cirkulär ?-knapp) placerad i L2/L3 spegelvänd under Edge:

- **L1:** `display:none` — knappen är bara relevant i L2/L3.
- **L2 columns:** `pubXform(0.94*bw2 + 6/l2pub.s, 0.861*bh2)` — samma x-linje som Edge + 6px kompensation för breddskillnad (Edge 32px, poolHelp 26px), y spegelvänd under pool-globens mittpunkt med samma avstånd som Edge har ovanför. Skalas med `l2pub.s`.
- **L3:** 4px till vänster om pool-name-clustret.

Delar `#helpOverlay` med `#helpToggle`. `data-tip="Help"`. Inkluderad i clearL2-reset-arrayer.

## v1.69 – sfxSilent(): ljudtriggers stängs av vid vol=0 (23 June 2026)

Ny `sfxSilent(ch)` helper (placerad efter `sfxGain`): returnerar `true` om master (`conv.sfxVol===0`) eller kanalens individuella volym är 0. Guards lagda som första rad i alla 10 sfx-triggerfunktioner (`bell`, `heartbeat`, `sfxSweep`, `sfxPlayCard`, `sfxDiscipline`, `sfxConclave`, `sfxFinalDeath`, `sfxWarded`, `sfxHoldOn`). Vid vol=0 avbryts funktionen innan `actx`, `sfxMakeReverb` eller någon Web Audio-nod skapas.

## Phase 0 - refactor groundwork: edge-verb bug-fixes, a second dead-code sweep, a client logic suite, a debug ring buffer (24 June 2026) [client 1.99.28 / server 1.8]

Groundwork before the planned 2.0 refactor. A full code audit + refactor plan lives in **elysium-refactor-analysis.md** (delivered this session); the single-file question was settled there as **fork B1** - keep the *artifact* one double-clickable file, but allow the *source* to be flat script fragments sharing one scope, concatenated into the HTML with a byte-identical-diff gate. No build step, no import/export. Nothing structural was moved yet - Phase 0 is fixes + a safety net first.

**Edge-verb server bug-fixes.** The `edgePass`/`edgeTake` pair shipped *wired but never live-tested* (hotseat is primary, so the online handoff path had quietly rotted). Four latent bugs, all fixed:
- `edgePass` looked up the target by `room.players.find(x => x.seat === toSeat)`, but player objects have **no `.seat` field** - seats are only computed inside `roster()`. Fixed to index `room.players[toSeat-1]`.
- the `edgePass` relay dropped the `pos` field the client sends (`pos:dropPos`) and the receiver reads - so a handed-off Edge ignored its drop coordinates. Now forwarded. (The coordinate model is mat-relative -> shared canonical box, so `pos` is portable across boards.)
- `edgeTake` forwarded the client's `bySeat` raw; the server now **derives** identity (`room.players.indexOf(p)+1`) and never trusts a client-sent seat.
- both verbs lacked an `if(!room.started) return;` guard; added.

Server-only - the client HTML was untouched for these. **Version, two things to reconcile (your call - you know your deployment):** the source server is `const VERSION='1.7'` on its own decoupled 1.x line (1.6 -> 1.7 -> **1.8** this session); the delivered server is **1.8**. (a) The v1.90-v1.99.26 notes call the server "1.99.18" - that's a numbering slip; the edge verbs actually live in the 1.x server, so treat the code's `VERSION` as authoritative. (b) Because the client is `1.99.28` and the server `1.8`, the join-time check fires its **non-blocking** "version mismatch" warning online - a known, accepted state (the journal records online as secondary to hotseat). If you want that warning gone, sync the server `VERSION` to the client's number; otherwise the 1.x line is fine.

**Second dead-code sweep (client).** Distinct from the v1.99.27 sweep (which *parked* revivable features). This removed genuinely-dead developer scaffolding - `demoBoard`, `fillTableDecks`, `startDemoTable`, `promptDemoTable`, `applyL2Experiment`, `thump` (+ the commented-out `thump` calls, a stale `.l2pane` contextmenu allow-list entry, and its CSS). Because these were never-reachable cruft (not parked features that might return), they were **deleted outright rather than archived** to kodarkivering.md - that file holds parked-but-revivable code, not dead scaffolds. **`stopDemoTable` was renamed `leaveHotseat`** (definition + both call sites) to say what it actually does. Kept (verified live): `DEMO_NAMES` (still used by the Offline-setup seeding), `startHotseat`, `fillOfflineTable`, and `.l2pane2` (12 live uses).

**Client logic suite + shared harness.** New `test-client-logic.js` loads the real client `<script>` in Node under a compact Proxy DOM stub (`elysium-test-harness.js`) and asserts the contracts most at risk during the refactor: `pubXform`/`pubInv` round-trip to identity; `serialize -> restore -> serialize` is idempotent (modulo the `t` timestamp); `restore` preserves pool/zones/card fields; `buildPub` omits the hand and reports only its count (the client-side secrecy guarantee - face-down *name* stripping is the server's `sanitizePub` job, not the client's); `restoreGame` rejects garbage without throwing; `baseView()==='l2'`; and the debug ring buffer captures + dumps. 8 assertions, all green against 1.99.28. Because it drives the *live* functions, it's a real regression gate for module extraction - not a copy that can drift. (Writing it surfaced that `baseView` had already been simplified to a one-liner in v1.99.27, so a config-matrix test would have been testing a stale contract - read the code, don't trust the plan.)

**Debug ring buffer (`conv.debug`).** The client had zero `console.*` and no diagnostic channel, so online desyncs were invisible. Added a capped (200-entry) ring buffer fed by `dbg(tag, e)`, wired into the silent catches where desyncs hide - the `mpOnMsg` network dispatch, escrow key-derivation, hand-blob decrypt, and escrow encrypt - plus global `error`/`unhandledrejection` capture. The buffer **always** records (independent of the flag); `conv.debug:true` additionally mirrors each new entry to `console.warn` live. Dump anytime from the browser console with **`elysiumDbg()`**. The benign `c.el.remove()` catch was left silent (expected to miss sometimes - logging it would be noise). MVP: console accessor, no About-panel button yet.

Verified: client JS syntax clean; `node test-client-logic.js` 8/8 (incl. against the patched client - confirming the sweep + ring buffer didn't touch core logic); the server edge fixes are byte-level confirmed in the delivered file. **Not** runtime/online-tested (sandbox can't render or network) - Johan to verify the Edge handoff live with two clients (drag Edge onto an opponent's Ready -> lands at the drop spot; take the Edge via the button -> it vanishes for the prior holder and the log names the right player).

## v1.99.27 - Pre-2.0 cleanup: parked L1-Simplified choice, the Alt views, the round table (24 June 2026)

A deliberate dead-code sweep ahead of the 2.0 refactor (client-only; server stays 1.99.18). Removed source is archived verbatim in the new **kodarkivering.md**, and every removal site carries a `// PARKED -> kodarkivering.md` breadcrumb.

- **L1 / Simplified is no longer a *chosen* view.** The "Default table view" Normal/Simplified setting was removed and the home view is forced to **Normal** (`conv.defaultView` hard 'normal'; the online `mpView` host-lock dropped its Simplified option). **L1 itself is NOT gone** - it is still the base layer the view system builds on (L2/L3 are CSS classes added on top; `exitL2`/`exitL3` return you to it) and `baseView()` still falls back to it for a one-live-player table (`opp ? 'l2' : null`). Fully retiring L1 would mean routing one-player tables through `l2solo` - a behaviour change saved for 2.0. The **Play solo** start-screen button and the **Solo** menu item were removed; a lone player now enters via **Offline** (the modal seeds You + one opponent; shrink to one seat to goldfish). "Offline - hotseat" in the menu was renamed **Offline**.
- **The Alt views are parked.** Both reaction surfaces - `#altview` (the full-screen Reaction window tray) and `#qrbar` (the Quick React strip) - plus the header `#btnReact` button, the Alt/Escape keydown handler, and the "Quick React strip" setting are gone. The **Played** and **Ready** tabs cover the same ground non-modally; `renderAltIfOpen()` survives as a slim tab-refresh shim. **Crucial boundary:** the card renderers/interactions (`avRenderCard`, `qrCard`, `qrTap`, `qrHandDown`, `qrDragGive`) and the `.qr*` CSS classes are **shared** with the Played/Ready tabs + the dock, so they stayed live - only the two tray/strip *containers* and their render/open/close functions were parked.
- **The L3 circle/round table is parked.** Square (Lackey-style) is the only helicopter layout now: `effectiveL3Shape()` hard-returns `'square'`, the `l3slots()` circle branch is archived, and the "Level 3 table shape" setting + the online `mpShape` lock are removed. The already-dead `renderOval()` (a pre-L3 oval overview, never called) and its `.ovalfelt` CSS were archived too.

Verified: client JS syntax clean (`node --check`) + a static pass confirming no dangling calls to any parked function. Not runtime-tested (sandbox can't render); Johan to verify live.

**Navigation block (addendum, same version).** In addition to removing the setting, the navigation paths were locked to never land on L1 within a match: `baseView()` always returns `'l2'` (was `null` for solo / Simplified), `levelOrder()` is `['l2','ov']` (was `[null,'l2','ov']` / `[null,'ov']`), and `stepLevel(-1)` from a Visit goes to `'l2'` (was `null`). The four existing `switchView(null)` calls are all game-teardown (leave room, demoted, disconnect, stop hotseat) — not navigation — and were left as-is. `skipL2` has been fully removed (setting, loader, listener, UI — zero references remain). A one-player table landing in L2 is handled by `renderL2`'s existing solo branch (your board centred full-area with the same dock as column mode).

## v1.90–v1.99.26 - L3 Overview build-out + the Edge token handoff system (24 June 2026)

A long iterative arc. Two big features and a lot of coordinate-space debugging.

**The L3 "helicopter" pool zone (v1.90–v1.99.10).** Your own board's pool zone in L3 now renders exactly like the other zones (Uncontrolled/Torpor/Ready): `pubCanon('pool')` (added to `pubCanon`) → `pubXform` position → `l2pub.s` size, with the globe sized by the same fraction-of-zone formula as the opponent mat globes. The dock panel gained a **separate** pool widget — `#z-pool` zone + `#dockPool` globe (its own `#dpplus/#dpminus`/wheel/right-click → `bumpPool()`), because one `#poolWrap` can't be both the slot zone and the dock widget at once; `updatePool()` syncs both. The zone label scales like `.matzlab` (`l2pub.s*15`). Wheel-zoom is suppressed while the dock is open; dragging a hand card out closes the whole dock.

**The Edge token (v1.82 foundation → v1.99.26).** The Edge is now a draggable physical token that hands off between players. The hard part was coordinates and the hotseat three-layer model — see learnings for the full set. Key mechanics as shipped:
- **Token rides pan/zoom** by living on `#board` and being re-placed by `applyL3Transform` via `pubXform` (the same path as ready cards). `pubInv(pubXform(x))===x` keeps drag→drop from snapping. (An attempt to put the token *inside* `#l3stage`, v1.99.9, cascaded into pointer-events/double-transform bugs and was reverted in v1.99.11.)
- **The Edge BUTTON** (`#edge`) follows the table too: `setCenterFrameA` positions it with `Px+Z*(…)` below the centre clock (`l3clockCy`), and v1.99.25 added `scale(Z)` so its *size* scales (fixing an inverse-zoom). v1.99.19 limited its CSS transition to visual props so it doesn't glide-and-snap during a pan.
- **Handoff = drag onto a Ready zone.** `readyZoneAt(cx,cy)` (geometric) gates drops: opponent's Ready → handoff; own Ready → reposition (keep the Edge); anywhere else → snap back. Drop position is computed **mat-relative** (fraction of the target mat → shared canonical box), never `pubInv`'d in your own slot's space.
- **Token renders on every board** via `buildPub().tokens` + `buildMat` drawing `pub.tokens` (read-only) — so it shows on opponents' mats in the overview and when you pass the turn in hotseat.
- **The BUTTON is authoritative** (`edgeTakeover`): taking the Edge trumps a prior handoff — clears edge+token across all stored boards, all pub views, and online via the `edgeTake` broadcast, then re-seats one token in your Ready.
- **Persistence:** `serializeGame` stores `edgeTok:{x,y}`; `restoreGame` re-seats the token there (a handed-off Edge keeps its drop spot when the receiver becomes active in hotseat).

**Server (v1.99.18):** two new verbs — `edgePass` (relay a drag-handoff to the target) and `edgeTake` (broadcast a button-takeover so the prior holder loses it). Both needed a server bump.

**L3 chrome polish (v1.99.20–v1.99.24):** zoom/help toggle buttons stacked vertically (zoom on top) and nudged; the zoom slider panel moved into `#tableArea` so it shares the buttons' coordinate system and sits bottom-aligned to the zoom button's left; buttons ~5% smaller in L3.

## v1.82 - The Edge as a draggable token; a reusable Token family (23 June 2026)

After two abandoned approaches (v1.80/v1.81 below), the Edge is now a **self-contained Token family** that never touches the card model.

**The Token system (the key artifact, placed right after the Edge functions):**
- **`TOKEN_DEFS` registry** — each token type declares `label`, `size`, `svg(sz)` (its look), and `menu(tok)` (right-click items). The Edge is the first member; new tokens drop in here and get drag/placement/menu automatically.
- **`tokens` Map** (`id → {id, type, x, y, z, tx, ty, el}`) — **separate from `state.cards`/`state.zones`**, so the entire card pipeline (drag/drop/animations/serialize/buildPub) is untouched. `x/y` are canonical board coords, exactly like ready cards.
- **`makeToken(type,id)` / `removeToken(id)`** — create/destroy a token element (`<div class="token tok-TYPE">`).
- **`placeToken(tok)`** — positions it, borrowing `place()`'s scale math: `if(l2pub.on){ pubXform }` then `cardTransform(x,y,0,s)`. Because rot=0 reduces cardTransform to translate+scale from origin, the token's own (non-CW) size scales correctly in L2/L3.
- **`layoutTokens()`** — re-places all tokens; **called in `layout()`** after `renderPhaseCounts`.
- **`bindTokenDrag(el,tok)`** — own drag, replicating `bindCard`'s move math (`f` scale factor, `ox/oy` offsets) but **without** the zone/move/dropCard logic that needed `state.zones` membership. On drop it stores canonical coords via `pubInv` AND re-places the token (see drag-jump learning).
- **`tokenMenu(tok,x,y)`** → `showMenu(def.menu(tok), x, y)` (the existing menu system; items are `{label, fn}`).

**The Edge member:**
- `ensureEdgeToken()` — creates the `edge` token in the Ready region's lower-right (`zoneRect('ready')` → `pubInv`), guarded by `conv.edgeToken`.
- `removeEdgeToken()`, `burnEdge()` — burn sets `state.edge=false`, removes the token, logs "<name> burned the Edge."
- Hooked into `toggleEdge` (create on take / remove on release), `restoreGame` (recreate from `state.edge`), `clearTable` (cleared alongside cards), and the `convEdgeToken` setting.

**Look:** an upward-pointing filled triangle — stone-gradient fill (`#54545c→#3c3c43→#29292f`), dark beveled-shadow outer edge (`#1f1f26`, no gold), a light-grey inner bevel-highlight polygon, two faint concentric pattern triangles, and the bone-white VTES symbol centred over the inner pattern (`translate(30,40) scale(0.04)`). `size:100` (~double the old token). CSS `.token` has `will-change:transform` + a drop-shadow and **no transition** (instant drag).

**Setting:** "Show The Edge as a felt token" (`conv.edgeToken`, default on).

**Known limits (next steps):** token is local-only (opponents don't see it yet — needs opponent rendering via pub); position is not serialized (recreated at the default corner on hotseat-swap/load); burn/release are not yet exclusive across players or relayed online.

## v1.80-v1.81 - The Edge token: two abandoned approaches (23 June 2026)

Both reverted; kept as a record of what NOT to do.

**v1.80 - fixed-position element:** a `#edgeToken` div pinned to the board with `right%/bottom%`. Rejected because a pinned element drifts with the board edge when panels fold in/out — it does not sit on the mat like a card.

**v1.81 - Edge as a real card (`kind:'edge'`):** made the Edge a `state.cards` object to inherit drag/place/scale "for free." This **broke core card handling** — clone animations stopped, dragged cards jumped far below the cursor, and cards could be dropped anywhere (zone snapping gone). Exact mechanism not pinned down live, but the lesson is firm: a non-card object inside `state.cards`/`state.zones` violates assumptions across the card pipeline. **Reverted fully to v1.79.**

## v1.79 - VTES symbol vectorised inline (23 June 2026)

Johan uploaded `vtessymbol.png` (2400×2400, black triskelion on transparent). Vectorised with cv2 `findContours(RETR_CCOMP)` + `approxPolyDP(eps 0.0015)` + even-odd fill (straight lines beat Bézier for the sharp points), 97.4% IoU, ~3KB path.
- **`VTES_SYMBOL_PATH`** constant (viewBox `0 0 1000 1000`).
- **`vtesSymbol(opts)`** helper (after `clanSymBadge`): `opts` = size / fill (default currentColor) / opacity / cls / title; returns an inline `<svg class="vtesmark">` string with `fill-rule="evenodd"`. CSS `.vtesmark{display:inline-block; vertical-align:middle; flex:0 0 auto}`. Covered by the Dark Pack licence. Reused as the heart of the Edge token (v1.82).

## v1.78 - Clan symbol badge: reusable template + Table tab + animations (23 June 2026)

Clan symbols were dark-on-dark and invisible in the Table tab. Fix grew into a reusable badge template.

**Reusable template (the key artifact):**
- **CSS class `.clanbadge`** (near the `.srow` rules): scalable via the `--cb-size` CSS variable (default 20px). Bone-white filled circle (`background:#d9cfb6` = `--bone`), `border-radius:50%`, `box-shadow:0 1px 3px rgba(0,0,0,.5), inset 0 0 0 1px rgba(0,0,0,.15)` (outer drop shadow + subtle inner edge). Icon (`.clanbadge img`) is `calc(var(--cb-size)*0.80)`, with **absolute** offset `margin-left:2px; margin-top:1px`.
- **JS `clanSymBadge(clan, sizePx)`** (after `clanSymEl`): returns a `<span class="clanbadge">` with the clan icon; `clan=null` → invisible placeholder that keeps its width. Use `.outerHTML` to embed in an innerHTML string. Re-style per context via `.ctx .clanbadge { --cb-size: 28px }`.

**Applied to:** the Table tab (`statRow` — replaced the hardcoded `.sclancel` span, now removed) and all six cardFx caption variants (new `_whoB` = player name + 16px badge, no space, swapped for `_who` in every `cap.innerHTML`).

**Offset lesson:** proportional offset (`calc(--cb-size*0.05)`) was too small at 16px (0.8px) and pulled the icon left; absolute `2px/1px` works at every size.

**Paths investigation CLOSED:** verified against the real `vtes.json` (102 vampires) + the card *Aaradhya, The Callous Tyrant* field-by-field. **No `path` field exists on cards.** "Path" appears only in `sets[setName][].precon` (the SV5 precon-deck name, e.g. "Path of Power and the Inner Voice"). Even *sect* is not structured data - it lives in `card_text`. So path affiliation cannot be auto-detected like clan; if path support is built, manual choice in the `⚝ Choose clan…` menu is the clean path (the `/svg/path/` routing already exists).

## v1.77 - Public clan logging with player name (23 June 2026)

`log(msg)` without `localOnly` already relays in online + shows in the shared hotseat log, so the clan log was already public - it only lacked the name. Added `clanLogName()` = `net.you || state.playerName || 'Player'` (net.you = online you / active hotseat seat; state.playerName = solo; note state.playerName does NOT update on hotseat seat-swap, so net.you must come first). All four clan log lines now read "Clan affiliation for <name> changed to <clan>." (move, tagPlayed, manual choice, auto-detect). Added `scheduleSave()` to the two manual-choice handlers (manual choice only called refreshClanDisplay() = no board push, so online opponents' symbol wouldn't update until the next board change; auto-detect via play/move already pushes). Minor known redundancy: online receivers see the server `[name]` prefix plus "for name".

**Paths TODO:** KRCG has no path field on cards (verified against OpenAPI v3.4); paths are separate library master-cards ("The Path of Caine" etc., the four with `/svg/path/` SVGs). Path affiliation can't be auto-detected from vampires' clans like clan is - needs a different source (path master-card in play, or manual choice) when we build path support. `CLAN_PATH_SLUGS` + `/svg/path/` routing already in place to render the symbol once the source is decided.

## v1.76 - Clan watermark on opponent pool globes (23 June 2026)

Extended the v1.75 watermark to opponents via the shared `renderBoard` mat renderer, sourced from `pub.clan` (works online + hotseat). `.clansym-pool` CSS generalised from `#pool`-scoped to global. L2 columns + Visit globe (`g`): clan `<img class="clansym-pool">` added to the globe's innerHTML (same clip-path/z-index as own globe). L3 Overview (`pv`): no opponent globe exists there, so the symbol sits in the pool zone behind the numeral (`opacity:.4`, `pv` got `z-index:1`). `renderFull` (L1-base Visit) unaffected (pool shown as text).

## v1.75 - Pool globe clan symbol as watermark (23 June 2026)

`.clansym-pool` changed from a small icon below the numeral to a large centred watermark filling the globe: `width/height:90%`, centred, `opacity:.5`, `z-index:1`, `clip-path:circle(50%)`. `.poolnum` got `position:relative; z-index:2` (numeral above the watermark); `.pbtn` got `z-index:4`. Layer order: red gradient -> clan symbol -> numeral -> +/- buttons. `clip-path` (not `overflow:hidden`) clips the square SVG corners to the circle, because the +/- buttons sit outside the 96px globe. Applies to `#pool` (own live globe, all views); opponent globes carry the symbol next to the name instead.

## v1.73-v1.74 - Clan symbol KRCG data corrections (23 June 2026)

**Verified against KRCG OpenAPI (`api.krcg.org/openapi.yaml`) + KRCG's own deck export.** Key facts now documented in learnings:
- KRCG `clans` field uses **legacy VEKN names** ("Assamite", "Follower of Set", "Tremere antitribu"), NOT V5 names.
- SVG filenames are NOT synced with the clans field - 7 names need explicit mapping (`CLAN_SVG_MAP`): Assamite->banuhaqim, Follower of Set->ministry, plus 5 plural forms (Abomination->abominations, Ahrimane->ahrimanes, Gargoyle->gargoyles, Daughter of Cacophony->daughtersofcacophony, Harbinger of Skulls->harbingersofskulls). The other ~40 (incl. all antitribu) match `normClan()`.
- Correct SVG base path is `/svg/clan/` and `/svg/path/` (v1.73 fixed the missing `/svg/`).

**v1.73:** Corrected base path to `/svg/clan/`; added `CLAN_PATH_SLUGS` for `/svg/path/` (dormant - paths never appear in clans data).

**v1.74:** Fixed split-on-whitespace bug that destroyed multi-word clans ("Follower of Set"->"Follower"). `loadCardDB` now stores `clansArr` (the preserved array) alongside `clans` (joined string for cardTags). `detectClan` + `clanChoiceItems` use `clansArr[0]`. Added `CLAN_SVG_MAP`. Unit-tested isolated: 46/46 KRCG clans map to a known SVG file.

## v1.72 – Clan symbol system (23 June 2026)

`state.myClan` (auto-detected majority clan among ready vampires) + `state.chosenClan` (manual override). `activeClan()` = `chosenClan || myClan`. `detectClan()` counts clan occurrences in `state.zones.ready` using `cardInfo.clans` split. `updateMyClan()` recomputes and calls `refreshClanDisplay()`. Hooks in `tagPlayed()` and `move()` (when crypt card enters/leaves ready). Clan change logged.

`clanSymUrl(clan)` → `https://static.krcg.org/clan/<normclan>.svg`. All `<img>` elements have `onerror→display:none` fallback.

`buildPub()` carries `clan: activeClan()||undefined`. Pool context menu (`selfPoolMenuItems`) gets `⚝ Choose clan…` with dynamic `clanChoiceItems()` submenu (✓ marks active; Auto-detect at bottom).

Rendered at: pool globe (`.clansym-pool`, absolutley centred below numeral, 28% diameter, opacity .55), `#pname` prefix (14px, via `renderName()`), `rvTitle`, L2 collapsed + expanded headers, L3 mname-div, turn notice, Table-tab (new 18px clan column, header ☽). cardFx `'rise'`: `.cfxsub` with 22px symbol + clan name if `activeClan()` is set.

Serialized in `serializeGame`/`restoreGame`. `clearTable` resets both fields.

## v1.68–v1.71 – Pool-zonen, Visit-overlay, ljud, Table-tabb (23 June 2026)

**v1.68 #poolHelp:** 26px cirkulär ?-knapp syskon till `#edge`. L2: `pubXform(0.94*bw2 + 6/l2pub.s, 0.861*bh2)`. L3: 4px vänster om pool-clustret. Delar `#helpOverlay`. `shuffleFx()` = no-op pending redesign.

**v1.69 sfxSilent(ch):** Guard-helper efter `sfxGain` — returnerar `true` om master eller kanal = 0. Lagd i alla 10 sfx-triggerfunktioner som första rad, stoppar Web Audio-grafen helt.

**v1.70 Unlock-puls:** `.phase.yt-pulse` kör `ytPulse` + `ytPulseOutline` synkat 0.9s. Läggs på i `startYourTurn`, tas bort i `endYourTurn`. Outline = `#dcb872` (kortmarkeringsfärgen).

**v1.70 rvBack:** `position:absolute; right:16px` — aldrig blockerad av Played-tabben.

**v1.70 rvTitle:** `innerHTML` med spelarnamn + 🪑 + sätesnummer i `seatColor.hex`. 🪑 = `\U0001FA91`.

**v1.70 Hand-zon:** `right:auto; width:440px` i L2/L3 — fast bredd oberoende av vänsterpanelen.

**v1.71 #pseat:** Syskon till `#edge`. `setCenterFrameA` L2: `pubXform(0.845*bw2, 0.668*bh2)` + `{+40, +6}px` offset, `transformOrigin:'100% 0'`. `setPname()` sätter `🪑N` utan mellanslag i spelarfärg, 15px Cinzel. Dolt med `body.invisit`. Edge också dolt vid `body.invisit`.

**v1.71 Table-tabb:** 8-kolumners grid (`14px 1fr 28px 30px 34px 34px 30px auto`). Ny `.sseatcol` med `🪑N` i spelarfärg efter namnkolumnen.

## Fas 1 — handler-maps, modaler, B1-konkatenatorn (24–25 juni)

The structural, low-risk phase (analysis Phase 1). Client **1.99.28 → 1.99.34**; server **1.8** (unchanged — no new wire verbs).

- **Handler-map dispatch (client + server).** `mpOnMsg` is now a thin parse + lookup into `MP_HANDLERS = { verb(m){…} }` (39 handlers); the server's in-game chain is `GAME_HANDLERS = { verb(conn,room,p,m){…} }` (45 handlers). The server's **staged** pre-dispatch (`create`/`join` before a room exists → spectator phase → game handlers) is deliberately *not* mapped — only the in-game chain is. Unknown verbs are ignored silently (else-less).
- **Modal system.** `uiDialog(opts)` + `uiAlert`/`uiConfirm`/`uiPrompt` (Promise-based) over the existing `#overlay`; `#dialogModal` markup. Remembers + restores the modal underneath (`shownModal()`), capture-phase Esc/Enter/backdrop. **All 49 native `prompt`/`alert`/`confirm` are gone** — converted to async modals (touch prerequisite ticked). The over-limit discard confirm lives in `discardGateOK(c)` (UI layer), not in `move()` (which stays pure + synchronous).
- **B1 concatenator scaffolding.** `split_client.py` (splits the single file into `elysium-src/` fragments sharing one scope) + `elysium-build.js` (~50-line zero-dep concatenator, reassembles via a `/*@@ELYSIUM_APP_JS@@*/` placeholder). The single file stays source-of-truth; the fragments are derived and re-split after each patch, with a byte-identical `cmp` as the gate. First leaf module: `esc-crypto.js`.
- **Test layer.** `test-client-logic.js` → **16 assertions** (the `mpOnMsg` routing tests, the hotseat-log `keepLog` guard, and the Phase 2 state-contract depth: single-zone `move` invariant, attachment round-trip, id/position survival, `buildPub` purity); new `test-server-dispatch.js` (3) drives the server's `handle()` / `GAME_HANDLERS` via `loadServer` in the shared harness. Run: `node test-client-logic.js` and `node test-server-dispatch.js`.
- **Hotseat turn-log fix (1.99.33).** `keepLog` now gates `state.turnLogs` in both `clearTable` and `restoreGame`, so the shared turn-history survives seat swaps (previously only the creator's turns survived a lap). Live `#log` = current turn (cleared each pass, by design); the turn-dropdown = the full shared history.

> Phase 1 is **not yet runtime/online-verified** — syntax + 12/12 logic suite + byte-identical builds only. Johan to test live. **Server-version sync (to silence the online mismatch notice) is deferred until everything is done** — Johan's call. **Phase 2 (leaf-module extraction) is underway** (`sfx`, `fx` carved byte-identically); its documentation lands when the phase completes.

## Fas 2 — module decomposition: leaf/feature extraction, helpers registry, core seams, relocation (25 June 2026) [client 2.0 / server 2.0]

Phase 2 of the refactor (analysis `elysium-refactor-analysis.md`). Mostly **byte-identical extractions** via the B1 concatenator (the monolith stays source-of-truth; `elysium-src/` is the derived, re-split fragment set) plus one real refactor, one server fix, and a **full concern relocation** (the final step).

**The B1 fragment set (13 fragments), in source order:**
`app-1 · decklab-editor(leaf) · app-2 · tokens-engine(leaf) · app-3 · esc-crypto(leaf) · net(core seam, includes escrow) · app-4 · hotseat(feature) · app-5(state+render+input clusters) · sfx-audio(leaf) · fx-anim(leaf) · app-6`. Build pipeline: `split_client.py` (anchors on plain-ASCII section comments) → `elysium-build.js` (manifest-driven) → verify via `node --check` + test suite + split→build round-trip. Glue between named fragments is numbered `app-1..app-6`. **Note:** `cmp` against the pre-refactor original is NOT the gate for the relocated file (source order intentionally changed); `cmp` against the *current* split→build output IS the gate for the splitter's integrity.

**What got extracted:** five **leaves** (self-contained, contiguous) — `decklab-editor`, `tokens-engine`, `esc-crypto`, `sfx-audio`, `fx-anim`; one **core seam** — `net.js` (`inRoom → pushEscrow`: transport, `MP_HANDLERS`/`mpOnMsg`, lobby, online-sync, hand-escrow functions; bisected from its `MP_KEY` header by the esc-crypto leaf); one **feature** — `hotseat.js` (offline core + setup window; `giveHot` stays in glue).

**Helpers registry (1.99.37, a real refactor):** `HELPER_DEFS = [{key, el}]` (one array, ~line 6150) now generates the `helper` defaults, the localStorage round-trip, the `syncHelperUI` checkbox sync, and the change-handler wiring — the 8 helper keys were previously enumerated in four JS places. `hx()` and the policy gating (tournament / online host policy) are untouched; the rich HTML labels stay in the Settings modal markup. To add a helper: one registry row + one `<label>` row.

**Server fix (1.9):** `HELPER_KEYS` was missing `hand`/`handReminder` (6 of 8), so `cleanHelperPolicy` stripped them and locked online tables never propagated those two helpers. Fixed to all 8 + a comment mirroring the client's `HELPER_DEFS`. This was a **behaviour** bump (no new wire verb) — the first server bump that wasn't a protocol change.

**The relocation (the final step, executed 25 June 2026):** 42 function declarations physically moved to group them by concern. The discipline rule (move ONLY function/async function declarations, never top-level statements) was followed strictly. A Python script (`relocate.py`) with brace-counting parser handled extraction and insertion. Result:

| Concern | Functions | Section comment |
|---------|-----------|----------------|
| **State** (14) | pubXform, pubInv, readyToCanon, makeCard, topHost, isInStackOf, detachFromHost, releaseChildren, dropLocal, attach, move, serializeGame, restoreGame, buildPub | `/* ---------- State: data model, coordinates, serialization, public board ---------- */` |
| **Render** (10) | ensureImg, renderCounters, fitBoard, layout, layoutZone, restack, cardTransform, place, updateBadges, animCard | `/* ---------- Render: layout engine, card visuals, placement ---------- */` |
| **Input** (13) | regrabAtScale, clearSel, deselect, selectOnly, addSel, activeAnchor, bindCard, tap, dropCard, groupDrop, dropZone, attachTargetAt, qrDragGive | `/* ---------- Input: card interaction, selection, drag-drop ---------- */` |
| **Escrow** (5) | ensureEscrowKey, serializeHand, restoreHand, tryRestoreHandBlob, pushEscrow | `/* ---------- Hand escrow ---------- */` (inside net.js) |
| **Navigation** (7, NOT moved — already contiguous) | switchView, jumpSeat, goHome, cycleView, stepLevel, stepSeat, toggleActiveHome | `/* ---------- Navigation: view/seat/level switching ---------- */` |

**Splitter anchor update:** `NET_END` changed from `function buildPub(){` to `let escrowTimer=null, lastHandSig='';` — the frozen `let` right after the escrow functions' new position in the net body.

**Frozen items preserved in glue:** `let boardZoom=1`, `let _lastHandHover=null`, `let drag=null`, `let tdrag=null`, `let giveDrag=null`, `let escrowTimer=null, lastHandSig=''`, `const PUBZ=[...]`, `expandStack`/`collapseStack`, 33 top-level `addEventListener` statements. All stayed at their original positions per the discipline rule.

**Verified:** syntax clean, 16/16 + 3/3 tests, split→build byte-identical round-trip. No version bump (behaviour-neutral). **Live-test pending** — render/interaction has zero test-suite coverage.

**Phase 2 is complete.** All steps done: handler-maps, modals, B1 concatenator, leaf extraction, helpers registry, net + hotseat core seams, dead-code sweep, state-contract tests, and the concern relocation.

## v2.1 — L2 tab persistence + L4 token drag fix (26 June 2026)

**Prey/Predator tabs now stay visible when their columns are folded out.** Previously, `l2syncTabs` added `l2tabhide` when a column was shown (`!pp || shown`), forcing users to switch from "click the tab to open" to "click the header strip to close". Now the tab only hides when no neighbour exists (`!pp`). The tab sits at the screen edge (z:630) above the column (z:60), acting as a close handle with the existing `toggleL2Fold` click handler. The column header strip (`l2hd`) still works as a parallel close path. The `l2tabon` class gives visual feedback (brighter border + text) when the column is open.

**L4 token/globe drag: scale fix + drag shadow.** Tokens (Edge) and the player pool globe jumped to ~43% larger on drag start because the pointermove scale used `l2pub.s` without the `L4_TOKEN_S` (0.7) multiplier that `placeToken`/`placeL4Globe` apply. Fixed by adding `*(l4on()?L4_TOKEN_S:1)` to both drag handlers. Added `filter:drop-shadow(0 12px 20px rgba(0,0,0,.8))` on `.token.dragging` and `.l4globe-mine.dragging` to match the card drag shadow effect (base token shadow is `0 4px 8px`).

**L4 card attachment hit-box: scale fix.** `attachTargetAt` used `l2pub.s` for the hit-box dimensions, but cards render at `l2pub.s * L4_CARD_S` (0.5). The hit-box was 2× the visual card size, causing false attachments to cards that appeared distant and "snap-back" when the dropped card jumped to the false host's position. Fixed by adding `*(l4on()?L4_CARD_S:1)` — same pattern as the token fix and the existing card drag scale.

**L4 edge padding removed.** `PAD` in `dropCard` and `groupDrop` reduced from 2 to 0 for L4, so cards can be placed edge-to-edge with the board boundary to maximise usable space.

**Dock pool globe clan watermark.** `refreshClanDisplay()` now inserts the `.clansym-pool` image into `#dockPool` (the dock pool globe used in L2 columns, L3, and L4), mirroring the existing logic for the main `#pool` globe. CSS was already in place (`#dockPool .clansym-pool`, line 335) — only the JS injection was missing.

**L4 dock: deferred close + scale on hand drag + drag-to-reopen.** Previously, dragging a hand card in L3/L4 immediately closed the dock AND scaled the card to board size. Now in L4 the dock stays open at drag start AND the card stays at dock scale (s=1) — `drag.l4DockDefer=true`, no `regrabAtScale`. The scale transition and dock close are deferred until the cursor exits the dock area (above `H*0.66`): at that point `regrabAtScale(c, drag, boardScale)` fires, the dock closes, and the card shrinks to board size. Crucially, the L4 transition checks run BEFORE the x,y computation so that `regrabAtScale` offsets are applied to the current frame's coordinates. A drag-to-reopen check (`yd >= H-36`) lets any card re-enter the dock: `setL2Dock(true,true)` + `regrabAtScale(c, drag, 1)` scales the card back to dock size. L2 column mode retains its existing drag-to-reopen. L3 behaviour (immediate close + scale) unchanged.

**Live-test pending.**

**Hand card hover float in L4 dock.** The `handhover` guard (`!(l3on() && !l3handOpen)`) blocked the float-up effect in L4 because `l3handOpen` (the parked L3 hand overlay flag) is always false — the dock uses `l2dockopen` instead. Added `&& !board.classList.contains('l2dockopen')` to the guard so the hover works whenever the dock is open.

**Pile-card (crypt/library/ash) dock-drag scale fix across all views.** The first-motion block and drag `sc` only handled hand cards from the dock; pile cards stayed at s=1 during the entire drag and jumped to board scale on drop. Three changes: (1) first-motion extended from `c.zone==='hand'` to `c.zone==='hand' || PILES.includes(c.zone)` — L4 sets `l4DockDefer`, L3 and L2-columns call `regrabAtScale` immediately (dock close conditional on hand-only). (2) drag `sc` now includes `drag.moved && PILES.includes(c.zone)` so pile cards render at board scale during drag. (3) L4 dock-exit doesn't close the dock for pile cards (`c.zone==='hand'` guard around the close), and the dock-enter check handles an already-open dock (`!l2dockopen` → `setL2Dock`; else just `regrabAtScale`).

**Edge button z-index under open dock.** `#edge` sat at z:4700, above the dock background (z:4400) and dock zones (z:4600), so it floated over the open dock in L3/L4. Added `#board.l3mode.l2dockopen #edge{ z-index:4300 }` to push it below the dock background when the dock is open.

**Stacked children invisible to placement systems.** Attached cards (children riding a host) now have zero impact on other cards' placement: (1) `attachTargetAt` filters out `t.host` so children can't be false attachment targets — only hosts and standalone cards participate in hit-testing; (2) `nudgeFree` skips `oc.host` so children don't push newly played cards away from their overlap zone. Children remain hoverable, previewable, and interactable — only their collision footprint is suppressed. Applies to all views (L1–L4).

**Unified dead space in L3/L4: board fills `#tableArea` via `l2cols`.** Previously, L3/L4 used a fixed 1004×616 canvas with CSS scale — when the aside panel collapsed, the freed space was `#tableArea` background (dark green), visually separate from the board's felt-texture dead space. Now `enterL3`/`enterL4` add the `l2cols` class, making `#board` fill the entire `#tableArea` via `position:absolute; inset:0; width:auto; height:auto; transform:none`. All dead space is inside the board (felt texture); zoom/pan integrates with the panel toggle. `fitBoard` updated to return early for all `l2cols` cases (not just non-L3). `exitL3`/`exitL4` now remove `l2cols`. The resize handler calls `renderL4()` for `net.view==='l4'` (previously unhandled). `l3geom()` now returns the actual board dimensions (not 1004×616), and all L3/L4 layout is resolution-independent — mats, slots, zoom/pan clamping adapt automatically.

## v2.2 — Path of Enlightenment + L4 polish (26 June 2026)

### Path of Enlightenment (V5 Sabbat)

**Constants:** `PATHS` (name→{short, slug}), `PATH_NAMES`, `PATH_SVG_SLUGS` (normClan→slug), `pathSymUrl(name)`. Icons from `static.krcg.org/svg/path/`. `clanSymUrl()` handles path names automatically via `PATH_SVG_SLUGS`.

**Card model:** `c.path` (path name or null), `c.noPath` (boolean). Serialized in all 6 points (snapshot, restoreSnap, serializeGame, restoreGame, buildPub, serializeHand/restoreHand). `cardTitle()` shows path in tooltip. `.pathbadge` overlay on cards (23px, bone-white circle background, `border-radius:50%`, `padding:2px`, `box-shadow`). Only visible on face-up cards.

**Detection:** `detectPath()` / `activePath()` — same pattern as clan detection. `displaySymbol()` determines pool-globe icon: path wins only if path-count *strictly* exceeds clan-count; tie → clan. `refreshClanDisplay()` uses `displaySymbol()`. Both `detectClan()` and `detectPath()` skip face-down cards.

**"Special…" submenu:** crypt and library cards in COUNTER_ZONES now have a "Special…" submenu at the bottom of the right-click menu. Crypt: Follow Path / Remove Path (face-up Sabbat only). Library: Convert to vampire. Converted cards: Revert to library card.

**Pool-globe menu:** paths merged into "⚝ Choose clan…" (one unified submenu). `state.chosenClan` holds both clan and path overrides. `state.chosenPath` removed entirely.

**Helper:** `pathBlood` (default off). Burns 1 blood, gates to Influence phase (menu items greyed out via `.mi.disabled` in other phases). Only the blood-burn is a helper — the general Follow Path mechanic is always available, including in Tournament mode. Server `HELPER_KEYS` updated.

**KRCG integration:** `loadCardDB()` reads `card.path` into meta AND derives `ri.sect` from `card_text` at parse time (Sabbat/Camarilla/Anarch/Laibon/Independent via `\bX\b` regex; `card.sect` overrides if KRCG adds it). Sect is derived once at load, not per menu open. Card preview shows path in meta. Menu code: `ri.sect==='Sabbat'` (clean). Cards unknown to KRCG fall through as "show menu" (defensive). KRCG PR #830 path field: read when available, blocks manual choice for vampires with printed path.

### L4 board & interaction polish

**Canonical board AR.** `l3canonAR` stores the board aspect ratio based on collapsed-panel dimensions. `l3geom()` letterboxes within the current board: panel collapsed → fills edge-to-edge, panel open → dead space top/bottom. `_asideResize` flag distinguishes aside toggles (AR preserved) from true window resizes (AR recomputed). Board marking (`#l3table`) maintains proportions regardless of panel state.

**Edge button + timer centered.** `l3clockCy` changed from `H*0.45` (full board) to `g.ay+g.ah*0.45` (letterboxed slot). Edge button horizontal position changed from hardcoded `1004/2` to `fx+fw/2` (slot center).

**Reset view button.** `#l3resetBtn` added above the zoom toggle in L3/L4 — resets zoom+pan in one click without opening the zoom panel. Styled to match existing buttons. Visible only in L3/L4 (hidden toggle in enter/exit).

**Click-outside-to-close zoom panel.** `pointerdown` listener on `document`: if the zoom panel (`#l3zoomCtl`) is open and the click is outside it and the toggle button, the panel closes.

**Pile drag fix.** `libDragTarget()` and `cryptDragTarget()` used `#z-ready.getBoundingClientRect()` for "ready" hit-test, but in L4 the zone box is smaller than the board. Now: in L4, the entire `board.getBoundingClientRect()` counts as "ready". Hand card drag was unaffected (uses the separate `dropZone()` function which already handled L4 correctly).

**Pool globe hint.** `l4hintDone` flag prevents the "Drag your pool globe" hint from reappearing on panel toggle / resize after the user has already dragged their globe.

### Menu system

**Disabled items.** `renderItems()` supports `it.disabled`: adds `.mi.disabled` class (opacity .4, `pointer-events:none`) and skips click-handler wiring.

### Bugfixes

- `convertCardKind()` called non-existent `updateClan()` → `updateMyClan()`.
- `detectClan()` counted face-down cards → added `c.faceDown` filter (matches `detectPath`/`clanCount`/`pathCount`).
- Sect derivation regex used Python `\b` (backspace 0x08) instead of JS `\b` (word boundary) — fixed via binary byte replacement. Learnings updated.
- Path menu hidden for ALL cards when KRCG loaded but card not found (name-miss) — changed `_isSabbat` logic: unknown cards now fall through as "show menu".

**Live-test pending.**

## v2.3 — Files, Caching & UX Polish (26 June 2026)

### Local image cache (IndexedDB)

**Architecture.** Card images and SVG icons from KRCG are downloaded and stored as blobs in IndexedDB (`elysium-images` db, `cards` store). At startup, `warmImgCache()` iterates all entries and creates `URL.createObjectURL(blob)` references in `imgBlobCache` (Map: normName → blobUrl). `imgUrl()` checks this Map first (gated by `conv.imgCache` boolean — zero overhead when off), falling back to the KRCG URL. `clanSymUrl()` and `pathSymUrl()` use the same cache with `svg:clan/slug` / `svg:path/slug` keys.

**Download manager.** `downloadImages(names)` handles both card images and SVG icons (distinguished by `svg:` prefix in the name). 6 parallel fetches, AbortController for cancel, 30ms inter-batch delay. Failed names are collected in a `failed[]` array; after the main loop, a single automatic retry pass runs after a 2-second pause (catches transient network errors). Three collection functions: `collectAllNames` (requires cardInfo), `collectDeckNames` (parses saved decks), `collectGameNames` (current table). All three include SVG clan/path icons via `collectSvgNames()`.

**vtes.json caching.** `loadCardDB()` refactored into `processCardData(data, src)` + `fetchVtesJson()` + `loadCardDB()`. The raw JSON is cached in IndexedDB under key `_vtesJson`. When `conv.jsonSync` is off, loads from cache (fast, works offline). When on, fetches from KRCG and updates cache. Network failure gracefully falls back to cache even when sync is on.

**Image sync.** `imgSyncCheck()` runs after every card DB load. Compares `cardImageNames` + SVG names against `imgBlobCache` — downloads only new/missing entries. Triggered by `conv.imgSync` toggle.

**cardImageNames.** `processCardData` stores three name variants per card in `cardInfo` (for lookup), but only `norm(card.name)` matches KRCG image filenames. `cardImageNames` (Set) tracks only primary names; `collectAllNames()` and `imgSyncCheck()` use it for downloads instead of `cardInfo.keys()`, avoiding ~1500 spurious 404s.

**Settings UI.** Files section moved to top of Settings. Contains: Card database toggle (moved from Convenience), Download/Refresh button for vtes.json, Auto-sync toggle, Use cached images toggle, Auto-download new images toggle, Image format dropdown, Download buttons (All/Decks/Game), Progress bar + Cancel, Cache stats, Persist, Clear all. Storage sub-section: Autosave mode / Saved game / Deck library / Settings clear buttons, Total estimate, Clear everything (nuclear option). Brightness and SFX master volume are inline slider rows at the bottom of Convenience (brightness above SFX).

### UI & UX changes

**Hover preview setting.** `conv.hoverPreview` ('key'/'always') controls whether card images show on hover or require Ctrl when the panel is collapsed.

**Dock log zone.** `#dockLog` in the bottom dock shows a scrollable log mirror when the panel is collapsed. Positioned right of hand (L2) / pool (L3/L4).

**Played/Ready tab centering.** `--tab-mid: calc(50% - 20px)` when panel collapsed, centering tabs under the Pass button.

**Welcome dialog redesign.** `#empty` has felt gradient background (hides zones), starts with `display:none` in CSS (shown by JS after startup to avoid flash). Dialog has quick buttons (Settings, Deck Lab), **Resume button** (visible only when localStorage has a saved game), KRCG recommendations (hidden when already set up), Play buttons, "Do not show again" toggle (`conv.showWelcome` — forced visible when a save exists so Resume is always reachable).

**Manual save resume.** No silent autosave restore at startup. The user clicks Resume on the welcome dialog (or starts fresh). Click handler re-reads from localStorage at click time. Online rejoin is separate (server messages). Clearing the save from Settings → Storage hides the Resume button.

**Discard-hover keybinding.** `_lastBoardHover` tracks the card under the pointer. `ashHover` shortcut (Advanced, no default key) sends hovered card to ash heap. Works in all views.

**pcoHome merged into pco dropdown.** New `pco='home'` value replaces the separate checkbox. Dropdown: On / Hide home / Mine hidden / All hidden.

**Oust helper text.** Removed outdated multiplayer caveat — bounty works in all play modes.

**`.set-row[hidden]` CSS fix.** `.set-row` had `display:flex` which overrode the `hidden` attribute. Added `.set-row[hidden]{display:none}`.
