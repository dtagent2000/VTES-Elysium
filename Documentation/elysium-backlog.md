# Elysium — Improvement backlog (post-v2.5.38)

> **Created 2 July 2026, at client v2.5.38 / server v2.5.38.** This is the canonical NEAR-TERM backlog,
> superseding the suggestion lists in `elysium-online-fixes-plan.md` (which retires to the local archive
> once the v2.5.38 live tests are green). The Technical Documentation docx still carries the long-horizon
> vision; this doc is the pick-a-task menu in between.
>
> **How to use in a future session:** do the startup ritual first (`elysium-project-context.md`,
> `elysium-learnings.md`, `CLAUDE.md`, `SKILLS.md`, latest journal entries; run `node check-versions.js`
> against the snapshot). Then pick an item below — each carries What / Why / How / Why deferred /
> Live test, written to be executable without re-deriving today's analysis. When an item ships:
> mark it here, journal it, and update the living docs as usual.

> **v2.5.72 (3 July 2026) — THE BRANCH MERGE:** two parallel branches forked at v2.5.55 were reunified
> (A-branch v2.5.56–71 = the backlog sweep below + flip/unlock; B-branch v2.5.56B–63B = transfer ramp/prompt/block,
> superior badges, FX_TIMING, Deck-lab sticky, 4p L3 geometry, sup SVGs, remote badges). **B's two booked
> leftovers — remote path/sup badge rendering and sup icons in the offline download — were CLOSED by B63
> and survive the merge** (remote paths reconciled to chosen-only per the A64 decision, veto-flagged).
> The consolidated live-test list lives in the journal's v2.5.72 merge entry.
>
> **v2.5.75 client / v2.5.63 server (3 July 2026):** dock-drag parity (pile drags no longer force-close
> the dock at drag start; new local setting `conv.dockDrag` 'leave'/'close'), dock pinning — click
> the dock's open background for a glowing pinned edge (all five auto-closers gated; landed here
> after two live chip-based iterations, see the journal), and the ❗ quick "Hold on…" button (the
> future reaction hub) + two tutorial complements. Client-only — **no NEW server restart; the
> v2.5.63 restart below still applies if not yet done.** Live-test list in the journal's v2.5.75 entry.
>
> **v2.5.74 client / v2.5.63 server (3 July 2026):** the fx relay catches up with §8 — flip/rise
> clones + actor/onto/reveal now exist online (second member of the sanitizePub drift class); and
> the client gains the PREPARED-GUEST transport: a pasted https/wss link connects wss from a local
> file://- or localhost-opened client (stable origin ⇒ archive + deck library persist forever).
> **Server is now 2.5.63 — ONE restart covers this and everything pending.** Live-test list in the
> journal's v2.5.74 entry. (v2.5.73/2.5.62 — the online sweep: sanitizePub relays the full pub
> surface; cardFx couples the clone to pushNow; the lobby-return machine — see that journal entry.)

## 0. Prerequisites — Johan's gate (may already be done when you read this)

Everything below assumes the **v2.5.38 docking list** is complete: the 14 delivered files synced to the
project + local runtime, the **server restarted** (first logic change since 2.5.30 — `sanHtml` is not live
until then), and `check-versions` agreeing. Accumulated live-test rounds, in case any are still pending:

- **v2.5.38:** visit view — lock/move/flip an opponent card must GLIDE/FLIP (not snap) and the **Edge is
  now visible there**; L3 — same glide/flip, `#l3timer`/`#l3table` stable across pushes, a leaving seat's
  mat swept; peek panes behave EXACTLY as before (consciously untouched); L4 regression pass.
- **v2.5.36 (A3b):** L4 glide on move/lock, flip on faceDown, rise on a new card, right-click after a flip
  gives the correct "Set as target", drag-pan rigid, zoom-glide parity with own cards.
- **v2.5.35:** tick/gong/💬 at correct volume for everyone; Edge button not covering ⚙ for fresh guests;
  clan icon on L4 globes; pile ghosts in own Crypt/Library online; ⌖ tag on your own targeted cards.
- **v2.5.37:** `?server=&room=&name=` pre-fills without auto-join; Mac/Linux launchers on real hardware.
- **E2 + the online round:** the flip-clone question with matching versions; Take back / Burn / Blood ±1
  over the network.

## 1. Open decision (Johan) — L0 reset scope

