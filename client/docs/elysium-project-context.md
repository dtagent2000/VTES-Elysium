# Elysium - Project Context & Working Reference

> **This doc reflects client v2.6.190 / server v2.6.54 / bot v0.6.241 beside the suite (27 November 2026).** Its 214 release entries of 24 Jul to 26 Nov 2026 are frozen, whole and verbatim, in the private data repo's `client-history/elysium-project-context-2026-11-26.md` (`docs/history/README.md`). New entries go on top, newest first; the protocol note and the reference sections follow them.

> **27 November 2026 (THE PUBLIC REPOSITORY — client v2.6.190 / server v2.6.54 / bot v0.6.241 beside the suite; comments only, no wire change):** **The rule:** no chat quotes and no names of private persons in a file, a commit message or a PR text; a decision is written in our own words and names the owner by role. The owner's name may stay on the lines that existed on 26 Nov; a line a change touches is new text, so it names the owner by role, all of it (`--diff` reads every added line whole, and a release entry here is one line). Licence credits (Tabler Icons' copyright holder, zero-vtes's author), a published strategy source and the invented table names of the tests and examples (Anna, Bob, Lisa, Mara, Hanna, Viktor, the demo seats `DEMO_NAMES`, the long-name test's names) stay. **`tools/public-scan.py` v1.0.0** (main's copy of `bot/tools/public-scan.py` v1.1.0): `OWNER` (the bot's four hashes), `ALLOWED_PAIRS` (the bot's crypt-card pair), `PRIVATE` (sha256 of each private name the round found and its genitive; add a name there when a round finds one, never the name itself); the rules `owner`, `name`, `quote` (the bot's Swedish rule, unchanged: two common Swedish words, or one and å/ä/ö in at most 30 words; a quote that wraps is read with the next two lines), `quote-en` (a quoted span of 2+ words that opens at most 60 characters after the owner's name, the role -- `the owner`, `owner's` -- or a private name on the same line) and `sv` (three distinct common Swedish words on a line without marks); `mode_of(path)` -- `journal` for the session journal (every rule but `sv`), `self` for the scan itself (the name rules only), else `full`; `owned()` = `client/`, the root's release files and start scripts, README.md, LICENSE, the root CLAUDE.md and main's two workflows. `--diff REF` (or `A..B`) fails on any hit in the added lines and in the range's commit messages; `--tree` fails on `name`, `quote`, `sv` and a name in a path, counts `owner` apart (ALLOWED) and lists `quote-en` per file (REVIEW: on old lines it is mostly a UI string after the owner's name). Exit 1 on a failing hit, 2 on a usage error; `--self-test` 23 checks with invented names (the marks are built with `chr()`, so the file scans clean). **CI:** `client-gates.yml` checks out with `fetch-depth: 2` and runs `python3 tools/public-scan.py --diff HEAD^1..HEAD` from `client/` on a pull request (the merge commit's first parent is the base); the workflow's paths gained `README.md` and `CLAUDE.md`. **How the comments-only release was proved:** acorn 8's `tokenizer` (ecmaVersion latest) over every `<script>` element of the client (3 in v2.6.190) and over the server, styles with `/* */` removed and whitespace collapsed, markup with `<!-- -->` removed and whitespace collapsed, old against new: one difference in each file, the VERSION string (SKILLS, "Prove a comments-only release"). **The words taken out** of the pages that stayed public are in the data repo's `client-cleanup-2026-11-27-words.md`: a `##` heading per file, then each touched range as `- lines:` and the original lines quoted, taken from `a94072b` (not from an intermediate state). **The error digest** is v1.5.1 (comments only); the CHANGELOG's Digest section gained v1.5 and v1.5.1. **Kept in the UI on the owner's choice:** `#mpName`'s placeholder and the offline seating prompt's example list name the owner.

> **Protocol for these two docs:** at the start of work on a game project, read the latest project-context and learnings docs *first* - before digging into the code or the rest of the files. After each implementation, update them where needed - a version bump, a new learning or pitfall, a changed convention.

A fast-start orientation for picking up Elysium development, especially from a fresh AI session. Pair this with **elysium-learnings.md** (learnings + collaboration). The user-facing manuals live in the three generated Word files; the forward backlog is in the Technical Documentation Word doc and in the session journal.

## What Elysium is

A free, browser-based digital table for *Vampire: The Eternal Struggle* (VTES), Dark Pack compliant. It is a **sandbox**: it enforces no game rules - the players do - but it logs everything, keeps hidden cards genuinely hidden, and shows every action to the whole table. Two ways to play:

- **Hotseat** - several players take turns on one screen, no server.
- **Online** - a bundled Node server holds the hidden piles and relays the table to networked players.

Tech: a single self-contained HTML file (vanilla JS + HTML5 Canvas/DOM, **zero dependencies**) for the client, and a single Node file (**zero npm packages**, hand-rolled WebSocket) for the server. Current version: **client 2.6.55 / server 2.6.26** (the two patch numbers are free to drift apart on client-only changes, per the v2.5.30 major.minor lockstep policy; srv-2.6.27 — the errRecord ver-fallback for report payloads — was the last server-logic change, deployed 7 Aug 2026, so no restart is pending).

## The files

| File | What it is |
|------|-----------|
| `elysium-vtes-bord.html` | The client - the entire game, UI, network layer, and the embedded hand-escrow crypto. ~10,000+ lines. Almost all work happens here. Current version: **2.6.15**. |
| `elysium-server.js` | The server - rooms, hidden piles, relay, sanitisation, named saves. ~56 KB. Also serves the client file to browsers. |
| `esc-crypto.js` | Standalone reference copy of the hand-escrow crypto (SHA-256/HMAC/PBKDF2/AEAD); the same code is embedded in the client, so this file is **repo-local reference only** — correctly absent from the project snapshot (see the inventory). |
| `build-docs-en.js`, `build-docs.js` | Generators for the English / Swedish Word docs (uses the `docx` npm lib). Edit content here, then re-run; do not hand-edit the .docx. **Local-only — not always in snapshot.** |
| `Elysium - Player Manual.docx`, `... Host Guide.docx` (**v1.7**, 2 July 2026), `... Technical Documentation & Roadmap.docx` | The generated English docs. The Technical doc also carries the forward backlog. Host Guide v1.7 added "Hosting on macOS & Linux" and "Bring your own server", a Link-invites bullet, and three Troubleshooting rows - rebuilt directly with `docx`-js this round since the generator wasn't in snapshot; see `elysium-learnings.md` for the mechanism. |
| `elysium-relocation-plan.md` | The consolidated relocation plan (replaces `elysium-relocation-brief.md`). Documents the discipline rule, TDZ constraints, frozen items, all decisions, and verification commands. Kept for reference — the relocation is complete. |
| `relocate.py` | The Python script that executed the relocation (brace-counting parser, 42 functions). Kept for reference. |
| `kodarkivering.md` | Parked / retired code, archived verbatim with what/why/where notes (the Alt views, the L3 circle table, `renderOval`, the Simplified default-view setting). Nothing here is wired into the client. |
| `START-HERE.html` / `STARTA-HAR.html` | Browser onboarding for people you share Elysium with (guest / host / Tailscale + troubleshooting), EN / SV. **v1.4 (2 July 2026):** three-OS host + tunnel paths (Windows/macOS/Linux) and Mac/Linux troubleshooting rows; the SV file is a clean retranslation of v1.4 — diff against any locally tweaked copy before replacing. |
| `start-elysium.bat` | Windows launcher with a Node check. Never double-click the .js directly - the Windows Script Host kills it with "Invalid character, line 1". |
| `start-elysium.sh` / `start-elysium.command` | macOS/Linux launchers (Batch 4, v2.5.37) - the .command is the Mac double-click wrapper. `chmod +x` once, or `bash start-elysium.sh`. |
| `start-cloudflare-tunnel.sh` / `start-cloudflare-tunnel.command` | macOS/Linux tunnel launcher (+ Mac double-click wrapper) - mirrors the .bat (waits for the real `https://…trycloudflare.com` line, prints it loudly, pbcopy/xclip when available). |
| `ELYSIUM-PROTOCOL.md` | **The client↔server contract** (Batch 4): transport, session, security invariants, MUST/MAY server capability split, all 48 c→s verbs + 42 s→c messages with fields (generated FROM the code), deep-link prefill, conformance suites, Dark Pack note. Machine-guarded - see the next row. |
| `test-protocol-doc.js` | The protocol-doc lint, **v2 (six checks)**: the doc's three verb-index marker blocks AND every §7/§8 per-verb field list, diffed against the LIVE `GAME_HANDLERS`/`MP_HANDLERS` tables both directions (fields via `Function.toString()` — the generator's own extraction, drift-proof by construction). **Any protocol change ships with a doc update + a green run.** |
| `check-versions.js` | One-command snapshot drift check: code VERSIONs, the four living-doc headers, the PROTOCOL header, the START-HERE/STARTA-HAR twins, suite expectations, and presence of the split/build/harness trio. Exit 1 on drift — run at session start. |
| `elysium-bot.js` | **Trainbot v0.4.3** (13 July 2026, gate 65/0) — a headless, zero-dependency Node WebSocket client that takes a real seat. v0.1 base: RFC 6455 client mirroring `wsAttach`, `sanitizePub`-shaped pub authoring, correct phase order incl. the opening-transfer stagger, influence from playbooks, Block?-asks, the chat grammar (`bleed N`/`vote N`), oust→`bounty`. v0.2: the pending-bleed machine (apply ONLY on 'It resolves'; +X reopens; block-success aborts; supersede; stale-on-turn-change), §12 parsing + frozen-line announces, the symmetric reaction window ('Hold on…'/'Pass'; multi-channel ask: chat + say + §12 lines), table model + cardfx threat reads, tally mirror (READ-ONLY) + capability detection (classic ⇒ one tip), the three-tier name ladder (norm() client-identical), cardfx crypt caps, the seat-anchored L4 camp (pool token + camp slots), the decide() persona seam, a paced outbound queue (server closes >80 msg/10 s). v0.3: personas + the insight hand-read (`readP`), bleed-card plays with draw-back, stealth vs Block! (ask stays open), queue-coalesced push. v0.3.1: exception-guarded dispatch (one bad message never kills the multi-bot process). v0.3.2: crypt uniqueness. v0.3.3 RULES LAYER: tag-aware uniqueness (five true non-uniques may dup), unique-library `_mayPlay` guard, per-action modifier ledger, the Edge on through-bleeds (v0.3.4: rising-claim yield + gone on oust); v0.3.5: `create`/`startPool` opts + 'bot:' telemetry (the data layer); v0.3.6: the ghost-prey rule (asks never wait on ousted preys) + hardened _drain; suite spawns a server COPY in tmp. v0.3.7 (the live-test round): verdict-wait on 'Block!' when resolvers are live, fxClone emissions (plays ANIMATE), the discard phase (1/turn), crypt fetch at 4 transfers + 1 pool, pacing defaults 2000/1600, forceSetPool deduped+enhanced (clamp, oust-on-zero), and the pacer rebuilt as a TOKEN BUCKET (burst 8, 1/140 ms — the rolling-window cap stalled critical says); a missing cardfx now WARNS loudly (plain-bleed mode). v0.3.8-10: repeated-Block! wait fix, PUBLIC ash heap, TOKEN-BUCKET pacer, the Reaction-timer ring, withdrawn-block reopen. **v0.4.0 (M2, 13 July): informed block-as-target** (blockShy finally used), **reactions** (intercept/wake/Deflection-bounce, once-per-action ledger ENFORCED), **combat module v1** (data-driven strike/prevent, one round, announce-only), vote-abstain courtesy. **v0.4.1 (Johan's catch, source-verified):** bounce now checks a LEGAL destination exists (`preySeat() !== actorSeat`) — a 2-live-player table collapses predator/prey onto one seat, which the rulebook forbids bleeding/bouncing onto ("you can never bleed yourself"); `interceptPotential()` made ledger-aware to match `_commitBlock`'s enforcement. **v0.4.2:** combat tally a/b zeroed, wake sleeper-guard, bounce idx re-anchor by name + unlocked-minion req, ousted abstain-quiet. **v0.4.3 (audit):** blocker LOCKS entering combat (rulebook), capability-aware `_pickBlocker()` (decision/execution agreement). WIRE_V 2.6.0; BOT_VERSION its own. |
| `elysium-bot-arena.js` | **v1.0.0** (12 July 2026) — the authoring pipeline's EVALUATE rung: headless match runner (`runArena()` module + CLI), bot-hosted rooms, persona rotation per match, last-standing play with backstops, per-persona wins/damage/decisions, JSONL traces (decide-why, dealt hands, results) + summary.json. Gated in the bot suite §12; diagnosed its first bot bug (ghost-prey drag) on day one via its own traces. |
| `elysium-bot-table.js` | **v1.0.0** (12 July 2026) — seats a whole TABLE of Trainbots in one command: persona rotation (`--personas shark,grinder,novice`), optional names, staggered joins, one process, SIGINT cleanup, max 4. Smoke-proven: the bot-vs-bot pending loop closes end-to-end (arena prerequisite). |
| `START-HERE-BOTS.html` | Player-facing bot guide (mirrors the START-HERE aesthetic): quick start, the launcher, the persona table, the supported table config, chat grammar + say phrases, humans+bots networking (tunnel wss for humans, ws-only for bots), not-yet list, and the stage's live-test checklist 1–12. |
| `test-bot-logic.js` | Trainbot end-to-end gate (**17 asserts**): spawns the REAL `elysium-server.js` on a random port with a tmp cwd, drives a scripted host client + a Bot instance over loopback WebSocket through lobby→seats→decks→start→two bot turns (block contract, torpor, pass-guard)→damage grammar→oust/bounty routing. Run-gate family. |
| `cardfx-compile.js` | **The card-effect library compiler v1.1.0** (v3/v5 dual-format via `normalizeCard()`, mirroring the client's parser) (12 July 2026, bot track) — zero-dep; compiles KRCG’s vtes.json (+ the curated overlay) into `elysium-cardfx.json`: per-card effect tags (fx), discipline-level modes with “As above” resolution, type-bracket faces, crypt caps/titles/votes, and a plain-name alias map with a deterministic collision ladder (non-ADV → newest group). Facts only — policy stays in playbooks. |
| `cardfx-curated.json` | The HAND tier: whole-entry overlays verified against printed card_text (src:’hand’). Curation queue: shipped-playbook cards → TWDA staples → proven auto mistags. |
| `elysium-cardfx.json` | The compiled artifact (fxv 1) — 2364 lib / 1785 crypt / 2422 aliases, 62% auto-fx, one entry per line for diffable regenerations. Consumed by bots for threat reads, own-hand fx and influence math. |
| `test-cardfx.js` | The cardfx gate (**39 asserts**, run-gate family; incl. the v5-format fixture section: known-card extraction semantics (level split, As-above inherit+override, type brackets, directed-vs-self-cost pool damage), alias ladder, curated precedence, determinism, and a shipped-artifact drift guard. |
| `elysium-cardfx-design.md` | Schema (fxv 1) + the three quality tiers + consumer contracts + extraction pipeline + honest limits + the TWDA curation roadmap. Read FIRST for any cardfx work. |
| `HOST-GUIDE-ADDENDUM.md` | Two Host Guide sections (Mac/Linux hosting; Bring your own server). **Merged 2 July 2026** into `Elysium - Host Guide.docx` (now v1.7) - see the file table above and the journal entry of the same date for how, since `build-docs-en.js` wasn't available this session. |
| `test-2a/2b/2c/2d/2e/2f/2g.js`, `test-autosave.js`, `test-crypto.js`, `test-helper-policy.js` | The server + crypto test suites. |
| `test-client-logic.js` | The **client** logic suite (Phases 0–1). Loads the real client functions in Node under a DOM stub and asserts serialize<->restore, the `pubXform`/`pubInv` inverse, `buildPub` hand-secrecy, `restoreGame` defensiveness, `baseView`, the debug ring buffer, the `mpOnMsg` handler-map routing, and the hotseat-log `keepLog` guard, plus the state-contract depth (single-zone `move` invariant, attachment round-trip, id/position survival, `buildPub` purity). Run: `node test-client-logic.js` (16 assertions) + `node test-server-dispatch.js` (5: the server `handle()`/`GAME_HANDLERS` routing plus per-room/per-IP password-fail throttling, via `loadServer`). Both suites were re-synced at v2.5.35 to the post-cross-board handler counts (MP_HANDLERS 42, GAME_HANDLERS 48) — the project copies had gone stale at 39/45 and masked/invented deviations (the journal's old “15/16”). |
| `elysium-test-harness.js` | Shared zero-dep stub-loader the client suite requires — the one place the Proxy DOM stub lives. Also serves as the load smoke-check (catches runtime ReferenceErrors the syntax check misses). |

## Working environment & hard constraints

The development sandbox is **not** a browser and **not** a live network:

- **It cannot render HTML or run the server / multiplayer.** So everything visual or runtime - animations, layout, the views, turn flow, the hidden hand, hotseat switching, every online path - is **unverified by the assistant**. Johan tests these live. Always say so.
- **bash networking is usually disabled** (egress off; loopback uncertain). Don't assume you can install npm packages, and don't run the WebSocket test suites blind expecting them to connect.
- **Node is available**, and the **`docx` npm lib is installed** (so the doc generators run).
- Files the assistant creates are only visible to Johan after `cp` to `/mnt/user-data/outputs/` **and** a `present_files` call.

## How to verify a change (without rendering)

These are the reliable gates in the sandbox:

- **Client JS syntax:** `sed -n '/<script>/,/<\/script>/p' elysium-vtes-bord.html | sed '1d;$d' | node --check -` (expect no output = clean).
- **Client logic suite:** `node test-client-logic.js` -> expect `16 passed, 0 failed`. Drives the *real* serialize/restore/buildPub/pubXform/baseView/dbg functions through a DOM stub (`elysium-test-harness.js`), so it guards the module extraction — it catches logic regressions the syntax check can't, and also serves as the load smoke-check (catches runtime ReferenceErrors).
- **Server JS syntax:** `node --check elysium-server.js`.
- **Protocol-doc lint (v2):** `node test-protocol-doc.js` -> expect `6 passed` (verb/message indexes AND per-verb field lists vs the live handler tables, both directions - run it after ANY handler-table change).
- **Snapshot drift check:** `node check-versions.js [dir]` -> expect `everything agrees` (versions across code/docs/suites + the tool-trio presence; point it at the project snapshot at session start).
- **Server dispatch suite:** `node test-server-dispatch.js` -> expect `5 passed` (the `handle()`/`GAME_HANDLERS` routing plus the v2.5.0 per-room/per-IP password-fail throttle tests).
- **Fragment build round-trip (B1):** `cp elysium-vtes-bord.html /tmp/original.html && python3 split_client.py && node elysium-build.js /tmp/rebuilt.html && cmp /tmp/original.html /tmp/rebuilt.html` -> byte-identical proves the splitter anchors still match the monolith. Re-anchored at v2.5.0: `net.js` now ends at the hotseat block (12 fragments, was 13).
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

- **One file per side**, both dependency-free. The client is authoritative for your own board; the server is authoritative for hidden piles (library/crypt) and, online, for victory points. **Johan's stated line (7 July 2026): the server file stays about SERVER concerns; only the *necessary* anti-cheat lives there.** In practice every server-side anti-cheat piece is *observation* or *gating* — sanitisation, who-may-when guards, the pub-diff ledger, a prefix mark — never rules knowledge: the server still cannot spell "bleed", and the whole v2.5.64–67 suite cost 116 net lines. The rules engine stays ruled out (anticheat draft §6); when a future idea needs the server to KNOW the game, that is the signal it belongs client-side or nowhere.
- **`serializeGame()` / `restoreGame()`** capture and restore a whole board as a JSON blob; **`buildPub()`** produces the public (opponent-visible) view. **Save format = wire format** - the same public representation is the autosave and the network payload. This dual purpose is deliberate; preserve its forward-compatibility.
- **Hotseat = the same model, locally.** `net.hot.boards[seat]` holds each seat's `serializeGame()` blob (a **JSON string**, not an object); the active player `net.you` is switchable (PRIORITY bar / Table dock); non-active seats render from a locally-built `buildPub()` stored at `net.boards[seat].pub`. The roster, the shared Round/Turn counter and the *cross-board* aim (`net.rtarget`) live on `net` (never swapped); the *local* aim (`state.target` — the play-FX target arrow + the log's ` Target:` suffix) is per-seat and travels inside each seat's `serializeGame` blob (added v2.5.3; it was previously omitted, so it was wiped on every hand-off). The seam: view/turn behaviour gates on **`tableView()`** (true in both modes); networking keys off **`inRoom()`** only where a real socket is involved.
- **L3 "helicopter" view has two coordinate worlds.** Opponent furniture (mats, centre timer, table) lives inside `#l3stage`, which carries `translate(pan) scale(Z)` and so pans/zooms as one rigid unit. Your own live board (`#z-ready`, `#poolWrap`, `#edge`, your cards, the Edge token) stays on `#board` and is hand-positioned by `setCenterFrameA`, folding the same transform in manually (`Px+Z*coord` for position **and** `scale(Z)` for size). `l2pub` already contains `Z` (`l2pub.s = baseS*Z`), so anything routed through `pubXform`/`pubInv` is automatically correct under zoom — don't re-multiply. See learnings for the full set of L3 rules.
- **Tokens are a family beside the card system.** Non-card objects must never enter `state.cards`/`state.zones` (it breaks the card pipeline). The Edge lives in a separate `tokens` Map with `TOKEN_DEFS` (registry: `label/size/svg/menu` per type) and a generic engine (`makeToken`/`placeToken`/`bindTokenDrag`/`removeToken`) that *reuses* `pubXform`/`cardTransform` for placement but skips zone/`move()` logic. `buildPub()` exports `tokens:[{type,x,y}]` and `buildMat()` draws them so a token shows on its controller's mat in every view. A new token type = one `TOKEN_DEFS` entry.
- **Online flow:** a board change builds `buildPub()` (debounced) -> the server sanitises -> broadcast as `board`; hidden ops (draw / browse / reveal / take) are owner-exclusive verbs; the hand never leaves the client except as an **encrypted escrow blob** (key derived via PBKDF2 from the room password + a public salt; the server stores and routes it but cannot read it).
- **Helpers** (toggleable conveniences): a phase-structure assistant, the **oust helper** (`conv.poolToPredator`, on by default) that awards the ousted player's predator +6 pool and +1 VP, and the **path blood helper** (`hx('pathBlood')`, default off) that burns 1 blood when a Sabbat vampire follows a Path (Influence phase only).
- **Board Mode** (`net.boardMode`): an exclusive choice made at game start — **Classic** (`'classic'`, default: L4 free-form open table, Lackey-style) or **Structured** (`'structured'`: L2 columns + L3 helicopter, guided zones). The mode is set in the lobby (online) or hotseat-setup, stored on the server room, and relayed to all clients. `freeBoard()` gates Classic-specific behaviour; `baseView()` returns `'l4'` in Classic, `'l2'` in Structured; `levelOrder()` returns `['l4']` (single view, no stepping) or `['l2','ov']`. Classic + Tournament Mode = a clean Lackey-like experience (both are default on first run). Online: pool globe positions are exported in `buildPub()` as `{type:'pool', x, y}` in the tokens array; opponent globes are updated via `updateL4Opponents()` in the `board` handler; opponent cards are rendered via `renderL4OppCards()` using `addRCard` into `#l4oppWrap`.
- **L0 idle board.** A clean felt surface with no game UI. `#board.l0mode` fills `#tableArea` via `position:absolute; inset:0; width:auto; height:auto; transform:none !important` (like L3/L4). All direct children except `#empty` and `#toast` hidden via `display:none !important`; `#empty`'s background set to `none` so the board's felt pattern (repeating-linear-gradients) shows through; `#l1zoomWrap` hidden via `:has()`. `enterL0()` strips L2/L3/L4/l2cols classes, adds `l0mode`, clears inline transform. Entered at startup, after Reset table, after leaving an online room with a game, after leaving hotseat. Exited in `enterL2/L3/L4`, `buildDeck` (solo), `startHotseat`, Resume click. Not part of the Tab step-cycle — lives outside the game loop.
- **L4 element scaling**: `const L4_CARD_S=0.5, L4_TOKEN_S=0.7` — cards at 50%, tokens/globes at 70% of native size. Applied in `place()`, `placeToken()`, `placeL4Globe()`, `regrabAtScale`, drag-move `sc`, group drag `ms`, ghost elements, and drop-offset calculations. One line to change both values.
- **L4 interaction model**: single-click+drag = marquee/lasso selection (works everywhere on the board); double-click+hold = pan. Dock stays open during card drag (hover-logic manages open/close based on position). Pool globe: +/- buttons on hover, scroll-wheel for pool, Ctrl/Shift+click on the globe itself (v2.5.90), grab-drag to reposition. Opponent globes are read-only (no buttons, default cursor, no click). **Touch (v2.5.39 T0+T1):** long-press 450 ms = the same context menu everywhere (a document-level engine dispatches a real `contextmenu`, so all 18 existing listeners run unchanged); drag thresholds are 10 px for `pointerType==='touch'` (5 px mouse); one gesture at a time (`isPrimary` + a `drag||tdrag||pileDrag||mq||giveDrag` guard at every gesture start); pool +/- always visible on coarse pointers. **T2 (v2.5.40):** counters/pool on touch - `bindHold` (press=1, hold 400ms=repeat@90ms, overlay-guarded because `bumpCounter` can await the influence confirm) replaces the pool +/- click handlers; `buildCtStepper(c)`/`openCtStepper` is the badge-tap popover AND an embedded top row in `cardMenu` (new `it.el` item type in `renderItems`, no auto-close) - same `bumpCounter`/`bumpPool` calls, so undo/log coalescing is wheel-identical. Badge taps route through `tap()` via `drag.badgeKind` (returns before `lastTap`). **T3 (v2.5.41):** pinch-to-zoom + two-finger pan (document-capture tracker, touch, L3+L4 - zooms about the fingers via `l3zoomTo(z0*dist/d0, mid)`, owns its two pointers with capture `stopPropagation`, tears down singles on activation: direct-null for `drag`/`tdrag`/`mq` + a REAL per-pid `pointercancel` for the felt-pan mirror and pile-drag cleanups); one-finger felt pan on touch in L4 (mouse keeps dbl-click+hold); D1a: a one-shot "\u2b1a Select area (drag)" say-menu row (`_mqArm`, `noUndo` leaf type) since touch drag now pans; D2: the `#l2dockClose` chip (a static child of `#l2dockbg` at top:-15px, riding its dynamic hugging height) + ANY felt touch closes the open dock; T3d: `ctrlKey` wheel (precision-touchpad pinch) zooms proportionally (`Math.exp(-dY*0.0022)`). **T4+T5 (v2.5.42) - roadmap complete:** touch tap/double-tap draws on the piles per `conv.drawClick` (the deferred v1.35 caveat fixed; a `_tapDrawAt` 500 ms yield guards the four native click/dblclick listeners against synthesized double-draws); `bindDbl(el,fn)` gives all 7 browse dblclick sites an iPad-reliable pointerup double-tap (long holds never arm; an Android-synthesized native dblclick duplicate is eaten once via `_dtAte` + a capture suppressor); D3: tapping a stack BASE toggles the fan on touch (children stay pickable, the 380 ms guard keeps double-tap-lock from flapping it); `pinHover(c)` = the 🔍 Inspect cardMenu row (touchui, hidden for face-down per the v1.6 no-data-card-name rule) pinning #hoverCard until the next pointerdown; cardTip is quiet after touch input (`window._lastPT`); dvh + safe-area body padding + the D4 Add-to-Home-Screen metas; and the parked #edge coarse sizing folded INTO the JS placement (`-16*_ek` keeps the centre anchored under the 0,0-origin scale). See `elysium-touch-plan.md` Rev 5.

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
- `renderL3()` - rebuilds the bird's-eye: `#l3stage` (transformed wrapper holding opponent `.mat`s + `#l3timer` + `#l3table`), then `setCenterFrameA(myslot)` for your own live board. `l3slots(N, me, seats)` returns the per-player-count geometry (2p/3p two-band, even 4+ grid, odd 5+ pentagon) — **every branch returns `clockCy`** (centre-clock Y, used to anchor the Edge button).
- **L3 gap constants** (shared across all branches): `mX=0.5%` (table-edge horizontal), `mY=0.5%` (table-edge vertical), `gx=0.8%` (column gap), `cb=max(36, 6%)` (clock band / inter-row gap), `clockW=max(90, 7%)` (3-band clock width). `PAD=2` inside each slot (zone borders sit ~1px from the slot edge; L2/L4 keep PAD=12).
- **5-player pentagon layout** (the `threeBand` branch, also used for 7p): Allies centred across the top band, prey at left edge, predator at right edge, you centred at bottom. Key tuning parameters:
  - `Bw = min(wlimMid, wlimTop, Bw3 + 50)` — Bw3 is the base 3-band vertical limit; +50px expansion fills the vertical gaps between bands. Capped by horizontal limits.
  - `yM = yT + Bh + bandGap + 15` — prey/pred shifted 15px below their even-distribution position (pentagonal bias downward toward your board for closer predator/prey readability).
  - `dockShift = Bh*0.02 + 16` — your bottom board lifted to avoid dock overlap.
  - `clockCy = cy` — timer and Edge button anchored at the table's vertical centre, **decoupled** from prey/pred vertical position. This means moving prey/pred does not drag the Edge button.
  - `wlimMid = (A.aw - 2*mX) / 2` — no reserved `clockW`; prey/pred just must not overlap. The clock sits in whatever space remains (`gapMid`).
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


## conv — local settings reference (v2.5.2)

`conv` is the local conveniences object, persisted via `saveConv()` / `loadConv()` (key `elysium.convenience` in localStorage). All fields are local-only unless noted.

| Field | Type | Default | What it does |
|-------|------|---------|--------------|
| `cardDB` | bool | **true** (v2.6.74; was false) | Load KRCG vtes.json (minion detection, deck lab catalog, card text, the unknown-name check on import). One-time migration: a stored object without `dbDefault` is switched on once |
| `dbDefault` | bool | true | v2.6.74 migration flag: once saved, `cardDB` is the player's own choice again |
| `uiMode` | string | `'full'` | v2.6.74 interface mode: `'lite'` \| `'full'`. First visit on a served page (not file://, not localhost) starts `'lite'`; the body class + `uiLite()` gates follow it; opening the tutorial SWITCHES to `'full'` for real (v2.6.75) |
| `uiProf` | object | `{}` | v2.6.74 per-mode memory of the anim/pco/sfxVol trio (`{lite:{…}, full:{…}}`), written by `uiProfileSwap` on every switch; skipped by the B-63 dump (object) |
| `modeHintDone` | bool | false | v2.6.74: the first-visit Lite hint (`#modeHint` + the pulsing pill) has been dismissed |
| `poolToPredator` | bool | true | Auto-award 6 pool oust bounty to predator |
| `autoLock` | bool | true | Auto-lock acting card on action |
| `anim` | string | `'on'` | Clone animations: `'on'`/`'mine'`/`'all'` |
| `animSpeed` | number | 1.0 | Animation duration scale (0.5–2.0, ±10% steps). Applied as inline `style.animationDuration` on `.cfx` wrap + `.cfximg` children. `_swapAt` (flip midpoint) also scaled. No-op at 1.0. |
| `drawClick` | string | `'double'` | `'single'` = click draws; `'double'` = dblclick draws. Ctrl+click undo always on click. |
| `pco` | string | `'on'` | Player-colour outlines: `'on'`/`'home'`/`'mine'`/`'all'` |
| `pcoNeutral` | bool | false | Hide neutral selection/target rings |
| `qrView` | bool | true | Use Quick React strip (vs. classic Alt tray) |
| `l3shape` | string | `'square'` | L3 table shape: `'circle'`/`'square'` |
| `l3collapseOusted` | bool | false | Collapse ousted player columns in L3 |
| `cardTip` | bool | true | Instant card-name tooltip on hover |
| `defaultView` | string | `'normal'` | Home view: `'normal'`/`'simplified'` |
| `sfxVol` | number | 0 | Master SFX volume (0 = muted, 1–100) |
| `sfxIndiv` | object | `{unlock:150,...}` | Per-sound volume overrides (percentage) |
| `tournament` | bool | true | Tournament mode (forces helpers off, restricts convenience features) |
| `edgeToken` | bool | true | Show the Edge token on the board |
| `poolPlayerColor` | bool | false | Tint pool globes with each player's seat colour (all views) |
| `hoverPreview` | string | `'key'` | Card preview on hover: `'key'` (hold key), `'always'`, `'off'` |
| `imgFmt` | string | `'webp'` | Card image format: `'webp'`/`'jpg'` |
| `imgCache` | bool | false | Cache card images in IndexedDB for offline use |
| `jsonSync` | bool | true | Auto-sync vtes.json from KRCG on load |
| `imgSync` | bool | false | Auto-download missing card images on load |
| `showWelcome` | bool | true | Show the welcome dialog on startup |
| `debug` | bool | false | Enable live `console.warn` output on every `dbg()` call |
| `tutDone` | array | `[]` | Tutorial section ids completed (e.g. `['introduction','decklab']`); drives the picker checkmarks, the Reset-progress link, and the first-run pulse on the welcome Tutorial button |
| `playedSort` | string | `'new'` | Played-tab ordering: `'new'` newest-first / `'action'` live action-status grouping (v2.5.19) |
| `shiftPeek` | bool | `false` | Opt-in: hold Shift to peek the log while the panel is collapsed (v2.5.30; off so it never clashes with Shift+click token adjust) |
| `touchUI` | string | `'auto'` | Touch presentation mode (v2.5.39 T0): `'auto'` follows `pointer:coarse`/`maxTouchPoints`, `'on'`/`'off'` force. Drives `body.touchui` via `touchUI()`/`applyTouchUI()` - PRESENTATION only; gesture BEHAVIOUR always gates per event on `e.pointerType==='touch'` (hybrid laptops correct without a mode switch) |

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


## Index of archived context (titles only — full text in the archive file)

### Entries 13–17 July 2026 (38)
- 17 July 2026 (client v2.6.41 / server v2.6.19) — HOSTING TRACK OPENS + H1 hardening SHIPPED + the uncertainty round (v2.6.19) the same day: `elysium-hosting-plan.md` delivered, then executed (H1).
- 16 July 2026 — v0.6.10 addendum:
- 16 July 2026 (client v2.6.41 / server v2.6.17, bot v0.6.9, arena v1.1.2) — FAS C: the sewer arc is COMPLETE (gate 268/0 → 282/0 ×3).
- 16 July 2026 (client v2.6.41 / server v2.6.17, bot v0.6.8) — FAS B: the Inside Dirt consumer (gate 259/0 → 268/0 ×3).
- 16 July 2026 (client v2.6.41 / server v2.6.17, bot v0.6.7) — the tally write-race is DEAD: server-side per-field preserve + field-owned bot writes.
- 16 July 2026 (bot v0.6.5 → v0.6.6) — FAS A+: the rules-correct contested LADDER (gate 254/0 → 259/0 ×3; suite cap now `timeout 210`):
- 16 July 2026 (bot v0.6.5, arena v1.1.1, compiler v1.4.2) — FAS A: the SEWER archetype (Johan's real Nosferatu stealth deck), attacker-side tally-a bookkeeping, stealth as a decision weight (gate 254/0
- 16 July 2026 (bot v0.6.3 → v0.6.4) — THE COMBAT HANDSHAKE + the rulebook torpor fix: phantom damage gone, "takes 0" against a dodge (gate 242/0 → 251/0 ×3):
- 16 July 2026 (bot v0.6.2 → v0.6.3) — THE BLOCK-VERDICT CHAIN CLOSED: intercept→block→verdict→combat→dodge, bot vs bot (gate 237/0 → 242/0 ×4):
- 16 July 2026 (bot v0.6.1 → v0.6.2, arena v1.0.1 → v1.1.0) — ARCHETYPE REGISTRY: the Wall deck, the first deck matchup, the arena's first block-YES — and the next phase's root cause identified:
- 16 July 2026 (no code changes — pure EVALUATE; new diag-exhaust.js) — LONGER MATCHES: the Ashur threshold fired live, library exhaustion verified, graceful degradation proven (gate 231/0 confirm):
- 16 July 2026 (bot v0.6.0 → v0.6.1, arena v1.0.0 → v1.0.1) — FIRST BOT-VS-BOT PLAYTHROUGHS: whole matches to last-standing, the bounce chain verified in live play (gate 231/0 ×6 straight):
- 16 July 2026 (bot v0.5.11 → v0.6.0 — DECK-COMPLETE MILESTONE; cardfx compiler v1.4.0 → v1.4.1, recompiled; client/server untouched) — Steg 6: wake→bounce + fx.dodge + a wake-sweep of the card database
- 16 July 2026 (bot v0.5.10 → v0.5.11, cardfx/client/server untouched) — Steg 5: rulebook-verified decline semantics — final for BLOCKS only, bounce stays live; the post-modifier re-ask says Reactions?
- 16 July 2026 (bot v0.5.9 → v0.5.10, cardfx recompiled for real, client/server untouched) — Bounce-fix steg 4: real vtes.json compile, a genuine Leverage bug fix, the (limited) cap, Conditioning + Bond
- 15 July 2026 (bot v0.5.8 → v0.5.9, cardfx/client/server untouched) — Bounce-fix steg 3: irreversible decline tracking, `pending.declined` (gate 202/0 → 207/0, 3× stable):
- 15 July 2026 (bot v0.5.7 → v0.5.8, cardfx/client/server untouched) — Bounce-fix steg 2 SHIPPED: the attacker-side modifier window + reaction loop, Leverage curated and playable (gate 194/0 → 202/0, 3×
- 15 July 2026 (client v2.6.41 / server v2.6.16, client-only change) — fixed the REAL cause of the duel-view's locked-card slide: a wrong rotation-offset formula in `avRenderCard`, discovered via Johan'
- 15 July 2026 (client v2.6.40 / server v2.6.16, client-only change) — duel-view mini-card positioning fixed, click-to-enlarge + attached-card hover added, BASIC-tutorial counter gap filled:
- 14 July 2026 (bot v0.5.6 → v0.5.7, cardfx/client/server untouched) — Bounce-fix steg 1: `_commitBounce` sends a spec-correct L12.bleed re-announce, the NEW target's pending now arms correctly (gate 18
- 14 July 2026 (bot v0.5.5 → v0.5.6, cardfx/client/server untouched) — Ashur Tablets' table-wide collateral watch shipped: a human OR another bot crossing their own threshold now correctly sweeps this b
- 14 July 2026 (cardfx v1.4.2, bot v0.5.4 → v0.5.5, client/server untouched) — Ashur Tablets' OWN-side threshold mechanism shipped, the last of the four Masters now fully functional (gate: cardfx 73/0→7
- 14 July 2026 (cardfx v1.4.1, bot v0.5.3 → v0.5.4, client/server untouched) — Effective Management's EFFECT automated (not just its placement), new `handler` field + `CARD_HANDLERS` registry (gate: car
- 14 July 2026 (cardfx v1.4.0 curated data, bot v0.5.2 → v0.5.3, client/server untouched) — all four Masters curated, `actGrant` fully wired (both persist modes), Parthenon's lock decision shipped (gate
- 14 July 2026 (cardfx v1.3.0 → v1.4.0, client/server/bot untouched) — Persistent + Lock rulebook tags, full sweep + audit (gate 46/0 → 65/0, real vtes.json, drift guard clean):
- 14 July 2026 (bot v0.5.1 → v0.5.2, client/server untouched) — stealth universalized, real deck now default (gate 132/0 → 135/0, 4× stable):
- 14 July 2026 (bot v0.5.0 → v0.5.1, client/server untouched) — §7.6 follow-up: a real deck, an Edge correction, generalized phase economy (gate 119/0 → 132/0, 3× stable):
- 13 July 2026 (bot v0.5.0, cardfx recompiled, client/server untouched) — vtes.json follow-up:
- 13 July 2026 (bot v0.4.6 → v0.5.0, client/server untouched):
- 13 July 2026 (bot v0.4.6, client/server untouched):
- 13 July 2026 (bot v0.4.5, client/server untouched):
- 13 July 2026 (client v2.6.39 / server v2.6.16, client-only change):
- 13 July 2026 (client v2.6.38 / server v2.6.16, client-only change):
- 13 July 2026 (client v2.6.37 / server v2.6.16, client-only change):
- 13 July 2026 (client v2.6.35 / server v2.6.16 / bot v0.4.4) — the bot-elements exception:
- 13 July 2026 (client-only, v2.6.33):
- 13 July 2026 (client-only, v2.6.34):
- This doc reflects Elysium v2.6.27 (client v2.6.34 / server v2.6.15, last updated 13 July 2026 — RELEASE CANDIDATE; NEW 12 July 2026, bot track: the cardfx library v1 — a SHARED card-effect database co

### Per-version sections, June–July 2026 (169)
- v1.5 - the table views, made interactive (18 June 2026)
- v1.6 - Played cards, the left-panel pass, and cross-table polish (20 June 2026)
- v1.7 - Played-tab polish and tab-centering (21 June 2026)
- v1.8–v1.10 — auto-deal, discipline search fix, animation speed, draw-click (21 June 2026)
- v1.11 – Click-cancel, actor card in play-FX, shuffle riffle animation (21 June 2026)
- v1.12 – SFX library wired to game events (21 June 2026)
- v1.13 – SFX volume settings (21 June 2026)
- v1.14 – Main menu restructure + Tools to right-click (22 June 2026)
- v1.14 – Huvudmenyrenovering (22 juni)
- v1.18 – Lokal tournament mode (22 juni)
- v1.17 – Hand zone högerklicksmeny: djupare fix + polish (22 juni)
- v1.16 – Hand zone högerklicksmeny ombyggd (22 juni)
- v1.15 – Skift-logg interaktivitet (22 juni)
- v1.19 – Bugfix: conv TDZ-krasch (22 juni)
- v1.19–v1.20 – Hand reveal + 3-level menus (22 June 2026)
- Hand reveal to opponents
- `log()` privateLine parameter
- 3-level context menus
- Log card preview supports `data-name`
- Hotseat ↔ online divergence (reveal)
- v1.21 – Pool glob reachable with the dock collapsed (22 June 2026)
- v1.22 – Own pool glob conditional during a Visit (22 June 2026)
- v1.23 – Opponent pool globe matches your own exactly (22 June 2026)
- v1.24 – Opponent pool right-click: public piles (ash heap + burned) (22 June 2026)
- v1.25 – Host control on the opponent pool menu (22 June 2026)
- v1.26 – Table-panel rows open the pool menu (22 June 2026)
- v1.27 – Table panel grid layout (22 June 2026)
- v1.28 – Table panel bug fixes: dot+triangle overlap, right-click menu (22 June 2026)
- v1.29 – Play with open hand (standing hand-reveal grant) (22 June 2026)
- v1.30 – Ctrl+hover lupp in browse modal (22 June 2026)
- v1.31 – Hand menu cleanup (22 June 2026)
- v1.32 – Scroll to adjust max hand size + token permanence clarification (22 June 2026)
- v1.47 – Target from opponent ash heap browse (22 June 2026)
- v1.46 – Burn X random from ash heap (22 June 2026)
- v1.45 – Ash heap browse consolidated into submenu (22 June 2026)
- v1.44 – Ash heap browse: double-click to fetch + hover-able log (22 June 2026)
- v1.43 – Attached cards stay with host in uncontrolled/torpor (22 June 2026)
- v1.42 – Prevent cross-deck contamination in dropCard (22 June 2026)
- v1.41 – Crypt browse: dblclick to fetch + always reshuffle (22 June 2026)
- v1.40 – Crypt pile drag-to-influence / drag-to-park (22 June 2026)
- v1.39 – Reveal top X from crypt (park face down) (22 June 2026)
- v1.38 – Burn top X from crypt (22 June 2026)
- v1.37 – Fly-to-pile targets the collapsed dock handle (22 June 2026)
- v1.36 – Fly-to-pile animation on non-drag returns (22 June 2026)
- v1.35 – Library pile drag-to-draw / drag-to-park (22 June 2026)
- v1.34 – Discard/Burn top X from library (22 June 2026)
- v1.33 – Library browse: double-click to fetch + always-reshuffle (22 June 2026)
- v1.48 – Send card… submenu + Set owner removed (22 June 2026)
- v1.50 – cardFx actor mode: vampyr-spelar-kort animation (23 June 2026)
- v1.49 – Flip face up selected + face-down log inspect (23 June 2026)
- v1.51 – cardFx dubbelklick + hand-meny konsistens (23 June 2026)
- v1.52 – cardFx caption-system fullständigt omskrivet (23 June 2026)
- v1.56 – Settings KRCG-beskrivning utökad (23 June 2026)
- v1.57 – Edge-knapp: anpassad tooltip via data-tip (23 June 2026)
- v1.58 – nudgeFree: kort staplas aldrig helt (23 June 2026)
- v1.59 – Deck Lab: Load saved deck-lista (23 June 2026)
- v1.60 – Torpor-buggar fixade (23 June 2026)
- v1.67 – Baskortet överst vid stack-drag (23 June 2026)
- v1.66 – Stack drag-and-drop: barn följer baskortet (23 June 2026)
- v1.65 – Hand-panelsortering fixad (23 June 2026)
- v1.64 – KRCG-typnamn korrigerade (23 June 2026)
- v1.63 – Deck Lab: bibliotekskort per typ (23 June 2026)
- v1.62 – Torpor hover-bounce fix: lx/ly (23 June 2026)
- v1.61 – Edge-knapp klickbar i L2 (23 June 2026)
- v1.55 – Hand panel sorted by type then alpha (23 June 2026)
- v1.53 – Lock/unlock caption inkluderar kortnamn (23 June 2026)
- v1.54 – Klick på klonanimation avbryter den (23 June 2026)
- v1.68 – #poolHelp återinförd vid pool-cirkeln (23 June 2026)
- v1.68 – #poolHelp återinförd vid pool-globen (23 June 2026)
- v1.69 – sfxSilent(): ljudtriggers stängs av vid vol=0 (23 June 2026)
- Phase 0 - refactor groundwork: edge-verb bug-fixes, a second dead-code sweep, a client logic suite, a debug ring buffer (24 June 2026) [client 1.99.28 / server 1.8]
- v1.99.27 - Pre-2.0 cleanup: parked L1-Simplified choice, the Alt views, the round table (24 June 2026)
- v1.90–v1.99.26 - L3 Overview build-out + the Edge token handoff system (24 June 2026)
- v1.82 - The Edge as a draggable token; a reusable Token family (23 June 2026)
- v1.80-v1.81 - The Edge token: two abandoned approaches (23 June 2026)
- v1.79 - VTES symbol vectorised inline (23 June 2026)
- v1.78 - Clan symbol badge: reusable template + Table tab + animations (23 June 2026)
- v1.77 - Public clan logging with player name (23 June 2026)
- v1.76 - Clan watermark on opponent pool globes (23 June 2026)
- v1.75 - Pool globe clan symbol as watermark (23 June 2026)
- v1.73-v1.74 - Clan symbol KRCG data corrections (23 June 2026)
- v1.72 – Clan symbol system (23 June 2026)
- v1.68–v1.71 – Pool-zonen, Visit-overlay, ljud, Table-tabb (23 June 2026)
- Fas 1 — handler-maps, modaler, B1-konkatenatorn (24–25 juni)
- Fas 2 — module decomposition: leaf/feature extraction, helpers registry, core seams, relocation (25 June 2026) [client 2.0 / server 2.0]
- v2.1 — L2 tab persistence + L4 token drag fix (26 June 2026)
- v2.2 — Path of Enlightenment + L4 polish (26 June 2026)
- Path of Enlightenment (V5 Sabbat)
- L4 board & interaction polish
- Menu system
- Bugfixes
- v2.3 — Files, Caching & UX Polish (26 June 2026)
- Local image cache (IndexedDB)
- UI & UX changes
- v2.5.0 — Online/Tunnel Connectivity + Security Hardening (29 June 2026)
- The tunnel connectivity fix (the core)
- Version handshake made tolerant
- Server security hardening — the loopback per-IP holes
- Build system re-anchored (B1)
- Pedagogical comment pass (network layer)
- Reviewed but found correct (no changes)
- Deliberately NOT done (with reasons)
- Dock-drag precision pass (post-v2.5.0, client-only)
- 1. `pointerup` made async — `.dragging` removed AFTER `place()`
- 2. Frozen CSS `translate` cleared at drag start
- 3. `wasLifted` flag for grab correction
- 4. 50% centre-pin replaces `regrabAtScale` for dock exits
- 5. `pointerover` guard prevents handhover re-adding during drag
- 6. Ghost card translate offset fixed for Crypt/Library pile drags
- v2.5.1 — Panel & peek polish (29 June 2026, client-only)
- 1. `enterL0` now collapses the card-viewer panel
- 2. Shift-to-peek suppressed when dock log is visible
- v2.5.2 — Guided in-app tutorial (29 June 2026, client-only)
- Classic gameplay tutorial — slices 3a + 3b + tutorial-game persistence (30 June 2026, still 2.5.2)
- Classic tutorial — slice 3c + onboarding/Table/Crypt rework + engine v2 (30 June 2026, still 2.5.2)
- Classic tutorial — simulated opponent reaction in `classic-interact` (30 June 2026, now 2.5.4)
- Hotfix: `l4hintDone` ("Drag your pool globe") leaking back on hotseat seat-swap (30 June 2026, still 2.5.4)
- `cx-outro`/`cx-leave` text pass: surface the silent seat hand-back, de-duplicate the sign-off (30 June 2026, still 2.5.4)
- Hotfix: Target ring never refreshed in L4 (Classic) hotseat (30 June 2026, still 2.5.4)
- Classic tutorial — `cp-edge` step added to `classic-play` (30 June 2026, still 2.5.4)
- Peek-dock content didn't scale with window size (30 June 2026, 2.5.4 → 2.5.5)
- Correction: peek-dock scaling fix targeted the wrong (retired) dock (30 June 2026, 2.5.5 → 2.5.6)
- Regression fix: dock scale overshot on laptop (30 June 2026, 2.5.6 → 2.5.7)
- Tighter dock height — backing hugs the zones (30 June 2026, 2.5.7 → 2.5.8)
- Four l4-dispatch fixes (30 June 2026, 2.5.8 → 2.5.9)
- Offline Target parity: per-seat rtarget + hotseat targeter tags (30 June 2026, 2.5.9 → 2.5.10)
- Code archival: dead legacy hand dock removed (30 June 2026, 2.5.10 → 2.5.11)
- Played-tab ordering fixed: newest-first, stable (30 June 2026, 2.5.11 → 2.5.12)
- +/− keys adjusted for blood on selected card (30 June 2026, 2.5.12 → 2.5.13)
- Played-tab sort order as a local preference (30 June 2026, 2.5.13 → 2.5.14)
- Live-action batch highlight in Action flow mode (30 June 2026, 2.5.14 → 2.5.15)
- Basic minion actions trigger resolvePlayedActions (30 June 2026, 2.5.15 → 2.5.16)
- "It resolves" quick phrase triggers resolvePlayedActions (30 June 2026, 2.5.16 → 2.5.17)
- Cross-seat Played-tab ordering + Action flow help text (30 June 2026, 2.5.17 → 2.5.18)
- Bugfix from the cross-seat analysis: _avSeq became a timestamp (30 June 2026, 2.5.18 → 2.5.19)
- Consolidated verification: 2.5.12–2.5.19 across transports & views (30 June 2026)
- Cross-board card lifecycle (v2.5.20–2.5.26)
- Deferred / roadmap (from the post-work code review)
- L3 chrome relocation (v2.5.47)
- Bottom dock row order (v2.5.50)
- Bottom dock row - aside-aware Hand width (v2.5.52)
- Backlog sweep (v2.5.56–v2.5.60)
- v2.5.61–62 + review sweep
- The branch merge (v2.5.72, 3 July 2026)
- The online sweep (v2.5.73 client / v2.5.62 server, 3 July 2026)
- The prepared-guest mode + the fx relay catch-up (v2.5.74 client / v2.5.63 server, 3 July 2026)
- Dock-drag parity, dock pinning and the ❗ button (v2.5.75 client, 3 July 2026)
- Name size bump + a systemic clan-icon bug: in-place flips never re-triggered clan detection (v2.5.82 client, 3 July 2026)
- Quick-phrase medallion, round four: name un-coloured -- the ring already carries the signal (v2.5.81 client, 3 July 2026 — superseded in part by v2.5.82's font-size bump above)
- Quick-phrase medallion, round three: the real icon-fill bug, and the name reverted verbatim (v2.5.80 client, 3 July 2026 — superseded by v2.5.81 above)
- Quick-phrase medallion, round two: the big circle was right, the icon just needed to fill it (v2.5.79 client, 3 July 2026 — superseded by v2.5.80 above)
- Quick-phrase medallion redesign (v2.5.78 client, 3 July 2026 — superseded by v2.5.79 above)
- Hotfix: quick-phrase colour/clan missing in hotseat (v2.5.77 client, 3 July 2026)
- Seven mixed fixes (v2.5.76 client, 3 July 2026)
- Advanced tutorial: Structured table walkthrough (v2.5.83 client, 4 July 2026)
- Advanced tutorial: Play online walkthrough (v2.5.84 client, 4 July 2026)
- KRCG API v3→v5 dual-format card-data parser (v2.5.87 client, 4 July 2026)
- L4 pool globe ± buttons fixed (v2.5.88 client, 4 July 2026)
- Deck-list import: two more real-world text formats (v2.5.89 client, 4 July 2026)
- Ctrl/Shift+click on the pool globe itself, finally wired up (v2.5.90 client, 4 July 2026)
- Tutorial: leave the previous game properly, and the Advanced tier is always open (v2.5.91 client, 4 July 2026)
- The referee kit ships — L0+L3a from the lobby/server design (v2.5.92 client / v2.5.64 server, 6 July 2026)
- The resource ledger v1 — the game's hard resources, server-logged (v2.5.93 client / v2.5.65 server, 6 July 2026)
- ledgerLive — the opponents' resource narration is now server-authored (v2.5.94 client / v2.5.66 server, 7 July 2026)
- Undo is marked — and it turned out undo never synced (v2.5.95 client / v2.5.67 server, 7 July 2026)
- The lobby lands — L1 credentials + L2 room list (v2.5.96 client / v2.5.68 server, 7 July 2026)
- A local images/ folder as a third image tier (v2.6.2 client / v2.5.69 server, 7 July 2026)
- The local images/ folder now covers card backs and icons too (v2.6.4 client / v2.5.70 server, 7 July 2026)
- Code-quality pass on the image-resolution work (v2.6.5, 7 July 2026)

## Help pages inside the client (v2.6.127)

- **Menu:** `Help…` → `Rulebook` (vekn.net, new tab) · `Bots` (`openHelp('bots')`) · `Local server` (`openHelp('server')`) · `Report a problem…` (`openErrReport`). Nothing else on the top level moved.
- **Markup:** two `<template>`s in the body, `#helpDocBots` and `#helpDocServer`, each wrapping a marker pair `<!-- @@HELP:<key> -->` … `<!-- @@/HELP:<key> -->`. What sits between the markers is written ONLY by `embed-help.js` (`node embed-help.js bots START-HERE-BOTS.html` / `node embed-help.js server help-local-server.html`; `--check` = compare, exit 1 on drift, nothing written). The tool lifts the page's `<body>`, drops its `<script>`, prefixes every `id`, `href="#…"` and SVG `url(#…)` (`hb-` / `hs-`).
- **Stylesheet:** `<style id="helpCss">` in `<head>`, every rule under `.helpDoc` (or `#helpModal`, `body.helpDoc`, `html.helpPage`). It re-states the client selectors that would reach the page — `main{display:flex}`, `header`/`header h1`, `.modal h3`, `.modal .note`. `helpStandalone()` reads this block's `textContent`, so the modal and the tab share one design by construction. The bot project's stylesheet changes are mirrored here BY HAND (the tool lifts markup only).
- **Modal:** `#helpModal` (`width:min(1000px,96vw); max-height:92vh`), header = `#helpDocTitle` + `#helpDocTab` (↗ New tab) + `#helpDocClose`; body `#helpDocBody.mbody.helpDoc` (the `helpDoc*` family since v2.6.128: a plain `#helpClose` already belongs to the shortcut overlay) with `scroll-padding-top:64px` for the sticky `.nav`. `openHelp(key)` renders `helpHtml(key)`, `helpWire()` sends http links to a tab, the delegated click listener routes `#anchors` through `helpJump()` (opens the `<details>` ancestors, `scrollIntoView`) so `location.hash` is never touched (the URL carries `?server=`/`?mode=`); `helpNavSync()` marks the current section on scroll.
- **Standalone tab:** `helpStandalone(key)` = `<!DOCTYPE html><html class="helpPage">…<style>#helpCss</style>…<body class="helpDoc">template + a tiny ES5 nav/hash script`. The script tag is written `'<scr'+'ipt>'` in source: a literal `</script>` inside the client's own script would end it, and the harness (`/<script>([\s\S]*)<\/script>\s*<\/body>/`) and `split_client.py` (`"<script>\n"` counted once) key on the one bare tag. `helpOpenTab()` tries a Blob URL first, then `window.open('')` + `document.write`, then toasts.
- **Owned where:** `help-local-server.html` (ours, the authoring source, ships beside the suite — the drift test requires it) · START-HERE-BOTS.html (Elysium Bots project; re-embed on every release; drift test skips without it). The GitHub START-HERE.html and the Host Guide stay for people who do not have the client yet; the embedded Local-server page never refers to them.
- **Harness exposes:** `openHelp`, `helpStandalone`, `helpCurrent()` (reads `_helpCur`), `HELP_DOCS`.
