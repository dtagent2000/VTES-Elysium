# CLAUDE.md — Elysium Development Harness

> **14 July 2026 (cardfx v1.3.0 → v1.4.2, bot v0.5.2 → v0.5.7, client/server untouched) — the Masters tagging round, end to end: persistent+lock auto-tags → all four Masters curated+wired → Ashur Tablets threshold+table-wide watch → Effective Management handler → bounce-fix (gate: cardfx 46/0→74/0, bot 135/0→186/0).** Full detail in this session's 7 journal entries and `cardfx-persistent-lock-design-decisions.md` (13 sections). Headline: two new rulebook-verified auto-tags (`persistent` entry-level, `lock` per-mode), the `actGrant` reader (both `persist:'inplay'` and `persist:'turn'` now wired), a `handler`/`CARD_HANDLERS` registry for bespoke one-off effects (Effective Management sends the existing `drawCrypt`, Ashur Tablets does own-copy removal+scored ash-heap retrieval via `_ashScoreFor`+`pileBulk`), a table-wide collateral watch for Ashur Tablets (burned-count diff tracking, no new wire verb), and a fundamental bounce-fix (`_commitBounce` now sends a spec-correct L12.bleed re-announce with Target suffix + owner-vs-sender separation in `_armPending`). New files: `cardfx-persistent-lock-design-decisions.md` (the full design back-and-forth), `cardfx-sweep-audit.md` + `gen-sweep-audit.js` (the sweep results). **Next session: step 2 of the action-resolution generalization — the attacker-side modifier window + full resolution loop (Leverage, Deflection from the attacker's perspective, the modifier→reaction→bounce→re-block chain). Architecture sketch and Johan's rule verification already done (design-decisions §13).**
> **14 July 2026 (bot v0.5.1 → v0.5.2, client/server untouched) — stealth universalized, real deck now default (gate 132/0 → 135/0, 4× stable):** (1) hunt never set `this._actingVamp`, so it could never reach the existing reactive-stealth mechanism when challenged with Block! -- fixed with the same wiring bleed already has, plus a new `stakes` weight (typical bleed = baseline, hunt's fixed 1-blood prize discounted) so the mechanism is universal ("every action treated fundamentally the same," Johan) but willingness is stakes-weighted per persona. (2) `DEFAULT_DECK` replaced with Johan's real "Leveraging my Hacking Skills" -- surfaced that the foundational connection/turn/bleed/combat test flow had silently relied on `DEFAULT_DECK` instead of its own explicit deck, making a discard-phase assertion flaky once the default changed; fixed by pinning that flow to an explicit deck matching the OLD default, same discipline every other test already followed. No wire change. **Next session (Johan's plan): Masters tagging round (Ashur Tablets/Effective Management/Information Highway/The Parthenon) — full "start here" note in `elysium-backlog.md`. Check first whether `vtes.json` is attached to that conversation: uploads don't carry between chats, and the compiled `elysium-cardfx.json` does NOT retain raw `card_text` for auto-tier entries.**
> **14 July 2026 (bot v0.5.0 → v0.5.1, client/server untouched) — §7.6 follow-up: a real deck, an Edge correction, generalized phase economy (gate 119/0 → 132/0, 3× stable):** Johan supplied a real "Weenie Computer Hacking" playbook; verifying every card's REAL text against `vtes.json` found real gaps (Leverage burns the Edge for +1 bleed, Ashur Tablets is a threshold/one-shot not recurring income, Effective Management/Information Highway/The Parthenon unmodelled, `fx.dodge` unhandled by combat). Johan corrected a genuine misunderstanding: the Edge's pool bonus is PASSIVE and does NOT consume the Edge — the code already had this right, only the description was imprecise (fixed); the earlier "tension with Leverage" was withdrawn. Then, three decisions built same-session: (1) the bot now ALWAYS plays a master if it holds one, even uncurated (placed standalone, a human corrects via ctrl); (2) a generalized phase-action economy (`phaseActs`/`phaseBonus`/`phaseUsed` → `_phaseAvail`), verified against and mirroring the client's own `state.phaseActs`/`masterBonus`, now shared by Master/Influence/Discard; (3) a new curated `actGrant` field for future bespoke bonus-action cards, independent of Trifle's own capped rule. 13 new offline units + 1 new live integration test. No wire change.
> **13 July 2026 (bot v0.5.0, cardfx recompiled, client/server untouched) — vtes.json follow-up:** Johan attached the real card database (KRCG v3 format) after the §7.6 delivery below. Real compile + `test-cardfx.js` run for real: **46/0, drift check clean** — `elysium-cardfx.json` is now a genuine fresh compile (replaces the earlier hand-mirrored file used while `vtes.json` was unavailable; identical content, confirmed correct). Also answered Johan's L4-vs-L2/L3 question with actual code research rather than assumption: L2/L3/L4 are board-style + zoom-level view modes, not a responsive ladder, and attached-card (`host`/`attached`) rendering is already mirrored across all of them (`buildMat()` shared by L2/L3/visit, `renderL4OppCards()` L4's own parallel implementation, deliberately kept in sync per its own comment) — full detail in `elysium-learnings.md`.
> **13 July 2026 (bot v0.4.6 → v0.5.0, client/server untouched) — §7.6 SHIPPED: masters, hunt, pool economy (gate 80/0 → 119/0, 3× stable):** three real decisions from Johan, not guessed. (1) Passive income (Blood Doll/Vessel) is PHASE-EXACT via a new cardfx `phase` field — data, not bot code — rather than the v1 single-fixed-point cut; `cardfx-compile.js`'s curated overlay is a whole-entry passthrough (verified, no compiler change needed) but `elysium-cardfx.json` had to be hand-mirrored (no `vtes.json` here to recompile with — `test-cardfx.js` could not run, recommend Johan run it once locally). (2) Voluntary hunting is persona-weighted (reuses `aggression` inversely, no new knob). (3) The bot proactively blocking a prey's/predator's hunt was explicitly PARKED (documented future shape: capability + persona gate, same split as `blockShy`) — not built. Shipped: Master-phase play (income assets, trifle bonus action), mandatory + voluntary hunt (reuses Bleed's announce→ask→resolve shape exactly), phase-exact recurring income, full phase-bar parity (`_announcePhase` — the bot now sends the identical `log('Phase: <b>X</b>.')` line a human's Structured helper button does, at all 5 phases + an unconditional Pass line), a smarter discard (masters no longer auto-dead; a bounce-only card correctly dead in a 2-live-player table via a widened `_modeUsableBy`), and the Edge now ALWAYS cashed in for +1 pool at unlock (Johan's follow-up question surfaced a real gap, not a cosmetic one — the bot tracked Edge possession correctly since M2 but never once claimed the pool). `buildPub()` gained `host`/`attached` fields (needed the moment anything first attaches to a vampire). A genuine bug (`_drawOwed` silently un-flushed when a vampire hunts instead of bleeds) was caught by the new live integration test, not by inspection, and fixed via an extracted `_flushDraws()`. 29 new offline units + 1 live integration test. No wire change.
> **13 July 2026 (bot v0.4.6, client/server untouched) — torpid vampires now unlock too:** Johan's direct follow-up. Source-verified against the vekn.net rulebook: "A vampire in torpor is still considered controlled but is not ready. They still unlock at the start of the unlock phase." Torpor and lock/unlock are two separate flags — the old code only ever touched `zone==='ready'`, so a torpid vampire stayed locked forever (a stale lock glyph, and wrong for any card reading a torpid minion's lock state). New `_unlockPhase()` method (extracted, directly unit-testable) clears lock on both ready AND torpor; also removed an orphaned `torporN` variable found along the way. Gates: bot **78/0 → 80/0** (3× stable), canary 37/0, client-logic 29/0, dispatch 18/0, protocol-lint 6/0, check-versions agrees. No wire change.
> **13 July 2026 (bot v0.4.5, client/server untouched) — three fixes from Johan's live test of the M2 defense pass:** (1) **collision-free zone placement** — `slot(zone,idx)` is a pure idx→{x,y} formula with no memory of who's already there, so a vampire leaving Ready out of turn (combat torpor, or the v0.4.4 ctrl exception) freed a MIDDLE slot the next influence raise recomputed straight onto a still-occupied neighbour ("vampires stacking on top of each other"). New `_openSlot(zone, exclude)` scans for the first slot nobody else occupies; wired into the influence raise, `_resolveCombatRound`'s torpor placement (was hardcoded `slot('torpor',0)` — every KO'd vampire landed on the SAME spot), the ctrl torpor/untorpor toggle (previously left x/y untouched), and `_addUnc` (was `this.unc.length`, same hole risk). (2) **the 2s pacing floor now holds everywhere** — the old `pace()` was a blind `sleep(paceMs)` called inconsistently (the minion→influence and influence→discard turn transitions had NO gap at all, and a wake+intercept or strike+prevent double-card reaction could fire both plays in the same instant); new `_pace()` gate waits only the REMAINING time since the last resolved action, threaded through every turn-phase transition plus `_commitBlock`'s wake→intercept step and `_resolveCombatRound`'s strike→prevent step (both now `async`); `react-delay` now floors at `paceMs` instead of capping under it (was 1.6s at the default persona). (3) **influence now animates** — raising a vampire never called `fxClone`; it now sends `kind:'rise'` (protocol/server already supported it, the bot just never sent it). Gates: bot **70/0 → 78/0** (3× stable), canary 37/0, client-logic 29/0, dispatch 18/0, protocol-lint 6/0, check-versions agrees. No wire change.
> **13 July 2026 (client v2.6.39 / server v2.6.16, client-only change) — a stale shared `free` counter stopped hiding a viewer's own Block/Vote/Combat buttons:** Johan's immediate follow-up: with Helpers on he saw the bare fallback counter sitting where Block/Vote/Combat should be. Root cause: `free` is genuinely SHARED state (v2.6.37), so once it had been set (e.g. while helpers were off) it kept `avr.mode` truthy — and the button-hiding logic hid ALL named buttons whenever `avr.mode` was truthy, with no exception for a viewer who'd since turned a helper back on. Fix: `avrRender()` now computes `freeNeeded = avr.mode==='free' && avrFreeAvailable()` — the named buttons and the live strip are only masked by `free` for a viewer who STILL has zero named helpers; `avr.mode` itself is left untouched (so a genuinely helper-less table-mate mid-count isn't disturbed), and the moment anyone actually presses a real named button, `avrOpen()` overwrites `avr.mode` for the whole table anyway, cleanly resolving any stale state. Gates: client-logic 29/0, dispatch 18/0, protocol-lint 6/0, canary 37/0, bot-logic 70/0, B1 roundtrip byte-identical, syntax ×2, check-versions agrees. No wire change.
> **13 July 2026 (client v2.6.38 / server v2.6.16, client-only change) — say-bubbles re-centre as a group instead of sitting in fixed columns:** Follow-up on the fixed-column fix below: Johan wanted the group to stay visually centred as bubbles come and go, with a glide rather than a snap. `sayBubble()` now keeps an ordered array of live bubbles (oldest → newest) and derives each one's `left%` from its index and the CURRENT count (`50 + (i-(n-1)/2)*20`, which collapses to the old fixed 30/50/70 at n=3) — so the newest bubble lands at its own final slot directly (no self-slide, only its existing pop/fade plays), while every already-mounted bubble's `left` is recomputed and glides there via a new `.sayb{transition:left .45s}` (scoped to `left` only, so it never fights the existing keyframe's opacity/transform). The same `sayFxRelayout()` runs on natural fade-out (animationend) and on cap-eviction, so survivors always glide back into a centred row. Net effect: the oldest bubble drifts further left as newer ones arrive (until it's evicted or fades), the whole live set stays centred as a group. Gates: client-logic 29/0, dispatch 18/0, protocol-lint 6/0, canary 37/0, bot-logic 70/0, B1 roundtrip byte-identical, syntax ×2, check-versions agrees. No wire change.
> **13 July 2026 (client v2.6.37 / server v2.6.16, client-only change) — the Played-tab resolver footgun + the bare fallback counter + side-by-side say-bubbles:** Johan reported that with every named resolver helper off (Tournament mode, or all three toggled off), the Played peek showed a stuck "0 vs 0" strip with dead +/- and Resolve/x. Root cause: `#avrLive` had NO `[hidden]` counterpart rule, so its own `#avrLive{display:flex}` (id-selector) beat the UA `[hidden]{display:none}` default — the SAME footgun class already fixed for `#avrDuel`/`#edge`/`#helpOverlay`. Fixed, and turned the bug into a feature per Johan's ask: a new `free` resolver mode is the automatic fallback whenever `resBlock`/`resVote`/`resCombat` are all off for a player — a bare, unlabeled A-vs-B counter they interpret for themselves. First cut made it LOCAL-ONLY (never broadcast); Johan's immediate follow-up called that inconsistent ("de olika spelarna kan manipulera den samtidigt" — it should behave like the other three, not differently) — so `free` now rides the exact same shared `tally` channel, any seat may adjust it, no special-casing (v2.6.39). With any named helper on, the CSS fix also restores the originally-intended clean look (only the enabled mode buttons show; the live strip stays hidden until one is clicked). Separately: `sayBubble()` quick-phrase bubbles all rendered at the same `left:50%`, so two triggered inside the other's 3s animation stacked illegibly — now assigned one of 3 fixed columns (30/50/70%), freed on natural animationend or on the pre-existing 3-bubble eviction. Gates: client-logic 29/0, dispatch 18/0, protocol-lint 6/0, canary 37/0, bot-logic 70/0, B1 roundtrip byte-identical, syntax ×2, check-versions agrees. No wire change (rides the existing `tally {mode,a,b,ph,rd}` shape — `free` is just one more valid string value).
> **13 July 2026 (client v2.6.35 / server v2.6.16 / bot v0.4.4) — the bot-elements exception:** Johan: a bot's cards are read-only to everyone but the bot, same as a real player's — but the bot can't model every triggered ability (an untap-phase ping, a torpor rescue), so the table needs to be able to step in. A seat now self-declares `bot:true` at create/join; the server relays it in `roster`/`lobby` (additive `players[].bot` field, no new verb). The opponent-card menu splits Take-back/Burn (owner-only — they move the card off the board) from Blood/Blue/Green/Lock/Flip/new **Send to torpor** toggle (now `_mine || _botSeat`, where `_botSeat` looks up `net.roster[].bot`) — ANY player can now adjust a bot's own cards. Turned up a genuine gap while shipping it: `elysium-bot.js` had ZERO `ctrl` handling — the owner-gate had always hidden those menu items against a bot seat, so the wire path had never actually been exercised against a headless receiver. New handler in the bot's `_mkHandlers()`, deliberately with NO `owner===from` check (only a self-declared bot seat ever reaches it). The new torpor/untorpor verbs also generalize to the pre-existing human-controller case via the client's own `move()`. Johan's related ask — pausing the bot's own turn engine on 'Hold on…' so nothing races a human's mid-turn edit — is parked as a discussion point for a future session (see the backlog), not solved here; this session's test runs entirely before the first `pass`, so nothing here races `_playTurn()`. Gates: bot 65/0→**70/0**, dispatch 18/0, client-logic 29/0, canary 37/0, protocol-lint 6/0, B1 roundtrip byte-identical, syntax ×3. **Server restart required.**
> **13 July 2026 (client-only, v2.6.34) — separate menu/panel brightness slider:** Johan noticed the new 200%-cap table brightness didn't touch menus/panels — by design (`applyBrightness()` only ever filtered `#board`, so menu text stays readable at any table brightness) — and asked for an independent slider instead of leaving them pinned. Added a second Settings slider (`#uiBrightness`, same 60–200% range, own `UI_BRIGHT_KEY` localStorage entry) that writes a `--ui-bright` CSS custom property; a new CSS rule (`header, aside, #menu, .modal, #playedOverlay, #readyPeek, #cardTip{ filter:brightness(var(--ui-bright)); }`) applies it DIRECTLY to the chrome elements rather than to a shared ancestor of `#board` — the two sliders never compound into each other, no compensation math needed. Threaded through settings export/import (`uiBrightness` field) and the factory-reset key list. Gates: client-logic 29/0, B1 roundtrip byte-identical, syntax ×2, check-versions agrees.
> **13 July 2026 (client-only, v2.6.33) — four small client fixes:** brightness slider cap raised 130%→200% (init/import validation caps raised to match); the ONLINE opening deal (`dealt` s2c handler) now sorts the hand immediately instead of only appearing sorted once the first `move()`-routed draw re-sorted it (hotseat's `dealOpening` already sorted per-card via `move()` and was unaffected); the L2 **column-dock** ("bottenpeek") close-on-drag branch was unconditional — ignoring `conv.dockDrag`/`dockPinned` entirely, unlike the L3/L4 sibling fixed at v2.5.76 — now deferred with the same `dockCloseNow`/threshold pattern (`drag.l2colsDockDefer`); and `showSay()` now clears any running Reaction-timer countdown (`net.dfxT`) the instant a quick phrase renders, covering the right-click menu, the ❗ quick button, and every network client receiving the `say` relay, since all three route through that one function. Gates: client-logic 29/0, dispatch 18/0, protocol-lint 6/0, B1 roundtrip byte-identical, check-versions agrees (docs re-stamped below). Server/protocol untouched.
> **Current state: client v2.6.34 / server v2.6.15 — RELEASE CANDIDATE (11 July 2026): the DUEL VIEW (D1) — both combatants side by side inside the Played peek while combat is open: card art (avRenderCard, hover-preview free), blood/counters (own side opens the ct-stepper — the canonical mutation path), attached list (own cards open the normal card menu), lock glyph, ⚔ Join/Swap/Leave; announced via tally `duelCid`/`duelName`, SERVER-MERGED per seat into a `duel` map (survives counter pushes, drops on combat exit), left = turnSeat (acting); own side manageable, opponent's read-only from their pub. Round 3 (same day): resolver round 3 — Block resolves no longer close the batch (rule-correct; the local resolver is ASKED about the Played tab when the setting is on), a combat ROUND counter (`tally.rd`, bumps on phase wrap), `+X bleed…` announces post-announce modifiers against a batch-scoped running total (`adds +X bleed (= T).`), a live resolver holds the Played peek open, the frozen bot-parseable line formats live in PROTOCOL §12, and the §7/§8 heading counts caught up (52/47 — they'd drifted since the tally verb landed). Round 2 (same day): resolver round 2 — Resolve now closes the card-play batch (and the say RECEIVER finally honours 'It resolves', which only ever ran sender-side) with a local Settings choice `avrResolveClear` Off/Clear/Clear+discard-mine; a combat PHASE stepper (the rulebook's 7 steps, shared via new `tally.ph`, wraps for new rounds); a transient `tally.res` flag fans the batch-close/clear to every client; an always-visible ⇄ Pass button rides `say`; per-mode accents (vote gold, combat red). Round 1 (v2.6.16/srv-2.6.11): the Bleed 1/2/3/X… submenu (amount rides the log line + the fx `verb` string, so remote clones show it for free) and the shared Played-tab resolvers — Block (gated on an active ready minion; Stealth vs Intercept, KRCG obf/aus icons) / Vote (for vs against) / Combat (damage each way) with icon buttons (KRCG `icon/reflex·political·combat`, emoji fallback), ± steppers + the board's scroll/Ctrl/Shift idiom, and a Resolve that logs a fixed machine-readable line (the Trainbot's structured diet); counters sync via the new bidirectional `tally` verb (whole-state, last-write-wins, any seat adjusts, room-stored for late joiners, cleared on start; protocol 47 s2c / 52 c2s). Earlier RC state (7 July): post-sanity additions: the card DATABASE joins the local images/ folder, and v2.6.15 closes Johan's first-time-offline-file:// catch with a 📁 From file… picker in Settings (FileReader is the one transport file:// allows; one click loads AND caches, all later starts automatic; all three dead-end log lines point at it) (drop KRCG's vtes.json beside the images — server route whitelists the exact name; client tries it first when the toggle is on; fetch()-vs-file:// asymmetry documented: the database file needs server/localhost/tunnel, images work everywhere). SERVER RESTART pending (now srv-2.6.8→10).**
> **Pending on Johan's side:** server restart (accumulated srv-2.6.8 LOBBY_CONNS-leak fix + srv-2.6.9 SIGTERM flush), the live-test suite v2.5.92→v2.6.13 (capture-listener browser check chief among them), and the public upload (README.md is the new repo face).
> **13 July 2026 — the §12 contract canary ships:** `test-bot-canary.js` (37/0) closes the last open item from the M2 handoff spec (§7.5 step 0) — PROTOCOL §12 prose, the client's live line-builders, and the bot's L12 regexes are now cross-checked automatically, and the mechanism was destructive-tested (a simulated wording drift) before being trusted. §12-Contract-canary Full gate battery green: bot 55/0, cardfx 45/0, client-logic 29/0, dispatch 18/0, protocol-lint 6/0, canary 37/0, check-versions agrees, smoke green. Next up: M2 (§7.5). > **11 July 2026 — the Trainbot lands (M1 slice 1):** `elysium-bot.js` v0.1.0, a headless zero-dep seat bot (RFC 6455 client mirroring wsAttach, sanitizePub-shaped pub authoring, correct phase order + opening-transfer stagger, the chat contract: Block?-asks out, `bleed N`/`vote N` in, oust→bounty) + `test-bot-logic.js` (**17/0** against the REAL server on a random port). Client/server untouched — no restart, no bumps. Design + ladder: `elysium-bot-feasibility.md`; live-test list: the journal's Trainbot entry. **12 July 2026 — the cardfx library v1 (bot track):** a SHARED card-effect database compiled from vtes.json — `cardfx-compile.js` → `elysium-cardfx.json` (fxv 1: 2364 lib / 1785 crypt / 2422 aliases, 62% auto-fx) + hand tier `cardfx-curated.json` + gate `test-cardfx.js` (**45/0**, v1.2.0 rules tags); facts in the library, policy in playbooks (Johan's 4-bot / 5-seat goal); schema/tiers/limits in `elysium-cardfx-design.md`; bot-spec §5/§6(h)/§7 updated (own-deck-only superseded). Client/server untouched. **12 July 2026 — bot v0.2.0 (gate 33/0):** the pending-bleed machine (announce ≠ resolve, apply ONLY on 'It resolves', +X reopens, supersede, stale-on-turn-change), §12 parsing + frozen announces, the multi-channel Block? window (chat + say + §12 lines; 'Hold on…' pauses), table model + cardfx threat reads, tally mirror + capability detection, the three-tier name ladder (client-identical norm()), cardfx crypt caps, the L4 seat camp (pool-token export), the decide() persona seam, and a paced outbound queue (the server hard-closes >80 msg/10 s). **Same day — bot v0.3.0 (gate 39/0 ×3):** personas (novice/grinder/shark), the insight hand-READ (spec §7: inference, never knowledge), decide() v2 (bleed-action cards from hand + stealth vs Block!, insight-weighted), queue-coalesced push (timer debounce reorders the wire — reverted). Plus `elysium-bot-table.js` v1.0.0 (multi-bot launcher; bot-vs-bot loop smoke-proven end-to-end), `START-HERE-BOTS.html` (player guide + live-test checklist 1–12), and the authoring-pipeline end goal in spec §7 (next rung: `elysium-bot-arena.js`). v0.3.1: exception-guarded dispatch; v0.3.2: crypt uniqueness; v0.3.3: the RULES layer — cardfx v1.2.0 unique/limited tags (gate 45/0), tag-aware crypt uniqueness, unique-library guard, per-action modifier ledger, the Edge (v0.3.4: rising-claim yield, gone on oust); the suite spawns a server COPY in tmp (the __dirname store once hit MAX_ROOMS and bricked every create). Client/server untouched.
>
> **What the 7 July mega-session delivered, one line per theme** (full per-version detail lives in `elysium-session-journal.md` — this header used to carry it all and had grown to a single 133 kB line, consolidated on Johan's docs-review ask):
> *The lobby (L1+L2):* `--server-pass/--admin-pass/--create-policy/--trust-proxy` in a testable CFG; `hello`→`roomList` with live pushes; 🔍-browse UI; admin got its client surface (field + conditional hello) after the dispatch suite was found masking its absence; LOBBY_CONNS leak plugged at close; SIGTERM flushes like SIGINT; MAX_ROOMS/rate/snapshot-cadence verified already solid.
> *The image system:* opt-in local `images/` folder as a third tier (server route with traversal-proof regex; ONE capture-phase error listener composing with ~18 untouched per-element fallbacks), extended to card backs (BACKS getters) + svg icons (shared svgUrl, `/`→`-` flatten), format-agnostic two-step ladder (KRCG's zip unzips straight in), per-card negative+wrong-format memories, warm-cache promise-memoization with a failure policy, download-intent persisted at click (welcome-dialog loop bug), backs preloaded at load (typeof Image-guarded for the harness).
> *Deck Lab & import:* Load .txt restored (self-contained modal outside the `.modal` sweep), name prompt on both save sites, file-browse import in both paste boxes, catalog-checked ⚠ unrecognized-card flag.
> *Tutorials & docs:* online tutorial split into **Join** (13 guest-eye steps, listed first) and **Host**; three `start-elysium-guided.*` launchers (prompted flags, empty = plain, bash-3.2-safe, `!`-in-passwords warned); README.md (GitHub renders no HTML); START-HERE v1.7 Host-first with GitHub download pointers; protocol §6.1 CLI + `/images/`; version lockstep restored 2.6/2.6 (silencing a false per-join mismatch warning every public user would have seen).
> *Fixes along the way:* undo-sync, browse-fallback race, #overlay z-index 800→20000 (l4mode ALSO carries l3mode), Edge-over-tutorial, welcome-dialog re-download loop, format-switch memory inversion — every one root-caused, gated, and journaled.
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
| `elysium-bot.js` + `test-bot-logic.js` | BOT SESSIONS START HERE → `elysium-bot-spec.md`. Trainbot **v0.5.0** — §7.6 SHIPPED (masters/hunt/pool economy: master-phase play with trifle bonus, mandatory+persona-weighted voluntary hunt, phase-EXACT recurring income via a cardfx `phase` field, full phase-bar parity via `_announcePhase`, the Edge always cashed in, a widened `_modeUsableBy` for bounce/2p, discard no longer auto-kills masters — **119/0**, 3× stable) — then M2 THE DEFENSE PASS (SHIPPED, then live-test-hardened): headless seat bot (pending machine, §12 lines, multi-channel window, cardfx ladder, L4 camp, paced+coalesced sends, personas, insight hand-read, card plays, public ash heap, Reaction-timer ring, discard phase, TOKEN-BUCKET pacer) + informed block-as-target (blockShy finally used), intercept/wake/Deflection reactions with a once-per-action ledger, combat v1 (data-driven, one round, announce-only). v0.4.1: bounce checks a legal destination exists (source-verified: "you can never bleed yourself"), interceptPotential() made ledger-aware. v0.4.2: combat tally zeroed, wake sleeper-guard, bounce idx re-anchor + unlocked-req, ousted abstain-quiet. v0.4.3: blocker LOCKS on success (rulebook), capability-aware _pickBlocker + its end-to-end gate. v0.4.4: the bot-elements exception — self-declares `bot:true`, FIRST-EVER `ctrl` handler (no owner check by design), new torpor/untorpor verbs. v0.4.5 (13 July, Johan's live-test findings): `_openSlot()` — collision-free zone placement, replacing FOUR separate count/hardcoded-index spots (influence raise, combat torpor, ctrl torpor/untorpor, `_addUnc`); `_pace()` — a real 2s-floor gate (was an inconsistently-placed blind sleep) threaded through every turn-phase transition plus the wake→intercept and strike→prevent reaction steps; influence animates — the raise now sends `fx kind:'rise'`. v0.4.6: torpid vampires unlock too. |
| `test-bot-canary.js` | The §12 CONTRACT CANARY (13 July 2026, 37/0) — cross-checks PROTOCOL prose, the client's live line-builders, and the bot's L12 regexes against each other. |
| `elysium-bot-arena.js` | The EVALUATE rung v1.0.0: headless bot-vs-bot match runner + JSONL trace layer + per-persona stats. |
| `elysium-bot-table.js` | Multi-bot launcher v1.0.0: a whole table of personas in one command (arena's seating half). |
| `START-HERE-BOTS.html` | Player-facing bot guide + the live-test checklist for the current stage. |
| `cardfx-compile.js` / `cardfx-curated.json` / `elysium-cardfx.json` / `test-cardfx.js` / `elysium-cardfx-design.md` | The card-effect library family (12 July 2026, **updated 14 July: v1.4.2**): compiler (persistent+lock auto-tags v1.4.0), hand-tier overlay (8 entries incl. all 4 Masters + handler fields), compiled artifact (fxv 1), gate (**74/0**), design doc. Read the design doc before any cardfx work. |
| `cardfx-persistent-lock-design-decisions.md` | **New 14 July 2026:** the full design back-and-forth for the persistent/lock tags, the four Masters' curation, the handler registry, and the bounce-fix — 13 sections covering Johan's original plan, the revisions, what was built, and all future adjustments. Read §7 for "what's easy to change later" and §13 for the action-resolution-loop architecture sketch. |
| `cardfx-sweep-audit.md` / `gen-sweep-audit.js` | **New 14 July 2026:** the full sweep results (every Master row, every lock hit with matched text, all negation cases, type breakdown) and the script that generates them. Not part of the build pipeline — a one-time review artifact, regenerable. |
| `test-bot-canary.js` | The §12 CONTRACT CANARY (13 July 2026, 37/0) — cross-checks PROTOCOL.md §12's prose, the CLIENT's own line-builders (extracted from source + executed, not reimplemented), and the bot's real `L12` regex object against each other. No server, sub-second. Destructive-tested (simulated wording drift) to confirm it actually catches breakage. Run it in the gate battery alongside the bot suite. |
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

A mobile-game-style spotlight tutorial for the **offline** game lives in `app-5.js` (all `tut*`-prefixed, zero collisions; never touches `state.cards`/`state.zones`). Dim + hard-block is four `position:fixed` `.tutFence` rects around an open hole — no z-index on the target, so no stacking-context traps; a rAF loop (`tutTick`) repositions everything and polls gate/predicate steps each frame. Sections are **data**: `TUT_SECTIONS` + `TUT_ORDER = ['introduction','decklab','lobby','classic-intro','classic-crypt','classic-play','classic-interact','structured-intro','online-hosting']` (Classic gameplay = slice 3, split into four full sections — `classic-play`/`classic-interact` are **not** stubs, they carry their own step lists like `classic-crypt`); a step is `{ id, target:()=>el|null, text, place, advance:{on:'manual'|'click'|'event'|'predicate'}, onEnter?, onExit?, gate?, gateHint?, clickThrough?, clickArm?, scroll?, allowSkip?, orContinue?, freeInteract?, ringRect? }`. Progress persists in `conv.tutDone` (section-level). Entry: `#btnEmptyTutorial` on the welcome dialog + a ☰ → Play… item → `openTutorial()`. **Deck Lab and the lobby begin on the welcome screen** with their entry button highlighted (`tutShowWelcome()`); a following step's `onEnter` opens the view — placed there, not the highlight step's `onExit`, so **End** does not open it. **End/Esc** route back to the welcome screen via `tutCancel()`. **Classic gameplay (3a/3b)** runs on a live **L4 free-board** table, so its board steps use `freeInteract` (coach-mark: hide all fences + the hole, show only the non-blocking ring) and `ringRect` (frame several elements at once, e.g. all face-down vampires); **in L4 the dock handle is `#l2dock`** (the old `#handTab` was archived to `kodarkivering.md` in v2.5.11), and a **dragged** crypt card lands in `ready` face-down while a **double-click** sends it to `uncontrolled`. `tutQuickClassic` auto-seats a 2-player Classic Tournament game (from saved decks) when a `classic-*` section is launched with no Classic table up. **Tutorial-game persistence (two layers):** the Classic tutorial table is mirrored to a shared key `TUT_GAME_KEY='elysium.tut.game'` (flag `tutGameLive`, set in `tutStart`, cleared in `startHotseat`) on every change via `scheduleSave` — independent of the autosave mode, fully separate from `saveKey()` — this is the "latest mid-step" state `tutQuickClassic` falls back to. **On top of that**, each `classic-*` chapter also gets its own **entry snapshot** at `tutChapKey(secId)='elysium.tut.game.'+secId`, captured once in `tutStart()` the first time that chapter is reached and never overwritten (`tutGameSnapshot()`/`tutGameResume()`) — these are the "repeat this section from its start" checkpoints the tutorial picker resumes from when you relaunch an already-completed chapter. `tutCancel`/`tutEnd` (End tutorial / Esc) clears only `TUT_GAME_KEY`, deliberately **keeping** the per-chapter snapshots; only `tutResetProgress` clears both. Trade-off (documented in code): a resumed board restores card-for-card exactly, but `startHotseat` always resets the turn counter to turn 1 / VP to 0 on rebuild. To extend it, follow SKILLS.md → **"Add a tutorial step or section"**.

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
- **Touch gesture surfaces (v2.5.39):** every gesture start carries `!e.isPrimary` + the one-gesture guard (`drag||tdrag||pileDrag||mq||giveDrag`); movement thresholds are `e.pointerType==='touch'?10:5` px; `#board`/`.card` own `touch-action:none` (in-board scrollers stay native — evaluation stops at the nearest scroll container — with `pan-y` declared on `#dockLogList`/`#statsPanel`); `body` has `-webkit-touch-callout:none` **and** `input,textarea` restore it. New touch behaviour branches on `e.pointerType`; new touch *presentation* on `body.touchui` — never mix the two gates. Long-press is the ONLY context-menu path on iOS: keep new interactive elements reachable by it (don't `stopPropagation` on `pointerdown` capture, and give bespoke gestures a `pointercancel` cleanup so the engine can tear them down). **Any press-and-hold control (v2.5.40+) uses `bindHold` (never a bare click+interval), joins the engine skip-list, and — replace-not-wrap — removes the old `click` handler it supersedes.**

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
- **Sections (TUT_ORDER):** `introduction`, `decklab`, `lobby` ("Start a game"), `classic-intro` ("Table overview"), `classic-crypt` ("Crypt & influence", 11 steps), `classic-play` ("Playing cards & minion actions"), `classic-interact` ("Interacting with opponents" — targeting, simulating a reaction, the Played tab; not a stub, has its own step list), `structured-intro` ("Structured table" — advanced: guided zones, phase helpers, 5-player navigation; 30 steps; launches from the welcome screen through the lobby with Fill Table).
- **Before touching any z-index** read `elysium-learnings.md` → "Z-index / stacking layer map".