`enterL0()` currently drops only the `l2dockopen` class (v2.5.30) when returning to the welcome screen.
**Question:** should the stats dock, the rulebook panel and the Played/Ready tabs also reset on L0 entry,
or keep their state into the next game? Needed: Johan's list of which panels reset. Implementation is a
few lines in `enterL0` once decided. Effort: **XS** after the decision.

## 2. Code backlog — in priority order

### 2.1 Peek-pane conversion — the last rebuild surface (Effort: S) — ✅ SHIPPED v2.5.58

**What.** The L2 Prey/Predator fold-out panes (`#l2prey`/`#l2pred`) still teardown-and-rebuild on every
board push: `buildL2mat(id, pp, role, side, fx, fy, w, h, foldKey)` creates the pane, header and body
fresh each `renderL2`, so the neighbour's cards SNAP instead of gliding/flipping. After v2.5.38 this is
the ONLY surface left on the old path — L4/L3/visit all reconcile.

**How.** Reuse the pane by id; tag `pane.dataset.mode` (`'col'` when `w<=46`, else `'open'`, plus the
seat) — a mode/seat change wipes the pane and rebuilds fresh, otherwise: update the `l2hd` header
innerHTML in place (fold click-listener binds on fresh only), keep the `l2body`, and call
`renderBoard({w, h, noLabel:true, host: body})` so `buildMat`'s v2.5.38 reuse path lights up
automatically. Sweep other-seat mats inside the body (`:scope > .mat` with wrong `data-seat` — same
pattern as `renderRemote`), and strip non-mat children before the pub/no-pub branch so the
"No board shared yet." label and a mat never coexist.

**Why deferred on 2 July.** The exact `renderL2` lines around pane creation/removal were never read that
session (a grep filter accidentally excluded them) — patching blind would have broken the atomic-anchor
discipline. **First step next time: read `renderL2`'s pane block** and neutralise whatever removes the
old pane today (`clearL2panels()` or an inline remove) on the reuse path.

**Live test.** Fold out Prey; have the neighbour move/lock/flip — glide/flip, no snap. Fold in/out — as
before. Oust the neighbour / seat change — pane content swaps cleanly. Collapsed strip unaffected.

### 2.2 Optimistic blood/burn online (Effort: M — needs a two-client live test) — ✅ SHIPPED v2.5.59 (live test pending)

**What.** Controller actions on a card you own on someone else's board (Blood ±1, Burn, Take back) round-
trip via the server, and the holder's answering push is debounced by `schedulePush` (600 ms) — total
latency approaches a second. Humans double-click during that silence: two `ctrl` +1s = +2 blood.

**How.** Apply the change immediately to the LOCAL copy (`net.boards[seat].pub` — locate the card by the
same key the menu action already holds) and re-render. Pub pushes are FULL snapshots, so the authoritative
push overwrites everything: the optimism is self-healing, and thanks to the reconcile a correction GLIDES
instead of snapping. Burn/Take-back are the two-hop `recall`/`recalled` dance with an err path (holder
offline → the card must NOT vanish): optimism there = dim the card visually at once (a class), spawn in
hand/ash only on confirmation, un-dim on `err`. Companion (old deferred #5): make the HOLDER push
immediately on recall/burn instead of waiting for the debounce — shortens the window from the other side.

**Live test.** Blood ±1 shows instantly; spam-click and verify the final total is correct once the push
lands; Burn dims at once and lands in ash on confirm; holder-offline err un-dims and logs.

### 2.3 Pub self-preview — dev tool (Effort: S/M) — ✅ SHIPPED v2.5.60 (`elysiumPubPreview()` in the console)

**What.** The recurring online bug class is "what I see of myself ≠ what opponents see of me" (A1 tokens,
A2 clan icon, B1 targeted tag all lived here). Verifying today requires a second browser as a guest.

**How.** A `conv.debug`-gated command/panel (e.g. `elysiumPubPreview()`): take your own `buildPub()`
output, wrap it as a fake `net.boards` entry, and render it through the EXACT opponent path
(`renderBoard`/`buildMat`) into a floating read-only panel — "this is how seat N sees you right now".
One keypress instead of a second client; the whole "on my board but never in pub" class becomes visible
in seconds. Zero player-facing value, which is why it keeps losing priority — but it pairs naturally with
any renderer work.

### 2.4 Cross-board leftovers — six small items (from the v2.5.20–2.5.26 arc)

**a) ✅ SHIPPED v2.5.62 (Johan's design: BOTH parties can end the arrangement — owner keeps "Take back", the HOLDER gets "↪ Give back to <owner>"; hotseat rides giveHot, online rides give→gave; remaining refinement — pub `controller`-field-based gating of blood/lock — stays open below).** Controller- vs owner-gating in the card menu (S, thought-heavy). The three-axis model says
interaction follows CONTROLLER, but the menu today gates on `owner === net.you`. Split it: "Take back to
hand" is an OWNER right; act-on-the-card (blood, lock…) are CONTROLLER rights. Small code, but it is the
interaction contract — design first.

**b) ✅ SHIPPED v2.5.56.** `err` clears `net.recalling` wholesale (S — and a protocol change). Any err wipes the whole
recall guard; two concurrent recalls where one holder is offline can drop the other's protection
(theoretical card loss; unreachable in normal sequential menu flow). Fix: the server echoes `cid` in the
err, the client clears only that entry. NOTE: `err` gains a field → **lint v2 will force the §8 doc row
update** — the first real exercise of the field-level lint.

