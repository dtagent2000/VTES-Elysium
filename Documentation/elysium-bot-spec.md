# Elysium Bot — Design Spec, Status & Roadmap (handoff document)

> **Written 11 July 2026 against client v2.6.21 / server v2.6.14 / bot v0.1.0; updated 12 July 2026 (the cardfx library v1 — see §5 card knowledge, §6 (h), §7). v0.2.0 SHIPPED 12 July 2026: §6 (a)–(i) implemented + the decide() seam — gate 33/0. v0.3.0 SHIPPED same day: personas + the insight hand-read + card plays (bleed actions, stealth vs Block!) — gate 39/0 ×3.**
> Purpose: a NEW chat session should be able to continue the bot work from THIS document
> plus the session ritual (read `elysium-session-journal.md`, `elysium-project-context.md`,
> `elysium-learnings.md` first — always). Everything here is verified against source, not
> memory. Companion docs: `elysium-bot-feasibility.md` (the original M0–M3 ladder + research
> sources), `ELYSIUM-PROTOCOL.md` (the wire truth; §12 is the bot contract),
> `elysium-duel-design.md` (the duel view D1), `elysium-cardfx-design.md` (the shared
> card-effect library — schema, tiers, extraction), `elysium-backlog.md` (live priorities).

---

## 1. Where we stand (snapshot)

| Artefact | Version | State |
|---|---|---|
| `elysium-bot.js` (Trainbot) | **0.5.7** | **14 July 2026 (v0.5.2→v0.5.7, gate 135/0→186/0):** the Masters tagging round (all four deck Masters curated + wired), `handler`/`CARD_HANDLERS` registry (Effective Management's drawCrypt, Ashur Tablets' threshold+scored-retrieval+pileBulk), `actGrant` both persist modes wired (Parthenon lock-for-bonus, Information Highway passive +2 influence), persistent-branching in the master play loop (non-persistent cards ash instead of parking), table-wide Ashur Tablets collateral watch (burned-count diff tracking), and a fundamental bounce-fix (`_commitBounce` sends a spec-correct L12.bleed re-announce + owner-vs-sender separation). Prior: v0.5.0→v0.5.2, stealth universalized + real deck as default (see §7.6-FOLLOWUP below). |
| `test-bot-logic.js` | **186/0** | Spawns a REAL server on a random port; full lobby→game→oust flow over loopback. Includes 2-bot live tests (Ashur Tablets cross-table collateral). |
| `cardfx-compile.js` + `elysium-cardfx.json` (+ `cardfx-curated.json`, `test-cardfx.js` **74/0**) | **v1.4.2** | The shared card-effect library: 2364 lib / 1785 crypt / 2422 aliases. v1.4.0: `persistent` (entry-level) + `lock` (per-mode) auto-tags. 8 curated entries (Blood Doll, Vessel, Dreams of the Sphinx, Inside Dirt, The Parthenon, Information Highway, Ashur Tablets, Effective Management). See `elysium-cardfx-design.md` + `cardfx-persistent-lock-design-decisions.md`. |
| Client | **v2.6.39** | Untouched this session |
| Server | **v2.6.16** | Untouched this session. **Johan's live server restart backlog remains.** |
| Wire constant | `WIRE_V='2.6.0'` | Sent as `v` in create/join; verMM(major.minor) match — SEPARATE from `BOT_VERSION` (learnings: never conflate) |

Johan's outstanding live-test letters live in the journal: **a–f** (Trainbot basics) and
**g–y** (the resolver/duel client features). The bot suite spawns its own server, so bot
tests are independent of his restart backlog.

## 2. The bot today (v0.3.10, exact capabilities — newest block first)

**v0.3.3 (12 July) — the RULES-COMPLIANCE layer (rulebook-verified, cardfx v1.2.0 tags):**

| Rule (rulebook wording paraphrased) | Status in the bot |
|---|---|
| Vampires are unique; "Non-unique" text opts out | ENFORCED tag-aware — influence never raises a name in play unless `unique:false` (the five true non-uniques may duplicate) |
| Unique library cards: one in play; a second contests | ENFORCED — `_mayPlay` blocks starting a unique card whose name is in play ANYWHERE (own board + all pubs, norm-compared); the bot never CREATES a contest; resolving one stays the table's call |
| Same-named action modifier / reaction: once per ACTION | ENFORCED for both modifiers (actor's `played` ledger) AND reactions (target's `pending.reacted` ledger, shipped with M2 13 July) |
| Same-named action card / any bleed / any political action: once per minion per TURN | STRUCTURAL — the engine gives each minion exactly one action per turn today; documented invariant for future unlock effects (Freak Drive class) |
| "(limited)": at most one bleed-increasing modifier per bleed; additional-strike sources capped | TAGGED in the library (75 lib + 9 crypt); the bot plays no +bleed modifiers yet, so the guard lands with that path |
| The Edge: a successful bleed gives it to the acting Methuselah | ENFORCED — set on a through-bleed (pub push), yielded on a RISING opponent claim (a stale pub still carrying edge never strips a fresh win — v0.3.4), when a bleed lands on the bot, and on oust (the Edge leaves play with its holder) |

