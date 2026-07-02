# CLAUDE.md — Elysium Development Harness

> **Elysium v2.5.37 (client v2.5.37 / server v2.5.30 — major.minor lockstep since v2.5.30; patch drift for client-only work is by design)** — last updated 2 July 2026. **v2.5.37 (Batch 4 — “Bring your own server”: the protocol goes public + Mac/Linux hosting):** new **`ELYSIUM-PROTOCOL.md`** documents the whole client↔server contract for third-party servers — transport/framing (JSON `{t}` over WS, the load-bearing unknown-verb tolerance BOTH ways), lifecycle (30s ping / 75s reaper / 2.5s reconnect+token rejoin, verMM handshake), session (`create`/`join` pre-dispatch), the five MUST security invariants (server-derived seats, sanitisers, tunnel-aware rate-limit keys, hidden-stays-hidden, host gating), the state model (client-authoritative pubs / server-held piles / OPAQUE escrow blobs — zero crypto server-side; tournament authority goes AROUND the protocol), a MUST/MAY capability table, and all **48 c→s verbs + 42 s→c messages with per-verb field lists GENERATED from the live handler tables** (zero transcription risk). Guarded by the new **`test-protocol-doc.js`** lint (doc↔code set-diff both directions; verified 4/0 green AND correctly red on a mutilated copy) — **any protocol change ships with a doc update + a green lint run.** Client change (v2.5.37, the only code): **deep-link prefill** — `?server=&room=&name=` pre-fills and opens the Play-online dialog at boot (after the welcome/resume wiring so the link's intent wins); `pass` is deliberately NOT a parameter (URLs leak) and it never auto-joins. Plus **Mac/Linux launchers** (`start-elysium.sh`, `start-elysium.command`, `start-cloudflare-tunnel.sh` — the server was always OS-agnostic zero-dep Node; only launchers were missing) and **`HOST-GUIDE-ADDENDUM.md`** (two ready-to-merge guide sections; the .docx is generated, never hand-edited). **v2.5.36 (client-only, A3b — the L4 opponent renderer reconciles instead of rebuilding):** `renderL4OppCards()` no longer wipes `#l4oppWrap` — `addRCard()` is now reconcile-aware (host-scoped lookup by `data-cid`+`data-seat`; per-client card ids collide across seats, so never cid alone) and REUSES the element: transform/z/badges/rings/tags update in place, so opponent lock/unlock and position changes **glide on the `.card` .42s transition** instead of snapping, and a `faceDown` change plays the same **flip** own cards get via the new `animCardEl(el,type)` (extracted from `animCard`, which is now a thin `c.el` wrapper — all call sites unchanged); a genuinely new pub card (`fx.neu`) plays **rise**; remote anims respect `animMode!=='all'` (cardFx's remote rule). Wipe-first callers (`buildMat`/`renderFull`) never match the lookup → their fresh path is byte-for-byte the old behaviour. Removal is **mark-and-sweep** (`wrap._stamp`, `addRCard` returns the element for stamping). The A1 token pass is keyed+reused too, with an inline .42s transition → **a moved Edge glides**; new `.l3panning .mattok{transition:none}` guard (sibling of the `.card` rule) since `applyL3Transform()→layout()` re-renders the wrap on **every L4 pan/zoom frame** — drag-pan stays rigid, zoom-glide now MATCHES own cards (they already glide on zoom re-place; parity, not a regression) and reconcile is cheaper per frame than the old rebuild. Critical companion fix: the once-attached listeners (preview/click/contextmenu) read **`el._rc`/`el._ctx`** (stamped every render) instead of their creation-time closure — on a persisted element the closure goes stale after a flip (wrong "Set as target" payload). Class reset preserves `anim-*` + `noimg`; the front-img webp→jpg fallback attaches at creation unconditionally (a reuse-REVEAL needs it); keyframe pulses (`rcnew`/`rcchg`) restart via an `offsetWidth` reflow on reuse. See `SKILLS.md` → "Reconcile a rebuild-style renderer". **v2.5.35 (client-only, online/L4 parity batch — six fixes):** guests' online experience now matches the host's. **C1** `tickTone()` gained the missing master-volume guard + slider scaling — it was the ONLY unguarded audio primitive and its call sites (reaction-window ticks, the RESOLVE gong, the 💬 say-pop) are all broadcast table-wide, so everyone heard them at volume 0. **E1** new `#board.tableEmpty` class (toggled in `layout()` beside the `#empty` display line) hides the Edge button while the "table is set" overlay covers an empty board — it sat at z 4700 (L4's `l3mode` CSS) over the overlay's z-80 ⚙ Settings box, a guests-only state (0 cards = just joined). **A1** `renderL4OppCards()` gained a token pass (Edge + future non-pool tokens from `pub.tokens`, read-only, z 49 = under cards, `L4_TOKEN_S` via `cardTransform` like `placeToken`) — L4 was the one renderer that skipped tokens; covers online AND hotseat since both read `net.boards[seat].pub`. **A2** `updateL4Opponents()` now repaints the globe HTML when `pub.clan` changes (cached as `g.clan`; name falls back to `b.who`, NOT the label's textContent which embeds the seat chip) — the clan icon was only written at globe CREATION, which predates the first pub, so it never showed. **D1** new `renderPileGhost()` (called at the top of `layoutZone`'s pile branch, before the dock-collapse early-return) draws a read-only face-down back + count inside your own Crypt/Library boxes online, where the server holds the piles and the local zones are empty — DOM-only, never touches `state.zones` (Token-family rule), ankh fallback if the KRCG back fails. **B1** new `refreshOwnTargeted()` (after `targetersOf`) tags YOUR OWN cards that opponents aim at ('⌖ name', `.rtag.own`, brighter amber) — rings/tags were drawn only on REMOTE cards in `addRCard`, so the target's owner saw nothing; called from `layout()` tail, `board(m)`, `roster(m)`, `renderL4()` (idempotent clear+re-add), works online + hotseat (`buildPub.target` has no `inRoom` gate). Also this session: **the parity mystery resolved** — Johan's live server verified v2.5.30-complete (48 handlers incl. recall/recalled/ctrl, gid pass-through); the stale pair was the PROJECT SNAPSHOT's server (2.5.0) + BOTH test suites (expecting 39/45 handlers), which masked each other as a false-green 5/0 and a standing "15/16". Corrected suites shipped (expect 42/48); client gate reads **16/0** again. Decisions: **A3 = option b** (reconcile renderL4OppCards, own delivery next); **Batch 4 queued** ("Bring your own server": protocol spec, .sh/.command launchers, `?server=&room=&name=` prefill). **v2.5.34 (client-only, tutCancel snapshot fix):** `tutCancel()` (End Tutorial / Esc) used to wipe ALL per-chapter entry snapshots (v2.5.28 design predating the replay mechanism), making it impossible to replay any completed chapter after pressing End Tutorial even once. Now only clears `TUT_GAME_KEY` (the shared "latest mid-step" mirror); per-chapter snapshots (`tutChapKey`) are preserved — `tutResetProgress` remains the only path that wipes everything. Confirm dialog text updated from "This practice game will not be saved." to "You can replay any completed section later." **v2.5.33 (client-only, dock Hand/Log proportional scaling):** the `.l2dockopen` bottom dock's Hand box was fixed `440px` while Log filled the leftover space up to a `dockS`-scaled cap (v2.5.27) — on a big screen, ALL the window's extra width landed on Log alone, breaking the laptop-calibrated Hand:Log ratio. Fix in `updateDockScale()`: both now scale at the same `dockS` rate (`440px*dockS`/`520px*dockS`), then are clamped **down together** (ratio preserved) if their combined width would exceed the board's *actually measured* remaining width (`board.clientWidth`-derived, not the height-only `dockS` proxy) — protects the v2.5.27 overflow case properly this time. Results land in two new JS-computed `:root` vars, `--dock-hand-w`/`--dock-log-w` (same non-class-rule pattern as `--dock-s`); `#z-hand`'s `width:440px` and `#dockLog`'s `max-width:calc(520px*var(--dock-s))` both swapped for these. **The v2.5.27 dock description further down this line is superseded by this entry — see `SKILLS.md` → "Dock proportional scaling" for the reusable pattern.** **v2.5.31 (client-only, Clan/Path auto-detect):** KRCG started shipping a printed `card.path` field for some V5 Sabbat vampires (PR #830); it was wired to *hide* the "Follow Path…" menu for those vampires but never written into `c.path` — the only field `detectPath()`/`pathCount()`/`clanChoiceItems()`'s path list/the on-card path badge actually read, so printed-path vampires were invisible to auto-detect and the Choose-clan submenu despite the menu-gate correctly recognising them. Fix: `krcgPath(c)`/`effPath(c)` helpers (non-mutating, computed from `cardInfo`, same pattern as `detectClan()`) — `effPath(c)=c.path||krcgPath(c)` — swapped in everywhere "the path this vampire follows" is read; see `SKILLS.md` → "Work with KRCG card data" → "Printed vs chosen field". **v2.5.30 (four changes + the last forced server restart):** **(1)** *Shift-to-peek is back as an opt-in* — a `conv.shiftPeek` toggle in Settings › *Shortcuts — mouse*, **off by default** (the log already shows in the open panel and in the dock when collapsed), so it never clashes with **Shift+click** token-adjust unless a player enables it; the keydown is re-added gated on the flag. **(2)** *Versioning relaxed to **major.minor lockstep*** — the server's `vWarn` now compares `verMM(m.v)!==verMM(VERSION)` (was exact-match), so a **client-only patch bump no longer warns and needs no server restart**; a real major/minor drift still warns. This 2.5.30 release itself bumps the server, so it is the **last** forced restart. **(3)** *Undo fixes* — dragged cards carried a residual inline `translate:none` (set at drag start, ~rad 8638) that **overrode the CSS `.card.handhover` lift** (inline beats stylesheet; positioning uses `transform`, the lift uses the separate `translate` property), so an undone/returned card no longer floated on hover; `place()` now clears `c.el.style.translate=''`. And **Undo now names what it reversed**: entries are wrapped `{s,label}` and each auto-captures the action's own next log line (armed in `pushUndo`, grabbed at the top of `log()`, cleared after the sync tick), shown dimmed after "Undo." — `applyUndoEntry` now only treats objects **with a `.t`** as semantic so wrapped snapshots fall through to `restoreSnap(s.s)`. **(4)** *L0 reset* — `enterL0` also drops the `l2dockopen` class so the bottom dock's open/closed state does not ride into the next game (the aside was already collapsed non-persistently). **v2.5.29 (one client-only input fix + a lockstep server bump):** **Shift-to-peek the log is disabled.** Holding Shift to peek `#logPeek` (only ever active with the side panel collapsed) clashed with **Shift+click to adjust the token under the pointer** (blood / pool) on the board — and `#logPeek.peeking` gains `pointer-events` so it could even swallow the click. The keydown activation is neutered (the `#logPeek`/`syncLogPeek` mechanism is kept dormant for revert) and the two tooltips that advertised it were cleaned. **v2.5.28 (two client-only tutorial fixes + a lockstep server bump):** the classic tutorial's last step (`cx-leave`) no longer auto-opens the main menu — the global outside-click listener closed it on the very first click, incl. the Finish button — so it now just rings `#btnMenu` and describes *Leave seat* in the text. And **End tutorial** (button + Esc, via an async `tutCancel`) now **confirms**, then leaves to the welcome screen **without saving** the practice game: it nulls `tutGameLive` before `leaveHotseat()` (skips its save branch) and clears `TUT_GAME_KEY` only, **keeping** each chapter's own entry snapshot (`tutChapKey`) — those are the "repeat this section" checkpoints and pausing should not discard them (only the explicit Reset-progress action does, via `tutResetProgress`). **v2.5.27 (three client-only features + a lockstep server bump):** the bottom peek-log no longer balloons or overlaps the pool on large screens (its left now tracks the *scaled* pool and a `max-width:calc(520px*var(--dock-s))` caps its width; `--dock-s` is height-derived while width constrains the dock, so hand/pool stay fixed-px and only the piles scale **by design** — do not fully scale the dock horizontally or it overflows on 16:9 big screens — **superseded by v2.5.33 above**); *Give control…* moved from the card menu top level into the **Special…** submenu (now in-play cards only — `COUNTER_ZONES`); and a new **Undo** tutorial step (`cp-undo-play`+`cp-undo`) in classic-play, gated robustly on `undoStack` *shrinking* (a draw grows it). **Cross-board card lifecycle (v2.5.20–2.5.26):** give/take-back/burn/blood on a card you own but that sits on another board, grounded in the three-axis model (owner=permanent ash marker / controller=who acts / placement=spatial); interaction follows controller. Undo of a cross-board move is a *semantic* entry (like `UNDO_DRAW`) via `applyUndoEntry`, not a snapshot; online recall/burn is a `recall`/`recalled` two-hop and blood a generic `ctrl` verb, all keyed on a giver-assigned card id (`gid`). Server → 2.5.26 (restart required). **Played-tab work (v2.5.12–2.5.19, all client-only):** the overlay now orders cards by a `c._avSeq=Date.now()` play timestamp (globally comparable across clients → correct cross-seat interleaving online AND hotseat; was a per-client counter that only worked in hotseat — fixed v2.5.19), carried through `snapshot`/`serializeGame`/`buildPub`/`restoreFromPub`; a local `conv.playedSort` toggle ('new' newest-first / 'action' the live-action-status `avRank` grouping); in 'action' mode an amber `avc-batch` box-shadow ring highlights the current unresolved action's cards (`actSt==='played'`), cleared by `resolvePlayedActions()`; that resolve now also fires on the basic minion actions (Bleed/Hunt/Rescue/Diablerie/Card action — NOT Block, a reaction) and the "It resolves" quick phrase; `+/−` keys adjust blood on the single selected card (falling back to pool); and the `?` help overlay gains an Action-flow section listing the resolve triggers. Verified across online/hotseat × L2/L3/L4 by construction (the tab is `position:fixed` with a single view-independent `renderPlayed()` path). Post-v2.5.3 (all client-only): the real `.l2dockopen` bottom dock (crypt/library/ash/hand) now scales its pile/hand cards with the window via `--dock-s` / `updateDockScale()` (calibrated dockS=1 at the 616px canonical board height; the dock backing height hugs the zones) — v2.5.5–2.5.8; **four `net.view`-dispatch chains that omitted `'l4'` fixed** — after `refreshRTargetView()`, also `roster(m)`, `applyPco()`, `giveHot()`, plus broadening `refreshRTargetMarks()` from `#rvCards`-only to a document-wide `.card.rc` query so the Target ring toggles in L2/L3 — v2.5.9; **offline Target parity** — `net.rtarget` (cross-board target) now round-trips per-seat through `serializeGame`/`restoreGame` like `state.target`, so a hotseat hand-off no longer leaks the previous player's target (a stale one had mis-routed the next hand-play into a self-give), and `targetersOf()` works in hotseat — v2.5.10; **the dead legacy "visit another board" hand dock (`#handTab` / `#handPeek` / `#dockBody` / `#dockCrypt` / `#dockLib` / `#dockAsh`) archived to `kodarkivering.md`** — `renderHand()` kept as a no-op stub, and the live sort helpers + `updateDockScale()` nested in the same region stayed — v2.5.11. The Classic tutorial walkthrough remains COMPLETE (slices 3a-3d + tutorial-game persistence + linear section unlocking) — this session also hardened it (per-chapter entry snapshots, actor+target in play FX/logs).
> This file is a Claude Code harness generated from the project's three living documents: `elysium-project-context.md`, `elysium-learnings.md`, and `elysium-session-journal.md`. Those companion docs contain full architectural detail, version-by-version learnings, and project history.

## What Elysium is

A free, browser-based digital table for *Vampire: The Eternal Struggle* (VTES). Dark Pack compliant (Paradox Interactive). It is a **sandbox** — it enforces no game rules, the players do — but it logs everything, keeps hidden cards genuinely hidden, and shows every action to the whole table.

Two ways to play:
- **Hotseat** — pass-and-play on one screen, no server.
- **Online** — a bundled Node server holds hidden piles and relays the table to networked players.

Tech: a single self-contained HTML file (vanilla JS + HTML5, **zero dependencies**) for the client, and a single Node file (**zero npm packages**, hand-rolled WebSocket) for the server.

## Files

The client ships as one `.html`, but its `<script>` body is **also** maintained as an ordered set of plain-JS fragments under `elysium-src/` (the "B1" architecture — see Architecture → B1 fragment build). The monolith is the source of truth; the fragments are re-derived from it and reassemble byte-for-byte.

| File | Role |
|------|------|
| `elysium-vtes-bord.html` | The client — ~11,000 lines, the entire game + UI + network layer + embedded escrow crypto. **Source of truth** — almost all editing happens here. |
| `elysium-server.js` | The server — rooms, hidden piles, relay, sanitisation, named saves. ~63 KB. Also serves the client file to browsers. |
| `shell.html` | The HTML/CSS shell with a `/*@@ELYSIUM_APP_JS@@*/` placeholder. The build drops the concatenated fragments into it. |
| `split_client.py` | Splits the monolith's `<script>` body into the ordered fragments (plain-ASCII string anchors; asserts uniqueness + source order; verifies reassembly internally). Reads `/tmp/original.html`, writes `elysium-src/`. |
| `elysium-build.js` | Reassembles `shell.html` + `manifest.txt` + fragments → `elysium-vtes-bord.html`. Byte-identical to a hand-edited single file (verify with `cmp`). |
| `net.js`, `hotseat.js`, `esc-crypto.js`, `sfx-audio.js`, `tokens-engine.js` | The cleanly-extractable fragments checked into the project (2 core seams + 3 leaves). The full **12-fragment** set (adds `decklab-editor`, `fx-anim`, and glue `app-1…app-5`) is produced into `elysium-src/` by `split_client.py` at build time. **Note:** these checked-in copies went stale at the v2.5.0 re-anchoring — the splitter regenerates fresh fragments into `elysium-src/`; the monolith is the source of truth. |
| `vtes-sfx-demo.html` | Standalone Web-Audio SFX playground (no game state) — tune the synth sounds here before wiring them into `sfx-audio`. |
| `elysium-test-harness.js` | Shared zero-dep DOM stub + `loadClient()` loader. This harness loads the **real** client functions (it's what `test-client-logic.js` requires), so running the logic suite is also the load smoke-check. |
| `test-client-logic.js` | Client logic test suite (16 assertions). |
| `test-server-dispatch.js` | Server dispatch + rate-limit tests (5 assertions). |
| `test-2a.js` / `test-2b.js` | Server integration suites (require a running server). The full 2a–2g + crypto/autosave/helper-policy suites total ~195 assertions; only 2a/2b are in this snapshot. |
| `kodarkivering.md` | Parked/retired code, archived verbatim with what/why/where notes. |
| `elysium-relocation-brief.md` | Self-contained hand-off for the final refactoring step (relocate scattered functions into `state`/`render`/`input` groups so the splitter can carve them like the leaves). Reordering only — the monolith stays source-of-truth. |
| `start-elysium.bat` | Windows launcher with a Node check. Never double-click the `.js` directly (Windows Script Host kills it). |
| `start-cloudflare-tunnel.bat` | Starts a Cloudflare Quick Tunnel (`cloudflared.exe`, no account / no port-forwarding) to host a game night worldwide. |
| `START-HERE.html` | Browser onboarding for people you share Elysium with (guest / host / troubleshooting). |
| `Elysium - Player Manual.docx`, `... Host Guide.docx`, `... Technical Documentation & Roadmap.docx` | The generated English docs. The Technical doc also carries the roadmap/backlog — there is no standalone `elysium-roadmap.md` on disk. |
| `elysium-project-context.md` | Full architecture reference. Read this for deep dives. |
| `elysium-learnings.md` | Technical learnings, pitfalls, collaboration notes. Read this before proposing changes. |
| `elysium-session-journal.md` | Design history — why things look the way they do. |

> **Not in this snapshot (local-only on Johan's machine, or pending):** `build-docs-en.js` / `build-docs.js` (the Word-doc generators — edit content there, never hand-edit the `.docx`). If you need one and it isn't present, ask Johan rather than assuming it's gone.

## Verification commands

These are the reliable gates — run them after every change:

```bash
# 1. Client JS syntax
sed -n '/<script>/,/<\/script>/p' elysium-vtes-bord.html | sed '1d;$d' | node --check -

# 2. (Optional) Re-derive fragments and prove byte-identity — see SKILLS.md "Re-sync the fragment build"
cp elysium-vtes-bord.html /tmp/original.html && python3 split_client.py && node elysium-build.js && cmp /tmp/original.html elysium-vtes-bord.html && echo byte-identical

# 3. Client logic suite — loads the REAL client functions via elysium-test-harness.js, so it is
#    ALSO the load gate (catches runtime ReferenceErrors); guards serialize/restore/buildPub/pubXform/baseView/dbg.
#    (The old standalone harness_faithful.js isn't in every snapshot; this subsumes it.)
node test-client-logic.js
# Expect: 16 passed, 0 failed

# 4. Server JS syntax
node --check elysium-server.js

# 5. Server dispatch suite
node test-server-dispatch.js
# Expect: 5 passed

# 6. Server integration suites (require a running server on port 89XX)
# Delete elysium-rooms.json AND elysium-saves.json between runs
node elysium-server.js 89XX &
node test-2a.js 89XX
# (also test-2b, 2e, 2f, 2g; test-crypto.js is standalone)
```

**Important:** the sandbox often has networking disabled. Don't run the WebSocket suites blind or claim green runs you didn't do. The syntax check + client logic suite are the dependable gates (the logic suite loads the real client, so it is also the load check).

## Editing workflow

The client is a single ~11,000-line file (also mirrored as B1 fragments — see Architecture → B1 fragment build; the monolith stays source-of-truth). Edits must be precise.

### Atomic assert-anchored patches

Write a Python heredoc that:
1. First does `assert s.count(find)==1` for **all** edits
2. Then applies **all** the replaces
3. Then writes

If any anchor is wrong, nothing is written. Example:

```bash
python3 << 'PYEOF'
with open('elysium-vtes-bord.html') as f: s = f.read()
assert s.count('UNIQUE_ANCHOR_1') == 1
assert s.count('UNIQUE_ANCHOR_2') == 1
s = s.replace('UNIQUE_ANCHOR_1', 'REPLACEMENT_1')
s = s.replace('UNIQUE_ANCHOR_2', 'REPLACEMENT_2')
with open('elysium-vtes-bord.html','w') as f: f.write(s)
PYEOF
```

### Anchor rules

- **Line numbers drift** after every edit. Re-grep before the next edit; never trust a remembered line number.
- **Use plain ASCII anchors.** No smart quotes, em-dashes, or arrows in find-strings (matching those exactly is error-prone). Put the fancy characters only in the replacement.
- **Single-backslash `\uXXXX`** inside `<< 'PYEOF'` heredocs produces the character; double backslash produces literal `\u` text. This has bitten twice.
- **Patches must chain** from the most recent delivered output, never from the original source — intermediate changes are silently lost otherwise.

### Delivery

Always `cp` the built file to `/mnt/user-data/outputs/` and call `present_files`. Double-check you copied the freshly built version, not a stale one. **Snapshot-sync ritual (v2.5.35):** after any session that delivers SERVER or TEST-SUITE files, copy those into the project alongside the client — the client habit held for a month while the server + both suites went stale, and a stale suite next to the stale artifact it guards inverts into a mask (false-green). **Protocol discipline (v2.5.37):** any change to `GAME_HANDLERS`/`MP_HANDLERS` (or `create`/`join`) ships with an `ELYSIUM-PROTOCOL.md` update **and** a green `node test-protocol-doc.js` in the same delivery.

## Architecture

### Core principles

- **One file per side**, both dependency-free. The client is authoritative for your own board; the server is authoritative for hidden piles and (online) victory points.
- **Save format = wire format.** `serializeGame()` / `restoreGame()` capture/restore a board as JSON; `buildPub()` produces the opponent-visible view. The same representation is the autosave and the network payload. This is deliberate — preserve its forward-compatibility.
- **Hotseat = the same model, locally.** Same board model, serialization, public-board format, turn structure, VP and oust rules. Diverge only where a transport forces it.
- **Cards on a composite `transform`.** Animations use the separate CSS `rotate` property (composes on top). No `perspective` — the orthographic squash is the safe choice.
- **Tokens are beside the card system.** Non-card objects must **never** enter `state.cards` / `state.zones` — it breaks clone animations, drag behaviour, and zone snapping.

### B1 fragment build

The client ships as one `.html`, but the `<script>` body is maintained as an ordered set of plain-JS fragments. There is **no transpiler, no npm, no bundler** — the fragments share one scope and are simply concatenated, so "open the `.html` and it runs" still holds.

- **`split_client.py`** cuts the monolith's `<script>` into fragments using unique plain-ASCII string anchors. It asserts each anchor is unique, asserts source order, and verifies the pieces reassemble before writing. Input is a pristine copy at `/tmp/original.html`; output is `elysium-src/`.
- **`elysium-build.js`** does the reverse: it reads `shell.html` (which holds a `/*@@ELYSIUM_APP_JS@@*/` placeholder), concatenates the fragments named in `manifest.txt`, and drops the result in. Output reassembles **byte-for-byte** with the hand-edited monolith.
- **12 fragments:** 5 leaves (`decklab-editor`, `tokens-engine`, `esc-crypto`, `sfx-audio`, `fx-anim`) + 2 cleanly-contiguous core seams (`net`, `hotseat`) + 5 glue files (`app-1 … app-5`) holding everything still interleaved in usage-order. **v2.5.0 re-anchoring:** an earlier refactor moved `buildPub()` below the hotseat block, so `net` no longer ends at `buildPub` — it now ends at the hotseat block start (`HS_START`), the post-hotseat render/serialization chunk (incl. `buildPub`) folds into one app fragment, and `buildPub` is dropped as a cut anchor. The redundant app slice that used to sit between `net` and `hotseat` is gone (13 → 12 fragments).

**The monolith is the source of truth.** You edit `elysium-vtes-bord.html` directly (atomic patches), then re-derive the fragments by splitting. The build's job is to *prove* the fragments still reconstruct the monolith — it is not an upstream you edit. The round-trip gate is `split → build → cmp` (see SKILLS.md "Re-sync the fragment build").

Two gotchas:
- The builder's "(N bytes)" log **counts characters, not bytes** — `cmp` / `wc -c` are authoritative for byte-identity.
- A few splitter anchors contain em-dashes (`—`); they must be copied **exactly** (a typed hyphen fails the assert). This is the one place the "plain-ASCII anchors only" rule is relaxed, because the anchor matches existing source rather than introducing new text.

**Pending — the relocation pass.** `state`, `render`, and `input` functions are still interleaved in the glue fragments because the original was written in usage-order. The final refactoring step reorders the monolith so each concern groups contiguously and the splitter can carve real `state` / `render` / `input` fragments like the leaves. It's documented in `elysium-relocation-brief.md`, is reordering-only (function declarations hoist, so it's behaviour-safe), and is the one step without a byte-identical safety net — which is why the 16-assertion state contract was built first.

### Board modes

`net.boardMode` is an exclusive choice at game start:
- **Classic** (`'classic'`, default): L4 free-form open table, Lackey-style. Single view, no stepping.
- **Structured** (`'structured'`): L2 columns + L3 helicopter. Two views with Tab stepping.

Gate functions: `freeBoard()` tests boardMode (persistent), `l4on()` tests CSS class (transient rendering).

**L0 — the idle felt surface.** Not a `boardMode`, but a CSS class (`board.l0mode`) entered via `enterL0()`. The board shows a clean felt surface with all game UI hidden. Entered at: startup (before any game loads), after `resetTable()`, after leaving an online room, after leaving hotseat. Exited in `enterL2/L3/L4` and in any game-start path. **Critical:** `enterL0()` must be called only when `state.cards.size === 0` (zones are hidden via `display:none !important`, so `getBoundingClientRect()` returns zero). Exit L0 *before* any `layout()` that touches zones. `enterL0()` calls `setAside(true, false)` — the panel is collapsed non-persistently, matching `enterL3`/`enterL4` behaviour.

### L3 coordinate worlds

L3 has **two coordinate worlds** — most L3 bugs are a mismatch between them:

1. **Opponent furniture** (`.mat`, `#l3table`, `#l3timer`) lives inside `#l3stage` with `transform: translate(pan) scale(Z)`. They pan/zoom as one rigid unit.
2. **Your live board** (`#z-ready`, `#poolWrap`, `#edge`, your cards) stays on `#board`, positioned manually by `setCenterFrameA` which folds the same transform in: `Px + Z*coord` for position **and** `scale(Z)` for size.

**Critical:** `l2pub` already contains Z (`l2pub.s = baseS*Z`). Anything routed through `pubXform`/`pubInv` is automatically correct — do **not** re-multiply by Z. Re-multiplying is the classic double-transform bug.

### L3 layout (5-player pentagon)

The `l3slots` function's `threeBand` branch (5p, 7p) uses a pentagon arrangement — allies centred at top, prey/predator on the flanks, you at bottom. Key points:

- **Bw expansion:** `Bw = min(wlimMid, wlimTop, Bw3 + 50)` — Bw3 is the base 3-band vertical limit. The +50px expansion is safe because prey/pred on the flanks don't horizontally conflict with the centred top/bottom boards.
- **The rigid band model is suboptimal for odd player counts.** The 3-band formula over-constrains 5p layouts by reserving inter-band gaps between rows that don't actually overlap horizontally. Even counts (4p/6p grid) do need strict bands.
- **Zone flip:** top-row boards in all layouts (2p–7p) have `flip:true` — Ready zone faces down toward the table centre. `buildMat` vertically mirrors zone rects within the canonical box; cards stay upright. L2 Visit renders without flip.
- **`clockCy` decoupled** from prey/pred — set to `cy` (table centre). Timer and Edge button stay centred regardless of prey/pred vertical tuning.

### Hotseat state layers

Three layers per seat — a cross-seat change must touch all three:
1. `net.hot.boards[seat]` — a **JSON string** (non-active seats). `JSON.parse` → mutate → `JSON.stringify`.
2. `net.boards[seat].pub` — the rendered public mat view.
3. The **active** seat is the live `state` — skip its stored slot.

**Two general bug classes that recur here:**
- **A shared "fresh game" reset routine also runs on every load/hand-off, leaking its defaults into the load path.** `restoreGame()` calls `clearTable()` internally (wipe-before-repopulate); any one-shot flag `clearTable()` zeroes (e.g. `l4hintDone`, a show-once UI hint) gets wiped on *every* `setActivePlayer` seat-swap, not just a genuinely new game — unless the flag is also serialized in `serializeGame()`/restored in `restoreGame()` (same fix as `state.target`, the play-FX/log target field). When adding ANY new one-shot/show-once flag, ask whether `clearTable()` resets it, and if so, whether it needs to round-trip through serialize/restore too. **The same per-seat round-trip applies to *cross-board* state, not just one-shot flags:** `net.rtarget` (targeting another seat's card — the `net.*` global the Target tutorial uses) leaked the previous active player's target across hotseat hand-offs until it too was serialized/restored alongside `state.target` (v2.5.10); a stale `net.rtarget` even mis-routed the next hand-play through `qrGiveToTarget` into a self-give. `targetersOf()` similarly gained a `localTable` path so cross-target "⌖" tags render in hotseat (the data — `net.boards[seat].pub.target` — was already populated; `buildPub` writes it without an `inRoom` gate).
- **View-keyed dispatch chains (`if(net.view==='l2') … else if(net.view==='ov') …`) tend to omit `'l4'`**, since L4 (Classic) was bolted on after L2/L3 existed and renders opponent cards into its own `#l4oppWrap` host, not the `#rvCards` host the L2/L3 branches know about. This recurred in **four** functions (all fixed in v2.5.9): `refreshRTargetView()`, `roster(m)` (needs the full `renderL4()` — a roster change alters the globe *set*, so `updateL4Opponents()` alone won't add/remove globes), `applyPco()` (the player-colour setting), and `giveHot()`'s post-give re-render (reachable in L4 hotseat via `qrGiveToTarget`). A sibling trap: `refreshRTargetMarks()` scanned only `#rvCards`, but L3 cards live in `#l3stage` and L2 in `.l2pane2` panes — so the lightweight Target-ring toggle silently no-op'd in L2/L3 (invisible online, where opponent board-updates re-render and mask it; persistent offline/hotseat) — fixed to a document-wide `.card.rc[data-cid]` query. When touching any `net.view`-branching function OR a refresh that scans a specific host container, check every render mode is covered (`'l4'` especially; and `#l3stage` / `.l2pane2`, not just `#rvCards`). **Sibling sub-class (v2.5.35, from A1/A2):** the `'l4'` branch can exist but call a THINNER implementation — `renderL4OppCards`/`updateL4Opponents` is a separate, simplified parallel of `buildMat` and had silently skipped opponent-visible fields (tokens; the clan-icon refresh). **Checklist line: when you add or change any opponent-visible state in `buildPub`/`buildMat`, also handle it in `renderL4OppCards`/`updateL4Opponents` — and verify every `net.view` dispatch chain you touch has an `'l4'` branch.** Durable fix on the roadmap: consolidate the L4 opponent renderer onto `buildMat`'s logic (pairs with the A3b reconcile). **NOT** a bug: `turn(m)` branches only on `'ov'` — correct, because L4 has no per-board turn indicator (only L3 mats show a ▶), and the global `#phases` bar is handled unconditionally by `updatePhaseGlow()`.

### Online flow

Board change → `buildPub()` (debounced) → server sanitises → broadcast. Hidden ops (draw/browse/reveal/take) are owner-exclusive verbs. The hand never leaves the client except as an **encrypted escrow blob** (key derived via PBKDF2 from room password + public salt).

### Pool authority

Pool is 100% client-authored. Online `set-pool` relays to the target client (only works if connected). Oust/VP are server-authoritative.

### Online transport & tunnels (v2.5.0)

The server hosts the page **and** the WebSocket on one origin (default port 8123). The client builds its socket URL to match the page it was served from:

- **`cleanAddr()` picks the port by page scheme.** Over `http://` (direct LAN/localhost) a portless host gets `:8123` appended. Over `https://` (a Cloudflare quick tunnel or any reverse proxy) it must **not** append `:8123` and strips a stray one — the TLS front answers on 443 and Cloudflare never exposes 8123 publicly. This single rule is what makes internet/tunnel play work; appending `:8123` was the blocker.
- **`mpConnect()` matches security level:** `wss://` from an https page (mixed-content safe), `ws://` from http. Combined with `cleanAddr`, a tunnel ends at `wss://host` (443), a LAN page at `ws://host:8123`.
- **The address field defaults to the live page host over https** (tunnel URLs change every restart, so a stale stored one must not win); stored addresses are kept only on http.
- **Server keepalive:** a 30s WS ping keeps Cloudflare's ~100s idle timeout from cutting a quiet game; the 75s reaper is >2 ping intervals (one missed ping forgiven). Browsers pong at the protocol level — no client code needed.
- **Auto-reconnect:** a dropped socket flips to `'re'` and retries the **same** address every 2.5s, rejoining with the saved token. The `net.ws!==ws` guard ignores close events from a superseded socket. Immediate retry is **intentional** (reconnect the instant the host's laptop wakes) — no backoff.
- **Per-IP limits repoint/exempt loopback (every tunnel player looks like `127.0.0.1`):** the connection cap and room-create cap exempt loopback; the password-fail throttle uses `failKey = loopback ? 'room:'+room.name : conn.ip` so brute-force protection is **kept** (per-room over a tunnel) without one fat-fingering player locking out all tunnel rooms. Guarded by `test-server-dispatch.js` tests 4–5.
- **Version handshake (major.minor lockstep as of v2.5.30):** client and server share **one** version number, bumped together on every release. The client warns on `verMM(m.srv) !== verMM(VERSION)` (a **major.minor** compare); the *server's* `vWarn` now compares major.minor too (`verMM(m.v) !== verMM(VERSION)`, relaxed from exact-match in v2.5.30). Both sides comparing major.minor is the **drift guard** — it warns the instant the major or minor diverges, while tolerating client-only patch drift. (Previously, when client patches were allowed to drift ahead of an unbumped server, this same exact-match check was a tolerated cosmetic "footgun".) To relax back to silent patch-drift, make the server's `vWarn` `verMM`-based too. Done as of v2.5.30 — client-only patch bumps are now silent on both sides and need no restart.

### Tutorial (guided onboarding)

A mobile-game-style spotlight tutorial for the **offline** game lives in `app-5.js` (all `tut*`-prefixed, zero collisions; never touches `state.cards`/`state.zones`). Dim + hard-block is four `position:fixed` `.tutFence` rects around an open hole — no z-index on the target, so no stacking-context traps; a rAF loop (`tutTick`) repositions everything and polls gate/predicate steps each frame. Sections are **data**: `TUT_SECTIONS` + `TUT_ORDER = ['introduction','decklab','lobby','classic-intro','classic-crypt','classic-play','classic-interact']` (Classic gameplay = slice 3, split into four full sections — `classic-play`/`classic-interact` are **not** stubs, they carry their own step lists like `classic-crypt`); a step is `{ id, target:()=>el|null, text, place, advance:{on:'manual'|'click'|'event'|'predicate'}, onEnter?, onExit?, gate?, gateHint?, clickThrough?, clickArm?, scroll?, allowSkip?, orContinue?, freeInteract?, ringRect? }`. Progress persists in `conv.tutDone` (section-level). Entry: `#btnEmptyTutorial` on the welcome dialog + a ☰ → Play… item → `openTutorial()`. **Deck Lab and the lobby begin on the welcome screen** with their entry button highlighted (`tutShowWelcome()`); a following step's `onEnter` opens the view — placed there, not the highlight step's `onExit`, so **End** does not open it. **End/Esc** route back to the welcome screen via `tutCancel()`. **Classic gameplay (3a/3b)** runs on a live **L4 free-board** table, so its board steps use `freeInteract` (coach-mark: hide all fences + the hole, show only the non-blocking ring) and `ringRect` (frame several elements at once, e.g. all face-down vampires); **in L4 the dock handle is `#l2dock`** (the old `#handTab` was archived to `kodarkivering.md` in v2.5.11), and a **dragged** crypt card lands in `ready` face-down while a **double-click** sends it to `uncontrolled`. `tutQuickClassic` auto-seats a 2-player Classic Tournament game (from saved decks) when a `classic-*` section is launched with no Classic table up. **Tutorial-game persistence (two layers):** the Classic tutorial table is mirrored to a shared key `TUT_GAME_KEY='elysium.tut.game'` (flag `tutGameLive`, set in `tutStart`, cleared in `startHotseat`) on every change via `scheduleSave` — independent of the autosave mode, fully separate from `saveKey()` — this is the "latest mid-step" state `tutQuickClassic` falls back to. **On top of that**, each `classic-*` chapter also gets its own **entry snapshot** at `tutChapKey(secId)='elysium.tut.game.'+secId`, captured once in `tutStart()` the first time that chapter is reached and never overwritten (`tutGameSnapshot()`/`tutGameResume()`) — these are the "repeat this section from its start" checkpoints the tutorial picker resumes from when you relaunch an already-completed chapter. `tutCancel`/`tutEnd` (End tutorial / Esc) clears only `TUT_GAME_KEY`, deliberately **keeping** the per-chapter snapshots; only `tutResetProgress` clears both. Trade-off (documented in code): a resumed board restores card-for-card exactly, but `startHotseat` always resets the turn counter to turn 1 / VP to 0 on rebuild. To extend it, follow SKILLS.md → **"Add a tutorial step or section"**.

## Key rules to respect

These are hard-won invariants. Violating them causes subtle bugs.

### State pipeline

- Never inject non-card objects into `state.cards` / `state.zones`.
- `pubInv(pubXform(x)) === x` exactly — trust this identity, don't add correction fudge.
- Victory points are clamped 0–10 in 0.5 steps, same on client and server.
- Seating is turn order; predator = previous live seat, prey = next.

### TDZ discipline

`let`/`const` declarations do not hoist. Variables declared early in the script (e.g. `conv`, `net`) must be declared before their first call site. `function` declarations hoist, but `let`/`const` do not. A `typeof` check does **not** save you — it still throws in the TDZ.

### CSS rules

- CSS variables set via class rules do not reliably reach `position:fixed` elements through stacking contexts. Set them on `:root` via `document.documentElement.style.setProperty()`.
- CSS `display:flex` (or any explicit `display`) overrides the HTML `hidden` attribute. Add a matching `[hidden]{display:none}` rule.
- `transition: all` + per-frame JS `left/top` = glide-and-snap-back. Restrict transitions to visual props only.
- Elements whose visibility depends on JS state should start `display:none` in CSS and be revealed by the script (avoids flash during HTML parse).

### Panel (aside) defaults per view

Every `enterXxx` function declares the card-viewer panel's default state for that view. Always use `persist=false` so the user's saved preference is not overwritten by a view transition:
- `enterL0`, `enterL3`, `enterL4` → `setAside(true, false)` (collapsed — the panel would waste space in these views)
- `enterL2` → `setAside(false, false)` (open — the panel belongs in the column view)

If you add a new view entry-function, decide which bucket it belongs to and add the call. A missing call leaves the panel in whatever state the previous view left it.

### Drag & scaling

- Any element scaled at placement must use the **exact same scale expression** during drag: `(l2pub.on ? l2pub.s : 1) * (l4on() ? L4_CARD_S : 1)`.
- Hit-testing must also use the visual scale, not the L2 base scale.
- A read of a token's position must happen BEFORE `removeEdgeToken()` — removing first returns null.
- `tok.x/tok.y` is stale during a drag — derive the live drop position from `d.x/d.y`.
- **Pile drag (ghost) and card drag (element) have separate dock-close paths.** Pile-zone cards are `.inert` in the dock, so the card-drag path never runs for them. Pile drags need their own `setL2Dock(false)` at `started=true`, their own dock-reopen logic on hover-bottom, and their own dock-area guard in target functions.
- **Pile drag ghost scale must be set AFTER `setL2Dock(false)`** — the dock-close triggers `setCenterFrameA` → `l2pub` update. Setting scale before uses stale `l2pub.s`.
- **Pile drag drop coordinates must use SCALED card dimensions in L3.** The `onUp` handlers compute drop position as `cursorX - halfCardWidth`. Use unified `_s = l2pub.on ? l2pub.s*(l4on()?L4_CARD_S:1) : 1` for both offset and clamping.
- **`cryptDragTarget` must check L4 BEFORE uncontrolled.** In L4, `#z-uncontrolled` is invisible but retains a valid bounding rect — checking it first causes false hits on the free board.
- **CSS `translate` transitions freeze mid-animation when `transition:none` is applied.** `.handhover` sets `translate: 0 -26px; transition: translate .14s`. Removing `.handhover` starts the transition. Adding `.dragging` (`transition:none`) in the first pointermove freezes the computed translate at an intermediate value (e.g. -13px). The card is visually 13px above its transform position. Fix: `el.style.translate = 'none'` immediately after `el.classList.add('dragging')` — instant with `transition:none` active, aligning visual position with transform coords.
- **`.handhover` must not be re-added to a dragging card.** The board's `pointerover` listener adds `.handhover` to hand cards. During L4 dock-defer drag, `l2dockopen` is still true, so the listener would re-add it. Fix: `!el.classList.contains('dragging')` guard on the handhover condition.
- **`pointerup` must `await dropCard` BEFORE removing `.dragging`.** Removing `.dragging` first restores `transition: transform .42s` before `place()` runs. The box-shadow transition (`0 16px 30px → 0 2px 6px`) then creates a perceptual "card sinks ~16px" illusion. Fix: `async` pointerup + `await dropCard(c,d)` so `place()` runs with `transition:none` still active; only the shadow fades on release.
- **Dock→board scale transition: use a fixed 50% centre-pin, not `regrabAtScale`.** `regrabAtScale` preserves grab fraction (e.g. 70% of full card → 70% of scaled card = cursor near bottom). For dock exits, set `drag.ox = s*CW*0.5; drag.oy = s*CH*0.5` directly — cursor always at card centre through drag and placement, at all scales.
- **Ghost card `translate(-X%,-Y%)` percentages are relative to the element's CSS box, not the visual scaled size.** `translate(-50%,-60%) scale(_s)` gives cursor position `0.1/_s + 0.5` from ghost top. At _s=0.2 that's 100% — cursor below the card. Drop calc uses 50%. Fix: `translate(-50%,-50%)` → cursor fraction = exactly 0.5 at all scales, matching the drop calc.

### Naming

- Player-facing terminology: **Classic**, **Structured**, **Normal**, **Helicopter** — never internal labels like L0/L2/L3/L4.
- Ellipsis (`…`) in menu items signals "opens a submenu". Leaf actions (Settings, About) do **not** get ellipsis.
- `influence()` for crypt draw (handles pool cost + phase counter), `drawCard()` for library draw. Never swap them.

### Serialization

- The serialization format is dual-purpose (save + wire). Keep new state forward-compatible.
- `VERSION` is informational on load (no hard gate), so version bumps are save-safe.
- **Versioning is major.minor lockstep (as of v2.5.30):** bump **both** client (`elysium-vtes-bord.html` `const VERSION`) and server (`elysium-server.js` `const VERSION`) on the **same major.minor**. For a client-only change, bump only the client patch (e.g. 2.5.30 → 2.5.31) and ship just the client. The server's `verMM`-based `vWarn` keeps a client-only patch bump silent (no restart); bump both when the server code or major/minor changes. (v2.5.26–2.5.29 were strict lockstep with an exact-match server `vWarn`; v2.5.30 relaxed it to `verMM` so client-only patches no longer force a restart.)

### `clearTable()` path

Shared by hotseat, solo, and online modes. Fixes landing there apply universally. All game-teardown paths must enter L0 (the clean felt surface).

### KRCG integration

- Use `cardImageNames` Set (primary names only) for image sync checks, not all `cardInfo` keys — aliases cause ~1500 spurious 404s.
- KRCG discipline names come in two formats: trigrams for old (`"dom"`), full names for new (`"oblivion"`). Index both in `cardTags()`.

### Debug ring buffer

`dbg(tag, e)` — pushes an entry to `_dbgBuf` (64-entry ring, oldest dropped). Used as the catch handler throughout: `catch(err){ dbg('mpOnMsg', err); }`. Zero output unless `conv.debug` is `true`.

`elysiumDbg()` — dumps the buffer to the browser console (newest last). Call from DevTools: `elysiumDbg()`. Also exposed on `window.elysiumDbg`.

`conv.debug = true` — enables live `console.warn` output on every `dbg()` call.

In the sandbox you cannot call `elysiumDbg()`, but you can inspect the ring buffer via the test harness if needed.

### Breadcrumb comments

Self-inflicted assert traps: breadcrumb comments (e.g. `// PARKED -> kodarkivering.md`) must not contain the exact identifier strings being asserted absent.

## conv settings reference

The full `conv` table (all fields with types, defaults, and descriptions) lives in **`elysium-project-context.md` → "conv — local settings reference"**. The current fields are (check the code's `let conv={...}` at ~line 1805 for the authoritative defaults):

`cardDB`, `poolToPredator`, `autoLock`, `anim`, `animSpeed`, `drawClick`, `pco`, `pcoNeutral`, `qrView`, `l3shape`, `l3collapseOusted`, `cardTip`, `defaultView`, `sfxVol`, `sfxIndiv`, `tournament`, `edgeToken`, `poolPlayerColor`, `hoverPreview`, `imgFmt`, `imgCache`, `jsonSync`, `imgSync`, `showWelcome`, `debug`, `tutDone`.

The authoritative defaults are in `let conv={...}` at ~line 1813. The full table with types and descriptions is in **`elysium-project-context.md` → "conv — local settings reference"**.

## VTES glossary

| Term | Meaning |
|------|---------|
| Methuselah | A player |
| Pool | Life total; 0 = ousted |
| Crypt | Vampire deck | Library | Everything-else deck |
| Minion | Vampire or ally in play |
| Uncontrolled | Crypt cards drawn but not yet in play |
| Bleed | Core attack: reduce prey's pool |
| Prey / Predator | Next / previous in turn order |
| Oust | Elimination; predator gets +6 pool, +1 VP |
| The Edge | Contestable token; adds to bleeds |
| Torpor | Incapacitated vampires (not destroyed) |
| VP | Win condition |
| Phases | Unlock → Master → Minion → Influence → Discard |

For rules: **vekn.net/rulebook**. For card data: **static.krcg.org**.

## Collaboration style

- **Communication in Swedish; code, UI, and docs in English.**
- **Deliver fully realised proposals** — build the whole thing, then let the developer respond. Don't pause for incremental approval.
- **Use creative latitude.** Independent creative judgment is welcome.
- **Be honest, not flattering.** Verify, don't guess. If something is unverified (runtime, visual, online behaviour), say so explicitly.
- **End with honest caveats** — flag exactly what is left for live testing.
- **Sweat the details.** Variable scope, visual timing, serialization design, edge cases.
- **Don't relitigate dismissed ideas.** Check `kodarkivering.md` before re-proposing.

## Living documents protocol

Three companion documents are maintained alongside the code:

1. **`elysium-project-context.md`** — full architecture, file reference, function index, conventions. The deep-dive companion to this file.
2. **`elysium-learnings.md`** — version-by-version technical learnings, pitfalls, collaboration notes.
3. **`elysium-session-journal.md`** — design history: why decisions were made.

**Protocol:** Read the latest **project-context + learnings + session-journal** before starting work. Update all three (+ bump the version constant) after each implementation.

## Test suite reference

| Suite | Command | Assertions | What it guards |
|-------|---------|------------|----------------|
| Client logic (also the load gate) | `node test-client-logic.js` | 16 | Loads the REAL client via `elysium-test-harness.js` (catches runtime ReferenceErrors); serialize/restore, pubXform/pubInv inverse, buildPub hand-secrecy, restoreGame defensiveness, baseView, debug ring buffer, mpOnMsg routing, keepLog guard, state-contract depth |
| Server dispatch + rate-limit | `node test-server-dispatch.js` | 5 | `handle()` / `GAME_HANDLERS` routing; per-room vs per-IP password-fail throttling (tunnel loopback isolation) |
| Server integration | `node test-2a.js` … `test-2g.js` | ~195 | Rooms, auth, hidden piles, relay, saves (requires running server) |
| Crypto | `node test-crypto.js` | standalone | SHA-256/HMAC/PBKDF2/AEAD round-trips |

## External resources

| Resource | URL | Usage |
|----------|-----|-------|
| KRCG card images | `https://static.krcg.org/card/{name}.{fmt}` | Card art (JPG/WEBP) |
| KRCG card database | `https://static.krcg.org/data/vtes.json` | Full card data |
| KRCG SVG icons | `https://static.krcg.org/svg/{type}/{name}.svg` | Clan/path symbols |
| VDB deck import | `https://vdb.im` | Deck lists |
| VTES rulebook | `https://vekn.net/rulebook` | Official rules |
| Dark Pack | Paradox Interactive | Licensing agreement (non-commercial fan project) |

## Tutorial system (app-5.js, `tut*`)

A guided, mobile-game-style tutorial over the OFFLINE game. Sections in `TUT_ORDER`/`TUT_SECTIONS`; each `{name,desc,steps:[…]}`. **Step shape:** `{id,target:()=>el,text,place:'top|bottom|left|right|center',advance:{on:'manual|click|event|predicate',name?/test?/match?},gate?:()=>bool,gateHint?:string|()=>string,onEnter?,onExit?,freeInteract?,ringRect?:()=>rect,avoidRect?:()=>rect,skip?:()=>bool,menuHi?:[labels],hiNav?,clickThrough?,orContinue?}`.

- **Gating:** `gate` greys Continue (polled in `tutTick`); gate on a persistent STATE, or **latch** a flag for transient actions. `gateHint` may be a function (live text). All gated steps must be `freeInteract` so clicks reach the board.
- **freeInteract** = coach-mark (no dim/block; ring on `target`/`ringRect`). `skip` opts a step out in `tutGo` (clean branching).
- **Bubble:** draggable (`tut._bubblePin`/`_bubblePinIdx`, auto-released on step change); `tutPlaceBubble` does collision-avoidance + `avoidRect` + a dodge list; `tutArrow` aims the `::after` arrow at the target from the bubble's FINAL position via `--tutArrowX/Y`.
- **Highlights:** `menuHi:[…]`→`.tuthi` on `.mi` rows (exact text match); `hiNav`→`.tutBtnHi` pulse on `#tutEnd`/`#tutNext`. Clones during the tutorial render via top-level `#cardFxTop`.
- **Helpers:** `tutFaceUpVampObj`, `tutVampSelected`, `tutVampsOnFelt`, `tutFaceDownVampRect`, `tutDockRect`, `tutCryptOnBoard`.
- **Sections (TUT_ORDER):** `introduction`, `decklab`, `lobby` ("Start a game"), `classic-intro` ("Table overview"), `classic-crypt` ("Crypt & influence", 11 steps), `classic-play` ("Playing cards & minion actions"), `classic-interact` ("Interacting with opponents" — targeting, simulating a reaction, the Played tab; not a stub, has its own step list).
- **Before touching any z-index** read `elysium-learnings.md` → "Z-index / stacking layer map".