**c) giveTarget highlight on the mat surface (S, ~15 lines).** During a give-drag the receiver's CARDS
highlight but the mat felt does not, even though dropping on empty felt works (the geometric hit-test
already knows the seat every frame). Toggle a class on `.mat[data-seat]` while hovering.

**d) ✅ SHIPPED v2.5.57 (lock/unlock, flip, blue±, green± — hotseat + online + menu).** More `ctrl` verbs (S per verb). The `ctrl` machinery (route → holder applies → broadcast) is
generic; only blood uses it. Lock/unlock, flip, counter± are one case branch per side each. Player value:
today you must ask the holder to lock your vampire after it acts.

**e) ✅ SHIPPED v2.5.56 (all THREE give paths, not just L4).** L4 give hit-test takes the topmost card (XS). A drop can land on an attached KID and stick to the
wrong card. Apply the established rule ("stacked children are invisible to placement logic"): walk to
`topHost` on hit.

**f) gid monotonic counter component (XS, lowest priority).** The giver mints the shared card id as
timestamp+random; collision risk is astronomically small — a monotonic component (like ordinary card ids
already have) makes it zero.

### 2.5 Perf sentinel — `layout()` per pan-frame in L4 (NO ACTION unless symptomatic)

`applyL3Transform()` → `layout()` runs on EVERY L4 pan/zoom frame. The v2.5.36/38 reconcile made the
heaviest part (opponent cards) cheap per frame, but the rest still runs (all `layoutZone`s, pile ghosts,
pool/edge/hand folding, targeted tags). Nothing stutters on Johan's machine — this entry exists so a
future "pan feels janky on my laptop" report has an instant diagnosis and surgical cut: a slim
`layoutTransformOnly()` per frame touching only transform-dependent placement (the hand-folded own board
+ the opp reconcile — the two-coordinate-worlds lesson: stage furniture rides the CSS transform for free;
hand-placed elements are what force JS per frame), with full `layout()` at pan-end or throttled.
Diagnose first: a browser Performance profile during pan — >16 ms frames dominated by layout/style
recalculation is the signal.

### 2.6 Lint the §3 session fields (Effort: S) — ✅ SHIPPED v2.5.56 (option b; first run caught 3 stale doc fields)

`create`/`join` live in the server's pre-dispatch `handle()`, not in a keyed handler table — so lint v2
cannot `Function.toString()` them, and their §3 field lists are hand-maintained (the gap is documented in
the lint header). It stings exactly where third parties look first: the handshake. Options:
**(a)** refactor into a `SESSION_HANDLERS` table — elegant, but touches the handshake and really wants
the network suites the sandbox rarely runs; **(b)** have the lint BRACE-WALK the `if(m.t==='create')`
branches out of the `handle()` source text and regex the fields there — zero runtime risk, the same
body-extraction technique used daily in patch scripts; **(c)** marker comments in `handle()`.
**Recommendation: (b).** Closes the lint's last documented gap.

## 3. Cleanup & process (Johan's calls)

- **Project-snapshot remainder** (per `elysium-project-inventory.md`): remove `shell.html`,
  `vtes-sfx-demo.html` + `sfx-audio.js`, `elysium-relocation-brief.md`; add back the Technical
  Documentation + Player Manual docx; add `STARTA-HAR.html`, `check-versions.js` and this backlog doc.
- **Delete the local `HOST-GUIDE-ADDENDUM.md`** — fully merged into Host Guide v1.7/v1.8.
- **Paste the Host Guide v1.8 content into `build-docs-en.js`** when convenient — re-establishes Johan's
  real Word template as the authoritative pipeline (`build-host-guide.js` is the delivered interim
  generator; both sources carry the same section text).