**v0.3.9–0.3.10 (12 July, the second live-test batch — Johan):** the bot rings the table's
EXISTING **Reaction timer** — `{t:'decide'}` — after 5 s of an unanswered ask; the server
broadcasts who + the room's `reactSecs` (default 5 s) and every client shows the countdown
with the caller's name above it. The bot's OWN patient window is untouched: askSecs (default
25 s) still decides — the stopwatch prompts, the ask resolves. Stood down the moment anyone
answers; re-armed on a withdrawn block. A **withdrawn block** (tally mode:null with no
verdict line — the client's ×-cancel) un-contests the ask and restarts the window fresh: a
misclicked Block costs the table nothing. (v0.3.9 briefly spoke an invented frozen ⏱ log
line rendered by a duplicate client chip — superseded the same day by the decide call.)

**v0.3.8 (12 July, the audit round on v0.3.7 itself):** repeated 'Block!' under live
resolvers now REFRESHES the verdict-wait every time (the !contested guard fell through to
instant combat on the second shout); the ask timeout reverts to a plain 'no' (post-stealth
silence = a conceded block in classic; a full silent window under resolvers = nobody pursued
it — the verdict line and the prey's Pass remain the real resolvers); a **PUBLIC ASH HEAP** —
discards and resolved action cards land in pub zone 'ash', so the host's "View their ash
heap" shows real history; the token bucket widens its margin (refill 150 ms: 74.7 of the
server's 80/10 s worst-case incl. burst + the unqueued join handshake).

**v0.3.7 (12 July, the LIVE-TEST round — Johan's table notes):** with resolvers live
(`caps.tally`), a spoken **'Block!' opens the REFERENDUM** — the bot awaits the §12 verdict
line instead of assuming the block lands (ask-timeout while contested falls back to combat,
the classic-table meaning); **fxClone emissions** — card plays and bleeds now ANIMATE for the
humans (the client's fx shape, verb ≤40 chars); the **DISCARD phase** (one per turn: masters
until v0.5 + cards no ready vampire can use, draw back after); **crypt fetch at the rulebook
price** — 4 transfers + 1 pool moves a crypt card to uncontrolled (replaces the free classic
branch; fires when uniqueness blocks every uncontrolled candidate too); **human pacing
defaults** paceMs 2000 / thinkMs 1600 with react-delay scaling to the table's pace;
`forceSetPool` handler consolidated (a pre-existing v0.1 handler was silently shadowing the
new one — object literals keep the LAST duplicate key) and enhanced: clamp + oust-on-zero.
**The pacer is now a TOKEN BUCKET** (burst 8, refill 1/140 ms ≈ 7.1 msg/s sustained): the old
rolling-window cap let two fast turns fill the window and then stalled critical says for
seconds — the bucket bounds latency instead of budget-cliffing. Masters in the master phase =
v0.4; reactions in opponents' turns = M2 (both confirmed on the ladder).

**v0.3.5–0.3.6 (12 July, arena enablers + first arena findings):** `create` option (the bot
can HOST a room — the arena's seat-1 pattern), `startPool` (fast-match knob, default 30),
telemetry on the existing onEvent channel ('bot:'-prefixed: decide/dealt/through/blocked/
took-bleed/ousted — the evaluation DATA LAYER); **the ghost-prey rule** — an ask whose prey
is OUT resolves as 'no' immediately (at open, and mid-ask via the roster hook): an ousted
prey never arms and never Passes, so end-game turns used to drag askSecs × actors (the
arena's first catch, trace-diagnosed); `_drain` hardening (the reschedule survives any
throw — one bad frame never stops the queue).

Correction on record: Anarch Convert is UNIQUE (its extra copies are removed-from-game
fodder for its ability) — an earlier session claim said otherwise; the card data decided.

**v0.3.2 (12 July):** crypt UNIQUENESS — influence never raises a second copy of a name
already in play (ready or torpor); playbook duplicates remain draw redundancy. Cross-player
contests stay the table's call (sandbox).

**v0.3.1 (12 July, pre-live-test hardening):** the message dispatch is exception-guarded —
one bad message logs and moves on instead of killing the process (the launcher seats a whole
table of bots in ONE process). Pool-target parsing verified against the real client's §12
emission (`setRTarget name:'pool'` → `Target: WHO's pool.`).

**New in v0.3.0 (gate-proven, 39/0 ×3):** named personas (`--persona novice|grinder|shark` —
aggression / blockShy / insight knobs; a persona is HOW the same facts are weighed);
**the insight hand-read** per §7 (categories bounce/stealth/intercept/votes from cardfx fx
tags; observations from face-up `fx` play clones AND pub-diff threats; `readP(seat, cat)` =
min(0.9, (0.15 + 0.25·seen) · handScale)); **decide() v2** — real scoring: plain bleed vs a
bleed-ACTION card from hand (Computer Hacking → bleeds for 2, §12 frozen line at the chosen
amount, drawn back after resolution), and `spend-stealth` (aggression × (1 − insight ×
P(intercept)) ≥ 0.5) when a say-'Block!' meets the bot's action — the stealth card is played
(logged, hand spent, drawn back), the ask stays OPEN and the table's §12 Block line / prey
pass settles it; the chat grammar's 'block' stays a BLUNT always-combat channel by design;
actor-side 'block fails' un-contests and restarts the ask clock; **queue-coalesced push** —
push() drops an order-preserving placeholder into the paced queue and materializes the
LATEST pub at drain time (bursts collapse to one wire push, causal order holds; a timer
debounce was tried and REVERTED — it reorders chat-vs-board and springs cursor traps).

### v0.2.0 (all still true)

**New in v0.2.0 (all gate-proven, 33/0):** the pending-bleed machine (announce ≠ resolve;
apply ONLY on the acting seat's 'It resolves'; +X reopens; block-success aborts; re-announce
supersedes; turn-change discards stale with a polite note); §12 line parsing (bleed/add/
block/vote/combat regexes over the stripped `log` relay); the symmetric reaction window
('Hold on…' while thinking → 'Pass'; as actor its Block? ask is answered by chat AND say
phrases AND a live §12 Block-resolve line — 'Hold on…' pauses its clock per thinker); §12
frozen-line announces on the `log` verb; a table model (per-seat pubs, seat-scoped seen-sets,
threat reads via cardfx); READ-ONLY tally mirror + capability detection by observation
(classic join → ONE polite tip); the cardfx three-tier name ladder (exact → lowercase alias
→ client-identical norm()); crypt caps from the library (playbook `cap` = override); the
seat-anchored L4 camp (pool-token export + camp-relative slots, classic only); the decide()
seam with persona knobs (socket in v0.2, brain in v0.3); a paced outbound queue (the server
hard-closes >80 msgs/10 s — a disconnected bot is a dead seat).

### v0.1.0 baseline (all still true)

Zero-dep headless RFC6455 client mirroring the server's `wsAttach` (always masks, pongs
pings). Flow: `join` (WIRE_V) → `deck {name, qty}` → auto seat-pick → `dealt` → pub
baseline honouring the `sanitizePub` contract (canonical 1004×616 board; uncontrolled
face-down cards are name-stripped). Turn engine: Unlock → Master (skip) → Minion (bleed +
a "Block?" chat question with `--ask-secs` timeout) → Influence (real opening stagger,
min(4, seat); cap-annotated playbook drives crypt choices) → Discard (skip) → pass.

**Chat grammar (the sandbox contract):** incoming actions have no structured event in
v0.1, so the table types: `bleed N` / `vote N` (bot self-applies pool damage + pushes;
pool ≤ 0 → `{t:'bounty'}` routes +6/+1 to its predator), `block`/`no` (answers to the
bot's own questions), `rush …` → politely declined (M2), `help`. The bot's announces
always state the mechanical fact.

**CLI:** `node elysium-bot.js --server ws://127.0.0.1:8123 --room Fangs --pass secret
--name Trainbot [--seat 2] [--deck my-playbook.json] [--ask-secs 25]`. Playbook JSON:
`{ name, crypt:[{name,qty,cap}], library:[{name,qty}] }`. A SAMPLE deck is embedded
(Anarch Convert / Lisa Noble / Zip + Computer Hacking library).

## 3. History — what each version added FOR THE BOT (recap + where to read more)

Full narrative per entry in `elysium-session-journal.md` (same-named sections):

- **v2.6.16 / srv-2.6.11 — the tally verb + Bleed X.** Bleed became a 1/2/3/X… submenu
  whose amount rides the `log` relay (`NAME bleeds for N.`) and the fx `verb` free-text
  (clones show it; ≤40 chars, now load-bearing). New bidirectional `tally` verb: shared
  Block/Vote/Combat counters, whole-state absolute values, last-write-wins, any seat
  adjusts, room-stored (join-reply replay), cleared on start. Protocol counts 47 s2c / 52 c2s.
- **v2.6.17 / srv-2.6.12 — resolve semantics.** `tally.ph` (combat phase 0–6, the
  rulebook's seven steps), transient `tally.res` (every client closes its own card-play
  batch + applies its own local clear/discard Setting), ⇄ Pass button riding `say`, and a
  bug fix the bot cares about: the say RECEIVER now honours 'It resolves' (it was
  sender-side only — remote batches never closed).
- **v2.6.18 / srv-2.6.13 — rule-correct Block + the frozen contract.** Block resolves no
  longer close the batch (action continues / becomes combat) and carry no `res`; combat
  round counter `tally.rd`; `+X bleed…` announces post-announce modifiers with a
  batch-scoped running total (`NAME adds +X bleed (= T).`); **PROTOCOL §12 froze the
  machine-readable line formats — that section IS the bot's parsing contract.**
- **v2.6.19 / srv-2.6.14 — the duel view D1.** Combatants announced via tally
  `duelCid`/`duelName`, SERVER-MERGED per seat into a `duel` map (survives counter pushes,
  drops on combat exit, join-reply replay). Reference client shows both combatants in the
  Played peek; own side manageable, opponent's read-only from pubs.
- **v2.6.20 — audit fixes.** Card ids are per-client sequential (`'c'+seq`) → cross-seat
  cid lookups MUST be seat-scoped (learnings entry; the duel view was fixed). TDZ move of
  resolver state next to `conv`.

Research sources (from `elysium-bot-feasibility.md`): Paul Johnson's PLAY-TEST pdf, the
Succubus Club Trainbot, Codex of the Damned strategy articles, VTES ONE archetypes, TWDA
at `https://static.krcg.org/data/twda.json`. Card data: `api.krcg.org` / vtes.json.

## 4. The data diet — everything machine-readable on the wire today

1. **`log` relay** `{t:'log', who, html}` — strip tags, then match the §12 frozen lines:
   - `NAME bleeds for N.` (optional ` Target: …` suffix)
   - `NAME adds +X bleed (= T).` — T is the batch-scoped running total
   - `Block: Stealth A vs Intercept B — block succeeds.` / `… fails.` (succeeds when B ≥ A)
   - `Vote: A for vs B against — vote passes.` / `… fails.` (passes when A > B)
   - `Combat: A vs B damage dealt.`
   Wording/punctuation/em-dash are load-bearing; changes require a §12 version note.
2. **`tally` broadcast** `{mode, a, b, ph, rd, duel?, res?, who}` — live counter state.
   `mode` block/vote/combat/null; `ph` 0–6; `rd` 1–99; `duel` map seat→{cid,name,who}
   (combat only); `res` transient resolve flag. The bot can read a LIVE Block referendum:
   stealth (a) climbing vs intercept (b) — an informed "Block?" answer, not a threshold.
3. **`say` broadcast** `{i, seat, who}` — SAY = `['Hold on…','No block','Block!','No
   reaction','It resolves','Yes','No','Pass']` (string-check, never hardcode indices; the
   client itself string-checks for reorder safety). **'It resolves' (currently i=4) is the
   resolution signal.**
4. **`board` pubs** — per sanitizePub: pool, edge, counts{hand,library,crypt}, clan,
   target{seat,cid}, and per card: id, name (face-down stripped), kind, zone, locked,
   faceDown, blood/blue/green, counters[], attached[], host, actSt, _avSeq, path, sup.
   v0.1 only reads its OWN baseline; v0.2 tracks everyone's.
5. **`turn`** `{seat}` — whose turn; `decide` — reaction windows; `sys`/`err`; `roster`.

## 5. THE critical rule: announce ≠ resolve (bot v0.2's core state machine)

The bleed lines fire at ANNOUNCE. Pool damage happens at RESOLUTION. A successful block or
a Deflection means the bleed never lands (or lands elsewhere). **The bot must NEVER
auto-apply pool damage on the `bleeds for N` line.** Correct machine:

```
on log "P bleeds for N" where P == my predator's card/actor
    → pending = N (update on "adds +X bleed (= T)": pending = T)
on say 'It resolves' from the acting seat  → apply pending to my pool, push, clear
on say 'Block!' / log 'Block: … — block succeeds.'          → clear pending
on log 'Block: … — block fails.'                            → keep pending (action continues)
  ▸ v0.2 IMPLEMENTATION REFINEMENT: say-'Block!' marks the pending CONTESTED
    instead of clearing — a cleared pending would silently eat a
    failed-block-then-'It resolves' bleed. A contested pending never
    auto-applies: 'block succeeds' clears it, 'block fails' un-contests it,
    and 'It resolves' while still contested asks the table via chat instead
    (the grammar stays the safety valve).
on a NEW "bleeds for" line from the same actor (same action) → SUPERSEDE pending (this IS the
                                                               deflection signal -- the bot never
                                                               needs a bounce-card name list)
on tally res / batch-close signals without a landed bleed    → clear pending
```

**Johan-confirmed semantics (11 July):** a bleed action is not done until both parties
feel done — both have passed in sequence. So every `adds +X bleed (= T)` RE-OPENS the
reaction window: the bot must reconsider (react / announce block / Pass) after each
modifier, not just after the base announce. The ⇄ Pass phrase is the human's
"no more reactions" signal. **Pool-globe targeting (BUILT, client v2.6.21):**
the existing pub `target {seat, cid}` gains the sentinel cid `'pool'` — targeting a
PLAYER's pool globe the same way minions are targeted (zero server change: `'pool'`
survives sanitizePub's cleanCard+truthy check; card ids are `'c'+seq` so the sentinel
can never collide). The bleed line's suffix then names the PLAYER. Bot arming rule
becomes: `(target is my name via pool-target) OR (no target AND actor is my predator)`
— default without target stays Prey. Client v2.6.23: a USED pool aim auto-clears when its
action resolves (Johan's call), so stale-target mis-arms cannot happen across actions. Deflection flow: the defender's card is visible in
the Played flow; the acting player re-announces `Bleed N` with a new target — ONE pending
bleed per actor, the latest announce supersedes, so the bot un-arms the moment the
re-target names someone else.

The chat grammar (`bleed N`) stays as the manual fallback — it is the table's override.

**Table configuration (Johan + assistant, 12 July 2026 — chain verified in source):** the bot
has NO eyes — L2/L3/L4 are per-client rendering and never touch the wire (humans at one table
can sit in different views), so nothing view-specific exists to build. The real axis is
**helpers on vs off**: `syncOffTournament()` defaults tournament by board style (Classic → ON,
Structured → OFF) and the lobby hard-sets `conv.tournament=true` for Classic — and tournament
kills the three resolvers via `hx()`, i.e. exactly the tally referendum, the §12
Block:/Vote:/Combat: resolve lines and the duel map that make v0.2 blocks INFORMED. What
survives everywhere (verified non-gated menu paths): the `bleeds for N` / `adds +X bleed (= T)`
lines, the fx verb clones, the say phrases (⇄ Pass is deliberately always-on), the chat grammar,
and the bot's own turns (Classic's no-opening-deal already handled via drawCrypt since v0.1).
**Policy: supported config = Structured, tournament off, resolvers on** (the same idioms
Structured II teaches the humans). The bot never hard-locks — capability detection by
OBSERVATION: tally traffic present → informed mode; silent → PJ-threshold personality blocks;
`boardMode==='classic'` in the join reply → ONE polite chat line recommending the supported
config. One build, a degradation ladder — Classic seat-filler fidelity comes free.
**Spatial citizenship (same date, verified):** in Structured the canonical 1004×616 pub IS the
bot's own board — its GEO grid renders inside its own mat's zone bands, no human cooperation
needed. In L4 three facts: (1) humans CANNOT place the bot's globe — opponent globes are
read-only; the position is owner-authoritative via the pub's `{type:'pool',x,y}` token
(`updateL4Opponents` reads it), and with NO token (bot today) the globe keeps
`renderL4Globes`' default seat-angle circle around table centre; (2) opponent CARDS render at
raw pub coordinates on the shared felt (`renderL4OppCards` → `pubXform(c.x,c.y)`) — the bot's
fixed grid squats on the left band regardless of its globe, and FOUR bots would stack on
identical coordinates; (3) the fix is bot-side only (~20 lines, zero wire/client/server
change): a **seat-anchored camp** — per-seat home anchor (the globe circle's angle math,
pushed toward the rim), export the pool token there, offset the GEO grid around it (ready
above the globe, uncontrolled below). Implementation check before shipping: confirm
`buildMat` ignores `type:'pool'` tokens (the `TOKEN_DEFS` guard) so the unconditional export
is a no-op on Structured mats.

**The reaction-window grammar (Johan-confirmed, 11 July):** the ever-present quick phrases
'Hold on…' and 'Pass' (plus 'No block' / 'No reaction' / 'Block!' / 'It resolves') form a
SYMMETRIC protocol over the existing `say` broadcasts — zero new wire, and the bot speaks
the table's own language in both directions:

- *Bot as actor:* announce (a §12 line via the `log` verb — the bot EMITS frozen lines,
  not only parses them) → wait. 'Hold on…' from anyone PAUSES the ask-timeout (they are
  thinking / playing reactions); 'Block!' → block flow; 'No block' / 'No reaction' /
  'Pass' from the target closes the window → the bot says 'It resolves' and proceeds;
  ask-secs timeout is the polite fallback.
- *Bot as target:* pending bleed armed per the target rule → the bot answers 'Hold on…'
  while deciding (M2: an informed block via the live tally), else 'Pass'. Every
  `adds +X bleed` REOPENS the window → a fresh 'Pass' is required. Apply on the actor's
  'It resolves'; a re-announce supersedes.

**Division of labor (Johan-confirmed, matches the historical systems):** the bot READS
the tally and ANNOUNCES its own contributions in text; HUMANS are the hands on the shared
counters. Paul Johnson's PLAY-TEST and the Succubus Club Trainbot both split work exactly
this way — the system decides, the human executes the bookkeeping — modernised here by the
pub system (the bot does execute its OWN board). The bot never writes `tally` in v0.2;
letting it tick its own stealth contributions later is gated on the parked
deltas-instead-of-whole-state fix (a writing bot would worsen last-write-wins collisions).

**Card knowledge — the shared cardfx library (Johan's decision, 12 July 2026; supersedes
the earlier own-deck-only scope):** card FACTS live in ONE compiled library,
`elysium-cardfx.json` (from `cardfx-compile.js` over KRCG's vtes.json + the hand-verified
`cardfx-curated.json` overlay — schema/tiers/limits in `elysium-cardfx-design.md`; gate
`test-cardfx.js`, 39/0). Policy (WHEN to play) stays in playbooks — that split is what lets
4 bots with different decks/personalities share one library. What it buys beyond the wire:
the frozen lines carry bleed amounts, but a non-bleed threat (Inside Dirt, superior Shroud
of Decay) only shows as a card NAME in pubs/fx — the name→fx lookup turns that into 'this
burns 3 pool if it resolves', i.e. a correctly weighed block. The bot still never parses
rules text at runtime (the compiler did, offline); bounce still needs no recognition (the
re-announce IS the signal). Crypt caps/disciplines/titles come structured from the library,
so playbook `cap` annotations become optional overrides. Consumers MUST ignore unknown fx
keys (curated entries carry richer vocabulary early).

## 6. HISTORICAL — the original v0.2 build spec (SHIPPED 12 July; kept for design rationale)

> **SHIPPED 12 July 2026 (v0.2.0, gate 33/0).** Items (a)–(i) below are implemented as specified,
> with the §5 'Block!'-contested refinement and the outbound pacer noted in §2.

Scope (in order): **(a)** the pending-bleed state machine above; **(b)** parse the §12
resolve lines; **(c)** the reaction-window grammar — listen AND speak 'Hold on…'/'Pass'
(pause its ask-timeout on 'Hold on…', emit its own window signals); **(d)** subscribe to
`tally` READ-ONLY — answer its own "Block?" question informed when a Block referendum is
live (compare shown stealth vs its own intercept capability); never write tally; when NO
tally traffic exists (Classic auto-runs tournament → resolvers off), degrade to
personality-threshold blocks per the table-configuration note in §5;
**(e)** track ALL seats' pubs (pool, ready minions, locked state) into a table model;
**(f)** emit its announces as §12 frozen lines via the `log` verb; **(g)** keep the chat
grammar as fallback/override; **(h)** load `elysium-cardfx.json` via the THREE-TIER name ladder (exact → lowercase alias →
a load-time norm index using the client-identical `norm()` — pub names are RAW deck-list text,
`parseDeck` never canonicalizes; see the design doc's norm-tier note) for own-hand fx, crypt caps and opponent threat reads — per-playbook fx tags are
OUT (superseded by the library); a playbook MAY still override per name; **(i)** L4
citizenship (small, optional): the seat-anchored camp + pool-token export per §5's spatial
note — cosmetic in the degraded tier, but mandatory the day two bots share a Classic table. NON-goals for v0.2: combat module
(M2), duel participation (announcing `duelCid` belongs with M2 defense), vote strategy.

Test plan (DONE 12 July 2026 — 33/0, sections 5b–5e + 8–9): extend `test-bot-logic.js` — feed frozen lines over the real wire, assert
pool applies ONLY after 'It resolves', aborts on Block-success, updates on +X; a live
tally block-referendum answered. Suite must stay green on the 17 existing tests.

## 7. Plan forward (the ladder, updated)

### The `insight` knob — hand READS, never hand KNOWLEDGE (Johan, 12 July 2026) — **SHIPPED in v0.3.0** (read model v1 as below; TWDA priors remain future)

Hands never travel the wire: `sanitizePub` relays only `counts.hand` (a number) and even
strips the deck NAME from opponents. Literal hand knowledge would need a privileged
bot-only server channel — architectural cheating, and intermittently-psychic play is
exactly what humans detect and resent in game AI. Johan's 0–100% difficulty dial is
therefore reframed from *probability of using secret info* to **quality of an honest
read** — which is also what human intuition actually is.

**The read model (v0.3):** from the LEGAL observation surface — face-up crypt (clans +
disciplines via cardfx), every played card (v0.2's table model / threat memo), hand and
pile counts, §12 behavior (a `+2 bleed` modifier just PROVED Conditioning-class
capability; a seen Deflection says "this deck runs bounce") — infer a probability
distribution over the hand-content CATEGORIES that steer decisions: bounce, wake/
intercept, stealth, damage-prevention, vote push. cardfx's fx tags ARE those categories.
Priors from disciplines on the board, posteriors boosted by observed plays, scaled by
current hand size. **`persona.insight` (0.0–1.0) scales how much decide() weights the
inferred distribution vs the v0.2 base behavior** — Novice 0.1, Grinder 0.5, Shark 0.9.
A consistently-scaled read produces believable skill tiers; an X%-omniscience coin flip
produces rubber-band AI. Long-horizon add-on: TWDA archetype priors sharpen the read
(§7's existing inference note).

**If literal open information is ever wanted** (training/debug tables): the clean route
is a SYMMETRIC opt-in room policy — "open hands" relayed to *everyone*, bot included —
never a bot-only backdoor. Explicitly out of scope for normal play.

### The authoring pipeline — Johan's end goal (12 July 2026)

**A future model session should be able to CREATE new bots, TEST and EVALUATE them, and
maintain both the shared library (cardfx tagging + terminology) and each bot's own rules —
autonomously, from the living docs.** The pieces and their state:

| Piece | State |
|---|---|
| Author playbooks + personas | READY — `deck` JSON + `PERSONAS`/`persona` knobs; conventions in §2/§5 |
| Extend cardfx vocabulary + curated tier | READY — `cardfx-compile.js` + `cardfx-curated.json`; fx vocabulary in the design doc §3; gate `test-cardfx.js` guards drift |
| Adjust bot rules | READY — this spec + the frozen §12 contract + `test-bot-logic.js` (39/0) as the regression net |
| **Evaluate bots against each other** | **SHIPPED 12 July 2026** — `elysium-bot-arena.js` v1.0.0: headless match runner (module `runArena()` + CLI), bot #1 CREATES the room and starts (host-token pattern), persona rotation per match for seat fairness, plays to last-standing with turn-cap/wall-timeout backstops, per-persona wins/damage/decisions summary, and the JSONL TRACE layer (every decide() with its why, through/blocked/took-bleed, dealt hands for reproducibility, the match result). Gated inside `test-bot-logic.js` (section 12). Day-one earnings: the traces diagnosed the ghost-prey drag (v0.3.6) within minutes. |

Everything must stay navigable from the living docs + deterministic gates — that IS the
pipeline; no hidden state, no human-only steps.

**Companion tooling (12 July):** `elysium-bot-table.js` v1.0.0 seats N bots (persona
rotation, staggered joins, one process) into an existing lobby — the live-test workhorse and
the arena's seating half. `START-HERE-BOTS.html` is the player-facing guide (quick start,
personas, table config, chat grammar, the live-test checklist).

1. **Johan's live tests** (a–f bot, g–y client) — the proof that beats every gate.
2. **Bot v0.2** (§6) — client v2.6.20 wire is sufficient; NO new verbs needed.
3. **Cardfx curation passes** (alongside v0.2): TWDA-frequency top slice + every card in
   a shipped playbook gets hand-tier entries (`elysium-cardfx-design.md` §8).
4. **Playbook pass (M1 completion) — split status.** **Johan's stated goal (12 July): FOUR
   distinct, well-playing bots to fill a 5-seat table** — different decks AND temperaments;
   personality knobs (aggression, block willingness, bleed sizing — the PJ dials) live in
   playbooks and read library facts, never live in the library. **This was originally
   bundled with masters + a hunt action under one informal "v0.4/v0.5" label; the two halves
   have now split: masters + hunt (the long-game-arc remedy) SHIPPED 13 July 2026 as §7.6
   (bot v0.5.0, gate 119/0) — the four-distinct-archetypes half is UNBLOCKED but NOT
   started.** The only shipped playbook remains the sample "Weenie Bleed" deck
   (`DEFAULT_DECK`); worth knowing before authoring the next three that it has a real
   discipline mismatch — its 12-vampire crypt carries zero Obfuscate, yet ~half the 60-card
   library (Cloak the Gathering/Lost in Crowds/Swallowed by the Night/Spying Mission, 28
   cards) is Obfuscate-gated and so permanently unplayable fodder for this specific crypt
   (found while listing the deck for Johan, 13 July). A second stealth-weenie was
   considered and rejected as too similar — the next archetypes should differ in
   temperament AND mechanical shape.

   **Numbering note (13 July): this playbook/archetype pass, plus masters + a hunt action
   (the long-game-arc remedy), is what "v0.4" informally meant before M2 claimed that
   number — it is now v0.5.0 going forward, wherever referenced. §7.6 (masters/hunt half)
   SHIPPED — see above.**
5. ~~**M2 defense**~~ **SHIPPED 13 July 2026** (bot v0.4.0 → v0.4.1) — full detail in §7.5:
   informed block-as-target, intercept/wake/Deflection reactions with a once-per-action
   ledger, combat module v1 (data-driven, one round, announce-only). Rush responses and
   full multi-round combat/press remain out of scope (v1 cut lines, unchanged).
6. **Parallel, client-side**: the tutorials/README sweep (discoverability is the top UX
   risk — includes the "Bleed N then +X per modifier" idiom); Johan's open question on
   damage counters × rounds (cumulative vs auto-zero on round wrap — one-liner either way);
   the parked micro-fixes (tally deltas vs lost updates, Bleed X strict input, spectator
   button disable).
7. **M3 (non-goal, unchanged)**: full rules enforcement — Elysium stays a sandbox.

## 7.5 M2 — THE DEFENSE PASS — SHIPPED 13 July 2026 (bot v0.4.0, gate 62/0)

Implemented same-session as designed below (kept for the design rationale + what v1
deliberately cuts). **Two rules corrections made DURING implementation, source-verified
against real card text (not memory) after the first attempt got it wrong:**

- **Bounce target:** the rulebook's actual wording is "change the target of the bleed to
  ANOTHER METHUSELAH OTHER THAN THE ACTING MINION'S CONTROLLER" — any legal seat, chosen
  by the defender. My first pass mis-remembered this as "the actor's own prey" (which
  in a 2-seat table degenerates to bouncing onto the actor — nonsensical). v1 now targets
  **the DEFENDER's (the bot's) own prey** — the documented conventional choice ("pass the
  bleed downstream"), via the already-existing `preySeat()`. Full free-choice-of-any-seat
  is a future enhancement, not v1.
- **The duel wire field:** `tally.duelCid`/`duelName` are INPUT fields the sender sets;
  the BROADCAST carries the server-merged result under `tally.duel[seat]` instead — and
  critically, the server **only merges `duel` when `mode==='combat'`**. A block-mode
  duel announcement (my first instinct, to show "who's blocking") is silently dropped
  server-side — confirmed by reading the server handler before writing bot code, not after.
  M2 does not attempt a block-side duel display; the human-readable chat/log narration
  already carries "who's blocking."

**v0.4.2 (13 July, silent-fix round — journaled retroactively, see the learnings entry on
the ritual breach):** five hardening fixes shipped with code comments but NO doc sweep:
(1) combat's `_writeTally` zeroes a/b explicitly — the block referendum's stale stealth/
intercept numbers were masquerading as damage counters in every client's resolver (visible
in our own 14c debug dump: `mode:'combat', b:2`); (2) the wake is only SPENT when a locked
sleeper actually exists and can pay — the old shape burned the card into thin air;
(3) bounce re-anchors its hand index BY NAME after the think delay — the idx was computed
before the pause and the hand may shift under it; (4) bounce requires a ready UNLOCKED
minion (rulebook — the wake exception never routed to the bounce path); (5) the ousted
stay quiet on vote-abstain.

**v0.4.3 (13 July, the audit round on M2 itself — "är du osäker på något?"):** two real
gaps found by auditing, both proven with isolated tests before fixing: (A) **RULEBOOK:
"If a block attempt is successful, then the blocking minion LOCKS and enters combat"** —
the target-side success path fought combat and left the blocker READY (a free block, turn
after turn); now locks at the verdict-success hand-off (the wake path arrives already
locked — idempotent). (B) **decision/execution drift, same class as the interceptPotential
ledger bug:** the decision sums capability across ALL vampires, but execution picked the
FIRST unlocked one — proven: with a wrong-disc vampire first in board order (Zip) and an
aus-gated intercept only Abderrahim could use, icp said 2 and the pick said Zip → bare
unbacked block. New `_pickBlocker()` chooses the unlocked vampire whose best USABLE
intercept is highest (ties/no-cards → board order), unit-tested offline in the suite.
Gate 62/0 → **65/0** (lock-on-success assert + two _pickBlocker units).

**Accepted v1 simplifications (documented, not bugs):** (i) after a FAILED block verdict
the react window reopens and may offer bounce — the real game's "after blocks are
declined" timing nuance around failed attempts is deeper than v1 models (the sandbox
table referees). (ii) CORRECTION (13 July, re-verified against the rulebook while answering
Johan's follow-up): torpor-at-0-blood from NORMAL combat damage is actually RULES-CORRECT,
not a simplification — a vampire burns blood 1-for-1 to heal normal damage and goes to
torpor once it runs dry, exactly what M2 does. Burning outright is specifically an
AGGRAVATED-damage mechanic against an ALREADY-WOUNDED vampire (a vampire mid-way to torpor
takes further agg damage it cannot pay in blood) — M2's v1 combat never distinguishes
aggravated from normal strikes at all, so no vampire can ever burn under it. That is a
genuinely MISSING mechanic (aggravated damage), not an approximation of an existing one —
belongs with a future combat-v2 pass, not v0.5.

**v0.4.1 (13 July, Johan's own catch): a THIRD correction, found by Johan testing the
first, not by me.** Bounce needs "another Methuselah OTHER THAN the acting minion's
controller" — and the rulebook is explicit elsewhere too: **"You can never bleed
yourself."** In a 2-LIVE-player table (or any time a Methuselah's own prey happens to BE
their predator — the same collapse), the only theoretical bounce destination is either
the actor (illegal by the card text) or the defender's own self (illegal outright) —
there is NO legal destination at all, and v0.4.0 had no guard for this: it would have
computed "my own prey" as the target and happily announced a redirect straight back onto
the Methuselah already bleeding it. Fixed: `_reactWindow` now checks
`this.preySeat() !== actorSeat` before ever offering bounce as an option; when a
2-live-player table collapses predator and prey onto the same seat, bounce is correctly
WITHHELD, falling through to the normal informed-block decision instead. A second,
adjacent gap surfaced while testing the fix: `interceptPotential()` (which feeds the
block-as-target DECISION) didn't respect the once-per-action reaction ledger the
EXECUTION side already enforced — so with two copies of the same named card in hand, the
decision kept "seeing" the second copy as available after the first was spent, committing
to a second, unbacked bare block that never resolves. Now ledger-aware
(`interceptPotential(p.reacted)`), matching what `_commitBlock` actually does.

**What v1 ships (all four steps A–D):**
- **A — informed block-as-target:** reads live `tally.a` (announced stealth) when a
  resolver is open, else assumes moderate risk (0.75); `interceptPotential()` now returns
  the BEST single immediately-available card (not an optimistic sum — only one gets played
  per attempt anyway). Formula: `score = (odds × urgency) ÷ persona.blockShy`, block when
  `score >= 1`. **`blockShy` finally does something** — vestigial since v0.1 (novice 1.3 =
  most reluctant, shark 0.8 = least, grinder 1.0 = baseline).
- **B — reactions:** intercept cards (`_bestInterceptFor`, mirrors `_bestStealthFor`'s
  exact shape), wake cards for a locked reactor (`_wakeCard`, e.g. On the Qui Vive —
  cost-free, disc-free, "may block as though untapped"), Deflection-class bounce
  (`_bestBounceFor`/`_commitBounce`, corrected target per above). The once-per-ACTION
  reaction ledger (`pending.reacted`, a `Set`) is now ENFORCED (spec §2's rules table row
  flips from "arrives with M2" to shipped). Bounce is preferred outright over a contested
  block when available (cheap, decisive, no risk — no persona gating needed).
- **C — combat module v1:** triggers when a block succeeds with the bot as EITHER side
  (target-side hand-off via `pending.blockerVamp`, remembered before `_clearPending` wipes
  it; actor-side replaces the old hardcoded "hands for 1 each" stub). Announces the duel
  (now correctly combat-only), picks a data-driven strike (`_bestStrikeFor`, defaults to
  hands/1) and an optional prevent (`_bestPreventFor`), applies damage to the bot's OWN
  vampire (torpor at 0 blood), and tells the human what to apply to THEIRS — the same
  sandbox convention bleeds already use. **v1 cut line (deliberate, unchanged from the
  design):** one round only, no press-seeking, never steps the shared `ph`/`rd` counters,
  does not model the opponent's own strike choice.
- **D — riders:** vote-table courtesy (abstain once per referendum, ~6 lines as scoped);
  the reaction ledger; PROTOCOL needed no new frozen-line additions (M2's new lines are
  bot-authored free text mirroring how a human would narrate a play, exactly like the
  existing "plays X: +N stealth" line — not a new machine-parseable contract, so the
  canary needed no changes either).

**Test plan, as shipped (suite section 14, real network + direct hand/board mutation for
determinism — the server shuffles decks, so a multi-card deck can't be trusted to deal
specific cards; poking `bot.hand`/`bot.board` directly after 'dealt' is the same pattern
"offline rules units" already use, just on a live connected instance):** bounce preferred
over a contested block + pool untouched; informed block commits + writes `tally.b` (never
`a`) + the ledger blocks a repeat; a successful verdict hands off to combat with real
strike/damage numbers; a locked reactor wakes then blocks. 6 new assertions, all passing.

**Open questions from the design, now answered by what shipped:** (1) combat stays
announce-only, v1 never steps `ph`/`rd` — confirmed as designed; (2) bounce is log/chat
narration only (no pool-sentinel aim — simplicity over a nice-to-have); (3) block-happiness
comes entirely from the EXISTING `blockShy` trait, no new tunable needed.

---

## 7.5-DESIGN — the original work order (kept for rationale; see the SHIPPED summary above)

**Entry state (12 July 2026):** client v2.6.31 / server v2.6.15 (pristine) / bot v0.3.10 /
cardfx v1.2.0 (fxv 1). Gates: bot 55/0, cardfx 45/0, client-logic 29/0, protocol 6/0,
dispatch 18/0, B1 byte-identical (SCRATCH recipe — see SKILLS), arena smoke in-gate,
check-versions agrees. Session ritual: read the journal + context + learnings FIRST.

### Step 0 — the §12 contract canary — SHIPPED 13 July 2026 (`test-bot-canary.js`, 37/0)
Cross-checks all THREE artifacts against each other, testing the real ones (not lookalikes):
PROTOCOL.md §12's documented prose, the CLIENT's own line-builders (AVR_DEFS.block/vote/
combat.line — extracted from the live source via regex + `new Function(...)` and actually
EXECUTED, since they're pure functions of (a,b)), and the bot's real `L12` regex object
(already exported from elysium-bot.js — no bot changes were needed). The two bleed lines
aren't isolable pure functions (cardRefCap/targetSuffix touch DOM state), so those are
guarded by asserting the load-bearing literal fragments (`' bleeds for '`, `' adds +'`, etc.)
still exist verbatim in the client source, plus a regex-acceptance check against a sample
built from PROTOCOL's documented shape. Proven to actually BITE (not a rubber stamp): a
one-off destructive test mutated an in-memory copy of the client ("succeeds" → "wins",
"bleeds for" → "bleeds at") and confirmed the bot regex correctly REJECTS the drifted
wording and the fragment check correctly reports it missing — before trusting a 37/0 green
run, the failure path was exercised first. No server, no network, sub-second; runs in the
gate battery right after the bot regression suite (see CLAUDE.md / SKILLS.md).

### The data diet M2 inherits (verified against the shipped cardfx)
fx tag vocabulary (lib modes): stealth 735, bleed 196, intercept 180, maneuver 178,
press 173, aggr 166, unlock 115, combatEnds 87, strike 83 (WITH damage numbers),
prevent 82, bleedAct 78, dodge 56, votes 58, bloodAdd 58, torpor 50, addStrike 50,
reduce 42, poolGain 42, poolDmg 41, stealBlood 27, bloodBurn 17, bounce 9 (Deflection
carries dual dom/DOM modes), wake 6, bloodToPool 2, handSize 1. Entries carry
`t:["react"|...]`, `cost:{blood:N}`, `req:{disc:[...]}`, `unique`, `limited`.
Plus: the read-only tally mirror (block a=stealth b=intercept, combat ph 0–6 + rd, duel
map server-merged per seat), the frozen §12 lines, the pending machine (target-side arm →
'Hold on…' → Pass — M2 replaces the auto-Pass with a DECISION), the per-action `played`
ledger (extend to the reaction side), `_toAsh`, fxClone, the Reaction timer (decide).

### A. Informed block-as-target
Read announced stealth (frozen line total + live tally.a). Compute OWN intercept potential:
hand cards with fx.intercept usable by an UNLOCKED ready vampire (respect req.disc via the
existing `_modeUsableBy`; a LOCKED reactor first needs fx.wake — see B) + own board
permanents whose fx carry intercept. Decision inputs: persona.blockShy, bleed size, own pool
pressure, intercept-vs-stealth odds. On BLOCK: say 'Block!' (the client's resolver-open
speaks the same phrase — symmetric), WRITE tally.b to the committed intercept (sandbox
counters are any-seat, last-write-wins — the bot may write for its OWN commitments only),
then follow the verdict exactly as the actor side already does: succeeds → combat with the
bot as BLOCKER (see C); fails → the window continues (more intercept? the once-per-name
ledger applies) → eventually Pass.

### B. Reaction plays (the pending window grows teeth)
- **Intercept cards**: splice + `plays <b>NAME</b>: +N intercept.` log + fxClone + draw-back
  + tally.b += N. Pay `cost.blood` from the reacting vampire (the cost field is live data).
- **Wake**: a locked would-be reactor plays fx.wake first (On the Qui Vive is cost-free,
  at:null) — log + fxClone; the vampire may then block/react while staying locked (rulebook).
- **Deflection (bounce)**: requires dom + 1 blood. Play: log
  `plays <b>Deflection</b>: the bleed bounces to <new prey>.`, clear the pending WITHOUT
  applying (note in chat), pay the blood. Sandbox flow: the new target referees their own
  pool; the actor still owns 'It resolves'. Optionally aim own pub.target at the victim's
  pool (the v2.6.21 'pool' sentinel) for table clarity. KEEP SIMPLE v1 — no chain-bounces.
- Same-named REACTION once per ACTION: wire the existing ledger into this path (spec §2's
  rules table row flips from "arrives with M2" to ENFORCED).

### C. Combat module v1 (cardfx-driven — the data is already there)
Trigger: a block SUCCEEDS with the bot on either side. The bot ANNOUNCES its combatant via
the duel protocol (tally duelCid/duelName — server-merges per seat) and plays combat from
data: strike choice (hand/inherent fx.strike N, default hands 1), maneuver if it prefers
range, dodge/prevent defensively (persona-weighted), damage applied to OWN blood (torpor at
0 → zone move + log), respect press (one per round — the limited tag helps) and combatEnds.
v1 CUT LINE: the bot announces choices via chat + §12-friendly lines and applies ITS OWN
side; it does NOT step the shared ph/rd counters (humans/the table drive the stepper) and
plays at most the rounds a press grants. Environment/S:CE chains: out of scope.

### D. Riders
Vote politeness: the ~6-line abstain (backlog) rides along. New frozen line formats
introduced by B/C MUST be added to PROTOCOL §12 in the same delivery (the canary then
guards them). Arena impact: blockShy finally matters — expect longer matches (tune
startPool in demos), and rerun a volume arena (--matches 20+) to re-baseline personas.

### Test plan (suite section 14 sketch)
Scripted room, host announces frozen bleed lines with known stealth at the bot: assert
(1) block/no decision vs blockShy + odds; (2) 'Block!' say + tally.b write; (3) intercept
play line + blood cost + ledger blocks a same-name repeat; (4) wake-then-block for a locked
reactor; (5) Deflection line + pending cleared unapplied + blood paid; (6) verdict-succeeds
→ duel announce + a combat line + damage on the bot's side; (7) the canary passes.

### Open questions for Johan (ask before/while building)
1. Should the bot ever STEP the shared combat phase counters, or announce-only (v1 = announce-only)?
2. Bounce etiquette: aim the pool-sentinel at the new victim, or log-only?
3. Post-M2 persona defaults: how block-happy should novice/grinder/shark feel at a human table?

## 7.6 v0.5 — MASTERS, HUNT, POOL ECONOMY — SHIPPED 13 July 2026 (bot v0.4.6 → v0.5.0, gate 119/0 ×3)

Implemented same-session as designed below (kept for the design rationale + what v1
deliberately cuts). **Three decisions made by Johan during the build (not guessed),
each reshaping scope beyond the original draft:**

- **Passive income timing: PHASE-EXACT, not the v1 single-fixed-point simplification.**
  Johan chose the harder path. This meant the timing itself had to become DATA, not bot
  code: a new `phase` field on the mode (`{at:null, fx:{bloodToPool:1}, phase:'master'}`
  for Blood Doll, `phase:'unlock'` for Vessel) lives in `cardfx-curated.json` — verified
  that `cardfx-compile.js`'s curated overlay is a whole-entry `Object.assign` passthrough
  (no compiler change needed for a new field to survive a real recompile) before touching
  anything. `elysium-cardfx.json` (the compiled artifact the bot actually loads) was
  hand-mirrored with the identical fields, since this environment has no `vtes.json` to
  re-run the real compiler — **`test-cardfx.js` could not be run here for that reason;
  Johan should run it once locally to confirm the real recompile agrees** (it should:
  the overlay mechanism guarantees it). `elysium-bot.js`'s `_applyPhaseIncome(phaseKey)`
  reads the field generically — no per-card-name branching, any future income asset only
  needs tagging in the library. **Dreams of the Sphinx deliberately did NOT get a `phase`
  tag**: its one mode carries three fx keys (handSize/poolGain/bloodAdd) that plausibly
  want different phase/choice semantics (a per-turn lock decision, not an automatic
  trigger) — flagged in its own curated-JSON note for a future pass, not silently dropped.
- **Voluntary hunting: persona-weighted, not strictly rulebook-mandatory-only.**
  `decide('hunt-or-bleed')` reuses the `block-as-target` scoring convention (a `score >= 1`
  threshold): `(urgency × 1.5) ÷ persona.aggression`, where `urgency` is a vampire's missing
  blood as a fraction of capacity. No new persona knob — aggression already captures the
  right axis (pushing damage now vs. topping up first), inversely: novice (0.8) volunteers
  around 53% empty, grinder (1.0) around 67%, shark (1.2) around 80% — a genuine gradient,
  not a single on/off rule. Mandatory hunt (0 blood) never reaches this case; the turn
  loop reorders 0-blood ready vampires to the FRONT of the acting list so the mandatory
  hunt always resolves before any other vampire's bleed that phase, matching the rulebook's
  "must be announced and resolved before any other actions may be taken."
- **Hunt-blocking (the bot proactively blocking a prey's/predator's hunt): PARKED, not
  built.** Johan's call, made explicit during design: the general CAPABILITY (can this
  seat legally block THIS hunt — reusing the existing `_bestInterceptFor`) belongs in the
  bot's shared logic whenever it's eventually built, but whether a PERSONA actually spends
  a card on it is policy, same split as `blockShy` already is for bleeds. The shipped
  "weenie bleed" persona wouldn't want this anyway (low value, more plumbing than payoff —
  the spec's own assessment below, unchanged). Documented here so it isn't mistaken for an
  oversight next session; nothing was built toward it.

**What shipped, concretely (all four original modules, A–D, plus three items that
surfaced organically while discussing scope with Johan):**

- **A — Master-phase play.** The Master phase (previously a bare comment, v0.1 forever)
  now has real content: `_bestMasterFor()` finds affordable, phase-tagged income assets in
  hand; `decide('master-play')` picks — not persona-weighted (more income is good for every
  persona alike) but ORDER matters: a trifle (Vessel) played first earns the bonus
  master-phase action a rulebook trifle grants, letting a second asset (Blood Doll) join
  the SAME phase instead of waiting a turn. `_hostVampFor()` picks any controlled vampire
  (prefers ready, falls back to torpor) to attach the permanent to via the existing
  `host`/`attached` convention the CLIENT already uses for equipment — which meant
  `buildPub()` needed two new relayed fields (`host`, `attached`) or the card would render
  as a stray unattached card on every OTHER player's board; the bot's own board never
  carried them before because nothing was ever attached to anything.
- **B — Hunt.** Mandatory at 0 blood (source-verified rulebook: undirected, +1 stealth,
  "vampires with no blood are forced to hunt"); voluntary per the persona formula above.
  Hunt reuses the EXACT announce→`_askBlock`→resolve shape Bleed already has (a human's
  prey or predator can still block it — undirected actions per the rulebook are blockable
  by prey or predator specifically, source-verified against vekn.net) — on success, +1
  blood capped at capacity, not pool damage. No new wire verb: Hunt was already just the
  client's generic `act('hunts.','hunts')` log line, not a §12 frozen format, so this is
  bot-file + cardfx work only, same as everything else this session.
- **C — Phase-exact passive income.** `_applyPhaseIncome(phaseKey)`, called from both
  `_unlockPhase()` and the new Master block, applies `bloodToPool`/`poolGain` fx on
  in-play permanents whose cardfx `phase` matches. `bloodToPool` is a TRANSFER (vampire
  blood → pool), guarded on the host actually having blood — never manufactures pool from
  nothing. `bloodAdd` is read by nothing yet (needs uncontrolled-vampire blood tracking
  this bot doesn't have) — consistent with Dreams of the Sphinx staying untagged.
- **D — Discard flip, plus a Johan-requested widening.** Masters are no longer
  automatically dead weight (the old `t.includes('master')` unconditional check is gone) —
  judged by the same general "does any mode work" test as everything else, extracted into
  `_deadHandIndex(vamps)` for direct testability (mirrors `_unlockPhase`'s own v0.4.6
  extraction). Separately, Johan noticed live that a Bounce-class card (Deflection, Bait
  and Switch) is functionally dead in a 2-live-player table — no legal destination ever
  exists once predator and prey collapse onto the same seat. Rather than a parallel
  special-case in discard, `_modeUsableBy` itself was widened: a bounce-tagged mode is
  unusable when `predSeat() === preySeat()` (a new small helper, named symmetrically with
  the existing `preySeat()` — was always inlined as `prevLive(this.seat)` before). This is
  the table-structural generalization of the exact per-actor check M2's `_reactWindow`
  already does for `bounceLegal`; every caller of `_modeUsable` gets it for free.
- **E/F — Phase-bar + Pass parity (Johan's ask, discovered mid-session):** clicking a
  human's Structured phase-bar button is nothing but `log('Phase: <b>X</b>.')` with no
  `localOnly` flag (confirmed in the client source — `activatePhase()` → `log()` →
  `mpRelay()`) — so the bot now sends the identical line at all five phase transitions via
  a new `_announcePhase(name)`, gated on `caps.tally` (the same signal that already flips
  the bot into informed mode — it correlates with exactly the "tournament off" condition
  that makes a phase bar exist for a human at all). Pass gained the matching
  `log('<b>Turn passed.</b>')` line too — UNCONDITIONALLY, since a human's own Pass isn't
  itself gated behind helpers being on, unlike the five phase buttons.
- **G — The Edge cash-in (Johan's follow-up question, turned out to be a REAL gap, not
  cosmetic):** source-verified against vekn.net — holding the Edge lets you take 1 pool at
  your own unlock phase, optional and use-it-or-lose-it for a human. The bot tracked WHO
  holds the Edge perfectly (gain/loss) since M2, but never once cashed it in — free pool
  left on the table every game. Johan's ruling: bots ALWAYS take it (no persona gate,
  unlike a human who has to remember). Fixed in `_unlockPhase()`, three lines, exact
  client wording (`'Gained <b>1 pool</b> from the Edge.'`) for parity.

**A real bug found and fixed DURING testing, not before:** the master-play loop's
`_drawOwed` increment (a card left the hand, a replacement is owed) relied on a shared
drain that lived at the tail of the minion loop's BLEED branch. Hunt's `continue` skipped
straight past it — a master-phase draw could sit silently un-flushed for an entire turn
if every acting vampire happened to hunt instead of bleed that phase. Caught by the LIVE
integration test (19j/20), not by inspection. Fixed by extracting `_flushDraws()` and
calling it from all three places that can leave a draw owed (master-play, hunt, bleed) —
same "audit every sibling code path once a bug class turns up" instinct as `_openSlot`.

**Test plan, as shipped:** 29 new offline units (Edge cash-in, phase-exact income both
directions, the transfer-not-a-gift guard, master-play affordability/exclusion/phase-tag
requirement, host selection, trifle-first ordering, the hunt persona gradient, the
bounce/2p widening both ways, the discard flip, `buildPub`'s new fields) + one live
integration test exercising a full real bot turn end-to-end (all five phase announcements,
Pass, the mandatory hunt succeeding unopposed, master-play attaching correctly, the
`_flushDraws` fix confirmed). Bot suite: 80/0 → **119/0** (3× stable). Canary 37/0,
client-logic 29/0, dispatch 18/0, protocol-lint 6/0, check-versions agrees. `test-cardfx.js`
NOT run at first pass (no `vtes.json` in this environment) — the `phase`-field addition was
verified safe by reading `cardfx-compile.js`'s overlay mechanism directly instead. **Same-day
follow-up:** Johan attached `vtes.json` (KRCG v3 format); ran the real compiler and the gate
for real — **46/0, drift check clean**, `elysium-cardfx.json` now a genuine fresh compile
(replacing the earlier hand-mirrored file — identical content, byte-different formatting).
Confirms the hand-mirror was correct in substance, as expected.

**Open questions from the design, now answered by what shipped:** (1) the v1 income-timing
simplification was NOT accepted — phase-exact shipped instead, as a cardfx schema field;
(2) voluntary hunting IS persona-weighted, reusing `aggression` rather than a new knob;
(3) hunt-blocking is parked with a documented future shape (capability + persona gate),
not built and not silently skipped either.

---

## 7.6-FOLLOWUP — 14 July 2026 (bot v0.5.0 → v0.5.1, gate 119/0 → 132/0 ×3)

Johan brought a real playbook — "Leveraging my Hacking Skills," a simplified Weenie
Computer Hacking archetype (12 crypt cap 1–2, 62 library: 20× Computer Hacking, 9×
Leverage, 4× Deflection, 3× Wake with Evening's Freshness, 10× Dodge, 16 masters across
Ashur Tablets/Effective Management/Information Highway/The Parthenon) — and asked for an
analysis. Verifying every card's REAL text against `vtes.json` (not the auto-fx summary
alone) turned up real gaps the auto tier's surface tags had hidden or mis-implied:
Leverage burns the Edge for +1 bleed (no discipline — the crypt's heavy Dominate presence
is for Deflection defense, not for boosting bleeds); Ashur Tablets is a THRESHOLD/one-shot
(if YOU control 3 copies → remove ALL copies in play, even other Methuselahs', burn for +3 pool + ash-heap recursion — the trigger is your OWN copy count, not table-wide; verified against real card text 14 July, corrected from the earlier looser "across ANY" reading), not
recurring income; Effective Management moves the top crypt card to uncontrolled (zero fx
today); Information Highway grants +2 transfers; The Parthenon lets you lock it for +1
Master action; and the bot's combat module reads `fx.prevent` only — `fx.dodge` (this
deck's entire combat suite) is completely unhandled. **Correction from Johan, mid-review:**
the Edge's unlock-phase pool bonus is PASSIVE (holding it a full round just also grants +1
pool from the blood bank) — it is NOT an exchange, and does not consume the Edge; burning
it is a SEPARATE active choice (Leverage's bleed-boost, or a base action for +1 Vote). The
shipped code already got this right (`_unlockPhase` never touches `this.edge`) — only the
prose describing it ("cash in") was imprecise, since corrected in-code and in this doc; the
"tension with Leverage" flagged in the original analysis was accordingly WITHDRAWN — both
can be had the same game, since the pool bonus never spends the Edge.

**Design conversation → three decisions, then built the same session:**
1. **"Always play A master if you hold one"** (Johan) — the base rule, independent of
   whether the bot recognizes the specific card's effect. The library defines WHAT a card
   does; the persona/decide() picks WHICH one when there's a choice; an UNCURATED master
   still gets played (cost paid, placed as its own standalone permanent, no host — we don't
   know if it wants one) rather than held uselessly, on the same "a human corrects it" logic
   as the bot-elements exception already established for ctrl adjustments.
2. **Generalized phase-action economy** (Johan, cross-checked against the client's own
   `state.phaseActs`/`phaseUsed`/`masterBonus`, verified by reading `adjustPhaseAct`/
   `phaseActKey`/`resetPhaseAct` directly rather than assumed): `this.phaseActs` (permanent
   baseline, rebuilt each own turn by `_recomputePhaseActs()` from any in-play card with a
   NEW `actGrant{persist:'inplay'}`) + `this.phaseBonus` (temporary, reset each own turn) +
   `this.phaseUsed` (consumed so far this turn) → `_phaseAvail(k) = max(0, acts+bonus-used)`,
   now shared by Master/Influence/Discard alike (Influence's hardcoded `4` and Discard's
   single-check both became phase-generic loops). Kept INLINE in the bot, not extracted to a
   file the client could also import — Johan's call: the arithmetic is tiny enough that
   duplication isn't a real maintenance burden, and literal sharing would only start to
   matter once cardfx is fully indexed AND the client grows its own auto-interpreting
   Helpers ("long into the future, if ever").
3. **Trifle vs. bespoke bonus sources are independent, not competing** (Johan): Trifle is a
   UNIVERSAL keyword rule, capped at +1/turn no matter how many trifles are played
   (`_grantTrifleBonus()`, its own turn-scoped flag) — a bespoke card (Parthenon)
   contributes via the `actGrant` schema field instead, adding to the SAME
   `phaseBonus.master` pool from a genuinely different source, uncapped by Trifle's own
   limit. **All four Masters are now SHIPPED (14 July 2026, bot v0.5.3→v0.5.7):** The
   Parthenon (`actGrant{persist:'turn'}` + `decide('lock-actgrant')`), Information Highway
   (`actGrant{persist:'inplay'}`), Effective Management (`handler:'effective-management'`
   sends `drawCrypt`), Ashur Tablets (`handler:'ashur-tablets'` — own-copy threshold +
   scored retrieval + `pileBulk` + table-wide collateral watch via burned-count diff).
   Full detail in `cardfx-persistent-lock-design-decisions.md` (§7–§13).

**Shipped:** `_bestMasterFor` now returns EVERY affordable master in hand (tagged
`known`/`persistent`/`curated`/`handler`, not just recognized income assets);
`decide('master-play')` prefers a trifle+known-plain combo, then any known asset, then —
the fallback — whatever master is cheapest, with messaging gated on `curated` (not
`known`) so a hand-verified Location doesn't wrongly say "uncurated". The master play loop
branches on `persistent` (a non-persistent card ashes via `_toAsh` instead of parking on
the board forever — the Effective Management bug). `_phaseAvail`/`_recomputePhaseActs`/
`_grantTrifleBonus` (all directly unit-tested) generalize the phase-action economy across
Master/Influence/Discard. `_considerTurnActGrants(phaseKey)` reads `persist:'turn'`
(Parthenon), `_recomputePhaseActs` reads `persist:'inplay'` (Information Highway) — both
wired, both exercised by real curated cards. `CARD_HANDLERS` dispatches bespoke one-off
effects after card resolution (`'effective-management'` + `'ashur-tablets'`).
`_checkAshurTableWide()` (run once per own turn) tracks each seat's `'burned'` Ashur
Tablets count for cross-table collateral removal (no new wire verb). `_commitBounce` now
sends a spec-correct L12.bleed re-announce with Target suffix + owner-vs-sender separation.
Client/server untouched throughout.

**Same-day continuation (bot v0.5.1 → v0.5.2, gate 132/0 → 135/0):** Johan confirmed the
phaseActs plan and gave two more instructions. (1) "Every action treated fundamentally the
same" — hunt never set `this._actingVamp`, the field `_onBlockAttempt` reads to find a
usable stealth card, so its OWN Block? could never reach the reactive-stealth mechanism
bleed already has. Fixed with identical wiring, plus a new `stakes` weight in
`decide('spend-stealth')`: a bleed's stakes scale with its amount (2 = today's unchanged
baseline), hunt's fixed 1-blood prize is discounted (weight 0.5) — the mechanism is now
universal, willingness is stakes-weighted per persona. (2) `DEFAULT_DECK` replaced with
Johan's real "Leveraging my Hacking Skills" (12 crypt/62 library, every name verified
against cardfx). This surfaced a genuine test fragility: sections 1-9 (the foundational
connection/turn/bleed/combat/discard flow) had silently ridden `DEFAULT_DECK` instead of
their own explicit deck — including a discard-phase assertion needing a crypt with no
Obfuscate access, true of the old sample but not of the new real playbook (whose library
carries no Obfuscate-gated cards at all), making the assertion flaky. Fixed by pinning that
whole flow to an explicit deck identical to the OLD default, the same discipline every
other test in the suite already followed.

---

## 7.6-DESIGN — the original work order (kept for rationale; see the SHIPPED summary above)

Not started. Drafted 13 July 2026 as a genuine work order (entry state, verified data
inventory, design outline, test plan, open questions) — mirroring how §7.5 prepared M2 —
so the next session can implement rather than architect. This is the fix for the
long-game-arc problem (backlog): the bot's curve only points down without it, fading by
turn 8–10 as masters get discarded unplayed and the hand ratchets toward dead weight.

### Entry state (13 July 2026)
client v2.6.32 / server v2.6.15 (pristine) / bot v0.4.3 / cardfx v1.3.0 / canary v1.0.0.
Gates: bot 65/0 ×3, canary 37/0, cardfx 46/0, client-logic 29/0, dispatch 18, protocol-lint
6, check-versions agrees, smoke green. Session ritual: read journal + context + learnings
FIRST.

### The data diet v0.5 inherits (verified against the shipped cardfx, not assumed)
fx tags: `poolGain` 42, `bloodAdd` 58, `bloodBurn` 17, `poolDmg` 41, `bloodToPool` 2,
`handSize` 1 modes. Card counts: 525 `t:['master']` entries, 119 allies, 54 retainers,
**164 `t:['equip']`** (CORRECTION 13 July: an earlier pass here checked the wrong string,
`'equipment'` — the actual normalized tag is `'equip'`, per `elysium-cardfx-design.md` §4's
own type list; caught only because Johan asked whether these notes were properly captured,
prompting a re-check against the design doc instead of trusting the first grep).

**The hand-curated tier already has a small, deliberate head start** (`cardfx-curated.json`,
4 entries, all source-verified against `card_text`): `Blood Doll` (`bloodToPool:1`, fires
in the controller's OWN MASTER PHASE per its `note`); `Vessel` (`cost.pool:1`,
**`trifle:true`** — the only trifle-tagged entry in the library today — `bloodToPool:1`,
fires in the controller's OWN UNLOCK/UNTAP PHASE, a full phase later than Blood Doll,
per its `note`); `Dreams of the Sphinx` (unique, a 3-way single-mode choice:
`handSize:2` / `poolGain:1` / `bloodAdd:1`); `Inside Dirt` (**directed, non-bleed pool
damage** via `costEdge` — the canonical "block-eligibility isn't just about bleeds"
example, ties directly to the `dir` per-mode work from 13 July). **The bot reads NONE of
`trifle`/`note`/`costEdge` yet** (grep-confirmed) — data is ahead of behaviour here, same
shape as `blockShy` before M2.

**The bot currently has ZERO hunt-action code** (grep-confirmed: no `hunt` reference
anywhere in `elysium-bot.js`). **The discard-phase currently discards masters
unconditionally** (they were dead weight pre-v0.5) — this needs to flip once master-play
ships, or the bot will keep binning cards it could now use.

### A. Master-phase play — one per turn (source-verified: vekn.net rulebook + community
   turn-sequence guides agree: "usually you will only be allowed to play one Master card
   per turn")
Trifles (Vessel-class) grant ONE bonus master-phase action when successfully played —
capped at one bonus MPA per master phase from trifles specifically (a second trifle that
turn acts like a regular master, per rulebook). **v1 cut line**: model the simple case
(1 regular master play per turn, +1 more if a trifle was played) — chained/cancelled-trifle
edge cases (Wash, Sudden Reversal interactions) are out of scope. New `decide()` case
(e.g. `'master-play'`): prioritize `poolGain`/`bloodAdd`/`bloodToPool` assets first (the
actual long-game-arc remedy) over other master types — richer prioritization (locations,
equipment, retainers, vote-support masters) is a later refinement, not v1.

### B. Hunt action (source-verified: vekn.net rulebook)
Undirected, default +1 stealth, gives the acting vampire 1 blood on success. **Mandatory**
for a ready unlocked vampire with 0 blood — "none of your minions can perform any
non-mandatory actions if any of your ready unlocked vampires have hunt actions yet to
perform." The bot has NO enforcement of this today (a 0-blood vampire currently just... does
whatever the existing turn logic already does, incorrectly). New `decide()` case (or a
turn-loop precondition) to: (i) correctly enforce the mandatory-hunt-at-0-blood rule before
any other minion-phase action; (ii) **open question** — should the bot also voluntarily
hunt healthy vampires to build blood reserves against M2 combat (persona-weighted:
aggression vs. self-preservation), or stay strictly rulebook-mandatory-only for v1?
Since hunt is undirected, it CAN be blocked by the actor's OWN prey/predator — the first
real consumer of the `dir` tag's *absence* driving actual block-eligibility logic (flagged
as parked, 13 July). Likely low strategic value to model blocking a hunt in v1 — recommend
deferring, but flag it as a genuine open question rather than silently skip it.

### C. Passive income timing — the genuinely knotty bit
Blood Doll fires in the controller's OWN MASTER PHASE; Vessel fires in the controller's OWN
UNLOCK/UNTAP PHASE — a full-phase-later, source-confirmed timing difference the data only
carries today as a human-readable `note`, not a structured field. **Recommended v1
simplification (explicit, not silent, mirroring how M2's combat documented its own cuts):**
apply ALL `poolGain`/`bloodAdd`/`bloodToPool` triggers from in-play master assets at ONE
fixed point in the bot's own turn (unlock phase — the turn loop already visits it), accepting
that this doesn't replicate Blood-Doll-fires-one-phase-earlier fidelity exactly. A later
refinement could add a structured `phase:'master'|'unlock'` field to the curated tier and
thread it through decide()/turn-loop timing — not required for v0.5's first cut.

### D. Discard-phase flip
Once master-play ships, stop discarding playable masters in the existing discard-phase
logic — small, contained, adjacent to the rest of this pass.

### Test plan sketch (mirrors §7.5's own pattern: real network + direct hand/board mutation
   for determinism, since the server shuffles decks)
Offline units: master-play threshold math; the mandatory-hunt-at-0-blood check. Live
scripted room: a bot holding Blood Doll/Vessel across several turns — assert income lands
at the chosen phase and only once per the relevant window; a bot with a 0-blood vampire —
assert a mandatory hunt fires before any other minion-phase action; assert the discard
phase no longer bins a master once master-play is live.

### Open questions for Johan (ask before/while building)
1. Is the v1 income-timing simplification (one fixed point, not the true master/unlock
   split) acceptable to ship first, or is phase-accurate timing a hard requirement?
2. Voluntary persona-weighted hunting (topping up blood pre-emptively) vs. strictly
   rulebook-mandatory-only hunting for v1?
3. Worth modeling the bot blocking a prey's/predator's hunt action at all, or defer
   indefinitely (low strategic value, more plumbing than payoff)?

---

## 8. Gotchas a fresh session MUST know (beyond the learnings doc)

**Freshest four (12 July, this session):** (a) the outbound pacer is a TOKEN BUCKET
(burst 8, refill 150 ms) — never reintroduce a rolling-window cap, it stalls critical says;
(b) the suite/smoke/arena spawn a COPY of the server inside their tmp dir (the store is
__dirname-anchored — running the original once hit MAX_ROOMS and bricked every create);
(c) B1 builds to a SCRATCH file and cmp:s (SKILLS has the recipe — a stale fragment dir once
produced a byte-identical FALSE PASS); (d) before adding ANY handler or "new" mechanism,
grep the server's handler table and the client's UI strings (title=/label) — `forceSetPool`
and the Reaction timer (`decide`) both already existed and were nearly duplicated.


- **Session ritual first**: journal + context + learnings, VERSION grep, patch-chain from
  the newest delivered output, gates in a separate command, atomic Python patches with
  `assert count==1`.
- The **seven-entry verb chain** for any wire change (client, server, both suites,
  check-versions' hard-coded counts, PROTOCOL index+tables, PROTOCOL heading counts).
- **Unknown-verb tolerance** both ways: old clients ignore unknown `t`; the server drops
  unknown verbs — the bot must do the same (it does).
- `pkill` self-match: always `pkill -f "[e]lysium-server"` (bracket trick).
- Bot suite waits: `waitFor` is cursor-based and can consume out-of-order pushes — use
  `waitAny` where ordering isn't guaranteed.
- Card ids are per-client sequential — seat-scope every cross-seat cid.
- `//` comments in replacement strings eat one-line-function tails — use `/* */` mid-line;
  after any client patch, extract the `<script>` body and `node --check` it.