- **Retire `elysium-online-fixes-plan.md`** to the local archive once the v2.5.38 live tests are green
  (its own status line says so).
- **Docs diet** — journal ~390 KB / learnings ~265 KB / context ~221 KB and growing; every session start
  pays for it. Proposal: split pre-July journal entries into `elysium-session-journal-archive.md` and
  mark superseded learnings. Entirely Johan's decision.

## 4. Long horizon

- **VPS hosting** (e.g. Oracle Cloud Free Tier): Caddy reverse proxy + a NAMED Cloudflare tunnel for a
  stable address. **Now with a second motivation (v2.5.73 review):** guest persistence — IndexedDB
  (image archive + the ~3 MB card DB) and localStorage (saved decks) are per-ORIGIN, and every quick
  tunnel is a fresh origin, so guests re-download everything and lose their deck library each session.
  A stable address fixes that for free. **v2.5.74 shipped the client-side half:** a guest who keeps
  a LOCAL copy of the client (file:// or own localhost = stable origin) pastes the tunnel link into
  the address field and connects wss directly — archive and deck library persist across sessions,
  only the link is re-pasted. The named tunnel/VPS remains the zero-effort-for-guests comfort fix;
  the stopgap for browser-only guests is still deck file export/import. Groundwork already in place: the client auto-switches to `wss` on https pages, the
  `ipFails` throttle is room-keyed (tunnel/loopback safe), persistence lives beside the server file.
  Remaining: a systemd unit, TLS termination choice, and updating the Host Guide's "Bring your own
  server" section with a worked example.

- **Elysium-bot ("Trainbot")** — feasibility 11 juli 2026 (`elysium-bot-feasibility.md`);
  **M1 steg 1–2 SHIPPED samma dag: `elysium-bot.js` v0.1.0 + `test-bot-logic.js` 17/0** (headless
  zero-dep seat-bot: turmotor med opening-stagger, influence från cap-annoterad playbook,
  Block?-kontraktet, `bleed N`-grammatiken, oust→bounty; server/klient orörda). **Kvar i M1:**
  playbook-passet (bibliotekskort spelas — stealth/bleed-mods + hand-cykling, kurerad TWDA-lek,
  persona, README-avsnitt) + Johans live-test i riktig klient (journalens Trainbot-lista).
  **Datapunkts-passet SHIPPED 11 juli (klient v2.6.16 / srv-2.6.11):** Bleed 1/2/3/X…-undermeny
  (beloppet i logg + klon) och delade Block/Vote/Combat-resolvers i Played-tabben (nytt `tally`-verb,
  whole-state, alla justerar). **Nästa botsteg = v0.2** (fullständig spec + handoff: `elysium-bot-spec.md`; 11 juli: + reaktionsfönster-
  grammatiken Hold on…/Pass åt båda håll, läs-only tally, egna §12-rader via log-verbet, playbook-fx-taggar
  för egen lek — bot skriver ALDRIG tally i v0.2; ev. senare skrivande gated på deltas-fixen): läs `tally`-broadcasts + parsa `bleeds for (\d+)`
  ur log-relayn (predator→bot ⇒ auto-applicera i stället för chattgrammatiken), tracka motståndar-pubbar.
  **Runda 2 SHIPPED 11 juli (klient v2.6.17 / srv-2.6.12):** Resolve stänger batchen (+ say-mottagarens
  'It resolves'-fix), Settings-val Off/Clear/Clear+discard, combat-FASSTEPPAREN (regelbokens 7 steg,
  delad via `tally.ph`), ⇄ Pass-knapp, lägesfärger. Kvar i combat-fördjupningen: range/press/dodge-hjälp
  och ev. helperPolicy-autoräkning från spelade kort — parkerat. **Micro-fixar som väntar Johans besked:**
  tally-deltas mot lost updates, Bleed X-skräpinput→avbryt (nya +X-posten är redan strikt), spectator-disable
  av resolverknappar. (Lokal auto-pin överspelad: v2.6.18:s peek-hållning löser behovet.)
  **Helper-integrationen SHIPPED 11 juli (v2.6.24/srv-2.6.15):** resBlock/resVote/resCombat i
  HELPER_DEFS + serverns HELPER_KEYS — tournament-off, host-låsbara, paraplyer för kopplade hjälpare
  (combat helper-familjen → resCombat). Pass-knappen medvetet alltid kvar (kommunikation, ej helper).
  **Runda 3 SHIPPED 11 juli (v2.6.18/srv-2.6.13):** regelrätt Block-resolve med lokal fråga, rundräknare
  (`tally.rd`), `+X bleed…` med batch-scopad total, peek-hållning, frysta radformat (PROTOCOL §12),
  §7/§8-rubrikdriftfix. **NÄSTA designpass — combat-DUELLVYN:** agerande minion fokuserad vänster,
  blockerande höger, med tokens/blod/attached synliga; egen sida HANTERBAR, motståndarsidan view-only
  (auktoritet: pubbar); kombattant-annonsering trolig väg = cid-fält på tally när resp. spelare öppnar/anmäler.
  **D1 SHIPPED 11 juli (v2.6.19/srv-2.6.14)** — se `elysium-duel-design.md` (statusrad uppdaterad).
  Kvar i duellspåret (D2): rikare attached-hantering om meny-vägen visar sig otillräcklig, strike-snabbtokens,
  long-press-previews på touch, IN TORPOR-badge på kombattantpanelen (zonkoll — kortet renderas idag som vanligt
  när det gått till torpor mitt i striden).
  **KRITISK designnot för bot v0.2 — announce ≠ resolve:** de frysta bleed-raderna avfyras vid ANNONSEN,
  men pool-skadan sker först vid RESOLUTION — ett lyckat block eller en Deflection kan göra att bleeden
  aldrig landar (eller landar hos någon annan). Boten får ALDRIG auto-applicera pool-skada direkt på
  "bleeds for N"-raden: den ska minnas pending bleed från sin predator och applicera först på
  resolutionssignalen (say 'It resolves', i=4-broadcast som boten redan ser; 'Block!'/synligt block-resolve
  ⇒ avbryt pending; Deflection-kort i Played-flödet ⇒ avbryt/omdirigera). AVGJORT av Johan 11 juli: manuell nollning tills vidare — auto-nollning + torpor-badge + range/press/
  dodge-hjälp samlas i en framtida **dedikerad combat helper**; tutorialsvepet = NÄSTA STEG. (Urspr. fråga:
  **damage-räknarna × rundor** — kumulativa över hela combaten (dagens beteende) eller ska ▸-wrap till
  ny runda auto-nolla a/b (per-runda-räkning, applicera i Damage Resolution varje runda)? Enradsfix åt
  båda hållen när Johan valt.
  **Pool-globe-targeting SHIPPED 11 juli (v2.6.21, title-fixar v2.6.22):**
  AVGJORT + SHIPPED 11 juli (v2.6.23): pool-siktet auto-rensas via used-flagga när actionen som
  använde det resolvar (naiv rensning hade ätit färska sikten — actBleed stänger föregående batch före
  sin loggrad); kort-targets förblir sticky. Smått: spectators kan sätta
  ett lokalt spök-pool-target via menyn (gate:a raden på !net.spect — parkeras med övriga spect-fixen). sentinel-cid `'pool'` på befintliga
  pub-target — noll serverändring (överlever cleanCard+truthy, kolliderar aldrig med `'c'+seq`).
  Klientarbete: sätt-target-UI på globerna, markör-render för cid==='pool' (FYRA-VYERS-AUDIT L1–L4!),
  targetSuffix med spelarnamn, §12-tillägg för suffixvarianten. +X bleed återöppnar reaktionsfönstret
  (bot-spec uppdaterad). Därefter: **tutorials/README-svepet** (resolverytan har nu satt sig). PLACERINGSBESLUT (Johan, 11 juli):
  nya stegen går i **structured-intro**, INTE basics — cp-bleed-uppdateringen räcker där. Föreslaget
  kapitel "Table helpers & resolvers" (~8–10 steg): (1) Settings→helper-familjen + tournament-konceptet,
  slå på de tre (löser även gating-fällan: stegen får aldrig peka på dolda knappar — Classic auto-sätter
  tournament!); (2) Played-peeken + ⇄ Pass som reaktionsspråk; (3) Block: minion-gate, stealth/intercept-
  idiom, Resolve-raden + att block INTE stänger batchen; (4) Vote: accenter, Resolve stänger + "Resolver
  Resolve"-settingen; (5) Combat: faser+rundräknare, damage, DUELLVYN (Join/Swap/Leave, egen sida
  hanterbar/motståndare view-only); (6) pool-targeting: sikta glob → suffix → auto-clear vid resolve;
  (7) +X bleed-idiomet; (8) avslut: tournament gömmer allt (rent L4). Samma svep: README + host-guide-
  omnämnanden. Fallback-teknik om steg kräver påslagen helper: onEnter forçar + onExit återställer.
  **Tutorialkapitlet SHIPPED 11 juli (v2.6.25):** sektionen `structured-helpers` ("Structured II — Table
  helpers", 20 steg) enligt skissen — gating-fällan löst pedagogiskt (sh-helpers KRÄVER påslagna helpers
  via hx-gate, ingen forçering behövdes). KVAR av svepet: host-guide/README-omnämnanden
  (build-host-guide.js — egen yta, litet eget pass) + Johans genomspelning (livetest ah–ak). **Tutorials/README-svepet väntar** tills duellvyn
  satt resolverytan. **Smått parkerat:** intercept-nollning per blockförsök (manuellt tills vidare, Johans ok);
  resolverraden i portrait/tablet → R2-punkt i responsivplanen när den återupptas; `room.tally` följer
  medvetet INTE med i saveMatch (beslut, dokumenterat här).
  **Därefter M2:** försvar (bounce/wake), PJ-tärningar för botens val, förenklad strid per
  PJ-tabellen, ❗-strukturerade prompts i stället för chattgrammatik. **M0** Ghost predator
  (solo-träningsläget) står kvar som separat, oberoende rung. **Non-goal: konkurrenskraftigt spel.**
- ~~**elysium-bot-arena.js**~~ **SHIPPED 12 July 2026** (v1.0.0, gated in the bot suite §12): headless match runner with persona rotation, last-standing play, per-persona stats — see spec §7.
- ~~**§12 contract canary**~~ **SHIPPED 13 July 2026** (`test-bot-canary.js`, 37/0) — cross-checks PROTOCOL §12 prose, the client's live line-builders (executed, not reimplemented), and the bot's L12 regexes against each other; destructive-tested (simulated wording drift) to confirm it actually catches breakage rather than rubber-stamping green.
- ~~**Arena evaluation data layer**~~ **SHIPPED 12 July 2026** with the arena: JSONL traces (decide/why, through/blocked/took-bleed, dealt hands, result) + summary.json — and they paid for themselves on day one (the ghost-prey diagnosis).
- ~~**Vote-table courtesy**~~ **SHIPPED 13 July 2026** (M2, bot v0.4.0) — chats "abstains (0 votes)" once per referendum.
- ~~**Bot-elements exception**~~ **SHIPPED 13 July 2026** (client v2.6.35 / server v2.6.16 / bot v0.4.4): a bot seat self-declares `bot:true`; ANY player may now adjust its own cards (blood/blue/green/lock/flip/torpor) via the existing `ctrl` mechanism, generalized from an owner-only gate to an owner-OR-bot-seat gate. Take-back/Burn stay owner-only. See the session journal + `elysium-project-context.md`'s cross-board-lifecycle section for the full design.
- **Hold-on/Pause as a REAL pause of the bot's own turn engine (Johan, 13 July 2026) — discussion point, not started.** Today 'Hold on…'/'Pass' only pause the bot's narrow ask-timeout windows (as actor awaiting reactions, as target of a pending bleed). Johan wants the SAME phrase pair to pause the bot's entire turn engine (`_playTurn`) at any point — e.g. mid Untap-phase, so a human can safely apply an untap-triggered effect (1 damage, a torpor rescue) to a bot's own vampire via the new ctrl mechanism above, without racing the bot's own concurrent turn processing — then 'Pass' resumes exactly where it left off. Two open design questions flagged for whoever picks this up: (1) **the resume-time race** — the bot holds `this.board` as its own JS array and pushes full snapshots; if a human edits via `ctrl` while paused, the bot must re-sync its own `this.board` from the server's pub on resume, or its next push could clobber the edit; (2) **what "paused" actually freezes** — just the turn engine's phase/step progression, or also its react-timeout timers (askSecs)? A Hold-on during the HUMAN's own turn should presumably also stop the bot from acting on its cards while the edit is in flight, regardless of whose turn it nominally is. Needs cooperative checkpoints threaded through `_playTurn` (an `await this._checkpoint()` between phases/steps, not just at the existing asks) and `_onSay` setting a general pause flag outside the current `_ask`/`pending` contexts. Effort: **M/L** — a real design pass (entry state, options, test plan) before implementation, same shape as M2/v0.5's spec write-ups.

- **Block-eligibility from `dir` (bot, v0.5+)**: `dir` is now correct per-mode (13 July fix)
  but still UNREAD by the bot — M2's block-as-target only covers the always-directed
  default-bleed case (bot as sole legal blocker by construction). Wiring it in requires the
  bot to recognise non-bleed action cards, track when IT is the actor's prey OR predator
  (undirected — both may block) vs. the sole named target (directed), and handle
  multi-target directed actions (clockwise block order). **A first, narrower instance of
  this was scoped and explicitly PARKED during §7.6 (13 July, Johan's call):** the bot
  blocking a prey's/predator's undirected Hunt action specifically. Documented future shape
  — a general "can I legally block this mode" capability (reusing `_bestInterceptFor`) in
  the bot's shared logic, gated behind a persona knob (same split as `blockShy`) so a
  low-value defensive habit doesn't get forced on every persona. Not built; the general
  `dir`-driven block-eligibility item above remains the broader, still-open umbrella.

- ~~**The long-game arc**~~ **SHIPPED 13 July 2026** (bot v0.4.6 → v0.5.0, `elysium-bot-spec.md` §7.6, gate 119/0 ×3): master-phase play (Blood Doll/Vessel, trifle bonus), mandatory + persona-weighted voluntary hunt, phase-exact recurring income (a new cardfx `phase` field), the Edge always cashed in, full phase-bar parity, and a smarter discard. Hunt-blocking (the bot proactively blocking a prey's/predator's hunt) was scoped and explicitly PARKED with a documented future shape (general capability + persona gate) — see §7.6 and the entry below.
- ~~**Masters tagging/indexing round**~~ **FULLY SHIPPED 14 July 2026 (cardfx v1.4.1 +
  bot v0.5.4, gate: cardfx 46/0→73/0, bot 135/0→159/0, 3× stable):** Part 1 (compiler
  sweep) — two new rulebook-verified auto-tags, `persistent` (entry-level) and `lock`
  (per-mode, alongside `dir`), mirroring the v1.2.0 unique/limited precedent. Four real
  bugs caught by running the compiler for real: the mode-emission gate was fx-only (The
  Parthenon's lock-only text compiled to zero modes until widened to fx-OR-dir-OR-lock);
  "unlock"/"block" contain the bare substring "lock this" (125 false positives without a
  leading `\b`); Deflection's `[DOM]` needed a real three-state so a negation actively
  blocks "as above" inheritance; Equipment/Ally/Retainer/Event were nearly invisible to
  text patterns (persistent BY RULE, no supporting prose) until a type-first check was
  added. Final: persistent 1197/2364 lib entries, lock 150; Masters specifically 418/525
  (80%) persistent, 90 lock-gated. Full itemized results in `cardfx-sweep-audit.md`.
  Part 2 (curation + bot reader) — all four masters curated in `cardfx-curated.json`:
  Ashur Tablets (persistent, deliberately no modes/actGrant — its threshold mechanic
  stays unmodelled, see the still-open bullet below), Effective Management
  (`handler:'effective-management'` — see Part 3), Information Highway
  (`actGrant:{phase:'influence',amount:2,persist:'inplay'}`), The Parthenon
  (`actGrant:{phase:'master',amount:1,persist:'turn'}` + `lock:true`). Also backfilled
  `persistent`/`lock` onto the 4 pre-existing curated entries (Blood Doll/Vessel/Dreams
  of the Sphinx/Inside Dirt), closing that gap same-day. **Real finding while curating:**
  `actGrant` had always been read ENTRY-LEVEL by `_recomputePhaseActs()`, not per-mode as
  `elysium-cardfx-design.md` claimed since the field was created — the doc was
  aspirational and untested (zero curated entries used it until now), fixed to match the
  shipped reader. Bot-side: `_bestMasterFor` gained `persistent`/`curated` fields
  (separate from `known`); the MASTER play loop now branches on `persistent` — a
  non-persistent card resolves straight to the public ash heap (`_toAsh`) instead of
  parking on the board forever; new `_considerTurnActGrants(phaseKey)` +
  `decide('lock-actgrant')` read `persist:'turn'` — Parthenon's own decision is
  unconditional (genuinely no downside for this specific card, verified via a full
  2-turn live-integration test: lock → +1 master action → two masters played the same
  phase instead of one). Gift of Sleep's known lock-miss and the actGrant doc fix are
  both documented in `elysium-cardfx-design.md` / `cardfx-persistent-lock-design-decisions.md`.
  **Part 3 (14 July, same day): Effective Management's own EFFECT automated, not just
  its placement.** New entry-level curated `handler` string + a `CARD_HANDLERS`
  registry in `elysium-bot.js`, dispatched from the MASTER play loop after a card
  resolves — for bespoke, one-off effects too specific to earn a generic `fx` key
  (Johan's framing: an instruction to the bot, not vocabulary — same call as Ashur
  Tablets' threshold). Effective Management's handler sends the EXISTING `drawCrypt`
  wire verb (confirmed via the client's own zone model that "top of crypt" is a
  shuffled stack position, not a player choice, so no decide() was needed) — the SAME
  operation the bot's own paid Influence-phase vampire fetch already performs, just
  free. All four original Masters are now fully functional.
- ~~**Ashur Tablets' own threshold mechanism**~~ **SHIPPED 14 July 2026 (cardfx
  v1.4.2, bot v0.5.5, gate: cardfx 73/0→74/0, bot 159/0→175/0, 4× stable):**
  `handler:'ashur-tablets'` — at 3 own copies in play, removes them to `'burned'`
  (removed from the game), grants +3 pool, retrieves the highest-scored ash-heap
  card to hand (new `_ashScoreFor`: Master bonus + decklist-scarcity + hand-type-mix
  — a general v1 foundation per Johan's own call, persona tuning deferred to
  playtesting), bulk-returns the rest via `pileBulk{lib,shuffle}` (the bot's first
  use of that verb). Researched VTES strategy literature first (recursion is valued
  for table-adaptive flexibility, master retrieval is a named pattern) rather than
  inventing the scoring from scratch. **Still deliberately unbuilt:** removing OTHER
  Methuselahs' copies — `ctrl` is owner-gated, needs new protocol work, a separate
  larger conversation. Full story in `cardfx-persistent-lock-design-decisions.md` §11.
- ~~**Ashur Tablets' table-wide collateral watch (bot-vs-bot)**~~ **SHIPPED 14 July
  2026 (bot v0.5.6, gate: bot 175/0→186/0):** a human OR another bot crossing
  THEIR OWN threshold now correctly sweeps this bot's copies too (no benefit) —
  purely observational, no new wire verb (tracks each seat's `'burned'`-count
  over time via `this.table[seat].pub.cards`, data the server already relays).
  This session's first live test with TWO simultaneously-connected Bot instances.
  Full story, including a real design mistake caught by re-deriving the turn
  sequence on paper (not by testing) and a genuine mid-session environment
  outage that lost and required rebuilding the in-progress code, in
  `cardfx-persistent-lock-design-decisions.md` §12. **Still open:** a human-
  facing notification UI (client-side work in `elysium-vtes-bord.html`, a
  separate, larger task) and removing OTHER Methuselahs' copies specifically
  (needs a new protocol verb, `ctrl` is owner-gated) — both deliberately parked.
- **Four focused archetypes** (Johan, 12 July 2026): four playbooks that are genuinely DIFFERENT and pose different challenges — M2 defense (SHIPPED) widens the repertoire already; was parked until masters (v0.5) landed. **v0.5 (§7.6) SHIPPED 13 July 2026 — this is now UNBLOCKED.** **14 July 2026: `DEFAULT_DECK` swapped** from the sample "Weenie Bleed" (which had a real Obfuscate mismatch — see the 13 July journal entry) to Johan's real "Leveraging my Hacking Skills" (a simplified Weenie Computer Hacking archetype) — still the only shipped playbook, so "four distinct archetypes" remains open, but the current one is a genuine TWDA-lineage build rather than a placeholder. Its own analysis (14 July journal entry) found different gaps worth knowing before building the next three: Leverage needs an Edge precondition the bot doesn't check, and the bot's combat module doesn't read `fx.dodge` at all (this deck's entire combat suite) — both still open. (Ashur Tablets/Effective Management/Information Highway/The Parthenon are now all fully curated, wired, AND functional — see the entries above; only Ashur Tablets' cross-player removal and human-facing UI remain, both separate conversations.)
- **Authoring pipeline end goal** (Johan, 12 July 2026): a future model session creates/tests/evaluates bots and maintains cardfx tagging + bot rules autonomously from the living docs — see spec §7 for the piece-by-piece state table.

---
*Maintenance: when an item ships, mark it here + journal it. When the doc empties, retire it to the
archive like the fixes plan before it.*

